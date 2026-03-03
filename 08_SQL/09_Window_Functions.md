> **SQL Chapter 09/20** | [← Previous](08_Subqueries_CTEs.md) | [Index](../00_MASTER_INDEX.md) | [Next →](10_Normalization.md)

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



---

# ═══════════════════════════════════════════════════════════════════
# MERGED FROM: 02_SQL_Data_Analysis.md (WHY-HOW Framework Edition)
# ═══════════════════════════════════════════════════════════════════

# 📊 SQL FOR DATA ANALYSIS - Complete Guide

> **From Analyst Queries to Data Engineering Patterns**
> _"Turn raw data into business insights with SQL mastery"_

---

# 🎯 DATA ANALYST SQL JOURNEY

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    DATA ANALYST SQL SKILLSET                                     ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Level 1: BASIC QUERIES (Week 1-2)                                               ║
║  ├── SELECT, WHERE, ORDER BY, LIMIT                                              ║
║  ├── Comparison & Logical Operators                                              ║
║  └── Basic filtering and sorting                                                 ║
║                                                                                   ║
║  Level 2: AGGREGATIONS (Week 3-4)                                                ║
║  ├── GROUP BY, HAVING                                                            ║
║  ├── COUNT, SUM, AVG, MIN, MAX                                                   ║
║  └── Aggregate with conditions                                                   ║
║                                                                                   ║
║  Level 3: JOINS (Week 5-6)                                                       ║
║  ├── INNER, LEFT, RIGHT, FULL JOIN                                               ║
║  ├── Self Joins, Cross Joins                                                     ║
║  └── Multiple table combinations                                                 ║
║                                                                                   ║
║  Level 4: SUBQUERIES & CTEs (Week 7-8)                                           ║
║  ├── Scalar subqueries                                                           ║
║  ├── Correlated subqueries                                                       ║
║  └── Common Table Expressions                                                    ║
║                                                                                   ║
║  Level 5: WINDOW FUNCTIONS (Week 9-10)                                           ║
║  ├── ROW_NUMBER, RANK, DENSE_RANK                                                ║
║  ├── LAG, LEAD, FIRST_VALUE                                                      ║
║  └── Running totals, Moving averages                                             ║
║                                                                                   ║
║  Level 6: ADVANCED ANALYTICS (Week 11-12)                                        ║
║  ├── PIVOT/UNPIVOT                                                               ║
║  ├── Cohort analysis                                                             ║
║  └── Funnel analysis                                                             ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# PART 1: JOINS - THE FOUNDATION OF DATA ANALYSIS

---

## Chapter 1: Understanding JOINs

