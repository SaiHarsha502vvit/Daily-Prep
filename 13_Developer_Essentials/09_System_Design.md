# 🏗️ System Design — Complete Guide

**Navigation**: [< Security](08_Security_Fundamentals.md) | [Index](00_INDEX.md) | [Next: Dev Tools >](10_Dev_Tools_Productivity.md)

---

# WHY: Why System Design Matters

## From Single Server to Global Scale

```
Level 0: Laptop
  One app, one database, one user

Level 1: Single Server (startup)
  10-100 users → one server handles everything

Level 2: Vertical Scaling
  1,000 users → bigger CPU, more RAM, faster disk

Level 3: Horizontal Scaling
  100,000 users → multiple servers behind a load balancer

Level 4: Distributed Systems
  1,000,000+ users → microservices, caching, CDN, message queues

Every developer will face these decisions.
System design isn't just for interviews — it's your daily reality.
```

---

🔬 **Section Challenge — From Single Server to Global Scale**

**Challenge 1 (Reasoning):** A startup with 50 users runs fine on a single server. At 10,000 users, the API slows down. At 100,000, it crashes. Why doesn't vertical scaling (buying a bigger server) solve this indefinitely?

<details><summary>Answer</summary>

Vertical scaling (adding more CPU/RAM to one machine) hits two hard walls: (1) **Hardware ceiling** — the largest AWS EC2 instance (`u-24tb1.metal`) has 448 vCPUs and 24TB RAM. Beyond that, no bigger machine exists. (2) **Availability cliff** — a single server is a single point of failure. Upgrading it requires downtime. Horizontal scaling (multiple servers behind a load balancer) adds capacity incrementally with no ceiling and allows zero-downtime deploys (rolling updates). The real lesson: vertical scaling buys time; horizontal scaling is the only path to genuine scale. At 10,000 users, the issue is often a slow DB query (N+1 or missing index) — fix that before buying a bigger server.

</details>

**Challenge 2 (Design):** You're designing for 1M requests/day. Estimate the QPS, then name the FIRST infrastructure component you add beyond a single server.

<details><summary>Answer</summary>

1M req/day ÷ 86,400 seconds/day ≈ **12 QPS average**. With a 10:1 peak-to-average ratio, design for ~120 QPS peak. A single well-tuned Spring Boot server handles 1,000-10,000 QPS, so hardware isn't the bottleneck yet. The FIRST thing to add: **database read replica + caching**. 80-90% of web requests are reads. Adding a Redis cache in front of the DB reduces DB load by 10-100x before you need any horizontal web server scaling. Next: a **CDN** for static assets. These two changes get you to 10M+ req/day without adding app servers.

</details>

# WHAT: Core Building Blocks

## 1. Load Balancer

```
Without Load Balancer:
  All requests → 1 server → server dies → app DOWN

With Load Balancer:
  ┌────────┐     ┌─────────────────┐     ┌──────────┐
  │ Client │ ──> │  Load Balancer  │ ──> │ Server 1 │ ✓
  │        │     │  (distributes)  │ ──> │ Server 2 │ ✓
  │        │     │                 │ ──> │ Server 3 │ ✗ (detected, skipped)
  └────────┘     └─────────────────┘     └──────────┘

Algorithms:
  Round Robin    → Server 1, 2, 3, 1, 2, 3... (simple)
  Least Conn     → Send to server with fewest active connections
  IP Hash        → Same client IP always goes to same server
  Weighted       → Server with 8 CPU gets 4x traffic vs 2 CPU

Tools: NGINX, HAProxy, AWS ALB, Kubernetes Ingress
```

🔬 **Section Challenge — 1. Load Balancer**

**Challenge 1 (Reasoning):** Round-robin load balancing sends requests to servers 1,2,3,1,2,3. Why does this fail for stateful sessions?

<details><summary>Answer</summary>

Session data (shopping cart, auth state) is stored on ONE server. Round-robin sends the NEXT request to a different server which has NO session data → user is logged out, cart is empty. Solutions: (1) Sticky sessions (session affinity) — LB routes user to the same server based on cookie. Single point of failure risk. (2) Externalize session to Redis — all servers share one session store. (3) Stateless auth (JWT) — no server-side session needed. Modern preference: stateless design + JWT.

