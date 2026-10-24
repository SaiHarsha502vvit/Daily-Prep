# 💎 Part 5: 2d Dynamic Programming

> **Navigation**: [← Classic DP Problems With Traces](03_classic_dp_problems_with_traces.md) | [Chapter overview](../04b_DP_Fundamentals.md)
> Page 4 of 4 in **DP Fundamentals**


## Problem 5: Unique Paths

```java
// Grid of m x n. How many ways from top-left to bottom-right?
// Can only move right or down.

// STEP 2: dp[i][j] = number of ways to reach cell (i, j)
// STEP 3: dp[i][j] = dp[i-1][j] + dp[i][j-1]
// STEP 4: dp[0][j] = 1, dp[i][0] = 1 (only one way to reach first row/col)

public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];

    // Base cases: first row and first column
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    for (int i = 0; i < m; i++) dp[i][0] = 1;

    // Fill the rest
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }

    return dp[m - 1][n - 1];
}

// TRACE for m=3, n=3:
// dp table:
// 1  1  1
// 1  2  3
// 1  3  6
//
// dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2
// dp[1][2] = dp[0][2] + dp[1][1] = 1 + 2 = 3
// dp[2][1] = dp[1][1] + dp[2][0] = 2 + 1 = 3
// dp[2][2] = dp[1][2] + dp[2][1] = 3 + 3 = 6
```

## Problem 6: Longest Common Subsequence (LCS)

```java
// text1 = "abcde", text2 = "ace"
// Find length of longest common subsequence

// STEP 2: dp[i][j] = LCS of text1[0...i-1] and text2[0...j-1]
// STEP 3: If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
//         Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
// STEP 4: dp[0][j] = 0, dp[i][0] = 0 (empty string)

public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
}

// TRACE for text1 = "abcde", text2 = "ace":
//     ""  a  c  e
// ""   0  0  0  0
// a    0  1  1  1
// b    0  1  1  1
// c    0  1  2  2
// d    0  1  2  2
// e    0  1  2  3
//
// Answer: 3 (LCS = "ace")
```

## Problem 7: 0/1 Knapsack

```java
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
// Maximize value without exceeding capacity

// STEP 2: dp[i][w] = max value using items 0..i-1 with capacity w
// STEP 3: dp[i][w] = max(
//           dp[i-1][w],                    // Don't take item i-1
//           dp[i-1][w-weight[i-1]] + value[i-1]  // Take item i-1
//         )
// STEP 4: dp[0][w] = 0 (no items)

public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// TRACE for weights=[1,2,3], values=[6,10,12], capacity=5:
//       w: 0  1  2  3  4  5
// item 0:  0  0  0  0  0  0
// item 1:  0  6  6  6  6  6   (item 0: w=1, v=6)
// item 2:  0  6 10 16 16 16   (item 1: w=2, v=10)
// item 3:  0  6 10 16 18 22   (item 2: w=3, v=12)
//
// dp[3][5] = 22 (take items 1 and 2: weights 2+3=5, values 10+12=22)
```

---

## 🎨 Part 6: DP Patterns

### Pattern 1: Linear DP

```text
dp[i] depends on dp[i-1], dp[i-2], etc.
Examples: Fibonacci, House Robber, Climbing Stairs

STATE: Single index
TRANSITION: dp[i] = f(dp[i-1], dp[i-2], ...)
```

### Pattern 2: Grid DP

```text
dp[i][j] depends on dp[i-1][j], dp[i][j-1], dp[i-1][j-1]
Examples: Unique Paths, Min Path Sum, Edit Distance

STATE: Two indices (row, column)
TRANSITION: dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
```

### Pattern 3: String DP

```text
dp[i][j] for two strings s1[0..i], s2[0..j]
Examples: LCS, Edit Distance, Regex Matching

STATE: Indices into both strings
TRANSITION: Based on character match/mismatch
```

### Pattern 4: Knapsack DP

```text
dp[i][w] for items 0..i with capacity w
Examples: 0/1 Knapsack, Subset Sum, Coin Change

STATE: Item index + remaining capacity
TRANSITION: Take or don't take current item
```

### Pattern 5: Interval DP

```text
dp[i][j] for interval [i, j]
Examples: Matrix Chain Multiplication, Burst Balloons

STATE: Start and end of interval
TRANSITION: Try all split points k between i and j
```


---

## 🧠 Part 7: Memoization vs Tabulation

**MEMOIZATION (Top-Down)**

```text
Approach:    Recursive with caching
Direction:   Start from main problem, recurse to subproblems
When used:   Only computes needed subproblems
Space:       Recursion stack + memo table
Pros:        Natural, easy to write, lazy evaluation
Cons:        Recursion overhead, stack overflow risk
                   TABULATION (Bottom-Up)
Approach:    Iterative with table
Direction:   Start from base cases, build up to main problem
When used:   Computes ALL subproblems
Space:       Just the table (no stack)
Pros:        No recursion overhead, can optimize space
Cons:        Need to think about computation order

WHEN TO USE WHICH?

MEMOIZATION:
- When not all subproblems are needed
- When recursion depth is manageable
- When problem is easier to think recursively

TABULATION:
- When you need all subproblems anyway
- When recursion depth could overflow
- When you want to optimize space (sliding window)
```

---

## ⚡ Part 8: Space Optimization

