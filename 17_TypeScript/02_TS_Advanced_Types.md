**Navigation**: [< Previous](01_TS_Foundations.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_TS_Patterns_BestPractices.md)

**TypeScript Chapter 2/3** | [← Foundations](01_TS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next → Patterns](03_TS_Patterns_BestPractices.md)

# TypeScript Advanced Types — Generics, Utility Types & Type Gymnastics

## 5W1H — Why This Chapter?

WHAT: Advanced type system features that make TS extremely
powerful — generics, mapped types, conditional types,
utility types, template literal types.

WHY: Real codebases need FLEXIBLE yet SAFE types:

- A function that works with any array type
- An API response wrapper generic over the data shape
- Making some fields optional while keeping others required
- Creating new types from existing ones automatically

WHO: Intermediate-to-advanced TS developers, library authors,
anyone working with complex API types or state management.

WHEN: After mastering basic types, interfaces, and unions.

HOW: Generics provide the "type variables." Utility types,
mapped types, and conditional types build on that for
sophisticated type transformations.

---

## 1. Generics Deep Dive

### The Core Idea

ANALOGY: Generics are FUNCTION PARAMETERS, but for TYPES.

Regular function: function add(a: number, b: number) → number
Generic function: function first<T>(arr: T[]) → T

`a` and `b` are VALUE parameters (filled with values at call).
`T` is a TYPE parameter (filled with types at call).

first<number>([1, 2, 3]) → T becomes number → returns number
first<string>(["a", "b"]) → T becomes string → returns string

```typescript
// GENERIC FUNCTION:
function identity<T>(value: T): T {
  return value;
}
identity<string>("hello"); // Explicit: T = string
identity(42); // Inferred: T = number

// MULTIPLE TYPE PARAMETERS:
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}
pair("name", "Harsha"); // → [string, string]
pair("age", 24); // → [string, number]

// GENERIC INTERFACE:
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

type UserResponse = ApiResponse<User>;
type ProductResponse = ApiResponse<Product[]>;

// GENERIC CLASS:
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.pop(); // TS knows: number | undefined
```

### Generic Constraints

```typescript
// EXTENDS constraint — "T must have at least..."
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}
getLength("hello"); // ✅ string has .length
getLength([1, 2]); // ✅ array has .length
// getLength(42);     // ❌ number doesn't have .length

// KEYOF constraint — "K must be a key of T"
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { name: "Harsha", age: 24 };
getProperty(user, "name"); // TS knows: returns string
getProperty(user, "age"); // TS knows: returns number
// getProperty(user, "email"); // ❌ "email" is not a key of user

// DEFAULT GENERIC TYPE:
interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
// Can use without specifying T:
const response: PaginatedResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};
```

### Real-World Generic Patterns

```typescript
// PATTERN 1: API Fetcher
async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ApiResponse<T>>;
}
const users = await fetchData<User[]>("/api/users");
// users.data is User[] — fully typed!

// PATTERN 2: Event Emitter
class TypedEmitter<Events extends Record<string, any[]>> {
  private handlers: Partial<{
    [K in keyof Events]: Array<(...args: Events[K]) => void>;
  }> = {};

  on<K extends keyof Events>(
    event: K,
    handler: (...args: Events[K]) => void,
  ): void {
    (this.handlers[event] ??= []).push(handler);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    this.handlers[event]?.forEach((h) => h(...args));
  }
}

const emitter = new TypedEmitter<{
  login: [user: User];
  error: [code: number, message: string];
  logout: [];
}>();

emitter.on("login", (user) => console.log(user.name)); // user is typed!
emitter.on("error", (code, msg) => {}); // code: number, msg: string
emitter.emit("login", { id: 1, name: "Harsha", email: "" }); // Type-checked!

// PATTERN 3: Builder Pattern
class QueryBuilder<T> {
  private conditions: string[] = [];
  private selectedFields: (keyof T)[] = [];

  select(...fields: (keyof T)[]): this {
    this.selectedFields = fields;
    return this;
  }

  where(field: keyof T, value: T[keyof T]): this {
    this.conditions.push(`${String(field)} = ${value}`);
    return this;
  }

  build(): string {
    const fields = this.selectedFields.length
      ? this.selectedFields.join(", ")
      : "*";
    const where = this.conditions.length
      ? ` WHERE ${this.conditions.join(" AND ")}`
      : "";
    return `SELECT ${fields}${where}`;
  }
}
```

