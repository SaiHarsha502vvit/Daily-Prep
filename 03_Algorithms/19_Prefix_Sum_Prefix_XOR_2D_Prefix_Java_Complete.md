**Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)

---

## Proof Corner -- Prefix Sum Correctness and 2D Extension

**1D Prefix Sum Invariant**: After computing `prefix[i]`, it equals the sum of arr[0..i-1] (i exclusive, 0-indexed with sentinel prefix[0]=0).

**Proof by induction**:
- Base: prefix[0] = 0 = sum of empty prefix. Correct.
- Step: prefix[i] = prefix[i-1] + arr[i-1] = (sum arr[0..i-2]) + arr[i-1] = sum arr[0..i-1]. QED.

**Range sum correctness**: sum(l, r) = prefix[r+1] - prefix[l].
- prefix[r+1] = sum arr[0..r]
- prefix[l] = sum arr[0..l-1]
- Difference = sum arr[l..r]. QED.

**2D Prefix Sum**: prefix2D[i][j] = sum of rectangle arr[0..i-1][0..j-1].

**Inclusion-exclusion identity** (proven by Venn diagram argument):
sum(r1,c1, r2,c2) = prefix2D[r2+1][c2+1] - prefix2D[r1][c2+1] - prefix2D[r2+1][c1] + prefix2D[r1][c1]

The +prefix2D[r1][c1] corrects for double-subtraction of the top-left rectangle.

**Prefix XOR self-inverse property**: XOR is its own inverse (a XOR a = 0). Therefore:
xorPrefix[r+1] XOR xorPrefix[l] = xorPrefix of arr[l..r].

This works for any group where every element is its own inverse.

---

## When It Breaks -- Prefix Sum and XOR

**1. Off-by-one in 1D range query** -- the most common prefix sum bug. With 0-indexed arrays and 0-indexed prefix (no sentinel): sum(l,r) = prefix[r+1] - prefix[l], NOT prefix[r] - prefix[l-1] (which fails for l=0). Always add the sentinel prefix[0]=0 to eliminate the l=0 special case.

**2. 2D prefix sum index confusion** -- prefix2D[i][j] includes row i and column j (0-indexed) or excludes them (1-indexed)? Mixing conventions between build and query gives off-by-one or off-by-row errors. Fix: always use 1-indexed prefix2D (add one row/column of zeros at top and left). Then sum(r1,c1,r2,c2) uses r2+1, c2+1 uniformly.

**3. Prefix XOR on non-commutative operations** -- the prefix trick works only for operations that are associative and have an inverse (group). XOR satisfies this (inverse = itself). But matrix multiplication is not commutative, so prefix[r] * inverse(prefix[l-1]) != range product for non-commutative operations.

**4. Overflow in prefix sum of int[] for large arrays** -- prefix sum of 10^5 elements each up to 10^9 reaches 10^14, overflowing int. Always use long[] for prefix arrays when element values can be large.

---

## Reference Anchor

**JDK -- Arrays.parallelPrefix for parallel prefix computation**:
```java
// java.util.Arrays.parallelPrefix -- computes prefix operation in O(n) with parallelism
int[] arr = {1, 2, 3, 4, 5};
// Cumulative sum (in-place):
Arrays.parallelPrefix(arr, Integer::sum);
// arr is now [1, 3, 6, 10, 15]
// Uses work-stealing fork/join pool -- faster than sequential for n > ~10,000

// For range sum queries -- standard idiom:
long[] prefix = new long[arr.length + 1]; // +1 for sentinel
for (int i = 0; i < arr.length; i++) prefix[i+1] = prefix[i] + arr[i];
long rangeSum = prefix[r+1] - prefix[l]; // sum of arr[l..r]

// For 2D prefix sum:
int[][] grid = new int[m][n];
long[][] p = new long[m+1][n+1];
for (int i = 1; i <= m; i++)
    for (int j = 1; j <= n; j++)
        p[i][j] = grid[i-1][j-1] + p[i-1][j] + p[i][j-1] - p[i-1][j-1];
// Query sum(r1,c1,r2,c2) [0-indexed]: p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1]
```


