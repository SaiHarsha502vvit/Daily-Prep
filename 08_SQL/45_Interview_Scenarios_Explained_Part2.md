# Chapter 45 — Interview-Grade Scenario Explanations Part 2: Concurrency, Transactions & Locks

> **What:** 10+ advanced scenarios explained with senior-level precision — covering the hardest interview topics: deadlocks, race conditions, isolation levels, distributed transactions
> **Why These Matter:** Concurrency questions separate mid-level from senior engineers in interviews. If you can explain deadlocks and isolation levels with real examples, you're immediately in the top 10%.

---

## 📋 Scenarios in This File

| # | Scenario | Interview Trigger |
|---|----------|-------------------|
| S11 | Deadlock Between Two Transactions | "Explain how deadlocks happen and how you'd prevent them" |
| S12 | Lost Update / Read-Modify-Write Race | "How do you handle concurrent updates?" |
| S13 | Phantom Reads in Financial Reports | "Explain isolation levels with real examples" |
| S14 | Long Transaction Blocking Schema Migration | "How do you run migrations in production?" |
| S15 | Distributed Transaction Failure | "How do you maintain consistency across microservices?" |
| S16 | Optimistic vs Pessimistic Locking | "When do you use optimistic vs pessimistic locking?" |
| S17 | Queue Table Hot Row (Counter) | "How do you implement a job queue in the database?" |
| S18 | Gap Lock Surprises in MySQL | "Have you dealt with unexpected locking behavior?" |
| S19 | Connection Leak (Unreturned Connections) | "What causes intermittent connection timeouts?" |
| S20 | Retry Storm After Partial Failure | "How do you handle retries without causing cascading failures?" |

---




## S11: Deadlock Between Two Transactions

### 🎤 Interview Question
> "Explain how deadlocks happen and what you'd do to prevent them."

### ✅ Professional Answer

"A deadlock occurs when two or more transactions each hold a lock that the other needs, creating a circular wait. The database detects this within seconds and kills one transaction (the 'victim') to break the cycle.

**Here's a concrete example:**"

```sql
-- Transaction A (Transfer money: Alice → Bob)
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;  -- Locks row 1
-- <pause — waiting for Transaction B to release row 2>
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;  -- BLOCKED! B holds this

-- Transaction B (Transfer money: Bob → Alice) — simultaneous
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE user_id = 2;   -- Locks row 2
-- <pause — waiting for Transaction A to release row 1>
UPDATE accounts SET balance = balance + 50 WHERE user_id = 1;   -- BLOCKED! A holds this

-- DEADLOCK! A waits for B, B waits for A → Circular dependency
-- PostgreSQL: ERROR: deadlock detected
-- One transaction is rolled back automatically
```

"**The classic prevention strategy is consistent lock ordering.** If all transactions always lock lower user IDs before higher ones, cicrcular waits become impossible:"

```java
// SOLUTION: Always lock in a consistent order
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // Determine lock order: always lock lower ID first
    Long firstLock = Math.min(fromId, toId);
    Long secondLock = Math.max(fromId, toId);
    
    // Acquire locks in deterministic order
    Account first = accountRepo.findByIdForUpdate(firstLock);   // SELECT ... FOR UPDATE
    Account second = accountRepo.findByIdForUpdate(secondLock);
    
    // Now perform the transfer
    if (fromId.equals(firstLock)) {
        first.setBalance(first.getBalance().subtract(amount));
        second.setBalance(second.getBalance().add(amount));
    } else {
        second.setBalance(second.getBalance().subtract(amount));
        first.setBalance(first.getBalance().add(amount));
    }
}
```

### 📚 Theory Deep-Dive

