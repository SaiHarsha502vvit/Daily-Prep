# 08. Browser Internals for SDETs — Why Dynamics 365 Takes 10 Seconds

**Navigation**: [← Chapter 07: E2E Architecture](./07_test_step_E2E_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 09: Parallel Execution](./09_Parallel_Execution_Workers.md)

**Cross-links:**

- [`16_JavaScript/09_Browser_Internals_Rendering.md`](../../16_JavaScript/09_Browser_Internals_Rendering.md) — Complete rendering pipeline deep dive
- [`15_React_Frontend/01_React_Fundamentals.md`](../../15_React_Frontend/01_React_Fundamentals.md) — React rendering lifecycle
- [`21_SDET/09_Dynamics365_CRM_Testing.md`](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) — D365-specific patterns built on this chapter

---

## 5W1H — Why This Chapter?

- **WHAT**: How browsers actually render a page — from HTML bytes to pixels — and how that pipeline directly causes the "element visible but text missing" problem you face in Dynamics 365, JSP, and ASP.NET apps.
- **WHY**: Every time you write `waitFor({ state: 'visible', timeout: 60000 })` without understanding _why_ you need it, you are guessing. Understanding the browser pipeline lets you write precise, fast waits instead of arbitrary timeouts.
- **WHO**: SDETs dealing with slow-loading enterprise UIs where elements appear in the DOM before their content is ready.
- **WHEN**: Every time a test is flaky due to timing issues.
- **HOW**: By tracing a D365 page load from the first network packet all the way to visible text on screen.

---

## 1. The 4 Browser Trees — What They Are and Why They Matter to You

Every web page that loads in a browser goes through 4 different data structures. Playwright interacts with different trees at different stages.

### Tree 1: The DOM Tree

The browser parses HTML and builds the **Document Object Model** — a tree of Element nodes.

```html
<div id="masterSearch">
  <input id="MasterSearchDropdown-option" />
  <button>Search</button>
</div>
```

Becomes:

```
Document
└── html
    └── body
        └── div#masterSearch
            ├── input#MasterSearchDropdown-option
            └── button "Search"
```

**SDET impact:** `page.locator('#MasterSearchDropdown-option')` queries the DOM tree. An element can be IN the DOM tree long before it is visible on screen.

---

### Tree 2: The CSSOM Tree

The browser parses all CSS files and inline styles into the **CSS Object Model** — a tree of style rules.

```css
#masterSearch {
  display: none;
}
.ms-Spinner {
  visibility: hidden;
}
```

**SDET impact:** An element can be in the DOM tree but not rendered at all because CSS says `display: none`. This is why:

```typescript
await page.locator("#masterSearch").waitFor({ state: "attached" });
// Passes! The element IS in the DOM.

await page.locator("#masterSearch").waitFor({ state: "visible" });
// FAILS! display:none means it has no rendered box — not "visible".
```

---

### Tree 3: The Render Tree

The browser merges the DOM tree and CSSOM tree into the **Render Tree** — only elements that are ACTUALLY displayed.

```
Render Tree (only visible elements):
└── body
    └── div#masterSearch  ← only here if display is NOT none
        └── button "Search"
        // input#MasterSearchDropdown-option NOT here if it's display:none
```

**SDET impact:** Playwright's `{ state: 'visible' }` checks this tree. An element must be in the render tree AND have a non-zero bounding box (width > 0 and height > 0).

---

### Tree 4: The Accessibility Tree

The browser builds a **parallel tree** for screen readers and automation tools, based on ARIA roles and semantic HTML.

```
Accessibility Tree:
└── main (landmark)
    └── form "Master Search"
        ├── combobox "MasterSearch" ← input becomes a combobox role
        └── button "Search"        ← button keeps its role
```

**SDET impact:** This is what `page.getByRole()` queries. NOT the DOM tree.

```
[D365 DOM]         [Accessibility Tree]
<li class="ms-CommandBar-item">    →  menuitem "Edit"
  <button>Edit</button>
</li>
```

**This is exactly your `menuitem` vs `button` issue.** The `<li>` has `role="menuitem"` in the accessibility tree. The visual `<button>` inside it is a child of the `menuitem`. When you call:

```typescript
page.getByRole("button", { name: "Edit" });
// Looks in accessibility tree for a BUTTON named "Edit"
// Finds: nothing at the top level (the button is inside a menuitem)

page.getByRole("menuitem", { name: "Edit" });
// Looks in accessibility tree for a MENUITEM named "Edit"
// Finds: the <li> element that wraps the visual button ✅
```

**How to find the real ARIA role:** Open Chrome DevTools → Elements panel → click the element → click "Accessibility" tab on the right. It shows the exact `role`, `name`, and `state` from the accessibility tree.

