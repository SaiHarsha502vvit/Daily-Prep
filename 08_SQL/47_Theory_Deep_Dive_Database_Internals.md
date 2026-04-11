# Chapter 47 — Theory Deep Dive: Database Internals for Interviews

> **What:** The core database theory that senior engineers ACTUALLY know — not textbook definitions, but the internals that explain WHY things work the way they do
> **Why:** When an interviewer asks "why is this slow?", the person who understands B-Tree page splits, MVCC snapshots, and lock escalation gives a fundamentally better answer than the person who says "just add an index"

---

## 📋 Theory Topics

| # | Topic | Why It Matters |
|---|-------|---------------|
| T1 | B-Tree Internals & Math | Explains index design, fragmentation, covering indexes |
| T2 | MVCC: How PostgreSQL Reads Without Locking | Explains snapshot isolation, VACUUM, bloat |
| T3 | Lock Hierarchy & Escalation | Explains deadlocks, ALTER TABLE blocks, lock timeouts |
| T4 | Query Optimizer Decision Making | Explains why the DB sometimes ignores your index |
| T5 | WAL (Write-Ahead Log) | Explains crash recovery, replication, why commits are durable |
| T6 | Buffer Pool & Memory | Explains cache hits, cold starts, why SSDs transformed databases |
| T7 | Transaction Log & Undo/Redo | How atomicity and durability actually work under the hood |
| T8 | Hash Join vs Nested Loop vs Merge Join | Read execution plans like a senior engineer |

---

## T1: B-Tree Internals & Math

### How a B-Tree Actually Works

```
A B-Tree is a balanced tree where each node is a DISK PAGE (typically 8KB).
Every page can hold hundreds of keys → very shallow tree → very fast lookups.

Example: Index on id (BIGINT = 8 bytes) for 100 million rows

Page size: 8,192 bytes
Key size: 8 bytes (BIGINT) + 6 bytes (tuple pointer) = 14 bytes
Page overhead: ~24 bytes header
Keys per page: (8192 - 24) / 14 ≈ 583 keys per internal page
                                  ≈ 400 keys per leaf page (more overhead)

Tree depth calculation:
- Level 0 (root): 1 page → 583 child pointers
- Level 1: 583 pages → 583 × 583 = 339,889 child pointers
- Level 2: 339,889 pages → 339,889 × 583 = 198M pointers
- Level 3: Only needed if > 198M rows

100M rows → DEPTH = 3 levels!
Lookup: 3 page reads to find ANY row out of 100M.
If root and level-1 are cached in memory (they always are): 1 disk read!

B-TREE VISUAL (simplified, 3 keys per node for illustration):

              [30 | 70]                    ← Root (level 0)
             /    |    \
      [10|20]  [40|50|60]  [80|90]        ← Internal (level 1)
      / | \    / | | \     / | \
   [1..9][11..19]...[71..79][81..89][91..100]  ← Leaf pages (level 2)
            ↕          ↕          ↕
   Leaf pages are doubly-linked for range scans →
```

### Why Sequential IDs Are Faster Than Random UUIDs

```
SEQUENTIAL INSERTS (auto-increment):
   [1,2,3,4,5]→[6,7,8,9,10]→...→[991,992,993,994,995]→[996,997,998,999,1000]
   Inserts always go to the RIGHTMOST leaf page.
   One page in buffer → write when full → perfectly sequential disk I/O.
   Write amplification: 1x (each row written once)

RANDOM INSERTS (UUID v4):
   [3f2a..,8b1c..,a42f..,d91e..,f5b8..]  ← entries in random pages
   Insert lands on a RANDOM leaf → might not be in memory → disk read FIRST
   Then write → page split if full → more disk writes
   Write amplification: 3-5x (read page + split + write 2 pages)

MEASURED IMPACT:
- Sequential IDs:  50,000 inserts/second on SSD
- UUID v4:         15,000 inserts/second on SSD (3.3x slower)
- UUID v7:         45,000 inserts/second (time-ordered → mostly sequential)
- On HDD: difference is 10-20x (random seek = 5ms vs sequential = 0.05ms)
```

### Composite Index: Why Column Order Matters (With B-Tree)