```
Deadlock Conditions (all 4 must be present — Coffman conditions):
1. MUTUAL EXCLUSION: Resource (row lock) held exclusively
2. HOLD AND WAIT: Transaction holds lock while waiting for another
3. NO PREEMPTION: Locks can't be forcibly taken from a transaction
4. CIRCULAR WAIT: A→B→A dependency chain

Break ANY one condition → deadlocks impossible:
- Break #4 (Circular Wait): Consistent lock ordering ← MOST COMMON FIX
- Break #2 (Hold and Wait): Acquire all locks upfront (SELECT FOR UPDATE all rows first)
- Break #1: Use optimistic concurrency instead of locks

Deadlock Detection:
- Database maintains a WAIT-FOR GRAPH
- Nodes = transactions, edges = "waiting for"
- Periodically checks for CYCLES in the graph
- PostgreSQL: checks every deadlock_timeout (default 1 second)
- MySQL InnoDB: checks after every lock wait
- If cycle found → kill the transaction with least work done
```

### 🔄 Variants

**Variant A: Application-level deadlock (not database)**
```java
// Thread 1:
synchronized(lockA) {
    synchronized(lockB) { /* work */ }
}
// Thread 2:
synchronized(lockB) {
    synchronized(lockA) { /* work */ }  // DEADLOCK in application layer!
}

// Same fix: consistent ordering
// Always acquire lockA before lockB
```

**Variant B: Multi-table deadlock**
```sql
-- Transaction 1: INSERT order → UPDATE inventory
INSERT INTO orders (...);                    -- Lock on orders table
UPDATE inventory SET stock = stock - 1 ...;  -- Waiting for inventory lock

-- Transaction 2: UPDATE inventory → INSERT order
UPDATE inventory SET stock = stock - 1 ...;  -- Lock on inventory
INSERT INTO orders (...);                     -- Waiting for orders lock

-- Fix: Both transactions should follow same table order
-- Always: inventory THEN orders, or always: orders THEN inventory
```

**Variant C: Interview follow-up — "How do you monitor deadlocks?"**
```sql
-- PostgreSQL: Enable deadlock logging
-- postgresql.conf: log_lock_waits = on, deadlock_timeout = 1s
-- Then check logs for: "deadlock detected"

-- MySQL: 
SHOW ENGINE INNODB STATUS;
-- Look for "LATEST DETECTED DEADLOCK" section
-- Shows exact queries and row locks involved
```

---



> 🔬 **Section Challenge — S11: Deadlock Between Two Transactions**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## S12: Lost Update (Read-Modify-Write Race Condition)

### 🎤 Interview Question
> "How do you handle concurrent updates to the same data?"

### ✅ Professional Answer

"The lost update problem is one of the trickiest concurrency bugs because it produces correct-looking results — you just silently lose data.

**The scenario:**"

```
Timeline:
T1: User A reads balance = 1000
T2: User B reads balance = 1000
T3: User A sets balance = 1000 - 200 = 800 ← A withdraws 200
T4: User B sets balance = 1000 - 300 = 700 ← B withdraws 300

RESULT: balance = 700
CORRECT: balance = 500 (1000 - 200 - 300)

User A's withdrawal was SILENTLY LOST because User B's write 
was based on a stale read.
```

"**Three solutions, each with different trade-offs:**"

```java
// SOLUTION 1: Optimistic Locking (preferred for low contention)
@Entity
public class Account {
    @Id private Long id;
    private BigDecimal balance;
    
    @Version  // JPA adds WHERE version = ? to every UPDATE
    private Long version;
}

// When User B tries to save with stale version:
// UPDATE accounts SET balance = 700, version = 6 WHERE id = 1 AND version = 5
// But User A already changed version to 6 → 0 rows updated → OptimisticLockException
// Application catches exception → reload → retry

// SOLUTION 2: Atomic UPDATE (no read-modify-write at all)
@Modifying
@Query("UPDATE Account a SET a.balance = a.balance - :amount WHERE a.id = :id AND a.balance >= :amount")
int withdraw(@Param("id") Long id, @Param("amount") BigDecimal amount);
// Returns 1 if succeeded, 0 if insufficient balance
// No race condition — database handles atomicity internally

// SOLUTION 3: Pessimistic Locking (for high contention)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT a FROM Account a WHERE a.id = :id")
Account findByIdForUpdate(@Param("id") Long id);
// Translates to: SELECT * FROM accounts WHERE id = 1 FOR UPDATE
// Other transactions BLOCK until this one commits
```

