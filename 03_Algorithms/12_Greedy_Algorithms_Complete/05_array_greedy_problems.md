# Array Greedy Problems <a name="array-greedy"></a>

> **Navigation**: [← Interval Problems](04_interval_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [String Greedy Problems →](06_string_greedy_problems.md)
> Page 5 of 7 in **Greedy Algorithms Complete Guide**


## Jump Game (LeetCode 55)

```java
/*
Can reach last index? nums[i] = max jump from i.
Track farthest reachable position.
*/

public boolean canJump(int[] nums) {
    int farthest = 0;

    for (int i = 0; i < nums.length; i++) {
        // Can't reach position i
        if (i > farthest) return false;
        // Update farthest
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
```

## Jump Game II (LeetCode 45)

```java
/*
Minimum jumps to reach end. Always can reach.
*/

public int jump(int[] nums) {
    int jumps = 0;
    int currentEnd = 0;
    int farthest = 0;

    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);

        // Must jump when reaching current jump's limit
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

## Gas Station (LeetCode 134)

```java
/*
Circular route with gas stations.
gas[i] = gas at station i, cost[i] = cost to next.
Find starting station to complete circuit (or -1).

Key insight: If total gas >= total cost, solution exists.
Start from point where running sum is minimum.
*/

public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalTank = 0;
    int currentTank = 0;
    int startStation = 0;

    for (int i = 0; i < gas.length; i++) {
        int diff = gas[i] - cost[i];
        totalTank += diff;
        currentTank += diff;

        // Can't reach next station from startStation
        if (currentTank < 0) {
            startStation = i + 1;  // Try starting from next
            currentTank = 0;
        }
    }

    return totalTank >= 0 ? startStation : -1;
}
```

## Assign Cookies (LeetCode 455)

```java
/*
Children with greed factors, cookies with sizes.
Each child gets at most 1 cookie.
Maximize content children (cookie size >= greed).
*/

public int findContentChildren(int[] children, int[] cookies) {
    Arrays.sort(children);
    Arrays.sort(cookies);

    int child = 0, cookie = 0;

    while (child < children.length && cookie < cookies.length) {
        if (cookies[cookie] >= children[child]) {
            child++;  // Child satisfied
        }
        cookie++;  // Use or skip cookie
    }
    return child;
}
```

## Container With Most Water (LeetCode 11)

```java
/*
Two pointers: Start from widest, move shorter line inward.
Moving taller line can only decrease area.
*/

public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        int h = Math.min(height[left], height[right]);
        int w = right - left;
        maxWater = Math.max(maxWater, h * w);

        // Move the shorter line
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
```

## Best Time to Buy and Sell Stock II (LeetCode 122)

```java
/*
Multiple transactions allowed.
Greedy: Capture every upward movement.
*/

public int maxProfit(int[] prices) {
    int profit = 0;

    for (int i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }
    return profit;
}
```

## Candy (LeetCode 135) ⭐⭐

```java
/*
Children in line with ratings.
Each gets at least 1 candy.
Higher rating than neighbor → more candy than neighbor.
Minimum total candy?

Two passes: left-to-right, then right-to-left.
*/

public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candies = new int[n];
    Arrays.fill(candies, 1);

    // Left to right: higher than left neighbor?
    for (int i = 1; i < n; i++) {
        if (ratings[i] > ratings[i-1]) {
            candies[i] = candies[i-1] + 1;
        }
    }

    // Right to left: higher than right neighbor?
    for (int i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i+1]) {
            candies[i] = Math.max(candies[i], candies[i+1] + 1);
        }
    }

    int total = 0;
    for (int c : candies) total += c;
    return total;
}
```

---

[← Interval Problems](04_interval_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [String Greedy Problems →](06_string_greedy_problems.md)
