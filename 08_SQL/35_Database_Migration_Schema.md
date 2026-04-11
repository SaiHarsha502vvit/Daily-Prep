> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](34_TimeSeries_Temporal.md) | [Next >](36_Advanced_Data_Modeling.md)

# Chapter 35 — Database Migration & Schema Evolution

## 5W-H Framework
- **WHO** needs this? → Backend devs, DevOps, DBAs — anyone deploying database changes
- **WHAT** is it? → Tools and patterns for safely evolving database schemas over time
- **WHEN** to use? → Every deploy that changes DB: new columns, tables, indexes, constraints
- **WHERE** is it used? → CI/CD pipelines, production deployments, team development
- **WHY** learn it? → Unmanaged schema changes = data loss, downtime, broken deployments
- **HOW** does it work? → Version-controlled migration files applied incrementally

---

## Part 1 — Why Schema Migration Matters

### 1.1 The Problem Without Migrations
```
Developer A: "I added a column to users"
Developer B: "What column? My code just broke"
Production:  "Nobody ran that ALTER TABLE on prod"
Rollback:    "Which changes need to be reversed?"

Without migrations:
- No audit trail of schema changes
- Manual SQL scripts emailed around (horrifying)
- Impossible to know what state production is in
- Rollbacks are guesswork
- Team conflicts on schema changes
```

### 1.2 What Migrations Give You
```
┌──────────────────────────────────────────────────────────┐
│ V001__create_users.sql                                   │
│ V002__add_email_to_users.sql                             │
│ V003__create_orders_table.sql                            │
│ V004__add_index_orders_date.sql                          │
│ V005__add_status_column_orders.sql                       │
│                                                          │
│ Each file = ONE migration, ONE direction, ONE version    │
│ Applied in ORDER, tracked in a metadata table            │
│ EVERY environment runs them identically                  │
└──────────────────────────────────────────────────────────┘

State: We know EXACTLY what schema version each environment has.
Rollback: Run the "undo" migration in reverse.
Team: Everyone commits migrations to git — merge conflicts caught.
```

---

## Part 2 — Flyway (Java/SQL)

### 2.1 Flyway Basics
```
Flyway is the most popular SQL migration tool for Java projects.

Directory structure:
db/
  migration/
    V1__create_users.sql
    V2__add_email_column.sql
    V3__create_orders.sql
    V4__add_indexes.sql
    R__seed_reference_data.sql   (Repeatable migration)

Naming convention:
  V{version}__{description}.sql   → Versioned (run once)
  R__{description}.sql            → Repeatable (re-run if changed)
  U{version}__{description}.sql   → Undo (rollback, paid version)
```

### 2.2 Sample Migrations
```sql
-- V1__create_users.sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- V2__add_email_and_status.sql
ALTER TABLE users ADD COLUMN email VARCHAR(200);
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
CREATE INDEX idx_users_email ON users (email);

-- V3__create_orders.sql
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id),
    amount      DECIMAL(10,2) NOT NULL,
    order_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    status      VARCHAR(20) DEFAULT 'pending'
);
CREATE INDEX idx_orders_user_date ON orders (user_id, order_date);

-- V4__add_soft_delete.sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP;
-- Don't drop columns in production — add, don't remove!
```

### 2.3 Flyway Configuration
```properties
# flyway.conf
flyway.url=jdbc:postgresql://localhost:5432/mydb
flyway.user=app_user
flyway.password=${DB_PASSWORD}
flyway.locations=filesystem:db/migration
flyway.baselineOnMigrate=true
flyway.validateMigrationNaming=true
flyway.outOfOrder=false
```

### 2.4 Flyway Commands
```bash
# Check current status
flyway info

# Apply pending migrations
flyway migrate

# Validate migrations match applied versions
flyway validate

# Baseline an existing database
flyway baseline -baselineVersion=5

# Clean (DANGER: drops all objects)
# flyway clean  # NEVER in production!
```

---

## Part 3 — Liquibase (XML/YAML/SQL)

### 3.1 Liquibase Changelog (YAML)
```yaml
# changelog.yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: alice
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: SERIAL
                  constraints:
                    primaryKey: true
              - column:
                  name: username
                  type: VARCHAR(50)
                  constraints:
                    nullable: false
                    unique: true
              - column:
                  name: created_at
                  type: TIMESTAMP
                  defaultValueComputed: NOW()
      rollback:
        - dropTable:
            tableName: users

  - changeSet:
      id: 2
      author: bob
      changes:
        - addColumn:
            tableName: users
            columns:
              - column:
                  name: email
                  type: VARCHAR(200)
        - createIndex:
            tableName: users
            indexName: idx_users_email
            columns:
              - column:
                  name: email
      rollback:
        - dropIndex:
            indexName: idx_users_email
        - dropColumn:
            tableName: users
            columnName: email
```

### 3.2 Liquibase SQL Format
```sql
-- changelog.sql
-- changeset alice:1
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
-- rollback DROP TABLE users;

-- changeset bob:2
ALTER TABLE users ADD COLUMN email VARCHAR(200);
CREATE INDEX idx_users_email ON users (email);
-- rollback DROP INDEX idx_users_email; ALTER TABLE users DROP COLUMN email;
```

---

## Part 4 — Python: Alembic (SQLAlchemy)

### 4.1 Setup
```bash
pip install alembic sqlalchemy
alembic init alembic
```

### 4.2 Migration Scripts
```python
# alembic/versions/001_create_users.py
"""create users table

Revision ID: 001
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None

def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('email', sa.String(200)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
    )
    op.create_index('idx_users_email', 'users', ['email'])

def downgrade():
    op.drop_index('idx_users_email')
    op.drop_table('users')
```

