# CSE501 — JavaScript & TypeScript Deep Dive

## Semester 5 · Full-Stack Specialization (Frontend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can reason about the event loop from the V8 internals, debug a closure-related memory leak with DevTools, write production TypeScript that compiles fast and types correctly under monorepo constraints, and explain WHY TypeScript erases — not what `as const` does.
> **Capstone:** Build a typed reactive utility library (signals, observables, derived state) with 100% test coverage and published types. Tested in 3 consumer projects.

---

## Navigation

| Course                                                                               | Description |
| ------------------------------------------------------------------------------------ | ----------- |
| **CSE501 — JavaScript & TypeScript Deep Dive**                                       | This course |
| **[CSE502 — React & Frontend Architecture](../CSE502_React_And_Frontend_Architecture/README.md)** | S05 sibling — builds on TS fluency |
| **[CSE503 — CSS & Design Systems](../CSE503_CSS_And_Design_Systems/README.md)**     | S05 sibling |
| **[CSE504 — Frontend Integration & Performance](../CSE504_Frontend_Integration_And_Performance/README.md)** | S05 sibling — bundler/build pipeline |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `16_JavaScript/`                           | Primary source for JS — runtime, async, browser APIs           |
| `17_TypeScript/`                           | Primary source for TS — type system, decorators, modules       |
| `15_React_Frontend/`                       | Consumes TS — Ch05 React + TypeScript                          |
| `19_Frontend_Integration/`                 | Bundler config, tsconfig in monorepos                          |
| `13_Developer_Essentials/`                 | Async patterns at the language level                           |

---

## Prerequisites

- `CSE301 OOP & Design Patterns` — generics, inheritance vs composition baseline
- `16_JavaScript/01_JS_Foundations.md` — basic syntax + scope
- A working dev environment with Node 20+ and TypeScript 5.4+

**Constraint:** This course assumes you can read JS without referring to MDN every 3 lines. If you can't write `Array.prototype.reduce` from memory, do Week 1 of `16_JavaScript/` first. Type-level reasoning rests on value-level fluency.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — JavaScript Runtime & Modern Syntax (Weeks 1–4)

**Learning Outcomes:**

- Trace event loop execution: stack, microtask queue, macrotask queue, render
- Debug closures by drawing the lexical scope chain
- Use Proxy/Reflect to build observability without modifying source

#### Week 1 — Foundations: Types, Coercion, Scope

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Primitive vs reference types       | `16_JavaScript/01_JS_Foundations.md` §1-2         | Predict 10 `===` / `==` results before running           |
| 2   | Variable scope: var, let, const, TDZ | `16_JavaScript/01_JS_Foundations.md` §3-4       | Find TDZ violations in a sample codebase                 |
| 3   | Hoisting — function vs var          | `16_JavaScript/01_JS_Foundations.md` §5           | Predict 5 hoisting outputs from look                     |
| 4   | Strict mode + this binding rules    | `16_JavaScript/01_JS_Foundations.md` §6           | Use 5 rules for `this`: new, bind, call/apply, dot, default |
| 5–7 | Review + Problem Set JS-PS1         | —                                                 | `16_JavaScript/16_PROBLEM_SETS.md` PS-1                  |

**Section Challenge (closures):**

> A `for (var i = 0; i < 5; i++) setTimeout(() => console.log(i), 0)` prints `5 5 5 5 5`. Replace `var` with `let` and it prints `0 1 2 3 4`. Explain WHY — from the spec, not from a textbook rule.

<details>
<summary>Answer</summary>

```
THE SPEC MECHANICS:

`var i` creates ONE binding in the function scope. Every iteration
mutates that same binding. By the time setTimeout callbacks run
(after the loop ends), `i` is 5.

`let i` creates a FRESH binding for each iteration. ECMAScript
specifies that for-loop with `let` re-creates the binding per
iteration, copying the current value forward. Each setTimeout
callback closes over a DIFFERENT `i` binding, each holding its
iteration value.

PROOF FROM SPEC:
  Section 13.7.4.7 of ECMA-262: ForBodyEvaluation calls
  CreatePerIterationEnvironment which creates a new environment
  record for each iteration when the loop is per-iteration
  bindings (let/const). For var, no per-iteration binding.

WHY THE OUTPUT IS "5 5 5 5 5":
  Setting timeouts to 0 still schedules them to a macrotask queue.
  The current synchronous loop runs to completion FIRST (i becomes 5),
  then microtasks drain, then macrotasks (the timeouts) fire.
  All 5 callbacks read the same `var i` which is now 5.

INTERVIEW ECHO:
  Pre-ES6 code worked around this with IIFE:
    for (var i = 0; i < 5; i++) (function(j){
      setTimeout(() => console.log(j), 0);
    })(i);
  The IIFE creates a new function scope per iteration, achieving
  what `let` does natively.
```

