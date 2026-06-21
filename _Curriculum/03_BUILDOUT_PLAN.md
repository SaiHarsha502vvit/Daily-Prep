# Curriculum Buildout Plan — Populating S01-S08 CSE Course Shells

> **Status:** Active plan (June 2026). Replaces "12 TBD shells" line in `02_KNOWN_ISSUES.md` — actual count is 30 stubs.

## Reality Check

`_Curriculum/` is an 8-semester academic structure (S01-S08) with 4 CSE courses per semester = **32 courses total**. Current state:

- **2 fully built** (~1000 lines each, CSE401 standard): CSE401 Operating Systems, CSE402 Computer Networks
- **30 stubs** (~35-45 lines each): have title + description + learning outcomes + syllabus outline + linked content. Missing: week-by-week plan, section challenges, problem-set references, capstone connection

## Three-Tier Effort Classification

### Tier A — Wrapper Courses (existing content can be referenced)

These courses map to comprehensive existing folders. Each becomes a **300-500 line semester guide** that orchestrates existing chapter files into a 16-week reading + lab + problem-set plan. No new ground-up content needed.

| Course | Maps to existing folder(s) | Status |
|--------|-----------------------------|--------|
| CSE102 Programming Fundamentals | 07_Modern_Java + 17_TypeScript | Stub |
| **CSE201 Data Structures** | 02_Data_Structures | Stub |
| **CSE202 Algorithms & Complexity** | 03_Algorithms + 04_Patterns | Stub |
| **CSE301 OOP & Design Patterns** | 06_OOP_Design | Stub |
| **CSE302 Databases & SQL** | 08_SQL | Stub |
| CSE501 JavaScript & TypeScript Deep Dive | 16_JavaScript + 17_TypeScript | Stub |
| CSE502 React & Frontend Architecture | 15_React_Frontend | Stub |
| CSE503 CSS & Design Systems | 18_CSS_Complete | Stub |
| CSE504 Frontend Integration & Performance | 19_Frontend_Integration | Stub |
| CSE601 Spring Boot & Microservices | 07_Modern_Java (Ch24-69) | Stub |
| CSE602 API Design & Testing | 21_SDET + 22_Advanced_API_Testing | Stub |
| CSE603 DevOps & CI/CD | 22_DevOps | Stub |
| CSE604 Java Concurrency & JVM Internals | 07_Modern_Java + 13_Developer_Essentials | Stub |
| CSE703 Machine Learning | 21_Python_ML_DL_NLP | Stub |
| CSE804 Career Mastery & Interview Readiness | 09_Career_Reference + 20_Interview_Mastery | Stub |

**Total: 15 Tier A courses × ~350 lines = ~5,250 new lines.**

### Tier B — Partial Content + Need Bridging Chapters

Existing content covers part of the syllabus but key topics are missing. Each course needs a wrapper PLUS 2-4 new bridging chapters in the relevant numbered folder.

| Course | What exists | What's missing |
|--------|-------------|----------------|
| CSE101 Discrete Mathematics | Graph theory in 03_Algorithms | Logic + proofs + combinatorics + recurrence |
| CSE103 Linear Algebra | Vectors/matrices in 21_Python_ML/04b_Math | Eigenvalues, SVD, linear systems standalone |
| CSE203 Probability & Statistics | Distributions in ML chapters | Bayes formal, hypothesis testing, MLE/MAP |
| CSE204 Computer Architecture | Memory foundations in 02_DS | CPU pipeline, cache hierarchy, MMU, branch prediction |
| CSE403 Cryptography & Security | TLS in 22_DevOps | Symmetric/asymmetric primitives, hash families, attacks |
| CSE404 Information Retrieval | RAG in 21_Python_ML | TF-IDF, BM25, inverted index, query optimization |
| CSE702 Distributed Systems | Partial in 10_Enterprise + 22_DevOps | Consensus (Paxos/Raft), CAP proof, vector clocks |
| CSE704 Advanced Algorithms | Fenwick/segment trees in 03_Algorithms | Network flow, FFT, randomized algos, online algos |
| CSE801 Capstone Project | Project specs in 00_CURRICULUM/PROJECTS | Project methodology, rubrics, integration plan |
| CSE802 Human-Computer Interaction | Partial in 18_CSS + 15_React | Heuristic eval, user research methods, accessibility theory |

