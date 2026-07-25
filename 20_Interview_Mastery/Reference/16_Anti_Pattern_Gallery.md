# 16. Anti-Pattern Gallery — Wrong Code and Why It Fails

**Navigation**: [← Quick Reference Cards](15_Quick_Reference_Cards.md) | [📚 Index](../00_INDEX.md) | [Incident Lessons →](17_Production_Incident_Lessons.md)

> **Reading contract**: For each anti-pattern, first read the WRONG code without looking at the explanation. Think about what's wrong. Then read the explanation and the FIX. This is the most efficient way to build pattern recognition.

---

## Anti-Pattern 1: Thread.sleep in Tests — SDET

### ❌ The Wrong Code

```javascript
// Looks reasonable — "just wait for the API to update"
test("order status becomes PROCESSED", async () => {
  await submitOrder(orderId);

  // Give the backend time to process...
  await page.waitForTimeout(5000); // 5 seconds feels safe, right?

  const status = await getOrderStatus(orderId);
  expect(status).toBe("PROCESSED");
});
```

### 💥 What Goes Wrong

- **Too slow**: Every invocation waits the full 5 seconds regardless of how fast the backend actually responds. A test suite with 50 such tests wastes 250 seconds minimum.
- **Environment-dependent**: On a fast dev machine the service responds in 300ms; in CI under load it may need 8 seconds. The hardcoded 5s is simultaneously too slow locally and too fast in CI.
- **Zero failure information**: When the status is NOT `PROCESSED`, you get `expected 'PENDING' to be 'PROCESSED'` with no indication of whether the system was still processing, crashed, or returned an error.

### 🔍 The Symptom You See

```
Test passed in dev: ✅ (took 5.3s)
Test failed in CI:  ❌ Timeout exceeded (took 5.0s — still PENDING)

Or the reverse:
Test passed in CI:  ✅ (took 5.0s — status changed in 200ms, wasted 4.8s)
Developer complaint: "Why does the CI run take 45 minutes?"
```

### ✅ The Correct Code

```javascript
test("order status becomes PROCESSED", async () => {
  await submitOrder(orderId);

  // Poll with tight intervals; stop as soon as condition is met
  await expect
    .poll(
      async () => {
        const status = await getOrderStatus(orderId);
        return status;
      },
      {
        intervals: [200, 500, 1000, 2000], // escalating back-off
        timeout: 10_000, // hard ceiling — fail fast with real info
        message: `Order ${orderId} never reached PROCESSED status`,
      },
    )
    .toBe("PROCESSED");
});
```

### 🧠 The Rule

**Never hardcode time — poll the condition with a timeout, so the test is fast when things go right and informative when they go wrong.**

---

## Anti-Pattern 2: Over-Mocking the Repository — SDET + Spring Boot

### ❌ The Wrong Code

```java
// Looks thorough — full Spring context, service tested "end to end"
@SpringBootTest
class OrderServiceTest {

    @MockBean                          // replaces the real JPA repo with a mock
    private OrderRepository orderRepo;

    @Autowired
    private OrderService orderService; // the thing we actually want to test

    @Test
    void findActiveOrders_returnsOnlyActive() {
        // Set up mock — notice we define the result ourselves
        given(orderRepo.findByStatus(Status.ACTIVE))
            .willReturn(List.of(new Order(1L, Status.ACTIVE)));

        List<Order> result = orderService.findActiveOrders();

        assertThat(result).hasSize(1);
        // TEST PASSES — but the JPQL query in the repo was never run
    }
}
```

### 💥 What Goes Wrong

- **You are testing the mock, not the code**: The mock always returns whatever you told it to. If the JPQL in `findByStatus` has a typo, a wrong column name, or returns CANCELLED instead of ACTIVE, this test never catches it.
- **The service becomes a trivial passthrough**: If `orderService.findActiveOrders()` just calls `orderRepo.findByStatus(Status.ACTIVE)`, you are asserting that calling a mock returns what you put into the mock. That is tautologically true.
- **Confidence is false**: The green test makes developers trust the feature. The real query is exercised for the first time in production.

### 🔍 The Symptom You See

```
All tests: GREEN ✅
Production alert (3 hours after deploy):
  "Active orders page shows completed orders."

Root cause: findByStatus had WHERE status = 'active' (lowercase);
            DB column uses 'ACTIVE' (uppercase, case-sensitive collation).
            The mock never hit the DB — the mismatch was invisible.
```

### ✅ The Correct Code

