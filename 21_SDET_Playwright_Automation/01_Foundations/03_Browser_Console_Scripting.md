# 03. Browser Console Scripting — DevTools as a Test Engineering Workbench

**Navigation**: [← Enterprise Locators](./02_Enterprise_Locators_XPath.md) | [Index](../00_INDEX.md) | [→ JS/TS for Automation](./04_JS_TS_For_Automation.md)

---

## 5W1H

- **WHAT**: Using the browser's built-in JavaScript console as an active engineering tool — to explore the DOM, test locators, extract React state, intercept network calls, inject test data into localStorage, and automate repetitive browser tasks — all before writing a single line of Playwright code.
- **WHY**: Every Playwright test you write starts with a question: "How do I locate this element? What data does it contain? What event does this button fire?" The console answers all of these questions in seconds. SDETs who skip the console and jump straight to Playwright waste hours on fragile locators that could have been validated in 30 seconds.
- **WHO**: All SDETs — especially those testing D365, Salesforce, SAP, or any app with a complex, dynamically generated DOM.
- **WHEN**: During test authoring (explore before you write), during debugging (inspect state at failure time), and during investigation (understand what the app is doing before writing assertions).
- **HOW**: By mastering the DevTools console API (`$$`, `$x`, `$0`, `monitor`, `getEventListeners`) and using `page.evaluate()` to bring these same tools into your Playwright tests.

---

## 1. The Console is a JavaScript REPL

The browser console is a **Read-Eval-Print Loop** — you type JavaScript, it executes immediately in the context of the current page, and shows the result. This means you have full access to:

- `document` — the entire DOM tree
- `window` — all global variables, including React, Angular, and app state
- All JavaScript loaded by the page (including the app's own code)
- The browser's built-in APIs (fetch, localStorage, sessionStorage, IndexedDB)

**Opening DevTools:**
- Chrome/Edge: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (macOS)
- Then click the **Console** tab

---

## 2. The Core Console API — 10 Commands That Change Everything

### `$$` — Query All Elements (CSS Selector)

```javascript
// document.querySelectorAll() with nicer display
$$('.ms-DetailsRow')                     // all rows in a D365 grid
$$('[data-testid="submit-btn"]')         // all elements with this test ID
$$('input[required]')                    // all required form inputs
$$('[aria-label="Status"]')              // all elements labelled "Status"

// Get the COUNT of matched elements:
$$('.ms-DetailsRow').length              // how many rows?
// → 12

// Get TEXT of all matched elements:
$$('.ms-DetailsRow').map(el => el.textContent?.trim())
// → ['CIT-001 PENDING £150...', 'CIT-002 PAID £200...', ...]

// Find the FIRST match:
$$('[data-testid="submit"]')[0]          // equivalent to $('[data-testid="submit"]')
```

### `$` — Query First Element (CSS Selector)

```javascript
// document.querySelector() shorthand
$('[data-testid="status-badge"]')        // first matching element
$('#citationForm').textContent           // text content of the form
$('h1').innerText                        // heading text
$('.ms-Spinner')                         // is there a spinner? (null = not present)

// Check if element EXISTS:
!!$('[data-testid="submit"]')            // true if exists, false if not
// → true (element found)

// Read an attribute:
$('[data-automation-key]').getAttribute('data-automation-key')
// → 'createNewRecord'
```

### `$x` — Query Elements Using XPath

```javascript
// Evaluate XPath expressions — ESSENTIAL for verifying your locators
$x('//button[text()="Save"]')            // find button with exact text "Save"
$x('//button[contains(text(),"Save")]')  // find button containing text "Save"
$x('//*[@data-testid="submit"]')         // any element with data-testid="submit"

// Check your ancestor XPath before putting it in Playwright:
$x('//td[text()="CIT-001"]/ancestor::tr')
// → [tr] — the row containing "CIT-001" — correct!

// Find elements by text in specific containers:
$x('//div[@class="ms-DetailsList"]//span[contains(text(),"PENDING")]')
// → [span, span] — two pending citations visible

// The VALIDATION WORKFLOW:
// 1. Write your XPath in the console
// 2. Check: does it return exactly ONE element?
// 3. If multiple: make it more specific
// 4. If zero: wrong selector — refine it
// 5. Only THEN put it in your Playwright code
```

### `$0` — Currently Selected Element in Inspector

```javascript
// When you click an element in the Elements panel, it becomes $0 in the console
// $0 is a reference to the ACTUAL DOM element — you can call any DOM method on it

$0                                        // the selected element
$0.tagName                               // 'BUTTON'
$0.className                             // 'ms-Button ms-Button--primary'
$0.textContent                           // 'Save Citation'
$0.getAttribute('data-automation-key')   // 'savePrimary'
$0.getBoundingClientRect()               // {x: 100, y: 50, width: 120, height: 36, ...}
$0.parentElement                         // the parent element
$0.closest('.ms-CommandBar')             // nearest ancestor .ms-CommandBar
$0.querySelectorAll('span')             // all span descendants of this element

// WORKFLOW: Select element in Elements tab → switch to Console → use $0
// This is faster than writing a selector — you already have the element
```

### `getEventListeners` — What Events Is an Element Listening To?

```javascript
// Chrome-only DevTools function (not standard JavaScript)
getEventListeners($0)
// → { click: [{ listener: f(){...}, useCapture: false }], focus: [...] }

// Shows ALL event listeners attached to the element
// Useful for: understanding what happens when you click something
// Useful for: finding hidden event handlers that fire unexpectedly in tests

// Example: D365 command bar button — what events does it listen to?
const saveBtn = $('[data-automation-key="savePrimary"]');
getEventListeners(saveBtn)
// → { click: [{...}], keydown: [{...}] }
// You can now click the listener directly to see its source code
```

### `monitor` — Log Every Function Call

```javascript
// Monitors all calls to a specific function — logs arguments and return value
monitor(fetch)         // log every fetch() call
monitor(XMLHttpRequest.prototype.open)  // log every XHR open

// When you interact with the page after running monitor(fetch):
// → fetch called with: https://api.company.com/api/v2/citations POST {...}
// → This reveals EXACTLY what the app sends when you click a button

// Stop monitoring:
unmonitor(fetch)

// PRACTICAL USE: click a button in D365 → see what API call it makes
// → Now you know the exact endpoint and payload for your API test
```

### `monitorEvents` — Log All Events on an Element

```javascript
// Log every event that fires on an element
monitorEvents($0)                        // ALL events on selected element
monitorEvents($0, 'click')              // only click events
monitorEvents($0, ['click', 'focus'])   // click and focus events

// Output: each event is logged with its type and target as it fires
// PRACTICAL USE: understanding the event sequence in D365 form fields
// → reveals whether focus fires before input, whether change fires on keyup, etc.

// Stop monitoring:
unmonitorEvents($0)
```

### `copy` — Copy Anything to Clipboard

```javascript
copy($0.outerHTML)          // copy the element's HTML to clipboard
copy($$('[role="row"]').map(r => r.textContent?.trim()))  // copy all row text
copy(localStorage)          // copy all localStorage to clipboard (paste into editor)
copy(JSON.stringify(window.__APP_CONFIG__, null, 2))  // copy formatted app config
```

### `inspect` — Jump to Element in DevTools

```javascript
inspect($x('//button[text()="Dispute"]')[0])
// → DevTools jumps to this element in the Elements tab
// Useful for: finding the element's position in the tree after locating it via XPath
```

### `table` — Display Arrays as a Table

```javascript
// Display structured data clearly
table($$('[role="row"]').map(el => ({
  text: el.textContent?.trim().slice(0, 50),
  id: el.getAttribute('aria-rowindex'),
  classes: el.className
})))
// → Displays a clean table with text, id, and classes columns for each row
```

---

## 3. Essential DOM Exploration Patterns

### Pattern 1 — Find What Attribute to Use as a Stable Locator

```javascript
// Problem: you need to find a stable locator for the "New Citation" button in D365
// The button exists but right-click → Copy XPath gives a terrible absolute path

// Step 1: Select the element in the Elements tab → use $0 in Console
$0.outerHTML
// → '<button data-automation-key="createNew" aria-label="New" class="ms-Button">...'
// Found it: data-automation-key="createNew"

// Step 2: Verify this is unique on the page
$$('[data-automation-key="createNew"]').length
// → 1 (unique!)

// Step 3: Verify the attribute is stable (not generated)
// data-automation-key is a D365-set attribute — it's stable across sessions

// Step 4: Write your Playwright locator
// page.locator('[data-automation-key="createNew"]')
```

### Pattern 2 — Find Hidden Elements (Not in Viewport)

```javascript
// Element exists in DOM but is scrolled out of view
// Standard $() finds it — but Playwright waits for visibility

// Find ALL inputs including hidden/off-screen ones:
$$('input').filter(el => el.offsetParent === null)  // hidden elements (display:none or parent hidden)
$$('input').filter(el => el.type === 'hidden')       // type="hidden" inputs
$$('input').filter(el => !el.getBoundingClientRect().height)  // no height (invisible)

// Check if a specific element is in viewport:
const el = $('[data-testid="submit"]');
const rect = el.getBoundingClientRect();
const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
console.log('In viewport:', inViewport);
```

### Pattern 3 — Understand Two-Phase Rendering (D365)

```javascript
// D365 React components load in two phases:
// Phase 1: Container renders (element exists, text is empty)
// Phase 2: Data arrives via OData (text fills in)

// Script to watch a field's text change over time:
const field = $('[data-id="status"]');
const observer = new MutationObserver(() => {
  console.log(`[${Date.now()}] Status changed to: "${field.textContent}"`);
});
observer.observe(field, { childList: true, subtree: true, characterData: true });

// Now navigate in D365 — watch the console
// → [0ms]      Status changed to: "" (Phase 1: empty container)
// → [847ms]    Status changed to: "PENDING" (Phase 2: data arrived)

// This tells you:
// - The element exists after 0ms (visible: true)
// - But the text arrives at 847ms
// - Your Playwright wait must wait for the TEXT, not just existence
// → await expect(field).toHaveText('PENDING', { timeout: 15_000 }) — correct
// → await field.waitFor({ state: 'visible' }) — WRONG (catches Phase 1 empty)

observer.disconnect();  // stop observing
```

### Pattern 4 — Extract All Network Calls (API Discovery)

```javascript
// Override fetch to log all API calls made by the application
const originalFetch = window.fetch;
const apiCalls = [];

window.fetch = function(...args) {
  const [url, options = {}] = args;
  const entry = {
    url,
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body ? JSON.parse(options.body) : null,
    timestamp: new Date().toISOString(),
  };
  apiCalls.push(entry);
  console.log(`[API] ${entry.method} ${url}`);
  return originalFetch.apply(this, args);
};

// Now use the application...
// When done, view all API calls:
table(apiCalls)
// → Clean table of all API calls made during your session

// Restore original fetch:
window.fetch = originalFetch;

// WHY THIS MATTERS: You now know exactly what endpoints exist,
// what methods they use, and what bodies they accept.
// You can now write these exact calls in your API tests.
```

### Pattern 5 — Read localStorage, sessionStorage, and Cookies

```javascript
// Read auth tokens (for understanding the auth mechanism):
localStorage.getItem('access_token')
// → 'eyJhbGciOiJSUzI1NiJ9...' (a JWT)

// Decode it without any library:
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));  // base64 decode
console.log(payload);
// → { sub: 'USR-001', email: 'user@company.com', exp: 1748567234, roles: ['CUSTOMER'] }
// Shows: userId, email, expiry timestamp, roles

// When does the token expire?
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expires:', expiresAt);
// → Token expires: Wed May 29 2026 16:27:14

// Is it expired?
console.log('Expired:', new Date() > expiresAt);

// Read sessionStorage:
Object.entries(sessionStorage).forEach(([k, v]) => console.log(k, '->', v));

// Read all cookies as an object:
document.cookie.split(';').reduce((acc, c) => {
  const [k, v] = c.trim().split('=');
  acc[k] = decodeURIComponent(v);
  return acc;
}, {})
```

---

## 4. React State Extraction — Reading the App's Internal Data

Dynamics 365 and many enterprise apps use React. The component tree holds data that is sometimes not visible in the DOM.

```javascript
// React attaches internal data to DOM nodes via a hidden property
// The property name starts with '__reactFiber$' (React 16+) or '__reactInternals$' (React 18+)

// Find the React fiber key on ANY element:
function getReactFiberKey(element) {
  return Object.keys(element).find(k =>
    k.startsWith('__reactFiber$') ||
    k.startsWith('__reactInternals$') ||
    k.startsWith('__reactFiber')
  );
}

// Get the memoized props (current props) of a React component:
function getReactProps(element) {
  const key = getReactFiberKey(element);
  if (!key) return { error: 'Not a React element (or React is not loaded)' };
  const fiber = element[key];
  return {
    props: fiber.memoizedProps,        // current props
    state: fiber.memoizedState,        // current state (for class components)
    type:  fiber.type?.displayName ?? fiber.type?.name ?? 'Unknown',  // component name
  };
}

// Usage: select an element → $0 → call the function
getReactProps($0)
// → {
//     type: 'CitationStatusBadge',
//     props: { citationId: 'CIT-001', status: 'PENDING', amount: 150 },
//     state: null
//   }
```

**Using React state extraction in Playwright tests:**

```typescript
// page.evaluate() runs JavaScript in the browser context
// You can execute ALL of the above patterns directly in your tests

const citationData = await page.evaluate(() => {
  function getReactFiberKey(el: Element): string | undefined {
    return Object.keys(el).find(k =>
      k.startsWith('__reactFiber$') || k.startsWith('__reactInternals$')
    );
  }

  // Find the citation status component in D365
  const statusEl = document.querySelector('[data-testid="citation-status-badge"]');
  if (!statusEl) return null;

  const key = getReactFiberKey(statusEl);
  if (!key) return null;

  const fiber = (statusEl as any)[key];
  return {
    status: fiber.memoizedProps?.status,
    amount: fiber.memoizedProps?.amount,
  };
});

// Assert directly on React component state:
expect(citationData?.status).toBe('PENDING');
expect(citationData?.amount).toBe(150);
```

> [!WARNING]
> This technique couples your test to React's internal implementation. React may change the fiber key format in future versions. Use it when the DOM doesn't expose the data you need, not as a default approach.

---

## 5. The Smart XPath Generator Script

The standard "Copy XPath" in Chrome produces useless absolute paths. This script generates a stable, relative XPath when you click any element:

```javascript
// Paste this entire block into the DevTools console and press Enter.
// Then click any element on the page — it generates and copies a stable XPath.

(function() {
  'use strict';

  // Remove any previous listener to avoid duplicates if run twice
  if (window.__xpathListenerActive) {
    document.body.removeEventListener('click', window.__xpathListener, true);
    console.log('[XPath Generator] Removed previous listener.');
  }

  function buildStableXPath(element) {
    // Priority list of attributes to use as anchors (most stable first):
    const STABLE_ATTRS = [
      'data-testid', 'data-automation-key', 'data-id', 'data-col-id',
      'aria-label', 'aria-labelledby', 'name', 'placeholder', 'title'
    ];

    let current = element;
    const parts = [];

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      const tag = current.tagName.toLowerCase();

      // Check for a stable attribute anchor — if found, stop here
      let anchor = null;
      for (const attr of STABLE_ATTRS) {
        const val = current.getAttribute(attr);
        if (val) {
          anchor = `${tag}[@${attr}="${val}"]`;
          break;
        }
      }

      // For interactive elements (button/a), try text content as anchor
      if (!anchor && (tag === 'button' || tag === 'a')) {
        const text = current.textContent?.trim();
        if (text && text.length < 60) {  // don't use very long text
          anchor = `${tag}[normalize-space()="${text}"]`;
        }
      }

      if (anchor) {
        parts.unshift(anchor);
        break;  // found a stable anchor — stop traversing up
      }

      // No stable anchor found — use positional index
      let index = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      const sameTagCount = current.parentElement?.querySelectorAll(`:scope > ${tag}`)?.length ?? 1;
      parts.unshift(sameTagCount > 1 ? `${tag}[${index}]` : tag);
      current = current.parentElement;
    }

    return '//' + parts.join('/');
  }

  window.__xpathListener = function(e) {
    e.preventDefault();
    e.stopPropagation();

    const xpath = buildStableXPath(e.target);
    const cssClass = e.target.className ? ` (.${[...e.target.classList].slice(0,2).join('.')})` : '';
    const label = `${e.target.tagName.toLowerCase()}${cssClass}`;

    // Print with colour
    console.log(
      `%c[XPath Generator] Clicked: ${label}`,
      'color: #FFD700; font-weight: bold;'
    );
    console.log(
      `%c${xpath}`,
      'color: #00FFFF; font-size: 14px; padding: 4px;'
    );
    console.log(
      `%cPlaywright: page.locator('${xpath.replace(/'/g, "\\'")}')",
      'color: #90EE90;'
    );

    // Copy to clipboard
    navigator.clipboard.writeText(xpath)
      .then(() => console.log('%cCopied to clipboard!', 'color: #90EE90;'))
      .catch(() => console.log('Clipboard access denied — copy manually above.'));
  };

  document.body.addEventListener('click', window.__xpathListener, true);
  window.__xpathListenerActive = true;

  console.log(
    '%c[XPath Generator] Active! Click any element to generate its XPath.\nClick again to re-run and get a fresh generator.',
    'color: #FFD700; font-weight: bold; font-size: 14px;'
  );
})();
```

**What makes this generator better than Chrome's built-in:**

| Chrome's "Copy XPath" | This Generator |
|---|---|
| `//*[@id="app"]/div[3]/div[1]/button[2]` | `//button[normalize-space()="Save Citation"]` |
| Absolute path — breaks if any ancestor changes | Relative path — stable across DOM changes |
| Uses positional index everywhere | Prefers semantic attributes |
| Never uses text content | Uses button text as anchor |
| Ignores `data-testid` | Prioritises `data-testid` as first choice |

