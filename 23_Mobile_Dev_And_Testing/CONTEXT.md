# Context: 23_Mobile_Dev_And_Testing

## Purpose

This folder teaches mobile development concepts and mobile testing together, so the learner understands both what they are building and how to verify it. The target audience is an SDET or developer who needs to understand Android, iOS, and Flutter from scratch while also learning the full testing stack for each platform.

## Boundaries

- **Mobile-first**: All content is anchored in mobile development or mobile testing. Do not migrate web-only testing content here.
- **Dev + Test together**: Every platform chapter teaches the development concepts (architecture, lifecycle, state management) alongside the testing tools. They are not separate chapters.
- **Honest tool positioning**: Playwright is used for mobile WEB, API layer, and hybrid WebView testing. Appium is used for native UI automation. Native frameworks (Espresso, XCUITest, Flutter integration_test) are used for unit-level UI tests. Do NOT claim Playwright can replace Appium for native UI.
- **Platforms covered**: Android Native, iOS Native, Flutter. React Native is mentioned as a comparison point but is not a primary topic.

## Style Rules

- Basics → concept → real-world problem → solution → challenges (same as 20_Interview_Mastery series).
- Cross-link to `21_SDET_Playwright_Automation/` for Playwright fundamentals.
- Cross-link to `07_Modern_Java/` for Android Java/Kotlin JVM knowledge.
- Code blocks: fence parity EVEN. Every opening `must have a matching closing`.
- No `&&` in PowerShell commands. Use semicolons.

## Files in This Folder

| File                                         | Description                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `00_Testing_Fundamentals_MOVED_TO_SDET.md`   | Redirect stub — testing-types content lives in `21_SDET_Playwright_Automation/`     |
| `01_Playwright_vs_Appium_Full_Comparison.md` | Architecture, capabilities, trade-offs, decision tree                               |
| `02_Android_Native_Dev_And_Testing.md`       | Android dev concepts + Espresso + UIAutomator2 + Appium + Playwright API layer      |
| `03_Android/`                                | 9-chapter native Android deep-dive series (Architecture, Lifecycle, ViewModel/StateFlow, Compose, Room/DataStore, Retrofit/OkHttp, JUnit/Mockito, Instrumented/UI Tests, Hilt DI) — deeper than file 02's single-file treatment; a planned Chapter 10 (Performance/Memory) was never written, treat as an open content gap |
| `03_iOS_Native_Dev_And_Testing.md`           | iOS dev concepts + XCUITest + Appium + Playwright API layer                         |
| `04_Flutter_Dev_And_Testing.md`              | Flutter dev concepts + integration_test + Appium Flutter + Playwright API layer     |
| `05_Mobile_Web_And_Hybrid_Playwright.md`     | Touch gesture simulation (what `Touchscreen` actually supports), geolocation/permissions, honest Capacitor/Ionic/React Native WebView testing boundaries via Playwright's Android API |
| `06_Mobilewright_Native_Testing.md`          | The real Mobilewright framework (mobilewright.dev) — Playwright-powered native mobile automation, positioned against Appium; its WebView-bridging feature compared against file 05's Playwright-only approach |
| `06b_Mobilewright_Challenges.md`             | Challenges for file 06                                                              |
| `07_Test_Design_And_Documentation.md`        | Mobile-specific test scenario design (equivalence partitioning, boundary analysis, decision tables applied to mobile), required test docs, and the mobile-only test dimensions (app lifecycle, permissions, device fragmentation) a web-only background misses |
| `23_PROBLEM_SETS.md`                         | Problem sets for this module — native/cross-platform theory + Flutter challenges    |
| `Flutter_Bootcamp/`                          | 27-week structured Flutter curriculum (Dart → production), each week paired with a hands-on `*b_*_Challenges.md` file; plus a `Reference/` deep-dive library (rendering pipeline, widget catalog, theming, BuildContext, keys, async patterns, ADB & dev tooling, patterns/anti-patterns, mobile debugging toolkit) — see `Flutter_Bootcamp/00_MASTER_ROADMAP.md` |
| `Playwright_Mobile_TypeScript/`              | Progressive TypeScript + Playwright mobile testing track, 13 levels across Foundations → Intermediate → Advanced → Capstone, official-docs-grounded throughout — see `Playwright_Mobile_TypeScript/00_ROADMAP.md` |
| `Mobilewright_TypeScript/`                   | Progressive TypeScript + Mobilewright native mobile testing track, 13 levels across Foundations → Intermediate → Advanced → Capstone, grounded in mobilewright.dev; teaches genuine framework gaps (no visual-regression assertion, no custom-fixture API, iOS's hard Linux-container wall) alongside its capabilities — see `Mobilewright_TypeScript/00_ROADMAP.md` |

**Note on scope:** `06_Mobile_CI_CD_Strategy.md` was previously listed here but does not exist as a file — treat it as an open content gap for this folder, not a broken link to chase down.