```java
// For repository logic: use @DataJpaTest with a real (in-memory) DB
@DataJpaTest                           // loads only JPA slice — fast, no full context
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers                        // real Postgres, same collation as production
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepo;

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:15-alpine");

    @Test
    void findByStatus_returnsOnlyMatchingStatus() {
        // Arrange — real insert into real DB
        orderRepo.saveAll(List.of(
            new Order(null, Status.ACTIVE),
            new Order(null, Status.CANCELLED)
        ));

        // Act — real JPQL executes against real Postgres
        List<Order> active = orderRepo.findByStatus(Status.ACTIVE);

        // Assert — case-sensitivity, collation, index — all exercised
        assertThat(active).hasSize(1);
        assertThat(active.get(0).getStatus()).isEqualTo(Status.ACTIVE);
    }
}
```

### 🧠 The Rule

**Mock the boundary (HTTP clients, external APIs), never the data layer — use a real DB slice test so your JPQL is actually executed.**

---

## Anti-Pattern 3: Fixed-Window Rate Limiter — DSA + Spring Boot

### ❌ The Wrong Code

```java
// Looks correct — limits to 10 requests per second
@Component
public class FixedWindowRateLimiter {

    private final AtomicInteger counter = new AtomicInteger(0);
    private volatile long windowStart = System.currentTimeMillis();

    public boolean allow() {
        long now = System.currentTimeMillis();

        // Reset counter at start of new 1-second window
        if (now - windowStart >= 1000) {
            counter.set(0);
            windowStart = now;  // ← the boundary vulnerability lives here
        }

        if (counter.get() >= 10) {
            return false;       // reject
        }

        counter.incrementAndGet();
        return true;            // allow
    }
}
```

### 💥 What Goes Wrong

- **Boundary attack**: At `t=999ms` (last ms of window 1) a client sends 10 requests — all allowed. At `t=1001ms` (first ms of window 2) the counter resets and the client sends 10 more — all allowed. **20 requests passed through a 2ms window** against a limit of 10/second.
- **Race condition in reset**: The `if` check and `windowStart = now` are not atomic. Two threads can both see `now - windowStart >= 1000` simultaneously and both reset, losing count.
- **The math is wrong at the boundary**: The "per second" guarantee only holds in the middle of windows, not at edges — which is exactly where attackers aim.

### 🔍 The Symptom You See

```
Security audit finding:
  "Rate limiter bypassed: 200 requests in 50ms using boundary timing attack.
   Expected rejection after 10. Observed: no rejections until 11th request
   within a single window. Attacker can send 20x limit at window boundaries."

Production: API keys used for scraping; billing overruns; downstream service SLA breached.
```

### ✅ The Correct Code

```java
// Sliding window log with Redis ZSET — O(log N) per request
@Component
public class SlidingWindowRateLimiter {

    private final StringRedisTemplate redis;
    private static final int LIMIT = 10;
    private static final long WINDOW_MS = 1000L;

    public boolean allow(String clientId) {
        long now = System.currentTimeMillis();
        long windowStart = now - WINDOW_MS;
        String key = "rl:" + clientId;

        // Remove timestamps older than the sliding window
        redis.opsForZSet().removeRangeByScore(key, 0, windowStart);

        // Count requests still inside the window
        Long count = redis.opsForZSet().zCard(key);
        if (count != null && count >= LIMIT) {
            return false;   // reject — window is full
        }

        // Record this request with its timestamp as both score and member
        redis.opsForZSet().add(key, String.valueOf(now) + "-" + UUID.randomUUID(), now);
        redis.expire(key, Duration.ofSeconds(2)); // auto-clean idle keys
        return true;
    }
}
```

### 🧠 The Rule

**Fixed-window rate limiters allow 2× the limit at window boundaries — always use a sliding window (ZSET timestamps) for accurate rate enforcement.**

---

## Anti-Pattern 4: Eager Loading Everything — Spring Boot + DSA

### ❌ The Wrong Code

```java
// Looks safe — "I always need the related data anyway"
@Entity
public class Account {

    @Id
    private Long id;

    private String name;

    @OneToMany(fetch = FetchType.EAGER)   // loads ALL citations immediately
    private List<Citation> citations;

    @OneToMany(fetch = FetchType.EAGER)   // loads ALL comments immediately
    private List<Comment> comments;
}

// The query that triggers it:
Account account = accountRepo.findById(accountId).orElseThrow();
// You asked for 1 row. Hibernate fetched a Cartesian product.
```

