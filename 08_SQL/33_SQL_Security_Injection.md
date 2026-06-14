**Navigation**: [Back to Index](00_INDEX.md) | [< Prev](32_Partitioning_Sharding_Replication.md) | [Next >](34_TimeSeries_Temporal.md)

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

🔬 **Section Challenge — Security Checklist**

**Challenge 1 (Reasoning):** A service uses prepared statements, but logs full SQL with parameter values on every failed login. What security problem remains, and how do you fix it without losing debuggability?

<details><summary>Answer</summary>

Parameterized queries prevent injection, but full parameter logging can leak passwords, tokens, emails, reset codes, tenant IDs, and sensitive filters into log storage. Fix by logging query shape, operation name, correlation ID, duration, row count, and sanitized parameter metadata such as lengths or hashes. Redact secrets at the logging layer, restrict log access, and keep database errors generic for users while preserving enough internal context to debug.

</details>

### Historical Evolution

**Predecessors (with years):**
- **SQL injection (Phrack)** (1998): The 1998 Phrack article "NT Web Technology Vulnerabilities" first demonstrated SQL injection attacks on web applications
- **Parameterized queries (1990s)**: Database driver libraries began offering parameterized query APIs to separate code from data
- **Microsoft parameterized queries** (1999): Microsoft promoted parameterized queries through MSDN and ASP.NET, evangelizing the practice
- **OWASP Top 10** (2003): The Open Web Application Security Project formalized SQL injection as the #1 web vulnerability, driving industry awareness
- **RBAC (NIST)** (1992): The National Institute of Standards and Technology formalized Role-Based Access Control, providing the authorization model behind least-privilege database users

**Evolution narrative:**
SQL injection emerged as the defining web vulnerability of the early internet, first documented in Phrack (1998) when web applications began accepting user input directly into SQL queries. The attack worked because SQL uses string concatenation, making code and data indistinguishable. Parameterized queries (1990s-2000s) solved this by having drivers send query structure and data separately, ensuring user input is always treated as data. OWASP (2003) formalized awareness, and RBAC (1992, widely adopted later) provided complementary defense through least-privilege principles.

**Modern practice anchor:**
Today's SQL security combines parameterized queries (never concatenate user input), least-privilege database users via RBAC, encryption at rest, and WAFs at the network perimeter—all defending against the attack surface that Phrack first exposed in 1998.