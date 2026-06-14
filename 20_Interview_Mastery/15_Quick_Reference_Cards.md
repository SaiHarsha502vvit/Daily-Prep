# 15. Quick Reference Cards — Open This Before Every Interview

**Navigation**: [📚 Index](00_INDEX.md) | [Anti-Patterns →](16_Anti_Pattern_Gallery.md)

> **How to use**: 30 minutes before an interview, read this top to bottom. It activates everything you already know.

---

## Card 1 — Which Test Slice Annotation? (Decision Tree)

```
Is your app WebFlux?
│
├─ YES ──────────────────────────────────────────────────────────────►  WebTestClient
│                                                                        (use @SpringBootTest + reactive stack)
│
└─ NO
   │
   ├─ Testing HTTP layer only (no DB, no service internals)?
   │   └─ YES ──────────────────────────────────────────────────────►  @WebMvcTest
   │           (loads Controllers, Filters, MockMvc; mocks @Service)
   │
   ├─ Testing DB / JPA queries only (no HTTP layer)?
   │   └─ YES ──────────────────────────────────────────────────────►  @DataJpaTest
   │           (in-memory H2 by default; loads @Repository + JPA;
   │            @Transactional rolls back after each test)
   │
   ├─ Testing Jackson serialisation / deserialisation only?
   │   └─ YES ──────────────────────────────────────────────────────►  @JsonTest
   │           (loads ObjectMapper + @JsonComponent; nothing else)
   │
   ├─ Testing a Kafka consumer end-to-end?
   │   └─ YES ──────────────────────────────────────────────────────►  @SpringBootTest + @EmbeddedKafka
   │           (full context; embedded broker; no Docker needed)
   │
   ├─ Testing full stack with real HTTP (fire-and-forget)?
   │   └─ YES ──────────────────────────────────────────────────────►  @SpringBootTest(webEnvironment = RANDOM_PORT)
   │           (binds real port; use TestRestTemplate or WebTestClient)
   │
   └─ Need real PostgreSQL (not H2)?
       └─ YES ──────────────────────────────────────────────────────►  @DataJpaTest or @SpringBootTest
                                                                        + @Testcontainers (PostgreSQL container)
                                                                        (annotate with @AutoConfigureTestDatabase(
                                                                         replace = NONE))
```

### Annotation Reference Table

| Annotation                     | Context loaded                                             | Startup time | When to use                                      |
| ------------------------------ | ---------------------------------------------------------- | ------------ | ------------------------------------------------ |
| `@WebMvcTest`                  | Controllers, filters, `MockMvc`, Spring Security (partial) | 0.5 – 2 s    | HTTP layer in isolation; service layer mocked    |
| `@DataJpaTest`                 | JPA, `@Repository`, in-memory DB (H2 default)              | 1 – 3 s      | Query correctness; no web, no services           |
| `@JsonTest`                    | `ObjectMapper`, `@JsonComponent`                           | < 0.5 s      | Serialisation / deserialisation contracts        |
| `@SpringBootTest`              | Full application context                                   | 3 – 15 s     | Integration tests; Kafka, full HTTP, multi-layer |
| `@SpringBootTest(RANDOM_PORT)` | Full context + embedded Tomcat on random port              | 3 – 15 s     | Real HTTP round-trips; redirect/cookie tests     |
| `@EmbeddedKafka` (combined)    | As above + in-process Kafka broker                         | 3 – 15 s     | Consumer/producer flow without Docker            |
| `@Testcontainers` (combined)   | As above + Docker container lifecycle                      | 10 – 30 s    | Production-identical PostgreSQL / Redis / Kafka  |

---

## Card 2 — Which HTTP Test Client? (Decision Tree)

```
Do you need a real HTTP round-trip (actual TCP socket)?
│
├─ YES ──► requires @SpringBootTest(webEnvironment = RANDOM_PORT)
│          │
│          ├─ App is WebFlux (reactive)?
│          │   └─ YES ──────────────────────────────────────────────►  WebTestClient
│          │
│          ├─ Need to test redirects or cookies?
│          │   └─ YES ──────────────────────────────────────────────►  TestRestTemplate
│          │           (follows redirects; cookie jar built-in)
│          │
│          ├─ Need to test file uploads (multipart)?
│          │   └─ YES ──────────────────────────────────────────────►  TestRestTemplate  (or WebTestClient)
│          │
│          └─ Need streaming / SSE?
│              └─ YES ──────────────────────────────────────────────►  WebTestClient
│                      (consumeWith / expectBodyList for SSE)
│
└─ NO ──► In-process mock dispatch (no TCP; fastest)
           │
           └─ App is Servlet (Spring MVC)?
               └─ YES ──────────────────────────────────────────────►  MockMvc
                       (use @WebMvcTest or @AutoConfigureMockMvc)
```

