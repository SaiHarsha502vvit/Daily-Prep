# DS Lower Bound Cheat Sheet

> **Navigation**: [← 1. Why DS Lower Bounds Are Harder Than…](01_why_ds_lower_bounds_are_harder.md) | [Chapter overview](../A3_DS_Lower_Bounds.md)
> Page 2 of 2 in **A3. Data Structure Lower Bounds — Proving You Cannot Do Better**


## DS lower-bound cheat sheet

**Comparison model** (only `<`, `>`, `=` comparisons):

| Problem | Lower bound | Optimal structure / algorithm |
| ------- | ----------- | ----------------------------- |
| Sorted array search | Ω(log n) | Binary search is optimal |
| BST, any operation | Ω(log n) | Red-black, AVL are optimal |
| Heap extract-min | Ω(log n) | Binary heap is optimal |
| Priority queue (comparison-based) | Ω(log n) | Binary heap is optimal |
| Any sort | Ω(n log n) | Merge sort / heap sort are optimal |

**Cell-probe model** (count memory accesses, computation is free):

| Problem | Lower bound | Notes |
| ------- | ----------- | ----- |
| Predecessor (integer keys) | Ω(log log n) | vEB tree matches |
| Partial sums (dynamic) | Ω(log n) | Fenwick tree is optimal |
| Union-Find, m operations | Ω(m·α(n)) | Tarjan's structure is optimal: **solved** |
| Dynamic connectivity | Ω(log n) | Gap to the best upper bound |

**Information-theoretic** (model-independent):

| Problem | Lower bound | Notes |
| ------- | ----------- | ----- |
| Static membership, exact | Ω(n) bits | Bit vector is optimal |
| Static membership, ε false-positive rate | Ω(n·log(1/ε)) bits | A Bloom filter uses ≈ 1.44× this; cuckoo/xor filters get closer |
| Sorted array encoding | Ω(n log n) bits | Sorted array is optimal |

**Hash table:**

- Load factor α = n/m.
- When α > 1 the worst-case bucket holds ≥ ⌈α⌉ items → Ω(α) worst-case lookup.
- Bloom filter sizing for false-positive rate ε: `m = -n·ln(ε)/ln²2`, `k = (m/n)·ln 2`.

**Integer keys / non-comparison:**

- Predecessor on `[0, U-1]` is `O(log log U)` with a vEB tree. It beats the Ω(log n) comparison bound by using bit indexing.

> [!IMPORTANT]
> **Remember**
> - Ω(log n): always applies to comparison-based BST / heap / search.
> - Ω(log log n): the integer-key cell-probe floor.
> - Ω(α(n)): the Union-Find floor, effectively constant.
> - Ω(n) bits: the floor for exact static membership.
> - When **upper bound = lower bound**, the problem is **solved**. Known solved DS problems: BST, binary heap, bit vector, Union-Find, Fenwick tree, vEB tree (and Bloom filter up to a constant factor).

*[← A2: DS Complexity](../A2_DS_Complexity_FirstPrinciples.md) | [A4: Randomized DS →](../A4_Randomized_Data_Structures.md)*

---

## Proof Corner -- Comparison-Based DS Lower Bounds

**Lower bound for searching in unsorted array**: Any deterministic comparison-based algorithm requires Omega(n) comparisons to find a target in an n-element unsorted array.

**Proof (adversary argument)**: The adversary starts with no restrictions on the array values. For each comparison arr[i] vs arr[j], the adversary answers consistently but never commits to placing the target where it has already been excluded. After fewer than n comparisons, at least one position has never been compared; the adversary places the target there (or declares it absent). The algorithm cannot distinguish these cases.

**Lower bound for sorted dictionary (n ops)**: O(n log n) total time for n insertions + n lookups.

**Proof (sorting reduction)**: Given a comparison-based dictionary, sort n elements by inserting each, then doing in-order traversal. This sort runs in the time of n insertions + one traversal. Since comparison-based sorting requires Omega(n log n) comparisons, the dictionary uses Omega(n log n) total.

**Finding max in n elements -- tight lower bound**: Exactly n-1 comparisons are necessary and sufficient.

