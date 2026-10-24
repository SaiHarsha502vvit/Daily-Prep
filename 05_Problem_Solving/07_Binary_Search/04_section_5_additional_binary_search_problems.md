# SECTION 5: Additional Binary Search Problems

> **Navigation**: [← 6.4 Binary Search on Answer](03_binary_search_on_answer.md) | [Chapter overview](../07_Binary_Search.md)
> Page 4 of 4 in **Binary Search**


## Problem 13: Find Peak Element

**LeetCode 162** | **Difficulty:** Medium

**FIND PEAK ELEMENT (LeetCode 162 - Medium)**

```text
A peak element is strictly greater than its neighbors.
Return index of ANY peak. nums[-1] = nums[n] = -∞.

Example: nums = [1,2,3,1]  →  Output: 2 (nums[2]=3 is peak)

KEY: If nums[mid] < nums[mid+1], peak must be on right side.
TIME: O(log n) | SPACE: O(1)
```

```java
public int findPeakElement(int[] nums) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < nums[mid + 1])
            left = mid + 1;  // peak is on right
        else
            right = mid;     // mid could be peak
    }
    return left;
}
```

---

## Problem 14: Search a 2D Matrix

**LeetCode 74** | **Difficulty:** Medium

**SEARCH A 2D MATRIX (LeetCode 74 - Medium)**

```text
Each row sorted left to right. First int of each row > last of prev.
Determine if target exists in matrix.

Example:
matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
Output: true

KEY: Treat as sorted 1D array. index → row=idx/cols, col=idx%cols
TIME: O(log(m*n)) | SPACE: O(1)
```

```java
public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int left = 0, right = m * n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        int val = matrix[mid / n][mid % n];

        if (val == target) return true;
        else if (val < target) left = mid + 1;
        else right = mid - 1;
    }
    return false;
}
```

---

## Problem 15: Time Based Key-Value Store

**LeetCode 981** | **Difficulty:** Medium

**TIME BASED KEY-VALUE STORE (LeetCode 981 - Medium)**

```text
set(key, value, timestamp) — store key-value with timestamp
get(key, timestamp) — return value with largest timestamp <= given

Example:
set("foo","bar",1), get("foo",1) → "bar"
get("foo",3) → "bar", set("foo","bar2",4), get("foo",5) → "bar2"

KEY: Binary search on timestamps for each key.
TIME: set O(1), get O(log n) | SPACE: O(n)
```

```java
class TimeMap {
    Map<String, List<int[]>> map; // key → list of [timestamp, valueIndex]
    List<String> values;

    // Simpler approach: store timestamps and values together
    Map<String, TreeMap<Integer, String>> store;

    public TimeMap() {
        store = new HashMap<>();
    }

    public void set(String key, String value, int timestamp) {
        store.computeIfAbsent(key, k -> new TreeMap<>()).put(timestamp, value);
    }

    public String get(String key, int timestamp) {
        if (!store.containsKey(key)) return "";
        TreeMap<Integer, String> tree = store.get(key);
        Integer floor = tree.floorKey(timestamp);
        return floor == null ? "" : tree.get(floor);
    }
}
```

---

## Problem 16: Median of Two Sorted Arrays

**LeetCode 4** | **Difficulty:** Hard

**MEDIAN OF TWO SORTED ARRAYS (LeetCode 4 - Hard)**

```text
Given two sorted arrays nums1 and nums2, return the median.
Overall runtime must be O(log(m+n)).

Example:
nums1 = [1,3], nums2 = [2]  →  Output: 2.0
nums1 = [1,2], nums2 = [3,4]  →  Output: 2.5

KEY: Binary search on partition of shorter array.
Split both arrays so left half has (m+n+1)/2 elements.
TIME: O(log(min(m,n))) | SPACE: O(1)
```

```java
public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    // Ensure nums1 is shorter
    if (nums1.length > nums2.length)
        return findMedianSortedArrays(nums2, nums1);

    int m = nums1.length, n = nums2.length;
    int left = 0, right = m;

    while (left <= right) {
        int i = left + (right - left) / 2;  // partition in nums1
        int j = (m + n + 1) / 2 - i;        // partition in nums2

        int maxLeft1 = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
        int minRight1 = (i == m) ? Integer.MAX_VALUE : nums1[i];
        int maxLeft2 = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
        int minRight2 = (j == n) ? Integer.MAX_VALUE : nums2[j];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            if ((m + n) % 2 == 0)
                return (Math.max(maxLeft1, maxLeft2) +
                        Math.min(minRight1, minRight2)) / 2.0;
            else
                return Math.max(maxLeft1, maxLeft2);
        } else if (maxLeft1 > minRight2) {
            right = i - 1;
        } else {
            left = i + 1;
        }
    }
    return 0.0;
}
```

---

## Problem 17: Magnetic Force Between Two Balls

