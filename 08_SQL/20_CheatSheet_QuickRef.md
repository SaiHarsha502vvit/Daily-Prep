> **SQL Chapter 20/20** | [← Previous](19_Interview_Top50.md) | [Index](../00_MASTER_INDEX.md) |

---

## Chapter 24: Quick Reference Cheat Sheet

> SQL QUICK REFERENCE CHEAT SHEET
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ BASIC SYNTAX ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ SELECT columns FROM table ║
> ║ WHERE condition ║
> ║ GROUP BY columns ║
> ║ HAVING group_condition ║
> ║ ORDER BY columns [ASC|DESC] ║
> ║ LIMIT n [OFFSET m] ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ JOIN TYPES ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ INNER JOIN - Matching rows from both tables ║
║ ⚠️ Pitfall: JOIN without ON or with ON always-true (ON 1=1) produces a Cartesian product — every row in the left table matches every row in the right table, exploding O(n×m). Always write a meaningful ON clause.
> ║ LEFT JOIN - All from left + matching from right ║
║ ⚠️ Pitfall: Adding a WHERE filter on the right table (e.g., WHERE right.col IS NULL) converts LEFT JOIN to INNER JOIN silently — rows without matches disappear. Move right-table filters into the ON clause.
> ║ RIGHT JOIN - All from right + matching from left ║
> ║ FULL JOIN - All rows from both tables ║
> ║ CROSS JOIN - Cartesian product ║
║ ⚠️ Pitfall: CROSS JOIN has no ON clause — it returns |A| × |B| rows. Use with extreme care; on two 10,000-row tables this produces 100M rows and can crash the server.
> ║ SELF JOIN - Table joined to itself ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ AGGREGATE FUNCTIONS ║
║ ⚠️ Pitfall: NULL in NOT IN — SELECT * FROM t WHERE col NOT IN (1, NULL) returns zero rows because NULL is unknown, and no known value equals an unknown value. Use NOT EXISTS or NOT IN with COALESCE to handle NULL explicitly.
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ COUNT(\*) - Count all rows ║
> ║ COUNT(column) - Count non-null values ║
> ║ SUM(column) - Sum of values ║
> ║ AVG(column) - Average value ║
> ║ MIN(column) - Minimum value ║
> ║ MAX(column) - Maximum value ║
> ║ GROUP_CONCAT() - Concatenate values (MySQL) ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ WINDOW FUNCTIONS ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ ROW_NUMBER() OVER (ORDER BY col) ║
> ║ RANK() OVER (PARTITION BY col1 ORDER BY col2) ║
> ║ DENSE_RANK() OVER (...) ║
> ║ NTILE(n) OVER (...) ║
> ║ LAG(col, n) OVER (...) - Previous row value ║
> ║ LEAD(col, n) OVER (...) - Next row value ║
> ║ FIRST_VALUE(col) OVER (...) ║
> ║ SUM(col) OVER (ORDER BY col ROWS BETWEEN ... AND ...) ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ STRING FUNCTIONS ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ CONCAT(s1, s2) - Concatenate strings ║
> ║ UPPER(s) - Convert to uppercase ║
> ║ LOWER(s) - Convert to lowercase ║
> ║ TRIM(s) - Remove whitespace ║
> ║ LENGTH(s) - String length ║
> ║ SUBSTRING(s,i,n) - Extract substring ║
> ║ REPLACE(s,a,b) - Replace occurrences ║
> ║ LEFT(s,n) - Left n characters ║
> ║ RIGHT(s,n) - Right n characters ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ DATE FUNCTIONS ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ NOW() - Current datetime ║
> ║ CURDATE() - Current date ║
> ║ DATE(datetime) - Extract date ║
> ║ YEAR(date) - Extract year ║
> ║ MONTH(date) - Extract month ║
> ║ DAY(date) - Extract day ║
> ║ DATEDIFF(d1, d2) - Difference in days ║
> ║ DATE_ADD(d, INTERVAL n) - Add interval ║
> ║ DATE_FORMAT(d, fmt) - Format date ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ COMMON PATTERNS ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ -- Second highest salary ║
> ║ SELECT MAX(sal) FROM t WHERE sal < (SELECT MAX(sal) FROM t); ║
> ║ ║
> ║ -- Find duplicates ║
> ║ SELECT col, COUNT(_) FROM t GROUP BY col HAVING COUNT(_) > 1; ║
> ║ ║
> ║ -- Running total ║
║ ⚠️ Pitfall: UNION ALL vs UNION — UNION deduplicates via sort (O(n log n), cannot stream results), while UNION ALL concatenates with no dedup (O(n), streams immediately). Use UNION ALL unless you explicitly need duplicate elimination.
> ║ SUM(amount) OVER (ORDER BY date) AS running_total ║
> ║ ║
> ║ -- Top N per group ║
> ║ SELECT _ FROM (SELECT _, ROW_NUMBER() OVER ║
> ║ (PARTITION BY grp ORDER BY val DESC) rn FROM t) WHERE rn <= N; ║
> ╚═══════════════════════════════════════════════════════════════════════════╝
>
> ╔═══════════════════════════════════════════════════════════════════════════╗
> ║ OPTIMIZATION TIPS ║
> ╠═══════════════════════════════════════════════════════════════════════════╣
> ║ ✓ Use indexes on WHERE, JOIN, ORDER BY columns ║
║ ⚠️ Pitfall: Index on a low-cardinality column (gender, is_active) returning >15-20% of rows is ignored by the optimizer — a sequential scan is faster. Use partial indexes (WHERE is_active = true) for high-density flag columns.
> ║ ✓ Avoid SELECT \* - select only needed columns ║
║ ⚠️ Pitfall: SELECT * on a table with BLOB or VARCHAR(5000) columns pulls megabytes per row over the wire. A single API endpoint returning 100 rows could transfer 500MB if one column is a document store. Always name columns explicitly.
> ║ ✓ Use EXPLAIN to analyze query plans ║
> ║ ✓ Avoid functions on indexed columns in WHERE ║
> ║ ✓ Use EXISTS instead of IN for large subqueries ║
> ║ ✓ Batch large INSERT/UPDATE/DELETE operations ║
║ ⚠️ Pitfall: A multi-million-row DELETE without a LIMIT holds row locks indefinitely and fills WAL. Batch deletes in chunks of 1,000-10,000 rows with a sleep between batches.
> ║ ✓ Use LIMIT for pagination, prefer keyset over OFFSET ║
║ ⚠️ Pitfall: OFFSET 10000 scans and throws away 10,000 rows every time — O(N) per page, linearly degrading. Keyset pagination (WHERE id > @last_id) is O(log N) regardless of page number.
> ║ ✓ Keep transactions short to avoid locks ║
> ╚═══════════════════════════════════════════════════════════════════════════╝

