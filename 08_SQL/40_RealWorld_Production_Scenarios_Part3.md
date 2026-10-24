# Chapter 40 — Real-World Production Scenarios Part 3: Concurrency, Transactions & Data Integrity

- **What:** 25 real-world concurrency disasters (Scenarios 51–75) with 5W-H + fixes
- **Why:** Race conditions, deadlocks, and data corruption are the hardest bugs to reproduce and fix
- **Where:** Every multi-user system — e-commerce, banking, SaaS, ticketing
- **How:** Understand the failure → SQL/backend fix → DSA insight

---

## 📋 Scenario Master Index (Part 3: Scenarios 51–75)

| #   | Scenario                                           | Category        |
| --- | -------------------------------------------------- | --------------- |
| 51  | Double-spend: two threads deduct same balance      | Race Condition  |
| 52  | Overselling: 100 people buy the last 1 item        | Race Condition  |
| 53  | Lost update: two users edit same record            | Race Condition  |
| 54  | Deadlock: two transactions waiting on each other   | Deadlock        |
| 55  | Phantom read: row appears mid-transaction          | Isolation       |
| 56  | Non-repeatable read: same query, different results | Isolation       |
| 57  | Dirty read: seeing uncommitted changes             | Isolation       |
| 58  | Write skew: constraint violated across rows        | Anomaly         |
| 59  | Long-running transaction blocking all writes       | Lock Contention |
| 60  | Bulk UPDATE holding millions of row locks          | Lock            |
| 61  | Dual-write inconsistency: DB + cache out of sync   | Distributed     |
| 62  | Idempotency failure: duplicate payment processed   | Distributed     |
| 63  | Read-your-own-writes with replicas                 | Distributed     |
| 64  | Eventually consistent counter going negative       | Distributed     |
| 65  | Saga pattern failure: partial hotel+flight booking | Distributed     |
| 66  | Optimistic lock retry storm                        | Concurrency     |
| 67  | Batch job conflicting with OLTP traffic            | Concurrency     |
| 68  | Auto-vacuum blocked by long transaction            | PostgreSQL      |
| 69  | Gap lock causing unexpected blocks (MySQL)         | Lock            |
| 70  | Serialization failure in SSI (PostgreSQL)          | Isolation       |
| 71  | Queue table hot row contention                     | Concurrency     |
| 72  | Trigger cascade causing unexpected locks           | Lock            |
| 73  | Constraint violation in concurrent INSERT          | Race Condition  |
| 74  | Clock skew in distributed timestamp ordering       | Distributed     |
| 75  | Connection leak: transactions never committed      | Resource Leak   |

---

## Scenario 51: Double-Spend — Two Threads Deduct the Same Balance

### 🔴 The Incident

User has $100 balance. Two concurrent requests each deduct $80. Both pass the `IF balance >= amount` check. Final balance: -$60.

### 5W-H Analysis

| Question  | Answer                                                                         |
| --------- | ------------------------------------------------------------------------------ |
| **What**  | Race condition: both threads read balance=100, both see 100 >= 80, both deduct |
| **Why**   | No locking on the balance row; read-check-write is NOT atomic                  |
| **When**  | Under concurrent requests: double-click, network retry, microservice retry     |
| **Where** | Wallet systems, payment processing, inventory, credit systems                  |
| **Who**   | Devs who think "SELECT then UPDATE" is safe                                    |
| **How**   | SELECT FOR UPDATE, or atomic UPDATE with WHERE check                           |

### SQL Solutions

```sql
-- BAD: Read-check-write (NOT SAFE)
-- Thread A: SELECT balance FROM wallets WHERE user_id = 1;  → 100
-- Thread B: SELECT balance FROM wallets WHERE user_id = 1;  → 100
-- Thread A: UPDATE wallets SET balance = balance - 80 WHERE user_id = 1;  → 20
-- Thread B: UPDATE wallets SET balance = balance - 80 WHERE user_id = 1;  → -60!

-- FIX 1: Atomic UPDATE with condition (simplest, fastest)
UPDATE wallets
SET balance = balance - 80
WHERE user_id = 1 AND balance >= 80;
-- Returns rows_affected: 1 (success) or 0 (insufficient funds)
-- No race condition — database does read+check+write atomically

-- FIX 2: SELECT FOR UPDATE (explicit pessimistic lock)
BEGIN;
SELECT balance FROM wallets WHERE user_id = 1 FOR UPDATE;
-- Thread B blocks HERE until Thread A commits
-- Only ONE thread at a time can read this row
UPDATE wallets SET balance = balance - 80 WHERE user_id = 1;
COMMIT;

-- FIX 3: SERIALIZABLE isolation (strictest, auto-detects conflicts)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT balance FROM wallets WHERE user_id = 1;
-- ... business logic ...
UPDATE wallets SET balance = balance - 80 WHERE user_id = 1;
COMMIT;
-- If conflict detected: ERROR: could not serialize access
-- Application must RETRY

-- Track all balance changes for audit
CREATE TABLE balance_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,  -- Positive = credit, negative = debit
    balance_after DECIMAL(10,2) NOT NULL,
    tx_reference VARCHAR(50) UNIQUE NOT NULL,  -- Idempotency key
    created_at TIMESTAMP DEFAULT NOW()
);

-- The complete safe debit operation:
WITH debit AS (
    UPDATE wallets
    SET balance = balance - 80
    WHERE user_id = 1 AND balance >= 80
    RETURNING user_id, balance
)
INSERT INTO balance_transactions (user_id, amount, balance_after, tx_reference)
SELECT user_id, -80, balance, 'TXN-2025-abc123'
FROM debit;
-- Atomic: either BOTH succeed or NEITHER does
```

### Spring Boot Solution

