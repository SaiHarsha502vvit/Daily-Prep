# 08 - SQL & Databases

> Complete database mastery — from SELECT to database internals.

## 5W1H — Why Study SQL?

**WHY:** SQL is the lingua franca of data — every developer, analyst, and data scientist touches SQL every day. It is the only language that spans OLTP (point-of-sale transactions), OLAP (analytics dashboards), and data engineering (ETL pipelines). Mastering SQL separates engineers who write queries from engineers who understand data systems end-to-end.

**WHO:** Backend engineers building CRUD services, data analysts writing ad-hoc reports, data engineers designing pipelines, ML engineers pulling training features, SREs debugging production incidents, and anyone who interviews at a tech company (SQL is asked at virtually every technical screen).

**WHAT:** This folder covers 49 chapters across 9 themes (Foundations, Core SQL, Advanced, Specialized, Python+SQL, Architecture & Operations, Real-World Production, Interview Mastery, Theory Deep Dive). You will go from writing your first JOIN to reasoning about B-tree page splits and MVCC visibility rules.

**WHEN:** Study this folder AFTER 02_Data_Structures and 03_Algorithms — you need to understand hash tables and B-trees before Indexes (file 11) and Database Internals (file 21). Study it BEFORE 04_Patterns_Templates where SQL-specific patterns (top-K, running totals, histogram) are referenced.

**WHERE:** SQL is the bridge between code and data. Apply it in: backend services (ORM queries, raw SQL for performance), data pipelines (ETL with SQL transforms), analytics (cohort analysis, funnel, retention), interview prep (whiteboard SQL, live coding), and production debugging (slow query logs, EXPLAIN ANALYZE).

**HOW:** Read sequentially within each theme, or jump by theme based on your goal. Each chapter uses the 5W-H framework plus challenge blocks. Start with Foundations; progress to Core SQL; tackle Advanced and Specialization in order; finish with Real-World Production scenarios and Interview Mastery. Aim for mastery of JOINs, Window Functions, and Indexes before claiming intermediate proficiency.

## Reading Strategy

### Beginner Path (4 weeks, 1 hr/day ≈ 28 hours)
1. **Week 1 — Foundations:** Files 01–04 — Database basics, data types, DDL, DML
2. **Week 2 — Core SQL:** Files 05–09 — SELECT/WHERE, Aggregations, JOINs, Subqueries/CTEs, Window Functions
3. **Week 3 — Advanced:** Files 10–14 — Normalization, Indexes, Views/Procs/Triggers, Transactions/ACID, Query Optimization
4. **Week 4 — Specialized:** Files 15–20 — Analytics/ETL, Real-World Cases, Practice Problems (100), Projects (Beginner + Advanced), Interview Top 50, Cheat Sheet

### Intermediate Path (2 weeks, 1.5 hr/day)
1. **Week 1 — Deep Dives:** Files 21–25 — Database Internals, NoSQL/MongoDB, SQL Deep Reasoning, Data Analyst Real-World, Interview Patterns Expanded
2. **Week 2 — Python + SQL:** Files 26–29 — Python integration (sqlite3/psycopg2/SQLAlchemy/pandas), Visualization (matplotlib/seaborn/plotly), Intermediate Analytics (cohort/funnel/RFM/churn), Advanced Analytics (A/B testing/anomaly detection/ML prep)

### Advanced Path (1 week, 2 hr/day)
1. **Days 1–2 — Architecture & Operations:** Files 30–37 — Recursive queries, JSON/XML Modern SQL, Partitioning/Sharding/Replication, SQL Security, Time Series/Temporal, Database Migrations, Advanced Data Modeling, 5W-H Deep Reasoning
2. **Days 3–5 — Real-World Production:** Files 38–42 — 125 production scenarios across 5 files: data growth & storage crises (1–25), query performance crises (26–50), concurrency & transactions (51–75), schema evolution & migrations (76–100), Spring Boot production hell (101–125)
3. **Days 6–7 — Interview Mastery:** Files 43–49 — Interview mindset (SIREN framework), Scenarios explained (3 parts), Theory deep dive (B-Tree math, MVCC, WAL, buffer pool, query optimizer), Problem variants bank (100+ variants)

### Timeboxing Tips
- **Read 1 chapter per session** (45–60 minutes). If a chapter takes longer, note where you stopped and resume there.
- **After each chapter:** attempt all challenge blocks and review the production reality / real-world section.
- **Practice problems:** 1 problem per 15 minutes max. Use a timer; stop and read the solution if stuck.
- **Mock interview:** 5 SQL problems per session with a 20-minute timer per problem. Explain your thought process aloud.
- **Weekly review:** Sundays, run `EXPLAIN ANALYZE` on 3 old queries and re-read your notes on weak areas.

