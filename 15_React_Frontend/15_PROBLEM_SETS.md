# 📝 React — Problem Sets
## `15_React_Frontend` Module | Hooks · Reconciliation · Patterns · Performance

> **How to use:** Attempt every problem. Part B code runs in a Vite + TypeScript sandbox. Read 🔴 **Erklärung** if stuck.

---

## Problem Set REACT-PS1 — Hooks & Component Model

**Prerequisites:** `15_React_Frontend/01_React_Core.md`, `15_React_Frontend/02_React_Advanced.md`

---

### Part A: Predict / Debug

**A1 (Easy).** What's wrong with this component?
```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(async () => {      // ← problem here
    const res = await fetch(`/api/users/${userId}`);
    setUser(await res.json());
  }, [userId]);
  
  return <div>{user?.name}</div>;
}
```

<details><summary>Answer</summary>

**Bug:** `useEffect` callback must NOT be an `async` function. An async function returns a Promise, but `useEffect` expects either `void` or a cleanup function. The Promise returned by the async callback is ignored — and if you try to return a cleanup from inside it, it won't work.

**Fix:**
```tsx
useEffect(() => {
  let cancelled = false;           // race condition fix
  async function load() {
    const res = await fetch(`/api/users/${userId}`);
    if (!cancelled) setUser(await res.json());
  }
  load();
  return () => { cancelled = true; }; // cancel on unmount
}, [userId]);
```

🔴 **Erklärung:** Missing the `cancelled` flag causes a race condition: if `userId` changes before the first fetch completes, the stale response can overwrite the new state. Always cancel/ignore stale async effects.
</details>

---

**A2 (Medium).** This component re-renders on every parent render even though its props never change. Why, and how do you fix it?
```tsx
function ExpensiveList({ items, onItemClick }: {
  items: string[];
  onItemClick: (item: string) => void;
}) {
  console.log('ExpensiveList rendered');
  return <ul>{items.map(i => <li onClick={() => onItemClick(i)}>{i}</li>)}</ul>;
}

// Parent:
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = (item: string) => console.log(item); // ← problem
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Click {count}</button>
      <React.memo(ExpensiveList) items={['a','b','c']} onItemClick={handleClick} />
    </>
  );
}
```

<details><summary>Answer</summary>

**Problem:** `handleClick` is created as a **new function reference** on every render. `React.memo` does a shallow comparison — since `onItemClick` is a new object reference each time, `ExpensiveList` re-renders even though the logic is identical.

**Fix:**
```tsx
const handleClick = useCallback((item: string) => {
  console.log(item);
}, []); // empty deps — function never changes
```

**When NOT to useCallback:** If `handleClick` is cheap to create and `ExpensiveList` renders fast, `useCallback` adds complexity for no gain. Profile first — add `useCallback` only when profiling confirms re-renders are expensive.

🔴 **Erklärung:** `React.memo` + `useCallback` is a package deal. `React.memo` without `useCallback` on function props is useless — memo always re-renders because the function reference is new.
</details>

---

**A3 (Hard).** Trace why this causes an infinite render loop:
```tsx
function DataFetcher() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ active: true });
  
  useEffect(() => {
    fetch('/api/data?active=' + filters.active)
      .then(r => r.json())
      .then(setData);
  }, [filters]);  // ← problem
  
  return <button onClick={() => setFilters({ active: true })}>Refresh</button>;
}
```

<details><summary>Answer</summary>

**Not an infinite loop here** — but it WOULD be if `filters` was set inside the `useEffect`. The real problem: clicking "Refresh" creates a **new object** `{ active: true }`. Even though the value is identical, React's `useEffect` dependency check uses `Object.is` (reference equality). The new object reference triggers the effect again.

If the effect itself called `setFilters`, it would be an infinite loop.

**Fix (for stability):** Use a primitive value in deps:
```tsx
useEffect(() => {
  fetch('/api/data?active=' + filters.active)
    .then(r => r.json())
    .then(setData);
}, [filters.active]); // depend on the primitive, not the object
```

🔴 **Erklärung:** Never put objects or arrays directly in `useEffect` dependency arrays unless you can guarantee reference stability. Always depend on the specific primitive values you actually use.
</details>

---

### Part B: Implementation

**B1.** Build `useDebounce<T>(value: T, delay: number): T`:

```tsx
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel if value changes before delay
  }, [value, delay]);
  
  return debounced;
}

// Usage: search input that doesn't fire on every keystroke
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (debouncedQuery) {
      // API call fires 300ms after user stops typing
      fetch(`/api/search?q=${debouncedQuery}`);
    }
  }, [debouncedQuery]);
  
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

---

## Problem Set REACT-PS2 — State Architecture & Patterns

---

### Part A: Design Challenges

**A1 (Medium).** A developer uses `useState` for a form with 15 fields. On every keystroke, all 15 fields re-render. What's the correct architectural fix?

<details><summary>Answer</summary>

**Option A:** Use `useReducer` — one state update batches all field changes:
```tsx
type FormState = { name: string; email: string; /* ...13 more */ };
type FormAction = { field: keyof FormState; value: string };

