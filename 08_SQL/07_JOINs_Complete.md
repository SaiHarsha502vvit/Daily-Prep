> **SQL Chapter 07/20** | [← Previous](06_Aggregations_GroupBy.md) | [Index](../00_MASTER_INDEX.md) | [Next →](08_Subqueries_CTEs.md)

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

