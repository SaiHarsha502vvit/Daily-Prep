> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Fundamentals](01_React_Fundamentals.md) | [Next: Hooks →](03_Hooks_Deep_Dive.md)
> 🧠 **Mental Model**: See [Frontend Architecture Thinking](../14_Mental_Models/17_Frontend_Architecture_Thinking.md)

---

# 🧩 React Component Patterns & Styling

> Reusable, composable, testable component architecture

---

## 5W1H — Why Component Patterns?

- **WHAT**: Architectural patterns for structuring React components to ensure reusability, testability, and clear separation of concerns.
- **WHY**: As React applications grow, unstructured code (where data fetching, business logic, and UI rendering are mixed) becomes impossible to maintain, test, and reuse.
- **WHO**: Frontend engineers scaling applications beyond a few pages or building shared component libraries.
- **WHEN**: When components exceed 150-200 lines, when you need to reuse UI with different logic, or when props drilling becomes painful.
- **HOW**: By applying established patterns like Container/Presentational, Compound Components, Render Props (legacy/niche), and Context Providers.

---

### Historical Evolution

React component architecture shifted dramatically from class-based inheritance patterns to function-based composition, driven by the need to share logic without altering component hierarchies.

| Year | Milestone |
|------|-----------|
| 2014 | Flux architecture debuts — unidirectional data flow shapes component design |
| 2015 | Higher-Order Components emerge as the primary reuse pattern in class-component React |
| 2017 | Render Props pattern gains traction (React Router v4, Downshift) |
| 2018 | Compound Components and Context API rewrite (React 16.3) enable declarative composition |
| 2019 | Hooks release (React 16.8) — function components become the default architecture |

Before Hooks, React teams relied on HOCs and render props to share logic, which led to "wrapper hell" where components were nested five or more levels deep. The introduction of Hooks in 2019 allowed logic to be composed as functions rather than wrappers, making the component tree shallow and readable.

**Predecessor:** Higher-Order Components (2015) — the dominant pre-hooks pattern for logic reuse in class-based React
**Modern anchor:** Today Hooks are the standard; HOCs and render props are legacy patterns used only in niche scenarios

### Production Reality

| Failure Mode | Where It Bites | Mitigation |
|--------------|---------------|------------|
| **Re-render storm** | HOC chains or cross-cutting wrappers each trigger renders; profiler shows 50+ renders per click | Replace HOC chains with hooks; memoize expensive container computations |
| **Context thrashing** | Over-broad providers (e.g., AuthContext holding user + tokens + preferences) re-render every consumer on any field change | Split into narrow contexts (AuthContext, ThemeContext); use selector libraries for fine-grained subscriptions |
| **Ref forward mis-attachment** | `forwardRef` omitted on wrapper components; focus-management libraries break silently | Always forward refs through component boundaries; attach refs to the actual interactive element |

Component pattern failures manifest at scale because small architectural decisions (one extra wrapper, one monolithic context) compound into cascading re-render storms in trees with hundreds of nodes.

---

### Variant Trade-offs: Logic Reuse Patterns

| Pattern | Mental Model | Best For | Trade-off |
|---------|--------------|----------|-----------|
| **Higher-Order Components (HOC)** | Wrap component with extra behavior via function composition | Cross-cutting concerns (auth, logging, analytics) | "Wrapper hell" — deeply nested component trees; prop name collisions |
| **Render Props** | Pass a function as a prop that renders UI | Sharing component behavior while keeping tree flat | Verbose JSX; callback pyramid with nested patterns |
| **Custom Hooks (2019+)** | Extract logic into a reusable function | All modern logic reuse — data fetching, subscriptions, DOM events | Requires discipline to compose correctly; hooks rules must be followed |
| **Compound Components** | Parent component manages implicit shared state for child components | UI kits (Tabs, Accordions, Select), design-system consistency | Requires Context; consumers must understand implicit API |

