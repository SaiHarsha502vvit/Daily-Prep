> **TypeScript Chapter 1/3** | [Index](../00_MASTER_INDEX.md) | [Next → Advanced Types](02_TS_Advanced_Types.md)

# TypeScript Foundations — Why Types Matter

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: TypeScript is JavaScript + STATIC TYPE CHECKING.           ║
║        It compiles to plain JS. Every valid JS is valid TS.       ║
║                                                                    ║
║  WHY:  JS bugs often come from type mismatches:                   ║
║        • Passing string where number expected                     ║
║        • Accessing property on undefined object                   ║
║        • Calling function with wrong arguments                     ║
║        TS catches these at COMPILE TIME — before users see them.  ║
║                                                                    ║
║  WHO:  Every professional JS developer. React, Angular, Vue,     ║
║        Node — all major ecosystems have TS support. Most job      ║
║        listings now require TypeScript.                            ║
║                                                                    ║
║  WHEN: Immediately after learning JS fundamentals.                ║
║                                                                    ║
║  WHERE: Everywhere JS runs. TS compiles away — the browser/Node  ║
║         never sees TypeScript, only the resulting JavaScript.      ║
║                                                                    ║
║  HOW:  Install → write .ts files → compiler (tsc) or bundler     ║
║        (Vite) transpiles to .js → runs as usual.                  ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. Setup & Configuration

```bash
# Install TypeScript
npm install -g typescript    # Global (for tsc command)
npm install -D typescript    # Project dependency

# Initialize tsconfig.json
npx tsc --init

# Compile
npx tsc                      # Compile all .ts files
npx tsc file.ts              # Compile single file
npx tsc --watch              # Watch mode (auto-recompile)
```

### tsconfig.json — Key Options Explained

```json
{
  "compilerOptions": {
    "target": "ES2022",          // Which JS version to output
    "module": "ESNext",          // Module system (ESM)
    "strict": true,              // Enable ALL strict checks (ALWAYS!)
    "esModuleInterop": true,     // Better import compatibility
    "skipLibCheck": true,        // Skip node_modules type checking
    "forceConsistentCasingInImports": true,
    "outDir": "./dist",          // Output directory
    "rootDir": "./src",          // Source directory
    "declaration": true,         // Generate .d.ts files
    "sourceMap": true,           // Generate .map files for debugging
    "noImplicitAny": true,       // Error on implicit 'any' type
    "strictNullChecks": true,    // null/undefined are separate types
    "noUnusedLocals": true,      // Error on unused variables
    "noUnusedParameters": true,  // Error on unused function params
    "resolveJsonModule": true,   // Allow importing .json files
    "jsx": "react-jsx"           // For React projects
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHY strict: true IS NON-NEGOTIABLE:                              ║
║                                                                    ║
║  strict: true enables 7 flags at once:                            ║
║  • noImplicitAny — no guessing types                              ║
║  • strictNullChecks — null is NOT assignable to string            ║
║  • strictFunctionTypes — function parameter variance checks       ║
║  • strictBindCallApply — type-safe bind/call/apply               ║
║  • strictPropertyInitialization — class fields must be init'd    ║
║  • noImplicitThis — error if `this` type is unknown              ║
║  • alwaysStrict — emit "use strict" in every file                ║
║                                                                    ║
║  REASONING: Without strict, TS gives a FALSE sense of safety.    ║
║  You think you have type protection but you don't. Start strict. ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 2. Basic Types

```typescript
// PRIMITIVES:
let name: string = "Harsha";
let age: number = 24;           // All numbers (int, float, NaN, Infinity)
let isActive: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let id: symbol = Symbol("id");
let big: bigint = 100n;

// ARRAYS:
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["A", "B"];  // Generic syntax (same thing)
let mixed: (string | number)[] = [1, "hello", 2];

// TUPLE (fixed-length array with specific types per position):
let pair: [string, number] = ["Harsha", 24];
let rgb: [number, number, number] = [255, 128, 0];
// pair[0] is string, pair[1] is number — TS knows!

// ENUM:
enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT"
}
let dir: Direction = Direction.Up;

// const enum (inlined at compile time — more efficient):
const enum HttpStatus {
    OK = 200,
    NotFound = 404,
    ServerError = 500
}
// REASONING: const enum replaces the reference with the literal value.
// HttpStatus.OK compiles to just 200 (no runtime object).

