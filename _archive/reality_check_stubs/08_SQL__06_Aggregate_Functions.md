

---

## Reality Check

**"GROUP BY and HAVING are optional pair — use one without the other freely"** → `HAVING` without `GROUP BY` filters a single-group aggregate (the entire table is one group): `HAVING COUNT(*) > 100` checks if the table has more than 100 rows. This is valid SQL but unusual. `GROUP BY` without `HAVING` is common — just group and aggregate. They are independent, but HAVING only makes sense in the context of aggregates (using HAVING without an aggregate is equivalent to WHERE and confuses readers).

**"AVG() handles NULL like 0"** → `AVG()` ignores NULLs entirely. `AVG(score)` on values (80, NULL, 90) returns 85 (sum 170 / count 2). If you want NULL treated as 0: `AVG(COALESCE(score, 0))` returns 56.67 (170 / 3). This matters enormously for calculations like "average score of all registered users" where NULL means "didn't take the test" (should be 0 in the average, not excluded). Always clarify what NULL means before aggregating.

**"COUNT(*) and COUNT(col) return the same thing"** → `COUNT(*)` counts ALL rows including those with NULLs. `COUNT(col)` counts rows where col IS NOT NULL. `COUNT(DISTINCT col)` counts distinct non-NULL values. For a table with 100 rows where 20 rows have NULL in the email column: `COUNT(*) = 100`, `COUNT(email) = 80`, `COUNT(DISTINCT email)` = number of unique emails among the 80. Using COUNT(*) when you mean "count non-null values" is a common bug in aggregation reports.

**"You can reference non-aggregated columns freely in GROUP BY queries"** → Standard SQL requires every column in SELECT that is NOT inside an aggregate function to appear in the GROUP BY clause. MySQL (by default, pre-ONLY_FULL_GROUP_BY) historically allowed referencing non-grouped columns — returning an arbitrary value from the group, which is almost never what you want. PostgreSQL and SQL Server are strict. The permissive MySQL behavior is a trap: it silently returns unpredictable values rather than erroring. Enable `ONLY_FULL_GROUP_BY` in MySQL to match standard behavior.

**"ROLLUP and CUBE are just UNION shortcuts"** → `GROUP BY ROLLUP(a, b)` produces: (a, b) groups, (a) subtotals, and a grand total — O(n) vs writing 3 UNION queries. `GROUP BY CUBE(a, b)` produces all combinations: (a,b), (a), (b), and grand total. These are not just shortcuts — the SQL engine can compute them in a single pass through the data. Writing UNION for subtotals is O(n) passes through data; ROLLUP is one pass. For large fact tables, ROLLUP is significantly faster.