**Selection rule:** Choose **Custom Hooks** for 99% of logic reuse in modern React — they flatten the tree and compose naturally. Use **Compound Components** for UI primitives where the parent-child relationship is semantically meaningful (e.g., `<Tabs><Tab /></Tabs>`). Avoid HOCs and render props in new code; legacy libraries still use them.

---

## Pattern 1: Container + Presentational

```jsx
// PRESENTATIONAL (dumb): Only renders UI, receives data via props
function UserList({ users, onSelectUser }) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id} onClick={() => onSelectUser(u.id)}>
          {u.name} — {u.email}
        </li>
      ))}
    </ul>
  );
}

// CONTAINER (smart): Handles data fetching & logic
function UserListContainer() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;
  return (
    <UserList users={users} onSelectUser={(id) => navigate(`/users/${id}`)} />
  );
}
```

---

## Pattern 2: Compound Components

```jsx
// Like <select> + <option> — components that work together
function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.TabList = ({ children }) => <div className="tab-list">{children}</div>;
Tabs.Tab = ({ id, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      className={activeTab === id ? "active" : ""}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};
Tabs.Panel = ({ id, children }) => {
  const { activeTab } = useContext(TabsContext);
  return activeTab === id ? <div className="panel">{children}</div> : null;
};

// Usage — clean, readable API:
<Tabs defaultTab="profile">
  <Tabs.TabList>
    <Tabs.Tab id="profile">Profile</Tabs.Tab>
    <Tabs.Tab id="settings">Settings</Tabs.Tab>
  </Tabs.TabList>
  <Tabs.Panel id="profile">
    <ProfileForm />
  </Tabs.Panel>
  <Tabs.Panel id="settings">
    <SettingsForm />
  </Tabs.Panel>
</Tabs>;
```

---

## Pattern 3: Render Props & Higher-Order Components

```jsx
// RENDER PROPS: Pass a function as children/prop that renders UI
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return render(position); // delegate rendering to caller
}

// Usage:
<MouseTracker
  render={({ x, y }) => (
    <p>
      Mouse: {x}, {y}
    </p>
  )}
/>;

// HOC (Higher-Order Component): Wraps component with extra behavior
function withAuth(WrappedComponent) {
  return function WithAuth(props) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard);

// NOTE: Custom hooks have largely replaced render props and HOCs
// Prefer: const position = useMousePosition(); ← cleaner!
```

---

### WITHOUT vs WITH Hooks: Logic Reuse

**WITHOUT** (HOC pattern — pre-2019):
```jsx
// Wrapper hell: 5 levels of nesting
<withRouter>
  <withTheme>
    <withAuth>
      <withData>
        <MyComponent />
```

**WITH** (Custom Hook — 2019+):
```jsx
function MyComponent() {
  const router = useRouter();
  const theme = useTheme();
  const auth = useAuth();
  const data = useData();
  // shallow tree, plain function calls
}
```

---

## Pattern 4: Styling Approaches

**Four ways to style a React component — what each buys and what
it costs at runtime:**

| Approach                       | How it works                                                        | You gain                                                          | You give up                                                     |
|--------------------------------|---------------------------------------------------------------------|-------------------------------------------------------------------|------------------------------------------------------------------|
| CSS Modules (`.module.css`)    | Bundler hashes class names per file so they can't collide across components | Full CSS power, scoped by default, zero runtime cost, works with any tooling | Dynamic styles from props are awkward — you toggle classes, not values |
| Tailwind CSS                   | Utility classes; the JIT compiler generates only the classes you actually use | Very fast to author, no naming, forced design-system consistency, tiny final CSS | Long `className` strings; learning curve for the utility vocabulary |
| CSS-in-JS (styled-components, Emotion) | Style objects/tagged templates compiled to real CSS at *runtime* per component | Styles are first-class JS — receive props, compose, extract themes | Runtime cost (extra work per render), larger bundle, SSR quirks (styles injected after paint) |
| Inline styles (`style={{...}}`) | React sets DOM `element.style.*` from the object each render        | Simplest possible for one-off dynamic values                       | No pseudo-classes, no media queries, no keyframes, no selector reuse; not for production |

