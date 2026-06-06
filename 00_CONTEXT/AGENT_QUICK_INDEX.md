# Agent Quick Index

Purpose: compact entry-point. An agent that reads ONLY this file + the target folder's `CONTEXT.md` has enough context to edit.

---

## 5 Pedagogy Quick-Rules

- Every section answers: What problem? Naive approach? Bottleneck? Optimized solution? Invariant? When it breaks? Edge cases?
- Challenges must be **local** to the section topic — never recycled from other domains.
- DSA files are **constraint-first**: constraint → brute force → bottleneck → data structure/algorithm → invariant → edge cases.
- SQL files are **SQL-first**: joins, windows, CTEs, indexes, transactions, analytics, production behavior.
- Java/Spring files are **Java/Spring-first**: JVM, language semantics, Spring lifecycle, HTTP, JPA, security, testing.
- Frontend files are **frontend-first**: browser, DOM, React, TypeScript, CSS, build tools, accessibility, performance.

---

## Folder Roles & Boundaries

| Folder | Role | Boundary |
|--------|------|----------|
| `01_Getting_Started` | Onboarding, study plans, how to use the repo. | No deep tutorials here. |
| `02_Data_Structures` | DS concepts, internals, operations, variants, production use. | Avoid pure algorithm drills unless they teach the DS. |
| `03_Algorithms` | Algorithm thinking, sorting, recursion, DP, graphs, greedy. | Keep implementation tied to algorithmic reasoning. |
| `04_Patterns_Templates` | Reusable coding patterns, templates, constraint overrides, trigger tables. | Main place for trigger tables. |
| `05_Problem_Solving` | Practice problems by pattern/topic. | Problem-oriented, not pure theory. |
| `06_OOP_Design` | OOP, SOLID, design patterns, LLD, system design. | No Spring-specific content unless comparing design to implementation. |
| `07_Modern_Java` | Java, JVM, Spring Boot, JPA, security, testing, distributed services. | Keep Java/Spring content here. |
| `08_SQL` | SQL foundations, joins, windows, CTEs, analytics, internals, production. | Keep database-first examples. |
| `09_Career_Reference` | Career guides, behavioral prep, project reference. | Practical interview/career synthesis. |
| `10_Enterprise_Systems` | ERP, DDD, finance/order/inventory, enterprise workflows. | Business process context central. |
| `12_Daily_Practice` | Daily practice plans and problem drills. | Actionable, session-sized. |
| `13_Developer_Essentials` | Git, Docker, CI/CD, networking, concurrency, ops. | Tool/platform basics separate from app chapters. |
| `14_Mental_Models` | Thinking frameworks, pattern triggers, reasoning ladders. | Meta-cognition and selection logic. |
| `15_React_Frontend` | React, hooks, state, architecture, deep reasoning. | React Context canonical here. |
| `16_JavaScript` | JS language, runtime, browser APIs, async. | Language/runtime separate from React. |
| `17_TypeScript` | TS type system, generics, practical typing. | No duplicate of Java generics unless comparing. |
| `18_CSS_Complete` | CSS layout, architecture, responsive design. | Visual/layout reasoning here. |
| `19_Frontend_Integration` | Browser debugging, build tools, performance, a11y. | Cross-cutting frontend operations. |
| `20_Interview_Mastery` | Interview synthesis, problems, scripts, final prep. | High-signal interview framing. |
| `21_Python_ML_DL_NLP` | Python, ML, DL, NLP, LLM/RAG, MLOps. | ML/Python stack here. |
| `22_DevOps` | Linux, Docker, Kubernetes, CI/CD, SRE, deployment. | Infrastructure and operations. |

---

## Navigation Pointers

- **Curriculum reading order:** `00_CURRICULUM/00_CURRICULUM_INDEX.md`
- **Per-folder deep nav:** each folder has a `00_INDEX.md` (e.g., `04_Patterns_Templates/00_INDEX.md`)
- **Human-readable file lookup:** `00_CONTEXT/FILE_REGISTRY_SUMMARY.md`
- **Machine-readable file lookup:** `00_CONTEXT/FILE_REGISTRY.csv`

## Cross-Domain Bridges

- DSA → Java: `03_Algorithms` explains pattern; `07_Modern_Java` explains Java implementation.
- SQL → Spring: `08_SQL` owns SQL behavior; `07_Modern_Java` owns JPA/Spring transactions.
- React → JS/TS/CSS: React owns component/state architecture; each domain owns its own primitives.

## On-Demand References

Full details available when needed:
- `00_CONTEXT/REPO_MAP.md` — complete folder map with boundary rules
- `00_CONTEXT/PEDAGOGY_STANDARDS.md` — full teaching standards
- `00_CONTEXT/DECISIONS.md` — permanent repo rules
- `00_CONTEXT/CONTAMINATION_GUARDS.md` — known contamination patterns
- `00_MASTER_INDEX.md` — full navigation (or `_archive/MASTER_INDEX_LEGACY.md` for legacy view)