```
Index: (country, city, zipcode)

B-Tree structure:
                         [Germany | USA]
                        /       |       \
              [Berlin|Munich] [NYC|SF] [Chicago|Dallas]
              / | \           / | \
         [10115][10117]  [10001][10002] [94016][94017]

Query: WHERE country = 'USA' AND city = 'NYC' → FAST
  → Root: USA → Level 1: NYC → Leaf: scan zipcodes → 2 page reads

Query: WHERE city = 'NYC'  → SLOW (no leading column)
  → Must scan ALL countries to find 'NYC' in each → can't use index efficiently

Query: WHERE country = 'USA' AND zipcode = '10001' → PARTIAL
  → Root: USA → Level 1: scan ALL cities → look for zipcode in each
  → Skips zipcode column because city (middle) is missing

RULE: B-Tree can use columns left-to-right until it hits a gap or range condition.
  (country = 'USA' AND city = 'NYC' AND zipcode > '10000')
   ↑ used             ↑ used            ↑ used (rightmost, range)
  
  (country = 'USA' AND zipcode = '10001')
   ↑ used             ↑ NOT used (city gap!)
```

---




## T2: MVCC — How PostgreSQL Reads Without Locking

### The Snapshot Mechanism

```
MVCC = Multi-Version Concurrency Control
Core idea: Readers never block writers, writers never block readers.
Each transaction sees a SNAPSHOT of the database at a specific point in time.

HOW IT WORKS (PostgreSQL):
Every row has hidden columns:
  xmin = transaction ID that CREATED this row
  xmax = transaction ID that DELETED/UPDATED this row (0 if alive)

When you UPDATE a row:
1. Old row gets xmax = your transaction ID (marks it as "deleted by you")
2. New row gets xmin = your transaction ID (marks it as "created by you")
3. BOTH versions exist on disk simultaneously

Example:
  Transaction 100: INSERT INTO users VALUES (1, 'Alice');
  → Row: {xmin=100, xmax=0, id=1, name='Alice'}

  Transaction 200: UPDATE users SET name = 'Bob' WHERE id = 1;
  → Old row: {xmin=100, xmax=200, id=1, name='Alice'}  ← still exists!
  → New row: {xmin=200, xmax=0, id=1, name='Bob'}

  Transaction 150 (started before 200):
  → Sees OLD row because 200 hasn't committed from 150's perspective
  → Snapshot rule: only see rows where xmin < my_snapshot AND xmax = 0 or xmax > my_snapshot
```

### Why VACUUM Exists

```
Problem: Old row versions accumulate → "dead tuples" → table bloat

Timeline:
1. Table has 1M rows (100MB)
2. After 6 months of updates: 1M live rows + 5M dead rows (600MB!)
3. Queries scan through dead rows too → slower
4. Index entries point to dead rows → index bloat

VACUUM does:
1. Scans table for dead tuples (where xmax < oldest active transaction)
2. Marks that space as reusable
3. Does NOT return space to OS (use VACUUM FULL for that — but it locks table!)

VACUUM FULL:
- Rewrites entire table → compacts → returns space to disk
- Requires AccessExclusiveLock → blocks ALL reads and writes
- Only use during maintenance windows

autovacuum (default in PostgreSQL):
- Runs automatically when dead tuple ratio exceeds threshold
- Default: triggers when dead tuples > 20% of table
- Running too rarely → bloat. Running too aggressively → CPU spike.
- TUNE: autovacuum_vacuum_scale_factor, autovacuum_vacuum_threshold
```

### MVCC vs Locking (MySQL InnoDB Comparison)

```
PostgreSQL (MVCC, no read locks):
- SELECT never blocks
- UPDATE creates new version, marks old as dead
- Readers on old snapshot still see old version
- Dead versions cleaned by VACUUM

MySQL InnoDB (MVCC with undo log):
- Also uses MVCC for consistent reads
- BUT: undo log stores old versions (not inline with table)
- Purge thread cleans undo log (equivalent to VACUUM)
- FOR UPDATE uses row locks (X-locks), not just MVCC

Key difference:
- PostgreSQL stores old versions IN the table → table bloats → VACUUM needed
- MySQL stores old versions IN undo log → undo log grows → purge needed
- Both achieve the same goal: consistent snapshots without read locks
```

---




## T3: Lock Hierarchy & Escalation

### PostgreSQL Lock Types (Simplified)