</details>

## 2. Caching

```
WITHOUT cache:
  Client → Server → Database (100ms) → Server → Client

WITH cache:
  Client → Server → Cache HIT (1ms) → Server → Client
  Client → Server → Cache MISS → Database → Store in Cache → Client

Cache Layers:
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Browser  │ →  │   CDN    │ →  │  App     │ →  │ Database │
  │ Cache    │    │ Cache    │    │  Cache   │    │          │
  │ (local)  │    │ (edge)   │    │ (Redis)  │    │          │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘

Cache Strategies:
  CACHE-ASIDE    → App checks cache first, loads from DB on miss, writes to cache
  WRITE-THROUGH  → Write to cache AND DB simultaneously
  WRITE-BEHIND   → Write to cache, async batch write to DB (fast but risky)

Eviction Policies:
  LRU  → Least Recently Used (most common)
  LFU  → Least Frequently Used
  TTL  → Time To Live (expire after N seconds)
```

```java
// Spring Boot + Redis Cache Example:
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        // This only runs on CACHE MISS
        return productRepository.findById(id).orElseThrow();
    }

    @CacheEvict(value = "products", key = "#id")
    public void updateProduct(Long id, ProductDTO dto) {
        // Evict from cache when data changes
        Product product = productRepository.findById(id).orElseThrow();
        product.setName(dto.getName());
        productRepository.save(product);
    }
}
```

🔬 **Section Challenge — 2. Caching**

**Challenge 1 (Design):** Cache-aside vs write-through vs write-behind — when does each cause stale data?

<details><summary>Answer</summary>

Cache-aside (lazy load): on cache miss, load from DB and populate cache. Stale: if DB updated externally (direct DB write bypassing cache). Write-through: write to cache AND DB simultaneously. Stale: never (cache always reflects writes). Write-behind (write-back): write to cache, async write to DB. Stale: if cache crashes before DB write → data loss. Rule: cache-aside for read-heavy. Write-through for write+read. Write-behind for write-heavy (accept loss risk).

</details>

## 3. Database Scaling

```
VERTICAL: Bigger machine (limited)
HORIZONTAL: Multiple machines

READ Replicas:
  ┌──────────┐          ┌──────────────┐
  │  Master  │ ──sync── │ Read Replica │  ← All SELECTs go here
  │ (writes) │          │ (reads only) │
  └──────────┘          └──────────────┘

SHARDING (horizontal partitioning):
  Users A-M → Database Shard 1
  Users N-Z → Database Shard 2

  Benefits: Each shard is smaller, faster
  Drawbacks: Cross-shard queries are HARD, rebalancing is painful

SQL vs NoSQL Decision:
  SQL  (PostgreSQL, MySQL)  → Structured data, ACID, joins needed
  NoSQL (MongoDB, DynamoDB) → Flexible schema, high throughput, horizontal scale
```

🔬 **Section Challenge — 3. Database Scaling**

**Challenge 1 (Reasoning):** A PostgreSQL database has 500 million rows. A simple `SELECT * FROM users WHERE last_login > '2023-01-01'` takes 14 seconds. The CTO suggests sharding the database across 4 servers to speed it up. Why is this the wrong first step, and what is the correct one?

<details><summary>Answer</summary>

Sharding is the most complex, highest-overhead database scaling strategy; it breaks JOINs and requires application-level routing logic. It should be the absolute last resort. The correct first step is **Vertical Scaling (Adding an Index)**. A sequential scan on 500M rows takes seconds; an index on `last_login` uses a B-Tree to find the records in O(log N) time, reducing the query to milliseconds. If indexing doesn't work, upgrade the server RAM (vertical scaling). If read volume is too high, use a Read Replica. Only consider sharding when you exceed the storage capacity of the largest possible single machine or hit write-throughput limits that hardware cannot solve.

</details>

**Challenge 2 (Design):** A social media app uses MongoDB (NoSQL) for user profiles and posts. They want to add a billing system that deducts credits when a user buys a premium sticker. A developer suggests storing the `credit_balance` in MongoDB. What is the fundamental risk here?

<details><summary>Answer</summary>