### API Comparison Table

| Operation              | MockMvc                                                                     | WebTestClient                                         | TestRestTemplate                                                   |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| POST with JSON body    | `mockMvc.perform(post("/url").contentType(APPLICATION_JSON).content(json))` | `client.post().uri("/url").bodyValue(dto).exchange()` | `restTemplate.postForEntity("/url", dto, Resp.class)`              |
| Assert HTTP status     | `.andExpect(status().isOk())`                                               | `.expectStatus().isOk()`                              | `assertThat(resp.getStatusCode()).isEqualTo(OK)`                   |
| Assert JSON path       | `.andExpect(jsonPath("$.id").value(1))`                                     | `.expectBody().jsonPath("$.id").isEqualTo(1)`         | `JsonPath.read(resp.getBody(), "$.id")`                            |
| Assert response header | `.andExpect(header().string("X-Rate", "10"))`                               | `.expectHeader().valueEquals("X-Rate", "10")`         | `assertThat(resp.getHeaders().getFirst("X-Rate")).isEqualTo("10")` |
| Real TCP socket?       | ❌ No                                                                       | ✅ Yes (with RANDOM_PORT)                             | ✅ Yes (requires RANDOM_PORT)                                      |
| Reactive support?      | ❌ No                                                                       | ✅ Yes                                                | ❌ No                                                              |

---

## Card 3 — Which Cache Strategy? (Decision Tree)

```
Is the data IMMUTABLE (reference data: countries, currencies, config)?
│
├─ YES ──────────────────────────────────────────────────────────────►  READ_ONLY
│          (no lock; fastest; throws on attempted write;
│           safe for clustered caches)
│
└─ NO
   │
   ├─ Updates are RARE and brief staleness is acceptable?
   │   └─ YES ──────────────────────────────────────────────────────►  NONSTRICT_READ_WRITE
   │           (no lock; evicts on write; tiny stale window possible;
   │            good for low-concurrency catalogues)
   │
   ├─ Updates happen regularly and consistency matters?
   │   └─ YES ──────────────────────────────────────────────────────►  READ_WRITE  ← most common
   │           (soft lock during update; prevents dirty reads;
   │            works for most entity caches in production)
   │
   └─ Financial data, JTA transactions, or XA needed?
       └─ YES ──────────────────────────────────────────────────────►  TRANSACTIONAL
               (full JTA integration; cache changes participate in
                transaction; most expensive; use Infinispan / JBoss Cache)
```

### Write Behaviour Reference Table

| Strategy               | Lock on write?          | Invalidation timing               | Dirty read possible? | Use case                        |
| ---------------------- | ----------------------- | --------------------------------- | -------------------- | ------------------------------- |
| `READ_ONLY`            | None                    | Never (no writes)                 | No                   | Static reference data           |
| `NONSTRICT_READ_WRITE` | None                    | After commit completes            | Yes (tiny window)    | Low-update catalogues           |
| `READ_WRITE`           | Soft lock (placeholder) | Lock released after commit        | No                   | Standard transactional entities |
| `TRANSACTIONAL`        | Full JTA lock           | On transaction rollback or commit | No                   | Financial / XA environments     |

---

## Card 4 — Which Rate Limiting Algorithm? (Decision Tree)

```
Do you need strict accuracy with no boundary (window edge) attacks?
│
├─ YES ──────────────────────────────────────────────────────────────►  Sliding Window Log
│          (store every request timestamp in Redis ZSET;
│           ZREMRANGEBYSCORE to expire old entries;
│           ZCARD to count; pipeline for atomicity;
│           O(log N) per request; highest memory cost)
│
└─ NO
   │
   ├─ Need simple counter that resets at fixed intervals?
   │   └─ YES ──────────────────────────────────────────────────────►  Fixed Window Counter
   │           (INCR + EXPIRE in Redis; O(1); cheap;
   │            vulnerable to burst at window boundary:
   │            2× rate possible in 1 second straddling reset)
   │
   ├─ Need to allow bursting up to N then throttle smoothly?
   │   └─ YES ──────────────────────────────────────────────────────►  Token Bucket
   │           (refill tokens at constant rate; consume on request;
   │            burst allowed up to bucket capacity;
   │            used by AWS API Gateway, Stripe, Guava RateLimiter)
   │
   └─ Need smooth, even request rate (no bursting at all)?
       └─ YES ──────────────────────────────────────────────────────►  Leaky Bucket
               (queue + fixed drain rate; excess requests queued
                or dropped; used in traffic shaping / QoS)
```

