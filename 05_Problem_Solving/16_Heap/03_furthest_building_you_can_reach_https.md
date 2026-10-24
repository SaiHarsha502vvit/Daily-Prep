# 10. [Furthest Building You Can Reach](https://leetcode.com/problems/furthest-building-you-can-reach/) (LC 1642) ⭐ Medium

> **Navigation**: [← Easy Problems](02_easy_problems.md) | [Chapter overview](../16_Heap.md)
> Page 3 of 3 in **Heap**


**Companies**: Google, Amazon  
**Pattern**: Min-heap for greedy resource allocation

**Problem**: Given buildings' heights, bricks, and ladders, find the furthest building you can reach. Use bricks or a ladder for each climb (height[i+1] > height[i]).

**Key Insight**: Ladders should be used for the largest climbs. Use a min-heap of size = ladders to track the largest climbs seen. When the heap overflows, the smallest climb in the heap gets paid with bricks instead.

**Approach**:

1. For each positive climb (diff = height[i+1] - height[i]):
   - Push diff into a min-heap (optimistically use a ladder)
   - If heap size > ladders, poll the smallest climb and use bricks instead
   - If bricks < 0, we can't proceed — return i
2. If we finish, return last index

**Solution**:

```java
class Solution {
    public int furthestBuilding(int[] heights, int bricks, int ladders) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(); // Tracks ladder-worthy climbs

        for (int i = 0; i < heights.length - 1; i++) {
            int diff = heights[i + 1] - heights[i];
            if (diff <= 0) continue; // Descending or flat — no cost

            minHeap.offer(diff); // Optimistically assign a ladder

            if (minHeap.size() > ladders) {
                // Too many ladders used — convert smallest climb to bricks
                bricks -= minHeap.poll();
                if (bricks < 0) return i;
            }
        }
        return heights.length - 1;
    }
}
```

**Complexity**: Time O(n log L) where L = ladders, Space O(L).  
**Why This Works**: The min-heap of size L ensures ladders are always assigned to the L largest climbs seen so far. All other climbs use bricks. This is provably optimal: ladders have maximum value on the largest climbs.

---

🔬 **Section Challenge — After Medium Problems**

**Challenge 1 (Reasoning):** Median from Data Stream: why do we need TWO heaps? Why can't one heap solve it?

<details><summary>Answer</summary>

One heap gives O(1) access to its root (max or min). But median requires BOTH the max of the lower half AND the min of the upper half. One heap can't give both simultaneously in O(1). Two heaps: `lo` = max-heap of lower half (root = largest of small numbers), `hi` = min-heap of upper half (root = smallest of large numbers). Median = `lo.peek()` or average of `lo.peek() + hi.peek()`. Maintaining balance invariant (sizes differ by at most 1) ensures this works.

</details>

**Challenge 2 (Design):** Task Scheduler (LeetCode 621) — why is it solved with a max-heap and not sorting?

<details><summary>Answer</summary>

You need to always schedule the most frequent remaining task (greedy). Max-heap gives O(log N) access to the highest-frequency task without re-sorting after each removal. After scheduling, frequency decreases by 1, re-insert if > 0. Sorting once at start doesn't work: frequencies change dynamically as tasks are scheduled. The heap maintains the most-frequent invariant dynamically. Key pattern: **greedy + dynamic ordering = heap**.

</details>

**Challenge 3 (Reasoning):** Merge K sorted lists: why PriorityQueue of size K instead of merging two at a time?

<details><summary>Answer</summary>

Merge two at a time: each merge costs O(total_elements). K iterations = O(K × N) total. PriorityQueue: maintain the current head of each list in a min-heap of size K. Extract min = O(log K), insert next element = O(log K). Total: O(N log K) where N = total elements. When K is large (say 1000 lists), O(N log K) vs O(NK) is a massive difference. Key insight: we never need to compare all K lists — just the current minimums.

</details>