### 🔵 WHY: Why JOINs Exist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY DATA IS SPLIT INTO MULTIPLE TABLES                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  THE PROBLEM: Storing Everything in One Table                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  orders_denormalized:                                                      ││
│  │  ┌───────────────────────────────────────────────────────────────────┐    ││
│  │  │ order_id │ customer_name │ customer_email │ product_name │ price │    ││
│  │  ├──────────┼───────────────┼────────────────┼──────────────┼───────┤    ││
│  │  │ 1        │ John Doe      │ john@email.com │ iPhone 15    │ 999   │    ││
│  │  │ 2        │ John Doe      │ john@email.com │ AirPods      │ 199   │    ││
│  │  │ 3        │ John Doe      │ john@email.com │ MacBook Pro  │ 2499  │    ││
│  │  │ 4        │ Jane Smith    │ jane@email.com │ iPhone 15    │ 999   │    ││
│  │  └───────────────────────────────────────────────────────────────────┘    ││
│  │                                                                            ││
│  │  PROBLEMS:                                                                 ││
│  │  1. REDUNDANCY: "John Doe" and "john@email.com" stored 3 times            ││
│  │  2. UPDATE ANOMALY: John changes email → must update ALL rows             ││
│  │  3. STORAGE WASTE: Customer info repeated with every order                ││
│  │  4. INCONSISTENCY: What if one row has typo "john@emal.com"?              ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  THE SOLUTION: Normalized Tables with JOINs                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  customers:                    orders:                                     ││
│  │  ┌─────────────────────────┐   ┌──────────────────────────────┐           ││
│  │  │ id │ name      │ email │   │ id │ customer_id │ product_id │           ││
│  │  ├────┼───────────┼───────┤   ├────┼─────────────┼────────────┤           ││
│  │  │ 1  │ John Doe  │ john@ │   │ 1  │ 1           │ 101        │           ││
│  │  │ 2  │ Jane Smith│ jane@ │   │ 2  │ 1           │ 102        │           ││
│  │  └─────────────────────────┘   │ 3  │ 1           │ 103        │           ││
│  │                                │ 4  │ 2           │ 101        │           ││
│  │                                └──────────────────────────────┘           ││
│  │                                                                            ││
│  │  BENEFITS:                                                                 ││
│  │  ✓ No redundancy - customer info stored ONCE                              ││
│  │  ✓ Update in one place - changes propagate automatically                  ││
│  │  ✓ Less storage - only IDs repeated, not full data                        ││
│  │  ✓ Data integrity - single source of truth                                ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  BUT: To get complete information, we need JOIN!                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Visual: All JOIN Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JOIN TYPES - VISUAL GUIDE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Sample Data:                                                                   │
│                                                                                  │
│  customers:                          orders:                                    │
│  ┌────┬───────────┐                  ┌────┬─────────────┬───────┐              │
│  │ id │ name      │                  │ id │ customer_id │ total │              │
│  ├────┼───────────┤                  ├────┼─────────────┼───────┤              │
│  │ 1  │ Alice     │                  │ 1  │ 1           │ 100   │              │
│  │ 2  │ Bob       │                  │ 2  │ 1           │ 200   │              │
│  │ 3  │ Charlie   │ ← No orders      │ 3  │ 2           │ 150   │              │
│  └────┴───────────┘                  │ 4  │ 4           │ 300   │ ← No customer│
│                                      └────┴─────────────┴───────┘              │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│  1. INNER JOIN - Only matching rows                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │   SELECT * FROM customers c INNER JOIN orders o ON c.id = o.customer_id │   │
│  │                                                                         │   │
│  │   Result:                                                               │   │
│  │   ┌────┬───────┬──────────┬─────────────┬───────┐                       │   │
│  │   │ id │ name  │ order_id │ customer_id │ total │                       │   │
│  │   ├────┼───────┼──────────┼─────────────┼───────┤                       │   │
│  │   │ 1  │ Alice │ 1        │ 1           │ 100   │                       │   │
│  │   │ 1  │ Alice │ 2        │ 1           │ 200   │                       │   │
│  │   │ 2  │ Bob   │ 3        │ 2           │ 150   │                       │   │
│  │   └────┴───────┴──────────┴─────────────┴───────┘                       │   │
│  │                                                                         │   │
│  │   Note: Charlie excluded (no orders), Order 4 excluded (no customer)    │   │
│  │                                                                         │   │
│  │   Visual:  ┌─────┐ ┌─────┐                                              │   │
│  │            │ A   │█│ B   │   Only intersection                          │   │
│  │            └─────┘ └─────┘                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│  2. LEFT JOIN - All from left + matching from right                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │   SELECT * FROM customers c LEFT JOIN orders o ON c.id = o.customer_id  │   │
│  │                                                                         │   │
│  │   Result:                                                               │   │
│  │   ┌────┬─────────┬──────────┬─────────────┬───────┐                     │   │
│  │   │ id │ name    │ order_id │ customer_id │ total │                     │   │
│  │   ├────┼─────────┼──────────┼─────────────┼───────┤                     │   │
│  │   │ 1  │ Alice   │ 1        │ 1           │ 100   │                     │   │
│  │   │ 1  │ Alice   │ 2        │ 1           │ 200   │                     │   │
│  │   │ 2  │ Bob     │ 3        │ 2           │ 150   │                     │   │
│  │   │ 3  │ Charlie │ NULL     │ NULL        │ NULL  │  ← Included!       │   │
│  │   └────┴─────────┴──────────┴─────────────┴───────┘                     │   │
│  │                                                                         │   │
│  │   Visual:  ┌─────┐ ┌─────┐                                              │   │
│  │            │█████│█│     │   All of A + intersection                    │   │
│  │            └─────┘ └─────┘                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│  3. RIGHT JOIN - All from right + matching from left                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │   SELECT * FROM customers c RIGHT JOIN orders o ON c.id = o.customer_id │   │
│  │                                                                         │   │
│  │   Result:                                                               │   │
│  │   ┌──────┬───────┬──────────┬─────────────┬───────┐                     │   │
│  │   │ id   │ name  │ order_id │ customer_id │ total │                     │   │
│  │   ├──────┼───────┼──────────┼─────────────┼───────┤                     │   │
│  │   │ 1    │ Alice │ 1        │ 1           │ 100   │                     │   │
│  │   │ 1    │ Alice │ 2        │ 1           │ 200   │                     │   │
│  │   │ 2    │ Bob   │ 3        │ 2           │ 150   │                     │   │
│  │   │ NULL │ NULL  │ 4        │ 4           │ 300   │  ← Orphan order    │   │
│  │   └──────┴───────┴──────────┴─────────────┴───────┘                     │   │
│  │                                                                         │   │
│  │   Visual:  ┌─────┐ ┌─────┐                                              │   │
│  │            │     │█│█████│   Intersection + all of B                    │   │
│  │            └─────┘ └─────┘                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                  │
│  4. FULL OUTER JOIN - All from both tables                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │   SELECT * FROM customers c FULL JOIN orders o ON c.id = o.customer_id  │   │
│  │                                                                         │   │
│  │   Result:                                                               │   │
│  │   ┌──────┬─────────┬──────────┬─────────────┬───────┐                   │   │
│  │   │ id   │ name    │ order_id │ customer_id │ total │                   │   │
│  │   ├──────┼─────────┼──────────┼─────────────┼───────┤                   │   │
│  │   │ 1    │ Alice   │ 1        │ 1           │ 100   │                   │   │
│  │   │ 1    │ Alice   │ 2        │ 1           │ 200   │                   │   │
│  │   │ 2    │ Bob     │ 3        │ 2           │ 150   │                   │   │
│  │   │ 3    │ Charlie │ NULL     │ NULL        │ NULL  │ ← No orders      │   │
│  │   │ NULL │ NULL    │ 4        │ 4           │ 300   │ ← No customer    │   │
│  │   └──────┴─────────┴──────────┴─────────────┴───────┘                   │   │
│  │                                                                         │   │
│  │   Visual:  ┌─────┐ ┌─────┐                                              │   │
│  │            │█████│█│█████│   Everything from both                       │   │
│  │            └─────┘ └─────┘                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: JOIN Syntax and Patterns

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- JOIN PATTERNS FOR DATA ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAMPLE DATABASE: E-commerce Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

