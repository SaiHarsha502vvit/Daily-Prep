# 🎓 Complete Software Engineering Curriculum

> **How this relates to `_Curriculum/` (resolved 2026-07-25):** this folder is the **study scheduler** — it sequences the existing repo modules into a week-by-week 4-semester reading plan (plus [EXAM_BANK](./EXAM_BANK.md) and [PROJECTS](./PROJECTS/)). The repo-root [`_Curriculum/`](../_Curriculum/00_AGENT_START.md) folder is the **course-content system** — original university-style courses (S01–S06, CSE101–CSE604) with authored chapters (CSE101, CSE103, CSE104 complete as of July 2026). Use `_Curriculum` when you want to *study a subject from first principles*; use this folder when you want a *calendar over the repo's modules*.

> **Modeled after:** MIT 6.824/6.830 (Grad), ETH Zurich Computer Science MSc, TU Munich M.Sc. Informatics, KTH Software Engineering Master.
>
> **Philosophy:** Theory is the compass. Code is the proof. Projects are the degree.
>
> **Languages:** Java (backend/DSA), SQL (data), TypeScript/React (frontend), Python (ML/scripting).

---

## 📐 The Academic Framework

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  4-Semester MSc / M.Tech Equivalent                     │
│                                                                         │
│  Semester 1: Foundations          Semester 2: Systems & Design          │
│  ──────────────────────────       ──────────────────────────────        │
│  Week 1-4   : Data Structures     Week 1-4   : OOP & Design Patterns    │
│  Week 5-8   : Algorithms          Week 5-8   : Spring Boot + JPA        │
│  Week 9-12  : Java Internals      Week 9-12  : SQL + Distributed Sys    │
│  Week 13-16 : Capstone 1          Week 13-16 : Capstone 2               │
│                                                                         │
│  Semester 3: Full-Stack Eng.      Semester 4: Specializations           │
│  ──────────────────────────       ──────────────────────────────        │
│  Week 1-4   : React + TS          Week 1-4   : ML / Python / NLP        │
│  Week 5-8   : DevOps + CI/CD      Week 5-8   : SDET + Testing           │
│  Week 9-12  : Frontend Perf       Week 9-12  : Enterprise + DDD         │
│  Week 13-16 : Capstone 3          Week 13-16 : Capstone 4               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Module Catalog

### Semester 1: Foundations

| Module                                  | Folder                                        | Est. Hours | Competency Target |
| --------------------------------------- | --------------------------------------------- | ---------- | ----------------- |
| Memory & Arrays                         | `02_Data_Structures`                          | 12h        | Practitioner      |
| Linked Lists, Stacks, Queues            | `02_Data_Structures`                          | 10h        | Practitioner      |
| Trees & Heaps                           | `02_Data_Structures`                          | 14h        | Expert            |
| Hash Tables                             | `02_Data_Structures`                          | 10h        | Expert            |
| Sorting Algorithms                      | `03_Algorithms`                               | 10h        | Expert            |
| Recursion & Divide & Conquer            | `03_Algorithms`                               | 12h        | Expert            |
| Dynamic Programming                     | `03_Algorithms`                               | 16h        | Expert            |
| Graphs                                  | `03_Algorithms`                               | 14h        | Expert            |
| Java Core (Types, Generics, Exceptions) | `07_Modern_Java` (Ch01-Ch07)                  | 12h        | Practitioner      |
| Java JVM + Memory Model                 | `07_Modern_Java` (Ch18-Ch19)                  | 8h         | Expert            |
| **Capstone 1: DSA Toolkit**             | `00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md` | 20h        | Expert            |

### Semester 2: Systems & Design

| Module                       | Folder                                         | Est. Hours | Competency Target |
| ---------------------------- | ---------------------------------------------- | ---------- | ----------------- |
| OOP & SOLID Principles       | `06_OOP_Design`                                | 10h        | Expert            |
| Design Patterns (GoF 23)     | `06_OOP_Design`                                | 14h        | Expert            |
| LLD (Low Level Design)       | `06_OOP_Design`                                | 12h        | Expert            |
| System Design Fundamentals   | `06_OOP_Design`                                | 12h        | Practitioner      |
| Spring Boot Core             | `07_Modern_Java` (Ch24-Ch35)                   | 20h        | Expert            |
| JPA & Data Persistence       | `07_Modern_Java`                               | 12h        | Expert            |
| SQL Foundations → Advanced   | `08_SQL`                                       | 20h        | Expert            |
| Distributed Systems & DDD    | `10_Enterprise_Systems`                        | 16h        | Expert            |
| **Capstone 2: Microservice** | `00_CURRICULUM/PROJECTS/CAP02_Microservice.md` | 25h        | Expert            |

