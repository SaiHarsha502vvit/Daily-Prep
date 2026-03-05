> **Navigation**: [< Previous](02_TS_Advanced_Types.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_TS_Deep_Reasoning.md)

> **TypeScript Chapter 3/3** | [← Advanced Types](02_TS_Advanced_Types.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → CSS Foundations](../18_CSS_Complete/01_CSS_Foundations.md)

# TypeScript Patterns & Best Practices — Production-Grade TS

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: Real-world TypeScript patterns, best practices, and           ║
║        production techniques used in professional codebases.         ║
║                                                                      ║
║  WHY:  Knowing types isn't enough — you need to know HOW to          ║
║        organize, structure, and apply them in real projects.         ║
║        Bad TS is worse than no TS (false confidence).                ║
║                                                                      ║
║  WHO:  Developers writing production TypeScript — React apps,        ║
║        Node APIs, libraries, internal tools.                         ║
║                                                                      ║
║  WHEN: After understanding generics and utility types.               ║
║                                                                      ║
║  HOW:  Design patterns + anti-patterns + real codebase examples.     ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. The "Think in Types First" Approach

```
╔══════════════════════════════════════════════════════════════════════╗
║  BEFORE writing logic, define your data shapes.                      ║
║                                                                      ║
║  Step 1: What data exist?  → Define interfaces/types                 ║
║  Step 2: What operations?  → Define function signatures              ║
║  Step 3: What can go wrong? → Union types for error states           ║
║  Step 4: Implement logic                                             ║
║                                                                      ║
║  This is TYPE-DRIVEN DEVELOPMENT.                                    ║
║  The types become your specification — code fills in the blanks.     ║
╚══════════════════════════════════════════════════════════════════════╝
```

```typescript
// EXAMPLE: E-commerce Cart — Types First

// Step 1: Data shapes
interface Product {
    id: string;
    name: string;
    price: number;          // in cents
    stock: number;
    category: "electronics" | "clothing" | "food";
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface Cart {
    items: CartItem[];
    couponCode: string | null;
    discountPercent: number;
}

// Step 2: Operations
type CartAction =
    | { type: "ADD_ITEM"; product: Product; quantity: number }
    | { type: "REMOVE_ITEM"; productId: string }
    | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
    | { type: "APPLY_COUPON"; code: string }
    | { type: "CLEAR" };

// Step 3: Error states
type CartError =
    | { kind: "OUT_OF_STOCK"; product: string; available: number }
    | { kind: "INVALID_COUPON"; code: string }
    | { kind: "ITEM_NOT_FOUND"; productId: string }
    | { kind: "NEGATIVE_QUANTITY" };

type CartResult<T> = { ok: true; value: T } | { ok: false; error: CartError };

// Step 4: Implementation follows naturally
function cartReducer(state: Cart, action: CartAction): CartResult<Cart> {
    switch (action.type) {
        case "ADD_ITEM": {
            if (action.quantity <= 0) {
                return { ok: false, error: { kind: "NEGATIVE_QUANTITY" } };
            }
            if (action.product.stock < action.quantity) {
                return {
                    ok: false,
                    error: {
                        kind: "OUT_OF_STOCK",
                        product: action.product.name,
                        available: action.product.stock
                    }
                };
            }
            const existing = state.items.find(i => i.product.id === action.product.id);
            if (existing) {
                return {
                    ok: true,
                    value: {
                        ...state,
                        items: state.items.map(i =>
                            i.product.id === action.product.id
                                ? { ...i, quantity: i.quantity + action.quantity }
                                : i
                        )
                    }
                };
            }
            return {
                ok: true,
                value: {
                    ...state,
                    items: [...state.items, { product: action.product, quantity: action.quantity }]
                }
            };
        }
        // ... other cases follow same structure
        default:
            return { ok: true, value: state };
    }
}
```

---

## 2. React + TypeScript Patterns

### Component Props

