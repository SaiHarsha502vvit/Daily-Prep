# 💎 10. Dynamic Programming

> **Navigation**: [← 9. Recursion & Backtracking](07_recursion_backtracking.md) | [Chapter overview](../02_Code_Templates.md)
> Page 8 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

```
                  DYNAMIC PROGRAMMING
──────────────────────────────────────────────────

STEP 1: Identify if DP applies
─────────────────────────────────
✓ Optimal substructure (optimal solution uses optimal sub-solutions)
✓ Overlapping subproblems (same subproblems solved multiple times)

STEP 2: Define state
────────────────────────
dp[i] = "answer for first i elements" or
dp[i][j] = "answer for range [i, j]" or
dp[i][w] = "answer considering i items with capacity w"

STEP 3: Find recurrence (transition)
────────────────────────────────────
dp[i] = f(dp[i-1], dp[i-2], ...)  "How to build from smaller problems"

STEP 4: Identify base cases
───────────────────────────
dp[0] = ?, dp[1] = ?  "Smallest problems with known answers"

STEP 5: Determine order of computation
─────────────────────────────────────
Usually: smaller subproblems first (bottom-up)

════════════════════════════════════════════════════════════════════

Example: Climbing Stairs (n steps, can take 1 or 2 at a time)

State:    dp[i] = number of ways to reach step i
Recurrence: dp[i] = dp[i-1] + dp[i-2]
            (ways from step i-1 + ways from step i-2)
Base:    dp[0] = 1, dp[1] = 1

┌───┬───┬───┬───┬───┬───┐
│ 1 │ 1 │ 2 │ 3 │ 5 │ 8 │
└───┴───┴───┴───┴───┴───┘
 0   1   2   3   4   5

Answer: dp[5] = 8 ways to climb 5 stairs
```

## Template: 1D DP (Climbing Stairs)

```java
/**
 * Climbing Stairs - Ways to reach top
 * Time: O(N), Space: O(1)
 */
public int climbStairs(int n) {
    if (n <= 2) return n;

    // Only need last two values
    int prev2 = 1;  // dp[i-2]
    int prev1 = 2;  // dp[i-1]

    for (int i = 3; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}

// Alternative with array (clearer but more space)
public int climbStairsArray(int n) {
    if (n <= 2) return n;

    int[] dp = new int[n + 1];
    dp[1] = 1;
    dp[2] = 2;

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
    }
    return dp[n];
}
```

## Template: 2D DP (Grid Paths)

```java
/**
 * Unique Paths in Grid - Count ways from top-left to bottom-right
 * Can only move right or down
 *
 * Time: O(M*N), Space: O(M*N)
 */
public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];

    // Base case: First row (only one way - keep going right)
    for (int j = 0; j < n; j++) dp[0][j] = 1;

    // Base case: First column (only one way - keep going down)
    for (int i = 0; i < m; i++) dp[i][0] = 1;

    // Fill rest of grid
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i-1][j] + dp[i][j-1];  // From top + from left
        }
    }
    return dp[m-1][n-1];
}

/**
 * VISUAL:
 *   ┌───┬───┬───┬───┐
 *   │ 1 │ 1 │ 1 │ 1 │
 *   ├───┼───┼───┼───┤
 *   │ 1 │ 2 │ 3 │ 4 │
 *   ├───┼───┼───┼───┤
 *   │ 1 │ 3 │ 6 │ 10│  ← Answer = 10
 *   └───┴───┴───┴───┘
 */
```

## Template: House Robber (Cannot Rob Adjacent)

```java
/**
 * House Robber - Max money, can't rob adjacent houses
 *
 * dp[i] = max money robbing houses 0..i
 * dp[i] = max(dp[i-1], dp[i-2] + nums[i])
 *         ↑ skip this house, ↑ rob this house
 */
public int rob(int[] nums) {
    if (nums.length == 0) return 0;
    if (nums.length == 1) return nums[0];

    int prev2 = 0;          // dp[i-2]
    int prev1 = nums[0];    // dp[i-1]

    for (int i = 1; i < nums.length; i++) {
        int current = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}

/**
 * VISUAL: nums = [2, 7, 9, 3, 1]
 *
 * i=0: prev2=0, prev1=2
 * i=1: current = max(2, 0+7) = 7, prev2=2, prev1=7
 * i=2: current = max(7, 2+9) = 11, prev2=7, prev1=11
 * i=3: current = max(11, 7+3) = 11, prev2=11, prev1=11
 * i=4: current = max(11, 11+1) = 12, prev2=11, prev1=12
 *
 * Answer: 12 (rob houses 0, 2, 4 = 2+9+1=12)
 */
```

---

🔬 **Section Challenge — 💎 10. Dynamic Programming**

**Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?

<details><summary>Answer</summary>

Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.

</details>

**Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.

<details><summary>Answer</summary>

State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.

</details>

## 📝 MASTER CHECKLIST

Before writing code for any problem:

1. **Identify the pattern** from the problem description
2. **Write the base template** (don't reinvent from scratch)
3. **Customize for specific problem** requirements
4. **Test with examples** before submitting
5. **Handle edge cases** (empty, single element, all same)

---

[← 9. Recursion & Backtracking](07_recursion_backtracking.md) | [Chapter overview](../02_Code_Templates.md)
