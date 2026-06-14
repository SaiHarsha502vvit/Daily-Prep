import sys

# =====================================================================
# 04a_DP_Internals.md — add Proof Corner + When It Breaks
# =====================================================================
path = '03_Algorithms/04a_DP_Internals.md'
txt = open(path, encoding='utf-8').read()
tail_anchor = '**Why**: `tails[]` is always sorted. Binary search finds the correct position in O(log n) per element. Total: O(n log n).'
addition = """

---

## Proof Corner -- Optimal Substructure for LCS

**Claim**: Let LCS(i,j) = length of the longest common subsequence of A[0..i-1] and B[0..j-1].

**Recurrence correctness** (by case analysis):

Case 1: A[i-1] == B[j-1]. The last characters match. They must appear together in any optimal LCS (if one appears, including the other costs nothing and can only help). So LCS(i,j) = LCS(i-1,j-1) + 1.

Case 2: A[i-1] != B[j-1]. The optimal LCS either excludes A[i-1] (giving LCS(i-1,j)) or excludes B[j-1] (giving LCS(i,j-1)), or both. Taking the max covers all cases: LCS(i,j) = max(LCS(i-1,j), LCS(i,j-1)).

**Base cases**: LCS(i,0) = LCS(0,j) = 0 (empty string has no common subsequence). Correct.

**Loop invariant for the tabulation nested loops**: After the inner loop completes for row i, `dp[i][j]` = LCS(A[0..i-1], B[0..j-1]) for all j in [0..m].

- *Init*: dp[0][j] = 0 for all j (outer loop hasn't started). Correct.
- *Maintenance*: Each dp[i][j] is computed from dp[i-1][j], dp[i][j-1], dp[i-1][j-1] -- all previously computed. Correct.
- *Termination*: dp[n][m] = LCS of full A and B. QED.

---

## When It Breaks -- DP Internals

**1. Backward vs forward loop for 0/1 Knapsack** -- the most common DP bug. 1D rolling array needs `w` from W down to weight[i]. Scanning forward re-uses item i in the same pass (accidentally solving unbounded knapsack). Debug: add item with weight=2, value=10, capacity=6. 0/1 answer=10; unbounded answer=30.

**2. Traceback on rolled array** -- 1D rolling arrays save space but lose the traceback path. You cannot reconstruct which items were chosen because dp[w] is overwritten. Fix: keep the full 2D array if you need the actual subsequence/items, not just the length/value.

**3. int overflow in counting DP** -- "count the ways" problems (LC 70 Climbing Stairs, LC 91 Decode Ways) silently overflow int for large n. Always use `long`; apply `% MOD` at every addition step, not just at the end. Applying mod only at the end can overflow before you reach that line.

**4. HashMap with array keys** -- using `dp[int[]]` or `Map<int[], V>` in Java compares by reference, not content. Two `new int[]{1,2}` keys never collide. Fix: encode as `String.valueOf(arr)`, use `Arrays.toString()`, or encode as a long if dimensions allow (e.g., i*1000+j for 0<=i,j<1000).

**5. Off-by-one in string indices** -- LCS/Edit Distance tables are (n+1)x(m+1). dp[i][j] represents prefixes A[0..i-1] and B[0..j-1]. A common mistake: `dp[i][j] = dp[i-1][j-1]` when `A[i] == B[j]` (off by one -- should be `A[i-1]` and `B[j-1]`). Produces wrong answers that only show up for certain string pairs."""
if tail_anchor in txt:
    txt = txt.replace(tail_anchor, tail_anchor + addition, 1)
    open(path, 'w', encoding='utf-8').write(txt)
    print('OK: 04a_DP_Internals.md')
else:
    print('MISS: 04a_DP_Internals.md')

# =====================================================================
# 16_DSA_Deep_Reasoning.md -- add When It Breaks + Ref Anchor
# =====================================================================
path = '03_Algorithms/16_DSA_Deep_Reasoning.md'
txt = open(path, encoding='utf-8').read()
nav_anchor = '**Navigation**: [< Previous](15_Monotonic_Stack_Queue_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](17_DSA_Java_Implementation_Mastery.md)'
addition = """## When It Breaks -- DSA Deep Reasoning

**1. Dijkstra with negative edges** -- once a node is settled, Dijkstra never revisits it. A negative-weight edge discovered later can produce a shorter path that was missed. Symptom: wrong shortest-path distances, not an exception. Fix: Bellman-Ford or SPFA for graphs with negative (but no negative-cycle) edges.

**2. Greedy without exchange argument** -- applying a greedy heuristic where the greedy-stays-ahead argument fails. Classic: fractional knapsack greedy (sort by value/weight ratio) does NOT work for 0/1 knapsack. Symptom: a close-but-wrong answer that passes most test cases but fails when item weights are incompatible.

**3. Wrong loop invariant direction** -- in binary search, using `lo = mid` (not `mid+1`) when hi = lo+1 creates an infinite loop. Safe form: `lo = mid+1` or `hi = mid` with correct convergence guarantee. Always verify the invariant shrinks the search space by at least 1 per iteration.

**4. BFS on unweighted graph vs Dijkstra on weighted** -- treating a weighted graph as unweighted (running BFS) produces shortest hop count, not shortest weighted path. Symptom: correct for uniform edge weights, wrong when edges have different costs.

**5. Confusing DFS pre/in/post-order** -- pre-order visits root before children (copy/serialise), in-order visits left->root->right (BST sorted output), post-order visits children before root (deletion/size). Mixing these gives wrong results without any exception.

---

## Reference Anchor

**OpenJDK -- priority queue and graph algorithm foundations**:
```java
// java.util.PriorityQueue: binary min-heap, O(log n) offer/poll
// Used for Dijkstra, Prim's MST, A*, scheduling simulations
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
// a[0] = dist, a[1] = node

// java.util.ArrayDeque: BFS queue (much faster than LinkedList for queue use)
// Circular array doubling, O(1) amortised offer/poll
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(source);
while (!queue.isEmpty()) {
    int u = queue.poll();
    for (int v : adj[u]) if (!visited[v]) { visited[v] = true; queue.offer(v); }
}

// java.util.TreeMap: Red-Black BST, O(log n) put/get/floorKey/ceilingKey
// Used for interval scheduling, sweep-line, "next greater element"
TreeMap<Integer, Integer> events = new TreeMap<>();
Map.Entry<Integer, Integer> prev = events.floorEntry(queryTime);
```

"""
if nav_anchor in txt:
    txt = txt.replace(nav_anchor, addition + nav_anchor, 1)
    open(path, 'w', encoding='utf-8').write(txt)
    print('OK: 16_DSA_Deep_Reasoning.md')
