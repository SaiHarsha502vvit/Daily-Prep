> **Navigation**: [⬅ SQL Analytics, Real-World, Design](17_SQL_Problems_Analytics_RealWorld_Design.md) | [📚 Index](00_INDEX.md) | [Next: DSA Permutations & Combinations ➡](19_DSA_Permutations_Combinations_Interview_Math.md)

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

## 9.2 `LEFT JOIN`

```sql
SELECT *
FROM t1
LEFT JOIN t2 ON t1.no = t2.no;
```

Use when: keep all left rows even if right missing.

## 9.3 `RIGHT JOIN`

```sql
SELECT *
FROM t1
RIGHT JOIN t2 ON t1.no = t2.no;
```

Equivalent by swapping table order with LEFT JOIN.

## 9.4 `CROSS JOIN`

```sql
SELECT * FROM t1 CROSS JOIN t2;
```

Pure Cartesian product (every row with every row).

## 9.5 `NATURAL JOIN` (usually avoid in production)

```sql
SELECT * FROM t1 NATURAL JOIN t2;
```

Interview line:

"I avoid NATURAL JOIN in production because schema changes can silently change join behavior. I prefer explicit ON conditions."

## 9.6 `SELF JOIN`

```sql
SELECT e.name AS employee, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.emp_id;
```

---

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

## 11.3 Date functions

```sql
SELECT CURRENT_DATE;
SELECT NOW();
SELECT YEAR(CURRENT_DATE), MONTH(CURRENT_DATE), DAY(CURRENT_DATE);
SELECT DATEDIFF('2026-03-13', '2026-03-01');
```

---

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

---

> **Navigation**: [⬅ SQL Analytics, Real-World, Design](17_SQL_Problems_Analytics_RealWorld_Design.md) | [📚 Index](00_INDEX.md) | [Next: DSA Permutations & Combinations ➡](19_DSA_Permutations_Combinations_Interview_Math.md)