---

## 2. Utility Types — Built-in Type Transformations

> **Utility types are pre-baked transformations that take a type and
> return a related type.** TypeScript ships ~15 of them so you don't
> have to write the mapped-type gymnastics by hand. The important
> mental model: a utility type is a *function whose input and output
> are types* — not runtime code. `Partial<User>` doesn't run
> anywhere; it's a compile-time expression that produces a new
> object-shape type where every property is optional.
>
> **Why this matters.** When `User` changes, every derived type
> (`Partial<User>`, `Pick<User, "id" | "name">`, an update DTO, a
> response DTO) updates in lockstep. Rewrite once, propagate
> everywhere. That's the single largest win in a typed codebase —
> avoiding the "rename in 40 places" chore that kills refactors.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: "admin" | "user";
}

// ═══════════════════════════════════════════════════════════
// PARTIAL<T> — Makes ALL properties optional
// ═══════════════════════════════════════════════════════════
type UpdateUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; role?: ... }
// USE CASE: PATCH/update API — only send changed fields

function updateUser(id: number, updates: Partial<User>): void {
  // Can pass { name: "New" } or { age: 25 } or both
}

// ═══════════════════════════════════════════════════════════
// REQUIRED<T> — Makes ALL properties required (opposite of Partial)
// ═══════════════════════════════════════════════════════════
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}
type FullConfig = Required<Config>;
// { host: string; port: number; debug: boolean } — no optionals

// ═══════════════════════════════════════════════════════════
// READONLY<T> — Makes ALL properties readonly
// ═══════════════════════════════════════════════════════════
type ImmutableUser = Readonly<User>;
const frozenUser: ImmutableUser = {
  id: 1,
  name: "H",
  email: "",
  age: 24,
  role: "user",
};
// frozenUser.name = "New"; // ❌ Error — readonly!

// ═══════════════════════════════════════════════════════════
// PICK<T, Keys> — Select specific properties from T
// ═══════════════════════════════════════════════════════════
type UserSummary = Pick<User, "id" | "name">;
// { id: number; name: string }

// ═══════════════════════════════════════════════════════════
// OMIT<T, Keys> — Remove specific properties from T
// ═══════════════════════════════════════════════════════════
type CreateUserDTO = Omit<User, "id">;
// { name: string; email: string; age: number; role: ... } — no 'id'

// ═══════════════════════════════════════════════════════════
// RECORD<Keys, Value> — Create object type with specific keys & value type
// ═══════════════════════════════════════════════════════════
type Permissions = Record<"read" | "write" | "delete", boolean>;
// { read: boolean; write: boolean; delete: boolean }

type UserMap = Record<string, User>;
const users: UserMap = {
  u1: { id: 1, name: "A", email: "", age: 24, role: "admin" },
  u2: { id: 2, name: "B", email: "", age: 25, role: "user" },
};

// ═══════════════════════════════════════════════════════════
// EXTRACT<T, U> — Extract members from T that are assignable to U
// ═══════════════════════════════════════════════════════════
type StringOrNumber = string | number | boolean;
type JustStrings = Extract<StringOrNumber, string>; // string

// ═══════════════════════════════════════════════════════════
// EXCLUDE<T, U> — Remove members from T that are assignable to U
// ═══════════════════════════════════════════════════════════
type NotBoolean = Exclude<StringOrNumber, boolean>; // string | number

// ═══════════════════════════════════════════════════════════
// NONNULLABLE<T> — Remove null and undefined from T
// ═══════════════════════════════════════════════════════════
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