```
Lock strength (weakest to strongest):
1. AccessShareLock      → SELECT (reading)
2. RowShareLock         → SELECT FOR UPDATE
3. RowExclusiveLock     → INSERT/UPDATE/DELETE
4. ShareLock            → CREATE INDEX (not CONCURRENTLY)
5. AccessExclusiveLock  → ALTER TABLE, DROP TABLE, VACUUM FULL

COMPATIBILITY MATRIX (simplified):
                   | AccessShare | RowExclusive | AccessExclusive |
AccessShareLock    |     ✅      |      ✅      |       ❌        |
RowExclusiveLock   |     ✅      |      ✅      |       ❌        |
AccessExclusiveLock|     ❌      |      ❌      |       ❌        |

WHAT THIS MEANS:
- SELECT and INSERT/UPDATE can run simultaneously ✅
- ALTER TABLE blocks EVERYTHING  ❌
- Two UPDATEs on DIFFERENT rows: no conflict (row-level) ✅
- Two UPDATEs on SAME row: second waits for first to commit

WHY ALTER TABLE IS DANGEROUS:
1. ALTER needs AccessExclusiveLock → waits for ALL current locks to release
2. While waiting, it BLOCKS all new locks (lock queue is FIFO)
3. One slow query + one ALTER = entire table frozen

Solution: SET lock_timeout = '3s'; ALTER TABLE...;
→ If can't acquire lock in 3s, abort instead of queueing
```

### Row-Level Lock Behavior

```
UPDATE accounts SET balance = 100 WHERE id = 42;
→ Locks ONLY row 42 (RowExclusiveLock on the row)
→ Other transactions can freely update rows 1-41 and 43+

But:
UPDATE accounts SET balance = balance * 1.01;
→ Locks ALL rows one by one as it processes them
→ Long-running → holds many row locks → blocks many other updates

For large updates, batch:
UPDATE accounts SET balance = balance * 1.01 WHERE id BETWEEN 1 AND 10000;
COMMIT;
UPDATE accounts SET balance = balance * 1.01 WHERE id BETWEEN 10001 AND 20000;
COMMIT;
-- Each batch holds locks briefly, releases, then next batch
```

---



> 🔬 **Section Challenge — T3: Lock Hierarchy & Escalation**
>
> **Challenge 1 (Reasoning):** Why does `Error` extend `Throwable` separately from `Exception`? When should you catch `Error`?
> <details><summary>Answer</summary>
>
> `Error` represents JVM-level failures: `OutOfMemoryError`, `StackOverflowError`, `VirtualMachineError`. These indicate unrecoverable states. You should almost NEVER catch `Error` — the JVM state is undefined. Only exception: top-level handlers that log the error before terminating gracefully (`catch(Throwable t)` in shutdown hooks). Never catch `Error` in normal application code.
> </details>
>
> **Challenge 2 (Bug Hunt):** `catch(Exception e) { log(e.getMessage()); }` — name 3 things wrong with this.
> <details><summary>Answer</summary>
>
> 1) `e.getMessage()` returns null for some exceptions (NPE, CCE) → NullPointerException in the logger! Use `log(e)` instead to print full stack. 2) Swallowing `Exception` catches runtime bugs (NPE, illegal arg) that should crash/bubble — silent failure is worse than loud failure. 3) No re-throw or meaningful handling — caller has no idea the operation failed.
> </details>
>

## T4: Query Optimizer — Why It Sometimes Ignores Your Index

### Cost-Based Optimization

```
The optimizer doesn't always use your index. It estimates the COST of each plan
and picks the cheapest one.

COST FACTORS:
- Sequential page read: cost = 1.0  (fast, predictable)
- Random page read:     cost = 4.0  (SSD) or 100 (HDD) — seek penalty
- CPU per row:          cost = 0.01
- CPU per operator:     cost = 0.0025

EXAMPLE: Table with 1M rows, query returns 200K rows (20%)

Plan A: Sequential Scan
  = 1M rows × 1.0 seq_page_cost / rows_per_page
  = ~120,000 page reads × 1.0 = cost 120,000

Plan B: Index Scan
  = Index traversal: ~4 pages × 4.0 = 16
  + Heap lookups: 200,000 × random_page_cost = 200,000 × 4.0 = 800,000
  = Total cost: 800,016

The optimizer CORRECTLY chooses Seq Scan because reading 20% of rows 
via random I/O is MORE expensive than reading the entire table sequentially.

RULE OF THUMB:
- < 5% selectivity  → Index Scan (worth random I/O for few rows)
- 5-20% selectivity → Bitmap Index Scan (batch random I/O)
- > 20% selectivity → Seq Scan (sequential is faster)

THIS IS WHY: Adding an index doesn't always help.
If your query returns too many rows, the optimizer correctly ignores the index.
```

