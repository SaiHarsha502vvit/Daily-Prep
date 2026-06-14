# Pathway 01 — Learning (Junior → Mid SDET)

A curated, ordered reading sequence that takes you from "I can write some code" to "I can build and maintain a real Playwright test suite at work."

> **Not this pathway if:**
>
> - You're already a working SDET → use [`PATHWAY_02_PROFESSIONAL.md`](./PATHWAY_02_PROFESSIONAL.md).
> - You have a specific work problem to solve right now → use [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md).
> - You have an interview in <2 weeks → see (E) in [`WHERE_TO_START.md`](./WHERE_TO_START.md).

---

## Who this is for

- You've written some code in any language (JS, TS, Python, Java, C# — anything).
- You know what a function, a loop, and a class are.
- You haven't built a real test automation suite, or you've written a few Selenium scripts and want a more modern foundation.
- You want to be able to ship a Playwright test suite at a real job and not be the slowest person in code review.

---

## Prerequisites (read these once, even briefly)

If you're rusty on any of these, do this **before** the pathway. Skipping won't break things — it'll just slow you down.

| You need to be comfortable with              | Where to refresh                               |
| -------------------------------------------- | ---------------------------------------------- |
| Variables, functions, loops, async/await     | Any modern JS/TS primer (MDN, javascript.info) |
| `npm install`, `package.json`, running a CLI | npmjs.com docs or any Node intro               |
| Reading HTML & DOM in browser DevTools       | Chrome DevTools "Elements" tab tutorial        |
| Git basics (clone, commit, branch)           | A 20-min Git intro is enough                   |

---

## How this pathway is shaped

The pathway is **6 sections** in order. Each section ends with a **checkpoint** — a small self-test you can use to decide whether to move on or revisit. Between sections you're allowed (encouraged) to take a break. Total time: **80–110 hours** spread over 6–10 weeks.

At any point you can swap to [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md) if a specific work problem comes up; the pathway is paused, not abandoned.

---

## Section 1 — Foundations (≈ 10 hours)

Build the mental model. Don't skip even if you've done Selenium before — the Playwright way is different.

