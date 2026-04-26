**JavaScript Chapter 4/7** | [â† Previous: Objects & Prototypes](03_JS_Objects_Prototypes.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md)

# Async JavaScript â€” Event Loop, Promises & Async/Await

## 5W1H â€” Why This Chapter?


WHAT: How JS handles asynchronous operations despite being
SINGLE-THREADED. Event loop, callbacks, promises, async.

WHY:  Every web app does async: API calls, file reads, timers,
user events, animations. Without understanding async, you
WILL have bugs â€” race conditions, callback hell, unhandled
promise rejections, stale closures in React.

WHO:  Every developer. Frontend (fetch, events), Backend (DB,
file I/O, HTTP), React (useEffect, data fetching).

WHEN: After understanding closures and scope (they're essential
for understanding how async callbacks capture variables).

HOW:  JS delegates async work to browser/Node APIs. When done,
the result goes to a QUEUE. The EVENT LOOP moves it to
the call stack when the stack is empty.


---

## 1. The Event Loop â€” The Core Mental Model

### 5W1H: WHY is JS Single-Threaded?


WHY single-threaded?
JS was designed for the DOM. If two threads modified the same
DOM element simultaneously â†’ race condition â†’ crash/corruption.
One thread = no data races on the DOM. Simpler mental model.

BUT HOW does it handle async then?
The EVENT LOOP â€” JS's secret weapon.


```
THE EVENT LOOP ARCHITECTURE:

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  YOUR JS CODE                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚  â”‚  CALL STACK  â”‚    â”‚  WEB APIs (browser) or     â”‚      â”‚
â”‚  â”‚              â”‚    â”‚  C++ APIs (Node)            â”‚     â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚    â”‚                              â”‚    â”‚
â”‚  â”‚ â”‚ func3()  â”‚ â”‚    â”‚  â€¢ setTimeout/setInterval    â”‚    â”‚
â”‚  â”‚ â”‚ func2()  â”‚ â”‚    â”‚  â€¢ fetch / XMLHttpRequest    â”‚    â”‚
â”‚  â”‚ â”‚ func1()  â”‚ â”‚    â”‚  â€¢ addEventListener          â”‚    â”‚
â”‚  â”‚ â”‚ global   â”‚ â”‚    â”‚  â€¢ geolocation               â”‚    â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚    â”‚  â€¢ FileReader                â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â”‚         â–²                          â”‚                     â”‚
â”‚         â”‚                          â–¼                     â”‚
â”‚         â”‚              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”‚
â”‚         â”‚              â”‚  CALLBACK QUEUES      â”‚         â”‚
â”‚         â”‚              â”‚                                 â”‚
â”‚    EVENT LOOP          â”‚  Microtask Queue:     â”‚         â”‚
â”‚    (checks if          â”‚  Promise.then()        â”‚        â”‚
â”‚     stack is           â”‚  queueMicrotask()      â”‚        â”‚
â”‚     empty, then        â”‚  MutationObserver      â”‚        â”‚
â”‚     moves next         â”‚                        â”‚        â”‚
â”‚     task to stack)     â”‚  Macrotask Queue:     â”‚         â”‚
â”‚         â”‚              â”‚  setTimeout()          â”‚        â”‚
â”‚         â”‚              â”‚  setInterval()         â”‚        â”‚
â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚  I/O callbacks         â”‚        â”‚
â”‚                        â”‚  UI rendering          â”‚        â”‚
â”‚                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

CRITICAL RULE:
Microtasks ALWAYS run before macrotasks.
After each macrotask, ALL pending microtasks run first.
```

**Flow:**
1. WEB APIs (browser) or / C++ APIs (Node) / â€¢ setTimeout/
2. CALLBACK QUEUES / Microtask Queue: / Promise.then() / q

```mermaid
flowchart TD
    N2["WEB APIs (browser) or / C++ APIs (Node) / â€¢ setTimeout/"]
    N3["CALLBACK QUEUES / Microtask Queue: / Promise.then() / q"]
    N2 --> N3
```

### The Event Loop in Action â€” Step by Step

