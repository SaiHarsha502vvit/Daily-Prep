> **Navigation**: [< Previous](16_Distributed_Systems_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_Production_Debugging_Thinking.md)

# Mental Models — Frontend Architecture Thinking

## How to Think About Frontend Architecture

> Frontend isn't "just UI" — it's a distributed system where
> state lives in multiple places, the network is unreliable,
> and every user has a different browser, screen, and connection.
>
> These mental models help you REASON about frontend problems
> instead of just memorizing React patterns.

---

## Mental Model 1: State Belongs Somewhere

```
THE STATE LOCATION MAP

Every piece of data in your app belongs at ONE level.
Putting it at the wrong level = bugs, complexity, or perf issues

┌───────────────────────────────────────────────────┐
│  SERVER STATE                                     │
│  (lives on the server, Frontend has a COPY)       │
│  Examples: user profile, product list, orders     │
│  Tool: React Query / SWR (server state managers)  │
│  Key: Cache it, sync it, invalidate it properly   │
└───────────────────────────┬───────────────────────┘
                            │
┌───────────────────────────▼────────────────────────┐
│  GLOBAL CLIENT STATE                               │
│  (shared across many components)                   │
│  Examples: auth token, theme, locale, cart         │
│  Tool: Context, Redux, Zustand                     │
│  Key: Minimize what's truly global                 │
└───────────────────────────┬────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────┐
│  LOCAL COMPONENT STATE                            │
│  (belongs to ONE component or a small subtree)    │
│  Examples: form input, dropdown open/closed,      │
│  current tab, modal visibility                    │
│  Tool: useState, useReducer                       │
│  Key: Start here. Lift only when needed.          │
└───────────────────────────┬───────────────────────┘
                            │
┌───────────────────────────▼───────────────────────┐
│  URL STATE                                        │
│  (encoded in the URL — shareable, bookmarkable)   │
│  Examples: current page, search query, filters,   │
│  sort order, selected tab                         │
│  Tool: React Router, useSearchParams              │
│  Key: If a user should be able to share a link    │
│       to this exact view → it belongs in the URL  │
└───────────────────────────────────────────────────┘

DECISION: Ask "Where does this data COME FROM?"
→ Server? Use React Query.
→ User action, shared widely? Use global store.
→ Single component? Use useState.
→ Should be in the URL? Use router state.
```

---

## Mental Model 2: The Render Cascade

```
UNDERSTANDING WHEN AND WHY COMPONENTS RE-RENDER

A component re-renders when:
1. Its STATE changes
2. Its PARENT re-renders (unless memoized)
3. The CONTEXT it consumes changes

THE CASCADE:
┌──────────────┐
│    App        │ ← setState here
│  ┌──────────┐│
│  │ Header   ││ ← re-renders (child of App)
│  └──────────┘│
│  ┌──────────┐│
│  │ Content  ││ ← re-renders
│  │┌────────┐││
│  ││ List   │││ ← re-renders
│  ││┌──────┐│││
│  │││Item 1││││ ← re-renders (even if unchanged!)
│  │││Item 2││││ ← re-renders
│  │││Item 3││││ ← re-renders
│  ││└──────┘│││
│  │└────────┘││
│  └──────────┘│
└──────────────┘

RULE OF THUMB: Re-renders are CHEAP unless:
• The component is expensive to render (complex computation)
• There are THOUSANDS of list items
• It triggers DOM mutations (layout thrashing)

DON'T optimize until you MEASURE a problem.
Premature optimization = the root of all evil (Knuth)
```

---

## Mental Model 3: Composition Over Configuration

