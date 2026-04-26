**Navigation**: [< Previous](14_Graph_Plus_Traversal.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_DP_Pattern_Recognition.md)

# Heap + Greedy Selection — Combined Pattern Guide

**WHY this combination?** Heaps give O(log n) access to the min/max element. Combined with greedy strategy (always pick the best available), they solve "Top K", "merge K sorted", and scheduling problems efficiently.

### 🧠 Deep Intuition — Heaps and Greedy Correctness

#### Why Heaps Give O(log n) Insert/Extract

A heap is a **complete binary tree** stored in an array. "Complete" means every level is fully filled except possibly the last, which is filled left-to-right. The heap property (min-heap: parent ≤ children; max-heap: parent ≥ children) means the root always holds the extreme value. Insert and extract require "bubbling" up or down through the tree height, which is O(log n) since a complete binary tree has height ⌊log₂ n⌋.

#### Why Min-Heap for K-Largest (The Counterintuitive Trick)

This confuses everyone at first. To find the K largest elements, you maintain a **min-heap of size K**. Why? Because the min-heap's top is the smallest of the K elements you've kept. When a new element arrives:
- If it's **larger** than the heap top → it belongs in the top K; evict the current minimum
- If it's **smaller** → it certainly doesn't belong in the top K; skip it

At the end, the heap contains exactly the K largest elements, and `heap.peek()` is the Kth largest. The alternative (max-heap of everything) uses O(n) space and O(n log n) time to build, while this approach uses only O(k) space and O(n log k) time.

#### When Is Greedy Correct?

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

**Flow:**
1. THEN
2. Heap (Priority Queue) + Greedy

```mermaid
flowchart LR
    N1["THEN"]
    N2["Heap (Priority Queue) + Greedy"]
    N1 --> N2
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

**Flow:**
1. Top element: smallest
2. Top element: largest

```mermaid
flowchart LR
    N1["Top element: smallest"]
    N2["Top element: largest"]
    N1 --> N2
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

## � FULL WALKTHROUGH: Kth Largest Element in an Array

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

**Flow:**
1. Process 1: 1 < heap.peek()=2
2. skip (too small)
3. Process 5: 5 > heap.peek()=2
4. poll 2, add 5
5. Process 6: 6 > heap.peek()=3
6. poll 3, add 6
7. Process 4: 4 < heap.peek()=5
8. skip

