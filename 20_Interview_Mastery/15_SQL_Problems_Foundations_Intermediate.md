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

**Challenge 1 (Trace — Who/When/What):** You run `SELECT COUNT(*) FROM customers LEFT JOIN orders ON customers.id = orders.customer_id`. The count is 12,450 but `SELECT COUNT(*) FROM customers` is 10,000. **Who** created the extra rows? **When** can a LEFT JOIN return MORE rows than the left table? **What** query diagnoses the fan-out customers?

<details><summary>Answer</summary>

**Who created extras?** Customers with multiple orders — each order creates an additional row. The 2,450 extra rows = customers with 2+ orders (each multi-order customer contributes `order_count - 1` extra rows). **When does LEFT JOIN return more rows?** When the right table has multiple rows matching a single left-table row. One customer with 5 orders = 5 result rows for that customer. **Diagnostic query:** `SELECT customer_id, COUNT(*) as order_count FROM orders GROUP BY customer_id HAVING COUNT(*) > 1` — this shows customers causing row multiplication. **Consequence:** `SUM(revenue)` on this join would count those customers' non-order columns (name, signup_date) multiple times — not usually a problem, but `COUNT(*)` gives you the joined result count, not the customer count. Always use `COUNT(DISTINCT customers.id)` to count unique customers through a join.

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

**Challenge 1 (Synthesis — Who/When/What):** Looking at the 16-problem map: problems 3, 6, 10, 16 all use LEFT JOIN but for different purposes. **Who** determines when to use LEFT JOIN vs INNER JOIN vs NOT EXISTS? **When** does LEFT JOIN give a wrong count? **What** is the single mental-model question to decide?

<details><summary>Answer</summary>

**Who determines?** The business question — specifically, whether you need rows with NO match on the right side. **Decision question:** "Do I need rows from the LEFT table even if there's NO corresponding row on the RIGHT?" YES → LEFT JOIN. NO → INNER JOIN. **Why LEFT JOIN gives wrong counts:** Problem 10 (Student Exams) uses `COUNT(e.student_id)` not `COUNT(*)` because `COUNT(*)` on a LEFT JOIN always ≥ 1 (the CROSS JOIN row). `COUNT(column)` counts non-NULLs, giving 0 for unmatched. Problem 16 (Confirmation Rate) wraps in `IFNULL` because `0/0 = NULL`, not 0. **Pattern comparison:** (3) Anti-join: LEFT JOIN + IS NULL = rows with NO match. (6) Outer preserve: LEFT JOIN, keep all people even without addresses. (10) Count with zeros: CROSS + LEFT JOIN, `COUNT(right_col)`. (16) Ratio with zeros: LEFT JOIN + IFNULL(SUM(CASE)/COUNT, 0). Each is a different flavor of the same tool — master these 4 and you handle 80% of real-world reporting queries.

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