> THE REACT WAY: Build small pieces, compose them together
>
> ❌ BAD: One mega-component with tons of props
>
> <DataTable
> data={data}
> sortable={true}
> filterable={true}
> paginated={true}
> searchable={true}
> exportable={true}
> selectable={true}
> expandable={true}
> ...30 more props
> /> ← Impossible to maintain, impossible to customize
>
> ✅ GOOD: Composable components
>
> <DataTable data={data}>
> <Table.Search />
> <Table.Header sortable>
> <Table.Column field="name" />
> <Table.Column field="email" />
> </Table.Header>
> <Table.Body expandable />
> <Table.Pagination perPage={20} />
> </DataTable>
> ← Each piece is independent, reusable, replaceable
>
> PRINCIPLE: If a component has > 10 props, it's probably doing
> too much. Break it into composed sub-components.

---

## Mental Model 4: UI = f(State)

> THE DECLARATIVE PARADIGM
>
> IMPERATIVE (jQuery era): DECLARATIVE (React era):
> "HOW to update the DOM" "WHAT the DOM should look like"
>
> // Show/hide loading // The UI is a function of state
> if (loading) { function App({ loading, data }) {
> el.show(); if (loading) return <Spinner />;
> spinner.addClass('active'); return <DataList items={data} />;
> } else { }
> el.hide();
> renderList(data); // React handles the DOM updates
> } // You just describe the END STATE
>
> MENTAL SHIFT:
> Stop thinking "when X happens, change Y"
> Start thinking "given this state, what should the screen show?"
>
> State → Render → DOM → User Event → State Change → Re-render
> ↑ │
> └─────────────────────────────────────────────────────┘
> (unidirectional data flow)

---

## Mental Model 5: Optimistic vs Pessimistic Updates

## Question │ Optimistic │ Pessimistic

| Can user undo? | ✓ | ✗ |
| Is it reversible? | ✓ | ✗ |
| Failure common? | Rarely | Sometimes |
| Impact of failure? | Low | High |

---

## Mental Model 6: Loading States Are a Feature

```
EVERY ASYNC OPERATION HAS 4 STATES:

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  IDLE     │ →  │ LOADING  │ →  │ SUCCESS  │    │  ERROR   │
│  (initial)│    │ (pending)│    │ (data!)  │    │ (failed) │
└──────────┘    └──────────┘    └──────────┘    └───────────┘
                                     ↑               │
                                     └── RETRY ──────┘

Most bugs happen because developers forget a state:
• What if the request takes 10 seconds? (loading)
• What if the server returns 500? (error)
• What if the list is empty? (success but no data)
• What if the user navigates away mid-request? (cleanup)

SKELETON SCREENS (perceived performance):
┌────────────────────────────────┐
│  ████████████  ←  shimmer     │  Users perceive this as
│  ████████                     │  30% faster than a spinner
│  ██████████████████           │
│  ████████                     │
└────────────────────────────────┘
```

---

## Mental Model 7: The Boundary Pattern

> SEPARATE "HOW DATA IS FETCHED" FROM "HOW DATA IS DISPLAYED"
>
> ❌ Tightly coupled:
> function UserProfile() {
> const [user, setUser] = useState(null);
> useEffect(() => {
> fetch('/api/user/1').then(r => r.json()).then(setUser);
> }, []);
> return <div>{user?.name}</div>;
> }
> → Can't reuse UserProfile display with different data source
> → Can't test display without mocking fetch
>
> ✅ Boundary pattern:
> // Container (data boundary)
> function UserProfileContainer() {
> const { data: user } = useQuery('user', fetchUser);
> return <UserProfileView user={user} />;
> }
>
> // Pure display (no data fetching)
> function UserProfileView({ user }) {
> return <div>{user.name}</div>;
> }
> → Display is testable, reusable, and pure
> → Data source can change without touching the display
>
> BOUNDARIES also apply to:
>
> - Error boundaries (catch rendering errors)
> - Suspense boundaries (loading states)
> - Layout boundaries (different page structures)

---

## Mental Model 8: Accessibility Is Architecture

