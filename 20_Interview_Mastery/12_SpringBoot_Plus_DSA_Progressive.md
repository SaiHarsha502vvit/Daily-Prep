# 12. Spring Boot × DSA — The Algorithms Inside the Framework

**Navigation**: [← SDET × DSA](11_SDET_Plus_DSA_Progressive.md) | [📚 Index](00_INDEX.md) | [SDET × Spring Boot →](13_SDET_Plus_SpringBoot_Progressive.md)

**Cross-links:**
- [`07_Modern_Java/`](../07_Modern_Java/) — Spring Boot internals
- [`02_Data_Structures/`](../02_Data_Structures/) — DSA foundations
- [`10_Elite_Cross_Domain_Rounds.md`](10_Elite_Cross_Domain_Rounds.md) — applied elite challenges

---

> Spring Boot is not magic — it is algorithms in a framework. This file reveals the DSA beneath the annotations so you understand WHY Spring does what it does, and can debug, optimize, and design it deliberately.

---

## Table of Contents

1. [Topological Sort → Bean Initialization Order](#1-topological-sort--bean-initialization-order)
2. [Linked List → The Filter Chain](#2-linked-list--the-filter-chain)
3. [LRU Cache → JPA Second-Level Cache](#3-lru-cache--jpa-second-level-cache)
4. [Graph → Security Authorization Rules](#4-graph--security-authorization-rules)
5. [Sliding Window → Rate Limiting in Spring](#5-sliding-window--rate-limiting-in-spring)
6. [Finite State Machine → Spring Bean Lifecycle](#6-finite-state-machine--spring-bean-lifecycle)

---

## 1. Topological Sort → Bean Initialization Order

### 🧠 Foundation — Topological Sort (Brief Recap)

Given tasks with dependencies (A needs B before it can start), topological sort produces a valid execution order. If a cycle exists, no valid order is possible.

```
Tasks: A depends on B. B depends on C. No cycles.
Valid orders: C → B → A
```

---

### 🔍 The Spring Boot Connection

When your Spring application starts, it has hundreds of beans. Some beans DEPEND on others:
- `OrderService` needs `OrderRepository`
- `OrderRepository` needs `DataSource`
- `DataSource` needs `@ConfigurationProperties`

Spring must initialize them in dependency order. If it tried to create `OrderService` before `OrderRepository`, it would fail — the dependency isn't available yet.

**Spring internally runs a topological sort on the bean dependency graph at startup.** This is why Spring Boot starts correctly even with hundreds of interdependent beans — and why you get a `BeanCurrentlyInCreationException` when you accidentally create a circular dependency.

---

### 🗺️ How Spring Detects and Reports Circular Dependencies

```java
// This creates a circular dependency (Spring will refuse to start):
@Service
public class ServiceA {
    @Autowired ServiceB serviceB;  // A needs B
}

@Service
public class ServiceB {
    @Autowired ServiceA serviceA;  // B needs A → CYCLE!
}
```

```
Spring startup error:
  The dependencies of some of the beans in the application context
  form a cycle:
  serviceA → serviceB → serviceA
```

Spring's topological sort detects this cycle during its dependency resolution phase and fails fast — BEFORE running any of your code.

---

### 🗺️ How to Think About It (Problem-Solving)

```
When you see: BeanCurrentlyInCreationException
→ Draw the dependency graph for the involved beans
→ Find the cycle
→ Break it by one of:
   1. @Lazy on one of the autowired fields (defers instantiation)
   2. Extract the shared logic into a third bean (neither A nor B → both use C)
   3. Use events (ApplicationEventPublisher) instead of direct references
```

---

### ✍️ The Solution — Visualize and Break the Cycle

```java
// WRONG: Circular dependency
@Service
public class PaymentService {
    @Autowired NotificationService notifications; // PaymentService → NotificationService
}

@Service
public class NotificationService {
    @Autowired PaymentService payments; // NotificationService → PaymentService → CYCLE
}

// FIX 1: @Lazy — delay instantiation of one dependency
@Service
public class PaymentService {
    @Autowired @Lazy NotificationService notifications;
    // Spring creates a proxy — actual NotificationService is created when first called
}

// FIX 2: Extract shared logic (better architecture)
@Service
public class PaymentEventPublisher {
    @Autowired ApplicationEventPublisher events;

    public void publishPaymentProcessed(String paymentId) {
        events.publishEvent(new PaymentProcessedEvent(paymentId));
    }
}

@Service
public class PaymentService {
    @Autowired PaymentEventPublisher eventPublisher; // PaymentService → EventPublisher only
    // PaymentService no longer knows about NotificationService
}

@Service
public class NotificationService implements ApplicationListener<PaymentProcessedEvent> {
    // NotificationService listens for events — no dependency on PaymentService
    public void onApplicationEvent(PaymentProcessedEvent event) {
        sendEmailFor(event.getPaymentId());
    }
}
```

---

### 🎯 Similar Challenges

**Challenge A**: Draw the dependency graph for the following beans and find a valid initialization order:
```
UserService → UserRepository, CacheService
UserRepository → DataSource
CacheService → RedisTemplate
RedisTemplate → RedisConnectionFactory
DataSource → DataSourceProperties
```

<details><summary>Answer</summary>

```
Dependency graph (A → B means A depends on B):
  UserService → UserRepository
  UserService → CacheService
  UserRepository → DataSource
  CacheService → RedisTemplate
  RedisTemplate → RedisConnectionFactory
  DataSource → DataSourceProperties

In-degrees (how many things depend on this):
  DataSourceProperties: 0 (nothing depends on it — it IS depended upon by DataSource)

Wait — let me reframe: "depends on" means "must come AFTER".
So topological sort gives initialization order (reverse of dependency direction):

Nodes with no dependencies (nothing they need):
  DataSourceProperties, RedisConnectionFactory

Level 1 (can start immediately): DataSourceProperties, RedisConnectionFactory
Level 2: DataSource (needs DataSourceProperties), RedisTemplate (needs RedisConnectionFactory)
Level 3: UserRepository (needs DataSource), CacheService (needs RedisTemplate)
Level 4: UserService (needs both UserRepository and CacheService)

Valid order: DataSourceProperties → RedisConnectionFactory → DataSource → RedisTemplate → UserRepository → CacheService → UserService
```

</details>

---

**Challenge B**: You add a new bean `AuditService` that needs both `UserService` AND `NotificationService`. `NotificationService` needs `UserService`. Does this create a cycle? What is the new initialization order?

<details><summary>Answer</summary>

```
New dependencies:
  AuditService → UserService
  AuditService → NotificationService
  NotificationService → UserService

Graph (no cycles — both paths lead to UserService, not back from UserService):
  UserService has no dependencies (in this sub-graph)
  NotificationService → UserService
  AuditService → UserService, NotificationService

Valid order: UserService → NotificationService → AuditService
No cycle exists. AuditService is the "leaf" — it depends on everything but nothing depends on it.
```

</details>

---

## 2. Linked List → The Filter Chain

### 🧠 Foundation — What is a Linked List?

A linked list is a sequence of nodes where each node holds data AND a pointer to the next node.

```
[Node1: data="Auth"] → [Node2: data="Logging"] → [Node3: data="RateLimit"] → [Node4: data="Route"] → NULL
```

Key properties:
- O(1) insertion at head or tail (no shifting)
- O(n) traversal (must follow pointers)
- Each node only knows its IMMEDIATE successor — not the full chain

---

### 🔍 The Spring Boot Connection

Spring Security's filter chain and Spring MVC's interceptor chain are **linked lists of handler objects**. Each filter:
1. Does its work (auth, logging, rate limiting)
2. Calls `chain.doFilter(request, response)` — which passes control to the NEXT node

```
Request →
  [SecurityFilter] → calls chain.doFilter()
    [LoggingFilter] → calls chain.doFilter()
      [RateLimitFilter] → calls chain.doFilter()
        [DispatcherServlet] ← actual endpoint handler
      ← RateLimitFilter resumes (response logging)
    ← LoggingFilter resumes (log response time)
  ← SecurityFilter resumes (clear security context)
← Response sent
```

This is the **Chain of Responsibility** design pattern, implemented as a linked list.

---

### 🗺️ How to Think About It

```
When you see a filter/interceptor problem, think:
  1. What order do filters run? (linked list traversal order)
  2. What happens if a filter DOESN'T call chain.doFilter()? (short-circuit — stops traversal)
  3. How do I add a filter at a specific position? (@Order, addFilterBefore/After)
  4. What runs in the request phase vs response phase? (pre-chain vs post-chain logic)
```

---

### ✍️ The Solution — Building and Ordering a Custom Filter Chain

```java
// Filter 1: Authentication (must run FIRST — @Order(1))
@Component
@Order(1)
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        String token = req.getHeader("Authorization");

        if (token == null || !isValidJwt(token)) {
            res.setStatus(HttpStatus.UNAUTHORIZED.value());
            res.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;  // Short-circuit: DON'T call chain.doFilter() → stops here
        }

        // Set the authenticated user in security context
        SecurityContextHolder.getContext().setAuthentication(parseToken(token));
        chain.doFilter(req, res);  // Pass to next filter in the linked list
        SecurityContextHolder.clearContext();  // Runs AFTER the downstream chain returns
    }
}

// Filter 2: Request logging (runs after auth — @Order(2))
@Component
@Order(2)
public class RequestLoggingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);  // Structured logging context

        try {
            chain.doFilter(req, res);  // Invoke rest of chain (linked list traversal)
        } finally {
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("method={} uri={} status={} duration={}ms requestId={}",
                req.getMethod(), req.getRequestURI(), res.getStatus(), elapsed, requestId);
            MDC.clear();
        }
    }
}
```

**The linked list analogy made concrete**:
- `@Order(1)` = head of the list
- `chain.doFilter()` = `node.next()` — follow the pointer to the next handler
- NOT calling `chain.doFilter()` = `node.next = null` — cut the chain here (short-circuit)
- Code after `chain.doFilter()` = executed when "unwinding" the stack — like walking back through the list

---

### 🎯 Similar Challenges

**Challenge A**: You need a filter that compresses responses with gzip if the client sends `Accept-Encoding: gzip`. Where in the filter chain should this sit (relative to auth and logging)? What happens if it runs BEFORE logging?

<details><summary>Answer</summary>

```
Correct order:
  @Order(1): JwtAuthFilter       — must run first (reject invalid requests early)
  @Order(2): RequestLoggingFilter — log all requests (including rejected ones)
  @Order(3): GzipCompressionFilter — compress responses

If GzipCompressionFilter runs BEFORE RequestLoggingFilter:
  LoggingFilter tries to read the response body for logging
  But the response is already gzip-compressed → binary garbage in logs
  Also: logging the compressed Content-Length, not the real content size

The rule: filters that WRAP the response (modify output) should run LATER (higher @Order number) than filters that READ the response (logging, metrics). Otherwise you log the wrapped/modified version, not the original.
```

</details>

---

**Challenge B**: A filter that enforces a maximum request body size (e.g. 10MB) — which node in the linked list should it be, and should it call `chain.doFilter()` on success or failure?

<details><summary>Answer</summary>

```java
@Component
@Order(1) // Run EARLY — before auth, before parsing, before anything
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private static final int MAX_BYTES = 10 * 1024 * 1024; // 10MB

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        int contentLength = req.getContentLengthLong() > 0 ? (int) req.getContentLengthLong() : 0;

        if (contentLength > MAX_BYTES) {
            res.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value()); // 413
            res.getWriter().write("{\"error\":\"Request body exceeds 10MB limit\"}");
            return;  // SHORT-CIRCUIT — do NOT call chain.doFilter() on failure
        }

        chain.doFilter(req, res); // Call on SUCCESS — pass to next node
    }
}
```

Why EARLY? Failing fast on a 50MB body before auth validation saves CPU (JWT parsing) and memory (body buffering). The filter chain is a linked list — cutting it early is always cheaper than cutting it late.

</details>

---

## 3. LRU Cache → JPA Second-Level Cache

### 🧠 Foundation — What is an LRU Cache?

LRU = Least Recently Used. A cache with a fixed capacity that evicts the LEAST RECENTLY USED entry when full.

```
Cache capacity: 3
Operations:
  GET user:1 → MISS (not in cache)
  PUT user:1 → Cache: [user:1]
  PUT user:2 → Cache: [user:2, user:1]
  PUT user:3 → Cache: [user:3, user:2, user:1]
  PUT user:4 → Cache FULL → evict user:1 (least recently used)
               Cache: [user:4, user:3, user:2]
  GET user:2 → HIT → move to front (most recently used)
               Cache: [user:2, user:4, user:3]
```

**Implementation**: HashMap (O(1) lookup) + Doubly Linked List (O(1) move-to-front) working together.

```
HashMap: key → node reference
Doubly Linked List: head = most recently used, tail = least recently used

On GET hit:  unlink node from current position, link to head → O(1)
On PUT:      if key exists → update + move to head
             if new + full → remove tail node, insert at head → O(1)
```

---

### 🔍 The Spring Boot Connection

JPA/Hibernate's **Second-Level Cache (L2C)** is an LRU cache sitting between your application and the database.

```
Without L2C:
  Service calls repo.findById("CIT-001")
  → Hibernate: SELECT * FROM citations WHERE id = 'CIT-001'  ← always hits DB

With L2C (@Cache on entity):
  First call: MISS → DB query → store in L2C cache
  Next 100 calls: HIT → return from L2C cache → 0 DB queries
```

When the L2C cache is full, Hibernate evicts the LEAST RECENTLY USED entity — exactly LRU cache behaviour.

---

### ✍️ The Solution — Configure and Reason About JPA L2C

```java
// Entity marked as cacheable
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)  // ← enables L2C for this entity
public class Citation {
    @Id String id;
    String status;
    BigDecimal amount;
    // ... 20 more fields
}

// Repository — Hibernate will check L2C before hitting DB
@Repository
public interface CitationRepository extends JpaRepository<Citation, String> {
    // findById("CIT-001"):
    // 1. Check first-level cache (EntityManager session) → miss
    // 2. Check L2C (EhCache/Redis) → hit or miss
    // 3. If miss → DB query → store in L2C

    @QueryHints({@QueryHint(name = "org.hibernate.cacheable", value = "true")})
    @Query("SELECT c FROM Citation c WHERE c.status = :status")
    List<Citation> findByStatus(@Param("status") String status);
    // ↑ Also cache the query result (not just entities)
}
```

```yaml
# application.yml — configure EhCache as L2C provider
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true
          region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
        javax:
          cache:
            provider: org.ehcache.jsr107.EhcacheCachingProvider

# EhCache configuration (ehcache.xml):
# <cache alias="citations">
#   <heap units="entries">1000</heap>  ← LRU capacity: 1000 citation objects
#   <expiry><ttl unit="seconds">300</ttl></expiry>  ← evict after 5 minutes too
# </cache>
```

**The LRU algorithm is running inside EhCache**: when the 1001st citation is loaded, EhCache evicts the least recently accessed of the 1000 cached entries — exactly LRU.

---

### 🎯 Similar Challenges

**Challenge A**: Your Citation entity has a `@OneToMany` to Comments. If you cache the Citation entity with L2C, are the Comment objects also cached? What must you configure to cache the relationship?

<details><summary>Answer</summary>

```java
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Citation {
    @Id String id;

    @OneToMany(mappedBy = "citation", fetch = FetchType.LAZY)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)  // ← MUST annotate the collection separately
    List<Comment> comments;
}

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)  // ← AND annotate the target entity
public class Comment {
    @Id Long id;
    String content;
}
```

**Without `@Cache` on the collection**: the Citation entity is cached, but accessing `citation.getComments()` triggers a fresh DB query every time — defeating the purpose.

**With `@Cache` on both**: the first load caches the Citation entity AND its Comment collection. Subsequent accesses for the same `citationId` → 0 DB queries.

</details>

---

**Challenge B**: Implement a simple LRU Cache in Java from scratch using only a `HashMap` and a `LinkedList` (no `LinkedHashMap` shortcuts). Then explain why Spring's caching uses libraries like EhCache/Redis rather than a plain `HashMap`.

<details><summary>Answer</summary>

```java
public class LRUCache<K, V> {

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final LinkedList<Node<K, V>> list = new LinkedList<>();

    public LRUCache(int capacity) { this.capacity = capacity; }

    public V get(K key) {
        if (!map.containsKey(key)) return null;
        Node<K, V> node = map.get(key);
        list.remove(node);     // O(1) with node reference
        list.addFirst(node);   // move to front (most recently used)
        return node.value;
    }

    public void put(K key, V value) {
        if (map.containsKey(key)) {
            Node<K, V> node = map.get(key);
            node.value = value;
            list.remove(node);
            list.addFirst(node);
        } else {
            if (map.size() == capacity) {
                Node<K, V> lru = list.removeLast(); // evict LRU
                map.remove(lru.key);
            }
            Node<K, V> newNode = new Node<>(key, value);
            list.addFirst(newNode);
            map.put(key, newNode);
        }
    }

    record Node<K, V>(K key, V value) {
        V value; // mutable
        Node(K key, V value) { this.key = key; this.value = value; }
    }
}
```

**Why not use this in Spring?**
1. **Thread safety**: This implementation is NOT thread-safe. Multiple threads accessing the cache concurrently will corrupt the LinkedList. EhCache uses lock striping or lock-free structures.
2. **TTL**: Plain HashMap has no time-based eviction. EhCache supports TTL (time to live) and TTI (time to idle).
3. **Distributed**: Redis-backed L2C shares cache across multiple JVM instances. An in-process HashMap is local to one instance.
4. **Statistics**: EhCache tracks hit rate, miss rate, eviction count — essential for production monitoring.

</details>

---

## 4. Graph → Security Authorization Rules

### 🧠 Foundation — Directed Acyclic Graph (Brief)

A directed graph is nodes connected by directed edges (arrows). In a DAG (Directed Acyclic Graph), no path leads back to itself.

```
Role hierarchy (a DAG):
  SUPER_ADMIN → ADMIN → MANAGER → USER → GUEST

  SUPER_ADMIN has all permissions of ADMIN (and transitively MANAGER, USER, GUEST)
  This is role inheritance — modeled as a directed graph traversal.
```

---

### 🔍 The Spring Boot Connection

Spring Security models permissions as a graph:
- Roles inherit other roles (ADMIN inherits USER)
- Permissions are attached to roles
- `hasRole("ADMIN")` = traverse the role graph from ADMIN and check if the required permission is reachable

```java
// Explicit Spring Security role hierarchy
@Bean
public RoleHierarchy roleHierarchy() {
    RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
    hierarchy.setHierarchy(
        "ROLE_SUPER_ADMIN > ROLE_ADMIN > ROLE_MANAGER > ROLE_USER > ROLE_GUEST"
    );
    return hierarchy;
}
```

Spring internally resolves `ROLE_ADMIN` to: `{ROLE_ADMIN, ROLE_MANAGER, ROLE_USER, ROLE_GUEST}` via a DFS/BFS traversal of the hierarchy graph.

---

### ✍️ The Solution — Method-Level Security with Role Hierarchy

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl h = new RoleHierarchyImpl();
        // Graph edges (parent > child):
        h.setHierarchy("""
            ROLE_SUPER_ADMIN > ROLE_ADMIN
            ROLE_ADMIN > ROLE_MANAGER
            ROLE_MANAGER > ROLE_OFFICER
            ROLE_OFFICER > ROLE_USER
            """);
        return h;
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }
}

@RestController
public class CitationController {

    // Only MANAGER and above can approve citations
    // Spring traverses the graph: MANAGER → ADMIN → SUPER_ADMIN all qualify
    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping("/citations/{id}/approve")
    public void approveCitation(@PathVariable String id) { /* ... */ }

    // Only SUPER_ADMIN can delete
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/citations/{id}")
    public void deleteCitation(@PathVariable String id) { /* ... */ }

    // ANY authenticated user can view
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/citations/{id}")
    public Citation getCitation(@PathVariable String id) { /* ... */ }
}
```

**The graph traversal in action**:
A user with `ROLE_MANAGER` calls `POST /citations/{id}/approve`:
1. Spring checks `hasRole('MANAGER')`
2. Traverses role hierarchy from MANAGER upward: `{MANAGER, OFFICER, USER}`
3. Also traverses roles GRANTED to this user: `{MANAGER}` → expands to `{MANAGER, OFFICER, USER}`
4. `MANAGER` is in the set → access GRANTED

A user with `ROLE_OFFICER` calls the same endpoint:
1. `hasRole('MANAGER')` → expand OFFICER: `{OFFICER, USER}`
2. `MANAGER` NOT in set → access DENIED (403)

---

### 🎯 Similar Challenges

**Challenge A**: You need to add a new role `TEAM_LEAD` between `MANAGER` and `OFFICER`. `TEAM_LEAD` can approve citations (like MANAGER) but cannot create new users (which requires ADMIN). How do you represent this in the role hierarchy?

<details><summary>Answer</summary>

```java
// You CANNOT model this with a pure linear hierarchy
// because TEAM_LEAD needs MANAGER-level for citations but not for user creation.
// Solution: use @PreAuthorize with explicit role checks, not just hierarchy

h.setHierarchy("""
    ROLE_SUPER_ADMIN > ROLE_ADMIN
    ROLE_ADMIN > ROLE_MANAGER
    ROLE_MANAGER > ROLE_TEAM_LEAD
    ROLE_TEAM_LEAD > ROLE_OFFICER
    ROLE_OFFICER > ROLE_USER
    """);

// For citation approval — TEAM_LEAD inherits from hierarchy:
@PreAuthorize("hasRole('TEAM_LEAD')") // TEAM_LEAD and above (MANAGER, ADMIN, SUPER_ADMIN)
@PostMapping("/citations/{id}/approve")
public void approveCitation(@PathVariable String id) {}

// For user creation — explicitly require ADMIN (TEAM_LEAD is below ADMIN in hierarchy):
@PreAuthorize("hasRole('ADMIN')")     // only ADMIN and SUPER_ADMIN
@PostMapping("/users")
public void createUser(@RequestBody CreateUserRequest req) {}
```

**Key insight**: Role hierarchy (a graph) handles the MOST COMMON case (inheriting ALL permissions). For fine-grained control (some permissions but not others), you drop to explicit `@PreAuthorize` expressions. The graph handles the bulk; explicit checks handle the exceptions.

</details>

---

## 5. Sliding Window → Rate Limiting in Spring

### 🧠 Foundation — Applied Sliding Window

*[See full foundation in file 11, Topic 1]*

Quick recap: a sliding window tracks events within a rolling time period. As time advances, old events fall out of the window; new ones enter.

---

### 🔍 The Spring Boot Connection

Spring Cloud Gateway (and Resilience4j) implements rate limiting using the sliding window algorithm in Redis. When you annotate:

```java
@RateLimiter(name = "citations-api")
```

Under the hood, Resilience4j maintains a sliding window of N calls for each calling instance and computes the rate against it.

---

### ✍️ The Solution — Three Levels of Rate Limiting in Spring

```java
// Level 1: Application-level — custom filter (see Elite Round 1 for full implementation)
// Best for: per-user, per-endpoint, per-IP limits with custom logic

// Level 2: Resilience4j @RateLimiter — per-service call limit
// Best for: outbound API call throttling (e.g. "don't call Dynamics 365 more than 100/sec")
@Service
public class DynamicsClient {

    @RateLimiter(name = "dynamics-api", fallbackMethod = "rateLimitedFallback")
    public CitationData fetchCitation(String id) {
        return webClient.get().uri("/citations/{id}", id).retrieve().bodyToMono(CitationData.class).block();
    }

    private CitationData rateLimitedFallback(String id, RequestNotPermitted ex) {
        throw new ApiRateLimitExceededException("Dynamics API rate limit hit for " + id);
    }
}
```

```yaml
resilience4j:
  ratelimiter:
    instances:
      dynamics-api:
        limitForPeriod: 100           # 100 calls allowed
        limitRefreshPeriod: 1s         # per 1 second
        timeoutDuration: 100ms         # wait up to 100ms for a "slot" before failing
```

```java
// Level 3: Spring Cloud Gateway — API Gateway rate limiting (Redis-backed, distributed)
// Best for: public APIs with multi-instance deployments
@Bean
public RouteLocator routes(RouteLocatorBuilder builder,
                           RedisRateLimiter rateLimiter) {
    return builder.routes()
        .route("citations-api", r -> r.path("/api/citations/**")
            .filters(f -> f
                .requestRateLimiter(c -> c
                    .setRateLimiter(rateLimiter)
                    .setKeyResolver(exchange ->
                        // Rate limit by user ID from JWT header
                        Mono.just(exchange.getRequest().getHeaders()
                            .getFirst("X-User-Id")))
                ))
            .uri("lb://citation-service"))
        .build();
}

@Bean
public RedisRateLimiter redisRateLimiter() {
    return new RedisRateLimiter(10, 20, 1);
    // replenishRate=10 (tokens/sec), burstCapacity=20 (max tokens), requestedTokens=1
    // This implements TOKEN BUCKET (variant of sliding window) in Redis
}
```

---

### 🎯 Similar Challenges

**Challenge A**: Your citation API has two tiers of users: `PREMIUM` (100 req/10s) and `STANDARD` (10 req/10s). The rate limiter must apply different limits based on the user tier read from the JWT. Write the key resolver and the rate limiter selector logic.

<details><summary>Answer</summary>

```java
@Bean
public KeyResolver tierBasedKeyResolver() {
    return exchange -> {
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        String tier = jwtService.extractTier(exchange.getRequest().getHeaders().getFirst("Authorization"));
        // Key includes BOTH userId and tier → different limits per tier per user
        return Mono.just(tier + ":" + userId);
    };
}

// In Spring Cloud Gateway config:
// Use conditional filters based on the tier claim
// OR: use a custom filter that selects different RateLimiter configs based on tier

@Component
public class TieredRateLimitFilter extends AbstractGatewayFilterFactory<Object> {

    private final RedisRateLimiter premiumLimiter = new RedisRateLimiter(100, 200, 1);
    private final RedisRateLimiter standardLimiter = new RedisRateLimiter(10, 20, 1);

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String tier = jwtService.extractTier(exchange.getRequest());
            RedisRateLimiter limiter = "PREMIUM".equals(tier) ? premiumLimiter : standardLimiter;
            return limiter.isAllowed("route-id", exchange.getRequest().getHeaders().getFirst("X-User-Id"))
                .flatMap(response -> {
                    if (!response.isAllowed()) {
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        return exchange.getResponse().setComplete();
                    }
                    return chain.filter(exchange);
                });
        };
    }
}
```

</details>

---

## 6. Finite State Machine → Spring Bean Lifecycle

### 🧠 Foundation — What is a Finite State Machine?

A FSM has:
- A finite set of **states** (e.g. CREATED, ACTIVE, DESTROYED)
- **Transitions**: rules for moving from one state to another
- **Events**: what triggers a transition

```
Bean Lifecycle FSM:
  [DEFINITION] → (context refresh) → [INSTANTIATED]
  [INSTANTIATED] → (dependency injection) → [POPULATED]
  [POPULATED] → (@PostConstruct) → [INITIALIZED]
  [INITIALIZED] → (context close) → [DESTROYING]
  [DESTROYING] → (@PreDestroy) → [DESTROYED]
```

At each state, specific callbacks fire.

---

### 🔍 The Spring Boot Connection

Every Spring bean goes through a deterministic FSM during application startup and shutdown. Understanding this FSM tells you EXACTLY when your initialization code runs and when to use which annotation.

---

### ✍️ The Solution — Hooking Into the Spring Bean Lifecycle FSM

```java
@Service
public class CitationCacheWarmer implements
    BeanPostProcessor,          // hooks into ALL beans' lifecycle
    InitializingBean,           // called at INITIALIZED state
    DisposableBean,             // called at DESTROYING state
    ApplicationListener<ContextRefreshedEvent> {  // called after ALL beans initialized

    private List<Citation> warmCache;

    // ── State: INSTANTIATED (constructor called) ────────────────────────────
    public CitationCacheWarmer() {
        log.info("State: INSTANTIATED — constructor called. No dependencies available yet.");
    }

    // ── State: POPULATED (dependencies injected) ───────────────────────────
    @Autowired
    private CitationRepository repo;
    // ^ Spring injects this AFTER constructor

    // ── State: INITIALIZED (Init callbacks) ───────────────────────────────
    @PostConstruct  // Runs AFTER injection, BEFORE bean is ready for use
    public void init() {
        log.info("State: INITIALIZED via @PostConstruct — dependencies are available now");
        warmCache = repo.findTop100ByOrderByCreatedAtDesc();
        log.info("Pre-warmed {} citations into in-memory cache", warmCache.size());
    }

    @Override
    public void afterPropertiesSet() {
        // Same timing as @PostConstruct — InitializingBean interface alternative
        // Prefer @PostConstruct (less coupling to Spring API)
    }

    // ── All beans initialized (ContextRefreshedEvent) ─────────────────────
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        log.info("ALL beans initialized — safe to call other services here");
        // @PostConstruct runs during each bean's own lifecycle
        // ContextRefreshedEvent fires AFTER all beans are fully initialized
        // Use this when your init logic depends on OTHER beans being initialized
    }

    // ── State: DESTROYING (@PreDestroy / DisposableBean) ──────────────────
    @PreDestroy  // Runs on application shutdown BEFORE bean is garbage-collected
    public void cleanup() {
        log.info("State: DESTROYING — releasing resources");
        warmCache.clear();
        // Close connections, flush caches, release file handles
    }
}
```

**The FSM decision guide**:

| Callback | When it fires | Use for |
|---|---|---|
| Constructor | INSTANTIATED — no dependencies | Primitive initialization only |
| `@Autowired` field | POPULATED | Injected dependencies |
| `@PostConstruct` | INITIALIZED — after injection | Cache warming, connection setup |
| `ContextRefreshedEvent` | ALL beans ready | Cross-bean initialization |
| `@PreDestroy` | DESTROYING — before shutdown | Resource cleanup, graceful drain |

---

### 🎯 Similar Challenges

**Challenge A**: Your `CitationCacheWarmer` needs to wait until the database is fully migrated (Flyway runs migrations on startup). Flyway is also a Spring bean. How do you ensure `CitationCacheWarmer.init()` runs AFTER Flyway has applied all migrations?

<details><summary>Answer</summary>

```java
@Service
@DependsOn("flyway")  // ← Spring bean initialization depends on the "flyway" bean
public class CitationCacheWarmer {

    @PostConstruct
    public void init() {
        // Guaranteed: Flyway has already run all migrations before this fires
        warmCache = repo.findTop100ByOrderByCreatedAtDesc();
    }
}
```

**How `@DependsOn` works in the FSM**: Spring's topological sort places the `flyway` bean BEFORE `citationCacheWarmer` in the initialization order. `citationCacheWarmer`'s `@PostConstruct` is guaranteed to fire after `flyway`'s initialization is complete.

**Alternative**: Listen for `FlywayMigrationScriptFailedEvent` and only warm the cache if migration succeeded.

</details>

---

**Navigation**: [← SDET × DSA](11_SDET_Plus_DSA_Progressive.md) | [📚 Index](00_INDEX.md) | [SDET × Spring Boot →](13_SDET_Plus_SpringBoot_Progressive.md)
