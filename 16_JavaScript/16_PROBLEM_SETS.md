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
  name: "Alice",
  greet: function () {
    console.log(this.name);
  },
  greetArrow: () => {
    console.log(this.name);
  },
};

obj.greet(); // 1
obj.greetArrow(); // 2

const fn = obj.greet;
fn(); // 3
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
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");
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
  console.log("A");
  const result = await Promise.resolve("data");
  console.log("B", result);
}

console.log("X");
fetchData();
console.log("Y");
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
    increment: () => {
      /* TODO */
    },
    decrement: () => {
      /* TODO */
    },
    reset: () => {
      /* TODO */
    },
    get value() {
      return count;
    },
  };
}

// Test:
const counter = makeCounter(10, 2);
counter.increment(); // 12
counter.increment(); // 14
counter.decrement(); // 12
counter.reset(); // 10
console.log(counter.value); // 10
```

**B2.** Implement `memoize` using closures:

```javascript
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
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

**B3.** Implement `once(fn)` — the returned function runs `fn` on the first call only; every later call returns the SAME cached result without calling `fn` again (used constantly for one-time init, e.g. `initApp = once(realInitApp)`):

```javascript
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      result = fn.apply(this, args);
      called = true;
    }
    return result;
  };
}

// Test:
let calls = 0;
const init = once(() => {
  calls++;
  return "initialized";
});
console.log(init()); // "initialized" — calls: 1
console.log(init()); // "initialized" — calls STILL 1
console.log(init()); // "initialized" — calls STILL 1
```

Same closure shape as `makeCounter` (B1) and `memoize` (B2) — a private variable (`called`, `result`) that only the returned function can see or mutate. The difference from `memoize` is deliberate: `memoize` caches PER distinct argument list; `once` caches a single result regardless of arguments, because it exists to guarantee "this side effect happens exactly once," not "this pure computation is never repeated."

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
    const result = await fetch("https://bad-url-xyz.com/api");
    console.log(result);
  } catch (e) {
    console.log("caught:", e.message);
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

**B4.** Implement `Promise.allSettled` from scratch:

```javascript
function myAllSettled(promises) {
  // TODO: returns a Promise that resolves when ALL input promises settle
  // Each result: { status: 'fulfilled', value } or { status: 'rejected', reason }
  return Promise.all(
    promises.map((p) =>
      Promise.resolve(p)
        .then((value) => ({ status: "fulfilled", value }))
        .catch((reason) => ({ status: "rejected", reason })),
    ),
  );
}

// Test:
myAllSettled([
  Promise.resolve(1),
  Promise.reject("error"),
  Promise.resolve(3),
]).then(console.log);
// [{status:'fulfilled',value:1}, {status:'rejected',reason:'error'}, {status:'fulfilled',value:3}]
```

**B5.** Implement `AsyncRetry(fn, maxAttempts, delayMs)`:

```javascript
async function asyncRetry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Test:
let callCount = 0;
const flakyApi = () => {
  callCount++;
  if (callCount < 3) throw new Error("Service unavailable");
  return "success";
};
asyncRetry(flakyApi, 3, 100).then(console.log); // "success" after 2 failures
```

**B6.** Implement `Promise.all` from scratch. This one has three easy-to-miss requirements that the naive version below deliberately doesn't handle — spot them before checking the answer:

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let remaining = promises.length;

    if (remaining === 0) return resolve([]); // empty input resolves immediately

    promises.forEach((p, index) => {
      Promise.resolve(p) // non-promise values (e.g. plain 5) must resolve too
        .then((value) => {
          results[index] = value; // INDEX-keyed, not push() — order must match input
          remaining--;
          if (remaining === 0) resolve(results);
        })
        .catch(reject); // ANY single rejection rejects the whole thing immediately
    });
  });
}

// Test:
myPromiseAll([Promise.resolve(1), 2, Promise.resolve(3)]).then(console.log);
// [1, 2, 3] — note the plain value `2` resolved correctly