**Total: 10 Tier B courses × ~350 lines wrapper + 2-4 bridging chapters each (~600 lines/chapter) = ~3,500 + 18,000 = ~21,500 new lines.**

### Tier C — Ground-Up Content Required

No existing curriculum content. Each course needs a full multi-chapter buildout in addition to the semester wrapper.

| Course | Why no existing content | New chapters needed |
|--------|--------------------------|---------------------|
| CSE303 Theory of Computation | DFA/NFA, regular languages, CFG, TM, decidability, P/NP not in repo | Finite automata, Turing machines, complexity classes, undecidability — 4 chapters |
| CSE304 Numerical Methods | Floating-point pitfalls, iterative solvers absent | IEEE 754, root finding, integration, linear systems — 4 chapters |
| CSE701 Compilers & Language Processing | Lexing/parsing/AST/IR absent | Lexer + parser, AST + semantic, IR + optimization, codegen — 4 chapters |
| CSE803 Ethics & Professional Practice | Responsible AI / privacy / ethics absent | Privacy + GDPR, AI ethics, professional responsibility, social impact — 4 chapters |

**Total: 4 Tier C courses × ~400 lines wrapper + 4 chapters × ~700 lines each = ~1,600 + 11,200 = ~12,800 new lines.**

## Quality Standard (Same as CSE401 OS)

Each completed CSE course README must have:

1. **5W1H header** — Total hours, outcome, capstone connection
2. **Navigation table** — links to sibling courses in the semester + related folders
3. **Prerequisites** — explicit chapter file references
4. **Week-by-week plan** — 16 weeks broken into 4-5 units, each with:
   - Learning outcomes
   - Daily table (Day, Topic, Read, Do)
   - Section Challenge per unit (problem + answer with derivation)
5. **Problem set references** — link to `*_PROBLEM_SETS.md` files
6. **Capstone connection** — link to `00_CURRICULUM/PROJECTS/CAP0N_*.md`
7. **Exam prep section** — reference to `00_CURRICULUM/EXAM_BANK.md`

## Phased Execution

### Phase 1 (this session) — S02 + S03 Tier A Wrappers (4 courses)

Build out the 4 highest-leverage courses where existing content is strongest:
- **CSE201 Data Structures** → 02_Data_Structures (21 files, deep teaching)
- **CSE202 Algorithms & Complexity** → 03_Algorithms (51 files, deep teaching)
- **CSE301 OOP & Design Patterns** → 06_OOP_Design (12 files, 162 challenges)
- **CSE302 Databases & SQL** → 08_SQL (53 files, comprehensive)

Estimated effort: ~1,400 new lines. These give the learner a complete S02 + S03 path matching CSE401 quality.

### Phase 2 — Remaining S01 + S05 + S06 Tier A Wrappers (10 courses)

- S01: CSE102 Programming Fundamentals
- S05: CSE501, CSE502, CSE503, CSE504 (frontend stack)
- S06: CSE601, CSE602, CSE603, CSE604 (backend + DevOps)
- S07: CSE703 ML
- S08: CSE804 Career

### Phase 3 — Tier B Bridging Chapters

Build the missing chapters in numbered folders FIRST, then wrap. Order by foundation-first:
- CSE101 Discrete Math (logic + proofs)
- CSE204 Computer Architecture
- CSE203 Probability & Statistics
- CSE103 Linear Algebra
- CSE403 Cryptography
- CSE404 IR
- CSE702 Distributed Systems
- CSE704 Advanced Algos
- CSE801 Capstone
- CSE802 HCI

### Phase 4 — Tier C Ground-Up Buildouts

Each is a multi-session effort:
- CSE303 Theory of Computation
- CSE304 Numerical Methods
- CSE701 Compilers
- CSE803 Ethics

## Decision: Phase 1 Starts Now

Phase 1 produces 4 ~350-line semester wrappers that follow the CSE401 OS pattern. Each wrapper orchestrates **existing** chapter files into a structured 16-week academic course. No new chapter content is written — only the course-level meta-structure (week plans, section challenges referencing existing material, capstone links).