| #   | Read                                                                                                               | Why now                                                                                     | Est    | Lab                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`01_Foundations/00_SDET_Foundations_Mindset.md`](./01_Foundations/00_SDET_Foundations_Mindset.md)                 | Sets the "SDET ships infrastructure, not just clicks" frame that everything else builds on. | 45 min | Write down 3 ways you'd test your last app differently after reading.                                                               |
| 2   | [`01_Foundations/01_Environment_Setup_and_First_Test.md`](./01_Foundations/01_Environment_Setup_and_First_Test.md) | Install Playwright, run codegen, get one test passing on your machine.                      | 90 min | Get any test running locally. Don't move on until this works.                                                                       |
| 3   | [`01_Foundations/01_Playwright_TS_Basics.md`](./01_Foundations/01_Playwright_TS_Basics.md)                         | Test/expect/locator/hooks — the four primitives.                                            | 2 hr   | Write 3 tests against [the-internet.herokuapp.com](https://the-internet.herokuapp.com/) (Playwright's recommended practice target). |
| 4   | [`01_Foundations/02_Enterprise_Locators_XPath.md`](./01_Foundations/02_Enterprise_Locators_XPath.md)               | Locator quality is the single biggest factor in test stability. Get this right early.       | 2.5 hr | Re-write all the locators from step 3 to use `getByRole`/`getByText` instead of CSS selectors. Notice the difference.               |
| 5   | [`01_Foundations/04_JS_TS_For_Automation.md`](./01_Foundations/04_JS_TS_For_Automation.md)                         | The TS subset you actually need for tests — not the whole language.                         | 3 hr   | Convert your 3 tests from `.js` to `.ts` with explicit types.                                                                       |

**Optional but useful here:** [`reference/01_quickstart.md`](./reference/01_quickstart.md), [`reference/03_locators.md`](./reference/03_locators.md) — keep these open in another tab.

### Checkpoint 1

Before continuing, you should be able to answer:

- Why does Playwright prefer `getByRole` over CSS selectors? (Hint: accessibility + intent + auto-waiting.)
- What's the difference between `await page.click(...)` and `await locator.click()`?
- What's the test runner's default timeout, and where do you change it?

If any of these feel shaky, re-read the chapter that covers it before moving on.

---

## Section 2 — Architecture (≈ 15 hours)

Move from "test scripts" to "test suite". This is the section that separates juniors from mid-level.

| #   | Read                                                                                                                                           | Why now                                                                                                         | Est    | Lab                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | [`02_Core_Architecture/05_POM_Architecture_Deep_Dive.md`](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)                             | Page Object Model — the single most important pattern in UI testing. Done badly, it's worse than not having it. | 3 hr   | Extract a POM for one screen from your step-3 tests.                                                                                            |
| 7   | [`02_Core_Architecture/06_Custom_Fixtures_Architecture.md`](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md)                         | Fixtures replace the `beforeEach` mess. Once you've used them you won't go back.                                | 3 hr   | Write one fixture that gives every test a logged-in `page`. Replace 5 lines of `beforeEach` boilerplate with `await loginPage.loginWith(user)`. |
| 8   | [`02_Core_Architecture/07_test_step_E2E_Architecture.md`](./02_Core_Architecture/07_test_step_E2E_Architecture.md)                             | The 15-step E2E skeleton — how a real test should be shaped from arrange to teardown.                           | 2 hr   | Refactor one of your tests into the 15-step skeleton.                                                                                           |
| 9   | [`02_Core_Architecture/08_Browser_Internals_for_SDETs.md`](./02_Core_Architecture/08_Browser_Internals_for_SDETs.md)                           | Why waits work the way they do; what "auto-waiting" actually means.                                             | 2 hr   | None — just absorb the mental model.                                                                                                            |
| 10  | [`02_Core_Architecture/09_Parallel_Execution_Workers.md`](./02_Core_Architecture/09_Parallel_Execution_Workers.md)                             | How worker processes affect what you can and can't share between tests.                                         | 2 hr   | Run your test suite with `--workers=4`. Note any test that breaks — that's a leakage bug.                                                       |
| 11  | [`02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md`](./02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md) | The three debugging surfaces you'll use daily.                                                                  | 1.5 hr | Force a test to fail. Open the trace viewer. Walk back through the steps.                                                                       |

**Read the framework code in parallel:** Open [`framework/pages/login/LoginPage.ts`](./framework/pages/login/LoginPage.ts) and [`framework/fixtures/orangehrm.fixture.ts`](./framework/fixtures/orangehrm.fixture.ts) alongside Ch05 and Ch06. The chapters teach the _why_; the code shows the _what_. [`MAP_CODE_TO_CHAPTER.md`](./MAP_CODE_TO_CHAPTER.md) maps them.

### Checkpoint 2

- Can you build a POM for a screen you've never seen before, in under 30 minutes?
- Can you explain the difference between `test`, `worker`, and `auto` fixture scope without checking the docs?
- When you see a test that takes 3 minutes, can you list 3 plausible reasons?

---

## Section 3 — Reliability & data (≈ 15 hours)

The section where you stop writing tests that pass once and start writing tests that pass reliably.

| #   | Read                                                                                                                                           | Why now                                                                                          | Est  | Lab                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | [`05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md`](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md)                         | The 9 flake types. You'll see most of them in your first month of real work.                     | 4 hr | Open [`framework/tests/broken/`](./framework/tests/broken/) and study each anti-pattern. Don't just read — predict why it fails before reading the explanation. |
| 13  | [`05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md`](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md)                       | If your suite leaks data, every other quality you build collapses.                               | 3 hr | Add a try/finally teardown to one of your tests that creates a record.                                                                                          |
| 14  | [`03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md`](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) | Persistent auth state — how to skip login on every test.                                         | 2 hr | Wire up `storageState` in one test project.                                                                                                                     |
| 15  | [`05_Advanced_Topics/42_Polling_Async_Data_Patterns.md`](./05_Advanced_Topics/42_Polling_Async_Data_Patterns.md)                               | `expect.poll`, `waitForResponse`, and when to use which. Replaces 95% of `waitForTimeout` usage. | 3 hr | Replace any `waitForTimeout(N)` in your tests with `expect.poll` or `waitForResponse`.                                                                          |
| 16  | [`05_Advanced_Topics/43_Real_World_SDET_War_Stories.md`](./05_Advanced_Topics/43_Real_World_SDET_War_Stories.md)                               | 14 war stories from real SDETs. Read for pattern recognition.                                    | 2 hr | None — pure reading.                                                                                                                                            |

### Checkpoint 3

- You see a test that fails 1 in 10 runs. What are the first 3 things you check?
- Why is `await page.waitForTimeout(2000)` an anti-pattern, and what do you use instead?
- A test creates a user. How do you make sure that user doesn't pollute the next run, even if the test crashes mid-way?

---

## Section 4 — API testing & integration (≈ 12 hours)

Real SDET work is half UI, half API. Skipping this section keeps you at junior.

| #   | Read                                                                                                                                           | Why now                                                                                    | Est    | Lab                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| 17  | [`04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md`](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md)                           | The basic wrapper that makes API testing readable.                                         | 2 hr   | Write 3 API tests against [reqres.in](https://reqres.in/) using the pattern in the chapter. |
| 18  | [`04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md`](./04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) | How to separate request headers, payloads, and endpoints so they're testable and reusable. | 2 hr   | Refactor your 3 API tests to use the factory pattern.                                       |
| 19  | [`03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md`](./03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md)     | Why "the UI showed success" isn't proof — you also need to check the backend.              | 1.5 hr | Add one API-based verification to one of your UI tests.                                     |
| 20  | [`05_Advanced_Topics/31_API_Mocking_page_route.md`](./05_Advanced_Topics/31_API_Mocking_page_route.md)                                         | When and how to mock APIs in UI tests — and when NOT to.                                   | 2 hr   | Mock one third-party API call in a test using `page.route()`.                               |
| 21  | [`reference/06_api_testing.md`](./reference/06_api_testing.md)                                                                                 | Quick reference to keep open.                                                              | 30 min | Use it next time you write an API test.                                                     |

**Code to read alongside:** [`framework/clients/UsersClient.ts`](./framework/clients/UsersClient.ts), [`framework/utilities/api/APIUtils.ts`](./framework/utilities/api/APIUtils.ts). You don't need to understand the full 5-layer architecture yet — just see how the `UsersClient` reads.

### Checkpoint 4

- Why is `request.get(url)` inside a UI test usually a smell?
- When should you mock an API, and when should you call the real one?
- If a UI test passes but the backend record wasn't created, what failed?

---

## Section 5 — CI/CD & specialized testing (≈ 12 hours)

You can write tests. Now run them in CI and add the dimensions beyond functional correctness.

| #   | Read                                                                                                                                 | Why now                                                   | Est    | Lab                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 22  | [`05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md`](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md)                 | How to wire your tests into a real CI pipeline.           | 3 hr   | Use the workflow in [`framework/.github/workflows/ci.yml`](./framework/.github/workflows/ci.yml) as a template for your own repo. |
| 23  | [`05_Advanced_Topics/48_Sharding_And_Test_Selection.md`](./05_Advanced_Topics/48_Sharding_And_Test_Selection.md)                     | How to make 500 tests run in CI in under 10 minutes.      | 2 hr   | Run `--shard=1/4` locally on your suite and watch it finish in a quarter of the time.                                             |
| 24  | [`07_Specialised_Testing/39_Accessibility_Testing_axe_core.md`](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md)       | Accessibility is now a hiring filter at most companies.   | 2 hr   | Add `@axe-core/playwright` to one test. See what it finds.                                                                        |
| 25  | [`07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md`](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) | Web Vitals + how to assert "the page loaded fast enough". | 2 hr   | Add one Lighthouse-based perf assertion.                                                                                          |
| 26  | [`05_Advanced_Topics/47_Allure_ReportPortal.md`](./05_Advanced_Topics/47_Allure_ReportPortal.md)                                     | Reports the team actually looks at.                       | 1.5 hr | Configure Allure for your suite.                                                                                                  |
| 27  | [`05_Advanced_Topics/59_Docker_For_Playwright.md`](./05_Advanced_Topics/59_Docker_For_Playwright.md)                                 | "Works on my machine" stops working.                      | 1.5 hr | Run your suite inside [`framework/docker-compose.yml`](./framework/docker-compose.yml).                                           |

### Checkpoint 5

- You inherit a suite that takes 45 minutes in CI. What are the first 3 things you'd try?
- What's the difference between `npm run lint`, `npm run typecheck`, and `npm test`, and which should run on every PR?
- Why does Docker need `shm_size: 2gb` for Playwright?

---

## Section 6 — Practice & prove it (≈ 16 hours)

You've read enough. Now build.

| #   | Do                                                                                                                             | Why                                                                                                                                    | Est    |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 28  | [`08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md`](./08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md)                     | 30 multiple-choice questions. Self-grade against [`quiz_01_solutions/`](./08_Practice_And_Quizzes/quiz_01_solutions/).                 | 1.5 hr |
| 29  | [`08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md`](./08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md) | 15 small code challenges. Cross-check [`quiz_02_solutions/`](./08_Practice_And_Quizzes/quiz_02_solutions/) only after attempting each. | 4 hr   |
| 30  | [`challenges/CH01_Core_Infrastructure.md`](./challenges/CH01_Core_Infrastructure.md)                                           | Build the framework spine: config, fixtures, env loader, base POM.                                                                     | 3 hr   |
| 31  | [`challenges/CH02_Single_Website_POM.md`](./challenges/CH02_Single_Website_POM.md)                                             | Build a multi-screen POM for one application.                                                                                          | 3 hr   |
| 32  | [`challenges/CH03_API_UI_Cross_Validation.md`](./challenges/CH03_API_UI_Cross_Validation.md)                                   | Cross-verify a UI action with an API call.                                                                                             | 2.5 hr |
| 33  | [`challenges/CH04_New_Tab_Scenario.md`](./challenges/CH04_New_Tab_Scenario.md)                                                 | Handle multi-tab/window flows.                                                                                                         | 2 hr   |

Reference solutions live in [`challenges/solutions/CH01..CH04/`](./challenges/solutions/) — only open after you've genuinely tried.

### Checkpoint 6 — final

You're done with this pathway when:

- ✅ You finished all of the above (it's OK to skip optional labs, not OK to skip checkpoints).
- ✅ Your CH01–CH04 attempts compile, run, and pass — even if they look different from the reference solutions.
- ✅ You can sit down with a blank repo, run `npm init && npm i -D @playwright/test`, write a working POM-based test in under 30 minutes.
- ✅ You can explain (out loud, to a rubber duck or a peer) why fixtures are worth the upfront cost.

---

## What you can do after this pathway

- Write and maintain a Playwright + TypeScript test suite at a real job.
- Pass a junior or mid-level SDET interview at most companies.
- Read the [`framework/`](./framework/) code without getting lost — and recognize patterns when you see them in production code.
- Recognize and refactor the 9 flake types in someone else's suite.
- Wire your suite into CI with sharding and reports.

---

## What this pathway intentionally skips

These are great, but not for a beginner. They're in [`PATHWAY_02_PROFESSIONAL.md`](./PATHWAY_02_PROFESSIONAL.md):

- D365-specific testing patterns (Ch10–17).
- The Mega POM architecture (Ch18).
- Enterprise API client library (Ch44).
- Principal-level topics: analytics, leadership, cost, SLOs, healing, ADRs, PII, chaos, observability (P1–P10).
- Career artifacts: rubrics, mock interviews, RFC templates.

You'll know it's time for those when this pathway feels too slow for you.

---

## Where to switch pathways

- "I want to interview" → [`WHERE_TO_START.md`](./WHERE_TO_START.md) Section E.
- "I have a real problem to solve" → [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md).
- "I've done this and want senior/principal" → [`PATHWAY_02_PROFESSIONAL.md`](./PATHWAY_02_PROFESSIONAL.md).

---

## How long will this realistically take

Most learners take **6–10 weeks** at 10–15 hrs/week. Some take 4 weeks at 25 hrs/week, some take 16 weeks at 5 hrs/week. Both are fine. The thing that decides whether you finish is whether you stop. The thing that decides whether it sticks is whether you actually do the labs.

Take the breaks between sections.