### 💥 What Goes Wrong

- **Cartesian product explosion**: With 2 EAGER `@OneToMany` collections, Hibernate joins all three tables. An account with 50 citations and 50 comments per citation produces `1 × 50 × 50 = 2,500 rows` in the result set for a single account lookup.
- **Data you never use is always loaded**: Even the endpoint that returns only `account.name` pays the full cost of loading all citations and all comments.
- **OOM in production, not in tests**: Tests use 2–3 entities. Production has real data volumes. The Cartesian product becomes visible only when the data grows.

### 🔍 The Symptom You See

```
Dev environment: Account API responds in 12ms ✅
Production (6 months later):
  OutOfMemoryError: Java heap space
  at org.hibernate.loader.Loader.loadFromResultSet(...)

  Support ticket: "Account page loads for 30 seconds then crashes for large accounts."
  DB query count for ONE API call: 1 query, 2,500 rows returned.
  Memory per request: ~180MB for a single account.
```

### ✅ The Correct Code

```java
// Default to LAZY — load collections only when explicitly needed
@Entity
public class Account {

    @Id
    private Long id;

    private String name;

    @OneToMany(fetch = FetchType.LAZY)   // nothing loaded until accessed
    private List<Citation> citations;

    @OneToMany(fetch = FetchType.LAZY)   // nothing loaded until accessed
    private List<Comment> comments;
}

// Repository: fetch only what the specific use-case needs
public interface AccountRepository extends JpaRepository<Account, Long> {

    // For the "account detail" endpoint — fetch citations only, with JOIN FETCH
    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.citations WHERE a.id = :id")
    Optional<Account> findByIdWithCitations(@Param("id") Long id);

    // For the "account list" endpoint — only name needed, no collections
    @Query("SELECT new com.example.AccountSummary(a.id, a.name) FROM Account a")
    List<AccountSummary> findAllSummaries();
}
```

### 🧠 The Rule

**Always default to `FetchType.LAZY` and use `JOIN FETCH` or `@EntityGraph` only in the specific query that needs the data — never pay for data you might not use.**

---

## Anti-Pattern 5: Sharing Test State Across Tests — SDET

### ❌ The Wrong Code

```javascript
// Looks clean — userId defined once, reused everywhere
describe("User API", () => {
  const userId = "user-123"; // ← shared across ALL tests below

  test("create user", async () => {
    await createUser(userId, { name: "Alice" });
    // Passes: user-123 created ✅
  });

  test("update user name", async () => {
    await updateUser(userId, { name: "Alice Updated" });
    // Passes when run after 'create user' ✅
    // Fails when run alone: 404 Not Found ❌
  });

  test("delete user", async () => {
    await deleteUser(userId);
    // Now user-123 is gone — any test after this that uses userId will fail
  });

  test("get user after update", async () => {
    // Depends on 'update user name' running first AND 'delete user' NOT running first
    const user = await getUser(userId);
    expect(user.name).toBe("Alice Updated"); // 404 if delete ran first ❌
  });
});
```

### 💥 What Goes Wrong

- **Execution order dependency**: Tests pass only in a specific order. Jest and most frameworks do not guarantee order. Parallel CI runners actively randomize it.
- **State leaks across tests**: `deleteUser` in test 3 destroys the data that test 4 needs. The tests are secretly sequential steps masquerading as independent tests.
- **A new test anywhere can break existing tests**: Adding a 5th test that also deletes `user-123` causes test 4 to fail — in a different file, written by a different developer.

### 🔍 The Symptom You See

```
Local run (sequential): ALL PASS ✅
CI run (parallel workers): 2 FAIL ❌
  - "get user after update": 404 Not Found
  - "update user name": 404 Not Found

After investigation:
  Worker 2 ran 'delete user' before Worker 1 ran 'update user name'.
  The test suite had an implicit execution-order contract that held locally
  but broke under parallelism.
```

### ✅ The Correct Code

