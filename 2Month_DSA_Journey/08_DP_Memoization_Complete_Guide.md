# 🧮 Dynamic Programming & Memoization: Complete Guide

## From Recursion to Optimal Solutions

---

# PART 1: UNDERSTANDING DP FROM SCRATCH

## What is Dynamic Programming?

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              DYNAMIC PROGRAMMING - COMPLETE UNDERSTANDING                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DYNAMIC PROGRAMMING?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Dynamic Programming (DP) is a method for solving complex problems by:       │
│ 1. Breaking them into simpler OVERLAPPING subproblems                       │
│ 2. Solving each subproblem ONLY ONCE                                        │
│ 3. STORING the results to avoid redundant computation                       │
│                                                                              │
│ DP = RECURSION + MEMOIZATION (REMEMBERING)                                  │
│                                                                              │
│ INVENTOR: Richard Bellman (1950s) at RAND Corporation                       │
│ NAME ORIGIN: "Dynamic" sounded impressive to government funders!            │
│              (Bellman chose it to hide the mathematical nature of his work) │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES DP SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Optimization problems where:                                   │
│ • You need the BEST solution (max/min)                                       │
│ • Making decisions at each step                                              │
│ • Decisions affect future choices                                            │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Navigation: What's the shortest route? (Same intersections = subproblems) │
│ • Finance: Max profit from stock trades (Each day = decision point)         │
│ • Text: How similar are two strings? (Edit distance)                         │
│ • Packing: Most value in limited space (Knapsack problem)                   │
│ • Scheduling: Best order for tasks (Job scheduling)                          │
│                                                                              │
│ THE INSIGHT:                                                                 │
│ Instead of exploring ALL possible combinations (exponential), DP builds     │
│ optimal solutions from optimal sub-solutions (polynomial)!                  │
│                                                                              │
│ BEFORE DP (Brute Force):  O(2^n) or worse - trying all combinations         │
│ AFTER DP:                 O(n²) or O(n×m) - building from subproblems       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES DP WORK? (THE MATHEMATICAL FOUNDATION)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TWO ESSENTIAL PROPERTIES (Both MUST be true):                                │
│                                                                              │
│ 1. OPTIMAL SUBSTRUCTURE                                                      │
│    "Optimal solution to the whole = combination of optimal sub-solutions"    │
│                                                                              │
│    Example: Shortest Path A→C                                                │
│    If A→B→C is shortest, then:                                               │
│    • A→B part must be the shortest A→B path                                 │
│    • B→C part must be the shortest B→C path                                 │
│                                                                              │
│    If this wasn't true, you could find a shorter A→C!                       │
│                                                                              │
│ 2. OVERLAPPING SUBPROBLEMS                                                   │
│    "Same subproblems appear multiple times during recursion"                 │
│                                                                              │
│    Example: Fibonacci fib(5)                                                 │
│    fib(5) = fib(4) + fib(3)                                                 │
│    fib(4) = fib(3) + fib(2)  ← fib(3) needed TWICE!                         │
│    fib(3) = fib(2) + fib(1)  ← fib(2) needed THRICE!                        │
│                                                                              │
│    If subproblems DON'T overlap → Use Divide & Conquer instead!             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DP? (INTERVIEW RECOGNITION PATTERNS)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ SIGNAL 1: "Find maximum/minimum..." or "Count the number of ways..."        │
│    → Optimization = DP likely                                                │
│                                                                              │
│ SIGNAL 2: "Given choices at each step..."                                    │
│    → Decision making with future consequences = DP                           │
│                                                                              │
│ SIGNAL 3: "Can you reach...?" or "Is it possible...?"                       │
│    → Often can be framed as DP (true/false states)                          │
│                                                                              │
│ SIGNAL 4: Problem involves sequences/grids                                   │
│    → String problems, matrix traversal = Classic DP                          │
│                                                                              │
│ SIGNAL 5: Same question repeated with different parameters                   │
│    → Recursive structure with overlapping = DP                               │
│                                                                              │
│ ┌────────────────────────────────┬─────────────────────────────────────────┐│
│ │ USE DP WHEN                    │ DON'T USE DP WHEN                       ││
│ ├────────────────────────────────┼─────────────────────────────────────────┤│
│ │ Need optimal solution          │ Just need any valid solution            ││
│ │ Subproblems overlap            │ Subproblems independent (use D&C)       ││
│ │ Problem has optimal structure  │ Local choices don't build global optimal││
│ │ Can define clear state         │ State space is too large                ││
│ └────────────────────────────────┴─────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES DP WORK? (TWO APPROACHES)                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ APPROACH 1: TOP-DOWN (MEMOIZATION)                                           │
│ ┌─────────────────────────────────────────────────────────────┐             │
│ │ 1. Start with original problem                              │             │
│ │ 2. Recursively break into subproblems                       │             │
│ │ 3. Before computing, check if answer already cached         │             │
│ │ 4. If cached: return it | If not: compute and cache         │             │
│ │                                                              │             │
│ │ ANALOGY: You're asked a hard question. You think recursively │             │
│ │ but write down answers you've figured out on a notepad.      │             │
│ └─────────────────────────────────────────────────────────────┘             │
│                                                                              │
│ APPROACH 2: BOTTOM-UP (TABULATION)                                           │
│ ┌─────────────────────────────────────────────────────────────┐             │
│ │ 1. Identify base cases (smallest subproblems)              │             │
│ │ 2. Fill table starting from base cases                      │             │
│ │ 3. Build up to the answer iteratively                       │             │
│ │ 4. Final cell contains the answer                           │             │
│ │                                                              │             │
│ │ ANALOGY: Building a pyramid brick by brick from the bottom.  │             │
│ │ Each brick relies on the ones below it.                      │             │
│ └─────────────────────────────────────────────────────────────┘             │
│                                                                              │
│ COMPARISON:                                                                  │
│ ┌───────────────────────┬───────────────────────────────────────┐           │
│ │ Top-Down (Memo)       │ Bottom-Up (Tabulation)                │           │
│ ├───────────────────────┼───────────────────────────────────────┤           │
│ │ Easier to write       │ Usually faster (no recursion)         │           │
│ │ Only solves needed    │ Solves ALL subproblems                │           │
│ │ Risk of stack overflow│ No stack overflow                      │           │
│ │ Lazy evaluation       │ Eager evaluation                       │           │
│ └───────────────────────┴───────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. IDENTIFYING THE STATE (Hardest Part!):                                    │
│    "What information do I need to solve a subproblem?"                       │
│    Wrong state definition = wrong solution                                   │
│    Tip: Ask "What changes between recursive calls?"                          │
│                                                                              │
│ 2. FINDING THE RECURRENCE:                                                   │
│    "How does current state relate to previous states?"                       │
│    Tip: Think about the LAST decision/step                                   │
│                                                                              │
│ 3. BASE CASE ERRORS:                                                         │
│    Missing or wrong base cases cause wrong answers                           │
│    Tip: What's the smallest problem you can answer directly?                 │
│                                                                              │
│ 4. OFF-BY-ONE ERRORS:                                                        │
│    Array indices, loop bounds - classic source of bugs                       │
│    Tip: Trace through small examples by hand                                 │
│                                                                              │
│ 5. SPACE COMPLEXITY:                                                         │
│    2D DP tables can be huge for large inputs                                 │
│    Tip: Often can optimize to 1D by keeping only previous row               │
│                                                                              │
│ 6. RECONSTRUCTION PATH:                                                      │
│    DP gives optimal VALUE, but sometimes you need the actual SOLUTION       │
│    Tip: Store "choice made" at each step, then backtrack                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ COMPLEXITY IMPROVEMENT (Why DP is Powerful):                                 │
│ ┌──────────────────────┬─────────────────────┬────────────────────────────┐ │
│ │ Problem              │ Brute Force         │ With DP                    │ │
│ ├──────────────────────┼─────────────────────┼────────────────────────────┤ │
│ │ Fibonacci            │ O(2^n)              │ O(n)                       │ │
│ │ Longest Common Subseq│ O(2^(m+n))          │ O(m×n)                     │ │
│ │ 0/1 Knapsack         │ O(2^n)              │ O(n×W)                     │ │
│ │ Edit Distance        │ O(3^n)              │ O(m×n)                     │ │
│ │ Matrix Chain         │ O(n!)               │ O(n³)                      │ │
│ │ Coin Change          │ O(amount^n)         │ O(n×amount)                │ │
│ └──────────────────────┴─────────────────────┴────────────────────────────┘ │
│                                                                              │
│ TYPICAL DP OUTPUT:                                                           │
│ • Single number: Max profit, min cost, number of ways                        │
│ • Boolean: Is it possible?                                                   │
│ • Array/Table: All subproblem solutions (for path reconstruction)           │
│ • The actual solution: Requires backtracking through DP table               │
│                                                                              │
│ SPACE-TIME TRADEOFF:                                                         │
│ • Standard 2D DP: O(n×m) time, O(n×m) space                                 │
│ • Space-optimized: O(n×m) time, O(min(n,m)) space (keep 2 rows)            │
│ • Ultra-optimized: Sometimes O(1) space possible (like Fibonacci)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### The Story Metaphor

