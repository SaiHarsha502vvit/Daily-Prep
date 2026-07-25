# 📝 Algorithms — Problem Sets

## `03_Algorithms` Module | MIT 6.006 / ETH Algorithms Style

### Historical Evolution

Problem sets as a teaching format for algorithm education trace back to **MIT's 6.006 (Introduction to Algorithms)** course, established in the 1970s and refined over decades by faculty including **Charles Leiserson, Erik Demaine, and Srini Devadas** — the course pioneered rigorous problem sets combining theoretical proof problems with programming implementations, establishing the standard model adopted by universities worldwide. **Donald Knuth's "The Art of Computer Programming" (Vol. 1, 1968)** established the tradition of exercises interspersed with algorithm exposition, blending mathematical reasoning with implementation challenges. **ETH Zurich's algorithm courses** (inspired by **Emil Kaufmann's work**) added the Erklärung (German: "explanation") format — a targeted diagnostic that tells students exactly where their mental model diverged from the correct reasoning, a pedagogical technique later adopted in competitive programming problem editors. **UVa Online Judge (1995)** and later **LeetCode (2009)** and **Kattis** established online judges as the primary platform for algorithm problem sets, replacing paper-based assignments with automated verification. Modern practice (post-2010) combines these traditions: LeetCode-style problems with detailed explanations, JUnit-compatible test harnesses, and structured Erklärung-style hints are now standard across coding bootcamps and university courses.

---

> **How to use:** Attempt every problem _before_ reading the answer. Implement Part B in `JavaSolutions/ps/algo/`. Run the JUnit stubs. Read 🔴 **Erklärung** if you fail — it tells you _exactly_ what went wrong in your mental model.

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

🔴 **Erklärung:** Students often confuse height with number of levels. Height = number of _edges_ on the longest root-to-leaf path. A single-node tree has height 0, not height 1.

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

**Key invariant:** Inorder traversal of a correct BST is a strictly increasing sequence. A swap creates exactly 1 or 2 _inversions_ (positions where `prev > current`).

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

🔴 **Erklärung:** Students try to prove this by saying "we call siftDown n/2 times." That is incomplete — you must account for the _different sift-down depths_ at different levels. The geometric series argument is the rigorous proof.

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

## Problem Set ALGO-PS3 — Recursion & Backtracking

**Prerequisites:** `03a_Recursion_Internals.md`, `03b_Recursion_Fundamentals.md`, `03c_Recursion_Advanced.md`, `11_Backtracking_Complete.md`

---

### Part A: Theoretical

**A1 (Medium).** Solve the recurrence `T(n) = 2T(n−1) + O(1)` with `T(0) = O(1)`, and explain why this shape appears in subset enumeration but `T(n) = 2T(n/2) + O(n)` appears in merge sort. What structural difference in the two problems produces the difference in the recurrences?

<details><summary>Answer</summary>

**Solving `T(n) = 2T(n−1) + c`:** unroll it.

```
T(n) = 2T(n−1) + c
     = 2(2T(n−2) + c) + c = 4T(n−2) + 3c
     = 8T(n−3) + 7c
     = 2^k · T(n−k) + (2^k − 1)c
```
At `k = n`: `T(n) = 2^n · T(0) + (2^n − 1)c` = **Θ(2ⁿ)**.

**The structural difference — this is the actual question:**

| | Subset enumeration | Merge sort |
| --- | --- | --- |
| Recurrence | `2T(n−1) + O(1)` | `2T(n/2) + O(n)` |
| Each call reduces n by | **1** (decides one element) | **half** (splits the input) |
| Depth | n | log n |
| Leaves | 2ⁿ | n |
| Result | Θ(2ⁿ) | Θ(n log n) |

The branching factor is 2 in **both**. The difference is entirely in **how much the input shrinks per level**. Subtracting 1 gives depth n; halving gives depth log n. With branching factor b and depth d, the leaf count is b^d — so `2^n` versus `2^(log n) = n`.

