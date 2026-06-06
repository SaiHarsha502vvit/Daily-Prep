**Navigation**: [⬅ SQL Analytics, Real-World, Design](17_SQL_Problems_Analytics_RealWorld_Design.md) | [📚 Index](00_INDEX.md) | [Next: DSA Permutations & Combinations ➡](19_DSA_Permutations_Combinations_Interview_Math.md)

# File 18 — SQL Foundations from Notes: Commands, Operators, Functions, and Interview Communication

## Why This File Exists

This chapter fills the exact gap you pointed out:
- Strong SQL problem-solving was already present
- But core SQL fundamentals from your handwritten notes were scattered
- Interviews need both: strong analytics + clear fundamentals + syntax alternatives

This file follows your requested order:
1. Logic in plain human language
2. Math/decision reasoning
3. SQL syntax (multiple alternatives)
4. Interview communication lines

---

## 1) The Interview Flow for SQL (Logic First, Syntax Next)

When interviewer gives a SQL problem, speak in this order:

1. **Result Definition**: "The output should have one row per ___ and columns ___."
2. **Row Scope**: "First I will filter rows based on ___."
3. **Join Logic**: "Then I need table A with table B using key ___."
4. **Group Logic**: "If aggregate is required, group by ___."
5. **Condition Level**:
   - row condition -> `WHERE`
   - group condition -> `HAVING`
6. **Output Polish**: "Finally sort by ___ and limit to ___."
7. **Alternative**: "I can also solve this using window function / subquery / CTE."

Mini script:

"I will first define the grain of output as one row per customer. Then I will join orders to customers on customer_id. I will filter date range in WHERE, aggregate revenue with SUM and count orders with COUNT. Since I need only high-value customers after aggregation, I will use HAVING SUM(amount) > threshold. Finally I will sort by total revenue descending."

---

## 2) SQL Command Families (DDL, DML, DQL, DCL, TCL)

### Mental Model

- **DDL**: change structure (schema)
- **DML**: change data rows
- **DQL**: read/query data
- **DCL**: permissions/security
- **TCL**: transaction control

### Syntax Families

#### DDL

```sql
CREATE DATABASE company;
CREATE TABLE employee (
  emp_id INT PRIMARY KEY,
  emp_name VARCHAR(100),
  salary DECIMAL(10,2)
);

ALTER TABLE employee ADD COLUMN dept_id INT;
ALTER TABLE employee DROP COLUMN dept_id;

TRUNCATE TABLE employee;
DROP TABLE employee;
DROP DATABASE company;
```

#### DML + DQL

```sql
INSERT INTO employee (emp_id, emp_name, salary) VALUES (101, 'Sai', 50000);
UPDATE employee SET salary = 52000 WHERE emp_id = 101;
DELETE FROM employee WHERE emp_id = 101;
SELECT * FROM employee;
```

#### DCL + TCL

```sql
GRANT SELECT, INSERT ON company.employee TO app_user;
REVOKE INSERT ON company.employee FROM app_user;

START TRANSACTION;
UPDATE account SET balance = balance - 1000 WHERE id = 1;
UPDATE account SET balance = balance + 1000 WHERE id = 2;
COMMIT;
-- or ROLLBACK;
```

Interview line:

"If this is a production write workflow, I will wrap updates in a transaction so partial updates cannot leave inconsistent state."

---

## 3) `SELECT`, `DISTINCT`, and Output Grain

### Core Logic

- `SELECT` chooses columns and expressions
- `DISTINCT` removes duplicate rows from selected projection
- Duplicates are removed across the full selected column list

```sql
SELECT * FROM t1;
SELECT DISTINCT * FROM t1;
SELECT DISTINCT no FROM t1;
```

### Common confusion

If `SELECT DISTINCT col1, col2`, uniqueness is on pair `(col1, col2)`, not on `col1` alone.

### Alternative to `DISTINCT`

If you also need aggregate values, use `GROUP BY`:

```sql
SELECT no FROM t1 GROUP BY no;
```

---




## 4) `UPDATE`, `ALTER`, `MODIFY`, `RENAME`, `DROP`, `TRUNCATE`, `DELETE`

## 4.1 `UPDATE` (change row values)

```sql
-- specific rows
UPDATE t1 SET marks = 90 WHERE no = 2;

-- all rows
UPDATE t1 SET marks = 100;
```

Safety interview line:

"I always state WHERE explicitly before UPDATE. In real systems I first run a SELECT with the same WHERE to verify affected rows."

## 4.2 `ALTER TABLE` (change structure)

```sql
ALTER TABLE t1 ADD COLUMN marks INT;
```

## 4.3 Modify datatype

MySQL:

```sql
ALTER TABLE t1 MODIFY COLUMN marks FLOAT;
```

PostgreSQL alternative:

```sql
ALTER TABLE t1 ALTER COLUMN marks TYPE NUMERIC(10,2);
```



🔬 **Section Challenge — 4.3 Modify datatype**

**Challenge 1 (Debug — Who/When/What):** You run `ALTER TABLE employee MODIFY COLUMN salary DECIMAL(12,2)` in MySQL on a 50M-row production table. **Who** is blocked? **When?** **What** is the safer alternative?