```
THE STORY:
Imagine you're solving a maze. Every time you hit a dead end,
you go back to the start and try again.

BRUTE FORCE:
- Start → try path A → dead end → go back to start
- Start → try path B → dead end → go back to start
- You keep walking the same initial path!

SMART WAY (DP):
- Start → try path A → dead end → MARK IT
- Go back, but remember "path A = dead end"
- Next time, skip path A directly!

THIS IS MEMOIZATION: Remember what you've already calculated.
```

---

# PART 2: FIBONACCI - THE GATEWAY TO DP

## Evolution of Solutions

### Level 1: Pure Recursion (❌ Inefficient)

```java
public int fibRecursive(int n) {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// TIME: O(2^n) - Exponential!
// SPACE: O(n) - Call stack

// CALL TREE for fib(5):
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3)
//                   /    \      /    \
//               fib(3)  fib(2) fib(2) fib(1)
//               /   \
//           fib(2) fib(1)
//
// fib(3) computed 2 times
// fib(2) computed 3 times
// WASTEFUL!
```

### Level 2: Memoization - Top Down (✅ Efficient)

```java
public int fibMemo(int n, int[] memo) {
    // Base case
    if (n <= 1) return n;

    // Check if already computed
    if (memo[n] != 0) return memo[n];

    // Compute and STORE
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);

    return memo[n];
}

// Usage: fibMemo(n, new int[n + 1])
// TIME: O(n) - Each subproblem solved once
// SPACE: O(n) - Memo array + call stack

// CALL TREE with memoization:
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3) ← CACHED! Return immediately
//                   /    \
//               fib(3)  fib(2) ← CACHED!
//               /   \
//           fib(2) fib(1)
//           /   \
//       fib(1) fib(0)
```

