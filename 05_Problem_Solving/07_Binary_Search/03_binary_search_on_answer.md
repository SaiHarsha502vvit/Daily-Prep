# 🔍 6.4 Binary Search on Answer

> **Navigation**: [← 6.3 Rotated Sorted Array](02_rotated_sorted_array.md) | [Chapter overview](../07_Binary_Search.md) | [SECTION 5: Additional Binary Search Problems →](04_section_5_additional_binary_search_problems.md)
> Page 3 of 4 in **Binary Search**


## Problem: Sqrt(x)

**LeetCode 69** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/sqrtx/](https://leetcode.com/problems/sqrtx/)

**SQRT(X) - Binary Search on Answer**

```text
Find integer square root (truncate decimals).

Input: x = 8
Output: 2 (√8 = 2.828..., truncated to 2)

Binary search range: [1, x]
Find largest n where n*n <= x
```

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    long left = 1, right = x / 2;

    while (left <= right) {
        long mid = left + (right - left) / 2;
        long square = mid * mid;

        if (square == x) {
            return (int) mid;
        } else if (square < x) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return (int) right;
}
```

---

## Problem: Koko Eating Bananas

**LeetCode 875** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/koko-eating-bananas/](https://leetcode.com/problems/koko-eating-bananas/)

**KOKO EATING BANANAS**

```text
Koko eats k bananas/hour. Guard returns in h hours.
Find minimum k to eat all bananas before guard returns.

Input: piles = [3, 6, 7, 11], h = 8
Output: 4
Explanation: At k=4, time needed:
pile 3: ceil(3/4) = 1 hour
pile 6: ceil(6/4) = 2 hours
pile 7: ceil(7/4) = 2 hours
pile 11: ceil(11/4) = 3 hours
Total: 8 hours ≤ 8 ✓

Binary search on k: range [1, max(piles)]
```

```java
public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = Arrays.stream(piles).max().getAsInt();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canFinish(piles, h, mid)) {
            right = mid;  // Try slower speed
        } else {
            left = mid + 1;  // Need faster speed
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int h, int k) {
    int hours = 0;
    for (int pile : piles) {
        hours += (pile + k - 1) / k;  // Ceiling division
    }
    return hours <= h;
}
```

---

## Problem: Capacity To Ship Packages Within D Days

**LeetCode 1011** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

**CAPACITY TO SHIP PACKAGES**

```text
Find minimum ship capacity to ship all packages in days days.
Packages must be shipped IN ORDER.

Input: weights = [1,2,3,4,5,6,7,8,9,10], days = 5
Output: 15
Explanation:
Day 1: 1,2,3,4,5 (sum=15)
Day 2: 6,7 (sum=13)
Day 3: 8 (sum=8)
Day 4: 9 (sum=9)
Day 5: 10 (sum=10)

Binary search on capacity: [max(weights), sum(weights)]
```

```java
public int shipWithinDays(int[] weights, int days) {
    int left = Arrays.stream(weights).max().getAsInt();
    int right = Arrays.stream(weights).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canShip(weights, days, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1;
    int currentLoad = 0;

    for (int weight : weights) {
        if (currentLoad + weight > capacity) {
            daysNeeded++;
            currentLoad = weight;
        } else {
            currentLoad += weight;
        }
    }
    return daysNeeded <= days;
}
```

---

## Problem: Split Array Largest Sum

**LeetCode 410** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/split-array-largest-sum/](https://leetcode.com/problems/split-array-largest-sum/)

**SPLIT ARRAY LARGEST SUM**

```text
Split array into k subarrays. Minimize the largest subarray sum.

Input: nums = [7,2,5,10,8], k = 2
Output: 18
Explanation:
Split: [7,2,5] and [10,8]
Sums: 14 and 18
Largest sum = 18 (minimized)

Binary search on max sum allowed
```

```java
public int splitArray(int[] nums, int k) {
    int left = Arrays.stream(nums).max().getAsInt();
    int right = Arrays.stream(nums).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canSplit(nums, k, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canSplit(int[] nums, int k, int maxSum) {
    int splits = 1;
    int currentSum = 0;

    for (int num : nums) {
        if (currentSum + num > maxSum) {
            splits++;
            currentSum = num;
        } else {
            currentSum += num;
        }
    }
    return splits <= k;
}
```

---

## 🔒 PREMIUM: Find K-th Smallest Pair Distance

**LeetCode 719** | **Difficulty:** Hard | **Premium-Level**

**FIND K-TH SMALLEST PAIR DISTANCE — (LeetCode 719 - Hard)**

```text
Given array nums, define distance between pair (i,j) as |nums[i]-nums[j]
Find the k-th smallest distance among all pairs.

─────────────────────────────────────────────────────────────────────

Example 1:
Input: nums = [1, 3, 1], k = 1
Output: 0
Explanation:
All distances: (1,3)=2, (1,1)=0, (3,1)=2
Sorted: [0, 2, 2]
1st smallest = 0

Example 2:
Input: nums = [1, 1, 1], k = 2
Output: 0

Example 3:
Input: nums = [1, 6, 1], k = 3
Output: 5

─────────────────────────────────────────────────────────────────────

APPROACH: Binary search on distance + count pairs with dist <= mid

─────────────────────────────────────────────────────────────────────

Constraints:
- n == nums.length
- 2 <= n <= 10^4
- 0 <= nums[i] <= 10^6
- 1 <= k <= n * (n - 1) / 2
```

```java
public int smallestDistancePair(int[] nums, int k) {
    Arrays.sort(nums);
    int n = nums.length;

    int left = 0;
    int right = nums[n - 1] - nums[0];

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (countPairs(nums, mid) >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

// Count pairs with distance <= maxDist
private int countPairs(int[] nums, int maxDist) {
    int count = 0;
    int left = 0;

    for (int right = 0; right < nums.length; right++) {
        while (nums[right] - nums[left] > maxDist) {
            left++;
        }
        count += right - left;
    }
    return count;
}
```

---

---

[← 6.3 Rotated Sorted Array](02_rotated_sorted_array.md) | [Chapter overview](../07_Binary_Search.md) | [SECTION 5: Additional Binary Search Problems →](04_section_5_additional_binary_search_problems.md)
