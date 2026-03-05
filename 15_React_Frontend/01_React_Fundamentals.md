> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next: Hooks Deep Dive →](03_Hooks_Deep_Dive.md)
> 🧠 **Mental Model**: See [Frontend Architecture Thinking](../14_Mental_Models/17_Frontend_Architecture_Thinking.md)

---

# ⚛️ React Fundamentals — Core Concepts from Scratch

> Everything you need to understand before writing production React — Components, JSX, Props, State

---

## Part 1: What is React and Why?


> React is a LIBRARY for building user interfaces (not a framework!)
>
> KEY IDEAS:
> 1. Component-Based: UI = tree of reusable components
> 2. Declarative: Describe WHAT to render, React handles HOW
> 3. Virtual DOM: React diffs changes, updates only what changed
> 4. One-Way Data Flow: Data flows Parent → Child via props
>
> MENTAL MODEL:
> Traditional: Manually update DOM when data changes (imperative)
> React: UI = f(state) — UI is a FUNCTION of state (declarative)
> When state changes → React re-renders → diffs → updates DOM


---

## Part 2: JSX — JavaScript + HTML

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

## Part 4: Props — Data Flows Down

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

function Form() {
  const [form, setForm] = useState({ name: '', email: '' });
  
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value })); // create NEW object
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

## Part 6: Event Handling

```jsx
function EventExamples() {
  // Click
  const handleClick = (e) => {
    e.preventDefault();       // prevent default behavior
    e.stopPropagation();      // stop event bubbling
    console.log('Clicked!');
  };
  
  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();       // ALWAYS for forms!
    // process form data
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

## Part 8: Component Lifecycle Cheat Sheet

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  FUNCTION COMPONENT LIFECYCLE (via Hooks)                                        ║
║                                                                                  ║
║  Mount (component appears):                                                      ║
║    1. Function called → JSX returned → DOM updated                               ║
║    2. useEffect(() => { ... }, []) runs ONCE after first render                  ║
║                                                                                  ║
║  Update (state/props change):                                                    ║
║    1. Function re-called → new JSX returned → DOM diffed & updated               ║
║    2. useEffect(() => { ... }, [dep]) runs if dep changed                        ║
║                                                                                  ║
║  Unmount (component removed):                                                    ║
║    1. Cleanup function from useEffect runs                                       ║
║    useEffect(() => {                                                             ║
║      const timer = setInterval(...);                                             ║
║      return () => clearInterval(timer);  // ← cleanup                            ║
║    }, []);                                                                       ║
║                                                                                  ║
║  RENDER CYCLE:                                                                   ║
║  Props/State change → React re-renders component → Virtual DOM diff              ║
║  → Only changed DOM nodes updated (efficient!)                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_Component_Patterns.md)