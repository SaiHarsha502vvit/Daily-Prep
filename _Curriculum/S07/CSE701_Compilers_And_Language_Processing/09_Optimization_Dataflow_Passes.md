# Chapter 9 — Optimization & Dataflow Passes

> Optimisation is not a bag of tricks. It is one algorithm — propagate facts through a graph until they stop changing — instantiated four or five different ways, plus the unresolved engineering problem of what order to run them in.

---

## The Problem

The pipeline works, and Chapter 8's challenge questions catalogued how much waste it carries: a dead instruction was allocated a register (Q1), Chapter 7's redundant copies were never cleaned (Ch07 Q1), and values were spilled that better decisions might have kept.

Take a block with several kinds of waste at once:

```
x = 3
y = 4
z = x + y        ← computable now: 7
w = z * 2        ← computable now: 14
p = a + b
q = a + b        ← identical to p, recomputed
r = p * q
dead = w + 1     ← never read
out = r + w
```

Nine instructions, only some of which need to exist at runtime. This chapter builds the passes that find that out — and then confronts the fact that the order you run them in changes the answer.

## 9.1 Constant Folding and Propagation

Two cooperating ideas:

- **Folding** — if both operands of an operation are known constants, do the arithmetic at compile time and replace the instruction with its result.
- **Propagation** — if a variable is known to hold a constant, substitute that constant wherever the variable is read.

Neither is much use alone; together they cascade. `x = 3` and `y = 4` make `z = x + y` become `z = 3 + 4`, foldable to `z = 7`. Now `z` is itself a known constant, so `w = z * 2` becomes `w = 14`. **Each fold creates the conditions for the next** — the first hint that passes are not independent.

Implementation: walk forward keeping a map from variable to known-constant. Substitute on read, fold when both operands are constant, and — the step that's easy to forget — **invalidate** the map entry when a variable is reassigned to something non-constant. Miss that and the pass propagates stale values, producing wrong code.

## 9.2 Common Subexpression Elimination

`p = a + b` and `q = a + b` compute the same thing. The second can reuse the first's result:

```
p = a + b
q = p          ← reuse instead of recompute
```

Implementation: keep a map from expression-key `(op, left, right)` to the variable already holding it. On each instruction, look up the key — if present, replace with a copy; otherwise record it.

**The correctness condition is the interesting part.** Reusing `p` for `q` is valid only if **neither `a` nor `b` was reassigned between the two computations**. If `a` changed, the two `a + b` expressions denote different values despite looking identical. So CSE isn't a syntactic match — it requires knowing which definitions of `a` and `b` *reach* each use. That requirement will drive Chapter 10.

## 9.3 Dead Code Elimination

An instruction is dead if its result is never read. `dead = w + 1` is never used, so it goes.

The pass is **Chapter 8's liveness analysis plus a deletion step** — walk backwards maintaining the live set, and delete any instruction whose target isn't live at that point. Nothing new is required, which is worth noticing: the analysis built for register allocation turns out to be an optimisation pass with three lines added.

**It cascades backwards.** Removing `dead = w + 1` may make `w` dead if that was its only use, which may kill whatever computed `w`. So DCE must repeat until nothing more is removable — a fixpoint, the same shape as liveness itself.

As Chapter 8's Q1 noted, "never read" isn't quite "removable": an instruction that can trap, perform I/O, or write through a pointer has effects that matter even when its value doesn't. Real DCE removes only instructions that are dead **and** side-effect-free.

## 9.4 The Combined Result

Running fold → CSE → DCE, iterating until nothing changes:

```
p = a + b
r = p * p
out = r + 14

9 -> 3 instructions (67% removed)
```