### Semester 3: Full-Stack Engineering

| Module                         | Folder                                      | Est. Hours | Competency Target |
| ------------------------------ | ------------------------------------------- | ---------- | ----------------- |
| JavaScript Runtime & Async     | `16_JavaScript`                             | 12h        | Expert            |
| TypeScript Type System         | `17_TypeScript`                             | 10h        | Expert            |
| React & State Management       | `15_React_Frontend`                         | 16h        | Expert            |
| CSS Architecture               | `18_CSS_Complete`                           | 8h         | Practitioner      |
| Frontend Integration & Build   | `19_Frontend_Integration`                   | 8h         | Practitioner      |
| Git, Docker, CI/CD             | `13_Developer_Essentials` + `22_DevOps`     | 16h        | Expert            |
| Java Concurrency               | `07_Modern_Java` (Ch15-Ch17)                | 12h        | Expert            |
| **Capstone 3: Full-Stack App** | `00_CURRICULUM/PROJECTS/CAP03_FullStack.md` | 30h        | Expert            |

### Semester 4: Specializations

| Module                             | Folder                                              | Est. Hours | Competency Target |
| ---------------------------------- | --------------------------------------------------- | ---------- | ----------------- |
| Python Foundations                 | `21_Python_ML_DL_NLP`                               | 10h        | Practitioner      |
| ML / DL / NLP                      | `21_Python_ML_DL_NLP`                               | 20h        | Practitioner      |
| SDET & Test Automation             | `21_SDET_Playwright_Automation`                     | 20h        | Expert            |
| Enterprise Systems & ERP           | `10_Enterprise_Systems`                             | 12h        | Expert            |
| API Testing                        | `22_Advanced_API_Testing`                           | 8h         | Expert            |
| Mobile Dev                         | `23_Mobile_Dev_And_Testing`                         | 10h        | Novice            |
| **Capstone 4: Distributed System** | `00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md` | 30h        | Expert            |

---

## 🧭 Competency Levels

| Level            | Definition                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| **Novice**       | Can recognize the concept and read code using it                       |
| **Practitioner** | Can implement the concept correctly from memory                        |
| **Expert**       | Can explain internals, debug failures, and make architecture decisions |
| **Research**     | Can extend the concept, build novel variants, and teach it             |

---

## 📋 Prerequisite Chains

```
Memory Fundamentals
    └─▶ Arrays → Linked Lists → Stacks/Queues → Hash Tables
                                                      └─▶ Trees
                                                            └─▶ Graphs
                                                                  └─▶ DP

Java Core (Types, JVM, GC)
    └─▶ OOP → SOLID → Design Patterns → Spring Boot
                                              └─▶ JPA → SQL → DDD → Distributed Systems

JavaScript / TypeScript
    └─▶ React → CSS → Frontend Integration → DevOps
```

---

## 🗂️ Semester Guides

- 📅 [Semester 1 — Foundations](SEMESTER_1_GUIDE.md)
- 📅 [Semester 2 — Systems & Design](SEMESTER_2_GUIDE.md)
- 📅 [Semester 3 — Full-Stack Engineering](SEMESTER_3_GUIDE.md)
- 📅 [Semester 4 — Specializations](SEMESTER_4_GUIDE.md)

## 📝 Problem Set Index

### Semester 1 & 2

- 📝 [DS Problem Sets](../02_Data_Structures/02_PROBLEM_SETS.md)
- 📝 [Algorithms Problem Sets](../03_Algorithms/03_PROBLEM_SETS.md)
- 📝 [OOP & Design Problem Sets](../06_OOP_Design/06_PROBLEM_SETS.md)
- 📝 [Java & Spring Problem Sets](../07_Modern_Java/07_PROBLEM_SETS.md)
- 📝 [SQL Problem Sets](../08_SQL/08_PROBLEM_SETS.md)
- 📝 [Enterprise & DDD Problem Sets](../10_Enterprise_Systems/10_PROBLEM_SETS.md)
- 📝 [System Design Problem Sets](../20_Interview_Mastery/06d_System_Design_Problem_Sets.md) — Load Balancing, Databases, Sharding