// ═══════════════════════════════════════════════════════════
// RETURNTYPE<T> — Extract the return type of a function
// ═══════════════════════════════════════════════════════════
function fetchUsers() {
  return Promise.resolve([{ id: 1, name: "A" }]);
}
type FetchResult = ReturnType<typeof fetchUsers>;
// Promise<{ id: number; name: string }[]>

type AwaitedResult = Awaited<ReturnType<typeof fetchUsers>>;
// { id: number; name: string }[]

// ═══════════════════════════════════════════════════════════
// PARAMETERS<T> — Extract parameter types as tuple
// ═══════════════════════════════════════════════════════════
function createUser(name: string, age: number, role: "admin" | "user") {}
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, role: "admin" | "user"]
```

### Utility Types Cheat Sheet

**The utility types you'll actually reach for — what each does,
how, and when it earns its place:**

| Utility           | Transformation                                     | Mechanism (rough)                                              | When to reach for it                            |
|-------------------|----------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------|
| `Partial<T>`      | All props become optional                          | `{ [K in keyof T]?: T[K] }`                                    | PATCH/update DTOs                               |
| `Required<T>`     | All props become required                          | `{ [K in keyof T]-?: T[K] }` (strips `?`)                      | Config with defaults filled in                  |
| `Readonly<T>`     | All props become `readonly`                        | `{ readonly [K in keyof T]: T[K] }`                            | Immutable snapshots, Redux state                |
| `Pick<T, K>`      | Keep only the named keys                           | `{ [P in K]: T[P] }`                                           | API response DTOs, narrowing a shape            |
| `Omit<T, K>`      | Drop the named keys                                | `Pick<T, Exclude<keyof T, K>>`                                 | Strip `id` / `createdAt` for creation DTOs      |
| `Record<K, V>`    | Object with keys `K`, values `V`                   | `{ [P in K]: V }`                                              | Dictionaries, enum-keyed lookup tables          |
| `Extract<T, U>`   | Keep union members assignable to `U`               | Distributive conditional `T extends U ? T : never`             | Filter a union to the shapes you want           |
| `Exclude<T, U>`   | Drop union members assignable to `U`               | Distributive conditional `T extends U ? never : T`             | Remove `null` / a specific case from a union    |
| `NonNullable<T>`  | Remove `null` and `undefined`                      | `Exclude<T, null \| undefined>`                                | After a runtime null-check narrows the value    |
| `ReturnType<F>`   | Extract the function's return type                 | `F extends (...args: any) => infer R ? R : never`              | Deriving types from an existing function        |
| `Parameters<F>`   | Extract the parameters as a tuple                  | `F extends (...args: infer P) => any ? P : never`              | Wrapper / decorator functions preserving args   |
| `Awaited<T>`      | Unwrap `Promise<T>` (recursively)                  | Conditional + `infer` unwrapping                               | Typing what an async function returns           |
| `ConstructorParameters<C>` | Extract constructor params as a tuple     | Same shape as `Parameters` but for `new`                       | Factory / builder wrappers                      |

**How to read a utility type when you meet one.** Every entry in the
column labelled "Mechanism" is expressible in plain TypeScript — the
`lib.es5.d.ts` file literally contains those one-liners. Reading them
teaches you the two moves the type system uses everywhere:
*mapped types* (`{ [K in keyof T]: ... }`) and *conditional +
`infer`* (`T extends X ? A : B`, sometimes plucking a piece with
`infer`). Once you internalise those two moves, you can write your
own utility types for shapes the standard library doesn't cover.

---

🔬 **Section Challenge — 2. Utility Types — Built-in Type Transformations**

**Challenge 1 (Reasoning):** You have a generic function `function delay<T>(fn: () => T, ms: number)`. How do you extract the exact return type of the function passed in, so you can correctly type the `delay` function's return signature?

<details><summary>Answer</summary>

- **Scenario:** Building generic wrapper functions that preserve inner types.
- **Trace:** TypeScript provides the `ReturnType<T>` utility type, which uses `infer` under the hood to extract the return type of a function signature.
- **Design Fix:** You type the return value of `delay` as `Promise<ReturnType<typeof fn>>`. However, since `T` is already the return type in the generic definition `fn: () => T`, the return signature is simply `Promise<T>`. But if you didn't have `T`, or were extracting it from an existing function reference `const myFn = () => 42;`, you would use `type Res = ReturnType<typeof myFn>;`.

</details>

## 3. Mapped Types — Type Algebra

> **What `[K in keyof T]` is actually looping over — the two-step
> mechanism underneath every mapped type in this section.**
> `keyof T` is not a keyword that "means iterate" — it's its own
> expression, evaluating to a **union of string-literal types**, one
> per property name `T` declares. For `User` from Section 2
> (`id, name, email, age, role`), `keyof User` literally IS the type
> `"id" | "name" | "email" | "age" | "role"` — you can assign a
> mapped type's key expression to a variable and see this directly:
> `type K = keyof User;` gives you that exact union. The `in`
> keyword is the second half: borrowed from mapped-type syntax
> specifically to mean "for each member of this union, produce one
> property with that name" — so `{ [K in keyof T]: T[K] }` reads as
> "for each literal `K` in that union, add a property named `K` whose
> type is `T[K]` (indexing `T` by that same literal — Section 1's
> `keyof` constraint pattern, reused as the VALUE side here)." Every
> variant below is this same two-step loop with one thing changed —
> `?` adds optionality, `readonly` adds the modifier, `as` (further
> down) changes the produced KEY instead of the value.

```typescript
// MAPPED TYPE: Transform each property of an existing type.
// Syntax:  { [K in keyof T]: NewType }

