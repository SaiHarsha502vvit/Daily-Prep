# 📝 JavaScript — Problem Sets
## `16_JavaScript` Module | Event Loop · Closures · Async · Generators

> **How to use:** Predict every output BEFORE running the code. Part B code goes in `JavaSolutions/ps/js/`. Read 🔴 **Erklärung** if wrong.

---

## Problem Set JS-PS1 — Closures, `this`, and Scope

**Prerequisites:** `16_JavaScript/01_JS_Core.md`, `16_JavaScript/02_JS_Advanced.md`

---

### Part A: Predict the Output

**A1 (Easy).** What does this log?
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

<details><summary>Answer</summary>

**Output:** `3 3 3`

`var` is function-scoped — all three closures share the **same** `i` variable. By the time the callbacks run (after the loop), `i` is already `3`.

**Fix with `let`:**
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0 1 2
}
```
`let` is block-scoped — each loop iteration creates a new binding for `i`.

🔴 **Erklärung:** This is the most famous JavaScript closure gotcha. `var` leaks loop variables into the enclosing function scope. `let` creates a new scope per block. NEVER use `var` in loops with async callbacks.
</details>

---

**A2 (Medium).** What does this log?
```javascript
const obj = {
  name: 'Alice',
  greet: function() {
    console.log(this.name);
  },
  greetArrow: () => {
    console.log(this.name);
  }
};

obj.greet();                          // 1
obj.greetArrow();                     // 2

const fn = obj.greet;
fn();                                 // 3
```

<details><summary>Answer</summary>

1. `"Alice"` — `this` is the calling object (`obj`)
2. `undefined` — arrow functions capture `this` from the **enclosing lexical scope** at definition time (module scope or global). Not the object.
3. `undefined` (strict mode) or `""` (global/window.name) — method detached from object; `this` is no longer `obj`

🔴 **Erklärung:** The **4 rules for `this`** in order of precedence:
1. `new` binding — `this` is the newly created object
2. Explicit — `.call(obj)` / `.apply(obj)` / `.bind(obj)`
3. Implicit — `obj.method()` — `this` is the object before the dot
4. Default — bare function call — `this` is `undefined` (strict) or global
Arrow functions are NOT a rule — they have NO `this`; they inherit from enclosing scope.
</details>

---

**A3 (Hard).** What does this log and in what order?
```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');
```

<details><summary>Answer</summary>

**Output order:** `1` → `4` → `3` → `2`

**Why:**
1. `console.log('1')` — synchronous, runs immediately
2. `setTimeout` callback — goes to **macrotask queue** (task queue)
3. `Promise.resolve().then(...)` — goes to **microtask queue** (Promise job queue)
4. `console.log('4')` — synchronous, runs immediately

After call stack is empty:
- **Microtask queue is drained first** → `'3'` logs
- Then one macrotask is dequeued → `'2'` logs

🔴 **Erklärung:** The event loop always **fully drains the microtask queue** before processing the next macrotask. Promise callbacks are microtasks. `setTimeout` callbacks are macrotasks. This is why `Promise.resolve().then()` always runs before `setTimeout(..., 0)`.
</details>

---

**A4 (Hard).** What does this log?
```javascript
async function fetchData() {
  console.log('A');
  const result = await Promise.resolve('data');
  console.log('B', result);
}

console.log('X');
fetchData();
console.log('Y');
```

<details><summary>Answer</summary>

**Output:** `X` → `A` → `Y` → `B data`

1. `X` — synchronous
2. `fetchData()` called — runs synchronously until first `await`
3. `A` — synchronous inside async function
4. `await Promise.resolve(...)` — suspends the async function, schedules continuation as microtask
5. `Y` — synchronous continues while fetchData is suspended
6. Call stack empty → microtask queue drains → `B data` runs

🔴 **Erklärung:** `async function` runs synchronously up to the FIRST `await`. Everything after an `await` is a microtask continuation. This is why calling `fetchData()` without `await` at the call site doesn't wait for it to finish.
</details>

---

### Part B: Implementation

**B1.** Implement `makeCounter` using closures:

```javascript
// JavaSolutions/ps/js/makeCounter.js
function makeCounter(initial = 0, step = 1) {
  // TODO: use closure to maintain private state
  // Returns: { increment, decrement, reset, value }
  let count = initial;
  
  return {
    increment: () => { /* TODO */ },
    decrement: () => { /* TODO */ },
    reset: () => { /* TODO */ },
    get value() { return count; }
  };
}

// Test:
const counter = makeCounter(10, 2);
counter.increment(); // 12
counter.increment(); // 14
counter.decrement(); // 12
counter.reset();     // 10
console.log(counter.value); // 10
```

**B2.** Implement `memoize` using closures:

```javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Test: memoized Fibonacci
const fib = memoize(function f(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});
console.log(fib(40)); // fast — 102334155
```

---

## Problem Set JS-PS2 — Promises & Async/Await

---

### Part A: Predict the Output

**A1 (Medium).** Fix the error — what's wrong?
```javascript
async function loadUser(id) {
  const user = await fetch(`/api/users/${id}`).json();
  return user;
}
```

<details><summary>Answer</summary>

**Bug:** `fetch()` returns a `Promise<Response>` — you must `await` it BEFORE calling `.json()`. `.json()` is called on the Response object (not the Promise), and it also returns a Promise that must be awaited.

**Fix:**
```javascript
async function loadUser(id) {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const user = await response.json();
  return user;
}
```

🔴 **Erklärung:** `fetch().json()` is a very common mistake. `fetch` returns a Promise. You get a `Response` after the first `await`. Then `response.json()` returns another Promise — needs a second `await`. Also always check `response.ok` — `fetch` does NOT throw on HTTP 4xx/5xx errors.
</details>

---

**A2 (Hard).** What happens here?
```javascript
async function main() {
  try {
    const result = await fetch('https://bad-url-xyz.com/api');
    console.log(result);
  } catch (e) {
    console.log('caught:', e.message);
  }
}
main();
```

<details><summary>Answer</summary>

**Output:** `"caught: Failed to fetch"` (network error)

`try/catch` inside `async` functions catches rejected Promises. A network failure (DNS resolution fails, connection refused) rejects the `fetch` Promise → caught by `catch`.

**What is NOT caught here:**
```javascript
// This error is NOT caught — happens synchronously BEFORE async
async function broken() {
  null.toString(); // TypeError — thrown before any await
}
// But! Because it's async, the function returns a rejected Promise
// You'd catch it with: broken().catch(e => console.log(e))
```
</details>

---

### Part B: Implementation

**B3.** Implement `Promise.allSettled` from scratch:

```javascript
function myAllSettled(promises) {
  // TODO: returns a Promise that resolves when ALL input promises settle
  // Each result: { status: 'fulfilled', value } or { status: 'rejected', reason }
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p)
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  );
}

// Test:
myAllSettled([
  Promise.resolve(1),
  Promise.reject('error'),
  Promise.resolve(3),
]).then(console.log);
// [{status:'fulfilled',value:1}, {status:'rejected',reason:'error'}, {status:'fulfilled',value:3}]
```

**B4.** Implement `AsyncRetry(fn, maxAttempts, delayMs)`:

```javascript
async function asyncRetry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Test:
let callCount = 0;
const flakyApi = () => {
  callCount++;
  if (callCount < 3) throw new Error('Service unavailable');
  return 'success';
};
asyncRetry(flakyApi, 3, 100).then(console.log); // "success" after 2 failures
```

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)