myPromiseAll([Promise.resolve(1), Promise.reject("boom"), Promise.resolve(3)]).catch(
  console.log,
); // "boom" — rejects as soon as ANY promise rejects, doesn't wait for the others
```

🔴 **Erklärung:** The three requirements the spec actually demands: (1) **non-promise values resolve immediately** — `Promise.all([1, 2, 3])` is valid and resolves to `[1, 2, 3]`, which is why every entry gets wrapped in `Promise.resolve(p)` even though most inputs are already promises; (2) **results preserve INPUT order, not settle order** — writing to `results[index]` instead of `results.push(value)` is the entire reason for this, since the fastest promise might be at index 2 and settle before index 0 does; (3) **first rejection wins immediately** — `.catch(reject)` on each individual promise means the very first one to reject calls the outer `reject` right then, without waiting for `remaining` to reach 0, which is why `myPromiseAll` behaves differently from `myAllSettled` (B4) even though their implementations look almost identical.

---

## Problem Set JS-PS3 — Polyfills: Rebuilding `call`/`apply`/`bind` and Array Methods

**Prerequisites:** `16_JavaScript/01_JS_Foundations.md` §8 (execution context, the 4 `this` rules), `16_JavaScript/12_V8_Engine_Internals.md` §5 (hidden classes)

---

### Part A: Predict the Output

**A1 (Medium).** What does this log?

```javascript
function greet(greeting) {
  return `${greeting}, ${this.name}`;
}
const bound1 = greet.bind({ name: "Alice" });
const bound2 = bound1.bind({ name: "Bob" });
console.log(bound2("Hi"));
```

<details><summary>Answer</summary>

**Output:** `"Hi, Alice"` — NOT `"Hi, Bob"`.

`bind` is permanent. Re-binding an already-bound function has no effect — `this` inside `greet` was locked to `{name: "Alice"}` the moment `bound1` was created; `bound2`'s new `this` argument is silently ignored.

🔴 **Erklärung:** B7's polyfill makes this exact: a bound function is a closure over the FIRST `thisArg` it was given. Calling `.bind` again just wraps that already-bound function in another layer that still ultimately calls the same original function with the same locked `this`. There is no way to unbind or re-bind once `.bind` has run once.

</details>

---

**A2 (Medium).** What does this log?

```javascript
const arr = [1, , 3]; // note: a HOLE at index 1
console.log(arr.map((x) => x * 2));
let count = 0;
arr.forEach(() => count++);
console.log(count);
```

<details><summary>Answer</summary>

**Output:** `[2, <1 empty item>, 6]`, then `2` (not 3).

🔴 **Erklärung:** `map`/`forEach`/`filter` explicitly SKIP holes per spec — a hole is not `undefined`, it's an entirely absent index. `map` preserves the hole's position in its output (never calls the callback for it, but leaves a gap there too); `forEach`'s callback simply never runs for that index — `count` only increments for indices 0 and 2. This is precisely why B9's from-scratch versions need `if (!(i in this)) continue;` rather than a naive `for` loop, which would incorrectly invoke the callback with `undefined` for the hole.

</details>

---

### Part B: Implementation

**B7.** Implement `Function.prototype.myBind`:

```javascript
Function.prototype.myBind = function (thisArg, ...boundArgs) {
  const originalFn = this; // the function myBind was called ON
  return function (...callArgs) {
    return originalFn.apply(thisArg, [...boundArgs, ...callArgs]);
  };
};

// Test:
function add(a, b, c) {
  return `${this.label}: ${a + b + c}`;
}
const boundAdd = add.myBind({ label: "sum" }, 1, 2);
console.log(boundAdd(3)); // "sum: 6" — thisArg locked, args accumulate
```

🔴 **Erklärung:** `this` inside `myBind` IS `add`, because `myBind` is invoked as `add.myBind(...)` — an ordinary method call, so the implicit-binding rule (PS1-A2's rule 3) applies to `myBind` itself. Capturing that into `originalFn` before returning the new function is what makes it survive: the returned function closes over `originalFn` and `thisArg`, so no matter how it's later called, `apply(thisArg, ...)` forces the original `this` — the entire point of `bind`.

**B8.** Implement `Function.prototype.myCall` and `myApply`:

```javascript
Function.prototype.myCall = function (thisArg, ...args) {
  const fn = this;
  const uniqueKey = Symbol("fn"); // avoid clobbering an existing property name
  thisArg = thisArg ?? globalThis;
  thisArg[uniqueKey] = fn;
  const result = thisArg[uniqueKey](...args);
  delete thisArg[uniqueKey];
  return result;
};

Function.prototype.myApply = function (thisArg, argsArray = []) {
  return this.myCall(thisArg, ...argsArray); // myApply IS myCall, args pre-spread
};

