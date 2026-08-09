# Chapter 6 — Type Checking & Inference

> A type checker is a proof system that runs on every build. Type *inference* is the same proof system run backwards — reconstructing the theorem from the proof, so the programmer never has to state it.

---

## The Problem

Chapter 5's resolver succeeds completely on this:

```
let x = 5;
print(x + "hello");
```

`x` has a declaration in scope. `"hello"` is a literal needing none. Every name resolves, so name resolution reports success — and the program is still nonsense.

The gap is that resolution answers *what does this name refer to?* and never *is this a sensible thing to do with it?* Answering the second requires knowing, for every expression, **what kind of value it produces** — and that's information the symbol table doesn't carry.

## 6.1 Types Belong on Expressions, Not Just Names

The instinct is to store a type per symbol-table entry — `x : int` — and be done. That's necessary but nowhere near sufficient, because `x + "hello"` is not a name. It's a compound expression, and checking it requires the type of the *whole thing*, built from its parts.

So types are computed **bottom-up over the AST**, exactly like Chapter 4's `Eval` visitor — same traversal, different value at each node:

| Node kind | Where its type comes from |
|---|---|
| Literal | The base case — `5 : int`, `"hello" : string` |
| Name | Looked up in the symbol table (which is *why* type checking must run after Chapter 5) |
| Operator | A rule combining the operand types already computed |

That last row is where the language's actual decisions live. Encode them as a table:

```
('+', int,    int)    → int
('+', string, string) → string
('*', int,    int)    → int
('<', int,    int)    → bool
```

The rule for checking a binary operation: compute both operand types, look up the triple, and **if it isn't in the table, report an error.** Verified:

```
x + 2          : int
s + "hi"       : string
x + "hello"    : TYPE ERROR - operator '+' undefined for int and string
x < 3          : bool
```

Note `x < 3 : bool` — the result type needn't match the operands. Comparison consumes two `int`s and produces a `bool`, which is exactly the kind of thing a table of triples expresses naturally and an ad-hoc "operators return their operand type" shortcut would get wrong.

## 6.2 The Coercion Decision — a Language Design Choice, Not a Bug

The table above has no entry for `('+', int, string)`, so the checker rejects it. That is a *choice*, and it's worth seeing it as one, because a language could just as legitimately add:

```
('+', int, string) → string        # coerce the int, concatenate
```

and `5 + "hello"` becomes `"5hello"`. That's precisely what JavaScript does — and Chapter 1 of the JavaScript module derives the machinery in full: [`16_JavaScript/01_JS_Foundations.md`](../../../16_JavaScript/01_JS_Foundations.md) §3 shows `"5" + 3` producing `"53"` because `+` is overloaded and a string operand wins.

Neither policy is wrong; they optimise for different things:

- **Strict** (reject) — errors surface at compile time, at the exact expression. Costs the programmer explicit conversions.
- **Coercing** (define a rule) — more code "just works," at the price of bugs that survive to runtime as wrong values rather than failures. The JS chapter's SDET example is the archetype: comparing a `textContent` string against a number silently passes, hiding the very defect the test existed to catch.

**The point for a compiler writer:** coercion isn't the absence of a rule, it's an *extra* rule you deliberately add. Its cost is that the set of type errors your compiler can catch shrinks by exactly the set of pairings you chose to coerce.

## 6.3 Where Do Types Come From When Nobody Writes Them?

The checker above assumed `env = {'x': 'int'}` — types already known. Fine for `let x: int = 5`. But this is far more common:

```
let x = 5;
```

No annotation. The type is *obvious* — the initialiser is an `int`, so `x` is an `int`. Formalising "obvious" is **type inference**, and pushing it beyond one-line cases forces genuinely different machinery.

Consider:

```
fn f(x) { return x; }
```

Nothing here says what `x` is. And unlike `let x = 5`, there's no initialiser to read it off. The honest answer is that `f` works for **any** type, and returns that same type — but a bottom-up walk has no way to write down "any type."

