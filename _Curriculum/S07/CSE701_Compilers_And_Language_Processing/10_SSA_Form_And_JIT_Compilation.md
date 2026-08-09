# Chapter 10 — SSA Form & JIT Compilation

> Every analysis in Chapter 9 was answering the same question in a different disguise. This chapter deletes the question instead — and then runs the entire compiler at runtime, on a language whose types nobody declared.

---

## The Problem

Look back at what Chapter 9's passes actually spent their effort on:

- **CSE** had to confirm neither `a` nor `b` was reassigned between two computations of `a + b`
- **Constant propagation** had to track which definition of `x` was current, invalidating on reassignment
- **DCE** had to determine whether a definition was ever read

Three passes, three separate mechanisms, all circling one question: **which definition does this use refer to?** Every one of them needed reaching-definition information, and every one computed it slightly differently.

Chapter 9's Q3 pointed at the alternative. That question only exists because a variable can be assigned more than once. Remove that possibility and it doesn't get answered — it becomes **unaskable**.

## 10.1 Static Single Assignment

The rule: **every variable is assigned exactly once.** Rename each assignment to a fresh name.

```
x = 1              x1 = 1
x = x + 2     →    x2 = x1 + 2
y = x * 3          y1 = x2 * 3
```

Now a use identifies its definition **by name alone**. `x2` has exactly one defining instruction, findable without analysis. The consequences for Chapter 9's passes:

| Pass | Before SSA | Under SSA |
|---|---|---|
| Constant propagation | Forward dataflow, invalidate on reassignment | Look up the single definition |
| CSE | Prove operands unchanged in between | Same names ⟹ same values, by construction |
| DCE | Backward liveness analysis | Count uses of the name |
| Def-use chains | Computed and maintained | Free |

The analyses don't get faster so much as **stop being analyses**. That's why LLVM, GCC, V8's TurboFan, and HotSpot's C2 all use SSA internally.

## 10.2 The Merge Problem and φ Functions

The rule breaks immediately at a branch:

```
if (c) { x = 1 } else { x = 2 }
use(x)
```

Rename to `x1 = 1` and `x2 = 2`, and `use(x)` has no name to read — which one applies depends on a runtime branch.

The fix is a **φ (phi) function** at the merge, selecting by incoming edge:

```
B1: x1 = 1        B2: x2 = 2
             ↘   ↙
B3:  x3 = φ(x1, x2)
     use(x3)
```

`x3` is assigned exactly once, so the invariant holds. Crucially, the fact that this value depends on control flow is now **explicit in the IR** rather than implicit in the CFG's shape — an optimiser can see it without reasoning about paths.

φ is not a machine instruction. It's a notation meaning "whichever predecessor we came from, take that operand," and it's removed before code generation (§10.5).

## 10.3 Where Are φ Functions Actually Needed?

Not at every merge, and not for every variable. Placing them everywhere would work but bloat the IR with φs whose operands are all the same name.

The precise condition: a φ for variable `v` is needed at block `b` when **two different definitions of `v` can reach `b` along different paths**. Formalising "can reach along different paths" is what **dominance** is for.

**Dominance:** block `d` *dominates* `b` if every path from entry to `b` passes through `d`. If `d` dominates `b`, then a definition in `d` unambiguously reaches `b` — there's no alternative route that skips it, so no φ is needed.

Computed by fixpoint iteration — `dom(n) = {n} ∪ ⋂ dom(p)` over predecessors — on a CFG with a diamond nested inside a loop:

```
fixpoint in 2 rounds
   B0 dominated by [B0]
   B1 dominated by [B0, B1]
   B2 dominated by [B0, B1, B2]
   B3 dominated by [B0, B1, B3]
   B4 dominated by [B0, B1, B4]
   B5 dominated by [B0, B1, B4, B5]
```

*(Verified.)* Note `B4` is dominated by `B1` but **not** by `B2` or `B3` — you can reach `B4` through either arm of the diamond, so neither arm is guaranteed.

**Dominance frontier:** the frontier of `n`, written `DF(n)`, is the set of blocks where `n`'s dominance *runs out* — blocks `n` doesn't strictly dominate, but which have a predecessor `n` does dominate. In other words, the first places a definition in `n` stops being the only possibility:

```
DF(B0) = -          DF(B1) = [B1]       DF(B2) = [B4]
DF(B3) = [B4]       DF(B4) = [B1]       DF(B5) = -
```

*(Verified.)* Two of these are worth reading closely:

- `DF(B2) = DF(B3) = {B4}` — each diamond arm's influence ends at the merge. Exactly where a φ belongs.
- **`DF(B1) = {B1}` — a block in its own dominance frontier.** That's the loop. `B1` dominates `B4`, and `B4` branches back to `B1`, so a definition in the loop body reaches the header along a path that doesn't come from the header's own dominator. Loop headers are in their own frontiers, which is precisely why loops need φ functions.

