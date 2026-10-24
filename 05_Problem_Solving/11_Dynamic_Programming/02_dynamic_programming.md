# 10.1 1D Dynamic Programming

> **Navigation**: [← Why Is Dp The Most Feared Interview Topic](01_why_is_dp_the_most_feared.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.2 2D Dynamic Programming →](03_dynamic_programming.md)
> Page 2 of 5 in **Dynamic Programming**


**Pattern:** `dp[i]` depends on previous 1-2 values. Often optimizable to O(1) space.
**Key insight:** Most 1D DP is a disguised Fibonacci or decision problem.

## Problem 159: Climbing Stairs

**LeetCode 70** 🔗 https://leetcode.com/problems/climbing-stairs/

```
┌────────────────────────────────────────────────────────────────┐
│  CLIMBING STAIRS - Ways to reach top (1 or 2 steps)            │
├────────────────────────────────────────────────────────────────┤
│  n = 4 stairs                                                  │
│                                                                │
│  Ways:     ┌───┐                                               │
│  1+1+1+1   │ 4 │ ← Goal                                        │
│  1+1+2     ├───┤                                               │
│  1+2+1     │ 3 │                                               │
│  2+1+1     ├───┤                                               │
│  2+2       │ 2 │                                               │
│            ├───┤                                               │
│            │ 1 │                                               │
│            ├───┤                                               │
│            │ 0 │ ← Start                                       │
│            └───┘                                               │
│                                                                │
│  dp[i] = dp[i-1] + dp[i-2] (Fibonacci!)                        │
│  Output: 5 ways                                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int climbStairs(int n) {
    if (n <= 2) return n;

    int prev2 = 1, prev1 = 2;

    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

## Problem 160: House Robber

**LeetCode 198** 🔗 https://leetcode.com/problems/house-robber/

**HOUSE ROBBER - Max money without robbing adjacent houses**

```text
nums = [2, 7, 9, 3, 1]

Houses:  [2]  [7]  [9]  [3]  [1]
          │    │    │    │    │
          0    1    2    3    4

Rob house 0, 2, 4: 2 + 9 + 1 = 12 ✓
Rob house 1, 3: 7 + 3 = 10

dp[i] = max(dp[i-1], dp[i-2] + nums[i])
"Skip current" or "Rob current + skip previous"
```

**Solution:**

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];

    int prev2 = 0, prev1 = nums[0];

    for (int i = 1; i < nums.length; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

## Problem 161: House Robber II (Circular)

**LeetCode 213** 🔗 https://leetcode.com/problems/house-robber-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  HOUSE ROBBER II - Houses in circle                            │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 2]                                              │
│                                                                │
│      ┌─── 2 ───┐                                               │
│      │         │                                               │
│      2    ○    3     First and last are adjacent!              │
│      │         │                                               │
│      └─────────┘                                               │
│                                                                │
│  Can't rob both first and last house.                          │
│  Solution: max(rob[0..n-2], rob[1..n-1])                       │
│                                                                │
│  Output: 3 (rob house 1 only)                                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];

    return Math.max(
        robRange(nums, 0, nums.length - 2),
        robRange(nums, 1, nums.length - 1)
    );
}

private int robRange(int[] nums, int start, int end) {
    int prev2 = 0, prev1 = 0;

    for (int i = start; i <= end; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

## Problem 162: Maximum Subarray (Kadane's)

**LeetCode 53** 🔗 https://leetcode.com/problems/maximum-subarray/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM SUBARRAY - Kadane's Algorithm                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]                        │
│                                                                │
│  At each position, decide:                                     │
│  - Start new subarray here?                                    │
│  - Or extend previous subarray?                                │
│                                                                │
│  dp[i] = max(nums[i], dp[i-1] + nums[i])                       │
│                                                                │
│  Index:  0   1   2   3   4   5   6   7   8                     │
│  nums:  -2   1  -3   4  -1   2   1  -5   4                     │
│  dp:    -2   1  -2   4   3   5   6   1   5                     │
│                      └───────────┘                             │
│                      Max subarray: [4,-1,2,1] = 6              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}
```

---

## Problem 163: Coin Change

💡 **Approach:** Unbounded knapsack variant. `dp[amount]` = min coins to make that amount.
For each coin, check: `dp[i] = min(dp[i], dp[i - coin] + 1)`.
**Why BFS also works:** Think of it as shortest path where each coin is an edge.
**Greedy FAILS here:** Coins [1, 3, 4], amount 6 → Greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins.
**Time:** O(amount × coins) | **Space:** O(amount)

**LeetCode 322** 🔗 https://leetcode.com/problems/coin-change/

**COIN CHANGE - Minimum coins to make amount**

```text
coins = [1, 2, 5], amount = 11

dp[i] = min coins to make amount i

Amount:  0  1  2  3  4  5  6  7  8  9  10  11
dp:      0  1  1  2  2  1  2  2  3  3   2   3

For amount 11:
- Use coin 5: dp[11-5] + 1 = dp[6] + 1 = 3
- Use coin 2: dp[11-2] + 1 = dp[9] + 1 = 4
- Use coin 1: dp[11-1] + 1 = dp[10] + 1 = 3
Min = 3 (5 + 5 + 1)
```

**Solution:**

```java
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
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
```

---

🔬 **Section Challenge — 10.1 1D Dynamic Programming**

**Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?

<details><summary>Answer</summary>

Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.

</details>

---

[← Why Is Dp The Most Feared Interview Topic](01_why_is_dp_the_most_feared.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.2 2D Dynamic Programming →](03_dynamic_programming.md)