---

## 6. Bring Console Scripts into Playwright Tests

Everything you can do in the console, you can do in your Playwright tests via `page.evaluate()` and `page.addInitScript()`:

```typescript
// Pattern 1: page.evaluate() — run a script ONCE on the current page state
const rowCount = await page.evaluate(() =>
  document.querySelectorAll('.ms-DetailsRow').length
);
console.log(`Rows visible: ${rowCount}`);

// Pattern 2: page.evaluate() with args — pass values from your test into the browser
const expectedStatus = 'PENDING';
const matches = await page.evaluate(({ status }) => {
  return Array.from(document.querySelectorAll('[data-col-id="status"]'))
    .filter(el => el.textContent?.trim() === status).length;
}, { status: expectedStatus });
expect(matches).toBeGreaterThan(0);

// Pattern 3: page.evaluate() returns complex objects
const authPayload = await page.evaluate(() => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
});
console.log('Current user:', authPayload?.email);
console.log('User roles:', authPayload?.roles);

// Pattern 4: page.addInitScript() — inject a script on EVERY page load
// Runs before ANY page JavaScript — good for hooking fetch globally
await page.addInitScript(() => {
  const original = window.fetch;
  const calls: string[] = [];
  (window as any).__apiCalls = calls;

  window.fetch = function(...args) {
    calls.push(`${(args[1] as any)?.method ?? 'GET'} ${args[0]}`);
    return original.apply(this, args);
  };
});

await page.goto('/citations');
// ... do stuff ...

const calls = await page.evaluate(() => (window as any).__apiCalls ?? []);
console.log('API calls made:', calls);
// → ['GET /api/v2/citations', 'GET /api/v2/users/me']

// Pattern 5: Inject test data directly into localStorage (bypass login form)
await page.addInitScript((token) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_id', 'USR-001');
}, process.env.TEST_TOKEN);
// Now navigate — the app sees a logged-in user without going through the login form
```