```python
# alembic/versions/002_add_orders.py
"""add orders table

Revision ID: 002
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'

def upgrade():
    op.create_table('orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('order_date', sa.Date(), server_default=sa.text('CURRENT_DATE')),
    )

def downgrade():
    op.drop_table('orders')
```

### 4.3 Auto-Generate Migrations
```python
# alembic can detect model changes and auto-generate migrations!
# In your models.py:
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(200))
    phone = Column(String(20))  # NEW COLUMN!

# Then run:
# alembic revision --autogenerate -m "add phone to users"
# Alembic compares models to DB and generates the migration!
```

---

## Part 5 — Zero-Downtime Migrations

### 5.1 The Problem
```
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
→ In PostgreSQL: instant, no lock (if no DEFAULT with volatile expression)

ALTER TABLE large_table ADD COLUMN score INT DEFAULT 0;
→ Before PG 11: rewrites ENTIRE table = LOCKS for hours
→ PG 11+: instant (stores default in catalog)

ALTER TABLE users ALTER COLUMN name TYPE TEXT;
→ Rewrites table = LOCK. Could take hours on large tables!
```

### 5.2 Safe Migration Patterns
```sql
-- Pattern 1: Add column (SAFE — no default or PG 11+ with default)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- Instant, no lock needed

-- Pattern 2: Add NOT NULL column (multi-step)
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- Step 2: Backfill data (in batches!)
UPDATE users SET phone = 'unknown' WHERE phone IS NULL AND id BETWEEN 1 AND 10000;
UPDATE users SET phone = 'unknown' WHERE phone IS NULL AND id BETWEEN 10001 AND 20000;
-- Step 3: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Pattern 3: Rename column (UNSAFE — use the expand/contract pattern)
-- NEVER: ALTER TABLE users RENAME COLUMN name TO full_name;
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(100);
-- Step 2: Backfill
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- Step 3: Deploy new code that writes to BOTH columns
-- Step 4: Verify all rows have full_name populated
-- Step 5: Deploy code that reads from full_name only
-- Step 6: Drop old column (next deploy)
ALTER TABLE users DROP COLUMN name;

-- Pattern 4: Create index concurrently (SAFE)
-- NEVER: CREATE INDEX idx_users_email ON users(email);  -- Locks table!
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);  -- No lock!
```

### 5.3 Backward-Compatible Migrations
```
RULE: Every migration must be compatible with BOTH the old AND new code.

Deploy order:
1. Deploy migration (schema change)
2. Deploy new code

This means:
✅ ADD columns          → old code ignores new columns
✅ ADD tables           → old code doesn't reference them
✅ ADD indexes          → transparent to code
❌ DROP columns         → old code breaks!
❌ RENAME columns       → old code breaks!
❌ Change column type   → old code might break!

For breaking changes, use the EXPAND-CONTRACT pattern:
Expand  → Add new structure alongside old
Migrate → Move data and code to new structure
Contract → Remove old structure (after all code uses new)
```

---

## Part 6 — Migration Best Practices

### 6.1 Migration Checklist
```
Before writing a migration:
✅ Can it be rolled back? Write both up() and down()
✅ Is it backward-compatible with current code?
✅ For large tables: will it lock? Use CONCURRENTLY, batch updates
✅ Does it have a timeout? SET lock_timeout = '5s';
✅ Is it tested on a staging DB with production-like data volume?

While writing:
✅ One logical change per migration file
✅ Include comments explaining WHY (not just what)
✅ Use IF EXISTS / IF NOT EXISTS for safety
✅ Never modify a migration that's already been applied

After deploying:
✅ Verify migration applied: check schema_version table
✅ Monitor performance: new indexes, changed queries
✅ Have a rollback plan tested before deploying
```

### 6.2 Python: Migration Testing Script
```python
"""Verify migration health across environments."""
import pandas as pd
from sqlalchemy import create_engine, text

ENVIRONMENTS = {
    "dev":     "postgresql://user:pass@dev-db/mydb",
    "staging": "postgresql://user:pass@staging-db/mydb",
    "prod":    "postgresql://user:pass@prod-db/mydb",
}

for env_name, conn_str in ENVIRONMENTS.items():
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        # Flyway: check schema_version
        result = conn.execute(text(
            "SELECT version, description, installed_on "
            "FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5"
        ))
        print(f"\n=== {env_name.upper()} ===")
        for row in result:
            print(f"  V{row[0]}: {row[1]} ({row[2]})")
```

---

## Tool Comparison

```
┌─────────────┬───────────┬────────────┬─────────────┐
│ Feature     │ Flyway    │ Liquibase  │ Alembic     │
├─────────────┼───────────┼────────────┼─────────────┤
│ Language    │ Java/SQL  │ Java/Multi │ Python      │
│ Format      │ SQL files │ XML/YAML/  │ Python      │
│             │           │ SQL/JSON   │ scripts     │
│ Auto-detect │ No        │ No         │ Yes (models)│
│ Rollback    │ Paid only │ Built-in   │ Built-in    │
│ DB support  │ 20+ DBs   │ 50+ DBs   │ SQLAlchemy  │
│ Complexity  │ Simple    │ Complex    │ Medium      │
│ Best for    │ Java/SQL  │ Enterprise │ Python/     │
│             │ projects  │ projects   │ Flask/Django│
└─────────────┴───────────┴────────────┴─────────────┘
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


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](34_TimeSeries_Temporal.md) | [Next >](36_Advanced_Data_Modeling.md)
