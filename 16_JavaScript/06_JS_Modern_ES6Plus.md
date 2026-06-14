**JavaScript Chapter 6/7** | [← Previous: DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md) | [Index](../00_MASTER_INDEX.md) | [Next → Error Handling & Debugging](07_JS_Error_Handling_Debugging.md)

# Modern ES6+ Features — The Complete Guide

## 5W1H — Why This Chapter?

WHAT: ES6 (2015) was the biggest upgrade in JS history. Since
then, yearly releases add new features. This chapter
covers everything from ES6 through ES2024.

WHY: Modern JS is a DIFFERENT language from pre-2015 JS.
React, Node, and all modern frameworks assume ES6+.
Interview questions heavily test ES6+ understanding.

WHO: Every JS developer writing code after 2015.

HOW: We cover: template literals, destructuring (recap),
modules, Map/Set, WeakRef, Proxy, iterators/generators,
optional chaining, and newer additions through 2024.

---

## 1. Template Literals

```javascript
const name = "Harsha";
const age = 24;

// Old way:
const msg = "Hello " + name + ", you are " + age + " years old.";

// Template literal:
const msg2 = `Hello ${name}, you are ${age} years old.`;

// MULTI-LINE (no \n needed):
const html = `
    <div class="card">
        <h2>${name}</h2>
        <p>Age: ${age}</p>
    </div>
`;

// EXPRESSIONS inside ${}:
const price = `Total: $${(100 * 1.18).toFixed(2)}`; // "Total: $118.00"
const status = `User is ${age >= 18 ? "adult" : "minor"}`;

// TAGGED TEMPLATES (advanced — used by styled-components, GraphQL):
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? `<mark>${values[i]}</mark>` : "");
  }, "");
}
const result = highlight`Hello ${name}, age ${age}`;
// "Hello <mark>Harsha</mark>, age <mark>24</mark>"

// REAL-WORLD: styled-components uses this:
// const Button = styled.button`
//     background: ${props => props.primary ? "blue" : "gray"};
//     padding: 10px 20px;
// `;
```

---

## 2. Enhanced Object Literals

```javascript
const name = "Harsha";
const age = 24;

// SHORTHAND PROPERTIES (key matches variable name):
const user = { name, age }; // Same as { name: name, age: age }

// SHORTHAND METHODS:
const obj = {
  greet() {
    return "Hello!";
  }, // Instead of greet: function() {}
};

// COMPUTED PROPERTY NAMES:
const field = "email";
const form = {
  [field]: "h@test.com", // { email: "h@test.com" }
  [`${field}Valid`]: true, // { emailValid: true }
};

// SPREAD with objects:
const defaults = { theme: "dark", lang: "en", font: 14 };
const prefs = { theme: "light", font: 16 };
const merged = { ...defaults, ...prefs };
// { theme: "light", lang: "en", font: 16 }
// Later properties overwrite earlier ones. Order matters!
```

---

## 3. Modules — import/export

### 5W1H: WHY Modules?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: ES Modules let you split code into separate files and         ║
║        import/export between them.                                   ║
║                                                                      ║
║  WHY:  Before modules, all JS shared one global scope.               ║
║        → Variable collisions, dependency chaos, huge files.          ║
║        Modules give each file its own scope + explicit deps.         ║
║                                                                      ║
║  HOW:  Two module systems exist:                                     ║
║        • ES Modules (ESM): import/export — standard, browser+Node    ║
║        • CommonJS (CJS): require/module.exports — Node legacy        ║
║                                                                      ║
║  REASONING: React uses ESM. Node is moving to ESM. Learn ESM.        ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// ──── math.js (exporting) ────

// NAMED EXPORTS (can have many per file):
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}

// DEFAULT EXPORT (one per file — the "main" thing):
export default class Calculator {
  add(a, b) {
    return a + b;
  }
}

// ──── app.js (importing) ────

// Named imports (must use exact names, use {} ):
import { PI, add, subtract } from "./math.js";

// Rename on import:
import { add as sum } from "./math.js";

// Default import (any name, no {} ):
import Calculator from "./math.js";
import MyCalc from "./math.js"; // Same thing, different name

// Import all:
import * as MathUtils from "./math.js";
MathUtils.add(1, 2);
MathUtils.PI;
MathUtils.default; // The Calculator class

// DYNAMIC IMPORT (code splitting — lazy load):
const module = await import("./heavyModule.js");
// Returns a promise! Used for:
// • Lazy loading routes in React
// • Loading code only when needed
// • Conditional imports

// Re-export (barrel pattern):
// index.js
export { default as Button } from "./Button.js";
export { default as Input } from "./Input.js";
export { default as Card } from "./Card.js";
// Now: import { Button, Input, Card } from "./components";
```

