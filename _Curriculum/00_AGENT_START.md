# Agent Start Sequence — Lean

This repo is the source of truth. Treat it as a living technical curriculum.

> **Two curriculum systems, two jobs (resolved 2026-07-25):**
> - **`_Curriculum/` (this folder)** — original university-style course *content*: S01–S06, CSE101–CSE604, each course a directory of authored chapters. This is the canonical home for course material.
> - **`00_CURRICULUM/`** — a week-by-week *study scheduler* that sequences the existing repo modules (02_DS, 03_Algo, 07_Java, …) into a 4-semester reading plan, plus EXAM_BANK and PROJECTS.
>
> They are complementary lenses, not duplicates: one authors courses, the other schedules module reading. When a CSE course covers ground a repo module also covers, the CSE chapter teaches from first principles and links out to the module for drills/reference.

## Semester Map

| Sem   | Focus                              | Key Folders                                                               |
| ----- | ---------------------------------- | ------------------------------------------------------------------------- |
| S1–S2 | Foundations: DSA, SQL, Java, JS    | `02_Data_Structures`, `03_Algorithms`, `07_Modern_Java`, `08_SQL`         |
| S3    | Full Stack: React, TS, CSS, Spring | `15_React_Frontend`, `17_TypeScript`, `18_CSS_Complete`, `07_Modern_Java` |
| S4    | Backend: Enterprise, DevOps        | `10_Enterprise_Systems`, `22_DevOps`, `13_Developer_Essentials`           |
| S5–S8 | Interview Prep, Career, ML/DL      | `20_Interview_Mastery`, `09_Career_Reference`, `21_Python_ML_DL_NLP`      |

## Key Folders

`01_Getting_Started` — Onboarding, study plans, repo usage
`02_Data_Structures` — DS internals, variants, production use
`03_Algorithms` — Sorting, recursion, DP, graphs, greedy
`04_Patterns_Templates` — Patterns, templates, constraint triggers
`05_Problem_Solving` — Problems by pattern and topic
`06_OOP_Design` — OOP, SOLID, design patterns, LLD, system design
`07_Modern_Java` — Java, JVM, Spring Boot, JPA, security, testing
`08_SQL` — Joins, windows, CTEs, indexes, analytics, internals
`09_Career_Reference` — Career guides, behavioral prep, projects
`10_Enterprise_Systems` — ERP, DDD, finance/order/inventory
`12_Daily_Practice` — Daily practice plans and problem drills
`13_Developer_Essentials` — Git, Docker, CI/CD, networking, concurrency
`14_Mental_Models` — Thinking frameworks, pattern triggers
`15_React_Frontend` — React, hooks, state, architecture
`16_JavaScript` — JS language, runtime, browser APIs, async
`17_TypeScript` — TS type system, generics, practical typing
`18_CSS_Complete` — CSS layout, architecture, responsive design
`19_Frontend_Integration` — Browser debugging, build tools, a11y, performance
`20_Interview_Mastery` — Interview synthesis, problems, scripts
`21_Python_ML_DL_NLP` — Python, ML, DL, NLP, LLM/RAG, MLOps
`22_DevOps` — Linux, Docker, Kubernetes, CI/CD, SRE
Full file map: `_Curriculum/01_FILE_MAP.md`.

## Editing Rules

- Preserve existing content unless the user explicitly asks to remove it.
- Prefer appending or refining over deleting; avoid cross-domain contamination.
- Keep section challenges local to the topic.
- DSA: constraint-first. SQL: SQL-first. Java/Spring: Java-first. Frontend: frontend-first.

## Context Update Rule

After edits: (1) Update folder `CONTEXT.md` if boundaries changed. (2) Update `00_CONTEXT/DECISIONS.md` if a permanent rule was added. (3) Log in `00_CONTEXT/CHANGE_JOURNAL.md`. Then run:

````powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check```
````
