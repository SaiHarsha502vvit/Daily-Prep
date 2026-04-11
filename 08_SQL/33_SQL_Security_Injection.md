> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](32_Partitioning_Sharding_Replication.md) | [Next >](34_TimeSeries_Temporal.md)

# Chapter 33 — SQL Security & Injection Prevention

## 5W-H Framework
- **WHO** needs this? → EVERY developer who writes SQL — security is non-negotiable
- **WHAT** is it? → Protecting databases from attacks, unauthorized access, and data breaches
- **WHEN** to use? → Always. From the first line of SQL you write. Day 1, hour 0
- **WHERE** is it used? → Web apps, APIs, internal tools — anywhere SQL meets user input
- **WHY** learn it? → SQL injection is #1 web vulnerability (OWASP Top 10). One mistake = breach
- **HOW** does it work? → Parameterized queries, least privilege, encryption, auditing

---

## Part 1 — SQL Injection: The #1 Threat

### 1.1 What Is SQL Injection?
```
Normal login:
  Username: alice
  Password: secret123
  
  Query: SELECT * FROM users WHERE name = 'alice' AND pass = 'secret123'
  → Returns alice's row ✅

SQL Injection attack:
  Username: ' OR '1'='1' --
  Password: anything
  
  Query: SELECT * FROM users WHERE name = '' OR '1'='1' --' AND pass = 'anything'
  → The -- comments out the password check
  → '1'='1' is always TRUE
  → Returns ALL users! 🔴 BREACH!
```

### 1.2 Types of SQL Injection
```
┌───────────────────┬────────────────────────────────────────────┐
│ Type              │ Description                                 │
├───────────────────┼────────────────────────────────────────────┤
│ Classic (in-band) │ Injected SQL returns data directly          │
│                   │ Example: ' UNION SELECT * FROM users --     │
├───────────────────┼────────────────────────────────────────────┤
│ Blind (boolean)   │ No data returned, but true/false detected   │
│                   │ Example: ' AND 1=1 -- (page loads)          │
│                   │          ' AND 1=2 -- (page doesn't load)   │
├───────────────────┼────────────────────────────────────────────┤
│ Time-based blind  │ No visible diff, uses delay to detect       │
│                   │ Example: ' AND pg_sleep(5) -- (5s delay)    │
├───────────────────┼────────────────────────────────────────────┤
│ Second-order      │ Malicious data stored, executed later       │
│                   │ Example: Username "admin'--" saved, then    │
│                   │ used in another query unsafely               │
├───────────────────┼────────────────────────────────────────────┤
│ Out-of-band       │ Data exfiltrated via DNS/HTTP side channel  │
└───────────────────┴────────────────────────────────────────────┘
```

### 1.3 Real Attack Scenarios
```sql
-- UNION-based data extraction
-- Attacker in search box types:
-- ' UNION SELECT username, password, NULL FROM admin_users --

-- The app runs:
SELECT product_name, description, price FROM products
WHERE name LIKE '%' UNION SELECT username, password, NULL FROM admin_users --%'
-- Result: admin credentials displayed in search results!

-- DROP TABLE attack
-- ' ; DROP TABLE users; --
-- If app allows statement stacking (MySQL with multi-query, or SQL Server):
SELECT * FROM products WHERE id = ''; DROP TABLE users; --'
-- Result: users table GONE.
```

---




## Part 2 — Prevention: Parameterized Queries

### 2.1 The ONLY Reliable Defense
```
RULE: NEVER concatenate user input into SQL strings.
      ALWAYS use parameterized queries (prepared statements).

❌ VULNERABLE (string concatenation):
   query = f"SELECT * FROM users WHERE name = '{username}'"

✅ SAFE (parameterized):
   query = "SELECT * FROM users WHERE name = %s"
   cursor.execute(query, (username,))
```

### 2.2 Python Examples (All Libraries)
```python
# ✅ sqlite3 — use ? placeholders
import sqlite3
conn = sqlite3.connect("app.db")
cursor = conn.cursor()
cursor.execute("SELECT * FROM users WHERE email = ?", (user_email,))

# ✅ psycopg2 — use %s placeholders
import psycopg2
conn = psycopg2.connect("dbname=mydb")
cursor = conn.cursor()
cursor.execute("SELECT * FROM users WHERE email = %s", (user_email,))

# ✅ SQLAlchemy ORM — automatically parameterized
from sqlalchemy.orm import Session
with Session(engine) as session:
    user = session.query(User).filter(User.email == user_email).first()

# ✅ SQLAlchemy Core — text() with bind parameters
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_email})

# ✅ pandas read_sql — use params argument
import pandas as pd
df = pd.read_sql("SELECT * FROM users WHERE email = %s", conn, params=[user_email])
```

