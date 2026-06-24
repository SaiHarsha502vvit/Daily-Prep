> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](31_JSON_XML_Modern_SQL.md) | [Next >](33_SQL_Security_Injection.md)

# Chapter 32 — Partitioning, Sharding & Replication

## 5W-H Framework

- **WHO** needs this? → Senior backend devs, DBAs, system architects scaling beyond a single DB
- **WHAT** is it? → Strategies to split data across partitions/servers for performance & availability
- **WHEN** to use? → Tables > 100M rows, read-heavy apps needing replicas, global apps needing locality
- **WHERE** is it used? → E-commerce (orders by date), SaaS (data by tenant), analytics (warehouse partitions)
- **WHY** learn it? → A single server has limits — these are the ONLY ways to scale a relational DB
- **HOW** does it work? → Partition = split table on one server; Shard = split across servers; Replica = copy

---

## Part 1 — Table Partitioning

### 1.1 What Is Partitioning?

```
Without partitioning:                    With partitioning:
┌──────────────────────┐        ┌──────────────┐ ┌──────────────┐
│    orders (500M rows)│        │ orders_2024  │ │ orders_2025  │
│                      │  →     │  (200M rows) │ │  (180M rows) │
│ Full table scan = 💀 │        └──────────────┘ └──────────────┘
└──────────────────────┘        ┌──────────────┐ ┌──────────────┐
                                │ orders_2026  │ │ orders_2027  │
   Query for 2026 data:         │  (100M rows) │ │  (20M rows)  │
   scans ALL 500M rows          └──────────────┘ └──────────────┘

                                Query for 2026 data:
                                scans ONLY 100M rows = 5x faster!

This is PARTITION PRUNING — the DB skips irrelevant partitions.
```

### 1.2 Range Partitioning (Most Common)

```sql
-- PostgreSQL: Declarative partitioning (v10+)
CREATE TABLE orders (
    order_id    BIGSERIAL,
    customer_id INT,
    order_date  DATE NOT NULL,
    amount      DECIMAL(12,2),
    status      VARCHAR(20)
) PARTITION BY RANGE (order_date);

-- Create partitions
CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE orders_2026 PARTITION OF orders
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Create indexes on each partition
CREATE INDEX idx_orders_2024_date ON orders_2024 (order_date);
CREATE INDEX idx_orders_2025_date ON orders_2025 (order_date);
CREATE INDEX idx_orders_2026_date ON orders_2026 (order_date);

-- Queries automatically route to correct partition
SELECT * FROM orders WHERE order_date = '2026-03-15';
-- PostgreSQL ONLY scans orders_2026!

-- EXPLAIN shows partition pruning
EXPLAIN SELECT * FROM orders WHERE order_date BETWEEN '2026-01-01' AND '2026-06-30';
-- Append → Seq Scan on orders_2026  (1 partition scanned, 2 pruned)
```

### 1.3 List Partitioning

```sql
-- Partition by region
CREATE TABLE customers (
    id          SERIAL,
    name        VARCHAR(100),
    region      VARCHAR(20) NOT NULL,
    email       VARCHAR(200)
) PARTITION BY LIST (region);

CREATE TABLE customers_americas PARTITION OF customers FOR VALUES IN ('US', 'CA', 'BR', 'MX');
CREATE TABLE customers_europe   PARTITION OF customers FOR VALUES IN ('UK', 'DE', 'FR', 'ES');
CREATE TABLE customers_asia     PARTITION OF customers FOR VALUES IN ('IN', 'JP', 'CN', 'KR');
CREATE TABLE customers_default  PARTITION OF customers DEFAULT;  -- Catch-all
```

### 1.4 Hash Partitioning

```sql
-- Even distribution when no natural range/list exists
CREATE TABLE sessions (
    session_id  UUID NOT NULL,
    user_id     INT,
    data        JSONB,
    created_at  TIMESTAMP
) PARTITION BY HASH (session_id);

-- Create 4 hash partitions
CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

### 1.5 MySQL Partitioning

```sql
-- MySQL uses different syntax
CREATE TABLE logs (
    id          BIGINT AUTO_INCREMENT,
    log_date    DATE NOT NULL,
    message     TEXT,
    level       ENUM('INFO','WARN','ERROR'),
    PRIMARY KEY (id, log_date)  -- Partition key MUST be in PK
) PARTITION BY RANGE (YEAR(log_date)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
);

