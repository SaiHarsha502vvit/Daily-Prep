> **Navigation**: [◀ Prev](Day_002_Arrays_PrefixSum.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next ▶](Day_004_BinarySearch.md)

# Day 03 — Sliding Window Pattern

> **15-Day Prep** | **Difficulty:** MEDIUM-HARD | **Theme:** Variable & Fixed Sliding Windows
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md)

---

## Completion Checklist

- [ ] P1: LC 159 — Longest Substring At Most 2 Distinct (Premium) (30 min)
- [ ] P2: LC 76 — Minimum Window Substring (30 min)
- [ ] P3: CF 279B — Books (20 min)
- [ ] P4: LC 340 — At Most K Distinct Characters (Premium, Hard) (25 min)

---

## 🧠 Pattern Mental Model — Sliding Window

```
TWO FLAVORS:

FLAVOR 1: FIXED SIZE WINDOW (size k)
  Use when: "subarray of EXACTLY length k with max/min/avg"
  Template:
    for r in [0, n-1]:
      window.add(arr[r])
      if r >= k: window.remove(arr[r - k])
      if r >= k - 1: update answer

FLAVOR 2: VARIABLE SIZE WINDOW (shrink when invalid)
  Use when: "LONGEST/SHORTEST subarray satisfying condition"
  Template:
    left = 0
    for right in [0, n-1]:
      expand window: include arr[right]
      while window is INVALID:
        shrink: remove arr[left], left++
      update answer (window [left..right] is valid)

WHEN VARIABLE WINDOW WORKS:
  ✅ Condition is MONOTONE:
     - If window [l, r] is invalid, [l, r+1] is also invalid
     - If window [l, r] is valid, [l+1, r] is also valid
  ✅ "Longest subarray with at most K distinct elements"
  ✅ "Shortest subarray with sum ≥ S" (only positive numbers!)
  ❌ If window can become valid again after shrinking (negative sums → use deque)
```

---

## Problem 1 — LC 159: Longest Substring with At Most 2 Distinct Characters 🔒 Premium

**Platform:** LeetCode Premium | **Difficulty:** Medium | **Pattern:** Sliding Window + HashMap

### 📋 Problem Statement

Given a string `s`, return the length of the longest substring that contains
**at most two distinct characters**.

**Constraints:**
```
1 <= s.length <= 10⁵
s consists of English letters
```

**Examples:**
```
Example 1:
  Input:  s = "eceba"
  Output: 3
  Explanation: Substring "ece" has length 3 (chars: 'e', 'c').

Example 2:
  Input:  s = "ccaabbb"
  Output: 5
  Explanation: Substring "aabbb" has length 5 (chars: 'a', 'b').

Example 3:
  Input:  s = "a"
  Output: 1
```

---

### Approach 1 — Brute Force: O(n²) or O(n³)

```java
public int lengthOfLongestSubstringTwoDistinct_BF(String s) {
    int maxLen = 0, n = s.length();
    for (int i = 0; i < n; i++) {
        Set<Character> seen = new HashSet<>();
        for (int j = i; j < n; j++) {
            seen.add(s.charAt(j));
            if (seen.size() <= 2) {
                maxLen = Math.max(maxLen, j - i + 1);
            } else {
                break;  // More than 2 distinct, no need to extend
            }
        }
    }
    return maxLen;
}
// Time: O(n²) | Space: O(1) — set has at most 3 chars before breaking
```

---

### Approach 2 — Optimal: Sliding Window + Frequency Map — O(n)

**Why Sliding Window works here:**
```
MONOTONE property:
  If window [l..r] has > 2 distinct chars → adding more chars only makes it worse
  If window [l..r] has ≤ 2 distinct chars → removing chars from left can only help

So: expand right freely, shrink left when we exceed 2 distinct chars.
```

```java
public int lengthOfLongestSubstringTwoDistinct(String s) {
    Map<Character, Integer> freq = new HashMap<>();  // char → count in window
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        // Expand: include s[right] in window
        char rc = s.charAt(right);
        freq.merge(rc, 1, Integer::sum);  // freq[rc]++

        // Shrink: if window has > 2 distinct chars, move left pointer
        while (freq.size() > 2) {
            char lc = s.charAt(left);
            freq.merge(lc, -1, Integer::sum);  // freq[lc]--
            if (freq.get(lc) == 0) freq.remove(lc);  // Remove if count hits 0
            left++;
        }

        // Window [left..right] now has ≤ 2 distinct chars
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time:  O(n) — each char added and removed at most once
// Space: O(1) — HashMap has at most 3 entries at any time
```

---

### 🔍 Dry Run — "eceba"

