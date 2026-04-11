#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Expand 01b_Arrays.md with JIT learning flow:
Theory → Brute Force → Hit Wall → GO LEARN → Return → Apply → Problems → Pattern Fingerprint
"""

import os

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"
ARRAYS_FILE = os.path.join(BASE, "02_Data_Structures", "01b_Arrays.md")

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content)
    print(f"✅ Written: {path}")

def insert_before(text, marker, new_content):
    pos = text.find(marker)
    if pos == -1:
        print(f"⚠️  Marker not found: {repr(marker[:60])}")
        return text
    return text[:pos] + new_content + text[pos:]

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Basic Practice Questions  (goes BEFORE Two Sum section)
# ─────────────────────────────────────────────────────────────────────────────
BASIC_QUESTIONS = r"""
---

## 🏋️ Part 3: Foundation Practice — Build Array Muscle Memory

> 💡 **Learning path:** Walk through these before touching patterns.
> They train your loop instincts and set up every concept that follows.

### 📦 Group A — Traversal Basics

**Q1 — Declare & Print**
```java
int[] arr = {10, 20, 30, 40, 50};
for (int i = 0; i < arr.length; i++)
    System.out.print(arr[i] + " ");   // 10 20 30 40 50
```

**Q2 — Read From User**
```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
```

**Q3 — Print Even Numbers** — O(n) time, O(1) space *(already optimal — must inspect each element)*
```java
for (int x : arr) if (x % 2 == 0) System.out.print(x + " ");
```

**Q4 — Sum of Odd Numbers**
```java
int sum = 0;
for (int x : arr) if (x % 2 != 0) sum += x;
```

**Q5 — Average of All Elements**
```java
int sum = 0;
for (int x : arr) sum += x;
double avg = (double) sum / arr.length;
```

