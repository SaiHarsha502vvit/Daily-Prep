# 📊 SQL COMPLETE GUIDE - From Zero to Data Engineering Expert

> **The Ultimate SQL Journey for Data Analysts & Data Engineers**
> _"Data is the new oil, and SQL is the refinery"_

---

# 🏗️ TABLE OF CONTENTS

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    SQL COMPLETE GUIDE - TABLE OF CONTENTS                        ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  PART 1: FOUNDATIONS                                                              ║
║  ├── Chapter 1: Database Fundamentals                                            ║
║  ├── Chapter 2: Data Types & Constraints                                         ║
║  ├── Chapter 3: DDL - Creating Database Structure                                ║
║  ├── Chapter 4: DML - Manipulating Data                                          ║
║  └── Chapter 5: Basic Queries (SELECT, WHERE, ORDER BY)                          ║
║                                                                                   ║
║  PART 2: INTERMEDIATE                                                             ║
║  ├── Chapter 6: Aggregate Functions & GROUP BY                                   ║
║  ├── Chapter 7: JOINs - Combining Tables                                         ║
║  ├── Chapter 8: Subqueries & CTEs                                                ║
║  └── Chapter 9: Window Functions                                                 ║
║                                                                                   ║
║  PART 3: ADVANCED                                                                 ║
║  ├── Chapter 10: Database Normalization (1NF to BCNF)                           ║
║  ├── Chapter 11: Indexes & Query Performance                                     ║
║  ├── Chapter 12: Views & Materialized Views                                      ║
║  ├── Chapter 13: Stored Procedures & Functions                                   ║
║  ├── Chapter 14: Triggers                                                        ║
║  └── Chapter 15: Transactions & ACID Properties                                  ║
║                                                                                   ║
║  PART 4: EXPERT - DATA ENGINEERING                                               ║
║  ├── Chapter 16: Query Optimization & Execution Plans                            ║
║  ├── Chapter 17: Analytics & Reporting Patterns                                  ║
║  ├── Chapter 18: Data Warehousing Concepts                                       ║
║  ├── Chapter 19: ETL Patterns in SQL                                             ║
║  └── Chapter 20: Real-World Case Studies                                         ║
║                                                                                   ║
║  PART 5: PRACTICE & PROJECTS                                                      ║
║  ├── Chapter 21: 100 Practice Problems (Easy to Hard)                            ║
║  ├── Chapter 22: Mini Projects                                                    ║
║  ├── Chapter 23: Interview Questions (Top 50)                                    ║
║  └── Chapter 24: Quick Reference Cheat Sheet                                     ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# 📘 PART 1: FOUNDATIONS

---

## Chapter 1: Database Fundamentals

### What is a Database?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE FUNDAMENTALS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DATABASE = Organized collection of structured data                             │
│                                                                                  │
│  REAL-WORLD ANALOGY:                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Database     = Library                                                    ││
│  │  Tables       = Sections (Fiction, Science, History)                       ││
│  │  Rows         = Individual Books                                           ││
│  │  Columns      = Book attributes (Title, Author, ISBN, Year)                ││
│  │  Primary Key  = Unique Book ID                                             ││
│  │  Foreign Key  = Author ID linking to Authors section                       ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  DATABASE TYPES:                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  1. RELATIONAL (SQL) ─────────────────────────────────────────────────    ││
│  │     • Data in tables with rows & columns                                   ││
│  │     • Relationships via keys                                               ││
│  │     • Examples: MySQL, PostgreSQL, Oracle, SQL Server                      ││
│  │     • Best for: Structured data, transactions, reports                    ││
│  │                                                                            ││
│  │  2. NoSQL ────────────────────────────────────────────────────────────    ││
│  │     • Document: MongoDB (JSON-like documents)                              ││
│  │     • Key-Value: Redis (Fast caching)                                      ││
│  │     • Column-Family: Cassandra (Big data)                                  ││
│  │     • Graph: Neo4j (Relationships)                                         ││
│  │     • Best for: Unstructured data, scalability, flexibility               ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### RDBMS Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RDBMS ARCHITECTURE                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌─────────────────────┐                                 │
│                         │   APPLICATION       │                                 │
│                         │   (Your Java/Python │                                 │
│                         │    code)            │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │ SQL Queries                                │
│                                    ▼                                            │
│                         ┌─────────────────────┐                                 │
│                         │   DBMS ENGINE       │                                 │
│                         │   ┌───────────────┐ │                                 │
│                         │   │ Query Parser  │ │ ← Syntax check                 │
│                         │   ├───────────────┤ │                                 │
│                         │   │ Query         │ │ ← Creates execution plan       │
│                         │   │ Optimizer     │ │                                 │
│                         │   ├───────────────┤ │                                 │
│                         │   │ Execution     │ │ ← Runs the query               │
│                         │   │ Engine        │ │                                 │
│                         │   └───────────────┘ │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                            │
│                                    ▼                                            │
│                         ┌─────────────────────┐                                 │
│                         │   STORAGE ENGINE    │                                 │
│                         │   ┌───────────────┐ │                                 │
│                         │   │ Buffer Pool   │ │ ← In-memory cache              │
│                         │   ├───────────────┤ │                                 │
│                         │   │ Transaction   │ │ ← ACID compliance              │
│                         │   │ Manager       │ │                                 │
│                         │   ├───────────────┤ │                                 │
│                         │   │ Lock Manager  │ │ ← Concurrency control          │
│                         │   └───────────────┘ │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                            │
│                                    ▼                                            │
│                         ┌─────────────────────┐                                 │
│                         │   DISK STORAGE      │                                 │
│                         │   (Data files,      │                                 │
│                         │    Index files,     │                                 │
│                         │    Log files)       │                                 │
│                         └─────────────────────┘                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### SQL Categories

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SQL COMMAND CATEGORIES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. DDL - Data Definition Language (Structure)                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  CREATE   - Create database objects (tables, views, indexes)               ││
│  │  ALTER    - Modify existing objects                                        ││
│  │  DROP     - Delete objects                                                 ││
│  │  TRUNCATE - Remove all data from table (keeps structure)                   ││
│  │  RENAME   - Rename objects                                                 ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  2. DML - Data Manipulation Language (Data)                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT   - Retrieve data                                                  ││
│  │  INSERT   - Add new data                                                   ││
│  │  UPDATE   - Modify existing data                                           ││
│  │  DELETE   - Remove data                                                    ││
│  │  MERGE    - Insert or update (upsert)                                      ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  3. DCL - Data Control Language (Permissions)                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  GRANT    - Give permissions                                               ││
│  │  REVOKE   - Remove permissions                                             ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  4. TCL - Transaction Control Language                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  COMMIT     - Save changes permanently                                     ││
│  │  ROLLBACK   - Undo changes                                                 ││
│  │  SAVEPOINT  - Create rollback point                                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

## Chapter 3: DDL - Creating Database Structure

### CREATE Statements

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DDL: DATA DEFINITION LANGUAGE - COMPLETE EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE DATABASE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic database creation
CREATE DATABASE company_db;

-- With character set (important for international data)
CREATE DATABASE company_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Only create if not exists
CREATE DATABASE IF NOT EXISTS company_db;

-- Use the database
USE company_db;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE TABLE - COMPREHENSIVE EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- EXAMPLE 1: Complete Employee Management System

-- Departments table
CREATE TABLE departments (
    dept_id         INT PRIMARY KEY AUTO_INCREMENT,
    dept_name       VARCHAR(100) NOT NULL UNIQUE,
    location        VARCHAR(100),
    budget          DECIMAL(15, 2) DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees table with all constraint types
CREATE TABLE employees (
    emp_id          INT PRIMARY KEY AUTO_INCREMENT,
    emp_code        VARCHAR(10) UNIQUE NOT NULL,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    phone           VARCHAR(15),
    hire_date       DATE NOT NULL,
    job_title       VARCHAR(100),
    salary          DECIMAL(10, 2) CHECK (salary >= 0),
    commission_pct  DECIMAL(3, 2) CHECK (commission_pct BETWEEN 0 AND 1),
    dept_id         INT,
    manager_id      INT,
    is_active       BOOLEAN DEFAULT TRUE,

    -- Foreign Keys
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
        ON DELETE SET NULL,

    -- Named constraint
    CONSTRAINT chk_email CHECK (email LIKE '%@%.%')
);

-- EXAMPLE 2: E-commerce Database Schema

-- Categories (self-referencing for hierarchy)
CREATE TABLE categories (
    category_id     INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    parent_id       INT,
    level           INT DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (parent_id) REFERENCES categories(category_id)
        ON DELETE CASCADE
);

-- Products
CREATE TABLE products (
    product_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku             VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost            DECIMAL(10, 2) CHECK (cost >= 0),
    quantity        INT UNSIGNED DEFAULT 0,
    category_id     INT,
    brand           VARCHAR(100),
    weight          DECIMAL(8, 2),
    dimensions      JSON,  -- {"length": 10, "width": 5, "height": 3}
    attributes      JSON,  -- Flexible product attributes
    status          ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(category_id),

    -- Full-text index for search (MySQL)
    FULLTEXT INDEX idx_product_search (name, description)
);

-- Customers
CREATE TABLE customers (
    customer_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          ENUM('M', 'F', 'O'),
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP
);

-- Addresses (one customer can have multiple addresses)
CREATE TABLE addresses (
    address_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id     BIGINT NOT NULL,
    address_type    ENUM('billing', 'shipping') NOT NULL,
    street_line1    VARCHAR(255) NOT NULL,
    street_line2    VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100),
    postal_code     VARCHAR(20) NOT NULL,
    country         VARCHAR(100) NOT NULL,
    is_default      BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
);

-- Orders
CREATE TABLE orders (
    order_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_number    VARCHAR(20) UNIQUE NOT NULL,
    customer_id     BIGINT NOT NULL,
    order_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
                    DEFAULT 'pending',
    shipping_address_id BIGINT,
    billing_address_id  BIGINT,
    subtotal        DECIMAL(12, 2) NOT NULL,
    tax             DECIMAL(12, 2) DEFAULT 0,
    shipping_cost   DECIMAL(10, 2) DEFAULT 0,
    discount        DECIMAL(12, 2) DEFAULT 0,
    total           DECIMAL(12, 2) GENERATED ALWAYS AS
                    (subtotal + tax + shipping_cost - discount) STORED,
    payment_method  VARCHAR(50),
    payment_status  ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    notes           TEXT,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id)
);

-- Order Items (junction table)
CREATE TABLE order_items (
    item_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id        BIGINT NOT NULL,
    product_id      BIGINT NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2) NOT NULL,
    discount        DECIMAL(5, 2) DEFAULT 0,
    total_price     DECIMAL(12, 2) GENERATED ALWAYS AS
                    (quantity * unit_price * (1 - discount/100)) STORED,

    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    -- Prevent duplicate products in same order
    UNIQUE KEY unique_order_product (order_id, product_id)
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE INDEX
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single column index
CREATE INDEX idx_emp_lastname ON employees(last_name);

-- Composite index (order matters!)
CREATE INDEX idx_emp_dept_hire ON employees(dept_id, hire_date);

-- Unique index
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Partial index (PostgreSQL) - only index active employees
CREATE INDEX idx_active_emp ON employees(emp_id) WHERE is_active = TRUE;

-- Covering index (includes all columns needed for query)
CREATE INDEX idx_product_category ON products(category_id, name, price);


-- ═══════════════════════════════════════════════════════════════════════════════
-- ALTER TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add column
ALTER TABLE employees ADD COLUMN middle_name VARCHAR(50);

-- Add column with position
ALTER TABLE employees ADD COLUMN ssn VARCHAR(11) AFTER last_name;

-- Modify column
ALTER TABLE employees MODIFY COLUMN phone VARCHAR(20);

-- Rename column (MySQL 8.0+)
ALTER TABLE employees RENAME COLUMN phone TO phone_number;

-- Drop column
ALTER TABLE employees DROP COLUMN middle_name;

-- Add constraint
ALTER TABLE employees
    ADD CONSTRAINT chk_salary CHECK (salary > 0);

-- Drop constraint
ALTER TABLE employees DROP CONSTRAINT chk_salary;

-- Add foreign key
ALTER TABLE employees
    ADD CONSTRAINT fk_dept
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id);

-- Drop foreign key
ALTER TABLE employees DROP FOREIGN KEY fk_dept;

-- Rename table
ALTER TABLE employees RENAME TO staff;
-- OR
RENAME TABLE employees TO staff;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DROP & TRUNCATE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop table (removes structure and data)
DROP TABLE IF EXISTS temp_table;

-- Drop table with dependencies
DROP TABLE IF EXISTS employees CASCADE;  -- PostgreSQL

-- Truncate (remove all data, keep structure, faster than DELETE)
TRUNCATE TABLE logs;

-- Drop database
DROP DATABASE IF EXISTS test_db;

-- Drop index
DROP INDEX idx_emp_lastname ON employees;  -- MySQL
DROP INDEX IF EXISTS idx_emp_lastname;      -- PostgreSQL
```

---

## Chapter 4: DML - Manipulating Data

### INSERT Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERT - ADDING DATA TO TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic INSERT (specify all columns)
INSERT INTO departments (dept_id, dept_name, location, budget)
VALUES (1, 'Engineering', 'Building A', 1000000.00);

-- INSERT with only required columns (others get defaults)
INSERT INTO departments (dept_name, location)
VALUES ('Marketing', 'Building B');

-- INSERT without column names (must match table column order - NOT recommended)
INSERT INTO departments VALUES (3, 'Sales', 'Building C', 500000.00, NOW(), NOW());

-- INSERT multiple rows
INSERT INTO departments (dept_name, location, budget) VALUES
    ('HR', 'Building D', 200000.00),
    ('Finance', 'Building E', 800000.00),
    ('Operations', 'Building F', 600000.00);

-- INSERT with subquery (copy data from another table)
INSERT INTO archived_employees (emp_id, name, dept_id, archived_date)
SELECT emp_id, CONCAT(first_name, ' ', last_name), dept_id, NOW()
FROM employees
WHERE is_active = FALSE;

-- INSERT IGNORE (skip rows that would cause duplicate key errors)
INSERT IGNORE INTO customers (customer_id, email, first_name)
VALUES (1, 'john@email.com', 'John');

-- INSERT ON DUPLICATE KEY UPDATE (UPSERT in MySQL)
INSERT INTO products (sku, name, price, quantity)
VALUES ('SKU001', 'Widget', 29.99, 100)
ON DUPLICATE KEY UPDATE
    quantity = quantity + VALUES(quantity),
    price = VALUES(price);

-- PostgreSQL UPSERT
INSERT INTO products (sku, name, price, quantity)
VALUES ('SKU001', 'Widget', 29.99, 100)
ON CONFLICT (sku)
DO UPDATE SET
    quantity = products.quantity + EXCLUDED.quantity,
    price = EXCLUDED.price;

-- INSERT with RETURNING (PostgreSQL) - get inserted data back
INSERT INTO employees (first_name, last_name, email)
VALUES ('John', 'Doe', 'john.doe@company.com')
RETURNING emp_id, email;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICAL INSERT EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Populate departments
INSERT INTO departments (dept_name, location, budget) VALUES
    ('Engineering', 'Floor 3', 2000000.00),
    ('Sales', 'Floor 1', 1500000.00),
    ('Marketing', 'Floor 2', 800000.00),
    ('HR', 'Floor 4', 500000.00),
    ('Finance', 'Floor 4', 1200000.00);

-- Populate employees with realistic data
INSERT INTO employees (emp_code, first_name, last_name, email, phone, hire_date,
                       job_title, salary, dept_id, manager_id) VALUES
    ('E001', 'Rajesh', 'Kumar', 'rajesh.kumar@company.com', '9876543210',
     '2020-01-15', 'Engineering Manager', 150000.00, 1, NULL),
    ('E002', 'Priya', 'Sharma', 'priya.sharma@company.com', '9876543211',
     '2020-03-20', 'Senior Developer', 120000.00, 1, 1),
    ('E003', 'Amit', 'Patel', 'amit.patel@company.com', '9876543212',
     '2021-05-10', 'Developer', 80000.00, 1, 1),
    ('E004', 'Sneha', 'Reddy', 'sneha.reddy@company.com', '9876543213',
     '2019-08-01', 'Sales Manager', 130000.00, 2, NULL),
    ('E005', 'Vikram', 'Singh', 'vikram.singh@company.com', '9876543214',
     '2021-02-28', 'Sales Executive', 60000.00, 2, 4),
    ('E006', 'Ananya', 'Gupta', 'ananya.gupta@company.com', '9876543215',
     '2020-11-15', 'Marketing Lead', 100000.00, 3, NULL),
    ('E007', 'Karthik', 'Nair', 'karthik.nair@company.com', '9876543216',
     '2022-01-10', 'HR Manager', 90000.00, 4, NULL),
    ('E008', 'Meera', 'Iyer', 'meera.iyer@company.com', '9876543217',
     '2021-07-22', 'Finance Manager', 110000.00, 5, NULL);
```

### UPDATE Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATE - MODIFYING EXISTING DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic UPDATE
UPDATE employees
SET salary = 85000.00
WHERE emp_id = 3;

-- UPDATE multiple columns
UPDATE employees
SET
    salary = salary * 1.10,           -- 10% raise
    job_title = 'Senior Developer',
    updated_at = NOW()
WHERE emp_id = 3;

-- UPDATE with condition on another table (subquery)
UPDATE employees
SET salary = salary * 1.15
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'Engineering');

-- UPDATE with JOIN (MySQL)
UPDATE employees e
JOIN departments d ON e.dept_id = d.dept_id
SET e.salary = e.salary * 1.10
WHERE d.dept_name = 'Engineering';

-- UPDATE with CASE (conditional updates)
UPDATE employees
SET salary = CASE
    WHEN job_title LIKE '%Manager%' THEN salary * 1.15
    WHEN job_title LIKE '%Senior%' THEN salary * 1.12
    WHEN job_title LIKE '%Lead%' THEN salary * 1.10
    ELSE salary * 1.05
END;

-- UPDATE with LIMIT (MySQL) - update only first N rows
UPDATE products
SET price = price * 0.90  -- 10% discount
WHERE category_id = 1
ORDER BY price DESC
LIMIT 10;

-- UPDATE with RETURNING (PostgreSQL)
UPDATE employees
SET salary = salary * 1.10
WHERE dept_id = 1
RETURNING emp_id, first_name, salary;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFE UPDATE PRACTICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ALWAYS use WHERE clause! (Very important)
-- BAD: UPDATE employees SET is_active = FALSE;  -- Updates ALL rows!
-- GOOD:
UPDATE employees SET is_active = FALSE WHERE emp_id = 5;

-- Preview what will be updated first
SELECT * FROM employees WHERE dept_id = 1;
-- Then update
UPDATE employees SET salary = salary * 1.10 WHERE dept_id = 1;

-- Use transactions for safety
START TRANSACTION;
UPDATE employees SET salary = salary * 1.10 WHERE dept_id = 1;
-- Check results
SELECT * FROM employees WHERE dept_id = 1;
-- If OK, commit; otherwise rollback
COMMIT;  -- or ROLLBACK;
```

### DELETE Operations

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DELETE - REMOVING DATA FROM TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic DELETE
DELETE FROM employees WHERE emp_id = 5;

-- DELETE with multiple conditions
DELETE FROM employees
WHERE is_active = FALSE
  AND last_login < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- DELETE with subquery
DELETE FROM order_items
WHERE order_id IN (
    SELECT order_id FROM orders WHERE status = 'cancelled'
);

-- DELETE with JOIN (MySQL)
DELETE e
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Temporary';

-- DELETE with LIMIT
DELETE FROM logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
LIMIT 10000;

-- DELETE all rows (slower than TRUNCATE)
DELETE FROM temp_table;

-- TRUNCATE (faster, resets auto-increment)
TRUNCATE TABLE temp_table;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFE DELETE PRACTICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Preview before delete
SELECT * FROM employees WHERE is_active = FALSE;
-- Then delete
DELETE FROM employees WHERE is_active = FALSE;

-- Use LIMIT for large deletes (avoid locking table too long)
-- Delete in batches
REPEAT
    DELETE FROM large_table
    WHERE condition = TRUE
    LIMIT 10000;
UNTIL ROW_COUNT() = 0 END REPEAT;

-- Soft delete (recommended for important data)
UPDATE employees SET is_active = FALSE, deleted_at = NOW()
WHERE emp_id = 5;
```

---

## Chapter 5: Basic Queries (SELECT, WHERE, ORDER BY)

### SELECT Fundamentals

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- SELECT - RETRIEVING DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Select all columns
SELECT * FROM employees;

-- Select specific columns
SELECT first_name, last_name, email FROM employees;

-- Select with alias (rename columns in output)
SELECT
    first_name AS "First Name",
    last_name AS "Last Name",
    salary AS "Monthly Salary",
    salary * 12 AS "Annual Salary"
