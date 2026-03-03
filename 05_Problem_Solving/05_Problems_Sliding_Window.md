> **Problems 05/14** | [Prev](04_Problems_Arrays.md) | [Index](../00_MASTER_INDEX.md) | [Next](06_Problems_Two_Pointers.md)

---

# SECTION 4: SLIDING WINDOW PATTERN VARIANTS

---

## 4.1 FIXED SIZE WINDOW

### Problem: Maximum Sum Subarray of Size K

**Difficulty:** Easy | **Category:** Sliding Window

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAXIMUM SUM SUBARRAY OF SIZE K                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array and integer k, find maximum sum of any contiguous subarray  ║
║  of size k.                                                              ║
║                                                                           ║
║  Input: arr = [2, 1, 5, 1, 3, 2], k = 3                                  ║
║  Output: 9                                                                ║
║  Explanation: Subarray [5, 1, 3] has maximum sum = 9                     ║
║                                                                           ║
║  Visual:                                                                  ║
║  [2, 1, 5, 1, 3, 2]                                                      ║
║   └──┘  sum=8                                                            ║
║      └──┘  sum=7                                                         ║
║         └──┘  sum=9 ← MAX                                                ║
║            └──┘  sum=6                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem: Maximum Average Subarray I

**LeetCode 643** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/maximum-average-subarray-i/](https://leetcode.com/problems/maximum-average-subarray-i/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAXIMUM AVERAGE SUBARRAY I                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find contiguous subarray of length k with maximum average value.        ║
║                                                                           ║
║  Input: nums = [1,12,-5,-6,50,3], k = 4                                  ║
║  Output: 12.75                                                            ║
║  Explanation: Max avg is (12-5-6+50)/4 = 51/4 = 12.75                    ║
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

### Problem: Number of Sub-arrays of Size K with Average >= Threshold

**LeetCode 1343** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/](https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUBARRAYS WITH AVG >= THRESHOLD                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count subarrays of size k where average >= threshold.                   ║
║                                                                           ║
║  Input: arr = [2,2,2,2,5,5,5,8], k = 3, threshold = 4                    ║
║  Output: 3                                                                ║
║  Explanation: [2,5,5], [5,5,5], [5,5,8] have avg >= 4                    ║
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

### 🔒 PREMIUM: Maximum Sum of Distinct Subarrays With Length K

**LeetCode 2461** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAX SUM OF DISTINCT SUBARRAYS WITH LENGTH K                              ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find maximum sum among all subarrays of length k where ALL elements     ║
║  are DISTINCT (no duplicates in window).                                 ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1,5,4,2,9,9,9], k = 3                                    ║
║  Output: 15                                                               ║
║  Explanation:                                                             ║
║  [1,5,4] sum=10, all distinct ✓                                          ║
║  [5,4,2] sum=11, all distinct ✓                                          ║
║  [4,2,9] sum=15, all distinct ✓ ← MAX                                    ║
║  [2,9,9] has duplicate 9, skip                                           ║
║  [9,9,9] has duplicates, skip                                            ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [4,4,4], k = 3                                            ║
║  Output: 0                                                                ║
║  Explanation: No subarray of length 3 has all distinct elements          ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= k <= nums.length <= 10^5                                         ║
║  - 1 <= nums[i] <= 10^5                                                  ║
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

## 4.2 VARIABLE SIZE WINDOW

### Problem: Minimum Size Subarray Sum

