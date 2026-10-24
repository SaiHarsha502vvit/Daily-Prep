# 🎓 University Proof Corner

> **Navigation**: [Chapter overview](../02b_Sorting_Advanced.md) | [The Idea →](02_the_idea.md)
> Page 1 of 6 in **Sorting Advanced**


> **MIT 6.046J L7–L9 / KTH DD2352 layer** — Why these algorithms are provably correct, and why non-comparison sorts can break the Ω(n log n) barrier.

## Correctness: Quicksort Partition Invariant

**Invariant**: After `partition(A, lo, hi)` returns pivot index `p`, every element in `A[lo..p-1]` is ≤ `A[p]`, and every element in `A[p+1..hi]` is ≥ `A[p]`.

- **Init**: Two pointers `i = lo - 1`, `j = lo` start. All unexamined elements are "unknown" — trivially satisfy the invariant on the empty known region.
- **Maintenance**: When `A[j]` is examined: if ≤ pivot, advance `i` and swap `A[i] ↔ A[j]`. After the swap, `A[lo..i]` is "known ≤ pivot". Continue until `j > hi`, then place pivot at `A[i+1]`. The invariant is preserved.
- **Termination**: When `j = hi + 1`, all elements have been classified. The pivot ends up at its final sorted position. By induction on the recursive calls, the array is sorted. ✓

## Why Counting Sort Beats Ω(n log n)

The Ω(n log n) lower bound from `A3 — Lower Bounds` applies **only to comparison sorts** — algorithms that learn element order only through pairwise `<` comparisons. **Counting sort** does not compare elements; it uses each element's value as an index into a frequency array.

```
For n elements with values in [0, k]:
  1. Count occurrences:           O(n + k)
  2. Cumulative sum:              O(k)
  3. Place each element by count: O(n)
  Total: O(n + k)
```

When `k = O(n)`, this is **O(n)** — strictly faster than any comparison sort. The Ω(n log n) bound is **model-specific**, not absolute: counting sort cannot sort arbitrary keys (strings, floats) in O(n) because such values don't have a small range to index into. Radix sort extends the trick to multi-digit keys.

## Why Randomized Quicksort is Expected O(n log n)

The deterministic quicksort can hit O(n²) on sorted input — an adversary can always construct the worst case. By picking the pivot uniformly at random:

**Claim**: Pr[elements A[i] and A[j] are ever compared] = **2 / (j - i + 1)**.