-- Setup: Tables we'll be joining
/*
customers (customer_id, name, email, city, signup_date)
orders (order_id, customer_id, order_date, total, status)
order_items (item_id, order_id, product_id, quantity, price)
products (product_id, name, category, price, cost)
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC JOIN PATTERNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Pattern 1: Customer with their orders
SELECT 
    c.name AS customer_name,
    c.email,
    o.order_id,
    o.order_date,
    o.total
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
ORDER BY c.name, o.order_date;

-- Pattern 2: Find customers WITHOUT orders (LEFT JOIN + NULL check)
-- WHY: Identify inactive customers for marketing campaigns
SELECT 
    c.customer_id,
    c.name,
    c.email,
    c.signup_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;  -- No matching order

-- Pattern 3: Order details with product information
SELECT 
    o.order_id,
    o.order_date,
    p.name AS product_name,
    p.category,
    oi.quantity,
    oi.price AS unit_price,
    (oi.quantity * oi.price) AS line_total
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
ORDER BY o.order_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SELF JOIN - Table Joined to Itself
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY: When a table has relationships within itself
-- Example: Employee-Manager hierarchy

/*
employees:
| emp_id | name    | manager_id |
|--------|---------|------------|
| 1      | CEO     | NULL       |
| 2      | VP Eng  | 1          |
| 3      | Dev     | 2          |
| 4      | VP Sales| 1          |
*/

-- Get employee with manager name
SELECT 
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- Result:
-- | employee | manager |
-- |----------|---------|
-- | CEO      | NULL    |
-- | VP Eng   | CEO     |
-- | Dev      | VP Eng  |
-- | VP Sales | CEO     |

-- Find employees who manage others
SELECT DISTINCT 
    m.emp_id,
    m.name AS manager_name,
    COUNT(e.emp_id) AS direct_reports
FROM employees m
INNER JOIN employees e ON m.emp_id = e.manager_id
GROUP BY m.emp_id, m.name;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. MULTIPLE JOINs - Real Analytics Query
-- ═══════════════════════════════════════════════════════════════════════════════

-- Complete sales analysis: Customer → Order → Items → Products
SELECT 
    c.name AS customer,
    c.city,
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    p.category,
    COUNT(DISTINCT o.order_id) AS num_orders,
    SUM(oi.quantity) AS total_items,
    SUM(oi.quantity * oi.price) AS revenue,
    SUM(oi.quantity * (oi.price - p.cost)) AS profit
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND o.order_date >= '2024-01-01'
GROUP BY c.customer_id, c.name, c.city, 
         DATE_FORMAT(o.order_date, '%Y-%m'), p.category
ORDER BY revenue DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. JOIN vs SUBQUERY Performance
-- ═══════════════════════════════════════════════════════════════════════════════

-- TASK: Find customers who placed orders in January 2024

-- Approach 1: JOIN (usually faster)
SELECT DISTINCT c.customer_id, c.name
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date BETWEEN '2024-01-01' AND '2024-01-31';

-- Approach 2: EXISTS (good for checking existence)
SELECT c.customer_id, c.name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = c.customer_id
      AND o.order_date BETWEEN '2024-01-01' AND '2024-01-31'
);

-- Approach 3: IN (avoid for large subqueries)
SELECT c.customer_id, c.name
FROM customers c
WHERE c.customer_id IN (
    SELECT customer_id FROM orders
    WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31'
);

