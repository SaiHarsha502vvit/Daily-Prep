

---

## Reality Check

**"Stored procedures replace application code logic"** → Stored procedures run IN the database server. Pros: reduce network round trips for multi-step operations, logic close to data. Cons: hard to test (no unit test frameworks), hard to version-control (schema migrations vs code PRs), not portable across DB engines, can't use application-level libraries, debugging requires DB-specific tools. Modern practice: keep business logic in the application layer, use stored procedures sparingly for truly data-intensive operations. ORM-heavy teams often avoid them entirely.

**"Functions and stored procedures are the same thing"** → Key differences: functions can be used in SELECT/WHERE/FROM clauses; stored procedures cannot. Functions must return a value; procedures may not. Functions generally cannot have side effects (transactions, commit/rollback) — this varies by database. PostgreSQL uses `RETURNS TABLE(...)` for table-valued functions. SQL Server distinguishes scalar functions, table-valued functions, and stored procedures explicitly. Mixing them confuses people new to databases.

**"DETERMINISTIC functions are just informational flags"** → `DETERMINISTIC` tells the optimizer the function always returns the same output for the same input (no side effects, no random/now() calls). The optimizer can cache results, use the function in an index, and apply more aggressive optimizations. A non-deterministic function (like `NOW()`) cannot be indexed. MySQL uses DETERMINISTIC to decide replication safety (non-deterministic UDFs can cause replicas to diverge). This flag has real semantic and performance implications.

**"Triggers are just stored procedures that run automatically"** → Triggers run synchronously in the same transaction as the triggering statement. A trigger failure rolls back the triggering statement. This makes triggers invisible from the application's perspective — an INSERT fails "for no apparent reason" because a trigger failed. Triggers that perform additional DML (INSERT/UPDATE/DELETE) can cause cascading triggers and performance disasters. They're also hard to find in bugs: nothing in the application code calls them. Modern practice: prefer explicit application logic over triggers where possible.

**"User-defined functions in SQL are safe from injection"** → SQL injection can occur inside stored procedures/functions if they build SQL strings dynamically with `EXECUTE` or `EXEC sp_executesql` using unsanitised input. A parameterised stored procedure call is safe. A stored procedure that internally builds `EXECUTE 'SELECT * FROM ' + @tableName` is vulnerable. Dynamic SQL inside stored procedures is a common injection vector that escapes static analysis tools.