---

# 🎯 SQL MASTERY CHECKLIST

```
□ Database Fundamentals
  □ Understand RDBMS architecture
  □ Know SQL command categories (DDL, DML, DCL, TCL)
  □ Understand data types and when to use them

□ Basic Operations
  □ Master SELECT with all clauses
  □ Use all comparison and logical operators
  □ Perform CRUD operations confidently

□ Intermediate Skills
  □ Write complex JOINs (including self-joins)
  □ Use GROUP BY with HAVING effectively
  □ Write subqueries (scalar, correlated, EXISTS)
  □ Create and use CTEs and recursive CTEs

□ Advanced Skills
  □ Master all window functions
  □ Understand normalization (1NF to BCNF)
  □ Create and optimize indexes
  □ Write stored procedures and functions
  □ Implement triggers for automation
  □ Manage transactions and understand isolation levels

□ Expert Level
  □ Optimize queries using EXPLAIN
  □ Design star/snowflake schemas
  □ Build ETL pipelines
  □ Perform complex analytics
  □ Handle real-world data engineering challenges

□ Interview Ready
  □ Solve problems in under 15 minutes
  □ Explain query optimization techniques
  □ Discuss trade-offs in database design
  □ Write clean, readable SQL code
```

---

_"Congratulations! You've completed the comprehensive SQL guide from scratch to expert level. Now practice consistently and build projects!"_

---

## 📚 RESOURCES FOR FURTHER LEARNING

```
Online Platforms:
- LeetCode SQL Problems: https://leetcode.com/problemset/database/
- HackerRank SQL: https://www.hackerrank.com/domains/sql
- Mode Analytics SQL Tutorial: https://mode.com/sql-tutorial/
- SQLZoo: https://sqlzoo.net/

Books:
- "SQL Performance Explained" by Markus Winand
- "Learning SQL" by Alan Beaulieu
- "SQL Cookbook" by Anthony Molinaro

YouTube Channels:
- TechTFQ (SQL Interview Questions)
- Alex the Analyst
- Data With Danny

Practice Databases:
- PostgreSQL Sample Databases
- MySQL Sakila Sample Database
- AdventureWorks (SQL Server)
```

---

**END OF SQL COMPLETE GUIDE**

_"Data is the new oil, and now you have the tools to refine it!"_

---

