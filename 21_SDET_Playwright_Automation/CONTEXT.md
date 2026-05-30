# Folder Context: 21_SDET_Playwright_Automation

## Purpose

Teach end-to-end test automation engineering at production grade: Playwright + TypeScript, enterprise POM architecture, fixture design, parallel execution, API client library design, CI/CD integration, performance, security, accessibility, contract testing, and the SDET→SDE skill bridge.

The target reader is a working SDET on Dynamics 365 CRM / JSP / ASP.NET ASPX apps who already knows basic Playwright and wants to go deeper into architecture, enterprise patterns, and career growth toward SDE-level thinking.

## 48-File Map (Do NOT Duplicate)

| Range | Theme |
|---|---|
| 00 | Foundations & mindset — testing pyramid, 3 pillars, professional vocabulary |
| 01–09 | Core Playwright — async/await, locators, POM, fixtures, E2E, browser internals, parallel |
| 10–19 | D365 & cross-site patterns — IFrames, Fluent UI, dual-context, token/magic-link, security |
| 20 | Practice resources & 10-week challenge map |
| 21–24 | Enterprise architecture — project structure, factory pattern, APIUtils, test script architecture |
| 25–31 | Production quality — CI/CD, flakiness, advanced TypeScript, test data, visual regression, DB, mocking |
| 32 | SDET interview prep |
| 33–36 | SDET→SDE bridge — CS thinking, algorithms, OOP patterns, TypeScript type system |
| 37–41 | Open-source specialised tools — Lighthouse/k6, Pact, axe-core, OWASP ZAP, GraphQL/WebSocket |
| 42–44 | Real-world depth — polling, war stories, enterprise API client library |
| Q1–Q2 | MCQ quiz, code challenge quiz |

**Before writing any new file:** check this map. If the concept is already covered, APPEND to the existing file — do not create a duplicate.

## Writing Style

- Playwright + TypeScript only — no Selenium, no JavaScript files.
- Real enterprise class names: `MasterSearchPage`, `CustomerDetailsTab`, `APIUtils`, `HeadersCrm`, `PayloadsCitation`.
- Real D365 selectors: `.ms-Spinner`, `.ms-DetailsList-row`, `data-automation-key`, `getByRole('menuitem')`.
- Mark patterns explicitly: ❌ bad / ✅ good.
- 5W1H at the top of every chapter.
- Collapsible `<details><summary>Answer</summary>` for all Q&A.
- Navigation header and footer on every chapter.
- End every chapter with 3+ practice challenges.
- Enterprise depth: explain WHY, not just HOW. Include timing/failure reasoning.

## Boundaries

- **JS/TS language fundamentals** belong in `16_JavaScript/` and `17_TypeScript/`. This folder uses TS but does not re-teach it.
- **CSS selectors** in depth belong in `18_CSS_Complete/`. Use CSS in examples only.
- **React internals** beyond what affects test wait strategies belong in `15_React_Frontend/`.
- **DevOps/CI** beyond Playwright-specific pipelines belong in `22_DevOps/`.
- **Java/Spring** does not belong here — cross-reference `07_Modern_Java/` if needed.
- **Android/mobile** automation belongs in `23_Mobile_Dev_And_Testing/`.

## Codebase Context (For All Agents)

The user's real codebase uses:
- `MasterSearchPage.ts`, `CustomerDetailsTab.ts` — Page Object Model classes
- `APIUtils.ts` — generic HTTP wrapper around Playwright's `APIRequestContext`
- `HeadersCrm.ts` — static factory: `HeadersCrm.auth(accessToken, testId)`
- `PayloadsCitation.ts` — static factory: `PayloadsCitation.pending({ customerId })`
- `endpoints.ts` — assembled from `process.env` variables
- Worker-scoped `account` fixture providing `{ accessToken, userId, email, role }`
- 15-step E2E tests using the **Data Accumulator** pattern: `const data: TestData = { citationId: null }`

## Update Triggers

Update this file when:
- A new chapter family is added (e.g., Chapter 45+).
- The real codebase architecture changes (new fixture, new POM base class).
- A new boundary is established between this folder and another.