### 📚 Theory: Comparison Table

```
| Approach     | Contention | Throughput | Complexity | Use When            |
|-------------|-----------|-----------|-----------|---------------------|
| Optimistic  | Low       | High      | Medium    | Rare conflicts       |
| Atomic SQL  | Any       | Highest   | Low       | Simple operations    |
| Pessimistic | High      | Lower     | Low       | Frequent conflicts   |
| Serializable| Any       | Lowest    | Low       | Must be correct      |

Optimistic Locking: O(1) with retry
- First attempt: always succeeds in reading
- Conflict: retry loop — typically succeeds in 1-2 retries
- If contention > 10% of requests → switch to pessimistic

Pessimistic Locking: O(1) but with wait
- Guarantees exclusive access immediately
- Other threads wait (block) → throughput decreases linearly
- If holds locks > 100ms → danger of connection pool exhaustion

Atomic SQL: O(1) always
- Database handles everything in one operation
- No application-level concern about races
- Limited to simple arithmetic (can't do complex business logic)
```

### 🔄 Variants

**Variant A: Lost update in inventory management**
```java
// Two customers buy the last item simultaneously:
// Both read stock = 1
// Both compute 1 - 1 = 0
// Both update stock = 0
// Result: TWO customers charged for ONE item. 
// One order will fail at shipping.

// Fix with atomic update + check:
@Modifying
@Query("UPDATE Product p SET p.stock = p.stock - 1 WHERE p.id = :id AND p.stock > 0")
int decrementStock(@Param("id") Long id);
// Returns 0 if out of stock → application rejects the order
```

**Variant B: Lost update across microservices**
```java
// Service A and Service B both read user profile from User Service
// Both modify different fields (A changes email, B changes phone)
// Both send PUT /users/123 with full profile
// Last one wins → other's change is LOST

// Fix 1: PATCH instead of PUT (send only changed fields)
// Fix 2: ETag header for optimistic concurrency
// Fix 3: Event-sourcing (store events, not state)
```

---

## S13: Phantom Reads in Financial Reports

### 🎤 Interview Question
> "Explain isolation levels with a real production example."

### ✅ Professional Answer

"I'll use a real scenario. We had a financial reconciliation report that computed the sum of all transactions and compared it to account balances. Sometimes the numbers didn't match — not because of bugs, but because of phantom reads.

**What happened:**"

```sql
-- Transaction: Generate end-of-day report
BEGIN; -- READ COMMITTED isolation (default in PostgreSQL)

-- Step 1: Sum of all transactions
SELECT SUM(amount) FROM transactions WHERE date = '2025-07-24';
-- Result: 1,000,000

-- Meanwhile, another process inserts a new transaction:
-- INSERT INTO transactions (amount, date) VALUES (5000, '2025-07-24');

-- Step 2: Count of transactions
SELECT COUNT(*) FROM transactions WHERE date = '2025-07-24';
-- Now sees the NEW row! Result includes the 5000 transaction

-- SUM and COUNT are INCONSISTENT — report shows mismatched numbers
COMMIT;
```

"**This is a phantom read**: the same query returns different rows within the same transaction because a concurrent transaction inserted new rows. Under READ COMMITTED, each statement sees a new snapshot.

**The fix:**"

```sql
-- Use REPEATABLE READ (or SERIALIZABLE for strongest guarantee)
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT SUM(amount) FROM transactions WHERE date = '2025-07-24';
-- Snapshot taken here. ALL subsequent reads see this SAME snapshot.

-- Even if 1000 new rows are inserted by other transactions...
SELECT COUNT(*) FROM transactions WHERE date = '2025-07-24';
-- Returns the same set of rows as the first query. Consistent!

COMMIT;
```

### 📚 Theory: Isolation Levels Explained

