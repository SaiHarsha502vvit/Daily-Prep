# Chapter 38 — Real-World Production Scenarios Part 1: IDs, Data Growth & Storage Crises

> **What:** 25 real-world production scenarios that every developer hits — ID exhaustion, data overflow, storage crises
> **Why:** These aren't textbook problems; they're 3 AM pager alerts that break real systems
> **When:** When your tables grow from thousands to billions of rows
> **Where:** E-commerce, banking, SaaS, healthcare, logistics — every production database
> **Who:** Backend devs, DBAs, Spring Boot developers, on-call engineers
> **How:** 5W-H analysis → SQL solution → DSA/Backend solution → Prevention strategy

---

## 📋 Scenario Master Index (Part 1: Scenarios 1–25)

| # | Scenario | Category |
|---|----------|----------|
| 1 | INT ID Exhaustion — 2.1 billion limit hit | ID Crisis |
| 2 | VARCHAR(9) ID space exhaustion | ID Crisis |
| 3 | UUID migration from auto-increment | ID Strategy |
| 4 | Snowflake ID generation for distributed systems | ID Strategy |
| 5 | Composite key running out of combinations | ID Crisis |
| 6 | Sequence gaps causing business panic | ID Behavior |
| 7 | ID collision after database merge/acquisition | ID Crisis |
| 8 | Table hitting 1 billion rows — everything slows | Data Growth |
| 9 | Disk space 95% full — production alert | Storage Crisis |
| 10 | LOG file eating all disk space | Storage Crisis |
| 11 | BLOB/TEXT columns inflating table size 100x | Storage Crisis |
| 12 | Index bloat — indexes bigger than data | Storage Crisis |
| 13 | Dead tuples / table bloat in PostgreSQL | Storage Crisis |
| 14 | Archive strategy — hot/warm/cold data | Data Growth |
| 15 | Soft delete accumulation — 90% of rows are deleted | Data Growth |
| 16 | Auto-increment reset after DELETE | ID Behavior |
| 17 | Multi-tenant ID isolation | ID Strategy |
| 18 | Time-series data flooding — 1M rows/hour | Data Growth |
| 19 | Audit log table consuming 80% of storage | Data Growth |
| 20 | TOAST table bloat in PostgreSQL | Storage Crisis |
| 21 | Partition table reaching OS file handle limits | Data Growth |
| 22 | Foreign key chains blocking deletes at scale | Data Growth |
| 23 | Orphaned rows after failed cascade delete | Data Growth |
| 24 | Character encoding mismatch wasting 3x storage | Storage Crisis |
| 25 | Temp table / CTE memory explosion | Storage Crisis |

---

## Scenario 1: INT Primary Key Exhaustion — The 2.1 Billion Wall

### 🔴 The Incident
Your `orders` table uses `INT AUTO_INCREMENT`. After 7 years in production, the ID reaches 2,147,483,647. The next INSERT fails. No new orders can be placed. Revenue stops.

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | `INT` (4 bytes signed) max = 2,147,483,647. Next insert throws `ERROR 1062: Duplicate entry '2147483647'` |
| **Why** | Original schema assumed "2 billion is enough." Nobody monitored ID consumption rate |
| **When** | After ~7 years at ~1000 inserts/day, or 2 years at ~3M inserts/day |
| **Where** | High-volume tables: orders, transactions, events, logs, audit trails |
| **Who** | Junior dev chose `INT` in 2017. Nobody reviewed the schema for growth |
| **How** | Fix: ALTER to BIGINT. Prevent: monitoring, capacity planning |

### SQL Solution

```sql
-- Step 1: CHECK how close you are to the limit
SELECT 
    TABLE_NAME,
    AUTO_INCREMENT,
    ROUND(AUTO_INCREMENT / 2147483647 * 100, 2) AS pct_used,
    CASE 
        WHEN AUTO_INCREMENT > 2000000000 THEN '🔴 CRITICAL'
        WHEN AUTO_INCREMENT > 1500000000 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND AUTO_INCREMENT IS NOT NULL
ORDER BY AUTO_INCREMENT DESC;

-- Step 2: ALTER TABLE (DOWNTIME required for large tables!)
-- For MySQL < 8.0, this copies the entire table
ALTER TABLE orders MODIFY COLUMN id BIGINT AUTO_INCREMENT;

-- Step 3: Also fix all foreign key columns referencing this table
ALTER TABLE order_items MODIFY COLUMN order_id BIGINT;
ALTER TABLE payments MODIFY COLUMN order_id BIGINT;
ALTER TABLE shipments MODIFY COLUMN order_id BIGINT;

-- Step 4: For PostgreSQL — much easier (metadata-only change!)
ALTER TABLE orders ALTER COLUMN id TYPE BIGINT;
-- PostgreSQL sequence also needs updating:
ALTER SEQUENCE orders_id_seq AS BIGINT;
```

### Zero-Downtime MySQL Migration (Production-Safe)

```sql
-- Can't afford downtime? Use the "shadow table" approach:

-- 1. Create new table with BIGINT
CREATE TABLE orders_new LIKE orders;
ALTER TABLE orders_new MODIFY COLUMN id BIGINT AUTO_INCREMENT;

-- 2. Copy data in batches (not one giant INSERT)
INSERT INTO orders_new SELECT * FROM orders WHERE id BETWEEN 1 AND 1000000;
INSERT INTO orders_new SELECT * FROM orders WHERE id BETWEEN 1000001 AND 2000000;
-- ... continue in chunks

-- 3. Set up trigger to capture live writes during migration
DELIMITER //
CREATE TRIGGER orders_sync AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO orders_new VALUES (NEW.id, NEW.customer_id, NEW.total, NEW.created_at)
    ON DUPLICATE KEY UPDATE customer_id = NEW.customer_id, total = NEW.total;
END //
DELIMITER ;

-- 4. Final cutover (brief lock)
RENAME TABLE orders TO orders_old, orders_new TO orders;
-- 5. Drop trigger and old table after verification
```

### Spring Boot / Backend Solution

