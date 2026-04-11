> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Router](06_React_Router.md) | [Next: Performance →](08_React_Performance.md)

---

# 🧪 React Testing — Unit, Integration, E2E

---

## Testing Pyramid for React


> /\
> /  \       E2E (Cypress/Playwright)
> / E2E\      → Test full user flows (login → checkout)
> /──────\     → Slow, expensive, few tests
> /        \
> / Integr.  \   Integration (React Testing Library)
> /────────────\  → Test components with user interactions
> /              \ → Most value per test
> /     Unit       \  Unit (Vitest/Jest)
> /──────────────────\ → Test pure functions, hooks, utils
> /                    \ → Fast, many tests
> /______________________\


---




## React Testing Library (RTL) — Test User Behavior

```tsx
// PHILOSOPHY: Test what users see and do, not implementation details
// ❌ Don't test: state values, component instances, class names
// ✅ Do test: rendered output, user interactions, accessibility

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Test: Component renders correctly ──
test('renders user name', () => {
  render(<UserCard name="Alice" role="admin" />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('admin')).toBeInTheDocument();
});

// ── Test: User interaction ──
test('increments counter on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  
  await user.click(screen.getByRole('button', { name: /increment/i }));
  
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// ── Test: Form submission ──
test('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<UserForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Alice',
    email: 'alice@test.com',
  });
});

// ── Test: Async data fetching ──
test('loads and displays users', async () => {
  // Mock the API
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
  } as Response);
  
  render(<UserList />);
  
  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  // Wait for data
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

// ── Query Priority (RTL guidance) ──
// 1. getByRole       ← BEST (accessible, like screen readers)
// 2. getByLabelText  ← Forms
// 3. getByPlaceholderText
// 4. getByText       ← Non-interactive elements
// 5. getByTestId     ← LAST RESORT (data-testid="...")
```

---




## Testing Custom Hooks

```tsx
import { renderHook, act } from '@testing-library/react';

test('useCounter increments and decrements', () => {
  const { result } = renderHook(() => useCounter(0));
  
  expect(result.current.count).toBe(0);
  
  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
  
  act(() => { result.current.decrement(); });
  expect(result.current.count).toBe(0);
});

// Test hook with provider wrapper
test('useAuth returns user from context', () => {
  const wrapper = ({ children }) => (
    <AuthProvider><>{children}</></AuthProvider>
  );
  
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.user).toBeNull();
});
```

---



> 🔬 **Section Challenge — Testing Custom Hooks**
>
> **Challenge 1 (Design):** Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?
> <details><summary>Answer</summary>
>
> ```java
> public class PaymentException extends RuntimeException { // unchecked!
>     private final String errorCode;
>     private final String transactionId;
>     public PaymentException(String code, String txId, String msg, Throwable cause) {
>         super(msg, cause); this.errorCode=code; this.transactionId=txId;
>     }
> }
> public class InsufficientFundsException extends PaymentException { ... }
> public class PaymentGatewayException extends PaymentException { ... }
> ```
> Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging.
> </details>
>

## MSW (Mock Service Worker) — API Mocking

```tsx
// Instead of mocking fetch directly, intercept at network level
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Now tests use real fetch — MSW intercepts!
test('creates user via API', async () => {
  render(<CreateUserForm />);
  // ... fill form and submit
  // MSW returns mock response automatically
});

// Override for specific test:
test('handles server error', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json(null, { status: 500 }))
  );
  render(<UserList />);
  await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
});
```

---




## E2E Testing with Playwright

```ts
import { test, expect } from '@playwright/test';

test('user can login and see dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'alice@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome, Alice')).toBeVisible();
});

test('user can add item to cart', async ({ page }) => {
  await page.goto('/products');
  await page.click('text=Add to Cart');
  
  const cartBadge = page.getByTestId('cart-count');
  await expect(cartBadge).toHaveText('1');
});
```

---




## Testing State Management (Redux/Zustand)

```tsx
// ── Testing Redux Toolkit Store ──
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import cartReducer, { addItem, removeItem } from './cartSlice';

// Test the slice directly (unit test)
test('adds item to cart', () => {
  const state = cartReducer(undefined, addItem({ id: 1, name: 'Laptop', price: 999 }));
  expect(state.items).toHaveLength(1);
  expect(state.total).toBe(999);
});

// Test component with store (integration test)
function renderWithStore(component, { preloadedState } = {}) {
  const store = configureStore({ reducer: { cart: cartReducer }, preloadedState });
  return render(<Provider store={store}>{component}</Provider>);
}

test('cart shows correct item count', () => {
  renderWithStore(<CartIcon />, {
    preloadedState: { cart: { items: [{ id: 1 }], total: 50 } },
  });
  expect(screen.getByText('1')).toBeInTheDocument();
});

// ── Testing Zustand Store ──
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

test('zustand increment', () => {
  const { result } = renderHook(() => useCounterStore());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

---




## Snapshot Testing — When to Use

```tsx
// Captures rendered output and compares to stored snapshot
test('renders footer correctly', () => {
  const { asFragment } = render(<Footer />);
  expect(asFragment()).toMatchSnapshot();
});

