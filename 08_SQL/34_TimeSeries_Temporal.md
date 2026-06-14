> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](33_SQL_Security_Injection.md) | [Next >](35_Database_Migration_Schema.md)

# Chapter 34 — Time Series & Temporal Data

## 5W-H Framework

- **WHO** needs this? → IoT devs, financial analysts, DevOps (metrics), data engineers
- **WHAT** is it? → Storing and querying data indexed by time — logs, stock prices, sensor readings
- **WHEN** to use? → Monitoring dashboards, financial analysis, IoT telemetry, user activity tracking
- **WHERE** is it used? → TimescaleDB, InfluxDB concepts applied in PostgreSQL/MySQL, data warehouses
- **WHY** learn it? → Most real-world data IS time-series — mastering it = mastering modern analytics
- **HOW** does it work? → Time-indexed tables + window functions + gap filling + downsampling

---

## Part 1 — Time-Series Table Design

### 1.1 Schema Patterns

```sql
-- Pattern 1: Wide table (metrics as columns)
CREATE TABLE server_metrics (
    timestamp    TIMESTAMPTZ NOT NULL,
    server_id    INT NOT NULL,
    cpu_percent  DECIMAL(5,2),
    memory_mb    INT,
    disk_io_ops  INT,
    network_mbps DECIMAL(8,2),
    PRIMARY KEY (timestamp, server_id)
);

-- Pattern 2: Narrow/EAV table (flexible metrics)
CREATE TABLE metric_values (
    timestamp    TIMESTAMPTZ NOT NULL,
    metric_name  VARCHAR(100) NOT NULL,
    source       VARCHAR(100) NOT NULL,
    value        DOUBLE PRECISION,
    tags         JSONB DEFAULT '{}',
    PRIMARY KEY (timestamp, metric_name, source)
);

-- Pattern 3: TimescaleDB hypertable (if using TimescaleDB extension)
-- CREATE EXTENSION timescaledb;
-- SELECT create_hypertable('server_metrics', 'timestamp');
```

### 1.2 Indexing for Time-Series

```sql
-- BRIN index: perfect for time-ordered append-only data
-- 1000x smaller than B-tree, almost as fast for range scans
CREATE INDEX idx_metrics_time_brin ON server_metrics
    USING BRIN (timestamp);

-- Composite index for common queries
CREATE INDEX idx_metrics_server_time ON server_metrics (server_id, timestamp DESC);

-- Partial index for recent data (most queries are recent)
CREATE INDEX idx_metrics_recent ON server_metrics (timestamp DESC)
    WHERE timestamp >= NOW() - INTERVAL '7 days';
```

---

## Part 2 — Essential Time-Series Queries

### 2.1 Downsampling (Bucketing)

```sql
-- Raw data: 1 reading per second (86,400 per day per server)
-- Downsample to 5-minute averages
SELECT
    date_trunc('hour', timestamp)
        + (extract(minute FROM timestamp)::int / 5) * interval '5 min' AS bucket,
    server_id,
    AVG(cpu_percent) AS avg_cpu,
    MAX(cpu_percent) AS max_cpu,
    MIN(cpu_percent) AS min_cpu,
    AVG(memory_mb) AS avg_memory,
    COUNT(*) AS sample_count
FROM server_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY bucket, server_id
ORDER BY bucket DESC;

-- PostgreSQL: generate_series for regular time buckets
SELECT
    bucket,
    COALESCE(AVG(sm.cpu_percent), 0) AS avg_cpu
FROM generate_series(
    NOW() - INTERVAL '24 hours',
    NOW(),
    INTERVAL '1 hour'
) AS bucket
LEFT JOIN server_metrics sm
    ON sm.timestamp >= bucket
    AND sm.timestamp < bucket + INTERVAL '1 hour'
    AND sm.server_id = 1
GROUP BY bucket
ORDER BY bucket;
```

### 2.2 Moving Averages & Smoothing

```sql
-- Simple Moving Average (SMA)
SELECT
    timestamp,
    price,
    AVG(price) OVER (ORDER BY timestamp ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS sma_7,
    AVG(price) OVER (ORDER BY timestamp ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS sma_30
FROM stock_prices
WHERE symbol = 'AAPL';

-- Exponential Moving Average (approximation with weights)
WITH numbered AS (
    SELECT timestamp, price,
           ROW_NUMBER() OVER (ORDER BY timestamp DESC) AS rn
    FROM stock_prices WHERE symbol = 'AAPL'
),
ema AS (
    SELECT timestamp, price, price AS ema_value, rn
    FROM numbered WHERE rn = 1
    UNION ALL
    SELECT n.timestamp, n.price,
           0.1 * n.price + 0.9 * e.ema_value,  -- alpha=0.1
           n.rn
    FROM numbered n
    JOIN ema e ON n.rn = e.rn + 1
)
SELECT timestamp, price, ROUND(ema_value::numeric, 2) AS ema
FROM ema ORDER BY timestamp;
```