// Test:
function introduce(city) {
  return `${this.name} from ${city}`;
}
console.log(introduce.myCall({ name: "Alice" }, "NYC")); // "Alice from NYC"
console.log(introduce.myApply({ name: "Bob" }, ["LA"])); // "Bob from LA"
```

🔴 **Erklärung:** `myCall` can't just do `fn(...)` with a chosen `this` — a plain function call always gets rule-4 default binding (PS1-A2). The trick: TEMPORARILY attach `fn` as a real property of `thisArg` (a `Symbol` key so it can't collide with an existing property), call it AS a method of `thisArg` (triggering rule 3 for real), then delete the temporary property — `thisArg` is left exactly as it was, but the call happened with the correct `this`. `myApply` is trivially `myCall` with its array spread — the only real difference between the two in the spec.

**B9.** Implement `Array.prototype.myMap`, `myFilter`, and `myReduce`:

```javascript
Array.prototype.myMap = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (!(i in this)) continue; // skip holes — A2's lesson
    result[i] = callback.call(thisArg, this[i], i, this);
  }
  return result;
};

Array.prototype.myFilter = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (!(i in this)) continue;
    if (callback.call(thisArg, this[i], i, this)) result.push(this[i]);
  }
  return result;
};

Array.prototype.myReduce = function (callback, initialValue) {
  let acc = initialValue;
  let startIndex = 0;
  if (acc === undefined) {
    // no initial value: seed with the first PRESENT element (real spec behavior)
    while (startIndex < this.length && !(startIndex in this)) startIndex++;
    if (startIndex >= this.length) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[startIndex];
    startIndex++;
  }
  for (let i = startIndex; i < this.length; i++) {
    if (!(i in this)) continue;
    acc = callback(acc, this[i], i, this);
  }
  return acc;
};

// Test:
console.log([1, 2, 3].myMap((x) => x * 2)); // [2, 4, 6]
console.log([1, 2, 3, 4].myFilter((x) => x % 2 === 0)); // [2, 4]
console.log([1, 2, 3, 4].myReduce((sum, x) => sum + x, 0)); // 10
console.log([1, 2, 3].myReduce((sum, x) => sum + x)); // 6 — no initial value
```

🔴 **Erklärung:** The easy-to-miss detail is `myReduce` with NO initial value — the real spec doesn't default it to `0`, it seeds `acc` with the array's first PRESENT element and starts iterating from the next index, which matters for non-numeric reduces (strings, finding a max) where `0` would be the wrong seed or the wrong type entirely. `thisArg` on map/filter (rarely used, but genuinely part of the spec) is what `callback.call(thisArg, ...)` provides — without it, a callback expecting a specific `this` would silently get the wrong one.

---

## Problem Set JS-PS4 — Debounce, Throttle & Timing Control

**Prerequisites:** `16_JavaScript/04_JS_Async_Promises.md`, `16_JavaScript/09_Browser_Internals_Rendering.md` §11 (`requestAnimationFrame`)

---

### Part A: Predict the Output

**A1 (Hard).** Calls arrive at `t=0`, `t=100`, `t=250`, `t=600` (ms) against `debounce(fn, 300)`. How many times does `fn` actually execute, and roughly when?

<details><summary>Answer</summary>

**Twice** — once at ≈`t=550`, once at ≈`t=900`.

🔴 **Erklärung:** Every call RESETS the pending timer. `t=0`'s timer (due at 300) gets cancelled by `t=100`'s call (reschedules for 400), which gets cancelled by `t=250`'s call (reschedules for 550) — nothing else arrives before 550, so THAT timer fires. `t=600` arrives AFTER the 550 execution already happened, so it starts a completely fresh, independent debounce window, firing on its own at ≈900. This — not "one call" and not "four calls" — is the single most commonly mispredicted debounce trace.

</details>

---

### Part B: Implementation

**B10.** Implement `debounce(fn, delay)` with `.cancel()` and `.flush()`:

```javascript
function debounce(fn, delay) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    clearTimeout(timeoutId); // A1's "reset the pending timer" mechanism
    timeoutId = setTimeout(() => {
      fn.apply(lastThis, lastArgs);
      timeoutId = null;
    }, delay);
  }

  debounced.cancel = function () {
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  debounced.flush = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      fn.apply(lastThis, lastArgs); // run NOW instead of waiting
      timeoutId = null;
    }
  };

  return debounced;
}