FROM employees;

-- Select with calculations
SELECT
    first_name,
    salary,
    salary * 0.10 AS tax,
    salary - (salary * 0.10) AS net_salary
FROM employees;

-- Select distinct values (remove duplicates)
SELECT DISTINCT dept_id FROM employees;

SELECT DISTINCT dept_id, job_title FROM employees;  -- Combination distinct

-- Select with CONCAT (string concatenation)
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name,
    email
FROM employees;

-- Select with COALESCE (handle NULL values)
SELECT
    first_name,
    COALESCE(phone, 'No phone') AS phone,
    COALESCE(commission_pct, 0) AS commission
FROM employees;

-- Select with CASE (conditional output)
SELECT
    first_name,
    salary,
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_grade
FROM employees;
```

### WHERE Clause - Filtering Data

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- WHERE CLAUSE - ALL COMPARISON OPERATORS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Equal
SELECT * FROM employees WHERE dept_id = 1;

-- Not equal
SELECT * FROM employees WHERE dept_id != 1;
SELECT * FROM employees WHERE dept_id <> 1;  -- Same as above

-- Greater than, Less than
SELECT * FROM employees WHERE salary > 80000;
SELECT * FROM employees WHERE salary < 80000;
SELECT * FROM employees WHERE salary >= 80000;
SELECT * FROM employees WHERE salary <= 80000;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LOGICAL OPERATORS (AND, OR, NOT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- AND (both conditions must be true)
SELECT * FROM employees
WHERE dept_id = 1 AND salary > 100000;

-- OR (at least one condition must be true)
SELECT * FROM employees
WHERE dept_id = 1 OR dept_id = 2;

-- NOT (negates condition)
SELECT * FROM employees
WHERE NOT dept_id = 1;

-- Combined (use parentheses for clarity!)
SELECT * FROM employees
WHERE (dept_id = 1 OR dept_id = 2) AND salary > 80000;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SPECIAL OPERATORS
-- ═══════════════════════════════════════════════════════════════════════════════

-- BETWEEN (inclusive range)
SELECT * FROM employees
WHERE salary BETWEEN 50000 AND 100000;
-- Same as: WHERE salary >= 50000 AND salary <= 100000

SELECT * FROM employees
WHERE hire_date BETWEEN '2020-01-01' AND '2020-12-31';

-- IN (match any value in list)
SELECT * FROM employees
WHERE dept_id IN (1, 2, 3);
-- Same as: WHERE dept_id = 1 OR dept_id = 2 OR dept_id = 3

SELECT * FROM employees
WHERE job_title IN ('Manager', 'Senior Developer', 'Lead');

-- NOT IN
SELECT * FROM employees
WHERE dept_id NOT IN (4, 5);

-- IS NULL / IS NOT NULL
SELECT * FROM employees WHERE manager_id IS NULL;
SELECT * FROM employees WHERE manager_id IS NOT NULL;
-- Note: = NULL won't work! Must use IS NULL


-- ═══════════════════════════════════════════════════════════════════════════════
-- LIKE - PATTERN MATCHING
-- ═══════════════════════════════════════════════════════════════════════════════

-- % = any number of characters (including zero)
-- _ = exactly one character

-- Starts with
SELECT * FROM employees WHERE first_name LIKE 'R%';    -- Rajesh, Rahul...

-- Ends with
SELECT * FROM employees WHERE email LIKE '%@gmail.com';

-- Contains
SELECT * FROM employees WHERE job_title LIKE '%Manager%';

-- Exactly N characters
SELECT * FROM employees WHERE emp_code LIKE 'E___';    -- E001, E002...

-- Combined patterns
SELECT * FROM employees WHERE email LIKE '%@%.%';      -- Valid email pattern

-- NOT LIKE
SELECT * FROM employees WHERE email NOT LIKE '%@gmail.com';

-- ESCAPE special characters
SELECT * FROM products WHERE name LIKE '%10\%%' ESCAPE '\';  -- Contains '10%'

-- Case insensitive (MySQL is case-insensitive by default for LIKE)
SELECT * FROM employees WHERE LOWER(first_name) LIKE 'r%';  -- Explicit


-- ═══════════════════════════════════════════════════════════════════════════════
-- REGEXP / RLIKE - REGULAR EXPRESSIONS (MySQL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Match pattern
SELECT * FROM employees WHERE first_name REGEXP '^[A-M]';  -- Starts with A-M

-- Match email format
SELECT * FROM customers WHERE email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

-- Match phone number format
SELECT * FROM customers WHERE phone REGEXP '^[0-9]{10}$';
```

### ORDER BY - Sorting Results

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER BY - SORTING RESULTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ascending (default)
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;  -- Explicit

-- Descending
SELECT * FROM employees ORDER BY salary DESC;

-- Multiple columns (first priority, then second)
SELECT * FROM employees
ORDER BY dept_id ASC, salary DESC;

-- Order by alias
SELECT first_name, salary, salary * 12 AS annual
FROM employees
ORDER BY annual DESC;

-- Order by column position (not recommended, but works)
SELECT first_name, last_name, salary
FROM employees
ORDER BY 3 DESC;  -- 3rd column = salary

-- Order by expression
SELECT * FROM employees
ORDER BY (salary + COALESCE(salary * commission_pct, 0)) DESC;

-- Order with NULL handling
SELECT * FROM employees
ORDER BY commission_pct NULLS LAST;  -- PostgreSQL
-- MySQL: ORDER BY ISNULL(commission_pct), commission_pct;

-- Order by CASE (custom order)
SELECT * FROM employees
ORDER BY CASE job_title
    WHEN 'Manager' THEN 1
    WHEN 'Lead' THEN 2
    WHEN 'Senior Developer' THEN 3
    ELSE 4
END;

-- Random order (useful for sampling)
SELECT * FROM employees ORDER BY RAND() LIMIT 5;  -- MySQL
SELECT * FROM employees ORDER BY RANDOM() LIMIT 5;  -- PostgreSQL
```

### LIMIT and OFFSET - Pagination

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMIT - RESTRICTING RESULT COUNT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get first N rows
SELECT * FROM employees LIMIT 10;

-- Get top 5 highest paid
SELECT * FROM employees
ORDER BY salary DESC
LIMIT 5;

-- OFFSET - Skip first N rows (for pagination)
SELECT * FROM employees
ORDER BY emp_id
LIMIT 10 OFFSET 20;  -- Skip 20, get next 10 (page 3)

-- Alternative syntax (MySQL)
SELECT * FROM employees
ORDER BY emp_id
LIMIT 20, 10;  -- LIMIT offset, count


-- ═══════════════════════════════════════════════════════════════════════════════
-- PAGINATION EXAMPLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Page 1 (rows 1-10)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 0;

-- Page 2 (rows 11-20)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 10;

-- Page 3 (rows 21-30)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 20;

-- General formula: OFFSET = (page_number - 1) * page_size

-- Get total count for pagination UI
SELECT COUNT(*) AS total_products FROM products;
```

---

## 📝 PRACTICE EXERCISES - PART 1

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS - FOUNDATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
Use this sample database for practice:

Tables: employees, departments, products, customers, orders, order_items
(Schemas provided in Chapter 3)
*/

-- LEVEL: EASY

-- 1. Select all employees from the Engineering department
-- Expected: Use WHERE with subquery or JOIN

-- 2. Find all employees whose salary is between 60000 and 100000
-- Expected: Use BETWEEN

-- 3. List all products that contain 'phone' in their name (case insensitive)
-- Expected: Use LIKE

-- 4. Find all customers who don't have a phone number
-- Expected: Use IS NULL

-- 5. Get the top 10 highest paid employees
-- Expected: Use ORDER BY and LIMIT


-- LEVEL: MEDIUM

-- 6. Find all employees who were hired in 2021 or 2022
-- Expected: Multiple approaches possible (BETWEEN, IN, YEAR())

-- 7. List employees sorted by department, then by salary (highest first within dept)
-- Expected: ORDER BY multiple columns

-- 8. Find all managers (employees who have other employees reporting to them)
-- Expected: Use subquery with EXISTS or IN

-- 9. Get the 3rd page of products (10 products per page), sorted by price
-- Expected: Use LIMIT and OFFSET

-- 10. Display employees with their full name and salary grade
--     (High: >100000, Medium: 50000-100000, Low: <50000)
-- Expected: Use CASE statement


-- Try to solve these before looking at solutions below!

```

---

## ✅ SOLUTIONS TO PRACTICE EXERCISES

```sql
-- SOLUTIONS

-- 1. Employees from Engineering
SELECT e.* FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Engineering';

-- 2. Salary between 60000 and 100000
SELECT * FROM employees WHERE salary BETWEEN 60000 AND 100000;

-- 3. Products containing 'phone'
SELECT * FROM products WHERE LOWER(name) LIKE '%phone%';

-- 4. Customers without phone
SELECT * FROM customers WHERE phone IS NULL;

-- 5. Top 10 highest paid
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;

-- 6. Hired in 2021 or 2022
SELECT * FROM employees
WHERE YEAR(hire_date) IN (2021, 2022);
-- OR: WHERE hire_date BETWEEN '2021-01-01' AND '2022-12-31';

-- 7. Sorted by dept then salary
SELECT * FROM employees ORDER BY dept_id ASC, salary DESC;

-- 8. Find managers
SELECT DISTINCT m.* FROM employees m
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.manager_id = m.emp_id);
-- OR: WHERE emp_id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL);

-- 9. 3rd page of products
SELECT * FROM products ORDER BY price LIMIT 10 OFFSET 20;

-- 10. Full name and salary grade
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name,
    salary,
    CASE
        WHEN salary > 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_grade
FROM employees;
```

---

_"Part 1 Complete! You now understand Database basics, Data Types, DDL, DML, and basic SELECT queries."_

---

# 📗 PART 2: INTERMEDIATE

---

## Chapter 6: Aggregate Functions & GROUP BY

### Aggregate Functions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AGGREGATE FUNCTIONS - SUMMARY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Aggregate functions perform calculations on a SET of values and return         │
│  a SINGLE value. They ignore NULL values (except COUNT(*)).                     │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Function       │ Description                        │ Example           │  │
│  ├─────────────────┼────────────────────────────────────┼───────────────────┤  │
│  │ COUNT(*)        │ Count all rows                     │ COUNT(*)          │  │
│  │ COUNT(column)   │ Count non-NULL values              │ COUNT(email)      │  │
│  │ COUNT(DISTINCT) │ Count unique values                │ COUNT(DISTINCT d) │  │
│  │ SUM(column)     │ Sum of all values                  │ SUM(salary)       │  │
│  │ AVG(column)     │ Average of all values              │ AVG(price)        │  │
│  │ MIN(column)     │ Minimum value                      │ MIN(hire_date)    │  │
│  │ MAX(column)     │ Maximum value                      │ MAX(salary)       │  │
│  │ GROUP_CONCAT()  │ Concatenate values (MySQL)         │ GROUP_CONCAT(name)│  │
│  │ STRING_AGG()    │ Concatenate values (PostgreSQL)    │ STRING_AGG(n,',') │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- AGGREGATE FUNCTIONS - EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- COUNT - Counting rows
SELECT COUNT(*) AS total_employees FROM employees;
SELECT COUNT(phone) AS employees_with_phone FROM employees;  -- Ignores NULL
SELECT COUNT(DISTINCT dept_id) AS department_count FROM employees;

-- SUM - Total of numeric column
SELECT SUM(salary) AS total_salary FROM employees;
SELECT SUM(salary) AS eng_salary FROM employees WHERE dept_id = 1;

-- AVG - Average value
SELECT AVG(salary) AS avg_salary FROM employees;
SELECT ROUND(AVG(salary), 2) AS avg_salary FROM employees;  -- Rounded

-- MIN / MAX
SELECT MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees;
SELECT MIN(hire_date) AS first_hire, MAX(hire_date) AS latest_hire FROM employees;

-- All aggregates together
SELECT
    COUNT(*) AS total_employees,
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary
FROM employees;

-- GROUP_CONCAT (MySQL) - Concatenate values into string
SELECT GROUP_CONCAT(first_name) AS all_names FROM employees WHERE dept_id = 1;
-- Result: "Rajesh,Priya,Amit"

SELECT GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ', ') AS all_names
FROM employees WHERE dept_id = 1;
-- Result: "Amit, Priya, Rajesh"

-- STRING_AGG (PostgreSQL)
SELECT STRING_AGG(first_name, ', ' ORDER BY first_name) AS all_names
FROM employees WHERE dept_id = 1;
```

### GROUP BY - Grouping Data

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GROUP BY - HOW IT WORKS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GROUP BY divides rows into groups based on column values.                      │
│  Aggregate functions are then applied to each group separately.                 │
│                                                                                  │
│  Original Data:                    After GROUP BY dept_id:                      │
│  ┌──────────────────────────┐     ┌────────────────────────────────────────┐  │
│  │ emp_id │ dept │ salary   │     │ dept │ count │ sum_sal  │ avg_sal     │  │
│  ├────────┼──────┼──────────┤     ├──────┼───────┼──────────┼─────────────┤  │
│  │ 1      │ 1    │ 100000   │     │ 1    │ 3     │ 280000   │ 93333.33    │  │
│  │ 2      │ 1    │ 80000    │     │ 2    │ 2     │ 150000   │ 75000.00    │  │
│  │ 3      │ 1    │ 100000   │     └────────────────────────────────────────┘  │
│  │ 4      │ 2    │ 90000    │                                                  │
│  │ 5      │ 2    │ 60000    │     SELECT dept_id,                              │
│  └──────────────────────────┘            COUNT(*) AS count,                    │
│                                          SUM(salary) AS sum_sal,               │
│                                          AVG(salary) AS avg_sal                │
│                                   FROM employees                               │
│                                   GROUP BY dept_id;                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUP BY - EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic GROUP BY
SELECT dept_id, COUNT(*) AS employee_count
FROM employees
GROUP BY dept_id;

-- GROUP BY with multiple aggregates
SELECT
    dept_id,
    COUNT(*) AS emp_count,
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary
FROM employees
GROUP BY dept_id;

