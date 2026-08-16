# Test Design & Documentation for Mobile Apps

## Scope of This File

General testing-types content (what a smoke test is, unit vs integration vs E2E) already lives in [21_SDET_Playwright_Automation](../21_SDET_Playwright_Automation/) — per this folder's own [CONTEXT.md](CONTEXT.md), that's deliberately not duplicated here. This file is narrower and mobile-specific: **how do you go from "here's a feature" to "here's a complete, mobile-aware set of test cases," and what breaks that process specifically on mobile that wouldn't break it on web?**

---

## Before You Write a Single Test Case — Understand the Functionality

The single most common root cause of a weak test suite isn't a missing tool or a bad framework — it's testing what you *assume* the feature does instead of what it's actually specified to do. Three concrete inputs, in order of reliability:

1. **The requirement/spec/ticket itself** — what was actually asked for, including explicit non-functional requirements (performance targets, offline behavior, accessibility requirements) that are easy to skip past if you only read the happy-path description.
2. **The design/UX mockups** — mobile-specific UI states (empty state, loading state, error state, offline state) are frequently only shown in a design file, never written down as a sentence in the ticket — if you only read the ticket, you'll miss testing states the designer clearly intended.
3. **The actual running app or a prototype** — specs and designs go stale the moment implementation starts diverging from them; the running app is the only source of truth for "what does this actually do right now."

**A concrete habit worth adopting:** before writing test cases, write down, in your own words, a one-paragraph summary of what the feature does and doesn't do. If you can't write that paragraph confidently, you don't understand the feature well enough to test it yet — go find the missing piece (ask the developer, re-read the ticket, poke at the running app) before writing a single test case, not after.

---

## From Requirements to Test Scenarios

A **test scenario** is a high-level statement of *what* to verify — not yet the step-by-step *how*. Deriving a complete set of scenarios from a requirement is a skill, not a checklist; three techniques cover most of the ground:

### Equivalence Partitioning — Group Inputs That Should Behave the Same Way

Instead of testing every possible input value, group inputs into classes where every member of a class should produce the same behavior, and test one representative from each class.

> **Requirement:** a promo code field accepts alphanumeric codes, 4-12 characters.

| Partition | Example | Expected |
|---|---|---|
| Valid length, valid characters | `SAVE10` | Accepted, discount applied |
| Too short | `AB` | Rejected — "too short" error |
| Too long | `THISCODEISWAYTOOLONG123` | Rejected — "too long" error |
| Invalid characters | `SAVE-10!` | Rejected — "invalid characters" error |
| Empty | `` | "Required field" error, not a crash |

Five scenarios, not fifty — each one represents a genuinely distinct class of behavior, not just a different string.

### Boundary Value Analysis — Test the Edges, Not Just the Middle

Bugs cluster at boundaries far more than in the middle of a valid range — off-by-one errors are the most common bug class in existence.

> Same promo code field, 4-12 characters:

Test **3 characters** (just below the minimum — should reject), **4 characters** (exactly the minimum — should accept), **12 characters** (exactly the maximum — should accept), **13 characters** (just above — should reject). Four tests, targeting exactly the four places an off-by-one bug (`< 4` instead of `<= 4`, `> 12` instead of `>= 12`) would actually surface — the middle of the range (an 8-character code) is far less likely to catch this specific bug class.

### Decision Tables — When Behavior Depends on Multiple Conditions Combined

> **Requirement:** a "Place Order" button should be enabled only when the cart is non-empty, a payment method is selected, AND a shipping address is set.

| Cart non-empty | Payment selected | Address set | Button enabled? |
|---|---|---|---|
| No | No | No | No |
| Yes | No | No | No |
| Yes | Yes | No | No |
| Yes | Yes | Yes | **Yes** |
| Yes | No | Yes | No |

A decision table forces you to consider **every combination**, not just the ones that occur to you naturally — it's common to test "all conditions true" and "all conditions false" and miss the partial-combination cases where the actual bug usually lives (a button that's incorrectly enabled with payment selected but no address, because the enabling logic only checked two of the three conditions).

