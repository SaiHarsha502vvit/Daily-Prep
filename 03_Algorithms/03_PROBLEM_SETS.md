# 📝 Algorithms — Problem Sets
## `03_Algorithms` Module | MIT 6.006 / ETH Algorithms Style

> **How to use:** Attempt every problem *before* reading the answer. Implement Part B in `JavaSolutions/ps/algo/`. Run the JUnit stubs. Read 🔴 **Erklärung** if you fail — it tells you *exactly* what went wrong in your mental model.

---

## Problem Set ALGO-PS1 — Trees

**Prerequisites:** `02_Data_Structures/01f_Trees_Heaps.md`, `03_Algorithms/05_Trees.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the height of a perfect binary tree with `n` nodes? Show the derivation.

<details><summary>Answer</summary>

A perfect binary tree with height `h` has `n = 2^(h+1) - 1` nodes.

Solving for h: `h = ⌊log₂(n+1)⌋ - 1 ≈ O(log n)`

**Example:** n=7 → h=2, n=15 → h=3, n=31 → h=4.

🔴 **Erklärung:** Students often confuse height with number of levels. Height = number of *edges* on the longest root-to-leaf path. A single-node tree has height 0, not height 1.
</details>

---

**A2 (Medium).** Prove that inorder traversal of a BST always visits nodes in sorted ascending order.

<details><summary>Answer</summary>

**Proof by structural induction:**

**Base case:** A single-node BST. Inorder visits: left (empty), root, right (empty) = just the root. Trivially sorted.

**Inductive step:** Assume both left and right subtrees produce sorted sequences when traversed inorder. In a BST, all left subtree keys < root key < all right subtree keys.

Inorder visits: [sorted left subtree] → root → [sorted right subtree].

Since left_max < root < right_min (BST invariant), concatenating these three sorted sequences yields a globally sorted sequence. ∎

🔴 **Erklärung:** Just saying "left < root < right so it's sorted" is not a proof — it only proves local ordering, not global ordering. The inductive argument is required to propagate the claim through all subtrees.
</details>

---

**A3 (Hard).** You are given a BST where two nodes have been swapped by mistake. Design an O(n) time O(1) space algorithm to find and fix them. What invariant do you exploit?

<details><summary>Answer</summary>

**Key invariant:** Inorder traversal of a correct BST is a strictly increasing sequence. A swap creates exactly 1 or 2 *inversions* (positions where `prev > current`).

**Algorithm (Morris Traversal for O(1) space):**
1. Do inorder traversal keeping track of `prev`.
2. When `prev > current`, mark:
   - First violation: `first = prev`, `second = current`
   - Second violation (if it exists): update `second = current`
3. After traversal, swap `first.val` and `second.val`.

**Two cases:**
- Swapped nodes are **adjacent** in inorder: only 1 inversion. `first` and `second` come from that single inversion.
- Swapped nodes are **non-adjacent**: 2 inversions. `first` from first violation, `second` from second violation.

🔴 **Erklärung:** Students often use O(n) space by collecting the inorder list and finding inversions. The O(1) space constraint forces Morris Traversal (threading), which is rarely taught but tested at top companies.
</details>

---

### Part B: Implementation

**B1.** Implement a complete `BST<T extends Comparable<T>>` in Java:

```java
// Skeleton — JavaSolutions/ps/algo/BST.java
public class BST<T extends Comparable<T>> {
    private Node<T> root;
    
    private static class Node<T> {
        T val;
        Node<T> left, right;
        Node(T val) { this.val = val; }
    }
    
    public void insert(T val) { /* TODO */ }
    public boolean contains(T val) { /* TODO */ }
    public void delete(T val) { /* TODO: handle 3 cases */ }
    public List<T> inorder() { /* TODO: returns sorted list */ }
    public int height() { /* TODO: recursive */ }
    public boolean isValid() { /* TODO: enforce BST invariant with bounds */ }
    