// WHEN TO USE:
// ✅ Static UI with known structure (Footer, Header, Error pages)
// ✅ Catching unexpected rendering changes
// ❌ NOT for dynamic content (dates, random IDs)
// ❌ NOT as sole test — always pair with behavioral tests

// INLINE SNAPSHOTS (preferred — visible in test file):
test('renders greeting', () => {
  render(<Greeting name="Alice" />);
  expect(screen.getByRole('heading')).toMatchInlineSnapshot(`
    <h1>Hello, Alice!</h1>
  `);
});
```

---




## Accessibility Testing (a11y)

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('form has no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// COMMON A11Y ISSUES CAUGHT:
// - Missing form labels
// - Missing alt text on images
// - Insufficient color contrast
// - Missing ARIA attributes
// - Non-focusable interactive elements
```

---




## Test Organization Best Practices

```tsx
// ── Structure: Arrange, Act, Assert (AAA) ──
test('validates email format', async () => {
  // ARRANGE: set up the component
  const user = userEvent.setup();
  render(<EmailInput />);
  
  // ACT: simulate user behavior
  await user.type(screen.getByRole('textbox'), 'invalid-email');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // ASSERT: verify expected outcome
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});

// ── File structure ──
// src/
//   components/
//     Button/
//       Button.tsx
//       Button.test.tsx       ← unit + integration tests
//       Button.module.css
//   __tests__/
//     integration/            ← cross-component integration tests
//   e2e/                      ← Playwright E2E tests

// ── Coverage targets ──
// Statements: 80%+
// Branches:   75%+
// Functions:  80%+
// Lines:      80%+
// Critical paths (auth, payments): 95%+
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **React Hooks (testing hooks)** | [Hooks Deep Dive](03_Hooks_Deep_Dive.md) |
| **State Management (Redux/Zustand)** | [State Management](04_State_Management.md) |
| **CI/CD (test in pipeline)** | [DevOps CI/CD](../22_DevOps/19_CICD_Pipelines.md) — automated test runs |
| **Performance testing** | [React Performance](08_React_Performance.md) |
| **Component Patterns (what to test)** | [Component Patterns](02_Component_Patterns.md) |
| **JavaScript testing fundamentals** | [JS Error Handling](../16_JavaScript/07_JS_Error_Handling_Debugging.md) |

---


---

## 🏋️ Practice & Interview Questions — React

### Predict / Trace
**Q1.** What is the output order of console logs?
```jsx
function App() {
  console.log('render');
  useEffect(() => { console.log('effect'); }, []);
  console.log('render2');
  return <div/>;
}
```
<details><summary>Answer</summary>

`render` → `render2` → `effect`

`useEffect` runs **after** the component renders and the DOM is committed. Both `console.log`s in the function body run first.
</details>

**Q2.** Why does this cause an infinite loop?
```jsx
useEffect(() => {
  setCount(count + 1);
}, [count]);
```
<details><summary>Answer</summary>

`setCount(count+1)` → triggers re-render → `count` changes → effect runs again → infinite loop. **Fix**: remove `count` from deps and use functional update: `setCount(prev => prev + 1)` or change dependency logic.
</details>

### Coding Problems
**Q3.** ⭐ Implement a custom `useDebounce` hook.
<details><summary>Solution</summary>

```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler); // Cleanup on value/delay change
  }, [value, delay]);
  return debouncedValue;
}
```
</details>

**Q4.** ⭐ Implement `useFetch` — generic data fetching hook with loading/error states.
<details><summary>Solution</summary>

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.json())
      .then(d => { if(!cancelled) setData(d); })
      .catch(e => { if(!cancelled) setError(e); })
      .finally(() => { if(!cancelled) setLoading(false); });
    return () => { cancelled = true; }; // Cleanup for race conditions
  }, [url]);

  return { data, loading, error };
}
```
</details>

**Q5.** ⭐⭐ When should you use `useCallback` vs `useMemo`?
<details><summary>Answer</summary>

`useMemo`: memoizes a **computed value** — run expensive calculation, cache result.
`useCallback`: memoizes a **function reference** — prevent child re-renders when passing callbacks.
Both only useful when: (1) the child uses `React.memo`, or (2) the value/function is a dep of another hook. Premature optimization without these conditions = needless complexity.
</details>

**Q6.** ⭐⭐ Implement a `useLocalStorage` hook.
<details><summary>Solution</summary>

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue; }
    catch { return initialValue; }
  });

  const setStoredValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue];
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | When does useEffect with [] run? | Once after mount |
| 2 | When does useEffect with no array run? | After every render |
| 3 | Key prop in lists is used for | Reconciliation (identify changed elements) |
| 4 | React.memo prevents re-render when | Props haven't changed (shallow comparison) |
| 5 | useState is synchronous? | ❌ Batched, async in React 18 |
| 6 | Controlled vs uncontrolled component | Controlled=state managed in React; Uncontrolled=DOM manages it (ref) |
| 7 | useRef vs useState | useRef: doesn't trigger re-render; useState: does |
| 8 | StrictMode effect on effects | Runs effects twice (in dev) to detect side effects |