// Test:
const log = debounce((msg) => console.log("fired:", msg), 200);
log("a");
log("b");
log("c"); // only this survives — "fired: c" after 200ms
```

🔴 **Erklärung:** `.cancel()` and `.flush()` both need access to the SAME `timeoutId`/`lastArgs` the inner `debounced` closure holds — that's why they're attached as properties on the returned function itself, letting all three share one closure over the same private state, the identical pattern behind PS1's `makeCounter`/`memoize`/`once`.

**B11.** Implement `throttle(fn, interval)` with leading + trailing edge execution:

```javascript
function throttle(fn, interval) {
  let lastCallTime = 0;
  let timeoutId = null;
  let pendingArgs = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCallTime);

    if (remaining <= 0) {
      // enough time has passed — fire immediately (leading edge)
      clearTimeout(timeoutId);
      timeoutId = null;
      lastCallTime = now;
      fn.apply(this, args);
    } else {
      // too soon — schedule ONE trailing call for when the window opens,
      // always keeping only the MOST RECENT args
      pendingArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          timeoutId = null;
          fn.apply(this, pendingArgs);
        }, remaining);
      }
    }
  }

  return throttled;
}

// Test: calling every 50ms for 500ms against throttle(fn, 200)
// fires at ~0ms, ~200ms, ~400ms — roughly every interval, not on every call.
```

🔴 **Erklärung:** the difference from B10 is the entire point of this section — debounce waits for a QUIET period (resets on every call, so a continuous stream can delay execution forever), throttle guarantees a call happens at MOST once per fixed interval regardless of how continuously it's invoked, by tracking `lastCallTime` and computing how much of the current window remains. The trailing-edge branch exists so the LAST call in a burst still eventually fires — without it, calls arriving mid-window would be silently dropped instead of executing once the window reopens.

---

## Problem Set JS-PS5 — Building a Promise From Scratch

**Prerequisites:** `16_JavaScript/04_JS_Async_Promises.md`, `16_JavaScript/08_JS_Deep_Reasoning.md` (microtask vs macrotask)

---

### Part A: Predict the Output

**A1 (Hard).** What does this log?

```javascript
const p1 = Promise.resolve(1);
const p2 = p1.then((v) => v + 1);
console.log(p1 === p2);
```

<details><summary>Answer</summary>

**Output:** `false`.

🔴 **Erklärung:** `.then` ALWAYS returns a brand-new Promise, never the same one it was called on — this is what makes chaining (`.then().then().then()`) build an actual pipeline instead of every handler attaching to the same original promise. B12 has to implement this explicitly: `then()` constructs and returns a NEW `MyPromise`, never `this`.

</details>

---

### Part B: Implementation

**B12.** Implement a `MyPromise` class from scratch — states, `resolve`/`reject`, `then`/`catch`/`finally`, chaining, and correctly handling a `.then` handler that itself returns another promise:

```javascript
class MyPromise {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";

  constructor(executor) {
    this.state = MyPromise.PENDING;
    this.value = undefined;
    this.callbacks = []; // queued {onFulfilled, onRejected} pairs from .then calls made BEFORE settlement

    const resolve = (value) => this._settle(MyPromise.FULFILLED, value);
    const reject = (reason) => this._settle(MyPromise.REJECTED, reason);

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err); // a throw inside the executor rejects the promise
    }
  }

  _settle(state, value) {
    if (this.state !== MyPromise.PENDING) return; // can only settle ONCE, ever
    this.state = state;
    this.value = value;
    // queueMicrotask: real Promises never call handlers synchronously,
    // even if already settled when .then is attached (Ch04's guarantee)
    queueMicrotask(() => {
      this.callbacks.forEach((cb) => this._runCallback(cb));
      this.callbacks = [];
    });
  }

  _runCallback({ onFulfilled, onRejected, resolveNext, rejectNext }) {
    const handler = this.state === MyPromise.FULFILLED ? onFulfilled : onRejected;
    if (typeof handler !== "function") {
      // no handler for this branch — pass the value/reason straight through
      this.state === MyPromise.FULFILLED ? resolveNext(this.value) : rejectNext(this.value);
      return;
    }
    try {
      const result = handler(this.value);
      // if the handler returned ANOTHER promise/thenable, chain onto IT
      // instead of resolving immediately — this is what makes returning
      // a promise from .then correctly "unwrap" instead of nesting
      if (result && typeof result.then === "function") {
        result.then(resolveNext, rejectNext);
      } else {
        resolveNext(result);
      }
    } catch (err) {
      rejectNext(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolveNext, rejectNext) => {
      const callback = { onFulfilled, onRejected, resolveNext, rejectNext };
      if (this.state === MyPromise.PENDING) {
        this.callbacks.push(callback); // not settled yet — queue for later
      } else {
        queueMicrotask(() => this._runCallback(callback)); // already settled — still async
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally();
        return value;
      },
      (reason) => {
        onFinally();
        throw reason;
      },
    );
  }
}

