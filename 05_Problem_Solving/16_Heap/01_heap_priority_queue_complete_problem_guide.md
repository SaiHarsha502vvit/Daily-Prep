# 16. Heap / Priority Queue — Complete Problem Guide

> **Navigation**: [Chapter overview](../16_Heap.md) | [Easy Problems →](02_easy_problems.md)
> Page 1 of 3 in **Heap**


HEAP / PRIORITY QUEUE MASTERY GUIDE
From Theory to Hard Problems — MIT/KTH Academic Style
Part 0: Theory & Internals │ Part 1: Easy (5 problems)
Part 2: Medium (10 problems) │ Part 3: Hard (5 problems)
Part 4: Cheat Sheet & Decision Tree │

---

## PART 0: THEORY — Heap Internals (MIT/KTH Style)

WHY HEAPS EXIST
Fundamental question: How do we efficiently track the min or max of a
dynamic collection where elements are inserted and removed?

Sorted array? Insert is O(n).
Unsorted array? Extract-min is O(n).
BST? O(log n) but can degrade to O(n).
Heap? O(log n) insert, O(log n) extract, O(1) peek. WINNER.

### Why a Complete Binary Tree Stored in an Array?

A **heap** is a **complete binary tree** satisfying the **heap property**:

- **Min-Heap**: every parent ≤ its children → root is the minimum
- **Max-Heap**: every parent ≥ its children → root is the maximum

**Why complete binary tree?** A complete binary tree has no "holes" — every level is fully filled except possibly the last, which is filled left-to-right. This gives us a critical property: **we can store it in a contiguous array with zero wasted space and zero pointer overhead**.

**Why array storage?** Because for a node at index `i`:

- **Parent** = `(i - 1) / 2` (integer division)
- **Left child** = `2 * i + 1`
- **Right child** = `2 * i + 2`

This is pure arithmetic — no pointers, no `node.left`/`node.right`. Cache-friendly, memory-efficient.

```
           10                Array: [10, 15, 30, 40, 50, 100, 40]
          /  \               Index:  [0]  [1] [2] [3] [4]  [5] [6]
        15    30
       / \   /  \            Parent of index 4 = (4-1)/2 = 1 → value 15 ✓
      40  50 100  40         Children of index 1 = 2*1+1=3, 2*1+2=4 → 40, 50 ✓
```

### How Heapify Works (Sift-Up and Sift-Down)

**Sift-Up (used in insert):**

```
Insert 5 into min-heap [10, 15, 30, 40, 50]:

Step 1: Place at end          Step 2: 5 < 30? Swap        Step 3: 5 < 10? Swap
     10                            10                            5
    /  \                          /  \                          / \
  15    30          →           15    5            →          15   10
 / \   /                      / \   /                       / \   /
40  50 5                     40  50 30                     40  50 30

Array: [10,15,30,40,50,5]   [10,15,5,40,50,30]          [5,15,10,40,50,30]
```

**Sift-Down (used in extract-min):**

```
Extract min from [5, 15, 10, 40, 50, 30]:

Step 1: Replace root with last    Step 2: 30 > min(15,10)? Swap with 10
        30                                 10
       /  \                               /  \
     15    10                →          15    30
    / \                                / \
   40  50                             40  50

Array: [30,15,10,40,50]            [10,15,30,40,50]    ✓ Heap restored!
```

### Time Complexities

| Operation          | Time     | Why                                       |
| ------------------ | -------- | ----------------------------------------- |
| `peek()`           | O(1)     | Root is always min/max                    |
| `insert()`         | O(log n) | Sift-up at most tree height = log n       |
| `extractMin/Max()` | O(log n) | Sift-down at most tree height = log n     |
| `heapify(array)`   | **O(n)** | NOT O(n log n)! Bottom-up construction    |
| `remove(obj)`      | **O(n)** | Must linear-scan to find, then sift       |
| `contains(obj)`    | **O(n)** | No ordering guarantee beyond parent-child |

