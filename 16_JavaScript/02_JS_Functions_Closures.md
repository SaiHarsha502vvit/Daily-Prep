**JavaScript Chapter 2/7** | [â† Previous: Foundations](01_JS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Objects & Prototypes](03_JS_Objects_Prototypes.md)

# Functions & Closures â€” The Heart of JavaScript

## 5W1H â€” Why This Chapter?


WHAT: Functions are FIRST-CLASS citizens in JS. They can be
stored in variables, passed as arguments, returned from
other functions. Closures emerge from this + lexical scope.

WHY:  Closures power React hooks, event handlers, callbacks,
module patterns, currying, memoization â€” everything.
"If you understand closures, you understand JS."

WHO:  Every JS developer. Every React developer (useState IS
a closure). Every Node developer (callbacks are closures).

WHEN: After understanding scope (Chapter 1).

HOW:  Functions create scope â†’ inner functions remember outer
scope â†’ that's a closure. It's that simple (and profound).


---

## 1. Function Declarations vs Expressions

```javascript
// DECLARATION: Hoisted FULLY. Can call before the line.
greet("Harsha"); // âœ… Works!
function greet(name) {
    return `Hello ${name}`;
}

// EXPRESSION: Variable is hoisted, but value is NOT.
sayHi("Harsha"); // âŒ TypeError: sayHi is not a function
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Type             â”‚ Best For                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Declaration      â”‚ Main functions, utility functions     â”‚
â”‚ Arrow (const)    â”‚ Callbacks, array methods, short fns   â”‚
â”‚ Expression       â”‚ Conditional function assignment       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

REASONING: Arrow functions are shorter but can't be used as
constructors and don't have their own `this`. Declarations are
hoisted, which some teams consider cleaner for readability.
```

**Flow:**
1. WHEN TO USE WHICH:
2. Type Best For
3. Declaration Main functions, utility functions
4. Arrow (const) Callbacks, array methods, short fns
5. Expression Conditional function assignment
6. REASONING: Arrow functions are shorter but can't be use hoisted, which some teams consider cleaner for readabil

```mermaid
flowchart TD
    N1["WHEN TO USE WHICH:"]
    N2["Type Best For"]
    N3["Declaration Main functions, utility functions"]
    N4["Arrow (const) Callbacks, array methods, short fns"]
    N5["Expression Conditional function assignment"]
    N6["REASONING: Arrow functions are shorter but can't be use"]
    N7["hoisted, which some teams consider cleaner for readabil"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
```

---



ðŸ”¬ **Section Challenge â€” 1. Function Declarations vs Expressions**
>
**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` â€” show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 2. Parameters â€” Default, Rest, Destructuring

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
// 1. Named parameters â†’ order doesn't matter
// 2. Self-documenting â†’ you see what the function expects
// 3. Defaults built in â†’ clean fallback behavior
```

---




## 3. `this` Keyword â€” The Most Confusing Part of JS

### 5W1H: WHY is `this` confusing?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: `this` refers to the OBJECT that is executing the current     â•‘
â•‘        function. But WHICH object depends on HOW the function is     â•‘
â•‘        called, not where it's written.                               â•‘
â•‘                                                                      â•‘
â•‘  WHY confusing: In Java, `this` always refers to the instance.       â•‘
â•‘  In JS, `this` changes based on CALL SITE â€” 4 rules + arrow.         â•‘
â•‘                                                                      â•‘
â•‘  ANALOGY: `this` is like the word "I" in English. When YOU say       â•‘
â•‘  "I", it refers to you. When I say "I", it refers to me.             â•‘
â•‘  The meaning depends on WHO IS SPEAKING (who called the function).   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. function. But WHICH object depends on HOW the function
2. called, not where it's written. In JS, `this` changes based on CALL SITE â€” 4 rules + ar 'I', it refers to you. When I say 'I', it refers to me.

```mermaid
flowchart TD
    N1["function. But WHICH object depends on HOW the function"]
    N2["called, not where it's written."]
    N3["In JS, `this` changes based on CALL SITE â€” 4 rules + ar"]
    N4["'I', it refers to you. When I say 'I', it refers to me."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
```

### The 5 Rules of `this` (in priority order)

```javascript
// RULE 1: new binding (highest priority)
function Person(name) {
    this.name = name; // `this` = newly created object
}
const p = new Person("Harsha"); // this â†’ {}

// RULE 2: explicit binding (call, apply, bind)
function greet() {
    console.log(`Hello, ${this.name}`);
}
const user = { name: "Harsha" };
greet.call(user);   // "Hello, Harsha" â€” this = user
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

// âš ï¸ BUT: Method extraction LOSES binding!
const fn = obj.greet;
fn(); // undefined â€” `this` is now global/undefined (no dot!)

// RULE 4: default binding (lowest priority)
function standalone() {
    console.log(this); // window (browser) or global (Node)
}
standalone(); // In strict mode: undefined

// RULE 5: Arrow functions â€” NO own `this`
const obj2 = {
    name: "Harsha",
    greet: () => {
        console.log(this.name); // âŒ `this` is NOT obj2!
        // Arrow inherits `this` from enclosing LEXICAL scope.
    },
    greetCorrect() {
        const inner = () => {
            console.log(this.name); // âœ… "Harsha" â€” inherits from greetCorrect
        };
        inner();
    }
};
```