```java
// Monitor ID consumption in your health checks
@Component
public class IdExhaustionHealthIndicator implements HealthIndicator {

    @Autowired
    private JdbcTemplate jdbc;

    @Override
    public Health health() {
        Long currentId = jdbc.queryForObject(
            "SELECT AUTO_INCREMENT FROM information_schema.TABLES " +
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'",
            Long.class
        );
        
        double pctUsed = currentId / 2147483647.0 * 100;
        
        if (pctUsed > 90) {
            return Health.down()
                .withDetail("orders_id_pct_used", pctUsed)
                .withDetail("action", "URGENT: Migrate to BIGINT")
                .build();
        } else if (pctUsed > 70) {
            return Health.status("WARNING")
                .withDetail("orders_id_pct_used", pctUsed)
                .build();
        }
        return Health.up()
            .withDetail("orders_id_pct_used", pctUsed)
            .build();
    }
}
```

### DSA Connection
- **Capacity planning** = Array resizing (like ArrayList doubling from 16→32→64)
- **Shadow table migration** = Two-pointer merge pattern
- **Batch copy** = Chunked processing (sliding window of size N)

---




## Scenario 2: VARCHAR(9) ID Space Exhaustion

### 🔴 The Incident
Company uses `CHAR(9)` employee IDs: `EMP000001` to `EMP999999`. After acquisition merges two companies, they're at `EMP987342`. Only 12,658 IDs left.

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | Fixed-width business ID `EMP` + 6 digits = max 999,999 employees |
| **Why** | Original design never planned for acquisitions or contractor IDs |
| **When** | After company merger brings 50,000 new employees |
| **Where** | HR systems, payroll, access control, every report ever printed |
| **Who** | Affects EVERY system — this ID is used in 47 different applications |
| **How** | Multiple strategies depending on constraints |

### SQL Solutions

```sql
-- Strategy 1: EXTEND the format (if all systems can handle it)
-- EMP000001 → EMPL0000001 (10 chars, 7 digits = 9.9M capacity)
ALTER TABLE employees MODIFY COLUMN emp_id VARCHAR(12);
UPDATE employees SET emp_id = CONCAT('EMPL', LPAD(
    CAST(SUBSTRING(emp_id, 4) AS UNSIGNED), 7, '0'
));

-- Strategy 2: ADD alphanumeric characters (36^6 = 2.1 billion combos)
-- EMP000001 → EMP00A001 → EMPZZZZZZ
-- Sequence: 0-9, then A-Z
-- After EMP999999 comes EMPA00000

-- Generate next alphanumeric ID (PostgreSQL function)
CREATE OR REPLACE FUNCTION next_emp_id() RETURNS VARCHAR(9) AS $$
DECLARE
    last_id VARCHAR(9);
    num_part VARCHAR(6);
    next_val BIGINT;
    charset VARCHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result VARCHAR(6) := '';
    remainder INT;
BEGIN
    SELECT emp_id INTO last_id FROM employees ORDER BY emp_id DESC LIMIT 1;
    num_part := SUBSTRING(last_id FROM 4);
    
    -- Convert base-36 to decimal
    next_val := 0;
    FOR i IN 1..6 LOOP
        next_val := next_val * 36 + POSITION(SUBSTRING(num_part FROM i FOR 1) IN charset) - 1;
    END LOOP;
    next_val := next_val + 1;
    
    -- Convert back to base-36
    FOR i IN REVERSE 6..1 LOOP
        remainder := next_val % 36;
        result := SUBSTRING(charset FROM remainder + 1 FOR 1) || result;
        next_val := next_val / 36;
    END LOOP;
    
    RETURN 'EMP' || result;
END;
$$ LANGUAGE plpgsql;

-- Strategy 3: SEPARATE internal vs external IDs
-- Keep old EMP IDs for external/legacy, add new internal UUID
ALTER TABLE employees ADD COLUMN internal_id UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX idx_emp_internal ON employees(internal_id);
-- New systems use internal_id; old reports still use emp_id

-- Strategy 4: PREFIX by source system
-- Parent company: EMP-P-000001  (CHAR 12)
-- Acquired company: EMP-A-000001
-- Contractors: EMP-C-000001
ALTER TABLE employees MODIFY COLUMN emp_id VARCHAR(12);
UPDATE employees SET emp_id = CONCAT('EMP-P-', SUBSTRING(emp_id, 4))
WHERE source_system = 'PARENT';
```

### Spring Boot ID Generator

```java
@Service
public class EmployeeIdGenerator {
    
    @Autowired
    private JdbcTemplate jdbc;
    
    private static final String CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    @Transactional
    public String generateNextId() {
        // Use SELECT FOR UPDATE to prevent race conditions
        String lastId = jdbc.queryForObject(
            "SELECT emp_id FROM employees ORDER BY emp_id DESC LIMIT 1 FOR UPDATE",
            String.class
        );
        
        String numPart = lastId.substring(3); // Remove "EMP"
        long decimal = fromBase36(numPart);
        decimal++;
        
        if (decimal >= Math.pow(36, 6)) {
            throw new IdExhaustionException(
                "All EMP IDs exhausted! Extend format immediately."
            );
        }
        
        return "EMP" + toBase36(decimal, 6);
    }
    
    private long fromBase36(String s) {
        long result = 0;
        for (char c : s.toCharArray()) {
            result = result * 36 + CHARSET.indexOf(c);
        }
        return result;
    }
    
    private String toBase36(long num, int width) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < width; i++) {
            sb.insert(0, CHARSET.charAt((int)(num % 36)));
            num /= 36;
        }
        return sb.toString();
    }
}
```

### DSA Connection
- **Base conversion** = Number system problem (base-10 → base-36)
- **ID generation** = Hashing / encoding problem
- **Capacity calc** = Combinatorics: `prefix_options × charset^digit_count`

---

## Scenario 3: UUID Migration from Auto-Increment

### 🔴 The Incident
Microservices architecture needs globally unique IDs. Auto-increment doesn't work across 5 databases. Team migrates to UUID. Performance drops 40%.

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | UUID v4 (random 128-bit) causes B-Tree fragmentation; inserts scatter across all leaf pages |
| **Why** | Random UUIDs don't sort naturally → page splits on every insert |
| **When** | Immediately on high-volume tables (>1M inserts/day) |
| **Where** | InnoDB (MySQL), any B-Tree indexed primary key |
| **Who** | Architecture team chose UUID without understanding index implications |
| **How** | Use UUID v7 (time-ordered), ULID, or Snowflake IDs instead |

### SQL Solutions

