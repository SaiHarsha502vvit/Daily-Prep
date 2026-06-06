**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← State Management](04_State_Management.md) | [Next: Routing →](06_React_Router.md)

---

# 🔷 React + TypeScript — Type-Safe Components

---

## 5W1H — Why TypeScript with React?

- **WHAT**: TypeScript is a statically typed superset of JavaScript. Using it with React means strictly defining the "shape" of your props, state, and context.
- **WHY**: Without types, you don't know what props a component expects until you read its source code (or it crashes at runtime). TS catches bugs at compile time, enables IDE autocompletion, acts as living documentation, and gives you confidence during refactoring.
- **WHO**: Microsoft created TypeScript. It is now the industry standard for production React apps.
- **WHEN**: Always, for any project that will be maintained for more than a month or by more than one developer.
- **HOW**: By using Interfaces and Type Aliases to define React constructs (`ReactNode`, `ChangeEvent`, `ComponentProps`).

---

🔬 **Section Challenge — Part 1: Why TypeScript with React?**

**Challenge 1 (Reasoning):** TypeScript uses **structural typing** ("duck typing"), not nominal typing like Java. If two interfaces have the same shape but different names, TypeScript considers them compatible. Why is this a feature for React, and when does it cause problems?
<details><summary>Answer</summary>

Structural typing is a feature for React because components don't care about type NAMES — they care about SHAPE. If `UserCard` expects `{ name: string, age: number }`, you can pass ANY object with those fields, even if it came from a completely different interface. This enables seamless composition: a `UserFromAPI` type and a `UserFromForm` type both work as props without explicit casting or adapter patterns. **Problem:** It can cause false compatibility. If `CartItem` has `{ id: string, name: string, quantity: number }` and `Product` has `{ id: string, name: string, quantity: number }`, TypeScript treats them as identical — you could accidentally pass a `Product` where a `CartItem` is expected. Fix: use **branded types** (`type CartItemId = string & { __brand: 'CartItem' }`) to make structurally identical types nominally distinct.
</details>

## Part 2: Typing Components & Props

```tsx
// ── Basic Props ──
interface UserCardProps {
  name: string;
  age: number;
  email?: string;               // optional
  role: 'admin' | 'user';      // union literal type
  onDelete: (id: string) => void;  // callback
}

function UserCard({ name, age, email, role, onDelete }: UserCardProps) {
  return (
    <div>
      <h3>{name} ({age})</h3>
      {email && <p>{email}</p>}
      <span>{role}</span>
    </div>
  );
}

// ── Children Props ──
interface CardProps {
  title: string;
  children: React.ReactNode;   // ← accepts any renderable content
}

function Card({ title, children }: CardProps) {
  return <div className="card"><h3>{title}</h3>{children}</div>;
}

// ── Props with generics (reusable list component) ──
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return <ul>{items.map(item => <li key={keyExtractor(item)}>{renderItem(item)}</li>)}</ul>;
}

// Usage:
<List<User>
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

---

## Part 3: Typing Hooks

```tsx
// ── useState ──
const [count, setCount] = useState(0);               // inferred as number
const [user, setUser] = useState<User | null>(null);  // explicit when initially null

// ── useRef ──
const inputRef = useRef<HTMLInputElement>(null);       // DOM element type
const countRef = useRef<number>(0);                    // mutable value

// ── useReducer ──
type Action = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number };       // discriminated union

interface State { count: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    case 'DECREMENT': return { count: state.count - 1 };
    case 'SET': return { count: action.payload };
  }
}

// ── useContext ──
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
```

---

## Part 4: Typing Events & Forms

```tsx
// ── Event Handlers ──
function Form() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}

// COMMON EVENT TYPES:
// React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
// React.FormEvent<HTMLFormElement>
// React.MouseEvent<HTMLButtonElement>
// React.KeyboardEvent<HTMLInputElement>
// React.FocusEvent<HTMLInputElement>
```

---

## Part 5: Utility Types for React

```tsx
// Pick only some props
type UserName = Pick<User, 'firstName' | 'lastName'>;

// Omit specific props
type UserWithoutId = Omit<User, 'id'>;

// Make all props optional
type PartialUser = Partial<User>;

// Make all props required
type RequiredUser = Required<User>;

// Component props extraction
type ButtonProps = React.ComponentProps<typeof Button>;

// Extend HTML element props
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary';
  isLoading?: boolean;
}

