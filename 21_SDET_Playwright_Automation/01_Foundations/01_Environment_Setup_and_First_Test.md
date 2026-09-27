# 01. Environment Setup and Your First Playwright Test

**Navigation**: [← Start Here](../README.md) | [Index](../00_INDEX.md) | [→ Foundations](./00_SDET_Foundations_Mindset.md)

---

## 5W1H — Why This Chapter Exists

- **WHAT**: Install Node.js, VS Code, and Playwright — write and run your first working test — use Inspector and Codegen as real debugging tools.
- **WHY**: Every other chapter in this curriculum assumes you already have a working Playwright environment. This chapter bridges that gap. Do this once, then never again.
- **WHO**: Anyone who has not yet run `npm init playwright@latest` on their machine.
- **WHEN**: Before reading Chapter 00 (Foundations) or Chapter 01 (TS Basics). This is your true Day Zero.
- **HOW**: Step-by-step with real commands, real expected output, and a real test you write yourself from scratch.

---

## Cross-Links

After setup, continue here in order:

- [`01_Playwright_TS_Basics.md`](./01_Playwright_TS_Basics.md) — reads this after setup; explains async/await and the Browser→Context→Page→Locator hierarchy in depth.
- [`00_SDET_Foundations_Mindset.md`](./00_SDET_Foundations_Mindset.md) — read after setup for the mindset shift from script-runner to SDET.
- [`09_Parallel_Execution_Workers.md`](../02_Test_Architecture/09_Parallel_Execution_Workers.md) — the full `playwright.config.ts` deep-dive (workers, retries, projects, trace, reporter).

---

## 1. Install Node.js

### Why Node.js at all?

Playwright is a Node.js library. When you run `npx playwright test`, Node.js executes your TypeScript test files, manages the browser processes, and collects results. Without Node.js, there is no Playwright.

### Check if you already have it

Open a terminal (PowerShell on Windows, Terminal on macOS/Linux) and run:

```bash
node --version
npm --version
```

**Expected output if installed:**

```
v20.13.1
10.5.2
```

You need Node.js **18 or higher**. If you see `v16.x.x` or lower, update. If you see `'node' is not recognized`, install from scratch.

### Download and install

