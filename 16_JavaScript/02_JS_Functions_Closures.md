> **JavaScript Chapter 2/7** | [← Previous: Foundations](01_JS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next → Objects & Prototypes](03_JS_Objects_Prototypes.md)

# Functions & Closures — The Heart of JavaScript

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: Functions are FIRST-CLASS citizens in JS. They can be         ║
║        stored in variables, passed as arguments, returned from       ║
║        other functions. Closures emerge from this + lexical scope.   ║
║                                                                      ║
║  WHY:  Closures power React hooks, event handlers, callbacks,        ║
║        module patterns, currying, memoization — everything.          ║
║        "If you understand closures, you understand JS."              ║
║                                                                      ║
║  WHO:  Every JS developer. Every React developer (useState IS        ║
║        a closure). Every Node developer (callbacks are closures).    ║
║                                                                      ║
║  WHEN: After understanding scope (Chapter 1).                        ║
║                                                                      ║
║  HOW:  Functions create scope → inner functions remember outer       ║
║        scope → that's a closure. It's that simple (and profound).    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. Function Declarations vs Expressions

```javascript
// DECLARATION: Hoisted FULLY. Can call before the line.
greet("Harsha"); // ✅ Works!
function greet(name) {
    return `Hello ${name}`;
}

// EXPRESSION: Variable is hoisted, but value is NOT.
sayHi("Harsha"); // ❌ TypeError: sayHi is not a function
const sayHi = function(name) {
    return `Hi ${name}`;
};

// ARROW FUNCTION (ES6): Shorter syntax + lexical `this`
const add = (a, b) => a + b;
const square = x => x * x;           // Single param: no parens needed
const getUser = () => ({ name: "H" }); // Return object: wrap in ()

// NAMED FUNCTION EXPRESSION: For recursion & stack traces
const factorial = function fact(n) {
    return n <= 1 ? 1 : n * fact(n - 1); // fact is only visible inside
};
```

```
WHEN TO USE WHICH:
┌──────────────────┬───────────────────────────────────────┐
│ Type             │ Best For                              │
├──────────────────┼───────────────────────────────────────┤
│ Declaration      │ Main functions, utility functions     │
│ Arrow (const)    │ Callbacks, array methods, short fns   │
│ Expression       │ Conditional function assignment       │
└──────────────────┴───────────────────────────────────────┘

REASONING: Arrow functions are shorter but can't be used as
constructors and don't have their own `this`. Declarations are
hoisted, which some teams consider cleaner for readability.
```

---

## 2. Parameters — Default, Rest, Destructuring

```javascript
// DEFAULT PARAMETERS (ES6)
function createUser(name, role = "viewer", active = true) {
    return { name, role, active };
}
createUser("Harsha");                    // { name: "Harsha", role: "viewer", active: true }
createUser("Harsha", "admin");           // { name: "Harsha", role: "admin", active: true }
createUser("Harsha", undefined, false);  // { name: "Harsha", role: "viewer", active: false }
// undefined triggers default. null does NOT.

// REST PARAMETERS (...)
function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4); // 10

// DESTRUCTURED PARAMETERS (great for config objects)
function createComponent({ tag = "div", className = "", children = [] }) {
    // Now you have tag, className, children as local variables
    return `<${tag} class="${className}">${children.join("")}</${tag}>`;
}
createComponent({ tag: "h1", className: "title", children: ["Hello"] });
// <h1 class="title">Hello</h1>

// WHY destructured params?
// 1. Named parameters → order doesn't matter
// 2. Self-documenting → you see what the function expects
// 3. Defaults built in → clean fallback behavior
```

---

## 3. `this` Keyword — The Most Confusing Part of JS

### 5W1H: WHY is `this` confusing?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: `this` refers to the OBJECT that is executing the current     ║
║        function. But WHICH object depends on HOW the function is     ║
║        called, not where it's written.                               ║
║                                                                      ║
║  WHY confusing: In Java, `this` always refers to the instance.       ║
║  In JS, `this` changes based on CALL SITE — 4 rules + arrow.         ║
║                                                                      ║
║  ANALOGY: `this` is like the word "I" in English. When YOU say       ║
║  "I", it refers to you. When I say "I", it refers to me.             ║
║  The meaning depends on WHO IS SPEAKING (who called the function).   ║
╚══════════════════════════════════════════════════════════════════════╝
```

### The 5 Rules of `this` (in priority order)

```javascript
// RULE 1: new binding (highest priority)
function Person(name) {
    this.name = name; // `this` = newly created object
}
const p = new Person("Harsha"); // this → {}

