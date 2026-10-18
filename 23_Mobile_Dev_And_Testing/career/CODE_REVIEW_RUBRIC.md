# Code Review Rubric for Mobile App Code

> **Purpose**: calibrate how mobile **application** code (Kotlin/Java, Swift, Dart/Flutter) is reviewed, so reviewers block on what actually hurts users and comment on the rest. This is the mobile counterpart of the web-side [Code Review Rubric for Test Automation PRs](../../21_SDET_Playwright_Automation/career/CODE_REVIEW_RUBRIC.md), which remains the reference for reviewing **test code** — this file deliberately does not re-derive those dimensions.
>
> **The calibration rule** (derived in [judgment doc §7](../10_Senior_Mobile_Engineering_Judgment.md#7-review-calibration--what-to-block-on)): ask of every finding — *is the failure invisible in development but guaranteed at scale, and does it have a cheap undo after shipping?* **Invisible in dev + certain at scale + no cheap undo = Blocker.** Taste is a Nit. Everything else sits in between. Every Blocker and Major comment must state the failure mechanism ("this passes on your fast device and ANRs on a budget one"), not just the rule.
>
> This is the practice artifact for the shared **Code Review Calibration** competency in both [readiness rubrics](README.md).

---

## Severity Levels

| Severity | Meaning | Merge rule |
| --- | --- | --- |
| **Blocker** | Will fail for real users at scale, is invisible on a developer device, and has no cheap undo once shipped | Must be fixed before merge |
| **Major** | Likely to cause user-visible or maintenance harm; fix is clear and small | Fix before merge unless the author gives a reason the reviewer accepts |
| **Minor** | Worth improving; harm is limited or conditional | Author's call; track if deferred |
| **Nit** | Style, naming, preference | Never blocks; say "nit:" so it isn't mistaken for a requirement |

---

## Review Dimensions

### 1. Threading & Responsiveness

*Why it's first: an ANR or hang is a crash the user experiences as a frozen screen, and it only shows on slow devices ([Android Ch10 §2](../03_Android/10_Performance_Memory_And_ANR_Profiling.md#2-anr-fundamentals--the-watchdog-and-the-main-thread), [iOS §2](../08_iOS_Performance_Memory_And_Instruments.md#2-ioss-anr-equivalent--watchdog-terminations-and-hang-rate)).*

| Severity | Criteria |
| --- | --- |
| **Blocker** | Disk, database or network I/O on the main thread; unbounded CPU-bound work on the main thread (large parse/decode, per-item loops that scale with data); blocking lock acquisition or `runBlocking` on the main thread; work added to the launch path that grows with user data |
| **Major** | Work moved off the main thread but onto the wrong dispatcher/queue (blocking I/O on a compute pool); results applied to UI without hopping back; missing cancellation so work outlives the screen |
| **Minor** | Off-main-thread work that could be batched or debounced |
| **Nit** | Dispatcher/queue naming conventions |

**Questions to ask:** What happens to this call with a 2 MB response, 10,000 rows, or a slow network? Does anything on the launch path grow with the user's data? Would StrictMode (Android) or the Time Profiler (iOS) flag it?

**Confirm with:** StrictMode in debug builds; Time Profiler / Android Studio CPU profiler on a low-end device.

### 2. Memory & Lifecycle

*Leaks and retain cycles are invisible until a session runs long on a low-RAM device ([Android Ch10 §4, §8](../03_Android/10_Performance_Memory_And_ANR_Profiling.md#4-memory-fundamentals--heap-gc-and-what-leak-actually-means), [iOS §6](../08_iOS_Performance_Memory_And_Instruments.md#6-reading-a-retain-cycle-at-the-tooling-level)).*

| Severity | Criteria |
| --- | --- |
| **Blocker** | A long-lived object (singleton, static, application-scoped holder) retaining an Activity, Fragment, View or Context; a closure stored on `self` that captures `self` strongly; a delegate that should be weak held strongly; listeners/observers/subscriptions registered and never removed; Flutter controllers, streams or timers created without a matching dispose |
| **Major** | Large objects (bitmaps, decoded images, big lists) cached with no eviction or no response to memory warnings; resources created inside `build()` that should be created once ([DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#resources-created-inside-build)) |
| **Minor** | Over-broad scope for a short-lived object |
| **Nit** | Placement of `weak`/`unowned` where it's already correct |

**Questions to ask:** Who holds a reference to this, and does that holder outlive the screen? If I open and close this screen ten times, does anything remain? On `[weak self]`: is the closure *meant* to keep the object alive? (Not every capture should be weak — see [iOS §6](../08_iOS_Performance_Memory_And_Instruments.md#6-reading-a-retain-cycle-at-the-tooling-level).)

**Confirm with:** LeakCanary; Instruments Allocations generation comparison; Memory Graph Debugger.

### 3. State, Architecture & UI Efficiency

| Severity | Criteria |
| --- | --- |
| **Blocker** | State that doesn't survive the process death / configuration change the feature visibly depends on (a half-completed form or purchase silently lost); `context` used after an `await` with no guard in Flutter ([DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#the-async-gap--stale-buildcontext)) |
| **Major** | Layer violations (UI importing the data layer; domain depending on a concrete SDK — [DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#layer-violations-in-clean-architecture)); missing `Key`s on dynamic, reorderable lists ([DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#missing-keys-in-dynamic-lists)); unstable Compose parameters or raw fast-changing state read in a composable body when `derivedStateOf` is needed ([Ch10 §9](../03_Android/10_Performance_Memory_And_ANR_Profiling.md#9-compose-specific-performance-pitfalls)); optimistic UI with no failure path ([DOC_08](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#optimistic-ui-with-no-rollback-path)) |
| **Minor** | A very large widget/composable/view that could be split; duplicated mapping logic |
| **Nit** | File organization, naming |

**Questions to ask:** What does the user see if the process is killed right here and restored? What happens when this fails? Does this recompose/rebuild far more than the thing that changed?

**Confirm with:** Compose compiler metrics; the framework's performance overlay / DevTools; killing the process via ADB and restoring.

### 4. Persistence & Migration Safety

*A migration has no undo after rollout — even a halted rollout leaves migrated devices behind ([judgment doc §1](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility)).*

| Severity | Criteria |
| --- | --- |
| **Blocker** | A schema change with no migration; a migration with no test from prior versions and from fresh install; destructive migration or fallback that wipes user data silently; a change to stored data format with no upgrade path |
| **Major** | A migration tested only from the immediately previous version when users can be several versions behind; reading preferences/storage on the main thread ([Room & DataStore §8](../03_Android/05_Room_Database_And_DataStore.md#8-database-migrations--the-critical-qa-scenario)); no handling of a corrupted or missing store |
| **Minor** | Missing indexes for obvious queries |
| **Nit** | Naming of columns/keys |

**Questions to ask:** Which app versions can reach this code, and has the migration run from each? What does a fresh install do? What is the undo if this is wrong — and if the honest answer is "none," is this the *only* risky change in the release?

### 5. Release Safety & Reversibility

*Reviewing for how a change can be undone, not just whether it works ([release playbook §7](RELEASE_AND_ROLLOUT_PLAYBOOK.md#7-flags-and-kill-switches)).*

| Severity | Criteria |
| --- | --- |
| **Blocker** | A money-movement or login change with no flag/kill-switch where one is feasible; a flag whose unreachable-service behavior is undefined (crashes or fails open); a new SDK initialized on the launch path with no flag and no measured launch cost; a risky change bundled with an un-flaggable one (a migration) in the same release without justification |
| **Major** | A flag with no owner or removal date; a new permission, data collection, or third-party SDK added without the store-disclosure implications being noted in the PR ([pre-launch checklist](../Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_27_Project_ChatApp.md#pre-launch-checklist--the-shipping-gate)); only one flag state exercised by tests |
| **Minor** | Flag naming; stale TODOs |
| **Nit** | Comment wording |

**Questions to ask:** If this is wrong, what is my fastest undo, and does it already exist in the binary I'm about to ship? What does the app do when the flag service is down? Does this PR change what the store requires me to disclose?

### 6. Testability

| Severity | Criteria |
| --- | --- |
| **Blocker** | Critical logic that can only be exercised through the UI on a device (no seam for a fake or a unit test) in a high-blast-radius area |
| **Major** | New interactive elements with no stable test selector (accessibility identifier / `testID` / Flutter `Key`) — retrofitting later is painful and, for Flutter, determines whether native-tree tools can see the element at all ([04_Flutter](../04_Flutter_Dev_And_Testing.md)); hard-wired time, randomness or network that makes tests non-deterministic; new behavior with no test at the level that would catch its likely bug |
| **Minor** | Tests that duplicate coverage at a more expensive tier than needed ([judgment doc §3](../10_Senior_Mobile_Engineering_Judgment.md#3-automation-roi-when-every-test-is-multiplied-by-a-matrix)) |
| **Nit** | Test naming (test-code detail is covered by the [web-side rubric](../../21_SDET_Playwright_Automation/career/CODE_REVIEW_RUBRIC.md)) |

**Questions to ask:** How would I test this without a device? Will the SDET be able to find this element? Which tier is the cheapest at which a test for this still fails when the bug is present?

### 7. Privacy & Security Hygiene

*Kept to well-established principles; a dedicated security review is a different process.*

| Severity | Criteria |
| --- | --- |
| **Blocker** | Credentials, tokens or keys hard-coded in the binary or committed; secrets or personal data written to logs; sensitive data stored unprotected where the platform provides secure storage (Keystore / Keychain) |
| **Major** | Requesting a permission broader than the feature needs; sending personal data to a new third party; disabling certificate validation "for testing" |
| **Minor** | Verbose logging that could be reduced in release builds |
| **Nit** | — |

**Questions to ask:** If this log line appears in a crash report or a support screenshot, is it a problem? Does the feature work with the narrowest permission? Is this debug-only code gated out of release builds?

---

## Review Workflow

1. **Pre-review:** CI is green or failing only on known flakes; the PR description states what changes and **what the undo is** (flag, staged rollout, or "none"); diff is reviewable in size.
2. **Automated first:** lint/format/static analysis, StrictMode violations in debug runs, Compose compiler report or Android lint for new code, the unit tests. Humans shouldn't review what a tool can.
3. **Walk the dimensions** in order — 1 (responsiveness), 2 (memory), 4 (migration) and 5 (reversibility) first, since those are where findings are most likely to be Blockers — then 3, 6, 7.
4. **Label every finding** with a severity; attach the failure mechanism to Blockers and Majors.
5. **Decide:** *Approve* — no Blockers, no unresolved Majors; *Comment* — Minors and Nits only; *Request changes* — any Blocker or unresolved Major.

---

## Example Review Comments

### Example 1 — Responsiveness (Blocker)

> **File**: `FeedRepository.kt:61` · **Severity**: Blocker
>
> `decodeFeed(response)` runs here on the main thread. It's quick with your 20-item test account, but the production feed returns hundreds of items — on a mid-range phone this parse alone can be long enough to freeze input, and on the slowest devices it can cross the ANR threshold (see [Ch10 §2](../03_Android/10_Performance_Memory_And_ANR_Profiling.md#2-anr-fundamentals--the-watchdog-and-the-main-thread)). It's CPU-bound, so `Dispatchers.Default` rather than `IO`:
>
> ```kotlin
> val feed = withContext(Dispatchers.Default) { decodeFeed(response) }
> ```

### Example 2 — Memory (Blocker)

> **File**: `ProfileViewController.swift:34` · **Severity**: Blocker
>
> `onSave = { self.saveProfile() }` captures `self` strongly, and `onSave` is stored on `self` — a retain cycle, so this controller is never freed. It won't show in a quick test; it shows as memory climbing every time someone opens and closes Profile. Open and close the screen ten times and check the Memory Graph Debugger to confirm ([iOS §6](../08_iOS_Performance_Memory_And_Instruments.md#6-reading-a-retain-cycle-at-the-tooling-level)). The closure shouldn't be what keeps the controller alive, so:
>
> ```swift
> onSave = { [weak self] in self?.saveProfile() }
> ```

### Example 3 — Reversibility (Blocker)

> **File**: `TransferFlow.kt` · **Severity**: Blocker
>
> This rewrites the transfer submission and ships to all users with no flag. If it's wrong, our only undo is a hotfix through store review, which is days — and the transfer path is our highest-blast-radius flow. Please put the new path behind the existing remote flag with the old path as the safe default (and decide what happens when the flag service is unreachable), so rung 1 of the [reversibility ladder](../10_Senior_Mobile_Engineering_Judgment.md#1-the-root-fact--asymmetric-reversibility) exists before this ships. Happy to pair on it.

### Example 4 — A comment that should *not* be a blocker (Nit)

> **File**: `SettingsScreen.dart:12` · **Severity**: Nit
>
> nit: I'd name this `_showNotificationPrompt` — your call, not blocking.

---

## Reviewer Calibration

- **Explain the mechanism** on every Blocker and Major. "Because I said so" teaches nothing and trains authors to stop listening.
- **Suggest a concrete fix**, or offer to pair; a Blocker with no path to resolution is just friction.
- **Prefer teaching the diagnosis over handing over the fix** when the author is learning: "open and close this screen ten times and look at the memory graph" transfers to every future leak.
- **Don't block on taste.** Reserve Blocker for the invisible-in-dev, certain-at-scale, no-cheap-undo class.
- **Turn repeat findings into automation.** If you've left the same comment three times, it should become a lint rule, a CI check or a template — that is the Staff-level move on the [calibration competency](READINESS_RUBRIC_SWE.md#10-code-review-calibration-).
- **Praise specifically.** Naming what was done well (a flag added unprompted, a migration test from three versions back) reinforces the behavior better than silence.