// ANY — escape hatch (AVOID unless migrating from JS):
let anything: any = "hello";
anything = 42;
anything.foo.bar(); // No error! TS doesn't check `any` at all.

// UNKNOWN — safe alternative to any:
let value: unknown = "hello";
// value.toUpperCase(); // ❌ Error! Must narrow first.
if (typeof value === "string") {
    value.toUpperCase(); // ✅ Now TS knows it's string.
}

// VOID — function returns nothing:
function logMessage(msg: string): void {
    console.log(msg);
}

// NEVER — function never returns (throws or infinite loop):
function throwError(msg: string): never {
    throw new Error(msg);
}
function infiniteLoop(): never {
    while (true) {}
}
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  TYPE HIERARCHY:                                                   ║
║                                                                    ║
║  unknown  ← TOP type (anything assignable TO it)                  ║
║    │                                                               ║
║    ├── string                                                      ║
║    ├── number                                                      ║
║    ├── boolean                                                     ║
║    ├── object                                                      ║
║    │     ├── Array                                                 ║
║    │     ├── Function                                              ║
║    │     └── {...}                                                 ║
║    ├── null                                                        ║
║    ├── undefined                                                   ║
║    ├── void                                                        ║
║    └── any ← SPECIAL (opts out of type checking entirely)         ║
║                                                                    ║
║  never  ← BOTTOM type (nothing assignable TO it)                  ║
║                                                                    ║
║  REASONING: unknown = "I don't know yet, so check before using"   ║
║  any = "I don't care, let me do whatever" (dangerous)             ║
║  never = "This can never happen" (exhaustive checks)              ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 3. Interfaces & Type Aliases

```typescript
// INTERFACE — Describes object shape:
interface User {
    id: number;
    name: string;
    email: string;
    age?: number;          // Optional (number | undefined)
    readonly createdAt: Date; // Cannot be reassigned
}

const user: User = {
    id: 1,
    name: "Harsha",
    email: "h@test.com",
    createdAt: new Date()
};
// user.createdAt = new Date(); // ❌ Error — readonly!

// TYPE ALIAS — Can describe ANY type (not just objects):
type ID = string | number;
type Callback = (data: string) => void;
type Pair<T> = [T, T];
type Status = "active" | "inactive" | "pending"; // Union literal

const userId: ID = "abc123";
const status: Status = "active";
// const bad: Status = "deleted"; // ❌ Error!

// EXTENDING:
interface Animal {
    name: string;
    sound(): string;
}

interface Dog extends Animal {
    breed: string;
    fetch(): void;
}

// Type intersection (equivalent):
type Cat = Animal & {
    indoor: boolean;
    purr(): void;
};

// INTERFACE vs TYPE — When to use which?
// ┌──────────────┬───────────────────┬───────────────────────┐
// │ Feature      │ interface         │ type                  │
// ├──────────────┼───────────────────┼───────────────────────┤
// │ Object shape │ ✅                │ ✅                     │
// │ Extend       │ extends           │ & (intersection)      │
// │ Merge (decl) │ ✅ (auto-merge)   │ ❌                     │
// │ Primitives   │ ❌                │ ✅ (type X = string)   │
// │ Union        │ ❌                │ ✅ (type X = A | B)    │
// │ Tuple        │ ❌                │ ✅                     │
// │ Mapped types │ ❌                │ ✅                     │
// └──────────────┴───────────────────┴───────────────────────┘
// RULE: Use `interface` for objects/classes. Use `type` for everything else.
```

### Declaration Merging (Interface Superpower)

```typescript
// Interfaces with the same name MERGE automatically:
interface Window {
    myCustomProp: string;
}
// Now window.myCustomProp is typed!

// This is how TS extends built-in types:
interface Array<T> {
    customMethod(): T[];
}
// Now all arrays have customMethod in the type system.

// REASONING: Declaration merging is how third-party libraries
// extend global types. TypeScript uses it extensively internally.
// Types CANNOT merge — that's a key difference.
```

---

## 4. Functions in TypeScript

