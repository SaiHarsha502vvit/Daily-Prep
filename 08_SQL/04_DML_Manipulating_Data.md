> **SQL Chapter 04/20** | [← Previous](03_DDL_Creating_Structure.md) | [Index](../00_MASTER_INDEX.md) | [Next →](05_Queries_SELECT_WHERE.md)

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

