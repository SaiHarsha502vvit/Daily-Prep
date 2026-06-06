> **Navigation**: [◀ Prev](Day_001_Arrays_TwoPointers.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next ▶](Day_003_SlidingWindow.md)

# Day 02 — Arrays: Prefix Sum Pattern

> **15-Day Prep** | **Difficulty:** MEDIUM | **Theme:** Prefix Sums + HashMap for Range Queries
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Next Day](Day_003_SlidingWindow.md)

---

## Completion Checklist

- [ ] P1: LC 325 — Max Size Subarray Sum = K (Premium) (30 min)
- [ ] P2: LC 560 — Subarray Sum Equals K (25 min)
- [ ] P3: CF 313B — Ilya and Queries (20 min)
- [ ] P4: CF 1398C — Good Subarrays (25 min)

---

## 🧠 Pattern Mental Model — Prefix Sum

```
CORE INSIGHT:
  A subarray sum can be computed in O(1) using prefix sums.

  prefix[i] = nums[0] + nums[1] + ... + nums[i-1]
  prefix[0] = 0  (empty prefix)

  Sum of subarray [l, r] = prefix[r+1] - prefix[l]

THE HASH MAP TRICK:
  "How many subarrays have sum = K?"

  Rephrase: prefix[r] - prefix[l] = K
            ⟹ prefix[l] = prefix[r] - K

  So at index r, we look for HOW MANY previous prefix sums equal
  (current_prefix - K). Store frequencies in a HashMap!

TEMPLATE:
  prefix = 0
  map = {0: 1}   // Base case: empty subarray has prefix sum 0
  count = 0
  for each num in nums:
      prefix += num
      count += map.getOrDefault(prefix - K, 0)
      map[prefix]++

WHY {0: 1}?
  If prefix[r] = K exactly (subarray from index 0 to r-1 has sum K),
  we need to count it. prefix - K = 0, and map[0] = 1 handles this.

WHEN TO USE:
  ✅ "Count subarrays with sum = K"
  ✅ "Find longest subarray with sum = K"
  ✅ "Range sum queries on static array"
  ✅ Subarray sum divisible by K (use modular prefix)
  ❌ Subarrays where elements must be positive (use sliding window instead)
```

---

## Problem 1 — LC 325: Maximum Size Subarray Sum Equals K 🔒 Premium

**Platform:** LeetCode Premium | **Difficulty:** Medium | **Pattern:** Prefix Sum + HashMap

### 📋 Problem Statement

Given an integer array `nums` and an integer `k`, return the **maximum length**
of a subarray that sums to `k`. If there isn't one, return `0`.

**Constraints:**
```
1 <= nums.length <= 2 × 10⁵
-10⁴ <= nums[i] <= 10⁴
-10⁵ <= k <= 10⁵
```

**Examples:**
```
Example 1:
  Input:  nums = [1, -1, 5, -2, 3], k = 3
  Output: 4
  Explanation: Subarray [1, -1, 5, -2] sums to 3 and has length 4.
               Subarray [3] also sums to 3, but length 1.
               Maximum = 4.

Example 2:
  Input:  nums = [-2, -1, 2, 1], k = 1
  Output: 2
  Explanation: Subarray [-1, 2] sums to 1 and has length 2.

Example 3:
  Input:  nums = [1], k = 0
  Output: 0
  Explanation: No subarray sums to 0.
```

---

### Approach 1 — Brute Force: O(n²) or O(n³)

**O(n³): Try all subarrays, compute sum each time:**
```java
public int maxSubArrayLen_BF(int[] nums, int k) {
    int n = nums.length, maxLen = 0;
    for (int i = 0; i < n; i++) {
        for (int j = i; j < n; j++) {
            int sum = 0;
            for (int x = i; x <= j; x++) sum += nums[x];  // O(n)
            if (sum == k) maxLen = Math.max(maxLen, j - i + 1);
        }
    }
    return maxLen;
}
// Time: O(n³) — TLE for n = 2×10⁵
```

**O(n²): Precompute prefix sums:**
```java
public int maxSubArrayLen_O2(int[] nums, int k) {
    int n = nums.length, maxLen = 0;
    int[] prefix = new int[n + 1];
    for (int i = 1; i <= n; i++) prefix[i] = prefix[i - 1] + nums[i - 1];

    for (int i = 0; i < n; i++) {
        for (int j = i; j < n; j++) {
            if (prefix[j + 1] - prefix[i] == k) {
                maxLen = Math.max(maxLen, j - i + 1);
            }
        }
    }
    return maxLen;
}
// Time: O(n²) — still too slow. Getting warmer though.
```