-- GROUP BY with JOIN (show department name)
SELECT
    d.dept_name,
    COUNT(*) AS emp_count,
    ROUND(AVG(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name;

-- GROUP BY multiple columns
SELECT
    dept_id,
    job_title,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id, job_title
ORDER BY dept_id, avg_salary DESC;

-- GROUP BY with expressions
SELECT
    YEAR(hire_date) AS hire_year,
    COUNT(*) AS hires
FROM employees
GROUP BY YEAR(hire_date)
ORDER BY hire_year;

-- GROUP BY with CASE (custom grouping)
SELECT
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_band,
    COUNT(*) AS employee_count
FROM employees
GROUP BY
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END;


-- ═══════════════════════════════════════════════════════════════════════════════
-- HAVING - FILTERING GROUPS
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHERE filters ROWS before grouping
-- HAVING filters GROUPS after grouping

-- Find departments with more than 2 employees
SELECT dept_id, COUNT(*) AS emp_count
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 2;

-- Find departments where average salary > 80000
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 80000;

-- Combined WHERE and HAVING
SELECT
    dept_id,
    COUNT(*) AS active_count,
    AVG(salary) AS avg_salary
FROM employees
WHERE is_active = TRUE           -- Filter rows first
GROUP BY dept_id
HAVING COUNT(*) >= 2             -- Then filter groups
   AND AVG(salary) > 70000
ORDER BY avg_salary DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXECUTION ORDER (Important!)
-- ═══════════════════════════════════════════════════════════════════════════════

/*
SQL Execution Order:
1. FROM        - Get data from tables
2. JOIN        - Join tables together
3. WHERE       - Filter individual rows
4. GROUP BY    - Create groups
5. HAVING      - Filter groups
6. SELECT      - Choose columns and compute aggregates
7. DISTINCT    - Remove duplicates
8. ORDER BY    - Sort results
9. LIMIT       - Restrict output count

This is why you can't use column aliases in WHERE but can in ORDER BY!
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLLUP & CUBE - SUBTOTALS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ROLLUP: Creates subtotals at each level + grand total
SELECT
    COALESCE(d.dept_name, 'TOTAL') AS department,
    COALESCE(e.job_title, 'Subtotal') AS job_title,
    COUNT(*) AS emp_count,
    SUM(e.salary) AS total_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_name, e.job_title WITH ROLLUP;

-- CUBE: Creates subtotals for all combinations (PostgreSQL)
SELECT
    COALESCE(d.dept_name, 'ALL') AS department,
    COALESCE(e.job_title, 'ALL') AS job_title,
    COUNT(*) AS emp_count
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY CUBE(d.dept_name, e.job_title);

-- GROUPING SETS: Explicit grouping combinations
SELECT
    d.dept_name,
    YEAR(e.hire_date) AS hire_year,
    COUNT(*) AS emp_count
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY GROUPING SETS (
    (d.dept_name),
    (YEAR(e.hire_date)),
    (d.dept_name, YEAR(e.hire_date))
);
```

---

## Chapter 7: JOINs - Combining Tables

### JOIN Types Visual

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SQL JOINS - VISUAL GUIDE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Table A: employees              Table B: departments                           │
│  ┌────────┬─────────┬─────┐     ┌─────────┬─────────────┐                      │
│  │ emp_id │ name    │dept │     │ dept_id │ dept_name   │                      │
│  ├────────┼─────────┼─────┤     ├─────────┼─────────────┤                      │
│  │ 1      │ Alice   │ 10  │     │ 10      │ Engineering │                      │
│  │ 2      │ Bob     │ 20  │     │ 20      │ Marketing   │                      │
│  │ 3      │ Carol   │ 10  │     │ 30      │ Finance     │  ← No employees      │
│  │ 4      │ Dave    │ 40  │← No dept  │                │                      │
│  └────────┴─────────┴─────┘     └─────────┴─────────────┘                      │
│                                                                                  │
│                                                                                  │
│  1. INNER JOIN - Only matching rows from both tables                            │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │     ┌─────────┐                                                           │ │
│  │     │  A  ████│████  B                                                    │ │
│  │     │     ████│████                                                       │ │
│  │     └─────────┘                                                           │ │
│  │                                                                           │ │
│  │  Result: Alice, Bob, Carol (Dave excluded - no matching dept)             │ │
│  │                            (Finance excluded - no employees)              │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  2. LEFT JOIN - All from A + matching from B                                    │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │     ┌─────────┐                                                           │ │
│  │     │████████│████  B                                                    │ │
│  │     │████████│████                                                       │ │
│  │     └─────────┘                                                           │ │
│  │                                                                           │ │
│  │  Result: Alice, Bob, Carol, Dave (Dave included with NULL dept_name)      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  3. RIGHT JOIN - All from B + matching from A                                   │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │     ┌─────────┐                                                           │ │
│  │       A  ████│████████                                                    │ │
│  │          ████│████████                                                    │ │
│  │     └─────────┘                                                           │ │
│  │                                                                           │ │
│  │  Result: Alice, Bob, Carol + Finance (with NULL employee columns)         │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  4. FULL OUTER JOIN - All from both tables                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │     ┌─────────┐                                                           │ │
│  │     │████████│████████                                                    │ │
│  │     │████████│████████                                                    │ │
│  │     └─────────┘                                                           │ │
│  │                                                                           │ │
│  │  Result: Alice, Bob, Carol, Dave (NULL dept), Finance (NULL emp)          │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  5. CROSS JOIN - Cartesian product (every A with every B)                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │  4 employees × 3 departments = 12 rows                                    │ │
│  │  (Alice, Eng), (Alice, Mkt), (Alice, Fin), (Bob, Eng)... etc.            │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### JOIN Syntax and Examples

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- INNER JOIN - Most common join type
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic INNER JOIN
SELECT
    e.emp_id,
    e.first_name,
    e.last_name,
    d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;

-- Multiple conditions in JOIN
SELECT e.*, d.dept_name
FROM employees e
INNER JOIN departments d
    ON e.dept_id = d.dept_id
    AND d.is_active = TRUE;

-- Join with additional WHERE
SELECT e.*, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id
WHERE e.salary > 80000;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LEFT JOIN (LEFT OUTER JOIN)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get all employees, even those without departments
SELECT
    e.emp_id,
    e.first_name,
    d.dept_name,
    COALESCE(d.dept_name, 'No Department') AS department
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- Find employees WITHOUT a department (orphan records)
SELECT e.*
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_id IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- RIGHT JOIN (RIGHT OUTER JOIN)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get all departments, even those without employees
SELECT
    d.dept_name,
    COUNT(e.emp_id) AS employee_count
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name;

-- Find departments WITHOUT employees
SELECT d.*
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FULL OUTER JOIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- PostgreSQL - Native support
SELECT
    e.first_name,
    d.dept_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;

-- MySQL - Simulate with UNION
SELECT e.first_name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
UNION
SELECT e.first_name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SELF JOIN - Table joined to itself
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find employees and their managers
SELECT
    e.first_name AS employee,
    e.job_title AS employee_title,
    m.first_name AS manager,
    m.job_title AS manager_title
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- Find employees who earn more than their managers
SELECT
    e.first_name AS employee,
    e.salary AS emp_salary,
    m.first_name AS manager,
    m.salary AS mgr_salary
FROM employees e
INNER JOIN employees m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CROSS JOIN - Cartesian Product
-- ═══════════════════════════════════════════════════════════════════════════════

-- Generate all employee-project combinations
SELECT e.first_name, p.project_name
FROM employees e
CROSS JOIN projects p;

-- Generate a calendar (all dates in a range)
-- Using numbers table technique
SELECT
    DATE_ADD('2024-01-01', INTERVAL n.num DAY) AS calendar_date
FROM (
    SELECT 0 AS num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) n;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MULTIPLE JOINS - Joining 3+ tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Orders with customer and product details
SELECT
    o.order_number,
    c.first_name AS customer,
    p.name AS product,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= '2024-01-01'
ORDER BY o.order_date DESC;

-- Employee hierarchy with department
SELECT
    e.first_name AS employee,
    e.job_title,
    d.dept_name,
    m.first_name AS manager,
    md.dept_name AS manager_dept
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
LEFT JOIN employees m ON e.manager_id = m.emp_id
LEFT JOIN departments md ON m.dept_id = md.dept_id;


-- ═══════════════════════════════════════════════════════════════════════════════
-- JOIN PERFORMANCE TIPS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
1. Always join on indexed columns (usually PRIMARY KEY / FOREIGN KEY)
2. Put the smaller table on the left side of the JOIN
3. Filter with WHERE before joining when possible
4. Use INNER JOIN instead of LEFT JOIN when you don't need nulls
5. Avoid joining on computed columns or functions:
   BAD:  ON YEAR(a.date) = YEAR(b.date)
   GOOD: ON a.date_year = b.date_year (pre-computed column)
*/

-- Example: Filter before join with subquery
SELECT e.*, d.dept_name
FROM (
    SELECT * FROM employees WHERE salary > 100000
) e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```

---

## Chapter 8: Subqueries & CTEs

### Subquery Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SUBQUERY TYPES                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SCALAR SUBQUERY - Returns single value                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees                                                   ││
│  │  WHERE salary > (SELECT AVG(salary) FROM employees);                       ││
│  │               └──────────────────────────────────────┘                     ││
│  │                    Returns: 85000 (single value)                           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  2. ROW SUBQUERY - Returns single row                                           │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees                                                   ││
│  │  WHERE (dept_id, job_title) = (SELECT dept_id, job_title                  ││
│  │                                 FROM employees WHERE emp_id = 1);          ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  3. COLUMN SUBQUERY - Returns single column (multiple rows)                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees                                                   ││
│  │  WHERE dept_id IN (SELECT dept_id FROM departments                        ││
│  │                    WHERE location = 'New York');                           ││
│  │                └─────────────────────────────────────────┘                 ││
│  │                     Returns: (1, 2, 5) - list of values                    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  4. TABLE SUBQUERY - Returns multiple rows and columns                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT d.dept_name, sub.avg_salary                                        ││
│  │  FROM departments d                                                        ││
│  │  JOIN (SELECT dept_id, AVG(salary) as avg_salary                          ││
│  │        FROM employees GROUP BY dept_id) sub                                ││
│  │  ON d.dept_id = sub.dept_id;                                               ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  5. CORRELATED SUBQUERY - References outer query                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees e                                                 ││
│  │  WHERE salary > (SELECT AVG(salary) FROM employees                        ││
│  │                  WHERE dept_id = e.dept_id);   ←─ References e             ││
│  │                                                                            ││
│  │  Executes subquery ONCE PER ROW in outer query (can be slow!)             ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBQUERIES IN SELECT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Scalar subquery in SELECT
SELECT
    first_name,
    salary,
    (SELECT AVG(salary) FROM employees) AS company_avg,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;

-- Correlated subquery in SELECT (department average)
SELECT
    e.first_name,
    e.dept_id,
    e.salary,
    (SELECT AVG(salary) FROM employees e2 WHERE e2.dept_id = e.dept_id) AS dept_avg
FROM employees e;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBQUERIES IN WHERE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Scalar subquery
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- IN subquery (column subquery)
SELECT * FROM employees
WHERE dept_id IN (
    SELECT dept_id FROM departments WHERE budget > 1000000
);

-- NOT IN subquery
SELECT * FROM departments
WHERE dept_id NOT IN (
    SELECT DISTINCT dept_id FROM employees WHERE dept_id IS NOT NULL
);

-- ANY / SOME (match any value from subquery)
SELECT * FROM employees
WHERE salary > ANY (
    SELECT salary FROM employees WHERE dept_id = 1
);

-- ALL (match all values from subquery)
SELECT * FROM employees
WHERE salary > ALL (
    SELECT salary FROM employees WHERE dept_id = 2
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXISTS / NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- EXISTS - Check if subquery returns any rows
-- Often faster than IN for large datasets

-- Find departments that have employees
SELECT * FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id
);

-- Find departments without employees
SELECT * FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id
);

-- Find employees who have placed orders
SELECT * FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBQUERIES IN FROM (Derived Tables)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Calculate aggregates and then filter
SELECT dept_name, avg_salary
FROM (
    SELECT
        d.dept_name,
        AVG(e.salary) AS avg_salary
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
    GROUP BY d.dept_id, d.dept_name
) AS dept_stats
WHERE avg_salary > 80000;

-- Top earner per department
SELECT dept_name, top_earner, max_salary
FROM (
    SELECT
        d.dept_name,
        e.first_name AS top_earner,
        e.salary AS max_salary,
        RANK() OVER (PARTITION BY d.dept_id ORDER BY e.salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
) ranked
WHERE rnk = 1;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CORRELATED SUBQUERIES (Advanced)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Employees who earn above their department average
SELECT e.*
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id
);

-- Get the latest order for each customer
SELECT *
FROM orders o1
WHERE o1.order_date = (
    SELECT MAX(o2.order_date)
    FROM orders o2
    WHERE o2.customer_id = o1.customer_id
);

-- Employees who are the highest paid in their department
SELECT e.*
FROM employees e
WHERE e.salary = (
    SELECT MAX(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- CTEs (Common Table Expressions) - WITH Clause
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic CTE
WITH dept_stats AS (
    SELECT
        dept_id,
        COUNT(*) AS emp_count,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY dept_id
)
SELECT
    d.dept_name,
    ds.emp_count,
    ds.avg_salary
FROM dept_stats ds
JOIN departments d ON ds.dept_id = d.dept_id
WHERE ds.avg_salary > 80000;

-- Multiple CTEs
WITH
    high_earners AS (
        SELECT * FROM employees WHERE salary > 100000
    ),
    dept_counts AS (
        SELECT dept_id, COUNT(*) as cnt FROM high_earners GROUP BY dept_id
    )
SELECT
    d.dept_name,
    COALESCE(dc.cnt, 0) AS high_earner_count
FROM departments d
LEFT JOIN dept_counts dc ON d.dept_id = dc.dept_id;

-- CTE with calculations
WITH monthly_revenue AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE status = 'delivered'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
revenue_with_growth AS (
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
        revenue - LAG(revenue) OVER (ORDER BY month) AS growth
    FROM monthly_revenue
)
SELECT
    month,
    revenue,
    prev_revenue,
    growth,
    ROUND(growth / prev_revenue * 100, 2) AS growth_pct
FROM revenue_with_growth
WHERE prev_revenue IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- RECURSIVE CTEs
-- ═══════════════════════════════════════════════════════════════════════════════

-- Generate number sequence
WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 10
)
SELECT * FROM numbers;

-- Employee hierarchy (org chart)
WITH RECURSIVE org_chart AS (
    -- Base case: top-level managers (no manager)
    SELECT
        emp_id,
        first_name,
        manager_id,
        0 AS level,
        CAST(first_name AS CHAR(1000)) AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: employees with managers
    SELECT
        e.emp_id,
        e.first_name,
        e.manager_id,
        oc.level + 1,
        CONCAT(oc.path, ' -> ', e.first_name)
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.emp_id
)
SELECT
    REPEAT('  ', level) || first_name AS employee_tree,
    level,
    path
FROM org_chart
ORDER BY path;

-- Category tree (for e-commerce)
WITH RECURSIVE category_tree AS (
    SELECT
        category_id,
        name,
        parent_id,
        1 AS level,
        name AS full_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        c.category_id,
        c.name,
        c.parent_id,
        ct.level + 1,
        CONCAT(ct.full_path, ' > ', c.name)
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree ORDER BY full_path;
```

---

## Chapter 9: Window Functions

### Window Functions Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WINDOW FUNCTIONS - OVERVIEW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Window functions perform calculations across a SET of rows related to the      │
│  current row, WITHOUT collapsing the result into a single row (unlike GROUP BY).│
│                                                                                  │
│  Syntax:                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  function_name() OVER (                                                    ││
│  │      [PARTITION BY column1, column2]  ← Groups for calculation             ││
│  │      [ORDER BY column3]               ← Order within group                 ││
│  │      [ROWS/RANGE frame_clause]        ← Which rows to consider             ││
│  │  )                                                                         ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  WINDOW FUNCTION CATEGORIES:                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  1. RANKING Functions                                                      ││
│  │     • ROW_NUMBER() - Unique sequential number                              ││
│  │     • RANK()       - Rank with gaps                                        ││
│  │     • DENSE_RANK() - Rank without gaps                                     ││
│  │     • NTILE(n)     - Divide into n groups                                  ││
│  │                                                                            ││
│  │  2. VALUE Functions                                                        ││
│  │     • LAG()         - Previous row value                                   ││
│  │     • LEAD()        - Next row value                                       ││
│  │     • FIRST_VALUE() - First value in window                                ││
│  │     • LAST_VALUE()  - Last value in window                                 ││
│  │     • NTH_VALUE()   - Nth value in window                                  ││
│  │                                                                            ││
│  │  3. AGGREGATE Functions (as window)                                        ││
│  │     • SUM() OVER()                                                         ││
│  │     • AVG() OVER()                                                         ││
│  │     • COUNT() OVER()                                                       ││
│  │     • MIN() OVER(), MAX() OVER()                                           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Ranking Functions

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- RANKING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sample data for examples:
-- employees: (emp_id, name, dept_id, salary)
-- 1, Alice, 1, 100000
-- 2, Bob, 1, 90000
-- 3, Carol, 1, 90000
-- 4, Dave, 2, 85000
-- 5, Eve, 2, 85000
-- 6, Frank, 2, 75000

-- ROW_NUMBER - Unique number for each row
SELECT
    first_name,
    dept_id,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;
-- Alice: 1, Bob: 2, Carol: 3 (unique even with same salary)

-- ROW_NUMBER with PARTITION
SELECT
    first_name,
    dept_id,
    salary,
    ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees;
-- Dept 1: Alice=1, Bob=2, Carol=3
-- Dept 2: Dave=1, Eve=2, Frank=3


-- RANK - Same rank for ties, then gaps
SELECT
    first_name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rnk
FROM employees;
-- Alice: 1, Bob: 2, Carol: 2, Dave: 4, Eve: 4, Frank: 6
-- (Note the gap after ties)


-- DENSE_RANK - Same rank for ties, no gaps
SELECT
    first_name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
-- Alice: 1, Bob: 2, Carol: 2, Dave: 3, Eve: 3, Frank: 4
-- (No gaps)


-- NTILE - Divide into N groups
SELECT
    first_name,
    salary,
    NTILE(3) OVER (ORDER BY salary DESC) AS salary_tercile
FROM employees;
-- Groups employees into 3 equal-ish buckets
-- Top 33%: 1, Middle 33%: 2, Bottom 33%: 3


-- PRACTICAL: Top 3 earners per department
SELECT * FROM (
    SELECT
        e.*,
        d.dept_name,
        DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS dept_rank
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
) ranked
WHERE dept_rank <= 3;


-- PRACTICAL: Percentile ranking
SELECT
    first_name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary) AS percentile,
    CUME_DIST() OVER (ORDER BY salary) AS cumulative_dist
FROM employees;
```

### LAG and LEAD

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- LAG AND LEAD - ACCESS ADJACENT ROWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- LAG - Get previous row value
SELECT
    order_date,
    total AS today_sales,
    LAG(total, 1) OVER (ORDER BY order_date) AS yesterday_sales,
    total - LAG(total, 1) OVER (ORDER BY order_date) AS daily_change
FROM daily_sales;

-- LAG with default value (avoid NULL)
SELECT
    order_date,
    total,
    LAG(total, 1, 0) OVER (ORDER BY order_date) AS prev_total
FROM daily_sales;

-- LEAD - Get next row value
SELECT
    order_date,
    total AS today_sales,
    LEAD(total, 1) OVER (ORDER BY order_date) AS tomorrow_sales
FROM daily_sales;


-- Month-over-month growth
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) /
          LAG(revenue) OVER (ORDER BY month) * 100, 2) AS mom_growth_pct
FROM monthly_revenue;


-- Year-over-year comparison
SELECT
    month,
    revenue,
    LAG(revenue, 12) OVER (ORDER BY month) AS same_month_last_year,
    revenue - LAG(revenue, 12) OVER (ORDER BY month) AS yoy_change
FROM monthly_revenue;


-- Find consecutive events (login streaks)
WITH user_logins AS (
    SELECT
        user_id,
        login_date,
        LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date) AS prev_login,
        DATEDIFF(login_date, LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date)) AS days_since_last
    FROM logins
)
SELECT * FROM user_logins WHERE days_since_last = 1;  -- Consecutive days
```

### Running Totals and Moving Averages

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- AGGREGATE WINDOW FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Running total (cumulative sum)
SELECT
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total by category
SELECT
    category_id,
    order_date,
    total,
    SUM(total) OVER (PARTITION BY category_id ORDER BY order_date) AS category_running_total
FROM orders;


-- Moving average (last 7 days)
SELECT
    order_date,
    total,
    AVG(total) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM daily_sales;


-- Moving sum (last 30 days)
SELECT
    order_date,
    total,
    SUM(total) OVER (
        ORDER BY order_date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) AS rolling_30day_total
FROM daily_sales;


-- Percentage of total
SELECT
    dept_id,
    first_name,
    salary,
    SUM(salary) OVER () AS company_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (), 2) AS pct_of_total
FROM employees;

-- Percentage within department
SELECT
    dept_id,
    first_name,
    salary,
    SUM(salary) OVER (PARTITION BY dept_id) AS dept_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY dept_id), 2) AS pct_of_dept
FROM employees;


-- ═══════════════════════════════════════════════════════════════════════════════
-- WINDOW FRAME SPECIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

/*
ROWS BETWEEN:
- UNBOUNDED PRECEDING: From the beginning
- n PRECEDING: n rows before current
- CURRENT ROW: The current row
- n FOLLOWING: n rows after current
- UNBOUNDED FOLLOWING: To the end

Examples:
*/

-- All rows from start to current
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- 3 rows before and after current (7-row window)
AVG(amount) OVER (ORDER BY date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING)

-- Current row to the end
SUM(amount) OVER (ORDER BY date ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)

-- All rows (entire window)
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)


-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST_VALUE, LAST_VALUE, NTH_VALUE
-- ═══════════════════════════════════════════════════════════════════════════════

-- First hired in each department
SELECT
    dept_id,
    first_name,
    hire_date,
    FIRST_VALUE(first_name) OVER (
        PARTITION BY dept_id ORDER BY hire_date
    ) AS first_hired
FROM employees;

-- Compare to highest salary in department
SELECT
    dept_id,
    first_name,
    salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
    ) AS highest_in_dept,
    salary - FIRST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
    ) AS diff_from_highest
FROM employees;

-- LAST_VALUE (need explicit frame for correct result)
SELECT
    dept_id,
    first_name,
    salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_in_dept
FROM employees;


-- ═══════════════════════════════════════════════════════════════════════════════
-- NAMED WINDOWS (reduce repetition)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
    dept_id,
    first_name,
    salary,
    ROW_NUMBER() OVER w AS row_num,
    RANK() OVER w AS rnk,
    DENSE_RANK() OVER w AS dense_rnk,
    SUM(salary) OVER w AS running_sum
FROM employees
WINDOW w AS (PARTITION BY dept_id ORDER BY salary DESC);
```

---

## 📝 PRACTICE EXERCISES - PART 2

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS - INTERMEDIATE
-- ═══════════════════════════════════════════════════════════════════════════════

-- AGGREGATES & GROUP BY

-- 1. Find the total salary expense per department

-- 2. Find departments with average salary > 80000

-- 3. Count employees by job title, show titles with 2+ employees

-- 4. Find the min, max, and average order total by month


-- JOINS

-- 5. List all employees with their department names (include employees without dept)

-- 6. Find products that have never been ordered

-- 7. Show each order with customer name, product names, and quantities


-- SUBQUERIES

-- 8. Find employees who earn more than the company average

-- 9. Find the most recent order for each customer

-- 10. Find departments where all employees earn > 50000


-- WINDOW FUNCTIONS

-- 11. Rank employees by salary within their department

-- 12. Calculate running total of sales by date

-- 13. Find each employee's salary as percentage of department total

-- 14. Calculate month-over-month revenue growth

-- 15. Find top 2 products by sales in each category


-- Try to solve before checking solutions!
```

---

## ✅ SOLUTIONS TO PART 2 EXERCISES

```sql
-- SOLUTIONS

-- 1. Total salary per department
SELECT dept_id, SUM(salary) AS total_salary
FROM employees
GROUP BY dept_id;

-- 2. Departments with avg salary > 80000
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 80000;

-- 3. Job titles with 2+ employees
SELECT job_title, COUNT(*) AS employee_count
FROM employees
GROUP BY job_title
HAVING COUNT(*) >= 2;

-- 4. Order stats by month
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    MIN(total) AS min_order,
    MAX(total) AS max_order,
    AVG(total) AS avg_order
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m');

-- 5. Employees with department names
SELECT e.*, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- 6. Products never ordered
SELECT p.*
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE oi.item_id IS NULL;

-- 7. Orders with details
SELECT o.order_number, c.first_name, p.name, oi.quantity
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id;

-- 8. Above company average
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 9. Most recent order per customer
SELECT o.*
FROM orders o
WHERE o.order_date = (
    SELECT MAX(o2.order_date)
    FROM orders o2
    WHERE o2.customer_id = o.customer_id
);

-- 10. Departments where all earn > 50000
SELECT dept_id
FROM employees
GROUP BY dept_id
HAVING MIN(salary) > 50000;

-- 11. Rank within department
SELECT
    e.*,
    DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees e;

-- 12. Running total
SELECT
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- 13. Percentage of department
SELECT
    first_name,
    dept_id,
    salary,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY dept_id), 2) AS pct_of_dept
FROM employees;

-- 14. Month-over-month growth
WITH monthly AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) * 100, 2) AS growth_pct
FROM monthly;

-- 15. Top 2 products per category
SELECT * FROM (
    SELECT
        p.category_id,
        p.name,
        SUM(oi.quantity) AS total_sold,
        DENSE_RANK() OVER (PARTITION BY p.category_id ORDER BY SUM(oi.quantity) DESC) AS rnk
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.category_id, p.product_id, p.name
) ranked
WHERE rnk <= 2;
```

---

_"Part 2 Complete! You now understand Aggregates, GROUP BY, JOINs, Subqueries, CTEs, and Window Functions."_

---

# 📕 PART 3: ADVANCED

---

## Chapter 10: Database Normalization (1NF to BCNF)

