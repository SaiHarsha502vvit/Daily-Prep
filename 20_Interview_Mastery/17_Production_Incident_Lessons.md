# Production Incident Lessons

> Engineers remember stories. Use these incidents to anchor technical concepts and signal production experience in interviews.

---

## Incident 1: "The Boundary Attack" — Rate Limiter

**Domain**: DSA + Spring Boot  
**Concept taught**: Fixed-window vs sliding-window rate limiting  
**Severity**: P2 — a bot script exploited the boundary, sending 200 API calls per second instead of the allowed 10

---

### 📟 The Alert

```
FIRING [P2] api.request.rate{endpoint='/api/citations', user='BOT-USER-99'} > 1000 rpm
Current value: 1200 rpm | Threshold: 600 rpm | Window: last 60s
Source: Grafana → api-gateway-metrics → rate_limiter_violations_total
```

---

### 🕵️ The Investigation Timeline

```
T+0min:  Grafana fires: BOT-USER-99 exceeding 1200 rpm on /api/citations.
T+5min:  On-call pulls request logs for BOT-USER-99. Sees spikes — then gaps — then spikes.
T+10min: Timestamp analysis shows bursts clustered at second boundaries:
         23:59:59.850 → 10 requests
         00:00:00.150 → 10 more requests
         Two windows, one burst: 20 requests in 300ms.
T+15min: Root cause confirmed — fixed-window counter resets exactly on the clock second.
         10 req at t=0.999s (valid, window 1) + 10 req at t=1.001s (valid, window 2) = 20 req in 2ms.
T+20min: Mitigation: temporarily block BOT-USER-99 at the API gateway level.
T+60min: Sliding-window implementation deployed using Redis ZSET.
```

---

### 🔍 Root Cause — Technical Deep Dive

The rate limiter used a **fixed-window counter**: a Redis key with a 1-second TTL, incremented per request. The counter resets when the key expires — precisely on the clock second.

**The boundary exploit:**

A bot detected this pattern and timed its bursts across the window boundary. Because each window of 10 was respected in isolation, no individual window triggered the limit, but **20 requests fired within 2 milliseconds**.

**Wrong code that caused it:**

```java
// RateLimiterService.java — BROKEN fixed-window implementation
public boolean isAllowed(String userId) {
    String key = "rate:" + userId + ":" + (System.currentTimeMillis() / 1000);
    Long count = redisTemplate.opsForValue().increment(key);
    if (count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.SECONDS); // TTL resets the window
    }
    return count <= MAX_REQUESTS_PER_SECOND; // MAX = 10
}
```

**Why it breaks:** `System.currentTimeMillis() / 1000` groups all requests in the same wall-clock second under the same key. A request at `999ms` and a request at `1001ms` belong to different keys — each starts a fresh count of 0. There is no memory across the boundary.

**Algorithmic analysis:**

- Fixed window: O(1) time and space per request. Simple. Fast. Exploitable.
- The invariant requires: at no point in time should any rolling 1-second window contain more than N requests.
- Fixed window only enforces: within each fixed epoch, count ≤ N. That is a weaker invariant.

---

### 💡 The Fix

Replace the fixed-window counter with a **sliding-window log** using a Redis ZSET (sorted set). The score is the timestamp in milliseconds; the range query removes expired entries before counting.

```java
// RateLimiterService.java — FIXED sliding-window log
public boolean isAllowed(String userId) {
    String key = "rate:sliding:" + userId;
    long now = System.currentTimeMillis();
    long windowStart = now - WINDOW_MS; // WINDOW_MS = 1000

    redisTemplate.execute(new SessionCallback<>() {
        @Override
        public Object execute(RedisOperations ops) {
            ops.multi();
            // Remove all entries older than the window
            ops.opsForZSet().removeRangeByScore(key, 0, windowStart);
            // Add the current request with timestamp as score
            ops.opsForZSet().add(key, String.valueOf(now), now);
            // Count entries in the current window
            ops.opsForZSet().count(key, windowStart, now);
            ops.expire(key, 2, TimeUnit.SECONDS); // safety TTL
            ops.exec();
            return null;
        }
    });

    Long count = redisTemplate.opsForZSet().count(key, windowStart, now);
    return count != null && count <= MAX_REQUESTS_PER_WINDOW; // MAX = 10
}
```

**Why this works:** The ZSET tracks every request timestamp in the last N milliseconds. Before counting, stale entries are pruned. The count reflects the true rolling window — no boundary exists to exploit.

**Tradeoff:** O(log N) per request instead of O(1). For high-throughput APIs, a **sliding-window counter** (hybrid: two fixed windows with weighted interpolation) gives O(1) with ~98% accuracy and is Redis-friendly.

---

### ✅ The Test That Would Have Prevented This

```javascript
// rateLimiter.boundary.spec.js — Playwright/Node test
const { test, expect } = require('@playwright/test');

test('sliding window blocks boundary exploit — 10+12 requests across second boundary', async ({ request }) => {
    const userId = 'test-bot-boundary';
    const responses = [];

    // Fire 10 requests at t=900ms (0.1s before the "second" boundary)
    const firstBatch = Array.from({ length: 10 }, () =>
        request.get(`/api/citations`, { headers: { 'X-User-Id': userId } })
    );
    const firstResults = await Promise.all(firstBatch);
    responses.push(...firstResults);

    // Simulate the boundary: wait 200ms (now at t=1100ms)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fire 12 more requests (in a new fixed-window "second" — but same sliding window)
    const secondBatch = Array.from({ length: 12 }, () =>
        request.get(`/api/citations`, { headers: { 'X-User-Id': userId } })
    );
    const secondResults = await Promise.all(secondBatch);
    responses.push(...secondResults);

    const allowed = responses.filter(r => r.status() === 200).length;
    const throttled = responses.filter(r => r.status() === 429).length;

    // Sliding window: only 10 total allowed across the full rolling second
    // The 11th through 22nd (12 in the second batch) must all be throttled
    expect(allowed).toBeLessThanOrEqual(10);
    expect(throttled).toBeGreaterThanOrEqual(12);
});
```