---

### Approach 2 — Better: Prefix Sum + Binary Search O(n log n)

Not shown — doesn't handle negative numbers well. Skipping to optimal.

---

### Approach 3 — Optimal: Prefix Sum + HashMap — O(n) Time, O(n) Space

**Key Difference from LC 560 (count subarrays):**
- LC 560 wants **COUNT** → add frequency at every prefix
- LC 325 wants **MAX LENGTH** → store only the **FIRST** occurrence of each prefix
  (earlier index = longer subarray)

```java
public int maxSubArrayLen(int[] nums, int k) {
    // map: prefix_sum → earliest index where this prefix_sum appeared
    Map<Integer, Integer> firstOccurrence = new HashMap<>();
    firstOccurrence.put(0, -1);  // prefix sum 0 occurs "before" index 0

    int prefix = 0;
    int maxLen = 0;

    for (int i = 0; i < nums.length; i++) {
        prefix += nums[i];

        // Check if a subarray ending at i has sum = k
        // prefix[i+1] - prefix[l] = k  →  prefix[l] = prefix[i+1] - k
        int target = prefix - k;
        if (firstOccurrence.containsKey(target)) {
            int startIndex = firstOccurrence.get(target);
            maxLen = Math.max(maxLen, i - startIndex);
            // i - startIndex = length of subarray (startIndex+1 to i)
        }

        // Store ONLY first occurrence (to maximize subarray length)
        // WHY: If prefix sum 3 first appeared at index 2 and again at index 5,
        //      using index 2 gives longer subarray. So never overwrite.
        if (!firstOccurrence.containsKey(prefix)) {
            firstOccurrence.put(prefix, i);
        }
    }
    return maxLen;
}
// Time:  O(n) — single pass + O(1) HashMap operations
// Space: O(n) — HashMap stores at most n+1 distinct prefix sums
```

---

### 🔍 Dry Run — Example 1

```
nums = [1, -1, 5, -2, 3], k = 3
firstOccurrence = {0: -1}

i=0, nums[0]=1:
  prefix = 1
  target = 1 - 3 = -2 → not in map
  map: {0: -1, 1: 0}

i=1, nums[1]=-1:
  prefix = 0
  target = 0 - 3 = -3 → not in map
  prefix=0 already in map → don't overwrite
  map: {0: -1, 1: 0}       ← 0 stays at -1 (first occurrence!)

i=2, nums[2]=5:
  prefix = 5
  target = 5 - 3 = 2 → not in map
  map: {0: -1, 1: 0, 5: 2}

i=3, nums[3]=-2:
  prefix = 3
  target = 3 - 3 = 0 → in map at -1!
  maxLen = max(0, 3 - (-1)) = 4 ✅
  map: {0: -1, 1: 0, 5: 2, 3: 3}

i=4, nums[4]=3:
  prefix = 6
  target = 6 - 3 = 3 → in map at 3!
  maxLen = max(4, 4 - 3) = max(4, 1) = 4 (no improvement)
  map: {0: -1, 1: 0, 5: 2, 3: 3, 6: 4}

Answer: 4 ✅
```

---

### ⚡ Edge Cases
- All negatives: works fine (prefix sums go negative, HashMap handles it)
- `k = 0`: sum must be exactly 0, needs {0: -1} initialization
- Duplicate prefix sums: only store first (don't overwrite)
- Empty array: return 0 immediately

---

## Problem 2 — LC 560: Subarray Sum Equals K

**Platform:** LeetCode | **Difficulty:** Medium | **Pattern:** Prefix Sum + HashMap (count variant)

### 📋 Problem Statement

Given an array of integers `nums` and an integer `k`, return the **total number**
of subarrays whose sum equals to `k`.

```
Constraints:
  1 <= nums.length <= 2 × 10⁴
  -1000 <= nums[i] <= 1000
  -10⁷ <= k <= 10⁷

Example 1:
  Input:  nums = [1, 1, 1], k = 2
  Output: 2  ([1,1] at indices 0-1, and [1,1] at indices 1-2)

Example 2:
  Input:  nums = [1, 2, 3], k = 3
  Output: 2  ([3] at index 2, and [1,2] at indices 0-1)
```

---

### Approach 1 — Brute Force: O(n²)

```java
public int subarraySum_BF(int[] nums, int k) {
    int count = 0, n = nums.length;
    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += nums[j];
            if (sum == k) count++;
        }
    }
    return count;
}
// Time: O(n²) | Space: O(1)
// For n=2×10⁴: 4×10⁸ operations — borderline TLE
```

---

### Approach 2 — Optimal: Prefix Sum + HashMap — O(n) Time, O(n) Space

**Difference from LC 325:** We store FREQUENCY (count), not just first occurrence.
Because we want COUNT of subarrays, not longest one.

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    freq.put(0, 1);  // One way to have prefix sum 0 (empty prefix)

    int prefix = 0, count = 0;

    for (int num : nums) {
        prefix += num;

        // How many previous subarrays end such that sum from there to here = k?
        // prefix[r] - prefix[l] = k  →  prefix[l] = prefix[r] - k
        count += freq.getOrDefault(prefix - k, 0);

        // Record this prefix sum (we DO increment for duplicates here!)
        freq.merge(prefix, 1, Integer::sum);
    }
    return count;
}
// Time:  O(n) | Space: O(n)

