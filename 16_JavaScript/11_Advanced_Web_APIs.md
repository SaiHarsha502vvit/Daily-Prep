**Navigation**: [< Previous](10_Web_Workers_ServiceWorkers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](12_V8_Engine_Internals.md)

# 🌐 Chapter 11 — Advanced Web APIs: The Browser's Hidden Powers

**"The browser is an operating system. Beyond DOM manipulation, it has APIs for storage, networking, observation, geolocation, clipboard, notifications, and more. Senior devs know these APIs — they're what separate toy apps from production apps."**

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

> **Why IntersectionObserver is cheap where scroll-event polling is
> expensive — it's not a faster version of the same technique, it's a
> completely different source of truth.** A `scroll` listener has to
> run YOUR JavaScript on the main thread, synchronously, up to
> hundreds of times per second, and inside that handler you'd
> typically call something like `getBoundingClientRect()` — exactly
> the kind of layout-property read [Chapter 9, Section 10](09_Browser_Internals_Rendering.md#10-reflow-vs-repaint--what-triggers-what)
> showed forces a synchronous reflow. IntersectionObserver instead
> piggybacks on work the browser's own **Compositor** is already doing
> every frame ([Chapter 9, Section 7](09_Browser_Internals_Rendering.md#7-compositing--gpu-layers)) —
> it checks intersection as part of that existing pipeline, off the
> main thread, and only wakes your callback when the answer actually
> changes (crosses a threshold), instead of on every single frame
> regardless of whether anything relevant happened.

```
  USE CASES:
  • Lazy loading images
  • Infinite scroll (load more when bottom visible)
  • Animate elements on scroll
  • Track ad impressions
  • Sticky header visibility detection
```

```javascript
// Basic: Lazy load images
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src; // Load real image
        observer.unobserve(img); // Stop watching
      }
    });
  },
  {
    rootMargin: "200px", // Start loading 200px before visible
    threshold: 0, // Trigger as soon as 1px is visible
  },
);

document.querySelectorAll("img[data-src]").forEach((img) => {
  observer.observe(img);
});

// Infinite scroll trigger:
const sentinel = document.getElementById("load-more-trigger");
const scrollObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadMoreItems(); // Fetch next page
    }
  },
  { threshold: 1.0 },
); // 100% visible

scrollObserver.observe(sentinel);

// Animate on scroll:
const animObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  },
  { threshold: 0.2 },
); // 20% visible triggers animation
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

> **Why "NOT the same as window resize" — an element's box can change
> for reasons that have nothing to do with the window.** `window`'s
> `resize` event fires only when the viewport itself changes — the
> user resizing the browser window. But a specific element can change
> size while the window stays fixed: a sibling sidebar collapses and
> the flex/grid layout gives this element more space, a web font
> finishes loading and text reflows wider, a parent's `display`
> toggles. `window.onresize` has no way to notice any of that — it
> only ever fires on the ONE thing it watches. `ResizeObserver`
> instead watches the element's own computed box directly, so it
> fires for every actual cause of that specific element's size
> changing, window-driven or not:
```
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
      entry.target.classList.add("compact");
    } else {
      entry.target.classList.remove("compact");
    }

    console.log(`Element is now ${width}x${height}`);
  }
});

resizeObserver.observe(document.getElementById("chart-container"));

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
        height: entry.contentRect.height,
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

> **Why this is a microtask-batched replacement for something that
> used to exist as synchronous DOM events — and why that predecessor
> had to be deprecated.** Browsers once had "Mutation Events" that
> fired an event immediately, synchronously, for every single DOM
> change — the instant a node was added, `DOMNodeInserted` fired right
> there, mid-mutation. That's a re-entrancy trap: if the handler
> itself mutated the DOM (very common — auto-initializing a component
> often does exactly that), it would trigger ANOTHER synchronous
> event, which could trigger another, nesting the call stack deeper
> with every change and collapsing performance on anything but tiny
> pages. `MutationObserver` fixes this by never running synchronously
> inside the mutation at all — it collects every change that happens
> during the current synchronous block of code into one array, and
> only delivers them as a single batched callback once that
> synchronous work finishes (a microtask, [Chapter 4](04_JS_Async_Promises.md)'s
> queue) — a component you initialize inside that callback can safely
> mutate the DOM again without re-entering itself:
```
  USE CASES:
  • Third-party script detection (did an ad inject elements?)
  • Rich text editor change tracking
  • Auto-initialize components when added to DOM
  • Watch for theme/class changes
```