---

## 🧠 Deep Conceptual Questions — React Internals & Mental Models

**C1. What is the React reconciliation algorithm and why does the `key` prop matter?**
<details><summary>Deep Answer</summary>

React maintains a virtual DOM (VNode tree). On state change: React creates a new VNode tree, diffs it against the previous tree (diffing = reconciliation), applies minimal real DOM mutations. Naive tree diff: O(N³). React's heuristics: O(N). Heuristic 1: different element types → destroy and rebuild subtree. Heuristic 2: same type → update props, recurse into children. **`key` prop**: tells React the element's identity across renders. Without keys in lists: React diffs by position — inserting at beginning is O(N) DOM mutations. With stable keys: React identifies which item moved/added/removed → O(1) per change. Keys must be stable+unique per list — using index as key breaks this when list is reordered.
</details>

**C2. Why does React use a virtual DOM? What performance problem does it solve?**
<details><summary>Deep Answer</summary>

Direct DOM manipulation is expensive: each `div.style.color = 'red'` forces layout recalculation, style recalculation, repaint — potentially 3-17ms per operation. Doing 50 direct DOM changes = 50 potential reflows. Virtual DOM batches all changes: compute the full desired state in JS (fast, ~ms), diff against current state, apply only the MINIMUM necessary DOM mutations in one batch (one reflow). Net effect: many state changes → few DOM mutations → fewer reflows. In React 18: concurrent rendering further batches setState calls across async boundaries. **Note**: React's VirtualDOM is a means to an end (batching + diffing), not inherently "fast" — SolidJS/Svelte skip it entirely with fine-grained reactivity and are faster for some use cases.
</details>

**C3. What is React's fiber architecture and how does it enable concurrent features?**
<details><summary>Deep Answer</summary>

Before Fiber (React 15): reconciliation = synchronous, non-interruptible tree walk. A complex update > 16ms → UI janks (dropped frames). **Fiber** (React 16+): reconciliation reimplemented as a linked list of "fiber nodes." Each fiber = a unit of work that can be paused, resumed, or abandoned. The render phase (building the fiber tree) is **interruptible**: React can pause after any fiber, yield to the browser for frames/user input, then resume. The commit phase (applying DOM changes) remains synchronous (can't be interrupted — DOM must be consistent). This enables: concurrent mode, `useTransition` (lower priority updates), `Suspense`, `useDeferredValue`. The fundamental shift: from "one big synchronous render" to "cooperative multitasking renderer."
</details>

**C4. useEffect dependency array: what is "stale closure" and how to fix it?**
<details><summary>Deep Answer</summary>

```jsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000); // stale closure!
  return () => clearInterval(id);
}, []); // count not in deps
```
The interval callback captures `count` from the initial render (= 0). Even after count updates, the closure still sees 0 — it's "stale." **Fix 1**: include count in deps — effect re-runs, interval recreated (wasteful). **Fix 2**: use `useRef` to store latest count. **Fix 3**: functional update `setCount(c => c + 1)` doesn't read stale count. Root cause: JavaScript closures capture variables at creation time. React's fn components close over state at render time. With stale deps, the closure never refreshes. `eslint-plugin-react-hooks` detects missing deps.
</details>

**C5. When does React batch state updates, and when does it NOT?**
<details><summary>Deep Answer</summary>

**React 17 and below**: batches only inside React event handlers. `setTimeout`, `Promise.then`, native event listeners → NOT batched (each setState triggers a re-render). **React 18**: **Automatic Batching** — batches all setState calls everywhere (timeouts, Promises, native events). Each React event handler still flushes at end. Opt-out (rare): `flushSync(() => setX(1))` → forces synchronous re-render.

Rule: in React 18, multiple setStates in ANY context = one re-render per batch. No more worrying about whether you're in a React event or not.
</details>

**C6. What is the purpose of `useReducer` and when is it better than multiple `useState`?**
<details><summary>Deep Answer</summary>

`useReducer` is `useState` for complex state transitions. Better than multiple `useState` when: (1) next state depends on multiple state values together (reducer receives full state), (2) multiple actions lead to similar state updates (consolidate logic in one place), (3) complex state objects where partial updates have side effects, (4) testing — reducer is a pure function, easily unit-testable in isolation. Think: `useState` = `useReducer(reducer, initialState)` where reducer is `(state, newValue) => newValue`. `useReducer` makes state transitions explicit and traceable (Redux-like). Redux IS just `useReducer` + Context for global sharing.
</details>


> **Navigation**: [< Previous](06_React_Router.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_React_Performance.md)