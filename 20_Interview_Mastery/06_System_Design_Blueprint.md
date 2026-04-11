# 🏗️ System Design Blueprint — From Interview to Architecture

[⬅ SQL Interview Thinking](05_SQL_Interview_Thinking.md) | [📚 Index](00_INDEX.md) | [Next: Design Patterns Guide ➡](07_Design_Patterns_Interview_Guide.md)

---

> **"System design interviews test whether you can think at scale — building something that works for millions, not just one user."**

---

## Table of Contents
1. [The System Design Framework](#1-the-system-design-framework)
2. [Back-of-Envelope Estimation](#2-back-of-envelope-estimation)
3. [Building Blocks — The Components](#3-building-blocks)
4. [Core Design Patterns](#4-core-design-patterns)
5. [Database Choices](#5-database-choices)
6. [Complete System Design Walkthroughs](#6-complete-walkthroughs)
7. [Non-Functional Requirements](#7-non-functional-requirements)

---

## 1. The System Design Framework

### The 5W+H for System Design

```
WHAT  → What system are we building? (Define scope & features)
WHO   → Who are the users? How many? (Scale/traffic estimation)
WHY   → Why do specific components exist? (Justify every decision)
WHERE → Where does data live? (Storage, caching, CDN)
WHEN  → When do we need consistency vs availability? (CAP trade-offs)
HOW   → How do components communicate? (Sync/async, protocols)
```

### The 4-Step Framework (Use This in Every Interview)

```
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM DESIGN INTERVIEW FRAMEWORK                    │
│                                                                   │
│  STEP 1: REQUIREMENTS (5 min)                                    │
│  ├── Functional: "What should the system do?"                    │
│  ├── Non-functional: Scale, latency, availability, consistency   │
│  └── Out of scope: "I'll NOT cover X today"                     │
│                                                                   │
│  STEP 2: ESTIMATION (5 min)                                      │
│  ├── Users: DAU, peak concurrent                                 │
│  ├── Traffic: QPS (reads and writes separately)                  │
│  ├── Storage: Per item × items × retention                       │
│  └── Bandwidth: QPS × average response size                     │
│                                                                   │
│  STEP 3: HIGH-LEVEL DESIGN (15 min)                              │
│  ├── Draw the architecture: Client → LB → Services → DB        │
│  ├── Define APIs: endpoint, method, params, response             │
│  ├── Data model: tables, key relationships                       │
│  └── Core flow: write path and read path                         │
│                                                                   │
│  STEP 4: DEEP DIVE (15 min)                                      │
│  ├── Scale bottlenecks: "What breaks at 10x traffic?"           │
│  ├── Failure modes: "What if this component dies?"              │
│  ├── Trade-offs: "Why this choice over alternatives?"            │
│  └── Performance optimization: Caching, CDN, sharding            │
└─────────────────────────────────────────────────────────────────┘
```

---



## 2. Back-of-Envelope Estimation

### The Numbers You Must Know

```
LATENCY NUMBERS (for estimation):
┌─────────────────────────────────┬──────────────────┐
│ Operation                       │ Latency           │
├─────────────────────────────────┼──────────────────┤
│ L1 cache reference              │ 0.5 ns            │
│ L2 cache reference              │ 7 ns              │
│ Main memory reference           │ 100 ns            │
│ SSD random read                 │ 150 μs            │
│ HDD random read                 │ 10 ms             │
│ Send 1 KB over 1 Gbps network  │ 10 μs             │
│ Read 1 MB from memory           │ 250 μs            │
│ Read 1 MB from SSD              │ 1 ms              │
│ Read 1 MB from HDD              │ 20 ms             │
│ Round trip within data center   │ 0.5 ms            │
│ Round trip cross-continent      │ 150 ms            │
└─────────────────────────────────┴──────────────────┘

QUICK CONVERSION:
  1 day  = 86,400 seconds ≈ 100K seconds
  1 year = 31.5 million seconds ≈ 32M seconds
  1 billion requests/day = ~12K QPS = ~24K peak QPS (2x rule)

STORAGE:
  ASCII character   = 1 byte
  UUID              = 16 bytes
  Integer           = 4 bytes (32-bit) / 8 bytes (64-bit)
  Timestamp         = 8 bytes
  Average tweet     = 140 chars + metadata ≈ 300 bytes
  Average image     = 300 KB (compressed)
  Average video min = 50 MB (compressed streaming)
```

### Estimation Template

```
EXAMPLE: Design Twitter

Step 1: Users
  Total users:  500M
  DAU:          200M (40% of total)
  Writes:       Each user tweets 2x/day = 400M tweets/day

Step 2: QPS
  Write QPS:    400M / 86400 ≈ 4600 QPS
  Peak write:   4600 × 2 = ~10K QPS
  Read QPS:     Each user reads 100 tweets = 200M × 100 = 20B/day
  Read QPS:     20B / 86400 ≈ 230K QPS
  Peak read:    ~500K QPS
  → Read-HEAVY system (50:1 read:write ratio)

Step 3: Storage
  Per tweet:    300 bytes text + 16 bytes ID + 8 bytes timestamp = ~400 bytes
  Daily:        400M × 400 bytes = 160 GB/day
  With media:   10% have images → 40M × 300 KB = 12 TB/day
  1 year:       12 TB × 365 = 4.4 PB/year
  → Need: Object storage (S3) for media, distributed DB for metadata

Step 4: Bandwidth
  Read:         500K QPS × 300 bytes (text) = 150 MB/s metadata
  Media reads:  50K QPS × 300 KB = 15 GB/s → need CDN!
```

---

## 3. Building Blocks — The Components

### The Architecture Toolbox

```
┌─────────────────────────────────────────────────────────────────┐
│                 SYSTEM DESIGN BUILDING BLOCKS                     │
│                                                                   │
│  CLIENT TIER                                                      │
│  ├── Web, Mobile, API clients                                    │
│  └── CDN (static assets, cached content)                         │
│                                                                   │
│  ROUTING TIER                                                     │
│  ├── DNS                                                         │
│  ├── Load Balancer (L4 TCP / L7 HTTP)                           │
│  └── API Gateway (auth, rate limiting, routing)                  │
│                                                                   │
│  APPLICATION TIER                                                 │
│  ├── Web Servers (stateless, horizontally scalable)              │
│  ├── Microservices (domain-specific logic)                       │
│  └── Workers (async processing, queue consumers)                 │
│                                                                   │
│  COMMUNICATION                                                    │
│  ├── REST / GraphQL / gRPC                                       │
│  ├── Message Queue (Kafka, RabbitMQ, SQS)                       │
│  └── Pub/Sub (event-driven decoupling)                           │
│                                                                   │
│  DATA TIER                                                        │
│  ├── RDBMS (PostgreSQL, MySQL) — structured, ACID                │
│  ├── NoSQL (MongoDB, DynamoDB, Cassandra) — flexible, scale      │
│  ├── Cache (Redis, Memcached) — fast reads                       │
│  ├── Search (Elasticsearch) — full-text search                   │
│  ├── Object Store (S3) — blobs, media                            │
│  └── Time Series (InfluxDB) — metrics, logs                     │
│                                                                   │
│  SCALING INFRA                                                    │
│  ├── Horizontal scaling (more machines)                          │
│  ├── Sharding (partition data)                                   │
│  ├── Replication (copies for availability + read scaling)        │
│  └── Auto-scaling (adjust capacity with load)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Load Balancer Deep Dive

```
ALGORITHMS:
  Round Robin       → Simple rotation. Good for uniform servers.
  Weighted RR       → More traffic to stronger servers.
  Least Connections → Route to server with fewest active requests.
  IP Hash           → Same client → same server (session affinity).
  Consistent Hashing → Minimizes re-routing when servers added/removed.

L4 vs L7:
  L4 (Transport): Routes based on IP + port. Faster, can't inspect content.
  L7 (Application): Routes based on URL, headers, cookies. Smarter, slower.

  "For microservices, I'd use L7 because we can route /api/users to the
   user service and /api/orders to the order service."
```

### Caching Strategy

```
CACHING PATTERNS:

  1. Cache-Aside (Lazy Loading):
     Read: Check cache → miss → read DB → populate cache → return
     Write: Write DB → invalidate cache
     ✅ Only caches what's actually read
     ❌ Cache miss = slower (DB read + cache write)

  2. Write-Through:
     Write: Write cache → cache writes to DB → return
     Read: Always from cache (always fresh)
     ✅ Cache always consistent with DB
     ❌ Write latency (two writes per request)

  3. Write-Behind (Write-Back):
     Write: Write cache → return immediately → async write to DB
     ✅ Very fast writes
     ❌ Risk of data loss if cache crashes before DB write

  4. Read-Through:
     Read: App reads from cache → cache fetches from DB if miss
     ✅ App code is simple (doesn't know about DB)
     ❌ Cache library must understand DB

EVICTION POLICIES:
  LRU (Least Recently Used)    → Most common. Good general purpose.
  LFU (Least Frequently Used)  → Better for skewed access patterns.
  TTL (Time To Live)           → Expiration-based. Good for session data.
  FIFO                         → Simple but not great for hit rate.

INTERVIEW: "I'd use cache-aside with Redis and a 5-minute TTL.
This gives us eventual consistency and handles cache failures
gracefully — if Redis is down, we fall back to the database."
```

### Message Queue Patterns

```
WHY QUEUES?
  1. Decouple producers from consumers
  2. Handle traffic spikes (buffer)
  3. Enable async processing
  4. Guarantee delivery (at-least-once)

PATTERNS:

  Point-to-Point: Each message consumed by one consumer
  → Use for: Task distribution (process payment, send email)

  Pub/Sub: Each message received by all subscribers
  → Use for: Event notification (user signed up → email + analytics + CRM)

  Fan-out: One message triggers multiple independent workflows
  → Use for: Order placed → inventory, shipping, notification

KAFKA vs RABBITMQ:
  Kafka:    Log-based, high throughput, replay-able, ordered within partition
  RabbitMQ: Traditional queue, flexible routing, per-message acknowledgment

  "For event sourcing and high-throughput streams, I'd choose Kafka.
   For traditional task queues with complex routing, RabbitMQ."
```

---




## 4. Core Design Patterns

### Rate Limiter

```
ALGORITHMS:
  1. Token Bucket: Refills at fixed rate. Allows bursts up to bucket size.
  2. Leaky Bucket: Constant outflow rate. Smooths traffic.
  3. Fixed Window Counter: Count per time window. Simple but boundary spike.
  4. Sliding Window Log: Track each request timestamp. Accurate but memory heavy.
  5. Sliding Window Counter: Hybrid (weighted average of current + prev window).

  "I'd use Token Bucket for API rate limiting because it handles bursts
   naturally while maintaining an average rate limit."

DISTRIBUTED RATE LIMITER:
  Challenge: Multiple servers must share rate state.
  Solution: Centralized Redis counter with Lua script for atomicity.

  -- Pseudocode:
  -- MULTI
  --   INCR user:{id}:requests
  --   EXPIRE user:{id}:requests 60
  -- EXEC
  -- If count > limit → reject (HTTP 429)
```

### Consistent Hashing

```
PROBLEM: Simple hash (key % N servers) → adding/removing server
         reshuffles EVERYTHING. Terrible for cache invalidation.

SOLUTION: Consistent Hashing
  1. Map both servers and keys to a ring (0 to 2^32)
  2. Each key goes to the NEXT server clockwise
  3. Adding a server only moves keys between neighbors

  Ring: 0 ──── Server A ──── Server B ──── Server C ──── 2^32
        Key1→A  Key2→B  Key3→C  Key4→A ...

  Add Server D between A and B:
        Only keys between A and D move. No other keys affected!

  Virtual Nodes: Each server gets multiple positions on ring.
  → Prevents hotspots from uneven distribution.

USE IN: Distributed caches, CDN, database sharding, load balancing
```

### Data Partitioning (Sharding)

```
STRATEGIES:
  1. Hash-based:   shard = hash(key) % num_shards
     ✅ Even distribution
     ❌ Range queries need scatter-gather

  2. Range-based:  shard by date range, alphabet range, geographic region
     ✅ Range queries are shard-local
     ❌ Hotspots (everyone writes to "current" shard)

  3. Directory-based: Lookup table maps key → shard
     ✅ Flexible (can rebalance easily)
     ❌ Lookup table is a bottleneck / single point of failure

SHARD KEY CHOICE (Critical Decision):
  Q: "What happens if we shard users by user_id?"
  A: "Queries for a single user are fast (one shard), but queries
      across users (leaderboard, search) need scatter-gather across
      ALL shards."

  Q: "What about sharding by date?"
  A: "Recent data gets all the traffic (hot shard). Old shards are idle.
      Fine for archival, terrible for active workloads."

CROSS-SHARD QUERIES:
  "If we need cross-shard operations (joins, aggregations), I'd use:
   1. Application-level fan-out (query all shards, merge in app)
   2. A separate denormalized read-store (Elasticsearch)
   3. Or reconsider shard key to co-locate related data"
```

---



## 5. Database Choices

### The Decision Matrix

```
┌──────────────────┬──────────────────┬──────────────────────┬──────────────────┐
│ Requirement       │ Best Choice       │ Why                   │ Example          │
├──────────────────┼──────────────────┼──────────────────────┼──────────────────┤
│ ACID transactions │ PostgreSQL/MySQL  │ Strong consistency    │ Banking, orders  │
│ Flexible schema   │ MongoDB           │ Document model        │ User profiles    │
│ High write volume │ Cassandra         │ LSM tree, AP system   │ IoT sensor data  │
│ Key-value cache   │ Redis             │ In-memory, sub-ms     │ Sessions, cache  │
│ Full-text search  │ Elasticsearch     │ Inverted index        │ Product search   │
│ Graph queries     │ Neo4j             │ Native graph traversal│ Social networks  │
│ Time series       │ InfluxDB/TimescaleDB│ Optimized retention│ Metrics, logs    │
│ Wide column       │ HBase/Cassandra   │ Sparse, flexible cols │ Recommendations  │
│ Object/blob store │ S3                │ Unlimited scale       │ Images, videos   │
│ Message stream    │ Kafka             │ Ordered log, replay   │ Event sourcing   │
└──────────────────┴──────────────────┴──────────────────────┴──────────────────┘
```

### CAP Theorem — The Real Interview Answer

```
CAP THEOREM:
  A distributed system can guarantee at most TWO of three:
    C = Consistency:  Every read gets the most recent write
    A = Availability: Every request gets a response (even if stale)
    P = Partition Tolerance: System works despite network partitions

  In practice, P is non-negotiable (networks WILL partition), so the
  real choice is:

    CP: Consistent + Partition Tolerant
        → Block requests during partitions to maintain consistency
        → Use for: Banking, inventory (can't sell item that's gone)
        → Systems: PostgreSQL, MongoDB, HBase, ZooKeeper

    AP: Available + Partition Tolerant
        → Serve requests during partitions (may be stale)
        → Use for: Social media feeds, product listings (stale OK)
        → Systems: Cassandra, DynamoDB, CouchDB

INTERVIEW PHRASING:
  "For this system, I'd prioritize availability over strict consistency
   because a user seeing a slightly stale feed for a few seconds is
   acceptable, but the system going down is not. I'd use eventual
   consistency with a convergence window of < 5 seconds."
```

---

## 6. Complete System Design Walkthroughs

### Design: URL Shortener (Like bit.ly)

```
REQUIREMENTS:
  Functional: Create short URL → redirect to original
  Non-functional: 100M URLs/day, 10:1 read:write, < 50ms redirect

ESTIMATION:
  Write: 100M / 86400 ≈ 1200 QPS, peak ~2400
  Read:  1B / 86400 ≈ 12K QPS, peak ~24K
  Storage: 100 bytes/URL × 100M/day × 365 × 5 years = 18 TB

SHORT URL GENERATION:
  Option 1: Auto-increment → Simple but predictable, single point bottleneck.
  Option 2: MD5/SHA256 truncated → Collision risk with short hash.
  Option 3: Base62 encoding of counter → 7 chars = 62^7 = 3.5 trillion URLs.
  → Choose: Distributed counter (Snowflake ID) → Base62 encode

ARCHITECTURE:
  Client → CDN (if cacheable) → LB → API servers → Cache (Redis) → DB

  WRITE PATH:
    POST /api/shorten { longUrl: "..." }
    → Generate short code (Base62 of Snowflake ID)
    → Write to DB: { short_code, long_url, created_at, user_id }
    → Write to cache: short_code → long_url
    → Return short URL

  READ PATH:
    GET /{short_code}
    → Check Redis cache → HIT → 301 redirect
    → MISS → Query DB → populate cache → 301 redirect

  301 vs 302 REDIRECT:
    301 Permanent → Browser caches, reduces server load, but can't track clicks
    302 Temporary → Every click hits server, allows analytics
    → "I'd use 302 for analytics then batch-write click data via Kafka."

DATABASE:
  Primary: PostgreSQL with partition by created_at
  Cache: Redis with 24-hour TTL
  Analytics: Kafka → ClickHouse for click stream
```

### Design: Chat System (Like WhatsApp)

```
REQUIREMENTS:
  - 1:1 messaging, group chats (up to 500 members)
  - Read receipts, online status
  - 500M DAU, each sends 40 messages/day

ESTIMATION:
  Messages: 500M × 40 = 20B messages/day ≈ 230K writes/sec
  Storage: 100 bytes/msg × 20B = 2 TB/day
  → Write-HEAVY + real-time requirements

KEY DECISIONS:

  1. PROTOCOL: WebSocket (persistent bidirectional connection)
     "HTTP polling wastes bandwidth. WebSocket keeps a persistent
      connection so the server can push messages instantly."

  2. MESSAGE STORAGE: Cassandra (write-optimized, partition by chat_id)
     Schema: partition_key = chat_id, clustering_key = timestamp
     → All messages in a chat are on one partition → fast retrieval

  3. DELIVERY:
     User online → Push via WebSocket
     User offline → Store in "pending" queue → push on reconnect
     → Like a message queue per user

  4. GROUP MESSAGES:
     "For a group of 500, I won't fan-out the message to 500 copies.
      Instead: store ONE copy, maintain membership, each member
      reads from the group's message stream."

  5. READ RECEIPTS:
     Table: read_status(user_id, chat_id, last_read_timestamp)
     When user opens chat → update last_read_timestamp
     Recipients check: msg.timestamp > last_read → unread

ARCHITECTURE:
  ┌───────┐  WebSocket  ┌──────────┐     ┌──────────┐
  │Client ├────────────►│Chat Svc  ├────►│Cassandra │
  └───────┘             └─────┬────┘     └──────────┘
                              │ Kafka
                        ┌─────▼────┐     ┌──────────┐
                        │Presence  │     │Redis     │
                        │Service   ├────►│(online   │
                        └──────────┘     │ status)  │
                                         └──────────┘
```

### Design: News Feed (Like Twitter Timeline)

```
THE KEY TRADE-OFF: Push vs Pull

PULL (Fan-out on read):
  Timeline request → query all followees → merge & sort → return
  ✅ Write is fast (just store tweet)
  ❌ Read is slow (scatter-gather across N followees)

PUSH (Fan-out on write):
  New tweet → push to ALL followers' timeline caches
  ✅ Read is instant (pre-computed in Redis list)
  ❌ Celebrity problem (user with 50M followers → 50M writes!)

HYBRID (Best practice):
  Regular users (< 10K followers): PUSH to followers' timelines
  Celebrities (> 10K followers): PULL at read time, merge with pushed
  "This eliminates the celebrity write storm while keeping reads fast
   for the 99% of tweets from regular users."
```

---



## 7. Non-Functional Requirements

### Reliability Patterns

```
PATTERN: CIRCUIT BREAKER
  States: CLOSED (normal) → OPEN (failing) → HALF-OPEN (testing)

  "If the payment service returns 5 errors in 10 seconds, the circuit
   breaker opens and returns a fallback response immediately for 30
   seconds. Then it lets one request through to test recovery."

PATTERN: RETRY WITH EXPONENTIAL BACKOFF
  Attempt 1: Wait 1s, Attempt 2: Wait 2s, Attempt 3: Wait 4s + jitter
  "I add random jitter (0 to 1s) to prevent thundering herd — all
   clients retrying at the exact same moment."

PATTERN: IDEMPOTENCY
  Problem: Retry causes duplicate payment
  Solution: Idempotency key (client-generated UUID)
  "The client sends a unique key with each request. Server stores
   completed keys. If the same key arrives again, return the cached
   result without re-processing."

PATTERN: BULKHEAD
  "Isolate failures. The image upload service gets its own thread pool.
   If it's overwhelmed, the rest of the system continues normally."

PATTERN: SAGA FOR DISTRIBUTED TRANSACTIONS
  1. Order Service: Create order (pending)
  2. Payment Service: Charge card
  3. Inventory Service: Reserve items
  4. Order Service: Confirm order

  If step 3 fails:
  → Compensating transaction: Refund payment (undo step 2)
  → Mark order as failed (undo step 1)
  
  "I'd use a choreography saga with Kafka events for loose coupling,
   or orchestration saga for complex workflows with many steps."
```

### Observability

```
THE THREE PILLARS:

  LOGS: What happened? (Structured JSON logs → ELK stack)
    { "time": "...", "service": "payment", "action": "charge",
      "user_id": 123, "amount": 99.99, "status": "success" }

  METRICS: How is the system performing? (Prometheus + Grafana)
    - Request rate (QPS per endpoint)
    - Error rate (5xx / total)
    - Latency (P50, P95, P99)
    - Resource usage (CPU, memory, disk, network)

  TRACES: How does a request flow? (Jaeger / Zipkin)
    Request 123 → API Gateway (2ms) → User Service (15ms) →
    DB Query (8ms) → Cache Write (1ms) = Total: 26ms

  "I'd set SLOs of P99 latency < 200ms and error rate < 0.1%,
   with alerts at P95 latency > 150ms for early warning."
```

---



> 🔬 **Section Challenge — 7. Non-Functional Requirements**
>
> **Challenge 1 (Reasoning):** Why can't you use a window function in a WHERE clause? How do you filter on window function results?
> <details><summary>Answer</summary>
>
> Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
> </details>
>
> **Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
> <details><summary>Answer</summary>
>
> Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
> </details>
>

## Cross-References

| Topic | Deep Dive |
|-------|-----------|
| System Design Fundamentals | [06_OOP_Design/03_System_Design](../06_OOP_Design/03_System_Design.md) |
| Real-World DSA Problems | [10_Enterprise_Systems/03-06](../10_Enterprise_Systems/03_RealWorld_Problems_DSA.md) |
| SQL Performance at Scale | [08_SQL/47_Theory_Deep_Dive](../08_SQL/47_Theory_Deep_Dive_Database_Internals.md) |
| Data Structures for Systems | [02_Data_Structures/01](../02_Data_Structures/01_DataStructures_Complete.md) |
| Constraint Analysis | [02_Constraint_to_Algorithm_Map](02_Constraint_to_Algorithm_Map.md) |

---

[⬅ SQL Interview Thinking](05_SQL_Interview_Thinking.md) | [📚 Index](00_INDEX.md) | [Next: Design Patterns Guide ➡](07_Design_Patterns_Interview_Guide.md)

---

## 🏋️ Practice & Interview Questions — OOP & Design Patterns

### Predict / Trace
**Q1.** What design pattern does this code follow?
```java
Logger logger = Logger.getInstance();
```
<details><summary>Answer</summary>

**Singleton** — ensures only one Logger instance exists globally.
</details>

**Q2.** What SOLID principle is violated?
```java
class User {
    void login() { ... }
    void logout() { ... }
    void sendEmail() { ... }  // ← ?
    void generateReport() { ... }  // ← ?
}
```
<details><summary>Answer</summary>

**SRP (Single Responsibility)** — User class has 4 responsibilities: authentication, email, reporting. Should be split into: `AuthService`, `EmailService`, `ReportService`.
</details>

### Design Pattern Problems
**Q3.** ⭐ Implement Strategy pattern for payment processing.
<details><summary>Solution</summary>

```java
interface PaymentStrategy { void pay(int amount); }
class CreditCard implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class PayPal implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class UPI implements PaymentStrategy { public void pay(int amount){ /*...*/ } }

class PaymentContext {
    private PaymentStrategy strategy;
    void setStrategy(PaymentStrategy s){ this.strategy=s; }
    void processPayment(int amount){ strategy.pay(amount); }
}
// Switch strategy at runtime — open/closed principle!
```
</details>

**Q4.** ⭐⭐ Implement Observer pattern for event notification.
<details><summary>Solution</summary>

```java
interface Observer { void update(String event); }
interface Observable {
    void subscribe(Observer o); void unsubscribe(Observer o); void notify(String event);
}
class EventBus implements Observable {
    List<Observer> observers = new ArrayList<>();
    public void subscribe(Observer o){ observers.add(o); }
    public void unsubscribe(Observer o){ observers.remove(o); }
    public void notify(String event){ observers.forEach(o -> o.update(event)); }
}
```
</details>

**Q5.** ⭐⭐ Builder pattern for a complex configuration object.
<details><summary>Solution</summary>

```java
class ServerConfig {
    private final String host; private final int port; private final int timeout;
    private ServerConfig(Builder b){ host=b.host; port=b.port; timeout=b.timeout; }

    static class Builder {
        String host="localhost"; int port=8080; int timeout=30;
        Builder host(String h){ host=h; return this; }
        Builder port(int p){ port=p; return this; }
        Builder timeout(int t){ timeout=t; return this; }
        ServerConfig build(){ return new ServerConfig(this); }
    }
}
// ServerConfig config = new ServerConfig.Builder().host("prod.com").port(443).build();
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | SOLID: O stands for | Open/Closed Principle |
| 2 | Factory vs Abstract Factory | Factory: one product; Abstract Factory: family of products |
| 3 | Composition over inheritance means | Prefer has-a (field) over is-a (extends) for flexibility |
| 4 | Decorator pattern purpose | Add behavior dynamically without subclassing |
| 5 | Facade pattern purpose | Simplified interface to complex subsystem |
| 6 | Proxy pattern types | Virtual, protective, remote, caching |
| 7 | Command pattern encapsulates | Request as an object (supports undo/redo) |
| 8 | Template Method pattern | Defines algorithm skeleton, subclasses fill in steps |

---

## 🧠 Deep Conceptual Questions — OOP, SOLID & Design Patterns

**C1. What is the difference between an interface and an abstract class — when to use each?**
<details><summary>Deep Answer</summary>

**Abstract class**: can have fields, constructors, concrete method implementations. Models IS-A with shared state and behavior. Use when: you have partial implementation to share (template method pattern). Single inheritance: if you extend an abstract class, you can't extend another. **Interface**: pure contract, no state (Java 8+: default methods allowed). Models CAN-DO / role capability. A class can implement unlimited interfaces. Use when: defining a capability across unrelated classes (`Comparable`, `Serializable`, `Runnable`). Rule: prefer interfaces for type definitions. Use abstract class when you need to share implementation code AND all subtypes share the same "IS-A" relationship. In practice: interfaces + composition > abstract class + inheritance.
</details>

**C2. Liskov Substitution Principle: what does it actually mean and how do you violate it?**
<details><summary>Deep Answer</summary>

LSP: if `S extends P`, anywhere you use `P`, you should be able to use `S` without breaking correctness. Violation example: `Square extends Rectangle`. Rectangle behavior: setWidth and setHeight are independent. Square invariant: width must equal height. `Square s = new Square(5); s.setWidth(10);` — now `s.getHeight() == 10` (Square enforced equality) but Rectangle contract says height should still be 5. Code using Rectangle is surprised. Better: Square and Rectangle as siblings under a Shape hierarchy. Another classic: override a method and throw exception for a case the parent method handled → violates LSP. Test: can you run the parent's test suite against the child and pass?
</details>

**C3. Strategy pattern vs. if-else chains: the OCP argument.**
<details><summary>Deep Answer</summary>

```java
// BAD: add new payment type = modify this method = Open for modification (violates OCP)
if(type == "credit") { } else if(type == "paypal") { } else if(type == "crypto") { }

// GOOD: add new payment = new class, zero modification of existing code
interface PaymentStrategy { void pay(int amount); }
// Add Crypto: new CryptoPayment implements PaymentStrategy — no other file touched
```
Open/Closed Principle: open for extension, closed for modification. Each `else if` = a modification to an existing method = risk of breaking existing behavior, requires re-testing the entire method. Strategy = extension by new class = old code untouched = zero regression risk. When if-else is fine: 2-3 fixed cases that never change. When strategy shines: extensible behaviors that vary at runtime.
</details>

**C4. What is the Dependency Inversion Principle and how does it enable testability?**
<details><summary>Deep Answer</summary>

DIP: high-level modules should not depend on low-level modules — both should depend on abstractions. Without DIP: `OrderService` directly creates `MySQLOrderRepository`. To test OrderService: must have MySQL running. With DIP: `OrderService` depends on `OrderRepository` interface. In production: inject `MySQLOrderRepository`. In tests: inject `MockOrderRepository`. The high-level business logic (OrderService) has zero knowledge of the database layer. This makes: unit testing trivial (mock the interface), swapping implementations easy (SQLite, PostgreSQL, in-memory), layer boundaries clear. Dependency INJECTION (DI framework like Spring) is the mechanism that enables DIP at runtime.
</details>

**C5. Observer pattern vs. Event Bus: when does one become the other?**
<details><summary>Deep Answer</summary>

**Observer**: subject holds direct references to observer objects. Subject explicitly notifies each one. Tightly coupled (subject knows about observers). Fine for: small systems, known observers at compile time. Breaks when: observers span different modules, dynamic subscription needed, observers need to be remote. **Event Bus / Message Queue**: publishers and subscribers decoupled. Publisher sends event with a TYPE to the bus. Subscribers register for event types — publisher doesn't know who's listening. De-facto standard in large systems: Spring ApplicationEventPublisher, Kafka, RabbitMQ are all event buses. Rule: Observer for in-process tightly-coupled notification. Event bus for loose coupling, cross-module, or distributed communication.
</details>

