# 🧩 Part 1: Easy Problems

> **Navigation**: [← 16. Heap / Priority Queue — Complete…](01_heap_priority_queue_complete_problem_guide.md) | [Chapter overview](../16_Heap.md) | [10. [Furthest Building You Can… →](03_furthest_building_you_can_reach_https.md)
> Page 2 of 3 in **Heap**


```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         EASY — 5 PROBLEMS                                    ║
║  Build intuition: direct heap usage, simple simulations                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 1. [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) (LC 703) ⭐ Easy

**Companies**: Amazon, Facebook, Google  
**Pattern**: Min-heap of size K

**Problem**: Design a class that finds the kth largest element in a stream. Implement `KthLargest(int k, int[] nums)` and `int add(int val)`.

**Key Insight**: A min-heap of size k always has the kth largest at its root. Anything smaller gets discarded — we only keep the k largest seen so far.

**Approach**:

1. Maintain a min-heap of capacity k
2. On `add(val)`: push val, if size > k then poll (removes smallest)
3. The root of the heap IS the kth largest — peek() returns the answer
4. WHY: By keeping only k elements and removing the smallest, we guarantee the heap contains the top-k elements, and the min of those is the kth largest.

**Solution**:

```java
class KthLargest {
    private PriorityQueue<Integer> minHeap;
    private int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        this.minHeap = new PriorityQueue<>();
        for (int num : nums) {
            add(num);
        }
    }

    public int add(int val) {
        minHeap.offer(val);
        if (minHeap.size() > k) {
            minHeap.poll(); // Remove smallest — not in top k
        }
        return minHeap.peek(); // Kth largest is the min of top-k
    }
}
```

**Complexity**: Time O(n log k) for constructor, O(log k) per add. Space O(k).  
**Why This Works**: The min-heap of size k acts as a "filter" — only the k largest survive. The smallest survivor (root) is by definition the kth largest.

---

## 2. [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/) (LC 1046) ⭐ Easy

**Companies**: Amazon, Google  
**Pattern**: Max-heap simulation

**Problem**: Smash the two heaviest stones together. If equal, both destroyed. If not, remaining = difference. Return the weight of the last stone (or 0).

**Key Insight**: We always need the two largest — a max-heap gives us both in O(log n) per extraction.

**Approach**:

1. Put all stones in a max-heap
2. While heap has 2+ stones: poll two largest, if different push difference back
3. Return remaining stone or 0

**Solution**:

```java
class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int s : stones) maxHeap.offer(s);

        while (maxHeap.size() > 1) {
            int first = maxHeap.poll();   // Heaviest
            int second = maxHeap.poll();  // Second heaviest
            if (first != second) {
                maxHeap.offer(first - second);
            }
        }
        return maxHeap.isEmpty() ? 0 : maxHeap.peek();
    }
}
```

**Complexity**: Time O(n log n), Space O(n).  
**Why This Works**: Max-heap invariant ensures we always smash the two heaviest. Each operation reduces stone count by at least 1, so we do at most n iterations.

---

## 3. [Sort Array by Increasing Frequency](https://leetcode.com/problems/sort-array-by-increasing-frequency/) (LC 1636) ⭐ Easy

**Companies**: Amazon, Bloomberg  
**Pattern**: Frequency count + custom sort / heap

**Problem**: Sort array by frequency (ascending). For same frequency, sort by value descending.

**Key Insight**: Count frequencies, then use a custom comparator: primary key = frequency ascending, secondary key = value descending.

**Approach**:

1. Count frequencies with a HashMap
2. Use a PriorityQueue with custom comparator: if freq differs → lower freq first; if same freq → larger value first
3. Poll all elements into result

**Solution**:

```java
class Solution {
    public int[] frequencySort(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);