else:
    print('MISS: 16_DSA_Deep_Reasoning.md')

# =====================================================================
# A2_Complexity_FirstPrinciples.md (algo folder) -- add Exam Problems + Ref Anchor
# =====================================================================
path = '03_Algorithms/A2_Complexity_FirstPrinciples.md'
txt = open(path, encoding='utf-8').read()
nav_anchor = '*[<- A1: Correctness Proofs](A1_Correctness_Proofs.md) | [A3: Lower Bounds & NP ->](A3_Lower_Bounds_And_NP.md)*'
# Try with em-dash variant too
if nav_anchor not in txt:
    nav_anchor = '*[← A1: Correctness Proofs](A1_Correctness_Proofs.md) | [A3: Lower Bounds & NP →](A3_Lower_Bounds_And_NP.md)*'
addition = """---

## Section Challenge -- Complexity First Principles (Algorithms)

**Problem 1 (Recurrence -- 8 min)**: Solve T(n) = 2T(n/2) + O(n) using the Master Theorem. State which case applies and why.

<details><summary>Model Answer</summary>

Master Theorem: T(n) = aT(n/b) + f(n). Here a=2, b=2, f(n)=O(n).

Compute n^{log_b a} = n^{log_2 2} = n^1 = n.

f(n) = O(n) = O(n^1). This matches n^{log_b a} exactly (within a constant).

**Case 2**: f(n) = Theta(n^{log_b a}) => T(n) = Theta(n^{log_b a} * log n) = Theta(n log n).

This is the merge sort recurrence. The O(n) merge work at each of log n levels sums to O(n log n).

**Intuition check**: At level k (0-indexed from top), there are 2^k subproblems each of size n/2^k, doing O(n/2^k) merge work each. Total work at level k = 2^k * O(n/2^k) = O(n). Summing over log n levels: O(n log n).

</details>

**Problem 2 (Lower Bound -- 6 min)**: Prove that any comparison-based sorting algorithm requires Omega(n log n) comparisons in the worst case.

<details><summary>Model Answer</summary>

**Decision tree argument**: Model a comparison-based sort as a binary decision tree. Each internal node is a comparison (a_i <= a_j?); each leaf is a sorted permutation. For n elements, there are n! possible permutations, so the tree needs >= n! leaves. A binary tree of height h has at most 2^h leaves. Therefore: 2^h >= n!, so h >= log_2(n!).

By Stirling: log_2(n!) = sum_{k=1}^{n} log_2(k) >= integral_1^n log_2(x)dx = n*log_2(n) - n/ln(2) = Omega(n log n).

Therefore any comparison-based sort makes Omega(n log n) comparisons in the worst case. Merge sort and heapsort achieve this bound.

</details>

---

## Reference Anchor

**OpenJDK -- complexity verification through TimSort and binary search**:
```java
// java.util.TimSort (Arrays.sort for objects) -- production merge sort
// Key property: O(n) on already-sorted input (detects natural runs)
//               O(n log n) worst case for random input
// MIN_MERGE = 32: runs shorter than 32 elements use binary insertion sort

// java.util.Arrays.binarySearch -- O(log n) search on sorted arrays
// Uses lo + (hi-lo)/2 mid formula (overflow-safe)
int idx = Arrays.binarySearch(sortedArr, key);
// Returns: index if found; -(insertionPoint)-1 if not found

// Why complexity matters in production:
// O(n^2) sort on 10k elements = 100M ops @ 10ns = 1 second
// O(n log n) sort on 10k elements = 130k ops @ 10ns = 0.001 seconds
// Difference is irrelevant for n=100; catastrophic for n=100,000
```

"""
if nav_anchor in txt:
    txt = txt.replace(nav_anchor, addition + nav_anchor, 1)
    open(path, 'w', encoding='utf-8').write(txt)
    print('OK: A2_Complexity_FirstPrinciples.md (algo)')
else:
    # show what the file ends with
    print('MISS: A2_Complexity_FirstPrinciples.md (algo) -- last 200 chars:', repr(txt[-200:]))

print('Batch 2 done')
