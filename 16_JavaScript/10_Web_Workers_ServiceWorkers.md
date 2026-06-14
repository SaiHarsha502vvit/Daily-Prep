**Navigation**: [< Previous](09_Browser_Internals_Rendering.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Advanced_Web_APIs.md)

# ⚙️ Chapter 10 — Web Workers & Service Workers: Threading in the Browser

**"JavaScript is single-threaded, but the browser is NOT. Web Workers let you run expensive computation off the main thread so your UI stays smooth. Service Workers give your app superpowers — offline support, push notifications, and background sync."**

---

## Table of Contents

1. [Why We Need Workers — The Main Thread Problem](#1-why-we-need-workers--the-main-thread-problem)
2. [Dedicated Web Workers — Basics](#2-dedicated-web-workers--basics)
3. [Worker Communication — postMessage Deep Dive](#3-worker-communication--postmessage-deep-dive)
4. [Transferable Objects — Zero-Copy Performance](#4-transferable-objects--zero-copy-performance)
5. [SharedWorker — One Worker, Multiple Tabs](#5-sharedworker--one-worker-multiple-tabs)
6. [Worker Limitations — What You Cannot Do](#6-worker-limitations--what-you-cannot-do)
7. [Real-World Use Cases for Web Workers](#7-real-world-use-cases-for-web-workers)
8. [Service Workers — The Proxy Between Browser and Network](#8-service-workers--the-proxy-between-browser-and-network)
9. [Service Worker Lifecycle](#9-service-worker-lifecycle)
10. [Caching Strategies — Offline-First Patterns](#10-caching-strategies--offline-first-patterns)
11. [Background Sync & Push Notifications](#11-background-sync--push-notifications)
12. [Workbox — Production-Ready Service Workers](#12-workbox--production-ready-service-workers)

---

## 1. Why We Need Workers — The Main Thread Problem

```
  THE SINGLE-THREAD PROBLEM:
  ══════════════════════════

  Main Thread handles EVERYTHING:
  • JavaScript execution
  • DOM manipulation
  • Style calculation
  • Layout & Paint
  • User input handling (clicks, scrolls, typing)

  If JS takes 200ms processing data:

  ┌─ Main Thread ─────────────────────────────────────────────┐
  │                                                            │
  │  Frame 1  │ HEAVY JS (200ms) █████████████│ Frame 14      │
  │  (16ms)   │ ← 12 frames DROPPED! →       │ (16ms)        │
  │          UI FROZEN — user can't click, scroll, or type    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  WITH Web Worker:

  ┌─ Main Thread ─────────────────────────────────────────────┐
  │ Frame 1 │ Frame 2 │ Frame 3 │ ... │ Frame 12 │ Frame 13  │
  │ (16ms)  │ (16ms)  │ (16ms)  │     │ (16ms)   │ (16ms)    │
  │ ← UI stays smooth at 60fps! →                             │
  └────────────────────────────────────────────────────────────┘
  ┌─ Worker Thread ───────────────────────────────────────────┐
  │ HEAVY JS (200ms) █████████████████████████████            │
  │ ← runs in parallel, doesn't block UI →                    │
  └────────────────────────────────────────────────────────────┘
```

---

## 2. Dedicated Web Workers — Basics

```javascript
// ═══════════════════════════════════════════
// CREATING A WORKER — main.js
// ═══════════════════════════════════════════

// Worker runs in a SEPARATE file
const worker = new Worker("heavy-computation.js");

// Send data TO the worker
worker.postMessage({
  type: "SORT_DATA",
  data: hugeArray,
});

// Receive results FROM the worker
worker.onmessage = (event) => {
  console.log("Sorted data:", event.data);
  renderTable(event.data); // Back on main thread, update UI
};

// Handle errors
worker.onerror = (error) => {
  console.error("Worker error:", error.message);
};

// Terminate when done
worker.terminate();
```

```javascript
// ═══════════════════════════════════════════
// INSIDE THE WORKER — heavy-computation.js
// ═══════════════════════════════════════════

// 'self' refers to the worker's global scope (not window!)
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "SORT_DATA":
      // This sorting takes 200ms — but doesn't block UI!
      const sorted = data.sort((a, b) => a.value - b.value);
      self.postMessage(sorted);
      break;

    case "FILTER_DATA":
      const filtered = data.filter((item) => item.active);
      self.postMessage(filtered);
      break;
  }
};
```

### Inline Workers (No Separate File)

```javascript
// Create worker from a Blob — useful in bundled apps
const workerCode = `
  self.onmessage = (e) => {
    const result = e.data.map(n => n * n);
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: "application/javascript" });
const worker = new Worker(URL.createObjectURL(blob));

worker.postMessage([1, 2, 3, 4, 5]);
worker.onmessage = (e) => console.log(e.data); // [1, 4, 9, 16, 25]
```

---

## 3. Worker Communication — postMessage Deep Dive

```
  HOW postMessage WORKS:
  ══════════════════════

  Main Thread                    Worker Thread
  ┌──────────────────┐          ┌──────────────────┐
  │                  │          │                  │
  │  const data =    │ COPY     │  self.onmessage  │
  │  { items: [...]} │ ───────→ │  = (event) => {  │
  │                  │ (clone)  │    event.data     │
  │                  │          │    // DEEP COPY!  │
  │                  │          │  }                │
  │                  │          │                  │
  │  worker.         │ COPY     │  self.postMessage │
  │  onmessage =     │ ←─────── │  (result)        │
  │  (event) => {}   │ (clone)  │                  │
  │                  │          │                  │
  └──────────────────┘          └──────────────────┘

  DATA IS CLONED, NOT SHARED!

  ⚠️ Structured Clone Algorithm handles:
  ✅ Objects, Arrays, Maps, Sets, Dates, RegExp
  ✅ ArrayBuffer, TypedArrays, Blob, File, ImageData
  ❌ Functions (cannot be cloned!)
  ❌ DOM nodes (cannot be cloned!)
  ❌ Symbols, class instances with methods
```

---

## 4. Transferable Objects — Zero-Copy Performance

```javascript
// PROBLEM: Cloning a 100MB ArrayBuffer takes time + doubles memory
const buffer = new ArrayBuffer(100 * 1024 * 1024); // 100MB

// SLOW — structured clone (copies 100MB):
worker.postMessage(buffer); // 100MB allocated in worker too!

// FAST — transfer ownership (zero copy):
worker.postMessage(buffer, [buffer]); // Second arg = transferables
// buffer.byteLength is now 0! Main thread can't use it anymore.
// Worker OWNS the buffer — no copy needed.
```

```
  STRUCTURED CLONE vs TRANSFER:
  ═════════════════════════════

  Clone:               Transfer:
  Main: [████████]     Main: [████████] → Main: [        ]
  Copy: [████████]     Worker: [████████]
  Worker gets copy     Worker gets THE SAME memory

  Transferable types:
  • ArrayBuffer
  • MessagePort
  • ImageBitmap
  • OffscreenCanvas
  • ReadableStream, WritableStream, TransformStream
```

---

## 5. SharedWorker — One Worker, Multiple Tabs

```javascript
// ═══════════════════════════════════════════
// SharedWorker — shared across all tabs of same origin
// ═══════════════════════════════════════════

// any-page.js (same code in every tab)
const shared = new SharedWorker("shared-worker.js");
shared.port.start();

shared.port.postMessage({ type: "JOIN", userId: "user123" });
shared.port.onmessage = (e) => {
  console.log("Broadcast from worker:", e.data);
};
```

```javascript
// shared-worker.js
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e) => {
    if (e.data.type === "BROADCAST") {
      // Send to ALL connected tabs
      connections.forEach((p) => p.postMessage(e.data.message));
    }
  };

  port.start();
};
```

```
  USE CASES for SharedWorker:
  ═══════════════════════════

  Tab 1 ─── port ───┐
  Tab 2 ─── port ───┤── SharedWorker ── WebSocket connection
  Tab 3 ─── port ───┘

  Instead of 3 WebSocket connections (one per tab),
  ONE SharedWorker manages ONE connection for all tabs.

  Also useful for:
  • Shared state across tabs (shopping cart, user session)
  • Coordinating tab activities (only one tab plays audio)
  • Caching shared data (fetch once, share with all tabs)
```

---

## 6. Worker Limitations — What You Cannot Do

```
  ╔══════════════════════════════════════════════════════════════════╗
  ║  WORKERS DO NOT HAVE ACCESS TO:                                  ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║                                                                  ║
  ║  ❌ DOM (document, window)                                       ║
  ║     → Workers CANNOT read or modify the page                    ║
  ║     → No document.querySelector, no element.style               ║
  ║                                                                  ║
  ║  ❌ window object                                                ║
  ║     → No alert(), confirm(), prompt()                           ║
  ║                                                                  ║
  ║  ❌ Parent scope variables                                       ║
  ║     → Workers are completely isolated                           ║
  ║     → No closures from the creating script                      ║
  ║                                                                  ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║  WORKERS CAN USE:                                                ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║                                                                  ║
  ║  ✅ fetch() / XMLHttpRequest (make API calls)                   ║
  ║  ✅ setTimeout / setInterval                                    ║
  ║  ✅ IndexedDB (full database access)                            ║
  ║  ✅ WebSocket                                                   ║
  ║  ✅ importScripts() (load other JS files)                       ║
  ║  ✅ crypto (for hashing/encryption)                             ║
  ║  ✅ navigator (user agent, online status)                       ║
  ║  ✅ location (read-only URL info)                               ║
  ║  ✅ Cache API                                                   ║
  ║  ✅ structuredClone()                                           ║
  ║                                                                  ║
  ╚══════════════════════════════════════════════════════════════════╝
```

---

## 7. Real-World Use Cases for Web Workers

```javascript
// ═══════════════════════════════════════════
// USE CASE 1: Image Processing (resize, filter, crop)
// ═══════════════════════════════════════════
// image-worker.js
self.onmessage = (event) => {
  const { imageData, filter } = event.data;
  const pixels = imageData.data; // Uint8ClampedArray

  if (filter === "grayscale") {
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = avg;
    }
  }

  self.postMessage(imageData, [imageData.data.buffer]); // Transfer!
};

// ═══════════════════════════════════════════
// USE CASE 2: CSV/JSON Parsing of Large Files
// ═══════════════════════════════════════════
// parser-worker.js
self.onmessage = (event) => {
  const csvText = event.data;
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const record = {};
    headers.forEach((h, idx) => (record[h.trim()] = values[idx]?.trim()));
    records.push(record);
  }

  self.postMessage(records);
};

// ═══════════════════════════════════════════
// USE CASE 3: Search/Filter in Large Dataset
// ═══════════════════════════════════════════
// search-worker.js
let dataset = null;

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === "LOAD") {
    dataset = payload; // Store dataset in worker memory
    self.postMessage({ type: "READY", count: dataset.length });
  }

  if (type === "SEARCH") {
    const query = payload.toLowerCase();
    const results = dataset.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query),
    );
    self.postMessage({ type: "RESULTS", data: results });
  }
};

// ═══════════════════════════════════════════
// USE CASE 4: Encryption/Hashing
// ═══════════════════════════════════════════
// crypto-worker.js
self.onmessage = async (event) => {
  const { action, data } = event.data;

  if (action === "HASH") {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    self.postMessage({ hash: hashHex });
  }
};
```

---

## 8. Service Workers — The Proxy Between Browser and Network

```
  Service Worker sits BETWEEN your app and the network:

  ┌── Browser Tab ──┐        ┌── Service Worker ──┐        ┌── Network ──┐
  │                 │        │                    │        │             │
  │  fetch('/api')  │ ──→    │  Intercept!        │ ──→    │  Server     │
  │                 │        │  Check cache?       │        │             │
  │  ← response     │ ←──   │  ← serve from cache │        │             │
  │                 │        │  OR forward to net  │ ←──   │  ← response │
  └─────────────────┘        └────────────────────┘        └─────────────┘


  WHAT SERVICE WORKERS ENABLE:
  ════════════════════════════

  1. OFFLINE SUPPORT — serve cached pages when no internet
  2. CACHING STRATEGIES — cache API responses, static assets
  3. PUSH NOTIFICATIONS — receive messages even when tab is closed
  4. BACKGROUND SYNC — queue requests and send when back online
  5. NETWORK PROXY — modify requests/responses programmatically
```

### Registration

```javascript
// main.js — register the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/", // Controls all pages under /
      });
      console.log("SW registered:", registration.scope);
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  });
}
```

---

🔬 **Section Challenge — 8. Service Workers — The Proxy Between Browser and Network**

**Challenge 1 (Design):** You deploy a new version of your SPA, but users complain they are still seeing the old UI for days. Your Service Worker uses a standard 'Cache First' strategy for the HTML file. What caused this, and how do you design a robust SW update flow?

<details><summary>Answer</summary>

**Scenario:** Users stuck on an old version of the app despite new deployments.
**Trace:** The browser fetches the `sw.js` file (which is byte-compared with the existing one). If it detects a change, the new SW installs but goes into the **WAITING** state. It will _not_ activate until all tabs controlled by the old SW are closed. Furthermore, if the `index.html` was heavily cached, the browser might not even know there's a new SW.
**Debug/Design Fix:**

1. **Never cache `index.html` or `sw.js`** with a Cache-First strategy. Use `Network-First` or set strict `Cache-Control: no-cache` headers for them.
2. Listen for the SW update on the client: when a new SW is waiting, show a "New version available! [Refresh]" toast.
3. On clicking Refresh, send a message to the waiting SW: `worker.postMessage({ type: 'SKIP_WAITING' })`.
4. Inside the SW, handle it: `self.addEventListener('message', e => { if (e.data.type === 'SKIP_WAITING') self.skipWaiting(); })`.
5. Listen for the `controllerchange` event on the client to automatically reload the page once the new SW takes over.
</details>

## 9. Service Worker Lifecycle

```
  ┌── INSTALL ────────────────────────────────────────────────────┐
  │                                                                │
  │  First time SW is registered (or new version detected).       │
  │  → Pre-cache essential assets.                                 │
  │  → If install fails, SW is discarded.                         │
  │                                                                │
  │  Event: 'install'                                              │
  └─────────────────────────────┬──────────────────────────────────┘
                                ▼
  ┌── WAITING ────────────────────────────────────────────────────┐
  │                                                                │
  │  New SW is installed but OLD SW still controls tabs.          │
  │  Waits until ALL tabs using old SW are closed.                │
  │  → Or call self.skipWaiting() to take over immediately.      │
  │                                                                │
  └─────────────────────────────┬──────────────────────────────────┘
                                ▼
  ┌── ACTIVATE ───────────────────────────────────────────────────┐
  │                                                                │
  │  Old SW is gone, new SW takes control.                         │
  │  → Clean up old caches.                                       │
  │  → Call clients.claim() to control existing tabs immediately. │
  │                                                                │
  │  Event: 'activate'                                             │
  └─────────────────────────────┬──────────────────────────────────┘
                                ▼
  ┌── ACTIVE (Idle/Fetch) ────────────────────────────────────────┐
  │                                                                │
  │  SW is now intercepting all fetch requests for its scope.     │
  │  SW is event-driven — it sleeps when not handling events.     │
  │  → It can be terminated at any time by the browser!           │
  │  → DON'T store state in global variables.                     │
  │                                                                │
  │  Events: 'fetch', 'push', 'sync', 'message'                  │
  └────────────────────────────────────────────────────────────────┘
