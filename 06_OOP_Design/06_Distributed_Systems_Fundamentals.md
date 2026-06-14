**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [System Design Problems](05_SD_Interview_Problems.md)
🧠 **Mental Model**: See [Distributed Systems Thinking](../14_Mental_Models/16_Distributed_Systems_Thinking.md)

---

# 🌐 Distributed Systems Fundamentals — CAP, Consistency, Partitioning

Everything you need to reason about systems that span multiple machines

---

## Part 1: Why Distributed Systems?

THE FUNDAMENTAL PROBLEM

Single machine: Simple, consistent, but limited
→ CPU/Memory/Disk have hard ceilings
→ Single point of failure (SPOF)

Distributed system: Multiple machines working together
→ Scale beyond single machine limits
→ Survive individual machine failures
→ BUT: introduces network as unreliable component

REAL-WORLD ANALOGY: One chef vs a restaurant kitchen
One chef: Perfect coordination, limited throughput
Kitchen team: High throughput, but needs communication protocols
→ Miscommunication = wrong orders, duplicate dishes, lost tickets

---

## Part 2: CAP Theorem

```
                    Consistency (C)
                        /\
                       /  \
                      /    \
                     / CP   \
                    / systems \
                   /──────────\
                  /            \
                 / You can only  \
                /  pick 2 of 3    \
               /    (during a      \
              /     partition)       \
             /                        \
            /     CA        AP         \
           /   systems    systems       \
          /──────────────────────────────\
     Availability (A)               Partition Tolerance (P)

  REALITY: Network partitions WILL happen (P is not optional)
  → Real choice is: CP or AP

  CP (Consistency + Partition Tolerance):
    When partition happens → system blocks/errors rather than return stale data
    Examples: MongoDB (default), HBase, Redis Cluster, ZooKeeper
    Use when: Bank transfers, inventory counts, leader election

  AP (Availability + Partition Tolerance):
    When partition happens → system returns potentially stale data
    Examples: Cassandra, DynamoDB, CouchDB, DNS
    Use when: Social media feeds, product catalog, shopping cart
```

### CAP in Plain English

SCENARIO: You run 2 database replicas (Node A, Node B)
A network partition splits them — they can't talk to each other

[Node A] ✂️ network partition ✂️ [Node B]

A write comes to Node A: "Set balance = $100"
A read comes to Node B: "What's the balance?"

CHOICE 1 (CP): Node B says "Sorry, I can't answer — I might be stale"
→ Consistent ✅ Available ❌

CHOICE 2 (AP): Node B returns old value "$80"
→ Available ✅ Consistent ❌

You CANNOT have both during a partition. Period.

---

## Part 3: Consistency Models

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SPECTRUM: Strong ←───────────────────────────────────→ Weak                    │
│                                                                                 │
│  1. STRONG CONSISTENCY (Linearizability)                                        │
│     → Every read returns the most recent write                                  │
│     → As if there's only one copy of data                                       │
│     → Cost: High latency (must coordinate all replicas)                         │
│     → Example: Single PostgreSQL instance, Google Spanner                       │
│                                                                                 │
│  2. SEQUENTIAL CONSISTENCY                                                      │
│     → All operations appear in SOME total order                                 │
│     → Same order observed by all nodes                                          │
│     → But that order might not match real-time wall clock                       │
│                                                                                 │
│  3. CAUSAL CONSISTENCY                                                          │
│     → Operations that are causally related are seen in order                    │
│     → Concurrent operations may be seen in different orders                     │
│     → Example: "I replied to your message" always appears after your message    │
│                                                                                 │
│  4. EVENTUAL CONSISTENCY                                                        │
│     → Given enough time with no new writes, all replicas converge               │
│     → Reads may return stale data temporarily                                   │
│     → Cost: Cheapest, fastest                                                   │
│     → Example: DNS, S3, DynamoDB (default)                                      │
│                                                                                 │
│  REAL-WORLD MAP:                                                                │
│  ┌────────────────────┬──────────────────────────────────────────────────────┐  │
│  │ Strong             │ Banking, inventory, leader election                  │  │
│  │ Causal             │ Social media comments, collaborative editing         │  │
│  │ Eventual           │ DNS, CDN, product catalog, analytics                │   │
│  └────────────────────┴──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Replication Strategies

