# 🔲 Part 4: Sub Arrays — From Brute Force to Mastery

> **Navigation**: [← Foundation Practice — Build Array Muscle…](02_foundation_practice_build_array_muscle_memory.md) | [Chapter overview](../01b_Arrays.md) | [Sub Sequences — Order Without Contiguity →](04_sub_sequences_order_without_contiguity.md)
> Page 3 of 7 in **Arrays**


## 💬 Study-Partner View — Sub-arrays

**1. The bottom line:** A sub-array is a contiguous slice of an array, and most problems about them can be solved in one pass instead of checking all slices.

**2. The textbook core:**

- A sub-array is non-empty and **contiguous**; an array of length `n` has `n(n+1)/2` of them.
- Brute force enumerates all slices: **O(n²)** (or O(n³) if you re-sum each).
- Techniques: **Kadane's algorithm** (max sum), **prefix sums** (range sums, "sum equals K" with a HashMap), **sliding window** (fixed or variable size).
- Each technique keeps a small running state instead of recomputing slices.

**3. The real-world analogy:** Reading a **book chapter**: you take a continuous run of pages. Skipping pages to build a summary would be a *subsequence* instead.

**4. Walkthrough:**

1. Find the maximum sub-array sum of `[-2, 1, -3, 4, -1, 2, 1]` with Kadane.
2. Keep `cur` = best sum ending here and `best` = best overall: `cur = max(x, cur + x)`.
3. Running: -2, 1, -2, 4, 3, 5, 6 → `best = 6` (the slice `[4, -1, 2, 1]`).
4. One pass, O(n) time, O(1) space.

> [!NOTE]
> **Quick check:** When does a negative running sum help? *Never; Kadane drops it and starts fresh at the next element.*


🎯 **This is where the most important array algorithms live. You'll hit walls that force you to learn Sliding Window, Two Pointers, and Prefix Sum.**

## 📖 Theory — What is a Sub Array?

**Input:** `{1, 2, 3}`

| Length | Sub-arrays |
| ------ | ---------- |
| 1 | `{1}`, `{2}`, `{3}` |
| 2 | `{1,2}`, `{2,3}` |
| 3 | `{1,2,3}` |

Total = n·(n+1)/2 = 3·4/2 = **6**.

**Key properties:**

- ✅ **Contiguous:** elements must be adjacent in the original array
- ✅ **Order preserved**
- ✅ **Non-empty**

**Sub-array vs subsequence:**

| Candidate | From `{1,2,3}` | Why |
| --------- | -------------- | --- |
| `{1,3}` as a sub-array | ❌ Not a sub-array | `2` is skipped |
| `{1,3}` as a subsequence | ✅ Valid subsequence | Order kept, gaps allowed |

❓ **Quick Check:** How many sub-arrays in `{1,2,3,4,5}`?
→ 5×6/2 = **15**

---

## 🔵 Level 1: Enumerate All Sub Arrays

```java
// Time: O(n²) enumerate | O(n³) if printing each element
public void printAllSubArrays(int[] arr) {
    int n = arr.length;
    for (int start = 0; start < n; start++) {
        for (int end = start; end < n; end++) {
            for (int k = start; k <= end; k++)
                System.out.print(arr[k] + " ");
            System.out.println();
        }
    }
}
// Pattern to memorize: start→n, end→start..n → every window [start,end]
```

---

## 🧱 Level 2: You Hit the Wall — Max Sum Subarray

**Brute O(n³):** — TLE for n > 5,000

```java
int maxSum = arr[0];
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++) {
        int sum = 0;
        for (int k = i; k <= j; k++) sum += arr[k];  // ← 3rd loop = the bottleneck
        maxSum = Math.max(maxSum, sum);
    }
```

**Better O(n²):** Remove 3rd loop by accumulating

```java
int maxSum = arr[0];
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += arr[j];          // extend instead of recompute
        maxSum = Math.max(maxSum, sum);
    }
}
// Still O(n²) — TLE for n > 10⁵. Need something smarter.
```

---

## 🚀 GO LEARN — Techniques You Need

**STOP HERE — Learn these patterns, then return to "✅ Apply" below:**

| Technique          | When You Need It                        | Study File                                                                             |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------- |
| **Sliding Window** | Variable/fixed window on array          | 📖 [01_Sliding_Window.md](../../04_Patterns_Templates/01_Sliding_Window.md)               |
| **Two Pointers**   | Sorted array, pairs/triplets            | 📖 [07_Two_Pointers_Complete.md](../../04_Patterns_Templates/07_Two_Pointers_Complete.md) |
| **Prefix Sum**     | Sum queries, count subarrays with sum K | 📖 [04_Pattern_Recognition.md](../../04_Patterns_Templates/04_Pattern_Recognition.md)     |

⬅️ **RETURN CHECKPOINT** — Come back here and apply each below.

---

## ✅ Apply 1: Maximum Subarray Sum — Kadane's Algorithm O(n)

```
KEY INSIGHT: At every index ask ONE question:
"Extend previous subarray  OR  start fresh from here?"
  currentMax = max(arr[i],  currentMax + arr[i])
```

