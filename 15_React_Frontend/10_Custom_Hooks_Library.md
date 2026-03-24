> **Navigation**: [< Previous](10_Custom_Hooks_Library.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Complex_UI_Pages_Patterns.md)

# 🪝 Chapter 10 — Custom Hooks Library: Production-Ready Patterns

> **"Custom hooks are React's composition model. Every repeated pattern in your components — fetching data, tracking window size, debouncing input, detecting clicks outside — should be extracted into a reusable hook. Here's the complete library."**

---

## Table of Contents

1. [useLocalStorage — Persistent State](#1-uselocalstorage--persistent-state)
2. [useFetch — Data Fetching with Loading & Error](#2-usefetch--data-fetching-with-loading--error)
3. [useDebounce — Debounced Values](#3-usedebounce--debounced-values)
4. [useThrottle — Throttled Values](#4-usethrottle--throttled-values)
5. [useClickOutside — Detect Outside Clicks](#5-useclickoutside--detect-outside-clicks)
6. [useMediaQuery — Responsive JavaScript](#6-usemediaquery--responsive-javascript)
7. [useWindowSize — Track Viewport Dimensions](#7-usewindowsize--track-viewport-dimensions)
8. [useIntersectionObserver — Lazy Loading & Infinite Scroll](#8-useintersectionobserver--lazy-loading--infinite-scroll)
9. [usePrevious — Access Previous Render's Value](#9-useprevious--access-previous-renders-value)
10. [useAsync — Generic Async Operation Handler](#10-useasync--generic-async-operation-handler)
11. [useEventListener — Declarative Event Binding](#11-useeventlistener--declarative-event-binding)
12. [useKeyPress — Keyboard Shortcut Handler](#12-usekeypress--keyboard-shortcut-handler)
13. [useCopyToClipboard — Copy Text](#13-usecopytoclipboard--copy-text)
14. [useToggle — Boolean State Toggle](#14-usetoggle--boolean-state-toggle)
15. [useOnScreen — Is Element Visible](#15-useonscreen--is-element-visible)
16. [Hook Composition — Combining Hooks Together](#16-hook-composition--combining-hooks-together)

---

## 1. useLocalStorage — Persistent State

```
  WHY: useState resets on page refresh. useLocalStorage persists.
  WHEN: User preferences, theme choice, form drafts, shopping cart.
```

```jsx
import { useState, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  // Initialize from localStorage or use default
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Wrapped setter that also writes to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// ─── USAGE ───
function ThemeSelector() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

---

## 2. useFetch — Data Fetching with Loading & Error

```jsx
import { useState, useEffect, useRef } from 'react';

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Skip if no URL
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Abort previous request if still in flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]); // Re-fetch when URL changes

  return { data, error, loading };
}

// ─── USAGE ───
function UserProfile({ userId }) {
  const { data: user, error, loading } = useFetch(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;
  return <div>{user.name}</div>;
}
```

---

## 3. useDebounce — Debounced Values

```
  WHY: Prevent firing expensive operations on every keystroke.
  WHEN: Search input, form validation, resize handlers.
  
  Timeline:
  User types:  H  E  L  L  O
  Raw value:   H→ HE→ HEL→ HELL→ HELLO
  Debounced:   (wait 300ms after LAST keystroke) → HELLO
  API calls:   ──────────────────────────────── → 1 call (instead of 5!)
```

```jsx
import { useState, useEffect } from 'react';

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // Reset timer on each change
  }, [value, delay]);

  return debouncedValue;
}

// ─── USAGE ───
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results } = useFetch(
    debouncedQuery ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null
  );

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />
      {results && <SearchResults items={results} />}
    </div>
  );
}
```

---

## 4. useThrottle — Throttled Values

```
  DEBOUNCE vs THROTTLE:
  ─────────────────────
  
  Debounce: Wait until user STOPS, then fire.
            ___________fire
  
  Throttle: Fire at most once per interval, even while user continues.
            fire___fire___fire___fire
  
  Use throttle for: scroll position, mouse position, resize, drag.
  Use debounce for: search input, form validation, API calls.
```

```jsx
import { useEffect, useRef, useState } from 'react';

function useThrottle(value, interval = 200) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// ─── USAGE ───
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScroll = useThrottle(scrollY, 100);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Analytics/UI updates use throttledScroll (fires at most every 100ms)
  return <ProgressBar progress={throttledScroll / document.body.scrollHeight} />;
}
```

---

## 5. useClickOutside — Detect Outside Clicks

```
  WHEN: Close dropdown, close modal, close sidebar, deactivate edit mode.
```

```jsx
import { useEffect, useRef } from 'react';

function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or its descendants
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}

// ─── USAGE ───
function Dropdown({ onClose }) {
  const dropdownRef = useClickOutside(() => onClose());

  return (
    <div ref={dropdownRef} className="dropdown">
      <ul>
        <li>Option 1</li>
        <li>Option 2</li>
        <li>Option 3</li>
      </ul>
    </div>
  );
}
```

---

## 6. useMediaQuery — Responsive JavaScript

```jsx
import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    // Sync initial state
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ─── USAGE ───
function NavigationBar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (isMobile) {
    return <HamburgerMenu />;
  }
  return <DesktopNav />;
}
```

---

## 7. useWindowSize — Track Viewport Dimensions

```jsx
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      // Debounce resize events (fire every 150ms max)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return size;
}

// ─── USAGE ───
function ResponsiveGrid({ items }) {
  const { width } = useWindowSize();
  const columns = width > 1200 ? 4 : width > 768 ? 3 : width > 480 ? 2 : 1;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map(item => <Card key={item.id} {...item} />)}
    </div>
  );
}
```

---

## 8. useIntersectionObserver — Lazy Loading & Infinite Scroll

```
  Intersection Observer detects when an element enters/exits the viewport.
  MUCH more performant than scroll event listeners!
  
  USE CASES:
  • Lazy load images
  • Infinite scroll (load more when bottom reached)
  • Animate elements on scroll into view
  • Track which sections user has viewed (analytics)
```

```jsx
import { useEffect, useRef, useState } from 'react';

function useIntersectionObserver(options = {}) {
  const [entry, setEntry] = useState(null);
  const [node, setNode] = useState(null);
  const observer = useRef(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    if (!node) return;

    observer.current = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '0px',
        threshold: options.threshold ?? 0,
      }
    );

    observer.current.observe(node);

    return () => observer.current?.disconnect();
  }, [node, options.root, options.rootMargin, options.threshold]);

  return { ref: setNode, entry, isIntersecting: !!entry?.isIntersecting };
}

