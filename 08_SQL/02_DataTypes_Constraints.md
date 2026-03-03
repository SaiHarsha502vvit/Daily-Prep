> **SQL Chapter 02/20** | [← Previous](01_Foundations_Database_Basics.md) | [Index](../00_MASTER_INDEX.md) | [Next →](03_DDL_Creating_Structure.md)

---

## Chapter 2: Data Types & Constraints

### SQL Data Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SQL DATA TYPES - COMPLETE REFERENCE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  NUMERIC TYPES:                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Type          │ Range                      │ Storage │ Use Case           ││
│  ├────────────────┼────────────────────────────┼─────────┼────────────────────┤│
│  │ TINYINT        │ 0 to 255 (unsigned)        │ 1 byte  │ Age, small counts  ││
│  │ SMALLINT       │ -32,768 to 32,767          │ 2 bytes │ Year, small IDs    ││
│  │ INT/INTEGER    │ -2.1B to 2.1B              │ 4 bytes │ IDs, counts        ││
│  │ BIGINT         │ -9.2Q to 9.2Q              │ 8 bytes │ Large IDs, counters││
│  │ DECIMAL(p,s)   │ Exact precision            │ Varies  │ Money, precise calc││
│  │ FLOAT          │ ~7 decimal digits          │ 4 bytes │ Scientific data    ││
│  │ DOUBLE         │ ~15 decimal digits         │ 8 bytes │ Scientific data    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  STRING TYPES:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Type          │ Max Length    │ Storage       │ Use Case                  ││
│  ├────────────────┼───────────────┼───────────────┼───────────────────────────┤│
│  │ CHAR(n)        │ 255           │ Fixed n bytes │ Fixed-length (country code)│
│  │ VARCHAR(n)     │ 65,535        │ Length + 1-2  │ Variable (names, emails)  ││
│  │ TEXT           │ 65,535        │ Length + 2    │ Long text, descriptions   ││
│  │ MEDIUMTEXT     │ 16 MB         │ Length + 3    │ Articles, documents       ││
│  │ LONGTEXT       │ 4 GB          │ Length + 4    │ Large documents           ││
│  │ ENUM           │ 65,535 values │ 1-2 bytes     │ Fixed set of values       ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  DATE & TIME TYPES:                                                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Type          │ Format                    │ Range                         ││
│  ├────────────────┼───────────────────────────┼───────────────────────────────┤│
│  │ DATE           │ 'YYYY-MM-DD'              │ 1000-01-01 to 9999-12-31     ││
│  │ TIME           │ 'HH:MM:SS'                │ -838:59:59 to 838:59:59      ││
│  │ DATETIME       │ 'YYYY-MM-DD HH:MM:SS'     │ 1000 to 9999                 ││
│  │ TIMESTAMP      │ 'YYYY-MM-DD HH:MM:SS'     │ 1970 to 2038 (auto timezone) ││
│  │ YEAR           │ YYYY                      │ 1901 to 2155                  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  OTHER TYPES:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ BOOLEAN        │ TRUE/FALSE (stored as TINYINT 1/0)                        ││
│  │ BLOB           │ Binary Large Object (images, files)                       ││
│  │ JSON           │ JSON documents (MySQL 5.7+, PostgreSQL)                   ││
│  │ UUID           │ Universally Unique Identifier                             ││
│  │ ARRAY          │ Array of values (PostgreSQL)                              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

### SQL Constraints

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SQL CONSTRAINTS - DATA INTEGRITY RULES                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. PRIMARY KEY                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Uniquely identifies each row                                            ││
│  │  • Cannot be NULL                                                          ││
│  │  • Only ONE per table                                                      ││
│  │  • Automatically creates unique index                                      ││
│  │                                                                            ││
│  │  -- Single column primary key                                              ││
│  │  CREATE TABLE students (                                                   ││
│  │      student_id INT PRIMARY KEY,                                           ││
│  │      name VARCHAR(100)                                                     ││
│  │  );                                                                        ││
│  │                                                                            ││
│  │  -- Composite primary key                                                  ││
│  │  CREATE TABLE enrollments (                                                ││
│  │      student_id INT,                                                       ││
│  │      course_id INT,                                                        ││
│  │      PRIMARY KEY (student_id, course_id)                                   ││
│  │  );                                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  2. FOREIGN KEY                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • References primary key in another table                                 ││
│  │  • Maintains referential integrity                                         ││
│  │  • Can have ON DELETE and ON UPDATE actions                                ││
│  │                                                                            ││
│  │  CREATE TABLE orders (                                                     ││
│  │      order_id INT PRIMARY KEY,                                             ││
│  │      customer_id INT,                                                      ││
│  │      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)          ││
│  │          ON DELETE CASCADE      -- Delete orders when customer deleted    ││
│  │          ON UPDATE CASCADE      -- Update if customer_id changes          ││
│  │  );                                                                        ││
│  │                                                                            ││
│  │  -- Foreign Key Actions:                                                   ││
│  │  -- CASCADE    : Delete/update child rows too                              ││
│  │  -- SET NULL   : Set foreign key to NULL                                   ││
│  │  -- SET DEFAULT: Set to default value                                      ││
│  │  -- RESTRICT   : Prevent delete/update (default)                           ││
│  │  -- NO ACTION  : Same as RESTRICT in most DBs                              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  3. UNIQUE                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • No duplicate values allowed                                             ││
│  │  • CAN be NULL (but only one NULL in most DBs)                            ││
│  │  • Multiple unique constraints per table allowed                           ││
│  │                                                                            ││
│  │  CREATE TABLE users (                                                      ││
│  │      user_id INT PRIMARY KEY,                                              ││
│  │      email VARCHAR(100) UNIQUE,                                            ││
│  │      phone VARCHAR(15) UNIQUE                                              ││
│  │  );                                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  4. NOT NULL                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Column cannot have NULL value                                           ││
│  │  • Must provide value on INSERT                                            ││
│  │                                                                            ││
│  │  CREATE TABLE employees (                                                  ││
│  │      emp_id INT PRIMARY KEY,                                               ││
│  │      name VARCHAR(100) NOT NULL,    -- Required                            ││
│  │      department VARCHAR(50)          -- Optional (allows NULL)             ││
│  │  );                                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  5. CHECK                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Validates data against a condition                                      ││
│  │  • Rejects data that doesn't meet criteria                                 ││
│  │                                                                            ││
│  │  CREATE TABLE products (                                                   ││
│  │      product_id INT PRIMARY KEY,                                           ││
│  │      price DECIMAL(10,2) CHECK (price > 0),                               ││
│  │      quantity INT CHECK (quantity >= 0),                                   ││
│  │      discount INT CHECK (discount BETWEEN 0 AND 100)                       ││
│  │  );                                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  6. DEFAULT                                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Provides default value if none specified                                ││
│  │  • Can use functions like NOW(), CURRENT_TIMESTAMP                         ││
│  │                                                                            ││
│  │  CREATE TABLE logs (                                                       ││
│  │      log_id INT PRIMARY KEY AUTO_INCREMENT,                                ││
│  │      message TEXT,                                                         ││
│  │      level VARCHAR(10) DEFAULT 'INFO',                                     ││
│  │      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP                        ││
│  │  );                                                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