## 🧩 Part 3: Hard Problems

**HARD — 5 PROBLEMS**

```text
Advanced patterns: monotonic deque, two-heap greedy, 3D BFS
```

### 1. [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) (LC 239) ⭐ Hard

**Companies**: Amazon, Google, Facebook, Microsoft  
**Pattern**: Monotonic Deque (preferred) vs Max-Heap

**Problem**: Given an array and window size k, return the max of each sliding window position.

**Key Insight**: A max-heap approach works but is O(n log n) due to lazy deletion. A monotonic decreasing deque achieves O(n) — it maintains candidates in decreasing order, discarding elements that can never be the max.

**Approach (Monotonic Deque — optimal)**:

1. Maintain a deque of indices in decreasing order of values
2. For each new element: remove all smaller elements from back (they'll never be max)
3. Remove front if it's outside the window
4. Front of deque is always the current window max

**Solution**:

```java
class Solution {
    // Approach 1: Monotonic Deque — O(n) ✓ Preferred
    public int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>(); // Stores indices

        for (int i = 0; i < n; i++) {
            // Remove elements outside window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }
            // Remove smaller elements — they can never be the max
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }
            deque.offerLast(i);

            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }
        return result;
    }

    // Approach 2: Max-Heap with lazy deletion — O(n log n)
    public int[] maxSlidingWindowHeap(int[] nums, int k) {
        int n = nums.length;
        int[] result = new int[n - k + 1];
        // [value, index]
        PriorityQueue<int[]> maxHeap = new PriorityQueue<>((a, b) -> b[0] - a[0]);

        for (int i = 0; i < n; i++) {
            maxHeap.offer(new int[]{nums[i], i});
            // Lazy deletion: remove elements outside window
            while (maxHeap.peek()[1] < i - k + 1) {
                maxHeap.poll();
            }
            if (i >= k - 1) {
                result[i - k + 1] = maxHeap.peek()[0];
            }
        }
        return result;
    }
}
```

**Complexity**: Deque: Time O(n), Space O(k). Heap: Time O(n log n), Space O(n).  
**Why This Works**: The deque maintains a decreasing sequence of "useful" elements. Any element smaller than a newer element is discarded because it can never be the window max while the newer, larger element exists in the window.

---

### 2. [IPO](https://leetcode.com/problems/ipo/) (LC 502) ⭐ Hard

**Companies**: Amazon, Google  
**Pattern**: Two Heaps — Greedy capital maximization

**Problem**: Given k projects with profits and minimum capital requirements, and starting capital w, maximize total capital by selecting at most k projects (each done at most once, sequential).

**Key Insight**: At each step, choose the most profitable project we can afford. Use a min-heap sorted by capital requirement to track "unlockable" projects, and a max-heap sorted by profit to pick the best affordable one.

**Approach**:

1. Create a min-heap of (capital, profit) for all projects — sorted by capital
2. For k rounds:
   - Move all projects with capital ≤ current w from min-heap to max-heap (sorted by profit)
   - Poll from max-heap — this is the most profitable affordable project
   - Add its profit to w
3. Return w

**Solution**:

```java
class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        // Min-heap sorted by capital requirement
        PriorityQueue<int[]> capHeap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int i = 0; i < n; i++) {
            capHeap.offer(new int[]{capital[i], profits[i]});
        }

        // Max-heap sorted by profit (for affordable projects)
        PriorityQueue<Integer> profitHeap = new PriorityQueue<>(Comparator.reverseOrder());

        for (int i = 0; i < k; i++) {
            // Unlock all affordable projects
            while (!capHeap.isEmpty() && capHeap.peek()[0] <= w) {
                profitHeap.offer(capHeap.poll()[1]);
            }
            if (profitHeap.isEmpty()) break; // No affordable project
            w += profitHeap.poll(); // Take the most profitable
        }
        return w;
    }
}
```

**Complexity**: Time O(n log n + k log n), Space O(n).  
**Why This Works**: Greedy is provably optimal here: since capital only grows and projects are independent, selecting the highest-profit affordable project at each step maximizes future buying power and thus total profit.

---

### 3. [Trapping Rain Water II](https://leetcode.com/problems/trapping-rain-water-ii/) (LC 407) ⭐ Hard

**Companies**: Google, Amazon  
**Pattern**: Min-Heap BFS on 3D heightmap (extension of 1D trapping rain water)

**Problem**: Given a 2D elevation map, compute how much water it can trap after raining.

**Key Insight**: The water level at any cell is determined by the minimum boundary height surrounding it. Start from the border (lowest potential walls) and use a min-heap to process cells in order of height, flooding inward.

**Approach**:

1. Add all border cells to a min-heap, mark visited
2. Poll the lowest cell — it represents the current "water level" boundary
3. For each unvisited neighbor: water trapped = max(0, current_level - neighbor_height)
4. Push neighbor with height = max(current_level, neighbor_height) into heap
5. The heap naturally processes the boundary from lowest to highest, ensuring correct water calculation

**Solution**:

```java
class Solution {
    public int trapRainWater(int[][] heightMap) {
        int m = heightMap.length, n = heightMap[0].length;
        if (m < 3 || n < 3) return 0;

        boolean[][] visited = new boolean[m][n];
        // Min-heap: [height, row, col]
        PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[0] - b[0]);

        // Add all border cells
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 || i == m - 1 || j == 0 || j == n - 1) {
                    minHeap.offer(new int[]{heightMap[i][j], i, j});
                    visited[i][j] = true;
                }
            }
        }

        int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
        int water = 0;

        while (!minHeap.isEmpty()) {
            int[] cell = minHeap.poll();
            int h = cell[0], r = cell[1], c = cell[2];

            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    // Water trapped at this cell
                    water += Math.max(0, h - heightMap[nr][nc]);
                    // Push with effective height (max of boundary and actual)
                    minHeap.offer(new int[]{Math.max(h, heightMap[nr][nc]), nr, nc});
                }
            }
        }
        return water;
    }
}
```

**Complexity**: Time O(m·n · log(m·n)), Space O(m·n).  
**Why This Works**: By processing border cells from lowest to highest, we simulate water flowing from outside in. The min-heap ensures we always expand the lowest part of the boundary first, correctly computing water levels by the "weakest wall" principle.

---

### 4. [Minimum Cost to Hire K Workers](https://leetcode.com/problems/minimum-cost-to-hire-k-workers/) (LC 857) ⭐ Hard

**Companies**: Google, Amazon  
**Pattern**: Sort + Max-Heap greedy

**Problem**: Given n workers with quality[i] and wage[i], hire exactly k workers. Each worker must be paid at least their minimum wage, and pay must be proportional to quality. Minimize total cost.

**Key Insight**: If we pay proportionally to quality, the cost per unit quality (ratio = wage/quality) must be ≥ each worker's own ratio. The "captain" (worker with highest ratio in the group) sets the unit price. So: sort by ratio, iterate over "captains," and use a max-heap to track the k smallest qualities.

**Approach**:

1. Compute ratio = wage[i] / quality[i] for each worker
2. Sort by ratio ascending
3. Use a max-heap to track the k smallest qualities seen so far
4. For each worker as "captain" (left to right = increasing ratio):
   - Add their quality to heap, add to quality sum
   - If heap size > k, remove the largest quality (reduces cost)
   - If heap size == k, cost = ratio \* qualitySum. Track minimum.

**Solution**:

```java
class Solution {
    public double mincostToHireWorkers(int[] quality, int[] wage, int k) {
        int n = quality.length;
        // [ratio, quality]
        double[][] workers = new double[n][2];
        for (int i = 0; i < n; i++) {
            workers[i] = new double[]{(double) wage[i] / quality[i], quality[i]};
        }

        // Sort by ratio (wage/quality)
        Arrays.sort(workers, (a, b) -> Double.compare(a[0], b[0]));

        // Max-heap to track k smallest qualities
        PriorityQueue<Double> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        double qualitySum = 0;
        double minCost = Double.MAX_VALUE;

        for (double[] w : workers) {
            double ratio = w[0], qual = w[1];
            maxHeap.offer(qual);
            qualitySum += qual;

            if (maxHeap.size() > k) {
                qualitySum -= maxHeap.poll(); // Remove highest quality to minimize sum
            }

            if (maxHeap.size() == k) {
                minCost = Math.min(minCost, ratio * qualitySum);
            }
        }
        return minCost;
    }
}
```

**Complexity**: Time O(n log n), Space O(n).  
**Why This Works**: By iterating workers in ratio order, each new worker's ratio is the binding constraint (captain's ratio). To minimize cost = ratio × totalQuality, we keep the k smallest qualities. The max-heap evicts the largest quality to maintain this invariant.

