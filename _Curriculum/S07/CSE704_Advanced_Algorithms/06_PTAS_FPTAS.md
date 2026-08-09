# Chapter 6 — Approximation Schemes: PTAS and FPTAS

> A fixed 2-approximation is a single point on a dial that was never built to turn. What if the accuracy itself could be a knob — pay more computation, buy back more of the gap to optimal, on a curve you control instead of one some proof handed you once and for all?

---

## The Problem

[A3. Lower Bounds and NP-Completeness](../../../03_Algorithms/A3_Lower_Bounds_And_NP.md) already covers the standard toolkit for NP-hard optimization problems: vertex cover's 2-approximation, greedy set cover's `O(log n)` guarantee, and the triangle-inequality argument behind TSP approximation. Every one of those is a *fixed* ratio — 2-approximation means 2-approximation, take it or leave it, regardless of how much more time you're willing to spend for a better answer. This chapter's actual new content is what that file doesn't cover: schemes where the *accuracy itself* is an input, and more computation buys a provably tighter guarantee, continuously, on a dial you control.

The knapsack problem is NP-hard (per A3's coverage of NP-completeness), but its exact dynamic-programming solution — build a table indexed by achievable total weight, fill it in `O(nW)` — runs in time depending on `W`, the numeric *magnitude* of the weight bound. That's the exact same pseudo-polynomial trap Chapter 2 hit with Ford-Fulkerson's iteration count: `O(nW)` is polynomial in the *value* of `W`, not in the number of *bits* needed to write `W` down, so doubling the precision of the weights can double the runtime even though the input barely grew. The question this chapter answers: is there a way to trade a *controlled, bounded* amount of accuracy for a runtime that's genuinely polynomial — in both the input size *and* the desired precision?

## 6.1 PTAS and FPTAS: What the Guarantee Actually Promises

A **polynomial-time approximation scheme (PTAS)** is a family of algorithms, one for every error tolerance `ε > 0`, each running in time polynomial in the input size `n` (for that *fixed* `ε`) and returning a solution within a `(1 ± ε)` factor of optimal. The catch: nothing bounds how the runtime depends on `ε` itself — going from `ε = 0.1` to `ε = 0.01` could mean a runtime blow-up far worse than polynomial in `1/ε`.

A **fully polynomial-time approximation scheme (FPTAS)** closes exactly that gap: runtime polynomial in *both* `n` and `1/ε`. That's a meaningfully stronger, more practically usable promise — accuracy becomes a genuine dial, not a cliff.

## 6.2 Deriving the Knapsack FPTAS

The exact DP's problem is that `W` (or, symmetrically, indexing by total *value* instead of weight, `V`, the sum of all item values) can be astronomically large relative to `n`. The fix: don't index the DP by the *real* values — index it by *scaled-down* values, chosen small enough that the table itself is guaranteed to be polynomial-sized, and control exactly how much accuracy that scaling costs.

Pick a scaling factor `K`, and replace every item's value `vᵢ` with `v'ᵢ = ⌊vᵢ / K⌋`. Solve the knapsack *exactly* on these scaled values — DP indexed by achievable *scaled*-value totals, storing the minimum weight needed to reach each one — and report whichever achievable scaled-value total has the largest *real* value among those fitting the capacity. Choosing `K = ε · vmax / n` (where `vmax` is the largest value among items that individually fit the capacity) keeps the DP table's size at `O(n · vmax/K) = O(n²/ε)` — polynomial in both `n` and `1/ε`, exactly the FPTAS requirement.

**Why does this give a `(1−ε)`-approximation, not just "some" approximation?** Flooring means `K·v'ᵢ ≤ vᵢ < K·v'ᵢ + K`, so summed over any set `S` of at most `n` items: `v(S) − nK < K·v'(S) ≤ v(S)`. Apply the right-hand inequality to the DP's chosen set `S'`: `v(S') ≥ K·v'(S')`. Since `S'` was chosen to *maximize* scaled value subject to the same weight limit that the true optimum `OPT` also respects, `v'(S') ≥ v'(OPT)`. Chain these together with the left-hand inequality applied to `OPT`: `v(S') ≥ K·v'(S') ≥ K·v'(OPT) > v(OPT) − nK`. Since `nK = ε·vmax` and `vmax ≤ v(OPT)` (the best single fitting item is never worth more than the true optimum), this becomes `v(S') > v(OPT) − ε·v(OPT) = (1−ε)·v(OPT)` — the guarantee, derived rather than asserted.

## 6.3 Verifying the Guarantee, and Watching It Actually Bite

A deliberately adversarial instance makes the mechanism visible rather than abstract: one dominant item (value 1000, weight 100 — exactly the capacity) against ten small items (value 105, weight 10 each — together, weight 100, value 1050, edging out the dominant item by 50):

```
Brute-force OPT = 1050, items = [1..10]  (the ten small items together)

   eps | FPTAS value | ratio (val/OPT) | required >= 1-eps | holds
   0.5 |        1000 |          0.9524 |            0.5000 |  True
   0.3 |        1000 |          0.9524 |            0.7000 |  True
   0.2 |        1000 |          0.9524 |            0.8000 |  True
   0.1 |        1050 |          1.0000 |            0.9000 |  True
  0.05 |        1050 |          1.0000 |            0.9500 |  True
```

At `ε ≥ 0.2`, the FPTAS genuinely gets it *wrong* — it returns the dominant item alone (1000), missing the true optimum (1050) by a real, non-trivial 4.76%. Why: `vmax = 1000` (the dominant item), so a large `ε` forces a coarse `K`, and each small item's value (105) rounds down to a scaled value that can't distinguish "ten of these together" from "worth slightly less than the dominant item" — the DP, working only in scaled terms, picks the dominant item because it *looks* better once precision is lost. At `ε ≤ 0.1`, `K` shrinks enough to preserve that distinction, and the FPTAS switches to the true optimum exactly. The guaranteed bound `(1−ε)` held at every single tested `ε` — sometimes loosely, but never violated, exactly as derived in §6.2.

Contrast this with a non-adversarial instance (six items, no engineered near-tie): the FPTAS finds the exact optimum at *every* tested `ε`, including `ε = 0.5`. Both outcomes are consistent with the same guarantee — `(1−ε)` is a worst-case floor, not a typical-case prediction, and most real instances don't sit anywhere near that floor.

The other half of the tradeoff — what finer accuracy actually costs:

```
eps=   0.5: DP table size V=    42, value=1000 (ratio 0.9524), wall time=0.305 ms
eps=   0.1: DP table size V=   219, value=1050 (ratio 1.0000), wall time=1.214 ms
eps=  0.01: DP table size V=  2250, value=1050 (ratio 1.0000), wall time=16.929 ms
eps= 0.005: DP table size V=  4510, value=1050 (ratio 1.0000), wall time=29.082 ms
```

Table size and runtime both grow roughly linearly as `1/ε` grows — exactly the polynomial-in-`1/ε` dependence the FPTAS promises, not an exponential one. That smooth, bounded knob is the entire point: accuracy can be bought incrementally, on a predictable budget, rather than jumping straight from "fast but fixed-ratio" to "exact but potentially exponential."

**When it breaks:** the knob doesn't turn all the way to zero. As `ε → 0`, `K = εvmax/n → 0`, and the table size `O(n²/ε)` grows without bound:

```
eps=0.001:  DP table size V=22550
eps=0.0001: DP table size V=225489
eps=0: raises MemoryError
```

This isn't an implementation bug — it's the FPTAS's fundamental boundary made concrete. If a polynomial-in-`(n, 1/ε)` algorithm could be pushed all the way to `ε = 0` and still run in polynomial time, it would be a polynomial-time *exact* algorithm for an NP-hard problem, implying `P = NP`. The scheme's own accuracy dial is proof, by construction, that it can approach — but never reach — exactness in polynomial time.

## Section Challenge

<details>
<summary><strong>Q1.</strong> The proof in §6.2 uses <code>vmax ≤ v(OPT)</code> — the best individually-fitting item is never worth more than the true optimum. Why does this step specifically require pre-filtering out items that don't fit the capacity <em>alone</em>?</summary>

Without pre-filtering, `vmax` could be the value of an item too heavy to include in *any* feasible solution by itself — a number with no relationship to what's actually achievable. The proof needs `vmax ≤ v(OPT)` to convert `nK = ε·vmax` into `ε·v(OPT)`, which is the step that turns an absolute error bound into a *relative* (percentage) one. That's only valid when `vmax` is itself a lower bound on `v(OPT)` — true precisely when the item achieving `vmax` is actually a legal, capacity-respecting solution on its own, which is exactly what pre-filtering guarantees.
</details>

<details>
<summary><strong>Q2.</strong> A colleague suggests: "Just run the FPTAS once with a very small fixed `ε`, like 0.0001, and use that as the default — no need to expose `ε` as a parameter at all." What's wrong with this as general advice?</summary>

Table size scales as `O(n²/ε)`, so a fixed tiny `ε` applied uniformly means every call pays the cost appropriate for the *hardest* accuracy requirement, even on instances (or use cases) that would have been fine with a much coarser, cheaper `ε`. Worse, "small" is relative to `vmax` and `n`, both of which vary per instance — an `ε` that's comfortably fast on one input can produce an enormous table on another with a larger `vmax`. The entire value of an FPTAS over a fixed-ratio approximation is that `ε` is a *live* knob meant to be set per use case; hard-coding it throws away exactly the flexibility that distinguishes an FPTAS from an ordinary constant-factor approximation.
</details>

<details>
<summary><strong>Q3.</strong> Branch and bound (Chapter 5) and the FPTAS here both start from the same underlying idea — solve a relaxed version of the problem, then correct it — but land on very different guarantees: branch and bound promises the exact answer with no runtime bound, the FPTAS promises a bounded runtime with no exactness guarantee. Randomization offers a third trade entirely: what would it mean to promise the exact answer <em>and</em> a bounded runtime, by giving up only certainty about which run you got?</summary>

That's a Las Vegas algorithm's deal: always correct when it returns an answer, with a runtime that's a random variable whose *expectation* is bounded (rather than a worst-case bound that holds on every single run, as branch and bound lacks, or an accuracy bound that holds on every run while the answer itself is allowed to be wrong, as the FPTAS accepts). Trading a worst-case runtime guarantee for an expected one — while keeping exactness fully intact — is a genuinely different lever than either of the trades made so far, and it depends on a source of randomness actually helping, on average, in a way this chapter's deterministic scaling trick never could. What that looks like concretely, and how to reason rigorously about "on average," is next.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| PTAS | Family of algorithms, one per `ε`, each polynomial in `n` for that fixed `ε` — but runtime's dependence on `ε` itself is unbounded |
| FPTAS | Stronger: polynomial in both `n` and `1/ε` — accuracy becomes a smooth, predictable dial rather than a cliff |
| Knapsack's pseudo-polynomial exact DP | `O(nW)` (or `O(nV)`) — polynomial in the *value* of the weight/value bound, not its bit-length; the same trap as Ch02's Ford-Fulkerson |
| Value scaling | `v'ᵢ = ⌊vᵢ/K⌋` with `K = εvmax/n` keeps the DP table at `O(n²/ε)` — polynomial in both `n` and `1/ε` |
| The `(1-ε)` guarantee, derived | `v(S') ≥ K·v'(S') ≥ K·v'(OPT) > v(OPT) − εvmax ≥ (1−ε)v(OPT)`, using `vmax ≤ v(OPT)` from pre-filtering |
| Guarantee verified adversarially | A dominant-item-vs-many-small-items instance shows a real 4.76% gap at coarse `ε` (ratio 0.9524, still `≥ 1−ε`), closing to exact at `ε ≤ 0.1` |
| Guarantee is a floor, not a prediction | A non-adversarial instance hits the exact optimum at every tested `ε` — the `(1-ε)` bound holds trivially there, without being tight |
| Runtime/accuracy tradeoff, verified | DP table size and wall time both grow roughly linearly in `1/ε` (42 → 4,510 entries, 0.3ms → 29ms across the tested range) |
| The limit at `ε → 0` | Table size `O(n²/ε)` grows unboundedly (verified: 225,489 entries at `ε=0.0001`, `MemoryError` at `ε=0`) — reaching exactness in polynomial time would imply `P=NP` |

## Where We Go Next

Branch and bound chased exactness with no runtime guarantee; the FPTAS just derived chases a runtime guarantee with a controlled, bounded accuracy cost — both are ways of trading against the same NP-hardness wall from different sides. Randomized algorithms open a third direction entirely: instead of trading away exactness or bounding the worst case, they trade away *certainty about which particular run you got*, in exchange for guarantees that hold *on average* or *with high probability*. That requires its own reasoning tools — starting with what happens when you contract random edges in a graph to find its minimum cut, and how to prove tail probabilities shrink exponentially rather than just polynomially.

*Next: [07_Kargers_MinCut_Chernoff_Bounds.md](07_Kargers_MinCut_Chernoff_Bounds.md)*
