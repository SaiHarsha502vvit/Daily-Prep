# 12.3 String Greedy

> **Navigation**: [← 12.2 Array Greedy](03_array_greedy.md) | [Chapter overview](../13_Greedy.md)
> Page 4 of 4 in **Greedy**


**Pattern:** Process characters with greedy rules based on frequency or position.
**Partition Labels:** Track last occurrence of each char. Extend partition end to max last occurrence.
**Task Scheduler:** Most frequent task determines idle slots. Fill idle slots with other tasks.

## Problem 198: Partition Labels

**LeetCode 763** 🔗 https://leetcode.com/problems/partition-labels/

```
┌────────────────────────────────────────────────────────────────┐
│  PARTITION LABELS - Max partitions with unique chars           │
├────────────────────────────────────────────────────────────────┤
│  s = "ababcbacadefegdehijhklij"                                │
│                                                                │
│  Partition such that each letter appears in at most one part:  │
│  "ababcbaca" | "defegde" | "hijhklij"                          │
│       9           7           8                                │
│                                                                │
│  Output: [9, 7, 8]                                             │
│                                                                │
│  Greedy: Track last occurrence of each char                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> partitionLabels(String s) {
    // Find last occurrence of each character
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;

    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);

        if (i == end) {
            result.add(end - start + 1);
            start = i + 1;
        }
    }

    return result;
}
```

---

## Problem 199: Task Scheduler

**LeetCode 621** 🔗 https://leetcode.com/problems/task-scheduler/

```
┌────────────────────────────────────────────────────────────────┐
│  TASK SCHEDULER - Min time with cooldown                       │
├────────────────────────────────────────────────────────────────┤
│  tasks = ["A","A","A","B","B","B"], n = 2                      │
│                                                                │
│  Must wait n intervals before same task again                  │
│                                                                │
│  A → _ → _ → A → _ → _ → A                                     │
│  A → B → _ → A → B → _ → A → B                                 │
│  A → B → idle → A → B → idle → A → B                           │
│                                                                │
│  Output: 8 intervals                                           │
│                                                                │
│  Formula: (maxFreq - 1) * (n + 1) + countMaxFreq               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char task : tasks) {
        freq[task - 'A']++;
    }

    int maxFreq = 0;
    int countMax = 0;

    for (int f : freq) {
        if (f > maxFreq) {
            maxFreq = f;
            countMax = 1;
        } else if (f == maxFreq) {
            countMax++;
        }
    }

    // Formula: (maxFreq - 1) * (n + 1) + countMaxFreq
    int slots = (maxFreq - 1) * (n + 1) + countMax;

    return Math.max(slots, tasks.length);
}
```

---

🔬 **Section Challenge — 12.3 String Greedy**

**Challenge 1 (String Greedy — Task Scheduler):** LC 621: Task Scheduler. Tasks A-Z with cooldown n. **Who** determines the minimum time? **What** greedy choice maximizes CPU utilization?

<details><summary>Answer</summary>

**Greedy choice:** Always schedule the task with the HIGHEST remaining frequency. After each task, wait for cooldown before scheduling the same task again. Fill idle slots with the next most frequent tasks. **Formula (no simulation needed):** `time = max(n_tasks, (max_freq - 1) * (n + 1) + count_max_freq)`. Where `max_freq` = frequency of most common task, `count_max_freq` = number of tasks with that frequency, `n` = cooldown. **Why:** The most frequent task creates "mandatory idle" slots: you need `(max_freq - 1)` cooldown gaps of size `n`. Each gap can be filled with other tasks. If total tasks exceed the formula (many different tasks fill all gaps), no idle time is needed. **Who determines minimum:** The most frequent task acts as the bottleneck. All other tasks either fill gaps or extend beyond the minimum frame. **Example:** Tasks `[A=3, B=3, C=2]`, n=2. `max_freq=3`, `count_max=2`. Answer = `max(8, (3-1)*(2+1)+2) = max(8, 8) = 8`. Sequence: `A B C A B C A B`.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 12.4 Math Greedy

### Problem 200: Maximum Subarray (Kadane's - also DP)

