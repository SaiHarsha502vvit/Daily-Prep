# 📌 5. Prefix Sum

> **Navigation**: [← 4. Binary Search](03_binary_search.md) | [Chapter overview](../02_Code_Templates.md) | [6. Frequency Count →](05_frequency_count.md)
> Page 4 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

```
                  PREFIX SUM VISUALIZATION
──────────────────────────────────────────────────

Original Array:
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
└───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5

Prefix Sum Array:
prefix[i] = sum of arr[0] to arr[i-1]
┌───┬───┬───┬───┬───┬────┬────┐
│ 0 │ 1 │ 3 │ 6 │ 10│ 15 │ 21 │
└───┴───┴───┴───┴───┴────┴────┘
  0   1   2   3   4    5    6
  ↑
Extra 0 at start!

prefix[0] = 0                 (empty prefix)
prefix[1] = 1                 (sum of arr[0])
prefix[2] = 1+2 = 3           (sum of arr[0..1])
prefix[3] = 1+2+3 = 6         (sum of arr[0..2])
prefix[4] = 1+2+3+4 = 10      (sum of arr[0..3])
prefix[5] = 1+2+3+4+5 = 15    (sum of arr[0..4])
prefix[6] = 1+2+3+4+5+6 = 21  (sum of arr[0..5])

═══════════════════════════════════════════════════════════════════════

Range sum [i, j] = prefix[j+1] - prefix[i]

Example: Sum of arr[2..4] = sum(3,4,5) = 12
         = prefix[5] - prefix[2] = 15 - 3 = 12 ✓

┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
└───┴───┴───┴───┴───┴───┘
          └───────────┘
          i=2      j=4
          sum = 3+4+5 = 12
```

## Template: Build Prefix Sum

```java
/**
 * PREFIX SUM - Build and Query
 * Build: O(N), Query: O(1)
 */
public class PrefixSum {
    private int[] prefix;

    // Build prefix sum array
    public PrefixSum(int[] arr) {
        int n = arr.length;
        prefix = new int[n + 1];  // Extra element at start
        prefix[0] = 0;

        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + arr[i];
        }
    }

    // Query sum in range [left, right] (inclusive)
    public int rangeSum(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}

// Usage:
// int[] arr = {1, 2, 3, 4, 5, 6};
// PrefixSum ps = new PrefixSum(arr);
// ps.rangeSum(2, 4)  // Returns 12 (3+4+5)
```

## Template: Subarray Sum Equals K

```java
/**
 * VISUAL: Count subarrays with sum = K
 *
 * Key insight:
 * If prefix[j] - prefix[i] = K
 * Then subarray [i+1, j] has sum K
 *
 * So we look for: prefix[j] - K = prefix[i]
 * "How many prefix sums equal (current_prefix - K)?"
 */
public int subarraySum(int[] arr, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty prefix has sum 0

    int count = 0;
    int currentSum = 0;

    for (int num : arr) {
        currentSum += num;  // Update running prefix sum

        // How many prefix sums equal (currentSum - k)?
        // Each such prefix means there's a subarray summing to k
        int complement = currentSum - k;
        count += prefixCount.getOrDefault(complement, 0);

        // Record this prefix sum
        prefixCount.put(currentSum, prefixCount.getOrDefault(currentSum, 0) + 1);
    }
    return count;
}
```

---

🔬 **Section Challenge — 📌 5. Prefix Sum**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

> [!NOTE]
> **Open Source Reference: Dynamic Prefix Sums**
>
> - [atcoder/ac-library/fenwicktree](https://github.com/atcoder/ac-library/blob/master/atcoder/fenwicktree.hpp) -> **Invariant:** Each node `i` stores the sum of a specific range of elements, leveraging binary representations to achieve $O(\log N)$ updates and queries.
> - **Local rewrite:** While static arrays are $O(N)$ build and $O(1)$ query, Fenwick trees (Binary Indexed Trees) are used when the underlying array values are being updated concurrently with range queries.
> - **Constraint warning:** Fenwick trees only work for invertible operations (like addition/subtraction, XOR) because range queries depend on `prefix(R) - prefix(L-1)`. They cannot be used for `min()` or `max()` queries.

---

[← 4. Binary Search](03_binary_search.md) | [Chapter overview](../02_Code_Templates.md) | [6. Frequency Count →](05_frequency_count.md)