-- PERFORMANCE RULE:
-- JOIN → Best for returning columns from multiple tables
-- EXISTS → Best for checking if related data exists
-- IN → Fine for small lists, avoid for large subqueries
```

---

# PART 2: AGGREGATE FUNCTIONS & GROUP BY

---

## Chapter 2: Summarizing Data

### 🔵 WHY: From Raw Data to Insights

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY AGGREGATIONS MATTER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RAW DATA (1 million rows):                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ order_id │ customer_id │ product_id │ quantity │ price │ order_date        ││
│  │ 1        │ 1001        │ 501        │ 2        │ 29.99 │ 2024-01-15        ││
│  │ 2        │ 1002        │ 502        │ 1        │ 49.99 │ 2024-01-15        ││
│  │ 3        │ 1001        │ 503        │ 3        │ 19.99 │ 2024-01-16        ││
│  │ ... 999,997 more rows ...                                                  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  CEO asks: "How is the business doing?"                                         │
│  You can't show 1 million rows!                                                 │
│                                                                                  │
│  AGGREGATED INSIGHT:                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  📊 EXECUTIVE DASHBOARD - January 2024                                     ││
│  │                                                                            ││
│  │  Total Revenue:     $2,345,678                                             ││
│  │  Total Orders:      45,231                                                 ││
│  │  Avg Order Value:   $51.87                                                 ││
│  │  Top Category:      Electronics (35% of revenue)                           ││
│  │  Top City:          Mumbai (12% of orders)                                 ││
│  │  Growth vs Dec:     +15%                                                   ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  This is the power of AGGREGATION!                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: Complete Aggregation Guide

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- AGGREGATE FUNCTIONS REFERENCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC AGGREGATE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- COUNT: Number of rows/values
SELECT 
    COUNT(*) AS total_rows,           -- All rows (including NULL)
    COUNT(customer_id) AS non_null,   -- Non-NULL values only
    COUNT(DISTINCT customer_id) AS unique_customers  -- Unique values
FROM orders;

-- SUM: Total of numeric column
SELECT SUM(total) AS total_revenue FROM orders WHERE status = 'completed';

-- AVG: Average value
SELECT AVG(total) AS avg_order_value FROM orders;

-- MIN/MAX: Smallest/Largest value
SELECT 
    MIN(order_date) AS first_order,
    MAX(order_date) AS last_order,
    MIN(total) AS smallest_order,
    MAX(total) AS largest_order
FROM orders;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. GROUP BY - Aggregate by Categories
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sales by category
SELECT 
    p.category,
    COUNT(*) AS num_orders,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.price) AS revenue,
    AVG(oi.price) AS avg_price
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY revenue DESC;

-- Sales by month
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*) AS orders,
    SUM(total) AS revenue,
    AVG(total) AS avg_order
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;

-- Multiple GROUP BY columns
SELECT 
    c.city,
    p.category,
    COUNT(*) AS orders,
    SUM(oi.quantity * oi.price) AS revenue
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY c.city, p.category
ORDER BY c.city, revenue DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. HAVING - Filter Aggregated Results
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHERE vs HAVING:
-- WHERE: Filters ROWS before aggregation
-- HAVING: Filters GROUPS after aggregation

-- Find high-value customers (spent > ₹10,000)
SELECT 
    c.customer_id,
    c.name,
    COUNT(*) AS order_count,
    SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status = 'completed'        -- WHERE: filter rows first
GROUP BY c.customer_id, c.name
HAVING SUM(o.total) > 10000         -- HAVING: filter groups after
ORDER BY total_spent DESC;

-- Find products with low sales (need restock review)
SELECT 
    p.product_id,
    p.name,
    COUNT(oi.item_id) AS times_ordered,
    SUM(oi.quantity) AS units_sold
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name
HAVING SUM(oi.quantity) < 10 OR SUM(oi.quantity) IS NULL
ORDER BY units_sold;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CONDITIONAL AGGREGATION (CASE in Aggregate)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single query for multiple metrics
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded,
    ROUND(
        100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) AS completion_rate
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;

-- Revenue breakdown by category
SELECT 
    DATE_FORMAT(o.order_date, '%Y-%m') AS month,
    SUM(CASE WHEN p.category = 'Electronics' THEN oi.quantity * oi.price ELSE 0 END) AS electronics_rev,
    SUM(CASE WHEN p.category = 'Clothing' THEN oi.quantity * oi.price ELSE 0 END) AS clothing_rev,
    SUM(CASE WHEN p.category = 'Books' THEN oi.quantity * oi.price ELSE 0 END) AS books_rev,
    SUM(oi.quantity * oi.price) AS total_rev
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY month;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. STRING AGGREGATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL: GROUP_CONCAT
-- List all products in each order
SELECT 
    o.order_id,
    o.order_date,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS products
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY o.order_id, o.order_date;

-- PostgreSQL: STRING_AGG
SELECT 
    o.order_id,
    o.order_date,
    STRING_AGG(p.name, ', ' ORDER BY p.name) AS products
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY o.order_id, o.order_date;
```

---

# PART 3: WINDOW FUNCTIONS - ADVANCED ANALYTICS

---

## Chapter 3: Analytics Superpowers

### 🔵 WHY: Beyond GROUP BY

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY WINDOW FUNCTIONS EXIST                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  THE LIMITATION OF GROUP BY:                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  Original Data:                  After GROUP BY:                           ││
│  │  ┌─────────────────────┐         ┌────────────────┐                        ││
│  │  │ emp │ dept │ salary│         │ dept │ avg_sal │                        ││
│  │  ├─────┼──────┼───────┤         ├──────┼─────────┤                        ││
│  │  │ A   │ IT   │ 60000 │ ──────→ │ IT   │ 65000   │                        ││
│  │  │ B   │ IT   │ 70000 │         │ HR   │ 50000   │                        ││
│  │  │ C   │ HR   │ 50000 │         └────────────────┘                        ││
│  │  └─────────────────────┘                                                   ││
│  │                                                                            ││
│  │  PROBLEM: We lost individual employee details!                             ││
│  │  - Can't compare each employee to department average                       ││
│  │  - Can't see employee name alongside department total                      ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  WINDOW FUNCTIONS SOLUTION:                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  SELECT emp, dept, salary,                                                 ││
│  │         AVG(salary) OVER (PARTITION BY dept) AS dept_avg                  ││
│  │  FROM employees;                                                           ││
│  │                                                                            ││
│  │  Result: Keep ALL rows + add aggregate                                     ││
│  │  ┌─────────────────────────────────────┐                                  ││
│  │  │ emp │ dept │ salary │ dept_avg      │                                  ││
│  │  ├─────┼──────┼────────┼───────────────┤                                  ││
│  │  │ A   │ IT   │ 60000  │ 65000         │  ← Each row has its own salary   ││
│  │  │ B   │ IT   │ 70000  │ 65000         │    PLUS the department average   ││
│  │  │ C   │ HR   │ 50000  │ 50000         │                                  ││
│  │  └─────────────────────────────────────┘                                  ││
│  │                                                                            ││
│  │  NOW YOU CAN:                                                              ││
│  │  - Compare each employee to their department average                       ││
│  │  - Rank employees within departments                                       ││
│  │  - Calculate running totals                                                ││
│  │  - Find previous/next values                                               ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  🔴 REAL USE CASE: Netflix's Content Analytics                                  │
│                                                                                  │
│  - Rank shows by viewership within each genre                                   │
│  - Calculate running total of watch hours                                       │
│  - Find viewership change from previous week                                    │
│  - Identify top 10% performing content per region                              │
│                                                                                  │
│  All require WINDOW FUNCTIONS!                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: Window Functions Complete Guide

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- WINDOW FUNCTIONS SYNTAX
-- ═══════════════════════════════════════════════════════════════════════════════

