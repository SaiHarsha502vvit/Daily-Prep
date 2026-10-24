# Algorithm Family Cheat Sheets

> **KTH / MIT / RWTH Exam Reference** — compact 1-2 page cards per family.
> Signal → Pattern → Complexity → Gotcha → Java API.
> Cross-references: full chapters in `02_Data_Structures/` and `03_Algorithms/`.

---

## CS1 · Sorting

| Algorithm | Best | Average | Worst | Space | Stable | When |
|-----------|------|---------|-------|-------|--------|------|
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ | n < 20, nearly-sorted |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | Stable sort needed |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | General in-place |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ | Worst-case O(n log n) in-place |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ | Integer keys in [0,k] |
| Tim Sort (Java) | O(n) | O(n log n) | O(n log n) | O(n) | ✅ | Default for `Arrays.sort(Object[])` |

**Lower bound**: Ω(n log n) for comparison-based sorting (decision tree: n! leaves, 2^h ≥ n! ⟹ h ≥ log₂n! = Θ(n log n)).

**Java API**:
```java
Arrays.sort(arr);                    // int[]: DualPivotQuicksort, O(n log n), unstable
Arrays.sort(objArr);                 // Object[]: TimSort, O(n log n), stable
Arrays.sort(arr, lo, hi);            // subarray sort (half-open: [lo, hi))
Arrays.sort(arr, comparator);        // custom order
Collections.sort(list);              // List: TimSort, stable
list.sort(Comparator.reverseOrder()); // reverse
```

**Gotchas**:
- `Arrays.sort(int[])` is unstable — don't use it when relative order of equal elements matters.
- Non-transitive Comparator on `Arrays.sort(Object[])` → `IllegalArgumentException` (TimSort detects).
- Counting/Radix only safe when key range k is known and small relative to n.

---

## CS2 · Binary Search & Two Pointers

```
Signal: sorted array, "find position", "first/last that satisfies condition" → binary search
Signal: sorted pair, "two numbers sum to target" → two pointers from both ends
Signal: "longest/shortest subarray with property" → sliding window
```

**Generic binary search template** (find first index where `condition(mid)` is true):
```java
int lo = 0, hi = n;          // search range [lo, hi)
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;   // avoids overflow
    if (condition(mid)) hi = mid;    // shrink right
    else lo = mid + 1;               // shrink left
}
return lo;  // first index satisfying condition, or n if none
```
Complexity: O(log n). Space: O(1).

**Two-pointer template** (sorted array, find pair summing to target):
```java
int lo = 0, hi = n - 1;
while (lo < hi) {
    int sum = arr[lo] + arr[hi];
    if (sum == target) return new int[]{lo, hi};
    else if (sum < target) lo++;
    else hi--;
}
```

**Sliding window template** (longest subarray with sum ≤ k):
```java
int lo = 0, sum = 0, maxLen = 0;
for (int hi = 0; hi < n; hi++) {
    sum += arr[hi];
    while (sum > k) sum -= arr[lo++];   // shrink while invalid
    maxLen = Math.max(maxLen, hi - lo + 1);
}
```

**Gotchas**:
- `mid = (lo + hi) / 2` overflows when lo + hi > Integer.MAX_VALUE. Always use `lo + (hi-lo)/2`.
- Off-by-one: decide upfront if your range is `[lo, hi]` or `[lo, hi)` — be consistent.
- The two-pointer *pair-sum* technique needs SORTED input. For unsorted input: sort first (O(n log n)) or use a HashMap (O(n)). (Other two-pointer patterns, such as sliding windows and in-place partitioning, do not require sorting.)

---

## CS3 · Recursion & Divide and Conquer

**Recurrence solving — Master Theorem** (T(n) = aT(n/b) + f(n)):

| Case | Condition | Result |
|------|-----------|--------|
| 1 — Leaves dominate | f(n) = O(n^(log_b a − ε)) | T(n) = Θ(n^(log_b a)) |
| 2 — Equal at each level | f(n) = Θ(n^(log_b a)) | T(n) = Θ(n^(log_b a) · log n) |
| 3 — Root dominates | f(n) = Ω(n^(log_b a + ε)) + regularity | T(n) = Θ(f(n)) |