**Proof**: Each comparison eliminates exactly one element from being the max. To identify the max from n elements, n-1 must be eliminated. One linear scan achieves exactly n-1 comparisons.

---

## When It Breaks -- DS Lower Bounds

**1. Lower bounds don't apply to non-comparison algorithms** -- counting sort, radix sort, and hash tables are not comparison-based. They achieve O(n) or O(1) operations by exploiting numeric structure, bypassing the Omega(n log n) and Omega(log n) comparison bounds.

**2. Cell-probe model vs comparison model** -- some problems that look like they need O(log n) comparisons can achieve O(1) with precomputation (e.g., static range minimum queries via sparse table). The comparison lower bound doesn't apply to lookup-table-based algorithms.

**3. Amortised vs worst-case lower bounds** -- a lower bound of Omega(n log n) for n operations allows individual O(1) operations. Only the TOTAL is bounded. Never cite an amortised lower bound to rule out a fast individual operation.

---

## Section Challenge -- DS Lower Bounds

**Problem 1 (6 min)**: Prove that any comparison-based algorithm to find BOTH the minimum AND maximum of n elements requires at least ceil(3n/2) - 2 comparisons.

<details><summary>Model Answer</summary>

**Lower bound via adversary**: Classify each element as: never compared (N), beaten (lost at least one comparison), winning (won but never lost), or drawn (both won and lost). To identify min+max:
- min must win ALL comparisons it participates in.
- max must lose ALL comparisons it participates in.

No element can be both min and max (n >= 2). So at least 2 elements must be classified as "winner only" (max candidate) and "loser only" (min candidate).

A pair comparison in the first pass with n/2 pairs uses n/2 comparisons, giving n/2 winners and n/2 losers. Then: n/2-1 comparisons to find max among winners + n/2-1 comparisons to find min among losers = n-2 additional comparisons. Total: n/2 + n - 2 = 3n/2 - 2.

**Upper bound**: The pair algorithm achieves 3n/2 - 2 comparisons. Therefore this bound is tight.

</details>

---

## Reference Anchor

**Java -- lower bound implications in library design**:
```java
// java.util.Collections.min/max: each does n-1 comparisons (standard linear scan)
// Combined min+max using pair algorithm -- 3n/2 - 2 comparisons:
static int[] minMax(int[] arr) {
    int lo, hi;
    int start;
    if (arr.length % 2 == 0) {
        lo = Math.min(arr[0], arr[1]);
        hi = Math.max(arr[0], arr[1]);
        start = 2;
    } else {
        lo = hi = arr[0];
        start = 1;
    }
    for (int i = start; i < arr.length - 1; i += 2) {
        int a = arr[i], b = arr[i+1];
        if (a < b) { lo = Math.min(lo, a); hi = Math.max(hi, b); }
        else        { lo = Math.min(lo, b); hi = Math.max(hi, a); }
    }
    return new int[]{lo, hi};
    // Total: 1 (pair) + 1 (vs lo) + 1 (vs hi) per pair = 3*(n/2) = 3n/2
}

// java.util.Arrays.sort on int[] achieves Theta(n log n) -- optimal for comparison sort
// For special-case linear sorts: Arrays.sort is NOT used (Java has no built-in radix sort)
// Must implement counting sort / radix sort manually for O(n) sorting
```

---

## Brute Force to Optimal -- Lower Bound Aware Algorithms

| Problem | Naive ops | Optimal ops | Lower bound | Tight? |
|---------|-----------|------------|-------------|--------|
| Find max | n-1 | n-1 | n-1 | Yes |
| Find min+max | 2(n-1) | 3n/2-2 | 3n/2-2 | Yes |
| Sort | O(n^2) | O(n log n) | Omega(n log n) | Yes |
| Sorted search | O(n) | O(log n) | Omega(log n) | Yes |
| Median | O(n^2) | O(n) | Omega(n) | Yes (linear select) |

---

[← 1. Why DS Lower Bounds Are Harder Than…](01_why_ds_lower_bounds_are_harder.md) | [Chapter overview](../A3_DS_Lower_Bounds.md)