/*
function_name() OVER (
    [PARTITION BY column(s)]   -- Optional: Group rows into partitions
    [ORDER BY column(s)]       -- Optional: Define order within partition
    [ROWS/RANGE frame]         -- Optional: Define window frame
)
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. RANKING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ROW_NUMBER: Unique sequential number
-- RANK: Same rank for ties, gaps after
-- DENSE_RANK: Same rank for ties, no gaps

SELECT 
    name,
    department,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
    RANK() OVER (ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank_num
FROM employees;

/*
| name  | dept | salary | row_num | rank_num | dense_rank_num |
|-------|------|--------|---------|----------|----------------|
| Alice | IT   | 80000  | 1       | 1        | 1              |
| Bob   | HR   | 75000  | 2       | 2        | 2              |
| Carol | IT   | 75000  | 3       | 2        | 2              | ← Same salary
| Dave  | HR   | 70000  | 4       | 4        | 3              | ← RANK skips to 4, DENSE_RANK goes to 3
*/

-- Rank within each department (PARTITION BY)
SELECT 
    name,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;

-- NTILE: Divide into N equal groups (quartiles, deciles)
SELECT 
    customer_id,
    total_spent,
    NTILE(4) OVER (ORDER BY total_spent) AS spending_quartile
FROM customer_lifetime_value;
-- Quartile 1 = Bottom 25%, Quartile 4 = Top 25%

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. LAG and LEAD: Access Previous/Next Rows
-- ═══════════════════════════════════════════════════════════════════════════════

-- Month-over-month comparison
SELECT 
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
    revenue - LAG(revenue) OVER (ORDER BY month) AS revenue_change,
    ROUND(
        100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / 
        LAG(revenue) OVER (ORDER BY month), 
        2
    ) AS pct_change
FROM monthly_revenue;

/*
| month   | revenue | prev_month | change | pct_change |
|---------|---------|------------|--------|------------|
| 2024-01 | 100000  | NULL       | NULL   | NULL       |
| 2024-02 | 120000  | 100000     | 20000  | 20.00      |
| 2024-03 | 115000  | 120000     | -5000  | -4.17      |
*/

-- LEAD: Look ahead
SELECT 
    employee_id,
    name,
    hire_date,
    LEAD(hire_date) OVER (ORDER BY hire_date) AS next_hire_date,
    DATEDIFF(
        LEAD(hire_date) OVER (ORDER BY hire_date), 
        hire_date
    ) AS days_until_next_hire
FROM employees;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. RUNNING TOTALS and MOVING AVERAGES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Running total (cumulative sum)
SELECT 
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total RESET each month (PARTITION BY)
SELECT 
    order_date,
    total,
    SUM(total) OVER (
        PARTITION BY DATE_FORMAT(order_date, '%Y-%m')
        ORDER BY order_date
    ) AS monthly_running_total
FROM orders;

-- 7-day moving average
SELECT 
    order_date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM daily_sales;

-- 3-day moving average (centered)
SELECT 
    order_date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) AS moving_avg_centered
FROM daily_sales;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. FIRST_VALUE, LAST_VALUE, NTH_VALUE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find first order date for each customer
SELECT 
    customer_id,
    order_id,
    order_date,
    FIRST_VALUE(order_date) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS first_order_date,
    DATEDIFF(order_date, FIRST_VALUE(order_date) OVER (
        PARTITION BY customer_id ORDER BY order_date
    )) AS days_since_first_order
FROM orders;

-- Compare each sale to the day's first and highest sale
SELECT 
    sale_time,
    amount,
    FIRST_VALUE(amount) OVER (ORDER BY sale_time) AS first_sale,
    MAX(amount) OVER () AS highest_sale,
    amount - FIRST_VALUE(amount) OVER (ORDER BY sale_time) AS diff_from_first
FROM sales;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PERCENT_RANK and CUME_DIST: Percentile Analysis
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find percentile of each customer's spending
SELECT 
    customer_id,
    total_spent,
    ROUND(PERCENT_RANK() OVER (ORDER BY total_spent) * 100, 2) AS percentile,
    ROUND(CUME_DIST() OVER (ORDER BY total_spent) * 100, 2) AS cumulative_dist
FROM customer_lifetime_value;

/*
| customer_id | total_spent | percentile | cumulative_dist |
|-------------|-------------|------------|-----------------|
| 1001        | 500         | 0.00       | 20.00           | ← Bottom
| 1002        | 1000        | 25.00      | 40.00           |
| 1003        | 1500        | 50.00      | 60.00           |
| 1004        | 2000        | 75.00      | 80.00           |
| 1005        | 5000        | 100.00     | 100.00          | ← Top
*/

