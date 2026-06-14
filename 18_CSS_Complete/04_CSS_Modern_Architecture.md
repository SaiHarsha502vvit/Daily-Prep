**Navigation**: [< Previous](03_CSS_Responsive_Animations.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_CSS_Deep_Reasoning.md)

**CSS Chapter 4/4** | [← Responsive & Animations](03_CSS_Responsive_Animations.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → Frontend Integration](../19_Frontend_Integration/01_React_JS_CSS_Combined.md)

# CSS Modern Architecture — Variables, Methodologies & Stunning UIs

## 5W1H — Why This Chapter?

WHAT: Modern CSS techniques for building scalable, maintainable
design systems: Custom Properties, methodologies, modern
selectors, and production-quality UI patterns.

WHY: Real projects have 1000+ CSS rules. Without organization,
CSS becomes unmaintainable spaghetti. Modern tools solve
specificity wars, naming conflicts, and design consistency.

WHO: Any developer working on projects beyond a single page.

HOW: CSS Custom Properties for design tokens. BEM or CSS
Modules for scoping. Building a design system.

---

## 1. CSS Custom Properties (Variables) — Design Tokens

```css
/* DEFINE variables on :root (available everywhere): */
:root {
  /* COLORS: */
  --color-primary: #3b82f6;
  --color-primary-light: #60a5fa;
  --color-primary-dark: #2563eb;
  --color-secondary: #8b5cf6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --color-bg: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;

  /* TYPOGRAPHY: */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */

  /* SPACING (consistent rhythm): */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */

  /* SHADOWS: */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* BORDER RADIUS: */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* TRANSITIONS: */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

/* USE variables: */
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  font-family: var(--font-sans);
  transition: box-shadow var(--transition-base);
}
.card:hover {
  box-shadow: var(--shadow-lg);
}

/* FALLBACK value: */
.element {
  color: var(
    --color-accent,
    #3b82f6
  ); /* Fallback if --color-accent undefined */
}
```

### Dark Mode with Custom Properties

```css
/* DARK MODE — Just override the variables: */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-border: #334155;
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }
}

/* OR with a class toggle (for manual switching): */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text: #e2e8f0;
  /* ... same overrides ... */
}

/* WHY THIS IS POWERFUL:
   Your components DON'T change AT ALL.
   .card uses var(--color-bg) → automatically gets the right color.
   One set of variables, entire theme changes. */
```

---

🔬 **Section Challenge — 1. CSS Custom Properties (Variables) — Design Tokens**

**Challenge 1 (Design System Reasoning):** A product has `#1d4ed8`, `8px`, and `16px` copied across dozens of components. The team now needs dark mode and brand refresh support. How should CSS custom properties change the architecture?

<details><summary>Trace, Reasoning & Debug</summary>

**Trace:** Hard-coded values make every component own design decisions. A brand change becomes a file-by-file hunt, and dark mode creates duplicated selectors or fragile overrides.

**Reasoning:** Design tokens move repeated decisions into named variables. Components should consume semantic tokens like `--color-action-bg`, `--space-3`, and `--radius-control`, while themes redefine token values at the root or container boundary.

**Debug/Fix:** Put primitive values in `:root`, expose semantic aliases for components, override theme values with `[data-theme="dark"]`, and audit components so they reference tokens instead of raw hex/spacing values.

</details>

## 2. CSS Naming Methodologies

### BEM (Block Element Modifier)

```
BEM: Block__Element--Modifier

Block: Independent component              .card
Element: Part of a block                  .card__title
Modifier: Variation/state                 .card--featured

VISUAL:
┌──────────────────────────────┐
│ .card                        │ ← Block
│  ┌────────────────────────┐  │
│  │ .card__image           │  │ ← Element
│  └────────────────────────┘  │
│  .card__title                │ ← Element
│  .card__description          │ ← Element
│  ┌────────────────────────┐  │
│  │ .card__button          │  │ ← Element
│  │ .card__button--primary │  │ ← Element + Modifier
│  └────────────────────────┘  │
└──────────────────────────────┘

.card--featured = modifier on the block
.card__button--disabled = modifier on the element

WHY BEM: Flat specificity (all single class), self-documenting,
no nesting conflicts, easy to understand relationship.
```

```css
/* BEM IN PRACTICE: */
.card {
}
.card--featured {
  border: 2px solid var(--color-primary);
}
.card__image {
  width: 100%;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.card__title {
  font-size: var(--font-size-xl);
  font-weight: 600;
}
.card__description {
  color: var(--color-text-muted);
}
.card__actions {
  display: flex;
  gap: var(--space-3);
}
.card__button {
}
.card__button--primary {
  background: var(--color-primary);
  color: white;
}
```