> **Navigation**: [< Previous](19_Interview_Top50.md) | [Back to Index](../00_MASTER_INDEX.md)

> 🔬 **Section Challenge — 📚 RESOURCES FOR FURTHER LEARNING**

**Challenge 1 (Reasoning):** The Optimization Tips say "prefer keyset over OFFSET." On page 500 of results, `SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 9980` takes 3 seconds, but keyset pagination `SELECT * FROM orders WHERE id > 12345 ORDER BY id LIMIT 20` takes 5ms. Why is OFFSET pagination O(N) while keyset is O(1)?

<details><summary>Answer</summary>

`OFFSET 9980` tells the database: "Find the first 10,000 rows in sorted order, **throw away 9,980 of them**, and return the last 20." The engine must scan and sort 10,000 rows every time — even though you only want 20. On page 1000 (`OFFSET 19980`), it scans 20,000 rows. Each subsequent page gets linearly slower. **Keyset pagination** uses `WHERE id > 12345` — the database seeks directly to id=12345 using the B+ Tree index (O(log N) seek, then read 20 contiguous rows). It doesn't matter if you're on page 1 or page 10,000 — the cost is identical. **Trade-off:** Keyset requires: (1) a stable, unique sort key (usually the primary key or a timestamp + id combo), (2) you can't "jump to page 500" — you can only go forward/backward from the current position, (3) the client must remember the last seen key. OFFSET allows random page access but degrades at scale. **Production rule:** Use OFFSET for admin dashboards with few pages. Use keyset for infinite scroll, API pagination, and any dataset > 10K rows.

</details>

### Historical Evolution

**Predecessors (with years):**
- **SEQUEL** (1974): Chamberlin and Boyce at IBM created the first query language prototype for System R, originally called SEQUEL (Structured English Query Language)
- **SQL-86** (1986): First ANSI standard establishing core syntax that remains recognizable today
- **SQL-92** (1992): Added JOINs, subqueries, CASE expressions, and referential integrity—transforming SQL into a complete language
- **O'Reilly Quick Reference Cards** (1980s): Popularized the cheat sheet format as a desk reference for programmers
- **SQLFiddle / DB-Fiddle** (2013): Online SQL sandboxes that made interactive learning accessible without local setup

**Evolution narrative:**
SQL cheat sheets evolved from physical reference cards (laminated quick-refs from O'Reilly and PocketSoft) to digital formats as databases became ubiquitous. The original SEQUEL language (1974) was designed for non-programmers to query databases, but the first SQL standard (1986) was minimal. SQL-92 expanded the language dramatically, making reference sheets necessary for even experienced developers to remember syntax. Modern cheat sheets now include performance tips, window function syntax, and cross-platform differences between PostgreSQL, MySQL, and SQL Server.

**Modern practice anchor:**
SQL quick reference sheets are still used daily in production environments when switching between dialects (PostgreSQL vs MySQL vs Snowflake) or recalling window function frame syntax during live coding.

### Production Reality

**Failure modes:**
1. **UNION vs UNION ALL memory explosion**: `UNION` deduplicates via sort (requires `work_mem`); on 100M-row results it spills to disk, consuming GB of temp space and slowing queries 10x. `UNION ALL` is O(n) with no dedup.
2. **INNER JOIN vs LEFT JOIN semantic trap**: A query that starts as `LEFT JOIN` then adds `WHERE right_table.country = 'US'` silently converts to `INNER JOIN`. The pattern is the #1 cause of missing rows in reports — executives see lower customer counts than expected.
3. **Keyset pagination without sort tiebreaker**: `WHERE id > 12345 ORDER BY id LIMIT 20` works until two rows share the same id (unlikely but real with soft deletes and UUIDs). Without a secondary sort column (e.g., `created_at`), the query returns inconsistent order across pages.

**Debug workflow:**
1. Before adopting a UNION shortcut, run `EXPLAIN` and check `Sort Method: quicksort` vs `Sort Method: index`. If quicksort appears, switch to UNION ALL.
2. For JOIN type verification, count rows before/after: `SELECT COUNT(*) FROM t1 JOIN t2 ON ...` vs `SELECT COUNT(*) FROM t1 LEFT JOIN t2 ON ...`. A 0-row difference means INNER was sufficient; a non-zero difference means LEFT was needed.
3. For keyset pagination, always include a unique tiebreaker: `WHERE (id, created_at) > (12345, '2024-01-01') ORDER BY id, created_at LIMIT 20`.

**Modern practice anchor:**
Production shortcuts require `EXPLAIN ANALYZE` validation before adoption — what looks clean on a sample of 100 rows behaves differently at 10M rows.