<details><summary>Answer</summary>

**Who is blocked?** ALL reads AND writes on the `employee` table. MySQL 5.x performs a **table-level lock** for most DDL — it copies the entire table to a temp file with the new schema, then swaps. **When?** For the full duration of the copy — on a 50M-row table with slow disk, this could be 30-60 minutes of complete table unavailability. **Safer alternative:** (1) **MySQL 5.6+ Online DDL**: `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` — for supported operations (changing column length, adding indexes), MySQL allows concurrent reads/writes during the operation. (2) **pt-online-schema-change** (Percona Toolkit): creates shadow table, copies data in batches, uses triggers to sync writes, then atomically swaps. Zero downtime. (3) **gh-ost** (GitHub): trigger-free online schema change tool — more reliable for high-traffic tables.

</details>


## 4.4 Rename column/table

MySQL 8+ and PostgreSQL:

```sql
ALTER TABLE t1 RENAME COLUMN price TO cost;
```

Rename table:

```sql
RENAME TABLE t1 TO student;
```

PostgreSQL alternative:

```sql
ALTER TABLE t1 RENAME TO student;
```

## 4.5 `DROP` vs `TRUNCATE` vs `DELETE`

### Plain Logic Difference

- `DELETE` -> remove selected/all rows, table structure stays
- `TRUNCATE` -> remove all rows fast, structure stays
- `DROP` -> remove whole object (table/database/index), structure also gone

### Syntax

```sql
DELETE FROM t1 WHERE no = 2;
DELETE FROM t1;

TRUNCATE TABLE t1;

DROP TABLE t1;
DROP DATABASE company;
```

### Interview comparison table

| Operation | Filterable | Logs row-by-row | Resets identity often | Structure kept |
|---|---|---|---|---|
| DELETE | Yes | Usually yes | Usually no | Yes |
| TRUNCATE | No | Minimal/metadata heavy | Often yes | Yes |
| DROP | No | Metadata | N/A | No |

---

## 5) Operators Deep Dive with Alternatives

From your notes, these are must-know operators and how to explain them.

## 5.1 Comparison + logical

```sql
=, !=, <>, <, >, <=, >=
AND, OR, NOT
```

Interview line:

"`AND` narrows results (intersection), `OR` broadens results (union of conditions)."

## 5.2 `BETWEEN`

```sql
SELECT * FROM t1 WHERE marks BETWEEN 20 AND 80;
```

Equivalent alternative:

```sql
SELECT * FROM t1 WHERE marks >= 20 AND marks <= 80;
```

Note: `BETWEEN` is inclusive.

## 5.3 `IN`

```sql
SELECT * FROM t1 WHERE marks IN (20, 50, 80);
```

Alternative with OR:

```sql
SELECT * FROM t1 WHERE marks = 20 OR marks = 50 OR marks = 80;
```

Subquery form:

```sql
SELECT * FROM t1 WHERE marks IN (SELECT cutoff FROM c1);
```




## 5.4 `IS NULL` / `IS NOT NULL`

```sql
SELECT * FROM t1 WHERE marks IS NULL;
SELECT * FROM t1 WHERE marks IS NOT NULL;
```

Important: `marks = NULL` is wrong.

## 5.5 `LIKE` with wildcards

```sql
-- contains
SELECT * FROM t1 WHERE name LIKE '%a%';

-- starts with
SELECT * FROM t1 WHERE name LIKE 'a%';

-- ends with
SELECT * FROM t1 WHERE name LIKE '%h';

-- single-character wildcard
SELECT * FROM t1 WHERE name LIKE '_h%';
```

`%` = any length, `_` = single character.



🔬 **Section Challenge — 5.5 `LIKE` with wildcards**

**Challenge 1 (LIKE Pattern Matching Performance):** `SELECT * FROM users WHERE name LIKE '%john%'`. **Who** can't use an index? **When** does `LIKE 'john%'` perform better? **What** is the production alternative for full-text search?

<details><summary>Answer</summary>

**Who can't use an index:** The leading wildcard `%john%`. SQL indexes store values in sorted order. A leading `%` means "match anything before john" — the database must scan every row to find matches. No B-tree index can help (you'd need to check ALL rows). **When LIKE 'john%' uses an index:** A TRAILING wildcard `LIKE 'john%'` can use a B-tree index because the search starts from the known prefix `john`. The index lookup starts at `john` and reads forward until the prefix no longer matches. **Production alternative:** Full-text search indexes. MySQL: `MATCH(name) AGAINST('john' IN NATURAL LANGUAGE MODE)` with `FULLTEXT INDEX(name)`. PostgreSQL: `name @@ to_tsquery('john')` with `GIN` index on `to_tsvector('english', name)`. These tokenize text and build inverted indexes — O(1) lookup regardless of position. For applications at scale: Elasticsearch with fuzzy search handles complex patterns without scanning every row.

</details>
<details><summary>Answer</summary>