### CSS Modules (Most Used with React)

```css
/* Card.module.css */
.card {
  /* These class names get auto-scoped at build time */
  /* .card → .Card_card_x7f2a (unique hash) */
  background: var(--color-bg);
  border-radius: var(--radius-lg);
}
.title {
  /* .title → .Card_title_k3p9q */
  font-size: 1.25rem;
}
.featured {
  border: 2px solid var(--color-primary);
}
```

```tsx
// Card.tsx — import as object
import styles from "./Card.module.css";

function Card({ featured }: { featured?: boolean }) {
  return (
    <div className={`${styles.card} ${featured ? styles.featured : ""}`}>
      <h2 className={styles.title}>Title</h2>
    </div>
  );
}
// WHY: No naming conflicts ever! Each component's CSS is isolated.
```

---

## 3. Modern CSS Selectors (2023-2024)

```css
/* :has() — The "parent selector" (game-changer!): */
/* Style parent based on what children it contains: */
.card:has(img) {
  /* Cards WITH images get different padding */
  padding-top: 0;
}
form:has(:invalid) {
  /* Form border red if ANY field is invalid */
  border-color: var(--color-danger);
}
.card:has(.badge) {
  /* Card has a badge inside → extra padding top */
  padding-top: 2rem;
}

/* :is() — Simplify selector lists: */
/* Before: */
.card h1,
.card h2,
.card h3 {
  margin-bottom: 0.5em;
}
/* After: */
.card :is(h1, h2, h3) {
  margin-bottom: 0.5em;
}

/* :where() — Same as :is() but ZERO specificity: */
:where(.card, .panel, .section) {
  padding: 1rem; /* Easy to override — zero specificity! */
}

/* :not() — Enhanced: */
.nav-link:not(:last-child, .active) {
  border-right: 1px solid var(--color-border);
}

/* Nesting (native CSS!): */
.card {
  background: white;

  & .title {
    font-size: 1.25rem;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &.featured {
    border-color: blue;
  }

  @media (width >= 768px) {
    display: flex;
  }
}
/* REASONING: Native nesting means we don't need Sass/Less just
   for nesting anymore! Supported in Chrome 120+, Firefox 117+. */
```

---

## 4. Stunning UI Component Patterns

### Glassmorphism Card

```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/*  VISUAL:
    ┌─────────────────────────┐
    │  ╭─────────────────╮    │ ← Translucent background
    │  │  Blurred         │    │    with blur effect
    │  │  Background      │    │    behind the card
    │  │  Content Here    │    │
    │  ╰─────────────────╯    │
    │  ░░░░░░░░░░░░░░░░░░░   │ ← Content behind is blurred
    └─────────────────────────┘
*/
```

### Neumorphism

```css
.neumorph-card {
  background: #e0e5ec;
  border-radius: 20px;
  padding: 2rem;
  /* Light shadow (top-left) + Dark shadow (bottom-right) */
  box-shadow:
    8px 8px 16px #b8bec7,
    -8px -8px 16px #ffffff;
}
.neumorph-inset {
  /* "Pressed in" look: */
  box-shadow:
    inset 4px 4px 8px #b8bec7,
    inset -4px -4px 8px #ffffff;
}
```

### Modern Button Variants

```css
/* PRIMARY BUTTON with gradient: */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 7px 14px rgba(50, 50, 93, 0.1),
    0 3px 6px rgba(0, 0, 0, 0.08);
}

/* OUTLINE BUTTON: */
.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: calc(0.75rem - 2px) calc(1.5rem - 2px);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-outline:hover {
  background: var(--color-primary);
  color: white;
}

/* GHOST BUTTON: */
.btn-ghost {
  background: transparent;
  color: var(--color-text);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* ICON BUTTON: */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
```

### Modern Form Styling

```css
/* COMPLETE FORM INPUT: */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  background: var(--color-bg);
  color: var(--color-text);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-input:invalid:not(:placeholder-shown) {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

/* FLOATING LABEL: */
.float-group {
  position: relative;
}
.float-input {
  padding: 1.5rem 1rem 0.5rem;
}
.float-label {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
  pointer-events: none;
  transition: all 0.2s ease;
}
.float-input:focus ~ .float-label,
.float-input:not(:placeholder-shown) ~ .float-label {
  top: 0.5rem;
  transform: translateY(0);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}
```

### Toast Notification

```css
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  transform: translateY(120%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 9999;
}
.toast.show {
  transform: translateY(0);
  opacity: 1;
}
.toast--success {
  border-left: 4px solid var(--color-success);
}
.toast--error {
  border-left: 4px solid var(--color-danger);
}
.toast--warning {
  border-left: 4px solid var(--color-warning);
}
```