```
| Level            | Dirty Read | Non-Repeatable Read | Phantom Read |
|-----------------|-----------|--------------------|--------------| 
| READ UNCOMMITTED | Possible  | Possible           | Possible     |
| READ COMMITTED   | ✗         | Possible           | Possible     |
| REPEATABLE READ  | ✗         | ✗                  | Possible*    |
| SERIALIZABLE     | ✗         | ✗                  | ✗            |

* PostgreSQL's REPEATABLE READ actually prevents phantoms too
  (it uses MVCC snapshot isolation, not traditional locking)

The Three Anomalies Explained:
1. DIRTY READ: See uncommitted data from another transaction
   → Other transaction might rollback → you acted on ghost data

2. NON-REPEATABLE READ: Read same row twice, get different values
   → Another transaction committed an UPDATE between your reads

3. PHANTOM READ: Run same query twice, get different ROWS
   → Another transaction committed an INSERT/DELETE between your queries

PostgreSQL MVCC Implementation:
- Each transaction gets a snapshot ID (xid) at start
- Each row has xmin (created by xid) and xmax (deleted by xid)
- Read only sees rows where: xmin < my_xid AND (xmax > my_xid OR xmax = 0)
- This is WHY PostgreSQL never locks for reads — it reads from its own snapshot
- Trade-off: Dead rows accumulate → VACUUM needed to reclaim space
```

### 🔄 Variants

**Variant A: Choosing isolation level in Spring Boot**
```java
// For financial reports (must be consistent):
@Transactional(isolation = Isolation.REPEATABLE_READ)
public FinancialReport generateDailyReport(LocalDate date) {
    BigDecimal totalDebits = txnRepo.sumDebits(date);
    BigDecimal totalCredits = txnRepo.sumCredits(date);
    long txnCount = txnRepo.countByDate(date);
    // All three queries see the SAME snapshot — guaranteed consistent
    return new FinancialReport(totalDebits, totalCredits, txnCount);
}

// For display-only data (doesn't need strict consistency):
@Transactional(isolation = Isolation.READ_COMMITTED)  // default
public List<Order> getRecentOrders() {
    return orderRepo.findRecent();  // Ok if slightly stale
}
```

**Variant B: Serialization failure handling**
```java
// SERIALIZABLE can throw serialization failures on conflict:
@Retryable(value = {SerializationFailureException.class}, maxAttempts = 3)
@Transactional(isolation = Isolation.SERIALIZABLE)
public void reconcile() {
    // If two serializable transactions conflict, one is aborted
    // Application MUST be prepared to retry
}
```

---




## S14: Long Transaction Blocking Schema Migration

### 🎤 Interview Question
> "How do you run database migrations in production without downtime?"

### ✅ Professional Answer

"Schema migrations are one of the riskiest production operations. I follow specific patterns to avoid downtime:

**The problem:** `ALTER TABLE` often requires a table-level lock. If a long-running transaction holds a lock, the ALTER waits. And every subsequent query also waits behind the ALTER. Queue builds up → timeout → outage.

```
Timeline:
T1: Long report query starts (SELECT on orders, takes 5 minutes)
T2: Migration runs: ALTER TABLE orders ADD COLUMN discount DECIMAL
    → Needs AccessExclusiveLock → WAITS for T1
T3: 500 normal queries arrive → ALL WAIT behind ALTER (lock queue)
T4: All 500 queries timeout → Application 502s
```

**My approach:**"