```sql
-- PROBLEM: Random UUID as primary key
CREATE TABLE orders_bad (
    id CHAR(36) PRIMARY KEY,  -- 'a1b2c3d4-e5f6-...' Random! 36 bytes!
    customer_id INT,
    total DECIMAL(10,2)
);
-- INSERT causes random page splits, buffer pool thrashing

-- SOLUTION 1: UUID stored as BINARY(16) — saves 55% space
CREATE TABLE orders_good (
    id BINARY(16) PRIMARY KEY,
    id_text VARCHAR(36) GENERATED ALWAYS AS (
        INSERT(INSERT(INSERT(INSERT(HEX(id),9,0,'-'),14,0,'-'),19,0,'-'),24,0,'-')
    ) VIRTUAL,
    customer_id INT,
    total DECIMAL(10,2)
);

-- SOLUTION 2: UUID v7 (time-ordered) — best of both worlds
-- PostgreSQL 17+ has native uuid_generate_v7()
-- For older versions, or MySQL:
CREATE TABLE orders_best (
    id BINARY(16) PRIMARY KEY,  -- UUID v7: time-prefix ensures sequential inserts
    customer_id INT,
    total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOLUTION 3: Keep auto-increment internally, expose UUID externally
CREATE TABLE orders_hybrid (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- Internal: fast B-Tree
    public_id BINARY(16) NOT NULL,         -- External: UUID for APIs
    customer_id INT,
    total DECIMAL(10,2),
    UNIQUE KEY idx_public_id (public_id)
);

-- Compare B-Tree insert patterns:
-- AUTO_INCREMENT: Always appends to rightmost leaf → sequential I/O
-- UUID v4 random:  Inserts at random positions → random I/O, page splits
-- UUID v7 time:    Mostly appends to right → near-sequential I/O
```

### Spring Boot UUID v7 Generator

```java
@Component
public class UUIDv7Generator {
    
    // UUID v7: unix_timestamp_ms (48 bits) + version (4) + random (12) + variant (2) + random (62)
    public UUID generateV7() {
        long timestamp = System.currentTimeMillis();
        long random = ThreadLocalRandom.current().nextLong();
        
        long msb = (timestamp << 16) | (0x7000L) | (random & 0x0FFFL);
        long lsb = (0x8000000000000000L) | (random & 0x3FFFFFFFFFFFFFFFL);
        
        return new UUID(msb, lsb);
    }
    
    // Convert UUID to BINARY(16) for MySQL storage
    public byte[] toBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }
}

// JPA Entity using UUID v7
@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;
    
    @PrePersist
    private void generateId() {
        if (id == null) {
            id = uuidv7Generator.generateV7();
        }
    }
}
```

### DSA Connection
- **B-Tree insert patterns** = Binary Search Tree balancing (AVL rotations vs. appending to sorted array)
- **UUID as hash** = Hash function distribution (uniform random vs. time-ordered)
- **Page splits** = Array insertion at random index = O(n) shift vs. append = O(1)

---




## Scenario 4: Snowflake ID Generation for Distributed Systems

### 🔴 The Incident
5 microservices each generate their own auto-increment IDs. When merging into analytics DB, IDs collide. Order #12345 exists in 3 different services.

### SQL + Backend Solution

```sql
-- Snowflake ID structure (64 bits):
-- [1 bit unused] [41 bits timestamp] [10 bits machine] [12 bits sequence]
-- Epoch: custom (e.g., 2024-01-01)
-- Machine: 1024 unique nodes
-- Sequence: 4096 IDs per millisecond per node

-- PostgreSQL Snowflake generator
CREATE SEQUENCE snowflake_seq MAXVALUE 4095 CYCLE;

CREATE OR REPLACE FUNCTION snowflake_id(machine_id INT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
    epoch BIGINT := 1704067200000;  -- 2024-01-01 epoch
    ts BIGINT;
    seq BIGINT;
BEGIN
    ts := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT - epoch;
    seq := nextval('snowflake_seq');
    RETURN (ts << 22) | ((machine_id & 1023) << 12) | (seq & 4095);
END;
$$ LANGUAGE plpgsql;

-- Usage:
CREATE TABLE distributed_orders (
    id BIGINT PRIMARY KEY DEFAULT snowflake_id(1),
    service_name VARCHAR(50),
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DECODE a snowflake ID back:
CREATE OR REPLACE FUNCTION decode_snowflake(id BIGINT)
RETURNS TABLE(timestamp_ms BIGINT, machine_id INT, sequence_num INT, created_at TIMESTAMP) AS $$
DECLARE
    epoch BIGINT := 1704067200000;
BEGIN
    timestamp_ms := (id >> 22) + epoch;
    machine_id := (id >> 12) & 1023;
    sequence_num := id & 4095;
    created_at := TO_TIMESTAMP(timestamp_ms / 1000.0);
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM decode_snowflake(123456789012345);
```

### Spring Boot Snowflake Generator

```java
@Component
public class SnowflakeIdGenerator {
    
    private static final long EPOCH = 1704067200000L; // 2024-01-01
    private static final int MACHINE_BITS = 10;
    private static final int SEQUENCE_BITS = 12;
    
    private final long machineId;
    private long lastTimestamp = -1L;
    private long sequence = 0L;
    
    public SnowflakeIdGenerator(@Value("${app.machine-id:1}") long machineId) {
        if (machineId < 0 || machineId >= (1L << MACHINE_BITS)) {
            throw new IllegalArgumentException("Machine ID must be 0-1023");
        }
        this.machineId = machineId;
    }
    
    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & ((1L << SEQUENCE_BITS) - 1);
            if (sequence == 0) {
                // Exhausted 4096 IDs in this ms — wait for next ms
                while (timestamp <= lastTimestamp) {
                    timestamp = System.currentTimeMillis();
                }
            }
        } else {
            sequence = 0;
        }
        
        lastTimestamp = timestamp;
        
        return ((timestamp - EPOCH) << (MACHINE_BITS + SEQUENCE_BITS))
             | (machineId << SEQUENCE_BITS)
             | sequence;
    }
}
```

---

## Scenario 5: Composite Key Running Out of Combinations

### 🔴 The Incident
Table uses `(year SMALLINT, sequence INT)` as composite PK. It's December 31st: sequence hits INT max within the year. Invoices can't be generated.

### SQL Solution