// HOW Partial<T> works internally:
type MyPartial<T> = {
  [K in keyof T]?: T[K]; // For each key, make optional
};

// HOW Readonly<T> works internally:
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]; // For each key, add readonly
};

// CUSTOM: Make all properties nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = Nullable<User>;
// { id: number | null; name: string | null; ... }

// CUSTOM: Deep Readonly (recursive)
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// REMAPPING KEYS (TS 4.1+):
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; getEmail: () => string; ... }

// FILTERING with key remapping:
type OnlyStringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type UserStrings = OnlyStringProps<User>;
// { name: string; email: string } — only string properties kept!
```

---

🔬 **Section Challenge — 3. Mapped Types — Type Algebra**

**Challenge 1 (Design):** You have an interface `DatabaseRow { id: string; createdAt: Date; name: string; age: number; }`. You want to write an update function where `id` and `createdAt` CANNOT be updated, and the rest of the fields are optional. How do you compose this using Mapped and Utility types?

<details><summary>Answer</summary>

- **Scenario:** Crafting precise API payload shapes.
- **Trace:** We need to split the type into two groups: the omitted properties and the partial properties.
- **Design Fix:**

```typescript
type UpdatePayload = Partial<Omit<DatabaseRow, "id" | "createdAt">>;
```

This evaluates to `{ name?: string; age?: number; }`. The ID and Date are completely removed from the payload type, ensuring the compiler rejects any accidental attempts to overwrite immutable database fields.

</details>

## 4. Conditional Types — Type-Level If/Else

> **Why distribution (further down) isn't "how if/else naturally
> behaves with unions" — it's a specific rule tied to one exact
> syntactic shape.** A conditional type only distributes when the
> checked type is a **bare/naked type parameter** — literally just
> `T`, alone, with nothing wrapped around it, on the left of
> `extends`. `T extends string ? true : false` qualifies; `[T]
> extends [string] ? true : false` does not, because the type being
> checked is now the tuple `[T]`, not `T` itself, even though `T` is
> still in there. This single syntactic distinction — bare `T` vs `T`
> wrapped in anything — is the entire on/off switch for distribution,
> which is why Section 4's Challenge fix (wrapping both sides in `[
> ]`) works: it doesn't change the LOGIC, it changes whether the
> checked type still counts as "bare" in the compiler's eyes.

```typescript
// Syntax:  T extends U ? TrueType : FalseType