### Semester 3

- 📝 [JavaScript Problem Sets](../16_JavaScript/16_PROBLEM_SETS.md) — Event loop, closures, async/await
- 📝 [TypeScript Problem Sets](../17_TypeScript/17_PROBLEM_SETS.md) — Generics, mapped types, conditional types
- 📝 [React Problem Sets](../15_React_Frontend/15_PROBLEM_SETS.md) — Hooks, patterns, React Query, performance
- 📝 [CSS Problem Sets](../18_CSS_Complete/18_PROBLEM_SETS.md) — Box model, Grid, variables, animations, specificity
- 📝 [Frontend Integration Problem Sets](../19_Frontend_Integration/19_PROBLEM_SETS.md) — Bundling, Web Vitals, A11y, DevTools
- 📝 [DevOps Problem Sets](../22_DevOps/22_PROBLEM_SETS.md) — Docker, Compose, GitHub Actions
- 📝 [Developer Essentials Problem Sets](../13_Developer_Essentials/13_PROBLEM_SETS.md) — Git, API Design, Clean Code, Observability
- 📝 [Java Concurrency Problem Sets](../07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md) — Locks, CF, deadlocks

### Semester 4

- 📝 [Python & ML Problem Sets](../21_Python_ML_DL_NLP/21_PROBLEM_SETS.md) — Python core, NumPy, ML pipeline, NLP
- 📝 [SDET Problem Sets](../21_SDET_Playwright_Automation/08_Practice_And_Quizzes/SDET_PROBLEM_SETS.md) — JUnit5, Mockito, Playwright
- 📝 [Kafka & Event Streaming Problem Sets](../10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md) — Kafka Topics, Partitions, Consumer Lag
- 📝 [Mobile Dev Problem Sets](../23_Mobile_Dev_And_Testing/23_PROBLEM_SETS.md) — iOS/Android Lifecycle, Local-First, Flutter

## 🏗️ Project Index

### Semester 1

- 🔨 [P01 — Frequency Analyzer](PROJECTS/P01_Frequency_Analyzer.md)
- 🏆 [Capstone 1 — DSA Toolkit](PROJECTS/CAP01_DSA_Toolkit.md)

### Semester 2

- 🔨 [P02 — File System Simulator](PROJECTS/P02_FileSystem_Simulator.md)
- 🔨 [P03 — SQL Analytics Dashboard](PROJECTS/P03_SQL_Analytics_Dashboard.md)
- 🔨 [P04 — Library REST API](PROJECTS/P04_Library_REST_API.md)
- 🔨 [P05 — Food Delivery Domain Model](PROJECTS/P05_FoodDelivery_Domain_Model.md)
- 🔨 [P06 — Distributed Order System](PROJECTS/P06_Distributed_Order_System.md)
- 🏆 [Capstone 2 — Production Microservice](PROJECTS/CAP02_Microservice.md)

### Semester 3

- 🔨 [P07 — Concurrent Task Queue](PROJECTS/P07_Concurrent_Task_Queue.md)
- 🔨 [P08 — React Dashboard](PROJECTS/P08_React_Dashboard.md)
- 🔨 [P09 — CI/CD Pipeline](PROJECTS/P09_CICD_Pipeline.md)
- 🏆 [Capstone 3 — Full-Stack Application](PROJECTS/CAP03_FullStack.md)

### Semester 4

- 🏆 [Capstone 4 — Distributed System Design](PROJECTS/CAP04_DistributedSystem.md)

---

## 📋 Assessment

- 🎓 [Exam Bank](EXAM_BANK.md) — Midterm & Final style exams for all 4 semesters (with answer keys)

## 🚀 Start Here

- 📖 [How to Study This Curriculum](HOW_TO_STUDY.md) — Learning loop, scheduling, anti-patterns, Feynman check
- 📋 [Daily Log Template](../12_Daily_Practice/DAILY_LOG_TEMPLATE.md) — Fill in every study day

---

[← Back to Master Index](../00_MASTER_INDEX.md)
