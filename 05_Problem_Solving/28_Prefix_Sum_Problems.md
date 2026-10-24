# Prefix Sum Problems

> **Navigation**: [← Arrays](04_Arrays.md) | [Chapter index](00_INDEX.md) | [HashMap Hashing →](17_HashMap_Hashing.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Prefix Sum pattern](../04_Patterns_Templates/26_Prefix_Sum_And_Difference_Array.md), [Arrays](04_Arrays.md), [HashMap](17_HashMap_Hashing.md) |
| **You will learn** | Counting subarrays with a given sum, divisibility by `k`, products without division, difference arrays for range updates, balanced 0/1 runs and 2D range sums |
| **Leads to** | [Sliding Window](05_Sliding_Window.md), [Dynamic Programming](11_Dynamic_Programming.md) |
| **Abstraction level** | Nested range sums → **one precomputed array** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Prefix Sum Problems

### 1. The bottom line

Store running totals once; any range sum is then a subtraction, and a hash map of earlier totals counts matching subarrays.

### 2. The textbook core

- `prefix[i]` = sum of the first `i` values; `sum(l..r) = prefix[r+1] − prefix[l]`.
- Count subarrays with sum `k`: look up `prefix − k` among earlier prefixes (seed with 0).
- Divisible by `k`: equal prefix remainders mod `k` (normalise negatives).
- Difference array: add `x` to `[l, r]` with `d[l] += x; d[r+1] −= x`.
- 2D prefix: inclusion–exclusion on four corners.

### 3. The real-world analogy

A **bank statement with running balance**.

### 4. Walkthrough

1. Array `[3,1,4,1,5]`, prefix `[0,3,4,8,9,14]`.
2. Sum of indices 1..3 = `9 − 3 = 6`.
3. Count subarrays of `[1,1,1]` with sum 2: prefixes `0,1,2,3`.
4. Pairs differing by 2: (0,2) and (1,3) → 2.

> [!NOTE]
> **Quick check:** Why seed the hash map with prefix 0? *So subarrays starting at index 0 are counted.*


### 5. Check yourself

**Q1.** Subarrays of `[1,2,3]` that sum to 3?

<details><summary>Answer</summary>

**2**: `[1,2]` and `[3]`.

</details>

**Q2.** Product of the array except self for `[2,3]`?

<details><summary>Answer</summary>

`[3, 2]`.

</details>

---

## 🗺️ Pattern Recognition Header

| Signal in the problem | Technique |
| --- | --- |
| "number of subarrays with sum k" (negatives) | Prefix sum + hash map |
| "subarray sum multiple of k" | Prefix remainder + first index |
| "product of all others" | Prefix × suffix |
| "add x to a range" many times | Difference array |
| "longest equal 0s and 1s" | Map 0 → −1, longest zero-sum |
| "sum of a rectangle" queries | 2D prefix |

> [!TIP]
> A sliding window works for "sum = k" only when all values are non-negative. With negatives, always think prefix sum + hash map.

---

## Problem 1 — Subarray Sum Equals K

**Task.** Count contiguous subarrays whose sum equals `k` (values may be negative).

**Brute force.** Check every start and end: `O(n²)`.

**Better idea.** Keep a map from prefix sum to how often it occurred; at each position add the count of `prefix − k`.

```java
static int subarraySum(int[] a, int k) {
    Map<Long, Integer> m = new HashMap<>();
    m.put(0L, 1);
    long s = 0;
    int c = 0;
    for (int x : a) {
        s += x;
        c += m.getOrDefault(s - k, 0);
        m.merge(s, 1, Integer::sum);
    }
    return c;
}
```

**Example.** `[1,1,1]`, `k = 2` → `2`.

**Complexity.** `O(n)` time and space.


## Problem 2 — Continuous Subarray Sum

**Task.** Is there a subarray of length at least 2 whose sum is a multiple of `k`?

**Brute force.** Check every subarray: `O(n²)`.

**Better idea.** Equal prefix remainders mean the sum between them is divisible by `k`; store the first index of each remainder.

```java
static boolean checkSubarraySum(int[] a, int k) {
    Map<Integer, Integer> first = new HashMap<>();
    first.put(0, -1);
    int s = 0;
    for (int i = 0; i < a.length; i++) {
        s = (int) (((long) s + a[i]) % k);
        if (s < 0) s += k;
        if (first.containsKey(s)) {
            if (i - first.get(s) >= 2) return true;
        } else first.put(s, i);
    }
    return false;
}
```

