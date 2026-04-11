> **Navigation**: [⬅ SQL Window Functions & Advanced](16_SQL_Problems_Window_Functions_Advanced.md) | [📚 Index](00_INDEX.md) | [Next: SQL Foundations from Notes ➡](18_SQL_Foundations_Commands_Operators_Functions.md)

# File 17 — SQL Problems: Analytics, Real-World Scenarios & Schema Design

## Logic-First, Code-Second: The 5W+H Way

> Real-world SQL = "Business questions translated into queries."
> The hard part isn't syntax — it's figuring out WHAT the business actually needs.

---

## ANALYTICS & REPORTING PROBLEMS

---

### Problem 1: Retention Rate (Day-1, Day-7, Day-30)

**WHAT**: Calculate the percentage of users who return 1, 7, and 30 days after signup.

**WHY this is a core product analytics question**:
- Every tech company tracks retention
- Tests your ability to self-join on date math

**HOW — The Logic Chain**:
```
Step 1: Identify each user's signup date (first activity)
Step 2: Check if activity exists on signup + N days
Step 3: Count and divide

WITH signups AS (
  SELECT user_id, MIN(activity_date) AS signup_date
  FROM UserActivity GROUP BY user_id
)
SELECT 
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN DATEDIFF(a.activity_date, s.signup_date) = 1 THEN a.user_id END)
    / COUNT(DISTINCT s.user_id), 2) AS day1_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN DATEDIFF(a.activity_date, s.signup_date) = 7 THEN a.user_id END)
    / COUNT(DISTINCT s.user_id), 2) AS day7_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN DATEDIFF(a.activity_date, s.signup_date) = 30 THEN a.user_id END)
    / COUNT(DISTINCT s.user_id), 2) AS day30_retention
FROM signups s
LEFT JOIN UserActivity a ON s.user_id = a.user_id
```

**Interview tip**: "I'd use LEFT JOIN because users who never return should still be in the denominator. COUNT(DISTINCT CASE WHEN...) counts only those who came back."

---

### Problem 2: Funnel Analysis (Conversion Rates)

**WHAT**: How many users reach each stage: visit → signup → purchase?

**WHY conditional counting in a single scan**:
```
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'visit' THEN user_id END) AS visitors,
  COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) AS signups,
  COUNT(DISTINCT CASE WHEN event = 'purchase' THEN user_id END) AS purchasers,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) /
        NULLIF(COUNT(DISTINCT CASE WHEN event = 'visit' THEN user_id END), 0), 2) AS visit_to_signup_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN event = 'purchase' THEN user_id END) /
        NULLIF(COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END), 0), 2) AS signup_to_purchase_pct
FROM Events
```

**Why NULLIF(count, 0)**: Prevents division by zero. If no visitors exist, returns NULL instead of error.

---

### Problem 3: Cohort Revenue Analysis

**WHAT**: Revenue breakdown by signup month cohort over subsequent months.

**WHY cohort thinking requires two date dimensions**:
```
WITH cohorts AS (
  SELECT user_id, DATE_FORMAT(MIN(order_date), '%Y-%m') AS cohort_month
  FROM Orders GROUP BY user_id
)
SELECT c.cohort_month,
       TIMESTAMPDIFF(MONTH, STR_TO_DATE(CONCAT(c.cohort_month,'-01'),'%Y-%m-%d'), o.order_date) AS month_number,
       COUNT(DISTINCT o.user_id) AS active_users,
       SUM(o.amount) AS revenue
FROM cohorts c
JOIN Orders o ON c.user_id = o.user_id
GROUP BY c.cohort_month, month_number
ORDER BY c.cohort_month, month_number
```

**The cohort pattern**: Every user belongs to their acquisition month. Then track their behavior in month 0, 1, 2, ... from that starting point.

---

### Problem 4: Active Users (DAU / WAU / MAU)

**WHAT**: Daily, weekly, and monthly active users.

