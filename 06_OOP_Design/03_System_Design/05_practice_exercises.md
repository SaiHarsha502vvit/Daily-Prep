# 💪 Part 7: Practice Exercises

> **Navigation**: [← OOP vs FUNCTIONAL DESIGN](04_oop_vs_functional_design.md) | [Chapter overview](../03_System_Design.md)
> Page 5 of 5 in **System Design & Feature Creation Guide**


SYSTEM DESIGN PRACTICE PROBLEMS

BEGINNER LEVEL:

1. Design a Parking Lot System
2. Design a Library Management System
3. Design a URL Shortener
4. Design a Rate Limiter
5. Design a Task Scheduler

INTERMEDIATE LEVEL: 6. Design Twitter Feed 7. Design Instagram 8. Design Uber/Ola 9. Design Netflix 10. Design WhatsApp

ADVANCED LEVEL: 11. Design Google Search 12. Design YouTube 13. Design Distributed Cache 14. Design Payment System 15. Design Stock Trading Platform

FOR EACH PROBLEM:

1. Clarify requirements (5 min)
2. Estimate scale (5 min)
3. Draw high-level design (10 min)
4. Deep dive into components (15 min)
5. Discuss trade-offs (5 min)

---

## PLUS Enhancements

### ASCII Diagram 1: C4 Model Hierarchy

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         C4 MODEL HIERARCHY                                   ║
║              (Context → Container → Component → Code)                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 1: SYSTEM CONTEXT                                                      │
│  "What is the system and who uses it?"                                       │
│                                                                              │
│    ┌───────────────┐                    ┌──────────────┐                     │
│    │    Customer   │──uses──────────────▶│  Banking     │                     │
│    │   (Person)    │◀───────────────────│   System     │                     │
│    └───────────────┘     views/transacts└──────────────┘                     │
│                                        ┌──────────────┐                     │
│                                        │  External    │                     │
│                                        │  Bank APIs   │                     │
│                                        └──────▲───────┘                     │
└──────────────────────────────────────────────│──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 2: CONTAINER (Process/Deployment Unit)                                │
│  "What applications/deployable units does the system consist of?"            │
│                                                                              │
│    ┌──────────────────────────────────────────────────────────────────────┐  │
│    │                         BANKING SYSTEM                                 │  │
│    │                                                                       │  │
│    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│    │   │  Web App    │    │   Mobile    │    │   Admin     │               │  │
│    │   │  (React)    │    │   App       │    │   Portal    │               │  │
│    │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘               │  │
│    │          │                  │                  │                       │  │
│    │          └──────────────────┼──────────────────┘                       │  │
│    │                             │                                          │  │
│    │                             ▼                                          │  │
│    │                    ┌─────────────────┐                                 │  │
│    │                    │   API Gateway   │                                 │  │
│    │                    │   (Kong/AWS)    │                                 │  │
│    │                    └────────┬────────┘                                 │  │
│    │                             │                                          │  │
│    │          ┌──────────────────┼──────────────────┐                       │  │
│    │          ▼                  ▼                  ▼                       │  │
│    │   ┌────────────┐    ┌────────────┐    ┌────────────┐                   │  │
│    │   │  User Svc  │    │  Account   │    │  Payment   │                   │  │
│    │   │  Service   │    │  Service   │    │  Service   │                   │  │
│    │   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘                   │  │
│    │         │                 │                 │                          │  │
│    │         └─────────────────┼─────────────────┘                          │  │
│    │                           ▼                                             │  │
│    │                   ┌───────────────┐                                    │  │
│    │                   │  PostgreSQL   │                                    │  │
│    │                   │  Database     │                                    │  │
│    │                   └───────────────┘                                    │  │
│    └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 3: COMPONENT (Major Code Grouping)                                    │
│  "What are the major components within a container?"                         │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      AUTHENTICATION SERVICE                          │    │
│   │   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐    │    │
│   │   │  SessionMgr    │    │  TokenValidator│    │  OAuth2Client  │    │    │
│   │   │  Component     │    │  Component     │    │  Component     │    │    │
│   │   └────────────────┘    └────────────────┘    └────────────────┘    │    │
│   │           │                    │                    │               │    │
│   │           └────────────────────┼────────────────────┘               │    │
│   │                                ▼                                      │    │
│   │                    ┌────────────────────┐                            │    │
│   │                    │  AuthController    │                            │    │
│   │                    │  (login/logout)    │                            │    │
│   │                    └────────────────────┘                            │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 4: CODE (Classes/Functions)                                           │
│  "What is the code structure for a specific component?"                      │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     SessionManager.java                              │    │
│   │                                                                       │    │
│   │   - createSession(userId): Session                                   │    │
│   │   - validateToken(token): Boolean                                    │    │
│   │   - refreshSession(token): Session                                   │    │
│   │   - invalidateSession(token): Void                                   │    │
│   │                                                                       │    │
│   │   Uses: Redis (tokens), JWT (claims), BCrypt (password hashing)      │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ASCII Diagram 2: End-to-End Request Flow

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    END-TO-END REQUEST FLOW                                    ║
║            Client → DNS → CDN → LB → Gateway → Auth → Business → DB           ║
╚══════════════════════════════════════════════════════════════════════════════╝

     USER
       │
       │ 1. Browser types "https://api.example.com/products/123"
       │    DNS Resolution: api.example.com → 203.0.113.50
       ▼
  ┌─────────┐
  │   DNS   │─────────────────────────────────────────────────────────────────
  │ Service │                                                                  │
  └────┬────┘                                                                  │
       │ 2. Return IP: 203.0.113.50                                            │
       ▼                                                                       │
  ┌─────────┐      3. Check edge cache (static assets: CSS, JS, images)        │
  │   CDN   │───────HIT──▶ Return from cache (~10ms)                           │
  │(Cloudflare)│     │                                                         │
  └────┬────┘      │ MISS                                                      │
       │           ▼ (dynamic content continues)                               │
       │ 4. Dynamic request to origin                                          │
       ▼                                                                       │
  ┌────────────────┐     5. Route to least-loaded server                       │
  │  LOAD BALANCER │─────────────────────────────────────────────────────────
  │   (Nginx/ALB)  │     Uses: Round Robin / Least Connections / IP Hash       │
  └───────┬────────┘                                                           │
          │ 6. TCP connection to upstream                                       │
          ▼                                                                     │
  ┌────────────────┐     7. Authenticate: JWT, API Key, OAuth2 token           │
  │   API GATEWAY  │─────────────────────────────────────────────────────────
  │  (Kong/AWS)    │     Checks: Rate limit, IP allow/deny, Request size       │
  └───────┬────────┘                                                           │
          │ 8. Validated request to internal service                            │
          ▼                                                                     │
  ┌────────────────┐     9. Verify: token valid? user exists? has permission?  │
  │ AUTH SERVICE   │─────────────────────────────────────────────────────────
  │(Keycloak/OIDC) │     Returns: User claims or 401 Unauthorized              │
  └───────┬────────┘                                                           │
          │ 10. Authenticated request with user context                         │
          ▼                                                                     │
  ┌────────────────┐     11. Business logic execution                           │
  │   BUSINESS     │─────────────────────────────────────────────────────────
  │   SERVICE      │     Operations: validate, enrich, transform, authorize    │
  │(Product Svc)   │     May call: other services, external APIs               │
  └───────┬────────┘                                                           │
          │ 12. Data fetch request                                              │
          ▼                                                                     │
  ┌────────────────┐     13. Check Redis cache first                            │
  │  REDIS CACHE   │─────────────────────────────────────────────────────────
  │ (Read-through) │     HIT: Return cached value (~1ms)                       │
  └───────┬────────┘     MISS: Continue to DB                                  │
          │ 14. Cache miss → query database                                     │
          ▼                                                                     │
  ┌────────────────┐     15. SELECT * FROM products WHERE id=123               │
  │  PRIMARY DB    │─────────────────────────────────────────────────────────
  │ (PostgreSQL)   │     Returns: {id: 123, name: "Widget", price: 29.99}     │
  └───────┬────────┘     Write to cache: SETEX product:123 3600 {json}        │
          │ 16. Product data                                                    │
          ▼                                                                     │
  ┌────────────────┐     17. Transform to API response DTO                     │
  │  RESPONSE      │─────────────────────────────────────────────────────────
  │  TRANSFORMER   │     Strip internal fields, format dates, enrich metadata  │
  └───────┬────────┘                                                           │
          │ 18. JSON response                                                   │
          ▼                                                                     │
  ┌────────────────┐     19. 200 OK with response body                         │
  │   HTTP/2       │─────────────────────────────────────────────────────────
  │   RESPONSE     │     Cache-Control: max-age=3600                           │
  └───────┬────────┘     ETag: "abc123"                                        │
          │ Reverse path through Gateway → LB → CDN → User                     │
          ▼                                                                     │
       USER
       Receives response in ~50-200ms total