// RULE 2: explicit binding (call, apply, bind)
function greet() {
    console.log(`Hello, ${this.name}`);
}
const user = { name: "Harsha" };
greet.call(user);   // "Hello, Harsha" — this = user
greet.apply(user);  // Same, but args as array: greet.apply(user, [arg1, arg2])
const bound = greet.bind(user); // Returns NEW function with this locked to user
bound(); // "Hello, Harsha"

// RULE 3: implicit binding (object method)
const obj = {
    name: "Harsha",
    greet() {
        console.log(this.name); // this = obj (the object BEFORE the dot)
    }
};
obj.greet(); // "Harsha"

// ⚠️ BUT: Method extraction LOSES binding!
const fn = obj.greet;
fn(); // undefined — `this` is now global/undefined (no dot!)

// RULE 4: default binding (lowest priority)
function standalone() {
    console.log(this); // window (browser) or global (Node)
}
standalone(); // In strict mode: undefined

// RULE 5: Arrow functions — NO own `this`
const obj2 = {
    name: "Harsha",
    greet: () => {
        console.log(this.name); // ❌ `this` is NOT obj2!
        // Arrow inherits `this` from enclosing LEXICAL scope.
    },
    greetCorrect() {
        const inner = () => {
            console.log(this.name); // ✅ "Harsha" — inherits from greetCorrect
        };
        inner();
    }
};
```

```
`this` DETERMINATION FLOWCHART:

Is it an ARROW function?
├── YES → `this` = enclosing lexical scope's `this`
└── NO ↓

Called with NEW keyword?
├── YES → `this` = newly created object
└── NO ↓

Called with call/apply/bind?
├── YES → `this` = specified object
└── NO ↓

Called as object.method()?
├── YES → `this` = object before the dot
└── NO ↓

Default: `this` = window (or undefined in strict mode)
```

---

## 4. Closures — The Most Important Concept

### 5W1H: WHAT is a Closure?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A closure is a function that REMEMBERS the variables from     ║
║        its outer (enclosing) scope even AFTER the outer function     ║
║        has returned.                                                 ║
║                                                                      ║
║  WHY:  Closures enable data privacy, factory functions, partial      ║
║        application, memoization, and React hooks (useState).         ║
║                                                                      ║
║  HOW:  When a function is created, it captures a reference to its    ║
║        surrounding scope (not a copy). This reference persists       ║
║        even after the outer function finishes executing.             ║
║                                                                      ║
║  ANALOGY: A closure is like a backpack. When a function is born      ║
║  inside another function, it packs the outer function's variables    ║
║  into its backpack. Even after leaving the outer function (the       ║
║  house), the inner function still carries those variables.           ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// SIMPLEST CLOSURE EXAMPLE:
function outer() {
    let count = 0;           // Variable in outer scope

    function inner() {
        count++;             // inner "closes over" count
        console.log(count);
    }

    return inner;            // Return the function (not its result)
}

const counter = outer();     // outer() finishes executing
counter(); // 1 — BUT count is still alive!
counter(); // 2 — count persists between calls!
counter(); // 3

// WHY does count persist?
// When inner was created, it captured a REFERENCE to count.
// Even though outer() finished, inner still holds that reference.
// JS garbage collector sees it's still referenced → keeps it alive.
```

```
CLOSURE MEMORY VISUALIZATION:

After outer() returns:

┌─ counter variable ─────────────────────────────────────┐
│  Points to inner function                              │
│  inner function carries a "backpack":                  │
│  ┌─── Closure Scope ──────────────────┐                │
│  │  count: 0 → 1 → 2 → 3 (persists!) │                 │
│  └────────────────────────────────────┘                │
└────────────────────────────────────────────────────────┘

outer()'s execution context is gone, but the closure keeps
count alive because inner still references it.
```