// BASIC:
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">; // true
type B = IsString<42>; // false

// INFER keyword — extract types from within:
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type X = UnwrapPromise<Promise<string>>; // string
type Y = UnwrapPromise<number>; // number (not a promise)

// Extract array element type:
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Z = ElementOf<string[]>; // string

// Extract function return type (how ReturnType works):
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// DISTRIBUTIVE conditional types:
// When T is a UNION, conditional distributes over each member:
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]
// NOT (string | number)[]

// Prevent distribution with [T]:
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

### Real-World Conditional Type Examples

```typescript
// API Response that varies by endpoint:
type ApiEndpoint = "/users" | "/products" | "/orders";

type ApiData<E extends ApiEndpoint> = E extends "/users"
  ? User[]
  : E extends "/products"
    ? Product[]
    : E extends "/orders"
      ? Order[]
      : never;

async function fetchApi<E extends ApiEndpoint>(
  endpoint: E,
): Promise<ApiData<E>> {
  const res = await fetch(endpoint);
  return res.json();
}
const users = await fetchApi("/users"); // Type: User[]
const products = await fetchApi("/products"); // Type: Product[]

// Event handler map:
type EventPayload<E extends string> = E extends "click"
  ? { x: number; y: number }
  : E extends "keypress"
    ? { key: string; code: number }
    : E extends "submit"
      ? { formData: FormData }
      : Record<string, unknown>;
```

---

🔬 **Section Challenge — 4. Conditional Types — Type-Level If/Else**

**Challenge 1 (Trace):** Why does `type ToArray<T> = T extends any ? T[] : never;` when given `string | number` evaluate to `string[] | number[]`, instead of `(string | number)[]`?

<details><summary>Answer</summary>

- **Scenario:** Understanding Distributive Conditional Types.
- **Trace:** In TypeScript, conditional types are **distributive** by default when the checked type (`T`) is a bare type parameter. This means the compiler splits the union and applies the condition to each member individually. It evaluates `(string extends any ? string[] : never) | (number extends any ? number[] : never)`, resulting in `string[] | number[]`.
- **Debug/Fix:** If you want to disable distribution and evaluate the union as a single block, wrap both sides of the `extends` clause in tuples:
  `type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;`

</details>

## 5. Template Literal Types

```typescript
// Combine string literals at the TYPE level:
type Color = "red" | "green" | "blue";
type Size = "sm" | "md" | "lg";

type ClassName = `${Size}-${Color}`;
// "sm-red" | "sm-green" | "sm-blue" | "md-red" | "md-green" | ... (9 combos)

// CSS-like property names:
type CSSProperty =
  `${"margin" | "padding"}-${"top" | "right" | "bottom" | "left"}`;
// "margin-top" | "margin-right" | ... | "padding-left" (8 combos)

// Event handler naming:
type EventName = "click" | "focus" | "blur";
type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

// INTRINSIC STRING MANIPULATION TYPES:
type Upper = Uppercase<"hello">; // "HELLO"
type Lower = Lowercase<"HELLO">; // "hello"
type Cap = Capitalize<"hello">; // "Hello"
type Uncap = Uncapitalize<"Hello">; // "hello"

// PATTERN MATCHING with template literals:
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId" — extracted from the route string!
```

---

🔬 **Section Challenge — 5. Template Literal Types**

**Challenge 1 (Design):** You are building a Tailwind CSS clone. You want to type a padding utility that accepts strings like `p-4`, `p-8`, or `pt-4`. How do you define this using Template Literal Types?

<details><summary>Answer</summary>

- **Scenario:** Generating highly specific string validation types.
- **Trace:** Template literal types allow you to multiply unions together to generate all possible string combinations at compile time.
- **Design Fix:**

```typescript
type Prefix = "p" | "pt" | "pr" | "pb" | "pl" | "px" | "py";
type Size = "0" | "1" | "2" | "4" | "8";
type PaddingClass = `${Prefix}-${Size}`;
// Generates "p-0" | "p-1" | ... | "py-8" (35 specific literal strings)
```

