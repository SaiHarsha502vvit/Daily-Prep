# 15b. JavaScript × React — From Language Foundations to Framework Failure Modes

**Navigation**: [← SQL Problems](../Problem_Sets_SQL/15_SQL_Problems_Foundations_Intermediate.md) | [📚 Index](../00_INDEX.md) | [SQL Window Functions →](../Problem_Sets_SQL/16_SQL_Problems_Window_Functions_Advanced.md)

**Cross-links:**
- [`16_JavaScript/`](../16_JavaScript/) — JS foundations (read Ch01–07 before this file)
- [`17_TypeScript/`](../17_TypeScript/) — TypeScript types (read Ch01–02 alongside)
- [`15_React_Frontend/`](../15_React_Frontend/) — React chapters
- [`PATH_FRONTEND.md`](../../PATH_FRONTEND.md) — full frontend learning path

---

> **Reading contract**: You know JavaScript. This file shows exactly how every "confusing React behavior" is actually a JavaScript fundamental you already understand — explained by mapping React's failure modes to the JS concepts that cause them.

---

## Table of Contents

1. [Closures → The Stale Closure Bug in useCallback](#1-closures--the-stale-closure-bug-in-usecallback)
2. [The Event Loop → Why useEffect Timing Surprises You](#2-the-event-loop--why-useeffect-timing-surprises-you)
3. [Prototypal Inheritance → Why Hooks Replaced Class Components](#3-prototypal-inheritance--why-hooks-replaced-class-components)
4. [Reference Equality → Why Objects Trigger Infinite Re-renders](#4-reference-equality--why-objects-trigger-infinite-re-renders)
5. [Promises and async/await → useEffect Cleanup and AbortController](#5-promises-and-asyncawait--useeffect-cleanup-and-abortcontroller)
6. [The var/let/closure loop trap → useEffect Dependency Array](#6-the-varletclosure-loop-trap--useeffect-dependency-array)
7. [Module System → Component Lazy Loading and Code Splitting](#7-module-system--component-lazy-loading-and-code-splitting)

---

## 1. Closures → The Stale Closure Bug in useCallback

### 🧠 Foundation — What a closure is

A closure is a function that **remembers the scope where it was created**, not the scope where it runs:

```javascript
function makeCounter() {
  let count = 0;       // ← variable in the outer scope
  return function() {
    count++;           // ← inner function "closes over" count
    console.log(count);
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
```

The inner function carries a reference to `count` even after `makeCounter` has returned. This is a closure.

**The key insight:** the closure captures a **reference**, not a copy of the variable's value at creation time.

---

### 🔍 The React Problem — The Stale Closure

React's `useCallback` caches a function between renders to avoid re-creating it every time. But if that cached function closes over a state variable, it captures the state from when it was created — not the current state:

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);

  // ❌ Bug: handleClick closes over count = 0 and never updates
  const handleClick = React.useCallback(() => {
    console.log(count); // Always logs 0!
    setCount(count + 1); // Always increments from 0 → always sets to 1
  }, []); // Empty dependency array = cached forever

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
```

Click 5 times → count shows 1 every time. The closure captured `count = 0` at mount and never re-captured.

**Fix A — include count in the dependency array:**

```jsx
const handleClick = React.useCallback(() => {
  setCount(count + 1);
}, [count]); // ← re-creates when count changes; no longer stale
```

**Fix B — functional update (doesn't need count in closure at all):**

```jsx
const handleClick = React.useCallback(() => {
  setCount(prev => prev + 1); // ← React passes the current state into the updater
}, []); // ← safe to have empty deps — we don't capture count
```

Fix B is almost always better. The functional update form (`prev => prev + 1`) doesn't close over any state, so the empty dependency array is correct and the function is only created once.

---

### 💥 War Story — The Timer That Logged 0 for 6 Months

A team built a real-time dashboard that logged user interactions every 30 seconds. The logging function was cached with `useCallback` and closed over the user session object:

```jsx
const logActivity = useCallback(() => {
  sendLog({ userId: session.userId, activity: 'viewed_dashboard' });
}, []); // "optimization" — don't recreate on every render
```

When users were re-authenticated mid-session (token refresh), `session` updated — but `logActivity` still closed over the old `session` object. For 6 months, 30% of activity logs had the wrong `userId`. The fix was adding `session` to the dependency array, which is what the linting rule `react-hooks/exhaustive-deps` would have caught instantly.

---

### 📝 Practice Challenges

1. A `useCallback` closes over a `todos` array state. The function adds a new todo to `todos` and calls `setTodos(newTodos)`. What's the bug if `todos` is not in the deps array? Write the fix using the functional update form.
2. A `useEffect` with `[]` deps fetches user data and stores it in a ref. Inside the `useEffect` a callback uses a state variable. Is there a stale closure? Why or why not?
3. When would you choose functional update form over adding a state variable to `useCallback` deps?

---

## 2. The Event Loop → Why useEffect Timing Surprises You

### 🧠 Foundation — How the event loop works

JavaScript is single-threaded. The event loop processes tasks from a queue one at a time:

```
Call stack (synchronous, always runs first)
   ↓ completes
Microtask queue (Promises, MutationObserver — runs after each task)
   ↓ completes
Macro-task queue (setTimeout, setInterval, I/O — runs next)
```

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// Output: 1, 4, 3, 2
// Synchronous first: 1, 4
// Microtask (Promise): 3
// Macro-task (setTimeout 0ms): 2
```

---

### 🔍 The React Equivalent — When Does useEffect Run?

`useEffect` runs **after the browser paints the screen** — it's scheduled in the macro-task queue, not synchronously with the render:

```jsx
function ExampleComponent() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    // This runs AFTER the component renders AND paints
    // → it's like a macro-task: happens after the frame is committed
    fetchData().then(result => setData(result));
  }, []);

  // First render: data = null (renders immediately)
  // After paint + useEffect fetch: data = loaded (re-renders)

  return data ? <div>{data.name}</div> : <div>Loading...</div>;
}
```

The browser will display "Loading..." for at least one frame before `useEffect` fires. This is intentional — React doesn't want data-fetching to block the paint.

**`useLayoutEffect`** runs synchronously after the DOM mutations but before the browser paints — it's more like a microtask in scheduling terms:

```jsx
React.useLayoutEffect(() => {
  // DOM is updated, but not painted yet
  // Use for: measuring DOM elements, synchronously updating scrollPosition
  const height = ref.current.getBoundingClientRect().height;
  // If you setState here, React will re-render before the paint — no flicker
}, []);
```

---

### The `useEffect` Timing Rules

```
React renders (synchronous)
  ↓
Browser paints the DOM changes
  ↓
useEffect fires (like macro-task — async after paint)
  ↓
  → setData(result) triggers re-render
    ↓
    Browser paints again
    ↓
    useEffect fires again (if deps changed)
```

**`useLayoutEffect` instead:**
```
React renders (synchronous)
  ↓
DOM mutations applied (NOT painted yet)
  ↓
useLayoutEffect fires (synchronous, before paint)
  ↓
Browser paints (user sees final result — no intermediate flash)
```

---

### 💥 War Story — The One-Frame Flicker in a Tooltip

A team built a tooltip that needed to measure its own width to position itself:

```jsx
React.useEffect(() => {
  const width = tooltipRef.current.offsetWidth;
  setTooltipLeft(window.innerWidth / 2 - width / 2);
}, []);
```

The tooltip flickered visibly on every mount — it would appear on the left edge for one frame, then jump to center. Reason: `useEffect` fires after paint, so users saw one frame of the default position.

Fix: `useLayoutEffect`:

```jsx
React.useLayoutEffect(() => {
  const width = tooltipRef.current.offsetWidth;
  setTooltipLeft(window.innerWidth / 2 - width / 2);
}, []);
```

Now the position is calculated before the browser paints. No flicker.

---

### 📝 Practice Challenges

1. A component shows a count that increments every second using `setInterval` in `useEffect`. When the component unmounts, the interval keeps running. Write the cleanup function.
2. You need to set a CSS class on a DOM element to trigger an animation on mount, without the element first appearing un-styled. Should you use `useEffect` or `useLayoutEffect`? Why?
3. In what order do these fire? Component renders → browser paints → `useLayoutEffect` → `useEffect`. Order them correctly.

---

## 3. Prototypal Inheritance → Why Hooks Replaced Class Components

### 🧠 Foundation — How `this` works in JS

JavaScript's `this` is determined at **call time**, not at **definition time**:

```javascript
const person = {
  name: 'Alice',
  greet: function() {
    console.log(`Hello, ${this.name}`);
  }
};

person.greet();              // "Hello, Alice" — this = person
const fn = person.greet;
fn();                        // "Hello, undefined" — this = global (or undefined in strict mode)

// Common fix: arrow functions capture 'this' lexically
const person2 = {
  name: 'Bob',
  greet: () => {
    console.log(this.name); // ← this = the outer scope (not person2!)
    // Arrow functions DON'T have their own 'this' — they capture the enclosing scope
  }
};
```

---

### 🔍 Why Class Components Had `this` Bugs

React class components used `this.state` and `this.setState()`. The `this` binding bugs from plain JavaScript appeared in React:

```jsx
class Counter extends React.Component {
  state = { count: 0 };

  // ❌ Bug: 'this' is lost when handleClick is passed as a prop
  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return <button onClick={this.handleClick}>+</button>;
    // When the browser calls handleClick, 'this' = undefined (strict mode)
  }
}
```

Fix required `.bind(this)` or arrow function class fields:

```jsx
class Counter extends React.Component {
  state = { count: 0 };

  // ✅ Arrow class field — captures 'this' at class initialization time
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return <button onClick={this.handleClick}>+</button>;
  }
}
```

**Why hooks eliminated this problem:**

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);

  // No 'this' anywhere — closures instead of instance fields
  const handleClick = () => {
    setCount(count + 1);
  };

  return <button onClick={handleClick}>+</button>;
}
```

Hooks replaced class components not just for simplicity — they replaced a JavaScript `this` problem with closures, which are more predictable in JS.

---

### The Class → Hooks Equivalence Map

| Class component | Hook equivalent |
|-----------------|----------------|
| `this.state = {}` | `const [x, setX] = useState({})` |
| `this.setState({key: val})` | `setX(val)` |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate(prevProps)` | `useEffect(() => {}, [dep])` |
| `componentWillUnmount` | return cleanup from `useEffect` |
| `this.forceUpdate()` | `const [, forceRender] = useReducer(x => x+1, 0)` |
| Instance variables (non-state) | `const ref = useRef(value)` |

---

### 📝 Practice Challenges

1. Explain in JS terms (not React terms) why `<button onClick={this.handleClick}>` loses `this`.
2. Convert this class component to a function component with hooks: `componentDidMount` fetches users, `componentWillUnmount` cancels the fetch.
3. Why can't hooks be called inside if-statements or loops? (Hint: how does React track which hook is which between renders without class instances?)

---

## 4. Reference Equality → Why Objects Trigger Infinite Re-renders

### 🧠 Foundation — Value vs Reference in JS

Primitives (`number`, `string`, `boolean`) compare by value. Objects, arrays, and functions compare by **reference** (memory address):

```javascript
// Primitives
5 === 5          // true — same value
"hello" === "hello" // true

// Objects
{} === {}        // false — different objects, different references
[] === []        // false
const a = [1,2]; const b = a;
a === b          // true — same reference
```

---

### 🔍 The React Problem — New Object = Re-render

React's dependency arrays (`useMemo`, `useCallback`, `useEffect`) check if dependencies changed using `===`. If you pass an object literal as a dependency, it creates a **new object reference on every render** — which looks like a change every time:

```jsx
function UserProfile({ userId }) {
  // ❌ Bug: options is recreated on every render → new reference every time
  const options = { headers: { 'Authorization': 'Bearer token' } };

  React.useEffect(() => {
    fetchUser(userId, options);
  }, [userId, options]); // 'options' has a new reference every render
  // → useEffect fires on EVERY render, not just when userId changes
}
```

**Fix — move the object outside the component, or memoize it:**

```jsx
// ✅ Option A: Constant outside component (no recreation)
const DEFAULT_OPTIONS = { headers: { 'Authorization': 'Bearer token' } };

function UserProfile({ userId }) {
  React.useEffect(() => {
    fetchUser(userId, DEFAULT_OPTIONS);
  }, [userId]); // ← same reference every render, safe
}

// ✅ Option B: Memoize inside component if it depends on props/state
function UserProfile({ userId, token }) {
  const options = React.useMemo(
    () => ({ headers: { 'Authorization': `Bearer ${token}` } }),
    [token]  // ← only recreated when token changes
  );

  React.useEffect(() => {
    fetchUser(userId, options);
  }, [userId, options]);
}
```

---

### 💥 War Story — The Infinite Fetch Loop

A team had a search component:

```jsx
function SearchResults({ filters }) {
  // filters is an object prop: { category: 'books', minPrice: 10 }
  React.useEffect(() => {
    searchApi(filters).then(setResults);
  }, [filters]); // ← filters is a new object reference on every parent render
}
```

The parent re-rendered on scroll (for a sticky header animation). Every scroll event → parent re-renders → `filters` gets a new object reference → `useEffect` fires → API call → state update → re-render → scroll → ... infinite loop.

Fix: destructure the primitive values, not the object:

```jsx
React.useEffect(() => {
  searchApi({ category: filters.category, minPrice: filters.minPrice }).then(setResults);
}, [filters.category, filters.minPrice]); // ← primitives, compare by value
```

---

### 📝 Practice Challenges

1. A `useCallback` wraps a function that takes no arguments. The deps array is `[]`. Can it still cause a stale value? (Think: what if it's called with `someRef.current`?)
2. Explain why `React.memo(Component)` still re-renders when a parent passes `<Component style={{ color: 'red' }} />`.
3. You need to deep-compare an object prop to avoid re-renders. React has no built-in deep comparison. What are two production-safe approaches?

---

## 5. Promises and async/await → useEffect Cleanup and AbortController

### 🧠 Foundation — Promises and Cancellation

Promises in JavaScript have no native cancellation mechanism. Once you call `fetch()`, the HTTP request is in flight — you can't take it back.

```javascript
const promise = fetch('/api/data');
// There's no promise.cancel() in JavaScript
```

But you can **ignore the result** after the promise resolves, using an `isCancelled` flag:

```javascript
let isCancelled = false;

fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    if (!isCancelled) updateState(data); // ← ignore result if cancelled
  });

// "Cancel" by setting the flag
isCancelled = true;
```

Or use the modern `AbortController` API to actually cancel the HTTP request:

```javascript
const controller = new AbortController();

fetch('/api/data', { signal: controller.signal })
  .then(res => res.json())
  .then(data => updateState(data))
  .catch(err => {
    if (err.name === 'AbortError') return; // ← expected, ignore
    throw err;
  });

// Cancel the request:
controller.abort();
```

---

### 🔍 The React Problem — Setting State on Unmounted Components

When a user navigates away from a page, the component unmounts. If a `useEffect` has a pending `fetch()`, and the fetch resolves after unmount, calling `setState()` on the unmounted component causes either a memory leak or a React warning.

**Without cleanup (the bug):**

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data)); // ← called even after component unmounts
  }, [userId]);
}
```

**Fix — AbortController in cleanup:**

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => {
        if (err.name === 'AbortError') return; // component unmounted — ignore
      });

    return () => controller.abort(); // ← cleanup: abort the request on unmount
  }, [userId]);
}
```