```java
@Service
public class WalletService {

    @Autowired
    private JdbcTemplate jdbc;

    @Transactional
    public boolean debit(Long userId, BigDecimal amount, String txReference) {
        // Atomic UPDATE with balance check — no race condition
        int rows = jdbc.update(
            "UPDATE wallets SET balance = balance - ? " +
            "WHERE user_id = ? AND balance >= ?",
            amount, userId, amount
        );

        if (rows == 0) {
            throw new InsufficientFundsException("Balance too low for debit: " + amount);
        }

        // Record transaction
        jdbc.update(
            "INSERT INTO balance_transactions (user_id, amount, balance_after, tx_reference) " +
            "VALUES (?, ?, (SELECT balance FROM wallets WHERE user_id = ?), ?)",
            userId, amount.negate(), userId, txReference
        );

        return true;
    }
}
```

### DSA Connection

- **Race condition** = Two threads modifying shared variable without mutex
- **Atomic UPDATE** = Compare-and-Swap (CAS) instruction — CPU-level atomicity
- **SELECT FOR UPDATE** = Mutex lock on a resource
- **Balance ledger** = Append-only log (event sourcing)

---

🔬 **Section Challenge — Scenario 51: Double-Spend — Two Threads Deduct the Same Balance**

**Challenge 1 (Reasoning):** FIX 1 (the atomic `UPDATE ... WHERE balance >= 80`) and FIX 2 (`SELECT ... FOR UPDATE` followed by a separate `UPDATE`) both correctly prevent the double-spend. Which should you prefer for a simple debit, and when do you actually need FIX 2 instead?

<details><summary>Answer</summary>