**How to pick, one line each:**

- **CSS Modules** — the safe default. No runtime cost, no naming
  fights, works everywhere. Reach for it first.
- **Tailwind** — the safe default *if* your team commits to the
  utility mental model. Once you're past the vocabulary, iteration
  speed is dramatically higher.
- **styled-components / Emotion** — when styles legitimately depend
  on runtime props (`theme.mode`, `variant`, computed values) and
  toggling classes would be painful. Accept the runtime tax
  deliberately.
- **Inline styles** — one-off animations, dynamic values you can't
  express in a class. Never for the app's main styling surface.

```jsx
// CSS MODULES:
import styles from "./Button.module.css";
function Button({ children }) {
  return <button className={styles.primary}>{children}</button>;
}

// TAILWIND CSS:
function Button({ children }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      {children}
    </button>
  );
}

// STYLED-COMPONENTS:
import styled from "styled-components";
const StyledButton = styled.button`
  background: ${(props) => (props.primary ? "#0070f3" : "#eee")};
  color: ${(props) => (props.primary ? "#fff" : "#333")};
  padding: 8px 16px;
  border-radius: 4px;
  &:hover {
    opacity: 0.8;
  }
`;
// Usage: <StyledButton primary>Click</StyledButton>
```

---

## Pattern 5: Error Boundaries

```jsx
// Class component (only way to do error boundaries in React)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo); // send to Sentry/DataDog
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage: Wrap around any tree that might throw
<ErrorBoundary>
  <UserProfile />
</ErrorBoundary>;
```

---

## Pattern 6: Polymorphic Components

```tsx
// The `as` prop pattern — render as ANY HTML element or component
// Used by Chakra UI, MUI, Headless UI

interface BoxProps<T extends React.ElementType> {
  as?: T;
  children: React.ReactNode;
}

function Box<T extends React.ElementType = 'div'>({
  as, children, ...props
}: BoxProps<T> & React.ComponentPropsWithoutRef<T>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage — same component, different HTML elements:
<Box>Default div</Box>
<Box as="section">Renders as section</Box>
<Box as="a" href="/about">Renders as anchor tag</Box>
<Box as={NavLink} to="/home">Renders as React Router NavLink</Box>
```

---

## Pattern 7: Controlled vs Uncontrolled

```tsx
// UNCONTROLLED: DOM holds the state (simple forms)
function UncontrolledSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => console.log(inputRef.current?.value);
  return <input ref={inputRef} defaultValue="" />;
}

// CONTROLLED: React holds the state (complex forms, validation)
function ControlledSearch({ onSearch }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setError(value.length < 3 ? "Min 3 characters" : "");
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
      <button onClick={() => onSearch(query)} disabled={!!error}>
        Search
      </button>
    </>
  );
}

// WHEN TO USE:
// Uncontrolled: simple forms, no validation, no dynamic behavior
// Controlled: validation, conditional UI, dynamic defaults, form libraries
```

---

## Pattern 8: Provider + Composition

```tsx
// ── Problem: Prop Drilling ──
// App → Layout → Sidebar → UserMenu → Avatar (needs user data!)
// Passing `user` through 4 components that don't use it = prop drilling.

// ── Solution: Context Provider ──
const ThemeContext = createContext({ theme: "light", toggle: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Any deeply nested component can access theme directly:
function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  return <button onClick={toggle}>Current: {theme}</button>;
}

// ── Composition: children as a slot ──
// Instead of passing data down, compose at the top level
function App() {
  const user = useAuth();
  return (
    <Layout>
      <Sidebar>
        <UserMenu>
          <Avatar user={user} /> {/* user passed here, not drilled */}
        </UserMenu>
      </Sidebar>
    </Layout>
  );
}
```

---

## 🎓 MIT/KTH SYSTEMS DEEP DIVE: The Mount/Unmount Memory Trap

Junior engineers think in terms of "props and JSX." Systems engineers think in terms of **DOM Node Lifecycles and React Fiber Instances**.