### Why Normalization?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE NORMALIZATION                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PROBLEMS WITH UN-NORMALIZED DATA:                                              │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  orders (denormalized)                                                     ││
│  │  ┌──────┬──────────┬─────────┬───────────────┬──────────────┬───────────┐ ││
│  │  │ord_id│cust_name │cust_addr│ product       │ product_price│ qty       │ ││
│  │  ├──────┼──────────┼─────────┼───────────────┼──────────────┼───────────┤ ││
│  │  │ 1    │ John     │ Delhi   │ Laptop        │ 50000        │ 1         │ ││
│  │  │ 2    │ John     │ Delhi   │ Mouse         │ 500          │ 2         │ ││
│  │  │ 3    │ John     │ Delhi   │ Keyboard      │ 1500         │ 1         │ ││
│  │  │ 4    │ Priya    │ Mumbai  │ Laptop        │ 50000        │ 1         │ ││
│  │  └──────┴──────────┴─────────┴───────────────┴──────────────┴───────────┘ ││
│  │                                                                            ││
│  │  PROBLEMS:                                                                 ││
│  │  1. UPDATE ANOMALY: John moves to Bangalore → update 3 rows!              ││
│  │  2. INSERT ANOMALY: Can't add customer without order                       ││
│  │  3. DELETE ANOMALY: Delete order 4 → lose Priya's info!                   ││
│  │  4. DATA REDUNDANCY: John's name/address repeated 3 times                  ││
│  │  5. STORAGE WASTE: Same product prices stored multiple times              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  NORMALIZATION solves these by organizing data into separate tables!            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Normal Forms

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    NORMAL FORMS HIERARCHY                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                           ┌─────────────┐                                       │
│                           │    BCNF     │ ← Every determinant is a candidate key│
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     3NF     │ ← No transitive dependencies          │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     2NF     │ ← No partial dependencies             │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     1NF     │ ← Atomic values, no repeating groups  │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │ Unnormalized│                                       │
│                           └─────────────┘                                       │
│                                                                                  │
│  Each form builds on the previous one!                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### First Normal Form (1NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    1NF - FIRST NORMAL FORM                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RULES:                                                                         │
│  1. Each column contains ATOMIC (indivisible) values                            │
│  2. No REPEATING GROUPS or arrays                                               │
│  3. Each row is UNIQUE (has a primary key)                                      │
│                                                                                  │
│  BEFORE (Violates 1NF):                                                         │
│  ┌────────┬───────────────────┬─────────────────────────────────────────────┐  │
│  │ emp_id │ name              │ phone_numbers                               │  │
│  ├────────┼───────────────────┼─────────────────────────────────────────────┤  │
│  │ 1      │ Rajesh Kumar      │ 9876543210, 9876543211                      │  │
│  │ 2      │ Priya Sharma      │ 9123456789                                  │  │
│  └────────┴───────────────────┴─────────────────────────────────────────────┘  │
│  ↑ PROBLEM: phone_numbers contains multiple values (not atomic)                 │
│                                                                                  │
│  AFTER (1NF):                                                                   │
│  employees                         employee_phones                              │
│  ┌────────┬────────────────┐      ┌────────┬──────────────┐                   │
│  │ emp_id │ name           │      │ emp_id │ phone        │                   │
│  ├────────┼────────────────┤      ├────────┼──────────────┤                   │
│  │ 1      │ Rajesh Kumar   │      │ 1      │ 9876543210   │                   │
│  │ 2      │ Priya Sharma   │      │ 1      │ 9876543211   │                   │
│  └────────┴────────────────┘      │ 2      │ 9123456789   │                   │
│                                   └────────┴──────────────┘                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Second Normal Form (2NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    2NF - SECOND NORMAL FORM                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RULES:                                                                         │
│  1. Must be in 1NF                                                              │
│  2. No PARTIAL DEPENDENCY (non-key column depends on PART of composite key)     │
│                                                                                  │
│  BEFORE (Violates 2NF):                                                         │
│  order_items (PK: order_id, product_id)                                         │
│  ┌──────────┬────────────┬──────────────┬───────┬─────────┐                    │
│  │ order_id │ product_id │ product_name │ qty   │ price   │                    │
│  ├──────────┼────────────┼──────────────┼───────┼─────────┤                    │
│  │ 1        │ 101        │ Laptop       │ 1     │ 50000   │                    │
│  │ 1        │ 102        │ Mouse        │ 2     │ 500     │                    │
│  │ 2        │ 101        │ Laptop       │ 1     │ 50000   │                    │
│  └──────────┴────────────┴──────────────┴───────┴─────────┘                    │
│                                                                                  │
│  PROBLEM: product_name and price depend ONLY on product_id, not full PK!        │
│           (Partial dependency on composite key)                                 │
│                                                                                  │
│  AFTER (2NF):                                                                   │
│  order_items                           products                                 │
│  ┌──────────┬────────────┬───────┐    ┌────────────┬──────────────┬─────────┐ │
│  │ order_id │ product_id │ qty   │    │ product_id │ product_name │ price   │ │
│  ├──────────┼────────────┼───────┤    ├────────────┼──────────────┼─────────┤ │
│  │ 1        │ 101        │ 1     │    │ 101        │ Laptop       │ 50000   │ │
│  │ 1        │ 102        │ 2     │    │ 102        │ Mouse        │ 500     │ │
│  │ 2        │ 101        │ 1     │    └────────────┴──────────────┴─────────┘ │
│  └──────────┴────────────┴───────┘                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Third Normal Form (3NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    3NF - THIRD NORMAL FORM                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RULES:                                                                         │
│  1. Must be in 2NF                                                              │
│  2. No TRANSITIVE DEPENDENCY (non-key depends on another non-key)               │
│                                                                                  │
│  BEFORE (Violates 3NF):                                                         │
│  employees (PK: emp_id)                                                         │
│  ┌────────┬────────┬─────────┬───────────────┬─────────────────┐               │
│  │ emp_id │ name   │ dept_id │ dept_name     │ dept_location   │               │
│  ├────────┼────────┼─────────┼───────────────┼─────────────────┤               │
│  │ 1      │ Alice  │ 10      │ Engineering   │ Building A      │               │
│  │ 2      │ Bob    │ 10      │ Engineering   │ Building A      │               │
│  │ 3      │ Carol  │ 20      │ Marketing     │ Building B      │               │
│  └────────┴────────┴─────────┴───────────────┴─────────────────┘               │
│                                                                                  │
│  PROBLEM: dept_name, dept_location depend on dept_id, NOT emp_id!               │
│           emp_id → dept_id → dept_name (Transitive dependency)                 │
│                                                                                  │
│  AFTER (3NF):                                                                   │
│  employees                             departments                              │
│  ┌────────┬────────┬─────────┐        ┌─────────┬─────────────┬─────────────┐ │
│  │ emp_id │ name   │ dept_id │        │ dept_id │ dept_name   │ location    │ │
│  ├────────┼────────┼─────────┤        ├─────────┼─────────────┼─────────────┤ │
│  │ 1      │ Alice  │ 10      │        │ 10      │ Engineering │ Building A  │ │
│  │ 2      │ Bob    │ 10      │        │ 20      │ Marketing   │ Building B  │ │
│  │ 3      │ Carol  │ 20      │        └─────────┴─────────────┴─────────────┘ │
│  └────────┴────────┴─────────┘                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### BCNF (Boyce-Codd Normal Form)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BCNF - BOYCE-CODD NORMAL FORM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RULES:                                                                         │
│  1. Must be in 3NF                                                              │
│  2. Every DETERMINANT must be a CANDIDATE KEY                                   │
│     (If X → Y, then X must be a candidate key)                                  │
│                                                                                  │
│  BEFORE (3NF but violates BCNF):                                                │
│  student_courses (student can have only one teacher per subject)                │
│  ┌──────────┬──────────┬─────────┐                                             │
│  │ student  │ subject  │ teacher │   PK: (student, subject)                    │
│  ├──────────┼──────────┼─────────┤   Each teacher teaches only ONE subject     │
│  │ Alice    │ Math     │ Mr.X    │                                             │
│  │ Bob      │ Math     │ Mr.X    │   Functional Dependencies:                  │
│  │ Alice    │ Physics  │ Mr.Y    │   (student, subject) → teacher              │
│  │ Carol    │ Math     │ Mr.Z    │   teacher → subject  ← PROBLEM!             │
│  └──────────┴──────────┴─────────┘   (teacher determines subject but isn't key)│
│                                                                                  │
│  AFTER (BCNF):                                                                  │
│  student_teacher                       teacher_subject                          │
│  ┌──────────┬─────────┐               ┌─────────┬──────────┐                   │
│  │ student  │ teacher │               │ teacher │ subject  │                   │
│  ├──────────┼─────────┤               ├─────────┼──────────┤                   │
│  │ Alice    │ Mr.X    │               │ Mr.X    │ Math     │                   │
│  │ Bob      │ Mr.X    │               │ Mr.Y    │ Physics  │                   │
│  │ Alice    │ Mr.Y    │               │ Mr.Z    │ Math     │                   │
│  │ Carol    │ Mr.Z    │               └─────────┴──────────┘                   │
│  └──────────┴─────────┘                                                         │
│                                                                                  │
│  Now teacher → subject is in its own table where teacher IS the key!            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Normalization Summary

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- NORMALIZATION QUICK REFERENCE
-- ═══════════════════════════════════════════════════════════════════════════════

/*
1NF: No multi-valued attributes, no repeating groups
     → Split arrays into separate rows/tables

2NF: No partial dependencies (for composite keys)
     → Every non-key column depends on ENTIRE primary key

3NF: No transitive dependencies
     → Non-key columns don't depend on other non-key columns

BCNF: Every determinant is a candidate key
      → Stricter than 3NF, handles special cases


DENORMALIZATION (intentional):
Sometimes we DENORMALIZE for:
1. Read performance (fewer JOINs)
2. Reporting tables
3. Data warehousing

Example: Store customer name in orders table to avoid JOINs:
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(100),  -- Denormalized for reporting
    ...
);
*/
```

---

## Chapter 11: Indexes & Query Performance

### Index Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE INDEXES                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INDEX = Data structure that improves query speed (like book index)             │
│                                                                                  │
│  WITHOUT INDEX (Full Table Scan):                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees WHERE last_name = 'Kumar';                        ││
│  │                                                                            ││
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐                               ││
│  │  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │  ← Check EVERY row            ││
│  │  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘    (O(n) - slow!)              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  WITH INDEX (B-Tree Search):                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                     ┌─────────────┐                                        ││
│  │                     │   [K-P]     │ ← Root: Is 'Kumar' < 'K' or > 'P'?     ││
│  │                     └──────┬──────┘                                        ││
│  │              ┌─────────────┼─────────────┐                                 ││
│  │         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐                            ││
│  │         │ [A-J]   │   │ [K-P]   │   │ [Q-Z]   │ ← Navigate down            ││
│  │         └─────────┘   └────┬────┘   └─────────┘                            ││
│  │                            ▼                                               ││
│  │                    ┌───────────────┐                                       ││
│  │                    │ Kumar → Row 5 │ ← Found! (O(log n) - fast!)           ││
│  │                    └───────────────┘                                       ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  INDEX TYPES:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Type          │ Description                        │ Use Case             ││
│  ├────────────────┼────────────────────────────────────┼──────────────────────┤│
│  │ B-Tree         │ Balanced tree, default type        │ Most queries         ││
│  │ Hash           │ Hash table lookup                  │ Exact match only     ││
│  │ Full-Text      │ Text search with stemming          │ Search in documents  ││
│  │ Spatial/GiST   │ Geographic data                    │ Location queries     ││
│  │ Composite      │ Multiple columns                   │ Multi-column WHERE   ││
│  │ Covering       │ Includes all needed columns        │ Avoid table access   ││
│  │ Partial        │ Index subset of rows               │ Filtered data        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATING AND MANAGING INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single column index
CREATE INDEX idx_emp_lastname ON employees(last_name);

-- Composite index (column order matters!)
CREATE INDEX idx_emp_dept_salary ON employees(dept_id, salary);
-- Good for: WHERE dept_id = 1 AND salary > 50000
-- Good for: WHERE dept_id = 1  (leftmost column)
-- BAD for: WHERE salary > 50000  (doesn't use index!)

-- Unique index
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Descending index (for ORDER BY DESC queries)
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);

-- Partial index (PostgreSQL) - index only relevant rows
CREATE INDEX idx_active_orders ON orders(order_date)
WHERE status = 'active';

-- Full-text index (MySQL)
CREATE FULLTEXT INDEX idx_product_search ON products(name, description);

-- Using full-text search
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('laptop gaming' IN NATURAL LANGUAGE MODE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEX MAINTENANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- View indexes on a table
SHOW INDEX FROM employees;  -- MySQL
-- PostgreSQL:
SELECT * FROM pg_indexes WHERE tablename = 'employees';

-- Drop index
DROP INDEX idx_emp_lastname ON employees;  -- MySQL
DROP INDEX IF EXISTS idx_emp_lastname;      -- PostgreSQL

-- Rebuild/Optimize index
ALTER INDEX idx_emp_lastname REBUILD;  -- PostgreSQL
OPTIMIZE TABLE employees;               -- MySQL (rebuilds indexes)


-- ═══════════════════════════════════════════════════════════════════════════════
-- WHEN TO INDEX / NOT INDEX
-- ═══════════════════════════════════════════════════════════════════════════════

/*
CREATE INDEX when:
✓ Column used in WHERE clauses frequently
✓ Column used in JOIN conditions
✓ Column used in ORDER BY
✓ Column with high cardinality (many unique values)
✓ Foreign key columns

DON'T index when:
✗ Small tables (full scan is fast enough)
✗ Columns rarely used in queries
✗ Columns with low cardinality (e.g., gender: M/F)
✗ Tables with heavy INSERT/UPDATE/DELETE
✗ Columns frequently updated

REMEMBER: Indexes speed up reads but slow down writes!
*/
```

### Query Execution Plans

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPLAIN - UNDERSTANDING QUERY EXECUTION
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL EXPLAIN
EXPLAIN SELECT * FROM employees WHERE last_name = 'Kumar';

/*
Output:
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+
| id | select_type | table     | type | possible_keys | key  | key_len | ref  | rows | Extra       |
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+
| 1  | SIMPLE      | employees | ref  | idx_lastname  | idx..| 202     | const| 5    | Using index |
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+

KEY COLUMNS:
- type: Access method (best to worst)
  ALL        : Full table scan (BAD!)
  index      : Full index scan
  range      : Index range scan (BETWEEN, <, >)
  ref        : Index lookup for non-unique values
  eq_ref     : Index lookup for unique values (best for JOINs)
  const      : Single row lookup by PK (best!)

- key: Which index is used (NULL = no index used)
- rows: Estimated rows to examine
- Extra: Additional info
  Using index      : Covered by index (good!)
  Using where      : Additional filtering needed
  Using filesort   : Sorting without index (slow)
  Using temporary  : Temp table needed (slow)
*/

-- More detailed explain
EXPLAIN ANALYZE SELECT * FROM employees WHERE last_name = 'Kumar';

-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM employees WHERE last_name = 'Kumar';


-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- BAD: Function on indexed column (can't use index)
SELECT * FROM employees WHERE YEAR(hire_date) = 2023;

-- GOOD: Range query (uses index)
SELECT * FROM employees
WHERE hire_date >= '2023-01-01' AND hire_date < '2024-01-01';


-- BAD: Leading wildcard (can't use index)
SELECT * FROM products WHERE name LIKE '%phone%';

-- GOOD: Trailing wildcard (uses index)
SELECT * FROM products WHERE name LIKE 'phone%';


-- BAD: Implicit conversion (index might not be used)
SELECT * FROM employees WHERE emp_code = 123;  -- emp_code is VARCHAR

-- GOOD: Match data types
SELECT * FROM employees WHERE emp_code = '123';


-- BAD: OR can prevent index usage
SELECT * FROM employees WHERE dept_id = 1 OR dept_id = 2;

-- GOOD: Use IN instead
SELECT * FROM employees WHERE dept_id IN (1, 2);


-- BAD: Not using covering index
SELECT * FROM employees WHERE dept_id = 1;

-- GOOD: Select only indexed columns (index-only scan)
SELECT emp_id, dept_id FROM employees WHERE dept_id = 1;
```

---

## Chapter 12: Views & Materialized Views

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS - VIRTUAL TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- A VIEW is a saved query that acts like a table

-- Simple view
CREATE VIEW active_employees AS
SELECT emp_id, first_name, last_name, email, dept_id
FROM employees
WHERE is_active = TRUE;

-- Use view like a table
SELECT * FROM active_employees WHERE dept_id = 1;

-- View with JOIN
CREATE VIEW employee_details AS
SELECT
    e.emp_id,
    e.first_name,
    e.last_name,
    e.salary,
    d.dept_name,
    m.first_name AS manager_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- View with aggregation
CREATE VIEW department_summary AS
SELECT
    d.dept_id,
    d.dept_name,
    COUNT(e.emp_id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    SUM(e.salary) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_id, d.dept_name;

-- Modify view
CREATE OR REPLACE VIEW active_employees AS
SELECT emp_id, first_name, last_name, email, dept_id, hire_date
FROM employees
WHERE is_active = TRUE;

-- Drop view
DROP VIEW IF EXISTS active_employees;


-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATABLE VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Simple views can be updated (INSERT, UPDATE, DELETE)
CREATE VIEW engineering_employees AS
SELECT * FROM employees WHERE dept_id = 1;

-- Insert through view
INSERT INTO engineering_employees (first_name, last_name, email, dept_id)
VALUES ('New', 'Employee', 'new@company.com', 1);

-- Update through view
UPDATE engineering_employees SET salary = 90000 WHERE emp_id = 10;

-- WITH CHECK OPTION - prevent inserting rows that won't appear in view
CREATE VIEW engineering_employees AS
SELECT * FROM employees WHERE dept_id = 1
WITH CHECK OPTION;

-- This will fail (dept_id = 2 doesn't match view condition):
INSERT INTO engineering_employees (first_name, last_name, email, dept_id)
VALUES ('Wrong', 'Dept', 'wrong@company.com', 2);  -- Error!


-- ═══════════════════════════════════════════════════════════════════════════════
-- MATERIALIZED VIEWS (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Materialized view stores the result physically (like a cached table)

CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS order_count,
    SUM(total) AS total_revenue,
    AVG(total) AS avg_order_value
FROM orders
WHERE status = 'delivered'
GROUP BY DATE_TRUNC('month', order_date);

-- Query materialized view (fast - reads from stored data)
SELECT * FROM monthly_sales_summary WHERE month >= '2024-01-01';

-- Refresh materialized view (update stored data)
REFRESH MATERIALIZED VIEW monthly_sales_summary;

-- Refresh concurrently (allows reads during refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_summary;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS monthly_sales_summary;


-- MySQL doesn't have materialized views, but you can simulate:
-- 1. Create regular table
CREATE TABLE monthly_sales_summary (
    month DATE PRIMARY KEY,
    order_count INT,
    total_revenue DECIMAL(12,2),
    avg_order_value DECIMAL(10,2)
);

-- 2. Create procedure to refresh
DELIMITER //
CREATE PROCEDURE refresh_monthly_sales()
BEGIN
    TRUNCATE TABLE monthly_sales_summary;
    INSERT INTO monthly_sales_summary
    SELECT
        DATE_FORMAT(order_date, '%Y-%m-01') AS month,
        COUNT(*),
        SUM(total),
        AVG(total)
    FROM orders
    WHERE status = 'delivered'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m-01');
END //
DELIMITER ;

-- 3. Schedule refresh (using MySQL Event Scheduler)
CREATE EVENT refresh_sales_daily
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 00:00:00'
DO CALL refresh_monthly_sales();
```

---

## Chapter 13: Stored Procedures & Functions

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- STORED PROCEDURES - MySQL
-- ═══════════════════════════════════════════════════════════════════════════════

-- Change delimiter (needed for procedure body)
DELIMITER //

-- Simple procedure (no parameters)
CREATE PROCEDURE GetAllEmployees()
BEGIN
    SELECT * FROM employees WHERE is_active = TRUE;
END //

DELIMITER ;

-- Call procedure
CALL GetAllEmployees();


-- Procedure with IN parameters
DELIMITER //
CREATE PROCEDURE GetEmployeesByDept(IN p_dept_id INT)
BEGIN
    SELECT * FROM employees
    WHERE dept_id = p_dept_id AND is_active = TRUE;
END //
DELIMITER ;

CALL GetEmployeesByDept(1);


-- Procedure with OUT parameters
DELIMITER //
CREATE PROCEDURE GetDeptStats(
    IN p_dept_id INT,
    OUT p_count INT,
    OUT p_avg_salary DECIMAL(10,2)
)
BEGIN
    SELECT COUNT(*), AVG(salary)
    INTO p_count, p_avg_salary
    FROM employees
    WHERE dept_id = p_dept_id;
END //
DELIMITER ;

-- Call with OUT parameters
CALL GetDeptStats(1, @count, @avg_sal);
SELECT @count AS employee_count, @avg_sal AS avg_salary;


-- Procedure with INOUT parameters
DELIMITER //
CREATE PROCEDURE IncreaseSalary(INOUT p_salary DECIMAL(10,2), IN p_percent INT)
BEGIN
    SET p_salary = p_salary * (1 + p_percent / 100.0);
END //
DELIMITER ;

SET @sal = 50000;
CALL IncreaseSalary(@sal, 10);
SELECT @sal;  -- 55000


-- Complex procedure with control flow
DELIMITER //
CREATE PROCEDURE ProcessOrders()
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_total DECIMAL(12,2);
    DECLARE v_done INT DEFAULT FALSE;

    -- Cursor declaration
    DECLARE order_cursor CURSOR FOR
        SELECT order_id, total FROM orders WHERE status = 'pending';

    -- Handler for end of cursor
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    OPEN order_cursor;

    order_loop: LOOP
        FETCH order_cursor INTO v_order_id, v_total;

        IF v_done THEN
            LEAVE order_loop;
        END IF;

        -- Process order based on total
        IF v_total > 10000 THEN
            UPDATE orders SET priority = 'high' WHERE order_id = v_order_id;
        ELSEIF v_total > 5000 THEN
            UPDATE orders SET priority = 'medium' WHERE order_id = v_order_id;
        ELSE
            UPDATE orders SET priority = 'low' WHERE order_id = v_order_id;
        END IF;
    END LOOP;

    CLOSE order_cursor;
END //
DELIMITER ;


-- ═══════════════════════════════════════════════════════════════════════════════
-- USER-DEFINED FUNCTIONS (UDF)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Functions RETURN a value and can be used in SELECT statements

DELIMITER //
CREATE FUNCTION CalculateTax(amount DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE tax DECIMAL(10,2);
    SET tax = amount * 0.18;  -- 18% GST
    RETURN tax;
END //
DELIMITER ;

-- Use in SELECT
SELECT
    product_name,
    price,
    CalculateTax(price) AS tax,
    price + CalculateTax(price) AS total_price
FROM products;


-- Function with conditional logic
DELIMITER //
CREATE FUNCTION GetSalaryGrade(salary DECIMAL(10,2))
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE grade VARCHAR(20);

    IF salary >= 150000 THEN
        SET grade = 'Executive';
    ELSEIF salary >= 100000 THEN
        SET grade = 'Senior';
    ELSEIF salary >= 60000 THEN
        SET grade = 'Mid-Level';
    ELSE
        SET grade = 'Junior';
    END IF;

    RETURN grade;
END //
DELIMITER ;

SELECT first_name, salary, GetSalaryGrade(salary) AS grade FROM employees;


-- Drop procedure/function
DROP PROCEDURE IF EXISTS GetAllEmployees;
DROP FUNCTION IF EXISTS CalculateTax;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STORED PROCEDURES - PostgreSQL (PL/pgSQL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function (PostgreSQL uses functions, not procedures traditionally)
CREATE OR REPLACE FUNCTION get_employee_count(p_dept_id INT)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM employees
    WHERE dept_id = p_dept_id;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

SELECT get_employee_count(1);


-- Function returning a table
CREATE OR REPLACE FUNCTION get_employees_by_dept(p_dept_id INT)
RETURNS TABLE(emp_id INT, full_name TEXT, salary DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT e.emp_id, e.first_name || ' ' || e.last_name, e.salary
    FROM employees e
    WHERE e.dept_id = p_dept_id;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_employees_by_dept(1);


-- Procedure (PostgreSQL 11+)
CREATE OR REPLACE PROCEDURE transfer_employee(
    p_emp_id INT,
    p_new_dept_id INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE employees
    SET dept_id = p_new_dept_id
    WHERE emp_id = p_emp_id;

    INSERT INTO employee_transfers (emp_id, old_dept_id, new_dept_id, transfer_date)
    SELECT p_emp_id, dept_id, p_new_dept_id, CURRENT_DATE
    FROM employees WHERE emp_id = p_emp_id;

    COMMIT;
END;
$$;

CALL transfer_employee(5, 2);
```

---

## Chapter 14: Triggers

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS - AUTOMATIC ACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
Trigger = Code that automatically executes when a table event occurs

Trigger Types:
- BEFORE INSERT/UPDATE/DELETE: Executes before the operation
- AFTER INSERT/UPDATE/DELETE: Executes after the operation

Use Cases:
1. Audit logging (track changes)
2. Data validation
3. Automatic calculations
4. Enforcing business rules
5. Maintaining denormalized data
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- MySQL TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Audit table
CREATE TABLE employee_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    action VARCHAR(10),
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AFTER INSERT trigger
DELIMITER //
CREATE TRIGGER after_employee_insert
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit (emp_id, action, new_salary, changed_by)
    VALUES (NEW.emp_id, 'INSERT', NEW.salary, USER());
END //
DELIMITER ;

-- AFTER UPDATE trigger
DELIMITER //
CREATE TRIGGER after_employee_update
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    IF OLD.salary != NEW.salary THEN
        INSERT INTO employee_audit (emp_id, action, old_salary, new_salary, changed_by)
        VALUES (NEW.emp_id, 'UPDATE', OLD.salary, NEW.salary, USER());
    END IF;
END //
DELIMITER ;

-- BEFORE DELETE trigger
DELIMITER //
CREATE TRIGGER before_employee_delete
BEFORE DELETE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit (emp_id, action, old_salary, changed_by)
    VALUES (OLD.emp_id, 'DELETE', OLD.salary, USER());
END //
DELIMITER ;


-- BEFORE INSERT - Data validation
DELIMITER //
CREATE TRIGGER validate_employee_salary
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    IF NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary cannot be negative';
    END IF;

    IF NEW.salary > 1000000 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary exceeds maximum allowed';
    END IF;
END //
DELIMITER ;


-- Auto-update timestamp
DELIMITER //
CREATE TRIGGER update_employee_timestamp
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;


-- Maintain denormalized count
DELIMITER //
CREATE TRIGGER update_dept_count_insert
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    UPDATE departments
    SET employee_count = employee_count + 1
    WHERE dept_id = NEW.dept_id;
END //

CREATE TRIGGER update_dept_count_delete
AFTER DELETE ON employees
FOR EACH ROW
BEGIN
    UPDATE departments
    SET employee_count = employee_count - 1
    WHERE dept_id = OLD.dept_id;
END //
DELIMITER ;


-- View triggers
SHOW TRIGGERS;

-- Drop trigger
DROP TRIGGER IF EXISTS after_employee_insert;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PostgreSQL TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- PostgreSQL requires a trigger function first

-- Trigger function
CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_audit (emp_id, action, new_salary, changed_by)
        VALUES (NEW.emp_id, 'INSERT', NEW.salary, current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO employee_audit (emp_id, action, old_salary, new_salary, changed_by)
        VALUES (NEW.emp_id, 'UPDATE', OLD.salary, NEW.salary, current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO employee_audit (emp_id, action, old_salary, changed_by)
        VALUES (OLD.emp_id, 'DELETE', OLD.salary, current_user);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger using function
CREATE TRIGGER employee_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
EXECUTE FUNCTION log_employee_changes();

-- Drop trigger (PostgreSQL)
DROP TRIGGER IF EXISTS employee_audit_trigger ON employees;
```

---

## Chapter 15: Transactions & ACID Properties

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ACID PROPERTIES                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  A - ATOMICITY                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  "All or Nothing" - Transaction either completes fully or not at all       ││
│  │                                                                            ││
│  │  Transfer $100 from Account A to Account B:                                ││
│  │  1. Deduct $100 from A  ─┐                                                 ││
│  │  2. Add $100 to B       ─┴─ Both must succeed, or neither happens          ││
│  │                                                                            ││
│  │  If step 2 fails, step 1 is automatically rolled back!                     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  C - CONSISTENCY                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Database moves from one valid state to another valid state                ││
│  │  All constraints, triggers, and rules are maintained                       ││
│  │                                                                            ││
│  │  Before: Total money = $1000                                               ││
│  │  After:  Total money = $1000 (unchanged!)                                  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  I - ISOLATION                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Concurrent transactions don't interfere with each other                   ││
│  │  Each transaction sees database as if it's the only one running            ││
│  │                                                                            ││
│  │  Transaction 1: Reading balance                                            ││
│  │  Transaction 2: Updating balance                                           ││
│  │  → T1 sees either before or after T2, never partial update                 ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  D - DURABILITY                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Once committed, changes are permanent                                     ││
│  │  Data survives system crashes, power failures                              ││
│  │                                                                            ││
│  │  Achieved through: Write-ahead logging, disk writes, replication           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSACTIONS - EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Basic transaction
START TRANSACTION;  -- or BEGIN

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

COMMIT;  -- Make changes permanent
-- or ROLLBACK;  -- Undo all changes


-- Transaction with error handling (MySQL)
DELIMITER //
CREATE PROCEDURE transfer_funds(
    IN p_from_account INT,
    IN p_to_account INT,
    IN p_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_from_balance DECIMAL(10,2);

    -- Error handler - rollback on any error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;  -- Re-throw the error
    END;

    START TRANSACTION;

    -- Check sufficient funds
    SELECT balance INTO v_from_balance
    FROM accounts WHERE account_id = p_from_account FOR UPDATE;

    IF v_from_balance < p_amount THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient funds';
    END IF;

    -- Perform transfer
    UPDATE accounts SET balance = balance - p_amount WHERE account_id = p_from_account;
    UPDATE accounts SET balance = balance + p_amount WHERE account_id = p_to_account;

    -- Log the transaction
    INSERT INTO transactions (from_account, to_account, amount, transaction_date)
    VALUES (p_from_account, p_to_account, p_amount, NOW());

    COMMIT;
END //
DELIMITER ;


-- SAVEPOINT - Partial rollback
START TRANSACTION;

INSERT INTO orders (customer_id, total) VALUES (1, 100);
SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, qty) VALUES (LAST_INSERT_ID(), 1, 2);
SAVEPOINT items_added;

-- Oops, wrong item!
ROLLBACK TO SAVEPOINT items_added;

-- Try again
INSERT INTO order_items (order_id, product_id, qty) VALUES (LAST_INSERT_ID(), 2, 1);

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ISOLATION LEVELS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
Isolation Level        │ Dirty Read │ Non-Repeatable Read │ Phantom Read
───────────────────────┼────────────┼─────────────────────┼─────────────
READ UNCOMMITTED       │ Yes        │ Yes                 │ Yes
READ COMMITTED         │ No         │ Yes                 │ Yes
REPEATABLE READ        │ No         │ No                  │ Yes (MySQL: No)
SERIALIZABLE           │ No         │ No                  │ No

Dirty Read: Reading uncommitted changes from another transaction
Non-Repeatable Read: Same query returns different results in same transaction
Phantom Read: New rows appear that match a previous query condition
*/

-- Set isolation level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
-- Your queries here
COMMIT;

-- Session-level setting
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LOCKING
-- ═══════════════════════════════════════════════════════════════════════════════

-- SELECT with shared lock (read lock)
SELECT * FROM products WHERE product_id = 1 FOR SHARE;
-- Other transactions can read but not modify

-- SELECT with exclusive lock (write lock)
SELECT * FROM products WHERE product_id = 1 FOR UPDATE;
-- Other transactions can't read or modify

-- Skip locked rows (useful for job queues)
SELECT * FROM jobs WHERE status = 'pending'
LIMIT 1 FOR UPDATE SKIP LOCKED;

-- Explicit table lock (use carefully!)
LOCK TABLES employees WRITE;
-- Perform operations
UNLOCK TABLES;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DEADLOCK PREVENTION
-- ═══════════════════════════════════════════════════════════════════════════════

/*
Deadlock occurs when:
Transaction A: Locks row 1, waits for row 2
Transaction B: Locks row 2, waits for row 1

Prevention strategies:
1. Always acquire locks in same order
2. Keep transactions short
3. Use lock timeouts
4. Use lower isolation levels when possible
*/

-- Set lock timeout (MySQL)
SET innodb_lock_wait_timeout = 10;  -- 10 seconds

-- PostgreSQL
SET lock_timeout = '10s';
```

---

## 📝 PRACTICE EXERCISES - PART 3

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS - ADVANCED
-- ═══════════════════════════════════════════════════════════════════════════════

-- NORMALIZATION

-- 1. Identify which normal form this table violates and fix it:
--    CREATE TABLE orders (
--        order_id INT, customer_name VARCHAR(100), customer_email VARCHAR(100),
--        products VARCHAR(500), total DECIMAL(10,2)
--    );

-- 2. Split this 2NF table into 3NF:
--    order_items(order_id, product_id, product_name, product_category, qty)


-- INDEXES

-- 3. What indexes would you create for this query?
--    SELECT * FROM orders WHERE customer_id = ? AND order_date > ? ORDER BY total DESC

-- 4. Explain why this query might not use an index:
--    SELECT * FROM employees WHERE UPPER(last_name) = 'KUMAR'


-- VIEWS & PROCEDURES

-- 5. Create a view showing each product with its total sales quantity

-- 6. Create a stored procedure that gives raises to all employees in a department


-- TRIGGERS

-- 7. Create a trigger that prevents deleting orders with status 'shipped'

-- 8. Create an audit trigger for the products table


-- TRANSACTIONS

-- 9. Write a transaction that:
--    a) Creates an order
--    b) Adds items to the order
--    c) Updates product inventory
--    d) Rolls back everything if inventory is insufficient
```

---

_"Part 3 Complete! You now understand Normalization, Indexes, Views, Stored Procedures, Triggers, and Transactions."_

---

# 📘 PART 4: EXPERT - DATA ENGINEERING

---

## Chapter 16: Query Optimization & Execution Plans

### Query Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    QUERY OPTIMIZATION CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SELECT ONLY WHAT YOU NEED                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  BAD:  SELECT * FROM large_table WHERE id = 1;                             ││
│  │  GOOD: SELECT id, name, email FROM large_table WHERE id = 1;               ││
│  │                                                                            ││
│  │  Why: Less data transfer, possible covering index usage                    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  2. USE PROPER INDEXES                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Index columns in WHERE, JOIN, ORDER BY                                  ││
│  │  • Composite indexes for multi-column filters                              ││
│  │  • Covering indexes to avoid table lookups                                 ││
│  │  • But don't over-index (hurts writes)                                     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  3. AVOID FUNCTIONS ON INDEXED COLUMNS                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  BAD:  WHERE YEAR(created_at) = 2024                                       ││
│  │  GOOD: WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'      ││
│  │                                                                            ││
│  │  BAD:  WHERE LOWER(email) = 'test@example.com'                             ││
│  │  GOOD: Create functional index or store lowercase version                  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  4. USE JOINS INSTEAD OF SUBQUERIES (when possible)                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  BAD:  WHERE id IN (SELECT id FROM other_table WHERE ...)                  ││
│  │  GOOD: JOIN other_table ON ... WHERE ...                                   ││
│  │                                                                            ││
│  │  (Modern optimizers often rewrite, but explicit JOINs are clearer)         ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  5. LIMIT EARLY                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • Use LIMIT to reduce result set                                          ││
│  │  • Filter in subqueries before joins                                       ││
│  │  • Use EXISTS instead of COUNT(*) for existence checks                     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  6. BATCH OPERATIONS                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  • INSERT multiple rows in single statement                                ││
│  │  • DELETE/UPDATE in batches with LIMIT                                     ││
│  │  • Use transactions for related operations                                 ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- EXAMPLE 1: Avoid SELECT *
-- BAD
SELECT * FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.customer_id = 123;

-- GOOD
SELECT o.order_id, o.order_date, o.total, oi.product_id, oi.quantity
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.customer_id = 123;


-- EXAMPLE 2: Optimize EXISTS vs IN vs JOIN
-- For checking existence (best)
SELECT c.* FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- For getting matching records
SELECT DISTINCT c.* FROM customers c
JOIN orders o ON o.customer_id = c.customer_id;

-- IN works well for small lists
SELECT * FROM products WHERE category_id IN (1, 2, 3);


-- EXAMPLE 3: Optimize COUNT
-- BAD - counts all rows then compares
SELECT * FROM orders WHERE (SELECT COUNT(*) FROM order_items WHERE order_id = orders.order_id) > 5;

-- GOOD - stops at 6
SELECT * FROM orders o
WHERE EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.order_id
    GROUP BY oi.order_id
    HAVING COUNT(*) > 5
);


-- EXAMPLE 4: Optimize OR conditions
-- BAD (may not use index efficiently)
SELECT * FROM products WHERE category_id = 1 OR category_id = 2 OR price < 100;

-- GOOD (can use indexes)
SELECT * FROM products WHERE category_id IN (1, 2)
UNION ALL
SELECT * FROM products WHERE category_id NOT IN (1, 2) AND price < 100;


-- EXAMPLE 5: Pre-filter before JOIN
-- BAD
SELECT c.name, o.order_date, o.total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01' AND c.country = 'India';

-- GOOD (filter first, then join)
SELECT c.name, o.order_date, o.total
FROM (SELECT * FROM customers WHERE country = 'India') c
JOIN (SELECT * FROM orders WHERE order_date >= '2024-01-01') o
ON c.customer_id = o.customer_id;


-- EXAMPLE 6: Pagination optimization
-- BAD for large offsets
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 100000;  -- Slow!

-- GOOD - use keyset pagination
SELECT * FROM products
WHERE product_id > 100000  -- Last seen ID
ORDER BY product_id
LIMIT 10;


-- EXAMPLE 7: Batch inserts
-- BAD (100 separate inserts)
INSERT INTO logs (message) VALUES ('Log 1');
INSERT INTO logs (message) VALUES ('Log 2');
-- ... 98 more

-- GOOD (single insert)
INSERT INTO logs (message) VALUES
    ('Log 1'), ('Log 2'), ('Log 3'), ... , ('Log 100');


-- EXAMPLE 8: Batch deletes
-- BAD (locks table for long time)
DELETE FROM old_logs WHERE created_at < '2023-01-01';  -- Millions of rows!

-- GOOD (delete in batches)
REPEAT
    DELETE FROM old_logs
    WHERE created_at < '2023-01-01'
    LIMIT 10000;
UNTIL ROW_COUNT() = 0 END REPEAT;


-- ═══════════════════════════════════════════════════════════════════════════════
-- READING EXECUTION PLANS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get execution plan
EXPLAIN ANALYZE
SELECT e.*, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.salary > 80000;

/*
EXPLAIN Output Interpretation:

┌─────────────────────────────────────────────────────────────────────────────┐
│ id │ select_type │ table │ type   │ key          │ rows │ Extra           │
├────┼─────────────┼───────┼────────┼──────────────┼──────┼─────────────────┤
│ 1  │ SIMPLE      │ e     │ range  │ idx_salary   │ 50   │ Using where     │
│ 1  │ SIMPLE      │ d     │ eq_ref │ PRIMARY      │ 1    │ NULL            │
└─────────────────────────────────────────────────────────────────────────────┘

Reading this:
1. Query ID 1, simple query (no subqueries)
2. Table 'e' (employees):
   - type=range: Using index range scan (good!)
   - key=idx_salary: Using our salary index
   - rows=50: Estimated 50 rows to examine
   - Extra=Using where: Additional filtering
3. Table 'd' (departments):
   - type=eq_ref: Unique index lookup (best for joins!)
   - key=PRIMARY: Using primary key
   - rows=1: One lookup per employee (as expected)

Key Metrics:
- Total rows examined: 50 * 1 = 50 (good!)
- Access types (best to worst):
  const > eq_ref > ref > range > index > ALL
*/

-- PostgreSQL: More detailed output
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM employees WHERE dept_id = 1;
```

---

## Chapter 17: Analytics & Reporting Patterns

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMON ANALYTICS PATTERNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TIME-SERIES ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Daily sales
SELECT
    DATE(order_date) AS date,
    COUNT(*) AS order_count,
    SUM(total) AS revenue
FROM orders
WHERE order_date >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(order_date)
ORDER BY date;

-- Weekly aggregation
SELECT
    YEARWEEK(order_date, 1) AS year_week,
    COUNT(*) AS orders,
    SUM(total) AS revenue
FROM orders
GROUP BY YEARWEEK(order_date, 1);

-- Monthly with year-over-year comparison
WITH monthly_revenue AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE status = 'delivered'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT
    m1.month,
    m1.revenue AS current_revenue,
    m2.revenue AS last_year_revenue,
    ROUND((m1.revenue - m2.revenue) / m2.revenue * 100, 2) AS yoy_growth_pct
FROM monthly_revenue m1
LEFT JOIN monthly_revenue m2
    ON DATE_ADD(STR_TO_DATE(CONCAT(m2.month, '-01'), '%Y-%m-%d'), INTERVAL 1 YEAR) =
       STR_TO_DATE(CONCAT(m1.month, '-01'), '%Y-%m-%d')
ORDER BY m1.month DESC;

-- Fill missing dates (calendar table approach)
WITH RECURSIVE date_range AS (
    SELECT DATE('2024-01-01') AS date
    UNION ALL
    SELECT DATE_ADD(date, INTERVAL 1 DAY)
    FROM date_range
    WHERE date < '2024-12-31'
)
SELECT
    dr.date,
    COALESCE(COUNT(o.order_id), 0) AS order_count,
    COALESCE(SUM(o.total), 0) AS revenue
FROM date_range dr
LEFT JOIN orders o ON DATE(o.order_date) = dr.date
GROUP BY dr.date
ORDER BY dr.date;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. COHORT ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Customer retention by signup cohort
WITH customer_cohorts AS (
    SELECT
        customer_id,
        DATE_FORMAT(MIN(order_date), '%Y-%m') AS cohort_month
    FROM orders
    GROUP BY customer_id
),
customer_activity AS (
    SELECT
        cc.cohort_month,
        DATE_FORMAT(o.order_date, '%Y-%m') AS activity_month,
        COUNT(DISTINCT o.customer_id) AS active_customers
    FROM customer_cohorts cc
    JOIN orders o ON cc.customer_id = o.customer_id
    GROUP BY cc.cohort_month, DATE_FORMAT(o.order_date, '%Y-%m')
)
SELECT
    cohort_month,
    activity_month,
    TIMESTAMPDIFF(MONTH,
        STR_TO_DATE(CONCAT(cohort_month, '-01'), '%Y-%m-%d'),
        STR_TO_DATE(CONCAT(activity_month, '-01'), '%Y-%m-%d')
    ) AS months_since_cohort,
    active_customers
FROM customer_activity
ORDER BY cohort_month, activity_month;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. FUNNEL ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- E-commerce conversion funnel
SELECT
    'Visitors' AS stage,
    COUNT(DISTINCT session_id) AS count,
    100.0 AS percentage
FROM sessions
WHERE date >= '2024-01-01'

UNION ALL

SELECT
    'Product Views' AS stage,
    COUNT(DISTINCT session_id),
    ROUND(COUNT(DISTINCT session_id) * 100.0 /
          (SELECT COUNT(DISTINCT session_id) FROM sessions WHERE date >= '2024-01-01'), 2)
FROM product_views
WHERE date >= '2024-01-01'

UNION ALL

SELECT
    'Add to Cart' AS stage,
    COUNT(DISTINCT session_id),
    ROUND(COUNT(DISTINCT session_id) * 100.0 /
          (SELECT COUNT(DISTINCT session_id) FROM sessions WHERE date >= '2024-01-01'), 2)
FROM cart_adds
WHERE date >= '2024-01-01'

UNION ALL

SELECT
    'Checkout Started' AS stage,
    COUNT(DISTINCT session_id),
    ROUND(COUNT(DISTINCT session_id) * 100.0 /
          (SELECT COUNT(DISTINCT session_id) FROM sessions WHERE date >= '2024-01-01'), 2)
FROM checkout_starts
WHERE date >= '2024-01-01'

UNION ALL

SELECT
    'Purchase Completed' AS stage,
    COUNT(DISTINCT session_id),
    ROUND(COUNT(DISTINCT session_id) * 100.0 /
          (SELECT COUNT(DISTINCT session_id) FROM sessions WHERE date >= '2024-01-01'), 2)
FROM orders
WHERE order_date >= '2024-01-01';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. RFM ANALYSIS (Recency, Frequency, Monetary)
-- ═══════════════════════════════════════════════════════════════════════════════

WITH customer_rfm AS (
    SELECT
        customer_id,
        DATEDIFF(CURDATE(), MAX(order_date)) AS recency_days,
        COUNT(*) AS frequency,
        SUM(total) AS monetary
    FROM orders
    WHERE status = 'delivered'
    GROUP BY customer_id
),
rfm_scores AS (
    SELECT
        customer_id,
        recency_days,
        frequency,
        monetary,
        NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,  -- Lower recency = higher score
        NTILE(5) OVER (ORDER BY frequency) AS f_score,
        NTILE(5) OVER (ORDER BY monetary) AS m_score
    FROM customer_rfm
)
SELECT
    customer_id,
    recency_days,
    frequency,
    monetary,
    CONCAT(r_score, f_score, m_score) AS rfm_score,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 3 AND f_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score <= 2 THEN 'New Customers'
        WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
        ELSE 'Others'
    END AS customer_segment
FROM rfm_scores;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. MARKET BASKET ANALYSIS (Products bought together)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find products frequently bought together
SELECT
    oi1.product_id AS product_a,
    p1.name AS product_a_name,
    oi2.product_id AS product_b,
    p2.name AS product_b_name,
    COUNT(*) AS times_bought_together
FROM order_items oi1
JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
JOIN products p1 ON oi1.product_id = p1.product_id
JOIN products p2 ON oi2.product_id = p2.product_id
GROUP BY oi1.product_id, oi2.product_id, p1.name, p2.name
HAVING COUNT(*) >= 10
ORDER BY times_bought_together DESC
LIMIT 20;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. MOVING CALCULATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 7-day moving average
SELECT
    date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM (
    SELECT
        DATE(order_date) AS date,
        SUM(total) AS daily_revenue
    FROM orders
    GROUP BY DATE(order_date)
) daily;

-- Cumulative sum (running total)
SELECT
    DATE(order_date) AS date,
    SUM(total) AS daily_revenue,
    SUM(SUM(total)) OVER (ORDER BY DATE(order_date)) AS cumulative_revenue
FROM orders
GROUP BY DATE(order_date);

-- Month-to-date (MTD) running total
SELECT
    order_date,
    total,
    SUM(total) OVER (
        PARTITION BY YEAR(order_date), MONTH(order_date)
        ORDER BY order_date
    ) AS mtd_revenue
FROM orders;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. PERCENTILES & DISTRIBUTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Order value percentiles
SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total) AS median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total) AS p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total) AS p90,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total) AS p99
FROM orders;

-- MySQL alternative (using variables)
SET @rowindex := -1;
SELECT AVG(total) AS median
FROM (
    SELECT @rowindex := @rowindex + 1 AS rowindex, total
    FROM orders
    ORDER BY total
) t
WHERE rowindex IN (FLOOR(@rowindex / 2), CEIL(@rowindex / 2));

-- Value distribution buckets
SELECT
    CASE
        WHEN total < 100 THEN '< ₹100'
        WHEN total < 500 THEN '₹100-500'
        WHEN total < 1000 THEN '₹500-1000'
        WHEN total < 5000 THEN '₹1000-5000'
        ELSE '₹5000+'
    END AS order_bucket,
    COUNT(*) AS order_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM orders
GROUP BY 1
ORDER BY MIN(total);
```

---

## Chapter 18: Data Warehousing Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA WAREHOUSE vs OLTP DATABASE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  OLTP (Online Transaction Processing)    │  OLAP (Online Analytical Processing) │
│  ─────────────────────────────────────   │  ──────────────────────────────────  │
│  • Operational database                  │  • Data Warehouse / Data Mart        │
│  • Current data                          │  • Historical data                   │
│  • Normalized (3NF)                      │  • Denormalized (Star/Snowflake)     │
│  • Many small transactions               │  • Few large queries                 │
│  • INSERT, UPDATE, DELETE heavy          │  • SELECT heavy (read-mostly)        │
│  • Millisecond response                  │  • Seconds to minutes response       │
│  • GB to TB                              │  • TB to PB                          │
│  • MySQL, PostgreSQL, SQL Server         │  • Snowflake, Redshift, BigQuery     │
│                                                                                  │
│                                                                                  │
│  DIMENSIONAL MODELING:                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │            ┌─────────────────┐                                             ││
│  │            │   dim_product   │                                             ││
│  │            │   (Dimension)   │                                             ││
│  │            └────────┬────────┘                                             ││
│  │                     │                                                      ││
│  │  ┌─────────────┐    │    ┌─────────────┐                                  ││
│  │  │ dim_customer│────┼────│  dim_date   │                                  ││
│  │  │ (Dimension) │    │    │ (Dimension) │                                  ││
│  │  └─────────────┘    │    └─────────────┘                                  ││
│  │                     │                                                      ││
│  │            ┌────────▼────────┐                                             ││
│  │            │   fact_sales    │ ← Contains measures (amount, qty, etc.)    ││
│  │            │    (Fact)       │   and foreign keys to dimensions            ││
│  │            └─────────────────┘                                             ││
│  │                                                                            ││
│  │  STAR SCHEMA: Fact table in center, dimensions around it                   ││
│  │  SNOWFLAKE SCHEMA: Dimensions normalized into sub-dimensions               ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- DIMENSIONAL MODELING - STAR SCHEMA EXAMPLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- DIMENSION TABLES (Descriptive data)

-- Date dimension (pre-populated calendar table)
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,              -- YYYYMMDD format
    full_date DATE NOT NULL,
    day_of_week TINYINT,                   -- 1-7
    day_name VARCHAR(10),                  -- Monday, Tuesday...
    day_of_month TINYINT,
    day_of_year SMALLINT,
    week_of_year TINYINT,
    month_num TINYINT,
    month_name VARCHAR(10),
    quarter TINYINT,
    year SMALLINT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    fiscal_year SMALLINT,
    fiscal_quarter TINYINT
);

-- Customer dimension
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,                        -- Natural key from source
    customer_name VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    segment VARCHAR(50),                    -- B2B, B2C, Enterprise
    -- SCD Type 2 fields
    effective_date DATE,
    expiry_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);

-- Product dimension
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    sku VARCHAR(50),
    product_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier VARCHAR(200),
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    -- SCD Type 2 fields
    effective_date DATE,
    expiry_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);

-- Store/Location dimension
CREATE TABLE dim_store (
    store_key INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT,
    store_name VARCHAR(200),
    store_type VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    region VARCHAR(100),
    manager_name VARCHAR(200),
    open_date DATE,
    close_date DATE
);


-- FACT TABLE (Transactional data with measures)
CREATE TABLE fact_sales (
    sale_key BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Foreign keys to dimensions
    date_key INT,
    customer_key INT,
    product_key INT,
    store_key INT,

    -- Degenerate dimension (order number)
    order_number VARCHAR(50),

    -- Measures
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    cost_amount DECIMAL(10,2),
    profit_amount DECIMAL(10,2),

    -- Foreign key constraints
    FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
    FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key),
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (store_key) REFERENCES dim_store(store_key),

    -- Indexes for common queries
    INDEX idx_date (date_key),
    INDEX idx_customer (customer_key),
    INDEX idx_product (product_key),
    INDEX idx_store (store_key)
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERYING THE STAR SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sales by product category and month
SELECT
    dd.year,
    dd.month_name,
    dp.category,
    SUM(fs.quantity) AS total_units,
    SUM(fs.total_amount) AS total_revenue,
    SUM(fs.profit_amount) AS total_profit
FROM fact_sales fs
JOIN dim_date dd ON fs.date_key = dd.date_key
JOIN dim_product dp ON fs.product_key = dp.product_key
WHERE dd.year = 2024
GROUP BY dd.year, dd.month_num, dd.month_name, dp.category
ORDER BY dd.month_num, total_revenue DESC;

-- Customer segment analysis
SELECT
    dc.segment,
    dc.country,
    COUNT(DISTINCT dc.customer_key) AS customer_count,
    COUNT(*) AS transaction_count,
    SUM(fs.total_amount) AS total_revenue,
    AVG(fs.total_amount) AS avg_order_value
FROM fact_sales fs
JOIN dim_customer dc ON fs.customer_key = dc.customer_key
WHERE dc.is_current = TRUE
GROUP BY dc.segment, dc.country
ORDER BY total_revenue DESC;

-- Store performance comparison
SELECT
    ds.store_name,
    ds.city,
    ds.region,
    SUM(fs.total_amount) AS revenue,
    SUM(fs.profit_amount) AS profit,
    ROUND(SUM(fs.profit_amount) / NULLIF(SUM(fs.total_amount), 0) * 100, 2) AS profit_margin
FROM fact_sales fs
JOIN dim_store ds ON fs.store_key = ds.store_key
JOIN dim_date dd ON fs.date_key = dd.date_key
WHERE dd.year = 2024 AND dd.quarter = 1
GROUP BY ds.store_key, ds.store_name, ds.city, ds.region
ORDER BY revenue DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SLOWLY CHANGING DIMENSIONS (SCD)
-- ═══════════════════════════════════════════════════════════════════════════════

/*
SCD Type 0: Retain Original (no changes)
SCD Type 1: Overwrite (lose history)
SCD Type 2: Add new row (track history) ← Most common
SCD Type 3: Add new column (limited history)
*/

-- SCD Type 2 implementation
-- When customer address changes:

-- Step 1: Close the current record
UPDATE dim_customer
SET expiry_date = CURRENT_DATE - INTERVAL 1 DAY,
    is_current = FALSE
WHERE customer_id = 123 AND is_current = TRUE;

-- Step 2: Insert new record
INSERT INTO dim_customer (
    customer_id, customer_name, email, address, city, state, country,
    segment, effective_date, expiry_date, is_current
)
VALUES (
    123, 'John Doe', 'john@email.com', 'New Address', 'New City', 'State', 'Country',
    'B2C', CURRENT_DATE, '9999-12-31', TRUE
);


-- Query with SCD Type 2 - Get customer at specific point in time
SELECT dc.*, fs.total_amount
FROM fact_sales fs
JOIN dim_date dd ON fs.date_key = dd.date_key
JOIN dim_customer dc ON fs.customer_key = dc.customer_key
    AND dd.full_date BETWEEN dc.effective_date AND dc.expiry_date
WHERE dd.full_date = '2024-06-15';
```

---

## Chapter 19: ETL Patterns in SQL

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ETL (Extract, Transform, Load) PATTERNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. EXTRACT - Getting data from source
-- ═══════════════════════════════════════════════════════════════════════════════

-- Incremental extract (only new/changed records)
-- Using timestamp
SELECT * FROM source_orders
WHERE modified_at > @last_extract_timestamp;

-- Using CDC (Change Data Capture) - conceptual
SELECT * FROM source_orders_cdc
WHERE operation IN ('INSERT', 'UPDATE')
  AND capture_time > @last_extract_time;

-- Full extract with delta detection
SELECT s.*
FROM source_products s
LEFT JOIN staging_products t ON s.product_id = t.product_id
WHERE t.product_id IS NULL  -- New records
   OR s.checksum != t.checksum;  -- Changed records


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TRANSFORM - Cleaning and transforming data
-- ═══════════════════════════════════════════════════════════════════════════════

-- Data cleaning in staging area
CREATE TABLE staging_customers AS
SELECT
    customer_id,
    -- Trim whitespace
    TRIM(first_name) AS first_name,
    TRIM(last_name) AS last_name,
    -- Standardize email
    LOWER(TRIM(email)) AS email,
    -- Standardize phone (remove non-digits)
    REGEXP_REPLACE(phone, '[^0-9]', '') AS phone,
    -- Handle nulls
    COALESCE(country, 'Unknown') AS country,
    -- Parse dates
    STR_TO_DATE(birth_date, '%d/%m/%Y') AS birth_date,
    -- Derive fields
    TIMESTAMPDIFF(YEAR, STR_TO_DATE(birth_date, '%d/%m/%Y'), CURDATE()) AS age,
    -- Create surrogate key
    MD5(CONCAT(customer_id, '-', source_system)) AS customer_hash
FROM raw_customers
WHERE email IS NOT NULL AND email != '';

-- Data validation queries
-- Find invalid emails
SELECT * FROM staging_customers
WHERE email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Find duplicates
SELECT email, COUNT(*)
FROM staging_customers
GROUP BY email
HAVING COUNT(*) > 1;

-- Data deduplication
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY modified_at DESC) AS rn
    FROM staging_customers
)
DELETE FROM staging_customers
WHERE customer_id IN (SELECT customer_id FROM ranked WHERE rn > 1);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. LOAD - Loading into target tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- UPSERT pattern (MySQL)
INSERT INTO dim_customer (customer_id, customer_name, email, segment, effective_date)
SELECT customer_id, CONCAT(first_name, ' ', last_name), email, segment, CURRENT_DATE
FROM staging_customers s
ON DUPLICATE KEY UPDATE
    customer_name = VALUES(customer_name),
    email = VALUES(email),
    segment = VALUES(segment);

-- MERGE (PostgreSQL, SQL Server)
MERGE INTO dim_customer AS target
USING staging_customers AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
    UPDATE SET
        customer_name = source.customer_name,
        email = source.email,
        modified_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (customer_id, customer_name, email, created_at)
    VALUES (source.customer_id, source.customer_name, source.email, CURRENT_TIMESTAMP);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. COMPLETE ETL PIPELINE EXAMPLE
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //
CREATE PROCEDURE run_daily_etl()
BEGIN
    DECLARE v_batch_id INT;
    DECLARE v_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    DECLARE v_records_processed INT DEFAULT 0;

    -- Error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        UPDATE etl_log SET status = 'FAILED', error_message = 'ETL failed'
        WHERE batch_id = v_batch_id;
        RESIGNAL;
    END;

    -- Log start
    INSERT INTO etl_log (start_time, status) VALUES (v_start_time, 'RUNNING');
    SET v_batch_id = LAST_INSERT_ID();

    START TRANSACTION;

    -- EXTRACT: Load to staging
    TRUNCATE TABLE staging_orders;
    INSERT INTO staging_orders
    SELECT * FROM source_orders
    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY);

    SET v_records_processed = ROW_COUNT();

    -- TRANSFORM: Clean data
    UPDATE staging_orders
    SET customer_name = TRIM(customer_name),
        email = LOWER(email),
        total = ROUND(total, 2);

    -- Validate
    DELETE FROM staging_orders WHERE email IS NULL OR total <= 0;

    -- LOAD: Fact table
    INSERT INTO fact_daily_orders (date_key, customer_key, product_key, quantity, amount)
    SELECT
        CAST(DATE_FORMAT(so.order_date, '%Y%m%d') AS UNSIGNED),
        dc.customer_key,
        dp.product_key,
        so.quantity,
        so.total
    FROM staging_orders so
    JOIN dim_customer dc ON so.email = dc.email AND dc.is_current = TRUE
    JOIN dim_product dp ON so.product_id = dp.product_id AND dp.is_current = TRUE;

    COMMIT;

    -- Log completion
    UPDATE etl_log
    SET end_time = CURRENT_TIMESTAMP,
        status = 'SUCCESS',
        records_processed = v_records_processed
    WHERE batch_id = v_batch_id;

END //
DELIMITER ;

-- Schedule ETL (MySQL Event)
CREATE EVENT daily_etl_job
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO CALL run_daily_etl();
```

---

## Chapter 20: Real-World Case Studies

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CASE STUDY 1: E-COMMERCE ANALYTICS DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════════

-- KPI Dashboard Query
WITH daily_metrics AS (
    SELECT
        DATE(order_date) AS date,
        COUNT(*) AS orders,
        COUNT(DISTINCT customer_id) AS unique_customers,
        SUM(total) AS revenue,
        AVG(total) AS aov
    FROM orders
    WHERE order_date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY DATE(order_date)
),
previous_period AS (
    SELECT
        DATE(order_date) AS date,
        SUM(total) AS revenue
    FROM orders
    WHERE order_date >= CURDATE() - INTERVAL 60 DAY
      AND order_date < CURDATE() - INTERVAL 30 DAY
    GROUP BY DATE(order_date)
)
SELECT
    dm.date,
    dm.orders,
    dm.unique_customers,
    dm.revenue,
    ROUND(dm.aov, 2) AS aov,
    -- Day over day change
    dm.revenue - LAG(dm.revenue) OVER (ORDER BY dm.date) AS dod_change,
    -- 7-day moving average
    ROUND(AVG(dm.revenue) OVER (
        ORDER BY dm.date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS revenue_ma7
FROM daily_metrics dm
ORDER BY dm.date DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CASE STUDY 2: USER ENGAGEMENT ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
WITH user_activity AS (
    SELECT
        user_id,
        DATE(event_time) AS activity_date
    FROM user_events
    WHERE event_time >= CURDATE() - INTERVAL 30 DAY
    GROUP BY user_id, DATE(event_time)
)
SELECT
    CURDATE() AS report_date,
    -- DAU
    COUNT(DISTINCT CASE WHEN activity_date = CURDATE() THEN user_id END) AS dau,
    -- WAU (last 7 days)
    COUNT(DISTINCT CASE WHEN activity_date >= CURDATE() - INTERVAL 6 DAY THEN user_id END) AS wau,
    -- MAU (last 30 days)
    COUNT(DISTINCT user_id) AS mau,
    -- Stickiness (DAU/MAU)
    ROUND(COUNT(DISTINCT CASE WHEN activity_date = CURDATE() THEN user_id END) * 100.0 /
          NULLIF(COUNT(DISTINCT user_id), 0), 2) AS stickiness_pct
FROM user_activity;


-- User retention analysis
WITH first_activity AS (
    SELECT
        user_id,
        MIN(DATE(event_time)) AS first_date
    FROM user_events
    GROUP BY user_id
),
retention AS (
    SELECT
        fa.first_date AS cohort_date,
        DATEDIFF(DATE(ue.event_time), fa.first_date) AS day_number,
        COUNT(DISTINCT fa.user_id) AS users
    FROM first_activity fa
    LEFT JOIN user_events ue ON fa.user_id = ue.user_id
    WHERE fa.first_date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY fa.first_date, DATEDIFF(DATE(ue.event_time), fa.first_date)
)
SELECT
    cohort_date,
    MAX(CASE WHEN day_number = 0 THEN users END) AS day_0,
    MAX(CASE WHEN day_number = 1 THEN users END) AS day_1,
    MAX(CASE WHEN day_number = 7 THEN users END) AS day_7,
    MAX(CASE WHEN day_number = 14 THEN users END) AS day_14,
    MAX(CASE WHEN day_number = 30 THEN users END) AS day_30
FROM retention
GROUP BY cohort_date
ORDER BY cohort_date;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CASE STUDY 3: FINANCIAL REPORTING
-- ═══════════════════════════════════════════════════════════════════════════════

-- Monthly P&L Statement
SELECT
    DATE_FORMAT(transaction_date, '%Y-%m') AS month,

    -- Revenue
    SUM(CASE WHEN account_type = 'Revenue' THEN amount ELSE 0 END) AS total_revenue,

    -- Cost of Goods Sold
    SUM(CASE WHEN account_type = 'COGS' THEN amount ELSE 0 END) AS cogs,

    -- Gross Profit
    SUM(CASE WHEN account_type = 'Revenue' THEN amount ELSE 0 END) -
    SUM(CASE WHEN account_type = 'COGS' THEN amount ELSE 0 END) AS gross_profit,

    -- Operating Expenses
    SUM(CASE WHEN account_type = 'OpEx' THEN amount ELSE 0 END) AS operating_expenses,

    -- Operating Income
    SUM(CASE WHEN account_type = 'Revenue' THEN amount ELSE 0 END) -
    SUM(CASE WHEN account_type = 'COGS' THEN amount ELSE 0 END) -
    SUM(CASE WHEN account_type = 'OpEx' THEN amount ELSE 0 END) AS operating_income,

    -- Net Income
    SUM(CASE
        WHEN account_type = 'Revenue' THEN amount
        WHEN account_type IN ('COGS', 'OpEx', 'Tax') THEN -amount
        ELSE 0
    END) AS net_income

FROM journal_entries
WHERE transaction_date >= '2024-01-01'
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
ORDER BY month;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CASE STUDY 4: SUPPLY CHAIN ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Inventory turnover and days of inventory
WITH inventory_metrics AS (
    SELECT
        p.product_id,
        p.name AS product_name,
        p.category,
        i.current_quantity,
        i.unit_cost,
        i.current_quantity * i.unit_cost AS inventory_value,
        COALESCE(SUM(oi.quantity), 0) AS total_sold_30d
    FROM products p
    JOIN inventory i ON p.product_id = i.product_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
        AND oi.created_at >= CURDATE() - INTERVAL 30 DAY
    GROUP BY p.product_id, p.name, p.category, i.current_quantity, i.unit_cost
)
SELECT
    product_id,
    product_name,
    category,
    current_quantity,
    inventory_value,
    total_sold_30d,
    -- Daily sales velocity
    ROUND(total_sold_30d / 30.0, 2) AS daily_velocity,
    -- Days of inventory remaining
    CASE
        WHEN total_sold_30d > 0 THEN ROUND(current_quantity / (total_sold_30d / 30.0), 0)
        ELSE 999
    END AS days_of_inventory,
    -- Inventory status
    CASE
        WHEN current_quantity = 0 THEN 'Out of Stock'
        WHEN current_quantity < total_sold_30d / 30 * 7 THEN 'Low Stock'
        WHEN current_quantity > total_sold_30d / 30 * 90 THEN 'Overstock'
        ELSE 'Healthy'
    END AS inventory_status
FROM inventory_metrics
ORDER BY days_of_inventory ASC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CASE STUDY 5: CUSTOMER CHURN PREDICTION DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Feature engineering for ML model
SELECT
    c.customer_id,
    c.segment,
    c.tenure_days,

    -- Recency
    DATEDIFF(CURDATE(), MAX(o.order_date)) AS days_since_last_order,

    -- Frequency
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.order_id) / NULLIF(c.tenure_days / 30.0, 0) AS orders_per_month,

    -- Monetary
    SUM(o.total) AS total_spend,
    AVG(o.total) AS avg_order_value,

    -- Engagement
    COUNT(DISTINCT CASE WHEN o.order_date >= CURDATE() - INTERVAL 30 DAY
                        THEN o.order_id END) AS orders_last_30d,
    COUNT(DISTINCT CASE WHEN o.order_date >= CURDATE() - INTERVAL 90 DAY
                        THEN o.order_id END) AS orders_last_90d,

    -- Trend
    SUM(CASE WHEN o.order_date >= CURDATE() - INTERVAL 30 DAY THEN o.total ELSE 0 END) -
    SUM(CASE WHEN o.order_date >= CURDATE() - INTERVAL 60 DAY
             AND o.order_date < CURDATE() - INTERVAL 30 DAY THEN o.total ELSE 0 END) AS spend_trend,

    -- Support interactions
    COUNT(DISTINCT t.ticket_id) AS support_tickets,
    AVG(t.satisfaction_score) AS avg_satisfaction,

    -- Label (target variable)
    CASE WHEN MAX(o.order_date) < CURDATE() - INTERVAL 90 DAY THEN 1 ELSE 0 END AS is_churned

FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN support_tickets t ON c.customer_id = t.customer_id
WHERE c.created_at < CURDATE() - INTERVAL 180 DAY  -- Mature customers only
GROUP BY c.customer_id, c.segment, c.tenure_days;
```

---

_"Part 4 Complete! You now understand Query Optimization, Analytics Patterns, Data Warehousing, and ETL."_

---

# 📙 PART 5: PRACTICE & PROJECTS

---

## Chapter 21: 100 Practice Problems

### EASY Level (1-30)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- EASY PROBLEMS (1-30)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Use these tables for practice:
-- employees(emp_id, first_name, last_name, email, dept_id, salary, hire_date, manager_id)
-- departments(dept_id, dept_name, location)
-- products(product_id, name, category, price, stock_quantity)
-- orders(order_id, customer_id, order_date, total, status)
-- customers(customer_id, name, email, city, country)

-- 1. Select all employees
SELECT * FROM employees;

-- 2. Select employees with salary > 50000
SELECT * FROM employees WHERE salary > 50000;

-- 3. Find employees in department 1
SELECT * FROM employees WHERE dept_id = 1;

-- 4. List unique departments from employees
SELECT DISTINCT dept_id FROM employees;

-- 5. Count total employees
SELECT COUNT(*) AS total_employees FROM employees;

-- 6. Find average salary
SELECT AVG(salary) AS avg_salary FROM employees;

-- 7. Find highest and lowest salary
SELECT MAX(salary) AS highest, MIN(salary) AS lowest FROM employees;

-- 8. Select employees ordered by salary descending
SELECT * FROM employees ORDER BY salary DESC;

-- 9. Get top 5 highest paid employees
SELECT * FROM employees ORDER BY salary DESC LIMIT 5;

-- 10. Find employees whose name starts with 'A'
SELECT * FROM employees WHERE first_name LIKE 'A%';

-- 11. Find employees hired in 2023
SELECT * FROM employees WHERE YEAR(hire_date) = 2023;

-- 12. Count employees per department
SELECT dept_id, COUNT(*) AS emp_count FROM employees GROUP BY dept_id;

-- 13. Find departments with more than 5 employees
SELECT dept_id, COUNT(*) AS cnt FROM employees GROUP BY dept_id HAVING cnt > 5;

-- 14. Join employees with departments
SELECT e.*, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.dept_id;

-- 15. Find employees without a department
SELECT * FROM employees WHERE dept_id IS NULL;

-- 16. Update employee salary by 10%
UPDATE employees SET salary = salary * 1.10 WHERE emp_id = 1;

-- 17. Insert new employee
INSERT INTO employees (first_name, last_name, email, salary)
VALUES ('Test', 'User', 'test@test.com', 50000);

-- 18. Delete employees with salary < 30000
DELETE FROM employees WHERE salary < 30000;

-- 19. Find employees between salary 50000 and 100000
SELECT * FROM employees WHERE salary BETWEEN 50000 AND 100000;

-- 20. Find employees in multiple departments
SELECT * FROM employees WHERE dept_id IN (1, 2, 3);

-- 21. Concatenate first and last name
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM employees;

-- 22. Calculate annual salary
SELECT first_name, salary, salary * 12 AS annual_salary FROM employees;

-- 23. Find total salary per department
SELECT dept_id, SUM(salary) AS total_salary FROM employees GROUP BY dept_id;

-- 24. Find products with low stock (< 10)
SELECT * FROM products WHERE stock_quantity < 10;

-- 25. Count orders per status
SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;

-- 26. Find customers from India
SELECT * FROM customers WHERE country = 'India';

-- 27. Calculate total revenue
SELECT SUM(total) AS total_revenue FROM orders;

-- 28. Find orders from last 30 days
SELECT * FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- 29. List products sorted by price
SELECT * FROM products ORDER BY price DESC;

-- 30. Find employees with no manager
SELECT * FROM employees WHERE manager_id IS NULL;
```

### MEDIUM Level (31-65)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDIUM PROBLEMS (31-65)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 31. Find second highest salary
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);

-- 32. Find employees who earn more than average
SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);

-- 33. Find duplicate emails
SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1;

-- 34. Rank employees by salary within department
SELECT *, RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees;

-- 35. Find Nth highest salary (N=3)
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2;

-- 36. Calculate running total of sales
SELECT order_date, total, SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- 37. Find employees and their managers
SELECT e.first_name AS employee, m.first_name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- 38. Find departments without employees
SELECT d.* FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
WHERE e.emp_id IS NULL;

-- 39. Find customers who never ordered
SELECT c.* FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;

-- 40. Calculate year-over-year growth
WITH yearly AS (
    SELECT YEAR(order_date) AS year, SUM(total) AS revenue
    FROM orders GROUP BY YEAR(order_date)
)
SELECT year, revenue,
    LAG(revenue) OVER (ORDER BY year) AS prev_year,
    (revenue - LAG(revenue) OVER (ORDER BY year)) / LAG(revenue) OVER (ORDER BY year) * 100 AS growth_pct
FROM yearly;

-- 41. Find consecutive login days
WITH login_gaps AS (
    SELECT user_id, login_date,
        login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
    FROM user_logins
)
SELECT user_id, COUNT(*) AS consecutive_days FROM login_gaps GROUP BY user_id, grp;

-- 42. Pivot monthly sales by category
SELECT
    category,
    SUM(CASE WHEN MONTH(order_date) = 1 THEN amount END) AS Jan,
    SUM(CASE WHEN MONTH(order_date) = 2 THEN amount END) AS Feb,
    SUM(CASE WHEN MONTH(order_date) = 3 THEN amount END) AS Mar
FROM sales GROUP BY category;

-- 43. Find top 3 products per category by sales
SELECT * FROM (
    SELECT category, product_name, total_sales,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_sales DESC) AS rn
    FROM product_sales
) t WHERE rn <= 3;

-- 44. Calculate moving average (7-day)
SELECT order_date, revenue,
    AVG(revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma_7
FROM daily_revenue;

-- 45. Find gaps in sequence
SELECT a.id + 1 AS gap_start, MIN(b.id) - 1 AS gap_end
FROM orders a LEFT JOIN orders b ON a.id < b.id
GROUP BY a.id HAVING a.id + 1 < MIN(b.id);

-- 46. Compare each employee's salary to department average
SELECT e.*, d_avg.avg_salary, e.salary - d_avg.avg_salary AS diff_from_avg
FROM employees e
JOIN (SELECT dept_id, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id) d_avg
ON e.dept_id = d_avg.dept_id;

-- 47. Find orders with all items from same category
SELECT o.order_id FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY o.order_id
HAVING COUNT(DISTINCT p.category) = 1;

-- 48. Recursive hierarchy - find all subordinates
WITH RECURSIVE emp_hierarchy AS (
    SELECT emp_id, first_name, manager_id, 1 AS level FROM employees WHERE emp_id = 1
    UNION ALL
    SELECT e.emp_id, e.first_name, e.manager_id, h.level + 1
    FROM employees e JOIN emp_hierarchy h ON e.manager_id = h.emp_id
)
SELECT * FROM emp_hierarchy;

-- 49. Find customers with orders in all categories
SELECT customer_id FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY customer_id
HAVING COUNT(DISTINCT p.category) = (SELECT COUNT(DISTINCT category) FROM products);

-- 50. Calculate percentage contribution
SELECT category, SUM(revenue) AS cat_revenue,
    ROUND(SUM(revenue) * 100.0 / SUM(SUM(revenue)) OVER (), 2) AS percentage
FROM sales GROUP BY category;

-- 51. Find median salary
SELECT AVG(salary) AS median FROM (
    SELECT salary, ROW_NUMBER() OVER (ORDER BY salary) AS rn,
        COUNT(*) OVER () AS cnt
    FROM employees
) t WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));

-- 52. Find common products between customers
SELECT p.product_id, p.name FROM products p
WHERE p.product_id IN (SELECT product_id FROM order_items WHERE customer_id = 1)
  AND p.product_id IN (SELECT product_id FROM order_items WHERE customer_id = 2);

-- 53. Calculate customer lifetime value
SELECT customer_id,
    COUNT(DISTINCT order_id) AS total_orders,
    SUM(total) AS lifetime_value,
    MIN(order_date) AS first_order,
    MAX(order_date) AS last_order
FROM orders GROUP BY customer_id;

-- 54. Find peak sales hour
SELECT HOUR(order_time) AS hour, COUNT(*) AS order_count, SUM(total) AS revenue
FROM orders GROUP BY HOUR(order_time) ORDER BY revenue DESC LIMIT 1;

-- 55. Identify outliers (beyond 3 standard deviations)
WITH stats AS (
    SELECT AVG(salary) AS mean, STDDEV(salary) AS std FROM employees
)
SELECT e.* FROM employees e, stats
WHERE e.salary < mean - 3 * std OR e.salary > mean + 3 * std;

-- 56-65: Window function challenges
-- 56. First value per group
SELECT *, FIRST_VALUE(salary) OVER (PARTITION BY dept_id ORDER BY hire_date) AS first_hire_salary
FROM employees;

-- 57. Cumulative distinct count
SELECT order_date,
    COUNT(DISTINCT customer_id) OVER (ORDER BY order_date) AS cumulative_customers
FROM orders;

-- 58. Island detection (consecutive status)
-- 59. Session analysis (user sessions within 30 min)
-- 60. Attribution modeling (first touch, last touch)
-- 61. Basket analysis (products bought together)
-- 62. Cohort retention calculation
-- 63. Funnel conversion rates
-- 64. Time between events
-- 65. Detecting anomalies in time series
```

### HARD Level (66-100)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- HARD PROBLEMS (66-100)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 66. Calculate compound growth rate (CAGR)
WITH bounds AS (
    SELECT MIN(year) AS start_year, MAX(year) AS end_year,
        FIRST_VALUE(revenue) OVER (ORDER BY year) AS start_value,
        LAST_VALUE(revenue) OVER (ORDER BY year ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS end_value
    FROM annual_revenue
)
SELECT POWER(end_value / start_value, 1.0 / (end_year - start_year)) - 1 AS cagr FROM bounds LIMIT 1;

-- 67. Recursive bill of materials
WITH RECURSIVE bom AS (
    SELECT parent_id, child_id, quantity, 1 AS level
    FROM bill_of_materials WHERE parent_id = 'PROD001'
    UNION ALL
    SELECT b.parent_id, b.child_id, b.quantity * bom.quantity, bom.level + 1
    FROM bill_of_materials b JOIN bom ON b.parent_id = bom.child_id
    WHERE bom.level < 10
)
SELECT * FROM bom;

-- 68. Find overlapping date ranges
SELECT a.event_id, b.event_id
FROM events a, events b
WHERE a.event_id < b.event_id
  AND a.start_date <= b.end_date AND a.end_date >= b.start_date;

-- 69. Merge overlapping intervals
WITH RECURSIVE merged AS (
    SELECT start_date, end_date, ROW_NUMBER() OVER (ORDER BY start_date) AS rn
    FROM intervals
)
-- Complex merge logic here

-- 70. Network/Graph traversal - find all connected nodes
WITH RECURSIVE paths AS (
    SELECT source, destination, 1 AS hops, CAST(source AS CHAR(1000)) AS path
    FROM edges WHERE source = 'A'
    UNION ALL
    SELECT p.source, e.destination, p.hops + 1, CONCAT(p.path, '->', e.destination)
    FROM paths p JOIN edges e ON p.destination = e.source
    WHERE FIND_IN_SET(e.destination, REPLACE(p.path, '->', ',')) = 0
)
SELECT * FROM paths;

-- 71. Sessionization (30 min gap creates new session)
WITH events_with_gap AS (
    SELECT *,
        CASE WHEN TIMESTAMPDIFF(MINUTE,
            LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time),
            event_time) > 30 THEN 1 ELSE 0 END AS new_session
    FROM user_events
)
SELECT *, SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_time) AS session_id
FROM events_with_gap;

-- 72. Attribution modeling - Multi-touch attribution
-- 73. Market basket analysis with lift calculation
-- 74. Time-weighted average calculation
-- 75. Survival analysis (customer churn probability)

-- 76. Efficient pagination with keyset
SELECT * FROM products
WHERE (created_at, product_id) < (@last_created, @last_id)
ORDER BY created_at DESC, product_id DESC LIMIT 20;

-- 77. Implement DENSE_RANK without window functions
SELECT emp_id, salary, (
    SELECT COUNT(DISTINCT e2.salary) + 1
    FROM employees e2 WHERE e2.salary > e.salary
) AS rank
FROM employees e ORDER BY salary DESC;

-- 78. Find mutual friends
SELECT f1.friend_id FROM friendships f1
JOIN friendships f2 ON f1.friend_id = f2.friend_id
WHERE f1.user_id = 1 AND f2.user_id = 2;

-- 79. Recommendation system - collaborative filtering
WITH user_purchases AS (
    SELECT customer_id, product_id FROM order_items
),
similar_users AS (
    SELECT a.customer_id, b.customer_id AS similar_user,
        COUNT(DISTINCT a.product_id) AS common_products
    FROM user_purchases a JOIN user_purchases b
        ON a.product_id = b.product_id AND a.customer_id != b.customer_id
    WHERE a.customer_id = @target_user
    GROUP BY a.customer_id, b.customer_id
)
SELECT p.product_id, COUNT(*) AS score
FROM similar_users su
JOIN user_purchases up ON su.similar_user = up.customer_id
JOIN products p ON up.product_id = p.product_id
WHERE p.product_id NOT IN (SELECT product_id FROM user_purchases WHERE customer_id = @target_user)
GROUP BY p.product_id ORDER BY score DESC LIMIT 10;

-- 80. Temporal table queries
-- 81. Bi-temporal data handling
-- 82. Slowly Changing Dimension Type 2 implementation
-- 83. Data reconciliation between systems
-- 84. Hierarchical closure table queries
-- 85. Materialized path pattern
-- 86. Nested sets model operations
-- 87. Row pattern matching (MATCH_RECOGNIZE in Oracle)
-- 88. Statistical functions (regression, correlation)
-- 89. Geographical queries (distance calculation)
-- 90. JSON path queries

-- 91-100: Complex real-world scenarios
-- 91. Financial transaction reconciliation
-- 92. Inventory allocation with FIFO/LIFO
-- 93. Currency conversion with historical rates
-- 94. Tax calculation with complex rules
-- 95. Multi-tenant data isolation
-- 96. Audit trail implementation
-- 97. Real-time analytics aggregation
-- 98. Data quality scoring
-- 99. ETL error handling and recovery
-- 100. Cross-database querying
```

---

## Chapter 22: Mini Projects

### Project 1: E-commerce Analytics Dashboard

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 1: E-COMMERCE ANALYTICS DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Create the database schema
CREATE DATABASE ecommerce_analytics;
USE ecommerce_analytics;

-- Create dimension tables
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE,
    day_name VARCHAR(10),
    month_name VARCHAR(10),
    quarter INT,
    year INT
);

CREATE TABLE dim_product (
    product_key INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNIQUE,
    name VARCHAR(255),
    category VARCHAR(100),
    brand VARCHAR(100),
    price DECIMAL(10,2)
);

CREATE TABLE dim_customer (
    customer_key INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNIQUE,
    name VARCHAR(200),
    email VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    segment VARCHAR(50)
);

-- Create fact table
CREATE TABLE fact_orders (
    fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    date_key INT,
    product_key INT,
    customer_key INT,
    order_id VARCHAR(50),
    quantity INT,
    unit_price DECIMAL(10,2),
    discount DECIMAL(5,2),
    total_amount DECIMAL(12,2),
    FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key)
);