Prefer FIX 1 whenever the business logic fits in a single WHERE condition — it's one round-trip, and it holds a row lock for only the duration of the UPDATE itself. There's no separate SELECT for another transaction to race against, because the database does the read, the check, and the write as one atomic operation. FIX 2 (SELECT FOR UPDATE) earns its extra cost only when the validation genuinely can't be expressed in a single UPDATE's WHERE clause — checking conditions across multiple tables, running application-code logic between the read and the write, or needing to lock several rows before deciding what to write to any of them (exactly the situation Scenario 52's FIX 2 shows: `stock >= quantity AND customer_orders < max_per_customer`). FIX 2 holds its lock across a full round trip to the application and back, which is strictly worse than FIX 1 whenever FIX 1's simpler form is possible.

</details>

## Scenario 52: Overselling — 100 People Buy the Last 1 Item

### 🔴 The Incident

Flash sale: 1 item left in stock. 100 concurrent requests all read `stock = 1`, all pass the check, all create orders. 100 orders for 1 item.

### SQL Solutions

```sql
-- BAD: Check-then-update (race condition)
SELECT stock FROM products WHERE id = 42;  -- stock = 1
-- 100 threads all see stock = 1
UPDATE products SET stock = stock - 1 WHERE id = 42;  -- stock = -99!

-- FIX 1: Atomic decrement with check
UPDATE products
SET stock = stock - 1
WHERE id = 42 AND stock >= 1
RETURNING stock;
-- Only ONE thread gets rows_affected = 1; the other 99 get 0

-- FIX 2: SELECT FOR UPDATE (for complex validation)
BEGIN;
SELECT stock, price, max_per_customer
FROM products WHERE id = 42 FOR UPDATE;
-- All other threads WAIT here

-- Complex validation that can't fit in a single UPDATE
IF stock >= quantity AND customer_orders < max_per_customer THEN
    UPDATE products SET stock = stock - quantity WHERE id = 42;
    INSERT INTO orders (...) VALUES (...);
END IF;
COMMIT;

-- FIX 3: Advisory lock (PostgreSQL — application-level locks)
SELECT pg_advisory_xact_lock(42);  -- Lock on product_id 42
-- Lock automatically released at transaction end, lighter than row lock

-- FIX 4: Optimistic locking with version column
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 42 AND stock >= 1 AND version = 7;
-- If another thread updated first, version changed → 0 rows affected → retry
```

### Spring Boot Optimistic Lock with Retry

```java
@Entity
public class Product {
    @Id
    private Long id;
    private int stock;

    @Version  // JPA optimistic locking
    private int version;
}

@Service
public class OrderService {

    @Retryable(value = OptimisticLockException.class, maxAttempts = 3)
    @Transactional
    public Order placeOrder(Long productId, int quantity) {
        Product product = productRepo.findById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found"));

        if (product.getStock() < quantity) {
            throw new OutOfStockException("Only " + product.getStock() + " left");
        }

        product.setStock(product.getStock() - quantity);
        productRepo.save(product);  // @Version check happens here
        // If version mismatch → OptimisticLockException → @Retryable retries

        return orderRepo.save(new Order(productId, quantity));
    }
}
```

---

## Scenario 53: Lost Update — Two Users Edit Same Record

### 🔴 The Incident

User A opens a profile page (version 5). User B opens same page (version 5). User A saves changes. User B saves changes — overwrites User A's changes completely.

### SQL Solution

```sql
-- BAD: Last-write-wins (no conflict detection)
-- User A: UPDATE users SET name='A name', email='a@x.com' WHERE id = 1;
-- User B: UPDATE users SET name='B name', phone='555-0001' WHERE id = 1;
-- User A's name change is LOST

-- FIX: Optimistic concurrency with version/timestamp
ALTER TABLE users ADD COLUMN version INT DEFAULT 0;

-- User A reads: id=1, name='old', version=5
-- User B reads: id=1, name='old', version=5

-- User A updates:
UPDATE users SET name = 'A name', version = version + 1
WHERE id = 1 AND version = 5;
-- Success: version now = 6

-- User B updates:
UPDATE users SET name = 'B name', version = version + 1
WHERE id = 1 AND version = 5;
-- FAILS: version is now 6, not 5!  rows_affected = 0

-- Application responds: "This record was modified. Please refresh and retry."

-- FIX 2: Compare specific changed fields (merge-friendly)
UPDATE users SET name = 'B name'
WHERE id = 1 AND name = 'old';  -- Only update if name hasn't changed
-- If A changed name, this detects it
-- But B can still update phone without conflict → no false conflicts
```

### Spring Boot Implementation

```java
@Entity
public class UserProfile {
    @Id
    private Long id;
    private String name;
    private String email;

    @Version
    private Integer version;
    // JPA automatically checks version on save
    // Throws OptimisticLockException if stale
}

@PutMapping("/users/{id}")
public UserProfile updateUser(@PathVariable Long id, @RequestBody UpdateRequest req) {
    try {
        UserProfile user = userRepo.findById(id).orElseThrow();

        // Check client's version matches current
        if (!user.getVersion().equals(req.getVersion())) {
            throw new StaleObjectStateException("Record modified by another user");
        }

        user.setName(req.getName());
        return userRepo.save(user);
    } catch (OptimisticLockException e) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
            "This record was modified by another user. Please refresh and try again.");
    }
}
```

---

🔬 **Section Challenge — Scenario 53: Lost Update — Two Users Edit Same Record**

**Challenge 1 (Reasoning):** FIX 1 (a `version` column) rejects User B's save outright once User A has saved — even though User A only touched `name` and User B only touched `phone`, so there's no real conflict. FIX 2 (comparing the specific changed field) would let both through. Why is FIX 1's stricter behavior still the right default for most tables, and when does FIX 2's field-level approach actually pay off?

<details><summary>Answer</summary>

FIX 1's version bump is a conservative, whole-row compare-and-swap — it produces "false" conflicts like the name-vs-phone case, but it's simple, cheap (one column, one WHERE clause), and impossible to get wrong: ANY change by anyone else since you read the row is caught, regardless of which fields are involved or how those fields might relate to each other. FIX 2 avoids the false conflicts, but it's only safe when the fields being compared are truly independent — the moment two fields have a business relationship (`stock` and `reserved_stock` must sum correctly, `name` and `slug` must stay in sync), comparing just one of them can let a genuinely conflicting update through completely undetected. Field-level merging earns its complexity in collaborative-editing use cases (documents, forms with many independent fields) where false conflicts are frequent and annoying to users; version-column locking is the safer default everywhere else.

</details>

## Scenario 54: Deadlock — Two Transactions Waiting on Each Other

### 🔴 The Incident

```
Transaction A: UPDATE accounts SET balance=balance-100 WHERE id=1; -- locks row 1
Transaction B: UPDATE accounts SET balance=balance-200 WHERE id=2; -- locks row 2
Transaction A: UPDATE accounts SET balance=balance+100 WHERE id=2; -- WAITS for B's lock on row 2
Transaction B: UPDATE accounts SET balance=balance+200 WHERE id=1; -- WAITS for A's lock on row 1
-- DEADLOCK! Neither can proceed.
```

### 5W-H Analysis

| Question  | Answer                                                                    |
| --------- | ------------------------------------------------------------------------- |
| **What**  | Circular wait: A holds lock 1, wants lock 2. B holds lock 2, wants lock 1 |
| **Why**   | Both transactions lock rows in DIFFERENT ORDER                            |
| **When**  | Under concurrent updates touching multiple rows in different orders       |
| **Where** | Transfer operations, batch updates, any multi-row transaction             |
| **Who**   | Database detects it automatically and kills one transaction               |
| **How**   | Always lock rows in CONSISTENT ORDER (e.g., by ascending ID)              |

### SQL Solution

```sql
-- FIX: Always lock in the SAME ORDER (by ID ascending)
-- Transfer $100 from account 1 to account 2

-- Step 1: Lock both rows in ascending ID order
BEGIN;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Both rows locked in deterministic order — no matter which transaction runs first

-- Step 2: Perform the transfer
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- In the application, sort the IDs first:
-- if (fromId > toId) swap them; always lock lower ID first

-- DETECT deadlocks that happened:
-- PostgreSQL:
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- MySQL:
SHOW ENGINE INNODB STATUS;  -- "LATEST DETECTED DEADLOCK" section

-- Monitor deadlock frequency:
SELECT datname, deadlocks
FROM pg_stat_database WHERE deadlocks > 0;
```

### Spring Boot Transfer Service

```java
@Service
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // CRITICAL: Always lock in ascending ID order to prevent deadlocks
        Long firstId = Math.min(fromId, toId);
        Long secondId = Math.max(fromId, toId);

        // Lock both accounts in deterministic order
        Account first = jdbc.queryForObject(
            "SELECT * FROM accounts WHERE id = ? FOR UPDATE",
            accountMapper, firstId
        );
        Account second = jdbc.queryForObject(
            "SELECT * FROM accounts WHERE id = ? FOR UPDATE",
            accountMapper, secondId
        );

        // Perform transfer
        jdbc.update("UPDATE accounts SET balance = balance - ? WHERE id = ?", amount, fromId);
        jdbc.update("UPDATE accounts SET balance = balance + ? WHERE id = ?", amount, toId);
    }
}
```

### DSA Connection

- **Deadlock = Cycle in a directed graph** (wait-for graph)
- **Prevention = Total ordering** — resources locked in consistent sequence
- **Detection = DFS cycle detection** — database runs this periodically
- **Resolution = Break the cycle** — kill one transaction (victim selection)

---

🔬 **Section Challenge — Scenario 54: Deadlock — Two Transactions Waiting on Each Other**

**Challenge 1 (Reasoning):** T1 locks row A then tries to lock row B. T2 locks row B then tries to lock row A. Both wait forever. What does the database do automatically, and how do you prevent this pattern architecturally instead of just reacting to it?

<details><summary>Answer</summary>

The database's deadlock detector (a background thread that periodically builds a wait-for graph of who's blocked on whom) finds the cycle and kills one transaction — the "victim," usually chosen by least rollback cost or most recently started — with a deadlock error, letting the other proceed. The application must catch that error and retry the killed transaction; a deadlock victim is not a bug in your query, it's an expected outcome that code must handle. Architecturally, the real fix is prevention: always acquire locks on multiple rows in the SAME consistent order across every transaction and code path (e.g., always lock by ascending primary key, never "whatever order the request happened to touch them in") — this makes a wait-for cycle impossible to form in the first place, so there's nothing left for the detector to catch.