**Quick examples**:
- Merge sort: T(n)=2T(n/2)+n → a=2,b=2,p=1. f(n)=n=Θ(n^p) → Case 2 → **Θ(n log n)**
- Binary search: T(n)=T(n/2)+1 → a=1,b=2,p=0. f(n)=1=Θ(n^p) → Case 2 → **Θ(log n)**
- Strassen: T(n)=7T(n/2)+n² → p=log₂7≈2.807. f(n)=n²=O(n^(p-ε)) → Case 1 → **Θ(n^2.807)**

**D&C template**:
```java
T solve(Problem p) {
    if (p.isBaseCase()) return baseAnswer(p);
    List<Problem> subproblems = divide(p);      // O(f(n)) divide
    List<T> results = subproblems.stream().map(this::solve).toList();  // recurse
    return combine(results);                     // O(f(n)) combine
}
```

**Gotchas**:
- Stack overflow at depth > ~10,000 (default JVM stack). Convert to iterative with explicit stack.
- Master Theorem doesn't apply when subproblems have unequal sizes (use recursion tree instead).
- Always verify base case terminates; off-by-one in recursion = infinite recursion.

---

## CS4 · Dynamic Programming

**Recognition signals**:
```
"count / max / min number of ways to reach a goal"  → DP
"overlapping subproblems" (same subproblem called many times) → memoize
"optimal substructure" (optimal answer uses optimal sub-answers) → DP recurrence
```

**Template — top-down memoization**:
```java
Map<State, Long> memo = new HashMap<>();
long dp(State s) {
    if (base(s)) return baseValue(s);
    if (memo.containsKey(s)) return memo.get(s);
    long result = /* combine dp(s') for all transitions s→s' */;
    memo.put(s, result);
    return result;
}
```

**Template — bottom-up tabulation**:
```java
long[] dp = new long[n + 1];
dp[0] = base;
for (int i = 1; i <= n; i++)
    dp[i] = /* combine dp[j] for all valid predecessors j */;
return dp[n];
```

**Classic patterns**:

| Pattern | Recurrence | State | Example |
|---------|-----------|-------|---------|
| 1D Knapsack | dp[i] = max over choices at i | dp[i] | Coin change, climbing stairs |
| 2D String | dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) | dp[i][j] | LCS, Edit distance |
| Interval | dp[i][j] = best solution for subarray [i,j] | dp[i][j] | Matrix chain, Burst balloons |
| Bitmask | dp[mask][i] = optimal visiting subset mask ending at i | dp[mask][i] | TSP, assignment |
| Tree DP | dp[node] = f(dp[children]) | dp[node] | Diameter, max path sum |

**Complexity rule**: State space × transition cost per state. 1D: O(n) states × O(1) = O(n). 2D string: O(n²) states × O(1) = O(n²). Bitmask: O(2ⁿ × n) states.

**Gotchas**:
- Integer overflow: use `long`, add `(long)` casts before multiplication.
- Wrong base case → wrong result everywhere. Always verify dp[0], dp[1] manually.
- Greedy over DP: try exchange argument first; if it fails or counterexample exists → DP.

---

## CS5 · Graph Algorithms

**Representation choice**:
```
E << V²  (sparse: roads, social nets)  → adjacency LIST  [O(V+E) space]
E ≈ V²   (dense: complete, matrix)     → adjacency MATRIX [O(V²) space, O(1) edge query]
```

**BFS — shortest path, unweighted**:
```java
// Invariant: dist[v] = shortest hop-count from source to v when v first dequeued
Queue<Integer> q = new ArrayDeque<>();
int[] dist = new int[V]; Arrays.fill(dist, -1);
dist[src] = 0; q.add(src);
while (!q.isEmpty()) {
    int u = q.poll();
    for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }
}
```
Complexity: O(V+E).

**Dijkstra — shortest path, non-negative weights**:
```java
// Invariant: when u is extracted, dist[u] = δ(src, u) (final)
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
int[] dist = new int[V]; Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0; pq.offer(new int[]{src, 0});
while (!pq.isEmpty()) {
    int[] cur = pq.poll(); int u = cur[0], d = cur[1];
    if (d > dist[u]) continue;   // stale entry
    for (int[] e : adj[u]) if (dist[u] + e[1] < dist[e[0]]) {
        dist[e[0]] = dist[u] + e[1]; pq.offer(new int[]{e[0], dist[e[0]]});
    }
}
```
Complexity: O((V+E) log V).