> ACCESSIBILITY (a11y) ISN'T A FEATURE — IT'S A QUALITY ATTRIBUTE
>
> Like security: bolting it on later is expensive and incomplete.
> Build it into your component architecture from Day 1.
>
> THE KEYBOARD TEST:
> Can a user complete every task using ONLY a keyboard?
> Tab → focus moves logically
> Enter/Space → activates buttons/links
> Escape → closes modals/dropdowns
> Arrow keys → navigate within lists/menus
>
> THE SEMANTIC HTML TEST:
> ❌ <div onClick={}>Click me</div>
> ✅ <button onClick={}>Click me</button>
>
> ❌ <div class="header">Title</div>
> ✅ <h1>Title</h1>
>
> THE SCREEN READER TEST:
> Does every image have alt text?
> Do form inputs have labels?
> Are dynamic updates announced (aria-live)?
>
> BUSINESS REASON: 15% of the world's population has a disability.
> Legal and ethical obligation + larger user base.

---

## The Frontend Architecture Decision Framework

> WHEN STARTING A NEW FEATURE, ASK:
>
> 1. Where does the STATE live?
>    Server / Global / Local / URL
> 2. How does DATA FLOW?
>    Props down, events up? Context? Global store?
> 3. What are the LOADING/ERROR states?
>    Skeleton, spinner, error boundary, retry?
> 4. How will this SCALE?
>    10 items vs 10,000 items (virtualization?)
>    1 form field vs 50 fields (form library?)
> 5. Can I COMPOSE smaller components?
>    Instead of building one monolithic component
> 6. Is it ACCESSIBLE?
>    Keyboard navigable? Screen reader friendly?

---

_The best frontend code doesn't look clever — it looks obvious. Anyone on the team should read a component and immediately understand what it does._

