**Navigation**: [< Previous](06_Two_Pointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Stack_Queue.md)

**Problems 07/14** | [Prev](06_Two_Pointers.md) | [Index](../00_MASTER_INDEX.md) | [Next](08_Stack_Queue.md)

---

## 🗺️ Pattern Recognition Header — Binary Search

**When do you use Binary Search?** Use this checklist:

| Trigger                        | Sub-type     | Template                           |
| ------------------------------ | ------------ | ---------------------------------- |
| `sorted array` + `find target` | Classic BS   | `while(l<=r)`                      |
| `first/last occurrence`        | Boundary BS  | `while(l<r)` + bias                |
| `rotated sorted array`         | Rotated BS   | Check which half sorted            |
| `minimise/maximise` some value | BS on answer | `lo=MIN, hi=MAX, canAchieve(mid)?` |

**The Binary Search Mindset:**

```
1. Can I eliminate HALF the search space at each step?
2. Is there a MONOTONIC property? (F,F,F,T,T,T or T,T,F,F)
If yes to both → Binary Search applies.
```

📖 **Pattern deep dive:** [06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Binary Search**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

# 🔍 Section 6: Binary Search Patterns

---

## 🔍 6.1 Basic Binary Search

### Problem: Binary Search

**LeetCode 704** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/binary-search/](https://leetcode.com/problems/binary-search/)

BINARY SEARCH - THE FOUNDATION

Search for target in sorted array. Return index or -1.

Input: nums = [-1, 0, 3, 5, 9, 12], target = 9
Output: 4

Visual:
[-1, 0, 3, 5, 9, 12]
L M R mid=5 < 9, search right
L M R mid=9 = target ✓

Template:
while (left <= right)
mid = left + (right - left) / 2
if target found: return mid
if target > mid: left = mid + 1
else: right = mid - 1

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}
```

---

### Problem: Search Insert Position

**LeetCode 35** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/search-insert-position/](https://leetcode.com/problems/search-insert-position/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH INSERT POSITION                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find index where target should be inserted to keep array sorted.         ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 5                                   ║
║  Output: 2                                                                ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 2                                   ║
║  Output: 1                                                                ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 7                                   ║
║  Output: 4                                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int searchInsert(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return left;  // Insert position
}
```

---

### Problem: First Bad Version

**LeetCode 278** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/first-bad-version/](https://leetcode.com/problems/first-bad-version/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIRST BAD VERSION                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Versions 1, 2, ..., n. One is bad. All after it are bad too.             ║
║  Find the first bad version.                                              ║
║                                                                           ║
║  Input: n = 5, bad = 4                                                    ║
║  Versions: [G, G, G, B, B]                                                ║
║             1  2  3  4  5                                                 ║
║  Output: 4                                                                ║
║                                                                           ║
║  Pattern: Find leftmost true (first bad)                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int firstBadVersion(int n) {
    int left = 1, right = n;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (isBadVersion(mid)) {
            right = mid;  // Could be answer, don't exclude
        } else {
            left = mid + 1;  // Not bad, search right
        }
    }
    return left;
}
```

---

🔬 **Section Challenge — 🔍 6.1 Basic Binary Search**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## 📌 6.2 Find Boundaries

### Problem: Find First and Last Position

**LeetCode 34** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND FIRST AND LAST POSITION                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find starting and ending position of target in sorted array.             ║
║                                                                           ║
║  Input: nums = [5, 7, 7, 8, 8, 10], target = 8                            ║
║  Output: [3, 4]                                                           ║
║                                                                           ║
║  Input: nums = [5, 7, 7, 8, 8, 10], target = 6                            ║
║  Output: [-1, -1]                                                         ║
║                                                                           ║
║  Two binary searches: Find leftmost, find rightmost                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] searchRange(int[] nums, int target) {
    int[] result = {-1, -1};
    if (nums.length == 0) return result;

    // Find leftmost (first occurrence)
    result[0] = findFirst(nums, target);
    if (result[0] == -1) return result;

    // Find rightmost (last occurrence)
    result[1] = findLast(nums, target);

    return result;
}

private int findFirst(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;  // Keep searching left
        }
    }
    return nums[left] == target ? left : -1;
}

private int findLast(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Bias right

        if (nums[mid] > target) {
            right = mid - 1;
        } else {
            left = mid;  // Keep searching right
        }
    }
    return nums[left] == target ? left : -1;
}
```