### Level 3: Tabulation - Bottom Up (✅✅ Best)

```java
public int fibTabulation(int n) {
    if (n <= 1) return n;

    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = 1;

    // Build from smallest to largest
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TIME: O(n)
// SPACE: O(n)

// TRACE for n = 5:
// dp[0] = 0
// dp[1] = 1
// dp[2] = dp[1] + dp[0] = 1 + 0 = 1
// dp[3] = dp[2] + dp[1] = 1 + 1 = 2
// dp[4] = dp[3] + dp[2] = 2 + 1 = 3
// dp[5] = dp[4] + dp[3] = 3 + 2 = 5
```

### Level 4: Space Optimized (✅✅✅ Perfect)

```java
public int fibOptimized(int n) {
    if (n <= 1) return n;

    int prev2 = 0;  // dp[i-2]
    int prev1 = 1;  // dp[i-1]

    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}

// TIME: O(n)
// SPACE: O(1) - Only 2 variables!

// INSIGHT: We only need last 2 values, not entire array!
```

---

# PART 3: THE DP RECIPE

## 5-Step Process

```
STEP 1: IDENTIFY SUBPROBLEM
        "What is the last decision/action?"
        "What information do I need at each step?"

STEP 2: DEFINE STATE
        dp[i] = "answer for subproblem of size i"
        dp[i][j] = "answer considering first i items with capacity j"

STEP 3: FIND RECURRENCE RELATION
        "How does dp[i] relate to smaller subproblems?"
        dp[i] = some_function(dp[i-1], dp[i-2], ...)

STEP 4: IDENTIFY BASE CASES
        "What are the smallest subproblems I know directly?"
        dp[0] = ?, dp[1] = ?

STEP 5: DETERMINE COMPUTATION ORDER
        "In what order should I fill the table?"
        Usually: smaller to larger
```

---

# PART 4: CLASSIC DP PROBLEMS WITH TRACES

## Problem 1: Climbing Stairs

```java
// You can climb 1 or 2 stairs at a time.
// How many ways to reach step n?

// STEP 1: Last action? Either climb 1 step OR 2 steps
// STEP 2: dp[i] = number of ways to reach step i
// STEP 3: dp[i] = dp[i-1] + dp[i-2]
//         (ways to reach i = ways via i-1 + ways via i-2)
// STEP 4: dp[1] = 1, dp[2] = 2
// STEP 5: Fill from 3 to n

public int climbStairs(int n) {
    if (n <= 2) return n;

    int[] dp = new int[n + 1];
    dp[1] = 1;  // 1 way to reach step 1
    dp[2] = 2;  // 2 ways to reach step 2: (1+1) or (2)

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TRACE for n = 5:
// dp[1] = 1    (just step 1)
// dp[2] = 2    (1+1 or 2)
// dp[3] = dp[2] + dp[1] = 2 + 1 = 3    (1+1+1, 1+2, 2+1)
// dp[4] = dp[3] + dp[2] = 3 + 2 = 5
// dp[5] = dp[4] + dp[3] = 5 + 3 = 8
//
// WHY does dp[3] = dp[2] + dp[1]?
// To reach step 3:
//   - Be at step 2, take 1 step → dp[2] ways
//   - Be at step 1, take 2 steps → dp[1] ways
//   Total = dp[2] + dp[1]
```

## Problem 2: House Robber

