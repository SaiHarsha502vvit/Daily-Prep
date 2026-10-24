# 🧩 Part 4: Classic DP Problems With Traces

> **Navigation**: [← What is Dynamic Programming?](02_what_is_dynamic_programming.md) | [Chapter overview](../04b_DP_Fundamentals.md) | [2d Dynamic Programming →](04_dynamic_programming.md)
> Page 3 of 4 in **DP Fundamentals**


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

[← What is Dynamic Programming?](02_what_is_dynamic_programming.md) | [Chapter overview](../04b_DP_Fundamentals.md) | [2d Dynamic Programming →](04_dynamic_programming.md)