### Progression Map
- **Beginner → Intermediate:** Master JOINs (file 07) + Window Functions (file 09) + Indexes (file 11)
- **Intermediate → Advanced:** Master Transactions (file 13) + Query Optimization (file 14) + Database Internals (file 21)
- **Advanced → Production-Ready:** Master Real-World Scenarios (files 38–42) + Interview Mindset (file 43) + Theory Deep Dive (file 47)

### Skipping Themes
- **Already comfortable with Core SQL?** Start at file 10 (Normalization) or file 15 (Analytics/ETL) — these assume file 09 completion but nothing earlier.
- **Need SQL for data analysis only?** Skip to files 15–20, 24, 28–29 (Analytics + Interview patterns).
- **Need SQL for backend/ORM work?** Prioritize files 01–09, 11, 13, 14, 33 (Security).

## Reading Order

### Foundations (Start Here)

| #   | File                                                    | What You'll Learn                  |
| --- | ------------------------------------------------------- | ---------------------------------- |
| 1   | [Database Basics](01_Foundations_Database_Basics.md)    | RDBMS concepts, tables, schemas    |
| 2   | [Data Types & Constraints](02_DataTypes_Constraints.md) | Types, NOT NULL, UNIQUE, CHECK, FK |
| 3   | [DDL - Structure](03_DDL_Creating_Structure.md)         | CREATE, ALTER, DROP, TRUNCATE      |
| 4   | [DML - Data](04_DML_Manipulating_Data.md)               | INSERT, UPDATE, DELETE, MERGE      |

### Core SQL

| 5 | [SELECT & WHERE](05_Queries_SELECT_WHERE.md) | Filtering, operators, LIKE, IN, BETWEEN |
| 6 | [Aggregations & GROUP BY](06_Aggregations_GroupBy.md) | COUNT, SUM, AVG, HAVING |
| 7 | [JOINs Complete](07_JOINs_Complete.md) | INNER, LEFT, RIGHT, FULL, CROSS, self-join |
| 8 | [Subqueries & CTEs](08_Subqueries_CTEs.md) | Correlated subqueries, recursive CTEs |
| 8b | [Problem Sets](08b_PROBLEM_SETS.md) | MySQL/Oracle dual-syntax practice with mistake explanations |
| 9 | [Window Functions](09_Window_Functions.md) | ROW_NUMBER, RANK, LAG, LEAD, frames |

### Advanced

| 10 | [Normalization](10_Normalization.md) | 1NF through BCNF, denormalization |
| 11 | [Indexes & Performance](11_Indexes_Performance.md) | B-tree, hash, composite, covering indexes |
| 12 | [Views, Procs, Triggers](12_Views_StoredProcs_Triggers.md) | Stored procedures, functions, triggers |
| 13 | [Transactions & ACID](13_Transactions_ACID.md) | Isolation levels, deadlocks, MVCC |
| 14 | [Query Optimization](14_Query_Optimization.md) | EXPLAIN, execution plans, optimization |

### Specialized

| 15 | [Analytics & ETL](15_Analytics_Warehousing_ETL.md) | Data warehousing, ETL pipelines |
| 16 | [Real-World Cases](16_RealWorld_CaseStudies.md) | Production SQL scenarios |
| 17 | [100 Practice Problems](17_Practice_100_Problems.md) | Hands-on problem set |
| 18a | [SQL Projects Beginner](18a_SQL_Projects_Beginner.md) | Build real databases |
| 18b | [SQL Projects Advanced](18b_SQL_Projects_Advanced.md) | Complex project designs |

### Deep Dives

| 19 | [Interview Top 50](19_Interview_Top50.md) | Most asked SQL interview questions |
| 20 | [Cheat Sheet](20_CheatSheet_QuickRef.md) | Quick reference card |
| 21 | [Database Internals](21_Database_Internals.md) | Storage engine, WAL, buffer pool |
| 22 | [NoSQL & MongoDB](22_NoSQL_MongoDB.md) | Document stores, when to use NoSQL |
| 23 | [SQL Deep Reasoning](23_SQL_Deep_Reasoning.md) | SQL reasoning patterns |
| 24 | [Data Analyst Real-World](24_SQL_Data_Analyst_RealWorld.md) | Analytics SQL for data roles |
| 25 | [Interview Patterns](25_Interview_Patterns_Expanded.md) | Advanced interview patterns |