---

## 7. The Console-Based Debugging Workflow

When a Playwright test fails, open the browser in headed mode and use the console to investigate:

```typescript
// In your playwright.config.ts for local debugging:
use: {
  headless: false,     // show the browser
  slowMo: 500,         // slow down actions so you can see what's happening
},

// Or run a specific test headed:
// npx playwright test tests/mytest.spec.ts --headed --debug
```

**The debugging session workflow:**

```
1. Test fails → open trace: npx playwright show-trace test-results/[name]/trace.zip
   → See exactly which step failed and what the page looked like

2. Reproduce manually → navigate to the same page in your browser

3. Open DevTools → Console

4. Inspect the element:
   a. Find it: $$('[your-locator]')  → does it exist? how many?
   b. Read it: $('[your-locator]').textContent  → what's the actual value?
   c. Check state: $('[your-locator]').disabled  → is it disabled?

5. Test the event:
   a. monitorEvents($0, 'click')  → what fires when you click?
   b. monitor(fetch)  → what API call does the button make?

6. Check timing:
   a. Use MutationObserver to watch text change timing
   b. Compare to Playwright's timeout settings

7. Fix the test based on findings
```

---

## 🏋️ Practice — Console Mastery

### Q1. [Write It] — Network Spy

Write a Playwright test that:
1. Injects a `fetch` override via `addInitScript()`
2. Navigates to `/citations`
3. After the page loads, retrieves all captured API calls
4. Asserts that `GET /api/v2/citations` was called

