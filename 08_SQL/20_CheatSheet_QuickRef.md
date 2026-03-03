> **SQL Chapter 20/20** | [← Previous](19_Interview_Top50.md) | [Index](../00_MASTER_INDEX.md) | 

---

## Chapter 24: Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         SQL QUICK REFERENCE CHEAT SHEET                          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                              BASIC SYNTAX                                  ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  SELECT columns FROM table                                                ║  ║
║  ║  WHERE condition                                                          ║  ║
║  ║  GROUP BY columns                                                         ║  ║
║  ║  HAVING group_condition                                                   ║  ║
║  ║  ORDER BY columns [ASC|DESC]                                              ║  ║
║  ║  LIMIT n [OFFSET m]                                                       ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                              JOIN TYPES                                    ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  INNER JOIN  - Matching rows from both tables                             ║  ║
║  ║  LEFT JOIN   - All from left + matching from right                        ║  ║
║  ║  RIGHT JOIN  - All from right + matching from left                        ║  ║
║  ║  FULL JOIN   - All rows from both tables                                  ║  ║
║  ║  CROSS JOIN  - Cartesian product                                          ║  ║
║  ║  SELF JOIN   - Table joined to itself                                     ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           AGGREGATE FUNCTIONS                              ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  COUNT(*)         - Count all rows                                        ║  ║
║  ║  COUNT(column)    - Count non-null values                                 ║  ║
║  ║  SUM(column)      - Sum of values                                         ║  ║
║  ║  AVG(column)      - Average value                                         ║  ║
║  ║  MIN(column)      - Minimum value                                         ║  ║
║  ║  MAX(column)      - Maximum value                                         ║  ║
║  ║  GROUP_CONCAT()   - Concatenate values (MySQL)                            ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           WINDOW FUNCTIONS                                 ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  ROW_NUMBER() OVER (ORDER BY col)                                         ║  ║
║  ║  RANK() OVER (PARTITION BY col1 ORDER BY col2)                           ║  ║
║  ║  DENSE_RANK() OVER (...)                                                  ║  ║
║  ║  NTILE(n) OVER (...)                                                      ║  ║
║  ║  LAG(col, n) OVER (...)      - Previous row value                         ║  ║
║  ║  LEAD(col, n) OVER (...)     - Next row value                             ║  ║
║  ║  FIRST_VALUE(col) OVER (...)                                              ║  ║
║  ║  SUM(col) OVER (ORDER BY col ROWS BETWEEN ... AND ...)                   ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           STRING FUNCTIONS                                 ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  CONCAT(s1, s2)   - Concatenate strings                                   ║  ║
║  ║  UPPER(s)         - Convert to uppercase                                  ║  ║
║  ║  LOWER(s)         - Convert to lowercase                                  ║  ║
║  ║  TRIM(s)          - Remove whitespace                                     ║  ║
║  ║  LENGTH(s)        - String length                                         ║  ║
║  ║  SUBSTRING(s,i,n) - Extract substring                                     ║  ║
║  ║  REPLACE(s,a,b)   - Replace occurrences                                   ║  ║
║  ║  LEFT(s,n)        - Left n characters                                     ║  ║
║  ║  RIGHT(s,n)       - Right n characters                                    ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           DATE FUNCTIONS                                   ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  NOW()                   - Current datetime                               ║  ║
║  ║  CURDATE()               - Current date                                   ║  ║
║  ║  DATE(datetime)          - Extract date                                   ║  ║
║  ║  YEAR(date)              - Extract year                                   ║  ║
║  ║  MONTH(date)             - Extract month                                  ║  ║
║  ║  DAY(date)               - Extract day                                    ║  ║
║  ║  DATEDIFF(d1, d2)        - Difference in days                            ║  ║
║  ║  DATE_ADD(d, INTERVAL n) - Add interval                                   ║  ║
║  ║  DATE_FORMAT(d, fmt)     - Format date                                    ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           COMMON PATTERNS                                  ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  -- Second highest salary                                                 ║  ║
║  ║  SELECT MAX(sal) FROM t WHERE sal < (SELECT MAX(sal) FROM t);            ║  ║
║  ║                                                                           ║  ║
║  ║  -- Find duplicates                                                       ║  ║
║  ║  SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1;           ║  ║
║  ║                                                                           ║  ║
║  ║  -- Running total                                                         ║  ║
║  ║  SUM(amount) OVER (ORDER BY date) AS running_total                       ║  ║
║  ║                                                                           ║  ║
║  ║  -- Top N per group                                                       ║  ║
║  ║  SELECT * FROM (SELECT *, ROW_NUMBER() OVER                              ║  ║
║  ║    (PARTITION BY grp ORDER BY val DESC) rn FROM t) WHERE rn <= N;        ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
║  ╔═══════════════════════════════════════════════════════════════════════════╗  ║
║  ║                           OPTIMIZATION TIPS                                ║  ║
║  ╠═══════════════════════════════════════════════════════════════════════════╣  ║
║  ║  ✓ Use indexes on WHERE, JOIN, ORDER BY columns                          ║  ║
║  ║  ✓ Avoid SELECT * - select only needed columns                           ║  ║
║  ║  ✓ Use EXPLAIN to analyze query plans                                    ║  ║
║  ║  ✓ Avoid functions on indexed columns in WHERE                           ║  ║
║  ║  ✓ Use EXISTS instead of IN for large subqueries                         ║  ║
║  ║  ✓ Batch large INSERT/UPDATE/DELETE operations                           ║  ║
║  ║  ✓ Use LIMIT for pagination, prefer keyset over OFFSET                   ║  ║
║  ║  ✓ Keep transactions short to avoid locks                                ║  ║
║  ╚═══════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

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