---

## 5. Complete Design System Tokens

```css
/* PRODUCTION-READY DESIGN SYSTEM: */
:root {
  /* === COLOR PALETTE === */
  /* Neutral (Gray): */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --gray-950: #020617;

  /* Primary (Blue): */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Semantic mappings: */
  --color-bg: var(--gray-50);
  --color-surface: #ffffff;
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-500);
  --color-border: var(--gray-200);
  --color-primary: var(--primary-500);
  --color-primary-fg: #ffffff;

  /* === ELEVATION (shadows as "height"): === */
  --elevation-1: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --elevation-2:
    0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --elevation-3:
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --elevation-4:
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --elevation-5:
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  /* === MOTION: === */
  --duration-fast: 100ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* DARK THEME OVERRIDE: */
[data-theme="dark"] {
  --color-bg: var(--gray-950);
  --color-surface: var(--gray-900);
  --color-text: var(--gray-100);
  --color-text-muted: var(--gray-400);
  --color-border: var(--gray-700);
  --color-primary: var(--primary-400);

  --elevation-1: 0 1px 2px rgba(0, 0, 0, 0.3);
  --elevation-2: 0 1px 3px rgba(0, 0, 0, 0.4);
  --elevation-3: 0 4px 6px rgba(0, 0, 0, 0.3);
}
```

---

## 6. CSS-in-JS & Tailwind — Beyond Traditional CSS

```
╔══════════════════════════════════════════════════════════════════════╗
║  CSS APPROACH      │ WHEN TO USE          │ TRADE-OFFS               ║
║  ──────────────────┼──────────────────────┼──────────────────────    ║
║  Plain CSS         │ Small projects       │ Global scope issues      ║
║  CSS Modules       │ React projects       │ Best scoping (✅)         ║
║  Tailwind CSS      │ Rapid prototyping    │ Verbose HTML, learn      ║
║  styled-components │ Dynamic styling      │ Runtime cost, bundle     ║
║  CSS-in-JS (Panda) │ Design system libs   │ Zero-runtime (✅)         ║
║                                                                      ║
║  INDUSTRY TREND (2024):                                              ║
║  CSS Modules + Tailwind = most popular combo                         ║
║  styled-components declining (runtime cost)                          ║
║  Zero-runtime CSS-in-JS rising (Panda CSS, vanilla-extract)          ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Tailwind Core Concepts

```html
<!-- Tailwind uses UTILITY CLASSES (atomic CSS): -->
<div
  class="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md
            hover:shadow-lg transition-shadow duration-200"
>
  <img class="w-12 h-12 rounded-full object-cover" src="..." alt="" />
  <div>
    <h3 class="text-lg font-semibold text-gray-900">Harsha</h3>
    <p class="text-sm text-gray-500">Developer</p>
  </div>
</div>

<!-- RESPONSIVE: prefix with breakpoint -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 1 col mobile, 2 tablet, 3 desktop -->
</div>

<!-- STATES: prefix with state -->
<button
  class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700
               focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
>
  Click Me
</button>

<!-- DARK MODE: prefix with dark: -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"></div>
```

---

## Interview Quick-Fire

```
Q: What are CSS custom properties?
→ Variables defined with -- prefix, accessed with var().
  Cascade and inherit. Can be changed at runtime (unlike Sass vars).
  Defined on :root for global, or on any selector for scoped.

Q: How do you implement dark mode?
→ Define color tokens as CSS custom properties. Override them in
  @media (prefers-color-scheme: dark) or [data-theme="dark"].
  Components use var(--color-bg) → automatically switch.

Q: What is BEM?
→ Block__Element--Modifier naming convention. Flat specificity,
  clear relationships. .card, .card__title, .card--featured.
  Prevents specificity wars and naming collisions.

Q: CSS Modules vs Tailwind?
→ CSS Modules: write normal CSS, auto-scoped by build tool.
  Tailwind: utility classes in HTML, no custom CSS files.
  Both solve scoping. Modules = traditional. Tailwind = rapid.

Q: What is the :has() selector?
→ A "parent selector" — style an element based on what it CONTAINS.
  form:has(:invalid) — style form if it has any invalid input.
  Supported in all modern browsers since 2023.

Q: What is a design system?
→ A set of reusable design tokens (colors, spacing, typography),
  components, and patterns that ensure visual consistency across
  a product. Implemented as CSS variables + component library.
