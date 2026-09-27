# Frontend / Full-Stack Web Developer Path

> JavaScript → TypeScript → React → CSS → Testing. The modern web stack in order.

← [WHERE_TO_START.md](WHERE_TO_START.md) — not sure which path? Start there first.

---

## Who this is for

- Developers new to web (from backend, mobile, or non-coding backgrounds)
- JavaScript developers who want TypeScript fluency
- React developers who want to add testing depth
- Anyone who can build UIs but doesn't understand what's happening under the hood (closures, the event loop, reconciliation)

**Not for:** backend-only developers — see [PATH_JAVA_BACKEND.md](PATH_JAVA_BACKEND.md). For test automation as a career, see [21_SDET_Playwright_Automation/README.md](./21_SDET_Playwright_Automation/README.md).

---

## The Complete Path

### Stage 1 — JavaScript Core (the language, not the ecosystem)

React, TypeScript, and Playwright are all JavaScript. If the language foundation is shaky, everything built on top of it is fragile.

| # | File | Why now | Est |
|---|------|---------|-----|
| 1 | [JS Foundations](16_JavaScript/01_JS_Foundations.md) | Variables, scope, functions, closures — the parts that trip everyone up | 4h |
| 2 | [JS Prototype & OOP](16_JavaScript/03_JS_Objects_Prototypes.md) | `this`, prototype chain, class syntax — React class components use this | 3h |
| 3 | [JS Arrays & Iteration](16_JavaScript/06_JS_Modern_ES6Plus.md) | `map`, `filter`, `reduce`, spread, destructuring — used in every React component | 2h |
| 4 | [JS Async & Promises](16_JavaScript/04_JS_Async_Promises.md) | Promise, async/await, event loop — the most common source of subtle bugs in web apps | 4h |
| 5 | [JS Modules & Tooling](19_Frontend_Integration/03_Build_Tools_Ecosystem.md) | ESM vs CJS, bundlers, why `import` sometimes breaks | 2h |
| 6 | [JS Browser & DOM](16_JavaScript/05_JS_DOM_BrowserAPIs.md) | How the browser renders HTML; event bubbling; why React doesn't touch the DOM directly | 3h |
| 7 | [JS Deep Reasoning](16_JavaScript/08_JS_Deep_Reasoning.md) | 15 "freeze moments" — the interview questions that expose gaps | 2h |

**Checkpoint:** Without looking it up — what does this print, and why?
```javascript
for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }
```
If you said "3, 3, 3" and can explain closure + event loop, proceed to Stage 2.

---

### Stage 2 — TypeScript

TypeScript finds the bugs before production does. After 2–3 weeks of TypeScript, you will never want to write untyped JS again.

| # | File | Why now | Est |
|---|------|---------|-----|
| 8 | [TS Foundations](17_TypeScript/01_TS_Foundations.md) | Why types matter, basic types, interfaces, type aliases — start with the war stories in Section 0 | 3h |
| 9 | [TS Advanced Types](17_TypeScript/02_TS_Advanced_Types.md) | Generics, conditional types, mapped types, `infer` — what makes TS powerful | 4h |
| 10 | [TS Patterns & Best Practices](17_TypeScript/03_TS_Patterns_BestPractices.md) | Production patterns: discriminated unions, branded types, type guards | 3h |
| 11 | [TS Deep Reasoning](17_TypeScript/04_TS_Deep_Reasoning.md) | The type system questions that show senior TS knowledge | 2h |

**Key concepts to own after Stage 2:**
- `unknown` vs `any` — and why `any` is a trap
- `strictNullChecks: true` — what it prevents
- Generic constraints (`T extends SomeInterface`)
- `as const` and literal types

**Checkpoint:** Write a generic `Result<T, E>` type (discriminated union) and a function that returns it, forcing callers to handle both success and error cases without any `any`.

---

### Stage 3 — React

React's mental model is simple. Its failure modes aren't. Learn the model first; the failure modes are in the deep-reasoning chapter.

| # | File | Why now | Est |
|---|------|---------|-----|
| 12 | [React Foundations](15_React_Frontend/01_React_Fundamentals.md) | JSX, components, props, state, controlled components | 4h |
| 13 | [React Hooks](15_React_Frontend/03_Hooks_Deep_Dive.md) | `useState`, `useEffect`, `useContext`, `useRef`, `useCallback`, `useMemo` | 4h |
| 14 | [React State Management](15_React_Frontend/04_State_Management.md) | Context API, Redux Toolkit, Zustand — when to use which | 3h |
| 15 | [React Performance](15_React_Frontend/08_React_Performance.md) | Why components re-render, `React.memo`, `useCallback` bailouts | 3h |
| 16 | [React TypeScript](15_React_Frontend/05_React_TypeScript.md) | Typing props, events, hooks, and context correctly | 2h |
| 17 | [React Deep Reasoning](15_React_Frontend/09_React_Deep_Reasoning.md) | Fiber, reconciliation, concurrent mode, the questions that surface at senior reviews | 3h |

