# Curriculum Buildout — Completion Record

> **Status (2026-10-04):** all 32 CSE courses in `S01/`–`S08/` are complete. The phase-by-phase plan that produced them is in git history.
> Lines = total lines of all `.md` files in the course folder (README + chapters), measured 2026-10-04.

## Course Types

- **Wrapper** — README-only 16-week guide that orchestrates existing repo modules (week plans, section challenges, capstone links). README-only is the finished form, not a stub.
- **Standalone README** — one large self-contained README course (CSE401, CSE402).
- **Chapter course** — README with a chapter index + authored chapter files (`NN_Title.md`) in the course folder, teaching from first principles.

## Status

| Course | Type | Chapters | Lines | Status |
| ------ | ---- | -------- | ----- | ------ |
| CSE101 Discrete Mathematics | Chapter | 12 | 6,012 | Complete |
| CSE102 Programming Fundamentals | Wrapper | — | 198 | Complete |
| CSE103 Linear Algebra | Chapter | 14 | 7,025 | Complete |
| CSE104 Computer Systems | Chapter | 12 | 5,754 | Complete |
| CSE201 Data Structures | Wrapper | — | 355 | Complete |
| CSE202 Algorithms & Complexity | Wrapper | — | 303 | Complete |
| CSE203 Probability & Statistics | Chapter | 12 | 4,570 | Complete |
| CSE204 Computer Architecture | Chapter | 10 | 4,319 | Complete |
| CSE301 OOP & Design Patterns | Wrapper | — | 220 | Complete |
| CSE302 Databases & SQL | Wrapper | — | 247 | Complete |
| CSE303 Theory of Computation | Chapter | 11 | 5,178 | Complete |
| CSE304 Numerical Methods | Chapter | 12 | 5,766 | Complete |
| CSE401 Operating Systems | Standalone README | — | 1,095 | Complete |
| CSE402 Computer Networks | Standalone README | — | 994 | Complete |
| CSE403 Cryptography & Security | Chapter | 13 | 2,898 | Complete |
| CSE404 Information Retrieval | Chapter | 8 | 2,324 | Complete |
| CSE501 JavaScript & TypeScript Deep Dive | Wrapper | — | 191 | Complete |
| CSE502 React & Frontend Architecture | Wrapper | — | 191 | Complete |
| CSE503 CSS & Design Systems | Wrapper | — | 184 | Complete |
| CSE504 Frontend Integration & Performance | Wrapper | — | 180 | Complete |
| CSE601 Spring Boot & Microservices | Wrapper | — | 189 | Complete |
| CSE602 API Design & Testing | Wrapper | — | 201 | Complete |
| CSE603 DevOps & CI/CD | Wrapper | — | 151 | Complete |
| CSE604 Java Concurrency & JVM Internals | Wrapper | — | 182 | Complete |
| CSE701 Compilers & Language Processing | Chapter | 10 | 2,578 | Complete |
| CSE702 Distributed Systems | Chapter | 8 | 1,310 | Complete |
| CSE703 Machine Learning | Wrapper | — | 194 | Complete |
| CSE704 Advanced Algorithms | Chapter | 8 | 1,195 | Complete |
| CSE801 Capstone Project | Chapter | 6 | 1,272 | Complete |
| CSE802 Human-Computer Interaction | Chapter | 6 | 1,027 | Complete |
| CSE803 Ethics & Professional Practice | Chapter | 6 | 1,423 | Complete |
| CSE804 Career Mastery & Interview Readiness | Wrapper | — | 194 | Complete |

**Totals:** 15 wrappers, 2 standalone READMEs, 15 chapter courses (148 chapters).

## Quality Standard

- **Course README:** 5W1H header (hours, outcome, capstone), navigation to sibling courses, prerequisites, syllabus or week-by-week plan, problem-set / exam / capstone links (`00_CURRICULUM/PROJECTS/`, `00_CURRICULUM/EXAM_BANK.md`).
- **Chapter courses:** the README lists every chapter file. Each chapter derives its mechanics rather than stating them, works concrete examples, and includes a Section Challenge with a worked answer.
- **Wrappers:** cite real files in existing modules. Check every cited path against the filesystem (`python tools/check_links.py`).