**These aren't 4 independent trees — 2 of them are computed FROM the other 2, and that's exactly why they can disagree.** [Ch02](../01_Foundations/02_Enterprise_Locators_XPath.md) established the DOM as one rooted tree; this section adds three more, each a *derived* structure: the Render Tree is what you get by walking the DOM tree and, at each node, checking the matching CSSOM rule — keep the node only if its computed `display` isn't `none` — a filter-join over two trees, not a third independent source of truth. That's the precise mechanical reason `waitFor({ state: 'attached' })` (DOM tree membership) and `waitFor({ state: 'visible' })` (Render Tree membership) can give different answers for the identical element: they're querying the output of two different tree-computations, one of which is a strict filtered subset of the other's node set. The Accessibility Tree is not a filtered subset of anything — it's built by a *separate* mapping (DOM structure + ARIA attributes + implicit HTML semantics → accessibility nodes), which is exactly why a `<button>` inside a `role="menuitem"` `<li>` can report as `menuitem` in one tree while still being a `<button>` in the DOM tree: `getByRole` and `page.locator('button')` are walking genuinely different trees, not two views of the same one.

---

## 2. What Playwright's `{ state: 'visible' }` Actually Checks

When you write:

```typescript
await locator.waitFor({ state: "visible" });
```

Playwright checks ALL of the following — every single one must be true:

```
✓ 1. Element EXISTS in the DOM tree
✓ 2. No ancestor has display: none
✓ 3. No ancestor has visibility: hidden
✓ 4. The element's opacity is not 0
✓ 5. The element has a non-zero bounding box (width > 0 AND height > 0)
✓ 6. No ancestor has clip-path that makes it fully invisible
```

**The four Playwright states explained:**

| State        | DOM present?                    | CSS visible?   | In render tree?       |
| ------------ | ------------------------------- | -------------- | --------------------- |
| `'attached'` | ✅ Required                     | ❌ Not checked | ❌ Not checked        |
| `'detached'` | ❌ Must NOT be present          | —              | —                     |
| `'visible'`  | ✅ Required                     | ✅ Required    | ✅ Required           |
| `'hidden'`   | Either absent OR `display:none` | CSS hidden     | ❌ Not in render tree |

---

## 3. The D365 Two-Phase Render — Why It Takes 10 Seconds

This is the core problem. Dynamics 365 and React-based enterprise apps don't load all at once. They load in phases.

### Phase 1 — The Shell (~500ms to 2s)

React renders the page STRUCTURE immediately — the skeleton, navigation, tab headers, empty containers. From the DOM perspective, the page looks "complete."

```html
<!-- After Phase 1 — DOM is ready -->
<div id="MasterSearchDropdown-option"></div>
<!-- EXISTS but empty -->
<table class="ms-DetailsList">
  <!-- NO ROWS YET -->
</table>
<div class="ms-Spinner"></div>
<!-- Loading spinner is present -->
```

At this point:

- `waitFor({ state: 'visible' })` on `#MasterSearchDropdown-option` → **PASSES** (element exists and is visible)
- But its dropdown options are empty
- The table has zero rows

### Phase 2 — The Data (~3s to 10s)

D365's JavaScript makes one or more API calls to the CRM backend. When they return, React re-renders the components with real data.

```html
<!-- After Phase 2 — data is loaded -->
<div id="MasterSearchDropdown-option">Card | Smartcard | Order</div>
<table class="ms-DetailsList">
  <tr class="ms-DetailsList-row">
    <!-- ROWS NOW EXIST -->
    <td>CIT-001</td>
    <td>PAID</td>
  </tr>
</table>
<!-- Spinner is gone -->
```

### The Naive (Broken) Test

```typescript
// ❌ WRONG — waits for the shell, not the data
await page
  .locator("#MasterSearchDropdown-option")
  .waitFor({ state: "visible" });
// This passes after Phase 1 (0.5–2s)
// But the dropdown has no options yet!

await page.selectOption("#MasterSearchDropdown-option", "Card");
// Fails: option "Card" doesn't exist yet
```

### The Correct Waiting Strategies

**Strategy 1: Wait for CONTENT, not just presence**

```typescript
// ✅ Wait for the spinner to disappear (signals Phase 2 is starting)
await expect(page.locator(".ms-Spinner")).toHaveCount(0);

// ✅ Wait for actual text content inside the dropdown
await expect(page.locator("#MasterSearchDropdown-option")).toContainText(
  "Card",
);

// ✅ Wait for at least one data row
// Wait for at least one row — Playwright's toHaveCount takes a number, not a { minimum } object,
// so "at least 1" is expressed by waiting for the first row to be attached and visible:
await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible();
```

**Strategy 2: Wait for the Network Response**

```typescript
// Wait for the specific API call that loads the data
// This is MORE precise than waiting for DOM changes

const [response] = await Promise.all([
  page.waitForResponse(
    (response) =>
      response.url().includes("/api/master-search") &&
      response.status() === 200,
  ),
  page.click("#searchButton"),
]);
// Now the response is available AND the UI will shortly update
// Wait for at least one row — Playwright's toHaveCount takes a number, not a { minimum } object,
// so "at least 1" is expressed by waiting for the first row to be attached and visible:
await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible();
```