No. The compiler doesn't know the actual type — it could be `List<Integer>`, `List<Float>`, or `List<Double>`. Adding a `Double` to a `List<Integer>` would violate type safety. `? extends T` is read-only: you can `get()` as `Number`, but `add()` is forbidden (except null).
</details>

**Challenge 2 (Design):** Write a method that copies elements from any `List<? extends T>` into any `List<? super T>`. Why is this the correct signature?
<details><summary>Answer</summary>

```java
<T> void copy(List<? extends T> src, List<? super T> dst) {
    for (T item : src) dst.add(item);
}
```
PECS: `src` is a Producer (we read from it) → `extends`. `dst` is a Consumer (we write to it) → `super`. This is exactly how `Collections.copy()` is implemented in the JDK.
</details>


## 5.6 `EXISTS`

```sql
SELECT *
FROM t1
WHERE EXISTS (
  SELECT 1 FROM t2 WHERE t1.no = t2.no
);
```

Alternative with INNER JOIN:

```sql
SELECT DISTINCT t1.*
FROM t1
INNER JOIN t2 ON t1.no = t2.no;
```

When to say in interview:

"I prefer EXISTS for semi-join logic because optimizer can stop early after first match."

## 5.7 `ANY` and `ALL`

```sql
SELECT * FROM t1 WHERE marks > ANY (SELECT cutoff FROM c1);
SELECT * FROM t1 WHERE marks > ALL (SELECT cutoff FROM c1);
```

Math meaning:

- `> ANY` means greater than minimum of subquery set
- `> ALL` means greater than maximum of subquery set

Equivalent rewrites:

```sql
SELECT * FROM t1 WHERE marks > (SELECT MIN(cutoff) FROM c1); -- > ANY
SELECT * FROM t1 WHERE marks > (SELECT MAX(cutoff) FROM c1); -- > ALL
```

---

## 6) Aggregate Functions + `GROUP BY` + `HAVING`

From your notes: `COUNT`, `SUM`, `MIN`, `MAX`, `AVG`, `COALESCE`, `ROUND`.




## 6.1 Core aggregate syntax

```sql
SELECT COUNT(*) FROM t1;
SELECT COUNT(DISTINCT no) FROM t1;
SELECT SUM(marks) FROM t1;
SELECT MIN(marks), MAX(marks), AVG(marks) FROM t1;
```

## 6.2 Null behavior and `COALESCE`

```sql
SELECT AVG(marks) FROM t1;  -- NULLs ignored
SELECT AVG(COALESCE(marks, 0)) FROM t1; -- NULL treated as 0
```

Rounded output:

```sql
SELECT ROUND(AVG(marks), 2) AS avg_marks FROM t1;
```

## 6.3 `GROUP BY`

```sql
SELECT branch, COUNT(*) AS nos
FROM t1
GROUP BY branch;

SELECT branch, section, COUNT(*) AS nos
FROM t1
GROUP BY branch, section;
```

## 6.4 `HAVING` vs `WHERE`

```sql
-- row-level filter
SELECT branch, COUNT(*)
FROM t1
WHERE marks >= 50
GROUP BY branch;

-- group-level filter
SELECT branch, COUNT(*)
FROM t1
GROUP BY branch
HAVING COUNT(*) >= 2;
```

Interview line:

"I use WHERE before grouping, HAVING after grouping. Aggregate conditions belong in HAVING."

---




## 7) `CASE` Expressions and Aliases

## 7.1 CASE by value

```sql
SELECT name,
       CASE gender
         WHEN 'male' THEN 'M'
         WHEN 'female' THEN 'F'
         ELSE 'Others'
       END AS new_gen
FROM t1;
```

## 7.2 CASE by condition

```sql
SELECT name, marks,
       CASE
         WHEN marks >= 90 THEN 'Excellent'
         WHEN marks >= 80 THEN 'Very Good'
         WHEN marks >= 70 THEN 'Good'
         WHEN marks >= 50 THEN 'OK'
         ELSE 'Need Improvement'
       END AS remark
FROM student;
```

## 7.3 Alias

```sql
SELECT A AS no, B AS name FROM t AS student;
```

`AS` is optional in many engines, but explicit `AS` improves readability.

---

## 8) `ORDER BY`, `LIMIT`, `OFFSET`, and Top-N

```sql
SELECT * FROM t1 ORDER BY marks DESC;
SELECT * FROM t1 ORDER BY marks DESC, no DESC;

SELECT * FROM t1 LIMIT 3;
SELECT * FROM t1 LIMIT 2 OFFSET 3;
-- MySQL shorthand: LIMIT 3, 2  (offset, count)
```

Top-3 distinct marks alternatives:

```sql
-- MySQL style
SELECT DISTINCT marks
FROM t1
ORDER BY marks DESC
LIMIT 3;
```

Window function style:

```sql
WITH ranked AS (
  SELECT marks, DENSE_RANK() OVER (ORDER BY marks DESC) AS dr
  FROM t1
)
SELECT DISTINCT marks FROM ranked WHERE dr = 3;
```

---

## 9) Joins from Fundamentals to Interview Level

From your notes: natural, inner, left, right, full/cross, self join.

## 9.1 `INNER JOIN`

