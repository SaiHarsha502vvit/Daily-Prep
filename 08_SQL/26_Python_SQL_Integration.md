> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](25_Interview_Patterns_Expanded.md) | [Next >](27_Python_SQL_Visualization.md)

# Chapter 26 — Python + SQL Integration

## 5W-H Framework
- **WHO** needs this? → Backend devs, data engineers, analysts, anyone querying databases from code
- **WHAT** is it? → Connecting Python to databases, executing queries, processing results programmatically
- **WHEN** to use? → Data pipelines, ETL, reporting, API backends, automation scripts
- **WHERE** is it used? → Flask/Django backends, data science notebooks, cron jobs, microservices
- **WHY** learn it? → SQL alone can't build apps — you need a programming language to orchestrate
- **HOW** does it work? → Python libraries (sqlite3, psycopg2, SQLAlchemy) send queries and receive results as Python objects

---

## Part 1 — sqlite3: Built-in & Zero Setup

### 1.1 Why Start Here
```
sqlite3 ships with Python — no installation, no server, no config.
Perfect for learning, prototyping, small apps.
```

### 1.2 Connection Lifecycle
```python
import sqlite3




# CREATE connection (creates file if not exists)
conn = sqlite3.connect('myapp.db')    # file-based
conn = sqlite3.connect(':memory:')     # in-memory (testing)

# CREATE cursor (the query executor)
cursor = conn.cursor()

# EXECUTE queries
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')

# COMMIT changes (DDL/DML)
conn.commit()

# CLOSE when done
conn.close()
```

### 1.3 CRUD Operations
```python
import sqlite3

conn = sqlite3.connect('myapp.db')
cursor = conn.cursor()

# === INSERT (parameterized — NEVER string formatting!) ===
cursor.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ("Harsha", "harsha@example.com")
)

# === INSERT MANY ===
users = [
    ("Alice", "alice@example.com"),
    ("Bob", "bob@example.com"),
    ("Charlie", "charlie@example.com"),
]
cursor.executemany(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    users
)
conn.commit()

# === SELECT ===
cursor.execute("SELECT * FROM users WHERE name LIKE ?", ("%a%",))
rows = cursor.fetchall()          # List of tuples
for row in rows:
    print(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}")

# fetchone() — single row
# fetchmany(n) — n rows

# === UPDATE ===
cursor.execute(
    "UPDATE users SET email = ? WHERE name = ?",
    ("newemail@example.com", "Harsha")
)

# === DELETE ===
cursor.execute("DELETE FROM users WHERE id = ?", (1,))
conn.commit()
conn.close()
```

### 1.4 Context Manager Pattern (Best Practice)
```python
import sqlite3

# Auto-commit on success, auto-rollback on exception
with sqlite3.connect('myapp.db') as conn:
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)",
                   ("Dave", "dave@example.com"))
    # No need for conn.commit() — context manager handles it

# Row factory for named access
conn = sqlite3.connect('myapp.db')
conn.row_factory = sqlite3.Row  # Access columns by name!
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
for row in cursor.fetchall():
    print(f"Name: {row['name']}, Email: {row['email']}")
conn.close()
```

### 1.5 SQL Injection — The #1 Security Rule
```python
# ❌ NEVER DO THIS — SQL INJECTION VULNERABILITY
name = input("Enter name: ")
cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")
# If user enters: ' OR '1'='1  → returns ALL rows
# If user enters: '; DROP TABLE users; --  → deletes table!

# ✅ ALWAYS USE PARAMETERIZED QUERIES
cursor.execute("SELECT * FROM users WHERE name = ?", (name,))
```

```
WHY parameterized queries prevent injection:

User input: ' OR '1'='1
                                      
String format:  SELECT * FROM users WHERE name = '' OR '1'='1'
                → SQL engine sees TWO conditions → returns all rows!

Parameterized:  SELECT * FROM users WHERE name = ?
                Parameter: "' OR '1'='1"
                → SQL engine sees: name equals the LITERAL STRING "' OR '1'='1"
                → Returns nothing (no user has that name)
```

---

## Part 2 — psycopg2: PostgreSQL from Python

### 2.1 Installation & Connection
```bash
pip install psycopg2-binary  # binary version (no C compiler needed)
```

```python
import psycopg2

# Connection with all parameters
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="mydb",
    user="postgres",
    password="secret"
)

# Or connection string
conn = psycopg2.connect("postgresql://postgres:secret@localhost:5432/mydb")

# IMPORTANT: psycopg2 starts a transaction automatically
# You MUST commit or rollback
cursor = conn.cursor()
cursor.execute("SELECT version()")
print(cursor.fetchone())
conn.close()
```

