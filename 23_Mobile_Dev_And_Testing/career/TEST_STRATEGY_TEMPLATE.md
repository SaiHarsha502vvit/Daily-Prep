# Mobile Test Strategy Template

> **Purpose**: a fill-in template for the test strategy of a mobile product (or a major feature area), to complete **before** writing the first test. It is the mobile counterpart of the web-side [Test Strategy Template](../../21_SDET_Playwright_Automation/career/TEST_STRATEGY_TEMPLATE.md), and differs where mobile differs: a shipped binary is hard to undo, every test is multiplied by a device matrix, and the dimensions that cause mobile bugs (lifecycle, permissions, network, fragmentation) don't exist on the web.
>
> **How to use it**: copy the template section into your own document, replace each `<!-- FILL IN -->`, and keep the italic *"why this section exists"* line above each section so a reviewer knows what to challenge. A filled worked example (a hypothetical banking app) follows the template. Each section names the module file that teaches the reasoning behind it.
>
> **The one rule that overrides the rest**: every number in this document should either come from your own data (analytics, incident history, measured test times) or be labeled as an assumption. A strategy full of unlabeled numbers is a wish list.

---

## Template

### 1. Executive Summary

*Why this section exists: so a stakeholder can decide in a minute whether to read on, and so the goals are stated before the tactics.*

**Product / initiative**: <!-- FILL IN -->

**Platforms**: <!-- FILL IN: Android / iOS / Flutter / both; minimum supported OS versions -->

**Primary quality goals** (measurable): <!-- FILL IN: e.g. "no crash-free-rate regression > X between releases", "no un-flagged migration ships without upgrade-path tests" -->

**Stakeholders**: <!-- FILL IN -->

**Effective date / review cadence**: <!-- FILL IN: and when this strategy is next re-reviewed (suggest quarterly) -->

---

### 2. Reversibility Profile

*Why this section exists: verification effort should scale with how far down the reversibility ladder your fastest available undo sits ([judgment doc §1](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility)). Fill this in first — it decides where the rest of the strategy spends its effort.*

| Rung | Does it exist today for this product? | Evidence |
| --- | --- | --- |
| 1. Remote flag / kill-switch | <!-- FILL IN: yes/no, and which features are covered --> | <!-- FILL IN: where it lives, who can flip it, how fast it propagates --> |
| 2. Staged rollout with halt | <!-- FILL IN --> | <!-- FILL IN: both stores? --> |
| 3. Server-side mitigation | <!-- FILL IN --> | <!-- FILL IN --> |
| 4. Hotfix via store review | Always, but slowest | <!-- FILL IN: your measured build-to-live time for the last hotfix --> |

**Changes in this scope with NO rung 1–3 undo** (list them; these get the heaviest verification): <!-- FILL IN: e.g. database migrations, launch-path changes, anything touching startup -->

---

### 3. Scope & Risk Register