```javascript
describe("User API", () => {
  // Each test owns its own unique user — no sharing
  let userId;

  beforeEach(async () => {
    // Generate a unique ID per test — collision-proof across parallel workers
    userId = `TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await createUser(userId, { name: "Alice" });
  });

  afterEach(async () => {
    // Clean up only this test's user — doesn't affect anyone else
    await deleteUser(userId).catch(() => {
      /* already deleted — fine */
    });
  });

  test("create user succeeds", async () => {
    const user = await getUser(userId);
    expect(user.name).toBe("Alice");
  });

  test("update user name", async () => {
    await updateUser(userId, { name: "Alice Updated" });
    const user = await getUser(userId);
    expect(user.name).toBe("Alice Updated");
  });

  test("delete user", async () => {
    await deleteUser(userId);
    await expect(getUser(userId)).rejects.toMatchObject({ status: 404 });
  });
});
```

### 🧠 The Rule

**Every test must own its data — generate unique IDs in `beforeEach` and clean up in `afterEach` so tests are order-independent and safe to parallelize.**

---

## Anti-Pattern 6: @SpringBootTest for Unit Tests — Spring Boot + SDET

### ❌ The Wrong Code

```java
// Looks thorough — uses the "real" Spring context
@SpringBootTest   // ← loads EVERYTHING: all beans, DataSource, Redis, Kafka, ...
class PricingServiceTest {

    @Autowired
    private PricingService pricingService;  // the only thing we care about

    @MockBean
    private ProductRepository productRepo;  // mock it anyway — so why load Spring?

    @Test
    void applyDiscount_reducesPrice() {
        given(productRepo.findById(1L)).willReturn(Optional.of(new Product(1L, 100.0)));

        double price = pricingService.applyDiscount(1L, 0.10);

        assertThat(price).isEqualTo(90.0);
        // This works — but it took 18 seconds to start the context for 1 assertion
    }
}
```

### 💥 What Goes Wrong

- **@SpringBootTest loads the full application context**: Every bean, every datasource connection, every Kafka consumer, every scheduled task. For a test that only exercises arithmetic in a service method, this is pure overhead.
- **Startup cost multiplies**: 200 `@SpringBootTest` tests × 15s startup = 3,000 seconds of context loading. Even with context caching, different mock combinations invalidate the cache, causing repeated full restarts.
- **Developers stop running tests**: A 45-minute test suite is a test suite that no one runs before pushing. CI becomes the only safety net — and it's too slow to be a fast feedback loop.

### 🔍 The Symptom You See

```
CI pipeline duration: 47 minutes
Developer habit: "I'll just push and let CI catch it"
Context cache miss rate: 60% (different @MockBean sets invalidate cache)

Team metric: Average time from push to feedback = 52 minutes.
Bugs found in: code review or production, not during development.
```

### ✅ The Correct Code

```java
// Pure logic test — no Spring context at all
class PricingServiceTest {                // no @SpringBootTest

    private ProductRepository productRepo = mock(ProductRepository.class);  // plain Mockito
    private PricingService pricingService = new PricingService(productRepo); // direct construction

    @Test
    void applyDiscount_reducesPrice() {
        when(productRepo.findById(1L)).thenReturn(Optional.of(new Product(1L, 100.0)));

        double price = pricingService.applyDiscount(1L, 0.10);

        assertThat(price).isEqualTo(90.0);
        // Context startup: 0ms. Test execution: 3ms. Done.
    }
}

// HTTP layer test — only web slice
@WebMvcTest(PricingController.class)      // loads only MVC beans — ~2s startup
class PricingControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean PricingService pricingService;  // mock the service layer

    @Test
    void getPrice_returns200() throws Exception {
        given(pricingService.applyDiscount(1L, 0.10)).willReturn(90.0);
        mockMvc.perform(get("/prices/1?discount=0.10"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.price").value(90.0));
    }
}
```

### 🧠 The Rule

**Match the test slice to what you are testing: plain Mockito for logic, `@WebMvcTest` for HTTP, `@DataJpaTest` for queries — reserve `@SpringBootTest` for true integration tests only.**

---

## Anti-Pattern 7: Ignoring @Cache on Collections — Spring Boot

### ❌ The Wrong Code

```java
// Looks right — entity is cached, so "everything is cached", right?
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)  // ← entity cached ✅
public class Category {

    @Id
    private Long id;

    private String name;

    // The @Cache annotation on the COLLECTION is missing ← the bug
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Product> products;     // ← NOT cached — DB hit every access
}

