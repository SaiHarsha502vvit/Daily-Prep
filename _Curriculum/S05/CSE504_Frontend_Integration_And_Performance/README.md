# CSE504 — Frontend Integration & Performance

## Semester 5 · Full-Stack Specialization (Frontend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can configure Vite/Webpack from scratch and explain every plugin, read a flame graph to find the actual bottleneck, diagnose Core Web Vitals failures from the field data, and set up performance budgets that fail CI before regressions ship.
> **Capstone:** Take a production app from Lighthouse 60 to 95+ on a real workload. Document each optimization with before/after measurements. Defend against re-introduction with CI budgets.

---

## Navigation

| Course                                                                                  | Description |
| --------------------------------------------------------------------------------------- | ----------- |
| **[CSE501 — JavaScript & TypeScript Deep Dive](../CSE501_JavaScript_And_TypeScript_Deep_Dive/README.md)** | S05 sibling |
| **[CSE502 — React & Frontend Architecture](../CSE502_React_And_Frontend_Architecture/README.md)** | S05 sibling |
| **[CSE503 — CSS & Design Systems](../CSE503_CSS_And_Design_Systems/README.md)**         | S05 sibling |
| **CSE504 — Frontend Integration & Performance**                                         | This course |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `19_Frontend_Integration/`                 | Primary source — every chapter cited below                     |
| `15_React_Frontend/08_React_Performance.md` | React-specific perf patterns                                  |
| `16_JavaScript/09_Browser_Internals_Rendering.md` | Rendering pipeline mental model                         |
| `22_DevOps/`                               | CI/CD integration for performance budgets                      |

---

## Prerequisites

- `CSE501` — JavaScript and TypeScript fluency
- `CSE502` — React baseline
- `16_JavaScript/09_Browser_Internals_Rendering.md` — paint/layout/composite preview

**Constraint:** This course is empirical, not theoretical. You should expect to spend 50% of your time looking at DevTools panels, Lighthouse reports, and bundle analyzer visualizations. Performance work without measurement is guessing.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Build Pipelines (Weeks 1–4)

**Learning Outcomes:**

- Configure Vite + Webpack 5 from scratch
- Understand module formats (ESM, CJS, IIFE, UMD) and when each lives
- Apply tree shaking, scope hoisting, code splitting effectively

#### Week 1 — Module Systems

`19_Frontend_Integration/02_Build_Tools.md` §1-2 — ESM vs CJS interop, `package.json#exports`, dual packages.

#### Week 2 — Vite

`19_Frontend_Integration/02_Build_Tools.md` §3 — esbuild for dev, Rollup for prod, plugin API, HMR mechanics.

#### Week 3 — Webpack 5

`19_Frontend_Integration/02_Build_Tools.md` §4 — module federation, shared modules, runtime chunk, when Webpack still wins over Vite (monorepo edge cases).

#### Week 4 — Tree Shaking + Code Splitting

`19_Frontend_Integration/02_Build_Tools.md` §5-7 — `sideEffects: false`, dynamic imports, route-based splitting, prefetch/preload.

**Section Challenge (tree shaking):**

> You import `{ debounce } from 'lodash'`. Your bundle is 71KB. You change to `import debounce from 'lodash/debounce'`. Bundle drops to 4KB. Explain WHY tree shaking didn't work the first time, and what package configuration would make the original import safe.

<details>
<summary>Answer</summary>

```
WHY TREE SHAKING FAILS WITH lodash:
  Tree shaking analyzes the import graph statically and removes
  unused exports. It requires:
  1. ES Modules (CJS modules can't be analyzed — require() is dynamic)
  2. Pure modules (no side effects at import time)
  3. The package author's `sideEffects` field in package.json

  Lodash's main entry point is a CJS bundle that re-exports every
  function. The bundler can't statically determine which functions
  are unused without executing the code (which it doesn't do).

  Result: importing { debounce } pulls in the ENTIRE lodash CJS bundle.

WHY lodash/debounce WORKS:
  The lodash package ships individual file entry points. `lodash/debounce`
  resolves to `node_modules/lodash/debounce.js` — a single file with
  exactly the debounce function. Importing it pulls only that file
  (plus its lodash internals). No tree shaking required — direct
  file selection.

WHAT MAKES THE ORIGINAL IMPORT SAFE:
  Switch to `lodash-es`. This package:
  1. Ships ES Modules (`type: "module"`)
  2. Declares `sideEffects: false` in package.json
  3. Each function in its own ES module file

  Now `import { debounce } from 'lodash-es'` lets the bundler tree-shake.
  Final bundle includes only debounce + its dependency tree.

PRINCIPLE:
  Tree shaking is a CONTRACT between package author and bundler.
  The author declares "no side effects" via package.json sideEffects.
  The bundler trusts this declaration.
  If your package has side effects (CSS imports, polyfills), and you
  declare sideEffects: false, the bundler may eliminate code that
  your runtime depends on. Be honest about side effects.
```

</details>

---

### UNIT 2 — Asset Optimization (Weeks 5–6)

`19_Frontend_Integration/03_Performance.md` §1-3 — image formats (WebP/AVIF/JPEG XL), responsive images, font subsetting + `font-display`, critical CSS extraction.

---

### UNIT 3 — Rendering Pipeline (Weeks 7–8)

**Learning Outcomes:**

- Trace browser pipeline: parse HTML → CSSOM → render tree → layout → paint → composite
- Identify which CSS properties trigger which pipeline stages
- Use `will-change` and `transform: translateZ(0)` correctly (and recognize the overuse)

`16_JavaScript/09_Browser_Internals_Rendering.md` §1-4 + `19_Frontend_Integration/03_Performance.md` §4.

---

### UNIT 4 — Core Web Vitals (Weeks 9–11)

**Learning Outcomes:**

- Distinguish LCP, CLS, INP from field vs lab data
- Diagnose each metric's failure mode and fix
- Set up CrUX-based monitoring

#### Week 9 — LCP

`19_Frontend_Integration/03_Performance.md` §5 — what counts as the largest contentful paint, fetch priority, preload, server timing.

#### Week 10 — CLS + INP

`19_Frontend_Integration/03_Performance.md` §6-7 — layout shift sources (font swap, async iframes, missing image dimensions), INP measurement and root causes (long tasks, hydration cost).

#### Week 11 — Real User Monitoring

`19_Frontend_Integration/03_Performance.md` §8 — web-vitals.js, CrUX, RUM tools, sampling tradeoffs.

---

### UNIT 5 — DevTools Mastery (Weeks 12–13)

`19_Frontend_Integration/01_Browser_Debugging.md` — Performance panel flame graphs, Memory panel heap snapshots, Network throttling profiles, Coverage tool.

---

### UNIT 6 — Performance Budgets (Week 14)

Lighthouse CI configuration, performance budget thresholds (TTI < 3s, LCP < 2.5s, CLS < 0.1), CI gate failing PR on regression.

---

### UNIT 7 — Capstone (Weeks 15–16)

Take a real app from Lighthouse 60 → 95. Document each optimization with before/after measurements. Set up CI budgets to prevent regression.

---

## Problem Sets

[`19_Frontend_Integration/19_PROBLEM_SETS.md`](../../../19_Frontend_Integration/19_PROBLEM_SETS.md) — bundle analysis, perf diagnosis, DevTools puzzles.

## Exam Prep

- `19_Frontend_Integration/03_Performance.md` — full reference
- [`00_CURRICULUM/EXAM_BANK.md`](../../../00_CURRICULUM/EXAM_BANK.md) — S05 perf section
