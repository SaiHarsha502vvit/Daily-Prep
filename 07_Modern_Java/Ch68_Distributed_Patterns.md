**Navigation**: [< Previous](Ch67_Kubernetes_Deep_Dive.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch69_Performance_Engineering.md)

# 🌐 Chapter 42 — Distributed Patterns & Consensus: How Systems Agree

**"If 5 database replicas receive a write, how do they agree on the order? If a network partition splits your cluster in half, which half keeps accepting writes? These questions define distributed systems — and the answers are Raft, Paxos, 2PC, and the patterns built on top of them."**

---

## Table of Contents

1. [The CAP Theorem — The Fundamental Trade-off](#1-the-cap-theorem--the-fundamental-trade-off)
2. [Raft Consensus — How Leaders Get Elected](#2-raft-consensus--how-leaders-get-elected)
3. [Two-Phase Commit (2PC) — Distributed Transactions](#3-two-phase-commit-2pc--distributed-transactions)
4. [Consistent Hashing — How Data Is Distributed](#4-consistent-hashing--how-data-is-distributed)
5. [Leader Election — Who's in Charge](#5-leader-election--whos-in-charge)
6. [Crdt — Conflict-Free Replicated Data Types](#6-crdt--conflict-free-replicated-data-types)
7. [Circuit Breaker — Failing Fast and Recovering](#7-circuit-breaker--failing-fast-and-recovering)
8. [Idempotency — Safe Retries in Distributed Systems](#8-idempotency--safe-retries-in-distributed-systems)
9. [Distributed Locking — Mutual Exclusion Across Services](#9-distributed-locking--mutual-exclusion-across-services)
10. [Outbox Pattern — Reliable Event Publishing](#10-outbox-pattern--reliable-event-publishing)

---

## 1. The CAP Theorem — The Fundamental Trade-off

```
  In a DISTRIBUTED system, you can have at most TWO of three:

  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │                    Consistency (C)                                   │
  │                    ┌─────────────┐                                  │
  │                    │ Every read  │                                  │
  │                    │ gets the    │                                  │
  │                    │ most recent │                                  │
  │                    │ write       │                                  │
  │                    └──────┬──────┘                                  │
  │                          │                                          │
  │              ┌───────────┴───────────┐                             │
  │              │                       │                             │
  │     ┌────────┴────────┐   ┌─────────┴────────┐                    │
  │     │ Availability(A) │   │ Partition         │                    │
  │     │ Every request   │   │ Tolerance (P)     │                    │
  │     │ gets a response │   │ System works      │                    │
  │     │ (not error)     │   │ despite network   │                    │
  │     │                 │   │ partitions         │                    │
  │     └─────────────────┘   └──────────────────┘                    │
  │                                                                      │
  │  IN PRACTICE: Network partitions WILL happen.                       │
  │  So you really choose between:                                      │
  │                                                                      │
  │  CP (Consistency + Partition Tolerance):                             │
  │  → Refuse requests during partition (return errors)                 │
  │  → Examples: ZooKeeper, etcd, HBase, PostgreSQL (single primary)   │
  │  → When: Financial data, inventory counts, leader election          │
  │                                                                      │
  │  AP (Availability + Partition Tolerance):                            │
  │  → Return possibly stale data during partition                      │
  │  → Examples: Cassandra, DynamoDB, CouchDB, DNS                     │
  │  → When: Shopping carts, social feeds, caches                       │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Raft Consensus — How Leaders Get Elected

```
  Raft is the consensus algorithm used by: etcd (Kubernetes), CockroachDB,
  TiKV, Consul, RabbitMQ Quorum Queues.

  CORE IDEA: One LEADER, rest are FOLLOWERS.
  All writes go to leader. Leader replicates to majority.


  THREE STATES:
  ═════════════

  Follower ──(timeout, no leader heard)──→ Candidate
     ▲                                        │
     │                                        │ (wins election)
     │                                        ▼
     └──────────(discovers new leader)──── Leader


  LEADER ELECTION:
  ════════════════

  Normal operation:
  ┌──────┐  heartbeat  ┌──────┐   heartbeat  ┌──────┐
  │Node-1│────────────→│Node-2│─────────────→│Node-3│
  │LEADER│             │FOLLOW│              │FOLLOW│
  │Term:5│←────────────│Term:5│←─────────────│Term:5│
  └──────┘  ACK        └──────┘    ACK       └──────┘

  Leader dies:
  ┌──────┐             ┌──────┐              ┌──────┐
  │Node-1│     ❌      │Node-2│              │Node-3│
  │ DEAD │             │FOLLOW│              │FOLLOW│
  └──────┘             └──────┘              └──────┘
                       (no heartbeat for 150-300ms)
                       │
                       ▼ timeout!

  ┌──────┐             ┌──────────┐          ┌──────┐
  │Node-1│     ❌      │Node-2    │          │Node-3│
  │ DEAD │             │CANDIDATE │          │FOLLOW│
  └──────┘             │Term: 6   │          └──────┘
                       │Vote me!  │──────────→ "OK, I vote for Node-2"
                       └──────────┘
                       │
                       ▼ Got majority (2 of 3)!

  ┌──────┐             ┌──────────┐          ┌──────┐
  │Node-1│     ❌      │Node-2    │          │Node-3│
  │ DEAD │             │LEADER    │          │FOLLOW│
  └──────┘             │Term: 6   │──────────→│Term:6│
                       └──────────┘ heartbeat └──────┘


  LOG REPLICATION (how writes work):
  ══════════════════════════════════

  Client → Leader: "SET key=value"

  1. Leader appends to its log: [index:7, term:6, SET key=value]
  2. Leader sends AppendEntries RPC to all followers
  3. Followers append to their logs, respond with ACK
  4. When MAJORITY responds (2 of 3):
     → Leader COMMITS entry (applies to state machine)
     → Leader responds to client: "SUCCESS"
  5. Next heartbeat tells followers: "commit up to index 7"
  6. Followers apply to their state machines

  MAJORITY = (N/2) + 1
  3-node cluster: majority = 2 → tolerates 1 failure
  5-node cluster: majority = 3 → tolerates 2 failures
```

---

## 3. Two-Phase Commit (2PC) — Distributed Transactions

```
  When you NEED atomic transactions across multiple databases/services.


  PHASE 1: PREPARE (vote)
  ════════════════════════

  ┌─── Coordinator ────────────────────────────────────────────────────┐
  │  "Everyone: prepare to commit transaction T1"                       │
  └──────┬───────────────────────────┬──────────────────────────────────┘
         │                           │
         ▼                           ▼
  ┌── Participant A ──┐     ┌── Participant B ──┐
  │ Take locks         │     │ Take locks         │
  │ Write to WAL       │     │ Write to WAL       │
  │ Ready to commit    │     │ Ready to commit    │
  │ → vote YES ✅     │     │ → vote YES ✅     │
  └────────┬───────────┘     └────────┬───────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
  ┌─── Coordinator ────────────────────────────────────────────────────┐
  │  ALL voted YES → proceed to Phase 2                                 │
  └─────────────────────────────────────────────────────────────────────┘


  PHASE 2: COMMIT
  ════════════════

  ┌─── Coordinator ────────────────────────────────────────────────────┐
  │  "Everyone: COMMIT transaction T1"                                  │
  └──────┬───────────────────────────┬──────────────────────────────────┘
         │                           │
         ▼                           ▼
  ┌── Participant A ──┐     ┌── Participant B ──┐
  │ Apply changes      │     │ Apply changes      │
  │ Release locks      │     │ Release locks      │
  │ → ACK ✅          │     │ → ACK ✅          │
  └────────────────────┘     └────────────────────┘


  IF ANY PARTICIPANT VOTES NO:
  ════════════════════════════

  Coordinator sends ABORT to all participants.
  Everyone rolls back. Locks released.


  THE PROBLEM WITH 2PC:
  ═════════════════════

  1. BLOCKING: If coordinator crashes after Phase 1 but before Phase 2,
     participants are stuck holding locks, waiting forever!

  2. SLOW: 2 network round-trips minimum (4 messages × N participants)

  3. SINGLE POINT OF FAILURE: Coordinator crash = stuck transactions

  THIS IS WHY microservices prefer the SAGA pattern instead.
  2PC is used within a single system (e.g., database internal).
```

---

🔬 **Section Challenge — 3. Two-Phase Commit (2PC) — Distributed Transactions**

**Challenge 1 (System Failure):** In a Two-Phase Commit protocol, the Coordinator sends the "Prepare" message, and all participants vote "YES" and acquire locks. Immediately after, the Coordinator's server crashes and its hard drive burns before it can send the "Commit" message. What happens to the participants?

<details><summary>Answer</summary>

This exposes the fatal flaw of 2PC: **Blocking**. The participants are stuck holding exclusive write locks on the records they prepared, waiting for a coordinator that will never respond. They cannot unilaterally abort (because another participant might have committed), nor can they commit. The system grinds to a halt until the coordinator is restored or manual DBA intervention clears the locks.

</details>

## 4. Consistent Hashing — How Data Is Distributed

```
  PROBLEM: You have 4 cache servers. Which server holds key "user:42"?

  NAIVE APPROACH: server = hash(key) % 4
  Works until you add/remove a server → ALL keys remap! Cache invalidation storm.


  CONSISTENT HASHING:
  ═══════════════════

  Imagine a ring (0 to 2^32-1)

                        0 (= 2^32)
                       ╱    ╲
                     ╱        ╲
                   ╱            ╲
  Server-A (pos 100)            Server-B (pos 800)
                 ╲                ╱
                   ╲            ╱
                     ╲        ╱
                       ╲    ╱
                  Server-C (pos 500)

  To find which server owns key "user:42":
  1. Hash the key: hash("user:42") = 350
  2. Walk clockwise from 350
  3. First server you hit: Server-C (at position 500)
  4. Server-C owns "user:42"


  WHEN SERVER-D (pos 650) IS ADDED:
  ══════════════════════════════════

  Only keys between Server-C(500) and Server-D(650) remap!
  Keys at 350 (→ still Server-C), 700 (→ now Server-D, was Server-B)

  Instead of ALL keys moving → only ~1/N keys move. Minimal disruption.


  VIRTUAL NODES (vnodes):
  ═══════════════════════

  Problem: With few servers, distribution is uneven.
  Solution: Each server gets multiple positions on the ring.

  Server-A: vnodes at positions [100, 300, 700, 950]
  Server-B: vnodes at positions [200, 450, 600, 850]

  Now the ring is more evenly divided.

  USED BY: Cassandra, DynamoDB, Redis Cluster, Memcached, CDNs
```

---

🔬 **Section Challenge — 4. Consistent Hashing — How Data Is Distributed**

**Challenge 1 (System Design):** You have a cache cluster with 3 servers using Consistent Hashing. You notice Server A is taking 80% of all the traffic, while Servers B and C are mostly idle. Why is this happening, and how do Virtual Nodes fix it?

<details><summary>Answer</summary>

The random hashing of just 3 server IP addresses placed them unevenly on the ring (e.g., A at 10°, B at 20°, C at 30°). This means Server A "owns" the vast 330° remaining segment of the hash space. **Virtual Nodes (vnodes)** fix this by assigning each physical server hundreds of points on the ring (A1, A2, A3...). This artificially interweaves their coverage areas, mathematically guaranteeing an even distribution of the hash space regardless of the physical server count.

</details>

## 5. Leader Election — Who's in Charge

```
  Many systems need ONE leader for coordination:
  - Database primary (accepts writes)
  - Kafka partition leader (handles produce/consume)
  - Cron job runner (only one should execute)
  - Cache invalidation coordinator


  USING ZOOKEEPER/etcd (external coordinator):
  ═════════════════════════════════════════════

  1. All nodes try to create an EPHEMERAL node: /election/leader
  2. Only ONE succeeds (atomic create) → becomes leader
  3. Others watch the node for deletion
  4. If leader dies → ephemeral node auto-deleted (session timeout)
  5. Watchers notified → race to create /election/leader again
  6. First one wins → new leader


  USING REDIS (Redlock):
  ══════════════════════

  SET leader_lock "node-1" NX PX 30000
  (NX = only if not exists, PX = expire in 30 seconds)

  If SET succeeds: you're the leader
  Must RENEW before 30s expires (heartbeat)
  If fails: someone else is leader, retry periodically

  ⚠️ Single Redis = single point of failure
  Redlock algorithm: acquire lock on majority of Redis instances


  USING DATABASE:
  ═══════════════

  -- Leader table with optimistic locking
  CREATE TABLE leader_election (
      id INT PRIMARY KEY DEFAULT 1,
      leader_id VARCHAR(255),
      heartbeat TIMESTAMP,
      CHECK (id = 1)  -- only one row ever
  );

  -- Try to become leader (if no recent heartbeat):
  UPDATE leader_election
  SET leader_id = 'node-1', heartbeat = NOW()
  WHERE heartbeat < NOW() - INTERVAL '30 seconds';
  -- If rows affected = 1: you're the leader
  -- If rows affected = 0: someone else is alive
```

---

🔬 **Section Challenge — 5. Leader Election — Who's in Charge**

**Challenge 1 (Edge Cases):** Service Instance A acquires a distributed lock in Redis to process an important daily batch job. While processing, Instance A experiences a 60-second JVM Garbage Collection pause. The lock expires in Redis after 30 seconds, and Instance B takes the lock and starts processing. Instance A wakes up and continues processing. Both instances write to the database. How do you prevent this?

<details><summary>Answer</summary>

You must use **Fencing Tokens**. When a lock is acquired, the lock service must return a monotonically increasing integer (e.g., token 34). The service passes this token to the database with its writes. When Instance B acquires the lock, it gets token 35. If Instance A wakes up and tries to write to the database with token 34, the database sees that a newer token (35) has already been active, and outright rejects Instance A's write.

</details>

## 6. CRDT — Conflict-Free Replicated Data Types

```
  IN AP SYSTEMS (eventual consistency), concurrent writes can conflict.

  Node-A: counter = 5, increment → counter = 6
  Node-B: counter = 5, increment → counter = 6  (simultaneously)

  When they sync: counter should be 7, but both say 6!


  CRDT SOLUTION: Design data structures that MERGE without conflicts.


  G-COUNTER (Grow-only Counter):
  ══════════════════════════════

  Each node tracks its OWN increments:

  Node-A state: {A: 3, B: 0, C: 0}  → total = 3
  Node-B state: {A: 0, B: 5, C: 0}  → total = 5
  Node-C state: {A: 0, B: 0, C: 2}  → total = 2

  Merge: take MAX of each node's counter:
  Merged: {A: 3, B: 5, C: 2} → total = 10 ✅

  No conflicts! No coordination needed! Works offline!


  REAL USES:
  ══════════
  • Redis CRDTs (Redis Enterprise)
  • Riak (distributed database)
  • Automerge (collaborative editing library)
  • Shopping carts (add items from multiple devices)
  • Like counters (social media)
```

---

🔬 **Section Challenge — 6. CRDT — Conflict-Free Replicated Data Types**

**Challenge 1 (Reasoning — Who/When/What):** A G-Counter CRDT has 3 nodes each with vector `[node1, node2, node3]`. Node1=`[5,3,2]`, Node2=`[3,7,1]`. **Who** merges them? **What** is the merged value? **When** does eventual consistency converge?\n\n<details><summary>Answer</summary>\n\n**Who merges?** Any node receiving the state from another — no coordinator needed (fully decentralized). **Merged value:** Element-wise MAX: `[max(5,3), max(3,7), max(2,1)]` = `[5,7,2]`. Total count = 5+7+2 = 14. **When convergence?** Once all nodes have exchanged their states (gossip protocol), every node will have the same vector and same total. CRDTs guarantee convergence regardless of message ordering or delivery. **Why MAX works:** Each element represents a node's OWN increment count. A node never decrements its own slot. MAX safely captures the highest observed count per node without losing any increments, even when messages arrive out of order.\n\n</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?

<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.

</details>

## 7. Circuit Breaker — Failing Fast and Recovering

```
  PROBLEM: Service B is down. Service A keeps calling it.
  100 requests → 100 timeouts → 100 × 30s = 50 minutes of wasted threads!


  CIRCUIT BREAKER — DETAILED STATE MACHINE:
  ═════════════════════════════════════════════════

  ┌─ STATE 1: CLOSED (Normal Operation) ────────────────────────────────────────┐
  │                                                                              │
  │  ┌────────────────────────────────────────────────────────────────────┐     │
  │  │  ✓ All requests pass through to Service B                           │     │
  │  │  ✓ Failures tracked in sliding window (last N calls)               │     │
  │  │  ✓ Success resets failure count                                     │     │
  │  │                                                                     │     │
  │  │  IF failures >= threshold (e.g., 5 failures in 10 calls)           │     │
  │  │  THEN ────────────────────────────────────────────────►  OPEN       │     │
  │  └────────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ failure threshold reached
                                       ▼
  ┌─ STATE 2: OPEN (Fail Fast) ─────────────────────────────────────────────────┐
  │                                                                              │
  │  ┌────────────────────────────────────────────────────────────────────┐     │
  │  │  ✗ ALL requests FAIL IMMEDIATELY (no call to Service B!)           │     │
  │  │  ✗ Return fallback / error to caller                               │     │
  │  │  ✓ Protects Service B from being overwhelmed                       │     │
  │  │  ✓ Threads don't block on timeouts                                 │     │
  │  │                                                                     │     │
  │  │  TIMER RUNNING: waitDurationInOpenState (e.g., 60 seconds)         │     │
  │  │  IF timer expires ───────────────────────────────────►  HALF-OPEN  │     │
  │  └────────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ timeout expires
                                       ▼
  ┌─ STATE 3: HALF-OPEN (Testing Recovery) ─────────────────────────────────────┐
  │                                                                              │
  │  ┌────────────────────────────────────────────────────────────────────┐     │
  │  │  ? ONE test request allowed through to Service B                   │     │
  │  │                                                                     │     │
  │  │  IF test request SUCCEEDS:                                         │     │
  │  │     → Circuit CLOSED (Service B recovered!)                        │     │
  │  │     → Reset failure count, resume normal operation                 │     │
  │  │                                                                     │     │
  │  │  IF test request FAILS:                                            │     │
  │  │     → Circuit re-OPEN (Service B still broken)                     │     │
  │  │     → Reset timer, wait another waitDurationInOpenState            │     │
  │  └────────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────────┘

  ╔═══════════════════════════════════════════════════════════════════════╗   │
  ║  PRODUCTION RESILIENCE4J CONFIG EXAMPLE                              ║   │
  ║  ─────────────────────────────────────────────────────────────────   ║   │
  ║  failureRateThreshold: 50        # Open if 50%+ calls fail            ║   │
  ║  waitDurationInOpenState: 60s    # Test after 60 seconds              ║   │
  ║  slidingWindowSize: 10           # Track last 10 calls                ║   │
  ║  minimumNumberOfCalls: 5         # Need 5 calls before evaluating     ║   │
  ╚═══════════════════════════════════════════════════════════════════════╝   │
```

```java
// Using Resilience4j (modern Java library):
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
public PaymentResult processPayment(PaymentRequest request) {
    return paymentClient.charge(request);  // calls external service
}

public PaymentResult paymentFallback(PaymentRequest request, Throwable t) {
    // Fallback: queue for later processing
    paymentQueue.enqueue(request);
    return PaymentResult.pending("Payment queued, will process shortly");
}

// application.yml
// resilience4j.circuitbreaker.instances.paymentService:
//   failureRateThreshold: 50        # Open if 50% of calls fail
//   waitDurationInOpenState: 60s    # Stay open for 60 seconds
//   slidingWindowSize: 10           # Measure over last 10 calls
//   minimumNumberOfCalls: 5         # Need at least 5 calls to evaluate
```

---

🔬 **Section Challenge — 7. Circuit Breaker — Failing Fast and Recovering**

**Challenge 1 (Reasoning):** In a microservice architecture, why is a naive Retry mechanism often more dangerous than failing fast?

<details><summary>Answer</summary>

Retry Storms. If Service B is struggling and timing out, Service A aggressively retrying requests will multiply the load on Service B, causing it to completely collapse (cascading failure). Retries must _always_ be paired with Exponential Backoff (to space out load), Jitter (to prevent synchronized waves of retries), and a Circuit Breaker (to completely cut off traffic and let Service B recover once a failure threshold is reached).

</details>

## 8. Idempotency — Safe Retries in Distributed Systems

```
  PROBLEM: Client sends "transfer $100" → network timeout → Did it succeed?
  Client retries "transfer $100" → now $200 was transferred?!


  IDEMPOTENT = Same operation applied multiple times = same result.

  NATURALLY IDEMPOTENT:       NOT IDEMPOTENT:
  GET /users/42               POST /transfers {amount: 100}
  PUT /users/42 {name:"H"}   POST /orders (creates new each time)
  DELETE /users/42            increment counter++
  SET key=value               append to list


  MAKING NON-IDEMPOTENT OPERATIONS SAFE:
  ═══════════════════════════════════════

  Use an IDEMPOTENCY KEY:

  Client → POST /transfers
           Idempotency-Key: "txn-abc-123"  (UUID generated by client)
           Body: {from: "A", to: "B", amount: 100}

  Server:
  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │  1. Receive request with key "txn-abc-123"                          │
  │  2. Check: SELECT * FROM idempotency_keys WHERE key = 'txn-abc-123'│
  │     ├── FOUND: Return stored response (already processed!)         │
  │     └── NOT FOUND: Continue...                                      │
  │  3. Process transfer (debit A, credit B)                            │
  │  4. Store: INSERT INTO idempotency_keys                             │
  │            (key, response, created_at)                               │
  │            VALUES ('txn-abc-123', '{success: true}', NOW())         │
  │  5. Return response                                                  │
  │                                                                      │
  │  Steps 3-4 happen in SAME database transaction!                     │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘

  Now client can safely retry. Same key → same (stored) response.
```

---

🔬 **Section Challenge — 8. Idempotency — Safe Retries in Distributed Systems**

**Challenge 1 (Edge Cases):** A client sends a `POST /checkout` request with an `Idempotency-Key`. The server receives it, but before the database transaction finishes, the client times out and retries with the _exact same_ `Idempotency-Key`. If the server simply checks the database for an existing completed response, what race condition occurs?

<details><summary>Answer</summary>

Because the first request hasn't committed yet, the `Idempotency-Key` check in the database will return "Not Found". The server will spin up a _second_ transaction for the retry, resulting in a double-charge! To fix this, you must acquire a distributed lock on the `Idempotency-Key` _before_ checking the DB, or use a unique constraint on the database column so the second transaction fails to insert the pending key.

</details>

## 9. Distributed Locking — Mutual Exclusion Across Services

```
  PROBLEM: Two instances of "report-generator" service both try to
  generate the same monthly report at the same time → duplicates.

  Need: Only ONE instance runs the report at a time.
  In one JVM: synchronized or ReentrantLock.
  Across JVMs/services: DISTRIBUTED LOCK.


  REDIS-BASED LOCK:
  ═════════════════

  ACQUIRE:
  SET report_lock "instance-1" NX PX 30000
  // NX: only if key doesn't exist (atomic check-and-set)
  // PX 30000: auto-expire in 30 seconds (prevent deadlock if holder crashes)

  If SET returns OK → lock acquired!
  If SET returns nil → lock held by someone else → retry or abort

  RELEASE:
  // MUST verify you're the owner before deleting!
  // Lua script for atomicity:
  if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
  else
      return 0
  end

  WHY Lua script? Between GET and DEL, lock might have expired
  and been acquired by someone else. Lua runs atomically in Redis.


  ⚠️ THE FENCING TOKEN PROBLEM:
  ═════════════════════════════

  Timeline:
  Client-1 acquires lock (token: 34) → starts work
  Client-1 has long GC pause → lock expires!
  Client-2 acquires lock (token: 35) → starts work
  Client-1 GC ends → thinks it still holds lock → writes to DB!

  Now BOTH wrote to DB. Lock didn't protect!

  SOLUTION: Fencing tokens
  Each lock acquisition gets an incrementing token.
  Database rejects writes with token < last seen token.

  Client-1 writes with token 34 → accepted
  Client-2 writes with token 35 → accepted
  Client-1 retries with token 34 → REJECTED (34 < 35)
```

---

🔬 **Section Challenge — 9. Distributed Locking — Mutual Exclusion Across Services**

**Challenge 1 (System Design):** Why is implementing a distributed lock using `SET key value NX` in a single Redis node dangerous for mission-critical operations, and what is the Redlock algorithm?

<details><summary>Answer</summary>

A single Redis node is a single point of failure. If the master crashes _after_ granting a lock, but _before_ replicating that key to the replica, the replica will get promoted to master without knowing about the lock. It will then grant the lock to a second client! The **Redlock algorithm** solves this by requiring the client to sequentially request the lock from N independent Redis nodes. The lock is only considered acquired if the client successfully locks `(N/2)+1` majority nodes.

</details>

## 10. Outbox Pattern — Reliable Event Publishing

```
  PROBLEM:
  ════════

  @Transactional
  public void createOrder(OrderRequest req) {
      Order order = new Order(req);
      orderRepo.save(order);                    // DB write
      kafkaTemplate.send("order-events", new OrderCreated(order));  // Kafka publish
  }

  What if DB commit succeeds but Kafka publish fails?
  → Order exists in DB but no event published → other services never know!

  What if Kafka publish succeeds but DB commit fails?
  → Event published but no order exists → downstream processes phantom data!

  You CANNOT have an atomic transaction across DB + Kafka.


  SOLUTION: TRANSACTIONAL OUTBOX
  ═══════════════════════════════

  Step 1: Write event to an OUTBOX TABLE in the SAME database transaction.

  @Transactional
  public void createOrder(OrderRequest req) {
      Order order = new Order(req);
      orderRepo.save(order);

      // Same transaction! Both succeed or both fail.
      OutboxEvent event = new OutboxEvent(
          "OrderCreated",
          objectMapper.writeValueAsString(new OrderCreatedEvent(order))
      );
      outboxRepo.save(event);
  }

  -- Outbox table:
  -- ┌────────────────────────────────────────────────────────────┐
  -- │ id │ event_type    │ payload          │ published │ created │
  -- ├────────────────────────────────────────────────────────────┤
  -- │ 1  │ OrderCreated  │ {"orderId":42,...}│ false     │ 10:30  │
  -- └────────────────────────────────────────────────────────────┘

  Step 2: Separate process reads unpublished events and sends to Kafka.

  OPTION A: Polling publisher (simplest)
  Every 1 second:
    SELECT * FROM outbox WHERE published = false ORDER BY created_at
    For each event: kafkaTemplate.send(event)
    If Kafka ACK: UPDATE outbox SET published = true WHERE id = ?

  OPTION B: CDC (Change Data Capture) — Debezium
  Reads database WAL (Write-Ahead Log)
  Detects INSERTs into outbox table
  Automatically publishes to Kafka
  No polling! Real-time! More complex to set up.


  ┌── Service ──────────┐     ┌── Outbox Table ──┐     ┌── Kafka ────────┐
  │                      │     │                   │     │                  │
  │ Save Order + Event   │────→│ OrderCreated      │     │                  │
  │ (SAME transaction)   │     │ published=false   │     │                  │
  │                      │     │                   │     │                  │
  └──────────────────────┘     │    ↓ Publisher    │────→│ order-events     │
                               │ published=true    │     │ topic            │
                               │                   │     │                  │
                               └───────────────────┘     └──────────────────┘

  GUARANTEES:
  • If DB transaction fails → no outbox event → nothing published → consistent
  • If publisher fails to send → event stays unpublished → retried → at-least-once
  • Consumer must be idempotent (may receive duplicates)
```

---

**Next Chapter**: [Performance Engineering →](Ch69_Performance_Engineering.md)

---

🔬 **Section Challenge — 10. Outbox Pattern — Reliable Event Publishing**

**Challenge 1 (System Design):** In the Transactional Outbox pattern, you write the business entity (Order) and the Event (OrderCreated) to the database in the same transaction. A background publisher reads the Outbox table and publishes to Kafka. Why must the Kafka Consumer on the other end be built to be completely Idempotent?

<details><summary>Answer</summary>

Because of the **At-Least-Once** delivery guarantee. If the background publisher successfully sends the message to Kafka, but its server crashes _before_ it can update the `published = true` flag in the database, it will restart, read the table, and publish the exact same event again. The consumer is guaranteed to see every message _at least once_, but will likely see duplicates during failure recoveries.

</details>


---

## Reality Check

**"Distributed systems are just networked applications"** — The fallacies of distributed computing are not theoretical: the network IS unreliable (packets drop), latency IS nonzero (cross-region calls take 60-200ms), bandwidth IS limited (serializing large objects saturates links), and the network IS insecure (man-in-the-middle without mTLS). Every remote call can fail in ways local calls cannot: timeout, partial failure, duplicate delivery, and out-of-order messages.

**"Idempotency is just handling duplicate requests"** — Idempotency means the EFFECT of a repeated operation is the same as doing it once. For a payment endpoint, idempotency requires: storing the idempotency key with the result, checking for existing results before processing, and returning the cached result for duplicates. Without this, a network timeout causes the client to retry, and the customer is charged twice. Idempotency is a correctness requirement, not an optimization.

**"CAP theorem means choose two of three"** — CAP is more nuanced: in the ABSENCE of a network partition, you can have both consistency and availability. The choice between C and A only matters DURING a partition. Most systems are CP (reject requests during partition to stay consistent) or AP (serve potentially stale data during partition to stay available). But partitions are rare — the real tradeoff in practice is between consistency and LATENCY (the PACELC theorem).

**"Leader election is a solved problem"** — Leader election algorithms (Raft, Paxos, ZAB) are proven correct but their implementations have edge cases: clock skew causing split-brain, network partitions causing multiple leaders, and slow followers causing leader re-election storms. Even using a coordination service like ZooKeeper or etcd, your application must handle: becoming leader mid-operation, losing leadership while holding locks, and the window between losing leadership and detecting it.

**"Retry with exponential backoff handles all transient failures"** — Exponential backoff prevents overwhelming a recovering service, but without jitter (randomization), all clients retry at the same exponential intervals creating thundering herd spikes. Also, retrying is only safe for IDEMPOTENT operations — retrying a non-idempotent payment creates duplicate charges. And retrying indefinitely keeps connections open, eventually exhausting connection pools. Set a maximum retry count and a circuit breaker.