**WHY COUNT DISTINCT with date ranges**:
```
-- DAU on a specific date
SELECT activity_date, COUNT(DISTINCT user_id) AS DAU
FROM Activity
GROUP BY activity_date

-- WAU (rolling 7-day window)
SELECT a1.activity_date,
       COUNT(DISTINCT a2.user_id) AS WAU
FROM (SELECT DISTINCT activity_date FROM Activity) a1
JOIN Activity a2 
  ON a2.activity_date BETWEEN DATE_SUB(a1.activity_date, INTERVAL 6 DAY) AND a1.activity_date
GROUP BY a1.activity_date

-- DAU/MAU ratio (stickiness)
SELECT activity_date,
       DAU, MAU,
       ROUND(100.0 * DAU / NULLIF(MAU, 0), 2) AS stickiness_pct
FROM (
  SELECT a1.activity_date,
         COUNT(DISTINCT CASE WHEN a2.activity_date = a1.activity_date THEN a2.user_id END) AS DAU,
         COUNT(DISTINCT a2.user_id) AS MAU
  FROM (SELECT DISTINCT activity_date FROM Activity) a1
  JOIN Activity a2 
    ON a2.activity_date BETWEEN DATE_SUB(a1.activity_date, INTERVAL 29 DAY) AND a1.activity_date
  GROUP BY a1.activity_date
) metrics
```

---

### Problem 5: Revenue Trend with Month-over-Month Growth

**WHAT**: Monthly revenue with MoM growth percentage.

**WHY LAG for temporal comparisons**:
```
WITH monthly AS (
  SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
         SUM(amount) AS revenue
  FROM Orders GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2) AS mom_growth_pct
FROM monthly
```

---




## REAL-WORLD SCENARIO PROBLEMS

---

### Problem 6: Friend Recommendations

**WHAT**: Recommend friends of friends who aren't already friends.

**WHY two-hop join minus existing connections**:
```
-- Find friends-of-friends
SELECT DISTINCT f1.user_id, f2.friend_id AS recommended_friend
FROM Friendships f1
JOIN Friendships f2 ON f1.friend_id = f2.user_id
WHERE f2.friend_id != f1.user_id  -- not yourself
AND (f1.user_id, f2.friend_id) NOT IN (
  SELECT user_id, friend_id FROM Friendships
)
```

**Logic**: "My friends are in f1. Their friends are in f2. If f2's friend isn't already MY friend, recommend them."

**With mutual friend count** (stronger recommendation):
```
SELECT f1.user_id, f2.friend_id AS recommended, COUNT(*) AS mutual_friends
FROM Friendships f1
JOIN Friendships f2 ON f1.friend_id = f2.user_id
WHERE f2.friend_id != f1.user_id
AND (f1.user_id, f2.friend_id) NOT IN (SELECT user_id, friend_id FROM Friendships)
GROUP BY f1.user_id, f2.friend_id
ORDER BY f1.user_id, mutual_friends DESC
```

---

### Problem 7: Consecutive Login Streaks

**WHAT**: Find each user's longest consecutive login streak.

**WHY islands technique with date - ROW_NUMBER**:
```
WITH numbered AS (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
  FROM (SELECT DISTINCT user_id, login_date FROM Logins) t
)
SELECT user_id, MAX(streak) AS longest_streak
FROM (
  SELECT user_id, grp, COUNT(*) AS streak
  FROM numbered
  GROUP BY user_id, grp
) streaks
GROUP BY user_id
```

**The magic**: For consecutive dates, `date - ROW_NUMBER()` is constant. When a gap occurs, the constant changes → new group. Each group = one streak.

---

### Problem 8: Inventory Management — Stock Level at Any Point

**WHAT**: Given stock_in and stock_out events, find stock level on any date.

**WHY running sum of signed quantities**:
```
SELECT product_id, event_date,
       SUM(CASE WHEN event_type = 'in' THEN quantity ELSE -quantity END)
         OVER (PARTITION BY product_id ORDER BY event_date) AS stock_level
FROM StockEvents
```

**Logic**: Each "in" event adds, each "out" event subtracts. Running sum gives stock at any point.

---

### Problem 9: Finding the Median (Without Built-in)

**WHAT**: Calculate median salary across the company.

**WHY position-based approach**:
```
SELECT AVG(salary) AS median FROM (
  SELECT salary,
         ROW_NUMBER() OVER (ORDER BY salary) AS rn,
         COUNT(*) OVER () AS total
  FROM Employees
) t
WHERE rn IN (FLOOR((total+1)/2.0), CEIL((total+1)/2.0))
```

**Why AVG**: For odd total, FLOOR = CEIL → averages with itself = same value. For even total, FLOOR and CEIL are the two middle positions → proper median.

---

### Problem 10: Detecting Fraud — Transactions Within N Minutes

**WHAT**: Flag transactions where the same card has 2+ charges within 10 minutes.

**WHY LEAD/LAG to compare timestamps**:
```
SELECT * FROM (
  SELECT *,
         LEAD(txn_time) OVER (PARTITION BY card_id ORDER BY txn_time) AS next_txn_time
  FROM Transactions
) t
WHERE TIMESTAMPDIFF(MINUTE, txn_time, next_txn_time) <= 10
```