MongoDB historically (and in its default high-throughput configurations) prioritizes AP (Availability/Partition Tolerance) and flexible schemas over strict ACID guarantees (though modern MongoDB supports multi-document transactions). The risk is **Consistency**. Financial transactions (deducting credits) require strict ACID properties to prevent race conditions (e.g., double-spending). For the billing system, you should use a **Relational SQL Database** (PostgreSQL) designed for strict CP consistency and transactional integrity, even if the rest of the app uses NoSQL. This is called **Polyglot Persistence**.

</details>

## 4. Message Queues

```
PROBLEM: Service A calls Service B directly
  → If B is slow, A waits → cascading failure

SOLUTION: Asynchronous messaging
  ┌───────┐    ┌─────────┐    ┌───────┐
  │  API  │ →  │  Queue  │ →  │Worker │
  │Server │    │(Kafka/  │    │Process│
  │       │    │ RabbitMQ│    │       │
  └───────┘    └─────────┘    └───────┘
  Returns 202   Stores msg    Processes
  immediately   reliably      when ready

Use Cases:
  - Email sending (don't block HTTP request)
  - Order processing (place in queue → process async)
  - Log aggregation (apps write to Kafka → analytics reads)
  - Microservice communication (decoupled)

Tools: Apache Kafka, RabbitMQ, AWS SQS, Redis Streams
```

## 5. CDN (Content Delivery Network)

```
WITHOUT CDN (server in US):
  User in India → 15,000 km → US Server → 15,000 km back → 300ms

WITH CDN (edge server in India):
  User in India → 100 km → CDN Edge → 5ms

  ┌──────┐          ┌─────────┐
  │ User │ ───>     │ CDN     │   ← Static files cached here
  │ India│          │ Mumbai  │
  └──────┘          └────┬────┘
                         │ (cache miss only)
                    ┌────▼────┐
                    │ Origin  │   ← Your actual server
                    │ US-East │
                    └─────────┘

Cache: HTML, CSS, JS, images, videos, fonts
Tools: Cloudflare, AWS CloudFront, Akamai
```

---

## WHEN: Decision Guide

| Situation | Pattern | Why |
|---|---|---|
| Read-heavy, <10K QPS, simple data | **Single server + DB** | Cheapest, fastest to ship; redis only if needed |
| Read-heavy, >10K QPS, simple key-value | **Cache + DB** | memcached/Redis fronting Postgres; 80% hit rate reduces DB load by 5× |
| Read-heavy, >100K QPS, large objects | **CDN** | Geographic edge caching; users get from nearest PoP |
| Write-heavy, >1K writes/sec, single master | **Vertical scale + read replicas** | Cheaper than sharding; works until master is saturated |
| Write-heavy, >10K writes/sec, large dataset | **Sharding by key** | Split data across N shards; each handles 1/N load |
| Sequential writes (events, logs) | **Append-only log + consumers** | Kafka's model; scales linearly with partition count |
| Search across large text corpus | **Inverted index** (Elasticsearch) | Sub-100ms full-text search across billions of docs |
| Time-series data (metrics, IoT) | **TSDB** (InfluxDB, TimescaleDB) | Compression optimized for sequential timestamps |
| Global users, low-latency reads | **Multi-region replication** | Read from nearest region; accept eventual consistency |
| Cross-service async coordination | **Message queue** (Kafka, RabbitMQ, SQS) | Decouples services; buffer for traffic spikes |
| Synchronous inter-service calls | **Service mesh + circuit breaker** (Istio, Resilience4j) | Prevents cascade failure; retries with backoff |

**Sharding key selection**:
- **User ID hash mod N**: even distribution, but resharding is hard (need consistent hashing or re-shard)
- **Geographic region**: predictable distribution, but uneven if one region dominates
- **Tenant ID** (for SaaS): isolation per customer, but "elephant tenants" cause hot shards
- **Time-based** (logs, events): natural partition, but old data may need to be archived

**Replication factor selection**:
- **RF=1**: dev/test only — single point of failure
- **RF=3**: production standard — survives 1 broker failure; second failure risks data loss
- **RF=5**: critical data (financial transactions) — survives 2 broker failures
- **Trade-off**: more replicas = more storage cost + write latency. RF=3 is the sweet spot for most use cases.