🔴 **Erklärung:** Students often conclude "two recursive calls means exponential." False. Two calls on *halved* input is Θ(n log n). Always read the recurrence as **(branching factor, reduction amount)** — it is the reduction, not the branching, that decides whether you get polynomial or exponential.

</details>

---

**A2 (Medium).** The Master Theorem does not apply to `T(n) = 2T(n−1) + O(1)`. State precisely why, and name the class of recurrences the Master Theorem covers.

<details><summary>Answer</summary>

The Master Theorem applies **only** to recurrences of the form `T(n) = a·T(n/b) + f(n)` with `a ≥ 1`, `b > 1` — that is, where the subproblem size is the input **divided** by a constant.

`T(n) = 2T(n−1) + O(1)` uses **subtraction**, not division, so it falls outside the theorem's form (equivalently: `b = 1` is not allowed, and there is no valid `log_b a`).

Subtractive recurrences `T(n) = a·T(n−b) + f(n)` are solved by unrolling (as in A1), by the substitution method, or by the "subtract-and-conquer" master theorem variant. The practical rule: **divide → Master Theorem; subtract → unroll.**

</details>

---

**A3 (Hard).** N-Queens with naive backtracking checks, at each placement, all previously placed queens for conflicts — O(n) per check. With column and diagonal *sets*, the check becomes O(1). Explain the diagonal indexing that makes this work, and prove that two cells `(r₁,c₁)` and `(r₂,c₂)` share a diagonal **iff** their index collides.

<details><summary>Answer</summary>

**Two diagonal families, two indices:**

- **↘ (top-left to bottom-right):** along this diagonal, `r − c` is constant. Use `r − c + (n−1)` as the index to shift the range into `[0, 2n−2]` (since `r − c ∈ [−(n−1), n−1]`).
- **↗ (top-right to bottom-left):** along this diagonal, `r + c` is constant, with `r + c ∈ [0, 2n−2]` already.

**Proof for the ↘ family.** Two cells lie on the same ↘ diagonal iff moving from one to the other changes row and column by the *same signed amount*: `r₂ − r₁ = c₂ − c₁`. Rearranging: `r₂ − c₂ = r₁ − c₁`. So same-diagonal ⟺ equal `r − c` ⟺ equal index. ∎

The ↗ case is symmetric: same anti-diagonal iff `r₂ − r₁ = −(c₂ − c₁)`, i.e. `r₂ + c₂ = r₁ + c₁`. ∎

**Why this matters for cost:** with three boolean arrays (`cols`, `diag1`, `diag2`), the legality test at each placement is three array reads — O(1) instead of O(n). Total work drops from O(n) per node to O(1) per node, and — more importantly — **the pruning happens before recursing**, so entire subtrees are never generated.

🔴 **Erklärung:** The speedup here is *not* mainly the O(n)→O(1) check. It is that constant-time legality makes aggressive early pruning cheap enough to always do, which cuts the *number of nodes explored* by orders of magnitude. Cheap checks enable pruning; pruning is what makes exponential search tractable.

</details>

---

**A4 (Hard).** Every recursive algorithm can be converted to an iterative one with an explicit stack. Give a case where you **must** do this conversion in production, and explain what the explicit stack must hold that the call stack held implicitly.

<details><summary>Answer</summary>

**When you must:** when recursion depth can exceed the runtime's stack. The JVM default thread stack is ~512 KB–1 MB, giving roughly 5,000–10,000 frames. A DFS over a 100,000-node path-shaped graph, or recursion over a degenerate (linked-list-shaped) BST, will `StackOverflowError` — and note that Java, unlike Scheme or Scala's `@tailrec`, does **not** perform tail-call optimization, so even tail-recursive code overflows.

**What the explicit stack must hold** — this is the part people get wrong. The call stack implicitly stores, per frame:
1. the **arguments** (which node / index we are at),
2. the **local variables** still needed after the recursive call returns,
3. the **return address** — i.e. *which part of the function body to resume*.