```javascript
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log("Element added:", node.tagName);
          // Auto-initialize tooltips, etc.
          if (node.matches("[data-tooltip]")) {
            initTooltip(node);
          }
        }
      });
    }

    if (mutation.type === "attributes") {
      console.log(`${mutation.attributeName} changed on`, mutation.target);
    }
  }
});

mutationObserver.observe(document.body, {
  childList: true, // Watch for child additions/removals
  subtree: true, // Watch ALL descendants, not just direct children
  attributes: true, // Watch attribute changes
  attributeFilter: ["class", "data-theme"], // Only specific attributes
  characterData: true, // Watch text content changes
});

// Stop watching:
// mutationObserver.disconnect();
```

---

## 4. Web Storage API — localStorage & sessionStorage

| | `localStorage` | `sessionStorage` |
|---|---|---|
| Lifetime | Until manually cleared | Until tab/window closes |
| Scope | Same origin, ALL tabs/windows | Same origin, SAME tab only |
| Size limit | ~5-10 MB | ~5-10 MB |
| Sent to server? | No | No |
| Sync/Async | Synchronous | Synchronous |

> **Why "synchronous" is flagged as a real cost, not a neutral
> implementation detail.** `localStorage.setItem` and `getItem` run to
> completion before your next line of JS executes — there's no
> callback, no `await`, because the call itself blocks. That's fine
> for a handful of small reads, but [Chapter 10, Section 1](10_Web_Workers_ServiceWorkers.md#1-why-we-need-workers--the-main-thread-problem)
> already established the cost of ANY main-thread-blocking work: it
> eats directly into the ~16ms-per-frame budget, alongside JS
> execution, style, layout, and paint. A large `JSON.parse` of a big
> stored blob, or many synchronous reads in a hot path, can each cost
> a dropped frame the exact same way a slow loop does — `localStorage`
> isn't exempt from that budget just because it "feels like" reading a
> local variable.

```javascript
// Basic usage:
localStorage.setItem("theme", "dark");
const theme = localStorage.getItem("theme"); // 'dark'
localStorage.removeItem("theme");
localStorage.clear(); // Remove ALL items

// Storing objects (MUST serialize):
const user = { name: "Harsha", role: "dev" };
localStorage.setItem("user", JSON.stringify(user));
const stored = JSON.parse(localStorage.getItem("user"));

// Storage event — detect changes from OTHER tabs:
window.addEventListener("storage", (e) => {
  console.log(`Key "${e.key}" changed from "${e.oldValue}" to "${e.newValue}"`);
  if (e.key === "theme") {
    applyTheme(e.newValue); // Sync theme across tabs!
  }
});
```

> ⚠️ **Security warning — never store JWTs, auth tokens, passwords,
> API keys, or PII in `localStorage`.** The mechanism: `localStorage`
> has exactly one access boundary — same-origin — and NO protection
> against scripts that are already running in that origin, whether
> you wrote them or an attacker injected them via an XSS
> vulnerability. Any injected `<script>` can call
> `localStorage.getItem('token')` as freely as your own code can;
> there's no way to mark an entry "JS can't read this." An `httpOnly`
> cookie is different specifically because it's invisible to
> `document.cookie` and every other JS API by design — that
> invisibility (not the storage location itself) is what makes it the
> correct place for an auth token.

---

## 5. IndexedDB — Client-Side Database

> **Why IndexedDB's entire API is callback/Promise-shaped where
> localStorage's is a plain synchronous call — direct consequence of
> what each one is built for.** Section 4 just established that
> synchronous work blocks the main thread for its full duration,
> which is fine for a handful of small key-value reads but not for
> what IndexedDB is actually designed to hold: hundreds of MB,
> indexed, queryable, potentially requiring real disk I/O. If
> `store.get(key)` blocked synchronously the way `localStorage.getItem`
> does, a single query against a large object store could freeze the
> UI for however long the underlying I/O takes — an unbounded,
> unpredictable cost the frame budget can't absorb. Making every
> operation asynchronous (`onsuccess`/`onerror`, wrapped in Promises
> below) means the main thread stays free to keep rendering while the
> browser does that work in the background, regardless of how large
> the query turns out to be:

```
  WHEN TO USE INDEXEDDB:
  • Need to store > 5MB of structured data
  • Need indexes and queries (not just key-value)
  • Offline-first apps with sync
  • Caching API responses with complex queries
  • Storing blobs (images, files)
```

```javascript
// Open/create database:
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MyAppDB", 1); // name, version

    // Called when version increases or DB is new:
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store (like a table):
      const store = db.createObjectStore("products", {
        keyPath: "id", // Primary key field
        autoIncrement: true,
      });

      // Create indexes (for searching):
      store.createIndex("category", "category", { unique: false });
      store.createIndex("name", "name", { unique: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// CRUD operations:
async function addProduct(product) {
  const db = await openDB();
  const tx = db.transaction("products", "readwrite");
  const store = tx.objectStore("products");
  store.add(product);
  return tx.complete;
}

async function getProductsByCategory(category) {
  const db = await openDB();
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const index = store.index("category");

  return new Promise((resolve) => {
    const request = index.getAll(category);
    request.onsuccess = () => resolve(request.result);
  });
}

// Usage:
await addProduct({ name: "Laptop", category: "electronics", price: 999 });
const electronics = await getProductsByCategory("electronics");
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

> **How a WebSocket connection actually starts — this is the detail
> "persistent bidirectional connection" skips past, and it's not a
> separate protocol from HTTP, it's bootstrapped BY one.** [Chapter
> 9, Section 1](09_Browser_Internals_Rendering.md#1-navigation--from-url-to-first-byte)
> traced DNS → TCP handshake → TLS handshake as the setup cost before
> any HTTP request even starts. A WebSocket connection pays that exact
> same setup cost, then does one more step: the browser sends a
> completely normal-looking HTTP request, but with two special
> headers — `Upgrade: websocket` and `Connection: Upgrade` — that ask
> the server "can we stop speaking HTTP on this connection and switch
> protocols instead?" If the server agrees, it replies with HTTP
> status `101 Switching Protocols` rather than the `200`/`404`/`500`
> you'd normally see. From that exchange onward, the **same
> underlying TCP connection** stays open, but neither side sends
> another HTTP request/response on it ever again — both sides now
> speak the WebSocket **frame protocol**: small binary-or-text
> messages, either side free to send one at any moment, no
> request-needs-a-response pairing at all.
>
> **Why this handshake design, instead of inventing a wholly separate
> protocol.** Reusing HTTP's initial handshake means a WebSocket
> connection can use the exact same port (443 for `wss://`, same as
> HTTPS), pass through the same proxies and firewalls that already
> know how to handle HTTP, and reuse the TLS setup HTTPS already
> needed. Corporate networks and CDNs that only forward HTTP/HTTPS
> traffic pass WebSocket traffic through without any special
> configuration — genuinely one of the reasons WebSocket succeeded
> as a standard where earlier bidirectional-browser-connection
> proposals didn't.