---

## What's Genuinely Different About Mobile — The Dimensions Web Testing Doesn't Have

This is the part that doesn't transfer from general testing-fundamentals content — a complete mobile test scenario set needs to consider dimensions a web app simply doesn't have:

| Dimension | What to actually test |
|---|---|
| **App lifecycle** | Backgrounding mid-action (does an in-progress upload survive being backgrounded?), the app being killed by the OS and relaunched (does state restore correctly, or does the user lose their place?), an incoming phone call interrupting the app |
| **Permissions** | Both the granted AND denied path for every permission (camera, location, notifications) — [Level 8 of the Playwright track](Playwright_Mobile_TypeScript/Level_08_Geolocation_Permissions_Storage.md) covers this exact "denial path is not optional" principle for location specifically |
| **Network conditions** | Not just online/offline — genuinely slow (2G/3G-equivalent) connections, a connection that drops *mid-request* (not before it starts), switching from WiFi to cellular mid-session |
| **Device fragmentation** | Different screen sizes/densities (does a layout that works on a 6" phone break on a 4.7" one?), different OS versions (a permission API that changed between Android versions), low-end hardware (does an animation-heavy screen actually perform acceptably on a budget device, not just a flagship test device) |
| **Interruptions** | A low-battery warning, a push notification banner appearing over the current screen, the on-screen keyboard covering an input field it shouldn't |
| **Installation lifecycle** | Fresh install (no cached data — [Week 18's fresh-install crash Bug Hunt](Flutter_Bootcamp/Phase_4_Firebase_and_Storage/Week_18b_Storage_Challenges.md#-bug-hunt--crashes-only-on-a-fresh-install) is exactly this class of bug), app update (does data/state migrate correctly from the previous version), uninstall/reinstall |

**The concrete habit this suggests:** for any feature, after writing the "normal" scenarios (equivalence partitions, boundaries, decision-table combinations), run back through this table and ask, explicitly, "does app lifecycle affect this? Does a permission gate this? Does network state change this behavior?" — most mobile-specific bugs are found by developers and testers who ask these questions deliberately, not by ones who stumble onto them by accident.

---

## From Scenarios to Test Cases

A **test case** turns a scenario into concrete, repeatable steps someone else (a teammate, or automation) can execute without needing to ask you anything.

```
Test Case: TC-042 — Promo code rejected when below minimum length
Precondition: user has at least one item in cart, is on the checkout screen
Steps:
  1. Tap the "Promo Code" field
  2. Enter "AB" (2 characters)
  3. Tap "Apply"
Expected Result: an inline error reads "Code must be at least 4 characters" —
  the cart total is unchanged, and the field remains editable
Priority: Medium
```

Every field here earns its place: **Precondition** so the test doesn't silently depend on unstated setup; **Steps** specific enough that two different people would execute them identically; **Expected Result** specific enough to catch a *wrong* error message, not just "an error of some kind appeared"; **Priority** so a team under time pressure knows what to run first.

---

## The Documents a Real Test Effort Actually Needs

Not every project needs formal versions of all of these, but knowing what each one is *for* means you can recognize when a project is missing something it genuinely needs:

- **Test Plan** — the *strategy* document: what's in scope, what's explicitly out of scope, what environments/devices will be tested, what the entry/exit criteria are (when is testing "done enough" to ship). This is written once per project/release, not once per feature.
- **Acceptance Criteria** — usually owned by product/design, not QA, but the direct source for your happy-path test scenarios; if acceptance criteria are vague ("the form should work well"), that vagueness becomes your problem the moment you try to write test cases against it — push back and get it specific before testing starts, not after a bug report argument about what "working well" meant.
- **Test Case Suite** — the actual collection of test cases like the one above, usually grouped by feature/screen.
- **Device/Environment Matrix** — for mobile specifically, an explicit list of which OS versions, screen sizes, and device tiers (flagship/mid-range/budget) are actually covered — without this written down, "we tested it" quietly means "we tested it on whatever phone was on my desk," which is a real, common gap.
- **Bug Report** — precise enough that a developer can reproduce the bug without asking you follow-up questions: exact steps, exact device/OS, expected vs actual, and (mobile-specific) whether it reproduces on a fresh install or only after some accumulated app state.

---

## Challenges

### 🏗️ Build It Blind — Derive Scenarios From a Real Feature Description

No test cases given. Spec only:

> "Users can save a delivery address as a 'favorite.' A user can have up to 5 favorite addresses. Tapping a favorite during checkout auto-fills the address fields. If a user tries to add a 6th favorite, they're prompted to remove one first."

Using this file's own techniques, derive: (1) at least one equivalence-partitioning-based scenario set, (2) at least one boundary-value scenario, (3) at least two mobile-specific scenarios from the dimensions table that a purely web-focused tester might miss.

<details><summary>One reasonable scenario set</summary>

**Equivalence partitioning** (valid vs invalid address data being saved): a complete valid address saves correctly; an address missing a required field (no ZIP/postal code) is rejected with a clear error; an address with an invalid ZIP format is rejected.

**Boundary value** (the 5-favorite limit): saving the 4th favorite succeeds normally; saving the 5th succeeds and the "add favorite" affordance should now reflect the limit reached; attempting a 6th triggers the "remove one first" prompt exactly as specified — test at 4, 5, and 6, not just "a few" and "a lot."

**Mobile-specific, easy to miss:**
- **App lifecycle:** user starts adding a favorite address, the OS backgrounds the app (a phone call arrives) before they tap Save — does the partially-entered address survive, or is it silently lost on return?
- **Fresh install / data migration:** a user who already has 5 favorites updates the app to a new version — do all 5 favorites survive the update, and does the 5-limit logic still correctly recognize there are already 5 (not silently reset to allowing more)?

🔴 **Explanation:** the two mobile-specific scenarios are exactly the shape of test a web-only background wouldn't naturally reach for — "does state survive being backgrounded" and "does data survive an app version upgrade" have no direct web equivalent (a web page doesn't get "backgrounded" the same way, and a web app doesn't have a discrete "app update" install event separate from just reloading the page). This is the actual point of [this file's mobile-dimensions table](#whats-genuinely-different-about-mobile--the-dimensions-web-testing-doesnt-have) — it's there specifically to prompt the questions a general test-design background wouldn't automatically ask.

</details>

---

### 🕵️ Code Review — A Test Case With Three Real Problems

```
Test Case: TC-017
Steps: Add promo code, check it works
Expected: Should be fine
```

<details><summary>What's wrong, named specifically</summary>

🔴 **Explanation:** three separate, real problems, each worth naming precisely rather than just "this is bad": (1) **no precondition** — "add promo code" to what? An empty cart? A cart with items? A guest checkout or a logged-in user? Without a stated starting state, two people executing this "same" test case could be testing completely different scenarios. (2) **steps aren't concrete** — "check it works" isn't a step anyone can execute identically; it doesn't say what code to enter, what button to tap, or in what order. (3) **the expected result isn't a result at all** — "should be fine" can't fail, because it doesn't specify what "fine" means; a discount that's the wrong percentage, or an error message with a typo, would both pass this test case as written. The fix is [this file's own worked example](#from-scenarios-to-test-cases) — every field filled in with something specific enough that a different person, or an automated script, could execute it identically and get an unambiguous pass/fail.

</details>

---

**→ Related files:**
- [01_Playwright_vs_Appium_Full_Comparison.md](01_Playwright_vs_Appium_Full_Comparison.md) / [06_Mobilewright_Native_Testing.md](06_Mobilewright_Native_Testing.md) — once test cases exist, these are the tools that turn them into automation
- [Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md](Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md) — many of that doc's anti-patterns are exactly what a mobile-lifecycle-aware test scenario, written using this file's own techniques, would have caught before shipping