```java
// Can't rob adjacent houses. Maximize total.
// houses = [2, 7, 9, 3, 1]

// STEP 1: For house i, either rob it OR skip it
// STEP 2: dp[i] = max money robbing houses 0 to i
// STEP 3: dp[i] = max(dp[i-1], dp[i-2] + houses[i])
//         Either skip house i (dp[i-1]) OR rob i (dp[i-2] + houses[i])
// STEP 4: dp[0] = houses[0], dp[1] = max(houses[0], houses[1])
// STEP 5: Fill from 2 to n-1

public int rob(int[] houses) {
    if (houses.length == 0) return 0;
    if (houses.length == 1) return houses[0];

    int[] dp = new int[houses.length];
    dp[0] = houses[0];
    dp[1] = Math.max(houses[0], houses[1]);

    for (int i = 2; i < houses.length; i++) {
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + houses[i]);
    }

    return dp[houses.length - 1];
}

// TRACE for houses = [2, 7, 9, 3, 1]:
// dp[0] = 2
// dp[1] = max(2, 7) = 7
// dp[2] = max(dp[1], dp[0] + 9) = max(7, 2+9) = 11  [rob houses 0, 2]
// dp[3] = max(dp[2], dp[1] + 3) = max(11, 7+3) = 11 [still best: houses 0, 2]
// dp[4] = max(dp[3], dp[2] + 1) = max(11, 11+1) = 12 [rob houses 0, 2, 4]
//
// Answer: 12 (rob houses at indices 0, 2, 4 → values 2, 9, 1)
```

## Problem 3: Coin Change

```java
// coins = [1, 2, 5], amount = 11
// Find minimum coins needed

// STEP 1: Last coin used could be any of the coins
// STEP 2: dp[i] = min coins to make amount i
// STEP 3: dp[i] = min(dp[i - coin] + 1) for each coin
// STEP 4: dp[0] = 0 (0 coins for amount 0)
// STEP 5: Fill from 1 to amount

public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);  // "infinity"
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }

    return dp[amount] > amount ? -1 : dp[amount];
}

// TRACE for coins = [1, 2, 5], amount = 11:
// dp[0] = 0
// dp[1] = min(dp[0]+1) = 1                    [1]
// dp[2] = min(dp[1]+1, dp[0]+1) = min(2, 1) = 1    [2]
// dp[3] = min(dp[2]+1, dp[1]+1) = min(2, 2) = 2    [2,1] or [1,1,1]
// dp[4] = min(dp[3]+1, dp[2]+1) = min(3, 2) = 2    [2,2]
// dp[5] = min(dp[4]+1, dp[3]+1, dp[0]+1) = min(3, 3, 1) = 1    [5]
// dp[6] = min(dp[5]+1, dp[4]+1, dp[1]+1) = min(2, 3, 2) = 2    [5,1]
// ...
// dp[11] = 3    [5, 5, 1]
```

## Problem 4: Longest Increasing Subsequence (LIS)

```java
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
// Find length of longest strictly increasing subsequence

// STEP 1: For each element, either include it or not
// STEP 2: dp[i] = length of LIS ending at index i
// STEP 3: dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]
// STEP 4: dp[i] = 1 for all (each element is LIS of length 1)
// STEP 5: Fill from 0 to n-1, track maximum

public int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);  // Each element is LIS of length 1
    int maxLen = 1;

    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }

    return maxLen;
}

// TRACE for nums = [10, 9, 2, 5, 3, 7, 101, 18]:
// Index:  0   1  2  3  4  5   6    7
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
//
// dp[0] = 1 (just 10)
// dp[1] = 1 (9, can't extend from 10)
// dp[2] = 1 (2, can't extend)
// dp[3] = max(dp[2]+1) = 2 (2 < 5, so LIS: [2,5])
// dp[4] = max(dp[2]+1) = 2 (2 < 3, LIS: [2,3])
// dp[5] = max(dp[2]+1, dp[3]+1, dp[4]+1) = max(2, 3, 3) = 3
//         LIS options: [2,5,7] or [2,3,7]
// dp[6] = max(dp[0]+1, ..., dp[5]+1) = 4 (LIS: [2,5,7,101])
// dp[7] = 4 (LIS: [2,5,7,18])
//
// Answer: 4
```

---

# PART 5: 2D DYNAMIC PROGRAMMING

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

# PART 6: DP PATTERNS

## Pattern 1: Linear DP

```
dp[i] depends on dp[i-1], dp[i-2], etc.
Examples: Fibonacci, House Robber, Climbing Stairs

STATE: Single index
TRANSITION: dp[i] = f(dp[i-1], dp[i-2], ...)
```

## Pattern 2: Grid DP

```
dp[i][j] depends on dp[i-1][j], dp[i][j-1], dp[i-1][j-1]
Examples: Unique Paths, Min Path Sum, Edit Distance

STATE: Two indices (row, column)
TRANSITION: dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
```

## Pattern 3: String DP

```
dp[i][j] for two strings s1[0..i], s2[0..j]
Examples: LCS, Edit Distance, Regex Matching

STATE: Indices into both strings
TRANSITION: Based on character match/mismatch
```

## Pattern 4: Knapsack DP

