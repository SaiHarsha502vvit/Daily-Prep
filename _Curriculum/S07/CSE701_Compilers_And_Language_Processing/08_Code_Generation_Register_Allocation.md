# Chapter 8 — Code Generation & Register Allocation

> The IR promised infinite temporaries because pretending was useful. This is the chapter where the pretence ends and a few hundred named values have to fit into sixteen registers.

---

## The Problem

Chapter 7 lowered the program to three-address code with as many temporaries as convenient — `t0`, `t1`, `t2`, and in a real function, hundreds. That was deliberate (Ch07 Q3): allocating registers during lowering would mean committing to a resource decision before optimisation has finished changing which values exist.

But x86-64 has 16 general-purpose registers, ARM64 has 31, and values that don't fit must live in memory, reloaded before each use. Memory is roughly two orders of magnitude slower than a register, so this mapping is one of the highest-leverage decisions the compiler makes.

The core question is deceptively simple: **when can two values share a register?** Obviously when they're never needed at the same time. Making "needed at the same time" precise is the whole chapter.

## 8.1 Liveness — Deriving the Analysis

A value is **live** at a point if it may be read again later. Formally: there is some path from here to a *use* of it, with no intervening redefinition.

Notice the direction that definition points. Whether `x` is live *here* depends on what happens *after* here. So the analysis runs **backwards** — from each block's exit toward its entry.

For a single instruction with defined and used variables, walking backwards:

```
live_before  =  (live_after  −  defined)  ∪  used
```

Read it as: what was needed *before* this instruction is what's needed after, minus what this instruction produces (it's now available, no longer needed from earlier), plus what this instruction consumes.

Across a whole CFG, two equations extend it:

```
live_out[B]  =  ⋃ live_in[S]   for every successor S of B
live_in[B]   =  apply the instruction rule backwards through B, starting from live_out[B]
```

**And now a genuine problem.** `live_out[B]` depends on its successors' `live_in`, but Chapter 7's CFG has a **back edge** — `B2 → B1` — so `B1` is `B2`'s successor *and* `B2` is `B1`'s successor. The equations are mutually recursive; there's no ordering that computes each once.

The resolution is **iteration to a fixpoint**: initialise every set empty, apply the equations repeatedly, stop when nothing changes. It terminates because the sets only ever grow and are bounded by the finite variable set. Running it on Ch07's CFG:

```
fixpoint in 3 rounds
   B0  live_in=[]      live_out=['x']
   B1  live_in=['x']   live_out=['x']
   B2  live_in=['x']   live_out=['x']
   B3  live_in=['x']   live_out=[]
```

*(Verified.)* Read `B2`: `x` is live on both entry and exit — because the loop body reassigns it and the next iteration's condition reads it. That fact is only discoverable by going around the back edge, which is exactly why one pass isn't enough. This is the first genuine **dataflow analysis**, and Chapter 9's optimisations are all variations on this same fixpoint shape.

## 8.2 The Interference Graph

Liveness gives the rule directly:

> Two values **interfere** if one is live at the point where the other is defined — they need to exist simultaneously, so they cannot share a register.

Build a graph: values are nodes, interference is an edge. Then:

> **Assigning registers = colouring the graph**, where colours are registers and adjacent nodes must differ.

That's a genuine reduction, not an analogy. The constraint "adjacent nodes get different colours" *is* "simultaneously-live values get different registers."

Built for Chapter 7's loop program, the graph is disappointing — maximum degree 1, everything trivially allocatable. Which is itself informative: **a program with little going on at once produces no register pressure**. To see the mechanism work, we need a block holding several values live at once:

```
a = 1        live: [a]
b = 2        live: [a, b]
c = 3        live: [a, b, c]
d = a + b    live: [a, b, c, d]      ← four values live simultaneously
e = c + d    live: [a, b, d, e]
f = a + e    live: [b, d, f]
g = b + f    live: [d, g]
h = d + g    live: []

peak simultaneous live values: 4
```