```sql
SELECT *
FROM t1
INNER JOIN t2 ON t1.no = t2.no;
```

Equivalent (older style):

```sql
SELECT * FROM t1, t2 WHERE t1.no = t2.no;
```



🔬 **Section Challenge — 9.1 `INNER JOIN`**

**Challenge 1 (Debug — Who/When/What):** `SELECT orders.id, items.name FROM orders, order_items items WHERE orders.id = items.order_id AND orders.status = 'PENDING'` — **who** executes the join? **What** implicit join type is this? **What** catastrophic query results if you delete the WHERE clause?

<details><summary>Answer</summary>

**Who executes:** The SQL query optimizer — it converts the comma-syntax to an implicit INNER JOIN. **What join type:** Implicit INNER JOIN, functionally identical to `orders INNER JOIN order_items ON orders.id = items.order_id`. **What catastrophe without WHERE:** A full CROSS JOIN (Cartesian product) — every order row paired with EVERY item row. If `orders` has 10,000 rows and `order_items` has 50,000, you get 500,000,000 rows (500M). This can crash the DB server or consume all memory. **Why this matters:** Always use explicit `JOIN ... ON` syntax — the intent is clear, the ON clause is co-located with the join, and accidental cross joins are much harder to write by mistake.

</details>


## 9.2 `LEFT JOIN`

```sql
SELECT *
FROM t1
LEFT JOIN t2 ON t1.no = t2.no;
```

Use when: keep all left rows even if right missing.



🔬 **Section Challenge — 9.2 `LEFT JOIN`**

**Challenge 1 (Reasoning):** `LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?
<details><summary>Answer</summary>

When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion.
</details>

**Challenge 2 (Bug Hunt):** `SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?
<details><summary>Answer</summary>

It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join.
</details>


## 9.3 `RIGHT JOIN`

```sql
SELECT *
FROM t1
RIGHT JOIN t2 ON t1.no = t2.no;
```

Equivalent by swapping table order with LEFT JOIN.



🔬 **Section Challenge — 9.3 `RIGHT JOIN`**

**Challenge 1 (Reasoning — Who/When/What):** `departments RIGHT JOIN employees` returns all employees including those without a department. **Who** is null? **When** would you prefer this over `employees LEFT JOIN departments`? **What** does the convention say?

<details><summary>Answer</summary>

**Who is null?** The `departments` columns — specifically `dept_id`, `dept_name`, etc. — are NULL for employees not assigned to any department. **When prefer RIGHT JOIN?** Almost never — by convention, most engineers rewrite it as `employees LEFT JOIN departments` (swap table order) to keep the "primary" table on the left. RIGHT JOIN reads counter-intuitively: you're reading `departments` first but ALL rows from `employees` are preserved. **Convention says:** Use LEFT JOIN. Many linters and code review guides ban RIGHT JOIN for readability. Only use RIGHT JOIN when you have a complex query with many joins and rewriting would require restructuring all table references. **Interview tip:** Always rewrite `A RIGHT JOIN B` → `B LEFT JOIN A` before explaining to your interviewer.

</details>


## 9.4 `CROSS JOIN`

```sql
SELECT * FROM t1 CROSS JOIN t2;
```

Pure Cartesian product (every row with every row).



🔬 **Section Challenge — 9.4 `CROSS JOIN`**

**Challenge 1 (Design — Who/When/What):** CROSS JOIN is considered dangerous but has legitimate use cases. **Who** should use it? **When** is it the correct tool? **What** is a real-world example?

<details><summary>Answer</summary>

**Who should use it?** Data engineers and analysts generating combinatorial datasets — not typical CRUD developers. **When is it correct?** (1) **Generating test data:** `SELECT * FROM sizes CROSS JOIN colors` — if `sizes` has 3 rows and `colors` has 5, you get 15 combinations for every size+color product variant. (2) **Date/calendar generation:** `SELECT date_series.d, products.id FROM generate_series(...) date_series CROSS JOIN products` — one row per product per day for reporting. (3) **Matrix/grid problems:** Generate all possible pairs to then filter. **What example:** An e-commerce pivot table: `SELECT months.m, categories.cat FROM months CROSS JOIN categories` gives every month-category combination, even if there were no sales (needed for zero-fill reporting). **Guard against accidental CROSS JOIN:** Always check `EXPLAIN` — if you see `Nested Loop` without an index condition, you may have accidentally written one.

</details>


## 9.5 `NATURAL JOIN` (usually avoid in production)

```sql
SELECT * FROM t1 NATURAL JOIN t2;
```

Interview line:

"I avoid NATURAL JOIN in production because schema changes can silently change join behavior. I prefer explicit ON conditions."



🔬 **Section Challenge — 9.5 `NATURAL JOIN` (usually avoid in production)**

**Challenge 1 (Bug Hunt — Who/When/What):** `orders NATURAL JOIN customers` worked for a year. A new developer adds a `status` column to both `orders` AND `customers`. The query still runs but now returns wrong results with no error. **Who** caused the break? **When** did results silently corrupt? **What** happened?

<details><summary>Answer</summary>