The cleanup function (the `return () => ...`) runs when:
- The component unmounts
- The dependency array values change (before the next effect runs)

This is React's lifecycle encoded as a closure — no lifecycle methods, just a returned cleanup function.

---

### The Effect → Cleanup Pattern for Every Async Pattern

| Async operation | Cleanup needed | Cleanup approach |
|-----------------|---------------|-----------------|
| `fetch()` | Yes | `AbortController.abort()` |
| `setTimeout` | Yes | `clearTimeout(id)` |
| `setInterval` | Yes | `clearInterval(id)` |
| WebSocket | Yes | `ws.close()` |
| Event listener | Yes | `removeEventListener()` |
| RxJS subscription | Yes | `subscription.unsubscribe()` |
| Promise (no signal support) | Partial | `let active = true; if (active) setState()` |

---

### 📝 Practice Challenges

1. A component polls an API every 2 seconds with `setInterval`. Write the `useEffect` with proper cleanup.
2. Two effects in the same component both listen to `window.resize`. One sets `windowWidth`, the other triggers an animation. Write both effects with cleanup.
3. `useEffect` with `async` function — why does `useEffect(async () => {...}, [])` not work as expected? What's the correct pattern?

---

## 6. The var/let/closure Loop Trap → useEffect Dependency Array