### 2.3 Rate of Change & Derivatives

```sql
SELECT
    timestamp,
    value,
    -- Absolute change from previous reading
    value - LAG(value) OVER (ORDER BY timestamp) AS delta,
    -- Rate of change per second
    (value - LAG(value) OVER (ORDER BY timestamp)) /
    EXTRACT(EPOCH FROM timestamp - LAG(timestamp) OVER (ORDER BY timestamp))
        AS rate_per_second,
    -- Percentage change
    100.0 * (value - LAG(value) OVER (ORDER BY timestamp)) /
        NULLIF(LAG(value) OVER (ORDER BY timestamp), 0) AS pct_change
FROM sensor_readings
WHERE sensor_id = 42;
```

### 2.4 Gap Detection

```sql
-- Find gaps where expected data is missing
WITH reading_gaps AS (
    SELECT
        timestamp,
        LEAD(timestamp) OVER (
            PARTITION BY server_id ORDER BY timestamp
        ) AS next_timestamp,
        LEAD(timestamp) OVER (
            PARTITION BY server_id ORDER BY timestamp
        ) - timestamp AS gap_duration,
        server_id
    FROM server_metrics
    WHERE timestamp >= NOW() - INTERVAL '7 days'
)
SELECT
    server_id,
    timestamp AS gap_start,
    next_timestamp AS gap_end,
    gap_duration,
    EXTRACT(EPOCH FROM gap_duration) / 60 AS gap_minutes
FROM reading_gaps
WHERE gap_duration > INTERVAL '5 minutes'  -- Expected interval is 1 min
ORDER BY gap_duration DESC;
```

---

## Part 3 — Temporal Tables (System-Versioned)

### 3.1 What Are Temporal Tables?

```
Temporal table = automatically maintains FULL HISTORY of every row change.

Regular table:   UPDATE product SET price = 20 → old price is GONE
Temporal table:  UPDATE product SET price = 20 → old price preserved with timestamps

┌─────────────────────────────────────────────────────────────────────┐
│                     Current Table (products)                        │
│ id │ name    │ price │ valid_from          │ valid_to               │
│ 1  │ Widget  │ 20.00 │ 2026-03-15 10:00:00 │ 9999-12-31 23:59:59   │
├─────────────────────────────────────────────────────────────────────┤
│                     History Table (products_history)                 │
│ id │ name    │ price │ valid_from          │ valid_to               │
│ 1  │ Widget  │ 15.00 │ 2026-01-01 00:00:00 │ 2026-02-01 09:00:00   │
│ 1  │ Widget  │ 18.00 │ 2026-02-01 09:00:00 │ 2026-03-15 10:00:00   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 SQL Server: System-Versioned Temporal Tables

```sql
-- SQL Server has native temporal table support
CREATE TABLE products (
    id          INT PRIMARY KEY,
    name        VARCHAR(100),
    price       DECIMAL(10,2),
    category    VARCHAR(50),
    -- System-time columns
    valid_from  DATETIME2 GENERATED ALWAYS AS ROW START,
    valid_to    DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (valid_from, valid_to)
) WITH (SYSTEM_VERSIONING = ON (
    HISTORY_TABLE = dbo.products_history
));

-- Queries automatically work with history!

-- Current data (normal query)
SELECT * FROM products WHERE id = 1;

-- Data at a specific point in time
SELECT * FROM products
    FOR SYSTEM_TIME AS OF '2026-02-15 12:00:00'
    WHERE id = 1;

-- Full history of changes
SELECT * FROM products
    FOR SYSTEM_TIME ALL
    WHERE id = 1
    ORDER BY valid_from;

-- Data within a time range
SELECT * FROM products
    FOR SYSTEM_TIME BETWEEN '2026-01-01' AND '2026-03-01'
    WHERE id = 1;
```

### 3.3 PostgreSQL: Manual Temporal Pattern

```sql
-- PostgreSQL doesn't have built-in system versioning, but we can implement it
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100),
    price       DECIMAL(10,2),
    valid_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to    TIMESTAMPTZ NOT NULL DEFAULT 'infinity'
);

-- "Update" = close current row + insert new row
CREATE OR REPLACE FUNCTION temporal_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Close the old version
    UPDATE products SET valid_to = NOW()
    WHERE id = OLD.id AND valid_to = 'infinity';

    -- Insert new version
    INSERT INTO products (id, name, price, valid_from, valid_to)
    VALUES (OLD.id, NEW.name, NEW.price, NOW(), 'infinity');

    RETURN NULL;  -- Suppress the original UPDATE
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_temporal
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION temporal_update();