**Strategy 3: `waitForLoadState` — Use Sparingly**

```typescript
// 'domcontentloaded' — fires when HTML is parsed (Phase 1, very early)
await page.waitForLoadState("domcontentloaded");

// 'load' — fires when all resources (images, scripts) are loaded
await page.waitForLoadState("load");

// 'networkidle' — fires when no network requests for 500ms
// ⚠️ FRAGILE on SPAs — they often have background polling requests
// that prevent 'networkidle' from ever firing
await page.waitForLoadState("networkidle"); // Use with caution
```

**Strategy 4 (NEVER USE): Hard timeout**

```typescript
// ❌ NEVER do this in production tests
await page.waitForTimeout(10000); // "Wait 10 seconds and hope it loads"
// Slow in fast environments. Fails in slow environments. Unacceptable.
```

---

## 4. SPA Tab Navigation — Why `waitForNavigation` Fails

In traditional multi-page apps (JSP, `.aspx`), clicking a tab causes a FULL PAGE RELOAD. Playwright's `page.waitForNavigation()` waits for this reload and works correctly.

**In React SPAs (D365, your CRM app):** Clicking a tab does NOT reload the page. It:

1. Updates the URL hash (e.g., `/customer/123#phones`)
2. Updates the React component state
3. Re-renders the tab content in the same DOM

**No browser navigation event fires.** If you do:

```typescript
// ❌ WRONG for SPAs
await Promise.all([
  page.waitForNavigation(), // Times out! No navigation happens.
  page.click('[role="tab"][name="Phones"]'),
]);
```

**The correct SPA tab wait:**

```typescript
// ✅ Wait for the tab to become active (aria-selected changes)
await page.click('[role="tab"][name="Phones"]');

// Wait for the tab's aria-selected to update
await expect(page.locator('[role="tab"][name="Phones"]')).toHaveAttribute(
  "aria-selected",
  "true",
);

// Wait for the content below to render
await expect(page.locator(".phone-list-container")).toBeVisible();

// OR: wait for a specific text that only appears in Phone tab content
await expect(page.locator(".phone-list-container")).toContainText("Primary");
```

---

## 5. JSP and ASPX — Different Rendering, Different Waits

Your environment includes both SPA (D365/React) AND legacy apps (JSP, ASPX). Each has different behaviour.

### JSP / Servlet Apps (Java Web Apps)

These are traditional server-rendered apps. The server generates the full HTML on every request.

**Characteristics:**

- Full page reload on every navigation and form submit
- All content is in the DOM immediately after `waitForLoadState('domcontentloaded')`
- No two-phase render problem
- But: slow because every interaction requires a round-trip to the server

**Playwright approach:**

```typescript
await page.click("#submitButton");
// For JSP: the page fully reloads — waitForNavigation works
await page.waitForNavigation({ waitUntil: "domcontentloaded" });
// Now all server-rendered content is in the DOM
```

### ASPX / ASP.NET WebForms Apps

These use server-side rendering with **UpdatePanel** (partial page refresh via AJAX).

**Characteristics:**

- Some form submissions trigger a partial AJAX update (not full reload)
- Some links cause full page navigation
- The `__VIEWSTATE` hidden field maintains form state server-side

**Common trap:** UpdatePanel updates look like they finished, but ASP.NET is still processing. Look for a `UpdateProgress` control (usually a spinner or "Loading..." text) that disappears when done.

```typescript
// For ASPX with UpdatePanel:
await page.click("#ctl00_MainContent_btnSearch"); // ASP.NET server control ID

// Wait for UpdateProgress (loading indicator) to disappear
await expect(page.locator("#UpdateProgress1")).toBeHidden({ timeout: 30000 });

// NOW the updated content is in the DOM
await expect(page.locator("#ctl00_MainContent_GridView1")).toBeVisible();
```

---

## 6. Practical Debugging: "Why Is My Locator Failing?"

When a locator can't find an element, use this debugging pipeline:

```typescript
// Step 1: Take a screenshot at the point of failure
await page.screenshot({ path: "debug-screenshot.png", fullPage: true });

// Step 2: Dump the current page HTML to inspect the DOM state
const html = await page.content();
console.log(html.substring(0, 5000)); // first 5000 chars

// Step 3: Check if the element EXISTS but is hidden
const count = await page.locator("#myElement").count();
console.log(`Element count: ${count}`); // 0 = not in DOM at all

// Step 4: Check the element's CSS state
const isVisible = await page.locator("#myElement").isVisible();
const isHidden = await page.locator("#myElement").isHidden();
console.log(`Visible: ${isVisible}, Hidden: ${isHidden}`);

// Step 5: Check bounding box (width/height = 0 means CSS collapsed it)
const box = await page.locator("#myElement").boundingBox();
console.log(`BoundingBox: ${JSON.stringify(box)}`);
// null = not in render tree. { x, y, width: 0, height: 0 } = collapsed.

// Step 6: Check the Accessibility tree role (for getByRole issues)
// Run in browser console:
// document.querySelector('#myElement').getAttribute('role')
// Or use Chrome DevTools → Elements → Accessibility tab
```