```java
public int maxSubarraySum(int[] arr) {
    int maxSum = arr[0], current = arr[0];
    for (int i = 1; i < arr.length; i++) {
        current = Math.max(arr[i], current + arr[i]);    // extend or restart
        maxSum  = Math.max(maxSum, current);
    }
    return maxSum;
}
// Time: O(n) | Space: O(1)
```

**Dry Run — `[-2,1,-3,4,-1,2,1,-5,4]`:**

```
i  arr[i]  current                   maxSum
0   -2     -2                         -2
1    1     max(1,  -2+1) = 1           1
2   -3     max(-3,  1-3) = -2          1
3    4     max(4,  -2+4) = 4           4
4   -1     max(-1,  4-1) = 3           4
5    2     max(2,   3+2) = 5           5
6    1     max(1,   5+1) = 6           6  ← ANSWER
7   -5     max(-5,  6-5) = 1           6
8    4     max(4,   1+4) = 5           6
Answer: 6  (subarray [4,-1,2,1])
```

📖 **LeetCode 53** — Maximum Subarray

---

## ✅ Apply 2: Count Subarrays with Sum = K

**Brute O(n²):**

```java
int count = 0;
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += arr[j];
        if (sum == k) count++;
    }
}
```

**Optimal O(n) — Prefix Sum + HashMap:**

```
INSIGHT: if prefixSum[j] - prefixSum[i] == k
         then subarray arr[i+1..j] has sum k
         Rearranged: prefixSum[i] = currentSum - k
         → For each position j, check if (currentSum - k) seen before in HashMap
```

```java
public int subarraySum(int[] arr, int k) {
    Map<Integer,Integer> freq = new HashMap<>();
    freq.put(0, 1);          // empty prefix has sum 0
    int count = 0, sum = 0;
    for (int x : arr) {
        sum += x;
        count += freq.getOrDefault(sum - k, 0);
        freq.merge(sum, 1, Integer::sum);
    }
    return count;
}
// Time: O(n) | Space: O(n)
```

🔗 **New to HashMap?** → 📖 [Go learn HashTable first](../01e_HashTable.md) then return here.

📖 **LeetCode 560** — Subarray Sum Equals K

---

## ✅ Apply 3: Smallest Subarray with Sum ≥ K — Sliding Window O(n)

```java
public int minSubarrayLen(int k, int[] arr) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
    for (int right = 0; right < arr.length; right++) {
        sum += arr[right];                                   // expand right
        while (sum >= k) {                                   // shrink left
            minLen = Math.min(minLen, right - left + 1);
            sum -= arr[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
// Time: O(n) — each element enters/exits window once
```

📖 **LeetCode 209** — Minimum Size Subarray Sum

---

## ✅ Apply 4: Maximum Product Subarray O(n)

```
GOTCHA: Negative × Negative = Positive!
Track BOTH max and min at each step.
```

```java
public int maxProduct(int[] arr) {
    int maxProd = arr[0], curMax = arr[0], curMin = arr[0];
    for (int i = 1; i < arr.length; i++) {
        if (arr[i] < 0) { int t = curMax; curMax = curMin; curMin = t; }
        curMax  = Math.max(arr[i], curMax * arr[i]);
        curMin  = Math.min(arr[i], curMin * arr[i]);
        maxProd = Math.max(maxProd, curMax);
    }
    return maxProd;
}
```

📖 **LeetCode 152** — Maximum Product Subarray

---

## 🎯 Problem Set — Sub Arrays

| #   | Problem                            | Platform | Difficulty  | Key Technique        |
| --- | ---------------------------------- | -------- | ----------- | -------------------- |
| 1   | LC 53 — Maximum Subarray           | LeetCode | ⭐⭐ Med    | Kadane's             |
| 2   | LC 560 — Subarray Sum Equals K     | LeetCode | ⭐⭐ Med    | Prefix Sum + HashMap |
| 3   | LC 209 — Min Size Subarray Sum     | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 4   | LC 152 — Max Product Subarray      | LeetCode | ⭐⭐ Med    | Track max+min        |
| 5   | LC 1004 — Max Consecutive Ones III | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 6   | LC 713 — Subarray Product < K      | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 7   | LC 76 — Minimum Window Substring   | LeetCode | ⭐⭐⭐ Hard | Sliding Window       |

## 🧠 Pattern Fingerprint — Sub Arrays

**See these words → use this technique:**

| If the problem says... | Use |
| ---------------------- | --- |
| "contiguous" + "max/min sum" | Kadane's O(n) |
| "subarray sum equals K" | Prefix Sum + Map |
| "smallest/min window" + "sum ≥ K" | Sliding Window |
| "fixed window size K" | Fixed S.Window |
| "all subarrays" | 2 nested loops |
| "product" instead of sum | Track max + min |

## 📅 Revisit Tracker

- **Day 3:** Redo LC 53 + LC 209 from memory (no hints)
- **Day 7:** Redo LC 560 (Prefix Sum + HashMap) + LC 713

---

[← Foundation Practice — Build Array Muscle…](02_foundation_practice_build_array_muscle_memory.md) | [Chapter overview](../01b_Arrays.md) | [Sub Sequences — Order Without Contiguity →](04_sub_sequences_order_without_contiguity.md)
