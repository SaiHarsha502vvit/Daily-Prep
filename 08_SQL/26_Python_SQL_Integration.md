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

| Task         | sqlite3                 | psycopg2                | SQLAlchemy           |
| ------------ | ----------------------- | ----------------------- | -------------------- |
| Connect      | `sqlite3.connect('db')` | `psycopg2.connect(...)` | `create_engine(url)` |
| Parameterize | `?`                     | `%s`                    | `:name`              |
| Fetch all    | `cursor.fetchall()`     | same                    | `result.all()`       |
| Fetch one    | `cursor.fetchone()`     | same                    | `result.first()`     |
| Commit       | `conn.commit()`         | same                    | `session.commit()`   |
| Close        | `conn.close()`          | same                    | `session.close()`    |

### Historical Evolution

**Predecessors (with years):**
- **Python DB-API PEP 249** (1999): Standardized interface for Python database connections, replacing many inconsistent adapter-specific APIs
- **SQLAlchemy** (2006): Introduced expression-based SQL construction and ORM, enabling Pythonic database abstraction
- **psycopg2** (2001): First robust PostgreSQL adapter for Python, enabling production Python/PostgreSQL applications
- **pandas** (2008): Brought DataFrame abstraction to Python, making SQL results first-class analytical objects
- **SQL injection (Phrack 1998)**: Early demonstration of concatenation vulnerabilities that drove parameterized query adoption

**Evolution narrative:**
Before Python DB-API, database access required proprietary libraries with inconsistent APIs. PEP 249 standardized cursor/connection patterns but still required hand-written SQL strings, making applications vulnerable to injection attacks. SQLAlchemy's expression language (2006) introduced safe SQL construction from Python objects, while pandas (2008) created the modern analytics workflow of SQL extraction followed by in-memory transformation. The ecosystem evolved from raw SQL strings toward composable, secure, analytical pipelines.

**Modern practice anchor:**
Today's Python/SQL integration combines SQLAlchemy for connection management and ORM, pandas for analytical transformations, and parameterized queries throughout for security.

### Production Reality

**Failure modes:**
1. **SQL injection from string concatenation**: The Phrack 1998 paper (http://phrack.org/papers/geni ... al_SQLi.html) demonstrated that `cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")` allows `'; DROP TABLE users; --` as input, executing arbitrary SQL. Modern codebases still contain this pattern in legacy ETL scripts, and automated scanners find 1,000+ instances in large Python codebases.
2. **Connection pool exhaustion (HikariCP timeout)**: `ThreadedConnectionPool(maxconn=10)` with 20 concurrent requests queues connections. At 5-second query time, request 11 waits 50 seconds and HikariCP's `connectionTimeout=30000` fires — app returns 500 errors. The pool size of 10 was configured based on dev, not prod load (100× more traffic).
3. **N+1 in Django ORM**: `User.objects.all()` with `select_related` omitted on a foreign key triggers a separate query per user for related orders. On 10,000 users, this generates 10,001 queries. The Django debug toolbar shows query 1 of 10001, but only if debug mode is on (never in production).

**Debug workflow:**
1. Scan for SQL injection vectors: `grep -rn "execute.*f['\"']" --include="*.py" .` or use `bandit -r . -t py` (Bandit B608 rule). Replace all string-formatted SQL with parameterized queries.
2. Monitor HikariCP pool utilization: add `pool.set_pool_name("my-pool");` and expose `HikariPoolMXBean` via JMX. Alert when `activeConnections + idleConnections > maxPoolSize * 0.8`.
3. In Django, add `django.db.models.PerformanceMonitoringMiddleware` or run `SELECT num_queries, time FROM django.db import connection; connection.queries[-1]` after each view to log N+1. Require `select_related` / `prefetch_related` in code review for any view returning > 100 objects.

**Modern practice anchor:**
Production Python/SQL requires SQL injection scanning in CI/CD (Bandit/Semgrep), connection pool metrics in observability dashboards, and Django N+1 detection in staging before every deploy.