**LeetCode 53** 🔗 https://leetcode.com/problems/maximum-subarray/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM SUBARRAY - Kadane's as Greedy                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]                        │
│                                                                │
│  Greedy choice: At each position, decide to:                   │
│  - Extend previous subarray, OR                                │
│  - Start fresh from current element                            │
│                                                                │
│  If previous sum is negative, start fresh!                     │
│                                                                │
│  Max subarray: [4, -1, 2, 1] = 6                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        // Greedy: extend or start fresh
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}
```

---

### Problem 201: Best Time to Buy and Sell Stock II

**LeetCode 122** 🔗 https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  STOCK II - Multiple transactions allowed                      │
├────────────────────────────────────────────────────────────────┤
│  prices = [7, 1, 5, 3, 6, 4]                                   │
│                                                                │
│      7                                                         │
│       \    5       6                                           │
│        \  /\      /\                                           │
│         1   \   /    4                                         │
│              3                                                 │
│                                                                │
│  Buy at 1, sell at 5: profit = 4                               │
│  Buy at 3, sell at 6: profit = 3                               │
│  Total: 7                                                      │
│                                                                │
│  Greedy: Collect ALL positive differences                      │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxProfit(int[] prices) {
    int profit = 0;

    for (int i = 1; i < prices.length; i++) {
        // Greedy: take every positive difference
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }

    return profit;
}
```

---

---

🔬 **Section Challenge — 12.4 Math Greedy**

**Challenge 1 (Math Greedy — Digit Maximization):** Given non-negative integer `n`, remove `k` digits to make the largest possible number. **Who** makes the greedy choice? **What** local decision guarantees the globally maximum result?

<details><summary>Answer</summary>

**Greedy choice:** To maximize, we want the LARGEST possible digit in each position from left to right. Use a monotonic decreasing stack: scan digits left to right. While the stack is non-empty AND top of stack < current digit AND we still have removals left — pop the stack (remove that digit). Push the current digit. **Why this is locally optimal = globally optimal:** If digit `d[i]` > `d[i-1]` (current digit is larger than the previous), removing `d[i-1]` gives us a larger leading digit in that position. A larger leading digit is ALWAYS better than any combination of smaller digits later. **Example:** `n = 1432219`, `k = 3`. Stack trace: push 1, push 4 (4>1, push), pop 4 and push 3? No — 3<4, push 3. Push 2... pop 3 (3>2, remove count=1), pop 4... wait: scan: `1 4 3 2 2 1 9`. On seeing `9`: pop `1` (k--), pop `2` (k--), pop `2` (k--). Result: `4 3 9` → `439`. **Who makes the choice:** A monotonic decreasing stack scan, O(n). Remove the smallest-place digit when a larger digit appears to its right.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 🏆 Competitive Programming — Codeforces Problems