```sql
-- Problem: Invoice table design
CREATE TABLE invoices (
    fiscal_year SMALLINT,
    seq_num INT,               -- Max 2.1B per year... until it isn't
    PRIMARY KEY (fiscal_year, seq_num)
);

-- Fix 1: Add more granularity to the composite key
ALTER TABLE invoices ADD COLUMN region_code CHAR(2) DEFAULT 'US';
ALTER TABLE invoices DROP PRIMARY KEY;
ALTER TABLE invoices ADD PRIMARY KEY (fiscal_year, region_code, seq_num);
-- Now: 2.1B per year PER REGION

-- Fix 2: Switch sequence to BIGINT
ALTER TABLE invoices MODIFY COLUMN seq_num BIGINT;

-- Fix 3: Change sequence strategy to include month
-- INV-2025-03-000001 format
CREATE TABLE invoices_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) GENERATED ALWAYS AS (
        CONCAT('INV-', fiscal_year, '-', LPAD(fiscal_month, 2, '0'), '-', LPAD(seq_num, 6, '0'))
    ) STORED,
    fiscal_year SMALLINT NOT NULL,
    fiscal_month TINYINT NOT NULL,
    seq_num INT NOT NULL,
    UNIQUE KEY uk_invoice (fiscal_year, fiscal_month, seq_num)
);
-- Now: 2.1B per MONTH — effectively unlimited
```

---




## Scenario 6: Sequence Gaps Causing Business Panic

### 🔴 The Incident
Auditor notices invoice numbers jump: INV-1042, INV-1043, INV-1047. "Where are 1044, 1045, 1046?! Is someone hiding revenue?"

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | Gaps in auto-increment sequence |
| **Why** | Rolled-back transactions, failed inserts, bulk deletes, server restarts all consume sequence values |
| **When** | Every database has this — it's NORMAL behavior |
| **Where** | Any table using sequences/auto-increment |
| **Who** | Auditors, compliance officers, non-technical stakeholders |
| **How** | Separate the BUSINESS sequence from the DATABASE sequence |

### SQL Solution

```sql
-- WRONG: Using auto-increment as business invoice number
-- Gaps are GUARANTEED with any concurrent system

-- RIGHT: Separate gapless business sequence
CREATE TABLE invoice_sequences (
    prefix VARCHAR(10) PRIMARY KEY,
    last_value BIGINT NOT NULL DEFAULT 0
);
INSERT INTO invoice_sequences VALUES ('INV-2025', 0);

-- Gapless sequence generator (serialized — slower but gapless)
CREATE OR REPLACE FUNCTION next_invoice_number(p_prefix VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_next BIGINT;
BEGIN
    UPDATE invoice_sequences 
    SET last_value = last_value + 1 
    WHERE prefix = p_prefix
    RETURNING last_value INTO v_next;
    
    RETURN p_prefix || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Usage (this IS the invoice creation — sequence only advances on COMMIT)
BEGIN;
    SELECT next_invoice_number('INV-2025');  -- INV-2025-001043
    INSERT INTO invoices (invoice_number, ...) VALUES (...);
COMMIT;  -- Sequence persists
-- If ROLLBACK happens, sequence didn't advance — NO GAP

-- Detect gaps in existing data (for audit report)
WITH numbered AS (
    SELECT invoice_number,
           ROW_NUMBER() OVER (ORDER BY invoice_number) AS expected_pos,
           CAST(SUBSTRING(invoice_number, 10) AS INTEGER) AS actual_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-2025-%'
)
SELECT actual_num AS gap_start,
       LEAD(actual_num) OVER (ORDER BY actual_num) - 1 AS gap_end,
       LEAD(actual_num) OVER (ORDER BY actual_num) - actual_num - 1 AS gap_size
FROM numbered
WHERE LEAD(actual_num) OVER (ORDER BY actual_num) - actual_num > 1;
```

### Spring Boot Gapless Sequence

```java
@Service
public class InvoiceService {
    
    @Autowired
    private JdbcTemplate jdbc;
    
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public String createInvoice(InvoiceRequest request) {
        // This UPDATE locks the row — only one invoice at a time
        String invoiceNumber = jdbc.queryForObject(
            "UPDATE invoice_sequences SET last_value = last_value + 1 " +
            "WHERE prefix = ? RETURNING prefix || '-' || LPAD(last_value::TEXT, 6, '0')",
            String.class, "INV-2025"
        );
        
        // If anything fails below, the whole transaction rolls back
        // including the sequence increment — NO GAP
        jdbc.update("INSERT INTO invoices (invoice_number, customer_id, total) VALUES (?, ?, ?)",
            invoiceNumber, request.getCustomerId(), request.getTotal());
        
        return invoiceNumber;
    }
}
```

---




## Scenario 7: ID Collision After Database Merge / Acquisition

### 🔴 The Incident
Company A acquires Company B. Both have a `users` table with auto-increment IDs starting from 1. User #5000 in Company A is a different person than User #5000 in Company B.

### SQL Solution

```sql
-- Strategy 1: OFFSET one company's IDs
-- Company B gets 10M added to all IDs
SET @offset = 10000000;

-- Step 1: Update Company B's PKs and all FKs
-- ORDER BY id DESC prevents duplicate key violations
UPDATE company_b.users SET id = id + @offset ORDER BY id DESC;
UPDATE company_b.orders SET customer_id = customer_id + @offset;
UPDATE company_b.payments SET user_id = user_id + @offset;
-- Repeat for EVERY table with a FK to users

-- Step 2: Merge into single table
INSERT INTO merged.users SELECT * FROM company_a.users;
INSERT INTO merged.users SELECT * FROM company_b.users;

-- Strategy 2: SURROGATE KEY — add a new global ID
CREATE TABLE merged_users (
    global_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system ENUM('COMPANY_A', 'COMPANY_B') NOT NULL,
    original_id BIGINT NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    UNIQUE KEY uk_source_original (source_system, original_id)
);

-- Mapping table for FK migration
CREATE TABLE id_mapping (
    source_system VARCHAR(20),
    old_table VARCHAR(50),
    old_id BIGINT,
    new_id BIGINT,
    PRIMARY KEY (source_system, old_table, old_id)
);

-- Strategy 3: NAMESPACE-prefixed IDs
-- Company A: A-0000001 to A-9999999
-- Company B: B-0000001 to B-9999999
ALTER TABLE users MODIFY COLUMN user_code VARCHAR(12);
UPDATE users u
JOIN id_mapping m ON u.id = m.old_id AND m.source_system = 'A'
SET u.user_code = CONCAT('A-', LPAD(u.id, 7, '0'));
```

