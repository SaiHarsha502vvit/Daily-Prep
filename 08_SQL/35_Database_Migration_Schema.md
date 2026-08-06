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

ALTER TABLE users ALTER COLUMN user_id TYPE BIGINT;  -- was INT
→ Rewrites table = LOCK. Could take hours on large tables!
   (INT and BIGINT are different widths — not binary-coercible)

ALTER TABLE users ALTER COLUMN name TYPE TEXT;  -- was VARCHAR(n)
→ Instant, no rewrite. VARCHAR and TEXT share the same on-disk
   representation, so PostgreSQL only has to update the catalog.
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

### Historical Evolution

**Predecessors (with years):**
- **Liquibase** (2006): Introduced XML-based changelog files for declarative database schema migration, enabling team collaboration
- **Flyway** (2010): Founded by Axel Fontaine, focused on simplicity with SQL-script-based migrations for Java ecosystems
- **Alembic** (2011): Created by Mike Bayer for SQLAlchemy, providing Python-native migration infrastructure with autogeneration from model changes
- **Expand-contract pattern** (2010s): Industry practice of multi-phase migrations adding columns before removing old ones to avoid downtime
- **gh-ost (GitHub)** (2016): GitHub's triggerless online schema change tool demonstrated safe live migrations without replication lag

**Evolution narrative:**
Early database deployments used manual SQL scripts with no versioning, making coordination across teams and environments chaotic. Liquibase (2006) pioneered declarative changes with XML changelogs, while Flyway (2010) brought simplicity-first SQL-script migrations to DevOps workflows. Alembic (2011) solved Python-specific needs by autogenerating migrations from SQLAlchemy model changes. As zero-downtime requirements grew, the expand-contract pattern emerged, and gh-ost (2016) demonstrated that triggerless migration was possible at scale.

**Modern practice anchor:**
Today's schema migrations combine versioned migration tools (Flyway/Liquibase/Alembic) with expand-contract patterns for safe online changes, automated testing in staging, and rollback procedures tested before production deployment.


---

## Reality Check

**"Database migrations are just SQL scripts run in order"** → That's the basic mechanism. The real challenge: migrations must be idempotent and reversible (or at least safely re-runnable if interrupted), multiple developers adding migrations simultaneously creates ordering conflicts, migrations on live production data must not lock tables (see ADD COLUMN with default, NOT VALID constraints), and rollbacks are often harder than the forward migration (data transformed cannot easily be un-transformed). Tools (Flyway, Liquibase, Alembic) enforce ordering via version numbers and checksums — they track which migrations ran and refuse to re-run already-applied migrations.

**"You can always roll back a migration"** → DDL changes: adding a column or table is easily rolled back (drop). But: removing a column or table DESTROYS DATA — rollback restores the column/table but not the data unless you have a backup. Changing a column type (VARCHAR → INTEGER) may truncate or fail for existing data. Data migrations (populating a new column from existing data) are hard to reverse. The "expand-contract" pattern for zero-downtime migrations: first add the new column (backward compatible), deploy new code that writes to both, migrate data, deploy code that reads from new column only, then drop the old column.

**"Flyway and Liquibase are equivalent migration tools"** → Different philosophies: Flyway uses versioned SQL files (`V1__description.sql`) — simple, SQL-native, the tool just runs files in version order. Liquibase uses an XML/YAML/JSON changelog format with database-agnostic change types (`<createTable>`, `<addColumn>`) that it translates to the target database's SQL. Liquibase enables: multi-database portability, checksum validation, rollback scripts per changeset, conditional execution. Flyway is simpler to get started; Liquibase is more powerful for complex multi-DB scenarios.

**"Schema migration in production is the same as in development"** → Development: migration runs on empty or small dataset — fast, errors visible immediately. Production: migration runs on tables with millions of rows — an ALTER TABLE can take hours and lock the table. Production migration considerations: use CONCURRENTLY for index creation, use NOT VALID for constraint addition, batch large data migrations (UPDATE WHERE id BETWEEN x AND y), use a maintenance window or ensure migration is non-locking, test on a production-sized dataset before running live. Timing your migration on 100 rows tells you nothing about timing on 100M rows.

**"The migration tool handles all schema changes"** → Migration tools handle structural changes but not: application-level data integrity (migrating data from old format to new must be coded in the migration), stored procedure changes that depend on data (may need data migration first), permissions/role changes (grant/revoke), database-specific features not in the migration tool's abstraction (partial indexes in PostgreSQL, spatial types, custom operators), and managing multiple databases in a distributed system (each database may be at a different version during rolling deployment).
