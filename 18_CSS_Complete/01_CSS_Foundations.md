> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_CSS_Layout_Systems.md)

> **CSS Chapter 1/4** | [Index](../00_MASTER_INDEX.md) | [Next → Layout Systems](02_CSS_Layout_Systems.md)

# CSS Foundations — Selectors, Cascade, Box Model & Display

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: CSS (Cascading Style Sheets) controls HOW HTML looks.         ║
║        Layout, colors, typography, spacing, animations.              ║
║                                                                      ║
║  WHY:  HTML alone = newspaper from 1995. CSS = modern web.           ║
║        Without CSS skills, you CAN'T build professional UIs.         ║
║        React components need CSS. Debugging layout issues needs      ║
║        deep CSS understanding.                                       ║
║                                                                      ║
║  WHO:  Every frontend developer. Even "backend-focused" devs         ║
║        need CSS basics for full-stack work.                          ║
║                                                                      ║
║  WHEN: After HTML basics. Before learning any CSS framework.         ║
║        CSS fundamentals are FOREVER — Tailwind/Bootstrap change.     ║
║                                                                      ║
║  WHERE: Browsers render CSS. Every website, web app, email           ║
║         template, mobile webview uses CSS.                           ║
║                                                                      ║
║  HOW:  CSS rules = selector { property: value; }                     ║
║        Selector targets HTML. Properties change appearance.          ║
║        The CASCADE determines which rule wins when conflicts.        ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. CSS Selectors — Targeting HTML Elements

### Basic Selectors

```css
/* ELEMENT selector — targets ALL of that element */
p { color: blue; }          /* Every <p> */
h1 { font-size: 2rem; }    /* Every <h1> */

/* CLASS selector — targets elements with that class */
.card { border: 1px solid #ccc; }
.btn-primary { background: #3b82f6; }

/* ID selector — targets ONE specific element */
#header { position: fixed; }
#main-content { max-width: 1200px; }

/* UNIVERSAL selector — targets everything */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* ATTRIBUTE selector */
input[type="email"] { border-color: blue; }
a[href^="https"] { color: green; }    /* starts with */
a[href$=".pdf"] { color: red; }       /* ends with */
img[alt] { border: 2px solid green; } /* has attribute */
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
.sidebar a { color: white; }   /* Any <a> inside .sidebar */

/* CHILD (>) — direct children only */
.nav > li { display: inline-block; }  /* Only direct <li> in .nav */

/* ADJACENT SIBLING (+) — immediately next */
h2 + p { font-size: 1.1em; }  /* <p> right after <h2> */

/* GENERAL SIBLING (~) — all following siblings */
h2 ~ p { color: gray; }  /* All <p> after <h2>, same parent */
```

### Pseudo-Classes & Pseudo-Elements

