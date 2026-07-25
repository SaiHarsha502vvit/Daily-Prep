**Navigation**: [< Previous](05_DevTools_Debugging_Mastery.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_Web_Accessibility_A11y.md)

# ⚡ Chapter 6 — Web Performance & Core Web Vitals: Making the Web Fast

**"Google ranks faster sites higher. Users abandon sites that take more than 3 seconds to load. Performance isn't optional — it's the first feature your users experience."**

---

## Table of Contents

1. [Core Web Vitals — The Metrics That Matter](#1-core-web-vitals--the-metrics-that-matter)
2. [LCP — Largest Contentful Paint](#2-lcp--largest-contentful-paint)
3. [INP — Interaction to Next Paint](#3-inp--interaction-to-next-paint)
4. [CLS — Cumulative Layout Shift](#4-cls--cumulative-layout-shift)
5. [Resource Loading Optimization](#5-resource-loading-optimization)
6. [Image Optimization — The Biggest Win](#6-image-optimization--the-biggest-win)
7. [Font Loading Strategies](#7-font-loading-strategies)
8. [JavaScript Bundle Optimization](#8-javascript-bundle-optimization)
9. [Caching Strategies — HTTP Cache Headers](#9-caching-strategies--http-cache-headers)
10. [Measuring Performance in Code](#10-measuring-performance-in-code)

---

## 1. Core Web Vitals — The Metrics That Matter

```
  Google's 3 Core Web Vitals (2024):

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  LCP (Largest Contentful Paint):        LOADING SPEED            │
  │  ───────────────────────────────         ─────────────           │
  │  When does the biggest content appear?                           │
  │  GOOD: < 2.5s  │  NEEDS WORK: 2.5-4s  │  POOR: > 4s              │
  │                                                                  │
  │  ████████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░                  │
  │  0s              2.5s              4s                            │
  │                                                                  │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  INP (Interaction to Next Paint):       RESPONSIVENESS           │
  │  ───────────────────────────────         ──────────────          │
  │  How fast does UI respond to clicks/taps?                        │
  │  GOOD: < 200ms  │  NEEDS WORK: 200-500ms  │  POOR: > 500ms       │
  │                                                                  │
  │  ████████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░                  │
  │  0ms            200ms            500ms                           │
  │                                                                  │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  CLS (Cumulative Layout Shift):         VISUAL STABILITY         │
  │  ─────────────────────────────          ────────────────         │
  │  How much does content shift around?                             │
  │  GOOD: < 0.1  │  NEEDS WORK: 0.1-0.25  │  POOR: > 0.25           │
  │                                                                  │
  │  ████████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░                  │
  │  0              0.1             0.25                             │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 2. LCP — Largest Contentful Paint

```
  WHAT COUNTS AS LCP ELEMENT:
  ───────────────────────────

  • <img> elements
  • <video> poster images
  • Background images via url()
  • Block-level text elements (<h1>, <p>, etc.)

  The browser picks the LARGEST visible element within the viewport.


  LCP OPTIMIZATION CHECKLIST:
  ───────────────────────────

  1. Preload the LCP image:
     <link rel="preload" as="image" href="/hero-image.webp"
           fetchpriority="high">

  2. Don't lazy-load the LCP image!
     Above-the-fold images should load IMMEDIATELY.
     <img src="hero.webp" loading="eager" fetchpriority="high">

  3. Use correct image format and size:
     WebP is 25-35% smaller than JPEG.
     AVIF is 50% smaller than JPEG.
     Serve different sizes per viewport:
     <img srcset="hero-400.webp 400w,
                  hero-800.webp 800w,
                  hero-1200.webp 1200w"
          sizes="100vw" src="hero-800.webp" alt="Hero">

  4. Inline critical CSS (don't block rendering with stylesheets)

  5. Use CDN for static assets (closer to user = faster TTFB)

  6. Server-side render (SSR) or static generate (SSG) for fast HTML
```

---

## 3. INP — Interaction to Next Paint

```
  INP measures: User clicks → Visual response appears

  ┌── What happens on click ─────────────────────────────────────┐
  │                                                              │
  │  Click! → Event handler runs → DOM updates → Style → Layout  │
  │           ████████████████     ████          ██      ██      │
  │           ← Input Delay → ← Processing → ← Presentation →    │
  │                                                              │
  │  Total INP = Input Delay + Processing + Presentation Delay   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘


  HOW TO IMPROVE INP:
  ───────────────────

  1. Break up long tasks (>50ms blocks the main thread):

     // BAD — One 200ms task:
     function processAllItems(items) {
       items.forEach(item => heavyProcessing(item)); // 200ms
     }

     // GOOD — Yield to browser between chunks:
     async function processAllItems(items) {
       const CHUNK_SIZE = 50;
       for (let i = 0; i < items.length; i += CHUNK_SIZE) {
         const chunk = items.slice(i, i + CHUNK_SIZE);
         chunk.forEach(item => heavyProcessing(item));
         // Let browser handle events + render between chunks:
         await new Promise(resolve => setTimeout(resolve, 0));
       }
     }

  2. Use requestAnimationFrame for visual updates:
     button.addEventListener('click', () => {
       requestAnimationFrame(() => {
         element.classList.add('active'); // Synced to next frame
       });
     });

  3. Move heavy work to Web Workers (see Chapter 10)

  4. Debounce expensive input handlers

  5. Use CSS for animations (transform, opacity — no JS needed!)
```

---

## 4. CLS — Cumulative Layout Shift

```
  CLS measures unexpected layout shifts.

  BAD EXAMPLE:
  ───────────

  Page loads:                After ad loads:
  ┌──────────────────┐      ┌──────────────────┐
  │ Header           │      │ Header           │
  ├──────────────────┤      ├──────────────────┤
  │                  │      │ ┌──────────────┐ │
  │ Article Title    │      │ │  AD BANNER   │ │ ← Ad pushes content down!
  │ Paragraph text   │      │ └──────────────┘ │
  │ More content     │      │ Article Title    │ ← SHIFTED!
  │                  │      │ Paragraph text   │
  └──────────────────┘      └──────────────────┘

  User was about to click "Article Title" → clicked the AD instead!


  HOW TO FIX CLS:
  ───────────────

  1. ALWAYS set dimensions on images and videos:
     <img src="photo.webp" width="800" height="600" alt="...">
     <!-- Browser reserves space BEFORE image loads -->

     /* Or use CSS aspect-ratio: */
     img { aspect-ratio: 16 / 9; width: 100%; }

  2. Reserve space for ads/embeds:
     .ad-slot { min-height: 250px; } /* Reserve expected size */

  3. Don't inject content above existing content:
     New banners, cookie notices → push from TOP, don't shift content.

  4. Use transform for animations (not width/height/top/left):
     /* BAD — causes layout shift: */
     .expanding { height: 0; transition: height 0.3s; }
     .expanding.open { height: 200px; }

     /* GOOD — no layout shift: */
     .expanding { transform: scaleY(0); transition: transform 0.3s; }
     .expanding.open { transform: scaleY(1); }

  5. Use font-display: swap with size-adjust:
     @font-face {
       font-family: 'CustomFont';
       src: url('custom.woff2');
       font-display: swap;
       size-adjust: 105%; /* Match fallback font size */
     }
```

---

## 5. Resource Loading Optimization

```html
<!-- RESOURCE HINTS — Tell browser what to load and when -->

<!-- DNS-PREFETCH: Resolve DNS for external domains early -->
<link rel="dns-prefetch" href="https://api.example.com" />

<!-- PRECONNECT: DNS + TCP + TLS handshake early -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://cdn.example.com" crossorigin />

<!-- PRELOAD: High-priority fetch for THIS page's critical resources -->
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link rel="preload" href="/hero.webp" as="image" />
<link rel="preload" href="/critical.css" as="style" />

<!-- PREFETCH: Low-priority fetch for NEXT page's resources -->
<link rel="prefetch" href="/about.html" />
<link rel="prefetch" href="/js/dashboard.js" />

<!-- MODULEPRELOAD: Preload ES modules -->
<link rel="modulepreload" href="/js/utils.js" />
```

```
  LOADING PRIORITY MENTAL MODEL:
  ─────────────────────────────

  ┌────────────────────────────────────────────────────────────┐
  │  HIGH PRIORITY (blocks rendering):                         │
  │  • HTML document itself                                    │
  │  • CSS in <head>                                           │
  │  • <script> without defer/async                            │
  │  • Preloaded resources                                     │
  │  • LCP image with fetchpriority="high"                     │
  ├────────────────────────────────────────────────────────────┤
  │  MEDIUM PRIORITY:                                          │
  │  • <script async>                                          │
  │  • Images in viewport                                      │
  │  • Fonts referenced in CSS                                 │
  ├────────────────────────────────────────────────────────────┤
  │  LOW PRIORITY:                                             │
  │  • <script defer>                                          │
  │  • Images below fold (loading="lazy")                      │
  │  • Prefetched resources                                    │
  │  • <link rel="prefetch">                                   │
  └────────────────────────────────────────────────────────────┘
```

---

## 6. Image Optimization — The Biggest Win

```
  IMAGES ARE 50%+ OF TOTAL PAGE WEIGHT.
  Optimizing images = biggest performance improvement!


  FORMAT COMPARISON:
  ──────────────────

  ┌──────────┬──────────┬────────────┬───────────────────────┐
  │ Format   │ Size     │ Quality    │ Browser Support       │
  ├──────────┼──────────┼────────────┼───────────────────────┤
  │ PNG      │ Largest  │ Lossless   │ 100%                  │
  │ JPEG     │ Large    │ Lossy      │ 100%                  │
  │ WebP     │ Medium   │ Both       │ 97%+                  │
  │ AVIF     │ Smallest │ Both       │ 92%+                  │
  └──────────┴──────────┴────────────┴───────────────────────┘

  USE AVIF with WebP fallback:
```

```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero image"
       width="1200" height="800"
       loading="lazy"
       decoding="async">
</picture>

<!-- RESPONSIVE IMAGES: Serve correct size per device -->
<img
  srcset="photo-400.webp 400w,
          photo-800.webp 800w,
          photo-1200.webp 1200w"
  sizes="(max-width: 480px) 400px,
         (max-width: 1024px) 800px,
         1200px"
  src="photo-800.webp"
  alt="Product photo"
  loading="lazy"
  decoding="async"

```

---

## 7. Font Loading Strategies

```css
/* STRATEGY 1: font-display: swap (most common) */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
  /* Shows fallback font immediately → swaps when custom font loads */
  /* FLASH OF UNSTYLED TEXT (FOUT) — acceptable */
}

/* STRATEGY 2: Preload + swap (best performance) */
/* In HTML <head>: */
/* <link rel="preload" href="/fonts/inter.woff2" as="font" 
         type="font/woff2" crossorigin> */

/* STRATEGY 3: size-adjust to minimize layout shift during swap */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
}

/* Fallback that matches Inter's metrics */
@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%; /* Adjust to match Inter's character width */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: "Inter", "Inter-fallback", sans-serif;
}
```

```
  ┌───────────────────────────────────────────────────────────┐
  │  FONT LOADING BEST PRACTICES:                             │
  │                                                           │
  │  1. Use woff2 only (smallest, 97%+ support)               │
  │  2. Self-host fonts (avoid Google Fonts round trip)       │
  │  3. Preload your primary font                             │
  │  4. Use font-display: swap                                │
  │  5. Subset fonts (only chars you need)                    │
  │  6. Limit to 2-3 font families max                        │
  │  7. Use variable fonts (1 file for all weights)           │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
```

---

## 8. JavaScript Bundle Optimization

```
  ANALYZE BUNDLE SIZE:
  ────────────────────

  # Vite:
  npx vite-bundle-visualizer

  # Webpack:
  npx webpack-bundle-analyzer stats.json

  Shows a treemap of what's in your bundle:
  ┌──────────────────────────────────────────────────────────┐
  │ ┌──────────────────────────────┐ ┌────────────────────┐  │
  │ │                              │ │                    │  │
  │ │  react-dom (128KB)           │ │  lodash (72KB)     │  │
  │ │                              │ │                    │  │
  │ │                              │ └────────────────────┘  │
  │ └──────────────────────────────┘ ┌────────────────────┐  │
  │ ┌──────────────┐ ┌────────────┐  │  moment (66KB)     │  │
  │ │ your code    │ │ chart.js   │  │  ← REPLACE with    │  │
  │ │ (25KB)       │ │ (40KB)     │  │     date-fns (8KB) │  │
  │ └──────────────┘ └────────────┘  └────────────────────┘  │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// CODE SPLITTING — Load code only when needed:

// Route-based splitting (React):
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// Component-level splitting:
const HeavyChart = lazy(() => import("./components/HeavyChart"));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

```
  TREE SHAKING — Dead code elimination:
  ──────────────────────────────────────

  // BAD — imports ENTIRE library:
  import _ from 'lodash';          // 72KB
  _.debounce(fn, 300);

  // GOOD — imports only the function:
  import debounce from 'lodash/debounce';  // 2KB
  debounce(fn, 300);

  // BEST — use native or lightweight alternative:
  // No library needed for debounce! Write it in 5 lines.
```

---

## 9. Caching Strategies — HTTP Cache Headers

```
  ┌──────────────────────────────────────────────────────────────┐
  │  REQUEST FLOW WITH CACHING:                                  │
  │                                                              │
  │  Browser → Memory Cache? → Disk Cache? → Network → Server    │
  │             (fastest)       (fast)         (slow)            │
  │                                                              │
  │  Memory cache: Tab closes → gone                             │
  │  Disk cache: Persists across sessions                        │
  └──────────────────────────────────────────────────────────────┘
```

```
  CACHE-CONTROL HEADER:
  ────────────────────

  Static assets (JS, CSS, images) with content hash in filename:
  Cache-Control: public, max-age=31536000, immutable
  (Cache for 1 year — file hash changes when content changes)

  HTML pages:
  Cache-Control: no-cache
  (Always revalidate with server — but use cached if unchanged)

  API responses:
  Cache-Control: private, max-age=0, must-revalidate
  (Never cache — always fresh)

  User-specific data:
  Cache-Control: private, no-store
  (Never store — sensitive data)


  ┌───────────────────┬──────────────────────────────────────────┐
  │ Asset             │ Cache Strategy                           │
  ├───────────────────┼──────────────────────────────────────────┤
  │ app.a1b2c3.js     │ max-age=31536000, immutable              │
  │ styles.x4y5z6.css │ max-age=31536000, immutable              │
  │ hero.webp         │ max-age=86400 (1 day)                    │
  │ index.html        │ no-cache (always check)                  │
  │ /api/user         │ no-store (never cache)                   │
  │ /api/products     │ max-age=300 (5 min)                      │
  └───────────────────┴──────────────────────────────────────────┘
```

---

🔬 **Section Challenge — 9. Caching Strategies — HTTP Cache Headers**

**Challenge 1 (Debug — Who/When/What):** You deploy a CSS bug fix. The file is `styles.a1b2c3.css` with `Cache-Control: max-age=31536000, immutable`. Users still see the broken styles. **Who** is serving the old file? **When** will they see the fix? **What** does `immutable` mean?

<details><summary>Answer</summary>

**Who serves old file?** The BROWSER's disk cache — it has `styles.a1b2c3.css` cached for 1 year with `immutable` (never revalidate). **When fix seen?** NEVER on their machine, unless they force-refresh or the cache is cleared. **What `immutable` means:** Tells the browser "this file will NEVER change — don't even bother checking with the server for the entire max-age period." **The real fix:** The cache-busting hash in the filename (`a1b2c3`) changed to `d4e5f6` when the CSS changed. The NEW `index.html` references `styles.d4e5f6.css`. When the browser loads the updated `index.html` (which has `Cache-Control: no-cache`), it sees the NEW filename → cache miss → downloads fresh CSS. **Lesson:** `immutable` is only safe for content-hashed filenames. HTML must always be `no-cache` so users get the latest entry point.

</details>

## 10. Measuring Performance in Code

```javascript
// ─── Performance API ───

// Mark start and end of operations:
performance.mark("fetch-start");
const data = await fetch("/api/data");
performance.mark("fetch-end");
performance.measure("API Fetch", "fetch-start", "fetch-end");

// Read measurements:
const measures = performance.getEntriesByType("measure");
console.log(measures[0].duration); // → 342.5 (ms)

// ─── PerformanceObserver — Watch for metrics in real-time ───
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Send to your analytics:
    console.log(`${entry.name}: ${entry.startTime.toFixed(0)}ms`);
  }
});

// Observe paint events (FCP, LCP):
observer.observe({ type: "paint", buffered: true });
// → "first-contentful-paint: 1200ms"

// Observe Largest Contentful Paint:
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log("LCP:", lastEntry.startTime, "Element:", lastEntry.element);
}).observe({ type: "largest-contentful-paint", buffered: true });

// Observe Layout Shifts (CLS):
let clsScore = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      // Ignore user-triggered shifts
      clsScore += entry.value;
    }
  }
  console.log("CLS:", clsScore);
}).observe({ type: "layout-shift", buffered: true });

// ─── Web Vitals Library (recommended) ───
// npm install web-vitals
import { onLCP, onINP, onCLS } from "web-vitals";

onLCP(({ value }) => sendToAnalytics("LCP", value));
onINP(({ value }) => sendToAnalytics("INP", value));
onCLS(({ value }) => sendToAnalytics("CLS", value));
```

---

**Next Chapter**: [Web Accessibility (a11y) →](07_Web_Accessibility_A11y.md)


---

## Reality Check

**"Performance work starts when users complain"** ? By complaint time, the architecture has hardened around the slowness: the render-blocking dependency is load-bearing, the 2MB of client JS is the app, the layout shift is baked into the component design. The economical model is BUDGETS in CI (bundle-size ceilings per route, Lighthouse assertions per PR) plus field monitoring (RUM percentiles) so regressions surface as failed builds and dashboard deltas, not tickets. Performance is a property you keep, not a project you run � the project version costs 10x and recurs annually.

**"A good Lighthouse score means the site is fast"** ? Lighthouse is a LAB probe of one synthetic load � one device profile, one network, empty cache, no interaction; Core Web Vitals ranking data is FIELD data (CrUX � real users' 75th percentile). The divergences are systematic, not noise: lab misses the median phone's CPU, the logged-in user's data weight, the third-party scripts that A/B tools inject for real traffic only, and INP entirely (interaction latency needs real interactions). Lab is for diagnosis and CI gating; field is the truth ranking and users experience. Optimizing the lab number while field INP burns is the modern cargo cult � and it is extremely common.

**"LCP is fixed by optimizing images"** ? LCP decomposes into FOUR serial phases � TTFB, resource discovery/load delay, resource load time, render � and image optimization touches only the third: a slow backend (phase one) or an LCP image discovered late (phase two � hidden behind CSS background-image, a JS-rendered hero, or missing from the initial HTML) dominates far more LCP failures than file size does. The phase-attribution tools (the LCP breakdown in DevTools/web-vitals library) name the guilty phase; the fixes map per phase: edge/caching for TTFB, preload plus fetchpriority=high plus img-in-HTML for discovery, THEN format/size/CDN for load, and no-lazy-loading-above-the-fold as the standing rule.

**"CLS comes from images without dimensions"** ? Dimension-less media is the tutorial cause; the production causes are richer: late-arriving CONTENT (ads, embeds, cookie banners injecting above the fold � reserve space or bottom-anchor them), web FONTS swapping metrics (the fallback-to-webfont reflow � size-adjust/font-display tuning), client-side rendered sections popping in (skeletons must match final geometry EXACTLY or they cause the shift they exist to prevent), and animations of layout properties (top/height instead of transform). The measurement nuance that saves debugging days: CLS is windowed session-based and INTERACTION-EXCUSED � shifts within 500ms of input do not count, so the accordion is fine and the surprise banner is not, by design.

**"JavaScript performance means faster algorithms"** ? Frontend JS cost is dominated by VOLUME and SCHEDULING, not algorithmic complexity: bytes parsed and compiled on the main thread (the bundle IS the performance problem � code-splitting and dead-dependency removal beat micro-optimizing any loop), long tasks blocking input (chunking work with scheduler.yield beats making the work 20 percent faster), hydration cost on framework apps (the server-rendered page that ignores clicks for three seconds), and third-party scripts (routinely half the main-thread time, owned by nobody). The profiler-first rule holds double here: the flame chart names the cost center, and it is almost never the function you suspected � it is the import you forgot you shipped.
