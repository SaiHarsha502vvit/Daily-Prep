# Chapter 45 — AI Agents, MCP, and Playwright

**Navigation**: [← Enterprise API Client Library](./44_Enterprise_API_Client_Library.md) | [Index](../00_INDEX.md)

---

> **Prerequisites**: Ch01 Playwright Basics, Ch05 POM Architecture, Ch06 Custom Fixtures. AI tools amplify what you already know — they do not substitute for it.

---

## Why this chapter exists

In 2024 our team piloted AI-assisted test generation on a sprint. By the end of the sprint we had 140 new test files, CI was red on 90 of them, and three engineers spent two days deleting generated code that confidently called non-existent page methods.

We had given the AI a prompt and a screenshot. The AI had no access to the real DOM, couldn't run the tests, couldn't see the framework fixtures, and didn't know that our OrangeHRM locators break if you use `getByText` instead of `getByRole`. It hallucinated with complete confidence.

MCP (Model Context Protocol) is the fix. It gives AI models structured, real-time access to a running browser — so instead of guessing locators from a screenshot, the AI can click, read the accessibility tree, and generate tests from what's actually there.

This chapter covers: what MCP is under the hood, how to run the Playwright MCP server, how to wire it into a real workflow, and — critically — the seven failure modes we hit before we learned where AI helps and where it hurts.

---

## Table of Contents