### Trap 1: The Remount Annihilation (Dynamic Component Keys)

If you dynamically change the type of a wrapper or assign dynamic numbers (like `Math.random()`) to a key on every render, React will destroy the actual DOM nodes and rebuild them from scratch.

- **The Symptoms:** Inputs lose focus immediately after you type a letter, animations restart endlessly, IFrames flash white, and network requests re-fire.
- **The Fix:** Never declare components _inside_ other components, and use deterministic `key` props tied to database IDs, not array indexes.

### Trap 2: The "Over-Containerized" DOM (V8 Memory Bloat)

Using `<div className="wrapper">` around everything balloons the DOM tree depth. Browsers like Chrome (V8) allocate layout constraints per node. Deeply nested DIVs cause **expensive Reflow/Layout thrashing**.
**The Fix:** Use `<React.Fragment>` or `<>` for logical wrapping without physical DOM manifestation.

### 💻 System Challenge (VSCode): Fix the Component Remount Trap

_VSCode Pro-Tip: Hovering over the nested component in VSCode will often reveal ESLint warnings about `react/no-unstable-nested-components`. Always heed this warning._

```jsx
// ❌ THE BUG: The user loses focus on the <input> after typing exactly 1 character.

function UserForm({ id }) {
  // BUG: Declaring a component INSIDE a render function.
  // Every time UserForm renders, `InputField` gets a NEW memory address.
  // React sees <InputField> -> <InputField (new address)>, destroys the
  // old DOM input, and creates a brand new one. Goodbye focus!

  const InputField = ({ value, onChange }) => (
    <input className="blue-border" value={value} onChange={onChange} />
  );

  const [text, setText] = useState("");

  return <InputField value={text} onChange={(e) => setText(e.target.value)} />;
}
```

```jsx
// ✅ THE FIX: Extract components to stable top-level memory addresses.
const InputField = ({ value, onChange }) => (
  <input className="blue-border" value={value} onChange={onChange} />
);

function UserForm({ id }) {
  const [text, setText] = useState("");
  return <InputField value={text} onChange={(e) => setText(e.target.value)} />;
}
```

---

## 🏋️ Practice Challenges

**Challenge 1 (Container vs Presentational):** You have a `<ProductTable />` component that fetches products from `/api/products` and renders a table. How would you refactor this using the Container + Presentational pattern?

<details><summary>Answer</summary>

Split it into two components:

1. `ProductTable` (Presentational): Takes `products` as a prop and renders the HTML `<table>`. It knows nothing about APIs.
2. `ProductTableContainer` (Container): Uses `useEffect` to fetch `/api/products`, stores them in state, and renders `<ProductTable products={products} />`.
This makes the `ProductTable` testable with mock data and reusable with different data sources.
</details>

**Challenge 2 (Compound Components):** What is the main advantage of the Compound Component pattern (like `<Tabs><Tabs.Tab>...</Tabs.Tab></Tabs>`) over passing a massive configuration object as a prop (like `<Tabs config={[{id: 't1', label: 'Tab 1'}, ...]} />`)?

<details><summary>Answer</summary>

Compound components offer **Inversion of Control** and layout flexibility.

With a config object, the `<Tabs>` component internally dictates exactly how and where the tabs render. If a user wants to inject an icon next to a specific tab label or change the order of the TabList vs TabPanel, they can't without changing the `<Tabs>` source code.

With compound components, the _consumer_ writes the JSX, so they control the layout, order, and styling of children, while the parent `<Tabs>` implicitly manages the shared state via Context.

</details>

**Challenge 3 (Prop Drilling vs Composition):** A `<Header>` needs the current user's avatar, but `<Header>` is deeply nested inside `<Layout>`, which is inside `<App>`. How can you use **Composition** (not Context, not Redux) to avoid passing `user` through `<Layout>`?

<details><summary>Answer</summary>

Pass the Avatar as a `children` prop (or a specific named slot prop) from the top level where the `user` is known:

