**Navigation**: [⬅ Binary Search, Two Pointers, Sliding Window](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md) | [📚 Index](00_INDEX.md) | [Next: SQL Window Functions & Advanced ➡](16_SQL_Problems_Window_Functions_Advanced.md)

# File 15 — SQL Problems: Foundations, Joins & Aggregations

## Logic-First, Code-Second: The 5W+H Way

SQL thinking = "Describe the RESULT SET you want, not the steps to get there."
Every SQL problem is: filter rows → join tables → group → aggregate → filter groups → order.

---

## FOUNDATIONS

---

### Problem 1: Second Highest Salary

**WHAT**: Find the second highest distinct salary. Return NULL if it doesn't exist.

**WHY this is trickier than it looks**:
- "Second highest" means there could be ties at the top
- Must handle edge cases: table is empty, only one salary, all salaries equal

**WHEN**: When you need the Nth element from a ranked/ordered set.

**HOW — The Logic Chain**:

**Approach 1 — OFFSET/LIMIT**:
```
SELECT DISTINCT salary → Remove duplicates
ORDER BY salary DESC   → Sort highest first
LIMIT 1 OFFSET 1       → Skip 1, take 1 = second row
```
Problem: Returns empty result if no second salary. Wrap in subquery for NULL.
```
SELECT (SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1) AS SecondHighestSalary
```

**Approach 2 — MAX of less-than-MAX**:
```
SELECT MAX(salary)
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee)
```
Logic: "What's the highest salary that ISN'T the highest?" MAX naturally returns NULL if no rows qualify.

**Approach 3 — DENSE_RANK**:
```
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rk
  FROM Employee
) ranked WHERE rk = 2
```

**Interview narration**: "I'd use DENSE_RANK for the general Nth salary case. MAX-of-less-than-MAX for specifically second highest. Both handle NULL naturally."

---

### Problem 2: Duplicate Emails

**WHAT**: Find all emails that appear more than once.

**WHY GROUP BY + HAVING**:
- GROUP BY email → consolidates rows per email
- HAVING COUNT(*) > 1 → filters groups with duplicates

**HOW — The Logic Chain**:
```
SELECT email
FROM Person
GROUP BY email
HAVING COUNT(*) > 1
```

**The WHERE vs HAVING distinction**: WHERE filters ROWS before grouping. HAVING filters GROUPS after grouping. Since "appears more than once" is a group-level property, we use HAVING.

---

### Problem 3: Customers Who Never Order

**WHAT**: Find customers with no orders.

**WHY this tests LEFT JOIN understanding**:
- Left join Customer to Order → customers without orders get NULL in order columns
- Filter where order column IS NULL

**HOW — Two approaches**:

**LEFT JOIN + IS NULL**:
```
SELECT c.name AS Customers
FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId
WHERE o.id IS NULL
```
Logic: Join everyone, then filter for "no match found" (NULLs).

**NOT IN subquery**:
```
SELECT name AS Customers FROM Customers
WHERE id NOT IN (SELECT customerId FROM Orders)
```
⚠️ Warning: NOT IN with NULLs in subquery returns empty result! Use NOT EXISTS if customerId can be NULL.

**NOT EXISTS (safest)**:
```
SELECT name AS Customers FROM Customers c
WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.customerId = c.id)
```

**Interview insight**: "I prefer NOT EXISTS because it handles NULLs correctly and often performs better than NOT IN on large datasets."

---

### Problem 4: Rising Temperature

**WHAT**: Find dates where temperature is higher than the previous day.

**WHY self-join on date arithmetic**:
- Join table to itself: today's row with yesterday's row
- Compare temperatures across the join

**HOW — The Logic Chain**:
```
SELECT w1.id
FROM Weather w1
JOIN Weather w2 ON w1.recordDate = DATE_ADD(w2.recordDate, INTERVAL 1 DAY)
WHERE w1.temperature > w2.temperature
```
Logic: w1 is "today", w2 is matched to "yesterday". If today > yesterday → rising.

**Alternative with LAG**:
```
SELECT id FROM (
  SELECT id, temperature,
         LAG(temperature) OVER (ORDER BY recordDate) AS prevTemp
  FROM Weather
) t WHERE temperature > prevTemp
```