</details>

## Scenario 55: Phantom Read — Row Appears Mid-Transaction

### SQL Solution

```sql
-- Isolation level: READ COMMITTED (PostgreSQL default)
-- Transaction A:
BEGIN;
SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- Result: 5

-- Transaction B:
INSERT INTO orders (status) VALUES ('pending');
COMMIT;

-- Transaction A (same transaction!):
SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- Result: 6!
-- A phantom row appeared between two identical queries!

-- FIX: Use REPEATABLE READ or SERIALIZABLE
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- 5
-- Even after B inserts and commits...
SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- Still 5!
COMMIT;

-- When to use each isolation level:
-- READ UNCOMMITTED: Almost never (dirty reads)
-- READ COMMITTED:   Default, good for most OLTP (can see committed changes)
-- REPEATABLE READ:  Reports, balances (consistent snapshot)
-- SERIALIZABLE:     Financial transactions, audit (strictest, slowest)
```

---

🔬 **Section Challenge — Scenario 55: Phantom Read — Row Appears Mid-Transaction**

**Challenge 1 (Reasoning):** T1 runs `SELECT COUNT(*) FROM orders WHERE status='pending'` twice, 5 seconds apart, inside one transaction. Between the two SELECTs, T2 inserts and commits a new pending order. At READ COMMITTED, what does T1's second COUNT show, and does REPEATABLE READ change it?

<details><summary>Answer</summary>

At READ COMMITTED, each statement takes its own fresh snapshot, so T1's second COUNT DOES include T2's newly committed row — the count changes in the middle of T1's transaction even though T1 issued the "same" query twice. That's the phantom read anomaly: a new row satisfying the WHERE clause appears between two reads in the same transaction. REPEATABLE READ prevents it, in both major engines, though by different mechanisms: PostgreSQL takes one MVCC snapshot for the whole transaction, so the second SELECT still reflects the state as of the transaction's start; MySQL/InnoDB layers gap locks on top of MVCC for locking reads to physically block inserts into the scanned range. Either way, at REPEATABLE READ, T1's second COUNT matches the first.

</details>

## Scenario 56–58: Isolation Anomalies Quick-Fire

### Scenario 56: Non-Repeatable Read

```sql
-- Transaction A reads price = $100
-- Transaction B updates price to $150 and commits
-- Transaction A reads price again = $150  ← Different!

-- FIX: REPEATABLE READ snapshot
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT price FROM products WHERE id = 1;  -- $100
-- B updates to $150 and commits
SELECT price FROM products WHERE id = 1;  -- Still $100 (snapshot!)
COMMIT;
```

### Scenario 57: Dirty Read

```sql
-- Transaction A updates balance to 0 (but doesn't commit yet)
-- Transaction B reads balance = 0 (uncommitted!)
-- Transaction A ROLLS BACK (balance is still $100)
-- Transaction B already acted on the dirty data

-- Fixed by: READ COMMITTED or higher (prevents dirty reads)
-- PostgreSQL doesn't even allow dirty reads — even READ UNCOMMITTED behaves as READ COMMITTED
```

### Scenario 58: Write Skew

```sql
-- Hospital rule: At least 1 doctor must be on-call at all times
-- Doctor A and Doctor B are both on-call
-- Transaction A: checks count = 2, removes Doctor A from on-call → count = 1 ✓
-- Transaction B: checks count = 2, removes Doctor B from on-call → count = 1 ✓
-- BOTH committed! Now count = 0 — RULE VIOLATED!

-- Each transaction individually maintained the invariant, but together they broke it.

-- FIX: SERIALIZABLE isolation detects this:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT COUNT(*) FROM on_call_doctors WHERE on_call = TRUE;  -- 2
UPDATE on_call_doctors SET on_call = FALSE WHERE doctor_id = 1;
COMMIT;
-- If B tries to do the same: ERROR: could not serialize access
-- Only A's change commits; B must retry and will see count = 1

-- FIX 2: Explicit lock on the CHECK rows
-- Note: FOR UPDATE cannot be combined with COUNT(*)/aggregates in PostgreSQL --
-- locking clauses require each result row to map to one identifiable table row,
-- which an aggregate breaks. Select and lock the actual rows instead, then count
-- them in application code (or with a separate, non-locking COUNT(*) query).
BEGIN;
SELECT doctor_id FROM on_call_doctors WHERE on_call = TRUE FOR UPDATE;
-- Locks every matching row — B blocks here until A commits
```

---

## Scenario 59: Long-Running Transaction Blocking All Writes

### 🔴 The Incident

Developer runs `BEGIN` in psql, forgets to `COMMIT`. For 6 hours, autovacuum can't clean dead tuples, table bloat grows, all other transactions accumulate WAL.

### SQL Solution

```sql
-- DETECT long-running transactions:
SELECT
    pid,
    usename,
    state,
    query,
    NOW() - xact_start AS transaction_duration,
    NOW() - query_start AS query_duration,
    wait_event_type
FROM pg_stat_activity
WHERE state != 'idle'
  AND xact_start < NOW() - INTERVAL '5 minutes'
ORDER BY xact_start;

-- Kill the offending transaction:
SELECT pg_terminate_backend(12345);  -- Kill by PID

-- PREVENT: Set statement and idle-in-transaction timeouts
ALTER SYSTEM SET idle_in_transaction_session_timeout = '300000';  -- 5 min
ALTER SYSTEM SET statement_timeout = '60000';  -- 1 min for queries
SELECT pg_reload_conf();

-- MySQL equivalent:
SET GLOBAL wait_timeout = 300;
SET GLOBAL interactive_timeout = 300;
```

### Spring Boot Prevention

```java
// Set transaction timeout in Spring Boot
@Transactional(timeout = 30)  // 30 seconds max
public void processOrder(OrderRequest request) {
    // If this takes > 30s, transaction automatically rolls back
}

// Global default:
spring:
  transaction:
    default-timeout: 30
```

