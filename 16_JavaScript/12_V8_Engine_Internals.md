**Navigation**: [< Previous](11_Advanced_Web_APIs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_NodeJS_Architecture.md)

# ⚙️ Chapter 12 — V8 Engine Internals: How JavaScript Actually Runs

**"`for...in` is 'slow' and arrays with mixed types are 'slow' — every JS developer has heard this. Almost none can say WHY. The answer isn't folklore, it's four concrete mechanisms inside V8: hidden classes, inline caches, elements kinds, and a two-tier compiler pipeline. Once you see the mechanism, the 'gotchas' stop being rules to memorize and become predictions you can derive."**

---

## Table of Contents

1. [What V8 Actually Owns](#1-what-v8-actually-owns)
2. [From Source Text to Running Code — The Pipeline](#2-from-source-text-to-running-code--the-pipeline)
3. [Parsing — Why V8 Reads Your Code Twice](#3-parsing--why-v8-reads-your-code-twice)
4. [Ignition — The Bytecode Interpreter](#4-ignition--the-bytecode-interpreter)
5. [Hidden Classes — The Mechanism Behind "Consistent Object Shapes Are Fast"](#5-hidden-classes--the-mechanism-behind-consistent-object-shapes-are-fast)
6. [Inline Caches — Why the Same Line of Code Gets Faster](#6-inline-caches--why-the-same-line-of-code-gets-faster)
7. [Elements Kinds — Why Arrays Are Not Just Arrays](#7-elements-kinds--why-arrays-are-not-just-arrays)
8. [TurboFan — The Optimizing Compiler](#8-turbofan--the-optimizing-compiler)
9. [Deoptimization — When V8's Bet Doesn't Pay Off](#9-deoptimization--when-v8s-bet-doesnt-pay-off)
10. [The Memory Heap — Generations, Not One Big Pile](#10-the-memory-heap--generations-not-one-big-pile)
11. [Garbage Collection — Scavenge and Mark-Sweep-Compact](#11-garbage-collection--scavenge-and-mark-sweep-compact)
12. [Closures in V8 Terms — What a Closure Actually Pins in Memory](#12-closures-in-v8-terms--what-a-closure-actually-pins-in-memory)
13. [Reading It Yourself — DevTools and `--trace` Flags](#13-reading-it-yourself--devtools-and---trace-flags)

---

## 1. What V8 Actually Owns

Chapter 4 covered the event loop — the mechanism that decides **when** a piece of JS gets to run. This chapter covers something different: what happens **inside** the box labeled "run this function" once the event loop hands it control.

> **The division of labor, precisely.** "The JavaScript engine" is a specific piece of software — V8, in Chrome and Node.js (SpiderMonkey in Firefox, JavaScriptCore in Safari play the equivalent role). V8's job is narrow and total: turn JS source text into running machine instructions, execute them, and manage the memory those instructions allocate. It does **not** know what `setTimeout` is, does not talk to the network, does not touch the DOM. Those are the *runtime's* job — the browser's Web APIs or Node's C++/libuv layer, sitting outside V8 and calling into it only to run callbacks.
>
> **Why draw this line at all.** Because every "JS is slow" or "JS is fast" claim you've heard is really a claim about ONE of these two systems, and they fail for completely different reasons. A `fetch` that hangs is a network/runtime problem — V8 is idle, waiting. A `for` loop over a million elements that pins the tab is a V8 problem — the runtime isn't involved at all. Diagnosing performance requires knowing which system you're even looking at, and this chapter is entirely about the second one: what V8 does with the synchronous code it's handed.

---

## 2. From Source Text to Running Code — The Pipeline

Here is the concrete path one function takes from the moment you write it to the moment it's fast:

```mermaid
sequenceDiagram
    autonumber
    participant You as Your source file
    participant Parser as Parser
    participant Ignition as Ignition (bytecode interpreter)
    participant Feedback as Feedback Vector (per call site)
    participant TurboFan as TurboFan (optimizing JIT)
    participant CPU as Running machine code

    You->>Parser: function add(a, b) { return a + b; }
    Parser->>Parser: tokenize -> build AST
    Parser->>Ignition: compile AST -> bytecode (fast to produce, compact)
    Ignition->>CPU: interpret bytecode, run add(1, 2)
    Ignition->>Feedback: record: "a and b were both Smi (small integers)"

    Note over Ignition,Feedback: Calls 2 through ~a few thousand: same path.<br/>Each call updates the feedback vector at this call site.

    Ignition->>TurboFan: call count crosses threshold -> mark "hot"
    TurboFan->>Feedback: read accumulated type feedback
    TurboFan->>TurboFan: compile SPECULATIVE machine code:<br/>"assume a and b are always Smi, skip all the generic-add checks"
    TurboFan->>CPU: install optimized machine code for add()
    CPU-->>You: add() now runs at near-native speed

    Note over CPU,You: If a later call passes a string or object,<br/>the assumption breaks -> deoptimize (Section 9).
```

**The two names to hold onto:** **Ignition** is the bytecode interpreter — it runs first, runs everything, and is designed to start fast and collect information. **TurboFan** is the optimizing compiler — it runs later, only for code that's actually hot, and produces genuinely fast machine code by betting on the patterns Ignition observed. (Since 2021, V8 also has **Sparkplug**, a very fast non-optimizing baseline compiler that sits between Ignition and TurboFan, and **Maglev**, a mid-tier optimizing compiler added in 2024 — both exist purely to shrink the gap before TurboFan kicks in. The three-name mental model of *interpret → observe → optimize* still holds; V8 just added faster rungs on that same ladder.)

This whole pipeline exists because of one tension: **compiling straight to optimized machine code is slow to produce but fast to run; interpreting bytecode is fast to produce but slow to run.** A web page loads hundreds of functions that run once and never again (event handler setup, one-time init). Fully optimizing all of them would waste time compiling code that never benefits. Only functions that actually run *many times* (loops, hot call sites) earn the cost of full optimization. The two-tier pipeline is V8 paying the optimization cost only where it pays off.

---

## 3. Parsing — Why V8 Reads Your Code Twice

> **What parsing does.** Source text is a flat string. Before anything can run, V8 must turn it into an **Abstract Syntax Tree (AST)** — a tree of nodes like `BinaryExpression(+, Identifier(a), Identifier(b))` that captures the code's structure, not its characters.
>
> **The twist: V8 usually does this in two passes, on purpose.** When V8 first encounters a `function`, it doesn't fully parse the body. It runs a cheap **pre-parse**: just enough to find the function's boundaries (where it starts and ends) and check for syntax errors, without building a full AST for the inside. The full parse only happens the first time the function is actually **called**.
>
> **Why.** A typical page defines far more functions than it calls on that page load — utility functions used only on other routes, event handlers for features the user never touches, library code for edge cases. Fully parsing all of it up front burns CPU time and memory building ASTs nobody will use. Pre-parsing lets V8 skip that work for the majority of functions, and pay the full parse cost lazily, exactly once, only for functions that actually execute.

```javascript
function neverCalled() {
  // V8 pre-parses this: confirms it's syntactically valid,
  // records where it starts/ends, builds NO full AST for the body.
  const x = someExpensiveLookingButUnusedComputation();
  return x * 2;
}

function add(a, b) {
  return a + b;
}

console.log(add(1, 2)); // <- THIS call triggers the full parse of add(),
                         //    not neverCalled(). neverCalled() stays pre-parsed
                         //    for the entire session if it's genuinely never invoked.
```

**The practical consequence — the IIFE-wrapping advice you've seen in old style guides.** Wrapping code in `(function() { ... })()` used to be recommended partly because eagerly-invoked functions get parsed immediately (no benefit there), while *unwrapped top-level code outside any function* has always been eagerly, fully parsed — there's no "call" event to defer to. The pre-parse optimization is specifically about function bodies that might never run. It has nothing to do with variable scoping (that's a separate, still-valid reason to use module scope or an IIFE) — but the performance folklore around it usually conflates the two.

---

## 4. Ignition — The Bytecode Interpreter

Once a function is fully parsed into an AST, Ignition compiles that AST into **bytecode** — not machine code, an intermediate instruction set specific to V8, interpreted rather than run directly by the CPU.

> **Why bytecode and not machine code, immediately.** Machine code is fast to run but large and slow to generate well (a good compiler does register allocation, instruction scheduling, dead-code elimination — all expensive analysis). Generating *naive* machine code is possible but produces code barely faster than a good interpreter, for a much higher generation cost and a much larger memory footprint (machine code is bulkier per operation than compact bytecode). For code that runs once, that trade is a pure loss. Ignition's bytecode is deliberately compact — small enough that a memory-constrained mobile device can hold bytecode for far more of the page's code than it could hold optimized machine code for the same code.
>
> **What Ignition does while it interprets, that a naive interpreter wouldn't.** Every time a bytecode instruction touches a value — a property read, an arithmetic op, a function call — Ignition records what it saw into a **feedback vector** attached to that specific call site: "this `+` operation's operands were both small integers," "this `.name` access was on an object shaped like `Map47`." This is pure bookkeeping laid on top of interpretation — cheap to collect because Ignition is already looking at the value to execute the operation anyway. That feedback is the entire input TurboFan will later use to decide what to assume.

This is the mechanism that makes the next four sections possible: **hidden classes** and **elements kinds** are what Ignition's feedback vectors actually record; **inline caches** are how that recorded feedback speeds up Ignition's *own* interpretation, before TurboFan is even involved.

---

## 5. Hidden Classes — The Mechanism Behind "Consistent Object Shapes Are Fast"

JavaScript objects are dynamic — you can add or delete properties at any time. But looking up a property by name (`obj.name`) on every single access, the way you'd look up a key in a hash map, is far slower than languages like Java or C++ where a class's fields are fixed and each field lives at a known, fixed offset in memory. V8 wants that fixed-offset speed for JS objects too, without giving up JS's dynamism. **Hidden classes** (V8 calls them **Maps** internally — unrelated to the JS `Map` data structure, and often called **Shapes** in other engines) are how.

> **The mechanism.** Every object V8 creates has a hidden class describing its current shape: which property names it has, and at what offset each one lives. When you create an object and then add a property to it, V8 doesn't mutate that hidden class — it creates a **new** hidden class representing the new shape, and links the old one to the new one via a **transition**. Objects that go through the same sequence of property additions end up sharing the same chain of hidden classes and land on the identical final hidden class — which is exactly what lets V8 treat "this specific offset holds the `name` property" as a compile-time fact instead of a runtime lookup.

Trace what actually happens for two objects built with the **same properties added in a different order**:

```javascript
function makePointA(x, y) {
  const p = {};
  p.x = x; // transition: {} -> {x}
  p.y = y; // transition: {x} -> {x, y}
  return p;
}

function makePointB(x, y) {
  const p = {};
  p.y = y; // transition: {} -> {y}
  p.x = x; // transition: {y} -> {y, x}
  return p;
}
```

```mermaid
sequenceDiagram
    autonumber
    participant A as makePointA()
    participant B as makePointB()
    participant HC as V8 Hidden Class Graph

    A->>HC: new {} -> hidden class C0 (no properties)
    A->>HC: add "x" -> transition to C1 { x @offset0 }
    A->>HC: add "y" -> transition to C2 { x @offset0, y @offset1 }
    Note over A,HC: Object from makePointA ends on hidden class C2

    B->>HC: new {} -> hidden class C0 (SAME starting class, shared)
    B->>HC: add "y" -> transition to C3 { y @offset0 }
    B->>HC: add "x" -> transition to C4 { y @offset0, x @offset1 }
    Note over B,HC: Object from makePointB ends on hidden class C4 -- DIFFERENT from C2!

    Note over A,B: Same final property NAMES {x, y}.<br/>DIFFERENT hidden classes, because the offsets don't match<br/>(x is offset 0 in C2, but offset 1 in C4).
```

**Why this matters in practice.** Any code that reads `.x` from a mix of `makePointA()` and `makePointB()` results is reading from objects with two *different* hidden classes, even though every object "has an x and a y." That call site cannot assume a single fixed offset for `.x` — it has to check which shape it's looking at every time. This is the entire reason for the classic advice "always initialize an object's properties in the same order, ideally in a constructor" — it's not a style preference, it's the only way to guarantee every instance shares one hidden class.

```javascript
// ✅ Guarantees identical hidden classes for every instance —
// properties assigned in the same order, every time, from one place.
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
```

---

## 6. Inline Caches — Why the Same Line of Code Gets Faster

Hidden classes give V8 a fixed offset per shape. **Inline Caches (ICs)** are how a specific *call site* in your code remembers that offset so it can skip the lookup on repeat visits.

> **The mechanism, traced.** Every property-access instruction in the bytecode (`obj.x`) has its own IC slot. The first time that instruction runs, V8 does the full lookup — walk the hidden class, find `x` at offset 0 — and then **caches** the result at that instruction: "if you see hidden class C2 again, `x` is at offset 0, no lookup needed." The next time that exact bytecode instruction runs, it checks: is the incoming object's hidden class still C2? If yes, jump straight to offset 0 — no property search, just a pointer offset read. That's a **monomorphic** IC — one shape seen, one shape remembered, fastest possible path.
>
> **What happens when a second shape shows up at the same call site.** The IC doesn't just overwrite its cache — it upgrades to **polymorphic**: it now stores a small list of (hidden class → offset) pairs (V8 handles up to 4 by default) and checks each on lookup. Still fast — a handful of pointer comparisons — just not as fast as monomorphic's single check.
>
> **What happens past 4 shapes.** The IC gives up trying to cache specific shapes and goes **megamorphic**: it falls back to a global, shared, general-purpose lookup (a dictionary keyed by property name), the same kind of lookup every JS engine without hidden classes would do for every access. This is the slow path — and it's "slow" only relative to monomorphic, not slow in any absolute sense; it's what you'd get by default in a simpler engine.

```javascript
function getX(obj) {
  return obj.x; // ONE call site, in ONE function.
}

// Call this 10,000 times with the SAME shape:
for (let i = 0; i < 10000; i++) getX({ x: i, y: 0 }); // monomorphic IC — fastest

// Call this with 5+ DIFFERENT shapes:
getX({ x: 1, y: 2 });               // shape A
getX({ x: 1, y: 2, z: 3 });         // shape B
getX({ x: 1, name: "p" });          // shape C
getX({ x: 1, active: true });       // shape D
getX({ x: 1, tag: "x" });           // shape E -- 5th distinct shape
// The getX call site's IC has now gone megamorphic.
// EVERY future call through this function, even with a shape it's
// already seen, pays the generic-lookup cost from here on.
```

**Why "polymorphic functions are slower" is really an IC story, not a "V8 hates flexibility" story.** A function isn't inherently penalized for accepting varied inputs — the penalty is specifically that its property-access call sites can no longer commit to one offset. Code that processes a genuinely heterogeneous collection (a mixed-shape array from an API response, say) will run those property accesses megamorphic no matter how you write the loop — the fix is normalizing the shapes *before* the hot loop (e.g., mapping every item through one constructor first), not micro-tweaking the loop syntax.

---

## 7. Elements Kinds — Why Arrays Are Not Just Arrays

Everything in Sections 5–6 covers **named properties**. Arrays get their own, parallel optimization for **indexed** access (`arr[i]`), called **elements kinds** — and it's one of the highest-leverage, least-known V8 mechanisms for everyday performance.

> **The mechanism.** Internally, an array's elements are stored in one of several backing-store representations, ranked from fastest/most specific to slowest/most general:
>
> 1. **`PACKED_SMI_ELEMENTS`** — every slot filled (no holes), every value a small integer (Smi = "small integer," V8's tagged representation for integers that fit in 31 bits). Stored as a flat, densely packed array of raw integers.
> 2. **`PACKED_DOUBLE_ELEMENTS`** — every slot filled, values are floating-point numbers. Flat array of raw doubles.
> 3. **`PACKED_ELEMENTS`** — every slot filled, but values are a mix of types (strings, objects, mixed numbers) or not statically known to be numeric. Stored as an array of tagged pointers, like a generic object property.
> 4. **`HOLEY_*` variants of the above** — same value-type rules, but the array has *gaps* (created by `delete arr[i]`, `arr.length = n` shrinking, or `new Array(5)` then filling out of order). Every read now needs an extra check: "is this slot actually filled, or do I need to walk the prototype chain for a hole?"
> 5. **`DICTIONARY_ELEMENTS`** — the array has been used so sparsely or irregularly (huge index gaps, non-integer-like keys) that V8 gives up on array-shaped storage entirely and falls back to a hash map, same as a slow generic object.
>
> **The one-way ratchet.** An array can transition from a fast kind to a slower kind, but **never back**. Once an integer array receives one `NaN` or one hole, it's permanently in the slower kind for its lifetime — even if you later "fix" the contents.

```javascript
const arr = [1, 2, 3, 4, 5];
// elements kind: PACKED_SMI_ELEMENTS -- flat, fast, tightly packed integers.

arr.push(6.5);
// elements kind transitions to PACKED_DOUBLE_ELEMENTS.
// Every element -- including the integers -- is now stored as a double.
// This transition is PERMANENT for this array object.

arr[10] = 99;
// index 10 on a length-7 array creates indices 7-9 as HOLES.
// elements kind transitions to HOLEY_DOUBLE_ELEMENTS.
// Every read must now check "is this a hole?" before trusting the value.

arr.push("done");
// a string in a numeric array -- elements kind transitions to
// HOLEY_ELEMENTS: the most general, slowest kind this array can reach.
// There is no path back to PACKED_SMI_ELEMENTS for this array, ever.
```

**Why this is worth knowing, concretely.** A tight numeric loop over a `PACKED_SMI_ELEMENTS` array can be auto-vectorized and iterated almost like a C array — V8 knows every slot is filled and every value is a raw integer, no type checks needed per element. The same loop over a `HOLEY_ELEMENTS` array pays a hole-check and a type-check on every single access. Two loops that look identical in your source can differ by an order of magnitude purely because of how the array was built. This is why `new Array(length)` followed by filling it out of order, or `delete`-ing individual array indices, is specifically called out as an anti-pattern in performance guides — `arr.pop()` / `arr.splice()` from the end, or building with `.push()` in order, keep the array packed.

---

## 8. TurboFan — The Optimizing Compiler

Ignition + hidden classes + ICs already make interpretation fast. TurboFan exists for the next tier: functions called often enough (a call-count threshold, or enough loop iterations) that paying for genuinely optimized machine code is worth it.

> **What TurboFan actually does that Ignition can't.** It reads the accumulated feedback vectors for the function — "this call site's IC has stayed monomorphic on hidden class C2 for its entire life," "this arithmetic op has only ever seen Smis" — and compiles machine code that **hard-codes those assumptions**, skipping every check Ignition had to perform at runtime. If `a + b` has only ever been Smi + Smi, TurboFan emits a raw integer-add instruction with no type checks, no boxing, no dispatch. This is **speculative optimization**: TurboFan is betting the future will look like the past, and it's willing to be wrong — because Section 9 describes the safety net for when it is.

This is why a hot function can visibly "warm up" — its first several thousand calls run through Ignition's interpreted bytecode (correct, but doing full type checks every time), then abruptly speed up once TurboFan's optimized version is installed and takes over silently at the same call site.

---

## 9. Deoptimization — When V8's Bet Doesn't Pay Off

TurboFan's optimized code is only valid **as long as its assumptions hold**. The moment a call violates one — a new hidden class shows up, an operand isn't the type it was compiled for — that optimized code is not "slow," it's **wrong**, and V8 must throw it away immediately.

```mermaid
sequenceDiagram
    autonumber
    participant Code as TurboFan-optimized add()
    participant Guard as Assumption guard (compiled into the code)
    participant Deopt as Deoptimizer
    participant Ignition as Ignition (bytecode)

    Code->>Guard: about to run optimized "Smi + Smi" path
    Guard->>Guard: check: are both operands ACTUALLY Smi this time?
    alt assumption holds
        Guard->>Code: proceed with fast raw-integer add
    else assumption violated (e.g. one operand is now a string)
        Guard->>Deopt: BAIL OUT -- assumption broken
        Deopt->>Deopt: reconstruct the exact interpreter state<br/>(stack, variables) as if TurboFan's code never ran
        Deopt->>Ignition: resume execution in bytecode, from that exact point
        Note over Code: this optimized version is discarded (or marked unusable).<br/>Future calls run interpreted again, re-collecting feedback,<br/>until the function re-qualifies for re-optimization.
    end
```

**Why this explains real, observed jank.** A function that runs fast for a while and then suddenly, permanently slows down is very often a deopt: something changed the shape of the values flowing through it (an API response occasionally includes an extra field, a loop occasionally receives `undefined`, a "numbers-only" accumulator gets one string appended). The fix is never "add more code to handle the edge case reactively" — it's making the function's inputs genuinely, structurally consistent so TurboFan's assumptions stay true. This is the same lesson as hidden classes and elements kinds, arriving from a different direction: **consistency is not a style preference in V8's world, it's the literal input to every optimization decision the engine makes.**

---

## 10. The Memory Heap — Generations, Not One Big Pile

Everything above concerns *code*. The rest of this chapter concerns *data* — where the objects those functions create actually live, and how V8 reclaims the ones nobody needs anymore.

> **The core design decision, and the empirical fact behind it.** V8's heap is split into **generations** because of an observed pattern across essentially all programs, called the **generational hypothesis**: *most objects die young*. Loop-local temporaries, one-off intermediate values, short-lived closures — the overwhelming majority of allocations are garbage within microseconds of being created. A small minority survive much longer (a cache, a component's persistent state, a global registry). Treating all objects with one strategy wastes effort scanning long-lived survivors over and over. Splitting the heap by *expected lifetime* lets V8 use a cheap strategy for the common case (short-lived) and a more thorough, less frequent strategy for the rare case (long-lived).

The heap V8 gives your process is divided into (roughly):

| Region | Holds | Collected by | How often |
|---|---|---|---|
| **New Space** (Young Generation) | Freshly allocated objects | Scavenger (Section 11) | Very frequently — it's small and fills fast |
| **Old Space** (Old Generation) | Objects that survived multiple young-gen collections | Mark-Sweep-Compact | Less frequently — mostly incremental/concurrent to avoid pausing |
| **Large Object Space** | Objects too big to fit New Space's allocation scheme (e.g., large arrays/strings) | Marked, never moved/compacted | As needed |
| **Code Space** | Compiled machine code from Ignition/TurboFan | Managed separately from data | N/A |

New Space is deliberately kept **small** (a few MB) — that's not a limitation, it's the design. A small young generation means a scavenge pass finishes fast, because it only has to look at a small region.

---

## 11. Garbage Collection — Scavenge and Mark-Sweep-Compact

> **The reachability model, derived from first principles.** V8 does not use reference counting for its main heap (reference counting can't reclaim cycles — two objects that only reference each other are "referenced" forever even if nothing else in the program can reach them). Instead, V8 uses **tracing**: starting from a known set of **roots** — the call stack's local variables, global object properties, active closures' captured variables — it walks every reachable reference, marking every object it touches. Anything left unmarked at the end is provably unreachable from any root, and is garbage, cycles included, because an isolated cycle simply never gets touched by the walk from the roots.

**New Space collection — the Scavenger (a copying/semi-space collector).** New Space is split into two equal halves, **from-space** and **to-space**. All allocation happens in from-space. When from-space fills up, the Scavenger walks the roots, finds every *live* object currently in from-space, and **copies** just those survivors into to-space — tightly packed, no gaps. Everything left behind in from-space (the vast majority, per the generational hypothesis) is simply abandoned, and the two spaces swap roles for the next cycle. This is fast specifically **because** so few objects survive: copying is proportional to *live* data, not to *total* data, so a young generation with 95% garbage does roughly 5% of the copying work a naive "scan everything" collector would.

An object that survives **two** scavenges is judged long-lived and gets **promoted** to Old Space — it stops being scavenged and becomes Old Space's problem from then on.

**Old Space collection — Mark-Sweep-Compact.** Old Space can't use the copying trick cheaply (too much live data to copy every cycle). Instead: **Mark** — trace from roots, flag every reachable object. **Sweep** — walk the heap linearly, reclaim every unflagged (unreachable) object's memory back into a free list. **Compact** (periodically, not every cycle) — slide surviving objects together to eliminate fragmentation, so large contiguous allocations stay possible. Because Old Space can be large, doing all of this on the main thread in one pause would visibly freeze the page — so V8's Orinoco project made most of this **incremental** (small slices interleaved with your JS) and **concurrent** (running on background threads while your JS keeps executing), specifically to avoid the multi-hundred-millisecond pauses that gave GC its "stop-the-world" reputation.

```mermaid
sequenceDiagram
    autonumber
    participant App as Your running JS
    participant New as New Space (from-space)
    participant Scav as Scavenger
    participant Old as Old Space
    participant MSC as Mark-Sweep-Compact

    App->>New: allocate objects (fast bump-pointer allocation)
    Note over New: from-space fills up
    New->>Scav: trigger minor GC
    Scav->>New: trace roots, find LIVE objects in from-space
    Scav->>New: copy survivors to to-space (compact, no gaps)
    Note over New: from-space/to-space swap. Garbage left behind is just... gone.

    Note over App,Old: an object survives its 2nd scavenge
    Scav->>Old: promote it -- now Old Space's responsibility

    Note over Old: Old Space grows over time
    Old->>MSC: trigger major GC (mostly incremental + concurrent)
    MSC->>Old: MARK: trace roots, flag every reachable object
    MSC->>Old: SWEEP: reclaim memory of unflagged objects
    MSC->>Old: COMPACT (periodic): slide survivors together, defragment
```

---

## 12. Closures in V8 Terms — What a Closure Actually Pins in Memory

Chapter 2 derived closures at the language-spec level: a function captures a reference to its enclosing *environment*, not a snapshot of individual variable values. This section is the same fact, restated as a memory-management consequence.

> **The mechanism.** When V8 creates a closure, it doesn't hand it copies of the variables it uses — it gives it a pointer to a **Context** object (V8's runtime representation of a lexical environment) holding *all* the variables declared in that scope, not just the ones the closure happens to reference. As long as ANY closure created from that scope is reachable, the entire Context — every variable in it — is reachable too, and the GC's tracing walk will not reclaim it.

```javascript
function outer() {
  const hugeBuffer = new Array(1_000_000).fill("x"); // large, allocated once
  const label = "small";

  function inner() {
    console.log(label); // only reads `label` -- never touches hugeBuffer
  }

  return inner;
}

const leaky = outer();
// outer()'s execution finished long ago. But `leaky` (== inner) holds a
// pointer to outer()'s Context object. `hugeBuffer` lives in that SAME
// Context, even though inner() never reads it. As long as `leaky` is
// reachable, hugeBuffer is reachable too -- it cannot be collected.
```

Whether V8's optimizer can, in some cases, prove a specific slot is truly dead and elide it from the Context is an internal detail that changes between V8 versions and should never be relied on. The safe mental model, correct at the language-spec level regardless of any specific engine's cleverness: **a closure keeps its entire enclosing scope reachable, not just the variables it names.** The fix, when this matters, is structural — narrow the scope the closure is created in, or explicitly null out large values you're done with before the closure that outlives them is created.

---

## 13. Reading It Yourself — DevTools and `--trace` Flags

Everything above is directly observable, not just theoretical:

- **Chrome DevTools → Memory tab → Heap Snapshot** shows live objects grouped by constructor/hidden class, and lets you inspect what's keeping a suspected leak reachable (the "Retainers" panel walks the reference chain back to a GC root — the exact mechanism from Section 11).
- **Chrome DevTools → Performance tab → record → look for "Minor GC" / "Major GC" entries** on the main thread track — these are Scavenger and Mark-Sweep-Compact passes happening live, with their actual pause durations.
- **`node --trace-deopt your-script.js`** prints every deoptimization V8 performs, with the reason (e.g., `wrong map`, meaning a hidden-class mismatch — exactly Section 9's mechanism) and the function/line it happened at.
- **`node --trace-ic your-script.js`** prints inline cache state transitions (`Monomorphic` → `Polymorphic` → `Megamorphic`) as they happen, letting you find the exact call site where a hot function's property access degraded.
- **`%GetOptimizationStatus`, `%HasFastProperties`** and other V8-only intrinsics (usable with `node --allow-natives-syntax`) let you query a specific object's or function's optimization state directly from your own code — useful for building minimal, isolated repros of the mechanisms in this chapter rather than trusting folklore.

---

## 🔬 Section Challenges

> **Challenge 1 (Trace — Hidden Classes).** Two functions build "the same" object:
> ```javascript
> function buildA() { const o = {}; o.id = 1; o.name = "a"; return o; }
> function buildB() { const o = { id: 1 }; o.name = "a"; o.extra = true; delete o.extra; return o; }
> ```
> Do `buildA()` and `buildB()` produce objects with the same hidden class? Walk the transition chain for each.
>
> <details><summary>Answer</summary>
>
> **No.** `buildA` transitions `{} → {id} → {id, name}` — two transitions, ending on a hidden class with exactly `{id, name}`. `buildB` transitions `{} → {id}` (via the object literal) `→ {id, name} → {id, name, extra}` (adding `extra`) `→` **a dictionary-mode or a "back to {id,name}-shaped" object depending on V8 version** when `extra` is deleted — but critically, `delete` does not cleanly reverse a transition the way you might hope; historically it either forces the object into slow/dictionary mode or leaves a distinct hidden class that is NOT guaranteed to be identical to the one `buildA` reached by simply never adding `extra` in the first place. The takeaway generalizes beyond the exact mechanism: `delete` on an object property is one of the more reliable ways to push an object off the fast hidden-class path entirely, and two objects that look identical by `JSON.stringify` can be running through completely different, non-shared hidden-class chains because of how they got there — not just what they end with.
>
> </details>

> **Challenge 2 (Reasoning — Inline Caches).** A function `getTotal(item)` reads `item.price * item.qty` and is called in a tight loop over an array where every item comes from `JSON.parse(apiResponse)`. Why might this call site be megamorphic even though every item "looks the same" (same keys, same types) when you `console.log` a sample?
>
> <details><summary>Answer</summary>
>
> `JSON.parse` builds each resulting object by adding keys in the order they appear in the JSON text. If the API's JSON serializer doesn't guarantee stable key ordering across responses (common with objects built from hash maps/dictionaries server-side, or with optional/nullable fields sometimes omitted and sometimes present-but-null), different parsed objects can pick up their properties in different orders — which, per Section 5, produces **different hidden classes** even when the final key set and value types are identical. `console.log` shows you *values*, not the hidden class the object is actually running on, so "looks the same" is not evidence of "is the same shape" — the fix is to normalize each item into a shape via a single constructor/mapping function immediately after parsing, before it enters any hot loop.
>
> </details>

> **Challenge 3 (Debug — Deoptimization).** A numeric summation function runs fast for the first 100,000 calls in a benchmark, then abruptly gets ~10x slower for the rest of the run, and stays slow. What's the most likely V8-level explanation, and what single change to the benchmark would confirm it?
>
> <details><summary>Answer</summary>
>
> Most likely: TurboFan optimized the function early (it's hot, gets called constantly), specializing on whatever types the first ~100,000 calls actually used (e.g., all Smis). Then a later call passed a value outside that assumption — a float, a string, `NaN`, `undefined` — triggering a deopt (Section 9). The function falls back to interpreted Ignition bytecode and, depending on V8's heuristics, may be **marked as unoptimizable for that call site** if the deopt reason recurs, meaning it never gets re-optimized and stays at interpreter speed for the rest of the run. To confirm: run the exact same benchmark with `node --trace-deopt`, and look for a deopt event logged at approximately the 100,000-call mark, with a reason like `wrong map` or a type-mismatch message naming the function.
>
> </details>

---

## Interview Quick-Fire

```
Q: What's the difference between Ignition and TurboFan?
→ Ignition is the bytecode interpreter — runs everything first, collects
  type feedback. TurboFan is the optimizing JIT — compiles hot functions
  to speculative machine code using that feedback. Ignition is fast to
  start; TurboFan is fast to run, but only for code that earns it.

Q: What is a "hidden class" and why does property insertion order matter?
→ V8's internal representation of an object's shape (property names +
  offsets). Objects built by adding the same properties in the same
  order share a hidden class and get fixed-offset access. Same
  properties in a different order produce a different hidden class —
  even though the object "looks the same."

Q: Monomorphic vs polymorphic vs megamorphic — what do these mean?
→ States of an inline cache at one call site, based on how many distinct
  hidden classes it has seen: 1 = monomorphic (fastest, single cached
  offset), 2-4 = polymorphic (small list of cached shapes), 5+ =
  megamorphic (gives up caching, falls back to generic dictionary lookup).

Q: Why does mixing types in an array hurt performance?
→ Arrays have their own "elements kind" (PACKED_SMI_ELEMENTS,
  PACKED_DOUBLE_ELEMENTS, PACKED_ELEMENTS, HOLEY_* variants,
  DICTIONARY_ELEMENTS) ranked fast-to-slow. Adding a float to an int
  array, or creating a hole, transitions the array to a slower kind
  PERMANENTLY — there's no path back to a faster kind for that array.

Q: What triggers a deoptimization?
→ TurboFan compiles machine code assuming the type patterns it observed
  hold going forward. If a later call violates that assumption (wrong
  type, unexpected hidden class), the compiled guard fails, V8 discards
  the optimized code, reconstructs interpreter state, and resumes in
  Ignition bytecode — a "bailout."

Q: Why does V8 have generational garbage collection?
→ The generational hypothesis: most objects die young. A small,
  frequently-collected New Space (copying Scavenger) handles the common
  case cheaply; a larger, less-frequently-collected Old Space
  (Mark-Sweep-Compact, mostly incremental/concurrent) handles the
  minority of long-lived survivors.

Q: Why can a closure cause a memory leak even if it only uses one small variable?
→ A closure holds a pointer to its entire enclosing Context object, not
  just the variables it references. Every variable declared in that
  scope stays reachable — and un-collectable — as long as any closure
  from that scope is reachable, including large values the closure
  never touches.
```

---

**Next Chapter**: [Node.js Architecture →](13_NodeJS_Architecture.md)

---

## Reality Check

**"V8 just runs your JavaScript"** → V8 runs a PIPELINE, and which stage your code is in determines its speed by an order of magnitude: freshly-called code runs interpreted (Ignition) with full type checks every operation; code that gets hot enough earns speculative machine code (TurboFan) with those checks compiled away entirely; code whose assumptions later break gets kicked back to interpreted (deoptimization) — the same function, same source, running at three different speeds across its own lifetime depending on what V8 has learned and whether that learning still holds.

**"Objects with the same properties are the same shape"** → Same PROPERTY NAMES is not the same hidden class — the mechanism keys on insertion order too, so two objects with identical final property sets built via different construction paths (different literal order, conditionally-added fields, `delete` then re-add) can be running on entirely different hidden classes, silently pushing every call site that handles both into polymorphic or megamorphic mode. This is why "always assign properties in the same order, ideally from one constructor" is engineering advice, not style preference.

**"Arrays are just arrays"** → Arrays have an internal "elements kind" tier (packed-int → packed-double → packed-generic → holey variants → dictionary) that only ever moves toward SLOWER, and moves there PERMANENTLY the moment a float lands in an int array, a hole appears, or a non-numeric value is pushed in. Two visually-identical arrays can iterate at wildly different speeds because of how they were built, not what they currently contain — `new Array(n)` then filling out of order, or `delete arr[i]`, are the two most common accidental triggers.

**"Garbage collection pauses your whole program"** → That was true of naive stop-the-world collectors; V8's actual design specifically engineers around it. New Space collection (Scavenger) is cheap BECAUSE most objects die young — it copies only survivors, proportional to live data not total data. Old Space collection (Mark-Sweep-Compact) is mostly incremental (small slices interleaved with your JS) and concurrent (background threads) specifically so multi-hundred-millisecond freezes stay rare — the generational split exists to make the common case (short-lived garbage) nearly free and confine the expensive case (long-lived data) to infrequent, mostly-hidden work.

**"A closure only keeps alive the variables it uses"** → A closure holds a reference to its entire enclosing Context object — EVERY variable declared in that lexical scope, not a curated subset. A closure that reads one small string from a scope that also declared a million-element array keeps that array reachable for as long as the closure itself is reachable, regardless of whether the closure ever touches it. This is the actual mechanism behind "closures can leak memory" — it's not that closures are leaky by nature, it's that they pin an entire scope, and a scope containing something large is a scope you should keep narrow.
