# Senior Mobile SDET Readiness Rubric

> **Purpose**: maps the 12 competency areas of a senior-and-beyond mobile SDET (mobile app test automation and quality ownership), building on what this module teaches. Use it for self-assessment, growth tracking with a manager, and deciding what to practice next. It mirrors the structure of the web-side [Principal SDET rubric](../../21_SDET_Playwright_Automation/career/READINESS_RUBRIC.md) but is written for mobile, and is one of two ladders — see [README.md](README.md) for how they relate. Rows 10, 11 and 12 are shared with the [SWE ladder](READINESS_RUBRIC_SWE.md).

---

## How to Use This Rubric

1. **Self-assess honestly.** For each competency, choose the band that describes you *today*, not the one you aspire to.
2. **Gather evidence.** For each band you claim, point to a concrete artifact, system or behavior — the Evidence column gives the kind of thing that counts. No evidence, no band.
3. **Find the gap.** Competencies where you sit one band below your target are your growth areas.
4. **Pick two or three per quarter** and tie each to a deliverable, using the action-plan template at the end.
5. **Calibrate externally.** People over-rate themselves at Senior; ask a mentor or manager to check the evidence, not the confidence.

The three rows marked ⇄ (**Code Review Calibration**, **Mentoring & Leadership**, **Cost Governance**) are worded identically in both ladders on purpose — see [README.md](README.md#the-shared-rows). If you edit one, edit [READINESS_RUBRIC_SWE.md](READINESS_RUBRIC_SWE.md) to match.

---

## Competency Areas

### 1. Native Automation Fundamentals

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Writes basic UI tests by copying existing ones; locators are brittle and waits are sleeps. | Tests that pass only on the author's emulator |
| **Mid** | Writes reliable tests in one framework (Espresso, XCUITest, Appium or Mobilewright) with stable selectors and framework-native waiting. | A feature's UI tests that survive a UI refresh unchanged |
| **Senior** | Fluent across the stack and chooses deliberately between them — what each can and cannot see (native accessibility tree vs Flutter semantics vs WebView), locator priority, auto-waiting checks — and recognizes a documented framework gap rather than fighting it. | A decision note explaining why a tool was chosen for one screen type and not another |
| **Staff** | Defines framework standards across teams; contributes upstream or maintains internal wrappers. | Org-wide wrapper library; upstream fixes |
| **Principal** | Their approach to native automation is used beyond the organization. | Public frameworks or talks widely referenced |

---

### 2. Cross-Platform Test Architecture

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Duplicates each test per platform; selectors inline. | Near-identical iOS and Android test files |
| **Mid** | Page objects with shared logic; platform differences isolated in small branches. | One shared test body running on both platforms |
| **Senior** | Designs the shared-versus-platform-specific split deliberately, works around missing framework features (e.g. no custom-fixture API) with reversible helpers, and keeps test code portable. | Helpers with a documented exit ramp for when the framework adds the feature |
| **Staff** | Architects the test platform for several apps and teams; decides when to standardize and when to let teams diverge. | Shared test framework adopted by multiple apps with a migration path |
| **Principal** | Architecture patterns adopted industry-wide. | Published, widely reused patterns |

---

### 3. Mobile Test Design

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Tests the happy path from the requirements text. | Scenarios derived from one acceptance criterion |
| **Mid** | Applies equivalence partitioning, boundaries and decision tables; covers granted and denied permission paths. | Scenario sets with explicit partitions and boundaries |
| **Senior** | Systematically covers the mobile-only dimensions — lifecycle (background/kill/restore), permissions, network conditions, fragmentation, interruptions, install/update — and asks of every feature which of them affect it. | A feature's scenario set that includes lifecycle, permission-denial and upgrade-path cases found before release |
| **Staff** | Defines test-design standards and review for several teams; trains developers to ask the mobile-dimension questions at design time. | Mobile-dimension checklist embedded in refinement; fewer lifecycle bugs escaping |
| **Principal** | Advances how the industry designs mobile tests. | Published methodology |

---

### 4. Device Matrix & Fragmentation Strategy

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Tests on whatever devices are on the desk. | Matrix equals the team's phones |
| **Mid** | Knows which OS versions and screen sizes the product supports and tests across a few. | A documented list of supported configs |
| **Senior** | Builds the matrix from data — rank by the product's own user share, cut where marginal coverage flattens, then add a few configs for risk (oldest OS, lowest RAM, aggressive-process-killing OEM) — and revisits it as users upgrade. | A matrix with a coverage curve and written reasons for each risk config; reviewed quarterly |
| **Staff** | Owns matrix policy across apps and ties it to analytics and incident history. | Matrix changes driven by production-incident segmentation |
| **Principal** | Defines matrix practice for the industry. | Published methodology |

---

### 5. CI/CD & Device Infrastructure

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Runs tests locally; reads CI logs. | Manual runs only |
| **Mid** | Configures mobile test jobs in CI with an emulator or simulator and uploads artifacts. | A working pipeline with failure screenshots/logs attached |
| **Senior** | Designs tiered pipelines (PR / nightly / pre-release), understands how sharding really assigns tests on each platform (hash vs count vs duration vs class) and fixes the resulting imbalance, and chooses between emulator, managed devices, a device lab and a cloud farm. | Shard imbalance diagnosed from the assignment mechanism and fixed; tier definitions with run frequency and device scope |
| **Staff** | Owns the device-infrastructure platform for several teams: capacity, reliability, observability. | Infra-caused failure rate tracked separately from test failures and driven down |
| **Principal** | Industry-level contributions to mobile test infrastructure. | Open-source infra tooling widely used |

---

### 6. Flakiness Diagnosis at Matrix Scale

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Reruns until green. | Retries added to make failures disappear |
| **Mid** | Identifies common causes (waits, shared state, network) and fixes them one test at a time. | Fixed several flaky tests with a stated cause each |
| **Senior** | Reads results per (test, device) rather than as a final status — distinguishing a flaky test (passes on retry across configs) from a deterministic device-specific bug (fails every attempt on one config) — and refuses to quarantine the latter. | A device-specific crash filed as a product bug after retries had hidden it; attempts-to-pass tracked per pair |
| **Staff** | Builds flake-rate tracking, quarantine policy and escalation across suites with an error-budget style rule. | Org-wide flake dashboard and a policy that is actually enforced |
| **Principal** | Advances how the industry measures and reduces mobile test flakiness. | Published research or tooling |

---

### 7. Automation ROI & Tier Placement

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Automates what is asked; cannot say what it will cost to maintain. | Large suites with no owner or cost view |
| **Mid** | Prioritizes by risk and knows some checks should stay manual. | A backlog ordered by risk with some items explicitly left manual |
| **Senior** | Decides *where* each test should run, not just whether to automate it — the cheapest tier at which it still fails when the bug is present — and accounts for the multiplier a device matrix puts on every test. | Tests re-tiered with a written reason; device-minutes down with detection unchanged |
| **Staff** | Sets automation strategy across products: what the portfolio automates, at which tier, and what the budget allows. | A portfolio strategy that explains what is deliberately not automated |
| **Principal** | Defines automation-economics practice for the industry. | Published model adopted by others |

---

### 8. Release Gating & Go/No-Go

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Reports test status when asked. | "Tests passed" as the whole message |
| **Mid** | Gives a clear pass/fail summary with the known risks listed. | Release notes with named open risks |
| **Senior** | Makes the call on named evidence — per-device results, reversibility of the riskiest change, blast radius — and is willing to say no-go with a defensible reason. Writes halt criteria for the staged rollout before it starts. | A no-go justified by a named deterministic failure and a named irreversible risk; halt thresholds written in advance |
| **Staff** | Owns release-gate policy across apps and tunes it with escape and rollback data. | Gate criteria revised from measured escapes |
| **Principal** | Defines release-quality practice for the industry. | Published gate models adopted elsewhere |

---

### 9. Production Signal & Crash Triage

| Band | Description | Evidence Examples |
| --- | --- | --- |
| **Junior** | Looks at crashes only when asked; sees every crash as the same kind of problem. | Crash reports closed as unactionable |
| **Mid** | Reads crash dashboards and files bugs with reproduction steps. | Reproducible bug reports from production crashes |
| **Senior** | Distinguishes crash classes (ANR, watchdog termination, leak/OOM, hang) and starts from the right tool; segments production crashes along the matrix axes and feeds each escape back into the right test tier or matrix config. | Each escape traced to a specific missing config, missing test or retried-green failure, with the fix landed |
| **Staff** | Builds the feedback loop at scale: production signals drive matrix and test changes automatically or on a fixed cadence. | Crash-segment data driving matrix reviews every quarter |
| **Principal** | Advances how the industry connects production signals to test strategy. | Published practice or tooling |

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
| 1. Native Automation Fundamentals | [Playwright vs Appium](../01_Playwright_vs_Appium_Full_Comparison.md), [Mobilewright reference](../06_Mobilewright_Native_Testing.md), [Mobilewright track L1–4](../Mobilewright_TypeScript/Level_01_Setup_and_First_Native_Test.md), [Android Ch08](../03_Android/08_Instrumented_And_UI_Tests.md), [iOS XCUITest](../03_iOS_Native_Dev_And_Testing.md), [Flutter testing](../04_Flutter_Dev_And_Testing.md) | Real |
| 2. Cross-Platform Test Architecture | [Mobilewright L6 multi-platform config](../Mobilewright_TypeScript/Level_06_Multi_Platform_Project_Config.md), [L8 fixture gap](../Mobilewright_TypeScript/Level_08_The_Fixture_Gap.md), [Playwright track L6 POM](../Playwright_Mobile_TypeScript/Level_06_Page_Object_Model.md) | Real |
| 3. Mobile Test Design | [Test design & documentation](../07_Test_Design_And_Documentation.md) | Real |
| 4. Device Matrix & Fragmentation | [Infra at scale §2](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#2-choosing-the-device-matrix-from-data) | Real |
| 5. CI/CD & Device Infrastructure | [Infra at scale §3–5, §8](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#3-the-four-places-a-mobile-test-can-run), [Mobilewright L7, L12, L13](../Mobilewright_TypeScript/Level_13_Capstone_Cross_Platform_CI_Pipeline.md), [Playwright L13](../Playwright_Mobile_TypeScript/Level_13_Capstone_CICD_Pipeline.md) | Real |
| 6. Flakiness Diagnosis at Matrix Scale | [Infra at scale §6](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#6-flakiness-across-a-fragmented-matrix), [Playwright L12](../Playwright_Mobile_TypeScript/Level_12_Debugging_Flaky_Tests.md) | Real |
| 7. Automation ROI & Tier Placement | [Judgment doc §3–4](../10_Senior_Mobile_Engineering_Judgment.md#3-automation-roi-when-every-test-is-multiplied-by-a-matrix), [Mobilewright L9 visual-regression gap](../Mobilewright_TypeScript/Level_09_Screenshots_and_Missing_Visual_Regression.md) | Real |
| 8. Release Gating & Go/No-Go | [Judgment doc §6](../10_Senior_Mobile_Engineering_Judgment.md#6-the-release-gono-go-call) | Real (reasoning); **a release-and-rollout playbook and a mobile test-strategy template are planned** |
| 9. Production Signal & Crash Triage | [Android Ch10](../03_Android/10_Performance_Memory_And_ANR_Profiling.md), [iOS performance](../08_iOS_Performance_Memory_And_Instruments.md), [DOC_09](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md), [Judgment doc §5](../10_Senior_Mobile_Engineering_Judgment.md#5-incident-command-for-a-crash-spike-across-a-fragmented-matrix) | Real |
| 10. Code Review Calibration ⇄ | [Judgment doc §7](../10_Senior_Mobile_Engineering_Judgment.md#7-review-calibration--what-to-block-on); test-code dimensions live in the web-side [code review rubric](../../21_SDET_Playwright_Automation/career/CODE_REVIEW_RUBRIC.md) | Partly real; app-code rubric planned |
| 11. Mentoring & Leadership ⇄ | No dedicated material | Thin — practice by teaching a flakiness diagnosis to a colleague |
| 12. Cost Governance ⇄ | [Infra at scale §7](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#7-the-cost-model) | Real |

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
