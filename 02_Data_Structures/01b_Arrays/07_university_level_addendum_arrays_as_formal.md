# 🎓 University-Level Addendum — Arrays as Formal Theory

> **Navigation**: [← Frequency & Duplicates](06_frequency_duplicates.md) | [Chapter overview](../01b_Arrays.md)
> Page 7 of 7 in **Arrays**


> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. It assumes you have read the body above; the content here formalizes the intuition behind array algorithms with proofs, constraint enumeration, and explicit failure modes. Cross-references to `01a_Memory_Foundations.md` for the underlying memory layout theory.

## Array Constraint Signals — Read These First

Before choosing an array algorithm, read these constraint signals from the problem statement. They determine whether the array is the right DS and which algorithm family applies.

| Signal | What It Tells You | Example |
|---|---|---|
| **`n ≤ 10³`** | Brute force O(n²) is fine; choose simplest algorithm | Sorting + nested loop |
| **`n ≤ 10⁵`** | O(n log n) needed; merge sort, heap, balanced BST | Kadane's, sliding window |
| **`n ≤ 10⁶`** | O(n) required; single pass, two pointers, prefix sums | Sub-array sum |
| **`n ≥ 10⁷`** | Memory becomes the bottleneck; O(1) extra space mandatory | Streaming problems |
| **Random access required** | Array beats linked list (O(1) vs O(n)) | Direct index lookup |
| **Insert/delete in middle** | Linked list may beat array (O(1) vs O(n)) | Frequent edits |
| **Memory budget < 4 × n × sizeof(T)** | Compact array / bitset | Boolean grid |
| **Array sorted** | Binary search O(log n), two pointers O(n) | Search in sorted |
| **Array unsorted** | Hash-based O(n) or sort-then-search O(n log n) | Two-sum |
| **2D array** | Cache-friendly traversal order matters (row-major) | Matrix problems |

These are the same constraint signals at the heart of `02_PROBLEM_SETS.md` Model 1. Master them once and the algorithm choice becomes mechanical.

### Worked Example — Picking Algorithm from Constraints

**Problem:** Find the maximum sum of any contiguous subarray.

- n = 10⁵, time budget = 1 second, memory budget = O(1)
- **Reading constraints:** n ≤ 10⁵ → O(n log n) or O(n) needed; O(n²) (brute force) is too slow.
- **Brute force:** Try all O(n²) subarrays, sum each → O(n³) → ~10¹⁵ ops → 1,000 seconds. Fails.
- **Optimized:** Kadane's algorithm → O(n) single pass → ~10⁵ ops → 0.0001 seconds. Passes.
- **DS choice:** Contiguous array (the input itself); no auxiliary DS needed. ✅

## When Arrays Break — Formal Failure Modes

An array's invariants (contiguity, random access, bounded size) can be violated. The following are the canonical "when arrays break" scenarios that every algorithm must defend against.

### Break 1 — Out-of-Bounds Access

**Condition:** Index `i` is negative, ≥ length, or computed from another index that overflowed.

> [!CAUTION]
> **What breaks:** `ArrayIndexOutOfBoundsException` in Java; undefined behavior in C/C++; silent corruption in Fortran if the array is on the stack and the out-of-bounds location is reused.

**Invariant violated:** `0 ≤ i < arr.length` for every access. Algorithms that compute indices (e.g., `i = left + (right - left) / 2` for binary search) must prove the index stays in bounds for the entire loop.

> [!TIP]
> **Defense:** Test boundary cases (`i = 0`, `i = length - 1`, `i = length`) explicitly. Use checked arithmetic for index computation.

### Break 2 — Resize Cost Amortization Failure

**Condition:** An algorithm repeatedly appends to an array that needs to grow. If growth is not geometric (e.g., `+1` per resize), the total cost is O(n²), not O(n).