```mermaid
flowchart LR
    N1["Process 1: 1 &lt; heap.peek()=2"]
    N2["skip (too small)"]
    N3["Process 5: 5 &gt; heap.peek()=2"]
    N4["poll 2, add 5"]
    N5["Process 6: 6 &gt; heap.peek()=3"]
    N6["poll 3, add 6"]
    N7["Process 4: 4 &lt; heap.peek()=5"]
    N8["skip"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
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

**Flow:**
1. Stream: addNum(1), addNum(2), findMedian()
2. 1.5, addNum(3), findMedian()
3. Sizes: 1, 0
4. OK (left can be 1 bigger)
5. Sizes: 1, 1
6. OK
7. findMedian(): Both same size
8. (maxHeap.peek() + minHeap.peek()) / 2
9. 3 > minHeap.peek(2)
10. move 3 to minHeap.
11. maxHeap=[1], minHeap=[2,3]. Sizes: 1, 2
12. rebalance!

```mermaid
flowchart TD
    N1["Stream: addNum(1), addNum(2), findMedian()"]
    N2["1.5, addNum(3), findMedian()"]
    N3["Sizes: 1, 0"]
    N4["OK (left can be 1 bigger)"]
    N5["Sizes: 1, 1"]
    N6["OK"]
    N7["findMedian(): Both same size"]
    N8["(maxHeap.peek() + minHeap.peek()) / 2"]
    N9["3 &gt; minHeap.peek(2)"]
    N10["move 3 to minHeap."]
    N11["maxHeap=[1], minHeap=[2,3]. Sizes: 1, 2"]
    N12["rebalance!"]
    N13["Sizes: 2, 1"]
    N14["findMedian(): maxHeap bigger"]
    N15["maxHeap.peek() = 2 ✅"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
    N13 --> N6
    N14 --> N15
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
┌──────────────────────────────┬─────────────────────────────────────────┐
│ Edge Case                    │ Handling                                │
├──────────────────────────────┼─────────────────────────────────────────┤
│ k = 1                        │ Heap of size 1 = max element            │
│ k = n                        │ Heap of size n → just min of all        │
│ All same values [3,3,3,3]    │ Works correctly, peek always = 3        │
│ Negative numbers             │ PQ handles naturally                    │
│ Single element stream        │ Median = that element                   │
│ k > n (invalid)              │ Handle before processing                │
└──────────────────────────────┴─────────────────────────────────────────┘

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

**Flow:**
1. EDGE CASES:
2. Edge Case Handling
3. k = 1 Heap of size 1 = max element
4. k = n Heap of size n
5. just min of all
6. k = n Heap of size n
7. just min of all
8. All same values [3,3,3,3] Works correctly, peek always
9. Negative numbers PQ handles naturally
10. Single element stream Median = that element

```mermaid
flowchart TD
    N1["EDGE CASES:"]
    N2["Edge Case Handling"]
    N3["k = 1 Heap of size 1 = max element"]
    N4["k = n Heap of size n → just min of all"]
    N5["All same values [3,3,3,3] Works correctly, peek always"]
    N6["Negative numbers PQ handles naturally"]
    N7["Single element stream Median = that element"]
    N8["k &gt; n (invalid) Handle before processing"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## 📊 COMPLEXITY SUMMARY

| Problem | Approach | Time | Space |
|---------|----------|------|-------|
| Kth Largest | Min-heap size k | O(n log k) | O(k) |
| Kth Largest | Quickselect | O(n) avg, O(n²) worst | O(1) |
| Top K Frequent | HashMap + heap | O(n log k) | O(n) |
| Find Median | Two heaps | O(log n) per add, O(1) median | O(n) |
| Merge K Sorted | Min-heap of k heads | O(n log k) | O(k) |
| Sliding Window Max | Monotonic DEQUE (not heap!) | O(n) | O(k) |

---



🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 📋 PRACTICE PROBLEMS — From Your Excel Sheet
| # | Problem | Key Insight |
|---|---------|-------------|
| 1 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | HashMap freq + Min-heap of size k |
| 2 | [Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Min-heap of size k OR Quickselect |
| 3 | [Ugly Number II](https://leetcode.com/problems/ugly-number-ii/) | Min-heap generate next ugly |
| 4 | [Furthest Building](https://leetcode.com/problems/furthest-building-you-can-reach/) | Min-heap: ladders for biggest, bricks for rest |
| 5 | [Kth Smallest in Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | Min-heap BFS from [0,0] |
| 6 | [Reorganize String](https://leetcode.com/problems/reorganize-string/) | Max-heap: pick most frequent, alternate |
| 7 | [Most Competitive Subsequence](https://leetcode.com/problems/find-the-most-competitive-subsequence/) | Monotonic stack (not heap) |
| 8 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | Max-heap of size k by distance |
| 9 | [Smallest Positive Missing](https://practice.geeksforgeeks.org/problems/smallest-positive-missing-number-1587115621/1/) | Index marking (no heap needed) |
| 10 | [Largest Subarray 0 Sum](https://practice.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1/) | Prefix sum + HashMap |

### Hard
| # | Problem | Key Insight |
|---|---------|-------------|
| 11 | [Minimum Refueling Stops](https://leetcode.com/problems/minimum-number-of-refueling-stops/) | Max-heap: greedily use best stations |
| 12 | [Minimum Cost to Hire K Workers](https://leetcode.com/problems/minimum-cost-to-hire-k-workers/) | Sort by ratio + max-heap |
| 13 | [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) | Min-heap BFS (Dijkstra on grid) |
| 14 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | Monotonic deque (heap is O(n log n)) |

### Additional — Greedy Problems from Excel
| # | Problem | Key Insight |
|---|---------|-------------|
| 15 | [Gas Station](https://leetcode.com/problems/gas-station/) | Greedy: track deficit |
| 16 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | Greedy: most frequent first |
| 17 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | Monotonic stack greedy |
| 18 | [Non-Overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Sort by end, greedy pick |
| 19 | [Minimum Deletion Cost](https://leetcode.com/problems/minimum-deletion-cost-to-avoid-repeating-letters/) | Greedy: keep max cost in group |
| 20 | [Minimum Coins](https://www.geeksforgeeks.org/minimum-cost-for-acquiring-all-coins-with-k-extra-coins-allowed-with-every-coin/) | Sort + pick cheapest |
| 21 | [Chocola (Cutting Board)](https://www.spoj.com/problems/CHOCOLA/) | Greedy: most expensive cuts first |
| 22 | [Pancake Sorting](https://www.geeksforgeeks.org/pancake-sorting/) | Greedy: find max, flip |
| 23 | Maximize array sum after k-negation | Sort + flip most negatives |
| 24 | SJF CPU Scheduling | Min-heap by burst time |

---

## 🔥 KEY TRICKS

| Trick | When | Why |
|-------|------|-----|
| Min-heap for K largest | Seems counterintuitive | Smallest of the k-largest gets evicted |
| Two heaps for median | Stream median | Max-heap(left) + Min-heap(right) |
| Custom comparator | Complex objects | `new PQ<>((a,b) -> a.cost - b.cost)` |
| Lazy deletion | When can't easily remove | Mark deleted, skip on poll |
| Heap + HashMap | Frequency-aware | Count freq → heap by freq |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Heap + Greedy

**When the interviewer gives you a top-K or scheduling problem, say this:**

"Sorting all n elements would be O(n log n), but we only need the K largest/smallest. A min-heap of size K keeps only the K largest: for each new element, compare with heap top (the smallest of our K). If larger, swap it in. Total: O(n log K), and only O(K) space — optimal for streaming data."

**For greedy problems:**
"At each step, I make the locally optimal choice. This works here because the greedy choice property holds — swapping any decision for the greedy decision never makes the solution worse. I can show this with an exchange argument."

**Key mathematical justification:**
- "Min-heap for K-largest is counterintuitive. The heap top is the *smallest* of the K we kept. If a new element beats the smallest, it replaces it. At the end, heap contains exactly the K largest."
- "Greedy correctness requires proof. The *exchange argument*: take any optimal solution, swap one element for the greedy choice, show it doesn't get worse."
- "Heap insert/extract is O(log n) because the heap is a complete binary tree of height ⌊log₂ n⌋. Bubbling up/down traverses at most h levels."

**Common mistakes to proactively mention:**
- ❌ "Min-heap for K-largest, Max-heap for K-smallest — it's always the *opposite* of what you're finding."
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


