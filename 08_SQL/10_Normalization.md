> **SQL Chapter 10/20** | [← Previous](09_Window_Functions.md) | [Index](../00_MASTER_INDEX.md) | [Next →](11_Indexes_Performance.md)

---

## Chapter 10: Database Normalization (1NF to BCNF)

### Why Normalization?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE NORMALIZATION                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PROBLEMS WITH UN-NORMALIZED DATA:                                              │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  orders (denormalized)                                                     │ │
│  │  ┌──────┬──────────┬─────────┬───────────────┬──────────────┬───────────┐ │  │
│  │  │ord_id│cust_name │cust_addr│ product       │ product_price│ qty       │ │  │
│  │  ├──────┼──────────┼─────────┼───────────────┼──────────────┼───────────┤ │  │
│  │  │ 1    │ John     │ Delhi   │ Laptop        │ 50000        │ 1         │ │  │
│  │  │ 2    │ John     │ Delhi   │ Mouse         │ 500          │ 2         │ │  │
│  │  │ 3    │ John     │ Delhi   │ Keyboard      │ 1500         │ 1         │ │  │
│  │  │ 4    │ Priya    │ Mumbai  │ Laptop        │ 50000        │ 1         │ │  │
│  │  └──────┴──────────┴─────────┴───────────────┴──────────────┴───────────┘ │  │
│  │                                                                            │ │
│  │  PROBLEMS:                                                                 │ │
│  │  1. UPDATE ANOMALY: John moves to Bangalore → update 3 rows!              │  │
│  │  2. INSERT ANOMALY: Can't add customer without order                       │ │
│  │  3. DELETE ANOMALY: Delete order 4 → lose Priya's info!                   │  │
│  │  4. DATA REDUNDANCY: John's name/address repeated 3 times                  │ │
│  │  5. STORAGE WASTE: Same product prices stored multiple times              │  │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  NORMALIZATION solves these by organizing data into separate tables!            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Normal Forms

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    NORMAL FORMS HIERARCHY                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           ┌─────────────┐                                       │
│                           │    BCNF     │ ← Every determinant is a candidate key│
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     3NF     │ ← No transitive dependencies          │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     2NF     │ ← No partial dependencies             │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │     1NF     │ ← Atomic values, no repeating groups  │
│                           └──────┬──────┘                                       │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │ Unnormalized│                                       │
│                           └─────────────┘                                       │
│                                                                                 │
│  Each form builds on the previous one!                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### First Normal Form (1NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    1NF - FIRST NORMAL FORM                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULES:                                                                         │
│  1. Each column contains ATOMIC (indivisible) values                            │
│  2. No REPEATING GROUPS or arrays                                               │
│  3. Each row is UNIQUE (has a primary key)                                      │
│                                                                                 │
│  BEFORE (Violates 1NF):                                                         │
│  ┌────────┬───────────────────┬─────────────────────────────────────────────┐   │
│  │ emp_id │ name              │ phone_numbers                               │   │
│  ├────────┼───────────────────┼─────────────────────────────────────────────┤   │
│  │ 1      │ Rajesh Kumar      │ 9876543210, 9876543211                      │   │
│  │ 2      │ Priya Sharma      │ 9123456789                                  │   │
│  └────────┴───────────────────┴─────────────────────────────────────────────┘   │
│  ↑ PROBLEM: phone_numbers contains multiple values (not atomic)                 │
│                                                                                 │
│  AFTER (1NF):                                                                   │
│  employees                         employee_phones                              │
│  ┌────────┬────────────────┐      ┌────────┬──────────────┐                     │
│  │ emp_id │ name           │      │ emp_id │ phone        │                     │
│  ├────────┼────────────────┤      ├────────┼──────────────┤                     │
│  │ 1      │ Rajesh Kumar   │      │ 1      │ 9876543210   │                     │
│  │ 2      │ Priya Sharma   │      │ 1      │ 9876543211   │                     │
│  └────────┴────────────────┘      │ 2      │ 9123456789   │                     │
│                                   └────────┴──────────────┘                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Second Normal Form (2NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    2NF - SECOND NORMAL FORM                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULES:                                                                         │
│  1. Must be in 1NF                                                              │
│  2. No PARTIAL DEPENDENCY (non-key column depends on PART of composite key)     │
│                                                                                 │
│  BEFORE (Violates 2NF):                                                         │
│  order_items (PK: order_id, product_id)                                         │
│  ┌──────────┬────────────┬──────────────┬───────┬─────────┐                     │
│  │ order_id │ product_id │ product_name │ qty   │ price   │                     │
│  ├──────────┼────────────┼──────────────┼───────┼─────────┤                     │
│  │ 1        │ 101        │ Laptop       │ 1     │ 50000   │                     │
│  │ 1        │ 102        │ Mouse        │ 2     │ 500     │                     │
│  │ 2        │ 101        │ Laptop       │ 1     │ 50000   │                     │
│  └──────────┴────────────┴──────────────┴───────┴─────────┘                     │
│                                                                                 │
│  PROBLEM: product_name and price depend ONLY on product_id, not full PK!        │
│           (Partial dependency on composite key)                                 │
│                                                                                 │
│  AFTER (2NF):                                                                   │
│  order_items                           products                                 │
│  ┌──────────┬────────────┬───────┐    ┌────────────┬──────────────┬─────────┐   │
│  │ order_id │ product_id │ qty   │    │ product_id │ product_name │ price   │   │
│  ├──────────┼────────────┼───────┤    ├────────────┼──────────────┼─────────┤   │
│  │ 1        │ 101        │ 1     │    │ 101        │ Laptop       │ 50000   │   │
│  │ 1        │ 102        │ 2     │    │ 102        │ Mouse        │ 500     │   │
│  │ 2        │ 101        │ 1     │    └────────────┴──────────────┴─────────┘   │
│  └──────────┴────────────┴───────┘                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Third Normal Form (3NF)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    3NF - THIRD NORMAL FORM                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULES:                                                                         │
│  1. Must be in 2NF                                                              │
│  2. No TRANSITIVE DEPENDENCY (non-key depends on another non-key)               │
│                                                                                 │
│  BEFORE (Violates 3NF):                                                         │
│  employees (PK: emp_id)                                                         │
│  ┌────────┬────────┬─────────┬───────────────┬─────────────────┐                │
│  │ emp_id │ name   │ dept_id │ dept_name     │ dept_location   │                │
│  ├────────┼────────┼─────────┼───────────────┼─────────────────┤                │
│  │ 1      │ Alice  │ 10      │ Engineering   │ Building A      │                │
│  │ 2      │ Bob    │ 10      │ Engineering   │ Building A      │                │
│  │ 3      │ Carol  │ 20      │ Marketing     │ Building B      │                │
│  └────────┴────────┴─────────┴───────────────┴─────────────────┘                │
│                                                                                 │
│  PROBLEM: dept_name, dept_location depend on dept_id, NOT emp_id!               │
│           emp_id → dept_id → dept_name (Transitive dependency)                  │
│                                                                                 │
│  AFTER (3NF):                                                                   │
│  employees                             departments                              │
│  ┌────────┬────────┬─────────┐        ┌─────────┬─────────────┬─────────────┐   │
│  │ emp_id │ name   │ dept_id │        │ dept_id │ dept_name   │ location    │   │
│  ├────────┼────────┼─────────┤        ├─────────┼─────────────┼─────────────┤   │
│  │ 1      │ Alice  │ 10      │        │ 10      │ Engineering │ Building A  │   │
│  │ 2      │ Bob    │ 10      │        │ 20      │ Marketing   │ Building B  │   │
│  │ 3      │ Carol  │ 20      │        └─────────┴─────────────┴─────────────┘   │
│  └────────┴────────┴─────────┘                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### BCNF (Boyce-Codd Normal Form)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BCNF - BOYCE-CODD NORMAL FORM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULES:                                                                         │
│  1. Must be in 3NF                                                              │
│  2. Every DETERMINANT must be a CANDIDATE KEY                                   │
│     (If X → Y, then X must be a candidate key)                                  │
│                                                                                 │
│  BEFORE (3NF but violates BCNF):                                                │
│  student_courses (student can have only one teacher per subject)                │
│  ┌──────────┬──────────┬─────────┐                                              │
│  │ student  │ subject  │ teacher │   PK: (student, subject)                     │
│  ├──────────┼──────────┼─────────┤   Each teacher teaches only ONE subject      │
│  │ Alice    │ Math     │ Mr.X    │                                              │
│  │ Bob      │ Math     │ Mr.X    │   Functional Dependencies:                   │
│  │ Alice    │ Physics  │ Mr.Y    │   (student, subject) → teacher               │
│  │ Carol    │ Math     │ Mr.Z    │   teacher → subject  ← PROBLEM!              │
│  └──────────┴──────────┴─────────┘   (teacher determines subject but isn't key) │
│                                                                                 │
│  AFTER (BCNF):                                                                  │
│  student_teacher                       teacher_subject                          │
│  ┌──────────┬─────────┐               ┌─────────┬──────────┐                    │
│  │ student  │ teacher │               │ teacher │ subject  │                    │
│  ├──────────┼─────────┤               ├─────────┼──────────┤                    │
│  │ Alice    │ Mr.X    │               │ Mr.X    │ Math     │                    │
│  │ Bob      │ Mr.X    │               │ Mr.Y    │ Physics  │                    │
│  │ Alice    │ Mr.Y    │               │ Mr.Z    │ Math     │                    │
│  │ Carol    │ Mr.Z    │               └─────────┴──────────┘                    │
│  └──────────┴─────────┘                                                         │
│                                                                                 │
│  Now teacher → subject is in its own table where teacher IS the key!            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Normalization Summary

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- NORMALIZATION QUICK REFERENCE
-- ═══════════════════════════════════════════════════════════════════════════════

/*
1NF: No multi-valued attributes, no repeating groups
     → Split arrays into separate rows/tables

2NF: No partial dependencies (for composite keys)
     → Every non-key column depends on ENTIRE primary key

3NF: No transitive dependencies
     → Non-key columns don't depend on other non-key columns

BCNF: Every determinant is a candidate key
      → Stricter than 3NF, handles special cases


DENORMALIZATION (intentional):
Sometimes we DENORMALIZE for:
1. Read performance (fewer JOINs)
2. Reporting tables
3. Data warehousing

Example: Store customer name in orders table to avoid JOINs:
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(100),  -- Denormalized for reporting
    ...
);
*/
```

---

> **Navigation**: [< Previous](09_Window_Functions.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Indexes_Performance.md)

### Historical Evolution

**Predecessors (with years):**
- **Edgar F. Codd** (1970): Introduced 1NF, 2NF, and 3NF in his landmark paper — formally defining first normal form (atomic values), second normal form (no partial dependencies), and third normal form (no transitive dependencies) as the theoretical framework for database design.
- **Raymond Boyce & Codd** (1974): Created Boyce-Codd Normal Form (BCNF) addressing edge cases where 3NF permitted anomalies — a stricter definition requiring every determinant to be a candidate key.
- **Ronald Fagin** (1979): Introduced Fourth Normal Form (4NF) addressing multi-valued dependencies, and later 5NF (Projection-Definition Normal Form) for join dependencies — extending Codd's work to handle more complex real-world scenarios.
- **Chris Date** (1992, 2004): In \"The Relational Model\" and subsequent writings, formalized 5NF and 6NF (Domain-Key Normal Form), and documented the theoretical underpinnings that explain why normalization solves insertion, update, and deletion anomalies.

**Evolution narrative:**
Codd's normal forms emerged from a fundamental insight: data redundancy causes update anomalies. If a customer's address appears in 50 order rows and the customer moves, you must update all 50 rows — miss one and have inconsistent data. 1NF eliminated repeating groups (multi-valued attributes stored as comma-separated strings), 2NF eliminated partial dependencies (where a non-key column depends on only part of a composite key), and 3NF eliminated transitive dependencies (where a non-key column depends on another non-key column). BCNF tightened 3NF for cases like teacher→subject where the determinant was not a candidate key. Fagin's 4NF and 5NF addressed multi-valued and join dependencies respectively — edge cases that arise with complex many-to-many relationships. The practical result: a normalized schema eliminates redundancy at the cost of more joins; denormalization (intentional redundancy for read performance) is a deliberate trade-off made in data warehousing and read-heavy systems.

**Modern practice anchor:**
Today, every SQL interview tests your ability to identify normalization violations and design 3NF/BCNF schemas — these skills trace directly to Codd's 1970 paper and underpin every production database design decision from startup schemas to enterprise data warehouses.

### Production Reality

**Failure modes:**
1. **Over-normalization causing 5+ JOINs per query**: A schema with separate tables for `addresses`, `cities`, `states`, `countries`, and `address_types` means every address display requires 5 JOINs. A dashboard querying 10,000 customers triggers 50,000 join operations — 3-second response times. Fix: denormalize into a `customer_addresses` table with city/state/country columns for read-heavy dashboards.
2. **Missing FK constraints producing orphan rows**: A `orders` table references `customers(customer_id)` but the FK constraint was never created. When a customer is deleted (even with `ON DELETE CASCADE`), orders from edge-case rollbacks remain with null or stale customer_ids, producing "ghost orders" in financial reports. Amazon's 2017 pricing bug was partly traced to orphaned product records from failed batch deletions.
3. **Normalization without profiling actual query patterns**: A startup normalizes aggressively into 20 tables based on theoretical "3NF by default". Their most common query joins 8 tables to display a product catalog — 500ms per page load. The fix: profile with `pg_stat_statements` to find the most frequent queries, then denormalize just those patterns.

**Debug workflow:**
(1) Profile actual query patterns with `pg_stat_statements` or MySQL `performance_schema` — find the top 10 most-called queries and count their JOIN count.
(2) Verify referential integrity: query for orphan rows with `SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE c.customer_id IS NULL` — non-empty results indicate missing FK enforcement.
(3) Measure query latency: `EXPLAIN ANALYZE` the top dashboard query, sum the estimated cost of all join nodes. If cost > 10,000, consider denormalization for that specific read pattern.

**Modern practice anchor:**
Today, hybrid approaches dominate — OLTP systems (banking, e-commerce) use 3NF schemas with FK constraints enforced at the application layer via Prisma/Hibernate, while analytical platforms (Snowflake, BigQuery) use denormalized wide tables for single-pass aggregation queries.


---

## Reality Check

**"Normalization always means fewer tables"** → No — normalization typically means MORE tables, each with fewer columns, less data redundancy, and cleaner update semantics. 1NF: atomic values (no repeating groups in a column). 2NF: remove partial dependencies (non-key column depends on ALL of composite key). 3NF: remove transitive dependencies (non-key column depends on another non-key column). Each normal form can split tables. You end up with more JOIN queries but fewer anomalies.

**"A table in 3NF is always in BCNF"** → 3NF allows a non-prime attribute to determine a prime attribute. BCNF (Boyce-Codd NF) requires every functional dependency X → Y to have X as a superkey. BCNF is strictly stronger than 3NF. Example: a table with composite key (student, course) and a dependency course → instructor: 3NF (instructor is non-prime determining prime, special 3NF case), but BCNF violation (course is not a superkey). In practice, 3NF decomposition is preferred over BCNF because BCNF decomposition may lose some functional dependencies.

**"Denormalized tables are always bad"** → Denormalization is deliberately introducing redundancy for read performance. Data warehouses, reporting systems, and analytics databases (OLAP) are intentionally denormalized: star schema (one fact table, multiple dimension tables) and snowflake schema. Column-oriented databases (BigQuery, Redshift, Parquet files) benefit from wide, denormalized tables because they read columns, not rows. The decision is always: how often are data read vs written? Read-heavy with complex joins: denormalize. Write-heavy with many updates: normalize.

**"The HAVING clause can reference SELECT aliases"** → In standard SQL, HAVING executes before SELECT (logical order: FROM → WHERE → GROUP BY → HAVING → SELECT). So SELECT aliases don't exist yet in HAVING — you should repeat the expression: `GROUP BY category HAVING SUM(amount) > 1000`. Some databases (MySQL, SQLite) allow HAVING to reference SELECT aliases as an extension. For cross-database portability, don't rely on this — repeat the aggregate expression in HAVING.

**"Functional dependencies can always be inferred from sample data"** → Sample data can only DISPROVE a functional dependency (find a counterexample: two rows with the same X but different Y means X → Y doesn't hold). Sample data can NEVER confirm a functional dependency holds for all possible data — the next row added might violate it. Functional dependencies are semantic constraints based on business rules, not statistical observations. "In our data, every order_id maps to one customer_id" could be an accident; the FK constraint is what actually enforces the business rule.
