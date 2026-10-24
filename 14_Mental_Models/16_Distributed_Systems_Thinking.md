**Navigation**: [< Previous](15_System_Design_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](17_Frontend_Architecture_Thinking.md)

# Mental Models — Distributed Systems Thinking

## How to Think About Distributed Systems

A distributed system is a collection of independent computers
that APPEARS to the user as a single coherent system.

The challenge: these computers can FAIL INDEPENDENTLY,
COMMUNICATE SLOWLY, and DISAGREE on what happened.

This guide gives you mental frameworks for reasoning about
these challenges — not memorizing solutions.

---

## Mental Model 1: The Network Is NOT Reliable

THE 8 FALLACIES OF DISTRIBUTED COMPUTING (Peter Deutsch, 1994)

Things developers WRONGLY ASSUME:

1. The network is reliable → Packets get LOST
2. Latency is zero → It's NEVER instant
3. Bandwidth is infinite → There ARE limits
4. The network is secure → Always ASSUME it's not
5. Topology doesn't change → Servers come and GO
6. There is one administrator → Multiple TEAMS manage it
7. Transport cost is zero → Data transfer COSTS money
8. The network is homogeneous → Different HARDWARE exists

PRACTICAL IMPLICATION:
- Every network call CAN fail. Every response CAN be delayed.
- Design every remote interaction with timeout + retry + fallback.

---

🔬 **Section Challenge — Mental Model 1: The Network Is NOT Reliable**

**Challenge 1 (Design):** Your microservice sends an email to a user upon signup. Because the network is unreliable, you implement a retry loop: if the email service times out, you retry up to 3 times. What catastrophic bug does this introduce, and how must you change the email service API to fix it?

<details><summary>Answer</summary>

A timeout does NOT mean the request failed; it just means you didn't receive the response. If the email service successfully sends the email but the _response_ is lost in the network, your 3 retries will send the exact same email 3 more times! The user gets spammed with 4 signup emails. To fix this, you must make the email service API **idempotent**. You should pass a unique `Idempotency-Key` (e.g., the user's ID or a UUID) in the request header. The email service checks if it has already processed that key; if so, it skips sending and just returns `200 OK`.

</details>

## Mental Model 2: The Three Possible Outcomes

```
When Service A calls Service B, there are ONLY 3 outcomes:

1. SUCCESS — B processed the request and responded

2. FAILURE — B responded with an error
   (At least you KNOW it failed)

3. TIMEOUT — No response at all ⚠️
   This is the WORST case. You DON'T KNOW:
   - Did B receive the request?
   - Did B process it but the response got lost?
   - Is B still processing?
   - Is B dead?

┌──────────────────────────────────────────────┐
│  A ──[request]──→ B                          │
│  A ←──[???]──── B  ← What happened?          │
└──────────────────────────────────────────────┘

DESIGN RULE: Make operations IDEMPOTENT so retrying is safe.
If the same request is processed twice, the result is the same.

Idempotent: GET /user/123         (safe to retry)
Idempotent: PUT /user/123 {name}  (safe to retry)
NOT Idem:   POST /payments         (might charge twice!)
FIX:        POST /payments + idempotency_key=abc123
```

---

## Mental Model 3: Consistency Is a Spectrum

```
CONSISTENCY SLIDER — Not Just "Consistent" or "Inconsistent"

STRICT
├─── Strong (Linearizable)
│    "Everyone always sees the latest write"
│    Cost: SLOW (wait for all replicas)
│    Example: Bank balance
│
├─── Sequential
│    "Operations from each client are in order"
│
├─── Causal
│    "If A caused B, everyone sees A before B"
│    Example: Reply appears after the original comment
│
├─── Read-Your-Writes
│    "You see your own updates immediately"
│    Others might see a stale version temporarily
│    Example: Edit your profile, you see it updated
│
├─── Eventual
│    "All replicas converge... eventually"
│    Cost: FAST (respond from any replica)
│    Example: Social media like counts
RELAXED

KEY INSIGHT: Pick the weakest consistency that's ACCEPTABLE
for each feature. Not everything needs strong consistency.
Post likes? Eventual is fine.
Money transfer? Strong consistency is mandatory.
```

---

## Mental Model 4: The Clock Problem

CLOCKS IN DISTRIBUTED SYSTEMS ARE UNRELIABLE

Server A's clock: 10:00:00.000
Server B's clock: 10:00:00.150 ← 150ms ahead!