-- Query current state
SELECT * FROM products WHERE valid_to = 'infinity';

-- Query as of a specific time
SELECT * FROM products
WHERE valid_from <= '2026-02-15'::timestamptz
AND valid_to > '2026-02-15'::timestamptz;
```

---

## Part 4 — Slowly Changing Dimensions (SCD)

### 4.1 SCD Types Overview

```
┌──────────┬───────────────────────────────────────────────────┐
│ SCD Type │ Description                                        │
├──────────┼───────────────────────────────────────────────────┤
│ Type 0   │ Never changes (fixed attributes: birth date, SSN) │
├──────────┼───────────────────────────────────────────────────┤
│ Type 1   │ Overwrite old value. No history kept.              │
│          │ ❌ Can't track what changed                        │
├──────────┼───────────────────────────────────────────────────┤
│ Type 2   │ Add NEW ROW with timestamps. Full history.         │
│          │ ✅ Most common in data warehousing                 │
├──────────┼───────────────────────────────────────────────────┤
│ Type 3   │ Add columns: current_value + previous_value        │
│          │ ⚠️  Only tracks ONE change                         │
├──────────┼───────────────────────────────────────────────────┤
│ Type 4   │ Separate history table (like temporal tables)      │
├──────────┼───────────────────────────────────────────────────┤
│ Type 6   │ Hybrid: Type 1 + 2 + 3 combined                   │
│ (1+2+3)  │ Current value + history rows + previous columns    │
└──────────┴───────────────────────────────────────────────────┘
```

### 4.2 SCD Type 2 Implementation

```sql
-- Customer dimension with SCD Type 2
CREATE TABLE dim_customer (
    surrogate_key SERIAL PRIMARY KEY,  -- Warehouse key (unique per version)
    customer_id   INT NOT NULL,        -- Business key (same across versions)
    name          VARCHAR(100),
    city          VARCHAR(100),
    tier          VARCHAR(20),         -- 'Silver', 'Gold', 'Platinum'
    effective_from DATE NOT NULL,
    effective_to   DATE NOT NULL DEFAULT '9999-12-31',
    is_current     BOOLEAN DEFAULT TRUE
);

-- Merge/upsert procedure for SCD Type 2
CREATE OR REPLACE FUNCTION scd2_upsert_customer(
    p_customer_id INT, p_name VARCHAR, p_city VARCHAR, p_tier VARCHAR
) RETURNS VOID AS $$
DECLARE
    v_current RECORD;
BEGIN
    -- Get current version
    SELECT * INTO v_current FROM dim_customer
    WHERE customer_id = p_customer_id AND is_current = TRUE;

    IF NOT FOUND THEN
        -- New customer: insert first version
        INSERT INTO dim_customer (customer_id, name, city, tier, effective_from)
        VALUES (p_customer_id, p_name, p_city, p_tier, CURRENT_DATE);
    ELSIF v_current.name != p_name OR v_current.city != p_city OR v_current.tier != p_tier THEN
        -- Changed: close current, insert new version
        UPDATE dim_customer SET
            effective_to = CURRENT_DATE - 1,
            is_current = FALSE
        WHERE surrogate_key = v_current.surrogate_key;

        INSERT INTO dim_customer (customer_id, name, city, tier, effective_from)
        VALUES (p_customer_id, p_name, p_city, p_tier, CURRENT_DATE);
    END IF;
    -- If unchanged: do nothing
END;
$$ LANGUAGE plpgsql;
```

---

## Part 5 — Python Time-Series Visualization

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Load time-series from SQL
df = pd.read_sql("""
    SELECT
        date_trunc('hour', timestamp) AS hour,
        AVG(cpu_percent) AS avg_cpu,
        MAX(cpu_percent) AS max_cpu,
        AVG(memory_mb) AS avg_memory
    FROM server_metrics
    WHERE server_id = 1
    AND timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY hour
    ORDER BY hour
""", conn, parse_dates=['hour'])

fig, axes = plt.subplots(2, 1, figsize=(16, 8), sharex=True)

# CPU with anomaly highlighting
axes[0].plot(df['hour'], df['avg_cpu'], color='blue', linewidth=0.8, label='Avg CPU')
axes[0].fill_between(df['hour'], df['avg_cpu'], df['max_cpu'], alpha=0.2, color='blue', label='Max CPU')
threshold = df['avg_cpu'].mean() + 2 * df['avg_cpu'].std()
axes[0].axhline(y=threshold, color='red', linestyle='--', label=f'Alert Threshold ({threshold:.0f}%)')
# Highlight anomalies
anomalies = df[df['avg_cpu'] > threshold]
axes[0].scatter(anomalies['hour'], anomalies['avg_cpu'], color='red', s=50, zorder=5)
axes[0].set_ylabel('CPU %')
axes[0].legend()
axes[0].set_title('Server Metrics — Last 7 Days')

# Memory
axes[1].plot(df['hour'], df['avg_memory'], color='green', linewidth=0.8)
axes[1].fill_between(df['hour'], 0, df['avg_memory'], alpha=0.2, color='green')
axes[1].set_ylabel('Memory (MB)')
axes[1].xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
axes[1].xaxis.set_major_locator(mdates.DayLocator())

plt.tight_layout()
plt.show()
```