// Test:
new MyPromise((resolve) => setTimeout(() => resolve(1), 50))
  .then((v) => v + 1)
  .then((v) => new MyPromise((res) => setTimeout(() => res(v * 10), 50))) // returns ANOTHER promise
  .then((v) => console.log("result:", v)) // "result: 20" — unwrapped correctly
  .catch((e) => console.log("never runs"));
```

🔴 **Erklärung:** five separate requirements, each a genuine spec requirement, not an implementation convenience: (1) **settle-once** — `_settle` checks `state !== PENDING` first, matching real Promises where calling `resolve` twice, or `resolve` then `reject`, silently does nothing the second time; (2) **always-async callbacks** — even `.then` on an ALREADY-settled promise still goes through `queueMicrotask` rather than running synchronously, which is what guarantees a `.then` handler never runs before the surrounding synchronous code finishes (Ch04's ordering guarantee); (3) **thenable unwrapping** — when a handler RETURNS a promise, `_runCallback` chains onto it via `result.then(resolveNext, rejectNext)` instead of resolving with "a promise" as the value, which is why `await`-ing a promise that returns a promise never produces a promise-wrapping-a-promise; (4) **a new promise per `.then`**, matching PS5-A1 exactly; (5) **error propagation** — a throw inside a handler is caught and converted to `rejectNext(err)`, the mechanism that lets a `.catch()` three `.then()`s later still catch an error thrown early in the chain, without every intermediate `.then` needing its own error handling.

---

## Problem Set JS-PS6 — Async Concurrency Control

**Prerequisites:** `16_JavaScript/13_NodeJS_Architecture.md` §4 (thread pool), Problem Set JS-PS5 above

---

### Part A: Predict the Output

**A1 (Hard).** 6 tasks: five take 100ms, ONE (`tasks[0]`) takes 2000ms. `batchSize = 3`.

```javascript
async function runInBatches(tasks, batchSize) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);
  }
  return results;
}
```

Roughly how long does this take?

<details><summary>Answer</summary>

**≈2100ms** (2000 + 100) — NOT ≈200ms, even though 5 of the 6 tasks are fast.

🔴 **Erklärung:** `Promise.all(batch.map(...))` waits for the SLOWEST task in each batch before advancing to the next batch. `tasks[0]`'s 2000ms straggler sits in batch 1 alongside two 100ms tasks, so the ENTIRE first batch is gated on it — batch 2 can't even start until batch 1 fully finishes, even though 4 of the other 5 fast tasks sit idle waiting their turn in batch 2. This is exactly why naive batching "leaks throughput on uneven task durations" — B13's true pool fixes it by refilling a slot the INSTANT any single task finishes, never waiting for an entire batch to clear.

</details>

---

### Part B: Implementation

**B13.** Implement `asyncPool(limit, items, iteratorFn)` — run at most `limit` tasks concurrently, starting a new one the instant any slot frees up (the real fix for A1's problem):

```javascript
async function asyncPool(limit, items, iteratorFn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++; // claim the next item, then move on
      results[currentIndex] = await iteratorFn(items[currentIndex], currentIndex);
    }
  }

  // start exactly `limit` workers — each loops, pulling the NEXT unclaimed
  // item the moment it finishes its current one
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// Test: same 6 tasks as A1, pool of 3
const delay = (ms, val) => new Promise((r) => setTimeout(() => r(val), ms));
const durations = [2000, 100, 100, 100, 100, 100];
asyncPool(3, durations, (ms, i) => delay(ms, `task${i} done`)).then((r) => console.log(r));
// Total time: ~2000ms, not ~2100ms — the five 100ms tasks all finish WHILE
// the 2000ms task is still running, using freed-up slots instead of being
// gated behind it in a separate batch.
```

🔴 **Erklärung:** A1's bug was structural — it re-synchronizes ALL workers at every batch boundary via `Promise.all`. This fix removes the boundary entirely: `limit` independent `worker()` loops start ONCE, each a `while` loop pulling the next unclaimed `nextIndex` for as long as items remain — a worker that finishes a fast task immediately grabs the next available item instead of waiting for its siblings. `nextIndex++` is doing real work: because JS is single-threaded (Ch01 §8's call-stack guarantee), incrementing a shared closure variable needs no lock — two workers can never claim the same index, because only one worker's synchronous code is ever running at a given instant.

**B14.** Implement a token-bucket rate limiter — `limiter.allow()` returns `true` if the action is allowed right now, `false` if the caller is over the limit:

```javascript
function createRateLimiter(maxTokens, refillIntervalMs) {
  let tokens = maxTokens;
  let lastRefillTime = Date.now();

  function refill() {
    const now = Date.now();
    const elapsed = now - lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / refillIntervalMs);
    if (tokensToAdd > 0) {
      tokens = Math.min(maxTokens, tokens + tokensToAdd);
      lastRefillTime = now;
    }
  }

  return {
    allow() {
      refill(); // lazy refill — compute elapsed time on EVERY check, no background timer needed
      if (tokens > 0) {
        tokens--;
        return true;
      }
      return false;
    },
  };
}