```
1. SINGLE LEADER (Master-Slave)

   ┌────────┐  writes   ┌────────┐
   │ Client  │──────────→│ Leader  │───replicate──→ Follower 1
   └────────┘           └────────┘───replicate──→ Follower 2
   reads from any       (one writer)

   ✅ Simple, strong consistency possible
   ❌ Leader is bottleneck, failover complexity
   Examples: PostgreSQL streaming replication, MySQL

2. MULTI-LEADER

   Leader A ◄────sync────► Leader B
     ↓                       ↓
   Followers              Followers

   ✅ Write to nearest datacenter (low latency)
   ❌ Conflict resolution is HARD (last-writer-wins, merge, custom logic)
   Examples: CouchDB, multi-region DynamoDB

3. LEADERLESS (Quorum-based)

   Client writes to N replicas simultaneously
   Read from R replicas, take most recent
   Rule: W + R > N guarantees overlap → strong consistency POSSIBLE

   N=3, W=2, R=2: Every read overlaps with at least one write replica

   ✅ No single point of failure
   ❌ Complex conflict resolution, repair mechanisms
   Examples: Cassandra, DynamoDB, Riak
```

---

## Part 5: Partitioning (Sharding)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Single machine can't hold all data → split across machines                │
│                                                                                 │
│  STRATEGY 1: Range-Based Partitioning                                           │
│  ─────────────────────────────────────                                          │
│  Shard 1: Users A-F    Shard 2: Users G-M    Shard 3: Users N-Z                 │
│                                                                                 │
│  ✅ Range queries are efficient (get all users A-C → only shard 1)               │
│  ❌ Hot spots! (If most users start with "S", shard 3 overloaded)                │
│                                                                                 │
│  STRATEGY 2: Hash-Based Partitioning                                            │
│  ────────────────────────────────────                                           │
│  shard = hash(userId) % num_shards                                              │
│                                                                                 │
│  ✅ Even distribution (no hot spots for simple partition key)                    │
│  ❌ Range queries require scatter-gather (hit all shards)                        │
│  ❌ Adding/removing shard requires massive data movement                         │
│                                                                                 │
│  STRATEGY 3: Consistent Hashing  ← BEST FOR DISTRIBUTED SYSTEMS                 │
│  ─────────────────────────────────                                              │
│  Nodes and keys mapped to a hash ring (0 to 2^32)                               │
│  Key assigned to nearest node clockwise                                         │
│                                                                                 │
│       0                                                                         │
│      ╱ ╲        Node A at position 100                                          │
│    ╱     ╲      Node B at position 200                                          │
│   ╱       ╲     Node C at position 300                                          │
│  ╱    ●A   ╲                                                                    │
│  │  ●B   ●C │   Key at position 150 → goes to Node B (nearest clockwise)        │
│  ╲         ╱                                                                    │
│   ╲       ╱     When Node B dies: only keys between A and B move to C           │
│    ╲     ╱      Not ALL keys — just 1/N of them!                                │
│      ╲ ╱                                                                        │
│                                                                                 │
│  Virtual nodes: Each physical node owns multiple positions on ring              │
│  → Better distribution, smoother rebalancing                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Consensus Algorithms

PROBLEM: Multiple nodes must agree on a value (leader, transaction, order)

RAFT (Understandable Consensus)
────────────────────────────────
3 roles: Leader, Follower, Candidate

1. Leader Election:
   → Followers wait for heartbeat from leader
   → No heartbeat → timeout → become Candidate
   → Candidate requests votes from all nodes
   → Majority votes → become Leader

2. Log Replication:
   → Client sends write to Leader
   → Leader appends to log, sends to Followers
   → Majority acknowledge → Leader commits
   → Leader tells Followers to commit

