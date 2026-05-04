**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [SQL Guide](01_Foundations_Database_Basics.md)
🧠 **Mental Model**: See [System Design Thinking](../14_Mental_Models/15_System_Design_Thinking.md)

---

# ⚙️ Database Internals — How Databases Actually Work

Know what happens beneath your SQL queries — B-Trees, WAL, MVCC, Buffer Pool, Query Plans

---

## Part 1: Storage Engines — The Heart of a Database




## B-Tree   │  Lsm-Tree

| Read speed  |   Fast    |   Slower  | (may check multiple SSTables) |
| Write speed |   Slower  |   Fast    | (sequential writes, no random I/O) |
| Space amp.  |   Lower   |   Higher  | (old versions in SSTables) |
| Write amp.  |   Lower   |   Higher  | (compaction rewrites data) |

---

## Part 2: B-Tree Deep Dive

```
  B-Tree of order 4 (max 3 keys per node):

              [     30     |     70     ]             ← Root
             /             |             \
    [10 | 20]          [40 | 50 | 60]      [80 | 90]  ← Internal
    / |  \            / |  |    \         / |  \
  [5][15][25]      [35][45][55][65]   [75][85][95]       ← Leaf (data pages)

  LOOKUP "55":
  Root: 55 > 30, 55 < 70 → go middle child
  Internal: 55 > 50, 55 < 60 → go third child
  Leaf: Found 55! → return row data

  TIME: O(log N) — tree height is typically 3-4 for millions of rows
  Height 4 B-Tree with branching factor 500:
  → 500^4 = 62.5 BILLION rows accessible in 4 disk reads!

  HOW INSERTS WORK:
  1. Find correct leaf page
  2. If page has space → insert in sorted order
  3. If page is full → SPLIT into two half-full pages
     → Propagate new key up to parent
     → If parent is full → split again (cascades up)
```


### Clustered vs Non-Clustered Index

CLUSTERED INDEX (Primary Key):
→ Table data is PHYSICALLY sorted by this key on disk
→ Only ONE per table (you can only sort data one way)
→ Leaf pages contain the ACTUAL ROW data

NON-CLUSTERED INDEX (Secondary):
→ Separate B-Tree with its own leaf pages
→ Leaf pages contain: index key + pointer to actual row
→ Lookup: find key in index B-Tree → follow pointer to row
→ Extra hop = slightly slower than clustered

COVERING INDEX:
→ Index contains ALL columns needed by query
→ No need to visit actual table row! (index-only scan)
→ CREATE INDEX idx ON orders(customer_id) INCLUDE (total, status)


---

## Part 3: Write-Ahead Log (WAL)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  THE PROBLEM: Crash during write → data corruption                              │
│                                                                                 │
│  THE SOLUTION: Write-Ahead Logging                                              │
│                                                                                 │
│  RULE: BEFORE modifying any data page, write the change to a log file           │
│                                                                                 │
│  UPDATE accounts SET balance = 500 WHERE id = 1;                                │
│                                                                                 │
│  Step 1: Write to WAL:  "Page 42, offset 100: change 300 → 500"                 │
│  Step 2: Modify page in memory (buffer pool)                                    │
│  Step 3: Acknowledge to client: "COMMIT OK"                                     │
│  Step 4: Eventually flush dirty pages to disk (checkpoint)                      │
│                                                                                 │
│  If crash after step 1, before step 4:                                          │
│  → On restart, REPLAY WAL to reconstruct lost changes                           │
│  → Data is safe because WAL was written to disk first                           │
│                                                                                 │
│  WAL is sequential writes (fast!) vs random writes to data pages (slow)         │
│                                                                                 │
│  PostgreSQL: pg_wal/ directory                                                  │
│  MySQL InnoDB: ib_logfile0, ib_logfile1 (redo log)                              │
│  Also called: redo log, transaction log, journal                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

## Part 4: MVCC (Multi-Version Concurrency Control)

## Version  │ Balance │ Created   │ Expired

| v1       | $100    | txn 10    | txn 20 |
| v2       | $150    | txn 20    | txn 35 |
| v3       | $200    | txn 35    | —         | ← current |

---