// Test: 3 tokens, refilling 1 every 1000ms
const limiter = createRateLimiter(3, 1000);
console.log(limiter.allow()); // true  (tokens: 3 -> 2)
console.log(limiter.allow()); // true  (tokens: 2 -> 1)
console.log(limiter.allow()); // true  (tokens: 1 -> 0)
console.log(limiter.allow()); // false (no tokens left)
```

🔴 **Erklärung:** the "lazy refill" design — computing `tokensToAdd` from elapsed wall-clock time INSIDE `allow()`, rather than running a background `setInterval` — means the limiter costs zero CPU when nobody's calling it, and doesn't create an open handle that keeps the process alive (Chapter 13 §5). This is deliberately different from B10/B11: throttle guarantees SPACING between individual calls; a token bucket allows BURSTS up to its capacity and only then starts limiting — several calls in the same millisecond are all allowed here if tokens are available, which throttle would never permit.

---

## Problem Set JS-PS7 — Data Structures in JS Idiom

**Prerequisites:** `16_JavaScript/03_JS_Objects_Prototypes.md`, `16_JavaScript/12_V8_Engine_Internals.md` §5 (hidden classes)

---

### Part A: Predict the Output

**A1 (Medium).** What does this log?

```javascript
const obj = {};
obj.b = "second";
obj[2] = "index-two";
obj.a = "first";
obj[1] = "index-one";
console.log(Object.keys(obj));
```

<details><summary>Answer</summary>

**Output:** `["1", "2", "b", "a"]`.

🔴 **Erklärung:** a real, spec-mandated exception to "objects iterate in insertion order" — integer-like string keys (keys that round-trip cleanly through `String(Number(key))`) are ALWAYS enumerated FIRST, in ascending NUMERIC order, regardless of insertion time; only after those does the engine fall back to true insertion order for everything else. `obj[2]` was added before `obj[1]`, but `1` still sorts before `2` in the output. This ordering rule is part of why V8's hidden classes (Chapter 12 §5) treat array-indexed properties differently from named ones internally.

</details>

---

### Part B: Implementation

**B15.** Implement an `LRUCache` (get/put in O(1), evicts the Least Recently Used entry when full):

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map remembers INSERTION order — the mechanism this relies on
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key); // re-inserting below moves it to the "most recent" end
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key); // refresh position if it already existed
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value; // Map iterates oldest-inserted FIRST
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test: capacity 2
const lru = new LRUCache(2);
lru.put(1, "a");
lru.put(2, "b");
console.log(lru.get(1)); // "a" — and 1 is now the MOST recently used
lru.put(3, "c"); // cache full — evicts 2 (LEAST recently used; 1 was just touched)
console.log(lru.get(2)); // -1 — evicted
console.log(lru.get(1)); // "a" — still there
console.log(lru.get(3)); // "c"
```

