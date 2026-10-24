# 🧩 Heap + Greedy Selection — Pattern Guide

> **Navigation**: [← Graph + Traversal](14_Graph_Plus_Traversal.md) | [Chapter index](00_INDEX.md) | [DP Pattern Recognition →](16_DP_Pattern_Recognition.md)

## Heap + Greedy Selection — Combined Pattern Guide

**WHY this combination?** Heaps give O(log n) access to the min/max element. Combined with greedy strategy (always pick the best available), they solve "Top K", "merge K sorted", and scheduling problems efficiently.

### ⚠️ Constraint Lens

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Heaps](../02_Data_Structures/01f_Trees_Heaps.md), [Greedy](../03_Algorithms/12_Greedy_Algorithms_Complete.md) |
| **You will learn** | Top-K with a bounded heap, merge K sorted lists, scheduling, median from a stream with two heaps |
| **Leads to** | [Two Heaps & Top-K](31_Top_K_And_Two_Heaps_Pattern.md), [Intervals](21_Intervals_Pattern.md) |
| **Abstraction level** | Repeated min/max scans → **a priority queue** → always take the best available |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Heap + Greedy Selection

### 1. The bottom line

When the next best choice is always "the smallest/largest remaining", a heap gives it in `O(log n)`.

### 2. The textbook core

- Top-K largest: keep a **min-heap of size K**; the root is the K-th largest.
- Merge K sorted lists: heap of heads.
- Greedy scheduling: heap of available tasks by priority/deadline.
- Median stream: max-heap for the lower half, min-heap for the upper half.

### 3. The real-world analogy

An **emergency-room triage desk**: whoever is most urgent is served next, no matter when they arrived.

### 4. Walkthrough

1. Find the 2nd largest in `[3,2,1,5,6,4]` with a min-heap of size 2.
2. Push 3 and 2 → heap `{2,3}`; see 1: smaller than the root 2, skip.
3. See 5: bigger than the root → pop 2, push 5 → `{3,5}`; see 6 → pop 3, push 6 → `{5,6}`; see 4: smaller than the root 5, skip.
4. The root, 5, is the 2nd largest.

> [!NOTE]
> **Quick check:** Why a min-heap for the K largest? *Its root is the weakest of the K kept, the one to evict.*


### 5. Check yourself

**Q1.** Which heap do you use to keep the K largest elements?

<details><summary>Answer</summary>

A min-heap of size K; its root is the smallest of the K and the one to evict.

</details>

**Q2.** Merge 3 sorted lists with `n` elements in total. What is the cost with a heap?

<details><summary>Answer</summary>

`O(n log 3) = O(n log k)` for `k` lists.

</details>

**Q3.** Running median of `5, 15, 1, 3`?

<details><summary>Answer</summary>

After each insert: 5, 10, 5, **4**.

</details>

---

## Historical Evolution

**Inventor / Originator:** J. W. J. Williams published the binary heap with heapsort in 1964 (ACM Algorithm 232); Robert Floyd's *Treesort 3* (ACM Algorithm 245, 1964) added the linear-time bottom-up heap construction. The greedy algorithms that use heaps are older: Huffman coding (1952), Kruskal (1956), Prim (1957, after Jarník 1930) and Dijkstra (1959).

**Predecessor context:** Priority queues were sorted lists or arrays with `O(n)` insertion or removal.

**Evolution narrative:** Heaps give `O(log n)` insert and extract-min, making greedy "pick the best available" loops efficient. Fredman and Tarjan's Fibonacci heaps (1984) improved Dijkstra's bound to `O(E + V log V)`.

**Modern practice:** `PriorityQueue` (Java), `heapq` (Python) and `priority_queue` (C++) are binary heaps; they power schedulers, Top-K selection, k-way merges and Dijkstra.

