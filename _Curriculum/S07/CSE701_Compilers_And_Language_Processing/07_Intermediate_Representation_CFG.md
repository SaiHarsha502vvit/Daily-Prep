# Chapter 7 — Intermediate Representation: Three-Address Code & the CFG

> The front end spent six chapters building a faithful model of what the programmer wrote. The back end opens by destroying it — because a structure optimised for *expressing* a program is the wrong structure for *reasoning about* one.

---

## The Problem

After Chapter 6 the AST is complete: parsed, abstracted, name-resolved, fully typed. Every question about *what the program says* is answerable. So why not walk it and emit machine code?

Chapter 6's Q3 laid out the reasons, and they're all versions of one complaint — **the AST leaves implicit exactly what the back end needs explicit**:

- **Control flow** is implied by node *kind*. A `while` node contains a condition and a body; the test, the branch, the loop-back and the exit are nowhere. Any analysis asking "can execution reach here?" must re-derive flow from node semantics, separately, in every pass.
- **Evaluation order** is unstated. `(a+b)*(c+d)` says the multiply depends on two adds, not which runs first or where the intermediates live.
- **Intermediate values are unnamed**, so data dependencies must be inferred from tree position rather than read off.
- **Source constructs are heterogeneous.** `for`, `while`, `do-while` and `break` are four node types that all mean "conditional jumps." Optimising the tree means writing every pass four times.

So the back end begins by translating into a representation designed for analysis rather than for expression.

## 7.1 Three-Address Code

The target form: each instruction performs **one operation** on **at most three operands** — typically `result = operand1 op operand2`. Hence *three-address*.

The restriction is the point. One operation per instruction means no nesting, so every intermediate result must be given a name — a **temporary**. Applied to `(a+b)*(c+d)`:

```
t0 = a + b
t1 = c + d
t2 = t0 * t1
```

Three instructions where the AST had one nested expression. What was bought:

- **Order is now explicit.** `t0` before `t1` before `t2`. The tree only implied a partial order; this commits to a total one.
- **Every intermediate has a name.** `t0` is a thing that can be referred to, tracked, and asked questions about — "is `t0` still needed after this point?" is now a well-formed question, which is exactly what register allocation (Ch08) needs.
- **Dependencies are readable.** `t2` uses `t0` and `t1`; you can see it without traversing anything.

## 7.2 Lowering Control Flow — Four Constructs Become One

Expressions flatten into temporaries; control flow flattens into **labels and conditional jumps**. A `while` loop lowers to:

```
L0:                          ← loop header
    t0 = x < 10              ← evaluate the condition
    ifFalse t0 goto L2       ← exit if false
L1:
    ...body...
    goto L0                  ← jump back and retest
L2:                          ← after the loop
```

**This is where the four-constructs problem dissolves.** `while`, `for`, `do-while` and a loop with `break` all lower to arrangements of exactly these pieces — a label, a conditional jump, an unconditional jump. Downstream passes never see a `while` node; they see jumps. **One implementation of each optimisation instead of four.**

The full lowering of a small program, produced by an actual lowering pass:

```
  0     x = 0
  1 L0:
  2     t0 = x < 10
  3     ifFalse t0 goto L2
  4 L1:
  5     t1 = x + 1
  6     x = t1
  7     goto L0
  8 L2:
  9     t2 = x * 2
 10     y = t2
```

*(Actual output.)* Eleven instructions, all flat, all sequentially numbered. Compare with the AST: nesting is gone, control flow is now instructions rather than node kinds, and every intermediate has a name.

## 7.3 Basic Blocks — Deriving the Leader Rule

A linear instruction list is still awkward for analysis, because a jump can land in the middle of it. What analyses actually want are **straight-line runs**: sequences where, once you enter, you're guaranteed to execute every instruction and leave at the end.

That guarantee fails in exactly two situations:

1. **Something can jump into the middle** — so any instruction that is a jump target must start a new run.
2. **Something can jump out of the middle** — so the instruction *after* any jump must start a new run.

Instructions that start a run are **leaders**, and the rule follows directly:

> An instruction is a leader if it is (a) the first instruction, (b) the target of a jump, or (c) immediately after a jump.

A **basic block** is a leader plus everything up to the next leader. Computed on the code above:

```
LEADERS: [0, 1, 4, 8]

B0 (instrs 0..0)      B1 (instrs 1..3)          B2 (instrs 4..7)        B3 (instrs 8..10)
  x = 0                 L0:                       L1:                     L2:
                        t0 = x < 10               t1 = x + 1              t2 = x * 2
                        ifFalse t0 goto L2        x = t1                  y = t2
                                                  goto L0
```

*(Verified.)* Instruction 1 is a leader because it's a label (jump target); instruction 4 because it follows a conditional jump; instruction 8 because it's a label. Four blocks.

The payoff is a strong local guarantee: **within a block, control flow is trivially sequential.** No jumps in, no jumps out, no surprises. An enormous class of analyses becomes a simple forward scan over a list, and only the *transitions between* blocks need real graph reasoning.