```css
/* PSEUDO-CLASSES — state of elements */
a:hover { color: red; }          /* Mouse over link */
a:active { color: darkred; }     /* Being clicked */
a:visited { color: purple; }     /* Already visited */
input:focus { outline: 2px solid blue; }
input:disabled { opacity: 0.5; }
input:valid { border-color: green; }
input:invalid { border-color: red; }
input:placeholder-shown { font-style: italic; }

/* STRUCTURAL pseudo-classes */
li:first-child { font-weight: bold; }
li:last-child { border-bottom: none; }
li:nth-child(odd) { background: #f5f5f5; }   /* 1st, 3rd, 5th... */
li:nth-child(3n) { color: red; }              /* Every 3rd */
li:nth-child(n+4) { opacity: 0.8; }           /* 4th and beyond */
p:not(.special) { margin-bottom: 1em; }       /* All except .special */
div:empty { display: none; }                   /* No children */
section:has(> h2) { padding-top: 2em; }        /* Contains h2 (NEW!) */

/* PSEUDO-ELEMENTS — parts of elements */
p::first-line { font-variant: small-caps; }
p::first-letter { font-size: 3em; float: left; }
.quote::before { content: '"'; font-size: 2em; }
.quote::after { content: '"'; font-size: 2em; }
::selection { background: #3b82f6; color: white; }
input::placeholder { color: #999; }
li::marker { color: #3b82f6; }  /* Bullet/number color */
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
    color: inherit;  /* Use parent's value */
    margin: initial; /* Use browser default */
    padding: unset;  /* inherit if inheritable, else initial */
    border: revert;  /* Use user-agent stylesheet value */
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
*, *::before, *::after {
    box-sizing: border-box;
}
/* REASONING: Without border-box, adding padding makes elements BIGGER
   than their set width. border-box makes width = total width.
   Every CSS framework uses this. Every professional uses this. */

/* BOX MODEL PROPERTIES: */
.card {
    /* CONTENT */
    width: 300px;
    height: auto;          /* Height based on content */
    min-width: 200px;
    max-width: 500px;
    min-height: 100px;

    /* PADDING (inside border) */
    padding: 20px;                   /* All sides */
    padding: 10px 20px;              /* Vertical | Horizontal */
    padding: 10px 20px 15px;         /* Top | Horizontal | Bottom */
    padding: 10px 20px 15px 5px;     /* Top | Right | Bottom | Left (clockwise) */

    /* BORDER */
    border: 2px solid #e2e8f0;
    border-radius: 8px;             /* Rounded corners */
    border-radius: 50%;             /* Circle (if equal width/height) */

    /* MARGIN (outside border) */
    margin: 20px;
    margin: 0 auto;     /* Center horizontally (needs defined width) */
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
    color: red;                     /* Named (140+ names) */
    color: #ff0000;                 /* Hex (6 digits: RRGGBB) */
    color: #f00;                    /* Hex shorthand */
    color: #ff000080;               /* Hex with alpha (8 digits) */
    color: rgb(255, 0, 0);          /* RGB function */
    color: rgba(255, 0, 0, 0.5);    /* RGB with alpha */
    color: hsl(0, 100%, 50%);       /* HSL (Hue, Saturation, Lightness) */
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
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                 Roboto, 'Helvetica Neue', Arial, sans-serif;

    /* FONT SIZE (use rem!): */
    font-size: 1rem;      /* 16px */
    font-size: 1.125rem;  /* 18px */
    font-size: 1.5rem;    /* 24px */
    font-size: clamp(1rem, 2.5vw, 2rem); /* Fluid: min, preferred, max */

    /* FONT WEIGHT: */
    font-weight: 400;   /* Normal */
    font-weight: 500;   /* Medium */
    font-weight: 600;   /* Semi-bold */
    font-weight: 700;   /* Bold */

    /* LINE HEIGHT (unitless is best!): */
    line-height: 1.5;   /* 1.5× font size — good for body */
    line-height: 1.2;   /* Tighter for headings */

    /* LETTER & WORD SPACING: */
    letter-spacing: -0.02em;  /* Tighter (headings) */
    letter-spacing: 0.05em;   /* Wider (uppercase labels) */

    /* TEXT PROPERTIES: */
    text-align: center;
    text-transform: uppercase;
    text-decoration: none;
    text-overflow: ellipsis;   /* ... for overflow */
    white-space: nowrap;       /* Prevent wrapping */
    overflow: hidden;          /* Required for ellipsis */
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

## 6. Backgrounds, Shadows & Borders

```css
.card {
    /* BACKGROUND: */
    background-color: #ffffff;
    background-image: url('/hero.jpg');
    background-size: cover;          /* Fill container */
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;    /* Parallax effect */

    /* GRADIENT: */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background: radial-gradient(circle, #fff 0%, #ddd 100%);

    /* MULTIPLE BACKGROUNDS: */
    background:
        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
        url('/hero.jpg') center/cover;

    /* BORDER: */
    border: 1px solid #e2e8f0;
    border-radius: 12px;                  /* Rounded */
    border-radius: 12px 12px 0 0;         /* Top only */

    /* BOX SHADOW: */
    /* offset-x | offset-y | blur | spread | color */
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);          /* Subtle */
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);     /* Medium */
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);   /* Large (floating) */

    /* MULTIPLE SHADOWS (layered = realistic): */
    box-shadow:
        0 1px 2px rgba(0,0,0,0.06),
        0 4px 8px rgba(0,0,0,0.08),
        0 12px 24px rgba(0,0,0,0.06);

    /* TEXT SHADOW: */
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);

    /* OUTLINE (doesn't affect layout): */
    outline: 2px solid #3b82f6;
    outline-offset: 2px;   /* Space between element and outline */
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
    position: relative;  /* Creates positioning context */
}
.badge {
    position: absolute;
    top: -8px;          /* Offset from parent's top-left */
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
    z-index: 1000;   /* Layer order: higher = on top */
}
body {
    padding-top: 64px; /* Offset for fixed navbar height */
}

/* STICKY: acts relative UNTIL scroll threshold, then fixed */
.table-header {
    position: sticky;
    top: 0;            /* Becomes fixed when scrolled to top */
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
*, *::before, *::after {
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
img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
}

/* 5. Input elements inherit font */
input, button, textarea, select {
    font: inherit;
}

/* 6. Prevent text overflow */
p, h1, h2, h3, h4, h5, h6 {
    overflow-wrap: break-word;
}

/* 7. Root stacking context */
#root, #__next {
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

> [Index](../00_MASTER_INDEX.md) | [Next → Layout Systems (Flex, Grid)](02_CSS_Layout_Systems.md)


---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_CSS_Layout_Systems.md)