// Service code
public List<Product> getProductsForCategory(Long categoryId) {
    Category cat = categoryRepo.findById(categoryId).orElseThrow();
    // cat is fetched from L2C — cache HIT ✅
    // cat.getProducts() fires a DB query — cache MISS ❌ (every single call)
    return cat.getProducts();
}
```

### 💥 What Goes Wrong

- **Entity cache hit masks collection cache miss**: Cache metrics show a high L2C hit rate (entity hits). The DB query count is also high. The two facts seem contradictory until you understand that collection caching is separate.
- **Collections are cached independently**: Hibernate requires an explicit `@Cache` annotation on the `@OneToMany` collection itself. Without it, every access to `getProducts()` issues a `SELECT * FROM products WHERE category_id = ?`.
- **Delayed discovery**: The misconfiguration is invisible until you add cache metrics AND query metrics side-by-side. Either alone shows a "good" number.

### 🔍 The Symptom You See

```
L2C hit rate:        87% ← looks great
DB query count:      4,200/minute ← still high — why?
Support ticket: "We added Hibernate L2C two weeks ago but the DB is still slow.
                 The dashboard shows the cache is working."

Root cause: Entity hits = 87%. Collection hits = 0%.
            Every page load triggers one entity fetch (cached) and
            one collection SELECT (not cached).
```

### ✅ The Correct Code

```java
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)   // cache the entity
public class Category {

    @Id
    private Long id;

    private String name;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE) // ALSO cache the collection
    private List<Product> products;
}

// application.yml — enable collection caching at the framework level
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true              # needed for collection cache to work
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

### 🧠 The Rule

**Hibernate caches entities and collections independently — annotate BOTH the entity AND every `@OneToMany` collection with `@Cache`, or the collection always hits the DB.**

---

## Anti-Pattern 8: Not Testing the Error Path — SDET

### ❌ The Wrong Code

```java
// Looks complete — happy path is verified
@SpringBootTest
@AutoConfigureMockMvc
class D365IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getContactFromD365_success() throws Exception {
        // WireMock stub for the happy path only
        stubFor(get(urlEqualTo("/api/contacts/42"))
            .willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"id\":42,\"name\":\"Alice\"}")));

        mockMvc.perform(get("/contacts/42"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("Alice"));

        // Done. Ship it. What could go wrong?
        // (no test for 404, 503, 429, network timeout, malformed JSON)
    }
}
```

### 💥 What Goes Wrong

- **Error-handling code is the most undertested code**: Developers write `catch` blocks quickly and rarely verify them. The happy path is exercised constantly in dev; error paths are exercised for the first time in production.
- **Downstream systems fail in production**: D365 returns 404 for deleted contacts, 503 during maintenance windows, 429 when rate-limited. Your application must handle all three distinctly. Untested error handlers almost always throw `NullPointerException`.
- **The failure propagates badly**: A `NullPointerException` in the catch block means every user sees `500 Internal Server Error` and a Java stack trace — instead of a meaningful `404 Contact Not Found` or a retry-able `503 Service Unavailable`.

### 🔍 The Symptom You See

```
Production incident (2:14 AM):
  D365 maintenance window returns 404 for all contact endpoints.
  Your app: NullPointerException in D365Client.parseResponse(D365Client.java:87)
  User-visible: 500 Internal Server Error — "Something went wrong"

  Root cause: parseResponse assumed a non-null body.
              When D365 returns 404 with no body, body was null.
              The null was never tested because only 200 was stubbed.

  Impact: All users unable to load contact pages for 2 hours.
```

### ✅ The Correct Code

```java
@SpringBootTest
@AutoConfigureMockMvc
class D365IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // Happy path
    @Test
    void getContact_whenD365Returns200_returnsContact() throws Exception {
        stubFor(get(urlEqualTo("/api/contacts/42"))
            .willReturn(aResponse().withStatus(200)
                .withBody("{\"id\":42,\"name\":\"Alice\"}")));

        mockMvc.perform(get("/contacts/42"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("Alice"));
    }

    // Error path 1: downstream 404 — contact deleted in D365
    @Test
    void getContact_whenD365Returns404_returnsNotFound() throws Exception {
        stubFor(get(urlEqualTo("/api/contacts/42"))
            .willReturn(aResponse().withStatus(404)));

        mockMvc.perform(get("/contacts/42"))
               .andExpect(status().isNotFound())              // your app maps 404 → 404
               .andExpect(jsonPath("$.error").value("Contact not found"));
    }

    // Error path 2: downstream 503 — maintenance window
    @Test
    void getContact_whenD365Returns503_returnsServiceUnavailable() throws Exception {
        stubFor(get(urlEqualTo("/api/contacts/42"))
            .willReturn(aResponse().withStatus(503)));

        mockMvc.perform(get("/contacts/42"))
               .andExpect(status().isServiceUnavailable())    // not 500, not NPE
               .andExpect(jsonPath("$.error").value("Upstream service unavailable"));
    }

    // Error path 3: network timeout
    @Test
    void getContact_whenD365TimesOut_returnsGatewayTimeout() throws Exception {
        stubFor(get(urlEqualTo("/api/contacts/42"))
            .willReturn(aResponse().withFixedDelay(10_000)));  // simulate slow response

        mockMvc.perform(get("/contacts/42"))
               .andExpect(status().isGatewayTimeout());
    }
}
```

