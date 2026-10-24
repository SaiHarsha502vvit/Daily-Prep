# 📊 6.3 Rotated Sorted Array

> **Navigation**: [← 6.1 Basic Binary Search](01_basic_binary_search.md) | [Chapter overview](../07_Binary_Search.md) | [6.4 Binary Search on Answer →](03_binary_search_on_answer.md)
> Page 2 of 4 in **Binary Search**


## Problem: Search in Rotated Sorted Array

**LeetCode 33** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/search-in-rotated-sorted-array/](https://leetcode.com/problems/search-in-rotated-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH IN ROTATED SORTED ARRAY                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array was sorted then rotated at unknown pivot.                          ║
║  No duplicates. Search for target.                                        ║
║                                                                           ║
║  Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0                          ║
║  Output: 4                                                                ║
║                                                                           ║
║  Visual:                                                                  ║
║  Original: [0, 1, 2, 4, 5, 6, 7]                                          ║
║  Rotated:  [4, 5, 6, 7, 0, 1, 2]                                          ║
║             ↑        ↑                                                    ║
║           sorted   sorted                                                 ║
║                                                                           ║
║  KEY: One half is ALWAYS sorted                                           ║
║  Check if target is in sorted half, then decide direction                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) return mid;

        // Check which half is sorted
        if (nums[left] <= nums[mid]) {
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
    return -1;
}
```

---

## Problem: Search in Rotated Sorted Array II (With Duplicates)

**LeetCode 81** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/search-in-rotated-sorted-array-ii/](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH IN ROTATED SORTED ARRAY II (WITH DUPLICATES)                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Same as above but array may have duplicates.                             ║
║                                                                           ║
║  Input: nums = [2, 5, 6, 0, 0, 1, 2], target = 0                          ║
║  Output: true                                                             ║
║                                                                           ║
║  EDGE CASE: nums[left] == nums[mid] == nums[right]                        ║
║  Example: [1, 0, 1, 1, 1] - can't determine which half is sorted          ║
║  Solution: Skip duplicates by left++, right--                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) return true;

        // Handle duplicates
        if (nums[left] == nums[mid] && nums[mid] == nums[right]) {
            left++;
            right--;
        } else if (nums[left] <= nums[mid]) {
            // Left half sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half sorted
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

---

## Problem: Find Minimum in Rotated Sorted Array

**LeetCode 153** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND MINIMUM IN ROTATED SORTED ARRAY                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum element in rotated sorted array (no duplicates).            ║
║                                                                           ║
║  Input: nums = [3, 4, 5, 1, 2]                                            ║
║  Output: 1                                                                ║
║                                                                           ║
║  Visual:                                                                  ║
║       5                                                                   ║
║    4     ╲                                                                ║
║ 3           ╲                                                             ║
║               2                                                           ║
║             1   ← minimum                                                 ║
║                                                                           ║
║  KEY: Compare mid with right                                              ║
║  - If mid > right: min is in right half                                   ║
║  - If mid < right: min is in left half (including mid)                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int findMin(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            // Min is in right half
            left = mid + 1;
        } else {
            // Min is in left half (including mid)
            right = mid;
        }
    }
    return nums[left];
}
```

---

[← 6.1 Basic Binary Search](01_basic_binary_search.md) | [Chapter overview](../07_Binary_Search.md) | [6.4 Binary Search on Answer →](03_binary_search_on_answer.md)