    // Bonus
    public T kthSmallest(int k) { /* TODO: O(n) inorder */ }
    public T lowestCommonAncestor(T a, T b) { /* TODO: use BST property */ }
}
```

**JUnit Test Stub:**
```java
// JavaSolutions/ps/algo/BSTTest.java
class BSTTest {
    @Test void testInsertAndContains() {
        var bst = new BST<Integer>();
        bst.insert(5); bst.insert(3); bst.insert(7); bst.insert(1);
        assertTrue(bst.contains(3));
        assertFalse(bst.contains(9));
    }
    @Test void testInorderSorted() {
        var bst = new BST<Integer>();
        List.of(5,3,7,1,4,6,8).forEach(bst::insert);
        assertEquals(List.of(1,3,4,5,6,7,8), bst.inorder());
    }
    @Test void testDelete() {
        var bst = new BST<Integer>();
        List.of(5,3,7,1,4).forEach(bst::insert);
        bst.delete(3);
        assertFalse(bst.contains(3));
        assertEquals(List.of(1,4,5,7), bst.inorder());
    }
    @Test void testIsValid() {
        var bst = new BST<Integer>();
        List.of(5,3,7).forEach(bst::insert);
        assertTrue(bst.isValid());
    }
}
```

---

## Problem Set ALGO-PS2 — Heaps & Priority Queues

**Prerequisites:** `01f_Trees_Heaps.md` §5-7, `02b_Sorting_Advanced.md` §Heap Sort

---

### Part A: Theoretical

**A1 (Medium).** You have an unsorted array of n integers. Building a heap using repeated `insert` takes O(n log n). But `buildHeap` from an unordered array takes O(n). Explain why and prove the O(n) bound using the heap height argument.

<details><summary>Answer</summary>

**Repeated insert:** Each `insert` is O(log n). Doing n insertions = O(n log n).

**buildHeap (sift-down from n/2 to 0):**

At height `h`, there are at most `⌈n/2^(h+1)⌉` nodes, each requiring at most `h` sift-down operations.

Total work = `Σ(h=0 to log n) ⌈n/2^(h+1)⌉ × h`
= `O(n × Σ(h=0 to ∞) h/2^h)`
= `O(n × 2)` ← geometric series sum converges to 2
= **O(n)**

The reason: most nodes are at the bottom (height 0) and require 0 sift-down work. Only the root (height log n) requires log n work. The sum is dominated by the bottom levels.

🔴 **Erklärung:** Students try to prove this by saying "we call siftDown n/2 times." That is incomplete — you must account for the *different sift-down depths* at different levels. The geometric series argument is the rigorous proof.
</details>

---

**A2 (Hard).** Design a data structure that supports `insert(x)`, `getMin()`, `getMax()`, and `deleteMin()` all in O(log n). Describe its internal structure.

<details><summary>Answer</summary>

**Double-Ended Priority Queue (DEPQ) using two heaps:**

- **MinHeap** + **MaxHeap**, synchronized with cross-references.
- Each element has a pair: one node in MinHeap, one node in MaxHeap.
- `getMin()` → MinHeap root: O(1)
- `getMax()` → MaxHeap root: O(1)
- `insert(x)` → insert in both heaps, link the pair: O(log n)
- `deleteMin()` → extract from MinHeap, use cross-reference to delete partner from MaxHeap: O(log n)

Alternative: **MinMax Heap** — a single heap where even levels satisfy min-property, odd levels satisfy max-property.
</details>

---

### Part B: Implementation

**B2.** Implement a `MinHeap<T extends Comparable<T>>` from scratch using an array:

```java
// Skeleton — JavaSolutions/ps/algo/MinHeap.java
public class MinHeap<T extends Comparable<T>> {
    private List<T> heap = new ArrayList<>();
    
    public void insert(T val) {
        // TODO: add to end, siftUp
    }
    
    public T extractMin() {
        // TODO: swap root with last, remove last, siftDown from root
    }
    
    public T peek() { /* TODO */ }
    public int size() { return heap.size(); }
    public boolean isEmpty() { return heap.isEmpty(); }
    
    private void siftUp(int i) {
        // TODO: while i > 0 and heap[i] < heap[parent(i)]: swap, i = parent(i)
    }
    