```javascript
// Client side:
const ws = new WebSocket("wss://api.example.com/ws");

ws.onopen = () => {
  console.log("Connected!");
  ws.send(JSON.stringify({ type: "subscribe", channel: "prices" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
  updateUI(data);
};

ws.onclose = (event) => {
  console.log(`Disconnected: ${event.code} ${event.reason}`);
  // Reconnect logic:
  if (event.code !== 1000) {
    // 1000 = normal closure
    setTimeout(() => connectWebSocket(), 3000);
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Send message:
ws.send(JSON.stringify({ type: "chat", message: "Hello!" }));

// Close connection:
ws.close(1000, "User logged out");
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

> **Why SSE can be "just HTTP" while Section 6 needed an entire
> Upgrade handshake to switch protocols.** WebSocket needed that
> handshake because it needs a genuinely bidirectional channel — the
> client must be able to push a frame at any moment, which plain HTTP
> request/response can't express. SSE doesn't need that: it's still
> exactly one HTTP request and one HTTP response, the only twist is
> that the server never finishes sending the response body — it keeps
> the connection open and keeps writing chunks (`data: ...\n\n`) to it
> indefinitely. Because there's no protocol switch, no proxy or
> firewall needs to understand anything beyond "a slow HTTP response,"
> which is precisely why it survives infrastructure that has never
> heard of the WebSocket Upgrade header. And because it's not a raw
> socket you manage yourself but a purpose-built browser API
> (`EventSource`), reconnection-on-drop is something the browser
> implements for you once, instead of logic every WebSocket consumer
> has to hand-roll — that's what "auto-reconnect built-in" actually
> means:

| | WebSocket | SSE |
|---|---|---|
| Direction | Bidirectional (client ↔ server) | Server → Client only |
| Transport | Upgraded connection, own frame protocol | Plain HTTP response that never closes |
| Reconnect | You implement it | Built into `EventSource` |
| Best for | Chat, gaming, collaborative editing | Notifications, live feeds, progress updates |

```javascript
// Client:
const eventSource = new EventSource("/api/notifications");