```sql
-- RULE 1: Set a lock timeout so ALTER doesn't queue forever
SET lock_timeout = '3s';  -- If can't acquire lock in 3 seconds, abort ALTER
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2);
-- If it fails: wait for quiet period, retry

-- RULE 2: For adding columns — use safe operations
-- Adding nullable column WITHOUT default: instant in PostgreSQL 11+
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2);  -- Instant! No rewrite!

-- Adding column WITH DEFAULT: instant in PostgreSQL 11+ (not in older versions!)
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;  -- Also instant!

-- RULE 3: For adding NOT NULL constraint — do it in stages
-- Stage 1: Add column nullable (instant)
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2);
-- Stage 2: Backfill data in batches
UPDATE orders SET discount = 0 WHERE discount IS NULL AND id BETWEEN 1 AND 100000;
UPDATE orders SET discount = 0 WHERE discount IS NULL AND id BETWEEN 100001 AND 200000;
-- ... repeat in small batches to avoid long locks
-- Stage 3: Add NOT NULL constraint with validation
ALTER TABLE orders ALTER COLUMN discount SET NOT NULL;

-- RULE 4: For adding index — use CONCURRENTLY
-- Regular: CREATE INDEX → locks writes for duration (minutes on big table)
-- Safe:   CREATE INDEX CONCURRENTLY → no lock, runs in background
CREATE INDEX CONCURRENTLY idx_orders_discount ON orders (discount);
-- Takes longer but doesn't block anything
```

### 📚 Theory

```
Lock Queue Problem:
PostgreSQL processes locks in FIFO order.
If ALTER is waiting for a lock, all subsequent queries wait behind it.

     T1 holds → [ShareLock]
     ALTER waits → needs [AccessExclusiveLock]
     Q1 waits behind ALTER  ← can't skip ahead even though Q1 is compatible with T1
     Q2 waits behind Q1
     Q3 waits behind Q2
     ...500 queries queued = connection pool exhausted = outage

This is WHY set lock_timeout is critical — fail fast, don't queue.

PostgreSQL 11+ "Virtual Column" Trick:
- ADD COLUMN with DEFAULT used to require rewriting every row
- Now it stores the default in the catalog → reads return default for NULL
- Makes ADD COLUMN instant regardless of table size
- The "virtual" default is applied at read time until rows are updated
```

---



> 🔬 **Section Challenge — S14: Long Transaction Blocking Schema Migration**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## S15: Distributed Transaction Failure (Saga Pattern)

### 🎤 Interview Question
> "How do you maintain data consistency across microservices?"

### ✅ Professional Answer

"In a monolith, you wrap everything in a single database transaction and it either all succeeds or all rolls back. In microservices, you can't do that — each service has its own database. The standard solution is the Saga pattern.

**The problem:**"

```
Order flow across services:
1. Order Service:     Create order        (order DB)
2. Payment Service:   Charge customer     (payment DB)  
3. Inventory Service: Reserve stock       (inventory DB)

What if Payment succeeds but Inventory fails?
- Can't rollback Payment from Inventory service
- Can't use a single transaction across databases
- Result without Saga: customer charged but order not fulfilled
```

"I've implemented two types of sagas:

**Orchestration Saga** (central coordinator):"

```java
// OrderSagaOrchestrator — knows the entire flow
@Service
public class OrderSagaOrchestrator {
    
    public OrderResult createOrder(OrderRequest request) {
        String sagaId = UUID.randomUUID().toString();
        
        try {
            // Step 1: Create order (pending)
            Order order = orderService.createPending(request, sagaId);
            
            // Step 2: Reserve payment
            PaymentReservation payment = paymentService.reserve(order);
            
            // Step 3: Reserve inventory
            InventoryReservation inventory = inventoryService.reserve(order);
            
            // Step 4: Confirm all
            orderService.confirm(order.getId());
            paymentService.confirm(payment.getId());
            inventoryService.confirm(inventory.getId());
            
            return OrderResult.success(order);
            
        } catch (InventoryException e) {
            // Inventory failed → compensate payment
            paymentService.refund(sagaId);
            orderService.cancel(sagaId, "Out of stock");
            return OrderResult.failed("Out of stock");
            
        } catch (PaymentException e) {
            // Payment failed → only need to cancel order
            orderService.cancel(sagaId, "Payment failed");
            return OrderResult.failed("Payment declined");
        }
    }
}
```

**Choreography Saga** (event-driven, no coordinator):"

