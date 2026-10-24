# 10.3 Knapsack Problems

> **Navigation**: [← 10.2 2D Dynamic Programming](03_dynamic_programming.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.4 Subsequence Problems →](05_subsequence_problems.md)
> Page 4 of 5 in **Dynamic Programming**


**Pattern:** Given items with values/weights + a capacity, maximize value or check feasibility.
**0/1 Knapsack template:** `dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])`
**Space optimization:** Since each row only depends on previous row, use 1D array (iterate capacity BACKWARDS to avoid using updated values).
**Key insight:** "Partition into equal subsets" = "Is there a subset summing to total/2?" = Knapsack!

## Problem 169: 0/1 Knapsack

**Classic Problem**

**0/1 KNAPSACK - Max value with weight limit**

```text
weights = [1, 2, 3], values = [6, 10, 12], capacity = 5

Item 0: weight=1, value=6
Item 1: weight=2, value=10
Item 2: weight=3, value=12

Take items 1 and 2: weight=5, value=22 ✓

    Cap:  0  1  2  3  4  5
Item 0:   0  6  6  6  6  6
Item 1:   0  6 10 16 16 16
Item 2:   0  6 10 16 18 22
```

**Solution:**

```java
public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[] dp = new int[capacity + 1];

    for (int i = 0; i < n; i++) {
        // Traverse backwards to avoid using same item twice
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }

    return dp[capacity];
}
```

---

## Problem 170: Partition Equal Subset Sum

**LeetCode 416** 🔗 https://leetcode.com/problems/partition-equal-subset-sum/

**PARTITION EQUAL SUBSET SUM**

```text
nums = [1, 5, 11, 5]
Total = 22, Target = 11

Can we find subset with sum = 11?
Yes! [1, 5, 5] and [11]

This is 0/1 Knapsack with target = sum/2

dp[i] = true if sum i is achievable
```

**Solution:**

```java
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int num : nums) sum += num;

    if (sum % 2 != 0) return false;

    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;

    for (int num : nums) {
        for (int i = target; i >= num; i--) {
            dp[i] = dp[i] || dp[i - num];
        }
    }

    return dp[target];
}
```

---

## Problem 171: Target Sum

**LeetCode 494** 🔗 https://leetcode.com/problems/target-sum/

**TARGET SUM - Assign + or - to reach target**

```text
nums = [1, 1, 1, 1, 1], target = 3

Ways to get 3:
-1 +1 +1 +1 +1 = 3
+1 -1 +1 +1 +1 = 3
+1 +1 -1 +1 +1 = 3
+1 +1 +1 -1 +1 = 3
+1 +1 +1 +1 -1 = 3

Output: 5 ways

Let P = sum of positives, N = sum of negatives
P - N = target, P + N = sum
P = (target + sum) / 2
→ Find subsets with sum P
```

**Solution:**

```java
public int findTargetSumWays(int[] nums, int target) {
    int sum = 0;
    for (int num : nums) sum += num;

    if ((sum + target) % 2 != 0 || Math.abs(target) > sum) return 0;

    int subsetSum = (sum + target) / 2;
    int[] dp = new int[subsetSum + 1];
    dp[0] = 1;

    for (int num : nums) {
        for (int i = subsetSum; i >= num; i--) {
            dp[i] += dp[i - num];
        }
    }

    return dp[subsetSum];
}
```

---

[← 10.2 2D Dynamic Programming](03_dynamic_programming.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.4 Subsequence Problems →](05_subsequence_problems.md)
