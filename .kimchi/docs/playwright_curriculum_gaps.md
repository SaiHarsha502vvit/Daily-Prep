# Critical Gap Analysis: SDET Playwright Automation Curriculum

**Scope:** `21_SDET_Playwright_Automation/` — every file in the module was analysed.
**Date:** 2026-06-06

---

## Executive Summary

This is an **excellent theory curriculum** — deep, well-structured, and full of production-grade patterns. However, **it stops at the edge of the screen**: everything is markdown text. There is no runnable code, no sample project, no hands-on sandbox, and no verification that the patterns actually compile or work. For a course targeting SDETs — engineers whose product is code — that is the single largest gap.

---

## 🔴 Tier-1 Gaps (Critical — Missing Fundamentals)

### 1. No Runnable Codebase at All
| Evidence | Impact |
|---|---|
| Zero `.ts`, `.js`, `.json`, or any config files in the module | Readers cannot run a single pattern locally |
| No `package.json`, `playwright.config.ts`, or `tsconfig.json` | Readers cannot create a project from the guide alone |
| Every "code example" is a markdown snippet with no imports or file structure shown | Readers must guess where files go |

Every chapter shows isolated fragments. A reader following Ch18 (Mega POM) cannot split a real POM because there is no real POM to split.

### 2. Ch45 Is an Orphan Chapter
- File `05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md` **exists** but `00_INDEX.md` **does not list it** in the chapter table.
- The INDEX ends at Ch44 + Q1/Q2 and never mentions Ch45.
- This means the AI/MCP chapter is invisible to anyone reading the INDEX.

### 3. No Hands-On Starter Project
A curriculum at this level should ship with:
- A `starter-project/` folder with a working Playwright + TypeScript repo
- Pre-built POMs for OrangeHRM or a similar public demo site
- A `solutions/` folder with reference implementations for all 15 code challenges in Quiz 02
- A `broken-tests/` folder — deliberately flaky tests the reader must fix (applying Ch26)

Currently: none of the above exist.

### 4. Missing Chapter: Playwright Config Deep-Dive
Ch01 covers "project setup" superficially but there is **no dedicated chapter** on:
- `playwright.config.ts` — every field, when to use `projects[]`, `use:` merging rules
- `retries`, `workers`, `fullyParallel` interaction
- Reporter configuration (JSON, HTML, custom reporters)
- `globalSetup` / `globalTeardown` vs `dependencies: [setup]`
- Device emulation and viewport matrices
- Trace configuration (`trace: 'on-first-retry'` vs `'retain-on-failure'`)

---

## 🟠 Tier-2 Gaps (Important — Industry-Relevant)

### 5. Mobile Testing Is Only a Comparison
- `23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md` is a **cross-module** comparison document.
- There is **no hands-on Playwright mobile chapter** (`Chromium on Android` emulation, `playwright.dev/webview`, device descriptors).
- There is **no Appium hands-on module** in the Playwright curriculum.

### 6. No Coverage of Modern Component Testing
Playwright has `@playwright/experimental-ct-react` / Vue / Svelte. The curriculum never covers:
- Component-level testing with isolated `mount()`
- Testing React components directly without a full page load
- When to use component tests vs E2E tests in a Playwright-only stack

### 7. Missing Coverage: File Uploads & Downloads
- No chapter on `page.locator('input[type=file]').setInputFiles()`
- No coverage of the `downloads` event listener for file download verification
- No coverage of `expect(download).toBeCloseTo()` or blob/CSV assertions

### 8. Auth Strategy Is Only Covered One Way
The curriculum covers `storageState` (Ch16) extensively, but **misses**:
- OAuth2 / OIDC flow automation (the interactive redirect flow, not just magic links)
- SAML-based SSO automation
- Multi-factor authentication (TOTP) with `totp` libraries
- Certificate-based auth (mTLS/client certs)

### 9. No Coverage of Playwright-Test Reporters & Custom Reporter Design
- HTML reporter is mentioned in CI chapter but never dissected
- No custom reporter chapter (class implementing `Reporter` interface)
- No `list` vs `line` vs `dot` reporter guidance for CI noise reduction

### 10. Missing: Tips for Large-Scale Test Discovery
- No guidance on `grep` strategy + tagging for monorepos with 2000+ tests
- No coverage of test filtering by metadata (`test.info().annotations`)
- No chapter on test suite health dashboards (parsing JSON reports for trends)

---

## 🟡 Tier-3 Gaps (Nice-to-Have Extensions)