### DSA Connection
- **Merge with conflicts** = Merge Sort stability (preserving origin)
- **ID remapping** = Hash Map (old_id → new_id)
- **Offset strategy** = Array shifting / index remapping

---

## Scenario 8: Table Hitting 1 Billion Rows — Everything Slows

### 🔴 The Incident
The `events` table has 1.2 billion rows. `SELECT COUNT(*)` takes 45 minutes. Simple JOINs timeout. Backup takes 18 hours.

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | All operations degrade: reads, writes, backups, index rebuilds |
| **Why** | B-Tree depth increases, buffer pool can't cache enough, I/O dominates |
| **When** | Typically above 500M rows for OLTP, depends on row size |
| **Where** | Event logs, IoT data, transaction history, audit trails |
| **Who** | Every engineer who touches this table |
| **How** | Partition, archive, summarize, or move to specialized storage |

### SQL Solution

```sql
-- Step 1: PARTITION by date range (most common for time-series)
-- MySQL:
ALTER TABLE events PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ...
    PARTITION p202503 VALUES LESS THAN (202504),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Step 2: ARCHIVE old partitions
-- Move 2023 data to archive table
CREATE TABLE events_archive LIKE events;
ALTER TABLE events_archive REMOVE PARTITIONING;

INSERT INTO events_archive SELECT * FROM events PARTITION (p202301);
ALTER TABLE events DROP PARTITION p202301;
-- Repeat for each old month

-- Step 3: MATERIALIZED VIEWS for aggregates (PostgreSQL)
CREATE MATERIALIZED VIEW event_daily_stats AS
SELECT 
    DATE(created_at) AS event_date,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM events
GROUP BY DATE(created_at), event_type;

CREATE UNIQUE INDEX idx_event_stats ON event_daily_stats(event_date, event_type);
REFRESH MATERIALIZED VIEW CONCURRENTLY event_daily_stats;

-- Step 4: APPROXIMATE COUNT instead of exact COUNT(*)
-- PostgreSQL fast estimate:
SELECT reltuples::BIGINT AS estimated_count
FROM pg_class WHERE relname = 'events';

-- MySQL fast estimate:
SELECT TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_NAME = 'events';

-- Step 5: Vertical partition — move large columns to separate table
CREATE TABLE event_payloads (
    event_id BIGINT PRIMARY KEY,
    payload JSON,
    FOREIGN KEY (event_id) REFERENCES events(id)
);
-- Main events table is now MUCH smaller per row = more rows in buffer pool
```

### Spring Boot Connection Pool Tuning for Large Tables

```java
// application.yml for billion-row tables
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      connection-timeout: 30000
      # Critical: prevent long queries from hogging connections
      leak-detection-threshold: 60000 
  jpa:
    properties:
      hibernate:
        jdbc:
          # Batch inserts — 50x faster than individual inserts
          batch_size: 1000
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
        # Fetch size for large result sets
        jdbc.fetch_size: 500

// Streaming large result sets (don't load 1B rows into memory!)
@Repository
public class EventRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    public void processAllEvents(Consumer<Event> processor) {
        try (Stream<Event> stream = em.createQuery(
                "SELECT e FROM Event e WHERE e.createdAt > :cutoff", Event.class)
            .setParameter("cutoff", LocalDate.now().minusDays(30))
            .setHint(QueryHints.HINT_FETCH_SIZE, 500)
            .getResultStream()) {
            
            stream.forEach(processor);
        }
    }
}
```

---




## Scenario 9: Disk Space 95% Full — Production Alert

### 🔴 The Incident
PagerDuty fires: "DISK USAGE 95%". Database writes start failing within hours.

### Emergency SQL Triage

```sql
-- Step 1: WHAT is consuming space? (PostgreSQL)
SELECT 
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS data_size,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - 
                   pg_relation_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- MySQL equivalent:
SELECT 
    TABLE_NAME,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
LIMIT 20;

-- Step 2: Find and kill space hogs

-- 2a: Unused indexes consuming space
SELECT 
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND pg_relation_size(indexrelid) > 10 * 1024 * 1024  -- > 10MB
ORDER BY pg_relation_size(indexrelid) DESC;

-- 2b: Drop unused indexes (IMMEDIATE space recovery)
DROP INDEX idx_events_old_category;  -- 2.3 GB recovered

-- 2c: Truncate log/temp tables
TRUNCATE TABLE application_logs;  -- Instant space recovery
TRUNCATE TABLE temp_import_staging;

-- 2d: VACUUM FULL for PostgreSQL (reclaims dead tuple space — LOCKS TABLE)
VACUUM FULL events;  -- Last resort, causes downtime

-- 2e: Optimize for MySQL (reclaims fragmented space)
OPTIMIZE TABLE events;

-- Step 3: Set up proactive monitoring
CREATE TABLE disk_usage_log (
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    table_name VARCHAR(100),
    total_bytes BIGINT,
    row_count BIGINT
);

-- Daily job to track growth
INSERT INTO disk_usage_log (table_name, total_bytes, row_count)
SELECT 
    schemaname || '.' || tablename,
    pg_total_relation_size(schemaname || '.' || tablename),
    (SELECT reltuples FROM pg_class WHERE relname = tablename)
FROM pg_tables
WHERE schemaname = 'public';

-- Growth rate report
SELECT 
    table_name,
    pg_size_pretty(MAX(total_bytes) - MIN(total_bytes)) AS growth_30d,
    ROUND((MAX(total_bytes) - MIN(total_bytes)) / 1024.0 / 1024 / 30, 2) AS mb_per_day
FROM disk_usage_log
WHERE checked_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY table_name
ORDER BY MAX(total_bytes) - MIN(total_bytes) DESC;
```

---

## Scenario 10: Transaction Log Eating All Disk Space

### 🔴 The Incident
SQL Server: Transaction log file is 200 GB while the database is only 15 GB. Or PostgreSQL: WAL files consuming 100 GB.

### SQL Solution