*(Verified.)* `a` stays live from instruction 1 to instruction 6 because `f = a + e` reads it late — a **long live range**, crossing four other definitions, and long ranges are what create pressure. The resulting graph:

```
a: [b, c, d, e]        degree=4
b: [a, c, d, e, f]     degree=5
c: [a, b, d]           degree=3
d: [a, b, c, e, f, g]  degree=6
e: [a, b, d]           degree=3
f: [b, d]              degree=2
g: [d]                 degree=1
h: []                  degree=0
```

`d` has degree 6 — it's live across most of the block, so it conflicts with almost everything. `h` has degree 0: defined last, never read, interfering with nothing.

## 8.3 Colouring — Chaitin's Algorithm

Graph colouring is NP-complete in general (§8.5), so real allocators use a heuristic built on an observation from **Kempe (1879)**:

> If a node has **fewer than *k* neighbours**, it can always be coloured — *whatever* colours its neighbours receive. With at most *k−1* neighbours, they use at most *k−1* distinct colours, so at least one of *k* remains free.

Verified for k=3: every node of degree < 3 has at most 2 neighbours, so a free colour must exist. That guarantee drives a two-phase algorithm:

**Simplify** — repeatedly find a node with degree < *k*, push it on a stack, remove it from the graph. Removing it lowers its neighbours' degrees, often making *them* simplifiable. Cascade until the graph is empty.

**Select** — pop nodes in reverse, assigning each a colour differing from its already-coloured neighbours. Kempe's rule guarantees one is available.

The ordering is the whole trick: **remove in easy-first order, colour in reverse.** By the time a node is popped, only the neighbours removed *before* it are coloured — and there were fewer than *k* of them.

## 8.4 Spilling — When Colouring Fails

Simplify can stall: every remaining node has degree ≥ *k*. Then some value must be **spilled** — kept in memory, loaded before each use and stored after each definition.

Spilling is what makes the allocator *always succeed*, at a runtime cost. Verified across three register budgets on the graph above:

```
k=4:  a->r3, b->r2, c->r0, d->r1, e->r0, f->r0, g->r0, h->r0
      spilled: none          registers used: 4       VALID: True

k=3:  b->r2, c->r0, d->r1, e->r0, f->r0, g->r0, h->r0
      spilled: ['a']         registers used: 3       VALID: True

k=2:  c->r0, d->r1, e->r0, f->r0, g->r0, h->r0
      spilled: ['a', 'b']    registers used: 2       VALID: True
```

*(Verified — each result checked so that no interfering pair shares a register.)*

Two things worth reading off. **k=4 fits exactly**, matching the peak of 4 simultaneous live values from §8.2 — no coincidence, and §8.5 explains why. And the spill choice is sensible: `a` goes first, the value with a long range and high degree, so evicting it relieves the most conflicts.

Real allocators refine this with a **spill cost** heuristic — roughly *degree ÷ (uses weighted by loop depth)* — because spilling a value used once outside a loop is nearly free, while spilling one used every iteration of a hot loop is catastrophic. A value used inside a triply-nested loop is typically weighted ~1000× one at top level.

## 8.5 When It Breaks: NP-Completeness, and Why JITs Don't Do This

Graph colouring is **NP-complete** — for arbitrary graphs and *k* ≥ 3, no known polynomial algorithm finds an optimal colouring ([`A3_Lower_Bounds_And_NP`](../../../03_Algorithms/A3_Lower_Bounds_And_NP.md) covers the machinery). Chaitin's algorithm is therefore a *heuristic*: it always produces valid code, sometimes with more spills than strictly necessary.

**But the picture is subtler, and the earlier example gives it away.** For **straight-line code**, a value's live range is a contiguous interval, and interference means overlapping intervals — making the interference graph an **interval graph**. Interval graphs are *perfectly* colourable in polynomial time, with chromatic number equal to the largest set of mutually overlapping intervals. That's exactly why §8.4's k=4 matched §8.2's peak-live of 4: the block is straight-line, so the peak *is* the answer.