```typescript
// TYPED FUNCTION DECLARATION:
function add(a: number, b: number): number {
    return a + b;
}

// ARROW FUNCTION:
const multiply = (a: number, b: number): number => a * b;

// FUNCTION TYPE:
type MathFn = (a: number, b: number) => number;
const divide: MathFn = (a, b) => a / b; // Types inferred from MathFn

// OPTIONAL & DEFAULT PARAMETERS:
function greet(name: string, greeting: string = "Hello"): string {
    return `${greeting}, ${name}!`;
}

// REST PARAMETERS:
function sum(...numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
}

// OVERLOADS (different return types based on input):
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): number | string {
    if (typeof input === "string") return parseInt(input);
    return input.toString();
}
parse("42");  // TypeScript knows: returns number
parse(42);    // TypeScript knows: returns string

// GENERIC FUNCTIONS:
function first<T>(arr: T[]): T | undefined {
    return arr[0];
}
first([1, 2, 3]);      // T is inferred as number → returns number
first(["a", "b"]);     // T is inferred as string → returns string

// GENERIC WITH CONSTRAINT:
function getLength<T extends { length: number }>(item: T): number {
    return item.length;
}
getLength("hello");     // ✅ string has .length
getLength([1, 2, 3]);   // ✅ array has .length
// getLength(42);        // ❌ number doesn't have .length
```

---

## 5. Union & Intersection Types

```typescript
// UNION: "this OR that"
type StringOrNumber = string | number;
let value: StringOrNumber = "hello";
value = 42; // Also valid

// NARROWING (making TS know which type):
function format(value: string | number): string {
    if (typeof value === "string") {
        return value.toUpperCase();  // TS knows it's string here
    }
    return value.toFixed(2);         // TS knows it's number here
}

// DISCRIMINATED UNION (the MOST IMPORTANT pattern):
type Shape = 
    | { kind: "circle"; radius: number }
    | { kind: "rectangle"; width: number; height: number }
    | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "rectangle":
            return shape.width * shape.height;    // TS knows width exists
        case "triangle":
            return 0.5 * shape.base * shape.height;
        default:
            const _exhaustive: never = shape; // Ensures all cases handled!
            return _exhaustive;
    }
}

// REASONING: The `kind` field is the DISCRIMINANT.
// TS uses it to narrow the type in each case branch.
// This pattern is used EVERYWHERE: Redux actions, API responses,
// state machines, event handling. Master it.

// INTERSECTION: "this AND that"
type HasName = { name: string };
type HasAge = { age: number };
type Person = HasName & HasAge; // Must have BOTH name AND age

const p: Person = { name: "Harsha", age: 24 };
```

---

## 6. Type Narrowing — Making TS Smarter

```typescript
// TS narrows types using these guards:

// 1. typeof
function double(x: string | number) {
    if (typeof x === "string") return x.repeat(2);
    return x * 2;
}

// 2. instanceof
function formatDate(d: string | Date) {
    if (d instanceof Date) return d.toISOString();
    return new Date(d).toISOString();
}

// 3. 'in' operator
type Fish = { swim: () => void };
type Bird = { fly: () => void };
function move(animal: Fish | Bird) {
    if ("swim" in animal) animal.swim();
    else animal.fly();
}

// 4. Truthiness
function print(value: string | null | undefined) {
    if (value) {
        console.log(value.toUpperCase()); // TS knows: not null/undefined
    }
}

// 5. Custom type guard (TYPE PREDICATE):
function isString(value: unknown): value is string {
    return typeof value === "string";
}
// After isString(x) returns true, TS narrows x to string.

function isUser(obj: unknown): obj is User {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "name" in obj &&
        "email" in obj
    );
}

const data: unknown = await fetch("/api").then(r => r.json());
if (isUser(data)) {
    console.log(data.name); // TS knows data is User!
}

// 6. Assertion function (ASSERT type):
function assertIsString(value: unknown): asserts value is string {
    if (typeof value !== "string") {
        throw new Error(`Expected string, got ${typeof value}`);
    }
}
let input: unknown = "hello";
assertIsString(input);
input.toUpperCase(); // TS narrows after assertion
```

---

## 7. Literal Types & const Assertions