**Algorithm selector**:

| Signal | Algorithm | Time |
|--------|-----------|------|
| Unweighted shortest path | BFS | O(V+E) |
| Weighted, non-negative edges | Dijkstra | O((V+E) log V) |
| Negative edges, no negative cycles | Bellman-Ford | O(VE) |
| All-pairs shortest path | Floyd-Warshall | O(V³) |
| Minimum spanning tree | Prim or Kruskal | O(E log V) |
| Topological order | DFS-based / Kahn's BFS | O(V+E) |
| Strongly connected components | Tarjan's / Kosaraju's | O(V+E) |
| Cycle detection (directed) | DFS (WHITE/GRAY/BLACK states) | O(V+E) |

**Gotchas**:
- Dijkstra breaks on negative edges (use Bellman-Ford).
- DFS on a directed graph: GRAY node = back edge = cycle. DONE node = cross/forward edge ≠ cycle.
- `HashMap`-backed adjacency lists don't guarantee iteration order → non-deterministic BFS/DFS in tests.

---

## CS6 · Greedy Algorithms

**Proof checklist before using greedy**:
1. **Greedy choice property**: the locally optimal choice at each step leads to a globally optimal solution.
2. **Optimal substructure**: after making the greedy choice, the remaining subproblem has the same form.
3. **Exchange argument**: assume optimal solution O differs from greedy G. Swap the first differing choice with G's choice → result is no worse → can transform O into G without losing optimality.

**Canonical greedy patterns**:

| Problem | Greedy rule | Proof technique |
|---------|-------------|-----------------|
| Activity Selection | Sort by finish time; always pick earliest-finishing compatible | Exchange argument |
| Huffman Coding | Always merge two lowest-frequency nodes | Exchange + tree structure |
| Fractional Knapsack | Sort by value/weight; take highest ratio first | Exchange argument |
| Coin Change (canonical coins) | Always take largest denomination | Holds for standard coins {1,5,10,25} |
| Interval scheduling | Sort by deadline; schedule if fits | Exchange argument |
| Minimum Spanning Tree | Kruskal: always add cheapest edge that doesn't form cycle | Cut property |

**Greedy counterexample toolkit** — test these inputs when greedy seems wrong:
- `{1, 3, 4}` coins, target=6: greedy gives `{4,1,1}` (3 coins); optimal `{3,3}` (2 coins).
- Weighted job scheduling: sort by deadline fails when weights differ.

---

## CS7 · Backtracking

**Template**:
```java
void backtrack(State s, List<State> result) {
    if (isComplete(s)) { result.add(copy(s)); return; }
    for (Choice c : validChoices(s)) {
        choose(s, c);          // modify state
        backtrack(s, result);  // recurse
        unchoose(s, c);        // restore state EXACTLY
    }
}
```

**State space sizes**:

| Problem | State space | Pruning potential |
|---------|------------|-------------------|
| Subsets of n elements | 2ⁿ | Low |
| Permutations of n | n! | Medium (visited flags) |
| N-Queens | O(n!) | High (row/col/diagonal constraints) |
| Sudoku (9×9) | 9^81 trivially | Very high (~20 backtracks with arc-consistency) |

**Pruning strategies**: constraint propagation (arc consistency), bound checking (branch and bound), symmetry breaking.

**Gotcha**: `unchoose` must restore state **exactly** to pre-`choose` state. Any partial restoration leaves the state corrupted → wrong results with no error thrown.

---

## CS8 · Union-Find (Disjoint Set Union)

```java
int[] parent, rank;
void init(int n) { parent = new int[n]; rank = new int[n]; for (int i=0;i<n;i++) parent[i]=i; }
int find(int x) { if (parent[x] != x) parent[x] = find(parent[x]); return parent[x]; } // path compression
void union(int x, int y) {
    x = find(x); y = find(y); if (x == y) return;
    if (rank[x] < rank[y]) { int t=x; x=y; y=t; }
    parent[y] = x; if (rank[x] == rank[y]) rank[x]++;
}
boolean connected(int x, int y) { return find(x) == find(y); }
```

Complexity: O(α(n)) per operation where α is the inverse Ackermann function — effectively O(1).

**Use cases**: Kruskal's MST, network connectivity, number of islands variant.

