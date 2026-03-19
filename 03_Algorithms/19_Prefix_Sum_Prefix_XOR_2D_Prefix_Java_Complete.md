> **Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)

# Chapter 19 - Prefix Sum, Prefix XOR, and 2D Prefix Java Complete Guide

> Purpose: Build one unified Java playbook for all prefix-family interview problems: 1D sum, XOR, modular prefix, 2D matrix prefix, and difference arrays.

---

## 1. Prefix Family - One Core Idea

### Universal pattern

We precompute cumulative state so range query becomes O(1).

For an operation `op` with inverse:
- prefix[i] = combine first i items
- range(l, r) = inverse(prefix[r], prefix[l-1])

For sums:
- `rangeSum(l, r) = ps[r + 1] - ps[l]` with 1-based prefix

For XOR:
- `rangeXor(l, r) = px[r + 1] ^ px[l]`

---

## 2. 1D Prefix Sum (Java)

## 2.1 Construction

```java
public static long[] buildPrefixSum(int[] arr) {
    long[] ps = new long[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        ps[i + 1] = ps[i] + arr[i];
    }
    return ps;
}

public static long rangeSum(long[] ps, int l, int r) {
    return ps[r + 1] - ps[l];
}
```

Why `long`? Prevent integer overflow in cumulative sums.

## 2.2 Typical question patterns

1. Static many range sum queries
2. Count subarrays with target sum
3. Longest/shortest subarray under sum condition
4. Partition by balanced sums

---

## 3. Prefix Sum + HashMap

### Problem: count subarrays with sum = k

Equation:
- `sum(l..r) = prefix[r] - prefix[l-1] = k`
- need count of previous prefix value `prefix[r] - k`

```java
import java.util.*;

public final class SubarraySumEqualsK {
    public int subarraySum(int[] nums, int k) {
        Map<Long, Integer> freq = new HashMap<>();
        freq.put(0L, 1);

        long prefix = 0;
        int ans = 0;

        for (int x : nums) {
            prefix += x;
            ans += freq.getOrDefault(prefix - k, 0);
            freq.put(prefix, freq.getOrDefault(prefix, 0) + 1);
        }
        return ans;
    }
}
```

Interview script:
"For each right endpoint, I count how many earlier prefixes can pair with current prefix to create sum k."

---

## 4. Prefix XOR (Java)

## 4.1 Construction and range xor

```java
public static int[] buildPrefixXor(int[] arr) {
    int[] px = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        px[i + 1] = px[i] ^ arr[i];
    }
    return px;
}

public static int rangeXor(int[] px, int l, int r) {
    return px[r + 1] ^ px[l];
}
```

### Key properties

- `a ^ a = 0`
- `a ^ 0 = a`
- associative + commutative

---

## 5. Prefix XOR + HashMap Patterns

## 5.1 Count subarrays with xor = k

```java
import java.util.*;

public final class SubarrayXorEqualsK {
    public long countSubarrays(int[] arr, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        freq.put(0, 1);

        int px = 0;
        long ans = 0;

        for (int v : arr) {
            px ^= v;
            ans += freq.getOrDefault(px ^ k, 0);
            freq.put(px, freq.getOrDefault(px, 0) + 1);
        }
        return ans;
    }
}
```

Reason:
- If `pref[r] ^ pref[l-1] = k`, then `pref[l-1] = pref[r] ^ k`.

---

## 6. Prefix with Modulo (Very Important)

### Problem shape

- subarray sum divisible by k
- longest subarray with equal modulo class

### Rule

If two prefixes have same remainder modulo `k`, their difference is divisible by `k`.

```java
import java.util.*;

public final class SubarraysDivByK {
    public int subarraysDivByK(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        freq.put(0, 1);

        long prefix = 0;
        int ans = 0;

        for (int x : nums) {
            prefix += x;
            int rem = (int) ((prefix % k + k) % k); // fix negative modulo
            ans += freq.getOrDefault(rem, 0);
            freq.put(rem, freq.getOrDefault(rem, 0) + 1);
        }
        return ans;
    }
}
```

---

## 7. 2D Prefix Sum (Matrix)

## 7.1 Build matrix prefix

Use 1-based indexing in prefix matrix for cleaner boundaries.

```java
public static long[][] build2DPrefix(int[][] mat) {
    int n = mat.length;
    int m = mat[0].length;

    long[][] pref = new long[n + 1][m + 1];

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            pref[i][j] = mat[i - 1][j - 1]
                    + pref[i - 1][j]
                    + pref[i][j - 1]
                    - pref[i - 1][j - 1];
        }
    }
    return pref;
}
```

## 7.2 Query rectangle sum in O(1)