WHY MAJORITY (Quorum)?
→ 5 nodes: need 3 to agree
→ Can tolerate 2 failures
→ Any two majorities overlap by at least 1 node
→ Guarantees the committed value is never lost

USED BY: etcd (Kubernetes), CockroachDB, TiKV, Consul

---

### Historical Evolution

Distributed systems theory emerged from the practical necessity of making multiple machines behave as one. The field crystallized around a few landmark publications and systems. **Leslie Lamport introduced Paxos in 1989** (published 1998 after a decade of industry use internally at DEC and Microsoft) — the first consensus algorithm proven to work correctly under Byzantine failures, now used in Chubby (Google's lock service) and Azure Cosmos DB. **Eric Brewer presented the CAP conjecture as a PODC keynote in 1999**, formalizing what engineers had observed empirically: during a network partition, you must choose between consistency and availability. **Nancy Lynch and Michael Fischer proved CAP mathematically in 2002**, elevating it from conjecture to theorem — this is the origin of the formal CAP theorem cited in Part 2. **Google's MapReduce paper (Dean & Ghemawat, 2004)** established the paradigm for batch-processing massive datasets across commodity clusters; Hadoop (2006) was its open-source implementation. **BigTable (Chang et al., 2006)** introduced the wide-column store model, powering Google's crawl index and driving the design of HBase and Cassandra. **Amazon's Dynamo paper (DeCandia et al., 2007)** challenged the SQL orthodoxy by showing that an eventually-consistent key-value store could achieve five-nines availability — DynamoDB, Cassandra, and Riak all descend directly from this paper. **Google Spanner (2012)** reconciled global distribution with strong consistency using TrueTime (GPS + atomic clocks), proving that the CAP trade-off is not binary in time — you can have both AP and CP over different time windows. **Diego Ongaro's Raft paper (2014 PhD dissertation)** introduced Raft as a "understandable" alternative to Paxos, deliberately designed to be easier to teach and implement — today it powers etcd (Kubernetes), CockroachDB, and TiKV.

---

## Part 7: Common Distributed System Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PATTERN              │ WHAT                          │ USED IN                 │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Circuit Breaker      │ Stop calling failing service  │ Netflix Hystrix,        │
│                       │ to prevent cascade failures   │ Resilience4J            │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Bulkhead             │ Isolate failures to one       │ Thread pool per service │
│                       │ component, protect others     │                         │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Saga                 │ Distributed transaction as    │ Order → Pay → Ship      │
│                       │ sequence of local txns +      │ with compensation       │
│                       │ compensations                 │                         │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  CQRS                 │ Separate read and write       │ Event-sourced systems   │
│                       │ models/databases              │                         │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Event Sourcing       │ Store events, not state       │ Banking ledger, audit   │
│                       │ Rebuild state by replaying    │ systems                 │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Sidecar              │ Attach helper process to main │ Service mesh (Istio),   │
│                       │ service (logging, proxy)      │ Envoy proxy             │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Leader Election      │ One node coordinates work     │ ZooKeeper, etcd         │
│──────────────────────┼───────────────────────────────┼────────────────────────  │
│  Gossip Protocol      │ Nodes share state by random   │ Cassandra, Consul       │
│                       │ peer-to-peer communication    │                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Part 7: Common Distributed System Patterns**

**Challenge 1 (Trace — Who/When/What):** A Circuit Breaker protecting calls to Payment Service has 3 states: CLOSED → OPEN → HALF-OPEN. Trace the lifecycle: **Who** decides to trip the breaker? **When** does it transition between states? **What** happens to requests in each state?

<details><summary>Answer</summary>

**CLOSED (normal):** All requests pass through. **Who counts?** The breaker itself tracks failure count. **When does it trip?** When failures exceed threshold (e.g., 5 failures in 60 seconds) → transition to OPEN.

**OPEN:** All requests are REJECTED immediately (fail-fast, no network call). **What happens?** Returns cached response or fallback error. A timer starts (e.g., 30 seconds). **When does it transition?** After the timeout → HALF-OPEN.

**HALF-OPEN:** Allows ONE trial request through. **Who decides?** The breaker lets a single request pass. If it succeeds → back to CLOSED. If it fails → back to OPEN (restart timer). This prevents a recovering service from being overwhelmed by full traffic. The Circuit Breaker is the Bulkhead's partner: Bulkhead isolates failure, Circuit Breaker prevents cascade.

</details>

**Challenge 2 (Design):** In the Saga pattern for Order → Pay → Ship: Payment succeeds but Shipping fails. Walk through the compensation sequence. Why can't you use a regular database rollback?

<details><summary>Answer</summary>

**Why no rollback?** Each step is a LOCAL transaction on a DIFFERENT database/service. There's no distributed `ROLLBACK` across 3 services. **Compensation sequence:** Shipping fails → trigger `compensate_ship` (no-op, nothing to undo) → trigger `compensate_pay` (REFUND the payment) → trigger `compensate_order` (mark order as CANCELLED). Each compensation is itself a NEW transaction, not an undo. **Critical insight:** Compensations must be idempotent — if `compensate_pay` is called twice (due to retry), it must not double-refund. Use a saga execution ID to deduplicate.

</details>

### Production Reality

- **Knight Capital 2012**: Deployed untested trading software, lost **$440M in 45 minutes** due to a single conditional that was supposed to be removed but remained enabled by a legacy config flag. Cause: dead-code activation bug, classic regression-test failure. Violated "test before deploy" SDLC/SRP principles. This is the canonical failure for the CAP-consistency trade-off lesson: the distributed nature of trading systems means state can diverge rapidly and silently — without end-to-end integration tests that cover production configuration, a single config flag can activate a code path that was "known to be untested."
- **Healthcare.gov 2013**: A **$1.7B** system crashed on launch. Cause: monolithic architecture with no load balancing, tightly-coupled components, and synchronous blocking calls between every layer — when one component saturated, it back-pressured all others synchronously. Violated SRP at the system level (one monolith with N reasons to change), DIP at the component level (no dependency injection between services — every service called every other directly with no abstraction layer), and AP principles (the system was designed as a CP monolith that couldn't degrade gracefully under load). The fix was decomposing into independent services with load balancers, circuit breakers, and async communication — exactly the distributed system patterns taught in this chapter.

#### In Production: Diamond Inheritance (Multiple Inheritance of Behavior)

The consistency models govern _state_ across machines. A different class of failure occurs when a _single object_ inherits from multiple parents that both define the same method — the **diamond inheritance problem**.

**C++ Diamond Problem:**

```cpp
class A { public: void foo() { /* ... */ } };
class B : public A {};
class C : public A {};
class D : public B, public C {  // D inherits from B AND C, both from A
    void bar() { foo(); }  // ERROR: ambiguous — B::foo() or C::foo()?
};
```

Calling `D.foo()` is ambiguous because `D` inherits two copies of `A`'s state via two paths. Solutions: explicit disambiguation (`D::B::foo()`) or **virtual inheritance** (`class B : virtual public A {}; class C : virtual public A {};`) which collapses to one `A` — but adds vptr indirection cost and complex constructor ordering.

**Java Interface Diamond (Java 8+ default methods):**

```java
interface I { default void foo() { System.out.println("I"); } }
interface J { default void foo() { System.out.println("J"); } }
class C implements I, J { }  // COMPILE ERROR: unrelated defaults for foo()
// Must override:
class C implements I, J { public void foo() { I.super.foo(); } }
```

Java forbids class multiple inheritance but allows interface multiple inheritance. When two interfaces both provide a `default` implementation of the same method, the implementing class must override it — Java does NOT auto-resolve left-to-right. **Production failure mode**: Java's Collections framework partially sidesteps this by using abstract classes (`AbstractList`, `AbstractSet`) instead of interfaces with defaults. If both were interfaces with `default toArray()` implementations, any class implementing both would hit the diamond compile error. **Debug workflow**: when you see "inherits unrelated defaults for foo() from types I and J", override the conflicting method in the implementing class. Explicitly state which interface's default wins: `I.super.foo()` or `J.super.foo()`.

## Part 8: Interview Quick-Fire Questions

```
Q: "How do you handle a network partition?"
A: Decide CP or AP based on business requirements.
   Banking → CP (refuse stale reads, accept downtime).
   Social media → AP (serve stale data, stay available).

Q: "How does consistent hashing work?"
A: Map nodes and keys to a ring. Key goes to nearest node clockwise.
   Adding/removing node only affects neighbors, not all keys.
   Virtual nodes improve distribution.

Q: "Explain the Saga pattern."
A: Break distributed transaction into local transactions.
   Each step has a compensating action (undo).
   If step 3 fails: run compensate_3, compensate_2, compensate_1.
   Two types: Choreography (events) vs Orchestration (central coordinator).

Q: "What's the difference between horizontal and vertical scaling?"
A: Vertical: bigger machine (more CPU/RAM). Simple but has ceiling.
   Horizontal: more machines. Complex but unlimited scale.
   Horizontal needs: load balancing, data partitioning, state management.
```

---

## PLUS Enhancements

### Diagram 1: CAP Triangle with Named Systems

```
                         ┌──────────────┐
                         │ Consistency  │
                         │     (C)      │
                         └───────┬──────┘
                            ▲    │    ▲
                           ╱     │     ╲
                          ╱      │      ╲
            CP Edge:     ╱   CP  │  AP   ╲    AP Edge:
            ─────────   ╱  Zone  │ Zone  ╲   ──────────
                       ╱         │        ╲
          ┌───────────┼──────────┴─────────┼───────────┐
          │           │                   │           │
          │  MongoDB  │                   │  Cassandra│
          │  HBase    │                   │  DynamoDB │
          │  Redis    │                   │  CouchDB  │
          │  ZooKeeper│                   │  DNS      │
          │  etcd     │                   │  Riak     │
          │           │                   │  S3       │
          └───────────┼───────────────────┼───────────┘
                         │                   │
                         └───────┬───────────┘
                            ▲    │    ▲
                         ╱     │     ╲
                        ╱      │      ╲
                       ╱       │       ╲
                      ▼        │        ▼
               ┌───────────┐   │  ┌────────────┐
               │Availability│   │  │ Partition  │
               │    (A)     │   │  │ Tolerance  │
               └───────────┘   │  │    (P)     │
                              └──────────────┘

  REALITY: P is NEVER optional (network partitions WILL happen)
  → The TRUE choice: CP (favor consistency) vs AP (favor availability)
  → CA systems exist only in theory (no partitions = no distributed system)
```

### Diagram 2: Raft Consensus Sequence (Leader Election + Log Replication)

```
  PHASE 1: LEADER ELECTION
  ═══════════════════════════

  ┌──────────────┐    timeout    ┌────────────────┐
  │   Follower    │──────────────▶│   Candidate    │
  │ (waits 100ms) │  no heartbeat │ (term++, votes)│
  └──────────────┘               └───────┬────────┘
        ▲                                 │
        │    majority voted             │ vote
        │    ─────────────             ▼
        │                        ┌──────────────┐
        └────────────────────────│    Leader     │
             ┌───────────────────┤ (term N, sends│
             │                   │  heartbeats)  │
             ▼                   └──────────────┘
        ┌──────────────┐
        │   Follower    │◀─── heartbeat ─────────┘
        │ (resets timer)│     every 50ms
        └──────────────┘

  Random timeout [150-300ms]: prevents split-vote forever
  Term numbers: prevent "zombie leaders" from old terms

  PHASE 2: LOG REPLICATION
  ══════════════════════════

  Client ──▶ write("balance=100")
               │
               ▼
         ┌──────────────┐   ┌──────────────┐
         │    Leader     │   │   Follower   │  Follower
         │ term=N        │   │  receives    │  receives
         │ log[N]=100    │──▶│  log entry   │──▶ entry
         │ commits entry │   │  appends     │  appends
         └──────────────┘   └──────────────┘
              ▲                  │
              │                  ▼
              │   majority ack  ┌──────────────┐
              └─────────────────│ Leader tells │
                                │ all to commit│
                                └──────────────┘

  Commit rule: W + R > N ensures read-your-writes consistency
```

### Diagram 3: Replication Topology Comparison

```
  TOPOLOGY 1: SINGLE PRIMARY
  ════════════════════════════

       writes                 replicate
  Client ───────▶ ┌────────┐ ─────────▶ ┌───────────┐
                  │ Leader  │ ─────────▶ │ Replica 2 │
                  └────────┘ ─────────▶ │ Replica 3 │
                                        └───────────┘
  reads from any node  reads from replicas (may be stale)

  Trade-off: Simple, strong consistency. Leader = bottleneck.

  TOPOLOGY 2: MULTI-PRIMARY
  ══════════════════════════════

       write A          sync/bidirectional
  Client ───────▶ ┌────────┐ ◀══════════▶ ┌────────┐
                  │ Node A  │              │ Node B │
                  └────────┘              └────────┘
                       │                       │
                       ▼                       ▼
                  ┌────────┐             ┌────────┐
                  │Follower│             │Follower│
                  └────────┘             └────────┘

  Trade-off: Low latency (nearby DC). CONFLICT RESOLUTION is HARD.

  TOPOLOGY 3: QUORUM (R + W > N)
  ════════════════════════════════════

  N=3 replicas, W=2 write quorum, R=2 read quorum

  Write: Client ────▶ writes to ┌──────┐ ┌──────┐ (2-of-3 nodes)
                              └──────┘ └──────┘
                               (wait for 2 acks)

  Read:  Client ────▶ reads   ┌──────┐ ┌──────┐ (2-of-3 nodes)
                              └──────┘ └──────┘
                               (take latest)

  ANY 2 nodes you read from ALWAYS overlap with at least 1 written node
  → Guarantees strong consistency (Cassandra/DynamoDB tunable)

  ┌─────────────────────────────────────────────────────────────┐
  │  TUNABLE CONSISTENCY:                                       │
  │  R=1, W=3 → fast reads,  slow writes, strong consistency    │
  │  R=3, W=1 → slow reads,  fast writes, strong consistency    │
  │  R=2, W=2 → balanced,     quorum overlap guaranteed         │
  │  R=1, W=1 → eventual      (may read stale)                  │
  └─────────────────────────────────────────────────────────────┘
```

### Mechanism Deep-Dive: How Raft Actually Works

**Leader Election Mechanics:**

Raft's leader election is designed for understandability, but the details reveal why it works. Each follower has a **randomized timeout** (typically 150-300ms). When no heartbeat is received within that window, the follower becomes a Candidate and increments its term number:

```
  Timeline:
  t=0ms    Follower A: timer starts (random 150ms)
  t=0ms    Follower B: timer starts (random 300ms)
  t=0ms    Leader:     sends heartbeat (OK)
  t=50ms   A/B: reset timers
  t=100ms  Leader dies
  t=100ms  A: timer starts (residual 100ms)
  t=100ms  B: timer starts (residual 250ms)
  t=200ms  A times out → becomes Candidate, votes for self
  t=200ms  A sends RequestVote(term=2) to all peers
  t=200ms  B: still waiting (50ms left on residual)

  A gets vote from majority → becomes Leader
  B receives heartbeat from A before timing out
```

The **random jitter** is the key insight: if all followers used the same timeout, they would all become Candidates simultaneously, split votes, and never elect a leader (split-brain). Randomization ensures that, with high probability, one node times out first, collects votes, and becomes leader before others wake up.

**Log Replication and Consistency:**

Raft maintains a **log consistency guarantee**: if two entries across different servers share the same index and term, they must contain the same command, and all preceding entries must be identical. This is enforced by the AppendEntries RPC:

```
  Leader sends AppendEntries(prevIndex, prevTerm, entries[])
  Follower rejects if:
    - prevIndex entry doesn't match prevTerm  → log inconsistency
    - conflicting entry exists                → truncate + replace

  This is Raft's "consistency check" — prevents split-brain
  because a partition cannot produce two conflicting entries
  with the same index+term on different leaders.
```

**Split-Brain Prevention via Term Numbers:**

Term numbers are monotonically increasing integers that act as logical timestamps. If a partitioned leader attempts to replicate:

```
  Before partition:
  Node A: Leader, term=5, log=[e1, e2, e3]
  Node B: Follower, term=5, log=[e1, e2, e3]

  Partition occurs (B isolated from A)
  B doesn't receive heartbeats → times out → becomes Candidate
  B: term=6, votes for self, sends RequestVote
  A: still receives client writes (served from majority A+C)
  A: term=5, commits entries

  B: receives vote from itself only (not majority) → remains Candidate
  A: receives B's RequestVote(term=6) → A knows B is from old term
     A responds: "your term is outdated, revert to follower"

  After partition heals:
  B receives A's response → B reverts to Follower, syncs log from A
  A: term=5, log=[e1, e2, e3]
  B: term=5, log=[e1, e2, e3]  ← consistent!
```

The term mechanism ensures that any leader from an old partition cannot commit entries — it is rejected by any node that has seen a newer term. This is how Raft prevents split-brain without requiring synchronous communication.

### Why-This-Not-That: Paxos vs Raft

| Dimension                      | Paxos                                           | Raft                                           |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------- |
| **Designed for**               | Theoretical correctness                         | Implementability                               |
| **Invented by**                | Leslie Lamport (1989)                           | Diego Ongaro (2014)                            |
| **Roles**                      | Single proposer/acceptor                        | Leader + Followers + Candidates                |
| **Understandability**          | Extremely difficult (multi-chapter proof)       | Single chapter, proven equivalent              |
| **Multi-decree**               | Requires 2 phases per command                   | Single leader batches commands naturally       |
| **Production usage**           | Chubby (Google), Cosmos DB (Azure)              | etcd, CockroachDB, TiKV, Consul                |
| **Leaderless**                 | Yes (Multi-Paxos)                               | Requires leader (single point, but elected)    |
| **Complexity**                 | Proved correct but hand-wavy for implementation | Easier to implement but must handle edge cases |
| **Cluster membership changes** | Complex (view changes in Zab, Raft)             | Well-specified (joint consensus)               |

**Why Raft won in production:**
The etcd team (core of Kubernetes) evaluated Paxos before choosing Raft and concluded that Raft's "single leader per term" model maps naturally to how systems actually work — writes go through one node, which simplifies reasoning. Paxos's multi-proposer model requires additional mechanism to avoid conflicts. The Raft paper itself opens with: "Paxos is notoriously difficult to understand and implement." That was an explicit design goal, not a coincidence.

**When to use Paxos:** If you need a leaderless consensus (no single point of failure for coordination) and your team has deep distributed systems expertise. Google's Chubby (used for BigTable lock coordination) uses Paxos under the hood, but it's wrapped in a very mature system. For most teams, Raft is the right default.

### Breadth Comparison 1: Consistency Model Full Comparison Table

```
┌──────────────────────┬────────────────────┬──────────────────────┬──────────────────┐
│  CONSISTENCY MODEL   │  GUARANTEE         │  LATENCY             │  NAMED SYSTEMS   │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Linearizability     │  Read = latest     │  10-100ms+           │  Google Spanner  │
│  (Strongest)         │  write, globally   │  (must coordinate    │  Zookeeper      │
│                      │                    │   all replicas)      │  etcd            │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Sequential          │  All ops in        │  5-50ms              │  DynamoDB        │
│  Consistency         │  same total order  │  (leader coordinates │  (per-object     │
│                      │  across all nodes  │   but no wall clock  │   locks)         │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Causal              │  Causally related  │  1-20ms              │  MongoDB 4.0+    │
│  Consistency         │  ops in order,     │  (track dependencies │  (causal reads)  │
│                      │  concurrent may    │   in vector clocks)  │  Azure Cosmos DB │
│                      │   differ           │                      │                  │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Eventual            │  All replicas      │  0.5-5ms             │  Amazon DynamoDB │
│  Consistency         │  converge given    │  (local reads, no    │  Apache Cassandra│
│  (Weakest practical) │  no new writes     │   coordination)      │  AWS S3          │
│                      │                    │                      │  DNS             │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Read-Your-Writes    │  Session sees its  │  1-10ms              │  DynamoDB        │
│  (PRAM)              │  own writes        │  (session affinity)  │  DAX             │
│                      │                    │                      │  Cassandra       │
│                      │                    │                      │  (per-DC reads)  │
├──────────────────────┼────────────────────┼──────────────────────┼──────────────────┤
│  Monotonic Reads     │  Never read older  │  1-10ms              │  DynamoDB        │
│                      │  data after reads  │  (client-side        │  Azure Table     │
│                      │                    │   tracking)          │  Storage         │
└──────────────────────┴────────────────────┴──────────────────────┴──────────────────┘

  SELECTION CRITERIA:
  Banking/ledger/leader election  → Linearizability (CP)
  Shopping cart/inventory          → Read-Your-Writes (session)
  Social media feeds               → Eventual (AP)
  Collaborative editing            → Causal (coordinate via CRDTs)
  CDN cache, DNS                   → Eventual (AP)
```

### Breadth Comparison 2: Distributed Transaction Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PATTERN         │  2PC (Two-Phase Commit)  │  SAGA (Choreography/Orchestration) │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  MODEL           │  All-or-nothing atomic   │  Sequence of local txns +          │
│                  │  commit across services  │  compensating actions              │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  COORDINATION    │  Central Coordinator     │  Distributed (choreography) or     │
│                  │  sends Prepare → Commit  │  central Orchestrator              │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  ON FAILURE      │  Coordinator decides     │  Compensate each completed step:  │
│                  │  COMMIT or ROLLBACK      │  undo_ship → refund_payment →     │
│                  │  (all nodes must agree)  │  cancel_order                     │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  BLOCKING        │  YES — locks held during │  NO — each step is independent,   │
│                  │  prepare phase           │  compensation is a new forward    │
│                  │                          │  transaction                       │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  USE WHEN        │  Tightly coupled data,   │  Loosely coupled microservices,   │
│                  │  must not violate        │  long-running workflows,          │
│                  │  invariants              │  eventual consistency OK          │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  EXAMPLES        │  Distributed SQL,        │  Order → Pay → Ship (e-commerce)  │
│                  │  HBase, Spanner          │  Travel booking pipeline          │
│                  │                          │  Financial ledger with reversals  │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  CRITICAL RISK   │  Coordinator crash       │  Compensation failure             │
│                  │  → nodes wait forever    │  (refund fails after ship —       │
│                  │  → need timeouts +       │  need retry/idempotency)          │
│                  │    recovery protocols    │                                   │
├──────────────────┼──────────────────────────┼──────────────────────────────────  ┤
│  LATENCY         │  High (3 round-trips     │  Lower per step, but more steps   │
│                  │  total coordination)     │  overall                           │
└──────────────────┴──────────────────────────┴──────────────────────────────────  ┘

  EVENTUAL CONSISTENCY AS THIRD ALTERNATIVE:
  ══════════════════════════════════════════════════

  Don't coordinate at all. Each service updates itself.

  Example: Place order → write to Orders DB → emit "order.placed" event
           Payment service consumes event → processes payment asynchronously
           Inventory service consumes event → reserves stock asynchronously

  Trade-offs:
  + Highest throughput, lowest latency (no coordination overhead)
  + Individual services can fail and recover independently
  - Consistency is deferred — user may see "order confirmed" before payment clears
  - Requires idempotency everywhere (retry = duplicate processing)
  - Requires saga/outbox pattern to guarantee event delivery

  HYBRID: Outbox Pattern (used at Amazon, Stripe)
  ════════════════════════════════════════════════
  Service writes to local DB: order + "outbox:order.placed" atomically
  Background process polls outbox → publishes to message broker
  Consumers: "exactly-once" delivery via deduplication

  This gives you transactional guarantees WITH eventual consistency performance.
```

> **Navigation**: [< Previous](05_SD_Interview_Problems.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_LLD_Solved_Problems.md)