Add control flow and it collapses. A value live around a loop or along one branch but not another no longer occupies a single interval, the graph stops being an interval graph, and the NP-complete general case returns. **Branches and loops are what make register allocation hard** — not the number of variables.

This split has a direct practical consequence: **JIT compilers usually don't use graph colouring at all.** Building the interference graph and running simplify/select costs real compile time, which a JIT pays *during execution*. So they use **linear scan** — sort live intervals by start point, sweep once, assign greedily, evict the interval ending furthest away when out of registers. Much faster to run, typically a few percent worse code. For V8 or a JVM tier compiling on the hot path, that trade is correct; for an ahead-of-time compiler with `-O2` and no runtime deadline, it isn't. ([`12_V8_Engine_Internals`](../../../16_JavaScript/12_V8_Engine_Internals.md) covers the tiering strategy this serves.)

## Section Challenge

<details>
<summary><strong>Q1.</strong> In §8.2's example, <code>h = d + g</code> is the last instruction and <code>h</code> has degree 0 — it interferes with nothing. What does that tell you about <code>h</code>, and what should a compiler do about it before allocation runs?</summary>

Degree 0 means `h` is live at no point where anything else is defined — and looking at the live-range table, `h` is live *nowhere at all*: the row for its own instruction shows `live: []`. It's computed and never read.

`h` is **dead**, and the right response isn't to allocate it a register — it's to **delete the instruction entirely**, before allocation runs. That's dead code elimination (Ch09), and this is a good example of *why pass ordering matters*: allocating a register to `h` is wasted work on an instruction that shouldn't exist.

Two refinements worth noting:

**Dead code elimination cascades.** Removing `h = d + g` may make `g` dead, if `g`'s only use was here. Removing `g = b + f` may then kill `f`, and so on backwards. So DCE is itself a fixpoint computation — repeat until nothing more is removable — the same shape as §8.1's liveness, which is not a coincidence: **DCE is liveness analysis plus a deletion step.** A definition whose target isn't live immediately after it is dead.

**"Never read" isn't always "removable."** If the instruction could trap (division by zero), perform I/O, or write through a pointer, its *effects* matter even when its result doesn't. Real DCE removes only instructions that are both dead and side-effect-free — which is why compilers can eliminate an unused arithmetic result but not an unused function call, unless they can prove the call is pure.
</details>

<details>
<summary><strong>Q2.</strong> §8.4 spilled <code>a</code> first at k=3 — the highest-degree long-range value. A colleague proposes always spilling the highest-degree node, since it frees the most conflicts. Give a case where that's clearly the wrong choice.</summary>

Highest-degree is a reasonable *first* approximation but ignores the thing that actually determines cost: **how often the spilled value is accessed at runtime.**

The counterexample: a loop induction variable.

```
i = 0
while (i < 1000000) {
    ...long body defining many temporaries...
    i = i + 1
}
```

`i` is live across the entire loop body, so it interferes with every temporary defined inside — potentially the highest degree in the whole function. Degree-based selection spills it immediately.

But `i` is read and written **every iteration** — two million memory accesses in this loop. Meanwhile some temporary in the body with degree 5, used once per iteration in a rarely-taken branch, might cost a few thousand. Spilling `i` frees more edges and produces dramatically slower code.

**Degree measures how much spilling helps the allocator; it says nothing about how much it hurts the program.** The standard fix is a cost-benefit ratio — roughly *degree ÷ spill-cost*, where spill cost weights each access by `10^loop-depth`. Under that, `i` at depth 1 carries weight ~10 per access against a top-level temporary's 1, and the allocator spills the body temporary instead.

This is also why register allocation must run *after* the optimiser has finished restructuring loops: loop depth is an input to the decision, and passes like loop-invariant code motion (Ch09) change what's inside a loop at all.
</details>