## Part 5: Buffer Pool & Memory Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Database doesn't read disk for every query — pages cached in memory            │
│                                                                                 │
│  ┌─────────── Buffer Pool (RAM) ──────────┐       ┌─── Disk ───┐                │
│  │  Page 1  Page 5  Page 12  Page 3  ...  │       │  Data files │               │
│  │  (clean) (dirty) (clean)  (dirty)      │       │  (tables,   │               │
│  └────────────────────────────────────────┘       │   indexes)  │               │
│                                                    └─────────────┘              │
│                                                                                 │
│  DIRTY PAGE: Modified in memory but not yet written to disk                     │
│  CLEAN PAGE: Same as on-disk version                                            │
│                                                                                 │
│  EVICTION: When buffer pool is full and new page needed:                        │
│  → LRU (Least Recently Used) or Clock algorithm                                 │
│  → If evicting dirty page → write to disk first, then evict                     │
│                                                                                 │
│  CHECKPOINT: Periodically write ALL dirty pages to disk                         │
│  → Reduces WAL replay needed on crash recovery                                  │
│  → Trade-off: more frequent checkpoints = faster recovery but more I/O          │
│                                                                                 │
│  TUNING: Buffer pool size is THE most important DB tuning parameter             │
│  → PostgreSQL: shared_buffers (25% of RAM typical)                              │
│  → MySQL: innodb_buffer_pool_size (80% of RAM for dedicated DB server)          │
│  → Goal: keep working set in memory → minimize disk I/O                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---



🔬 **Section Challenge — Part 5: Buffer Pool & Memory Management**

**Challenge 1 (Reasoning):** `String a = "hello"; String b = "hello"; a == b` — true or false? What about `new String("hello") == "hello"`?
<details><summary>Answer</summary>

First: `true` — string literals are interned in the string pool; same literal = same reference. Second: `false` — `new String(...)` always creates a new object on the heap, bypassing the pool. Always use `.equals()` for string comparison. `String.intern()` can explicitly add a string to the pool.
</details>

**Challenge 2 (Design):** Why is `String` immutable in Java and what problems would mutable strings cause?
<details><summary>Answer</summary>

Security: strings are used as HashMap keys, class names, file paths. If mutable, a key could change after insertion, corrupting the HashMap. Thread safety: immutable objects are inherently thread-safe (no synchronization needed). String pool: only possible because strings don't change — two vars safely share the same interned object. Caching hashCode: `String` caches its hashCode (first call computes, subsequent calls return cached) — only safe because the string never changes.
</details>


## Part 6: Query Execution — How SELECT Actually Works

## Algorithm        │ Complexity  │ When Used

| Nested Loop      | O(N × M)   | Small tables, or inner has index |
| Hash Join        | O(N + M)   | Large tables, no useful index |
| Merge Join       | O(N + M)   | Both inputs already sorted |

---

## Part 6.1: Query Optimizer Cost Models

```
When you run a SELECT, the database must decide HOW to execute it.
It does this by calculating a "Cost" for every possible execution plan.

Cost is calculated based on:
1. Disk I/O cost (fetching pages from disk is slow)
2. CPU cost (evaluating conditions, sorting, hashing)
3. Memory cost

HOW IT WORKS:
1. Parser: SQL → Parse Tree (Validates syntax)
2. Analyzer: Resolves table/column names, checks permissions
3. Rewriter: Flattens views, simplifies expressions (e.g., 1=1 is removed)
4. OPTIMIZER: Generates plans.
   - Should it use Index A or Index B?
   - Should it do a Hash Join or Nested Loop Join?
   - In what order should it join 5 tables? (5! = 120 possible orders)

STATISTICS ARE EVERYTHING:
The optimizer relies on table statistics:
- Number of rows
- Number of distinct values in a column (Cardinality)
- Data distribution (Histograms)

If statistics are wrong (e.g., you just inserted 10 million rows but didn't run ANALYZE),
the optimizer might choose a terrible plan (like doing a full table scan instead of using an index).
```

---

## Part 6.2: Deep Dive into LSM-Trees & Compaction

