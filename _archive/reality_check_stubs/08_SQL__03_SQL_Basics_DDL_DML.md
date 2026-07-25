

---

## Reality Check

**"DROP TABLE and TRUNCATE TABLE are both fast and equivalent"** → DROP TABLE removes the table definition AND all data. TRUNCATE TABLE removes all rows but keeps the table structure (DDL vs DML in most DBs, though it behaves differently across databases). Both are faster than `DELETE FROM table` for removing all rows. Key difference: TRUNCATE cannot have a WHERE clause; DELETE can. In PostgreSQL, TRUNCATE is transactional (can be rolled back); in MySQL, TRUNCATE is NOT transactional (cannot be rolled back). DROP with the table structure is always permanent — there is no undo in production without a backup.

**"ALTER TABLE is always a non-blocking operation"** → `ALTER TABLE ADD COLUMN` without a default: typically instant (PostgreSQL, MySQL 8+). `ALTER TABLE ADD COLUMN NOT NULL DEFAULT x`: in older PostgreSQL (< 11), this rewrote the entire table (blocking, proportional to table size). PostgreSQL 11+ added stored defaults, making this instant. Changing column type (e.g., `VARCHAR(100)` to `VARCHAR(200)`) may or may not rewrite. Index creation (`CREATE INDEX`) blocks writes on many databases unless you use `CREATE INDEX CONCURRENTLY` (PostgreSQL) or `ALGORITHM=INPLACE` (MySQL). Never run schema migrations on large production tables without testing lock behavior first.

**"Constraints should be added when the table is created"** → Constraints can be added to existing tables with `ALTER TABLE ADD CONSTRAINT`. In PostgreSQL, `ALTER TABLE ADD CONSTRAINT ... NOT VALID` adds the constraint without checking existing rows (instant) — then `ALTER TABLE VALIDATE CONSTRAINT` validates existing rows in a separate operation without holding a lock for the full duration. This pattern is crucial for adding constraints to large production tables without downtime: add NOT VALID (instant), then validate (slow but not fully blocking).

**"INSERT ... SELECT is the same as SELECT then INSERT"** → `INSERT INTO t1 SELECT ... FROM t2` runs as a single atomic statement inside one transaction. A separate SELECT followed by INSERT has a window between the two statements — another transaction can modify the data between your SELECT and INSERT, leading to lost updates or inconsistent data. `INSERT ... SELECT` is also typically faster (single network round trip, single transaction log entry). Use it for bulk data population and copying data between tables.

**"Default values must be constants"** → Default values can be: constants (`DEFAULT 0`, `DEFAULT 'active'`), functions (`DEFAULT NOW()`, `DEFAULT CURRENT_TIMESTAMP`, `DEFAULT gen_random_uuid()` in PostgreSQL, `DEFAULT UUID()` in MySQL 8+). `DEFAULT NOW()` is evaluated at INSERT time, not at table creation. A column with `DEFAULT gen_random_uuid()` generates a new UUID for each inserted row automatically. PostgreSQL 15+ allows subqueries and complex expressions as defaults in some contexts.