```sql
-- SQL Server: Check log space usage
DBCC SQLPERF(LOGSPACE);

-- Why is the log so big?
SELECT name, log_reuse_wait_desc 
FROM sys.databases WHERE name = DB_NAME();
-- Common results:
-- LOG_BACKUP         → No log backups configured!
-- ACTIVE_TRANSACTION → Long-running transaction holding log open
-- REPLICATION        → Replication subscriber is behind

-- Fix 1: Take a log backup (SQL Server)
BACKUP LOG YourDB TO DISK = 'D:\Backups\YourDB_log.trn';
-- Then shrink:
DBCC SHRINKFILE (YourDB_log, 1024);  -- Shrink to 1 GB

-- Fix 2: Kill long-running transactions
SELECT 
    session_id, start_time, status, command,
    DATEDIFF(MINUTE, start_time, GETDATE()) AS running_minutes
FROM sys.dm_exec_requests
WHERE status = 'running'
ORDER BY start_time;

-- PostgreSQL: Check WAL usage
SELECT pg_size_pretty(SUM(size)) AS total_wal_size
FROM pg_ls_waldir();

-- PostgreSQL: Check replication lag (WAL retained for replicas)
SELECT 
    client_addr,
    state,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replication_lag
FROM pg_stat_replication;

-- PostgreSQL: Reduce WAL retention
ALTER SYSTEM SET wal_keep_size = '1GB';  -- Default may be too high
SELECT pg_reload_conf();
```

---



> 🔬 **Section Challenge — Scenario 10: Transaction Log Eating All Disk Space**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## Scenario 11: BLOB/TEXT Columns Inflating Table Size 100x

### 🔴 The Incident
Product team added a `description TEXT` column to the `products` table. Someone uploaded 50MB product descriptions via bulk import. Table went from 500MB to 47GB.

### SQL Solution

```sql
-- Diagnose: Find oversized TEXT/BLOB values
SELECT 
    id,
    LENGTH(description) AS desc_bytes,
    pg_size_pretty(LENGTH(description)::BIGINT) AS desc_size
FROM products
WHERE LENGTH(description) > 100000  -- > 100KB
ORDER BY LENGTH(description) DESC
LIMIT 20;

-- Fix 1: Move large columns to a separate table
CREATE TABLE product_descriptions (
    product_id INT PRIMARY KEY REFERENCES products(id),
    description TEXT,
    description_html TEXT
);

INSERT INTO product_descriptions 
SELECT id, description, description_html FROM products;

ALTER TABLE products DROP COLUMN description, DROP COLUMN description_html;
-- Main table drops from 47GB back to ~500MB

-- Fix 2: Add a CHECK constraint to prevent future abuse
ALTER TABLE product_descriptions 
ADD CONSTRAINT chk_desc_size CHECK (LENGTH(description) <= 50000);  -- 50KB max

-- Fix 3: Compress on the application side before storing
-- PostgreSQL TOAST handles this automatically for values > 2KB
-- But MySQL doesn't — compress in application layer
```

### Spring Boot Prevention

```java
@Entity
public class Product {
    
    @Column(length = 50000)  // Schema-level hint
    @Size(max = 50000, message = "Description cannot exceed 50KB")
    private String description;
    
    // For truly large content, use lazy loading
    @Lob
    @Basic(fetch = FetchType.LAZY)  // Only load when accessed
    private byte[] detailedSpecs;
}

// Request validation to prevent abuse
@RestController
public class ProductController {
    
    @PostMapping("/products")
    public Product create(@Valid @RequestBody ProductRequest req) {
        if (req.getDescription() != null && 
            req.getDescription().getBytes(StandardCharsets.UTF_8).length > 50_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "Description exceeds 50KB limit");
        }
        return productService.create(req);
    }
}
```

---




## Scenario 12: Index Bloat — Indexes Bigger Than the Data

### 🔴 The Incident
Table data is 2 GB but indexes total 8 GB. Every INSERT is slow because 6 indexes must be updated.

### SQL Solution

```sql
-- PostgreSQL: Find bloated indexes
SELECT 
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_size_pretty(pg_relation_size(indrelid)) AS table_size,
    idx_scan AS times_used,
    CASE WHEN idx_scan = 0 THEN 'NEVER USED — DROP IT' 
         WHEN idx_scan < 10 THEN 'RARELY USED — REVIEW'
         ELSE 'ACTIVE' END AS recommendation
FROM pg_stat_user_indexes
JOIN pg_index ON pg_index.indexrelid = pg_stat_user_indexes.indexrelid
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate/redundant indexes
SELECT 
    a.indexrelname AS index_a,
    b.indexrelname AS index_b,
    pg_size_pretty(pg_relation_size(a.indexrelid)) AS size_a,
    pg_size_pretty(pg_relation_size(b.indexrelid)) AS size_b
FROM pg_stat_user_indexes a
JOIN pg_stat_user_indexes b ON a.relname = b.relname AND a.indexrelid < b.indexrelid
JOIN pg_index ia ON ia.indexrelid = a.indexrelid
JOIN pg_index ib ON ib.indexrelid = b.indexrelid
WHERE ia.indkey::text LIKE ib.indkey::text || '%'
   OR ib.indkey::text LIKE ia.indkey::text || '%';
-- If index(a,b) exists, index(a) is redundant

-- REINDEX to reclaim bloated index space (PostgreSQL)
REINDEX INDEX CONCURRENTLY idx_orders_customer;  -- No downtime

-- MySQL: Check index sizes
SELECT 
    TABLE_NAME, INDEX_NAME,
    ROUND(STAT_VALUE * @@innodb_page_size / 1024 / 1024, 2) AS size_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size' AND database_name = DATABASE()
ORDER BY STAT_VALUE DESC;
```

---

## Scenario 13: Dead Tuples / Table Bloat in PostgreSQL

### 🔴 The Incident
PostgreSQL table is 50 GB on disk but only has 5 GB of live data. `VACUUM` isn't reclaiming space. Queries scan 10x more pages than necessary.

### SQL Solution

```sql
-- Check dead tuple ratio
SELECT 
    schemaname || '.' || relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
    last_vacuum,
    last_autovacuum,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- Why isn't autovacuum keeping up?
SHOW autovacuum_vacuum_cost_delay;      -- Default 2ms — too slow for big tables
SHOW autovacuum_vacuum_cost_limit;      -- Default 200 — too conservative
SHOW autovacuum_max_workers;            -- Default 3

-- Fix: Tune autovacuum for large tables
ALTER TABLE events SET (
    autovacuum_vacuum_cost_delay = 0,        -- No throttling
    autovacuum_vacuum_cost_limit = 10000,    -- Aggressive
    autovacuum_vacuum_scale_factor = 0.01,   -- Trigger at 1% dead (not 20% default)
    autovacuum_analyze_scale_factor = 0.005
);

-- Emergency: full vacuum (locks table!)
VACUUM FULL events;  -- Rewrites entire table, reclaims all dead space

-- Better alternative: pg_repack (no lock!)
-- Install: CREATE EXTENSION pg_repack;
-- Run: pg_repack -t events -d mydb
```

