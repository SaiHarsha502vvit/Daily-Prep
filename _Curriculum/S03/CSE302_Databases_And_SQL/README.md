# CSE302 — Databases & SQL

## Semester 3 · Full-Stack Foundation

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can read EXPLAIN plans and diagnose query performance, design a normalized schema and justify every denormalization, reason about isolation levels from the failure mode (lost update, dirty read, phantom), and write production analytics SQL (window functions, CTEs, recursive queries) fluently.
> **Capstone:** Build a SQL Analytics Dashboard against a real public dataset (e.g., Stack Overflow data dump, GitHub Archive). Includes schema design, indexing strategy, and a 10-query dashboard with EXPLAIN-justified performance.

---

## Navigation

| Course                                                                            | Description |
| --------------------------------------------------------------------------------- | ----------- |
| **[CSE301 — OOP & Design Patterns](../CSE301_OOP_And_Design_Patterns/README.md)** | S03 sibling |
| **CSE302 — Databases & SQL**                                                      | This course |
| **[CSE303 — Theory of Computation](../CSE303_Theory_Of_Computation/README.md)**   | S03 sibling |
| **[CSE304 — Numerical Methods](../CSE304_Numerical_Methods/README.md)**           | S03 sibling |

| Related Modules                            | Cross-Reference                                                    |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `08_SQL/`                                  | Primary source — every chapter cited below                         |
| `07_Modern_Java/Ch20_JPA_Hibernate.md`     | ORM layer above SQL; required for understanding N+1 queries        |
| `10_Enterprise_Systems/`                   | Order/inventory/finance schemas that test real DB design           |
| `25_Python_ML_DL_NLP/`                     | Pandas as SQL — same operations, different syntax                  |
| `22_DevOps/`                               | Database backup, replication, monitoring in production             |

---

## Prerequisites

- `CSE201 Data Structures` — Unit 3 (trees for B-tree understanding), Unit 1 (hashmaps for hash indexes)
- `08_SQL/00_INDEX.md` — repo entry point for SQL chapters
- Familiarity with at least one SQL CLI (psql, mysql, sqlite3)

**Constraint:** Read EXPLAIN plans early and often. A learner who only writes SELECT statements and never reads execution plans builds a fragile mental model. By week 4 you should be able to look at any query and predict its plan.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — SQL Foundations (Weeks 1–2)

**Learning Outcomes:**

- Master SELECT, WHERE, GROUP BY, HAVING, ORDER BY — and the canonical order they execute
- Use aggregates correctly; recognize when GROUP BY is silently dropping data
- Reason about NULL semantics (three-valued logic)

#### Week 1 — SELECT, WHERE, GROUP BY

| Day | Topic                              | Read                                                  | Do                                                       |
| --- | ---------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| 1   | SELECT execution order (logical)   | `08_SQL/05_Queries_SELECT_WHERE.md` §1                | Write a query and trace which clauses run in what order  |
| 2   | WHERE filtering, NULL semantics    | `08_SQL/05_Queries_SELECT_WHERE.md` §2-3              | Why does `WHERE col = NULL` never match? Use `IS NULL`   |
| 3   | GROUP BY + aggregates              | `08_SQL/06_Aggregations_GroupBy.md` §1-2              | Implement: count distinct users per day                  |
| 4   | HAVING vs WHERE                    | `08_SQL/06_Aggregations_GroupBy.md` §3                | When can the same filter live in either?                 |
| 5   | Lab + Review                       | —                                                     | **Lab:** Sales report by month + category                |
| 6–7 | Problem Set SQL-PS1                | —                                                     | `08_SQL/00_PROBLEM_SETS.md` PS-1                         |

**Section Challenge (NULL trap):**

> A query `SELECT COUNT(*) FROM orders WHERE status != 'shipped'` returns 4,200. A second query `SELECT COUNT(*) FROM orders WHERE status = 'shipped'` returns 1,500. The total rows in orders is 6,000. Where are the missing 300 rows, and why does this surprise interview candidates?

<details>
<summary>Answer</summary>

