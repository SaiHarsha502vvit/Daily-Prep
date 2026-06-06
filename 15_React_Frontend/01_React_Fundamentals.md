**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next: Hooks Deep Dive →](03_Hooks_Deep_Dive.md)
🧠 **Mental Model**: See [Frontend Architecture Thinking](../14_Mental_Models/17_Frontend_Architecture_Thinking.md)

[!IMPORTANT]
**📌 Prerequisite:** This guide assumes JavaScript ES6+ knowledge.
If you haven't studied JavaScript yet, start with **[16_JavaScript/01_JS_Foundations.md](../16_JavaScript/01_JS_Foundations.md)** first.
Key concepts you need: Arrow functions, Destructuring, Array methods (map/filter/reduce), Modules (import/export), Closures, Promises.

---

# ⚛️ React Fundamentals — Core Concepts from Scratch

Everything you need to understand before writing production React — Components, JSX, Props, State

---

## 5W1H — Why This Chapter?

```
┌──────────────────────────────────────────────────────────────────────┐
│  WHAT: React is a JavaScript LIBRARY (not framework!) for building   │
│        user interfaces using composable components.                  │
│                                                                      │
│  WHY:  The DOM is SLOW. Updating it directly is error-prone.         │
│        jQuery (2006): $("#app").html(newContent) — simple but        │
│        chaotic at scale. No structure, no predictability.            │
│        React (2013): Introduced a DECLARATIVE model where            │
│        UI = f(state). You describe WHAT you want, React figures      │
│        out HOW to update the DOM efficiently.                        │
│                                                                      │
│  WHO:  Facebook (now Meta). Jordan Walke created it in 2013          │
│        to solve Facebook's newsfeed rendering problems.              │
│        Used by: Facebook, Instagram, Netflix, Airbnb, Uber.          │
│                                                                      │
│  WHEN: After learning HTML, CSS, and JavaScript (especially          │
│        ES6+ features: arrow functions, destructuring, modules).      │
│                                                                      │
│  WHERE: Runs in the browser (React DOM), on mobile (React Native),   │
│         on servers (Next.js SSR), even in terminals (Ink).           │
│                                                                      │
│  HOW:  Write components → React builds a Virtual DOM tree →          │
│        Diffing algorithm compares old vs new tree → Only changed     │
│        DOM nodes are updated (reconciliation).                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Where It's Used in Real World

- **Facebook/Instagram**: The original use case — React powers the dynamic newsfeeds, stories, and messaging UIs for billions of users.
- **Netflix**: Uses React for its TV interface and browsing experience, optimized for low-powered smart TV hardware.
- **Airbnb**: Entire booking flow and search interface built with React, with server-side rendering via Next.js for SEO.
- **Shopify**: Admin dashboard and storefront editor use React for complex drag-and-drop UI interactions.
- **Discord**: Real-time chat, voice channels, and server management — all React-powered with custom virtual scrolling.

### 🔗 Cross-References to DSA Concepts

| React Concept | Underlying DSA/Algorithm |
|---|---|
| Virtual DOM Diffing | [Tree Algorithms — DFS/BFS](../03_Algorithms/05_Trees.md) |
| Reconciliation (O(n) heuristic) | [Algorithm Thinking](../03_Algorithms/01_Algorithm_Thinking.md) |
| useState hooks array | [Arrays](../02_Data_Structures/01b_Arrays.md) |
| Context API (Provider tree) | [Trees & Heaps](../02_Data_Structures/01f_Trees_Heaps.md) |
| Event delegation (single listener) | [Design Patterns — Observer](../06_OOP_Design/02_Design_Patterns.md) |
| useMemo / React.memo (caching) | [DP — Memoization](../03_Algorithms/04b_DP_Fundamentals.md) |
| Component composition | [OOP — Composition vs Inheritance](../06_OOP_Design/01_OOPS_Principles.md) |

---

## Part 1: What is React and Why?

### The Problem React Solves

```
BEFORE REACT — The DOM Management Problem:
───────────────────────────────────────────