**With self-join approach** (find ALL pairs, not just adjacent):
```
SELECT DISTINCT t1.txn_id, t2.txn_id AS suspicious_pair
FROM Transactions t1
JOIN Transactions t2 
  ON t1.card_id = t2.card_id 
  AND t1.txn_id < t2.txn_id
  AND TIMESTAMPDIFF(MINUTE, t1.txn_time, t2.txn_time) <= 10
```

---

### Problem 11: Session Analysis — Sessionize User Clicks

**WHAT**: Group user clicks into sessions (30-minute inactivity gap).

**WHY LAG to detect gaps, then running sum to assign session IDs**:
```
WITH gaps AS (
  SELECT *,
         CASE WHEN TIMESTAMPDIFF(MINUTE, 
           LAG(click_time) OVER (PARTITION BY user_id ORDER BY click_time),
           click_time) > 30 THEN 1 ELSE 0 END AS new_session
  FROM Clicks
)
SELECT *,
       SUM(new_session) OVER (PARTITION BY user_id ORDER BY click_time) AS session_id
FROM gaps
```

**The two-step pattern**:
1. Mark "new session start" when gap > threshold (LAG comparison)
2. Running SUM of those flags = session counter

---

## SCHEMA DESIGN INTERVIEW QUESTIONS

---

### Problem 12: Design an E-commerce Schema

**WHAT**: Design tables for products, orders, users, payments.

**WHY normalization + practical trade-offs**:
```
Users(user_id PK, email UNIQUE, name, created_at)
Products(product_id PK, name, description, price, category_id FK, stock)
Categories(category_id PK, name, parent_id FK SELF)
Orders(order_id PK, user_id FK, order_date, status, total_amount)
OrderItems(item_id PK, order_id FK, product_id FK, quantity, unit_price)
Payments(payment_id PK, order_id FK, amount, method, status, paid_at)
```

**Key design decisions**:
- `unit_price` in OrderItems → captures price AT TIME OF ORDER (product price may change later)
- `total_amount` in Orders → denormalized for performance (avoid recalculating on every read)
- `parent_id` in Categories → allows hierarchical categories
- Separate Payments table → supports partial payments, refunds

---

### Problem 13: Design a Social Network Schema

**WHAT**: Design tables for users, posts, follows, likes, comments.

**WHY**:
```
Users(user_id PK, username UNIQUE, email UNIQUE, bio, created_at)
Posts(post_id PK, user_id FK, content, media_url, created_at)
Follows(follower_id FK, following_id FK, PRIMARY KEY(follower_id, following_id), created_at)
Likes(user_id FK, post_id FK, PRIMARY KEY(user_id, post_id), created_at)
Comments(comment_id PK, post_id FK, user_id FK, parent_comment_id FK NULLABLE, content, created_at)
```

**Design decisions**:
- Follows: Composite PK prevents duplicate follows. No self-follow enforced via CHECK constraint.
- Likes: Composite PK prevents double-likes. A user can only like a post once.
- Comments: `parent_comment_id` enables threaded/nested comments.
- No CASCADE DELETE on posts → archive instead of hard delete.

---

### Problem 14: Soft Delete Pattern

**WHAT**: Implement deletion without losing data.

**WHY "deleted_at" column instead of hard DELETE**:
```
ALTER TABLE Users ADD deleted_at TIMESTAMP NULL DEFAULT NULL;

-- "Delete" a user
UPDATE Users SET deleted_at = NOW() WHERE user_id = 123;

-- Query active users
SELECT * FROM Users WHERE deleted_at IS NULL;

-- Create a view for convenience
CREATE VIEW ActiveUsers AS SELECT * FROM Users WHERE deleted_at IS NULL;
```

**Trade-offs**:
- Pros: Audit trail, easy undo, data recovery
- Cons: Every query needs `WHERE deleted_at IS NULL`, index overhead
- Alternative: Move deleted rows to archive table

---

### Problem 15: Optimistic Locking Pattern

**WHAT**: Prevent lost updates in concurrent environments.

**WHY version column detects conflicts**:
```
-- Read
SELECT product_id, stock, version FROM Products WHERE product_id = 1;
-- App reads: stock=10, version=5

-- Update with version check
UPDATE Products 
SET stock = stock - 1, version = version + 1
WHERE product_id = 1 AND version = 5;

-- If affected_rows = 0 → someone else updated! Retry.
```

**The pattern**: "Read version → compute change → update only if version unchanged." If version changed between read and write → someone else modified the row → reject and retry.

---