<details><summary>Answer</summary>

```typescript
test('Citations page makes the citations API call on load', async ({ page }) => {
  // Inject BEFORE navigation (addInitScript runs before any page JS)
  await page.addInitScript(() => {
    const calls: Array<{ method: string; url: string }> = [];
    (window as any).__capturedApiCalls = calls;

    const originalFetch = window.fetch;
    window.fetch = function(...args: Parameters<typeof fetch>) {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : (input as Request).url;
      calls.push({ method: init?.method ?? 'GET', url });
      return originalFetch.apply(this, args);
    };
  });

  // Navigate — the injected script is already active
  await page.goto('/citations');
  await page.waitForLoadState('networkidle');

  // Read the captured calls from the browser's memory
  const calls = await page.evaluate<Array<{ method: string; url: string }>>(
    () => (window as any).__capturedApiCalls ?? []
  );

  // Assert the citations API was called
  const citationsCall = calls.find(c =>
    c.url.includes('/api/v2/citations') && c.method === 'GET'
  );
  expect(citationsCall, `Expected GET /api/v2/citations but calls were: ${JSON.stringify(calls)}`).toBeDefined();
});
```
</details>

---

### Q2. [MCQ] — Console Diagnostic Tool Selection

A D365 form field shows the correct value visually but your Playwright assertion `await expect(field).toHaveText('John Doe')` keeps timing out. Which console command helps you diagnose this first?

A) `monitorEvents($0, 'change')` — see what events fire on the field  
B) `$0.textContent` — see what text the DOM element actually contains RIGHT NOW  
C) `getEventListeners($0)` — see what listeners are attached  
D) `copy($0.outerHTML)` — get the element's HTML structure  

<details><summary>Answer</summary>

