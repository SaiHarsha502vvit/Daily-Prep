# Senior Mobile Software Engineer Readiness Rubric

> **Purpose**: maps the 12 competency areas of a senior-and-beyond mobile software engineer (Android, iOS, Flutter), building on what this module teaches. Use it for self-assessment, growth tracking with a manager, and deciding what to practice next. It mirrors the structure of the web-side [Principal SDET rubric](../../21_SDET_Playwright_Automation/career/READINESS_RUBRIC.md) but is written for mobile, and is one of two ladders — see [README.md](README.md) for how they relate. Rows 10, 11 and 12 are shared with the [SDET ladder](READINESS_RUBRIC_SDET.md).

---

## How to Use This Rubric

1. **Self-assess honestly.** For each competency, choose the band that describes you *today*, not the one you aspire to.
2. **Gather evidence.** For each band you claim, point to a concrete artifact, system or behavior — the Evidence column gives the kind of thing that counts. No evidence, no band.
3. **Find the gap.** Competencies where you sit one band below your target are your growth areas.
4. **Pick two or three per quarter** and tie each to a deliverable, using the action-plan template at the end.
5. **Calibrate externally.** People over-rate themselves at Senior; ask a mentor or manager to check the evidence, not the confidence.

The three rows marked ⇄ (**Code Review Calibration**, **Mentoring & Leadership**, **Cost Governance**) are worded identically in both ladders on purpose — see [README.md](README.md#the-shared-rows). If you edit one, edit [READINESS_RUBRIC_SDET.md](READINESS_RUBRIC_SDET.md) to match.

---

## Competency Areas

### 1. Platform Depth (Android, iOS, Flutter)

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Builds screens by following existing patterns on one platform. Needs help when a platform behavior (lifecycle, permissions) surprises them. | Features shipped on one platform with review guidance |
| **Mid** | Fluent on one platform's lifecycle, navigation and UI framework; can read the other platform's code and explain the equivalent concepts. | Can explain Activity/Fragment vs UIViewController lifecycle differences without notes |
| **Senior** | Works across the platforms the product targets and understands *why* they differ (ARC vs garbage collection, watchdog vs ANR, own-renderer vs native views). Picks up an unfamiliar platform area without a guide. | Fixed a bug on the second platform; wrote the explanation of the underlying difference |
| **Staff** | The reference person for platform behavior across the org; recognizes when an OS release changes assumptions across multiple apps. | OS-release readiness review that caught issues across several apps before release |
| **Principal** | Contributes to the platforms' own ecosystem or defines how the industry approaches a platform problem. | Upstream contributions, widely used libraries, conference talks |

---

### 2. Architecture & State Management

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Puts logic wherever it works; screens own networking, state and navigation. | Single large screen files; logic untestable without a device |
| **Mid** | Applies a layered pattern (ViewModel/BLoC/Clean Architecture) consistently and keeps UI free of data-layer concerns. | Domain/data/UI separation on a real feature; no layer violations in review |
| **Senior** | Designs module and dependency boundaries for a whole app, uses dependency injection to keep it testable, and can say what each boundary costs as well as buys. | Multi-module app with a written rationale for each boundary; fakes injected in tests |
| **Staff** | Defines architecture for multiple apps or teams; decides when a standard helps and when it overreaches; migrates architectures without a rewrite. | Shared architecture adopted by several teams, with an incremental migration path |
| **Principal** | Architecture patterns adopted beyond the organization. | Published reference architecture others build on |

---

### 3. Native vs Cross-Platform Strategy & Build-vs-Buy

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Uses whichever framework the team already chose; unaware of what it implies for testing and performance. | Cannot say what the framework choice cost the test strategy |
| **Mid** | Knows the main tradeoffs between native and cross-platform and can describe the platform-channel boundary. | Wrote a platform-channel integration and documented it |
| **Senior** | Derives the decision from consequences — what test tooling can see, who can diagnose performance at which layer, the boundary tax, the second-platform cost — and names the one question that actually decides it for this product. Applies the same reasoning to build-vs-buy of SDKs. | A written decision that states which of the competing questions decided it and why the others did not |
| **Staff** | Owns the strategy across a portfolio of apps; plans incremental migration (add-to-app, native modules) instead of rewrites. | A staged cross-app migration that shipped without a freeze |
| **Principal** | Their framing of the decision is used outside the organization. | Public write-ups cited by other teams making the same call |

---

### 4. Performance, Memory & Battery Engineering

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Treats performance as polish to do last; cannot tell an ANR from a crash. | "Feels slow" bugs closed without measurement |
| **Mid** | Uses the profiler to confirm a suspected problem; knows StrictMode and LeakCanary / Instruments exist and runs them. | A leak found and fixed using the platform tool |
| **Senior** | Diagnoses from symptom to line of code — scales a vague report to the variable that drives it, reads a leak trace from the anchor not the payload, profiles release-like builds, and treats ANRs and leaks as correctness bugs. | Worked diagnoses written up with the tool output that confirmed each step |
| **Staff** | Sets performance budgets and regression detection for a product line; tracks hang rate and crash-free metrics from real users and ties them to releases. | Hang-rate and startup budgets enforced in CI and monitored in production |
| **Principal** | Advances how the industry measures or diagnoses mobile performance. | Published tooling or measurement methodology |

---

### 5. Persistence, Offline & Data Migration Safety

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Stores data without considering schema change, process death or fresh-install paths. | Crashes only on a fresh install or after an update |
| **Mid** | Writes and tests migrations for simple schema changes; knows what survives rotation and process death. | Tested migration for one schema version bump |
| **Senior** | Treats a migration as irreversible after rollout and verifies accordingly — multi-version upgrade paths, fresh install, partial failure — and designs sync/offline behavior for conflicts, not just the happy path. | Upgrade-path tests across several prior versions; a documented conflict policy |
| **Staff** | Defines the data-evolution strategy across apps; builds the tooling that makes unsafe migrations hard to ship. | Migration linting or CI checks that block unsafe schema changes |
| **Principal** | Contributes to how the industry handles on-device data evolution. | Published approach adopted by libraries or other organizations |

---

### 6. Release Engineering & Rollout Control

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Ships what the team ships; unaware a shipped binary cannot be recalled. | Releases go to 100% on day one with no halt plan |
| **Mid** | Follows the release process, uses staged rollouts and knows store review can reject or delay a release. | Participated in several staged releases without incident |
| **Senior** | Designs releases around the reversibility ladder — builds the flag or kill-switch before the risky change ships, writes halt criteria before the rollout starts, and keeps irreversible changes (migrations) out of un-flagged releases. | A release where the riskiest change was flagged and the halt thresholds were written in advance; a rollout actually halted by them |
| **Staff** | Owns release strategy across apps: release trains, rollout policy, signing and store-compliance automation, and the process for emergency fixes. | Org-wide release policy; measured reduction in hotfix frequency |
| **Principal** | Defines release practice for the industry. | Published practice adopted by other organizations |

---

### 7. Incident Response & Production Diagnosis

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Waits for instructions during an incident; cannot read a crash report beyond the top frame. | Escalates without gathering the affected segment |
| **Mid** | Reads crash reports and logs, reproduces from a report, and fixes the identified bug. | Reproduced and fixed a production crash from a report |
| **Senior** | Runs the first hour: scopes by segmenting along the device-matrix axes, stops the bleeding with the cheapest working rung before the cause is known, diagnoses on the affected segment, fixes forward staged, and writes a postmortem that names which gap let it ship. | A postmortem that maps to a specific missing config, missing test or retried-green failure — never just "more testing" |
| **Staff** | Builds the incident system: on-call, severity definitions, dashboards by segment, rollout-halt automation; improves detection time across teams. | Measurable drop in time-to-detect and time-to-mitigate across apps |
| **Principal** | Advances incident practice for mobile industry-wide. | Public postmortems or tooling others adopt |

---

### 8. Testability & Test Strategy for App Code

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Writes code that can only be tested through the UI on a device. | Logic inseparable from views |
| **Mid** | Writes unit tests for logic and a few UI tests; injects fakes where the code allows it. | ViewModel tests with fake repositories |
| **Senior** | Designs for testability from the start — injectable dependencies, stable test selectors (Keys, accessibility identifiers), deterministic time/network — and chooses the cheapest test level that would catch each class of bug. | Features whose critical logic is covered by fast tests and whose UI tests only assert wiring |
| **Staff** | Sets testability standards across teams and works with SDETs on tooling and selectors before frameworks are chosen. | Testability requirements in the definition of done; selectors present from day one |
| **Principal** | Influences how the industry designs mobile code for testability. | Published patterns and libraries |

---

### 9. Technical Planning & RFC Writing

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Estimates only the coding; surprised by review, QA and store timelines. | Plans that omit review/QA/rollout time |
| **Mid** | Breaks features into tasks and flags dependencies on other teams or the backend. | Plans with an explicit dependency list |
| **Senior** | Plans around mobile's real constraints — store review latency, staged rollout time, flag and migration sequencing, device-testing time — and writes proposals that pre-empt the reviewer's objections (alternatives, rollout, risks, exit ramp). | An RFC whose rollout plan has a success signal per phase and a named risk response |
| **Staff** | Plans multi-team, multi-quarter initiatives; arbitrates between competing proposals with explicit criteria. | Cross-team roadmap delivered with measured slippage and a clear decision record |
| **Principal** | Sets technical direction at organization scale and is trusted to make irreversible calls. | Strategy documents that were followed through multi-year execution |

---

### 10. Code Review Calibration ⇄

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Reviews for correctness only; comments mix blocking and stylistic points without saying which is which. | PR comments with no severity signal; authors unsure what must change |
| **Mid** | Separates blocking issues from preferences. Catches known hazards (main-thread I/O, retain cycles, an unclosed resource) when reminded to look for them. | Reviews that cite a rule but not yet the reason it fails at scale |
| **Senior** | Calibrates with one question — is this invisible in development but guaranteed at scale? Blocks on those, comments on the rest, and attaches the failure mechanism to every block. | Review comments that read "passes on your device, ANRs on a budget one"; authors rarely re-ask why |
| **Staff** | Turns recurring review findings into automated checks, templates or lint rules so the same finding stops needing a human, and calibrates reviewers across teams. | A lint rule or CI check that replaced a repeated comment; a shared severity guide teams actually use |
| **Principal** | Sets review standards that are adopted beyond their own organization and outlive their involvement. | A published review guide or open-source check others adopt |

---

### 11. Mentoring & Leadership ⇄

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Learns from reviews and pairing; asks for help early when blocked instead of silently stalling. | Questions asked with the attempted diagnosis attached |
| **Mid** | Answers teammates' questions accurately within their own area and onboards a new joiner onto it. | A new joiner productive in one area within a few weeks |
| **Senior** | Teaches the diagnostic method instead of handing over the fix — e.g. asks a junior to capture a memory snapshot after closing a screen ten times and describe what they see. Has taught at least one person to do independently what they do. | A mentee who diagnosed a real leak or flaky failure unaided |
| **Staff** | Raises the standard across several teams: sets the blameless-postmortem culture, runs a growth program, sponsors others into owning areas. | Postmortem practice adopted across teams; people they sponsored now own systems |
| **Principal** | Shapes engineering culture organization-wide or across the industry. | Talks, writing or programs that changed how other organizations work |

---

### 12. Cost Governance ⇄

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Unaware of what builds, device minutes or third-party SDKs cost. | No cost figures tracked anywhere |
| **Mid** | Knows the main cost drivers in their own area (CI minutes, device-minutes, app size) and avoids obviously wasteful choices. | Can name the three biggest cost drivers of their area |
| **Senior** | Estimates cost with an explicit model — variables, not gut feel — and chooses between options on it, including the term people forget (e.g. maintenance hours in a device-lab-vs-cloud decision). Places work in the cheapest tier that still catches the bug. | A cost model with stated assumptions that was used in a real decision |
| **Staff** | Owns a budget across teams: sets quotas or tiers, instruments spend, reports it, and removes waste at organization scale. | A spend dashboard, a tier policy, and a measured saving |
| **Principal** | Sets cost strategy for the organization's mobile infrastructure, including platform-level build-vs-buy. | A multi-year infrastructure strategy that held up against real spend |

---

## Where This Module Teaches Each Competency

Each competency below is mapped to material that actually exists in this module. Where nothing exists yet, that is said plainly rather than implied.

| Competency | Taught / practiced in | Status |
| --- | --- | --- |
| 1. Platform Depth | [iOS overview](../03_iOS_Native_Dev_And_Testing.md), [Android overview](../02_Android_Native_Dev_And_Testing.md), [Android deep dive (10 chapters)](../03_Android/01_Architecture_And_App_Model.md), [Flutter Bootcamp](../Flutter_Bootcamp/00_MASTER_ROADMAP.md) | Real |
| 2. Architecture & State Management | [Android Ch03 ViewModel/StateFlow](../03_Android/03_ViewModel_StateFlow_LiveData.md), [Ch09 Hilt DI](../03_Android/09_Dependency_Injection_Hilt.md), [Flutter Weeks 20–21 BLoC & Clean Architecture](../Flutter_Bootcamp/Phase_5_Advanced_Patterns/Week_21_Clean_Architecture.md), [DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md) | Real |
| 3. Native vs Cross-Platform & Build-vs-Buy | [Judgment doc §2](../10_Senior_Mobile_Engineering_Judgment.md#2-native-vs-cross-platform--deriving-the-decision-from-its-consequences), [Flutter rendering & platform channels](../Flutter_Bootcamp/Reference/DOC_01_Rendering_Pipeline.md) | Real (derivation); **no full worked proposal yet** — a native-vs-Flutter RFC is planned |
| 4. Performance, Memory & Battery | [Android Ch10](../03_Android/10_Performance_Memory_And_ANR_Profiling.md), [iOS performance & Instruments](../08_iOS_Performance_Memory_And_Instruments.md), [Flutter Week 25](../Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_25_Performance_and_Profiling.md) | Real; **battery/energy profiling is only touched lightly** — no dedicated chapter |
| 5. Persistence, Offline & Migration Safety | [Room & DataStore (§8 migrations)](../03_Android/05_Room_Database_And_DataStore.md#8-database-migrations--the-critical-qa-scenario), [Flutter Week 18](../Flutter_Bootcamp/Phase_4_Firebase_and_Storage/Week_18_Local_Storage.md), [Core Data in the iOS overview](../03_iOS_Native_Dev_And_Testing.md) | Real; **offline-sync conflict handling has no dedicated chapter** |
| 6. Release Engineering & Rollout Control | [Release & rollout playbook](RELEASE_AND_ROLLOUT_PLAYBOOK.md), [Judgment doc §1 and §6](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility), [Flutter Week 26 CI/CD](../Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_26_CICD_and_Deployment.md), [pre-launch checklist](../Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_27_Project_ChatApp.md#pre-launch-checklist--the-shipping-gate) | Real — the playbook's store mechanics were verified against official docs on 2026-10-18; re-check before a real release |
| 7. Incident Response & Production Diagnosis | [Judgment doc §5](../10_Senior_Mobile_Engineering_Judgment.md#5-incident-command-for-a-crash-spike-across-a-fragmented-matrix), [DOC_09 triage](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md#the-triage-table--symptom-to-tool), Android Ch10 and iOS performance worked diagnoses | Real |
| 8. Testability & Test Strategy for App Code | [Android Ch07 unit tests](../03_Android/07_Unit_Tests_JUnit_Mockito.md), [Ch08 instrumented tests](../03_Android/08_Instrumented_And_UI_Tests.md), [Flutter Week 24](../Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_24_Testing.md), [test design](../07_Test_Design_And_Documentation.md) | Real |
| 9. Technical Planning & RFC Writing | [Web-side Ch66 §3–4 (ADR and RFC reasoning)](../../21_SDET_Playwright_Automation/08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) | Generic only; **a mobile RFC template with a worked example is planned** |
| 10. Code Review Calibration ⇄ | [Judgment doc §7](../10_Senior_Mobile_Engineering_Judgment.md#7-review-calibration--what-to-block-on) | Real (reasoning); **a full app-code review rubric is planned** |
| 11. Mentoring & Leadership ⇄ | [Judgment doc §7, mentoring paragraph](../10_Senior_Mobile_Engineering_Judgment.md#7-review-calibration--what-to-block-on) | Thin — **no dedicated material**; practice it by teaching a diagnosis method to a colleague |
| 12. Cost Governance ⇄ | [Test-infra cost model](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#7-the-cost-model) | Real for test infrastructure; **build-time/SDK/app-size cost has no material yet** |

---

## Scoring Guide

Score each competency Junior=1, Mid=2, Senior=3, Staff=4, Principal=5.

**Senior target profile** (the primary goal of this module):

- At least 8 of 12 competencies at 3 or above
- No competency below 2
- Total of 32 or more out of 60

**Staff target profile:** total 40+, at least 6 competencies at 4 or 5, none below 3.

**Principal target profile:** total 48+, at least 8 competencies at 4 or 5, none below 3.

### Action Plan Template

```markdown
### Q-next Growth Plan

**Focus competency**: <number and name>
**Current level**: <band> (<score>)
**Target level**: <band> (<score>)
**Evidence goal**: <the specific artifact or behavior that would prove it>
**Milestone 1 (week 2)**: <audit / baseline>
**Milestone 2 (week 4)**: <design or first deliverable>
**Milestone 3 (week 8)**: <pilot with real users or a real release>
**Milestone 4 (week 12)**: <measured outcome>
**Reviewer**: <someone one band above you, for calibration>
```

### Calibration Tips

1. **Evidence over confidence.** If you cannot point to an artifact, you are not at that band.
2. **Scope matters.** Senior is a feature or a service; Staff is cross-team; Principal is cross-org or industry.
3. **Teaching is required.** To claim Senior or above in any competency, you must have taught someone else to do it.
4. **Mobile-specific tell.** At Senior and above, ask of any decision: *what is my fastest undo if this is wrong?* If you cannot answer, that competency is not yet Senior — see [the judgment doc](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility).
5. **Revisit quarterly.** The platforms and tools move; a band earned two years ago is not a band held today.
