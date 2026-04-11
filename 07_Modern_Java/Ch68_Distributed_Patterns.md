> **Navigation**: [< Previous](Ch67_Kubernetes_Deep_Dive.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch69_Performance_Engineering.md)

# 🌐 Chapter 42 — Distributed Patterns & Consensus: How Systems Agree

> **"If 5 database replicas receive a write, how do they agree on the order? If a network partition splits your cluster in half, which half keeps accepting writes? These questions define distributed systems — and the answers are Raft, Paxos, 2PC, and the patterns built on top of them."**

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



> 🔬 **Section Challenge — 3. Two-Phase Commit (2PC) — Distributed Transactions**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

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



> 🔬 **Section Challenge — 4. Consistent Hashing — How Data Is Distributed**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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



> 🔬 **Section Challenge — 5. Leader Election — Who's in Charge**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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



> 🔬 **Section Challenge — 6. CRDT — Conflict-Free Replicated Data Types**
>
> **Challenge 1 (Reasoning):** You write `List<String> list = new ArrayList<>();`. At runtime, can you check `list instanceof List<String>`?
> <details><summary>Answer</summary>
>
> No — `instanceof List<String>` is a compile error. After erasure, it's just `List` at runtime. Use `instanceof List<?>` for an unparameterized check. This is why you can't do `new T()`, `new T[]`, or `T.class` — T doesn't exist at runtime.
> </details>
>
> **Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?
> <details><summary>Answer</summary>
>
> NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.
> </details>
>

## 7. Circuit Breaker — Failing Fast and Recovering

```
  PROBLEM: Service B is down. Service A keeps calling it.
  100 requests → 100 timeouts → 100 × 30s = 50 minutes of wasted threads!
  
  
  CIRCUIT BREAKER STATE MACHINE:
  ══════════════════════════════
  
  ┌──────────┐   failure threshold   ┌──────────┐   timeout    ┌───────────┐
  │  CLOSED   │ ──────────────────→ │   OPEN    │ ──────────→ │ HALF-OPEN │
  │ (normal)  │        reached       │ (fail     │    expires   │ (testing)  │
  │           │ ←──────────────────  │  fast)    │ ←────────── │           │
  └──────────┘   success in          └──────────┘   failure     └───────────┘
                 half-open                           in test       │
                                                                   │ success
                                                                   ▼
                                                            Back to CLOSED
  
  
  CLOSED (normal operation):
  ├── Requests pass through to Service B
  ├── Track failure count
  └── If failures > threshold (e.g., 5 in 10 seconds) → OPEN
  
  OPEN (circuit tripped):
  ├── ALL requests immediately fail (no call to Service B!)
  ├── Return fallback response or error
  └── After timeout (e.g., 60 seconds) → HALF-OPEN
  
  HALF-OPEN (testing recovery):
  ├── Allow ONE request through
  ├── If succeeds → CLOSED (recovered!)
  └── If fails → OPEN (still broken, reset timeout)
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



> 🔬 **Section Challenge — 7. Circuit Breaker — Failing Fast and Recovering**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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



> 🔬 **Section Challenge — 8. Idempotency — Safe Retries in Distributed Systems**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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



> 🔬 **Section Challenge — 9. Distributed Locking — Mutual Exclusion Across Services**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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

> **Next Chapter**: [Performance Engineering →](Ch69_Performance_Engineering.md)

---



> 🔬 **Section Challenge — 10. Outbox Pattern — Reliable Event Publishing**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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