**Example.** `[23,2,4,6,7]`, `k = 6` → `true` (`2+4`).

**Complexity.** `O(n)`.


## Problem 3 — Product of Array Except Self

**Task.** Return an array where each entry is the product of all other entries, without using division.

**Brute force.** For each index multiply the rest: `O(n²)`.

**Better idea.** Prefix products on the way forward, suffix products on the way back.

```java
static int[] productExceptSelf(int[] a) {
    int n = a.length;
    int[] out = new int[n];
    int pre = 1;
    for (int i = 0; i < n; i++) {
        out[i] = pre;
        pre *= a[i];
    }
    int suf = 1;
    for (int i = n - 1; i >= 0; i--) {
        out[i] *= suf;
        suf *= a[i];
    }
    return out;
}
```

**Example.** `[1,2,3,4]` → `[24,12,8,6]`.

**Complexity.** `O(n)` time, `O(1)` extra space.


## Problem 4 — Corporate Flight Bookings

**Task.** Each booking adds `seats` to flights `first..last`. Return the total per flight.

**Brute force.** Loop over each booking range: `O(n·m)`.

**Better idea.** Difference array: add at `first`, subtract after `last`, then take one prefix sum.

```java
static int[] flightBookings(int[][] b, int n) {
    int[] d = new int[n + 1];
    for (int[] x : b) {
        d[x[0] - 1] += x[2];
        d[x[1]] -= x[2];
    }
    int[] out = new int[n];
    int r = 0;
    for (int i = 0; i < n; i++) {
        r += d[i];
        out[i] = r;
    }
    return out;
}
```

**Example.** `[[1,2,10],[2,3,20],[2,5,25]]`, `n = 5` → `[10,55,45,25,25]`.

**Complexity.** `O(n + m)`.


## Problem 5 — Longest Balanced Subarray (equal 0s and 1s)

**Task.** Find the longest subarray with the same number of 0s and 1s.

**Brute force.** Check every subarray: `O(n²)`.

**Better idea.** Treat 0 as −1; the longest subarray with sum 0 spans two equal prefixes — store the first index of each prefix.

```java
static int longestBalanced(int[] bits) {
    Map<Integer, Integer> first = new HashMap<>();
    first.put(0, -1);
    int s = 0, best = 0;
    for (int i = 0; i < bits.length; i++) {
        s += bits[i] == 1 ? 1 : -1;
        Integer f = first.get(s);
        if (f != null) best = Math.max(best, i - f);
        else first.put(s, i);
    }
    return best;
}
```

**Example.** `[0,1,0,1,1,0]` → `6`.

**Complexity.** `O(n)`.


## Problem 6 — 2D Range Sum

**Task.** Answer many "sum of this rectangle" queries on a fixed grid.

**Brute force.** Loop over the rectangle per query: `O(rc)` each.

**Better idea.** Build a 2D prefix table once; each query uses four lookups.

```java
static long[][] pre2d(int[][] g) {
    long[][] p = new long[g.length + 1][g[0].length + 1];
    for (int i = 0; i < g.length; i++) for (int j = 0; j < g[0].length; j++) p[i + 1][j + 1] = g[i][j] + p[i][j + 1] + p[i + 1][j] - p[i][j];
    return p;
}

static long rect(long[][] p, int r1, int c1, int r2, int c2) {
    return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];
}
```

**Example.** For a grid `g`, `rect(p, r1, c1, r2, c2)` returns the sum of `g[r1..r2][c1..c2]`.

**Complexity.** `O(rc)` preprocessing, `O(1)` per query.

---

## 🏢 Enterprise Lens — Prefix Sum Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Analytics dashboards, image box filters, booking and capacity systems, histogram aggregates |
| **Failure modes** | Mixing inclusive/exclusive bounds; negative remainders; `int` overflow in sums and products |
| **Testing and verification** | Compare with nested-loop sums on random arrays including negatives (1 500 cases here) |

---

## Reality Check

> [!CAUTION]
> "Prefix sums are only for sums." They work for any invertible operation (XOR, counts per character); they fail for min and max.

---

[← Union-Find Problems](27_Union_Find_Problems.md) | [Index](00_INDEX.md) | [Topological Sort Problems →](29_Topological_Sort_Problems.md)