```
B-Trees are terrible for pure write workloads (every insert requires random disk I/O to update a specific leaf page).
NoSQL databases (Cassandra, RocksDB, LevelDB) and some SQL engines use LSM-Trees:

1. THE MEMTABLE (In-Memory)
All writes go to an in-memory Red-Black tree or Skip List. Very fast!
Writes are also appended to a WAL for durability.

2. FLUSH TO SSTABLE (Disk)
When MemTable is full (e.g., 64MB), it is written to disk as a sorted file called an SSTable.
Once written, SSTables are IMMUTABLE. Never modified again.

3. HOW DO YOU READ?
Search MemTable first.
If not found, search the newest SSTable, then the next newest, etc.
Wait, reading 100 SSTables on disk is slow!
→ SOLUTION: BLOOM FILTERS. A tiny bitset in RAM that tells us "100% NOT in this file" or "Maybe in this file".
We only check files where the Bloom Filter says "Maybe".

4. COMPACTION
Over time, you get thousands of SSTables. Reads get slow.
Background threads run COMPACTION: take 10 old SSTables, merge-sort them together into 1 new, larger SSTable,
and delete the old ones. This reclaims space from updated/deleted rows (tombstones).
```

---




## Part 6.3: Buffer Pool Advanced Architecture

```
A database isn't just an array of cached pages. The Buffer Pool has complex internal lists:

1. FREE LIST: Empty pages ready to be used.
2. LRU LIST (Least Recently Used): 
   - Tracks which pages are hot (frequently accessed) vs cold.
   - When Free List is empty, evict the coldest page from LRU.
3. FLUSH LIST: Dirty pages (modified in memory, not yet on disk), sorted by oldest modification.

THE DATABASE CHECKPOINT:
If the system crashes, we have to replay the WAL. But replaying a 100GB WAL takes hours.
A Checkpoint is a background thread that wakes up and says:
"Write all dirty pages from the Flush List to actual disk files."
Once written, it writes a "Checkpoint Record" to the WAL.
If a crash happens, we only replay the WAL starting from the LAST CHECKPOINT!

THE DOUBLEWRITE BUFFER (MySQL InnoDB):
Disk pages are usually 16KB. OS file systems write in 4KB chunks.
If power fails exactly halfway through writing a 16KB page, the page is CORRUPTED.
Solution: InnoDB writes the 16KB page to a sequential "Doublewrite Buffer" on disk first.
Then it writes it to the actual `.ibd` data file. 
If corruption happens during the data file write, it recovers the clean copy from the doublewrite buffer.
```

---



🔬 **Section Challenge — Part 6.3: Buffer Pool Advanced Architecture**

**Challenge 1 (Reasoning):** `String a = "hello"; String b = "hello"; a == b` — true or false? What about `new String("hello") == "hello"`?
<details><summary>Answer</summary>

First: `true` — string literals are interned in the string pool; same literal = same reference. Second: `false` — `new String(...)` always creates a new object on the heap, bypassing the pool. Always use `.equals()` for string comparison. `String.intern()` can explicitly add a string to the pool.
</details>

**Challenge 2 (Design):** Why is `String` immutable in Java and what problems would mutable strings cause?
<details><summary>Answer</summary>

Security: strings are used as HashMap keys, class names, file paths. If mutable, a key could change after insertion, corrupting the HashMap. Thread safety: immutable objects are inherently thread-safe (no synchronization needed). String pool: only possible because strings don't change — two vars safely share the same interned object. Caching hashCode: `String` caches its hashCode (first call computes, subsequent calls return cached) — only safe because the string never changes.
</details>


## Part 7: Interview Quick-Fire

```
Q: "What is a B-Tree and why do databases use it?"
A: Self-balancing tree where each node holds multiple keys and pointers.
   Minimizes disk I/O — height 3-4 covers billions of rows.
   O(log N) lookup, insert, delete.

Q: "What is WAL?"
A: Write-Ahead Log — changes written to log before data pages.
   Ensures durability: if crash, replay log to recover.
   Sequential writes to log are fast; random writes to pages deferred.

Q: "Explain MVCC."
A: Keep old row versions. Readers see snapshot, writers create new version.
   No reader-writer blocking. Garbage collector cleans old versions.
   Basis for isolation levels: Read Committed vs Repeatable Read.

Q: "Why is my query slow?"
A: Run EXPLAIN ANALYZE. Common causes:
   1. Missing index → sequential scan on large table
   2. Bad join order → optimizer chose wrong plan
   3. Outdated statistics → ANALYZE/UPDATE STATISTICS
   4. Too many rows returned → check WHERE predicates
   5. Lock contention → check for long-running transactions
```