## NEW DIAGRAM — State Location Decision Tree (Where Does State Live?)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: State Location Decision Tree — Where Does Each State Belong?       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE QUESTION: "Where should this state live?"                              │
│  Answer by scope of the state:                                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  ① SCOPE: Local to ONE component (never shared)                      │    │
│  │     └── → useState / useRef (React) or local variable (Vanilla)     │    │
│  │         Examples: form input value, toggle open/closed, temp state   │    │
│  │         Why NOT higher: no need to share, keep it close              │    │
│  │                                                                       │    │
│  │  ② SCOPE: Shared across MULTIPLE sibling/parent components           │    │
│  │     │                                                                  │    │
│  │     ├── Just 2-3 components sharing?                                  │    │
│  │     │   └── → Lift state to parent + pass as props                  │    │
│  │     │       (simplest, no extra library)                             │    │
│  │     │                                                                    │    │
│  │     └── More than 3 components, or deep prop-drilling?              │    │
│  │         └── → Context API (React) or Component Composition          │    │
│  │             Examples: theme, auth user, locale, current route        │    │
│  │             Why NOT Redux: too much boilerplate for shared state     │    │
│  │                                                                       │    │
│  │  ③ SCOPE: Global (entire app needs it)                               │    │
│  │     │                                                                  │    │
│  │     ├── Needs complex state logic (many actions, reducers)?         │    │
│  │     │   └── → Redux Toolkit / Zustand / MobX                        │    │
│  │     │       Examples: shopping cart, complex forms, multi-step wizard│    │
│  │     │                                                                    │    │
│  │     ├── Simple global state (few values)?                            │    │
│  │     │   └── → Zustand (minimal boilerplate, React-agnostic)         │    │
│  │     │       Examples: user preferences, UI mode (dark/light)        │    │
│  │     │                                                                    │    │
│  │     └── Very simple (just a few values)?                             │    │
│  │         └── → Context or even a plain module (singleton)            │    │
│  │                                                                       │    │
│  │  ④ SCOPE: Server-fetched data (changes over time, needs caching)    │    │
│  │     │                                                                  │    │
│  │     └── → TanStack Query (React Query) / SWR / Apollo Client        │    │
│  │         Examples: user profile, dashboard data, API responses        │    │
│  │                                                                       │    │
│  │         WHY NOT local state or Redux?                                 │    │
│  │         • Cache + background refetch needed                          │    │
│  │         • Loading/error state management is complex                  │    │
│  │         • Pagination + infinite scroll built-in                      │    │
│  │         • Stale-while-revalidate for UX smoothness                  │    │
│  │                                                                       │    │
│  │  ⑤ SCOPE: Form state (complex validation, multi-step)               │    │
│  │     │                                                                  │    │
│  │     └── → React Hook Form + Zod validation                          │    │
│  │         Examples: multi-step forms, dynamic fields, real-time validate│    │
│  │                                                                       │    │
│  │  ⑥ SCOPE: URL state (shareable, bookmarkable, browser history)      │    │
│  │     │                                                                  │    │
│  │     └── → React Router / URL params / query string                  │    │
│  │         Examples: filter selections, page number, search query       │    │
│  │                                                                       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  STATE TOOL DECISION SUMMARY:                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Local component only            → useState / useRef                  │    │
│  │  2-3 sibling components          → Lift to parent + props            │    │
│  │  Cross-component (theme, auth)   → Context API                        │    │
│  │  Complex global (cart, wizard)   → Redux Toolkit / Zustand            │    │
│  │  Server data (API cache, pagination) → TanStack Query / SWR          │    │
│  │  Complex forms                   → React Hook Form + Zod             │    │
│  │  URL/shareable state             → React Router / URL params         │    │
│  │                                                                       │    │
│  │  AVOID: Putting server data in Redux (duplicate caching logic)       │    │
│  │  AVOID: Over-engineering with Redux for theme/user prefs (use Context)│    │
│  │  AVOID: Prop drilling > 2 levels without Context                     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  RENDERING TRIGGER DECISION:                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  State change → Which components re-render?                          │    │
│  │                                                                       │    │
│  │  Context + frequent changes? → Consider:                             │    │
│  │  • Split into multiple contexts (auth, theme, cart separate)        │    │
│  │  • Use useSyncExternalStore for custom listener-based state         │    │
│  │  • Consider Zustand (selector-based, fine-grained subscriptions)    │    │
│  │                                                                       │    │
│  │  Rule of thumb: A component should only subscribe to the state       │    │
│  │  slice it actually uses (selector pattern).                          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1979 | Reenskaug | MVC at Xerox PARC — first component architecture |
| 1985 | Stroustrup | RAII — resource management as architectural pattern |
| 2013 | Facebook | React — virtual DOM and declarative component model |
| 2014 | Facebook | Flux — unidirectional data flow architecture |
| 2015 | Abramov & Clark | Redux — predictable state container |
| 2019 | React Team | React Hooks — stateful logic as composable functions |

**Evolution narrative**: Frontend architecture as a formal discipline traces to Trygve Reenskaug's 1979 MVC pattern at Xerox PARC, which established the foundational insight that data (Model), presentation (View), and logic (Controller) are separate concerns that should be composed, not mixed. Bjarne Stroustrup's 1985 RAII pattern (Resource Acquisition Is Initialization) provided the resource-management principle that state management libraries still follow: resources acquired in constructor are released in destructor, making state lifecycle explicit. Facebook's 2013 React introduced the virtual DOM and declarative component model, making UI a pure function of state — the "UI = f(state)" mental model. Flux (2014) formalized unidirectional data flow as an architectural constraint. Dan Abramov and Andrew Clark's 2015 Redux implemented Flux's predictability with a single immutable state tree and pure reducer functions. React Hooks (2019) completed the evolution by making stateful logic composable as functions rather than class hierarchies.

**Modern practice anchor**: Today's frontend architecture (React 18, Next.js, Vue 3 Composition API) descends directly from the Reenskaug-MVC → Flux → Redux → Hooks lineage: separating concerns, enforcing unidirectional data flow, and composing behavior through functions rather than inheritance.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Next.js SSR/CSR Hydration Mismatch — Production Errors

