# Java Backend Developer Path

> From zero-to-production on the JVM. Java core → Spring Boot → SQL → Deployment.

← [WHERE_TO_START.md](WHERE_TO_START.md) — not sure which path? Start there first.

---

## Who this is for

- Developers learning Java from scratch (from Python, JS, C#, or no background)
- Java developers who know the language but haven't built production Spring Boot apps
- Backend developers who want to stop relying entirely on an ORM and understand what it's doing

**Not for:** frontend or mobile devs — see [PATH_FRONTEND.md](PATH_FRONTEND.md). For SDET/test automation, see [21_SDET_Playwright_Automation/WHERE_TO_START.md](21_SDET_Playwright_Automation/WHERE_TO_START.md).

---

## The Complete Path

### Stage 1 — Core Java (no frameworks yet)

Master the language before frameworks. Spring Boot hides a lot; when it breaks you need to understand what's underneath.

| # | File | Why now | Est |
|---|------|---------|-----|
| 1 | [Ch01 Core Foundations](07_Modern_Java/Ch01_Core_Foundations.md) | equals/hashCode, Optional, inner classes, Iterator — the traps that burn everyone | 4h |
| 2 | [Ch02 Strings & Immutability](07_Modern_Java/Ch02_Strings_Immutability.md) | String pool, StringBuilder, why `+` in a loop is O(n²) | 2h |
| 3 | [Ch06 Functional Programming](07_Modern_Java/Ch06_Functional_Programming.md) | Lambdas, streams, method references — Spring Boot APIs use these everywhere | 4h |
| 4 | [Ch08 Collections Internals](07_Modern_Java/Ch08_Collections_Internals.md) | HashMap under the hood, when to use TreeMap vs HashMap vs ConcurrentHashMap | 3h |
| 5 | [Ch15 Concurrency Core](07_Modern_Java/Ch15_Concurrency_Core.md) | Threads, locks, race conditions — REST APIs are concurrent by definition | 4h |
| 6 | [Ch22 Java Deep Reasoning](07_Modern_Java/Ch22_Java_Deep_Reasoning.md) | 13 "freeze moments" — the questions you'll blank on in interviews | 2h |

**Checkpoint:** Can you implement a thread-safe cache using a `ConcurrentHashMap` with `computeIfAbsent`? Can you write a `Comparator` using lambda + method reference? If yes, proceed.

---

### Stage 2 — SQL (before the ORM)

Every Spring Boot application eventually touches a database. If you learn JPA before SQL, you'll write queries that accidentally do 10,000 database calls.

| # | File | Why now | Est |
|---|------|---------|-----|
| 7 | [SQL Ch01 Foundations](08_SQL/01_Foundations_Database_Basics.md) | Execution order mental model — the most important thing in SQL | 3h |
| 8 | [SQL Ch06 Aggregations](08_SQL/06_Aggregations_GroupBy.md) | GROUP BY, HAVING, COUNT/SUM/AVG | 2h |
| 9 | [SQL Ch07 JOINs](08_SQL/07_JOINs_Complete.md) | INNER, LEFT, RIGHT, FULL OUTER, SELF — JOIN is the core skill | 3h |
| 10 | [SQL Ch08 Subqueries & CTEs](08_SQL/08_Subqueries_CTEs.md) | Correlated subqueries, WITH clause | 2h |
| 11 | [SQL Ch11 Indexes & Performance](08_SQL/11_Indexes_Performance.md) | Why queries are slow; EXPLAIN; B-tree vs hash indexes | 3h |
| 12 | [SQL Ch13 Transactions & ACID](08_SQL/13_Transactions_ACID.md) | Isolation levels, dirty reads, phantom reads — Spring's `@Transactional` is a thin wrapper around this | 2h |

**Checkpoint:** Write a query that finds the top 3 departments by average salary using only employees who've been at the company > 1 year, with correct HAVING vs WHERE usage.

---

### Stage 3 — Spring Boot Core

Now frameworks make sense because you know what's underneath.

| # | File | Why now | Est |
|---|------|---------|-----|
| 13 | [Ch26 Pre-Spring Part 1](07_Modern_Java/Ch26_Pre_Spring_Part1.md) | Dependency Injection without Spring — understand the pattern first | 3h |
| 14 | [Ch27 Pre-Spring Part 2](07_Modern_Java/Ch27_Pre_Spring_Part2.md) | IoC container, Bean lifecycle, proxy patterns | 3h |
| 15 | [Ch31 Spring Boot Core Part 1](07_Modern_Java/Ch31_SB_Core_Part1.md) | Auto-configuration, application context, property binding | 4h |
| 16 | [Ch32 Spring Boot Data Part 2](07_Modern_Java/Ch32_SB_Data_Part2.md) | JPA, repositories, entity relationships, transactions | 5h |
| 17 | [Ch33 Spring Boot Web Part 3](07_Modern_Java/Ch33_SB_Web_Part3.md) | `@RestController`, request mapping, validation, error handling | 4h |
| 18 | [Ch34 Spring Boot Security Part 4](07_Modern_Java/Ch34_SB_Security_Part4.md) | JWT, session management, CORS, method security | 4h |

**Checkpoint:** Build a REST API with Spring Boot that has: 2 entities with a `@OneToMany` relationship, JWT authentication on protected endpoints, `@Transactional` service layer, global exception handler.

---

### Stage 4 — Production Depth

| # | File | Why now | Est |
|---|------|---------|-----|
| 19 | [Ch40 JPA Deep Dive](07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md) | N+1 query problem, lazy vs eager loading, entity graph | 4h |
| 20 | [Ch43 Auth & Security](07_Modern_Java/Ch43_SB_Auth_Security.md) | OAuth2, OIDC, resource server patterns | 3h |
| 21 | [Ch44 Caching & Scheduling](07_Modern_Java/Ch44_SB_Caching_Scheduling.md) | Redis, `@Cacheable`, `@Scheduled`, TTL strategies | 3h |
| 22 | [Ch45 Actuator & Metrics](07_Modern_Java/Ch45_SB_Actuator_Metrics.md) | Health checks, custom metrics, Prometheus/Grafana integration | 2h |
| 23 | [Ch58 Spring Boot Deep Reasoning](07_Modern_Java/Ch58_SB_Deep_Reasoning.md) | The 15 questions that trip up even experienced devs | 3h |
| 24 | [Ch59 SB Testing Fundamentals](07_Modern_Java/Ch59_SB_Testing_Fundamentals.md) | `@SpringBootTest`, `@WebMvcTest`, Testcontainers | 4h |

**Checkpoint:** Can you explain why `@Transactional` on a private method doesn't work? Can you describe what happens when you call a `@Cacheable` method from within the same bean?

---

### Stage 5 — Advanced (optional, based on role)

| Goal | Files |
|------|-------|
| Microservices | [Ch61 Microservices Core](07_Modern_Java/Ch61_SB_Microservices_Core.md) → [Ch62 Patterns](07_Modern_Java/Ch62_SB_Microservices_Patterns.md) |
| Reactive / WebFlux | [Ch48 WebFlux Core](07_Modern_Java/Ch48_SB_WebFlux_Core.md) → [Ch49 WebFlux Advanced](07_Modern_Java/Ch49_SB_WebFlux_Advanced.md) |
| Message queues | [Ch54 Kafka & Queues](07_Modern_Java/Ch54_Message_Queues_Kafka.md) |
| Kubernetes | [Ch67 Kubernetes Deep Dive](07_Modern_Java/Ch67_Kubernetes_Deep_Dive.md) |
| Performance | [Ch69 Performance Engineering](07_Modern_Java/Ch69_Performance_Engineering.md) |

---

## Cross-subject connections

When you've finished Stage 2 (SQL), you're ready to understand how JPA translates SQL to objects. Read these together:
- SQL Ch13 (Transactions) + [Ch40 JPA Deep Dive](07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md) — Spring's `@Transactional` maps directly to what Ch13 teaches
- SQL Ch11 (Indexes) + [Ch32 SB Data Part 2](07_Modern_Java/Ch32_SB_Data_Part2.md) — JPA entity annotations affect how indexes are created

When you've finished Stage 3, the test automation chapter connects:
- [SDET: Database Verification](21_SDET_Playwright_Automation/05_Advanced_Topics/30_Database_Verification_Direct_SQL.md) — how to write SQL assertions to verify what your Spring Boot API persisted

---

## Interview readiness

After Stage 3:
- [Java Deep Reasoning](07_Modern_Java/Ch22_Java_Deep_Reasoning.md) — reread at Stage 4 speed
- [Spring Boot Deep Reasoning](07_Modern_Java/Ch58_SB_Deep_Reasoning.md) — all the "why does this not work?" questions
- [SQL Deep Reasoning](08_SQL/23_SQL_Deep_Reasoning.md) — the 10 SQL questions that separate seniors from juniors
- [System Design](06_OOP_Design/06_System_Design.md) — scale, caching, databases, messaging (needed for senior+ roles)

**Total estimated time:** 95–120 hours (Stages 1–4). Stage 5 adds 20–40 hours depending on which topics.

---

*Back to [WHERE_TO_START.md](WHERE_TO_START.md) | Browse all: [00_MASTER_INDEX.md](00_MASTER_INDEX.md)*