If both process a "write" at the same time, which came first?
Using wall clocks: B appears to be later (but it wasn't!)

SOLUTIONS:

1. Logical Clocks (Lamport Clocks)

- Counter that increments on each event
- "Event A happened before Event B" (causal ordering)
- CANNOT tell if events are concurrent

2. Vector Clocks

- Each node maintains a vector [A:1, B:2, C:0]
- CAN detect concurrent events (potential conflicts)
- Used in DynamoDB, Riak

3. Hybrid Logical Clocks (HLC)

- Combines physical time + logical counter
- Best of both worlds
- Used in CockroachDB, YugabyteDB

PRACTICAL RULE: Never use System.currentTimeMillis() for
ordering events across multiple servers.

---

## Mental Model 5: Split-Brain and Consensus

THE SPLIT-BRAIN PROBLEM

What happens when the network PARTITIONS?

BEFORE PARTITION:
```text
[Node A] ←──→ [Node B] ←──→ [Node C] (all connected)
Leader
```

AFTER PARTITION:
```text
[Node A] ←──→ [Node B] | [Node C] (C is isolated)
Leader |
```

Node C thinks A is dead → elects itself as leader!
Now TWO leaders accepting writes = DATA CORRUPTION

SOLUTION: Quorum-based consensus

- Need MAJORITY (N/2 + 1) to agree on anything
- 3 nodes → need 2 to agree
- 5 nodes → need 3 to agree
- Node C alone CANNOT form a quorum → refuses writes

This is why you always run ODD numbers of nodes: 3, 5, 7
(With 4 nodes, a 2-2 split means NO side has majority)

---

## Mental Model 6: Eventual Consistency Is Not Chaos

Many developers fear "eventual consistency" because it sounds
unpredictable. But it's VERY well-defined:

DEFINITION: If no new updates are made, eventually ALL replicas
will converge to the SAME value.

"Eventually" in practice:

- Same data center: milliseconds to seconds
- Cross-region: seconds to a few minutes

TECHNIQUES TO MAKE IT WORK:

1. CRDTs (Conflict-Free Replicated Data Types)

- Mathematically guaranteed to converge
- Example: G-Counter (grow-only counter)
  Each node has its own counter. Total = sum of all.
  Never conflicts because additions are commutative.

2. Last-Writer-Wins (LWW)

- Latest timestamp wins
- Simple but can lose data

3. Application-level conflict resolution

- Let the user decide
- Example: Google Docs shows both versions for you to merge

INSIGHT: Choose the right conflict strategy per data type.
Counter → CRDT. User profile → LWW. Document → user merge.

---

## Mental Model 7: Think in Data Flow, Not API Calls

```
Synchronous (request/response) thinking:
A calls B calls C calls D → if any fails, everything fails

┌───┐    ┌───┐    ┌───┐    ┌───┐
│ A │ →  │ B │ →  │ C │ →  │ D │    If C is slow, A is slow.
└───┘    └───┘    └───┘    └───┘    If D dies, A gets an error.

─────────────────────────────────────────────────

Data flow (event-driven) thinking:
Each service processes events independently

┌───┐    ┌────────┐    ┌───┐
│ A │ →  │ Event  │ →  │ B │
└───┘    │ Queue  │ →  │ C │    If C is slow, A doesn't care.
         └────────┘ →  │ D │    If D dies, events wait.
                       └───┘    Each processes at own pace.

WHEN TO USE WHICH:
Sync: User needs immediate response (login, payment)
Async: User doesn't need immediate response (email, analytics)
Hybrid: Acknowledge immediately, process in background
```

---

## Mental Model 8: The Blast Radius

```
BLAST RADIUS: How much of the system is affected when
one component fails?

LARGE BLAST RADIUS (BAD):
┌────────────────────────────────┐
│  Monolith: if payment module   │
│  has a memory leak, the ENTIRE │
│  application crashes           │
└────────────────────────────────┘

SMALL BLAST RADIUS (GOOD):
┌────────────┐  ┌────────────┐  ┌────────────┐
│  User Svc  │  │ Payment Svc│  │ Notify Svc │
│     ✓      │  │     ✗      │  │     ✓      │
└────────────┘  └────────────┘  └────────────┘
Payment is down but users can still browse and get notifications

TECHNIQUES TO REDUCE BLAST RADIUS:
• Bulkhead: Separate thread pools per dependency
• Circuit Breaker: Stop calling a failing service
• Feature Flags: Disable features without deploying
• Canary Deploys: Roll out to 5% of traffic first
• Cell Architecture: Independent copies serving different users
```

---

## Mental Model 9: Exactly-Once Is a Lie

DELIVERY SEMANTICS IN DISTRIBUTED SYSTEMS

At-most-once: Send and forget. Might lose messages.
→ Good for: analytics, non-critical notifications

At-least-once: Retry until acknowledged. Might duplicate.
→ Most systems use this + IDEMPOTENCY

Exactly-once: Each message processed exactly once.

- → IMPOSSIBLE in theory (FLP impossibility)
- → In practice: "effectively once" via
  deduplication + idempotent processing

HOW TO ACHIEVE "EFFECTIVELY ONCE":

1. Assign unique ID to each message
2. Before processing, check: "Have I seen this ID?"
3. If yes → skip (already processed)
4. If no → process + record the ID atomically

```sql
-- PostgreSQL example
INSERT INTO processed_events (event_id, result)
VALUES ('evt_123', 'success')
ON CONFLICT (event_id) DO NOTHING;
```

---

## The Distributed Systems Decision Cheat Sheet

| SITUATION | THINK ABOUT |
|---|---|
| Need low latency worldwide | CDN + read replicas in regions |
| Need data safety | WAL + synchronous replication |
| Hot partition (one key gets all traffic) | Better partition key or scatter |
| Cascading failure | Circuit breaker + bulkhead |
| Stale data in cache | TTL + cache invalidation events |
| Two services need to agree on outcome | Saga pattern (not distributed transactions) |
| Need ordering guarantee | Single partition in Kafka |
| Service discovery | Consul, Eureka, K8s DNS |
| Config across services | Central config (Spring Cloud) |

---

_Distributed systems thinking is about accepting uncertainty and building systems that work DESPITE it, not pretending it doesn't exist._

## NEW DIAGRAM — CAP/PACELC Consistency Choice Tree

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: CAP Theorem + PACELC — Which Consistency Model to Choose           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE CAP THEOREM (pick 2 of 3):                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                       │    │
│  │         Consistency                  Availability                    │    │
│  │              ◄─────────────────────►                                 │    │
│  │                   │                                                  │    │
│  │                   ▼                                                  │    │
│  │    ┌────────────────────────────────────────────────────────┐       │    │
│  │    │                                                        │       │    │
│  │    │   CA ─── Partition Tolerance FAILS                     │       │    │
│  │    │        Traditional RDBMS (PostgreSQL single-node)     │       │    │
│  │    │        Strong consistency, single node                 │       │    │
│  │    │                                                        │       │    │
│  │    │   CP ─── Availability FAILS during partition          │       │    │
│  │    │        MongoDB (w: majority), HBase, Zookeeper        │       │    │
│  │    │        Strong consistency, sacrifices availability    │       │    │
│  │    │                                                        │       │    │
│  │    │   AP ─── Consistency FAILS during partition          │       │    │
│  │    │        Cassandra (eventual), DynamoDB, CouchDB        │       │    │
│  │    │        High availability, sacrifices strong consistency│       │    │
│  │    │                                                        │       │    │
│  │    └────────────────────────────────────────────────────────┘       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼                                                │
│  THE PACELC MODEL (more precise):                                            │
│  "During a partition (P), you choose between Latency (L) and Consistency (C)"  │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  PA/EL (High Availability + Low Latency) = AP systems                │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │  Cassandra: Write anywhere, read anywhere                    │   │    │
│  │  │  • Writes always succeed (AP, low latency)                  │   │    │
│  │  │  • Reads may return stale data (eventual consistency)       │   │    │
│  │  │  • Use when: social feeds, logs, metrics, user content      │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                       │    │
│  │  PC/EC (Strong Consistency + Low Latency) = CP systems               │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │  MongoDB (w: majority), etcd, Zookeeper                     │   │    │
│  │  │  • Reads/writes block until quorum confirmed                │   │    │
│  │  │  • May return errors during partition (unavailable)         │   │    │
│  │  │  • Use when: financial, inventory, leader election          │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                       │    │
│  │  PA/EC (High Availability + Strong Consistency) = rare               │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │  PostgreSQL with async replication (not fully CA)           │   │    │
│  │  │  •牺牲 latency for HA + consistency (possible but rare)     │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  DECISION TREE: Which model for your system?                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  ① Is a network partition possible? (Answer: ALWAYS yes in practice) │    │
│  │                                                                       │    │
│  │  ② During partition: do you need to SERVE READS or REFUSE?           │    │
│  │     │                                                                  │    │
│  │     ├── REFUSE (financial, inventory, payments)                      │    │
│  │     │   → Choose CP (MongoDB w:majority, etcd, Zookeeper)           │    │
│  │     │                                                                    │    │
│  │     └── SERVE READS (social feed, logs, real-time data)              │    │
│  │         │                                                                  │    │
│  │         ├── Can tolerate stale data?                                   │    │
│  │         │   → Choose AP (Cassandra, DynamoDB eventual)               │    │
│  │         │                                                                    │    │
│  │         └── Need STRONG consistency always?                           │    │
│  │             → Quorum reads/writes (R + W > N)                        │    │
│  │             → Cassandra with quorum / DynamoDB strong mode           │    │
│  │                                                                       │    │
│  │  ③ During normal operation (no partition):                           │    │
│  │     │ Need lowest latency? → PA/EL (Cassandra, DynamoDB)           │    │
│  │     │ Need strongest consistency? → PC/EC (etcd, Zookeeper)        │    │
│  │     │ Need both? → Consider two-tier (strong + eventual)           │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  QUORUM FORMULA (tunable consistency):                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  For N total replicas:                                               │    │
│  │                                                                       │    │
│  │  R = nodes read from   /  W = nodes written to   /  N = total       │    │
│  │                                                                       │    │
│  │  Strong consistency when: R + W > N  (reads always see latest write)│    │
│  │  Fast writes (weak consistency): W = 1 (write to 1, read from N)   │    │
│  │  Fast reads (weak consistency): R = 1 (read from 1, write to N)   │    │
│  │                                                                       │    │
│  │  Example: N=3, R=2, W=2 → 2+2 > 3 → STRONG consistency              │    │
│  │  Example: N=3, R=1, W=3 → 1+3 > 3 → STRONG (slow write, fast read) │    │
│  │  Example: N=3, R=1, W=1 → 1+1 NOT > 3 → eventual (fast but stale)  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1994 | Deutsch | Eight Fallacies of Distributed Computing |
| 1978 | Lamport | Time, Clocks, and the Ordering of Events in Distributed Systems |
| 1985 | Fischer, Lynch, Paterson | FLP impossibility — consensus is impossible with even one faulty process |
| 1998/2001 | Lamport | Paxos consensus algorithm (published 1998, refined 2001) |
| 2008 | Vogels | Eventually Consistent — Amazon Dynamo design principles |

**Evolution narrative**: Distributed systems thinking crystallized from three foundational insights. Leslie Lamport's 1978 paper on time and clocks introduced the insight that distributed events cannot be ordered by physical time alone — establishing logical clocks and the concept that causality (not wall-clock time) is the true ordering mechanism. Peter Deutsch's 1994 "Eight Fallacies" documented the practical failure modes: engineers assume network reliability, zero latency, infinite bandwidth, and more — each fallacy is a direct path to production failure. Fischer, Lynch, and Paterson's 1985 FLP impossibility theorem provided the theoretical ceiling: consensus (agreeing on a single value) is mathematically impossible in an asynchronous distributed system if even one process can fail. Lamport's Paxos (1998/2001) worked within this constraint, achieving consensus in partially synchronous systems. Vogels's 2008 "Eventually Consistent" paper accepted the FLP reality and built practical distributed systems around it.

**Modern practice anchor**: Today's distributed systems design (Amazon Dynamo, Google Spanner, CockroachDB, etcd) operates within the FLP impossibility constraint, using Paxos/Raft consensus and eventual consistency as the practical escape routes. The eight fallacies remain the definitive checklist for distributed system design decisions.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Amazon S3 2017 — Typo in Server Reboot Script Took Down Service

**What goes wrong**: An engineer running a routine maintenance script used an incorrect command (`aws s3api delete-bucket-policy` instead of `put-bucket-policy` for the intended bucket). This deleted the bucket policy on a critical prefix, making all objects publicly accessible. The service's authentication layer failed because it relied on bucket-level permissions. The recovery required rebuilding bucket policies for hundreds of prefixes.

**Cost**: Multi-hour S3 outage affecting half the internet (Elastic Load Balancing, Lambda, CloudWatch, and thousands of dependent services). Estimated $150M+ in business impact across AWS customers.

**Debug workflow**:
1. Use immutable infrastructure (no delete operations at runtime). Bucket policies should be in IaC (Terraform/CloudFormation) with version control, not applied via scripts.
2. Add dry-run mode to all maintenance scripts: `--dry-run` flag that logs what would change without applying it.
3. Require two-person review for any delete operation on production storage resources.
4. Enable S3 versioning and MFA delete: even if the policy is deleted, previous versions are recoverable.

### Failure Mode 2: AWS US-East-1 2017 — S3 Partition Caused Cascade of Dependent Services

**What goes wrong**: A simple S3 subsystem entered a reduced-capacity state during a routine/autoscaling event. This triggered cascading failures: load balancers failed health checks (health check images were stored in S3), then API servers couldn't download their configuration from S3, then... the entire region lost core service functionality. The outage spread because services assumed S3 would always be available.

**Cost**: 3+ hours of AWS service disruption affecting Reddit, Trello, and thousands of other services. S3's own status page was unavailable (stored in S3). Total business impact estimated in hundreds of millions of dollars.

**Debug workflow**:
1. Never assume any service (including S3) is always available. Add explicit health checks for dependencies.
2. Cache critical configuration and SSL certificates locally, not just in S3. A local cache prevents a single dependency failure from cascading.
3. Use multi-region active-active for critical services: if one region degrades, traffic routes to the other with no user-visible impact.
4. Build your own status page outside the system being monitored — don't store status page assets in the same infrastructure.

### Failure Mode 3: Paxos Implementation Bugs — Amazon DynamoDB 2015 4-Hour Outage

**What goes wrong**: A bug in DynamoDB's Paxos implementation caused a set of nodes to diverge on the value of a key during a specific sequence of network events. The consensus protocol failed to converge, and the system had to fall back to a manual leader election. During the 4-hour outage, write throughput dropped to 0 for the affected key range.

**Cost**: 4-hour DynamoDB unavailability for a subset of tables. Services relying on DynamoDB for core functionality were down. AWS credited affected customers; total credit cost estimated at $10-50M.

**Debug workflow**:
1. Use established consensus implementations (etcd/Raft, CockroachDB, TiKV) rather than writing your own Paxos. The bug that caused the DynamoDB outage was in an implementation detail that established libraries have already solved.
2. Add idempotency at the application layer: every write should include a unique idempotency key so retries don't cause duplicate operations.
3. Monitor consensus health: track `term` (Raft), `commitIndex`, and `appliedIndex`. Divergence between these signals a consensus problem.
4. Run chaos engineering against consensus systems: kill the leader node, disconnect a quorum subset, inject latency — verify recovery behavior.

### Failure Mode 4: Idempotency Token Collision — Duplicate Payments

**What goes wrong**: A payment service generates idempotency keys as `userId + timestamp`. Under high load, two requests from the same user within the same millisecond get identical idempotency keys. The second request is treated as a duplicate and skipped — but the actual payment was never processed. The user is charged once but the system thinks the payment succeeded.

**Cost**: Double-payment if the idempotency check passes but the write is not atomic. Or missed payment if the second request is incorrectly deduplicated. Financial reconciliation requires manual work.

**Debug workflow**:
1. Use `UUID.randomUUID()` or `Snowflake IDs` for idempotency keys — not compound keys that can collide under concurrent load.
2. Store idempotency keys in a separate table with TTL: `INSERT ... ON CONFLICT DO NOTHING` in PostgreSQL, or conditional writes in DynamoDB.
3. Return `409 Conflict` explicitly when an idempotency key collision is detected, letting the client decide whether to retry with a new key.
4. Add idempotency key to all financial write APIs and enforce at API gateway level — reject requests without a valid idempotency header.

### Modern Production Tools

- **Chaos Monkey / Gremlin**: Inject failures (instance kills, network partition, latency) into distributed systems to test partition handling and consensus recovery.
- **Dapper / Jaeger / OpenTelemetry**: Distributed tracing across service boundaries. Follow a request's path through all nodes to identify where partition or timeout occurred.
- **Terraform / CloudFormation IaC**: Store all bucket policies, IAM roles, and infrastructure configurations as code. Enables instant recovery by redeploying known-good infrastructure state.
- **AWS FIS (Fault Injection Simulator)**: Formally inject AZ failures, throttling, and network latency to test distributed system resilience under controlled conditions.
- **etcd/Raft**: Battle-tested consensus implementations used in Kubernetes, etcd, and CockroachDB. Prefer these over custom Paxos implementations.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**Networks fail**; consistency is a deliberate design choice, not a default. The invariant is that in a distributed system, nodes communicate over a network that can delay, drop, or reorder messages — and can fail entirely (network partitions). In the presence of these failures, perfect consistency is impossible (FLP impossibility result). Therefore, every distributed system designer must choose which consistency guarantees to provide and at what cost. Strong consistency (all reads see the most recent write) requires coordination (locks, consensus), which adds latency and reduces availability. Weaker consistency (eventual, causal) allows stale reads but provides lower latency and higher availability. The internal mechanism is the consensus protocol: Paxos or Raft establishes agreement among nodes on a sequence of values, enabling strong consistency at the cost of coordination overhead.

### Variants Comparison

| Consistency Model | Use Case | Latency | Failure Tolerance | Example |
| --- | --- | --- | --- | --- |
| Strong consistency | Financial transactions, locks | High (requires quorum) | Partition-tolerant but slow | Zookeeper, etcd |
| Causal consistency | Collaborative apps (docs, tasks) | Medium | Partial ordering preserved | PNUTS, DynamoDB (causal) |
| Eventual consistency | Social feeds, comments, analytics | Low | High — reads eventually converge | Cassandra, DynamoDB |
| Read-your-writes | User profile, settings | Medium | Session affinity needed | Most databases with sessions |
| Monotonic reads | Scroll feeds, paginated lists | Low | Consistent view within session | DynamoDB |
| Writes follow reads | Edit-then-read (update) | Low | Must track client history | DynamoDB |

### Consensus Algorithm Comparison

| Algorithm | Complexity | Leader | Use Case | Trade-off |
| --- | --- | --- | --- | --- |
| Paxos | O(log n) messages | Optional (multi-Paxos) | Critical state (ZooKeeper) | Complex, hard to implement |
| Raft | O(log n) messages | Required | Configurable state machines | Simpler than Paxos, leader bottleneck |
| 2PC (Two-Phase Commit) | O(n) messages | Coordinator | Distributed transactions | Blocking on coordinator failure |
| 3PC (Three-Phase Commit) | O(n) messages | Coordinator | Distributed transactions | Non-blocking but complex |
| Gossip protocols | O(log n) convergence | None | Membership, anti-entropy | Eventual, probabilistic |

---

> **Navigation**: [< Previous](15_System_Design_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](17_Frontend_Architecture_Thinking.md)


---

## Reality Check

**"Distributed thinking is single-machine thinking, scaled"** — It is single-machine thinking with three axioms REMOVED: no shared clock (ordering must be constructed), no reliable delivery (every message maybe-arrives, maybe-twice), no failure clarity (dead and slow are indistinguishable). Designs that scale up single-machine intuition — call it like a function, trust the timestamp, detect the crash — are precisely the ones that generate the famous incident classes: double-charges on retry, last-write-wins data loss, split-brain writes.

**"Think in terms of what the system does"** — Distributed thinking inverts to what the system does UNDER EACH FAILURE: the happy path is one row of a matrix whose columns are timeout, duplicate, reorder, partition, and slow-node — and the design is judged by the worst cell. The drill that builds the reflex: for any arrow in any diagram, ask "this message never arrives — then what?" and "this message arrives twice — then what?" Two questions per arrow converts architecture review from tour to stress test.

**"Consistency is a system-wide setting"** — Consistency is a PER-DECISION budget line: the same product runs linearizable inventory decrement, read-your-writes profile updates, and eventually-consistent view counters — each paying exactly the coordination it needs. System-wide slogans ("we're an AP shop") are the tell of borrowed thinking; the owned version prices each flow: what does THIS read need to see, how stale is tolerable, who notices the anomaly, what does the coordination cost in tail latency?

**"Idempotency is a nice-to-have hardening step"** — Idempotency is the PRICE OF RETRIES, and retries are mandatory (because timeouts are ambiguous) — so idempotency is load-bearing from day one: mutation endpoints keyed by client-generated request IDs, consumers deduplicating by event ID, state transitions expressed as absolute-target rather than relative-delta where possible ("set to X" self-heals; "add 5" compounds). The thinking habit: any operation you cannot safely repeat is an operation that WILL eventually execute an unknown number of times — zero, one, or more — and the design must answer for all three.

**"Distributed thinking culminates in choosing algorithms — Raft, vector clocks, CRDTs"** — It culminates in knowing where to BUY versus build: leases from etcd, uniqueness from database constraints, ordering from single-partition streams, transactions from sagas-with-compensation — assembling guarantees from managed parts, reserving algorithm implementation for the rare gap. The interview-and-production tell of maturity is identical: "we need exactly-one leader — that is a lease from the coordination service, with fencing tokens for the stale-leader window," not a Raft implementation sketch. Name the guarantee, name the shelf it comes from, name the residual failure window — that sentence structure is the whole discipline.