```

---

---

## 7. The History of CSS — How We Got Here (1996 → 2024)

```
CSS VERSION TIMELINE:
  CSS1  (1996): Basic text/color/font styling. Browser wars began.
                Netscape and IE implemented it differently → "CSS is broken."

  CSS2  (1998): Positioning, z-index, pseudo-classes, print styles.
                But support fragmented. "This works in Firefox, not IE6."

  CSS2.1 (2004): Stabilization. Defined what browsers actually implement.

  CSS3  (2011+): Split into MODULES (not one huge spec).
                Flexbox (2009 draft → 2012 stable), gradients, animations,
                media queries, border-radius, box-shadow.
                This is when CSS became a real UI tool.

  CSS4+ (2018+): Now just "CSS" — continuous living standard.
                Grid (2017), Custom Properties (2017), Container Queries (2023),
                Cascade Layers (2022), :has() (2023), View Transitions (2024).

THE BROWSER_PREFIX ERA (2008-2016):
  Browsers implemented experimental features with vendor prefixes:
  -webkit-border-radius  (Chrome/Safari)
  -moz-border-radius     (Firefox)
  -ms-transform          (Internet Explorer)
  -o-transition          (Opera)

  We wrote FOUR versions of the same property!
  Today: autoprefixer does this automatically, and most features
  no longer need prefixes since browsers coordinate via W3C.
```

---

## 8. Container Queries — Component-Level Responsiveness (2023)

```
THE PROBLEM WITH MEDIA QUERIES:
  @media (min-width: 768px) — responds to VIEWPORT size.
  But what if your sidebar is narrow even on a large screen?
  A card in a 400px sidebar SHOULD look different from a card
  in a 1200px main content area — same viewport, different containers!

  CONTAINER QUERIES SOLUTION:
  Respond to the SIZE OF THE PARENT CONTAINER, not the viewport.

  ANALOGY: Smart employees vs rigid policy.
  Media queries = company policy: "Everyone works 8-hours if the office is big."
  Container queries = smart employees: "adapt to YOUR workspace, not the building."
```

```css
/* Step 1: Define the container */
.sidebar {
  container-type: inline-size; /* Track width changes */
  container-name: sidebar; /* Optional: name it for specificity */
}

.main-content {
  container-type: inline-size;
  container-name: content;
}