-- Drop old data instantly (vs DELETE which is slow)
ALTER TABLE logs DROP PARTITION p2024;
-- Instant! No row-by-row delete. This is a MAJOR advantage.
```

### 1.6 Partition Maintenance

```sql
-- PostgreSQL: Add new partition for next year
CREATE TABLE orders_2027 PARTITION OF orders
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Detach old partition (archive)
ALTER TABLE orders DETACH PARTITION orders_2024;
-- orders_2024 still exists as standalone table — move to cold storage

-- Attach existing table as partition
ALTER TABLE orders ATTACH PARTITION orders_archive
    FOR VALUES FROM ('2020-01-01') TO ('2024-01-01');
```

---

> 🔬 **Section Challenge — Part 1 — Table Partitioning**
>
> **Challenge 1 (Partition Pruning Failure):** You partitioned a massive `orders` table by `RANGE (order_date)`. A developer writes the following query to find orders in Q1: `SELECT * FROM orders WHERE EXTRACT(MONTH FROM order_date) IN (1,2,3);`. The DBA notices this is causing a full table scan across _all_ partitions. Why did partition pruning fail, and how do you fix the query?
>
> <details><summary>Answer</summary>
>
> Partition pruning relies on the database optimizer being able to statically evaluate the boundaries during the query planning phase. Wrapping the partition key (`order_date`) inside a function like `EXTRACT()` makes the condition non-sargable (Search Argument Able). The optimizer cannot evaluate the function against the partition boundaries without executing it on every single row, forcing a full scan across all partitions.
>
> **The Fix:** Query against the raw column values so the optimizer can prune:
> `WHERE order_date >= '2024-01-01' AND order_date < '2024-04-01';`
>
> </details>

## Part 2 — Database Sharding

### 2.1 What Is Sharding?

```
Partitioning = ONE server, multiple table segments
Sharding     = MULTIPLE servers, each holds a slice of data

┌──────────────────────────────────────────────────────┐
│                    Application                        │
│              (Shard Router / Proxy)                    │
└──────────┬──────────┬──────────┬────────────────────┘
           │          │          │
    ┌──────▼──┐ ┌─────▼───┐ ┌───▼──────┐
    │ Shard 1 │ │ Shard 2 │ │ Shard 3  │
    │ Users   │ │ Users   │ │ Users    │
    │ A-H     │ │ I-P     │ │ Q-Z      │
    │ 10M     │ │ 10M     │ │ 10M      │
    └─────────┘ └─────────┘ └──────────┘
    Server 1    Server 2    Server 3
```

### 2.2 Sharding Strategies

```
┌─────────────────┬──────────────────────────────────────┐
│ Strategy        │ Description                           │
├─────────────────┼──────────────────────────────────────┤
│ Range-based     │ user_id 1-1M → Shard 1               │
│                 │ user_id 1M-2M → Shard 2              │
│                 │ ❌ Hotspots if new users = most active │
├─────────────────┼──────────────────────────────────────┤
│ Hash-based      │ shard = hash(user_id) % N             │
│                 │ ✅ Even distribution                   │
│                 │ ❌ Hard to add/remove shards           │
├─────────────────┼──────────────────────────────────────┤
│ Directory-based │ Lookup table: user_id → shard_id      │
│                 │ ✅ Most flexible                       │
│                 │ ❌ Lookup table = single point of fail │
├─────────────────┼──────────────────────────────────────┤
│ Geographic      │ US users → US shard                   │
│                 │ EU users → EU shard                   │
│                 │ ✅ Data locality + compliance         │
└─────────────────┴──────────────────────────────────────┘
```

### 2.3 Application-Level Sharding (Python)

```python
import hashlib

SHARD_CONFIG = {
    0: "postgresql://user:pass@shard0.db.example.com/mydb",
    1: "postgresql://user:pass@shard1.db.example.com/mydb",
    2: "postgresql://user:pass@shard2.db.example.com/mydb",
    3: "postgresql://user:pass@shard3.db.example.com/mydb",
}
NUM_SHARDS = len(SHARD_CONFIG)

def get_shard_id(user_id: int) -> int:
    """Consistent hash to determine shard."""
    hash_val = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
    return hash_val % NUM_SHARDS

