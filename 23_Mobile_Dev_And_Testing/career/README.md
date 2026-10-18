# Mobile Career System — Two Ladders to Senior

This folder is where the mobile module turns from *learning material* into a *growth plan*. The rest of `23_Mobile_Dev_And_Testing/` teaches mechanisms; this folder tells you where you stand, what to practice next, and what evidence proves you got there. It is modeled on the web-side [`21_SDET_Playwright_Automation/career/`](../../21_SDET_Playwright_Automation/career/README.md) folder but is written for mobile, and — because this module teaches both building apps and testing them — it has **two ladders**, not one.

Everything here is for **on-the-job growth** (technical depth, judgment, and planning). It deliberately does not include résumé, portfolio or mock-interview material; those exist on the web side, and this folder's purpose is the work itself.

---

## The Two Ladders

| | Senior Mobile **Software Engineer** | Senior Mobile **SDET** |
|---|---|---|
| **Owns** | The app: architecture, performance, release safety, production health | Confidence in the app: test architecture, device strategy, release gating, escape analysis |
| **Rubric** | [READINESS_RUBRIC_SWE.md](READINESS_RUBRIC_SWE.md) | [READINESS_RUBRIC_SDET.md](READINESS_RUBRIC_SDET.md) |
| **Core module content** | [Flutter Bootcamp](../Flutter_Bootcamp/00_MASTER_ROADMAP.md), [Android deep dive](../03_Android/01_Architecture_And_App_Model.md), [iOS](../03_iOS_Native_Dev_And_Testing.md), [iOS performance](../08_iOS_Performance_Memory_And_Instruments.md) | [Playwright track](../Playwright_Mobile_TypeScript/00_ROADMAP.md), [Mobilewright track](../Mobilewright_TypeScript/00_ROADMAP.md), [test design](../07_Test_Design_And_Documentation.md), [test infra at scale](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md) |
| **Both read** | [Judgment doc](../10_Senior_Mobile_Engineering_Judgment.md) and [Android Ch10](../03_Android/10_Performance_Memory_And_ANR_Profiling.md) | same |

The roles overlap heavily in practice — a mobile SDET who can read a heap dump or a developer who can write a device-specific test is more valuable, not out of scope. Use whichever ladder matches your current role, and read the other for the competencies where it is the stronger teacher.

### The Shared Rows

Three competencies appear in both rubrics, marked ⇄: **Code Review Calibration**, **Mentoring & Leadership**, and **Cost Governance**. Their band descriptions and evidence examples are **word-for-word identical** in both files, on purpose — "Senior at code review" should mean the same thing whether you review app code or test code, and two versions drifting apart would quietly give the two ladders different definitions of seniority. If you change a shared row in one file, change it in the other.

---

## A Route From Beginner to Senior

The rubrics tell you where you are; this is a suggested order for the material that moves you. It is a route, not a rule — skip what you already know.

**Stage 1 — Foundations (Junior → Mid).** Pick a platform and learn to build or test one real feature: the [Flutter Bootcamp](../Flutter_Bootcamp/00_MASTER_ROADMAP.md) (building), or [test design](../07_Test_Design_And_Documentation.md) plus the [Playwright track levels 1–6](../Playwright_Mobile_TypeScript/00_ROADMAP.md) (testing). Goal: you can deliver a feature or a reliable test suite on one platform.

**Stage 2 — Breadth (Mid).** Learn the other side and the other platform: the [iOS overview](../03_iOS_Native_Dev_And_Testing.md) and [Android overview](../02_Android_Native_Dev_And_Testing.md), then the [Mobilewright track](../Mobilewright_TypeScript/00_ROADMAP.md) for native automation and [Playwright vs Appium](../01_Playwright_vs_Appium_Full_Comparison.md) for the tool landscape. Goal: you can explain *why* the platforms and tools differ, not just operate them.

**Stage 3 — Depth (Mid → Senior).** The material where seniority is actually earned: [Android Ch10](../03_Android/10_Performance_Memory_And_ANR_Profiling.md) and [iOS performance](../08_iOS_Performance_Memory_And_Instruments.md) (diagnose from symptom to line of code), [test infrastructure at scale](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md) (matrix, sharding, cost), and the [debugging toolkit](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md). Goal: you can diagnose and decide with mechanisms, not folklore.

**Stage 4 — Judgment (Senior).** Read the [judgment doc](../10_Senior_Mobile_Engineering_Judgment.md) *after* stage 3, because it only makes sense once you know the mechanisms it weighs. Then self-assess with your rubric, pick two or three competencies for the next quarter, and tie each to a real deliverable. Goal: you can make and defend decisions nobody has written a rule for.

---

## What Is in This Folder

| File | What it is | Status |
|---|---|---|
| [README.md](README.md) | This index | Done |
| [READINESS_RUBRIC_SWE.md](READINESS_RUBRIC_SWE.md) | 12 competencies × 5 bands (Junior → Principal) for the mobile software engineer, with a map to the module content that teaches each | Done |
| [READINESS_RUBRIC_SDET.md](READINESS_RUBRIC_SDET.md) | Same structure for the mobile SDET | Done |
| [TEST_STRATEGY_TEMPLATE.md](TEST_STRATEGY_TEMPLATE.md) | Fill-in mobile test-strategy template (reversibility profile, risk register over the mobile dimensions, device matrix, tier placement, gating policy, cost model) plus a worked example | Done |
| [RELEASE_AND_ROLLOUT_PLAYBOOK.md](RELEASE_AND_ROLLOUT_PLAYBOOK.md) | Store mechanics side by side (verified against official docs 2026-10-18, with an explicit list of what was *not* verified), derived soak-time arithmetic, release train, halt-criteria template, flags, hotfix procedure | Done |
| [RFC_TEMPLATE.md](RFC_TEMPLATE.md) | Mobile RFC template (adds reversibility/exit-criteria and test-strategy sections) plus a fully worked, explicitly fictional Appium→Mobilewright *pilot* RFC with a cause breakdown, documented tool gaps, stop conditions and decision gates | Done |
| [CODE_REVIEW_RUBRIC.md](CODE_REVIEW_RUBRIC.md) | Mobile app-code review rubric: 7 dimensions × 4 severities calibrated on "invisible in dev, certain at scale, no cheap undo," with workflow and worked review comments; test-code review stays in the web-side rubric | Done |

All planned career files have landed. The rubrics' "Where This Module Teaches Each Competency" tables still mark the rows where material is thin or missing (for example battery profiling, offline-sync conflicts, mentoring, and a worked native-vs-Flutter architecture RFC) — those are the honest gaps.

---

## How the Rubrics Are Meant to Be Used

1. **Self-assess** each competency against the Evidence column — evidence, not confidence.
2. **Pick two or three** to raise per quarter; tie each to a deliverable using the action-plan template at the bottom of each rubric.
3. **Use the "Where This Module Teaches It" table** to find what to read or build for a given competency — and note the rows marked *thin* or *planned*: those are places this module does not yet teach well, and you will need an outside source or real work to fill them.
4. **Re-assess quarterly.** The platforms move; a band held two years ago is not a band held today.

| Cadence | Action |
|---|---|
| After each deliverable | Update which evidence you can now point to |
| Quarterly | Re-score all 12 competencies; choose the next two or three |
| Annually | Ask someone one band above you to calibrate your scores |