</details>

## 6. Discriminated Unions — Advanced Patterns

```typescript
// STATE MACHINE (React reducer pattern):
type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; user: User; token: string }
  | { status: "error"; error: string; retryCount: number };

function renderAuth(state: AuthState): string {
  switch (state.status) {
    case "idle":
      return "Please log in";
    case "loading":
      return "Loading...";
    case "authenticated":
      return `Welcome, ${state.user.name}`; // TS knows user exists
    case "error":
      return `Error: ${state.error} (${state.retryCount} retries)`;
  }
}

// RESULT TYPE (inspired by Rust):
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "Division by zero" };
  return { ok: true, value: a / b };
}

const result = divide(10, 3);
if (result.ok) {
  console.log(result.value.toFixed(2)); // TS knows: number
} else {
  console.error(result.error); // TS knows: string
}

// ACTION/REDUCER PATTERN (Redux-style):
type Action =
  | { type: "ADD_TODO"; payload: { text: string } }
  | { type: "TOGGLE_TODO"; payload: { id: number } }
  | { type: "DELETE_TODO"; payload: { id: number } }
  | { type: "SET_FILTER"; payload: { filter: "all" | "active" | "done" } };

interface State {
  todos: Array<{ id: number; text: string; done: boolean }>;
  filter: "all" | "active" | "done";
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TODO":
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now(),
            text: action.payload.text, // TS knows: { text: string }
            done: false,
          },
        ],
      };
    case "TOGGLE_TODO":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "DELETE_TODO":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload.id),
      };
    case "SET_FILTER":
      return { ...state, filter: action.payload.filter };
  }
}
```

---

## 7. Type Challenges — Practice Problems

Every solution below composes mechanisms already derived in this
chapter — the interesting part in each is the one detail that ISN'T
obvious from gluing the pieces together naively.

```typescript
// CHALLENGE 1: Implement DeepPartial
// The Function guard is the detail a naive version misses: a function
// type technically extends `object` too (it has .length, .name, .call —
// TS's type system doesn't distinguish "callable" from "has properties"
// at this check). Without the inner `extends Function` branch, recursing
// into a function type would try to make its non-existent "properties"
// partial, silently corrupting the callable signature into `{}`.
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

// CHALLENGE 2: Implement Flatten (one level)
type Flatten<T> = T extends (infer U)[] ? U : T;

// CHALLENGE 3: Implement TupleToUnion
// T[number] indexes the tuple by the TYPE `number` (not a specific
// literal index) — "what's the type at any numeric index" for a tuple
// with different types per slot is exactly the union of every slot's
// type. Same trick as Chapter 1 Section 7's `(typeof colors)[number]`.
type TupleToUnion<T extends readonly any[]> = T[number];
type Test = TupleToUnion<[string, number, boolean]>; // string | number | boolean

// CHALLENGE 4: Implement NonEmptyArray
// [T, ...T[]] is a tuple with one MANDATORY first element followed by a
// rest of zero-or-more — the type-level encoding of "at least one item,"
// which is precisely why arr[0] below is T, never T | undefined.
type NonEmptyArray<T> = [T, ...T[]];
function firstElement<T>(arr: NonEmptyArray<T>): T {
  return arr[0]; // No undefined possible!
}

// CHALLENGE 5: Implement StrictOmit (errors on invalid keys)
// Plain Omit accepts ANY string as K, valid key or not, because its
// definition (Section 2's cheat sheet) routes through Exclude<keyof T, K>,
// which silently no-ops if K was never a real key to begin with. Adding
// the constraint `K extends keyof T` moves that check to the CALL site —
// passing a typo'd key now fails immediately, at StrictOmit<T, K>, instead
// of silently producing a type identical to T with nothing omitted.
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
```

---

## Interview Quick-Fire