```typescript
// BASIC PROPS:
interface ButtonProps {
    label: string;
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({
    label,
    variant = "primary",
    size = "md",
    disabled = false,
    onClick
}) => (
    <button
        className={`btn btn-${variant} btn-${size}`}
        disabled={disabled}
        onClick={onClick}
    >
        {label}
    </button>
);

// CHILDREN PATTERN:
interface CardProps {
    title: string;
    children: React.ReactNode;  // Any valid JSX
}

// POLYMORPHIC "as" PROP:
type PolymorphicProps<E extends React.ElementType> = {
    as?: E;
    children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "children">;

function Box<E extends React.ElementType = "div">({
    as,
    children,
    ...props
}: PolymorphicProps<E>) {
    const Component = as || "div";
    return <Component {...props}>{children}</Component>;
}

// Usage:
<Box>Regular div</Box>
<Box as="section" id="main">Section element</Box>
<Box as="a" href="/about">Link element</Box>
// TS knows the valid props based on `as`!
```

### Hooks

```typescript
// useState with explicit type:
const [user, setUser] = useState<User | null>(null);
// TS knows: user is User | null

// useReducer (type-safe):
function useCart() {
    const [cart, dispatch] = useReducer(cartReducer, {
        items: [],
        couponCode: null,
        discountPercent: 0
    });
    return { cart, dispatch };
}

// Custom Hook with generic:
function useLocalStorage<T>(key: string, initialValue: T) {
    const [stored, setStored] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value: T | ((prev: T) => T)) => {
        const valueToStore = value instanceof Function ? value(stored) : value;
        setStored(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
    };

    return [stored, setValue] as const;
    // REASONING: `as const` makes return type [T, (v: T | ((p: T) => T)) => void]
    // Without it, TS infers (T | ((v: ...) => void))[] — wrong!
}

// Usage:
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
// theme: "light" | "dark" — perfectly typed!

// useRef patterns:
const inputRef = useRef<HTMLInputElement>(null); // For DOM elements
const countRef = useRef<number>(0);              // For mutable values
```

### Event Handlers

```typescript
// React SyntheticEvent types:
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value); // TS knows: string
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitForm();
};

// Common Event Types Reference:
// ┌───────────────────────┬───────────────────────────────┐
// │ Event                 │ Type                          │
// ├───────────────────────┼───────────────────────────────┤
// │ onClick               │ React.MouseEvent<HTMLElement>  │
// │ onChange              │ React.ChangeEvent<HTMLElement> │
// │ onSubmit              │ React.FormEvent<HTMLElement>   │
// │ onKeyDown/Up          │ React.KeyboardEvent<>         │
// │ onFocus/Blur          │ React.FocusEvent<>            │
// │ onDrag*               │ React.DragEvent<>             │
// │ onScroll              │ React.UIEvent<>               │
// └───────────────────────┴───────────────────────────────┘
```

---

## 3. API Types Pattern — Single Source of Truth

```typescript
// DEFINE API TYPES, DERIVE EVERYTHING ELSE:

// 1. Backend returns this (shared type or generated from OpenAPI):
interface UserAPI {
    id: number;
    first_name: string;        // snake_case from backend
    last_name: string;
    email: string;
    created_at: string;        // ISO date string
    role: "admin" | "moderator" | "user";
    avatar_url: string | null;
}

// 2. Frontend model (camelCase, parsed dates):
interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
    role: "admin" | "moderator" | "user";
    avatarUrl: string | null;
}

// 3. Transform function:
function toUser(api: UserAPI): User {
    return {
        id: api.id,
        firstName: api.first_name,
        lastName: api.last_name,
        email: api.email,
        createdAt: new Date(api.created_at),
        role: api.role,
        avatarUrl: api.avatar_url
    };
}

// 4. Derived types:
type CreateUserInput = Omit<User, "id" | "createdAt">;
type UpdateUserInput = Partial<Pick<User, "firstName" | "lastName" | "email" | "avatarUrl">>;
type UserSummary = Pick<User, "id" | "firstName" | "lastName" | "avatarUrl">;

// 5. API client (typed):
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getUsers(): Promise<User[]> {
        const res = await fetch(`${this.baseUrl}/users`);
        const data: UserAPI[] = await res.json();
        return data.map(toUser);
    }

    async getUser(id: number): Promise<User> {
        const res = await fetch(`${this.baseUrl}/users/${id}`);
        const data: UserAPI = await res.json();
        return toUser(data);
    }

    async updateUser(id: number, updates: UpdateUserInput): Promise<User> {
        const res = await fetch(`${this.baseUrl}/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        const data: UserAPI = await res.json();
        return toUser(data);
    }
}
```

---

## 4. Anti-Patterns — What NOT to Do

```typescript
// ❌ ANTI-PATTERN 1: Using `any` everywhere
function process(data: any): any { return data.foo.bar; }
// WHY BAD: Defeats the purpose of TS. No type safety at all.
// ✅ FIX: Use `unknown` + narrowing, or define proper types.

