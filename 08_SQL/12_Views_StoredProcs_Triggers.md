> **SQL Chapter 12/20** | [← Previous](11_Indexes_Performance.md) | [Index](../00_MASTER_INDEX.md) | [Next →](13_Transactions_ACID.md)

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

> ⚠️ **Warning:** Triggers are "invisible" — when you run an INSERT, you don't see that a trigger is also running behind the scenes. This makes debugging very difficult, especially when triggers call other triggers (cascading triggers). Use them sparingly, and **always document them prominently**.

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



> 🔬 **Section Challenge — Chapter 13: Stored Procedures & Functions**
>
> **Challenge 1 (Reasoning):** Why can't you use a window function in a WHERE clause? How do you filter on window function results?
> <details><summary>Answer</summary>
>
> Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
> </details>
>
> **Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
> <details><summary>Answer</summary>
>
> Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
> </details>
>

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


---

## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |


> **Navigation**: [< Previous](11_Indexes_Performance.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Transactions_ACID.md)