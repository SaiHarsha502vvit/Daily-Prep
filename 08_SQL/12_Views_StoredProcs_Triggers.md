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

**Challenge (Design):** The `ProcessOrders()` procedure above opens a cursor and loops row-by-row, running one `UPDATE` per pending order to set its priority. For 100,000 pending orders, why is this typically much slower than a set-based rewrite, and what would that rewrite look like?

<details><summary>Answer</summary>

The cursor loop pays per-row overhead 100,000 times over: each `FETCH` crosses from the cursor's internal buffer into procedure variables, each `UPDATE` is its own statement with its own optimizer pass, lock acquisition, and (depending on the engine) its own write to the transaction log — even though every iteration is doing conceptually the same operation. A set-based rewrite expresses the same logic as a single statement and lets the engine apply it to every matching row in one pass:

```sql
UPDATE orders
SET priority = CASE
    WHEN total > 10000 THEN 'high'
    WHEN total > 5000  THEN 'medium'
    ELSE 'low'
END
WHERE status = 'pending';
```

One optimizer pass, one lock-acquisition strategy for the whole batch, one log write per page instead of per row. The general rule: reach for a cursor only when a row's processing genuinely depends on a value computed from a *previous* row (running totals without window-function support, procedural state machines) — anything expressible as "for every row matching X, set Y" should be a single `UPDATE`/`INSERT`/`DELETE`, never a loop.

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

### Historical Evolution

**Predecessors (with years):**
- **IBM System R** (1974–1979): Implemented the first views as saved query definitions — a security and abstraction mechanism allowing users to see only relevant columns without exposing underlying table structure.
- **SQL-92**: Standardized CREATE VIEW, DROP VIEW, updatable views, and WITH CHECK OPTION — ensuring views could enforce domain integrity by preventing inserts/updates that would make rows invisible to the view.
- **IBM DB2** (1983): Introduced stored procedures as reusable server-side logic, embedding business rules directly in the database layer to reduce network round-trips.
- **SQL:1999**: Added triggers as part of the standard (CREATE TRIGGER syntax with BEFORE/AFTER and INSERT/UPDATE/DELETE events), enabling automatic reaction to data changes.
- **Oracle Corporation** (1990s): Popularized materialized views with query rewrite optimization — allowing the query optimizer to automatically substitute a pre-computed aggregate result for a live query, the ultimate performance optimization for analytical workloads.

**Evolution narrative:**
Views were System R's answer to a security and simplicity problem: giving users controlled access to complex joined data without exposing all underlying tables. A view is essentially a stored SELECT that the DBMS executes on demand — always fresh but never stored. Materialized views (Oracle, 1990s) took the opposite trade: pre-compute and store the result, accept stale data, gain instant reads. Trigger design in SQL:1999 was contentious — early trigger implementations varied wildly in fired timing (BEFORE vs AFTER) and recursion behavior. The WITH CHECK OPTION on views (SQL-92) was particularly important for data integrity: it prevents you from inserting a row through a view if that row wouldn't appear in the view's result — essential for enforcing `WHERE is_active = TRUE` type constraints at the database level. Stored procedures in IBM DB2 were driven by the client-server era's network costs: bundling multi-statement logic into a single network round-trip dramatically reduced latency for transaction-heavy applications. Today, views remain the primary security abstraction in enterprise databases, triggers power audit logging in regulated industries (banking, healthcare), and materialized views underpin every cloud data warehouse's pre-aggregation strategy.

**Modern practice anchor:**
Today, production systems use views for column-level security (hiding salary/SSN from application users), triggers for HIPAA/SOX audit logging in regulated industries, and materialized views (Snowflake, PostgreSQL, Oracle) to pre-compute expensive aggregations — all three abstraction mechanisms tracing directly to System R's 1974 view design and the SQL-92 standard.

### Production Reality

