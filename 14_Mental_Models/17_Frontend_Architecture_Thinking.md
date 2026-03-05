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
> />   ← Impossible to maintain, impossible to customize
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
> IMPERATIVE (jQuery era):       DECLARATIVE (React era):
> "HOW to update the DOM"        "WHAT the DOM should look like"
>
> // Show/hide loading           // The UI is a function of state
> if (loading) {                 function App({ loading, data }) {
> el.show();                     if (loading) return <Spinner />;
> spinner.addClass('active');    return <DataList items={data} />;
> } else {                       }
> el.hide();
> renderList(data);            // React handles the DOM updates
> }                              // You just describe the END STATE
>
> MENTAL SHIFT:
> Stop thinking "when X happens, change Y"
> Start thinking "given this state, what should the screen show?"
>
> State → Render → DOM → User Event → State Change → Re-render
> ↑                                                     │
> └─────────────────────────────────────────────────────┘
> (unidirectional data flow)


---

## Mental Model 5: Optimistic vs Pessimistic Updates

## Question            │  Optimistic  │  Pessimistic

| Can user undo?      |  ✓           |  ✗ |
| Is it reversible?   |  ✓           |  ✗ |
| Failure common?     |  Rarely      |  Sometimes |
| Impact of failure?  |  Low         |  High |

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
> Server / Global / Local / URL
>
> 2. How does DATA FLOW?
> Props down, events up? Context? Global store?
>
> 3. What are the LOADING/ERROR states?
> Skeleton, spinner, error boundary, retry?
>
> 4. How will this SCALE?
> 10 items vs 10,000 items (virtualization?)
> 1 form field vs 50 fields (form library?)
>
> 5. Can I COMPOSE smaller components?
> Instead of building one monolithic component
>
> 6. Is it ACCESSIBLE?
> Keyboard navigable? Screen reader friendly?


---

*The best frontend code doesn't look clever — it looks obvious. Anyone on the team should read a component and immediately understand what it does.*


---

> **Navigation**: [< Previous](16_Distributed_Systems_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_Production_Debugging_Thinking.md)