**When to use which**: Self-join is more portable. LAG is cleaner but requires window function support. Date gaps are handled correctly by both (they only match actual consecutive dates).

---

### Problem 5: Delete Duplicate Emails (Keep Lowest ID)

**WHAT**: Delete all duplicate emails, keeping only the row with the smallest id.

**WHY self-join for DELETE**:
- Join the table to itself: match same email, different id
- Delete the row with the larger id

**HOW — The Logic Chain**:
```
DELETE p1 FROM Person p1
JOIN Person p2 
ON p1.email = p2.email AND p1.id > p2.id
```
Logic: "For every pair sharing an email, delete the one with the bigger id."

**Why not subquery in MySQL**: `DELETE FROM Person WHERE id NOT IN (SELECT MIN(id) FROM Person GROUP BY email)` fails in MySQL because you can't SELECT from the table you're deleting from (unless you wrap in another subquery).

---

## JOINS

---

### Problem 6: Combine Two Tables (LEFT JOIN Basics)

**WHAT**: Report firstName, lastName, city, state for every person, even those without an address.

**WHY LEFT JOIN is essential**:
- "For every person" means even if they have no address → LEFT JOIN
- If it said "people with addresses" → INNER JOIN
- The word "every" or "all" in the problem hints at LEFT/outer join

**HOW — The Logic Chain**:
```
SELECT p.firstName, p.lastName, a.city, a.state
FROM Person p LEFT JOIN Address a ON p.personId = a.personId
```

**Interview mental model for JOIN types**:
```
INNER JOIN = intersection (both must match)
LEFT JOIN  = all left rows + matched right (NULL if no match)
RIGHT JOIN = all right rows + matched left (NULL if no match)
FULL JOIN  = all rows from both sides (NULL where no match)
CROSS JOIN = every row × every row (cartesian product)
```

---

### Problem 7: Employees Earning More Than Their Managers

**WHAT**: Find employees whose salary exceeds their manager's.

**WHY self-join on hierarchy**:
- Employee table has managerId → join employee to their manager
- Compare salaries across the join

**HOW — The Logic Chain**:
```
SELECT e.name AS Employee
FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary
```
Logic: e = employee, m = their manager. Filter where employee earns more.

---

### Problem 8: Department Highest Salary

**WHAT**: Find the highest salary in each department and who earns it.

**WHY GROUP BY + JOIN back**:
- First find max salary per department
- Then join back to find the employees earning that max

**HOW — The Logic Chain**:
```
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON e.departmentId = d.id
WHERE (e.departmentId, e.salary) IN (
  SELECT departmentId, MAX(salary) FROM Employee GROUP BY departmentId
)
```

**Alternative with RANK**:
```
SELECT Department, Employee, Salary FROM (
  SELECT d.name as Department, e.name as Employee, e.salary as Salary,
         RANK() OVER (PARTITION BY d.id ORDER BY e.salary DESC) as rk
  FROM Employee e JOIN Department d ON e.departmentId = d.id
) ranked WHERE rk = 1
```

**Why RANK not ROW_NUMBER**: RANK handles ties (multiple employees with same max salary). ROW_NUMBER would arbitrarily pick only one.

---

### Problem 9: Department Top Three Salaries

**WHAT**: Find the top 3 unique salaries per department and employees earning them.

**WHY DENSE_RANK is the right choice**:
- DENSE_RANK: ties get same rank, no gaps → 100, 100, 90 → ranks 1, 1, 2
- RANK: ties get same rank, WITH gaps → 100, 100, 90 → ranks 1, 1, 3
- ROW_NUMBER: no ties → 100, 100, 90 → ranks 1, 2, 3
- "Top 3 unique salaries" = DENSE_RANK ≤ 3

**HOW — The Logic Chain**:
```
SELECT Department, Employee, Salary FROM (
  SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary,
         DENSE_RANK() OVER (PARTITION BY d.id ORDER BY e.salary DESC) AS rk
  FROM Employee e JOIN Department d ON e.departmentId = d.id
) ranked WHERE rk <= 3
```

---

### Problem 10: Students and Examinations (CROSS JOIN + LEFT JOIN)

**WHAT**: For each student-subject pair, count how many exams they attended. Include zero counts.

