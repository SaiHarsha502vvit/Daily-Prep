# 📝 4.3 Sliding Window — String Matching

> **Navigation**: [← 4.2 Variable Size Window](02_variable_size_window.md) | [Chapter overview](../05_Sliding_Window.md)
> Page 3 of 3 in **Sliding Window**


## Problem: Permutation in String

**LeetCode 567** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/permutation-in-string/](https://leetcode.com/problems/permutation-in-string/)

**PERMUTATION IN STRING**

```text
Check if s2 contains any permutation of s1.

Input: s1 = "ab", s2 = "eidbaooo"
Output: true
Explanation: s2 contains "ba" which is permutation of "ab"

Input: s1 = "ab", s2 = "eidboaoo"
Output: false
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

## Problem: Minimum Window Substring

**LeetCode 76** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/)

**MINIMUM WINDOW SUBSTRING**

```text
Find minimum window in s that contains all characters of t.

Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"

Visual:
ADOBECODEBANC
A   ─┘    (has A, need B,C)
ADOBEC    (has A,B,C - valid, len=6)
 DOBEC    (no A - invalid)
...
       BANC  (has A,B,C - valid, len=4) ← MIN
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

## 🔒 PREMIUM: Longest Substring with At Most Two Distinct Characters

**LeetCode 159** | **Difficulty:** Medium | **Premium Problem**

**LONGEST SUBSTRING WITH AT MOST TWO DISTINCT CHARACTERS — (LeetCode 159 - Premium)**

```text
Find length of longest substring with at most 2 distinct characters.

─────────────────────────────────────────────────────────────────────

Example 1:
Input: s = "eceba"
Output: 3
Explanation: "ece" has 2 distinct characters

Example 2:
Input: s = "ccaabbb"
Output: 5
Explanation: "aabbb" has 2 distinct characters

─────────────────────────────────────────────────────────────────────

Constraints:
- 1 <= s.length <= 10^5
- s consists of English letters
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

---

## Historical Evolution

No single inventor. Moving averages predate computers; the TCP sliding-window flow control is specified in RFC 793 (1981) and Van Jacobson's 1988 paper added congestion control; van Herk (1992) and Gil–Werman (1993) gave `O(n)` sliding minimum/maximum filters; Datar, Gionis, Indyk and Motwani (2002) studied statistics over sliding windows of data streams. Interview problems group these as "sliding window".

- **RFC 793 — 1981**: Window-based flow control in TCP
- **Jacobson — 1988**: Congestion avoidance and control
- **van Herk / Gil–Werman — 1992–93**: `O(n)` running min/max
- **Datar et al. — 2002**: Sliding-window statistics on streams

## Problem 12: Sliding Window Maximum

**LeetCode 239** | **Difficulty:** Hard

**SLIDING WINDOW MAXIMUM (LeetCode 239 - Hard)**

```text
Given array nums and sliding window of size k, return max in each
window position as the window slides from left to right.

Example:
Input: nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]

KEY INSIGHT: Use monotonic deque (decreasing) — front always has max
TIME: O(n) | SPACE: O(k)
```

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1)
            deque.pollFirst();
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i])
            deque.pollLast();
        deque.offerLast(i);
        if (i >= k - 1)
            result[i - k + 1] = nums[deque.peekFirst()];
    }
    return result;
}
```

---

## Problem 13: Subarrays with K Different Integers

**LeetCode 992** | **Difficulty:** Hard

**SUBARRAYS WITH K DIFFERENT INTEGERS (LeetCode 992 - Hard)**

```text
Return count of subarrays with exactly k distinct integers.

Example:
Input: nums = [1,2,1,2,3], k = 2  →  Output: 7

KEY TRICK: exactly(k) = atMost(k) - atMost(k-1)
TIME: O(n) | SPACE: O(k)
```

```java
public int subarraysWithKDistinct(int[] nums, int k) {
    return atMost(nums, k) - atMost(nums, k - 1);
}

private int atMost(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    int left = 0, result = 0;
    for (int right = 0; right < nums.length; right++) {
        count.merge(nums[right], 1, Integer::sum);
        while (count.size() > k) {
            int leftVal = nums[left];
            count.merge(leftVal, -1, Integer::sum);
            if (count.get(leftVal) == 0) count.remove(leftVal);
            left++;
        }
        result += right - left + 1;
    }
    return result;
}
```

---

## Problem 14: Grumpy Bookstore Owner

**LeetCode 1052** | **Difficulty:** Medium

**GRUMPY BOOKSTORE OWNER (LeetCode 1052 - Medium)**

```text
Owner can use technique for k minutes to not be grumpy.
Find max satisfied customers.

Example:
customers = [1,0,1,2,1,1,7,5], grumpy = [0,1,0,1,0,1,0,1], k=3
Output: 16

KEY: Base satisfied + sliding window of size k for max extra.
TIME: O(n) | SPACE: O(1)
```

```java
public int maxSatisfied(int[] customers, int[] grumpy, int minutes) {
    int n = customers.length, baseSatisfied = 0;
    for (int i = 0; i < n; i++)
        if (grumpy[i] == 0) baseSatisfied += customers[i];

    int extra = 0, maxExtra = 0;
    for (int i = 0; i < n; i++) {
        if (grumpy[i] == 1) extra += customers[i];
        if (i >= minutes && grumpy[i - minutes] == 1)
            extra -= customers[i - minutes];
        maxExtra = Math.max(maxExtra, extra);
    }
    return baseSatisfied + maxExtra;
}
```