Go to **[nodejs.org/en/download](https://nodejs.org/en/download)** and download the **LTS (Long Term Support)** version. LTS is the production-stable line — it gets security patches for years. The "Current" version is for experimentation.

On Windows: run the `.msi` installer, accept defaults. No configuration needed.  
On macOS: run the `.pkg` installer, or use Homebrew: `brew install node`.  
On Linux (Ubuntu/Debian): use the NodeSource repository for an up-to-date version.

### Verify the install

Close and reopen your terminal (required on Windows — the PATH variable needs to reload), then:

```bash
node --version
npm --version
```

Both commands should now return version numbers. If `node` still says "not recognized", restart your machine.

---

## 2. Install VS Code + Playwright Extension

### VS Code

Download from **[code.visualstudio.com](https://code.visualstudio.com)**. Accept defaults during installation.

### Extensions to install

Open VS Code, press `Ctrl+Shift+X` (Extensions panel), and install these three:

| Extension                       | Publisher | What it gives you                                                    |
| ------------------------------- | --------- | -------------------------------------------------------------------- |
| **Playwright Test for VS Code** | Microsoft | Sidebar test runner, run/debug individual tests, live locator picker |
| **ESLint**                      | Microsoft | Underlines TypeScript/JavaScript code style errors inline            |
| **Prettier - Code formatter**   | Prettier  | Auto-formats your code on save — keeps test files consistent         |

### What the Playwright extension actually does

Once installed, a beaker icon appears in the VS Code sidebar. Click it to see:

- **All your tests listed** — click the ▶ play button next to any test to run just that one.
- **Debug mode** — click the bug icon to open Inspector on a specific test.
- **Pick locator** — click any element in the live browser window and get the recommended Playwright locator pasted into your editor.

This extension is how you run individual tests during development without typing CLI commands each time.

---

## 3. Create Your First Playwright Project

Open a terminal **in the folder where you want to create your project**. Run:

```bash
mkdir my-automation && cd my-automation
npm init playwright@latest
```

The CLI will ask you several questions. Here are the correct choices for a TypeScript setup:

```
✔ Do you want to use TypeScript or JavaScript?
  › TypeScript

✔ Where to put your end-to-end tests?
  › tests

✔ Add a GitHub Actions workflow? (y/N)
  › N   (say Yes later when you need CI — keep it simple for now)

✔ Install Playwright browsers (can be done manually via 'npx playwright install')? (Y/n)
  › Y
```

The installer downloads the Chromium, Firefox, and WebKit browser binaries (~300MB total). This takes 1–3 minutes on a fast connection.

**Expected output (end of install):**

```
✔ Success! Created a Playwright project at /path/to/my-automation

Inside that directory, you can run several commands:

  npx playwright test
    Runs the end-to-end tests.

  npx playwright test --ui
    Starts the interactive UI mode.

  npx playwright codegen
    Auto generate tests with codegen.
```

### Generated project structure

```
my-automation/
├── playwright.config.ts         ← ALL config lives here (Ch09 deep-dive)
├── package.json                 ← Node.js project metadata and scripts
├── package-lock.json            ← exact dependency versions (commit this to git)
├── tests/
│   └── example.spec.ts          ← your first test file — already runnable
└── tests-examples/
    └── demo-todo-app.spec.ts    ← a richer example to study, not for running
```

**What each file does:**

- **`playwright.config.ts`** — controls browsers to test, parallelism, retries, timeouts, trace/screenshot/video recording, and base URL. Every option you'll ever need lives here. Chapter 09 explains each setting.
- **`package.json`** — declares `@playwright/test` as a dev dependency and defines any npm scripts you add (`npm run test`, etc.).
- **`tests/example.spec.ts`** — a working test file you can run immediately. Read it to understand the basic structure.
- **`tests-examples/demo-todo-app.spec.ts`** — a reference implementation demonstrating 15+ Playwright patterns (forms, navigation, assertions). Study this file; don't run it as part of your suite.

---

## 4. Run Your First Test

With the project created, run the example test in three different modes:

```bash
npx playwright test                     # run all tests headless (no visible browser)
npx playwright test --headed            # run with visible browser windows
npx playwright test example.spec.ts     # run only the example file
```

**What passing output looks like:**

```
Running 6 tests using 4 workers

  ✓  [chromium] › example.spec.ts:3:5 › has title (1.2s)
  ✓  [chromium] › example.spec.ts:8:5 › get started link (2.1s)
  ✓  [firefox]  › example.spec.ts:3:5 › has title (1.8s)
  ✓  [firefox]  › example.spec.ts:8:5 › get started link (2.4s)
  ✓  [webkit]   › example.spec.ts:3:5 › has title (1.4s)
  ✓  [webkit]   › example.spec.ts:8:5 › get started link (1.9s)

  6 passed (5.3s)
```

The same 2 tests ran across 3 browsers (Chromium, Firefox, WebKit) — that is why you see 6 results. This is cross-browser testing by default.

**What failing output looks like:**

```
  1) [chromium] › example.spec.ts:8:5 › get started link ────────────────────

    Error: Timeout 30000ms exceeded.
    Call log:
      - waiting for locator('a:has-text("Get started")')...

      2 |   await page.goto('https://playwright.dev/');
    > 3 |   await page.getByRole('link', { name: 'Get started' }).click();
        |                                                          ^

  1 failed
```

The error message tells you: which test, which line, which locator, and how long it waited. This is deliberately descriptive — use it.

### Open the HTML report

After any test run, Playwright generates an HTML report:

```bash
npx playwright show-report
```

This opens a browser window with:

- Pass/fail status for every test
- Duration, browser, and worker info
- Attached screenshots for failed tests
- Traces and videos (if configured in `playwright.config.ts`)

The report is your first debugging tool. **Always open it when a test fails.**

---

## 5. The Inspector — Your Best Debugging Tool

The Playwright Inspector is a step-by-step debugger for your tests. It opens a GUI alongside the browser.

```bash
npx playwright test --debug
```

Or, to debug a single test file:

```bash
npx playwright test example.spec.ts --debug
```

### What Inspector shows you

When the Inspector opens, the test is paused on the first action. You see:

- **Left panel**: your test source code, highlighted at the current step.
- **Right panel (browser)**: the live browser at the current state.
- **Bottom panel**: a log of completed actions with their locators and timing.
- **Orange highlights**: when you hover over a locator in the source, the element it matches is highlighted in the browser.

### Step through your test

| Button       | Action                                           |
| ------------ | ------------------------------------------------ |
| ▶ Continue   | Run until the next `page.pause()` or end of test |
| ⏭ Step Over | Execute the current action and pause on the next |
| 🔁 Restart   | Start the test from the beginning                |

### Pause programmatically

Add `await page.pause()` anywhere in your test to freeze execution at that exact point:

```typescript
test("debug pause example", async ({ page }) => {
  await page.goto("https://playwright.dev");
  await page.pause(); // ← Inspector freezes here — inspect the page manually
  await page.getByRole("link", { name: "Get started" }).click();
});
```

When `page.pause()` is reached, the Inspector pauses. You can interact with the live browser, inspect DOM elements, and continue when ready.

### The Pick Locator button

In the Inspector, click the **"Pick locator"** button (crosshair icon). Then click any element in the browser. Playwright suggests the best locator for that element and shows it in the Inspector panel.

This is how you discover locators for elements you haven't seen before — especially useful on complex enterprise apps where elements have no `data-testid` attributes.

---

## 6. Codegen — Record Interactions as Code

Codegen opens a browser and records every click, fill, and navigation as Playwright TypeScript code:

```bash
npx playwright codegen https://example.com
```

You will see two windows open: the live browser you interact with, and a code panel showing the generated TypeScript in real time.

**Example of what codegen generates:**

```typescript
// Generated by Playwright Codegen — DO NOT USE AS-IS
import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  await page
    .locator(
      "#__docusaurus > div.main-wrapper > div > div > div.hero > div > a",
    )
    .click();
  await expect(
    page.locator(
      "#__docusaurus_skipToContent_fallback > article > div > div > header > h1",
    ),
  ).toContainText("Installation");
});
```

### ❌ Do NOT paste codegen output directly into your test suite

Codegen output has three serious problems:

1. **Fragile CSS/XPath locators** — `#__docusaurus > div.main-wrapper > div > div > div.hero > div > a` breaks the moment someone changes the DOM structure. Any refactor, any class rename, any React component restructure breaks this locator.

2. **No Page Object Model** — all selectors are hard-coded inline. When the page changes, you must find and fix every test that uses this locator, instead of fixing it once in a POM class.

3. **No semantic meaning** — `#__docusaurus > div.main-wrapper > ...` tells you nothing about WHAT this element is. `getByRole('link', { name: 'Get started' })` immediately communicates intent.

### ✅ Use codegen to DISCOVER, not to generate

The right use of codegen:

1. Open codegen on the page you're testing.
2. Click the element you want to interact with.
3. Look at what Playwright generates — does it suggest `getByRole`, `getByText`, or `getByTestId`? That is the **signal** Playwright is giving you about what is semantically correct.
4. Close codegen. Write the proper locator yourself in your POM class.

**The rule:** codegen is a locator explorer, not a test generator.

---

## 7. Your First Real Test (Not the Example)

The generated `example.spec.ts` uses `playwright.dev` as a test target. Let's write a test for the same site from scratch, intentionally, so you understand every line.

Create a new file `tests/playwright-site.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("Playwright.dev: Get Started link navigates to installation docs", async ({
  page,
}) => {
  // ── Step 1: Navigate to the site ─────────────────────────────────────────
  await page.goto("https://playwright.dev");
  // page.goto() sends a CDP navigation command to Chromium.
  // await resolves when the browser reports navigation is complete.
  // baseURL from playwright.config.ts would override this if configured,
  // but we're using an absolute URL here for clarity.

  // ── Step 2: Find the 'Get started' link ───────────────────────────────────
  const getStartedLink = page.getByRole("link", { name: "Get started" });
  // getByRole() is the PREFERRED Playwright locator.
  // WHY: it queries by ARIA role ('link') and accessible name ('Get started').
  // This is how screen readers and assistive technology find elements.
  // If the accessible name changes, the test breaks — which is CORRECT,
  // because the UI has changed in a user-visible way.
  // Contrast with: page.locator('#hero-link') — breaks on any DOM restructure
  // even when the button still says 'Get started' and works for users.

  // ── Step 3: Click the link ────────────────────────────────────────────────
  await getStartedLink.click();
  // click() is a Promise<void> — we await it to ensure the click completes
  // and the CDP round-trip (Node.js → Chromium) has resolved before we proceed.

  // ── Step 4: Assert the URL contains '/docs/intro' ─────────────────────────
  await expect(page).toHaveURL(/\/docs\/intro/);
  // expect(page).toHaveURL() is a RETRYING assertion.
  // It keeps checking the current URL until it matches the regex, or times out.
  // Using a regex (/\/docs\/intro/) instead of the full URL makes the assertion
  // resilient to query parameters or minor URL structure changes.

  // ── Step 5: Assert the 'Installation' heading is visible ─────────────────
  await expect(
    page.getByRole("heading", { name: "Installation" }),
  ).toBeVisible();
  // getByRole('heading') finds an <h1>, <h2>, <h3> etc. with the accessible name 'Installation'.
  // toBeVisible() retries until the element is in the DOM AND visible to the user.
  // This assertion proves: (a) navigation succeeded, (b) the correct page loaded,
  // (c) the heading is rendered and not hidden.
});
```

Run only this test:

```bash
npx playwright test playwright-site.spec.ts --headed
```

You will see Chromium open, navigate to `playwright.dev`, click "Get started", and land on the docs page. The test passes.

### Why each locator was chosen

| Element                | Locator Used                                     | Why this one                                              |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| "Get started" link     | `getByRole('link', { name: 'Get started' })`     | Semantic, readable, resilient to DOM structure changes    |
| "Installation" heading | `getByRole('heading', { name: 'Installation' })` | Finds the right heading level by meaning, not by selector |

**The hierarchy of Playwright locator strategies (best to worst):**

```
1. getByRole('button', { name: 'Submit' })     ← BEST: semantic, accessibility-aligned
2. getByLabel('Email address')                  ← form inputs tied to <label> element
3. getByPlaceholder('Enter your email')         ← inputs with placeholder text
4. getByText('Submit')                          ← exact text match (use with care)
5. getByTestId('submit-btn')                    ← data-testid attribute (requires dev cooperation)
6. page.locator('[data-automation-key="name"]') ← D365-specific attributes
7. page.locator('.css-class')                   ← FRAGILE: breaks on any styling change
8. page.locator('div > form > button:nth-child(2)') ← VERY FRAGILE: structural CSS
9. page.locator('//div[@class="btn"]/span')     ← XPath: last resort only
```

Use strategy 1 first. Only descend the list when the element genuinely has no accessible role or text.

---

## 8. Where to Go Next

- Read [`00_SDET_Foundations_Mindset.md`](./00_SDET_Foundations_Mindset.md) — the mindset before writing real tests: the testing pyramid, three pillars of reliability, professional vocabulary.
- Read [`01_Playwright_TS_Basics.md`](./01_Playwright_TS_Basics.md) — why `async/await` works, the full Browser→Context→Page→Locator hierarchy, how CDP round trips work.
- The setup you just did is a **practice sandbox** — your real work uses the enterprise structure described in Chapter 21 (`21_Enterprise_Project_Structure.md`), with separate `fixtures/`, `pages/`, `utils/`, and `specs/` folders.
- When you're ready for deeper config, read [`09_Parallel_Execution_Workers.md`](../02_Test_Architecture/09_Parallel_Execution_Workers.md) — every option in `playwright.config.ts` explained with production reasoning.

---

## 🏋️ Practice Challenges

### Challenge 1 (Multiple Choice) — Inspector vs Headed Mode

**Question:** What does `npx playwright test --debug` do differently from `npx playwright test --headed`?

Select the best answer:

A. `--debug` runs tests faster by skipping assertions; `--headed` runs all assertions.  
B. `--debug` opens the Playwright Inspector and pauses before the first action, giving you step-by-step control; `--headed` just makes the browser visible but runs at full speed without pausing.  
C. `--debug` generates a trace file; `--headed` does not.  
D. `--debug` uses Chromium only; `--headed` uses all configured browsers.

<details><summary>Answer</summary>

**B is correct.**

`--headed` runs the test at full speed with a visible browser. You can watch what happens, but the test doesn't pause. If it fails, you see the browser close quickly before you can inspect anything.

`--debug` opens the Playwright Inspector window alongside the browser and **pauses before the first action**. From there you use the Step Over button to execute one action at a time. You see the DOM state, the locator highlights, and the action log at every step. This is a true step-by-step debugger.

`--debug` is the correct tool for diagnosing a failing test. `--headed` is useful for a quick visual confirmation that a passing test is doing what you expect.

</details>

---

### Challenge 2 (Spot the Bug) — Codegen Output Used Directly

```typescript
// A colleague pasted this directly from Playwright Codegen output.
// Find at least THREE problems.

import { test, expect } from "@playwright/test";

test("login test", async ({ page }) => {
  await page.goto("https://myapp.example.com/login");
  page
    .locator("#root > div > div.container > form > input[type=email]")
    .fill("admin@example.com");
  page
    .locator("#root > div > div.container > form > input[type=password]")
    .fill("password123");
  page
    .locator("#root > div > div.container > form > button.btn-primary")
    .click();
  expect(page.locator(".dashboard-header")).toBeVisible();
});
```

<details><summary>Answer</summary>

**Problem 1 — Missing `await` on every action.**

`page.locator(...).fill()` returns a `Promise<void>`. Without `await`, the fill is fired and immediately forgotten — Node.js moves to the next line before the fill completes. The same issue on `.click()`. The assertions after these lines run before the actions have taken effect.

**Problem 2 — Brittle structural CSS locators.**

`#root > div > div.container > form > input[type=email]` is an 8-level structural selector. Any DOM change — a developer adds a wrapping `<div>`, renames the class, moves the form — breaks this locator immediately. The correct locator is `page.getByLabel('Email')` or `page.getByPlaceholder('Email address')`, both of which survive structural refactors.

**Problem 3 — `expect(locator).toBeVisible()` without `await`.**

`expect(page.locator('.dashboard-header')).toBeVisible()` returns a `Promise<void>` — it is a retrying assertion. Without `await`, the assertion starts running but the test function returns before it resolves. Playwright may or may not catch the failure depending on timing. This is a silent false-positive — the test appears to pass even when `.dashboard-header` is not visible.

**Problem 4 (bonus) — No Page Object Model.**

All locators are hard-coded inline in the test. When the login page changes, every test that logs in must be updated individually. The correct pattern is a `LoginPage` POM class with named methods (`loginPage.login(email, password)`), where the locators are maintained in one place.

</details>

---

### Challenge 3 (Write It Yourself) — Test the Internet Login Page

Write a complete, correct Playwright test for `https://the-internet.herokuapp.com/login` that:

1. Navigates to the login page.
2. Fills the username field with `admin`.
3. Fills the password field with `admin`.
4. Clicks the Login button.
5. Asserts the URL contains `/secure`.
6. Asserts the success flash message contains the text `You logged into a secure area!`.

Requirements:

- Use `getByLabel` or `getByRole` where possible, not structural CSS.
- Every action must have `await`.
- All assertions must use Playwright's retrying `expect(locator)` form.

<details><summary>Answer</summary>

```typescript
import { test, expect } from "@playwright/test";

test("Login with valid credentials navigates to secure area", async ({
  page,
}) => {
  // Navigate
  await page.goto("https://the-internet.herokuapp.com/login");

  // Fill credentials using getByLabel — the page uses <label> elements
  // that are properly associated with the inputs via `for` attribute.
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");

  // Click Login — getByRole finds the submit button by its accessible role and name
  await page.getByRole("button", { name: "Login" }).click();

  // Assert URL changed to /secure (retrying — waits for navigation to complete)
  await expect(page).toHaveURL(/\/secure/);

  // Assert success flash message contains the expected text (retrying)
  await expect(page.locator("#flash")).toContainText(
    "You logged into a secure area!",
  );
  // Note: toContainText() is used instead of toHaveText() because the flash
  // element contains additional whitespace and a close button (×).
  // toContainText() checks for a substring; toHaveText() checks exact text.
});
```

**Why `getByLabel` here:** The `the-internet.herokuapp.com` login page uses properly associated `<label for="username">` and `<label for="password">` elements. `getByLabel('Username')` finds the `<input>` linked to that label — this is the most semantic and accessible locator possible.

**Why `toContainText` not `toHaveText`:** The flash element's full text is `"You logged into a secure area!\n×"` (including a close-button character). `toHaveText()` checks the full text and would fail. `toContainText()` checks for a substring and passes.

</details>

---

**Navigation**: [← Start Here](../README.md) | [Index](../00_INDEX.md) | [→ Foundations](./00_SDET_Foundations_Mindset.md)


---

## Reality Check

**"npm init playwright covers all setup"**→ The generated config has defaults that rarely match production needs: tests in a tests directory (enterprise projects use tests/e2e, tests/api, etc.), all browsers enabled (CI runs should target one browser unless cross-browser is required), and no custom reporter configuration. The first test passes; the first real project requires significant config customization.

**"The default playwright.config.ts works for most projects"**→ Default config has no baseURL (tests use hardcoded URLs), no test retry (tests fail once and report failure), no screenshot-on-failure (no visual evidence of failures in CI), and runs all browsers. Production config needs: baseURL from environment variables, retry count of 1-2 for flaky mitigation, screenshot and trace on first retry, and a single browser for fast CI with periodic cross-browser runs.

**"Installing all browsers is necessary"**→ Playwright installs Chromium, Firefox, and WebKit by default, consuming roughly 500MB of disk. Most test runs target one browser (Chromium). Set PLAYWRIGHT_BROWSERS_PATH to cache browsers across projects. In CI, use playwright install chromium to install only the needed browser, reducing container size and build time.

**"Test files can go anywhere"**→ Playwright discovers tests based on the testDir config setting and testMatch glob pattern. Placing test files outside the configured directory makes them invisible to the runner. Naming files without the .spec.ts or .test.ts suffix (depending on your config) also makes them invisible. Convention in enterprise projects: tests/e2e/**/*.spec.ts for end-to-end, tests/api/**/*.spec.ts for API tests.

**"Playwright tests run in a browser"**→ Playwright test CODE runs in Node.js. It CONTROLS browsers through the CDP (Chrome DevTools Protocol) or equivalent protocol. The test code and the browser are separate processes communicating over a WebSocket. This means: you cannot access browser DOM objects directly in test code, and browser JavaScript errors do not crash your test (unless you explicitly listen for them).
