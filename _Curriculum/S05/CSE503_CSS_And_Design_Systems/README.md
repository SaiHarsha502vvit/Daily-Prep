# CSE503 — CSS & Design Systems

## Semester 5 · Full-Stack Specialization (Frontend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can debug specificity wars by drawing the cascade tree, design layout from primitives (flex/grid/container queries) without copying patterns, build a token-based design system that supports theming + dark mode, and reason about scroll-snap, containment, and `content-visibility` from first principles.
> **Capstone:** Build a portfolio-grade design system with primitives, tokens, themes, and Storybook docs. Pass WCAG 2.2 AA on every component. Publish to npm.

---

## Navigation

| Course                                                                                  | Description |
| --------------------------------------------------------------------------------------- | ----------- |
| **[CSE501 — JavaScript & TypeScript Deep Dive](../CSE501_JavaScript_And_TypeScript_Deep_Dive/README.md)** | S05 sibling |
| **[CSE502 — React & Frontend Architecture](../CSE502_React_And_Frontend_Architecture/README.md)** | S05 sibling |
| **CSE503 — CSS & Design Systems**                                                       | This course |
| **[CSE504 — Frontend Integration & Performance](../CSE504_Frontend_Integration_And_Performance/README.md)** | S05 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `18_CSS_Complete/`                         | Primary source — every chapter cited below                     |
| `15_React_Frontend/`                       | CSS-in-JS, styled-components, Tailwind in React                |
| `19_Frontend_Integration/`                 | Critical CSS extraction, font loading                          |

---

## Prerequisites

- Familiarity with HTML5 (semantic tags, ARIA basics)
- Basic CSS (selectors, properties, browser dev tools)
- A modern browser with DevTools panel open

**Constraint:** This course is not about memorizing every CSS property. It's about building the mental model that lets you predict what the cascade will do BEFORE you open DevTools. If you spend more than 30 seconds debugging "why isn't this class applying," your specificity model is incomplete.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Cascade, Specificity, Inheritance (Weeks 1–2)

**Learning Outcomes:**

- Compute specificity for any selector by inspection
- Predict cascade winner from origin, importance, specificity, source order
- Use `@layer` cascade layers to eliminate `!important` wars

#### Week 1 — The Cascade

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Specificity scoring                 | `18_CSS_Complete/01_CSS_Foundations.md` §1-2     | Predict 10 specificity contests                          |
| 2   | Cascade origin + importance        | `18_CSS_Complete/01_CSS_Foundations.md` §3       | Trace a real specificity war from a sample codebase      |
| 3   | Inheritance + initial/inherit/unset | `18_CSS_Complete/01_CSS_Foundations.md` §4       | Use `all: unset` to reset a button completely            |
| 4   | Cascade Layers (`@layer`)           | `18_CSS_Complete/04_CSS_Modern_Architecture.md` §1 | Refactor a project's CSS into 4 layers                   |
| 5–7 | Lab + Problem Set CSS-PS1          | —                                                 | `18_CSS_Complete/18_PROBLEM_SETS.md` PS-1               |

#### Week 2 — Box Model & Positioning

`18_CSS_Complete/01_CSS_Foundations.md` §5-8 — content/padding/border/margin, `box-sizing`, positioned vs flow, containing block.

---

### UNIT 2 — Layout (Weeks 3–6)

**Learning Outcomes:**

- Implement any layout from spec using flex OR grid (not both unnecessarily)
- Reason about main axis vs cross axis
- Apply container queries for component-level responsiveness

#### Week 3 — Flexbox

`18_CSS_Complete/02_CSS_Layout_Systems.md` §1-3 — main/cross axis, flex-grow/shrink/basis, alignment, wrapping.

#### Week 4 — Grid

`18_CSS_Complete/02_CSS_Layout_Systems.md` §4-6 — explicit/implicit tracks, named areas, subgrid, alignment.

#### Week 5 — Responsive Design + Container Queries