| Problem                  | Link                                                         | Technique               | Difficulty  |
| ------------------------ | ------------------------------------------------------------ | ----------------------- | ----------- |
| Taxi                     | [CF 158B](https://codeforces.com/problemset/problem/158/B)   | Greedy pairing          | ⭐ Easy     |
| Vasya and String         | [CF 676C](https://codeforces.com/problemset/problem/676/C)   | Greedy + sliding window | ⭐⭐ Medium |
| Petya and Strings        | [CF 96A](https://codeforces.com/problemset/problem/96/A)     | Lexicographic greedy    | ⭐ Easy     |
| Potions                  | [CF 1526C](https://codeforces.com/problemset/problem/1526/C) | Greedy + min-heap       | ⭐⭐ Medium |
| Minimize the Permutation | [CF 1968B](https://codeforces.com/problemset/problem/1968/B) | Greedy on array         | ⭐⭐ Medium |
| Petya and Exam           | [CF 832B](https://codeforces.com/problemset/problem/832/B)   | Greedy time scheduling  | ⭐⭐ Medium |

---

## 🌍 Real-World Applications of Greedy Algorithms

| Technique                                           | Real-World System                  | How It's Used                                                         |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| **Interval scheduling (earliest deadline)**         | Calendar apps / meeting schedulers | Pack maximum non-overlapping meetings in a day                        |
| **Huffman coding**                                  | ZIP, gzip, JPEG compression        | Always merge the two least-frequent characters first                  |
| **Prim's/Kruskal's (MST)**                          | Network infrastructure planning    | Minimum cable to connect all offices                                  |
| **Dijkstra's (greedy relaxation)**                  | GPS navigation                     | At each step, pick the closest unvisited node                         |
| **Job scheduling (OS)**                             | CPU / task schedulers              | Shortest-job-first scheduling minimizes average wait time             |
| **Coin change (denominations designed for greedy)** | Currency systems worldwide         | US/EU coins designed so greedy works (unlike arbitrary denominations) |

```
🔥 HUFFMAN IN EVERY FILE YOU DOWNLOAD:
   Characters: 'e'→15%, 't'→10%, 'a'→8%, others less frequent

   Huffman greedy: always merge 2 rarest nodes into one
   Result: 'e' → "0" (1 bit), 't' → "10" (2 bits), rare chars → longer codes

   On average: ~2.5 bits/char instead of 8 bits = 68% compression
   "This is in EVERY .zip file, every HTTP gzip response, every JPEG"
```

---

---

🔬 **Section Challenge — 🌍 Real-World Applications of Greedy Algorithms**

**Challenge 1 (Huffman Coding Greedy):** Huffman coding uses a greedy algorithm to build a prefix-free encoding tree. **Who** proves that always merging the two lowest-frequency nodes is optimal? **What** property makes prefix-free codes possible?

<details><summary>Answer</summary>

**Who proves it optimal:** Exchange argument. In any optimal code tree, the two symbols with lowest frequency must be deepest (assigned longest codes). Swapping shallower symbols with the two lowest-frequency symbols into deeper positions reduces or maintains total weighted path length. Therefore always merging the two lowest first is optimal. **Greedy algorithm:** Min-heap of (frequency, node). Pop two minimums, merge into parent with combined frequency, push back. Repeat until one node. This is O(n log n) with a heap. **Prefix-free property:** In the Huffman tree, codes are only assigned to LEAF nodes. Since no leaf is an ancestor of another leaf, no code is a prefix of another. Bit strings are read left (0) / right (1) until a leaf is reached — unambiguous decoding. **Why greedy works here:** The cost function (sum of frequency \* depth) has "optimal substructure" — an optimal tree for n symbols contains optimal sub-trees for any subset. Combined with the greedy-choice property (always merge cheapest pair), this guarantees global optimality. Huffman is one of the few greedy algorithms with a formal optimality proof.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

---

### Historical Evolution

Early greedy successes: Huffman coding (1952), Kruskal's spanning-tree algorithm (1956), Prim's (1957, after Jarník 1930) and Dijkstra's shortest paths (1959). The theory of *why* greedy works developed through matroids (Whitney 1935; Rado 1957; Edmonds 1971 showed greedy is optimal exactly on matroids). Exchange arguments are the standard proof technique for interval scheduling and similar problems.

- **Huffman — 1952**: Optimal prefix codes by greedy merging
- **Kruskal — 1956**: Minimum spanning tree
- **Rado / Edmonds — 1957 / 1971**: Matroids and greedy optimality

### Production Reality

**Greedy Algorithms** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Greedy optimality violation.** The classic counterexample is 0/1 knapsack: items with weights (10, 20, 30) and values (60, 100, 120) with capacity 50. Greedy by value/weight ratio picks item 1 (value 60) and is stuck — total value 60. Dynamic programming gets items 2+3 for value 220. Illustrative impact: incorrect optimization results in revenue loss, resource overallocation, or scheduling failures when greedy is applied outside its valid domain.

**Failure mode 2: Comparator overflow in priority queues.** Dijkstra implementations commonly use `(dist[u] - dist[v])` for comparison. With distances reaching Integer.MAX_VALUE, subtracting a small distance from MAX_VALUE causes integer overflow, yielding negative values that corrupt the min-heap ordering. Illustrative impact: a corrupted heap order produces wrong shortest paths.

**Failure mode 3: Negative-weight edge handling.** Dijkstra's algorithm with a standard min-heap silently produces wrong shortest paths on graphs with negative-weight edges. Illustrative impact: GPS systems misroute vehicles near elevation changes; financial arbitrage systems compute incorrect paths. Bellman-Ford or SPFA must be used instead.

**Debug workflow:** Before committing to greedy: (1) formally prove the greedy-choice property — every local optimum leads to a global optimum; (2) prove optimal substructure — optimal solution contains optimal solutions to subproblems; (3) test the counterexample case: fractional vs. indivisible items; (4) use `Integer.compare(a, b)` instead of `a - b` in comparators to prevent overflow; (5) verify no negative weights exist before using Dijkstra; otherwise switch to Bellman-Ford.

**Real-world anchor:** Allocators and schedulers commonly use greedy bin-packing heuristics such as first-fit or best-fit. They are fast but only approximately optimal (first-fit decreasing is within 11/9 of optimal plus a constant), which is why capacity planners keep headroom.

---

[← 12.2 Array Greedy](03_array_greedy.md) | [Chapter overview](../13_Greedy.md)