**The placement rule:** insert φ for `v` at every block in the dominance frontier of every block defining `v` — iterating, since a newly inserted φ is itself a definition:

```
'x' defined in [B0, B2, B3]  ->  phi needed in [B1, B4]
'i' defined in [B0, B4]      ->  phi needed in [B1]

total phi functions inserted: 3
```

*(Verified.)* And note what did **not** happen: `B5` gets no φ despite sitting after the whole diamond, because it has a single predecessor — by the time control reaches `B5`, the merge has already been resolved at `B4`. The dominance-frontier rule captures that automatically. This is Cytron et al.'s algorithm, and it places the **minimal** number of φ functions.

## 10.4 Leaving SSA

φ isn't executable, so before code generation each φ is replaced by **copies inserted on the incoming edges**: for `x3 = φ(x1, x2)`, append `x3 = x1` to the end of the first predecessor and `x3 = x2` to the second. Each path then arrives with `x3` already holding the right value.

Those copies are exactly what Chapter 8's register allocator is good at removing — if `x1` and `x3` don't interfere, they can share a register and the copy disappears (**coalescing**). So the pipeline is: enter SSA for easy analysis, optimise, leave SSA into copies, let allocation absorb most of them.

There is a classic trap here — the **lost-copy** and **swap** problems, where naive copy insertion is wrong because φs at the same merge conceptually execute *simultaneously*, while inserted copies execute in sequence. `x3 = φ(y1,…)` and `y3 = φ(x1,…)` at one merge means a parallel swap, and sequential copies clobber. Correct implementations sequentialise parallel copies with a temporary — the same problem as swapping two variables without a third, appearing in a compiler back end.

## 10.5 The Whole Course, at Runtime: JIT Compilation

Everything so far assumed **ahead-of-time** compilation: full source available, unlimited compile time, static types. A JavaScript engine has none of those. It receives source over the network mid-page-load, must start executing in milliseconds, and the language has no static types at all — Chapter 6's checker has nothing to check.

The resolution is to run this entire pipeline **at runtime**, and to trade correctness-by-proof for **correctness-by-speculation-plus-a-safety-net**.

**Tiering.** Start with an interpreter — near-zero startup cost, slow execution. Profile as it runs. When a function proves hot, compile it with a fast baseline compiler; if it stays hot, recompile with a full optimiser. Compile time is spent only where execution time was already being spent. Most functions never leave tier one, which is the correct outcome, not a failure.

**Speculation replaces static types.** Chapter 6 derived types from declarations and inference. A JIT derives them from **observation**: if `add(a, b)` has been called two thousand times and both arguments were always small integers, compile a version assuming small integers — with a guard that checks the assumption on entry.

That's the key inversion. AOT compilation optimises on what it can **prove**. A JIT optimises on what it has **observed**, which is strictly more information (it knows actual runtime types and branch frequencies) but is not a guarantee.

**Deoptimisation is the safety net.** When a guard fails — the two-thousand-and-first call passes a string — the optimised code cannot continue. The engine performs a **deopt**: reconstructs the interpreter's state from the optimised frame, discards the specialised code, and resumes in the interpreter. Correctness is preserved; the speculation was a bet, and the bet can be lost.

**And this is where the whole course reappears.** V8's TurboFan is an SSA-based optimising compiler running §10.1–10.3's machinery on speculatively-typed IR, then allocating registers with **linear scan** rather than graph colouring — because, as Chapter 8 §8.5 established, colouring costs compile time a JIT pays out of the user's execution budget. [`16_JavaScript/12_V8_Engine_Internals.md`](../../../16_JavaScript/12_V8_Engine_Internals.md) covers the engine side in detail; this chapter is why it's built that way.

**When it breaks:** code that defeats speculation. A function called with genuinely varying types is *megamorphic* — no single specialisation is valid, so the engine either compiles a slow generic version or deopts repeatedly. Worse is the **deopt loop**: optimise, guard fails, deopt, still hot, re-optimise on the same bad assumption, fail again. Engines detect repeated deopts at the same site and blacklist it from optimisation — permanently slow, but no longer thrashing. This is the concrete reason "monomorphic call sites are faster in JS" is real advice rather than folklore: consistent types are what make the speculation hold.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §10.3 found <code>DF(B1) = {B1}</code> — a block in its own dominance frontier — and attributed it to the loop. Explain why a loop header must be in its own frontier, and what would go wrong if a compiler skipped φ placement for that case.</summary>

**Why it happens.** `DF(n)` contains blocks that `n` does *not* strictly dominate but which have a predecessor `n` does dominate. For loop header `B1`: it dominates `B4` (every path to `B4` goes through `B1`), and `B4` branches back to `B1`. So `B1` has a predecessor it dominates — but `B1` does not *strictly* dominate itself. Both conditions met, so `B1 ∈ DF(B1)`.