---

🔬 **Section Challenge — Scenario 59: Long-Running Transaction Blocking All Writes**

**Challenge 1 (Reasoning):** A 45-minute analytics transaction is left open on the primary (`BEGIN`, several `SELECT`s, never `COMMIT`/`ROLLBACK`) while the same table is being written to constantly. Why does this stall writers, and what actually prevents it from happening again?

<details><summary>Answer</summary>

An open transaction — even a read-only one — holds back the vacuum horizon: PostgreSQL can't remove a dead row version that the still-running transaction's snapshot might still need to see, no matter how long ago that transaction actually read anything. So dead tuples pile up, table and index bloat grows, and eventually writes queue behind lock contention or simply slow to a crawl as the bloated table and indexes get harder to scan and update. The fix isn't reacting after the fact — it's `statement_timeout` and `idle_in_transaction_session_timeout` to automatically kill sessions that sit open too long, plus routing long analytics queries to a read replica instead of running them against the primary at all.

</details>

## Scenario 60–63: Lock & Distributed Consistency Quick-Fire

### Scenario 60: Bulk UPDATE Holding Millions of Row Locks

```sql
-- Unlike SQL Server, MySQL InnoDB does NOT escalate many row locks into one
-- table lock -- it's specifically engineered to avoid that (row lock storage
-- is compact enough that holding millions of individual row locks doesn't
-- exhaust memory the way it would force SQL Server to escalate).
-- But a single giant UPDATE still holds a row lock on EVERY row it touches
-- for the whole transaction's duration, and builds one massive undo-log
-- entry to make that possible. In practice this has nearly the same effect
-- as a table lock: any other transaction touching any of those millions of
-- rows blocks until this one finally commits, replication lag spikes from
-- the huge binlog event, and a failure partway means rolling back all of it.

-- FIX: Batch large updates into smaller transactions
-- BAD:
UPDATE orders SET status = 'archived' WHERE created_at < '2024-01-01';
-- Locks and holds 5M rows for the entire (possibly minutes-long) transaction

-- GOOD: Batch in chunks
UPDATE orders SET status = 'archived'
WHERE id IN (
    SELECT id FROM orders
    WHERE created_at < '2024-01-01' AND status != 'archived'
    LIMIT 5000
);
-- Repeat until 0 rows affected; each batch commits and releases its locks
-- quickly, keeping contention with other transactions bounded
```

### Scenario 61: Dual-Write Inconsistency (DB + Cache)

```java
// PROBLEM: DB says one thing, Redis cache says another
public void updateProduct(Product product) {
    productRepo.save(product);     // DB updated
    // <<< CRASH HERE >>>
    redisTemplate.delete("product:" + product.getId());  // Cache never invalidated!
}

// FIX: Cache-aside pattern with TTL
public Product getProduct(Long id) {
    String key = "product:" + id;
    Product cached = redisTemplate.opsForValue().get(key);
    if (cached != null) return cached;

    Product product = productRepo.findById(id).orElseThrow();
    redisTemplate.opsForValue().set(key, product, Duration.ofMinutes(5));  // TTL!
    return product;
}

public void updateProduct(Product product) {
    productRepo.save(product);
    redisTemplate.delete("product:" + product.getId());  // Delete, don't update
    // Even if delete fails, TTL ensures staleness < 5 minutes
}
```

### Scenario 62: Idempotency Failure — Duplicate Payment

```sql
-- PROBLEM: Network timeout → client retries → payment processed twice

-- FIX: Idempotency key
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(50) UNIQUE NOT NULL,  -- Client-generated UUID
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert with ON CONFLICT (idempotent!)
INSERT INTO payments (idempotency_key, user_id, amount)
VALUES ('pay_abc123', 1, 99.99)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING *;
-- First call: inserts and returns the payment
-- Second call (retry): does nothing, returns nothing
-- Application checks: if no row returned, fetch existing by idempotency_key
```

```java
// Spring Boot idempotent endpoint
@PostMapping("/payments")
public ResponseEntity<Payment> createPayment(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody PaymentRequest request) {

    // Check if already processed
    Optional<Payment> existing = paymentRepo.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());  // Return same result
    }

    Payment payment = paymentService.process(request, idempotencyKey);
    return ResponseEntity.status(HttpStatus.CREATED).body(payment);
}
```

### Scenario 63: Read-Your-Own-Writes with Replicas

```java
// PROBLEM: Write goes to primary, immediate read goes to replica (stale!)
@Transactional
public User updateUserEmail(Long userId, String email) {
    userRepo.updateEmail(userId, email);  // Goes to PRIMARY
    return userRepo.findById(userId);      // Goes to REPLICA — returns OLD email!
}

// FIX 1: Route reads to primary within the same transaction
@Transactional(readOnly = false)  // Forces primary for all queries in this tx
public User updateUserEmail(Long userId, String email) { ... }

// FIX 2: Sticky session — route to primary for N seconds after write
public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        if (TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            // Check if user recently wrote (within 2 seconds)
            if (recentlyWrote(getCurrentUserId())) {
                return "primary";  // Sticky to primary
            }
            return "replica";
        }
        return "primary";
    }
}
```

---

## Scenario 64: Eventually Consistent Counter Going Negative

### SQL Solution

```sql
-- PROBLEM: Multiple replicas each apply -1 to cached counter value
-- Counter starts at 3, three replicas each think they're doing 3-1=2
-- Final value after merge: could be 2 (not 0 as expected)

-- FIX: Use CRDT (Conflict-Free Replicated Data Type) counter
-- Or: Centralize counter on primary with atomic UPDATE
UPDATE counters SET value = value - 1 WHERE name = 'stock_item_42' AND value > 0;

-- FIX 2: Event-sourced counter
CREATE TABLE counter_events (
    id BIGSERIAL PRIMARY KEY,
    counter_name VARCHAR(50) NOT NULL,
    delta INT NOT NULL,  -- +1 or -1
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert events (idempotent with request_id)
INSERT INTO counter_events (counter_name, delta)
VALUES ('stock_item_42', -1);

-- Read counter value (sum all events)
SELECT SUM(delta) AS current_value
FROM counter_events WHERE counter_name = 'stock_item_42';
```