// KEY DIFFERENCE from LC 325:
//   LC 325: freq.putIfAbsent(prefix, i)    → FIRST occurrence for MAX LENGTH
//   LC 560: freq.merge(prefix, 1, Integer::sum) → ALL occurrences for COUNT
```

---

### 🔍 Dry Run — Example 1

```
nums = [1, 1, 1], k = 2
freq = {0: 1}

Step 1 (num=1): prefix=1, look for 1-2=-1 → freq[-1]=0, count=0. freq={0:1, 1:1}
Step 2 (num=1): prefix=2, look for 2-2=0  → freq[0]=1,  count=1. freq={0:1, 1:2, 2:1}
                                                        ↑ subarray [1,1] from index 0-1!
Step 3 (num=1): prefix=3, look for 3-2=1  → freq[1]=2,  count=3. 
                                                        ↑ Wait, freq[1]=2? Why?

Back up: after step 2, freq = {0:1, 1:2, 2:1}
freq[1] = 2 means prefix sum 1 occurred twice:
  - After index 0 (just the element 1)
  - After index 1 (elements 1+1=2... wait that's 2)
  
Hmm, let me redo:
  After index 0: prefix=1, freq[1]++ → freq={0:1, 1:1}
  After index 1: prefix=2, freq[2]++ → freq={0:1, 1:1, 2:1}
  After index 2: prefix=3, look for 3-2=1 → freq[1]=1, count=1+1=2 ✅

Let me re-trace more carefully:
  freq = {0: 1}
  i=0: prefix=1, target=1-2=-1 → 0. freq→{0:1, 1:1}. count=0
  i=1: prefix=2, target=2-2= 0 → freq[0]=1. count=1. freq→{0:1,1:1,2:1}
  i=2: prefix=3, target=3-2= 1 → freq[1]=1. count=2. freq→{0:1,1:1,2:1,3:1}

Answer: 2 ✅
```

---

## Problem 3 — CF 313B: Ilya and Queries

**Platform:** Codeforces | **Difficulty:** Easy (Div 2-B) | **Pattern:** Prefix Sum for Range Queries

### 📋 Problem Statement (Full)

You are given a string `s` consisting of characters '.' and '#' of length `n`.
You are given `m` queries. Each query is a pair `(l, r)` with `1 ≤ l < r ≤ n`.

For each query, compute the number of indices `j` with `l ≤ j < r` such that
`s[j] == s[j+1]` (adjacent equal characters in range).

**Constraints:**
```
2 ≤ n ≤ 10⁵
1 ≤ m ≤ 10⁵
1 ≤ l < r ≤ n
```

**Sample Input 1:**
```
......
4
3 4
2 3
1 6
2 6
```
**Sample Output 1:**
```
1
1
5
4
```

**Sample Input 2:**
```
#..###
5
1 3
5 6
1 5
3 6
3 4
```
**Sample Output 2:**
```
1
1
2
2
0
```

---

### Approach 1 — Brute Force: O(n) per query

```java
// For each query, linearly scan. O(m × n) total → TLE for 10⁵ each.
for (int q = 0; q < m; q++) {
    int l = sc.nextInt(), r = sc.nextInt();
    int count = 0;
    for (int j = l - 1; j < r - 1; j++) {  // 0-indexed
        if (s.charAt(j) == s.charAt(j + 1)) count++;
    }
    System.out.println(count);
}
// Time: O(m × n) = 10^10 — TLE
```

---

### Approach 2 — Optimal: Precompute Prefix, Answer in O(1) — O(n + m)

**Insight:** Precompute `dp[i]` = number of equal adjacent pairs in `s[0..i-1]`.
Then query `(l, r)` is answered as `dp[r-1] - dp[l-1]` (1-indexed).

```java
import java.util.*;
import java.io.*;

public class CF_313B_IlyaAndQueries {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();

        String s = br.readLine().trim();
        int n = s.length();

        // dp[i] = # of adjacent equal pairs in s[0..i-1]
        // dp[0] = 0 (empty prefix has no pairs)
        int[] dp = new int[n + 1];
        for (int i = 1; i < n; i++) {
            dp[i] = dp[i - 1] + (s.charAt(i - 1) == s.charAt(i) ? 1 : 0);
        }
        // dp[n] same as dp[n-1] for convenience
        dp[n] = dp[n - 1];

        int m = Integer.parseInt(br.readLine().trim());
        for (int q = 0; q < m; q++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int l = Integer.parseInt(st.nextToken());
            int r = Integer.parseInt(st.nextToken());

            // Query: pairs in range [l, r] (1-indexed)
            // = pairs in s[l-1..r-1] = dp[r-1] - dp[l-1]
            sb.append(dp[r - 1] - dp[l - 1]).append('\n');
        }
        System.out.print(sb);
    }
}
// Time:  O(n + m) — O(n) preprocessing + O(1) per query
// Space: O(n) — dp array
```

---

### 🔍 Dry Run — Sample 1

```
s = "......" (6 dots, all equal)
n = 6