```java
// Each service listens for events and reacts:
// Order Service publishes → OrderCreatedEvent
// Payment Service listens → charges customer → publishes PaymentCompletedEvent
// Inventory Service listens → reserves stock → publishes StockReservedEvent
// Order Service listens → confirms order

// If Inventory fails:
// Inventory publishes → StockReservationFailedEvent
// Payment Service listens → refunds customer → publishes PaymentRefundedEvent
// Order Service listens → cancels order

@EventListener
public void handleStockReservationFailed(StockReservationFailedEvent event) {
    paymentService.refund(event.getSagaId());  // Compensating transaction
}
```

### 📚 Theory

```
Orchestration vs Choreography:

| Aspect       | Orchestration          | Choreography           |
|-------------|----------------------|----------------------|
| Flow control| Central coordinator   | Distributed (events)  |
| Coupling    | All services known   | Loosely coupled        |
| Debugging   | Easy — single place  | Hard — trace events    |
| Complexity  | Simple if few steps  | Better for many services|
| Failure     | Easy to handle       | Need correlation IDs   |

When to use which:
- ≤ 5 services in saga → Orchestration (simpler, debuggable)
- > 5 services → Choreography (avoids God orchestrator)
- Financial transactions → Orchestration (easier to audit)

Idempotency is CRITICAL in sagas:
Each compensating action must be idempotent because:
- Network failures → retries → same action executes multiple times
- "Refund order #123" must be safe to call 3 times
- Achieve with: idempotency key on every operation
  INSERT INTO refunds (saga_id, amount) 
  ON CONFLICT (saga_id) DO NOTHING;  -- Second call is harmless
```

---



> 🔬 **Section Challenge — S15: Distributed Transaction Failure (Saga Pattern)**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## S16: Optimistic vs Pessimistic Locking (Deep Dive)

### 🎤 Interview Question
> "When would you choose optimistic vs pessimistic locking?"

### ✅ Professional Answer

"The choice depends on the contention level — how likely it is that two transactions will modify the same row at the same time.

**My decision framework:**"

```
LOW contention (< 5% conflict rate):
→ Optimistic Locking
→ Example: User editing their own profile (unlikely two sessions edit same profile)
→ Higher throughput — no locks held, no waiting

HIGH contention (> 20% conflict rate):
→ Pessimistic Locking
→ Example: Limited inventory item (flash sale, concert tickets)
→ Guaranteed success — no retry loop, no wasted work

MEDIUM contention (5-20%):
→ Optimistic with bounded retries + fallback to pessimistic
→ Example: Order processing with moderate traffic
```

```java
// Optimistic with bounded retry + fallback:
public void updateStock(Long productId, int quantity) {
    for (int attempt = 0; attempt < 3; attempt++) {
        try {
            optimisticStockUpdate(productId, quantity);
            return;  // Success
        } catch (OptimisticLockException e) {
            if (attempt == 2) {
                // 3 failures → contention is high, use pessimistic
                pessimisticStockUpdate(productId, quantity);
                return;
            }
            // Brief random backoff before retry
            Thread.sleep(ThreadLocalRandom.current().nextInt(10, 50));
        }
    }
}
```

---




## S17: Queue Table Hot Row Problem

### 🎤 Interview Question
> "How would you implement a reliable job queue using a database?"

### ✅ Professional Answer

```sql
-- NAIVE approach: Single counter row for "next job"
UPDATE job_counter SET next_id = next_id + 1 RETURNING next_id;
-- EVERY worker hits this ONE row → serialized → bottleneck

-- BETTER: Use SKIP LOCKED (PostgreSQL 9.5+ / MySQL 8.0+)
-- Each worker grabs the next available job WITHOUT blocking others

-- Worker picks up a job:
BEGIN;
SELECT id, payload FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;  -- Skip rows already locked by other workers

-- Process the job...
UPDATE jobs SET status = 'processing', worker_id = 'worker-3', 
               started_at = NOW()
WHERE id = <selected_id>;
COMMIT;

-- SKIP LOCKED is the key: 
-- Worker A locks row 1
-- Worker B skips row 1, grabs row 2
-- Worker C skips rows 1&2, grabs row 3
-- No contention, no waiting, parallel processing!
```

