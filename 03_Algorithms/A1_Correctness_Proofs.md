# A1. Algorithm Correctness — Proving Why It Works

**Navigation**: [← Algorithm Thinking](01_Algorithm_Thinking.md) | [📚 Index](00_INDEX.md) | [A2: Complexity from First Principles →](A2_Complexity_FirstPrinciples.md)

> **MIT 6.006 / KTH DD1352 / TU Munich IN0007 foundation**
>
> "A program that has not been proved correct has merely not yet been found incorrect." — Edsger W. Dijkstra
>
> This chapter teaches the proof methodology that separates a computer scientist from a programmer. Every claim about an algorithm — "it always finds the shortest path," "it always returns a sorted array" — is a mathematical assertion that must be proved, not assumed.

---

## Table of Contents

1. [Loop Invariants — The Core Proof Tool](#1-loop-invariants--the-core-proof-tool)
2. [Proving Sorting Algorithms Correct](#2-proving-sorting-algorithms-correct)
3. [Proving Binary Search Correct](#3-proving-binary-search-correct)
4. [Proving Graph Algorithms Correct](#4-proving-graph-algorithms-correct)
5. [Exchange Arguments — Proving Greedy Algorithms Correct](#5-exchange-arguments--proving-greedy-algorithms-correct)
6. [Optimal Substructure — Proving DP Is Valid](#6-optimal-substructure--proving-dp-is-valid)
7. [How to Write a Proof in an Interview](#7-how-to-write-a-proof-in-an-interview)

---

## 1. Loop Invariants — The Core Proof Tool

### What a Loop Invariant Is

A **loop invariant** is a property that:
1. **Holds before the loop starts** (Initialization)
2. **If it holds at the start of one iteration, it holds at the start of the next** (Maintenance)
3. **When the loop terminates, gives you the result you want** (Termination)

This is mathematical induction on the iteration number. The invariant is the inductive hypothesis.

```
Structure of a loop invariant proof:

  ┌─────────────────────────────────────────────────────┐
  │  INITIALIZATION  │  Before first iteration begins,  │
  │                  │  the invariant holds.             │
  ├─────────────────────────────────────────────────────┤
  │  MAINTENANCE     │  If it holds at start of iter i, │
  │                  │  it holds at start of iter i+1.  │
  ├─────────────────────────────────────────────────────┤
  │  TERMINATION     │  When loop ends, invariant gives  │
  │                  │  us the answer we want.           │
  └─────────────────────────────────────────────────────┘
```

### The Mental Model: What Does the Invariant SAY?

A loop invariant describes **what the algorithm has accomplished so far**. After `i` iterations, what is true about the work done?

For a sorting algorithm after processing `i` elements: "the first `i` elements are in sorted order."
For binary search after iteration `i`: "the target, if present, is in `A[lo..hi]`."
For BFS after processing level `i`: "all vertices at distance ≤ i from source have been visited."

---

## 2. Proving Sorting Algorithms Correct

### 2.1 Insertion Sort

```java
void insertionSort(int[] A) {
    for (int i = 1; i < A.length; i++) {          // outer loop
        int key = A[i];
        int j = i - 1;
        while (j >= 0 && A[j] > key) {            // inner loop
            A[j + 1] = A[j];
            j--;
        }
        A[j + 1] = key;
    }
}
```

**Loop Invariant**: At the start of each iteration of the outer `for` loop, `A[0..i-1]` consists of the elements originally in `A[0..i-1]`, but in sorted order.

**Proof:**

*Initialization (i = 1)*: `A[0..0]` contains a single element. A single element is trivially sorted. ✓

*Maintenance*: Assume `A[0..i-1]` is sorted at the start of iteration `i`. The inner loop shifts `A[j]` right as long as `A[j] > key`. When the inner loop terminates, every element to the left of the insertion point is ≤ `key` and every element to the right is > `key` (they were shifted). Inserting `key` at `A[j+1]` preserves sorted order. So `A[0..i]` is sorted at the start of iteration `i+1`. ✓

*Termination*: The outer loop terminates when `i = n`. The invariant tells us `A[0..n-1]` is sorted — the entire array. ✓

**What this proof gives you**: The algorithm is correct for ALL inputs of ANY size. No "seems to work" — proved.

---

### 2.2 Why Bubble Sort's Invariant is Different

```java
void bubbleSort(int[] A) {
    for (int i = 0; i < A.length - 1; i++) {
        for (int j = 0; j < A.length - 1 - i; j++) {
            if (A[j] > A[j + 1]) swap(A, j, j + 1);
        }
    }
}
```

**Invariant**: After `i` complete passes of the inner loop, `A[n-i..n-1]` contains the `i` largest elements in sorted order in their final positions.

*Initialization*: Before any pass, `A[n-0..n-1]` = empty range. Vacuously true. ✓
*Maintenance*: Each pass of the inner loop "bubbles" the largest remaining element to position `n-1-i`. ✓
*Termination*: After `n-1` passes, `A[1..n-1]` contains the `n-1` largest elements sorted. `A[0]` must be the minimum. Array is sorted. ✓

---

### 2.3 Merge Sort Correctness (by Strong Induction)

Merge sort uses **structural induction** rather than a loop invariant:

**Claim**: `mergeSort(A, lo, hi)` correctly sorts `A[lo..hi]` for any valid lo, hi.

**Base case**: If `lo == hi`, the subarray has one element — already sorted. ✓

**Inductive step**: Assume `mergeSort` correctly sorts any subarray of length < (hi - lo + 1). Then:
- `mergeSort(A, lo, mid)` correctly sorts `A[lo..mid]` (smaller, by inductive hypothesis)
- `mergeSort(A, mid+1, hi)` correctly sorts `A[mid+1..hi]` (smaller, by inductive hypothesis)
- `merge()` merges two sorted arrays into one sorted array (separate proof needed)

**Proof that `merge()` is correct**: Loop invariant: at each step, `A[lo..k-1]` contains the `k - lo` smallest elements from the two halves, in sorted order. (Left as exercise.) ✓

---

## 3. Proving Binary Search Correct

```java
int binarySearch(int[] A, int target) {
    int lo = 0, hi = A.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (A[mid] == target) return mid;
        if (A[mid] < target) lo = mid + 1;
        else                 hi = mid - 1;
    }
    return -1;
}
```

**Loop Invariant**: At the start of each iteration, if `target` exists in `A`, then `target` ∈ `A[lo..hi]`.

**Proof:**

*Initialization*: `lo = 0, hi = n-1`. If `target` exists, it's in `A[0..n-1]`. ✓

*Maintenance*: Assume `target` ∈ `A[lo..hi]` at the start of an iteration. `mid = (lo + hi) / 2`.
- If `A[mid] == target`: found, return. Done.
- If `A[mid] < target`: `target` cannot be in `A[lo..mid]` (array is sorted, `A[mid]` is the largest in that range). So `target` ∈ `A[mid+1..hi]`. We set `lo = mid + 1`. Invariant holds. ✓
- If `A[mid] > target`: `target` cannot be in `A[mid..hi]`. So `target` ∈ `A[lo..mid-1]`. We set `hi = mid - 1`. Invariant holds. ✓

*Termination*: The loop terminates when `lo > hi` (empty range). If `target` were in `A`, the invariant says it'd be in `A[lo..hi]`. But `A[lo..hi]` is empty — contradiction. So `target` is not in `A`. Return -1 is correct. ✓

**Termination guarantee**: Each iteration strictly reduces `hi - lo` by at least 1 (since `mid` is strictly between `lo` and `hi` when `lo < hi`). So the loop terminates in at most ⌈log₂(n)⌉ iterations.

---

### The Classic Bug That Correctness Proofs Catch

```java
// ❌ Integer overflow bug (fails for large arrays):
int mid = (lo + hi) / 2;
// When lo + hi > Integer.MAX_VALUE, this overflows to a negative number.
// Loop invariant cannot be maintained — mid is negative, A[mid] throws ArrayIndexOutOfBoundsException.

// ✅ Overflow-safe:
int mid = lo + (hi - lo) / 2;
// Algebraically equivalent, but (hi - lo) never overflows for valid indices.
```

This bug lurked in Java's standard library `Arrays.binarySearch()` from 1946 to 2006 — 60 years. A correctness proof examining the range of `lo + hi` would have caught it immediately.

---

## 4. Proving Graph Algorithms Correct

### 4.1 BFS Correctness

**Theorem**: When BFS terminates, for every vertex `v` reachable from source `s`, `dist[v]` = shortest path length from `s` to `v` (in an unweighted graph).

**Proof by induction on distance `d`**:

**Base case (d = 0)**: `dist[s] = 0`. The shortest path from `s` to `s` is 0. ✓

**Inductive step**: Assume BFS correctly computes distances for all vertices at distance < d. We show it correctly computes distance for all vertices at distance d.

Let `v` be a vertex at distance d. There exists a shortest path `s → u → v` where `dist[u] = d - 1`. By inductive hypothesis, `dist[u] = d - 1` when `u` is dequeued.

**Key lemma**: BFS processes vertices in non-decreasing order of distance (the queue is monotone). So `u` is processed before any vertex at distance ≥ d. When `u` is processed, the edge `(u, v)` is relaxed: if `dist[v]` is unset, `dist[v] = d - 1 + 1 = d`. ✓

Can `dist[v]` be set to something < d earlier? Only if some vertex `u'` at distance < d - 1 has an edge to `v`, meaning dist[v] < d — contradiction. So `dist[v] = d` is set exactly once, and it's correct. ✓

**Corollary**: BFS on an unweighted graph is provably optimal — it finds shortest paths. No other algorithm can find shorter paths. (Because shortest = minimum number of edges, and BFS explores by layer.)

---

### 4.2 Dijkstra Correctness — The Greedy Invariant

**Invariant**: When a vertex `v` is extracted from the priority queue (finalized), `dist[v]` equals the true shortest path distance from `s` to `v`.

**Proof by contradiction**: Suppose `v` is the first vertex extracted where `dist[v] ≠ true_dist[v]`. Let `P` be the true shortest path from `s` to `v`. Let `u` be the last vertex on `P` that was finalized before `v`. Let `w` be the successor of `u` on `P` (not yet finalized).

```
s ─── (finalized) ─── u ─── w ─── ... ─── v
                             (not yet finalized)
```

Since `w` was relaxed when `u` was finalized: `dist[w] ≤ dist[u] + weight(u,w) = true_dist[w]`.

Since all edge weights are non-negative: `true_dist[w] ≤ true_dist[v]`.

So: `dist[w] ≤ true_dist[v]`.

But `v` was extracted from the priority queue before `w` (by assumption). So `dist[v] ≤ dist[w] ≤ true_dist[v]`.

Since `dist[v] ≥ true_dist[v]` always (relaxations can only lower dist, never below true_dist):

`dist[v] = true_dist[v]` — contradiction with our assumption. ✓

**Why Dijkstra fails with negative edges**: The proof relies on `true_dist[w] ≤ true_dist[v]` — impossible to guarantee with negative edges. A negative edge `(x, v)` where `x` is not yet finalized could give a shorter path to `v` after `v` is already extracted.

---

## 5. Exchange Arguments — Proving Greedy Algorithms Correct

The exchange argument is the standard technique for proving greedy algorithms produce optimal solutions. The structure:

```
1. Let G = greedy solution, O = any optimal solution
2. If G ≠ O, find the first place they differ
3. Show we can "exchange" O's choice for G's choice
   without making O worse (or strictly better = contradiction)
4. By repeated exchange, transform O into G without loss
5. Therefore G is optimal
```

### Example: Activity Selection

**Problem**: Given intervals with start/end times, select the maximum number of non-overlapping intervals.
**Greedy**: Always select the interval that ends earliest.

**Proof**:

Let G = (g₁, g₂, ..., gₖ) be the greedy solution (sorted by end time).
Let O = (o₁, o₂, ..., oₘ) be an optimal solution (sorted by end time).

**Claim**: k = m (greedy is optimal).

By induction: we show that for each i, finish(gᵢ) ≤ finish(oᵢ).

*Base case (i = 1)*: Greedy picks the activity ending first. finish(g₁) ≤ finish(o₁) for any o₁. ✓

*Inductive step*: Assume finish(gᵢ) ≤ finish(oᵢ). Consider gᵢ₊₁ (next greedy pick) vs oᵢ₊₁ (next optimal pick).

Since finish(gᵢ) ≤ finish(oᵢ) ≤ start(oᵢ₊₁), the activity oᵢ₊₁ is compatible with gᵢ. So when greedy chose gᵢ₊₁, oᵢ₊₁ was a valid candidate. Greedy picks the one ending earliest, so finish(gᵢ₊₁) ≤ finish(oᵢ₊₁). ✓

Therefore: if greedy picks k activities, so can any optimal (replace o₁..oₖ with g₁..gₖ — same or earlier end times, so no future activities become incompatible). So m ≤ k, but k ≤ m since O is optimal. Thus k = m. ✓

---

### Anti-example: When Greedy Fails (No Exchange Argument Exists)

Coin change with coins {1, 3, 4}, target = 6:
- Greedy (largest first): 4 + 1 + 1 = 3 coins
- Optimal: 3 + 3 = 2 coins

Why greedy fails: Picking the largest coin doesn't guarantee compatibility with future picks. The exchange argument breaks: if you swap a 3 for a 4, you need an extra 1, which may not combine optimally with remaining choices. → Must use DP.

**Rule**: Greedy provably works ↔ an exchange argument exists. If you can't construct one, the problem likely needs DP.

---

## 6. Optimal Substructure — Proving DP Is Valid

### What Optimal Substructure Means

A problem has **optimal substructure** if an optimal solution to the problem contains optimal solutions to its subproblems.

More precisely: if you cut out a subproblem from the optimal solution, what remains must also be optimal for that subproblem — otherwise you could replace it with a better subsolution and improve the overall solution, contradicting optimality.

### Proof Template: "Cut and Paste"

1. Assume the optimal solution S contains a subproblem solution s'.
2. Suppose s' is NOT optimal for the subproblem. Then there exists s'' that is better.
3. Replace s' with s'' in S to get S'. (This is the "cut and paste.")
4. Show S' is valid (feasibility).
5. Show S' is strictly better than S. Contradiction — S wasn't optimal.
6. Therefore s' must be optimal. Optimal substructure holds.

### Example: Shortest Path Has Optimal Substructure

**Claim**: If `p = s → ... → u → ... → v` is a shortest path from `s` to `v`, then the subpath `p' = s → ... → u` is a shortest path from `s` to `u`.

**Proof** (cut and paste): Suppose not. Let `q` be a shorter path from `s` to `u`: weight(q) < weight(p'). Then replace `p'` in `p` with `q`, giving path `q + (u → v)`. Weight = weight(q) + weight(u→v) < weight(p') + weight(u→v) = weight(p). This is a shorter path from `s` to `v` — contradicting that `p` is a shortest path. ✓

**Contrast — Longest Simple Path does NOT have optimal substructure**:

Consider graph: s → u → v, s → v (direct). Longest simple path s → v could be s → u → v. But the subpath s → u is NOT the longest path from s to u if there's a longer route through v (which would create a cycle, making it non-simple). Longest simple path is NP-hard — no DP exists.

### Proving DP Recurrences

For any DP problem, the proof structure is:

```
1. Define the subproblem precisely: "Let dp[i] = <exact statement>"
2. Derive the recurrence:
   Consider the last decision/item/character
   Express dp[i] in terms of dp[j] for j < i
3. Prove optimality:
   Show (by cut-and-paste) that dp[i] must use the optimal solution
   to dp[j] — optimal substructure
4. Prove overlapping subproblems:
   Show that the same dp[j] values are needed multiple times
   (justifying memoization over simple recursion)
```

### Example: Longest Increasing Subsequence

**Subproblem definition**: `dp[i]` = length of longest increasing subsequence ending at index `i`.

**Recurrence**: `dp[i] = 1 + max{ dp[j] : j < i and A[j] < A[i] }` (or 1 if no such j).

**Proof of optimal substructure**: Let L be the LIS ending at position `i`, with second-to-last element at position `j`. The prefix of L (ending at j) must be the longest increasing subsequence ending at `j` — otherwise, a longer prefix would give a longer L (cut and paste). ✓

**Proof of overlapping subproblems**: `dp[j]` may be needed when computing `dp[i]` for multiple values of `i > j` where `A[i] > A[j]`. Memoizing (tabulating) `dp[j]` saves re-computation. ✓

---

## 7. How to Write a Proof in an Interview

Most companies don't ask for formal proofs, but they do ask **"why does your algorithm work?"** The answer structure is a compressed loop invariant or exchange argument.

### The 3-Sentence Proof Template

```
"This algorithm is correct because:
  [1 sentence: what property holds after each step]
  [1 sentence: why that property is maintained]
  [1 sentence: why that property gives the answer when we finish]"
```

### Example — Explaining BFS Correctness

"BFS maintains the invariant that vertices are processed in non-decreasing order of distance from the source. This holds because the queue is FIFO — vertices at distance d are enqueued before distance d+1, so they're processed first. When BFS finishes, every vertex has been processed at its minimum distance, so `dist[v]` is the shortest path for all v."

### Example — Explaining Why Greedy Works for Interval Scheduling

"The 'earliest finish time' greedy is optimal because it minimizes future conflicts. Formally: by induction, after picking k intervals greedily, no optimal solution can pick k intervals where all end times are earlier than the greedy's end times. So the greedy never falls behind optimal — it always leaves as much room as optimal, so it can always match the count."

### Red Flags That Signal Your Algorithm is Wrong

1. **You can't state an invariant** — you don't understand what the algorithm maintains.
2. **Your invariant doesn't imply the answer** — even if maintained, it doesn't prove correctness.
3. **A greedy has no exchange argument** — it probably fails on some input.
4. **DP recurrence changes subproblem definition mid-proof** — the subproblem isn't well-defined.

---

## Practice Problems

**Invariant-based:**
1. Prove that selection sort is correct using a loop invariant.
2. Prove that the two-pointer approach for "find pair summing to k in sorted array" is correct.
3. Write the loop invariant for Kadane's algorithm (maximum subarray sum). Prove maintenance.

**Exchange argument:**
4. Prove that the greedy algorithm for Huffman coding is optimal (hint: exchange the two least-frequent subtrees).
5. Prove that fractional knapsack with greedy (highest value/weight first) is optimal.
6. Show that the 0/1 knapsack greedy fails — construct a counterexample and explain why no exchange argument can be formed.

**Optimal substructure:**
7. Prove that edit distance has optimal substructure. (What's the "last operation" decomposition?)
8. Does "maximum weight independent set in a general graph" have optimal substructure? Why or why not?
9. Prove that matrix chain multiplication has optimal substructure using cut and paste.

---

## Summary: The Proof Toolbox

```
Algorithm type          │ Proof technique
────────────────────────┼────────────────────────────────────────────
Loop / iterative        │ Loop invariant (init + maintenance + termination)
Recursive               │ Strong induction on input size
Divide and conquer      │ Structural induction on problem size
Greedy                  │ Exchange argument (swap greedy for optimal, no worse)
DP recurrence valid     │ Optimal substructure (cut and paste)
DP vs greedy decision   │ Try exchange argument; if it fails, use DP
Algorithm is wrong      │ Construct counterexample (break the invariant)
```

*[Back to Index](00_INDEX.md) | [A2: Complexity from First Principles →](A2_Complexity_FirstPrinciples.md)*