**What that means semantically.** Control reaches `B1` two ways: from `B0` on the first entry, and from `B4` on every subsequent iteration. Those carry different definitions of a loop-modified variable — `i`'s initial value versus the value from the previous iteration. Two definitions, two paths, so a φ is required by exactly the same reasoning as a diamond merge. Verified: `i` is defined in `B0` and `B4`, and φ placement puts one in `B1`.

**What breaks if skipped.** The φ at the header is what expresses "this variable's value at the top of an iteration is either the initial value or the value carried around the back edge." Omit it and either (a) the loop body's `i` refers to the initialisation only, so the loop never sees updated values, or (b) SSA's one-definition invariant is violated, and every optimisation relying on "same name ⟹ same value" silently miscompiles — CSE would reuse a stale value across iterations.

There's a positive consequence too: header φs make **induction variables** explicit. `i2 = φ(i0, i1)` where `i1 = i2 + 1` is a recognisable pattern, and it's what loop-strength-reduction and vectorisation pattern-match on. SSA doesn't just preserve correctness around loops — it makes loop structure *visible* to passes, partly recovering the information Chapter 7 threw away when it lowered `while` to jumps.
</details>

<details>
<summary><strong>Q2.</strong> §10.5 says a JIT optimises on what it has <em>observed</em> rather than what it can <em>prove</em>. Give an optimisation a JIT can perform that an ahead-of-time compiler provably cannot — and explain what makes it safe despite being unprovable.</summary>

**The clearest case is speculative inlining through a polymorphic call.**

```js
function process(items, fn) {
    for (const x of items) fn(x);
}
```

An AOT compiler cannot inline `fn` — its identity isn't known at compile time, and different callers pass different functions. It must emit an indirect call, which blocks essentially every optimisation across the boundary: no constant propagation into the callee, no CSE across it, no loop-invariant hoisting past it.

A JIT observes that in practice, at this call site, `fn` has been the same function on all 10,000 calls so far. It inlines that function's body directly, guarded by a cheap identity check, and can then optimise across the boundary — often the single largest win available, because inlining is what makes every other pass apply.

