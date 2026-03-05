> **JavaScript Chapter 6/7** | [← Previous: DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md) | [Index](../00_MASTER_INDEX.md) | [Next → Error Handling & Debugging](07_JS_Error_Handling_Debugging.md)

# Modern ES6+ Features — The Complete Guide

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: ES6 (2015) was the biggest upgrade in JS history. Since    ║
║        then, yearly releases add new features. This chapter       ║
║        covers everything from ES6 through ES2024.                 ║
║                                                                    ║
║  WHY:  Modern JS is a DIFFERENT language from pre-2015 JS.       ║
║        React, Node, and all modern frameworks assume ES6+.        ║
║        Interview questions heavily test ES6+ understanding.       ║
║                                                                    ║
║  WHO:  Every JS developer writing code after 2015.               ║
║                                                                    ║
║  HOW:  We cover: template literals, destructuring (recap),        ║
║        modules, Map/Set, WeakRef, Proxy, iterators/generators,   ║
║        optional chaining, and newer additions through 2024.       ║
╚══════════════════════════════════════════════════════════════════════╝
```

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
    greet() { return "Hello!"; },  // Instead of greet: function() {}
};

// COMPUTED PROPERTY NAMES:
const field = "email";
const form = {
    [field]: "h@test.com",           // { email: "h@test.com" }
    [`${field}Valid`]: true,         // { emailValid: true }
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
║  WHAT: ES Modules let you split code into separate files and      ║
║        import/export between them.                                 ║
║                                                                    ║
║  WHY:  Before modules, all JS shared one global scope.           ║
║        → Variable collisions, dependency chaos, huge files.       ║
║        Modules give each file its own scope + explicit deps.      ║
║                                                                    ║
║  HOW:  Two module systems exist:                                  ║
║        • ES Modules (ESM): import/export — standard, browser+Node║
║        • CommonJS (CJS): require/module.exports — Node legacy     ║
║                                                                    ║
║  REASONING: React uses ESM. Node is moving to ESM. Learn ESM.   ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// ──── math.js (exporting) ────

// NAMED EXPORTS (can have many per file):
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }

// DEFAULT EXPORT (one per file — the "main" thing):
export default class Calculator {
    add(a, b) { return a + b; }
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
╔══════════════════════════════════════════════════════════════════════╗
║  ESM vs CommonJS:                                                  ║
║  ┌──────────────────┬──────────────────┬──────────────────┐        ║
║  │ Feature          │ ESM              │ CommonJS         │        ║
║  ├──────────────────┼──────────────────┼──────────────────┤        ║
║  │ Syntax           │ import/export    │ require/module.  │        ║
║  │                  │                  │ exports          │        ║
║  │ Loading          │ Async (parallel) │ Sync (blocking)  │        ║
║  │ Tree-shaking     │ Yes (static)     │ No (dynamic)     │        ║
║  │ Top-level await  │ Yes              │ No               │        ║
║  │ Browser support  │ Yes              │ No (needs bundler)│       ║
║  │ File extension   │ .mjs / .js       │ .cjs / .js       │        ║
║  │ Future           │ Standard         │ Legacy           │        ║
║  └──────────────────┴──────────────────┴──────────────────┘        ║
║                                                                    ║
║  TREE-SHAKING: ESM imports are STATIC (analyzed at compile time). ║
║  Bundlers (Webpack/Vite) can remove unused exports (dead code).   ║
║  CommonJS is dynamic — bundler can't know what's used.            ║
╚══════════════════════════════════════════════════════════════════════╝
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
    }
};

const user = new Proxy({}, handler);
user.name = "Harsha";
user.age = 24;       // OK
// user.age = "old"; // TypeError: Age must be a number

// REAL-WORLD USES:
// • Vue.js reactivity system (Vue 3 uses Proxy)
// • Validation (like above)
// • Auto-creating nested objects
// • Logging/debugging
// • API clients (dynamic method names)

// EXAMPLE: Auto-vivification (auto-create nested objects)
function createDeep() {
    return new Proxy({}, {
        get(target, prop) {
            if (!(prop in target)) target[prop] = createDeep();
            return target[prop];
        }
    });
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
a ||= b;    // a = a || b (assign if falsy)
a &&= b;    // a = a && b (assign if truthy)
a ??= b;    // a = a ?? b (assign if nullish)

// Numeric separators
const billion = 1_000_000_000; // Easier to read!
const hex = 0xFF_FF_FF;

// String replaceAll
"hello-world-foo".replaceAll("-", " "); // "hello world foo"

// ── ES2022 ──
// Class fields & private methods
class User {
    name;                    // Public field
    #password;               // Private field
    
    constructor(name, pass) {
        this.name = name;
        this.#password = pass;
    }
    
    #hash(str) {             // Private method
        return str.split("").reverse().join("");
    }
    
    static #count = 0;       // Private static
    static getCount() { return User.#count; }
}

// Top-level await (in modules)
const data = await fetch("/api/data").then(r => r.json());
// No need to wrap in async function!

// Array .at() (negative indexing)
const arr = [1, 2, 3, 4, 5];
arr.at(0);   // 1
arr.at(-1);  // 5 (last element!)
arr.at(-2);  // 4

// Object.hasOwn() (replaces hasOwnProperty)
Object.hasOwn(obj, "name"); // true — safer than obj.hasOwnProperty

// Error .cause
throw new Error("DB failed", { cause: originalError });

// ── ES2023 ──
// Array findLast / findLastIndex
const nums = [1, 2, 3, 4, 5, 4, 3];
nums.findLast(n => n > 3);      // 4 (last one > 3)
nums.findLastIndex(n => n > 3); // 5

// Array immutable methods — return NEW array, don't mutate:
const sorted = arr.toSorted();        // vs sort() which mutates
const reversed = arr.toReversed();    // vs reverse() which mutates
const spliced = arr.toSpliced(1, 1);  // vs splice() which mutates
const changed = arr.with(2, 99);      // Replace index 2 with 99

// ── ES2024 ──
// Map.groupBy
const people = [
    { name: "A", age: 20 }, { name: "B", age: 30 },
    { name: "C", age: 20 }, { name: "D", age: 30 }
];
const grouped = Map.groupBy(people, p => p.age);
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
    constructor(limit) { this.limit = limit; }
    
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
            }
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
        yield prev;  // Pause and return value
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
```