### Algorithm Comparison Table

| Algorithm            | Allows bursting      | Boundary attack vulnerable | Space per user        | Time per request |
| -------------------- | -------------------- | -------------------------- | --------------------- | ---------------- |
| Fixed Window Counter | Yes (2× at boundary) | ✅ Yes                     | O(1)                  | O(1)             |
| Sliding Window Log   | No                   | ❌ No                      | O(requests in window) | O(log N)         |
| Token Bucket         | Yes (up to capacity) | ❌ No                      | O(1)                  | O(1)             |
| Leaky Bucket         | No                   | ❌ No                      | O(queue size)         | O(1)             |

---

## Card 5 — DSA Complexity Cheat Sheet

| Structure           | Access     | Search   | Insert         | Delete          | Space  | Use in SDET / Spring Boot                          |
| ------------------- | ---------- | -------- | -------------- | --------------- | ------ | -------------------------------------------------- |
| `HashMap`           | —          | O(1) avg | O(1) avg       | O(1) avg        | O(n)   | Frequency maps, dedup, idempotency key store       |
| `HashSet`           | —          | O(1) avg | O(1) avg       | O(1) avg        | O(n)   | Visited tracking, seen-set for deduplication       |
| `Array`             | O(1)       | O(n)     | O(n)           | O(n)            | O(n)   | Fixed buffers, leaky bucket queue backing          |
| `LinkedList`        | O(n)       | O(n)     | O(1) head/tail | O(1) known node | O(n)   | LRU doubly-linked list; deque for sliding window   |
| `Stack`             | O(1) top   | O(n)     | O(1)           | O(1)            | O(n)   | Iterative DFS, bracket matching, undo              |
| `Queue`             | O(1) front | O(n)     | O(1)           | O(1)            | O(n)   | BFS, Kafka consumer queue, task scheduling         |
| `MinHeap`           | O(1) min   | O(n)     | O(log n)       | O(log n)        | O(n)   | K-smallest, Dijkstra priority, scheduling          |
| `MaxHeap`           | O(1) max   | O(n)     | O(log n)       | O(log n)        | O(n)   | K-largest, sliding window maximum                  |
| `BST` (balanced)    | O(log n)   | O(log n) | O(log n)       | O(log n)        | O(n)   | Ordered traversal, rank queries                    |
| `Trie`              | O(k)       | O(k)     | O(k)           | O(k)            | O(n·k) | Prefix search, autocomplete, IP routing            |
| `Graph` (adj. list) | O(1) node  | O(V+E)   | O(1) edge      | O(E)            | O(V+E) | Dependency graph, Kafka topic graph, test ordering |

> k = key length, V = vertices, E = edges

---

## Card 6 — Spring Boot Interview Keywords (60-Second Activator)

Use these exact phrases. Interviewers pattern-match on vocabulary.

**Filter Chain**

- "chain of responsibility pattern"
- "linked list traversal — each filter calls `chain.doFilter()`"
- "extend `OncePerRequestFilter` to prevent double execution on async dispatch"
- "short-circuit — return early without calling `chain.doFilter()` to block the request"
- "`SecurityFilterChain` bean replaces `WebSecurityConfigurerAdapter` in Spring Security 6"

**Bean Lifecycle**

- "dependency graph resolved via topological sort"
- "`@PostConstruct` runs after dependency injection, before the bean is published to the context"
- "circular dependency → `@Lazy` or restructure to break the cycle"
- "`AFTER_COMMIT` fires after the transaction commits, not `AFTER_INVOCATION` — use for cache eviction"
- "prototype scope creates a new instance per injection point; singleton is the default"

**JPA L2 Cache**

- "LRU eviction when region reaches max entries"
- "`READ_WRITE` concurrency strategy issues a soft lock during the update"
- "separate cache region for `@OneToMany` collections — do not conflate with entity region"
- "`@Cache(usage = READ_WRITE)` on the entity; `@Cache` again on the collection"
- "Ehcache / Caffeine as the L2C provider via `hibernate.cache.region.factory_class`"

**Rate Limiting**

- "sliding window log stores timestamps in a Redis ZSET"
- "`ZREMRANGEBYSCORE` + `ZCARD` in a pipeline for atomic multi-command execution"
- "return `429 Too Many Requests` with `Retry-After` header per RFC 6585"
- "token bucket allows burst; leaky bucket enforces smooth rate"