---

## Scenario 65: Saga Pattern Failure — Partial Booking

### 🔴 The Incident

Travel booking: (1) Reserve flight → success, (2) Reserve hotel → success, (3) Charge payment → FAILS. Flight and hotel are reserved but not paid.

### Spring Boot Saga Implementation

```java
@Service
public class BookingSaga {

    public BookingResult book(BookingRequest request) {
        String flightReservation = null;
        String hotelReservation = null;

        try {
            // Step 1: Reserve flight
            flightReservation = flightService.reserve(request.getFlight());

            // Step 2: Reserve hotel
            hotelReservation = hotelService.reserve(request.getHotel());

            // Step 3: Charge payment
            paymentService.charge(request.getPayment());

            return BookingResult.success(flightReservation, hotelReservation);

        } catch (Exception e) {
            // COMPENSATING TRANSACTIONS (rollback in reverse order)
            if (hotelReservation != null) {
                hotelService.cancelReservation(hotelReservation);
            }
            if (flightReservation != null) {
                flightService.cancelReservation(flightReservation);
            }
            throw new BookingFailedException("Booking failed, all reservations cancelled", e);
        }
    }
}

// SQL: Track saga state for crash recovery
CREATE TABLE saga_executions (
    saga_id UUID PRIMARY KEY,
    saga_type VARCHAR(50) NOT NULL,
    step_completed INT NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    compensated BOOLEAN DEFAULT FALSE,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### DSA Connection

- **Saga = Stack-based undo** — push operations, pop to compensate
- **Two-phase commit = Distributed consensus** — all-or-nothing
- **Compensating transaction = Transaction log replay in reverse**

---

## Scenario 66: Optimistic Lock Retry Storm

### 🔴 The Incident

Flash sale: 10,000 users updating the same product row with optimistic locking. 9,999 get `OptimisticLockException`, retry, conflict again → exponential retry storm. Database CPU at 100%.

### Spring Boot Solution

```java
@Service
public class FlashSaleService {

    // FIX 1: Pessimistic lock for hot rows (wait your turn, don't retry)
    @Transactional
    public OrderResult purchaseWithPessimisticLock(Long productId, int qty) {
        // Plain FOR UPDATE, NOT SKIP LOCKED: this targets ONE specific row by id,
        // so there's no other equivalent row to skip to. SKIP LOCKED here would
        // make the query return nothing -- falsely reporting sold-out -- the
        // instant ANY other request holds the lock, even though stock might be
        // fine once that request finishes. SKIP LOCKED belongs on queue-style
        // queries picking from a pool of interchangeable candidate rows (job
        // queues, "any available worker"), not a single named hot row like this.
        Product product = jdbc.queryForObject(
            "SELECT * FROM products WHERE id = ? AND stock >= ? FOR UPDATE",
            productMapper, productId, qty
        );

        if (product == null) {
            return OrderResult.soldOut();
        }

        jdbc.update("UPDATE products SET stock = stock - ? WHERE id = ?", qty, productId);
        return OrderResult.success();
    }

    // FIX 2: Distribute the contention across "buckets"
    // Instead of 1 stock row, create 10 stock buckets
    // Each bucket holds stock/10, reducing contention 10x
    @Transactional
    public OrderResult purchaseFromBucket(Long productId, int qty) {
        int bucket = ThreadLocalRandom.current().nextInt(10);

        int rows = jdbc.update(
            "UPDATE product_stock_buckets SET stock = stock - ? " +
            "WHERE product_id = ? AND bucket_id = ? AND stock >= ?",
            qty, productId, bucket, qty
        );

        if (rows == 0) {
            // This bucket empty, try next
            for (int i = 0; i < 10; i++) {
                if (i == bucket) continue;
                rows = jdbc.update(
                    "UPDATE product_stock_buckets SET stock = stock - ? " +
                    "WHERE product_id = ? AND bucket_id = ? AND stock >= ?",
                    qty, productId, i, qty
                );
                if (rows > 0) break;
            }
        }

        return rows > 0 ? OrderResult.success() : OrderResult.soldOut();
    }
}
```

```sql
-- Stock bucket table (distribute hot row across N buckets)
CREATE TABLE product_stock_buckets (
    product_id BIGINT,
    bucket_id INT,
    stock INT NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, bucket_id)
);

-- Initialize 10 buckets with 100 items each (total: 1000)
INSERT INTO product_stock_buckets (product_id, bucket_id, stock)
SELECT 42, generate_series(0, 9), 100;

-- Total stock:
SELECT product_id, SUM(stock) AS total_stock
FROM product_stock_buckets WHERE product_id = 42 GROUP BY product_id;
```

### DSA Connection

- **Hot row = Hot spot** — like a hash table with all keys hashing to same bucket
- **Stock buckets = Consistent hashing** — distribute load across buckets
- **SKIP LOCKED = Non-blocking queue** — take next available, don't wait

---

## Scenario 67: Batch Job Conflicting with OLTP Traffic

### SQL Solution

```sql
-- PROBLEM: Nightly batch UPDATE locks 5M rows, blocking online users for 2 hours

-- FIX 1: Batch in small chunks with delays
DO $$
DECLARE
    batch_size INT := 5000;
    rows_updated INT := 1;
BEGIN
    WHILE rows_updated > 0 LOOP
        UPDATE orders SET status = 'archived'
        WHERE id IN (
            SELECT id FROM orders
            WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
            AND status != 'archived'
            LIMIT batch_size
        );
        GET DIAGNOSTICS rows_updated = ROW_COUNT;

        COMMIT;  -- Release locks between batches
        PERFORM pg_sleep(0.1);  -- 100ms pause to let OLTP through
    END LOOP;