So introduce one: a **type variable**, a placeholder standing for a type not yet known. Give `x` the type `t0`. Then the return type is also `t0`, because the body returns `x` unchanged. Result: `t0 → t0`, for any `t0`.

## 6.4 Constraints and Unification

Type variables alone aren't enough — the compiler needs to *discover* what they must be. Two steps:

1. **Walk the AST generating constraints** — equations between types that must hold for the program to be well-typed.
2. **Solve them.**

Applying a function `f` to an argument `a` generates the central constraint. If `f : tf` and `a : ta`, and the call's result is a fresh `tr`, then `f` must be a function from `ta` to `tr`:

```
tf  =  ta → tr
```

Solving such equations is **unification** — make two type expressions identical by choosing substitutions for their variables:

- Two identical type constants (`int` vs `int`): already equal, nothing to do.
- Two *different* constants (`int` vs `string`): **fail** — no substitution can reconcile them.
- A variable vs anything: bind the variable to that thing.
- Two function types: unify argument with argument, result with result, recursively.

Run over real programs with nothing annotated:

```
5                          : int
fn x => x                  : (t0 -> t0)
(fn x => x)(5)             : int
fn f => fn x => f(x)       : ((t4 -> t5) -> (t4 -> t5))
```

*(Verified.)* Read those middle two together, because they're the whole idea:

- `fn x => x` infers to `t0 → t0` — a type variable survives to the end, meaning **no constraint ever forced it to be anything**. That's polymorphism, discovered rather than declared.
- Apply that same function to `5` and the result is plain `int` — the application generated `t0 = int`, unification bound it, and the variable disappeared.

The last line is worth a second look: `fn f => fn x => f(x)` inferred `(t4 → t5) → (t4 → t5)`. Nothing was annotated, yet the compiler worked out that the first parameter must *be a function*, purely because the body applies it. The constraint `tf = ta → tr` did that.

## 6.5 Why Let-Polymorphism Is Needed

There's a subtlety the identity example hides. A type variable is only polymorphic if nothing pins it down — but a variable bound *once* and used *twice at different types* gets pinned by the first use:

```
monomorphic id used at int AND string -> cannot unify int with string
```

*(Verified.)* The first use unified `t → t` with `int → int`, binding `t := int`. The second use then demanded `t := string`, and `int` and `string` cannot unify. The function that was polymorphic in isolation became monomorphic the moment it was named and shared.

The fix is **generalisation** at `let`-bindings: when a `let`-bound value's type still contains free type variables, don't keep it as a single type — record it as a *scheme* (`∀t. t → t`) and hand out a **fresh instantiation at each use site**. Use one gets `t₁ → t₁`, use two gets `t₂ → t₂`, and they constrain independently.

This is **let-polymorphism**, and it's the defining feature of the **Hindley–Milner** system that ML, OCaml, Haskell, Elm, and (in modified form) Rust and Swift build on. Its remarkable property: full inference with no annotations at all, while remaining decidable and predictable. The deliberate restriction that buys this — generalising only at `let`, not at lambda parameters — is exactly why HM stays tractable where more expressive systems don't.

## 6.6 When It Breaks: Infinite Types and Distant Errors

**Self-application** breaks it structurally:

```
fn x => x(x)
```

`x` is applied to itself, so `x` must be a function from its own type to something: `t = t → r`. Substituting `t` into itself gives `((t → r) → r) → r`, forever. No finite type satisfies the equation.

Unification catches this with the **occurs check** — before binding variable `v := T`, verify `v` does not occur inside `T`:

```
occurs check failed: t9 in (t9 -> t10) (infinite type)
```

*(Verified.)* Without that guard, unification would loop forever or build a cyclic structure that crashes later. The occurs check is the small, easily-forgotten step that makes the algorithm terminate — and skipping it is a classic implementation bug, since most test programs never trigger it.

**The practical failure is worse than the theoretical one.** Constraints propagate globally, so unification fails wherever two incompatible requirements finally meet — which is often **nowhere near the mistake**. Change a function's return type in one file, and HM dutifully propagates the consequence until it collides with a usage three modules away, and reports the error *there*. The message is accurate and the location is useless.