```javascript
console.log("1");                          // Sync â†’ call stack

setTimeout(() => console.log("2"), 0);     // Macro â†’ macrotask queue

Promise.resolve().then(() => console.log("3")); // Micro â†’ microtask queue

console.log("4");                          // Sync â†’ call stack

// OUTPUT: 1, 4, 3, 2
// WHY?
// 1. "1" runs immediately (sync)
// 2. setTimeout REGISTERS callback â†’ macrotask queue (even with 0ms!)
// 3. Promise.then REGISTERS callback â†’ microtask queue
// 4. "4" runs immediately (sync)
// 5. Stack is empty â†’ event loop checks microtasks first â†’ "3"
// 6. No more microtasks â†’ check macrotasks â†’ "2"
```

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  STEP-BY-STEP TRACE:                                                 â•‘
â•‘                                                                      â•‘
â•‘  CALL STACK          MICROTASK Q     MACROTASK Q    OUTPUT           â•‘
â•‘  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€       â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€     â”€â”€â”€â”€â”€â”€           â•‘
â•‘  log("1")            []              []             "1"              â•‘
â•‘  setTimeout(cb,0)    []              [cbâ†’"2"]       "1"              â•‘
â•‘  Promise.then(cb)    [cbâ†’"3"]        [cbâ†’"2"]       "1"              â•‘
â•‘  log("4")            [cbâ†’"3"]        [cbâ†’"2"]       "1","4"          â•‘
â•‘  â† stack empty â†’                                                     â•‘
â•‘  cbâ†’"3"              []              [cbâ†’"2"]       "1","4","3"      â•‘
â•‘  â† microtasks done â†’                                                 â•‘
â•‘  cbâ†’"2"              []              []             "1","4","3","2"  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. STEP-BY-STEP TRACE:
2. CALL STACK MICROTASK Q MACROTASK Q OUTPUT
3. log('1') [] [] '1' setTimeout(cb,0) [] [cb '2'] '1'
4. setTimeout(cb,0) [] [cb '2'] '1'
5. Promise.then(cb) [cb '3'] [cb '2'] '1'
6. log('4') [cb '3'] [cb '2'] '1','4'
7. â† stack empty

```mermaid
flowchart TD
    N1["STEP-BY-STEP TRACE:"]
    N2["CALL STACK MICROTASK Q MACROTASK Q OUTPUT"]
    N3["log('1') [] [] '1'"]
    N4["setTimeout(cb,0) [] [cbâ†’'2'] '1'"]
    N5["Promise.then(cb) [cbâ†’'3'] [cbâ†’'2'] '1'"]
    N6["log('4') [cbâ†’'3'] [cbâ†’'2'] '1','4'"]
    N7["â† stack empty â†’"]
    N8["â† microtasks done â†’"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## 2. Callbacks â€” The Old Way

```javascript
// WHAT: Pass a function to be called LATER when the async operation finishes.

// Simple callback:
function fetchUser(id, callback) {
    setTimeout(() => {
        const user = { id, name: "Harsha" };
        callback(null, user);  // Node convention: callback(error, result)
    }, 1000);
}

fetchUser(1, (error, user) => {
    if (error) { console.error(error); return; }
    console.log(user);
});

// CALLBACK HELL (the problem with callbacks):
getUser(1, (err, user) => {
    getOrders(user.id, (err, orders) => {
        getOrderDetails(orders[0].id, (err, details) => {
            getShippingInfo(details.shippingId, (err, shipping) => {
                // 4 levels deep â€” hard to read, hard to handle errors
                console.log(shipping);
            });
        });
    });
});

// WHY callback hell is bad:
// 1. Pyramid of doom â€” indentation keeps growing
// 2. Error handling at every level
// 3. Hard to refactor or add steps
// 4. Can't use try/catch (async errors escape it)
// SOLUTION: Promises.
```

---

## 3. Promises â€” The Modern Foundation

### 5W1H: WHAT is a Promise?

```
WHAT: A Promise is an object representing a FUTURE value.
      It will eventually be either FULFILLED (success) or
      REJECTED (failure).

WHY:  Promises solve callback hell with chaining (.then).
      They provide .catch for centralized error handling.
      They enable async/await (Chapter section 4).

ANALOGY: A promise is like an order receipt at a restaurant.
You place an order â†’ get a receipt (promise). Eventually:
â€¢ Your food arrives (fulfilled) â†’ enjoy it (.then)
â€¢ Kitchen is out of ingredients (rejected) â†’ handle it (.catch)
â€¢ While waiting, you can do other things (non-blocking).