### 🧠 Foundation — The Classic `var` Loop Bug

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Output: 3, 3, 3 (NOT 0, 1, 2)
```

`var` is function-scoped, not block-scoped. All three `setTimeout` callbacks share the **same `i`** variable. By the time they run, the loop has finished and `i = 3`.

Fix: `let` creates a new binding per iteration:

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Output: 0, 1, 2
```

---

### 🔍 The React Equivalent — Capturing List Item State in Loops

The same capture-at-creation-time behavior applies in React when rendering lists with closures:

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <button
          key={todo.id}
          onClick={() => deleteTodo(index)} // ← each closure captures its own 'index'
        >
          Delete {todo.text}
        </button>
      ))}
    </ul>
  );
}
```

This works correctly because `Array.map()` creates a new closure per iteration, each capturing its own `index` — exactly like `let` in a for loop.

**The bug appears with `useEffect` in loops:**

```jsx
// ❌ Don't do this — multiple effects in a loop
for (let i = 0; i < tabs.length; i++) {
  React.useEffect(() => {
    console.log(tabs[i]); // ← which i? The closure captures i correctly (let)
    // But this violates the Rules of Hooks — hooks must not be in loops
  }, [tabs[i]]);
}
```

React tracks hooks by **call order**, not by name. If the number of `useEffect` calls changes between renders (because `tabs.length` changed), React can't match the hook state from the previous render.

**Fix — single effect with the whole array:**

```jsx
React.useEffect(() => {
  tabs.forEach(tab => console.log(tab));
}, [tabs]); // ← or the specific values from tabs you care about
```

---

### The Dependency Array Mental Model

The dependency array is asking: "which values from the outer scope does this effect capture, and which of them can change?"

```jsx
function Component({ userId, sortOrder }) {
  const [data, setData] = React.useState([]);
  const pageSize = 20; // constant — doesn't need to be in deps

  React.useEffect(() => {
    fetchData(userId, sortOrder, pageSize).then(setData);
    // Captures: userId, sortOrder, pageSize
    // Can change: userId (prop), sortOrder (prop)
    // Constant: pageSize (never changes)
  }, [userId, sortOrder]); // ← only the values that can change
}
```

The `react-hooks/exhaustive-deps` ESLint rule enforces this — if you capture a variable that can change, it must be in the deps array.

---

### 📝 Practice Challenges

1. A component renders a list of 10 checkboxes. Each checkbox `onChange` updates one item in an array state. Write it correctly (hint: functional state update).
2. A `useEffect` captures `currentUser.id` but `currentUser` is in the deps array. Is this enough, or should it be `currentUser.id`? What's the practical difference?
3. The `react-hooks/exhaustive-deps` ESLint rule warns about a missing dependency for a function defined outside the effect. The function is declared with `useCallback` and has its own deps. How do you satisfy the rule?

---

## 7. Module System → Component Lazy Loading and Code Splitting

### 🧠 Foundation — How ES modules work

When you import a module, JavaScript loads and executes it synchronously (for static imports):

```javascript
import { heavy } from './heavy-computation'; // ← loaded at app startup
```

Dynamic imports defer the load until the import() call is executed:

```javascript
// Static: always loaded, synchronous
import { Button } from './Button';