This is the real reason mature languages with full inference still encourage annotating top-level functions: not because the compiler needs them, but because they act as **firewalls**, stopping constraint propagation at a boundary you chose so errors get reported near their cause. Rust's requirement that function signatures be annotated (while inferring freely inside bodies) is precisely this trade, made mandatory.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §6.1's table has no entry for <code>('+', int, float)</code>. A colleague adds <code>('+', int, float) → float</code> plus <code>('+', float, int) → float</code> and calls it done. What have they actually introduced, and how does it differ from the JavaScript-style coercion §6.2 warns about?</summary>

They've introduced **numeric widening** — and it *is* implicit coercion, but of a specifically safe kind, which is why nearly every statically-typed language allows it while still rejecting `int + string`.

The distinguishing property is **information preservation**. Converting an `int` to a `float` (within range) loses nothing meaningful; the value denoted is the same number. Converting an `int` to a `string` changes *what kind of thing it is* — `5` becomes the character `'5'` — and the resulting `+` does something categorically different (concatenation, not addition). JavaScript's `"5" + 3 === "53"` isn't a widened addition; it's a silent switch to a different operation.

So the honest rule is: coercions that preserve the value and keep the operation's meaning are generally safe; coercions that change which operation runs are the dangerous ones.

**Two things their two-line fix still misses:**