END $$;

-- FIX 2: Run batch on read replica, then apply changes to primary
-- FIX 3: Use separate connection pool with lower priority
```

### Spring Boot Batch with Throttling

```java
@Service
public class ArchivalBatchJob {

    @Autowired
    private JdbcTemplate jdbc;

    @Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
    public void archiveOldOrders() {
        int totalArchived = 0;
        int batchSize = 5000;

        while (true) {
            int rows = jdbc.update(
                "UPDATE orders SET status = 'archived' " +
                "WHERE id IN (SELECT id FROM orders " +
                "WHERE created_at < ? AND status != 'archived' LIMIT ?)",
                LocalDate.now().minusYears(1), batchSize
            );

            totalArchived += rows;
            if (rows == 0) break;

            try { Thread.sleep(100); } catch (InterruptedException e) { break; }
        }

        log.info("Archived {} orders", totalArchived);
    }
}
```

---

## Scenario 68: Auto-Vacuum Blocked by Long Transaction

### SQL Solution

```sql
-- PROBLEM: Long-running analytics query holds a snapshot
-- autovacuum can't remove dead tuples older than that snapshot
-- Table bloat grows for hours

-- Detect the blocker:
SELECT
    pid,
    backend_xid,
    backend_xmin,  -- This is the "horizon" — vacuum can't clean past this
    age(backend_xmin) AS xmin_age,
    state,
    query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC
LIMIT 5;

-- FIX: Use statement_timeout for analytics queries
SET statement_timeout = '300000';  -- 5 minutes max

-- FIX: Run analytics on a separate replica (doesn't affect primary's vacuum)
-- FIX: Use pg_stat_statements to find long-running queries and optimize them
```

---

🔬 **Section Challenge — Scenario 68: Auto-Vacuum Blocked by Long Transaction**

**Challenge 1 (Reasoning):** You suspect a long-idle transaction is blocking autovacuum on a critical table, but `pg_stat_activity` shows dozens of open connections. How do you identify WHICH one is the actual culprit, and why does `age(backend_xmin)` matter more here than `age(query_start)`?

<details><summary>Answer</summary>

Filter `pg_stat_activity` to rows where `backend_xmin IS NOT NULL`, ordered by `age(backend_xmin) DESC` — `backend_xmin` is the oldest transaction ID a session's snapshot still depends on, so a large `age(backend_xmin)` directly identifies the connection holding back the vacuum horizon, regardless of what query it's running right now. `age(query_start)` only tells you how long the CURRENT statement has been executing — a session can sit `idle in transaction` for hours with `query_start` looking perfectly fresh (from its last quick `SELECT`), while its still-open transaction — and thus its `xmin` — is what's actually blocking vacuum from reclaiming dead tuples.

</details>

## Scenarios 69–75: Lock & Concurrency Quick-Fire

### Scenario 69: Gap Lock Causing Unexpected Blocks (MySQL)

```sql
-- MySQL InnoDB REPEATABLE READ uses gap locks
-- Transaction A: SELECT * FROM orders WHERE status = 'pending' FOR UPDATE;
-- This locks the GAP between existing 'pending' rows!
-- Transaction B: INSERT INTO orders (status) VALUES ('pending');
-- B is BLOCKED even though no actual row conflicts!

-- FIX: Use READ COMMITTED to avoid gap locks (trade-off: allows phantom reads)
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### Scenario 70: Serialization Failure (PostgreSQL SSI)

```sql
-- PostgreSQL SERIALIZABLE uses Serializable Snapshot Isolation (SSI)
-- Detects conflicts without locking, but may abort transactions

-- Application MUST handle serialization failures:
-- SQLSTATE '40001' = serialization failure → just RETRY
```

```java
@Retryable(
    value = {SerializationFailureException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 50, multiplier = 2)
)
@Transactional(isolation = Isolation.SERIALIZABLE)
public void criticalOperation() { ... }
```

### Scenario 71: Queue Table Hot Row Contention

```sql
-- PROBLEM: Multiple workers polling same queue table
SELECT * FROM job_queue WHERE status = 'pending' ORDER BY created_at LIMIT 1 FOR UPDATE;
-- ALL workers block on the same row!

-- FIX: SKIP LOCKED (PostgreSQL 9.5+, MySQL 8.0+)
SELECT * FROM job_queue
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
-- Each worker gets a DIFFERENT row, no blocking!
```

### Scenario 72: Trigger Cascade Causing Unexpected Locks

```sql
-- UPDATE on table A fires trigger that UPDATEs table B
-- Table B's trigger UPDATEs table C — unexpected lock chain!

-- DIAGNOSE: Check trigger chain
SELECT tgname, tgrelid::regclass, tgtype, proname
FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'orders';

-- FIX: Minimize trigger logic; move to application layer
```

### Scenario 73: Constraint Violation in Concurrent INSERT

```sql
-- Two threads INSERT user with same email simultaneously
-- Both pass the SELECT check (no user with this email exists)
-- Both INSERT — second one gets UNIQUE constraint violation

-- FIX: INSERT ON CONFLICT (upsert)
INSERT INTO users (email, name) VALUES ('john@example.com', 'John')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING *;
-- No race condition — database handles it atomically
```

### Scenario 74: Clock Skew in Distributed Timestamp Ordering

```sql
-- Server A's clock is 3 seconds ahead of Server B
-- Event order: B creates order at real 10:00:00 (clock says 09:59:57)
--              A creates order at real 10:00:01 (clock says 10:00:04)
-- Stored order: A(10:00:04), B(09:59:57) — WRONG!

-- FIX: Use database-assigned timestamps, not application timestamps
INSERT INTO events (data, created_at)
VALUES ('event data', CURRENT_TIMESTAMP);  -- Database clock, not app clock

-- FIX 2: Hybrid Logical Clock (HLC) for distributed systems
-- Combines physical clock + logical counter
```