### 2.3 Java Examples
```java
// ❌ VULNERABLE
String query = "SELECT * FROM users WHERE name = '" + username + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);

// ✅ SAFE — PreparedStatement
String query = "SELECT * FROM users WHERE name = ? AND role = ?";
PreparedStatement pstmt = conn.prepareStatement(query);
pstmt.setString(1, username);
pstmt.setString(2, role);
ResultSet rs = pstmt.executeQuery();

// ✅ SAFE — Spring JdbcTemplate
jdbcTemplate.query(
    "SELECT * FROM users WHERE name = ? AND role = ?",
    new Object[]{username, role},
    new UserRowMapper()
);
```

### 2.4 Dynamic Queries (Safe Patterns)
```python
# Problem: dynamic WHERE clauses
# ❌ VULNERABLE
conditions = []
if name:
    conditions.append(f"name = '{name}'")  # INJECTION RISK!
if city:
    conditions.append(f"city = '{city}'")
query = "SELECT * FROM users WHERE " + " AND ".join(conditions)

# ✅ SAFE — dynamic query with parameterized conditions
conditions = []
params = []
if name:
    conditions.append("name = %s")
    params.append(name)
if city:
    conditions.append("city = %s")
    params.append(city)
    
where_clause = " AND ".join(conditions) if conditions else "TRUE"
query = f"SELECT * FROM users WHERE {where_clause}"
cursor.execute(query, params)

# ✅ SAFE — dynamic ORDER BY (whitelist approach)
ALLOWED_SORT_COLUMNS = {"name", "created_at", "email", "id"}
ALLOWED_DIRECTIONS = {"ASC", "DESC"}

sort_col = request.args.get("sort", "id")
sort_dir = request.args.get("dir", "ASC").upper()

if sort_col not in ALLOWED_SORT_COLUMNS:
    sort_col = "id"
if sort_dir not in ALLOWED_DIRECTIONS:
    sort_dir = "ASC"

# Safe because values are from whitelist, not user input
query = f"SELECT * FROM users ORDER BY {sort_col} {sort_dir}"
```

---

## Part 3 — Roles, Permissions & Access Control

### 3.1 Principle of Least Privilege
```sql
-- PostgreSQL: Create roles with minimal permissions

-- Read-only role for reporting
CREATE ROLE report_reader;
GRANT CONNECT ON DATABASE mydb TO report_reader;
GRANT USAGE ON SCHEMA public TO report_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO report_reader;

-- Application role (read + write, no DDL)
CREATE ROLE app_writer;
GRANT CONNECT ON DATABASE mydb TO app_writer;
GRANT USAGE ON SCHEMA public TO app_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_writer;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_writer;

-- Admin role (full access)
CREATE ROLE db_admin;
GRANT ALL PRIVILEGES ON DATABASE mydb TO db_admin;

-- Create users and assign roles
CREATE USER report_bot WITH PASSWORD 'strong_random_pw_1';
GRANT report_reader TO report_bot;

CREATE USER web_app WITH PASSWORD 'strong_random_pw_2';
GRANT app_writer TO web_app;

-- NEVER do this:
-- GRANT ALL PRIVILEGES TO web_app;  -- Over-permissioned!
```

### 3.2 Column-Level Permissions
```sql
-- Hide sensitive columns from reporting users
REVOKE SELECT ON users FROM report_reader;
GRANT SELECT (user_id, name, email, created_at) ON users TO report_reader;
-- report_reader CANNOT see: password_hash, ssn, salary
```

### 3.3 Row-Level Security (PostgreSQL)
```sql
-- Each user can only see their own data
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: users see only their own orders
CREATE POLICY user_sees_own_orders ON orders
    FOR SELECT
    USING (customer_id = current_setting('app.current_user_id')::int);

-- Policy: admins see everything
CREATE POLICY admin_sees_all ON orders
    FOR ALL
    USING (current_setting('app.current_role') = 'admin');

-- Set context before queries (in application)
-- SET app.current_user_id = '42';
-- SET app.current_role = 'user';
-- Now: SELECT * FROM orders; → only shows user 42's orders
```

---

## Part 4 — Data Encryption

### 4.1 Encryption at Rest
```sql
-- PostgreSQL: pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Encrypt sensitive data
INSERT INTO users (name, email, ssn_encrypted)
VALUES (
    'Alice',
    'alice@example.com',
    pgp_sym_encrypt('123-45-6789', 'encryption_key_from_env')
);

-- Decrypt when needed
SELECT 
    name,
    pgp_sym_decrypt(ssn_encrypted, 'encryption_key_from_env') AS ssn
FROM users
WHERE id = 1;

-- Hash passwords (NEVER store plaintext!)
-- Use bcrypt via pgcrypto
INSERT INTO users (name, password_hash)
VALUES ('Alice', crypt('user_password', gen_salt('bf', 12)));

-- Verify password
SELECT id, name FROM users
WHERE name = 'Alice'
AND password_hash = crypt('user_password', password_hash);
```

