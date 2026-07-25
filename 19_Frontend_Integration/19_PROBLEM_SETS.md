# 📝 Frontend Integration — Problem Sets

## `19_Frontend_Integration` Module | Build Tools · Performance · Accessibility · DevTools Debugging

> **How to use:** All measurements use Chrome DevTools → Performance tab. Accessibility audits use Lighthouse. Write your fix before checking answers.

---

## Problem Set FE-PS1 — Build Tools & Bundling

**Prerequisites:** `19_Frontend_Integration/03_Build_Tools_Ecosystem.md`

---

### Part A: Theoretical

**A1 (Easy).** What does a bundler (Webpack/Vite) do? Why can't a browser just load 500 separate `.js` files directly?

<details><summary>Answer</summary>

**What a bundler does:**

1. **Resolves imports** — follows `import` chains from the entry point, building a dependency graph
2. **Bundles** — concatenates modules into fewer files (1–5 chunks instead of 500)
3. **Transforms** — TypeScript → JavaScript, JSX → React.createElement, Sass → CSS
4. **Optimizes** — tree-shaking (removes unused exports), minification (shorter variable names), compression

**Why NOT load 500 files:**

- **HTTP/1.1:** Max 6 concurrent connections per domain. 500 files = 83 sequential batches → minutes of loading
- **HTTP/2:** Multiplexing helps but each file still has header overhead + module parsing overhead
- **Parse cost:** Each `<script type="module">` triggers a separate parse → compile → execute cycle. V8 compiles faster when code is in fewer, larger chunks.
- **Waterfall:** `app.js` imports `utils.js` which imports `math.js` — browser can't start downloading `math.js` until it parses `utils.js` and discovers the import. Bundler resolves this ahead of time.

🔴 **Erklärung:** "But HTTP/2 solves this" is a common misconception. HTTP/2 multiplexing eliminates the connection limit, but it does NOT eliminate the dependency waterfall (file A imports file B — browser can't request B until A is parsed) or the per-module parsing overhead.

</details>

---

**A2 (Medium).** Explain tree-shaking. Why does this code prevent tree-shaking?

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}
export function multiply(a, b) {
  return a * b;
}
export function sideEffect() {
  console.log("loaded");
}
sideEffect(); // ← problem

// main.js
import { add } from "./utils.js";
console.log(add(1, 2));
```

<details><summary>Answer</summary>

**Tree-shaking:** The bundler's dead-code elimination. It analyzes which `export`s are actually imported and removes unused ones from the final bundle.

In the example: `multiply` is never imported → tree-shaking SHOULD remove it.

**BUT:** `sideEffect()` is called at the top level of `utils.js`. This is a **side effect** — it runs when the module is loaded, regardless of which exports are used. The bundler CANNOT safely remove `multiply` if removing the module might also remove the side effect.

**Fix:** Mark the package as side-effect-free in `package.json`:

```json
{
  "sideEffects": false
}
```

This tells the bundler: "every file in this package is pure — safe to tree-shake."

Or, for specific files with real side effects:

```json
{
  "sideEffects": ["./src/polyfills.js", "*.css"]
}
```

🔴 **Erklärung:** Libraries that run code at import time (polyfills, CSS-in-JS registrations, global event listeners) prevent tree-shaking for their ENTIRE module. This is why `lodash` (one huge module) ships 72KB even if you use one function, while `lodash-es` (separate ES modules per function) tree-shakes to ~4KB.

</details>

---

**A3 (Hard).** Explain code splitting. Implement route-based lazy loading in React:

<details><summary>Answer</summary>

**Code splitting:** Instead of one 2MB bundle.js, the bundler splits output into multiple chunks loaded on demand. Users only download what they need for the current page.

```tsx
// BEFORE: all routes in one bundle (2MB downloaded upfront)
import DashboardPage from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";
import AnalyticsPage from "./pages/Analytics";

// AFTER: each route is a separate chunk (loaded on navigation)
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() => import("./pages/Dashboard"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));