### Python + SQL & Data Analytics

| 26 | [Python SQL Integration](26_Python_SQL_Integration.md) | sqlite3, psycopg2, SQLAlchemy, pandas |
| 27 | [Python SQL Visualization](27_Python_SQL_Visualization.md) | matplotlib, seaborn, plotly dashboards |
| 28 | [Data Analytics Intermediate](28_Data_Analytics_Intermediate.md) | Cohort, funnel, RFM, churn analysis |
| 29 | [Data Analytics Advanced](29_Data_Analytics_Advanced.md) | A/B testing, anomaly detection, ML prep |

### Architecture & Operations

| 30 | [Recursive Queries](30_Recursive_Queries_Hierarchical.md) | Recursive CTEs, org charts, BOM, graphs |
| 31 | [JSON XML Modern SQL](31_JSON_XML_Modern_SQL.md) | JSONB, JSON_TABLE, XML, arrays |
| 32 | [Partitioning & Sharding](32_Partitioning_Sharding_Replication.md) | Range/list/hash partitions, replicas |
| 33 | [SQL Security](33_SQL_Security_Injection.md) | Injection prevention, roles, RLS, encryption |
| 34 | [Time Series & Temporal](34_TimeSeries_Temporal.md) | Temporal tables, SCD types, gap detection |
| 35 | [Database Migrations](35_Database_Migration_Schema.md) | Flyway, Liquibase, Alembic, zero-downtime |
| 36 | [Advanced Data Modeling](36_Advanced_Data_Modeling.md) | Star/snowflake schema, Data Vault |
| 37 | [5W-H Deep Reasoning](37_SQL_5WH_Deep_Reasoning.md) | 5W-H framework applied to all SQL concepts |

### Real-World Production Scenarios (125 scenarios across 5 files) 🆕

| 38 | [Production Scenarios Part 1](38_RealWorld_Production_Scenarios_Part1.md) | IDs, data growth, storage crises (Scenarios 1–25) |
| 39 | [Production Scenarios Part 2](39_RealWorld_Production_Scenarios_Part2.md) | Query performance & optimization crises (Scenarios 26–50) |
| 40 | [Production Scenarios Part 3](40_RealWorld_Production_Scenarios_Part3.md) | Concurrency, transactions & data integrity (Scenarios 51–75) |
| 41 | [Production Scenarios Part 4](41_RealWorld_Production_Scenarios_Part4.md) | Schema evolution, migrations & disasters (Scenarios 76–100) |
| 42 | [Production Scenarios Part 5](42_RealWorld_Production_Scenarios_Part5.md) | Backend & Spring Boot production hell (Scenarios 101–125) |

### Interview Mastery & Theory Deep Dive 🆕

| 43 | [Interview Mindset Guide](43_Interview_Mindset_How_Professionals_Explain.md) | SIREN framework, professional vocabulary, answer structures |
| 44 | [Interview Scenarios Part 1](44_Interview_Scenarios_Explained_Part1.md) | Data & performance scenarios explained interview-grade |
| 45 | [Interview Scenarios Part 2](45_Interview_Scenarios_Explained_Part2.md) | Concurrency, transactions & locks interview-grade |
| 46 | [Interview Scenarios Part 3](46_Interview_Scenarios_Explained_Part3.md) | Schema, migration & architecture interview-grade |
| 47 | [Theory Deep Dive](47_Theory_Deep_Dive_Database_Internals.md) | B-Tree math, MVCC, WAL, buffer pool, query optimizer |
| 48 | [Problem Variants Bank](48_Problem_Variants_Bank.md) | 100+ practice variants across all categories |
| 49 | [SQL Internals Deep](49_SQL_Internals_Deep.md) | Storage engine, planner, and execution internals |
| 50 | [**Schema Design From Requirements**](50_Schema_Design_From_Requirements.md) | **The design pipeline**: prose → entities → keys → constraints → query patterns → indexes. Snapshots vs joins, surrogate/UUID key trade-offs, constraints as the correctness layer, index derivation + leftmost-prefix + sargability, modeling soft deletes / hierarchies / polymorphism / multi-tenancy, expand-contract migration, and a full worked order-system DDL |

## Cross-Reference Map

Use this map to connect SQL concepts to other folders in the curriculum. Each cross-reference links a real concept (not a vague suggestion) to the specific file that makes the connection concrete.