-- Identify top 10% customers
WITH ranked_customers AS (
    SELECT 
        customer_id,
        total_spent,
        PERCENT_RANK() OVER (ORDER BY total_spent) AS percentile
    FROM customer_lifetime_value
)
SELECT * FROM ranked_customers WHERE percentile >= 0.90;
```

---

# PART 4: COMMON TABLE EXPRESSIONS (CTEs)

---

## Chapter 4: Readable Complex Queries

### 🔵 WHY: Managing Query Complexity

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY CTEs EXIST                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  THE PROBLEM: Nested Subqueries are Hard to Read                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  -- Find customers whose orders are above average order value              ││
│  │  -- Then show their spending rank                                          ││
│  │                                                                            ││
│  │  SELECT customer_id, name, total_spent, rank_num FROM (                   ││
│  │      SELECT c.customer_id, c.name, total_spent,                           ││
│  │             RANK() OVER (ORDER BY total_spent DESC) as rank_num           ││
│  │      FROM customers c                                                      ││
│  │      JOIN (                                                                ││
│  │          SELECT customer_id, SUM(total) as total_spent                    ││
│  │          FROM orders                                                       ││
│  │          WHERE total > (                                                   ││
│  │              SELECT AVG(total) FROM orders                                 ││
│  │          )                                                                 ││
│  │          GROUP BY customer_id                                              ││
│  │      ) o ON c.customer_id = o.customer_id                                  ││
│  │  ) ranked WHERE rank_num <= 10;                                            ││
│  │                                                                            ││
│  │  PROBLEMS:                                                                 ││
│  │  - Hard to understand flow                                                 ││
│  │  - Difficult to debug                                                      ││
│  │  - Can't reuse subquery results                                            ││
│  │  - Reading order: inside-out                                               ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  THE SOLUTION: CTEs Make it Readable                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  WITH avg_order AS (                                                       ││
│  │      SELECT AVG(total) as avg_total FROM orders                           ││
│  │  ),                                                                        ││
│  │  high_value_orders AS (                                                    ││
│  │      SELECT customer_id, SUM(total) as total_spent                        ││
│  │      FROM orders                                                           ││
│  │      WHERE total > (SELECT avg_total FROM avg_order)                      ││
│  │      GROUP BY customer_id                                                  ││
│  │  ),                                                                        ││
│  │  ranked_customers AS (                                                     ││
│  │      SELECT c.customer_id, c.name, h.total_spent,                         ││
│  │             RANK() OVER (ORDER BY total_spent DESC) as rank_num           ││
│  │      FROM customers c                                                      ││
│  │      JOIN high_value_orders h ON c.customer_id = h.customer_id            ││
│  │  )                                                                        ││
│  │  SELECT * FROM ranked_customers WHERE rank_num <= 10;                     ││
│  │                                                                            ││
│  │  BENEFITS:                                                                 ││
│  │  ✓ Top-to-bottom reading flow                                             ││
│  │  ✓ Each step has meaningful name                                          ││
│  │  ✓ Easy to debug each CTE separately                                      ││
│  │  ✓ Reuse CTEs multiple times                                              ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🟢 HOW: CTE Patterns

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CTE PATTERNS FOR DATA ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BASIC CTE
-- ═══════════════════════════════════════════════════════════════════════════════

WITH monthly_revenue AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT 
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    revenue - LAG(revenue) OVER (ORDER BY month) AS change
FROM monthly_revenue
ORDER BY month;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. MULTIPLE CTEs (Building Blocks)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Analysis: Customer Segmentation by Recency, Frequency, Monetary (RFM)

WITH customer_orders AS (
    -- Step 1: Get order summary per customer
    SELECT 
        customer_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_spent,
        MAX(order_date) AS last_order_date
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
),
rfm_scores AS (
    -- Step 2: Calculate RFM scores (1-5 scale)
    SELECT 
        customer_id,
        order_count,
        total_spent,
        last_order_date,
        NTILE(5) OVER (ORDER BY last_order_date) AS recency_score,      -- Higher = more recent
        NTILE(5) OVER (ORDER BY order_count) AS frequency_score,        -- Higher = more orders
        NTILE(5) OVER (ORDER BY total_spent) AS monetary_score          -- Higher = more spent
    FROM customer_orders
),
customer_segments AS (
    -- Step 3: Create segments based on RFM
    SELECT 
        customer_id,
        order_count,
        total_spent,
        recency_score,
        frequency_score,
        monetary_score,
        recency_score + frequency_score + monetary_score AS total_score,
        CASE
            WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
            WHEN recency_score >= 3 AND frequency_score >= 3 THEN 'Loyal Customers'
            WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'New Customers'
            WHEN recency_score <= 2 AND frequency_score >= 4 THEN 'At Risk'
            WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Lost'
            ELSE 'Average'
        END AS segment
    FROM rfm_scores
)
-- Step 4: Final output with customer names
SELECT 
    c.customer_id,
    c.name,
    c.email,
    cs.segment,
    cs.order_count,
    cs.total_spent,
    cs.recency_score,
    cs.frequency_score,
    cs.monetary_score
FROM customer_segments cs
JOIN customers c ON cs.customer_id = c.customer_id
ORDER BY cs.total_score DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. RECURSIVE CTE - Hierarchical Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- WHY: Traverse tree structures (org charts, categories, file systems)

-- Example: Employee hierarchy
WITH RECURSIVE org_hierarchy AS (
    -- Base case: Start from CEO (no manager)
    SELECT 
        emp_id,
        name,
        manager_id,
        1 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: Find employees who report to current level
    SELECT 
        e.emp_id,
        e.name,
        e.manager_id,
        h.level + 1,
        CONCAT(h.path, ' > ', e.name)
    FROM employees e
    INNER JOIN org_hierarchy h ON e.manager_id = h.emp_id
)
SELECT * FROM org_hierarchy ORDER BY path;

/*
| emp_id | name     | level | path                          |
|--------|----------|-------|-------------------------------|
| 1      | CEO      | 1     | CEO                           |
| 2      | VP Eng   | 2     | CEO > VP Eng                  |
| 3      | Dev Lead | 3     | CEO > VP Eng > Dev Lead       |
| 4      | Dev      | 4     | CEO > VP Eng > Dev Lead > Dev |
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CTE vs Subquery vs Temp Table
-- ═══════════════════════════════════════════════════════════════════════════════

/*
USE CTE WHEN:
- Need readable, maintainable query
- Need to reference result multiple times in same query
- Building complex query step by step
- Need recursive query

USE SUBQUERY WHEN:
- Simple one-time use
- Single value comparison (scalar subquery)
- EXISTS/IN checks

USE TEMP TABLE WHEN:
- Need to reference in multiple separate queries
- Need indexes on intermediate result
- Large intermediate result (performance)
- Need to debug in steps
*/
```

