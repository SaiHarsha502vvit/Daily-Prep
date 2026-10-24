# 📝 CSS — Problem Sets

## `18_CSS_Complete` Module | Layout · Variables · Animations · Architecture

> **How to use:** All CSS goes in a CodePen or live Vite sandbox. Screenshot your solution. Read 🔴 **Erklärung** if your layout breaks on resize.

---

## Problem Set CSS-PS1 — Box Model & Layout Systems

**Prerequisites:** `18_CSS_Complete/01_CSS_Foundations.md`, `18_CSS_Complete/02_CSS_Layout_Systems.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the CSS box model? What is the difference between `box-sizing: content-box` and `box-sizing: border-box`?

<details><summary>Answer</summary>

**Content-box (default):** `width` applies only to the content area. Padding and border ADD to the total element size.

```css
.element {
  width: 200px; /* content only */
  padding: 20px; /* adds 40px total */
  border: 2px solid; /* adds 4px total */
  /* actual rendered width = 244px — NOT 200px */
}
```

**Border-box:** `width` includes padding and border. Total rendered width = declared width.

```css
* {
  box-sizing: border-box;
} /* always use this */

.element {
  width: 200px; /* includes content + padding + border */
  padding: 20px; /* content area = 200 - 40 - 4 = 156px */
  border: 2px solid;
  /* actual rendered width = 200px exactly */
}
```

🔴 **Erklärung:** ALWAYS set `*, *::before, *::after { box-sizing: border-box; }` as your first CSS reset. Without it, every `width` you set is a lie — the real width is wider because of padding/border. `border-box` matches what every designer expects.

</details>

---

**A2 (Medium).** When should you use CSS Grid vs Flexbox? Design this layout mentally:

- A 3-column dashboard with a sidebar (250px fixed), main content (flexible), and right panel (300px fixed)

<details><summary>Answer</summary>

**Rule of thumb:**

- **Flexbox:** One-dimensional layout — row OR column. Items flow along one axis. Good for: navbars, button groups, centering, card rows.
- **Grid:** Two-dimensional layout — rows AND columns simultaneously. Good for: page layouts, dashboards, magazine layouts, any grid.

**Solution:**

```css
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr 300px; /* fixed | flexible | fixed */
  grid-template-rows: auto;
  gap: 1rem;
  height: 100vh;
}

/* Responsive collapse: below 768px, stack vertically */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr; /* single column */
  }
  .sidebar,
  .right-panel {
    display: none; /* or use a hamburger menu */
  }
}
```

🔴 **Erklärung:** The most common mistake is using Flexbox for everything and nesting 6 levels deep. A single CSS Grid declaration handles the entire page layout in 3 lines. Use Grid for structure, Flexbox for content alignment within cells.

</details>

---

**A3 (Hard).** Explain the CSS stacking context. Why does this z-index NOT work?

```css
.parent {
  position: relative;
  opacity: 0.99;
  z-index: 1;
}
.child {
  position: absolute;
  z-index: 9999;
}
.other {
  position: relative;
  z-index: 2;
}

/* .child appears BEHIND .other even though z-index: 9999 */
```

<details><summary>Answer</summary>

**Stacking context:** A "layer" that contains all its children. Children's `z-index` values are only compared WITHIN the same stacking context — they cannot "escape" their parent's stacking order.

**Why `opacity: 0.99` caused the problem:** Setting `opacity` to anything except `1` creates a NEW stacking context on `.parent`. So:

- `.parent` has `z-index: 1` relative to its parent's context
- `.other` has `z-index: 2` — higher than `.parent`
- `.child` has `z-index: 9999` but within `.parent`'s context — irrelevant to `.other`

**What creates a stacking context:**

- `position: relative/absolute/fixed` + any `z-index`
- `opacity < 1`
- `transform: translate/rotate/scale` (any non-none value)
- `filter` (any non-none value)
- `will-change: transform`
- `isolation: isolate`

**Fix:** Remove `opacity: 0.99` from `.parent`, or increase `.parent`'s `z-index` above `.other`.

🔴 **Erklärung:** This is one of CSS's most confusing behaviours. `opacity: 0.999` vs `opacity: 1` — one creates a stacking context, the other doesn't. Adding a `transform` or `filter` to any ancestor "traps" all its descendants' z-indexes.

</details>

---

### Part B: Build It

**B1.** Build a responsive 4-column card grid that:

- 4 columns on desktop (> 1200px)
- 2 columns on tablet (768px–1200px)
- 1 column on mobile (< 768px)
- Cards have equal height (stretch to fill column)
- Gap of 24px between cards

```css
/* cards/grid.css — complete this */
.card-grid {
  display: grid;
  gap: 24px;
  /* TODO: set 4 columns with minmax for responsiveness */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  /* TODO: make cards equal height within rows */
  display: flex;
  flex-direction: column;
}