### Common Optimizer Mistakes

```
1. STALE STATISTICS:
   Optimizer estimates based on pg_statistics table.
   If not recently ANALYZEd, estimates are wrong → bad plan.
   Fix: ANALYZE table_name; (or ensure autovacuum runs ANALYZE)

2. CORRELATED COLUMNS:
   WHERE country = 'Japan' AND language = 'Japanese'
   Optimizer assumes: P(Japan) × P(Japanese) = 1% × 5% = 0.05%
   Reality: P(Japan AND Japanese) ≈ 0.95% (these are correlated!)
   Underestimates rows → chooses index scan → actually reads many rows
   Fix: CREATE STATISTICS japan_lang ON country, language FROM users;

3. PARAMETERIZED QUERIES (prepared statements):
   First execution with WHERE status = 'rare_status' → index scan plan
   Plan cached. Next call with WHERE status = 'active' (50% of table) → same plan
   But should have been seq scan for 'active'!
   PostgreSQL 12+: Adaptive plan caching (switches after 5 bad generic plans)

4. IMPLICIT TYPE CASTS:
   WHERE varchar_column = 123  -- 123 is integer
   Database can't use index on varchar_column because it must cast each row
   Fix: WHERE varchar_column = '123'
```

---

## T5: WAL (Write-Ahead Log) — How Crash Recovery Works

### The Core Idea

```
PROBLEM: What if the server crashes mid-transaction?
- Some pages written to disk, some not → CORRUPTED DATA

SOLUTION: Write-Ahead Logging
RULE: Before modifying ANY data page, first write the change to a sequential log.

COMMIT SEQUENCE:
1. Write changes to WAL buffer (in memory)
2. fsync WAL to disk (DURABLE — survives crash)
3. Return "COMMIT OK" to application 
4. Write actual data pages to disk (sometime later — asynchronous)

If crash happens between step 2 and 4:
→ Data pages might be inconsistent
→ On restart: replay WAL from last checkpoint → data pages restored
→ ZERO data loss (for committed transactions)

WHY WAL IS FAST:
- WAL = sequential writes (append-only log file)
- Data pages = random writes (scattered across disk)
- Sequential writes are 100x faster than random writes on HDD, 10x on SSD
- So: writing to WAL first is actually FASTER than writing data directly
```

### WAL and Replication

```
WAL is also how replication works:

PRIMARY                              REPLICA
  │                                    │
  ├─ Write WAL ──── send WAL ────────→ Apply WAL
  ├─ Write WAL ──── send WAL ────────→ Apply WAL
  │                                    │
  
Synchronous replication:
  Primary waits until replica confirms WAL received → zero data loss
  Trade-off: higher latency (network round-trip per commit)

Asynchronous replication:
  Primary doesn't wait for replica → lower latency
  Trade-off: replica can be behind → data loss if primary dies

Replication lag = time between primary commit and replica apply
```

---

## T6: Buffer Pool & Memory

### How Database Caching Works

```
The buffer pool is shared memory where the database caches disk pages.

DATABASE MEMORY ARCHITECTURE:
┌──────────────────────────────────────────┐
│            SHARED BUFFERS (RAM)          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │Pg 1│ │Pg 5│ │Pg 12│ │Pg 8│ │... │   │
│  │hot │ │warm│ │cold │ │warm│ │    │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘   │
│                                          │
│  buffer_hit = page found in memory ✅    │
│  buffer_miss = must read from disk ❌    │
└──────────────────────────────────────────┘
              ↕ (read/write)
┌──────────────────────────────────────────┐
│  OS PAGE CACHE (additional caching)      │
└──────────────────────────────────────────┘
              ↕ (read/write)
┌──────────────────────────────────────────┐
│             SSD / HDD                     │
└──────────────────────────────────────────┘

PERFORMANCE DIFFERENCE:
- Buffer hit (RAM):     ~0.001ms (1 microsecond)
- OS cache hit:         ~0.01ms
- SSD read:             ~0.1ms
- HDD random read:      ~5ms (5000x slower than RAM!)

Page Replacement: Clock-sweep algorithm (PostgreSQL) or LRU (MySQL)
- Hot pages (index root nodes, frequently accessed) stay in memory
- Cold pages (rarely accessed old data) get evicted
- Larger shared_buffers → more pages cached → fewer disk reads

SIZING:
- PostgreSQL: shared_buffers = 25% of total RAM (start here)
- MySQL: innodb_buffer_pool_size = 70-80% of total RAM
- Monitor: buffer cache hit ratio should be > 99%
  SELECT sum(heap_blks_hit) / sum(heap_blks_hit + heap_blks_read) * 100
  FROM pg_statio_user_tables;
```

