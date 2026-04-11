# 🗺️ Constraint → Algorithm Map — The Master Decision Guide

[⬅ The Interview Brain](01_The_Interview_Brain.md) | [📚 Index](00_INDEX.md) | [Next: Pattern Recognition Engine ➡](03_DSA_Pattern_Recognition_Engine.md)

---

> **"You don't choose the algorithm. The constraints choose it FOR you."**

This is the definitive, MIT-level guide to reading problem constraints and **instantly** knowing which algorithm to use. Every competitive programmer and Google engineer uses this unconsciously. This guide makes it conscious.

---

## Table of Contents
1. [The Operations Budget — Why Constraints Matter](#1-the-operations-budget)
2. [The Master Constraint Table — With 50+ Algorithms](#2-the-master-constraint-table)
3. [Deep Dive: Each Complexity Class](#3-deep-dive-each-complexity-class)
4. [Constraint Combinations — Multi-Variable Analysis](#4-constraint-combinations)
5. [SQL Constraint Analysis](#5-sql-constraint-analysis)
6. [System Design Constraint Analysis](#6-system-design-constraint-analysis)
7. [Practice Problems — Decode the Constraints](#7-practice-problems)

---

## 1. The Operations Budget

### The Fundamental Rule

```
Modern computers execute ~10⁸ simple operations per second (in Java).

Given constraint N, your algorithm MUST complete in < 10⁸ operations.

Therefore:
  If N = 10⁵ → you have budget for N × log(N) = 10⁵ × 17 ≈ 1.7 × 10⁶  ✅
  If N = 10⁵ → N² = 10¹⁰                                                ❌ TLE
  If N = 10³ → N² = 10⁶                                                  ✅
  If N = 10³ → N³ = 10⁹                                                  ❌ TLE (borderline)
```

### The Budget Calculator

```
┌───────────────────────────────────────────────────────────┐
│              OPERATIONS BUDGET CALCULATOR                   │
│                                                             │
│  Budget = 10⁸ ÷ (constant factor)                          │
│                                                             │
│  Language factors:                                          │
│    C/C++  → constant ≈ 1    → budget = 10⁸-10⁹            │
│    Java   → constant ≈ 3-5  → budget = 2×10⁷ to 10⁸      │
│    Python → constant ≈ 30   → budget = 3×10⁶              │
│                                                             │
│  Practical Java budgets:                                    │
│    Simple operations (add, compare)  → 10⁸                 │
│    HashMap operations                 → 5×10⁷              │
│    String operations                  → 2×10⁷              │
│    I/O heavy                          → 10⁶                │
└───────────────────────────────────────────────────────────┘
```

### Why This Matters — A Real Interview Scenario

```
Interviewer: "Given n integers (1 ≤ n ≤ 10⁶), find if any two sum to k."

Your brain should INSTANTLY think:
  n = 10⁶
  → O(n²) = 10¹² → WAY too slow
  → O(n log n) = 2 × 10⁷ → OK (sort + binary search)
  → O(n) = 10⁶ → Perfect (HashMap)

  "I'd use a HashSet for O(n) time. For each number x,
   check if (k - x) exists in the set."
```

### Theory Lens — Constraint Decoding As a Decision System

Interview speed comes from converting raw constraints into a deterministic algorithm filter.
Treat this as a four-step decision system:

1. Budget extraction:
Convert input bounds into an operation budget per test case.

2. Complexity elimination:
Discard complexity classes that exceed the budget before thinking about implementation details.

3. Structure matching:
Use problem structure (sorted data, graph edges, frequency needs, range updates, monotonic predicate) to pick candidate families.

4. Constant-factor sanity check:
Validate language/runtime overhead, memory limits, and hidden costs like hashing collisions, string copies, and I/O volume.

This process turns algorithm choice from intuition into repeatable reasoning, which is exactly what interviewers evaluate under time pressure.

---

## 2. The Master Constraint Table — With 50+ Algorithms

### Tier 1: O(1) — Constant Time [N = any]

**When**: Mathematical formula, direct lookup, amortized operations

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Math formula | Sum 1..n = n(n+1)/2 | "Sum of first N numbers" |
| Bit manipulation | XOR to find unique | "Single Number (all appear twice except one)" |
| HashMap lookup | Pre-computed answer | "Two Sum (second pass)" |
| Array index access | Direct addressing | "Find element at position k" |

```java
// Classic: Find the missing number in [0..n]
// Math: sum should be n*(n+1)/2, subtract actual sum
int missingNumber(int[] nums) {
    int n = nums.length;
    int expectedSum = n * (n + 1) / 2;
    int actualSum = 0;
    for (int x : nums) actualSum += x;
    return expectedSum - actualSum;
}
// O(n) to compute sum, but the INSIGHT is O(1) — math formula
```

---

### Tier 2: O(log n) — Logarithmic [N ≤ 10¹⁸]

**When**: Halving search space each step, exponentiation, balanced tree operations

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Binary Search (classic) | Find element in sorted array | "Search in Sorted Array" |
| Binary Search on Answer | Find minimum/maximum that satisfies condition | "Koko Eating Bananas" |
| Binary Exponentiation | Compute a^n mod m | "Pow(x, n)" |
| Segment Tree query | Range min/max/sum (after build) | "Range Sum Query" |
| Balanced BST ops | Insert/delete/search in TreeMap | "Sliding Window Median" |

```java
// Binary Search on Answer — The MOST underrated technique
// "What's the minimum speed to eat all bananas in H hours?"
int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = max(piles);          // Answer is in [1, max]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;     // Try speed = mid
        if (canFinish(piles, mid, h))      // Can we finish at speed mid?
            hi = mid;                       // Try slower
        else
            lo = mid + 1;                   // Need faster
    }
    return lo;
}

boolean canFinish(int[] piles, int speed, int h) {
    int hours = 0;
    for (int p : piles)
        hours += (p + speed - 1) / speed;  // ceil division
    return hours <= h;
}
// WHY this works: answer space is monotonic — if speed k works, k+1 also works
```

#### Binary Search on Answer — Recognition Guide

```
YOU SHOULD USE BINARY SEARCH ON ANSWER WHEN:

1. The answer is a NUMBER in a RANGE [min, max]
2. There exists a MONOTONIC CHECK function:
   - "Can I achieve this with value = X?" is either True/False
   - If True for X, then True for all X+1, X+2... (or vice versa)

KEYWORD TRIGGERS:
  "minimum MAXIMUM..."  → Binary Search on Answer
  "maximum MINIMUM..."  → Binary Search on Answer
  "minimize the maximum distance"
  "what's the minimum speed/capacity/time"
  "split array into k parts, minimize max sum"

EXAMPLES:
  ├─ Koko Eating Bananas → min speed where canFinish(speed) = true
  ├─ Split Array Largest Sum → min max-sum where canSplit(maxSum) = true
  ├─ Capacity To Ship Within D Days → min capacity where canShip(cap) = true
  ├─ Magnetic Force Between Balls → max min-distance where canPlace(dist) = true
  └─ Aggressive Cows → max min-distance where canArrange(dist) = true
```

---

### Tier 3: O(√n) — Square Root [N ≤ 10¹⁰]

**When**: Factor finding, block decomposition, some number theory

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Trial division | Find all factors | "Count divisors of N" |
| Square root decomposition | Block-based range queries | "Mo's algorithm" |
| Sieve of Eratosthenes (query) | Check if prime | "Count Primes" |

```java
// All factors of N in O(√n)
List<Integer> getFactors(int n) {
    List<Integer> factors = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            factors.add(i);
            if (i != n / i) factors.add(n / i);
        }
    }
    return factors;
}
```

---

### Tier 4: O(n) — Linear [N ≤ 10⁶ - 10⁷]

**When**: Single pass, HashMap/HashSet, counting, prefix sums

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Two Pointer (same direction) | Remove duplicates, partition | "Remove Duplicates from Sorted Array" |
| Two Pointer (opposite) | Pair finding in sorted | "Two Sum II (sorted)" |
| Sliding Window (fixed) | Max sum of k elements | "Max Average Subarray" |
| Sliding Window (variable) | Smallest subarray with sum ≥ k | "Minimum Size Subarray Sum" |
| Prefix Sum | Range sum queries | "Subarray Sum Equals K" |
| HashMap frequency | Count occurrences | "Top K Frequent Elements" (counting step) |
| HashSet existence | Find missing/duplicate | "Contains Duplicate" |
| Kadane's Algorithm | Maximum subarray sum | "Maximum Subarray" |
| Boyer-Moore Voting | Majority element | "Majority Element" |
| Dutch National Flag | 3-way partition | "Sort Colors" |
| Monotonic Stack | Next greater element | "Daily Temperatures" |
| Stack (matching) | Balanced parentheses | "Valid Parentheses" |
| Floyd's Cycle | Detect cycle in linked list | "Linked List Cycle" |
| Bucket Sort | Sort when range is known | "H-Index" |
| Counting Sort | Sort small range integers | "Sort Array by Frequency" |

```java
// Kadane's Algorithm — Maximum Subarray Sum
int maxSubArray(int[] nums) {
    int maxSoFar = nums[0], maxEndingHere = nums[0];
    for (int i = 1; i < nums.length; i++) {
        maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}
// KEY INSIGHT: At each position, either extend previous subarray or start new

// Monotonic Stack — Next Greater Element
int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // indices
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}
// KEY INSIGHT: Stack maintains decreasing order. When violated → found answer
```

---

### Tier 5: O(n log n) — Linearithmic [N ≤ 10⁵]

**When**: Sorting-based solutions, divide and conquer, balanced tree operations

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Merge Sort | Stable sort, count inversions | "Count of Smaller Numbers After Self" |
| Quick Sort | General purpose sort | "Sort an Array" |
| Heap Sort | In-place O(n log n) | "Sort an Array" |
| Sort + Two Pointer | 3Sum, closest pair | "3Sum" |
| Sort + Binary Search | Count pairs, find target | "Pairs with Difference K" |
| Sort + Greedy | Interval scheduling | "Non-overlapping Intervals" |
| TreeMap operations (n times) | Sliding window with order | "Sliding Window Median" |
| Priority Queue (n push/pop) | Merge K sorted lists | "Merge K Sorted Lists" |
| Segment Tree (build + query) | Range queries with updates | "Range Sum Query - Mutable" |
| LIS (patience sort) | Longest Increasing Subseq | "Longest Increasing Subsequence" |

```java
// Merge K Sorted Lists — Priority Queue approach
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );
    for (ListNode head : lists) {
        if (head != null) pq.offer(head);
    }
    ListNode dummy = new ListNode(0), curr = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();      // O(log k) per operation
        curr.next = node;
        curr = curr.next;
        if (node.next != null) pq.offer(node.next);
    }
    return dummy.next;
}
// Total: O(N log K) where N = total nodes, K = number of lists

// Approach for Longest Increasing Subsequence in O(n log n)
int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();    // tails[i] = smallest tail of IS of length i+1
    for (int num : nums) {
        int pos = Collections.binarySearch(tails, num);
        if (pos < 0) pos = -(pos + 1);         // insertion point
        if (pos == tails.size()) tails.add(num);
        else tails.set(pos, num);
    }
    return tails.size();
}
// KEY INSIGHT: Maintain array of smallest possible tails.
// Binary search to find where current element fits.
```

---

### Tier 6: O(n²) — Quadratic [N ≤ 3,000 - 5,000]

**When**: All pairs comparison, 2D DP tables, string matching

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| 2D DP | LCS, Edit Distance | "Longest Common Subsequence" |
| Floyd-Warshall | All-pairs shortest paths | "Network Delay Time" (small graph) |
| Brute force pairs | Small N comparisons | "3Sum" (with sort optimization) |
| Expand Around Center | All palindromic substrings | "Longest Palindromic Substring" |
| Manacher's | Palindrome detection (O(n)) | — |

```java
// Longest Common Subsequence — Classic 2D DP
int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1))
                dp[i][j] = dp[i - 1][j - 1] + 1;
            else
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}
// STATE: dp[i][j] = LCS of text1[0..i-1] and text2[0..j-1]
// TRANSITION: match → diagonal + 1, no match → max(up, left)
// SPACE OPTIMIZATION: Can use 1D array (rolling row) → O(n) space

// Edit Distance — Levenshtein Distance
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;   // delete all
    for (int j = 0; j <= n; j++) dp[0][j] = j;   // insert all
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1))
                dp[i][j] = dp[i-1][j-1];          // characters match
            else
                dp[i][j] = 1 + Math.min(dp[i-1][j-1],    // replace
                                Math.min(dp[i-1][j],       // delete
                                         dp[i][j-1]));     // insert
        }
    }
    return dp[m][n];
}
```

---

### Tier 7: O(n³) — Cubic [N ≤ 300 - 500]

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Floyd-Warshall | All-pairs shortest path | "All shortest paths" |
| Matrix Chain Multiplication | Optimal parenthesization | "Burst Balloons" |
| Interval DP | Merge operations | "Minimum Cost to Merge Stones" |

```java
// Floyd-Warshall — All Pairs Shortest Path
void floydWarshall(int[][] dist, int n) {
    for (int k = 0; k < n; k++)           // Intermediate vertex
        for (int i = 0; i < n; i++)        // Source
            for (int j = 0; j < n; j++)    // Destination
                if (dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
}
// KEY: Try every vertex as intermediate. Order of loops matters!
// k MUST be the outermost loop (ask interviewer why for bonus points)
```

---

### Tier 8: O(2ⁿ) — Exponential [N ≤ 20-25]

**When**: Subsets, bitmask DP, exhaustive search with pruning

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Bitmask DP | TSP, subset DP | "Shortest Superstring" |
| Backtracking with pruning | Constraint satisfaction | "N-Queens" |
| Meet in the Middle | Split and combine | "Closest Subsequence Sum" |
| Subset enumeration | All subsets | "Subsets" |

```java
// Bitmask DP — Traveling Salesman Problem
int tsp(int[][] dist, int n) {
    int[][] dp = new int[1 << n][n];
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
    dp[1][0] = 0;  // Start at city 0, visited = {0}

    for (int mask = 1; mask < (1 << n); mask++) {
        for (int u = 0; u < n; u++) {
            if (dp[mask][u] == Integer.MAX_VALUE) continue;
            if ((mask & (1 << u)) == 0) continue;  // u must be visited

            for (int v = 0; v < n; v++) {
                if ((mask & (1 << v)) != 0) continue;  // v not yet visited
                int newMask = mask | (1 << v);
                dp[newMask][v] = Math.min(dp[newMask][v],
                                          dp[mask][u] + dist[u][v]);
            }
        }
    }
    // Find minimum cost to visit all cities and return to start
    int allVisited = (1 << n) - 1;
    int ans = Integer.MAX_VALUE;
    for (int u = 1; u < n; u++)
        ans = Math.min(ans, dp[allVisited][u] + dist[u][0]);
    return ans;
}
// STATE: dp[mask][u] = min cost to visit cities in mask, ending at u
// mask is a BITMASK where bit i = 1 means city i is visited
```

---

### Tier 9: O(n!) — Factorial [N ≤ 10-12]

| Algorithm | Use Case | Example Problem |
|-----------|----------|-----------------|
| Permutation generation | All orderings | "Permutations" |
| Brute force assignment | All matchings | "N-Queens" |

```java
// N-Queens — Backtracking with pruning
List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = column
    boolean[] cols = new boolean[n];
    boolean[] diag1 = new boolean[2 * n]; // row - col + n
    boolean[] diag2 = new boolean[2 * n]; // row + col
    backtrack(result, queens, 0, n, cols, diag1, diag2);
    return result;
}

void backtrack(List<List<String>> result, int[] queens, int row, int n,
               boolean[] cols, boolean[] diag1, boolean[] diag2) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }
    for (int col = 0; col < n; col++) {
        int d1 = row - col + n, d2 = row + col;
        if (cols[col] || diag1[d1] || diag2[d2]) continue;  // PRUNE

        queens[row] = col;
        cols[col] = diag1[d1] = diag2[d2] = true;
        backtrack(result, queens, row + 1, n, cols, diag1, diag2);
        cols[col] = diag1[d1] = diag2[d2] = false;           // UNDO
    }
}
// PRUNING is what makes this tractable. Without it → n! attempts.
// With it → much fewer branches explored.
```

---






> 🔬 **Section Challenge — 2. The Master Constraint Table — With 50+ Algorithms**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 3. Deep Dive: Each Complexity Class

### O(n) Algorithms — The Art of Single Pass

```
WHY SINGLE PASS WORKS — The theoretical foundation:

   Information theory tells us: to process n elements,
   we MUST look at each element at least once → Ω(n) lower bound.

   If we can solve in one pass → we've achieved the theoretical minimum.

TECHNIQUES FOR SINGLE PASS:
  1. Running state (Kadane's) → maintain "best so far" and "best ending here"
  2. HashMap memoization → remember what we've seen
  3. Two pointers → process from both ends simultaneously
  4. Monotonic stack → maintain useful ordering
  5. Prefix computation → accumulate information left-to-right

THE GOLDEN QUESTION: "What information do I need from the LEFT
of position i to compute the answer AT position i?"
If the answer is O(1) information → you have an O(n) solution.
```

### O(n log n) — Why Sorting is the Swiss Army Knife

```
SORTING UNLOCKS:
  ├─ Binary search on sorted data → O(log n) per query
  ├─ Two pointer techniques → O(n) after sorting
  ├─ Greedy decisions → process in sorted order
  ├─ Duplicate detection → adjacent elements
  └─ Merge operations → combine sorted sequences

WHEN NOT TO SORT:
  ├─ When relative order matters (stability required)
  ├─ When n is small enough for O(n²) → sorting overhead not worth it
  ├─ When HashMap gives O(n) directly
  └─ When elements are already range-bounded → counting sort is O(n)
```

---

## 4. Constraint Combinations — Multi-Variable Analysis

### When There Are Two Variables

```
PROBLEM: "Given n items and m queries..."

Read BOTH constraints:
  n = 10⁵, m = 10⁵
  → Need O((n + m) log n) or better
  → Build structure in O(n log n), answer each query in O(log n)
  → Use: Segment Tree, Binary Indexed Tree, Sorted + BS

  n = 10⁵, m = 10
  → Can afford O(n) per query → O(n × m) = 10⁶ ✅
  → Simple: iterate and check for each query

  n = 10³, m = 10³
  → Can afford O(n × m) = 10⁶ ✅
  → Even O(n × m × log) works

EXAMPLE: "Given n strings each of length m..."
  n = 10⁴, m = 10³
  → Total characters = n × m = 10⁷
  → Can process all characters once → O(n × m)
  → Can sort all strings → O(n × m × log n)
  → CANNOT compare all pairs → O(n² × m) = 10¹¹ ❌
```

### When There's a Special Structure

```
INPUT IS A TREE:
  V = n, E = n-1
  → Traversal = O(n)
  → LCA queries = O(n) preprocessing + O(log n) per query

INPUT IS A GRAPH:
  V = n, E = m
  → BFS/DFS = O(n + m)
  → Dijkstra = O((n + m) log n)
  → Floyd-Warshall = O(n³) → only when n ≤ 400

INPUT IS A MATRIX (n × m):
  → BFS/DFS = O(n × m) [each cell visited once]
  → DP = O(n × m) [fill table]
  → Binary search per row = O(n × log m) [search in sorted matrix]
```

---






> 🔬 **Section Challenge — 4. Constraint Combinations — Multi-Variable Analysis**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 5. SQL Constraint Analysis

### How to Think About SQL Performance

```
TABLE SIZE → QUERY STRATEGY (same O-notation thinking!)

┌─────────────────────┬───────────────────────────────────────────────┐
│ Table Size          │ What You Can Afford                           │
├─────────────────────┼───────────────────────────────────────────────┤
│ < 1,000 rows        │ Full scan OK. Any query works.               │
│ 1K - 100K rows      │ Full scan OK for simple. Index for JOINs.    │
│ 100K - 1M rows      │ MUST have indexes. Watch for N+1 queries.    │
│ 1M - 100M rows      │ Index-only scans. Partitioning. No SELECT *. │
│ 100M - 1B rows      │ Partitioning mandatory. Pre-aggregation.     │
│ > 1B rows           │ Distributed (sharding). Column stores.       │
└─────────────────────┴───────────────────────────────────────────────┘
```

### SQL Query Execution = Algorithm Complexity

```
QUERY PATTERN         │ WHAT DB DOES              │ EQUIVALENT ALGORITHM
──────────────────────┼───────────────────────────┼─────────────────────
WHERE id = 5          │ B-Tree index seek          │ O(log n) binary search
WHERE name LIKE 'A%'  │ Index range scan           │ O(log n + k) range query
WHERE age > 25        │ Index range scan or seq    │ O(n) if no index
ORDER BY col          │ Sort or index scan         │ O(n log n) sort
GROUP BY col          │ Hash aggregate or sort     │ O(n) hash or O(n log n) sort
JOIN (indexed)        │ Nested loop + index lookup │ O(n × log m) per table
JOIN (no index)       │ Hash join or sort-merge    │ O(n + m) hash or O(n log n + m log m)
SUBQUERY correlated   │ Execute per outer row      │ O(n × inner_cost) — avoid!
WINDOW FUNCTION       │ Sort + single pass         │ O(n log n)
DISTINCT              │ Hash or sort               │ O(n) or O(n log n)
```

### Interview-Grade SQL Optimization Thinking

```
"Why is this query slow?"

Step 1: How many rows processed?
  → EXPLAIN ANALYZE → rows examined vs rows returned
  → If examined >> returned → missing index or wrong index

Step 2: What's the access pattern?
  → Seq Scan on large table? → Need index
  → Index Scan on low-selectivity column? → Index is actually slower
  → Nested Loop Join on unindexed FK? → Add index on FK

Step 3: Can we reduce the data early?
  → Push WHERE clauses closer to base tables
  → Use covering index (include all needed columns)
  → Partition to scan less data

Step 4: Can we pre-compute?
  → Materialized view for complex aggregations
  → Summary/fact table for reporting queries
  → Cache in application layer for hot queries

"I use the same constraint analysis as algorithms:
 N rows × M operations ≤ budget, where budget = response time SLA."
```

---






> 🔬 **Section Challenge — 5. SQL Constraint Analysis**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 6. System Design Constraint Analysis

### The Numbers Every Engineer Should Know

```
┌────────────────────────────────────────────────────────────────┐
│           LATENCY NUMBERS EVERY ENGINEER SHOULD KNOW            │
│                                                                  │
│  L1 cache reference                        0.5 ns               │
│  Branch mispredict                         5   ns               │
│  L2 cache reference                        7   ns               │
│  Mutex lock/unlock                         25  ns               │
│  Main memory reference                     100 ns               │
│  Compress 1K bytes with Zippy              3,000 ns  (3 μs)    │
│  Send 2K bytes over 1 Gbps network         20,000 ns (20 μs)   │
│  Read 1 MB sequentially from memory        250,000 ns (250 μs) │
│  Round trip within same datacenter         500,000 ns (0.5 ms)  │
│  Read 1 MB sequentially from SSD           1,000,000 ns (1 ms) │
│  Disk seek                                 10,000,000 ns (10 ms)│
│  Read 1 MB sequentially from disk          20,000,000 ns (20ms)│
│  Send packet CA → Netherlands → CA         150,000,000 ns(150ms)│
└────────────────────────────────────────────────────────────────┘

KEY RATIOS TO REMEMBER:
  Memory is 100× faster than SSD
  SSD is 20× faster than HDD
  Network within DC: 0.5ms round-trip
  Network across continents: 150ms round-trip
```

### 🧠 Theory Lens: System Design as Physics
When you drop from pure algorithms into System Design, the limiting factor stops being CPU Big O and becomes pure **Physics**. 

1. **The Speed of Light Limitation**: The reason continental network trips take 150ms is because light physically cannot travel faster through fiber optic glass. No algorithm can "optimize" this. The only solution is architectural—bringing data geographically closer to the user via CDNs or Edge replicas.
2. **Bandwidth vs Latency Paradox**: You can drive a truck full of hard drives across the country and move 100 Petabytes in two days (Massive Bandwidth, Catastrophic Latency). Network queries are the inverse (Fast Latency, Capped Bandwidth). True system design requires you to analytically separate these two attributes and optimize them independently.
3. **Mechanical vs Sequential IO**: Solid state drives (SSDs) and spinning disks perform terribly on random writes because of hardware block-mapping or mechanical arm movements. This physical limitation is *exactly why* databases like Cassandra or Kafka use sequential append-only logs. They mathematically convert random application writes into sequential physical writes, effectively cheating physics.

---

### Scale Estimation — Back-of-Envelope Calculations

```
DAILY ACTIVE USERS (DAU) → REQUESTS PER SECOND (QPS)

  DAU × actions_per_user ÷ 86,400 = avg QPS
  Peak QPS ≈ 2-3× avg QPS

  Example (Twitter-scale):
    300M DAU × 5 reads/day = 1.5B reads/day
    1.5B ÷ 86,400 = ~17,400 QPS average
    Peak = ~50,000 QPS

STORAGE ESTIMATION:
  Per record × records/day × retention period
  Example: 280 char tweet × 500M tweets/day × 365 days
  = 280 × 500M × 365 ≈ 51 TB/year (just text)

BANDWIDTH:
  QPS × response_size = bandwidth needed
  50,000 QPS × 1KB = 50 MB/s ≈ 400 Mbps

DB CAPACITY PLANNING:
  Single PostgreSQL: ~10K QPS reads, ~5K QPS writes
  Single Redis: ~100K QPS
  Single Kafka broker: ~100K messages/sec
```

### System Design Decision Map

```
CONSTRAINT SEEN → COMPONENT CHOSEN

┌──────────────────────┬────────────────────────────────────────────┐
│ Constraint           │ Design Decision                             │
├──────────────────────┼────────────────────────────────────────────┤
│ < 100 QPS            │ Single server, monolith is fine             │
│ 100 - 10K QPS        │ Load balancer + multiple app servers        │
│ 10K - 100K QPS       │ Caching (Redis), read replicas              │
│ > 100K QPS           │ Sharding, CDN, message queues               │
├──────────────────────┼────────────────────────────────────────────┤
│ < 1 TB data          │ Single DB instance                          │
│ 1 - 100 TB           │ Partitioning, read replicas                 │
│ > 100 TB             │ Sharding, distributed DB (Cassandra, etc.)  │
├──────────────────────┼────────────────────────────────────────────┤
│ < 100ms latency SLA  │ Cache everything, CDN, regional deployment  │
│ < 1s latency SLA     │ Standard architecture with caching          │
│ < 30s latency SLA    │ Async processing is acceptable              │
├──────────────────────┼────────────────────────────────────────────┤
│ 99.9% availability   │ Multi-AZ deployment, health checks          │
│ 99.99% availability  │ Multi-region, automatic failover             │
│ 99.999% availability │ Active-active multi-region, chaos testing   │
└──────────────────────┴────────────────────────────────────────────┘
```

---






> 🔬 **Section Challenge — 6. System Design Constraint Analysis**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 7. Practice Problems — Decode the Constraints

### Exercise: Read constraints and predict the algorithm

```
PROBLEM 1: n ≤ 20, find minimum cost to visit all nodes
  Your analysis: n = 20 → 2²⁰ = 10⁶ → O(2ⁿ × n) = 2 × 10⁷ → ✅
  Algorithm: Bitmask DP (TSP)

PROBLEM 2: n ≤ 10⁵, find the longest increasing subsequence
  Your analysis: n ≤ 10⁵ → need O(n log n)
  Algorithm: Patience sort with binary search (not O(n²) DP!)

PROBLEM 3: n ≤ 10⁵ nodes, find shortest path with weights
  Your analysis: V + E ≤ ~2 × 10⁵ → O((V+E) log V) ≈ 3.4 × 10⁶ ✅
  Algorithm: Dijkstra with priority queue

PROBLEM 4: s.length ≤ 10⁴, find all palindromic substrings
  Your analysis: n² = 10⁸ → borderline but expand-around-center works
  Algorithm: Expand around center O(n²) or Manacher's O(n)

PROBLEM 5: n ≤ 10⁵, q ≤ 10⁵ range sum queries with point updates
  Your analysis: n + q updates + q queries → need O(log n) per operation
  Algorithm: Fenwick Tree or Segment Tree

PROBLEM 6: n ≤ 10⁶, find if any two elements sum to target
  Your analysis: n = 10⁶ → O(n²) = 10¹² ❌, O(n) needed
  Algorithm: HashSet (check complement)

PROBLEM 7: grid 300 × 300, find min cost path top-left to bottom-right
  Your analysis: 300² = 90,000 cells → DP table O(n²) ✅
  Algorithm: 2D DP or Dijkstra on grid

PROBLEM 8: n ≤ 10, generate all permutations
  Your analysis: 10! = 3.6M → manageable
  Algorithm: Backtracking
```

### Self-Test: Can You Decode These?

```
Try these yourself before reading the answer:

Q1: n ≤ 5000, two strings, find LCS
    → Think: _________________
    → Algorithm: _________________

Q2: n ≤ 200,000, find kth largest element
    → Think: _________________
    → Algorithm: _________________

Q3: n ≤ 15, find minimum path visiting all nodes
    → Think: _________________
    → Algorithm: _________________

Q4: n ≤ 10⁹, find count of digits
    → Think: _________________
    → Algorithm: _________________

ANSWERS:
  Q1: O(n²) = 25M ✅ → 2D DP (LCS)
  Q2: O(n) needed → Quick Select OR O(n log n) → Sort + index
  Q3: 2¹⁵ × 15 ≈ 500K ✅ → Bitmask DP
  Q4: n is huge but answer is small → O(log n) → Digit DP or Math
```

---

## Cross-References

| Topic | Guide |
|-------|-------|
| Algorithm Templates | [04_Patterns_Templates/02_Code_Templates](../04_Patterns_Templates/02_Code_Templates.md) |
| Data Structure Internals | [02_Data_Structures/01_DataStructures_Complete](../02_Data_Structures/01_DataStructures_Complete.md) |
| SQL Performance Deep Dive | [08_SQL/47_Theory_Deep_Dive](../08_SQL/47_Theory_Deep_Dive_Database_Internals.md) |
| System Design | [06_OOP_Design/03_System_Design](../06_OOP_Design/03_System_Design.md) |
| Interview Mindset | [08_SQL/43_Interview_Mindset](../08_SQL/43_Interview_Mindset_How_Professionals_Explain.md) |

---

[⬅ The Interview Brain](01_The_Interview_Brain.md) | [📚 Index](00_INDEX.md) | [Next: Pattern Recognition Engine ➡](03_DSA_Pattern_Recognition_Engine.md)

---

## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |

---

## 🧠 Deep Conceptual Questions — Algorithm Design & Analysis

**C1. What does O(N log N) "feel like" and why is it the complexity barrier for comparison-based sorting?**
<details><summary>Deep Answer</summary>

O(N log N) for N=1M ≈ 20M operations. O(N²) ≈ 1 trillion. The difference is 50,000x. **Comparison sort lower bound**: any comparison-based sort must distinguish between N! possible orderings. Each comparison has 2 outcomes. A decision tree with N! leaves needs ≥ log₂(N!) height ≈ N log N (Stirling's approximation). Therefore NO comparison sort can beat O(N log N) in the worst case. Non-comparison sorts (counting sort, radix sort, bucket sort) break this bound by using non-comparison operations — but require constraints on input (e.g., integer range bounded by N).
</details>

**C2. Greedy algorithms: when do they work and what must be proven?**
<details><summary>Deep Answer</summary>

A greedy algorithm makes the locally optimal choice at each step. Works when problem has: (1) **Greedy choice property**: local optimal leads to global optimal — the choice never needs to be revised. (2) **Optimal substructure**: optimal solution to the problem contains optimal solutions to subproblems. To PROVE greedy is correct: use "exchange argument" — assume optimal solution differs from greedy, show you can swap greedy's choice in without making it worse, contradiction. Greedy FAILS when: future choices depend on current choice in complex ways (use DP instead). Classic works: interval scheduling, Huffman coding, Dijkstra. Classic fails: 0-1 knapsack (use DP).
</details>

**C3. Dynamic Programming: what is "overlapping subproblems" and why does it matter?**
<details><summary>Deep Answer</summary>

Overlapping subproblems: the same sub-computation appears multiple times. Fibonacci: `fib(5)` calls `fib(4)` and `fib(3)`. `fib(4)` also calls `fib(3)`. Without memoization: `fib(3)` computed exponentially many times → O(2^N). With memoization: each sub-result computed once and stored → O(N). DP is valuable SPECIFICALLY when: (1) problem has optimal substructure AND (2) subproblems overlap. If no overlap: just use divide-and-conquer (merge sort's subproblems don't overlap → no DP needed). DP = "smart recursion" = avoid recomputing.
</details>

**C4. Top-down (memoization) vs Bottom-up (tabulation) DP — when to choose each?**
<details><summary>Deep Answer</summary>

**Top-down (memoization)**: Write natural recursion + cache results. Easy to implement, only computes needed subproblems (sparse computation). Cons: recursion overhead and stack depth risk. Use when: problem is naturally recursive, only a fraction of subproblems needed. **Bottom-up (tabulation)**: Fill DP table iteratively from base cases. No recursion overhead, better cache performance, easier space optimization. Use when: need all subproblems (or most of them), want to optimize space (can often reduce to 1D from 2D). Rule: start with top-down for correctness verification, optimize to bottom-up for performance.
</details>

**C5. Dijkstra's Algorithm: why does it fail on negative weights?**
<details><summary>Deep Answer</summary>

Dijkstra assumes: once a node is "settled" (extracted from the priority queue with its final shortest distance), that distance is optimal. With negative weights: settling node A at distance 5 might not be final — a path through B (distance 7) → C (edge -10) → A gives distance -3. But A was already settled! Dijkstra doesn't revisit settled nodes. Bellman-Ford handles negatives by relaxing ALL edges N-1 times — no "settled" assumption. For graphs with negative cycles: Bellman-Ford detects them (if distances still decrease after N-1 rounds, there's a negative cycle).
</details>

**C6. Union-Find: why is path compression + union by rank/size nearly O(1)?**
<details><summary>Deep Answer</summary>

**Path compression**: when finding the root of element x, make every node on the path point directly to the root. Flattens the tree. Future finds on those paths: O(1). **Union by rank**: always attach the smaller tree under the larger → limits tree height to O(log N). Combined: inverse Ackermann function α(N) amortized — so slow-growing it's practically constant (α(10^80) = 4). Neither alone is optimal: path compression without union by rank → O(log N) amortized. Union by rank without path compression → O(log N). Together → α(N) ≈ O(1) amortized. Used in: Kruskal's MST, cycle detection, connected components.
</details>

**C7. Binary Search on the Answer — what types of problems does it apply to?**
<details><summary>Deep Answer</summary>

When the answer space is **monotone**: "if X is achievable, then all values less extreme than X are also achievable." Problems: minimize the maximum (aggressive cows, split array), find minimum valid threshold (Koko bananas, minimum days to bloom), divide-and-conquer feasibility. Template: binary search on the answer range [lo, hi], for each mid check `isFeasible(mid)` in O(N) or O(N log N). Total: O(N log(answer_range)). Key insight: reframe "find optimal value" as "find smallest X where condition holds" → enables binary search on a non-array space.
</details>

**C8. Why does merge sort guarantee stability while quicksort doesn't?**
<details><summary>Deep Answer</summary>

**Merge sort stability**: during merge, when two elements are equal, we always take from the LEFT array first → preserves original relative order. **QuickSort instability**: the partition step swaps elements across the pivot without regard to original order. Two equal elements may be placed on opposite sides of the pivot, reversing their order. QuickSort CAN be made stable (Lomuto partition with careful implementation) but loses performance. Java uses TimSort for objects (stable), dual-pivot quicksort for primitives (stability irrelevant since primitives without fields).
</details>

**C9. Backtracking: what's the difference from plain DFS and when to use vs DP?**
<details><summary>Deep Answer</summary>

**Backtracking vs DFS**: DFS visits every path. Backtracking prunes paths early when a constraint is violated — avoids exploring infeasible branches. Same asymptotic but drastically different practical performance with good pruning. **Backtracking vs DP**: backtracking for **combinatorial/enumeration** problems (find all solutions, permutations, subsets). DP for **optimization** problems (find optimal single solution). Backtracking produces exponential solutions in worst case but is necessary when you need ALL solutions. DP finds the optimal in polynomial time when overlapping subproblems exist.
</details>

**C10. What is amortized analysis and how does it differ from average-case analysis?**
<details><summary>Deep Answer</summary>

**Amortized**: analyzes the average cost per operation over a SEQUENCE of operations — in the worst case. No probability involved. Guarantees: N operations ALWAYS take O(N·T) total, even if some individual operations are O(N·T). Example: ArrayList append is O(N) when resizing, but amortized O(1) because resizing is rare. **Average-case**: analyzes expected cost of a SINGLE operation assuming random input. QuickSort is O(N log N) average-case (random pivot). Amortized is a stronger guarantee — it holds even for adversarial input sequences.
</details>

