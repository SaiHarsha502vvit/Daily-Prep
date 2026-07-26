> **SQL Chapter 03/20** | [← Previous](02_DataTypes_Constraints.md) | [Index](../00_MASTER_INDEX.md) | [Next →](04_DML_Manipulating_Data.md)

---

## Chapter 3: DDL - Creating Database Structure

### 🧠 What Is DDL — Understanding Schema vs Data

DDL (Data Definition Language) is the subset of SQL that defines the **structure** (schema) of your database — tables, columns, indexes, constraints. It answers the question: _"What shape does my data take?"_ before any actual data is stored.

Think of it this way: DDL is like designing the blueprint of a building (how many rooms, where the doors go, what materials to use), while DML (next chapter) is like moving furniture into those rooms. You must design the building before you can furnish it.

#### Why DDL Matters — The Three Levels of Database Design

Databases operate at three conceptual levels, and DDL operates at the middle one:

| Level                            | Describes                           | Example                                   |
| -------------------------------- | ----------------------------------- | ----------------------------------------- |
| **Conceptual** (ER Diagrams)     | Business entities & relationships   | "A customer places many orders"           |
| **Logical** (DDL — you are here) | Tables, columns, types, constraints | `CREATE TABLE orders (order_id INT, ...)` |
| **Physical** (Storage engine)    | How data is stored on disk          | B-Tree pages, data files, tablespaces     |

DDL is where your **business model becomes executable code**. A well-designed schema makes queries simple, fast, and correct. A poorly designed schema causes every future query to be painful.

#### ⚠️ DDL in Production — Why This Is Dangerous

In development, running `ALTER TABLE` or `DROP TABLE` is routine. In production with millions of rows, DDL operations can be **catastrophic**:

- **`ALTER TABLE ADD COLUMN`** on a table with 100 million rows may **lock the entire table** for minutes or even hours (depending on the database engine). During that lock, no reads or writes can happen — your application goes down.
- **`DROP TABLE`** is **irreversible**. There is no undo. If you drop the wrong table in production, you need to restore from a backup — which could mean hours of downtime.
- **`DROP TABLE ... CASCADE`** is even more dangerous: it follows foreign key references and **drops dependent tables too**. One careless command can delete your entire schema.

> 💡 **Production Rule:** Always preview DDL changes in a staging environment first. Use migration tools (Flyway, Liquibase) to version-control your schema changes. Never run DDL manually in production — use approved migration scripts.

---

### CREATE Statements

#### 📝 Formal Syntax — CREATE DATABASE

```
CREATE DATABASE [IF NOT EXISTS] <database_name>
    [CHARACTER SET <charset_name>]
    [COLLATE <collation_name>];
```

#### 📝 Formal Syntax — CREATE TABLE

```
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <column_name>  <data_type>  [NOT NULL]  [DEFAULT <value>]  [PRIMARY KEY]  [AUTO_INCREMENT],
    <column_name>  <data_type>  [UNIQUE]    [CHECK (<condition>)],
    ...
    [PRIMARY KEY (<column_name>, ...)],
    [FOREIGN KEY (<column_name>) REFERENCES <parent_table>(<parent_column>)
        [ON DELETE {CASCADE | SET NULL | RESTRICT | NO ACTION}]
        [ON UPDATE {CASCADE | SET NULL | RESTRICT | NO ACTION}]],
    [CONSTRAINT <constraint_name> CHECK (<condition>)],
    [UNIQUE KEY <key_name> (<column_name>, ...)]
);
```

#### 📝 Formal Syntax — CREATE INDEX

```
CREATE [UNIQUE] INDEX <index_name>
    ON <table_name> (<column_name> [ASC|DESC], ...)
    [WHERE <condition>];                         -- Partial index (PostgreSQL)
```

#### 📝 Formal Syntax — ALTER TABLE

```
ALTER TABLE <table_name>
    ADD [COLUMN] <column_name> <data_type> [constraints]  [AFTER <existing_column>]
  | MODIFY [COLUMN] <column_name> <new_data_type>
  | RENAME COLUMN <old_name> TO <new_name>
  | DROP [COLUMN] <column_name>
  | ADD CONSTRAINT <constraint_name> {CHECK (<condition>) | FOREIGN KEY (...) REFERENCES ...}
  | DROP CONSTRAINT <constraint_name>
  | RENAME TO <new_table_name>;
```

#### 📝 Formal Syntax — DROP & TRUNCATE

```
DROP TABLE [IF EXISTS] <table_name> [CASCADE];
DROP DATABASE [IF EXISTS] <database_name>;
DROP INDEX [IF EXISTS] <index_name> [ON <table_name>];
TRUNCATE TABLE <table_name>;                    -- Removes all rows, keeps structure
```

---

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

> **Navigation**: [< Previous](02_DataTypes_Constraints.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_DML_Manipulating_Data.md)

> 🔬 **Section Challenge — Chapter 3: DDL - Creating Database Structure**

**Challenge 1 (Reasoning):** You run `ALTER TABLE users ADD COLUMN middle_name VARCHAR(50)` on a production MySQL 5.7 table with 50 million rows. The entire application becomes unresponsive for 12 minutes. What happened internally, and how do tools like `pt-online-schema-change` (Percona) or `gh-ost` (GitHub) solve this?

<details><summary>Answer</summary>

