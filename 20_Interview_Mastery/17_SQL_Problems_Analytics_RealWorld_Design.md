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

> **Navigation**: [⬅ SQL Window Functions & Advanced](16_SQL_Problems_Window_Functions_Advanced.md) | [📚 Index](00_INDEX.md) | [Next: SQL Foundations from Notes ➡](18_SQL_Foundations_Commands_Operators_Functions.md)