---




## Scenario 14: Archive Strategy — Hot/Warm/Cold Data

### SQL Solution

```sql
-- Automated archive with partition exchange (PostgreSQL)
-- HOT:  Current month (SSD, indexed)
-- WARM: Last 12 months (HDD, indexed)
-- COLD: 1+ year old (compressed, minimal indexes)

-- Create tablespaces
CREATE TABLESPACE fast_ssd LOCATION '/ssd/pgdata';
CREATE TABLESPACE bulk_hdd LOCATION '/hdd/pgdata';

-- Partitioned table with tablespace routing
CREATE TABLE orders (
    id BIGINT,
    created_at TIMESTAMP NOT NULL,
    customer_id INT,
    total DECIMAL(10,2)
) PARTITION BY RANGE (created_at);

-- Hot partition (current month) on SSD
CREATE TABLE orders_2025_03 PARTITION OF orders
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01')
    TABLESPACE fast_ssd;

-- Warm partitions on HDD
CREATE TABLE orders_2024_03 PARTITION OF orders
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01')
    TABLESPACE bulk_hdd;

-- Monthly maintenance job
CREATE OR REPLACE FUNCTION archive_monthly() RETURNS void AS $$
DECLARE
    cold_month TEXT;
    new_month TEXT;
BEGIN
    -- Move 13-month-old partition to cold storage
    cold_month := TO_CHAR(CURRENT_DATE - INTERVAL '13 months', 'YYYY_MM');
    EXECUTE format(
        'ALTER TABLE orders_%s SET TABLESPACE bulk_hdd', cold_month
    );
    -- Remove indexes from cold partition (save space)
    EXECUTE format(
        'DROP INDEX IF EXISTS idx_orders_%s_customer', cold_month
    );
    
    -- Create next month's hot partition
    new_month := TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY_MM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS orders_%s PARTITION OF orders '
        'FOR VALUES FROM (%L) TO (%L) TABLESPACE fast_ssd',
        new_month,
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months')
    );
END;
$$ LANGUAGE plpgsql;
```

---

## Scenario 15: Soft Delete Accumulation — 90% Rows Are "Deleted"

### 🔴 The Incident
Table has `is_deleted BOOLEAN DEFAULT FALSE`. After 5 years, 90% of 800M rows are deleted. Every query scans dead rows. Indexes bloated with deleted entries.

### SQL Solution

```sql
-- Problem: Every query must filter deleted rows
SELECT * FROM users WHERE is_deleted = FALSE AND email = 'foo@bar.com';
-- Index on email includes ALL 800M rows including 720M deleted ones

-- Fix 1: PARTIAL INDEX (PostgreSQL) — index ONLY live rows
CREATE INDEX idx_users_email_active ON users(email) 
WHERE is_deleted = FALSE;
-- Index size drops from 12GB to 1.2GB; queries use only this index

-- MySQL equivalent: generated column + index
ALTER TABLE users ADD COLUMN active_email VARCHAR(255) 
GENERATED ALWAYS AS (CASE WHEN is_deleted = FALSE THEN email END) STORED;
CREATE INDEX idx_active_email ON users(active_email);

-- Fix 2: PARTITION by delete status
ALTER TABLE users RENAME TO users_old;
CREATE TABLE users (LIKE users_old INCLUDING ALL) 
PARTITION BY LIST (is_deleted);
CREATE TABLE users_active PARTITION OF users FOR VALUES IN (FALSE);
CREATE TABLE users_deleted PARTITION OF users FOR VALUES IN (TRUE);
INSERT INTO users SELECT * FROM users_old;
-- Queries on active users ONLY scan users_active partition

-- Fix 3: Move deleted rows to archive table periodically
CREATE TABLE users_archive (LIKE users INCLUDING ALL);

-- Nightly archive job
WITH moved AS (
    DELETE FROM users 
    WHERE is_deleted = TRUE 
      AND deleted_at < CURRENT_DATE - INTERVAL '90 days'
    RETURNING *
)
INSERT INTO users_archive SELECT * FROM moved;
```

### Spring Boot Global Filter

```java
// Hibernate @Where filter — automatically excludes deleted rows
@Entity
@Table(name = "users")
@SQLRestriction("is_deleted = false")  // Hibernate 6.x
// @Where(clause = "is_deleted = false")  // Hibernate 5.x
public class User {
    @Id
    private Long id;
    private String email;
    private boolean isDeleted;
    private Instant deletedAt;
}
// Every JPA query automatically adds WHERE is_deleted = false
// No developer can accidentally fetch deleted users
```

---

## Scenario 16–25: Quick-Fire Production Scenarios

### Scenario 16: Auto-Increment Reset After DELETE
```sql
-- Problem: Deleted all rows but auto_increment doesn't reset
TRUNCATE TABLE temp_data;  -- Resets auto_increment (MySQL)
-- vs DELETE FROM temp_data; -- Does NOT reset!

-- Manual reset:
ALTER TABLE temp_data AUTO_INCREMENT = 1;

-- PostgreSQL:
ALTER SEQUENCE temp_data_id_seq RESTART WITH 1;
```

### Scenario 17: Multi-Tenant ID Isolation
```sql
-- Problem: Tenant A can guess Tenant B's order IDs (sequential)
-- Solution: Per-tenant random-looking IDs using Hashids/Sqids

-- SQL: Obfuscated public IDs with tenant prefix
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    public_id VARCHAR(20) NOT NULL,  -- "TN42-X7K9M2" 
    UNIQUE KEY uk_public_id (tenant_id, public_id)
);

-- Or: Separate sequences per tenant
CREATE SEQUENCE tenant_1_orders_seq;
CREATE SEQUENCE tenant_2_orders_seq;
```

### Scenario 18: Time-Series Data Flooding — 1M Rows/Hour
```sql
-- Problem: IoT sensors sending 1M readings/hour, INSERT can't keep up
-- Solution: Batch inserts + TimescaleDB hypertable

-- Step 1: Batch INSERT (not row-by-row!)
INSERT INTO sensor_readings (sensor_id, value, ts)
VALUES 
    (1, 23.5, '2025-03-08 10:00:01'),
    (1, 23.6, '2025-03-08 10:00:02'),
    -- ... 1000 rows per batch
    (1, 24.1, '2025-03-08 10:00:59');
-- 1000x faster than individual INSERTs

-- Step 2: Continuous aggregate (pre-computed summaries)
CREATE MATERIALIZED VIEW sensor_hourly
WITH (timescaledb.continuous) AS
SELECT 
    sensor_id,
    time_bucket('1 hour', ts) AS hour,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count
FROM sensor_readings
GROUP BY sensor_id, time_bucket('1 hour', ts);
```