*(Verified.)* Every constant collapsed into the one place it was needed, the duplicate `a + b` became a reuse (and then CSE's copy `q = p` let `r = p * q` become `r = p * p`, so the copy itself became dead), and the unused instruction vanished. Only `a + b`, one multiply, and one add survive — because only those depend on values unknown at compile time.

## 9.5 Order Matters — Measurably

The passes enable each other, so the sequence you run them in is not a detail. Running each order **once**:

```
fold -> cse -> dce  :  3 instructions
cse -> fold -> dce  :  3 instructions
dce -> cse -> fold  :  8 instructions
```

*(Verified.)* The same three passes, the same input, and a **3× difference** in output size.

Why `dce → cse → fold` does so badly: DCE runs first, when `dead = w + 1` still *looks* useful — `w` is read by `out = r + w` at that point, so nothing appears removable. By the time folding has collapsed the constants and made the real structure visible, DCE has already had its turn and won't run again. **A pass that runs too early does its job correctly against information that hasn't arrived yet.**

## 9.6 Iteration Rescues Bad Orders — Sometimes

The obvious fix is to stop running each pass once and instead loop until nothing changes:

```
order fold->cse->dce   ->  3 instructions after 2 rounds
order dce->cse->fold   ->  3 instructions after 3 rounds
```

*(Verified.)* Both orders now reach 3 instructions. The bad order isn't wrong, just slower to converge — it needed an extra round for the information to propagate.

**This is worth stating carefully, because it's easy to over-conclude.** Iterating to a fixpoint fixes order-sensitivity that comes from passes **enabling** each other, and that's a large fraction of real cases. It converged here. It does not follow that iteration fixes phase ordering in general — §9.8 is the case it cannot touch.

## 9.7 The Common Shape: Dataflow Analysis

Step back and the passes look like one algorithm in different clothes. Each propagates facts through the CFG until a fixpoint, and each is specified by four choices:

| Choice | Liveness (Ch08) | Constant propagation |
|---|---|---|
| **Direction** | Backward (uses are ahead) | Forward (definitions are behind) |
| **Facts** | Set of live variables | Map: variable → known constant |
| **Transfer function** | `(out − def) ∪ use` | Substitute, fold, invalidate on reassignment |
| **Meet operator** (at merges) | Union — live on *any* path | Intersection — constant only if constant on *every* path |

That last row carries the most weight. The meet operator encodes whether the analysis asks a **may** question or a **must** question:

- *Is this value live?* → **may** — live on any one path is enough to matter, so **union**.
- *Is this variable a known constant?* → **must** — if two paths merge carrying `x = 3` and `x = 5`, nothing is known, so **intersection**.

Get that backwards and the analysis is unsound in a way that produces wrong code rather than merely worse code: assuming `x = 3` on a path where it's 5 will fold an incorrect value into the program.

This is the **dataflow framework**, and it's why Chapter 8's liveness generalised so easily into an optimisation pass. Once you can specify direction, fact domain, transfer function, and meet operator, you get the fixpoint solver for free. Reaching definitions, available expressions, very-busy expressions, and null-pointer analysis are all the same machine with different settings.

## 9.8 When It Breaks: Conflicting Objectives

§9.6 showed iteration rescuing a bad order. Here is the case it cannot.

**Loop-invariant code motion** hoists a computation that produces the same value every iteration out of the loop:

```
while (i < n) {              t = w + 1          ← hoisted, computed once
    t = w + 1        →       while (i < n) {
    use(t, i)                    use(t, i)
}                            }
```

Unambiguously fewer operations executed — a computation that ran *n* times now runs once. And yet it can make the program **slower**, because `t` is now live across the entire loop body. That's one more value competing for registers exactly where pressure is highest, and if it forces a spill, the loop gains a memory load per iteration — plausibly costing more than the arithmetic saved.

**This is not fixable by iterating.** The two passes aren't failing to communicate; they have **genuinely opposed objectives**. LICM minimises operations executed. Register allocation minimises memory traffic. Running LICM again won't help, and neither will running it later — the question of whether hoisting is profitable *depends on an allocation decision that hasn't been made yet*, and allocation must run last (Ch08 Q3) precisely because optimisation keeps changing its inputs.

That circular dependency is the **phase-ordering problem** in its real form:

- **Enabling** relationships (§9.5) → solvable by iterating to a fixpoint
- **Conflicting objectives** (this section) → not solvable by ordering at all, because no order is optimal for every program

Real compilers respond with **a fixed, empirically-tuned pipeline** — LLVM's `-O2` is a specific pass sequence chosen by benchmarking, not derived — plus heuristics that estimate the other pass's cost (LICM implementations track approximate register pressure and decline to hoist when it's already high). Research on iterative compilation and machine-learning pass selection exists precisely because the problem has no closed-form answer.

**The honest summary:** `-O2` is not "the optimal set of optimisations." It's a good default found by measurement, and the reason `-O3` is sometimes slower than `-O2` on real programs.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §9.2 says CSE must confirm that neither <code>a</code> nor <code>b</code> was reassigned between the two computations of <code>a + b</code>. Express that requirement as a dataflow analysis using §9.7's four choices — and say what makes it awkward.</summary>

The analysis is **available expressions**:

| Choice | Value |
|---|---|
| **Direction** | Forward — an expression becomes available where it's computed, and stays available going forward |
| **Facts** | The set of expressions currently computed and still valid |
| **Transfer** | Computing `a + b` adds it; assigning to `a` **kills** every expression mentioning `a` |
| **Meet** | **Intersection** — available only if available on *every* incoming path (a **must** analysis) |

The meet operator is the important one. If a merge point has `a + b` available on one branch and not the other, reusing it is unsound: on the second path there's no earlier value to reuse. That's the same must/may distinction as constant propagation, and getting it wrong produces wrong code, not just slower code.

**What makes it awkward:** the *kill* step is where real difficulty lives. Assigning to `a` kills `a + b`, which is straightforward when you can see the assignment. But `*ptr = 5` might modify `a` if `ptr` points at it — and a call `f()` might modify anything reachable. Without **alias analysis**, a compiler must conservatively assume any indirect write kills every expression involving a variable that might be aliased, which discards most available expressions and makes CSE nearly useless around pointers.

There's a deeper irritation, and it motivates the next chapter: the whole notion of "was `a` reassigned?" only exists because a variable can be assigned many times. Every one of these analyses spends effort tracking *which* definition of `a` is current. If each variable had exactly one definition, "was it reassigned?" would be unaskable — the question would dissolve rather than be answered.
</details>

<details>
<summary><strong>Q2.</strong> §9.7 says constant propagation must use intersection at merge points: if two paths carry <code>x = 3</code> and <code>x = 5</code>, nothing is known. But consider a merge where <em>both</em> paths carry <code>x = 3</code>. What should the analysis conclude, and what does that tell you about how "facts" should be represented?</summary>

It should conclude `x = 3` — and getting that right requires the fact domain to be a **lattice** rather than a plain set.

Three distinguishable states per variable are needed:

- **⊤ (top / "no information yet")** — the initial state before any path has been examined
- **A specific constant** — every path examined so far agrees on this value
- **⊥ (bottom / "not a constant")** — paths disagree, or the value is computed at runtime

The meet operation is then defined pairwise:

```
⊤    ⊓ anything  =  anything      (no information doesn't contradict anything)
3    ⊓ 3         =  3             (agreement -- both paths, same value)
3    ⊓ 5         =  ⊥             (disagreement kills it)
⊥    ⊓ anything  =  ⊥             (once unknown, stays unknown)
```

Naive set-intersection can't express this, because it has no way to distinguish "I haven't looked yet" from "I looked and found nothing." That distinction is essential for initialisation: starting every variable at ⊥ means the analysis concludes nothing anywhere; starting at ⊤ lets real facts flow in and be narrowed as paths merge.

**Why a lattice specifically:** the ordering `⊤ > constant > ⊥` guarantees that meet only ever moves facts *downward*, and the chain is finite (height 3). That's what makes iteration **terminate** — facts can't oscillate, only degrade, and there are finitely many degradations available. Any dataflow analysis whose fact domain forms a finite-height lattice with a monotone transfer function is guaranteed to reach a fixpoint, which is the general theorem underneath every pass in this chapter.
</details>

<details>
<summary><strong>Q3.</strong> Q1 ended by noting that "was <code>a</code> reassigned?" only exists as a question because a variable can be assigned many times. Suppose the IR guaranteed every variable is assigned exactly once. Which analyses get easier — and what new problem appears at merge points?</summary>

**What gets easier — a lot.** With one definition per variable, a use's defining instruction is determined by its *name alone*. No analysis, no reaching-definitions computation, no walking backwards.

- **Constant propagation** — `x` is a constant iff its single defining instruction produces one. Look it up; no forward dataflow needed for the straight-line case.
- **CSE** — two occurrences of `a + b` refer to the same `a` and the same `b` *by construction*, because those names can't have been reassigned. Q1's entire correctness condition evaporates.
- **DCE** — a definition is dead iff its name appears in no use. A use-count, not a backward analysis.
- **Def-use chains** — free, rather than computed and maintained.

**The new problem: merge points.** If `x` is assigned once, what happens here?

```
if (c) { x = 1 } else { x = 2 }
use(x)
```

Two assignments to `x`, which the rule forbids. Rename them `x1 = 1` and `x2 = 2` — and now `use(x)` has no idea which name to read, because it depends on a runtime branch.

The resolution is a **φ (phi) function**, a pseudo-instruction at the merge that selects by incoming edge:

```
x3 = φ(x1, x2)
use(x3)
```

`x3` is still assigned exactly once, so the invariant holds, and the fact that its value depends on control flow is now *explicit in the IR* rather than implicit in the CFG's shape. φ isn't a real machine instruction — it's removed before code generation, typically by inserting copies on the incoming edges.

That form is **Static Single Assignment**, and it's why essentially every modern optimising compiler — LLVM, GCC, V8's TurboFan, HotSpot — uses it. The remaining work is deciding *where* φ functions are actually needed (not every merge needs one for every variable), which turns out to be answered precisely by dominance frontiers. Chapter 10.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Constant folding + propagation | Compute known values at compile time and substitute them; each fold enables the next |
| CSE | Reuse an already-computed expression — valid **only if** its operands weren't reassigned in between, which needs reaching-definition knowledge |
| DCE | Chapter 8's liveness analysis plus a deletion step. Cascades backwards, so it's a fixpoint too. Only removes side-effect-free instructions |
| Combined result | **Verified 9 → 3 instructions (67% removed)** — only the genuinely runtime-dependent work survives |
| Order matters | **Verified:** one pass each way gives **3 vs 8 instructions**. A pass run too early does its job correctly against information that hasn't arrived |
| Iteration helps | **Verified:** both orders reach 3 when iterated (2 vs 3 rounds). Fixes *enabling* order-sensitivity — not everything |
| Dataflow framework | Every pass = direction + fact domain + transfer function + meet operator. Specify those four and the fixpoint solver is free |
| May vs must | Liveness meets with **union** (live on any path); constant propagation with **intersection** (constant on every path). Reversing this yields wrong code, not slow code |
| The real phase-ordering problem | LICM reduces operations but raises register pressure — **conflicting objectives**, unfixable by iteration or ordering. Why `-O2` is a benchmarked default and `-O3` is sometimes slower |

## Where We Go Next

Every pass in this chapter fought the same background difficulty. CSE needed to know whether `a` had been reassigned. Constant propagation needed to know which definition reached a use. DCE needed to know whether a definition was ever read. All three are versions of one question — **which definition does this use refer to?** — and all three spent real machinery answering it.

Chapter 9's Q3 pointed at the alternative: stop answering the question and make it unaskable. If every variable is assigned exactly once, a use's definition is identified by its name, and the analyses collapse into lookups. Chapter 10 builds Static Single Assignment form, resolves the merge-point problem with φ functions, works out where they're actually required via dominance frontiers, and closes the course by connecting all of it to the JIT compiler running JavaScript in the browser.

*Next: [10_SSA_Form_And_JIT_Compilation.md](10_SSA_Form_And_JIT_Compilation.md)*