**How the test catches the bug:** With the broken fixed-window implementation, all 10+12 = 22 requests return 200 (first batch fills window 1, second batch fills window 2). The sliding window implementation throttles requests 11–22 — the test assertion `allowed ≤ 10` fails on the broken code and passes on the fix.

---

### 📚 What This Teaches

- **Fixed-window is O(1) but exploitable at boundaries** — a well-known tradeoff documented in rate-limiter literature and in API gateway vendors like Cloudflare and Kong.
- **Sliding-window log is exact but O(log N) per request** — acceptable for low-volume APIs; too expensive for millions of requests per second.
- **Sliding-window counter** is the production sweet spot: two counters + weighted interpolation, O(1), ~98% accurate.
- **Redis ZSET** is the canonical data structure for sliding-window log because sorted-set range queries naturally model time windows.
- **Boundary conditions in time-based systems are always attack surfaces** — test them explicitly with time-manipulated input.

---

### 🎯 Interview Connection

**Question it answers:** "Tell me about a time you debugged a performance or security issue in production."

**Signal it sends:**
- You understand algorithm invariants, not just API surface.
- You know the fixed-window / sliding-window / sliding-counter tradeoff spectrum.
- You reach for Redis as a production primitive and understand ZSET semantics.
- You write tests that simulate real attack patterns, not just happy-path flows.

**Opening line:** *"We had a P2 incident where a bot script discovered our rate limiter was a fixed-window counter. They sent 10 requests at 0.999 seconds and 10 more at 1.001 seconds — 20 requests in 2 milliseconds, both windows technically valid. Here's what we changed and why..."*

---

---

## Incident 2: "The Ghost Cache" — JPA L2C Stale Data

**Domain**: Spring Boot + DSA (LRU Cache)  
**Concept taught**: READ_ONLY vs READ_WRITE cache strategy + collection-level cache annotation  
**Severity**: P1 — users saw old citation status for 5 minutes after payment, thought payment failed, paid again → double charges

---

### 📟 The Alert

```
FIRING [P1] payment.duplicate.rate > 1.0%
Current value: 2.3% | Threshold: 0.5% | Window: last 15min
Source: Datadog → payments-service → duplicate_payment_attempts_total
Support queue: 47 tickets in 20 minutes — "I was charged twice"
```

---

### 🕵️ The Investigation Timeline

```
T+0min:  Payment duplicate rate alert fires at 2.3% (baseline 0.01%).
T+5min:  Support queue floods with "I paid twice." Finance confirms double charges.
T+10min: Backend trace logs show DB has correct status='PAID' for affected citations.
         API response shows status='PENDING' for the same citation IDs.
T+12min: Developer spots the divergence: DB = PAID, API = PENDING.
         Suspects caching. Checks Hibernate stats endpoint.
T+15min: Root cause: @Cache(usage=CacheConcurrencyStrategy.READ_ONLY) on Citation entity.
         READ_ONLY cache NEVER evicts on update — data schema migration 3 weeks ago
         changed status enum values; cache was seeded with pre-migration values.
T+18min: Secondary issue found: @OneToMany payments collection NOT annotated with @Cache
         so collection always queries DB — status was stale but payment records were fresh.
         Users saw PENDING status even after payment recorded → they retried.
T+20min: Mitigation: redis-cli FLUSHDB on the L2C Redis region. Duplicates stop immediately.
T+60min: Fix deployed: READ_WRITE strategy + TTL + collection cache annotation.
```

---

### 🔍 Root Cause — Technical Deep Dive

Hibernate Second-Level Cache (L2C) stores entity state between sessions. The cache strategy controls what happens on write:

| Strategy | On Update | On Delete | Safe for mutable data? |
|---|---|---|---|
| `READ_ONLY` | Never evicts | Never evicts | No |
| `NONSTRICT_READ_WRITE` | Evicts after tx commit | Evicts after tx commit | Only if stale reads are acceptable |
| `READ_WRITE` | Locks + updates atomically | Evicts | Yes |

The team chose `READ_ONLY` for performance (no lock overhead) without realizing that a data migration would populate the cache with pre-migration `status` values. After migration, every cache hit returned the old status.

**Wrong code that caused it:**

```java
// Citation.java — BROKEN cache annotation
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY) // Never evicts — broken for mutable status
public class Citation {

    @Id
    private Long id;

    private String status; // PENDING, PAID, FAILED — mutable

    @OneToMany(mappedBy = "citation", fetch = FetchType.LAZY)
    // Missing @Cache annotation — collection always queries DB fresh
    private List<Payment> payments;
}
```

**Why the two-layer inconsistency mattered:** The `payments` collection hit the DB every time (no L2C) and showed correct data. The `status` field came from cache and was stale. Users saw: "I have a payment record but status says PENDING." They paid again.

**Algorithmic lens:** The L2C is an LRU-eviction cache at the ORM layer. `READ_ONLY` removes the "update" path from the cache invalidation logic. This is correct for truly immutable data (country codes, product categories) and catastrophic for mutable state.

---

### 💡 The Fix