.card__body {
  flex: 1; /* pushes footer to bottom */
}

.card__footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
```

**B2.** Center a modal dialog — both horizontally AND vertically — without using `margin: auto`. Three valid CSS approaches:

<details><summary>3 Approaches</summary>

```css
/* Approach 1: Flexbox on overlay */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

/* Approach 2: CSS Grid on overlay */
.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center; /* shorthand for align-items + justify-items */
}

/* Approach 3: Transform (old school, still valid) */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

`place-items: center` is the most concise. `translate(-50%, -50%)` is useful when you can't modify the parent.

</details>

---

## Problem Set CSS-PS2 — Variables, Theming & Animations

---

### Part A: Theoretical

**A1 (Medium).** Implement a complete dark/light mode toggle using ONLY CSS variables. No JavaScript state. What's the correct pattern?

<details><summary>Answer</summary>

```css
/* Define themes at :root level */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --accent: #6366f1;
  --border: #e2e8f0;
}

/* Override on [data-theme="dark"] attribute */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent: #818cf8;
  --border: #334155;
}

/* Use variables everywhere — no hardcoded colors */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}

/* JavaScript: toggle data-theme */
/* document.documentElement.setAttribute('data-theme', 'dark') */
```

**Bonus — respect OS preference:**

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* same as [data-theme="dark"] */
  }
}
```

🔴 **Erklärung:** Never hardcode colors. Every color value must reference a CSS variable. When you add a third theme (e.g., "high contrast"), you only add one CSS rule — nothing else changes. This is the only scalable approach.

</details>

---

**A2 (Hard).** Build a skeleton loading animation using CSS only (no JavaScript):

```css
/* skeleton/skeleton.css */

/* The shimmer effect moves left-to-right */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #1e293b 25%,
    /* dark */ #334155 50%,
    /* lighter = shimmer highlight */ #1e293b 75% /* dark */
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

/* Skeleton variants */
.skeleton--text {
  height: 1em;
  margin-bottom: 0.5em;
}
.skeleton--title {
  height: 1.5em;
  width: 60%;
}
.skeleton--avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}
.skeleton--card {
  height: 200px;
  border-radius: 12px;
}

/* Usage: replace real content with skeletons while loading */
/* <div class="skeleton skeleton--text"></div> */
/* <div class="skeleton skeleton--title"></div> */
```

---

**A3 (Medium).** Implement a button with ALL hover/focus/active states and a loading state:

```css
/* button/button.css */
.btn {
  /* Base */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  /* Primary variant */
  background: var(--accent);
  color: white;
}

/* States */
.btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 85%, black); /* darken by 15% */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
.btn--loading {
  position: relative;
  color: transparent; /* hide text */
  pointer-events: none;
}

.btn--loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## Problem Set CSS-PS3 — Architecture & Performance

---

**A1 (Hard).** What is CSS specificity? Calculate the specificity of each selector:

```css
/* 1 */
p {
}
/* 2 */
.card p {
}
/* 3 */
#main .card p {
}
/* 4 */
.card p:first-child {
}
/* 5 */
button.btn[type="submit"]:hover {
}
```

<details><summary>Answer</summary>

Specificity is calculated as `(IDs, Classes, Elements)` — a three-part number:

| Selector                          | IDs | Classes/Attrs/Pseudo-classes | Elements/Pseudo-elements | Total   |
| --------------------------------- | --- | ---------------------------- | ------------------------ | ------- |
| `p`                               | 0   | 0                            | 1                        | (0,0,1) |
| `.card p`                         | 0   | 1                            | 1                        | (0,1,1) |
| `#main .card p`                   | 1   | 1                            | 1                        | (1,1,1) |
| `.card p:first-child`             | 0   | 2                            | 1                        | (0,2,1) |
| `button.btn[type="submit"]:hover` | 0   | 3                            | 1                        | (0,3,1) |