### 2.2 Parameterized Queries (PostgreSQL uses %s, not ?)
```python
import psycopg2

conn = psycopg2.connect("postgresql://postgres:pass@localhost/mydb")
cursor = conn.cursor()

# === INSERT with RETURNING ===
cursor.execute(
    "INSERT INTO products (name, price) VALUES (%s, %s) RETURNING id",
    ("Laptop", 999.99)
)
new_id = cursor.fetchone()[0]
print(f"New product ID: {new_id}")

# === Named parameters ===
cursor.execute(
    "SELECT * FROM products WHERE price BETWEEN %(min)s AND %(max)s",
    {"min": 100, "max": 500}
)

conn.commit()
conn.close()
```

### 2.3 Connection Pooling (Production Pattern)
```python
from psycopg2 import pool

# Create pool once at app startup
connection_pool = pool.ThreadedConnectionPool(
    minconn=2,
    maxconn=10,
    host="localhost",
    database="mydb",
    user="postgres",
    password="secret"
)

# Get connection from pool
conn = connection_pool.getconn()
try:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE status = %s", ("pending",))
    orders = cursor.fetchall()
    conn.commit()
finally:
    # Return to pool (NOT close!)
    connection_pool.putconn(conn)

# At app shutdown
connection_pool.closeall()
```

---

## Part 3 — PyMySQL: MySQL from Python

```bash
pip install pymysql
```

```python
import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='secret',
    database='mydb',
    cursorclass=pymysql.cursors.DictCursor  # Returns dicts!
)

with conn:
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM employees WHERE department = %s",
            ("Engineering",)
        )
        for row in cursor.fetchall():
            print(f"{row['name']}: {row['salary']}")
```

---

## Part 4 — SQLAlchemy: The Python SQL Toolkit

### 4.1 Why SQLAlchemy?
```
sqlite3/psycopg2/pymysql → Low-level, database-specific
SQLAlchemy              → Universal, works with ANY database
                        → Two modes: Core (SQL) and ORM (objects)

                 ┌──────────────────────┐
                 │    Your Python Code   │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │     SQLAlchemy ORM    │  ← Classes = Tables
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │    SQLAlchemy Core    │  ← SQL as Python objects
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │    Database Driver    │  ← psycopg2, pymysql, etc.
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │  PostgreSQL / MySQL   │
                 │  / SQLite / Oracle    │
                 └──────────────────────┘
```

### 4.2 SQLAlchemy Core (SQL Expression Language)
```python
from sqlalchemy import create_engine, text

# Engine = connection factory
engine = create_engine("sqlite:///myapp.db", echo=True)  # echo=True logs SQL
# PostgreSQL: "postgresql://user:pass@localhost/mydb"
# MySQL: "mysql+pymysql://user:pass@localhost/mydb"

# Execute raw SQL
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users WHERE age > :age"), {"age": 25})
    for row in result:
        print(row)
    conn.commit()
```

### 4.3 SQLAlchemy ORM (Object-Relational Mapping)
```python
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, Session
from datetime import datetime

Base = declarative_base()

# Define table as Python class
class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"Product(id={self.id}, name={self.name}, price={self.price})"

# Create engine and tables
engine = create_engine("sqlite:///shop.db")
Base.metadata.create_all(engine)

# CRUD with ORM
with Session(engine) as session:
    # CREATE
    laptop = Product(name="Laptop", price=999.99, category="Electronics")
    session.add(laptop)
    session.commit()
    
    # READ
    products = session.query(Product).filter(Product.price > 500).all()
    for p in products:
        print(p)
    
    # UPDATE
    laptop.price = 899.99
    session.commit()
    
    # DELETE
    session.delete(laptop)
    session.commit()
```

### 4.4 Relationships (Foreign Keys)
```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    amount = Column(Float)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    customer = relationship("Customer", back_populates="orders")

# Usage
with Session(engine) as session:
    customer = Customer(name="Harsha")
    order1 = Order(amount=150.00, customer=customer)
    order2 = Order(amount=250.00, customer=customer)
    session.add(customer)
    session.commit()
    
    # Access related objects
    c = session.query(Customer).filter_by(name="Harsha").first()
    for order in c.orders:
        print(f"Order: ${order.amount}")
```

---

## Part 5 — pandas + SQL: Data Analysis Pipeline

### 5.1 Read SQL into DataFrame
```python
import pandas as pd
import sqlite3

conn = sqlite3.connect('sales.db')




# === Read entire table ===
df = pd.read_sql("SELECT * FROM sales", conn)

# === Read with parameters ===
df = pd.read_sql(
    "SELECT * FROM sales WHERE region = ? AND amount > ?",
    conn,
    params=("East", 1000)
)

# === Read with date parsing ===
df = pd.read_sql(
    "SELECT * FROM orders",
    conn,
    parse_dates=['order_date', 'ship_date']
)

print(df.head())
print(df.describe())
print(df.info())
conn.close()
```