---

## 🏋️ Practice Challenges

**Challenge 1 (The Two-Phase Render):** After clicking "Search" in Master Search, your test does:

```typescript
await page
  .locator(".ms-DetailsList-row")
  .waitFor({ state: "visible", timeout: 30000 });
const rowText = await page.locator(".ms-DetailsList-row").first().textContent();
expect(rowText).toContain("CIT-001");
```

This sometimes passes with empty text content. What is happening and how do you fix it?

<details><summary>Answer</summary>

The `waitFor({ state: 'visible' })` passes as soon as the row element appears in the DOM with a non-zero bounding box — which can happen during Phase 1 (the shell render) before the data arrives. The row is visible but its cells are empty.

Fix: wait for the text content specifically, not just visibility:

```typescript
await expect(page.locator(".ms-DetailsList-row").first()).toContainText(
  "CIT-001",
  { timeout: 30000 },
);
```

This keeps retrying until the text appears, handling both Phase 1 and Phase 2.

</details>

**Challenge 2 (The ARIA Role Trap):** You see this button on screen in D365: "Edit Customer". You try `page.getByRole('button', { name: 'Edit Customer' })` — it returns 0 elements. How do you find the real ARIA role?

<details><summary>Answer</summary>

1. Open Chrome DevTools → click the "Edit Customer" element in the Elements panel.
2. On the right side, click the "Accessibility" tab.
3. Read the `Role` field — for D365 CommandBar items, it will likely show `menuitem` not `button`.
4. Use `page.getByRole('menuitem', { name: 'Edit Customer' })` instead.

Alternative: inspect the DOM directly — look for a parent element with `role="menuitem"` attribute on the `<li>` wrapping the visual button.

</details>

**Challenge 3 (SPA vs MPA Wait):** You are writing a test for both a D365 page (React SPA) and a JSP page. Both have a "Search" button that triggers data loading. Write the correct post-click wait for each:

<details><summary>Answer</summary>

**D365 (React SPA):**

```typescript
await page.click("#searchButton");
// No navigation fires — wait for content
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
// Wait for at least one row — Playwright's toHaveCount takes a number, not a { minimum } object,
// so "at least 1" is expressed by waiting for the first row to be attached and visible:
await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible();
```

**JSP (server-rendered):**

```typescript
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  page.click("#searchButton"),
]);
// All content is now in the DOM immediately
await expect(page.locator("#resultTable tr").first()).toBeVisible();
```

</details>

---

## 6b. `waitForResponse` with Body Inspection

You can wait for a response AND inspect its body in the same call — essential for multi-step API + UI tests:

```typescript
// Pattern: wait for a specific response, capture the body, use in later steps
const [searchResponse] = await Promise.all([
  page.waitForResponse(
    async (response) => {
      if (!response.url().includes("/api/master-search")) return false;
      if (response.status() !== 200) return false;
      // Inspect the body — must be the response with data, not a 204 or empty
      const body = (await response.json()) as { results: unknown[] };
      return body.results.length > 0; // only resolve when results arrive
    },
    { timeout: 30_000 },
  ),
  masterSearchPage.searchButton.click(),
]);

const responseBody = (await searchResponse.json()) as {
  results: SearchResult[];
};
console.log(`API returned ${responseBody.results.length} results`);

// Now assert the UI matches the API response
await expect(page.locator(".ms-DetailsList-row")).toHaveCount(
  responseBody.results.length,
);
```

```typescript
// Pattern: intercept AND capture for later assertion
let capturedCitationId: string | null = null;
await page.route("**/api/citations", async (route) => {
  const response = await route.fetch();
  const body = (await response.json()) as { citationId: string };
  capturedCitationId = body.citationId;
  await route.fulfill({ response });
});
// After the test action that triggers the API call:
expect(capturedCitationId).not.toBeNull();
expect(capturedCitationId).toMatch(/^CIT-\d+$/);
```

---

## 7. Chrome DevTools Protocol (CDP) — How Playwright Actually Talks to the Browser

This is the missing layer most SDETs don't know about. When you call `await page.click('#btn')`, Playwright doesn't call a browser API. It sends a **JSON message over a WebSocket** to the browser's DevTools interface.

```
The CDP Communication Stack:

Your test code (Node.js)
    │
    │  JSON messages over WebSocket
    │  e.g.: {"method":"Input.dispatchMouseEvent","params":{"type":"mousePressed","x":100,"y":50}}
    ▼
Chrome DevTools Protocol (CDP) endpoint
    │  ws://localhost:9222/json/version
    ▼
Chromium browser (the actual browser engine)
    └── Performs the action (click, navigate, screenshot)
    └── Sends response: {"id":1,"result":{}}
```

**Why this matters for test design:**