**WHY CROSS JOIN + LEFT JOIN + COUNT**:
- CROSS JOIN Students × Subjects → all possible pairs
- LEFT JOIN with Examinations → match actual exams
- COUNT(exam column) → 0 for unmatched, real count for matched

**HOW — The Logic Chain**:
```
SELECT s.student_id, s.student_name, sub.subject_name,
       COUNT(e.student_id) AS attended_exams
FROM Students s
CROSS JOIN Subjects sub
LEFT JOIN Examinations e 
  ON s.student_id = e.student_id AND sub.subject_name = e.subject_name
GROUP BY s.student_id, s.student_name, sub.subject_name
ORDER BY s.student_id, sub.subject_name
```

**The CROSS JOIN purpose**: Generates every possible student-subject combination so we see zeros. Without it, students who attended no exams in a subject wouldn't appear.

**Why COUNT(e.student_id) not COUNT(*)**: COUNT(*) counts rows (always ≥ 1 from the CROSS JOIN). COUNT(column) counts non-NULL values, so unmatched LEFT JOINs give 0.

---



🔬 **Section Challenge — JOINS**

**Challenge 1 (Reasoning):** `LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?
<details><summary>Answer</summary>

When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion.
</details>

**Challenge 2 (Bug Hunt):** `SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?
<details><summary>Answer</summary>

It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join.
</details>


## AGGREGATIONS

---

### Problem 11: Game Play Analysis — First Login Date

**WHAT**: Find first login date for each player.

**WHY simple GROUP BY + MIN**:
```
SELECT player_id, MIN(event_date) AS first_login
FROM Activity
GROUP BY player_id
```

**Follow-up — Players who logged in on consecutive days after first login**:
```
SELECT DISTINCT a1.player_id
FROM Activity a1
JOIN (SELECT player_id, MIN(event_date) AS first_login FROM Activity GROUP BY player_id) f
ON a1.player_id = f.player_id
WHERE a1.event_date = DATE_ADD(f.first_login, INTERVAL 1 DAY)
```

---

### Problem 12: Product Sales Analysis — First Year

**WHAT**: Get price and quantity for each product's first year of sales.

**WHY subquery to find first year, then filter**:
```
SELECT product_id, year AS first_year, quantity, price
FROM Sales
WHERE (product_id, year) IN (
  SELECT product_id, MIN(year) FROM Sales GROUP BY product_id
)
```

**The pattern**: "First/earliest X per group" → GROUP BY + MIN in subquery, then filter original table.

---

### Problem 13: Biggest Single Number

**WHAT**: Find the largest number that appears exactly once.

**WHY GROUP BY + HAVING + MAX**:
```
SELECT MAX(num) AS num FROM (
  SELECT num FROM MyNumbers GROUP BY num HAVING COUNT(*) = 1
) singles
```
Logic: First filter to numbers appearing once (GROUP BY + HAVING). Then take the MAX of those. NULL if no singles exist (MAX of empty = NULL).

---

### Problem 14: Immediate Food Delivery Percentage

**WHAT**: What percentage of first orders were immediate (order_date = customer_pref_delivery_date)?

**WHY identify first order per customer, then calculate**:
```
SELECT ROUND(
  100 * SUM(CASE WHEN order_date = customer_pref_delivery_date THEN 1 ELSE 0 END) / COUNT(*), 2
) AS immediate_percentage
FROM Delivery
WHERE (delivery_id) IN (
  SELECT MIN(delivery_id) FROM Delivery GROUP BY customer_id
)
```

**Alternative — Cleaner with a CTE**:
```
WITH first_orders AS (
  SELECT customer_id, MIN(order_date) AS first_order_date
  FROM Delivery GROUP BY customer_id
)
SELECT ROUND(
  100 * AVG(CASE WHEN d.order_date = d.customer_pref_delivery_date THEN 1.0 ELSE 0 END), 2
) AS immediate_percentage
FROM Delivery d
JOIN first_orders f ON d.customer_id = f.customer_id AND d.order_date = f.first_order_date
```

---

### Problem 15: Monthly Transactions Summary

**WHAT**: For each month and country, count transactions/approved and their total amounts.