/* Step 2: Write container-responsive styles */
.card {
  /* Compact default (narrow container) */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* When the CONTAINER (not viewport) is > 400px wide */
@container (min-width: 400px) {
  .card {
    flex-direction: row; /* Horizontal layout in wide containers */
    gap: 1rem;
  }

  .card__image {
    width: 120px;
    flex-shrink: 0;
  }
}

/* Target a NAMED container specifically */
@container sidebar (min-width: 300px) {
  .card__title {
    font-size: 1.125rem;
  }
}

/* Container Query Units (cqw, cqh, cqi, cqb) */
.card__title {
  font-size: clamp(0.875rem, 4cqi, 1.5rem);
  /* 4cqi = 4% of the container's inline size (width) */
  /* Grows/shrinks based on parent width, not viewport */
}
```

---

## 9. Cascade Layers (@layer) — Taking Control of Specificity

```
THE SPECIFICITY PROBLEM:
  You're using a UI library (Bootstrap, Radix, Material).
  You want to override: .btn { color: red !important }
  The library uses !important too. Now you're fighting !important with !important.
  CSS specificity wars → maintenance nightmare.

  CASCADE LAYERS SOLUTION:
  Define explicit layers. Higher layers win, regardless of specificity.
  You control the cascade, not just the selectors.

  ANALOGY: Priority queues.
  Without layers: whoever has the most specific selector wins.
  With layers: YOU define which layer beats which. Custom code always wins.
```

```css
/* Define layer ORDER (later = higher priority) */
@layer reset, base, library, components, utilities;

/* Reset layer: lowest priority */
@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

/* Base layer: foundational html element styles */
@layer base {
  body {
    font-family: var(--font-sans);
    color: var(--color-text);
  }
  h1,
  h2,
  h3 {
    font-weight: 700;
  }
}

/* Library layer: third-party CSS goes here */
@layer library {
  @import url("bootstrap.css") layer(library); /* contained! */
}

/* Components layer: your component styles win over library */
@layer components {
  .btn {
    background: var(--color-primary);
    /* Wins over Library's .btn even with same specificity! */
  }
}

/* Utilities layer: highest priority rule of thumb */
@layer utilities {
  .hidden {
    display: none !important;
  } /* !important within a layer = very strong */
  .sr-only {
    /* accessible visually hidden */
  }
}

/* Styles OUTSIDE a layer > ALL layers */
.critical-override {
  display: none; /* Always wins, no layer contains this */
}
```

---

## 10. View Transitions API — Smooth Page Navigations (2024)

```
BEFORE VIEW TRANSITIONS:
  Navigating between pages = instant flash. No animation.
  SPAs used React transition libraries (React Spring, Framer Motion)
  to fake animations. Complex, library-dependent.

  VIEW TRANSITIONS API:
  Built into the browser! Works for both same-document and cross-document.
  Chrome 111+, Safari 18+, Firefox in development.
```

```css
/* Enable cross-document view transitions */
@view-transition {
  navigation: auto; /* Enable for all page navigations */
}

/* Name elements for matched transitions */
.hero-image {
  view-transition-name: hero-image; /* must be unique on page */
}

.page-title {
  view-transition-name: page-title;
}

/* Customize the transition animations */
::view-transition-old(hero-image) {
  animation: slide-out-left 0.3s ease;
}
::view-transition-new(hero-image) {
  animation: slide-in-right 0.3s ease;
}

@keyframes slide-out-left {
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Default fade for everything else */
::view-transition-old(root) {
  animation: 90ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
}
::view-transition-new(root) {
  animation: 210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in;
}
```

```javascript
// JavaScript: trigger transitions manually (same-document)
function navigateWithTransition(url) {
  if (!document.startViewTransition) {
    // Fallback for browsers without API support
    window.location.href = url;
    return;
  }

  document.startViewTransition(() => {
    // Everything in here runs during the transition
    // The browser captures before and after states
    updatePageContent(url); // React Router equivalent
  });
}
```

---

## 11. Modern CSS Functions — The Power Tools

```css
/* clamp() — responsive values without media queries! */
.heading {
  /* min 1rem, preferred 5vw, max 3rem */
  font-size: clamp(1rem, 5vw, 3rem);
  /* Never font-size: 20px + media queries needed! */
  /* clamp() handles it in one line */
}

.container {
  /* min 320px, preferred full width, max 1200px */
  width: clamp(320px, 100%, 1200px);
  margin-inline: auto; /* horizontal margin (logical property) */
}

/* min() and max() */
.card {
  width: min(400px, 100%); /* never wider than 400px or parent */
  padding: max(1rem, 3vw); /* minimum 1rem, grows with viewport */
}

/* color-mix() — mix colors in CSS */
.faded-primary {
  /* 80% primary blue + 20% white */
  background: color-mix(in srgb, var(--color-primary) 80%, white);
}
.dark-primary {
  background: color-mix(in srgb, var(--color-primary), black 20%);
}

/* LOGICAL PROPERTIES — RTL language support */
/* Instead of:                    Use: */
margin-left: 1rem; /* margin-inline-start: 1rem; */
padding-top: 1rem; /* padding-block-start: 1rem; */
border-left: 1px solid; /* border-inline-start: 1px solid; */
/* Logical properties flip automatically for RTL languages (Arabic, Hebrew)! */

/* CSS Nesting (now NATIVE in all modern browsers) */
.nav {
  display: flex;
  gap: 1rem;

  /* Nested rules */
  & > .nav__item {
    font-weight: 500;

    &:hover {
      color: var(--color-primary);
    }

    &.active {
      color: var(--color-primary);
      border-bottom: 2px solid currentColor;
    }
  }

  /* Nested media query */
  @media (width < 768px) {
    flex-direction: column;
  }
}
```

---

[← Responsive & Animations](03_CSS_Responsive_Animations.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → Frontend Integration](../19_Frontend_Integration/01_React_JS_CSS_Combined.md)

---

**Navigation**: [< Previous](03_CSS_Responsive_Animations.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_CSS_Deep_Reasoning.md)

🔬 **Section Challenge — 11. Modern CSS Functions — The Power Tools**

**Challenge 1 (Constraint Reasoning):** A card title should grow with available space but never go below `0.875rem` or above `1.5rem`. The card width should never exceed `400px`, and spacing must never drop below `1rem`. Which modern CSS functions solve this without extra media queries?

<details><summary>Trace, Reasoning & Debug</summary>

**Trace:** The constraints are min/preferred/max sizing for type, a hard upper bound for width, and a lower bound for spacing.

**Reasoning:** Use `clamp(min, preferred, max)` for fluid typography, `min(400px, 100%)` for width capped by the parent, and `max(1rem, 3vw)` for spacing that can grow but not shrink below the minimum.

**Debug/Fix:** Write the constraint directly in CSS: `font-size: clamp(0.875rem, 4cqi, 1.5rem)`, `width: min(400px, 100%)`, and `padding: max(1rem, 3vw)`. Then test narrow, normal, and wide containers instead of only viewport sizes.

</details>
