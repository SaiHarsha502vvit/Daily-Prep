# WHERE TO START — The Complete Software Engineer Repository

> One question. Five paths. Pick yours.

---

## What brings you here?

---

### A. I want to become an SDET / Automation Engineer
**Who this is for:** developers who want to write automated tests for a living, or working QA engineers moving into code.

**Your entry point:**
```
21_SDET_Playwright_Automation/README.md
```
That folder has its own complete decision tree, 3 curated learning pathways (junior → mid → senior → principal), and a problem-indexed reference ("My test is flaky → go here"). Start there.

**Quick path if you just want to begin:**
1. [SDET Mindset](21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md) — what makes an SDET different from a developer
2. [Playwright Basics](21_SDET_Playwright_Automation/01_Foundations/01_Playwright_TS_Basics.md) — first working test in 30 minutes
3. [POM Architecture](./21_SDET_Playwright_Automation/02_Test_Architecture/05_POM_Architecture_Deep_Dive.md) — how professional test suites are structured

**Prerequisites:** Basic JavaScript or TypeScript. If you need TypeScript first → [Path C](#c-i-want-to-learn-typescript--javascript).

---

### B. I want to be interview-ready (DSA + System Design)
**Who this is for:** engineers preparing for FAANG/top-tier tech interviews, or anyone who wants to stop freezing on algorithm questions.

**Your entry point:**
```
20_Interview_Mastery/00_INDEX.md
```

**Structured study path:**
1. [Algorithm Thinking](03_Algorithms/01_Algorithm_Thinking.md) — Big O, problem-solving approach
2. [Arrays & Memory](02_Data_Structures/01a_Memory_Foundations.md) → [Arrays](02_Data_Structures/01b_Arrays.md) → [LinkedList](02_Data_Structures/01c_LinkedList.md)
3. [HashMap & HashSet](02_Data_Structures/01e_HashTable.md) — the solution to 40% of easy/medium problems
4. [Trees & Heaps](02_Data_Structures/01f_Trees_Heaps.md)
5. [Sorting fundamentals](03_Algorithms/02a_Sorting_Fundamentals.md) + [Search](04_Patterns_Templates/06_Binary_Search_Patterns.md)
6. [Dynamic Programming](03_Algorithms/04b_DP_Fundamentals.md) — the hardest chapter, save for last
7. [System Design](06_OOP_Design/03_System_Design.md) — scale, databases, caching, messaging

**Time estimate:** 6–8 weeks at 2 hours/day following the [76-Day Study Calendar](01_Getting_Started/02_Study_Plan_Calendar.md).

**Deep reasoning files (for interview confidence):**
- [JS freeze moments](16_JavaScript/08_JS_Deep_Reasoning.md) · [Java freeze moments](07_Modern_Java/Ch22_Java_Deep_Reasoning.md) · [DSA freeze moments](03_Algorithms/16_DSA_Deep_Reasoning.md) · [SQL freeze moments](08_SQL/23_SQL_Deep_Reasoning.md)

---

### C. I want to learn TypeScript / JavaScript / React (web frontend)
**Who this is for:** developers learning the web frontend stack — whether new to JS or moving from another language.

**Full detailed path:** [PATH_FRONTEND.md](PATH_FRONTEND.md) — stages 1-5 with checkpoints and time estimates.

**Beginner path (new to web):**
1. [JS Foundations](16_JavaScript/01_JS_Foundations.md) — variables, functions, scope
2. [JS Async & Promises](16_JavaScript/04_JS_Async_Promises.md) — async/await, event loop
3. [TypeScript Foundations](17_TypeScript/01_TS_Foundations.md) — why types matter, basic types, interfaces
4. [TypeScript Advanced](17_TypeScript/02_TS_Advanced_Types.md) — generics, conditional types, mapped types
5. [React](15_React_Frontend/01_React_Fundamentals.md) — components, hooks, state management
6. [CSS](18_CSS_Complete/01_CSS_Foundations.md) — layout, flexbox, grid

**Already know JS, want to level up:**
- [JS Deep Reasoning](16_JavaScript/08_JS_Deep_Reasoning.md) — 15 "freeze moments" that separate juniors from seniors
- [TypeScript Patterns](17_TypeScript/03_TS_Patterns_BestPractices.md) — production patterns
- [React Deep Reasoning](15_React_Frontend/09_React_Deep_Reasoning.md) — reconciliation, fiber, rendering

**Frontend → SDET bridge:**
If you're a frontend dev wanting to add testing skills → [TypeScript Type System for SDETs](./21_SDET_Playwright_Automation/08_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md).

---

### D. I want to master Java / Spring Boot / Backend
**Who this is for:** backend developers learning Java or Spring Boot, or developers coming from another language (Python, JS, C#).

**Full detailed path:** [PATH_JAVA_BACKEND.md](PATH_JAVA_BACKEND.md) — 5 stages with checkpoints, time estimates, and cross-subject connections.

**Core Java path (no Spring yet):**
1. [Java Core Foundations](07_Modern_Java/Ch01_Core_Foundations.md) — inner classes, equals/hashCode, Optional, Iterator
2. [Strings & Immutability](07_Modern_Java/Ch02_Strings_Immutability.md) — String pool, StringBuilder internals
3. [Functional Programming](07_Modern_Java/Ch06_Functional_Programming.md) — lambdas, streams, Optional patterns
4. [Collections Internals](07_Modern_Java/Ch08_Collections_Internals.md) — HashMap/TreeMap/ConcurrentHashMap under the hood
5. [Concurrency](07_Modern_Java/Ch15_Concurrency_Core.md) — threads, locks, CompletableFuture
6. [Java Deep Reasoning](07_Modern_Java/Ch22_Java_Deep_Reasoning.md) — 13 freeze moments for interviews

**Spring Boot path (after Java core):**
1. [Spring Boot Foundations](07_Modern_Java/Ch24_Spring_Boot_Roadmap.md)
2. [JPA & Hibernate](07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md)
3. [REST APIs](07_Modern_Java/Ch37_SB_Controllers_REST.md)
4. [Spring Security](07_Modern_Java/Ch43_SB_Auth_Security.md)
5. [Spring Boot Deep Reasoning](07_Modern_Java/Ch58_SB_Deep_Reasoning.md)

**SQL alongside Java:**
→ [SQL Foundations](08_SQL/01_Foundations_Database_Basics.md) first, then [JPA & Hibernate](07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md).

---

### E. I want to learn SQL / Databases
**Who this is for:** developers who need to write real queries, data engineers, backend devs who rely too much on ORMs.

**Complete SQL path (53 chapters):**
```
08_SQL/00_INDEX.md  ← start here
```

**Fast-track (essential 8):**
1. [Foundations & Execution Order](08_SQL/01_Foundations_Database_Basics.md) — the most critical mental model
2. [JOINs Complete](08_SQL/07_JOINs_Complete.md) — INNER, LEFT, RIGHT, FULL, SELF, CROSS
3. [Aggregations & GROUP BY](08_SQL/06_Aggregations_GroupBy.md) — COUNT, SUM, AVG, GROUP BY, HAVING
4. [Subqueries & CTEs](08_SQL/08_Subqueries_CTEs.md) — correlated subqueries, WITH clause
5. [Window Functions](08_SQL/09_Window_Functions.md) — ROW_NUMBER, RANK, LAG/LEAD
6. [Indexes & Query Plan](08_SQL/11_Indexes_Performance.md) — why queries are slow, EXPLAIN
7. [Transactions & ACID](08_SQL/13_Transactions_ACID.md) — isolation levels, deadlocks
8. [SQL Deep Reasoning](08_SQL/23_SQL_Deep_Reasoning.md) — 10 freeze moments

**SQL → Testing bridge:**
[Database Verification in Tests](./21_SDET_Playwright_Automation/03_Real_World_Scenarios/30_Database_Verification_Direct_SQL.md) — how to write SQL assertions in your Playwright test suite.

---

### F. I just want to browse everything
```
00_MASTER_INDEX.md  ← folder table + quick links
00_TEXTBOOK_PREFACE.md  ← linear 14-week reading order
```

---

## The map in one view

```
WHERE_TO_START.md  ← you are here
│
├── A. SDET / Automation  →  21_SDET_Playwright_Automation/README.md
├── B. Interview / DSA    →  20_Interview_Mastery/  +  02_Data_Structures/  +  03_Algorithms/
├── C. TypeScript / React →  16_JavaScript/  →  17_TypeScript/  →  15_React_Frontend/
├── D. Java / Spring Boot →  07_Modern_Java/  +  08_SQL/
├── E. SQL                →  08_SQL/
└── F. Browse all         →  00_MASTER_INDEX.md
```

---

*If none of these fit, open [`00_MASTER_INDEX.md`](00_MASTER_INDEX.md) — it has the complete folder table with every subject.*