## 7.4 The Control-Flow Graph

Blocks become nodes; possible transfers become edges. Each block's final instruction determines them: an unconditional jump gives one edge, a conditional jump gives two (taken and not-taken), anything else falls through to the next block.

```
B0 -> B1   (fallthrough)
B1 -> B3   (false)
B1 -> B2   (true/fall)
B2 -> B1   (jump)

back edges (= loops): [('B2', 'B1')]
blocks: 4, edges: 4
```

*(Verified.)* This is the **control-flow graph**, and every question the back end wants to ask is now a graph question:

| Question | Graph formulation |
|---|---|
| Is this code reachable? | Is the block reachable from entry? |
| Is this a loop? | Is there a **back edge** — an edge to a block that dominates it? |
| Can `x` be null here? | What holds on *every* path reaching this block? |
| Is this value dead? | Is it used on any path from here? |

That `B2 → B1` back edge is the loop, found *structurally*. Note what just happened: the CFG builder had no idea the source contained a `while`. It saw instructions and jumps, computed leaders, and the cyclic structure emerged from the edges. That's the abstraction working — and, as §7.6 shows, it's also the abstraction's cost.

## 7.5 Why Have an IR At All

Beyond enabling analysis, there's a structural argument that explains why every serious compiler has one.

Supporting *m* source languages on *n* target architectures with direct translators needs **m × n** of them. C→x86, C→ARM, Rust→x86, Rust→ARM… add a language and you write *n* new back ends; add a chip and you modify *m* compilers.

With a shared IR, each language needs one front end lowering *to* the IR, and each target needs one back end lowering *from* it: **m + n**. At LLVM's scale (dozens of languages, dozens of targets) that's the difference between a viable ecosystem and an impossible one — and it's why Rust, Swift, Julia, and Clang share a back end while sharing no source syntax.

The second benefit is that **optimisations are written once, against the IR**, and every language and every target gets them. A constant-folding pass in LLVM improves Rust and Swift equally, having been written with neither in mind.

## 7.6 When It Breaks: Lowering Destroys Information You Needed

The abstraction level of an IR is a genuine trade-off, and this chapter already demonstrated its cost without naming it.

Look back at §7.4. To find the loop, the CFG builder computed leaders, built edges, and detected a **back edge** — real work, and in a general compiler it needs dominator analysis to do properly. But the AST had a `while` node. **It was labelled a loop.** The information was sitting there in Chapter 6's tree, and lowering threw it away — so the back end had to reconstruct it.

That's the trade in one example:

- **Lower the IR** (closer to machine code) → fewer instruction kinds, so passes are simpler and more uniform, and machine details are expressible. But high-level structure — loops, array bounds, type information, aliasing guarantees — is gone, and must be rediscovered by analysis, or is simply lost.
- **Higher the IR** (closer to source) → structure is preserved and available for free. But every pass must handle many node kinds, and you can't express machine-level concerns.

**How real compilers resolve it: multiple IRs at descending levels.** Rust lowers HIR → MIR → LLVM IR → machine IR; Swift has SIL above LLVM IR; GCC has GENERIC → GIMPLE → RTL. Each level keeps the information the passes at that level need, and lowers only once those passes are done. Borrow checking happens on Rust's MIR precisely because MIR still knows about ownership, which LLVM IR has no concept of.

The general lesson generalises well past compilers: **every lowering is a lossy compression, and the art is choosing what to lose and when.** Lose it too early and you spend the rest of the pipeline reconstructing it — as this chapter did, rediscovering by graph analysis a loop the source had explicitly announced.

## Section Challenge

<details>
<summary><strong>Q1.</strong> The §7.2 output contains <code>t1 = x + 1</code> immediately followed by <code>x = t1</code>, and <code>t2 = x * 2</code> followed by <code>y = t2</code>. The temporaries look pointless. Why does the lowering pass generate them, and what would it take to remove them safely?</summary>

**Why they're generated:** the lowering pass is deliberately simple and *uniform*. `lower_expr` has one contract — evaluate this expression, return the name of a location holding its value — and it honours that contract identically whether the caller is an assignment, a condition, an argument, or a nested subexpression. Special-casing "if the parent is an assignment, write directly to the target" means the expression lowerer must know about its context, which is exactly the coupling that makes compilers hard to extend. The uniform version is correct by construction; you buy simplicity and pay in redundant instructions.

**What it takes to remove them:** this is **copy propagation** plus **dead code elimination** — and the safety conditions matter:

- `t1` is assigned exactly once (temporaries are single-assignment by construction here)
- `t1` is used exactly once, by `x = t1`
- Nothing between the definition and the use modifies the operands

Given those, `x = t1` can be rewritten to write into `x` directly, leaving `t1` unused, and DCE removes it. Both are ordinary IR passes (Ch09), which is precisely the design: **generate naively, clean up in a pass that already has to exist.**

Note the third condition is where it gets interesting in general. Here the def and use are adjacent, so it's trivially satisfied. Separate them by a function call that might modify `x` through a pointer, and you need alias analysis to know whether the propagation is safe — which is why real copy propagation is a dataflow analysis rather than a peephole check.
</details>

