# Heap + Greedy Selection — Combined Pattern Guide

> **WHY this combination?** Heaps give O(log n) access to the min/max element. Combined with greedy strategy (always pick the best available), they solve "Top K", "merge K sorted", and scheduling problems efficiently.

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

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
┌──────────────────────────────┬─────────────────────────────────────────┐
│ Edge Case                    │ Handling                                │
├──────────────────────────────┼─────────────────────────────────────────┤
│ k = 1                        │ Heap of size 1 = max element          │
│ k = n                        │ Heap of size n → just min of all     │
│ All same values [3,3,3,3]    │ Works correctly, peek always = 3     │
│ Negative numbers             │ PQ handles naturally                  │
│ Single element stream        │ Median = that element                 │
│ k > n (invalid)              │ Handle before processing             │
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

📖 **Related Chapters:**
- [02_Data_Structures/01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md) — Heap internals
- [03_Algorithms/12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md) — Greedy deep dive

---
[← 14 Graph+Traversal](14_Graph_Plus_Traversal.md) | [16 DP Patterns →](16_DP_Pattern_Recognition.md)