-- STEP 2: Create analytics views

-- Daily sales summary
CREATE VIEW v_daily_sales AS
SELECT
    dd.full_date,
    dd.day_name,
    COUNT(DISTINCT fo.order_id) AS orders,
    COUNT(DISTINCT fo.customer_key) AS customers,
    SUM(fo.quantity) AS units_sold,
    SUM(fo.total_amount) AS revenue
FROM fact_orders fo
JOIN dim_date dd ON fo.date_key = dd.date_key
GROUP BY dd.full_date, dd.day_name;

-- Product performance
CREATE VIEW v_product_performance AS
SELECT
    dp.category,
    dp.name AS product_name,
    COUNT(DISTINCT fo.order_id) AS times_ordered,
    SUM(fo.quantity) AS total_units,
    SUM(fo.total_amount) AS total_revenue,
    AVG(fo.unit_price) AS avg_price
FROM fact_orders fo
JOIN dim_product dp ON fo.product_key = dp.product_key
GROUP BY dp.category, dp.product_key, dp.name;

-- Customer segments
CREATE VIEW v_customer_segments AS
SELECT
    dc.segment,
    dc.country,
    COUNT(DISTINCT dc.customer_key) AS customers,
    SUM(fo.total_amount) AS total_revenue,
    AVG(fo.total_amount) AS avg_order_value
