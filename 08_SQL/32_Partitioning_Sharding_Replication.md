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

> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](31_JSON_XML_Modern_SQL.md) | [Next >](33_SQL_Security_Injection.md)
