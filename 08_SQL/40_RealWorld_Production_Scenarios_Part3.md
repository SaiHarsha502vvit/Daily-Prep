# Chapter 40 — Real-World Production Scenarios Part 3: Concurrency, Transactions & Data Integrity

**What:** 25 real-world concurrency disasters (Scenarios 51–75) with 5W-H + fixes
**Why:** Race conditions, deadlocks, and data corruption are the hardest bugs to reproduce and fix
**Where:** Every multi-user system — e-commerce, banking, SaaS, ticketing
**How:** Understand the failure → SQL/backend fix → DSA insight

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
| 60  | Table lock escalation: row locks → table lock      | Lock            |
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

>

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

>

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

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?

<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).

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

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?

<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).

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

-- FIX 2: Explicit lock on the CHECK row
BEGIN;
SELECT COUNT(*) FROM on_call_doctors WHERE on_call = TRUE FOR UPDATE;
-- Locks ALL on_call rows — B blocks here until A commits
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

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?

<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).

</details>

## Scenario 60–63: Lock & Distributed Consistency Quick-Fire

### Scenario 60: Row Lock Escalation to Table Lock

```sql
-- MySQL InnoDB: Too many individual row locks → escalates to table lock
-- This blocks ALL other operations on the table

-- FIX: Batch large updates to reduce lock count
-- BAD:
UPDATE orders SET status = 'archived' WHERE created_at < '2024-01-01';
-- Locks 5M rows → escalates to table lock

-- GOOD: Batch in chunks
UPDATE orders SET status = 'archived'
WHERE id IN (
    SELECT id FROM orders
    WHERE created_at < '2024-01-01' AND status != 'archived'
    LIMIT 5000
);
-- Repeat until 0 rows affected; locks only 5000 at a time
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

    // FIX 1: Pessimistic lock for hot rows (don't retry, just queue)
    @Transactional
    public OrderResult purchaseWithPessimisticLock(Long productId, int qty) {
        // SELECT FOR UPDATE SKIP LOCKED — immediately skip if locked
        Product product = jdbc.queryForObject(
            "SELECT * FROM products WHERE id = ? AND stock >= ? FOR UPDATE SKIP LOCKED",
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

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?

<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).

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