function CustomButton({ variant, isLoading, children, ...rest }: CustomButtonProps) {
  return (
    <button className={`btn-${variant}`} disabled={isLoading} {...rest}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
// Gets onClick, disabled, className, etc. for FREE from HTML attributes
```

---

🔬 **Section Challenge — Part 5: Utility Types for React**

**Challenge 1 (Reasoning):** The `CustomButton` extends `React.ButtonHTMLAttributes<HTMLButtonElement>` and spreads `...rest`. If a parent passes `className="external"` and `CustomButton` also sets `className={\`btn-${variant}\`}` internally, which one wins? How do design systems solve this?
<details><summary>Answer</summary>

In the current code, `{...rest}` is spread AFTER the internal className in the JSX props. But JSX doesn't "merge" className — the LAST one wins. So `...rest` overwrites the internal className. The parent's `className="external"` replaces `btn-primary` entirely. **Fix:** Design systems use explicit merging: `className={clsx(\`btn-${variant}\`, rest.className)}` using a utility like `clsx` or `tailwind-merge`. This concatenates both classes. Libraries like Radix and Shadcn/ui use a`cn()`utility for this. **Deeper issue:** This is why the spread pattern (`...rest`) is dangerous — it passes ALL HTML attributes, including`style`,`className`, and event handlers that might conflict with internal behavior. Some design systems use`Omit<React.ButtonHTMLAttributes, 'className'>` to prevent external className, forcing users to use the component's own `variant`/`size` props instead.
</details>

## Quick Reference: Common Types

```
┌────────────────────────────────┬──────────────────────────────────────────────┐
│ What                          │ Type                                          │
├────────────────────────────────┼──────────────────────────────────────────────┤
│ Component children            │ React.ReactNode                               │
│ Single element child          │ React.ReactElement                            │
│ Style object                  │ React.CSSProperties                           │
│ Ref to DOM element            │ React.RefObject<HTMLDivElement>               │
│ Set state function            │ React.Dispatch<SetStateAction<T>>             │
│ onChange for input            │ React.ChangeEvent<HTMLInputElement>           │
│ onClick for button            │ React.MouseEvent<HTMLButtonElement>           │
│ onSubmit for form             │ React.FormEvent<HTMLFormElement>              │
└────────────────────────────────┴──────────────────────────────────────────────┘
```


---

🔬 **Section Challenge — Quick Reference: Common Types**

**Challenge 1 (Reasoning):** The Quick Reference lists `React.ReactNode` for children and `React.ReactElement` for single element child. What is the EXACT difference, and why does typing children as `ReactElement` instead of `ReactNode` break common patterns?
<details><summary>Answer</summary>

`ReactNode = ReactElement | string | number | boolean | null | undefined | Iterable<ReactNode>`. It accepts ANYTHING renderable. `ReactElement` is ONLY a JSX element (`<div>`, `<Component />`). If you type children as `ReactElement`, these break: `<Card>Hello</Card>` (string child), `<Card>{count}</Card>` (number), `<Card>{isAdmin && <Admin />}</Card>` (boolean | ReactElement), `<Card>{items.map(...)}</Card>` (array). All of these are valid React children but NOT `ReactElement`. **Rule:** Use `ReactNode` for children (99% of cases). Use `ReactElement` only when you need to clone/inspect the child (e.g., `React.cloneElement(children)` — which requires a single element, not a string). `JSX.Element` is the return type of JSX expressions — it's `ReactElement<any, any>` with less type information. Prefer `ReactElement` or `ReactNode` over `JSX.Element`.
</details>

## Advanced TypeScript Patterns for React

```
THE HISTORY OF TYPING REACT:
  2015: Flow (Facebook) was the default type checker for React.
  2018: TypeScript won. React 16.8+ (hooks) + TypeScript = standard.
  2023: Next.js, Remix, all major frameworks ship with TS by default.
  2025: React 19 types rewritten to be stricter, forwardRef deprecated.
  
  WHY DID TYPESCRIPT WIN over Flow?
  → Microsoft invested heavily in tooling (VS Code autocomplete)
  → Better community adoption → more @types/* packages
  → DefinitelyTyped repository: 10,000+ type definitions
  
  ANALOGY: TypeScript is a BLUEPRINT for your code.
  Without TS: You hand someone building materials and say "build a house."
  With TS:    You hand them blueprints + materials. 
  Mistakes are caught at the drawing board, not when the roof collapses.
```

### Discriminated Unions — Type-Safe State Machines

```tsx
// PROBLEM: API calls have 3 states: loading, success, error.
// How do you type this so TypeScript KNOWS what's available when?

// BAD: optional fields everywhere
interface BadState {
  loading: boolean;
  data?: User[];
  error?: string;
}
// Can you have data AND error? Is loading false when error exists?
// TypeScript can't help — every field is optional.

// GOOD: Discriminated union — mutually exclusive states
type RequestState<T> =
  | { status: 'idle' }                            // nothing happened yet
  | { status: 'loading' }                         // no data, no error
  | { status: 'success'; data: T }                // data guaranteed!
  | { status: 'error'; error: string; retryCount: number };

function UserList() {
  const [state, setState] = useState<RequestState<User[]>>({ status: 'idle' });

  // TypeScript narrows the type based on status check:
  if (state.status === 'success') {
    // TypeScript KNOWS state.data exists here! No optional chaining needed.
    return <ul>{state.data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
  }
  if (state.status === 'error') {
    // TypeScript KNOWS state.error and state.retryCount exist here!
    return <div>Error: {state.error} (retried {state.retryCount}x)</div>;
  }
  if (state.status === 'loading') {
    return <Spinner />;
    // state.data → TypeScript ERROR: Property 'data' does not exist
  }
  return <button onClick={() => fetchUsers()}>Load Users</button>;
}

// WHERE USED IN REAL WORLD:
// React Router v6: loader data states
// Redux Toolkit: query states (isLoading, isError, isSuccess)
// Form libraries: idle/submitting/success/error
```

### Generic Components — Ultimate Reusability

```tsx
// LEVEL 1: Generic List (already seen basics — now more powerful)
interface SelectProps<T> {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;
}

function Select<T>({ items, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select
      value={value ? String(getValue(value)) : ''}
      onChange={e => {
        const selected = items.find(i => String(getValue(i)) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      <option value="">Select...</option>
      {items.map(item => (
        <option key={String(getValue(item))} value={String(getValue(item))}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  );
}

// Usage: TypeScript infers T from the items array!
<Select
  items={users}                    // T is inferred as User
  value={selectedUser}
  onChange={user => console.log(user.id)}  // user is typed as User!
  getLabel={u => u.name}
  getValue={u => u.id}
/>

// LEVEL 2: Generic Table Component
interface Column<T> {
  key: keyof T;                          // column must be a key of T!
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

function Table<T extends { id: string | number }>({
  data, columns, onRowClick
}: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>{columns.map(c => <th key={String(c.key)}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Usage: fully type-safe columns!
<Table
  data={users}
  columns={[
    { key: 'name', header: 'Name' },           // ✓ key must exist on User
    { key: 'email', header: 'Email' },          // ✓ 
    { key: 'role', header: 'Role', render: (v) => <Badge>{v}</Badge> },
    // { key: 'nonexistent', header: 'X' }      // ✗ TypeScript ERROR!
  ]}
/>

// LEVEL 3: Generic API Hook
function useQuery<T>(url: string) {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' });
  
  useEffect(() => {
    setState({ status: 'loading' });
    fetch(url)
      .then(r => r.json())
      .then((data: T) => setState({ status: 'success', data }))
      .catch(e => setState({ status: 'error', error: e.message, retryCount: 0 }));
  }, [url]);
  
  return state;
}

// Usage: T is inferred or explicitly set
const usersState = useQuery<User[]>('/api/users');  // state.data is User[]!
```

### Utility Types — TypeScript's Power Tools

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
}

// PICK: Select specific keys from a type
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;
// = { id: string; name: string; avatar: string }

// OMIT: Remove specific keys
type CreateUserDTO = Omit<User, 'id' | 'createdAt'>;
// = { name: string; email: string; avatar: string; role: ... }

// PARTIAL: Make ALL fields optional
type UpdateUserDTO = Partial<User>;
// = { id?: string; name?: string; email?: string; ... }
// Perfect for PATCH requests where only some fields are sent

// REQUIRED: Make ALL fields required (opposite of Partial)
type StrictUser = Required<User>;  // no optional fields

// RECORD: Map keys to a value type
type RolePermissions = Record<User['role'], string[]>;
// = { admin: string[]; editor: string[]; viewer: string[] }
const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

// EXTRACT / EXCLUDE: Filter union types
type AdminOrEditor = Extract<User['role'], 'admin' | 'editor'>;
// = 'admin' | 'editor'

type NonAdmin = Exclude<User['role'], 'admin'>;
// = 'editor' | 'viewer'

// RETURNTYPE: Get the return type of a function
async function fetchUsers(): Promise<User[]> { /* ... */ }
type FetchResult = ReturnType<typeof fetchUsers>;
// = Promise<User[]>
// Awaited<FetchResult> = User[]

// PARAMETERS: Get function parameter types as a tuple
type FetchParams = Parameters<typeof fetchUsers>;
// = [] (no parameters)

// REAL-WORLD: Creating a form component that adapts to any entity
type FormProps<T> = {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: Partial<T>) => Partial<Record<keyof T, string>>;
};
// Form<User>, Form<Product>, Form<Order> — all type-safe!
```

### Polymorphic "as" Prop — Design System Pattern

```tsx
// Used by: Chakra UI, Radix, MUI, Headless UI
// The component renders as ANY HTML element or React component.

type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'children'>;

function Box<E extends React.ElementType = 'div'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage:
<Box>Default div</Box>
<Box as="section">Renders as section</Box>
<Box as="a" href="/about">Renders as anchor with href!</Box>
<Box as="button" onClick={() => alert('!')}>Renders as button!</Box>
// TypeScript knows: if as="a", then href is valid. onClick is valid for button.
// if as="a", onClick is NOT valid (anchor doesn't have onClick in same way).
```

---

---

🔬 **Section Challenge — Advanced TypeScript Patterns for React**

**Challenge 1 (Reasoning):** The polymorphic `Box` component uses `React.ComponentPropsWithoutRef<E>` to infer valid props based on the `as` prop. Why does this use `WithoutRef` instead of `WithRef`, and what would break if you used `React.ComponentProps<E>` (which includes ref)?
<details><summary>Answer</summary>

`React.ComponentProps<E>` includes the `ref` prop in its type. But refs work differently for different element types: `ref` for `<div>` is `React.Ref<HTMLDivElement>`, for `<input>` it's `React.Ref<HTMLInputElement>`, and for a custom component it's whatever `forwardRef` exposes. If you include `ref` in the spread `...rest`, TypeScript can't reconcile the ref type across all possible `E` values — you get a type error because the ref from the parent doesn't match the ref the inner component expects. `ComponentPropsWithoutRef<E>` strips the ref from the type, avoiding this conflict. If you DO need to forward refs in a polymorphic component, you must use a **separate generic ref type** with `forwardRef` and explicitly type it: `React.forwardRef(<E extends React.ElementType>(props: PolymorphicProps<E>, ref: React.Ref<React.ElementRef<E>>) => ...)`. This is why React 19 deprecated `forwardRef` entirely — refs are now regular props, eliminating this complexity. **Key insight:** The polymorphic `as` pattern is one of the hardest TypeScript patterns because it requires **higher-kinded type inference** — the type of valid props depends on the VALUE of another prop (`as`), which TypeScript handles via conditional types.
</details>

---

## 🎓 MIT/KTH SYSTEMS DEEP DIVE: TypeScript Runtime Erasure & Network Boundaries

Junior developers treat TypeScript as a validation layer that protects their application in production. Systems engineers know that **TypeScript does not exist at runtime**. This singular fact causes the majority of critical bugs at the network boundary.

### Trap 1: The Network Boundary Lie (Type Assertions)

When fetching data from an API, putting `as User` or `<User>` on the response is a lie you tell the compiler. If the backend changes the JSON schema, TypeScript will not save you, and your React app will crash with `TypeError: Cannot read properties of undefined`.

**The Broken Junior Code:**
```tsx
// BUG: We told TS this is `User[]`, but what if the API changed?
// What if `user.address` is now null instead of an object?
const res = await fetch('/api/users');
const data = await res.json() as User[]; 

// CRASH: data.map runs, user.address.city throws in production.
return data.map(user => <div>{user.address.city}</div>); 
```

**The Systems Fix: Zod/Zodios Runtime Validation**
You must parse data at the boundary. If it fails validation, it should reject the promise, not crash the UI components.
```tsx
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.object({ city: z.string() })
});

// Infer the TS type directly from the runtime schema! 
// ZERO duplication of types.
type User = z.infer<typeof UserSchema>;

const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch('/api/users');
  const json = await res.json();
  
  // PARSE IT: If the API is broken, this throws a safe ZodError immediately,
  // which can be caught by an ErrorBoundary, protecting the React tree.
  const data = z.array(UserSchema).parse(json); 
  return data;
};
```

### Trap 2: The `any` Virus vs `unknown`

Using `any` turns off the TypeScript compiler for that variable and everything it touches. It is contagious and disables all auto-completions, type checking, and renaming refactors.

**The Systems Rule:** Never use `any`. Use `unknown` for data whose shape you don't know yet (like `try/catch` errors or raw API payloads). `unknown` *forces* you to do a runtime check before you can use it, combining type safety with runtime safety.

**The Fix in Catch Blocks:**
```tsx
// ❌ Dangerous (React 18 throws `unknown` by default for errors)
try { doSomething(); } catch (error: any) { alert(error.message); }

// ✅ Safe (Systems level)
try { 
  doSomething(); 
} catch (error: unknown) { 
  if (error instanceof Error) {
    alert(error.message); // TS now knows it's a real Error object
  }
}
```
