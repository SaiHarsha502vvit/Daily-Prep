# 📌 4.2 Variable Size Window

> **Navigation**: [← 4.1 Fixed Size Window](01_fixed_size_window.md) | [Chapter overview](../05_Sliding_Window.md) | [4.3 Sliding Window — String Matching →](03_sliding_window_string_matching.md)
> Page 2 of 3 in **Sliding Window**


## Problem: Minimum Size Subarray Sum

**LeetCode 209** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/minimum-size-subarray-sum/](https://leetcode.com/problems/minimum-size-subarray-sum/)

**Minimum size subarray sum**

Find the minimal length of a contiguous subarray with sum >= target.

- **Input:** `target = 7`, `nums = [2,3,1,2,4,3]`
- **Output:** `2`
- **Explanation:** `[4,3]` has sum 7 with length 2.

The window grows on the right and shrinks from the left while its sum stays >= 7:

| Step | Window | Sum | Length | Note |
| --- | --- | --- | --- | --- |
| `right = 3` | `[2,3,1,2]` | 8 | 4 | First valid window; shrink |
| `right = 4` | `[3,1,2,4]` | 10 | 4 | Valid; shrink |
| after shrinking | `[1,2,4]` | 7 | 3 | Still valid; shrink more |
| `right = 5` | `[2,4,3]` | 9 | 3 | Valid; shrink |
| after shrinking | `[4,3]` | 7 | 2 | **Minimum** |

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

## Problem: Longest Substring with At Most K Distinct Characters

**LeetCode 340** | **Difficulty:** Medium | 🔒 Premium
🔗 Premium Problem

**LONGEST SUBSTRING WITH AT MOST K DISTINCT CHARS — (LeetCode 340 - Premium)**

```text
Find length of longest substring with at most k distinct characters.

─────────────────────────────────────────────────────────────────────

Example 1:
Input: s = "eceba", k = 2
Output: 3
Explanation: "ece" has 2 distinct chars (e, c)

Example 2:
Input: s = "aa", k = 1
Output: 2

Example 3:
Input: s = "aabacbebebe", k = 3
Output: 7
Explanation: "cbebebe" has 3 distinct (c, b, e)

─────────────────────────────────────────────────────────────────────

Constraints:
- 1 <= s.length <= 5 * 10^4
- 0 <= k <= 50
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

## Problem: Fruit Into Baskets (Longest with 2 Distinct)

**LeetCode 904** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/fruit-into-baskets/](https://leetcode.com/problems/fruit-into-baskets/)

**FRUIT INTO BASKETS**

```text
You have 2 baskets. Each basket can hold only ONE type of fruit.
Find maximum fruits you can collect (longest subarray with 2 types).

Input: fruits = [1,2,1]
Output: 3 (collect all)

Input: fruits = [0,1,2,2]
Output: 3 ([1,2,2])

Input: fruits = [1,2,3,2,2]
Output: 4 ([2,3,2,2])
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

## Problem: Longest Repeating Character Replacement

**LeetCode 424** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/longest-repeating-character-replacement/](https://leetcode.com/problems/longest-repeating-character-replacement/)

**LONGEST REPEATING CHARACTER REPLACEMENT**

```text
You can replace at most k characters. Find longest substring with all
same characters after at most k replacements.

Input: s = "ABAB", k = 2
Output: 4
Explanation: Replace 2 A's with B's → "BBBB" (or vice versa)

Input: s = "AABABBA", k = 1
Output: 4
Explanation: Replace middle B → "AAAAABA" gives "AAAA"

KEY INSIGHT:
Window is valid if: (windowLength - maxFreq) <= k
We need to replace (windowLength - maxFreq) characters
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

## Problem: Max Consecutive Ones III

**LeetCode 1004** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/max-consecutive-ones-iii/](https://leetcode.com/problems/max-consecutive-ones-iii/)

**MAX CONSECUTIVE ONES III**

Given a binary array, flip at most `k` zeros and return the maximum number of consecutive 1s.

- **Input:** `nums = [1,1,1,0,0,0,1,1,1,1,0]`, `k = 2`
- **Output:** `6`
- **Explanation:** the window `nums[5..10] = [0,1,1,1,1,0]` contains exactly 2 zeros. Flipping both gives six consecutive 1s.

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

[← 4.1 Fixed Size Window](01_fixed_size_window.md) | [Chapter overview](../05_Sliding_Window.md) | [4.3 Sliding Window — String Matching →](03_sliding_window_string_matching.md)
