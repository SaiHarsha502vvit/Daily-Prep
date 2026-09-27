# Playwright & SDET Automation — Start Here

Learn Playwright + TypeScript the way working automation engineers use it: from your first
test, through framework design, to the real-world flows that break in production —
logins with OTP and passkeys, payment gateways, file uploads, async backends, CI at scale.

**This page is the only front door.** Everything below is ordered; you never need to guess
which file comes next.

---

## Pick your route (30 seconds)

| You are… | Do this |
| --- | --- |
| **New to test automation** (you can code, but haven't built a real suite) | Follow **The learning path** below, Stage 1 → Stage 9, in order. ~80–110 hours. |
| **Already writing Playwright tests, want senior depth** | Skim Stage 1, then start at **Stage 2**. Stages 3, 5 and 6 are where most working engineers have gaps. |
| **Stuck on a problem at work right now** | Use the **"I need to…" lookup** at the bottom of this page. |
| **Reading the `framework/` code and want the *why*** | Open [`appendix/navigation/MAP_CODE_TO_CHAPTER.md`](./appendix/navigation/MAP_CODE_TO_CHAPTER.md) — every framework file → the chapter that explains it. |
| **Interviewing soon** | [Ch32 Interview Prep](./08_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) → [`career/mock_interviews/`](./career/mock_interviews/) → [`career/INTERVIEW_BANK.md`](./career/INTERVIEW_BANK.md). With >2 weeks, add Stage 8. |

**Before you start:** comfortable with JavaScript async/await ([`16_JavaScript/`](../16_JavaScript/)) and basic TypeScript ([`17_TypeScript/`](../17_TypeScript/)). Stage 1 reviews both in a testing context.

---

## How to read this module

- **Folders are stages, and stages are in learning order.** `01_` comes before `02_`, and so on.
- **Chapter numbers are permanent IDs, not reading order.** Chapters were written over time, so Stage 1 contains Ch00–04 *and* Ch55–56. Other chapters say "see Ch42"; the number always finds the file. Inside each stage, follow the order in that stage's `README.md` (shown below each folder on GitHub) or in the table here.
- **One canonical copy per topic.** The numbered chapters are the curriculum. [`appendix/`](./appendix/README.md) holds shorter quick-reference and summary versions; each one says which chapter is canonical.
- **Every chapter ends with Practice Challenges** (answers hidden in collapsible blocks) and a **Reality Check** of common misconceptions.

---

## The learning path

### Stage 1 — Foundations · [`01_Foundations/`](./01_Foundations/README.md)
Install, first test, how Playwright finds elements, and the two tools you'll use every day for debugging and configuration.

| Order | Chapter | Why now |
| --- | --- | --- |
| 1 | [Ch01 Environment Setup & First Test](./01_Foundations/01_Environment_Setup_and_First_Test.md) | A passing test on your machine before any theory |
| 2 | [Ch00 SDET Foundations & Mindset](./01_Foundations/00_SDET_Foundations_Mindset.md) · [Testing fundamentals](./01_Foundations/00_Testing_Fundamentals/) | What to test and why, the test pyramid |
| 3 | [Ch01 Playwright + TypeScript Basics](./01_Foundations/01_Playwright_TS_Basics.md) | Auto-waiting, lazy locators, the event loop |
| 4 | [Ch02 Locators (roles, CSS, XPath)](./01_Foundations/02_Enterprise_Locators_XPath.md) | Finding elements reliably |
| 5 | [Ch55 Inspector, Trace Viewer & UI Mode](./01_Foundations/55_Inspector_TraceViewer_UIMode_Walkthrough.md) | **Your debugger — learn it before you need it** |
| 6 | [Ch04 JS/TS for Automation](./01_Foundations/04_JS_TS_For_Automation.md) | The async mistakes that cause most flaky tests |
| 7 | [Ch03 Browser Console Scripting](./01_Foundations/03_Browser_Console_Scripting.md) | Inspecting pages from DevTools |
| 8 | [Ch56 `playwright.config.ts` Deep Dive](./01_Foundations/56_Playwright_Config_Deep_Dive.md) | Timeouts, projects, retries, traces |

### Stage 2 — Test Architecture · [`02_Test_Architecture/`](./02_Test_Architecture/README.md)
How professional suites are structured, so that tests stay maintainable at 500 tests, not just 5.

[Ch05 Page Object Model](./02_Test_Architecture/05_POM_Architecture_Deep_Dive.md) → [Ch06 Custom Fixtures](./02_Test_Architecture/06_Custom_Fixtures_Architecture.md) → [Ch07 `test.step` & E2E structure](./02_Test_Architecture/07_test_step_E2E_Architecture.md) → [Ch08 Browser Internals](./02_Test_Architecture/08_Browser_Internals_for_SDETs.md) → [Ch09 Parallel Workers](./02_Test_Architecture/09_Parallel_Execution_Workers.md) → [Ch64 Dynamic Locators in POMs](./02_Test_Architecture/64_Dynamic_Locators_And_Data_Structures_In_POMs.md)

### Stage 3 — Real-World Scenarios · [`03_Real_World_Scenarios/`](./03_Real_World_Scenarios/README.md)
The flows that real products have and toy tutorials skip.

| Order | Chapter | Covers |
| --- | --- | --- |
| 1 | [Ch31 API Mocking with `page.route()`](./03_Real_World_Scenarios/31_API_Mocking_page_route.md) | Controlling what the app receives |
| 2 | [Ch42 Polling & Async Data](./03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md) | Waiting for slow backends without `sleep` |
| 3 | [Ch28 Test Data Lifecycle](./03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md) | Creating and cleaning up data safely in parallel |
| 4 | [Ch30 Database Verification](./03_Real_World_Scenarios/30_Database_Verification_Direct_SQL.md) | Asserting what was stored, not just what was shown |
| 5 | [Ch57 Login: OAuth, SAML, MFA/TOTP, OTP, passkeys](./03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) | Every login you'll meet, including OTP and WebAuthn |
| 6 | [Ch50 Email Testing](./03_Real_World_Scenarios/50_Email_Service_Testing.md) | Verification emails, magic links, OTP by email |
| 7 | [Ch58 File Uploads & Downloads](./03_Real_World_Scenarios/58_File_Uploads_Downloads.md) | Uploads, downloads, CSV/PDF assertions |
| 8 | [Ch61 Emulation: Clock, Network & Devices](./03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) | Fake time, offline, geolocation, mobile, fake camera/mic, push notifications |
| 9 | [Ch41 GraphQL & WebSockets](./03_Real_World_Scenarios/41_GraphQL_WebSocket_Testing.md) | Real-time and single-endpoint APIs |
| 10 | [Ch49 Feature Flags](./03_Real_World_Scenarios/49_Feature_Flag_Testing.md) | Testing both sides of a flag |
| 11 | [Ch67 Payment Gateways](./03_Real_World_Scenarios/67_Payment_Gateway_Testing.md) | Card iframes, 3-D Secure, idempotency, webhooks, money, PayPal-style popups, Apple/Google Pay |
| 12 | [Ch68 Consent Banners, Overlays & CAPTCHA](./03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md) | `addLocatorHandler`, GDPR consent tests, CAPTCHA test keys |

### Stage 4 — Cross-Site Patterns & a Dynamics 365 Case Study · [`04_Cross_Site_Patterns_And_D365/`](./04_Cross_Site_Patterns_And_D365/README.md)
Six patterns for flows that span apps, tabs, users and domains, then applying everything to a hard enterprise UI.

[Ch11 Sequential Flow](./04_Cross_Site_Patterns_And_D365/11_CrossSite_Pattern1_Sequential_Flow.md) → [Ch12 New Tab](./04_Cross_Site_Patterns_And_D365/12_CrossSite_Pattern2_NewTab_SharedContext.md) → [Ch13 Two Users at Once](./04_Cross_Site_Patterns_And_D365/13_CrossSite_Pattern3_Dual_BrowserContext.md) → [Ch14 Tokens & Magic Links](./04_Cross_Site_Patterns_And_D365/14_CrossSite_Pattern4_Token_Magic_Link.md) → [Ch15 UI → API Side Effects](./04_Cross_Site_Patterns_And_D365/15_CrossSite_Pattern5_UI_API_Side_Effects.md) → [Ch16 storageState Chaining](./04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md) → [Ch10 Dynamics 365](./04_Cross_Site_Patterns_And_D365/10_Dynamics365_CRM_Testing.md) → [Ch17 D365 Timing Traps](./04_Cross_Site_Patterns_And_D365/17_D365_Advanced_Timing_Patterns.md)

### Stage 5 — Enterprise Framework · [`05_Enterprise_Framework/`](./05_Enterprise_Framework/README.md)
Designing the framework a whole team builds on: project layout, typed API clients, lint rules.

[Ch21 Project Structure](./05_Enterprise_Framework/21_Enterprise_Project_Structure.md) → [Ch22 Headers/Payloads/Endpoints](./05_Enterprise_Framework/22_Headers_Payloads_Endpoints_Factory.md) → [Ch23 HTTP Library](./05_Enterprise_Framework/23_APIUtils_HTTP_Library.md) → [Ch24 Test Script Architecture](./05_Enterprise_Framework/24_Test_Script_Architecture.md) → [Ch44 API Client Library](./05_Enterprise_Framework/44_Enterprise_API_Client_Library.md) → [Ch18 Mega POM](./05_Enterprise_Framework/18_Mega_POM_Architecture.md) → [Ch27 Advanced TypeScript](./05_Enterprise_Framework/27_Advanced_TypeScript_for_SDETs.md) → [Ch63 Static Analysis](./05_Enterprise_Framework/63_Static_Analysis_ESLint_TypeScript_Playwright.md)

### Stage 6 — CI/CD & Reliability · [`06_CI_CD_And_Reliability/`](./06_CI_CD_And_Reliability/README.md)
Running suites in pipelines, keeping them trustworthy, and operating them at scale.

[Ch25 CI/CD](./06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md) → [Ch59 Docker](./06_CI_CD_And_Reliability/59_Docker_For_Playwright.md) → [Ch26 Flakiness Diagnosis](./06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) → [Ch43 War Stories](./06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md) → [Ch48 Sharding & Test Selection](./06_CI_CD_And_Reliability/48_Sharding_And_Test_Selection.md) → [Ch47 Allure & ReportPortal](./06_CI_CD_And_Reliability/47_Allure_ReportPortal.md) → [Ch51 Secrets](./06_CI_CD_And_Reliability/51_Secrets_Management_For_SDETs.md) → [Ch54 Synthetic Monitoring](./06_CI_CD_And_Reliability/54_Synthetic_Monitoring.md) → [Ch62 Test Operations](./06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md) → [Ch65 Chaos Engineering](./06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md)

### Stage 7 — Specialised Testing · [`07_Specialised_Testing/`](./07_Specialised_Testing/README.md)
Test types beyond functional E2E. Pick the ones your product needs; order doesn't matter much here.

[Ch29 Visual Regression](./07_Specialised_Testing/29_Visual_Regression_Testing.md) · [Ch39 Accessibility](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md) · [Ch40 Security](./07_Specialised_Testing/40_Security_Testing_OWASP.md) · [Ch19 Console Security Scripts](./07_Specialised_Testing/19_Advanced_Console_Scripts_Security.md) · [Ch37 Performance](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) · [Ch38 Contract Testing](./07_Specialised_Testing/38_Contract_Testing_Pact.md) · [Ch52 Component Testing](./07_Specialised_Testing/52_Component_Testing_With_Playwright_CT.md) · [Ch53 Mutation Testing](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) · [Ch46 BDD](./07_Specialised_Testing/46_BDD_With_Cucumber.md) · [Ch45 AI Agents & MCP](./07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md)

### Stage 8 — SDET → SDE Bridge · [`08_SDET_to_SDE_Bridge/`](./08_SDET_to_SDE_Bridge/README.md)
The CS depth, design judgement and interview skills that separate senior engineers.

[Ch33 CS Thinking](./08_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md) → [Ch34 Algorithms in Test Automation](./08_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) → [Ch35 OOP Design Patterns](./08_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md) → [Ch36 TypeScript Type System](./08_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) → [Ch60 Tool Comparison](./08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) → [Ch66 Senior Decision-Making](./08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) → [Ch32 Interview Prep](./08_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md)

### Stage 9 — Practice · [`09_Practice_And_Quizzes/`](./09_Practice_And_Quizzes/)
Quizzes and a 10-week practice plan. Pair with the graded [`challenges/`](./challenges/README.md) (7 challenges + 3 capstones).

---

## Build as you learn

| Folder | What it is | When |
| --- | --- | --- |
| [`projects/starter-playwright-ts/`](./projects/starter-playwright-ts/) | Deliberately incomplete scaffold — grow it chapter by chapter | From Stage 1 |
| [`framework/`](./framework/README.md) | The complete reference framework every chapter's code is drawn from | Compare against it from Stage 2 |
| [`challenges/`](./challenges/README.md) | Graded exercises with reference solutions | After each stage |
| [`career/`](./career/README.md) | Readiness rubric, portfolio plan, mock interviews | Stage 8 onwards |

---

## "I need to…" — quick lookup

| I need to… | Go to |
| --- | --- |
| Fix a flaky test | [Ch26](./06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md), then [Ch55 Trace Viewer](./01_Foundations/55_Inspector_TraceViewer_UIMode_Walkthrough.md) |
| Test a login with MFA, OTP or a passkey | [Ch57](./03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) |
| Test a checkout / payment (cards, PayPal, Apple/Google Pay) | [Ch67](./03_Real_World_Scenarios/67_Payment_Gateway_Testing.md) |
| Get past a cookie banner or surprise pop-up | [Ch68](./03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md) §2–3 |
| Test a form protected by CAPTCHA | [Ch68](./03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md) §5 |
| Test camera, microphone or push notifications | [Ch61](./03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) §5b |
| Find a row in a huge / virtualised grid, or an infinite feed | [Ch64](./02_Test_Architecture/64_Dynamic_Locators_And_Data_Structures_In_POMs.md) §6 |
| Wait for a slow backend job | [Ch42](./03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md) |
| Upload or download a file | [Ch58](./03_Real_World_Scenarios/58_File_Uploads_Downloads.md) |
| Mock an API or force an error state | [Ch31](./03_Real_World_Scenarios/31_API_Mocking_page_route.md) |
| Handle a new tab, popup, or second user | [Ch12](./04_Cross_Site_Patterns_And_D365/12_CrossSite_Pattern2_NewTab_SharedContext.md), [Ch13](./04_Cross_Site_Patterns_And_D365/13_CrossSite_Pattern3_Dual_BrowserContext.md) |
| Stop logging in before every test | [Ch16](./04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md) |
| Run tests in CI / Docker / shards | [Ch25](./06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md), [Ch59](./06_CI_CD_And_Reliability/59_Docker_For_Playwright.md), [Ch48](./06_CI_CD_And_Reliability/48_Sharding_And_Test_Selection.md) |
| Look up a one-screen snippet | [Weekly patterns](./appendix/quick_reference/00_Weekly_Patterns.md) · [Quick reference](./appendix/README.md) |
| See every chapter with times and prerequisites | [`00_INDEX.md`](./00_INDEX.md) — the full catalogue |

---

## House conventions

- **No `await` on locator creation** — only on actions and assertions.
- **POMs instantiated before `test.step()`** — so step names describe behaviour, not setup.
- **Object accumulator, not a `let` primitive** — reference stability across steps.
- **Named factory calls** — `HeadersCrm.auth(token)`, not `{ Authorization: ... }` inline.
- **Tests import from the fixtures barrel** — never from `@playwright/test` directly.
- **Real names in examples** — `MasterSearchPage`, `CitationsClient`, OrangeHRM. No `FooBar`.

---

## Related modules

| Topic | Where |
| --- | --- |
| API testing depth (REST, SOAP, contract) | [`24_Advanced_API_Testing/`](../24_Advanced_API_Testing/) |
| TypeScript / JavaScript foundations | [`17_TypeScript/`](../17_TypeScript/) · [`16_JavaScript/`](../16_JavaScript/) |
| CSS selectors in depth | [`18_CSS_Complete/`](../18_CSS_Complete/) |
| DSA / algorithms | [`03_Algorithms/`](../03_Algorithms/) |
| SQL for DB verification | [`08_SQL/`](../08_SQL/) |
| CI/CD beyond Playwright | [`22_DevOps/`](../22_DevOps/) |
| Mobile / Appium | [`23_Mobile_Dev_And_Testing/`](../23_Mobile_Dev_And_Testing/) |

**Not yet covered (known gaps):** cloud device farms (BrowserStack, Sauce Labs) and screen-reader (NVDA/JAWS) automation — both deliberately out of scope. Also covered elsewhere: OpenTelemetry in [`framework/utilities/api/TELEMETRY_README.md`](./framework/utilities/api/TELEMETRY_README.md), test impact analysis in Ch48 §11, property-based testing in Ch34 §11.

Module governance (audits, link-repair history) lives in [`_meta/`](./_meta/).