Two elements are compared iff one is the pivot before any element strictly between them. In the set S = {A[i], A[i+1], ..., A[j]} of size (j - i + 1), the first pivot chosen from S is equally likely to be any element, so Pr[it's A[i] or A[j]] = 2 / (j - i + 1).

```
Expected total comparisons
  = Σᵢ<ⱼ 2 / (j - i + 1)
  = 2n · H(n)        (H(n) = harmonic number = Θ(log n))
  = O(n log n)
```

The randomness is in the algorithm, not the input — no adversary can construct a worst case without knowing the random seed.

> Full proofs: [A1 — Algorithm Correctness](../A1_Correctness_Proofs.md) · [A3 — Lower Bounds](../A3_Lower_Bounds_And_NP.md) · [A4 — Randomized Algorithms](../A4_Randomized_Algorithms.md)

---

## Why No Comparison Sort Can Beat n log n — Building the Floor From Scratch

Everyone repeats "comparison sorting is Ω(n log n)." Almost nobody can say *why*, and the why is one of the most beautiful arguments in all of CS. Here it is, built — not cited.

### The setup: a comparison sort is a question game

A comparison sort learns about the input through exactly one kind of move: ask "is `a[i] < a[j]`?" and branch on the yes/no answer. That's it — it cannot peek at values, only compare them. So **any comparison sort is a binary decision tree**: each internal node is a comparison, each branch is an answer, and each leaf is the algorithm finally announcing "here is the sorted order."

```
                 a[0] < a[1] ?
                /             \
              yes              no
          a[1]<a[2]?        a[1]<a[2]?
           /     \           /     \
        ...     ...        ...     ...
       leaf    leaf       leaf    leaf
   (a permutation of the input = the answer this path produces)
```

### The counting punch line

To sort correctly, the tree **must have a distinct leaf for every possible answer** — because different inputs require different rearrangements, and the algorithm can only "output" what's at the leaf it lands on. How many distinct answers (orderings) are there for n elements? **n!** (n-factorial) permutations.

So the tree needs at least **n! leaves**.

Now the geometry: a binary tree of height **h** has at most **2ʰ** leaves (each level at most doubles them). To fit n! leaves you therefore need:

```
2ʰ  ≥  n!
 h  ≥  log₂(n!)
```

And the height **h is exactly the worst-case number of comparisons** — the longest root-to-leaf path is the input that makes the algorithm ask the most questions. So:

```
worst-case comparisons  ≥  log₂(n!)
```

### Finishing: log₂(n!) is Θ(n log n)

By Stirling's approximation, n! ≈ (n/e)ⁿ, so:

```
log₂(n!) ≈ n·log₂(n) − n·log₂(e)  =  n log₂ n − 1.44n  =  Θ(n log n)
```

Or without Stirling, a one-line lower bound: at least half the terms in n! = n·(n−1)···1 are ≥ n/2, so n! ≥ (n/2)^(n/2), giving log₂(n!) ≥ (n/2)log₂(n/2) = Ω(n log n). **Done.**

> **What this sentence actually means:** the bound is not "sorting is hard." It says *any* algorithm restricted to yes/no comparisons must, on its worst input, ask at least ~n log n questions — because it must be able to distinguish n! outcomes and each question only halves the candidates. Mergesort and heapsort *achieve* this floor (they're asymptotically optimal). And it tells you precisely how counting/radix sort "cheat": they don't play the comparison game at all, so the n!-leaves argument simply doesn't apply to them — there's no contradiction in their O(n).

This is also why the lower bound is **model-specific**, the deepest idea in the chapter: a lower bound is a statement about a *model of computation* (here, "you may only compare"), not about the problem in the abstract. Change the allowed operations (let the algorithm index by value) and the floor moves.

---

## Why Quicksort Beats Mergesort in Practice — Despite Identical O(n log n)

Both are O(n log n). On a benchmark, quicksort is usually 2–3× faster. Big-O *cannot* explain this — and that gap is exactly where junior and senior understanding diverge. Three concrete reasons, none visible in the asymptotic notation:

1. **In-place vs. extra memory.** Quicksort partitions *within* the array — O(log n) stack, no allocation. Mergesort's merge step needs a scratch array of size n, so it allocates O(n) and writes every element twice (to scratch, then back). That allocation + double-write is real wall-clock time the Big-O hides behind its constant factor.

2. **Cache locality.** Quicksort's partition scans the array **sequentially** from both ends — the CPU prefetcher loves this, nearly every access is an L1 hit. Mergesort's merge interleaves reads from two separate subarrays and writes to a third region; the access pattern jumps around, causing more cache misses. On modern hardware a cache miss costs ~100–200 cycles vs. ~1 for a hit, so locality often dominates the actual runtime more than comparison count does.

3. **Smaller constant per comparison.** Quicksort does little beyond compare-and-swap in a tight loop the JIT compiles beautifully. Mergesort carries index bookkeeping for three arrays.

**So why does Java use mergesort (TimSort) for objects and quicksort for primitives?** Because the tradeoff *flips* with the data:
- **Primitives (`int[]`)** → `Arrays.sort` uses **dual-pivot quicksort**: no stability needed (two equal ints are indistinguishable), so take quicksort's speed and cache wins.
- **Objects (`Object[]`)** → `Arrays.sort` uses **TimSort**: objects have *identity*, so stability matters (equal-by-comparator objects must keep input order — critical for multi-key sorts). Quicksort is unstable; mergesort is stable. And TimSort is **adaptive**: it detects already-sorted "runs" in real-world data (logs, timestamps, partially-updated lists) and merges them in O(n) on the best case. Real object data is rarely random, so adaptivity pays.

**The lesson that outlives the algorithms:** two algorithms with the same Big-O are *not* interchangeable. Big-O ranks growth rates; it deliberately discards the constant factor, the memory traffic, the cache behavior, and the input distribution — all of which decide the actual winner. "What's the time complexity?" is the *start* of the analysis, not the end.

---

[Chapter overview](../02b_Sorting_Advanced.md) | [The Idea →](02_the_idea.md)