```
ESM vs CommonJS:
┌──────────────────┬──────────────────┬───────────────────┐
│ Feature          │ ESM              │ CommonJS          │
├──────────────────┼──────────────────┼───────────────────┤
│ Syntax           │ import/export    │ require/module.   │
│                  │                  │ exports           │
│ Loading          │ Async (parallel) │ Sync (blocking)   │
│ Tree-shaking     │ Yes (static)     │ No (dynamic)      │
│ Top-level await  │ Yes              │ No                │
│ Browser support  │ Yes              │ No (needs bundler)│
│ File extension   │ .mjs / .js       │ .cjs / .js        │
│ Future           │ Standard         │ Legacy            │
└──────────────────┴──────────────────┴───────────────────┘

TREE-SHAKING: ESM imports are STATIC (analyzed at compile time).
Bundlers (Webpack/Vite) can remove unused exports (dead code).
CommonJS is dynamic — bundler can't know what's used.
```

---

## 4. Map & Set — Better Collections

```javascript
// ──── MAP (key-value pairs, ANY type as key) ────

const map = new Map();
map.set("name", "Harsha");
map.set(42, "meaning");           // Number as key
map.set(true, "boolean key");     // Boolean as key

const userObj = { id: 1 };
map.set(userObj, "user data");    // Object as key!

map.get("name");    // "Harsha"
map.get(42);        // "meaning"
map.has("name");    // true
map.size;           // 4
map.delete("name");
map.clear();        // Remove all

// ITERATION:
for (const [key, value] of map) {
    console.log(key, value);
}
map.forEach((value, key) => console.log(key, value));
[...map.keys()];    // All keys as array
[...map.values()];  // All values as array

// MAP vs Object:
// ┌──────────────┬───────────────┬────────────────┐
// │              │ Map           │ Object         │
// │ Key types    │ Any           │ String/Symbol  │
// │ Size         │ .size         │ Object.keys().length │
// │ Iteration    │ Ordered       │ Mostly ordered │
// │ Performance  │ Better for    │ Better for     │
// │              │ frequent add/ │ static shapes  │
// │              │ delete        │                │
// └──────────────┴───────────────┴────────────────┘

// ──── SET (unique values only) ────

const set = new Set([1, 2, 3, 3, 3]); // Duplicates removed!
set.size;     // 3
set.add(4);
set.has(3);   // true
set.delete(2);

// COMMON USE: Remove duplicates from array
const arr = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]

// Set operations:
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);
const union = new Set([...a, ...b]);           // {1,2,3,4,5,6}
const intersection = new Set([...a].filter(x => b.has(x))); // {3,4}
const difference = new Set([...a].filter(x => !b.has(x)));  // {1,2}

// ──── WeakMap & WeakSet ────
// Keys must be objects. Entries are garbage-collected when key object
// has no other references. Used for: caching, private data storage.
const cache = new WeakMap();
function processUser(user) {
    if (cache.has(user)) return cache.get(user);
    const result = /* expensive computation */;
    cache.set(user, result);
    return result;
}
// When `user` object is garbage collected, cache entry is too.
```

---

## 5. Proxy & Reflect — Meta-programming

```javascript
// PROXY: Intercept and customize fundamental operations on objects.

const handler = {
  get(target, prop) {
    console.log(`Accessing ${prop}`);
    return prop in target ? target[prop] : `Property ${prop} doesn't exist`;
  },
  set(target, prop, value) {
    if (prop === "age" && typeof value !== "number") {
      throw new TypeError("Age must be a number");
    }
    target[prop] = value;
    return true;
  },
};