```java
// Citation.java — FIXED cache annotation
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE) // Locks entry during update, evicts on delete
public class Citation {

    @Id
    private Long id;

    private String status;

    @OneToMany(mappedBy = "citation", fetch = FetchType.LAZY)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE) // Cache the collection too — consistent strategy
    private List<Payment> payments;
}
```

```yaml
# application.yml — add TTL safety net
spring:
  jpa:
    properties:
      hibernate:
        cache:
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
          use_second_level_cache: true
          default_cache_concurrency_strategy: READ_WRITE
  cache:
    jcache:
      config: classpath:ehcache.xml
```

```xml
<!-- ehcache.xml — TTL safety net prevents cache serving data older than 5 minutes -->
<cache alias="com.example.Citation">
    <expiry>
        <ttl unit="minutes">5</ttl>
    </expiry>
</cache>
```

**Why READ_WRITE works:** Before updating the cache entry, Hibernate acquires a soft lock on it. If another session reads during the update, it falls through to the DB. After the transaction commits, the cache entry is refreshed. No more ghost data.

---

### ✅ The Test That Would Have Prevented This

```java
// CitationCacheIntegrationTest.java — JUnit 5 + Spring Boot Test
@SpringBootTest
@Transactional
class CitationCacheIntegrationTest {

    @Autowired
    private CitationRepository citationRepository;

    @Autowired
    private EntityManager entityManager;

    @PersistenceContext
    private EntityManager em;

    @Test
    @DisplayName("L2C must not serve stale status after update in separate transaction")
    void cacheDoesNotReturnStaleStatusAfterUpdate() {
        // GIVEN: citation saved and cached with status=PENDING
        Citation citation = new Citation();
        citation.setStatus("PENDING");
        citationRepository.saveAndFlush(citation);
        Long id = citation.getId();

        // Load once to populate the L2C
        citationRepository.findById(id).orElseThrow();

        // WHEN: update status in a separate transaction (simulates payment service)
        updateStatusInNewTransaction(id, "PAID");

        // Evict the EntityManager first-level cache to force L2C read
        entityManager.clear();

        // THEN: reload must reflect the updated status from L2C or DB — never stale
        Citation reloaded = citationRepository.findById(id).orElseThrow();
        assertThat(reloaded.getStatus())
            .as("L2C must not serve stale PENDING status after payment updated it to PAID")
            .isEqualTo("PAID");
    }

    @Test
    @DisplayName("Payments collection must be consistent with entity status after update")
    void paymentsCollectionConsistentWithStatus() {
        Citation citation = new Citation();
        citation.setStatus("PENDING");
        citationRepository.saveAndFlush(citation);
        Long id = citation.getId();

        // Load to seed cache
        Citation loaded = citationRepository.findById(id).orElseThrow();
        assertThat(loaded.getStatus()).isEqualTo("PENDING");

        // Add payment and update status in new transaction
        addPaymentAndUpdateStatus(id, "PAID");

        entityManager.clear();

        Citation reloaded = citationRepository.findById(id).orElseThrow();

        // Both entity status AND collection must reflect the update — not one stale, one fresh
        assertThat(reloaded.getStatus()).isEqualTo("PAID");
        assertThat(reloaded.getPayments()).isNotEmpty();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void updateStatusInNewTransaction(Long id, String status) {
        Citation c = em.find(Citation.class, id);
        c.setStatus(status);
    }
}
```

**How the test catches the bug:** With `READ_ONLY`, after `updateStatusInNewTransaction`, the L2C is never invalidated. `entityManager.clear()` clears the L1 cache (session cache), forcing a read from L2C. The L2C returns `PENDING`. The assertion `isEqualTo("PAID")` fails — exposing the bug before production.

---

### 📚 What This Teaches

- **Cache strategy is a correctness contract, not a performance knob** — choosing READ_ONLY for mutable data is a semantic bug, not a tuning choice.
- **Hibernate L2C is an LRU cache at the ORM layer** — understanding its eviction policy is the same skill as understanding any cache eviction.
- **Inconsistent cache annotations across entity + collection create split-brain reads** — the entity is stale; the collection is fresh; the UI shows contradictory data.
- **Data migrations can silently corrupt long-lived caches** — migration plans must include cache invalidation steps.
- **TTL is a safety net, not a solution** — 5-minute TTL would have limited damage but not prevented it; READ_WRITE is the correct fix.

---

### 🎯 Interview Connection

**Question it answers:** "Describe a production bug that was hard to debug. What was the root cause?"

**Signal it sends:**
- You understand ORM internals beyond `@Cacheable`.
- You think in layers: L1 (session) → L2 (process/Redis) → DB.
- You can trace a user-visible symptom (double charge) to a data structure contract violation (wrong cache strategy).
- You write integration tests that simulate multi-transaction scenarios.

**Opening line:** *"We had a P1 where users were double-charged because our Hibernate L2C was configured READ_ONLY on a mutable status field. The cache never evicted after payments updated the DB. Users saw PENDING, panicked, paid again. Here's what the divergence looked like in the trace logs..."*

---

---

## Incident 3: "The Kafka Déjà Vu" — Duplicate Payment Emails

**Domain**: Spring Boot + SDET  
**Concept taught**: Kafka at-least-once delivery + idempotency key pattern  
**Severity**: P2 — 15,000 duplicate payment confirmation emails sent during a rolling deploy

---

### 📟 The Alert

```
FIRING [P2] email.delivery.count / payment.completion.count > 1.5
Current value: 2.07 | Threshold: 1.1 | Window: last 10min
Source: Grafana → notification-service → email_sent_total vs payment_completed_total
Support queue: "I got charged twice" — 312 tickets in 30 minutes
```