---



> 🔬 **Section Challenge — T6: Buffer Pool & Memory**
>
> **Challenge 1 (Reasoning):** `String a = "hello"; String b = "hello"; a == b` — true or false? What about `new String("hello") == "hello"`?
> <details><summary>Answer</summary>
>
> First: `true` — string literals are interned in the string pool; same literal = same reference. Second: `false` — `new String(...)` always creates a new object on the heap, bypassing the pool. Always use `.equals()` for string comparison. `String.intern()` can explicitly add a string to the pool.
> </details>
>
> **Challenge 2 (Design):** Why is `String` immutable in Java and what problems would mutable strings cause?
> <details><summary>Answer</summary>
>
> Security: strings are used as HashMap keys, class names, file paths. If mutable, a key could change after insertion, corrupting the HashMap. Thread safety: immutable objects are inherently thread-safe (no synchronization needed). String pool: only possible because strings don't change — two vars safely share the same interned object. Caching hashCode: `String` caches its hashCode (first call computes, subsequent calls return cached) — only safe because the string never changes.
> </details>
>

## T7: Transaction Internals — Undo/Redo

### How ACID Actually Works

```
ATOMICITY: "All or nothing"
Implementation: Undo log
- Before modifying a row, save the original value in undo log
- If transaction ROLLS BACK: restore original values from undo log
- If transaction COMMITS: undo log can be discarded (eventually)

DURABILITY: "Committed = permanent"
Implementation: WAL (redo log)
- All changes written to WAL before data files
- If crash occurs: replay WAL to recover all committed changes
- WAL is fsync'd to disk on COMMIT → survives power loss

ISOLATION: "Transactions don't interfere"
Implementation: MVCC snapshots (see T2 above)
- Each transaction reads from its own consistent snapshot
- No need for read locks → high concurrency

CONSISTENCY: "Data always valid"
Implementation: Constraints + triggers
- CHECK, NOT NULL, UNIQUE, FOREIGN KEY
- Verified at statement end (or transaction end for DEFERRED constraints)

THE COMMIT DANCE:
1. BEGIN
2. Modify data (stored in buffer pool, not yet on disk)
3. Write undo log entries (for rollback capability)
4. COMMIT requested
5. Write WAL entries for all changes
6. fsync WAL to disk ← THIS is the "commit point"
7. Return "COMMIT OK" to client
8. (Background) Write dirty pages to disk eventually
9. (Background) Create checkpoint (mark WAL position where all pages are flushed)
```

---



> 🔬 **Section Challenge — T7: Transaction Internals — Undo/Redo**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## T8: Join Algorithms — Reading Execution Plans Like a Senior

### Three Join Algorithms

```
The database optimizer chooses between three join strategies:

1. NESTED LOOP JOIN
   for each row in table A:        ← outer table
       for each row in table B:    ← inner table
           if A.key = B.key: output

   Complexity: O(n × m)  (but with index on inner table: O(n × log m))
   Best for: Small outer table + indexed inner table
   Example: Customer (1 row) JOIN Orders (indexed by customer_id)
   
   EXPLAIN output:
   Nested Loop
     → Index Scan on customers  (1 row)
     → Index Scan on orders using idx_customer_id  (fetched per outer row)

2. HASH JOIN
   Step 1: Build hash table from smaller table
   Step 2: Probe hash table for each row of larger table

   Complexity: O(n + m)  — linear!
   Best for: Large tables without useful indexes
   Memory: Needs hash table in memory (work_mem setting)
   
   EXPLAIN output:
   Hash Join
     → Hash (build side: customers, 10K rows)
     → Seq Scan on orders (probe side: 1M rows)
   
   WARNING: If hash table doesn't fit in work_mem → spills to disk → SLOW

3. MERGE JOIN (Sort-Merge Join)
   Step 1: Sort both tables by join key
   Step 2: Walk through both sorted lists in parallel

   Complexity: O(n log n + m log m) for sort, then O(n + m) for merge
   Best for: Both tables already sorted (by index) + large result
   
   EXPLAIN output:
   Merge Join
     → Index Scan on customers (already sorted by id)
     → Index Scan on orders (already sorted by customer_id)

DECISION MATRIX:
| Condition                          | Optimizer Chooses |
|-----------------------------------|-------------------|
| Small outer + index on inner      | Nested Loop       |
| Large tables, no useful index     | Hash Join         |
| Both sides sorted + large result  | Merge Join        |
| Very small lookup table           | Nested Loop       |
| Equi-join, medium tables          | Hash Join         |
```