// ─── USAGE 1: Lazy Load Images ───
function LazyImage({ src, alt }) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px', // Start loading 200px before visible
  });
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={ref}>
      {(isIntersecting || loaded) && (
        <img 
          src={src} 
          alt={alt} 
          onLoad={() => setLoaded(true)} 
        />
      )}
    </div>
  );
}

// ─── USAGE 2: Infinite Scroll ───
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const { ref, isIntersecting } = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting) {
      setPage(prev => prev + 1); // Load next page
    }
  }, [isIntersecting]);

  useEffect(() => {
    fetch(`/api/items?page=${page}`)
      .then(r => r.json())
      .then(newItems => setItems(prev => [...prev, ...newItems]));
  }, [page]);

  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
      <div ref={ref} style={{ height: 1 }} /> {/* Sentinel element */}
    </div>
  );
}
```

---

## 9. usePrevious — Access Previous Render's Value

```jsx
import { useRef, useEffect } from 'react';

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current; // Returns value from PREVIOUS render
}

// ─── USAGE ───
function PriceDisplay({ price }) {
  const previousPrice = usePrevious(price);

  const direction = previousPrice !== undefined
    ? price > previousPrice ? 'up' : price < previousPrice ? 'down' : 'same'
    : 'same';

  return (
    <span className={`price price--${direction}`}>
      {direction === 'up' && '▲'}
      {direction === 'down' && '▼'}
      ${price.toFixed(2)}
    </span>
  );
}
```

---

## 10. useAsync — Generic Async Operation Handler

```jsx
import { useState, useCallback } from 'react';

function useAsync(asyncFunction) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(async (...args) => {
    setState({ data: null, error: null, loading: true });

    try {
      const data = await asyncFunction(...args);
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      throw error;
    }
  }, [asyncFunction]);

  return { ...state, execute };
}

// ─── USAGE ───
function SubmitForm() {
  const { data, error, loading, execute } = useAsync(async (formData) => {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Submission failed');
    return res.json();
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    execute({ name: e.target.name.value, email: e.target.email.value });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      {error && <p className="error">{error.message}</p>}
      {data && <p className="success">Submitted!</p>}
    </form>
  );
}
```

---

## 11. useEventListener — Declarative Event Binding

```jsx
import { useEffect, useRef } from 'react';

function useEventListener(eventName, handler, element) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element?.current ?? window;
    if (!targetElement?.addEventListener) return;

    const eventListener = (event) => savedHandler.current(event);
    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

// ─── USAGE ───
function App() {
  useEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.ctrlKey && e.key === 'k') openCommandPalette();
  });

  useEventListener('online', () => showToast('Back online!'));
  useEventListener('offline', () => showToast('You are offline'));

  return <div>...</div>;
}
```

---

## 12. useKeyPress — Keyboard Shortcut Handler

```jsx
import { useState, useEffect } from 'react';

