# Quiz 01 — Playwright & TypeScript Fundamentals: Reference Solutions

**Navigation**: [← Quiz 01](./README.md) | [Quiz 02](../quiz_02_solutions/README.md) | [Index](../../00_INDEX.md)

> Expanded reference solutions for every question in `QUIZ_01_Playwright_MCQ.md`.
> Each entry contains: the question text → the correct answer → why it is correct → why each distractor is wrong → relevant curriculum chapter references.

---

## Where the answers live

All Quiz 01 solutions are in a single file:

- [`solutions.md`](./solutions.md) — every question and explanation in order, with chapter cross-references.

> Earlier drafts of this README pointed at per-question files (`Q01_*.md`, `Q02_*.md`, …). That split was never built; the solutions live in the consolidated `solutions.md`. Use Ctrl/Cmd-F to jump to a specific question.

---

## How to use these files

1. **Attempt the quiz first** — open `QUIZ_01_Playwright_MCQ.md`, cover the answers, and choose an option for every question.
2. **Read the explanation** — even if you got it right, read the "Why Each Distractor Is Wrong" section. The wrong answers are carefully designed to trap common misconceptions.
3. **Follow the curriculum references** — each question links back to the chapter where the concept is taught in depth. Re-read any chapter where you missed more than one question.

---

## Score guide

| Score    | Meaning          | Action                                                        |
| -------- | ---------------- | ------------------------------------------------------------- |
| 35–40    | Expert           | Review only the questions you missed; focus on Chapters 25–45 |
| 28–34    | Solid            | Re-read the chapters linked from questions you missed         |
| 20–27    | Good foundation  | Re-read all chapters for categories below 75%                 |
| Below 20 | Fundamentals gap | Start from Chapter 1 and re-read sequentially                 |

---

## Key patterns by category

| If you struggled with…                       | Re-read…                                                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `await` vs synchronous locators (Q1, Q4, Q5) | [Ch 04 — JS/TS for Automation](../../01_Foundations/04_JS_TS_For_Automation.md)                                                   |
| `forEach` async trap (Q2)                    | [Ch 04 — JS/TS for Automation](../../01_Foundations/04_JS_TS_For_Automation.md)                                                   |
| `Promise.all` usage (Q3, Q5)                 | [Ch 12 — Cross-Site Pattern 2 (New Tab)](../../04_Cross_Site_Patterns_And_D365/12_CrossSite_Pattern2_NewTab_SharedContext.md)                |
| POM lazy evaluation (Q6, Q7, Q8)             | [Ch 05 — POM Architecture Deep Dive](../../02_Test_Architecture/05_POM_Architecture_Deep_Dive.md)                                 |
| Fixture scopes (Q9, Q10, Q11)                | [Ch 06 — Custom Fixtures Architecture](../../02_Test_Architecture/06_Custom_Fixtures_Architecture.md)                             |
| Wait strategies (Q12, Q13, Q14)              | [Ch 17 — D365 Advanced Timing Patterns](../../04_Cross_Site_Patterns_And_D365/17_D365_Advanced_Timing_Patterns.md)                           |
| D365 two-phase render (Q16)                  | [Ch 10 — Dynamics 365 CRM Testing](../../04_Cross_Site_Patterns_And_D365/10_Dynamics365_CRM_Testing.md)                                      |
| D365 CommandBar / tabs (Q15, Q17)            | [Ch 10 — Dynamics 365 CRM Testing](../../04_Cross_Site_Patterns_And_D365/10_Dynamics365_CRM_Testing.md)                                      |
| Parallel test isolation (Q18, Q19, Q20)      | [Ch 09 — Parallel Execution & Workers](../../02_Test_Architecture/09_Parallel_Execution_Workers.md)                               |
| `storageState` and contexts (Q21, Q22)       | [Ch 16 — Cross-Site Pattern 6 (storageState chaining)](../../04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md) |
| Data accumulator pattern (Q23)               | [Ch 24 — Test Script Architecture](../../05_Enterprise_Framework/24_Test_Script_Architecture.md)                               |
| TypeScript types (`as const`, unions) (Q24)  | [Ch 36 — TypeScript Type System Mastery](../../08_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md)                        |
| Jest/expect matchers (Q25)                   | [Ch 23 — APIUtils HTTP Library](../../05_Enterprise_Framework/23_APIUtils_HTTP_Library.md)                                     |
| CDP / network throttling (Q26)               | [Ch 08 — Browser Internals for SDETs](../../02_Test_Architecture/08_Browser_Internals_for_SDETs.md)                               |
| `page.route` vs `request.get` (Q27)          | [Ch 31 — API Mocking via `page.route`](../../03_Real_World_Scenarios/31_API_Mocking_page_route.md)                                     |
| Flakiness & test data (Q28, Q29, Q31)        | [Ch 26 — Flakiness Diagnosis & Fixing](../../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md)                             |
| VRT (`toHaveScreenshot`) (Q30)               | [Ch 29 — Visual Regression Testing](../../07_Specialised_Testing/29_Visual_Regression_Testing.md)                                     |
| GraphQL testing (Q32)                        | [Ch 41 — GraphQL & WebSocket Testing](../../03_Real_World_Scenarios/41_GraphQL_WebSocket_Testing.md)                               |
| CAPTCHA bypass (Q33)                         | [Ch 40 — Security Testing OWASP](../../07_Specialised_Testing/40_Security_Testing_OWASP.md)                                       |
| Response modification (Q34)                  | [Ch 31 — API Mocking via `page.route`](../../03_Real_World_Scenarios/31_API_Mocking_page_route.md)                                     |
| Accessibility (Q35)                          | [Ch 39 — Accessibility Testing with axe-core](../../07_Specialised_Testing/39_Accessibility_Testing_axe_core.md)                  |
| Global setup (Q36)                           | [Ch 57 — Playwright Config Theory Catalog](../../01_Foundations/56_Playwright_Config_Deep_Dive.md)                     |
| File downloads (Q37)                         | [Ch 58 — File Uploads & Downloads](../../03_Real_World_Scenarios/58_File_Uploads_Downloads.md)                                         |
| Dialog handling (Q39)                        | [Ch 26 — Flakiness Diagnosis & Fixing](../../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) (dialog timing patterns)    |
| Component POM pattern (Q40)                  | [Ch 18 — Mega POM Architecture](../../05_Enterprise_Framework/18_Mega_POM_Architecture.md)                                     |

---

**Navigation**: [← Quiz 01](./README.md) | [Quiz 02](../quiz_02_solutions/README.md) | [Index](../../00_INDEX.md)