`18_CSS_Complete/03_CSS_Responsive_Animations.md` §1-3 + `04_CSS_Modern_Architecture.md` §3 — fluid type with clamp, container queries vs media queries.

#### Week 6 — Scroll Snap + Modern Patterns

`18_CSS_Complete/03_CSS_Responsive_Animations.md` §8 (scroll-snap) — carousels, full-page slides.

**Section Challenge (Layout choice):**

> Three-column dashboard: left sidebar fixed 240px, right sidebar fixed 320px, main content fills the rest. Mobile: sidebars collapse to a hamburger menu, main fills the viewport. The current implementation uses `position: absolute` and breaks on small viewport heights. What's the right modern approach, and why is flex insufficient here while grid wins?

<details>
<summary>Answer</summary>

```
WHY FLEX IS WEAKER HERE:
  Flex is a 1D layout — main axis OR cross axis at a time.
  For a 3-column row, flex works: `flex: 0 0 240px` + `flex: 1` + `flex: 0 0 320px`.
  But the moment you need responsive behavior where sidebars STACK
  on mobile, flex requires media queries to switch flex-direction.
  Switching between row and column with flex causes layout shifts.

WHY GRID WINS:
  Grid is 2D. One template handles all viewports via grid-template-columns
  responding to screen size + grid-template-areas for semantic positioning.

THE SOLUTION:
  .dashboard {
    display: grid;
    grid-template-columns: 240px 1fr 320px;
    grid-template-areas: "left main right";
    min-height: 100vh;
  }
  .left { grid-area: left; }
  .main { grid-area: main; }
  .right { grid-area: right; }

  @media (max-width: 768px) {
    .dashboard {
      grid-template-columns: 1fr;
      grid-template-areas: "left" "main" "right";
    }
  }

FUNDAMENTAL DIFFERENCE:
  Flex distributes available space.
  Grid defines a coordinate system.

  When the SHAPE of the layout changes between viewports, grid wins.
  When the SIZE of content changes within a fixed shape, flex wins.

FAILURE MODE:
  Using grid with `auto` columns and `1fr` mixed without min-content
  can blow out columns. Always use `minmax(0, 1fr)` for content that
  might overflow (long URLs, code blocks).
```

</details>

---

### UNIT 3 — Visual Design Primitives (Weeks 7–8)

`18_CSS_Complete/03_CSS_Responsive_Animations.md` §4-7 + `01_CSS_Foundations.md` §9 — typography systems, color (HSL/OKLCH), spacing scales, shadows.

---

### UNIT 4 — Architecture (Weeks 9–10)

`18_CSS_Complete/04_CSS_Modern_Architecture.md` — BEM vs Tailwind tradeoffs, CSS-in-JS performance cost, design tokens (primitive/semantic/component).

---

### UNIT 5 — Performance (Week 11)

`18_CSS_Complete/04_CSS_Modern_Architecture.md` §12 — CSS Containment + `content-visibility: auto` for virtualization, `contain-intrinsic-size`.

---

### UNIT 6 — Accessibility (Weeks 12–13)

WCAG 2.2: contrast, focus management (`:focus-visible`), reduced-motion (`@media (prefers-reduced-motion)`), screen reader semantics, skip links.

---

### UNIT 7 — Animation & Motion (Week 14)

`18_CSS_Complete/03_CSS_Responsive_Animations.md` §5-7 — transitions, keyframes, motion design principles, View Transitions API.

---

### UNIT 8 — Capstone Build (Weeks 15–16)

Design system with primitives, tokens, themes, Storybook docs, published to npm with type declarations.

---

## Problem Sets

[`18_CSS_Complete/18_PROBLEM_SETS.md`](../../../18_CSS_Complete/18_PROBLEM_SETS.md) — layout challenges, specificity puzzles, theming exercises.

## Exam Prep

[`18_CSS_Complete/05_CSS_Deep_Reasoning.md`](../../../18_CSS_Complete/05_CSS_Deep_Reasoning.md) — 10 freeze moments.