1. **Transitivity and combinatorics.** Add `double`, `long`, `short` and the table needs every pair, in both orders. Real languages don't enumerate — they define a *widening lattice* and one rule: promote both operands to their least common supertype, then apply the same-type rule. Two entries become a policy.
2. **Not every widening is lossless.** `int → float` loses precision for large integers (a 32-bit int beyond float's 24-bit mantissa is silently rounded), and `long → double` more so. This is genuinely the same class of problem as the floating-point pitfalls in [CSE304 Ch01](../../S03/CSE304_Numerical_Methods/01_Floating_Point_Error_Analysis.md) — the coercion is "safe" only under an assumption about magnitude that the type system isn't checking.
</details>

<details>
<summary><strong>Q2.</strong> §6.5 says HM generalises at <code>let</code> but not at lambda parameters. Why not just generalise everywhere and get more polymorphism for free?</summary>

Because generalising lambda parameters gives up decidable inference — you'd be leaving Hindley–Milner for **System F**, where full inference is undecidable.

**The mechanical reason.** Generalising `let x = e1 in e2` is safe because `e1` is *complete* — it's been fully inferred, so the compiler knows exactly which variables are unconstrained and can quantify them. A lambda parameter is the opposite: at the moment you'd generalise `fn x => ...`, nothing about `x` is known yet. Its constraints arrive *later*, from the body and from call sites. Generalising a variable whose constraints haven't arrived means committing to "works for all types" before checking whether it does.

**What it would buy, and why it's rarely worth it.** It permits **higher-rank** types — a parameter that is itself polymorphic and used at several types inside one body:

```
fn applyTwice(f) { return (f(1), f("hi")); }     -- needs f : ∀a. a -> a
```

Rank-1 HM rejects this: `f` gets one monomorphic type variable, `f(1)` pins it to `int`, and `f("hi")` fails — exactly the conflict verified in §6.5.

**The cost:** type inference for System F (rank-N) is undecidable in general. So languages that want higher-rank types make you *write* them — Haskell's `RankNTypes` requires an explicit `forall` annotation, and the compiler checks rather than infers it. Rank-2 is decidable, but the boundary is subtle enough that requiring annotation is the pragmatic choice.

**The design principle:** HM's power comes from what it *refuses* to attempt. Restricting generalisation to `let` keeps inference complete, decidable, and — the underrated part — *predictable*, so a programmer can reason about what the compiler will infer without simulating the algorithm.
</details>

<details>
<summary><strong>Q3.</strong> After Chapter 6 the AST is fully resolved and typed. Why not generate machine code directly from it? What does the tree make hard that a different representation would make easy?</summary>

You *can* — simple compilers do, and tree-walking interpreters do exactly this. But the AST's shape is wrong for the two jobs that come next: optimisation and register allocation.

**What the tree makes hard:**

1. **Control flow is implicit.** A `while` node contains a condition and a body, but the *jumps* — test, branch, loop back, exit — aren't nodes anywhere. They're implied by the node's kind. Any analysis reasoning about paths ("can execution reach here with `x` still null?") must re-derive that flow from node semantics, separately, in every pass.
2. **Evaluation order is implicit.** `(a + b) * (c + d)` says the multiplication depends on two additions, but not which happens first, or where intermediates live. Register allocation needs exactly that: a linear order and an explicit intermediate per operation.
3. **Nesting obstructs simple analyses.** "Is this value still live?" is a question about a *linear* sequence of operations. On a tree it means walking arbitrary structure and reasoning about traversal order — the same analysis becomes far more code.
4. **Source-level constructs are heterogeneous.** `for`, `while`, `do-while`, and `break` are four node types that all lower to the same handful of conditional jumps. Optimising the tree means writing every pass four times; optimising after lowering means writing it once.

**What's wanted instead** is a representation that is **linear** (an ordered instruction sequence, so "before" and "after" are literal), has **explicit control flow** (jumps as real instructions, so paths form an inspectable graph), makes **every intermediate value named** (so dependencies are visible without re-deriving them), and is **simpler than the source language** (few instruction kinds, so each pass handles a small set).

That's an intermediate representation — three-address code, and the control-flow graph built from it. It's also why compilers targeting many machines have an IR at all: *m* languages and *n* targets need *m + n* pieces through a shared IR, rather than *m × n* direct translators. Chapter 7.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Types belong on expressions | `x + "hello"` isn't a name — checking it needs the type of the whole compound, computed bottom-up like Ch04's `Eval` |
| Where types come from | Literals are base cases; names come from Ch05's symbol table (so type checking *must* follow resolution); operators have rules |
| Operator rule table | Triples `(op, left, right) → result`. Missing entry = type error. `<` returning `bool` from two `int`s shows why result type is independent |
| Coercion is an added rule | Not the absence of a rule. Every coercion you add shrinks the set of errors you can catch — JS's `"5" + 3 === "53"` is the archetype |
| Type variables | A placeholder for a type not yet known — how a compiler writes down "any type" |
| Unification | Solve type equations by substitution: constants must match, variables bind, functions unify pairwise |
| Inference works | **Verified with zero annotations:** `fn x => x` → `(t0 -> t0)`, and `fn f => fn x => f(x)` → `((t4 -> t5) -> (t4 -> t5))` — it deduced `f` must be a function |
| Let-polymorphism | **Verified:** a monomorphic `id` used at `int` then `string` fails to unify. Generalise at `let` and instantiate fresh per use — the core of Hindley–Milner |
| Occurs check | `fn x => x(x)` needs `t = t → r`, unsatisfiable. Verified caught. Omitting this check is a classic bug — most programs never trigger it |
| The real failure mode | Constraints propagate globally, so errors surface far from the mistake. Annotating top-level signatures acts as a firewall — why Rust mandates them |

## Where We Go Next

The front end is complete. Source text became tokens (Ch01), tokens became a tree (Ch02–03), the tree was abstracted (Ch04), names were resolved (Ch05), and every expression now has a checked type. Whatever the program is, the compiler now understands it — and any program still standing is one it has agreed to translate.

Everything from here is the **back end**, and it starts by throwing away the tree. As Q3 argued, an AST hides exactly what optimisation and register allocation need: control flow is implied rather than explicit, evaluation order is unstated, intermediate values are unnamed, and four source constructs that mean the same thing stay stubbornly distinct. Chapter 7 lowers the AST into three-address code and builds the control-flow graph — a linear, explicit, deliberately simpler representation that every later pass is written against.

*Next: [07_Intermediate_Representation_CFG.md](07_Intermediate_Representation_CFG.md)*