**B** — `$0.textContent` tells you what the DOM element **actually** contains right now. The most common cause of this failure is:

1. The text is in a **child element** — e.g., `toHaveText()` checks the entire text content including children, but the locator might be selecting a container while the text is in a specific `<span>` inside it.
   - Diagnose: `$0.children` — see child elements
   - Fix: scope to the exact element that holds the text

2. The text has **extra whitespace** — `$0.textContent` returns `"  John Doe  "` but you're asserting `"John Doe"`.
   - Diagnose: `JSON.stringify($0.textContent)` — shows exact characters including whitespace
   - Fix: use `{ exact: false }` or `toContainText()` instead of `toHaveText()`

3. The text is **inside a Shadow DOM** — `$0.textContent` returns `""` but visually you see text.
   - Diagnose: `$0.shadowRoot` — if non-null, it's a shadow host
   - Fix: Switch from XPath to CSS locator (Playwright pierces Shadow DOM)
</details>

---

### Q3. [Deep] How does `page.addInitScript()` differ from `page.evaluate()`, and when would you use each?

<details><summary>Answer</summary>

**`page.addInitScript(fn)`:**
- Runs **before** any page JavaScript on EVERY page load and navigation
- Runs in document creation time — you can override built-ins (fetch, localStorage) before the app sets them up
- Persists across navigations within the same page context
- Use for: intercepting ALL fetch calls globally, injecting auth tokens before the app loads, overriding browser APIs before the app uses them

```typescript
// addInitScript runs BEFORE the app's own JavaScript
await page.addInitScript(() => {
  // Override fetch before the app touches it
  window.fetch = /* ... */;
});
await page.goto('/app');  // app's fetch is already our override
```

**`page.evaluate(fn)`:**
- Runs **once**, at the moment you call it, against the CURRENT page state
- The page is already loaded (its JavaScript has already run)
- Use for: reading current DOM state, extracting data, one-time DOM manipulation, checking what React props a component has

```typescript
// evaluate runs AFTER the app has already loaded
await page.goto('/app');
// ... app has run ...
const currentState = await page.evaluate(() => document.querySelector('.status')?.textContent);
```

**The key distinction:**
- `addInitScript` = "be there before the party starts" (good for setup)
- `evaluate` = "check the party after it's already happening" (good for inspection)

In test frameworks, `addInitScript` is typically called in fixtures (before any test interaction), while `evaluate` is called mid-test to read state or trigger actions that have no Playwright API equivalent.
</details>

---

## 8. Performance Profiling from the Console — Measuring What Matters

The Performance API is built into every browser and accessible from the console. SDETs use it to answer: "How long does this operation actually take?" — before writing k6 scripts or Lighthouse audits.

### Performance Timing — Page Load Metrics

```javascript
// The browser tracks every navigation event with precise timestamps:
const timing = performance.getEntriesByType('navigation')[0];
console.table({
  'DNS Lookup':           `${(timing.domainLookupEnd - timing.domainLookupStart).toFixed(0)}ms`,
  'TCP Connect':          `${(timing.connectEnd - timing.connectStart).toFixed(0)}ms`,
  'TLS Handshake':        `${(timing.requestStart - timing.secureConnectionStart).toFixed(0)}ms`,
  'Time to First Byte':   `${(timing.responseStart - timing.requestStart).toFixed(0)}ms`,
  'Content Download':     `${(timing.responseEnd - timing.responseStart).toFixed(0)}ms`,
  'DOM Interactive':      `${(timing.domInteractive - timing.fetchStart).toFixed(0)}ms`,
  'DOM Complete':         `${(timing.domComplete - timing.fetchStart).toFixed(0)}ms`,
  'Total Load':           `${(timing.loadEventEnd - timing.fetchStart).toFixed(0)}ms`,
});

// Example output for a D365 citation list page:
// DNS Lookup:           3ms
// TCP Connect:          12ms
// TLS Handshake:        45ms
// Time to First Byte:   287ms     ← Server processing time
// Content Download:     89ms
// DOM Interactive:      1204ms    ← Page is interactive
// DOM Complete:         3847ms    ← All resources loaded
// Total Load:           3901ms
```

### PerformanceObserver — Watch Metrics in Real Time

```javascript
// Set up a watcher BEFORE the operation you want to measure:
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`[Perf] ${entry.entryType}: ${entry.name} — ${entry.duration?.toFixed(0) ?? entry.startTime?.toFixed(0)}ms`);
  }
});

// Watch for Largest Contentful Paint (LCP) — the most important Core Web Vital:
observer.observe({ type: 'largest-contentful-paint', buffered: true });

// Watch for Long Tasks (anything blocking the main thread for >50ms):
observer.observe({ type: 'longtask', buffered: true });

// Watch for Layout Shifts (CLS — content jumping around):
observer.observe({ type: 'layout-shift', buffered: true });

// Now navigate or interact — the observer logs each event
// → [Perf] largest-contentful-paint: — 2340ms   (the main content appeared at 2.3s)
// → [Perf] longtask: self — 847ms               (something blocked the thread for 847ms!)
```