## PERFORMANCE & OPTIMIZATION

---

### Problem 16: Explain This Slow Query

**WHAT**: `SELECT * FROM Orders WHERE YEAR(order_date) = 2024` is slow. Why?

**WHY function on column prevents index use**:
- `YEAR(order_date)` applies a function → MySQL can't use the index on order_date
- Fix: `WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'`
- This is a "sargable" expression (Search ARGument ABLE = can use index)

**Common non-sargable patterns to avoid**:
```
BAD:  WHERE YEAR(date_col) = 2024        → function on column
GOOD: WHERE date_col >= '2024-01-01'     → range scan on index

BAD:  WHERE name LIKE '%smith'            → leading wildcard
GOOD: WHERE name LIKE 'smith%'            → prefix scan

BAD:  WHERE price + 10 > 100             → arithmetic on column
GOOD: WHERE price > 90                    → move constant to right side

BAD:  WHERE CAST(id AS CHAR) = '123'     → type conversion
GOOD: WHERE id = 123                      → native type comparison
```

---

### Problem 17: Index Strategy Questions

**WHAT**: When would you add an index? When NOT?

**WHY — The Decision Framework**:

**Add index when**:
- Column appears in WHERE, JOIN, ORDER BY frequently
- High cardinality (many distinct values)
- Table has many rows
- Read-heavy workload

**Don't add index when**:
- Table is small (full scan is fine)
- Low cardinality (e.g., boolean column with 50/50 split)
- Write-heavy (indexes slow down INSERT/UPDATE/DELETE)
- Column rarely appears in queries

**Composite index ordering**: Put EQUALITY columns first, then RANGE columns.
```
-- Query: WHERE status = 'active' AND created_at > '2024-01-01'
-- Best index: (status, created_at) → equality first, then range
-- NOT: (created_at, status) → range first breaks the index for status
```

---

## MASTER PROBLEM MAP — Analytics, Real-World, Design

| # | Problem | Core Technique | Category |
|---|---------|---------------|----------|
| 1 | Retention Rate | Self-join on signup + N days | Analytics |
| 2 | Funnel Analysis | COUNT(DISTINCT CASE WHEN) | Analytics |
| 3 | Cohort Revenue | CTE + date diff grouping | Analytics |
| 4 | DAU/WAU/MAU | Rolling date range joins | Analytics |
| 5 | MoM Revenue Growth | LAG on monthly aggregation | Analytics |
| 6 | Friend Recommendations | 2-hop join minus existing | Real-World |
| 7 | Login Streaks | date - ROW_NUMBER() islands | Real-World |
| 8 | Stock Level | Running sum of signed events | Real-World |
| 9 | Median Calculation | ROW_NUMBER + FLOOR/CEIL position | Real-World |
| 10 | Fraud Detection | LEAD/LAG on timestamps | Real-World |
| 11 | Session Analysis | LAG gap detect + running SUM | Real-World |
| 12 | E-commerce Schema | Normalization + denormalization trade-offs | Design |
| 13 | Social Network Schema | Composite PKs, self-ref FKs | Design |
| 14 | Soft Delete | deleted_at column + views | Design |
| 15 | Optimistic Locking | version column + conditional update | Design |
| 16 | Slow Query Fix | Sargable expressions + index awareness | Performance |
| 17 | Index Strategy | Cardinality, composite ordering, trade-offs | Performance |

---



## SQL Interview Quick Decision Tree

```
"Find Nth element per group"         → DENSE_RANK() OVER (PARTITION BY group ORDER BY col)
"Compare with previous/next row"     → LAG() / LEAD()
"Running total / cumulative"         → SUM() OVER (ORDER BY col)
"All combinations including zeros"   → CROSS JOIN + LEFT JOIN
"Rows that DON'T match"             → LEFT JOIN + IS NULL or NOT EXISTS
"Exactly K" constraint               → Think "at most K" - "at most K-1"
"Consecutive pattern"                → LAG or date - ROW_NUMBER() (islands)
"Percentage / ratio"                 → COUNT(condition) / NULLIF(COUNT(total), 0)
"Pivot rows to columns"             → SUM(CASE WHEN col = 'X' THEN val END)
"First/last per group"              → MIN/MAX or FIRST_VALUE/LAST_VALUE window
```

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


> **Navigation**: [⬅ SQL Window Functions & Advanced](16_SQL_Problems_Window_Functions_Advanced.md) | [📚 Index](00_INDEX.md) | [Next: SQL Foundations from Notes ➡](18_SQL_Foundations_Commands_Operators_Functions.md)