    private void siftDown(int i) {
        // TODO: while left child exists, find min child, if min child < heap[i]: swap, i = minChild
    }
    
    private int parent(int i) { return (i - 1) / 2; }
    private int left(int i) { return 2 * i + 1; }
    private int right(int i) { return 2 * i + 2; }
}
```

---

## Problem Set ALGO-PS4 — Sorting

**Prerequisites:** `02a_Sorting_Fundamentals.md`, `02b_Sorting_Advanced.md`, `02c_Divide_And_Conquer.md`

---

### Part A: Theoretical

**A1 (Easy).** Fill in this complexity table from memory:

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Insertion Sort | ? | ? | ? | ? | ? |
| Merge Sort | ? | ? | ? | ? | ? |
| Quick Sort | ? | ? | ? | ? | ? |
| Heap Sort | ? | ? | ? | ? | ? |
| Counting Sort | ? | ? | ? | ? | ? |

<details><summary>Answer</summary>

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ No |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ Yes |

🔴 **Erklärung:** Students often think QuickSort worst case "never happens." It happens on already-sorted or reverse-sorted input with naive pivot selection. Java's `Arrays.sort()` uses dual-pivot Quicksort which statistically avoids this, but the theoretical worst remains O(n²).
</details>

---

**A2 (Hard).** Prove that any comparison-based sorting algorithm requires Ω(n log n) comparisons in the worst case. Use the decision tree argument.

<details><summary>Answer</summary>

**Decision Tree Argument:**

Any comparison-based sort can be modeled as a binary decision tree where each internal node is a comparison and each leaf is a permutation of the input.

For `n` elements, there are `n!` possible orderings, so the tree must have at least `n!` leaves.

A binary tree with `L` leaves has height ≥ ⌈log₂ L⌉.

Therefore, worst-case comparisons ≥ ⌈log₂(n!)⌉.

By Stirling's approximation: `log₂(n!) ≈ n log₂ n - n log₂ e = Ω(n log n)`

**Conclusion:** Any comparison-based sort needs Ω(n log n) comparisons. Merge Sort achieves this bound → it is asymptotically optimal. ∎

🔴 **Erklärung:** This is a lower bound proof, not an algorithm analysis. Students often confuse "prove sorting needs Ω(n log n)" with "analyze merge sort." The decision tree argument proves that NO comparison-based algorithm can do better, regardless of cleverness.
</details>

---

## Problem Set ALGO-PS5 — Binary Search & Greedy

---

### Part A: Theoretical

**A1 (Medium).** What invariant does binary search maintain? Write it as a formal statement and use it to prove correctness for searching in a sorted array.

<details><summary>Answer</summary>

**Invariant:** At every iteration, if the target exists, it lies within the range `[lo, hi]`.

**Proof:**
- *Init:* `lo=0, hi=n-1`. If target exists, it's in `a[0..n-1]` = `[lo, hi]`. ✓
- *Maintenance:* If `a[mid] < target`, target cannot be in `[lo, mid]` (sorted), so `lo = mid+1` preserves the invariant.
If `a[mid] > target`, `hi = mid-1` preserves it.
If `a[mid] == target`, we return it. ✓
- *Termination:* Loop terminates when `lo > hi`. If this happens without returning, target doesn't exist. ✓

🔴 **Erklärung:** The most common binary search bug is `while (lo < hi)` vs `while (lo <= hi)`. Using `<` causes you to miss when `lo == hi` — the last element never gets checked. Always use `<=` for standard search.
</details>

---

### Part B: Implementation

**B5.** Implement four binary search variants:

```java
// Skeleton — JavaSolutions/ps/algo/BinarySearch.java
public class BinarySearch {
    // Standard: return index of target, or -1
    public static int search(int[] a, int target) { /* TODO */ }
    
    // Lower bound: first index where a[i] >= target
    public static int lowerBound(int[] a, int target) { /* TODO */ }
    
    // Upper bound: first index where a[i] > target
    public static int upperBound(int[] a, int target) { /* TODO */ }
    
