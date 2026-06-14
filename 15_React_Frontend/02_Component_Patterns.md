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

```
APPROACH          │ PROS                     │ CONS
────────────────────┼──────────────────────────┼───────────────────────────────
CSS Modules       │ Scoped, no conflicts     │ Still CSS files
(.module.css)     │ Works with any tooling   │ Dynamic styles = awkward
────────────────────┼──────────────────────────┼───────────────────────────────
Tailwind CSS      │ Utility-first, fast      │ Long class strings
                  │ No naming, consistent    │ Learning curve
────────────────────┼──────────────────────────┼───────────────────────────────
styled-components │ CSS-in-JS, dynamic props │ Runtime overhead
                  │ Full JS power             │ Bundle size
────────────────────┼──────────────────────────┼───────────────────────────────
Inline styles     │ Simple, dynamic          │ No pseudo-classes, media query
(style={{}})      │ No tooling               │ Not recommended for production
```

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