// ❌ ANTI-PATTERN 2: Excessive type assertions
const user = response as unknown as User;  // Double assertion = red flag
// WHY BAD: You're lying to the compiler. If data doesn't match, runtime crash.
// ✅ FIX: Validate with type guard or Zod schema.

// ❌ ANTI-PATTERN 3: String enums for everything
enum Color { Red = "RED", Blue = "BLUE", Green = "GREEN" }
// WHY BAD: Enums create runtime code, don't tree-shake, complex.
// ✅ FIX: Use union literals:
type Color = "RED" | "BLUE" | "GREEN";

// ❌ ANTI-PATTERN 4: Interface for everything (even non-objects)
interface UserId { value: string }
// WHY BAD: Unnecessary wrapper. Use type alias.
// ✅ FIX: type UserId = string; (or branded types if you need distinction)

// ❌ ANTI-PATTERN 5: Huge monolithic types
interface GodObject {
    user: User;
    products: Product[];
    cart: Cart;
    orders: Order[];
    settings: Settings;
    // ... 50 more fields
}
// WHY BAD: Everything depends on everything. Impossible to test.
// ✅ FIX: Separate types, pass only what's needed.

// ❌ ANTI-PATTERN 6: @ts-ignore instead of fixing
// @ts-ignore
user.nonexistentField;
// WHY BAD: Hides real errors. Technical debt.
// ✅ FIX: Fix the type or use @ts-expect-error (fails if error is fixed).

// ❌ ANTI-PATTERN 7: Not using strict mode
// { "strict": false } in tsconfig
// WHY BAD: TS without strict is barely better than JS.
// ✅ FIX: Always strict: true from day 1.
```

---

## 5. Branded Types — Preventing Mix-Ups

```typescript
// PROBLEM: UserId and ProductId are both strings, easily confused:
function getUser(id: string): User { /* ... */ }
function getProduct(id: string): Product { /* ... */ }

const userId = "user_123";
const productId = "prod_456";
getUser(productId); // No error! But it's WRONG.

// SOLUTION: Branded types
type UserId = string & { readonly __brand: "UserId" };
type ProductId = string & { readonly __brand: "ProductId" };

// Factory functions:
function createUserId(id: string): UserId {
    return id as UserId;
}
function createProductId(id: string): ProductId {
    return id as ProductId;
}

function getUser(id: UserId): User { /* ... */ }
function getProduct(id: ProductId): Product { /* ... */ }

const userId = createUserId("user_123");
const productId = createProductId("prod_456");
getUser(userId);       // ✅
// getUser(productId);  // ❌ Type 'ProductId' not assignable to 'UserId'

// GENERIC BRAND HELPER:
type Brand<T, B extends string> = T & { readonly __brand: B };
type Email = Brand<string, "Email">;
type Currency = Brand<number, "Currency">; // Amount in cents
type Timestamp = Brand<number, "Timestamp">;
```

---

## 6. Declaration Files & Third-Party Types

```typescript
// .d.ts files contain ONLY type information (no runtime code).

// SCENARIO 1: Using a JS library without types
// Install @types package:
// npm install -D @types/lodash @types/express

// SCENARIO 2: Augmenting globals
// global.d.ts
declare global {
    interface Window {
        __APP_CONFIG__: {
            apiUrl: string;
            version: string;
        };
    }
}
export {}; // Makes this a module (required)

// SCENARIO 3: Declaring a module without types
// types/untyped-lib.d.ts
declare module "untyped-library" {
    export function process(data: unknown): string;
    export default function init(config: { debug: boolean }): void;
}

// SCENARIO 4: Environment variables
// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";
        DATABASE_URL: string;
        API_KEY: string;
        PORT?: string;
    }
}

// Now process.env.NODE_ENV is typed!
// process.env.DATABASE_URL — string (not string | undefined)
```

---

## 7. Migration Strategy — JS to TS

```
MIGRATING JS → TS (Step by Step):