### Using Performance Metrics in Playwright Tests

```typescript
test('Citation list loads within performance budget', async ({ page }) => {
  await page.goto('/citations');
  await expect(page.locator('.ms-DetailsList')).toBeVisible();

  // Read the LCP (Largest Contentful Paint) from the browser:
  const lcp = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // If already fired, resolve immediately from existing entries:
      const existing = performance.getEntriesByType('largest-contentful-paint');
      if (existing.length > 0) {
        resolve(existing[existing.length - 1].startTime);
      }
    });
  });

  console.log(`LCP: ${lcp.toFixed(0)}ms`);
  expect(lcp, `LCP was ${lcp}ms — budget is 2500ms`).toBeLessThan(2500);
});
```

---

## 9. Memory Leak Detection — Finding the Invisible Failures

Memory leaks are the bugs that never show up in a single test run but cause the app to crash after 30 minutes of use. SDETs who can detect memory leaks in their test suite are rare and extremely valuable.

### Console Heap Snapshot Workflow

```javascript
// Step 1: Take a baseline snapshot
// Chrome DevTools → Memory tab → Take heap snapshot
// Note the total heap size (e.g., 12MB)

// Step 2: Perform the suspected leaking operation 10 times
// (e.g., open a citation form, fill it, save it, go back, repeat)

// Step 3: Take another heap snapshot
// Note the total heap size (e.g., 38MB after 10 iterations)

// Step 4: If heap grew by more than 2x → you have a leak
// Compare the two snapshots → look for objects that grew in count

// Automated version — measure from console:
async function measureHeap() {
  // Force garbage collection (Chrome only, requires --js-flags="--expose-gc"):
  if (window.gc) window.gc();

  const usage = performance.memory;  // Chrome-only
  return {
    totalHeap: (usage.totalJSHeapSize / 1024 / 1024).toFixed(1) + 'MB',
    usedHeap:  (usage.usedJSHeapSize  / 1024 / 1024).toFixed(1) + 'MB',
    limit:     (usage.jsHeapSizeLimit / 1024 / 1024).toFixed(1) + 'MB',
  };
}
console.table(await measureHeap());
```

### Memory Leak Detection in Playwright

```typescript
test('Citation form does not leak memory after repeated open/close', async ({ page }) => {
  await page.goto('/citations');

  // Take baseline
  const baseline = await page.evaluate(() =>
    (performance as any).memory?.usedJSHeapSize ?? 0
  );

  // Repeat the operation 10 times
  for (let i = 0; i < 10; i++) {
    await page.locator('[data-automation-key="createNew"]').click();
    await expect(page.locator('#citationForm')).toBeVisible();
    await page.locator('[data-automation-key="closeForm"]').click();
    await expect(page.locator('#citationForm')).toBeHidden();
  }

  // Force GC via CDP (requires Chromium):
  const client = await page.context().newCDPSession(page);
  await client.send('HeapProfiler.collectGarbage');

  // Take final measurement
  const final = await page.evaluate(() =>
    (performance as any).memory?.usedJSHeapSize ?? 0
  );

  const growthMB = (final - baseline) / 1024 / 1024;
  console.log(`Memory growth after 10 iterations: ${growthMB.toFixed(1)}MB`);

  // Budget: heap should not grow by more than 5MB after 10 iterations
  expect(growthMB, `Memory grew by ${growthMB.toFixed(1)}MB — possible leak`).toBeLessThan(5);
});
```

---

## 10. CDP Direct Commands — The Power Beneath Playwright

Playwright communicates with the browser via the Chrome DevTools Protocol (CDP). You can send CDP commands directly for operations that Playwright doesn't expose as high-level APIs.

### Opening a CDP Session

```typescript
// Get a raw CDP session from Playwright:
const client = await page.context().newCDPSession(page);

// Now you can send ANY CDP command:
// Full reference: https://chromedevtools.github.io/devtools-protocol/
```

### Network Throttling — Simulate Slow Connections

```typescript
// Simulate a 3G mobile connection:
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,  // 1.6 Mbps
  uploadThroughput:   (750 * 1024) / 8,            // 750 Kbps
  latency: 300,                                    // 300ms RTT
});

// Test: does the app handle slow connections gracefully?
await page.goto('/citations');
await expect(page.locator('.ms-Spinner')).toBeVisible();  // loading spinner should appear
await expect(page.locator('.ms-DetailsList')).toBeVisible({ timeout: 30_000 });

// Reset to normal:
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: -1,  // unlimited
  uploadThroughput: -1,
  latency: 0,
});
```