const user = new Proxy({}, handler);
user.name = "Harsha";
user.age = 24; // OK
// user.age = "old"; // TypeError: Age must be a number

// REAL-WORLD USES:
// • Vue.js reactivity system (Vue 3 uses Proxy)
// • Validation (like above)
// • Auto-creating nested objects
// • Logging/debugging
// • API clients (dynamic method names)

// EXAMPLE: Auto-vivification (auto-create nested objects)
function createDeep() {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (!(prop in target)) target[prop] = createDeep();
        return target[prop];
      },
    },
  );
}
const config = createDeep();
config.database.host.primary = "localhost"; // No errors! Auto-creates path.
```

---

## 6. ES2020-2024 Features

```javascript
// ── ES2020 ──
// Optional Chaining & Nullish Coalescing (covered in Ch1)
const city = user?.address?.city ?? "Unknown";

// BigInt
const huge = 9007199254740992n; // n suffix
typeof huge; // "bigint"

// Promise.allSettled (covered in Ch4)
// globalThis (universal global: window/global/self)
console.log(globalThis); // Works everywhere

// ── ES2021 ──
// Logical assignment
a ||= b; // a = a || b (assign if falsy)
a &&= b; // a = a && b (assign if truthy)
a ??= b; // a = a ?? b (assign if nullish)

// Numeric separators
const billion = 1_000_000_000; // Easier to read!
const hex = 0xff_ff_ff;

// String replaceAll
"hello-world-foo".replaceAll("-", " "); // "hello world foo"

// ── ES2022 ──
// Class fields & private methods
class User {
  name; // Public field
  #password; // Private field

  constructor(name, pass) {
    this.name = name;
    this.#password = pass;
  }

  #hash(str) {
    // Private method
    return str.split("").reverse().join("");
  }

  static #count = 0; // Private static
  static getCount() {
    return User.#count;
  }
}

// Top-level await (in modules)
const data = await fetch("/api/data").then((r) => r.json());
// No need to wrap in async function!

// Array .at() (negative indexing)
const arr = [1, 2, 3, 4, 5];
arr.at(0); // 1
arr.at(-1); // 5 (last element!)
arr.at(-2); // 4

// Object.hasOwn() (replaces hasOwnProperty)
Object.hasOwn(obj, "name"); // true — safer than obj.hasOwnProperty

// Error .cause
throw new Error("DB failed", { cause: originalError });

// ── ES2023 ──
// Array findLast / findLastIndex
const nums = [1, 2, 3, 4, 5, 4, 3];
nums.findLast((n) => n > 3); // 4 (last one > 3)
nums.findLastIndex((n) => n > 3); // 5

// Array immutable methods — return NEW array, don't mutate:
const sorted = arr.toSorted(); // vs sort() which mutates
const reversed = arr.toReversed(); // vs reverse() which mutates
const spliced = arr.toSpliced(1, 1); // vs splice() which mutates
const changed = arr.with(2, 99); // Replace index 2 with 99

// ── ES2024 ──
// Map.groupBy
const people = [
  { name: "A", age: 20 },
  { name: "B", age: 30 },
  { name: "C", age: 20 },
  { name: "D", age: 30 },
];
const grouped = Map.groupBy(people, (p) => p.age);
// Map { 20 → [{A,20},{C,20}], 30 → [{B,30},{D,30}] }

// Promise.withResolvers
const { promise, resolve, reject } = Promise.withResolvers();
// No need for: new Promise((res, rej) => { resolve = res; reject = rej; })
```

---

## 7. Iterators & Generators (Deep Dive)

```javascript
// ITERABLE PROTOCOL: Object implements [Symbol.iterator]()
// ITERATOR PROTOCOL: Object has next() returning { value, done }

// Make any object iterable:
class Fibonacci {
  constructor(limit) {
    this.limit = limit;
  }

  [Symbol.iterator]() {
    let [prev, curr] = [0, 1];
    let count = 0;
    const limit = this.limit;

    return {
      next() {
        if (count >= limit) return { done: true };
        count++;
        [prev, curr] = [curr, prev + curr];
        return { value: prev, done: false };
      },
    };
  }
}