```java
// Spring Boot implementation:
@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    
    @Query(value = "SELECT * FROM jobs WHERE status = 'pending' " +
                   "ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    Optional<Job> findNextPendingJob();
}

@Transactional
public void processNextJob(String workerId) {
    jobRepository.findNextPendingJob().ifPresent(job -> {
        job.setStatus("processing");
        job.setWorkerId(workerId);
        job.setStartedAt(Instant.now());
        
        try {
            jobProcessor.process(job);
            job.setStatus("completed");
        } catch (Exception e) {
            job.setStatus("failed");
            job.setErrorMessage(e.getMessage());
            job.setRetryCount(job.getRetryCount() + 1);
        }
        job.setCompletedAt(Instant.now());
    });
}
```

---

## S18: Gap Lock Surprises in MySQL InnoDB

### 🎤 Interview Question
> "Have you encountered unexpected locking behavior?"

### ✅ Professional Answer

"Yes — MySQL's InnoDB uses gap locks under REPEATABLE READ, which can lock ranges of rows that don't even exist yet:

```sql
-- Table has rows with id: 1, 5, 10, 15
-- Transaction A:
SELECT * FROM items WHERE id > 5 AND id < 15 FOR UPDATE;
-- Locks: row 10 + GAP between 5-15
-- This means: you cannot INSERT id=7, id=8, id=12 etc.

-- Transaction B:
INSERT INTO items (id, name) VALUES (8, 'Widget');
-- BLOCKS! Even though row 8 doesn't exist.
-- Because Transaction A's range lock covers the gap (5..15)
```

**Why this matters:** An innocent-looking range SELECT can block inserts on rows that don't exist, leading to unexpected deadlocks and performance issues.

**Solutions:**
1. Use READ COMMITTED isolation (disables gap locks — trade phantom reads)
2. Reduce range of FOR UPDATE queries (narrow the gap)
3. Use PostgreSQL (uses MVCC, no gap locks)"

---




## S19: Connection Leak (Unreturned Connections)

### 🎤 Interview Question
> "What causes intermittent connection timeouts that are hard to reproduce?"

### ✅ Professional Answer

```java
// The SUBTLE bug:
public User getUser(Long id) throws SQLException {
    Connection conn = dataSource.getConnection();
    PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
    ps.setLong(1, id);
    ResultSet rs = ps.executeQuery();
    if (rs.next()) {
        return mapUser(rs);  // If this throws an exception...
    }
    conn.close();  // ...this line is NEVER reached → connection leaked!
    return null;
}

// Each leaked connection stays in the pool as "active"
// After days/weeks: all connections leaked → pool exhausted → timeout

// THE FIX: try-with-resources (ALWAYS)
public User getUser(Long id) throws SQLException {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?")) {
        ps.setLong(1, id);
        try (ResultSet rs = ps.executeQuery()) {
            return rs.next() ? mapUser(rs) : null;
        }
    }  // Connection ALWAYS returned — even if exception thrown
}

// In Spring Boot: Use JdbcTemplate or JPA — they handle connection lifecycle
// But WATCH OUT for @Transactional with exceptions:
@Transactional
public void riskyMethod() {
    repo.save(entity);
    externalApi.call();  // If this throws RuntimeException...
    // Spring rolls back AND returns connection — but only for unchecked exceptions
    // Checked exceptions DON'T trigger rollback by default!
    // Fix: @Transactional(rollbackFor = Exception.class)
}
```

### 📚 Detection

```java
// HikariCP leak detection:
spring:
  datasource:
    hikari:
      leak-detection-threshold: 30000  # 30 seconds
      # If a connection is out of the pool for > 30s, log a warning with stack trace
      # The stack trace shows EXACTLY where the connection was borrowed
```

---

## S20: Retry Storm After Partial Failure

### 🎤 Interview Question
> "How do you handle retries without causing cascading failures?"

### ✅ Professional Answer

"Naive retries are one of the most dangerous patterns in distributed systems. If a service is struggling to handle 100 requests/second and each failed request is retried 3 times, the service now faces 400 requests/second — 4x the load during a period when it's already struggling.