---

## Problem 15: Count Number of Nice Subarrays

**LeetCode 1248** | **Difficulty:** Medium

**COUNT NUMBER OF NICE SUBARRAYS (LeetCode 1248 - Medium)**

```text
Nice subarray = exactly k odd numbers. Return count.

Example: nums = [1,1,2,1,1], k = 3  →  Output: 2

KEY: exactly(k) = atMost(k) - atMost(k-1)
TIME: O(n) | SPACE: O(1)
```

```java
public int numberOfSubarrays(int[] nums, int k) {
    return atMost(nums, k) - atMost(nums, k - 1);
}

private int atMost(int[] nums, int k) {
    int left = 0, result = 0, oddCount = 0;
    for (int right = 0; right < nums.length; right++) {
        if (nums[right] % 2 == 1) oddCount++;
        while (oddCount > k) {
            if (nums[left] % 2 == 1) oddCount--;
            left++;
        }
        result += right - left + 1;
    }
    return result;
}
```

---

## Problem 16: Max Consecutive Ones III

**LeetCode 1004** | **Difficulty:** Medium

**MAX CONSECUTIVE ONES III (LeetCode 1004 - Medium)**

```text
Max consecutive 1's if you can flip at most k 0's.

Example: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2  →  Output: 6

KEY: Sliding window tracking zeros count. Shrink when > k.
TIME: O(n) | SPACE: O(1)
```

```java
public int longestOnes(int[] nums, int k) {
    int left = 0, maxLen = 0, zeros = 0;
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

---

## 🏆 Competitive Programming — Codeforces Problems

These CF problems need Sliding Window + additional thinking. Must-do before interviews.

| Problem             | Link                                                         | Techniques                        | Difficulty  |
| ------------------- | ------------------------------------------------------------ | --------------------------------- | ----------- |
| Vasya and String    | [CF 676C](https://codeforces.com/problemset/problem/676/C)   | Variable SW on strings            | ⭐⭐ Medium |
| The Queue           | [CF 1561D](https://codeforces.com/problemset/problem/1561/D) | Window + simulation               | ⭐⭐ Medium |
| Good Subarrays      | [CF 1398C](https://codeforces.com/problemset/problem/1398/C) | Count valid windows               | ⭐⭐ Medium |
| Number of Subarrays | [CF 1869B](https://codeforces.com/problemset/problem/1869/B) | prefix sum on windows             | ⭐⭐ Medium |
| Beautiful Numbers   | [CF 1264C](https://codeforces.com/problemset/problem/1264/C) | Frequency count in sliding window | ⭐⭐⭐ Hard |

---

## 🌍 Real-World Applications of Sliding Window

| Technique                  | Real-World System              | How It's Used                                                   |
| -------------------------- | ------------------------------ | --------------------------------------------------------------- |
| **Fixed window**           | Network monitoring             | "Average bytes/sec in last N packets" without re-computing      |
| **Variable window**        | Nginx/HAProxy rate limiting    | "At most K requests in any rolling 60-second window"            |
| **Frequency map window**   | Text analysis, NLP             | Plagiarism detection — find all substrings matching a signature |
| **Min/Max in window**      | Finance (technical indicators) | Rolling Bollinger Bands = sliding window min/max/average        |
| **String window matching** | Intrusion Detection Systems    | Scan network packets for malicious substrings in real-time      |

```
🔥 REAL CODE: This is Java's exact approach for streaming analytics:
   "At most K violations in a rolling window" = variable sliding window
   Used by: Netflix error rate monitors, AWS CloudWatch metrics
```

---


---

### Production Reality

**Sliding Window** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Sum invariant breaks on negative numbers.** Maximum Sum Subarray (LeetCode 53) uses `windowSum += arr[right]` and `maxSum = max(maxSum, windowSum)`. This works because adding a negative number always decreases the sum, guaranteeing optimal windows shrink. But if you adapt this pattern for a sliding window on `[1, -3, 2, -1, 4, -2]` with constraints that include product instead of sum, the invariant that "window expansion monotonically increases/decreases sum" breaks completely. Illustrative impact: incorrect results in financial calculations (returns can be negative) or signal processing (oscillating values). Bug silently propagates until a customer reports wrong portfolio risk metrics.

**Failure mode 2: Infinite loop when window contraction condition is impossible to satisfy.** Variable window problems like "minimum length subarray with sum >= s" use `while(windowSum >= s)` to shrink. If your contraction condition uses strict inequality when non-strict is needed, or if floating-point precision means `windowSum >= s` never stabilizes, the loop never terminates. Illustrative impact: request timeout or CPU spike causing cascading timeouts in load-balanced systems. This bug killed a production service at a fintech company when the window never contracted due to double precision accumulation error over millions of micro-transactions.

**Debug workflow:** (1) Print window boundaries and aggregate value on each iteration. (2) Verify contraction condition is reachable by checking if adding all remaining elements would exceed the threshold. (3) Add `assert` checks: `assert(windowSize >= 0)` and `assert(iterations < 2 * n)` where n is array length. (4) For numeric stability, round to fixed precision before comparisons.

**Real-world anchor:** TCP's window-based flow control (RFC 793) needed a fix for the "silly window syndrome" (RFC 813, 1982): tiny window updates made senders transmit tiny segments. Window logic has edge cases even in the most widely deployed protocol.

---

[← 4.2 Variable Size Window](02_variable_size_window.md) | [Chapter overview](../05_Sliding_Window.md)