---

### 🕵️ The Investigation Timeline

```
T+0min:  Email-to-payment ratio alert fires at 2.07x.
T+3min:  Support queue: "I received two payment confirmations" / "Was I charged twice?"
         (Users were NOT double-charged — emails created panic.)
T+7min:  Notification service logs show duplicate event IDs in the processing log:
         INFO  Processing payment.completed event=EVT-88812 paymentId=PAY-4401
         INFO  Processing payment.completed event=EVT-88812 paymentId=PAY-4401  ← same
T+10min: Kafka consumer group logs show partition rebalance during rolling deploy:
         WARN  Rebalancing consumer group notification-service-cg
         INFO  Partition payment.completed-3 assigned to pod notification-v2-xyz
         INFO  Partition payment.completed-3 assigned to pod notification-v1-abc  ← old pod
T+12min: Root cause: old pod (v1) and new pod (v2) both consumed the same partition offsets
         briefly during rebalance. No idempotency guard — emailService.send() called twice.
T+15min: Mitigation: restart all old pods (force rebalance to new pods only). Emails stop.
T+60min: Idempotency key check deployed. @RetryableTopic added for transient failures.
```

---

### 🔍 Root Cause — Technical Deep Dive

Kafka guarantees **at-least-once delivery** by default: if a consumer crashes after processing a message but before committing the offset, the message is re-delivered to the new consumer. This is safe only if the consumer is **idempotent** — calling it twice produces the same result as calling it once.

During a rolling deploy, Kubernetes terminates v1 pods while v2 pods start. The Kafka consumer group rebalances partitions between live consumers. For a brief window, both v1 and v2 may hold the same partition before rebalance completes. Both process the same offsets.

**Wrong code that caused it:**

```java
// PaymentEventConsumer.java — BROKEN, no idempotency guard
@KafkaListener(topics = "payment.completed", groupId = "notification-service-cg")
public void handlePaymentCompleted(PaymentCompletedEvent event) {
    // No check: "have I already processed this event?"
    emailService.send(
        event.getUserEmail(),
        "Payment Confirmed",
        buildEmailBody(event)
    );
    // Kafka auto-commit happens after method returns
    // But if two pods are both in this method for the same event...
}
```

**Why idempotency is a data structure problem:** Idempotency requires a set membership check — "is this event ID already in the processed set?" Redis provides O(1) SET/SETNX operations that make this a distributed atomic check-and-set.

---

### 💡 The Fix

```java
// PaymentEventConsumer.java — FIXED with idempotency key
@KafkaListener(topics = "payment.completed", groupId = "notification-service-cg")
public void handlePaymentCompleted(PaymentCompletedEvent event) {
    String idempotencyKey = "email:sent:" + event.getEventId();

    // Atomic check-and-set: SET key 1 NX EX 86400
    // Returns true only if the key did NOT exist (first time processing)
    Boolean isFirstProcessing = redisTemplate.opsForValue()
        .setIfAbsent(idempotencyKey, "1", Duration.ofHours(24));

    if (Boolean.FALSE.equals(isFirstProcessing)) {
        log.info("Duplicate event detected, skipping email. eventId={}", event.getEventId());
        return; // Idempotent: skip without error
    }

    try {
        emailService.send(
            event.getUserEmail(),
            "Payment Confirmed",
            buildEmailBody(event)
        );
    } catch (Exception e) {
        // If email fails after idempotency key is set, we must clean up
        // OR use @RetryableTopic so the same event retries but idempotency key prevents double-send
        redisTemplate.delete(idempotencyKey);
        throw e; // Re-throw for Kafka retry
    }
}
```

```java
// For transient failures, use @RetryableTopic instead of raw retry
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "payment.completed", groupId = "notification-service-cg")
public void handlePaymentCompleted(PaymentCompletedEvent event) {
    // idempotency check as above
}
```

---

### ✅ The Test That Would Have Prevented This

```java
// PaymentEventConsumerIdempotencyTest.java — JUnit 5 + Mockito + Embedded Kafka
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "payment.completed")
class PaymentEventConsumerIdempotencyTest {

    @Autowired
    private KafkaTemplate<String, PaymentCompletedEvent> kafkaTemplate;

    @MockBean
    private EmailService emailService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Test
    @DisplayName("Email must be sent exactly once even when same event published 3 times")
    void duplicateEventsProduceExactlyOneEmail() throws InterruptedException {
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
            .eventId("EVT-88812")
            .paymentId("PAY-4401")
            .userEmail("user@example.com")
            .amount(BigDecimal.valueOf(99.99))
            .build();

        CountDownLatch latch = new CountDownLatch(1);

        doAnswer(invocation -> {
            latch.countDown();
            return null;
        }).when(emailService).send(any(), any(), any());

        // Publish the same event 3 times (simulates at-least-once redelivery + rolling deploy)
        kafkaTemplate.send("payment.completed", event.getEventId(), event);
        kafkaTemplate.send("payment.completed", event.getEventId(), event);
        kafkaTemplate.send("payment.completed", event.getEventId(), event);

        // Wait for at least one email to be processed
        boolean processed = latch.await(10, TimeUnit.SECONDS);
        assertThat(processed).as("Email should be sent at least once").isTrue();

        // Allow brief window for any duplicate processing
        Thread.sleep(500);

        // Verify exactly ONE email was sent despite 3 publishes
        verify(emailService, times(1)).send(
            eq("user@example.com"),
            eq("Payment Confirmed"),
            any()
        );
    }
}
```