- **Huffman — 1952**: Optimal prefix codes with a greedy merge of the two lightest trees
- **Williams — 1964**: Binary heap and heapsort
- **Floyd — 1964**: Linear-time heap construction
- **Fredman & Tarjan — 1984**: Fibonacci heaps

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **PriorityQueue.remove(Object) is O(n), not O(log n) — use decrease-key or indexed heap** — Java's `PriorityQueue.remove(Object)` performs linear search before removal, making it O(n). This defeats the purpose of using a heap. Detection: test with 100,000 elements and repeated removals; profile the operation count.

- **Max-heap overflow on Integer.MAX_VALUE + 1** — When computing `max - min` or similar operations on values near Integer.MAX_VALUE, overflow wraps to negative. Detection: test with values at extreme range (e.g., `Integer.MAX_VALUE - 5`).

- **Greedy fails when local optimum ≠ global (e.g., fractional knapsack works but 0/1 doesn't)** — Greedy works for fractional knapsack but produces wrong answers for 0/1 knapsack. The same pattern name hides different algorithms. Detection: verify problem statement explicitly; if items cannot be fractional, use DP.

- **Heap ordering reversed for min vs max** — Forgetting to negate values when switching between min-heap and max-heap produces completely inverted results. Detection: test with `[1, 5, 3]` — max should return 5, min should return 1.

**Production Selection Heuristic:** Use heap when you need repeated min/max extraction. For decrease-key operations, use indexed heap or TreeMap. Verify greedy correctness proof exists before applying greedy to optimization problems.

---

| Given Constraints          | Do This                                  |
| -------------------------- | ---------------------------------------- |
| top `K`, `K << N`          | heap of size `K`                         |
| exact kth in static array  | quickselect can be faster average `O(N)` |
| streaming median           | two heaps                                |
| repeatedly choose min/max  | priority queue                           |
| need remove arbitrary item | TreeMap/multiset or lazy deletion        |
| greedy choice lacks proof  | switch to DP/search                      |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

## 🧠 Deep Intuition — Heaps and Greedy Correctness

### Why Heaps Give O(log n) Insert/Extract

A heap is a **complete binary tree** stored in an array. "Complete" means every level is fully filled except possibly the last, which is filled left-to-right. The heap property (min-heap: parent ≤ children; max-heap: parent ≥ children) means the root always holds the extreme value. Insert and extract require "bubbling" up or down through the tree height, which is O(log n) since a complete binary tree has height ⌊log₂ n⌋.

### Why Min-Heap for K-Largest (The Counterintuitive Trick)

This confuses everyone at first. To find the K largest elements, you maintain a **min-heap of size K**. Why? Because the min-heap's top is the smallest of the K elements you've kept. When a new element arrives:

- If it's **larger** than the heap top → it belongs in the top K; evict the current minimum
- If it's **smaller** → it certainly doesn't belong in the top K; skip it

At the end, the heap contains exactly the K largest elements, and `heap.peek()` is the Kth largest. The alternative (max-heap of everything) uses O(n) space and O(n log n) time to build, while this approach uses only O(k) space and O(n log k) time.

### When Is Greedy Correct?

Greedy algorithms make the locally optimal choice at each step, hoping to reach the globally optimal solution. They're correct when two conditions hold:

1. **Greedy choice property**: A locally optimal choice leads to a globally optimal solution (you never need to "undo" a choice)
2. **Optimal substructure**: After making the greedy choice, the remaining problem is a smaller instance of the same problem

For many heap-based problems, the heap enables the greedy selection: "always pick the best available option." In merge K sorted lists, "best" means the smallest current head. In task scheduling, "best" means the most frequent task.

---

## 🧠 WHEN TO RECOGNIZE

```
IF the problem says:
  ✅ "K largest/smallest" elements
  ✅ "Merge K sorted" lists/arrays
  ✅ "Median of stream"
  ✅ "Schedule tasks" / "Minimize cost"
  ✅ "K closest" / "K most frequent"
  ✅ "Continuous minimum/maximum"
THEN → Heap (Priority Queue) + Greedy
```

### Min-Heap vs Max-Heap

```
Min-Heap (default PQ):          Max-Heap:
   1                               9
  / \                             / \
 3   2                           7   8
→ Top element: smallest         → Top element: largest
Use for: K largest              Use for: K smallest
(keep K largest, smallest       (keep K smallest, largest
 gets popped)                    gets popped)
```

---

## 📐 CORE TEMPLATES

### Template 1: Top K Elements

```java
// K largest elements → use MIN-heap of size k
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : nums) {
    minHeap.offer(num);
    if (minHeap.size() > k) {
        minHeap.poll();  // remove smallest → only k largest remain
    }
}
return minHeap.peek();  // kth largest
```

### Template 2: Merge K Sorted Lists

```java
PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
for (ListNode head : lists) {
    if (head != null) pq.offer(head);
}
ListNode dummy = new ListNode(0), curr = dummy;
while (!pq.isEmpty()) {
    ListNode min = pq.poll();
    curr.next = min;
    curr = curr.next;
    if (min.next != null) pq.offer(min.next);
}
return dummy.next;
```

### Template 3: Running Median (Two Heaps)

```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // left half
PriorityQueue<Integer> minHeap = new PriorityQueue<>();                            // right half

void addNum(int num) {
    maxHeap.offer(num);
    minHeap.offer(maxHeap.poll());  // balance
    if (minHeap.size() > maxHeap.size()) {
        maxHeap.offer(minHeap.poll());
    }
}

double findMedian() {
    return maxHeap.size() > minHeap.size() ? maxHeap.peek()
        : (maxHeap.peek() + minHeap.peek()) / 2.0;
}
```

---

## 🔬 FULL WALKTHROUGH: Kth Largest Element in an Array

```
Problem: Find the kth largest element. nums = [3,2,1,5,6,4], k = 2
Answer: 5 (sorted: [1,2,3,4,5,6], 2nd largest = 5)

Approach: Min-heap of size k. After processing all elements,
          the heap's top = kth largest.

WHY min-heap? We keep the k LARGEST elements. The smallest of
those k (the heap's top) is the kth largest overall.

Step-by-step (k=2):
  Process 3: heap = [3]           (size < k, just add)
  Process 2: heap = [2, 3]        (size = k)
  Process 1: 1 < heap.peek()=2    → skip (too small)
             heap = [2, 3]
  Process 5: 5 > heap.peek()=2    → poll 2, add 5
             heap = [3, 5]
  Process 6: 6 > heap.peek()=3    → poll 3, add 6
             heap = [5, 6]
  Process 4: 4 < heap.peek()=5    → skip
             heap = [5, 6]

  Answer: heap.peek() = 5 ✅

Time: O(n log k) | Space: O(k)
Why not sort? Sorting is O(n log n). Heap is O(n log k) — better when k << n.
```

---

## 🔬 FULL WALKTHROUGH 2: Find Median from Data Stream (Two Heaps)

```
Problem: Design a class that supports addNum(int) and findMedian().
         Stream: addNum(1), addNum(2), findMedian()→1.5, addNum(3), findMedian()→2

Approach: Two heaps.
  maxHeap (left half): stores the SMALLER half. Top = max of left.
  minHeap (right half): stores the LARGER half. Top = min of right.

  Invariant: maxHeap.size() == minHeap.size()  OR  maxHeap.size() == minHeap.size() + 1

Step-by-step:
  addNum(1): maxHeap=[1], minHeap=[]
             Sizes: 1, 0 → OK (left can be 1 bigger)

  addNum(2): maxHeap=[1,2]? No, rebalance.
             Add to maxHeap: [2,1]. maxHeap.top=2 > minHeap? Needs balance.
             Move max to minHeap: maxHeap=[1], minHeap=[2]
             Sizes: 1, 1 → OK

  findMedian(): Both same size → (maxHeap.peek() + minHeap.peek()) / 2
                = (1 + 2) / 2 = 1.5 ✅

  addNum(3): Add to maxHeap first: maxHeap=[3,1], top=3.
             3 > minHeap.peek(2) → move 3 to minHeap.
             maxHeap=[1], minHeap=[2,3]. Sizes: 1, 2 → rebalance!
             Move minHeap top to maxHeap: maxHeap=[2,1], minHeap=[3]
             Sizes: 2, 1 → OK

  findMedian(): maxHeap bigger → maxHeap.peek() = 2 ✅

Time: addNum O(log n), findMedian O(1) | Space: O(n)
```

---

🔬 **Section Challenge — 🔬 FULL WALKTHROUGH 2: Find Median from Data Stream (Two Heaps)**

**Challenge 1 (Reasoning):** `list.stream().filter().map().collect()` — at which point does data actually start flowing through the pipeline?

<details><summary>Answer</summary>

Not until `collect()` (or any terminal operation). `filter()` and `map()` are LAZY — they build a pipeline description but process nothing. When the terminal operation is called, the pipeline pulls elements through lazily: one element passes through the entire pipeline before the next is processed. This means: early termination with `findFirst()` is O(1) if the first element matches, not O(N).

</details>

**Challenge 2 (Bug Hunt):** You call `stream.filter(...).collect(...)` twice on the same stream. What happens?

<details><summary>Answer</summary>

`IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly.

</details>

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
```

| Edge Case | Handling |
| --- | --- |
| k = 1 | Heap of size 1 = max element |
| k = n | Heap of size n → just min of all |
| All same values [3,3,3,3] | Works correctly, peek always = 3 |
| Negative numbers | PQ handles naturally |
| Single element stream | Median = that element |
| k > n (invalid) | Handle before processing |

```
COMMON MISTAKES:
1. Min-heap vs Max-heap confusion for Kth Largest
   Kth LARGEST uses Min-heap (evict smallest). Kth SMALLEST uses Max-heap.
2. Java PQ is MIN-heap by default
   For max-heap: new PriorityQueue<>(Collections.reverseOrder())
3. Two Heaps: forgetting to rebalance after every insertion
4. Lazy deletion: poll() might return a stale element — always verify!
5. Using heap when monotonic stack suffices (e.g., sliding window max)
   Deque = O(n) total. Heap = O(n log n). Big difference!
```

---

## 📊 COMPLEXITY SUMMARY

| Problem            | Approach                    | Time                          | Space |
| ------------------ | --------------------------- | ----------------------------- | ----- |
| Kth Largest        | Min-heap size k             | O(n log k)                    | O(k)  |
| Kth Largest        | Quickselect                 | O(n) avg, O(n²) worst         | O(1)  |
| Top K Frequent     | HashMap + heap              | O(n log k)                    | O(n)  |
| Find Median        | Two heaps                   | O(log n) per add, O(1) median | O(n)  |
| Merge K Sorted     | Min-heap of k heads         | O(n log k)                    | O(k)  |
| Sliding Window Max | Monotonic DEQUE (not heap!) | O(n)                          | O(k)  |

---

## 📋 Practice Problems

> [!NOTE]
> The *Companies* column lists employers that candidates have reported asking the problem. These tags are community-reported, change over time and are **not verified** — use them as hints about relevance, not as facts.

| #   | Problem                                                                                                                 | Key Insight                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)                                       | HashMap freq + Min-heap of size k              |
| 2   | [Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/)                                   | Min-heap of size k OR Quickselect              |
| 3   | [Ugly Number II](https://leetcode.com/problems/ugly-number-ii/)                                                         | Min-heap generate next ugly                    |
| 4   | [Furthest Building](https://leetcode.com/problems/furthest-building-you-can-reach/)                                     | Min-heap: ladders for biggest, bricks for rest |
| 5   | [Kth Smallest in Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/)                 | Min-heap BFS from [0,0]                        |
| 6   | [Reorganize String](https://leetcode.com/problems/reorganize-string/)                                                   | Max-heap: pick most frequent, alternate        |
| 7   | [Most Competitive Subsequence](https://leetcode.com/problems/find-the-most-competitive-subsequence/)                    | Monotonic stack (not heap)                     |
| 8   | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)                                 | Max-heap of size k by distance                 |
| 9   | [Smallest Positive Missing](https://practice.geeksforgeeks.org/problems/smallest-positive-missing-number-1587115621/1/) | Index marking (no heap needed)                 |
| 10  | [Largest Subarray 0 Sum](https://practice.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1/)                    | Prefix sum + HashMap                           |

### Hard

| #   | Problem                                                                                         | Key Insight                          |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| 11  | [Minimum Refueling Stops](https://leetcode.com/problems/minimum-number-of-refueling-stops/)     | Max-heap: greedily use best stations |
| 12  | [Minimum Cost to Hire K Workers](https://leetcode.com/problems/minimum-cost-to-hire-k-workers/) | Sort by ratio + max-heap             |
| 13  | [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/)                     | Min-heap BFS (Dijkstra on grid)      |
| 14  | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)                 | Monotonic deque (heap is O(n log n)) |

### Additional — Greedy Problems

| #   | Problem                                                                                                                         | Key Insight                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 15  | [Gas Station](https://leetcode.com/problems/gas-station/)                                                                       | Greedy: track deficit             |
| 16  | [Task Scheduler](https://leetcode.com/problems/task-scheduler/)                                                                 | Greedy: most frequent first       |
| 17  | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/)                                                               | Monotonic stack greedy            |
| 18  | [Non-Overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)                                           | Sort by end, greedy pick          |
| 19  | [Minimum Deletion Cost](https://leetcode.com/problems/minimum-deletion-cost-to-avoid-repeating-letters/)                        | Greedy: keep max cost in group    |
| 20  | [Minimum Coins](https://www.geeksforgeeks.org/minimum-cost-for-acquiring-all-coins-with-k-extra-coins-allowed-with-every-coin/) | Sort + pick cheapest              |
| 21  | [Chocola (Cutting Board)](https://www.spoj.com/problems/CHOCOLA/)                                                               | Greedy: most expensive cuts first |
| 22  | [Pancake Sorting](https://www.geeksforgeeks.org/pancake-sorting/)                                                               | Greedy: find max, flip            |
| 23  | Maximize array sum after k-negation                                                                                             | Sort + flip most negatives        |
| 24  | SJF CPU Scheduling                                                                                                              | Min-heap by burst time            |

---

## 🔥 KEY TRICKS

| Trick                  | When                     | Why                                    |
| ---------------------- | ------------------------ | -------------------------------------- |
| Min-heap for K largest | Seems counterintuitive   | Smallest of the k-largest gets evicted |
| Two heaps for median   | Stream median            | Max-heap(left) + Min-heap(right)       |
| Custom comparator      | Complex objects          | `new PQ<>((a,b) -> a.cost - b.cost)`   |
| Lazy deletion          | When can't easily remove | Mark deleted, skip on poll             |
| Heap + HashMap         | Frequency-aware          | Count freq → heap by freq              |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Heap + Greedy

**When the interviewer gives you a top-K or scheduling problem, say this:**

"Sorting all n elements would be O(n log n), but we only need the K largest/smallest. A min-heap of size K keeps only the K largest: for each new element, compare with heap top (the smallest of our K). If larger, swap it in. Total: O(n log K), and only O(K) space — optimal for streaming data."

**For greedy problems:**
"At each step, I make the locally optimal choice. This works here because the greedy choice property holds — swapping any decision for the greedy decision never makes the solution worse. I can show this with an exchange argument."

**Key mathematical justification:**

- "Min-heap for K-largest is counterintuitive. The heap top is the _smallest_ of the K we kept. If a new element beats the smallest, it replaces it. At the end, heap contains exactly the K largest."
- "Greedy correctness requires proof. The _exchange argument_: take any optimal solution, swap one element for the greedy choice, show it doesn't get worse."
- "Heap insert/extract is O(log n) because the heap is a complete binary tree of height ⌊log₂ n⌋. Bubbling up/down traverses at most h levels."

**Common mistakes to proactively mention:**

- ❌ "Min-heap for K-largest, Max-heap for K-smallest — it's always the _opposite_ of what you're finding."
- ❌ "Greedy fails for many problems (e.g., 0/1 Knapsack, coin change with arbitrary denominations). Always check with a counterexample first."
- ❌ "PriorityQueue in Java is a min-heap by default. For max-heap: `new PriorityQueue<>(Comparator.reverseOrder())`."

**Real-world applications:**

- OS/Kubernetes task schedulers (process priority queue)
- Dijkstra's algorithm in GPS/map routing
- Merge K sorted log streams in distributed systems
- Real-time analytics (top-K trending products, running median)
- Huffman encoding in data compression (ZIP, GZIP)

---

📖 **Related Chapters:**

- [02_Data_Structures/01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md) — Heap internals
- [03_Algorithms/12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md) — Greedy deep dive

---

[← 14 Graph+Traversal](14_Graph_Plus_Traversal.md) | [16 DP Patterns →](16_DP_Pattern_Recognition.md)


---

## 🏢 Enterprise Lens — Heap + Greedy Selection

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Schedulers, top-N dashboards, event simulation, k-way merge in databases |
| **Failure modes** | Using a max-heap of size n (wasted memory); comparator inconsistencies; stale entries after priority changes |
| **Testing and verification** | Compare with full sort; test K = 1, K = n, duplicates and empty input |

---

## Reality Check

**"Top-k problems want a max-heap"** → Top-k LARGEST wants a MIN-heap of size k: the root is the weakest member of the current elite, and a newcomer either beats the root (replace) or is discarded. A max-heap of all n elements works but costs O(n) memory and O(n log n) time versus O(k) and O(n log k). The inversion — smallest structure guards the largest set — is the single most-tested heap insight, and it flips symmetrically for top-k smallest.

**"Heaps keep everything sorted"** → A heap guarantees ONLY the root; siblings have no order, and iterating a heap's backing array yields near-random sequence. Printing a PriorityQueue to debug it misleads you every time. If you need full order, you are paying for heapsort anyway; the heap's entire economy is paying log n per extraction ONLY for the extractions you actually perform.

**"Greedy selection with a heap is one pattern"** → Two distinct machines share the name: REPEATED-BEST (task scheduling, Huffman merges — pop, process, maybe push back modified) and SWEEP-WITH-RELEASE (meeting rooms, CPU intervals — sort by start, heap holds active items keyed by end, pop everything expired before deciding). The second's correctness lives in the sort-then-release ordering; skipping the sort and trusting the heap alone is the classic meeting-rooms wrong answer.

**"Java PriorityQueue removes arbitrary elements efficiently"** → remove(Object) is O(n) SEARCH plus O(log n) fix-up — a hidden linear scan that turns Dijkstra-with-decrease-key into quadratic sludge. The idiomatic escape is LAZY DELETION: push the updated entry, and on every pop discard entries that are stale (check against a current-best map). Same trick powers find-median-with-removals and every sliding-window-median solution.

**"Two-heap median is a niche trick"** → The two-heap balance (max-heap of lower half, min-heap of upper half, sizes within one) is the general template for ANY running-percentile question — medians, 95th-percentile latency dashboards, matchmaking rating splits. The maintenance rule people fumble: always insert into one designated side first, then rebalance by moving one root; ad-hoc insertion logic desynchronizes the halves within ten operations.
