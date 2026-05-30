# Chapter 45 — AI Agents, MCP, and Playwright

**Navigation**: [← Enterprise API Client Library](./44_Enterprise_API_Client_Library.md) | [Index](../00_INDEX.md)

---

## 5W1H

| | |
|---|---|
| **WHAT** | Model Context Protocol (MCP), Playwright MCP server, AI-assisted test generation, AI-assisted debugging, agentic test maintenance |
| **WHY** | The SDET role is changing. AI tools can generate test scaffolding, debug flaky tests, and maintain selectors after UI changes. Knowing how to USE these tools — and when NOT to — is now a production skill. |
| **WHO** | SDETs who want to accelerate test writing and maintenance with AI, without replacing their engineering judgment with it |
| **WHEN** | After you understand the fundamentals (Ch01–Ch44). AI tools amplify what you already know; they do not replace understanding. |
| **HOW** | By understanding MCP architecture, running the Playwright MCP server, and integrating AI into your workflow at the right points |

---

## Table of Contents

1. [What Is MCP (Model Context Protocol)?](#1-what-is-mcp-model-context-protocol)
2. [Playwright MCP Server](#2-playwright-mcp-server)
3. [AI-Assisted Test Generation Workflow](#3-ai-assisted-test-generation-workflow)
4. [AI-Assisted Flakiness Debugging](#4-ai-assisted-flakiness-debugging)
5. [AI-Assisted Selector Maintenance](#5-ai-assisted-selector-maintenance)
6. [GitHub Copilot Integration in VS Code](#6-github-copilot-integration-in-vs-code)
7. [Limits — What AI Cannot Replace](#7-limits--what-ai-cannot-replace)
8. [Agentic Test Automation (Advanced)](#8-agentic-test-automation-advanced)
9. [Practice Challenges](#9-practice-challenges)

---

## 1. What Is MCP (Model Context Protocol)?

### The Problem MCP Solves

Before MCP, AI models operated in a bubble. You could paste code into a chat window, but the AI could not:
- Open a browser and see what your app actually looks like
- Click through a form to discover which locators exist
- Read the real DOM instead of guessing from a screenshot
- Run a test and read the actual error output

The result was **hallucination-heavy test generation**: the AI would confidently write selectors for elements that didn't exist, call Playwright APIs that were deprecated, or generate test flows that broke on step two.

**MCP (Model Context Protocol)** fixes this by giving AI models a structured, standardised way to interact with external tools — browsers, file systems, APIs, databases — in real time.

### What MCP Is

MCP is an open protocol (originally designed by Anthropic, now adopted widely) that defines how an AI model communicates with tool-providing servers. It is **not an API** — it is a protocol layer that sits between the AI and the tools.

Think of it like HTTP for tool use:
- HTTP defines how browsers and web servers communicate.
- MCP defines how AI models and tool servers communicate.

### MCP Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your AI Model                            │
│           (Claude, GitHub Copilot, Gemini, GPT-4)              │
│                                                                 │
│   "Navigate to /citations, find the grid, read row 1"          │
└────────────────────────┬────────────────────────────────────────┘
                         │  MCP Protocol (JSON-RPC over stdio/SSE)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     MCP Client                                   │
│     (built into your IDE: Claude Desktop, Cursor, VS Code)      │
│                                                                 │
│   Translates AI intent → structured tool calls                  │
│   Passes results back up to the AI                              │
└────────────────────────┬────────────────────────────────────────┘
                         │  Tool call definitions (JSON schema)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     MCP Server                                   │
│          (a local process: @playwright/mcp or similar)          │
│                                                                 │
│   Exposes tools the AI can call:                                │
│   - navigate(url)                                               │
│   - click(selector)                                             │
│   - fill(selector, value)                                       │
│   - getPageContent()                                            │
│   - screenshot()                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │  Playwright API calls
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              Playwright Browser Instance                         │
│           (Chromium / Firefox / WebKit)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Your Application                            │
│        (D365 CRM, JSP, ASPX, or any web app)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Matters for SDETs

With MCP, the AI does not guess what's on your page — it **sees the page**:
- It can navigate to your app and read the real DOM structure.
- It can discover actual `data-testid` attributes, ARIA roles, and Fluent UI component classes.
- It can take a screenshot and describe the layout.
- It generates locators based on **observation**, not hallucination.

This is a qualitative shift in what AI-assisted test writing can produce.

---

## 2. Playwright MCP Server

### Installation and Running

The official Playwright MCP server is published by the Playwright team:

```bash
npx @playwright/mcp@latest
```

This starts a local MCP server that gives any connected AI model a Playwright browser to control.

### Configuring in Claude Desktop

Claude Desktop (Anthropic's desktop app) supports MCP servers via a JSON config file.

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Config:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Restart Claude Desktop. You will see a browser icon or tool indicator showing the Playwright server is active.

### Configuring in Cursor

Cursor has a built-in MCP config panel. Add the same server definition under **Settings → MCP Servers**:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}
```

### Configuring in VS Code with GitHub Copilot

As of 2025, GitHub Copilot in VS Code supports MCP via the `.vscode/mcp.json` workspace file:

```json
{
  "servers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### What the AI Can Do With This

Once connected, the AI can:

| Capability | What It Means for You |
|---|---|
| Navigate to a URL | AI visits your actual app, not a made-up version |
| Inspect the DOM | AI reads real element structure: roles, labels, IDs |
| Click and interact | AI discovers form flows, modal triggers, navigation |
| Take screenshots | AI sees visual layout, not just raw HTML |
| Read console logs | AI spots JS errors happening during interaction |
| Generate locators | AI suggests selectors based on what it actually sees |

### ❌ What NOT to Do

- **Do not** let the AI write a full test suite and paste it directly into your codebase without review.
- **Do not** skip the POM and fixture architecture just because the AI generated inline code.
- **Do not** trust AI-generated locators without validating them in Playwright Inspector.
- **Do not** use AI-generated tests as your authoritative E2E suite — use them as starting scaffolding.

### ✅ What TO Do

- Use AI to **discover locators** on real pages you've never seen before.
- Use AI to **generate test structure** (the shape of the test), then apply your real patterns.
- Use AI to **brainstorm test cases** you might have missed.
- Apply the POM and fixture patterns from [Chapter 05](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) and [Chapter 06](../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) to anything the AI generates.

---

## 3. AI-Assisted Test Generation Workflow

This is a workflow you can use **today**. It treats AI as a fast junior who can scaffold — and you as the senior who designs and reviews.

### Step 1: Give the AI Your Context

The quality of AI output depends directly on the quality of your prompt. A generic prompt gets generic (useless) output. A context-rich prompt gets useful scaffolding.

**Weak prompt (what most people do):**
```
Write a Playwright test for the citations module.
```

**Strong prompt (context-rich):**
```
I'm testing a D365 CRM Citations module using Playwright + TypeScript.

Context:
- Our POM class is MasterSearchPage.ts, which has methods like
  searchForCitation(id: string) and waitForGridToLoad().
- Our fixture provides an `account` object: { accessToken, userId, email, role }.
- We use the APIUtils class to make HTTP calls. APIUtils.post(endpoint, headers, payload).
- We follow the Data Accumulator pattern: const data: TestData = { citationId: null }

Task:
Write a test that:
1. Creates a citation via the API (POST /citations) using the account fixture token.
2. Navigates to the citations grid in the UI.
3. Searches for the citation by ID.
4. Verifies it appears in the grid with status "PENDING".

Do NOT use page.waitForTimeout(). Do NOT put locators inline in the test.
Do NOT use `any` type for API responses.
```

### Step 2: Review the AI's Scaffolding

A typical AI response for the prompt above might look like this:

```typescript
// ❌ AI-generated output — DO NOT USE AS-IS
test('Creates citation and verifies in grid', async ({ page }) => {
  // Create citation via API
  const response = await page.request.post('https://api.example.com/citations', {
    headers: { 'Authorization': 'Bearer hardcoded-token-123' },
    data: { customerId: '42', amount: 150.00, type: 'PARKING' }
  });
  const citation = await response.json();
  const citationId = citation.id;

  await page.goto('https://d365.example.com/citations');
  await page.waitForTimeout(3000);  // ❌ Problem 1

  // Search for citation
  await page.fill('.ms-SearchBox-field', citationId);  // ❌ Problem 2
  await page.click('[data-testid="search-btn"]');
  await page.waitForTimeout(2000);  // ❌ Problem 1

  // Verify
  const row = page.locator('.ms-DetailsList-row').first();
  expect(await row.textContent()).toContain(citationId);  // ❌ Problem 3
});
```

### Step 3: Identify What's Wrong

| # | Problem | Fix |
|---|---|---|
| 1 | `page.waitForTimeout(3000)` — arbitrary sleep, will be flaky in CI | Replace with `expect(locator).toBeVisible()` or `waitForGridToLoad()` |
| 2 | Hardcoded token — will break immediately; exposes secrets | Use `account.accessToken` from the fixture |
| 3 | Inline raw locators in the test — violates POM | Move to `MasterSearchPage.ts` |
| 4 | `response.json()` returns `any` — no type safety | Define an interface, e.g., `CitationResponse` |
| 5 | No fixture for `account` — would collide or miss cleanup | Use the worker-scoped `account` fixture with `try/finally` |
| 6 | `page.request.post` directly — bypasses your `APIUtils` class | Use `APIUtils.post(endpoint, headers, payload)` |

### Step 4: The Corrected Version

```typescript
// ✅ Corrected — enterprise pattern from Ch06 + Ch23 + Ch44

import { test, expect } from '../fixtures/accountFixture';
import { APIUtils } from '../utils/APIUtils';
import { HeadersCrm } from '../factories/HeadersCrm';
import { PayloadsCitation } from '../factories/PayloadsCitation';
import { endpoints } from '../config/endpoints';
import { MasterSearchPage } from '../pages/MasterSearchPage';

interface CitationCreateResponse {
  id: string;
  status: string;
  amount: number;
}

interface TestData {
  citationId: string | null;
}

test('Creates citation via API and verifies it appears in grid', async ({
  page,
  account,
  request,
}) => {
  const data: TestData = { citationId: null };

  try {
    // Step 1: Create citation via API
    const headers = HeadersCrm.auth(account.accessToken, test.info().testId);
    const payload = PayloadsCitation.pending({ customerId: account.userId });

    const citation = await APIUtils.post<CitationCreateResponse>(
      request,
      endpoints.citations.create,
      headers,
      payload,
    );
    data.citationId = citation.id;

    // Step 2: Navigate to grid
    const searchPage = new MasterSearchPage(page);
    await searchPage.navigateToCitationsGrid();

    // Step 3: Search for the citation
    await searchPage.searchForCitation(data.citationId);
    await searchPage.waitForGridToLoad();

    // Step 4: Verify
    await expect(
      searchPage.getRowByCitationId(data.citationId),
    ).toBeVisible();

    await expect(
      searchPage.getStatusCellForCitation(data.citationId),
    ).toHaveText('PENDING');

  } finally {
    // Cleanup: delete citation so it doesn't pollute other tests
    if (data.citationId) {
      await APIUtils.delete(
        request,
        endpoints.citations.delete(data.citationId),
        HeadersCrm.auth(account.accessToken, test.info().testId),
      );
    }
  }
});
```

### The Critical Skill: Knowing What the AI Gets Wrong

This is the difference between an SDET who uses AI well and one who creates a maintenance nightmare:

| AI Mistake | Pattern It Violates | Fix |
|---|---|---|
| `page.waitForTimeout(3000)` | Flakiness under CI variability (Ch26) | `expect(locator).toBeVisible()` or POM wait method |
| Inline locators in test body | POM discipline (Ch05) | Move all selectors into the Page Object |
| Hardcoded tokens/credentials | Security and fixture architecture (Ch06, Ch14) | `account.accessToken` from worker-scoped fixture |
| `response.json()` typed as `any` | TypeScript safety (Ch27, Ch36) | Define typed response interface |
| No `try/finally` for cleanup | Test data lifecycle (Ch28) | Always clean up in `finally` |
| `page.request.post` directly | Enterprise API client (Ch23, Ch44) | Use `APIUtils.post<T>()` |
| CSS selectors based on visual class names | Brittle selector strategy (Ch02) | Use `getByRole`, `getByLabel`, `data-testid` |

---

## 4. AI-Assisted Flakiness Debugging

Flakiness diagnosis is one of the highest-value uses of AI because:
1. The AI has seen millions of test failure patterns.
2. You have the specific failure evidence (error message, stack trace, timing).
3. Combined, you get useful hypotheses in seconds instead of hours.

### The Core Workflow

```
Run failing test → Collect evidence → Feed to AI → Get hypotheses → Validate with traces
```

**Step 1: Collect complete evidence before going to AI.**

Gather:
- The full error message (not just the first line)
- The test code
- The Playwright trace or network log (if available)
- The CI environment where it fails (timing, parallelism)
- The failure rate ("fails 30% of the time" is important context)

**Step 2: Use a structured prompt.**

```
"This Playwright test fails in GitHub Actions CI about 30% of the time.
It always passes locally. The error is intermittent.

Error message:
  TimeoutError: Waiting for selector '.ms-DetailsList-row' timed out after 30000ms

Test code:
  [paste the 15-line test here]

CI environment:
  - 4 workers running in parallel
  - Node 20, Chromium on ubuntu-latest
  - Tests share the same test account for data setup

What are the 3 most likely root causes of this intermittent failure?"
```

**Step 3: Read the AI's hypotheses critically.**

A well-structured prompt typically produces useful hypotheses:

1. **Race condition on data visibility**: The API creates the record but D365 has a two-phase render — the list loads, then a second async call populates the rows. The test asserts on the row before the second call completes.

2. **Shared test account collision**: Four parallel workers all create citations against the same account. The search returns multiple rows; the assertion targets `.first()` which is a different test's citation.

3. **CI resource contention**: Chromium under CI has slower JavaScript execution than local. The `waitForGridToLoad()` assertion fires before the spinner disappears.

**Step 4: Validate with Playwright Trace Viewer.**

The AI can suggest causes, but only the trace tells you what actually happened:

```bash
npx playwright test --trace on
npx playwright show-trace test-results/trace.zip
```

The trace reveals:
- The exact network requests and their timing
- When DOM elements appeared and disappeared
- Whether a spinner was still visible at assertion time
- Whether a parallel test was manipulating the same account

> **Cross-reference**: [Chapter 26 — Flakiness Diagnosis and Fixing](./26_Flakiness_Diagnosis_and_Fixing.md) covers the full trace-first diagnosis workflow and the D365-specific timing traps (two-phase render, menuitem timing) that AI will not know about.

### What the AI Gets Right

- Recognises `page.waitForTimeout` as a flakiness source.
- Identifies missing `Promise.all` when attaching a listener before an action.
- Spots shared state in test fixtures that causes parallel test collision.
- Suggests retry configurations for known-flaky network operations.

### What the AI Gets Wrong

- It does not know your D365 two-phase render trap (Ch10, Ch17).
- It does not know your specific `account` fixture is worker-scoped (not test-scoped).
- It will sometimes suggest `waitForTimeout` as a fix — the opposite of what you need.
- It cannot read your actual Playwright trace file — you must read it yourself.

---

## 5. AI-Assisted Selector Maintenance

After a significant UI change, you may have 15–25 broken selectors across 10 test files. This is where AI produces its highest return on investment: not generating tests from scratch, but helping you find replacement selectors quickly.

### The Workflow

**Step 1: Run the broken test suite and capture JSON output.**

```bash
npx playwright test --reporter=json > results.json
```

**Step 2: Parse which selectors are failing.**

```bash
# Quick summary from the JSON output
node -e "
const r = require('./results.json');
r.suites.forEach(s => s.specs.forEach(spec =>
  spec.tests.forEach(t => t.results.forEach(res =>
    res.errors?.forEach(e => console.log(spec.title, ':', e.message?.split('\n')[0]))
  ))
));
"
```

**Step 3: Feed to AI with the updated page HTML.**

```
"A UI update broke this Playwright locator:
  page.locator('.ms-DetailsList-row .citation-amount')

The new page HTML for that area is:
  [paste 30–50 lines of relevant HTML]

Suggest 3 alternative locators in order of reliability, from most to least brittle.
Explain why you ranked them that way."
```

**Step 4: AI suggests alternatives ranked by stability.**

A well-prompted response:

```
1. ✅ MOST STABLE (role-based):
   page.getByRole('cell', { name: /\$[\d,]+\.?\d*/ })
   — Uses ARIA semantics. Survives CSS class renaming, designer changes.
   — Requires: the cell must have an appropriate ARIA role (verify in Inspector).

2. ⚠️ MEDIUM STABILITY (data attribute):
   page.locator('[data-automation-key="amount"]')
   — Explicit test hook. Very readable. Survives class changes.
   — Risk: if the dev removes the data-automation-key attribute, it breaks.

3. ❌ LEAST STABLE (structural):
   page.locator('.CitationGrid__row > td:nth-child(3)')
   — Position-based. Breaks if columns are reordered.
   — Only use if no better option exists.
```

**Step 5: Validate with Playwright Inspector.**

Never adopt AI-suggested locators without testing them in the real app:

```typescript
// In your test, pause to open Playwright Inspector
await page.pause();
// In the Inspector console, run:
// playwright.locator('your.selector').count()
// playwright.locator('your.selector').textContent()
```

### The Key Rule

AI suggests. You validate. Never commit AI-generated selectors without running them against the actual application.

---

## 6. GitHub Copilot Integration in VS Code

### How Copilot Understands Your Codebase

Copilot's suggestions improve significantly when it has more context. The key mechanism is **open files as context**: Copilot considers all open editor tabs when generating completions.

**Practical technique:**
1. Open `MasterSearchPage.ts` in a split pane alongside your test file.
2. Open `accountFixture.ts` in another tab.
3. Open `APIUtils.ts` in a third tab.

Now when you start typing a test, Copilot already knows your POM method signatures, fixture shape, and APIUtils call patterns. It will use the actual method names from your open files.

### Comments-to-Code Workflow

The most reliable way to use Copilot:

```typescript
test('verifies citation status updates after payment', async ({ page, account, request }) => {
  // Step 1: Create a pending citation via API using account.accessToken
  // Copilot will suggest: const citation = await APIUtils.post<CitationCreateResponse>(...)

  // Step 2: Navigate to the citations grid
  // Copilot will suggest: const searchPage = new MasterSearchPage(page); await searchPage.navigateToCitationsGrid();

  // Step 3: Find the citation row and click Pay
  // Copilot suggests based on your open MasterSearchPage.ts methods

  // Step 4: Verify status changed to PAID in the grid
});
```

Write the comment. Press Tab. Review the suggestion. Accept or adjust.

### When to Reject Copilot Suggestions

Reject any Copilot suggestion that:

| Signal | Problem |
|---|---|
| Contains `page.waitForTimeout(...)` | Artificial sleep — flakiness source |
| Imports from a path that doesn't exist | Hallucinated import |
| Doesn't import from your fixtures file | Bypasses the fixture architecture |
| Puts raw locators (`.ms-*`, `[class=...]`) directly in the test | Violates POM discipline |
| Uses `as any` for API response types | Loses type safety |
| Uses a Playwright API that doesn't autocomplete | Possibly a hallucinated or deprecated method |

Press **Escape** or **Alt+]** to cycle to the next suggestion. The first suggestion is not always the best.

### Copilot for Test Data Factories

Copilot is excellent for generating factory method completions once you've established the pattern:

```typescript
// You type:
export class PayloadsCitation {
  static pending(params: { customerId: string }): CreateCitationPayload {
    // Copilot completes using the types it sees in your open files

// You type:
  static withAmount(params: { customerId: string; amount: number }): CreateCitationPayload {
    // Copilot recognises the pattern and completes correctly
```

---

## 7. Limits — What AI Cannot Replace

This section is critical. Do not skip it.

### What AI Genuinely Cannot Do

**1. Know your D365 environment's specific timing traps.**

The two-phase render trap in D365 (Ch10, Ch17) — where the grid loads its shell, then a second async call populates the rows — is not documented anywhere AI has learned from. The AI will suggest waiting for `.ms-DetailsList-row`, which exists after phase 1. Your test will intermittently pass because the AI doesn't know about phase 2.

You learned this from reading the Playwright trace. The AI cannot read your Playwright trace.

**2. Design your fixture architecture.**

AI will generate test-scoped account creation: a new user created and deleted in every single test. This creates:
- Slow tests (account creation takes 3–8 seconds per test)
- Race conditions when parallel workers compete for the same account naming patterns
- Cleanup failures when a test crashes mid-run and leaves orphaned accounts

The worker-scoped `account` fixture from Ch06 exists because an experienced SDET designed it to avoid exactly these problems. AI will create the problem; you design the solution.

**3. Write the enterprise API client library.**

The typed, generic `APIUtils<T>` from Ch44, with its retry logic, circuit-breaker pattern, structured error types, and request correlation ID injection — AI will generate flat, untyped HTTP calls:

```typescript
// ❌ What AI generates
const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
const data = await response.json(); // untyped any
```

```typescript
// ✅ What Ch44 teaches
const data = await APIUtils.post<CitationCreateResponse>(
  request, endpoint, headers, payload,
); // typed, retried, correlated
```

**4. Verify its own Playwright API references.**

AI hallucinates Playwright APIs that do not exist. Common examples seen in AI-generated tests:

```typescript
// ❌ These do NOT exist in Playwright
await page.waitForAngular();
await page.waitForReact();
await element.scrollIntoView();    // Playwright uses .scrollIntoViewIfNeeded()
await page.waitForNetworkIdle();  // deprecated; use { waitUntil: 'networkidle' }
```

**Always verify against [playwright.dev/docs](https://playwright.dev/docs/api/class-page) before committing AI-generated code.**

**5. Avoid creating the POM maintenance nightmare.**

AI-generated tests with inline locators are exactly what Ch05 and Ch18 teach you to avoid. If you accept 50 AI-generated tests with selectors hardcoded in the test body, you now have a maintenance crisis: every UI change requires hunting through 50 test files instead of updating one POM class.

### The Mental Model

> **AI is a fast junior who can scaffold. You are the senior who designs and reviews.**

A junior scaffolds the shape of the code. A senior applies the architecture, understands the failure modes, and decides what goes where. The ratio of AI contribution to SDET judgment should be roughly:

| Activity | AI Contribution | Your Judgment |
|---|---|---|
| Locator discovery on new pages | High — AI navigates and reads the DOM | Medium — you validate each suggestion |
| Test structure scaffolding | High — AI generates the basic shape | High — you apply fixtures, POM, types |
| Flakiness hypothesis generation | Medium — AI suggests likely causes | High — you validate with traces |
| Fixture architecture design | None | All yours |
| API client library design | None | All yours |
| D365-specific timing patterns | None | All yours — from Ch10, Ch17 |

---

## 8. Agentic Test Automation (Advanced)

### What Agentic Testing Is

Standard AI-assisted testing is a **collaboration**: you prompt, AI responds, you review and apply.

Agentic testing is **autonomous**: the AI is given a goal and runs a full loop:

```
Prompt: "Generate and run E2E tests for this app."

Agent loop:
  1. Navigate to the app
  2. Explore user journeys (discover what exists)
  3. Write test code for each journey
  4. Run the tests
  5. Read failures
  6. Fix the failures
  7. Re-run
  8. Report
```

No human in the loop except for the initial goal and the final report.

### Current State (2025)

| App Type | Agentic Testing Quality | Why |
|---|---|---|
| Simple CRUD apps (todo lists, basic forms) | Usable | Predictable HTML, standard selectors, simple flows |
| Standard web apps (checkout, onboarding) | Partial | Mostly works; authentication and error flows are weak |
| Enterprise apps (D365, SAP, custom auth) | Unreliable | Custom auth, multi-phase renders, IFrame contexts, token flows defeat current agents |

**The fundamental limitation**: Agentic systems rely on general knowledge of web patterns. D365 Fluent UI, dual-context navigation, magic-link authentication, and two-phase grid rendering are outside general web patterns. Current agents hit these and fail in ways that are hard to diagnose automatically.

### Playwright MCP + AI Agent for Discovery

The most productive agentic use today is **journey discovery**, not test production:

```
Prompt to Claude Desktop with Playwright MCP:

"Navigate to https://opensource-demo.orangehrmlive.com.
Log in as Admin/admin123.
Explore every menu item.
List all the user journeys you discover:
  - Journey name
  - Start point (URL or menu item)
  - Steps involved
  - Data it creates or reads
  - Any forms with required fields

This is for test planning, not test writing."
```

This gives you a **test inventory you didn't have to manually build** — a valuable input to your test plan.

### What to Watch For

- **playwright.dev/blog** — the Playwright team publishes updates on AI integration. Check it when planning major test suite expansions.
- **MCP server ecosystem** — the `@playwright/mcp` server is actively developed. New capabilities (screenshot-based assertion, video replay) are being added.
- **AI IDE integration** — VS Code Copilot, Cursor, and Claude Code are converging on deeper MCP integration. What requires manual config today may be default in 6 months.

### The Practical Boundary for Now

```
✅ Use AI agents for:             ❌ Don't use AI agents for:
- Test case discovery            - Writing your production test suite
- Locator hunting                - Managing fixture architecture
- Hypothesis generation          - Designing POM class hierarchy
- First-draft scaffolding        - D365-specific wait strategies
- Selector alternatives          - Final test code without review
```

---

## 9. Practice Challenges

### 🔬 Challenge 1 (Conceptual — MCP Architecture)

**Question (MCQ):**

When should you use AI-assisted test generation with Playwright MCP?

A) To replace writing Page Object Models — let the AI manage selectors directly  
B) As a starting scaffold that you then refactor to use your fixtures and POM architecture  
C) To write the entire test suite overnight without review  
D) Only for simple apps; AI is useless for enterprise apps

<details><summary>Answer</summary>

**B is correct.**

AI with Playwright MCP is most valuable as a **scaffold generator**. It can navigate your real app, read the actual DOM, and produce a structurally correct test shape. What it cannot do is apply your fixture architecture, your POM design, your typed API client, or your D365-specific timing patterns.

- **A is wrong**: Removing POMs creates the maintenance nightmare Ch05 teaches you to avoid. When the UI changes, every test breaks instead of one POM class.
- **C is wrong**: AI-generated tests without review will contain `waitForTimeout`, inline locators, untyped responses, and missing cleanup. Merging them directly creates technical debt.
- **D is wrong**: AI is useful for enterprise apps — specifically for locator discovery and flakiness hypotheses. It just cannot autonomously produce production-quality enterprise tests without your review and pattern application.

**The mental model**: AI scaffolds; you architect. A fast junior and an experienced senior working together produce better output than either alone.

</details>

---

### 🔬 Challenge 2 (Spot the Bug)

**Task:** This test was generated by AI. Find all 4 problems and explain the fix for each.

```typescript
test('creates citation and verifies in grid', async ({ page }) => {
  // Create via API
  const response = await page.request.post('https://api.crm.example.com/citations', {
    headers: { 'Authorization': 'Bearer eyJhbGc...' },
    data: { customerId: 'user-42', type: 'PARKING', amount: 250 }
  });
  const citation: any = await response.json();

  await page.goto('https://crm.example.com/citations');
  await page.waitForTimeout(3000);

  await page.fill('.ms-SearchBox-field', citation.id);
  await page.waitForTimeout(1500);

  const firstRow = page.locator('.ms-DetailsList-row').first();
  expect(await firstRow.textContent()).toContain(citation.id);
});
```

<details><summary>Answer</summary>

**Problem 1: `page.waitForTimeout(3000)` and `page.waitForTimeout(1500)`**

Arbitrary sleeps are the primary cause of CI flakiness. In a fast CI runner the sleep may be too long (wasting time); in a slow or loaded runner it may be too short (causing failures).

Fix: Replace with explicit assertions or POM wait methods:
```typescript
await searchPage.waitForGridToLoad();          // waits for spinner to disappear
await expect(searchPage.getSearchBox()).toBeVisible();
```

---

**Problem 2: Hardcoded Bearer token**

`'Bearer eyJhbGc...'` is a real token embedded in test code. It will expire (likely within an hour), break in CI, and if committed to git, is a security incident.

Fix: Use the `account` fixture:
```typescript
// In test signature:
async ({ page, account, request }) => { ... }
// In the header:
const headers = HeadersCrm.auth(account.accessToken, test.info().testId);
```

---

**Problem 3: `const citation: any = await response.json()`**

`any` disables TypeScript type checking. If the API response shape changes, the compiler cannot catch it. You will discover the mismatch at runtime.

Fix: Define and use a typed interface:
```typescript
interface CitationCreateResponse {
  id: string;
  status: string;
  amount: number;
}
const citation = await APIUtils.post<CitationCreateResponse>(
  request, endpoints.citations.create, headers, payload,
);
```

---

**Problem 4: Inline locators in the test body**

`.ms-SearchBox-field` and `.ms-DetailsList-row` are raw CSS selectors hardcoded in the test. When the UI updates, every test that uses them breaks — you must hunt across all files.

Fix: Move selectors into the POM (`MasterSearchPage.ts`):
```typescript
// MasterSearchPage.ts
get searchBox() { return this.page.getByRole('searchbox', { name: 'Search citations' }); }
getRowByCitationId(id: string) { return this.page.getByRole('row', { name: id }); }

// Test file
await searchPage.searchForCitation(citation.id);
await expect(searchPage.getRowByCitationId(citation.id)).toBeVisible();
```

</details>

---

### 🔬 Challenge 3 (Write It Yourself)

**Task:**

Write a prompt you would give to Claude Desktop (with Playwright MCP connected) to discover all user journeys on `https://opensource-demo.orangehrmlive.com`.

Your prompt must:
1. Give the AI the credentials it needs (Admin/admin123).
2. Ask for journey discovery, not test code.
3. Specify what information you want about each journey.
4. Tell the AI what output format you want (so it's useful for test planning).
5. Mention at least one thing you do NOT want the AI to do.

Write the full prompt. Then explain: what output would you expect, and what would you do with it?

<details><summary>Answer</summary>

**Example Prompt:**

```
You have access to a Playwright browser. Use it to explore this web application:

URL: https://opensource-demo.orangehrmlive.com
Credentials: Username = Admin, Password = admin123

Goal: Test journey discovery — I am planning an E2E test suite for this app.
I need to know what user journeys exist BEFORE I write any tests.

Instructions:
1. Log in as Admin.
2. Navigate every top-level menu item (Dashboard, PIM, Leave, Time, Recruitment,
   My Info, Performance, Directory, Maintenance, Buzz).
3. For each menu item, explore the sub-menus and at least one page per sub-menu.

For each user journey you discover, give me:
  - Journey name (short, descriptive)
  - Entry point (menu path, e.g., "PIM → Add Employee")
  - Steps involved (numbered list, max 8 steps)
  - Data involved (what it creates, reads, or updates)
  - Required form fields (if any)
  - Risk rating: High / Medium / Low (your assessment of how critical this journey is)

Output format: a Markdown table with columns: Journey | Entry Point | Steps | Data | Required Fields | Risk

Do NOT write any test code. Do NOT suggest selectors. Focus only on discovering and documenting what journeys exist.
```

**What output you would expect:**

A Markdown table with 20–40 rows covering journeys like:
- Add Employee (PIM → Add Employee): High risk — core data entry
- Apply for Leave (Leave → Apply): Medium risk — workflow with approval
- Generate Reports (PIM → Reports): Low risk — read-only
- Configure Leave Types (Admin → Leave → Configuration): Medium risk — admin-only

**What you would do with it:**

1. Use the table as input to your test planning meeting — which journeys get E2E coverage vs unit/integration coverage?
2. Tag each journey by risk: High → must have E2E; Medium → have integration; Low → document only.
3. Use the "Steps" column to estimate test complexity and write time estimates.
4. Use the "Data involved" column to design your test data factories and cleanup strategies.

**Why this is the right use of MCP today:**
You invested 10 minutes writing a good prompt and got a test inventory that would have taken a human analyst 2–4 hours of manual exploration. The AI did what it's good at (systematic navigation and documentation). You apply your engineering judgment to everything that comes next.

</details>

---

**Cross-references:**
- [Chapter 25 — CI/CD Integration](./25_CICD_Integration_GitHub_Azure.md) — AI-generated tests must pass the same CI gates as hand-written ones
- [Chapter 26 — Flakiness Diagnosis and Fixing](./26_Flakiness_Diagnosis_and_Fixing.md) — use traces to validate AI flakiness hypotheses
- [Chapter 44 — Enterprise API Client Library](./44_Enterprise_API_Client_Library.md) — the typed API client AI cannot write for you

---

**Navigation**: [← Enterprise API Client Library](./44_Enterprise_API_Client_Library.md) | [Index](../00_INDEX.md)