Item 3 is the subtle one. For a single recursive call you can ignore it, but for multi-call recursion (in-order traversal: recurse left, *visit*, recurse right) the iterative version must encode "have I already done the left subtree?" — usually as an explicit state flag pushed with the node, or by pushing nodes in a carefully reversed order.

```java
// In-order traversal, iterative. The 'goLeft' phase encodes the return address.
void inorder(Node root) {
    Deque<Node> stack = new ArrayDeque<>();
    Node cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; } // descend left
        cur = stack.pop();
        visit(cur);                                             // resume point
        cur = cur.right;
    }
}
```

</details>

---

### Part B: Implementation

**B1.** Implement N-Queens with O(1) conflict checking using the A3 indexing. Return all distinct solutions.

```java
// Skeleton — JavaSolutions/ps/algo/NQueens.java
public class NQueens {
    private int n;
    private boolean[] cols, diag1, diag2;   // diag1: r-c+(n-1), diag2: r+c
    private int[] placement;                 // placement[row] = col
    private List<List<String>> solutions = new ArrayList<>();

    public List<List<String>> solve(int n) {
        this.n = n;
        cols  = new boolean[n];
        diag1 = new boolean[2 * n - 1];
        diag2 = new boolean[2 * n - 1];
        placement = new int[n];
        backtrack(0);
        return solutions;
    }

    private void backtrack(int row) {
        // TODO: if row == n -> record solution, return
        // TODO: for each col: if legal(row,col) -> place, recurse(row+1), UNPLACE
        //       NOTE: the unplace must mirror the place EXACTLY (all three arrays)
    }

    private boolean legal(int r, int c) {
        // TODO: three O(1) reads
        return false;
    }
}
```

**B2.** Implement `permutationsWithDuplicates(int[] nums)` returning each distinct permutation exactly once. **Do not deduplicate the output** — prevent duplicates at the decision level.

```java
// Skeleton — JavaSolutions/ps/algo/PermutationsDedup.java
public class PermutationsDedup {
    public List<List<Integer>> permute(int[] nums) {
        Arrays.sort(nums);                       // REQUIRED: makes equals adjacent
        List<List<Integer>> out = new ArrayList<>();
        backtrack(nums, new boolean[nums.length], new ArrayList<>(), out);
        return out;
    }

    private void backtrack(int[] nums, boolean[] used,
                           List<Integer> path, List<List<Integer>> out) {
        // TODO: base case — path.size() == nums.length -> add a COPY
        // TODO: for i in 0..n-1:
        //   skip if used[i]
        //   THE DEDUP GUARD: skip if i > 0 && nums[i] == nums[i-1] && !used[i-1]
        //   choose -> recurse -> UNCHOOSE
    }
}
```

**The guard is the whole exercise.** Write out, for `[1,1,2]`, why `!used[i-1]` (rather than `used[i-1]`) is the correct condition — trace both and see which one produces duplicates.

---

### Part C: Challenge (Design)

**C1.** You are given a Sudoku solver that uses plain backtracking and is too slow on hard puzzles. Design **two** pruning improvements, state the invariant each preserves, and predict which gives the larger speedup and why.

<details><summary>Answer sketch</summary>

**Improvement 1 — constraint sets (the A3 move).** Maintain `rowUsed[9][10]`, `colUsed[9][10]`, `boxUsed[9][10]`. Legality becomes three O(1) reads instead of a 27-cell scan. *Invariant:* each set exactly reflects the digits currently placed in that row/column/box; every place must have a mirrored unplace.

**Improvement 2 — most-constrained-variable (MCV) ordering.** Instead of filling cells left-to-right, always fill the empty cell with the **fewest legal candidates** next. *Invariant:* unchanged — this reorders exploration, it does not change what is legal.