```
s = "eceba"
freq = {}, left = 0, maxLen = 0

right=0 (e): freq={e:1}. size=1≤2. maxLen=max(0,1)=1
right=1 (c): freq={e:1,c:1}. size=2≤2. maxLen=max(1,2)=2
right=2 (e): freq={e:2,c:1}. size=2≤2. maxLen=max(2,3)=3
right=3 (b): freq={e:2,c:1,b:1}. size=3>2 → shrink:
  left=0, lc='e': freq={e:1,c:1,b:1}. size=3>2 → shrink again:
  left=1, lc='c': freq={e:1,c:0,b:1}→remove c: freq={e:1,b:1}. size=2≤2!
  left=2
  maxLen=max(3,3-2+1)=max(3,2)=3
right=4 (a): freq={e:1,b:1,a:1}. size=3>2 → shrink:
  left=2, lc='e': freq={e:0,b:1,a:1}→remove e: freq={b:1,a:1}. size=2!
  left=3
  maxLen=max(3,4-3+1)=max(3,2)=3

Final answer: 3 ✅ (substring "ece")
```

---

## Problem 2 — LC 76: Minimum Window Substring

**Platform:** LeetCode | **Difficulty:** Hard | **Pattern:** Sliding Window + Two Frequency Maps

### 📋 Problem Statement

Given two strings `s` and `t`, return the **minimum window substring** of `s`
such that every character in `t` (including duplicates) is included in the window.
If no such substring exists, return `""`.

```
Constraints:
  1 <= m, n <= 10⁵  (m = s.length, n = t.length)
  s and t consist of uppercase and lowercase English letters.
  The answer is unique.

Example 1:
  Input:  s = "ADOBECODEBANC", t = "ABC"
  Output: "BANC"
  Explanation: Minimum window containing A, B, C.

Example 2:
  Input:  s = "a", t = "a"
  Output: "a"

Example 3:
  Input:  s = "a", t = "aa"
  Output: "" (only one 'a' in s, need two)
```

---

### Approach 1 — Brute Force: O(n² × m)

```java
public String minWindow_BF(String s, String t) {
    int n = s.length(), m = t.length();
    String result = "";
    for (int i = 0; i < n; i++) {
        for (int j = i + m; j <= n; j++) {  // min window must be at least |t|
            String sub = s.substring(i, j);
            if (contains(sub, t)) {
                if (result.isEmpty() || sub.length() < result.length()) {
                    result = sub;
                }
            }
        }
    }
    return result;
}
// Time: O(n² × m) — TLE
```

---

### Approach 2 — Better: Precompute t frequencies, O(n × |char|)

```java
// Build t's frequency map once. For each window, compare.
// Still O(n²) in worst case.
```

---

### Approach 3 — Optimal: Sliding Window with "have" vs "need" counter — O(n + m)

**The "formed" variable trick:** Instead of checking the whole map each time,
maintain a counter `formed` = number of characters in `t` whose current
window frequency satisfies the requirement.

```java
public String minWindow(String s, String t) {
    if (s.isEmpty() || t.isEmpty()) return "";

    // Frequency map for characters NEEDED from t
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    int required = need.size();  // # of DISTINCT chars we need to satisfy
    int formed = 0;              // # of distinct chars currently satisfied

    // Current window frequency map
    Map<Character, Integer> window = new HashMap<>();

    int left = 0;
    int minLen = Integer.MAX_VALUE;
    int minLeft = 0;

    for (int right = 0; right < s.length(); right++) {
        // Expand: add s[right] to window
        char rc = s.charAt(right);
        window.merge(rc, 1, Integer::sum);

        // Did this char satisfy one of our needed chars?
        if (need.containsKey(rc) && window.get(rc).equals(need.get(rc))) {
            formed++;  // This char's requirement is now met
        }

        // Shrink: while all requirements are met, try to minimize window
        while (formed == required) {
            // Update answer
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minLeft = left;
            }

            // Remove leftmost character
            char lc = s.charAt(left);
            window.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && window.get(lc) < need.get(lc)) {
                formed--;  // This char's requirement is no longer met
            }
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(minLeft, minLeft + minLen);
}
// Time:  O(n + m) — right pointer moves n steps, left pointer at most n steps
// Space: O(|charset|) — maps bounded by charset size (52 for letters)
```

---

### 🔍 Dry Run — "ADOBECODEBANC", t = "ABC"