---

# PART 5: REAL-WORLD ANALYTICS QUERIES

---

## Chapter 5: Data Analyst Common Tasks

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- REAL ANALYTICS QUERIES DATA ANALYSTS USE DAILY
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. COHORT ANALYSIS - User Retention
-- ═══════════════════════════════════════════════════════════════════════════════

-- Track how users who signed up in each month behave over time
WITH user_cohort AS (
    -- Assign each user to their signup cohort
    SELECT 
        customer_id,
        DATE_FORMAT(signup_date, '%Y-%m') AS cohort_month
    FROM customers
),
user_activity AS (
    -- Get each user's activity by month
    SELECT 
        c.customer_id,
        uc.cohort_month,
        DATE_FORMAT(o.order_date, '%Y-%m') AS activity_month,
        TIMESTAMPDIFF(MONTH, 
            STR_TO_DATE(CONCAT(uc.cohort_month, '-01'), '%Y-%m-%d'),
            STR_TO_DATE(CONCAT(DATE_FORMAT(o.order_date, '%Y-%m'), '-01'), '%Y-%m-%d')
        ) AS months_since_signup
    FROM customers c
    JOIN user_cohort uc ON c.customer_id = uc.customer_id
    LEFT JOIN orders o ON c.customer_id = o.customer_id
)
SELECT 
    cohort_month,
    months_since_signup,
    COUNT(DISTINCT customer_id) AS active_users
FROM user_activity
WHERE months_since_signup BETWEEN 0 AND 12
GROUP BY cohort_month, months_since_signup
ORDER BY cohort_month, months_since_signup;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FUNNEL ANALYSIS - Conversion Tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- E-commerce funnel: Visit → Add to Cart → Checkout → Purchase
WITH funnel AS (
    SELECT 
        DATE(event_time) AS event_date,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) AS visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN session_id END) AS add_to_cart,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout' THEN session_id END) AS checkout,
        COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN session_id END) AS purchase
    FROM events
    WHERE event_time >= '2024-01-01'
    GROUP BY DATE(event_time)
)
SELECT 
    event_date,
    visitors,
    add_to_cart,
    checkout,
    purchase,
    ROUND(100.0 * add_to_cart / visitors, 2) AS visit_to_cart_pct,
    ROUND(100.0 * checkout / add_to_cart, 2) AS cart_to_checkout_pct,
    ROUND(100.0 * purchase / checkout, 2) AS checkout_to_purchase_pct,
    ROUND(100.0 * purchase / visitors, 2) AS overall_conversion_pct
FROM funnel
ORDER BY event_date;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. YEAR-OVER-YEAR COMPARISON
-- ═══════════════════════════════════════════════════════════════════════════════

WITH monthly_metrics AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        YEAR(order_date) AS year,
        MONTH(order_date) AS month_num,
        COUNT(*) AS orders,
        SUM(total) AS revenue,
        COUNT(DISTINCT customer_id) AS unique_customers
    FROM orders
    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
    GROUP BY DATE_FORMAT(order_date, '%Y-%m'), YEAR(order_date), MONTH(order_date)
)
SELECT 
    curr.month AS current_month,
    curr.revenue AS current_revenue,
    prev.revenue AS prev_year_revenue,
    ROUND(
        100.0 * (curr.revenue - prev.revenue) / prev.revenue, 
        2
    ) AS yoy_growth_pct
FROM monthly_metrics curr
LEFT JOIN monthly_metrics prev 
    ON curr.month_num = prev.month_num 
    AND curr.year = prev.year + 1
WHERE curr.year = YEAR(CURDATE())
ORDER BY curr.month;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TOP N PER GROUP
-- ═══════════════════════════════════════════════════════════════════════════════

-- Top 3 products by revenue in each category
WITH product_revenue AS (
    SELECT 
        p.category,
        p.product_id,
        p.name,
        SUM(oi.quantity * oi.price) AS revenue,
        RANK() OVER (
            PARTITION BY p.category 
            ORDER BY SUM(oi.quantity * oi.price) DESC
        ) AS revenue_rank
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.category, p.product_id, p.name
)
SELECT category, product_id, name, revenue, revenue_rank
FROM product_revenue
WHERE revenue_rank <= 3
ORDER BY category, revenue_rank;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. GAP ANALYSIS - Missing Dates
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find dates with no orders (useful for detecting system issues)
WITH RECURSIVE date_range AS (
    -- Generate all dates in range
    SELECT DATE('2024-01-01') AS date
    UNION ALL
    SELECT DATE_ADD(date, INTERVAL 1 DAY)
    FROM date_range
    WHERE date < DATE('2024-12-31')
)
SELECT 
    dr.date,
    'NO ORDERS' AS status
