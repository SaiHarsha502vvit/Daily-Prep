> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← State Management](04_State_Management.md) | [Next: Routing →](06_React_Router.md)

---

# 🔷 React + TypeScript — Type-Safe Components

---

## Part 1: Why TypeScript with React?


> ✅ Catch bugs at COMPILE time, not runtime
> ✅ Autocompletion in IDE (know exact props, return types)
> ✅ Self-documenting: types ARE documentation
> ✅ Refactoring confidence: rename a prop, find all usages instantly
> ✅ Industry standard for production React apps


---

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

**Flow:**
- What Type
- ↓
- Component children React.ReactNode
- ↓
- Single element child React.ReactElement
- ↓
- Style object React.CSSProperties
- ↓
- Ref to DOM element React.RefObject<HTMLDivElement&gt
- ↓
- Set state function React.Dispatch<SetStateAction<
- ↓
- onChange for input React.ChangeEvent<HTMLInputElemen

```mermaid
flowchart TD
    N1["What Type"]
    N2["Component children React.ReactNode"]
    N3["Single element child React.ReactElement"]
    N4["Style object React.CSSProperties"]
    N5["Ref to DOM element React.RefObject&lt;HTMLDivElement&gt"]
    N6["Set state function React.Dispatch&lt;SetStateAction&lt;"]
    N7["onChange for input React.ChangeEvent&lt;HTMLInputElemen"]
    N8["onClick for button React.MouseEvent&lt;HTMLButtonElemen"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

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

> **Navigation**: [< Previous](04_State_Management.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_React_Router.md)