```

```javascript
// sw.js — Service Worker
const CACHE_NAME = "app-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/styles/main.css",
  "/scripts/app.js",
  "/images/logo.svg",
];

// INSTALL — Pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting(); // Don't wait for old SW to die
});

// ACTIVATE — Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim(); // Take control of all tabs immediately
});
```

---

## 10. Caching Strategies — Offline-First Patterns

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  STRATEGY 1: Cache First (Offline First)                    ║
  ║  Best for: Static assets (CSS, JS, images, fonts)          ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  Request → Cache hit? → YES → Return cached                ║
  ║                       → NO  → Fetch from network → Cache   ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
```

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
      );
    }),
  );
});
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  STRATEGY 2: Network First (Freshness Priority)            ║
  ║  Best for: API calls, dynamic content, news feeds          ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  Request → Try network → Success → Return + update cache   ║
  ║                        → Fail (offline) → Return cached    ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
```

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  STRATEGY 3: Stale-While-Revalidate                        ║
  ║  Best for: Content that updates but stale-ok temporarily   ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  Request → Return cached immediately (fast!)                ║
  ║         → ALSO fetch from network in background             ║
  ║         → Update cache for NEXT request                     ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
```

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cached || fetchPromise;
      });
    }),
  );
});
```

```
  CHOOSING THE RIGHT STRATEGY:
  ════════════════════════════

  ┌────────────────────┬──────────────────────────────────────┐
  │ Asset Type         │ Strategy                             │
  ├────────────────────┼──────────────────────────────────────┤
  │ App shell (HTML)   │ Cache First                          │
  │ CSS / JS bundles   │ Cache First (versioned filenames)    │
  │ Fonts              │ Cache First                          │
  │ Images             │ Cache First                          │
  │ API data           │ Network First                        │
  │ User avatar        │ Stale-While-Revalidate              │
  │ Social feed        │ Network First                        │
  │ Product catalog    │ Stale-While-Revalidate              │
  └────────────────────┴──────────────────────────────────────┘