</details>

---

#### Week 2 — Functions & Closures

`16_JavaScript/02_JS_Functions_Closures.md` — higher-order functions, currying, memoization via closure, closure-based modules.

#### Week 3 — Async — Promises, Event Loop, Microtasks

`16_JavaScript/04_JS_Async_Promises.md` + `09_Browser_Internals_Rendering.md` §2 — event loop, microtask vs macrotask priority, Promise.all/race/any/allSettled.

#### Week 4 — Objects, Prototypes, ES6 Classes

`16_JavaScript/03_JS_Objects_Prototypes.md` + `06_JS_Modern_ES6Plus.md` — prototype chain, class syntax sugar, private fields (#).

---

### UNIT 2 — Advanced JavaScript (Weeks 5–7)

#### Week 5 — Iterators, Generators, Async Iterators

`16_JavaScript/06_JS_Modern_ES6Plus.md` §3-5 — `Symbol.iterator`, generators as coroutines, `for await...of`.

#### Week 6 — Proxy, Reflect, WeakRefs

`16_JavaScript/11_Advanced_Web_APIs.md` §1-2 — Proxy traps, FinalizationRegistry, building reactivity primitives.

#### Week 7 — Web APIs, Workers, Service Workers

`16_JavaScript/10_Web_Workers_ServiceWorkers.md` — workers vs main thread, postMessage, OffscreenCanvas, SW lifecycle.

---

### UNIT 3 — TypeScript Type System (Weeks 8–11)

**Learning Outcomes:**

- State why TS types erase at compile time
- Use generics, conditional types, mapped types, template literal types
- Build a Result<T,E> monad with full type inference

#### Week 8 — Foundations & Inference

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Structural typing vs nominal         | `17_TypeScript/01_TS_Foundations.md` §1-2         | Why does `{name: string}` accept `{name: string, x: number}`? |
| 2   | Type erasure — runtime cost          | `17_TypeScript/04_TS_Deep_Reasoning.md` §1-2     | Verify: TS types don't exist at runtime; what alternatives? |
| 3   | Type narrowing — guards              | `17_TypeScript/01_TS_Foundations.md` §3-4         | Implement `isString(x: unknown): x is string`             |
| 4   | Discriminated unions                  | `17_TypeScript/03_TS_Patterns_BestPractices.md` §2 | Model API responses as DUs                                |
| 5–7 | Review + Problem Set TS-PS1          | —                                                 | `17_TypeScript/17_PROBLEM_SETS.md` PS-1                  |

#### Week 9 — Generics & Advanced Types

`17_TypeScript/02_TS_Advanced_Types.md` — generic constraints, conditional types, `infer`, distributive conditional types, template literal types.

#### Week 10 — Decorators & Metaprogramming

`17_TypeScript/05_TS_Decorators_Metaprogramming.md` — TC39 Stage 3 vs legacy, NestJS/Angular patterns, Symbol.metadata.

#### Week 11 — Module System & Performance

`17_TypeScript/06_TS_Module_System_Performance.md` — node vs node16 vs nodeNext vs bundler, isolatedModules, project references, compiler perf.

---

### UNIT 4 — Production TypeScript Patterns (Weeks 12–14)

`17_TypeScript/03_TS_Patterns_BestPractices.md` — branded types, builder pattern, Zod runtime validation, `.d.ts` library authoring, migration strategy.

---

### UNIT 5 — Capstone (Weeks 15–16)

Build a typed reactive utility library:
- `signal<T>()` — primitive reactive value with type inference
- `computed<T>()` — derived state
- `effect()` — subscription with cleanup
- Property tests + 100% line coverage + published types

---

## Problem Sets

- [`16_JavaScript/16_PROBLEM_SETS.md`](../../../16_JavaScript/16_PROBLEM_SETS.md)
- [`17_TypeScript/17_PROBLEM_SETS.md`](../../../17_TypeScript/17_PROBLEM_SETS.md)

## Exam Prep

- [`16_JavaScript/08_JS_Deep_Reasoning.md`](../../../16_JavaScript/08_JS_Deep_Reasoning.md) — 15 freeze moments
- [`17_TypeScript/04_TS_Deep_Reasoning.md`](../../../17_TypeScript/04_TS_Deep_Reasoning.md) — 10 freeze moments
