# 🔍 4. Binary Search

> **Navigation**: [← 3. Sliding Window — Variable](02_sliding_window_variable.md) | [Chapter overview](../02_Code_Templates.md) | [5. Prefix Sum →](04_prefix_sum.md)
> Page 3 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

### Binary search visualisation

Find `7` in the sorted array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` (indexes 0 to 9).

| Step | low | high | mid | `arr[mid]` | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 9 | 4 | 5 | 5 < 7, so search the right half (`low = mid + 1`) |
| 2 | 5 | 9 | 7 | 8 | 8 > 7, so search the left half (`high = mid - 1`) |
| 3 | 5 | 6 | 5 | 6 | 6 < 7, so search the right half |
| 4 | 6 | 6 | 6 | 7 | 7 == 7, **found**: return 6 |

Each step halves the search range, so the search takes O(log n) steps.

## Template: Standard Binary Search

```java
/**
 * BINARY SEARCH - Standard Template
 * Time: O(log N)
 *
 * CRITICAL: Use low + (high - low) / 2 to avoid overflow!
 */
public int binarySearch(int[] arr, int target) {
    int low = 0;
    int high = arr.length - 1;

    while (low <= high) {  // <=, not <
        int mid = low + (high - low) / 2;  // Avoid overflow

        if (arr[mid] == target) {
            return mid;           // Found!
        } else if (arr[mid] < target) {
            low = mid + 1;        // Search right half
        } else {
            high = mid - 1;       // Search left half
        }
    }
    return -1;  // Not found
}
```

## Template: Find First/Last Occurrence

```java
/**
 * VISUAL: Finding FIRST occurrence of 5
 *
 * [1, 2, 5, 5, 5, 5, 8, 9]
 *        ↑  ↑  ↑  ↑
 *        First one (index 2)
 *
 * When we find target, DON'T return!
 * Save position and continue searching LEFT
 */
public int findFirstOccurrence(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            result = mid;       // Save this position
            high = mid - 1;     // But keep searching LEFT
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return result;
}

/**
 * Finding LAST occurrence:
 * When we find target, search RIGHT instead
 */
public int findLastOccurrence(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            result = mid;       // Save this position
            low = mid + 1;      // But keep searching RIGHT
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return result;
}

// Count occurrences = lastOccurrence - firstOccurrence + 1
```

---

[← 3. Sliding Window — Variable](02_sliding_window_variable.md) | [Chapter overview](../02_Code_Templates.md) | [5. Prefix Sum →](04_prefix_sum.md)
