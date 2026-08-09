# Chapter 5 — Semantic Analysis & Symbol Tables

> Parsing asks whether the sentence is well-formed. Semantic analysis asks whether it is talking about anything. `let x = 5; print(y)` parses perfectly and means nothing at all.

---

## The Problem

Every visitor in Chapter 4 answered its question from **tree shape alone**. `Eval` computed a `BinOp` from its two children. `Depth` measured nesting. Each node's result depended only on its own subtree — pure structural recursion.

Chapter 4's Q3 identified where that collapses:

```
let x = 5;
print(x + 2);
```

Look at the `Var('x')` node. Its subtree is empty; it's a leaf holding the string `"x"`. Nothing in it, or beneath it, says what `x` is. The answer lives in a `Let` node **somewhere else in the tree** — an ancestor, possibly many levels up, and never a child. No amount of examining `Var('x')` reveals it.

So the compiler needs something new: **accumulated knowledge about names**, carried during the walk. What's declared, where it's visible, and what each use refers to. That structure is the **symbol table**, and building it correctly is the first job of semantic analysis — the phase that reasons about the program rather than its shape.

## 5.1 First Attempt: One Flat Dictionary

The obvious approach: a dictionary from name to value. `Let` inserts; `Var` looks up.

Test it on a program where a name is reused in an inner block:

```
let x = 1;
{
    let x = 2;
    print x;      ← should print 2 (inner)
}
print x;          ← should print 1 (outer, still intact)
```

Result:

```
printed: [2, 2]    expected: [2, 1]
*** WRONG — inner let clobbered the outer x permanently ***
```

*(Verified.)* The inner `let x = 2` overwrote the single entry, and when the block ended there was nothing to restore. The outer `x` wasn't shadowed — it was **destroyed**.

The flat dictionary encodes exactly one fact: *"a name maps to a thing."* But real languages need three:

1. A name maps to a thing **within a region** of the program
2. Regions **nest**, and an inner declaration temporarily hides an outer one
3. When a region ends, its declarations **stop existing** and hidden ones become visible again

Points 2 and 3 are what a flat structure cannot express, and notice their shape: hidden most-recently-first, restored in reverse order of hiding. That's last-in-first-out — the same structure as Chapter 2's parser call stack and Chapter 3's parse stack, arriving for the third time because the underlying phenomenon is the same: **nesting**.

## 5.2 The Scope Stack

Replace the dictionary with a **stack of dictionaries**. One per active scope:

- **Enter a block** → push an empty dictionary
- **Declare a name** → insert into the **top** dictionary only
- **Look up a name** → search from the **top down**, stopping at the first match
- **Exit a block** → **pop**, discarding that scope's declarations wholesale

Two rules do the real work. *Declare into the top only* means an inner declaration cannot touch an outer one — it adds to a different dictionary. *Look up innermost-outward* means the nearest enclosing declaration wins, which is precisely what "shadowing" means. And popping restores the previous state automatically, because the outer dictionary was never modified in the first place.

Traced on the same program:

```
-- enter scope, depth 1
declare 'x'=1 at depth 1
-- enter scope, depth 2
declare 'x'=2 at depth 2
lookup  'x' found at depth 2 (searched from 2)     ← inner wins
-- exit scope, depth 2, discarding ['x']
lookup  'x' found at depth 1 (searched from 1)     ← outer intact
-- exit scope, depth 1, discarding ['x']

printed: [2, 1]    CORRECT
```

*(Verified.)* Same program, same visitor structure, correct answer. The two lookups of the *identical* name `x` resolve to different declarations, decided entirely by where in the tree the lookup happened.

That chain of dictionaries from innermost to outermost is the **scope chain**, and walking it is **name resolution**.

## 5.3 What This Phase Can Now Catch

Once a compiler tracks declarations, a class of errors becomes detectable that parsing structurally could not reach. Chapter 2's parser accepts `print(zzz)` without complaint — it's grammatically flawless. Only a compiler that knows what's declared can object.