In MySQL 5.7 (InnoDB), many `ALTER TABLE` operations perform a **table rebuild**: (1) Create a new empty table with the modified schema, (2) Copy ALL 50M rows from old to new table, (3) Swap the tables atomically, (4) Drop the old table. During step 2, the table holds a **metadata lock** that blocks ALL concurrent DML (INSERT/UPDATE/DELETE). 50M rows at ~100K rows/sec = ~8-12 minutes of total lockout. MySQL 8.0+ added `ALGORITHM=INSTANT` for some operations (adding columns at the end), which modifies only metadata — no data copy, near-zero downtime. For operations that still require a copy, `pt-online-schema-change` works by: (1) Creating a new table with the desired schema, (2) Creating triggers on the old table to capture ongoing DML, (3) Copying rows in small batches (e.g., 1000 at a time) with sleep intervals between batches, (4) Replaying triggered changes, (5) Atomically renaming tables. This allows normal operations to continue during the migration. `gh-ost` is trigger-less — it reads changes from the MySQL binlog instead, avoiding trigger overhead.

</details>

### Historical Evolution

**Predecessors (with years):**
- **IBM System R** (1974–1979): Developed the first DDL with CREATE TABLE, ALTER TABLE, DROP TABLE — proving that a declarative schema language could manage persistent data reliably in a multi-user environment.
- **ANSI/SPARC Architecture** (1975): Proposed three-level architecture (external, conceptual, internal) providing the theoretical framework for schema independence that DDL aims to enforce.
- **SQL-86 / SQL-89**: First ANSI standards for DDL — standardized CREATE TABLE syntax, introduced FOREIGN KEY constraints, giving schema designers portable tools to enforce referential integrity.
- **Percona pt-online-schema-change** (2010): Open-source tool that solves the production ALTER problem by applying the online-schema-change algorithm — triggers, batched copy, atomic rename — used at scale by thousands of companies.
- **GitHub gh-ost** (2016): GitHub's triggerless alternative to pt-osc that reads the MySQL binary log directly to capture DML changes, eliminating trigger overhead and reducing load on production servers.

**Evolution narrative:**
System R's DDL was revolutionary: before it, database schemas were defined through physical file formats and code — changing a schema meant rewriting application programs. System R introduced the idea that schema definitions should be declarative and separate from application logic, a principle so powerful it persists today. SQL-86 standardized this across vendors, but the elephant in the room remained: schema changes on large tables required full table locks. As web companies scaled to millions of rows in the 2000s, this became a crisis — GitHub, Shopify, and Airbnb all experienced production incidents from schema migration lockouts. pt-online-schema-change (Percona, 2010) was the first mainstream solution, copying data in batches while keeping the original table live. gh-ost (GitHub, 2016) refined this further by eliminating triggers entirely and using binary log capture — a cleaner architecture that avoided the cascading-trigger problem. MySQL 8.0's ALGORITHM=INSTANT now handles some operations at metadata speed, a direct result of this decade-long battle against the lock problem.

**Modern practice anchor:**
Today, production schema migrations at companies like Shopify and GitHub run via gh-ost or Liquibase — online migration tools whose design is only understandable against the backdrop of System R's original DDL limitations. Every senior SQL interview tests whether you understand that `ALTER TABLE` is not instantaneous on large tables.


---

## Reality Check

**"CREATE TABLE is a reversible operation"** ? DROP TABLE permanently destroys data and structure. ALTER TABLE DROP COLUMN permanently destroys column data. In production, DDL statements should go through migration tools (Flyway, Liquibase) with tested rollback scripts. A mistaken DROP TABLE on a production database without backups is an unrecoverable data loss event. Always test migrations against a copy of production data first.

**"Primary keys are just unique identifiers"** ? In InnoDB (MySQL/MariaDB), the primary key IS the clustered index — data rows are physically ordered by PK. Choosing a random UUID as PK causes page splits on every insert because the new row rarely belongs at the end. Auto-increment integer PKs append sequentially, which is why they outperform random UUIDs for write-heavy tables by 2-5x. In PostgreSQL, the heap is separate from indexes, so PK choice has less physical impact.

**"VARCHAR(255) is a safe default for string columns"** ? VARCHAR(255) has historical significance: in MySQL, lengths up to 255 use 1 byte to store the length prefix; 256+ use 2 bytes. But the real problem is semantic: an email field with VARCHAR(255) accepts 255-character strings that are not valid emails. Use domain-appropriate lengths (VARCHAR(320) for email per RFC, VARCHAR(15) for phone) combined with CHECK constraints for validation.

**"NULL means empty or zero"** ? NULL means UNKNOWN. NULL = NULL is not TRUE — it is NULL. NULL in a SUM is ignored, not treated as 0. COUNT(*) counts rows; COUNT(column) excludes NULLs. A WHERE column != 5 does NOT return rows where column is NULL because NULL != 5 is NULL (not TRUE). Every NULL comparison requires IS NULL or IS NOT NULL — equals and not-equals do not work.

**"Foreign keys slow down the database"** ? Foreign keys add overhead on INSERT (parent existence check) and DELETE (child existence check). This overhead is typically less than 1 millisecond per operation. Without foreign keys, you get orphaned records (child rows pointing to deleted parents), inconsistent data that corrupts reports, and application-level validation that is slower and less reliable than database-enforced constraints. The small write overhead prevents data corruption.
