# Search in Rotated Array <a name="rotated"></a>

> **Navigation**: [← The 3 Templates (MEMORIZE!)](02_the_3_templates_memorize.md) | [Chapter overview](../06_Binary_Search_Patterns.md) | [Binary Search on Answer →](04_binary_search_on_answer.md)
> Page 3 of 4 in **Binary Search Patterns — Pattern Guide**


## Understanding Rotated Arrays

```
Original Sorted: [0, 1, 2, 4, 5, 6, 7]

Rotated by 3:    [4, 5, 6, 7, 0, 1, 2]
                        ↑
                   Pivot point

Key insight: One half is ALWAYS sorted!

[4, 5, 6, 7, 0, 1, 2], mid = 3 (value 7)
 ↑        ↑        ↑
left     mid     right

Left half [4,5,6,7] is sorted (nums[left] <= nums[mid])
Right half [0,1,2] is NOT sorted in normal order
```

## Search in Rotated Sorted Array (LeetCode 33)

```java
/*
No duplicates. Find target index or -1.
Key: Determine which half is sorted, then decide where to search.
*/

public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        }

        // Determine which half is sorted
        if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;  // Target in left half
            } else {
                left = mid + 1;   // Target in right half
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;   // Target in right half
            } else {
                right = mid - 1;  // Target in left half
            }
        }
    }
    return -1;
}
```

## Rotated Array WITH Duplicates (LeetCode 81)

```java
/*
With duplicates, we might not know which half is sorted.
Worst case O(n), but usually still O(log n).
*/

public boolean search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return true;
        }

        // Handle duplicates: nums[left] == nums[mid] == nums[right]
        if (nums[left] == nums[mid] && nums[mid] == nums[right]) {
            left++;
            right--;
        } else if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return false;
}
```

## Find Minimum in Rotated Array (LeetCode 153)

```java
/*
Find the minimum element (pivot point).
The minimum is where the rotation happened.
*/

public int findMin(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            // Minimum is in right half (after mid)
            left = mid + 1;
        } else {
            // Minimum is in left half (including mid)
            right = mid;
        }
    }
    return nums[left];
}

// With duplicates (LeetCode 154)
public int findMinWithDup(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            left = mid + 1;
        } else if (nums[mid] < nums[right]) {
            right = mid;
        } else {
            // nums[mid] == nums[right], can't decide
            right--;  // Safe to shrink
        }
    }
    return nums[left];
}
```

---

## Peak Finding Patterns <a name="peak-finding"></a>

### Find Peak Element (LeetCode 162)

```java
/*
A peak is greater than its neighbors.
nums[-1] = nums[n] = -∞
Find ANY peak in O(log n).
*/

public int findPeakElement(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[mid + 1]) {
            // Descending: peak is at mid or left
            right = mid;
        } else {
            // Ascending: peak is on right
            left = mid + 1;
        }
    }
    return left;
}
```

### Visual: Peak Finding Logic

```
Array: [1, 2, 3, 1]
        ↑     ↑
       asc  desc

mid = 1, nums[1]=2, nums[2]=3
2 < 3: Ascending → move right

mid = 2, nums[2]=3, nums[3]=1
3 > 1: Descending → peak at mid or left

Result: index 2 (value 3)

---

Array: [1, 2, 1, 3, 5, 6, 4]

Multiple peaks exist: index 1 (value 2) and index 5 (value 6)
Binary search finds ONE of them.
```

### Peak Index in Mountain Array (LeetCode 852)

```java
/*
Mountain: strictly increasing then strictly decreasing.
Exactly one peak. Find it.
*/

public int peakIndexInMountainArray(int[] arr) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] < arr[mid + 1]) {
            left = mid + 1;  // Peak is on right
        } else {
            right = mid;     // Peak is at mid or left
        }
    }
    return left;
}
```

---

[← The 3 Templates (MEMORIZE!)](02_the_3_templates_memorize.md) | [Chapter overview](../06_Binary_Search_Patterns.md) | [Binary Search on Answer →](04_binary_search_on_answer.md)
