**SQL Chapter 12/20** | [← Previous](11_Indexes_Performance.md) | [Index](../00_MASTER_INDEX.md) | [Next →](13_Transactions_ACID.md)

---

## Chapter 12: Views & Materialized Views

### 🧠 Understanding Database Abstraction Layers

This chapter covers three ways to encapsulate logic directly in the database: **Views**, **Stored Procedures**, and **Triggers**. Each serves a different purpose, but they share a common philosophy: **push logic as close to the data as possible**.

#### Views — Virtual Tables That Simplify Complex Queries

A view is a **saved query** that behaves like a table. You define it once, and then query it by name. Why is this useful?

1. **Simplification** — Instead of writing a 15-line JOIN query every time you need employee details with department names and manager names, create a view and query it as `SELECT * FROM employee_details`.
2. **Security** — Views can hide sensitive columns. Give users access to a view that excludes `salary` and `ssn`, without giving them access to the underlying table.
3. **Consistency** — If the business definition of "active employee" is `WHERE is_active = TRUE AND termination_date IS NULL`, define it once in a view. Every query uses the same definition.

**Regular View vs Materialized View:**
- A **regular view** stores no data — it re-executes the underlying query every time you query the view. Fast to create, always up-to-date, but query performance depends on the underlying complexity.
- A **materialized view** physically stores the query result on disk, like a cached table. Reading is instant, but the data can become stale. You must explicitly `REFRESH` it. Use for expensive aggregations that don't need real-time accuracy (dashboards, reports).

#### Stored Procedures & Functions — Logic in the Database

Stored procedures encapsulate multi-step operations as reusable, callable units in the database. The key difference:
- **Function** → returns a single value, can be used inside SELECT statements (like `SELECT CalculateTax(price) FROM products`)
- **Procedure** → can perform multiple operations (INSERT, UPDATE, DELETE, control flow), called with `CALL`

#### Triggers — Automatic Reactions to Data Changes

Triggers are code that fires **automatically** when a specific event occurs (INSERT, UPDATE, DELETE). They're powerful for audit logging and enforcing business rules, but come with serious caveats:

⚠️ **Warning:** Triggers are "invisible" — when you run an INSERT, you don't see that a trigger is also running behind the scenes. This makes debugging very difficult, especially when triggers call other triggers (cascading triggers). Use them sparingly, and **always document them prominently**.

---

```sql
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



🔬 **Section Challenge — Chapter 13: Stored Procedures & Functions**



**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


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