**How the test catches the bug:** Without the idempotency guard, three publishes trigger three `emailService.send()` calls. The `verify(emailService, times(1))` assertion fails with `Wanted 1 time but was 3 times` — catching the duplicate-send bug in CI before it reaches production.

---

### 📚 What This Teaches

- **Kafka at-least-once delivery is the default** — every consumer must be idempotent or duplicate events will produce duplicate side effects.
- **Rolling deploys cause consumer group rebalances** — this is not a bug in Kubernetes, it is expected behavior that your consumers must handle.
- **Redis SETNX is the canonical distributed idempotency primitive** — atomic, O(1), TTL-capable.
- **@RetryableTopic separates transient failure retry from duplicate delivery** — retry is for network errors; idempotency is for duplicate events.
- **CountDownLatch is the correct concurrency primitive in async consumer tests** — never `Thread.sleep` as the primary wait mechanism.

---

### 🎯 Interview Connection

**Question it answers:** "How do you handle duplicate message processing in a Kafka consumer?" or "Tell me about a distributed systems bug you fixed."

**Signal it sends:**
- You understand Kafka's delivery guarantees at the contract level.
- You know that rolling deploys are a source of rebalance-triggered duplicate delivery.
- You reach for Redis SETNX as an idempotency tool.
- You test async consumers with EmbeddedKafka + CountDownLatch — not mocked queues.

**Opening line:** *"During a routine rolling deploy, 15,000 users received duplicate payment confirmation emails. No double charges — but the support panic was real. The root cause was Kafka's at-least-once guarantee colliding with a rebalance window. Here's the idempotency pattern we added..."*

---

---

## Incident 4: "The Cascade" — N+1 Under Load

**Domain**: Spring Boot + DSA  
**Concept taught**: N+1 problem under production load; query count as O(N) round-trips  
**Severity**: P1 — DB CPU 100%, all API endpoints returning 504 Gateway Timeout for 8 minutes

---

### 📟 The Alert

```
FIRING [P1] db.connections.active = 200 (pool exhausted)
FIRING [P1] db.query.duration.p99 > 30s
FIRING [P1] api.http.5xx.rate > 40% — all endpoints affected
Source: Datadog → rds-mysql-prod → connections, query_time_p99
Source: Datadog → api-gateway → http_response_code_total
```

---

### 🕵️ The Investigation Timeline

```
T+0min:  Three alerts fire simultaneously: pool exhausted, p99 > 30s, 40% 5xx rate.
         All endpoints affected — not one service, the entire DB is overwhelmed.
T+3min:  On-call pulls RDS slow query log. Top query:
         SELECT * FROM citations WHERE account_id = ? [appeared 10,847 times in 60s]
T+6min:  APM trace shows getAccountDashboard() taking 45 seconds for one user request.
         Trace waterfall: 200+ sequential DB calls in one HTTP request.
T+10min: Code review: getAccountsWithCitations() called in a loop inside AccountDashboardService.
         Each account triggers a lazy-load of its citations collection.
         200 accounts × 50 citations each = 10,200 queries per dashboard page load.
T+12min: Load: 100 concurrent users × 10,200 queries = 1,020,000 queries/minute.
         DB connection pool: 200 connections. Each query holds a connection for 30s+.
         All connections occupied. New requests queue. Queue fills. 504s begin.
T+15min: Mitigation: disable the dashboard endpoint. DB CPU drops from 100% to 8%.
         Other endpoints recover immediately.
T+60min: Fix deployed: @EntityGraph JOIN FETCH replaces lazy loading.
         Dashboard re-enabled. p99 = 120ms. Zero 504s.
```

---

### 🔍 Root Cause — Technical Deep Dive

The N+1 problem is a **query complexity problem**: instead of one query that fetches N entities and their related data, the code issues 1 query for the entities and then N additional queries — one per entity — to fetch their associations.

**Algorithmic framing:**

```
Lazy loading strategy:  O(N) round-trips to DB  — same as O(N) for a linked-list traversal
JOIN FETCH strategy:    O(1) round-trips to DB  — same as O(1) for a direct lookup
```

Under low load: 200 queries in 200ms — slow but functional.  
Under 100 concurrent users: 200 × 100 = 20,000 queries simultaneously — DB dies.

**Wrong code that caused it:**

```java
// AccountDashboardService.java — BROKEN N+1
public DashboardDTO getAccountDashboard(Long tenantId) {
    List<Account> accounts = accountRepository.findAllByTenantId(tenantId); // Query 1

    return accounts.stream()
        .map(account -> {
            // DANGER: account.getCitations() triggers a SELECT per account
            // JPA lazy-loads the collection here — Query 2, 3, 4, ..., N+1
            List<Citation> citations = account.getCitations();
            return buildAccountSummary(account, citations);
        })
        .collect(Collectors.toList());
}
```

```java
// Account.java — lazy loading is the default, making N+1 invisible in unit tests
@Entity
public class Account {
    @Id
    private Long id;

    @OneToMany(mappedBy = "account", fetch = FetchType.LAZY) // LAZY = N+1 trap
    private List<Citation> citations;
}
```

**Why unit tests miss this:** Unit tests mock `accountRepository` and `account.getCitations()` — no actual DB queries fire. The N+1 is invisible until integration testing with a real data set.

---

### 💡 The Fix

```java
// AccountRepository.java — FIXED with @EntityGraph
public interface AccountRepository extends JpaRepository<Account, Long> {

    // @EntityGraph forces JOIN FETCH — one query fetches accounts AND citations
    @EntityGraph(attributePaths = {"citations"})
    List<Account> findAllByTenantId(Long tenantId);
}
```

Alternatively, use JPQL with JOIN FETCH explicitly:

```java
// AccountRepository.java — JPQL alternative
@Query("SELECT a FROM Account a JOIN FETCH a.citations WHERE a.tenantId = :tenantId")
List<Account> findAllWithCitationsByTenantId(@Param("tenantId") Long tenantId);
```

**Result:** 1 query instead of N+1. For 200 accounts, the dashboard goes from 10,200 queries to 1 query (plus 1 count query if pagination is used).

**Production addition — add query count regression guard:**

```java
// AccountDashboardService.java — add query count metric
@Timed(value = "dashboard.query.count", description = "DB queries per dashboard load")
public DashboardDTO getAccountDashboard(Long tenantId) { ... }
```

---

### ✅ The Test That Would Have Prevented This

```java
// AccountRepositoryQueryCountTest.java — datasource-proxy to count SQL statements
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class AccountRepositoryQueryCountTest {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private DataSource dataSource;

    private ProxyDataSource proxyDataSource;
    private QueryCountHolder queryCountHolder;

    @BeforeEach
    void setUp() {
        queryCountHolder = new QueryCountHolder();
        proxyDataSource = ProxyDataSourceBuilder
            .create(dataSource)
            .countQuery()
            .build();
    }

    @Test
    @Sql("/test-data/100-accounts-with-citations.sql")
    @DisplayName("findAllWithCitations must fire at most 2 queries for 100 accounts")
    void findAllWithCitationsUsesJoinFetch() {
        QueryCount queryCount = QueryCountHolder.getGrandTotal();
        queryCount.reset();

        // Execute the method under test
        List<Account> accounts = accountRepository.findAllByTenantId(1L);

        // Force lazy-load evaluation (simulates service layer access)
        accounts.forEach(a -> a.getCitations().size());

        long totalQueries = QueryCountHolder.getGrandTotal().getSelect();

        assertThat(totalQueries)
            .as("N+1 regression: expected ≤2 SELECT queries for 100 accounts with citations, " +
                "but fired %d queries", totalQueries)
            .isLessThanOrEqualTo(2);
    }
}
```

**How the test catches the bug:** With lazy loading (no `@EntityGraph`), for 100 accounts the test records 101 SELECT queries (1 for accounts + 100 for citations). The assertion `isLessThanOrEqualTo(2)` fails — exposing the N+1 in CI. With `@EntityGraph`, exactly 1 or 2 queries fire (depending on whether a count is needed), and the test passes.

---

### 📚 What This Teaches

- **N+1 is O(N) round-trips** — the same algorithmic cost as traversing a linked list instead of doing a direct lookup. Framing it as a complexity problem explains why it scales catastrophically.
- **Lazy loading is the JPA default and the N+1 trap** — `FetchType.LAZY` is correct for most reads but requires explicit JOIN FETCH for batch operations.
- **@EntityGraph is the Spring Data JPA solution** — it overrides fetch strategy per query without changing the entity mapping.
- **Unit tests with mocks cannot catch N+1** — only integration tests with a real DB and query counting reveal it.
- **datasource-proxy** is the production tool for query-count assertions in integration tests.

---

### 🎯 Interview Connection

**Question it answers:** "Have you ever caused or fixed a database performance incident?" or "Explain the N+1 problem and how you solve it."

**Signal it sends:**
- You can trace a 5xx cascade to its root cause at the ORM layer.
- You understand why lazy loading is dangerous in batch contexts.
- You quantify the problem mathematically: 200 accounts × 50 citations = 10,200 queries.
- You write query-count tests — not just functional tests — to prevent regression.

**Opening line:** *"We had a P1 where the entire DB hit 100% CPU and every endpoint 504'd for 8 minutes. The root cause was a dashboard page that lazy-loaded 200 accounts' worth of citations — 10,200 queries per page load, 100 concurrent users, 1 million queries per minute. Here's what we fixed and the regression test we added..."*

---

---

## Incident 5: "The Immortal Lock" — Distributed Lock Without Lease

**Domain**: Spring Boot + DSA (Deadlock)  
**Concept taught**: Distributed lock correctness requires bounded lease time; unbounded locks are deadlock vectors  
**Severity**: P1 — payment processing completely frozen for 45 minutes; $120K in unprocessed payments

---

### 📟 The Alert

```
FIRING [P1] payment.processing.queue.depth > 5000
FIRING [P1] payment.processing.rate = 0 (complete stop)
Source: Grafana → payment-processor → queue_depth_gauge, processing_rate_counter
On-call page: "No payments processed in 15 minutes. $120K queue depth growing."
```

---

### 🕵️ The Investigation Timeline

```
T+0min:  Two P1 alerts fire: queue depth 5,000+ and processing rate = 0.
T+5min:  On-call checks payment processor logs. All threads blocked:
         WARN  Waiting for lock: lock:citation:CIT-9001 [thread-pool-7]
         WARN  Waiting for lock: lock:citation:CIT-9001 [thread-pool-8]
         WARN  Waiting for lock: lock:citation:CIT-9001 [thread-pool-11]
         ...all 20 thread-pool threads waiting on the same key.
T+10min: Redis inspection:
         redis-cli KEYS 'lock:citation:*'
         → lock:citation:CIT-9001
         redis-cli TTL lock:citation:CIT-9001
         → -1  (no expiry — immortal lock)
T+12min: Check creation timestamp via object encoding:
         Lock key has been set for 43 minutes.
T+14min: Correlate with pod events. 43 minutes ago:
         OOMKilled: payment-processor-v2-pod-abc
         Pod was processing CIT-9001, was killed by OOM mid-processing.
         Lock acquired but never released. No TTL = no automatic cleanup.
T+15min: Mitigation: redis-cli DEL lock:citation:CIT-9001
         Payment processing resumes within 30 seconds. Queue drains.
T+60min: Fix deployed: Redisson tryLock with leaseTime=30s. All lock keys monitored for TTL=-1.
```