### 4.2 Transparent Data Encryption (TDE)
```
TDE encrypts the entire database at the disk level.
No application changes needed!

PostgreSQL: Not built-in, use pg_tde extension or disk encryption (LUKS)
MySQL:      ALTER TABLE users ENCRYPTION = 'Y';
SQL Server: ALTER DATABASE mydb SET ENCRYPTION ON;
Oracle:     ALTER TABLESPACE users ENCRYPTION ONLINE USING 'AES256';
```

### 4.3 Connection Encryption (SSL/TLS)
```python
# Always use SSL for database connections
import psycopg2

# ✅ Require SSL
conn = psycopg2.connect(
    host="db.example.com",
    dbname="mydb",
    user="app_user",
    password="secret",
    sslmode="verify-full",      # Verify server certificate
    sslrootcert="/path/ca.crt"  # CA certificate
)

# SQLAlchemy with SSL
from sqlalchemy import create_engine
engine = create_engine(
    "postgresql://user:pass@host/db",
    connect_args={
        "sslmode": "verify-full",
        "sslrootcert": "/path/ca.crt"
    }
)
```

---

## Part 5 — Audit Trails

### 5.1 Audit Trigger (PostgreSQL)
```sql
-- Automatically log all changes
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    table_name  TEXT NOT NULL,
    record_id   TEXT,
    action      TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
    old_data    JSONB,
    new_data    JSONB,
    changed_by  TEXT DEFAULT current_user,
    changed_at  TIMESTAMP DEFAULT NOW(),
    client_ip   INET DEFAULT inet_client_addr()
);

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach to sensitive tables
CREATE TRIGGER users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER orders_audit
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 5.2 Querying Audit Logs
```sql
-- Who changed user 42's email?
SELECT 
    changed_at,
    changed_by,
    action,
    old_data->>'email' AS old_email,
    new_data->>'email' AS new_email
FROM audit_log
WHERE table_name = 'users'
AND record_id = '42'
AND (old_data->>'email' != new_data->>'email' OR action = 'INSERT')
ORDER BY changed_at;

-- Suspicious activity: bulk deletes
SELECT 
    changed_by,
    table_name,
    COUNT(*) AS delete_count,
    MIN(changed_at) AS first_delete,
    MAX(changed_at) AS last_delete
FROM audit_log
WHERE action = 'DELETE'
AND changed_at >= NOW() - INTERVAL '1 hour'
GROUP BY changed_by, table_name
HAVING COUNT(*) > 100
ORDER BY delete_count DESC;
```

---

## Part 6 — Data Masking & Anonymization

### 6.1 Dynamic Data Masking
```sql
-- Create a view that masks sensitive data for non-admin users
CREATE OR REPLACE VIEW users_safe AS
SELECT 
    user_id,
    name,
    -- Mask email: show first 2 chars + domain
    LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2) AS email,
    -- Mask phone: show last 4 digits
    '***-***-' || RIGHT(phone, 4) AS phone,
    -- Hash SSN
    'XXX-XX-' || RIGHT(ssn, 4) AS ssn,
    -- Leave non-sensitive fields as-is
    created_at,
    status
FROM users;

-- Report users get the masked view
GRANT SELECT ON users_safe TO report_reader;
```

### 6.2 GDPR: Right to Erasure
```sql
-- Anonymize user data (keep analytics, remove PII)
CREATE OR REPLACE FUNCTION anonymize_user(p_user_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        name = 'DELETED_USER_' || p_user_id,
        email = 'deleted_' || p_user_id || '@anonymized.local',
        phone = NULL,
        address = NULL,
        ssn = NULL,
        anonymized_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Keep orders for analytics but remove PII
    UPDATE orders SET
        shipping_address = 'ANONYMIZED',
        billing_address = 'ANONYMIZED'
    WHERE customer_id = p_user_id;
    
    -- Log the anonymization
    INSERT INTO audit_log (table_name, record_id, action, new_data)
    VALUES ('users', p_user_id::text, 'ANONYMIZE', '{"reason":"GDPR erasure request"}'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

---




## Security Checklist

```
✅ Parameterized queries — ALWAYS, no exceptions
✅ Least privilege — app user has ONLY needed permissions
✅ No admin credentials in code — use environment variables
✅ SSL/TLS for all database connections
✅ Encrypt sensitive data at rest (pgcrypto, TDE)
✅ Hash passwords with bcrypt/argon2 (NEVER MD5/SHA1)
✅ Row-level security for multi-tenant apps
✅ Audit trail on all sensitive tables
✅ Input validation (length, type, pattern) BEFORE SQL
✅ WAF (Web Application Firewall) in front of web layer
✅ Regular security scans (sqlmap for testing)
✅ GDPR compliance: anonymization procedures ready
⚠️ NEVER log full SQL queries with parameter values in production
⚠️ NEVER expose database errors to end users (use generic messages)
```

---


---



> 🔬 **Section Challenge — Security Checklist**
>
> **Challenge 1 (Reasoning):** JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?
> <details><summary>Answer</summary>
>
> JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.
> </details>
>

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


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](32_Partitioning_Sharding_Replication.md) | [Next >](34_TimeSeries_Temporal.md)