Building dp:
  dp[0] = 0
  dp[1]: s[0]='.' == s[1]='.' → dp[1] = 0 + 1 = 1
  dp[2]: s[1]='.' == s[2]='.' → dp[2] = 1 + 1 = 2
  dp[3]: s[2]='.' == s[3]='.' → dp[3] = 2 + 1 = 3
  dp[4]: s[3]='.' == s[4]='.' → dp[4] = 3 + 1 = 4
  dp[5]: s[4]='.' == s[5]='.' → dp[5] = 4 + 1 = 5

Queries:
  (3,4): dp[3]-dp[2] = 3-2 = 1 ✅
  (2,3): dp[2]-dp[1] = 2-1 = 1 ✅
  (1,6): dp[5]-dp[0] = 5-0 = 5 ✅
  (2,6): dp[5]-dp[1] = 5-1 = 4 ✅
```

### 💡 Key Insight
> **"Transform a character property (adjacent equality) into a prefix sum array.
> Then any range query is O(1). This is the essence of offline prefix sums."**

---

## Problem 4 — CF 1398C: Good Subarrays ⭐ (The "Good Subarrays" problem!)

**Platform:** Codeforces | **Difficulty:** Medium (Div 2-C) | **Pattern:** Prefix Sum + HashMap (Non-obvious transform)

### 📋 Problem Statement (Full)

You are given `t` test cases. For each test case:
- A string of `n` digits (each digit 0-9)
- A subarray (contiguous subsequence of digits) is called **GOOD** if the
  sum of its elements equals its length.

Find the total number of good subarrays.

**Constraints:**
```
1 ≤ t ≤ 10⁴
1 ≤ n ≤ 10⁵
Each character is a digit '0'-'9'
Sum of all n ≤ 10⁵ (total across test cases)
```

**Input:**
```
3
3
120
5
11011
6
600005
```
**Output:**
```
3
6
1
```

**Explanation for "120":**
- Array = [1, 2, 0]
- Good subarrays (sum = length):
  - [1] at index 0: sum=1, len=1 ✅
  - [2] at index 1: sum=2... len=1 ❌ (sum ≠ length)
  - [0] at index 2: sum=0, len=1 ❌
  - [1,2] at 0-1: sum=3, len=2 ❌
  - [2,0] at 1-2: sum=2, len=2 ✅
  - [1,2,0] at 0-2: sum=3, len=3 ✅
- Count = 3 ✅

---

### 🔑 The Non-Obvious Transform (This is the brain puzzle!)

```
Good subarray condition: sum(a[l..r]) = r - l + 1

Transform: let b[i] = a[i] - 1  (subtract 1 from every element)

Then: sum(a[l..r]) = r - l + 1
  ⟺  sum(b[l..r] + 1) = r - l + 1  (adding 1 back to each)
  ⟺  sum(b[l..r]) + (r - l + 1) = r - l + 1
  ⟺  sum(b[l..r]) = 0

So: good subarray in a[] ≡ subarray with sum 0 in b[]!