**CAP choice for your domain**:
- **Banking, payments, inventory**: pick **CP** — you'd rather refuse a transaction than double-charge
- **Social media feeds, shopping carts (pre-checkout), analytics dashboards**: pick **AP** — temporary inconsistency is better than downtime
- **Hybrid**: many systems use CP for the "money path" and AP for the "engagement path" — e.g., Uber uses CP for payment, AP for driver location

---

🔬 **Section Challenge — 5. CDN (Content Delivery Network)**

**Challenge 1 (Reasoning):** You deploy a new JS bundle to your server. CDN edge servers globally are still serving the old cached version. Walk through the two standard strategies to force cache invalidation.

<details><summary>Answer</summary>

1. **URL fingerprinting (best practice)**: include the file hash in the filename — `main.a3f7bc9.js` instead of `main.js`. When the file changes, the hash changes, the URL changes, CDN caches the new URL with a fresh TTL. Old cached URL expires naturally. This is what Webpack/Vite do automatically with `[contenthash]`. Zero TTL configuration needed. 2. **Cache purge API**: Cloudflare, CloudFront provide an API to invalidate specific files: `aws cloudfront create-invalidation --paths '/main.js'`. Takes 30-60 seconds to propagate globally. Use for emergency hotfixes when you can't change the URL. Avoid purging `/*` (all files) — it defeats the performance purpose of CDN and counts against your monthly purge limit (CloudFront = 1,000 free paths/month).

</details>

**Challenge 2 (Design):** Which of these should NOT be cached on a CDN: (a) product images, (b) `GET /api/users/me`, (c) React app bundle, (d) company logo? Explain each.

<details><summary>Answer</summary>

**(b) `GET /api/users/me` should NOT be cached on CDN.** (a) Product images ✅ — static, change rarely, perfect for CDN with long TTL + fingerprinted URL. (b) `/api/users/me` ❌ — user-specific private data. If CDN caches it, User B gets User A's data (catastrophic data leak). Even with `Cache-Control: private`, CDN misconfigurations cause leaks. Never cache authenticated API responses on shared CDN. (c) React bundle ✅ — fingerprinted filename, long TTL, identical for all users. (d) Company logo ✅ — static asset, rarely changes, huge benefit from edge caching. Rule: CDN caches public, user-agnostic content only.

</details>

## WHO: Origin Story

**Eric Brewer** formulated the **CAP Theorem** in a 1998 keynote at PODC (Principles of Distributed Computing). The conjecture: a distributed data store can simultaneously deliver only two of three guarantees — **Consistency**, **Availability**, **Partition tolerance**. **Seth Gilbert and Nancy Lynch** proved it formally in **2002** (Gilbert-Lynch paper).

**The load balancer lineage**:
- **HAProxy** (2001, Willy Tarreau) — open-source TCP/HTTP load balancer, born from single-process-event-driven design
- **LVS (Linux Virtual Server)** (1998, Wensong Zhang) — kernel-level load balancing
- **nginx** (2004, Igor Sysoev) — high-performance HTTP server with load-balancing capability, now ~33% of all websites
- **AWS ELB** (2009) — managed load balancing; **ALB** (2016) added Layer 7 routing; **NLB** (2017) added ultra-low-latency Layer 4

**The cache lineage**:
- **memcached** (2003, Brad Fitzpatrick at LiveJournal) — in-memory key-value cache, simple protocol
- **Redis** (2009, Salvatore Sanfilippo) — in-memory data structure server (lists, sets, sorted sets, streams)
- **Varnish** (2005, Poul-Henning Kamp) — HTTP accelerator, full-page caching
- **CDNs** (Akamai 1998, Cloudflare 2010, CloudFront 2008) — geographic edge caching

**Message queue lineage**:
- **RabbitMQ** (2007, originally developed by LShift and CohesiveFT) — AMQP-based broker
- **Apache Kafka** (2011, LinkedIn; open-sourced 2011; donated to Apache 2012) — distributed commit log
- **AWS SQS** (2004) — first managed queue service
- **NATS** (2010, Derek Collison at Apcera) — lightweight, JetStream for persistence added 2019