eventSource.onmessage = (event) => {
  console.log("Notification:", event.data);
};

// Named events:
eventSource.addEventListener("price-update", (event) => {
  const data = JSON.parse(event.data);
  updatePrice(data.symbol, data.price);
});

eventSource.addEventListener("alert", (event) => {
  showAlert(event.data);
});

eventSource.onerror = () => {
  console.log("Connection lost, auto-reconnecting...");
  // EventSource automatically reconnects!
};

// Close when done:
eventSource.close();
```

---

🔬 **Section Challenge — 7. Server-Sent Events — One-Way Streaming**

**Challenge 1 (Design):** You are building a live stock ticker using Server-Sent Events (SSE). If the user loses internet connection for 10 seconds and reconnects, how do you ensure they don't miss any price updates that occurred during the outage?

<details><summary>Answer</summary>

- **Scenario:** Handling connection drops in a one-way SSE stream.
- **Trace:** `EventSource` automatically attempts to reconnect when the connection drops. However, simply reconnecting doesn't recover lost messages unless the server knows what the client missed. The SSE protocol handles this natively via the `Last-Event-ID` header.
- **Debug/Design Fix:**

1. **Server:** When sending events, include an `id` field: `id: 1045\ndata: {"price": 150}\n\n`.
2. **Client Drop:** Connection breaks.
3. **Client Reconnect:** The browser automatically reconnects and includes the `Last-Event-ID: 1045` HTTP header in the new request.
4. **Server Recovery:** The server reads the header, retrieves all events with an ID > 1045 from its cache/database, and streams them immediately before resuming real-time events.
</details>

## 8. Fetch API — Advanced Patterns

`fetch` on its own has no timeout, no retry, and no cancellation — these four patterns are the missing pieces every production codebase ends up building, using primitives the platform already provides.

**Timeout via cancellation, because `fetch` has no timeout option of its own.** `AbortController` is the platform's general-purpose "stop this in-flight operation" primitive — `fetch` accepts its `.signal` and rejects with an `AbortError` the instant `.abort()` is called, so a plain `setTimeout` calling `abort()` is the entire mechanism a fetch-level timeout needs:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch("/api/data", { signal: controller.signal });
  clearTimeout(timeoutId);
  const data = await response.json();
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request timed out");
  }
}
```