### Closure Use Cases

```javascript
// USE CASE 1: DATA PRIVACY (Module Pattern)
function createBankAccount(initialBalance) {
    let balance = initialBalance; // PRIVATE — no outside access

    return {
        deposit(amount) {
            balance += amount;
            return balance;
        },
        withdraw(amount) {
            if (amount > balance) throw new Error("Insufficient funds");
            balance -= amount;
            return balance;
        },
        getBalance() {
            return balance; // Only way to READ balance
        }
    };
}

const account = createBankAccount(1000);
account.deposit(500);    // 1500
account.withdraw(200);   // 1300
account.getBalance();    // 1300
// account.balance → undefined! It's private.

// REASONING: balance is in the closure scope.
// Only the returned methods can access it.
// This is ENCAPSULATION without classes!


// USE CASE 2: FUNCTION FACTORY
function createMultiplier(multiplier) {
    return function(number) {
        return number * multiplier; // closes over `multiplier`
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
double(5); // 10
triple(5); // 15
// Each returned function has its OWN closure with its OWN multiplier.


// USE CASE 3: MEMOIZATION (Caching)
function memoize(fn) {
    const cache = {}; // Closure stores the cache

    return function(...args) {
        const key = JSON.stringify(args);
        if (cache[key] !== undefined) {
            console.log("Cache hit!");
            return cache[key];
        }
        const result = fn(...args);
        cache[key] = result;
        return result;
    };
}

const expensiveAdd = memoize((a, b) => {
    console.log("Computing...");
    return a + b;
});
expensiveAdd(1, 2); // "Computing..." → 3
expensiveAdd(1, 2); // "Cache hit!" → 3 (no recomputation)


// USE CASE 4: REACT'S useState (simplified)
function useState(initialValue) {
    let state = initialValue; // Closure!

    function getState() {
        return state;
    }

    function setState(newValue) {
        state = newValue;
        // In real React: triggers re-render
    }

    return [getState, setState];
}

const [getName, setName] = useState("Harsha");
getName();          // "Harsha"
setName("Updated");
getName();          // "Updated"
```

### The Classic Closure Bug (Interview Favorite)

```javascript
// THE BUG:
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 — NOT 0, 1, 2!

// WHY? var is function-scoped, so there's ONE `i` variable.
// By the time setTimeout fires (100ms later), the loop has finished.
// All three functions share the SAME i, which is now 3.

// FIX 1: Use let (creates new variable per iteration)
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 ✅ — let creates a new `i` for each iteration

// FIX 2: IIFE (old way, before let existed)
for (var i = 0; i < 3; i++) {
    (function(j) {
        setTimeout(() => console.log(j), 100);
    })(i); // Pass current i into IIFE as j → each closure has its own j
}
// Output: 0, 1, 2 ✅
```

---

## 5. Higher-Order Functions

### 5W1H: WHAT are Higher-Order Functions?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A function that takes another function as argument OR         ║
║        returns a function.                                           ║
║  WHY:  Enables composition, abstraction, and declarative code.       ║
║  WHO:  Used everywhere: Array methods, event handlers, Express       ║
║        middleware, React components.                                 ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// Array higher-order methods (the most important ones):

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map: Transform each element → new array
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter: Keep elements that pass a test → new array
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6, 8, 10]

// reduce: Accumulate into a single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
// 55

// find: Return FIRST element that passes test
const firstBig = numbers.find(n => n > 5);
// 6

// some: Does ANY element pass?
numbers.some(n => n > 5);  // true

// every: Do ALL elements pass?
numbers.every(n => n > 0); // true

// forEach: Side effects only (no return value)
numbers.forEach(n => console.log(n));

// CHAINING — the power of functional style:
const result = numbers
    .filter(n => n % 2 === 0)    // [2, 4, 6, 8, 10]
    .map(n => n * 3)             // [6, 12, 18, 24, 30]
    .reduce((acc, n) => acc + n, 0); // 90

// REASONING: Each method returns a new array (immutable pattern).
// Chain them for readable, declarative data transformations.
// This is the foundation of React's JSX rendering pattern:
// data.filter(...).map(item => <Component {...item} />)
```

---

## 6. IIFE — Immediately Invoked Function Expression

```javascript
// WHAT: A function that runs immediately after creation.
// WHY:  Creates a private scope. Avoids polluting global namespace.
// WHEN: Less common now (we have modules), but appears in libraries.