---

## Part 6 — Data Retention & Archival

```sql
-- Automated data retention with partitioning
-- Keep last 90 days hot, archive older data

-- Drop partitions older than 1 year
DO $$
DECLARE
    partition_name TEXT;
BEGIN
    FOR partition_name IN
        SELECT tablename FROM pg_tables
        WHERE tablename LIKE 'server_metrics_%'
        AND tablename < 'server_metrics_' || to_char(NOW() - INTERVAL '1 year', 'YYYY_MM')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(partition_name);
        RAISE NOTICE 'Dropped partition: %', partition_name;
    END LOOP;
END $$;

-- Continuous aggregate (materialized view refreshed on schedule)
CREATE MATERIALIZED VIEW metrics_hourly AS
SELECT
    date_trunc('hour', timestamp) AS hour,
    server_id,
    AVG(cpu_percent) AS avg_cpu,
    MAX(cpu_percent) AS max_cpu,
    AVG(memory_mb) AS avg_memory,
    COUNT(*) AS samples
FROM server_metrics
GROUP BY date_trunc('hour', timestamp), server_id;

-- Refresh periodically (cron job or pg_cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_hourly;
```

---

### Historical Evolution

**Predecessors (with years):**
- **Temporal databases (Snodgrass)** (1995): Richard Snodgrass formalized temporal data management in SQL, establishing the theoretical foundation for bi-temporal modeling
- **Slowly Changing Dimensions (Kimball)** (1996): Ralph Kimball documented SCD Type 2 and other dimension history tracking patterns for data warehousing
- **BRIN index (PostgreSQL)** (2013): Block Range Indexes provided efficient indexing for naturally-ordered time-series data with minimal storage overhead
- **SQL:2011 temporal extensions** (2011): The SQL standard added temporal data types and period predicates, formalizing time-series support in relational databases
- **InfluxDB** (2013): Time-series database built specifically for metrics and events, pioneering the purpose-built TSDB category
- **TimescaleDB** (2017): Hybrid approach combining PostgreSQL with time-series optimizations, bringing TSDB capabilities to existing SQL ecosystems

**Evolution narrative:**
Temporal data management was formalized by Snodgrass (1995) before most databases supported it natively. Data warehousing needs drove practical adoption with Kimball's SCD patterns (1996), teaching analysts how to track dimension changes. PostgreSQL's BRIN index (2013) enabled efficient time-series storage without the overhead of B-tree indexes. SQL:2011 finally standardized temporal features, while purpose-built time-series databases (InfluxDB 2013, TimescaleDB 2017) emerged to handle the massive scale of IoT and monitoring use cases.

**Modern practice anchor:**
Today's time-series SQL combines native date/time types with window functions for sliding metrics, BRIN or partitioning for performance, and SCD Type 2 patterns for dimension history—while specialized TSDBs handle extreme scale IoT workloads.
### Production Reality

**Failure modes:**
1. **Time-series hypertable missing chunk interval**: TimescaleDB hypertable created without explicit chunking — default 7-day chunks on 100M rows/day causes 700M row chunks, query performance degrades to 45s from 200ms
2. **Gap detection false positives from DST**: Sensor data gap detection query flags 2:30-3:00 AM as missing — actually a 1-hour gap during spring forward DST transition, alert fired unnecessarily
3. **Retention policy not enforced**: `drop_chunks(older_than => interval '30 days')` policy configured but disabled during backup window — 90 days of data accumulates, disk fills to 95% capacity

**Debug workflow:**
1. Check hypertable chunk stats: `SELECT hypertable_name, num_chunks, chunk_interval FROM timescaledb_information.hypertables`
2. Verify retention policy: `SELECT policy_name, hypertable_name, config FROM timescaledb_information.jobs WHERE policy_name LIKE '%retention%'`
3. Handle DST in gap detection: use `WITH TIME ZONE` types and explicit `timezone` parameter — `SELECT timezone('UTC', ts) FROM metrics` before gap analysis

**Modern practice anchor:**
TimescaleDB requires explicit chunk interval tuning based on data volume — auto-tuning often produces suboptimal chunk sizes in production.