**Exponential backoff, because a fixed retry delay makes outages worse, not better.** If every failed client retries after the exact same 1 second, they all hammer the server again in the exact same instant — the "thundering herd" that turns a brief blip into a sustained outage. Doubling the delay each attempt (`1000 * 2^attempt`, capped at 10s) spreads retries out over time and gives a struggling server increasing room to recover instead of being retried into the ground:

```javascript
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
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

**Parallel requests via `Promise.all`, because three independent `await`s in sequence pay three round-trips back to back for no reason.** None of these three requests depends on another's result, so there's nothing to gain from serializing them — `Promise.all` starts all three immediately and resumes once every one has settled, paying roughly the cost of the SLOWEST request instead of the SUM of all three:

```javascript
const [users, products, orders] = await Promise.all([
  fetch("/api/users").then((r) => r.json()),
  fetch("/api/products").then((r) => r.json()),
  fetch("/api/orders").then((r) => r.json()),
]);
```

**Streaming, because `response.json()` cannot report progress or yield a single byte until the ENTIRE body has arrived.** `.json()`/`.text()` buffer the whole response before resolving — for a large file, that means "0% done" for the entire download and then an instant jump to 100%. `response.body` exposes the underlying `ReadableStream` directly: each `reader.read()` resolves as soon as the NEXT chunk arrives over the wire, so progress can be reported incrementally instead of only at the very end:

```javascript
const response = await fetch("/api/large-data");
const reader = response.body.getReader();
const decoder = new TextDecoder();
let result = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  result += decoder.decode(value, { stream: true });
  updateProgress(result.length / response.headers.get("Content-Length"));
}
```

---

## 9. Clipboard API — Copy/Paste Programmatically

> **Why reading the clipboard needs explicit permission but this
> chapter's other storage APIs (Sections 4-5) don't.** `localStorage`
> and IndexedDB are scoped per-origin — one site can never read
> another site's data. The system clipboard has NO such scoping: it's
> one shared slot the whole OS reads and writes, so whatever the user
> last copied from their password manager, a 2FA code, or a private
> message is sitting there regardless of which page they're currently
> on. Letting any page silently call `readText()` would mean any page
> could exfiltrate that unrelated, potentially sensitive data — so the
> platform requires an explicit permission grant (and, in practice, a
> real user gesture like a click) before a read is allowed. Writing is
> treated as lower-risk — worst case a malicious page fills your
> clipboard with junk, rather than stealing anything — so
> `writeText()` is generally allowed as part of a user gesture without
> a separate permission prompt.
>
> **Why the fallback path (`execCommand('copy')`) looks so different
> from the modern API.** It's not copying anything directly — it's
> triggering the browser's copy command against whatever text is
> currently SELECTED on the page. That's why the fallback has to
> create an off-screen `<textarea>`, fill it, and explicitly `.select()`
> it first: there's nothing else for `execCommand('copy')` to act on.

```javascript
// Copy text:
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied!");
  } catch (err) {
    // Fallback for older browsers:
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
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
  const blob = new Blob(["<b>Bold text</b>"], { type: "text/html" });
  await navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]);
}
```

---

## 10. Notification & Vibration API

> **Why notifications need the same permission-gate as Clipboard
> reads, for a related reason.** A `Notification` doesn't render
> inside your tab — it's OS-level UI that shows up in the system tray
> or lock screen, visible even when the browser isn't the focused
> window. If any page could fire these unrestricted, notification
> spam would make the feature worthless within days — every site
> would blast the user constantly. The permission prompt is the
> platform forcing an explicit, per-origin opt-in before a page gets
> access to UI that lives outside its own tab. Vibration doesn't
> return anything to protect and directly drives real hardware
> instead — it's a no-op on any device without a vibration motor
> (desktops), and browsers cap pattern length/duration to stop a page
> from turning a phone into a constant buzzer.

```javascript
// Request permission first:
async function enableNotifications() {
  const permission = await Notification.requestPermission();
  // 'granted', 'denied', or 'default'
  return permission === "granted";
}

