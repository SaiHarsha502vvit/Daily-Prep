# 🔍 DSA Pattern Recognition Engine — See the Pattern Before You Code

[⬅ Constraint→Algorithm Map](02_Constraint_to_Algorithm_Map.md) | [📚 Index](00_INDEX.md) | [Next: Complexity Masterclass ➡](04_Complexity_Analysis_Masterclass.md)

---

**"Expert chess players don't calculate more moves — they RECOGNIZE more patterns."**
The same is true for coding interviews. This guide builds your pattern library.

---

## Table of Contents

1. [The Pattern Recognition Pipeline](#1-the-pattern-recognition-pipeline)
2. [Pattern 1: Two Pointers — The Swiss Army Knife](#2-pattern-1-two-pointers)
3. [Pattern 2: Sliding Window — The Subarray/Substring Solver](#3-pattern-2-sliding-window)
4. [Pattern 3: Binary Search — Beyond Sorted Arrays](#4-pattern-3-binary-search)
5. [Pattern 4: BFS/DFS — Graph and Tree Traversal](#5-pattern-4-bfsdfs)
6. [Pattern 5: Dynamic Programming — The Optimization Framework](#6-pattern-5-dynamic-programming)
7. [Pattern 6: Greedy — When Local Optimum = Global Optimum](#7-pattern-6-greedy)
8. [Pattern 7: Backtracking — Systematic Exploration](#8-pattern-7-backtracking)
9. [Pattern 8: Stack/Queue — Order-Dependent Processing](#9-pattern-8-stackqueue)
10. [Pattern 9: Heap — Priority-Based Processing](#10-pattern-9-heap)
11. [Pattern 10: Union-Find — Dynamic Connectivity](#11-pattern-10-union-find)
12. [Pattern 11: Prefix Sum — Range Query Magic](#12-pattern-11-prefix-sum)
13. [Pattern 12: Trie — String Prefix Operations](#13-pattern-12-trie)
14. [The Universal Pattern Matching Flowchart](#14-the-universal-pattern-matching-flowchart)
15. [30 Problems — Identify the Pattern](#15-thirty-problems-identify-the-pattern)

---

## 1. The Pattern Recognition Pipeline

### How Your Brain Should Process a Problem

```
┌─────────────────────────────────────────────────────────────────────┐
│                  PATTERN RECOGNITION PIPELINE                        │
│                                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ 1. READ  │───▶│ 2. TAG   │───▶│ 3. MATCH │───▶│ 4. APPLY │      │
│  │          │    │          │    │          │    │          │      │
│  │ Identify │    │ Keywords │    │ Pattern  │    │ Template │      │
│  │ input,   │    │ & props  │    │ from     │    │ & solve  │      │
│  │ output,  │    │ from the │    │ library  │    │          │      │
│  │ constr.  │    │ problem  │    │          │    │          │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                       │
│  READ: "two numbers   TAG: pair,     MATCH: Two     APPLY: HashMap  │
│   that add to target"  target, array   Pointer or     {val→index}    │
│                                        HashMap                       │
└─────────────────────────────────────────────────────────────────────┘
```

### The Tagging System — What to Look For

```
TAG CATEGORY 1: DATA STRUCTURE GIVEN
  • Array (sorted / unsorted)
  • String
  • Linked List
  • Tree (binary / BST / N-ary)
  • Graph (directed / undirected / weighted)
  • Matrix (grid)

TAG CATEGORY 2: WHAT'S BEING ASKED
  • Find specific element
  • Find optimal (min/max)
  • Count possibilities
  • Generate all solutions
  • Check existence (boolean)
  • Transform/modify structure
  • Design a class/system

TAG CATEGORY 3: KEY PROPERTIES
  • Sorted → Binary Search, Two Pointer
  • Contiguous → Sliding Window, Prefix Sum
  • Choices at each step → DP or Greedy
  • Connected components → Union-Find, DFS
  • Ordering dependency → Topological Sort, Stack
  • Frequency → HashMap, Bucket Sort
```

---

## 2. Pattern 1: Two Pointers

### 5W+H Analysis

```
WHAT: Use two pointers (indices) to traverse data from different positions
WHY:  Reduces O(n²) brute force to O(n) by eliminating unnecessary checks
WHERE: Sorted arrays, linked lists, strings (palindromes)
WHEN: Two related items need to be found/compared simultaneously
WHO:  Left pointer and right pointer (or slow and fast)
HOW:  Move pointers based on comparison with target/condition
```

### Variant Map

```
VARIANT 1: OPPOSITE DIRECTION (converging)
  Start: left = 0, right = n-1
  Move: left++ when too small, right-- when too big
  Use: Two Sum (sorted), Container With Most Water, 3Sum

VARIANT 2: SAME DIRECTION (fast & slow)
  Start: slow = 0, fast = 0 (or fast = 1)
  Move: fast always moves; slow moves on condition
  Use: Remove duplicates, linked list cycle, merge

VARIANT 3: SEPARATE ARRAYS
  Start: i = 0 for arr1, j = 0 for arr2
  Move: advance whichever points to smaller
  Use: Merge sorted arrays, intersection
```

### Template Code

```java
// OPPOSITE DIRECTION — Two Sum in sorted array
int[] twoSumSorted(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;     // Need bigger → move left forward
        else right--;                       // Need smaller → move right backward
    }
    return new int[]{-1, -1};
}

// SAME DIRECTION — Remove duplicates in-place
int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int slow = 0;                            // Points to last unique
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];         // Overwrite next position
        }
    }
    return slow + 1;
}

// FAST & SLOW — Linked List Cycle Detection (Floyd's)
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;           // 1 step
        fast = fast.next.next;      // 2 steps
        if (slow == fast) return true;  // Met → cycle!
    }
    return false;
}
```

### Problem Variants

```
STARTER:
  • Two Sum II (sorted)            → Opposite direction
  • Valid Palindrome               → Opposite direction on string
  • Remove Element                 → Same direction

INTERMEDIATE:
  • 3Sum                           → Fix one + two pointer on rest
  • Container With Most Water      → Opposite, move shorter side
  • Trapping Rain Water            → Opposite or prefix/suffix arrays
  • Sort Colors (Dutch Flag)       → Three pointers (0, curr, 2)

ADVANCED:
  • 4Sum                           → Fix two + two pointer
  • Linked List Cycle II (start)   → Floyd's + math to find entry
  • Remove Nth Node From End       → Fast N steps ahead, then both move
```

---

## 3. Pattern 2: Sliding Window

### 5W+H Analysis

```
WHAT: Maintain a "window" (contiguous subarray/substring) that slides across input
WHY:  Avoids recalculating everything for overlapping regions → O(n) instead of O(n²)
WHERE: Arrays and strings when dealing with contiguous elements
WHEN: Problem mentions "subarray", "substring", "consecutive", or "window of size k"
WHO:  Left and right boundaries of the window
HOW:  Expand right to include new elements, shrink left when condition violated
```

### The Two Types

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPE 1: FIXED SIZE WINDOW                                       │
│                                                                   │
│  "Find max sum of k consecutive elements"                        │
│                                                                   │
│  [a  b  c  d  e  f  g]    k = 3                                 │
│  [=====]                    sum = a+b+c                          │
│     [=====]                 sum = sum - a + d                    │
│        [=====]              sum = sum - b + e                    │
│           [=====]           sum = sum - c + f                    │
│              [=====]        sum = sum - d + g                    │
│                                                                   │
│  Add new right element, remove old left element. O(n)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TYPE 2: VARIABLE SIZE WINDOW                                    │
│                                                                   │
│  "Smallest subarray with sum ≥ target"                           │
│                                                                   │
│  [a  b  c  d  e  f  g]    target = 7                            │
│  [==]                       sum = a+b (< 7 → expand right)      │
│  [========]                 sum = a+b+c+d (≥ 7 → shrink left)   │
│     [=====]                 sum = b+c+d (still ≥ 7 → shrink)    │
│        [==]                 sum = c+d (< 7 → expand right)      │
│        [=====]              sum = c+d+e (≥ 7 → record, shrink)  │
│                                                                   │
│  Track minimum window length that satisfies condition. O(n)      │
└─────────────────────────────────────────────────────────────────┘
```

### Template Code

```java
// FIXED WINDOW — Maximum sum of subarray of size k
int maxSumFixedWindow(int[] arr, int k) {
    int windowSum = 0, maxSum = Integer.MIN_VALUE;
    for (int i = 0; i < arr.length; i++) {
        windowSum += arr[i];               // Add RIGHT element
        if (i >= k) windowSum -= arr[i - k]; // Remove LEFT element
        if (i >= k - 1) maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}

// VARIABLE WINDOW — Minimum length subarray with sum ≥ target
int minSubArrayLen(int target, int[] nums) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];                 // EXPAND window
        while (sum >= target) {             // SHRINK when valid
            minLen = Math.min(minLen, right - left + 1);
            sum -= nums[left++];            // Remove left element
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}

// STRING WINDOW — Longest substring without repeating characters
int lengthOfLongestSubstring(String s) {
    int[] lastSeen = new int[128];          // ASCII
    Arrays.fill(lastSeen, -1);
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen[c] >= left) {          // Duplicate in window!
            left = lastSeen[c] + 1;         // Shrink past duplicate
        }
        lastSeen[c] = right;
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

### Problem Variants

```
FIXED WINDOW:
  • Maximum Average Subarray I      → sum/k for each window
  • Maximum of All Subarrays (K)    → Monotonic Deque (harder)
  • Find All Anagrams in String     → freq match window

VARIABLE WINDOW:
  • Min Size Subarray Sum           → shrink when sum ≥ target
  • Longest Substring No Repeat     → shrink when duplicate found
  • Longest Repeating Char Replace  → shrink when replacements > k
  • Minimum Window Substring        → shrink when all chars found
  • Fruit Into Baskets              → at most 2 distinct types
  • Subarrays with K Different Int  → exactly K = atMost(K) - atMost(K-1)
```

---

## 4. Pattern 3: Binary Search — Beyond Sorted Arrays

### 5W+H Analysis

```
WHAT: Repeatedly halve the search space based on a condition
WHY:  O(log n) is dramatically faster than O(n) for large inputs
WHERE: Sorted data, monotonic functions, answer spaces
WHEN: Search space can be halved based on a single comparison
WHO:  lo/hi boundaries + mid calculation + condition check
HOW:  Check mid, decide which half to eliminate
```

### The 4 Flavors of Binary Search

```
FLAVOR 1: EXACT MATCH
  → Find target in sorted array
  → Classic binary search

FLAVOR 2: BOUNDARY FINDING
  → Find first/last occurrence
  → Find insertion point
  → lower_bound / upper_bound

FLAVOR 3: ON ROTATED/MODIFIED ARRAYS
  → Find min in rotated sorted array
  → Search in rotated sorted array
  → Find peak element

FLAVOR 4: BINARY SEARCH ON ANSWER
  → "Minimize the maximum" or "Maximize the minimum"
  → Answer space is monotonic
  → Check function validates a candidate answer
```

### Template Code for All Flavors

```java
// FLAVOR 1: Exact match
int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;    // Avoid overflow!
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;  // Not found
}

// FLAVOR 2: First occurrence (lower bound)
int lowerBound(int[] arr, int target) {
    int lo = 0, hi = arr.length;  // Note: hi = length (not length-1)
    while (lo < hi) {             // Note: < not <=
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid;            // Note: mid, not mid-1
    }
    return lo;  // First position where arr[pos] >= target
}

// FLAVOR 3: Search in rotated sorted array
int searchRotated(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;

        if (nums[lo] <= nums[mid]) {           // Left half is sorted
            if (nums[lo] <= target && target < nums[mid])
                hi = mid - 1;                    // Target in left half
            else
                lo = mid + 1;                    // Target in right half
        } else {                                 // Right half is sorted
            if (nums[mid] < target && target <= nums[hi])
                lo = mid + 1;                    // Target in right half
            else
                hi = mid - 1;                    // Target in left half
        }
    }
    return -1;
}

// FLAVOR 4: Binary Search on Answer — Split Array Largest Sum
int splitArray(int[] nums, int k) {
    int lo = max(nums), hi = sum(nums);    // Answer range
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canSplit(nums, k, mid))        // Can we split with max-sum ≤ mid?
            hi = mid;                       // Try smaller max-sum
        else
            lo = mid + 1;                   // Need larger max-sum
    }
    return lo;
}

boolean canSplit(int[] nums, int k, int maxSum) {
    int count = 1, currentSum = 0;
    for (int num : nums) {
        if (currentSum + num > maxSum) {
            count++;
            currentSum = num;
            if (count > k) return false;
        } else {
            currentSum += num;
        }
    }
    return true;
}
```

### When to Use Binary Search on Answer — Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  "Minimize the maximum X" or "Maximize the minimum X"            │
│                        │                                          │
│                        ▼                                          │
│  Can you define a CHECK function?                                │
│  check(candidate) → boolean (is this answer feasible?)           │
│                        │                                          │
│                   YES  │                                          │
│                        ▼                                          │
│  Is the check function MONOTONIC?                                │
│  (If candidate=X works, does candidate=X+1 also work?)          │
│                        │                                          │
│                   YES  │                                          │
│                        ▼                                          │
│            ✅ USE BINARY SEARCH ON ANSWER                         │
│                                                                   │
│  lo = minimum possible answer                                    │
│  hi = maximum possible answer                                    │
│  Binary search for the boundary between false→true               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Pattern 4: BFS/DFS — Graph and Tree Traversal

### When to Use BFS vs DFS

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│  Criteria          │  BFS                  │  DFS                  │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Traversal order    │ Level by level        │ Deep first, backtrack│
│ Data structure     │ Queue                 │ Stack / Recursion    │
│ Space              │ O(width)              │ O(depth)             │
│ Shortest path?     │ ✅ YES (unweighted)   │ ❌ NO                │
│ All paths?         │ Less natural          │ ✅ YES (backtracking) │
│ Connected comp?    │ ✅ YES                │ ✅ YES                │
│ Topological sort?  │ ✅ Kahn's algo        │ ✅ Post-order reverse │
│ Cycle detection?   │ Possible              │ ✅ Natural (3 colors) │
│ Use when           │ Shortest, levels      │ Paths, trees, cycles │
└────────────────────┴──────────────────────┴──────────────────────┘
```

### Template Code

```java
// BFS — Shortest path in unweighted graph / Level-order traversal
void bfs(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    visited[start] = true;       // Mark WHEN ADDING to queue!
    int level = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();  // Process level by level
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            // Process node at this level

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;  // Mark before adding!
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
}

// DFS — Recursive (for trees and graphs)
void dfs(int node, boolean[] visited, List<List<Integer>> graph) {
    visited[node] = true;
    // Pre-order processing (before children)

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, visited, graph);
        }
    }
    // Post-order processing (after all children done)
}

// BFS on GRID — Number of Islands
int numIslands(char[][] grid) {
    int count = 0;
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                count++;
                // BFS to mark all connected '1's
                Queue<int[]> q = new LinkedList<>();
                q.offer(new int[]{i, j});
                grid[i][j] = '0';             // Mark visited
                while (!q.isEmpty()) {
                    int[] cell = q.poll();
                    for (int[] d : dirs) {
                        int ni = cell[0] + d[0], nj = cell[1] + d[1];
                        if (ni >= 0 && ni < grid.length &&
                            nj >= 0 && nj < grid[0].length &&
                            grid[ni][nj] == '1') {
                            grid[ni][nj] = '0';
                            q.offer(new int[]{ni, nj});
                        }
                    }
                }
            }
        }
    }
    return count;
}
```

---

## 6. Pattern 5: Dynamic Programming

### The DP Recognition Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                IS THIS A DP PROBLEM?                              │
│                                                                   │
│  □ Does it ask for OPTIMAL (min/max/longest/shortest)?           │
│  □ Does it ask for COUNT (number of ways)?                       │
│  □ Can the problem be broken into SUBPROBLEMS?                   │
│  □ Are subproblems OVERLAPPING (same subproblem solved twice)?   │
│  □ Does OPTIMAL SUBSTRUCTURE hold?                               │
│    (optimal solution uses optimal solutions of subproblems)      │
│                                                                   │
│  If 3+ checked → Almost certainly DP                             │
│                                                                   │
│  COUNTER-CHECK: Can greedy work? (If yes, prefer greedy)         │
│  TEST: Try a small counter-example for greedy                    │
└─────────────────────────────────────────────────────────────────┘
```

### The DP Problem Families

```
FAMILY 1: LINEAR DP (1D)
  State: dp[i] = answer considering first i elements
  Examples: Fibonacci, House Robber, Climbing Stairs, Maximum Subarray

  dp[i] = f(dp[i-1], dp[i-2], ..., nums[i])

  TEMPLATE:
    int[] dp = new int[n + 1];
    dp[0] = base_case;
    for (int i = 1; i <= n; i++) {
        dp[i] = transition(dp[i-1], dp[i-2], ...);
    }
    return dp[n];


FAMILY 2: GRID DP (2D)
  State: dp[i][j] = answer at position (i, j) in grid
  Examples: Unique Paths, Min Path Sum, Dungeon Game

  dp[i][j] = f(dp[i-1][j], dp[i][j-1], grid[i][j])

  TEMPLATE:
    int[][] dp = new int[m][n];
    dp[0][0] = grid[0][0];  // base case
    // Fill first row and column
    for (int i = 1; i < m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    for (int j = 1; j < n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    // Fill rest
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);


FAMILY 3: KNAPSACK DP
  State: dp[i][w] = best value using items 1..i with capacity w
  Examples: 0/1 Knapsack, Subset Sum, Coin Change

  0/1 Knapsack: dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])
  Unbounded:    dp[w] = min/max over all items that fit

  TEMPLATE (Coin Change — unbounded):
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int coin : coins)
        for (int a = coin; a <= amount; a++)
            dp[a] = Math.min(dp[a], dp[a - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];


FAMILY 4: STRING DP (2D on two strings)
  State: dp[i][j] = answer for s1[0..i-1] and s2[0..j-1]
  Examples: LCS, Edit Distance, Regex Matching

FAMILY 5: INTERVAL DP
  State: dp[i][j] = answer for the subarray/range [i..j]
  Examples: Matrix Chain, Burst Balloons, Stone Game

FAMILY 6: STATE MACHINE DP
  State: dp[i][state] = answer at position i in state
  Stock Problems: dp[i][holding] vs dp[i][not_holding]

  TEMPLATE (Best Time to Buy and Sell Stock with Cooldown):
    int[] hold = new int[n], sold = new int[n], rest = new int[n];
    hold[0] = -prices[0]; sold[0] = 0; rest[0] = 0;
    for (int i = 1; i < n; i++) {
        hold[i] = Math.max(hold[i-1], rest[i-1] - prices[i]);
        sold[i] = hold[i-1] + prices[i];
        rest[i] = Math.max(rest[i-1], sold[i-1]);
    }
    return Math.max(sold[n-1], rest[n-1]);


FAMILY 7: TREE DP
  State: dp[node] = answer for subtree rooted at node
  Examples: Binary Tree Maximum Path Sum, House Robber III

FAMILY 8: BITMASK DP
  State: dp[mask] = answer when subset represented by mask is processed
  Examples: TSP, Shortest Superstring, Parallel Courses II
  When: n ≤ 20 (since 2²⁰ = 10⁶)
```

---

## 7. Pattern 6: Greedy — When Local Optimum = Global Optimum

### When Greedy Works (and When It Doesn't)

```
GREEDY WORKS WHEN:
  1. Greedy choice property: locally optimal choice leads to global optimum
  2. Optimal substructure: optimal solution contains optimal sub-solutions

HOW TO VERIFY:
  • Try 3-5 examples — does greedy always give optimal?
  • Try to construct a counter-example — if you can, use DP instead
  • Prove via exchange argument: "swapping any greedy choice makes it worse"

CLASSIC GREEDY CATEGORIES:
  ├─ Interval scheduling → Sort by end time, take non-overlapping
  ├─ Huffman coding → Always merge two smallest frequencies
  ├─ Activity selection → Sort by finish, take earliest finish
  ├─ Jump game → Track farthest reachable position
  ├─ Gas station → Track running surplus
  ├─ Assign cookies → Sort both, match smallest cookie to smallest child
  └─ Task scheduler → Process most frequent first
```

```java
// Interval Scheduling — Maximum non-overlapping intervals
int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);  // Sort by END time
    int count = 0, prevEnd = Integer.MIN_VALUE;
    for (int[] interval : intervals) {
        if (interval[0] >= prevEnd) {   // No overlap
            prevEnd = interval[1];       // Take this interval
        } else {
            count++;                     // Remove (skip) this overlap
        }
    }
    return count;
}
// WHY sort by end time? Choosing earliest ending frees the most room for future.

// Jump Game II — Minimum jumps to reach end
int jump(int[] nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == currentEnd) {      // Must jump now
            jumps++;
            currentEnd = farthest;
            if (currentEnd >= nums.length - 1) break;
        }
    }
    return jumps;
}
// INSIGHT: At each level (BFS-like), track the farthest we can reach.
```

---

## 8. Pattern 7: Backtracking — Systematic Exploration

### The Backtracking Blueprint

```
BACKTRACKING = "Try all choices, undo bad ones"

┌─────────────────────────────────────────────────────────────────┐
│  void backtrack(state, choices) {                                │
│      if (BASE CASE) {                                            │
│          record solution;                                        │
│          return;                                                 │
│      }                                                           │
│                                                                   │
│      for each CHOICE in choices {                                │
│          if (VALID choice) {            // PRUNE invalid          │
│              MAKE the choice;           // Modify state           │
│              backtrack(next state);     // Recurse                │
│              UNDO the choice;           // Restore state          │
│          }                                                       │
│      }                                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

CRITICAL MENTAL MODEL:
  Think of it as exploring a TREE of decisions.
  Each node = current state
  Each edge = a choice
  Leaf = base case (solution or dead end)
  Backtrack = go back to parent and try next edge
```

```java
// Subsets — Generate all subsets
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
}

void backtrack(List<List<Integer>> result, List<Integer> current,
               int[] nums, int start) {
    result.add(new ArrayList<>(current));  // Every state is a valid subset
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);              // CHOOSE
        backtrack(result, current, nums, i + 1);  // EXPLORE
        current.remove(current.size() - 1); // UN-CHOOSE
    }
}

// Permutations
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(result, new ArrayList<>(), nums, used);
    return result;
}

void backtrack(List<List<Integer>> result, List<Integer> current,
               int[] nums, boolean[] used) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;             // PRUNE: already used
        used[i] = true;
        current.add(nums[i]);
        backtrack(result, current, nums, used);
        current.remove(current.size() - 1);
        used[i] = false;                   // UNDO
    }
}

// Combination Sum — Combinations that sum to target (can reuse)
void combinationSum(int[] candidates, int target, int start,
                    List<Integer> current, List<List<Integer>> result) {
    if (target == 0) {
        result.add(new ArrayList<>(current));
        return;
    }
    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > target) break;  // PRUNE: too large (requires sort)
        current.add(candidates[i]);
        combinationSum(candidates, target - candidates[i], i, current, result);
        current.remove(current.size() - 1);
    }
}
```

---

## 9. Pattern 8: Stack/Queue — Order-Dependent Processing

### Stack Application Map

```
MATCHING PROBLEMS:
  • Valid Parentheses → push open, pop for close, check match
  • Decode String → push numbers and strings, process on ']'
  • Basic Calculator → push operands, process on operators

MONOTONIC STACK (Next Greater/Smaller):
  • Next Greater Element → decreasing stack
  • Daily Temperatures → decreasing stack (store indices)
  • Largest Rectangle in Histogram → increasing stack
  • Trapping Rain Water → stack or two-pointer approach

DESIGN PROBLEMS:
  • Min Stack → two stacks (main + mins)
  • Implement Queue using Stacks → two stacks (push/pop reversal)
```

```java
// Monotonic Stack — Daily Temperatures
// "How many days until a warmer temperature?"
int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();  // Indices of decreasing temps

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
            int prevDay = stack.pop();
            result[prevDay] = i - prevDay;    // Days until warmer
        }
        stack.push(i);
    }
    return result;
}
// INSIGHT: Stack maintains days with no answer yet, in decreasing temp order.
// When we find a warmer day → it answers ALL colder days in the stack.

// Largest Rectangle in Histogram — Using increasing stack
int largestRectangleArea(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;
    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

---

## 10. Pattern 9: Heap — Priority-Based Processing

### When to Use Heap

```
USE HEAP WHEN:
  ├─ "Find Kth largest/smallest"         → Min/Max heap of size K
  ├─ "Merge K sorted lists/arrays"       → Min heap of heads
  ├─ "Find median in stream"             → Two heaps (max + min)
  ├─ "Schedule tasks by priority"        → Min heap (earliest deadline)
  ├─ "Dijkstra's shortest path"          → Min heap (shortest distance)
  └─ "Top K frequent elements"           → Min heap of size K

SIZE K TRICK:
  To find Kth LARGEST → use MIN-heap of size K (smallest of top K)
  To find Kth SMALLEST → use MAX-heap of size K (largest of bottom K)
```

```java
// Find Kth Largest Element
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();  // Min heap
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();  // Remove smallest
    }
    return minHeap.peek();  // Kth largest = smallest in top-K
}

// Find Median from Data Stream — Two heaps
class MedianFinder {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    // maxHeap: smaller half | minHeap: larger half

    void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());       // Balance
        if (minHeap.size() > maxHeap.size())
            maxHeap.offer(minHeap.poll());     // maxHeap >= minHeap in size
    }

    double findMedian() {
        if (maxHeap.size() > minHeap.size())
            return maxHeap.peek();
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}
```

---

## 11. Pattern 10: Union-Find — Dynamic Connectivity

```java
class UnionFind {
    int[] parent, rank;
    int components;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);  // Path compression
        return parent[x];
    }

    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;        // Already connected
        if (rank[px] < rank[py]) { int tmp = px; px = py; py = tmp; }
        parent[py] = px;                   // Union by rank
        if (rank[px] == rank[py]) rank[px]++;
        components--;
        return true;
    }
}

// USE WHEN:
// • "Are these two nodes connected?" → find(a) == find(b)
// • "How many connected components?" → components field
// • "Merge groups dynamically" → union(a, b)
// • Kruskal's MST → sort edges, union if not connected
// • Redundant connection → edge that creates a cycle
```

---

## 12. Pattern 11: Prefix Sum — Range Query Magic

```java
// 1D Prefix Sum
int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++)
    prefix[i + 1] = prefix[i] + arr[i];

// Sum of arr[l..r] = prefix[r+1] - prefix[l]    O(1) per query!

// APPLICATION: "Count subarrays with sum = k"
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty prefix has sum 0
    int sum = 0, count = 0;
    for (int num : nums) {
        sum += num;
        // If prefix sum - k existed before, those subarrays sum to k
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
// INSIGHT: Same idea as Two Sum but applied to prefix sums!
// sum[i..j] = prefix[j] - prefix[i] = k → prefix[i] = prefix[j] - k
```

---

## 13. Pattern 12: Trie — String Prefix Operations

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null)
                node.children[idx] = new TrieNode();
            node = node.children[idx];
        }
        node.isEnd = true;
    }

    boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEnd;
    }

    boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    private TrieNode traverse(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return null;
            node = node.children[idx];
        }
        return node;
    }
}

// USE WHEN: autocomplete, word search in board, prefix matching
```

---

## 14. The Universal Pattern Matching Flowchart

```
                        START
                          │
              ┌───────────┴───────────┐
              │ What data structure?   │
              └───────────┬───────────┘
        ┌─────────┬───────┼───────┬──────────┐
        ▼         ▼       ▼       ▼          ▼
     ARRAY     STRING   TREE    GRAPH     LINKED LIST
        │         │       │       │          │
        │         │       ▼       ▼          ▼
        │         │      DFS    BFS/DFS    Two Pointer
        │         │      or      or        (slow/fast)
        │         │      BFS    Union-Find
        │         ▼
        │    Frequency? ──YES──▶ HashMap / int[26]
        │         │NO
        │    Substring? ──YES──▶ Sliding Window
        │         │NO
        │    Prefix? ────YES──▶ Trie
        │         │NO
        │    Palindrome? ─YES──▶ Two Pointer / DP
        │
        ▼
   Sorted? ──YES──▶ Binary Search / Two Pointer
        │NO
   Subarray? ──YES──▶ Sliding Window / Prefix Sum
        │NO
   Pairs? ──YES──▶ HashMap / Two Pointer (if sorted)
        │NO
   Optimal? ──YES──▶ DP or Greedy
        │NO
   All solutions? ──YES──▶ Backtracking
        │NO
   Top K? ──YES──▶ Heap
        │NO
   Ordering? ──YES──▶ Stack (Monotonic)
```

---

## 15. 30 Problems — Identify the Pattern

**Try to identify the pattern BEFORE reading the answer.**

| #   | Problem                     | Tags               | Pattern                 | Why                                         |
| --- | --------------------------- | ------------------ | ----------------------- | ------------------------------------------- |
| 1   | Two Sum                     | array, target      | HashMap                 | Store complement for O(1) lookup            |
| 2   | Best Time to Buy/Sell Stock | array, max profit  | Kadane's / Track min    | Single pass tracking minimum                |
| 3   | Valid Parentheses           | string, matching   | Stack                   | Match open/close pairs                      |
| 4   | Merge Intervals             | intervals, overlap | Sort + Sweep            | Sort by start, merge overlapping            |
| 5   | Binary Tree Level Order     | tree, levels       | BFS                     | Queue, level processing                     |
| 6   | Coin Change                 | count, choices     | DP (unbounded knapsack) | Overlapping subproblems                     |
| 7   | 3Sum                        | array, triplets    | Sort + Two Pointer      | Fix one, two-pointer rest                   |
| 8   | Longest Substring No Repeat | string, unique     | Sliding Window          | Shrink on duplicate                         |
| 9   | Number of Islands           | grid, count        | BFS/DFS + flood fill    | Mark visited, count starts                  |
| 10  | Course Schedule             | dependencies       | Topological Sort        | Detect cycle in DAG                         |
| 11  | Find Peak Element           | array, peak        | Binary Search           | Compare mid with neighbors                  |
| 12  | Kth Largest Element         | top-K              | Heap / Quick Select     | MinHeap of size K                           |
| 13  | House Robber                | max, non-adjacent  | Linear DP               | dp[i] = max(dp[i-1], dp[i-2]+val)           |
| 14  | Word Search                 | grid, path         | Backtracking + DFS      | Explore all paths                           |
| 15  | LRU Cache                   | design, eviction   | HashMap + LinkedList    | O(1) get and put                            |
| 16  | Subarray Sum Equals K       | count, subarray    | Prefix Sum + HashMap    | sum - k in prefix map                       |
| 17  | Next Greater Element        | array, next        | Monotonic Stack         | Decreasing stack                            |
| 18  | Median of Data Stream       | stream, median     | Two Heaps               | Max-heap + Min-heap                         |
| 19  | Longest Palindromic Substr  | string, palindrome | Expand from center      | O(n²) expand or DP                          |
| 20  | Graph Redundant Connection  | graph, cycle       | Union-Find              | Edge that creates cycle                     |
| 21  | Min Cost Climbing Stairs    | optimization       | Linear DP               | dp[i] = cost + min(dp[i-1], dp[i-2])        |
| 22  | Search Rotated Array        | sorted, search     | Modified Binary Search  | Find sorted half                            |
| 23  | Longest Increasing Subseq   | sequence, longest  | DP or Binary Search     | O(n²) DP or O(n log n) patience             |
| 24  | Word Break                  | string, dictionary | DP (boolean)            | dp[i] = any dp[j] && dict.contains(s[j..i]) |
| 25  | Min Window Substring        | string, contains   | Sliding Window          | Track char frequency match                  |
| 26  | Clone Graph                 | graph, copy        | BFS/DFS + HashMap       | Map old→new nodes                           |
| 27  | Edit Distance               | two strings        | 2D DP                   | Match, insert, delete, replace              |
| 28  | Trapping Rain Water         | array, water       | Two Pointer or Stack    | min(leftMax, rightMax) - height             |
| 29  | Serialize/Deserialize BST   | tree, design       | DFS (preorder)          | Pre-order traversal + boundary              |
| 30  | Alien Dictionary            | ordering, custom   | Topological Sort        | Build DAG from word comparisons             |

---

[⬅ Constraint→Algorithm Map](02_Constraint_to_Algorithm_Map.md) | [📚 Index](00_INDEX.md) | [Next: Complexity Masterclass ➡](04_Complexity_Analysis_Masterclass.md)


---

## Reality Check

**"Pattern recognition means matching keywords to patterns"** — Keyword matching is the trainer-wheels version that setters actively defeat ([04_Pattern-Recognition, 14_MM trigger-guide]): "sorted" appears in binary-search, two-pointer, AND math problems; "shortest" means BFS, Dijkstra, DP, or plain scan. Real recognition fires on STRUCTURE and CONSTRAINTS (the [02] constraint-routing, the answer-type) not surface keywords — "matching keywords" is the misconception that produces confident wrong-routing on the decoy-keyword problems, and the actual engine is compound-condition recognition (the [14_MM trigger-guide]'s "sorted AND asking-position AND better-than-linear-expected") plus the constraint-and-answer-type signals that cannot be faked.

**"A recognition engine lets you skip understanding"** — Recognition routes you to the technique NEIGHBORHOOD, and applying it still requires understanding the technique ([02]'s map-narrows-instantiation-remains): the recognized "this is DP" that still needs the state definition you can only do if you UNDERSTAND DP ([14_MM DP-state]), the recognized "sliding window" that needs the invariant. "Skip understanding" inverts the relationship — recognition is faster BECAUSE of understanding (you recognize structures you understand deeply), and it delivers you to a technique you then must apply with understanding, so the engine amplifies understanding rather than replacing it, and the person who "recognizes" patterns they do not understand can name them and not apply them.

**"Faster recognition is the goal"** — Recognition SPEED is a byproduct of depth-of-understanding and breadth-of-exposure, not a directly-trainable end ([09_Career/07 speed-is-byproduct, 05_Problem_Solving]): the drilling-for-recognition-speed that memorizes problem-to-pattern pairs (fast on seen problems, lost on novel structures — the [04_Patterns] memorization trap), versus the deep understanding that recognizes fast AND transfers to new disguises. "Faster recognition is the goal" produces the brittle memorizer — the actual goal is robust recognition (from deep understanding of the patterns and wide exposure to their disguises), which is fast as a side effect and adaptable to novel problems, and the practice that chases speed directly (memorize the mappings) builds fragile fast-recall while the practice that builds understanding-and-exposure builds the durable recognition the engine is supposed to be.

**"When two patterns fit, pick the more powerful one"** — Ties break by cheapest DISPROOF, not power ([14_MM trigger-guide]): test the simpler candidate against a hostile small input first (30 seconds either eliminates it or promotes it), because the power-heuristic runs backwards (setters bait advanced-pattern overreach — the sorted-greedy that solves the fake-segment-tree problem). "Pick the more powerful" is the sophistication-bias that setters exploit — the tie-break discipline is adversarial testing of the simpler option ([13_Greedy-vs-DP]'s cheapest-disproof, the [04_Pattern-Recognition] 5-element-counterexample), which either confirms the simple solution or reveals the need for the complex one, and reaching for the powerful pattern by default over-engineers the problems that the simple pattern solves.

**"The recognition engine, once built, stays sharp"** — Recognition DECAYS without practice, drifting toward the few patterns you used most recently ([04_Pattern-Recognition]'s decay, [09_Career/09]): the engine that atrophies after months away (everything starts looking like the three patterns from your last job), the disguise-recognition that fades. "Stays sharp" ignores the perceptual-skill decay — the recognition engine is a maintained capability (the [04_Pattern-Recognition] maintenance-dose: mixed, unlabeled problems weekly), and the maintenance must be MIXED (blocked practice re-teaches the label; mixed practice re-teaches the recognition — only the second is the engine), which is why the engine is a garden not a monument, requiring the ongoing mixed-practice dose to stay sharp, and the person who built it and stopped practicing finds it rusted toward their recent-most-used patterns.
