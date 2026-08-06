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

// Constraint is Record<string, any>, not Record<string, unknown> --
// deliberately. AppEvents is a CLOSED interface (four specific named
// keys, no index signature), and a closed interface does NOT structurally
// satisfy Record<string, unknown> (TypeScript requires an actual index
// signature for that check). Record<string, any> is looser specifically
// where it needs to be: it accepts "any object whose keys map to
// something," including a plain closed interface like AppEvents, without
// weakening anything else -- Events[K] below still resolves to each
// event's REAL, specific payload type at every call site.
class TypedEventBus<Events extends Record<string, any>> {
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

## Problem Set TS-PS3 — Utility Types From Scratch, Part 2

**Prerequisites:** `17_TypeScript/02_TS_Advanced_Types.md` §2 (utility types), Problem Set TS-PS2 above

---

### Part A: Theoretical

**A1 (Medium).** Does `Omit<User, "id" | "bogus">` (where `User` has no `bogus` property) compile, or does TypeScript reject the unknown key?

<details><summary>Answer</summary>

**It compiles fine — no error.** `Omit<T, K>` is defined as `Pick<T, Exclude<keyof T, K>>`, and its `K` parameter is constrained to `keyof any` (any valid property-key type), not `keyof T`. `Exclude<keyof T, K>` silently no-ops for any key in `K` that was never actually in `keyof T` — there's simply nothing to remove.

🔴 **Erklärung:** this is precisely why Chapter 2's `StrictOmit<T, K extends keyof T>` exists as a stricter alternative — plain `Omit` will never catch a typo'd key for you, because "removing a key that was never there" and "removing nothing" produce the identical result type.

</details>

---

**A2 (Medium).** What does `Exclude<"a" | "b" | 1 | 2, string>` evaluate to?

<details><summary>Answer</summary>

**`1 | 2`.** `Exclude<T, U>` is the distributive conditional `T extends U ? never : T` — it checks each union member of `T` separately against `U`. `"a"` and `"b"` are assignable to `string`, so both become `never` and vanish from the union; `1` and `2` are not assignable to `string`, so they survive unchanged.

🔴 **Erklärung:** `never` is the identity element for union types — `X | never` is always just `X` — which is the entire mechanism behind how `Exclude` "removes" members: it doesn't delete anything, it maps unwanted members to `never` and lets union simplification do the removing.

</details>

---

### Part B: Implementation

**B3.** Implement `MyOmit<T, K>` from scratch, composed from `MyPick` and `Exclude` (not the built-in `Omit`):

```typescript
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyExclude<T, U> = T extends U ? never : T;
type MyOmit<T, K extends keyof T> = MyPick<T, MyExclude<keyof T, K>>;

// Test:
interface User {
  id: number;
  name: string;
  email: string;
}
type UserWithoutId = MyOmit<User, "id">;
const u: UserWithoutId = { name: "Harsha", email: "h@test.com" };
```

🔴 **Erklärung:** `Omit` was never a primitive of the type system — it's a two-line composition of two OTHER primitives (a mapped type and a distributive conditional) that ship in `lib.es5.d.ts`. Writing it out yourself is the fastest way to stop treating any built-in utility type as magic: `MyExclude<keyof T, K>` computes "every key of T except the ones in K," and `MyPick` then builds an object type from exactly that surviving key set.

**B4.** Implement `MyRequired<T>` from scratch — the opposite of `Partial`, making every optional property mandatory:

```typescript
type MyRequired<T> = { [K in keyof T]-?: T[K] };

// Test:
interface Config {
  host?: string;
  port?: number;
}
type FullConfig = MyRequired<Config>;
const cfg: FullConfig = { host: "localhost", port: 3000 };
// const bad: FullConfig = { host: "localhost" }; // ❌ port is now mandatory
```

🔴 **Erklärung:** `?` on a mapped type's key is a MODIFIER, and modifiers support an explicit `+`/`-` prefix most people never learn exists — `[K in keyof T]?:` ADDS optionality (this is how `Partial` is built), `[K in keyof T]-?:` REMOVES it. `Required<T>` isn't a separate mechanism from `Partial<T>`; it's the identical mapped-type loop with the sign flipped.

**B5.** Implement `MyReturnType<T>` and `MyParameters<T>` from scratch, using `infer`:

```typescript
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// Test:
function greet(name: string, age: number): string {
  return `${name}, ${age}`;
}
type GreetReturn = MyReturnType<typeof greet>; // string
type GreetParams = MyParameters<typeof greet>; // [name: string, age: number]

const r: GreetReturn = "hi";
const p: GreetParams = ["Harsha", 24];
```

🔴 **Erklärung:** both are the SAME trick pointed at different parts of a function's call signature — `infer R` captures whatever sits in the return-type position of the pattern being matched, `infer P` captures the entire parameter list as a tuple. Neither one "runs" anything; they're pattern-matches against a function TYPE, evaluated once at compile time.

---

## Problem Set TS-PS4 — Conditional Types & Recursion

**Prerequisites:** `17_TypeScript/02_TS_Advanced_Types.md` §4 (conditional types), Problem Set TS-PS3 above

---

### Part A: Theoretical

**A1 (Hard).** `type ToArray<T> = T extends any ? T[] : never;` applied to `string | number` gives `string[] | number[]`. Is a value of type `(string | number)[]` (a single array mixing both) assignable to `ToArray<string | number>`?

<details><summary>Answer</summary>

**No.** `ToArray<string | number>` is `string[] | number[]` — an array of ONLY strings, OR an array of ONLY numbers, never a single array mixing both. A `(string | number)[]` value (e.g. `["a", 1]`) satisfies neither branch of that union and is rejected.

🔴 **Erklärung:** this is the direct, checkable consequence of distribution: the conditional ran once per union member and produced `string[] | number[]` — a union of two homogeneous array types — which is a fundamentally different (and stricter) type than "one array that can hold either." Confusing the two is the single most common distributive-conditional mistake.

</details>

---

### Part B: Implementation

**B6.** Implement `Flatten<T>` — recursively unwraps nested array types down to the innermost element type:

```typescript
type Flatten<T> = T extends readonly (infer U)[] ? Flatten<U> : T;

// Test:
type A = Flatten<number[][][]>; // number
type B = Flatten<string>; // string — not an array, returned as-is
type C = Flatten<boolean[]>; // boolean

const a: A = 5;
const c: C = true;
```

🔴 **Erklärung:** the recursion is the entire mechanism — each application peels off exactly ONE layer of array-ness (`readonly (infer U)[]` captures the element type of the outermost array), then immediately re-runs `Flatten` on that captured `U`. The base case is implicit: once `T` is no longer array-shaped, the `extends` check fails and the conditional falls through to `: T`, returning whatever's left unchanged.

**B7.** Implement `DeepAwaited<T>` — recursively unwraps nested `Promise`s (TypeScript's built-in `Awaited<T>` does this natively; build the mechanism yourself):

```typescript
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

// Test:
type A = DeepAwaited<Promise<Promise<Promise<boolean>>>>; // boolean
type B = DeepAwaited<string>; // string — not a Promise, returned as-is

const a: A = true;
const b: B = "not a promise";
```

🔴 **Erklärung:** structurally identical to `Flatten` (B6) — swap "array" for "Promise" and the recursion is the same shape. This is worth noticing explicitly: `Flatten` and `DeepAwaited` are the SAME algorithm (peel one layer of a generic wrapper, recurse on what's inside, stop when the wrapper is gone) applied to two different wrapper types — recognizing the shared pattern is what lets you write the next one (`DeepReadonly` from TS-PS2-A2 is a third variant of it) without re-deriving from zero.

**B8.** Implement `TupleToObject<T>` — converts a readonly tuple of string literals into an object type where each literal is both the key AND the value:

```typescript
type TupleToObject<T extends readonly (string | number | symbol)[]> = {
  [K in T[number]]: K;
};

// Test:
const days = ["Mon", "Tue", "Wed"] as const;
type DaysObj = TupleToObject<typeof days>;
// { Mon: "Mon"; Tue: "Tue"; Wed: "Wed" }

const d: DaysObj = { Mon: "Mon", Tue: "Tue", Wed: "Wed" };
```

🔴 **Erklärung:** `T[number]` — Chapter 2's "index a tuple by the type `number`" trick — turns the tuple `readonly ["Mon", "Tue", "Wed"]` into the union `"Mon" | "Tue" | "Wed"`, and THAT union becomes what `[K in ...]` iterates over. Requiring the input as `readonly (...)[]` (not a plain array) is what forces callers to pass an `as const` tuple — without it, `["Mon", "Tue", "Wed"]` would infer as plain `string[]`, and `T[number]` would collapse to the single type `string` instead of three distinct literals.

---

## Problem Set TS-PS5 — Template Literal Type Parsing

**Prerequisites:** `17_TypeScript/02_TS_Advanced_Types.md` §5 (template literal types)

---

### Part A: Theoretical

**A1 (Medium).** `type ClassName = \`btn-${"sm"|"md"|"lg"}-${"primary"|"danger"}\`;` — how many distinct string literal types does this produce, and why?

<details><summary>Answer</summary>

**6** — every combination of the two unions: `btn-sm-primary`, `btn-sm-danger`, `btn-md-primary`, `btn-md-danger`, `btn-lg-primary`, `btn-lg-danger`.

🔴 **Erklärung:** a template literal type with a union in an interpolation position doesn't produce one type with a "hole" in it — TypeScript expands it into the full CROSS PRODUCT of every union combined with every other union in the template, up front, at the type level. Two unions of 3 and 2 members produce 3×2 = 6 literal types; this is also why chaining several large unions in one template literal type can blow up combinatorially and slow the checker down (Chapter 6's "slow types" discussion).

</details>

---

### Part B: Implementation

**B9.** Implement `RouteParams<T>` — parses a route string into an OBJECT type mapping each `:param` name to `string` (not just a union of the names):

```typescript
type ExtractRouteParamNames<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParamNames<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type RouteParams<T extends string> = {
  [K in ExtractRouteParamNames<T>]: string;
};

// Test:
type Params = RouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

const p: Params = { userId: "1", postId: "2" };
```

🔴 **Erklärung:** this composes two mechanisms from earlier problem sets — `ExtractRouteParamNames` is the same recursive template-literal pattern-match Chapter 2 used to pull `"userId" | "postId"` out as a UNION, and wrapping it in `{ [K in ...]: string }` (B8's mapped-type trick) turns that union into a concrete OBJECT shape. Neither half is new; the composition is the exercise.

**B10.** Implement `CamelToSnake<S>` — converts a camelCase string literal type to snake_case at the type level:

```typescript
type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head> // true only for characters with no case (digits, symbols)
      ? `${Head}${CamelToSnake<Tail>}`
      : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `${Head}${CamelToSnake<Tail>}`
  : S;

// Test:
type A = CamelToSnake<"firstName">; // "first_name"
type B = CamelToSnake<"userId">;    // "user_id"

const a: A = "first_name";
```

🔴 **Erklärung:** the recursion walks the string ONE character at a time — `${infer Head}${infer Tail}` splits off just the first character, per iteration — and the double `Uppercase`/`Lowercase` check is doing real work: a character is genuinely uppercase only if it changes under `Lowercase` but NOT under `Uppercase` (digits and symbols are unaffected by both, which is why the inner check exists — without it, a digit would incorrectly get an `_` inserted in front of it).

---

## Problem Set TS-PS6 — Real-World API Typing

**Prerequisites:** Problem Sets TS-PS3 through TS-PS5 above

---

### Part A: Theoretical

**A1 (Design).** A form library derives each field's value TYPE from a `kind: "text" | "number" | "checkbox"` tag on that field's schema. Why does this need a conditional type instead of a simple mapped type?

<details><summary>Answer</summary>

A plain mapped type (`{ [K in keyof Schema]: ??? }`) can rename or wrap each property, but it has no way to say "the VALUE type here depends on what `kind` this specific field declares." That's a per-field, data-dependent branch — exactly what a conditional type (`F extends { kind: "text" } ? string : ...`) is for. The mapped type still does the iteration (B12 below); the conditional type is what runs INSIDE each iteration to pick the right value type per field.

</details>

---

### Part B: Implementation

**B11.** Reusing PS6-A1's insight, implement `FieldValue<F>` and `FormValues<Schema>` — a schema-driven form typing system:

```typescript
type FieldSchema =
  | { kind: "text"; required?: boolean }
  | { kind: "number"; min?: number }
  | { kind: "checkbox" };

type FieldValue<F extends FieldSchema> = F extends { kind: "text" }
  ? string
  : F extends { kind: "number" }
    ? number
    : F extends { kind: "checkbox" }
      ? boolean
      : never;

type FormValues<Schema extends Record<string, FieldSchema>> = {
  [K in keyof Schema]: FieldValue<Schema[K]>;
};

// Test:
const signupSchema = {
  username: { kind: "text", required: true },
  age: { kind: "number", min: 0 },
  subscribed: { kind: "checkbox" },
} as const satisfies Record<string, FieldSchema>;

type SignupValues = FormValues<typeof signupSchema>;
// { username: string; age: number; subscribed: boolean }

const values: SignupValues = { username: "harsha", age: 24, subscribed: true };
```

🔴 **Erklärung:** `FormValues` is the mapped-type loop (B8/B9's pattern) and `FieldValue` is the per-field conditional branch (PS6-A1) — the exact division of labor A1 predicted. `satisfies` (Chapter 1) is what makes this ergonomic at the call site: `signupSchema` gets validated against `Record<string, FieldSchema>` without losing the specific literal `kind` values `as const` preserved, which is what lets `FieldValue` actually distinguish `"text"` from `"number"` per field instead of seeing a widened `string`.

**B12.** Implement `QueryShape<Keys>` and a `parseQuery` function — every value from `URLSearchParams` is `string | undefined`, never anything else, and the type should say so:

```typescript
type QueryShape<Keys extends readonly string[]> = {
  [K in Keys[number]]: string | undefined;
};

function parseQuery<Keys extends readonly string[]>(
  search: string,
  keys: Keys,
): QueryShape<Keys> {
  const params = new URLSearchParams(search);
  const result = {} as QueryShape<Keys>;
  for (const key of keys) {
    (result as Record<string, string | undefined>)[key] = params.get(key) ?? undefined;
  }
  return result;
}

// Test:
const query = parseQuery("?page=2&sort=desc", ["page", "sort"] as const);
console.log(query.page, query.sort); // both: string | undefined
// query.filter; // ❌ "filter" was never declared in the keys list
```

🔴 **Erklärung:** the honest part of this type is that it does NOT claim `string` — it claims `string | undefined`, matching exactly what `URLSearchParams.get()` can actually return (`null` on a real miss, mapped to `undefined` here to stay consistent with the rest of the type system). A tempting-but-wrong version would type every key as plain `string`, which compiles fine and then produces a real runtime `undefined` the type system swore couldn't happen — the same "confidence theater" gap Chapter 4's Reality Check warns about, recreated by hand instead of skipped with a validator.

---

## Problem Set TS-PS7 — Branded Types, Exhaustiveness & State Machines

**Prerequisites:** `17_TypeScript/02_TS_Advanced_Types.md`, `17_TypeScript/03_TS_Patterns_BestPractices.md` §5 (branded types)

---

### Part A: Theoretical

**A1 (Medium).** `type UserId = string & { readonly __brand: "UserId" };` — why does `getUser(orderId)` (where `orderId: OrderId`, a DIFFERENT brand) fail to compile, given both are ultimately just strings at runtime?

<details><summary>Answer</summary>

Structural typing (Chapter 4) checks whether the SOURCE type has every member the TARGET type requires. `UserId` requires a `__brand: "UserId"` property; `OrderId`'s brand is `__brand: "OrderId"` — a different literal type, so `OrderId` does NOT structurally satisfy `UserId`'s requirements, and the assignment is rejected. This is exactly the mechanism Chapter 4 introduced branding to exploit: at runtime, `__brand` doesn't exist on the actual string value (it's a "phantom" property, checked only at compile time), but the TYPE CHECKER treats it as real, which is enough to make two otherwise-identical `string` types mutually incompatible on purpose.

</details>

---

### Part B: Implementation

**B13.** Implement a branded `UserId` factory and a repository that only accepts properly-branded IDs — a raw string, even one that "looks right," must be rejected:

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };
type UserId = Brand<string, "UserId">;

function createUserId(raw: string): UserId {
  return raw as UserId;
}

const repo = {
  users: new Map<UserId, { name: string }>(),
  getUser(id: UserId) {
    return this.users.get(id);
  },
};

// Test:
const uid = createUserId("u_123");
repo.users.set(uid, { name: "Harsha" });
console.log(repo.getUser(uid)); // { name: "Harsha" }
// repo.getUser("u_123"); // ❌ a raw string literal is not a UserId
```

🔴 **Erklärung:** `createUserId` is the ONLY sanctioned way to produce a `UserId` — the cast (`raw as UserId`) lives in exactly one place, which means every `UserId` in the codebase provably passed through whatever validation you choose to add inside that one function later. This is the same "single funnel" idea as the anti-corruption-layer mapper pattern (Chapter 3): brands don't add runtime validation by themselves, they force ALL construction through one auditable chokepoint.

**B14.** Implement `assertNever` and use it to make a `switch` over a discriminated union exhaustive — adding a new union member without handling it should be a COMPILE error, not a runtime surprise:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      return assertNever(shape);
  }
}

// Test:
console.log(area({ kind: "circle", radius: 2 }));
// Now add `{ kind: "triangle"; base: number; height: number }` to Shape
// without adding a case for it above -- assertNever(shape)'s parameter
// stops being `never` (a real, un-narrowed Shape reaches it) and TypeScript
// rejects the whole function at compile time, not at 2am in production.
```

🔴 **Erklärung:** `never`'s "nothing is assignable to it" property (Chapter 1) is what makes this work — by the time control reaches `default`, `shape`'s type has been narrowed by every preceding `case` to whatever's LEFT unhandled. If every real variant was handled, what's left is the empty set, `never`, and `assertNever(shape)` compiles. Add a variant and forget its `case`, and `shape` in the `default` branch is now that real, un-narrowed variant — which `assertNever`'s `never`-typed parameter refuses to accept, turning a forgotten case into a compile error at the exact call site instead of a silent runtime gap.

**B15.** Implement a typed traffic-light state machine where `transition()` only accepts the ONE valid next state for the current state — enforced by the type system, not by a runtime `if`:

```typescript
type Light = "red" | "yellow" | "green";

type Transitions = {
  red: "green";
  green: "yellow";
  yellow: "red";
};

function transition<L extends Light>(current: L, next: Transitions[L]): Transitions[L] {
  return next;
}

// Test:
const afterRed = transition("red", "green"); // ✅ red -> green is the only legal move
// transition("red", "yellow"); // ❌ red can only transition to green
```

🔴 **Erklärung:** `Transitions[L]` is doing the actual enforcement — indexing the `Transitions` map by whatever specific light `L` is bound to at each call site produces a DIFFERENT expected type per call (`Transitions["red"]` is `"green"`, `Transitions["green"]` is `"yellow"`), so the second parameter's allowed values change based on the first argument automatically. No runtime `if (current === "red" && next !== "green") throw` is needed — the illegal combinations were never expressible as an argument list in the first place.

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)


---

## Reality Check

**"TS problem sets mean solving JS problems with annotations"** → Type-LEVEL problem sets are their own genre with their own ladder: implement Pick/Omit/Partial from scratch (mapped-type mechanics), then ReturnType/Parameters (infer mechanics), then DeepReadonly and tuple manipulation (recursion), then template-literal parsing (the type-challenges upper tiers). This is the TS-specific muscle — value-level problems with annotations sprinkled on train none of it, and the type-challenges repo exists precisely because the two skills are orthogonal.

**"Utility-type reimplementation is academic"** → Reimplementing utilities is how the STANDARD LIBRARY stops being magic and starts being debuggable: knowing Partial is one mapped line means knowing why it is shallow (and writing DeepPartial when needed), knowing Exclude is a one-line distributive conditional means understanding why it behaves per-member (and when brackets suppress that), knowing ReturnType is one infer means reading any library's fancier extraction types fluently. Every production type-error involving a utility becomes readable exactly to the depth you have rebuilt.

**"Type-level problems are solved by trial and error in the playground"** → The playground-guessing loop plateaus early because type-level TS has EVALUATION RULES you can execute deliberately: distribution over unions (trace per-member), inference site binding (what does infer capture given this pattern), recursion unrolling (write out two iterations by hand), and never-propagation (the empty union that vanishes). The training discipline mirrors value-level tracing drills: predict the result BEFORE hovering, diff prediction against reality, name the rule that explains the diff. Guess-and-hover builds familiarity; predict-and-diff builds the evaluator.

**"Real-world TS problems are simpler than type-challenges puzzles"** → Real-world problems are DIFFERENTLY hard: typing a form builder so field names flow to values, making an event emitter where emit("userCreated", payload) type-checks the payload per event, building a query-string parser that returns the right shape per route — these compose the SAME primitives the puzzles isolate (mapped types, infer, template literals) but add API-design judgment: where to put the generic, what to constrain, when precision costs more DX than it buys. The puzzle-to-production bridge is deliberately practicing both: puzzles for mechanics, then retrofitting one real API with the mechanics.

**"Once solved, type-level solutions transfer by copy-paste"** → Copied clever types ROT in place: they encode assumptions about their original context (specific depth limits, specific union sizes, specific tsconfig flags like exactOptionalPropertyTypes changing what optional means), fail with incomprehensible errors when assumptions break, and cannot be maintained by teammates who never derived them. The transfer discipline: re-derive rather than paste (the second derivation takes a tenth the time and produces context-fitted types), comment the one non-obvious rule each type relies on (distribution, homomorphism), and prefer the less-clever type that the whole team can extend — the same code-review economics as value-level cleverness, applied one level up.