STATES:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    resolve()    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ PENDING  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â†’â”‚ FULFILLED  â”‚
â”‚          â”‚                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚          â”‚    reject()     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚          â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â†’â”‚ REJECTED   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
Once settled (fulfilled/rejected), a promise NEVER changes state.
```

**Flow:**
1. PENDING --(resolve())--> FULFILLED
2. PENDING --(resolve())--> REJECTED

```mermaid
flowchart LR
    N1["PENDING"]
    N2["FULFILLED"]
    N3["REJECTED"]
    N1 -->|"resolve()"| N2
    N1 -->|"resolve()"| N3
```

```javascript
// CREATING a Promise:
const myPromise = new Promise((resolve, reject) => {
    // This executor runs IMMEDIATELY (synchronous!)
    const success = true;

    if (success) {
        resolve("Data loaded!");  // Fulfill the promise
    } else {
        reject(new Error("Failed to load")); // Reject the promise
    }
});

// CONSUMING a Promise:
myPromise
    .then(data => {
        console.log(data);       // "Data loaded!"
        return data.toUpperCase(); // Return value â†’ next .then
    })
    .then(upper => {
        console.log(upper);      // "DATA LOADED!"
    })
    .catch(error => {
        console.error(error);    // Catches ANY error in the chain
    })
    .finally(() => {
        console.log("Done!");    // Runs ALWAYS (success or failure)
    });

// CHAINING solves callback hell:
getUser(1)
    .then(user => getOrders(user.id))
    .then(orders => getOrderDetails(orders[0].id))
    .then(details => getShippingInfo(details.shippingId))
    .then(shipping => console.log(shipping))
    .catch(error => console.error(error)); // ONE catch for ALL!
```

### Promise Static Methods â€” Parallel & Race Patterns

```javascript
const p1 = fetch("/api/users");
const p2 = fetch("/api/products");
const p3 = fetch("/api/orders");

// Promise.all â€” Wait for ALL, fail if ANY fails
const [users, products, orders] = await Promise.all([p1, p2, p3]);
// If ANY promise rejects â†’ entire Promise.all rejects immediately
// USE: When you need ALL results and can't proceed without them.

// Promise.allSettled â€” Wait for ALL, never fails
const results = await Promise.allSettled([p1, p2, p3]);
// results = [
//   { status: "fulfilled", value: ... },
//   { status: "rejected",  reason: Error },
//   { status: "fulfilled", value: ... }
// ]
// USE: When you want to know the status of each, regardless of failure.