| If you're studying... | Then read these SQL files | And these other-folder files |
| --------------------- | ------------------------- | --------------------------- |
| **Data structures** (02_Data_Structures) | 11_Indexes (B-tree index internals), 21_Internals (B-tree storage, WAL), 30_Recursive (tree traversal via recursive CTE) | 02_DS/01f_Trees_Heaps.md, 02_DS/01g_DS_Internals.md |
| **Algorithms** (03_Algorithms) | 30_Recursive (graph traversal with recursive CTE), 08_Subqueries_CTEs (recursive CTEs as graph algorithm), 09_Window (running totals as DP-like accumulation) | 03_Algorithms/05_Graphs.md, 03_Algorithms/04_DP.md |
| **Patterns & Templates** (04_Patterns_Templates) | 09_Window (top-K patterns, ROW_NUMBER/RANK), 08_Subqueries (correlated subquery patterns), 19_Interview_Top50 (50 canonical SQL patterns) | 04_Patterns/16_DP.md (DP ↔ running totals), 04_Patterns/19_Two_Pointers.md (two-pointer ↔ lead/lag) |
| **Daily Practice** (12_Daily_Practice) | 17_Practice_100, 19_Interview_Top50, 25_Interview_Patterns, 48_Problem_Variants | 12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md |
| **Interview Mastery** (20_Interview_Mastery) | 43_Interview_Mindset (SIREN framework), 44–46_Interview_Scenarios (3 parts), 19_Interview_Top50, 47_Theory_Deep_Dive | 20_Interview/01_The_Interview_Brain.md |

### Reading Order Notes by Role

- **Backend engineers:** Read 01–14 (Foundations → Query Optimization), then 33 (Security), 35 (Migrations), then 13+14 again (Transactions + Optimization are the most production-critical).
- **Data analysts:** Read 01–09 (Foundations → Window Functions), then 15 (Analytics/ETL), 24 (Data Analyst Real-World), 28–29 (Analytics Intermediate/Advanced), 20 (Cheat Sheet for quick reference).
- **ML engineers:** Read 01–09, then 15 (ETL), 28–29 (Analytics for feature engineering), 26 (Python integration for SQL → pandas → model training pipeline).
- **Everyone:** Read 43 (Interview Mindset) before any technical interview, even if you skip to it from anywhere in the folder.

### Historical Evolution

**Predecessors (with years):**
- **Edgar F. Codd (1970):** Published "A Relational Model of Data for Large Shared Data Banks" — introduced relational algebra that all SQL is built on. The paper was theoretical, not a language, but it gave SQL its mathematical foundation.
- **Donald D. Chamberlin & Raymond Boyce (1974):** Created SEQUEL (Structured English Query Language) at IBM San Jose Research. SEQUEL was the first practical attempt to make Codd's algebra usable. The name was later shortened to SQL due to a trademark conflict with a UK aircraft manufacturer.
- **IBM System R (1974–1979):** First full implementation of SQL — proved the relational model was not just theoretically sound but also practical on disk-based hardware. System R introduced the concept of a query optimizer, now standard in every database.
- **Jim Gray (1976):** Authored the paper defining ACID transaction guarantees (Atomicity, Consistency, Isolation, Durability) — the foundation of every production database contract with applications.
- **Michael Stonebraker (1976):** Built INGRES at UC Berkeley, the second major relational database system and the direct ancestor of PostgreSQL, Informix, and other systems. Stonebraker's follow-up project, Postgres (1986), introduced object-relational features later folded into the SQL standard.
- **ANSI SQL-86 (1986):** First SQL standard, freezing language syntax for industry-wide adoption. Vendors could now claim "SQL-compliant."
- **SQL-89 (1989):** Added outer joins (LEFT/RIGHT JOIN syntax). First widespread adoption wave.
- **SQL-92 (1992):** Added isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE), three-valued logic (NULL handling), and CHECK constraints. The version most textbooks still describe.
- **SQL:1999 (1999):** Added recursive CTEs, triggers, stored procedures, and the CASE expression. Turned SQL into a Turing-complete language.
- **SQL:2003 (2003):** Added window functions (ROW_NUMBER, RANK, LAG, LEAD) and XML support. Changed analytics SQL forever.
- **SQL:2006, SQL:2011, SQL:2016:** Incremental additions — more XML support, temporal tables (2011), JSON support (2016).
- **SQL:2023 (2023):** Added JSON_TABLE, powerful pattern-matching recursion, and polymorphic table functions. The current cutting edge.