```
1. EVERY Playwright action is a round-trip network call.
   click → send → browser processes → respond → Promise resolves
   The minimum round-trip time is ~2-5ms (even locally).
   100 actions = 200-500ms of pure network overhead.

2. This is why Promise.all is important for parallel operations:
   Sequential:   await action1()  →  await action2()  →  200ms
   Parallel:     await Promise.all([action1(), action2()])  →  100ms

3. The browser queues CDP commands.
   If you send 10 clicks too fast, the browser processes them in order.
   The DOM may update between each click — subsequent clicks may miss.

4. FAILED CDP commands throw exceptions that become test failures:
   "Element is not attached to the DOM" → CDP tried to click element that disappeared
   "Target closed" → browser tab navigated away mid-operation
   "Target page, context or browser has been closed" → browser crashed
```

**What each CDP domain controls:**

```
Input.*           → mouse events, keyboard events, touch events
DOM.*             → query elements, get attributes, set content
Runtime.*         → execute JavaScript, get properties, call functions
Network.*         → intercept requests, modify responses (page.route)
Page.*            → navigate, reload, screenshot, wait for load
Target.*          → manage browser contexts, create/close pages
Emulation.*       → set viewport, geolocation, device settings
Tracing.*         → start/stop trace recording (trace: 'on')
```

**Viewing CDP traffic in action (debugging Playwright internals):**

```bash
# Run Playwright with verbose CDP logging:
DEBUG=pw:api npx playwright test mytest.spec.ts 2>&1 | head -100

# You'll see raw CDP messages:
# pw:api page.goto https://myapp.com +0ms
# pw:api page._waitForLoadState(networkidle) +523ms
# pw:api page.locator -> Locator@#submitBtn +0ms
# pw:api locator.click +12ms
```

---

## 8. The V8 Event Loop — Why Promise.all Works and `await` Suspends

Understanding V8's event loop is the bridge between "using `await`" and "understanding WHY `await` works." This directly enables the `Promise.all` pattern you use for race conditions (new tab handling, network interception).