```

---

🔬 **Section Challenge — 10. Caching Strategies — Offline-First Patterns**

**Challenge 1 (Design):** Cache-aside vs write-through vs write-behind — when does each cause stale data?

<details><summary>Answer</summary>

Cache-aside (lazy load): on cache miss, load from DB and populate cache. Stale: if DB updated externally (direct DB write bypassing cache). Write-through: write to cache AND DB simultaneously. Stale: never (cache always reflects writes). Write-behind (write-back): write to cache, async write to DB. Stale: if cache crashes before DB write → data loss. Rule: cache-aside for read-heavy. Write-through for write+read. Write-behind for write-heavy (accept loss risk).

</details>

## 11. Background Sync & Push Notifications

```javascript
// ═══════════════════════════════════════════
// BACKGROUND SYNC — Send when back online
// ═══════════════════════════════════════════

// main.js — Queue a sync event
async function sendMessage(message) {
  // Save to IndexedDB (persists offline)
  await saveToIndexedDB("outbox", message);

  // Request background sync
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register("send-messages");
}

// sw.js — Handle the sync event
self.addEventListener("sync", (event) => {
  if (event.tag === "send-messages") {
    event.waitUntil(
      getFromIndexedDB("outbox").then((messages) => {
        return Promise.all(
          messages.map((msg) =>
            fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(msg),
            }).then(() => deleteFromIndexedDB("outbox", msg.id)),
          ),
        );
      }),
    );
  }
});
```

```javascript
// ═══════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════

