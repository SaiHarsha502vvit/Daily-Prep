> **SQL Chapter 17/20** | [← Previous](16_RealWorld_CaseStudies.md) | [Index](../00_MASTER_INDEX.md) | [Next →](18a_SQL_Projects_Beginner.md)

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

> **Navigation**: [< Previous](16_RealWorld_CaseStudies.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18a_SQL_Projects_Beginner.md)