**LeetCode 1552** | **Difficulty:** Medium

**MAGNETIC FORCE BETWEEN TWO BALLS (LeetCode 1552 - Medium)**

```text
Place m balls in basket positions to maximize minimum magnetic force
(distance) between any two balls.

Example:
position = [1,2,3,4,7], m = 3  →  Output: 3
Place at positions 1, 4, 7 → min distance = 3

KEY: Binary search on answer (minimum distance).
For each candidate distance, greedily check if m balls fit.
TIME: O(n log(maxDist)) | SPACE: O(1)
```

```java
public int maxDistance(int[] position, int m) {
    Arrays.sort(position);
    int left = 1;
    int right = position[position.length - 1] - position[0];

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (canPlace(position, m, mid))
            left = mid + 1;   // try larger distance
        else
            right = mid - 1;  // distance too large
    }
    return right;
}

private boolean canPlace(int[] position, int m, int minDist) {
    int count = 1, lastPos = position[0];
    for (int i = 1; i < position.length; i++) {
        if (position[i] - lastPos >= minDist) {
            count++;
            lastPos = position[i];
            if (count >= m) return true;
        }
    }
    return false;
}
```

---

---

---

## Historical Evolution

Binary search was described in John Mauchly's 1946 Moore School lectures. Knuth (*TAOCP* Vol. 3, 1973) notes that the first published version correct for every array size appeared in 1962 (H. Bottenbruch). Bentley reported in *Programming Pearls* that most professional programmers could not write it correctly on the first try, and Joshua Bloch (2006) showed that the midpoint expression `(low + high) / 2` could overflow in widely used library code; the safe form is `low + (high - low) / 2`.

- **Mauchly — 1946**: Early description of binary search
- **Bottenbruch — 1962**: First published version correct for all `n` (per Knuth)
- **Knuth — 1973**: Definitive analysis in TAOCP Vol. 3
- **Bloch — 2006**: Midpoint-overflow bug in a standard library

## 🌍 Real-World Applications of Binary Search

| Technique              | Real-World System              | How It's Used                                                              |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| **Classic BS**         | Database B-Tree index          | Search through sorted leaf pages — log(n) disk seeks                       |
| **Lower/Upper Bound**  | Java's `Arrays.binarySearch()` | Used in sorting, deduplication, range queries                              |
| **BS on Answer**       | CDN load balancing             | "Minimum server capacity to handle K requests" = BS on capacity            |
| **Git bisect**         | Git version control            | Binary search through commit history to find which commit introduced a bug |
| **IP Routing table**   | Internet routers               | Longest prefix match = binary search on sorted IP prefix table             |
| **sqrt decomposition** | Database query optimization    | BS approximation for square root in range query blocks                     |

```
🔥 REAL-WORLD INTERVIEW STORY:
   "Git bisect is binary search on your commit history.
    git bisect good <oldcommit> bad <newcommit>
    → git checks out the middle commit automatically → O(log n) bug finding"
```

---

---

---

### Production Reality

**Binary Search** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Integer overflow in midpoint calculation.** Using `mid = (left + right) / 2` works for small arrays but overflows when `left + right > 2^31 - 1` (Java `int`), causing negative `mid` and `ArrayIndexOutOfBoundsException`. Example: with `left = 1_500_000_000` and `right = 1_500_000_001`, `left + right = 3_000_000_001` wraps to a negative `int`, so `mid` is negative and indexing throws. This is the bug Joshua Bloch reported in 2006 for the JDK's `Arrays.binarySearch`.

**Failure mode 2: Off-by-one in lower/upper bound logic.** When searching for insertion point or first/last occurrence, swapping `lo < hi` vs `lo <= hi` causes either infinite loops or missed boundary cases. A subtle variant: using `mid = (lo + hi) / 2` with `lo = mid` on the left boundary causes stagnation. Illustrative impact: AWS Lambda's cold-start optimization used binary search to find the optimal instance pool size; off-by-one errors caused some functions to never warm up, resulting in 30-second cold starts on production traffic.

**Debug workflow:** (1) Always use `mid = lo + (hi - lo) / 2` to prevent overflow. (2) Verify termination: `assert(lo < hi)` inside the loop, `assert(lo == hi)` after. (3) Test boundary conditions: empty array, single element (target present and absent), target smaller than all elements, target larger than all elements, all elements equal. (4) Add maximum iteration guard: `assert(iterations < 64)` since binary search converges in log2(n) steps.

**Real-world anchor:** In 2006 Joshua Bloch reported that `Arrays.binarySearch` in the JDK computed `(low + high) / 2`, which overflows for arrays with more than about 2³⁰ elements. The same bug had been present in a version published decades earlier; the fix is `low + (high - low) / 2` (or `>>> 1`).

---

[← 6.4 Binary Search on Answer](03_binary_search_on_answer.md) | [Chapter overview](../07_Binary_Search.md)
