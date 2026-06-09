# AI Agents / MCP & Playwright

> Specialised reference for using AI agents to write, heal, and operate Playwright tests via the Model Context Protocol (MCP), GitHub Copilot, and the Playwright MCP server. Honest scope — what AI does well, what it doesn't, where the boundaries are.

---

## Table of contents

1. [What MCP is](#1-what-mcp-is)
2. [The Playwright MCP server](#2-playwright-mcp)
3. [Using Claude / Copilot with Playwright](#3-claude-copilot)
4. [AI for test scaffolding](#4-scaffolding)
5. [AI for test healing](#5-healing)
6. [AI for triaging failures](#6-triaging)
7. [The boundaries — what AI doesn't do well](#7-boundaries)
8. [Cost vs value](#8-cost-value)
9. [Anti-patterns](#9-anti-patterns)

---

## 1. What MCP is

Model Context Protocol (Anthropic, 2024) — a standard for connecting LLM agents to external tools (databases, APIs, browsers).

For Playwright: an MCP server exposes browser-driving tools to an AI agent.

```
LLM (Claude / GPT)
    ↓ MCP calls
MCP server (e.g., Playwright MCP)
    ↓ Playwright API
Browser
```

The agent can: navigate, click, fill, screenshot, evaluate, all via natural language → MCP tool calls.

---

## 2. Playwright MCP

```bash
npm i -D @playwright/mcp
```

```typescript
// mcp-server.ts
import { startServer } from '@playwright/mcp/server';

await startServer({
  port: 3000,
  // ... config
});
```

The server exposes:
- `playwright_navigate(url)`
- `playwright_click(selector)`
- `playwright_fill(selector, value)`
- `playwright_screenshot()`
- `playwright_evaluate(script)`
- ... etc.

Agents (Claude, Copilot, custom) can call these to drive a browser.

### 2.1 Use cases

- Manual exploratory testing automated by AI.
- AI-driven user simulation.
- Codegen from natural language.
- "Take a screenshot of every link's destination" — agent navigates through.

---

## 3. Claude / Copilot

### 3.1 GitHub Copilot in VS Code

Copilot suggests Playwright code inline:

```typescript
test('login', async ({ page }) => {
  await page.goto('/login');
  // Copilot suggests: await page.getByLabel('Email').fill('user@example.com');
});
```

Good at:
- Common patterns (login, navigation, basic assertions).
- TypeScript type hints.
- Boilerplate.

Bad at:
- Domain-specific selectors (your app's data-testid scheme).
- Complex async flows.
- App-specific business logic.

### 3.2 Claude / chat-based

For test scaffolding via conversation:

```
Me: "Write a Playwright test that signs in as admin, navigates to citations, 
     and asserts the first row's status is PAID."
Claude: [generates code]
```

Good at:
- Multi-step flows.
- Explaining failures.
- Refactoring.

Both flavours: AI is a code assistant, not a replacement for thinking. Review every line.

---

## 4. Scaffolding

The killer use case. Given a feature description + DOM, AI generates a passing test:

```
Feature: customer can update profile

[DOM snippet of profile page]

Generate Playwright test.
```

AI produces a draft. Engineer reviews, refines, commits.

### 4.1 The 80/20 split

| AI does well | Engineer must do |
|---|---|
| First draft of test body | Verify selectors are stable |
| Common assertions | Domain-specific assertions |
| Hook into fixtures | Define fixtures correctly |
| Suggest improvements | Review against POM patterns |
| Codegen from URL | Custom data flow |

---

## 5. Healing

When a selector breaks, AI can suggest fixes.

### 5.1 The pattern

1. Test fails with "element not found: button.submit-cta".
2. AI receives: error, current DOM, intent ("click the submit button").
3. AI suggests: "Try `page.getByRole('button', { name: 'Submit' })` — the class changed but the role didn't."

### 5.2 The trap

AI healing can mask real regressions. A "button.submit-cta" that's GONE might be a real bug (someone removed the button). AI's "fix" makes the test pass against a different button — false negative.

Always review AI healings. Don't auto-merge them.

---

## 6. Triaging failures

For a 200-failure CI run, AI can cluster similar failures:

```
Cluster 1 (87 failures): timeout on /dashboard
Cluster 2 (43 failures): "OAuth token expired"  
Cluster 3 (12 failures): "Element not found in modal"
Cluster 4 (15 failures): visual regression > threshold
... 
```

AI suggests root causes per cluster. Engineer triages the top causes, not individual tests.

Tools: ReportPortal's auto-analysis, Allure TestOps, custom Claude/GPT integrations.

---

## 7. Boundaries

### 7.1 AI is bad at

- App-specific business logic.
- Subtle race conditions.
- Stateful flow design (which test should set up which data?).
- Performance test design.
- Security test logic.
- Knowing what NOT to test.

### 7.2 AI is great at

- First drafts.
- Refactoring boilerplate.
- Explaining cryptic error messages.
- Suggesting locators given a DOM.
- Cross-language porting.

### 7.3 The senior engineer's role doesn't disappear

AI accelerates juniors but doesn't replace seniors. Architecture, strategy, root-cause diagnosis still require human judgment.

---

## 8. Cost vs value

| Item | Cost |
|---|---|
| Copilot for VS Code | $10/user/month |
| Claude API for test generation | ~$0.01-0.10 per test generated |
| Self-hosted LLM | Hardware + ops |
| MCP server setup | Engineering time |

For a 50-engineer team:
- Copilot: $500/month, ~10% productivity gain on test writing = $50K/yr equivalent.
- Claude for scaffolding: $1K/month, similar gain.

ROI is positive for most teams. The risk is over-reliance — engineers stop developing skills they delegate to AI.

---

## 9. Anti-patterns

| ❌ | ✅ |
|---|---|
| Auto-merge AI-suggested test fixes | Human review |
| Generate tests from app description without DOM | DOM-aware generation |
| Use AI to write fixtures | AI for boilerplate, humans for architecture |
| Trust AI's claim that a test "passes" | Run the test |
| Replace test review with AI | AI assists; humans decide |
| Use AI to write your security tests | Security needs domain expertise |
| Generate one big AI-written test that does everything | Smaller, reviewable tests |
| Rely on AI for test data design | Data design needs business context |

---

## Cross-references

- POM patterns (where AI's output should fit): [`../learn/03_pom.md`](../learn/03_pom.md)
- Tool comparison (Cypress / Selenium AI ecosystem): [`../reference/14_tool_comparison.md`](../reference/14_tool_comparison.md)
- The framework's reference implementation: [`../framework/`](../framework/)