**WHY conditional aggregation**:
```
SELECT DATE_FORMAT(trans_date, '%Y-%m') AS month,
       country,
       COUNT(*) AS trans_count,
       SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END) AS approved_count,
       SUM(amount) AS trans_total_amount,
       SUM(CASE WHEN state = 'approved' THEN amount ELSE 0 END) AS approved_total_amount
FROM Transactions
GROUP BY DATE_FORMAT(trans_date, '%Y-%m'), country
```

**The pattern**: "Count/sum with condition within a group" → SUM(CASE WHEN condition THEN value ELSE 0 END). This avoids multiple self-joins or subqueries.

---

### Problem 16: Confirmation Rate

**WHAT**: Calculate the ratio of confirmed actions to total actions per user.

**WHY LEFT JOIN + conditional aggregation + IFNULL**:
```
SELECT s.user_id,
       ROUND(IFNULL(
         SUM(CASE WHEN c.action = 'confirmed' THEN 1 ELSE 0 END) / COUNT(c.action), 0
       ), 2) AS confirmation_rate
FROM Signups s
LEFT JOIN Confirmations c ON s.user_id = c.user_id
GROUP BY s.user_id
```

**Why IFNULL wraps the division**: Users with no confirmations → COUNT(c.action) = 0 → division by zero. IFNULL converts NULL result to 0.

**Why COUNT(c.action) not COUNT(*)**: COUNT(*) would be 1 (from the LEFT JOIN row). COUNT(c.action) is 0 when action is NULL (no match).

---

## MASTER PROBLEM MAP — SQL Foundations, Joins, Aggregations

| # | Problem | Core Technique | Key Pattern |
|---|---------|---------------|-------------|
| 1 | Second Highest Salary | DENSE_RANK / MAX of less-than-MAX | Nth element from ordered set |
| 2 | Duplicate Emails | GROUP BY + HAVING COUNT > 1 | GROUP-level filtering |
| 3 | Customers Never Order | LEFT JOIN + IS NULL / NOT EXISTS | Anti-join pattern |
| 4 | Rising Temperature | Self-join on date arithmetic | Row comparison across days |
| 5 | Delete Duplicates | Self-join for DELETE | DELETE with JOIN |
| 6 | Combine Two Tables | LEFT JOIN | "every"/"all" = outer join |
| 7 | Manager Salary Compare | Self-join on hierarchy | Employee↔Manager pattern |
| 8 | Dept Highest Salary | GROUP BY + JOIN back / RANK | Per-group maximum |
| 9 | Dept Top 3 Salaries | DENSE_RANK partitioned | Top-N per group |
| 10 | Student Exam Count | CROSS JOIN + LEFT JOIN + COUNT | All combinations + zero |
| 11 | First Login Date | MIN + GROUP BY | First per group |
| 12 | Product First Year | Subquery MIN + filter | First per group + details |
| 13 | Biggest Single Number | GROUP BY HAVING + MAX | Filter groups → aggregate |
| 14 | Immediate Delivery % | Identify first + conditional % | First order + CASE |
| 15 | Monthly Transactions | Conditional aggregation | SUM(CASE) pivoting |
| 16 | Confirmation Rate | LEFT JOIN + conditional ratio | Ratio with NULL protection |

---



🔬 **Section Challenge — MASTER PROBLEM MAP — SQL Foundations, Joins, Aggregations**

**Challenge 1 (Reasoning):** `LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?
<details><summary>Answer</summary>

When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion.
</details>

**Challenge 2 (Bug Hunt):** `SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?
<details><summary>Answer</summary>

It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join.
</details>


## The SQL Execution Order Mental Model

```
FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT

Think of it as:
1. FROM/JOIN   → Build the table (connect tables)
2. WHERE       → Filter rows
3. GROUP BY    → Collapse into groups
4. HAVING      → Filter groups
5. SELECT      → Choose columns / compute expressions
6. DISTINCT    → Remove duplicates
7. ORDER BY    → Sort results
8. LIMIT       → Cut to size
```

**Why this matters**: You can't use a SELECT alias in WHERE (SELECT runs after WHERE). You CAN use it in ORDER BY (ORDER BY runs after SELECT). Understanding order prevents debugging headaches.

---


---

## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |



---

## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>


**Navigation**: [⬅ Binary Search, Two Pointers, Sliding Window](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md) | [📚 Index](00_INDEX.md) | [Next: SQL Window Functions & Advanced ➡](16_SQL_Problems_Window_Functions_Advanced.md)
