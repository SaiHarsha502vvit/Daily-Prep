> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Testing](07_React_Testing.md)

---

# ⚡ React Performance & Enterprise Patterns

---

## 5W1H — Why React Performance Optimization?

- **WHAT**: The process of minimizing rendering bottlenecks, network delays, and bundle sizes in React applications.
- **WHY**: Slow applications cause high bounce rates and poor user experience. Over-rendering drains battery life and makes UIs feel unresponsive.
- **WHO**: Senior frontend engineers scaling applications with large DOM trees or complex interactive data structures.
- **WHEN**: _After_ measuring a real performance problem. Premature optimization (like wrapping every function in `useCallback`) often makes code worse and slower due to memoization overhead.
- **HOW**: By memoizing expensive operations (`React.memo`, `useMemo`), splitting bundles (`React.lazy`), virtualizing large lists, and strictly managing state locations to avoid prop-drilling renders.

---

### Historical Evolution

React performance optimization evolved from manual class-component tuning to automatic concurrent rendering, reducing the need for developer-managed memoization over time.

| Year | Milestone |
|------|-----------|
| 2015 | PureComponent and shouldComponentUpdate provide shallow comparison for class components |
| 2018 | React 16.6 adds React.memo, useMemo, and Profiler API for function components |
| 2019 | React 16.8 adds useCallback — stable function references for memoized children |
| 2022 | React 18 introduces concurrent rendering and automatic batching, reducing manual optimizations |
| 2024 | React 19 Actions and useTransition make async UI transitions first-class |

Before React.memo, class components used PureComponent to skip re-renders. The shift to function components required new tools (useMemo, useCallback), but React 18's concurrent rendering made many manual optimizations unnecessary by prioritizing urgent updates. The trend is toward less manual memoization, not more.

**Predecessor:** shouldComponentUpdate (2015) — the class-component method that manually controlled rendering eligibility
**Modern anchor:** Today memoization is used surgically after profiling; React 18's automatic batching and concurrent features handle many cases implicitly

### Production Reality

| Failure Mode | Where It Bites | Mitigation |
|--------------|---------------|------------|
| **Re-render storm** | Unmemoized callback passed to 500-row table causes every row to re-render on parent state change | Profile with React DevTools Profiler; apply `React.memo` and `useMemo` only after measuring; virtualize long lists |
| **Bundle bloat** | Lazy-loaded routes not code-split correctly; entire app ships as one chunk | Verify `React.lazy` + `Suspense` boundaries produce separate chunks in build output; audit with bundle analyzer |
| **Context thrashing** | Performance-optimized component subscribed to over-broad context defeats all memoization | Split context by domain or use atomic stores (Zustand) so updates only reach actual subscribers |
| **React 19 useTransition abuse** | Wrapping synchronous UI updates (button clicks, form validation) in `startTransition` defers feedback users need | Reserve `useTransition` for non-urgent background updates (filtering large datasets); keep user-facing state updates synchronous |

Performance failures are counterintuitive: the most common cause of slow React apps is not missing memoization but misplacing state and over-using concurrent features where synchronous updates are expected.

---

### Invariant: Memoize Only When Measured

> **Invariant:** Memoization should only be applied after React DevTools Profiler confirms a measurable render bottleneck.

**Why this must hold:** `React.memo`, `useMemo`, and `useCallback` incur a runtime cost: dependency-array comparison on every render and cached value storage in memory. For cheap computations (< 1ms) or components without memoized children, this overhead exceeds the recomputation cost — making the code more complex and potentially slower, not faster.

**If violated:** Developers ship "memoization wallpaper" — every component wrapped in `React.memo`, every function in `useCallback`, every computation in `useMemo`. The result is larger memory footprint, harder-to-read code, and no actual performance gain. The correct workflow is: (1) observe lag with Profiler, (2) identify the slow component, (3) apply targeted memoization, (4) re-measure.

---

## Part 1: Performance — Avoid Unnecessary Re-renders