**Circuit Breaker**

- "three-state FSM: `CLOSED → OPEN → HALF_OPEN`"
- "fail-fast in `OPEN` state — returns fallback immediately without calling downstream"
- "thundering herd prevention — only one probe request allowed in `HALF_OPEN`"
- "`slowCallRateThreshold` triggers opening on latency spikes, not just errors"
- "Resilience4j replaces Hystrix (Netflix OSS end-of-life)"

**Kafka Consumer**

- "at-least-once delivery guarantee"
- "offset committed after processing — crash before commit causes redelivery"
- "idempotency key in the message payload or headers prevents duplicate processing"
- "`@RetryableTopic` — exponential backoff to retry topics before DLT"
- "`@DltHandler` method handles messages that exhausted all retries"

---

## Card 7 — SDET Interview Keywords (60-Second Activator)

**Polling / Async Assertions**

- "adaptive intervals — start short, back off to avoid tight-loop CPU waste"
- "time budget — total allowed wait tracked in the outer loop"
- "sliding window — reuse the last N readings rather than re-scanning from the start"
- "`Awaitility.await().atMost(...).until(...)` — never `Thread.sleep` in production tests"
- "`expect.poll` (Playwright) — declarative, retry-aware assertion vs fragile `setTimeout`"

**Deduplication**

- "`Set<String>` for O(1) membership check — standard dedup for single-field IDs"
- "composite key `userId + requestId` concatenation for multi-field uniqueness"
- "idempotency key stored in Redis with TTL — prevents re-processing across service restarts"

**Test Ordering**

- "topological sort on the dependency graph of test modules"
- "Kahn's algorithm — process zero-in-degree nodes first, decrement in-degree on removal"
- "in-degree tracks how many prerequisites a test has"
- "cycle detected when queue empties before all nodes are processed"

**WireMock**

- "request matcher — URL, method, header, body pattern"
- "response definition — status, body, latency, fault injection"
- "`verify(exactly(1), postRequestedFor(urlEqualTo(...)))` — assert call count"
- "`Scenario` API for stateful stubs — STARTED → state transitions model multi-step flows"

**Flakiness Detection**

- "frequency map of `testId → pass/fail` over N runs"
- "flaky = pass rate between 20 % and 80 % across repeated runs"
- "`CountDownLatch` for async coordination — never poll `Thread.sleep` in async tests"
- "deterministic test ID from input hash — prevents non-determinism from UUID generation"

---

## Card 8 — The 5-Point Answer Framework

For **any** interview question, answer in this exact order:

```
1. RESTATE
   "So you're asking about X in the context of Y — let me confirm I understand the constraint."
   Purpose: buys thinking time; shows communication maturity.

2. CONCEPT
   "At its core, this is a [data structure / algorithm / pattern] problem because [invariant]."
   Purpose: signals depth; shows you see the abstraction under the question.

3. TRADE-OFFS
   "The naive approach is [O(n²) scan / fixed window counter / full context load].
    It fails because [boundary attack / high memory / slow startup].
    So instead, I use [sliding window log / token bucket / @WebMvcTest]."
   Purpose: demonstrates engineering judgment, not just memorisation.

4. CODE
   Write the key 3–5 lines that capture the insight.
   Purpose: proves you can implement, not just discuss.

5. VERIFICATION
   "I'd test this by [specific test case that exercises the edge case]."
   Purpose: closes the loop; SDET interviewers reward this step.
```

### Worked Example — Rate Limiter Problem

**Interviewer**: "Design a rate limiter that allows 100 requests per user per minute and handles window boundary attacks."

---

**1 — RESTATE**

> "So you need per-user limiting at 100 req/min, and the boundary attack means a fixed window won't work — a user could fire 100 requests at 00:59 and 100 at 01:00, getting 200 in two seconds. Correct?"

**2 — CONCEPT**

> "This is a sliding window log problem. I store a sorted set of request timestamps per user. The invariant: the count of timestamps within [now − 60s, now] is always the true request count, regardless of where the clock ticks."

**3 — TRADE-OFFS**

> "Fixed window counter is O(1) space but vulnerable. Sliding window log is O(requests-per-window) space and O(log N) time — acceptable for 100 req/min. If memory is critical, sliding window counter approximates the log with two buckets at O(1) space."

**4 — CODE**

