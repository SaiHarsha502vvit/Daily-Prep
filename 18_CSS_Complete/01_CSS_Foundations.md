**CSS Chapter 1/4** | [Index](../00_MASTER_INDEX.md) | [Next → Layout Systems](02_CSS_Layout_Systems.md)

# CSS Foundations — Selectors, Cascade, Box Model & Display

## Section 0: War Stories — When CSS Basics Burned Production UIs

> These were real UI bugs caused by misunderstanding the exact concepts this chapter teaches — the cascade, specificity, and the box model.

### Story 1: The Specificity War — A `!important` Cascade That Took 3 Days to Untangle

A team added a `!important` to fix a button color override in a hurry:

```css
/* In component.css */
.btn-primary { background: blue !important; }
```

A month later, a new designer's theme file tried to override it:

```css
/* In theme.css */
.btn-primary { background: green; } /* ← silently loses to !important */
```

The button stayed blue. The designer reported it as "Tailwind broken." A developer added another `!important` to the theme file to win:

```css
.btn-primary { background: green !important; }
```

Now a third developer's dark-mode override needed to win. They added another `!important`. Within 3 weeks, 14 `!important` declarations were fighting over 3 different button colors in 4 different files. No one could predict which color would render.

The fix: understand specificity scoring and use it instead of `!important`:

```
Specificity (a, b, c):
  a = inline styles        → (1,0,0)
  b = IDs                  → (0,1,0)
  c = classes/attributes   → (0,0,1)
  elements/pseudo-elements → (0,0,0) (lowest)

.btn-primary              → (0,0,1)
.theme .btn-primary       → (0,0,2)  ← wins over single class
.dark-mode .btn-primary   → (0,0,2)  ← same score, last-declared wins
#header .btn-primary      → (0,1,1)  ← always wins over classes
```

**The lesson:** `!important` overrides the entire specificity system, making styles unpredictable. Use specificity-based selectors instead. Section 2 of this chapter explains the full scoring system.

---

### Story 2: The Box Model Bug That Broke Every Form Layout in IE

A team's form inputs were wider than their containers on Internet Explorer:

```css
.form-field {
  width: 100%; /* = content width */
  padding: 12px;
  border: 2px solid #ccc;
}
```

Chrome: input = 100% wide (looks correct). IE: input = 100% + 24px padding + 4px border = 128px **wider** than the container.

Root cause: the W3C box model default (`box-sizing: content-box`) adds padding and border **outside** the declared width. `width: 100%` means "the content area is 100%," not "the total element is 100%."

Fix: `box-sizing: border-box` includes padding and border within the declared width:

```css
/* ✅ Modern baseline — paste this at the top of every CSS file */
*, *::before, *::after {
  box-sizing: border-box;
}

.form-field {
  width: 100%;    /* Now total element is 100% — padding counted inside */
  padding: 12px;  /* Does NOT add to width */
  border: 2px solid #ccc; /* Does NOT add to width */
}
```