const fib = new Fibonacci(8);
[...fib]; // [1, 1, 2, 3, 5, 8, 13, 21]

for (const n of fib) {
  console.log(n); // 1, 1, 2, 3, 5, 8, 13, 21
}

// GENERATOR (simpler syntax for iterators):
function* fibonacci(limit) {
  let [prev, curr] = [0, 1];
  for (let i = 0; i < limit; i++) {
    [prev, curr] = [curr, prev + curr];
    yield prev; // Pause and return value
  }
}
[...fibonacci(8)]; // [1, 1, 2, 3, 5, 8, 13, 21]

// GENERATOR as infinite stream:
function* naturalNumbers() {
  let n = 1;
  while (true) yield n++;
}

// Take first 5:
function take(gen, n) {
  const result = [];
  for (const val of gen) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}
take(naturalNumbers(), 5); // [1, 2, 3, 4, 5]

// ASYNC GENERATORS — combine generators + async/await:
async function* fetchPages(url) {
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();
    if (data.length === 0) return; // No more pages
    yield data;
    page++;
  }
}

// Consume with for await...of:
for await (const pageData of fetchPages("/api/users")) {
  console.log(`Got ${pageData.length} users`);
  // Process each page as it arrives — no need to wait for ALL pages!
}

// GENERATOR DELEGATION (yield*):
function* letters() {
  yield* "abc";
} // yields 'a', 'b', 'c'
function* numbers() {
  yield* [1, 2, 3];
} // yields 1, 2, 3
function* combined() {
  yield* letters();
  yield* numbers();
}
[...combined()]; // ['a', 'b', 'c', 1, 2, 3]
// yield* delegates to another iterable/generator
```

---

🔬 **Section Challenge — 7. Iterators & Generators (Deep Dive)**

**Challenge 1 (Reasoning):** A generator that yields 1,000,000 numbers — what's its memory footprint vs a list?

<details><summary>Answer</summary>

Generator: O(1) — stores only the current execution state (stack frame: local variables, instruction pointer). ~200-300 bytes total, regardless of N. List: O(N) — stores all 1M integer objects. 1M Python ints ≈ 28MB (small ints cached, but larger ints ~28 bytes each). Generators are essential for: large file processing (yield one line at a time), infinite sequences, streaming pipelines where you process and discard data.

</details>

## 7b. Symbols — The Hidden Language of JavaScript

_Content enriched from Educative "Front End Developer" — Symbols & Well-Known Symbols_

```javascript
// SYMBOL: A unique, immutable primitive. Never collides with anything.
const s1 = Symbol("description");
const s2 = Symbol("description");
s1 === s2; // false! Each Symbol() call creates a UNIQUE value.

// WHY: Create property keys that can't be accidentally overwritten.
const id = Symbol("id");
const user = { name: "Harsha", [id]: 42 };
user[id]; // 42
user.id; // undefined — Symbol('id') ≠ string "id"

// Symbol properties are HIDDEN from normal iteration:
Object.keys(user); // ["name"] — no Symbol!
JSON.stringify(user); // '{"name":"Harsha"}' — no Symbol!
Object.getOwnPropertySymbols(user); // [Symbol(id)] — explicit access only

// WELL-KNOWN SYMBOLS — JavaScript's internal protocols:

// Symbol.iterator — makes objects iterable (for...of)
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { done: true };
      },
    };
  }
}
[...new Range(1, 5)]; // [1, 2, 3, 4, 5]

// Symbol.toPrimitive — control type coercion
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.amount;
    if (hint === "string") return `${this.amount} ${this.currency}`;
    return this.amount; // default
  }
}
const price = new Money(42, "USD");
+price; // 42 (number hint)
`${price}`; // "42 USD" (string hint)
price + 10; // 52 (default hint)

// Symbol.hasInstance — customize instanceof behavior
// Symbol.species — control constructor used for derived objects
// Symbol.asyncIterator — for await...of support
```

---

## 7c. WeakRef & FinalizationRegistry — Memory Management

_Content enriched from Educative "Front End Developer" — Memory Management_

```javascript
// WEAKREF: A reference that does NOT prevent garbage collection.
// Regular reference: keeps object alive as long as reference exists.
// WeakRef: object CAN be garbage collected even while WeakRef exists.