```

## ASCII Diagram 3: CAP Theorem Triangle

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CAP THEOREM TRIANGLE                                  ║
║                                                                               ║
║       During a network partition (which IS inevitable in distributed systems) ║
║       you MUST choose between Consistency and Availability                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

                                    ┌─ C ─┐
                                   /       \
                                  / CONSIS-  \
                                 /  TENCY    /
                                /            \
                               /      CP       \
                              ▼─────────────── ▼
                    ┌─────────┐             ┌─────────┐
                    │         │  PARTITION   │         │
                    │  CP     │◀────────────▶│   AP    │
                    │ SYSTEMS │   TOLERANCE  │ SYSTEMS │
                    │         │              │         │
                    └─────────┘              └─────────┘
                         │                        │
                         │                        │
                         ▼                        ▼
                   ┌──────────┐            ┌──────────┐
                   │ MongoDB  │            │Cassandra │
                   │ (default)│            │ DynamoDB │
                   │  HBase   │            │ CouchDB  │
                   │ZooKeeper │            │  DNS     │
                   │ Redis    │            │  Riak    │
                   │ Cluster  │            │         │
                   └──────────┘            └──────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  WHAT HAPPENS DURING PARTITION:                                         │
    │                                                                          │
    │  ┌─────────────────────────────────┬─────────────────────────────────┐  │
    │  │        CP (Consistency+Partition)│       AP (Availability+Partition)│  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ REFUSE OPERATIONS               │ ACCEPT OPERATIONS EVERYWHERE    │  │
    │  │ until partition heals           │ reconcile differences later      │  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ Example: ZooKeeper              │ Example: Cassandra              │  │
    │  │ - Leader election required      │ - Quorum reads/writes            │  │
    │  │ - Writes rejected if no quorum  │ - Last-writer-wins conflict     │  │
    │  │                                 │   resolution                     │  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ USE WHEN:                       │ USE WHEN:                       │  │
    │  │ - Money/ledger systems          │ - Social feeds, likes           │  │
    │  │ - Inventory/atomic transactions │ - Shopping carts                │  │
    │  │ - Any system where stale data   │ - User-generated content        │  │
    │  │   is catastrophic               │ - "Always on" requirement       │  │
    │  └─────────────────────────────────┴─────────────────────────────────┘  │
    │                                                                          │
    │  NOTE: CA (Consistency+Availability without Partition) does NOT EXIST    │
    │  in distributed systems. A single-node PostgreSQL is CA, but the moment  │
    │  you add a second node for replication, you have a partition and must    │
    │  choose CP or AP.                                                         │
    └─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  REAL-WORLD DECISIONS:                                                   │
    │                                                                          │
    │  Netflix (AP): A stale recommendation is annoying but not catastrophic.  │
    │               AP gives "always available" which is a better UX.          │
    │                                                                          │
    │  Banks (CP): A double-spend of $1M during partition reconciliation       │
    │              is bankruptcy-class failure. Refuse writes during partition. │
    │                                                                          │
    │  Amazon Dynamo Paper (2007): Explicitly chose AP for shopping cart       │
    │  because duplicate items during reconciliation are recoverable, but       │
    │  refusing to add-to-cart is catastrophic for conversion rate.            │
    └─────────────────────────────────────────────────────────────────────────┘
```