```typescript
// LITERAL TYPES: Exact values as types
let direction: "up" | "down" | "left" | "right" = "up";
let httpStatus: 200 | 404 | 500 = 200;
let truthy: true = true;

// AS CONST (makes everything readonly and literal):
const config = {
    api: "https://api.example.com",
    timeout: 5000,
    retries: 3
} as const;
// Type is: { readonly api: "https://api.example.com"; readonly timeout: 5000; readonly retries: 3 }
// WITHOUT as const, it would be: { api: string; timeout: number; retries: number }

// USE CASE: Action types (Redux pattern)
const ACTIONS = {
    ADD: "ADD",
    REMOVE: "REMOVE",
    UPDATE: "UPDATE"
} as const;
type ActionType = typeof ACTIONS[keyof typeof ACTIONS]; // "ADD" | "REMOVE" | "UPDATE"

// Array as const:
const colors = ["red", "green", "blue"] as const;
type Color = typeof colors[number]; // "red" | "green" | "blue"
```

---

## 8. Type Assertions & Non-Null Assertion

```typescript
// TYPE ASSERTION: "I know better than TS" (use sparingly!)
const input = document.getElementById("email") as HTMLInputElement;
input.value = "hello@test.com"; // TS knows it's an input now

// Alternative syntax (not in JSX/TSX files):
const input2 = <HTMLInputElement>document.getElementById("email");

// NON-NULL ASSERTION (!): "I promise this isn't null"
const element = document.getElementById("app")!;
// element is HTMLElement (not HTMLElement | null)
// ⚠ If it IS null, you get a runtime error. Use sparingly.

// BETTER PATTERN: Null check
const element2 = document.getElementById("app");
if (!element2) throw new Error("App element not found");
// After this, TS knows element2 is HTMLElement (narrowing)
element2.innerHTML = "Hello";

// SATISFIES operator (TS 4.9) — validate type WITHOUT widening:
const palette = {
    red: [255, 0, 0],
    green: "#00FF00",
    blue: [0, 0, 255]
} satisfies Record<string, string | number[]>;
// palette.red is still number[] (not string | number[])
// BUT TS validates it matches the Record type
```

---

## 9. TypeScript vs JavaScript — When Each is Better

```
╔══════════════════════════════════════════════════════════════════════╗
║  USE TYPESCRIPT WHEN:                       USE JS WHEN:          ║
║  ┌──────────────────────────────┐  ┌───────────────────────────┐  ║
║  │ Team project (2+ devs)      │  │ Quick prototype / script  │  ║
║  │ Large codebase (>1000 LOC)  │  │ Simple automation tasks   │  ║
║  │ API contracts matter        │  │ Learning JS fundamentals  │  ║
║  │ Refactoring is frequent     │  │ Config files (vite, etc.) │  ║
║  │ Code is long-lived          │  │ Tiny utility scripts      │  ║
║  │ Complex state management    │  │ Browser console debugging │  ║
║  │ Library/package authoring   │  │                           │  ║
║  └──────────────────────────────┘  └───────────────────────────┘  ║
║                                                                    ║
║  FACT: TypeScript has ZERO runtime cost. It compiles completely   ║
║  away. The only cost is compilation time (usually <1s with Vite). ║
║                                                                    ║
║  ANALOGY: TS is like spellcheck in a Word document.              ║
║  It doesn't change what you write — it helps you write correctly. ║
║  The final document (JS) is the same, but with fewer mistakes.   ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Interview Quick-Fire

```
Q: What is TypeScript?
→ A statically-typed superset of JavaScript. It adds optional types
  that are checked at compile time. Compiles to plain JavaScript.

Q: Interface vs Type — when to use which?
→ Interface for object shapes (can extend, merge). Type for unions,
  intersections, primitives, tuples, mapped types.

Q: What is `unknown` vs `any`?
→ Both accept any value. `any` skips ALL type checking (unsafe).
  `unknown` requires narrowing before use (safe). Prefer unknown.

Q: What is a discriminated union?
→ A union type where each variant has a common literal property
  (discriminant) that TS uses to narrow the type in branches.

Q: What is `never` used for?
→ Functions that never return (throw/infinite loop). Exhaustive
  checks in switch statements. Nothing is assignable to never.

Q: How does TS narrowing work?
→ TS uses control flow analysis (typeof, instanceof, in, truthiness,
  custom type guards) to determine more specific types in branches.

Q: What is `as const`?
→ Makes values readonly and narrows types to literal types.
  { x: "hello" } as const → { readonly x: "hello" } instead of { x: string }.
```

---

> [Index](../00_MASTER_INDEX.md) | [Next → Advanced Types](02_TS_Advanced_Types.md)