// Dynamic: loaded on demand, async
const HeavyChart = await import('./HeavyChart');
```

---

### 🔍 The React Equivalent — React.lazy and Suspense

React wraps dynamic imports to lazily load components — the component module is only fetched when it's first rendered:

```jsx
// ❌ Static import — always in the initial bundle
import { AnalyticsDashboard } from './AnalyticsDashboard';

// ✅ Lazy import — only fetched when the component renders
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard'));

function App() {
  return (
    <React.Suspense fallback={<div>Loading dashboard...</div>}>
      {showDashboard && <AnalyticsDashboard />}
    </React.Suspense>
  );
}
```

When `showDashboard` becomes `true`, React:
1. Calls `import('./AnalyticsDashboard')` (dynamic import)
2. Shows the `fallback` while the network request is in flight
3. Renders `AnalyticsDashboard` once the module is loaded and parsed

**Bundle impact:** Without `React.lazy`, `AnalyticsDashboard` and all its dependencies land in the main JS bundle — even for users who never visit that page. With `React.lazy`, they're in a separate chunk, fetched on demand.

---

### The Network Waterfall

Static import:
```
App loads → entire bundle (including AnalyticsDashboard) → first render
[──────────────────────────────────────────────────────]
```

Dynamic import:
```
App loads → small main bundle → first render (no AnalyticsDashboard yet)
[──────────────]
              User navigates to dashboard
              → fetch AnalyticsDashboard chunk → render
                [──────────]
