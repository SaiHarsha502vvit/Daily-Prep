# 📝 TypeScript — Problem Sets

## `17_TypeScript` Module | Type System · Generics · Mapped Types · Conditional Types

> **How to use:** Write the type BEFORE checking answers. Part B code goes in `JavaSolutions/ps/ts/`. All code must pass TypeScript strict mode with zero errors.

---

## Problem Set TS-PS1 — Type System Fundamentals

**Prerequisites:** `17_TypeScript/01_TS_Core.md`, `17_TypeScript/02_TS_Advanced.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between `interface` and `type`? When is each preferred?

<details><summary>Answer</summary>

|                | `interface`              | `type`                          |
| -------------- | ------------------------ | ------------------------------- |
| Merging        | ✅ Declaration merging   | ❌ Cannot re-declare            |
| Extension      | `extends`                | `&` intersection                |
| Primitives     | ❌ Only object shapes    | ✅ `type ID = string \| number` |
| Computed       | ❌ No mapped/conditional | ✅ Full type algebra            |
| Error messages | Slightly friendlier      | Can be complex                  |

**When to use:**

- `interface`: Public API shapes, class contracts — benefits from declaration merging in library code
- `type`: Unions, intersections, utility types, computed types — anything `interface` can't express

🔴 **Erklärung:** In practice, either works for object types. Choose `interface` when you expect consumers to extend/augment it. Choose `type` for everything else. Never mix needlessly — be consistent within a codebase.

</details>

---

**A2 (Medium).** Explain the difference between `unknown` and `any`. Why is `unknown` safer?

<details><summary>Answer</summary>

```typescript
// any — disables type checking entirely
let x: any = "hello";
x.toUpperCase(); // ✅ TypeScript doesn't check
x.nonExistentMethod(); // ✅ No error — dangerous!

// unknown — forces type narrowing before use
let y: unknown = "hello";
y.toUpperCase(); // ❌ Error: Object is of type 'unknown'

if (typeof y === "string") {
  y.toUpperCase(); // ✅ TypeScript knows it's a string here
}
```

**Rule:** Never use `any` except when migrating JavaScript. Use `unknown` for values whose type isn't known yet (e.g., API responses, `JSON.parse`) — forces you to narrow before using.

🔴 **Erklärung:** `any` is an escape hatch that turns off the compiler. `unknown` keeps type safety — it's the type-safe equivalent. Always prefer `unknown` for external data.

</details>

---

**A3 (Hard).** What is the `infer` keyword? Implement `UnpackPromise<T>` that extracts the resolved type of a Promise.

<details><summary>Answer</summary>

```typescript
// infer: declares a type variable inside a conditional type
// TypeScript will "infer" (figure out) what goes there

type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

// Usage:
type A = UnpackPromise<Promise<string>>; // string
type B = UnpackPromise<Promise<number[]>>; // number[]
type C = UnpackPromise<string>; // string (not a Promise, returns T itself)

// More complex: deeply unpack nested Promises
type DeepUnpack<T> = T extends Promise<infer U> ? DeepUnpack<U> : T;
type D = DeepUnpack<Promise<Promise<boolean>>>; // boolean
```

🔴 **Erklärung:** `infer` only works inside `extends` clauses of conditional types. Think of it as a "capture" — when the condition matches, `infer U` captures whatever type was in that position.

</details>

---

### Part B: Implementation

**B1.** Implement a type-safe `Result<T, E>` type (Rust-inspired):

```typescript
// ts/result.ts
type Result<T, E extends Error = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper constructors
const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E extends Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

// Helper to unwrap or throw
function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

// TODO: Implement Result.map — transforms T if ok, passes error through
function mapResult<T, U, E extends Error>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  // TODO
  return result.ok ? Ok(fn(result.value)) : result;
}

// Usage (must compile with strict mode):
function parseAge(input: string): Result<number, TypeError> {
  const n = parseInt(input);
  if (isNaN(n)) return Err(new TypeError(`Invalid age: ${input}`));
  if (n < 0 || n > 150) return Err(new TypeError(`Age out of range: ${n}`));
  return Ok(n);
}

const r = parseAge("25");
if (r.ok) {
  console.log(r.value + 1); // TypeScript knows value: number here
} else {
  console.error(r.error.message); // TypeScript knows error: TypeError here
}
```

---

## Problem Set TS-PS2 — Advanced Types

---

### Part A: Theoretical

**A1 (Medium).** Implement these four utility types FROM SCRATCH (without using the built-in versions):

```typescript
// 1. MyPartial<T> — makes all properties optional
type MyPartial<T> = { [K in keyof T]?: T[K] };

// 2. MyReadonly<T> — makes all properties readonly
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// 3. MyPick<T, K extends keyof T> — picks a subset of keys
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };

// 4. MyRecord<K extends string, V> — maps keys to values
type MyRecord<K extends string, V> = { [P in K]: V };

// Test (must compile):
interface User {
  id: number;
  name: string;
  email: string;
}
type PartialUser = MyPartial<User>; // { id?: number; name?: string; email?: string }
type NameOnly = MyPick<User, "name">; // { name: string }
type Config = MyRecord<"host" | "port", string>; // { host: string; port: string }
```

<details><summary>Explanation of `[K in keyof T]` syntax</summary>

- `keyof T` — union of all keys of T: `"id" | "name" | "email"`
- `K in keyof T` — iterates over each key K in that union
- `T[K]` — the type of property K in T (index access type)
- `?:` — makes the property optional
- `readonly` — makes the property readonly

This is the foundation of ALL TypeScript's built-in utility types. Once you understand mapped types, you can build anything.

</details>

---

**A2 (Hard).** Implement `DeepReadonly<T>` that makes all nested properties readonly:

```typescript
type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// Test:
interface Config {
  server: { host: string; port: number };
  db: { url: string; credentials: { user: string; pass: string } };
}

type FrozenConfig = DeepReadonly<Config>;
// All nested properties are readonly — cannot mutate at any depth
```

---

**A3 (Hard).** Implement a type-safe EventBus with per-event type checking:

```typescript
// The event map defines what payload each event carries
interface AppEvents {
  "user:login": { userId: string; timestamp: number };
  "user:logout": { userId: string };
  "order:created": { orderId: string; amount: number };
  error: { message: string; code: number };
}

class TypedEventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<
    keyof Events,
    Array<(payload: unknown) => void>
  >();

  on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, listener as (p: unknown) => void]);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const handlers = this.listeners.get(event) ?? [];
    handlers.forEach((h) => h(payload));
  }
}

// Usage — TypeScript enforces correct payload types:
const bus = new TypedEventBus<AppEvents>();

bus.on("user:login", ({ userId, timestamp }) => {
  // userId: string, timestamp: number — fully typed!
  console.log(`User ${userId} logged in at ${new Date(timestamp)}`);
});

bus.emit("user:login", { userId: "u1", timestamp: Date.now() }); // ✅
bus.emit("user:login", { userId: 123 }); // ❌ Error: number not assignable to string
```

---

### Part B: Implementation

**B2.** Build a type-safe `useLocalStorage<T>` hook in TypeScript:

```typescript
// ts/useLocalStorage.ts
import { useState } from "react";

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(stored) : value;
      setStored(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("useLocalStorage error:", error);
    }
  };

  return [stored, setValue];
}

// Usage (fully type-safe):
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "dark");
const [count, setCount] = useLocalStorage<number>("count", 0);
setCount((prev) => prev + 1); // prev: number, return value must be number
```

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)