**The safe retry strategy:**"

```java
// DANGEROUS: Immediate retry
for (int i = 0; i < 3; i++) {
    try { return callService(); } catch (Exception e) { /* retry */ }
}

// SAFE: Exponential backoff + jitter + circuit breaker
@Retryable(
    value = {TransientException.class},  // Only retry transient errors
    maxAttempts = 3,
    backoff = @Backoff(
        delay = 100,       // First retry after 100ms
        multiplier = 2.0,  // Second: 200ms, Third: 400ms
        maxDelay = 5000    // Cap at 5 seconds
    )
)
public OrderResult callPaymentService(Order order) {
    return paymentClient.charge(order);
}

// EVEN BETTER: Add jitter to prevent thundering herd
private long calculateBackoff(int attempt) {
    long baseDelay = (long) Math.pow(2, attempt) * 100;  // 100, 200, 400...
    long jitter = ThreadLocalRandom.current().nextLong(0, baseDelay);
    return Math.min(baseDelay + jitter, 5000);  // Random between [base, 2*base]
}

// BEST: Circuit breaker stops retries entirely when service is down
@CircuitBreaker(
    name = "paymentService",
    failureRateThreshold = 50,   // Open circuit at 50% failure rate
    waitDurationInOpenState = Duration.ofSeconds(30),
    slidingWindowSize = 10
)
public OrderResult callPaymentService(Order order) {
    return paymentClient.charge(order);
}
// After 5/10 failures: circuit OPENS → all calls fail-fast for 30s
// No retries, no load on the failing service
// After 30s: circuit half-opens → allows 1 test request
// If test succeeds: circuit closes → normal operation resumes
```

### 📚 Theory

```
Retry Amplification:
- Service handles 100 req/s normally
- Service starts failing 50% of requests
- With 3 retries: 100 + 50 + 25 = 175 req/s actual load
- Service now fails 80%
- With 3 retries: 100 + 80 + 64 = 244 req/s actual load
- Service now fails 95%...
- CASCADING FAILURE — the retries CAUSE the outage to worsen

Circuit Breaker States:
  CLOSED ─────(failures > threshold)──→ OPEN
    ↑                                      │
    │                                (timeout period)
    │                                      ↓
    └──────(test succeeds)────────── HALF-OPEN
                                    (test fails → back to OPEN)

Strategy Comparison:
| Pattern              | Protection Level | Complexity |
|---------------------|:----------------:|:----------:|
| No retry            | None             | Trivial    |
| Immediate retry     | Negative (worse) | Low        |
| Exponential backoff | Medium           | Low        |
| Backoff + jitter    | Good             | Medium     |
| Circuit breaker     | Excellent        | Medium     |
| Bulkhead + CB       | Best             | High       |
```

---

## 🧠 Concurrency Interview Cheat Sheet

| Concept | One-Liner for Interview | When to Mention |
|---------|------------------------|-----------------|
| Deadlock | "Circular wait between transactions — prevented by consistent lock ordering" | Any concurrency question |
| Lost update | "Stale read → blind write — fixed with optimistic locking or atomic SQL" | Data integrity questions |
| Phantom read | "Same query, different rows — fixed with REPEATABLE READ" | Isolation level questions |
| SKIP LOCKED | "Worker queue pattern — each worker grabs next unlocked row" | Queue/worker design questions |
| Circuit breaker | "Fail-fast pattern — stops retry storms during outages" | Resilience/microservice questions |
| Saga pattern | "Distributed compensation — each step has a reverse operation" | Microservice consistency questions |
| Connection leak | "Unreturned connections — always use try-with-resources" | Intermittent timeout questions |

---

[⬅ Previous: 44_Interview_Scenarios_Part1](44_Interview_Scenarios_Explained_Part1.md) | [📚 Index](00_INDEX.md) | [Next: 46_Interview_Scenarios_Part3 ➡](46_Interview_Scenarios_Explained_Part3.md)