Imagine you're building a chat app. A new message arrives.
You need to:
  1. Find the message list in the DOM
  2. Create a new <li> element
  3. Set its text content
  4. Append it to the list
  5. Scroll to bottom
  6. Update the unread counter
  7. Update the badge on the tab
  8. If the sender is online, update their avatar border

Now imagine 50 such interactions happening simultaneously.
With jQuery/vanilla JS, you're manually tracking and updating
each DOM element. One bug = stale UI or missing update.

ANALOGY: Imperative is like giving turn-by-turn directions.
         "Go left, then right, then straight for 2 miles..."
         Declarative is like giving the destination.
         "Take me to 123 Main St" — the GPS figures out HOW.

React's insight: What if the UI was just a FUNCTION of data?
                 data changes → entire UI re-described → React
                 figures out the minimal DOM updates needed.
```

### React's Core Philosophy

React is a LIBRARY for building user interfaces (not a framework!)

KEY IDEAS:
1. **Component-Based**: UI = tree of reusable components
2. **Declarative**: Describe WHAT to render, React handles HOW
3. **Virtual DOM**: React diffs changes, updates only what changed
4. **One-Way Data Flow**: Data flows Parent → Child via props

MENTAL MODEL:
Traditional: Manually update DOM when data changes (imperative)
React: UI = f(state) — UI is a FUNCTION of state (declarative)
When state changes → React re-renders → diffs → updates DOM

### Library vs Framework — Why This Matters

```
FRAMEWORK (Angular, Vue):             LIBRARY (React):
"I call YOUR code"                    "YOU call MY code"
• Full structure imposed               • Only handles the View layer
• Routing built-in                     • Choose your own router
• HTTP client built-in                 • Choose your own fetching
• Form handling built-in               • Choose your own form lib
• Opinionated                          • Flexible (but more decisions)

REASONING: React only does ONE thing — render UI from data.
Everything else (routing, state, forms) is your choice.
This is why React has such a large ecosystem (Next.js, Redux, etc.)
```

---

## Part 2: JSX — JavaScript + HTML

### 5W1H: What is JSX and Why?

```
┌──────────────────────────────────────────────────────────────────────┐
│  WHAT: JSX = JavaScript XML. A syntax extension that lets you       │
│        write HTML-like code inside JavaScript.                       │
│                                                                      │
│  WHY:  Without JSX, creating UI requires React.createElement()      │
│        calls — deeply nested and unreadable. JSX makes the          │
│        component tree visually obvious, like reading HTML.           │
│                                                                      │
│  HOW IT WORKS INTERNALLY:                                            │
│  Step 1: You write JSX: <h1>Hello</h1>                              │
│  Step 2: Babel/SWC COMPILER transforms it at build time:            │
│          React.createElement('h1', null, 'Hello')                   │
│  Step 3: createElement returns a plain JS object:                    │
│          { type: 'h1', props: { children: 'Hello' } }              │
│  Step 4: This object is a React Element (the Virtual DOM node)      │
│  Step 5: React reads this object and creates the real DOM node      │
│                                                                      │
│  CRITICAL INSIGHT: JSX is NOT HTML. It's syntactic sugar for        │
│  function calls. The browser NEVER sees JSX — only compiled JS.     │
└──────────────────────────────────────────────────────────────────────┘
```

```jsx
// JSX is syntactic sugar for React.createElement()
// ❌ Without JSX:
React.createElement('h1', { className: 'title' }, 'Hello World');

// ✅ With JSX:
<h1 className="title">Hello World</h1>

// JSX RULES:
// 1. Return single root element (use <> fragment if needed)
// 2. className instead of class
// 3. htmlFor instead of for
// 4. camelCase for attributes: onClick, onChange, tabIndex
// 5. JavaScript expressions in curly braces: {variable}
// 6. Self-closing tags: <img />, <input />, <br />