Phase 1: SETUP
┌─────────────────────────────────────────────────────────────┐
│ 1. npm install -D typescript                                │
│ 2. npx tsc --init                                           │
│ 3. Set allowJs: true, strict: false initially               │
│ 4. Rename .js → .ts one file at a time                      │
└─────────────────────────────────────────────────────────────┘

Phase 2: GRADUAL TYPING
┌─────────────────────────────────────────────────────────────┐
│ 1. Start with leaf files (utils, helpers — no dependencies) │
│ 2. Add types to function signatures                         │
│ 3. Replace `any` with proper types one by one               │
│ 4. Move toward core files (API, state, components)          │
└─────────────────────────────────────────────────────────────┘

Phase 3: STRICT MODE
┌─────────────────────────────────────────────────────────────┐
│ 1. Enable strict flags ONE AT A TIME:                       │
│    noImplicitAny → strictNullChecks → strictFunctionTypes   │
│ 2. Fix errors from each flag before enabling next           │
│ 3. Eventually set strict: true                              │
└─────────────────────────────────────────────────────────────┘

RULE: Never stop at Phase 1. Phase 1 TS is worse than JS
because it gives FALSE confidence. Reach Phase 3.
```

---

## 8. Performance Tips

```typescript
// 1. Use `interface` over `type` for objects (faster for TS compiler):
interface User { name: string } // ✅ Cached by name
type User = { name: string }    // ❌ Evaluated every time

// 2. Avoid deep recursion in types:
type DeepPartial<T> = /* ... */ // TS has max recursion depth (~50)

// 3. Use `const enum` for zero-runtime enums:
const enum Direction { Up, Down } // Inlined as 0, 1

// 4. Project references for monorepos:
// tsconfig.build.json
{
    "references": [
        { "path": "./packages/shared" },
        { "path": "./packages/api" },
        { "path": "./packages/web" }
    ]
}

// 5. skipLibCheck for faster builds:
{ "compilerOptions": { "skipLibCheck": true } }
// Skips checking node_modules .d.ts files
```

---

## 9. Essential TypeScript Configuration by Project Type

```
PROJECT TYPE → KEY TSCONFIG OPTIONS:

React + Vite:
├── target: "ES2020"
├── jsx: "react-jsx"
├── module: "ESNext"
├── moduleResolution: "bundler"
└── strict: true

Node.js API:
├── target: "ES2022"
├── module: "NodeNext"
├── moduleResolution: "NodeNext"
├── outDir: "./dist"
└── strict: true

Library/Package:
├── target: "ES2020"
├── declaration: true       ← Generate .d.ts
├── declarationMap: true    ← Source maps for types
├── composite: true         ← For project references
└── strict: true
```

---

## Interview Quick-Fire

```
Q: How would you type a React component that accepts different props
   based on a variant?
→ Discriminated union of prop types:
  type Props = { variant: "link"; href: string } | { variant: "button"; onClick: () => void }
  Then narrow on props.variant.

Q: How do you handle API response types?
→ Define API types (what server returns), frontend model types,
  and transform functions. Use Zod or type guards for runtime validation.

Q: What's the difference between `type` and `interface` performance?
→ Interfaces are cached by name (faster). Types are re-evaluated.
  For objects, prefer interface. For unions/mapped types, must use type.

Q: How would you migrate a large JS project to TS?
→ Phase 1: Install TS, allowJs, rename files gradually.
  Phase 2: Add types starting from leaf files.
  Phase 3: Enable strict flags one at a time until strict: true.

Q: What are branded types?
→ Types using intersection with a phantom brand to prevent mixing
  compatible primitives: type UserId = string & { __brand: "UserId" }

Q: How do you type a function that accepts any object with a specific key?
→ Generic with constraint: function get<T extends { id: number }>(obj: T): number
  Or: function get<T, K extends keyof T>(obj: T, key: K): T[K]
```

---

> [← Advanced Types](02_TS_Advanced_Types.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → CSS Foundations](../18_CSS_Complete/01_CSS_Foundations.md)


---

> **Navigation**: [< Previous](02_TS_Advanced_Types.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_TS_Deep_Reasoning.md)