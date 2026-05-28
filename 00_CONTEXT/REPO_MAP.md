# Repository Map

Purpose: make future agents understand the repo shape before touching files.

## Root Files

| Path | Purpose |
|---|---|
| `00_MASTER_INDEX.md` | Main navigation and reading map. |
| `00_TEXTBOOK_PREFACE.md` | Reading order, prerequisites, and course framing. |
| `AGENTS.md` | Mandatory operating manual for future agents. |
| `AGENT_HANDOFF.md` | Older handoff snapshot. Useful history, but do not treat counts as authoritative. |
| `tools/update_context.ps1` | Generates `FILE_REGISTRY.md` and `CONTEXT_MANIFEST.json`. Run with `-Mode check` or `-Mode update`. |

## Active Modules

| Folder | Primary Responsibility | Boundary |
|---|---|---|
| `01_Getting_Started` | Study plan, onboarding, how to use the repo. | Do not put deep topic tutorials here. |
| `02_Data_Structures` | DS concepts, internals, operations, variants, production use. | Avoid algorithm-heavy problem solving unless it teaches the DS. |
| `03_Algorithms` | Algorithm thinking, sorting, recursion, DP, graphs, greedy, advanced algorithms. | Keep implementation details tied to algorithmic reasoning. |
| `04_Patterns_Templates` | Reusable coding patterns, templates, constraints, pattern selection. | This is the main place for trigger tables and constraint overrides. |
| `05_Problem_Solving` | Practice problem families by pattern/topic. | Keep it problem-oriented, not pure theory. |
| `06_OOP_Design` | OOP, SOLID, design patterns, LLD, system design fundamentals. | Do not turn into Spring-specific content unless comparing design to implementation. |
| `07_Modern_Java` | Java, JVM, Spring Boot, JPA, security, testing, distributed Java services. | Keep Java/Spring content here; avoid frontend/SQL-only challenges unless bridging. |
| `08_SQL` | SQL foundations, joins, windows, CTEs, analytics, internals, production scenarios. | Keep examples database-first. Note: some SQL interview synthesis files live in `20_Interview_Mastery` (e.g., `18_SQL_Foundations_Commands_Operators_Functions.md`). |
| `09_Career_Reference` | DSA guides, behavioral prep, project/career reference. | Keep practical interview/career synthesis here. |
| `10_Enterprise_Systems` | ERP, DDD, finance/order/inventory systems, enterprise workflows. | Keep business process and production system context central. |
| `12_Daily_Practice` | Daily practice plans and problem drills. | Keep content actionable and session-sized. |
| `13_Developer_Essentials` | Git, Docker, CI/CD, networking, servers, concurrency, operational basics. | Keep tool/platform basics separate from app framework chapters. |
| `14_Mental_Models` | Thinking frameworks, pattern triggers, reasoning ladders. | Keep as meta-cognition and selection logic. |
| `15_React_Frontend` | React foundations, hooks, state, architecture, deep reasoning. | React Context belongs here when canonical. |
| `16_JavaScript` | JavaScript language, runtime, browser APIs, async, debugging. | Keep JS language/runtime separate from React. |
| `17_TypeScript` | TypeScript type system, generics, practical typing. | Do not duplicate Java generics unless explicitly comparing. |
| `18_CSS_Complete` | CSS layout, architecture, responsive design, UI styling. | Keep visual/layout reasoning here. |
| `19_Frontend_Integration` | Browser debugging, build tools, performance, accessibility, integration workflows. | Use for cross-cutting frontend operations. |
| `20_Interview_Mastery` | Interview-specific synthesis, problems, scripts, final prep. | Keep high-signal interview framing and cross-topic review. |
| `21_Python_ML_DL_NLP` | Python, ML, DL, NLP, LLM/RAG, MLOps. | Keep ML/Python stack content here. |
| `22_DevOps` | Linux, networking, Docker, Kubernetes, CI/CD, SRE, deployment. | Keep infrastructure and operations content here. |

## Cross-Domain Bridges

| Bridge | Correct Direction |
|---|---|
| DSA to Java | `03_Algorithms` explains pattern; `07_Modern_Java` explains Java implementation/performance. |
| SQL to Spring | `08_SQL` owns SQL behavior; `07_Modern_Java` owns JPA/Spring transaction behavior. |
| Enterprise to DSA | `10_Enterprise_Systems` uses DSA as production modeling, not LeetCode drills. |
| React to JS/TS/CSS | React owns component/state architecture; JS owns language/runtime; TS owns types; CSS owns layout/design. |
| Mental models to patterns | `14_Mental_Models` chooses; `04_Patterns_Templates` implements. |

## Archive Boundary

`_archive` contains historical material from earlier iterations of the study system. It is preserved for reference but should not be updated during normal work. Rules:

- Do not update `_archive` files unless the user explicitly asks.
- Do not copy content from `_archive` into active modules without user review.
- If `_archive` content contradicts an active module, the active module is correct.
- The file registry excludes `_archive` from its active file count.

## Agent Quick Start

For any agent entering this repo:

```powershell
# 1. Check freshness
powershell -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check

# 2. If stale, inspect listed files first
# 3. Read 00_CONTEXT/DECISIONS.md, CONTAMINATION_GUARDS.md, PEDAGOGY_STANDARDS.md
# 4. Read the local folder CONTEXT.md for the area you are editing
# 5. After editing, regenerate
powershell -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update
```