**Who caused it?** The developer who added `status` to both tables — they didn't realize NATURAL JOIN automatically joins on ALL matching column names. **When did it corrupt?** Silently, from the moment the migration ran. No error, no warning. **What happened?** NATURAL JOIN previously joined on `customer_id` (the only shared column name). After adding `status` to both tables, it now joins on BOTH `customer_id` AND `status`. So only rows where BOTH the customer ID matches AND the order status matches the customer status are returned — severely filtering results without any indication. This is the core danger: **NATURAL JOIN is schema-dependent** — a column rename or addition invisibly changes join semantics. **Fix:** Always use explicit `JOIN orders o ON o.customer_id = c.customer_id` — the join condition is visible, stable, and schema-change-proof.

</details>


## 9.6 `SELF JOIN`

```sql
SELECT e.name AS employee, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.emp_id;
```

---



🔬 **Section Challenge — 9.6 `SELF JOIN`**

**Challenge 1 (Design — Who/When/What):** The org chart SELF JOIN works for a flat manager hierarchy. Your company now has 8 levels of management. **Who** should you call to get the full reporting chain for an employee? **When** does SELF JOIN break down? **What** replaces it?

<details><summary>Answer</summary>

**Who:** The database engine — but it needs the right tool. **When SELF JOIN breaks:** SELF JOIN is a fixed-depth join — you join the table to itself N times for N levels. `employee e JOIN employee m ON e.manager_id = m.emp_id` gives you 1 level up (direct manager). For 8 levels you'd need 8 joins — and the depth must be known at query-write time. If an employee is at level 3 and another is at level 7, a 4-level join returns wrong results for the shallower one (NULLs). **What replaces it:** A **Recursive CTE** (WITH RECURSIVE): Start with the root, then repeatedly join employees to their managers until the chain terminates. Works for ANY depth. Supported in MySQL 8+, PostgreSQL, SQL Server. `WITH RECURSIVE chain AS (SELECT id, name, manager_id FROM employee WHERE id = ? UNION ALL SELECT e.id, e.name, e.manager_id FROM employee e JOIN chain c ON e.id = c.manager_id) SELECT * FROM chain;`

</details>


## 10) Set Operators

```sql
-- remove duplicates
SELECT col1, col2 FROM a
UNION
SELECT col1, col2 FROM b;

-- keep duplicates
SELECT col1, col2 FROM a
UNION ALL
SELECT col1, col2 FROM b;
```

Interview line:

"UNION does de-duplication (extra sort/hash cost), UNION ALL is faster if duplicates are acceptable."

---

## 11) String, Math, and Date Functions (from your notes)




## 11.1 String functions

```sql
SELECT LENGTH('hello');
SELECT CONCAT('hi', 'hello');
SELECT UPPER('hello');
SELECT LOWER('BYE');
SELECT TRIM('  hi hello  ');
SELECT LTRIM('  left');
SELECT RTRIM('right  ');
SELECT LOCATE('l', 'hello');
SELECT SUBSTRING('hello', 3);
SELECT SUBSTRING('hello', 2, 3);
SELECT REPLACE('hello', 'l', 'r');
SELECT REVERSE('hello');
SELECT REPEAT('*', 5);
```

Group concat style:

```sql
-- MySQL
SELECT branch, GROUP_CONCAT(std_name SEPARATOR ',') AS names
FROM t1
GROUP BY branch;
```

PostgreSQL alternative:

```sql
SELECT branch, STRING_AGG(std_name, ',') AS names
FROM t1
GROUP BY branch;
```




## 11.2 Math functions

```sql
SELECT SQRT(49);
SELECT ABS(-20);
SELECT POWER(2, 10);
SELECT CEIL(12.5);
SELECT FLOOR(12.5);
SELECT ROUND(25.678, 2);
```



🔬 **Section Challenge — 11.2 Math functions**

**Challenge 1 (FLOOR vs ROUND vs CEIL):** `SELECT ROUND(2.5), ROUND(2.45, 1), FLOOR(-2.1), CEIL(-2.1)`. **Who** rounds toward zero? **When** does `ROUND(2.5)` return different results in different databases? **What** is the banker's rounding rule?

<details><summary>Answer</summary>

**Results in most databases:** `ROUND(2.5) = 3` (rounds up), `ROUND(2.45, 1) = 2.5` (one decimal), `FLOOR(-2.1) = -3` (toward negative infinity), `CEIL(-2.1) = -2` (toward positive infinity). **Who rounds toward zero:** `TRUNCATE(2.9) = 2` (removes decimal, moves toward zero). Not same as FLOOR for positives (same result) but differs for negatives: `TRUNCATE(-2.9) = -2`, `FLOOR(-2.9) = -3`. **When ROUND(2.5) returns different results:** PostgreSQL uses "banker's rounding" (round half to even): `ROUND(2.5) = 2`, `ROUND(3.5) = 4` (rounds to nearest even). MySQL always rounds 0.5 up: `ROUND(2.5) = 3`. This difference can cause subtle discrepancies in financial calculations. **Banker's rounding rule (IEEE 754):** Round 0.5 to the nearest EVEN number. Reduces statistical bias in repeated rounding. Used in scientific computing and Java's `RoundingMode.HALF_EVEN`. **Production tip:** For financial data, use `DECIMAL(precision, scale)` not `FLOAT`. Apply rounding consistently. Store raw values and round only for display.