    // Search in rotated sorted array (no duplicates)
    public static int searchRotated(int[] a, int target) { /* TODO */ }
}
```

**JUnit Test Stub:**
```java
class BinarySearchTest {
    int[] a = {1, 3, 5, 5, 5, 7, 9};
    
    @Test void testSearch() { assertEquals(2, BinarySearch.search(a, 5)); } // or 3 or 4 — any valid
    @Test void testLowerBound() { assertEquals(2, BinarySearch.lowerBound(a, 5)); }
    @Test void testUpperBound() { assertEquals(5, BinarySearch.upperBound(a, 5)); }
    @Test void testNotFound() { assertEquals(-1, BinarySearch.search(a, 4)); }
    
    @Test void testSearchRotated() {
        int[] rotated = {4, 5, 6, 7, 0, 1, 2};
        assertEquals(4, BinarySearch.searchRotated(rotated, 0));
    }
}
```

---

## Problem Set ALGO-PS7 — Dynamic Programming

**Prerequisites:** `04a_DP_Internals.md`, `04b_DP_Fundamentals.md`, `04c_DP_Advanced.md`

---

### Part A: Theoretical

**A1 (Medium).** What are the two necessary properties for a problem to be solvable with DP? Give an example of a problem that has one but not the other, and explain why DP fails for it.

<details><summary>Answer</summary>

**Two properties:**
1. **Optimal Substructure:** The optimal solution to the problem contains optimal solutions to subproblems.
2. **Overlapping Subproblems:** The same subproblems are solved multiple times in naive recursion.

**Example without optimal substructure:** Longest Simple Path in a general graph. Subpaths of a longest path are NOT necessarily the longest paths between their endpoints (because cycles can exist). Greedy or DP fails — this is NP-hard.

**Example without overlapping subproblems:** Merge Sort. It has optimal substructure (sort halves optimally → whole array is sorted) but subproblems NEVER overlap (each element belongs to exactly one subproblem). There's nothing to memoize → it's Divide & Conquer, not DP.

🔴 **Erklärung:** Students think "any recursive problem can be memoized." Memoization only helps when the *exact same* subproblem is recomputed. If every recursive call is on a unique subproblem, memoization adds overhead with zero benefit.
</details>

---

**A2 (Hard).** Prove the optimal substructure of the 0/1 Knapsack problem.

<details><summary>Answer</summary>

**Claim:** Let `OPT(i, W)` = max value using items `{1..i}` with capacity `W`.

**Case 1:** Item `i` is NOT in the optimal solution. Then `OPT(i, W) = OPT(i-1, W)`.

**Case 2:** Item `i` IS in the optimal solution. Then the remaining capacity `W - weight[i]` must be filled optimally by items `{1..i-1}`. If not, we could swap in a better selection, contradicting optimality. So `OPT(i, W) = value[i] + OPT(i-1, W - weight[i])`.

**Recurrence:** `OPT(i, W) = max(OPT(i-1, W), value[i] + OPT(i-1, W - weight[i]))`

This satisfies optimal substructure because each case reduces to a smaller optimal subproblem. ∎

🔴 **Erklärung:** The proof requires the "exchange argument" — showing that if a subproblem isn't solved optimally, we can swap and get a better global solution, contradicting the assumption. Just stating the recurrence is not a proof of optimal substructure.
</details>

---

### Part B: Implementation

**B7.** Implement all three Knapsack variants:

```java
// Skeleton — JavaSolutions/ps/algo/Knapsack.java
public class Knapsack {
    // 0/1 Knapsack — each item used at most once
    public static int zeroOne(int[] weights, int[] values, int capacity) {
        // TODO: 2D DP table dp[i][w] = max value using first i items with capacity w
    }
    
    // Unbounded Knapsack — each item can be used unlimited times
    public static int unbounded(int[] weights, int[] values, int capacity) {
        // TODO: 1D DP array, iterate items in outer loop
    }
    
