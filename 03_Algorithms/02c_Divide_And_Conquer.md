> **Navigation**: [← Searching & Binary Search](22_Searching_And_Binary_Search_Complete.md) | [Chapter index](00_INDEX.md) | [Recursion: Complete Mental Model… →](03a_Recursion_Internals.md)

---

# 🔪 Divide and Conquer — Complete Guide

## Algorithm Analysis Fundamentals + D&C + Binary Search + Master Theorem

_Extracted from 06a for discoverability — this is a core technique, not an appendix._

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Sorting](02b_Sorting_Advanced.md), [Searching](22_Searching_And_Binary_Search_Complete.md), [A2 Recurrences](A2_Complexity_FirstPrinciples.md) |
| **You will learn** | Split–solve–combine, the Master theorem in practice, Karatsuba, Strassen, closest pair, binary search as D&C |
| **Leads to** | [Recursion](03a_Recursion_Internals.md), [FFT/NTT](26_FFT_NTT_Polynomial_Multiplication.md) |
| **Abstraction level** | L2: halving as a general paradigm |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Divide & Conquer

### 1. The bottom line

Break a big problem into smaller copies of itself, solve each, and combine the answers.

### 2. The textbook core

- Three steps: **divide, conquer, combine**; cost is captured by `T(n) = aT(n/b) + f(n)`.
- Gains come when the combine step is cheap or when you can reduce the number of subproblems (Karatsuba: 4 → 3 multiplications).
- Recursion depth is typically `log n`; watch stack space.
- Not every split helps: overlapping subproblems need DP instead.

### 3. The real-world analogy

**Counting votes in a big election**: each district counts its own ballots (conquer), then totals are added up (combine).

### 4. Walkthrough

1. Maximum subarray by D&C on `[−2, 1, −3, 4]`.
2. Split into two halves; best sum is either fully left, fully right, or crossing the middle.
3. Compute the crossing sum in O(n).
4. `T(n) = 2T(n/2) + n` → O(n log n).

> [!NOTE]
> **Quick check:** When should you prefer DP over D&C? *When subproblems overlap.*


### 5. Check yourself

**Q1.** Solve `T(n) = T(n/2) + O(1)`.

<details><summary>Answer</summary>

`O(log n)` (binary search).

</details>

**Q2.** Karatsuba multiplies with 3 recursive products instead of 4. What does that give?

<details><summary>Answer</summary>

`O(n^{log₂3}) ≈ O(n^1.585)` instead of `O(n²)`.

</details>

---


## 🎓 University Proof Corner

> **MIT 6.046J / KTH DD2352 / ETH Zurich Algorithms layer** — Why divide-and-conquer is provably correct and how to derive its Θ(n log n) complexity from first principles.

### Correctness: Structural Induction on Input Size

Every D&C algorithm has this proof shape:
- **Base**: Correct for n ≤ threshold (n=1 trivially sorted/merged).
- **Hypothesis**: The algorithm correctly solves both halves of size n/2.
- **Step**: The combine step produces a correct full solution from two correct sub-solutions.

**Merge Sort (abbreviated proof)**: Base: `[x]` is sorted. ✓. Hypothesis: both recursive calls return sorted halves. Step: `merge(left, right)` always picks the smaller front element in one scan → merged output is sorted. ✓

### Complexity from First Principles: Recursion Tree for T(n) = 2T(n/2) + n

```
Level 0:          n               → cost n
Level 1:     n/2     n/2          → cost n
Level 2:  n/4 n/4 n/4 n/4        → cost n
...
Level log₂n:   n leaves of 1      → cost n
Total: n cost × log₂n levels = Θ(n log n)
```

**Master Theorem quick reference** (T(n) = aT(n/b) + f(n), critical exponent p = log_b a):

| Case | Condition | Result |
|------|-----------|--------|
| 1 | f(n) = O(n^{p−ε}) — leaves dominate | Θ(n^p) |
| 2 | f(n) = Θ(n^p) — equal work at every level | Θ(n^p log n) |
| 3 | f(n) = Ω(n^{p+ε}) — root dominates + regularity | Θ(f(n)) |

Merge sort: a=2, b=2, p=1, f(n)=n=Θ(n¹) → **Case 2 → Θ(n log n)**.
Binary search: a=1, b=2, p=0, f(n)=1=Θ(1) → **Case 2 → Θ(log n)**.

### Historical Evolution

**Merge sort** — John von Neumann, 1945 (written for the EDVAC stored-program computer). **Binary search** — known informally for centuries and first described for sorted tables in 1946; the infamous bug `mid=(lo+hi)/2` overflows 32-bit integers and was present in Java's JDK `binarySearch` until it was fixed around 2006 (fixed to `lo + (hi-lo)/2`). **Quicksort** — Tony Hoare, 1959, originally called "Partition Sort"; still the fastest comparison sort in practice due to cache locality. **Strassen matrix multiply** — Volker Strassen, 1969: first algorithm to beat naive O(n³) multiplication, using a=7 subproblems of size n/2 → O(n^{log₂7}) ≈ O(n^{2.807}). **FFT (Cooley-Tukey)** — 1965: the most consequential D&C algorithm in practice (O(n log n) polynomial multiplication, underpins signal processing and cryptography).