Rectangle `(r1,c1)` to `(r2,c2)` inclusive, 0-based inputs:

```java
public static long rectSum(long[][] pref, int r1, int c1, int r2, int c2) {
    int a = r1 + 1, b = c1 + 1, c = r2 + 1, d = c2 + 1;
    return pref[c][d] - pref[a - 1][d] - pref[c][b - 1] + pref[a - 1][b - 1];
}
```

---

## 8. 2D Prefix Use Cases

1. Fixed or variable window matrix sum
2. Count submatrices with target sum
3. Image-style integral matrix problems
4. Fast heatmap or query-region analytics

---

## 9. Difference Arrays (Range Update, Then Reconstruct)

Prefix is for fast queries.
Difference array is for fast batch range updates.

## 9.1 1D difference

To add `val` on `[l, r]`:
- `diff[l] += val`
- `diff[r+1] -= val` (if in bounds)

Reconstruct final array by prefix over `diff`.

```java
public static long[] applyRangeUpdates(int n, int[][] updates) {
    long[] diff = new long[n + 1];

    for (int[] u : updates) {
        int l = u[0], r = u[1], val = u[2];
        diff[l] += val;
        if (r + 1 < diff.length) diff[r + 1] -= val;
    }

    long[] ans = new long[n];
    long cur = 0;
    for (int i = 0; i < n; i++) {
        cur += diff[i];
        ans[i] = cur;
    }
    return ans;
}
```

## 9.2 2D difference (rectangle updates)

For rectangle add val on `(r1,c1)`..`(r2,c2)`:
- diff[r1][c1] += val
- diff[r1][c2+1] -= val
- diff[r2+1][c1] -= val
- diff[r2+1][c2+1] += val

Then perform 2D prefix reconstruction.

---

## 10. Decision Matrix (Interview Speed)

Use this quick chooser:

1. Many static range sum queries -> 1D/2D prefix sum
2. Subarray count equals K -> prefix + hashmap
3. Divisible by K -> prefix remainder frequency
4. XOR range/query patterns -> prefix xor (or trie for max xor)
5. Many range updates then final values -> difference array
6. Dynamic point update + range query online -> Fenwick/Segment Tree (not plain prefix)

---

## 11. Common Java Pitfalls

1. Using `int` for large prefix sums
- fix: use `long`

2. Wrong bounds in prefix arrays
- fix: keep one extra element and standardize formulas

3. Negative modulo bugs
- fix: `((x % k) + k) % k`

4. Off-by-one in 2D query
- fix: convert all to 1-based inside helper method

5. Forgetting base prefix in hash map
- sum/xor: seed map with zero prefix frequency = 1

---

## 12. Interview Problem Bank (Java Practice)

1. Range Sum Query - Immutable
2. Subarray Sum Equals K
3. Subarrays Divisible by K
4. Count Number of Nice Subarrays
5. Maximum Size Subarray Sum Equals K
6. Subarray XOR Equals K
7. Matrix Block Sum
8. Number of Submatrices That Sum to Target

---

## 13. Compact Java Utility Class

```java
public final class PrefixUtils {

    private PrefixUtils() {}

    public static long[] prefixSum(int[] a) {
        long[] ps = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) ps[i + 1] = ps[i] + a[i];
        return ps;
    }

    public static long rangeSum(long[] ps, int l, int r) {
        return ps[r + 1] - ps[l];
    }

    public static int[] prefixXor(int[] a) {
        int[] px = new int[a.length + 1];
        for (int i = 0; i < a.length; i++) px[i + 1] = px[i] ^ a[i];
        return px;
    }

    public static int rangeXor(int[] px, int l, int r) {
        return px[r + 1] ^ px[l];
    }

    public static long[][] prefix2D(int[][] mat) {
        int n = mat.length, m = mat[0].length;
        long[][] p = new long[n + 1][m + 1];
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                p[i][j] = mat[i - 1][j - 1]
                        + p[i - 1][j]
                        + p[i][j - 1]
                        - p[i - 1][j - 1];
            }
        }
        return p;
    }

    public static long rectSum(long[][] p, int r1, int c1, int r2, int c2) {
        int a = r1 + 1, b = c1 + 1, c = r2 + 1, d = c2 + 1;
        return p[c][d] - p[a - 1][d] - p[c][b - 1] + p[a - 1][b - 1];
    }
}
```

---

## 14. Final Interview Script

"Prefix transforms repeated range work into constant-time queries by paying one linear preprocessing pass. For counting subarrays, I combine prefix with hash frequencies. For matrix regions, I use 2D inclusion-exclusion. For heavy range updates, I switch to difference arrays."

---

> **Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)