**The CAP tradeoff in production**:
- **CP systems** (consistency + partition tolerance, sacrifice availability): etcd, ZooKeeper, HBase, MongoDB in default config
- **AP systems** (availability + partition tolerance, sacrifice consistency): Cassandra, DynamoDB, CouchDB
- **CA systems** (consistency + availability, no partition tolerance): single-node RDBMS — partitions aren't relevant if there's only one node

The choice between CP and AP is not always binary — many systems offer tunable consistency per-operation (Cassandra's `consistency level`, DynamoDB's `Read/Write Capacity` with `ConsistentRead=true`).

# HOW: Design Patterns

## Microservices vs Monolith

```
MONOLITH:
  ┌──────────────────────────┐
  │    ONE BIG APPLICATION   │
  │  Users + Orders + Pay +  │
  │  Inventory + Shipping    │
  │  ALL IN ONE CODEBASE     │
  └──────────────────────────┘
  ✅ Simple to develop, deploy, debug
  ❌ One bug can crash everything
  ❌ Can't scale parts independently

MICROSERVICES:
  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
  │ Users  │ │ Orders │ │Payment │ │Inventory │
  │Service │ │Service │ │Service │ │ Service  │
  └────────┘ └────────┘ └────────┘ └──────────┘
  ✅ Scale each independently
  ✅ Teams own their services
  ✅ One failure doesn't crash all
  ❌ Network complexity
  ❌ Distributed debugging is HARD
  ❌ Data consistency challenges

RULE: Start with monolith, extract microservices WHEN NEEDED
```

🔬 **Section Challenge — Microservices vs Monolith**

**Challenge 1 (Reasoning):** Service A calls Service B which calls Service C. C is slow. How does this cause a cascade failure?

<details><summary>Answer</summary>

Without circuit breakers: A has a thread pool for B calls. B is slow (waiting for C) → B responses are slow → A's thread pool fills with waiting threads → A's thread pool exhausted → A becomes slow for ALL callers, not just B-related ones. Cascade: C slow → B slow → A slow → entire system degraded. Fix: Resilience4j circuit breaker — after N failures, 'open' the circuit → fail fast with fallback response instead of waiting. Timeouts + bulkhead patterns to isolate failure.

</details>

## CAP Theorem

```
You can only have 2 of 3:

  C — Consistency:  Every read gets the most recent write
  A — Availability: Every request gets a response (even if stale)
  P — Partition Tolerance: System works despite network failures

In distributed systems, P is mandatory (networks WILL fail).
So you choose: CP or AP.

  CP (Consistency + Partition Tolerance):
    → Banking: Balance MUST be correct, even if slow
    → Tools: PostgreSQL, MongoDB (default), Redis Cluster

  AP (Availability + Partition Tolerance):
    → Social media: Show stale feed, but ALWAYS respond
    → Tools: Cassandra, DynamoDB, CouchDB
```

### Diagram: CAP Triangle with System Labels

```
                  CONSISTENCY (C)
                        ╱╲
                       ╱  ╲
                      ╱ CP ╲
                     ╱      ╲
                    ╱────────╲
                   ╱          ╲
                  ╱    CAP     ╲
                 ╱    THEOREM    ╲
                ╱   (Brewer 2000) ╲
               ╱                  ╲
              ╱──── AP ───────────╲
             ╱                      ╲
            ╱           PA          ╲
           ╱   (impossible during    ╲
          ╱       partition)          ╲
         ╱────────────────────────────╲
   AVAILABILITY (A)         PARTITION TOLERANCE (P)

   CP systems: HBase, Redis Cluster, etcd, ZooKeeper
   AP systems: Cassandra, DynamoDB, CouchDB, Riak
   Trade-off: Choose based on whether correctness or uptime matters more
```

## Rate Limiting Algorithms

```
1. FIXED WINDOW:   100 requests per minute (resets at :00)
   Problem: 100 at :59 + 100 at :00 = 200 in 2 seconds

2. SLIDING WINDOW:  100 requests in any 60-second window
   More accurate, slightly more complex

3. TOKEN BUCKET:    Tokens added at fixed rate, consumed per request
   Allows bursts up to bucket size

4. LEAKY BUCKET:    Requests processed at fixed rate, excess queued
   Smooth output rate
```

