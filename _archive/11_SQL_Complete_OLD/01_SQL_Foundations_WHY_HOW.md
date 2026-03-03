# 📊 SQL FOUNDATIONS - WHY-HOW Framework

> **From Zero to SQL Fluency - Every Concept Explained with Real-World Context**
> _"Understanding WHY before HOW makes learning permanent"_

---

# 🎯 LEARNING PHILOSOPHY

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    THE WHY-HOW FRAMEWORK FOR SQL                                 ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  For every SQL concept, we answer:                                               ║
║                                                                                   ║
║  🔵 WHY does this exist?                                                        ║
║     └── What real-world problem does it solve?                                  ║
║     └── What would happen without it?                                           ║
║     └── Which companies use this? When?                                         ║
║                                                                                   ║
║  🟢 HOW does it work?                                                           ║
║     └── Core syntax and mechanics                                               ║
║     └── Step-by-step execution                                                  ║
║     └── Visual representation                                                   ║
║                                                                                   ║
║  🟡 WHEN to use it?                                                             ║
║     └── Best practice scenarios                                                 ║
║     └── Anti-patterns to avoid                                                  ║
║     └── Performance implications                                                ║
║                                                                                   ║
║  🔴 REAL-WORLD Story                                                            ║
║     └── Production incident or use case                                         ║
║     └── How it was solved using this concept                                    ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# PART 1: WHY DATABASES EXIST

---

## Chapter 1: Understanding the Problem Before the Solution

### 🔵 WHY: The World Before Databases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LIFE WITHOUT DATABASES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SCENARIO: E-commerce Company with 1 Million Users                              │
│                                                                                  │
│  WITHOUT DATABASE (Using Files):                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  users.txt                     orders.txt                                  ││
│  │  ─────────                     ──────────                                  ││
│  │  1,John,john@email.com         1001,1,2024-01-15,500.00                    ││
│  │  2,Jane,jane@email.com         1002,2,2024-01-15,250.00                    ││
│  │  3,Bob,bob@email.com           1003,1,2024-01-16,750.00                    ││
│  │  ...1 million more lines        ...5 million more lines                    ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  PROBLEMS:                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  1. SPEED: Find all orders for user 567,823?                               ││
│  │     → Must read entire 5 million line file! Takes minutes.                 ││
│  │                                                                            ││
│  │  2. CONSISTENCY: Two systems update same user simultaneously?              ││
│  │     → Data corruption! Which version is correct?                           ││
│  │                                                                            ││
│  │  3. INTEGRITY: Delete user but orders still reference them?                ││
│  │     → Orphan data! Orders point to non-existent user.                      ││
│  │                                                                            ││
│  │  4. CONCURRENT ACCESS: 10,000 users reading/writing files?                 ││
│  │     → File locks! System crashes! Data loss!                              ││
│  │                                                                            ││
│  │  5. RECOVERY: Power outage during file write?                              ││
│  │     → Partial data! Corrupted files! Business disaster!                    ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: In 2003, a major airline lost $50M in revenue               │
│     when their flat-file booking system crashed during peak season.             │
│     Recovery took 3 days. They migrated to Oracle within 6 months.              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### How Databases Solve These Problems

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SOLUTIONS                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Problem               │ Database Solution          │ How It Works              │
│  ──────────────────────┼────────────────────────────┼───────────────────────────│
│  Slow Search           │ INDEXES                    │ B-Tree structure: O(log n)│
│                        │                            │ 1M rows → ~20 lookups     │
│  ──────────────────────┼────────────────────────────┼───────────────────────────│
│  Data Corruption       │ TRANSACTIONS + ACID        │ All-or-nothing updates    │
│                        │                            │ Locks during writes       │
│  ──────────────────────┼────────────────────────────┼───────────────────────────│
│  Orphan Data           │ FOREIGN KEYS               │ Can't delete parent if    │
│                        │                            │ children exist (CASCADE)  │
│  ──────────────────────┼────────────────────────────┼───────────────────────────│
│  Concurrent Access     │ LOCK MANAGER               │ Row/Table level locks     │
│                        │ MVCC (PostgreSQL)          │ Version control for data  │
│  ──────────────────────┼────────────────────────────┼───────────────────────────│
│  Data Loss             │ TRANSACTION LOGS (WAL)     │ Replay logs after crash   │
│                        │ Checkpoints                │ Regular state snapshots   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 2: SQL COMMAND CATEGORIES - WHY EACH EXISTS

---

## Chapter 2: DDL - Data Definition Language

### 🔵 WHY: Why Do We Need DDL?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY DDL EXISTS                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ANALOGY: Building a House                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Before putting furniture (DATA), you need:                                ││
│  │                                                                            ││
│  │  1. BLUEPRINT (Schema)     → CREATE DATABASE                               ││
│  │  2. ROOMS (Structure)      → CREATE TABLE                                  ││
│  │  3. ROOM TYPES (Rules)     → Data Types + Constraints                      ││
│  │  4. RENOVATIONS            → ALTER TABLE                                   ││
│  │  5. DEMOLITION             → DROP TABLE                                    ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: Flipkart's Big Billion Day 2015                              │
│                                                                                  │
│  WHAT HAPPENED:                                                                 │
│  - Expected 10M orders, got 15M in first hour                                   │
│  - Original schema: Single 'orders' table with all columns                      │
│  - Result: Table locks, 30-minute delays, customer rage                         │
│                                                                                  │
│  WHAT THEY LEARNED:                                                             │
│  - Normalize tables: orders, order_items, order_status (separate tables)        │
│  - Add proper indexes on order_id, customer_id, created_at                      │
│  - Partition tables by date for faster queries                                  │
│                                                                                  │
│  OUTCOME: 2016 sale handled 8x the traffic with no issues                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: CREATE TABLE - Deep Dive

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE TABLE: THE COMPLETE PICTURE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXAMPLE 1: E-commerce System (Production-Grade Schema)
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY this structure? Let's break down EVERY decision:

CREATE TABLE customers (
    -- PRIMARY KEY: WHY INT vs BIGINT?
    -- INT: 2.1 billion max - sufficient for most companies
    -- BIGINT: 9.2 quintillion - use for app with billions of records (like Facebook)
    customer_id     INT PRIMARY KEY AUTO_INCREMENT,
    
    -- WHY VARCHAR(100) for email?
    -- RFC 5321 allows 254 chars, but 99.9% emails < 100 chars
    -- Shorter = faster index, less storage
    -- WHY UNIQUE? One account per email
    email           VARCHAR(100) NOT NULL UNIQUE,
    
    -- WHY separate first_name and last_name?
    -- Sorting by last name
    -- Addressing in emails: "Dear John"
    -- Search flexibility
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    
    -- WHY CHAR(60) for password hash?
    -- bcrypt always produces 60 character hash
    -- CHAR is faster than VARCHAR for fixed-length data
    password_hash   CHAR(60) NOT NULL,
    
    -- WHY VARCHAR(15) for phone?
    -- International format: +1-234-567-8901 = 14 chars
    -- Leave 1 char buffer
    phone           VARCHAR(15),
    
    -- WHY TIMESTAMP vs DATETIME?
    -- TIMESTAMP: Auto timezone conversion, 4 bytes, range 1970-2038
    -- DATETIME: No timezone, 8 bytes, range 1000-9999
    -- Use TIMESTAMP for audit fields (created_at, updated_at)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- WHY BOOLEAN with DEFAULT?
    -- New accounts should be active by default
    -- Soft delete: Set is_active = FALSE instead of DELETE
    is_active       BOOLEAN DEFAULT TRUE,
    
    -- WHY INDEX on created_at?
    -- "Show me users who signed up in last 7 days" - common query
    INDEX idx_created_at (created_at),
    
    -- WHY composite INDEX on (last_name, first_name)?
    -- "Find users named 'Smith, John'" - searches both fields
    -- Index on (A, B) can be used for queries on A alone, but not B alone
    INDEX idx_name (last_name, first_name)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXAMPLE 2: Order System with Full Relationships
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE orders (
    order_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- WHY CHAR(20) for order_number?
    -- Business-readable ID: "ORD-2024-00123456"
    -- Internal ID (order_id) for joins, external (order_number) for customers
    order_number    CHAR(20) UNIQUE NOT NULL,
    
    customer_id     INT NOT NULL,
    
    -- WHY DECIMAL(12,2) for amounts?
    -- 12,2 means max 9,999,999,999.99 (10 billion)
    -- NEVER use FLOAT for money! 0.1 + 0.2 = 0.30000000000000004 in FLOAT
    subtotal        DECIMAL(12, 2) NOT NULL,
    tax             DECIMAL(12, 2) DEFAULT 0.00,
    shipping        DECIMAL(12, 2) DEFAULT 0.00,
    total           DECIMAL(12, 2) NOT NULL,
    
    -- WHY ENUM for status?
    -- Limited valid values
    -- Storage: 1-2 bytes (vs VARCHAR which uses more)
    -- Database enforces valid status values
    status          ENUM('pending', 'confirmed', 'processing', 'shipped', 
                        'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    
    -- WHY separate ordered_at from created_at?
    -- ordered_at: When customer placed order
    -- created_at: When record was inserted (might differ in batch imports)
    ordered_at      TIMESTAMP NOT NULL,
    shipped_at      TIMESTAMP NULL,
    delivered_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- FOREIGN KEY with CASCADE
    -- WHY CASCADE on UPDATE but RESTRICT on DELETE?
    -- If customer_id changes (rare), update order automatically
    -- If customer tries to delete, PREVENT if they have orders
    -- This protects business data - orders are financial records
    CONSTRAINT fk_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    
    -- WHY compound INDEX on (customer_id, ordered_at)?
    -- Most common query: "Show me orders for customer X in date range"
    -- This single index handles: customer orders, recent orders, date filtering
    INDEX idx_customer_orders (customer_id, ordered_at DESC),
    
    -- WHY INDEX on status?
    -- "Show all pending orders" - operations team query
    -- Low cardinality but frequently filtered
    INDEX idx_status (status)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXAMPLE 3: Order Items (Many-to-Many relationship)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE order_items (
    -- WHY composite PRIMARY KEY?
    -- One product appears once per order
    -- Prevents duplicate line items
    item_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id        BIGINT NOT NULL,
    product_id      INT NOT NULL,
    
    -- WHY store price here? Product price can change!
    -- Historical accuracy: Order shows price AT TIME OF PURCHASE
    -- Business requirement: Invoice must match what customer paid
    unit_price      DECIMAL(10, 2) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    
    -- WHY store computed total?
    -- Performance: Don't calculate on every read
    -- Flexibility: Can apply line-item discounts
    line_total      DECIMAL(12, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    
    -- WHY UNIQUE on (order_id, product_id)?
    -- One line item per product per order
    -- Customer wants 2 units? Update quantity, don't add new row
    UNIQUE KEY uk_order_product (order_id, product_id)
);
```

### Visual: How Tables Relate

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE DATABASE RELATIONSHIPS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌───────────────────┐                                   │
│                         │    CUSTOMERS      │                                   │
│                         ├───────────────────┤                                   │
│                         │ PK: customer_id   │                                   │
│                         │    email          │                                   │
│                         │    first_name     │                                   │
│                         │    last_name      │                                   │
│                         └────────┬──────────┘                                   │
│                                  │ 1                                            │
│                                  │                                              │
│                                  │ has many                                     │
│                                  │                                              │
│                                  ▼ ∞                                            │
│                         ┌───────────────────┐         ┌───────────────────┐    │
│                         │     ORDERS        │         │     PRODUCTS      │    │
│                         ├───────────────────┤         ├───────────────────┤    │
│                         │ PK: order_id      │         │ PK: product_id    │    │
│                         │ FK: customer_id ──┼─────────│    name           │    │
│                         │    order_number   │         │    price          │    │
│                         │    total          │         │    stock          │    │
│                         │    status         │         └─────────┬─────────┘    │
│                         └────────┬──────────┘                   │              │
│                                  │ 1                            │ 1            │
│                                  │                              │              │
│                                  │ contains                     │ appears in   │
│                                  │                              │              │
│                                  ▼ ∞                            ▼ ∞            │
│                         ┌──────────────────────────────────────────────────┐   │
│                         │               ORDER_ITEMS                         │   │
│                         ├──────────────────────────────────────────────────┤   │
│                         │ PK: item_id                                       │   │
│                         │ FK: order_id ────────────────────┐                │   │
│                         │ FK: product_id ──────────────────┘                │   │
│                         │     quantity                                      │   │
│                         │     unit_price (snapshot at purchase time)        │   │
│                         └──────────────────────────────────────────────────┘   │
│                                                                                  │
│  CARDINALITY:                                                                   │
│  ─────────────                                                                  │
│  Customer (1) ─────→ (∞) Orders      "A customer has many orders"              │
│  Order (1) ─────────→ (∞) Items      "An order has many items"                  │
│  Product (1) ───────→ (∞) Items      "A product appears in many orders"        │
│  Order (∞) ←────────→ (∞) Products   "Many-to-Many via order_items"            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 3: ALTER TABLE - Schema Evolution

### 🔵 WHY: Why Do Schemas Change?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY SCHEMAS EVOLVE                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BUSINESS REASONS:                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  1. NEW FEATURES                                                           ││
│  │     - "We need to store user's profile photo"                              ││
│  │     → ALTER TABLE users ADD COLUMN profile_url VARCHAR(500);               ││
│  │                                                                            ││
│  │  2. REGULATORY COMPLIANCE                                                  ││
│  │     - "GDPR requires consent tracking"                                     ││
│  │     → ALTER TABLE users ADD COLUMN gdpr_consent_date TIMESTAMP;            ││
│  │                                                                            ││
│  │  3. PERFORMANCE ISSUES                                                     ││
│  │     - "Search is slow"                                                     ││
│  │     → ALTER TABLE products ADD INDEX idx_search (name, category);          ││
│  │                                                                            ││
│  │  4. DATA GROWTH                                                            ││
│  │     - "Product IDs exceeded INT limit"                                     ││
│  │     → ALTER TABLE products MODIFY product_id BIGINT;                       ││
│  │                                                                            ││
│  │  5. BUG FIXES                                                              ││
│  │     - "Emails should be case-insensitive unique"                           ││
│  │     → ALTER TABLE users ADD UNIQUE INDEX idx_email_ci (email) USING BTREE; ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: Twitter's early scaling problems (2007-2009)                 │
│                                                                                  │
│  PROBLEM: Single 'tweets' table with all data                                   │
│  SYMPTOMS: "Fail Whale" error page became famous                                │
│                                                                                  │
│  MIGRATION JOURNEY:                                                             │
│  1. Split tweets table by user_id ranges (sharding)                             │
│  2. Moved from MySQL to custom storage (Manhattan)                              │
│  3. Added read replicas for timeline queries                                    │
│  4. Denormalized data for read performance                                      │
│                                                                                  │
│  LESSON: Schema design decisions at day 1 affect scalability at day 1000        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: ALTER TABLE Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ALTER TABLE: COMPLETE OPERATIONS GUIDE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ADDING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add single column
ALTER TABLE customers 
ADD COLUMN loyalty_points INT DEFAULT 0;

-- Add column at specific position (MySQL)
ALTER TABLE customers 
ADD COLUMN middle_name VARCHAR(50) AFTER first_name;

-- Add multiple columns
ALTER TABLE customers 
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender ENUM('M', 'F', 'Other', 'Prefer not to say'),
ADD COLUMN referral_code VARCHAR(20);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. MODIFYING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Change data type (⚠️ DANGEROUS - can lose data!)
-- Safe: VARCHAR(50) → VARCHAR(100) (expanding)
-- Risky: VARCHAR(100) → VARCHAR(50) (truncation)
-- Risky: VARCHAR → INT (conversion errors)

ALTER TABLE customers 
MODIFY COLUMN phone VARCHAR(20);  -- Expand phone field

-- Rename column (MySQL 8.0+)
ALTER TABLE customers 
RENAME COLUMN phone TO phone_number;

-- Change column WITH data conversion
-- Always test on staging first!
ALTER TABLE orders 
MODIFY COLUMN total DECIMAL(15, 2);  -- Increase precision

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. DROPPING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ⚠️ IRREVERSIBLE! Always backup first!
ALTER TABLE customers 
DROP COLUMN middle_name;

-- Drop multiple columns
ALTER TABLE customers 
DROP COLUMN temp_field1,
DROP COLUMN temp_field2;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ADDING/DROPPING CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add UNIQUE constraint
ALTER TABLE products 
ADD CONSTRAINT uk_sku UNIQUE (sku);

-- Add CHECK constraint
ALTER TABLE products 
ADD CONSTRAINT chk_price CHECK (price >= 0);

-- Add FOREIGN KEY
ALTER TABLE orders 
ADD CONSTRAINT fk_shipping_address 
FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id);

-- Drop constraint
ALTER TABLE products 
DROP CONSTRAINT chk_price;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. INDEX OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add index (can be done while table is in use, but slows down)
ALTER TABLE customers 
ADD INDEX idx_email (email);

-- Add composite index
ALTER TABLE orders 
ADD INDEX idx_customer_date (customer_id, ordered_at DESC);

-- Drop index
ALTER TABLE customers 
DROP INDEX idx_email;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. TABLE OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rename table
ALTER TABLE customers RENAME TO users;

-- Change storage engine (MySQL)
ALTER TABLE logs ENGINE = InnoDB;

-- Change character set
ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 🟡 WHEN: Safe vs Risky ALTER Operations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALTER TABLE: RISK ASSESSMENT                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ✅ SAFE (Can do in production):                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • ADD COLUMN with DEFAULT (MySQL 8.0+, PostgreSQL)                        ││
│  │  • ADD INDEX CONCURRENTLY (PostgreSQL)                                     ││
│  │  • Create new INDEX (fast for small tables)                                ││
│  │  • DROP unused INDEX                                                       ││
│  │  • ADD nullable column                                                     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ⚠️ CAUTION (Do during low traffic):                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • ADD INDEX on large table (locks table in MySQL < 8.0)                   ││
│  │  • MODIFY column (rewrites table)                                          ││
│  │  • ADD FOREIGN KEY (validates existing data)                               ││
│  │  • Change VARCHAR length (may rewrite)                                     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🚨 DANGEROUS (Plan maintenance window):                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • DROP COLUMN (irreversible, may break app)                               ││
│  │  • Change column type (data loss possible)                                 ││
│  │  • RENAME TABLE (breaks queries)                                           ││
│  │  • ADD NOT NULL to existing column (fails if NULLs exist)                  ││
│  │  • Change PRIMARY KEY                                                      ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  PRODUCTION MIGRATION CHECKLIST:                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  □ Test on staging with production-size data                               ││
│  │  □ Measure migration time (will table be locked?)                          ││
│  │  □ Take backup before migration                                            ││
│  │  □ Prepare rollback script                                                 ││
│  │  □ Schedule during low-traffic window                                      ││
│  │  □ Monitor application errors during/after                                 ││
│  │  □ Have DBA on call                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 4: DML - Data Manipulation Language

### 🔵 WHY: CRUD Operations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY DML EXISTS                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CRUD = Create, Read, Update, Delete                                            │
│                                                                                  │
│  MAPPING TO SQL:                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  CREATE  ──────────→  INSERT                                               ││
│  │  READ    ──────────→  SELECT                                               ││
│  │  UPDATE  ──────────→  UPDATE                                               ││
│  │  DELETE  ──────────→  DELETE                                               ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  MAPPING TO REST APIs:                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  HTTP Method │ SQL Operation │ Example                                     ││
│  │  ────────────┼───────────────┼───────────────────────────────────────────  ││
│  │  POST        │ INSERT        │ Create new user account                     ││
│  │  GET         │ SELECT        │ Fetch user profile                          ││
│  │  PUT/PATCH   │ UPDATE        │ Update email address                        ││
│  │  DELETE      │ DELETE        │ Remove user account                         ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: GitLab Database Deletion (2017)                              │
│                                                                                  │
│  WHAT HAPPENED:                                                                 │
│  - Admin ran DELETE without WHERE clause during maintenance                     │
│  - Command: "DELETE FROM production_db"                                         │
│  - 300GB of production data wiped in seconds                                    │
│                                                                                  │
│  WHAT FAILED:                                                                   │
│  - 5 different backup methods, ALL failed                                       │
│  - LVM snapshots: configured wrong                                              │
│  - S3 backups: not running                                                      │
│  - Azure disk snapshots: never enabled                                          │
│                                                                                  │
│  AFTERMATH:                                                                     │
│  - 6 hours of data lost                                                         │
│  - GitLab was transparent, live-streamed recovery                               │
│  - Now they have mandatory WHERE clause checks                                  │
│                                                                                  │
│  LESSON: "DELETE FROM table" should NEVER work without WHERE                    │
│          Use sql_safe_updates=1 in MySQL!                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: INSERT Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERT: ALL VARIATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC INSERT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single row with all columns specified
INSERT INTO customers (email, first_name, last_name, password_hash)
VALUES ('john@example.com', 'John', 'Doe', '$2a$10$abc123hash');

-- Single row relying on defaults
-- created_at, is_active will use DEFAULT values
INSERT INTO customers (email, first_name, last_name, password_hash)
VALUES ('jane@example.com', 'Jane', 'Smith', '$2a$10$xyz789hash');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. MULTIPLE ROWS (BATCH INSERT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY batch inserts?
-- 1000 individual INSERTs = 1000 transactions, 1000 network round trips
-- 1 batch INSERT = 1 transaction, 1 network round trip
-- Performance: 10-100x faster!

INSERT INTO customers (email, first_name, last_name, password_hash)
VALUES 
    ('user1@example.com', 'User', 'One', '$hash1'),
    ('user2@example.com', 'User', 'Two', '$hash2'),
    ('user3@example.com', 'User', 'Three', '$hash3'),
    ('user4@example.com', 'User', 'Four', '$hash4'),
    ('user5@example.com', 'User', 'Five', '$hash5');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. INSERT FROM SELECT (Data Migration/ETL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Copy data from one table to another
INSERT INTO customers_archive (customer_id, email, first_name, last_name, created_at)
SELECT customer_id, email, first_name, last_name, created_at
FROM customers
WHERE created_at < '2023-01-01';

-- Create summary table
INSERT INTO monthly_sales_summary (month, total_sales, order_count)
SELECT 
    DATE_FORMAT(ordered_at, '%Y-%m') AS month,
    SUM(total) AS total_sales,
    COUNT(*) AS order_count
FROM orders
WHERE ordered_at >= '2024-01-01'
GROUP BY DATE_FORMAT(ordered_at, '%Y-%m');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. INSERT OR UPDATE (UPSERT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL: INSERT ... ON DUPLICATE KEY UPDATE
-- WHY: Avoid checking if record exists, then deciding INSERT or UPDATE
INSERT INTO product_inventory (product_id, quantity, last_updated)
VALUES (101, 50, NOW())
ON DUPLICATE KEY UPDATE 
    quantity = quantity + VALUES(quantity),
    last_updated = NOW();

-- PostgreSQL: INSERT ... ON CONFLICT
INSERT INTO product_inventory (product_id, quantity, last_updated)
VALUES (101, 50, NOW())
ON CONFLICT (product_id) DO UPDATE SET
    quantity = product_inventory.quantity + EXCLUDED.quantity,
    last_updated = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. INSERT IGNORE (Skip Duplicates)
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY: Bulk import where some records may already exist
-- Instead of failing on duplicate, silently skip
INSERT IGNORE INTO customers (email, first_name, last_name, password_hash)
VALUES 
    ('existing@email.com', 'Will', 'Skip', '$hash'),    -- Skipped if exists
    ('new@email.com', 'Will', 'Insert', '$hash');       -- Inserted
```

### 🟢 HOW: UPDATE Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATE: SAFE PRACTICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC UPDATE (Always use WHERE!)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single record update
UPDATE customers 
SET email = 'newemail@example.com'
WHERE customer_id = 12345;

-- Multiple columns
UPDATE customers 
SET 
    first_name = 'Jonathan',
    phone = '+1-555-123-4567',
    updated_at = NOW()
WHERE customer_id = 12345;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CONDITIONAL UPDATE (CASE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update multiple records with different values based on condition
UPDATE products 
SET price = CASE
    WHEN category = 'Electronics' THEN price * 0.90  -- 10% off electronics
    WHEN category = 'Clothing' THEN price * 0.80     -- 20% off clothing
    ELSE price * 0.95                                 -- 5% off everything else
END
WHERE is_on_sale = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. UPDATE WITH JOIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update based on data from another table
-- Example: Mark orders as "VIP" if customer has spent > $10000
UPDATE orders o
JOIN (
    SELECT customer_id 
    FROM orders 
    GROUP BY customer_id 
    HAVING SUM(total) > 10000
) vip ON o.customer_id = vip.customer_id
SET o.priority = 'VIP';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SAFE UPDATE PATTERN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ALWAYS: Run SELECT first to verify scope!
-- Step 1: Check what will be updated
SELECT customer_id, email, first_name
FROM customers
WHERE email LIKE '%@olddomain.com';
-- Returns: 247 rows

-- Step 2: Update with confidence
UPDATE customers
SET email = REPLACE(email, '@olddomain.com', '@newdomain.com')
WHERE email LIKE '%@olddomain.com';
-- Query OK, 247 rows affected

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. LIMIT UPDATE (MySQL - for safety)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Process in batches to avoid long locks
UPDATE orders 
SET status = 'archived'
WHERE status = 'delivered' 
  AND delivered_at < '2023-01-01'
LIMIT 1000;  -- Only update 1000 at a time
```

### 🟢 HOW: DELETE Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DELETE: DANGER ZONE - BE CAREFUL!
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC DELETE (Always verify first!)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: ALWAYS run SELECT first!
SELECT * FROM customers WHERE customer_id = 12345;

-- Step 2: Delete with confidence
DELETE FROM customers WHERE customer_id = 12345;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DELETE WITH JOIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Delete orders for inactive customers
DELETE o FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.is_active = FALSE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. SOFT DELETE (Recommended Pattern)
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY soft delete?
-- 1. Data can be recovered
-- 2. Audit trail preserved
-- 3. Related records don't break
-- 4. Legal requirements (data retention)

-- Instead of: DELETE FROM customers WHERE customer_id = 12345;
-- Do this:
UPDATE customers 
SET 
    is_active = FALSE,
    deleted_at = NOW(),
    deleted_by = 'admin_user'
WHERE customer_id = 12345;

-- Application queries should filter:
SELECT * FROM customers WHERE is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. DELETE SAFETY SETTINGS (MySQL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable safe mode - prevents DELETE/UPDATE without WHERE
SET sql_safe_updates = 1;

-- This will now ERROR:
DELETE FROM customers;  -- Error 1175: no WHERE clause!

-- This works:
DELETE FROM customers WHERE customer_id = 12345;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TRUNCATE vs DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

/*
TRUNCATE:
- Removes ALL rows
- Cannot use WHERE
- Resets AUTO_INCREMENT
- Cannot rollback (in most DBs)
- Very fast (doesn't log individual rows)
- Cannot have foreign key references

DELETE:
- Can remove specific rows
- Uses WHERE
- Keeps AUTO_INCREMENT
- Can rollback
- Slower (logs each row)
- Works with foreign keys (CASCADE)
*/

-- When to use TRUNCATE:
-- Resetting test data
-- Clearing staging tables
-- Performance: Need to empty huge table fast
TRUNCATE TABLE temp_import_data;

-- When to use DELETE:
-- Production data
-- Need audit trail
-- Specific records only
DELETE FROM temp_import_data WHERE import_date < '2024-01-01';
```

---

## Chapter 5: DCL - Data Control Language

### 🔵 WHY: Security and Access Control

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY DCL EXISTS                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PRINCIPLE OF LEAST PRIVILEGE:                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  "Every user should have only the minimum permissions                      ││
│  │   necessary to perform their job function"                                 ││
│  │                                                                            ││
│  │  WHY THIS MATTERS:                                                         ││
│  │                                                                            ││
│  │  Developer needs:     Read production logs                                 ││
│  │  Developer gets:      SELECT on logs table only                            ││
│  │  Developer should NOT get: DELETE on users table!                          ││
│  │                                                                            ││
│  │  Analyst needs:       Run reports                                          ││
│  │  Analyst gets:        SELECT on all tables                                 ││
│  │  Analyst should NOT get: UPDATE or DELETE anything!                        ││
│  │                                                                            ││
│  │  Application needs:   CRUD on specific tables                              ││
│  │  Application gets:    SELECT, INSERT, UPDATE on app tables                 ││
│  │  Application should NOT get: DROP TABLE!                                   ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: Marriott Data Breach (2018)                                  │
│                                                                                  │
│  WHAT HAPPENED:                                                                 │
│  - Attackers gained access to ONE compromised account                           │
│  - That account had excessive permissions (admin rights)                        │
│  - 500 million guest records exposed                                            │
│  - $124 million GDPR fine                                                       │
│                                                                                  │
│  ROOT CAUSE:                                                                    │
│  - Accounts had more permissions than needed                                    │
│  - No separation between read-only and admin users                              │
│  - Legacy Starwood systems never had proper DCL setup                           │
│                                                                                  │
│  LESSON: Proper GRANT/REVOKE setup can limit breach impact                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: GRANT and REVOKE

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DCL: USERS AND PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CREATE USERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'SecureP@ss123!';
CREATE USER 'analyst'@'%' IDENTIFIED BY 'AnalystP@ss!';  -- % = any host
CREATE USER 'readonly'@'192.168.1.%' IDENTIFIED BY 'ReadP@ss!';  -- Subnet only

-- PostgreSQL
CREATE USER app_user WITH PASSWORD 'SecureP@ss123!';
CREATE USER analyst WITH PASSWORD 'AnalystP@ss!';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Grant specific permissions on specific tables
GRANT SELECT, INSERT, UPDATE ON ecommerce.customers TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON ecommerce.orders TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ecommerce.order_items TO 'app_user'@'localhost';

-- Grant read-only on all tables
GRANT SELECT ON ecommerce.* TO 'analyst'@'%';

-- Grant all on specific database
GRANT ALL PRIVILEGES ON ecommerce.* TO 'admin_user'@'localhost';

-- Grant with option to re-grant (admin)
GRANT ALL PRIVILEGES ON *.* TO 'dba'@'localhost' WITH GRANT OPTION;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ROLE-BASED ACCESS (Modern approach)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create roles
CREATE ROLE 'app_read_write';
CREATE ROLE 'analyst_read_only';
CREATE ROLE 'developer';

-- Assign permissions to roles
GRANT SELECT, INSERT, UPDATE ON ecommerce.* TO 'app_read_write';
GRANT SELECT ON ecommerce.* TO 'analyst_read_only';
GRANT SELECT, INSERT, UPDATE, DELETE ON ecommerce_dev.* TO 'developer';

-- Assign roles to users
GRANT 'app_read_write' TO 'app_user'@'localhost';
GRANT 'analyst_read_only' TO 'analyst'@'%';
GRANT 'developer' TO 'dev_john'@'localhost';
GRANT 'developer' TO 'dev_jane'@'localhost';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. REVOKE PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Revoke specific permission
REVOKE DELETE ON ecommerce.orders FROM 'app_user'@'localhost';

-- Revoke all permissions on database
REVOKE ALL PRIVILEGES ON ecommerce.* FROM 'terminated_user'@'localhost';

-- Revoke role
REVOKE 'developer' FROM 'dev_john'@'localhost';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. VIEW PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL: Show grants for user
SHOW GRANTS FOR 'app_user'@'localhost';

-- MySQL: Show current user's grants
SHOW GRANTS;

-- PostgreSQL: View permissions
\du  -- List all roles
\dp  -- List table permissions
```

---

## Chapter 6: TCL - Transaction Control Language

### 🔵 WHY: Data Integrity

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY TRANSACTIONS EXIST                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  THE BANK TRANSFER PROBLEM:                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Transfer ₹10,000 from Account A to Account B                              ││
│  │                                                                            ││
│  │  WITHOUT TRANSACTIONS:                                                     ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │  │ Step 1: UPDATE accounts SET balance = balance - 10000                │ ││
│  │  │         WHERE account_id = 'A';  -- ✓ Success                         │ ││
│  │  │                                                                      │ ││
│  │  │         ⚡ POWER FAILURE / SERVER CRASH HERE ⚡                       │ ││
│  │  │                                                                      │ ││
│  │  │ Step 2: UPDATE accounts SET balance = balance + 10000                │ ││
│  │  │         WHERE account_id = 'B';  -- ✗ Never executed!                 │ ││
│  │  └──────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                            ││
│  │  RESULT: ₹10,000 disappeared! Money debited but never credited.            ││
│  │                                                                            ││
│  │  WITH TRANSACTIONS:                                                        ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │  │ START TRANSACTION;                                                   │ ││
│  │  │                                                                      │ ││
│  │  │ UPDATE accounts SET balance = balance - 10000                        │ ││
│  │  │ WHERE account_id = 'A';                                               │ ││
│  │  │                                                                      │ ││
│  │  │ ⚡ POWER FAILURE ⚡                                                   │ ││
│  │  │                                                                      │ ││
│  │  │ -- Transaction never committed                                       │ ││
│  │  │ -- On restart: ROLLBACK automatically                                │ ││
│  │  │ -- Account A balance restored!                                       │ ││
│  │  └──────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                            ││
│  │  RESULT: Either BOTH updates happen, or NEITHER happens. Never partial.    ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL INCIDENT: Knight Capital Trading Loss (2012)                           │
│                                                                                  │
│  WHAT HAPPENED:                                                                 │
│  - Software deployment error activated old test code                            │
│  - System executed millions of trades in 45 minutes                             │
│  - No transactional rollback capability for market orders                       │
│  - $440 MILLION lost in 45 minutes                                              │
│                                                                                  │
│  LESSON: Critical operations MUST be transactional with rollback capability     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: ACID Properties

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ACID PROPERTIES EXPLAINED                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  A - ATOMICITY ("All or Nothing")                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Like an ATOM - indivisible unit                                           ││
│  │                                                                            ││
│  │  Transaction with 5 SQL statements:                                        ││
│  │  ┌───────────────────────────────────────────────────────────────────┐    ││
│  │  │ INSERT → UPDATE → UPDATE → INSERT → DELETE                        │    ││
│  │  │    ↓        ↓        ↓        ↓        ↓                          │    ││
│  │  │   ✓        ✓        ✓        ✗ (error)                           │    ││
│  │  │                                                                   │    ││
│  │  │   ALL get ROLLED BACK - database unchanged                        │    ││
│  │  └───────────────────────────────────────────────────────────────────┘    ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  C - CONSISTENCY ("Valid State to Valid State")                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Database rules (constraints) ALWAYS enforced                              ││
│  │                                                                            ││
│  │  Example: Account balance cannot go negative                               ││
│  │  CHECK (balance >= 0)                                                      ││
│  │                                                                            ││
│  │  Transaction: Transfer ₹10,000 from account with ₹5,000 balance           ││
│  │  Result: Transaction REJECTED - would violate constraint                   ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  I - ISOLATION ("Transactions Don't Interfere")                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Two transactions running simultaneously:                                  ││
│  │                                                                            ││
│  │  T1: Read balance, calculate interest, update balance                      ││
│  │  T2: Read balance, debit payment, update balance                           ││
│  │                                                                            ││
│  │  WITHOUT isolation: Both read ₹10,000, both write different values        ││
│  │                     One update gets lost!                                  ││
│  │                                                                            ││
│  │  WITH isolation: T1 completes fully, THEN T2 runs                          ││
│  │                  OR they see each other's intermediate results             ││
│  │                  (depends on isolation level)                              ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  D - DURABILITY ("Committed = Permanent")                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  After COMMIT, data survives:                                              ││
│  │  - Power failure                                                           ││
│  │  - Server crash                                                            ││
│  │  - Disk failure (with proper backup)                                       ││
│  │                                                                            ││
│  │  HOW: Write-Ahead Logging (WAL)                                            ││
│  │  1. Write change to log file FIRST                                         ││
│  │  2. Then write to actual data file                                         ││
│  │  3. On crash: Replay log to recover committed transactions                 ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: Transaction Syntax

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSACTION CONTROL: COMPLETE GUIDE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC TRANSACTION
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL / PostgreSQL
START TRANSACTION;
-- or
BEGIN;

-- SQL statements here
UPDATE accounts SET balance = balance - 10000 WHERE account_id = 'A';
UPDATE accounts SET balance = balance + 10000 WHERE account_id = 'B';

-- If successful
COMMIT;

-- If error or want to cancel
ROLLBACK;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. REAL EXAMPLE: E-commerce Order Processing
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //

CREATE PROCEDURE place_order(
    IN p_customer_id INT,
    IN p_product_id INT,
    IN p_quantity INT,
    OUT p_order_id BIGINT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_stock INT;
    DECLARE v_total DECIMAL(12,2);
    
    -- Declare handler for errors
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR: Transaction rolled back';
    END;
    
    START TRANSACTION;
    
    -- 1. Check stock and get price (with lock to prevent concurrent reads)
    SELECT price, stock_quantity 
    INTO v_price, v_stock
    FROM products 
    WHERE product_id = p_product_id
    FOR UPDATE;  -- Lock this row!
    
    -- 2. Validate stock
    IF v_stock < p_quantity THEN
        ROLLBACK;
        SET p_status = 'ERROR: Insufficient stock';
    ELSE
        -- 3. Calculate total
        SET v_total = v_price * p_quantity;
        
        -- 4. Create order
        INSERT INTO orders (customer_id, total, status, ordered_at)
        VALUES (p_customer_id, v_total, 'pending', NOW());
        
        SET p_order_id = LAST_INSERT_ID();
        
        -- 5. Create order item
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (p_order_id, p_product_id, p_quantity, v_price);
        
        -- 6. Reduce stock
        UPDATE products 
        SET stock_quantity = stock_quantity - p_quantity
        WHERE product_id = p_product_id;
        
        -- 7. All successful - commit!
        COMMIT;
        SET p_status = 'SUCCESS';
    END IF;
END //

DELIMITER ;

-- Usage:
CALL place_order(1, 101, 2, @order_id, @status);
SELECT @order_id, @status;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. SAVEPOINTS (Partial Rollback)
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY: Complex transaction where you want to undo part, not all

START TRANSACTION;

-- Part 1: Create customer
INSERT INTO customers (email, first_name, last_name, password_hash)
VALUES ('new@email.com', 'New', 'User', '$hash');
SET @new_customer_id = LAST_INSERT_ID();

SAVEPOINT customer_created;

-- Part 2: Create initial order (might fail)
INSERT INTO orders (customer_id, total, status)
VALUES (@new_customer_id, 0, 'draft');

-- Oops, something wrong with order logic
ROLLBACK TO customer_created;
-- Customer still exists, order rolled back

-- Try again with correct order
INSERT INTO orders (customer_id, total, status)
VALUES (@new_customer_id, 100.00, 'pending');

COMMIT;
-- Both customer and order saved

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ISOLATION LEVELS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check current isolation level
SELECT @@transaction_isolation;  -- MySQL 8.0+
-- or
SELECT @@tx_isolation;  -- MySQL 5.7

-- Set isolation level
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;  -- Dirty reads allowed
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;    -- No dirty reads (PostgreSQL default)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;   -- No dirty, no non-repeatable (MySQL default)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;      -- Full isolation (slowest)

/*
ISOLATION LEVEL COMPARISON:
┌─────────────────────┬──────────────┬────────────────────┬─────────────────┐
│ Level               │ Dirty Read   │ Non-Repeatable Read│ Phantom Read    │
├─────────────────────┼──────────────┼────────────────────┼─────────────────┤
│ READ UNCOMMITTED    │ Possible     │ Possible           │ Possible        │
│ READ COMMITTED      │ Not Possible │ Possible           │ Possible        │
│ REPEATABLE READ     │ Not Possible │ Not Possible       │ Possible        │
│ SERIALIZABLE        │ Not Possible │ Not Possible       │ Not Possible    │
└─────────────────────┴──────────────┴────────────────────┴─────────────────┘

TRADE-OFF: Higher isolation = Slower performance (more locking)
*/
```

---

# PRACTICE PROBLEMS

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS: DDL, DML, DCL, TCL
-- ═══════════════════════════════════════════════════════════════════════════════

-- PROBLEM 1: Design a Library Database
-- Create tables for: books, authors, members, loans
-- Include proper constraints, foreign keys, and indexes

-- PROBLEM 2: User Management System
-- Create users with different roles (admin, librarian, member)
-- Grant appropriate permissions using ROLE-based access

-- PROBLEM 3: Transaction Safety
-- Write a procedure to handle book checkout that:
-- - Checks if book is available
-- - Creates loan record
-- - Updates book status
-- - All in a transaction with proper error handling

-- PROBLEM 4: Schema Migration
-- Given existing 'users' table, write ALTER statements to:
-- - Add email verification columns
-- - Add audit columns (created_by, updated_by)
-- - Create appropriate indexes for common queries

-- Solutions available in 06_SQL_Practice_Projects.md
```

---

# QUICK REFERENCE

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    SQL FOUNDATIONS - QUICK REFERENCE                             ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  DDL (Structure):                                                                ║
║    CREATE DATABASE, CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE TABLE        ║
║                                                                                   ║
║  DML (Data):                                                                     ║
║    INSERT, SELECT, UPDATE, DELETE, MERGE                                         ║
║                                                                                   ║
║  DCL (Permissions):                                                              ║
║    GRANT, REVOKE, CREATE USER, CREATE ROLE                                       ║
║                                                                                   ║
║  TCL (Transactions):                                                             ║
║    START TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT                                ║
║                                                                                   ║
║  ACID:                                                                           ║
║    Atomicity, Consistency, Isolation, Durability                                 ║
║                                                                                   ║
║  GOLDEN RULES:                                                                   ║
║    ✓ Always use WHERE with UPDATE/DELETE                                        ║
║    ✓ Run SELECT before UPDATE/DELETE to verify                                  ║
║    ✓ Use transactions for multi-statement operations                            ║
║    ✓ Principle of least privilege for users                                     ║
║    ✓ Never store money as FLOAT - use DECIMAL                                   ║
║    ✓ Test schema changes on staging first                                       ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

_"Understanding WHY makes HOW unforgettable"_

---

**NEXT: 02_SQL_Intermediate_JoinsWindows.md - JOINs, Subqueries, CTEs, Window Functions**