// main.js — Subscribe to push
async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to your server
  await fetch("/api/push-subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
}

// sw.js — Handle incoming push
self.addEventListener("push", (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/images/notification-icon.png",
      badge: "/images/badge.png",
      data: { url: data.url },
    }),
  );
});

// sw.js — Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## 12. Workbox — Production-Ready Service Workers

```javascript
// Instead of writing SW caching logic by hand,
// use Google's Workbox library:

// sw.js (using Workbox)
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Pre-cache app shell (injected at build time)
precacheAndRoute(self.__WB_MANIFEST);

// Cache images (cache first, expire after 30 days)
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

// API calls (network first, fallback to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
  }),
);

// Google Fonts (stale-while-revalidate)
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({ cacheName: "google-fonts-stylesheets" }),
);
```

```
  ╔══════════════════════════════════════════════════════════════════╗
  ║                                                                  ║
  ║  WORKER TYPE COMPARISON:                                         ║
  ║                                                                  ║
  ║  ┌──────────────┬──────────────┬──────────────┐                 ║
  ║  │ Feature      │ Web Worker   │ Service      │                 ║
  ║  │              │              │ Worker       │                 ║
  ║  ├──────────────┼──────────────┼──────────────┤                 ║
  ║  │ Purpose      │ Heavy        │ Network      │                 ║
  ║  │              │ computation  │ proxy/cache  │                 ║
  ║  │ Lifetime     │ Tied to tab  │ Independent  │                 ║
  ║  │ DOM access   │ ❌           │ ❌           │                 ║
  ║  │ HTTPS only   │ ❌           │ ✅ (required)│                 ║
  ║  │ fetch events │ ❌           │ ✅           │                 ║
  ║  │ Push events  │ ❌           │ ✅           │                 ║
  ║  │ Scope        │ Per tab      │ Per origin   │                 ║
  ║  │ Survives     │ No           │ Yes (can     │                 ║
  ║  │ tab close    │              │ wake up)     │                 ║
  ║  └──────────────┴──────────────┴──────────────┘                 ║
  ║                                                                  ║
  ╚══════════════════════════════════════════════════════════════════╝
```

---

**Next Chapter**: [Advanced Web APIs →](11_Advanced_Web_APIs.md)

---
