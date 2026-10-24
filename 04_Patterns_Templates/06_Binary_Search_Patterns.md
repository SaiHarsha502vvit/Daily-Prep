# 🧩 Binary Search Patterns — Pattern Guide

> **Navigation**: [← Sliding Window](01_Sliding_Window.md) | [Chapter index](00_INDEX.md) | [Two Pointers →](07_Two_Pointers_Complete.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Arrays](../02_Data_Structures/01b_Arrays.md), [Searching & Binary Search](../03_Algorithms/22_Searching_And_Binary_Search_Complete.md) |
| **You will learn** | Three templates, lower/upper bound, rotated arrays, peaks, binary search on the answer, 2D search, and an invariant-first way to avoid bugs |
| **Leads to** | [Constraint-Based Selection](25_Constraint_Based_Pattern_Selection.md), [Knapsack/DP on answers](23_Knapsack_Family.md) |
| **Abstraction level** | Search in a sorted array → **search any monotone predicate** → binary search on the answer |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Binary Search Patterns

### 1. The bottom line

If a yes/no question flips from "no" to "yes" exactly once, binary search finds the flip point in `O(log n)` checks.

### 2. The textbook core

- Define a predicate `ok(x)` that is monotone (all false, then all true).
- Invariant: the first true index is always inside `[lo, hi]`.
- Choose the mid so the range always shrinks (`lo + (hi − lo) / 2`).
- Binary search on the answer: the "array" is the range of possible answers, and `ok` is a feasibility check.
- Cost: `O(log range × cost of ok)`.

### 3. The real-world analogy

The **"higher or lower" guessing game**: each guess halves the possibilities.

### 4. Walkthrough

1. Ship packages within `D` days: weights `[1..10]`, `D = 5`.
2. Answer range is `[max weight, sum]`.
3. `ok(cap)` = can we ship within `D` days using capacity `cap` (greedy simulation).
4. Binary search the smallest `cap` where `ok` is true.

> [!NOTE]
> **Quick check:** What must be true for binary search on the answer? *Feasibility must be monotone in the answer.*


### 5. Check yourself

**Q1.** Trace standard binary search for target 6 in `[1,3,5,7,9]`.

<details><summary>Answer</summary>

`lo=0,hi=4`: mid=2 (5) < 6 → `lo=3`. mid=3 (7) > 6 → `hi=2`. `lo > hi` → not found; the insertion point is index 3.

</details>

**Q2.** How do you avoid overflow when computing the midpoint?

<details><summary>Answer</summary>

`mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`.

</details>

**Q3.** When is binary search on the answer valid?

<details><summary>Answer</summary>

When a feasibility check is monotone: once an answer value is feasible, every larger (or smaller) value is too.

</details>

---

## Historical Evolution

**Inventor / Originator:** Binary search was described in John Mauchly's 1946 Moore School lectures on sorting and searching. Knuth (*The Art of Computer Programming*, Vol. 3, 1973) notes that the first published version correct for all array sizes appeared in 1962 (H. Bottenbruch).

**Predecessor context:** Sequential search `O(n)` was the default for ordered tables.

**Evolution narrative:** The idea is simple but the details are famously error-prone: Bentley reported in *Programming Pearls* that most professional programmers could not write it correctly, and Joshua Bloch (2006) showed that the common `(low + high) / 2` midpoint overflowed in widely used library code. The generalisation to *searching on the answer* over a monotonic predicate came from competitive programming practice.

**Modern practice:** Standard libraries ship binary search (`Arrays.binarySearch`, C++ `lower_bound`/`upper_bound` from the STL designed by Stepanov and Lee, Python `bisect`); databases use the same halving idea inside B-tree pages.

- **Mauchly — 1946**: Early description of binary search in the Moore School lectures
- **Bottenbruch — 1962**: First published version correct for every `n`, according to Knuth
- **Knuth — 1973**: Definitive analysis in TAOCP Vol. 3
- **Bloch — 2006**: Midpoint overflow bug found in widely deployed code; use `low + (high - low) / 2`

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Mid overflow with `(left+right)/2` for large `left, right`** — Using `(left + right) / 2` causes integer overflow in Java/Python when left and right are near Integer.MAX_VALUE. This produces a negative index causing ArrayIndexOutOfBoundsException. Detection: test with `left=2_000_000_000, right=2_100_000_000`; always use `left + (right - left) / 2`.

- **BS on answer space breaks when predicate has multiple flips** — Binary search assumes the predicate is monotonic (false...false, true...true). If the predicate flips multiple times (e.g., "can we achieve X with Y?"), binary search produces incorrect results. Detection: verify monotonicity before binary searching the answer space.

- **Off-by-one in inclusive vs exclusive bounds** — Using `left <= right` (inclusive) with `left = mid + 1` vs `left < right` (exclusive) with `left = mid + 1` produces different termination conditions. Mixing templates causes infinite loops or missed elements. Detection: test with single-element array and target present/absent.

- **Rotated array BS assumes exactly one rotation pivot** — Binary search on rotated arrays assumes one pivot point. With multiple complete rotations (effectively sorted), the algorithm may still work but wastes time. With unsorted input, it produces wrong results. Detection: verify input is a single-rotation of a sorted array before using this variant.

**Production Selection Heuristic:** Use binary search when the search space has a clear monotonic property and you can verify the predicate flips exactly once. If the predicate's monotonicity is uncertain, test with boundary cases first.