```
`this` DETERMINATION FLOWCHART:

Is it an ARROW function?
â”œâ”€â”€ YES â†’ `this` = enclosing lexical scope's `this`
â””â”€â”€ NO â†“

Called with NEW keyword?
â”œâ”€â”€ YES â†’ `this` = newly created object
â””â”€â”€ NO â†“

Called with call/apply/bind?
â”œâ”€â”€ YES â†’ `this` = specified object
â””â”€â”€ NO â†“

Called as object.method()?
â”œâ”€â”€ YES â†’ `this` = object before the dot
â””â”€â”€ NO â†“

Default: `this` = window (or undefined in strict mode)
```

**Flow:**
1. YES
2. `this` = enclosing lexical scope's `this` YES `this` = newly created object YES `this` = specified object YES `this` = object before the dot

```mermaid
flowchart LR
    N1["YES"]
    N2["`this` = enclosing lexical scope's `this`"]
    N3["`this` = newly created object"]
    N4["`this` = specified object"]
    N5["`this` = object before the dot"]
    N1 --> N2
    N1 --> N3
    N1 --> N4
    N1 --> N5
```

---




## 4. Closures â€” The Most Important Concept

### 5W1H: WHAT is a Closure?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: A closure is a function that REMEMBERS the variables from     â•‘
â•‘        its outer (enclosing) scope even AFTER the outer function     â•‘
â•‘        has returned.                                                 â•‘
â•‘                                                                      â•‘
â•‘  WHY:  Closures enable data privacy, factory functions, partial      â•‘
â•‘        application, memoization, and React hooks (useState).         â•‘
â•‘                                                                      â•‘
â•‘  HOW:  When a function is created, it captures a reference to its    â•‘
â•‘        surrounding scope (not a copy). This reference persists       â•‘
â•‘        even after the outer function finishes executing.             â•‘
â•‘                                                                      â•‘
â•‘  ANALOGY: A closure is like a backpack. When a function is born      â•‘
â•‘  inside another function, it packs the outer function's variables    â•‘
â•‘  into its backpack. Even after leaving the outer function (the       â•‘
â•‘  house), the inner function still carries those variables.           â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. its outer (enclosing) scope even AFTER the outer functi
2. has returned.
3. application, memoization, and React hooks (useState).
4. surrounding scope (not a copy). This reference persists
5. even after the outer function finishes executing.
6. house), the inner function still carries those variable

```mermaid
flowchart TD
    N1["its outer (enclosing) scope even AFTER the outer functi"]
    N2["has returned."]
    N3["application, memoization, and React hooks (useState)."]
    N4["surrounding scope (not a copy). This reference persists"]
    N5["even after the outer function finishes executing."]
    N6["house), the inner function still carries those variable"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
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
counter(); // 1 â€” BUT count is still alive!
counter(); // 2 â€” count persists between calls!
counter(); // 3

// WHY does count persist?
// When inner was created, it captured a REFERENCE to count.
// Even though outer() finished, inner still holds that reference.
// JS garbage collector sees it's still referenced â†’ keeps it alive.
```

```
CLOSURE MEMORY VISUALIZATION:

After outer() returns:

â”Œâ”€ counter variable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Points to inner function                              â”‚
â”‚  inner function carries a "backpack":                  â”‚
â”‚  â”Œâ”€â”€â”€ Closure Scope â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                â”‚
â”‚  â”‚  count: 0 â†’ 1 â†’ 2 â†’ 3 (persists!) â”‚                 â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

outer()'s execution context is gone, but the closure keeps
count alive because inner still references it.
```

**Flow:**
1. CLOSURE MEMORY VISUALIZATION:
2. After outer() returns: counter variable
3. Points to inner function
4. inner function carries a 'backpack':
5. Closure Scope count: 0 1 2 3 (persists!)