Every modern CSS reset (Normalize.css, Tailwind's preflight) includes `box-sizing: border-box` for exactly this reason.

**The lesson:** the default `content-box` model is unintuitive. Always set `box-sizing: border-box` globally. Section 3 of this chapter explains both models visually.

---

### Story 3: The Cascade Order That Made a Dark Mode Override Never Apply

A React app had a dark mode class on the `<body>`. Developers expected dark mode styles to override default styles:

```css
/* globals.css — loaded first */
.card { background: white; color: black; }

/* dark-mode.css — loaded second */
body.dark-mode .card { background: #1a1a1a; color: white; }
```

Dark mode styles applied correctly — on desktop. On mobile, they didn't. The mobile CSS file was loaded third:

```css
/* mobile.css — loaded third */
@media (max-width: 768px) {
  .card { background: white; color: black; } /* ← same specificity as globals.css */
}
```

CSS rule: when specificity is equal, **the last declaration wins**. On mobile, `mobile.css` (position 3) loaded after `dark-mode.css` (position 2), so `mobile.css`'s `.card` rule won — always, regardless of dark mode.

Fix: increase dark mode specificity OR ensure cascade order:

```css
/* Option A: increase specificity */
body.dark-mode .card { background: #1a1a1a; } /* (0,1,1) vs (0,0,1) */

/* Option B: media query inside dark-mode.css, loaded last */
@media (max-width: 768px) {
  body.dark-mode .card { background: #1a1a1a; }
}
```

**The lesson:** cascade order (which stylesheet loads last) is the tiebreaker when specificity is equal. Media queries don't increase specificity — they're just conditions on when a rule applies.

---

## 5W1H — Why This Chapter?

WHAT: CSS (Cascading Style Sheets) controls HOW HTML looks.
Layout, colors, typography, spacing, animations.

WHY: HTML alone = newspaper from 1995. CSS = modern web.
Without CSS skills, you CAN'T build professional UIs.
React components need CSS. Debugging layout issues needs
deep CSS understanding.

WHO: Every frontend developer. Even "backend-focused" devs
need CSS basics for full-stack work.

WHEN: After HTML basics. Before learning any CSS framework.
CSS fundamentals are FOREVER — Tailwind/Bootstrap change.

WHERE: Browsers render CSS. Every website, web app, email
template, mobile webview uses CSS.

HOW: CSS rules = selector { property: value; }
Selector targets HTML. Properties change appearance.
The CASCADE determines which rule wins when conflicts.

---

## 1. CSS Selectors — Targeting HTML Elements

### Basic Selectors

```css
/* ELEMENT selector — targets ALL of that element */
p {
  color: blue;
} /* Every <p> */
h1 {
  font-size: 2rem;
} /* Every <h1> */

/* CLASS selector — targets elements with that class */
.card {
  border: 1px solid #ccc;
}
.btn-primary {
  background: #3b82f6;
}

/* ID selector — targets ONE specific element */
#header {
  position: fixed;
}
#main-content {
  max-width: 1200px;
}

/* UNIVERSAL selector — targets everything */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ATTRIBUTE selector */
input[type="email"] {
  border-color: blue;
}
a[href^="https"] {
  color: green;
} /* starts with */
a[href$=".pdf"] {
  color: red;
} /* ends with */
img[alt] {
  border: 2px solid green;
} /* has attribute */
```

### Combinators — Relationships Between Elements

```
COMBINATOR VISUALIZATION:

HTML Structure:
<div class="parent">
  ├── <p>Direct child</p>          ← child (>)
  ├── <section>
  │     └── <p>Nested</p>          ← descendant (space)
  ├── <p>Another child</p>         ← child (>)
  └── <p>Yet another</p>           ← child (>)
</div>
<p>Sibling after div</p>           ← adjacent sibling (+)
<p>Another sibling</p>             ← general sibling (~)

SELECTOR              │ WHAT IT TARGETS
──────────────────────┼──────────────────────────────────────
.parent p             │ ALL <p> inside .parent (any depth)
.parent > p           │ ONLY direct <p> children of .parent
.parent + p           │ First <p> immediately after .parent
.parent ~ p           │ ALL <p> siblings after .parent
```

```css
/* DESCENDANT (space) — any depth */
.sidebar a {
  color: white;
} /* Any <a> inside .sidebar */

/* CHILD (>) — direct children only */
.nav > li {
  display: inline-block;
} /* Only direct <li> in .nav */

/* ADJACENT SIBLING (+) — immediately next */
h2 + p {
  font-size: 1.1em;
} /* <p> right after <h2> */

/* GENERAL SIBLING (~) — all following siblings */
h2 ~ p {
  color: gray;
} /* All <p> after <h2>, same parent */
```

### Pseudo-Classes & Pseudo-Elements

```css
/* PSEUDO-CLASSES — state of elements */
a:hover {
  color: red;
} /* Mouse over link */
a:active {
  color: darkred;
} /* Being clicked */
a:visited {
  color: purple;
} /* Already visited */
input:focus {
  outline: 2px solid blue;
}
input:disabled {
  opacity: 0.5;
}
input:valid {
  border-color: green;
}
input:invalid {
  border-color: red;
}
input:placeholder-shown {
  font-style: italic;
}

/* STRUCTURAL pseudo-classes */
li:first-child {
  font-weight: bold;
}
li:last-child {
  border-bottom: none;
}
li:nth-child(odd) {
  background: #f5f5f5;
} /* 1st, 3rd, 5th... */
li:nth-child(3n) {
  color: red;
} /* Every 3rd */
li:nth-child(n + 4) {
  opacity: 0.8;
} /* 4th and beyond */
p:not(.special) {
  margin-bottom: 1em;
} /* All except .special */
div:empty {
  display: none;
} /* No children */
section:has(> h2) {
  padding-top: 2em;
} /* Contains h2 (NEW!) */

/* PSEUDO-ELEMENTS — parts of elements */
p::first-line {
  font-variant: small-caps;
}
p::first-letter {
  font-size: 3em;
  float: left;
}
.quote::before {
  content: '"';
  font-size: 2em;
}
.quote::after {
  content: '"';
  font-size: 2em;
}
::selection {
  background: #3b82f6;
  color: white;
}
input::placeholder {
  color: #999;
}
li::marker {
  color: #3b82f6;
} /* Bullet/number color */
```

---

## 2. The Cascade — How CSS Resolves Conflicts

```
WHEN MULTIPLE RULES TARGET THE SAME ELEMENT, WHO WINS?

The CASCADE resolves in this ORDER (highest to lowest priority):

┌─────────────────────────────────────────────────────────┐
│ 1. !important declarations         (AVOID!)             │
│ 2. Inline styles (style="...")      (RARE)              │
│ 3. ID selectors (#id)              (HIGHEST specificity)│
│ 4. Class/attribute/pseudo-class    (.class, [attr])     │
│ 5. Element/pseudo-element          (p, ::before)        │
│ 6. Universal (*)                   (LOWEST specificity) │
└─────────────────────────────────────────────────────────┘

If SPECIFICITY is EQUAL → LAST rule in source order wins.
```

### Specificity Calculator

```
╔══════════════════════════════════════════════════════════════════════╗
║  SPECIFICITY = (Inline, IDs, Classes, Elements)                      ║
║                                                                      ║
║  Selector                    │ Specificity │ Score                   ║
║  ────────────────────────────┼─────────────┼──────                   ║
║  *                           │ (0,0,0,0)   │ 0                       ║
║  p                           │ (0,0,0,1)   │ 1                       ║
║  p.intro                     │ (0,0,1,1)   │ 11                      ║
║  .nav .link                  │ (0,0,2,0)   │ 20                      ║
║  #header                     │ (0,1,0,0)   │ 100                     ║
║  #header .nav .link          │ (0,1,2,0)   │ 120                     ║
║  #header .nav a:hover        │ (0,1,2,1)   │ 121                     ║
║  style="color: red"          │ (1,0,0,0)   │ 1000                    ║
║                                                                      ║
║  REASONING: Each category is a different "weight class."             ║
║  100 classes CANNOT beat 1 ID. It's not really addition —            ║
║  it's comparison by category: IDs beat Classes beat Elements.        ║
║                                                                      ║
║  TIPS:                                                               ║
║  • :not() doesn't add specificity, but its ARGUMENT does             ║
║  • :is() takes specificity of its MOST specific argument             ║
║  • :where() has ZERO specificity (great for resets!)                 ║
║  • :has() takes specificity of its argument                          ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Inheritance

```css
/* Some properties INHERIT by default (from parent to children): */
/* INHERIT: color, font-*, text-*, letter-spacing, word-spacing,   */
/*          line-height, visibility, cursor, list-style             */
/* DON'T INHERIT: margin, padding, border, background, display,     */
/*                width, height, position, overflow                 */

/* Control inheritance explicitly: */
.child {
  color: inherit; /* Use parent's value */
  margin: initial; /* Use browser default */
  padding: unset; /* inherit if inheritable, else initial */
  border: revert; /* Use user-agent stylesheet value */
}
```

---

## 3. The Box Model — Foundation of All Layout

```

THE CSS BOX MODEL (Every element is a box):

┌─────────────────────────────────────────────────────────┐
│                    MARGIN                               │
│   ┌───────────────────────────────────────────────┐     │
│   │               BORDER                          │     │
│   │   ┌───────────────────────────────────────┐   │     │
│   │   │           PADDING                     │   │     │
│   │   │   ┌───────────────────────────────┐   │   │     │
│   │   │   │                               │   │   │     │
│   │   │   │        CONTENT                │   │   │     │
│   │   │   │     (width × height)          │   │   │     │
│   │   │   │                               │   │   │     │
│   │   │   └───────────────────────────────┘   │   │     │
│   │   │                                       │   │     │
│   │   └───────────────────────────────────────┘   │     │
│   │                                               │     │
│   └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘

CONTENT-BOX (default):
  width: 300px = content is 300px
  Total = 300 + padding + border (BIGGER than you set!)

BORDER-BOX (what you want):
  width: 300px = content + padding + border = 300px total
  Content shrinks to fit. WHAT YOU SET IS WHAT YOU GET.
```

```css
/* ALWAYS USE THIS RESET: */
*,
*::before,
*::after {
  box-sizing: border-box;
}
/* REASONING: Without border-box, adding padding makes elements BIGGER
   than their set width. border-box makes width = total width.
   Every CSS framework uses this. Every professional uses this. */

/* BOX MODEL PROPERTIES: */
.card {
  /* CONTENT */
  width: 300px;
  height: auto; /* Height based on content */
  min-width: 200px;
  max-width: 500px;
  min-height: 100px;

  /* PADDING (inside border) */
  padding: 20px; /* All sides */
  padding: 10px 20px; /* Vertical | Horizontal */
  padding: 10px 20px 15px; /* Top | Horizontal | Bottom */
  padding: 10px 20px 15px 5px; /* Top | Right | Bottom | Left (clockwise) */

  /* BORDER */
  border: 2px solid #e2e8f0;
  border-radius: 8px; /* Rounded corners */
  border-radius: 50%; /* Circle (if equal width/height) */

  /* MARGIN (outside border) */
  margin: 20px;
  margin: 0 auto; /* Center horizontally (needs defined width) */
}
```

### Margin Collapse — The Most Confusing CSS Behavior

```
MARGIN COLLAPSE: When vertical margins of adjacent elements
OVERLAP instead of adding up.

BEFORE understanding collapse:
You expect: margin-bottom(20px) + margin-top(30px) = 50px gap
Reality:    They COLLAPSE to max(20px, 30px) = 30px gap

┌─────────────────┐
│    Element A    │
│  margin-bottom: │
│     20px        │
└─────────────────┘
      ↕ 30px (NOT 50px) ← margins COLLAPSE to larger
┌─────────────────┐
│    Element B    │
│  margin-top:    │
│     30px        │
└─────────────────┘

RULES:
• Only VERTICAL margins collapse (not horizontal)
• Only ADJACENT siblings or parent-child (no border/padding)
• NOT in flexbox, grid, float, or absolute position contexts
• Negative margins: -20 + 30 = 10px (they add)

FIX/PREVENT:
• Use flexbox (gap never collapses)
• Add border or padding to parent
• Use overflow: hidden on parent
```

---

## 4. Display Property — How Elements Behave

```
display VALUE  │ BEHAVIOR
───────────────┼─────────────────────────────────────────────
block          │ Takes full width. New line before/after.
               │ Can set width/height. <div>, <p>, <h1>
───────────────┼─────────────────────────────────────────────
inline         │ Only as wide as content. NO width/height.
               │ Same line as neighbors. <span>, <a>, <strong>
───────────────┼─────────────────────────────────────────────
inline-block   │ Inline flow BUT allows width/height.
               │ Best of both worlds. <img>, <button>
───────────────┼─────────────────────────────────────────────
none           │ Element GONE from layout (not just invisible).
               │ vs visibility: hidden (invisible but takes space)
───────────────┼─────────────────────────────────────────────
flex           │ Element becomes FLEX CONTAINER.
               │ Children become flex items. (Chapter 2)
───────────────┼─────────────────────────────────────────────
grid           │ Element becomes GRID CONTAINER.
               │ Children placed in grid cells. (Chapter 2)
───────────────┼─────────────────────────────────────────────
contents       │ Element box disappears, children act as if
               │ they're direct children of grandparent.
```

```css
/* VISUAL COMPARISON: */

/* BLOCK elements stack: */
/*  ┌──────────────────────┐
    │      div (block)     │
    └──────────────────────┘
    ┌──────────────────────┐
    │      div (block)     │
    └──────────────────────┘  */

/* INLINE elements flow: */
/*  [span] [a] [strong] [span] [a] [strong]
    [span] [a] ...  wraps to next line       */

/* INLINE-BLOCK: like inline but with dimensions */
/*  ┌──────┐ ┌──────┐ ┌──────┐
    │ 100px│ │ 100px│ │ 100px│  on same line
    │ high │ │ high │ │ high │  with set height
    └──────┘ └──────┘ └──────┘               */
```

---

## 5. Colors, Typography & Units

### Color Systems

```css
/* 6 WAYS TO SPECIFY COLOR: */
.element {
  color: red; /* Named (140+ names) */
  color: #ff0000; /* Hex (6 digits: RRGGBB) */
  color: #f00; /* Hex shorthand */
  color: #ff000080; /* Hex with alpha (8 digits) */
  color: rgb(255, 0, 0); /* RGB function */
  color: rgba(255, 0, 0, 0.5); /* RGB with alpha */
  color: hsl(0, 100%, 50%); /* HSL (Hue, Saturation, Lightness) */
  color: hsla(0, 100%, 50%, 0.5); /* HSL with alpha */
}

/* HSL IS THE BEST FOR DESIGN SYSTEMS: */
/*
   H (Hue):        0-360° on color wheel (0=red, 120=green, 240=blue)
   S (Saturation): 0%=gray, 100%=vivid
   L (Lightness):  0%=black, 50%=normal, 100%=white

   WHY HSL: Easy to create consistent palettes:
   Primary:    hsl(220, 80%, 50%)
   Lighter:    hsl(220, 80%, 70%)    ← Just increase L
   Darker:     hsl(220, 80%, 30%)    ← Just decrease L
   Muted:      hsl(220, 30%, 50%)    ← Decrease S
*/
```

### Units — The Complete Guide

```
╔══════════════════════════════════════════════════════════════════════╗
║  UNIT  │ RELATIVE TO      │ USE CASE                                 ║
║  ──────┼──────────────────┼───────────────────────────────────       ║
║  px    │ Absolute (1/96") │ Borders, shadows, fine details           ║
║  rem   │ Root font-size   │ Font sizes, spacing, MOST things         ║
║  em    │ Parent font-size │ Relative to current text size            ║
║  %     │ Parent element   │ Widths, heights, layout                  ║
║  vw    │ Viewport width   │ Full-width sections, fluid text          ║
║  vh    │ Viewport height  │ Full-height sections, hero banners       ║
║  dvh   │ Dynamic viewport │ Mobile-safe vh (accounts for toolbar)    ║
║  ch    │ Width of "0"     │ Max-width for text (60-70ch ideal)       ║
║  fr    │ Grid fraction    │ Grid column/row sizing                   ║
║                                                                      ║
║  GOLDEN RULES:                                                       ║
║  1. Use rem for font-size (scales with user preferences)             ║
║  2. Use rem for spacing (consistent rhythm)                          ║
║  3. Use px for borders and shadows (should NOT scale)                ║
║  4. Use % or fr for layout widths                                    ║
║  5. NEVER use px for font-size (breaks accessibility!)               ║
║                                                                      ║
║  BASE: 1rem = 16px (browser default)                                 ║
║  TRICK: html { font-size: 62.5%; } → 1rem = 10px (easy math)         ║
║         body { font-size: 1.6rem; } → back to 16px base              ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Typography

```css
.text {
  /* FONT FAMILY (with fallback stack): */
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;

  /* FONT SIZE (use rem!): */
  font-size: 1rem; /* 16px */
  font-size: 1.125rem; /* 18px */
  font-size: 1.5rem; /* 24px */
  font-size: clamp(1rem, 2.5vw, 2rem); /* Fluid: min, preferred, max */

  /* FONT WEIGHT: */
  font-weight: 400; /* Normal */
  font-weight: 500; /* Medium */
  font-weight: 600; /* Semi-bold */
  font-weight: 700; /* Bold */

  /* LINE HEIGHT (unitless is best!): */
  line-height: 1.5; /* 1.5× font size — good for body */
  line-height: 1.2; /* Tighter for headings */

  /* LETTER & WORD SPACING: */
  letter-spacing: -0.02em; /* Tighter (headings) */
  letter-spacing: 0.05em; /* Wider (uppercase labels) */

  /* TEXT PROPERTIES: */
  text-align: center;
  text-transform: uppercase;
  text-decoration: none;
  text-overflow: ellipsis; /* ... for overflow */
  white-space: nowrap; /* Prevent wrapping */
  overflow: hidden; /* Required for ellipsis */
}

/* RESPONSIVE TYPE SCALE: */
/*
   Level    │ Desktop    │ Mobile     │ Use
   ─────────┼────────────┼────────────┼────────────
   h1       │ 3rem (48px)│ 2rem (32px)│ Page title
   h2       │ 2.25rem    │ 1.75rem    │ Sections
   h3       │ 1.5rem     │ 1.25rem    │ Subsections
   body     │ 1rem (16px)│ 1rem       │ Paragraphs
   small    │ 0.875rem   │ 0.875rem   │ Captions
   tiny     │ 0.75rem    │ 0.75rem    │ Labels
*/
```

---

🔬 **Section Challenge — 5. Colors, Typography & Units**

**Challenge 1 (Reasoning):** You write `.card .title { color: red; }` and also `#main .title { color: blue; }`. Both match the same element. Which wins and why? Now add `!important` to the first — what changes?

<details><summary>Answer</summary>

Without `!important`: `#main .title` wins because ID selectors (specificity `1-1-0`) outweigh class selectors (specificity `0-2-0`). Specificity is calculated as `(inline, ID, class, element)`. With `!important` on the first rule: the first rule wins because `!important` creates a separate priority tier that overrides ALL normal specificity. But if BOTH have `!important`, specificity decides again. This is why `!important` is dangerous — the only way to override `!important` is more `!important`, leading to specificity arms races.

</details>

## 6. Backgrounds, Shadows & Borders

```css
.card {
  /* BACKGROUND: */
  background-color: #ffffff;
  background-image: url("/hero.jpg");
  background-size: cover; /* Fill container */
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed; /* Parallax effect */

  /* GRADIENT: */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: radial-gradient(circle, #fff 0%, #ddd 100%);

  /* MULTIPLE BACKGROUNDS: */
  background:
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url("/hero.jpg") center/cover;

  /* BORDER: */
  border: 1px solid #e2e8f0;
  border-radius: 12px; /* Rounded */
  border-radius: 12px 12px 0 0; /* Top only */

  /* BOX SHADOW: */
  /* offset-x | offset-y | blur | spread | color */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Subtle */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* Medium */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); /* Large (floating) */

  /* MULTIPLE SHADOWS (layered = realistic): */
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 4px 8px rgba(0, 0, 0, 0.08),
    0 12px 24px rgba(0, 0, 0, 0.06);

  /* TEXT SHADOW: */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  /* OUTLINE (doesn't affect layout): */
  outline: 2px solid #3b82f6;
  outline-offset: 2px; /* Space between element and outline */
}
```

---

## 7. Positioning — Placing Elements Precisely

```
╔══════════════════════════════════════════════════════════════════════╗
║  POSITION │ RELATIVE TO         │ IN FLOW? │ USE CASE                ║
║  ─────────┼─────────────────────┼──────────┼──────────────────       ║
║  static   │ Normal document flow│ YES      │ Default (no offset)     ║
║  relative │ Its normal position │ YES      │ Offset + context        ║
║  absolute │ Nearest positioned  │ NO       │ Overlays, tooltips      ║
║           │ ancestor            │          │                         ║
║  fixed    │ Viewport            │ NO       │ Sticky nav, modals      ║
║  sticky   │ Scroll threshold    │ YES*     │ Sticky headers          ║
╚══════════════════════════════════════════════════════════════════════╝
```

```css
/* ABSOLUTE + RELATIVE pattern (most common): */
.parent {
  position: relative; /* Creates positioning context */
}
.badge {
  position: absolute;
  top: -8px; /* Offset from parent's top-left */
  right: -8px;
  /* Badge floats at parent's top-right corner */
}

/* CENTERING with absolute: */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Shift back by own size */
}

/* FIXED header: */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* Layer order: higher = on top */
}
body {
  padding-top: 64px; /* Offset for fixed navbar height */
}

/* STICKY: acts relative UNTIL scroll threshold, then fixed */
.table-header {
  position: sticky;
  top: 0; /* Becomes fixed when scrolled to top */
  background: white;
  z-index: 10;
}
```

### Z-Index — Layering

```
Z-INDEX GUIDE:

z-index only works on POSITIONED elements (not static).

LAYER SYSTEM (use consistent values):
┌────────────────────────────────────┐
│ z-index: 9999   MODAL OVERLAY     │ ← On top of everything
│ z-index: 1000   NAVIGATION        │
│ z-index: 100    DROPDOWN/POPUP    │
│ z-index: 50     STICKY ELEMENTS   │
│ z-index: 10     FLOATING UI       │
│ z-index: 1      JUST ABOVE NORMAL │
│ z-index: 0      NORMAL LAYER      │
│ z-index: -1     BEHIND CONTENT    │ ← Background decorations
└────────────────────────────────────┘

STACKING CONTEXT: z-index creates a new context.
Children of z-index:5 can NEVER be above a sibling with z:10.
This is why z-index "doesn't work" sometimes!
```

---

## 8. The CSS Reset & Base Styles

```css
/* MODERN CSS RESET (Use this in every project): */

/* 1. Box sizing for everything */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* 2. Remove default margin */
* {
  margin: 0;
}

/* 3. Improve text rendering */
body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* 4. Improve media defaults */
img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

/* 5. Input elements inherit font */
input,
button,
textarea,
select {
  font: inherit;
}

/* 6. Prevent text overflow */
p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

/* 7. Root stacking context */
#root,
#__next {
  isolation: isolate;
}

/* REASONING: Without these, every browser has different defaults.
   This reset gives you a CLEAN, CONSISTENT starting point.
   Based on Josh Comeau's custom CSS reset — widely adopted. */
```

---

## Interview Quick-Fire

```
Q: What is CSS specificity?
→ Specificity determines which CSS rule wins when multiple rules
  target the same element. Calculated as (Inline, IDs, Classes, Elements).
  Higher specificity wins. If equal, last rule in source wins.

Q: Explain the box model.
→ Every element is a box: Content → Padding → Border → Margin.
  With box-sizing: border-box, width includes padding and border.
  Without it (content-box), width is content only — padding adds to total.

Q: What is margin collapse?
→ When vertical margins of adjacent elements overlap, they collapse
  to the larger value instead of adding up. Only happens with block
  elements in normal flow — NOT in flex, grid, or positioned contexts.

Q: Difference between display: none and visibility: hidden?
→ display: none removes element from layout (takes no space).
  visibility: hidden hides element but it STILL takes space.

Q: When does z-index not work?
→ z-index only works on positioned elements (not static).
  Also, stacking contexts trap z-index — a child with z:9999
  inside a parent with z:1 won't beat a sibling with z:2.

Q: What's the difference between rem and em?
→ rem is relative to root (html) font-size (consistent).
  em is relative to parent's font-size (compounds).
  Use rem for predictable sizing, em for relative scaling.

Q: What is the cascade?
→ CSS applies rules in order: importance (!important) → specificity
  → source order. The "cascading" in CSS means styles cascade through
  these priority levels to determine final applied styles.
```

---

[Index](../00_MASTER_INDEX.md) | [Next → Layout Systems (Flex, Grid)](02_CSS_Layout_Systems.md)


---

## Reality Check

**"Specificity is why my style didn't apply"** ? Specificity is step THREE of the cascade; the earlier steps override it entirely: origin and importance first (user-agent, user, author, plus the !important INVERSION of that order), then cascade LAYERS (@layer � a later-declared layer beats higher specificity in an earlier one; the mechanism design systems now use to make utilities beat components without specificity wars), THEN specificity, then source order last. Half of "specificity debugging" is actually layer or importance debugging � DevTools' computed panel shows the real winner and why, and reading it beats counting selector weights every time.

**"The box model is width plus padding plus border"** ? The historical trap has a modern kill switch (box-sizing: border-box making width mean the visible box � the universal reset for a reason), and the REMAINING box-model surprises are the ones that still bite: margin COLLAPSE (adjacent vertical margins merge to the larger � parent-child collapse pulling a heading's margin outside its container until padding/border/overflow blocks it; and it stops entirely inside flex/grid, a difference people meet without naming), percentage padding resolving against WIDTH (both axes � the aspect-ratio hack of old), and min-content floors. Border-box fixed 2010's confusion; collapse still generates this year's.

**"display and position are independent knobs"** ? They REWRITE each other: position absolute/fixed forces display to block-ish (inline becomes block silently), float does the same, and display: flex/grid on a PARENT converts children into flex/grid ITEMS whose own float/vertical-align/inline-ness stop mattering (formatting-context membership beats the child's display wishes). The mental model that resolves it: an element's layout behavior is decided by its parent's formatting context FIRST, its own display second, its positioning scheme third � reading the three in that order explains the "why is my span behaving like a div" family in one pass.

**"Stacking follows z-index"** ? z-index works only on elements that create STACKING CONTEXTS, and contexts nest like scopes: a child's z-index 9999 cannot escape its parent's context if the parent sits below a sibling context (the modal-under-the-header classic) � and contexts are created by a long, surprising list beyond positioned-plus-z-index: opacity below 1, transform (ANY transform � including translateZ(0) added "for performance"), filter, will-change, isolation, contain. The debugging protocol: find which ancestor creates the containing context (DevTools layers panel or walking computed styles), because the fix is at the context boundary, not on the element whose z-index you keep raising.

**"Inheritance passes styles down"** ? Only SOME properties inherit (text-ish ones: color, font, line-height; box-ish ones deliberately do not: margin, padding, width), and the inheritance-adjacent machinery is where control lives: the explicit keywords (inherit, initial, unset � which means inherit-if-inheritable-else-initial, and revert � back to the browser default), the all shorthand for scoped resets, and CUSTOM PROPERTIES which inherit like text properties and are the modern theming channel precisely because of it (a --color set on a subtree cascades through everything below, component boundaries included). "It's inherited" without knowing which mechanism is a guess wearing certainty.