```
undefined variable     -> SemanticError: undefined variable 'zzz'
duplicate in scope     -> SemanticError: duplicate declaration of 'a' in same scope
shadowing is legal     -> accepted (no error)
```

*(All three verified.)* The third is the interesting one. Compare:

```
{ let a = 1; let a = 2; }        ← ERROR: duplicate in the same scope
{ let a = 1; { let a = 2; } }    ← LEGAL: shadowing across nested scopes
```

The same two declarations of `a`, distinguished only by whether a scope boundary separates them. Redeclaring in one scope is almost certainly a mistake — two names, one region, no way to reach the first. Redeclaring in a nested scope is a deliberate, useful idiom.

The check falls out of the structure with no special casing: **duplicate detection tests only the top dictionary** (`if n in self.scopes[-1]`), while **lookup searches the whole chain**. Different depth of search, different question answered.

> **Where this sits in the pipeline.** These are *semantic* errors — the program is well-formed but meaningless. The distinction matters for error messages: a parse error says "I can't read this," while a semantic error says "I read it fine, and it doesn't make sense." Users experience those very differently, which is why compilers report them in separate phases rather than merging them.

## 5.4 Declaration Order — a Real Design Decision

The resolver above requires declaration before use, because it walks the tree in order and a lookup fails if nothing has been declared yet. That's one legitimate choice, not the only one:

```
print(x);        ← use
let x = 5;       ← declaration comes later
```

- **C, and blocks in most languages** — an error. Sequential resolution, one pass, simple.
- **Function declarations in most languages** — legal. Mutual recursion (`isEven` calling `isOdd` calling `isEven`) is impossible if a function can't reference something declared later.
- **JavaScript `var`** — hoisted: the declaration is visible from the top of the function, though the *value* isn't assigned until the original line runs, so you read `undefined` rather than an error.
- **JavaScript `let`/`const`** — visible but poisoned until the declaration line: touching it throws (the *temporal dead zone*), deliberately catching the bug hoisting would hide.

**The implementation consequence** is worth extracting, because it explains a pattern you'll meet in every real compiler: any language allowing forward references needs **two passes over each scope** — one to collect all declarations, a second to resolve uses against the now-complete table. Single-pass resolution and forward references are mutually exclusive.