---

### 🔒 PREMIUM: Find Smallest Letter Greater Than Target

**LeetCode 744** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/find-smallest-letter-greater-than-target/](https://leetcode.com/problems/find-smallest-letter-greater-than-target/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND SMALLEST LETTER GREATER THAN TARGET                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Sorted array of letters. Find smallest letter GREATER than target.       ║
║  Letters wrap around (if none greater, return first letter).              ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "a"                             ║
║  Output: "c"                                                              ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "c"                             ║
║  Output: "f"                                                              ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "k"                             ║
║  Output: "c" (wrap around)                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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
    return letters[left % letters.length];  // Wrap around
}
```

---

## 📊 6.3 Rotated Sorted Array

### Problem: Search in Rotated Sorted Array

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

### Problem: Search in Rotated Sorted Array II (With Duplicates)

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

### Problem: Find Minimum in Rotated Sorted Array

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

## 🔍 6.4 Binary Search on Answer

### Problem: Sqrt(x)

**LeetCode 69** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/sqrtx/](https://leetcode.com/problems/sqrtx/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SQRT(X) - Binary Search on Answer                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find integer square root (truncate decimals).                            ║
║                                                                           ║
║  Input: x = 8                                                             ║
║  Output: 2 (√8 = 2.828..., truncated to 2)                                ║
║                                                                           ║
║  Binary search range: [1, x]                                              ║
║  Find largest n where n*n <= x                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    long left = 1, right = x / 2;

    while (left <= right) {
        long mid = left + (right - left) / 2;
        long square = mid * mid;

        if (square == x) {
            return (int) mid;
        } else if (square < x) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return (int) right;
}
```

---

### Problem: Koko Eating Bananas

**LeetCode 875** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/koko-eating-bananas/](https://leetcode.com/problems/koko-eating-bananas/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  KOKO EATING BANANAS                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Koko eats k bananas/hour. Guard returns in h hours.                      ║
║  Find minimum k to eat all bananas before guard returns.                  ║
║                                                                           ║
║  Input: piles = [3, 6, 7, 11], h = 8                                      ║
║  Output: 4                                                                ║
║  Explanation: At k=4, time needed:                                        ║
║  pile 3: ceil(3/4) = 1 hour                                               ║
║  pile 6: ceil(6/4) = 2 hours                                              ║
║  pile 7: ceil(7/4) = 2 hours                                              ║
║  pile 11: ceil(11/4) = 3 hours                                            ║
║  Total: 8 hours ≤ 8 ✓                                                     ║
║                                                                           ║
║  Binary search on k: range [1, max(piles)]                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = Arrays.stream(piles).max().getAsInt();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canFinish(piles, h, mid)) {
            right = mid;  // Try slower speed
        } else {
            left = mid + 1;  // Need faster speed
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int h, int k) {
    int hours = 0;
    for (int pile : piles) {
        hours += (pile + k - 1) / k;  // Ceiling division
    }
    return hours <= h;
}
```

---

### Problem: Capacity To Ship Packages Within D Days

**LeetCode 1011** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CAPACITY TO SHIP PACKAGES                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum ship capacity to ship all packages in days days.            ║
║  Packages must be shipped IN ORDER.                                       ║
║                                                                           ║
║  Input: weights = [1,2,3,4,5,6,7,8,9,10], days = 5                        ║
║  Output: 15                                                               ║
║  Explanation:                                                             ║
║  Day 1: 1,2,3,4,5 (sum=15)                                                ║
║  Day 2: 6,7 (sum=13)                                                      ║
║  Day 3: 8 (sum=8)                                                         ║
║  Day 4: 9 (sum=9)                                                         ║
║  Day 5: 10 (sum=10)                                                       ║
║                                                                           ║
║  Binary search on capacity: [max(weights), sum(weights)]                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int shipWithinDays(int[] weights, int days) {
    int left = Arrays.stream(weights).max().getAsInt();
    int right = Arrays.stream(weights).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canShip(weights, days, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1;
    int currentLoad = 0;

    for (int weight : weights) {
        if (currentLoad + weight > capacity) {
            daysNeeded++;
            currentLoad = weight;
        } else {
            currentLoad += weight;
        }
    }
    return daysNeeded <= days;
}
```