// Promise.race â€” First to settle (fulfill OR reject) wins
const fastest = await Promise.race([p1, p2, p3]);
// USE: Timeout pattern:
const withTimeout = Promise.race([
    fetch("/api/data"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
]);

// Promise.any â€” First to FULFILL wins (ignores rejections)
const first = await Promise.any([p1, p2, p3]);
// If ALL reject â†’ AggregateError
// USE: Try multiple sources, use whichever responds first.
```

```
PROMISE METHODS COMPARISON:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Method            â”‚ Resolves   â”‚ Rejects    â”‚ Use Case        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Promise.all       â”‚ ALL fulfillâ”‚ ANY rejectsâ”‚ Need all resultsâ”‚
â”‚ Promise.allSettledâ”‚ ALL settle â”‚ Never      â”‚ Check each      â”‚
â”‚ Promise.race      â”‚ First done â”‚ First done â”‚ Timeout/fastest â”‚
â”‚ Promise.any       â”‚ First win  â”‚ ALL reject â”‚ Multiple sourcesâ”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Flow:**
1. PROMISE METHODS COMPARISON:
2. Method Resolves Rejects Use Case
3. Promise.all ALL fulfill ANY rejects Need all results
4. Promise.allSettled ALL settle Never Check each
5. Promise.race First done First done Timeout/fastest
6. Promise.any First win ALL reject Multiple sources

```mermaid
flowchart TD
    N1["PROMISE METHODS COMPARISON:"]
    N2["Method Resolves Rejects Use Case"]
    N3["Promise.all ALL fulfill ANY rejects Need all results"]
    N4["Promise.allSettled ALL settle Never Check each"]
    N5["Promise.race First done First done Timeout/fastest"]
    N6["Promise.any First win ALL reject Multiple sources"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
```

---



ðŸ”¬ **Section Challenge â€” 3. Promises â€” The Modern Foundation**

**Challenge 1 (Reasoning):** `Promise.all([p1,p2,p3])` â€” p2 rejects. What happens to p1 and p3?
<details><summary>Answer</summary>

`Promise.all` rejects immediately when ANY promise rejects (fail-fast). p1 and p3 are still running â€” their promises continue executing, but their results are ignored. If they reject too, those rejections are also silently ignored (potential unhandled rejection warnings). Use `Promise.allSettled` to wait for ALL to complete regardless of success/failure, getting all results including errors.
</details>

**Challenge 2 (Design):** Implement `Promise.race` from scratch.
<details><summary>Answer</summary>

```javascript
function race(promises) {
    return new Promise((resolve, reject) => {
        promises.forEach(p => Promise.resolve(p).then(resolve, reject));
        // First to resolve OR reject wins â€” others are ignored
    });
}
```
Once the first promise settles, the outer promise is settled. Other promises continue running internally but their results are discarded.
</details>


## 4. Async/Await â€” The Clean Syntax

### 5W1H: WHY Async/Await?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: Syntactic sugar over Promises. Makes async code LOOK and      â•‘
â•‘        BEHAVE like synchronous code.                                 â•‘
â•‘                                                                      â•‘
â•‘  WHY:  .then chains are better than callbacks, but still messy       â•‘
â•‘        for complex flows. async/await reads top-to-bottom.           â•‘
â•‘                                                                      â•‘
â•‘  HOW:  `async` marks a function as returning a Promise.              â•‘
â•‘        `await` pauses execution until the Promise resolves.          â•‘
â•‘        (The thread isn't blocked â€” other code can run!)              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. BEHAVE like synchronous code.
2. HOW: `async` marks a function as returning a Promise.
3. `await` pauses execution until the Promise resolves.
4. (The thread isn't blocked â€” other code can run!)

```mermaid
flowchart TD
    N1["BEHAVE like synchronous code."]
    N2["HOW: `async` marks a function as returning a Promise."]
    N3["`await` pauses execution until the Promise resolves."]
    N4["(The thread isn't blocked â€” other code can run!)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
```

```javascript
// WITH PROMISES (chaining):
function fetchUserData() {
    return getUser(1)
        .then(user => getOrders(user.id))
        .then(orders => getOrderDetails(orders[0].id))
        .then(details => details)
        .catch(error => console.error(error));
}

// WITH ASYNC/AWAIT (same logic, cleaner):
async function fetchUserData() {
    try {
        const user = await getUser(1);
        const orders = await getOrders(user.id);
        const details = await getOrderDetails(orders[0].id);
        return details;
    } catch (error) {
        console.error(error); // try/catch works with await!
    }
}

// RULES:
// 1. `await` can ONLY be used inside an `async` function (or top-level in modules)
// 2. `async` function ALWAYS returns a Promise
// 3. `await` pauses the function, NOT the thread

// PARALLEL with async/await (IMPORTANT!):
async function fetchAll() {
    // âŒ WRONG â€” runs sequentially (waits for each):
    const users = await fetch("/api/users");
    const products = await fetch("/api/products"); // Waits for users first!

    // âœ… RIGHT â€” runs in parallel:
    const [users2, products2] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/products")
    ]);
}
```

### Error Handling Patterns

```javascript
// PATTERN 1: Try/Catch (most common)
async function fetchData() {
    try {
        const response = await fetch("/api/data");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return null; // or throw error; to propagate
    }
}

// PATTERN 2: Go-style [error, data] tuple
async function safeAsync(promise) {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        return [error, null];
    }
}

// Usage:
const [error, user] = await safeAsync(getUser(1));
if (error) { /* handle */ }

// PATTERN 3: .catch on await (inline)
const user = await getUser(1).catch(err => null);
if (!user) { /* handle */ }

// ALWAYS handle rejections! Unhandled rejections crash Node.
// In browsers, they log warnings and may become errors.
```

---



ðŸ”¬ **Section Challenge â€” 4. Async/Await â€” The Clean Syntax**

**Challenge 1 (Reasoning):** `await Promise.all([fetch(a), fetch(b)])` vs `await fetch(a); await fetch(b)`. What's the performance difference?
<details><summary>Answer</summary>

`Promise.all`: both fetches START simultaneously (concurrent). Total time = max(timeA, timeB). Sequential awaits: fetch B doesn't start until fetch A completes. Total time = timeA + timeB. For independent requests, ALWAYS use `Promise.all`. Sequential await is only appropriate when B depends on A's result.
</details>

**Challenge 2 (Bug Hunt):** An `async` function has `try { await doWork(); } catch(e) {}`. `doWork()` rejects. Is the rejection handled?
<details><summary>Answer</summary>

Yes â€” `await` unwraps the rejected promise and throws the rejection value as a synchronous error, which is caught by the `catch` block. Without `try/catch` around `await`: unhandled rejection. Without `await` (just `doWork()`): the rejection is a separate promise â€” the `try/catch` CANNOT catch it (it's asynchronous). Always `await` async calls if you want to catch their rejections synchronously.
</details>


## 5. Advanced Async Patterns

### Generators & Async Generators

```javascript
// GENERATOR: A function that can PAUSE and RESUME.
function* idGenerator() {
    let id = 0;
    while (true) {
        yield ++id;  // yield pauses and returns a value
    }
}
const gen = idGenerator();
gen.next(); // { value: 1, done: false }
gen.next(); // { value: 2, done: false }
gen.next(); // { value: 3, done: false }

// WHY generators matter:
// 1. Lazy evaluation â€” produce values on demand
// 2. Iterator protocol â€” works with for...of
// 3. Async generators â€” for streaming data

// ASYNC GENERATOR: yield + async combined
async function* fetchPages(url) {
    let page = 1;
    while (true) {
        const response = await fetch(`${url}?page=${page}`);
        const data = await response.json();
        if (data.length === 0) break;
        yield data;
        page++;
    }
}

// Consume with for await...of:
for await (const page of fetchPages("/api/users")) {
    console.log("Got page:", page);
}
```

### AbortController â€” Cancelling Async Operations

```javascript
// WHAT: The ONLY standard way to cancel fetch requests.
// WHY: User navigates away, component unmounts, request becomes stale.

const controller = new AbortController();

// Pass signal to fetch:
fetch("/api/data", { signal: controller.signal })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => {
        if (error.name === "AbortError") {
            console.log("Request was cancelled");
        } else {
            throw error;
        }
    });

// Cancel after 3 seconds:
setTimeout(() => controller.abort(), 3000);

// REACT USE CASE:
useEffect(() => {
    const controller = new AbortController();

    fetch("/api/data", { signal: controller.signal })
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => {
            if (err.name !== "AbortError") setError(err);
        });

    return () => controller.abort(); // Cleanup on unmount!
}, []);
```

---



## 6. Microtasks vs Macrotasks â€” Deep Dive

```javascript
// MICROTASKS (higher priority):
// â€¢ Promise.then/.catch/.finally callbacks
// â€¢ queueMicrotask()
// â€¢ MutationObserver callbacks

// MACROTASKS (lower priority):
// â€¢ setTimeout / setInterval
// â€¢ setImmediate (Node.js only)
// â€¢ I/O operations
// â€¢ UI rendering events
// â€¢ requestAnimationFrame (between macro tasks, before paint)

// THE RULE: After each macrotask, run ALL pending microtasks
// before the next macrotask.

console.log("start");

setTimeout(() => console.log("timeout 1"), 0);
setTimeout(() => console.log("timeout 2"), 0);

Promise.resolve()
    .then(() => {
        console.log("promise 1");
        // Adding a new microtask from WITHIN a microtask
        return Promise.resolve();
    })
    .then(() => console.log("promise 2"));

queueMicrotask(() => console.log("microtask"));

console.log("end");

// OUTPUT:
// start
// end
// promise 1    â† microtask queue
// microtask    â† microtask queue
// promise 2    â† microtask queue (added during microtask phase!)
// timeout 1    â† macrotask queue
// timeout 2    â† macrotask queue
```

```
EVENT LOOP CYCLE:

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 1. Execute ALL synchronous code in call stack           â”‚
â”‚                â”‚                                        â”‚
â”‚                â–¼                                        â”‚
â”‚ 2. Drain ENTIRE microtask queue                         â”‚
â”‚    (including microtasks added DURING this step!)       â”‚
â”‚                â”‚                                        â”‚
â”‚                â–¼                                        â”‚
â”‚ 3. Pick ONE macrotask from macrotask queue              â”‚
â”‚                â”‚                                        â”‚
â”‚                â–¼                                        â”‚
â”‚ 4. Drain ENTIRE microtask queue again                   â”‚
â”‚                â”‚                                        â”‚
â”‚                â–¼                                        â”‚
â”‚ 5. Render/paint (if needed)                             â”‚
â”‚                â”‚                                        â”‚
â”‚                â–¼                                        â”‚
â”‚ 6. Go to step 3 (next macrotask)                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

IMPLICATION: Microtasks can starve macrotasks!
If microtasks keep adding more microtasks, setTimeout callbacks
and UI rendering NEVER run. The page freezes.
```

**Flow:**
1. EVENT LOOP CYCLE: / 1. Execute ALL synchronous code in
2. Drain ENTIRE microtask queue / (including microtasks Pick ONE macrotask from macrotask queue Drain ENTIRE microtask queue again Render/paint (if needed) Go to step 3 (next macrotask) / IMPLICATION: Microta

```mermaid
flowchart TD
    N1["EVENT LOOP CYCLE: / 1. Execute ALL synchronous code in"]
    N2["2. Drain ENTIRE microtask queue / (including microtasks"]
    N3["3. Pick ONE macrotask from macrotask queue"]
    N4["4. Drain ENTIRE microtask queue again"]
    N5["5. Render/paint (if needed)"]
    N6["6. Go to step 3 (next macrotask) / IMPLICATION: Microta"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
```

---

## 7. Common Async Patterns in Real Code

```javascript
// PATTERN: Debounce (wait until user stops typing)
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
const search = debounce(query => fetch(`/api/search?q=${query}`), 300);
// Only fires 300ms AFTER user stops typing

// PATTERN: Throttle (run at most once per interval)
function throttle(fn, interval) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, args);
        }
    };
}
const handleScroll = throttle(() => console.log("Scrolled!"), 100);

// PATTERN: Retry with exponential backoff
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return await response.json();
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            console.log(`Retry ${i + 1} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// PATTERN: Concurrent limit (process N at a time)
async function asyncPool(limit, items, iteratorFn) {
    const results = [];
    const executing = [];

    for (const item of items) {
        const p = iteratorFn(item);
        results.push(p);

        if (items.length >= limit) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= limit) await Promise.race(executing);
        }
    }

    return Promise.all(results);
}
// Process 5 URLs at a time:
await asyncPool(5, urls, url => fetch(url).then(r => r.json()));
```

---




## Interview Quick-Fire

```
Q: What is the event loop?
â†’ The mechanism that allows single-threaded JS to handle async.
  It checks if the call stack is empty, then moves tasks from
  queues (microtask first, then macrotask) to the stack.

Q: Output? setTimeout(()=>log(1),0); Promise.resolve().then(()=>log(2)); log(3);
â†’ 3, 2, 1 â€” sync first, then microtask (promise), then macrotask (timeout)

Q: Difference between microtask and macrotask?
â†’ Microtasks (promises, queueMicrotask) run BEFORE macrotasks
  (setTimeout, I/O). All microtasks drain before next macrotask.

Q: Promise.all vs Promise.allSettled?
â†’ .all: rejects immediately if ANY promise rejects.
  .allSettled: waits for ALL, returns status of each.

Q: What does async do to a function?
â†’ Makes it return a Promise. Allows `await` inside.
  The return value becomes the resolved value of the promise.

Q: Can you cancel a fetch request?
â†’ Yes, using AbortController. Pass its signal to fetch options.
  Call controller.abort() to cancel.

Q: How to run async operations in parallel?
â†’ Promise.all([promise1, promise2, promise3])
  NOT: await p1; await p2; (this runs sequentially!)
```

**Flow:**
1. Q: What is the event loop?
2. It checks if the call stack is empty, then moves tasks
3. queues (microtask first, then macrotask) to the stack.
4. Q: Difference between microtask and macrotask?
5. Q: Promise.all vs Promise.allSettled?
6. .all: rejects immediately if ANY promise rejects.
7. .allSettled: waits for ALL, returns status of each.

```mermaid
flowchart TD
    N1["Q: What is the event loop?"]
    N2["It checks if the call stack is empty, then moves tasks"]
    N3["queues (microtask first, then macrotask) to the stack."]
    N4["Q: Difference between microtask and macrotask?"]
    N5["Q: Promise.all vs Promise.allSettled?"]
    N6["â†’ .all: rejects immediately if ANY promise rejects."]
    N7[".allSettled: waits for ALL, returns status of each."]
    N8["Q: What does async do to a function?"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

[â† Previous: Objects & Prototypes](03_JS_Objects_Prototypes.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ DOM & Browser APIs](05_JS_DOM_BrowserAPIs.md)

---