**Which wins:** MCV, by a wide margin. Improvement 1 reduces the cost *per node* by a constant factor (~27×). MCV reduces the **number of nodes** — it fails early, near the root, instead of deep in a doomed subtree, which prunes exponentially large regions. A cell with 1 candidate is forced (no branching at all); a cell with 9 candidates branches 9 ways.

**The general principle:** constant-factor-per-node improvements are linear wins; branching-factor and pruning improvements are exponential wins. In exponential search, always attack the tree size before the node cost.

</details>

---

## Problem Set ALGO-PS4 — Sorting

**Prerequisites:** `02a_Sorting_Fundamentals.md`, `02b_Sorting_Advanced.md`, `02c_Divide_And_Conquer.md`

---

### Part A: Theoretical

**A1 (Easy).** Fill in this complexity table from memory:

| Algorithm      | Best | Average | Worst | Space | Stable? |
| -------------- | ---- | ------- | ----- | ----- | ------- |
| Insertion Sort | ?    | ?       | ?     | ?     | ?       |
| Merge Sort     | ?    | ?       | ?     | ?     | ?       |
| Quick Sort     | ?    | ?       | ?     | ?     | ?       |
| Heap Sort      | ?    | ?       | ?     | ?     | ?       |
| Counting Sort  | ?    | ?       | ?     | ?     | ?       |

<details><summary>Answer</summary>

| Algorithm      | Best       | Average    | Worst      | Space    | Stable? |
| -------------- | ---------- | ---------- | ---------- | -------- | ------- |
| Insertion Sort | O(n)       | O(n²)      | O(n²)      | O(1)     | ✅ Yes  |
| Merge Sort     | O(n log n) | O(n log n) | O(n log n) | O(n)     | ✅ Yes  |
| Quick Sort     | O(n log n) | O(n log n) | O(n²)      | O(log n) | ❌ No   |
| Heap Sort      | O(n log n) | O(n log n) | O(n log n) | O(1)     | ❌ No   |
| Counting Sort  | O(n+k)     | O(n+k)     | O(n+k)     | O(k)     | ✅ Yes  |

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

- _Init:_ `lo=0, hi=n-1`. If target exists, it's in `a[0..n-1]` = `[lo, hi]`. ✓
- _Maintenance:_ If `a[mid] < target`, target cannot be in `[lo, mid]` (sorted), so `lo = mid+1` preserves the invariant.
  If `a[mid] > target`, `hi = mid-1` preserves it.
  If `a[mid] == target`, we return it. ✓
- _Termination:_ Loop terminates when `lo > hi`. If this happens without returning, target doesn't exist. ✓

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

## Problem Set ALGO-PS6 — Strings & Greedy

**Prerequisites:** `06d_String_Algorithms.md`, `13_String_Algorithms_Complete.md`, `12_Greedy_Algorithms_Complete.md`, `06a_Greedy_BitManip.md`

---

### Part A: Theoretical

**A1 (Medium).** Naive substring search is O(n·m). KMP is O(n+m). The saving comes entirely from **never re-examining a text character**. Explain what the failure function stores and why it lets the text pointer advance monotonically.

<details><summary>Answer</summary>

**The failure function** `f[i]` = the length of the longest proper prefix of `pattern[0..i]` that is also a suffix of `pattern[0..i]`. ("Proper" = not the whole thing.)

For `pattern = "ababaca"`:

| i | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| char | a | b | a | b | a | c | a |
| f[i] | 0 | 0 | 1 | 2 | 3 | 0 | 1 |

**Why the text pointer never moves backward.** Suppose we have matched `pattern[0..j-1]` against `text[i-j..i-1]` and then `text[i] ≠ pattern[j]`. The naive algorithm restarts at `text[i-j+1]` — re-reading characters it already examined.

But we *already know* what those characters are: they equal `pattern[0..j-1]`. The longest prefix of the pattern that could still be alive is the longest prefix of `pattern[0..j-1]` that is also a suffix of it — which is exactly `f[j-1]`. So we set `j = f[j-1]` and **keep `i` where it is**. The text pointer only ever advances.