```jsx
// In App.js
const user = useAuth();
return (
  <Layout headerSlot={<Header rightElement={<Avatar user={user} />} />}>
    <PageContent />
  </Layout>
);
```

This way, `Layout` and `Header` never need to know about the `user` object. They just render the React nodes passed to them.

</details>

---

## 🔗 Cross-References

| Topic                               | Related Content                                                      |
| ----------------------------------- | -------------------------------------------------------------------- |
| **Hooks Deep Dive**                 | [Hooks](03_Hooks_Deep_Dive.md) — useState, useContext, useRef        |
| **State Management**                | [State](04_State_Management.md) — Redux, Zustand, Context            |
| **Testing components**              | [Testing](07_React_Testing.md) — RTL, MSW                            |
| **React Performance**               | [Performance](08_React_Performance.md) — memoization, lazy loading   |
| **CSS styling**                     | [CSS Architecture](../18_CSS_Complete/04_CSS_Modern_Architecture.md) |
| **TypeScript (generic components)** | [React TypeScript](05_React_TypeScript.md)                           |


---

## Reality Check

**"Component patterns are historical — hooks replaced them"** — Hooks replaced the CLASS-ERA patterns (HOCs and render props survive only at library boundaries), but the COMPOSITION patterns became more important, not less: compound components (Tabs.List/Tabs.Panel sharing implicit context — the API every design system converges on), slot-style children props (layout components that never know their content), controlled/uncontrolled DUAL-mode components (value+onChange OR defaultValue — the pattern every reusable input must implement, with the switching-modes warning as its contract), and state-reducer/headless patterns (logic without rendering — the architecture of every modern component library). The pattern catalog rotated; the discipline did not.

**"Custom hooks are the reuse mechanism for everything"** — Custom hooks reuse STATEFUL LOGIC; they cannot reuse RENDERING (that is components) and they cannot share state BETWEEN callers (two components calling useCart get two carts — the misconception that quietly breaks apps; sharing requires context or a store behind the hook). The design smell taxonomy: a hook returning JSX is a component in disguise; a hook with boolean flags steering divergent behaviors is two hooks; a hook wrapping one useState with no logic is ceremony. The clean split — headless hook owns behavior, thin component owns markup — is what makes both testable and swappable.

**"Compound components are showcase API design"** — Compound components are a COUPLING decision with real trade-offs: implicit context between parent and children gives the flexible composition (any layout between Tabs and Tab works) but breaks silently when consumers wrap children in unexpected structure (the styled-wrapper that severed context), fights static analysis (which Tab indexes exist is unknowable), and complicates TypeScript narrowing. The alternatives ladder: props-as-config (rigid, analyzable — right for constrained UIs), compound (flexible, implicit — right for design systems), and render-callback (maximum control, maximum ceremony). Choosing by API aesthetics rather than consumer-flexibility requirements is how libraries acquire three redundant APIs.

**"Container/presentational is the architecture pattern"** — The strict two-class split died with hooks (data hooks made every component potentially self-fetching), but its RESIDUE is the durable rule: components that render markup should not decide business logic, and components that orchestrate should not know about pixels. The modern shape is headless-plus-skin: behavior in hooks (useSelection, usePagination), presentation in dumb components consuming them — the same separation, relocated. Teams that declared the pattern dead and fused everything re-learn why it existed the first time they need the same logic under a second design or in a test.

**"Error boundaries are an advanced edge-case feature"** — Error boundaries are the frontend's BLAST-RADIUS design, and their limits are the actual knowledge: they catch render/lifecycle errors below them — NOT event handlers (try/catch yourself), NOT async/awaited failures (they resolve after render — route them into state), NOT the boundary's own render — and placement is architecture (per-route so navigation survives, per-widget so one dead card does not kill the dashboard, never one global catch-all that whitescreens everything equally). The pairing that completes the story: boundary catches, fallback offers retry (reset keys/remount), and the error reports to tracking with component-stack context. An app without designed boundaries has ONE boundary: the white screen.