function App() {
  return (
    <Suspense fallback={<div className="skeleton skeleton--card" />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Result:** Initial load downloads only `Dashboard.chunk.js` (~200KB). `Settings.chunk.js` downloads only when user navigates to `/settings`.

**Preloading hint (advanced):**

```tsx
// Preload settings when user hovers over the Settings nav link
<Link
  to="/settings"
  onMouseEnter={() => import("./pages/Settings")} // prefetch on hover
>
  Settings
</Link>
```

</details>

---

## Problem Set FE-PS2 — Web Performance & Core Web Vitals

**Prerequisites:** `19_Frontend_Integration/06_Web_Performance_CoreWebVitals.md`

---

### Part A: Theoretical

**A1 (Medium).** What are the 3 Core Web Vitals? For each, give the metric, the threshold, and one concrete fix.

<details><summary>Answer</summary>

| Vital                               | Measures                                       | Good    | Needs Work | Poor    | #1 Fix                                                                                   |
| ----------------------------------- | ---------------------------------------------- | ------- | ---------- | ------- | ---------------------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | Time until largest visible element renders     | ≤ 2.5s  | ≤ 4.0s     | > 4.0s  | Preload hero image: `<link rel="preload" as="image">`                                    |
| **INP** (Interaction to Next Paint) | Latency from user interaction to visual update | ≤ 200ms | ≤ 500ms    | > 500ms | Move heavy computation off main thread (`requestIdleCallback` or Web Worker)             |
| **CLS** (Cumulative Layout Shift)   | Visual stability — how much does content jump? | ≤ 0.1   | ≤ 0.25     | > 0.25  | Set explicit `width` and `height` on all `<img>` tags (prevents reflow when image loads) |

**Measuring in production:**

```javascript
// web-vitals library (Google)
import { onLCP, onINP, onCLS } from "web-vitals";

onLCP((metric) => sendToAnalytics("LCP", metric.value));
onINP((metric) => sendToAnalytics("INP", metric.value));
onCLS((metric) => sendToAnalytics("CLS", metric.value));
```

🔴 **Erklärung:** CLS is the sneakiest. A late-loading ad banner pushes content down by 200px → user clicks the wrong button → frustration. Always reserve space for dynamic content with CSS `aspect-ratio` or explicit dimensions.

</details>

---

**A2 (Hard).** A React SPA takes 8 seconds to first paint. Diagnose and fix using the Chrome DevTools Performance tab.

<details><summary>Answer</summary>

**Step 1 — Record:** DevTools → Performance → Record → Reload

**Step 2 — Read the waterfall:**

```
Network:  index.html (50ms) → bundle.js (3.2MB, 2.1s download) → api/data (800ms)
Main:     Parse HTML (30ms) → Evaluate bundle.js (4.5s) → React hydrate (1.2s)
```

**Findings & Fixes:**

| Finding                      | Time          | Fix                                                                        |
| ---------------------------- | ------------- | -------------------------------------------------------------------------- |
| Bundle is 3.2MB              | 2.1s download | Code split: `React.lazy()` route-based splitting → initial bundle ~400KB   |
| Bundle evaluation takes 4.5s | 4.5s CPU      | Tree-shake unused imports; replace moment.js (320KB) with date-fns (12KB)  |
| API call blocks render       | 800ms         | Move to `useQuery` with `Suspense` — show skeleton while loading           |
| No compression               | —             | Enable gzip/brotli on nginx: `gzip on; gzip_types application/javascript;` |
| No caching headers           | —             | `Cache-Control: public, max-age=31536000, immutable` for hashed assets     |

**After fixes:**

- Initial bundle: 400KB → 120KB (brotli compressed)
- Download: 150ms
- Parse + evaluate: 800ms
- First paint: **~1.2s** (down from 8s)
</details>

---

## Problem Set FE-PS3 — Web Accessibility (A11y)

**Prerequisites:** `19_Frontend_Integration/07_Web_Accessibility_A11y.md`

---

### Part A: Audit

**A1 (Medium).** This form has 5 accessibility bugs. Find and fix all 5.

```html
<div onclick="submitForm()">
  <div class="label">Email</div>
  <input type="text" class="email-input" />

  <div class="label">Password</div>
  <input type="text" class="password-input" />

  <div class="submit-btn" onclick="submitForm()">Submit</div>

  <div class="error" style="color: red;">Invalid email</div>
</div>
```

<details><summary>5 Bugs + Fixes</summary>

| #   | Bug                                           | Fix                                                                                              |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `<div>` labels not linked to inputs           | Use `<label for="email">Email</label>` + `<input id="email">`                                    |
| 2   | Password input is `type="text"`               | Use `type="password"` — hides characters, triggers password managers                             |
| 3   | Submit is a `<div>`, not `<button>`           | Use `<button type="submit">Submit</button>` — gets keyboard focus, Enter key, screen reader role |
| 4   | Error message not announced to screen readers | Add `role="alert"` or `aria-live="assertive"` so screen readers announce the error immediately   |
| 5   | Red color as ONLY error indicator             | Add an icon (⚠️) or text prefix — color alone fails for colorblind users                         |

**Fixed HTML:**

```html
<form onsubmit="submitForm(event)">
  <label for="email">Email</label>
  <input id="email" type="email" required aria-describedby="email-error" />

  <label for="password">Password</label>
  <input id="password" type="password" required />

  <button type="submit">Submit</button>

  <div id="email-error" role="alert" class="error">
    ⚠️ Invalid email address
  </div>
</form>
```

🔴 **Erklärung:** The `<div onclick>` submit button is the #1 accessibility fail on the web. It has NO keyboard focus (can't Tab to it), NO Enter-key activation, NO screen reader role. `<button>` gets ALL of these for free. Never style a `<div>` as a button — use `<button>` and style it.

</details>

---

**A2 (Medium).** What is the ARIA role hierarchy? When should you use ARIA vs semantic HTML?

<details><summary>Answer</summary>

**Rule #1:** Don't use ARIA if you can use semantic HTML.

| Instead of...                                 | Use...          |
| --------------------------------------------- | --------------- |
| `<div role="button">`                         | `<button>`      |
| `<div role="navigation">`                     | `<nav>`         |
| `<div role="heading" aria-level="2">`         | `<h2>`          |
| `<span role="link">`                          | `<a href>`      |
| `<div role="list">` + `<div role="listitem">` | `<ul>` + `<li>` |

**When ARIA IS needed:**

- Custom components with no HTML equivalent (tabs, accordions, combo boxes)
- Dynamic content updates: `aria-live="polite"` tells screen readers to announce changes
- Relationships between elements: `aria-describedby`, `aria-labelledby`, `aria-controls`

```tsx
// Custom tabs — no semantic HTML equivalent
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Content 1</div>
<div role="tabpanel" id="panel-2" hidden>Content 2</div>
```

🔴 **Erklärung:** "I'll add ARIA to make it accessible" is a red flag. If you need ARIA, you probably chose the wrong HTML element. The only valid ARIA uses are for custom widget patterns (tabs, trees, comboboxes) that have no native HTML equivalent.

</details>

---

## Problem Set FE-PS4 — Chrome DevTools Debugging

**Prerequisites:** `19_Frontend_Integration/05_DevTools_Debugging_Mastery.md`

---

### Part A: Scenarios

**A1 (Medium).** A user reports: "The page loads fine but clicking the 'Save' button does nothing." Walk through the exact DevTools debugging steps.

<details><summary>Answer</summary>

**Step 1 — Console tab:** Check for JavaScript errors. A silent `TypeError: undefined is not a function` might be swallowed by a catch block.

**Step 2 — Elements tab:** Inspect the Save button. Check:

- Is it `<button>` or `<div>`? (If `<div>`, the click handler might be broken)
- Is it `disabled`? (Might be visually hidden)
- Is another element overlapping it? (z-index / pointer-events issue — check computed styles)

**Step 3 — Event Listeners panel:** Elements tab → select the button → Event Listeners panel → check if `click` has a handler attached. If not — the event binding failed.

**Step 4 — Sources tab → set breakpoint:** Find the click handler in the source. Set a breakpoint. Click the button.

- If breakpoint hits: step through the handler — find where it fails
- If breakpoint DOESN'T hit: the event listener is not attached (React state issue, or element was re-rendered and listener lost)

**Step 5 — Network tab:** If the handler runs but nothing saves — check the Network tab. Is a request being sent? Is it getting a 4xx/5xx response?

**Step 6 — React DevTools (if React):** Inspect the component. Check if the onClick prop is `undefined`. Check if the component re-rendered and the handler was lost due to a conditional render bug.

🔴 **Erklärung:** "Nothing happens on click" is almost always one of: (1) JS error in the handler, (2) handler not attached, (3) another element intercepting clicks (z-index), (4) API call fails silently. Check in that order.

</details>

---

**A2 (Hard).** A page has a memory leak — RAM usage grows by 5MB every 10 seconds. How do you find it with DevTools?

<details><summary>Answer</summary>

**Step 1 — Memory tab → Heap Snapshot:**

1. Take Snapshot 1
2. Wait 30 seconds (let 3 leak cycles happen)
3. Take Snapshot 2
4. Select Snapshot 2 → comparison view → "Objects allocated between Snapshot 1 and Snapshot 2"
5. Sort by "Retained Size" descending → find the growing objects

**Step 2 — Identify the leak pattern:**

| Leak Type                     | Symptom                                                     | Fix                                      |
| ----------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| **Detached DOM nodes**        | Elements removed from DOM but referenced by JS variable     | Null the reference: `element = null`     |
| **Forgotten event listeners** | `addEventListener` without `removeEventListener` on unmount | Return cleanup function from `useEffect` |
| **setInterval not cleared**   | Interval runs forever, holding closure references           | `clearInterval(id)` in cleanup           |
| **Closures holding state**    | Inner function captures large parent scope variables        | Minimize closure scope; use WeakRef      |

**Step 3 — Performance Monitor (live):**
DevTools → More tools → Performance Monitor → watch "JS heap size" in real-time. If it grows linearly → confirmed leak.

**Most common React leak:**

```tsx
useEffect(() => {
  const ws = new WebSocket("wss://api.example.com");
  ws.onmessage = (e) => setData(JSON.parse(e.data));
  // ❌ MISSING CLEANUP — WebSocket stays open after unmount

  // ✅ Fix:
  return () => ws.close();
}, []);
```

</details>

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)


---

## Reality Check

**"Integration problem sets duplicate the per-technology sets"** ? The integration genre has its own irreducible exercises: build an autocomplete (debounce plus abortable fetch plus keyboard navigation plus ARIA combobox plus click-outside � five boundary crossings in one widget), a modal done fully (portal, focus trap and return, scroll lock, exit animation before unmount), an infinite scroller (IntersectionObserver plus list virtualization plus scroll restoration), a drag-reorder list (pointer events plus optimistic order plus FLIP animation). Each is trivially describable, and each fails at the seams the isolated sets never exercise � which is precisely why frontend interview loops converge on them.

**"Build-the-widget exercises are about getting it working"** ? The scoring dimension is the EDGE LADDER after it works: the autocomplete when responses arrive out of order (the stale-response race � abort or sequence-check), when the user tabs away mid-fetch, when results are empty versus errored (different UI, different announcements); the modal when content scrolls, when a second modal stacks, when the trigger unmounted while open. Working is the entry fee; the ladder is the assessment � and practicing widgets WITHOUT self-inflicting the ladder builds portfolio pieces, not interview readiness.

**"These exercises need a framework to be realistic"** ? Vanilla-first builds the transferable layer: the focus trap, the outside-click detection, the abortable fetch pattern, and the ARIA state machine are identical under every framework � and implementing them once without the framework reveals what the framework versions actually do (and what your library dependency is charging you for). The two-pass discipline � vanilla for mechanics, then the framework port for idiom � produces engineers who can debug the library when it leaks; framework-only practice produces engineers who can only file issues against it.

**"Performance problems belong in the performance chapter, not problem sets"** ? Performance-shaped EXERCISES are the only way the diagnosis loop becomes muscle: given this janky list, find the cause in a Performance recording (it is the layout thrash in the row-measure loop) and fix it (virtualize or batch reads); given this leaking SPA, snapshot-diff and name the retainer (the subscription holding unmounted components); given this 4MB bundle, read the analyzer and cut half (the CJS moment library plus the accidental dev-build of a dependency). Reading about these produces recognition; the exercise format produces the DevTools fluency that recognition is useless without.

**"Completing the integration set means frontend readiness"** ? The set covers construction; readiness includes the SURROUNDING behaviors interviews and jobs actually sample: narrating trade-offs while building (controlled versus uncontrolled, where state lives, why this ARIA pattern), testing what you built (the Playwright CT spec for your own modal � does YOUR focus trap pass), and code-reviewing the genre (spot the missing cleanup, the unkeyed list, the color-only error state in someone else's widget). The full loop � build, harden through the ladder, test, review � is one exercise repeated four ways, and the last three ways are where senior signals live.
