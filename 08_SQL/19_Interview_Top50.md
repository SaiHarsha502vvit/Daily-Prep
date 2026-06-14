> **SQL Chapter 19/20** | [← Previous](18a_SQL_Projects_Beginner.md) | [Index](../00_MASTER_INDEX.md) | [Next →](20_CheatSheet_QuickRef.md)

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

> **Navigation**: [< Previous](18b_SQL_Projects_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](20_CheatSheet_QuickRef.md)

### Historical Evolution

**Predecessors (with years):**
- **Oracle/Sybase** (1990s): Early enterprise databases that established SQL as the standard for interview technical screens
- **LeetCode** (2015): Formalized SQL interview question banks with difficulty ratings and company frequency tags
- **HackerRank** (2012): Pioneered automated assessment platforms that companies adopted for initial screening
- **Pramp** (2015): Peer interview practice platform that democratized mock technical interviews
- **SQL-92 Standard** (1992): Baseline syntax that all SQL interviews assume (JOINs, subqueries, GROUP BY, HAVING)

**Evolution narrative:**
SQL interviews evolved from whiteboard queries in onsite loops (2010) to automated platform assessments (2012-2015) to hybrid formats combining live coding with system design discussions. Oracle and Sybase dominance in enterprise created a baseline expectation of SQL proficiency for database-related roles. LeetCode's SQL section (launched 2015) codified 50-100 problems as the "standard prep curriculum" that candidates now share in study groups. Modern interviews test not just query writing but optimization, schema design, and debugging skills reflecting actual production challenges.

**Modern practice anchor:**
Top 50 SQL interview questions now include window functions (LAG/LEAD, RANK), CTEs, and optimization challenges that appear consistently at Google, Meta, Amazon, and Apple.

### Production Reality

**Failure modes:**
1. **SELECT * in production workloads**: Interview queries use `SELECT *` freely, but in production on a table with 20 VARCHAR(2000) columns and a BLOB for file attachments, this causes 8-second page load times as the app transfers megabytes per row. Stack Overflow's 2013 slow-down was partially traced to `SELECT *` pulling unneeded BLOB columns over the wire.
2. **ORDER BY without LIMIT on unbounded results**: A query written as practice exercise `SELECT * FROM employees ORDER BY hire_date` — when called without pagination — sorts 50,000 rows and streams them all. In a web API this causes timeout and memory exhaustion. Fix: always apply keyset or offset pagination.
3. **NULL handling surprises in production filters**: An interview query `WHERE dept_id != 5` silently drops NULL dept_id rows (NULL != 5 evaluates to NULL, not TRUE). In a production report this means the "unassigned" bucket is always zero. Every SQL developer discovers this bug in their first month on the job.

**Debug workflow:**
(1) Review query execution plans with `EXPLAIN ANALYZE` — look for `Seq Scan` and `Sort (Disk)` indicating full-table sort without index.
(2) Enable query logging in production and filter for queries returning >10,000 rows unexpectedly.
(3) Test NULL-edge-case queries: run `WHERE col != val` and explicitly check `WHERE col IS NULL` to ensure all buckets are accounted for.

**Modern practice anchor:**
Today, tools like New Relic, Datadog, and Percona's PMM dashboard visualize query row counts and latency in production, catching interview-style unbounded results before they cascade into page timeouts.