---

## 8. Feature Timeline — Quick Reference

```
╔══════════════════════════════════════════════════════════════════════╗
║  YEAR  │ KEY FEATURES                                             ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES6   │ let/const, arrow fn, class, template lit, destructure,  ║
║  2015  │ modules, Promise, Map/Set, Symbol, generators, for..of  ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES7   │ Array.includes(), ** (exponent)                         ║
║  2016  │                                                          ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES8   │ async/await, Object.entries/values, string padding      ║
║  2017  │                                                          ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES9   │ rest/spread for objects, for await...of, finally        ║
║  2018  │                                                          ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES10  │ flat/flatMap, Object.fromEntries, trimStart/End         ║
║  2019  │ optional catch, Array.sort stability                    ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES11  │ ?., ??, BigInt, Promise.allSettled, globalThis,         ║
║  2020  │ matchAll, dynamic import                                 ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES12  │ ||=, &&=, ??=, replaceAll, numeric separators,         ║
║  2021  │ Promise.any, WeakRef, FinalizationRegistry              ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES13  │ class fields, #private, .at(), Object.hasOwn,           ║
║  2022  │ top-level await, Error.cause, structuredClone           ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES14  │ findLast, toSorted/toReversed/toSpliced/with,          ║
║  2023  │ #! hashbang, WeakMap symbol keys                        ║
║  ──────┼──────────────────────────────────────────────────────     ║
║  ES15  │ Map.groupBy, Promise.withResolvers, well-formed         ║
║  2024  │ Unicode strings, Atomics.waitAsync, RegExp v flag       ║
╚══════════════════════════════════════════════════════════════════════╝
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

> [← Previous: DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md) | [Index](../00_MASTER_INDEX.md) | [Next → Error Handling & Debugging](07_JS_Error_Handling_Debugging.md)