### Scenario 75: Connection Leak — Transactions Never Committed

```java
// BAD: Connection acquired but never returned
public void processData() {
    Connection conn = dataSource.getConnection();
    Statement stmt = conn.createStatement();
    stmt.executeUpdate("INSERT INTO ...");
    // NO conn.close() or conn.commit()!
    // Connection leaked! Pool slowly drains.
}

// FIX: Always use try-with-resources
public void processData() {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement stmt = conn.prepareStatement("INSERT INTO ...")) {
        stmt.executeUpdate();
        conn.commit();
    }  // Auto-closed even if exception occurs
}

// Spring Boot: Let the framework manage connections
@Transactional  // Spring opens/closes connection automatically
public void processData() {
    jdbc.update("INSERT INTO ...");
}

// DETECT: HikariCP leak detection
spring:
  datasource:
    hikari:
      leak-detection-threshold: 30000  # Warn if connection held > 30s
```

---

## 🧠 DSA Patterns Behind Concurrency Scenarios

| Scenario          | DSA Pattern                                             |
| ----------------- | ------------------------------------------------------- |
| Double-spend      | **CAS (Compare-and-Swap)** — atomic read-modify-write   |
| Overselling       | **Semaphore** — counting resource (stock)               |
| Lost update       | **Versioning / optimistic lock** — conflict detection   |
| Deadlock          | **Cycle detection in directed graph**                   |
| Phantom read      | **Snapshot isolation** — read from a point-in-time copy |
| Saga pattern      | **Stack-based undo** — compensating operations          |
| Retry storm       | **Exponential backoff** — spread out retries over time  |
| Hot row / bucket  | **Consistent hashing** — distribute load                |
| SKIP LOCKED queue | **Non-blocking dequeue** — CAS-based lock-free queue    |
| Idempotency       | **Set / HashSet** — "already processed" check           |

---

[⬅ Previous: 39_RealWorld_Production_Scenarios_Part2](39_RealWorld_Production_Scenarios_Part2.md) | [📚 Index](00_INDEX.md) | [Next: 41_RealWorld_Production_Scenarios_Part4 ➡](41_RealWorld_Production_Scenarios_Part4.md)

### Historical Evolution

**Predecessors (with years):**
- **Edsger Dijkstra (1965)**: Introduced semaphores and the concept of mutual exclusion in concurrent processes — foundational theory behind all database locking
- **Edward G. Coffman Jr. (1971)**: Formalized the four Coffman conditions necessary for deadlock — mutual exclusion, hold-and-wait, no preemption, circular wait; violating any one prevents deadlock
- **David Reed (1978)**: MIT doctoral dissertation introducing Multi-Version Concurrency Control (MVCC) — readers see consistent snapshots, writers create new versions; eliminates read-write blocking
- **Financial system engineers (1980s)**: Double-entry bookkeeping systems formalized double-spend prevention; ACID transactions emerged from the need to prevent financial inconsistencies in banking systems

**Evolution narrative:**
Concurrency control evolved from operating system theory (Dijkstra's semaphores, 1965) into database theory (Eswaran & Gray on lock granules, 1976) into production practice (IBM DB2, Oracle). The race condition / lost update problem predates databases — it exists in any concurrent system where two processes read-modify-write the same variable without synchronization. Database designers chose pessimistic locking (SELECT FOR UPDATE) for high-integrity workloads and optimistic locking (version columns) for high-throughput/low-contention systems. MVCC (Reed 1978) was the key insight that separated "old databases" (readers block writers) from "modern databases" (everyone works simultaneously on different row versions).

**Modern practice anchor:**
PostgreSQL's MVCC + VACUUM combination, MySQL InnoDB's gap locks, and SQL Server's optimisticSnapshot isolation are all modern implementations of these 1970s ideas. The anomalies (dirty read, non-repeatable read, phantom read, write skew) and their isolation-level countermeasures were formalized in SQL-92 and remain the vocabulary for discussing concurrent data access.


---

## Reality Check

**"EXPLAIN shows exactly how the query will run"** → EXPLAIN shows the PLANNED execution. EXPLAIN ANALYZE shows the ACTUAL execution with real timing and row counts. The plan can differ from reality because: statistics are stale, parameter values change the optimal plan, and concurrent operations affect resource availability. Always use EXPLAIN ANALYZE (which actually runs the query) for accurate performance analysis. Wrap destructive queries in a transaction and rollback after analyzing.

**"Stored procedures are faster than application queries"** → Stored procedures eliminate one network round-trip by running multiple statements server-side. But: they are harder to version control, harder to test, harder to debug, and vendor-specific. The network savings (1-5ms per avoided round-trip) are negligible compared to query execution time (10-100ms). Use stored procedures for complex operations that benefit from reduced round-trips, not as a universal performance strategy.

**"Database triggers maintain data consistency"** → Triggers run inside the triggering transaction and add latency to every INSERT, UPDATE, or DELETE on the table. A BEFORE INSERT trigger that validates data across related tables adds a query to every insert. An AFTER UPDATE trigger that logs changes doubles the write load. Triggers are invisible to application developers, making behavior hard to debug. Use application-level event handlers or database-level constraints (CHECK, FOREIGN KEY) instead.

**"Query hints override the optimizer for better performance"** → Hints force a specific execution plan, but the optimal plan changes with data distribution. A hint that forces an index scan works when the table has 1000 rows but hurts when the table grows to 1 million rows and a sequential scan would be faster. If the optimizer makes a wrong choice, update statistics (ANALYZE) or restructure the query. Use hints only as a last resort with a comment explaining why.

**"NoSQL eliminates SQL database problems"** → NoSQL databases trade SQL constraints for different constraints: MongoDB has no JOINs (you denormalize and update multiple documents), Cassandra requires designing tables around specific query patterns (no ad-hoc queries), DynamoDB has throughput pricing that punishes scan operations. NoSQL does not eliminate complexity — it moves it from the database to the application layer.