---

### 5. [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/) (LC 480) ⭐ Hard

**Companies**: Google, Facebook, Amazon  
**Pattern**: Two Heaps + Lazy Deletion (extension of LC 295)

**Problem**: Return the median of each window of size k in the given array.

**Key Insight**: Extend the two-heap median approach (LC 295) with lazy deletion. When elements leave the window, we can't efficiently remove from a heap, so we track "pending removals" and clean up lazily when those elements reach the heap top.

**Approach**:

1. Use maxHeap (lower half) and minHeap (upper half) with lazy deletion
2. Track a balance counter: +1 when removing from maxHeap side, -1 from minHeap side
3. For each window slide: add new element, schedule old element for removal, rebalance
4. Lazy delete: when polling or peeking, skip elements that are marked for removal

**Solution**:

```java
class Solution {
    public double[] medianSlidingWindow(int[] nums, int k) {
        // Max-heap (lower half) and min-heap (upper half)
        PriorityQueue<Long> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        PriorityQueue<Long> minHeap = new PriorityQueue<>();
        Map<Long, Integer> pendingRemoval = new HashMap<>();

        double[] result = new double[nums.length - k + 1];

        // Initialize first window
        long[] sorted = new long[k];
        for (int i = 0; i < k; i++) sorted[i] = nums[i];
        Arrays.sort(sorted);
        for (int i = 0; i < k; i++) {
            if (i < (k + 1) / 2) maxHeap.offer(sorted[i]);
            else minHeap.offer(sorted[i]);
        }
        result[0] = k % 2 == 1 ? maxHeap.peek() : (maxHeap.peek() + minHeap.peek()) / 2.0;

        for (int i = k; i < nums.length; i++) {
            long outgoing = nums[i - k];
            long incoming = nums[i];

            // Schedule removal of outgoing
            pendingRemoval.merge(outgoing, 1, Integer::sum);

            // Determine which heap it was in: if outgoing <= maxHeap.peek() → in maxHeap
            int balance = 0; // +1 means maxHeap lost one, -1 means minHeap lost one
            if (outgoing <= maxHeap.peek()) balance++;
            else balance--;

            // Insert incoming
            if (!maxHeap.isEmpty() && incoming <= maxHeap.peek()) {
                maxHeap.offer(incoming);
                balance--;
            } else {
                minHeap.offer(incoming);
                balance++;
            }

            // Rebalance
            if (balance > 0) { // minHeap has extra → move to maxHeap
                maxHeap.offer(minHeap.poll());
            } else if (balance < 0) { // maxHeap has extra → move to minHeap
                minHeap.offer(maxHeap.poll());
            }

            // Lazy clean tops
            while (!maxHeap.isEmpty() && pendingRemoval.getOrDefault(maxHeap.peek(), 0) > 0) {
                pendingRemoval.merge(maxHeap.poll(), -1, Integer::sum);
            }
            while (!minHeap.isEmpty() && pendingRemoval.getOrDefault(minHeap.peek(), 0) > 0) {
                pendingRemoval.merge(minHeap.poll(), -1, Integer::sum);
            }

            result[i - k + 1] = k % 2 == 1 ? maxHeap.peek() : (maxHeap.peek() + minHeap.peek()) / 2.0;
        }
        return result;
    }
}
```

