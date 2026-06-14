> **Navigation**: [< Previous](14_Optimization_Pipeline.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_Distributed_Systems_Thinking.md)

# Mental Models — System Design Thinking

## How to THINK About System Design

> System design isn't about memorizing architectures.
> It's about developing THINKING FRAMEWORKS that help you
> navigate ANY design problem you've never seen before.
>
> This guide gives you the MENTAL TOOLBOX — not the answers,
> but the way to ARRIVE at answers.

---

## Mental Model 1: Start With the User, Not the Database

```
THE TOP-DOWN APPROACH

Most beginners: "Let me design the database schema first"
Experienced:    "Let me understand what the USER does first"

STEP 1: Who are the users? What do they DO?
        → List the core actions (verbs)
        "Users post tweets, follow people, see a feed"

STEP 2: What does the system SHOW them?
        → List the core views (pages/screens)
        "Home feed, profile page, search results"

STEP 3: What data do those views NEED?
        → This tells you what to store and how to query

STEP 4: NOW design the storage to support those queries.

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Users   │ →  │  Actions │ →  │  Views   │ →  │  Storage │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Mental Model 2: The Napkin Math Framework

```
BACK-OF-THE-ENVELOPE ESTIMATION

Before designing, ESTIMATE the scale:

NUMBERS TO MEMORIZE:
┌──────────────────────────────────────────────┐
│  1 day     = 86,400 seconds ≈ 100K seconds   │
│  1 month   = 2.5 million seconds             │
│  1 year    = 30 million seconds              │
│  1 char    = 1 byte (ASCII) / 2 bytes (UTF)  │
│  1 tweet   ≈ 300 bytes                       │
│  1 image   ≈ 300 KB                          │
│  1 video   ≈ 5 MB/min (compressed)           │
│  1 GB      = 1 billion bytes                 │
│  1 TB      = 1,000 GB                        │
└──────────────────────────────────────────────┘

EXAMPLE: Twitter-like system, 100M daily active users

Tweets/day:    100M × 0.1 (10% tweet) = 10M tweets/day
Tweets/second: 10M / 86,400 ≈ 115 TPS (write)
Reads/second:  100M × 10 reads / 86,400 ≈ 11,500 TPS (read)
Storage/day:   10M × 300B = 3 GB/day
Storage/year:  3 GB × 365 ≈ 1 TB

Insight: Read-heavy (100:1 ratio) → need caching + CDN
```

---

## Mental Model 3: The Trade-Off Triangle

## Choice │ Trade-Off

SQL vs NoSQL │ Consistency vs Flexibility
Cache vs No Cache │ Speed vs Freshness
Monolith vs Micro │ Simplicity vs Scalability
Sync vs Async │ Simplicity vs Throughput
Normalize vs Denorm │ Write speed vs Read speed
Push vs Pull │ Latency vs Resource usage

---

## Mental Model 4: Scale in Stages

```
DON'T JUMP TO DISTRIBUTED SYSTEMS — SCALE PROGRESSIVELY

Stage 1: Single Server (0 → 1K users)
┌──────────────────────────────────────┐
│  App Server + Database on ONE box    │
└──────────────────────────────────────┘

Stage 2: Separate DB (1K → 10K users)
┌───────────┐    ┌───────────────┐
│  App      │ →  │  Database     │
│  Server   │    │  (separate)   │
└───────────┘    └───────────────┘

Stage 3: Add Cache + CDN (10K → 100K users)
┌───────────┐    ┌───────┐    ┌────────┐
│  App      │ →  │ Cache │ →  │  DB    │
│  Server   │    │(Redis)│    │        │
└───────────┘    └───────┘    └────────┘
     + CDN for static assets

Stage 4: Load Balancer + Replicas (100K → 1M users)
          ┌────────┐    ┌────────┐
[LB] →   │ App 1  │    │  DB    │ ← writes
     →   │ App 2  │    │ Primary│
     →   │ App 3  │    └────┬───┘
          └────────┘    ┌───▼────┐
                        │  DB    │ ← reads
                        │ Replica│
                        └────────┘