function UserCard({ user }) {
  return (
    <>
      <h2>{user.name}</h2>
      <p>{user.age > 18 ? 'Adult' : 'Minor'}</p>
      {user.isActive && <span className="badge">Active</span>}
      <ul>
        {user.hobbies.map((hobby, i) => (
          <li key={i}>{hobby}</li>  // key is REQUIRED in lists
        ))}
      </ul>
    </>
  );
}
```

---

## Part 3: Components — Function Components (Modern React)

### 5W1H: What is a Component?

```
WHAT: A component is a JavaScript FUNCTION that returns React elements
      (JSX). It's a reusable, self-contained piece of UI.

WHY:  The same reason we use functions in programming — REUSABILITY
      and ABSTRACTION. Instead of writing the same login form HTML
      in 5 places, you write <LoginForm /> once.

ANALOGY — LEGO BRICKS:
  Each component is a LEGO brick:
  • Small, self-contained, reusable
  • Has a defined shape (props = inputs)
  • Can be composed into larger structures
  • Can be replaced without rebuilding everything
  • Same brick can be used in different builds

  A webpage is like a LEGO set:
  Header brick + Sidebar brick + Content brick + Footer brick
  Each brick manages its own appearance and behavior.

HOW REACT RENDERS A COMPONENT:
  1. React calls your function: Greeting({ name: "Alice" })
  2. Function returns JSX: <h1>Hello, Alice!</h1>
  3. JSX compiles to: { type: 'h1', props: { children: 'Hello, Alice!' } }
  4. React uses this object to create/update the actual DOM node
  5. If called again with same props → React can SKIP the DOM update

CLASS vs FUNCTION COMPONENTS:
  Class components (2013-2018): stateful with lifecycle methods
  Function components (2019+): stateful with Hooks ← MODERN STANDARD
  React Hooks (2019) made class components obsolete for new code.
  99% of new React code uses function components.
```

```jsx
// ── Simple Component ──
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function variant
const Greeting = ({ name }) => <h1>Hello, {name}!</h1>;

// ── Component Composition ──
function App() {
  return (
    <div>
      <Header />
      <main>
        <Greeting name="Alice" />
        <Greeting name="Bob" />
      </main>
      <Footer />
    </div>
  );
}

// COMPONENT TREE:
//       App
//      / | \
//  Header Main Footer
//         |
//      Greeting (×2)
```

---

🔬 **Section Challenge — Part 3: Components — Function Components**

**Challenge 1 (Reasoning):** React says "component render must be a pure function". What does PURE mean and what breaks if it's impure?
<details><summary>Answer</summary>

Pure = same inputs (props + state) always return same output (JSX). No side effects during render. Impure examples: writing to a global variable, calling fetch(), reading mutable globals. Why it breaks: React may call your render function multiple times in development (StrictMode) or abort renders mid-way (Concurrent Mode). If render has side effects, those effects run multiple times with unpredictable results. Rule: ALL side effects must go inside `useEffect`, not in the render body.
</details>

**Challenge 2 (Structural):** Parent has `useState`. Parent re-renders. Child receives the SAME props as before. Does Child re-render?
<details><summary>Answer</summary>

YES — by default, when a parent re-renders, ALL children re-render too, even if their props didn't change. React re-calls the child function. This is why `React.memo()` exists: it wraps a component to skip re-render if props are shallowly equal. Key insight: re-rendering ≠ DOM update. React re-renders (calls the function), then reconciles — only changed DOM nodes are actually updated. Unnecessary re-renders waste CPU time but don't always cause visible issues.
</details>

## Part 4: Props — Data Flows Down

### 5W1H: What are Props?

```
WHAT: Props ("properties") are the INPUTS to a component.
      They are READ-ONLY data passed from parent to child.

WHY:  Components need data to render. But if every component
      fetched its own data, you'd have chaos. Props enforce a
      clear, predictable data flow: Parent → Child.

