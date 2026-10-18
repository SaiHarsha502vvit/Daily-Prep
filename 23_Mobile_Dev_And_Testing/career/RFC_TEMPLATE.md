# Mobile RFC Template

> **Purpose**: a template for proposing a significant mobile engineering or testing change — a tool migration, an architecture shift, a release-process change — in a form a skeptical reviewer can approve or reject on evidence. It mirrors the web-side [RFC template](../../21_SDET_Playwright_Automation/career/RFC_TEMPLATE.md) and adds the sections mobile decisions specifically need: **reversibility** (a shipped binary can't be recalled, so how do we undo this?), **exit criteria** (when do we stop?), and **test-strategy impact**.
>
> **Why every section exists**: the reasoning behind an RFC's structure is derived in [Ch66 §3–4](../../21_SDET_Playwright_Automation/08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) — each section removes one specific way a reviewer could reasonably say no, or one way the project could quietly fail after approval. The two mobile-specific sections follow the same rule and are explained where they appear.
>
> **How to use this file**: copy the template, fill it in, then compare it against the [filled example](#filled-example--pilot-mobilewright-alongside-appium) below. The example is **entirely fictional** — the organization, its numbers and its history are invented to show the method; only the technical statements about the tools are drawn from this module, and each cites where.

---

## Template

| Field | Value |
| --- | --- |
| **RFC ID** | RFC-YYYY-NNN |
| **Author(s)** | |
| **Date** | YYYY-MM-DD |
| **Status** | Draft / Proposed / Approved / Rejected / Superseded |
| **Stakeholders** | |
| **Reviewers** | |
| **Decision needed by** | <!-- FILL IN: and what happens if no decision is made --> |

### 1. Summary

*Expected outcome in one paragraph, with a number — so a reviewer knows what is being asked before reading further.*

<!-- FILL IN -->

### 2. Motivation

*Prove the problem is real and why it is now. Every figure either comes from your own data (cite where) or is labeled an assumption.*

- **Why now?** <!-- FILL IN: the event or deadline that makes this timely -->
- **What problem, with data?** <!-- FILL IN: failure rates, hours lost, escapes, cost -->
- **Cause breakdown** (if you know it): <!-- FILL IN: what fraction of the pain each cause accounts for — a proposal that fixes a cause responsible for 5% of the pain won't move the headline number -->
- **Who is affected?** <!-- FILL IN -->

### 3. Proposal

*Concrete enough that someone else could start from this document alone.*

- **Detailed change:** <!-- FILL IN -->
- **In scope:** <!-- FILL IN -->
- **Out of scope (with reasons):** <!-- FILL IN -->
- **Dependencies / prerequisites:** <!-- FILL IN -->

### 4. Alternatives Considered

*Include "do nothing and fix what we have" as a real option — it is the one a reviewer will raise first. Each rejection needs a specific, falsifiable reason, and each alternative should be one a reasonable engineer would actually consider.*

| Alternative | Cost now | Why not (or why partly) |
| --- | --- | --- |
| Status quo + targeted fixes | <!-- FILL IN --> | <!-- FILL IN --> |
| <!-- FILL IN --> | | |
| <!-- FILL IN --> | | |

### 5. Honest Weaknesses of the Proposal

*State the downsides before a reviewer finds them — it is what makes the positive claims credible. Include known gaps in the tools you are proposing, as documented, not as hoped.*

<!-- FILL IN -->

### 6. Impact

| Team | Impact (H/M/L) | Action required | Owner |
| --- | --- | --- | --- |
| <!-- FILL IN --> | | | |

### 7. Reversibility & Exit Criteria *(mobile-specific)*

*Why this section exists: on mobile, a mistake that ships can't be recalled ([judgment doc §1](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility)), and tooling decisions can be just as sticky as code. State how this is undone, and — separately — the conditions under which you will stop **before** you are emotionally invested.*

- **How is this undone if it goes wrong?** (name the cheapest working rung or mechanism): <!-- FILL IN -->
- **Is anything here irreversible?** (migrations, store submissions, deleted infrastructure): <!-- FILL IN -->
- **Stop conditions** (specific, measurable, written now): <!-- FILL IN: "we stop and write up if X by date Y" -->
- **Cost of stopping at each phase:** <!-- FILL IN: sunk cost should be small at the early phases by design -->

### 8. Test-Strategy & Release Impact *(mobile-specific)*

*Why this section exists: changes that look purely technical often change what the tests can see, what the matrix costs, or how releases are gated ([test strategy template](TEST_STRATEGY_TEMPLATE.md), [release playbook](RELEASE_AND_ROLLOUT_PLAYBOOK.md)).*

- **What can the tests see or no longer see?** <!-- FILL IN -->
- **Device-matrix / CI cost change** (use variables, label assumptions): <!-- FILL IN -->
- **Release gate or rollout change:** <!-- FILL IN -->

### 9. Rollout Plan

| Phase | Timeline | Deliverables | Owner | Success signal | **Decision gate?** |
| --- | --- | --- | --- | --- | --- |
| <!-- FILL IN --> | | | | | |

*A decision gate is a point where the plan is allowed to end. At least one should exist before any irreversible commitment.*

### 10. Success Criteria

*Pre-committed and measured, so "success" can't become whatever the loudest voice says afterward. Each needs a baseline, a target, a measurement method, and the period.*

| Metric | Baseline | Target | How measured | Window |
| --- | --- | --- | --- | --- |
| <!-- FILL IN --> | | | | |

### 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Early signal |
| --- | --- | --- | --- | --- |
| <!-- FILL IN --> | | | | |

### 12. Decision Record

*Filled in after review: the decision, the date, and which objections changed the plan — so a future reader knows why it is the way it is.*

<!-- FILL IN -->

---

## Filled Example — Pilot Mobilewright Alongside Appium

> ⚠️ **Fictional scenario.** The organization, the numbers and the incident history below are invented for illustration. Technical statements about Mobilewright and Appium are drawn from this module and cited. Everything marked *(assumption)* would, in a real RFC, be replaced by your own measured data.

| Field | Value |
| --- | --- |
| **RFC ID** | RFC-2026-014 |
| **Author(s)** | Mobile SDET lead |
| **Date** | 2026-10-18 |
| **Status** | Proposed |
| **Stakeholders** | Mobile SDETs, Android and iOS app teams, Platform Infra, Release Management |
| **Reviewers** | Mobile Eng Manager, one Android and one iOS tech lead, Platform Infra |
| **Decision needed by** | 2026-11-06 — the next-quarter roadmap locks then; if undecided, the three new screens ship with Appium tests by default |

### 1. Summary

Add Mobilewright as a **second automation framework for new tests on fully-native screens only**, run in parallel with the existing 420-test Appium suite, for a four-week pilot with a hard decision gate. The aim is to learn — with measurements, on real screens — whether its auto-waiting and locator model cut the timing-related share of our flakiness, at a pilot cost of roughly three engineer-weeks and no change to the existing suite. We are **not** proposing to migrate the Appium suite.

### 2. Motivation

- **Why now?** Three new native screens (Insights, Goals, Card Controls) enter development next quarter, so there is a natural place to try a new tool with **zero migration cost**: they have no existing tests to port.
- **What problem, with data?** *(all assumptions, from last quarter's triage log)* 9% of CI runs need at least one rerun; the team spends about 35 engineer-hours a week triaging UI-test failures.
- **Cause breakdown** *(assumption, from the triage log)*: 58% timing / explicit-wait problems, 22% `StaleElementReferenceException`, 12% environment, 8% real product bugs. **This breakdown matters more than the headline number:** a tool can only help with the causes it addresses. Mobilewright's four-check auto-waiting addresses the timing class and its locators re-resolve rather than hold stale references (see [06](../06_Mobilewright_Native_Testing.md#auto-waiting--four-checks-every-action) and [DOC_09's stale-reference section](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md#3-staleelementreferenceexception)) — the 80% of failures in the first two classes are the *addressable* share, an upper bound, not a forecast. Environment failures (12%) and real bugs (8%) are untouched by any framework choice.
- **Who is affected?** The two mobile SDETs most; Android and iOS developers slightly (test identifiers).

### 3. Proposal

- **Detailed change:** a new `mobilewright/` package in the test repository with a `projects` array for `android` and `ios` ([Mobilewright L6](../Mobilewright_TypeScript/Level_06_Multi_Platform_Project_Config.md)); CI jobs per [the capstone shape](../Mobilewright_TypeScript/Level_13_Capstone_Cross_Platform_CI_Pipeline.md) (Android on a Linux runner with an emulator, iOS on a macOS runner — separate jobs, because the platforms need different runner OS). Tests written against `testID`-first locators ([L2](../Mobilewright_TypeScript/Level_02_Cross_Platform_Locators.md)). Shared login handled by a plain helper — Mobilewright documents no `test.extend()`-style fixture API ([L8](../Mobilewright_TypeScript/Level_08_The_Fixture_Gap.md)).
- **In scope:** tests for Insights, Goals, Card Controls on both platforms; a measured comparison against comparable Appium tests.
- **Out of scope, with reasons:** migrating existing Appium tests (the ecosystem-maturity risk isn't worth taking before we have data); any Flutter-built screens (this module has not verified Mobilewright against Flutter apps, whose widgets are invisible to native-accessibility-tree tools — [judgment doc §2](../10_Senior_Mobile_Engineering_Judgment.md#2-native-vs-cross-platform--deriving-the-decision-from-its-consequences)); WebView screens (existing approach unchanged).
- **Dependencies:** a macOS CI runner quota for iOS; app teams to expose `testID` / accessibility identifiers on the three new screens (already our standard).

### 4. Alternatives Considered

| Alternative | Cost now | Why not (or why partly) |
| --- | --- | --- |
| **Status quo + targeted Appium fixes** (replace sleeps with explicit waits, add retry-on-stale helpers) | Low — about 1–2 engineer-weeks | **Partly adopted: we do this anyway** and measure it as the control. It can fix the *known* waits but each new test still needs correct waits written by hand; the pilot tests whether removing the need is worth a second tool |
| **Native-only (Espresso + XCUITest)** | Medium-high — two codebases, two skill sets | Likely the fastest and most stable within each platform, but doubles authoring and loses the shared test body across platforms; revisit if the pilot fails |
| **Full migration to Mobilewright now** | High — port 420 tests | Rejected: this module's own comparison notes Appium's larger ecosystem and that a newer framework carries real switching risk where a team has deep Appium expertise and CI ([06](../06_Mobilewright_Native_Testing.md#deciding-between-mobilewright-appium-and-playwright-for-web)); we haven't measured our own benefit yet |
| **Pilot Mobilewright on new native screens (chosen)** | Low — ~3 engineer-weeks | Additive, removable, produces our own data |

### 5. Honest Weaknesses of the Proposal

- **Documented tool gaps** (all from this module's verified track): no custom-fixture API → shared setup is plain helpers; no built-in screenshot-comparison assertion → failure screenshots only ([L9](../Mobilewright_TypeScript/Level_09_Screenshots_and_Missing_Visual_Regression.md)); iOS can't run inside a Linux container → iOS tests need macOS runners, which cost more ([L12](../Mobilewright_TypeScript/Level_12_Docker_Cloud_Devices_and_Troubleshooting.md)).
- **Two frameworks, one team:** we pay a context-switching and maintenance cost for the duration of the pilot, and permanently if we keep both.
- **Unverified for our UI toolkits:** whether the identifiers on our Compose and SwiftUI screens appear in the accessibility tree as the locators expect is something we have **not** established. Phase 0 exists to find out.
- **The pilot cannot prove migration is wise.** Four weeks on three new screens says nothing about 420 existing tests with their own quirks.

### 6. Impact

| Team | Impact | Action required | Owner |
| --- | --- | --- | --- |
| Mobile SDETs (2) | High | Learn Mobilewright; write the pilot tests; own the comparison | SDET lead |
| Android / iOS app teams | Low | Confirm identifiers on the three new screens | Tech leads |
| Platform Infra | Medium | macOS runner quota; Android emulator job | Infra lead |
| Release Management | None | — | — |

### 7. Reversibility & Exit Criteria

- **Undo:** the pilot is purely additive. Reversal = delete the `mobilewright/` package and its CI jobs. Nothing in the app binary, the Appium suite or the release gate changes.
- **Irreversible elements:** none. (The macOS runner quota can be released.)
- **Stop conditions, written now:** (a) if Phase 0 shows identifiers missing from the accessibility tree on more than one of the three screens, stop and write up; (b) if more than 20% of pilot tests need a coordinate-based tap or the last-resort `getByType` locator ([L2](../Mobilewright_TypeScript/Level_02_Cross_Platform_Locators.md)) to work around missing identifiers, stop; (c) if iOS CI cost exceeds the budgeted figure by 50%, stop and re-plan.
- **Cost of stopping:** Phase 0 costs about three engineer-days; the whole pilot about three engineer-weeks. By design, no phase before the decision gate commits us to anything.

### 8. Test-Strategy & Release Impact

- **What can the tests see?** Native screens' accessibility tree — the same class of visibility as Appium's native drivers. We explicitly don't touch Flutter or WebView screens.
- **CI cost change** *(assumptions)*: iOS pilot runs add macOS-runner minutes. Using the variables from [infra at scale §7](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md#7-the-cost-model): pilot tests ≈ 40 (assumption) × ~30 s ≈ 20 minutes per run × 2 platforms × ~25 PR runs/day ≈ 1,000 extra runner-minutes/day, placed in the **PR tier** with one config per platform (the cheapest tier at which these tests still fail when their bug is present — [judgment doc §3](../10_Senior_Mobile_Engineering_Judgment.md#3-automation-roi-when-every-test-is-multiplied-by-a-matrix)).
- **Release gate:** unchanged. Pilot results are informational and do not gate releases until after the decision.

### 9. Rollout Plan

| Phase | Timeline | Deliverables | Owner | Success signal | Decision gate? |
| --- | --- | --- | --- | --- | --- |
| 0 — Spike | Week 1 | One test per screen per platform proving locators resolve; CI jobs green | SDET lead | Identifiers visible on ≥2 of 3 screens | **Yes** — stop condition (a) |
| 1 — Pilot | Weeks 2–4 | ~40 tests across three screens, both platforms, with failure screenshots | SDETs | Tests merged; flake data collecting | Interim review end of week 3 |
| 2 — Evaluate | Week 5 | Written comparison against the measured Appium control | SDET lead | Success criteria table filled with real numbers | **Yes** — the main gate |
| 3 — Decide | Week 6 | Decision record: adopt for new native screens / extend / stop | Eng Manager | Recorded decision | — |

### 10. Success Criteria

| Metric | Baseline | Target | How measured | Window |
| --- | --- | --- | --- | --- |
| Flaky-run rate of pilot tests | Appium control tests on comparable screens | Meaningfully lower (agree the margin before Phase 1) | Reruns needed ÷ runs, same CI | Weeks 2–5 |
| Time to author a stable test | Appium authoring time on the control screens | No worse | SDET time log | Weeks 2–5 |
| Workaround count | — | ≤ 2 shared helpers; <20% of tests using fallback locators | Code review of the pilot package | End of pilot |
| iOS CI cost | Budget | Within 50% of budget | Runner-minute report | Weeks 2–5 |

*Why the margin is agreed in advance:* a target chosen after seeing the data is a conclusion, not a criterion.

### 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Early signal |
| --- | --- | --- | --- | --- |
| Identifiers aren't exposed on Compose/SwiftUI screens as expected | Medium | High | Phase 0 spike before any pilot work | Locators fail to resolve in Week 1 |
| Pilot looks good only because the new screens are simple | Medium | Medium | Include the most complex of the three (Card Controls) and compare against Appium tests of comparable complexity | Pilot tests are all single-screen smoke checks |
| The team ends up maintaining two frameworks indefinitely | Medium | Medium | The decision gate must choose adopt-for-new-screens or stop; "keep both at status-quo" is explicitly not an outcome | No decision recorded by Week 6 |
| Framework gaps bite later (no fixtures, no visual assertion) | Low–Medium | Low | Already planned for with helpers; revisit only if a real escape justifies more | Helper count growing past 2 |

### 12. Decision Record

*(To be completed after review — in a real RFC, the date, the decision, and the objections that changed the plan.)*

---

## What to Notice in the Example

1. **The cause breakdown does the heavy lifting.** The proposal's honest upper bound (80% of failures addressable) comes from a table, not an opinion — and it names what the tool *cannot* help with.
2. **"Do nothing and fix what we have" is partly adopted.** It becomes the control group, which makes the pilot's numbers meaningful instead of self-congratulatory.
3. **The weaknesses section uses only documented gaps** and one explicit unknown ("we have not established this — Phase 0 finds out"). Pre-empting the reviewer's best objections is the whole job of that section.
4. **The decision gate comes before anything is hard to undo,** and the stop conditions are written while no one is invested in the outcome.
5. **The scope line leaves out a thing the module has not verified** (Flutter) instead of implying it is covered.