```java
// Many DP problems can be optimized from O(n²) to O(n) space!

// EXAMPLE: LCS can be done with 2 rows instead of full table
public int lcsOptimized(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[] prev = new int[n + 1];
    int[] curr = new int[n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        // Swap rows
        int[] temp = prev;
        prev = curr;
        curr = temp;
        Arrays.fill(curr, 0);
    }

    return prev[n];
}

// KEY INSIGHT:
// If dp[i][j] only depends on dp[i-1][...] and dp[i][j-1]
// You only need 2 rows (or even 1 row with careful ordering)!
```

---

## 💪 Part 9: Practice Problems By Pattern

### Linear DP

1. Climbing Stairs
2. House Robber
3. Maximum Subarray (Kadane's)
4. Best Time to Buy and Sell Stock
5. Decode Ways

### Grid DP

1. Unique Paths
2. Minimum Path Sum
3. Maximal Square
4. Dungeon Game
5. Cherry Pickup

### String DP

1. Longest Common Subsequence
2. Edit Distance
3. Longest Palindromic Subsequence
4. Regular Expression Matching
5. Wildcard Matching

### Knapsack DP

1. 0/1 Knapsack
2. Coin Change
3. Partition Equal Subset Sum
4. Target Sum
5. Ones and Zeroes

---

## 📌 Part 10: Edge Cases Checklist

```
⬜ Empty input: n = 0, empty array, empty string
⬜ Single element: n = 1, single character
⬜ All same values: [5, 5, 5, 5]
⬜ All zeros: [0, 0, 0, 0]
⬜ Negative values: [-1, -2, -3]
⬜ Large values: near Integer.MAX_VALUE (overflow!)
⬜ No solution exists: return -1 or special value
⬜ Multiple solutions: verify you want min/max/count
```

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                                 | Related Content                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| DP pattern recognition                | [DP Pattern Recognition](../../04_Patterns_Templates/16_DP_Pattern_Recognition.md) |
| DP practice problems                  | [Problem Solving — DP](../../05_Problem_Solving/11_Dynamic_Programming.md)         |
| Knapsack family (DP)                  | [Knapsack Family](../../04_Patterns_Templates/23_Knapsack_Family.md)               |
| Memoization in React (useMemo)        | [React Hooks](../../15_React_Frontend/03_Hooks_Deep_Dive.md)                       |
| Optimization in ML (gradient descent) | [Math for ML](../../25_Python_ML_DL_NLP/04_Math_For_ML.md)                         |
| Greedy vs DP                          | [Greedy Algorithms](../12_Greedy_Algorithms_Complete.md)                           |

---

### 📎 Reference Anchor

**OpenJDK / Apache Commons — DP in production**
- `String.valueOf()` / `String.format()`: Java's `String` class uses DP-like memoization internally for `intern()` — strings are deduplicated in the string pool, equivalent to memoizing character sequences.
- Apache Commons Text `LevenshteinDistance`: [LevenshteinDistance.java](https://github.com/apache/commons-text/blob/master/src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java) — production edit-distance DP with space-optimized rolling array (O(min(m,n)) space). **Invariant**: `dp[i][j]` = edit distance between first i chars of s1 and first j chars of s2. Rolling array keeps only current and previous row.
- **Local rewrite rule**: Top-down (memoized) DP has function call overhead per subproblem. Bottom-up avoids call stack entirely — for n > 10⁴ subproblems, bottom-up is 2–5× faster in Java due to reduced GC and call overhead.
- **Constraint warning**: `int[][] dp = new int[n+1][m+1]` for n=m=10⁴ = 400 MB — exceeds default heap. Use rolling array (O(m)) or sparse map for large-n DP.

---

### When DP Breaks

#### 1. Identifying the Wrong State — Missing a Dimension

**What breaks**: Coin change with coin limit — "minimum coins to make amount A, using each coin at most k times." Naive state `dp[a]` loses track of how many times each coin was used. The correct state is `dp[a][coin_index]` or `dp[a][count]`.
**Rule**: If the recurrence's "remaining choice" doesn't fit in a single integer, add a dimension. Missing state dimensions cause silently wrong answers, not runtime errors.

#### 2. Memoizing with Mutable State (Wrong Cache Key)

**What breaks**: Using an array reference as a HashMap key in top-down memoization. Two calls with arrays `{1,2,3}` and `{1,2,3}` (different objects, same values) produce different keys → cache is never hit → exponential time despite the memo table.
**Fix**: Serialize state to a canonical key (e.g., `Arrays.toString(arr) + "," + index`) or convert to an `int` index if state space is bounded.

#### 3. Off-by-One in Base Case Initialization

**What breaks**: `dp[0] = 1` vs `dp[0] = 0` is the most common DP bug. For coin change (minimum coins): `dp[0] = 0` (0 coins for amount 0). For count of ways: `dp[0] = 1` (one way to make 0: use no coins). Mixing these gives answers off by 1 or wrong by a factor.
**Debug technique**: Trace the base case by hand for amount=0 and amount=1 before running. These two values exercise the init and the first step.

#### 4. Unbounded vs 0/1 vs Bounded — Wrong Loop Direction

**What breaks**: 0/1 Knapsack requires iterating the weight dimension *backwards* (to prevent reusing the same item). Iterating forwards accidentally makes it unbounded knapsack (each item usable many times). This is the single most common knapsack implementation bug.
**Fix**: 0/1 → inner loop `for (w = capacity; w >= weight[i]; w--)`. Unbounded → inner loop `for (w = weight[i]; w <= capacity; w++)`.

---

[← Classic DP Problems With Traces](03_classic_dp_problems_with_traces.md) | [Chapter overview](../04b_DP_Fundamentals.md)