```
need = {A:1, B:1, C:1}, required = 3, formed = 0

right=0 (A): window={A:1}, formed=1 (A satisfied!)
right=1 (D): window={A:1,D:1}, formed=1
right=2 (O): window={A:1,D:1,O:1}, formed=1
right=3 (B): window={A:1,D:1,O:1,B:1}, formed=2 (B satisfied!)
right=4 (E): window+E, formed=2
right=5 (C): window+C, formed=3 (C satisfied! All met!)

  SHRINK while formed=3:
    minLen=6-0+1=6, minLeft=0  (window = "ADOBEC")
    remove left=0 (A): window[A]=0 < need[A]=1 → formed=2, left=1

right=6 (O): window+O, formed=2
right=7 (D): formed=2
right=8 (E): formed=2
right=9 (B): formed=2  (B already in window)
right=10 (A): window[A]=1 == need[A]=1 → formed=3!

  SHRINK while formed=3:
    minLen=10-1+1=10? No. 10-1+1=10 > 6. No update.
    Wait: left=1 still.
    minLen=min(6,10-1+1=10). No update.
    remove left=1 (D): formed still 3, left=2
    window[D]=0, D not in need, no change.
    minLen=min(6,10-2+1=9). No update.
    remove left=2 (O): left=3
    ... continue shrinking ...
    remove left=3 (B): window[B]=1 < need[B]=1 → formed=2. left=4. Stop.

right=11 (N): formed=2
right=12 (C): window[C]=2 == need[C]=1? Actually window[C]++ makes it 2.
  need[C]=1. window[C]=2 ≥ need[C]=1 but formed only increments when EXACTLY equal.
  Hmm — let me trace more carefully.

KEY: formed++ only when window[c] == need[c] (just became sufficient, not over)

After right=12: formed=3 (A=1≥1, B=1≥1, C=1≥1 all met... but how?)
  Let's check: at this point left=4 (after removing A, D, O, B)
  window contains chars from index 4 to 12: "ECODEBANC"
  A: 1 ✅, B: 1 ✅, C: 2 ≥ 1 ✅

  SHRINK:
    remove E (left=4): not in need. left=5. minLen=min(6,12-4+1=9). No.
    remove C (left=5): window[C]=1 still ≥ need[C]=1, formed stays. left=6.
    remove O (left=6): not in need. left=7. 
    minLen=min(6,12-6+1=7). No.
    Hmm, wait: remove left=5 first.
    ...
    Eventually reaches: "BANC" (indices 9-12), length=4 < 6. Update!

Final answer: "BANC" ✅
```

### 💡 Key Insight
> **"The 'formed' counter is the heart of this solution. Increment only when
> a char's count EXACTLY reaches the required count (not just ≥). This gives
> O(1) check for 'is window valid' instead of scanning the whole map."**

---

## Problem 3 — CF 279B: Books

**Platform:** Codeforces | **Difficulty:** Easy (Div 2-B) | **Pattern:** Sliding Window (Variable)

### 📋 Problem Statement (Full)

There are `n` books, each taking `t[i]` minutes to read. Vasya has exactly
`T` minutes. He can read books only in consecutive order (can start from any
book). Find the maximum number of books Vasya can read in T minutes.

**Constraints:**
```
1 ≤ n ≤ 10⁵
1 ≤ T ≤ 10⁹
1 ≤ t[i] ≤ 10⁹
```

**Input:**
```
4 5
3 1 2 1
```
**Output:**
```
3
```
**Explanation:** Books [1,2,1] take 4 ≤ 5 minutes → read 3 books.

**Input:**
```
5 3
1 1 1 1 1
```
**Output:**
```
3
```

---

### Approach 1 — Brute Force: O(n²)

```java
int maxBooks = 0;
for (int i = 0; i < n; i++) {
    long sum = 0;
    for (int j = i; j < n; j++) {
        sum += t[j];
        if (sum <= T) maxBooks = Math.max(maxBooks, j - i + 1);
        else break;
    }
}
// Time: O(n²) — TLE for n = 10⁵
```

---

### Approach 2 — Optimal: Sliding Window (All Positive = Perfect for SW) — O(n)

**Why Sliding Window is perfect here:**
```
All t[i] ≥ 1 (positive). So:
- Adding a book INCREASES time used → if invalid, adding more won't help
- Removing a book DECREASES time used → can potentially make it valid again
This is the MONOTONE property → sliding window applies!
```

```java
import java.util.*;

public class CF_279B_Books {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long T = sc.nextLong();  // T can be up to 10⁹

        int[] t = new int[n];
        for (int i = 0; i < n; i++) t[i] = sc.nextInt();

        int left = 0, maxBooks = 0;
        long sum = 0;

        for (int right = 0; right < n; right++) {
            sum += t[right];  // Expand window

            // Shrink from left while sum exceeds T
            while (sum > T) {
                sum -= t[left];
                left++;
            }

            // Window [left..right] has sum ≤ T
            maxBooks = Math.max(maxBooks, right - left + 1);
        }
        System.out.println(maxBooks);
    }
}
// Time:  O(n) — right pointer moves n steps, left at most n steps
// Space: O(n) for input, O(1) for algorithm
```

---

### 🔍 Dry Run