> [!CAUTION]
> **What breaks:** A `n = 10⁶` append becomes 10¹² ops → 1,000 seconds instead of 1 second. The `ArrayList` in Java uses 1.5× growth; `Vector` (legacy) uses 2×; both are correct, but a custom implementation that grows by `+1` is broken.

**Invariant violated:** Amortized O(1) per append requires geometric growth. The proof (geometric series, sum ≤ 2n) is in `01g_DS_Internals.md` Challenge 1.

> [!TIP]
> **Defense:** Always check the growth factor. Linear growth is a bug.

### Break 3 — Cache-Line Trashing on Column-Major Traversal

**Condition:** 2D array iterated in column-major order when stored in row-major memory (the C/Java/Fortran default).

> [!CAUTION]
> **What breaks:** Every access misses the cache line. For an N×M matrix, total cache misses are M×N instead of N + M/16. See `01a_Memory_Foundations.md` Challenge 3 for the 1,000× slowdown demonstration.

**Invariant violated:** Spatial locality: consecutive memory accesses should be within the same cache line (64 bytes = 16 `int`s). Column-major access in row-major memory breaks this.

> [!TIP]
> **Defense:** Use row-major order in row-major memory. For column-major data (e.g., from a Fortran library), transpose first or use blocked algorithms.

### Break 4 — Memory Fragmentation with Variable-Length Rows

**Condition:** Java `int[][]` is an array of references to inner arrays. Each inner array is a separate heap allocation. If inner rows are allocated with different sizes (jagged array), fragmentation occurs.

> [!CAUTION]
> **What breaks:** Outer array fits in cache; inner arrays scatter across the heap. Iteration in row-major order pays one cache miss per row on average instead of amortizing across the row.

**Invariant violated:** A 2D array stored row-major must have contiguous rows. Ragged arrays break this invariant.

> [!TIP]
> **Defense:** Use a 1D array with manual indexing (`arr[row * cols + col]`) when memory locality matters.

### Break 5 — Integer Overflow on Size Computation

**Condition:** Computing `n * sizeof(T)` or `2 * size` where the result exceeds `Integer.MAX_VALUE`.

> [!CAUTION]
> **What breaks:** Negative array length → `NegativeArraySizeException`; wrong size allocated → OOB write on first element.

**Invariant violated:** Array size must be a non-negative integer. The OS allocates memory in pages, so the size must also be representable as `size_t` (typically 64-bit).

> [!TIP]
> **Defense:** Use `long` for size arithmetic. Allocate via `Math.toIntExact(longValue)` to detect overflow explicitly.

### Break 6 — Aliasing in In-Place Algorithms

**Condition:** In-place reversal, rotation, or partition algorithms that use two pointers moving toward each other. If the two pointers reference overlapping memory (e.g., the same subarray), the swap corrupts data.

> [!CAUTION]
> **What breaks:** In-place reversal of a palindrome (`[1, 2, 1]` → swap(0, 2) gives `[1, 2, 1]`, then swap(1, 1) is a no-op — works). But for an even-length palindrome (`[1, 2, 2, 1]` → swap(0, 3) gives `[1, 2, 2, 1]`, then swap(1, 2) gives `[1, 2, 2, 1]`, then loop terminates — works). The bug surfaces with `arr == reverseInPlace(arr)` when `arr.length == 1`.

**Invariant violated:** `i < j` for the entire loop. When `i == j`, the algorithm must terminate.

> [!TIP]
> **Defense:** Use `while (i < j)` (strict), not `while (i <= j)`.

## Brute-Force to Optimal Ladder — Array Problems

The canonical ladder for array problems, with explicit cost progression:

| Tier | Approach | Cost | When Acceptable |
|---|---|---|---|
| **L0 — All subarrays** | Enumerate every O(n²) subarray, check each | O(n³) total | n ≤ 500 |
| **L1 — All subarrays, summed incrementally** | Enumerate subarrays, sum on the fly | O(n²) | n ≤ 5,000 |
| **L2 — Prefix sums** | Precompute prefix array, answer each query in O(1) | O(n) preprocess + O(1) query | n ≤ 10⁵ |
| **L3 — Single pass** | Maintain running state (Kadane's, two pointers) | O(n) | n ≤ 10⁶ |
| **L4 — Streaming** | O(1) memory, O(n) time, single pass with limited lookback | O(n) | n ≥ 10⁷ |

The ladder is the array-specific counterpart to the memory-cost ladder in `01a_Memory_Foundations.md`. Pick the lowest tier that meets the time budget.

### Worked Example — Maximum Subarray Sum

**Input:** `arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`, n = 9.

- **L0 — All subarrays:** O(n³) → enumerate all 36 subarrays, sum each. Result: 6 (`[4, -1, 2, 1]`).
- **L1 — Prefix sums:** O(n²) → compute prefix sums, enumerate subarrays. Result: 6.
- **L2 — Prefix + max query:** O(n) preprocess → prefix[i] - prefix[j] = subarray sum. Result: 6.
- **L3 — Kadane's:** O(n) single pass → track running max, reset on negative. Result: 6.
- **L4 — Streaming:** Same as L3, but with bounded lookback window.

For n = 10⁵, only L2, L3, L4 complete in time. L3 (Kadane's) is the standard answer; L4 is the engineering choice if memory is bounded.

## Edge Cases — Always Check These

Every array algorithm must enumerate these in its correctness argument. Skipping one is a common source of bugs.

| # | Edge Case | What Can Break |
|---|---|---|
| 1 | **Empty array** (`n = 0`) | Off-by-one in size; loop never enters; max/min returns sentinel (Java: `Optional.empty()`) |
| 2 | **Single element** (`n = 1`) | Trivial case hides init bugs; max = min = arr[0] |
| 3 | **All same elements** (`arr = [5, 5, 5, 5]`) | Binary search assumes strict ordering; returns wrong index |
| 4 | **Sorted ascending** | BST degeneracy if used; binary search works |
| 5 | **Sorted descending** | Mirror of #4 |
| 6 | **Negative numbers only** | Max-product algorithms break if they assume ≥ 0 |
| 7 | **Mixed positive/negative** | Kadane's invariant: reset running sum when negative |
| 8 | **Integer overflow in sum** | `n * MAX_VALUE` exceeds `int`; use `long` |
| 9 | **Duplicate max/min values** | First/last occurrence semantics differ (stable vs unstable) |
| 10 | **NaN in floating-point arrays** | All comparisons with NaN return false; max/min returns first non-NaN |

## Formal Complexity Proofs — Array Operations

These derivations make the Big-O statements throughout the chapter precise.

### Random Access

For `arr[i]`:

```
T_random_access(arr, i) = T_base + sizeof(T) * i / cache_line_size * T_RAM
                         + sizeof(T) * (i mod 16) * T_L1
                         ≈ T_L1 for i in same cache line as previous access
                         ≈ T_RAM for cold random access (uniform i)
```

**Average case (uniform random i over N elements):**

```
E[T] = (N / 16) * T_RAM + (1 - N/16) * T_L1
     ≈ T_L1 + (N / 16) * (T_RAM - T_L1)
```

For N = 10⁶ with T_L1 = 1 ns and T_RAM = 100 ns, E[T] ≈ 1 + 62,500 × 99 ≈ 6.2 μs per access.

### Sequential Traversal

For `arr[0..n-1]` in order:

```
T_sequential(n) = n * T_L1     (after first cold miss brings cache line)
                ≈ n * 1 ns      = 1 ms for n = 10⁶
```

vs random access: 6.2 μs × 10⁶ = 6.2 seconds. Sequential is 6,000× faster — this is why `for (i = 0; i < n; i++) sum += arr[i]` outperforms `while (true) { int i = rand() % n; sum += arr[i]; }` by orders of magnitude.

### Prefix Sum Precompute

```
T_prefix_precompute(n) = O(n) additions
T_prefix_query(l, r)   = O(1) — one subtraction
T_total(q queries)     = O(n + q)
```

This is the L2 tier in the brute-force ladder; the win is amortizing precompute over many queries.

### Resize Cost (Geometric Growth)

For `ArrayList`-style 1.5× growth:

```
T_resize_amortized(n) = O(1) per append
                       because sum(1 + 1/1.5 + 1/1.5² + ... + 1/1.5^k) = 1/(1 - 1/1.5) = 3
```

The geometric series proof: each element is copied at most `log_{1.5}(n)` times, so total copies ≤ `n * log_{1.5}(n)` / `n` = `log_{1.5}(n)` ≈ 32 for n = 10⁶. Amortized O(1) per append.

For linear growth (`+1` per resize), the same proof gives `O(n)` per append — quadratic total. **Always use geometric growth.**

## Cross-References

- **`01a_Memory_Foundations.md`** — memory layout invariants, cache-line analysis, and the brute-force memory cost ladder.
- **`01c_LinkedList.md`** — the alternative to arrays when insert/delete at arbitrary position dominates; pointer-chasing cost analysis.
- **`01g_DS_Internals.md`** — ArrayList resize proof (geometric series), escape analysis for primitive arrays.
- **`02_PROBLEM_SETS.md`** — exam-style problems on arrays (Kadane's invariant, address-formula derivation, rotation proof).
- **`A2_DS_Complexity_FirstPrinciples.md`** — formal Big-O derivations for all array operations.
- **`A3_DS_Lower_Bounds.md`** — proves Ω(n log n) lower bound on comparison-based array sorting.

---

## 💥 When Arrays Break

> Every one of these has caused a real production bug. Know the failure mode before you need to debug it.

### 1. Integer Overflow in Binary Search Mid Calculation
**What breaks**: `int mid = (lo + hi) / 2` overflows when `lo + hi > Integer.MAX_VALUE` (≈ 2.1 billion). The sum wraps to a negative number → mid is negative → `ArrayIndexOutOfBoundsException`.
**History**: This bug lived in textbooks since 1946 and was in Java's `Arrays.binarySearch()` from 1997 until Joshua Bloch reported it at Google in 2006.
**Fix**: `int mid = lo + (hi - lo) / 2;` — equivalent result, no overflow.
**Production scope**: Any binary search on an array of size > 1 billion elements (common in distributed sorted datasets).

📎 **Reference Anchor**: [OpenJDK Arrays.binarySearch()](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/Arrays.java)
**Invariant learned**: The invariant `lo ≤ target_index ≤ hi` must hold at every step. The correct mid formula preserves this by staying within the [lo, hi] range even at Integer boundary values.

### 2. Off-By-One in Two-Pointer Shrink Condition
**What breaks**: Using `<` instead of `<=` (or vice versa) in sliding-window or two-pointer shrink condition. Classic example in longest substring without repeating characters:
```java
// BUG — uses < instead of >:
while (charCount.get(s.charAt(right)) < 1) { // should be > 1
    charCount.merge(s.charAt(left++), -1, Integer::sum);
}
```
**Root cause**: The shrink condition decides when the window is invalid. Getting `<` vs `>` backwards admits invalid windows silently — no exception, just wrong answers.
**Fix**: Write the invariant explicitly first: "the window is valid when all char counts ≤ 1." Shrink when any count > 1.

### 3. 2D Array Row-Major vs Column-Major Access Pattern
**What breaks**: Iterating a 2D array in the wrong order causes cache misses on every element.
```java
// SLOW — column-major access on a row-major array:
for (int col = 0; col < N; col++)
    for (int row = 0; row < N; row++)
        sum += matrix[row][col];  // jumps N elements between accesses

// FAST — row-major access:
for (int row = 0; row < N; row++)
    for (int col = 0; col < N; col++)
        sum += matrix[row][col];  // sequential in memory
```
**Impact**: For a 1000×1000 `int[][]`, the slow version can be 5–10× slower due to cache misses. Java 2D arrays are arrays of references to row arrays (row-major), so row-sequential access is always cache-friendly.

### 4. Sorting Parallel Arrays Destroys Correlation
**What breaks**: When two arrays represent related data (e.g., `names[]` and `scores[]`), sorting one array by value breaks the index correspondence with the other.
```java
Arrays.sort(scores);  // now scores[0] is the lowest score,
                      // but names[0] is still the original first person
                      // → correlation destroyed
```
**Fix**: Use an array of objects (`record Person(String name, int score)`) or sort indices instead: `Integer[] idx = ...; Arrays.sort(idx, (a,b) -> scores[a] - scores[b]);`

### 5. `Arrays.asList()` Returns a Fixed-Size List
**What breaks**: `Arrays.asList(1, 2, 3)` returns a fixed-size list backed by the array. Calling `.add()` or `.remove()` throws `UnsupportedOperationException`.
**Root cause**: `Arrays.asList()` returns `Arrays.ArrayList` — not `java.util.ArrayList`. It wraps the array without copying.
**Fix**: `new ArrayList<>(Arrays.asList(...))` creates a mutable copy. Or `List.of(...)` (Java 9+) for an immutable list with a clearer contract.

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Correctness — 8 min)**: State the loop invariant for standard binary search and use it to prove the algorithm is correct and terminates.

<details><summary>Model Answer</summary>

**Invariant**: At the start of each iteration, if `target` exists in the array, it is in `arr[lo..hi]`.

- **Init**: `lo=0, hi=n-1` — the entire array. If target exists, it's here. ✓
- **Maintenance**: We compute `mid = lo + (hi-lo)/2`. If `arr[mid] == target` → return mid. If `arr[mid] < target` → target can only be in `arr[mid+1..hi]`, so `lo = mid+1`. If `arr[mid] > target` → target can only be in `arr[lo..mid-1]`, so `hi = mid-1`. In each case, the invariant holds for the new range. ✓
- **Termination**: Each iteration reduces `hi - lo` by at least 1 (since `mid` is strictly between lo and hi when `hi > lo`). When `lo > hi`, the range is empty → target is not present, return -1. ✓

</details>

---

**Problem 2 (Analysis — 5 min)**: Prove that a dynamic array with geometric growth factor r > 1 achieves O(1) amortised append.

<details><summary>Model Answer</summary>

**Potential function**: Φ = 2 × (current size) − capacity.

When the array is at size k with capacity k (full):
- Actual cost of append with resize: copy k elements + insert 1 = k+1.
- New capacity = r×k; new Φ = 2(k+1) − rk.
- Old Φ = 2k − k = k.
- Amortised = (k+1) + (2(k+1) − rk) − k = 3 + (2−r)k.
- For r=2: amortised = 3 − 0 = 3 = **O(1)**. ✓

When append does NOT trigger resize (normal case): actual cost = 1; Φ increases by 2; amortised = 3. ✓

</details>

---

**Problem 3 (Reasoning — 5 min)**: An array contains n distinct integers. Describe an O(n) algorithm to find the single missing integer in range [1, n+1] without using extra space.

<details><summary>Model Answer</summary>

> [!TIP]
> **Key insight:** Sum of integers 1 to (n+1) = (n+1)(n+2)/2. The actual sum of the array is some value S. The missing integer = (n+1)(n+2)/2 − S.

```java
int missing = (n+1)*(n+2)/2;
for (int x : arr) missing -= x;
return missing;
```

**Complexity**: O(n) time, O(1) extra space. No sorting, no hash set needed.

**Overflow note**: For large n, use `long` arithmetic. `(long)(n+1)*(n+2)/2` avoids int overflow.

</details>

---

[← Frequency & Duplicates](06_frequency_duplicates.md) | [Chapter overview](../01b_Arrays.md)