        // Min-heap by freq; if tie, max value first
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> {
            if (a[1] != b[1]) return a[1] - b[1]; // Lower freq first
            return b[0] - a[0];                     // Higher value first
        });

        for (var entry : freq.entrySet()) {
            pq.offer(new int[]{entry.getKey(), entry.getValue()});
        }

        int[] result = new int[nums.length];
        int idx = 0;
        while (!pq.isEmpty()) {
            int[] pair = pq.poll();
            for (int i = 0; i < pair[1]; i++) {
                result[idx++] = pair[0];
            }
        }
        return result;
    }
}
```

**Complexity**: Time O(n log n), Space O(n).  
**Why This Works**: The heap enforces the two-level ordering, and we expand each (value, count) pair into the output array.

---

## 4. [Relative Ranks](https://leetcode.com/problems/relative-ranks/) (LC 506) ⭐ Easy

**Companies**: Google, Amazon  
**Pattern**: Max-heap for ranking

**Problem**: Given scores of athletes, return their ranks as ["Gold Medal", "Silver Medal", "Bronze Medal", "4", "5", ...].

**Key Insight**: We need to assign ranks by descending score. A max-heap gives us scores in order; we pair each score with its original index.

**Approach**:

1. Push (score, index) into a max-heap
2. Poll in order; assign rank labels for top 3, then "4", "5", etc.
3. Place each label at the original index

**Solution**:

```java
class Solution {
    public String[] findRelativeRanks(int[] score) {
        int n = score.length;
        PriorityQueue<int[]> maxHeap = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        for (int i = 0; i < n; i++) {
            maxHeap.offer(new int[]{score[i], i});
        }

        String[] result = new String[n];
        int rank = 1;
        while (!maxHeap.isEmpty()) {
            int[] top = maxHeap.poll();
            int idx = top[1];
            switch (rank) {
                case 1: result[idx] = "Gold Medal"; break;
                case 2: result[idx] = "Silver Medal"; break;
                case 3: result[idx] = "Bronze Medal"; break;
                default: result[idx] = String.valueOf(rank);
            }
            rank++;
        }
        return result;
    }
}
```

**Complexity**: Time O(n log n), Space O(n).  
**Why This Works**: Max-heap naturally gives us the ranking order. We track original indices to place ranks correctly.

---

## 5. [Minimum Cost to Connect Sticks](https://leetcode.com/problems/minimum-cost-to-connect-sticks/) (LC 1167) ⭐ Easy

**Companies**: Amazon  
**Pattern**: Min-heap greedy (Huffman-like)

**Problem**: Given sticks of various lengths, connect any two sticks at cost = sum of their lengths. Find minimum total cost to connect all sticks into one.

**Key Insight**: This is the Huffman coding problem! Always merge the two smallest to minimize cost. A min-heap efficiently gives us the two smallest.

**Approach**:

1. Put all stick lengths in a min-heap
2. While heap has 2+ sticks: poll two smallest, add their sum as cost, push sum back
3. Return total cost
4. WHY greedy works: merging small sticks early means they get "counted" in fewer subsequent merges, minimizing total cost.

**Solution**:

```java
class Solution {
    public int connectSticks(int[] sticks) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int s : sticks) minHeap.offer(s);

        int totalCost = 0;
        while (minHeap.size() > 1) {
            int first = minHeap.poll();
            int second = minHeap.poll();
            int cost = first + second;
            totalCost += cost;
            minHeap.offer(cost);
        }
        return totalCost;
    }
}
```

**Complexity**: Time O(n log n), Space O(n).  
**Why This Works**: Greedy choice: always combining the two cheapest sticks is provably optimal (same argument as Huffman coding). Each stick's length is added to the total once per merge it participates in; merging small ones first minimizes this.

---

🔬 **Section Challenge — After Easy Problems**

**Challenge 1 (Reasoning):** Kth Largest: why use a SIZE-K min-heap instead of a max-heap or full sort?

<details><summary>Answer</summary>

Goal: find the Kth largest. Maintain a min-heap of size K. When heap size exceeds K, poll the minimum (too small to be top-K). At the end, the heap root IS the Kth largest. Time: O(N log K) — better than O(N log N) sort when K << N. Max-heap approach: push all, pop K times = O(N + K log N). Min-heap of K is faster for large N, small K. Key insight: by keeping only the K largest seen so far, the minimum of those K is the answer.

</details>

**Challenge 2 (Reasoning):** `lastStoneWeight` uses a max-heap. Why would a min-heap give wrong answers?

<details><summary>Answer</summary>

The problem requires always smashing the TWO HEAVIEST stones. Max-heap gives O(1) access to the maximum. Min-heap gives the minimum — the opposite of what's needed. The greedy correctness relies on always taking the current global maximum pair; taking minimums would leave heavy stones at the end and give incorrect results.

</details>

## 🧩 Part 2: Medium Problems

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        MEDIUM — 10 PROBLEMS                                  ║
║  Core patterns: Top-K, Two Heaps, Merge K, Greedy + Heap                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1. [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) (LC 215) ⭐ Medium

**Companies**: Facebook, Amazon, Google, Microsoft, Apple  
**Pattern**: Min-heap of size K (or Quickselect)

**Problem**: Find the kth largest element in an unsorted array.

**Key Insight**: Maintain a min-heap of size k. After processing all elements, the root is the kth largest. Alternative: Quickselect achieves O(n) average.

**Approach (Heap)**:

1. Iterate through all elements
2. Push each into a min-heap
3. If heap size exceeds k, poll the minimum (it's not in the top-k)
4. After all elements, peek() is the answer

**Solution**:

```java
class Solution {
    // Approach 1: Min-heap — O(n log k) time, O(k) space
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int num : nums) {
            minHeap.offer(num);
            if (minHeap.size() > k) {
                minHeap.poll();
            }
        }
        return minHeap.peek();
    }

    // Approach 2: Quickselect — O(n) average, O(n²) worst
    public int findKthLargestQuickSelect(int[] nums, int k) {
        int target = nums.length - k; // kth largest = (n-k)th smallest
        return quickSelect(nums, 0, nums.length - 1, target);
    }

    private int quickSelect(int[] nums, int lo, int hi, int target) {
        int pivot = nums[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (nums[j] <= pivot) {
                swap(nums, i, j);
                i++;
            }
        }
        swap(nums, i, hi);

        if (i == target) return nums[i];
        else if (i < target) return quickSelect(nums, i + 1, hi, target);
        else return quickSelect(nums, lo, i - 1, target);
    }

    private void swap(int[] nums, int a, int b) {
        int tmp = nums[a]; nums[a] = nums[b]; nums[b] = tmp;
    }
}
```

**Complexity**: Heap: Time O(n log k), Space O(k). Quickselect: Time O(n) avg, Space O(1).  
**Why This Works**: The min-heap approach is the same "top-k filter" as LC 703. Quickselect partitions around a pivot and only recurses into the half containing the target index.

---

## 2. [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) (LC 347) ⭐ Medium

**Companies**: Amazon, Facebook, Google, Microsoft, Uber  
**Pattern**: Frequency count + Min-heap of size K (or Bucket sort)

**Problem**: Given an integer array and k, return the k most frequent elements.

**Key Insight**: Count frequencies, then use a min-heap of size k keyed by frequency. The k elements remaining are the top-k frequent.

**Approach**:

1. Count frequencies with HashMap
2. Push each (element, freq) into a min-heap sorted by frequency
3. If heap size > k, poll (removes least frequent among candidates)
4. Remaining k elements are the answer

**Solution**:

```java
class Solution {
    // Approach 1: Min-heap — O(n log k)
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);

        // Min-heap by frequency
        PriorityQueue<Map.Entry<Integer, Integer>> pq =
            new PriorityQueue<>((a, b) -> a.getValue() - b.getValue());

        for (var entry : freq.entrySet()) {
            pq.offer(entry);
            if (pq.size() > k) pq.poll();
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = pq.poll().getKey();
        }
        return result;
    }

    // Approach 2: Bucket sort — O(n) time
    public int[] topKFrequentBucket(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);

        @SuppressWarnings("unchecked")
        List<Integer>[] buckets = new ArrayList[nums.length + 1];
        for (var entry : freq.entrySet()) {
            int f = entry.getValue();
            if (buckets[f] == null) buckets[f] = new ArrayList<>();
            buckets[f].add(entry.getKey());
        }

        int[] result = new int[k];
        int idx = 0;
        for (int i = buckets.length - 1; i >= 0 && idx < k; i--) {
            if (buckets[i] != null) {
                for (int val : buckets[i]) {
                    result[idx++] = val;
                    if (idx == k) break;
                }
            }
        }
        return result;
    }
}
```

**Complexity**: Heap: O(n log k), Space O(n). Bucket: O(n), Space O(n).  
**Why This Works**: Min-heap of size k keeps only the k most frequent. Bucket sort exploits that frequencies are bounded by n, giving O(n) time.

---

## 3. [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) (LC 973) ⭐ Medium

**Companies**: Facebook, Amazon, Google  
**Pattern**: Max-heap of size K

**Problem**: Given an array of points, return the k closest to the origin.

**Key Insight**: Use a max-heap of size k sorted by distance. If a new point is closer than the farthest in our heap, swap it in.

**Approach**:

1. Use a max-heap keyed by squared distance (avoid sqrt for efficiency)
2. For each point, push it; if size > k, poll the farthest
3. Remaining k points are the closest

**Solution**:

```java
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // Max-heap by distance (so we can evict the farthest)
        PriorityQueue<int[]> maxHeap = new PriorityQueue<>(
            (a, b) -> (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1])
        );

        for (int[] p : points) {
            maxHeap.offer(p);
            if (maxHeap.size() > k) {
                maxHeap.poll(); // Remove the farthest point
            }
        }

        int[][] result = new int[k][2];
        for (int i = 0; i < k; i++) {
            result[i] = maxHeap.poll();
        }
        return result;
    }
}
```

**Complexity**: Time O(n log k), Space O(k).  
**Why This Works**: The max-heap keeps the k closest by always evicting the farthest among the current k+1 candidates. After scanning all points, only the k closest remain.

---

## 4. [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) (LC 295) ⭐ Medium/Hard

**Companies**: Amazon, Google, Facebook, Microsoft, Apple  
**Pattern**: Two Heaps (maxHeap for lower half, minHeap for upper half)

**Problem**: Design a data structure that supports `addNum(int num)` and `findMedian()` in O(log n) and O(1) respectively.

**Key Insight**: Split numbers into two halves. A max-heap holds the smaller half (so its root = max of smaller half). A min-heap holds the larger half (so its root = min of larger half). The median is at the boundary between these two heaps.

**Approach**:

1. Keep `maxHeap` (lower half) and `minHeap` (upper half)
2. Balance rule: `maxHeap.size()` = `minHeap.size()` or `maxHeap.size()` = `minHeap.size() + 1`
3. On `addNum`: always add to maxHeap first, then rebalance by moving maxHeap's top to minHeap if needed
4. On `findMedian`: if sizes equal, average of both roots; if maxHeap larger, its root

**Solution**:

```java
class MedianFinder {
    private PriorityQueue<Integer> maxHeap; // Lower half (max at top)
    private PriorityQueue<Integer> minHeap; // Upper half (min at top)