<details>
<summary><strong>Q2.</strong> §7.3's leader rule marks the instruction after <em>any</em> jump as a leader — including after an <strong>unconditional</strong> <code>goto</code>. But nothing falls through a <code>goto</code>. Why is the rule stated that way, and what does it produce here?</summary>

**Why:** the rule is about where blocks can *begin*, not about whether they're reachable. An instruction following a `goto` cannot be reached by falling through — but it can perfectly well be reached by a jump from elsewhere. If it weren't a leader, that incoming jump would land mid-block, violating the guarantee (§7.3) that a block is entered only at its top. Making it a leader unconditionally is the simple, always-correct rule; deciding reachability is a separate question answered later, on the graph.

**What it produces here:** instruction 7 is `goto L0`, so instruction 8 is a leader by rule (c) — and it's *also* a leader by rule (b), since it's the label `L2`, the target of the `ifFalse`. The rules overlap harmlessly (leaders are a set), and block `B3` is genuinely reachable.

**Where it produces something more interesting** is when the two rules *don't* coincide — a `goto` followed by an instruction nothing jumps to. That block gets created and then has **no incoming edges**: unreachable code. Which is a feature, not waste. Building the block anyway means unreachable code is discovered *uniformly*, as "a CFG node with no predecessors," rather than needing a special check during block construction. That's how dead-code warnings for statements after a `return` are implemented, and it's the same design instinct as Q1: **generate uniformly, let a later pass ask the interesting question.**
</details>

<details>
<summary><strong>Q3.</strong> The IR uses unlimited temporaries — <code>t0</code>, <code>t1</code>, <code>t2</code>, and a large function might use hundreds. A real CPU has perhaps 16 general-purpose registers. What has this chapter quietly deferred, and why was deferring it the right call?</summary>

It deferred **register allocation** — the mapping from unboundedly many virtual temporaries onto a small fixed set of physical registers, spilling to memory when they don't fit.

**Why deferring is right, not lazy.** Had lowering been forced to assign real registers immediately, it would have to reason simultaneously about translating the program's *meaning* and about a hard resource constraint — and worse, it would have to make allocation decisions before knowing the program's final shape. Optimisation (Ch09) deletes instructions, moves code out of loops, and folds constants; every one of those changes which values are live where. Allocating first means every optimisation invalidates the allocation.

So the pipeline is deliberately ordered: **lower assuming infinite registers → optimise freely → allocate last, against the final code.**

**What allocation needs, which this chapter built:** the key question is *which temporaries are live simultaneously*, because two values live at the same time cannot share a register. Answering it needs exactly what §7.1–7.4 produced — named intermediates (so liveness is a question about a specific thing), a linear order within blocks (so "before" and "after" are literal), and a CFG (so liveness can be propagated across branches and around the loop's back edge).

The classic formulation is graph colouring: build an interference graph where temporaries are nodes and an edge means "live at the same time," then colour it with *k* colours for *k* registers. Chapter 8.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why leave the AST | It implies what the back end needs explicit: control flow (in node kinds), evaluation order, intermediate values, and four constructs meaning one thing |
| Three-address code | One operation, ≤3 operands. Forces every intermediate to be **named**, which is what makes liveness a well-formed question |
| Lowering control flow | Labels + conditional jumps. `while`/`for`/`do-while`/`break` all collapse to the same pieces — **one implementation per optimisation instead of four** |
| Leader rule | First instruction, any jump target, anything after a jump. Derived from the two ways straight-line execution can be violated |
| Basic block | Leader to next leader. **Verified 4 blocks** — within one, control flow is trivially sequential, so most analyses become a forward scan |
| CFG | Blocks as nodes, transfers as edges. **Verified 4 edges.** Reachability, liveness, and loops all become graph questions |
| Back edges | `B2 → B1` **found structurally** — the builder never knew the source had a `while` |
| m + n, not m × n | One front end per language, one back end per target, optimisations written once. Why Rust/Swift/Julia/Clang share a back end |
| When it breaks | Lowering is lossy: the AST *said* `while`, and the CFG had to rediscover the loop via back-edge analysis. Real compilers use several IRs at descending levels (Rust HIR→MIR→LLVM IR) and lower only when each level's passes are done |

## Where We Go Next

The program is now a control-flow graph of basic blocks holding three-address instructions — linear, explicit, uniform, and analysable. Every later pass is written against this shape rather than against source syntax.

Two things remain, and Q3 named the tension between them. The IR assumes **unlimited temporaries**; real hardware has around sixteen registers. And the IR is deliberately naive — Q1's redundant copies are only the most visible waste. Both are back-end problems, and their order matters: optimisation must come before allocation, because every optimisation changes which values are live. Chapter 8 takes the instruction sequence to real machine code, and confronts the register problem directly via liveness analysis and graph colouring.

*Next: [08_Code_Generation_Register_Allocation.md](08_Code_Generation_Register_Allocation.md)*