**Others in the same family:** monomorphic property access compiled to a fixed memory offset (the object's hidden class was always the same); untaken branches compiled as a deopt rather than real code (never taken in 50,000 executions); unboxing values into raw machine integers (always small integers, never a double or an object).

**What makes it safe.** Not proof — a *guard plus a recovery path*. Every speculation compiles to (1) a cheap check of the assumption, and (2) a deoptimisation path if it fails. Safety comes from the guard being **conservative**: if the check fails for any reason, execution falls back to the interpreter, which handles all cases correctly. The bet is on *performance*, never on *correctness*.

This is a genuinely different guarantee structure from AOT compilation, and it's the reason the same source can produce faster machine code under a JIT than under a static compiler with far more time to think — the JIT knows things about the actual execution that were unknowable from the text.
</details>

<details>
<summary><strong>Q3.</strong> Looking back across all ten chapters: the compiler repeatedly built a structure, then discarded or transformed it. Trace what was thrown away at each stage, and what the pattern says about designing pipelines generally.</summary>

**The sequence of deliberate losses:**

| Stage | Discarded | Why it was safe | What it later cost |
|---|---|---|---|
| **Lexing** (Ch01) | Whitespace, comments | No stage after parsing needs them | Formatters/IDEs need them back — hence lossless syntax trees |
| **Parsing → AST** (Ch04) | Unit productions, punctuation, 13→5 nodes | Precedence is in the tree shape now | A pretty-printer must reconstruct parens from precedence |
| **AST → IR** (Ch07) | Loop structure, nesting, source types | The back end needs linear, uniform code | The CFG had to *rediscover* the loop as a back edge |
| **IR → SSA** (Ch10) | Multiple assignment | Renaming preserves semantics | φ functions, and copies to undo them on the way out |
| **Leaving SSA** (Ch10) | φ functions | Not machine-executable | Copies the allocator must coalesce away |

**The pattern: every stage is a lossy compression, chosen so that what remains is exactly what the *next* stage needs.** The AST is worse than the parse tree for reproducing source, and better for type checking. The CFG is worse than the AST for understanding intent, and better for dataflow. SSA is worse for humans, and better for optimisation.

**The two design lessons that generalise well past compilers:**

*Losing information too early is the characteristic failure.* Chapter 7 is the clean demonstration: the AST literally had a node labelled `while`, lowering discarded it, and Chapter 8 spent dominator machinery rediscovering it. The industry's answer — Rust's HIR→MIR→LLVM IR, Swift's SIL, GCC's GENERIC→GIMPLE→RTL — is **multiple representations at descending abstraction levels**, each keeping what its own passes need and lowering only once those passes have run. Rust borrow-checks on MIR specifically because MIR still knows about ownership and LLVM IR never did.

*Ordering constraints emerge from those dependencies and are not free to rearrange.* Name resolution before type checking (Ch06: you can't type `x` without knowing which `x`). Optimisation before allocation (Ch08: optimisation changes liveness). Yet Chapter 9 showed the ordering that *isn't* forced — where passes have conflicting objectives — has no optimal answer at all, only benchmarked defaults.

Both lessons are really one: **a pipeline's power comes from each stage assuming a simpler world than the last, and its difficulty comes from the fact that simplification is irreversible.**
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| SSA | Every variable assigned exactly once, so a use identifies its definition **by name** — Ch09's analyses stop being analyses |
| φ functions | Resolve merges while preserving single-assignment; make control-flow dependence **explicit in the IR** rather than implicit in the CFG |
| Dominance | `d` dominates `b` if every path from entry passes through `d`. **Verified** by fixpoint in 2 rounds |
| Dominance frontier | Where a block's dominance runs out — exactly where φs belong. **Verified:** `DF(B2)=DF(B3)={B4}` for the diamond |
| Loop headers | **`DF(B1) = {B1}`** — a block in its own frontier, which is what a loop *is*. Header φs also make induction variables visible |
| Minimal placement | Iterate DF over defining blocks. **3 φs inserted**; `B5` correctly gets none despite following the diamond (single predecessor) |
| Leaving SSA | φs become copies on incoming edges, mostly coalesced away by the allocator. Parallel-copy semantics create the lost-copy/swap traps |
| JIT tiering | Interpret → profile → baseline → optimise. Compile time spent only where execution time already is |
| Speculation | AOT optimises what it can **prove**; a JIT optimises what it has **observed** — strictly more information, but a bet rather than a guarantee |
| Deoptimisation | The safety net that makes speculation sound: guard fails → rebuild interpreter state → resume. Bets are on performance, never correctness |
| When it breaks | Megamorphic sites defeat specialisation; deopt loops force engines to blacklist a site. Why "keep call sites monomorphic" is real advice |

---

## Course Wrap-Up

Ten chapters ago the compiler received a string of characters. The full path:

**Front end** — [Ch01](01_Lexical_Analysis_Tokens_And_Scanning.md) turned characters into tokens (and showed maximal munch breaking C++03). [Ch02](02_Recursive_Descent_LL_Parsing.md) turned tokens into a tree, with the parser's own call stack serving as the pushdown automaton's stack. [Ch03](03_Bottom_Up_LR_Parsing.md) inverted that with LR parsing, handling the left-recursive grammar recursive descent rejected. [Ch04](04_AST_And_Visitor_Pattern.md) abstracted the parse tree 13 nodes → 5 and derived the visitor pattern. [Ch05](05_Semantic_Analysis_Symbol_Tables.md) resolved names with scope stacks — and found closures destroying stack discipline. [Ch06](06_Type_Checking_And_Inference.md) checked types and then inferred them, `fn x => x` yielding `t0 → t0` with nothing annotated.

**Back end** — [Ch07](07_Intermediate_Representation_CFG.md) lowered to three-address code and built the CFG. [Ch08](08_Code_Generation_Register_Allocation.md) allocated registers by graph colouring, and found that straight-line code is polynomially solvable while control flow makes it NP-complete. [Ch09](09_Optimization_Dataflow_Passes.md) optimised 9 instructions to 3, and measured pass order mattering 3× . This chapter closed with SSA and the JIT.

**Three ideas ran through all of it:**

1. **The same machinery reappears at every level.** Finite automata recognised characters (Ch01) and then grammar positions (Ch03). LIFO stacks handled parsing (Ch02), parse state (Ch03), and scopes (Ch05). Fixpoint iteration solved liveness (Ch08), constant propagation (Ch09), and dominance (Ch10). Learning a structure once pays repeatedly.

2. **Every stage simplifies, and simplification is lossy.** The recurring cost — Ch07 discarding a loop that Ch08 had to rediscover — is why production compilers keep several IRs at descending levels.

3. **The hard parts are trade-offs, not algorithms.** Which coercions to allow (Ch06), which values to spill (Ch08), which pass order to use (Ch09), what to speculate on (Ch10) — none has a provably optimal answer. Every one is an engineering judgement, which is why compilers are still an active field rather than a solved one.

**To go further:** implement one. A lexer, recursive-descent parser, AST, tree-walking interpreter, and a constant-folding pass is a weekend for a small language — and it makes every chapter here concrete in a way reading cannot. From there: LLVM as a back end (skip Ch07–10 and inherit them), or [`12_V8_Engine_Internals`](../../../16_JavaScript/12_V8_Engine_Internals.md) to see this whole pipeline running inside the browser.