**What goes wrong**: Server renders a page with `new Date().toLocaleString()` — the server's timezone is UTC, the browser's is PST. The server HTML has date string `2024-01-15 12:00:00 UTC`. The browser hydrates and the client re-renders with `2024-01-15 04:00:00 PST`. React detects the mismatch and throws a hydration error. The page renders but with a blank section where the date should appear.

**Cost**: Users see blank sections. `An error occurred in the hydration...` messages in production console. Sentry error volume spikes. Requires hotfix deployment to fix — common around DST transitions.

**Debug workflow**:
1. Add hydration mismatch detection to CI: use `jest-dom` matchers (`toBeInTheDocument`) and run SSR output validation against a known-good HTML snapshot.
2. Use `suppressHydrationWarning` only for the specific element, not globally — document the reason (e.g., "browser timezone differs from server").
3. For time-sensitive rendering, use `useEffect` to set time-dependent content after hydration, preventing the mismatch entirely.
4. Use ISO timestamps (`toISOString()`) for server-client comparison — they produce identical strings regardless of timezone.

### Failure Mode 2: State Location Mismatch — Redux vs Context vs Local State Wrong Choice

**What goes wrong**: A developer puts cart item count in React Context. The cart updates frequently (every item add). Every Context consumer re-renders on every cart change — even components far from the cart, like the user profile avatar. The product page (unrelated to cart) re-renders 20+ times per user interaction, dropping from 60fps to 12fps.

**Cost**: User-perceived lag on product pages. Core Web Vitals (INP) scores degrade. Google ranking drops for performance-sensitive queries. MTTR is high because the bug is invisible in development (small user sessions) but appears with real shopping behavior.

**Debug workflow**:
1. Use React DevTools Profiler: record a session, filter by "updates" count per component. Any component with >10 updates per user action has a state location problem.
2. Apply `React.memo()` and `useMemo()` for expensive rendering components: `const ExpensiveList = React.memo(({ items }) => ...)` — prevents re-render unless `items` reference changes.
3. For frequently-changing values (cart count), lift to the lowest common ancestor and use `useCallback` for stable event handler references.
4. Use Zustand or Jotai for state management: these atomic-state libraries only re-render components subscribed to the specific atom that changed, not the entire tree.

### Failure Mode 3: Inline Object/Function Props — Component Re-Render Storm

**What goes wrong**: A parent component renders 1,000 `<ListItem>` components. Each `<ListItem>` receives `onClick={ () => handleClick(item.id) }` — a new function object on every render. Because `onClick` is a new reference, every `ListItem` re-renders even though only one item was clicked. 1,000 components re-render for a single click.

**Cost**: 60fps drops to 5-15fps during user interaction. Users experience lag on every click. Only visible with 100+ list items, so it slips through development testing.

**Debug workflow**:
1. Add `why-did-you-render` package in development: it logs when components re-render and why, making inline-props bugs immediately visible.
2. Use `useCallback` for event handlers: `onClick={useCallback((id) => handleClick(id), [handleClick])}` — stable reference across renders.
3. Use `useMemo` for derived data: `const filteredItems = useMemo(() => items.filter(...), [items])` — prevents derived value recreation.
4. For large lists (1000+ items), use virtualized rendering: `react-window` or `react-virtualized` renders only visible items, reducing render count by 100x.

### Modern Production Tools