## CAP Refinement: PACELC and the "Choose 2" Misnomer

The simple "choose 2" framing is a pedagogical shorthand. Gilbert and Lynch's 2002 proof (of Brewer's 2000 conjecture) showed that during a partition you must sacrifice either consistency OR availability — but the trade-off is not binary in normal operation. **PACELC** (Daniel Abadi, 2010) extends CAP: if Partition (P), choose Availability or Consistency (A or C); **E**lse (no partition), choose **L**atency or **C**onsistency. A real-world CP system like ZooKeeper trades latency for consistency even when partitions are rare. The point: "during a partition" is the only time the C/A trade-off forces your hand.

---

## Deep-Dive: Database Read Replicas

**How Async Replication Works:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  READ REPLICA REPLICATION FLOW (Async, Primary → Replica)                   │
│                                                                              │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐            │
│  │   Primary     │      │  WAL/Binlog   │      │   Replica     │            │
│  │   Database    │      │   (Write-     │      │   Database    │            │
│  │               │      │   ahead log)  │      │               │            │
│  │  ┌─────────┐  │      │               │      │  ┌─────────┐  │            │
│  │  │ INSERT  │  │      │  ┌─────────┐  │      │  │ REPLAY  │  │            │
│  │  │ "order" │──┼──────▶│  │ row x   │──┼─────▶│  │ "order" │  │            │
│  │  └─────────┘  │      │  │ changes │  │      │  └─────────┘  │            │
│  │               │      │  └─────────┘  │      │               │            │
│  │               │      │               │      │  [5-500ms     │            │
│  │               │      │               │      │   lag behind] │            │
│  └───────────────┘      └───────────────┘      └───────────────┘            │
│                                                                              │
│  MECHANISM DETAILS:                                                          │
│                                                                              │
│  1. PRIMARY writes transaction to WAL (Write-Ahead Log)                      │
│     - WAL is append-only, ordered by LSN (Log Sequence Number)               │
│     - Write committed to WAL BEFORE returning to client (durability)         │
│                                                                              │
│  2. REPLICA's IO thread reads from primary's WAL                             │
│     - Polls every N milliseconds (configurable: 1ms, 10ms, 100ms)            │
│     - Reads only the bytes it hasn't seen (tracking LSN position)            │
│                                                                              │
│  3. REPLICA's SQL thread APPLIES the changes                                 │
│     - Replays INSERT/UPDATE/DELETE on local copy                             │
│     - Runs in order (preserves transactional consistency on replica)         │
│                                                                              │
│  4. REPLICATION LAG = time between primary commit and replica apply          │
│     - Typical: 5ms-500ms (depends on load, network, distance)                │
│     - Can grow to seconds/minutes during heavy write bursts                  │
│     - Can grow indefinitely if replica is down or unreachable                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The Replication Lag Problem and Stale Read Handling:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REPLICATION LAG WINDOWS                                                      │
│                                                                              │
│  PRIMARY                                                              REPLICA│
│     │                                                                     │   │
│  T=0ms ─── INSERT order_123 ───────────────────────▶ (write)               │   │
│     │                                                                     │   │
│  T=10ms ───────────────────────────────────────────▶ (poll WAL)            │   │
│     │                                                                     │   │
│  T=50ms ───────────────────────────────────────────▶ (apply INSERT)        │   │
│     │                                                                     │   │
│     │  ──── LAG WINDOW: 50ms ────                                         │   │
│     │                                                                     │   │
│  During this window, reads from REPLICA see stale data (order_123 missing) │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STRATEGIES FOR HANDLING STALE READS                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. READ-YOUR-WRITES CONSISTENCY (Monotonic)                            │ │
│  │                                                                        │ │
│  │  User writes data → immediately read it → GUARANTEED to see their write│ │
│  │                                                                        │ │
│  │  Implementation: After write, read from PRIMARY (not replica)          │ │
│  │  for a configurable duration (e.g., 30 seconds post-write)             │ │
│  │                                                                        │ │
│  │  Code:                                                                  │ │
│  │    async def write_order(order):                                       │ │
│  │        db.primary.execute("INSERT INTO orders...", order)               │ │
│  │        # Force sync to at least one replica before returning           │ │
│  │        db.primary.execute("SELECT pg_current_wal_flush_lsn()")          │ │
│  │        return order_id                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 2. MONOTONIC READS                                                      │ │
│  │                                                                        │ │
│  │  If user reads value V1 at time T1, they will NEVER see older V0       │ │
│  │  at time T2 > T1. Prevents "going back in time."                       │ │
│  │                                                                        │ │
│  │  Implementation: Bind user session to specific replica for duration    │ │
│  │  of session. Don't randomly route to different replicas.               │ │
│  │                                                                        │ │
│  │  Session → sticky replica mapping in load balancer                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 3. CAUSAL CONSISTENCY                                                   │ │
│  │                                                                        │ │
│  │  If operation A causes/caused operation B, then B sees A's effects     │ │
│  │                                                                        │ │
│  │  Example: User posts comment → sees their own comment                  │ │
│  │  Implementation: Track causal dependencies in version vectors           │ │
│  │  Used by: Google Spanner, CockroachDB                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 4. EVENTUAL CONSISTENCY (Accept and log)                                │ │
│  │                                                                        │ │
│  │  For non-critical reads, accept staleness within SLA bounds             │ │
│  │  Monitor replication lag: alert if >5 seconds for 5+ minutes            │ │
│  │  Expose "data freshness" metric to callers                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why-This-Not-That: Synchronous vs Async Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           SYNCHRONOUS vs ASYNCHRONOUS REPLICATION                           │
│           When to use which, and what you trade away                        │
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYNCHRONOUS REPLICATION                              │
│  PRIMARY ─── COMMIT + WAIT ───▶ REPLICA confirms write ───▶ Response         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PROS:                                                                   │ │
│  │ ✓ Strong consistency: Replica has data before client gets response     │ │
│  │ ✓ Zero data loss: If primary dies, replica has all committed writes    │ │
│  │ ✓ Easy failover: Replica is guaranteed to be up-to-date                │ │
│  │                                                                          │ │
│  │ CONS:                                                                   │ │
│  │ ✗ Latency: Write latency = round-trip to replica (often 5-50ms extra)  │ │
│  │ ✗ Throughput: Limited by slowest/reachable replica                     │ │
│  │ ✗ Availability: If ANY replica is down, writes fail (semi-sync helps)  │ │
│  │ ✗ Geographic: cross-region sync replication is very expensive           │ │
│  │                                                                          │ │
│  │ USE WHEN:                                                               │ │
│  │ • Financial transactions, ledger entries, inventory deductions         │ │
│  │ • Data loss is catastrophic (orders, payments, balances)               │ │
│  │ • Regulatory requirements for durability                               │ │
│  │ • Within single datacenter (low latency)                               │ │
│  │                                                                          │ │
│  │ NAMED EXAMPLES:                                                         │ │
│  │ • Stripe: Synchronous replication for payment processing               │ │
│  │   "A payment must be recorded in at least 2 AZs before we return 200"  │ │
│  │ • Banks: Synchronous CDC to disaster recovery site                      │ │
│  │ • Zookeeper: Fsync to disk + quorum write before responding            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASYNCHRONOUS REPLICATION                              │
│  PRIMARY ─── COMMIT ───▶ Response + WAL entry ─── (later) ───▶ REPLICA      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PROS:                                                                   │ │
│  │ ✓ Low latency: No wait for replica (write to primary, return immediately)│ │
│  │ ✓ High throughput: Primary not blocked by replica                       │ │
│  │ ✓ Geo-distribution: Can replicate across regions cheaply               │ │
│  │ ✓ Availability: Primary continues even if replicas are down             │ │
│  │                                                                          │ │
│  │ CONS:                                                                   │ │
│  │ ✗ Data loss window: If primary dies before replica receives WAL,       │ │
│  │   that data is lost (window of vulnerability = replication lag)        │ │
│  │ ✗ Stale reads: Replica may be behind by ms to minutes                  │ │
│  │ ✗ Complex failover: Replica might have partial data; need to reconcile │ │
│  │                                                                          │ │
│  │ USE WHEN:                                                               │ │
│  │ • High-throughput write workloads (logs, analytics, social feeds)      │ │
│  │ • Stale reads are acceptable (most reads can be from cache/replica)    │ │
│  │ • Cross-region replication where sync latency is prohibitive           │ │
│  │ • Analytics/reporting that doesn't need real-time data                 │ │
│  │                                                                          │ │
│  │ NAMED EXAMPLES:                                                         │ │
│  │ • Twitter: Async replication for timeline writes                        │ │
│  │   "Tweet written to primary → fanout to followers' timelines async"    │ │
│  │ • Facebook: Async MySQL replication to read replicas for news feed     │ │
│  │ • Kafka: Async replication with configurable ack levels (acks=1, all)  │ │
│  │ • MongoDB replica sets: Default async (sync to majority is opt-in)     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYBRID: SEMI-SYNCHRONOUS (Oracle, MySQL Group Rep)        │
│                                                                              │
│  Primary waits for AT LEAST ONE replica to acknowledge (not all)            │
│  Guarantees: If primary dies, at least one replica has all committed data   │
│  Trade-off: Much lower latency than full sync, but still guaranteed recoverability│
│                                                                              │
│  This is the recommended production configuration for most PostgreSQL/MySQL │
│  deployments: balance consistency with performance.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Breadth Comparison: Load Balancer Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              LOAD BALANCER STRATEGIES COMPARISON                             │
│                                                                              │
│  ┌──────────────────┬─────────────────────┬──────────────────────────────┐  │
│  │     Strategy     │      How It Works   │     When To Use              │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │  ROUND ROBIN     │ Cycles through      │ Homogeneous servers,         │  │
│  │                  │ servers in order    │ stateless services           │  │
│  │                  │ S1→S2→S3→S1→...     │                              │  │
│  │                  │                     │ Low latency, simple          │  │
│  │  Pros            │ Simple to implement │ No session affinity needed   │  │
│  │  Cons            │ Ignores server load │ Doesn't account for          │  │
│  │                  │                     │ heterogeneous servers        │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ LEAST CONNECTIONS│ Routes to server    │ Variable request duration    │  │
│  │                  │ with fewest active  │ (long-polling, WebSocket,    │  │
│  │                  │ connections         │ file uploads)                │  │
│  │  Pros            │ Adapts to load      │ Better utilization when      │  │
│  │                  │ differences         │ request times vary widely    │  │
│  │  Cons            │ More complex        │ Session state can cause      │  │
│  │                  │ (must track conns)  │ uneven distribution          │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ IP HASH          │ Hash(client_IP)     │ Must route same client to    │  │
│  │                  │ mod N → server      │ same server (sessions)       │  │
│  │  Pros            │ Session stickiness  │ Works well when session      │  │
│  │                  │ Deterministic       │ affinity required            │  │
│  │  Cons            │ Hotspots if large   │ Single IP = single server    │  │
│  │                  │ clients share IP    │ (load imbalance possible)    │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ CONSISTENT       │ Hash(key) → ring →  │ Cache-heavy workloads where  │  │
│  │ HASHING          │ nearest server      │ caching depends on           │  │
│  │                  │ (virtual nodes)     │ server assignment            │  │
│  │  Pros            │ Only K/n keys       │ Adding/removing servers      │  │
│  │                  │ remapped on change  │ minimizes cache invalidation │  │
│  │                  │ Enables caching     │ Used by: Dynamo, Cassandra,  │  │
│  │                  │ without sticky sess │ Memcached, Redis Cluster     │  │
│  │  Cons            │ More complex        │ Initial hashing overhead     │  │
│  │                  │ (ring management)   │ Uneven if virtual nodes not  │  │
│  │                  │                     │ properly configured          │  │
│  └──────────────────┴─────────────────────┴──────────────────────────────┘  │
│                                                                              │
│  PRODUCTION RECOMMENDATION:                                                  │
│  • Stateless services: Round Robin (simple, effective)                       │
│  • Stateful long-connections: IP Hash or Least Connections                   │
│  • Caching/microservices: Consistent Hashing (minimizes cache invalidation) │
│  • Kubernetes: kube-proxy uses iptables (hash-based), cilium uses eBPF      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Breadth Comparison: CDN Strategies (Push vs Pull)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CDN DEPLOYMENT STRATEGIES                               │
│                                                                              │
│  ┌─────────────────────────────┬─────────────────────────────────────────┐  │
│  │         PUSH CDN            │              PULL CDN                   │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  CONTENT SERVER             │  USER REQUEST                           │  │
│  │       │                     │       │                                 │  │
│  │       ▼ (push on publish)   │       ▼ (cache miss triggers fetch)    │  │
│  │  ┌─────────┐                │  ┌─────────┐                            │  │
│  │  │   CDN   │                │  │   CDN   │──▶ MISS ──▶ Origin ──▶     │  │
│  │  │  PoP    │                │  │  PoP    │      Cache & serve         │  │
│  │  └─────────┘                │  └─────────┘                            │  │
│  │                             │                                         │  │
│  │  YOU control what is        │  CDN pulls on first request             │  │
│  │  on CDN (proactive)         │  (lazy, on-demand)                      │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  USE WHEN:                  │  USE WHEN:                              │  │
│  │  • Static assets with known │  • Large catalog, unpredictable access  │  │
│  │    set (CSS/JS/images)      │  • User-generated content               │  │
│  │  • Predictable traffic      │  • Most content rarely accessed         │  │
│  │  • Need exact cache control │  • Can't predict what's popular         │  │
│  │  • High-security content    │  • Large number of unique assets        │  │
│  │    (signed URLs)            │  • Most traffic to small % of content   │  │
│  │                             │                                         │  │
│  │  PROS:                      │  PROS:                                  │  │
│  │  ✓ Instant cache invalidation│  ✓ No upload step needed               │  │
│  │  ✓ No thundering herd       │  ✓ Scales to billions of assets         │  │
│  │  ✓ Predictable origin load  │  ✓ Zero maintenance (set TTL, forget)  │  │
│  │  ✓ Exact control of TTL     │  ✓ Popular content auto-caches          │  │
│  │                             │                                         │  │
│  │  CONS:                      │  CONS:                                  │  │
│  │  ✗ Must push on every deploy│  ✗ First request is slow (cache miss)  │  │
│  │  ✗ Can miss unused content  │  ✗ Thundering herd on new content       │  │
│  │  ✗ Complexity with CMS      │  ✗ Hard to invalidate precisely        │  │
│  │                             │  ✗ Origin sees more traffic than        │  │
│  │                             │    eventual cache hit rate suggests     │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  NAMED PROVIDERS:           │  NAMED PROVIDERS:                       │  │
│  │  • Akamai (Cloud)           │  • Cloudflare (default)                 │  │
│  │  • Fastly (real-time purge) │  • AWS CloudFront                       │  │
│  │  • Cloudfront (can do both) │  • Google Cloud CDN                     │  │
│  │                             │  • Azure CDN                            │  │
│  └─────────────────────────────┴─────────────────────────────────────────┘  │
│                                                                              │
│  HYBRID PATTERN (Production Most Common):                                    │
│  • Static assets: Push on CI/CD deploy (CSS/JS/images)                      │
│  • User content: Pull on first access (avatars, uploads)                    │
│  • Set different TTLs: JS/CSS = 1 year, images = 30 days                   │
│                                                                              │
│  THUNDERING HERD MITIGATION:                                                 │
│  When CDN cache expires simultaneously (e.g., 10K users hit expired cache):  │
│  • Origin gets 10K requests instead of 1 → CRASH                            │
│  • Solution: Staggered TTLs, cache warming, "cache aside" with locking      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

[← OOP vs FUNCTIONAL DESIGN](04_oop_vs_functional_design.md) | [Chapter overview](../03_System_Design.md)
