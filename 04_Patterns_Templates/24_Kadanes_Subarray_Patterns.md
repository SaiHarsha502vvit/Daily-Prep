**Navigation**: [< Previous](23_Knapsack_Family.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](25_Constraint_Based_Pattern_Selection.md)

# Kadane's Algorithm & Subarray Patterns — Complete Guide

**WHY this pattern?** The family of "contiguous subarray optimization" problems is one of the most frequently tested categories in interviews. Kadane's Algorithm is the foundational O(N) technique that underpins all of them. Understanding **why** it works — not just how — separates 3+ YOE engineers from juniors.

> 📖 **Cross-Reference Navigator:**
> - 🧠 **How to Think:** [Array & String Thinking — Part 4: Prefix/Kadane](../14_Mental_Models/04_Array_String_Thinking.md#part-4-prefix-sum--kadane) | [Optimization Pipeline — Kadane Example](../14_Mental_Models/14_Optimization_Pipeline.md#example-2-maximum-subarray-sum-lc-53) | [Greedy vs DP](../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
> - 📐 **Related Patterns:** [Prefix Sum/XOR](../03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) | [Sliding Window](09_Array_Plus_SlidingWindow.md) | [DP Patterns](16_DP_Pattern_Recognition.md)
> - 📚 **Theory:** [Arrays DS](../02_Data_Structures/01b_Arrays.md)

### ⚠️ Constraint Lens

| Given Constraints | Do This |
|-------------------|---------|
| maximum subarray sum, mixed signs | Kadane |
| maximum circular subarray | max(Kadane normal, total - minSubarray) |
| exact sum `K` | prefix sum + hashmap |
| longest/shortest threshold with positives | sliding window |
| threshold with negatives | prefix + deque/tree |
| need subarray product | track max/min product due to negatives |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

---

## 🧠 The Core Epiphany: What Is Kadane's *Really* Doing?

Kadane's is **not** "tracking the max sum so far." That describes what it does, not *why* it works.

### The Decision At Every Index

At every index `i`, you face a binary decision:
> **"Is the subarray ending at `i-1` an asset or a liability?"**

- If the cumulative sum ending at `i-1` is **positive**, it's an **asset** — extending the subarray by including `arr[i]` makes the total larger.
- If the cumulative sum ending at `i-1` is **negative or zero**, it's a **liability** — you are mathematically better off **abandoning** the entire subarray and starting fresh from `arr[i]`.

This is what `currentMax = Math.max(arr[i], currentMax + arr[i])` encodes. It's a greedy decision: **"extend" vs "restart"** at every single index.

### Why Greedy Works Here (Optimal Substructure)

Kadane's works because the problem has **optimal substructure**: the max subarray ending at position `i` can be computed purely from the max subarray ending at position `i-1`. You never need to look further back. This is a 1D DP where `dp[i] = max(arr[i], dp[i-1] + arr[i])`, but since `dp[i]` only depends on `dp[i-1]`, we can compress the DP table into a single variable.

### Why Sliding Window FAILS Here

Sliding window requires **monotonicity** (expanding always increases, shrinking always decreases). With mixed positive/negative numbers, adding an element might decrease the sum. Kadane's sidesteps this by making a **local greedy decision** instead of trying to maintain window invariants.

---

## 📐 CORE TEMPLATES

### Template 1: Maximum Subarray Sum (Classic Kadane's)
```java
public int maxSubArray(int[] nums) {
    int currentMax = nums[0];
    int globalMax = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        // DECISION: extend previous subarray, or start fresh?
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        globalMax = Math.max(globalMax, currentMax);
    }
    return globalMax;
}
// Time: O(N) | Space: O(1)
```

### Template 2: Maximum Product Subarray
```java
public int maxProduct(int[] nums) {
    int maxSoFar = nums[0], minSoFar = nums[0], result = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        // A negative number can flip min to max!
        if (nums[i] < 0) {
            int temp = maxSoFar;
            maxSoFar = minSoFar;
            minSoFar = temp;
        }
        maxSoFar = Math.max(nums[i], maxSoFar * nums[i]);
        minSoFar = Math.min(nums[i], minSoFar * nums[i]);
        result = Math.max(result, maxSoFar);
    }
    return result;
}
// Time: O(N) | Space: O(1)
```

**Why track `minSoFar`?** A massive negative product × another negative number = a massive *positive* product. So the current minimum is always a candidate for the future maximum.

### Template 3: Subarray Sum Equals K (Prefix Sum + HashMap)
```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // empty prefix
    int prefix = 0, count = 0;
    
    for (int num : nums) {
        prefix += num;
        // How many previous prefixes complement current to make sum = k?
        count += prefixCount.getOrDefault(prefix - k, 0);
        prefixCount.merge(prefix, 1, Integer::sum);
    }
    return count;
}
// Time: O(N) | Space: O(N)
```

### Template 4: Subarray with Given XOR
```java
public int subarraysWithXor(int[] arr, int k) {
    Map<Integer, Integer> prefixXorCount = new HashMap<>();
    prefixXorCount.put(0, 1);
    int xor = 0, count = 0;
    
    for (int num : arr) {
        xor ^= num;
        // If prefix[r] ^ prefix[l-1] = k, then prefix[l-1] = prefix[r] ^ k
        count += prefixXorCount.getOrDefault(xor ^ k, 0);
        prefixXorCount.merge(xor, 1, Integer::sum);
    }
    return count;
}
// Time: O(N) | Space: O(N)
```

---

## 🔬 Deep Dive: Maximum Subarray Sum (LC 53)

**Problem:** Find the contiguous subarray with the largest sum.  
`nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`

---

### 💡 The Core Reasoning — WHY Kadane's works

At every index `i`, you face a **binary decision**:

```
"Is the running subarray ending at i-1 an ASSET or a LIABILITY?"

  ASSET (positive sum):    Keep it — extending adds value
  LIABILITY (negative sum): Abandon it — start fresh from arr[i]
  
This is what Math.max(arr[i], currentMax + arr[i]) encodes:
  - arr[i] alone         → "start fresh" (abandon the past)
  - currentMax + arr[i]  → "extend"      (past was helpful)
```

**Why this greedy choice is always correct:** If the best subarray ending at `i-1` has negative sum, then ANY subarray that includes it and extends to `i` will be **strictly worse** than just `arr[i]` alone. There is no future element that can "undo" the damage of carrying a negative prefix. So cutting your losses is always optimal.

### 📊 Visual — The "Asset vs Liability" Decision

```
nums:    [-2,  1, -3,  4, -1,  2,  1, -5,  4]

Decision: ✂️   ✂️  EXT  ✂️  EXT EXT EXT EXT EXT
          ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓
curMax:  -2    1   -2    4    3    5    6    1    5
                        ─────────────────
                        Best subarray: [4, -1, 2, 1] = 6

✂️ = Start fresh (past was a liability)
EXT = Extend (past was an asset)
```

---

### 🐢 Approach 1: Brute Force — Check All Subarrays

```java
// Try every subarray [i..j], compute its sum
// Time: O(n³) → inner loop recomputes sum from scratch
// Time: O(n²) if you accumulate sum incrementally (shown below)
// Space: O(1)
int maxSum = Integer.MIN_VALUE;
for (int i = 0; i < nums.length; i++) {
    int sum = 0;
    for (int j = i; j < nums.length; j++) {
        sum += nums[j];  // accumulate instead of recomputing
        maxSum = Math.max(maxSum, sum);
    }
}
return maxSum;
```

**Why it's slow:** For each starting index `i`, you scan all endings `j`. That's O(n²) pairs.

**Why upgrade?** Notice that when `currentSum` goes negative at some index, you will never improve by continuing from `i` — any extension carries the penalty. Kadane's exploits this.

---

### 🚀 Approach 2: Optimized — Kadane's Algorithm

```java
// At each index: extend or restart? Track global best.
// Time: O(n), Space: O(1) ✅
public int maxSubArray(int[] nums) {
    int currentMax = nums[0];  // best subarray ending at current index
    int globalMax = nums[0];   // best subarray seen anywhere
    
    for (int i = 1; i < nums.length; i++) {
        // DECISION: is the past an asset or liability?
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        globalMax = Math.max(globalMax, currentMax);
    }
    return globalMax;
}
```

---

### 📊 Full Step-by-Step Trace — `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`

```
i=0: num=-2
     currentMax = -2 (must start here)
     globalMax  = -2

i=1: num=1
     max(1, -2 + 1) = max(1, -1) = 1  → ✂️ START FRESH (past = -2 was liability)
     currentMax = 1, globalMax = 1

i=2: num=-3
     max(-3, 1 + (-3)) = max(-3, -2) = -2  → EXTEND (less bad than restarting)
     currentMax = -2, globalMax = 1

i=3: num=4
     max(4, -2 + 4) = max(4, 2) = 4  → ✂️ START FRESH (past = -2 was liability)
     currentMax = 4, globalMax = 4

i=4: num=-1
     max(-1, 4 + (-1)) = max(-1, 3) = 3  → EXTEND
     currentMax = 3, globalMax = 4

i=5: num=2
     max(2, 3 + 2) = max(2, 5) = 5  → EXTEND
     currentMax = 5, globalMax = 5

i=6: num=1
     max(1, 5 + 1) = max(1, 6) = 6  → EXTEND
     currentMax = 6, globalMax = 6 ✅

i=7: num=-5
     max(-5, 6 + (-5)) = max(-5, 1) = 1  → EXTEND
     currentMax = 1, globalMax = 6

i=8: num=4
     max(4, 1 + 4) = max(4, 5) = 5  → EXTEND
     currentMax = 5, globalMax = 6

Answer: 6 ✅ (subarray [4, -1, 2, 1])
```

---

### 🧠 Things to Remember
- **Core decision:** `Math.max(arr[i], currentMax + arr[i])` = "extend vs restart"
- **It's a 1D DP:** `dp[i] = max(arr[i], dp[i-1] + arr[i])` compressed to one variable
- **Initialize with `nums[0]`**, NOT `0` — handles all-negative arrays
- **Kadane's vs Sliding Window:** Kadane's works with negatives; sliding window doesn't
- **Follow-up traps:**
  - "Return the subarray itself" → track start/end indices when `globalMax` updates
  - "Circular array" → `max(Kadane_max, totalSum - Kadane_min)` (handle all-negative edge case)
  - "Max product" → track BOTH max and min (negative × negative = positive)

---

## 🔬 FULL WALKTHROUGH 2: Maximum Product Subarray (LC 152)

```
Problem: Find the contiguous subarray with the largest product.
         nums = [2, 3, -2, 4]

Why Kadane's sum version fails: products can flip sign!
  A very negative product × negative number = very positive product.
  We must track BOTH max and min at each step.

Step-by-step:
  i=0: num=2
       maxSoFar=2, minSoFar=2, result=2

  i=1: num=3 (positive, no swap)
       maxSoFar = max(3, 2×3) = 6
       minSoFar = min(3, 2×3) = 3
       result = 6

  i=2: num=-2 (NEGATIVE → swap max and min first!)
       After swap: maxSoFar=3, minSoFar=6
       maxSoFar = max(-2, 3×(-2)) = max(-2, -6) = -2
       minSoFar = min(-2, 6×(-2)) = min(-2, -12) = -12
       result = 6 (unchanged)

  i=3: num=4 (positive, no swap)
       maxSoFar = max(4, -2×4) = max(4, -8) = 4
       minSoFar = min(4, -12×4) = min(4, -48) = -48
       result = 6 ✅

  Answer: 6 ✅ (subarray [2, 3])
  
  Note: minSoFar=-48 was being tracked because if a future negative
  appeared, -48 × negative = 48, a huge positive! That's why we track both.
```

---

## 🔬 FULL WALKTHROUGH 3: Subarray Sum Equals K (LC 560)

```
Problem: Count subarrays summing to exactly k=3.
         nums = [1, 2, 3, -1, 1, 2]

Key: Can't use sliding window (negatives exist). Use Prefix Sum + HashMap.

Step-by-step:
  prefixCount = {0: 1}    ← empty prefix initialization
  prefix = 0, count = 0

  i=0: prefix = 0+1 = 1
       Look for 1-3 = -2 in map → NO
       count = 0
       map = {0:1, 1:1}

  i=1: prefix = 1+2 = 3
       Look for 3-3 = 0 in map → YES (count 1) → subarray [1,2,3...no] wait,
       actually subarray from index 0 to 1: sum = 1+2 = 3 ✅
       count = 1
       map = {0:1, 1:1, 3:1}

  i=2: prefix = 3+3 = 6
       Look for 6-3 = 3 in map → YES (count 1) → subarray [3] (index 2)
       count = 2
       map = {0:1, 1:1, 3:1, 6:1}

  i=3: prefix = 6+(-1) = 5
       Look for 5-3 = 2 in map → NO
       count = 2
       map = {0:1, 1:1, 3:1, 6:1, 5:1}

  i=4: prefix = 5+1 = 6
       Look for 6-3 = 3 in map → YES (count 1) → subarray [3,-1,1]
       count = 3
       map = {0:1, 1:1, 3:1, 6:2, 5:1}

  i=5: prefix = 6+2 = 8
       Look for 8-3 = 5 in map → YES (count 1) → subarray [-1,1,2]
       count = 4
       map = {0:1, 1:1, 3:1, 6:2, 5:1, 8:1}

  Answer: 4 ✅
```

---

## 🔬 FULL WALKTHROUGH 4: Circular Maximum Subarray (LC 918)

```
Problem: Array is circular. Find max subarray sum.
         nums = [5, -3, 5]

Key Insight: The circular max subarray is either:
  Case 1: A normal (non-wrapping) max subarray → standard Kadane's
  Case 2: A wrapping subarray = totalSum - minSubarraySum
    (Remove the minimum "valley" from the middle, leaving the circular ends)

Method:
  normalMax  = Kadane's max = 7  (subarray [5, -3, 5])
  normalMin  = Kadane's min = -3 (subarray [-3])
  totalSum   = 5 + (-3) + 5 = 7
  circularMax = totalSum - normalMin = 7 - (-3) = 10

  BUT: Special case! If ALL elements are negative, circularMax = totalSum - normalMin = 0.
       In this case, use normalMax (which is the "least negative" element).

  if (circularMax == 0) return normalMax;  // all negative
  return Math.max(normalMax, circularMax);

  For our example: max(7, 10) = 10 ✅
  The wrapping subarray is [5, 5] (wrap around, skipping the -3).
```

---

## 🔬 FULL WALKTHROUGH 5: Longest Subarray with Sum ≤ K (Sliding Window)

```
Problem: Longest subarray with sum at most K=5.
         nums = [1, 2, 1, 0, 1, 1, 0]
         (All non-negative — sliding window is SAFE here!)

Step-by-step:
  left=0, sum=0, maxLen=0

  right=0: sum=1 ≤ 5 → maxLen=1
  right=1: sum=3 ≤ 5 → maxLen=2
  right=2: sum=4 ≤ 5 → maxLen=3
  right=3: sum=4 ≤ 5 → maxLen=4
  right=4: sum=5 ≤ 5 → maxLen=5
  right=5: sum=6 > 5 → shrink! left=1, sum=5 ≤ 5 → maxLen=5
  right=6: sum=5 ≤ 5 → maxLen=6

  Answer: 6 ✅

  WHY sliding window works: All non-negative, so expanding always
  increases sum (monotonic). Shrinking always decreases. Safe.
```

---

## 🛑 WHEN TO USE WHAT — Decision Tree

```
Subarray problem?
│
├── "Maximum/minimum subarray SUM"
│   ├── Find the single best subarray → KADANE'S
│   ├── Circular array → KADANE'S MAX + (TOTAL - KADANE'S MIN)
│   └── Count subarrays with sum = K → PREFIX SUM + HASHMAP
│
├── "Maximum subarray PRODUCT"
│   └── Track both maxSoFar AND minSoFar → MODIFIED KADANE'S
│
├── "Longest subarray with sum ≤/≥ K"
│   ├── All non-negative? → SLIDING WINDOW (monotonic!)
│   └── Has negatives? → PREFIX SUM + SORTED STRUCTURE (TreeMap)
│
├── "Subarray with given XOR"
│   └── PREFIX XOR + HASHMAP
│
└── "Sum divisible by K"
    └── PREFIX SUM MODULO + HASHMAP
```

---

## 📋 PRACTICE PROBLEMS (7-10 Core Problems)

### Easy
| # | Problem | Difficulty | Key Insight |
|---|---------|------------|-------------|
| 1 | [Maximum Subarray (LC 53)](https://leetcode.com/problems/maximum-subarray/) | Easy | Classic Kadane's: extend vs restart |
| 2 | [Best Time to Buy and Sell Stock (LC 121)](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Easy | Kadane's variant: track min price, max profit |

### Medium
| # | Problem | Difficulty | Key Insight |
|---|---------|------------|-------------|
| 3 | [Maximum Product Subarray (LC 152)](https://leetcode.com/problems/maximum-product-subarray/) | Medium | Track both max AND min (negative flip) |
| 4 | [Subarray Sum Equals K (LC 560)](https://leetcode.com/problems/subarray-sum-equals-k/) | Medium | Prefix Sum + HashMap, NOT sliding window |
| 5 | [Maximum Sum Circular Subarray (LC 918)](https://leetcode.com/problems/maximum-sum-circular-subarray/) | Medium | totalSum - minSubarray for wrap case |
| 6 | [Subarray Sums Divisible by K (LC 974)](https://leetcode.com/problems/subarray-sums-divisible-by-k/) | Medium | Prefix modulo + HashMap |
| 7 | [Longest Subarray with Sum ≤ K](https://leetcode.com/problems/subarray-product-less-than-k/) | Medium | Sliding window (non-negative only) |
| 8 | [Count Nice Subarrays (LC 1248)](https://leetcode.com/problems/count-number-of-nice-subarrays/) | Medium | Convert to prefix sum (odd=1, even=0) |

### Hard
| # | Problem | Difficulty | Key Insight |
|---|---------|------------|-------------|
| 9 | [Max Subarray Sum with One Deletion (LC 1186)](https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/) | Hard | Two Kadane passes: left-to-right + right-to-left |
| 10 | [Shortest Subarray with Sum at Least K (LC 862)](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) | Hard | Prefix + Monotonic Deque (negatives!) |

