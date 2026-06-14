# Tool Comparison — Cypress / Selenium / WebdriverIO / Playwright

> The authoritative reference for picking a browser automation tool. The architecture of each, the locator model, cross-domain support, parallelism, API testing capability, mobile story, debugging UX, ecosystem, vendor stability, real-world trade-offs, migration cost calculations, and the interview talking points that separate signal from noise.

---

## Table of contents

1. [The four tools — at a glance](#1-the-four-tools)
2. [Architecture](#2-architecture)
3. [Locator model](#3-locator-model)
4. [Cross-domain and IFrame support](#4-cross-domain)
5. [Parallel execution and sharding](#5-parallelism)
6. [API testing capability](#6-api-testing)
7. [Network interception and mocking](#7-network-interception)
8. [Component testing](#8-component-testing)
9. [Mobile support](#9-mobile)
10. [Debugging — time-travel, trace, inspectors](#10-debugging)
11. [Reporting and CI integration](#11-reporting-ci)
12. [Language support](#12-language-support)
13. [Ecosystem maturity](#13-ecosystem)
14. [Total cost of ownership](#14-total-cost)
15. [Migration paths and effort](#15-migration)
16. [Decision framework](#16-decision-framework)
17. [Interview talking points](#17-interview)
18. [Common questions](#18-common-questions)

---

## 1. The four tools

|                          | Playwright                | Cypress                                | Selenium 4                 | WebdriverIO                  |
| ------------------------ | ------------------------- | -------------------------------------- | -------------------------- | ---------------------------- |
| Vendor                   | Microsoft                 | Cypress.io                             | Apache Foundation          | Community (no single vendor) |
| First release            | Jan 2020                  | Oct 2017                               | 2004 (Selenium 1)          | 2015                         |
| License                  | Apache 2.0                | MIT (core) / commercial (Cloud)        | Apache 2.0                 | MIT                          |
| Languages                | JS/TS, Python, Java, C#   | JS/TS only                             | Java, Python, C#, Ruby, JS | JS/TS only                   |
| Cross-browser            | Chromium, Firefox, WebKit | Chromium primarily, FF/WK experimental | All major                  | All major                    |
| W3C WebDriver compliance | No (uses CDP)             | No (proprietary)                       | Yes                        | Configurable                 |
| Github stars             | ~65k                      | ~46k                                   | ~30k                       | ~9k                          |
| Weekly npm downloads     | ~5M                       | ~5M                                    | ~3M (per language)         | ~700k                        |
| Active commits           | Very active               | Active                                 | Steady                     | Moderate                     |

### 1.1 The market positioning

- **Playwright** — modern, JS/TS-first, multi-language, multi-browser, free, integrated dev tools. The "best general-purpose tool today" pick for new projects.
- **Cypress** — developer-experience-focused, time-travel debugger, polished Cloud product. Best for SPA-only projects with engineers who want a Cypress-native workflow.
- **Selenium** — language-diverse, W3C-compliant, real-device farm support. Best for Java/Python teams with legacy investment.
- **WebdriverIO** — best Cucumber integration, mobile + web in one framework, multiremote feature. Best for teams committed to BDD or needing Appium integration.

---

## 2. Architecture

### 2.1 Playwright

```
Test (TS/JS) ──┐
               │ WebSocket (persistent)
               ▼
        Browser process
        ├── Chromium (CDP)
        ├── Firefox (CDP-like)
        └── WebKit (Inspector Protocol)
```

- Out-of-process — test runs in Node, browser is separate.
- Bidirectional WebSocket — low per-call latency.
- Browser contexts isolate sessions in the same browser process.
- Workers = separate Node processes, each with its own browser context.

### 2.2 Cypress

```
Browser (Chromium / Electron)
├── Your app
└── Cypress runner   (SAME ORIGIN, SAME EVENT LOOP)
        ↑
        │ HTTP proxy
        │
   Node.js server (Cypress)
        ↑
   Test file (JS/TS)
```

- In-process — Cypress JS runs in the same JS event loop as the app.
- Cannot access cross-origin pages (without `cy.origin()`).
- Commands are chained DSL, not async/await.

### 2.3 Selenium 4

```
Test (Java / Python / C# / Ruby / JS)
        ↑
        │ HTTP (W3C WebDriver Wire Protocol)
        ▼
   Browser Driver (ChromeDriver, GeckoDriver, etc.)
        ↑
        │ Browser-specific (CDP, Marionette, native)
        ▼
   Browser
```

- Each command is a separate HTTP request.
- W3C WebDriver standard — vendor-neutral.
- Selenium 4 added BiDi (WebSocket) and direct CDP, but as opt-in extensions.

### 2.4 WebdriverIO

Two modes:

**WebDriver mode (default):**

```
Test → W3C HTTP → ChromeDriver → Browser
```

**DevTools mode (via `@wdio/devtools-service`):**

```
Test → CDP WebSocket → Chromium
```

Pluggable transport. Default is WebDriver (Selenium-style) but can switch to CDP per-test.

### 2.5 Architectural implications

| Property                   | Playwright                  | Cypress                  | Selenium 4            | WDIO        |
| -------------------------- | --------------------------- | ------------------------ | --------------------- | ----------- |
| Per-command latency        | Low (WebSocket)             | Very low (in-process)    | High (HTTP roundtrip) | Variable    |
| Cross-domain support       | Native                      | Limited (cy.origin)      | Native                | Native      |
| Multiple tabs / contexts   | First-class                 | Limited                  | First-class           | First-class |
| Test isolation             | Strong (separate processes) | Weak (shared event loop) | Strong                | Strong      |
| Browser-driver maintenance | Bundled                     | Bundled                  | Manual                | Manual      |

---

## 3. Locator model

### 3.1 Playwright

```typescript
const btn = page.getByRole("button", { name: "Save" }); // lazy
await btn.click(); // queries + auto-waits + clicks
```

- Lazy `Locator` objects.
- No stale element errors — re-queried on every action.
- ARIA-first (`getByRole`, `getByText`, `getByLabel`).
- Filter / composition (`filter`, `first`, `nth`, `or`, `and`).
- Strict mode: exactly-one match required by default.

### 3.2 Cypress

```javascript
cy.get("button.save").should("be.visible").click();
cy.contains("button", "Save").click();
cy.findByRole("button", { name: "Save" }).click(); // @testing-library/cypress
```

- Commands chain.
- Auto-retry (`.should` retries until pass or timeout).
- No `Locator` objects — every `cy.get` is a fresh query.
- jQuery-style selectors by default.

### 3.3 Selenium 4

```java
WebElement btn = driver.findElement(By.cssSelector(".save"));
btn.click();
```

- Eager — `findElement` returns a reference NOW.
- Stale element exception when DOM re-renders.
- Production code wraps every interaction in retry loops.

### 3.4 WebdriverIO

```javascript
const btn = $("button.save"); // lazy
await btn.click();
await $("my-card").shadow$("button").click(); // shadow DOM piercing
```

- Lazy `$()` and `$$()` — similar to Playwright.
- Native Shadow DOM support (`shadow$`, `shadow$$`).
- Auto-waiting built in.

### 3.5 Decision

| Need                    | Best                            |
| ----------------------- | ------------------------------- |
| Most stable locators    | Playwright (lazy + strict mode) |
| Smallest learning curve | Cypress (`cy.get`)              |
| Native shadow DOM       | WebdriverIO                     |
| Language portability    | Selenium                        |

---

## 4. Cross-domain

### 4.1 Playwright

```typescript
await page.goto("https://app.example.com");
// Redirect to https://auth.example.com — Playwright follows transparently
await page.fill("#email", "user@example.com");
// Redirect back — transparent
```

✅ Full cross-domain. Browser is controlled at the process level, not via injected JS. Any URL works.

### 4.2 Cypress

```javascript
cy.visit("https://app.example.com");
// SP redirects to IdP
cy.origin("https://auth.example.com", () => {
  cy.get("#email").type("user@example.com");
});
```

⚠️ Requires `cy.origin()` (v11+). Has limitations:

- Isolated scope — can't share variables.
- No browser cookies in some scenarios.
- Multiple cross-origin redirects in one flow are fragile.

### 4.3 Selenium 4

```java
driver.get("https://app.example.com");
// Redirect to IdP — Selenium follows
driver.findElement(By.id("email")).sendKeys("user@example.com");
```

✅ Full cross-domain. Same model as Playwright — control at the browser level.

### 4.4 WebdriverIO

Same as Selenium in WebDriver mode. CDP mode has the same limitations as Playwright/Cypress for cross-origin (which is fine — Playwright handles it; CDP can too with care).

### 4.5 IFrame support

|            | IFrame API                                 | Limitations                          |
| ---------- | ------------------------------------------ | ------------------------------------ |
| Playwright | `page.frameLocator('iframe').locator(...)` | Cross-origin frames mostly work      |
| Cypress    | `cy.iframe()` (plugin)                     | Same-origin only without workarounds |
| Selenium 4 | `driver.switchTo().frame(...)`             | All frames, including cross-origin   |
| WDIO       | `browser.switchToFrame(...)`               | Like Selenium                        |

For complex multi-frame apps (D365 form-in-iframe, legacy CRM portals), Selenium and Playwright handle well; Cypress struggles.

---

## 5. Parallelism

### 5.1 Playwright

```typescript
// Built-in
workers: 4,
fullyParallel: true,
shard: { current: 1, total: 4 },
```

- Free, built into the test runner.
- Worker processes — true OS-level isolation.
- Sharding via `--shard` flag.
- Merge reports across shards with `merge-reports`.

### 5.2 Cypress

```bash
# Cypress Cloud — paid
cypress run --parallel --record --ci-build-id $BUILD
```

- Real parallelism requires Cypress Cloud ($67-150/month per user).
- Open-source self-hosting: manual spec-file partitioning.
- No `--shard` flag; you must split tests yourself.

### 5.3 Selenium 4

```xml
<!-- TestNG -->
<suite parallel="methods" thread-count="4">
```

- Test framework's responsibility (TestNG, JUnit, pytest).
- Selenium Grid for distribution across machines.
- Grid 4 supports Docker, K8s.

### 5.4 WebdriverIO

```javascript
// wdio.conf.js
maxInstances: 4,
```

- Built-in `maxInstances` for parallel spec files.
- Multi-remote: run same test on multiple browsers SIMULTANEOUSLY.

### 5.5 Comparison

|             | Built-in parallel | Sharding     | Multi-machine | Cost                  |
| ----------- | ----------------- | ------------ | ------------- | --------------------- |
| Playwright  | ✅                | ✅ `--shard` | ✅ matrix CI  | Free                  |
| Cypress     | ⚠️ Cloud only     | ⚠️ Manual    | ⚠️ Cloud only | $67-150/mo            |
| Selenium 4  | ⚠️ Framework      | ⚠️ Manual    | ✅ Grid       | Free (Grid self-host) |
| WebdriverIO | ✅                | ⚠️ Manual    | ✅ Custom     | Free                  |

For free + capable parallelism: Playwright wins.

---

## 6. API testing

### 6.1 Playwright

```typescript
const response = await request.post("/citations", { data: payload });
expect(response.ok()).toBeTruthy();
const body = await response.json();
```

First-class `APIRequestContext`:

- Shares cookies with browser.
- Typed JSON.
- Built-in HAR recording.
- Works as a worker fixture.

### 6.2 Cypress

```javascript
cy.request({ method: "POST", url: "/citations", body: payload }).then(
  (response) => {
    expect(response.status).to.eq(201);
  },
);
```

- Basic HTTP client.
- No typed responses.
- No HAR.
- Supports JS only.

### 6.3 Selenium

No built-in API client. Teams use:

- Java: RestAssured.
- Python: requests.
- C#: HttpClient.

### 6.4 WebdriverIO

Limited. Teams use axios or fetch alongside WDIO commands.

### 6.5 Decision

| Need                      | Best                   |
| ------------------------- | ---------------------- |
| UI + API in one framework | Playwright             |
| Strong typed API client   | Playwright             |
| Postman-grade API tests   | Postman (specialised)  |
| Java REST testing         | Selenium + RestAssured |

For "one framework for UI + API": Playwright.

---

## 7. Network interception

### 7.1 Playwright

```typescript
await page.route("**/api/**", (route) => route.fulfill({ status: 500 }));
await page.waitForResponse("**/api/x");
```

- `page.route` with continue/fulfill/abort.
- `waitForResponse` / `waitForRequest`.
- HAR recording and replay.
- WebSocket mocking.

### 7.2 Cypress

```javascript
cy.intercept("POST", "/api/citations", { statusCode: 201, body: {} });
cy.intercept("POST", "/api/citations").as("save");
cy.wait("@save");
```

- `cy.intercept` powerful — declarative.
- Alias support for waiting.
- Comparable to `page.route` in capability.
- Cleaner syntax than Playwright in many cases.

### 7.3 Selenium

No native interception. Workarounds:

- BrowserMob Proxy
- Selenium 4 + CDP (Chromium only)
- BrowserStack Web Inspector

### 7.4 WebdriverIO

- DevTools mode: `browser.mock('/api/**', { ... })`.
- WebDriver mode: limited.

### 7.5 Decision

| Need                       | Best                             |
| -------------------------- | -------------------------------- |
| Most flexible interception | Playwright (or Cypress for SPAs) |
| Cleanest mock syntax       | Cypress (`cy.intercept`)         |
| Cross-browser interception | Playwright                       |
| Legacy Selenium suite      | Selenium + BrowserMob            |

---

## 8. Component testing

| Tool        | Component support               | Frameworks                  |
| ----------- | ------------------------------- | --------------------------- |
| Playwright  | `@playwright/experimental-ct-*` | React, Vue, Svelte, Solid   |
| Cypress     | First-class, mature             | React, Vue, Svelte, Angular |
| Selenium    | None (E2E only)                 | —                           |
| WebdriverIO | Via Stencil/Vue extension       | Limited                     |

For component-level testing alongside E2E: Cypress or Playwright. Cypress's component testing is more polished today.

---

## 9. Mobile

### 9.1 Playwright

- Mobile emulation (viewport, UA, touch) via `devices` presets.
- WebKit IS Safari engine — real Safari testing without a Mac.
- ❌ No native mobile app support.

### 9.2 Cypress

- Mobile emulation only.
- ❌ No native mobile.
- ❌ No WebKit (Safari is experimental).

### 9.3 Selenium

- Selenium IDE for mobile.
- **Appium** (Selenium-based) for native iOS/Android.
- Most mature mobile story.

### 9.4 WebdriverIO

- Best mobile story for JavaScript.
- WDIO + Appium is the canonical stack.
- Same test code for web + mobile.

### 9.5 Decision

| Need                        | Best                 |
| --------------------------- | -------------------- |
| Mobile web emulation        | Playwright           |
| Native mobile, JS team      | WebdriverIO + Appium |
| Native mobile, Java team    | Selenium + Appium    |
| Mobile web with real Safari | Playwright (WebKit)  |

---

## 10. Debugging

### 10.1 Playwright

- **Trace Viewer** — time-travel through past test runs with DOM snapshots, network, console.
- **UI Mode** — interactive runner with watch mode, live page, pickable locators.
- **Inspector** — pause and step.
- **Codegen** — record actions, generate code.

The most powerful debugging toolkit in any browser automation tool today.

### 10.2 Cypress

- **Time-travel debugger** — built into the test runner UI.
- Hover over commands to see DOM snapshots.
- Excellent developer experience.
- No standalone trace viewer.

### 10.3 Selenium

- ❌ No built-in trace.
- Manual logging required.
- Visual debugging via IDE plugins.

### 10.4 WebdriverIO

- Basic timeline.
- Configurable logging.
- Less polished than Playwright or Cypress.

### 10.5 Decision

For debugging UX: Playwright or Cypress. Selenium is dramatically behind.

---

## 11. Reporting & CI

### 11.1 Playwright

- HTML, JUnit, JSON, blob (for sharding), custom Reporter API.
- GitHub Actions annotations via `github` reporter.
- Allure, ReportPortal integrations.
- Trace files for failure post-mortem.

### 11.2 Cypress

- Mocha-style reporters.
- Cypress Cloud has dashboard, recordings, flake detection.
- Open-source: manual JUnit / mochawesome.

### 11.3 Selenium

- Framework-dependent (TestNG, JUnit, etc.).
- Allure, Extent Reports.
- Manual screenshot capture.

### 11.4 WebdriverIO

- Allure, Spec, JUnit, JSON.
- Strong ecosystem of reporters.

### 11.5 CI

|             | Native CI support | Docker images        |
| ----------- | ----------------- | -------------------- |
| Playwright  | ✅ Excellent      | Official MS image    |
| Cypress     | ✅ Excellent      | Official image       |
| Selenium    | ✅ via Grid       | Selenium Grid images |
| WebdriverIO | ✅ Good           | Community images     |

---

## 12. Language support

|             | JS/TS | Python | Java | C#  | Ruby | Go           |
| ----------- | ----- | ------ | ---- | --- | ---- | ------------ |
| Playwright  | ✅    | ✅     | ✅   | ✅  | ❌   | ❌           |
| Cypress     | ✅    | ❌     | ❌   | ❌  | ❌   | ❌           |
| Selenium    | ✅    | ✅     | ✅   | ✅  | ✅   | (unofficial) |
| WebdriverIO | ✅    | ❌     | ❌   | ❌  | ❌   | ❌           |

Java and Python teams typically pick Selenium. Python's Playwright SDK is solid; Java is somewhat behind but usable.

---

## 13. Ecosystem

### 13.1 Playwright

- Maturity: medium-high (2020 launch).
- Plugin ecosystem: growing (test fixtures, custom reporters, framework integrations).
- Documentation: excellent.
- Community: active, growing fast.

### 13.2 Cypress

- Maturity: high (2017).
- Plugin ecosystem: massive (1500+ plugins).
- Documentation: excellent.
- Community: large, mature.

### 13.3 Selenium

- Maturity: maximum (20+ years).
- Plugin ecosystem: largest by far.
- Documentation: comprehensive but uneven.
- Community: gigantic, mostly Java/Python.

### 13.4 WebdriverIO

- Maturity: medium (2015).
- Plugin ecosystem: solid (Appium, Sauce, BrowserStack official).
- Documentation: good.
- Community: smaller but engaged.

### 13.5 Vendor stability

- **Playwright**: Microsoft, well-funded.
- **Cypress**: Series C startup, commercial pressure.
- **Selenium**: Apache Foundation, vendor-neutral.
- **WebdriverIO**: Community-led, no commercial backer.

For 10-year horizon: Selenium and Playwright are safest bets. Cypress depends on Cypress.io continuing to invest. WDIO depends on community engagement.

---

## 14. Total cost

### 14.1 License costs

|             | Open-source | Commercial add-ons        |
| ----------- | ----------- | ------------------------- |
| Playwright  | Free        | None                      |
| Cypress     | Free        | Cloud: $67-150/user/month |
| Selenium    | Free        | Sauce Labs, BrowserStack  |
| WebdriverIO | Free        | Sauce, BrowserStack       |

### 14.2 Infrastructure costs

|             | CI cost driver                            |
| ----------- | ----------------------------------------- |
| Playwright  | CI minutes + storage (traces)             |
| Cypress     | CI minutes + Cypress Cloud (for parallel) |
| Selenium    | CI minutes + Grid hosting                 |
| WebdriverIO | CI minutes                                |

For free parallel: Playwright wins.

### 14.3 Engineer time

| Activity               | Playwright | Cypress        | Selenium | WDIO    |
| ---------------------- | ---------- | -------------- | -------- | ------- |
| Initial setup          | 1 hour     | 1 hour         | 4 hours  | 2 hours |
| Writing first 10 tests | 2 hours    | 2 hours        | 5 hours  | 3 hours |
| Debugging flaky test   | 30 min     | 30 min         | 2 hours  | 1 hour  |
| Cross-browser config   | 30 min     | (paid feature) | 2 hours  | 1 hour  |
| CI integration         | 2 hours    | 2 hours        | 4 hours  | 2 hours |

For onboarding speed: Playwright and Cypress tie. Selenium is slowest.

### 14.4 5-year TCO for a 50-engineer team

Estimating engineering cost at $150/hour fully-loaded, plus license/infra:

|                      | License | Engineering | Total  |
| -------------------- | ------- | ----------- | ------ |
| Playwright           | $0      | ~$200k      | ~$200k |
| Cypress (with Cloud) | ~$200k  | ~$200k      | ~$400k |
| Selenium             | $0      | ~$300k      | ~$300k |
| WebdriverIO          | $0      | ~$220k      | ~$220k |

(Highly approximate. Real numbers depend on suite size, complexity, churn.)

---

## 15. Migration

### 15.1 Selenium → Playwright

- Locator API is similar (CSS, XPath supported).
- Re-rewrite typically: 3–10 lines of Playwright per Selenium test.
- Cleanup: eliminate `WebDriverWait` / `ExpectedConditions` (auto-wait replaces).
- Effort: ~1 day per 20 tests of average complexity.

### 15.2 Cypress → Playwright

- Test structure (describe/it) is the same.
- `cy.get` → `page.locator`.
- `cy.intercept` → `page.route`.
- Async/await everywhere.
- Effort: ~1 day per 30 tests.

### 15.3 WebdriverIO → Playwright

- Most similar pairs. Same lazy locators, similar selectors.
- Mostly API renaming.
- Effort: ~1 day per 50 tests.

### 15.4 To Cypress from anywhere

- Forced to adopt the chained DSL.
- Cross-origin tests need rewriting around `cy.origin()`.
- Effort: comparable to other migrations.

### 15.5 Decision

For greenfield: pick Playwright unless you have a specific reason.

For migration: only migrate if you have a CONCRETE pain point — flake rate, cross-domain support, parallel cost. Don't migrate just because Playwright is newer.

---

## 16. Decision framework

```
Is your team writing in Java/Python/Ruby?
├── Yes → Selenium (or Playwright Python/Java if greenfield)
└── No, JavaScript/TypeScript
    │
    Do you NEED Cucumber BDD?
    ├── Yes → WebdriverIO + @wdio/cucumber-framework
    │
    Is the app SPA on one origin (no OAuth, no SSO)?
    ├── Yes
    │   ├── Want polished commercial dashboard? → Cypress
    │   └── Want free tooling? → Playwright
    │
    └── No (multi-domain, OAuth, SAML)
        │
        Need WebKit/Safari?
        ├── Yes → Playwright
        │
        Need IE11?
        ├── Yes → Selenium
        │
        Need native mobile alongside web?
        ├── Yes → WebdriverIO + Appium
        │
        Default → Playwright
```

---

## 17. Interview talking points

These are the concise answers interviewers expect when asking about tool selection.

### 17.1 "Why Playwright over Selenium?"

> "Three things. First, lazy Locator objects eliminate stale element exceptions — a constant maintenance burden in large Selenium suites. Second, built-in parallel workers and sharding remove the need for Selenium Grid setup. Third, the APIRequestContext lets us put UI and API tests in one framework. The trade-off: Java teams are better served by Selenium today; IE11 requires Selenium. For new JS/TS projects without those constraints, Playwright wins."

### 17.2 "Why Playwright over Cypress?"

> "Cross-domain. Any test touching an OAuth redirect requires `cy.origin()` in Cypress, which is fragile and has limitations. Playwright handles multiple origins transparently. Plus we needed WebKit coverage and first-class API testing — Cypress doesn't offer the latter. The trade-off: Cypress's Time-Travel Debugger and Cloud analytics are better on a pure single-origin SPA. For our multi-domain app, Playwright was clearly the right choice."

### 17.3 "Why Playwright over WebdriverIO?"

> "TypeScript developer experience. Playwright's fixture system, test.extend, APIRequestContext, and Trace Viewer are more polished. The trade-off: if we needed deep Appium mobile integration or first-class Cucumber, WDIO would be the better choice."

### 17.4 "When does Selenium still make sense?"

> "Three cases. First, language diversity — Java and Python teams have richer Selenium SDKs than Playwright equivalents. Second, IE11 — only Selenium supports it. Third, existing investment — a million-line Selenium suite where migration cost outweighs benefit. Also: regulated industries where W3C WebDriver compliance is mandated."

### 17.5 "What about Puppeteer?"

> "Puppeteer is what Playwright was built on. Same CDP-based approach for Chromium. Playwright adds: multi-browser support (Firefox, WebKit), auto-waiting, the Locator abstraction, a test runner with fixtures and parallel workers, Trace Viewer, UI Mode. Puppeteer is a browser automation LIBRARY; Playwright is a complete test framework. Don't pick Puppeteer for new test projects."

### 17.6 "What about Cypress's network mocking — isn't it cleaner?"

> "It is. `cy.intercept` is the cleanest API for mocking. Playwright's `page.route` is more flexible but more verbose. For pure SPA testing where the mocking syntax matters daily, Cypress has an edge. For multi-domain or mobile-web testing where flexibility matters more, Playwright wins."

---

## 18. Common questions

### 18.1 "Is Playwright really faster than Selenium?"

Per-command, yes — WebSocket has lower latency than HTTP for many small calls. For a 50-action test:

- Selenium 4 (HTTP): ~2.5 seconds of WebDriver round-trips.
- Playwright (CDP): ~0.5 seconds.

For a 5-second test, that's a 30% speedup. For a 60-second test, ~3%. Speedup depends on action density.

### 18.2 "Cypress Cloud is required for parallel — true?"

Sort of. Free: spec-file partitioning works (run `cypress run --spec "tests/a/**"` on machine 1, `"tests/b/**"` on machine 2). It's manual but free.

Cypress Cloud: $67–150/user/month gets you auto-balancing, recordings, flake detection.

### 18.3 "Does Playwright work with Vite / Next.js / Turbo?"

Yes. Modern frontends are transparent to Playwright (it talks to the browser, not the build tool). Some component-testing setups require config tweaks; standard E2E "just works."

### 18.4 "Can I run Playwright tests against Internet Explorer?"

No. Playwright doesn't support IE. If you need IE11: Selenium with IEDriverServer. Note that Microsoft has EOL'd IE — most teams shouldn't be testing against it.

### 18.5 "Is Selenium really 20× slower than Playwright?"

No, that's misleading marketing. Per-action latency is lower, but the bulk of test time is page loads, animations, network calls — same for all tools. Real-world differences are usually 10-30%.

### 18.6 "Can I migrate from Selenium incrementally?"

Yes. Write new tests in Playwright; keep old Selenium tests until they need significant refactoring; rewrite then. Run both suites in CI for 6–12 months during transition.

### 18.7 "What about a Cypress-style time-travel debugger in Playwright?"

UI Mode + Trace Viewer collectively cover this. UI Mode for live debugging during writing, Trace Viewer for post-mortem on failures. Many engineers prefer the two-tool model over Cypress's single time-travel debugger.

### 18.8 "Does Cypress still struggle with multiple tabs?"

Yes. Cypress doesn't natively support tab control. Workaround: ignore the second tab; assert that the link's `target="_blank"`; verify the new URL would open. For real multi-tab flows, you need Playwright or Selenium.

---

## Cross-references

- Mobile testing comparison: [`../../23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md`](../../23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md)
- Migration plan templates: [`Ch32 SDET Interview Prep`](../06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md)
- Architecture comparison sources: official docs for each tool
