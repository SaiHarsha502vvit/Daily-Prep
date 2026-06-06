> **SQL Chapter 04/20** | [← Previous](03_DDL_Creating_Structure.md) | [Index](../00_MASTER_INDEX.md) | [Next →](05_Queries_SELECT_WHERE.md)

---

## Chapter 4: DML - Manipulating Data

### 🧠 What Is DML — Working With Data Inside Tables

DML (Data Manipulation Language) is the subset of SQL that **reads, creates, modifies, and removes data** within existing tables. While DDL (previous chapter) defines the *structure* of your database, DML operates on the *contents*. This is the SQL you'll write most often in practice.

DML maps directly to the **CRUD** operations that every application needs:

| CRUD Operation | SQL Statement | What It Does |
|----------------|---------------|--------------|
| **C**reate | `INSERT` | Adds new rows to a table |
| **R**ead | `SELECT` | Retrieves data (covered in Chapter 5) |
| **U**pdate | `UPDATE` | Modifies existing rows |
| **D**elete | `DELETE` | Removes rows from a table |

#### The Cardinal Rule of DML: WHERE Clauses Save Careers

The single most important thing to understand about `UPDATE` and `DELETE`: **without a `WHERE` clause, they affect EVERY row in the table.** This is not a bug — it's by design. SQL is a set-based language; it operates on *sets of rows*, and without a filter, the set is "all rows."

Every database professional has a horror story about this. Someone runs `DELETE FROM users` intending to delete one user but forgetting the `WHERE` clause. Every user is gone. This is why production databases should:
1. Always preview with `SELECT` first (using the same `WHERE` clause)
2. Wrap modifications in `START TRANSACTION` ... `ROLLBACK/COMMIT`
3. Use database permissions to restrict who can run DML

#### Understanding UPSERT — INSERT + UPDATE Combined

A very common real-world need: "Insert this record if it doesn't exist; update it if it does." For example, when syncing product data from a supplier's feed. You receive 10,000 products — some are new (need INSERT), some already exist and have updated prices (need UPDATE).

Without UPSERT, you'd need to: SELECT to check if it exists → if yes, UPDATE → if no, INSERT. That's 3 queries per record, and it has race conditions in concurrent environments (two threads both see "doesn't exist" and both try to INSERT, one fails).

UPSERT (`ON DUPLICATE KEY UPDATE` in MySQL, `ON CONFLICT ... DO UPDATE` in PostgreSQL) solves this atomically in a single statement.

#### Soft Delete vs Hard Delete — A Design Decision

When you `DELETE FROM users WHERE user_id = 5`, the row is **physically removed** from disk. It's gone forever (unless you have backups). This is called a **hard delete**.

In many production systems, you never actually delete data. Instead, you **soft delete**: set a flag like `is_active = FALSE` or `deleted_at = NOW()`. The row stays in the database but is excluded from queries by adding `WHERE is_active = TRUE` to all your SELECTs. Why?

- **Audit trail** — Regulators (banking, healthcare) require you to keep records for years
- **Recovery** — Users accidentally delete things; soft delete lets you "undelete"
- **Referential integrity** — Other tables may reference this row. Hard delete either fails (due to foreign keys) or cascades dangerously

> 💡 **Trade-off:** Soft delete means your tables grow forever and queries must always filter by the active flag. Hard delete keeps tables lean but loses data permanently.

---

### INSERT Operations

#### 📝 Formal Syntax — INSERT

```
INSERT INTO <table_name> [(<column1>, <column2>, ...)]
VALUES (<value1>, <value2>, ...),
       (<value1>, <value2>, ...);              -- Multiple rows

INSERT INTO <table_name> [(<column1>, <column2>, ...)]
SELECT <columns> FROM <other_table>
[WHERE <condition>];                            -- Insert from query
```

#### 📝 Formal Syntax — UPDATE

```
UPDATE <table_name>
SET <column1> = <value1>,
    <column2> = <value2>, ...
[WHERE <condition>];                            -- ⚠️ Without WHERE, ALL rows are updated!
```

#### 📝 Formal Syntax — DELETE

```
DELETE FROM <table_name>
[WHERE <condition>];                            -- ⚠️ Without WHERE, ALL rows are deleted!
```

#### 📝 Formal Syntax — UPSERT

```
-- MySQL:
INSERT INTO <table_name> (<columns>)
VALUES (<values>)
ON DUPLICATE KEY UPDATE
    <column1> = VALUES(<column1>), ...;

-- PostgreSQL:
INSERT INTO <table_name> (<columns>)
VALUES (<values>)
ON CONFLICT (<conflict_column>)
DO UPDATE SET <column1> = EXCLUDED.<column1>, ...;
```

---

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

> **Navigation**: [< Previous](03_DDL_Creating_Structure.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_Queries_SELECT_WHERE.md)




> 🔬 **Section Challenge — Chapter 4: DML - Manipulating Data**

**Challenge 1 (Reasoning):** `DELETE FROM logs` and `TRUNCATE TABLE logs` both remove all rows. But `DELETE` on a 10M-row table takes 45 minutes while `TRUNCATE` takes 1 second. Why is the time difference so extreme? Can you ROLLBACK a TRUNCATE?
<details><summary>Answer</summary>

`DELETE` is a **row-by-row DML operation**: for each of the 10M rows, the engine (1) acquires a row-level lock, (2) writes the old row data to the **undo log** (for potential ROLLBACK), (3) writes the deletion to the **redo log** (for crash recovery), (4) fires any `ON DELETE` triggers, (5) updates all indexes that reference the row. 10M × 5 operations = extremely slow. `TRUNCATE` is a **DDL operation** — it doesn't delete rows individually. Instead, it **deallocates the data pages** (drops and recreates the table's data storage). It's like deleting a file vs. erasing every byte in the file. Key differences: (1) `TRUNCATE` resets `AUTO_INCREMENT` to 1; `DELETE` does not. (2) `TRUNCATE` does NOT fire `ON DELETE` triggers. (3) In MySQL, `TRUNCATE` is **not transactional** — you CANNOT ROLLBACK it. In PostgreSQL, `TRUNCATE` IS transactional (you can ROLLBACK). (4) `TRUNCATE` requires `DROP` privilege; `DELETE` requires `DELETE` privilege. **Production rule:** Use `DELETE` with `WHERE` for selective removal. Use `TRUNCATE` only for completely clearing staging/temp tables where you need speed and don't need rollback.
</details>