**[Ch01](../01_Foundations/01_Playwright_TS_Basics.md#1-the-javascript-event-loop--why-async-exists-at-all) named ONE queue (a real FIFO Queue). Here's the fuller picture: there are actually two, and the difference between them is the whole reason `Promise.all`'s ordering guarantee holds.**

```
V8 Event Loop has TWO queues:

1. TASK QUEUE (macrotask queue) — setTimeout, setInterval, I/O callbacks
2. MICROTASK QUEUE — Promise.then(), async/await completions

Priority: Microtask queue ALWAYS drains before the next task is picked up.

Execution order:
┌─────────────────────────────────────────────────────┐
│  Call Stack: currently executing code               │
│  ↓ (when empty, event loop picks next)              │
├─────────────────────────────────────────────────────┤
│  Microtask Queue (drains completely):               │
│  Promise.then() callbacks, async/await continuations│
├─────────────────────────────────────────────────────┤
│  Task Queue (one task per loop iteration):          │
│  setTimeout, setInterval, I/O events               │
└─────────────────────────────────────────────────────┘
```

**Why Promise.all is the right pattern for race-condition-free new tab capture:**

```javascript
// The race without Promise.all:
//   Time 0ms: await page.click('#openTab')  → click is sent to browser
//   Time 1ms: browser opens new tab → fires 'page' event
//   Time 2ms: await context.waitForEvent('page')  → listener registered
//             BUT the 'page' event already fired at 1ms → listener missed it
//             → waitForEvent hangs forever

// Promise.all prevents this:
const [newTab] = await Promise.all([
  context.waitForEvent("page"), // listener registered FIRST (line 1 starts synchronously)
  page.click("#openTab"), // click fires AFTER listener is registered
]);

// Why this works:
// Promise.all STARTS both promises SIMULTANEOUSLY in the same microtask.
// context.waitForEvent('page') registers its listener synchronously.
// page.click('#openTab') is async — the actual click only happens on the next
// CDP round-trip (which takes ≥2ms, by which time the listener is already registered).
// No race condition possible.
```

**The await suspension model:**

```javascript
// When JavaScript hits `await`, execution of THIS function suspends.
// But the event loop continues running.
// Other code (and event handlers) CAN run during the suspension.

async function exampleFlow() {
  console.log("1: before await"); // runs immediately
  await page.click("#btn"); // SUSPENDS this function
  // --- event loop runs: processes CDP response, handles other events ---
  console.log("2: after await"); // resumes when CDP response arrives
}

// This is exactly how waitForEvent works:
// waitForEvent registers a listener and returns a Promise
// The Promise resolves when the event fires
// await suspends until the Promise resolves
// The event loop is free to process the 'page' event and resolve the Promise
```

---

## 9. Actionability Checks — What Playwright Does Before EVERY Action

Before Playwright performs any action (click, fill, check, etc.), it runs a series of **actionability checks**. Understanding these eliminates a class of "why did my test fail?" questions.

From [playwright.dev/docs/actionability](https://playwright.dev/docs/actionability):

```
For locator.click():
  ✓ Visible:    not display:none, not visibility:hidden, bounding box > 0
  ✓ Stable:     not moving (CSS animation or transform in progress)
  ✓ Enabled:    not disabled attribute, not aria-disabled
  ✓ Editable:   N/A for click
  ✓ Receives Events: not covered by another element (pointer events)

  If ANY check fails → Playwright retries (up to timeout)
  If all pass → action is performed

For locator.fill():
  ✓ Visible
  ✓ Enabled
  ✓ Editable:   not readonly, not contenteditable=false
  (does NOT check stable or receives events)

For locator.selectOption():
  ✓ Visible
  ✓ Enabled
  (does NOT check editable)

For expect(locator).toBeVisible():
  Only checks: visible (no stable, enabled, or other checks)
  Returns immediately: no waiting for stability
```

**Why "stable" matters for D365:**

```typescript
// D365 uses CSS transitions for panel animations.
// During an animation, elements are moving/resizing.
// Playwright's 'stable' check waits for the CSS transition to complete.

// The animation:
// Panel slides in: transform: translateX(-100%) → translateX(0)
// While sliding: the element IS visible, but is NOT stable

// Without stability check (Selenium behavior):
// Click fires during animation → click lands at wrong position → wrong element clicked

// With Playwright's stability check:
// Playwright waits for animation to complete (element stops moving) → then clicks
// Result: correct click, every time
```

**Overriding actionability checks (when you know better):**

```typescript
// force: true — bypass ALL actionability checks and click immediately
// Use ONLY when you understand why the check fails and it's a test limitation
await page.locator("#hiddenTrigger").click({ force: true });
// Warning: force: true on a truly invisible element = undetected bug

// Common legitimate uses:
// 1. Clicking a checkbox that is visually hidden (CSS: opacity:0) but still works
// 2. Clicking a button that is temporarily covered during an animation
// 3. Triggering events on elements your app intentionally hides

// trial: true — run actionability checks WITHOUT performing the action
// Useful for: "is this element clickable yet?" as a conditional
const isReady = await page
  .locator("#btn")
  .click({ trial: true })
  .then(() => true)
  .catch(() => false);
```

---

## 10. Reflow, Repaint, Composite — Performance Impact on Test Timing

Understanding the browser's rendering pipeline steps explains why some D365 actions are slower than others.

```
When the browser needs to update the screen after a DOM change:

1. STYLE RECALCULATION
   → Browser recalculates CSS for affected elements
   → Triggered by: any DOM/class change
   → Cost: O(number of CSS rules × affected elements)

2. LAYOUT (Reflow)
   → Browser recalculates positions and sizes of all elements
   → Triggered by: adding/removing elements, changing dimensions
   → Cost: HIGH (can cascade to recalculate the whole document)
   → D365 trigger: adding a row to the grid → entire grid reflowed

3. PAINT
   → Browser fills pixels for each element
   → Triggered by: color, background, border changes
   → Cost: MEDIUM

4. COMPOSITE
   → Browser combines painted layers and sends to GPU
   → Triggered by: transform, opacity (on compositor thread — FAST)
   → Cost: LOW (GPU-accelerated, doesn't block main thread)
```

**Why this matters for your tests:**

```typescript
// Operations that trigger full reflow (SLOW to settle):
// - D365 opening a panel: adds a large DOM subtree → full reflow
// - D365 loading grid rows: DOM insertion for each row → repeated reflow
// - ASPX UpdatePanel: replaces a large section → reflow

// Operations that only trigger composite (FAST to settle):
// - CSS animations using transform/opacity → compositor-only
// - D365 dialog fade-in using opacity → immediate, no reflow
// - Fluent UI hover effects → fast

// Why this affects your waits:
// After a reflow (slow operation), the DOM is stable but there may be
// a brief repaint lag before elements are at their final positions.
// The 'stable' actionability check accounts for this.

// Best practice: wait for CONTENT, not just visibility:
// After a grid load (heavy reflow), don't just wait for row visibility.
// Wait for specific text to appear — that confirms both reflow AND data:
await expect(grid.locator(".ms-DetailsRow").first()).toContainText("CIT-001");
// This passes ONLY when the row is rendered AND the text is populated.
// Much more reliable than just waitFor({ state: 'visible' })
```

---

## 11. CDP for Custom Metrics — PerformanceObserver

Use CDP's `Runtime.evaluate` to run browser-side JavaScript and capture custom performance metrics:

```typescript
// Measure how long D365 takes to render the first data row after search
test("Measure Master Search render time", async ({ page }) => {
  await page.goto(process.env.CRM_URL!);

  // Inject a PerformanceObserver BEFORE clicking search
  await page.evaluate(() => {
    (window as any).__renderMetrics = {};
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).__renderMetrics[entry.name] = entry.startTime;
      }
    });
    observer.observe({ type: "mark", buffered: true });
    // Mark immediately
    performance.mark("search-button-clicked");
  });

  await page.click("#searchButton");

  // Wait for results to appear
  await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible({
    timeout: 30_000,
  });

  // Mark again after render
  await page.evaluate(() => {
    performance.mark("first-row-visible");
  });

  // Read metrics from browser
  const metrics = (await page.evaluate(
    () => (window as any).__renderMetrics,
  )) as Record<string, number>;
  const renderTimeMs =
    metrics["first-row-visible"] - metrics["search-button-clicked"];

  console.log(`D365 search render time: ${renderTimeMs.toFixed(0)}ms`);
  await test.info().attach("render-metrics", {
    body: JSON.stringify({ renderTimeMs }, null, 2),
    contentType: "application/json",
  });

  // Assert render time is within SLA
  expect(
    renderTimeMs,
    "Master Search render time exceeds 10s SLA",
  ).toBeLessThan(10_000);
});

// CDP Network throttling for performance testing:
test("D365 loads acceptably on slow network", async ({ page, context }) => {
  const cdpSession = await context.newCDPSession(page);
  await cdpSession.send("Network.enable");
  await cdpSession.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 100, // 100ms RTT
  });

  const start = Date.now();
  await page.goto(process.env.CRM_URL!);
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 60_000 });
  const loadTime = Date.now() - start;

  console.log(`D365 load time on throttled network: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(30_000); // 30s SLA on 1.5Mbps
});
```

---

## 🏋️ Practice Challenges

**Challenge 1 (The Two-Phase Render):** After clicking "Search" in Master Search, your test does:

```typescript
await page
  .locator(".ms-DetailsList-row")
  .waitFor({ state: "visible", timeout: 30000 });
