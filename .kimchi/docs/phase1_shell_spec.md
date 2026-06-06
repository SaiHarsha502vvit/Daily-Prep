# Phase 1 Spec — Curriculum Architecture Shell

## Goal
Create the 8-semester folder structure, course catalog, lecture/lab/assignment/project/rubric templates, and populate semester/course READMEs. **No lecture/lab content yet** — just structure, metadata, and links. Cross-reference `00_CURRICULUM/` for S1–S4.

## Existing Content to Link
- `00_CURRICULUM/CURRICULUM_OVERVIEW.md` — 4-semester framework
- `00_CURRICULUM/SEMESTER_1_GUIDE.md` → `_Curriculum/S01/`
- `00_CURRICULUM/SEMESTER_2_GUIDE.md` → `_Curriculum/S02/`
- `00_CURRICULUM/SEMESTER_3_GUIDE.md` → `_Curriculum/S03/`
- `00_CURRICULUM/SEMESTER_4_GUIDE.md` → `_Curriculum/S04/`
- `00_CURRICULUM/PROJECTS/` — 13 project specs
- `00_CURRICULUM/EXAM_BANK.md`
- `00_CURRICULUM/HOW_TO_STUDY.md`

## Course Catalog (8 Semesters × 4 Courses = 32 Courses)

### S01 — Foundations
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE101 | Discrete Mathematics | (new — to be written Phase 2) | ~20h |
| CSE102 | Programming Fundamentals | `07_Modern_Java/` (Ch01–07), `16_JavaScript/`, `17_TypeScript/` | ~20h |
| CSE103 | Linear Algebra | (new — Phase 2) | ~15h |
| CSE104 | Introduction to Computer Systems | `13_Developer_Essentials/01_Git_Workflows.md`, `13_Developer_Essentials/02_Linux_CLI_Shell.md`, `02_Data_Structures/01a_Memory_Foundations.md` | ~15h |

### S02 — Data & Algorithms
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE201 | Data Structures | `02_Data_Structures/` | ~30h |
| CSE202 | Algorithms & Complexity | `03_Algorithms/` | ~30h |
| CSE203 | Probability & Statistics | (new — Phase 2) | ~15h |
| CSE204 | Computer Architecture | (new — Phase 2) | ~20h |

### S03 — Software Engineering Core
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE301 | OOP & Design Patterns | `06_OOP_Design/` | ~20h |
| CSE302 | Databases & SQL | `08_SQL/` | ~25h |
| CSE303 | Theory of Computation | (new — Phase 3) | ~20h |
| CSE304 | Numerical Methods | (new — Phase 3) | ~15h |

### S04 — Systems & Networking
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE401 | Operating Systems | (new — Phase 3) | ~30h |
| CSE402 | Computer Networks | (new — Phase 3) | ~25h |
| CSE403 | Cryptography & Security | (new — Phase 3) | ~15h |
| CSE404 | Information Retrieval | (new — Phase 3) | ~15h |

### S05 — Frontend & DevEx
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE501 | JavaScript & TypeScript Deep Dive | `16_JavaScript/`, `17_TypeScript/` | ~20h |
| CSE502 | React & Frontend Architecture | `15_React_Frontend/` | ~25h |
| CSE503 | CSS & Design Systems | `18_CSS_Complete/` | ~15h |
| CSE504 | Frontend Integration & Performance | `19_Frontend_Integration/` | ~15h |

### S06 — Backend & DevOps
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE601 | Spring Boot & Microservices | `07_Modern_Java/` (Ch24–58) | ~30h |
| CSE602 | API Design & Testing | `22_Advanced_API_Testing/`, `21_SDET_Playwright_Automation/` | ~20h |
| CSE603 | DevOps & CI/CD | `13_Developer_Essentials/`, `22_DevOps/` | ~20h |
| CSE604 | Java Concurrency & JVM Internals | `07_Modern_Java/` (Ch15–19, Ch22) | ~20h |

### S07 — Advanced Topics
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE701 | Compilers & Language Processing | (new — Phase 5) | ~25h |
| CSE702 | Distributed Systems | `10_Enterprise_Systems/` (Kafka, DDD, Saga) | ~25h |
| CSE703 | Machine Learning | `21_Python_ML_DL_NLP/` | ~25h |
| CSE704 | Advanced Algorithms | `03_Algorithms/` (advanced) | ~20h |

### S08 — Capstone & Career
| Code | Course | Folders | Hours |
|------|--------|---------|-------|
| CSE801 | Capstone Project | `00_CURRICULUM/PROJECTS/CAP0*.md` | ~40h |
| CSE802 | Human-Computer Interaction | `15_React_Frontend/`, `19_Frontend_Integration/` (a11y) | ~15h |
| CSE803 | Ethics & Professional Practice | (new — Phase 5) | ~10h |
| CSE804 | Career Mastery & Interview Readiness | `09_Career_Reference/`, `20_Interview_Mastery/` | ~20h |

## Structure Per Course
```
_Curriculum/S0N/
├── README.md                          # Semester overview
├── CSE1XX_Course_Name/
│   ├── README.md                      # Course description, outcomes, outline
│   ├── lectures/
│   ├── labs/
│   ├── assignments/
│   ├── projects/
│   └── rubrics/
```

## Templates (in `_Curriculum/TEMPLATES/`)
1. `lecture_template.md` — learning objectives, reading, exercises, key takeaways
2. `lab_template.md` — setup, tasks, deliverables, grading criteria
3. `assignment_template.md` — description, constraints, submission, rubric link
4. `project_template.md` — spec, milestones, rubric, tech stack
5. `rubric_template.md` — criteria, weight, levels (excellent/good/pass/fail)

## Prereq Graph (semester-level, in each README)
- S01: none
- S02: S01
- S03: S02
- S04: S03
- S05: S03
- S06: S03 + S04 (or concurrent)
- S07: S05 + S06
- S08: S07

## Cross-Link Format
When linking to existing content, use relative paths:
```markdown
**Prerequisite reading:** `../../02_Data_Structures/01a_Memory_Foundations.md` §1-3
**Builds on:** [Semester 1 Guide](../../00_CURRICULUM/SEMESTER_1_GUIDE.md)
**Project spec:** [CAP01 DSA Toolkit](../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md)
```

## Constraints
- Do NOT move or delete `00_CURRICULUM/` — link to it.
- Do NOT duplicate full week-by-week plans from `00_CURRICULUM/` — use links + summaries.
- Preserve existing course-hour estimates and competency targets from `00_CURRICULUM/` where applicable.
- Folder names use kebab-case + course code prefix: `CSE101_Discrete_Mathematics/`

## Success Criteria
- [ ] `_Curriculum/` contains `S01/` through `S08/`
- [ ] Each semester README has course table, prereq, and link to `00_CURRICULUM/` guide (S1–S4)
- [ ] Each of 32 courses has `README.md` + `lectures/` + `labs/` + `assignments/` + `projects/` + `rubrics/`
- [ ] `_Curriculum/TEMPLATES/` has 5 template files
- [ ] Total new files < 200 (lightweight structure, no content yet)