**Complexity**: Time O(n log k), Space O(n).  
**Why This Works**: The two-heap structure gives O(1) median access. Lazy deletion amortizes removal cost — invalid elements are only cleaned when they surface to the top. The balance counter ensures the heaps stay properly sized even with pending removals.

---

## 📋 Part 4: Complexity Cheat Sheet & Decision Flowchart

```
                  HEAP COMPLEXITY CHEAT SHEET
```

| Operation | Binary Heap | Java PriorityQueue | Notes |
| --- | --- | --- | --- |
| insert / offer | O(log n) | O(log n) | Sift-up |
| extractMin / poll | O(log n) | O(log n) | Sift-down |
| peek | O(1) | O(1) | Root access |
| remove(object) | O(n) | O(n) | Linear search! |
| contains | O(n) | O(n) | Linear search! |
| heapify (build) | O(n) | O(n) via constructor | Bottom-up |
| size | O(1) | O(1) |  |

| Pattern | Time | Space |
| --- | --- | --- |
| Top K (min-heap size k) | O(n log k) | O(k) |
| K-way merge (heap size k) | O(N log k) | O(k) |
| Two heaps (median) | O(n log n) | O(n) |
| Greedy + heap | O(n log n) | O(n) |
| Sort via heap (heapsort) | O(n log n) | O(1) in-place |

