**Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)

# Chapter 19 - Prefix Sum, Prefix XOR, and 2D Prefix Java Complete Guide

Purpose: Build one unified Java playbook for all prefix-family interview problems: 1D sum, XOR, modular prefix, 2D matrix prefix, and difference arrays.

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

🔬 **Section Challenge — 1. Prefix Family - One Core Idea**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 2. 1D Prefix Sum (Java)

🔬 **Section Challenge — 2. 1D Prefix Sum (Java)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


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

🔬 **Section Challenge — 3. Prefix Sum + HashMap**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 4. Prefix XOR (Java)

🔬 **Section Challenge — 4. Prefix XOR (Java)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


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

🔬 **Section Challenge — 5. Prefix XOR + HashMap Patterns**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?
<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.
</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?
<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.
</details>


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

🔬 **Section Challenge — 6. Prefix with Modulo (Very Important)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 7. 2D Prefix Sum (Matrix)

🔬 **Section Challenge — 7. 2D Prefix Sum (Matrix)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


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

🔬 **Section Challenge — 7.1 Build matrix prefix**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 7.2 Query rectangle sum in O(1)

Rectangle `(r1,c1)` to `(r2,c2)` inclusive, 0-based inputs:

```java
public static long rectSum(long[][] pref, int r1, int c1, int r2, int c2) {
    int a = r1 + 1, b = c1 + 1, c = r2 + 1, d = c2 + 1;
    return pref[c][d] - pref[a - 1][d] - pref[c][b - 1] + pref[a - 1][b - 1];
}
```

### 🔬 Deep Dive: The Principle of Inclusion-Exclusion (PIE)

Why does the formula `pref[c][d] - pref[a - 1][d] - pref[c][b - 1] + pref[a - 1][b - 1]` work? It is a direct application of the mathematical **Principle of Inclusion-Exclusion (PIE)** applied to 2D geometry.

When we want the sum of a specific target rectangle from $(r_1, c_1)$ to $(r_2, c_2)$:
1. **Include the whole:** We start with `pref[r2+1][c2+1]`. This gives us the sum of the *entire* rectangle from $(0,0)$ down to our bottom-right corner $(r_2, c_2)$.
2. **Exclude the top:** We subtract `pref[r1][c2+1]`. This removes the unwanted area *above* our target rectangle.
3. **Exclude the left:** We subtract `pref[r2+1][c1]`. This removes the unwanted area to the *left* of our target rectangle.
4. **Re-include the overlap:** By subtracting both the top and the left sections, we accidentally subtracted their intersection (the top-left corner area `pref[r1][c1]`) **TWICE**. To mathematically correct this, we must add it back exactly once.

This pattern ($|A \cup B| = |A| + |B| - |A \cap B|$, or in our case $\text{Total} - A - B + (A \cap B)$) is the foundation of PIE, ensuring every grid cell in the target rectangle is counted exactly once, and every cell outside is counted zero times.

---

## 8. 2D Prefix Use Cases

1. Fixed or variable window matrix sum
2. Count submatrices with target sum
3. Image-style integral matrix problems
4. Fast heatmap or query-region analytics

---

🔬 **Section Challenge — 8. 2D Prefix Use Cases**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


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

1. Wrong bounds in prefix arrays
- fix: keep one extra element and standardize formulas

1. Negative modulo bugs
- fix: `((x % k) + k) % k`

1. Off-by-one in 2D query
- fix: convert all to 1-based inside helper method

1. Forgetting base prefix in hash map
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

**Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)