- **React DevTools Profiler**: Record a production session. Identify which components render most frequently and why. The "ranked" view shows which components cause the most downstream renders.
- **Sentry hydration monitoring**: Sentry's React SDK captures hydration mismatch errors in production. Group by error message to find which pages/components are affected.
- **Core Web Vitals (INP) monitoring**: Use Datadog RUM or Google PageSpeed Insights. INP (Interaction to Next Paint) > 200ms signals re-render storms.
- **`react-window` / `react-virtualized`**: Virtualized list rendering for 1000+ items. Only ~20 DOM nodes regardless of list size — eliminates re-render storm at the DOM level.
- **Zustand / Jotai atomic state**: Replace Context with atomic state management. Only components subscribed to the specific changed atom re-render — solves the Redux/Context state location problem at the architecture level.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**State location determines re-render scope**. The invariant is that in a reactive UI framework, data changes flow through components via state, and the location of that state determines which components re-render when the data changes. Lifting state up makes siblings re-render together; context providers affect all consumers; prop drilling adds unnecessary re-renders for intermediate components. The internal mechanism is the **virtual DOM diff** (React) or **fine-grained reactivity** (Solid, Svelte): when state changes, the framework recalculates what to update. Knowing where state lives lets you predict and control the update surface.

### Variants Comparison

| State Management | Scope | Re-render Behavior | Complexity | SSR Support |
| --- | --- | --- | --- | --- |
| useState (local) | Single component | Component + children | Low | Works (client-side) |
| Context API | Provider subtree | All consumers | Medium | Needs care |
| Redux | Global store | All connected components | High | Excellent |
| Zustand | Global or local | Only subscribed components | Low | Excellent |
| TanStack Query | Server state | On data change | Medium | Excellent |

### Decision Table

| State Type | Default Choice | When to Switch |
| --- | --- | --- |
| UI state (toggle, input) | useState | Shared → context |
| Server data (API) | TanStack Query | Needs optimistic updates |
| Global app state | Zustand | Need time-travel → Redux |
| Form state | React Hook Form | Complex validation → Zod |

---

> **Navigation**: [< Previous](16_Distributed_Systems_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_Production_Debugging_Thinking.md)


---

## Reality Check

**"Frontend architecture means choosing the framework"** → The framework decides component syntax; the ARCHITECTURE is everything the framework leaves open: where state lives (server cache vs client store vs URL vs component), how data flows down and events flow up, what boundary separates fetching from rendering, and which layer owns errors. Two React apps can differ architecturally more than a React and a Vue app — the framework choice is one column of the decision table, and rarely the one that determines maintainability.

**"State management means picking a store library"** → The prior question is CLASSIFYING the state, because each class has a different natural home: server data belongs in a request cache (stale-while-revalidate semantics — most "global state" is actually this), UI state belongs local to its component, shareable view state belongs in the URL (survives refresh, enables links — chronically underused), session identity in context, and only genuinely cross-cutting client state earns a store. The classic over-architecture is one global store swallowing all five classes; the mental model is a routing table for state, not a warehouse.

**"Component design is about reusability"** → Premature reusability is the frontend's premature abstraction: the parameterized-for-everything component with fourteen props that every consumer configures differently is HARDER to change than three duplicated variants would have been. The architecture-grade questions are ownership and boundaries — which component owns this state, what is presentational versus connected, where does composition happen — and reuse is extracted AFTER the third genuine repetition, when the shared shape is proven rather than predicted.

**"Rendering performance is optimization work for later"** → Rendering ARCHITECTURE is a day-one decision wearing a performance costume: what triggers re-render (state placement determines blast radius — state high in the tree re-renders the tree), what data is derived versus stored (derived-at-render eliminates sync bugs AND re-render triggers), where lists virtualize, and what memo boundaries exist. Retrofitting these means moving state, which means touching every consumer — the "later" in "optimize later" is a refactor, while the day-one version was a placement choice. Distinguish this from micro-optimization, which genuinely can wait.

**"The backend defines the data; the frontend displays it"** → The frontend has its OWN data layer with its own design decisions: the shape components consume should be the VIEW shape, not the API shape (the anti-corruption mapping at the fetch boundary is what keeps API churn from rippling through components), caching and invalidation policy is frontend-owned (when is a list stale after an edit?), and optimistic updates are a distributed-systems decision (show success before confirmation — with rollback semantics). Frontends that consume API shapes raw couple every screen to every endpoint version — the same coupling mistake backends learned to fence off a decade earlier, replayed in the browser.