> WHEN DOES A COMPONENT RE-RENDER?
>
> 1. Its state changes (useState setter called)
> 2. Its parent re-renders (props may have changed)
> 3. Context value it consumes changes
>
> REACT RE-RENDER ≠ DOM UPDATE
> Re-render: React calls your component function → creates virtual DOM
> DOM update: React diffs old vs new virtual DOM → updates only changed nodes
>
> Most re-renders are fine! Only optimize when you MEASURE a problem.

### Key Optimization Techniques

```jsx
// 1. React.memo — Skip re-render if props haven't changed
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
});
// Only re-renders if items reference changes (shallow comparison)

// 2. useMemo — Memoize expensive calculations
const sortedData = useMemo(() => {
  return [...data].sort((a, b) => a.score - b.score); // expensive sort
}, [data]);

// 3. useCallback — Stable function references for memoized children
const handleDelete = useCallback((id: string) => {
  setItems(prev => prev.filter(i => i.id !== id));
}, []); // stable reference

// 4. Lazy loading — Code split by route
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}

// 5. Virtualization — Render only visible items in long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated row height
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.key} style={{
            position: 'absolute', top: virtualRow.start, height: virtualRow.size,
          }}>
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
// 10,000 items? Only ~20 DOM nodes rendered at a time!
```

---

### Memoization Decision Flowchart

```
Is the component re-rendering unnecessarily?
│
├─ NO  → don't memoize (premature optimization)
│
└─ YES → Is it a child component receiving object/array/function props?
         │
         ├─ NO  → check why parent re-renders (state too high?)
         │
         └─ YES → Use React.memo on the child
                   │
                   └─ Are you still re-rendering?
                      │
                      ├─ NO  → done ✓
                      │
                      └─ YES → Are you passing new object/array/function refs each render?
                                │
                                ├─ NO  → check Context (Context thrashing)
                                │
                                └─ YES → useMemo / useCallback the props
                                          │
                                          └─ Profile with React DevTools Profiler first
```

**Rule of thumb:** Don't memoize until Profiler shows a problem. Premature memoization adds memory overhead and code complexity for no gain.

---

## Part 2: Enterprise Project Structure

```
src/
├── api/                   # API client & domain-specific APIs
│   ├── client.ts          # Base HTTP client (fetch wrapper)
│   ├── users.ts           # User-related API calls
│   └── orders.ts
├── components/            # Shared/reusable UI components
│   ├── ui/                # Primitives: Button, Modal, Input
│   ├── forms/             # Form components with validation
│   └── layout/            # Header, Sidebar, Footer
├── features/              # Feature-based modules (vertical slices)
│   ├── auth/
│   │   ├── components/    # LoginForm, RegisterForm
│   │   ├── hooks/         # useAuth, useLogin
│   │   ├── store/         # Auth slice/store
│   │   └── types.ts
│   ├── products/
│   │   ├── components/    # ProductList, ProductCard
│   │   ├── hooks/         # useProducts, useProductSearch
│   │   └── types.ts
│   └── cart/
├── hooks/                 # Shared custom hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── lib/                   # Third-party setup (axios, dayjs)
├── pages/                 # Route-level page components
├── store/                 # Global state (Redux store config)
├── types/                 # Shared TypeScript types
├── utils/                 # Pure utility functions
└── App.tsx
```

---

## Part 3: Key Enterprise Patterns

```tsx
// ── FEATURE FLAG SYSTEM ──
const FeatureFlagContext = createContext<Record<string, boolean>>({});

function useFeatureFlag(flag: string): boolean {
  const flags = useContext(FeatureFlagContext);
  return flags[flag] ?? false;
}

function NewCheckout() {
  const isNewCheckoutEnabled = useFeatureFlag("new-checkout");
  return isNewCheckoutEnabled ? <NewCheckoutFlow /> : <LegacyCheckout />;
}

// ── ROLE-BASED ACCESS CONTROL ──
function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) ?? false;
}

function AdminPanel() {
  const canManageUsers = usePermission("users:manage");
  if (!canManageUsers) return <AccessDenied />;
  return <UserManagement />;
}

// ── OPTIMISTIC UPDATES (React Query) ──
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) =>
      old.map((t) => (t.id === newTodo.id ? { ...t, ...newTodo } : t)),
    );
    return { previous }; // save for rollback
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previous); // rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] }); // refetch truth
  },
});
```