### 🧠 The Rule

**For every downstream integration, stub at least the happy path, 404, 503, and timeout — error-handling code is the most likely code to throw NullPointerException in production.**

---

## Anti-Pattern 9: Circular Bean Dependency Without @Lazy — Spring Boot

### ❌ The Wrong Code

```java
// ServiceA needs ServiceB for notifications
@Service
public class OrderService {

    private final NotificationService notificationService;

    @Autowired
    public OrderService(NotificationService notificationService) {  // constructor injection
        this.notificationService = notificationService;
    }

    public void placeOrder(Order order) {
        // ... process order ...
        notificationService.sendOrderConfirmation(order);
    }
}

// ServiceB needs ServiceA to look up order details for the notification
@Service
public class NotificationService {

    private final OrderService orderService;  // ← circular dependency

    @Autowired
    public NotificationService(OrderService orderService) {  // constructor injection
        this.orderService = orderService;
    }

    public void sendOrderConfirmation(Order order) {
        Order fullOrder = orderService.findById(order.getId()); // needs OrderService
        // ... format and send email ...
    }
}
// Spring cannot construct either bean — each requires the other to exist first.
```

### 💥 What Goes Wrong

- **Application refuses to start**: Spring detects the cycle during context initialization and throws `BeanCurrentlyInCreationException`. There is no partial startup — the application does not start at all.
- **Works locally but fails in CI**: Some legacy setups with field injection (`@Autowired` on the field, not constructor) defer injection and appear to work. After a Spring Boot upgrade enforces stricter lifecycle rules or switches to constructor injection, CI fails on a clean build.
- **The error message is unhelpful**: `BeanCurrentlyInCreationException: Error creating bean with name 'orderService': Requested bean is currently in creation: Is there an unresolvable circular reference?` — points at the symptom, not the design flaw.

### 🔍 The Symptom You See

```
Application startup:
  ***************************
  APPLICATION FAILED TO START
  ***************************
  Description:
    The dependencies of some of the beans in the application context
    form a cycle:
    orderService → notificationService → orderService

  Action:
    Relying upon circular references is discouraged and they are
    prohibited by default. Update your application to remove the
    dependency cycle between beans.

  Previously worked: on Spring Boot 2.5 with field injection.
  Now fails: after upgrade to Spring Boot 2.6+ (circular references
             prohibited by default).
```

### ✅ The Correct Code

```java
// Option A: Extract the shared data access to a third bean (preferred)
@Service
public class OrderQueryService {          // no dependency on NotificationService
    private final OrderRepository orderRepo;
    // ... pure query methods ...
}

@Service
public class OrderService {
    private final NotificationService notificationService;
    private final OrderQueryService orderQueryService; // no cycle
    // ...
}

@Service
public class NotificationService {
    private final OrderQueryService orderQueryService; // no cycle — uses query service
    // ...
}

// Option B: Break the cycle with @Lazy on one side (quick fix, not preferred)
@Service
public class OrderService {

    private final NotificationService notificationService;

    @Autowired
    public OrderService(@Lazy NotificationService notificationService) {
        // @Lazy creates a proxy — NotificationService is initialized on first use,
        // not at application startup, breaking the construction cycle
        this.notificationService = notificationService;
    }
}

// Option C: Use ApplicationEvents to decouple entirely (cleanest architecture)
@Service
public class OrderService {
    private final ApplicationEventPublisher events;

    public void placeOrder(Order order) {
        // ... process order ...
        events.publishEvent(new OrderPlacedEvent(order)); // fire and forget
    }
}

@Service
public class NotificationService {
    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Reacts to the event — no direct dependency on OrderService
    }
}
```

### 🧠 The Rule

**A circular bean dependency is a design smell — resolve it by extracting shared logic to a third bean, using `@Lazy` as a temporary escape hatch, or decoupling with `ApplicationEvents`.**

---

## Anti-Pattern 10: CountDownLatch with Wrong Count — SDET + Spring Boot

### ❌ The Wrong Code