```
dp[i][w] for items 0..i with capacity w
Examples: 0/1 Knapsack, Subset Sum, Coin Change

STATE: Item index + remaining capacity
TRANSITION: Take or don't take current item
```

## Pattern 5: Interval DP

```
dp[i][j] for interval [i, j]
Examples: Matrix Chain Multiplication, Burst Balloons

STATE: Start and end of interval
TRANSITION: Try all split points k between i and j
```

---

# PART 7: MEMOIZATION VS TABULATION

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMOIZATION (Top-Down)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Recursive with caching                             │
│ Direction:   Start from main problem, recurse to subproblems    │
│ When used:   Only computes needed subproblems                   │
│ Space:       Recursion stack + memo table                       │
│ Pros:        Natural, easy to write, lazy evaluation            │
│ Cons:        Recursion overhead, stack overflow risk            │
├─────────────────────────────────────────────────────────────────┤
│                    TABULATION (Bottom-Up)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Iterative with table                               │
│ Direction:   Start from base cases, build up to main problem    │
│ When used:   Computes ALL subproblems                           │
│ Space:       Just the table (no stack)                          │
│ Pros:        No recursion overhead, can optimize space          │
│ Cons:        Need to think about computation order              │
└─────────────────────────────────────────────────────────────────┘

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

# PART 8: SPACE OPTIMIZATION

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

# PART 9: PRACTICE PROBLEMS BY PATTERN

## Linear DP