> Recurrence analysis (all 3 methods): [A2 — Complexity from First Principles](A2_Complexity_FirstPrinciples.md) | Correctness proofs: [A1](A1_Correctness_Proofs.md)

📎 **Reference Anchor**: [OpenJDK DualPivotQuicksort](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/DualPivotQuicksort.java)
**Invariant learned**: DualPivotQuicksort maintains two pivots p1 ≤ p2, creating three partitions: `arr[lo..p1-1] < p1`, `p1 ≤ arr[p1+1..p2-1] ≤ p2`, `arr[p2+1..hi] > p2`. This reduces the expected number of comparisons vs single-pivot Quicksort by ~20% due to the tighter partition buckets, while preserving in-place O(log n) average-case stack depth.
**Local rewrite**: The Master Theorem quick-ref in this Proof Corner explains why DualPivotQuicksort is still O(n log n) average case — the 3-way partition doesn't change the asymptotic class (a=3 subproblems of size n/3 → log₃3 = 1 = same exponent as f(n)=n → Case 2).
**Constraint warning**: DualPivotQuicksort has O(n²) worst case on adversarial inputs (carefully constructed to maximize pivot skew). Java switches to heapsort after a certain recursion depth to guarantee O(n log n) — this is the "introsort" pattern.

---

🔬 **Section Challenge — Algorithm Analysis Fundamentals + D&C + Binary Search + Master Theorem**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## PART 0: THE MENTAL MODEL — "The Delegation Strategy"

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ THE REAL-WORLD ORIGIN                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Roman emperor Julius Caesar famously used the strategy "divide et impera"    │
│ (divide and rule) to defeat large enemy alliances by fighting them one small │
│ tribe at a time. In computer science, John von Neumann applied this exact    │
│ principle to sorting in 1945 to create Merge Sort.                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### The 5W+H Framework

- **WHAT**: A problem-solving paradigm that breaks a complex problem into smaller, independent subproblems of the same type, solves them recursively, and combines their solutions.
- **WHY**: Reduces time complexity dramatically. Problems that take $O(n^2)$ using brute force become $O(n \log n)$ because we halve the search space or work exponentially.
- **WHEN**: Use when a problem can be broken down into identical, _independent_ sub-problems (unlike Dynamic Programming, where subproblems _overlap_).
- **WHERE**: Built-in sorting algorithms (`Arrays.sort()` uses a form of D&C), distributed databases (MapReduce), fast Fourier transforms (signal processing), and computational geometry.
- **WHO**: John von Neumann (Merge Sort, 1945), Anatolii Karatsuba (Fast Multiplication, 1960), Tony Hoare (Quick Sort, 1959).
- **HOW**: 1. **Divide** the problem. 2. **Conquer** the subproblems recursively. 3. **Combine** the results.

### Where It's Used in Real World

- **Distributed Systems**: Hadoop MapReduce framework inherently runs on a divide-and-conquer processing model.
- **Database Query Engines**: Parquet and ORC file formats use binary-search-like structures to jump past chunks of irrelevant data.
- **Computer Graphics**: Quadtrees and octrees divide spatial coordinate planes into quarters recursively to render visible objects.

---

## Algorithm Analysis Fundamentals

### What is an Algorithm?

```
ALGORITHM = Finite sequence of well-defined instructions
            to solve a problem or perform a computation

PROPERTIES:
1. INPUT:      Zero or more inputs
2. OUTPUT:     At least one output
3. DEFINITENESS: Each step clearly defined
4. FINITENESS:   Terminates after finite steps
5. EFFECTIVENESS: Each step is basic enough to be done
```

### Asymptotic Notations

## Asymptotic Notations

Big-O (O): UPPER BOUND (Worst Case)
f(n) = O(g(n)) means f(n) ≤ c·g(n)
"At most this much"
Big-Omega (Ω): LOWER BOUND (Best Case)
f(n) = Ω(g(n)) means f(n) ≥ c·g(n)
"At least this much"
Big-Theta (Θ): TIGHT BOUND (Average Case)
f(n) = Θ(g(n)) means c₁·g(n) ≤ f(n) ≤ c₂·g(n)
"Exactly this much"
Little-o (o): Strictly less than (not tight)
Little-ω (ω): Strictly greater than (not tight)

### Performance Measurement

```java
// TIME COMPLEXITY: Count operations as function of input size

// Example: Finding sum of array
int sum = 0;           // 1 operation
for (int i = 0; i < n; i++) {  // n iterations
    sum += arr[i];     // 1 operation per iteration
}
// Total: 1 + n = O(n)

// Example: Nested loops
for (int i = 0; i < n; i++) {      // n times
    for (int j = 0; j < n; j++) {  // n times each
        // operation              // n × n = n²
    }
}
// Total: O(n²)

// SPACE COMPLEXITY: Memory used as function of input size
int[] arr = new int[n];    // O(n) space
int[][] matrix = new int[n][n];  // O(n²) space
```

---

## Divide and Conquer