```java
// Redis pipeline — atomic multi-command
String key = "rl:" + userId;
long now = System.currentTimeMillis();
long windowStart = now - 60_000;

pipeline.zremrangeByScore(key, 0, windowStart); // evict expired
pipeline.zadd(key, now, UUID.randomUUID().toString()); // record request
pipeline.zcard(key);                                   // count in window
pipeline.expire(key, 61);                              // TTL cleanup

long count = (Long) pipeline.syncAndReturnAll().get(2);
if (count > 100) {
    response.setStatus(429);
    response.setHeader("Retry-After", "60");
}
```

**5 — VERIFICATION**

> "I'd write a test that fires 100 requests at second 59, then 1 more at second 61 — expects 200 OK. Then fires 100 at second 59 and 1 at second 60 — expects 429. I'd use `@EmbeddedRedis` or Testcontainers Redis."

---

## Card 9 — Common Numbers to Know

When an interviewer asks _"is this fast enough?"_ — cite real numbers.

| Operation                   | Typical latency | Notes                                             |
| --------------------------- | --------------- | ------------------------------------------------- |
| Redis round-trip (local)    | ~0.2 ms         | In-process pipeline amortises this further        |
| PostgreSQL query (indexed)  | ~2 ms           | Cold cache can be 10–50× higher                   |
| Kafka publish (async)       | ~5 ms           | Sync `send().get()` blocks; use async + callback  |
| HTTP round-trip (loopback)  | ~1 ms           | Real network adds 20–200 ms depending on distance |
| Spring full context startup | 3 – 15 s        | Varies with component scan scope and beans        |
| `@WebMvcTest` startup       | 0.5 – 2 s       | Partial context; fastest for HTTP layer tests     |
| `@DataJpaTest` startup      | 1 – 3 s         | JPA + H2; faster than full context                |
| `@SpringBootTest` startup   | 3 – 15 s        | Full context; reused across test class by Spring  |
| Testcontainers (PostgreSQL) | 10 – 30 s       | Docker pull cached after first run                |

### Why these numbers matter

- **Redis at 0.2 ms** means a sliding-window-log rate limiter with 3 Redis commands adds < 1 ms overhead — acceptable for a 200 ms SLA endpoint.
- **Kafka at 5 ms async** means you should never call `future.get()` on the publish in the hot path.
- **Full context at 15 s** is why `@WebMvcTest` (2 s) pays off in large CI pipelines with hundreds of test classes.

---

## Card 10 — One-Line Definitions (Rapid Fire)

For when the interviewer says _"define X in one sentence"_.

**LRU Cache**

> "A fixed-capacity cache that evicts the least recently accessed entry, implemented as `HashMap` + `DoublyLinkedList` for O(1) access, insertion, and eviction."

**Topological Sort**

> "An ordering of a DAG where every node appears before all nodes that depend on it; Kahn's algorithm detects cycles via in-degree tracking — a non-empty remainder after processing signals a cycle."

**Sliding Window**

> "A variable-width or variable-position range that moves through data, reusing previous computation to achieve O(n) instead of O(n×k) — the invariant is that removing and adding one element at the boundary maintains correctness."

**Circuit Breaker**

> "A 3-state FSM (`CLOSED → OPEN → HALF_OPEN`) that fails fast when downstream failure rate exceeds a threshold, preventing cascade failures and allowing recovery via a controlled probe request in `HALF_OPEN`."

**Idempotency**

> "An operation that produces the same result whether applied once or N times; achieved via a unique idempotency key checked against a durable store (Redis / DB) before processing, returning the cached result on duplicates."

**At-Least-Once Delivery**

> "Kafka's guarantee that every message is delivered to the consumer at least once; duplicates are possible if the consumer crashes after processing but before committing the offset — handle via idempotent consumers."

**WireMock**

> "An HTTP server stub that intercepts outbound calls in tests, allowing simulation of downstream responses including errors, delays, and stateful multi-step flows without requiring a real external service."

**Testcontainers**

> "A library that spins up real Docker containers (PostgreSQL, Kafka, Redis) managed by the JUnit test lifecycle, providing production-identical infrastructure that eliminates H2 / in-memory divergence."

**Soft Lock (JPA L2C)**

> "A placeholder marker that Hibernate inserts into the L2 cache region during a `READ_WRITE` update, preventing other threads from reading a stale value while the database write and cache refresh are in flight."

**`OncePerRequestFilter`**

> "A Spring base class that guarantees a filter's `doFilterInternal` executes exactly once per logical request, even when the request is dispatched multiple times internally (e.g., forward, async, error dispatch)."

---

**Navigation**: [📚 Index](00_INDEX.md) | [Anti-Patterns →](16_Anti_Pattern_Gallery.md) | [Incident Lessons →](17_Production_Incident_Lessons.md)