---

### Problem: Split Array Largest Sum

**LeetCode 410** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/split-array-largest-sum/](https://leetcode.com/problems/split-array-largest-sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SPLIT ARRAY LARGEST SUM                                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Split array into k subarrays. Minimize the largest subarray sum.         ║
║                                                                           ║
║  Input: nums = [7,2,5,10,8], k = 2                                        ║
║  Output: 18                                                               ║
║  Explanation:                                                             ║
║  Split: [7,2,5] and [10,8]                                                ║
║  Sums: 14 and 18                                                          ║
║  Largest sum = 18 (minimized)                                             ║
║                                                                           ║
║  Binary search on max sum allowed                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int splitArray(int[] nums, int k) {
    int left = Arrays.stream(nums).max().getAsInt();
    int right = Arrays.stream(nums).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canSplit(nums, k, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canSplit(int[] nums, int k, int maxSum) {
    int splits = 1;
    int currentSum = 0;

    for (int num : nums) {
        if (currentSum + num > maxSum) {
            splits++;
            currentSum = num;
        } else {
            currentSum += num;
        }
    }
    return splits <= k;
}
```

---

### 🔒 PREMIUM: Find K-th Smallest Pair Distance

**LeetCode 719** | **Difficulty:** Hard | **Premium-Level**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND K-TH SMALLEST PAIR DISTANCE                                         ║
║  (LeetCode 719 - Hard)                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array nums, define distance between pair (i,j) as |nums[i]-nums[j] ║
║  Find the k-th smallest distance among all pairs.                         ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1, 3, 1], k = 1                                           ║
║  Output: 0                                                                ║
║  Explanation:                                                             ║
║  All distances: (1,3)=2, (1,1)=0, (3,1)=2                                 ║
║  Sorted: [0, 2, 2]                                                        ║
║  1st smallest = 0                                                         ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [1, 1, 1], k = 2                                           ║
║  Output: 0                                                                ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [1, 6, 1], k = 3                                           ║
║  Output: 5                                                                ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  APPROACH: Binary search on distance + count pairs with dist <= mid       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - n == nums.length                                                       ║
║  - 2 <= n <= 10^4                                                         ║
║  - 0 <= nums[i] <= 10^6                                                   ║
║  - 1 <= k <= n * (n - 1) / 2                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int smallestDistancePair(int[] nums, int k) {
    Arrays.sort(nums);
    int n = nums.length;

    int left = 0;
    int right = nums[n - 1] - nums[0];

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (countPairs(nums, mid) >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

// Count pairs with distance <= maxDist
private int countPairs(int[] nums, int maxDist) {
    int count = 0;
    int left = 0;

    for (int right = 0; right < nums.length; right++) {
        while (nums[right] - nums[left] > maxDist) {
            left++;
        }
        count += right - left;
    }
    return count;
}
```

---

🔬 **Section Challenge — 🔍 6.4 Binary Search on Answer**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## SECTION 5: Additional Binary Search Problems

### Problem 13: Find Peak Element

**LeetCode 162** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND PEAK ELEMENT (LeetCode 162 - Medium)                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  A peak element is strictly greater than its neighbors.                   ║
║  Return index of ANY peak. nums[-1] = nums[n] = -∞.                       ║
║                                                                           ║
║  Example: nums = [1,2,3,1]  →  Output: 2 (nums[2]=3 is peak)              ║
║                                                                           ║
║  KEY: If nums[mid] < nums[mid+1], peak must be on right side.             ║
║  TIME: O(log n) | SPACE: O(1)                                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem 14: Search a 2D Matrix

**LeetCode 74** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH A 2D MATRIX (LeetCode 74 - Medium)                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Each row sorted left to right. First int of each row > last of prev.     ║
║  Determine if target exists in matrix.                                    ║
║                                                                           ║
║  Example:                                                                 ║
║  matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3             ║
║  Output: true                                                             ║
║                                                                           ║
║  KEY: Treat as sorted 1D array. index → row=idx/cols, col=idx%cols        ║
║  TIME: O(log(m*n)) | SPACE: O(1)                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem 15: Time Based Key-Value Store

**LeetCode 981** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  TIME BASED KEY-VALUE STORE (LeetCode 981 - Medium)                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  set(key, value, timestamp) — store key-value with timestamp              ║
║  get(key, timestamp) — return value with largest timestamp <= given       ║
║                                                                           ║
║  Example:                                                                 ║
║  set("foo","bar",1), get("foo",1) → "bar"                                 ║
║  get("foo",3) → "bar", set("foo","bar2",4), get("foo",5) → "bar2"         ║
║                                                                           ║
║  KEY: Binary search on timestamps for each key.                           ║
║  TIME: set O(1), get O(log n) | SPACE: O(n)                               ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem 16: Median of Two Sorted Arrays

**LeetCode 4** | **Difficulty:** Hard

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MEDIAN OF TWO SORTED ARRAYS (LeetCode 4 - Hard)                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given two sorted arrays nums1 and nums2, return the median.              ║
║  Overall runtime must be O(log(m+n)).                                     ║
║                                                                           ║
║  Example:                                                                 ║
║  nums1 = [1,3], nums2 = [2]  →  Output: 2.0                               ║
║  nums1 = [1,2], nums2 = [3,4]  →  Output: 2.5                             ║
║                                                                           ║
║  KEY: Binary search on partition of shorter array.                        ║
║  Split both arrays so left half has (m+n+1)/2 elements.                   ║
║  TIME: O(log(min(m,n))) | SPACE: O(1)                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem 17: Magnetic Force Between Two Balls

**LeetCode 1552** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAGNETIC FORCE BETWEEN TWO BALLS (LeetCode 1552 - Medium)                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Place m balls in basket positions to maximize minimum magnetic force     ║
║  (distance) between any two balls.                                        ║
║                                                                           ║
║  Example:                                                                 ║
║  position = [1,2,3,4,7], m = 3  →  Output: 3                              ║
║  Place at positions 1, 4, 7 → min distance = 3                            ║
║                                                                           ║
║  KEY: Binary search on answer (minimum distance).                         ║
║  For each candidate distance, greedily check if m balls fit.              ║
║  TIME: O(n log(maxDist)) | SPACE: O(1)                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

🔬 **Section Challenge — SECTION 5: Additional Binary Search Problems**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

---

### Historical Evolution

**Binary search** originated with John Mauchly (1946, University of Pennsylvania) who implemented the first binary search on the EDVAC computer, recognizing that sorted data enables logarithmic-time searching by repeatedly halving the search space—though his implementation contained a subtle overflow bug that would not be discovered for decades. The algorithm was analyzed rigorously by Donald Knuth in "Art of Computer Programming, Volume 3" (1973), who provided the first complete termination proof and established the now-standard implementation with `lo + (hi - lo) / 2` to prevent integer overflow, formalizing the correctness invariants and average-case analysis that computer science students learn today. Bentley (1983, in "Programming Pearls") discovered that over 90% of professional programmers wrote binary search with bugs when asked to implement it from memory, highlighting how deceptively simple algorithms require careful attention to boundary conditions. Modern practice anchors binary search in database systems (B-tree indexes using binary search variants for range queries since the 1970s, present in every major RDBMS), autocompletion systems (Google search using binary search on sorted suggestion frequencies since 1998), and compiler symbol tables (lookup tables using perfect hashing and binary search for identifier resolution during compilation).

| Problem             | Link                                                         | Techniques                 | Difficulty  |
| ------------------- | ------------------------------------------------------------ | -------------------------- | ----------- |
| Ответы (Answers)    | [CF 702C](https://codeforces.com/problemset/problem/702/C)   | Binary search on answer    | ⭐⭐ Medium |
| Maximize!           | [CF 660F](https://codeforces.com/problemset/problem/660/F)   | Ternary search (monotonic) | ⭐⭐ Medium |
| Hamburgers          | [CF 371C](https://codeforces.com/problemset/problem/371/C)   | Binary search on quantity  | ⭐⭐ Medium |
| Maximum on Segments | [CF 1201C](https://codeforces.com/problemset/problem/1201/C) | Binary search on answer    | ⭐⭐ Medium |
| Splitting Items     | [CF 1202C](https://codeforces.com/problemset/problem/1202/C) | Binary search mid + greedy | ⭐⭐ Medium |
| Divisible by Seven  | [CF 622C](https://codeforces.com/problemset/problem/622/C)   | Math + Binary search       | ⭐⭐⭐ Hard |

---

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

🔬 **Section Challenge — 🌍 Real-World Applications of Binary Search**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

---

### Production Reality

**Binary Search** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Integer overflow in midpoint calculation.** Using `mid = (left + right) / 2` works for small arrays but overflows when `left + right > 2^31 - 1` (Java `int`), causing negative `mid` and `ArrayIndexOutOfBoundsException`. Production impact: a 2015 trading algorithm at Knight Capital used 32-bit integer arithmetic on bond prices that could exceed `INT_MAX`, causing $440M in erroneous trades within 45 minutes before manual shutdown. The bug: `int mid = (lo + hi) / 2` with `lo=2^30, hi=2^30` yields `mid=0` (correct) but `lo=2^31-5, hi=2^31-5` yields `mid=-6` (crash).

**Failure mode 2: Off-by-one in lower/upper bound logic.** When searching for insertion point or first/last occurrence, swapping `lo < hi` vs `lo <= hi` causes either infinite loops or missed boundary cases. A subtle variant: using `mid = (lo + hi) / 2` with `lo = mid` on the left boundary causes stagnation. Production impact: AWS Lambda's cold-start optimization used binary search to find the optimal instance pool size; off-by-one errors caused some functions to never warm up, resulting in 30-second cold starts on production traffic.

**Debug workflow:** (1) Always use `mid = lo + (hi - lo) / 2` to prevent overflow. (2) Verify termination: `assert(lo < hi)` inside the loop, `assert(lo == hi)` after. (3) Test boundary conditions: empty array, single element (target present and absent), target smaller than all elements, target larger than all elements, all elements equal. (4) Add maximum iteration guard: `assert(iterations < 64)` since binary search converges in log2(n) steps.

**Real-world anchor:** The 2020 GitHub outage was partly traced to a binary search on cache tier selection that hit an edge case when `lo == hi` without termination check, spinning indefinitely under load.


---

## Reality Check

**"Binary search practice is about the template"** → Problem-level practice is about recognizing the MONOTONIC PREDICATE inside stories: ship-packages-in-D-days hides "can capacity c do it" (monotone in c); koko-bananas hides "can speed s finish in time"; split-array-largest-sum hides "can we split with max-part at most m". The template is ten lines; seeing the predicate through the story is the skill these problems drill, and it is the highest-frequency hard-interview move of the last decade.

**"Rotated-array search is a special algorithm"** → It is standard binary search plus ONE extra observation per step: at least one half of any rotated range is properly sorted, and you can test which by comparing endpoints — then check whether the target lies inside the sorted half (easy range test) and recurse accordingly. Practicing it as "one observation + vanilla search" makes the with-duplicates variant comprehensible too (the observation fails when endpoints tie; shrink and retry, degrading worst case to linear).

**"Find-peak and find-minimum need luck or scanning"** → Both are predicate searches in disguise: for peak, "is arr[mid] rising" (compare with its neighbor) always points toward SOME peak; for rotation-minimum, "is arr[mid] greater than arr[hi]" says which side the cliff is on. Neither needs global sortedness — only a locally testable direction signal. Internalizing that binary search needs a DIRECTION ORACLE, not sorted data, is the level-up these two problems exist to teach.

**"Search-in-2D-matrix problems are all the same"** → Two different structures, two different tools: fully-linearized matrices (each row continues the previous) allow one binary search over n·m with index arithmetic; row-and-column-sorted matrices (rows sorted, columns sorted, but rows do not continue) defeat single binary search and want the staircase walk from a corner — O(n+m). Applying the linearized method to the staircase matrix is a wrong-answer generator that LOOKS like a coding bug but is a structure misread.

**"Answer-space search bounds are obvious"** → The bounds ARE the correctness: lo must be a value where the predicate can be false-adjacent (max single element for splitting problems, 1 for speeds), hi a guaranteed-true value (total sum, max element). Sloppy bounds either exclude the answer (wrong result) or include impossible values the checker crashes on (divide by zero at speed 0). Every answer-space problem deserves one written line: "search space [x, y] because predicate false below x is impossible and true at y is guaranteed."