1. Climbing Stairs
2. House Robber
3. Maximum Subarray (Kadane's)
4. Best Time to Buy and Sell Stock
5. Decode Ways

## Grid DP

1. Unique Paths
2. Minimum Path Sum
3. Maximal Square
4. Dungeon Game
5. Cherry Pickup

## String DP

1. Longest Common Subsequence
2. Edit Distance
3. Longest Palindromic Subsequence
4. Regular Expression Matching
5. Wildcard Matching

## Knapsack DP

1. 0/1 Knapsack
2. Coin Change
3. Partition Equal Subset Sum
4. Target Sum
5. Ones and Zeroes

---

# PART 10: EDGE CASES CHECKLIST

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

---

# PART 11: Advanced DP Patterns

## Pattern 1: Digit DP

```
CONCEPT:
Count numbers with certain digit properties in a range [L, R].
Build numbers digit by digit, track constraints.

STATE:
- Position in the number
- Whether we're still bounded by the limit
- Any accumulated properties (sum, count, etc.)
```

```java
// Count numbers from 1 to n with digit sum = k
public class DigitDP {
    private Long[][][] memo;
    private String num;

    public long countNumbersWithDigitSum(int n, int k) {
        num = String.valueOf(n);
        memo = new Long[num.length()][k + 1][2];
        return solve(0, k, true);
    }

    private long solve(int pos, int remaining, boolean tight) {
        // Base case: processed all digits
        if (pos == num.length()) {
            return remaining == 0 ? 1 : 0;
        }

        // Check memo
        int tightIdx = tight ? 1 : 0;
        if (memo[pos][remaining][tightIdx] != null) {
            return memo[pos][remaining][tightIdx];
        }

        // Determine upper limit for this digit
        int limit = tight ? (num.charAt(pos) - '0') : 9;

        long result = 0;
        for (int digit = 0; digit <= limit; digit++) {
            if (digit <= remaining) {
                boolean newTight = tight && (digit == limit);
                result += solve(pos + 1, remaining - digit, newTight);
            }
        }

        memo[pos][remaining][tightIdx] = result;
        return result;
    }
}

// Examples:
// How many numbers in [1, 100] have digit sum = 5?
// Answer: 10 (5, 14, 23, 32, 41, 50, 104... wait, cap at 100)
// Actually: 5, 14, 23, 32, 41, 50 = 6 numbers
```

## Pattern 2: Bitmask DP

```
CONCEPT:
Use bitmask to represent which elements are "used" or "visited".
Each bit represents one element's state.

WHEN TO USE:
- Small n (typically n ≤ 20 due to 2^n states)
- Need to track subset of elements
- Traveling Salesman, Assignment problem
```

```java
// Traveling Salesman Problem (TSP)
public class TSP {
    private int[][] dist;
    private int[][] memo;
    private int n;

    public int findShortestRoute(int[][] distances) {
        this.dist = distances;
        this.n = distances.length;
        this.memo = new int[1 << n][n];

        for (int[] row : memo) Arrays.fill(row, -1);

        // Start from city 0, visit all cities, return to 0
        return solve(1, 0);  // mask=1 means city 0 is visited
    }

    private int solve(int mask, int pos) {
        // All cities visited, return to start
        if (mask == (1 << n) - 1) {
            return dist[pos][0];
        }

        if (memo[mask][pos] != -1) {
            return memo[mask][pos];
        }

        int result = Integer.MAX_VALUE;

        // Try visiting each unvisited city
        for (int next = 0; next < n; next++) {
            if ((mask & (1 << next)) == 0) {  // City not visited
                int newMask = mask | (1 << next);
                int cost = dist[pos][next] + solve(newMask, next);
                result = Math.min(result, cost);
            }
        }

        memo[mask][pos] = result;
        return result;
    }
}

// Visual:
// For 4 cities: 0, 1, 2, 3
// mask = 0101 means cities 0 and 2 are visited
// mask = 1111 means all cities visited
```

```java
// Minimum cost to assign n workers to n jobs
public class AssignmentProblem {
    private int[][] cost;
    private int[] memo;
    private int n;

    public int minCostAssignment(int[][] cost) {
        this.cost = cost;
        this.n = cost.length;
        this.memo = new int[1 << n];
        Arrays.fill(memo, -1);

        return solve(0, 0);
    }

    // worker = which worker we're assigning
    // mask = which jobs are taken
    private int solve(int worker, int mask) {
        if (worker == n) return 0;  // All workers assigned

        if (memo[mask] != -1) return memo[mask];

        int result = Integer.MAX_VALUE;
        for (int job = 0; job < n; job++) {
            if ((mask & (1 << job)) == 0) {  // Job not taken
                int newMask = mask | (1 << job);
                int total = cost[worker][job] + solve(worker + 1, newMask);
                result = Math.min(result, total);
            }
        }

        memo[mask] = result;
        return result;
    }
}
```

## Pattern 3: Interval DP

```
CONCEPT:
Solve problems on intervals/subarrays by considering all ways
to split the interval and combining results.

RECURRENCE:
dp[i][j] = optimal value for interval [i, j]
         = combine(dp[i][k], dp[k+1][j]) for all k in [i, j)
```

```java
// Matrix Chain Multiplication
public class MatrixChainMultiplication {
    public int minMultiplications(int[] dims) {
        // dims = [d0, d1, d2, ..., dn]
        // Matrix i has dimensions dims[i-1] x dims[i]
        int n = dims.length - 1;  // Number of matrices
        int[][] dp = new int[n][n];

        // Length of chain
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;

                // Try all split points
                for (int k = i; k < j; k++) {
                    // Cost = left chain + right chain + multiplication
                    int cost = dp[i][k] + dp[k + 1][j] +
                               dims[i] * dims[k + 1] * dims[j + 1];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }

        return dp[0][n - 1];
    }
}

// Example: dims = [10, 30, 5, 60]
// Matrices: A (10x30), B (30x5), C (5x60)
// (A*B)*C = 10*30*5 + 10*5*60 = 1500 + 3000 = 4500
// A*(B*C) = 30*5*60 + 10*30*60 = 9000 + 18000 = 27000
// Optimal: 4500
```

```java
// Burst Balloons (LeetCode 312)
public int maxCoins(int[] nums) {
    int n = nums.length;
    // Add 1 at boundaries
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) {
        arr[i + 1] = nums[i];
    }

    int[][] dp = new int[n + 2][n + 2];

    // len = length of interval
    for (int len = 1; len <= n; len++) {
        for (int left = 1; left <= n - len + 1; left++) {
            int right = left + len - 1;

            // Try bursting each balloon last in this interval
            for (int last = left; last <= right; last++) {
                int coins = arr[left - 1] * arr[last] * arr[right + 1];
                coins += dp[left][last - 1] + dp[last + 1][right];
                dp[left][right] = Math.max(dp[left][right], coins);
            }
        }
    }

    return dp[1][n];
}
```

## Pattern 4: Tree DP

```
CONCEPT:
DP on tree structures. Usually compute answers for subtrees
and combine at each node.

COMMON PATTERNS:
- dp[node] = something about subtree rooted at node
- dp[node][0/1] = with/without including this node
```

```java
// House Robber III - Rob houses on a tree (can't rob adjacent)
public class TreeDP {
    public int rob(TreeNode root) {
        int[] result = robSub(root);
        return Math.max(result[0], result[1]);
    }

    // Returns [max if not robbing this node, max if robbing this node]
    private int[] robSub(TreeNode node) {
        if (node == null) return new int[]{0, 0};

        int[] left = robSub(node.left);
        int[] right = robSub(node.right);

        // If not robbing this node, children can be robbed or not
        int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        // If robbing this node, children cannot be robbed
        int rob = node.val + left[0] + right[0];

        return new int[]{notRob, rob};
    }
}

// Binary Tree Maximum Path Sum
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxPath(root, maxSum);
    return maxSum[0];
}

private int maxPath(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Max sum of path going through left/right child
    int leftMax = Math.max(0, maxPath(node.left, maxSum));
    int rightMax = Math.max(0, maxPath(node.right, maxSum));

    // Max path passing through this node
    int pathThrough = node.val + leftMax + rightMax;
    maxSum[0] = Math.max(maxSum[0], pathThrough);

    // Return max path starting at this node and going down
    return node.val + Math.max(leftMax, rightMax);
}
```

## Pattern 5: DP with Monotonic Optimization

```
CONCEPT:
Use monotonic data structures to optimize DP transitions.
Reduces O(n²) to O(n) or O(n log n).
```

```java
// Sliding Window Maximum approach in DP
// dp[i] = max(dp[j] + cost[j]) for j in [i-k, i-1]
public int[] dpWithDeque(int[] arr, int k) {
    int n = arr.length;
    int[] dp = new int[n];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Remove elements outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k) {
            deque.pollFirst();
        }

        // Current dp value uses best in window
        if (!deque.isEmpty()) {
            dp[i] = dp[deque.peekFirst()] + arr[i];
        } else {
            dp[i] = arr[i];
        }

        // Maintain monotonic decreasing
        while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i]) {
            deque.pollLast();
        }
        deque.addLast(i);
    }

    return dp;
}
```

---

# PART 12: Complete DP Problem Solutions

## Problem 1: Longest Increasing Subsequence with Path

```java
public class LIS {
    public List<Integer> longestIncreasingSubsequence(int[] nums) {
        int n = nums.length;
        if (n == 0) return new ArrayList<>();

        int[] dp = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dp, 1);
        Arrays.fill(parent, -1);

        int maxLen = 1, maxIdx = 0;

        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            if (dp[i] > maxLen) {
                maxLen = dp[i];
                maxIdx = i;
            }
        }

        // Reconstruct path
        List<Integer> path = new ArrayList<>();
        int idx = maxIdx;
        while (idx != -1) {
            path.add(nums[idx]);
            idx = parent[idx];
        }
        Collections.reverse(path);

        return path;
    }

    // O(n log n) solution using binary search
    public int lisOptimized(int[] nums) {
        List<Integer> tails = new ArrayList<>();

        for (int num : nums) {
            int pos = Collections.binarySearch(tails, num);
            if (pos < 0) pos = -(pos + 1);

            if (pos == tails.size()) {
                tails.add(num);
            } else {
                tails.set(pos, num);
            }
        }

        return tails.size();
    }
}
```

## Problem 2: Edit Distance with Operations

```java
public class EditDistance {
    public String[] minEditOperations(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        // Base cases
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        // Fill DP table
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }

        // Backtrack to find operations
        List<String> ops = new ArrayList<>();
        int i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 &&
                word1.charAt(i - 1) == word2.charAt(j - 1)) {
                i--; j--;
            } else if (i > 0 && j > 0 &&
                       dp[i][j] == dp[i - 1][j - 1] + 1) {
                ops.add("Replace '" + word1.charAt(i - 1) +
                        "' with '" + word2.charAt(j - 1) + "' at position " + i);
                i--; j--;
            } else if (j > 0 && dp[i][j] == dp[i][j - 1] + 1) {
                ops.add("Insert '" + word2.charAt(j - 1) +
                        "' at position " + (i + 1));
                j--;
            } else {
                ops.add("Delete '" + word1.charAt(i - 1) +
                        "' at position " + i);
                i--;
            }
        }

        Collections.reverse(ops);
        return ops.toArray(new String[0]);
    }
}
```

## Problem 3: Word Break II (All Possible Sentences)

```java
public class WordBreak {
    public List<String> wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        Map<Integer, List<String>> memo = new HashMap<>();
        return dfs(s, 0, dict, memo);
    }

    private List<String> dfs(String s, int start, Set<String> dict,
                             Map<Integer, List<String>> memo) {
        if (memo.containsKey(start)) {
            return memo.get(start);
        }

        List<String> result = new ArrayList<>();

        if (start == s.length()) {
            result.add("");
            return result;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String word = s.substring(start, end);
            if (dict.contains(word)) {
                List<String> sublist = dfs(s, end, dict, memo);
                for (String sub : sublist) {
                    result.add(word + (sub.isEmpty() ? "" : " " + sub));
                }
            }
        }

        memo.put(start, result);
        return result;
    }
}

// Example: s = "catsanddog", dict = ["cat", "cats", "and", "sand", "dog"]
// Output: ["cats and dog", "cat sand dog"]
```

## Problem 4: Palindrome Partitioning with Minimum Cuts

```java
public class PalindromePartition {
    public int minCut(String s) {
        int n = s.length();

        // isPalin[i][j] = true if s[i..j] is palindrome
        boolean[][] isPalin = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                if (s.charAt(i) == s.charAt(j) &&
                    (j - i <= 2 || isPalin[i + 1][j - 1])) {
                    isPalin[i][j] = true;
                }
            }
        }

        // dp[i] = min cuts needed for s[0..i-1]
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = -1;  // Empty string needs -1 cuts (so first palindrome has 0 cuts)

        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (isPalin[j][i - 1]) {
                    dp[i] = Math.min(dp[i], dp[j] + 1);
                }
            }
        }

        return dp[n];
    }

    // Get all palindrome partitions
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path,
                           List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.add(sub);
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l++) != s.charAt(r--)) return false;
        }
        return true;
    }
}
```

## Problem 5: Best Time to Buy and Sell Stock (All Variants)

```java
public class StockProblems {

    // I: One transaction
    public int maxProfit1(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;

        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            maxProfit = Math.max(maxProfit, price - minPrice);
        }

        return maxProfit;
    }

    // II: Unlimited transactions
    public int maxProfit2(int[] prices) {
        int profit = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                profit += prices[i] - prices[i - 1];
            }
        }
        return profit;
    }

    // III: At most 2 transactions
    public int maxProfit3(int[] prices) {
        int buy1 = Integer.MIN_VALUE, sell1 = 0;
        int buy2 = Integer.MIN_VALUE, sell2 = 0;

        for (int price : prices) {
            buy1 = Math.max(buy1, -price);
            sell1 = Math.max(sell1, buy1 + price);
            buy2 = Math.max(buy2, sell1 - price);
            sell2 = Math.max(sell2, buy2 + price);
        }

        return sell2;
    }

    // IV: At most k transactions
    public int maxProfit4(int k, int[] prices) {
        int n = prices.length;
        if (n == 0) return 0;

        if (k >= n / 2) return maxProfit2(prices);

        // dp[t][d] = max profit using at most t transactions up to day d
        int[][] dp = new int[k + 1][n];

        for (int t = 1; t <= k; t++) {
            int maxDiff = -prices[0];
            for (int d = 1; d < n; d++) {
                dp[t][d] = Math.max(dp[t][d - 1], prices[d] + maxDiff);
                maxDiff = Math.max(maxDiff, dp[t - 1][d] - prices[d]);
            }
        }

        return dp[k][n - 1];
    }

    // With cooldown (must wait 1 day after selling)
    public int maxProfitCooldown(int[] prices) {
        int sold = 0, held = Integer.MIN_VALUE, rest = 0;

        for (int price : prices) {
            int prevSold = sold;
            sold = held + price;
            held = Math.max(held, rest - price);
            rest = Math.max(rest, prevSold);
        }

        return Math.max(sold, rest);
    }

    // With transaction fee
    public int maxProfitWithFee(int[] prices, int fee) {
        int cash = 0, hold = -prices[0];

        for (int i = 1; i < prices.length; i++) {
            cash = Math.max(cash, hold + prices[i] - fee);
            hold = Math.max(hold, cash - prices[i]);
        }

        return cash;
    }
}
```

---

# PART 13: DP State Design Principles

## How to Identify DP State

```
STEP 1: What are the "decisions" at each step?
        - Include/exclude an item
        - Move right/down in grid
        - Match/skip a character

STEP 2: What information do I need to make the decision?
        - Current position (index)
        - Remaining capacity (knapsack)
        - Previous state (house robber)
        - Constraints (transactions left)

STEP 3: What do I want to compute?
        - Maximum/minimum value
        - Count of ways
        - Existence (boolean)

COMBINE INTO STATE:
dp[i][remaining_capacity] = max value considering items 0..i
dp[i][j] = ways to reach cell (i,j)
dp[i][k] = max profit with at most k transactions up to day i
```

## State Reduction Techniques

```java
// TECHNIQUE 1: Remove redundant dimensions
// Bad: dp[i][j][sum] where sum = prefix sum
// Good: dp[i][j], compute sum from i and j

// TECHNIQUE 2: Rolling array (space optimization)
// If dp[i] only depends on dp[i-1], use 2 arrays
// If dp[i][j] only depends on dp[i-1][...], use 2 rows

// TECHNIQUE 3: State compression
// Instead of visited[n] array, use bitmask integer
// int mask represents which elements are used

// Example: Subset sum with bitmask
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int n : nums) sum += n;
    if (sum % 2 != 0) return false;

    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;

    for (int num : nums) {
        // Iterate backwards to avoid using same element twice
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }

    return dp[target];
}
```

---

# PART 14: Common DP Mistakes and How to Avoid Them

```
MISTAKE 1: Wrong base case
- Always think: what's the answer for the smallest input?
- Empty string? 0 elements? 0 capacity?

MISTAKE 2: Wrong transition direction
- For tabulation, process in order so subproblems are solved first
- For 0/1 knapsack: iterate backwards when using 1D array

MISTAKE 3: Integer overflow
- Use long when values can exceed Integer.MAX_VALUE
- Especially in counting problems with modulo

MISTAKE 4: Off-by-one errors
- 0-indexed vs 1-indexed
- Length vs index
- Inclusive vs exclusive ranges

MISTAKE 5: Not considering all cases
- What if no solution exists? Return -1 or MAX_VALUE?
- What if multiple solutions? Need all or just one?

MISTAKE 6: Redundant states
- Check if a dimension in your state is truly necessary
- Can it be computed from other dimensions?
```

---

_DP is not about memorizing solutions - it's about SEEING the substructure!_ 🧮