🔴 **Erklärung:** the entire implementation rests on one fact about `Map` — unlike plain objects (PS7-A1's integer-key exception), a JS `Map` guarantees strict insertion order for EVERY key type, no exceptions. `delete` then `set` on the same key "touches" an entry: removing and re-inserting moves it to the end of that order, so `.keys().next().value` (the FIRST key in iteration order) is always genuinely the least-recently-touched one. Without `Map`'s ordering guarantee, this would need a hand-rolled doubly-linked list to get O(1) — `Map` gives the same guarantee for free.

**B16.** Implement an `EventEmitter` (on/off/once/emit, multiple listeners per event):

```javascript
class EventEmitter {
  constructor() {
    this.listeners = new Map(); // eventName -> Set of handler functions
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return this; // chainable: emitter.on('a', fn).on('b', fn2)
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper); // remove BEFORE calling, in case the handler re-triggers the event
      handler(...args);
    };
    this.on(event, wrapper);
    return this;
  }

  emit(event, ...args) {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
    return this.listeners.has(event) && this.listeners.get(event).size > 0;
  }
}

// Test:
const bus = new EventEmitter();
const onMsg = (data) => console.log("heard:", data);
bus.on("message", onMsg);
bus.once("message", (data) => console.log("once:", data));
bus.emit("message", "hi"); // "heard: hi" AND "once: hi"
bus.emit("message", "again"); // only "heard: again" — once's listener already removed itself
bus.off("message", onMsg);
bus.emit("message", "gone"); // nothing logs
```

🔴 **Erklärung:** `once`'s wrapper removes ITSELF from the listener `Set` before invoking the real handler, not after — if it removed after, a handler that synchronously re-triggers the same event would still see its own still-registered wrapper and fire twice. Using a `Set` (not an array) for each event's handlers makes `off` an O(1) removal by reference, and — same reasoning as B8's Symbol trick — a function is unique by reference, so accidentally registering the identical function twice is naturally deduplicated as a side effect of `Set` semantics.

**B17.** Implement `deepClone(value)` — handles nested objects/arrays, circular references, and `Date`:

```javascript
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value; // primitives are already "copies"
  if (value instanceof Date) return new Date(value.getTime());
  if (seen.has(value)) return seen.get(value); // CYCLE — return the clone already started

  const clone = Array.isArray(value) ? [] : {};
  seen.set(value, clone); // register BEFORE recursing, so a cycle back to `value` finds it

  for (const key of Object.keys(value)) {
    clone[key] = deepClone(value[key], seen);
  }
  return clone;
}

// Test:
const original = { name: "root", date: new Date(2024, 0, 1), children: [{ name: "child" }] };
original.self = original; // circular reference

const cloned = deepClone(original);
console.log(cloned.children[0] !== original.children[0]); // true — genuinely a new object
console.log(cloned.self === cloned); // true — the CYCLE was cloned correctly, not infinite-looped
console.log(cloned.date instanceof Date && cloned.date !== original.date); // true
```

🔴 **Erklärung:** without the `WeakMap`, `original.self = original` sends `deepClone` into infinite recursion — cloning `self` tries to clone `original` again, which tries to clone `self` again, forever. Registering `clone` into `seen` BEFORE recursing into its properties (not after) is what makes the cycle resolve: by the time recursion reaches `original.self`, `seen.has(original)` is already `true`, so it returns the still-being-built `clone` directly, closing the loop instead of re-entering infinitely. `WeakMap` specifically (not `Map`) means these tracking entries don't keep the ORIGINAL objects artificially alive after cloning finishes — [Chapter 3](03_JS_Objects_Prototypes.md)'s WeakMap-and-GC mechanism, applied for real here.

---

## Problem Set JS-PS8 — Functional Programming Patterns

**Prerequisites:** `16_JavaScript/02_JS_Functions_Closures.md` (currying, closures)

---

### Part A: Predict the Output

**A1 (Medium).** What does this log?

```javascript
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

const addOne = (x) => x + 1;
const double = (x) => x * 2;
const piped = pipe(addOne, double, addOne);
console.log(piped(3));
```

<details><summary>Answer</summary>

**Output:** `9`.

🔴 **Erklärung:** `pipe` reads left-to-right — `3` goes into `addOne` first (→4), then `double` (→8), then `addOne` again (→9). `reduce`'s accumulator IS the running value, and each function is applied to whatever the PREVIOUS one returned, in array order. This is the opposite convention from mathematical function composition (`f(g(x))`, right-to-left) — the distinction B19 implements both directions of.

</details>

---

### Part B: Implementation

**B18.** Implement a generic `curry(fn)` that works for any fixed-arity function, supporting partial application in any grouping:

```javascript
function curry(fn) {
  const arity = fn.length; // number of DECLARED parameters — the mechanism this depends on
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

// Test:
const add3 = (a, b, c) => a + b + c;
const curriedAdd3 = curry(add3);
console.log(curriedAdd3(1)(2)(3)); // 6 — one at a time
console.log(curriedAdd3(1, 2)(3)); // 6 — grouped differently
console.log(curriedAdd3(1)(2, 3)); // 6 — grouped a third way
console.log(curriedAdd3(1, 2, 3)); // 6 — all at once, no currying needed
```

🔴 **Erklärung:** `fn.length` — a genuinely underused piece of the language — returns the number of parameters a function was DECLARED with (not counting rest params or defaulted ones), exactly the "how many arguments am I still waiting for" count `curry` needs. Each call to `curried` checks whether enough arguments have accumulated; if not, it returns a NEW function closing over the args-so-far that, when called, recurses with the combined list — the same "returned function remembers private state via closure" pattern as every PS1 problem, just recursing instead of mutating a counter.

**B19.** Implement `compose(...fns)` (right-to-left, mathematical convention) and `pipe(...fns)` (left-to-right, PS8-A1's convention):

```javascript
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x);
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

// Test: same three functions, both directions
const addOne = (x) => x + 1;
const double = (x) => x * 2;
const square = (x) => x * x;

console.log(pipe(addOne, double, square)(3)); // ((3+1)*2)^2 = 64
console.log(compose(addOne, double, square)(3)); // (3^2)*2 + 1 = 19
```

🔴 **Erklärung:** the ONLY difference between the two is `reduce` vs `reduceRight` — `pipe` folds left-to-right (first listed function runs first); `compose` folds right-to-left (LAST listed function runs first, matching mathematical notation where `compose(f, g, h)(x)` means `f(g(h(x)))`). Both are one-line implementations once B18's closure pattern and PS8-A1's "reduce IS the pipeline" insight are already understood — the payoff of the whole problem set: by this point, "a function that returns a function that closes over some state" isn't a special trick anymore, it's just how you write JS.

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)


---

## Reality Check

**"JS problem sets are DSA problems in JavaScript syntax"** → JS-specific problem sets exist because the language ITSELF is the problem domain: implement debounce with cancel and flush, write Promise.all from scratch, build an event emitter with once semantics, deep-clone with cycle handling, flatten with depth control. These test closure mechanics, promise-resolution rules, and reference semantics — none of which a translated two-sum touches. Frontend loops interview on exactly this genre; grinding only algorithm sets leaves the actually-asked material untrained.

**"Implementing library functions is busywork — lodash exists"** → Re-implementation is the only exercise that FORCES the edge-case contracts into view: does your debounce preserve this and arguments (most first attempts do not), does your Promise.all handle non-promise values and empty arrays (the spec says resolve immediately — most miss it), does your once return the cached result or undefined on subsequent calls, does your clone preserve prototypes or produce plain objects? Using lodash daily while unable to write bind is API familiarity impersonating understanding — and the impersonation fails at debugging time, when the abstraction leaks.

**"Polyfill problems test whether you memorized the spec"** → They test RESOLUTION SEMANTICS people think they know: your Promise.all implementation must count settlements (not use array push order), preserve INDEX correspondence (results in input order regardless of settle order), and reject-fast while ignoring later settlements — three decisions that reveal whether the promise model is real or vibes. Same with call/apply polyfills (temporary property assignment — the this mechanism laid bare) and Array.prototype.map (holes in sparse arrays — the spec corner that distinguishes reading from having read).

**"Async problem-set questions are solved by adding async/await"** → The graded async problems are SCHEDULING designs: a promise pool (run n at a time from a task list — the interview classic that fails everyone who only knows Promise.all), retry with exponential backoff and jitter, a rate limiter, sequential-versus-parallel-versus-batched trade-offs stated aloud. The pool problem specifically separates levels: it requires treating promises as resources with a refill loop, not as syntax — and its naive versions (chunked batches instead of a true pool) leak throughput on uneven task durations, a distinction worth articulating.

**"Completing the set once means the material is covered"** → This genre decays FASTER than algorithms because the details are arbitrary-feeling until re-derived (which argument does reduce's callback take first? does setTimeout in a loop capture the let binding?): the retention protocol is re-implementation from a BLANK file — no reference — for the core eight (debounce, throttle, once, memoize, deepClone, EventEmitter, Promise.all, promise pool) on a monthly-ish cadence. Each re-derivation is faster and surfaces exactly which mechanic went soft; reading last month's solution surfaces nothing.