**Gotcha**: Standard DSU does not support `unmerge` (rollback). For rollback, use DSU with union-by-rank only (no path compression) + an explicit undo stack.

---

## CS9 · Monotonic Stack / Queue

**Monotonic stack** (Next Greater Element):
```java
Deque<Integer> stack = new ArrayDeque<>();  // stores indices
int[] result = new int[n]; Arrays.fill(result, -1);
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
        result[stack.pop()] = arr[i];  // i is the "next greater" for popped element
    stack.push(i);
}
```
Complexity: O(n) — each element pushed and popped at most once.

**Monotonic deque** (Sliding Window Maximum):
```java
Deque<Integer> dq = new ArrayDeque<>();  // indices, decreasing values
for (int i = 0; i < n; i++) {
    while (!dq.isEmpty() && dq.peekFirst() < i - k + 1) dq.pollFirst();  // expire
    while (!dq.isEmpty() && arr[dq.peekLast()] <= arr[i]) dq.pollLast();  // maintain monotone
    dq.addLast(i);
    if (i >= k - 1) result[i - k + 1] = arr[dq.peekFirst()];
}
```

**Signal patterns**:
- "Next greater/smaller element" → monotonic stack
- "Previous greater/smaller element" → monotonic stack, iterate right-to-left
- "Sliding window max/min" → monotonic deque
- "Largest rectangle in histogram" → monotonic stack (track width × height)

---

## CS10 · Prefix Sum / Difference Array

**Prefix sum** — range sum query in O(1) after O(n) build:
```java
int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];
// Sum of arr[lo..hi] (inclusive):
int rangeSum = prefix[hi + 1] - prefix[lo];
```

**2D prefix sum** — rectangle sum query in O(1):
```java
int[][] p = new int[m+1][n+1];
for (int i=1;i<=m;i++) for (int j=1;j<=n;j++)
    p[i][j] = mat[i-1][j-1] + p[i-1][j] + p[i][j-1] - p[i-1][j-1];
// Sum of rectangle (r1,c1)→(r2,c2) (0-indexed):
int sum = p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1];
```

**Difference array** — range update in O(1), read in O(n):
```java
int[] diff = new int[n + 1];
// Add v to arr[lo..hi]:
diff[lo] += v; diff[hi + 1] -= v;
// Recover arr after all updates:
int running = 0;
for (int i = 0; i < n; i++) { running += diff[i]; arr[i] = running; }
```

**Prefix XOR** — range XOR query in O(1):
```java
int[] xorPrefix = new int[n + 1];
for (int i = 0; i < n; i++) xorPrefix[i+1] = xorPrefix[i] ^ arr[i];
int rangeXOR = xorPrefix[hi + 1] ^ xorPrefix[lo];
```

**Gotcha**: 2D prefix sum inclusion-exclusion — easy to miscount corners. Draw it on paper first.

---

## Quick Complexity Reference

| Operation | Array | LinkedList | HashMap | TreeMap | PriorityQueue | ArrayDeque |
|-----------|-------|-----------|---------|---------|--------------|-----------|
| Access by index | O(1) | O(n) | — | — | — | O(1) |
| Search by value | O(n) | O(n) | O(1) avg | O(log n) | O(n) | O(n) |
| Insert at end | O(1) amort | O(1) | O(1) amort | O(log n) | O(log n) | O(1) amort |
| Insert at position | O(n) | O(1)* | — | — | — | O(n) |
| Delete min/max | O(n) | O(n) | — | O(log n) | O(log n) | O(1) |
| Sorted iteration | O(n log n) | O(n log n) | — | O(n) | O(n log n) | — |

*O(1) for LinkedList only if you already hold the node pointer (iterator).

---

## Step-by-Step Execution Traces

> These are the 4 algorithms most commonly traced wrong in interviews. Study the exact state after each step.

### Trace 1 — Merge Sort Merge Step

Input: left = `[1, 4, 7]`, right = `[2, 5, 6]`

```
i=0  j=0  result=[]          compare 1 vs 2 → take 1 (left)
i=1  j=0  result=[1]         compare 4 vs 2 → take 2 (right)
i=1  j=1  result=[1,2]       compare 4 vs 5 → take 4 (left)
i=2  j=1  result=[1,2,4]     compare 7 vs 5 → take 5 (right)
i=2  j=2  result=[1,2,4,5]   compare 7 vs 6 → take 6 (right)
i=2  j=3  result=[1,2,4,5,6] j exhausted → append remaining left: [7]
         result=[1,2,4,5,6,7] ✓
```