FROM dim_customer dc
LEFT JOIN fact_orders fo ON dc.customer_key = fo.customer_key
GROUP BY dc.segment, dc.country;

-- STEP 3: Create stored procedure for reports

DELIMITER //
CREATE PROCEDURE sp_monthly_report(IN p_year INT, IN p_month INT)
BEGIN
    -- Summary metrics
    SELECT
        'Monthly Summary' AS report,
        COUNT(DISTINCT order_id) AS total_orders,
        COUNT(DISTINCT customer_key) AS unique_customers,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month;

    -- Top 10 products
    SELECT
        'Top Products' AS report,
        dp.name,
        SUM(fo.quantity) AS units,
        SUM(fo.total_amount) AS revenue
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    JOIN dim_product dp ON fo.product_key = dp.product_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month
    GROUP BY dp.product_key, dp.name
    ORDER BY revenue DESC LIMIT 10;

    -- Category breakdown
    SELECT
        'Category Breakdown' AS report,
        dp.category,
        SUM(fo.total_amount) AS revenue,
        SUM(fo.total_amount) * 100.0 / SUM(SUM(fo.total_amount)) OVER () AS percentage
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    JOIN dim_product dp ON fo.product_key = dp.product_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month
    GROUP BY dp.category;
END //
DELIMITER ;