// Show notification:
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: "message", // Replace previous notification with same tag
      requireInteraction: true, // Don't auto-dismiss
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Vibration (mobile):
navigator.vibrate(200); // Vibrate 200ms
navigator.vibrate([100, 50, 100]); // Pattern: vibrate, pause, vibrate
navigator.vibrate(0); // Stop vibration
```

---

## 11. Geolocation API

> **Why this API takes two callback functions instead of returning a
> Promise, unlike everything else in this chapter.** Geolocation
> shipped around 2009 — years before Promises existed anywhere in
> JavaScript (they weren't standardized until ES2015). Every Web API
> designed after Promises became the norm (`fetch`, Clipboard,
> IndexedDB wrapped in Promises above) follows that shape; Geolocation
> predates the convention and was never redesigned, so it's a useful
> marker of "this API is old" on sight, independent of what it does.
>
> **Why `enableHighAccuracy` explicitly trades battery for
> precision.** The browser can resolve a position from several
> sources of very different cost: WiFi network fingerprinting and
> cell-tower triangulation are cheap and fast but only accurate to
> roughly city-block scale, while the GPS chip gives meter-level
> accuracy but has to power up a radio and hold a satellite fix, which
> draws real, sustained battery. By default the browser is free to
> pick whichever cheap source answers fast enough; `enableHighAccuracy:
> true` is an explicit instruction to prefer GPS's precision even at
> that battery cost.

```javascript
// Get current position (one-time):
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log("Lat:", position.coords.latitude);
    console.log("Lng:", position.coords.longitude);
    console.log("Accuracy:", position.coords.accuracy, "meters");
  },
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log("User denied geolocation");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location unavailable");
        break;
      case error.TIMEOUT:
        console.log("Request timed out");
        break;
    }
  },
  {
    enableHighAccuracy: true, // GPS (slower, more battery)
    timeout: 10000, // Max wait time
    maximumAge: 60000, // Accept cached position up to 1min old
  },
);

// Watch position (continuous tracking):
const watchId = navigator.geolocation.watchPosition(
  (position) => updateMap(position.coords),
  (error) => handleError(error),
  { enableHighAccuracy: true },
);

// Stop tracking:
navigator.geolocation.clearWatch(watchId);
```

---

## 12. Broadcast Channel — Cross-Tab Communication

> **Why this exists as a separate API when Section 4's `storage`
> event already crosses tabs.** The `storage` event only fires as a
> side effect of an ACTUAL `localStorage` write — using it for
> messaging means writing (and cleaning up) a throwaway key every time
> you want to say something, persisting data you never actually
> wanted to keep, purely to trigger the side effect. `BroadcastChannel`
> is a purpose-built pub/sub channel with no storage underneath it at
> all: `postMessage` on one tab's channel instance fires `onmessage`
> on every OTHER same-origin tab's channel instance with the same
> name, directly, nothing written to disk. It's the same "one origin,
> many tabs" topology [Chapter 10, Section 5](10_Web_Workers_ServiceWorkers.md#5-sharedworker--one-worker-multiple-tabs)'s
> SharedWorker fan-in solved for a shared WebSocket connection, applied
> here to plain message-passing instead:

```
  PROBLEM: User logs out in one tab. Other tabs still show as logged in.
  SOLUTION: Broadcast Channel sends messages between same-origin tabs.
```

```javascript
// Create channel (same name = same channel):
const authChannel = new BroadcastChannel("auth");

// Tab 1 — Send logout:
function logout() {
  clearSession();
  authChannel.postMessage({ type: "LOGOUT" });
  window.location.href = "/login";
}

// Tab 2 — Listen for logout:
authChannel.onmessage = (event) => {
  if (event.data.type === "LOGOUT") {
    clearSession();
    window.location.href = "/login";
  }
};

// Theme sync across tabs:
const themeChannel = new BroadcastChannel("theme");

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeChannel.postMessage({ theme });
}

themeChannel.onmessage = (event) => {
  document.documentElement.setAttribute("data-theme", event.data.theme);
};