**Complexity, by amortization.** `i` advances at most n times. `j` increases by at most 1 per text character (so ≤ n total increases) and each failure-jump strictly decreases `j`. Since `j` never goes below 0, total decreases ≤ total increases ≤ n. Hence O(n) for the search plus O(m) to build the table = **O(n+m)**. ∎

🔴 **Erklärung:** This is the same amortized argument as the sliding window and cyclic sort ([A2 Complexity](A2_Complexity_FirstPrinciples.md)): *a quantity that only increases n times total bounds the work, even though a single step may do many decrements.* Recognizing the shared shape is more valuable than memorizing KMP.

</details>

---

**A2 (Medium).** Prove that the interval-scheduling greedy (**always take the interval with the earliest finish time**) is optimal, using an exchange argument. Then show that "earliest start time" is *not* optimal by constructing the smallest counterexample.

<details><summary>Answer</summary>

**Exchange argument for earliest-finish.** Let `G = g₁, g₂, …` be greedy's choices in order and `O = o₁, o₂, …` any optimal solution, both sorted by finish time. Suppose they agree on the first `k−1` and differ at `k`. Greedy always picks the compatible interval with the earliest finish, so `finish(g_k) ≤ finish(o_k)`.

Replace `o_k` with `g_k` in `O`. Feasibility holds: `g_k` starts after `o_{k−1}` finishes (greedy only considers compatible intervals) and finishes no later than `o_k`, so it cannot conflict with `o_{k+1}`. The size of `O` is unchanged. Repeating drives `O` to `G` without ever shrinking it, so `|G| = |O|`. ∎

**Counterexample for earliest-start (2 intervals is enough):**
```
A: [0, 100]      ← earliest start, chosen by the wrong greedy
B: [1, 2]
C: [3, 4]
```
Earliest-start picks A and is then blocked: **1 interval**. Earliest-finish picks B, then C: **2 intervals**.

**Why the exchange fails for earliest-start:** the argument needs `finish(g_k) ≤ finish(o_k)` to guarantee the swap does not conflict with what follows. Earliest-start gives no bound on the finish time at all — a single long interval consumes the whole remaining timeline.

**The transferable lesson:** the greedy *rule* is right only because the exchange argument closes for that specific rule. Change the rule, and the proof — not just the performance — breaks.

</details>

---

**A3 (Hard).** Huffman coding is greedy: repeatedly merge the two lowest-frequency nodes. Prove the **greedy-choice property** — that some optimal prefix code merges the two lowest-frequency symbols as siblings at the deepest level.

<details><summary>Answer</summary>

**Claim.** Let `x, y` be the two symbols of lowest frequency. There exists an optimal prefix code in which `x` and `y` are siblings at maximum depth.

**Proof (exchange).** Take any optimal tree `T`. Let `a, b` be two siblings at maximum depth (they exist: in an optimal prefix-code tree every internal node has two children, so the deepest level contains a sibling pair). Assume WLOG `freq(a) ≤ freq(b)` and `freq(x) ≤ freq(y)`.

Since `x, y` have the two smallest frequencies, `freq(x) ≤ freq(a)` and `freq(y) ≤ freq(b)`.

Swap `x` with `a`, producing `T'`. The change in cost is:
```
cost(T) − cost(T') = (freq(a) − freq(x)) · (depth(a) − depth(x))
```
Both factors are ≥ 0 — the first because `x` is minimal, the second because `a` is at maximum depth. So `cost(T') ≤ cost(T)`. Since `T` was optimal, `T'` is optimal too.

Swap `y` with `b` in `T'` by the identical argument, giving `T''` which is optimal and has `x, y` as siblings at maximum depth. ∎