ANALOGY — FUNCTION ARGUMENTS:
  Props are EXACTLY like function arguments.
  function greet(name) {}  →  function Greeting({ name }) {}
  greet("Alice")           →  <Greeting name="Alice" />

  Just as you can't modify function arguments (immutable),
  you can't modify props. They are READ-ONLY.

ANALOGY — RESTAURANT ORDER:
  Parent = customer placing an order (passes props)
  Child = kitchen receiving the order (reads props)
  The kitchen can't change what the customer ordered.
  It can only COOK based on what it received.

ONE-WAY DATA FLOW — WHY IT MATTERS:
  Data flows DOWN: Parent → Child → Grandchild
  Events flow UP: Grandchild → Child → Parent (via callbacks)

  This makes debugging EASY:
  "Where did this data come from?" → Follow props UP the tree.
  "Why did this component re-render?" → A prop changed.

  Angular uses TWO-WAY binding: data flows both ways.
  React chose ONE-WAY because it's more predictable at scale.
  Facebook found two-way binding caused cascading updates
  that were impossible to debug in large applications.
```

```jsx
// Props = read-only data passed from parent to child
// NEVER modify props directly!

function ProductCard({ title, price, onAddToCart }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>${price.toFixed(2)}</p>
      <button onClick={() => onAddToCart(title)}>
        Add to Cart
      </button>
    </div>
  );
}

// Parent passes data + callbacks
function ProductList() {
  const handleAdd = (title) => console.log(`Added: ${title}`);
  
  return (
    <div>
      <ProductCard title="Laptop" price={999.99} onAddToCart={handleAdd} />
      <ProductCard title="Mouse" price={29.99} onAddToCart={handleAdd} />
    </div>
  );
}