**Why heapify is O(n), not O(n log n):**
Bottom-up construction: most nodes are leaves (n/2 nodes), which need 0 sifts. Only 1 node (root) needs log n sifts. Sum of work = O(n) by geometric series argument.

### Java PriorityQueue Internals

```java
// ⚠️ CRITICAL: Java PriorityQueue is a MIN-HEAP by default!
PriorityQueue<Integer> minHeap = new PriorityQueue<>();          // Min-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder()); // Max-heap
// OR: new PriorityQueue<>((a, b) -> b - a)  // Max-heap via lambda

// Key methods:
minHeap.offer(x);       // Insert — O(log n)
minHeap.poll();          // Extract min — O(log n)
minHeap.peek();          // See min — O(1)
minHeap.remove(obj);     // Remove specific — O(n) ← TRAP!
minHeap.size();          // O(1)
minHeap.contains(obj);   // O(n)

// Iterator does NOT return elements in sorted order!
// PQ only guarantees heap property, not full sort.
```

### Common Mistakes (MUST KNOW)

**⚠️  COMMON HEAP MISTAKES  ⚠️**

```text
1. Java PQ is MIN-HEAP by default
   → If you need max, use Comparator.reverseOrder() or (a,b) -> b - a

2. Forgetting custom comparator for max-heap objects
   → new PriorityQueue<int[]>((a,b) -> b[0] - a[0]) for max on first elem

3. PQ.remove(obj) is O(n), not O(log n)!
   → It does a linear scan to find the element first
   → If you need fast removal, consider TreeMap or lazy deletion

4. Iterator order is NOT sorted!
   → for (int x : pq) does NOT give elements in heap order
   → You must poll() repeatedly to get sorted order

5. Integer overflow in comparators: (a, b) -> a - b can overflow!
   → Use Integer.compare(a, b) instead for safety

6. Using heap when a simpler approach works
   → "Top K" with fixed small K? Sorting may be simpler and same O(n lg n)
   → "Sliding window max"? Monotonic deque is O(n) vs heap O(n log n)

7. Not recognizing the two-heap pattern for median problems
   → maxHeap for lower half + minHeap for upper half = O(log n) median
```

---

🔬 **Section Challenge — Heap Theory & Internals**

**Challenge 1 (Reasoning):** A min-heap stores `[2, 5, 3, 8, 7, 6]` in array form. Trace the heapify process on index 1 (value 5) manually.

<details><summary>Answer</summary>

Index 1 (value 5): left child = index 3 (value 8), right child = index 4 (value 7). Min of children = index 4 (value 7). 5 < 7, so no swap needed. Heap property satisfied at index 1. If value was 9 instead: 9 > 7 → swap(index1=9, index4=7) → recurse at index 4.

</details>

**Challenge 2 (Reasoning):** `new PriorityQueue<>()` in Java is a min-heap. You need a max-heap. Write the exact declaration AND explain why `Collections.reverseOrder()` works.

<details><summary>Answer</summary>

`PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());` or `new PriorityQueue<>((a,b) -> b - a)`. Why reverseOrder works: the heap's internal comparisons use the comparator. Reversing the order makes what was "smaller" (min-heap sink) behave as "larger" — the root becomes the maximum element. The underlying array storage and sift operations are unchanged; only the comparison direction flips.

</details>

**Challenge 3 (Design):** Why is building a heap from N elements O(N) but inserting N elements one by one O(N log N)? Where's the mathematical difference?

<details><summary>Answer</summary>

**Bottom-up heapify**: work per node = height of that node. Nodes at height 0 (leaves, N/2 nodes): 0 work. Nodes at height 1 (N/4 nodes): 1 comparison. Height h: N/2^(h+1) nodes × h work. Total = Σ h×N/2^(h+1) = N (geometric series converges to 2). **N insertions**: each insertion sifts UP from a leaf to root = O(log N) worst case. N × log N total. The bottom-up builds from the middle of the array downward — most nodes are near the bottom where sift-down work is minimal.

</details>

---

[Chapter overview](../16_Heap.md) | [Easy Problems →](02_easy_problems.md)