---

## Part 4: Environment & Deployment

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ENVIRONMENT VARIABLES (Vite):                                                   │
│  .env                → VITE_API_URL=http://localhost:8080                        │
│  .env.production     → VITE_API_URL=https://api.myapp.com                        │
│  Access: import.meta.env.VITE_API_URL                                            │
│  RULE: Only VITE_ prefixed vars are exposed to client!                           │
│                                                                                  │
│  BUILD & DEPLOY PIPELINE:                                                        │
│  npm run build → dist/ folder (static HTML/CSS/JS)                               │
│  Deploy dist/ to: Vercel, Netlify, S3+CloudFront, Nginx                          │
│                                                                                  │
│  ESSENTIAL TOOLING:                                                              │
│  Build: Vite (fast HMR, optimized builds)                                        │
│  Lint: ESLint + Prettier (consistent code)                                       │
│  Type check: tsc --noEmit (CI check)                                             │
│  Test: Vitest (unit/integration) + Playwright (E2E)                              │
│  CI: GitHub Actions → lint + type-check + test + build + deploy                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## React Interview Must-Knows

```
Q: "What is the virtual DOM?"
A: In-memory representation of the real DOM. When state changes, React creates
   a new virtual DOM tree, diffs it against the old one, and applies only
   the minimal set of real DOM changes. This is called reconciliation.

Q: "Why do we need keys in lists?"
A: Keys help React identify which items changed/added/removed during reconciliation.
   Without stable keys, React re-renders the entire list.

Q: "useState vs useRef?"
A: useState: triggers re-render when value changes. Use for UI state.
   useRef: persists value across renders without triggering re-render.
   Use for DOM refs, timers, previous values.

Q: "When would you use useReducer over useState?"
A: When state logic is complex (multiple sub-values, next state depends on
   previous), when state transitions need to be testable separately, or
   when passing dispatch down avoids prop drilling callbacks.

Q: "How do you handle stale closures in useEffect?"
A: Use functional updates (setCount(c => c + 1)), include deps in
   dependency array, use refs for values you don't want to trigger re-runs.
```

---

## 🏋️ Practice Challenges

**Challenge 1 (Performance Diagnostics):** A user complains that typing into a Search `<input>` is extremely laggy. The `<input>` is located at the top of a `<ProductDashboard>` component that also renders 5,000 `<ProductCard>` components. Explain exactly why the lag occurs and two ways to fix it.

<details><summary>Answer</summary>

**Why it occurs:** Every keystroke updates a `searchQuery` state variable in `<ProductDashboard>`. This triggers a re-render of the entire dashboard, which forces React to recursively re-render all 5,000 `<ProductCard>` components synchronously, blocking the main thread and freezing the input.
**Fixes:**

1. **Debounce the input / Local State:** Move the `<input>` into a separate `<SearchBox>` component that manages its own keystroke state, and only passes the final query up to the dashboard after a debounce.
2. **React.memo:** Wrap `ProductCard` in `React.memo` so they skip rendering if their props haven't changed.
3. **useTransition:** Wrap the dashboard filtering logic in `startTransition` so React knows the input update is urgent, but the list rendering is low priority.
</details>

**Challenge 2 (Memoization Traps):** You wrap a heavy child component in `React.memo()`. You pass it `items={list}` and `onSelect={() => setSelection()}`. The child still re-renders every time the parent renders. Why?

<details><summary>Answer</summary>