---

## 🗺️ Pattern Recognition Header — Binary Search

**How do I know this requires Binary Search?**

| Signal in problem                                          | BS Type                   | Search Space                       |
| ---------------------------------------------------------- | ------------------------- | ---------------------------------- |
| `sorted array + find value`                                | **Classic BS**            | `[0, n-1]` on data                 |
| `first/last occurrence`, `count`                           | **Lower/Upper Bound**     | `[0, n]` on data                   |
| `rotated sorted array`                                     | **BS on rotated data**    | Determine sorted half              |
| `"minimum possible maximum"` or `"minimum X to achieve Y"` | **BS on Answer**          | `[minAns, maxAns]` on answer space |
| `find peak`, `mountain array`                              | **BS on slope direction** | Move toward ascending              |
| `Kth smallest in matrix / sorted list`                     | **BS on value range**     | `[min, max]` in value space        |

**The 3 BS Templates — which to use:**

```
T1: left <= right, left = mid+1, right = mid-1   → Exact match
T2: left <  right, right = mid                    → First pos >= target (Lower Bound)
T3: left <  right, left  = mid+1                  → First pos >  target (Upper Bound)

⚠️ MID overflow: ALWAYS use left + (right - left) / 2
⚠️ BS on Answer: think "can I achieve X?" → monotonic Yes/No function
```

### ⚠️ Constraint Lens — Binary Search Needs Monotonicity

| Constraint / Signal                   | Use                            |
| ------------------------------------- | ------------------------------ |
| sorted data, find value               | classic binary search          |
| first/last valid position             | lower/upper bound              |
| `minimum X such that possible(X)`     | binary search on answer        |
| predicate flips once (`false...true`) | binary search works            |
| predicate can flip multiple times     | binary search is invalid       |
| answer range up to `1e9` / `1e18`     | binary search over value range |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

🔗 **Practice problems:** [Binary Search PS](../05_Problem_Solving/07_Binary_Search.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](00_PATTERN_MASTER_GUIDE.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Binary Search Patterns Complete Guide](06_Binary_Search_Patterns/01_binary_search_patterns_complete_guide.md) | Table of Contents · Binary Search Fundamentals · Stop Memorizing Templates — Define the… | 130 |
| 2 | [The 3 Templates (MEMORIZE!)](06_Binary_Search_Patterns/02_the_3_templates_memorize.md) | The 3 Templates (MEMORIZE!) · Lower Bound & Upper Bound | 190 |
| 3 | [Search in Rotated Array](06_Binary_Search_Patterns/03_search_in_rotated_array.md) | Search in Rotated Array · Peak Finding Patterns | 227 |
| 4 | [Binary Search on Answer](06_Binary_Search_Patterns/04_binary_search_on_answer.md) | Binary Search on Answer · 2D Binary Search · Advanced Patterns · Common Mistakes · Interview Problems · … | 717 |

## 🏢 Enterprise Lens — Binary Search Patterns

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Database index lookups, version bisecting (`git bisect`), capacity planning, rate-limit tuning |
| **Failure modes** | Non-monotone predicate; infinite loops from wrong `mid` rounding; overflow in `(lo + hi) / 2` |
| **Testing and verification** | Test against linear scan on random sorted arrays and predicates; test one-element, all-true and all-false ranges |

---

## Reality Check

**"Binary search needs a sorted array"** → Binary search needs a MONOTONIC PREDICATE — a yes/no question whose answer flips exactly once across the search space. Sorted arrays are one instance. "Minimum capacity to ship packages in D days," "smallest divisor," "koko eating bananas" — nothing is sorted; the predicate "can we do it with value x" is monotonic in x. Binary-search-on-answer is the single highest-leverage generalization in the catalog, and array-sortedness thinking blocks it.

**"The bug risk in binary search is the mid calculation"** → Overflow in mid is the famous bug but the FREQUENT bugs are boundary semantics: does lo end up as first-true or last-false, does the loop terminate when lo == hi or cross, do you return lo or lo-1. These come from mixing two half-remembered conventions. The fix is mechanical: define the predicate, maintain "everything left of lo is false, everything right of hi is true," and the return value derives itself.

**"Binary search halves the array, so it is always the fastest option"** → Each probe costs a predicate evaluation. When the predicate is O(n) (simulate shipping with capacity x), total cost is O(n log(range)) — usually great. But when a two-pointer or math solution answers in one O(n) pass, the binary search is slower AND more code. Binary search wins when checking is much cheaper than enumerating, not universally.

**"Duplicates do not matter for binary search"** → With duplicates, "find x" has multiple valid indexes and the vanilla template returns an ARBITRARY one. Problems that need leftmost/rightmost occurrence (count occurrences, insert position, range queries) require the first-true variant with hi = mid rather than hi = mid - 1. Rotated-array-with-duplicates goes further: worst case degrades to O(n) because arr[lo] == arr[mid] == arr[hi] destroys the which-half-is-sorted signal.

**"Real-valued binary search works like integer binary search"** → Floating-point search cannot use lo == hi termination (it may never exactly converge); it runs a fixed iteration count (about 100 halvings exhausts double precision) or an epsilon window. Epsilon chosen too tight loops forever on precision floor; too loose fails the judge. The robust habit: iterate 100 times and skip epsilon reasoning entirely.