    public MedianFinder() {
        maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        minHeap = new PriorityQueue<>();
    }

    public void addNum(int num) {
        maxHeap.offer(num);
        // Ensure maxHeap's max <= minHeap's min
        minHeap.offer(maxHeap.poll());
        // Rebalance: maxHeap can be larger by at most 1
        if (minHeap.size() > maxHeap.size()) {
            maxHeap.offer(minHeap.poll());
        }
    }

    public double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.peek();
        }
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}
```

**Complexity**: Time O(log n) per add, O(1) per findMedian. Space O(n).  
**Why This Works**: The two heaps maintain a sorted partition. The max of the lower half and min of the upper half are always accessible in O(1), giving us the median directly.

---

## 5. [Reorganize String](https://leetcode.com/problems/reorganize-string/) (LC 767) ⭐ Medium

**Companies**: Amazon, Google, Facebook  
**Pattern**: Greedy + Max-Heap

**Problem**: Rearrange string so no two adjacent characters are the same. Return "" if impossible.

**Key Insight**: Greedily place the most frequent character, then the next most frequent. Use a max-heap to always pick the highest-frequency char available. After placing a char, hold it aside until the next placement.

**Approach**:

1. Count character frequencies
2. Push all (freq, char) into a max-heap
3. Each step: poll top char, append it, hold it aside
4. Before next step: push the previously held-aside char back (if freq > 0)
5. If heap is empty but we still have a held-aside char with freq > 0, return ""

**Solution**:

```java
class Solution {
    public String reorganizeString(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;

        // Max-heap: [frequency, character]
        PriorityQueue<int[]> maxHeap = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        for (int i = 0; i < 26; i++) {
            if (freq[i] > 0) {
                maxHeap.offer(new int[]{freq[i], i});
            }
        }

        StringBuilder sb = new StringBuilder();
        int[] prev = null; // Previously placed char (cooling down)

        while (!maxHeap.isEmpty()) {
            int[] curr = maxHeap.poll();
            // Push back the previous char if it still has remaining count
            if (prev != null && prev[0] > 0) {
                maxHeap.offer(prev);
            }
            sb.append((char)(curr[1] + 'a'));
            curr[0]--;
            prev = curr;
        }

        return sb.length() == s.length() ? sb.toString() : "";
    }
}
```

**Complexity**: Time O(n log 26) = O(n), Space O(26) = O(1).  
**Why This Works**: By always placing the most frequent available character and cooling down the last-placed character for one turn, we guarantee no adjacent duplicates (if a solution exists).

---

## 6. [Task Scheduler](https://leetcode.com/problems/task-scheduler/) (LC 621) ⭐ Medium

**Companies**: Facebook, Amazon, Google, Microsoft  
**Pattern**: Greedy + Heap (or math)

**Problem**: Given tasks with cooldown interval `n`, find the minimum time to execute all tasks. Same tasks need at least `n` intervals apart.

**Key Insight**: The most frequent task dictates the schedule. In each "round" of n+1 slots, greedily pick the most frequent available tasks. Idle slots fill the gaps.

**Approach**:

1. Count task frequencies, push into max-heap
2. Process in rounds of (n + 1) time units
3. Each round: poll up to n+1 tasks from heap, decrement their counts
4. Push back tasks that still have remaining count
5. Time for each round = max(n + 1, tasks executed) unless it's the last round

**Solution**:

```java
class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char t : tasks) freq[t - 'A']++;

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int f : freq) {
            if (f > 0) maxHeap.offer(f);
        }

        int time = 0;
        while (!maxHeap.isEmpty()) {
            List<Integer> temp = new ArrayList<>();
            int cycle = n + 1; // Each cycle is n+1 slots

            for (int i = 0; i < cycle && !maxHeap.isEmpty(); i++) {
                int count = maxHeap.poll();
                if (count > 1) temp.add(count - 1);
            }

            for (int t : temp) maxHeap.offer(t);

            // If heap is empty, this was the last cycle — only count actual tasks
            time += maxHeap.isEmpty() ? (cycle - (cycle - temp.size() - (n + 1 - cycle + temp.size()))) : cycle;
        }
        return time;
    }

    // Cleaner math approach:
    public int leastIntervalMath(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char t : tasks) freq[t - 'A']++;
        Arrays.sort(freq);

        int maxFreq = freq[25];
        int maxCount = 0; // How many tasks have the max frequency
        for (int f : freq) {
            if (f == maxFreq) maxCount++;
        }

        // (maxFreq - 1) full rounds of (n + 1) slots, plus final partial round
        int result = (maxFreq - 1) * (n + 1) + maxCount;
        return Math.max(result, tasks.length); // At minimum, we need tasks.length time
    }
}
```

**Complexity**: Time O(n \* total_tasks), Space O(26) = O(1).  
**Why This Works**: The math approach: the most frequent task creates (maxFreq - 1) gaps of size n. Other tasks fill these gaps. If all gaps are filled, total time = number of tasks.

---

## 7. [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) (LC 23) ⭐ Medium/Hard

**Companies**: Amazon, Facebook, Google, Microsoft, Apple  
**Pattern**: Min-heap of K heads

**Problem**: Merge k sorted linked lists into one sorted linked list.

**Key Insight**: At any point, the next smallest element must be the head of one of the k lists. A min-heap of size k gives us this in O(log k).

**Approach**:

1. Push the head of each non-null list into a min-heap
2. Poll the smallest node, add it to our result list
3. If that node has a next, push next into the heap
4. Repeat until heap is empty

**Solution**:

```java
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> minHeap = new PriorityQueue<>(
            (a, b) -> a.val - b.val
        );

        // Initialize: add all non-null heads
        for (ListNode head : lists) {
            if (head != null) minHeap.offer(head);
        }

        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;

        while (!minHeap.isEmpty()) {
            ListNode smallest = minHeap.poll();
            curr.next = smallest;
            curr = curr.next;
            if (smallest.next != null) {
                minHeap.offer(smallest.next);
            }
        }

        return dummy.next;
    }
}
```

**Complexity**: Time O(N log k) where N = total nodes across all lists. Space O(k).  
**Why This Works**: The heap always contains at most k items (one from each list). Each of the N nodes is pushed and polled exactly once, each operation costing O(log k).

---

## 8. [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/) (LC 451) ⭐ Medium

**Companies**: Amazon, Google, Bloomberg  
**Pattern**: Frequency count + Max-Heap

**Problem**: Sort a string by character frequency in descending order.

**Key Insight**: Count frequencies, then use a max-heap to pull characters from most to least frequent.

**Approach**:

1. Count character frequencies
2. Push (freq, char) pairs into a max-heap
3. Poll and append each character freq times

**Solution**:

```java
class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

        PriorityQueue<Map.Entry<Character, Integer>> maxHeap =
            new PriorityQueue<>((a, b) -> b.getValue() - a.getValue());
        maxHeap.addAll(freq.entrySet());

        StringBuilder sb = new StringBuilder();
        while (!maxHeap.isEmpty()) {
            var entry = maxHeap.poll();
            for (int i = 0; i < entry.getValue(); i++) {
                sb.append(entry.getKey());
            }
        }
        return sb.toString();
    }
}
```

**Complexity**: Time O(n log k) where k = distinct chars. Space O(n).  
**Why This Works**: The max-heap extracts characters in descending frequency order, which is exactly the desired output order.

---

## 9. [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) (LC 378) ⭐ Medium

**Companies**: Amazon, Google, Facebook  
**Pattern**: Min-heap BFS on matrix / Binary Search

**Problem**: Given an n × n matrix where each row and column is sorted, find the kth smallest element.

**Key Insight**: Treat it like merging n sorted lists (one per row). Use a min-heap initialized with the first element of each row, then expand rightward.

**Approach**:

1. Push (value, row, col) for the first element of each row into a min-heap
2. Poll k-1 times; each time, push the next element in that row (if exists)
3. The kth poll is the answer

**Solution**:

```java
class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        // [value, row, col]
        PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[0] - b[0]);

        // Initialize with first column of each row
        for (int r = 0; r < Math.min(n, k); r++) {
            minHeap.offer(new int[]{matrix[r][0], r, 0});
        }

        int result = 0;
        for (int i = 0; i < k; i++) {
            int[] top = minHeap.poll();
            result = top[0];
            int row = top[1], col = top[2];
            if (col + 1 < n) {
                minHeap.offer(new int[]{matrix[row][col + 1], row, col + 1});
            }
        }
        return result;
    }
}
```

**Complexity**: Time O(k log min(n, k)), Space O(min(n, k)).  
**Why This Works**: We're doing a BFS-like expansion across sorted rows. The min-heap ensures we always process the globally smallest unseen element next, guaranteeing the kth poll is the kth smallest.

---

[← 16. Heap / Priority Queue — Complete…](01_heap_priority_queue_complete_problem_guide.md) | [Chapter overview](../16_Heap.md) | [10. [Furthest Building You Can… →](03_furthest_building_you_can_reach_https.md)
