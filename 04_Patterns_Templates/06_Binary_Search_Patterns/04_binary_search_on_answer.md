# Binary Search on Answer <a name="binary-answer"></a>

> **Navigation**: [← Search in Rotated Array](03_search_in_rotated_array.md) | [Chapter overview](../06_Binary_Search_Patterns.md)
> Page 4 of 4 in **Binary Search Patterns — Pattern Guide**


## The Concept

```
┌─────────────────────────────────────────────────────────────────┐
│           BINARY SEARCH ON ANSWER PATTERN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When: You're not searching IN an array, but searching FOR      │
│        an optimal value in a range.                             │
│                                                                 │
│  Pattern:                                                       │
│  1. Define search space: [min_possible, max_possible]           │
│  2. Define feasibility function: canAchieve(answer)             │
│  3. Binary search for boundary where answer becomes feasible    │
│                                                                 │
│  Examples:                                                      │
│  • Minimum capacity to ship packages in D days                  │
│  • Maximum minimum distance between elements                    │
│  • Kth smallest element in sorted matrix                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Template: Binary Search on Answer

```java
public int binarySearchOnAnswer(int[] data, int constraint) {
    int left = minPossibleAnswer;
    int right = maxPossibleAnswer;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canAchieve(data, mid, constraint)) {
            right = mid;      // Try smaller answer
        } else {
            left = mid + 1;   // Need larger answer
        }
    }
    return left;
}

// If maximizing instead of minimizing:
public int binarySearchMax(int[] data, int constraint) {
    int left = minPossibleAnswer;
    int right = maxPossibleAnswer;

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Note: +1 for upper mid

        if (canAchieve(data, mid, constraint)) {
            left = mid;       // Try larger answer
        } else {
            right = mid - 1;  // Need smaller answer
        }
    }
    return left;
}
```

## Problem: Ship Packages in D Days (LeetCode 1011)

```java
/*
Weights must be shipped in order, within D days.
Find minimum ship capacity.
*/

public int shipWithinDays(int[] weights, int days) {
    // Min capacity = max single weight (or can't ship it)
    // Max capacity = sum of all weights (ship all in 1 day)
    int left = 0, right = 0;
    for (int w : weights) {
        left = Math.max(left, w);
        right += w;
    }

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canShip(weights, mid, days)) {
            right = mid;      // Try smaller capacity
        } else {
            left = mid + 1;   // Need more capacity
        }
    }
    return left;
}

private boolean canShip(int[] weights, int capacity, int days) {
    int daysNeeded = 1;
    int currentLoad = 0;

    for (int w : weights) {
        if (currentLoad + w > capacity) {
            daysNeeded++;
            currentLoad = 0;
        }
        currentLoad += w;
    }
    return daysNeeded <= days;
}
```

## Problem: Koko Eating Bananas (LeetCode 875)

```java
/*
Koko eats at speed k bananas/hour.
Find minimum k to finish all piles in h hours.
*/

public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = 0;
    for (int p : piles) right = Math.max(right, p);

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canFinish(piles, mid, h)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int speed, int hours) {
    int hoursNeeded = 0;
    for (int pile : piles) {
        hoursNeeded += (pile + speed - 1) / speed;  // Ceiling division
    }
    return hoursNeeded <= hours;
}
```

## Problem: Split Array Largest Sum (LeetCode 410)

```java
/*
Split array into m subarrays.
Minimize the maximum sum among subarrays.
*/

public int splitArray(int[] nums, int m) {
    int left = 0, right = 0;
    for (int num : nums) {
        left = Math.max(left, num);
        right += num;
    }

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canSplit(nums, mid, m)) {
            right = mid;      // Try smaller max sum
        } else {
            left = mid + 1;   // Need larger max sum
        }
    }
    return left;
}

private boolean canSplit(int[] nums, int maxSum, int m) {
    int count = 1;
    int currentSum = 0;

    for (int num : nums) {
        if (currentSum + num > maxSum) {
            count++;
            currentSum = num;
        } else {
            currentSum += num;
        }
    }
    return count <= m;
}
```

## Problem: Magnetic Force Between Balls (LeetCode 1552)

```java
/*
Place m balls in positions to MAXIMIZE minimum distance.
Classic "maximize the minimum" problem.
*/