**Plus optimal substructure:** after merging `x, y` into a node `z` with `freq(z) = freq(x)+freq(y)`, an optimal code for the reduced alphabet extends to an optimal code for the original. Greedy-choice property + optimal substructure = greedy is correct.

🔴 **Erklärung:** Note that a *complete* greedy proof has **two** parts. The greedy-choice property says "the first greedy pick is safe"; optimal substructure says "the rest of the problem is a smaller instance of the same problem." Proving only the first is the most common gap in student greedy proofs.

</details>

---

**A4 (Medium).** Give a problem where greedy looks obviously right and is wrong, and identify the structural property it lacks.

<details><summary>Answer</summary>

**0/1 Knapsack with the highest value/weight ratio first.**

```
Capacity = 10
Item A: value 60, weight 10  → ratio 6.0
Item B: value 50, weight 6   → ratio 8.33   ← greedy picks this
Item C: value 20, weight 4   → ratio 5.0
```
Greedy: B (50, uses 6), then C fits (20, uses 4) → **70**.
Optimal: A alone → **60**? No — greedy wins here. Now change it:

```
Capacity = 10
Item A: value 60, weight 10  → ratio 6.0
Item B: value 50, weight 7   → ratio 7.14   ← greedy picks this
Item C: value 5,  weight 3   → ratio 1.67
```
Greedy: B (50), then C fits (5) → **55**. Optimal: A alone → **60**. Greedy loses.

**The missing property: the exchange argument does not close.** For *fractional* knapsack it does — you can always swap in a fraction of the higher-ratio item, so greedy is provably optimal. For **0/1**, items are indivisible: swapping in a higher-ratio item may leave a hole you cannot fill, and the exchange step is not guaranteed non-worsening.

The indivisibility is exactly what breaks it — and it is why 0/1 knapsack needs DP while fractional knapsack does not.

</details>

---

### Part B: Implementation

**B1.** Implement the KMP failure function and search.

```java
// Skeleton — JavaSolutions/ps/algo/KMP.java
public class KMP {

    // f[i] = length of longest proper prefix of p[0..i] that is also a suffix
    static int[] buildFailure(String p) {
        int[] f = new int[p.length()];
        int k = 0;                       // length of current candidate border
        for (int i = 1; i < p.length(); i++) {
            // TODO: while k > 0 && p.charAt(i) != p.charAt(k): k = f[k-1]
            // TODO: if p.charAt(i) == p.charAt(k): k++
            // TODO: f[i] = k
        }
        return f;
    }

    static List<Integer> search(String text, String pattern) {
        // TODO: build failure table, then scan text with i never decreasing
        //       on mismatch: j = f[j-1] (or i++ if j == 0)
        //       on full match: record i - m + 1, then j = f[j-1] to allow overlaps
        return new ArrayList<>();
    }
}
```

**B2.** Implement interval scheduling (A2) and Huffman coding (A3).

```java
// Skeleton — JavaSolutions/ps/algo/GreedyPair.java
public class GreedyPair {

    // Maximum number of mutually non-overlapping intervals
    static int maxNonOverlapping(int[][] intervals) {
        // TODO: sort by FINISH time (intervals[i][1]) — the proof depends on this
        // TODO: track lastFinish; count an interval iff start >= lastFinish
        return 0;
    }

    // Build the Huffman tree; return the code length per symbol
    static Map<Character, Integer> huffmanCodeLengths(Map<Character, Integer> freq) {
        // TODO: PriorityQueue<Node> by frequency (min-heap)
        // TODO: while size > 1: pop two, merge into a parent, push back
        // TODO: walk the tree, recording depth per leaf
        return new HashMap<>();
    }
}
```

---

### Part C: Challenge (Design)

**C1.** A log-ingestion service must detect whether any of **10,000 known bad patterns** appears in each incoming 1 MB log line batch. Running KMP once per pattern is O(k·(n+m)) — 10,000 passes over the text. Design something better, and state its complexity.

<details><summary>Answer sketch</summary>