let expensiveObject = { data: new Array(1_000_000).fill("x") };
const weakRef = new WeakRef(expensiveObject);

// Access the object (might be garbage collected!)
const obj = weakRef.deref();
if (obj) {
  console.log("Object still alive:", obj.data.length);
} else {
  console.log("Object was garbage collected");
}

// Set original reference to null → now GC CAN collect it
expensiveObject = null;
// weakRef.deref() will eventually return undefined

// REAL-WORLD USE: cache that auto-cleans itself
class WeakCache {
  #cache = new Map();

  get(key) {
    const ref = this.#cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (!value) this.#cache.delete(key); // clean up dead entry
    return value;
  }

  set(key, value) {
    this.#cache.set(key, new WeakRef(value));
  }
}

// FINALIZATION REGISTRY: callback when object is garbage collected
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object with key "${heldValue}" was garbage collected`);
  // Clean up associated resources (close file handle, unsubscribe, etc.)
});

let resource = { connection: "db://prod" };
registry.register(resource, "db-connection"); // Register for cleanup
resource = null; // Eventually: "Object with key "db-connection" was GC'd"
```

---

## 7d. Advanced Proxy Patterns

_Content enriched from Educative "Front End Developer" — Reactive Systems_

```javascript
// REACTIVE STATE (Vue 3 simplified):
function reactive(target) {
  const subscribers = new Map(); // property → Set of callbacks

  return new Proxy(target, {
    get(obj, prop) {
      // Track which properties are READ (for dependency tracking)
      return obj[prop];
    },
    set(obj, prop, value) {
      obj[prop] = value;
      // Notify subscribers of this property
      if (subscribers.has(prop)) {
        subscribers.get(prop).forEach((fn) => fn());
      }
      return true;
    },
  });
}

// API CLIENT with dynamic methods:
const api = new Proxy(
  {},
  {
    get(target, method) {
      return async (params) => {
        const response = await fetch(`/api/${method}`, {
          method: "POST",
          body: JSON.stringify(params),
        });
        return response.json();
      };
    },
  },
);

// Usage: api.users({ limit: 10 }) → POST /api/users
// Usage: api.products({ category: "electronics" }) → POST /api/products
// Any method name works — Proxy generates the handler dynamically!

// VALIDATION PROXY:
function createValidated(rules) {
  return new Proxy(
    {},
    {
      set(target, prop, value) {
        const rule = rules[prop];
        if (rule && !rule.validate(value)) {
          throw new TypeError(`Invalid value for ${prop}: ${rule.message}`);
        }
        target[prop] = value;
        return true;
      },
    },
  );
}

const form = createValidated({
  email: { validate: (v) => v.includes("@"), message: "Must be valid email" },
  age: { validate: (v) => v >= 0 && v <= 150, message: "Must be 0-150" },
});

form.email = "user@test.com"; // OK
// form.age = -5;             // TypeError: Must be 0-150
```

---

## 8. Feature Timeline — Quick Reference

```
YEAR  │ KEY FEATURES
──────┼──────────────────────────────────────────────────────
ES6   │ let/const, arrow fn, class, template lit, destructure,
2015  │ modules, Promise, Map/Set, Symbol, generators, for..of
──────┼──────────────────────────────────────────────────────
ES7   │ Array.includes(), ** (exponent)
2016  │
──────┼──────────────────────────────────────────────────────
ES8   │ async/await, Object.entries/values, string padding
2017  │
──────┼──────────────────────────────────────────────────────
ES9   │ rest/spread for objects, for await...of, finally
2018  │
──────┼──────────────────────────────────────────────────────
ES10  │ flat/flatMap, Object.fromEntries, trimStart/End
2019  │ optional catch, Array.sort stability
──────┼──────────────────────────────────────────────────────
ES11  │ ?., ??, BigInt, Promise.allSettled, globalThis,
2020  │ matchAll, dynamic import
──────┼──────────────────────────────────────────────────────
ES12  │ ||=, &&=, ??=, replaceAll, numeric separators,
2021  │ Promise.any, WeakRef, FinalizationRegistry
──────┼──────────────────────────────────────────────────────
ES13  │ class fields, #private, .at(), Object.hasOwn,
2022  │ top-level await, Error.cause, structuredClone
──────┼──────────────────────────────────────────────────────
ES14  │ findLast, toSorted/toReversed/toSpliced/with,
2023  │ #! hashbang, WeakMap symbol keys
──────┼──────────────────────────────────────────────────────
ES15  │ Map.groupBy, Promise.withResolvers, well-formed
2024  │ Unicode strings, Atomics.waitAsync, RegExp v flag
```