### CSS/JS Coverage — Find Unused Code

```typescript
// Start collecting CSS and JS coverage:
await client.send('Profiler.enable');
await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
await client.send('CSS.startRuleUsageTracking');

await page.goto('/citations');
await page.waitForLoadState('networkidle');

// Get JS coverage:
const { result: jsCoverage } = await client.send('Profiler.takePreciseCoverage');
await client.send('Profiler.stopPreciseCoverage');

// Get CSS coverage:
const { ruleUsage: cssRules } = await client.send('CSS.stopRuleUsageTracking');

// Analyze:
const totalJS = jsCoverage.reduce((sum, script) => {
  const used = script.functions.reduce((fSum, fn) =>
    fSum + fn.ranges.reduce((rSum, r) => rSum + (r.endOffset - r.startOffset), 0), 0);
  return sum + used;
}, 0);
console.log(`JS bytes executed: ${(totalJS / 1024).toFixed(0)}KB`);

const usedCSS = cssRules.filter(r => r.used).length;
const totalCSS = cssRules.length;
console.log(`CSS rules: ${usedCSS}/${totalCSS} used (${((usedCSS/totalCSS)*100).toFixed(0)}%)`);
```

### Console Log Capture — Catch Browser Errors in Tests

```typescript
// Listen for ALL console messages from the browser:
const consoleLogs: string[] = [];
const consoleErrors: string[] = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
});

// Run your test...
await page.goto('/citations');
await page.locator('[data-automation-key="createNew"]').click();
// ...

// Assert: no unexpected console errors
const unexpectedErrors = consoleErrors.filter(e =>
  !e.includes('favicon.ico') &&          // ignore favicon 404
  !e.includes('ResizeObserver') &&        // ignore benign resize warning
  !e.includes('Third-party cookie')       // ignore Chrome warning
);

expect(unexpectedErrors, `Browser console had errors: ${unexpectedErrors.join('\n')}`).toHaveLength(0);
```

### CDP Command Reference for SDETs

| CDP Domain | Command | SDET Use Case |
|---|---|---|
| `Network.emulateNetworkConditions` | Throttle bandwidth/latency | Test loading states on slow connections |
| `HeapProfiler.collectGarbage` | Force garbage collection | Memory leak testing — clean up before measuring |
| `Profiler.startPreciseCoverage` | Track JS code coverage | Identify dead code, measure test coverage |
| `CSS.startRuleUsageTracking` | Track CSS rule usage | Find unused CSS, optimize bundle size |
| `Emulation.setGeolocationOverride` | Fake GPS coordinates | Test location-based features |
| `Emulation.setTimezoneOverride` | Fake timezone | Test timezone-dependent formatting |
| `Input.dispatchMouseEvent` | Raw mouse events | Test drag-and-drop, canvas interactions |
| `Page.captureScreenshot` | Screenshot with options | Visual regression with specific parameters |

---

## 📚 References & Further Reading

### Official Documentation — Playwright
- [Evaluating JavaScript — Playwright](https://playwright.dev/docs/evaluating) — `page.evaluate()` vs `page.addInitScript()` — when to use each
- [Page.evaluate() API](https://playwright.dev/docs/api/class-page#page-evaluate) — Full API reference with argument passing, return values, and serialisation rules

### Chrome DevTools Protocol
- [CDP Protocol Reference](https://chromedevtools.github.io/devtools-protocol/) — Full specification for every CDP domain (Network, Profiler, HeapProfiler, CSS, Emulation)
- [CDP Network Domain](https://chromedevtools.github.io/devtools-protocol/tot/Network/) — `emulateNetworkConditions`, request interception, and cache control
- [CDP Profiler Domain](https://chromedevtools.github.io/devtools-protocol/tot/Profiler/) — JS code coverage and CPU profiling

### MDN Web Docs — Browser APIs
- [Performance API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API) — Navigation timing, resource timing, and paint metrics
- [PerformanceObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) — Real-time monitoring of LCP, Long Tasks, and Layout Shifts
- [MutationObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — Watch for DOM changes (the two-phase render detection technique)
- [Console API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/console) — `console.table()`, `console.trace()`, and other utility methods

### Core Web Vitals
- [Web Vitals — web.dev](https://web.dev/articles/vitals) — Official guide to LCP, FID/INP, and CLS metrics used in Section 8's performance budgets

---

**Navigation**: [← Enterprise Locators](./02_Enterprise_Locators_XPath.md) | [Index](../00_INDEX.md) | [→ JS/TS for Automation](./04_JS_TS_For_Automation.md)