function useKeyPress(targetKey) {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const downHandler = (e) => {
      if (e.key === targetKey) setIsPressed(true);
    };
    const upHandler = (e) => {
      if (e.key === targetKey) setIsPressed(false);
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return isPressed;
}

// ─── USAGE ───
function Game() {
  const up = useKeyPress('ArrowUp');
  const down = useKeyPress('ArrowDown');
  const left = useKeyPress('ArrowLeft');
  const right = useKeyPress('ArrowRight');

  return (
    <div className="game">
      <div className="player" style={{
        transform: `translate(${right ? 10 : left ? -10 : 0}px, ${down ? 10 : up ? -10 : 0}px)`
      }} />
    </div>
  );
}
```

---

## 13. useCopyToClipboard — Copy Text

```jsx
import { useState, useCallback } from 'react';

function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState(null);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      // Reset after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopiedText(null);
      return false;
    }
  }, []);

  return { copiedText, copy };
}

// ─── USAGE ───
function CodeBlock({ code }) {
  const { copiedText, copy } = useCopyToClipboard();

  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button onClick={() => copy(code)}>
        {copiedText ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  );
}
```

---

## 14. useToggle — Boolean State Toggle

```jsx
import { useState, useCallback } from 'react';

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

// ─── USAGE ───
function Sidebar() {
  const { value: isOpen, toggle, setFalse: close } = useToggle(false);

  return (
    <>
      <button onClick={toggle}>Menu</button>
      {isOpen && (
        <aside className="sidebar">
          <nav>...</nav>
          <button onClick={close}>Close</button>
        </aside>
      )}
    </>
  );
}
```

---

## 15. useOnScreen — Is Element Visible

```jsx
import { useEffect, useRef, useState } from 'react';

function useOnScreen(ref, rootMargin = '0px') {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isVisible;
}

// ─── USAGE: Animate on scroll into view ───
function AnimatedSection({ children }) {
  const ref = useRef(null);
  const isVisible = useOnScreen(ref, '-100px');

  return (
    <section
      ref={ref}
      className={`section ${isVisible ? 'section--visible' : ''}`}
    >
      {children}
    </section>
  );
}

// CSS:
// .section { opacity: 0; transform: translateY(20px); transition: all 0.6s; }
// .section--visible { opacity: 1; transform: translateY(0); }
```

---

## 16. Hook Composition — Combining Hooks Together

```
  THE POWER OF HOOKS: They compose!
  
  You can build complex hooks from simpler hooks:
  
  useSearchWithDebounce
    ├── useDebounce (delay search query)
    ├── useFetch (fetch results)
    └── useLocalStorage (cache recent searches)
  
  useInfiniteScroll
    ├── useIntersectionObserver (detect scroll bottom)
    ├── useState (items + page number)
    └── useFetch (load next page)
```

```jsx
// COMPOSED HOOK — Search with debounce + cache
function useSearch(endpoint) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [recentSearches, setRecentSearches] = useLocalStorage('recent-searches', []);
  const { data, error, loading } = useFetch(
    debouncedQuery.length >= 2 
      ? `${endpoint}?q=${encodeURIComponent(debouncedQuery)}` 
      : null
  );

  // Save to recent searches when results arrive
  useEffect(() => {
    if (data && debouncedQuery) {
      setRecentSearches(prev => {
        const updated = [debouncedQuery, ...prev.filter(s => s !== debouncedQuery)];
        return updated.slice(0, 10); // Keep last 10
      });
    }
  }, [data, debouncedQuery, setRecentSearches]);

  return {
    query,
    setQuery,
    results: data,
    error,
    loading,
    recentSearches,
  };
}

// ─── USAGE ───
function SearchPage() {
  const { query, setQuery, results, loading, recentSearches } = useSearch('/api/products');

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading && <Spinner />}
      {!query && recentSearches.map(s => (
        <button key={s} onClick={() => setQuery(s)}>{s}</button>
      ))}
      {results && <ResultsList items={results} />}
    </div>
  );
}
```

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  RULES FOR CUSTOM HOOKS:                                        │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  1. Name MUST start with "use" (useXxx)                         │
  │  2. Can call other hooks (useState, useEffect, custom hooks)    │
  │  3. Must follow Rules of Hooks (no conditionals, no loops)      │
  │  4. Each component gets its OWN copy of hook state              │
  │  5. Return only what the consumer needs                         │
  │  6. Accept config as parameters (make it flexible)              │
  │  7. Handle cleanup in useEffect returns                         │
  │  8. Use useCallback/useMemo for stable references               │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

> **Next Chapter**: [Complex UI Pages & Patterns →](11_Complex_UI_Pages_Patterns.md)