-- Run monthly report
CALL sp_monthly_report(2024, 6);
```

### Project 2: Employee Management System

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 2: EMPLOYEE MANAGEMENT SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create complete HR database with triggers and procedures

CREATE DATABASE hr_system;
USE hr_system;

-- Tables
CREATE TABLE departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    manager_id INT
);

CREATE TABLE employees (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    salary DECIMAL(10,2) CHECK (salary >= 0),
    dept_id INT,
    manager_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
    FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
);

CREATE TABLE salary_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason VARCHAR(200),
    changed_by VARCHAR(100),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

CREATE TABLE employee_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    action VARCHAR(20),
    field_changed VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100)
);

-- Triggers
DELIMITER //

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    SET NEW.emp_code = CONCAT('EMP', LPAD((SELECT IFNULL(MAX(emp_id), 0) + 1 FROM employees), 5, '0'));
END //

CREATE TRIGGER after_salary_update
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    IF OLD.salary != NEW.salary THEN
        INSERT INTO salary_history (emp_id, old_salary, new_salary, change_reason, changed_by)
        VALUES (NEW.emp_id, OLD.salary, NEW.salary, 'Salary Update', USER());
    END IF;
END //

DELIMITER ;

-- Stored Procedures
DELIMITER //

CREATE PROCEDURE sp_hire_employee(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_job_title VARCHAR(100),
    IN p_salary DECIMAL(10,2),
    IN p_dept_id INT
)
BEGIN
    INSERT INTO employees (first_name, last_name, email, job_title, salary, dept_id, hire_date)
    VALUES (p_first_name, p_last_name, p_email, p_job_title, p_salary, p_dept_id, CURDATE());

    SELECT LAST_INSERT_ID() AS new_emp_id,
           (SELECT emp_code FROM employees WHERE emp_id = LAST_INSERT_ID()) AS emp_code;
END //

CREATE PROCEDURE sp_give_raise(
    IN p_dept_id INT,
    IN p_percentage DECIMAL(5,2)
)
BEGIN
    UPDATE employees
    SET salary = salary * (1 + p_percentage/100)
    WHERE dept_id = p_dept_id AND is_active = TRUE;

    SELECT ROW_COUNT() AS employees_updated;
END //

CREATE PROCEDURE sp_org_chart()
BEGIN
    WITH RECURSIVE org AS (
        SELECT emp_id, CONCAT(first_name, ' ', last_name) AS name, job_title, manager_id, 0 AS level
        FROM employees WHERE manager_id IS NULL AND is_active = TRUE
        UNION ALL
        SELECT e.emp_id, CONCAT(e.first_name, ' ', e.last_name), e.job_title, e.manager_id, o.level + 1
        FROM employees e JOIN org o ON e.manager_id = o.emp_id
        WHERE e.is_active = TRUE
    )
    SELECT CONCAT(REPEAT('  ', level), name) AS employee, job_title, level
    FROM org ORDER BY level, name;
END //

DELIMITER ;
```

