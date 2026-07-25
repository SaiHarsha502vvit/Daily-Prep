# 🔥 Elite Cross-Domain Rounds — DSA × Spring Boot × SDET

**Navigation**: [← Mock Interview Simulations](../09_Mock_Interview_Simulations.md) | [📚 Index](../00_INDEX.md)

**Cross-links:**

- [`24_Advanced_API_Testing/`](../../24_Advanced_API_Testing/) — API testing patterns used in Part C problems
- [`07_Modern_Java/`](../../07_Modern_Java/) — Spring Boot internals referenced in Part B problems
- [`21_SDET_Playwright_Automation/`](../../21_SDET_Playwright_Automation/) — Playwright patterns in Part C solutions

---

> These are **Staff / Senior Engineer level** problems. Each round gives you one **real production scenario** and demands simultaneous reasoning across DSA, Spring Boot, and SDET. A candidate who answers all three parts fluently is in the top 5%.
>
> **Format per round:**
>
> - **Part A — DSA**: the algorithmic/data-structure thinking underneath the problem
> - **Part B — Spring Boot**: the production implementation
> - **Part C — SDET**: how you would test it to a professional standard

---

## Table of Contents

1. [Elite Round 1 — The Rate Limiter Triad](#elite-round-1--the-rate-limiter-triad)
2. [Elite Round 2 — The N+1 Detective](#elite-round-2--the-n1-detective)
3. [Elite Round 3 — The Kafka Idempotency Chain](#elite-round-3--the-kafka-idempotency-chain)
4. [Elite Round 4 — The Circuit Breaker State Machine](#elite-round-4--the-circuit-breaker-state-machine)
5. [Elite Round 5 — Keyset Pagination Under Concurrent Inserts](#elite-round-5--keyset-pagination-under-concurrent-inserts)
6. [Elite Round 6 — The Distributed Lock Deadlock](#elite-round-6--the-distributed-lock-deadlock)
7. [Elite Round 7 — Cache Invalidation Race Condition](#elite-round-7--cache-invalidation-race-condition)
8. [Elite Round 8 — API Versioning Breaking Change](#elite-round-8--api-versioning-breaking-change)

---

## Elite Round 1 — The Rate Limiter Triad

**Scenario**: Your citation API must enforce a per-user limit of **10 requests per 10 seconds**. Concurrent users = 50,000. You own the full stack: algorithm, Spring filter, and the automated test suite.

---

### Part A — DSA: Design the rate-limiting algorithm

Which algorithm and data structure do you choose? What is the time and space complexity per request? Why is it better than fixed-window counter?

<details><summary>Answer</summary>

**Algorithm: Sliding Window Log** backed by a **Redis Sorted Set (ZSET)**

```
Per-request steps:
  1. ZADD  key  now  now         → O(log n)   add current timestamp as member+score
  2. ZREMRANGEBYSCORE key 0 (now-10000)        → O(log n + k) evict expired entries
  3. ZCARD key                   → O(1)        count requests in current window
  4. If count > 10 → 429, else allow
  5. EXPIRE key 10               → O(1)        auto-cleanup idle keys

n = requests in window (max 10) → effectively O(1) per request
Space: O(users × window_size) = O(50,000 × 10) = 500K ZSET entries
```

**Why not fixed-window counter?**
Fixed window has a boundary attack: 10 requests at second 9.9 + 10 at second 10.0 = **20 requests in 200ms**. The counter resets at the boundary, so both batches are within their respective windows. Sliding window prevents this because it always looks at the last 10 real seconds regardless of wall-clock boundaries.

**Why not token bucket?**
Token bucket allows bursting by design — a user can exhaust 10 tokens in 1ms, then wait 10s. For citation APIs where burst abuse is a concern, sliding window is stricter.

</details>

---

### Part B — Spring Boot: Wire the rate limiter as a request filter

Write a Spring `OncePerRequestFilter` that wraps the Redis sliding window. It must set a `Retry-After` header on 429 responses and use a Redis pipeline to keep the check to a single round-trip.

<details><summary>Answer</summary>

```java
@Component
@Order(1)
public class SlidingWindowRateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;
    private static final int  LIMIT     = 10;
    private static final long WINDOW_MS = 10_000L;

    public SlidingWindowRateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {

        String userId = req.getHeader("X-User-Id");
        if (userId == null) { chain.doFilter(req, res); return; }

        String key = "rate:" + userId;
        long   now = System.currentTimeMillis();

        // All 4 Redis commands in ONE round-trip (pipeline)
        List<Object> pipe = redis.executePipelined((RedisCallback<Object>) conn -> {
            byte[] k = key.getBytes();
            conn.zAdd(k, now, String.valueOf(now).getBytes());
            conn.zRemRangeByScore(k, 0, now - WINDOW_MS);
            conn.zCard(k);
            conn.expire(k, 10L);
            return null;
        });

        long count = (Long) pipe.get(2);

        if (count > LIMIT) {
            long retryAfterSec = WINDOW_MS / 1000;
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(retryAfterSec));
            res.setHeader("X-RateLimit-Limit", String.valueOf(LIMIT));
            res.setHeader("X-RateLimit-Remaining", "0");
            res.setContentType("application/json");
            res.getWriter().write(
                "{\"error\":\"RATE_LIMIT_EXCEEDED\",\"retryAfterMs\":" + (retryAfterSec * 1000) + "}"
            );
            return;
        }

        res.setHeader("X-RateLimit-Remaining", String.valueOf(LIMIT - count));
        chain.doFilter(req, res);
    }
}
```

**Key decisions**:

- `@Order(1)`: runs before security filters — fail fast before JWT validation overhead.
- Redis pipeline: 4 commands, 1 network round-trip (~0.2ms vs ~0.8ms for 4 separate calls).
- `Retry-After` is RFC 6585 compliant — tells clients exactly when to retry.

</details>

---

### Part C — SDET: Test the rate limiter precisely

Write a Playwright API test that fires **11 concurrent requests** from the same user, asserts exactly 10 return 200 and at least 1 returns 429 with a valid `Retry-After` header.

<details><summary>Answer</summary>

```typescript
test("Rate limiter: 11th concurrent request returns 429 with Retry-After", async ({
  request,
}) => {
  const userId = `RATE-TEST-${Date.now()}`; // unique per run — prevents cross-test leakage

  // Fire 11 requests IN PARALLEL — critical: sequential loop would never trigger the limit
  const responses = await Promise.all(
    Array.from({ length: 11 }, () =>
      request.get("/api/citations", { headers: { "X-User-Id": userId } }),
    ),
  );

  const statuses = responses.map((r) => r.status());
  const count200 = statuses.filter((s) => s === 200).length;
  const count429 = statuses.filter((s) => s === 429).length;

  expect(count200, "Expected exactly 10 successful requests").toBe(10);
  expect(
    count429,
    "Expected at least 1 throttled request",
  ).toBeGreaterThanOrEqual(1);

  // Verify the 429 response shape
  const throttled = responses.find((r) => r.status() === 429)!;
  const retryAfter = throttled.headers()["retry-after"];
  const body = await throttled.json();

  expect(retryAfter, "Retry-After header must be present").toBeDefined();
  expect(Number(retryAfter)).toBeGreaterThan(0);
  expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
  expect(body.retryAfterMs).toBeGreaterThan(0);
});
```

**What a junior SDET gets wrong**: Uses a `for` loop — requests arrive 200ms apart, none get throttled, test passes with false confidence.

**What this test proves**: `Promise.all` fires all 11 requests simultaneously from Node.js's event loop. Since HTTP is I/O, they are truly concurrent and all hit the server within the same 10ms window — which is the only correct way to stress-test a rate limiter.

</details>

---

## Elite Round 2 — The N+1 Detective

**Scenario**: `GET /api/accounts/{id}` returns an account with all its citations. Response time is under 10ms in unit tests but **8 seconds in staging** with 50 accounts. You are asked to diagnose, fix, and prove the fix works.

---

### Part A — DSA: Why is O(n) DB queries catastrophic at scale?

<details><summary>Answer</summary>

```
N+1 pattern:
  Query 1 : SELECT * FROM accounts LIMIT 50                         → 5ms
  Query 2 : SELECT * FROM citations WHERE account_id = 'ACC-001'    → 5ms
  Query 3 : SELECT * FROM citations WHERE account_id = 'ACC-002'    → 5ms
  ...
  Query 51: SELECT * FROM citations WHERE account_id = 'ACC-050'    → 5ms

Total: 51 queries × 5ms = 255ms for n=50

JOIN FETCH (1 query):
  SELECT a.*, c.*
  FROM   accounts a
  LEFT JOIN citations c ON c.account_id = a.id
  LIMIT 50                                                          → 8-12ms

At n=10,000:
  N+1: 10,001 × 2ms network round-trip = 20 seconds
  JOIN: 1 × 2ms = 2ms

The algorithmic complexity is the same: O(n) rows transferred.
The CONSTANT FACTOR (network round-trips) is what kills you:
  N+1 = O(n) round-trips
  JOIN = O(1) round-trips
```

**The SDE insight**: Database query optimization is NOT just about Big-O complexity of the data transfer. It is about the number of network round-trips, which each carry a fixed 1-5ms latency tax regardless of row count.

</details>

---

### Part B — Spring Boot: Spot and fix the N+1 in a JPA entity

```java
// The code under investigation:
@Entity
public class Account {
    @Id Long id;
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    List<Citation> citations;
}

// Service:
public List<AccountDTO> getAll() {
    return accountRepo.findAll()              // Query 1
        .stream()
        .map(a -> new AccountDTO(
            a.getId(),
            a.getCitations()                  // Queries 2..N trigger here
        )).toList();
}
```

Identify the trigger. Write three different fixes ordered by trade-off.

<details><summary>Answer</summary>

**Trigger**: `a.getCitations()` — accessing a `LAZY` collection outside the Hibernate session causes Hibernate to issue a separate `SELECT` per account.

**Fix 1 — JPQL `JOIN FETCH` (best for always-needed associations)**

```java
@Query("SELECT a FROM Account a LEFT JOIN FETCH a.citations")
List<Account> findAllWithCitations();
// Produces: SELECT a.*, c.* FROM accounts a LEFT JOIN citations c ON ...
// 1 query total. Risk: Cartesian product if you JOIN FETCH multiple @OneToMany.
```

**Fix 2 — `@EntityGraph` (declarative, no JPQL)**

```java
@EntityGraph(attributePaths = {"citations"})
List<Account> findAll();
// Hibernate generates JOIN FETCH at query time.
// Cleaner — no hardcoded JPQL, works with Spring Data method naming.
```

**Fix 3 — `@BatchSize` (best for optional/conditional loading)**

```java
@OneToMany(fetch = FetchType.LAZY)
@BatchSize(size = 50)
List<Citation> citations;
// On first access, Hibernate issues:
// SELECT * FROM citations WHERE account_id IN (?, ?, ..., ?) -- up to 50 at once
// Result: 1 accounts query + CEIL(n/50) citations queries. Not 1, but far better than n.
```

**When to use which**:
| Approach | Use when |
|---|---|
| `JOIN FETCH` / `@EntityGraph` | Always need citations with accounts |
| `@BatchSize` | Sometimes need citations; entity graph is complex (multiple @OneToMany) |
| Neither | If you never need citations in this call path, project to a DTO with `@Query` selecting only account fields |

</details>

---

### Part C — SDET: Assert a performance contract — max 2 DB queries for 50 accounts

<details><summary>Answer</summary>

```typescript
// Using Spring Actuator's datasource metrics endpoint:
test("GET /api/accounts triggers ≤2 SQL queries (N+1 regression guard)", async ({
  request,
}) => {
  // Baseline — read current DB call count from Actuator
  const beforeRes = await request.get(
    "/actuator/metrics/jdbc.connections.active",
  );
  // Use a custom counter exposed via Micrometer instead:
  const counterBefore = await request
    .get("/actuator/metrics/db.query.count")
    .then((r) => r.json())
    .then((j) => j.measurements[0].value as number);

  // Execute the API call
  const res = await request.get("/api/accounts?limit=50");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.accounts).toHaveLength(50);

  // Read the counter AFTER
  const counterAfter = await request
    .get("/actuator/metrics/db.query.count")
    .then((r) => r.json())
    .then((j) => j.measurements[0].value as number);

  const queriesExecuted = counterAfter - counterBefore;

  expect(
    queriesExecuted,
    `N+1 detected: fetching 50 accounts fired ${queriesExecuted} queries (expected ≤2)`,
  ).toBeLessThanOrEqual(2);
});
```

**Why this test is elite**: It encodes a **performance contract** — if a future dev reverts `@EntityGraph` to `FetchType.LAZY`, this test fails in CI before it hits staging. This is how professional teams prevent performance regressions.

**Alternative (in-process, Java)**: Use `datasource-proxy` in a `@DataJpaTest` — wraps the `DataSource` and counts queries before/after with zero network overhead.

</details>

---

## Elite Round 3 — The Kafka Idempotency Chain

**Scenario**: Payment service publishes `PaymentProcessed` to Kafka. Three consumers: `NotificationService` (sends email), `LedgerService` (records transaction), `AuditService` (writes audit log). A network blip causes Kafka to redeliver. **Duplicate email sent. Ledger shows double charge.**

---

### Part A — DSA: How does Kafka's ring buffer enable at-least-once delivery?

<details><summary>Answer</summary>

**Core data structure: Append-only segmented log (logically a circular buffer)**

```
Partition log:
  Offset 0: PaymentProcessed{id:"PAY-001", amount:150}
  Offset 1: PaymentProcessed{id:"PAY-002", amount:200}
  Offset 2: OrderCreated{...}

Consumer committed offsets:
  notification-svc: committed=1   ← crashed before committing offset 2
  ledger-svc:       committed=2   ← processed OK
```

**At-least-once flow**:

```
1. Consumer reads offset 1 (PaymentProcessed PAY-001)
2. Consumer processes → sends email ✓
3. CRASH before ack.acknowledge() is called
4. Kafka sees notification-svc still at committed=0
5. Kafka redelivers offset 1 to the next available consumer instance
6. Email sent AGAIN → duplicate
```

**Why "ring buffer"**: Kafka never overwrites committed messages. It appends to the tail and deletes from the head based on `log.retention.hours`. Consumers control their own read cursor (committed offset) independently — a slow consumer can lag behind without blocking faster ones.

**The at-least-once vs exactly-once trade-off**:
| Guarantee | Mechanism | Cost |
|---|---|---|
| At-most-once | Commit offset BEFORE processing | Possible data loss |
| At-least-once | Commit offset AFTER processing | Possible duplicates |
| Exactly-once | Kafka Transactions + idempotent producer | ~3x overhead, complex |

**Production choice**: At-least-once + **idempotent consumers** (your code handles duplicates) is the standard enterprise pattern.

</details>

---

### Part B — Spring Boot: Implement an idempotent Kafka consumer

Write the `NotificationService` Kafka consumer with three-layer idempotency. It must handle duplicates safely, retry on transient failures, and route poison pills to a DLT.

<details><summary>Answer</summary>

```java
@Service
public class NotificationKafkaConsumer {

    private final NotificationEmailService emailService;
    private final StringRedisTemplate redis;
    private final ProcessedEventRepository processedRepo;

    @RetryableTopic(
        attempts = "3",
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        dltTopicSuffix = "-dlt",
        retryTopicSuffix = "-retry"
    )
    @KafkaListener(topics = "payment-processed", groupId = "notification-svc")
    public void onPayment(PaymentProcessedEvent event, Acknowledgment ack) {
        String idempKey = "notif:processed:" + event.getPaymentId();

        // Layer 1: Redis fast-path dedup (O(1), 24h TTL)
        if (Boolean.TRUE.equals(redis.hasKey(idempKey))) {
            log.info("Duplicate event {} — skipping", event.getPaymentId());
            ack.acknowledge(); // still advance the Kafka offset
            return;
        }

        // Layer 2: DB check (survives Redis restart)
        if (processedRepo.existsByEventId(event.getPaymentId())) {
            redis.opsForValue().set(idempKey, "1", Duration.ofHours(24)); // warm cache
            ack.acknowledge();
            return;
        }

        // Process — throws on transient failure → @RetryableTopic retries
        emailService.sendPaymentConfirmation(event.getUserId(), event.getAmount());

        // Layer 3: Mark processed atomically
        redis.opsForValue().set(idempKey, "1", Duration.ofHours(24));
        processedRepo.save(new ProcessedEvent(event.getPaymentId(), "NOTIFICATION", Instant.now()));

        ack.acknowledge(); // commit Kafka offset ONLY after successful processing
    }

    @DltHandler
    public void handleDlt(PaymentProcessedEvent event) {
        log.error("Poison pill after 3 retries — paymentId={}", event.getPaymentId());
        // Alert PagerDuty / write to incident table
    }
}
```

**The three idempotency layers**:

1. **Redis** (fast, O(1)): handles 99% of duplicates in <1ms
2. **DB** (durable): survives Redis evictions/restarts; provides audit trail
3. **Manual `ack.acknowledge()`**: never auto-commit — commit only after confirmed success

**`@RetryableTopic` magic**: auto-creates `payment-processed-retry-0`, `payment-processed-retry-1`, and `payment-processed-dlt` topics. Retry topics have configurable delays (1s, 2s backoff). After 3 attempts, event routes to DLT.

</details>

---

### Part C — SDET: Test idempotency AND DLT routing

<details><summary>Answer</summary>

```typescript
test("Duplicate PaymentProcessed events send exactly one email", async ({
  kafkaProducer,
  emailInbox,
}) => {
  const paymentId = `PAY-DEDUP-${Date.now()}`;
  const event = JSON.stringify({ paymentId, userId: "USR-001", amount: 150 });

  // Publish the SAME event 3 times — simulates Kafka redelivery
  await Promise.all([
    kafkaProducer.send({
      topic: "payment-processed",
      messages: [{ value: event }],
    }),
    kafkaProducer.send({
      topic: "payment-processed",
      messages: [{ value: event }],
    }),
    kafkaProducer.send({
      topic: "payment-processed",
      messages: [{ value: event }],
    }),
  ]);

  // Poll the email inbox — must receive EXACTLY 1 email, not 3
  await expect
    .poll(
      async () => {
        const emails = await emailInbox.getEmailsFor("USR-001");
        return emails.filter((e) => e.subject.includes(paymentId)).length;
      },
      { timeout: 8000, intervals: [500] },
    )
    .toBe(1);
});

test("Malformed event routes to DLT after 3 retry attempts", async ({
  kafkaProducer,
  kafkaConsumer,
}) => {
  // Poison pill: missing required fields — consumer will throw
  const badEvent = JSON.stringify({ broken: true, missingPaymentId: true });

  await kafkaProducer.send({
    topic: "payment-processed",
    messages: [{ value: badEvent }],
  });

  // DLT message must appear after: retry-0 (1s) + retry-1 (2s) + retry-2 (4s) = 7s minimum
  const dltMsg = await expect
    .poll(
      async () => {
        const msgs = await kafkaConsumer.getMessages("payment-processed-dlt", {
          maxMessages: 1,
        });
        return msgs.length > 0 ? msgs[0] : null;
      },
      { timeout: 30_000, intervals: [1000] },
    )
    .not.toBeNull();

  // DLT message headers carry retry provenance
  expect(dltMsg.headers["kafka_dlt-original-topic"]).toBe("payment-processed");
  expect(Number(dltMsg.headers["kafka_dlt-exception-fqcn"])).toBeDefined();
});
```

</details>

---

## Elite Round 4 — The Circuit Breaker State Machine

**Scenario**: Your integration tests call a real Dynamics 365 staging API. Staging flaps — it works 80% of the time but goes down for 30 seconds without warning. Without protection, your entire test suite cascades to failure. With a circuit breaker, failed calls return a fallback immediately.

---

### Part A — DSA: Model the circuit breaker as a Finite State Machine

<details><summary>Answer</summary>

```
States: CLOSED → OPEN → HALF_OPEN → CLOSED (or back to OPEN)

┌─────────────────────────────────────────────────────────────────┐
│  CLOSED  (normal)                                               │
│  Allow all requests.                                            │
│  Maintain a sliding window of last N calls.                     │
│  IF failure_rate > threshold AND calls >= min_calls:            │
│    → transition to OPEN                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │  failure threshold breached
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  OPEN  (fail fast)                                              │
│  Reject ALL requests immediately — zero network calls.          │
│  Return fallback response or throw CallNotPermittedException.   │
│  Start a wait timer (e.g. 30 seconds).                          │
│  IF timer expires:                                              │
│    → transition to HALF_OPEN                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │  wait_duration elapsed
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  HALF_OPEN  (probe)                                             │
│  Allow exactly permittedCalls (e.g. 1) probe requests through. │
│  IF probe succeeds:  → CLOSED  (reset failure counter)          │
│  IF probe fails:     → OPEN    (reset wait timer)               │
└─────────────────────────────────────────────────────────────────┘
```

**Why HALF_OPEN prevents thundering herd**: If you went directly from OPEN → CLOSED, all queued requests would hit the recovering service simultaneously, potentially killing it again. HALF_OPEN sends just 1 probe; only if it succeeds does traffic ramp back up.

**The DSA insight**: This is a deterministic FSM with exactly 3 states and 5 transitions. The state persists in-process (Resilience4j in-memory) or in Redis (distributed circuit breaker across instances).

</details>

---

### Part B — Spring Boot: Configure Resilience4j circuit breaker with fallback

<details><summary>Answer</summary>

```java
@Service
public class DynamicsApiClient {

    private final WebClient webClient;

    public DynamicsApiClient(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("https://d365-staging.company.com").build();
    }

    @CircuitBreaker(name = "dynamics365", fallbackMethod = "getCitationFallback")
    @Retry(name = "dynamics365")  // retry INSIDE the circuit breaker — 3 retries before counting as failure
    public CitationResponse getCitation(String citationId) {
        return webClient.get()
            .uri("/api/v2/citations/{id}", citationId)
            .retrieve()
            .onStatus(status -> status.is5xxServerError(),
                resp -> Mono.error(new DynamicsApiException("5xx from D365")))
            .bodyToMono(CitationResponse.class)
            .block();
    }

    // Signature MUST match the original method + Exception parameter at the end
    private CitationResponse getCitationFallback(String citationId, Exception ex) {
        log.warn("Circuit OPEN for D365 citation {}. Returning empty sentinel. Cause: {}",
            citationId, ex.getClass().getSimpleName());
        return CitationResponse.empty(citationId); // sentinel — caller checks .isEmpty()
    }
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      dynamics365:
        slidingWindowSize: 10
        failureRateThreshold: 50 # open if >50% of last 10 calls fail
        minimumNumberOfCalls: 5 # need at least 5 calls before evaluating
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 1
        recordExceptions:
          - com.company.exceptions.DynamicsApiException
          - java.net.ConnectException
  retry:
    instances:
      dynamics365:
        maxAttempts: 3
        waitDuration: 500ms
```

**`@Retry` + `@CircuitBreaker` interaction**: `@Retry` fires first — 3 attempts before the circuit breaker counts one failure. This prevents transient network hiccups from tripping the breaker on a single bad call.

</details>

---

### Part C — SDET: Test the OPEN → HALF_OPEN → CLOSED state transition

<details><summary>Answer</summary>

```typescript
test("Circuit breaker: trips OPEN, probes via HALF_OPEN, recovers to CLOSED", async ({
  request,
  dynamicsStub, // WireMock instance stubbing Dynamics 365
}) => {
  // ── Phase 1: Trip the circuit (force 10 failures) ──────────────────────
  await dynamicsStub.stubFor({
    request: { method: "GET", urlPathMatching: "/api/v2/citations/.*" },
    response: { status: 503, body: '{"error":"Service Unavailable"}' },
  });

  for (let i = 0; i < 10; i++) {
    await request.get(`/api/citations/CIT-${String(i).padStart(3, "0")}`);
    // Our API returns 200 with fallback sentinel — that's expected and correct
  }

  // ── Phase 2: Assert OPEN — fail-fast, no network call to Dynamics ───────
  const t0 = Date.now();
  const openRes = await request.get("/api/citations/CIT-PROBE");
  const elapsed = Date.now() - t0;

  // OPEN state returns fallback immediately — should be < 50ms (no network)
  expect(elapsed, "Circuit should fail-fast — no network call").toBeLessThan(
    50,
  );
  const openBody = await openRes.json();
  expect(openBody.isEmpty).toBe(true); // sentinel value

  // Verify via Actuator
  const cbState = await request.get("/actuator/circuitbreakers/dynamics365");
  expect((await cbState.json()).circuitBreakers.dynamics365.state).toBe("OPEN");

  // ── Phase 3: Stub D365 to return 200 (API recovered) ───────────────────
  await dynamicsStub.stubFor({
    request: { method: "GET", urlPathMatching: "/api/v2/citations/.*" },
    response: {
      status: 200,
      jsonBody: { citationId: "CIT-PROBE", status: "PENDING" },
    },
    priority: 1,
  });

  // ── Phase 4: Wait for waitDurationInOpenState (30s in prod; use short in test env) ─
  // In test: override waitDurationInOpenState=2s via application-test.yml
  await new Promise((r) => setTimeout(r, 2500));

  // ── Phase 5: Probe request (HALF_OPEN → CLOSED) ─────────────────────────
  const probeRes = await request.get("/api/citations/CIT-PROBE");
  expect(probeRes.status()).toBe(200);
  const probeBody = await probeRes.json();
  expect(probeBody.isEmpty).toBeUndefined(); // real response, not fallback

  // ── Phase 6: Verify CLOSED state via Actuator ───────────────────────────
  await expect
    .poll(
      async () => {
        const s = await request.get("/actuator/circuitbreakers/dynamics365");
        return (await s.json()).circuitBreakers.dynamics365.state;
      },
      { timeout: 5000 },
    )
    .toBe("CLOSED");
});
```

**Test environment trick**: Override `waitDurationInOpenState=2s` in `application-test.yml` so the test completes in <10s. Never use `page.waitForTimeout(30000)` in tests — configure the system under test to cooperate.

</details>

---

## Elite Round 5 — Keyset Pagination Under Concurrent Inserts

**Scenario**: Your `GET /api/citations?page=N&size=50` uses OFFSET pagination today. A load test reveals page 500 takes **3.2 seconds**. A data-integrity bug causes records to be returned twice across pages when concurrent writes happen. You must migrate to keyset pagination and prove it is both faster and consistent.

---

### Part A — DSA: Why OFFSET is O(n) and breaks under concurrent inserts

<details><summary>Answer</summary>

```
OFFSET pagination:
  Page 1: SELECT * FROM citations ORDER BY id DESC LIMIT 50 OFFSET 0
  Page 2: SELECT * FROM citations ORDER BY id DESC LIMIT 50 OFFSET 50
  Page N: SELECT * FROM citations ORDER BY id DESC LIMIT 50 OFFSET (N-1)*50

Cost: OFFSET n forces the DB to read and DISCARD n rows before returning 50.
  Page 500: DB reads 24,950 rows, discards them, returns 50.
  O(OFFSET) = O(page_number × page_size)

Concurrent insert problem:
  User fetches Page 1 → rows with IDs [1000, 999, ..., 951]
  5 new rows inserted → IDs [1005, 1004, 1003, 1002, 1001]
  User fetches Page 2: OFFSET 50 → shifts right by 5
  Row 951 through 947 now appear AGAIN on Page 2 → DUPLICATE
```

**Keyset (cursor-based) pagination**:

```
Page 1: SELECT * FROM citations WHERE id < ∞ ORDER BY id DESC LIMIT 50
  → Returns IDs [1000..951]. Cursor = 951.

Page 2: SELECT * FROM citations WHERE id < 951 ORDER BY id DESC LIMIT 50
  → Uses B-tree index to seek directly to id=951. O(log n) seek.
  → New inserts with id > 1000 are ABOVE the cursor → invisible → no duplicates.
```

**Complexity comparison**:
| | OFFSET | Keyset |
|---|---|---|
| Query cost | O(OFFSET) — full scan to skip | O(log n) — B-tree index seek |
| Under concurrent inserts | Duplicates / skips | Stable — cursor anchors position |
| Deep pagination (page 10K) | 500,000 rows read and discarded | Same O(log n) as page 1 |

</details>

---

### Part B — Spring Boot: Implement keyset pagination with opaque cursors

<details><summary>Answer</summary>

```java
// Repository — two query methods, not one overloaded method
@Repository
public interface CitationRepository extends JpaRepository<Citation, Long> {

    @Query("SELECT c FROM Citation c WHERE c.userId = :uid ORDER BY c.id DESC LIMIT :lim")
    List<Citation> findFirstPage(@Param("uid") String userId, @Param("lim") int limit);

    @Query("SELECT c FROM Citation c WHERE c.userId = :uid AND c.id < :cursor ORDER BY c.id DESC LIMIT :lim")
    List<Citation> findNextPage(@Param("uid") String userId,
                                @Param("cursor") Long cursor,
                                @Param("lim") int limit);
}

// Service — fetch limit+1 to detect hasMore without a COUNT query
@Service
public class CitationPageService {

    private final CitationRepository repo;

    public CitationPage getPage(String userId, String encodedCursor, int limit) {
        int fetchSize = Math.min(limit, 100) + 1; // cap at 100, +1 for hasMore detection

        List<Citation> rows = (encodedCursor == null)
            ? repo.findFirstPage(userId, fetchSize)
            : repo.findNextPage(userId, decode(encodedCursor), fetchSize);

        boolean hasMore = rows.size() > limit;
        List<Citation> page = hasMore ? rows.subList(0, limit) : rows;

        String nextCursor = hasMore ? encode(page.get(page.size() - 1).getId()) : null;

        return new CitationPage(page.stream().map(CitationMapper::toDTO).toList(), nextCursor, hasMore);
    }

    // Opaque cursor: Base64-encode the ID so clients can't manipulate it
    private String encode(Long id) {
        return Base64.getEncoder().encodeToString(id.toString().getBytes());
    }

    private Long decode(String cursor) {
        return Long.parseLong(new String(Base64.getDecoder().decode(cursor)));
    }
}
```

**Why Base64 encode?** Opaque cursors decouple the client from the internal pagination strategy. You can later change from `id`-based to `(created_at, id)` composite cursors without breaking existing API consumers.

**Why fetch `limit+1`?** Avoids a `COUNT(*)` query — expensive on large tables. If you get back 51 rows and the limit is 50, there are more pages. If you get back ≤50, you're on the last page.

</details>

---

### Part C — SDET: Prove keyset consistency under concurrent inserts

<details><summary>Answer</summary>

```typescript
test("Keyset pagination: no duplicates or skips under concurrent writes", async ({
  request,
  citationFactory,
}) => {
  const userId = `KEYSET-${Date.now()}`;
  await citationFactory.createBulk(userId, 100); // seed 100 citations

  const collected: string[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  // Start concurrent inserts WHILE paginating — this would corrupt OFFSET pagination
  const concurrentInserts = (async () => {
    await new Promise((r) => setTimeout(r, 150)); // let pagination start first
    await citationFactory.createBulk(userId, 30); // insert 30 new rows mid-pagination
  })();

  // Paginate through all items
  do {
    const url =
      `/api/citations?userId=${userId}&limit=25` +
      (cursor ? `&cursor=${cursor}` : "");
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const ids: string[] = body.items.map((i: any) => i.id);
    collected.push(...ids);
    cursor = body.nextCursor ?? null;
    pageCount++;

    await new Promise((r) => setTimeout(r, 60)); // pace pages to allow inserts to interleave
  } while (cursor !== null);

  await concurrentInserts;

  // ── Assertions ──────────────────────────────────────────────────────────
  // 1. No duplicates
  const unique = new Set(collected);
  expect(
    unique.size,
    `DUPLICATE detected: collected ${collected.length} but only ${unique.size} unique`,
  ).toBe(collected.length);

  // 2. All original 100 records collected (concurrent inserts have higher IDs = above cursor)
  expect(collected.length).toBe(100);

  // 3. Correct page count
  expect(pageCount).toBe(4); // 100 / 25 = 4 pages exactly
});
```

**The proof**: Run the same test replacing keyset with OFFSET pagination — duplicates appear because concurrent inserts shift page boundaries. Keyset pagination is immune because the cursor anchors to the last seen ID, which does not move.

</details>

---

## Elite Round 6 — The Distributed Lock Deadlock

**Scenario**: Two API calls — `processCitationPayment(citationId)` and `refundCitation(citationId)` — must not run concurrently for the same citation. Without a lock, you get double-charge or corrupt refund state. Your team uses Redis via Redisson for distributed locking.

---

### Part A — DSA: Why naive locking causes deadlocks, and how lease-time prevents them

<details><summary>Answer</summary>

```
Deadlock scenario without lease-time:
  Thread A: acquires lock on CIT-001 → starts processing payment
  Thread A: CRASHES mid-processing (OOM, pod restart)
  Lock on CIT-001 is NEVER released → permanent deadlock
  Thread B: tries to acquire CIT-001 → waits forever → timeout cascade

Resource allocation graph:
  Thread A → holds Lock(CIT-001) → wants Lock(CIT-002)  [payment + refund in same txn]
  Thread B → holds Lock(CIT-002) → wants Lock(CIT-001)
  → CIRCULAR DEPENDENCY = deadlock

Prevention strategies:
  1. Lease time (TTL): lock auto-expires after N seconds even if holder crashes
     Redis: SET lock:CIT-001 worker-id NX PX 30000  (NX=only if not exists, PX=30s TTL)
     Even if worker dies, lock releases in 30s.

  2. Lock ordering: always acquire locks in a canonical order (sort IDs alphabetically)
     Thread A: lock(CIT-001) then lock(CIT-002)
     Thread B: lock(CIT-001) then lock(CIT-002)  ← same order, no circular dependency

  3. Try-lock with timeout: don't wait indefinitely
     if (!lock.tryLock(5, TimeUnit.SECONDS)) → fail fast with 409 Conflict
```

</details>

---

### Part B — Spring Boot: Implement a distributed lock with Redisson

<details><summary>Answer</summary>

```java
@Service
public class CitationPaymentService {

    private final RedissonClient redisson;
    private final PaymentProcessor paymentProcessor;

    @Transactional
    public PaymentResult processPayment(String citationId, PaymentRequest req) {
        // Lock key scoped to this specific citation
        String lockKey = "lock:citation:" + citationId;
        RLock lock = redisson.getLock(lockKey);

        boolean acquired = false;
        try {
            // tryLock(waitTime, leaseTime, unit)
            // waitTime  = how long to wait to acquire (fail fast if resource is busy)
            // leaseTime = auto-release even if holder crashes (deadlock prevention)
            acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);

            if (!acquired) {
                throw new CitationLockConflictException(
                    "Citation " + citationId + " is already being processed. Retry in 5s."
                );
            }

            // Critical section — only one thread globally can be here for this citationId
            return paymentProcessor.charge(citationId, req.getAmount());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CitationProcessingException("Lock acquisition interrupted", e);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock(); // safe unlock — only the acquirer can unlock
            }
        }
    }
}
```

**Why `lock.isHeldByCurrentThread()` in finally?** If `tryLock` returned false, calling `unlock()` throws `IllegalMonitorStateException`. The guard prevents this.

**Why `leaseTime = 30s`?** A payment that takes > 30 seconds is already broken (network timeout, external API hung). The lease time reflects the max acceptable processing time — not a guess.

**Why NOT use Spring's `@Lock`?** `@Lock` is JPA-level — it locks the DB row, not the distributed application layer. Two instances of the payment service on different pods would both execute. Redisson's lock is distributed — effective across all pods.

</details>

---

### Part C — SDET: Test lock exclusivity and conflict response

<details><summary>Answer</summary>

```typescript
test("Concurrent payment attempts on same citation: one succeeds, one gets 409", async ({
  request,
}) => {
  const citationId = `CIT-LOCK-${Date.now()}`;

  // Simulate the slow payment by stubbing the downstream to take 2 seconds
  // (in real tests, use WireMock with a fixedDelay)

  // Fire two concurrent payment requests for the SAME citation
  const [res1, res2] = await Promise.all([
    request.post(`/api/citations/${citationId}/payment`, {
      data: { amount: 150, method: "CREDIT_CARD" },
    }),
    request.post(`/api/citations/${citationId}/payment`, {
      data: { amount: 150, method: "CREDIT_CARD" },
    }),
  ]);

  const statuses = [res1.status(), res2.status()].sort();

  // One should succeed (200/201), one should get a lock conflict (409)
  expect(statuses).toEqual([200, 409]); // or [201, 409]

  // The 409 response should explain what happened
  const conflictRes = [res1, res2].find((r) => r.status() === 409)!;
  const conflictBody = await conflictRes.json();
  expect(conflictBody.error).toContain("already being processed");
  expect(conflictBody.retryAfterSeconds).toBeDefined();
});

test("Lock auto-releases after lease time if holder crashes", async ({
  request,
}) => {
  // In test env, leaseTime=2s (overridden via application-test.yml)
  const citationId = `CIT-CRASH-${Date.now()}`;

  // First request acquires lock and then "crashes" (request times out / connection reset)
  // Simulate by hitting an endpoint that acquires lock and hangs:
  const hangingPromise = request
    .post(`/api/citations/${citationId}/payment/slow`, {
      timeout: 500, // client-side timeout — simulates pod crash
      data: { amount: 150 },
    })
    .catch(() => null); // absorb the expected timeout error

  await hangingPromise;

  // Wait for lease to expire (2s in test, 30s in prod)
  await new Promise((r) => setTimeout(r, 2500));

  // After lease expires, a new request should succeed — NOT timeout waiting for the lock
  const retryRes = await request.post(`/api/citations/${citationId}/payment`, {
    data: { amount: 150, method: "CREDIT_CARD" },
  });
  expect(retryRes.status()).toBe(200);
});
```

</details>

---

## Elite Round 7 — Cache Invalidation Race Condition

**Scenario**: `GET /api/citations/{id}` is cached in Redis for 60 seconds (`@Cacheable`). When a citation is updated via `PUT`, `@CacheEvict` clears the cache. But you discover a subtle race: **users see stale data for 200ms after an update**. The root cause is a Spring transaction ordering bug.

---

### Part A — DSA: Why "cache invalidation is one of the two hard problems in CS"

<details><summary>Answer</summary>

```
The Two Hard Problems (Phil Karlton, 1996):
  1. Cache invalidation
  2. Naming things
  (And off-by-one errors)

The fundamental tension:
  CACHING requires: data stays in cache as long as it is VALID
  WRITING requires: cache is cleared as soon as data CHANGES
  CONCURRENCY makes this impossible to coordinate without trade-offs

Race condition in Spring @CacheEvict + @Transactional:

  Timeline:
    T1: Writer thread: BEGIN TRANSACTION
    T2: Writer: UPDATE citations SET status='PAID' WHERE id='CIT-001'
    T3: Writer: @CacheEvict fires → DELETE redis:citation:CIT-001  ← cache is now empty
    T4: Reader thread: CACHE MISS → SELECT FROM citations WHERE id='CIT-001'
                                  → reads UNCOMMITTED data (or old data if READ COMMITTED)
    T5: Reader: caches the result (may be old value if T4 saw pre-T2 state)
    T6: Writer: COMMIT
    T7: Cache now contains stale data that Reader cached at T4-T5

  The cache is invalidated BEFORE the transaction commits.
  A reader between T3 and T6 re-populates the cache with stale data.
  After T6 commits, the stale cache entry lives for another 60 seconds.
```

</details>

---

### Part B — Spring Boot: Identify the bug and apply the correct fix

<details><summary>Answer</summary>

**Buggy code**:

```java
@Service
public class CitationService {

    // BUG: @CacheEvict fires DURING the transaction (before commit)
    @Transactional
    @CacheEvict(value = "citations", key = "#id")
    public Citation updateStatus(String id, CitationStatus newStatus) {
        Citation c = repo.findById(id).orElseThrow();
        c.setStatus(newStatus);
        return repo.save(c);
    }
}
```

**Fix 1 — `@TransactionalEventListener` (evict AFTER commit)**:

```java
@Service
@Transactional
public class CitationService {

    private final ApplicationEventPublisher events;

    public Citation updateStatus(String id, CitationStatus newStatus) {
        Citation c = repo.findById(id).orElseThrow();
        c.setStatus(newStatus);
        Citation saved = repo.save(c);
        // Publish an event — listener fires AFTER transaction commits
        events.publishEvent(new CitationUpdatedEvent(id));
        return saved;
    }
}

@Component
public class CitationCacheInvalidator {

    private final CacheManager cacheManager;

    // TRANSACTION_COMMITTED: fires only after the DB commit succeeds
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCitationUpdated(CitationUpdatedEvent event) {
        Cache cache = cacheManager.getCache("citations");
        if (cache != null) cache.evict(event.getCitationId());
        // Now safe: DB has committed, cache is cleared, next read gets fresh data
    }
}
```

**Fix 2 — `@CacheEvict(afterInvocation = true)` + outer non-transactional coordinator**:

```java
// Non-transactional facade
@Service
public class CitationFacade {

    private final CitationRepository repo;
    private final Cache citationsCache;

    public Citation updateStatus(String id, CitationStatus status) {
        Citation saved = doUpdate(id, status); // commits here
        citationsCache.evict(id);              // evict AFTER commit
        return saved;
    }

    @Transactional
    private Citation doUpdate(String id, CitationStatus status) {
        Citation c = repo.findById(id).orElseThrow();
        c.setStatus(status);
        return repo.save(c);
    }
}
```

**Recommended**: Fix 1 (`@TransactionalEventListener`) — it is declarative, decoupled, and handles rollback correctly (if the transaction rolls back, the event is never published, so the cache is never incorrectly invalidated).

</details>

---

### Part C — SDET: Write a test that PROVES the race condition exists, then proves the fix works

<details><summary>Answer</summary>

```typescript
// Test 1: Proves the race condition EXISTS (run against BUGGY code)
test.skip("(Demonstrates bug) Stale cache after update — buggy implementation", async ({
  request,
}) => {
  // Seed: create a citation with status PENDING
  const createRes = await request.post("/api/citations", {
    data: { amount: 100 },
  });
  const { id } = await createRes.json();

  // Warm the cache
  await request.get(`/api/citations/${id}`);

  // Update the citation status
  await request.put(`/api/citations/${id}`, { data: { status: "PAID" } });

  // Immediately read — with the bug, @CacheEvict fires BEFORE commit,
  // then our read re-populates cache with stale data from an in-flight transaction
  const immediateRead = await request.get(`/api/citations/${id}`);
  const body = await immediateRead.json();

  // This assertion FAILS with the bug: body.status is 'PENDING' (stale)
  expect(body.status).toBe("PAID");
});

// Test 2: Proves the FIXED code is correct
test("After update, GET always returns fresh data with no stale window", async ({
  request,
}) => {
  const createRes = await request.post("/api/citations", {
    data: { amount: 100 },
  });
  const { id } = await createRes.json();

  // Warm the cache
  await request.get(`/api/citations/${id}`);

  // Update
  const updateRes = await request.put(`/api/citations/${id}`, {
    data: { status: "PAID" },
  });
  expect(updateRes.status()).toBe(200);

  // With @TransactionalEventListener + AFTER_COMMIT:
  // By the time PUT returns 200, the transaction has committed AND the cache is evicted.
  // The next GET MUST return PAID — no polling needed.
  const freshRead = await request.get(`/api/citations/${id}`);
  expect((await freshRead.json()).status).toBe("PAID");

  // Run 10 rapid GETs in parallel — none should return stale data
  const rapidReads = await Promise.all(
    Array.from({ length: 10 }, () => request.get(`/api/citations/${id}`)),
  );
  for (const r of rapidReads) {
    expect((await r.json()).status).toBe("PAID");
  }
});
```

</details>

---

## Elite Round 8 — API Versioning Breaking Change

**Scenario**: Your citation API v1 returns `{ "amount": 150 }`. Your team adds v2 which returns `{ "amount": 150, "currency": "USD", "amountInCents": 15000 }`. You must deploy v2 WITHOUT breaking existing v1 consumers. Prove it with a contract test.

---

### Part A — DSA: Dependency graph and the "breaking change" definition

<details><summary>Answer</summary>

```
API version dependency graph (topological view):

  [Consumer A: Mobile App v3.2]  ──────────────────┐
  [Consumer B: Partner Portal]  ───────────────────►│ /api/v1/citations
  [Consumer C: Legacy ETL job]  ───────────────────►│
                                                     │ [API Gateway]
  [Consumer D: Internal Dashboard] ────────────────►│ /api/v2/citations
  [Consumer E: New React App]    ──────────────────►│

Breaking change = a change that causes an existing consumer to fail without code changes.

Non-breaking (additive):
  + Adding new optional fields:  { amount, currency, amountInCents }
  + Adding new optional query params
  + Adding new endpoints

Breaking:
  - Removing fields:  { amount } → {}
  - Renaming fields:  { amount } → { totalAmount }
  - Changing types:   amount: 150 (number) → amount: "150" (string)
  - Changing HTTP status codes on existing paths
  - Removing enum values

The "topological sort" insight:
  Deploy order must respect the dependency direction.
  Rule: ALWAYS deploy the API with backward compatibility BEFORE updating consumers.
  Never: remove v1 before all consumers have migrated to v2.
```

</details>

---

### Part B — Spring Boot: Implement URL-based + content-negotiation versioning side by side

<details><summary>Answer</summary>

```java
// V1 Controller — original, must keep working
@RestController
@RequestMapping("/api/v1/citations")
public class CitationV1Controller {

    private final CitationService service;

    @GetMapping("/{id}")
    public CitationV1Response getCitation(@PathVariable String id) {
        Citation c = service.findById(id);
        return new CitationV1Response(c.getId(), c.getAmount()); // only amount
    }
}

// V1 Response — backward-compatible shape
public record CitationV1Response(String id, BigDecimal amount) {}

// V2 Controller — enriched response
@RestController
@RequestMapping("/api/v2/citations")
public class CitationV2Controller {

    private final CitationService service;

    @GetMapping("/{id}")
    public CitationV2Response getCitation(@PathVariable String id) {
        Citation c = service.findById(id);
        return new CitationV2Response(
            c.getId(),
            c.getAmount(),
            c.getCurrency(),
            c.getAmount().multiply(BigDecimal.valueOf(100)).longValue()
        );
    }
}

// V2 Response — extended shape (additive, non-breaking)
public record CitationV2Response(
    String id,
    BigDecimal amount,
    String currency,
    long amountInCents
) {}

// Content negotiation versioning (alternative — same URL, version in Accept header)
@GetMapping(value = "/{id}", produces = "application/vnd.company.api.v2+json")
public CitationV2Response getCitationV2(@PathVariable String id) { ... }

@GetMapping(value = "/{id}", produces = "application/vnd.company.api.v1+json")
public CitationV1Response getCitationV1(@PathVariable String id) { ... }
```

</details>

---

### Part C — SDET: Write a consumer contract test that prevents breaking v1

<details><summary>Answer</summary>

```typescript
// Consumer-Driven Contract Test (Pact-style) for v1
// This runs in the CONSUMER's test suite and publishes a "contract" (pact file)
// that the PROVIDER (citation API) must verify before any deployment.

test("v1 citation response contract: amount field must always be present as number", async ({
  request,
}) => {
  // Test against real v1 endpoint (or a provider stub)
  const res = await request.get("/api/v1/citations/CIT-CONTRACT-001");
  expect(res.status()).toBe(200);

  const body = await res.json();

  // CONTRACT: these fields MUST exist and MUST be these types
  // Any v2 change that removes or renames these will fail THIS test
  expect(typeof body.id).toBe("string");
  expect(typeof body.amount).toBe("number"); // NOT string, NOT object

  // CONTRACT: these fields must NOT appear in v1 (no accidental field leakage)
  expect(body.currency).toBeUndefined(); // v2 field must not bleed into v1
  expect(body.amountInCents).toBeUndefined(); // v2 field must not bleed into v1

  // CONTRACT: HTTP semantics
  expect(res.headers()["content-type"]).toContain("application/json");
});

test("v2 citation response is a strict superset of v1 (backward-compatible extension)", async ({
  request,
}) => {
  const [v1Res, v2Res] = await Promise.all([
    request.get("/api/v1/citations/CIT-CONTRACT-001"),
    request.get("/api/v2/citations/CIT-CONTRACT-001"),
  ]);

  const v1Body = await v1Res.json();
  const v2Body = await v2Res.json();

  // v2 must contain everything v1 has (superset)
  expect(v2Body.id).toBe(v1Body.id);
  expect(v2Body.amount).toBe(v1Body.amount); // same value, same type

  // v2 must have its additional fields
  expect(v2Body.currency).toBeDefined();
  expect(typeof v2Body.currency).toBe("string");
  expect(typeof v2Body.amountInCents).toBe("number");
  expect(v2Body.amountInCents).toBe(v1Body.amount * 100); // derived correctly
});
```

**Why this is elite**: These contract tests run in CI on every PR to the citation API. Before any developer can merge a change that removes `amount` or changes its type, this test fails — catching the breaking change before it reaches any consumer. This is the professional alternative to "we announced the deprecation in the docs."

</details>

---

**Navigation**: [← Mock Interview Simulations](../09_Mock_Interview_Simulations.md) | [📚 Index](../00_INDEX.md)


---

## Reality Check

**"Elite rounds test elite knowledge"** ? Elite rounds test INTEGRATION and judgment across domains, not obscure facts ([the-whole-curriculum, 13_Pattern_Composition]): the problem that spans DSA, system design, and production reasoning, the ambiguous problem that must be framed before solved, the trade-off argued across concerns. The difficulty is the cross-domain integration and the judgment (the [Enterprise 07] context-appropriate choice), not exotic knowledge � and the candidate who prepared by memorizing advanced facts is unready for the integration-and-judgment the elite rounds actually assess.

**"You need to be expert in every domain for these"** ? You need enough in each domain to REASON and integrate, plus the judgment to know your limits ([09_Career/07-08, 14_MM]): the honest "I would need to research the specifics, but the approach is X" over the confident-wrong, the strong fundamentals that let you reason in an adjacent domain even without deep expertise. Elite rounds reward the reasoning-and-integration and the intellectual honesty over false omniscience � "expert in everything" is impossible and not what they test, which is the [09_Career/02] need-to-know-everything trap at the interview level.

**"Cross-domain means the problem has one right answer combining everything"** ? Cross-domain problems have TRADE-OFF spaces where the "right" answer depends on priorities you clarify ([Enterprise 07, 06_System_Design]): the solution that optimizes latency versus consistency versus cost, the design whose best choice depends on the requirements you surface. Elite rounds reward navigating the trade-off space (clarify priorities, reason about the options, justify the choice) not finding the one combining-answer � treating them as having a single right answer misses the judgment-under-ambiguity they test.

**"Preparation for elite rounds is more advanced problems"** ? Preparation is INTEGRATION practice and the judgment that comes from breadth-plus-reflection ([the-whole-curriculum, 05_Problem_Solving/14]): the problems that span domains (these rounds), the reflection on trade-offs and decisions ([SRE postmortem] applied to your reasoning), the breadth across the curriculum that enables cross-domain connection. "More advanced problems" in one domain builds depth-not-integration � the elite-round skill is connecting domains and judging trade-offs, which is built by cross-domain practice and reflective breadth, not by harder single-domain problems.

**"Elite rounds are a different beast from real senior work"** ? Elite rounds SAMPLE exactly the cross-domain integration and judgment that senior/staff work requires ([21_SDET Ch62, Enterprise 07, 13_DE]): the staff engineer reasoning across the algorithm, the system, the operability, and the business trade-off (the [Career-Techno-Functional] translation) � the same integration the elite round compresses. Unlike the artificial parts of junior interviews ([01]), the elite round's cross-domain judgment maps closely to the actual senior work, which is why preparing for it (the integration, the trade-off reasoning, the breadth) builds the genuine senior capability, not just interview performance.
