# 18b. React × System Design — UI Architecture as Distributed Systems

**Navigation**: [← SQL Foundations](18_SQL_Foundations_Commands_Operators_Functions.md) | [📚 Index](00_INDEX.md)

**Cross-links:**
- [`15_React_Frontend/`](../15_React_Frontend/) — React chapters
- [`06_OOP_Design/03_System_Design.md`](../06_OOP_Design/03_System_Design.md) — System design foundations
- [`20_Interview_Mastery/06_System_Design_Blueprint.md`](06_System_Design_Blueprint.md) — System design interview blueprint
- [`PATH_FRONTEND.md`](../PATH_FRONTEND.md) — frontend path

---

> **Reading contract**: A React component tree is a distributed system with a UI. Every system design pattern has a React parallel. By the end of this file, you'll answer "how does React handle consistency?" the same way you'd answer "how does Cassandra handle consistency?" — with the same vocabulary, different layer.

---

## Table of Contents

1. [Reconciliation → Eventual Consistency](#1-reconciliation--eventual-consistency)
2. [useState/useReducer → Event Sourcing](#2-usestateuserecuder--event-sourcing)
3. [Context API / Redux → Pub-Sub and Message Buses](#3-context-api--redux--pub-sub-and-message-buses)
4. [React Query / SWR → Cache Invalidation Strategies](#4-react-query--swr--cache-invalidation-strategies)
5. [Code Splitting → CDN and Edge Caching](#5-code-splitting--cdn-and-edge-caching)
6. [Error Boundaries → Circuit Breakers](#6-error-boundaries--circuit-breakers)
7. [Suspense → Backpressure and Rate Limiting](#7-suspense--backpressure-and-rate-limiting)
8. [Hydration (SSR/RSC) → Read Replicas and CQRS](#8-hydration-ssrrsc--read-replicas-and-cqrs)

---

## 1. Reconciliation → Eventual Consistency

### 🧠 Foundation — What the Virtual DOM is Actually Doing

React's reconciliation algorithm is solving the same problem as eventual consistency in distributed systems: **how do you bring a stale state in sync with a source of truth, efficiently?**

In distributed systems: when a replica diverges from the primary, an eventually consistent system brings it back by replaying changes (or merging state) — not by discarding the replica and starting over.

In React: when state changes, React doesn't discard the real DOM and rebuild it. It computes a minimal diff between the previous virtual DOM tree and the new one (the "commit phase"), then surgically patches only the changed DOM nodes.

```
Distributed System:                    React:
  Primary DB ──────────────────────      React State (source of truth)
      │                                      │
      │ replicate delta changes               │ compute vDOM diff
      ▼                                      ▼
  Read Replica (diverged)             Current DOM (stale)
      │                                      │
      │ apply delta                          │ apply minimal DOM patches
      ▼                                      ▼
  Replica in sync                      DOM matches current state
```

React's diffing heuristics (O(n) instead of O(n³)):
1. Elements of different types produce different trees (no cross-type diffing)
2. `key` prop tells React which list item is which across renders (stable identity)
3. Components bail out early if props haven't changed (`React.memo`, `PureComponent`)

### 💥 War Story — The Key-Less List That Corrupted Form State

A flight booking app had a list of passengers where the user could remove middle entries. When the user removed passenger 2 of 5, React — without stable `key` props — reused existing DOM nodes by position. The text inputs for passengers 3 and 4 inherited the DOM nodes that previously held passengers 2 and 3. The input `value` attribute was correct (React controlled it), but the browser's autofill state stayed in the old DOM node. Users discovered that after removing a passenger, two other passengers' phone numbers swapped — the autofill memory was poisoned.

Fix: always provide a stable, unique `key` (not the array index):

```tsx
// ❌ Using index — React reuses DOM nodes in wrong order after deletion
passengers.map((p, index) => <PassengerForm key={index} passenger={p} />)

// ✅ Using stable ID — React correctly maps old DOM nodes to the right items
passengers.map((p) => <PassengerForm key={p.id} passenger={p} />)
```

**The distributed system parallel**: This is the same as a replication system that tracks records by position (row 3) instead of by ID (record_id=42). When a row is deleted, every subsequent row's position shifts and the replica applies updates to the wrong records.

---

### 📝 Practice Challenges

1. What is the time complexity of the naive tree-diff algorithm? Why is React's O(n) heuristic safe despite not being theoretically optimal?
2. A list renders 1,000 rows. Only row 500 changes. What does React do? What does it NOT do?
3. `React.memo` is analogous to what caching strategy? What is its "cache invalidation" mechanism?

---

## 2. useState/useReducer → Event Sourcing

### 🧠 Foundation — State as a Sequence of Events

`useReducer` implements the **event sourcing pattern** at the component level.

In event sourcing (distributed systems): instead of storing current state, you store the **sequence of events** that produced that state. The current state is always a left-fold over the event log.

```
Event Log:
  [UserCreated, EmailChanged, SubscriptionUpgraded, SubscriptionCancelled]
  
Current State = reduce(events, initialState, applyEvent)
```

In React with `useReducer`:

```tsx
type Action =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'APPLY_COUPON'; code: string }
  | { type: 'CLEAR_CART' };

// The reducer IS the applyEvent function from event sourcing
function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'APPLY_COUPON':
      return { ...state, couponCode: action.code };
    case 'CLEAR_CART':
      return initialState;
  }
}

// dispatch IS publish(event) in event sourcing
const [state, dispatch] = useReducer(cartReducer, initialState);
dispatch({ type: 'ADD_ITEM', item: { id: '1', name: 'Widget', price: 9.99 } });
```

### The Time-Travel Debugger — Proof the Analogy Holds

Redux DevTools' time-travel debugging works **because** Redux is event sourcing. Every dispatched action is an event. To "undo" an action, the tool replays all events up to (but not including) the undone action. This is exactly how event sourcing replays history to reconstruct state at any point in time.

```
Events:   [ADD_ITEM] → [ADD_ITEM] → [APPLY_COUPON] → [REMOVE_ITEM]
State at t=2: { items: [A, B], coupon: null }
State at t=3: { items: [A, B], coupon: 'SAVE10' }
State at t=4: { items: [A], coupon: 'SAVE10' }

To undo APPLY_COUPON: replay [ADD_ITEM, ADD_ITEM, REMOVE_ITEM] against initialState
→ { items: [A], coupon: null }
```

### useState vs useReducer — When to Apply Which

| Use `useState` when | Use `useReducer` when |
|--------------------|-----------------------|
| Single primitive | Multiple related fields |
| State transitions are simple | Next state depends on current state in complex ways |
| No "history" needed | You want undo/redo or audit trail |
| No branching logic | Many different actions can change the same state |

---

### 📝 Practice Challenges

1. Implement an `undoReducer` HOF: `undoReducer(reducer)` returns a new reducer whose state is `{ past: S[], present: S, future: S[] }` and handles `UNDO` and `REDO` actions.
2. In event sourcing, how do you handle a schema change — e.g., a field that events used to set no longer exists on the entity? What's the React equivalent when the action shape changes?
3. What's the downside of event sourcing if you have billions of events and need the current state? What system design pattern addresses this? What's the React equivalent?

---

## 3. Context API / Redux → Pub-Sub and Message Buses

### 🧠 Foundation — Decoupled Communication

Both Context API and Redux solve the same problem as publish-subscribe message buses: **components (services) should not need to know who else is interested in a state change — they publish to the bus, and subscribers receive it**.

**Without pub-sub (prop drilling / direct coupling):**

```
App → Header → UserAvatar (need user)
App → Sidebar → ProfileLink (need user)
App → Content → WelcomeMessage (need user)
// Must thread `user` prop through every intermediate component
```

**With Context (pub-sub at UI scale):**

```tsx
// Publisher (producer) — declares the topic and its current value
const UserContext = createContext<User | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={user}>
      {/* Any descendant can subscribe — no prop drilling */}
      <Header />
      <Sidebar />
      <Content />
    </UserContext.Provider>
  );
}

// Subscriber (consumer) — receives updates without knowing who published
function UserAvatar() {
  const user = useContext(UserContext); // subscribe to UserContext "topic"
  return <img src={user?.avatarUrl} />;
}
```

### Redux as a Message Bus

Redux is more explicit about the pub-sub model:

```
dispatch(action)           ←→  publish(event) to the message bus
store.subscribe(listener)  ←→  subscribe(handler) to the message bus
reducer(state, action)     ←→  event handler that processes the message
```

The Redux store is the bus. Actions are messages. Reducers are consumers. The selector is the topic filter (`useSelector(state => state.user.name)`).

### 💥 War Story — Context Re-render Storm That Killed Scroll Performance

A dashboard app used a single `AppContext` to share everything: user, theme, cart, notifications, real-time metrics. Real-time metrics updated every 2 seconds. Every context update re-rendered **every component that subscribed to AppContext** — even components that only needed the user's name and didn't care about metrics.

On a 60fps scroll through a data table, every 2-second metric update triggered 200 component re-renders during scroll. On lower-end devices, scroll dropped to ~15fps.

Fix: split the monolithic context into topic-specific contexts:

```tsx
// ❌ Monolithic context — all updates trigger all subscribers
const AppContext = createContext({ user, theme, cart, metrics });

// ✅ Split contexts — updates only trigger relevant subscribers
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const CartContext = createContext(cart);
const MetricsContext = createContext(metrics); // only MetricsDashboard subscribes
```

**The distributed system parallel**: A single Kafka topic for all events causes every consumer to filter irrelevant events. Separate topics by domain — consumers subscribe to only what they need.

---

### 📝 Practice Challenges

1. React Context doesn't debounce updates — every `value` change triggers re-renders in all consumers. What system design pattern addresses the equivalent in a message bus?
2. `useSelector` in Redux gives fine-grained subscriptions (only re-renders when the selected slice changes). What distributed system concept is this closest to? (Hint: it's not pub-sub)
3. Zustand, Jotai, and Recoil are "atomic" state managers. How does their model differ from Redux's single-store model in terms of message bus architecture?

---

## 4. React Query / SWR → Cache Invalidation Strategies

### 🧠 Foundation — The Hardest Problem in Computer Science

"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

React Query and SWR are **client-side cache managers** for server state. They implement the same cache invalidation strategies discussed in distributed systems design.

### Stale-While-Revalidate (SWR) Strategy

The namesake strategy: return cached (potentially stale) data immediately, then revalidate in the background. The UI shows something instantly instead of a loading spinner.

```tsx
// SWR library — implements stale-while-revalidate at the component level
const { data: user, isLoading } = useSWR('/api/user', fetcher, {
  revalidateOnFocus: true,      // revalidate when tab regains focus
  revalidateOnReconnect: true,  // revalidate when network reconnects
  refreshInterval: 60_000,      // poll every 60s (TTL-based invalidation)
  dedupingInterval: 2_000,      // collapse duplicate requests within 2s
});
// data is immediately returned from cache (stale), fetch happens in background
```

In distributed systems, this is what CDNs do: serve stale content from edge cache while the CDN fetches fresh content from origin. The user gets a fast response; the next request (or this one after the background fetch) gets fresh content.

### Cache Invalidation Strategies in React Query

```tsx
const queryClient = useQueryClient();

// Strategy 1: Time-based invalidation (TTL)
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000,   // cache valid for 5 minutes
  gcTime: 10 * 60 * 1000,     // garbage collect after 10 minutes
});

// Strategy 2: Event-based invalidation (explicit invalidation after mutation)
const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    // ← this is "cache miss on next request" — forces fresh fetch
  }
});

// Strategy 3: Optimistic updates (write-ahead, rollback on failure)
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    ); // ← optimistic write (like a write-ahead log)
    return { previous };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous); // ← rollback
  },
});
```

### 💥 War Story — The Stale Cart That Caused Double Charges

An e-commerce app cached the shopping cart with `staleTime: Infinity` (never revalidate automatically). If a user opened two tabs and added an item in one, the other tab still showed the stale cart. When they checked out from the stale tab, the backend received duplicate add-to-cart events and charged them twice before the cart reconciliation job caught it.

Fix: invalidate cart cache on focus and after every mutation:

```tsx
const { data: cart } = useQuery({
  queryKey: ['cart'],
  queryFn: fetchCart,
  staleTime: 0,             // always stale — fetch on every mount
  revalidateOnFocus: true,  // sync between tabs
});

// After any mutation to cart:
queryClient.invalidateQueries({ queryKey: ['cart'] });
```

**The distributed system parallel**: This is the stale cache problem in multi-region writes. If writes go to region A and region B serves reads from a stale replica, users see inconsistent data until the replication lag resolves.

---

### 📝 Practice Challenges

1. Implement a custom React hook `usePoll(url, interval)` that polls an endpoint every `interval` ms and returns `{ data, isLoading, error }`. How does it differ from React Query's `refetchInterval`?
2. React Query's `gcTime` (garbage collection time) is analogous to what distributed caching concept? What happens when it expires vs when `staleTime` expires?
3. Optimistic updates implement a write-ahead pattern. What must happen at the rollback stage to ensure UI consistency? What's the distributed system equivalent (hint: it involves a log)?

---

## 5. Code Splitting → CDN and Edge Caching

### 🧠 Foundation — Move Assets Closer to Where They're Needed

Code splitting and CDN edge caching both solve the same problem: **don't send a user data they don't need yet, and serve what they do need from the closest possible location**.

### Bundle Splitting as Data Sharding by Route

Before code splitting, every user downloads ALL JavaScript for ALL routes, even routes they never visit:

```
Bundle (4.2MB):
  ├── Login page code        (50KB)
  ├── Dashboard code         (200KB)
  ├── Admin panel code       (800KB) ← 95% of users never see this
  ├── Report generator code  (1.2MB) ← only power users, only sometimes
  └── Charts/visualization   (1.9MB)

Every user downloads 4.2MB to see the login page.
```

After code splitting with `React.lazy` + `Suspense`:

```tsx
// Lazy-load routes — each route is a separate chunk, fetched on demand
const Dashboard = React.lazy(() => import('./Dashboard'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const ReportGen  = React.lazy(() => import('./ReportGenerator'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin"     element={<AdminPanel />} />
        <Route path="/reports"   element={<ReportGen />} />
      </Routes>
    </Suspense>
  );
}
// Initial bundle: 50KB (login only)
// Dashboard chunk: 200KB — fetched when user first visits /dashboard
// AdminPanel chunk: 800KB — only downloaded by admins
```

**The distributed system parallel**: This is sharding data by access pattern. A CDN serves static assets from edge nodes close to users — the origin only gets traffic when the edge doesn't have the content. Webpack chunks are the "assets"; the browser cache is the "edge node."

### Content Hashing — Cache Busting via Immutable URLs

Webpack appends a content hash to bundle filenames: `dashboard.a3f8b2.js`. If the bundle changes, the hash changes, the URL changes — old cached versions are automatically busted, not overwritten.

```
// Same file, different content:
dashboard.a3f8b2.js  ← version 1, cached indefinitely at CDN
dashboard.9c4e1a.js  ← version 2, new URL, fetched fresh

// Browser/CDN caching strategy:
Cache-Control: public, max-age=31536000, immutable
// ← hash in URL = content-addressed storage = safe to cache forever
```

**The distributed system parallel**: This is content-addressed storage (CAS) — the same technique used by Git (content hash = object ID), IPFS, and Cassandra SSTable files. If the hash matches, the content is identical; skip the network fetch.

### 💥 War Story — The 4.2MB Bundle That Lost the Mobile Market

An analytics startup launched a React app with no code splitting. Their product manager noticed mobile conversion was 6× worse than desktop. Investigation: on mobile in emerging markets (3G, ~2 Mbps), the 4.2MB bundle took 17 seconds to download before the login page appeared. Users left before seeing anything.

After route-based code splitting + tree-shaking unused chart library variants: initial bundle dropped from 4.2MB to 380KB. Login page appeared in under 2 seconds on 3G. Mobile conversion improved 4×.

```
Before: monolithic bundle                After: split bundle
─────────────────────                    ───────────────────
main.js: 4.2MB                           main.js: 380KB (login + layout only)
                                         dashboard.js: 200KB
                                         charts.js: 1.9MB (lazy, on demand)
                                         admin.js: 800KB (lazy, role-gated)
```

---

### 📝 Practice Challenges

1. A webpack bundle includes 3 charting libraries because 3 different engineers added them independently. How does tree-shaking interact with this situation? What's the safe fix?
2. `React.lazy` only works for default exports. Why? What's the workaround for named exports?
3. Prefetching: `<link rel="prefetch" href="dashboard.chunk.js">` loads a chunk before the user navigates there. What CDN concept is this equivalent to? When is it risky?

---

## 6. Error Boundaries → Circuit Breakers

### 🧠 Foundation — Contain Failures, Don't Let Them Cascade

A **circuit breaker** in distributed systems prevents cascading failures: if service B keeps failing, stop calling it immediately (open the circuit) rather than letting every request wait for a timeout and block threads.

React **Error Boundaries** implement the same pattern at the component tree level: if a component crashes during render, the error boundary catches it and renders a fallback — preventing the crash from propagating up and unmounting the entire app.

```
Distributed System (Circuit Breaker):
  API Gateway → Payment Service (failing)
      │
      │ CLOSED: let requests through (normal)
      │ OPEN: stop calling, return fallback immediately
      │ HALF-OPEN: allow one probe request through
      
React (Error Boundary):
  App → Dashboard → MetricsWidget (throws during render)
      │
      │ No error boundary: crash propagates up → entire App unmounts
      │ Error boundary: catches at boundary → renders fallback UI
```

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error }; // ← "open the circuit"
  }

  componentDidCatch(error, info) {
    // Log to error tracking service (Sentry/Datadog)
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI onRetry={() => this.setState({ hasError: false })} />;
      //     ↑ "fallback response" from the circuit breaker
    }
    return this.props.children;
  }
}

// Use like a circuit breaker at the right granularity:
<ErrorBoundary fallback={<p>Dashboard unavailable</p>}>
  <Dashboard />  {/* ← only this subtree is "protected" */}
</ErrorBoundary>
```

### The Granularity Problem — Same as Circuit Breaker Scope

A single error boundary around the entire app is like a circuit breaker that takes down all routes when one service fails. The right granularity is per-feature:

```tsx
// ❌ One boundary around everything — one bad widget kills the whole page
<ErrorBoundary>
  <Header />
  <Sidebar />
  <MetricsWidget />   {/* crashes → whole page shows fallback */}
  <RecentActivity />
</ErrorBoundary>

// ✅ Per-feature boundaries — failures are contained
<Header />
<Sidebar />
<ErrorBoundary fallback={<p>Metrics unavailable</p>}>
  <MetricsWidget />   {/* crashes → only this shows fallback */}
</ErrorBoundary>
<ErrorBoundary fallback={<p>Activity feed unavailable</p>}>
  <RecentActivity />  {/* unaffected by MetricsWidget crash */}
</ErrorBoundary>
```

---

### 📝 Practice Challenges

1. Error boundaries don't catch errors in event handlers (`onClick`, etc.) or in async code (`setTimeout`, promises). Why? How do you handle those?
2. The "half-open" state in a circuit breaker probes one request through to test if the service recovered. How would you implement an equivalent "retry" mechanism for an Error Boundary?
3. A circuit breaker tracks the failure rate over a sliding window. Error boundaries trigger on a single error. How would you build an Error Boundary that only shows the fallback after N errors in T seconds?

---

## 7. Suspense → Backpressure and Rate Limiting

### 🧠 Foundation — Don't Request More Than You Can Handle

**Backpressure** in stream processing: when a consumer is slower than a producer, tell the producer to slow down — don't buffer unboundedly.

**React Suspense**: when a component needs data that isn't ready yet, it "suspends" — throwing a promise that tells React "wait for this before rendering me." React pauses rendering that subtree and shows a fallback. When the data is ready, React resumes.

```
Backpressure:
  Producer (DB) ─── too fast ──→ Consumer (app)
                ←── "slow down" ──── (backpressure signal)

React Suspense:
  Component ─── "I need this data" ──→ throw Promise
  React     ─── show fallback        ─ pause rendering subtree
  Data ready ── resume rendering ────
```

### Concurrent Features — Prioritized Rendering

React 18's concurrent mode is the UI equivalent of a priority queue in a task scheduler:

```tsx
// startTransition marks state updates as "low priority"
// Urgent updates (input) run first; transitions run when idle
import { useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e) {
    setQuery(e.target.value);                    // ← urgent: update input immediately
    startTransition(() => {
      setResults(filterResults(e.target.value)); // ← low priority: can be interrupted
    });
  }

  return (
    <>
      <input value={query} onChange={handleSearch} />
      {isPending ? <Spinner /> : <Results data={results} />}
    </>
  );
}
```

**The distributed system parallel**: This is priority queuing. Urgent requests (user-visible input) get processed before background work (search result computation). Kubernetes `QoS` classes, AWS SQS message priorities, and Kafka consumer group priorities all implement the same concept.

### useDeferredValue — Debouncing with System-Managed Timing

```tsx
const deferredQuery = useDeferredValue(query);
// React automatically defers the expensive re-render until the browser is idle
// This is rate limiting at the browser scheduler level — no setTimeout needed
```

**The distributed system parallel**: Token bucket / leaky bucket rate limiters — smooth out bursts, process at a sustainable rate. `useDeferredValue` lets the browser decide the rate instead of the developer guessing a debounce timeout.

---

### 📝 Practice Challenges

1. What's the difference between `useTransition` and `useDeferredValue`? When would you use each?
2. `Suspense` requires data fetching libraries to implement a specific protocol (throw a promise). What design pattern does this implement? (Hint: it's an Inversion of Control pattern)
3. A streaming API sends 100 events per second. A React component re-renders on each event. Without rate limiting, what happens? Implement a `useThrottled(value, ms)` hook that limits renders.

---

## 8. Hydration (SSR/RSC) → Read Replicas and CQRS

### 🧠 Foundation — Separate Read and Write Concerns

**CQRS** (Command Query Responsibility Segregation): use different models for reads (queries) and writes (commands). Read models are optimized for fast queries; write models are optimized for consistency.

React Server Components implement the UI equivalent of CQRS:

```
CQRS:
  Write path:  Client → Command → Write Model → Event → Update Read Model
  Read path:   Client → Query  → Read Model (optimized for display)

React Server Components:
  Write path:  Server Action → Database → Revalidate cache
  Read path:   Server Component → fetches data at server → sends HTML to client
                                  (read model: pre-joined, pre-formatted data)
```

### Server-Side Rendering → Read Replicas

Traditional SSR: the server handles the first render, sends HTML to the client. The client then "hydrates" (attaches React event handlers to the HTML):

```
Client → GET /page
Server:
  1. Fetch data from DB (read replica, not primary)
  2. Render React tree to HTML string
  3. Send HTML + JSON state
  
Client:
  4. Display HTML immediately (fast first paint — like serving from a CDN replica)
  5. Download React bundle
  6. Hydrate: attach event listeners to existing HTML (reuse, don't rebuild)
```

The HTML from SSR is like a **read replica snapshot** — the client can use it immediately without waiting for the "primary" (JavaScript bundle + data fetch).

### 💥 War Story — The Hydration Mismatch That Broke Every Admin Dashboard

A SaaS company added SSR to their React app. The server rendered the page with server time (UTC). The client, on hydration, re-rendered with local browser time. For users in UTC-8, "Last seen: 3pm" became "Last seen: 11am" after hydration — the time jumped backward. React logged hydration mismatch warnings, but the team ignored them. Two months later, a bug report: "timestamps in the admin dashboard are sometimes wrong, sometimes right." The root cause was hydration mismatch — the client replaced the server HTML with a different render, but only sometimes (race condition with when React 18 committed the hydration).

Fix: ensure server and client render the same value:

```tsx
// ❌ Different output on server vs client
function Timestamp({ date }: { date: Date }) {
  return <span>{date.toLocaleTimeString()}</span>;
  // Server: UTC locale; Client: user's local timezone
}

// ✅ Suppress until client has hydrated (for time-sensitive values)
function Timestamp({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <span>--:--</span>; // server renders this; client replaces
  return <span>{date.toLocaleTimeString()}</span>; // client renders user's timezone
}

// ✅ Better: format on server with explicit timezone
function Timestamp({ date, timezone }: { date: Date; timezone: string }) {
  const formatted = date.toLocaleTimeString('en-US', { timeZone: timezone });
  return <span>{formatted}</span>; // same on server and client
}
```

---

### 📝 Practice Challenges

1. React 18's Selective Hydration lets the browser hydrate parts of the page based on user interaction (e.g., hydrate the navbar first because the user hovered over it). What system design pattern is this?
2. React Server Components never hydrate on the client — their output is static. What CDN caching strategy is this equivalent to?
3. The CAP theorem says you can't have Consistency, Availability, and Partition tolerance simultaneously. React's SSR/hydration makes a similar trade-off. Describe it in CAP terms: what does React sacrifice in each SSR mode (static, SSR, ISR)?

---

## Quick Reference: React Architecture → System Design Analogy

```
React Concept                 │ System Design Parallel
──────────────────────────────┼────────────────────────────────────────────────
Virtual DOM reconciliation    │ Eventual consistency / delta replication
key prop on list items        │ Stable record identity in distributed writes
useReducer(reducer, action)   │ Event sourcing (events → fold → current state)
Redux DevTools time-travel    │ Event log replay (reconstruct state at any time)
Context.Provider              │ Pub-Sub message bus / topic
useSelector (Redux)           │ Consumer group with topic filter
React Query staleTime         │ Cache TTL
React Query invalidateQueries │ Explicit cache invalidation after mutation
Optimistic update + rollback  │ Write-ahead log + rollback on failure
stale-while-revalidate (SWR)  │ CDN serve-stale + background origin fetch
React.lazy + Suspense         │ Lazy loading / on-demand asset delivery
Content hash in bundle name   │ Content-addressed storage (immutable URLs)
Error Boundary (per-feature)  │ Circuit breaker (per service boundary)
Error Boundary fallback UI    │ Circuit breaker fallback response
startTransition (low priority)│ Priority queue (background task scheduling)
useDeferredValue              │ Rate limiting / token bucket (smooth updates)
SSR → hydration               │ Read replica → primary sync on write
Server Components (no hydrate)│ Static edge cache (CDN, immutable content)
Hydration mismatch            │ Read replica serving stale data on first read
ISR (Incremental Static Regen)│ Cache-aside with TTL-triggered origin refresh
```

---

*[Back to Index](00_INDEX.md) | [React Chapters](../15_React_Frontend/) | [System Design Blueprint](06_System_Design_Blueprint.md) | [Frontend Path](../PATH_FRONTEND.md)*