The inline arrow function `() => setSelection()` creates a **new function reference** in memory every single time the parent renders. `React.memo` does a shallow comparison (`oldProps === newProps`). Since `newFunction !== oldFunction`, `React.memo` thinks the props changed and forces a re-render.
**Fix:** Wrap the callback in `useCallback` to preserve its memory reference across renders.

</details>

---

## 🔗 Cross-References

| Topic                  | Related Content                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Hooks**              | [Hooks Deep Dive](03_Hooks_Deep_Dive.md) — useMemo, useCallback                                       |
| **State Management**   | [State Management](04_State_Management.md) — avoiding render waterfalls                               |
| **Component Patterns** | [Component Patterns](02_Component_Patterns.md)                                                        |
| **React Router**       | [React Router](06_React_Router.md) — lazy loading                                                     |
| **Web Performance**    | [System Design](../20_Interview_Mastery/06_System_Design_Blueprint.md) — General frontend performance |


---

## Reality Check

**"React performance work is adding memo everywhere"** ? The leverage hierarchy runs opposite to the folklore: STATE PLACEMENT first (the keystroke state at app root re-rendering the world — moving it down eliminates the problem memo would have bandaged), COMPOSITION second (children-as-props naturally isolates static subtrees — the free memo nobody uses), LIST VIRTUALIZATION third (the 5000-row DOM is slow regardless of render counts), and only then memoization of measured hotspots (with stable inputs, or it silently does nothing — the memo defeated by one inline object prop is ritual, not optimization). The React Compiler automates the last tier; it cannot move your state or restructure your tree — the high-leverage tiers remain human work.

**"Re-renders are the performance problem"** ? Re-renders are cheap function calls producing descriptions; the COSTS are what they trigger: reconciliation over huge trees, expensive component bodies, effect cascades (the effect chain where each render schedules the next — measured as multiple commits per interaction), and above all DOM mutation volume. The diagnostic discipline: React Profiler answers WHICH components rendered and why (the wasted-render map), but the browser Performance panel answers whether it MATTERS (main-thread time, long tasks) — optimizing render counts that? total 3ms while the real 200ms lives in a layout thrash is the most common misdirected React optimization.

**"Slow lists need memo on the row component"** ? Row memoization caps UPDATE cost; it does nothing for MOUNT cost — 5000 rows is 5000 component instances and DOM nodes regardless of memo, and the answer at that scale is windowing (render the visible ~30, virtualize the rest), with its own contract: rows need stable keys and predictable heights (or a measurement strategy), in-page find breaks (content not in DOM), and accessibility needs explicit row-count semantics. The decision boundary is roughly content-height-versus-viewport: a few dozen rows want memo and clean keys; thousands want virtualization and memo becomes a detail inside it.

**"Concurrent features are automatic performance"** ? useTransition/useDeferredValue change SCHEDULING, not speed: they mark updates as interruptible so urgent work (typing) preempts heavy work (filtering 10k items) — the total computation is unchanged or slightly higher; what improves is INPUT responsiveness (INP, felt smoothness). Their contract has edges: transitions need the heavy render to actually be interruptible (one monolithic slow component defeats slicing — composition again), deferred values render TWICE by design (stale-then-fresh — memo the expensive consumer or pay double), and neither replaces virtualization/state-placement (they reschedule the cost those techniques remove). Concurrent features are the last mile of an architecture that is already right — applied to a wrong one, they reschedule the jank.

**"Performance regressions are caught by being careful in review"** ? Render-cascade and bundle regressions are INVISIBLE in diffs (the innocent prop that broke memoization three levels down; the import that pulled a 200KB tree): the durable defenses are mechanical — the React DevTools Profiler habit on touched flows (record-interact-read, why-did-this-render enabled), bundle-size budgets per route in CI (the size-limit gate that fails the PR), and a Lighthouse/INP assertion on the critical pages ([19_FE performance chapter's budget discipline, aimed at React's specific regression classes). Careful review catches architecture; only instrumentation catches the cascade a one-line diff just caused.