// COMMON PATTERNS:
// Children prop (composition):
function Card({ children, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
// Usage: <Card title="Info"><p>Any content here</p></Card>

// Default props:
function Button({ variant = "primary", size = "md", children }) {
  return <button className={`btn btn-${variant} btn-${size}`}>{children}</button>;
}
```

---

## Part 5: State — useState Hook

### 5W1H: What is State?

```
WHAT: State is DATA that a component OWNS and can CHANGE.
      When state changes, React RE-RENDERS the component.

WHY:  Props come from outside (read-only). But components need
      their OWN data that changes over time — user input, API
      responses, toggle states, form fields, counters.

PROPS vs STATE — The Critical Difference:
┌──────────────┬─────────────────────────┬──────────────────────────┐
│ Feature      │ Props                   │ State                    │
├──────────────┼─────────────────────────┼──────────────────────────┤
│ Owned by     │ Parent component        │ This component           │
│ Mutable?     │ NO (read-only)          │ YES (via setter)         │
│ Triggers     │ Re-render when changed  │ Re-render when changed   │
│ re-render?   │ by parent               │ by setter                │
│ Purpose      │ Configure component     │ Track changing data      │
│ Analogy      │ Birth certificate       │ Personal notebook        │
│              │ (given to you)          │ (you write in it)        │
└──────────────┴─────────────────────────┴──────────────────────────┘

ANALOGY — WHITEBOARD vs NAMEPLATE:
  Props = your NAMEPLATE on your desk (given by someone else, you can't change it)
  State = your WHITEBOARD (you own it, you write/erase on it)

HOW useState WORKS INTERNALLY:
  React stores state values in an ARRAY on the component's Fiber node.
  Each useState() call corresponds to an INDEX in this array.

  First render:   hooks = [0]           ← useState(0) stores at index 0
  setCount(5):    hooks = [5]           ← state updated, re-render scheduled
  Second render:  hooks = [5]           ← useState(0) returns hooks[0] = 5

  THIS IS WHY hooks must be called in the same order every render!
  If you put useState inside an if-block, the indices shift and React
  returns the wrong state to the wrong hook.
```

```jsx
import { useState } from 'react';

function Counter() {
  // state variable, setter function = useState(initialValue)
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(prev => prev - 1)}>-1</button>
      {/*                     ↑ functional update for safety */}
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// STATE RULES:
// 1. Always use setter, never mutate directly: count++ ❌  setCount(count+1) ✅
// 2. State updates are ASYNCHRONOUS (batched)
// 3. Use functional update when new state depends on old: prev => prev + 1
// 4. useState with objects: ALWAYS spread + create new object

// 🎓 MIT/KTH SYSTEMS DEEP DIVE: Stack vs. Heap Memory
// Why does mutating an object directly (e.g., `form.name = 'Bob'`) fail to trigger a re-render?
// JavaScript stores objects on the HEAP and their memory address (pointer) on the STACK.
// React's Fiber engine uses `Object.is(oldState, newState)` to decide whether to re-render.
// If you mutate the object, the Heap data changes, but the Stack pointer remains EXACTLY THE SAME.
// Object.is(0x123, 0x123) === true, so React assumes nothing changed!
// The spread operator (`...prev`) creates a shallow copy with a BRAND NEW Heap address,
// which forces React to recognize the change and trigger a render.

// ❌ THE BUG (Pointer Copy)
// const oldForm = form; 
// oldForm.name = 'Bob'; 
// setForm(oldForm); // React does nothing!

// ✅ THE SYSTEMS FIX (Brand New Memory Address)
function Form() {
  const [form, setForm] = useState({ name: '', email: '' });
  
  const handleChange = (field, value) => {
    // The spread operator creates a new object in the Heap.
    // WARNING: Spread is a SHALLOW copy. For deeply nested objects, 
    // you must use structuredClone() or nested spreads.
    setForm(prev => ({ ...prev, [field]: value })); 
  };
  
  return (
    <>
      <input value={form.name} onChange={e => handleChange('name', e.target.value)} />
      <input value={form.email} onChange={e => handleChange('email', e.target.value)} />
    </>
  );
}
```

---

🔬 **Section Challenge — Part 5: State — useState Hook**

**Challenge 1 (Reasoning):** You call `setState(state.value + 1)` twice in the same event handler. The value increments by 1, not 2. Why?
<details><summary>Answer</summary>

Both calls use the SAME `state` closure value captured at render time. Both compute `oldValue + 1` and schedule the same update. React batches them into one re-render. Fix: use functional update `setState(prev => prev + 1)`. Each functional update receives the most recent pending state — two calls correctly increment by 2. Always use functional update when new state depends on old state.
</details>

**Challenge 2 (Bug Hunt):** You initialize state as `useState(expensiveComputation())`. The function runs on EVERY render. How do you fix it?
<details><summary>Answer</summary>

`useState(expensiveComputation)` (pass the function, don't call it). This is 'lazy initialization' — React calls the function once during initial render only. The difference: `useState(fn())` calls `fn` every render but ignores the result after mount. `useState(fn)` calls `fn` only once. Same pattern: `useReducer(reducer, undefined, expensiveInit)`.
</details>

## Part 6: Event Handling

### 5W1H: How Does React Handle Events?

```
WHAT: React uses SYNTHETIC EVENTS — a cross-browser wrapper around
      native DOM events. onClick, onChange, onSubmit are all synthetic.

WHY:  Different browsers handle events differently. React normalizes
      them into a consistent API so you don't write browser-specific code.

HOW IT WORKS INTERNALLY (Event Delegation):
  React does NOT attach event listeners to individual DOM elements!

  Old approach (React v16-):  Listeners attached to document root
  Modern approach (React v17+): Listeners attached to React root container

  When you write: <button onClick={handleClick}>Click</button>
  React does NOT do: button.addEventListener('click', handleClick)

  Instead:
  1. React attaches ONE click listener to the root <div id="root">
  2. When ANY click happens, it bubbles up to root
  3. React determines WHICH component the click belonged to
  4. React creates a SyntheticEvent wrapping the native event
  5. React calls YOUR handler with the SyntheticEvent

  WHY: One listener for thousands of buttons = much less memory.
  This is the EVENT DELEGATION pattern.

  ANALOGY: A receptionist (root) handles all incoming calls,
  then routes each call to the right department (component).
  Better than giving every employee their own phone line.
```

```jsx
function EventExamples() {
  // Click
  const handleClick = (e) => {
    e.preventDefault();       // prevent default behavior
    e.stopPropagation();      // stop event bubbling
    console.log('Clicked!');
  };
  
  // 🎓 MIT/KTH SYSTEMS DEEP DIVE: The C++ Browser Reality
  // Why is `e.preventDefault()` necessary? 
  // Browsers (1993) natively submit `<form>` data via HTTP `GET`/`POST` 
  // which PHYSICALLY destroys the current HTML document and fetches a new one.
  // JavaScript loses control of the Heap and single-page execution is annihilated.
  // We use `e.preventDefault()` to violently hijack the 1993 C++ behavior.
  
  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();       // Hijack network destruction & retain JS control
    // process form data safely in JS Memory
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleClick}>Click Me</button>
      <input onChange={(e) => console.log(e.target.value)} />
      <input onFocus={() => {}} onBlur={() => {}} />
      <div onMouseEnter={() => {}} onMouseLeave={() => {}} />
    </form>
  );
}

// PASSING ARGUMENTS TO HANDLERS:
// ❌ BAD: <button onClick={handleDelete(id)}>  ← calls immediately!
// ✅ GOOD: <button onClick={() => handleDelete(id)}>  ← arrow wrapper
```

---

## Part 7: Conditional Rendering & Lists

### Why Keys Matter — The Reconciliation Connection

```
WHEN React re-renders a list, it needs to match OLD items with NEW items.
Without keys, React compares by POSITION:
  Old: [Apple, Banana, Cherry]
  New: [Banana, Cherry]       ← React thinks Apple became Banana, Banana became Cherry
                                 and Cherry was deleted. Wrong! Apple was deleted.

With keys, React compares by IDENTITY:
  Old: [key:1→Apple, key:2→Banana, key:3→Cherry]
  New: [key:2→Banana, key:3→Cherry]
  React: "Key 1 is gone → remove Apple. Keys 2,3 unchanged → keep DOM nodes."

WHY NOT use array index as key?
  If you delete the first item, ALL remaining items get new indices.
  React thinks every item changed → re-renders entire list.
  Plus: form inputs lose their values because React destroys/recreates nodes.

RULE: Use a STABLE, UNIQUE identifier from your data (database ID, UUID).
```

```jsx
function Dashboard({ user, notifications }) {
  // Pattern 1: Ternary
  return (
    <div>
      {user ? <UserProfile user={user} /> : <LoginPrompt />}
      
      {/* Pattern 2: Short-circuit (show only if true) */}
      {notifications.length > 0 && <NotificationBadge count={notifications.length} />}
      
      {/* Pattern 3: Early return */}
      {!user && <Navigate to="/login" />}
      
      {/* Lists with unique keys */}
      <ul>
        {notifications.map(notif => (
          <li key={notif.id}>  {/* key = unique, stable identifier */}
            {notif.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// KEY RULES:
// ✅ Use unique IDs from data: key={item.id}
// ❌ Don't use array index as key (breaks on reorder/delete)
// ❌ Don't use random values: key={Math.random()} (re-renders everything)
```

---

## Part 8: Virtual DOM & Reconciliation — How React Actually Updates the Screen

### The Virtual DOM — React's Core Innovation

```
5W1H: WHY does the Virtual DOM exist?
─────────────────────────────────────

PROBLEM: The real DOM is SLOW.
  document.createElement() → creates a full DOM node with 200+ properties
  Each property change can trigger: style recalculation → layout → paint → composite
  This is called a REFLOW and it's EXPENSIVE.

  If you change 100 elements individually, the browser does 100 reflows.
  If you batch them into one change, the browser does 1 reflow.

  React's Virtual DOM is the BATCHING mechanism.

HOW THE VIRTUAL DOM WORKS:
─────────────────────────

  Step 1: RENDER PHASE (Pure, no side effects)
  Your component function runs and returns JSX.
  JSX compiles to React.createElement() calls.
  These return plain JS objects (Virtual DOM nodes):

  { type: 'div', props: { className: 'card', children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p',  props: { children: 'World' } }
  ]}}                     ↑ This is the Virtual DOM tree

  Step 2: RECONCILIATION (Diffing)
  React compares the NEW Virtual DOM with the PREVIOUS one.
  It uses a heuristic O(n) algorithm (not O(n³) full tree diff):

  HEURISTIC 1: Different type? → Destroy old tree, build new.
    Old: <div><Counter /></div>
    New: <span><Counter /></span>
    React: Types differ (div vs span) → tear down entire subtree,
           rebuild from scratch. Counter's state is LOST.

  HEURISTIC 2: Same type? → Keep DOM node, update changed attributes.
    Old: <div className="old" style={{color: 'red'}}>Hello</div>
    New: <div className="new" style={{color: 'blue'}}>Hello</div>
    React: Same type (div) → update className and style only.
           Text didn't change → skip it.

  HEURISTIC 3: Lists with keys → Match by key, not position.
    (See keys explanation above)

  Step 3: COMMIT PHASE (Actual DOM updates)
  React applies ONLY the diff to the real DOM.
  All updates are batched into a single browser reflow.


THE FIBER ARCHITECTURE (React 16+):
────────────────────────────────────
  Before Fiber: Reconciliation was SYNCHRONOUS. A large tree diff
  could block the main thread for 100ms+ → janky animations.

  Fiber: Reconciliation is INTERRUPTIBLE. React breaks work
  into small units (fibers) and can PAUSE to let the browser
  handle user input, then RESUME the diff.

  Each Fiber node holds:
  ┌────────────────────────────────────┐
  │ type: 'div' or MyComponent        │
  │ props: { className: 'card' }      │
  │ state: [count: 0]  (hooks array)  │
  │ child: → first child fiber        │
  │ sibling: → next sibling fiber     │
  │ return: → parent fiber            │
  │ effectTag: PLACEMENT | UPDATE     │
  └────────────────────────────────────┘

  ANALOGY: Old React = reading a book in one sitting (can't stop).
           Fiber React = reading a book with bookmarks (can pause,
           do something else, come back).

  This is how React 18's concurrent features work:
  startTransition(), Suspense, useDeferredValue — all powered by Fiber.
```

---

## Part 9: Component Lifecycle Cheat Sheet

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  FUNCTION COMPONENT LIFECYCLE (via Hooks)                                        │
│                                                                                  │
│  Mount (component appears):                                                      │
│    1. Function called → JSX returned → DOM updated                               │
│    2. useEffect(() => { ... }, []) runs ONCE after first render                  │
│                                                                                  │
│  Update (state/props change):                                                    │
│    1. Function re-called → new JSX returned → DOM diffed & updated               │
│    2. useEffect(() => { ... }, [dep]) runs if dep changed                        │
│                                                                                  │
│  Unmount (component removed):                                                    │
│    1. Cleanup function from useEffect runs                                       │
│    useEffect(() => {                                                             │
│      const timer = setInterval(...);                                             │
│      return () => clearInterval(timer);  // ← cleanup                            │
│    }, []);                                                                       │
│                                                                                  │
│  RENDER CYCLE:                                                                   │
│  Props/State change → React re-renders component → Virtual DOM diff              │
│  → Only changed DOM nodes updated (efficient!)                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```


---

## Part 10: Real-World Simulation — How a Click Updates the Screen

```
SCENARIO: User clicks "Add to Cart" button in an e-commerce app.
──────────────────────────────────────────────────────────────────

Step 1: USER CLICKS
  Browser fires native 'click' event → bubbles to React root.
  React's event delegation catches it.
  React creates SyntheticEvent, finds the component, calls handler.

Step 2: HANDLER CALLS setState
  const [cart, setCart] = useState([]);
  setCart(prev => [...prev, newItem]);
  React SCHEDULES a re-render (doesn't happen immediately!).
  Multiple setStates in one handler are BATCHED.

Step 3: RENDER PHASE
  React calls your component function again with new state.
  Component returns new JSX → new Virtual DOM tree.
  This is a PURE function call — no DOM changes yet.

Step 4: RECONCILIATION (Diffing)
  React compares old tree vs new tree:
  - Header: same props → SKIP (no re-render)
  - CartIcon: cart.length changed (0→1) → mark for UPDATE
  - ProductList: same products → SKIP
  - CartBadge: new child <span>1</span> → mark for PLACEMENT

Step 5: COMMIT PHASE
  React applies only the diff to real DOM:
  - CartBadge: innerHTML = "1" (one DOM operation)
  - CartIcon: update class to 'has-items' (one DOM operation)
  Total: 2 DOM operations instead of re-rendering entire page!

Step 6: BROWSER PAINT
  Browser recalculates styles → layout → paint → composite.
  User sees the cart badge update. Total time: ~16ms (one frame).

TIMELINE:
  0ms:  Click event fired
  1ms:  Handler runs, setState called
  2ms:  React schedules re-render
  3ms:  Render phase (Virtual DOM creation)
  5ms:  Reconciliation (diffing)
  7ms:  Commit phase (DOM updates)
  16ms: Browser paints new frame

  User perception: INSTANT. 16ms = 60fps.
```

---

## 🎓 MIT/KTH SYSTEMS DEEP DIVE: The Asynchronous Batching Illusion

A fundamental flaw in junior mental models is treating React `setState` like a synchronous `x = x + 1` assignment. State changes in React are **requests, not mutations**.

### Trap 1: The Stolen State Update (State Batching)

React groups multiple state updates into a single render pass to prevent micro-render thrashing. If you try to read state immediately after setting it, you will get the old value.

### Trap 2: The Double-Invocation Trap (React 18 Strict Mode)

In development, React 18 mounts, unmounts, and remounts your components instantly to shake out hidden bugs. If your API calls or logic aren't idempotent (meaning they can run twice safely), your application will break in Strict Mode.

### 💻 System Challenge (VSCode / Real World): The Batching Disaster

*VSCode Pro-Tip: Drop a `console.log("Rendered!")` in your component body. Watch how many times it logs during multiple sequential `setCount` calls. React batches them to only log once!*

```jsx
// ❌ THE BUG: User clicks the "+3" button, but the counter only goes up by 1!
function Counter() {
  const [count, setCount] = useState(0);

  const handleAddThree = () => {
    setCount(count + 1); // React says: "Queue an update to turn 0 into 1"
    setCount(count + 1); // React says: "Queue an update to turn 0 into 1"
    setCount(count + 1); // React says: "Queue an update to turn 0 into 1"
    // Result: Render Phase triggers -> `count` becomes 1. 2 clicks were LOST.
  };

  return <button onClick={handleAddThree}>+3 (Count: {count})</button>;
}
```

```jsx
// ✅ THE FIX: The Updater Function (Functional State Updates)
function Counter() {
  const [count, setCount] = useState(0);

  const handleAddThree = () => {
    // When next state depends on previous state, you MUST use a callback.
    // React passes the "most recently queued" state to the callback.
    setCount(prev => prev + 1); // turns 0 into 1
    setCount(prev => prev + 1); // turns 1 into 2
    setCount(prev => prev + 1); // turns 2 into 3
  };

  return <button onClick={handleAddThree}>+3 (Count: {count})</button>;
}
```

---