// Close when component unmounts:
// authChannel.close();
```

Every "alternative" column below is the OLDER, more expensive way to answer the same question — the pattern this whole chapter has been deriving section by section: a purpose-built async API replacing a synchronous poll or a workaround.

| Need | API | Older alternative |
|---|---|---|
| Element visible? | IntersectionObserver | `scroll` events |
| Element resized? | ResizeObserver | `window.onresize` |
| DOM changed? | MutationObserver | Deprecated DOM Mutation Events |
| Store <5MB | localStorage | cookies |
| Store >5MB | IndexedDB | Cache API |
| Two-way realtime | WebSocket | polling |
| Server push | SSE | long polling |
| Cross-tab sync | BroadcastChannel | `storage` event |
| Copy/paste | Clipboard API | `execCommand` |
| Location | Geolocation | IP-based lookup |

---

**Next Chapter**: [V8 Engine Internals →](12_V8_Engine_Internals.md)

---


---

## Reality Check

**"Observers are fancier event listeners"** → Observers exist because the events they replace were UNBUILDABLE or ruinous: scroll-position checking forced sync layout per scroll tick (IntersectionObserver computes visibility off-thread and batches), resize events fired only on window (ResizeObserver watches elements), and DOM mutation events were deprecated for pathological performance (MutationObserver batches via microtask). The shared contract — asynchronous, batched, browser-scheduled — is the design lesson: you declare interest, the engine picks the efficient moment. Polling geometry in 2026 is choosing the pre-observer world voluntarily.

**"AbortController is for canceling fetches"** → AbortController is the WEB'S UNIVERSAL CANCELLATION TOKEN: one signal aborts fetches, removes event listeners (the signal option — bulk-unsubscribe replacing removeEventListener bookkeeping), cancels streams, and wires into anything accepting AbortSignal (including your own async functions via signal checks). The composition tools matter: AbortSignal.timeout(ms) for deadline fetches, AbortSignal.any([...]) merging causes, and the pattern of scoping a controller per component-mount/route/operation so teardown is one abort() call. Treating it as fetch-only leaves the leak-prevention half of the API unused.

**"The History API is for routers to manage"** → Understanding it is what separates using a router from debugging one: pushState changes the URL WITHOUT navigation (no server request — why SPAs need server-side catch-all rewrites for deep links), popstate fires only on BROWSER navigation (back/forward), never on your own pushState calls (routers listen AND wrap), and scroll restoration is a negotiable (history.scrollRestoration = manual). The SPA-navigation bug catalog — broken back button, lost scroll, 404-on-refresh, state lost on reload because it lived in memory instead of history.state — is this API's semantics, unlearned.

**"Web Components lost to frameworks"** → Custom elements plus shadow DOM won a DIFFERENT niche: design systems shipping framework-agnostic widgets (one component consumed by React, Angular, and legacy pages simultaneously), embeds that must not leak styles either direction (shadow DOM's real superpower — style ENCAPSULATION, both isolation and containment), and progressive enhancement of server HTML. The honest trade-offs: shadow DOM complicates form participation (ElementInternals exists for this), SSR needs declarative shadow DOM, and framework DX (state, reactivity) is absent by design — you bring your own. "Lost" is the wrong frame; "specialized for boundaries frameworks cannot cross" is the accurate one.

**"New Web APIs are safe to adopt once Chrome ships them"** → Chrome-shipped is one browser's vote, and the gaps bite in production: Safari lags by years on entire categories (and iOS Safari IS every iOS browser under the hood), Firefox declines some APIs on principle (Web Bluetooth, USB), and feature-detection-plus-fallback is the only durable adoption pattern (if ('IntersectionObserver' in window), progressive enhancement, or a polyfill with its cost acknowledged). The pre-adoption ritual: check caniuse AND the WebKit position tracker, define the no-support behavior explicitly, and wrap the API behind your own module so a future replacement is one file. Adopting on Chrome's schedule without the ritual ships silent breakage to a third of users.