**Failure modes:**
1. **Trigger cascading causing invisible fires**: A `BEFORE UPDATE` trigger on `employees` that updates `department_budget` fires another trigger on `department_budget` that updates `expense_reports` — cascading 4 levels deep without any application code visible. When `expense_reports` stops accepting entries, debugging requires tracing the trigger chain manually. MySQL's `SHOW TRIGGERS` is the only visibility tool — there is no "trigger stack view".
2. **N+1 query pattern embedded inside a stored procedure**: A stored procedure loops through employees with a cursor and runs `SELECT * FROM bonuses WHERE emp_id = v_emp_id` for each row — 10,000 employees = 10,001 queries in one `CALL`. This is especially dangerous because it bypasses ORM/application-level query logging entirely — the N+1 pattern happens inside the database, invisible to the exact monitoring tools built to catch N+1 patterns in application code.
3. **Recursive trigger infinite loop**: An `AFTER UPDATE` on `accounts` updates a `balance` column which fires another trigger on the same table, creating infinite recursion until the database hits `max_sp_recursion_depth` (default 0 in MySQL, causing crash; PostgreSQL hits `1040` recursion depth by default). Left unguarded, this kind of loop can exhaust every connection in the pool within seconds, since each recursive invocation holds its transaction open until the depth limit finally aborts it.

**Debug workflow:**
1. Disable all triggers temporarily: `ALTER TABLE employees DISABLE TRIGGERS ALL;` — if the operation completes normally, a trigger is causing the issue. Re-enable one at a time to isolate the culprit.
2. For stored procedure N+1, run `SHOW PROFILES` (MySQL) or `pg_stat_statements` after calling the procedure — look for high query count from a single procedure invocation.
3. For recursive trigger loops, set `max_sp_recursion_depth = 10` (MySQL) and wrap trigger logic with a recursion guard: `IF (SELECT trigger_depth FROM trigger_context) > 5 THEN SIGNAL SQLSTATE '99999'; END IF;`

**Modern practice anchor:**
Today, stored procedures are largely replaced by application-layer logic (better testability, version control) and triggers are avoided for critical paths — production systems use event-driven pipelines (Kafka, SQS) for audit logging instead of invisible database triggers, making query behavior fully visible to application monitoring.


---

## Reality Check

**"Views are always up-to-date — they always reflect current data"** → Regular views (CREATE VIEW) are virtual — they re-run the underlying query each time the view is queried. They ARE always current. Materialized views (PostgreSQL, Oracle, SQL Server with indexed views): stored query results on disk. They are NOT automatically updated when base tables change — you must `REFRESH MATERIALIZED VIEW` manually, or use auto-refresh (some databases support this). Using a materialized view with stale data without knowing it is a common production data quality bug.

**"You can always update data through a view"** → Simple views (single table, no aggregation, no DISTINCT, no GROUP BY, no HAVING, no set operations) are typically updatable. Complex views are not. PostgreSQL rules: a view is updatable if it references exactly one table/view, has no aggregate/window functions, no DISTINCT/GROUP BY/HAVING, no set operations (UNION/INTERSECT/EXCEPT), no limit/offset. For non-updatable views, use `INSTEAD OF` triggers to intercept DML. SQL Server uses `INSTEAD OF` triggers similarly for updating through complex views.

**"Triggers are a good way to maintain audit logs"** → Triggers CAN maintain audit logs but with caveats: trigger fires in the same transaction as the DML — if the transaction rolls back, the trigger's audit log insert also rolls back (you lose the audit trail of the failed operation, which might be useful). For audit logging that survives rollbacks: use PostgreSQL's `pg_audit` extension, the database's own audit logging, or application-level logging to a separate system. For audit logs that must capture the attempt (not just the success), trigger-based audit logs are insufficient.

**"A stored procedure call is always faster than equivalent application code"** → Stored procedures reduce network round trips (send one call, get one result vs send N queries). But: stored procedures run in the database server's process, using the database's CPU (which may be a shared resource). Complex procedural logic in stored procedures can be slower than the same logic in application code (a well-optimized JVM with JIT is often faster for CPU work than the database's procedural language interpreter). Use stored procedures for: data-intensive operations, reducing round trips, atomically combining multiple related operations. Use application code for: complex business logic, string manipulation, external API calls.

**"DROP VIEW is the same as DROP TABLE for cleanup"** → Dropping a view is safe — it removes the view definition, not the underlying data. Views have no data of their own. `DROP VIEW` is always reversible (re-create the view). `DROP TABLE` is irreversible (destroys data) without a backup. `DROP MATERIALIZED VIEW` destroys the materialized (cached) data, but the underlying tables are untouched — safe. Always know whether you're dropping a view (safe) or a table (dangerous) when running cleanup scripts.