### The General Method

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DIVIDE AND CONQUER - COMPLETE UNDERSTANDING               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DIVIDE AND CONQUER?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A problem-solving paradigm that breaks a problem into SMALLER INDEPENDENT   │
│ subproblems of the SAME TYPE, solves them recursively, then COMBINES        │
│ their solutions.                                                            │
│                                                                             │
│ HISTORICAL CONTEXT:                                                         │
│ - Named after military strategy "divide et impera" (divide and rule)        │
│ - Formalized in computer science in 1960s                                   │
│ - Foundation for many efficient algorithms                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Large problems that are too complex to solve directly         │
│                                                                             │
│ EXAMPLE - Sorting 1 million numbers:                                        │
│ BRUTE FORCE: Compare all pairs → O(n²) = 10¹² comparisons                   │
│ D&C (Merge Sort): Split, sort halves, merge → O(n log n) = 2×10⁷            │
│                                                                             │
│ WHY DOES D&C WORK BETTER?                                                   │
│ • Reduces problem size EXPONENTIALLY (n → n/2 → n/4 → ...)                  │
│ • Each level does O(n) work, but only log(n) levels                         │
│ • Total: O(n) × O(log n) = O(n log n)                                       │
│                                                                             │
│ REAL-WORLD ANALOGY:                                                         │
│ Organizing a library of 1000 books alphabetically:                          │
│ • One person doing everything: VERY SLOW                                    │
│ • Split books in half, give each half to a helper, merge results: FASTER    │
│ • Keep splitting until each person has ~10 books: FASTEST                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ THE THREE STEPS (HOW IT WORKS)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. DIVIDE:   Break problem into smaller subproblems of SAME TYPE            │
│              Key: Subproblems must be INDEPENDENT (no overlap)              │
│                                                                             │
│ 2. CONQUER:  Solve subproblems recursively                                  │
│              Base case: Problem small enough to solve directly              │
│                                                                             │
│ 3. COMBINE:  Merge solutions to get final answer                            │
│              This is often where the "magic" happens                        │
│                                                                             │
│ ┌─────────────────────────────────────────┐                                 │
│ │              ORIGINAL PROBLEM           │                                 │
│ └───────────────────┬─────────────────────┘                                 │
│                     │ DIVIDE                                                │
│         ┌───────────┴───────────┐                                           │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │  SUBPROBLEM 1 │       │  SUBPROBLEM 2 │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │ CONQUER               │ CONQUER                                   │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │   SOLUTION 1  │       │   SOLUTION 2  │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │                       │                                           │
│         └───────────┬───────────┘                                           │
│                     │ COMBINE                                               │
│                     ▼                                                       │
│         ┌───────────────────────┐                                           │
│         │    FINAL SOLUTION     │                                           │
│         └───────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DIVIDE AND CONQUER?                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE D&C WHEN:                                                             │
│    • Problem can be broken into SIMILAR subproblems                         │
│    • Subproblems are INDEPENDENT (don't share data/state)                   │
│    • Solutions can be COMBINED efficiently                                  │
│    • Problem has a NATURAL recursive structure                              │
│                                                                             │
│ ❌ DON'T USE D&C WHEN:                                                       │
│    • Subproblems OVERLAP (use Dynamic Programming instead)                  │
│    • Problem doesn't break into similar subproblems                         │
│    • Combining solutions is as expensive as solving original                │
│                                                                             │
│ D&C vs DYNAMIC PROGRAMMING:                                                 │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Divide & Conquer          │ Dynamic Programming                       │   │
│ ├───────────────────────────┼───────────────────────────────────────────┤   │
│ │ Independent subproblems   │ Overlapping subproblems                   │   │
│ │ Top-down recursive        │ Bottom-up iterative (usually)             │   │
│ │ Merge Sort, Quick Sort    │ Fibonacci, Knapsack, LCS                  │   │
│ │ No memoization needed     │ Memoization essential                     │   │
│ └───────────────────────────┴───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CHOOSING WRONG BASE CASE:                                                │
│    Wrong: if (n == 0) → causes infinite recursion for n=1                   │
│    Right: if (n <= 1) → handles both 0 and 1                                │
│                                                                             │
│ 2. NOT REDUCING PROBLEM SIZE:                                               │
│    Wrong: mergeSort(arr, 0, n) recursively with same range                  │
│    Right: mergeSort(arr, 0, mid) and mergeSort(arr, mid+1, n)               │
│                                                                             │
│ 3. STACK OVERFLOW:                                                          │
│    Problem: Too deep recursion (n = 10^6)                                   │
│    Solution: Convert to iterative or increase stack size                    │
│                                                                             │
│ 4. INEFFICIENT COMBINE STEP:                                                │
│    If combine is O(n²), overall becomes O(n² log n) - defeats purpose!      │
│                                                                             │
│ 5. OVERLAPPING SUBPROBLEMS (misusing D&C):                                  │
│    Fibonacci with D&C → O(2ⁿ) because subproblems overlap                   │
│    Solution: Use DP with memoization instead                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY ANALYSIS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ RECURRENCE RELATION:                                                        │
│ T(n) = aT(n/b) + f(n)                                                       │
│ where:                                                                      │
│   a = number of subproblems                                                 │
│   b = size reduction factor                                                 │
│   f(n) = work done outside recursion (divide + combine)                     │
│                                                                             │
│ COMMON D&C ALGORITHMS & THEIR COMPLEXITY:                                   │
│ ┌────────────────────┬──────────┬───────────────────┬────────────────────┐  │
│ │ Algorithm          │ a  │ b  │ f(n)  │ T(n)                            │  │
│ ├────────────────────┼────┼────┼───────┼────────────────────────────────┤   │
│ │ Binary Search      │ 1  │ 2  │ O(1)  │ O(log n)                        │  │
│ │ Merge Sort         │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Quick Sort (avg)   │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Strassen's Matrix  │ 7  │ 2  │ O(n²) │ O(n^2.807) [log₂7]             │   │
│ │ Karatsuba Multiply │ 3  │ 2  │ O(n)  │ O(n^1.585) [log₂3]             │   │
│ └────────────────────┴────┴────┴───────┴────────────────────────────────┘   │
│                                                                             │
│ EXAMPLE OUTPUT (Merge Sort):                                                │
│ Input:  [38, 27, 43, 3, 9, 82, 10]                                          │
│ Divide: [38, 27, 43, 3] | [9, 82, 10]                                       │
│ Divide: [38, 27] | [43, 3] | [9, 82] | [10]                                 │
│ Conquer: [27, 38] | [3, 43] | [9, 82] | [10]                                │
│ Combine: [3, 27, 38, 43] | [9, 10, 82]                                      │
│ Output: [3, 9, 10, 27, 38, 43, 82]                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

🧠 **Mental Model**: See [11_Greedy_vs_DP_Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md) — D&C vs DP decision framework

---

## Binary Search — Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY SEARCH - COMPLETE UNDERSTANDING                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS BINARY SEARCH?                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ A search algorithm that finds a target value in a SORTED array by            │
│ repeatedly dividing the search interval in half.                             │
│                                                                              │
│ INVENTOR: While the concept is ancient, the first bug-free implementation    │
│ took 16 years after the algorithm was published (1946-1962)!                 │
│                                                                              │
│ FUN FACT: Even experienced programmers often write buggy binary search.      │
│ Jon Bentley found that 90% of professional programmers couldn't write        │
│ a correct binary search in 2 hours!                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Finding an element in sorted data FAST                         │
│                                                                              │
│ LINEAR SEARCH: Check every element → O(n)                                    │
│ BINARY SEARCH: Eliminate half each step → O(log n)                           │
│                                                                              │
│ DRAMATIC DIFFERENCE:                                                         │
│ Array size 1,000,000:                                                        │
│ • Linear: Up to 1,000,000 comparisons                                        │
│ • Binary: Up to 20 comparisons (log₂ 1,000,000 ≈ 20)                         │
│                                                                              │
│ That's 50,000x fewer comparisons!                                            │
│                                                                              │
│ REAL-WORLD ANALOGY:                                                          │
│ Dictionary lookup: You don't start from page 1!                              │
│ • Open to middle                                                             │
│ • Word comes before? Check first half                                        │
│ • Word comes after? Check second half                                        │
│ • Repeat until found                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES BINARY SEARCH WORK?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ PREREQUISITE: Array MUST be sorted!                                          │
│                                                                              │
│ THE LOGIC:                                                                   │
│ If array is sorted and middle element is:                                    │
│ • Equal to target → FOUND!                                                   │
│ • Greater than target → Target must be in LEFT half (all right are bigger)   │
│ • Less than target → Target must be in RIGHT half (all left are smaller)     │
│                                                                              │
│ Each comparison eliminates HALF of remaining elements!                       │
│ n → n/2 → n/4 → n/8 → ... → 1                                                │
│ This takes log₂(n) steps                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE BINARY SEARCH?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE WHEN:                                                                  │
│    • Data is SORTED (or can be sorted once, searched many times)             │
│    • Random access is possible (arrays, not linked lists)                    │
│    • Finding exact match                                                     │
│    • Finding insertion point                                                 │
│    • Finding first/last occurrence of a value                                │
│    • Search space can be divided (not just arrays - see variations!)         │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                            │
│    • Data is unsorted and won't be searched again                            │
│    • Data changes frequently (maintain sorted = expensive)                   │
│    • Sequential access only (linked lists)                                   │
│    • Very small arrays (linear search is fine for n < 10)                    │
│                                                                              │
│ INTERVIEW SIGNAL: "Find in sorted array" or "Search space" = BINARY SEARCH   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON BUGS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INTEGER OVERFLOW IN MID CALCULATION:                                      │
│    WRONG: int mid = (left + right) / 2;  // Can overflow!                    │
│    RIGHT: int mid = left + (right - left) / 2;                               │
│                                                                              │
│ 2. INFINITE LOOP (Wrong termination):                                        │
│    WRONG: while (left < right)  with mid = left + (right-left)/2             │
│           If left=4, right=5: mid=4, never terminates!                       │
│    RIGHT: Match loop condition with update logic                             │
│                                                                              │
│ 3. OFF-BY-ONE ERRORS:                                                        │
│    When to use left = mid vs left = mid + 1?                                 │
│    When to use right = mid vs right = mid - 1?                               │
│    Solution: Think about whether mid could be the answer                     │
│                                                                              │
│ 4. EMPTY ARRAY:                                                              │
│    Always check if array is empty before searching!                          │
│                                                                              │
│ 5. DUPLICATES:                                                               │
│    Standard binary search finds ANY occurrence                               │
│    For first/last, need modified versions (see below)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY:  O(log n) - halving each iteration                          │
│ SPACE COMPLEXITY: O(1) iterative, O(log n) recursive                         │
│                                                                              │
│ OUTPUTS:                                                                     │
│ • Found: Return index of target                                              │
│ • Not found: Return -1 OR insertion point (depends on variant)               │
│                                                                              │
│ NUMBER OF COMPARISONS:                                                       │
│ • Best case: 1 (target is at mid)                                            │
│ • Worst case: ⌈log₂(n+1)⌉                                                    │
│ • Average case: log₂(n) - 1                                                  │
│                                                                              │
│ ┌────────────────┬──────────────────────────────────────────────────────────┐│
│ │ Array Size     │ Max Comparisons                                          ││
│ ├────────────────┼──────────────────────────────────────────────────────────┤│
│ │ 10             │ 4                                                        ││
│ │ 100            │ 7                                                        ││
│ │ 1,000          │ 10                                                       ││
│ │ 1,000,000      │ 20                                                       ││
│ │ 1,000,000,000  │ 30                                                       ││
│ └────────────────┴──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

```java
// STANDARD BINARY SEARCH
// PROBLEM: Find target in sorted array
// DIVIDE: Look at middle, decide which half to search
// CONQUER: Search in chosen half
// COMBINE: No combining needed

public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;  // Not found
}

// VISUAL TRACE:
// arr = [1, 3, 5, 7, 9, 11, 13], target = 7
//
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 == target -> FOUND at index 3!
//
// If target = 11:
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 < 11, so left=4
// Step 2: left=4, right=6, mid=5
//         arr[5]=11 == target -> FOUND at index 5!
//
// If target = 6 (not in array):
// Step 1: left=0, right=6, mid=3, arr[3]=7 > 6, right=2
// Step 2: left=0, right=2, mid=1, arr[1]=3 < 6, left=2
// Step 3: left=2, right=2, mid=2, arr[2]=5 < 6, left=3
// Step 4: left=3, right=2 → left > right, EXIT, return -1

// TIME: O(log n) - halving each time
// SPACE: O(1) iterative, O(log n) recursive

// RECURRENCE: T(n) = T(n/2) + O(1) = O(log n)

// VARIANT: Find first occurrence (when duplicates exist)
public int findFirst(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;      // Found one, but keep searching left
            right = mid - 1;   // for potentially earlier occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}

// VARIANT: Find last occurrence
public int findLast(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;     // Found one, but keep searching right
            left = mid + 1;   // for potentially later occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}
```

---

🔬 **Section Challenge — Divide & Conquer Recurrences**

**Challenge 1 (Derive):** Merge sort splits an array of n elements into two halves, recursively sorts each half, and merges them. Write the recurrence relation T(n) and solve it. Show your work using the recursion-tree method.

<details><summary>Answer</summary>

**Recurrence**: T(n) = 2T(n/2) + Θ(n), with T(1) = Θ(1).

**Recursion tree**: Level 0: cost n. Level 1: two subproblems of size n/2, total cost 2×(n/2) = n. Level k: 2^k subproblems of size n/2^k, total cost 2^k × (n/2^k) = n. Depth = log₂n (until subproblems reach size 1). Total cost = n × (log₂n + 1) = **Θ(n log n)**.

**Master Theorem check**: a=2, b=2, f(n)=n. Critical exponent p = log₂2 = 1. f(n) = Θ(n^p) → Case 2 → T(n) = Θ(n log n). ✓

</details>

**Challenge 2 (Compare):** Strassen's matrix multiplication runs in T(n) = 7T(n/2) + Θ(n²). Apply the Master Theorem and compare against the naïve O(n³) algorithm. At what matrix size does Strassen become faster in practice?

<details><summary>Answer</summary>

a=7, b=2, f(n)=n². Critical exponent p = log₂7 ≈ 2.807. Since f(n) = n² = O(n^(p-ε)) for ε≈0.807 → Case 1 → T(n) = Θ(n^(log₂7)) ≈ Θ(n^2.807).

Naïve: Θ(n³). Strassen wins asymptotically. In practice, Strassen has large constants (7 recursive calls + 18 additions vs 8 recursive calls + 4 additions) so it only beats naïve for n ≥ ~1000 in real implementations (BLAS libraries use a threshold, switching to naïve below it).

</details>

## D&C Classic Algorithms

### Finding Maximum and Minimum

```java
// NAIVE: 2n-2 comparisons
// D&C: 3n/2 - 2 comparisons (25% fewer!)

class Pair {
    int min, max;
    Pair(int min, int max) {
        this.min = min;
        this.max = max;
    }
}

public Pair findMinMax(int[] arr, int low, int high) {
    // Base case: single element
    if (low == high) {
        return new Pair(arr[low], arr[low]);
    }

    // Base case: two elements
    if (high == low + 1) {
        if (arr[low] < arr[high]) {
            return new Pair(arr[low], arr[high]);
        } else {
            return new Pair(arr[high], arr[low]);
        }
    }

    // Divide
    int mid = (low + high) / 2;
    Pair left = findMinMax(arr, low, mid);
    Pair right = findMinMax(arr, mid + 1, high);

    // Combine
    return new Pair(
        Math.min(left.min, right.min),
        Math.max(left.max, right.max)
    );
}

// VISUAL TRACE:
// arr = [3, 5, 1, 8, 2, 9]
//
//              [3,5,1,8,2,9]
//              /            \
//         [3,5,1]        [8,2,9]
//         /    \          /    \
//       [3,5]  [1]     [8,2]  [9]
//        |      |        |      |
//     (3,5)   (1,1)   (2,8)  (9,9)
//         \    /          \    /
//        (1,5)           (2,9)
//              \        /
//              (1,9)
//
// Answer: min=1, max=9
```

### Quick Sort (D&C)

```java
// DIVIDE: Partition around pivot
// CONQUER: Recursively sort left and right
// COMBINE: No combining needed (in-place)

public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr, i, j);
        }
    }

    swap(arr, i + 1, high);
    return i + 1;
}

// VISUAL TRACE:
// arr = [10, 7, 8, 9, 1, 5]
//
// Step 1: pivot = 5
//         Partition: [1] [5] [10, 7, 8, 9]
//
// Step 2: Sort left [1] - already sorted
//         Sort right [10, 7, 8, 9], pivot = 9
//         Partition: [7, 8] [9] [10]
//
// Step 3: Sort [7, 8], pivot = 8
//         Result: [7, 8]
//
// Final: [1, 5, 7, 8, 9, 10]

// TIME: O(n log n) average, O(n^2) worst (sorted array + bad pivot)
// SPACE: O(log n) stack space
// RECURRENCE: T(n) = 2T(n/2) + O(n) = O(n log n)
```

### Merge Sort (D&C)

```java
public void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        // Divide
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        // Combine
        merge(arr, left, mid, right);
    }
}

// VISUAL TRACE:
// arr = [38, 27, 43, 3, 9, 82, 10]
//
//           [38, 27, 43, 3, 9, 82, 10]
//          /                          \
//    [38, 27, 43, 3]          [9, 82, 10]
//    /            \            /        \
// [38, 27]    [43, 3]      [9, 82]    [10]
//  /    \      /    \       /    \      |
// [38] [27]  [43]  [3]    [9]  [82]   [10]
//  \    /      \    /       \    /      |
// [27, 38]    [3, 43]      [9, 82]    [10]
//    \          /            \        /
//   [3, 27, 38, 43]         [9, 10, 82]
//          \                  /
//      [3, 9, 10, 27, 38, 43, 82]

// TIME: O(n log n) always
// SPACE: O(n) for temp arrays
```

---

## Master Theorem

```
For recurrence: T(n) = aT(n/b) + f(n)

Let c = log_b(a)

CASE 1: If f(n) = O(n^(c-e)) for some e > 0
        Then T(n) = Theta(n^c)
        (Work dominated by leaves)

CASE 2: If f(n) = Theta(n^c)
        Then T(n) = Theta(n^c * log n)
        (Work evenly distributed)

CASE 3: If f(n) = Omega(n^(c+e)) for some e > 0
        And af(n/b) <= kf(n) for k < 1
        Then T(n) = Theta(f(n))
        (Work dominated by root)

EXAMPLES:
Binary Search:  T(n) = T(n/2) + O(1)
                a=1, b=2, f(n)=O(1), c=0
                Case 2: T(n) = O(log n)

Merge Sort:     T(n) = 2T(n/2) + O(n)
                a=2, b=2, f(n)=O(n), c=1
                Case 2: T(n) = O(n log n)

Strassen:       T(n) = 7T(n/2) + O(n^2)
                a=7, b=2, f(n)=O(n^2), c=log_2(7)~2.81
                Case 1: T(n) = O(n^2.807)
```

### Where the Three Cases Actually Come From — Draw the Tree, Don't Memorize the Table

The three cases look arbitrary until you draw the recursion tree. Then they become *the only three things that can happen*, and you'll never need the table again. The single question the Master Theorem answers is: **which level of the recursion tree does the most work — the top, the bottom, or are all levels tied?**

Take `T(n) = aT(n/b) + f(n)`. Expand it as a tree and tally the work at each level:

```
Level 0 (root):     1 node,   problem size n      → work = f(n)
Level 1:            a nodes,  size n/b each       → work = a·f(n/b)
Level 2:            a² nodes, size n/b² each      → work = a²·f(n/b²)
...
Level i:            aⁱ nodes, size n/bⁱ each       → work = aⁱ·f(n/bⁱ)
...
Bottom (leaves):    a^(log_b n) = n^(log_b a) leaves, each O(1) work
```

Two quantities are racing as you go *down* the tree: the **number of nodes multiplies by a** each level, while the **work per node shrinks** (problem size divides by b). The total is the sum over all levels. Whether that sum is dominated by the top, the bottom, or spread evenly is decided by comparing `f(n)` against `n^c` where **c = log_b(a)** — and `n^c` is exactly the number of leaves. That comparison *is* the three cases:

- **Case 1 — leaves win (work piles up at the bottom).** If `f(n)` grows *slower* than `n^c`, the node-count explosion outruns the per-node shrinkage. Each level down has *more* total work than the one above, so the **bottom level dominates** and the geometric series is bottom-heavy → `T(n) = Θ(n^c)`. *The leaves (the n^c of them) do all the work.* (Strassen: 7 children each level outruns the n² merge cost, so the leaf count n^2.81 dominates.)

- **Case 2 — every level ties (work is flat).** If `f(n) = Θ(n^c)`, the growth in node-count *exactly cancels* the shrink in per-node work — **every level does the same total amount**, ~`f(n)`. There are `log_b n` levels, so total = `f(n) × log n` → `T(n) = Θ(n^c log n)`. *This is why merge sort is n log n:* each of the log n levels does Θ(n) merge work — n work per level, log n levels. The log factor is literally the *height of the tree*, and it appears precisely because all levels are tied so you multiply by how many there are.

- **Case 3 — the root wins (work piles up at the top).** If `f(n)` grows *faster* than `n^c` (and the regularity condition holds, meaning the work really does shrink going down), the **top level dominates** — the first `f(n)` is bigger than everything below it combined → `T(n) = Θ(f(n))`. *The root's own work swamps all the recursion.*

> **The mental picture that replaces the table:** a recursion tree is a tug-of-war between *branching* (a, pulling work toward the many leaves) and *shrinking* (b and f, pulling work toward the few-but-big top nodes). Case 1 = branching wins (bottom-heavy). Case 3 = shrinking is so weak the root's work wins (top-heavy). Case 2 = perfect tie, and the tie introduces the `log n` factor because you're summing equal contributions over the tree's height. You don't memorize which case — you ask *"is f(n) smaller than, equal to, or bigger than the leaf count n^c?"* and the tree tells you where the work lives.

This is also exactly why the Master Theorem **has gaps** (e.g., `T(n)=2T(n/2)+n log n` falls *between* cases 2 and 3 — f is bigger than n¹ but not polynomially bigger): the clean three-way split only works when f sits cleanly below, on, or above n^c by a polynomial factor. In the gaps you fall back to drawing the tree and summing by hand — which is what you were really doing all along.

### Akra-Bazzi — Beyond the Master Theorem

The Master Theorem handles recurrences where subproblems are equal fractions of n (e.g., T(n) = 2T(n/2) + n). But many real-world recurrences have **unequal subproblem sizes**:

- T(n) = T(2n/3) + T(n/3) + O(n) — Karatsuba-style splits
- T(n) = T(n/3) + T(2n/3) + O(1) — unbalanced D&C
- T(n) = ⅓T(n/2) + ⅔T(n/3) + O(n) — randomized median-of-three

The **Akra-Bazzi theorem** (1998) generalizes Master Theorem to arbitrary subproblem sizes and counts.

#### Statement

For T(x) satisfying T(x) = Σᵢ₌₁ᵏ aᵢ T(bᵢ x) + f(x) where aᵢ > 0, 0 < bᵢ < 1, then:

T(x) = Θ(x^p · (1 + ∫₁ˣ f(u) / uᵖ⁺¹ du))

where p solves Σᵢ₌₁ᵏ aᵢ · bᵢᵖ = 1.

#### Worked Example — T(n) = T(2n/3) + T(n/3) + n

Here a₁ = 1, b₁ = 2/3 (subproblem 1 of size 2n/3), a₂ = 1, b₂ = 1/3 (subproblem 2 of size n/3), f(n) = n.

**Step 1: Find p.** Solve a₁·b₁ᵖ + a₂·b₂ᵖ = 1:
- (2/3)ᵖ + (1/3)ᵖ = 1

Try p = 1: (2/3) + (1/3) = 1. ✓

So **p = 1**.

**Step 2: Apply the integral.**
T(n) = Θ(n¹ · (1 + ∫₁ⁿ u / u² du))
     = Θ(n · (1 + [ln u]₁ⁿ))
     = Θ(n · (1 + ln n - 0))
     = **Θ(n log n)**

#### When to Use Akra-Bazzi vs Master Theorem

| Recurrence | Master Theorem | Akra-Bazzi |
|---|---|---|
| T(n) = 2T(n/2) + n | ✓ Θ(n log n) | ✓ p=1, Θ(n log n) — same result |
| T(n) = T(n/2) + T(n/4) + n | ✗ unequal sizes | ✓ p solves (1/2)ᵖ + (1/4)ᵖ = 1 |
| T(n) = T(2n/3) + T(n/3) + n | ✗ | ✓ p=1, Θ(n log n) |
| T(n) = ⅓T(n/2) + ⅔T(n/3) + n | ✗ | ✓ unique p solves (1/3)(1/2)ᵖ + (2/3)(1/3)ᵖ = 1 |

**Rule of thumb:** If all subproblems are equal fractions AND each has weight aᵢ = 1 (or all equal), use Master Theorem. Otherwise use Akra-Bazzi.

---

## When Divide & Conquer Breaks

### 1. Incorrect Base Case — Off-by-One or Missing Return
**What breaks**: Merge sort / binary search missing the `lo >= hi` (or `lo == hi`) base case causes infinite recursion. Extremely common first-time bug: `while (lo < hi)` vs `while (lo <= hi)` produces different termination — one loses the last element.
**Rule**: Prove the base case terminates and is correct before proving the recursive step. The invariant must hold *at* the base case, not just in the inductive step.

### 2. Overflow in `mid` Computation
**What breaks**: `int mid = (lo + hi) / 2` overflows when `lo + hi > Integer.MAX_VALUE` (2.1 billion). Classic bug filed against JDK's own `Arrays.binarySearch()` in 2006, present since 1946 in the research literature.
**Fix**: `int mid = lo + (hi - lo) / 2`. The subtraction stays bounded because `hi - lo <= Integer.MAX_VALUE`.
**Reference**: Josh Bloch's "Nearly All Binary Searches and Mergesorts are Broken" (Google AI Blog, 2006).

### 3. Merge Step O(n) Ignored in Complexity Analysis
**What breaks**: Students write T(n) = 2T(n/2) and forget the merge cost. The correct recurrence is T(n) = 2T(n/2) + O(n). Forgetting the merge makes the recurrence solve to O(n) — which contradicts the Ω(n log n) comparison sort lower bound.
**Fix**: Always include the combine cost in the recurrence. For D&C correctness: conquer ≠ merge.

### 4. Strassen Practical Crossover
**What breaks**: Strassen's O(n^2.807) matrix multiplication has a large constant factor and poor cache behaviour. For n < ~1000 it is *slower* than the O(n³) naive algorithm due to recursion overhead, extra memory, and cache misses.
**Real usage**: BLAS/LAPACK use naive blocked multiplication for n < 512; Strassen (or Winograd variant) only kicks in for very large matrices. Using Strassen blindly for small matrices is a performance regression, not an optimization.

---

📖 **Related Files:**

- [02a_Sorting_Fundamentals](02a_Sorting_Fundamentals.md) — Merge Sort and Quick Sort details
- [03a_Recursion_Internals](03a_Recursion_Internals.md) — How recursion works at CPU level
- [../14_Mental_Models/11_Greedy_vs_DP_Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md) — D&C vs DP vs Greedy

---



---

## 🏢 Enterprise Lens — Divide & Conquer

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | MapReduce-style processing, parallel merge sort, FFT-based signal processing, divide-and-conquer in image and geometry pipelines |
| **Failure modes** | Unbalanced splits degrading to O(n²); copying subarrays at every level; recursion depth overflow |
| **Testing and verification** | Test base cases (n = 0, 1, 2) and compare against the brute-force result on random inputs |

---

## Reality Check

**"Divide and Conquer always has a recurrence T(n) = 2T(n/2) + O(n)"** → The 2T(n/2) + O(n) pattern (Master Theorem Case 2: O(n log n)) is merge sort's recurrence. D&C recurrences vary: Binary search: T(n) = T(n/2) + O(1) → O(log n). Karatsuba multiplication: T(n) = 3T(n/2) + O(n) → O(n^log₂3) ≈ O(n^1.585). Strassen matrix multiplication: T(n) = 7T(n/2) + O(n²) → O(n^log₂7) ≈ O(n^2.807). Quicksort (balanced): T(n) = 2T(n/2) + O(n) → O(n log n) but worst case T(n) = T(n-1) + O(n) → O(n²).

**"The merge step in divide and conquer is always simple"** → The divide step (split the problem) is usually simple; the combine (merge) step is where the real work happens. Merge sort: the merge is O(n). Counting inversions: during the merge step you count how many inversions involve elements from different halves — O(n). Closest pair of points: after recursively solving each half, you must merge by finding the closest pair that straddles the dividing line — the clever O(n) strip scan. The key insight in D&C design is "what information from the recursive solution do I need to combine correctly?"

**"Divide and Conquer requires the subproblems to be equal in size"** → Not required but balanced division gives the best complexity. Unequal splits: QuickSort with bad pivot splits n into 1 and n-1 → O(n²). Matrix multiplication by splitting into n/4-size submatrices is standard. The recurrence handles any split ratio; the Master Theorem applies for any fixed fraction. Practical example: finding the k-th smallest (QuickSelect) divides unequally every time (partition by pivot) but achieves O(n) expected.

**"Binary search is divide and conquer"** → Binary search IS D&C: divides the search space in half, searches only one half, does not combine results. The D&C template: divide (pick midpoint), conquer (search left or right half), combine (trivial — return the result from the recursive call). Binary search's O(log n) comes from T(n) = T(n/2) + O(1), Master Theorem Case 2 where f(n) = O(n^(log_b a - ε)) → T(n) = O(n^log_b a) = O(n^0) = O(1)... wait, that's Case 1. Binary search: T(n) = T(n/2) + O(1), log_2 1 = 0, f(n) = O(n^0) = O(1), so Case 2: T(n) = O(log n).

**"D&C and DP solve the same problems differently"** → D&C: subproblems are independent (no overlap). DP: subproblems overlap (solving the same subproblem multiple times). Fibonacci with D&C: exponential (recomputes fib(3) for fib(5) and fib(4) separately). Fibonacci with DP: linear (store fib(3) once). The test: draw the recursion tree. If subproblems repeat (same input to multiple recursive calls), D&C wastes work — use memoisation (top-down DP) or tabulation (bottom-up DP). If subproblems never repeat (merge sort's subarrays are distinct), D&C is fine.
