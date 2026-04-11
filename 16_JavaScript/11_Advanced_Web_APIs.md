> **Navigation**: [< Previous](10_Web_Workers_ServiceWorkers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](../07_Modern_Java/Ch08_Collections_Internals.md)

# 🌐 Chapter 11 — Advanced Web APIs: The Browser's Hidden Powers

> **"The browser is an operating system. Beyond DOM manipulation, it has APIs for storage, networking, observation, geolocation, clipboard, notifications, and more. Senior devs know these APIs — they're what separate toy apps from production apps."**

---

## Table of Contents

1. [Intersection Observer — Visibility Detection](#1-intersection-observer--visibility-detection)
2. [Resize Observer — Element Size Changes](#2-resize-observer--element-size-changes)
3. [Mutation Observer — DOM Change Detection](#3-mutation-observer--dom-change-detection)
4. [Web Storage API — localStorage & sessionStorage](#4-web-storage-api--localstorage--sessionstorage)
5. [IndexedDB — Client-Side Database](#5-indexeddb--client-side-database)
6. [WebSocket — Real-Time Communication](#6-websocket--real-time-communication)
7. [Server-Sent Events — One-Way Streaming](#7-server-sent-events--one-way-streaming)
8. [Fetch API — Advanced Patterns](#8-fetch-api--advanced-patterns)
9. [Clipboard API — Copy/Paste Programmatically](#9-clipboard-api--copypaste-programmatically)
10. [Notification & Vibration API](#10-notification--vibration-api)
11. [Geolocation API](#11-geolocation-api)
12. [Broadcast Channel — Cross-Tab Communication](#12-broadcast-channel--cross-tab-communication)

---

## 1. Intersection Observer — Visibility Detection

```
  WHAT IT DOES:
  Efficiently detects when an element enters or exits the viewport.
  
  USE CASES:
  • Lazy loading images
  • Infinite scroll (load more when bottom visible)
  • Animate elements on scroll
  • Track ad impressions
  • Sticky header visibility detection
  
  WHY NOT scroll events?
  • scroll fires 100s of times/sec → performance killer
  • IntersectionObserver is async, batched, GPU-accelerated
```

```javascript
// Basic: Lazy load images
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;       // Load real image
      observer.unobserve(img);          // Stop watching
    }
  });
}, {
  rootMargin: '200px',  // Start loading 200px before visible
  threshold: 0           // Trigger as soon as 1px is visible
});

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});


// Infinite scroll trigger:
const sentinel = document.getElementById('load-more-trigger');
const scrollObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMoreItems();  // Fetch next page
  }
}, { threshold: 1.0 });  // 100% visible

scrollObserver.observe(sentinel);


// Animate on scroll:
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('visible', entry.isIntersecting);
  });
}, { threshold: 0.2 });  // 20% visible triggers animation
```

```jsx
// React hook (from Custom Hooks chapter):
function useIntersectionObserver(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options.threshold, options.rootMargin]);

  return isVisible;
}
```

---




## 2. Resize Observer — Element Size Changes

```
  WHAT IT DOES:
  Watches elements for size changes. NOT the same as window resize!
  
  USE CASES:
  • Responsive component that adapts to its container size
  • Chart/canvas that redraws when container resizes
  • Sidebar collapse detection
  • Container queries polyfill
```

```javascript
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    
    if (width < 400) {
      entry.target.classList.add('compact');
    } else {
      entry.target.classList.remove('compact');
    }
    
    console.log(`Element is now ${width}x${height}`);
  }
});

resizeObserver.observe(document.getElementById('chart-container'));

// IMPORTANT: Disconnect when done
// resizeObserver.disconnect();
```

```jsx
// React hook:
function useResizeObserver(ref) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}

// Usage:
function ResponsiveChart() {
  const ref = useRef(null);
  const { width, height } = useResizeObserver(ref);
  
  return (
    <div ref={ref}>
      <Chart width={width} height={height} data={data} />
    </div>
  );
}
```

---

## 3. Mutation Observer — DOM Change Detection

```
  WHAT IT DOES:
  Watches for DOM changes: child additions/removals, attribute changes,
  text content changes.
  
  USE CASES:
  • Third-party script detection (did an ad inject elements?)
  • Rich text editor change tracking
  • Auto-initialize components when added to DOM
  • Watch for theme/class changes
```

```javascript
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('Element added:', node.tagName);
          // Auto-initialize tooltips, etc.
          if (node.matches('[data-tooltip]')) {
            initTooltip(node);
          }
        }
      });
    }
    
    if (mutation.type === 'attributes') {
      console.log(`${mutation.attributeName} changed on`, mutation.target);
    }
  }
});

mutationObserver.observe(document.body, {
  childList: true,     // Watch for child additions/removals
  subtree: true,       // Watch ALL descendants, not just direct children
  attributes: true,    // Watch attribute changes
  attributeFilter: ['class', 'data-theme'],  // Only specific attributes
  characterData: true  // Watch text content changes
});

// Stop watching:
// mutationObserver.disconnect();
```

---

## 4. Web Storage API — localStorage & sessionStorage

```
  ┌──────────────────┬─────────────────────┬──────────────────────┐
  │                  │ localStorage         │ sessionStorage       │
  ├──────────────────┼─────────────────────┼──────────────────────┤
  │ Lifetime         │ Until manually      │ Until tab/window     │
  │                  │ cleared             │ closes               │
  │ Scope            │ Same origin (all    │ Same origin, SAME    │
  │                  │ tabs/windows)       │ tab only             │
  │ Size limit       │ ~5-10 MB            │ ~5-10 MB             │
  │ Sent to server?  │ No                  │ No                   │
  │ Sync/Async       │ Synchronous (blocks │ Synchronous          │
  │                  │ main thread!)       │                      │
  └──────────────────┴─────────────────────┴──────────────────────┘
```

```javascript
// Basic usage:
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');  // 'dark'
localStorage.removeItem('theme');
localStorage.clear();  // Remove ALL items

// Storing objects (MUST serialize):
const user = { name: 'Harsha', role: 'dev' };
localStorage.setItem('user', JSON.stringify(user));
const stored = JSON.parse(localStorage.getItem('user'));

// Storage event — detect changes from OTHER tabs:
window.addEventListener('storage', (e) => {
  console.log(`Key "${e.key}" changed from "${e.oldValue}" to "${e.newValue}"`);
  if (e.key === 'theme') {
    applyTheme(e.newValue);  // Sync theme across tabs!
  }
});
```

```
  ╔══════════════════════════════════════════════════╗
  ║  SECURITY WARNING:                               ║
  ║                                                   ║
  ║  NEVER store sensitive data in localStorage:      ║
  ║  • No JWTs or auth tokens                        ║
  ║  • No passwords or API keys                      ║
  ║  • No personal identifiable information (PII)    ║
  ║                                                   ║
  ║  WHY? Any JS on the page can read it (XSS risk). ║
  ║  Use httpOnly cookies for auth tokens instead.    ║
  ╚══════════════════════════════════════════════════╝
```

---

## 5. IndexedDB — Client-Side Database

```
  WHEN TO USE INDEXEDDB:
  • Need to store > 5MB of structured data
  • Need indexes and queries (not just key-value)
  • Offline-first apps with sync
  • Caching API responses with complex queries
  • Storing blobs (images, files)
  
  localStorage: Simple key-value, 5MB, synchronous
  IndexedDB:    Full database, 100s of MB, asynchronous
```

```javascript
// Open/create database:
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyAppDB', 1);  // name, version

    // Called when version increases or DB is new:
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store (like a table):
      const store = db.createObjectStore('products', { 
        keyPath: 'id',           // Primary key field
        autoIncrement: true 
      });
      
      // Create indexes (for searching):
      store.createIndex('category', 'category', { unique: false });
      store.createIndex('name', 'name', { unique: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// CRUD operations:
async function addProduct(product) {
  const db = await openDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  store.add(product);
  return tx.complete;
}

async function getProductsByCategory(category) {
  const db = await openDB();
  const tx = db.transaction('products', 'readonly');
  const store = tx.objectStore('products');
  const index = store.index('category');
  
  return new Promise((resolve) => {
    const request = index.getAll(category);
    request.onsuccess = () => resolve(request.result);
  });
}

// Usage:
await addProduct({ name: 'Laptop', category: 'electronics', price: 999 });
const electronics = await getProductsByCategory('electronics');
```

---

## 6. WebSocket — Real-Time Communication

```
  HTTP vs WebSocket:
  
  HTTP:       Client → Request → Server → Response → Done
              (new connection each time)
  
  WebSocket:  Client ←→ Server  (persistent bidirectional connection)
              Both sides can send messages at any time.
  
  USE CASES:
  • Chat applications
  • Live notifications
  • Real-time dashboards (stock prices, sports scores)
  • Collaborative editing (Google Docs)
  • Online gaming
  • Live location tracking
```

```javascript
// Client side:
const ws = new WebSocket('wss://api.example.com/ws');

ws.onopen = () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'prices' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  updateUI(data);
};

ws.onclose = (event) => {
  console.log(`Disconnected: ${event.code} ${event.reason}`);
  // Reconnect logic:
  if (event.code !== 1000) {  // 1000 = normal closure
    setTimeout(() => connectWebSocket(), 3000);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Send message:
ws.send(JSON.stringify({ type: 'chat', message: 'Hello!' }));

// Close connection:
ws.close(1000, 'User logged out');
```

```jsx
// React hook for WebSocket:
function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      setLastMessage(JSON.parse(event.data));
    };

    return () => ws.close();
  }, [url]);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { lastMessage, isConnected, sendMessage };
}
```

---

## 7. Server-Sent Events — One-Way Streaming

```
  WebSocket: Bidirectional (client ↔ server)
  SSE:       Server → Client only (one-way push)
  
  WHY USE SSE OVER WEBSOCKET?
  • Simpler (just HTTP!)
  • Auto-reconnect built-in
  • Works through firewalls/proxies
  • Perfect for: notifications, live feeds, progress updates
```

```javascript
// Client:
const eventSource = new EventSource('/api/notifications');

eventSource.onmessage = (event) => {
  console.log('Notification:', event.data);
};

// Named events:
eventSource.addEventListener('price-update', (event) => {
  const data = JSON.parse(event.data);
  updatePrice(data.symbol, data.price);
});

eventSource.addEventListener('alert', (event) => {
  showAlert(event.data);
});

eventSource.onerror = () => {
  console.log('Connection lost, auto-reconnecting...');
  // EventSource automatically reconnects!
};

// Close when done:
eventSource.close();
```

---



> 🔬 **Section Challenge — 7. Server-Sent Events — One-Way Streaming**
>
> **Challenge 1 (Reasoning):** `list.stream().filter().map().collect()` — at which point does data actually start flowing through the pipeline?
> <details><summary>Answer</summary>
>
> Not until `collect()` (or any terminal operation). `filter()` and `map()` are LAZY — they build a pipeline description but process nothing. When the terminal operation is called, the pipeline pulls elements through lazily: one element passes through the entire pipeline before the next is processed. This means: early termination with `findFirst()` is O(1) if the first element matches, not O(N).
> </details>
>
> **Challenge 2 (Bug Hunt):** You call `stream.filter(...).collect(...)` twice on the same stream. What happens?
> <details><summary>Answer</summary>
>
> `IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly.
> </details>
>

## 8. Fetch API — Advanced Patterns

```javascript
// Abort a request (timeout):
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('/api/data', {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
}


// Retry with exponential backoff:
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && attempt < maxRetries) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}


// Parallel requests:
const [users, products, orders] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json())
]);


// Stream response (large files):
const response = await fetch('/api/large-data');
const reader = response.body.getReader();
const decoder = new TextDecoder();
let result = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  result += decoder.decode(value, { stream: true });
  updateProgress(result.length / response.headers.get('Content-Length'));
}
```

---



## 9. Clipboard API — Copy/Paste Programmatically

```javascript
// Copy text:
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied!');
  } catch (err) {
    // Fallback for older browsers:
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Read clipboard (requires permission):
async function pasteFromClipboard() {
  const text = await navigator.clipboard.readText();
  return text;
}

// Copy rich content (HTML, images):
async function copyRichContent() {
  const blob = new Blob(['<b>Bold text</b>'], { type: 'text/html' });
  await navigator.clipboard.write([
    new ClipboardItem({ 'text/html': blob })
  ]);
}
```

---

## 10. Notification & Vibration API

```javascript
// Request permission first:
async function enableNotifications() {
  const permission = await Notification.requestPermission();
  // 'granted', 'denied', or 'default'
  return permission === 'granted';
}

// Show notification:
function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'message',       // Replace previous notification with same tag
      requireInteraction: true  // Don't auto-dismiss
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Vibration (mobile):
navigator.vibrate(200);           // Vibrate 200ms
navigator.vibrate([100, 50, 100]); // Pattern: vibrate, pause, vibrate
navigator.vibrate(0);             // Stop vibration
```

---

## 11. Geolocation API

```javascript
// Get current position (one-time):
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('Lat:', position.coords.latitude);
    console.log('Lng:', position.coords.longitude);
    console.log('Accuracy:', position.coords.accuracy, 'meters');
  },
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log('User denied geolocation');
        break;
      case error.POSITION_UNAVAILABLE:
        console.log('Location unavailable');
        break;
      case error.TIMEOUT:
        console.log('Request timed out');
        break;
    }
  },
  {
    enableHighAccuracy: true,  // GPS (slower, more battery)
    timeout: 10000,            // Max wait time
    maximumAge: 60000          // Accept cached position up to 1min old
  }
);

// Watch position (continuous tracking):
const watchId = navigator.geolocation.watchPosition(
  (position) => updateMap(position.coords),
  (error) => handleError(error),
  { enableHighAccuracy: true }
);

// Stop tracking:
navigator.geolocation.clearWatch(watchId);
```

---

## 12. Broadcast Channel — Cross-Tab Communication

```
  PROBLEM: User logs out in one tab. Other tabs still show as logged in.
  SOLUTION: Broadcast Channel sends messages between same-origin tabs.
```

```javascript
// Create channel (same name = same channel):
const authChannel = new BroadcastChannel('auth');

// Tab 1 — Send logout:
function logout() {
  clearSession();
  authChannel.postMessage({ type: 'LOGOUT' });
  window.location.href = '/login';
}

// Tab 2 — Listen for logout:
authChannel.onmessage = (event) => {
  if (event.data.type === 'LOGOUT') {
    clearSession();
    window.location.href = '/login';
  }
};

// Theme sync across tabs:
const themeChannel = new BroadcastChannel('theme');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeChannel.postMessage({ theme });
}

themeChannel.onmessage = (event) => {
  document.documentElement.setAttribute('data-theme', event.data.theme);
};

// Close when component unmounts:
// authChannel.close();
```

```
  ╔════════════════════════════════════════════════════════════╗
  ║  API COMPARISON TABLE:                                     ║
  ║                                                            ║
  ║  ┌──────────────────┬───────────────┬───────────────────┐ ║
  ║  │ Need             │ API           │ Alternative       │ ║
  ║  ├──────────────────┼───────────────┼───────────────────┤ ║
  ║  │ Element visible? │ Intersection  │ scroll events     │ ║
  ║  │ Element resized? │ Resize        │ window.onresize   │ ║
  ║  │ DOM changed?     │ Mutation      │ DOM events        │ ║
  ║  │ Store <5MB       │ localStorage  │ cookies           │ ║
  ║  │ Store >5MB       │ IndexedDB     │ Cache API         │ ║
  ║  │ Two-way realtime │ WebSocket     │ polling           │ ║
  ║  │ Server push      │ SSE           │ long polling      │ ║
  ║  │ Cross-tab sync   │ Broadcast Ch. │ storage event     │ ║
  ║  │ Copy/paste       │ Clipboard API │ execCommand       │ ║
  ║  │ Location         │ Geolocation   │ IP-based lookup   │ ║
  ║  └──────────────────┴───────────────┴───────────────────┘ ║
  ╚════════════════════════════════════════════════════════════╝
```

---

> **Next Chapter**: [Java Collections Internals →](../07_Modern_Java/Ch08_Collections_Internals.md)

---

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