```
Q: What are generics and why use them?
→ Type parameters that let you write reusable, type-safe code.
  Without generics, you'd need different function per type or use `any`.

Q: Explain Pick vs Omit?
→ Pick<T, K> keeps only keys K. Omit<T, K> removes keys K.
  Pick<User, "name"|"email"> → {name, email}
  Omit<User, "id"> → everything except id.

Q: What is a mapped type?
→ A type that transforms each property of another type.
  Syntax: { [K in keyof T]: ... }. Partial, Readonly, Record all work this way.

Q: What is the `infer` keyword?
→ Used in conditional types to EXTRACT a type from a pattern.
  T extends Promise<infer U> ? U : T — extracts the U from Promise<U>.

Q: How do template literal types work?
→ They combine string literal types: `${A}-${B}` creates all combinations.
  "sm" | "md" + "red" | "blue" → "sm-red" | "sm-blue" | "md-red" | "md-blue"

Q: What is a discriminated union?
→ Union where each variant has a literal "tag" field. TS narrows the type
  in switch/if based on the tag. Essential for reducers, state machines, APIs.

Q: Explain conditional types distribution?
→ When T in `T extends U ? X : Y` is a union, the condition distributes
  over each member. string | number → IsString<string> | IsString<number>.
```

---

[← Foundations](01_TS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next → Patterns](03_TS_Patterns_BestPractices.md)


---

## Reality Check

**"Advanced types are for library authors"** → The advanced-type PAYOFF concentrates in application code at exactly the places bugs do: discriminated unions making illegal STATES unrepresentable (loading/error/success where error-with-data cannot compile — versus the boolean-flag soup where it can), template literals typing route params and event names, mapped types keeping derived shapes in sync with their source automatically (change the source, every derivative updates or errors). The library-author frame is backwards: libraries EXPORT this machinery precisely because applications are where the invariants live.

**"Conditional types are type-level if statements"** → The mechanics that actually matter are the ones the if-statement analogy hides: conditionals DISTRIBUTE over unions by default (T extends U applied to A | B runs per-member — the reason Exclude works at all, and the reason your conditional exploded a union unexpectedly; brackets [T] extends [U] suppress it), infer declares type VARIABLES bound by pattern-matching (ReturnType is destructuring at the type level), and never is the identity that vanishes from unions (the filtering mechanism itself). Distribution is the semantics; the if-analogy without it produces types that work by coincidence.

**"Mapped types transform object types"** → The full toolkit is transformation plus RENAMING plus arithmetic: key remapping via as (as `get${Capitalize<K>}` generating getter names, as-never FILTERING keys by value type — the pick-all-functions idiom), modifier arithmetic (-readonly and -? REMOVE what +adds — Mutable and Required are minus-signs, the part nobody discovers alone), and homomorphic preservation (mapping over keyof T keeps optionality/readonly per-key — why Partial composes cleanly but hand-rolled index signatures lose the modifiers). Without remapping and minus-modifiers, half the standard-library utility types are unreproducible magic.

**"Type-level programming is Turing-complete cleverness to avoid"** → There is a real line, but it runs through MAINTENANCE COST, not cleverness: types that mirror your domain (a union of event names driving payload lookup, a mapped config schema) pay rent forever; types that implement algorithms (type-level parsers, arithmetic via tuple lengths) cost every reader and eventually hit recursion-depth ceilings and instantiation-explosion build times. The audit question for any impressive type: when a requirement changes, does this type UPDATE the change or fight it? Rent-payers update; trophies fight. Avoid trophies, not power.

**"satisfies is another way to write a type annotation"** → satisfies checks WITHOUT WIDENING — the annotation trade-off it dissolves: colon-annotation validates but forgets (config: Record<string, Color> then config.primary is just Color, literal gone), as-const preserves but validates nothing, satisfies does both (validated against the constraint, inferred at full literal precision — config.primary stays "#ff0000", typos still error). Its natural habitat is config objects, route tables, and theme definitions consumed by literal-hungry APIs. It is the newest member of the precision toolkit and the tell that someone's TS knowledge postdates 4.9.
