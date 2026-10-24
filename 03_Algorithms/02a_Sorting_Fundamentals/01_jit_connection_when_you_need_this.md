# 🔗 JIT Connection — When You Need This

> **Navigation**: [Chapter overview](../02a_Sorting_Fundamentals.md) | [DEEP INTERNALS - HOW SORTING ACTUALLY WORKS… →](02_deep_internals_how_sorting_actually_works.md)
> Page 1 of 4 in **Sorting Fundamentals**


**Arrived here from a problem?** Here's where to go next:

| Sorting sub-topic      | Key Interview Fact                                             | Jump to PS Problems                                        |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Choose sort algorithm  | n<50 → Insertion; general → QuickSort; need stable → MergeSort | [Arrays PS](../../05_Problem_Solving/04_Arrays.md)            |
| Custom comparator      | `Arrays.sort(arr, (a,b) → a[1]-b[1])`                          | [Greedy PS](../../05_Problem_Solving/13_Greedy.md)            |
| Timsort (Java Objects) | `Arrays.sort(Object[])` is stable TimSort                      | [Greedy PS](../../05_Problem_Solving/13_Greedy.md)            |
| Sort + Two Pointer     | Sort then scan — reduces O(n²) search to O(n)                  | [Two Pointers PS](../../05_Problem_Solving/06_Two_Pointers.md) |

**Study Path:** `Arrays` → `Sorting (this)` → `Binary Search` → `Two Pointers` → `Greedy`

📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 🎓 University Proof Corner

> **MIT 6.006 / KTH DD1352 layer** — Why these algorithms are provably correct, and why Θ(n log n) is the best any comparison sort can do.

### Correctness: Insertion Sort Loop Invariant

**Invariant**: At the start of iteration `i`, `A[0..i-1]` contains the original `A[0..i-1]` elements in sorted order.

- **Init (i=1)**: `A[0..0]` is a single element — trivially sorted. ✓
- **Maintenance**: The inner `while` loop shifts larger elements right until it finds the correct position for `A[i]`, preserving sorted order in `A[0..i]`. ✓
- **Termination (i=n)**: `A[0..n-1]` is sorted. ✓

### Why O(n log n) Is the Best Possible (Decision Tree Argument)

Every comparison sort can be modeled as a **binary decision tree**: each internal node is a comparison (A[i] ≤ A[j]?), each leaf is one of the n! possible sorted output permutations.

1. The tree needs **at least n! leaves** — one per permutation.
2. A binary tree of height h has **at most 2ʰ leaves**.
3. So h ≥ log₂(n!) ≥ (n/2)·log₂(n/2) = **Ω(n log n)**.

**Consequence**: Merge sort and heap sort are **asymptotically optimal** among all comparison sorts. No new algorithm can beat Θ(n log n) in the worst case — the lower bound is proved.

Sub-linear sorts (counting, radix, bucket) avoid this bound by exploiting value ranges rather than comparisons.

> Full proofs: [A1 — Algorithm Correctness](../A1_Correctness_Proofs.md) | [A3 — Lower Bounds](../A3_Lower_Bounds_And_NP.md)

📎 **Reference Anchor**: [OpenJDK TimSort](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TimSort.java) · [DualPivotQuicksort](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/DualPivotQuicksort.java)
**Invariant learned**: `Arrays.sort(Object[])` uses TimSort (stable, O(n log n), min-run 32 elements for Insertion Sort threshold); `Arrays.sort(int[])` uses Dual-Pivot Quicksort (in-place, cache-friendly, no stability guarantee). The split is deliberate: object arrays need stability for `Comparable`/`Comparator` contracts; primitive arrays can sacrifice stability for speed.
**Local rewrite**: the "decision tree Ω(n log n)" proof in this chapter's Proof Corner shows *why* TimSort can't beat n log n on the worst case, even though it is O(n) on already-sorted data (run detection).
**Constraint warning**: `Arrays.sort()` on an array of objects with a non-transitive `Comparator` throws `IllegalArgumentException` in Java 7+ (TimSort's merge step requires the total order invariant).

---

[Chapter overview](../02a_Sorting_Fundamentals.md) | [DEEP INTERNALS - HOW SORTING ACTUALLY WORKS… →](02_deep_internals_how_sorting_actually_works.md)