**LeetCode 209** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/minimum-size-subarray-sum/](https://leetcode.com/problems/minimum-size-subarray-sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MINIMUM SIZE SUBARRAY SUM                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimal length of contiguous subarray with sum >= target.          ║
║                                                                           ║
║  Input: target = 7, nums = [2,3,1,2,4,3]                                 ║
║  Output: 2                                                                ║
║  Explanation: [4,3] has sum=7 with length 2                              ║
║                                                                           ║
║  Visual:                                                                  ║
║  [2,3,1,2,4,3]                                                           ║
║   └────────┘ sum=12, len=5                                               ║
║     └──────┘ sum=10, len=4                                               ║
║       └────┘ sum=7, len=3                                                ║
║           └─┘ sum=7, len=2 ← MIN                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int minSubArrayLen(int target, int[] nums) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;

    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];

        while (sum >= target) {
            minLen = Math.min(minLen, right - left + 1);
            sum -= nums[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
```

---

### Problem: Longest Substring with At Most K Distinct Characters

**LeetCode 340** | **Difficulty:** Medium | 🔒 Premium
🔗 Premium Problem

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST SUBSTRING WITH AT MOST K DISTINCT CHARS                          ║
║  (LeetCode 340 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find length of longest substring with at most k distinct characters.    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "eceba", k = 2                                               ║
║  Output: 3                                                                ║
║  Explanation: "ece" has 2 distinct chars (e, c)                          ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "aa", k = 1                                                  ║
║  Output: 2                                                                ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: s = "aabacbebebe", k = 3                                         ║
║  Output: 7                                                                ║
║  Explanation: "cbebebe" has 3 distinct (c, b, e)                         ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 5 * 10^4                                             ║
║  - 0 <= k <= 50                                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int lengthOfLongestSubstringKDistinct(String s, int k) {
    if (k == 0) return 0;

    Map<Character, Integer> map = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        map.put(c, map.getOrDefault(c, 0) + 1);

        while (map.size() > k) {
            char leftChar = s.charAt(left);
            map.put(leftChar, map.get(leftChar) - 1);
            if (map.get(leftChar) == 0) map.remove(leftChar);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

### Problem: Fruit Into Baskets (Longest with 2 Distinct)

**LeetCode 904** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/fruit-into-baskets/](https://leetcode.com/problems/fruit-into-baskets/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FRUIT INTO BASKETS                                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You have 2 baskets. Each basket can hold only ONE type of fruit.        ║
║  Find maximum fruits you can collect (longest subarray with 2 types).    ║
║                                                                           ║
║  Input: fruits = [1,2,1]                                                 ║
║  Output: 3 (collect all)                                                 ║
║                                                                           ║
║  Input: fruits = [0,1,2,2]                                               ║
║  Output: 3 ([1,2,2])                                                     ║
║                                                                           ║
║  Input: fruits = [1,2,3,2,2]                                             ║
║  Output: 4 ([2,3,2,2])                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int totalFruit(int[] fruits) {
    Map<Integer, Integer> basket = new HashMap<>();
    int left = 0, maxFruits = 0;

    for (int right = 0; right < fruits.length; right++) {
        basket.merge(fruits[right], 1, Integer::sum);

        while (basket.size() > 2) {
            int leftFruit = fruits[left];
            basket.merge(leftFruit, -1, Integer::sum);
            if (basket.get(leftFruit) == 0) basket.remove(leftFruit);
            left++;
        }

        maxFruits = Math.max(maxFruits, right - left + 1);
    }
    return maxFruits;
}
```

---

### Problem: Longest Repeating Character Replacement

**LeetCode 424** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/longest-repeating-character-replacement/](https://leetcode.com/problems/longest-repeating-character-replacement/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST REPEATING CHARACTER REPLACEMENT                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You can replace at most k characters. Find longest substring with all   ║
║  same characters after at most k replacements.                           ║
║                                                                           ║
║  Input: s = "ABAB", k = 2                                                ║
║  Output: 4                                                                ║
║  Explanation: Replace 2 A's with B's → "BBBB" (or vice versa)            ║
║                                                                           ║
║  Input: s = "AABABBA", k = 1                                             ║
║  Output: 4                                                                ║
║  Explanation: Replace middle B → "AAAAABA" gives "AAAA"                  ║
║                                                                           ║
║  KEY INSIGHT:                                                             ║
║  Window is valid if: (windowLength - maxFreq) <= k                       ║
║  We need to replace (windowLength - maxFreq) characters                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int left = 0, maxFreq = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        count[s.charAt(right) - 'A']++;
        maxFreq = Math.max(maxFreq, count[s.charAt(right) - 'A']);

        // If replacements needed > k, shrink window
        while ((right - left + 1) - maxFreq > k) {
            count[s.charAt(left) - 'A']--;
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

### Problem: Max Consecutive Ones III

**LeetCode 1004** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/max-consecutive-ones-iii/](https://leetcode.com/problems/max-consecutive-ones-iii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAX CONSECUTIVE ONES III                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Binary array. Flip at most k 0's. Return max consecutive 1's.           ║
║                                                                           ║
║  Input: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2                            ║
║  Output: 6                                                                ║
║  Explanation: [1,1,1,0,0,1,1,1,1,1,1]                                    ║
║                        ↑ ↑ flipped                                       ║
║                                                                           ║
║  Visual:                                                                  ║
║  [1,1,1,0,0,0,1,1,1,1,0]                                                 ║
║           └─────────────┘ window with 2 zeros                            ║
║           flip 2 zeros = 6 ones                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int longestOnes(int[] nums, int k) {
    int left = 0, zeros = 0, maxLen = 0;

    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;

        while (zeros > k) {
            if (nums[left] == 0) zeros--;
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

## 4.3 SLIDING WINDOW - STRING MATCHING

### Problem: Permutation in String

**LeetCode 567** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/permutation-in-string/](https://leetcode.com/problems/permutation-in-string/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PERMUTATION IN STRING                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if s2 contains any permutation of s1.                             ║
║                                                                           ║
║  Input: s1 = "ab", s2 = "eidbaooo"                                       ║
║  Output: true                                                             ║
║  Explanation: s2 contains "ba" which is permutation of "ab"              ║
║                                                                           ║
║  Input: s1 = "ab", s2 = "eidboaoo"                                       ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean checkInclusion(String s1, String s2) {
    if (s1.length() > s2.length()) return false;

    int[] s1Count = new int[26];
    int[] s2Count = new int[26];

    for (int i = 0; i < s1.length(); i++) {
        s1Count[s1.charAt(i) - 'a']++;
        s2Count[s2.charAt(i) - 'a']++;
    }

    if (Arrays.equals(s1Count, s2Count)) return true;

    for (int i = s1.length(); i < s2.length(); i++) {
        s2Count[s2.charAt(i) - 'a']++;
        s2Count[s2.charAt(i - s1.length()) - 'a']--;

        if (Arrays.equals(s1Count, s2Count)) return true;
    }
    return false;
}
```

---

### Problem: Minimum Window Substring

**LeetCode 76** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MINIMUM WINDOW SUBSTRING                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum window in s that contains all characters of t.             ║
║                                                                           ║
║  Input: s = "ADOBECODEBANC", t = "ABC"                                   ║
║  Output: "BANC"                                                           ║
║                                                                           ║
║  Visual:                                                                  ║
║  ADOBECODEBANC                                                           ║
║  A   ─┘    (has A, need B,C)                                             ║
║  ADOBEC    (has A,B,C - valid, len=6)                                    ║
║   DOBEC    (no A - invalid)                                              ║
║  ...                                                                     ║
║         BANC  (has A,B,C - valid, len=4) ← MIN                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public String minWindow(String s, String t) {
    if (s.length() < t.length()) return "";

    Map<Character, Integer> tCount = new HashMap<>();
    for (char c : t.toCharArray()) {
        tCount.merge(c, 1, Integer::sum);
    }

    int required = tCount.size();
    int formed = 0;
    Map<Character, Integer> windowCount = new HashMap<>();

    int left = 0, minLen = Integer.MAX_VALUE, minStart = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        windowCount.merge(c, 1, Integer::sum);

        if (tCount.containsKey(c) &&
            windowCount.get(c).intValue() == tCount.get(c).intValue()) {
            formed++;
        }

        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minStart = left;
            }

            char leftChar = s.charAt(left);
            windowCount.merge(leftChar, -1, Integer::sum);

            if (tCount.containsKey(leftChar) &&
                windowCount.get(leftChar) < tCount.get(leftChar)) {
                formed--;
            }
            left++;
        }
    }

    return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
}
```

---

### 🔒 PREMIUM: Longest Substring with At Most Two Distinct Characters

**LeetCode 159** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST SUBSTRING WITH AT MOST TWO DISTINCT CHARACTERS                   ║
║  (LeetCode 159 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find length of longest substring with at most 2 distinct characters.    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "eceba"                                                       ║
║  Output: 3                                                                ║
║  Explanation: "ece" has 2 distinct characters                            ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "ccaabbb"                                                    ║
║  Output: 5                                                                ║
║  Explanation: "aabbb" has 2 distinct characters                          ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 10^5                                                 ║
║  - s consists of English letters                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int lengthOfLongestSubstringTwoDistinct(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        map.merge(s.charAt(right), 1, Integer::sum);

        while (map.size() > 2) {
            char leftChar = s.charAt(left);
            map.merge(leftChar, -1, Integer::sum);
            if (map.get(leftChar) == 0) map.remove(leftChar);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

