> **SQL Chapter 02/20** | [← Previous](01_Foundations_Database_Basics.md) | [Index](../00_MASTER_INDEX.md) | [Next →](03_DDL_Creating_Structure.md)

---

## Chapter 2: Data Types & Constraints

### 🧠 Why Data Types Matter — The Theory

Choosing the right data type is one of the most important decisions in database design. It affects **three critical things**:

1. **Storage Efficiency** — Every column in every row consumes disk space. If you have 10 million users and store `age` as `INT` (4 bytes) instead of `TINYINT` (1 byte), you waste **30 MB** just on that one column. At scale, these decisions compound dramatically.

2. **Query Performance** — The database engine compares, sorts, and indexes data differently based on type. Comparing two `INT` values is a single CPU instruction. Comparing two `VARCHAR(255)` values requires character-by-character comparison, potentially across 255 bytes. Indexes on smaller types are also smaller, which means more index entries fit in a single memory page, leading to faster lookups.

3. **Data Integrity** — The type itself acts as a first line of validation. If a column is `INT`, the database will reject `"hello"` before your application logic ever sees it. If a column is `DATE`, it will reject `"2024-02-30"` (February 30th doesn't exist). This is **defense in depth** — the database protects you even when your application code has bugs.

> 💡 **The Core Principle:** Always choose the **smallest type that can safely hold your data**. This isn't premature optimization — it's fundamental to how databases work. Disk I/O, memory consumption, and index sizes all scale with column widths.

#### The DECIMAL vs FLOAT Problem — Why This Matters for Money

This is the single most important data type decision you will ever make in production:

- **`FLOAT`/`DOUBLE`** use IEEE 754 floating-point representation. They store numbers in binary scientific notation (mantissa × 2^exponent). This means most decimal fractions **cannot be represented exactly**. For example, `0.1` in binary is `0.0001100110011...` (repeating forever). The database rounds it, and after many additions, these tiny rounding errors accumulate. In a banking system processing millions of transactions, a `FLOAT` price column could cause **invisible financial losses** — accounts that don't balance, audits that fail.

- **`DECIMAL(p,s)`** stores numbers as exact decimal digits. `DECIMAL(10,2)` means "up to 10 digits total, with exactly 2 after the decimal point." The value `99999999.99` is stored precisely as those digits — no binary conversion, no rounding. This is why **every financial system in the world uses DECIMAL for money**.

#### CHAR vs VARCHAR — When Fixed Length Wins

- **`CHAR(n)`** always allocates exactly `n` bytes, padding shorter values with spaces. This seems wasteful, but it has a hidden advantage: **every row has the same size**, which means the database can calculate the position of any row by simple multiplication (`row_position = row_number × row_size`). This makes lookups faster and avoids fragmentation.

- **`VARCHAR(n)`** stores only the characters you actually insert, plus 1-2 bytes for the length prefix. For a column where values range from 3 to 100 characters (like email addresses), this saves enormous space.

**Rule of thumb:** Use `CHAR` when all values are the same length (country codes `US`, `IN`, `UK`; SHA-256 hashes that are always 64 characters; state abbreviations). Use `VARCHAR` for everything else.

#### DATETIME vs TIMESTAMP — A Subtle But Important Difference

Both store date and time, but they differ in one critical way:

- **`TIMESTAMP`** converts values to UTC for storage and back to the session's timezone on retrieval. If your application serves users in India (`+05:30`) and the US (`-05:00`), a `TIMESTAMP` column automatically shows the correct local time to each user. However, it only supports dates from 1970 to 2038 (the Unix epoch range).

- **`DATETIME`** stores the exact value you give it — no timezone conversion. If you insert `'2024-06-15 14:30:00'`, that's what you'll always get back, regardless of timezone settings. It supports a much wider range (1000 to 9999).

**Rule of thumb:** Use `TIMESTAMP` for event times (when something happened — "user logged in at..."). Use `DATETIME` for scheduled dates that should not shift with timezone (birth dates, appointment times in a specific city).

---

### 📊 SQL Data Types — Complete Reference

#### Numeric Types

| Type | Range | Storage | Use Case |
|------|-------|---------|----------|
| `TINYINT` | 0 to 255 (unsigned) | 1 byte | Age, small counts |
| `SMALLINT` | -32,768 to 32,767 | 2 bytes | Year, small IDs |
| `INT`/`INTEGER` | -2.1B to 2.1B | 4 bytes | IDs, counts |
| `BIGINT` | -9.2Q to 9.2Q | 8 bytes | Large IDs, counters |
| `DECIMAL(p,s)` | Exact precision | Varies | Money, precise calc |
| `FLOAT` | ~7 decimal digits | 4 bytes | Scientific data |
| `DOUBLE` | ~15 decimal digits | 8 bytes | Scientific data |

#### String Types

| Type | Max Length | Storage | Use Case |
|------|-----------|---------|----------|
| `CHAR(n)` | 255 | Fixed n bytes | Fixed-length (country code) |
| `VARCHAR(n)` | 65,535 | Length + 1-2 | Variable (names, emails) |
| `TEXT` | 65,535 | Length + 2 | Long text, descriptions |
| `MEDIUMTEXT` | 16 MB | Length + 3 | Articles, documents |
| `LONGTEXT` | 4 GB | Length + 4 | Large documents |
| `ENUM` | 65,535 values | 1-2 bytes | Fixed set of values |

#### Date & Time Types

| Type | Format | Range |
|------|--------|-------|
| `DATE` | `'YYYY-MM-DD'` | 1000-01-01 to 9999-12-31 |
| `TIME` | `'HH:MM:SS'` | -838:59:59 to 838:59:59 |
| `DATETIME` | `'YYYY-MM-DD HH:MM:SS'` | 1000 to 9999 |
| `TIMESTAMP` | `'YYYY-MM-DD HH:MM:SS'` | 1970 to 2038 (auto timezone) |
| `YEAR` | `YYYY` | 1901 to 2155 |

#### Other Types

| Type | Description |
|------|-------------|
| `BOOLEAN` | TRUE/FALSE (stored as TINYINT 1/0) |
| `BLOB` | Binary Large Object (images, files) |
| `JSON` | JSON documents (MySQL 5.7+, PostgreSQL) |
| `UUID` | Universally Unique Identifier |
| `ARRAY` | Array of values (PostgreSQL) |

### Choosing the Right Data Type

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA TYPE SELECTION GUIDE WITH EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- SCENARIO 1: User Table
CREATE TABLE users (
    user_id         INT PRIMARY KEY AUTO_INCREMENT,  -- Unique ID
    username        VARCHAR(50) NOT NULL,            -- Variable length, max 50
    email           VARCHAR(100) NOT NULL UNIQUE,    -- Emails vary in length
    password_hash   CHAR(64),                        -- SHA-256 always 64 chars
    age             TINYINT UNSIGNED,                -- 0-255 sufficient
    salary          DECIMAL(10, 2),                  -- Exact: 99999999.99
    is_active       BOOLEAN DEFAULT TRUE,            -- True/False
    country_code    CHAR(2),                         -- Always 2 chars (US, IN)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_pic     MEDIUMBLOB                       -- Image up to 16MB
);

-- SCENARIO 2: E-commerce Products
CREATE TABLE products (
    product_id      BIGINT PRIMARY KEY,              -- Large catalog
    sku             VARCHAR(20) UNIQUE,              -- Stock Keeping Unit
    name            VARCHAR(255) NOT NULL,           -- Product name
    description     TEXT,                            -- Long description
    price           DECIMAL(10, 2) NOT NULL,         -- ₹99999999.99
    quantity        INT UNSIGNED DEFAULT 0,          -- Stock count
    weight_kg       DECIMAL(5, 2),                   -- 999.99 kg max
    category        ENUM('Electronics', 'Clothing', 'Books', 'Food'),
    attributes      JSON,                            -- Flexible attributes
    created_at      DATETIME DEFAULT NOW()
);

-- SCENARIO 3: Analytics Events
CREATE TABLE events (
    event_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    event_type      VARCHAR(50),
    event_data      JSON,                            -- Flexible event payload
    ip_address      VARCHAR(45),                     -- IPv6 support
    user_agent      VARCHAR(255),
    occurred_at     TIMESTAMP(6),                    -- Microsecond precision
    processed       BOOLEAN DEFAULT FALSE
);
```

### 🔒 SQL Constraints — Data Integrity Rules

#### 🧠 Why Constraints Exist — The Database's Immune System

Constraints are rules that the database enforces **automatically and unconditionally**. They exist because of a fundamental truth in software engineering: **application code has bugs, but the database is the last line of defense.**

Consider this scenario: You build an e-commerce app. Your frontend validates that product prices are positive. Your backend API double-checks. But one day, a developer adds a bulk-import script that accidentally skips validation, and suddenly your database has products with price `-50.00`. Customers are getting paid to buy things. Without a `CHECK (price > 0)` constraint, nothing stops this disaster.

Constraints enforce **three types of data integrity**:

| Integrity Type | What It Protects | Constraint Used |
|----------------|-----------------|-----------------|
| **Entity Integrity** | Every row is uniquely identifiable | `PRIMARY KEY` |
| **Referential Integrity** | Relationships between tables remain valid | `FOREIGN KEY` |
| **Domain Integrity** | Column values stay within valid ranges | `CHECK`, `NOT NULL`, `UNIQUE`, `DEFAULT` |

> 💡 **Design Philosophy:** Never rely only on your application to validate data. Constraints are **declarative** — you state the rule once, and the database enforces it forever, regardless of which application, script, or manual SQL query touches the data.

#### 1. PRIMARY KEY

- Uniquely identifies each row — this is the **identity** of each record. Without a primary key, you cannot reliably distinguish one row from another, and UPDATE/DELETE operations become dangerous (which "John Smith" do you mean?)
- Cannot be NULL — an identity must always be present and known
- Only **ONE** per table — a table has one canonical way to identify its rows
- Automatically creates a **clustered index** (in most databases), which means the table data is physically sorted by the primary key on disk. This is why primary key lookups are the fastest possible query

```sql
-- Single column primary key
CREATE TABLE students (
    student_id INT PRIMARY KEY,
    name VARCHAR(100)
);

-- Composite primary key
CREATE TABLE enrollments (
    student_id INT,
    course_id INT,
    PRIMARY KEY (student_id, course_id)
);
```

#### 2. FOREIGN KEY

- References primary key in another table
- Maintains **referential integrity**
- Can have `ON DELETE` and `ON UPDATE` actions

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE      -- Delete orders when customer deleted
        ON UPDATE CASCADE      -- Update if customer_id changes
);
```

| Action | Behavior |
|--------|----------|
| `CASCADE` | Delete/update child rows too |
| `SET NULL` | Set foreign key to NULL |
| `SET DEFAULT` | Set to default value |
| `RESTRICT` | Prevent delete/update (default) |
| `NO ACTION` | Same as RESTRICT in most DBs |

#### 3. UNIQUE

- No duplicate values allowed
- **CAN** be NULL (but only one NULL in most DBs)
- Multiple unique constraints per table allowed

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE
);
```

#### 4. NOT NULL

- Column cannot have NULL value
- Must provide value on INSERT

```sql
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,    -- Required
    department VARCHAR(50)          -- Optional (allows NULL)
);
```

#### 5. CHECK

- Validates data against a condition
- Rejects data that doesn't meet criteria

```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    price DECIMAL(10,2) CHECK (price > 0),
    quantity INT CHECK (quantity >= 0),
    discount INT CHECK (discount BETWEEN 0 AND 100)
);
```

#### 6. DEFAULT

- Provides default value if none specified
- Can use functions like `NOW()`, `CURRENT_TIMESTAMP`

```sql
CREATE TABLE logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT,
    level VARCHAR(10) DEFAULT 'INFO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

> **Navigation**: [< Previous](01_Foundations_Database_Basics.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_DDL_Creating_Structure.md)