**Q6 — Print in Reverse** *(just print, don't rearrange)*
```java
for (int i = arr.length - 1; i >= 0; i--)
    System.out.print(arr[i] + " ");
// {11,34,67} → 67 34 11
```

**Q7 — Sum of First + Last**
```java
int result = arr[0] + arr[arr.length - 1];
```

**Q8 — Swap Every Two Adjacent Elements**
```
Input:  {8,7,5,1,5,2,6}
Output: {7,8,1,5,2,5,6}     ← pairs (0,1),(2,3),(4,5) swapped
```
```java
for (int i = 0; i + 1 < arr.length; i += 2) {
    int tmp = arr[i]; arr[i] = arr[i+1]; arr[i+1] = tmp;
}
```

**Q9 — Print Alternative Elements**
```java
for (int i = 0; i < arr.length; i += 2)
    System.out.print(arr[i] + " ");
```

**Q10 — Sum Up to Index K** *(prefix sum preview!)*
```java
int k = 3, sum = 0;
for (int i = 0; i <= k; i++) sum += arr[i];
```
> 💡 **Noticing something?** If you need this for many K values, you'd recompute every time = O(n) per query.
> **Prefix Sum** (coming in Part 13) makes it O(1) per query after O(n) build. 🔗 [Jump ahead to Prefix Sum](#-pattern-connections-hub)

---

### 📦 Group B — Min / Max First Look

**Q11 — Find Biggest Element**
```java
int max = arr[0];
for (int x : arr) if (x > max) max = x;
// Time: O(n) — OPTIMAL (must look at every element at least once)
```

**Q12 — Find Smallest Element**
```java
int min = arr[0];
for (int x : arr) if (x < min) min = x;
```

**Q13 — Find Second Highest**
```
Brute: Sort descending → arr[1]   O(n log n)
Better: Two-variable single pass   O(n) ← PREFERRED
```
```java
int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
for (int x : arr) {
    if (x > first)       { second = first; first = x; }
    else if (x > second) { second = x; }
}
// second holds the 2nd largest
```

---

### 📦 Group C — Pairs & Two Arrays

**Q14 — All Pairs Summing to K** *(Two Sum brute force)*
```
Input: {4,6,18,10,14,2}, target=20
Output: {6,14}, {18,2}
```
```java
// Brute: O(n²)
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (arr[i] + arr[j] == k)
            System.out.println("{" + arr[i] + "," + arr[j] + "}");
```
> 🧱 **You hit the wall here** — for n = 10⁶ this is 10¹² operations.
> → **HashMap reduces this to O(n)**. You'll apply that after Part 9 (HashMap).

**Q15 — Merge Two Arrays**
```java
int[] a = {1,2,3}, b = {10,20,30};
int[] merged = new int[a.length + b.length];
for (int i = 0; i < a.length; i++) merged[i] = a[i];
for (int i = 0; i < b.length; i++) merged[a.length + i] = b[i];
```

**Q16 — Common Elements in Two Arrays** *(brute O(n·m))*
```java
for (int x : a)
    for (int y : b)
        if (x == y) System.out.print(x + " ");
// Optimal with HashSet: O(n+m) — see Part 9
```

---

### 🎯 Practice Problems — Foundation Level

| Problem | Platform | Difficulty | Concept |
|---------|----------|------------|---------|
| LC 1929 — Concatenation of Array | LeetCode | ⭐ Easy | Array build |
| LC 2011 — Final Value of Operations | LeetCode | ⭐ Easy | Traversal |
| LC 1512 — Number of Good Pairs | LeetCode | ⭐ Easy | Nested loops |
| CF 4A — Watermelon | Codeforces | Div2-A | Simple math |
| CF 158A — Next Round | Codeforces | Div2-A | Linear scan |

> 🌟 **Goal:** Solve all 5 before moving to Sub Arrays. These cement your loop instincts.

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Sub Arrays (Part 4)
# ─────────────────────────────────────────────────────────────────────────────
SUB_ARRAYS = r"""
---

## 🔲 Part 4: Sub Arrays — From Brute Force to Mastery

> 🎯 **This is where the most important array algorithms live.**
> You'll hit walls here that force you to learn Sliding Window, Two Pointers, and Prefix Sum.

### 📖 Theory — What is a Sub Array?

```
Input: {1, 2, 3}
All sub-arrays:
  Length 1: {1}    {2}    {3}
  Length 2: {1,2}  {2,3}
  Length 3: {1,2,3}
  Total: n*(n+1)/2 = 3*4/2 = 6

KEY PROPERTIES:
  ✅ Contiguous  ← elements must be adjacent
  ✅ Order preserved
  ✅ Non-empty

vs Sub-sequence: {1,3} from {1,2,3} → ✅ valid subsequence, ❌ NOT a subarray
```

> ❓ **Quick Check:** How many sub-arrays in `{1,2,3,4,5}`?
> → 5×6/2 = **15**

---

### 🔵 Level 1: Enumerate All Sub Arrays

```java
// Time: O(n²) enumerate  |  O(n³) if printing each
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
// Pattern: start→n, end→start..n gives every window [start,end]
```

---

### 🧱 Level 2: You Hit the Wall

**Goal:** Find the maximum sum subarray.

```java
// Brute O(n³) — TLE for n > 5000
int maxSum = arr[0];
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++) {
        int sum = 0;
        for (int k = i; k <= j; k++) sum += arr[k];  // ← bottleneck
        maxSum = Math.max(maxSum, sum);
    }
```

**Step 2 — Remove 3rd loop: O(n²)**
```java
int maxSum = arr[0];
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += arr[j];          // extend instead of recompute
        maxSum = Math.max(maxSum, sum);
    }
}
// Still O(n²) — TLE for n > 10⁵
```

---

### 🚀 GO LEARN — Techniques You Need

> **STOP HERE** — Learn these, then come back to "✅ Apply" below:
>
> | Technique | Used For | Study Link |
> |-----------|----------|------------|
> | **Sliding Window** | Variable/fixed window problems | 📖 [01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md) |
> | **Two Pointers** | Sorted arrays, pairs/triplets | 📖 [07_Two_Pointers_Complete.md](../04_Patterns_Templates/07_Two_Pointers_Complete.md) |
> | **Prefix Sum** | Sum queries, count subarrays | 📖 [04_Pattern_Recognition.md — Pattern 1](../04_Patterns_Templates/04_Pattern_Recognition.md) |
>
> ⬅️ **RETURN CHECKPOINT** — Apply each below after studying.

---

### ✅ Apply 1: Maximum Subarray Sum — Kadane's Algorithm O(n)

```
KEY INSIGHT — At every index ask:
  "Extend previous subarray  OR  start fresh here?"
  currentMax = max(arr[i],  currentMax + arr[i])
```

```java
public int maxSubarraySum(int[] arr) {
    int maxSum = arr[0], current = arr[0];
    for (int i = 1; i < arr.length; i++) {
        current = Math.max(arr[i], current + arr[i]);   // extend or restart
        maxSum  = Math.max(maxSum, current);
    }
    return maxSum;
}
// Time: O(n) | Space: O(1)
```

**Dry Run — `[-2,1,-3,4,-1,2,1,-5,4]`:**
```
i  arr[i]  current                  maxSum
0   -2     -2                        -2
1    1     max(1,  -2+1)  = 1         1
2   -3     max(-3,  1-3)  = -2        1
3    4     max(4,  -2+4)  = 4         4
4   -1     max(-1,  4-1)  = 3         4
5    2     max(2,   3+2)  = 5         5
6    1     max(1,   5+1)  = 6         6  ← answer
7   -5     max(-5,  6-5)  = 1         6
8    4     max(4,   1+4)  = 5         6
Maximum subarray [4,-1,2,1] = 6
```

> 📖 **LeetCode 53** — Maximum Subarray *(Easy/Medium)*

---

### ✅ Apply 2: Count Subarrays with Sum = K

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
INSIGHT: if prefixSum[j] - prefixSum[i-1] == k
         then subarray arr[i..j] has sum k
         → we need prefixSum[i-1] = currentSum - k
         → check HashMap for (currentSum - k)
```
```java
public int subarraySum(int[] arr, int k) {
    Map<Integer,Integer> freq = new HashMap<>();
    freq.put(0, 1);          // empty prefix
    int count = 0, sum = 0;
    for (int x : arr) {
        sum += x;
        count += freq.getOrDefault(sum - k, 0);
        freq.merge(sum, 1, Integer::sum);
    }
    return count;
}
// Time: O(n) | Space: O(n)
// → Need HashMap? 📖 Go learn: 01e_HashTable.md then return here
```

> 📖 **LeetCode 560** — Subarray Sum Equals K *(Medium)*

---

### ✅ Apply 3: Minimum Length Subarray with Sum ≥ K — Sliding Window

```java
public int minSubarrayLen(int k, int[] arr) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
    for (int right = 0; right < arr.length; right++) {
        sum += arr[right];                                  // expand right
        while (sum >= k) {                                  // shrink left
            minLen = Math.min(minLen, right - left + 1);
            sum -= arr[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
// Time: O(n) | Space: O(1)  — each element enters/exits window once
```

> 📖 **LeetCode 209** — Minimum Size Subarray Sum *(Medium)*

---

### ✅ Apply 4: Maximum Product Subarray

```
GOTCHA: Negative × Negative = Positive!
Track BOTH max and min at each step.
```
```java
public int maxProduct(int[] arr) {
    int maxProd = arr[0], curMax = arr[0], curMin = arr[0];
    for (int i = 1; i < arr.length; i++) {
        if (arr[i] < 0) { int t = curMax; curMax = curMin; curMin = t; }
        curMax = Math.max(arr[i], curMax * arr[i]);
        curMin = Math.min(arr[i], curMin * arr[i]);
        maxProd = Math.max(maxProd, curMax);
    }
    return maxProd;
}
// Time: O(n) | Space: O(1)
```

> 📖 **LeetCode 152** — Maximum Product Subarray *(Medium)*

---

### 🎯 Problem Set — Sub Arrays

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | LC 53 — Maximum Subarray | LeetCode | ⭐⭐ Med | Kadane's |
| 2 | LC 560 — Subarray Sum Equals K | LeetCode | ⭐⭐ Med | Prefix Sum + HashMap |
| 3 | LC 209 — Min Size Subarray Sum | LeetCode | ⭐⭐ Med | Sliding Window |
| 4 | LC 152 — Max Product Subarray | LeetCode | ⭐⭐ Med | Track max+min |
| 5 | LC 1004 — Max Consecutive Ones III | LeetCode | ⭐⭐ Med | Sliding Window |
| 6 | LC 713 — Subarray Product < K | LeetCode | ⭐⭐ Med | Sliding Window |
| 7 | CF 1B — Spreadsheets | Codeforces | Div2-B | Window logic |
| 8 | LC 76 — Minimum Window Substring | LeetCode | ⭐⭐⭐ Hard | Sliding Window |

---

### 🧠 Pattern Fingerprint — Sub Arrays

```
SEE THESE WORDS → THINK THIS PATTERN:
┌─────────────────────────────────────────────────────────┐
│ "contiguous subarray + max/min sum"    → Kadane's       │
│ "subarray + sum equals K"              → Prefix Sum+Map  │
│ "smallest subarray + sum ≥ K"         → Sliding Window  │
│ "fixed window of size K"              → Fixed S.Window  │
│ "all subarrays"                       → 2 nested loops  │
│ "product instead of sum"              → Track max+min   │
└─────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker
- **Day 3:** Redo LC 53 (Kadane's) + LC 209 (Sliding Window) from memory
- **Day 7:** Redo LC 560 (Prefix Sum + HashMap) + LC 713 without hints

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Sub Sequences (Part 5)
# ─────────────────────────────────────────────────────────────────────────────
SUB_SEQUENCES = r"""
---

## 🌿 Part 5: Sub Sequences — Order Without Contiguity

### 📖 Theory — What is a Sub Sequence?

```
Input: {1, 2, 3}
All subsequences (2ⁿ - 1 = 7):
  {1}  {2}  {3}  {1,2}  {1,3}  {2,3}  {1,2,3}

KEY PROPERTY:
  ✅ Order preserved
  ✅ Gaps allowed  ← THIS is the difference from subarray
  ✅ Non-empty

COMPARISON:
  Array:       {1, 2, 3, 4, 5}
  Subarray:    {2, 3, 4}   ← contiguous slice
  Subsequence: {1, 3, 5}   ← pick any elements, keeping order
```

> ❓ **Quick Check:** How many subsequences in `{1,2,3,4}`?
> → 2⁴ - 1 = **15**

---

### 🔵 Level 1: Generate All Subsequences — The Include/Exclude Paradigm

```
IDEA: For each element, you have exactly 2 choices:
  ① INCLUDE it in the current subsequence
  ② EXCLUDE it

This creates a binary decision tree with 2ⁿ leaves.
```

```
{1,2,3}
        []
       /    \
    Include 1  Exclude 1
     [1]         []
    /   \        / \
  [1,2] [1]   [2]  []
  /  \  / \   / \  / \
[1,2,3][1,2][2,3][2][3][]
```

---

### 🚀 GO LEARN — Recursion (You Need This First)

> **STOP** — Subsequence generation uses recursion. Learn it first:
>
> 📖 [03_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md)
> 📖 [03_Recursion_Advanced.md — Subsets section](../03_Algorithms/03c_Recursion_Advanced.md)
>
> ⬅️ **RETURN CHECKPOINT** — Come back and write the code below.

---

### ✅ Apply 1: Print All Subsequences (Recursion)

```java
// Time: O(2ⁿ) — unavoidable (2ⁿ subsequences exist)
// Space: O(n) recursion depth
public void printSubsequences(int[] arr, int index, List<Integer> current) {
    if (index == arr.length) {
        if (!current.isEmpty())
            System.out.println(current);
        return;
    }
    // INCLUDE arr[index]
    current.add(arr[index]);
    printSubsequences(arr, index + 1, current);

    // EXCLUDE arr[index]
    current.remove(current.size() - 1);
    printSubsequences(arr, index + 1, current);
}
// Call: printSubsequences(arr, 0, new ArrayList<>());
```

---

### ✅ Apply 2: Count Subsequences with Sum = K

```java
// Time: O(2ⁿ) brute | can optimize with DP
public int countSubseqWithSum(int[] arr, int index, int target) {
    if (target == 0) return 1;
    if (index == arr.length || target < 0) return 0;
    // Include or exclude
    return countSubseqWithSum(arr, index + 1, target - arr[index])
         + countSubseqWithSum(arr, index + 1, target);
}
```

---

### ✅ Apply 3: Longest Increasing Subsequence (LIS)

```
Example: {10, 9, 2, 5, 3, 7, 101, 18}
LIS:     {2, 3, 7, 101}   length = 4
```

**Layer 1 — Brute O(2ⁿ):** Generate all subsequences, keep longest increasing one.

**Layer 2 — DP O(n²):**
```java
public int lisDP(int[] arr) {
    int n = arr.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);          // every element is LIS of length 1
    int max = 1;
    for (int i = 1; i < n; i++)
        for (int j = 0; j < i; j++)
            if (arr[j] < arr[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
                max   = Math.max(max, dp[i]);
            }
    return max;
}
// Time: O(n²) | Space: O(n)
```

**Layer 3 — Binary Search O(n log n):**
```java
public int lisOptimal(int[] arr) {
    List<Integer> tails = new ArrayList<>();
    for (int x : arr) {
        int pos = Collections.binarySearch(tails, x);
        if (pos < 0) pos = -(pos + 1);
        if (pos == tails.size()) tails.add(x);
        else tails.set(pos, x);
    }
    return tails.size();
    // tails is NOT the actual LIS — just its length!
}
// Time: O(n log n) | Space: O(n)
// → Uses Binary Search: 📖 04_Patterns_Templates/06_Binary_Search_Patterns.md
```

> ❓ **Think:** Why does replacing with a smaller value work? Because a smaller tail leaves more room for future elements to extend the sequence.

---

### ✅ Apply 4: Longest Common Subsequence (LCS)

```
str1 = "ABCBDAB"   str2 = "BDCABA"
LCS  = "BCBA"  or  "BDAB"  length = 4
```

```java
// DP: O(m*n) time and space
public int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}
// → DP foundation: 📖 03_Algorithms/04b_DP_Fundamentals.md
```

---

### 🎯 Problem Set — Sub Sequences

| # | Problem | Platform | Difficulty | Technique |
|---|---------|----------|------------|-----------|
| 1 | LC 78 — Subsets | LeetCode | ⭐⭐ Med | Recursion / Bitmask |
| 2 | LC 300 — LIS | LeetCode | ⭐⭐ Med | DP O(n²) → BinSearch O(n log n) |
| 3 | LC 1143 — LCS | LeetCode | ⭐⭐ Med | 2D DP |
| 4 | LC 416 — Partition Equal Subset Sum | LeetCode | ⭐⭐ Med | Subset-sum DP |
| 5 | LC 1035 — Uncrossed Lines | LeetCode | ⭐⭐ Med | LCS in disguise |
| 6 | CF 1B — Spreadsheets | Codeforces | Div2-B | Subsequence logic |

---

### 🧠 Pattern Fingerprint — Sub Sequences

```
SEE THESE WORDS → THINK THIS PATTERN:
┌──────────────────────────────────────────────────────────┐
│ "all subsequences / subsets"          → Recursion 2ⁿ    │
│ "longest increasing subsequence"      → DP + BinSearch  │
│ "longest common subsequence"          → 2D DP            │
│ "count subsequences with sum"         → Recursion / DP  │
│ "not necessarily contiguous"          → SUBSEQUENCE!     │
└──────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker
- **Day 3:** Redo LC 78 (Subsets) + LC 300 (LIS DP) from memory
- **Day 7:** Redo LC 300 using binary search approach

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Searching (Part 6)
# ─────────────────────────────────────────────────────────────────────────────
SEARCHING = r"""
---

## 🔎 Part 6: Searching in Arrays

### Linear Search — O(n)
```java
// Use when: unsorted, small n, or searching once
public int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++)
        if (arr[i] == target) return i;
    return -1;
}
```

### Binary Search — O(log n) *(array MUST be sorted)*
```java
// Use when: sorted array, searching many times
public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;   // avoids int overflow
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
// For n=1,000,000: Linear = 1M steps. Binary = 20 steps!
```

> 📖 **GO DEEPER** — Binary Search has many variants (lower bound, upper bound, on answer):
> 📖 [06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md)

| | Linear Search | Binary Search |
|---|---|---|
| Array must be sorted? | ❌ No | ✅ Yes |
| Time | O(n) | O(log n) |
| Use when | Unsorted, search once | Sorted, search many times |

### 🎯 Problems
| Problem | Pattern |
|---------|---------|
| LC 704 — Binary Search | Classic binary search |
| LC 35 — Search Insert Position | Lower bound variant |
| LC 33 — Search in Rotated Array | Modified binary search |

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Sorting (Part 7)
# ─────────────────────────────────────────────────────────────────────────────
SORTING = r"""
---

## 📈 Part 7: Sorting Algorithms — All 5 You Must Know

> 🔗 **Deep dive on Quick Sort + Merge Sort:** [02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md)

### 1. Bubble Sort — O(n²)
```
Idea: Compare adjacent pairs, bubble largest to end each pass.
Best case: O(n) if already sorted (with optimization flag).
```
```java
public void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
                swapped = true;
            }
        if (!swapped) break;   // already sorted — O(n) best case
    }
}
```

### 2. Selection Sort — O(n²) always
```
Idea: Find minimum in unsorted portion, swap to front.
Never makes more than n-1 swaps — good when writes are expensive.
```
```java
public void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i+1; j < n; j++)
            if (arr[j] < arr[minIdx]) minIdx = j;
        int tmp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = tmp;
    }
}
```

### 3. Insertion Sort — O(n²) worst, O(n) best
```
Idea: Build sorted portion left-to-right, insert each element in correct position.
BEST sort for nearly-sorted arrays — only O(n) for almost-sorted input!
```
```java
public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j+1] = arr[j];   // shift right
            j--;
        }
        arr[j+1] = key;
    }
}
```

### 4. Merge Sort — O(n log n) always, Stable
```
Idea: Divide array in half, sort each half, merge.
Guaranteed O(n log n) — preferred when stability needed.
Extra space: O(n)
```
```java
public void mergeSort(int[] arr, int l, int r) {
    if (l >= r) return;
    int mid = l + (r - l) / 2;
    mergeSort(arr, l, mid);
    mergeSort(arr, mid+1, r);
    merge(arr, l, mid, r);
}
private void merge(int[] arr, int l, int mid, int r) {
    int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
    int i = 0, j = mid - l + 1, k = l;
    while (i <= mid - l && j <= r - l)
        arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
    while (i <= mid - l) arr[k++] = tmp[i++];
    while (j <= r - l)   arr[k++] = tmp[j++];
}
```

### 5. Quick Sort — O(n log n) avg, O(n²) worst
```
Idea: Pick pivot, partition around it, recursively sort partitions.
Average: O(n log n) | Worst (sorted input + bad pivot): O(n²)
In-place — no extra memory.
```
```java
public void quickSort(int[] arr, int low, int high) {
    if (low >= high) return;
    int pivotIdx = partition(arr, low, high);
    quickSort(arr, low, pivotIdx - 1);
    quickSort(arr, pivotIdx + 1, high);
}
private int partition(int[] arr, int low, int high) {
    int pivot = arr[high], i = low - 1;
    for (int j = low; j < high; j++)
        if (arr[j] <= pivot) { i++; int t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    int t = arr[i+1]; arr[i+1] = arr[high]; arr[high] = t;
    return i + 1;
}
```

### Comparison Table

| Sort | Best | Average | Worst | Space | Stable | Use When |
|------|------|---------|-------|-------|--------|----------|
| Bubble | O(n) | O(n²) | O(n²) | O(1) | ✅ | Teaching only |
| Selection | O(n²) | O(n²) | O(n²) | O(1) | ❌ | Min writes needed |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | ✅ | Nearly sorted / small n |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | Need guaranteed O(n log n) |
| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | General purpose, in-place |

> 📖 **Deep dive (Dutch National Flag, 3-way partition, TimSort):**
> [02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md)

### 🎯 Problems
| Problem | Sort Technique |
|---------|----------------|
| LC 912 — Sort an Array | Implement merge sort / quick sort |
| LC 75 — Sort Colors | Dutch National Flag (3-way partition) |
| LC 1636 — Sort Array by Frequency | Custom comparator |
| LC 56 — Merge Intervals | Sort by start time |

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Frequency & Duplicates (Part 8)
# ─────────────────────────────────────────────────────────────────────────────
FREQUENCY = r"""
---

## 📊 Part 8: Frequency & Duplicates

### 🔵 Level 1: Brute Force — Nested Loops O(n²)

```java
// Count frequency of each element
for (int i = 0; i < n; i++) {
    int freq = 0;
    for (int j = 0; j < n; j++)
        if (arr[j] == arr[i]) freq++;
    // arr[i] appears freq times
    // Problem: counts same element multiple times!
}
```

### 🧱 Hit the Wall — Loops on loops on loops
Finding most repeated, least repeated, duplicates: all O(n²) with nested loops.
**For n = 10⁶ → 10¹² operations. Completely unusable.**

---

### 🚀 GO LEARN — HashMap

> **STOP** — The O(n) solution for ALL frequency problems uses HashMap.
>
> 📖 [Go Learn: HashTable](01e_HashTable.md)
> Focus on: `put`, `get`, `getOrDefault`, `containsKey`, `entrySet`
>
> ⬅️ **RETURN CHECKPOINT** — Apply HashMap below.

---

### ✅ Apply: Frequency Array using HashMap O(n)

```java
Map<Integer,Integer> freq = new HashMap<>();
for (int x : arr)
    freq.merge(x, 1, Integer::sum);   // freq[x]++

// Most repeated element:
int maxFreq = 0, mostRepeated = -1;
for (Map.Entry<Integer,Integer> e : freq.entrySet())
    if (e.getValue() > maxFreq) { maxFreq = e.getValue(); mostRepeated = e.getKey(); }

// Count unique elements:
int uniques = freq.size();

// Count duplicates (elements appearing more than once):
long duplicates = freq.values().stream().filter(v -> v > 1).count();
```

### Loop Patterns for Frequency

```java
// Include right loop (expand from left)
for (int right = 0; right < n; right++) { /* process arr[right] */ }

// Include both loops (shrink window)
for (int left = 0, right = 0; right < n; right++) {
    // expand right
    while (/* condition */) { /* shrink left */ left++; }
}

// Only right loop (cumulative)
int runningFreq = 0;
for (int x : arr) { runningFreq++; /* update */ }
```

### ✅ Common Elements in Two Arrays — HashSet O(n+m)

```java
Set<Integer> setA = new HashSet<>();
for (int x : a) setA.add(x);
for (int x : b)
    if (setA.contains(x)) System.out.print(x + " ");
// vs brute O(n*m) nested loops
```

### ✅ LCM / GCD of Array Elements

```java
// GCD using Euclidean algorithm: O(log min(a,b))
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
int lcm(int a, int b) { return a / gcd(a,b) * b; }

// GCD of entire array
int arrGcd = arr[0];
for (int i = 1; i < n; i++) arrGcd = gcd(arrGcd, arr[i]);

// LCM of entire array
int arrLcm = arr[0];
for (int i = 1; i < n; i++) arrLcm = lcm(arrLcm, arr[i]);

// LCM of odd numbers only
int oddLcm = 1;
for (int x : arr) if (x % 2 != 0) oddLcm = lcm(oddLcm, x);
```

### 🎯 Problems
| Problem | Pattern |
|---------|---------|
| LC 1 — Two Sum | HashMap complement |
| LC 242 — Valid Anagram | Frequency count |
| LC 347 — Top K Frequent Elements | Freq + Heap |
| LC 128 — Longest Consecutive Sequence | HashSet O(n) |
| CF 4C — Registration System | HashMap counting |

### 🧠 Pattern Fingerprint

```
SEE THESE WORDS → THINK THIS PATTERN:
┌──────────────────────────────────────────────────────────┐
│ "most/least frequent element"      → HashMap + max track │
│ "count occurrences"                → HashMap freq count  │
│ "find duplicate"                   → HashSet or sorting  │
│ "two arrays, common elements"      → HashSet O(n+m)      │
│ "O(1) lookup by value"             → HashMap             │
└──────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker
- **Day 3:** Redo LC 1 (Two Sum HashMap) + LC 242 (Anagram)
- **Day 7:** Redo LC 128 (Consecutive Sequence — HashSet O(n))

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Circular Arrays (Part 9)
# ─────────────────────────────────────────────────────────────────────────────
CIRCULAR = r"""
---

## 🔄 Part 9: Circular Arrays & Rotations

### Theory

```
A circular array treats the end as connected to the start.
Input: {1,2,3}
Circular rotations:
  {1,2,3}   (original)
  {2,3,1}   (rotate left by 1)
  {3,1,2}   (rotate left by 2)
```

### Print All Circular Rotations
```java
public void printCircularRotations(int[] arr) {
    int n = arr.length;
    for (int rotate = 0; rotate < n; rotate++) {
        for (int i = 0; i < n; i++)
            System.out.print(arr[(rotate + i) % n] + " ");  // modulo is key!
        System.out.println();
    }
}
// Time: O(n²) — unavoidable if printing all
```

### Rotate Array Left by K — O(n)
```java
// Method 1: Extra array
public int[] rotateLeft(int[] arr, int k) {
    int n = arr.length;
    k = k % n;    // handle k > n
    int[] result = new int[n];
    for (int i = 0; i < n; i++)
        result[i] = arr[(i + k) % n];
    return result;
}

// Method 2: Reverse trick — O(n) time, O(1) space
public void rotateLeftInPlace(int[] arr, int k) {
    int n = arr.length;
    k = k % n;
    reverse(arr, 0, k - 1);       // reverse first k
    reverse(arr, k, n - 1);       // reverse rest
    reverse(arr, 0, n - 1);       // reverse all
}
// {1,2,3,4,5}, k=2 → {3,4,5,1,2}
```

### 🎯 Problems
| Problem | Pattern |
|---------|---------|
| LC 189 — Rotate Array | Reverse trick |
| LC 153 — Find Min in Rotated Array | Binary search |
| LC 918 — Max Sum Circular Subarray | Kadane's + circular trick |

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Recursion in Arrays (Part 10)
# ─────────────────────────────────────────────────────────────────────────────
RECURSION_ARRAYS = r"""
---

## 🌀 Part 10: Recursion in Arrays

> 📖 **GO LEARN Recursion first if new:**
> [03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md)
> ⬅️ Return here to apply it to arrays.

### Recursive Sum
```java
public int sum(int[] arr, int n) {
    if (n == 0) return 0;                       // base case
    return arr[n-1] + sum(arr, n-1);           // recursive case
}
// Each call reduces n by 1 → n stack frames → O(n) time, O(n) space
```

### Recursive Linear Search
```java
public int search(int[] arr, int n, int target) {
    if (n == 0) return -1;
    if (arr[n-1] == target) return n-1;
    return search(arr, n-1, target);
}
```

### Recursive Reverse
```java
public void reverse(int[] arr, int left, int right) {
    if (left >= right) return;                  // base: pointers crossed
    int tmp = arr[left]; arr[left] = arr[right]; arr[right] = tmp;
    reverse(arr, left+1, right-1);             // recurse inward
}
```

### Recursive Binary Search
```java
public int binarySearch(int[] arr, int left, int right, int target) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) return binarySearch(arr, mid+1, right, target);
    return binarySearch(arr, left, mid-1, target);
}
// Recurrence: T(n) = T(n/2) + O(1) → O(log n)
```

> 🧠 **Recursion in arrays → often the brute force for Sub Sequences and Sub Sets.**
> DP is usually the optimization: recursion + memoization.

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION: Pattern Connections Hub (Part 11)
# ─────────────────────────────────────────────────────────────────────────────
PATTERN_HUB = r"""
---

## ⚡ Part 11: Pattern Connections Hub

> **Master table:** Array concept → Pattern to use → File to study → LeetCode examples

| Array Concept | Pattern | DS Used | Study File | Example Problems |
|---------------|---------|---------|------------|-----------------|
| Max/min subarray sum | **Kadane's** | Variables | [04_Pattern_Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md) | LC 53 |
| Subarray sum = K | **Prefix Sum + HashMap** | HashMap | [04_Pattern_Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md) | LC 560 |
| Min window subarray | **Sliding Window** | Two pointers | [01_Sliding_Window](../04_Patterns_Templates/01_Sliding_Window.md) | LC 209, 76 |
| Pairs with sum K | **Two Pointers** (sorted) or **HashMap** | Array / Map | [07_Two_Pointers](../04_Patterns_Templates/07_Two_Pointers_Complete.md) | LC 1, 167 |
| All subsequences/subsets | **Recursion / Backtracking** | Call stack | [03c_Recursion_Advanced](../03_Algorithms/03c_Recursion_Advanced.md) | LC 78, 90 |
| LIS / LCS | **DP** | 1D/2D array | [04b_DP_Fundamentals](../03_Algorithms/04b_DP_Fundamentals.md) | LC 300, 1143 |
| Frequency / count | **HashMap** | HashMap | [01e_HashTable](01e_HashTable.md) | LC 1, 347 |
| Find in sorted | **Binary Search** | Two pointers | [06_Binary_Search_Patterns](../04_Patterns_Templates/06_Binary_Search_Patterns.md) | LC 704, 33 |
| kth largest | **Heap / QuickSelect** | PriorityQueue | [01f_Trees_Heaps](01f_Trees_Heaps.md) | LC 215 |
| 3 groups (0,1,2) | **Dutch National Flag** | Two pointers | [02a_Sorting_Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md) | LC 75 |

### 🧠 Master Pattern Recognition — Array Keywords

```
"contiguous subarray" + "sum/max/min"  → Sliding Window or Kadane's
"subarray" + "sum equals K"            → Prefix Sum + HashMap
"subsequence"                          → Recursion or DP
"pairs/triplets" + "sum"               → Two Pointers (sort first) or HashMap
"sorted array" + "search"              → Binary Search
"frequency" + "count"                  → HashMap
"rotate" / "circular"                  → Modulo arithmetic
"kth largest/smallest"                 → Min-Heap size k
"all possible" / "generate"            → Recursion / Backtracking
```

---

"""

# ─────────────────────────────────────────────────────────────────────────────
# Main: Apply all insertions
# ─────────────────────────────────────────────────────────────────────────────
def main():
    content = read_file(ARRAYS_FILE)
    print(f"Original file: {len(content.splitlines())} lines")

    # Insertion 1: Basic Questions before the Two Sum section
    MARKER_1 = "## 🎯 LeetCode Problems → Real-World Connection"
    content = insert_before(content, MARKER_1, BASIC_QUESTIONS)

    # Insertion 2: All major sections before Cross-References
    MARKER_2 = "### 🔗 Cross-References — Navigate the Ecosystem"
    new_sections = (
        SUB_ARRAYS +
        SUB_SEQUENCES +
        SEARCHING +
        SORTING +
        FREQUENCY +
        CIRCULAR +
        RECURSION_ARRAYS +
        PATTERN_HUB
    )
    content = insert_before(content, MARKER_2, new_sections)

    write_file(ARRAYS_FILE, content)
    print(f"Updated file: {len(content.splitlines())} lines")
    print("✅ Arrays.md expansion complete!")

if __name__ == "__main__":
    main()