# Chapter 19 - Prefix Sum, Prefix XOR, and 2D Prefix Java Complete Guide

Purpose: Build one unified Java playbook for all prefix-family interview problems: 1D sum, XOR, modular prefix, 2D matrix prefix, and difference arrays.

---

### Historical Evolution

Prefix sum as a systematic technique predates computers — the method of **differences**, developed by **Brook Taylor in 1715** in his work on finite differences, established the mathematical foundation: if you know consecutive differences, you can reconstruct the original sequence by accumulation, and compute range sums as the difference of two accumulated values. **Simpson's rule (1743)** for numerical integration used prefix sums to approximate definite integrals. In computer science, **prefix computation** was formalized as a fundamental parallel primitive by **Kogge and Stone (1972)** in their paper on parallel prefix (scan) algorithms, proving that prefix sums across $n$ elements could be computed in $O(\log n)$ time on $n$ processors. **Blelloch's 1993 work on parallel prefix** established prefix sum as the "Swiss Army knife" of parallel algorithms, enabling sorting, leasing, and polynomial evaluation as specialized prefix operations. The **2D prefix sum** technique (integral image in computer vision) was popularized by **Viola and Jones (2001)** in their face detection paper — the "integral image" is a 2D prefix sum enabling $O(1)$ regional sum queries, a foundational technique in modern computer vision (used in every smartphone camera's face detection). Modern practice (post-2010): prefix sums are in every database query engine (GROUP BY optimization), image processing (integral images in OpenCV, Photoshop), competitive programming (subarray sum problems), and signal processing.

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

**Challenge 1 (Sentinel vs Non-Sentinel):** `sum(l, r) = prefix[r+1] - prefix[l]` with sentinel. vs. `sum(l, r) = prefix[r] - prefix[l-1]` without sentinel. **Who** causes the `ArrayIndexOutOfBoundsException`? **When** does the non-sentinel form fail? **What** index does the sentinel form use for `l=0`?

<details><summary>Answer</summary>

**Who causes the exception:** The non-sentinel form `prefix[l-1]` when `l=0` → `prefix[-1]` → `ArrayIndexOutOfBoundsException`. This is why every prefix sum challenge has an edge case: "handle when the subarray starts from index 0." **Sentinel form fix:** `prefix[0] = 0`, `prefix[i+1] = prefix[i] + arr[i]`. Query: `prefix[r+1] - prefix[l]`. When `l=0`: `prefix[r+1] - prefix[0] = prefix[r+1] - 0 = prefix[r+1]`. No special case needed. The sentinel shifts all indices by 1 and provides a clean zero baseline. **When non-sentinel is acceptable:** Only if you add an explicit `if (l == 0) return prefix[r]` check. Every competitive programmer has forgotten this check at least once — sentinel form is strictly safer. **Space difference:** Sentinel requires `prefix[n+1]`. Non-sentinel requires `prefix[n]`. Pick sentinel every time for simplicity.

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

**Challenge 1 (HashMap off-by-one: map.put(0,1)):** You build prefix sum + HashMap to count subarrays with sum=k. You initialize `map.put(0, 1)`. **Who** does this extra entry represent? **When** is it needed? **What** specific subarrays are missed without it?

<details><summary>Answer</summary>

**Who it represents:** The virtual "prefix sum before any elements" = prefix[0] = 0. In the HashMap, `map.get(prefix[i] - k)` looks for previous prefix sums equal to `prefix[i] - k`. If `prefix[i] == k` (the subarray from index 0 to i has sum exactly k), then we need `map.get(prefix[i] - k) = map.get(0) = 1`. Without `map.put(0, 1)`, this lookup returns null/0 — the subarray `arr[0..i]` is missed. **When needed:** EVERY time the problem asks for subarrays starting at index 0 that satisfy the condition. Input `[3, -3, 1]`, k=0: subarray `[3, -3]` from index 0 to 1, prefix=0 at i=2. Without initialization: missed. With initialization: counted. **What specific subarrays are missed:** Any subarray starting at index 0 whose sum equals k. This is always a bug, not an edge case. `map.put(0, 1)` is MANDATORY for prefix+HashMap problems. Always write it first.

</details>

## 4. Prefix XOR (Java)

🔬 **Section Challenge — 4. Prefix XOR (Java)**

**Challenge 1 (XOR Self-Inverse Property):** Prefix XOR uses `xor[l..r] = prefix[r+1] ^ prefix[l]`. **Who** makes XOR self-inverse? **When** does `a ^ a = 0` apply to reverse the prefix operation? **What** happens if you try `xor[l..r] = prefix[r] - prefix[l-1]` (subtraction instead of XOR)?

<details><summary>Answer</summary>

**Who makes XOR self-inverse:** The mathematical property of XOR. For any value `a`: `a ^ a = 0` (self-cancellation) and `a ^ 0 = a` (identity). So `prefix[r] ^ prefix[l-1]` gives `(arr[0] ^ ... ^ arr[r]) ^ (arr[0] ^ ... ^ arr[l-1])`. The overlapping terms `arr[0]...arr[l-1]` cancel: `x ^ x = 0`. Only `arr[l] ^ ... ^ arr[r]` remains. **When `a ^ a = 0` applies:** Always. Unlike subtraction, XOR doesn't need a numeric inverse (-a). XOR is its own inverse. **Subtraction disaster:** `prefix[r] - prefix[l-1]` computes NUMERIC difference, not XOR range. Example: `arr = [1, 2, 3]`. `xorPrefix = [0, 1, 3, 0]`. `xor(0,2) = 0^1^2^3=0`. With subtraction: `prefix[3] - prefix[0] = 0`. But `xor(1,2) = 2^3=1`. XOR: `prefix[3] ^ prefix[1] = 0^1=1`. Subtraction: `prefix[3]-prefix[1] = 0-1=-1`. WRONG. XOR's inverse is XOR itself — never use arithmetic.

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

**Challenge 1 (XOR HashMap Equal Subarray Count):** Problem: count subarrays where XOR equals k. You use `map.get(prefix[i] ^ k)`. **Who** tracks previous XOR values? **When** does `prefix[i] ^ k` not exist in the map? **What** does `map.put(0, 1)` represent here?

<details><summary>Answer</summary>

**Who tracks previous XOR values:** The HashMap `Map<Integer, Integer>` mapping `(prefix XOR value → count of times seen)`. At each index i, we look up `prefix[i] ^ k` in the map. If found, all previous positions where prefix XOR = `prefix[i] ^ k` form subarrays with XOR = k (because `(prefix[i]) ^ (prefix[j]) = k` → `xor(j+1..i) = k`). **When `prefix[i] ^ k` not in map:** The count is 0 — no subarray ending at i has XOR equal to k. **What `map.put(0, 1)` represents:** The empty prefix before index 0. If `prefix[i] = k` (entire subarray from 0 to i XORs to k), we need `map.get(prefix[i] ^ k) = map.get(0) = 1`. Without this, subarrays starting at index 0 are missed. Same logic as prefix-sum HashMap initialization. **Key pattern:** Any prefix + HashMap problem requires `map.put(identity_element, 1)` where identity = 0 for sum, 0 for XOR.

</details>
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

**Challenge 1 (Prefix Modulo Negative Pitfall):** Count subarrays with sum divisible by k using prefix mod. `prefix % k` can be negative in Java. **Who** causes the wrong count? **When** does `-1 % 5 = -1` instead of `4`? **What** is the fix?

<details><summary>Answer</summary>

**Who causes wrong count:** Java's `%` operator returns negative results when the dividend is negative. `-1 % 5 = -1` in Java (Python returns `4`). In prefix modulo, if prefix sum is negative: `prefix[i] = -1, k = 5`. `prefix[i] % k = -1`. Looking up `map.get(-1)` misses entries stored under key `4` (the mathematically equivalent positive remainder). Two subarrays with remainders `4` and `-1` SHOULD be counted together (both represent remainder 4 modulo 5), but the HashMap lookup misses them. **When it occurs:** Any array with negative values + modulo prefix. Arrays of all positive values are safe. **The fix:** `int rem = (int)((prefix % k + k) % k)`. This normalizes any negative remainder to its positive equivalent. `-1 % 5 = -1`, then `(-1 + 5) % 5 = 4`. Now both subarrays are stored/retrieved under key `4`. Always apply this fix in Java prefix modulo problems — the code in the example above shows `(prefix % k + k) % k`.

</details>

## 7. 2D Prefix Sum (Matrix)

🔬 **Section Challenge — 7. 2D Prefix Sum (Matrix)**

**Challenge 1 (2D Prefix Inclusion-Exclusion Signs):** `query(r1,c1,r2,c2) = S[r2][c2] - S[r1-1][c2] - S[r2][c1-1] + S[r1-1][c1-1]`. **Who** proves the `+` on the last term? **When** is the `+` term zero? **What** happens if you write `-` instead of `+`?

<details><summary>Answer</summary>

**Who proves the `+`:** Inclusion-exclusion principle. `S[r2][c2]` includes the entire rectangle from (0,0) to (r2,c2). `S[r1-1][c2]` subtracts top rows. `S[r2][c1-1]` subtracts left columns. But the top-left rectangle `S[r1-1][c1-1]` was SUBTRACTED TWICE (once by each of the two subtract terms). So we ADD it back once. **When `+` term is zero:** When `r1=0` or `c1=0` (query starts at the first row or column). `S[-1][*] = 0` by the sentinel convention. So `S[r1-1][c1-1] = S[-1][*] = 0`. The `+0` term contributes nothing. **What happens with `-` instead of `+`:** You subtract `S[r1-1][c1-1]` three times total instead of one. The top-left rectangle sum is OVER-subtracted. The query returns a value that's `2 * S[r1-1][c1-1]` too small. This is the most common bug in 2D prefix sum (LC 304 Number of Submatrix That Sum to Target). The `+ - - +` sign pattern MUST be memorized.

</details>
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

**Challenge 1 (2D Prefix Memory Layout):** Your 2D prefix sum array `S[R+1][C+1]` for an R×C matrix. **Who** decides the extra row/column? **When** does `S[i][j] += S[i][j-1]` in the build phase cause an incorrect result? **What** is the correct build order?

<details><summary>Answer</summary>

**Who decides extra row/column:** The sentinel convention. `S` has dimensions `[R+1][C+1]`. `S[0][*] = 0` (row sentinel), `S[*][0] = 0` (column sentinel). This avoids bounds checking for `r1=0` or `c1=0` queries. **Incorrect build order:** If you do row-only prefix first (`S[i][j] += S[i][j-1]`) then column-only (`S[i][j] += S[i-1][j]`), it works correctly. But if you try to do BOTH in one pass: `S[i][j] += S[i-1][j] + S[i][j-1] - S[i-1][j-1]` during build, it's the standard approach. **Correct build:** Standard 2D prefix build iterates `i` then `j`. For each cell: `S[i][j] = arr[i-1][j-1] + S[i-1][j] + S[i][j-1] - S[i-1][j-1]`. The subtraction prevents double-counting the top-left corner (same inclusion-exclusion as the query). Do NOT use two separate passes — the single-pass formula is O(RC) and correct. **Off-by-one trap:** `arr[i-1][j-1]` because `arr` is 0-indexed while `S` is 1-indexed with sentinel. Always map carefully.

</details>
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

1. **Include the whole:** We start with `pref[r2+1][c2+1]`. This gives us the sum of the _entire_ rectangle from $(0,0)$ down to our bottom-right corner $(r_2, c_2)$.
2. **Exclude the top:** We subtract `pref[r1][c2+1]`. This removes the unwanted area _above_ our target rectangle.
3. **Exclude the left:** We subtract `pref[r2+1][c1]`. This removes the unwanted area to the _left_ of our target rectangle.
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

**Challenge 1 (2D Prefix Use-Case: Query Range):** Problem: given matrix M of size R×C, answer Q queries `(r1,c1,r2,c2)` = sum of submatrix. You get `r1 > r2` in some queries. **Who** validates query bounds? **When** should you clamp vs. throw? **What** is the total time complexity for building prefix and answering Q queries?

<details><summary>Answer</summary>

**Who validates bounds:** The caller or the query function itself. Constraints like `0 <= r1 <= r2 < R` are guaranteed by most LeetCode problems (they're stated in constraints). In production code, you MUST validate: `if (r1 > r2 || c1 > c2) return 0;` (empty rectangle). If `r1 < 0`, clamp to 0. **When to clamp vs. throw:** Clamping to 0 is correct for sum queries — an invalid or empty rectangle has sum 0. Throwing is appropriate for application-level bugs (the caller passed bad coordinates). In competitive programming: always clamp; invalid queries are undefined per problem statement. **Total time complexity:** Build phase: O(R×C) — one pass over all cells. Each query: O(1) — four array accesses + arithmetic. For Q queries after build: O(R×C + Q). Compare to naive: O(R×C) build + O(R×C) per query = O(R×C + Q×R×C). With large Q and many queries, 2D prefix reduces Q×R×C to just Q — massive speedup.

</details>
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

### Topical Breadth — Prefix Family Variant Trade-offs

The prefix family has several variants, each suited to different constraint shapes. **Standard prefix sum** works when array values are non-negative and queries ask for range sums. **Prefix + hashmap** is required when the array contains negative numbers (sliding window with negatives fails because the running sum can decrease, invalidating the two-pointer window). **Prefix XOR** replaces addition with XOR for problems asking for XOR of subarrays — XOR satisfies the prefix property (pref[r] ^ pref[l-1] = XOR[l..r]) because XOR is its own inverse. **2D prefix** precomputes O(mn) matrix to answer O(1) rectangle sum queries — the trade-off is O(mn) preprocessing vs O(mn) per-query naive scanning. **Difference arrays** handle range updates + point queries efficiently (O(1) update, O(n) query) — switch to Fenwick/segment tree when you need range updates + range queries.

| Variant                | Preprocess | Query    | Update           | Best For                                       |
| ---------------------- | ---------- | -------- | ---------------- | ---------------------------------------------- |
| Standard prefix sum    | O(n)       | O(1)     | O(n) rebuild     | Non-negative array, range sum only             |
| Prefix + hashmap       | O(n)       | O(n)     | O(1) per element | Count subarrays with sum=K (handles negatives) |
| Prefix XOR             | O(n)       | O(1)     | O(n) rebuild     | XOR of subarray, finding pairs with XOR=K      |
| 2D prefix              | O(mn)      | O(1)     | O(mn) rebuild    | Matrix rectangle sum queries                   |
| Difference array       | O(n)       | O(n)     | O(1) range       | Range update + point query (e.g., sweep line)  |
| Fenwick / segment tree | O(n log n) | O(log n) | O(log n)         | Dynamic range update + range query             |

Select **prefix sum + two-pointer** when array is non-negative and you need sliding window (O(n) total). Select **prefix + hashmap** when negatives appear in the array or you need to count subarrays with a specific sum. Select **2D prefix** for any matrix region query. Select **difference array** for sweep-line problems where you update ranges and query points. Default to **Fenwick tree** when updates and queries are interleaved.

---

**Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)