### Reading an Execution Plan

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.name, o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.country = 'Japan'
  AND o.created_at > '2025-01-01';

-- RESULT:
Nested Loop  (cost=0.87..125.34 rows=15 width=52) (actual time=0.055..0.234 rows=12 loops=1)
  Buffers: shared hit=48
  ->  Index Scan using idx_customers_country on customers c  (cost=0.43..8.45 rows=3 width=36) 
                                                              (actual time=0.023..0.028 rows=3 loops=1)
        Index Cond: (country = 'Japan')
        Buffers: shared hit=4
  ->  Index Scan using idx_orders_customer_date on orders o  (cost=0.44..38.92 rows=5 width=24) 
                                                              (actual time=0.008..0.062 rows=4 loops=3)
        Index Cond: ((customer_id = c.id) AND (created_at > '2025-01-01'))
        Buffers: shared hit=44

HOW TO READ THIS:
1. Innermost indented items execute first (bottom-up)
2. "loops=3" means this step ran 3 times (once per customer from Japan)
3. "actual rows=4" per loop × 3 loops = 12 total rows (matches top level)
4. "Buffers: shared hit=48" = 48 pages read from RAM (0 from disk = great!)
5. Total time: 0.234ms = excellent performance

RED FLAGS in execution plans:
❌ Seq Scan on large table (> 100K rows) with low actual rows = missing index
❌ Rows Removed by Filter: 500000 = bad selectivity, need better index
❌ Sort + external merge = sort spilled to disk, increase work_mem
❌ Hash Batch > 1 = hash join spilled to disk
❌ loops=100000 = N+1 through nested loop with large outer table
```

---



> 🔬 **Section Challenge — T8: Join Algorithms — Reading Execution Plans Like a Senior**
>
> **Challenge 1 (Reasoning):** `LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?
> <details><summary>Answer</summary>
>
> When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion.
> </details>
>
> **Challenge 2 (Bug Hunt):** `SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?
> <details><summary>Answer</summary>
>
> It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join.
> </details>
>

## 🎓 Theory Quick-Reference Card for Interviews

| Concept | One-Line Explanation | Impress With |
|---------|---------------------|--------------|
| B-Tree depth | 100M rows = 3-4 levels = 3-4 page reads | "Fan-out of ~500 per page keeps trees shallow" |
| MVCC | Old row versions, each txn sees its own snapshot | "Readers never block writers — that's why we need VACUUM" |
| WAL | Sequential log written before data pages | "Durability with sequential I/O — 100x faster than random writes" |
| Buffer pool | RAM cache of disk pages, 99%+ hit rate goal | "If hit ratio drops below 99%, we're I/O bound" |
| Lock queue | FIFO — ALTER TABLE blocks everyone behind it | "That's why we set lock_timeout before DDL statements" |
| Hash join | Build hash table on small side, probe with large | "O(n+m) but needs work_mem for the hash table" |
| Composite index | Left-to-right until gap or range | "Equality columns first, range last — the ERS rule" |
| Statistics | Optimizer decisions based on pg_statistics | "Stale stats → bad plans. ANALYZE refreshes them" |
| Checkpoint | Flushes dirty pages, advances WAL recovery point | "Spacing checkpoints reduces I/O spikes but increases recovery time" |

---

[⬅ Previous: 46_Interview_Scenarios_Part3](46_Interview_Scenarios_Explained_Part3.md) | [📚 Index](00_INDEX.md) | [Next: 48_Problem_Variants_Bank ➡](48_Problem_Variants_Bank.md)

---

## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |

---

## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>