---

## Interview Quick-Fire

```
Q: What is tree-shaking?
→ Dead code elimination by bundlers. Only possible with ESM because
  imports are static and can be analyzed at build time.

Q: Difference between Map and Object?
→ Map: any key type, ordered, has .size, better for frequent add/delete.
  Object: string/symbol keys, faster for fixed shape, JSON-friendly.

Q: What is a Symbol?
→ A unique, immutable identifier. Even Symbol("x") !== Symbol("x").
  Used for non-colliding property keys and internal protocols
  (Symbol.iterator, Symbol.toPrimitive).

Q: Explain ES6 modules.
→ import/export syntax. Each file has its own scope. Supports named
  and default exports. Static analysis enables tree-shaking.
  Loaded asynchronously. Standard in browsers and Node.

Q: What is the Proxy object?
→ Intercepts operations (get, set, delete, etc.) on objects.
  Used for validation, reactivity (Vue), logging, dynamic APIs.
```

---

## V8 Engine Internals — How JavaScript ACTUALLY Runs

```
WHAT IS V8?
  V8 is Google's open-source JavaScript engine — used in Chrome and Node.js.
  It takes your JavaScript text and executes it as machine code.

  SpiderMonkey (Firefox), JavaScriptCore (Safari) work similarly.
  Understanding V8 = understanding how JS performs at CPU level.

THE PIPELINE (Source code → Machine Code):
  Your JS text
      ↓
  PARSER: Read text → Abstract Syntax Tree (AST)
      [const x = 1 + 2] → {AssignDecl: {id:"x", init:{BinaryExpr:"+", 1, 2}}}
      ↓
  IGNITION (Bytecode Interpreter):
      Fast startup: convert AST → compact bytecode
      Start executing bytecode immediately
      → No JIT compilation overhead for code that runs once
      ↓
  PROFILER: Which functions run HOT (frequently)?
      → Mark "hot" functions for optimization
      ↓
  TURBOFAN (Optimizing JIT Compiler):
      Recompile hot functions → native machine code (x86-64, ARM)
      Speculative optimization based on observed types
      → MUCH faster than bytecode execution
      ↓
  MACHINE CODE EXECUTION
      If speculative optimization is WRONG (deoptimize!) → back to bytecode
```

### Hidden Classes — Why `obj.x = 1` After Creation Hurts

```
PROBLEM TO SOLVE:
  JavaScript objects are dynamic — you can add properties anytime.
  How does V8 access properties efficiently without a dictionary lookup?

  C++/Java: struct layout known at compile time → direct memory offset
  JS:       properties added dynamically → can't know layout advance

V8's HIDDEN CLASS (Shape) SOLUTION:
  Every JS object has an internal "hidden class" (Shape/Map).
  When you create { x: 1 }, V8 creates hidden class H0: {x: +0 offset}.
  When you add .y, V8 creates NEW hidden class H1: {x: +0, y: +8 offset}.
  Objects with same properties in same ORDER share the same hidden class.

  Properties become DIRECT MEMORY OFFSETS — fast as C++!

SHARING HIDDEN CLASSES — The Fast Path:
  const a = { x: 1, y: 2 };     // H0 → H1 → H2 (same path)
  const b = { x: 3, y: 4 };     // reuses H2 (same shape!)

  V8 knows: "all H2 objects have x at offset 0, y at offset 8."
  Property access: obj.x → read memory at (obj_addr + 0). One instruction!

BREAKING HIDDEN CLASSES — The Slow Path:
  const a = { x: 1, y: 2 };   // H2 → x@0, y@8
  const b = { y: 2, x: 1 };   // DIFFERENT order → different hidden class H3!

  a.z = 3;                     // new hidden class transition every time
  delete a.x;                  // make a an "hole" dictionary object → SLOW!

RULE: Add ALL properties in constructor/initializer. Same order every time.
  // ❌ SLOW: adding properties dynamically
  const obj = {};
  if (condition) obj.x = 1;
  obj.y = 2;

  // ✅ FAST: all properties known upfront
  const obj = { x: condition ? 1 : undefined, y: 2 };
```