</details>
<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
</details>

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 11.3 Date functions

```sql
SELECT CURRENT_DATE;
SELECT NOW();
SELECT YEAR(CURRENT_DATE), MONTH(CURRENT_DATE), DAY(CURRENT_DATE);
SELECT DATEDIFF('2026-03-13', '2026-03-01');
```

---



🔬 **Section Challenge — 11.3 Date functions**

**Challenge 1 (DATEDIFF vs Interval Arithmetic):** `DATEDIFF('2025-03-01', '2025-02-01')` in MySQL returns 28. But `'2025-03-01'::date - '2025-02-01'::date` in PostgreSQL also returns 28. **Who** handles DST transitions? **When** is DATEDIFF unsafe for time-sensitive calculations? **What** is the interval arithmetic alternative?

<details><summary>Answer</summary>

**Who handles DST:** Neither `DATEDIFF` nor date subtraction accounts for DST — they work with calendar days only. March 8 to March 9 in a DST-observing timezone is actually 23 real hours (clocks spring forward), but `DATEDIFF` returns 1. **When DATEDIFF is unsafe:** Any calculation involving timezones where DST transitions occur. Booking systems ("room available for 3 days"), subscription billing ("charge after 30 days"), expiry calculations. **Date arithmetic in different databases:** MySQL: `DATEDIFF(date2, date1)` (day difference), `TIMESTAMPDIFF(HOUR, ts1, ts2)` (hour difference). PostgreSQL: `date2 - date1` returns `interval` or integer days. `EXTRACT(EPOCH FROM (ts2 - ts1)) / 3600` for precise hours. **Interval arithmetic:** `'2025-02-01'::date + INTERVAL '1 month'` = `'2025-03-01'`. Note: `+ INTERVAL '1 month'` on `'2025-01-31'` = `'2025-02-28'` (not March 2) — PostgreSQL clamps to end of month. **Production pattern for expiry:** Store as `created_at + INTERVAL '30 days' > NOW()` or store explicit `expires_at` timestamp computed at write time.

</details>
<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
</details>

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 12) Datatypes and Constraints (Practical Interview View)

## 12.1 Datatypes

Common practical picks:

- IDs: `INT`, `BIGINT`
- money: `DECIMAL(p,s)` (avoid FLOAT for currency)
- short fixed code: `CHAR(n)`
- variable text: `VARCHAR(n)`
- long text: `TEXT`
- date only: `DATE`
- date-time: `TIMESTAMP` / `DATETIME`
- controlled category: `ENUM` (MySQL) or reference table + FK

Interview line:

"I choose DECIMAL for financial values to avoid floating-point precision errors."



🔬 **Section Challenge — 12.1 Datatypes**

**Challenge 1 (Debug — Who/When/What):** You store a price as `DECIMAL(10,2)`. A user inputs `12345678901.99`. **Who** rejects it? **When?** **What** is the maximum value `DECIMAL(10,2)` can store?\n\n<details><summary>Answer</summary>\n\n**Who rejects?** The database engine, not the application. MySQL raises `ERROR 1264: Out of range value`. **When?** At INSERT/UPDATE time — after the application sends the value, before it's committed. **Max value:** `DECIMAL(10,2)` = 10 total digits, 2 after decimal point = 8 digits before decimal. Max: `99999999.99` (~$100M). **Common mistake:** DECIMAL(10,2) on an e-commerce price column seems large, but if you need to store values above $99,999,999.99 (international orders, B2B), you'll hit this. **Fix:** Use `DECIMAL(15,2)` for financial data by default (handles up to $9.9 trillion). For cryptocurrency: `DECIMAL(18,8)` (8 decimal places for satoshi-level precision). Never use FLOAT/DOUBLE for money — floating point representation causes cents-level rounding errors.\n\n</details>


## 12.2 Constraints

```sql
CREATE TABLE student (
  no INT PRIMARY KEY,
  name VARCHAR(90) NOT NULL,
  branch VARCHAR(20),
  age INT CHECK (age >= 18),
  section CHAR(1) DEFAULT 'A',
  email VARCHAR(200) UNIQUE
);
```

Composite primary key:

```sql
ALTER TABLE enrollment ADD PRIMARY KEY (student_id, course_id);
```

Foreign key:

```sql
ALTER TABLE enrollment
ADD CONSTRAINT fk_enr_student
FOREIGN KEY (student_id)
REFERENCES student(no);
```

Composite foreign key:

```sql
ALTER TABLE child
ADD CONSTRAINT fk_parent
FOREIGN KEY (p_col1, p_col2)
REFERENCES parent(col1, col2);
```

Auto increment identity:

```sql
-- MySQL
id BIGINT AUTO_INCREMENT PRIMARY KEY

-- PostgreSQL
id BIGSERIAL PRIMARY KEY
```

Candidate key note:

- Any column set that can uniquely identify rows is a candidate key
- One candidate key is chosen as primary key

---




## 13) Indexes: Clustered vs Non-Clustered and Interview Reality

## 13.1 Core idea

Index is a faster path to data; tradeoff is extra write cost and storage.

## 13.2 Practical syntax

```sql
CREATE INDEX idx_emp_dept ON employee(dept_id);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
DROP INDEX idx_emp_dept ON employee;  -- MySQL style
```

## 13.3 Clustered / non-clustered

Interview-safe phrasing:

- "Clustered index" generally means table data is stored in index order (engine-dependent)
- "Secondary/non-clustered" means separate structure pointing to data rows
- In MySQL InnoDB, primary key is clustered structure

## 13.4 When to create index

Create when:
- frequent `WHERE`, `JOIN`, `ORDER BY`
- high-selectivity column
- read-heavy workload

Avoid when:
- tiny table
- low-cardinality only column
- heavy write workload without read benefit

---

## 14) CTE and Window Functions as Readability + Power Tools



🔬 **Section Challenge — 14) CTE and Window Functions as Readability + Power Tools**

**Challenge 1 (CTE vs Subquery Performance):** `WITH cte AS (SELECT ...) SELECT * FROM cte WHERE ...` vs `SELECT * FROM (SELECT ...) sq WHERE ...`. **Who** materializes the result? **When** does a CTE hurt performance? **What** is the PostgreSQL CTE materialization flag?

<details><summary>Answer</summary>

**Who materializes:** Depends on the database. PostgreSQL pre-14: CTEs are ALWAYS materialized (executed once, result stored in temp table). PostgreSQL 14+: CTEs are inlined by default (treated as subquery, can be optimized). MySQL: CTEs are inlined (re-evaluated per reference). SQL Server: CTEs are inlined (like a view macro). **When a CTE hurts performance (PostgreSQL pre-14):** Materialized CTEs prevent the optimizer from pushing WHERE predicates into the CTE. `WITH cte AS (SELECT * FROM orders) SELECT * FROM cte WHERE id = 5` — the CTE scans ALL orders, materializes all rows, THEN filters to id=5. A subquery would push the `id=5` predicate inside. **PostgreSQL CTE materialization flag (14+):** `WITH cte AS MATERIALIZED (SELECT ...)` forces materialization. `WITH cte AS NOT MATERIALIZED (SELECT ...)` forces inlining. Use `MATERIALIZED` when the CTE result is used multiple times (avoids re-execution). Use `NOT MATERIALIZED` when the optimizer needs predicate pushdown. **Best practice:** Use CTEs for readability. In performance-critical code, test with `EXPLAIN ANALYZE` to see if the CTE is materialized or inlined.

</details>
<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
</details>

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 14.1 CTE

```sql
WITH dept_totals AS (
  SELECT dept_id, SUM(salary) AS total_sal
  FROM employee
  GROUP BY dept_id
)
SELECT * FROM dept_totals WHERE total_sal > 100000;
```

Multiple CTEs:

```sql
WITH a AS (...),
b AS (...)
SELECT ... FROM a JOIN b ON ...;
```

## 14.2 Ranking window functions

```sql
SELECT *,
       RANK()       OVER (ORDER BY marks DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY marks DESC) AS dr,
       ROW_NUMBER() OVER (ORDER BY marks DESC) AS rn
FROM t1;
```

Partitioned ranking:

```sql
SELECT *, ROW_NUMBER() OVER (PARTITION BY branch ORDER BY marks DESC) AS branch_row
FROM t1;
```



🔬 **Section Challenge — 14.2 Ranking window functions**

**Challenge 1 (RANK vs DENSE_RANK vs ROW_NUMBER):** Three employees have salaries: Alice=90k, Bob=90k, Carol=70k. **Who** gets rank 2 with `RANK()`, `DENSE_RANK()`, and `ROW_NUMBER()`?

<details><summary>Answer</summary>

**ROW_NUMBER():** Sequential with no ties. Alice=1, Bob=2, Carol=3 (or Alice=2, Bob=1 depending on ORDER BY tie-breaking — non-deterministic for ties without a tiebreaker column). **RANK():** Ties get the SAME rank, next rank skips. Alice=1, Bob=1, Carol=3. No rank 2 exists. The gap "1,1,3" represents "two people tied for 1st." **DENSE_RANK():** Ties get the same rank, NO gap. Alice=1, Bob=1, Carol=2. Dense = no missing numbers. **When to use each:** `ROW_NUMBER()` — de-duplication (latest record per user: `WHERE rn=1`), pagination. `RANK()` — sports-style leaderboards (tied gold medals, next is bronze). `DENSE_RANK()` — percentile bands (top 3 salary grades, no gaps). **Interview gotcha:** `SELECT * FROM (SELECT *, RANK() OVER (ORDER BY salary DESC) r FROM emp) t WHERE r = 2` — returns Carol (70k) but not Alice or Bob (both rank 1, skip 2). `DENSE_RANK()` would return Alice and Bob at rank 2. Know which one to use for "2nd highest salary."

</details>
<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
</details>

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 14.3 Value window functions