```java
// Looks correct — latch gates the test until Kafka message arrives
@SpringBootTest
class KafkaOrderProcessorTest {

    @Autowired
    private KafkaTemplate<String, Order> kafkaTemplate;

    @Autowired
    private OrderProcessingListener listener;

    @Test
    void processOrder_publishesThreeEvents() throws Exception {
        // Expecting 3 events: ORDER_CREATED, INVENTORY_RESERVED, PAYMENT_CAPTURED
        CountDownLatch latch = new CountDownLatch(1);  // ← BUG: count is 1, not 3
        listener.setLatch(latch);

        kafkaTemplate.send("orders", new Order("ORD-001"));

        boolean completed = latch.await(5, TimeUnit.SECONDS);

        assertThat(completed).isTrue();
        // Verifying 3 events processed:
        assertThat(listener.getProcessedEvents()).hasSize(3);
        // ← FAILS intermittently: often sees only 1 event
    }
}

// Listener
@Component
public class OrderProcessingListener {

    private final List<String> processedEvents = new CopyOnWriteArrayList<>();
    private CountDownLatch latch;

    @KafkaListener(topics = "order-events")
    public void onEvent(String event) {
        processedEvents.add(event);
        if (latch != null) latch.countDown();  // counts down on FIRST event — latch opens immediately
    }
}
```

### 💥 What Goes Wrong

- **Latch opens after the first event**: `CountDownLatch(1)` counts down to zero on the first `countDown()` call. `latch.await()` returns immediately after event 1. Events 2 and 3 arrive after `await()` returns — after the assertions have already run.
- **Test passes with 1 of 3 events processed**: `assertThat(listener.getProcessedEvents()).hasSize(3)` fails when only 1 event was in the list at assertion time. But because Kafka delivery is fast, events 2 and 3 sometimes arrive before the assertion — making the test a **race condition**.
- **Intermittent failure is worse than consistent failure**: The test passes 70% of the time (fast machine) and fails 30% (CI under load). This destroys trust in the test suite and makes the bug hard to reproduce.

### 🔍 The Symptom You See

```
Test run 1: PASS  (events arrived before assertion — lucky timing)
Test run 2: FAIL  expected: 3 but was: 1
Test run 3: PASS
Test run 4: FAIL  expected: 3 but was: 2
Test run 5: PASS

CI flakiness rate: 30%
Developer comment: "This test is just flaky — ignore it."
Hidden bug: Only 1 of 3 Kafka events was actually being processed correctly.
            The 'flaky' test was trying to tell you something real.
```

### ✅ The Correct Code

```java
@SpringBootTest
class KafkaOrderProcessorTest {

    @Autowired
    private KafkaTemplate<String, Order> kafkaTemplate;

    @Autowired
    private OrderProcessingListener listener;

    @Test
    void processOrder_publishesThreeEvents() throws Exception {
        // Count matches the number of expected events exactly
        CountDownLatch latch = new CountDownLatch(3);  // ✅ one countdown per event
        listener.setLatch(latch);

        kafkaTemplate.send("orders", new Order("ORD-001"));

        // Await ALL 3 countdowns — returns only when all 3 events processed
        boolean allProcessed = latch.await(10, TimeUnit.SECONDS);

        assertThat(allProcessed)
            .as("Expected 3 order events to be processed within 10 seconds")
            .isTrue();

        assertThat(listener.getProcessedEvents())
            .hasSize(3)
            .containsExactlyInAnyOrder(
                "ORDER_CREATED",
                "INVENTORY_RESERVED",
                "PAYMENT_CAPTURED"
            );
    }
}

@Component
public class OrderProcessingListener {

    private final List<String> processedEvents = new CopyOnWriteArrayList<>();
    private volatile CountDownLatch latch;  // volatile — written from test thread, read from Kafka thread

    @KafkaListener(topics = "order-events")
    public void onEvent(String event) {
        processedEvents.add(event);
        if (latch != null) {
            latch.countDown();  // called 3 times; await() returns only after the 3rd
        }
    }

    public void setLatch(CountDownLatch latch) { this.latch = latch; }
    public List<String> getProcessedEvents() { return processedEvents; }
}
```

### 🧠 The Rule

**`CountDownLatch(N)` must equal the exact number of events you expect — one countdown per event — or `await()` returns early and your assertions run before all events are processed.**

---

## Summary Table