(function() {
    const secret = "hidden";
    console.log("IIFE ran!"); // Runs immediately
})();

// REVEALING MODULE PATTERN (pre-ES6 modules)
const Calculator = (function() {
    let result = 0; // Private via closure

    return {
        add(n)    { result += n; return this; },
        subtract(n) { result -= n; return this; },
        getResult() { return result; }
    };
})();

Calculator.add(10).subtract(3).getResult(); // 7
```

---

## 7. Currying & Partial Application

```javascript
// CURRYING: Transform f(a, b, c) into f(a)(b)(c)

// Normal function:
function add(a, b) { return a + b; }

// Curried version:
function curriedAdd(a) {
    return function(b) {
        return a + b; // Closure over `a`
    };
}
const add5 = curriedAdd(5);
add5(3); // 8
add5(7); // 12

// Arrow syntax:
const multiply = a => b => a * b;
const double = multiply(2);
double(5); // 10

// REAL USE CASE: Event handlers in React
const handleInputChange = (fieldName) => (event) => {
    // fieldName is curried in
    setFormData(prev => ({
        ...prev,
        [fieldName]: event.target.value
    }));
};

// In JSX:
// <input onChange={handleInputChange("email")} />
// <input onChange={handleInputChange("password")} />

// GENERIC CURRY UTILITY:
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return function(...moreArgs) {
            return curried(...args, ...moreArgs);
        };
    };
}

const curriedSum = curry((a, b, c) => a + b + c);
curriedSum(1)(2)(3);     // 6
curriedSum(1, 2)(3);     // 6
curriedSum(1)(2, 3);     // 6
```

---

## 8. Composition & Pipe

```javascript
// COMPOSE: Right-to-left function application
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

// PIPE: Left-to-right function application (more readable)
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const trim = str => str.trim();
const toLower = str => str.toLowerCase();
const addExclaim = str => str + "!";

const processInput = pipe(trim, toLower, addExclaim);
processInput("  Hello World  "); // "hello world!"

// REASONING: Build complex operations from small, reusable pieces.
// Each function does ONE thing. Composition chains them.
// This is the mental model behind React component composition too.
```

---

## 9. Recursion (JS-Specific Notes)

```javascript
// JS has no tail-call optimization in practice (except Safari).
// So recursive functions CAN blow the stack. Be mindful of depth.

// Classic: Flatten nested array
function flatten(arr) {
    return arr.reduce((acc, item) =>
        acc.concat(Array.isArray(item) ? flatten(item) : item), []
    );
}
flatten([1, [2, [3, [4]]]]); // [1, 2, 3, 4]

// Modern alternative: arr.flat(Infinity)
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]

// Deep clone via recursion
function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    const clone = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
        }
    }
    return clone;
}
// Modern alternative: structuredClone(obj)
```

---

## Interview Quick-Fire

```
Q: What is a closure?
→ A function that remembers variables from its outer scope even
  after the outer function has returned.

Q: Give a practical use of closures.
→ Data privacy (module pattern), memoization, event handlers,
  React hooks (useState), factory functions.

Q: What does `this` refer to in an arrow function?
→ The `this` of the enclosing lexical scope. Arrow functions
  don't have their own `this`.

Q: What's the difference between call, apply, and bind?
→ call: invokes with `this` + individual args.
  apply: invokes with `this` + args as array.
  bind: returns new function with `this` locked (doesn't invoke).

Q: What's the output? for (var i=0; i<3; i++) setTimeout(() => console.log(i), 0);
→ 3, 3, 3 — because var is function-scoped, all closures share
  the same i. Fix: use let.

Q: What is currying?
→ Transforming f(a, b) into f(a)(b). Each call returns a new
  function until all args are received. Uses closures.

Q: What is a higher-order function?
→ A function that takes a function as argument or returns one.
  Examples: map, filter, reduce, addEventListener.
```

---

> [← Previous: Foundations](01_JS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next → Objects & Prototypes](03_JS_Objects_Prototypes.md)