1. [What MCP Is (and the Problem It Solves)](#1-what-mcp-is-and-the-problem-it-solves)
2. [Running the Playwright MCP Server](#2-running-the-playwright-mcp-server)
3. [Workflow 1 — AI-Assisted Locator Discovery](#3-workflow-1--ai-assisted-locator-discovery)
4. [Workflow 2 — AI-Assisted Test Scaffolding](#4-workflow-2--ai-assisted-test-scaffolding)
5. [Workflow 3 — AI-Assisted Flakiness Debugging](#5-workflow-3--ai-assisted-flakiness-debugging)
6. [Workflow 4 — Selector Healing After UI Changes](#6-workflow-4--selector-healing-after-ui-changes)
7. [The Seven Failure Modes (War Stories)](#7-the-seven-failure-modes-war-stories)
8. [Decision Framework — When to Use AI, When Not To](#8-decision-framework--when-to-use-ai-when-not-to)
9. [Integrating MCP Into Your CI Pipeline](#9-integrating-mcp-into-your-ci-pipeline)
10. [Practice Challenges](#10-practice-challenges)

---

## 1. What MCP Is (and the Problem It Solves)

### The old way: paste-and-pray

Before MCP, AI-assisted test writing looked like this:

1. Take a screenshot of the page
2. Paste it into Claude or ChatGPT
3. Ask it to write a Playwright test
4. Copy the generated code
5. Run it
6. Fix 60% of it because the locators are wrong, the waits are missing, and it calls `page.fill` on a custom React Select component that doesn't accept keyboard input

The root problem: the AI was guessing. It had a static image, not a live DOM. It didn't know your project's fixture setup. It didn't know that your `EmployeeSearchForm` uses a custom `waitForSearchSettled()` method instead of `waitForLoadState('networkidle')`.

### What MCP fixes

**MCP (Model Context Protocol)** is an open standard that defines how AI models communicate with external tool servers. Instead of a static prompt, the AI gets:

- A live connection to a running browser
- The ability to call `snapshot()` (accessibility tree), `click()`, `fill()`, `navigate()` as actual tool calls
- Real error output from real test runs
- Access to your file system (your POMs, fixtures, types)

The architecture:

```
┌──────────────────┐    JSON-RPC 2.0    ┌────────────────────────┐
│   AI Model       │ ◄────────────────► │  Playwright MCP Server │
│ (Claude/GPT/etc) │                    │  (chromium process)     │
└──────────────────┘                    └───────────┬────────────┘
                                                    │ CDP
                                                    ▼
                                         ┌──────────────────────┐
                                         │   Your App (browser) │
                                         └──────────────────────┘
```

The AI sends tool calls like:
```json
{ "method": "tools/call", "params": { "name": "browser_navigate", "arguments": { "url": "http://localhost:4200/pim" } } }
```

The MCP server executes them on the real browser and returns real results:
```json
{ "result": { "snapshot": "- navigation\n  - link 'PIM' [focused]\n- main\n  - heading 'Employee Management' [level 1]\n  - button 'Add Employee'" } }
```

Now the AI is working with what's actually there. No hallucination about locators that don't exist.

---

## 2. Running the Playwright MCP Server

### Install

```bash
npm install -D @playwright/mcp
```

### Basic startup

```bash
# Headed (you can see what's happening)
npx @playwright/mcp --browser chromium

# Headless (for CI or background use)
npx @playwright/mcp --browser chromium --headless

# With a fixed viewport
npx @playwright/mcp --browser chromium --viewport-size 1440,900
```

The server starts on `stdio` by default (for Claude Desktop / local AI tools) or you can bind it to a port for remote connections.

### Wire into Claude Desktop

Create or edit `~/.config/claude/claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "--browser", "chromium"],
      "env": {
        "BASE_URL": "http://localhost:4200"
      }
    }
  }
}
```

Restart Claude Desktop. You now have a browser in the AI's tool belt.

### Wire into Claude Code (CLI)

```bash
claude mcp add playwright -- npx @playwright/mcp --browser chromium
```

Verify:
```bash
claude mcp list
# playwright: npx @playwright/mcp --browser chromium ✓
```

### Available MCP tools

Once connected, the AI can call:

| Tool | What it does |
|------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_snapshot` | Get the accessibility tree of the current page |
| `browser_click` | Click an element by accessibility role/name |
| `browser_fill` | Fill an input by label |
| `browser_screenshot` | Take a screenshot |
| `browser_evaluate` | Run JavaScript in the page |
| `browser_wait_for` | Wait for an element/condition |
| `browser_select_option` | Select from a dropdown |
| `browser_hover` | Hover over an element |
| `browser_press_key` | Press a keyboard key |

---

## 3. Workflow 1 — AI-Assisted Locator Discovery

This is where MCP pays off most immediately. Instead of manually inspecting the DOM for every element, you let the AI navigate the real page and tell you the accessibility tree.

### The prompt

```
I need to add an employee search test. Navigate to http://localhost:4200/web/index.php/pim/viewEmployeeList
and give me the accessibility roles and names for:
1. The employee name search input
2. The employee ID search input
3. The search button
4. The table header row
```

### What the AI returns (with MCP)

```
From the accessibility snapshot:

Employee Name input:
  - role: textbox
  - accessible name: "Employee Name" (via label association)
  - recommended locator: page.getByRole('textbox', { name: 'Employee Name' })

Employee ID input:
  - role: textbox
  - accessible name: "Employee Id" (exact text match)
  - recommended locator: page.getByRole('textbox', { name: 'Employee Id' })
  ⚠️ WARNING: There are 3 textboxes with empty accessible names near this one.
  The label association is via .oxd-input-group wrapper — confirm with:
    page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).getByRole('textbox')

Search button:
  - role: button
  - accessible name: "Search"
  - recommended locator: page.getByRole('button', { name: 'Search' })

Table header:
  - role: row (inside a table with role "table")
  - children: columnheader "First (& Middle) Name", "Last Name", "Employee ID"...
```

Before MCP, discovering that the Employee ID input had label-via-wrapper ambiguity would have taken 20 minutes of DOM inspection. With MCP: 15 seconds.

### Integrate the locators into your POM

```typescript
// framework/components/pim/EmployeeSearchForm.ts
export class EmployeeSearchForm {
  private readonly employeeNameInput = this.page.getByRole('textbox', { name: 'Employee Name' });

  // The label-wrapper pattern the AI flagged — confirmed necessary
  private readonly employeeIdInput = this.page
    .locator('.oxd-input-group')
    .filter({ hasText: 'Employee Id' })
    .getByRole('textbox');

  private readonly searchButton = this.page.getByRole('button', { name: 'Search' });
```

---

## 4. Workflow 2 — AI-Assisted Test Scaffolding

### What AI is good at here

- Generating the Arrange-Act-Assert skeleton
- Writing test data factories given a TypeScript interface
- Adding soft assertions across multiple fields
- Suggesting test titles that follow AAA structure

### What to always hand to the AI

Never just a screenshot. Hand it:

1. Your POM file (so it knows the real method names)
2. Your fixture types (so it uses `test.extend` correctly)
3. The acceptance criteria

### Example prompt

```
I need a test for the employee search feature. Here's the search form POM:

[paste EmployeeSearchForm.ts]

Here's the fixture setup:

[paste framework/fixtures/orangehrm.fixture.ts]

Write a test that:
1. Searches for an employee by first name "Ashley"
2. Verifies at least one result row appears
3. Searches by employee ID "0001"
4. Verifies the row shows "Ashley Abel"

Use soft assertions for all verifications. The test is in
framework/tests/orangehrm/employee.search.spec.ts
```

### What the AI generates

```typescript
import { test, expect } from '../fixtures/orangehrm.fixture';

test.describe('Employee search', () => {
  test('finds employee by name and ID', async ({ pimPage }) => {
    await pimPage.navigate();

    // --- Search by name ---
    await pimPage.searchForm.fillEmployeeName('Ashley');
    await pimPage.searchForm.clickSearch();
    await expect.soft(pimPage.resultsGrid.getRows()).not.toHaveCount(0);

    // --- Search by ID ---
    await pimPage.searchForm.fillEmployeeId('0001');
    await pimPage.searchForm.clickSearch();
    const firstRow = pimPage.resultsGrid.getRows().first();
    await expect.soft(firstRow.getByRole('cell', { name: 'Ashley Abel' })).toBeVisible();
  });
});
```

This is good scaffolding. You'd still need to:
- Verify that `pimPage.searchForm.fillEmployeeName` matches your actual POM method name (it probably doesn't, and the AI knows this if you gave it the file)
- Add `test.use({ storageState: ... })` to pick up the auth fixture
- Handle the `waitForSearchSettled` timing (the AI doesn't know about your custom wait unless you tell it)

The ratio: AI saved 10 minutes of typing; you spent 3 minutes fixing framework-specific details. Net win.

---

## 5. Workflow 3 — AI-Assisted Flakiness Debugging

This is where MCP + trace files is a power combination.

### The workflow

1. You have a flaky test. It fails 1-in-5 runs.
2. You enable `trace: 'on-first-retry'` in the config.
3. You run until you capture a failure.
4. You hand the trace zip to the AI with the prompt:

```
Here is the Playwright trace for a flaky test (attached). The test is:
[paste test code]

The error is: "Timeout 15000ms exceeded waiting for selector '.oxd-table-cell' to be visible"

Walk me through the network waterfall in the trace. What was the app doing in the 2 seconds
before the timeout? What was the last network request? Did the spinner disappear before the
assertion?
```

### What good AI analysis looks like

With MCP accessing the trace file:

```
Looking at the trace timeline:

T=0ms: test click on Search button
T=120ms: POST /api/v1/employee/search — 200 OK, 47 employees returned
T=125ms: React re-render begins
T=140ms: Spinner appears (.oxd-loading-spinner visible)
T=890ms: Spinner disappears
T=891ms: React renders first result row
T=15000ms: Your assertion fires — TIMEOUT

The problem: your assertion at T=15000ms is the TEST TIMEOUT, not the wait timeout.
The spinner disappeared at T=890ms. If your waitForSearchSettled() only waits for
the spinner to disappear, it returns at T=890ms, then your assertion fires at T=891ms.
But between T=891ms and T=15000ms there are 8 more network requests: individual
employee avatar fetches. If any of those cause a re-render before your assertion, the
DOM resets.

Hypothesis: race condition between avatar image loads and the table re-render.
Fix: wait for `.oxd-table-cell:first-child` to be stable (not just visible).
```

That diagnosis — without MCP + trace access — would have taken 45 minutes of manual trace-viewer clicking. With MCP: 4 minutes.

---

## 6. Workflow 4 — Selector Healing After UI Changes

When the UI changes, locators break. The traditional fix: open every failing test, inspect the new DOM, update each selector. At scale (50+ tests), this is hours of work.

With MCP you can write a healing script:

```typescript
// scripts/heal-selectors.ts
import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const client = new Anthropic();

async function healSelectors(testFile: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL!);

  // Log in
  await page.fill('[name="username"]', process.env.ADMIN_USER!);
  await page.fill('[name="password"]', process.env.ADMIN_PASS!);
  await page.click('button[type="submit"]');

  const snapshot = await page.accessibility.snapshot();
  const testContent = fs.readFileSync(testFile, 'utf-8');

  await browser.close();

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Here is the current accessibility tree of the app:\n${JSON.stringify(snapshot, null, 2)}
      
Here is a test file with potentially broken selectors:\n${testContent}

Identify any selectors that no longer match elements in the accessibility tree.
For each broken selector, suggest the updated selector based on what IS in the tree.
Return only the updated file content with no explanation.`
    }]
  });

  return response.content[0].type === 'text' ? response.content[0].text : testContent;
}

// Usage
const testFile = process.argv[2];
if (!testFile) {
  console.error('Usage: tsx scripts/heal-selectors.ts <test-file>');
  process.exit(1);
}

healSelectors(testFile).then(healed => {
  const backupPath = testFile + '.bak';
  fs.copyFileSync(testFile, backupPath);
  fs.writeFileSync(testFile, healed);
  console.log(`Healed. Backup at ${backupPath}`);
});
```

Run it:
```bash
ANTHROPIC_API_KEY=... BASE_URL=http://localhost:4200 \
  tsx scripts/heal-selectors.ts framework/tests/orangehrm/employee.crud.spec.ts
```

**Critical limitation:** the script heals what it can see in the accessibility tree. If your test uses visual selectors (`.oxd-table-row:nth-child(2)`) that don't appear in the tree, the AI cannot heal them. Another reason to write accessible selectors first.

---

## 7. The Seven Failure Modes (War Stories)

### Failure 1: AI generates tests before the POM exists

We let the AI write 12 tests directly without giving it the POM. It invented method names (`page.searchEmployee()`, `page.getResultCount()`). Every test called methods that didn't exist. 

**Fix:** Always hand the AI the relevant POM files. Never let it invent the API.

### Failure 2: AI confuses retries with test logic

The AI generated a helper that called `searchEmployee` in a retry loop:
```typescript
// AI-generated "robust" helper
for (let i = 0; i < 3; i++) {
  try {
    await searchForm.search(name);
    break;
  } catch { await page.reload(); }
}
```

This masked real failures. The test passed despite the app being broken because it was retrying on the reload.

**Fix:** Retries belong in the Playwright config, not in test helpers. `retries: 2` handles transient flakiness. If a test needs a reload to succeed, that's a bug to report, not a pattern to encode.

### Failure 3: AI hallucinates accessibility names

Asked to write a test for the "Add Employee" button without MCP access, the AI used `getByRole('button', { name: 'Add' })`. The real button is `getByRole('button', { name: 'Add Employee' })`. The test failed in CI silently on a locator match that returned 0 elements because there was a `<button>Add</button>` elsewhere on the page and `getByRole` matched the wrong one.

**Fix:** Always use MCP to verify accessibility names before writing locators. `page.accessibility.snapshot()` is your source of truth, not guesswork.

### Failure 4: AI generates data-driven tests with hardcoded IDs

```typescript
// AI-generated
await page.goto(`/employee/12345/details`);
```

Employee 12345 existed in dev, not in staging, not in CI. The test passed locally for six weeks, failed in every other environment.

**Fix:** Tests must create their own data or use fixtures. Never hardcode database IDs in tests.

### Failure 5: AI misunderstands fixture scope

The AI generated a test using `page` from `test.use({ ... })` instead of the custom `orangehrmPage` fixture. The auth state wasn't loaded, so every test hit the login redirect. 

**Fix:** Paste your fixture type declarations into the AI's context before asking it to write tests.

### Failure 6: AI "fixes" flakiness by increasing timeouts

Asked to fix a flaky test, the AI added:
```typescript
test.setTimeout(120000);
await page.waitForTimeout(5000);
```

The test now passed by waiting longer. The underlying race condition — a loading spinner that occasionally fired twice — was still there.

**Fix:** Ask the AI to explain the root cause, not just suggest a fix. If the explanation is "increase timeout," demand a deeper analysis. Use the trace.

### Failure 7: AI treats all locators as equivalent

The AI suggested `page.locator('[data-test="search-btn"]')` without checking whether the `data-test` attribute existed. On the OrangeHRM demo it doesn't — it's a third-party app we don't control. The suggestion was technically valid Playwright but useless for this target.

**Fix:** Tell the AI which app you're targeting and whether you control the source. If you don't control the DOM, rely on accessible roles and text, not `data-*` attributes.

---

## 8. Decision Framework — When to Use AI, When Not To

```
Is the task locator discovery?
├── Yes → Use MCP. Navigate live, snapshot, extract. Fast and accurate.
└── No
    Is the task test scaffolding from a known POM?
    ├── Yes → Use AI with POM in context. Review method names. Net win.
    └── No
        Is the task flakiness diagnosis from a trace?
        ├── Yes → Use AI with trace zip. Much faster than manual trace viewer.
        └── No
            Is the task "write tests for a new feature"?
            ├── Yes → AI drafts, you review every assertion. Never ship AI tests without review.
            └── No
                Is the task selector healing after a UI refactor?
                ├── Yes → Use healing script with accessibility snapshot. Check results.
                └── No → Write it yourself. AI adds noise for unfamiliar frameworks.
```

### The things AI consistently gets wrong in SDET work

| Task | AI performance | Why |
|------|---------------|-----|
| Locator discovery (with MCP) | Excellent | Real DOM, no guessing |
| Test scaffold from existing POM | Good | Clear API contract to follow |
| Understanding custom fixture scope | Poor | Project-specific context, not in training |
| Diagnosing timing bugs | Good with trace, poor without | Needs actual timeline data |
| Writing data factories | Good | TypeScript types provide structure |
| Understanding `test.describe.serial` vs `fullyParallel` | Poor | Nuanced interaction, often wrong |
| POM design decisions (split vs merge) | Poor | Requires lived experience with scale |
| Choosing retry strategy | Poor | Conflates symptom with cause |

---

## 9. Integrating MCP Into Your CI Pipeline

The Playwright MCP server can run in CI for automated locator healing, but it's expensive and slow. The practical CI pattern:

### Pattern A: Pre-merge locator validation

```yaml
# .github/workflows/locator-check.yml
name: Locator health check
on:
  pull_request:
    paths: ['framework/pages/**', 'framework/components/**']

jobs:
  locator-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: framework
      - name: Start app
        run: docker compose up -d
      - name: Wait for app
        run: npx wait-on http://localhost:4200 --timeout 60000
      - name: Run locator smoke
        run: npm run test -- --grep @locator-smoke
        working-directory: framework
        env:
          BASE_URL: http://localhost:4200
```

Tag your POM-verification tests `@locator-smoke`. These run a minimal test per page — just navigation + one locator assertion — to catch drift without running the full suite.

### Pattern B: Nightly accessibility snapshot diff

```typescript
// scripts/snapshot-diff.ts
// Runs nightly, compares today's accessibility snapshot to yesterday's
// Flags: roles removed, names changed, new elements added
// Output: snapshot-diff.json consumed by the morning standup dashboard
```

This gives you early warning that the UI changed before your tests break.

### Pattern C: On-demand healing (not automated)

Automated healing in CI is risky — an AI that auto-commits "healed" selectors can introduce subtle bugs. The safer pattern: the healing script runs locally on a developer's machine, produces a diff, the developer reviews it, then commits.

```bash
# Developer workflow after a UI redesign
npm run heal -- framework/tests/orangehrm/
git diff framework/tests/  # review what changed
npm test                    # confirm green
git add -p                  # commit intentionally
```

---

## 10. Practice Challenges

### Challenge 1 — Locator discovery (30 min)

1. Start the OrangeHRM demo (or any app you're testing).
2. Configure the Playwright MCP server.
3. Ask Claude (with MCP) to give you the full accessibility tree for the login page.
4. Compare what it returns to what you'd have guessed from a screenshot.
5. Write three locators from the snapshot, run them against the real page.

### Challenge 2 — Flakiness analysis (45 min)

1. Take any existing flaky test.
2. Enable `trace: 'on-first-retry'`.
3. Run until you capture a failure.
4. Hand the trace to Claude with the error message.
5. Document: what did Claude find? Was the root cause in the trace?

### Challenge 3 — Test generation with context (1 hr)

1. Pick a page in your app you haven't written tests for yet.
2. Hand Claude the relevant POM file + fixture declarations.
3. Ask it to write 3 tests covering the main user flows.
4. Run the generated tests without modification. Count how many pass.
5. Fix the failures. What were the most common AI mistakes?

### Challenge 4 — Build the healing script (2 hr)

Implement the `heal-selectors.ts` script from Section 6. Run it against one of your test files after deliberately breaking 3 locators. How accurate is the healing? Where does it fail?

---

**What's next:**

- **Ch 26** — Flakiness Diagnosis. The systematic framework that AI diagnosis is best paired with.
- **Ch 43** — War Stories. The lived failures that inform every AI interaction boundary.
- **Ch 44** — Enterprise API Client. How to hand typed client code to the AI so it generates correct API test scaffolding.


---

## Reality Check

**"AI can replace test case design"** ? AI generates test cases based on patterns in training data. It cannot understand: business context (why this edge case matters to YOUR users), regulatory requirements (GDPR test scenarios specific to your data handling), or system-specific failure modes (your database timeout behavior under your load patterns). AI accelerates test generation; humans provide the domain knowledge that makes tests valuable.

**"AI-generated locators are reliable"** ? AI suggests locators based on DOM structure analysis, but it cannot evaluate: dynamic ID stability (IDs generated by frameworks change between builds), test-specific attributes (data-testid was added specifically for automation), or component re-render behavior (React reconciliation may replace the DOM element). Always validate AI-suggested locators against your application specifics.

**"MCP servers automate everything"** ? Model Context Protocol enables AI agents to call tools, but the agent still needs: correct problem understanding (what to test), appropriate tool selection (which MCP tool to use), and result interpretation (was the test outcome correct?). MCP is plumbing for AI agent capabilities, not intelligence. The quality of AI-driven testing depends on the prompts and orchestration, not just the tool availability.

**"AI-powered test maintenance eliminates flakiness"** ? AI can detect and fix broken locators (selector changed, element moved), but it cannot fix: timing-dependent flakiness (race conditions require understanding the application async flow), data-dependent flakiness (test assumes data exists that was cleaned up), or environment-dependent flakiness (CI runner has different characteristics). AI handles structural changes; humans handle behavioral changes.

**"Natural language test descriptions replace code"** ? Natural language tests like verify user can purchase a product lack precision: which user (new, existing, admin)? Which product (in-stock, backordered, digital)? Which purchase path (cart, buy-now, subscription)? Natural language is good for describing test INTENT; code is necessary for describing test PRECISION. Use natural language for test planning, code for test execution.