const rowText = await page.locator(".ms-DetailsList-row").first().textContent();
expect(rowText).toContain("CIT-001");
```

This sometimes passes with empty text content. What is happening and how do you fix it?

<details><summary>Answer</summary>

The `waitFor({ state: 'visible' })` passes as soon as the row element appears in the DOM with a non-zero bounding box — which can happen during Phase 1 (the shell render) before the data arrives. The row is visible but its cells are empty.

Fix: wait for the text content specifically, not just visibility:

```typescript
await expect(page.locator(".ms-DetailsList-row").first()).toContainText(
  "CIT-001",
  { timeout: 30000 },
);
```

This keeps retrying until the text appears, handling both Phase 1 and Phase 2.

</details>

**Challenge 2 (The ARIA Role Trap):** You see this button on screen in D365: "Edit Customer". You try `page.getByRole('button', { name: 'Edit Customer' })` — it returns 0 elements. How do you find the real ARIA role?

<details><summary>Answer</summary>

1. Open Chrome DevTools → click the "Edit Customer" element in the Elements panel.
2. On the right side, click the "Accessibility" tab.
3. Read the `Role` field — for D365 CommandBar items, it will likely show `menuitem` not `button`.
4. Use `page.getByRole('menuitem', { name: 'Edit Customer' })` instead.

Alternative: inspect the DOM directly — look for a parent element with `role="menuitem"` attribute on the `<li>` wrapping the visual button.

</details>

**Challenge 3 (SPA vs MPA Wait):** You are writing a test for both a D365 page (React SPA) and a JSP page. Both have a "Search" button that triggers data loading. Write the correct post-click wait for each:

<details><summary>Answer</summary>

**D365 (React SPA):**

```typescript
await page.click("#searchButton");
// No navigation fires — wait for content
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
// Wait for at least one row — Playwright's toHaveCount takes a number, not a { minimum } object,
// so "at least 1" is expressed by waiting for the first row to be attached and visible:
await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible();
```

**JSP (server-rendered):**

```typescript
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  page.click("#searchButton"),
]);
// All content is now in the DOM immediately
await expect(page.locator("#resultTable tr").first()).toBeVisible();
```

</details>

---

**Challenge 4 [Actionability Checks]:** Your test does `await page.locator('#submitBtn').click()`. The element IS visible in the screenshot, but Playwright throws `"Element is not visible"`. What are the 5 things Playwright checks for visibility, and how do you diagnose which one is failing?

<details><summary>Answer</summary>

Playwright checks ALL of these for `state: 'visible'`:

1. Element exists in the DOM
2. No ancestor has `display: none`
3. No ancestor has `visibility: hidden`
4. Element's `opacity` is not 0
5. Element has a non-zero bounding box (width > 0 AND height > 0)

**Diagnostic steps:**

```typescript
// 1. Is it in the DOM at all?
const count = await page.locator("#submitBtn").count();
console.log(`DOM count: ${count}`);

// 2. Get bounding box (null = not in render tree, 0x0 = CSS collapsed)
const box = await page.locator("#submitBtn").boundingBox();
console.log(`BoundingBox: ${JSON.stringify(box)}`);