FROM date_range dr
LEFT JOIN orders o ON DATE(o.order_date) = dr.date
WHERE o.order_id IS NULL
  AND dr.date <= CURDATE();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SESSIONIZATION - User Journey Analysis
-- ═══════════════════════════════════════════════════════════════════════════════

-- Group user events into sessions (30-min inactivity = new session)
WITH events_with_prev AS (
    SELECT 
        user_id,
        event_time,
        event_type,
        LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_event_time
    FROM events
),
events_with_session_flag AS (
    SELECT 
        *,
        CASE 
            WHEN prev_event_time IS NULL THEN 1
            WHEN TIMESTAMPDIFF(MINUTE, prev_event_time, event_time) > 30 THEN 1
            ELSE 0
        END AS new_session_flag
    FROM events_with_prev
),
events_with_session AS (
    SELECT 
        *,
        SUM(new_session_flag) OVER (
            PARTITION BY user_id 
            ORDER BY event_time
        ) AS session_id
    FROM events_with_session_flag
)
SELECT 
    user_id,
    session_id,
    MIN(event_time) AS session_start,
    MAX(event_time) AS session_end,
    TIMESTAMPDIFF(MINUTE, MIN(event_time), MAX(event_time)) AS session_duration_min,
    COUNT(*) AS event_count
FROM events_with_session
GROUP BY user_id, session_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. PERCENTILE ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Find P50, P75, P90, P95 order values
SELECT 
    COUNT(*) AS total_orders,
    MIN(total) AS min_order,
    MAX(total) AS max_order,
    AVG(total) AS avg_order,
    -- Approximate percentiles using NTILE
    (SELECT AVG(total) FROM (
        SELECT total, NTILE(100) OVER (ORDER BY total) AS percentile
        FROM orders
    ) p WHERE percentile = 50) AS p50_median,
    (SELECT AVG(total) FROM (
        SELECT total, NTILE(100) OVER (ORDER BY total) AS percentile
        FROM orders
    ) p WHERE percentile = 75) AS p75,
    (SELECT AVG(total) FROM (
        SELECT total, NTILE(100) OVER (ORDER BY total) AS percentile
        FROM orders
    ) p WHERE percentile = 90) AS p90,
    (SELECT AVG(total) FROM (
        SELECT total, NTILE(100) OVER (ORDER BY total) AS percentile
        FROM orders
    ) p WHERE percentile = 95) AS p95
FROM orders;
```

---

# QUICK REFERENCE CARD

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    SQL FOR DATA ANALYSIS - CHEAT SHEET                           ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  JOIN TYPES:                                                                     ║
║    INNER JOIN - Only matching rows                                               ║
║    LEFT JOIN  - All left + matching right (NULL if no match)                     ║
║    RIGHT JOIN - All right + matching left                                        ║
║    FULL JOIN  - Everything from both                                             ║
║    SELF JOIN  - Table joined to itself (hierarchies)                             ║
║                                                                                   ║
║  AGGREGATE FUNCTIONS:                                                            ║
║    COUNT(*), COUNT(col), COUNT(DISTINCT col)                                     ║
║    SUM(col), AVG(col), MIN(col), MAX(col)                                        ║
║    GROUP_CONCAT(col) / STRING_AGG(col, ',')                                      ║
║                                                                                   ║
║  WINDOW FUNCTIONS SYNTAX:                                                        ║
║    function() OVER (PARTITION BY col ORDER BY col)                               ║
║                                                                                   ║
║  RANKING:                                                                        ║
║    ROW_NUMBER() - Unique numbers 1,2,3,4,5                                       ║
║    RANK()       - Ties get same, gaps after: 1,2,2,4,5                           ║
║    DENSE_RANK() - Ties get same, no gaps: 1,2,2,3,4                              ║
║    NTILE(n)     - Divide into n equal groups                                     ║
║                                                                                   ║
║  VALUE FUNCTIONS:                                                                ║
║    LAG(col, n)    - Previous row value                                           ║
║    LEAD(col, n)   - Next row value                                               ║
║    FIRST_VALUE()  - First value in partition                                     ║
║    LAST_VALUE()   - Last value in partition                                      ║
║                                                                                   ║
║  RUNNING/MOVING:                                                                 ║
║    SUM() OVER (ORDER BY date)                      - Running total               ║
║    SUM() OVER (ORDER BY date ROWS 6 PRECEDING)    - 7-day rolling sum            ║
║    AVG() OVER (ORDER BY date ROWS 6 PRECEDING)    - 7-day moving average         ║
║                                                                                   ║
║  CTE SYNTAX:                                                                     ║
║    WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name                        ║
║    Multiple: WITH a AS (...), b AS (...) SELECT ...                              ║
║    Recursive: WITH RECURSIVE cte AS (base UNION ALL recursive)                   ║
║                                                                                   ║
║  COMMON PATTERNS:                                                                ║
║    -- Find rows with no match                                                    ║
║    LEFT JOIN ... WHERE right.id IS NULL                                          ║
║                                                                                   ║
║    -- Top N per group                                                            ║
║    RANK() OVER (PARTITION BY group ORDER BY value DESC)                          ║
║    WHERE rank <= N                                                               ║
║                                                                                   ║
║    -- Month-over-month change                                                    ║
║    value - LAG(value) OVER (ORDER BY month)                                      ║
║                                                                                   ║
║    -- Percentile                                                                 ║
║    PERCENT_RANK() OVER (ORDER BY value)                                          ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

**NEXT: 03_SQL_RealWorld_Incidents.md - Production SQL Stories and Lessons**