public int maxDistance(int[] positions, int m) {
    Arrays.sort(positions);
    int n = positions.length;

    int left = 1;  // Min possible distance
    int right = positions[n-1] - positions[0];  // Max possible

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Upper mid for maximize

        if (canPlace(positions, mid, m)) {
            left = mid;       // Try larger distance
        } else {
            right = mid - 1;  // Need smaller distance
        }
    }
    return left;
}

private boolean canPlace(int[] positions, int minDist, int m) {
    int count = 1;
    int lastPos = positions[0];

    for (int i = 1; i < positions.length; i++) {
        if (positions[i] - lastPos >= minDist) {
            count++;
            lastPos = positions[i];
        }
    }
    return count >= m;
}
```

---

## 2D Binary Search <a name="2d-search"></a>

### Search 2D Matrix (LeetCode 74)

```java
/*
Matrix: each row sorted, first element > last of previous row.
Treat as 1D sorted array.
*/

public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int left = 0, right = m * n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        int value = matrix[mid / n][mid % n];  // Convert to 2D indices

        if (value == target) {
            return true;
        } else if (value < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return false;
}
```

### Search 2D Matrix II (LeetCode 240)

```java
/*
Matrix: rows sorted, columns sorted, but NOT like matrix I.
Use staircase search: start from top-right or bottom-left.
*/

public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int row = 0, col = n - 1;  // Start top-right

    while (row < m && col >= 0) {
        if (matrix[row][col] == target) {
            return true;
        } else if (matrix[row][col] > target) {
            col--;  // Eliminate column
        } else {
            row++;  // Eliminate row
        }
    }
    return false;
}
// Time: O(m + n)
```

### Kth Smallest in Sorted Matrix (LeetCode 378)

```java
/*
Matrix with sorted rows and columns.
Find kth smallest element.
Binary search on VALUE, count elements <= mid.
*/

public int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length;
    int left = matrix[0][0];
    int right = matrix[n-1][n-1];

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (countLessOrEqual(matrix, mid) >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private int countLessOrEqual(int[][] matrix, int target) {
    int n = matrix.length;
    int count = 0;
    int row = n - 1, col = 0;  // Start bottom-left

    while (row >= 0 && col < n) {
        if (matrix[row][col] <= target) {
            count += row + 1;  // All elements in this column up to row
            col++;
        } else {
            row--;
        }
    }
    return count;
}
```

---

## Advanced Patterns <a name="advanced"></a>

### Find Median of Two Sorted Arrays (LeetCode 4)

```java
/*
O(log(min(m,n))) solution using binary search partition.
*/

public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    // Ensure nums1 is smaller
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
    }

    int m = nums1.length, n = nums2.length;
    int left = 0, right = m;

    while (left <= right) {
        int partition1 = (left + right) / 2;
        int partition2 = (m + n + 1) / 2 - partition1;

        int maxLeft1 = (partition1 == 0) ? Integer.MIN_VALUE : nums1[partition1 - 1];
        int minRight1 = (partition1 == m) ? Integer.MAX_VALUE : nums1[partition1];

        int maxLeft2 = (partition2 == 0) ? Integer.MIN_VALUE : nums2[partition2 - 1];
        int minRight2 = (partition2 == n) ? Integer.MAX_VALUE : nums2[partition2];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            // Found correct partition
            if ((m + n) % 2 == 0) {
                return (Math.max(maxLeft1, maxLeft2) +
                        Math.min(minRight1, minRight2)) / 2.0;
            } else {
                return Math.max(maxLeft1, maxLeft2);
            }
        } else if (maxLeft1 > minRight2) {
            right = partition1 - 1;
        } else {
            left = partition1 + 1;
        }
    }
    throw new IllegalArgumentException("Input arrays not sorted");
}
```

### Find Kth Element of Two Sorted Arrays

```java
/*
Generalization of median problem.
*/