def get_connection(user_id: int):
    shard_id = get_shard_id(user_id)
    return create_engine(SHARD_CONFIG[shard_id])


> 🔬 **Section Challenge — Part 2 — Database Sharding**
>
> **Challenge 1 (The Hot Shard Anti-Pattern):** You are building a B2B SaaS application and decide to shard your database by `tenant_id` (each company gets their data on a specific shard based on a hash of their ID). A year later, one of your customers becomes an enterprise giant, generating 100x more traffic than the others. Your Shard 2 CPU hits 100%, taking down that customer and 400 small customers sharing that shard. What architectural sharding rule did you violate, and how is this resolved?
>
> <details><summary>Answer</summary>
>
> This violates the rule of **Even Data/Compute Distribution** by failing to account for "Whale Tenants" (the Hot Shard problem).
>
> A static hash of `tenant_id` assumes all tenants have roughly equal load. To resolve this, you must migrate from Hash-based to **Directory-based (Lookup) Sharding**. The enterprise tenant is isolated onto their own dedicated shard (or multiple shards if you shard by `tenant_id + user_id`), while the lookup table routes the smaller tenants to shared shards.
> </details>

# Query a specific user → goes to ONE shard
def get_user(user_id):
    engine = get_connection(user_id)
    return pd.read_sql(
        "SELECT * FROM users WHERE user_id = %s", engine, params=[user_id]
    )

# Cross-shard query → must fan out to ALL shards
def count_all_users():
    total = 0
    for shard_id, conn_str in SHARD_CONFIG.items():
        engine = create_engine(conn_str)
        result = pd.read_sql("SELECT COUNT(*) AS cnt FROM users", engine)
        total += result['cnt'][0]
    return total
```

### 2.4 Cross-Shard Challenges

```
Problem                    | Solution
───────────────────────────┼──────────────────────────────
JOINs across shards        | Denormalize or use CDC
Global unique IDs          | UUID, Snowflake IDs, ULID
Transactions across shards | 2-phase commit (slow), Saga pattern
Rebalancing shards         | Consistent hashing, virtual shards
Aggregations (COUNT, AVG)  | Fan-out queries + merge in app
Foreign keys               | Not enforceable across shards
```

---

## Part 3 — Database Replication

### 3.1 Replication Types

```
┌──────────────────────────────────────────────────────────┐
│ SYNCHRONOUS REPLICATION                                   │
│ ┌────────┐   write   ┌────────┐                          │
│ │ Primary │ ──────── │ Replica │  Primary waits for       │
│ │  (R/W)  │ ◄─ ACK ─ │  (R/O)  │  replica to confirm     │
│ └────────┘           └────────┘  ✅ Zero data loss        │
│                                  ❌ Slower writes          │
├──────────────────────────────────────────────────────────┤
│ ASYNCHRONOUS REPLICATION                                  │
│ ┌────────┐   write   ┌────────┐                          │
│ │ Primary │ ─────── │ Replica │  Primary doesn't wait    │
│ │  (R/W)  │  (lag)   │  (R/O)  │  ✅ Fast writes          │
│ └────────┘           └────────┘  ❌ Possible data loss    │
├──────────────────────────────────────────────────────────┤
│ SEMI-SYNCHRONOUS                                          │
│ Primary waits for AT LEAST ONE replica to ACK             │
│ Compromise between sync and async                         │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Read Replica Architecture

```sql
-- PostgreSQL: Set up streaming replication

-- On PRIMARY (postgresql.conf):
-- wal_level = replica
-- max_wal_senders = 5
-- wal_keep_size = 1024  (MB)

-- On PRIMARY (pg_hba.conf):
-- host replication repl_user replica_ip/32 md5

-- On REPLICA (recovery.conf or standby.signal):
-- primary_conninfo = 'host=primary_ip user=repl_user password=secret'
-- primary_slot_name = 'replica_slot'

-- Create replication slot on primary
SELECT pg_create_physical_replication_slot('replica_slot');

-- Check replication lag
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag_human
FROM pg_stat_replication;
```

### 3.3 Python: Read/Write Splitting