**Invariant at each step**: result contains the i+j smallest elements from the combined arrays, in sorted order.

---

### Trace 2 — Dijkstra (small graph)

Graph: A→B(4), A→C(2), C→B(1), B→D(3), C→D(5)

```
Init:  dist={A:0, B:∞, C:∞, D:∞}   pq=[(0,A)]

Extract A (dist=0):
  Relax A→B: dist[B] = min(∞, 0+4) = 4 → pq=[(2,C),(4,B)]
  Relax A→C: dist[C] = min(∞, 0+2) = 2 → pq=[(2,C),(4,B)]

Extract C (dist=2):
  Relax C→B: dist[B] = min(4, 2+1) = 3 → pq=[(3,B),(4,B←stale)]
  Relax C→D: dist[D] = min(∞, 2+5) = 7 → pq=[(3,B),(4,B←stale),(7,D)]

Extract B (dist=3):
  Relax B→D: dist[D] = min(7, 3+3) = 6 → pq=[(4,B←stale),(6,D),(7,D←stale)]

Extract (4,B): dist[B]=3 < 4 → SKIP (stale entry)

Extract D (dist=6):
  No outgoing edges.

Final: dist={A:0, B:3, C:2, D:6}
```

**Key**: stale entries in the priority queue are recognized by `if (d > dist[u]) continue;` — never process a vertex a second time at a higher distance.

---

### Trace 3 — LCS DP Table Fill

`s1 = "ABCB"`, `s2 = "BCAB"`, find Longest Common Subsequence.

```
dp[i][j] = LCS length for s1[0..i-1] and s2[0..j-1]

     ""  B   C   A   B
""  [ 0   0   0   0   0 ]
A   [ 0   0   0   1   1 ]   s1[0]='A' matches s2[2]='A' → dp[1][3]=dp[0][2]+1=1
B   [ 0   1   1   1   2 ]   s1[1]='B' matches s2[0]='B' → dp[2][1]=1; also s2[3]='B' → dp[2][4]=2
C   [ 0   1   2   2   2 ]   s1[2]='C' matches s2[1]='C' → dp[3][2]=dp[2][1]+1=2
B   [ 0   1   2   2   3 ]   s1[3]='B' matches s2[3]='B' → dp[4][4]=dp[3][3]+1=3

Answer: dp[4][4] = 3 → LCS = "BCB" (or "BAB" — multiple valid answers)
```

**Recurrence**:
- If `s1[i-1] == s2[j-1]`: `dp[i][j] = dp[i-1][j-1] + 1`
- Else: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`

---

### Trace 4 — Heap Insert (min-heap) + Sift-Up

Initial heap: `[1, 3, 6, 5, 9, 8]` (array representation, 0-indexed)

```
        1
      /   \
     3     6
    / \   /
   5   9 8
```

**Insert 2**: append to end → `[1, 3, 6, 5, 9, 8, 2]`

```
        1
      /   \
     3     6
    / \   / \
   5   9 8   2   ← new node at index 6
```

**Sift-up from index 6**:
```
Step 1: child=2 (idx 6), parent=6 (idx 2). 2 < 6 → swap
  [1, 3, 2, 5, 9, 8, 6]
        1
      /   \
     3     2
    / \   / \
   5   9 8   6

Step 2: child=2 (idx 2), parent=1 (idx 0). 2 > 1 → stop (heap property satisfied)

Final: [1, 3, 2, 5, 9, 8, 6]  ← valid min-heap
```

**Parent/child formula** (0-indexed): parent of i = `(i-1)/2`; children of i = `2i+1`, `2i+2`.

---

> **Cross-references**: [Sorting →](02a_Sorting_Fundamentals.md) · [D&C →](02c_Divide_And_Conquer.md) · [Graphs →](05c_Graphs_Fundamentals.md) · [DP →](04b_DP_Fundamentals.md) · [Greedy →](12_Greedy_Algorithms_Complete.md) · [Backtracking →](11_Backtracking_Complete.md) · [Algorithm Timeline →](00_ALGORITHM_TIMELINE.md)
