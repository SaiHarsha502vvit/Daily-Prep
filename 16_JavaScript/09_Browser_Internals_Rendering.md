> **Navigation**: [< Previous](08_JS_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_Web_Workers_ServiceWorkers.md)

# 🌐 Chapter 9 — Browser Internals: How the Web Actually Renders

> **"When you type a URL and press Enter, a cascade of 15+ steps happens before pixels appear on screen. Understanding this pipeline is the difference between 'it works' and 'it works FAST.' Every performance optimization maps to a specific stage in this pipeline."**

---

## Table of Contents

1. [Navigation — From URL to First Byte](#1-navigation--from-url-to-first-byte)
2. [HTML Parsing — Building the DOM Tree](#2-html-parsing--building-the-dom-tree)
3. [CSS Parsing — Building the CSSOM](#3-css-parsing--building-the-cssom)
4. [The Render Tree — Combining DOM + CSSOM](#4-the-render-tree--combining-dom--cssom)
5. [Layout (Reflow) — Calculating Geometry](#5-layout-reflow--calculating-geometry)
6. [Paint — Drawing Pixels](#6-paint--drawing-pixels)
7. [Compositing — GPU Layers](#7-compositing--gpu-layers)
8. [The Critical Rendering Path](#8-the-critical-rendering-path)
9. [JavaScript Execution & the Event Loop in the Browser](#9-javascript-execution--the-event-loop-in-the-browser)
10. [Reflow vs Repaint — What Triggers What](#10-reflow-vs-repaint--what-triggers-what)
11. [requestAnimationFrame & Rendering Pipeline Timing](#11-requestanimationframe--rendering-pipeline-timing)
12. [How Browsers Optimize — Batching, Layers, and Compositing](#12-how-browsers-optimize--batching-layers-and-compositing)

---

## 1. Navigation — From URL to First Byte

```
  User types: https://example.com/products
  
  ┌── STEP 1: DNS RESOLUTION ─────────────────────────────────────────┐
  │                                                                    │
  │  Browser Cache → OS Cache → Router → ISP DNS → Root DNS           │
  │  "example.com" → 93.184.216.34                                    │
  │  Time: 0-100ms (cached: 0ms, uncached: 20-100ms)                 │
  │                                                                    │
  └──────────────────────────┬─────────────────────────────────────────┘
                             ▼
  ┌── STEP 2: TCP HANDSHAKE ──────────────────────────────────────────┐
  │                                                                    │
  │  Client → SYN → Server                                            │
  │  Client ← SYN-ACK ← Server                                       │
  │  Client → ACK → Server                                            │
  │  Time: 1 round trip (~30-100ms depending on distance)             │
  │                                                                    │
  └──────────────────────────┬─────────────────────────────────────────┘
                             ▼
  ┌── STEP 3: TLS HANDSHAKE (HTTPS) ──────────────────────────────────┐
  │                                                                    │
  │  Client → ClientHello (supported ciphers) → Server                │
  │  Client ← ServerHello + Certificate ← Server                     │
  │  Client verifies certificate, generates session key               │
  │  Client → Encrypted "Finished" → Server                           │
  │  Time: 1-2 more round trips (~50-200ms)                           │
  │                                                                    │
  └──────────────────────────┬─────────────────────────────────────────┘
                             ▼
  ┌── STEP 4: HTTP REQUEST ───────────────────────────────────────────┐
  │                                                                    │
  │  GET /products HTTP/2                                              │
  │  Host: example.com                                                 │
  │  Accept: text/html                                                 │
  │                                                                    │
  │  Server processes → returns HTML                                   │
  │  Time to First Byte (TTFB): 100-500ms typically                   │
  │                                                                    │
  └────────────────────────────────────────────────────────────────────┘
  
  TOTAL before browser sees first byte: 200-800ms!
  
  OPTIMIZATION: Preconnect to known domains:
  <link rel="preconnect" href="https://api.example.com">
  (starts DNS + TCP + TLS early while HTML is still loading)
```

---

## 2. HTML Parsing — Building the DOM Tree

```
  Browser receives HTML bytes → Characters → Tokens → Nodes → DOM Tree
  
  
  TOKENIZATION (byte by byte):
  ════════════════════════════
  
  HTML bytes: <div class="card"><h2>Title</h2><p>Text</p></div>
  
  Tokens:
  ┌─────────────────────┐
  │ StartTag: div        │  (with attribute class="card")
  │ StartTag: h2         │
  │ Character: "Title"   │
  │ EndTag: h2           │
  │ StartTag: p          │
  │ Character: "Text"    │
  │ EndTag: p            │
  │ EndTag: div          │
  └─────────────────────┘
  
  
  DOM TREE CONSTRUCTION:
  ══════════════════════
  
  document
    └── html
        ├── head
        │   └── ...
        └── body
            └── div.card          ← Element node
                ├── h2            ← Element node
                │   └── "Title"   ← Text node
                └── p
                    └── "Text"
  
  
  ⚠️ PARSER-BLOCKING BEHAVIOR:
  ════════════════════════════
  
  When the parser encounters <script src="app.js">:
  
  1. HTML parsing STOPS
  2. Browser fetches app.js (network request!)
  3. Browser executes app.js (may modify DOM)
  4. HTML parsing RESUMES
  
  This is WHY scripts block rendering!
  
  SOLUTIONS:
  <script src="app.js" defer>   → Download in parallel, execute AFTER HTML parsed
  <script src="app.js" async>   → Download in parallel, execute ASAP (order not guaranteed)
  
  ┌─────────────────────────────────────────────────────────────┐
  │  normal:   HTML ████░░░░░░████████████                      │
  │                      ↑ blocked       ↑ resume               │
  │            JS        ░░░░░████                              │
  │                      fetch  exec                            │
  │                                                             │
  │  defer:    HTML ████████████████████ → JS exec             │
  │            JS   ░░░░░░░░░░░░░       (parallel download)    │
  │                                                             │
  │  async:    HTML ████████░░░░████████                        │
  │            JS   ░░░░░░░████         (exec when ready)      │
  └─────────────────────────────────────────────────────────────┘
```

---






> 🔬 **Section Challenge — 2. HTML Parsing — Building the DOM Tree**

## 3. CSS Parsing — Building the CSSOM

```
  CSS bytes → Characters → Tokens → Nodes → CSSOM Tree
  
  CSS:
  body { font-size: 16px; }
  .card { display: flex; padding: 1rem; }
  .card h2 { color: #333; font-weight: bold; }
  
  CSSOM TREE:
  ═══════════
  
  (root)
    └── body
        │ font-size: 16px
        │
        └── .card
            │ display: flex
            │ padding: 1rem
            │ font-size: 16px  ← INHERITED from body!
            │
            └── h2
                │ color: #333
                │ font-weight: bold
                │ font-size: 16px  ← inherited
                │ display: flex... NO! h2 doesn't inherit display
  
  
  ⚠️ CSS IS RENDER-BLOCKING:
  ══════════════════════════
  
  The browser WILL NOT render ANYTHING until ALL CSS is parsed.
  
  Why? Without CSS, the browser doesn't know:
  - Is this element display: none? (don't render at all)
  - What size is it? (can't layout)
  - What color is the text? (can't paint)
  
  So if your CSS file is huge or slow to load → BLANK SCREEN.
  
  OPTIMIZATION:
  1. Inline critical CSS in <head> (above-the-fold styles)
  2. Load non-critical CSS with media queries:
     <link rel="stylesheet" href="print.css" media="print">
     (browser still downloads it, but doesn't block rendering)
  3. Minimize CSS file size (remove unused styles)
```

---






> 🔬 **Section Challenge — 3. CSS Parsing — Building the CSSOM**

## 4. The Render Tree — Combining DOM + CSSOM

```
  DOM Tree + CSSOM = Render Tree
  
  The Render Tree contains ONLY visible elements.
  
  DOM Tree:                     CSSOM says:
  ─────────                     ───────────
  html                          html { }
    head                        head → display: none (by default)
      title                     .hidden → display: none
    body                        span → display: inline
      div.card                  div → display: block
        h2                      
        p                       
      span.hidden               
  
  
  Render Tree (visible only):
  ═══════════════════════════
  
  body                          ← head is EXCLUDED (display:none by default)
    div.card (display: block)
      h2 (display: block)
        "Title"
      p (display: block)
        "Text"
                                ← span.hidden is EXCLUDED (display:none)
  
  
  WHAT'S EXCLUDED:
  ═════════════════
  • <head>, <meta>, <script>, <link> → not visual
  • Any element with display: none → not in render tree at all
  • visibility: hidden → IN render tree (takes up space, just invisible!)
  • opacity: 0 → IN render tree (takes up space, just transparent!)
```

---






> 🔬 **Section Challenge — 4. The Render Tree — Combining DOM + CSSOM**

## 5. Layout (Reflow) — Calculating Geometry

```
  The Render Tree knows WHAT to show, but not WHERE or HOW BIG.
  Layout calculates every element's exact position and size.
  
  
  THE LAYOUT PROCESS:
  ═══════════════════
  
  1. Start at root (<html>)
     → viewport width = device width (e.g., 1920px)
  
  2. For each element, calculate:
     → width (based on parent, content, CSS)
     → height (based on content, CSS) 
     → position (x, y coordinates)
  
  3. Percentages resolved against parent:
     body { width: 100% }    → 1920px
     .card { width: 50% }    → 960px
     .card p { width: 80% }  → 768px
  
  
  LAYOUT IS EXPENSIVE:
  ════════════════════
  
  One element changes size → ALL descendants may need recalculation.
  
  Example: Expanding an accordion
  ┌────────────────────────────┐
  │ Accordion Item 1 (closed)  │
  ├────────────────────────────┤
  │ Accordion Item 2 (OPEN!)   │ ← Height changes!
  │ Content content content    │
  │ More content here          │
  ├────────────────────────────┤ ← Item 3 shifts DOWN
  │ Accordion Item 3           │
  ├────────────────────────────┤ ← Item 4 shifts DOWN
  │ Accordion Item 4           │
  └────────────────────────────┘ ← Footer shifts DOWN
  
  ONE height change → entire page below reflows!
```

---






> 🔬 **Section Challenge — 5. Layout (Reflow) — Calculating Geometry**

## 6. Paint — Drawing Pixels

```
  After layout, the browser knows WHERE everything goes.
  Now it needs to fill in the PIXELS.
  
  PAINT RECORDS (drawing instructions):
  ═════════════════════════════════════
  
  For a blue button with white text:
  1. Draw rounded rectangle (x:100, y:200, w:120, h:40, borderRadius:8)
  2. Fill with #3b82f6
  3. Draw border (1px solid #2563eb)
  4. Position text "Submit" at (x:130, y:215)
  5. Fill text with #ffffff
  6. Apply font: 16px Inter, weight 600
  
  The browser creates these instructions for EVERY visible element.
  
  
  PAINT ORDER (z-order):
  ══════════════════════
  
  Elements paint in this order:
  1. Background color
  2. Background image
  3. Border
  4. Children (in DOM order, modified by z-index)
  5. Outline
  
  This is why z-index matters — it changes the paint order.
```

---






> 🔬 **Section Challenge — 6. Paint — Drawing Pixels**

## 7. Compositing — GPU Layers

```
  Modern browsers don't paint everything onto ONE surface.
  They split the page into LAYERS and composite them on the GPU.
  
  
  WHY LAYERS?
  ═══════════
  
  If an animation only needs to repaint ONE layer,
  the rest of the page stays cached — much faster!
  
  
  WHAT CREATES A NEW LAYER:
  ═════════════════════════
  
  • transform: translateZ(0) or translate3d(0,0,0) → forces GPU layer
  • will-change: transform (tells browser to prepare a layer)
  • position: fixed or sticky
  • opacity animation
  • <video>, <canvas>, WebGL
  • CSS filters (blur, etc.)
  
  
  THE COMPOSITING PROCESS:
  ════════════════════════
  
  ┌── Layer 1 (background) ──────────────────────────┐
  │  Static page content                              │
  │  ┌── Layer 2 (fixed header) ─────────────────┐   │
  │  │  Sticky nav with logo                      │   │
  │  └────────────────────────────────────────────┘   │
  │  ┌── Layer 3 (animated card) ─────────────────┐   │
  │  │  Card being dragged (transform)            │   │
  │  └────────────────────────────────────────────┘   │
  │  ┌── Layer 4 (modal overlay) ─────────────────┐   │
  │  │  opacity: 0.5 background + modal content   │   │
  │  └────────────────────────────────────────────┘   │
  └───────────────────────────────────────────────────┘
  
  GPU composites layers together → final pixels on screen.
  
  
  ╔═══════════════════════════════════════════════════════════════╗
  ║  THE PERFORMANCE TIERS:                                       ║
  ║                                                               ║
  ║  BEST:  Composite-only (transform, opacity)                  ║
  ║         → GPU handles it, no CPU layout/paint needed         ║
  ║                                                               ║
  ║  OK:    Paint-only (color, background, shadow)                ║
  ║         → CPU repaints, but no layout recalculation          ║
  ║                                                               ║
  ║  WORST: Layout (width, height, margin, top, left, font-size) ║
  ║         → CPU recalculates layout + repaint + composite      ║
  ╚═══════════════════════════════════════════════════════════════╝
```

---






> 🔬 **Section Challenge — 7. Compositing — GPU Layers**

## 8. The Critical Rendering Path

```
  THE FULL PIPELINE:
  ══════════════════
  
  HTML bytes → DOM Tree ──────────┐
                                   ├──→ Render Tree → Layout → Paint → Composite → PIXELS!
  CSS bytes → CSSOM Tree ─────────┘         ▲
                                            │
  JS execution ─────────────────── can modify DOM/CSSOM
  
  
  CRITICAL RENDERING PATH = minimum work to show FIRST pixels.
  
  
  TO OPTIMIZE:
  ════════════
  
  1. MINIMIZE critical resources:
     Only load what's needed for above-the-fold content.
     
  2. MINIMIZE critical path length:
     Reduce number of round trips (DNS, TCP, TLS, requests).
     
  3. MINIMIZE critical bytes:
     Compress CSS/JS, remove unused code.
  
  
  IDEAL LOADING SEQUENCE:
  ═══════════════════════
  
  <head>
    <!-- 1. Critical CSS inline (no extra request!) -->
    <style>
      /* Only styles for above-the-fold content */
      body { margin: 0; font-family: system-ui; }
      .header { height: 60px; background: #fff; }
      .hero { padding: 4rem 2rem; }
    </style>
    
    <!-- 2. Preconnect to required origins -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    
    <!-- 3. Preload critical resources -->
    <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
    
    <!-- 4. Non-critical CSS loaded asynchronously -->
    <link rel="stylesheet" href="/styles/main.css" media="print" onload="this.media='all'">
  </head>
  <body>
    <!-- 5. Content first, scripts last -->
    <div id="app">...</div>
    
    <!-- 6. JS deferred (doesn't block parsing) -->
    <script src="/js/app.js" defer></script>
  </body>
```

---






> 🔬 **Section Challenge — 8. The Critical Rendering Path**

## 9. JavaScript Execution & the Event Loop in the Browser

```
  THE BROWSER'S MAIN THREAD:
  ══════════════════════════
  
  The SAME thread handles:
  • JavaScript execution
  • DOM updates
  • Style calculations
  • Layout
  • Paint
  
  This is why long JavaScript tasks = FROZEN UI!
  
  
  ONE FRAME AT 60fps = 16.67ms BUDGET:
  ════════════════════════════════════
  
  ┌─ 16.67ms frame ──────────────────────────────────────┐
  │                                                       │
  │  Input events (click, scroll)   │  ~2ms              │
  │  JavaScript execution           │  ~6ms              │
  │  requestAnimationFrame          │  ~1ms              │
  │  Style calculation              │  ~2ms              │
  │  Layout                         │  ~2ms              │
  │  Paint                          │  ~2ms              │
  │  Composite                      │  ~1ms              │
  │  ─────────────────────────────────────                │
  │  Total: ~16ms  ← fits in budget!                     │
  │                                                       │
  └───────────────────────────────────────────────────────┘
  
  If your JS takes 50ms → you MISS 3 frames → visible jank!
  
  
  BROWSER EVENT LOOP ORDER:
  ═════════════════════════
  
  1. Run ONE macrotask (setTimeout, setInterval, I/O, events)
  2. Run ALL microtasks (Promise.then, queueMicrotask, MutationObserver)
  3. If it's time to render (usually 60 times/second):
     a. Run requestAnimationFrame callbacks
     b. Style calculation
     c. Layout
     d. Paint
     e. Composite
  4. If idle → run requestIdleCallback
  5. Go to step 1
```

---






> 🔬 **Section Challenge — 9. JavaScript Execution & the Event Loop in the Browser**

## 10. Reflow vs Repaint — What Triggers What

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  REFLOW (Layout change):                                        │
  │  Triggers: Layout → Paint → Composite (EXPENSIVE)              │
  │                                                                  │
  │  These CSS properties cause reflow:                              │
  │  width, height, padding, margin, border-width,                  │
  │  top, left, right, bottom, font-size, font-family,             │
  │  display, position, float, overflow, text-align                 │
  │                                                                  │
  │  These JS operations cause reflow (FORCED SYNCHRONOUS LAYOUT): │
  │  element.offsetHeight, element.offsetWidth,                     │
  │  element.getBoundingClientRect(),                               │
  │  element.scrollTop, element.clientHeight,                       │
  │  getComputedStyle(element)                                      │
  │                                                                  │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  REPAINT (Visual change only):                                   │
  │  Triggers: Paint → Composite (MODERATE)                         │
  │                                                                  │
  │  These CSS properties cause repaint (NOT reflow):               │
  │  color, background-color, background-image,                     │
  │  border-color, outline, visibility, box-shadow                  │
  │                                                                  │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  COMPOSITE ONLY (GPU):                                           │
  │  Triggers: Composite only (CHEAPEST)                            │
  │                                                                  │
  │  These CSS properties skip layout AND paint:                    │
  │  transform, opacity                                              │
  │                                                                  │
  │  → This is why you animate with transform, not left/top!       │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

### Layout Thrashing — The #1 Performance Killer

```javascript
// BAD — Layout Thrashing (read-write-read-write):
for (let i = 0; i < items.length; i++) {
  const height = items[i].offsetHeight;   // READ → forces layout
  items[i].style.height = height + 10 + 'px'; // WRITE → invalidates layout
  // Next iteration: READ again → forces ANOTHER layout!
}
// N elements = N forced layouts!

// GOOD — Batch reads, then batch writes:
const heights = items.map(item => item.offsetHeight); // ALL reads first
items.forEach((item, i) => {
  item.style.height = heights[i] + 10 + 'px'; // ALL writes after
});
// 1 forced layout total!
```

---






> 🔬 **Section Challenge — 10. Reflow vs Repaint — What Triggers What**

## 11. requestAnimationFrame & Rendering Pipeline Timing

```
  requestAnimationFrame runs BEFORE the browser paints.
  It's synchronized with the display refresh rate (usually 60Hz).
  
  
  WHY rAF INSTEAD OF setTimeout:
  ═══════════════════════════════
  
  setTimeout(fn, 16) → "run after 16ms" (approximately)
  • Not synced to screen refresh
  • May fire in the middle of a frame
  • May fire multiple times before browser paints
  • May be throttled in background tabs
  
  requestAnimationFrame(fn) → "run before next paint"
  • Synced to screen refresh rate
  • Exactly one call per frame
  • Automatically paused when tab is hidden
  • Receives timestamp for precise animation
```

```javascript
// Smooth animation with rAF:
function animate(timestamp) {
  // Calculate progress
  const elapsed = timestamp - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  // Use transform (composite-only, no reflow!):
  element.style.transform = `translateX(${progress * 300}px)`;
  
  if (progress < 1) {
    requestAnimationFrame(animate);
  }
}

const startTime = performance.now();
const duration = 500; // ms
requestAnimationFrame(animate);
```

---






> 🔬 **Section Challenge — 11. requestAnimationFrame & Rendering Pipeline Timing**

## 12. How Browsers Optimize — Batching, Layers, and Compositing

```
  BROWSERS ARE SMART — they batch DOM changes:
  ═════════════════════════════════════════════
  
  // These 3 writes DON'T cause 3 separate reflows:
  element.style.width = '200px';
  element.style.height = '100px';
  element.style.margin = '10px';
  // Browser batches these → ONE reflow at next paint
  
  // BUT reading layout properties FORCES immediate reflow:
  element.style.width = '200px';
  const w = element.offsetWidth; // FORCES reflow NOW!
  element.style.height = '100px'; // invalidates again
  const h = element.offsetHeight; // FORCES ANOTHER reflow!
  
  
  VIRTUAL SCROLLING — How browsers handle 10,000 items:
  ═════════════════════════════════════════════════════
  
  DON'T: Render 10,000 DOM elements
  → 10,000 nodes in render tree → massive layout/paint
  
  DO: Render only ~20 visible items
  → As user scrolls, swap items in/out
  → Total DOM nodes: always ~20 regardless of list size
  → Libraries: react-window, react-virtuoso, tanstack-virtual
  
  
  CONTAIN PROPERTY — Tell browser to limit recalculations:
  ═══════════════════════════════════════════════════════
  
  .card {
    contain: layout;   /* layout changes inside don't affect outside */
    contain: paint;    /* painting inside doesn't bleed outside */
    contain: content;  /* shorthand for layout + paint + style */
  }
  
  This tells the browser: "Changes inside this element WON'T affect
  anything outside it" → browser can skip recalculating the rest of the page.
```

---

> **Next Chapter**: [Web Workers & Service Workers →](10_Web_Workers_ServiceWorkers.md)

---






> 🔬 **Section Challenge — 12. How Browsers Optimize — Batching, Layers, and Compositing**

## 🏋️ Practice & Interview Questions — JavaScript

### Predict / Trace
**Q1.** What prints?
```js
console.log(typeof null);
console.log(null instanceof Object);
```
<details><summary>Answer</summary>

`"object"` (historical JS bug), `false` (null is not an Object instance). This is a well-known JS quirk.
</details>

**Q2.** What is the output?
```js
console.log(1 + "2");
console.log("3" - 1);
console.log(true + false);
```
<details><summary>Answer</summary>

`"12"` (string concat), `2` (- coerces to number), `1` (true=1, false=0)
</details>

**Q3.** What prints and why?
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
<details><summary>Answer</summary>

`3 3 3` — `var` is function-scoped, all closures share same `i`. By the time timeouts run, loop is done, i=3. **Fix**: use `let` (block-scoped) or `setTimeout(() => console.log(i), 0, i)`.
</details>

### Coding Problems
**Q4.** ⭐ Implement `debounce(fn, delay)`.
<details><summary>Solution</summary>

```js
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```
</details>

**Q5.** ⭐ Implement `Promise.all` from scratch.
<details><summary>Solution</summary>

```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then(val => { results[i] = val; if(++count === promises.length) resolve(results); })
        .catch(reject);
    });
    if(promises.length === 0) resolve([]);
  });
}
```
</details>

**Q6.** ⭐ Deep clone an object without `JSON.parse(JSON.stringify(...))`.
<details><summary>Solution</summary>

```js
function deepClone(obj) {
  if(obj === null || typeof obj !== 'object') return obj;
  if(obj instanceof Date) return new Date(obj);
  if(obj instanceof Array) return obj.map(deepClone);
  const clone = {};
  for(const key in obj) if(obj.hasOwnProperty(key)) clone[key] = deepClone(obj[key]);
  return clone;
}
// Modern: structuredClone(obj) — built-in, handles more types
```
</details>

**Q7.** ⭐⭐ Implement `curry` function.
<details><summary>Solution</summary>

```js
function curry(fn) {
  return function curried(...args) {
    if(args.length >= fn.length) return fn(...args);
    return function(...more) { return curried(...args, ...more); };
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
```
</details>

**Q8.** ⭐⭐ Implement `memoize(fn)`.
<details><summary>Solution</summary>

```js
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if(cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | == vs === | == coerces types; === strict (no coercion) |
| 2 | `typeof undefined` | "undefined" |
| 3 | `typeof function(){}` | "function" |
| 4 | Prototype chain end | null |
| 5 | Event loop: microtasks vs macrotasks | Microtasks (Promises) run before macrotasks (setTimeout) |
| 6 | `const` prevents | Reassignment, not mutation |
| 7 | `var` vs `let` hoisting | var: hoisted+initialized to undefined; let: hoisted but in TDZ |
| 8 | `this` in arrow function | Lexical (inherited from enclosing scope) |
| 9 | Optional chaining `?.` | Returns undefined instead of throwing on null/undefined |
| 10 | Nullish coalescing `??` | Returns right side only if left is null/undefined (not 0 or '') |

---

## 🧠 Deep Conceptual Questions — JavaScript Engine & Language

**C1. How does the JavaScript event loop actually work?**
<details><summary>Deep Answer</summary>

```
Call Stack → runs synchronous code
     ↓ (when empty)
Microtask Queue → Promise callbacks, queueMicrotask, MutationObserver
     ↓ (when empty)
Macrotask Queue → setTimeout, setInterval, I/O, requestAnimationFrame
```

One "tick": (1) Run all synchronous code in call stack until empty, (2) Run ALL microtasks until queue empty (even if new microtasks added!), (3) Run ONE macrotask from the macrotask queue, (4) Repeat.

Critical: microtasks drain COMPLETELY before any macrotask. A microtask that continually enqueues microtasks → infinite loop, browser freezes (no macrotasks can run). `Promise.resolve().then(...)` vs `setTimeout(fn, 0)`: Promise runs BEFORE the timeout even with a 0ms delay.
</details>

**C2. What is the prototype chain and how does `class` syntax relate to it?**
<details><summary>Deep Answer</summary>

Every JS object has an internal `[[Prototype]]` link. Property lookup: check own properties → check `[[Prototype]]` → check `[[Prototype]][[Prototype]]` → ... until null. `class` is syntactic sugar over prototype-based inheritance:
```js
class Animal { speak() {} }  // same as:
function Animal() {}
Animal.prototype.speak = function() {};
```
`class extends` sets up the prototype chain: `Dog.prototype.__proto__ = Animal.prototype`. `super` works via `[[HomeObject]]` — a hidden reference to the class where the method was defined. Key: `typeof Dog === 'function'` — classes ARE functions. `instanceof` checks the prototype chain, not the class definition.
</details>

**C3. Explain closures: why do they exist and what problems do they solve?**
<details><summary>Deep Answer</summary>

A closure = a function + references to its lexical environment (the variables in scope when the function was created). It solves: **data encapsulation without classes**. Private state in JS (pre-class): use closure.
```js
function makeCounter() {
  let count = 0; // private — inaccessible outside
  return { increment: () => ++count, get: () => count };
}
```
`count` lives on even after `makeCounter` returns because the returned object's methods close over it. Closures keep the enclosing scope alive in memory as long as any reference to them exists — the classic memory leak: `button.addEventListener('click', heavyFunction)` — even after button is removed from DOM, heavyFunction and all its closed-over variables stay in memory.
</details>

**C4. What is the difference between `==` and `===` at the engine level?**
<details><summary>Deep Answer</summary>

`===` (strict equality): checks type first — if types differ, returns false immediately. No coercion. Two objects: only true if same reference. `==` (abstract equality): if types differ, coerces using the "Abstract Equality Comparison Algorithm" (ECMAScript spec §7.2.13). Examples: `null == undefined` → true (special case). `0 == ''` → true ('' → 0). `1 == true` → true (true → 1). `[] == false` → true ([] → '' → 0, false → 0). `[] == ![]` → true (both 0). These coercions are unintuitive and context-dependent. Always use `===` unless specifically relying on null/undefined equivalence.
</details>

**C5. `this` binding: what determines `this` in JavaScript?**
<details><summary>Deep Answer</summary>

`this` is determined at CALL TIME, not at definition time (except arrow functions):
1. **new binding**: `new Foo()` — `this` = new object
2. **Explicit binding**: `foo.call(obj)` / `foo.apply(obj)` / `foo.bind(obj)` — `this` = obj
3. **Implicit binding**: `obj.foo()` — `this` = obj (the object before the dot)
4. **Default binding**: `foo()` — `this` = global (window/global) or `undefined` (strict mode)
5. **Arrow function**: no own `this` — lexically inherits from enclosing context at DEFINITION time

Priority: new > explicit > implicit > default. Arrow functions use none of these rules — they close over `this` from their lexical scope. Common trap: `obj.method` passed as callback loses its `this` binding (becomes default/undefined-in-strict-mode). Fix: `obj.method.bind(obj)` or arrow function.
</details>

**C6. What is the Temporal Dead Zone (TDZ) and why does `let` have it?**
<details><summary>Deep Answer</summary>

All declarations (`var`, `let`, `const`) are hoisted. BUT: `var` is initialized to `undefined` at hoist time. `let`/`const` are hoisted but NOT initialized — they're in the TDZ (temporal dead zone) from block start until the declaration line is reached. Accessing a `let`/`const` variable in its TDZ → `ReferenceError`. WHY it exists: `var`'s behavior (usable before declaration returns undefined) was a source of confusing bugs. TDZ makes it impossible to use a variable before you declared it — forces cleaner code. The declaration IS "seen" by the engine (hence "temporal" — it's available AFTER the declaration, just not before).
</details>

**C7. What are WeakMap and WeakSet used for, and what makes them "weak"?**
<details><summary>Deep Answer</summary>

"Weak" = the keys are weakly referenced — they don't prevent garbage collection. If the only reference to an object is a WeakMap key, the GC can collect it, and the WeakMap entry disappears automatically. Normal Map holds strong references: `map.set(node, data)` — `node` can't be GC'd as long as the map exists (memory leak if node removed from DOM). WeakMap: GC can collect `node` when it's no longer referenced elsewhere. Entry disappears. Use cases: (1) private data per instance (WeakMap as private field store), (2) caching computed data per DOM node without memory leaks, (3) tracking active objects without preventing their collection. Cannot iterate WeakMap/WeakSet (indeterminate state due to GC).
</details>

