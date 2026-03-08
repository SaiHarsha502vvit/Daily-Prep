> **Navigation**: [< Previous](10_Web_Workers_ServiceWorkers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](../07_Modern_Java/44_Java_Collections_Internals.md)

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

> **Next Chapter**: [Java Collections Internals →](../07_Modern_Java/44_Java_Collections_Internals.md)