| #   | Anti-Pattern                    | Domain             | Symptom Keyword               | Fix Keyword                         |
| --- | ------------------------------- | ------------------ | ----------------------------- | ----------------------------------- |
| 1   | Thread.sleep in Tests           | SDET               | CI timeout / always 5s        | `expect.poll` with intervals        |
| 2   | Over-Mocking the Repository     | SDET + Spring Boot | Green tests, prod query bug   | `@DataJpaTest` + Testcontainers     |
| 3   | Fixed-Window Rate Limiter       | DSA + Spring Boot  | 20x limit at boundary         | Sliding window ZSET (Redis)         |
| 4   | Eager Loading Everything        | Spring Boot + DSA  | OOM, 2500 rows for 1 account  | `FetchType.LAZY` + JOIN FETCH       |
| 5   | Sharing Test State Across Tests | SDET               | Pass alone, fail together     | Unique ID per test, beforeEach      |
| 6   | @SpringBootTest for Unit Tests  | Spring Boot + SDET | 45-min CI, devs skip tests    | Plain Mockito / `@WebMvcTest`       |
| 7   | Missing @Cache on Collections   | Spring Boot        | High L2C hit, high DB queries | `@Cache` on entity AND collection   |
| 8   | Not Testing the Error Path      | SDET               | NPE on 503, 500 to user       | WireMock stubs per error code       |
| 9   | Circular Bean Dependency        | Spring Boot        | App won't start in CI         | Third bean / `@Lazy` / Events       |
| 10  | CountDownLatch with Wrong Count | SDET + Spring Boot | Flaky Kafka test, 30% fail    | `new CountDownLatch(N)` exact count |

---

**Navigation**: [← Quick Reference Cards](15_Quick_Reference_Cards.md) | [📚 Index](../00_INDEX.md) | [Incident Lessons →](17_Production_Incident_Lessons.md)


---

## Reality Check

**"Knowing the anti-patterns prevents them"** ? Recognizing an anti-pattern in a gallery and avoiding it under pressure are different memory systems ([13_DE/05 clean-code, 05_Problem_Solving/24]): the gallery primes RETROSPECTIVE diagnosis (why is this bad) more than prospective avoidance. The conversion is personal � tagging which anti-patterns YOU commit ([05_Problem_Solving/24] your-signature-mistakes) and drilling those specifically, because the gallery is a recognition aid, and prevention comes from knowing your own recurring anti-patterns and the discipline that avoids them.

**"Anti-patterns are always wrong"** ? Many anti-patterns are CONTEXT-dependent � the pattern that is wrong at scale is fine for a prototype, the "anti-pattern" that is the pragmatic choice given constraints ([Enterprise 07, system-design]): the global state that is bad at scale and fine for a script, the duplication that beats the wrong abstraction ([13_DE/05] clean-code). "Always wrong" is the dogma that misapplies the anti-pattern label � the skill is recognizing WHEN something is an anti-pattern (the context where its costs bite) versus when it is an acceptable trade-off, the [Enterprise 07] context-dependence applied to anti-patterns.

**"The anti-pattern gallery teaches good design by negation"** ? Knowing what to avoid is necessary and insufficient for knowing what to DO ([13_DE/05, 06_OOP]): the developer who can name every anti-pattern and cannot design a good solution (the negation without the positive skill). The gallery complements the positive patterns and principles ([06_OOP, clean-code]) � "teaches by negation" alone produces the critic who spots problems and cannot build solutions, and good design needs both the anti-pattern awareness (what to avoid) and the positive design skill (what to build).

**"Spotting anti-patterns in code review is the reviewer's main job"** ? Anti-pattern spotting is one part of review, and fixating on it produces nitpick theater ([13_DE/14 code-review]): the review that flags every minor anti-pattern while missing the missing-timeout or the security issue ([13_DE/14] signal-versus-nitpick). The reviewer's leverage is the substantive issues (correctness, security, operability � [13_DE/14]) with the anti-patterns as one input, and "the main job" over-weights the pattern-spotting over the higher-value correctness-and-design review that anti-pattern galleries do not cover.

**"The anti-pattern list is complete and stable"** ? Anti-patterns EVOLVE as technology and practices change ([the-whole-curriculum, 06_OOP/08]): the pattern that was best practice and became an anti-pattern (the [06_OOP/08] Singleton, the manual-memo that the React-compiler obsoletes � [15_React/08]), the new anti-patterns from new tools. "Complete and stable" ignores the evolution � what counts as an anti-pattern shifts with the language, the framework, and the accumulated experience ([06_OOP/08] the once-good-now-bad patterns), which is why the gallery is a living artifact ([the-whole-curriculum] version-currency), and the frozen list eventually flags things that are no longer anti-patterns and misses the new ones.