---

### 🔍 Root Cause — Technical Deep Dive

A distributed lock prevents concurrent modification of the same resource across multiple processes. The critical correctness property: **a lock must have a bounded lifetime**. If the holder crashes, the lock must self-expire so another process can acquire it.

**Without a lease (TTL), a distributed lock is a potential deadlock:**

```
Process A acquires lock → Process A crashes → Lock remains → 
Process B waits → Process C waits → ... → Thread pool exhausted → System dead
```

This is the distributed equivalent of a **thread holding a mutex and being killed** — except there is no OS to clean up the lock on process death.

**Wrong code that caused it:**

```java
// CitationPaymentProcessor.java — BROKEN lock with no lease
public void processPayment(String citationId) {
    String lockKey = "lock:citation:" + citationId;

    // DANGER: acquire lock with no expiry
    Boolean acquired = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "locked"); // No Duration parameter → TTL = -1 = immortal

    if (Boolean.FALSE.equals(acquired)) {
        log.warn("Lock held by another process, skipping: {}", citationId);
        return;
    }

    try {
        // If OOMKilled here, lock is never released
        performPaymentProcessing(citationId);
    } finally {
        redisTemplate.delete(lockKey); // Never executes if pod is killed
    }
}
```

**Why `finally` doesn't save you:** A JVM crash, OOMKill, or `kill -9` does not run finally blocks. The lock remains. TTL is the only safe cleanup mechanism for distributed locks.

**The second flaw — thread pool exhaustion:**

The thread pool had 20 threads. All 20 waited indefinitely on `lock:citation:CIT-9001`. New payment events queued up. No threads were free to process any payment — not just CIT-9001. One immortal lock froze the entire system.

---

### 💡 The Fix

```java
// CitationPaymentProcessor.java — FIXED with Redisson bounded lock
@Service
public class CitationPaymentProcessor {

    private final RedissonClient redissonClient;

    public CitationPaymentProcessor(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
    }

    public void processPayment(String citationId) {
        String lockKey = "lock:citation:" + citationId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // waitTime: how long to wait if lock is already held (don't wait forever)
            // leaseTime: maximum time to hold the lock (auto-release even if pod crashes)
            boolean acquired = lock.tryLock(
                5,  // waitTime in seconds — give up if not acquired in 5s
                30, // leaseTime in seconds — auto-release after 30s even on crash
                TimeUnit.SECONDS
            );

            if (!acquired) {
                log.warn("Could not acquire lock within 5s, requeueing: {}", citationId);
                requeueForRetry(citationId);
                return;
            }

            try {
                performPaymentProcessing(citationId);
            } finally {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Lock acquisition interrupted for {}", citationId, e);
        }
    }
}
```

**Monitoring addition — alert on immortal locks:**

```yaml
# Prometheus alert rule — detect any distributed lock with TTL = -1
- alert: ImmortalDistributedLock
  expr: redis_key_ttl{key=~"lock:citation:.*"} == -1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Distributed lock has no TTL — potential deadlock risk"
    description: "Key {{ $labels.key }} has TTL=-1 for over 5 minutes."
```

---

### ✅ The Test That Would Have Prevented This

```java
// DistributedLockLeaseTest.java — JUnit 5 + Embedded Redis (Testcontainers)
@SpringBootTest
@Testcontainers
class DistributedLockLeaseTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private CitationPaymentProcessor processor;

    @Test
    @DisplayName("Lock must auto-expire after leaseTime even if holder crashes (no finally)")
    void lockAutoExpiresAfterLeaseTime() throws InterruptedException {
        String citationId = "CIT-9001";
        String lockKey = "lock:citation:" + citationId;

        // Simulate crash: acquire lock and DON'T release it (no finally)
        RLock lock = redissonClient.getLock(lockKey);
        lock.lock(2, TimeUnit.SECONDS); // leaseTime = 2 seconds for test speed

        // Verify lock is held
        assertThat(lock.isLocked()).isTrue();

        // Do NOT call lock.unlock() — simulate OOMKill / crash

        // Wait for leaseTime + buffer
        Thread.sleep(3000); // 3s > 2s leaseTime

        // THEN: lock must have expired automatically — a new holder should be able to acquire
        RLock newLock = redissonClient.getLock(lockKey);
        boolean newAcquired = newLock.tryLock(1, 5, TimeUnit.SECONDS);

        assertThat(newAcquired)
            .as("Lock must auto-release after leaseTime even without explicit unlock. " +
                "If this fails, leaseTime is not set — immortal lock bug exists.")
            .isTrue();

        if (newAcquired) {
            newLock.unlock();
        }
    }

    @Test
    @DisplayName("Thread pool must not be fully consumed by a single stuck lock")
    void lockedResourceDoesNotExhaustThreadPool() throws InterruptedException {
        String citationId = "CIT-STUCK";

        // Hold the lock for the duration of the test
        RLock stuck = redissonClient.getLock("lock:citation:" + citationId);
        stuck.lock(60, TimeUnit.SECONDS);

        // Submit 5 tasks that all try to acquire the same lock with waitTime=1s
        ExecutorService pool = Executors.newFixedThreadPool(5);
        List<Future<String>> results = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            results.add(pool.submit(() -> {
                String result = processor.tryProcessWithTimeout(citationId);
                return result; // Should return "requeued" not block indefinitely
            }));
        }

        pool.shutdown();
        boolean finished = pool.awaitTermination(10, TimeUnit.SECONDS);

        assertThat(finished)
            .as("Thread pool should not block indefinitely waiting for a held lock. " +
                "waitTime must be bounded so threads are released.")
            .isTrue();

        // All tasks should have timed out and requeued — not blocked the pool
        for (Future<String> result : results) {
            assertThat(result.get()).isEqualTo("requeued");
        }

        stuck.unlock();
    }
}
```