```javascript
// INLINE CACHES — V8's property access optimization

// V8 tracks what hidden class objects have at each call site.
// After seeing the same hidden class a few times, it "inlines" the
// property offset directly — no lookup at all!

function getX(obj) {
  return obj.x; // V8 starts monomorphic: only seen H2 objects
  // After optimization: "this is always H2, x is at offset 0"
  // Generated machine code: MOV rax, [obj + 0]  ← 1 ns
}

// POLYMORPHIC (multiple hidden classes) — slower:
getX({ x: 1 }); // H2 hidden class
getX({ x: 2, y: 3 }); // H3 hidden class (different!)
// Now V8 must check which class it is — still fast, but more work

// MEGAMORPHIC (>4 different hidden classes) — slowest:
// V8 gives up and uses a general dictionary lookup each time.
// This is why code that works with random object shapes is slow.

// PRACTICAL APPLICATION:
class Point {
  constructor(x, y) {
    this.x = x; // ✅ Always same order in constructor
    this.y = y; // → All Point instances share same hidden class
  }
}
// All instances are monomorphic → V8 generates ultra-fast code!
```

### The Event Loop — The Heart of Async JavaScript

```
ANALOGY: A restaurant kitchen.
  Head Chef (Call Stack): executes one task at a time.
  Kitchen staff (Web APIs): handle background work (fetch, timers) separately.
  Order tickets (Callback Queue): completed tasks waiting for the chef.
  Manager (Event Loop): "Is the chef free? Next order!"
  VIP orders (Microtask Queue): must be served BEFORE regular orders.

THE COMPONENTS:

  CALL STACK:
  Stack of currently executing function calls.
  Synchronous. Single-threaded. LIFO (Last In First Out).
  Call function → push frame. Return → pop frame.
  When stack is empty → Event Loop checks queues.

  WEB APIs (Browser) / libuv (Node.js):
  Handles: setTimeout, fetch, DOM events, setInterval, I/O.
  These run in SEPARATE THREADS (C++ threads in V8).
  When done → push callback to the appropriate queue.

  CALLBACK QUEUE (Task Queue / Macrotask Queue):
  Holds: setTimeout callbacks, setInterval callbacks, I/O callbacks.
  Event loop takes ONE task, adds to call stack, runs to completion.

  MICROTASK QUEUE:
  Holds: Promise .then()/.catch() callbacks, queueMicrotask(), MutationObserver.
  Runs to COMPLETION before ANY macrotask!
  After every call stack empty → drain entire microtask queue first.

THE PRIORITY ORDER (critical for interviews):
  1. Execute synchronous code (Call Stack)
  2. Drain Microtask Queue completely
  3. Take ONE macrotask (setTimeout, setInterval, I/O)
  4. Drain Microtask Queue again (even if new ones were added in step 3!)
  5. Render (browser only — about every 16.67ms for 60fps)
  6. Go to step 3

WHY MICROTASKS FIRST?
  Promises are designed to be "consistent" — a resolved promise
  always notifies handlers before any other asynchronous events.
  This prevents Promises from being interrupted by unrelated timers.
```