```mermaid
flowchart TD
    N1["CLOSURE MEMORY VISUALIZATION:"]
    N2["After outer() returns:"]
    N3["counter variable"]
    N4["Points to inner function"]
    N5["inner function carries a 'backpack':"]
    N6["Closure Scope"]
    N7["count: 0 â†’ 1 â†’ 2 â†’ 3 (persists!)"]
    N8["outer()'s execution context is gone, but the closure ke"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Closure Use Cases

```javascript
// USE CASE 1: DATA PRIVACY (Module Pattern)
function createBankAccount(initialBalance) {
    let balance = initialBalance; // PRIVATE â€” no outside access

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
// account.balance â†’ undefined! It's private.

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
expensiveAdd(1, 2); // "Computing..." â†’ 3
expensiveAdd(1, 2); // "Cache hit!" â†’ 3 (no recomputation)


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
// Output: 3, 3, 3 â€” NOT 0, 1, 2!

// WHY? var is function-scoped, so there's ONE `i` variable.
// By the time setTimeout fires (100ms later), the loop has finished.
// All three functions share the SAME i, which is now 3.

// FIX 1: Use let (creates new variable per iteration)
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 âœ… â€” let creates a new `i` for each iteration

// FIX 2: IIFE (old way, before let existed)
for (var i = 0; i < 3; i++) {
    (function(j) {
        setTimeout(() => console.log(j), 100);
    })(i); // Pass current i into IIFE as j â†’ each closure has its own j
}
// Output: 0, 1, 2 âœ…
```

---



ðŸ”¬ **Section Challenge â€” 4. Closures â€” The Most Important Concept**

**Challenge 1 (Reasoning):** What is a closure and why can't garbage collection remove variables that are closed over?
<details><summary>Answer</summary>

A closure is a function that retains a reference to its lexical environment (the scope where it was created). Variables closed over are kept alive by the closure reference â€” GC can't collect them because there's still a reference (the closure's internal scope). Memory leak scenario: large data object captured in a closure, closure stored in a long-lived event listener â†’ data stays in memory for the page's lifetime. Fix: explicitly null the large variable after use, or use a WeakRef.
</details>


## 5. Higher-Order Functions

### 5W1H: WHAT are Higher-Order Functions?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: A function that takes another function as argument OR         â•‘
â•‘        returns a function.                                           â•‘
â•‘  WHY:  Enables composition, abstraction, and declarative code.       â•‘
â•‘  WHO:  Used everywhere: Array methods, event handlers, Express       â•‘
â•‘        middleware, React components.                                 â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. WHAT: A function that takes another function as argumen
2. returns a function.
3. middleware, React components.

```mermaid
flowchart TD
    N1["WHAT: A function that takes another function as argumen"]
    N2["returns a function."]
    N3["middleware, React components."]
    N1 --> N2
    N2 --> N3
```

```javascript
// Array higher-order methods (the most important ones):

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map: Transform each element â†’ new array
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter: Keep elements that pass a test â†’ new array
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

// CHAINING â€” the power of functional style:
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



ðŸ”¬ **Section Challenge â€” 5. Higher-Order Functions**
>
**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` â€” show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


## 6. IIFE â€” Immediately Invoked Function Expression

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



ðŸ”¬ **Section Challenge â€” 9. Recursion (JS-Specific Notes)**
>
**Challenge 2 (Bug Hunt):** ```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```
Why and what are the 3 fixes?
<details><summary>Answer</summary>

Exponential time O(2^N) â€” `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization â€” `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP â€” array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space â€” just track last two values with two variables. O(N) time, O(1) space.
</details>


## Interview Quick-Fire

```
Q: What is a closure?
â†’ A function that remembers variables from its outer scope even
  after the outer function has returned.

Q: Give a practical use of closures.
â†’ Data privacy (module pattern), memoization, event handlers,
  React hooks (useState), factory functions.

Q: What does `this` refer to in an arrow function?
â†’ The `this` of the enclosing lexical scope. Arrow functions
  don't have their own `this`.

Q: What's the difference between call, apply, and bind?
â†’ call: invokes with `this` + individual args.
  apply: invokes with `this` + args as array.
  bind: returns new function with `this` locked (doesn't invoke).

Q: What's the output? for (var i=0; i<3; i++) setTimeout(() => console.log(i), 0);
â†’ 3, 3, 3 â€” because var is function-scoped, all closures share
  the same i. Fix: use let.

Q: What is currying?
â†’ Transforming f(a, b) into f(a)(b). Each call returns a new
  function until all args are received. Uses closures.

Q: What is a higher-order function?
â†’ A function that takes a function as argument or returns one.
  Examples: map, filter, reduce, addEventListener.
```

**Flow:**
1. Q: What is a closure?
2. after the outer function has returned.
3. Q: Give a practical use of closures.
4. React hooks (useState), factory functions.
5. Q: What does `this` refer to in an arrow function?
6. don't have their own `this`. Q: What's the difference between call, apply, and bind?

```mermaid
flowchart TD
    N1["Q: What is a closure?"]
    N2["after the outer function has returned."]
    N3["Q: Give a practical use of closures."]
    N4["React hooks (useState), factory functions."]
    N5["Q: What does `this` refer to in an arrow function?"]
    N6["don't have their own `this`."]
    N7["Q: What's the difference between call, apply, and bind?"]
    N8["â†’ call: invokes with `this` + individual args."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

[â† Previous: Foundations](01_JS_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Objects & Prototypes](03_JS_Objects_Prototypes.md)

