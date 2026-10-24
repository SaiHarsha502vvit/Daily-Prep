# 📌 4.1 Fixed Size Window

> **Navigation**: [Chapter overview](../05_Sliding_Window.md) | [4.2 Variable Size Window →](02_variable_size_window.md)
> Page 1 of 3 in **Sliding Window**


## Problem: Maximum Sum Subarray of Size K

**Difficulty:** Easy | **Category:** Sliding Window

```
MAXIMUM SUM SUBARRAY OF SIZE K
──────────────────────────────────────────────────

Given array and integer k, find maximum sum of any contiguous subarray
of size k.

Input: arr = [2, 1, 5, 1, 3, 2], k = 3
Output: 9
Explanation: Subarray [5, 1, 3] has maximum sum = 9

Visual:
[2, 1, 5, 1, 3, 2]
 └──┘  sum=8
    └──┘  sum=7
       └──┘  sum=9 ← MAX
          └──┘  sum=6

```

```java
public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0, maxSum = 0;

    for (int i = 0; i < arr.length; i++) {
        windowSum += arr[i];

        if (i >= k - 1) {
            maxSum = Math.max(maxSum, windowSum);
            windowSum -= arr[i - k + 1];
        }
    }
    return maxSum;
}
```

---

## Problem: Maximum Average Subarray I

**LeetCode 643** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/maximum-average-subarray-i/](https://leetcode.com/problems/maximum-average-subarray-i/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAXIMUM AVERAGE SUBARRAY I                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find contiguous subarray of length k with maximum average value.         ║
║                                                                           ║
║  Input: nums = [1,12,-5,-6,50,3], k = 4                                   ║
║  Output: 12.75                                                            ║
║  Explanation: Max avg is (12-5-6+50)/4 = 51/4 = 12.75                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public double findMaxAverage(int[] nums, int k) {
    double sum = 0;
    for (int i = 0; i < k; i++) sum += nums[i];

    double maxSum = sum;
    for (int i = k; i < nums.length; i++) {
        sum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, sum);
    }
    return maxSum / k;
}
```

---

## Problem: Number of Sub-arrays of Size K with Average >= Threshold

**LeetCode 1343** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/](https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUBARRAYS WITH AVG >= THRESHOLD                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count subarrays of size k where average >= threshold.                    ║
║                                                                           ║
║  Input: arr = [2,2,2,2,5,5,5,8], k = 3, threshold = 4                     ║
║  Output: 3                                                                ║
║  Explanation: [2,5,5], [5,5,5], [5,5,8] have avg >= 4                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int numOfSubarrays(int[] arr, int k, int threshold) {
    int sum = 0, count = 0;
    int target = k * threshold;  // Avoid division

    for (int i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (i >= k - 1) {
            if (sum >= target) count++;
            sum -= arr[i - k + 1];
        }
    }
    return count;
}
```

---

## 🔒 PREMIUM: Maximum Sum of Distinct Subarrays With Length K

**LeetCode 2461** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAX SUM OF DISTINCT SUBARRAYS WITH LENGTH K                              ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find maximum sum among all subarrays of length k where ALL elements      ║
║  are DISTINCT (no duplicates in window).                                  ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1,5,4,2,9,9,9], k = 3                                     ║
║  Output: 15                                                               ║
║  Explanation:                                                             ║
║  [1,5,4] sum=10, all distinct ✓                                           ║
║  [5,4,2] sum=11, all distinct ✓                                           ║
║  [4,2,9] sum=15, all distinct ✓ ← MAX                                     ║
║  [2,9,9] has duplicate 9, skip                                            ║
║  [9,9,9] has duplicates, skip                                             ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [4,4,4], k = 3                                             ║
║  Output: 0                                                                ║
║  Explanation: No subarray of length 3 has all distinct elements           ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= k <= nums.length <= 10^5                                          ║
║  - 1 <= nums[i] <= 10^5                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public long maximumSubarraySum(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    long sum = 0, maxSum = 0;
    int duplicates = 0;

    for (int i = 0; i < nums.length; i++) {
        // Add new element
        sum += nums[i];
        int freq = count.getOrDefault(nums[i], 0);
        if (freq == 1) duplicates++;
        count.put(nums[i], freq + 1);

        // Remove old element when window exceeds k
        if (i >= k) {
            int old = nums[i - k];
            sum -= old;
            int oldFreq = count.get(old);
            if (oldFreq == 2) duplicates--;
            count.put(old, oldFreq - 1);
        }

        // Check if valid window
        if (i >= k - 1 && duplicates == 0) {
            maxSum = Math.max(maxSum, sum);
        }
    }
    return maxSum;
}
```

---

[Chapter overview](../05_Sliding_Window.md) | [4.2 Variable Size Window →](02_variable_size_window.md)