```python
from sqlalchemy import create_engine
from contextlib import contextmanager

PRIMARY = create_engine("postgresql://user:pass@primary:5432/mydb")
REPLICAS = [
    create_engine("postgresql://user:pass@replica1:5432/mydb"),
    create_engine("postgresql://user:pass@replica2:5432/mydb"),
]

import itertools
replica_cycle = itertools.cycle(REPLICAS)  # Round-robin

@contextmanager
def read_connection():
    """Route reads to a replica (round-robin)."""
    engine = next(replica_cycle)
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def write_connection():
    """Route writes to the primary."""
    conn = PRIMARY.connect()
    try:
        yield conn
    finally:
        conn.close()

# Usage
with read_connection() as conn:
    users = pd.read_sql("SELECT * FROM users WHERE active = true", conn)

with write_connection() as conn:
    conn.execute("UPDATE users SET last_login = NOW() WHERE id = 42")
```

---

## Part 4 — Monitoring & Troubleshooting

### 4.1 Partition Performance

```sql
-- Check partition sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_table_size(schemaname || '.' || tablename)) AS data_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE tablename LIKE 'orders_%'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Verify partition pruning is working
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE order_date = '2026-06-15';
-- Look for: "Partitions pruned: 2" or "Subplans Removed: 2"
```

### 4.2 Python: Shard Health Dashboard

```python
import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy import create_engine

shards = {
    'Shard 0': "postgresql://user:pass@shard0/mydb",
    'Shard 1': "postgresql://user:pass@shard1/mydb",
    'Shard 2': "postgresql://user:pass@shard2/mydb",
    'Shard 3': "postgresql://user:pass@shard3/mydb",
}

stats = []
for name, conn_str in shards.items():
    engine = create_engine(conn_str)
    row_count = pd.read_sql("SELECT COUNT(*) AS n FROM users", engine)['n'][0]
    db_size = pd.read_sql("SELECT pg_database_size(current_database()) AS s", engine)['s'][0]
    stats.append({'shard': name, 'rows': row_count, 'size_mb': db_size / 1024 / 1024})

df = pd.DataFrame(stats)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
df.plot.bar(x='shard', y='rows', ax=axes[0], color='steelblue', legend=False)
axes[0].set_title('Row Distribution Across Shards')
axes[0].set_ylabel('Row Count')

df.plot.bar(x='shard', y='size_mb', ax=axes[1], color='coral', legend=False)
axes[1].set_title('Storage per Shard (MB)')
axes[1].set_ylabel('Size (MB)')

plt.tight_layout()
plt.show()
```

---

> 🔬 **Section Challenge — Part 4 — Monitoring & Troubleshooting**
>
> **Challenge 1 (Replication Lag Trap):** You have a Primary DB for writes and a Read Replica for analytics. A user updates their profile picture (write to Primary), and the UI instantly redirects them to their profile page (read from Replica). The user sees their _old_ picture and submits a bug report. What is this phenomenon called, and what are two standard architectural solutions?
>
> <details><summary>Answer</summary>
>
> This is called **Read-After-Write Inconsistency**, caused by Asynchronous Replication Lag. The write reached the Primary, but the Read Replica hasn't replayed the WAL (Write-Ahead Log) yet.
>
> **Solutions:**
>
> 1. **Write-Path Caching:** When the user updates the profile, cache the new picture URL in Redis/Browser. The UI reads from the cache first, falling back to the replica.
> 2. **Session Consistency (Sticky Routing):** Route all read queries from a user to the Primary for _N_ seconds after they perform a write, then fall back to the Read Replica once replication has caught up.
> </details>

## Decision Matrix

```
When to use WHAT:
┌──────────────────┬──────────────────────────────────────┐
│ Situation        │ Solution                              │
├──────────────────┼──────────────────────────────────────┤
│ Table > 100M rows│ Partitioning (range by date)          │
│ Single server OK │                                       │
├──────────────────┼──────────────────────────────────────┤
│ Single server    │ Sharding (application or proxy)       │
│ is not enough    │                                       │
├──────────────────┼──────────────────────────────────────┤
│ Read-heavy app   │ Read replicas (1 primary + N replica) │
│ > 80% reads      │                                       │
├──────────────────┼──────────────────────────────────────┤
│ Write-heavy app  │ Sharding (split writes across nodes)  │
│ > 50% writes     │                                       │
├──────────────────┼──────────────────────────────────────┤
│ High availability│ Multi-AZ replication + auto failover  │
│ (99.99% uptime)  │                                       │
├──────────────────┼──────────────────────────────────────┤
│ Regulatory/GDPR  │ Geographic sharding (data residency)  │
└──────────────────┴──────────────────────────────────────┘
```