### 11. Docker Is Barely Mentioned
- Ch25 touches on CI but **does not ship a Dockerfile** or `docker-compose.yml` for local Playwright execution.
- No guidance on volume mounting for trace files, containerised browser execution, or `mcr.microsoft.com/playwright` image usage.

### 12. No Comparison with Cypress / Selenium / WebdriverIO
The curriculum is 100% Playwright. A production SDET must defend their tool choice. The only comparison doc is vs Appium (mobile). Missing:
- Why Playwright over Cypress for enterprise (cross-domain, API testing, parallel)
- Migration guide: Selenium → Playwright (locator strategy mapping)
- When to keep Selenium (legacy grid, existing Page Objects)

### 13. No Chapter on Test Analytics & Observability
- No coverage of integrating Playwright with Datadog, New Relic, or Dynatrace
- No coverage of OpenTelemetry trace correlation (browser → API → DB)
- No test history trend analysis (flake rate over time)

### 14. The LADDER Interview Framework Exists but Has No Practice Scenarios
Ch32 introduces LADDER but provides **no mock interviews** or paired scenario + answer walkthroughs. A reader cannot self-practice.

### 15. Quiz 02 Has No Reference Solutions
- 15 code challenges in `QUIZ_02_Playwright_CodeChallenge.md`
- No `solutions/` folder with companion answer files
- Reader has no way to validate their implementation

---

## 🔵 Tier-4 Gaps (Structural & Metadata)

### 16. Broken / Dangling Cross-Module Links
The INDEX links to cross-module folders that may or may not exist:
- `22_DevOps/19_CICD_Pipelines.md` — likely exists (mentioned in module list)
- `13_Dev/06_Testing_Fundamentals` — needs verification
- `14_MM` (not a real module code in this repo; likely a typo for another module)
- `20_IM` — needs verification

These links are unvalidated — clicking them in a rendered view could 404.

### 17. No `CONTRIBUTING.md` or Issue Tracker for Curriculum Itself
A living curriculum should document:
- How to propose new chapters
- How to report factual errors in code snippets
- Versioning strategy when Playwright releases new APIs

### 18. `CONTEXT.md` Is Redundant
- `CONTEXT.md` duplicates much of `00_Start_Here.md` and `00_INDEX.md`
- It adds no unique content; consider merging or deleting

### 19. No Playwright Version Pinning
- No `package.json` or lockfile means no reference Playwright version
- Snippets may use APIs from Playwright 1.40+ but readers on 1.30 won't know
- A version compatibility note per chapter would help

### 20. Missing: Video Recording & Trace Viewer in Detail
- Trace viewer is mentioned in flakiness chapter but never taught as a first-class debugging tool
- No dedicated section on `video: 'on'` vs `'retain-on-failure'`, video file extraction
- No chapter on "how to read a trace" step by step

---

## Summary Table

| # | Gap | Tier | Quick Fix Effort |
|---|---|---|---|
| 1 | No runnable codebase | 🔴 Critical | Large — needs starter project |
| 2 | Ch45 absent from INDEX | 🔴 Critical | One-line fix |
| 3 | No hands-on starter project | 🔴 Critical | Large |
| 4 | No config deep-dive | 🔴 Critical | Medium — new chapter |
| 5 | No mobile hands-on | 🟠 Important | Medium |
| 6 | No component testing | 🟠 Important | Medium — new chapter |
| 7 | No file upload/download | 🟠 Important | Small — add to existing chapter |
| 8 | Auth strategy incomplete | 🟠 Important | Medium |
| 9 | No reporter deep-dive | 🟠 Important | Medium |
| 10 | No large-scale discovery | 🟠 Important | Small — add section |
| 11 | No Docker | 🟡 Extension | Small — Dockerfile + compose |
| 12 | No tool comparison | 🟡 Extension | Medium |
| 13 | No observability | 🟡 Extension | Medium |
| 14 | No mock interview walkthroughs | 🟡 Extension | Medium |
| 15 | No quiz solutions | 🟡 Extension | Medium — 15 .ts files |
| 16 | Broken cross-links | 🔵 Structural | Small — grep + verify |
| 17 | No contributing guide | 🔵 Structural | Small |
| 18 | CONTEXT.md redundancy | 🔵 Structural | Small — merge or delete |
| 19 | No version pinning | 🔵 Structural | Small — add version notes |
| 20 | Trace viewer not taught | 🔵 Structural | Small — expand section |

---

*Generated: 2026-06-06*