```
THE MISSING 300 ROWS HAVE status = NULL.

WHY:
  SQL uses three-valued logic: TRUE, FALSE, NULL (unknown).
  Comparing anything to NULL returns NULL, not TRUE.
  `NULL != 'shipped'` evaluates to NULL, not TRUE.
  WHERE clauses keep ROWS where the predicate is TRUE.
  → NULL rows match NEITHER `= 'shipped'` NOR `!= 'shipped'`.

THE FIX:
  WHERE status != 'shipped' OR status IS NULL
  -- OR --
  WHERE COALESCE(status, '') != 'shipped'

WHY THIS SURPRISES PEOPLE:
  Other languages: `x != y` is symmetric — exactly one of `x = y`, `x != y` is true.
  SQL: with NULL, BOTH are NULL, neither is TRUE. The complement rule breaks.

PRODUCTION REALITY:
  This bug causes silent revenue undercounting in reporting dashboards.
  Common in queries written before schema added a nullable status field.
  Fixed-once-found, but the historical incorrect numbers in the dashboard
  may have already influenced business decisions.
```

</details>

---

#### Week 2 — ORDER BY, LIMIT, DISTINCT

`08_SQL/05_Queries_SELECT_WHERE.md` §4-6 — DISTINCT vs GROUP BY, ORDER BY collation, LIMIT/OFFSET pagination pitfalls.

---

### UNIT 2 — Joins & Subqueries (Weeks 3–4)

**Learning Outcomes:**

- Implement INNER, LEFT, RIGHT, FULL, CROSS, SELF joins
- Recognize when a subquery is correlated vs uncorrelated; understand performance impact
- Choose between subquery, JOIN, and EXISTS based on cardinality

#### Week 3 — Joins

| Day | Topic                                  | Read                                              | Do                                                       |
| --- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | INNER JOIN — the relational algebra basis | `08_SQL/07_Joins_Complete.md` §1-2          | Trace JOIN result manually for 2 small tables            |
| 2   | LEFT/RIGHT OUTER JOIN                  | `08_SQL/07_Joins_Complete.md` §3                  | Find users with no orders using LEFT JOIN + IS NULL      |
| 3   | FULL OUTER JOIN + SELF JOIN            | `08_SQL/07_Joins_Complete.md` §4-5                | Build org chart hierarchy via SELF JOIN                  |
| 4   | Multi-table joins; join order matters? | `08_SQL/07_Joins_Complete.md` §6                  | Use EXPLAIN to verify optimizer pick                     |
| 5–7 | Lab + Problem Set SQL-PS2              | —                                                 | `08_SQL/00_PROBLEM_SETS.md` PS-2                         |

#### Week 4 — Subqueries & EXISTS

`08_SQL/08_Subqueries_CTEs.md` §1-3 — scalar subqueries, correlated subqueries, EXISTS vs IN performance.

---

### UNIT 3 — Data Modeling (Weeks 5–6)

**Learning Outcomes:**

- Design ER diagrams; identify entities, relationships, cardinalities
- Apply normalization 1NF → BCNF; justify every denormalization
- Choose between integer PK and UUID PK based on use case

#### Week 5 — ER Modeling & Normalization

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | ER diagrams — entity, attribute, relationship | `08_SQL/03_DataModeling_Schema.md` §1-2    | Draw ER for a library system                             |
| 2   | 1NF (atomic) → 2NF (full dependency) | `08_SQL/03_DataModeling_Schema.md` §3              | Find a 1NF violation in real data                        |
| 3   | 3NF + BCNF                            | `08_SQL/03_DataModeling_Schema.md` §4              | Decompose a non-3NF table; verify no info loss           |
| 4   | When to denormalize                   | `08_SQL/03_DataModeling_Schema.md` §5              | Identify 3 cases where denorm is correct                 |
| 5–7 | Lab + Problem Set SQL-PS3             | —                                                 | `08_SQL/00_PROBLEM_SETS.md` PS-3                         |

#### Week 6 — Primary Keys, Foreign Keys, Constraints

`08_SQL/03_DataModeling_Schema.md` §6-8 — surrogate vs natural keys; UUID vs serial; CHECK/UNIQUE constraints.

---

### UNIT 4 — Indexing & Optimization (Weeks 7–9)

**Learning Outcomes:**

- Read EXPLAIN/EXPLAIN ANALYZE plans fluently
- Choose between B-tree, hash, GIN, BRIN indexes
- Design composite indexes that support the actual query pattern

