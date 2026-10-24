# The 3 Templates (MEMORIZE!) <a name="templates"></a>

> **Navigation**: [← Binary Search Patterns Complete Guide](01_binary_search_patterns_complete_guide.md) | [Chapter overview](../06_Binary_Search_Patterns.md) | [Search in Rotated Array →](03_search_in_rotated_array.md)
> Page 2 of 4 in **Binary Search Patterns — Pattern Guide**


## Template 1: Basic Binary Search (Exact Match)

```java
/*
Find exact element. Returns index or -1.
Use when: Looking for EXACT match in sorted array.
*/

public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {  // Note: <=
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (nums[mid] == target) {
            return mid;  // Found!
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;  // Not found
}
```

## Template 2: Lower Bound (First Position ≥ target)

```java
/*
Find first element >= target. Returns insert position if not found.
Use when: Finding leftmost position, insertion point.
*/

public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // Note: right = length (not length-1)

    while (left < right) {  // Note: <
        int mid = left + (right - left) / 2;

        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;  // Note: mid (not mid-1)
        }
    }
    return left;  // First position where nums[i] >= target
}
```

## Template 3: Upper Bound (First Position > target)

```java
/*
Find first element > target.
Use when: Finding rightmost occurrence (upperBound - 1).
*/

public int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] <= target) {  // Note: <=
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;  // First position where nums[i] > target
}
```

## Visual: Template Differences

```
Array: [1, 2, 2, 2, 3, 4, 5], target = 2

Template 1 (Exact): Returns any 2 → index 1, 2, or 3
Template 2 (Lower): First >= 2 → index 1
Template 3 (Upper): First > 2  → index 4

Uses:
- First occurrence of 2: lowerBound(2) → 1
- Last occurrence of 2:  upperBound(2) - 1 → 3
- Count of 2s: upperBound(2) - lowerBound(2) → 3
- Insert position for 2.5: lowerBound(2.5) → 4
```

## Template Cheat Sheet

**TEMPLATE QUICK REFERENCE**

```text
TEMPLATE 1: left <= right, left/right = mid ± 1
Use for: Exact match
Returns: Index of element or -1

TEMPLATE 2: left < right, right = mid
Use for: First position >= target
Returns: Insert position (0 to n)

TEMPLATE 3: left < right, left = mid + 1
Use for: First position > target
Returns: Insert position (0 to n)

KEY DIFFERENCES:
• while condition: <= for T1, < for T2/T3
• right init: length-1 for T1, length for T2/T3
• mid assignment: right = mid for T2, left = mid+1 for T3
```

---

## Lower Bound & Upper Bound <a name="bounds"></a>

### Find First and Last Position (LeetCode 34)

```java
public int[] searchRange(int[] nums, int target) {
    int first = lowerBound(nums, target);

    // Check if target exists
    if (first == nums.length || nums[first] != target) {
        return new int[]{-1, -1};
    }

    int last = upperBound(nums, target) - 1;
    return new int[]{first, last};
}

// Count occurrences
public int countOccurrences(int[] nums, int target) {
    return upperBound(nums, target) - lowerBound(nums, target);
}
```

### Visual: Finding Range

```
Array: [5, 7, 7, 8, 8, 8, 10], target = 8

lowerBound(8): First >= 8
Index: 0  1  2  3  4  5  6
Value: 5  7  7  8  8  8  10
                ↑
           Returns 3

upperBound(8): First > 8
Index: 0  1  2  3  4  5  6
Value: 5  7  7  8  8  8  10
                         ↑
                    Returns 6

Range: [3, 6-1] = [3, 5]
Count: 6 - 3 = 3 occurrences
```

### Find Insert Position (LeetCode 35)

```java
public int searchInsert(int[] nums, int target) {
    return lowerBound(nums, target);
}

// Equivalent manual implementation:
public int searchInsert(int[] nums, int target) {
    int left = 0, right = nums.length;

    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

[← Binary Search Patterns Complete Guide](01_binary_search_patterns_complete_guide.md) | [Chapter overview](../06_Binary_Search_Patterns.md) | [Search in Rotated Array →](03_search_in_rotated_array.md)