### WHEN TO USE HEAP — Decision Flowchart

```
            WHEN TO USE A HEAP — DECISION FLOWCHART
──────────────────────────────────────────────────

Need to repeatedly find min/max of a dynamic collection?
  │
  ├── YES ─→ Use a Heap (PriorityQueue)
  │    │
  │    ├── Need BOTH min and max? ─→ Two heaps or TreeMap
  │    ├── Need fast delete(obj)?  ─→ TreeMap (not heap — O(n) remove!)
  │    └── Need median?           ─→ Two heaps pattern
  │
  └── NO
       │
       ├── Need top K elements? ─────────────────────────────────────
       │    ├── K is small, N is large? ─→ Min-heap of size K: O(n log k)
       │    ├── K ≈ N?                  ─→ Just sort: O(n log n)
       │    └── Online/streaming?       ─→ Heap (can't sort unseen data)
       │
       ├── Merging K sorted sequences?  ─→ Min-heap of K heads
       │
       ├── Greedy: always pick best available?
       │    ├── Fixed priority? ─→ Sort once
       │    └── Dynamic priority / reinsertions? ─→ Heap
       │
       ├── Sliding window min/max?
       │    ├── O(n) needed?   ─→ Monotonic Deque (not heap!)
       │    └── O(n log n) OK? ─→ Heap with lazy deletion
       │
       └── Dijkstra / Prim?    ─→ Min-heap for edge relaxation

```

### Problem Pattern Quick Reference