public int findKth(int[] nums1, int[] nums2, int k) {
    return findKth(nums1, 0, nums2, 0, k);
}

private int findKth(int[] a, int aStart, int[] b, int bStart, int k) {
    if (aStart >= a.length) return b[bStart + k - 1];
    if (bStart >= b.length) return a[aStart + k - 1];
    if (k == 1) return Math.min(a[aStart], b[bStart]);

    int aMid = aStart + k/2 - 1 < a.length ? a[aStart + k/2 - 1] : Integer.MAX_VALUE;
    int bMid = bStart + k/2 - 1 < b.length ? b[bStart + k/2 - 1] : Integer.MAX_VALUE;

    if (aMid < bMid) {
        return findKth(a, aStart + k/2, b, bStart, k - k/2);
    } else {
        return findKth(a, aStart, b, bStart + k/2, k - k/2);
    }
}
```

### Binary Search with Floating Point

```java
/*
When answer can be floating point, use precision-based termination.
*/

public double squareRoot(double x) {
    double left = 0, right = Math.max(1, x);
    double eps = 1e-10;  // Precision

    while (right - left > eps) {
        double mid = left + (right - left) / 2;
        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid;
        }
    }
    return left;
}

// Alternative: fixed iterations (100 iterations ≈ 2^100 precision)
public double squareRootFixed(double x) {
    double left = 0, right = Math.max(1, x);

    for (int i = 0; i < 100; i++) {
        double mid = left + (right - left) / 2;
        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

## Common Mistakes <a name="mistakes"></a>

### Mistake 1: Infinite Loop

```java
// WRONG: Can cause infinite loop
while (left < right) {
    int mid = (left + right) / 2;
    if (condition) {
        left = mid;      // ❌ If left = mid = right - 1, loops forever
    } else {
        right = mid;
    }
}

// FIX 1: Use mid + 1 when assigning to left
while (left < right) {
    int mid = (left + right) / 2;
    if (condition) {
        left = mid + 1;  // ✓
    } else {
        right = mid;
    }
}

// FIX 2: Or use upper mid when moving left
while (left < right) {
    int mid = (left + right + 1) / 2;  // Upper mid
    if (condition) {
        left = mid;      // ✓ Now safe
    } else {
        right = mid - 1;
    }
}
```

### Mistake 2: Integer Overflow

```java
// WRONG: Can overflow if left + right > Integer.MAX_VALUE
int mid = (left + right) / 2;

// CORRECT: Subtract first
int mid = left + (right - left) / 2;
```

### Mistake 3: Off-by-One in Right Boundary

```java
// Template 1: right = length - 1
int right = nums.length - 1;
while (left <= right) { ... }

// Template 2/3: right = length
int right = nums.length;
while (left < right) { ... }

// Common bug: mixing them up
```

### Mistake 4: Wrong Condition in Rotated Array

```java
// WRONG: Using < instead of <= for sorted check
if (nums[left] < nums[mid])  // ❌ Misses case where left == mid

// CORRECT
if (nums[left] <= nums[mid])  // ✓
```

---

## Interview Problems <a name="interview-problems"></a>

### Quick Problem Classification

```
┌─────────────────────────────────────────────────────────────────┐
│              BINARY SEARCH PROBLEM TYPES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BASIC (Template 1):                                            │
│  - Binary Search, Search Insert Position                        │
│                                                                 │
│  BOUNDARY FINDING (Template 2/3):                               │
│  - First/Last Position of Element                               │
│  - First Bad Version, Find Smallest Letter                      │
│                                                                 │
│  ROTATED ARRAY:                                                 │
│  - Search in Rotated Array I/II                                 │
│  - Find Minimum in Rotated Array I/II                           │
│                                                                 │
│  PEAK FINDING:                                                  │
│  - Find Peak Element, Mountain Array                            │
│                                                                 │
│  BINARY SEARCH ON ANSWER:                                       │
│  - Ship Packages, Koko Bananas, Split Array                     │
│  - Magnetic Force, Capacity to Ship                             │
│                                                                 │
│  2D MATRIX:                                                     │
│  - Search 2D Matrix I/II                                        │
│  - Kth Smallest in Sorted Matrix                                │
│                                                                 │
│  ADVANCED:                                                      │
│  - Median of Two Sorted Arrays                                  │
│  - Longest Increasing Subsequence (with BS)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### First Bad Version (LeetCode 278)

```java
public int firstBadVersion(int n) {
    int left = 1, right = n;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (isBadVersion(mid)) {
            right = mid;      // First bad is at mid or left
        } else {
            left = mid + 1;   // First bad is on right
        }
    }
    return left;
}
```

### Sqrt(x) (LeetCode 69)

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    long left = 1, right = x / 2;

    while (left < right) {
        long mid = left + (right - left + 1) / 2;  // Upper mid for maximize

        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    return (int) left;
}
```

### Find Smallest Letter Greater Than Target (LeetCode 744)

```java
public char nextGreatestLetter(char[] letters, char target) {
    int left = 0, right = letters.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (letters[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    // Wrap around if needed
    return letters[left % letters.length];
}
```

---

## Quick Reference <a name="quick-reference"></a>

### Template Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│              WHICH TEMPLATE TO USE?                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Find exact element"                                           │
│    → Template 1: left <= right                                  │
│                                                                 │
│  "Find first position where condition is true"                  │
│    → Template 2: left < right, right = mid                      │
│                                                                 │
│  "Find last position where condition is true"                   │
│    → Template 3: left < right, left = mid, upper mid            │
│                                                                 │
│  "Minimize answer" (find smallest valid)                        │
│    → Template 2 style                                           │
│                                                                 │
│  "Maximize answer" (find largest valid)                         │
│    → Template 3 style (use upper mid)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Binary Search Checklist

```
Before coding:
□ Is the search space monotonic/sorted?
□ What are the boundaries? (inclusive/exclusive?)
□ What should be returned if not found?

While coding:
□ Use left + (right - left) / 2 to avoid overflow
□ Match while condition with boundary updates
□ Handle the mid boundary case (mid or mid ± 1?)

After coding:
□ Test with empty input
□ Test with single element
□ Test with target at boundaries
□ Test with target not present
□ Test with duplicates (if applicable)
```

### Complexity Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              BINARY SEARCH COMPLEXITIES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Basic Binary Search:        O(log n) time, O(1) space          │
│  Rotated Array Search:       O(log n) time, O(1) space          │
│  Rotated Array w/ Dups:      O(n) worst, O(log n) average       │
│  Binary Search on Answer:    O(log R × f(n)) where R = range    │
│  2D Matrix (sorted):         O(log(m×n))                        │
│  2D Matrix (row/col sorted): O(m + n)                           │
│  Median of Two Arrays:       O(log min(m, n))                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌───────────────────────────────────────────────────────────────┐
│            BINARY SEARCH - MASTER CHECKLIST                   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. MEMORIZE THE 3 TEMPLATES                                  │
│     - T1: Exact match (left <= right)                         │
│     - T2: First true (left < right, right = mid)              │
│     - T3: Last true (left < right, left = mid, upper mid)     │
│                                                               │
│  2. BINARY SEARCH ON ANSWER                                   │
│     - Define search space [min, max]                          │
│     - Define feasibility check                                │
│     - Binary search for optimal boundary                      │
│                                                               │
│  3. ROTATED ARRAY                                             │
│     - One half is always sorted                               │
│     - Check which half, then decide direction                 │
│                                                               │
│  4. AVOID COMMON BUGS                                         │
│     - Overflow: Use left + (right - left) / 2                 │
│     - Infinite loop: Match update with while condition        │
│     - Off-by-one: right = length vs length - 1                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Pro Tip:** When stuck, ask yourself: "At each step, can I eliminate half of the remaining possibilities?" If yes, binary search applies!

---

[← Search in Rotated Array](03_search_in_rotated_array.md) | [Chapter overview](../06_Binary_Search_Patterns.md)