---

🔬 **Section Challenge — Rate Limiting Algorithms**

**Challenge 1 (Trace):** Token bucket starts full at 10 tokens. Refill rate: 2 tokens/second. A client sends 10 requests in 1 second, then 3 more in the next second. Trace the token count and which requests are rejected.

<details><summary>Answer</summary>

T=0s: bucket = 10 tokens. Requests 1-10 consume all 10 tokens → all allowed. Bucket = 0. T=1s: 2 tokens refilled → bucket = 2. Requests 11-13 arrive: req 11 takes 1 token (bucket=1), req 12 takes 1 token (bucket=0), req 13 **rejected** (0 tokens). **Request 13 is rate-limited.** This is the token bucket's key property: it allows bursts up to bucket capacity, then throttles to the refill rate. A fixed-window limiter would allow ALL 3 requests at T=1s (new window resets the counter). Token bucket is more fair because sustained throughput is capped regardless of window boundaries.

</details>

**Challenge 2 (Design):** You implement rate limiting per-user with Redis. User makes 1000 req/s from 50 IPs (distributed botnet). Why does per-IP rate limiting fail here, and what is the correct key strategy?

<details><summary>Answer</summary>

Per-IP rate limiting fails because each of the 50 IPs sends only 20 req/s — well under a per-IP limit of, say, 100/s. The coordinated attack bypasses the limit. Correct strategy: **multi-level keys**. (1) **Per-user-ID key**: `ratelimit:user:42` — counts all requests from authenticated user 42 regardless of IP. A single user can't exceed 100 req/s even from 1000 IPs. (2) **Per-API-key key**: for unauthenticated endpoints. (3) **Per-IP key**: as a secondary layer to catch single-IP spammers. In Redis, use `INCR` + `EXPIRE` or sorted sets for sliding window. Layer all three: if any exceeds threshold, return 429. This is exactly how Stripe implements rate limiting.

</details>

# WHERE: System Design Template

## Step-by-Step Approach

```
1. REQUIREMENTS (5 min)
   - Functional: What does the system DO?
   - Non-functional: Scale, latency, availability?
   - Back-of-envelope: Users, QPS, storage?

2. HIGH-LEVEL DESIGN (10 min)
   - Draw boxes: Client → LB → API → DB
   - Identify core services
   - Choose SQL vs NoSQL

3. DEEP DIVE (15 min)
   - Database schema
   - API endpoints
   - Caching strategy
   - How to handle failures

4. BOTTLENECKS (5 min)
   - Single points of failure?
   - What if traffic 10x?
   - Monitoring and alerting?
```

## Back-of-Envelope Calculations

```
Useful numbers to memorize:

  Read from memory:        100 ns
  Read from SSD:           100 μs  (1,000x slower)
  Read from disk:          10 ms   (100,000x slower)
  Network round trip:      1-100 ms

  **Per-server capacity (typical)**:
  - **Concurrent connections**: ~10,000 (modern Linux with epoll, Tomcat default 200 threads × 50 idle connections per thread). The connection lives until the request completes.
  - **Requests per second**: ~1,000–5,000 (depends on request complexity). A request taking 200ms = 5 req/sec per thread; with 200 threads = 1,000 req/sec.
  - **Why the distinction matters**: connection limits are about socket/FD exhaustion; throughput is about CPU/I/O saturation. A server at 10K connections but 100 req/sec has slow requests; a server at 1K connections but 5,000 req/sec has fast requests.
  1 day has:               86,400 seconds
  1 million requests/day:  ~12 QPS (queries per second)

  1 KB  → a short email
  1 MB  → a photo
  1 GB  → a movie
  1 TB  → 1M photos
  1 PB  → 1B photos
```

---

# 🧭 System Design Cheat Sheet

```
Scale reads   → Caching (Redis) + Read Replicas + CDN
Scale writes  → Sharding + Message Queues + Async processing
High avail    → Load Balancer + Multiple servers + Health checks
Low latency   → CDN + Cache + Database indexing
Decouple      → Message Queue (Kafka/RabbitMQ)
Search        → Elasticsearch
File storage  → Object Storage (S3)
Rate limit    → Token Bucket / API Gateway
Monitor       → Prometheus + Grafana + ELK Stack
```