```

The main bundle is smaller → the initial page load is faster.

---

### 💥 War Story — The 4MB Initial Bundle

A team built a SaaS app with 40 page-level components, all statically imported in the root `App.tsx`. The initial JS bundle was 4.2MB. Users on mobile saw a 12-second first contentful paint.

After converting all page-level imports to `React.lazy`:
- Main bundle: 380KB
- Each page: 50–120KB on demand
- First contentful paint: 2.1 seconds

The change was ~40 lines of code across `App.tsx` — replacing each `import` with `React.lazy(() => import(...))` and wrapping routes in `<Suspense>`.

---

### The Code-Splitting Decision Matrix

| When to use `React.lazy` | When NOT to use it |
|-------------------------|-------------------|
| Large, rarely-visited components (settings, analytics, admin) | Small components used on the landing page |
| Route-level splits (each page in its own chunk) | Common UI primitives (buttons, inputs) |
| Heavy third-party libraries (charts, maps, PDF viewers) | Components rendered during initial page load |
| Admin/authenticated sections (many users never see them) | Anything in the critical rendering path |

---

### 📝 Practice Challenges

1. You have a rich text editor (Quill.js, ~300KB) that appears on one page of a 10-page app. How do you load it lazily? Write the code.
2. `React.lazy` only works with **default exports**. A component library exports as `export const Chart = ...` (named export). How do you lazy-load it?
3. A lazily-loaded component fails to load (network error). `Suspense` shows the fallback forever. How do you show an error message instead?

---

## Quick Reference: JavaScript → React Mapping

```
JavaScript concept     │ React failure mode it causes
───────────────────────┼──────────────────────────────────────────────────────
Closures               │ Stale closure in useCallback/useEffect (captured old state)
Event loop / microtasks│ useEffect fires after paint (not synchronous with render)
'this' binding         │ Class component handler needs .bind() or arrow fields
Reference equality     │ Object deps in useEffect fire every render (new ref each time)
Promises / async       │ setState on unmounted component (need cleanup/abort)
var vs let scope       │ Multiple effects in loops violate Rules of Hooks
Dynamic import()       │ React.lazy() + Suspense for code splitting
Array.prototype.map    │ List rendering — each closure captures its own index
Prototype chain        │ Why hooks are plain functions, not classes
WeakRef / FinalizationRegistry │ (advanced) Memory-efficient component lifecycle patterns
```

---

*[Back to Index](../00_INDEX.md) | [JS Foundations](../../16_JavaScript/01_JS_Foundations.md) | [React Chapters](../15_React_Frontend/) | [Frontend Path](../../PATH_FRONTEND.md)*


---

## Reality Check

**"React knowledge is separate from JS fundamentals"** ? React bugs are usually JS fundamentals surfacing ([16_JS, 15_React]): the stale closure in useEffect (a JS closure capturing this render's values � [16_JS/02]), the reference-equality that defeats memo (JS object identity � [16_JS/01]), the mutation that does not trigger re-render (JS reference-vs-value � [15_React/01]), the async state update (JS event loop � [16_JS/04]). The fusion rounds drill exactly this � the React problem whose root is a JS mechanism � and "separate" misses that React understanding REQUIRES the JS fundamentals it is built on.

**"The React question is about React APIs"** ? The hard React questions probe the JS mechanisms under the APIs ([15_React/09 deep-reasoning, 16_JS/08]): why the state is stale (the snapshot-and-closure), why the effect loops (the dependency identity), why the child re-renders (the reference inequality) � all JS-mechanism questions wearing React-API clothes. The fusion rounds test whether you understand the JS under the React (the closure, the identity, the event loop), and "about React APIs" misses that the deep React questions are JS-deep-reasoning questions in React context.

**"Modern JS features are just syntax for React"** ? The modern JS semantics MATTER for React correctness ([16_JS/06, 15_React]): the nullish-coalescing versus OR (the config-default bug � [16_JS/06]), the optional-chaining scope, the spread that shallow-copies (the state-update that shares nested references � [15_React/04] immutability), the destructuring defaults. The fusion rounds drill the JS semantics that determine React behavior, and treating them as syntax misses that the shallow-spread, the falsy-coalescing, and the reference semantics are exactly where React state bugs originate.

**"State management is a React concept"** ? State management is JS data-flow and immutability with React's rendering on top ([15_React/04, 16_JS/03]): the immutable-update requirement (the JS reference-inequality that React uses to detect change � [15_React/04]), the derived-state that should be computed not stored ([15_React/04]), the state-shape design (the JS object/array structure). The fusion rounds integrate the JS data-modeling with the React rendering, and "a React concept" misses that state management is fundamentally JS data-flow (immutability, derivation, shape) that React's re-render mechanism consumes.

**"You can be good at React without deep JS"** ? The React ceiling is the JS ceiling � the deep React skills require deep JS ([15_React/09, 16_JS/08]): the performance optimization (the reference identity, the closure costs � [16_JS/02]), the debugging of the stale-closure and the re-render cascade (the JS mechanisms), the custom hooks (the closure-and-effect mastery � [15_React/10]). "Good at React without deep JS" plateaus exactly where the JS-mechanism understanding is needed � the fusion rounds expose this by probing the JS under the React, and the React-strong-JS-weak candidate fails the deep-reasoning that is JS-reasoning in React clothes.