Stage 5: Microservices + Sharding (1M+ users)
Only NOW consider breaking into services + horizontal sharding

KEY INSIGHT: Over-engineering at Stage 1 is worse than
under-engineering. Build for 10x your current scale, not 1000x.
```

---

## Mental Model 5: The Read/Write Split

> FIRST QUESTION FOR ANY SYSTEM: Is it READ-heavy or WRITE-heavy?
>
> READ-HEAVY (100:1) WRITE-HEAVY (1:1 or more)
> ───────────────── ──────────────────────
> Social media feeds Chat messages
> E-commerce product pages IoT sensor data
> News/blog sites Financial transactions
> Search results Logging/analytics
>
> READ-HEAVY OPTIMIZATIONS: WRITE-HEAVY OPTIMIZATIONS:
>
> - Caching (Redis, CDN) • Write-ahead log
> - Read replicas • Async processing (queues)
> - Denormalization • Batch writes
> - Materialized views • LSM-Tree stores (Cassandra)
> - Pre-computed feeds • Partitioning/sharding
>
> MIXED? Use CQRS:
> Command (write) → one model
> Query (read) → different, optimized model

---

## Mental Model 6: Failure Will Happen — Design For It

## If This Fails... │ We Should...

Database goes down │ Failover to replica
Cache goes down │ Fall through to DB
Service times out │ Circuit breaker + fallback
Queue is full │ Backpressure + dead letter
Region goes down │ Multi-region failover
Deployment is buggy │ Canary + quick rollback
Data is corrupted │ Backup + point-in-time
Traffic spikes 10x │ Auto-scaling + rate limit

---

## Mental Model 7: The Funnel Pattern

> WEB REQUEST FLOW — Think of It as a Funnel
>
> Each layer FILTERS and OPTIMIZES before hitting the next:
>
> DNS (Route 53) → Resolve to IP
> │
> CDN (CloudFront) → Serve cached static content (90% done)
> │
> Load Balancer → Distribute remaining requests
> │
> Rate Limiter → Block abusive traffic
> │
> API Gateway → Auth, throttle, route
> │
> Application Cache → Return cached API responses
> │
> Application Server → Business logic (only ~5% of original)
> │
> Database → Only queries that MUST hit storage
>
> INSIGHT: 95% of requests should NEVER reach your database.
> Each layer is a chance to serve the response earlier.

---

## Mental Model 8: The Interview Navigation Map

> 45-MINUTE SYSTEM DESIGN INTERVIEW — TIME ALLOCATION
>
> [0-5 min] CLARIFY
>
> - Ask about scale (users, data, requests/second)
> - Ask about constraints (latency, availability, consistency)
> - Ask about features (MVP vs full-featured)
>   → "Are we designing for 1K users or 100M?"
>
> [5-10 min] HIGH-LEVEL DESIGN
>
> - Draw the main components (client, server, database, cache)
> - Define the API (2-3 core endpoints)
> - Identify the data model (key entities + relationships)
>
> [10-30 min] DEEP DIVE
>
> - Most complex component in detail
> - Data flow for core use case
> - Handle scale: sharding, caching, replication
>   → This is where you show DEPTH. Pick the hard part.
>
> [30-40 min] TRADE-OFFS & EDGE CASES
>
> - What happens during failures?
> - Alternative approaches you considered
> - Bottlenecks and how to address them
>
> [40-45 min] WRAP UP
>
> - Summarize key decisions
> - Mention what you'd add with more time
> - Open for interviewer questions

---

## Quick Decision Framework

> WHEN STUCK, ASK THESE 5 QUESTIONS:
>
> 1. What's the READ:WRITE ratio?
>    → Drives caching and replication strategy
> 2. What's the CONSISTENCY requirement?
>    → Drives database choice and replication mode
> 3. What's the LATENCY requirement?
>    → Drives where to put caches and how to pre-compute
> 4. What's the DATA SIZE and GROWTH rate?
>    → Drives partitioning and storage tier decisions
> 5. What FAILS gracefully and what CAN'T fail?
>    → Drives redundancy, replication, and backup strategy

---

_System design is a conversation, not a test. Show your thinking process — that matters more than the final diagram._

## NEW DIAGRAM — System Design Decision Flow (Traffic Type → Architecture Pattern)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: System Design Decision Flow — Traffic Pattern to Architecture     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  START: What kind of traffic does the system handle?                         │
│     │                                                                        │
│     └── Is it READ-HEAVY or WRITE-HEAVY or MIXED?                           │
│         │                                                                    │
│         ├── READ-HEAVY (>80% reads)                                         │
│         │   ├── Static content (images, CSS, JS)                           │
│         │   │   └── → CDN (Content Delivery Network)                       │
│         │   │       + Browser caching (Cache-Control headers)              │
│         │   │                                                                    │
│         │   ├── User-specific data (feed, profile)                         │
│         │   │   └── → Cache (Redis/Memcached) IN FRONT of DB              │
│         │   │       + Read-through or write-through pattern                │
│         │   │       + Cache-aside: app checks cache first, then DB        │
│         │   │                                                                    │
│         │   └── Frequently computed aggregates (leaderboards, stats)       │
│         │       └── → Precompute + Store (don't recompute on read)         │
│         │           + Background job refreshes periodically                │
│         │                                                                    │
│         ├── WRITE-HEAVY (>50% writes)                                       │
│         │   ├── High throughput ingestion (events, logs, metrics)          │
│         │   │   └── → Message Queue (Kafka, RabbitMQ)                      │
│         │   │       + Decouples write from processing                      │
│         │   │       + Workers consume at their own pace                    │
│         │   │                                                                    │
│         │   └── Social interactions (posts, comments, likes)               │
│         │       └── → Event sourcing or async write-back                   │
│         │           + Fan-out on write vs fan-out on read                  │
│         │                                                                    │
│         └── READ-WRITE MIX (both heavy)                                     │
│             ├── CQRS pattern (separate read/write models)                  │
│             │   + Write side: process + store in write-optimized DB       │
│             │   + Read side: sync to read-optimized store (materialized)  │
│             │                                                                    │
│             └── Consider: What is the write pattern?                       │
│                 → Time-series (metrics, events) → TimescaleDB, InfluxDB  │
│                 → Relational (users, transactions) → PostgreSQL          │
│                 → Document (flexible schema) → MongoDB                   │
│                 → Graph (relationships) → Neo4j                          │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  NEXT DECISION: Do you need GLOBAL scale (multi-region)?                   │
│     │                                                                        │
│     ├── Single region (most apps) → Simplify, don't over-engine           │
│     │   └── Start with: App server + primary DB + read replica            │
│     │                                                                    │
│     └── Multi-region / Global scale                                        │
│         ├── Need strong consistency? → Synchronous replication (CP)       │
│         │   └── Example: financial transactions, inventory                 │
│         │                                                                    │
│         ├── Need high availability? → Asynchronous replication (AP)       │
│         │   └── Example: social feeds, user content, logs                  │
│         │                                                                    │
│         └── Need tunable consistency? → Quorum reads/writes               │
│             + Dynamo-style (R + W > N)                                     │
│             + Cassandra: eventual by default, tunable per query           │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  SHARDING DECISION (when single DB can't handle load):                     │
│     │                                                                        │
│     ├── Shard by USER ID (user-specific data) → even distribution        │
│     │   └── Consistent hashing: new user → hash → find shard node         │
│     │                                                                    │
│     ├── Shard by TIME (time-series data) → range queries per time        │
│     │   └── Example: logs, metrics, events by date                        │
│     │                                                                    │
│     └── Shard by GEOGRAPHY (location-based) → local reads/writes         │
│         └── Example: store data in the region closest to user             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  ARCHITECTURE DECISION SUMMARY:                                        │    │
│  │                                                                       │    │
│  │  Read-heavy + static     → CDN + Browser cache                        │    │
│  │  Read-heavy + dynamic    → Redis cache + Read replica                │    │
│  │  Write-heavy + async     → Message queue + Workers                   │    │
│  │  Both heavy + consistent → CQRS + sync replication                   │    │
│  │  Both heavy + available  → CQRS + async replication                  │    │
│  │  Global scale + HA       → Multi-region + eventual consistency       │    │
│  │  Global scale + finance  → Synchronous multi-region + CP              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1983 | Lampson | "Hints for Computer System Design" — principled system design |
| 2000 | Brewer | CAP conjecture — consistency/availability tradeoff |
| 2002 | Gilbert & Lynch | CAP proof — formal characterization of the tradeoff |
| 2008 | Vogels | Eventually Consistent — BASE model for distributed systems |

**Evolution narrative**: System design thinking as a structured discipline emerged from three waves. Butler Lampson's 1983 "Hints for Computer System Design" provided the first principled framework: systems should be designed for the common case, failures should be explicit, and the design should admit graceful degradation. Eric Brewer's 2000 PODC keynote introduced the CAP conjecture (Consistency, Availability, Partition tolerance — pick two) as a design decision framework rather than a theoretical constraint. Seth Gilbert and Nancy Lynch's 2002 proof formalized CAP as a theorem, providing mathematical certainty to the tradeoff intuition. Werner Vogels's 2008 "Eventually Consistent" paper and Amazon's Dynamo work established the practical vocabulary for navigating this tradeoff: the BASE model (Basically Available, Soft state, Eventually consistent) as a complement to ACID's strong consistency.

**Modern practice anchor**: Today's system design interview methodology (Grokking the System Design Interview, Designing Data-Intensive Applications by Martin Kleppmann) synthesizes all four contributions: Lampson's design principles guide the conversation flow, CAP provides the core tradeoff vocabulary, and eventually consistent/BASE thinking informs modern designs like DynamoDB, Cassandra, and CockroachDB.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Netflix Cassandra Multi-Region Eventual Consistency — Write Conflict During Partition

**What goes wrong**: Netflix ran Cassandra across multiple AWS regions. During a network partition (one region isolated), writes went to the available region. When the partition healed, concurrent writes to the same key in both regions created conflicting versions. Without proper conflict resolution, user data was duplicated or lost depending on which version the read coordinator chose.

**Cost**: User data inconsistency. Some users saw duplicate payments or missing subscriptions. Data repair required re-reading from all replicas and applying LWW (Last Writer Wins) — not always correct for financial data. Post-incident engineering cost: 3 months of consistency hardening work.

**Debug workflow**:
1. Run FMEA (Failure Mode and Effects Analysis) at design time: for each CAP trade-off decision, document what happens during partition and which consistency level applies per feature.
2. Use chaos engineering (Netflix Chaos Monkey, Gremlin) to simulate network partitions and verify conflict resolution behavior in staging.
3. Implement per-feature consistency requirements: financial writes require quorum consistency (`ConsistencyLevel.QUORUM`), social feeds can use eventual consistency (`ONE`).
4. Monitor consistency lag: track `tombstones` count and `read_repairs` metrics in Cassandra — high values signal unresolved conflicts.

### Failure Mode 2: Spotify CAP Trade-Off — AP for Music Playback, CP for Billing

**What goes wrong**: Spotify chose AP (availability + partition tolerance) for music playback — if a region is down, users should still listen to cached/available songs. But the same system handled premium billing. When a partition occurred, billing reads returned stale subscription status, allowing lapsed users to access premium features without paying.

**Cost**: Revenue leakage from lapsed subscribers accessing premium features. Requires refund reconciliation post-incident. Regulatory exposure in markets requiring accurate billing records.

**Debug workflow**:
1. Separate data stores by CAP requirement: use AP store (Cassandra, DynamoDB) for music content, use CP store (PostgreSQL with synchronous replication, CockroachDB) for billing and subscription status.
2. Add consistency-level enforcement: billing reads must use `ConsistencyLevel.ALL` or `QUORUM`, never `ONE`.
3. Monitor subscription status staleness: if `subscription_status.last_verified_timestamp` is >5 minutes old, enforce re-verification before granting premium access.
4. Use feature flags per consistency requirement: a single `CAP_MODE=billing:CP,playback:AP` config controls consistency levels per service boundary.

### Failure Mode 3: Uber Dispatch CAP Trade-Off — CP for Billing, AP for Matching

**What goes wrong**: Uber's dispatch system chose AP for rider-driver matching (availability first — a driver must always be found, even during partition) and CP for billing (no ride should be double-billed). But the matching service and billing service shared a data store. When the store partitioned, matching slowed down (CP behavior leaked into AP path), causing dispatch latency spikes during peak hours.

**Cost**: Dispatch latency spike (3-10 seconds) during high-demand periods. Riders cancelled rides. Driver utilization dropped. Engineering cost: 6-week separation of billing and dispatch data stores.

**Debug workflow**:
1. Enforce CAP boundary strictly: AP and CP systems must have separate data stores, not share a database cluster.
2. Document the consistency requirement per service at architecture review: "Matching = AP, Billing = CP, must not share stateful infrastructure."
3. Capacity plan per design choice: AP services need more replicas (to serve during partition), CP services need fewer but stronger replicas (quorum-based).
4. Run partition simulation: inject network latency between DC pairs using `tc netem` to simulate real-world partition scenarios before going live.

### Modern Production Tools

- **AWS Fault Injection Simulator (FIS)**: Simulate AZ failures, network partitions, and latency injection to test CAP trade-off decisions in production-like environments.
- **Netflix Chaos Monkey**: Randomly terminates instances and injects failures. Verify AP services stay available and CP services handle partitions gracefully.
- **FMEA template (Google SRE Workbook)**: Structured risk analysis at design time. For each component, document failure mode, probability, impact, and mitigation before code is written.
- **CockroachDB / Spanner**: Globally distributed SQL databases with configurable consistency per transaction. Enable engineers to choose CP (strong) vs eventual consistency per query without changing data stores.
- **Prometheus CAP metrics dashboard**: Track `requests_total{consistency="QUORUM"}` vs `requests_total{consistency="ONE"}` per service. Alert if billing service uses `ONE` consistency.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**Trade-offs are unavoidable**; choosing deliberately is the skill. The invariant is that every system design decision involves trading one property (consistency, availability, latency, cost, complexity) against another. There is no free lunch: a system that guarantees strong consistency cannot guarantee 100% availability during a network partition (CAP theorem). A system optimized for read latency will sacrifice write throughput. A system that minimizes cost will have higher failure rates. The internal mechanism is that the CAP theorem formalizes this: in the presence of a network partition, a distributed system must choose between Consistency and Availability. PACELC extends this: even without partitions, there is a latency-consistency trade-off. Understanding these trade-offs lets you choose deliberately based on the actual requirements, not on theoretical ideals.

### Variants Comparison

| CAP Choice | Consistency | Availability | Partition Tolerance | Example Systems | Failure Mode |
| --- | --- | --- | --- | --- | --- |
| CP (Consistent + Partition-tolerant) | Strong | Unavailable during partition | Yes | HBase, MongoDB, ZooKeeper | Reads blocked during partition |
| AP (Available + Partition-tolerant) | Eventual | Available during partition | Yes | Cassandra, DynamoDB, CouchDB | Reads may return stale data |
| CA (Consistent + Available) | Strong | Available when no partition | No (unrealistic) | Traditional RDBMS | Fails catastrophically on partition |

### PACELC Extension

| System | Latency | Consistency | Notes |
| --- | --- | --- | --- |
| DynamoDB (US-EAST) | Low | Eventual | Default, fastest writes |
| DynamoDB (strong) | Higher | Strong | Slower due to quorum |
| Cassandra | Low | Eventual | Default, fastest reads |
| Cosmos DB | Low | Tunable | Configurable per query |

### Scaling Patterns Comparison

| Pattern | When to Use | Trade-off |
| --- | --- | --- |
| Vertical scaling | Simple apps, low cost | Single point of failure, hardware limits |
| Horizontal scaling | High availability, scale | Complexity, data consistency |
| Database sharding | Data too large for single DB | Cross-shard queries hard, rebalancing |
| Read replicas | Read-heavy workloads | Replication lag, stale reads |
| Cache layer | Hot data, latency-critical | Cache invalidation, cold start |
| Message queue | Async processing, decoupling | Complexity, ordering guarantees |