---

# 🏋️ Practice

## Exercise 1: URL Shortener

```
Design a URL shortener (like bit.ly):
  - POST /shorten → returns short URL
  - GET /{shortCode} → redirects to original

Think about:
  - How to generate unique short codes?
  - Database schema?
  - How to handle 1 billion URLs?
  - Caching hot URLs?
  - Analytics (click count)?
```

## Exercise 2: Chat Application

```
Design a real-time chat system:
  - One-to-one messages
  - Group chats (up to 500 members)
  - Online/offline status
  - Message history

Think about:
  - WebSocket vs HTTP polling?
  - How to store messages?
  - How to fan out group messages?
  - What if a user is offline?
```

### Production Reality

**System design principles fail in production in these named ways:**

- **Cache stampede on hot key** — a popular endpoint uses Redis cache with 5-minute TTL. When the cache expires at T=0, 1,000 simultaneous requests all miss the cache and hit the database simultaneously. This "thundering herd" causes a 1,000x load spike. Fix: probabilistic early expiration (cache value includes expiry timestamp; background thread refreshes before TTL) or cache warming via scheduled job.
- **Consistency vs availability during partition** — a split-brain scenario where the primary database and replica are in different network partitions. Writes go to primary (available), reads from replica (stale). CAP theorem: you must choose. Shopping cart: must be available and writable; balance check: must be consistent. Use the right database model for each use case.
- **Connection pool exhaustion from connection leaks** — each microservice maintains its own database connection pool. A slow query in Service A holds a connection for 30 seconds; 50 instances × slow queries exhausts the shared DB connection limit. All 50 instances start queuing. Fix: set `query_timeout` per query, use HikariCP `maxLifetime`, and configure RDS connection pooler (RDS Proxy).
- **Retry storm** — circuit breaker opens after 5 failures; 10,000 queued clients all retry in 30 seconds when the breaker half-opens. Each retry makes the situation worse. Fix: add jitter (random delay) to retry intervals: `sleep = baseDelay + random(0, baseDelay)`. This spreads the retry load.

**Debug workflow:** For cache stampede: monitor cache hit rate; for connection exhaustion: `SHOW PROCESSLIST` in MySQL or `pg_stat_activity` in PostgreSQL. For retry storm: histogram of retry attempt counts.
**Mitigation discipline:** Use circuit breakers with half-open state limits; implement connection timeouts at every hop; use cache-aside with TTL jitter; test failure modes with chaos engineering (Gremlin, LitmusChaos).

---

### Conceptual Depth: The CAP Invariant

**Core invariant:** During a network partition, a distributed system must choose between Consistency and Availability. You cannot have both. (Eric Brewer, PODC 2000, formally proven by Gilbert-Lynch 2002.)

**Why this matters:** Every database or distributed system designer faces this choice. The marketing term "CA" (consistent + available without partition tolerance) is theoretically possible only when partitions never happen — i.e., on a single-node system. In any real network, you must choose.

**The deep pattern:** The choice is encoded in the replication protocol:
- **CP** (Consistency + Partition tolerance): quorum writes, blocking reads → e.g., HBase, Redis Cluster, etcd, ZooKeeper
- **AP** (Availability + Partition tolerance): any-replica writes, async replication → e.g., Cassandra, DynamoDB, CouchDB, Riak

**Constraint that breaks the invariant:** When the network fails (and it will), you cannot serve all reads AND guarantee they return the latest write. The system makes a choice for you — usually the one the developer didn't intend.

**Practical signal:** If your "highly available" database returns stale data after a network blip without an error, you're AP (and the data may be wrong). If your "strongly consistent" database returns errors under load, you're CP.

---

→ **Next:** Now that you know how to design scalable systems, let's look at how to implement them in production: [11_Production_Code_Practices.md](11_Production_Code_Practices.md). The patterns you learned here (load balancing, caching, sharding) need production-grade code practices (12-Factor App, database migrations, deployment strategies) to actually run reliably.

**Next Chapter**: [Dev Tools & Productivity →](10_Dev_Tools_Productivity.md)