Now use the prefix sum trick:
  prefix[r] - prefix[l-1] = 0
  ⟺  prefix[r] = prefix[l-1]

Count pairs (l, r) where prefix sums are equal!
→ Use frequency map: for each prefix sum, count of previous times it appeared.
```

### Approach 1 — Brute Force: O(n²)

```java
// Check all subarrays
for (int l = 0; l < n; l++) {
    int sum = 0;
    for (int r = l; r < n; r++) {
        sum += a[r];
        int len = r - l + 1;
        if (sum == len) count++;
    }
}
// Time: O(n²) — TLE for n = 10⁵
```

---

### Approach 2 — Optimal: Transform + Prefix Sum + HashMap — O(n)

```java
import java.util.*;
import java.io.*;

public class CF_1398C_GoodSubarrays {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();

        while (t-- > 0) {
            int n = Integer.parseInt(br.readLine().trim());
            String s = br.readLine().trim();

            // a[i] = digit value, b[i] = a[i] - 1
            // Count subarrays of b with sum = 0
            // Use frequency map of prefix sums

            Map<Integer, Long> freq = new HashMap<>();
            freq.put(0, 1L);  // prefix sum 0 seen once (before any element)

            int prefix = 0;
            long count = 0;

            for (int i = 0; i < n; i++) {
                int digit = s.charAt(i) - '0';
                prefix += (digit - 1);  // b[i] = a[i] - 1

                // How many previous positions had same prefix sum?
                count += freq.getOrDefault(prefix, 0L);

                // Record this prefix sum
                freq.merge(prefix, 1L, Long::sum);
            }
            sb.append(count).append('\n');
        }
        System.out.print(sb);
    }
}
// Time:  O(n) per test case
// Space: O(n) for the HashMap
```

---

### 🔍 Dry Run — "11011"

```
s = "11011", a = [1,1,0,1,1], b = [0,0,-1,0,0]

freq = {0: 1}, prefix = 0

i=0: digit=1, b[0]=0, prefix=0 → count += freq[0]=1 → count=1
     freq={0:2}

i=1: digit=1, b[1]=0, prefix=0 → count += freq[0]=2 → count=3
     freq={0:3}

i=2: digit=0, b[2]=-1, prefix=-1 → count += freq[-1]=0 → count=3
     freq={0:3, -1:1}

i=3: digit=1, b[3]=0, prefix=-1+0=-1 
     Wait: prefix = -1 + (1-1) = -1 + 0 = -1
     count += freq[-1]=1 → count=4
     freq={0:3, -1:2}

i=4: digit=1, b[4]=0, prefix=-1+0=-1
     count += freq[-1]=2 → count=6
     freq={0:3, -1:3}

Answer: 6 ✅
```

### ⚡ Edge Cases
- All 1s → all subarrays are good (every b[i]=0, prefix stays 0)
- All 0s → no good subarrays of length > 1
- Answer can be O(n²) → use `long`, not `int`!
- Use `BufferedReader` for CF, not `Scanner` (faster I/O)

### 💡 Key Insight
> **"When condition is 'sum equals length', transform: b[i] = a[i] - 1.
> Now the condition becomes 'sum equals 0'. Then equal prefix sums → good
> subarray. Count equal prefix pairs using frequency map."**
>
> **PATTERN: Any condition involving 'sum = some_function_of_length' can often
> be transformed into a 'sum = constant' problem via element-wise offset.**

---

## 📊 Day 02 Summary

| Problem | Pattern | Time | Space | Key Trick |
|---------|---------|------|-------|-----------|
| LC 325 Max Subarray = K | Prefix + HashMap (first occ) | O(n) | O(n) | Store first occurrence only |
| LC 560 Subarray Sum = K | Prefix + HashMap (frequency) | O(n) | O(n) | Store all frequencies |
| CF 313B Ilya Queries | Static prefix sum | O(n+m) | O(n) | Precompute, O(1) query |
| CF 1398C Good Subarrays | Transform + Prefix + HashMap | O(n) | O(n) | b[i]=a[i]-1 makes sum=0 |

### 🎯 The Two Prefix Sum Variants

```
VARIANT 1: "Longest subarray with sum = K"
  → Store FIRST occurrence of each prefix sum
  → Never overwrite (earlier index = longer subarray)

VARIANT 2: "Count subarrays with sum = K"
  → Store FREQUENCY of each prefix sum
  → Always increment (all occurrences matter)
```

---

> **Next Day:** [Day 03 — Sliding Window Pattern](Day_003_SlidingWindow.md)