### 5.2 Write DataFrame to SQL
```python
import pandas as pd
import sqlite3

# Create sample data
data = {
    'product': ['Laptop', 'Phone', 'Tablet', 'Watch'],
    'category': ['Electronics', 'Electronics', 'Electronics', 'Accessories'],
    'price': [999.99, 699.99, 399.99, 249.99],
    'units_sold': [150, 300, 200, 500]
}
df = pd.DataFrame(data)

conn = sqlite3.connect('analytics.db')

# Write to database
df.to_sql('products', conn, if_exists='replace', index=False)
# if_exists: 'fail' (default) | 'replace' | 'append'

# Verify
result = pd.read_sql("SELECT * FROM products", conn)
print(result)
conn.close()
```

### 5.3 SQLAlchemy + pandas (Production Pattern)
```python
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("postgresql://user:pass@localhost/mydb")

# Read
df = pd.read_sql_query(
    "SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department",
    engine
)

# Process in Python
df['salary_category'] = pd.cut(df['avg_salary'], 
    bins=[0, 50000, 80000, 120000, float('inf')],
    labels=['Low', 'Medium', 'High', 'Very High'])

# Write back
df.to_sql('department_analysis', engine, if_exists='replace', index=False)
```

---

## Part 6 — Real-World Patterns

### 6.1 ETL Pipeline Pattern
```python
import pandas as pd
from sqlalchemy import create_engine, text

source_engine = create_engine("postgresql://user:pass@source-db/proddb")
dest_engine = create_engine("postgresql://user:pass@analytics-db/warehouse")



# EXTRACT
df = pd.read_sql_query("""
    SELECT o.id, o.order_date, o.amount,
           c.name as customer_name, c.region
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '1 day'
""", source_engine)

# TRANSFORM
df['order_date'] = pd.to_datetime(df['order_date'])
df['month'] = df['order_date'].dt.to_period('M')
df['amount_bucket'] = pd.cut(df['amount'], 
    bins=[0, 100, 500, 1000, float('inf')],
    labels=['Small', 'Medium', 'Large', 'Enterprise'])

# LOAD
df.to_sql('daily_orders_fact', dest_engine, if_exists='append', index=False)
print(f"Loaded {len(df)} rows")
```

### 6.2 Batch Processing Pattern
```python
import sqlite3

conn = sqlite3.connect('large_db.db')
cursor = conn.cursor()

# Process millions of rows without loading all into memory
cursor.execute("SELECT * FROM big_table WHERE processed = 0")

batch_size = 1000
while True:
    rows = cursor.fetchmany(batch_size)
    if not rows:
        break
    
    # Process batch
    for row in rows:
        # ... transform data ...
        pass
    
    print(f"Processed {batch_size} rows")

conn.close()
```

### 6.3 Migration Script Pattern
```python
import sqlite3

def migrate_v1_to_v2(db_path):
    """Add email column and index to users table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current version
    cursor.execute("PRAGMA user_version")
    version = cursor.fetchone()[0]
    
    if version < 2:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("PRAGMA user_version = 2")
        conn.commit()
        print("Migration v1 → v2 complete")
    else:
        print("Already at v2 or later")
    
    conn.close()
```

---

## Part 7 — Comparison & When to Use What

```
┌──────────────┬───────────┬────────────────┬───────────────┐
│   Library    │ Best For  │  Performance   │   Learning    │
├──────────────┼───────────┼────────────────┼───────────────┤
│ sqlite3      │ Prototype │ Fast (local)   │ Start here    │
│ psycopg2     │ PostgreSQL│ Fastest PG     │ After sqlite3 │
│ pymysql      │ MySQL     │ Good           │ If MySQL shop │
│ SQLAlchemy   │ Any DB    │ Slight overhead│ Production    │
│ pandas       │ Analytics │ Memory-heavy   │ Data analysis │
└──────────────┴───────────┴────────────────┴───────────────┘

Decision tree:
  Just learning SQL from Python? → sqlite3
  Building a web app? → SQLAlchemy ORM
  Data analysis/reporting? → pandas + read_sql
  Performance-critical? → psycopg2/pymysql directly
  Need to switch databases later? → SQLAlchemy Core
```

---

## Quick Reference Card

| Task | sqlite3 | psycopg2 | SQLAlchemy |
|------|---------|----------|------------|
| Connect | `sqlite3.connect('db')` | `psycopg2.connect(...)` | `create_engine(url)` |
| Parameterize | `?` | `%s` | `:name` |
| Fetch all | `cursor.fetchall()` | same | `result.all()` |
| Fetch one | `cursor.fetchone()` | same | `result.first()` |
| Commit | `conn.commit()` | same | `session.commit()` |
| Close | `conn.close()` | same | `session.close()` |

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


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](25_Interview_Patterns_Expanded.md) | [Next >](27_Python_SQL_Visualization.md)