### Scenario 19: Audit Log Table Consuming 80% of Storage
```sql
-- Problem: audit_log table is 200GB, growing 2GB/day
-- Solution: Tiered retention + compression

-- Keep last 90 days full detail, summarize older
CREATE TABLE audit_log_archive AS
SELECT 
    DATE(action_time) AS action_date,
    action_type,
    table_name,
    user_id,
    COUNT(*) AS action_count
FROM audit_log
WHERE action_time < CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(action_time), action_type, table_name, user_id;

DELETE FROM audit_log WHERE action_time < CURRENT_DATE - INTERVAL '90 days';
VACUUM FULL audit_log;
-- 200GB → 30GB instantly
```

### Scenario 20: TOAST Table Bloat (PostgreSQL)
```sql
-- Problem: Table is 5GB but pg_total_relation_size shows 40GB
-- The extra 35GB is in the TOAST table (large values stored out-of-line)

-- Diagnose:
SELECT 
    c.relname AS main_table,
    pg_size_pretty(pg_relation_size(c.oid)) AS main_size,
    t.relname AS toast_table,
    pg_size_pretty(pg_relation_size(t.oid)) AS toast_size
FROM pg_class c
JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relkind = 'r'
ORDER BY pg_relation_size(t.oid) DESC;

-- Fix: VACUUM FULL or pg_repack to reclaim TOAST bloat
VACUUM FULL the_bloated_table;
```

### Scenario 21: Partition Table Reaching OS File Handle Limits
```sql
-- Problem: 5000 daily partitions = 5000+ files. OS ulimit is 1024.
-- Solution: Consolidate to monthly partitions, archive old ones

-- Merge daily partitions into monthly
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

INSERT INTO events_2024_01 
SELECT * FROM events_2024_01_01
UNION ALL SELECT * FROM events_2024_01_02
-- ... all 31 days
;
```

### Scenario 22: Foreign Key Chains Blocking Deletes at Scale
```sql
-- Problem: DELETE FROM customers WHERE id = 5 takes 30 minutes
-- Because it cascades through: orders → order_items → shipments → tracking

-- Solution 1: Batch delete bottom-up (reverse FK order)
DELETE FROM tracking WHERE shipment_id IN 
    (SELECT id FROM shipments WHERE order_id IN 
        (SELECT id FROM orders WHERE customer_id = 5));
DELETE FROM shipments WHERE order_id IN 
    (SELECT id FROM orders WHERE customer_id = 5);
DELETE FROM order_items WHERE order_id IN 
    (SELECT id FROM orders WHERE customer_id = 5);
DELETE FROM orders WHERE customer_id = 5;
DELETE FROM customers WHERE id = 5;

-- Solution 2: Deferred constraints (PostgreSQL)
SET CONSTRAINTS ALL DEFERRED;
DELETE FROM customers WHERE id = 5;
-- Constraints checked at COMMIT, not per-statement
```

### Scenario 23: Orphaned Rows After Failed Cascade Delete
```sql
-- Problem: Application crashed mid-delete. orders deleted but order_items remain.
-- Find orphans:
SELECT oi.id, oi.order_id
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- Clean up orphans:
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

-- Prevent future orphans: Add FK constraint if missing
ALTER TABLE order_items 
ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
```

### Scenario 24: Character Encoding Mismatch Wasting 3x Storage
```sql
-- Problem: Table uses latin1 but stores emoji/unicode → mojibake AND wasted space
-- utf8mb4 with latin1 columns = 4 bytes per char instead of 1

-- Check current encoding:
SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE IN ('varchar', 'text', 'char')
ORDER BY TABLE_NAME;

-- Fix: Convert to utf8mb4
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- WARNING: This rewrites the table and may change column sizes
-- VARCHAR(255) in utf8mb4 = max 1020 bytes
```

### Scenario 25: CTE / Temp Table Memory Explosion
```sql
-- Problem: CTE materializes 50M rows into memory, OOM kill
WITH all_events AS (
    SELECT * FROM events  -- 50M rows materialized!
)
SELECT * FROM all_events WHERE user_id = 42;

-- Fix 1: PostgreSQL 12+ can inline CTEs
WITH all_events AS NOT MATERIALIZED (
    SELECT * FROM events
)
SELECT * FROM all_events WHERE user_id = 42;
-- Optimizer pushes WHERE into the CTE scan

-- Fix 2: Don't use CTE when a subquery works
SELECT * FROM events WHERE user_id = 42;  -- Obviously better

-- Fix 3: For temp tables, set size limits
SET temp_buffers = '256MB';  -- Per-session temp table memory
SET work_mem = '128MB';      -- Per-operation sort/hash memory
```

---

## 🧠 DSA Patterns Behind These Scenarios

| Scenario | DSA Pattern |
|----------|-------------|
| ID exhaustion | **Overflow detection** — checking bounds before increment |
| Base-36 IDs | **Number base conversion** — div/mod loop |
| UUID vs auto-inc | **BST insert patterns** — random vs sequential |
| Snowflake IDs | **Bit manipulation** — shift and mask |
| Merge conflicts | **Merge sort stability** — preserving origin |
| Billion-row scan | **Binary search** — why O(log n) index beats O(n) scan |
| Disk space triage | **Priority queue** — find top-K space consumers |
| Dead tuples | **Garbage collection** — mark-and-sweep |
| Archive strategy | **LRU cache** — eviction policy (hot/cold) |
| Soft delete bloat | **Lazy deletion** — marking vs actual removal |
| FK cascade delete | **DFS/BFS** — tree/graph traversal order |
| Orphan detection | **Dangling pointer** — reference to freed memory |

---

[⬅ Previous: 37_SQL_5WH_Deep_Reasoning](37_SQL_5WH_Deep_Reasoning.md) | [📚 Index](00_INDEX.md) | [Next: 39_RealWorld_Production_Scenarios_Part2 ➡](39_RealWorld_Production_Scenarios_Part2.md)