### Project 3: Data Pipeline (ETL)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 3: SIMPLE ETL DATA PIPELINE
-- ═══════════════════════════════════════════════════════════════════════════════

-- This project demonstrates ETL concepts using SQL

-- Source system (simulated)
CREATE DATABASE source_crm;
USE source_crm;

CREATE TABLE raw_leads (
    lead_id INT PRIMARY KEY,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Staging area
CREATE DATABASE etl_staging;
USE etl_staging;

CREATE TABLE stg_leads (
    lead_id INT,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- ETL metadata
    etl_batch_id INT,
    etl_loaded_at TIMESTAMP,
    etl_checksum VARCHAR(64),
    is_valid BOOLEAN DEFAULT TRUE,
    validation_errors TEXT
);

-- Data Warehouse
CREATE DATABASE dwh;
USE dwh;

CREATE TABLE dim_lead_source (
    source_key INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100),
    source_category VARCHAR(50),
    effective_date DATE,
    expiry_date DATE DEFAULT '9999-12-31',
    is_current BOOLEAN DEFAULT TRUE
);

CREATE TABLE fact_leads (
    fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    source_key INT,
    status VARCHAR(50),
    days_to_convert INT,
    created_date_key INT,
    converted_date_key INT
);

-- ETL Procedures
DELIMITER //

CREATE PROCEDURE etl_extract_leads(IN p_batch_id INT)
BEGIN
    -- Extract from source to staging
    INSERT INTO etl_staging.stg_leads
        (lead_id, company_name, contact_name, contact_email, phone, source, status,
         created_at, updated_at, etl_batch_id, etl_loaded_at, etl_checksum)
    SELECT
        lead_id, company_name, contact_name, contact_email, phone, source, status,
        created_at, updated_at, p_batch_id, NOW(),
        MD5(CONCAT_WS('|', lead_id, company_name, contact_email, status, updated_at))
    FROM source_crm.raw_leads
    WHERE updated_at > (SELECT COALESCE(MAX(updated_at), '1900-01-01') FROM etl_staging.stg_leads);

    SELECT ROW_COUNT() AS records_extracted;
END //

CREATE PROCEDURE etl_transform_leads(IN p_batch_id INT)
BEGIN
    -- Validate data
    UPDATE etl_staging.stg_leads
    SET is_valid = FALSE,
        validation_errors = CONCAT_WS(', ',
            CASE WHEN contact_email NOT REGEXP '^[A-Za-z0-9._%+-]+@' THEN 'Invalid email' END,
            CASE WHEN phone IS NULL OR phone = '' THEN 'Missing phone' END
        )
    WHERE etl_batch_id = p_batch_id
      AND (contact_email NOT REGEXP '^[A-Za-z0-9._%+-]+@'
           OR phone IS NULL OR phone = '');

    -- Transform: Clean and standardize
    UPDATE etl_staging.stg_leads
    SET company_name = TRIM(company_name),
        contact_name = TRIM(contact_name),
        contact_email = LOWER(TRIM(contact_email)),
        phone = REGEXP_REPLACE(phone, '[^0-9]', '')
    WHERE etl_batch_id = p_batch_id AND is_valid = TRUE;

    SELECT
        SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) AS valid_records,
        SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) AS invalid_records
    FROM etl_staging.stg_leads WHERE etl_batch_id = p_batch_id;
END //

CREATE PROCEDURE etl_load_leads(IN p_batch_id INT)
BEGIN
    -- Load to dimension (SCD Type 1 for simplicity)
    INSERT INTO dwh.dim_lead_source (source_name, source_category, effective_date)
    SELECT DISTINCT source,
        CASE
            WHEN source LIKE '%web%' THEN 'Digital'
            WHEN source LIKE '%referral%' THEN 'Referral'
            ELSE 'Other'
        END,
        CURDATE()
    FROM etl_staging.stg_leads s
    WHERE s.etl_batch_id = p_batch_id
      AND s.is_valid = TRUE
      AND NOT EXISTS (SELECT 1 FROM dwh.dim_lead_source d WHERE d.source_name = s.source);

    -- Load to fact
    INSERT INTO dwh.fact_leads (lead_id, source_key, status, created_date_key)
    SELECT s.lead_id, d.source_key, s.status,
        CAST(DATE_FORMAT(s.created_at, '%Y%m%d') AS UNSIGNED)
    FROM etl_staging.stg_leads s
    JOIN dwh.dim_lead_source d ON s.source = d.source_name AND d.is_current = TRUE
    WHERE s.etl_batch_id = p_batch_id AND s.is_valid = TRUE;

    SELECT ROW_COUNT() AS records_loaded;
END //

-- Master ETL procedure
CREATE PROCEDURE run_etl_pipeline()
BEGIN
    DECLARE v_batch_id INT;

    -- Generate batch ID
    SET v_batch_id = UNIX_TIMESTAMP();

    -- Run ETL steps
    CALL etl_extract_leads(v_batch_id);
    CALL etl_transform_leads(v_batch_id);
    CALL etl_load_leads(v_batch_id);

    SELECT 'ETL Pipeline Complete' AS status, v_batch_id AS batch_id;
END //

DELIMITER ;
```

---

## Chapter 23: Interview Questions (Top 50)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TOP 50 SQL INTERVIEW QUESTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Q1: What is the difference between WHERE and HAVING?
-- A: WHERE filters rows before grouping, HAVING filters groups after aggregation

-- Q2: Find the second highest salary
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
-- Or: SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- Q3: Find duplicate records
SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1;

-- Q4: Delete duplicate records keeping one
DELETE e1 FROM employees e1
INNER JOIN employees e2
WHERE e1.emp_id > e2.emp_id AND e1.email = e2.email;

-- Q5: Difference between DELETE, TRUNCATE, DROP
-- DELETE: Removes rows, can use WHERE, logged, slow
-- TRUNCATE: Removes all rows, resets auto-increment, faster
-- DROP: Removes table structure and data

-- Q6: What is a self join?
-- A: Joining a table with itself
SELECT e.name AS employee, m.name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- Q7: Find employees with no manager
SELECT * FROM employees WHERE manager_id IS NULL;

-- Q8: Difference between UNION and UNION ALL
-- UNION: Removes duplicates
-- UNION ALL: Keeps duplicates (faster)

-- Q9: Find Nth highest salary
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N-1;

-- Q10: Difference between RANK, DENSE_RANK, ROW_NUMBER
-- ROW_NUMBER: 1,2,3,4,5 (unique)
-- RANK: 1,2,2,4,5 (gaps after ties)
-- DENSE_RANK: 1,2,2,3,4 (no gaps)

-- Q11: Write a query to transpose rows to columns (PIVOT)
SELECT
    employee_id,
    MAX(CASE WHEN month = 'Jan' THEN sales END) AS Jan,
    MAX(CASE WHEN month = 'Feb' THEN sales END) AS Feb,
    MAX(CASE WHEN month = 'Mar' THEN sales END) AS Mar
FROM monthly_sales GROUP BY employee_id;

-- Q12: Find customers who ordered every product
SELECT customer_id FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY customer_id
HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products);

-- Q13: What are ACID properties?
-- Atomicity, Consistency, Isolation, Durability

-- Q14: Explain different types of indexes
-- B-Tree, Hash, Full-text, Composite, Covering

-- Q15: What is normalization? Explain normal forms.
-- 1NF: Atomic values, no repeating groups
-- 2NF: No partial dependencies
-- 3NF: No transitive dependencies
-- BCNF: Every determinant is a candidate key

-- Q16: What is a CTE?
-- Common Table Expression - named temporary result set
WITH cte AS (SELECT * FROM employees WHERE salary > 50000)
SELECT * FROM cte;

-- Q17: Difference between INNER JOIN and LEFT JOIN
-- INNER: Only matching rows
-- LEFT: All rows from left + matching from right

-- Q18: What is a correlated subquery?
-- Subquery that references outer query
SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id);

-- Q19: How to optimize a slow query?
-- Add indexes, avoid SELECT *, avoid functions on indexed columns, use EXPLAIN

-- Q20: What is a deadlock?
-- Two transactions waiting for each other's locks

-- Q21: Find running total
SELECT date, amount, SUM(amount) OVER (ORDER BY date) AS running_total FROM sales;

-- Q22: Find consecutive days of login
WITH numbered AS (
    SELECT user_id, login_date,
        login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
    FROM logins
)
SELECT user_id, COUNT(*) AS consecutive_days FROM numbered GROUP BY user_id, grp;

-- Q23: What is a view? Can you update a view?
-- Virtual table based on SELECT. Simple views can be updated.

-- Q24: Difference between stored procedure and function
-- Procedure: Can modify data, no return required, called with CALL
-- Function: Returns value, used in SELECT, cannot modify data (usually)

-- Q25: What is a trigger?
-- Code that automatically executes on INSERT/UPDATE/DELETE

-- Q26-50: More advanced questions...
-- Explain execution plan, isolation levels, sharding, partitioning,
-- query hints, temporary tables vs CTEs, window frames, etc.
```

---

## Chapter 24: Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         SQL QUICK REFERENCE CHEAT SHEET                          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                              BASIC SYNTAX                                  ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  SELECT columns FROM table                                                ║  ║
║  ║  WHERE condition                                                          ║  ║
║  ║  GROUP BY columns                                                         ║  ║
║  ║  HAVING group_condition                                                   ║  ║
║  ║  ORDER BY columns [ASC|DESC]                                              ║  ║
║  ║  LIMIT n [OFFSET m]                                                       ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                              JOIN TYPES                                    ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  INNER JOIN  - Matching rows from both tables                             ║  ║
║  ║  LEFT JOIN   - All from left + matching from right                        ║  ║
║  ║  RIGHT JOIN  - All from right + matching from left                        ║  ║
║  ║  FULL JOIN   - All rows from both tables                                  ║  ║
║  ║  CROSS JOIN  - Cartesian product                                          ║  ║
║  ║  SELF JOIN   - Table joined to itself                                     ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           AGGREGATE FUNCTIONS                              ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  COUNT(*)         - Count all rows                                        ║  ║
║  ║  COUNT(column)    - Count non-null values                                 ║  ║
║  ║  SUM(column)      - Sum of values                                         ║  ║
║  ║  AVG(column)      - Average value                                         ║  ║
║  ║  MIN(column)      - Minimum value                                         ║  ║
║  ║  MAX(column)      - Maximum value                                         ║  ║
║  ║  GROUP_CONCAT()   - Concatenate values (MySQL)                            ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           WINDOW FUNCTIONS                                 ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  ROW_NUMBER() OVER (ORDER BY col)                                         ║  ║
║  ║  RANK() OVER (PARTITION BY col1 ORDER BY col2)                           ║  ║
║  ║  DENSE_RANK() OVER (...)                                                  ║  ║
║  ║  NTILE(n) OVER (...)                                                      ║  ║
║  ║  LAG(col, n) OVER (...)      - Previous row value                         ║  ║
║  ║  LEAD(col, n) OVER (...)     - Next row value                             ║  ║
║  ║  FIRST_VALUE(col) OVER (...)                                              ║  ║
║  ║  SUM(col) OVER (ORDER BY col ROWS BETWEEN ... AND ...)                   ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           STRING FUNCTIONS                                 ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  CONCAT(s1, s2)   - Concatenate strings                                   ║  ║
║  ║  UPPER(s)         - Convert to uppercase                                  ║  ║
║  ║  LOWER(s)         - Convert to lowercase                                  ║  ║
║  ║  TRIM(s)          - Remove whitespace                                     ║  ║
║  ║  LENGTH(s)        - String length                                         ║  ║
║  ║  SUBSTRING(s,i,n) - Extract substring                                     ║  ║
║  ║  REPLACE(s,a,b)   - Replace occurrences                                   ║  ║
║  ║  LEFT(s,n)        - Left n characters                                     ║  ║
║  ║  RIGHT(s,n)       - Right n characters                                    ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           DATE FUNCTIONS                                   ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  NOW()                   - Current datetime                               ║  ║
║  ║  CURDATE()               - Current date                                   ║  ║
║  ║  DATE(datetime)          - Extract date                                   ║  ║
║  ║  YEAR(date)              - Extract year                                   ║  ║
║  ║  MONTH(date)             - Extract month                                  ║  ║
║  ║  DAY(date)               - Extract day                                    ║  ║
║  ║  DATEDIFF(d1, d2)        - Difference in days                            ║  ║
║  ║  DATE_ADD(d, INTERVAL n) - Add interval                                   ║  ║
║  ║  DATE_FORMAT(d, fmt)     - Format date                                    ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           COMMON PATTERNS                                  ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  -- Second highest salary                                                 ║  ║
║  ║  SELECT MAX(sal) FROM t WHERE sal < (SELECT MAX(sal) FROM t);            ║  ║
║  ║                                                                           ║  ║
║  ║  -- Find duplicates                                                       ║  ║
║  ║  SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1;           ║  ║
║  ║                                                                           ║  ║
║  ║  -- Running total                                                         ║  ║
║  ║  SUM(amount) OVER (ORDER BY date) AS running_total                       ║  ║
║  ║                                                                           ║  ║
║  ║  -- Top N per group                                                       ║  ║
║  ║  SELECT * FROM (SELECT *, ROW_NUMBER() OVER                              ║  ║
║  ║    (PARTITION BY grp ORDER BY val DESC) rn FROM t) WHERE rn <= N;        ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           OPTIMIZATION TIPS                                ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  ✓ Use indexes on WHERE, JOIN, ORDER BY columns                          ║  ║
║  ║  ✓ Avoid SELECT * - select only needed columns                           ║  ║
║  ║  ✓ Use EXPLAIN to analyze query plans                                    ║  ║
║  ║  ✓ Avoid functions on indexed columns in WHERE                           ║  ║
║  ║  ✓ Use EXISTS instead of IN for large subqueries                         ║  ║
║  ║  ✓ Batch large INSERT/UPDATE/DELETE operations                           ║  ║
║  ║  ✓ Use LIMIT for pagination, prefer keyset over OFFSET                   ║  ║
║  ║  ✓ Keep transactions short to avoid locks                                ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# 🎯 SQL MASTERY CHECKLIST

```
□ Database Fundamentals
  □ Understand RDBMS architecture
  □ Know SQL command categories (DDL, DML, DCL, TCL)
  □ Understand data types and when to use them

□ Basic Operations
  □ Master SELECT with all clauses
  □ Use all comparison and logical operators
  □ Perform CRUD operations confidently

□ Intermediate Skills
  □ Write complex JOINs (including self-joins)
  □ Use GROUP BY with HAVING effectively
  □ Write subqueries (scalar, correlated, EXISTS)
  □ Create and use CTEs and recursive CTEs

□ Advanced Skills
  □ Master all window functions
  □ Understand normalization (1NF to BCNF)
  □ Create and optimize indexes
  □ Write stored procedures and functions
  □ Implement triggers for automation
  □ Manage transactions and understand isolation levels

□ Expert Level
  □ Optimize queries using EXPLAIN
  □ Design star/snowflake schemas
  □ Build ETL pipelines
  □ Perform complex analytics
  □ Handle real-world data engineering challenges

□ Interview Ready
  □ Solve problems in under 15 minutes
  □ Explain query optimization techniques
  □ Discuss trade-offs in database design
  □ Write clean, readable SQL code
```

---

_"Congratulations! You've completed the comprehensive SQL guide from scratch to expert level. Now practice consistently and build projects!"_

---

## 📚 RESOURCES FOR FURTHER LEARNING

```
Online Platforms:
- LeetCode SQL Problems: https://leetcode.com/problemset/database/
- HackerRank SQL: https://www.hackerrank.com/domains/sql
- Mode Analytics SQL Tutorial: https://mode.com/sql-tutorial/
- SQLZoo: https://sqlzoo.net/

Books:
- "SQL Performance Explained" by Markus Winand
- "Learning SQL" by Alan Beaulieu
- "SQL Cookbook" by Anthony Molinaro

YouTube Channels:
- TechTFQ (SQL Interview Questions)
- Alex the Analyst
- Data With Danny

Practice Databases:
- PostgreSQL Sample Databases
- MySQL Sakila Sample Database
- AdventureWorks (SQL Server)
```

---

**END OF SQL COMPLETE GUIDE**

_"Data is the new oil, and now you have the tools to refine it!"_

---