    // Bounded Knapsack — item i can be used at most count[i] times
    public static int bounded(int[] weights, int[] values, int[] counts, int capacity) {
        // TODO: binary splitting optimization or naive O(n*W*max_count)
    }
}
```

---

## Problem Set ALGO-PS8 — Graphs

**Prerequisites:** `05b_Graphs_Internals.md`, `05c_Graphs_Fundamentals.md`, `05d_Graphs_Advanced_Algos.md`

---

### Part A: Theoretical

**A1 (Medium).** When does BFS give the shortest path? When does it fail? What algorithm replaces it when BFS fails, and why?

<details><summary>Answer</summary>

**BFS gives shortest path when:** All edges have the same weight (unweighted graphs, or uniform-weight graphs). BFS explores nodes in order of hop count, guaranteeing the first time a node is reached is via the shortest hop path.

**BFS fails when:** Edges have different weights. BFS may reach a node via 1 hop with weight 100 before reaching it via 3 hops with total weight 3.

**Replacement:** **Dijkstra's algorithm** uses a min-priority queue keyed by accumulated distance. It greedily expands the node with the smallest known distance — this is correct only when all edge weights are non-negative.

**If negative edges:** Dijkstra fails (greedy assumption breaks). Use **Bellman-Ford** (O(VE)) or for small graphs, **SPFA**.

🔴 **Erklärung:** Students often use BFS on weighted graphs and get wrong answers. BFS is NOT "find any path quickly" — it is specifically "find the path with fewest edges." For weighted shortest paths, always use Dijkstra.
</details>

---

**A2 (Hard).** Prove that Dijkstra's algorithm is correct using the greedy invariant.

<details><summary>Answer</summary>

**Invariant:** When a node `u` is extracted from the priority queue, `dist[u]` is the true shortest path from source to `u`.

**Proof by contradiction:** Assume Dijkstra extracts `u` with incorrect `dist[u]`. Let `P` be the true shortest path `s → ... → u`.

Let `y` be the first unvisited node on `P`. Since `dist[y] ≤ dist_true(s→y) ≤ dist_true(s→u) < dist[u]` (true path is shorter, and y is on it), Dijkstra would have extracted `y` before `u`.

But `y` is unvisited — contradiction! So when `u` is extracted, `dist[u]` is correct. ∎

**Key assumption:** All edge weights ≥ 0. If negative edges exist, the path through a later node could be shorter, invalidating the greedy extraction order.
</details>

---

### Part B: Implementation

**B8.** Implement a complete Graph class with BFS, DFS, and Dijkstra:

```java
// Skeleton — JavaSolutions/ps/algo/Graph.java
import java.util.*;

public class Graph {
    private int V;
    private List<int[]>[] adj; // adj[u] = list of [v, weight]
    
    @SuppressWarnings("unchecked")
    public Graph(int V) {
        this.V = V;
        adj = new ArrayList[V];
        for (int i = 0; i < V; i++) adj[i] = new ArrayList<>();
    }
    
    public void addEdge(int u, int v, int w) { adj[u].add(new int[]{v, w}); }
    public void addEdgeUndirected(int u, int v, int w) {
        addEdge(u, v, w); addEdge(v, u, w);
    }
    
    // BFS — returns shortest hop distances from src
    public int[] bfs(int src) { /* TODO */ }
    
    // DFS — returns visited order
    public List<Integer> dfs(int src) { /* TODO */ }
    
    // Topological sort (DFS-based) — only for DAGs
    public List<Integer> topoSort() { /* TODO */ }
    
    // Dijkstra — returns shortest weighted distances from src
    public int[] dijkstra(int src) { /* TODO: use PriorityQueue<int[]> keyed on distance */ }
    
    // Detect cycle in directed graph
    public boolean hasCycle() { /* TODO: use DFS with WHITE/GRAY/BLACK coloring */ }
}
```

---

[← Back to Semester 1 Guide](../00_CURRICULUM/SEMESTER_1_GUIDE.md) | [DS Problem Sets ←](../02_Data_Structures/02_PROBLEM_SETS.md) | [Java Problem Sets →](../07_Modern_Java/07_PROBLEM_SETS.md)