**How the test catches the bug:** `lockAutoExpiresAfterLeaseTime` simulates a pod crash (no `lock.unlock()`) and verifies that the lock expires on its own after `leaseTime`. With the broken `setIfAbsent` (no TTL), the lock remains forever — `newAcquired` is `false` and the assertion fails. With Redisson's bounded `tryLock`, the lock expires after 2 seconds and the test passes.

---

### 📚 What This Teaches

- **A distributed lock without a lease is a deadlock waiting for a crash** — this is not a race condition; it is a guarantee that any pod OOMKill will permanently block that resource.
- **`finally` blocks do not run on JVM kill** — OS-level process termination (`OOMKill`, `SIGKILL`) bypasses all JVM cleanup.
- **Thread pool exhaustion is a cascade multiplier** — one immortal lock on one resource can block all threads, freezing unrelated operations.
- **Redisson's `tryLock(waitTime, leaseTime)` is the production-correct primitive** — both parameters matter: `waitTime` prevents thread pool exhaustion; `leaseTime` prevents immortal locks.
- **Monitor for TTL=-1 lock keys** — a Prometheus alert on this condition gives you early warning before the next crash.

---

### 🎯 Interview Connection

**Question it answers:** "What is a distributed lock and what can go wrong with a naive implementation?" or "Tell me about a production outage you were part of."

**Signal it sends:**
- You understand distributed systems failure modes, not just happy-path usage.
- You can map `OOMKill → no finally → immortal lock → thread pool exhaustion → full outage` as a causal chain.
- You know Redisson and its `tryLock` API by name.
- You write tests that simulate crash scenarios — not just normal operation.

**Opening line:** *"We had a P1 where $120K of payments sat unprocessed for 45 minutes. One pod was OOMKilled mid-payment. It held a Redis lock with no TTL. The lock stayed forever. All 20 thread-pool threads queued waiting for that one lock key — and new payments couldn't be processed. The fix was two parameters: waitTime and leaseTime on Redisson's tryLock. Here's why both matter..."*

---

---

## Summary Table

| # | Title | P-Level | Bug Type | Domain | What Would Have Caught It |
|---|---|---|---|---|---|
| 1 | The Boundary Attack | P2 | Algorithm invariant violation (fixed-window exploitable at boundary) | DSA + Spring Boot | Playwright test firing 22 requests across second boundary; assert ≤10 succeed |
| 2 | The Ghost Cache | P1 | Wrong cache strategy (READ_ONLY on mutable entity) + missing collection annotation | Spring Boot + DSA | Integration test: update in separate tx → clear L1 → reload → assert fresh value |
| 3 | The Kafka Déjà Vu | P2 | Missing idempotency key on at-least-once consumer | Spring Boot + SDET | EmbeddedKafka test: publish same event 3× → verify emailService called exactly 1× |
| 4 | The Cascade | P1 | N+1 query problem (lazy-loaded collection in loop under load) | Spring Boot + DSA | datasource-proxy integration test: assert ≤2 SELECT queries for 100 accounts |
| 5 | The Immortal Lock | P1 | Distributed lock with no lease time (immortal key on pod crash) | Spring Boot + DSA | Redisson lock test: simulate crash → wait leaseTime → assert new acquire succeeds |

---

## How to Use These in Interviews

These incidents are credibility amplifiers. When an interviewer asks about rate limiting, caching, Kafka, N+1, or distributed locks — you are not answering from theory. You are answering from experience.

**The opening pattern:** Begin with *"I've seen this in production."* Then deliver the alert, the investigation timeline in abbreviated form, the root cause in one or two sentences, and the fix. Close with what you added to prevent recurrence. This arc — alert → investigation → root cause → fix → prevention — is the structure of every strong system design and debugging answer.

**What it signals:** Interviewers at senior and staff levels are evaluating whether you have *encountered* hard problems, not just *studied* them. A candidate who says "we had a P1 where the entire DB hit 100% CPU and every endpoint 504'd for 8 minutes — here's the exact query count trace" is demonstrating a different depth than one who says "N+1 is when you have too many database queries."

**When to use each incident:**

- **Rate Limiter (Incident 1):** System design rounds, "design an API gateway," "how would you prevent abuse," any question about algorithm selection for production constraints.
- **Ghost Cache (Incident 2):** "Tell me about a hard bug to debug," any question about JPA, caching, or stale data scenarios.
- **Kafka Déjà Vu (Incident 3):** "How do you handle duplicate message processing," any distributed systems or event-driven architecture question, "what went wrong during a deploy."
- **The Cascade (Incident 4):** "Tell me about a database performance incident," any ORM or JPA question, "how do you prevent N+1," system design under load.
- **The Immortal Lock (Incident 5):** "What are the failure modes of distributed locks," any question about concurrency, deadlock, or distributed systems reliability.

**The depth signal:** After delivering the story, connect it to the underlying data structure or algorithm — "this is fundamentally an LRU cache eviction policy question," "this is a set membership check problem solved by Redis SETNX," "this is O(N) round-trips instead of O(1) at the ORM layer." This connection between production experience and theoretical grounding is what distinguishes senior engineers in interviews.
