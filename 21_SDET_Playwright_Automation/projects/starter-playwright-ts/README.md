# Starter Playwright TypeScript — Enterprise Reference Project

This directory contains a **runnable, production-grade Playwright TypeScript project** that implements the patterns from the `21_SDET_Playwright_Automation` curriculum.

It is designed as a **reference implementation** — read the code alongside the chapters to see how abstract patterns become concrete files.

---

## Quick Start

```bash
cd projects/starter-playwright-ts
npm install
npx playwright install

# Run tests headless
npx playwright test

# Run with UI for debugging
npx playwright test --ui

# Run only Chromium
npx playwright test --project=chromium
```

---

## What Each Pattern Demonstrates

| File                          | Chapters         | Pattern                                                     |
| ----------------------------- | ---------------- | ----------------------------------------------------------- |
| `playwright.config.ts`        | Ch46             | Config merge algebra, projects DAG, CI vs local conditional |
| `fixtures/auth.fixture.ts`    | Ch51 (Level 2)   | Test-scoped auth fixture with cleanup                       |
| `pages/PortalPage.ts`         | Ch50             | Orchestrator + Component POMs (TabBar, MenuBar, Toast)      |
| `pages/InvoiceTabContent.ts`  | Ch50             | FrameLocator-scoped tab content                             |
| `tests/invoice-flow.spec.ts`  | Ch07, Ch42, Ch47 | Data accumulator, test.step, file upload/download           |
| `tests/setup/global-setup.ts` | Ch16             | `storageState` pre-seeding with freshness check             |

---

## Chapter Cross-Reference

- **Ch46** — Configuration semantics: `playwright.config.ts`
- **Ch50** — SPA without IDs: `pages/PortalPage.ts`, `pages/InvoiceTabContent.ts`
- **Ch51** — Auth taxonomy: `fixtures/auth.fixture.ts` (Level 2), `tests/setup/global-setup.ts` (Level 3)
- **Ch07** — E2E architecture: `tests/invoice-flow.spec.ts` data accumulator
- **Ch47** — Media handling: file upload/download tests

---

## Environment Variables

Create a `.env` file (not committed):

```
BASE_URL=https://portal.acme.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=admin123
```

---

## File Structure

```
├── fixtures/
│   └── auth.fixture.ts          # Test-scoped auth (Level 2)
├── pages/
│   ├── PortalPage.ts             # Orchestrator + component POMs
│   └── InvoiceTabContent.ts      # FrameLocator tab content
├── tests/
│   ├── invoice-flow.spec.ts      # E2E flow with data accumulator
│   └── setup/
│       └── global-setup.ts      # Pre-seed storageState
├── playwright.config.ts          # Production config (Ch46)
├── package.json
└── tsconfig.json
```