| Problem                                                                                              | LC   | Pattern                    | Key Data Structure      |
| ---------------------------------------------------------------------------------------------------- | ---- | -------------------------- | ----------------------- |
| [Kth Largest in Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/)              | 703  | Min-heap size K            | PQ (min)                |
| [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/)                                | 1046 | Max-heap simulation        | PQ (max)                |
| [Sort by Frequency](https://leetcode.com/problems/sort-array-by-increasing-frequency/)               | 1636 | Freq + custom comparator   | PQ (custom)             |
| [Relative Ranks](https://leetcode.com/problems/relative-ranks/)                                      | 506  | Max-heap for ranking       | PQ (max)                |
| [Min Cost Connect Sticks](https://leetcode.com/problems/minimum-cost-to-connect-sticks/)             | 1167 | Huffman / greedy merge     | PQ (min)                |
| [Kth Largest in Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)               | 215  | Min-heap size K / QuickSel | PQ (min) or partition   |
| [Top K Frequent](https://leetcode.com/problems/top-k-frequent-elements/)                             | 347  | Freq + min-heap size K     | HashMap + PQ (min)      |
| [K Closest Points](https://leetcode.com/problems/k-closest-points-to-origin/)                        | 973  | Max-heap size K            | PQ (max by distance)    |
| [Find Median (stream)](https://leetcode.com/problems/find-median-from-data-stream/)                  | 295  | Two heaps                  | PQ (max) + PQ (min)     |
| [Reorganize String](https://leetcode.com/problems/reorganize-string/)                                | 767  | Greedy + max-heap          | PQ (max by freq)        |
| [Task Scheduler](https://leetcode.com/problems/task-scheduler/)                                      | 621  | Greedy rounds + heap       | PQ (max by freq)        |
| [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)                          | 23   | K-way merge                | PQ (min) of size K      |
| [Sort Chars by Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)               | 451  | Freq + max-heap            | HashMap + PQ (max)      |
| [Kth Smallest Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | 378  | K-way merge on matrix      | PQ (min)                |
| [Furthest Building](https://leetcode.com/problems/furthest-building-you-can-reach/)                  | 1642 | Greedy resource allocation | PQ (min) of size L      |
| [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)                      | 239  | Monotonic deque (optimal)  | Deque / PQ (max)        |
| [IPO](https://leetcode.com/problems/ipo/)                                                            | 502  | Two heaps greedy           | PQ (min cap) + PQ (max) |
| [Trapping Rain Water II](https://leetcode.com/problems/trapping-rain-water-ii/)                      | 407  | Min-heap BFS boundary      | PQ (min)                |
| [Min Cost Hire K Workers](https://leetcode.com/problems/minimum-cost-to-hire-k-workers/)             | 857  | Sort + max-heap            | PQ (max quality)        |
| [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/)                        | 480  | Two heaps + lazy delete    | PQ (max) + PQ (min)     |

---

### Final Tips

> [!TIP]
> **INTERVIEW TIPS**
> 1. Always clarify: "Do I need min or max?" before coding  
> 2. Java PQ is MIN heap — say this out loud in interviews  
> 3. For "top K" → think min-heap of size K (counterintuitive!)  
> 4. For "median" → think TWO heaps immediately  
> 5. For "merge K sorted" → think min-heap of K heads  
> 6. For "greedy + dynamic choices" → think heap  
> 7. Don't use heap when sorting once suffices  
> 8. Integer.compare(a,b) is safer than a - b (overflow!)  
> 9. TreeMap is a viable alternative when you need remove(obj) in O(log n)  
> 10. Practice drawing the heap array ↔ tree correspondence  

---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem                   | Link                                                         | Technique                 | Difficulty  |
| ------------------------- | ------------------------------------------------------------ | ------------------------- | ----------- |
| Polycarp and Bad Segments | [CF 1530C](https://codeforces.com/problemset/problem/1530/C) | Priority Queue + sweep    | ⭐⭐ Medium |
| Potions (Easy Version)    | [CF 1526C](https://codeforces.com/problemset/problem/1526/C) | Greedy + min-heap         | ⭐⭐ Medium |
| Hearthstone               | [CF 1830D](https://codeforces.com/problemset/problem/1830/D) | Two heaps (max + ordered) | ⭐⭐⭐ Hard |
| Ants                      | [CF 4D](https://codeforces.com/problemset/problem/4/D)       | PQ with custom comparator | ⭐⭐ Medium |

---

## 🌍 Real-World Applications of Heaps

| Technique                 | Real-World System            | How It's Used                                                         |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| **Min-Heap (top-K)**      | Media stream recommendations | Keep top-K trending items; worst item evicted when new one arrives    |
| **Max-Heap (scheduling)** | OS process scheduler         | Highest priority process always picked in O(log n)                    |
| **Dijkstra's algorithm**  | Google Maps / GPS navigation | Min-heap on shortest-known-distance; reach destination fastest        |
| **Two-Heap (median)**     | Data stream processing       | Kafka consumer tracking real-time median latency with two heaps       |
| **Heap-based merge sort** | Database query execution     | Merge N sorted result sets (from N partitions) using N-way heap merge |

```
🔥 HOW DIJKSTRA WORKS IN GOOGLE MAPS:
   PriorityQueue<int[]> pq = new PriorityQueue<>((a,b)->a[1]-b[1]);
   pq.offer(new int[]{start, 0});  // {node, distance}
   while (!pq.isEmpty()) {
       int[] cur = pq.poll();  // Always pick closest unvisited
       // ... expand neighbors
   }
   "This exact code runs (optimized) every time you request directions."
```

---

### Historical Evolution

J. W. J. Williams introduced the binary heap with heapsort in 1964, and Robert Floyd's *Treesort 3* (ACM Algorithm 245, 1964) added linear-time heap construction. Binomial heaps (Vuillemin, 1978), Fibonacci heaps (Fredman and Tarjan, FOCS 1984, journal 1987) and pairing heaps (Fredman, Sedgewick, Sleator and Tarjan, 1986) followed. Fibonacci heaps give Dijkstra an `O(E + V log V)` bound, though binary heaps usually win in practice.

- **Williams — 1964**: Binary heap and heapsort
- **Floyd — 1964**: `O(n)` heap construction
- **Vuillemin — 1978**: Binomial heaps
- **Fredman & Tarjan — 1984/1987**: Fibonacci heaps

### Production Reality

**Heap and Priority Queue** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Fibonacci heap amortization assumptions violated.** Fibonacci heaps provide O(1) amortized insert but O(log n) worst-case delete-min. In latency-critical systems where worst-case guarantees matter (real-time trading, control systems), the theoretical amortization breaks down under adversarial input patterns. Illustrative impact: HFT systems experience sporadic 50-100ms pauses when Fibonacci heap restructuring kicks in, costing millions in missed trades.

**Failure mode 2: O(n log n) when O(n) partial sort suffices.** For "top-K" problems where K << n, heapifying all n elements costs O(n) then extracting K costs O(k log n) = O(n + k log n). A full sort with `Arrays.sort()` is O(n log n) — same asymptotic complexity but with better constant factors and cache locality. Illustrative impact: recommendation systems processing billions of items waste CPU cycles; latency spikes affect user experience.

**Failure mode 3: Comparator asymmetry violations.** Custom comparators that violate antisymmetry (if `compare(a,b) < 0`, then `compare(b,a)` must be > 0) or transitivity cause undefined heap behavior. Java's `PriorityQueue` tolerates some violations until critical operations trigger unpredictable tree shapes. Illustrative impact: priority schedulers may deadlock or livelock; job ordering becomes non-deterministic across runs.

**Debug workflow:** (1) After heap operations, verify the heap property programmatically by checking each parent is <= children; (2) For top-K, use `Collections.sort()` or `Arrays.sort()` instead of heap when K > n/2 — sorting is faster in practice; (3) Ensure comparator returns 0 ONLY for truly equal elements; if transitivity is suspect, log comparator outputs during development; (4) Consider `PriorityBlockingQueue` for thread-safe production use.

**Real-world anchor:** Timers are usually heap-based: Java's `ScheduledThreadPoolExecutor` keeps tasks in a heap-ordered delay queue and the Go runtime keeps timers in a 4-ary heap, so "next timer to fire" is an `O(1)` peek and insertion is `O(log n)`.

---

[← Easy Problems](02_easy_problems.md) | [Chapter overview](../16_Heap.md)
