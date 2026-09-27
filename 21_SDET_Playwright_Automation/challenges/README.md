# SDET Challenges & Capstones

Graded assignments that turn the chapters into shipped code. Work them in order. Each one must be **runnable** inside [`../framework/`](../framework/).

> **New to writing tests from scratch?** Do the [`../labs/`](../labs/README.md) first. They're smaller, and the grader tells you exactly which bugs your tests would miss. The challenges assume you can already plan and write a suite unaided.

## How to work a challenge

1. Read the problem and acceptance criteria.
2. Create a branch: `challenge/CH0X-shortname`.
3. Write the code under `framework/` (or a sub-folder the challenge specifies).
4. Run `npm run test` — all your new tests must pass.
5. Run `npm run typecheck` — zero TS errors.
6. Open a PR to yourself summarising what you built and what you learned.
7. Tick off the challenge in [`../career/PROGRESS.md`](../career/PROGRESS.md).

## Challenges

| #   | Title                                                           | Time    | Prereq chapters |
| --- | --------------------------------------------------------------- | ------- | --------------- |
| 01  | [Core Infrastructure](CH01_Core_Infrastructure.md)              | 4–6 h   | Ch 03, 05       |
| 02  | [Single Website POM (OrangeHRM)](CH02_Single_Website_POM.md)    | 6–8 h   | Ch 05, 08, 12   |
| 03  | [API + UI Cross-Validation](CH03_API_UI_Cross_Validation.md)    | 5–7 h   | Ch 11, 15, 19   |
| 04  | [New Tab Scenario](CH04_New_Tab_Scenario.md)                    | 4–6 h   | Ch 12           |
| 05  | [Cross-Website Data Bridge](CH05_Cross_Website_Data_Bridge.md)  | 6–8 h   | Ch 07, 11       |
| 06  | [Understand auth.fixture.ts](CH06_Understand_Auth_Fixture.md)   | 3–4 h   | Ch 06, 09       |
| 07  | [Full Cross-Site Enterprise Flow](CH07_Full_Cross_Site_Flow.md) | 10–14 h | All of Part 3   |

## Capstones

| #   | Title                                                          | Time    |
| --- | -------------------------------------------------------------- | ------- |
| C1  | [Flaky-Test Detector CLI](CAP_C1_Flaky_Test_Detector.md)       | 12–16 h |
| C2  | [Custom HTML Reporter](CAP_C2_Custom_Reporter.md)              | 8–12 h  |
| C3  | [Test Analytics Dashboard](CAP_C3_Test_Analytics_Dashboard.md) | 16–24 h |

Capstones are portfolio pieces. Push each to a public GitHub repo and link from your résumé.