**Aho–Corasick** — the multi-pattern generalization of KMP.

1. Build a **trie** of all 10,000 patterns.
2. Add **failure links** to the trie: from each node, a link to the node representing the longest proper suffix of the current prefix that is also a prefix of some pattern. (This is exactly KMP's failure function, generalized from one string to a trie.)
3. Scan the text **once**, walking the automaton; follow failure links on mismatch, and report every pattern-terminal node reached.

**Complexity:** O(Σ|patterns|) to build + **O(n + matches)** to scan — one pass over the text regardless of pattern count, versus O(k·n) for repeated KMP.

**The design-loop reading of this** ([Algo A5 §1.2](A5_Designing_Your_Own_Algorithms.md)): the repeated work in the naive approach is *"scans over the same range"* — 10,000 passes over the same text. The structural property that permits eliminating them: all patterns can share the *same* automaton state, because at any text position the set of alive pattern-prefixes is determined by the suffix seen so far. That is the whole invention.

**Practical note:** this is what `grep -F -f patterns.txt`, most WAF rule engines, and virus scanners actually run.

</details>

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

🔴 **Erklärung:** Students think "any recursive problem can be memoized." Memoization only helps when the _exact same_ subproblem is recomputed. If every recursive call is on a unique subproblem, memoization adds overhead with zero benefit.

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

---

## Proof Corner -- Algorithm Problem-Solving Correctness

**Exchange Argument Template** (for greedy correctness proofs):

1. Assume OPT is an optimal solution that differs from Greedy on some step k.
2. Show you can swap the greedy choice at step k into OPT without decreasing the objective.
3. Repeat until OPT has been transformed into Greedy, step by step.
4. Conclude Greedy is also optimal.

**Example -- Activity Selection**: Greedy picks the activity with the earliest finish time. Suppose OPT picks activity b instead of a (where finish(a) <= finish(b)). Swap b for a: a finishes no later than b, so all subsequent activities still fit. OPT with a is no worse. QED.

**Reduction correctness template**: To prove algorithm A solves problem P:
1. Define a reduction f: P -> Q (transform P-instance to Q-instance).
2. Show correctness: x is a YES for P if and only if f(x) is a YES for Q.
3. Show efficiency: f runs in polynomial time.

---

## When It Breaks -- Problem-Solving Strategy

**1. Wrong problem model** -- the most common interview failure. "Minimum number of jumps" sounds like greedy but the wrong model (DFS) produces wrong answers. Always verify: is the problem asking for shortest PATH (BFS), minimum COST (DP), or minimum COUNT (DP)?

**2. Greedy without proof** -- applying greedy intuition without verifying the exchange argument. Common failure: "sort by size" for interval covering -- this fails when longer intervals cover more critical positions. Always ask: what property am I optimising, and why does greedy choice not harm future options?

**3. O(n^2) nested loop accepted for n=10^5** -- missing that the constraint n <= 10^5 with 1-second time limit means O(n log n) at most. A naive O(n^2) solution will TLE. Rule: always estimate operation count from constraints before coding.

**4. Off-by-one in recurrence base cases** -- forgetting dp[0] for "empty prefix" in string DP, or starting BFS from the wrong node. These are silent errors that produce answers off by 1 for specific inputs.

---

## Reference Anchor

**Java competitive programming patterns**:
```java
// Fast I/O (Scanner is ~10x slower than BufferedReader for large inputs):
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer st = new StringTokenizer(br.readLine());
int n = Integer.parseInt(st.nextToken());

// StringBuilder beats println for many outputs:
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) sb.append(result[i]).append("
");
System.out.print(sb);

// Overflow-safe comparator (avoid a - b for Integer comparisons):
Arrays.sort(arr, Comparator.comparingInt(x -> x)); // safe, no overflow
// NOT: (a, b) -> a - b  (overflows when a = Integer.MIN_VALUE, b > 0)
```