---

### Historical Evolution

**Predecessors (with years):**
- **Partitioning (Oracle)** (1996): Oracle 8 introduced table partitioning for manageability and performance of large tables
- **Master-slave replication (MySQL)** (2000): MySQL replication enabled read scaling and high availability using binary log shipping
- **Sharding (Fowler)** (2003): Martin Fowler's writings formalized sharding patterns for horizontal database scaling
- **MongoDB sharding** (2010): MongoDB pioneered automatic sharding with chunk distribution and rebalancing
- **Semi-sync replication (MySQL)** (2007): MySQL introduced semi-synchronous replication for stronger consistency guarantees
- **Vitess (YouTube)** (2013): YouTube open-sourced Vitess, proving sharding could work at massive scale with SQL compatibility

**Evolution narrative:**
Database scaling evolved from vertical growth (bigger servers) toward horizontal distribution. Oracle partitioning (1996) first addressed large table management by allowing logical sub-tables. MySQL replication (2000) enabled read scaling but faced consistency challenges. Fowler's sharding patterns (2003) formalized data distribution strategies, and MongoDB (2010) built automatic sharding into its distributed database. Vitess (2013) demonstrated that MySQL sharding could handle YouTube-scale workloads while maintaining SQL compatibility.

**Modern practice anchor:**
Modern database scaling combines partitioning for data lifecycle management, read replicas for read scaling, and application-level or proxy sharding for write scaling—often using cloud-native managed databases that handle distribution automatically.

---

## Reality Check

**"Partitioning always speeds up queries"** → Partitioning improves performance ONLY when queries filter on the partition key (partition pruning — the planner skips irrelevant partitions). A query without a filter on the partition key scans ALL partitions — potentially slower than a single table due to planning overhead. Partitioning also adds complexity: FOREIGN KEY constraints cannot reference partitioned tables in PostgreSQL (as of v15). Partitioning is most useful for: time-series data (partition by month, archive old partitions), very large tables where you want to DROP old partitions instead of DELETE.

**"Sharding is just database partitioning at a larger scale"** → Partitioning splits a table across multiple physical locations within the SAME database instance. Sharding distributes data across MULTIPLE independent database instances (each shard is a separate DB server). Sharding requires: application-level routing (which shard holds this user?), cross-shard queries (JOINs across shards are very hard or impossible), distributed transactions (expensive), schema migration complexity (migrate all shards). Only introduce sharding when a single database cannot handle the load — it adds significant operational complexity.

**"Replication provides both high availability and read scaling"** → Replication provides both, but with trade-offs. Asynchronous replication (default in most setups): low latency writes, possible data loss on primary failure, reads from replica may be stale (replication lag). Synchronous replication: no data loss, but write latency includes replica acknowledgment. Read scaling from replicas works only when reads can tolerate stale data. Use replicas for analytics/reporting (stale OK) but not for "just wrote and immediately read back" patterns.

**"Connection pooling is optional for small applications"** → Database connections are expensive: TCP handshake + TLS + authentication + session setup = ~50-200ms per connection. Applications that open a new connection per request will hit connection limits quickly and suffer latency. Connection pooling (PgBouncer for PostgreSQL, ProxySQL for MySQL, HikariCP in Java) reuses connections. Even small applications should use a connection pool — the default Spring Boot HikariCP configuration does this automatically. The connection limit is per-database-server; a connection pool multiplexes many application threads through few actual connections.

**"Replication lag is always small (milliseconds)"** → Replication lag depends on: write throughput (high-write primary builds a queue of WAL/binlog to replay), replica hardware (slower I/O = slower replay), network latency (cross-region replication adds RTT), long-running transactions (WAL cannot advance past an open transaction on the primary). During a high-write event (data migration, bulk import), replication lag can reach seconds, minutes, or hours. Monitor lag with `pg_stat_replication` (PostgreSQL) or `SHOW SLAVE STATUS` (MySQL). Applications reading from replicas must handle stale reads gracefully.