```javascript
// COMPLETE EVENT LOOP WALKTHROUGH — trace through line by line

console.log("1. Script start"); // (sync) → logs immediately

setTimeout(() => console.log("2. setTimeout"), 0); // (macrotask) → timer queue

Promise.resolve()
  .then(() => console.log("3. Promise.then")) // (microtask)
  .then(() => console.log("4. Promise.then 2")); // (microtask, chained)

queueMicrotask(() => console.log("5. queueMicrotask")); // (microtask)

console.log("6. Script end"); // (sync) → logs immediately

// OUTPUT (in order):
// 1. Script start          ← sync
// 6. Script end            ← sync
// 3. Promise.then          ← microtask queue drain
// 5. queueMicrotask        ← microtask queue (continues draining)
// 4. Promise.then 2        ← chained microtask (added during drain, still runs!)
// 2. setTimeout            ← macrotask (only after ALL microtasks done)

// ── ASYNC/AWAIT IS SYNTAX SUGAR OVER PROMISES ──
async function fetchUser() {
  const response = await fetch("/api/user"); // suspends here
  const data = await response.json();
  return data;
}

// EXACT EQUIVALENT without async/await:
function fetchUserEquivalent() {
  return fetch("/api/user") // returns Promise
    .then((response) => response.json()) // .then is the "await"
    .then((data) => data); // final value
}

// V8 transforms async/await into a state machine (generator-like):
// Each `await` = ".then(function resumeHere() { ...rest of async fn })"
// The function is SUSPENDED at each await → added to microtask queue
// → Call stack is FREE → event loop can handle other work

// PRACTICAL CONSEQUENCE:
async function example() {
  console.log("a"); // sync, runs immediately
  await Promise.resolve("b"); // suspends! "b" handler goes to microtask queue
  console.log("c"); // runs after microtask resumes
}

example();
console.log("d");

// Output: a d c
// 'a' runs sync. await suspends example(). 'd' runs (sync continues).
// Microtask queue: resume example → 'c' logs.
```

### Memory Management — Garbage Collection

```
ANALOGY: A city's waste management system.

  NEW OBJECTS: Born in the "New City" (Young Generation) — small area.
  If they survive → move to "Old City" (Old Generation) — large area.
  Garbage truck (GC) visits "New City" VERY FREQUENTLY (it's small, quick sweep).
  Visits "Old City" infrequently (large, expensive to clean).

V8 GENERATIONAL GARBAGE COLLECTION:

  YOUNG GENERATION (Scavenger GC — very fast):
  Small (~1-8MB). Fast minor GC via "Cheney's algorithm".
  Most objects are short-lived (created, used, discarded).
  Scan only young gen. Copy survivors to "old" space.
  Runs: milliseconds. Frequency: very often.

  OLD GENERATION (Mark-and-Sweep — full GC):
  Large (hundreds of MB). Infrequent but expensive.

  MARK PHASE:
  Start from "roots" (global, stack, registers).
  Traverse all reachable objects (depth-first graph traversal).
  MARK each reachable object as "alive."

  SWEEP PHASE:
  Walk all memory. Everything NOT marked = garbage.
  Add to free-list. (Or compact → defragment.)

  INCREMENTAL MARKING (V8's optimization):
  Full mark takes too long → GC pause → janky UI.
  Solution: do marking in SMALL INCREMENTS between tasks.
  JavaScript runs, then brief marking pause, JS runs, brief marking...
  Total mark time spreads over many frames → smooth!

COMMON MEMORY LEAKS IN JS:
  1. Forgotten event listeners:
     element.addEventListener('click', handler);
     element.remove();  // element gone, but handler still in listener list!
     Fix: removeEventListener BEFORE removing element.

  2. Global variables:
     function leak() { data = largeArray; }  // no let/const → global!
     Fix: always use let/const/var.

  3. Closures holding large scope:
     function createClosure() {
       const huge = new Array(1000000).fill(0);
       return () => huge[0];  // closure captures entire `huge`!
     }
     Fix: capture only what you need (const first = huge[0]).

  4. Detached DOM nodes:
     const btn = document.querySelector('#btn');
     btn.remove();  // removed from DOM
     cache.set('btn', btn);  // but still referenced → never GC'd!
     Fix: null out references when you're done.
```

---

[← Previous: DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md) | [Index](../00_MASTER_INDEX.md) | [Next → Error Handling & Debugging](07_JS_Error_Handling_Debugging.md)

---