```
n=4, T=5, t=[3,1,2,1]
left=0, sum=0, maxBooks=0

right=0: sum=3 ≤ 5. maxBooks=1. (window: [3])
right=1: sum=4 ≤ 5. maxBooks=2. (window: [3,1])
right=2: sum=6 > 5 → shrink:
  sum-=3, left=1. sum=3 ≤ 5. (window: [1,2])
  maxBooks=max(2,2)=2.
right=3: sum=4 ≤ 5. maxBooks=max(2,3)=3. (window: [1,2,1])

Answer: 3 ✅
```

---

## Problem 4 — LC 340: Longest Substring with At Most K Distinct Characters 🔒 Premium (Hard)

**Platform:** LeetCode Premium | **Difficulty:** Hard | **Pattern:** Sliding Window + HashMap (Generalization of LC 159)

### 📋 Problem Statement

Given a string `s` and an integer `k`, return the length of the longest
substring of `s` that contains **at most k distinct characters**.

**Constraints:**
```
1 <= s.length <= 5 × 10⁴
0 <= k <= 50
```

**Examples:**
```
Example 1:
  Input:  s = "eceba", k = 2
  Output: 3   (substring "ece")

Example 2:
  Input:  s = "aa", k = 1
  Output: 2   (substring "aa")

Example 3:
  Input:  s = "aabbcc", k = 1
  Output: 2   ("aa" or "bb" or "cc")

Example 4:
  Input:  s = "aabbcc", k = 3
  Output: 6   (entire string, 3 distinct)
```

---

### Approach 1 — Brute Force: O(n²)

Exactly like LC 159 brute force but check `set.size() <= k`. Not shown.

---

### Approach 2 — Optimal: Sliding Window (Generalized LC 159) — O(n)

**This is literally LC 159 with 2 replaced by k!** Understanding 159 → 340 is trivial.

```java
public int lengthOfLongestSubstringKDistinct(String s, int k) {
    // Edge case: k = 0, no characters allowed → return 0
    if (k == 0) return 0;

    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char rc = s.charAt(right);
        freq.merge(rc, 1, Integer::sum);

        // Shrink when more than k distinct chars
        while (freq.size() > k) {
            char lc = s.charAt(left);
            freq.merge(lc, -1, Integer::sum);
            if (freq.get(lc) == 0) freq.remove(lc);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time:  O(n) — same reasoning as LC 159
// Space: O(k) — HashMap holds at most k+1 entries (we shrink immediately)
```

---

### 🔍 Optimized: Using Array Instead of HashMap (When charset is small)

```java
// If s consists only of lowercase letters, use int[26] for O(1) ops
public int lengthOfLongestSubstringKDistinct_Array(String s, int k) {
    if (k == 0) return 0;
    int[] count = new int[128];  // ASCII
    int distinct = 0, left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        if (count[s.charAt(right)]++ == 0) distinct++;  // New char!

        while (distinct > k) {
            if (--count[s.charAt(left)] == 0) distinct--;  // Char removed
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time:  O(n) | Space: O(|charset|) = O(128) = O(1)
```

---

### 💡 Generalization Insight (MIT-style)

```
LC 159  = LC 340 with k = 2
LC 3    = LC 340 with k = all unique (different condition, but same template!)

THE SLIDING WINDOW COOKBOOK:
  1. Expand right → include new element
  2. Update window state (freq map, count, sum...)
  3. While window is INVALID → shrink left
  4. Record answer

The window "state" changes per problem:
  - LC 76  (min window): window is valid when all needs met
  - LC 159 (at most 2 distinct): window invalid when distinct > 2
  - LC 340 (at most k distinct): window invalid when distinct > k
  - CF 279 (books): window invalid when sum > T
```

---

## 📊 Day 03 Summary

| Problem | Window Type | Validity Condition | Time | Space |
|---------|-------------|-------------------|------|-------|
| LC 159 At Most 2 Distinct | Variable | distinct ≤ 2 | O(n) | O(1) |
| LC 76 Min Window | Variable (min) | all t chars covered | O(n+m) | O(charset) |
| CF 279B Books | Variable (max) | sum ≤ T | O(n) | O(1) |
| LC 340 At Most K Distinct | Variable | distinct ≤ k | O(n) | O(k) |

### 🎯 The Sliding Window Decision Tree

```
Is window size FIXED?
  YES → Fixed window: add right, remove (right-k)
  NO  → Variable window:
          Can window get WORSE by adding elements? (all positive sums, distinct chars)
            YES → Classic shrink-while-invalid
          Can window get invalidated AND then valid again?
            YES → Need deque or different approach (see Day 10: Sliding Window Maximum)
```

---

> **Next Day:** [Day 04 — Binary Search Pattern](Day_004_BinarySearch.md)