*Why this section exists: scope is a list of decisions about what you will not test. Mobile risk lives in a specific set of dimensions ([test design](../07_Test_Design_And_Documentation.md#whats-genuinely-different-about-mobile--the-dimensions-web-testing-doesnt-have)); a risk register that doesn't walk them will miss the bugs that only mobile has.*

**In scope**: <!-- FILL IN -->

**Out of scope (with reason)**: <!-- FILL IN: each exclusion needs a reason, not just a list -->

| Feature area | Lifecycle | Permissions | Network | Fragmentation | Interruptions | Install/update | Blast radius | Reversible? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <!-- FILL IN: e.g. checkout --> | <!-- H/M/L or n/a --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- rung --> |

*Rate each cell for whether that dimension can change this area's behavior. Any H cell must map to at least one test in section 5.*

---

### 4. Device Matrix

*Why this section exists: the matrix is the largest multiplier in your cost ([infra at scale §1–2](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#2-choosing-the-device-matrix-from-data)). It should come from your users' data plus deliberate risk configs, not from the phones on the desk.*

**Data source and date**: <!-- FILL IN: analytics export and its date; revisit quarterly -->

| Rank | Config (device class / OS) | User share | Cumulative | In matrix? | Reason |
| --- | --- | --- | --- | --- | --- |
| <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- share-ranked / risk config (say which risk) --> |

**Risk configs added beyond share ranking** (each needs a named risk): oldest supported OS: <!-- FILL IN -->, lowest-RAM supported device: <!-- FILL IN -->, aggressive-background-killing OEM: <!-- FILL IN -->, tablet/foldable (if supported): <!-- FILL IN -->

---

### 5. Test Levels & Tier Placement

*Why this section exists: the senior question is not "should this be automated" but "what is the cheapest tier at which it still fails when the bug is present" ([judgment doc §3](../10_Senior_Mobile_Engineering_Judgment.md#3-automation-roi-when-every-test-is-multiplied-by-a-matrix)).*

| Test level | Tooling | Runs where | Approx. count | What it must catch |
| --- | --- | --- | --- | --- |
| Unit | <!-- FILL IN: JUnit / XCTest / Dart test --> | <!-- every commit, local --> | <!-- --> | <!-- logic --> |
| Integration / instrumented | <!-- FILL IN: Espresso / XCUITest / integration_test --> | <!-- --> | <!-- --> | <!-- --> |
| E2E | <!-- FILL IN: Appium / Mobilewright / other --> | <!-- --> | <!-- --> | <!-- critical journeys only --> |
| Hybrid / WebView | <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> |

| Tier | Trigger | Test scope | Device scope | Target wall-clock |
| --- | --- | --- | --- | --- |
| PR | <!-- every push --> | <!-- FILL IN --> | <!-- FILL IN: 1–2 configs --> | <!-- FILL IN --> |
| Nightly / merge | <!-- FILL IN --> | <!-- FILL IN --> | <!-- FILL IN: core matrix --> | <!-- FILL IN --> |
| Pre-release | <!-- before each store submission --> | <!-- FILL IN --> | <!-- FILL IN: core + risk configs, real devices --> | <!-- FILL IN --> |

**Tests deliberately left manual, and why** (hard "no": needs human judgment; soft "no": arithmetic doesn't clear break-even yet): <!-- FILL IN -->

---

### 6. Selectors, Testability & Tool Constraints

*Why this section exists: the framework decision decides what your test tooling can see — Flutter draws its own UI, so native-accessibility-tree tools can't find its widgets ([judgment doc §2](../10_Senior_Mobile_Engineering_Judgment.md#2-native-vs-cross-platform--deriving-the-decision-from-its-consequences)). Settle it before tests exist.*

**Selector standard** (testID / accessibility identifier / Flutter `Key` / semantics label): <!-- FILL IN -->

**Known tool gaps and the agreed workaround** (with an exit ramp): <!-- FILL IN: e.g. no built-in visual-regression assertion → failure-screenshot artifacts only until a real escaped regression justifies building one -->

**Cross-platform vs platform-specific tests**: <!-- FILL IN: shared test bodies by default; branch only where behavior genuinely differs -->

---

### 7. Flakiness & Gating Policy

*Why this section exists: at matrix scale, a final "passed after retries" status hides device-specific bugs ([infra at scale §6](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#6-flakiness-across-a-fragmented-matrix)). The gate must read per-(test, device) results.*

**Retries allowed**: <!-- FILL IN: count, and "recorded, never silent" -->

**A test is "flaky" when**: <!-- FILL IN: e.g. passes on retry across more than one config -->

**A failure is a "device-specific bug" when**: <!-- FILL IN: e.g. fails every attempt on exactly one config — filed as a product bug, never quarantined -->

**Quarantine rules and clock**: <!-- FILL IN: who, how long, escalation -->

**Infra-caused failures tracked separately from test failures**: <!-- FILL IN: how -->

---

### 8. Release Gate & Rollout Criteria

*Why this section exists: a go/no-go made on named evidence is defensible; one made on unease or a green dashboard is not ([judgment doc §6](../10_Senior_Mobile_Engineering_Judgment.md#6-the-release-gono-go-call)). The halt thresholds must be written before the rollout starts.*

**No-go conditions** (any one blocks): <!-- FILL IN: e.g. any deterministic (test, device) failure; any un-flagged irreversible change without upgrade-path tests -->

**Rollout plan and halt criteria**: see [RELEASE_AND_ROLLOUT_PLAYBOOK.md](RELEASE_AND_ROLLOUT_PLAYBOOK.md) — link this product's concrete stage table here: <!-- FILL IN -->

---

### 9. Cost Model

*Why this section exists: so the strategy can be defended when someone asks for the farm invoice ([infra at scale §7](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#7-the-cost-model)). Use variables and label every assumption — vendor prices change.*

| Variable | Value | Source or "assumption" |
| --- | --- | --- |
| Tests in the full suite | <!-- FILL IN --> | <!-- --> |
| Average minutes per test | <!-- FILL IN --> | <!-- measured --> |
| Configs per tier | <!-- FILL IN --> | <!-- section 4 --> |
| Runs per month per tier | <!-- FILL IN --> | <!-- --> |
| Price per device-minute | <!-- FILL IN --> | <!-- from your own quote --> |
| Setup minutes per shard | <!-- FILL IN --> | <!-- measured --> |
| Lab maintenance hours / month (if self-hosted) | <!-- FILL IN --> | <!-- don't leave blank --> |

**Estimated monthly cost per tier, and the tier that dominates**: <!-- FILL IN -->

---

### 10. Ownership, Metrics & Review

**Owners**: <!-- FILL IN: who maintains the matrix, the suite, the gate -->

**Metrics tracked** (suggested): crash-free rate per release and per segment; hang / ANR rate; escapes per release, each traced to a specific gap (missing config / missing test / retried-green); suite flake rate; infra-failure rate; device-minutes per tier.

**Re-review triggers**: new OS release, a production incident, a matrix-share shift, a framework change.

---

### 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Early signal |
| --- | --- | --- | --- | --- |
| <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |

---

## Worked Example — Hypothetical Banking App

*Everything below is invented for illustration (the app, its numbers and its analytics are fictional); the method is the point. It extends the Boss Battle in [infra at scale §10](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#10-challenges).*

**1. Summary.** Retail banking app on Android and iOS (Android 11+, iOS 16+). Goals: no deterministic (test, device) failure ships; no un-flagged payment-path change ships; crash-free rate on a new release never more than 0.3 points below the previous release's during rollout. Stakeholders: Payments Eng, Platform QA, Release Management, Compliance. Reviewed quarterly.

**2. Reversibility profile.**

| Rung | Exists? | Evidence |
| --- | --- | --- |
| 1. Flag / kill-switch | Partly | Remote flags cover transfers and bill-pay; **login and the launch path are not flagged** |
| 2. Staged rollout | Yes | Staged on Play; phased release on the App Store |
| 3. Server-side mitigation | Partly | Can disable the transfer endpoint; cannot change client-side validation |
| 4. Hotfix | Always | Last hotfix: 4 days build-to-live (assumption: from the incident log) |

*No rung 1–3 undo:* any change to the launch path, the local database schema (a migration is irreversible even after a halt), and login. These get the heaviest verification: upgrade-path tests from the three previous versions, plus the full pre-release device set.

**3. Risk register (excerpt).**

| Area | Lifecycle | Permissions | Network | Fragmentation | Interruptions | Install/update | Blast | Reversible? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Transfer funds | H (killed mid-submit) | L | H (drops mid-request) | M | M | L | High | Rung 1 |
| Biometric login | M | H (denied path) | L | H (sensor varies) | M | M | High | **None** |
| Statement download | M | M (storage) | H | M | L | L | Low | Rung 1 |

**4. Matrix (assumed analytics, nine configs ≈ 80% of users).** Share-ranked core of nine configs; plus risk configs: Android 11 (oldest supported), a 3 GB-RAM Android 13 device (memory pressure — the class of bug in [Android Ch10](../03_Android/10_Performance_Memory_And_ANR_Profiling.md) and [iOS Jetsam](../08_iOS_Performance_Memory_And_Instruments.md#7-jetsam--when-the-os-kills-you-for-using-too-much-memory)), iOS 16 (oldest supported).

**5. Tiers.** PR: ~60 smoke + changed-area tests on one Android managed-device emulator and one iOS simulator. Nightly: all 600 tests on the nine core configs (virtual devices). Pre-release: all 600 on the nine plus three risk configs, on real devices. Left manual: visual polish and screen-reader usability (hard "no": needs human judgment).

**6. Constraints.** Selectors: `testID` / accessibility identifier required on every interactive element from day one. Known gap: no built-in visual-regression assertion in the chosen native-automation tool → failure-screenshot artifacts only; revisit if a visual regression escapes to users.

**7. Gating.** Two retries recorded per (test, device). Flaky = passes on retry on more than one config. Device-specific bug = fails every attempt on exactly one config → filed as a product bug, never quarantined.

**8. Gate.** No-go on: any deterministic (test, device) failure; any change in the "no rung 1–3 undo" list without upgrade-path tests. Rollout: stage table from the playbook.

**9. Cost (assumptions, not quotes).** Suite = 600 × 25 s = 250 min. Nightly = 30 × 9 × 250 ≈ 67,500 device-minutes/month — the dominant term; pre-release ≈ 6,000 physical-device-minutes/month. First optimization if over budget: trim long-tail nightly configs or alternate nights, not pre-release. Self-hosted lab: **no** — with one SDET, the maintenance term outweighs the saving.

**10. Ownership.** SDET owns the matrix and gate; Platform Eng owns flags; Release Management owns the rollout; escapes reviewed monthly with each traced to a specific gap.
