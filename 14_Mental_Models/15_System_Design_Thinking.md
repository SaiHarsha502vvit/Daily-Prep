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

## Choice               │  Trade-Off

SQL vs NoSQL         │  Consistency vs Flexibility
Cache vs No Cache    │  Speed vs Freshness
Monolith vs Micro    │  Simplicity vs Scalability
Sync vs Async        │  Simplicity vs Throughput
Normalize vs Denorm  │  Write speed vs Read speed
Push vs Pull         │  Latency vs Resource usage

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
> READ-HEAVY (100:1)              WRITE-HEAVY (1:1 or more)
> ─────────────────              ──────────────────────
> Social media feeds              Chat messages
> E-commerce product pages        IoT sensor data
> News/blog sites                 Financial transactions
> Search results                  Logging/analytics
>
> READ-HEAVY OPTIMIZATIONS:       WRITE-HEAVY OPTIMIZATIONS:
> - Caching (Redis, CDN)         • Write-ahead log
> - Read replicas                • Async processing (queues)
> - Denormalization              • Batch writes
> - Materialized views           • LSM-Tree stores (Cassandra)
> - Pre-computed feeds           • Partitioning/sharding
>
> MIXED? Use CQRS:
> Command (write) → one model
> Query (read)    → different, optimized model


---

## Mental Model 6: Failure Will Happen — Design For It

## If This Fails...      │  We Should...

Database goes down    │  Failover to replica
Cache goes down       │  Fall through to DB
Service times out     │  Circuit breaker + fallback
Queue is full         │  Backpressure + dead letter
Region goes down      │  Multi-region failover
Deployment is buggy   │  Canary + quick rollback
Data is corrupted     │  Backup + point-in-time
Traffic spikes 10x    │  Auto-scaling + rate limit

---

## Mental Model 7: The Funnel Pattern


> WEB REQUEST FLOW — Think of It as a Funnel
>
> Each layer FILTERS and OPTIMIZES before hitting the next:
>
> DNS (Route 53)         → Resolve to IP
> │
> CDN (CloudFront)       → Serve cached static content (90% done)
> │
> Load Balancer          → Distribute remaining requests
> │
> Rate Limiter           → Block abusive traffic
> │
> API Gateway            → Auth, throttle, route
> │
> Application Cache      → Return cached API responses
> │
> Application Server     → Business logic (only ~5% of original)
> │
> Database               → Only queries that MUST hit storage
>
> INSIGHT: 95% of requests should NEVER reach your database.
> Each layer is a chance to serve the response earlier.


---

## Mental Model 8: The Interview Navigation Map


> 45-MINUTE SYSTEM DESIGN INTERVIEW — TIME ALLOCATION
>
> [0-5 min]   CLARIFY
> - Ask about scale (users, data, requests/second)
> - Ask about constraints (latency, availability, consistency)
> - Ask about features (MVP vs full-featured)
> → "Are we designing for 1K users or 100M?"
>
> [5-10 min]  HIGH-LEVEL DESIGN
> - Draw the main components (client, server, database, cache)
> - Define the API (2-3 core endpoints)
> - Identify the data model (key entities + relationships)
>
> [10-30 min] DEEP DIVE
> - Most complex component in detail
> - Data flow for core use case
> - Handle scale: sharding, caching, replication
> → This is where you show DEPTH. Pick the hard part.
>
> [30-40 min] TRADE-OFFS & EDGE CASES
> - What happens during failures?
> - Alternative approaches you considered
> - Bottlenecks and how to address them
>
> [40-45 min] WRAP UP
> - Summarize key decisions
> - Mention what you'd add with more time
> - Open for interviewer questions


---

## Quick Decision Framework


> WHEN STUCK, ASK THESE 5 QUESTIONS:
>
> 1. What's the READ:WRITE ratio?
> → Drives caching and replication strategy
>
> 2. What's the CONSISTENCY requirement?
> → Drives database choice and replication mode
>
> 3. What's the LATENCY requirement?
> → Drives where to put caches and how to pre-compute
>
> 4. What's the DATA SIZE and GROWTH rate?
> → Drives partitioning and storage tier decisions
>
> 5. What FAILS gracefully and what CAN'T fail?
> → Drives redundancy, replication, and backup strategy


---

*System design is a conversation, not a test. Show your thinking process — that matters more than the final diagram.*


---

> **Navigation**: [< Previous](14_Optimization_Pipeline.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_Distributed_Systems_Thinking.md)