```sql
SELECT *,
       LAG(marks)  OVER (ORDER BY no) AS prev_marks,
       LEAD(marks) OVER (ORDER BY no) AS next_marks,
       FIRST_VALUE(marks) OVER (PARTITION BY branch ORDER BY no) AS first_marks,
       LAST_VALUE(marks)  OVER (
         PARTITION BY branch ORDER BY no
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS last_marks,
       NTH_VALUE(marks, 2) OVER (
         PARTITION BY branch ORDER BY no
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS second_marks
FROM t1;
```

---



🔬 **Section Challenge — 14.3 Value window functions**

**Challenge 1 (LAG and LEAD for Period Comparisons):** `LAG(revenue, 1) OVER (PARTITION BY product ORDER BY month)` returns the previous month's revenue. **Who** computes the value? **When** does `LAG` return NULL? **What** is the default value syntax and the common MoM growth calculation?

<details><summary>Answer</summary>

**Who computes it:** The SQL window function engine. `LAG(expr, offset, default)` looks back `offset` rows within the window partition. No self-join needed. **When LAG returns NULL:** When `offset` exceeds the number of preceding rows in the partition. For the first row in each `PRODUCT` group (no previous month): `LAG(revenue, 1)` returns NULL. **Default value syntax:** `LAG(revenue, 1, 0) OVER (PARTITION BY product ORDER BY month)` — returns 0 instead of NULL for the first row. Or: `COALESCE(LAG(revenue, 1) OVER (...), 0)`. **MoM growth calculation:** `(revenue - LAG(revenue, 1) OVER (PARTITION BY product ORDER BY month)) / NULLIF(LAG(revenue, 1) OVER (...), 0) * 100 AS growth_pct`. `NULLIF(..., 0)` prevents division by zero when previous month = 0. **LEAD:** Same as LAG but looks FORWARD. Useful for: time-to-next-event, churn prediction ("days until customer churned"). `LEAD(order_date, 1) OVER (PARTITION BY customer ORDER BY order_date) AS next_order_date`. **Performance:** Window functions scan the ordered partition once. Much faster than correlated subqueries that re-execute per row.

</details>
<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
</details>

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 15) Real-World Mini Scenarios with Multiple SQL Styles




## Scenario A: Restaurant analytics

Question: "How many veg items are there?"

Style 1 (simple count):

```sql
SELECT COUNT(*) AS veg_items
FROM restaurant
WHERE category = 'veg';
```

Style 2 (conditional aggregation):

```sql
SELECT SUM(CASE WHEN category = 'veg' THEN 1 ELSE 0 END) AS veg_items
FROM restaurant;
```

Question: "Items priced above average"

Style 1 (subquery):

```sql
SELECT item
FROM restaurant
WHERE price > (SELECT AVG(price) FROM restaurant);
```

Style 2 (window):

```sql
SELECT item
FROM (
  SELECT item, price, AVG(price) OVER () AS avg_price
  FROM restaurant
) t
WHERE price > avg_price;
```

Interview line:

"Subquery style is shorter for simple use. Window style is useful if I need row data and overall average together in one pass."

## Scenario B: Role-based increment (manager/teamlead)

```sql
SELECT emp_name,
       salary,
       CASE
         WHEN designation = 'manager' THEN salary + 500
         WHEN designation = 'teamlead' THEN salary + 200
         ELSE salary
       END AS new_salary
FROM employee;
```

CTE alternative for cleaner chaining:

```sql
WITH revised AS (
  SELECT emp_name, salary,
         CASE
           WHEN designation = 'manager' THEN salary + 500
           WHEN designation = 'teamlead' THEN salary + 200
           ELSE salary
         END AS new_salary
  FROM employee
)
SELECT emp_name, salary, new_salary, new_salary - salary AS increment
FROM revised;
```

---




## 16) Interview Communication Scripts (Use Verbatim)

### Script 1: Aggregate + filter

"I need one row per team, so I will group by team. Since the condition is on aggregated value (total runs), I will use HAVING and not WHERE. Then I will order by total descending."

### Script 2: Left join requirement

"Because the prompt says include all students even if no exams, I will use LEFT JOIN from students to exams and count a nullable exam-side key to keep zero counts."

### Script 3: Anti-join requirement

"For rows with no matches, I can use either LEFT JOIN with IS NULL or NOT EXISTS. I prefer NOT EXISTS for null-safe semantics and clearer intent."

### Script 4: Top-N requirement

"If ties must be preserved, I will use DENSE_RANK. If exact row count is required, I will use ROW_NUMBER plus filter."

### Script 5: Performance statement

"I will first ensure predicates are sargable, then validate with EXPLAIN. If needed, I will add or reorder composite index with equality columns first and range columns next."

---

## 17) Fast Checklist Before You Submit SQL in Interview

1. Did I define output grain clearly?
2. Did I use correct join direction?
3. Did I separate WHERE and HAVING correctly?
4. Did I handle NULLs intentionally?
5. Did I explain one alternative approach?
6. Did I mention performance/index thought briefly?
7. Is output ordering/limit consistent with prompt?