function formReducer(state: FormState, action: FormAction): FormState {
  return { ...state, [action.field]: action.value };
}
```

**Option B:** Use uncontrolled inputs with `useRef` — DOM manages the value, React only reads on submit. Zero re-renders during typing.

**Option C:** Use `react-hook-form` — the industry standard. Combines uncontrolled inputs with validation, zero re-renders during typing.

**When to use each:**
- `useState`: Simple forms < 5 fields with dependent validation
- `useReducer`: Complex state with multiple interdependent fields
- `react-hook-form`: Any production form

🔴 **Erklärung:** Controlled inputs (React owns state) re-render on every keystroke. For forms with many fields, this is usually fine — React 18 batches renders. But if each re-render is expensive (complex components), uncontrolled or RHF is better.
</details>

---

**A2 (Hard).** Explain the Compound Component Pattern. Build a `<Tabs>` component using it.

<details><summary>Answer</summary>

**Compound Component Pattern:** A parent component manages shared state; child components communicate with it via Context without prop drilling.

```tsx
// tabs/Tabs.tsx
import React, { createContext, useContext, useState } from 'react';

interface TabsCtx { active: string; setActive: (id: string) => void; }
const TabsContext = createContext<TabsCtx | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Must be used inside <Tabs>');
  return ctx;
}

// Parent manages state
function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// Tab button — reads/writes context
function Tab({ id, label }: { id: string; label: string }) {
  const { active, setActive } = useTabs();
  return (
    <button
      role="tab"
      aria-selected={active === id}
      className={`tab ${active === id ? 'tab--active' : ''}`}
      onClick={() => setActive(id)}
    >
      {label}
    </button>
  );
}

// Panel — conditionally renders
function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const { active } = useTabs();
  if (active !== id) return null;
  return <div role="tabpanel">{children}</div>;
}

// Attach as static properties
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage:
<Tabs defaultTab="profile">
  <Tabs.Tab id="profile" label="Profile" />
  <Tabs.Tab id="settings" label="Settings" />
  <Tabs.Panel id="profile"><ProfileForm /></Tabs.Panel>
  <Tabs.Panel id="settings"><SettingsForm /></Tabs.Panel>
</Tabs>
```

🔴 **Erklärung:** Compound components avoid "prop drilling hell" and allow flexible composition. The alternative — passing `activeTab` and `onTabChange` to every Tab — is brittle and verbose.
</details>

---

## Problem Set REACT-PS3 — Data Fetching & Async State

---

**A1 (Medium).** A developer fetches data in `useEffect`. List three production problems this causes, and explain how React Query solves each.

<details><summary>Answer</summary>

**Problem 1: No deduplication** — Two components both call `useEffect` to fetch the same URL → two API requests. React Query deduplicates: same `queryKey` = one request, both components get the same data.

**Problem 2: No caching** — Navigate away and back → fetch fires again. React Query caches by `queryKey` with configurable `staleTime`.

**Problem 3: Race conditions** — User types fast, triggers multiple fetches — stale response arrives last and overwrites fresh data. React Query's request deduplication prevents this; the `cancelled` flag pattern is built in.

**Bonus problem: Loading state boilerplate** — Every component needs `const [loading, error, data]` useState. React Query gives `{ isLoading, isError, data, error }` automatically.
</details>

---

**A2 (Hard).** Implement optimistic update for a "like" button using React Query:

```tsx
// hooks/useLikePost.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Post { id: number; likes: number; likedByUser: boolean; }

export function useLikePost(postId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post(`/api/posts/${postId}/like`).then(r => r.data),
    
    // OPTIMISTIC UPDATE: update UI before server responds
    onMutate: async () => {
      // Cancel in-flight queries to prevent overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['posts', postId] });
      
      // Snapshot the previous value for rollback
      const previous = queryClient.getQueryData<Post>(['posts', postId]);
      
      // Optimistically update
      queryClient.setQueryData<Post>(['posts', postId], (old) =>
        old ? { ...old, likes: old.likes + 1, likedByUser: true } : old
      );
      
      return { previous }; // context for onError
    },
    
    // ROLLBACK on failure
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['posts', postId], context.previous);
      }
    },
    
    // Always refetch after mutation (ensure server state)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });
}
```

---

## Problem Set REACT-PS4 — Performance & Accessibility

---

**A1 (Medium).** Profile a list of 1000 items. What tool do you use, what metrics do you look for, and what fixes do you apply?

<details><summary>Answer</summary>

**Tool:** React DevTools → Profiler tab → Record → Interact → Stop

**Metrics to look for:**
- **Render duration** (ms per component) — grey bars = committed renders
- **Why did this render?** — click any component bar → see "Hooks changed" / "Props changed"
- **Flame chart** — width = time, stacked = parent-child

**Common findings + fixes:**

| Finding | Fix |
|---|---|
| Parent re-renders → all 1000 items re-render | Wrap list item in `React.memo` |
| `onItemClick` new ref each render | `useCallback` on the handler |
| Rendering all 1000 DOM nodes | Virtualize with `react-window` or `@tanstack/virtual` |
| Complex item layout recalculated | `useMemo` the sorted/filtered list |

🔴 **Erklärung:** Profile BEFORE optimizing. `useMemo`/`useCallback` have costs (extra memory, hook overhead). Adding them speculatively makes code harder to read for no benefit. Only add when the profiler shows that specific component is the bottleneck.
</details>

---

**A2 (Hard).** Implement a virtualized list using `react-window`:

```tsx
import { FixedSizeList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

interface Item { id: number; name: string; email: string; }

function VirtualizedUserList({ users }: { users: Item[] }) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const user = users[index];
    return (
      <div style={style} className="user-row">
        <span className="user-row__name">{user.name}</span>
        <span className="user-row__email">{user.email}</span>
      </div>
    );
  };
  
  return (
    <FixedSizeList
      height={600}           // visible window height in px
      itemCount={users.length}
      itemSize={56}          // height of each row in px
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
// Renders ~11 DOM nodes regardless of list size (600 / 56 ≈ 11 visible rows)
```

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)