#### Week 7 — B-Tree Indexes & EXPLAIN

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | How B-trees work internally          | `08_SQL/47_Theory_Deep_Dive_Database_Internals.md` §1 | Trace a B-tree insert that splits a leaf                 |
| 2   | EXPLAIN — reading the plan            | `08_SQL/11_QueryOptimization.md` §1-2              | Run EXPLAIN on 5 queries; predict the plan first         |
| 3   | Composite index column order         | `08_SQL/11_QueryOptimization.md` §3                | Why does `(a, b)` index NOT serve `WHERE b = ?`?         |
| 4   | Covering indexes (include columns)   | `08_SQL/11_QueryOptimization.md` §4                | Convert an Index Scan + Heap Fetch to Index-Only Scan    |
| 5–7 | Lab + Problem Set SQL-PS4            | —                                                 | `08_SQL/00_PROBLEM_SETS.md` PS-4                         |

#### Week 8 — Non-B-Tree Indexes

`08_SQL/11_QueryOptimization.md` §5 — hash (equality only), GIN (full-text + arrays), BRIN (time-series), partial indexes.

#### Week 9 — Query Optimizer Internals

`08_SQL/11_QueryOptimization.md` §6-7 — cost estimation, statistics, ANALYZE, query rewriting.

---

### UNIT 5 — Transactions & Concurrency (Weeks 10–11)

**Learning Outcomes:**

- State ACID properties from first principles
- Reason about isolation levels from the FAILURE MODE direction
- Diagnose deadlocks via system catalogs

#### Week 10 — ACID + Isolation Levels

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | A, C, I, D each from first principles | `08_SQL/14_TransactionsACID_Complete.md` §1-2   | What does each letter actually guarantee?                |
| 2   | Read Uncommitted → Serializable       | `08_SQL/14_TransactionsACID_Complete.md` §3      | Demo each anomaly: dirty, non-repeatable, phantom        |
| 3   | MVCC and snapshot isolation          | `08_SQL/14_TransactionsACID_Complete.md` §4      | Why PostgreSQL uses MVCC; tradeoffs                      |
| 4   | Lost update — the most common bug    | `08_SQL/14_TransactionsACID_Complete.md` §5      | Reproduce + fix with SELECT FOR UPDATE                   |
| 5–7 | Lab + Problem Set SQL-PS5            | —                                                 | `08_SQL/00_PROBLEM_SETS.md` PS-5                         |

#### Week 11 — Locks, Deadlocks, Connection Pools

`08_SQL/14_TransactionsACID_Complete.md` §6-8 — row vs table locks, deadlock detection, pool sizing (Little's Law).

---

### UNIT 6 — Advanced SQL (Weeks 12–13)

**Learning Outcomes:**

- Use window functions for running totals, rank, dense_rank, lag/lead
- Build hierarchical queries with recursive CTEs
- Pivot/unpivot data for reporting

#### Week 12 — Window Functions

`08_SQL/09_WindowFunctions.md` — partition, order, frame; running total, rank, top-N per group.

#### Week 13 — CTEs (recursive + non-recursive)

`08_SQL/08_Subqueries_CTEs.md` §4-6 — graph traversal in SQL, organizational hierarchy, bill-of-materials explosion.

---

### UNIT 7 — Analytics & Production (Weeks 14–15)

**Learning Outcomes:**

- Build funnel analysis, cohort analysis, retention SQL
- Choose between OLTP and OLAP for a given workload
- Reason about NoSQL alternatives (when to leave SQL)

`08_SQL/15_AnalyticalQueries.md` + `08_SQL/22_NoSQL_MongoDB.md`.

---

### Week 16 — Capstone

**Capstone Project:** [P03 — SQL Analytics Dashboard](../../../00_CURRICULUM/PROJECTS/P03_SQL_Analytics_Dashboard.md)

---

## Problem Sets

[`08_SQL/00_PROBLEM_SETS.md`](../../../08_SQL/00_PROBLEM_SETS.md) — comprehensive practice across all units.

## Exam Prep

- [`00_CURRICULUM/EXAM_BANK.md`](../../../00_CURRICULUM/EXAM_BANK.md) — S03 SQL section
- [`08_SQL/23_SQL_Deep_Reasoning.md`](../../../08_SQL/23_SQL_Deep_Reasoning.md) — interview freeze moments