This is why C requires forward declarations and header files (it was designed single-pass, for machines that couldn't hold a whole program in memory), and why languages designed later, without that constraint, generally don't.

## 5.5 When It Breaks: Closures Outlive Their Scopes

The pop-on-exit rule in §5.2 is what makes the scope stack correct — and it's also an assumption that first-class functions destroy.

```
fn make() {
    let secret = 42;
    return || secret;      ← a closure capturing `secret`
}
let f = make();
f();                       ← called long after make() returned
```

Run this against strict stack discipline:

```
inside make(): secret = 42 at depth 1
make() returns -> scope popped, discarded {'secret': 42}
calling the returned closure -> NameError: undefined 'secret'
=> the closure's captured binding is GONE
```

*(Verified.)* The scope was popped on return, exactly as the rule says. But the closure still needs `secret`, and it no longer exists.

**The root assumption that failed:** stack discipline ties a binding's lifetime to the *duration of the call that created it*. That's valid only if nothing can reference the binding after the call returns — true in a language without first-class functions, false the moment one exists.

The fix is to allocate the environment on the **heap** and have the closure hold a reference to it:

```
after make() returns, closure still resolves secret = 42
=> env outlives the call because the closure holds a reference to it
```

*(Verified.)* Same lookup logic, same parent-chain walk — only the *lifetime rule* changed:

```
stack: lifetime tied to CALL duration  -> popped on return
heap : lifetime tied to REACHABILITY   -> survives while referenced
```

And "lifetime tied to reachability" is precisely the condition that requires **garbage collection** (or Rust-style ownership analysis) to decide when the environment can finally be freed. A language with closures needs a memory-management story that a language without them does not — one syntactic feature, and the runtime requirements change categorically.

> **The same mechanism, seen from the other side.** [`16_JavaScript/02_JS_Functions_Closures.md`](../../../16_JavaScript/02_JS_Functions_Closures.md) teaches closures from the language-user's perspective — *what* they do and how to exploit them. This is the compiler-writer's view of the identical phenomenon: *why* they force heap-allocated environments and, downstream, garbage collection. The famous `var`-in-a-loop puzzle is this chapter's material too — one shared binding captured by every iteration, versus `let`'s fresh binding per iteration, is a question about how many environments the compiler allocates.

## Section Challenge

<details>
<summary><strong>Q1.</strong> A compiler resolves every name by walking the scope chain at runtime — innermost dictionary outward, comparing strings. Deeply nested code makes variable access measurably slower. What's the fix, and what does it require the compiler to know?</summary>

**The problem:** a lookup costs O(depth × names-per-scope) string comparisons, *every time the variable is touched*, and the cost depends on how deeply nested the code happens to be. A loop body ten scopes deep pays ten dictionary probes per access. Worse, it's unpredictable — the same variable costs different amounts at different sites.

**The fix: resolve names to fixed locations at compile time.** The scope structure is fully known statically — the compiler already walked it to check for undefined variables. So instead of storing the *name* in the AST node and resolving later, record where the lookup landed:

```
Var('x')  →  Local(depth=2, slot=0)
```

At runtime that's array indexing, not string comparison — O(1), and identical whatever the nesting depth. The strings can be discarded entirely (kept only for debug info and error messages).

**What it requires:** that scoping be **static** — determinable from program text alone, without running it. Every language in common use is statically (lexically) scoped, so this works. It fails for **dynamic scoping**, where a name resolves via the *call chain* at runtime rather than the nesting in source, so the target genuinely isn't knowable until execution. Early Lisps did this; it's largely abandoned, and this optimisation is part of why.

It also complicates slightly for anything that can inject bindings at runtime — JavaScript's `eval` and (historically) `with` — which is exactly why engines deoptimise functions containing them. The V8 chapter's discussion of deopt triggers is the same story from the runtime side.

Real implementations then flatten this further: closure-captured variables become *upvalues* with their own index, so even cross-scope access is one indirection rather than a chain walk.
</details>

<details>
<summary><strong>Q2.</strong> §5.4 says forward references require two passes over each scope. A colleague objects: "Just resolve lazily — when a lookup fails, keep going and patch it later." Does that work, and what does it cost?</summary>

It works, and it's a real technique (**backpatching**), but it converts a clean question into a bookkeeping problem.

**How it works:** on a failed lookup, record an unresolved reference — the node, the name, and the scope it was in — and continue. At the end of the scope (or the compilation unit), revisit each pending reference and try again against the now-complete table. Anything still unresolved is a genuine undefined-variable error.

**What it costs:**

1. **You've re-invented the second pass, less tidily.** The patch-up phase *is* a second traversal, just over a side list instead of the tree, with the scope context that was live at each failure point carried along manually. A clean two-pass design gets that context for free by walking the tree again.
2. **Error quality degrades.** Errors surface at patch-up time, detached from the traversal that found them — so you must have stored enough source position and scope context to reconstruct a good message. Easy to under-store and end up with `undefined variable 'x'` and no line number.
3. **Scope capture is subtle.** A pending reference must be retried against *the scope chain it was in*, not whatever is current at patch time. Since scopes have been popped by then, you must have retained them — which means they can't simply be discarded on exit, undermining §5.2's clean pop.
4. **Ordering bugs get quiet.** With genuinely circular references, whether resolution succeeds can depend on patch order, producing the kind of bug that appears only on certain inputs.

**When it's the right call anyway:** single-pass compilers for very large inputs (the historical C motivation), and assemblers resolving forward jump targets — where the "reference" is a fixed-size address slot to overwrite, the classic backpatching case. For a modern compiler holding the whole AST in memory, a second explicit pass is simpler, produces better errors, and costs a traversal that's negligible next to everything downstream.
</details>

<details>
<summary><strong>Q3.</strong> The resolver now catches undefined variables and duplicate declarations. Does it catch <code>let x = 5; print(x + "hello");</code>? What extra information would each symbol-table entry need, and where does that information come from?</summary>

**No.** The resolver checks one thing: *does this name have a declaration in scope?* Here `x` does, and `"hello"` is a literal needing no declaration. Every name resolves, so name resolution reports success — and the program is still nonsense, because adding a number to a string is either an error or an implicit conversion, and the compiler currently has no basis for deciding which.

**What's missing is the type of every expression.** Each symbol-table entry needs to carry not just "declared" but **what kind of thing it is**: `x : int`. And the check itself needs more than the table, because `x + "hello"` requires the type of a *whole expression*, not just of names — so every node needs a type, computed bottom-up:

- **Literals** supply base cases: `5 : int`, `"hello" : string`
- **Names** get theirs from the symbol table — which is exactly why type checking runs *after* name resolution and depends on it
- **Operators** have rules combining operand types: `int + int → int`, `string + string → string`, and `int + string → ` either an error or a defined coercion, depending on the language

Note the phase ordering that falls out: you cannot type-check `x` without knowing which declaration `x` refers to, so name resolution must complete first. Two distinct jobs, in a required order — resolution builds the table, type checking annotates and validates against it.

There's a further wrinkle worth seeing now: where does `x`'s type come from? In `let x: int = 5` it's declared. In `let x = 5` it must be **inferred** from the initialiser. Push that far enough — inferring types through function bodies, calls, and generics with no annotations at all — and you need real inference machinery rather than a bottom-up walk. That's Chapter 6.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why a new mechanism | `Var('x')` is a leaf — its meaning lives in a `Let` elsewhere in the tree, so structural recursion (all of Ch04) cannot resolve it |
| Flat dictionary fails | **Verified `[2,2]` instead of `[2,1]`** — an inner declaration doesn't shadow the outer one, it destroys it |
| Scope stack | Push on block entry, declare into the top only, look up innermost-outward, pop on exit. LIFO again — third appearance, same cause: nesting |
| Shadowing | Falls out of "declare into top, search whole chain" — no special casing needed |
| Duplicate vs shadowing | Duplicate check searches **only the top** scope; lookup searches **the whole chain**. Same table, different search depth, different question |
| Semantic vs syntax errors | `print(zzz)` parses flawlessly — only a compiler tracking declarations can object. "I can't read this" vs "I read it and it's meaningless" |
| Forward references | Allowing them requires **two passes per scope** (collect, then resolve). Single-pass and forward references are mutually exclusive — the reason C has header files |
| When it breaks | **Verified:** pop-on-exit destroys a closure's captured binding. Stack lifetime = call duration; heap lifetime = reachability — and "reachability" is what forces garbage collection |
| Compile-time resolution | Static scoping means lookups can be pre-resolved to (depth, slot) pairs — O(1) array access instead of a runtime chain walk |

## Where We Go Next

Name resolution answers *what does this name refer to?* It does not answer *is this a sensible thing to do with it?* As Q3 showed, `x + "hello"` resolves every name successfully and is still meaningless.

Answering that requires attaching a **type** to every expression, not just to every name — computed bottom-up from literals, drawn from the symbol table for names, and combined by per-operator rules. And where a declaration omits its type, the compiler must *infer* it. Chapter 6 builds type checking, then pushes into inference, where the goal is to reconstruct types the programmer never wrote.

*Next: [06_Type_Checking_And_Inference.md](06_Type_Checking_And_Inference.md)*