**Checkpoint:** Implement a debounced search input where:
- Fetching is aborted if the component unmounts mid-request
- Results are typed correctly (no `any`)
- The fetch only fires after 300ms of no typing

If you can do this without stale closure issues, you understand React.

---

### Stage 4 — CSS

CSS is a layout and visual system, not "make things pretty." If you treat it as decoration, you'll fight it forever.

| # | File | Why now | Est |
|---|------|---------|-----|
| 18 | [CSS Foundations](18_CSS_Complete/01_CSS_Foundations.md) | The cascade, specificity, the box model — the mental model that makes everything else click | 3h |
| 19 | [CSS Flexbox](18_CSS_Complete/02_CSS_Layout_Systems.md) | One-dimensional layout — the tool you'll use 80% of the time | 2h |
| 20 | [CSS Grid](18_CSS_Complete/02_CSS_Layout_Systems.md) | Two-dimensional layout — page structure, complex component layouts | 2h |
| 21 | [CSS Advanced](18_CSS_Complete/03_CSS_Responsive_Animations.md) | CSS variables, animations, responsive design, media queries | 3h |

---

### Stage 5 — Testing (Frontend)

Frontend developers who can test their own code are rare and valuable. This is a career differentiator.

| # | File | Why now | Est |
|---|------|---------|-----|
| 22 | [TS Type System for SDETs](./21_SDET_Playwright_Automation/08_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | How TS types protect test code — the SDET perspective on the TS you already know | 2h |
| 23 | [Playwright Basics](21_SDET_Playwright_Automation/01_Foundations/01_Playwright_TS_Basics.md) | Write your first Playwright test in 30 minutes | 2h |
| 24 | [Component Testing with Playwright CT](./21_SDET_Playwright_Automation/07_Specialised_Testing/52_Component_Testing_With_Playwright_CT.md) | Test React components in isolation, without a browser | 3h |
| 25 | [Polling & Async Patterns](./21_SDET_Playwright_Automation/03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md) | Test async behavior without arbitrary `sleep` calls | 2h |

**For more testing depth:** Continue into [21_SDET_Playwright_Automation/README.md](./21_SDET_Playwright_Automation/README.md) following its learning path from Stage 1 — you already have TypeScript, so skip the TS prerequisites.

---

## Cross-subject connections

**JS async ↔ Playwright:** The `async/await` you learned in Stage 1 is exactly how Playwright test actions work. Every `await page.click()` is a Promise. Understanding the event loop (Stage 1) tells you why Playwright's auto-waiting isn't magic — it's polling.

**TypeScript ↔ React:** After Stage 2, every Stage 3 file will make more sense — React generic component types (`React.FC<Props>`), typed event handlers (`React.ChangeEvent<HTMLInputElement>`), and typed context all use the Stage 2 skills directly.

**React reconciliation ↔ Component Testing:** The [Component Testing chapter](./21_SDET_Playwright_Automation/07_Specialised_Testing/52_Component_Testing_With_Playwright_CT.md) makes more sense after [React Deep Reasoning](15_React_Frontend/09_React_Deep_Reasoning.md) — knowing how React updates the DOM tells you why some component tests need `await` and some don't.

---

## SQL (optional but recommended)

Frontend engineers who can query a database communicate better with backend teammates and can diagnose data issues themselves. The fast-track:

1. [SQL Ch01 Foundations](08_SQL/01_Foundations_Database_Basics.md) — execution order mental model (3h)
2. [SQL Ch07 JOINs](08_SQL/07_JOINs_Complete.md) — understanding relational data (3h)
3. [SQL Ch08 Subqueries & CTEs](08_SQL/08_Subqueries_CTEs.md) — the tool for complex data questions (2h)

---

## Interview readiness

- [JS Deep Reasoning](16_JavaScript/08_JS_Deep_Reasoning.md) — reread before interviews
- [React Deep Reasoning](15_React_Frontend/09_React_Deep_Reasoning.md) — the reconciliation / fiber questions
- [TS Deep Reasoning](17_TypeScript/04_TS_Deep_Reasoning.md) — the type system questions
- [System Design](06_OOP_Design/03_System_Design.md) — frontend system design (CDN, caching, performance, accessibility)
- [DSA foundations](02_Data_Structures/01a_Memory_Foundations.md) — yes, frontend devs get algorithm questions

**Total estimated time:** 85–110 hours (Stages 1–4). Stage 5 adds 15–20 hours.

---

*Back to [WHERE_TO_START.md](WHERE_TO_START.md) | Browse all: [00_MASTER_INDEX.md](00_MASTER_INDEX.md)*
