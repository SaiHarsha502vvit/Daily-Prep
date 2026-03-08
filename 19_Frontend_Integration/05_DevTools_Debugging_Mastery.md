> **Navigation**: [< Previous](02_Frontend_Debugging.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Web_Performance_CoreWebVitals.md)

# 🔍 Chapter 5 — DevTools Debugging Mastery: Beyond console.log

> **"The developer who masters DevTools debugs in 5 minutes what others spend 2 hours on. Every tab in DevTools exists because someone needed a specific superpower. Learn them all."**

---

## Table of Contents

1. [Elements Tab — Live DOM Surgery](#1-elements-tab--live-dom-surgery)
2. [Console — Advanced Techniques](#2-console--advanced-techniques)
3. [Sources Tab — Breakpoint Debugging Like a Pro](#3-sources-tab--breakpoint-debugging-like-a-pro)
4. [Network Tab — Request Waterfall Analysis](#4-network-tab--request-waterfall-analysis)
5. [Performance Tab — Finding What Makes Your App Slow](#5-performance-tab--finding-what-makes-your-app-slow)
6. [Memory Tab — Hunting Memory Leaks](#6-memory-tab--hunting-memory-leaks)
7. [Application Tab — Storage, Service Workers, Cache](#7-application-tab--storage-service-workers-cache)
8. [Lighthouse — Automated Audits](#8-lighthouse--automated-audits)
9. [Debugging React Apps Specifically](#9-debugging-react-apps-specifically)
10. [Mobile Debugging & Device Emulation](#10-mobile-debugging--device-emulation)
11. [Common Debugging Scenarios — Cookbook](#11-common-debugging-scenarios--cookbook)

---

## 1. Elements Tab — Live DOM Surgery

```
  The Elements tab shows the LIVE DOM (not your source HTML).
  Changes you make here are immediate but NOT saved to files.
  
  
  KEY SHORTCUTS:
  ══════════════
  
  Ctrl+Shift+C (Cmd+Shift+C)  → Inspect element mode (click to select)
  F2 on selected element       → Edit as HTML
  Delete                       → Remove element
  Ctrl+Z                       → Undo DOM change
  H                            → Toggle visibility (display: none)
  
  
  STYLES PANEL (right side):
  ══════════════════════════
  
  ┌─ Styles ──────────────────────────────────────────────┐
  │                                                        │
  │  element.style {                                       │
  │    color: red;           ← Inline styles (highest)    │
  │  }                                                     │
  │                                                        │
  │  .button.primary {       ← Your CSS rules             │
  │    background: #3b82f6;  ← (stylesheet:line number)   │
  │    color: white;                                       │
  │    ̶p̶a̶d̶d̶i̶n̶g̶:̶ ̶1̶r̶e̶m̶;̶    ← Strikethrough = overridden    │
  │  }                                                     │
  │                                                        │
  │  .button {               ← Less specific rule         │
  │    padding: 0.5rem;      ← This one wins for padding  │
  │    border: none;                                       │
  │  }                                                     │
  │                                                        │
  │  user agent stylesheet   ← Browser defaults            │
  │    display: inline-block;                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
  
  Click any value to edit live. Click empty area to add new property.
```

### Computed Tab — See Final Values

```
  COMPUTED panel shows the FINAL resolved value for every property.
  
  ┌─ Computed ────────────────────────────────────────────┐
  │                                                        │
  │  ┌───────────────────────────────────────┐             │
  │  │          margin: 16px                  │             │
  │  │  ┌─────────────────────────────┐      │             │
  │  │  │      border: 1px            │      │             │
  │  │  │  ┌───────────────────┐      │      │             │
  │  │  │  │    padding: 8px   │      │      │             │
  │  │  │  │  ┌───────────┐   │      │      │             │
  │  │  │  │  │ 120 x 40  │   │      │      │  ← Box Model│
  │  │  │  │  └───────────┘   │      │      │    visual!   │
  │  │  │  └───────────────────┘      │      │             │
  │  │  └─────────────────────────────┘      │             │
  │  └───────────────────────────────────────┘             │
  │                                                        │
  │  color: rgb(255, 255, 255)  → from .button.primary    │
  │  display: flex              → from .container          │
  │  font-size: 16px            → inherited from body      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
  
  Click the arrow next to any property to see which rule set it.
```

### Force Element State

```
  Right-click element → Force state:
  
  ✅ :hover    → See hover styles without hovering
  ✅ :active   → See click styles
  ✅ :focus    → See focus styles
  ✅ :visited  → See visited link styles
  ✅ :focus-within → See focus-within states
  
  ESSENTIAL for debugging hover menus or focus states
  that disappear when you move your mouse to DevTools!
```

---

## 2. Console — Advanced Techniques

```javascript
// ═══════════════════════════════════════════
// BEYOND console.log()
// ═══════════════════════════════════════════

// TABLE — Display arrays/objects as sortable tables:
console.table([
  { name: 'Alice', age: 30, role: 'dev' },
  { name: 'Bob', age: 25, role: 'design' },
  { name: 'Carol', age: 35, role: 'pm' }
]);
// Shows a beautiful sortable table! Click headers to sort.

// GROUP — Collapsible groups:
console.group('User Authentication');
console.log('Token valid:', true);
console.log('User:', 'alice@example.com');
console.groupEnd();

// TIME — Measure execution:
console.time('dataProcessing');
processLargeDataset();
console.timeEnd('dataProcessing'); // → dataProcessing: 142.5ms

// COUNT — Track call frequency:
function handleClick(button) {
  console.count(button); // → "save: 1", "save: 2", "cancel: 1"
}

// ASSERT — Log only when condition is false:
console.assert(user.age >= 18, 'User is underage!', user);

// TRACE — Show call stack:
function deepFunction() {
  console.trace('How did I get here?');
}

// STYLED LOGS:
console.log(
  '%cWARNING%c This operation is expensive',
  'background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 4px;',
  'color: #ff6b6b;'
);
```

### Live Expressions & Console Utilities

```javascript
// LIVE EXPRESSIONS (eye icon in Console toolbar):
// Type an expression → it updates in real-time
// Example: document.querySelectorAll('*').length
// Shows live DOM node count as you browse

// CONSOLE UTILITIES (only work in Console, not in code):

$0    // Currently selected element in Elements tab
$1    // Previously selected element
$$('div.card')  // Same as document.querySelectorAll('div.card')

// Copy anything to clipboard:
copy($0.outerHTML)
copy(JSON.stringify(data, null, 2))

// Monitor function calls:
monitor(fetchUserData)
// → "function fetchUserData called with arguments: [123]"
unmonitor(fetchUserData) // Stop monitoring

// Monitor events on an element:
monitorEvents($0, 'click')     // Log all clicks on selected element
monitorEvents($0, ['click', 'keydown'])
unmonitorEvents($0)

// Get event listeners:
getEventListeners($0)
// → { click: [{listener: f, useCapture: false}], ... }
```

---

## 3. Sources Tab — Breakpoint Debugging Like a Pro

```
  TYPES OF BREAKPOINTS:
  ═════════════════════
  
  1. LINE BREAKPOINT — Click line number (blue marker)
     Pauses execution at that exact line.
  
  2. CONDITIONAL BREAKPOINT — Right-click line → "Add conditional"
     Example: userId === 'user123'
     Only pauses when condition is true!
  
  3. LOGPOINT — Right-click line → "Add logpoint"
     Example: "User data:", userData
     Logs WITHOUT pausing — no need to add console.log to code!
  
  4. DOM BREAKPOINT (in Elements tab):
     Right-click element → "Break on..."
     • Subtree modifications (child added/removed)
     • Attribute modifications (class/style changed)
     • Node removal
  
  5. XHR/FETCH BREAKPOINT:
     Sources → XHR/fetch Breakpoints → Add
     Enter URL substring: "/api/users"
     Pauses whenever a matching request is made.
  
  6. EVENT LISTENER BREAKPOINT:
     Sources → Event Listener Breakpoints
     Check "Mouse → click" → pauses on ALL click handlers
```

### Debugging Execution Controls

```
  When paused at a breakpoint:
  
  ┌─────────────────────────────────────────────────────┐
  │  ▶ Resume (F8)      — Continue until next breakpoint│
  │  ⤵ Step Over (F10)  — Execute line, move to next    │
  │  ⤴ Step Into (F11)  — Enter the function call       │
  │  ⤶ Step Out (Shift+F11) — Finish current function   │
  │  ⏭ Step (F9)        — Next statement (micro-step)   │
  └─────────────────────────────────────────────────────┘
  
  SCOPE PANEL (while paused):
  ═══════════════════════════
  Shows all variables in current scope:
  
  Local:
    item = { id: 5, name: "Widget" }
    index = 3
    total = 142.50
  Closure:
    callback = ƒ (data)
    config = { apiUrl: "..." }
  Global:
    window, document, ...
  
  WATCH PANEL:
  ════════════
  Add expressions to watch:
  + items.filter(i => i.active).length   → 7
  + currentUser?.role                    → "admin"
  + performance.now()                    → 3421.50
```

### Source Maps — Debug Original Code

```
  Without source maps:           With source maps:
  ═══════════════════           ═════════════════
  
  // bundle.min.js              // src/components/UserCard.tsx
  var a=function(b){            const UserCard = ({ user }) => {
  return b.n+" "+b.l;            return user.name + " " + user.lastName;
  };                            };
  
  Source maps connect minified/bundled code back to your original files.
  Built automatically by webpack/vite/esbuild in dev mode.
  
  In Sources tab: you see your ORIGINAL files, set breakpoints there!
```

---

## 4. Network Tab — Request Waterfall Analysis

```
  ┌─ Network Tab ────────────────────────────────────────────────┐
  │                                                               │
  │  Filter: All | Fetch/XHR | JS | CSS | Img | Media | Font    │
  │  ☐ Preserve log  ☐ Disable cache  ▼ No throttling           │
  │                                                               │
  │  Name        Status  Type    Size   Time    Waterfall        │
  │  ─────────────────────────────────────────────────────────   │
  │  index.html  200     doc     12KB   120ms   ██               │
  │  main.css    200     style   45KB   80ms      ████           │
  │  app.js      200     script  200KB  150ms     ██████         │
  │  api/users   200     fetch   2KB    340ms         ████████   │
  │  logo.svg    200     image   3KB    60ms           ██        │
  │  avatar.jpg  200     image   15KB   190ms          ██████    │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
  
  
  WATERFALL COLOR CODING:
  ═══════════════════════
  
  ┌────────────────────────────────────────────────────────────┐
  │  █ DNS Lookup (green)     — Resolving domain name          │
  │  █ Initial Connection     — TCP + TLS handshake (orange)   │
  │  █ TTFB (green)           — Waiting for server response    │
  │  █ Content Download (blue) — Downloading response body     │
  └────────────────────────────────────────────────────────────┘
  
  If TTFB is long → server is slow (optimize backend)
  If Download is long → response is large (compress/reduce)
  If DNS is long → preconnect to that domain
```

### Network Tab Power Features

```
  THROTTLE NETWORK — Test slow connections:
  ═════════════════════════════════════════
  
  ▼ No throttling
    Fast 3G (562 kbps down, 150ms latency)
    Slow 3G (50 kbps down, 2000ms latency)
    Offline
  
  BLOCK REQUESTS — Test failure handling:
  ═══════════════════════════════════════
  Right-click request → "Block request URL"
  Or: Network conditions → Request blocking → Add pattern
  
  Pattern: *api/users* → blocks all matching requests
  Does your app show a proper error state? or crash?
  
  COPY REQUEST — Export for debugging:
  ════════════════════════════════════
  Right-click request → Copy:
  • Copy as cURL    → paste into terminal to reproduce
  • Copy as fetch   → paste into Console to replay
  • Copy headers    → share with backend team
  
  REPLAY REQUEST:
  ═══════════════
  Right-click → "Replay XHR" → sends the same request again
```

---

## 5. Performance Tab — Finding What Makes Your App Slow

```
  HOW TO PROFILE:
  ═══════════════
  
  1. Open Performance tab
  2. Click Record (⏺)
  3. Perform the slow action (scroll, click, navigate)
  4. Click Stop
  5. Analyze the flame chart
  
  
  THE FLAME CHART:
  ════════════════
  
  Time →  0ms      100ms     200ms     300ms     400ms
  ┌──────────────────────────────────────────────────────┐
  │ Task ████████████████████████████████████████████     │ ← Long Task!
  │  ├ Event: click ███████████████████████████████       │
  │  │  ├ handleClick ████████████████████████            │
  │  │  │  ├ fetchData ██████████████████                 │
  │  │  │  │  ├ JSON.parse ████████                       │ ← expensive!
  │  │  │  │  └ processItems ██████                       │
  │  │  │  └ setState ████                                │
  │  │  └ React render ████████                           │
  │  │     ├ ProductList ████                             │
  │  │     └ Sidebar ████                                 │
  │  └ Style + Layout ██████                              │
  └──────────────────────────────────────────────────────┘
  
  READING THE CHART:
  • Width = time spent (wider = slower)
  • Red triangle top = Long Task (>50ms)
  • Drill into the widest bars to find bottlenecks
  • Yellow = JavaScript
  • Purple = Layout/Style
  • Green = Paint/Composite
```

### Key Metrics in Performance Tab

```
  SUMMARY VIEW (at bottom):
  ═════════════════════════
  
  Loading:    120ms  ███
  Scripting:  450ms  ████████████████
  Rendering:  80ms   ██
  Painting:   30ms   █
  System:     40ms   █
  Idle:       280ms  ████████
  
  → Scripting dominates? Your JS is the bottleneck.
  → Rendering high? Too many layout recalculations.
  
  
  FRAMES VIEW:
  ════════════
  
  Each green bar = one frame (ideally 16.67ms at 60fps)
  Red bar = dropped frame (took too long)
  
  ┌ Frames ──────────────────────────────────────────┐
  │ █ █ █ █ █ ▓ ▓ ▓ █ █ █ █ █ █ ▓ █ █ █ █ █ █ █   │
  │ ↑ normal   ↑↑↑ dropped frames (red/yellow)       │
  └──────────────────────────────────────────────────┘
```

---

## 6. Memory Tab — Hunting Memory Leaks

```
  MEMORY LEAK SYMPTOMS:
  ═════════════════════
  
  • App gets slower over time
  • Tab memory keeps growing (check Task Manager: Shift+Esc in Chrome)
  • Page eventually crashes with "Aw, Snap!"
  
  
  THREE TOOLS IN MEMORY TAB:
  ══════════════════════════
  
  1. HEAP SNAPSHOT — "Where is memory being used RIGHT NOW?"
     Take snapshot → See all objects, their sizes, and references.
  
  2. ALLOCATION TIMELINE — "What's allocating memory OVER TIME?"
     Start recording → interact with app → See blue bars (allocations).
  
  3. ALLOCATION SAMPLING — Lightweight profiling for production.
```

### How to Find a Memory Leak

```
  THE 3-SNAPSHOT TECHNIQUE:
  ═════════════════════════
  
  Step 1: Navigate to the page → Take Snapshot 1 (baseline)
  Step 2: Do the action you suspect leaks (e.g., open/close modal 10 times)
  Step 3: Force garbage collection (🗑 icon in Memory tab)
  Step 4: Take Snapshot 2
  Step 5: Compare Snapshot 1 vs 2
  
  In Snapshot 2, select "Objects allocated between Snapshot 1 and 2"
  
  If objects from opened-then-closed modals STILL exist → LEAK!
  
  
  COMMON MEMORY LEAK PATTERNS:
  ════════════════════════════
  
  1. Event listeners not removed:
     // LEAK:
     useEffect(() => {
       window.addEventListener('scroll', handleScroll);
       // Missing cleanup! Listener stays after unmount
     }, []);
     
     // FIX:
     useEffect(() => {
       window.addEventListener('scroll', handleScroll);
       return () => window.removeEventListener('scroll', handleScroll);
     }, []);
  
  2. setInterval not cleared:
     // LEAK:
     useEffect(() => {
       setInterval(fetchUpdates, 5000);
       // Interval runs FOREVER even after unmount
     }, []);
     
     // FIX:
     useEffect(() => {
       const id = setInterval(fetchUpdates, 5000);
       return () => clearInterval(id);
     }, []);
  
  3. Closures holding references:
     // LEAK: 
     function setup() {
       const hugeData = loadMassiveDataset(); // 50MB
       return function handler() {
         // handler's closure holds reference to hugeData
         // even if handler only uses hugeData.length
         console.log(hugeData.length);
       };
     }
     
     // FIX: Extract only what you need
     function setup() {
       const hugeData = loadMassiveDataset();
       const length = hugeData.length; // Copy the value
       return function handler() {
         console.log(length); // Closure only holds the number
       };
     }
  
  4. Detached DOM nodes:
     const elements = [];
     function createRow() {
       const row = document.createElement('tr');
       elements.push(row);  // Array holds reference even if removed from DOM
       table.appendChild(row);
     }
     function clearTable() {
       table.innerHTML = '';  // Removed from DOM but still in elements array!
     }
```

---

## 7. Application Tab — Storage, Service Workers, Cache

```
  APPLICATION TAB SECTIONS:
  ═════════════════════════
  
  Storage:
  ├── Local Storage      → Key-value pairs (persistent)
  │   └── Click to view/edit/delete entries
  ├── Session Storage    → Key-value pairs (per tab, cleared on close)
  ├── IndexedDB         → Full database browser (inspect tables/records)
  ├── Cookies           → View all cookies, edit values, check flags
  │   └── HttpOnly? Secure? SameSite? Expiry?
  └── Cache Storage     → Service worker caches (inspect cached responses)
  
  Service Workers:
  ├── See registered SWs, their status (activated/waiting)
  ├── Push test button (send test push notification)
  ├── Sync test button (trigger background sync)
  ├── Update on reload checkbox
  └── Unregister button
  
  
  COOKIE DEBUGGING:
  ═════════════════
  
  ┌────────────┬────────────────────────────────────────┐
  │ Column     │ What to check                          │
  ├────────────┼────────────────────────────────────────┤
  │ Name       │ Correct token/session name?            │
  │ Value      │ JWT? Decode at jwt.io to inspect       │
  │ Domain     │ Matches your domain?                   │
  │ Path       │ / for all paths, or specific?          │
  │ Expires    │ When does it expire?                   │
  │ HttpOnly   │ ✅ means JS can't read it (secure!)    │
  │ Secure     │ ✅ means HTTPS only (should be true!)  │
  │ SameSite   │ Strict/Lax/None for CSRF protection   │
  └────────────┴────────────────────────────────────────┘
```

---

## 8. Lighthouse — Automated Audits

```
  HOW TO RUN:
  ═══════════
  
  1. Open Lighthouse tab (or Ctrl+Shift+I → Lighthouse)
  2. Select categories: Performance, Accessibility, Best Practices, SEO
  3. Select device: Mobile / Desktop
  4. Click "Analyze page load"
  
  
  PERFORMANCE METRICS:
  ════════════════════
  
  ┌── Score Breakdown ──────────────────────────────────────────┐
  │                                                              │
  │  FCP (First Contentful Paint)     1.2s  ← first text/image │
  │  LCP (Largest Contentful Paint)   2.3s  ← hero image/text  │
  │  TBT (Total Blocking Time)       150ms  ← main thread busy │
  │  CLS (Cumulative Layout Shift)   0.05   ← visual stability │
  │  SI (Speed Index)                1.8s   ← how fast content  │
  │                                          appears visible    │
  │                                                              │
  │  Performance Score: 87/100                                   │
  │                                                              │
  │  OPPORTUNITIES:                                              │
  │  • Reduce unused JavaScript (-200KB, save 1.2s)             │
  │  • Serve images in WebP format (save 340KB)                 │
  │  • Eliminate render-blocking CSS (save 0.5s)                │
  │                                                              │
  │  DIAGNOSTICS:                                                │
  │  • DOM size: 1,423 elements (try to keep <1,500)            │
  │  • Main thread work: 3.2s                                   │
  │  • JavaScript execution: 1.8s                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
  
  
  ACCESSIBILITY AUDIT:
  ════════════════════
  
  ✅ Image elements have alt attributes
  ❌ Background and foreground colors do not have sufficient contrast ratio
  ❌ Form elements do not have associated labels
  ❌ Links do not have discernible name
  ✅ Document has a main landmark
  ❌ Heading levels skip from h1 to h4
```

---

## 9. Debugging React Apps Specifically

```
  REACT DEVTOOLS EXTENSION (separate install):
  ═════════════════════════════════════════════
  
  Components Tab:
  ├── View component tree (like Elements but for React)
  ├── Inspect props and state of any component
  ├── Edit state/props LIVE (test different values)
  ├── See which hooks are used (useState, useEffect, etc.)
  └── Search for components by name
  
  Profiler Tab:
  ├── Record a session → See which components re-rendered
  ├── Flame chart shows render time per component
  ├── "Why did this render?" for each component
  │   → Props changed? State changed? Parent re-rendered?
  └── Ranked chart → Components sorted by render time
  
  
  SETTINGS (gear icon):
  ═══════════════════════
  ☑ Highlight updates when components render
    → Yellow/green flash around elements that re-render
    → INSTANTLY see unnecessary re-renders!
  
  
  USEFUL DEBUGGING PATTERN:
  ═════════════════════════
  
  // Why is my component re-rendering?
  // Add this hook temporarily:
  function useWhyDidYouRender(name, props) {
    const previousProps = useRef(props);
    
    useEffect(() => {
      const changes = {};
      Object.keys(props).forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changes[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        console.log(`[${name}] Re-rendered because:`, changes);
      }
      
      previousProps.current = props;
    });
  }
  
  // Usage: 
  function ProductList({ items, filter, sort }) {
    useWhyDidYouRender('ProductList', { items, filter, sort });
    // ...
  }
```

---

## 10. Mobile Debugging & Device Emulation

```
  DEVICE MODE (Ctrl+Shift+M):
  ════════════════════════════
  
  Toggle device toolbar to emulate mobile devices:
  
  ┌── Device Toolbar ────────────────────────────────────┐
  │  ▼ iPhone 14 Pro    │ 393 x 852  │ 3x │ Rotate     │
  │                                                       │
  │  Features:                                            │
  │  • Preset device dimensions (iPhone, Pixel, iPad)    │
  │  • Custom dimensions (any width x height)            │
  │  • DPR (Device Pixel Ratio) - 1x, 2x, 3x           │
  │  • Throttle CPU (4x/6x slowdown)                    │
  │  • Throttle network (3G, offline)                    │
  │  • Touch simulation (touch events instead of mouse)  │
  │  • Media query visualization (see breakpoint bars)   │
  └───────────────────────────────────────────────────────┘
  
  
  REMOTE DEBUGGING (real device):
  ═══════════════════════════════
  
  Android:
  1. Enable USB debugging on phone
  2. Connect via USB
  3. Chrome → chrome://inspect → find your device
  4. Click "Inspect" → full DevTools for mobile browser
  
  iOS:
  1. Enable Web Inspector (Settings → Safari → Advanced)
  2. Connect via USB to Mac
  3. Safari → Develop → [device name] → [page]
```

---

## 11. Common Debugging Scenarios — Cookbook

### Scenario 1: "Why is this element's style wrong?"

```
  1. Right-click element → Inspect
  2. Check Styles panel:
     • Is the rule being applied? (not grayed out?)
     • Is it being overridden? (strikethrough?)
     • Check specificity: inline > #id > .class > element
  3. Check Computed panel:
     • What's the FINAL value?
     • Click arrow → which rule set it?
  4. Look for !important conflicts
  5. Check for inherited styles from parent
```

### Scenario 2: "An API call is failing"

```
  1. Network tab → filter by Fetch/XHR
  2. Find the failed request (red = error)
  3. Click request → Headers tab:
     • Correct URL? Method? Headers?
     • Authorization token present?
  4. Click Response tab:
     • What error did the server return?
     • Is it valid JSON?
  5. Click Timing tab:
     • Where is the delay? TTFB? Download?
  6. Right-click → Copy as cURL → test in terminal
```

### Scenario 3: "The page is janky/slow when scrolling"

```
  1. Performance tab → Record while scrolling
  2. Look for:
     • Red bars in Frames (dropped frames)
     • Long yellow bars in Main (JS blocking)
     • Purple bars (Layout thrashing)
  3. Enable Rendering tab (Esc → Rendering):
     ☑ Paint flashing (green = areas being repainted)
     ☑ Layout shift regions (blue = layout shifts)
     ☑ Scrolling performance issues (highlights problem elements)
  4. Check for:
     • Images without width/height (cause CLS)
     • No will-change on animated elements
     • Event handlers without passive: true on scroll
```

### Scenario 4: "Where is this event handler defined?"

```
  1. Elements tab → select the element
  2. Event Listeners panel (sidebar):
     ┌── Event Listeners ──────────────────────────────┐
     │  click                                           │
     │    └ button.submit-btn                           │
     │      handler: ƒ handleSubmit()                  │
     │      filename.js:142  ← CLICK to jump to code  │
     │      useCapture: false                          │
     │      passive: false                             │
     │      once: false                                │
     └─────────────────────────────────────────────────┘
  3. Uncheck "Ancestors" to see only THIS element's listeners
  4. Click "Remove" to test what happens without the handler
```

---

> **Next Chapter**: [Web Performance & Core Web Vitals →](06_Web_Performance_CoreWebVitals.md)