**Priority order:** `!important` > inline styles > ID > class/attr/pseudo-class > element

🔴 **Erklärung:** NEVER use `!important` to fix specificity wars — it creates a nuclear escalation. Instead, use CSS custom properties (variables) for theming, and keep selector specificity as low as possible. BEM methodology (`.card__title`) keeps all selectors at one class = `(0,1,0)` specificity — consistent and predictable.

</details>

---

**A2 (Medium).** `will-change` — when does it help, when does it hurt?

<details><summary>Answer</summary>

`will-change: transform` tells the browser: "This element is about to animate. Promote it to its own GPU layer NOW."

**When it helps:**

```css
/* An element that animates on hover */
.card {
  transition: transform 0.3s;
}
.card:hover {
  transform: translateY(-4px);
}
/* Adding will-change tells browser to pre-compose the layer */
/* Result: smoother animation, no jank on first hover */
```

**When it hurts:**

```css
/* ❌ BAD: Apply to everything */
* {
  will-change: transform;
} /* promotes ALL elements to GPU layers */
/* Result: massive GPU memory usage, possible crashes on mobile */

/* ❌ BAD: Static elements */
.static-div {
  will-change: transform;
} /* never animates — wastes GPU memory */
```

**Rule:** Only add `will-change` to elements that ACTUALLY animate, and remove it after animation:

```javascript
element.addEventListener("animationend", () => {
  element.style.willChange = "auto";
});
```

🔴 **Erklärung:** Each `will-change` element is promoted to a GPU compositing layer. Mobile devices have limited GPU memory. 50 promoted layers = GPU thrashing, worse performance than no `will-change` at all. Measure first with DevTools → Performance tab.

</details>

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)


---

## Reality Check

**"CSS practice means reading about layout until it makes sense"** — CSS is a MOTOR skill wearing a declarative syntax: the gap between recognizing flexbox properties and producing a correct three-region layout under time pressure is the gap problem sets exist to close. The effective drill format is build-from-visual (here is a screenshot, produce it — no framework, timer on) because that is both the job and the interview format, and it forces the decisions reading never does: which container, which sizing, where the breakpoints actually need to be.

**"Layout challenges are solved when they look right"** — Looks-right is the WEAKEST acceptance bar; the problem-set bar adds the stress tests that distinguish robust from coincidental: does it survive 3x content (the tab that becomes German), zero content (the empty list), container resize (drag the DevTools handle across the whole range, watch for the snap-jump that reveals a hardcoded width), and keyboard traversal (can you even see focus). A layout that passes all four is understood; one that passes only the screenshot was pixel luck — and the retrospective question "WHICH property made it fragile" is where the learning density is.

**"The classic challenges (holy grail, centering) are outdated"** — The classics persist as VOCABULARY tests with modern expected answers — and the answer's era is the actual signal: centering via grid + place-items (one line) versus absolute-transform hacks, holy grail via grid-template-areas versus float ceremony, equal-height cards via default flex stretch versus JS measurement. Interviewers ask the old questions precisely to date your CSS; problem sets should therefore be solved in CURRENT idiom deliberately, with the legacy solution known only as a talking point ("before grid, this took...").

**"Debugging challenges teach less than building challenges"** — Fix-this-broken-layout drills train the DIAGNOSTIC loop that building never exercises: reproduce, isolate (delete half the CSS, bisect), identify the mechanism (which formatting context, which sizing pass, which stacking context), then fix at the mechanism level — the same loop as production CSS work, where you inherit stylesheets rather than author them. A balanced problem set is half construction, half autopsy; all-construction practice produces developers who can build clean-room layouts and cannot rescue real ones.

**"CSS problem sets don't need spaced repetition — it's not memorization"** — The DECAY is real but it hits the decision layer, not the property names: which sizing approach for this shape of problem, which of the four centering tools fits this constraint set, what breaks first at narrow widths — judgment calls that go stale without reps. The maintenance dose mirrors algorithm practice: one timed build-from-visual weekly-ish, rotating through the layout archetypes (app shell, card grid, form, data table, overlay stack), plus one autopsy of any production CSS bug you meet — the anchor that keeps the whole system honest.