// 3. Check CSS computed styles:
const styles = await page.locator("#submitBtn").evaluate((el) => {
  const s = window.getComputedStyle(el);
  return {
    display: s.display,
    visibility: s.visibility,
    opacity: s.opacity,
    width: s.width,
    height: s.height,
  };
});
console.log("Computed styles:", styles);

// 4. Walk ancestors to find which one has display:none:
await page.evaluate(() => {
  let el = document.querySelector("#submitBtn");
  while (el) {
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") {
      console.log("Hidden ancestor:", el.tagName, el.id, el.className);
    }
    el = el.parentElement;
  }
});
```

</details>

---

**Challenge 5 [CDP Communication]:** `await page.click('#btn')` takes 150ms in your test. Is this fast or slow? What are the two main components of this 150ms, and what would you do if you needed to speed it up?

<details><summary>Answer</summary>

**Components of the 150ms:**

1. **CDP round-trip** (~2-5ms): JSON message from Node.js → CDP endpoint → Chromium → response back
2. **Actionability checks** (~10-140ms): Playwright must verify the element is visible, stable, enabled, and receives events. If the element has a CSS animation in progress, Playwright waits for it to settle before clicking.

**150ms is reasonable** for a button with an animation. 2-5ms is the floor for any CDP action (even on localhost).

**To speed it up** (only if you understand the tradeoff):

```typescript
// 1. Skip stability check (dangerous — only if there's no animation):
await page.locator("#btn").click({ force: true });
// BUT: force:true bypasses ALL checks, including "element covered by another element"

// 2. If the element is already known stable, there's nothing to optimize.
//    150ms for a click is not a bottleneck in a 120s E2E test.

// 3. Real speedup: use Promise.all for INDEPENDENT actions:
// Sequential: 150ms + 150ms = 300ms
await page.click("#btn1");
await page.click("#btn2");
// Parallel (if btn2 doesn't depend on btn1's side effect):
await Promise.all([page.click("#btn1"), page.click("#btn2")]);
// = ~150ms total
```

Key insight: optimizing individual action speed is almost never the bottleneck. Network waits (waitForResponse, waitFor visible) dominate E2E test duration.

</details>

---

## 📚 References & Further Reading

### Official Documentation — Playwright

- [Actionability Checks](https://playwright.dev/docs/actionability) — The exact checklist Playwright runs before every click, fill, or check (visible, stable, enabled, editable, receives events)
- [Auto-waiting vs Explicit waiting](https://playwright.dev/docs/actionability#assertions) — How `expect(locator)` waits differ from action waits
- [CDP Session API](https://playwright.dev/docs/api/class-cdpsession) — How to interact with the raw Chrome DevTools Protocol from within Playwright tests

### Browser Internals & Rendering

- [Google Developers: Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering) — The authoritative guide on Style, Layout, Paint, and Composite (the pixel pipeline)
- [MDN: Accessibility Tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) — How browsers construct the accessibility tree that `getByRole` uses
- [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/) — The full reference for all CDP commands (Network, DOM, Page, Emulation)

---

**Navigation**: [← Chapter 07: E2E Architecture](./07_test_step_E2E_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 09: Parallel Execution](./09_Parallel_Execution_Workers.md)


---

## Reality Check

**"Headless and headed Playwright tests should behave identically"** → Almost always true. Exceptions: some browser features (print dialog, file pickers, some camera/mic permissions) behave differently in headless. Some sites detect headless mode via JavaScript and show different content. Rare GPU-accelerated rendering differences can cause visual regression failures between headed (uses GPU) and headless (software renderer). Run final regression tests in headed mode before major releases.

**"Browser contexts are the same as browser profiles"** → A browser context is a lightweight in-memory isolation unit: separate cookies, localStorage, sessionStorage, permissions, and service workers. A browser profile is heavier — it includes downloaded files, extensions, browser history on disk. Playwright's browser contexts are created in milliseconds; loading a full profile is much slower. For most test scenarios, contexts are the right isolation granularity.

**"Network interception always intercepts before the request reaches the server"** → `page.route()` intercepts requests made by the page's JavaScript. Requests made by the browser itself (navigation, service workers, browser-level caches) may bypass route handlers. Specifically, cached resources may be served from cache without making a network request — your route handler is never called for cached responses unless you explicitly clear the cache or disable caching in the browser context.

**"page.evaluate() runs JavaScript in the same context as my test code"** → `page.evaluate()` runs in the BROWSER's JavaScript context (same V8 as the page's JS, with access to `document`, `window`, DOM APIs). Your test code runs in Node.js. They are separate processes. Data passed between them must be serializable (JSON-serializable). You cannot pass Node.js objects, functions, or module references into `page.evaluate()` — only primitive data.

**"requestInterception makes tests run without any backend"** → Mocking all API calls via `page.route()` removes the network dependency — fast and deterministic. But you are now testing your frontend against your mock data, not against your actual backend. A contract between your mock and your real API can drift. Use mocked tests for frontend-unit-level coverage and real-backend tests for integration coverage. Both are necessary; neither replaces the other.