<details>
<summary><strong>Q3.</strong> The pipeline is nearly complete — the program is real machine instructions in real registers. But §8.4's <code>k=2</code> spilled two values, and Ch07's IR was full of redundant copies. What class of improvement has been left on the table, and why does it have to happen <em>before</em> this chapter's work rather than after?</summary>

What's been left is **optimisation** — the passes that make the code do less work: constant folding, copy propagation, common subexpression elimination, dead code elimination, loop-invariant code motion.

Chapter 7's lowering was deliberately naive, generating `t1 = x + 1; x = t1` where one instruction would do (Ch07 Q1). Nothing has cleaned that up. And this chapter allocated registers for `h` (Q1) — a value that shouldn't exist.

**Why the ordering is forced, in both directions:**

*Optimisation must precede allocation* because optimisation changes **which values are live where** — the sole input to allocation. Delete an instruction and a live range shortens, possibly disappearing. Hoist an expression out of a loop and it becomes live *across* the whole loop, sharply increasing pressure. Fold a constant and a temporary vanishes. Every one of these invalidates an existing allocation, so allocating first means redoing it after every pass.

*Allocation must be last* for the mirror reason: it's the step that finally commits to a fixed resource, and until nothing else will change the code, committing is premature. This is why Ch07 deliberately assumed infinite registers — it kept the IR free to be rewritten.

There's a real tension in that ordering, worth seeing now. Some optimisations *increase* register pressure — loop-invariant code motion computes something once and holds it live across the whole loop, trading arithmetic for a longer live range. A pass that speeds things up in isolation can force a spill that costs more than it saved, and the optimiser can't perfectly predict it because allocation hasn't run yet. That's a specific instance of the **phase-ordering problem**: passes interact, no order is optimal for all programs, and real compilers use a fixed, empirically-tuned pipeline plus heuristics. Chapter 9.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The problem | Unbounded IR temporaries onto ~16 physical registers; memory is ~100× slower, so this mapping is high-leverage |
| Liveness | A value is live if it may be read later — so the analysis runs **backwards**: `live_before = (live_after − def) ∪ use` |
| Fixpoint iteration | Back edges make the equations mutually recursive, so iterate until nothing changes. **Verified: 3 rounds** on Ch07's CFG. Every Ch09 analysis has this shape |
| Interference | Two values interfere if one is live where the other is defined — they can't share a register |
| Allocation = colouring | A genuine reduction: adjacent nodes differ ⟺ simultaneously-live values get different registers |
| Kempe's rule (1879) | A node with < *k* neighbours is always colourable — its neighbours use ≤ *k−1* colours, so one is free |
| Chaitin's algorithm | **Simplify** (remove degree < *k*, cascading) then **Select** (pop in reverse, colour). Remove easy-first, colour in reverse |
| Spilling | **Verified:** k=4 fits with no spills; k=3 spills `a`; k=2 spills `a`,`b` — all validated as conflict-free |
| Straight-line is easy | Live ranges are intervals → interval graph → polynomial and optimal. Peak-live 4 exactly predicted the 4 registers needed |
| Control flow is what's hard | Loops and branches break the interval property, restoring the NP-complete general case |
| JITs use linear scan | Graph colouring costs compile time a JIT pays at runtime; linear scan is much faster for a few percent worse code |

## Where We Go Next

The pipeline now runs end to end: text → tokens → tree → AST → resolved and typed → IR and CFG → machine code in real registers. It works. It is also, as all three challenge questions established, doing more work than necessary — dead instructions allocated registers, redundant copies never cleaned, values spilled that better decisions could have kept.

Chapter 9 adds the optimisation passes, all built on §8.1's fixpoint dataflow shape: constant propagation, dead code elimination, common subexpression elimination, and loop-invariant code motion. And it confronts the tension Q3 exposed — that passes interact, that some trade one cost for another, and that no ordering is optimal for every program.

*Next: [09_Optimization_Dataflow_Passes.md](09_Optimization_Dataflow_Passes.md)*