**Evolution narrative:**
SQL's history traces a path from Codd's 1970 theoretical foundation through 50+ years of standardization and industrial adoption. Codd's relational algebra was mathematically elegant but had no usable interface; Chamberlin and Boyce's SEQUEL (1974) was the practical answer. System R (1974–1979) proved SQL could be implemented efficiently on commodity hardware; Stonebraker's INGRES (1976) ran in parallel at Berkeley, producing the academic lineage that became PostgreSQL. SQL-86 froze the language for vendor adoption — creating the ecosystem fragmentation (PostgreSQL vs. MySQL vs. Oracle vs. SQL Server) that persists today. Subsequent standards added outer joins (1989), isolation levels and three-valued logic (1992), recursive CTEs and window functions (1999/2003), JSON support (2016), and JSON_TABLE (2023). Every modern relational database implements some subset of the ANSI standard; no single database is fully compliant. The language has outlasted dozens of competing query models (CODASYL, network databases, XML databases, object databases) because its declarative model maps naturally to how humans think about data.

**Modern practice anchor:**
Every SQL interview since 2010 expects fluency in window functions (ROW_NUMBER, LAG, LEAD) and recursive CTEs — both standardized in 1999/2003. Production systems rely on SQL's isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) to trade correctness against performance. Database internals (file 21) and query optimization (file 14) are the advanced skills that separate engineers who can diagnose slow queries from those who cannot.

### Production Reality

**Failure mode 1 — N+1 query explosion (Facebook, 2011, estimated 10–100x query overhead):**
An ORM with lazy-loading enabled triggers one SQL query per related record. For a feed displaying 1 user with 50 friends, each friend's posts, and each post's comments, that is 1 + 50 + (50 × N) + (posts × M) queries — potentially thousands. Fix: use eager loading (`JOIN` or `SELECT ... WHERE id IN (...)`) to collapse into 1–3 queries. File 08 (Subqueries/CTEs) and file 11 (Indexes) teach the patterns to avoid this.

**Failure mode 2 — Missing index causing sequential scan on 100M-row table (Stripe, 2018, 3-hour payment outage):**
A `WHERE` clause on an unindexed column forces the database to read every row (sequential scan). On 100M rows this takes minutes, blocking writes and exhausting connection pools. Fix: add a targeted index after confirming with `EXPLAIN ANALYZE`. File 11 (Indexes/Performance) and file 14 (Query Optimization) teach `EXPLAIN` reading and index design.

**Failure mode 3 — SELECT * pulling BLOB into API response (Stack Overflow, 2011, 8-second page loads):**
`SELECT *` fetches all columns including a 500 KB BLOB (user avatar or document). API endpoints return the blob over the wire even though the UI only needs a thumbnail URL. Fix: always name columns explicitly. File 05 (SELECT/WHERE) establishes this as a first-chapter habit.

**Debug workflow (PostgreSQL):**
1. Run `EXPLAIN ANALYZE <query>` — look for `Seq Scan` on large tables or `type=ALL` (index scan failed).
2. Query `pg_stat_statements` to find top time-consuming queries across all sessions: `SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;`
3. Verify indexes with `\d+ table_name` (PostgreSQL) or `SHOW INDEX FROM table_name` (MySQL).
4. Add `LIMIT` to exploratory queries; run `SELECT COUNT(*)` before `SELECT *` on large tables.
5. For transactions: check `pg_locks` for blocking sessions; look for `lockwait` in `pg_stat_activity`.

**Debug workflow (MySQL):**
1. Run `EXPLAIN FORMAT=JSON <query>` — the JSON output includes the full cost estimate breakdown.
2. Enable `slow_query_log=1` and set `long_query_time=1` — inspect the log for queries exceeding threshold.
3. Use `SHOW PROCESSLIST` to find queries in "Sending data" state (usually sequential scans in progress).
4. Verify indexes with `SHOW INDEX FROM table_name` and add with `ALTER TABLE t ADD INDEX (col);`.
5. Use `SHOW ENGINE INNODB STATUS` to inspect lock waits and deadlock graphs.

**Modern practice anchor:**
Production SQL monitoring (Datadog SQL APM, pg_stat_statements, MySQL Performance Schema, Amazon RDS Performance Insights) catches N+1 queries and missing indexes before they cause incidents. Every SQL code review for queries touching tables >1M rows should include `EXPLAIN` output. ORMs (Hibernate, SQLAlchemy, Entity Framework) generate queries that are syntactically correct but often need `EXPLAIN` review — especially for complex joins and subqueries.

---

[← Back to Master Index](../00_MASTER_INDEX.md)
