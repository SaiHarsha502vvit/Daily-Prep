> **Navigation**: [< Previous](05_LeetCode_RealWorld_Map.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_Two_Pointers_Complete.md)

# 🔍 Binary Search Patterns Complete Guide

> Master Every Variation of the Most Powerful Search Technique

## Table of Contents

1. [Binary Search Fundamentals](#fundamentals)
2. [The 3 Templates (MEMORIZE!)](#templates)
3. [Lower Bound & Upper Bound](#bounds)
4. [Search in Rotated Array](#rotated)
5. [Peak Finding Patterns](#peak-finding)
6. [Binary Search on Answer](#binary-answer)
7. [2D Binary Search](#2d-search)
8. [Advanced Patterns](#advanced)
9. [Common Mistakes](#mistakes)
10. [Interview Problems](#interview-problems)
11. [Quick Reference](#quick-reference)

---

## Binary Search Fundamentals <a name="fundamentals"></a>

### The Core Idea


> BINARY SEARCH IN ONE SENTENCE
>
> "If the search space is MONOTONIC (sorted/ordered),
> eliminate HALF of it each step."
>
> Time: O(log n)  —  From 1 billion → 30 comparisons
>


### Visual: Why Binary Search is Fast

```
Linear Search on 1,000,000 elements:
┌────────────────────────────────────────────────────┐
│ Worst case: 1,000,000 comparisons                  │
│ Average: 500,000 comparisons                       │
└────────────────────────────────────────────────────┘

Binary Search on 1,000,000 elements:
┌────────────────────────────────────────────────────┐
│ 1,000,000 → 500,000 → 250,000 → 125,000 →          │
│ 62,500 → 31,250 → 15,625 → 7,812 → 3,906 →         │
│ 1,953 → 976 → 488 → 244 → 122 → 61 →               │
│ 30 → 15 → 7 → 3 → 1                                │
│                                                    │
│ Only ~20 comparisons! (log₂(1,000,000) ≈ 20)       │
└────────────────────────────────────────────────────┘
```

**Flow:**
- Worst case: 1,000,000 comparisons / Average: 500,000 co
- ↓
- 1,000,000
- ↓
- 500,000
- ↓
- 250,000
- ↓
- 125,000
- ↓
- / 62,500
- ↓
- 31

```mermaid
flowchart TD
    N1["Worst case: 1,000,000 comparisons / Average: 500,000 co"]
    N2["1,000,000 → 500,000 → 250,000 → 125,000 → / 62,500 → 31"]
    N1 --> N2
```

### Prerequisites for Binary Search

```
┌─────────────────────────────────────────────────────────────────┐
│           BINARY SEARCH APPLICABILITY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You need ONE of these properties:                              │
│                                                                 │
│  1. SORTED ARRAY                                                │
│     - Ascending or descending                                   │
│     - Search for specific value or boundary                     │
│                                                                 │
│  2. MONOTONIC FUNCTION                                          │
│     - f(x) is always increasing or always decreasing            │
│     - Search for value where f(x) crosses threshold             │
│                                                                 │
│  3. SEARCH SPACE WITH BINARY PROPERTY                           │
│     - Can eliminate half based on some condition                │
│     - "Binary search on answer"                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**
- BINARY SEARCH APPLICABILITY
- ↓
- You need ONE of these properties:
- ↓
- 1. SORTED ARRAY
- ↓
- - Ascending or descending
- ↓
- - Search for specific value or boundary
- ↓
- 2. MONOTONIC FUNCTION
- ↓
- - f(x) is always increasing or always decreasing

```mermaid
flowchart TD
    N1["BINARY SEARCH APPLICABILITY"]
    N2["You need ONE of these properties:"]
    N3["1. SORTED ARRAY"]
    N4["- Ascending or descending"]
    N5["- Search for specific value or boundary"]
    N6["2. MONOTONIC FUNCTION"]
    N7["- f(x) is always increasing or always decreasing"]
    N8["- Search for value where f(x) crosses threshold"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## The 3 Templates (MEMORIZE!) <a name="templates"></a>

### Template 1: Basic Binary Search (Exact Match)

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

### Template 2: Lower Bound (First Position ≥ target)

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

### Template 3: Upper Bound (First Position > target)

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

### Visual: Template Differences

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

**Flow:**
- Template 1 (Exact): Returns any 2
- ↓
- index 1, 2, or 3
- ↓
- Template 2 (Lower): First >= 2
- ↓
- index 1
- ↓
- Template 3 (Upper): First > 2
- ↓
- index 4

```mermaid
flowchart LR
    N1["Template 1 (Exact): Returns any 2"]
    N2["index 1, 2, or 3"]
    N3["Template 2 (Lower): First &gt;= 2"]
    N4["index 1"]
    N5["Template 3 (Upper): First &gt; 2"]
    N6["index 4"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
```

### Template Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│              TEMPLATE QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEMPLATE 1: left <= right, left/right = mid ± 1                │
│  Use for: Exact match                                           │
│  Returns: Index of element or -1                                │
│                                                                 │
│  TEMPLATE 2: left < right, right = mid                          │
│  Use for: First position >= target                              │
│  Returns: Insert position (0 to n)                              │
│                                                                 │
│  TEMPLATE 3: left < right, left = mid + 1                       │
│  Use for: First position > target                               │
│  Returns: Insert position (0 to n)                              │
│                                                                 │
│  KEY DIFFERENCES:                                               │
│  • while condition: <= for T1, < for T2/T3                      │
│  • right init: length-1 for T1, length for T2/T3                │
│  • mid assignment: right = mid for T2, left = mid+1 for T3      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**
- TEMPLATE QUICK REFERENCE
- ↓
- TEMPLATE 1: left <= right, left/right = mid ± 1
- ↓
- Use for: Exact match
- ↓
- Returns: Index of element or -1
- ↓
- TEMPLATE 2: left < right, right = mid
- ↓
- Use for: First position >= target
- ↓
- Returns: Insert position (0 to n)

```mermaid
flowchart TD
    N1["TEMPLATE QUICK REFERENCE"]
    N2["TEMPLATE 1: left &lt;= right, left/right = mid ± 1"]
    N3["Use for: Exact match"]
    N4["Returns: Index of element or -1"]
    N5["TEMPLATE 2: left &lt; right, right = mid"]
    N6["Use for: First position &gt;= target"]
    N7["Returns: Insert position (0 to n)"]
    N8["TEMPLATE 3: left &lt; right, left = mid + 1"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
- Array: [5, 7, 7, 8, 8, 8, 10], target = 8
- ↓
- lowerBound(8): First >= 8
- ↓
- Index: 0 1 2 3 4 5 6
- ↓
- Value: 5 7 7 8 8 8 10
- ↓
- Returns 3
- ↓
- upperBound(8): First > 8
- ↓
- Returns 6

```mermaid
flowchart TD
    N1["Array: [5, 7, 7, 8, 8, 8, 10], target = 8"]
    N2["lowerBound(8): First &gt;= 8"]
    N3["Index: 0 1 2 3 4 5 6"]
    N4["Value: 5 7 7 8 8 8 10"]
    N5["Returns 3"]
    N6["upperBound(8): First &gt; 8"]
    N7["Returns 6"]
    N8["Range: [3, 6-1] = [3, 5]"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

## Search in Rotated Array <a name="rotated"></a>

### Understanding Rotated Arrays

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

**Flow:**
- Original Sorted: [0, 1, 2, 4, 5, 6, 7]
- ↓
- Rotated by 3: [4, 5, 6, 7, 0, 1, 2]
- ↓
- Pivot point
- ↓
- Key insight: One half is ALWAYS sorted!
- ↓
- [4, 5, 6, 7, 0, 1, 2], mid = 3 (value 7)
- ↓
- left mid right
- ↓
- Left half [4,5,6,7] is sorted (nums[left] <= nums[mi

```mermaid
flowchart TD
    N1["Original Sorted: [0, 1, 2, 4, 5, 6, 7]"]
    N2["Rotated by 3: [4, 5, 6, 7, 0, 1, 2]"]
    N3["Pivot point"]
    N4["Key insight: One half is ALWAYS sorted!"]
    N5["[4, 5, 6, 7, 0, 1, 2], mid = 3 (value 7)"]
    N6["left mid right"]
    N7["Left half [4,5,6,7] is sorted (nums[left] &lt;= nums[mi"]
    N8["Right half [0,1,2] is NOT sorted in normal order"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Search in Rotated Sorted Array (LeetCode 33)

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

### Rotated Array WITH Duplicates (LeetCode 81)

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

### Find Minimum in Rotated Array (LeetCode 153)

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

**Flow:**
- 2 < 3: Ascending
- ↓
- move right
- ↓
- 3 > 1: Descending
- ↓
- peak at mid or left

```mermaid
flowchart LR
    N1["2 &lt; 3: Ascending"]
    N2["move right"]
    N3["3 &gt; 1: Descending"]
    N4["peak at mid or left"]
    N1 --> N2
    N3 --> N4
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

## Binary Search on Answer <a name="binary-answer"></a>

### The Concept

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

**Flow:**
- BINARY SEARCH ON ANSWER PATTERN
- ↓
- When: You're not searching IN an array, but searching F
- ↓
- an optimal value in a range.
- ↓
- Pattern:
- ↓
- 1. Define search space: [min_possible, max_possible]
- ↓
- 2. Define feasibility function: canAchieve(answer)
- ↓
- 3. Binary search for boundary where answer becomes feas

```mermaid
flowchart TD
    N1["BINARY SEARCH ON ANSWER PATTERN"]
    N2["When: You're not searching IN an array, but searching F"]
    N3["an optimal value in a range."]
    N4["Pattern:"]
    N5["1. Define search space: [min_possible, max_possible]"]
    N6["2. Define feasibility function: canAchieve(answer)"]
    N7["3. Binary search for boundary where answer becomes feas"]
    N8["Examples:"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Template: Binary Search on Answer

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

### Problem: Ship Packages in D Days (LeetCode 1011)

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

### Problem: Koko Eating Bananas (LeetCode 875)

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

### Problem: Split Array Largest Sum (LeetCode 410)

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

### Problem: Magnetic Force Between Balls (LeetCode 1552)

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

**Flow:**
- BINARY SEARCH PROBLEM TYPES
- ↓
- BASIC (Template 1):
- ↓
- - Binary Search, Search Insert Position
- ↓
- BOUNDARY FINDING (Template 2/3):
- ↓
- - First/Last Position of Element
- ↓
- - First Bad Version, Find Smallest Letter
- ↓
- ROTATED ARRAY:

```mermaid
flowchart TD
    N1["BINARY SEARCH PROBLEM TYPES"]
    N2["BASIC (Template 1):"]
    N3["- Binary Search, Search Insert Position"]
    N4["BOUNDARY FINDING (Template 2/3):"]
    N5["- First/Last Position of Element"]
    N6["- First Bad Version, Find Smallest Letter"]
    N7["ROTATED ARRAY:"]
    N8["- Search in Rotated Array I/II"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
- WHICH TEMPLATE TO USE?
- ↓
- 'Find exact element'
- ↓
- Template 1: left <= right
- ↓
- 'Find first position where condition is true'
- ↓
- Template 2: left < right, right = mid
- ↓
- 'Find last position where condition is true'
- ↓
- Template 3: left < right, left = mid, upper mid

```mermaid
flowchart TD
    N1["WHICH TEMPLATE TO USE?"]
    N2["'Find exact element'"]
    N3["→ Template 1: left &lt;= right"]
    N4["'Find first position where condition is true'"]
    N5["→ Template 2: left &lt; right, right = mid"]
    N6["'Find last position where condition is true'"]
    N7["→ Template 3: left &lt; right, left = mid, upper mid"]
    N8["'Minimize answer' (find smallest valid)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
- Before coding:
- ↓
- □ Is the search space monotonic/sorted?
- ↓
- □ What are the boundaries? (inclusive/exclusive?)
- ↓
- □ What should be returned if not found?
- ↓
- While coding:
- ↓
- □ Use left + (right - left) / 2 to avoid overflow
- ↓
- □ Match while condition with boundary updates

```mermaid
flowchart TD
    N1["Before coding:"]
    N2["□ Is the search space monotonic/sorted?"]
    N3["□ What are the boundaries? (inclusive/exclusive?)"]
    N4["□ What should be returned if not found?"]
    N5["While coding:"]
    N6["□ Use left + (right - left) / 2 to avoid overflow"]
    N7["□ Match while condition with boundary updates"]
    N8["□ Handle the mid boundary case (mid or mid ± 1?)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
- BINARY SEARCH COMPLEXITIES
- ↓
- Basic Binary Search: O(log n) time, O(1) space
- ↓
- Rotated Array Search: O(log n) time, O(1) space
- ↓
- Rotated Array w/ Dups: O(n) worst, O(log n) average
- ↓
- Binary Search on Answer: O(log R × f(n)) where R = rang
- ↓
- 2D Matrix (sorted): O(log(m×n))
- ↓
- 2D Matrix (row/col sorted): O(m + n)

```mermaid
flowchart TD
    N1["BINARY SEARCH COMPLEXITIES"]
    N2["Basic Binary Search: O(log n) time, O(1) space"]
    N3["Rotated Array Search: O(log n) time, O(1) space"]
    N4["Rotated Array w/ Dups: O(n) worst, O(log n) average"]
    N5["Binary Search on Answer: O(log R × f(n)) where R = rang"]
    N6["2D Matrix (sorted): O(log(m×n))"]
    N7["2D Matrix (row/col sorted): O(m + n)"]
    N8["Median of Two Arrays: O(log min(m, n))"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
- BINARY SEARCH - MASTER CHECKLIST
- ↓
- 1. MEMORIZE THE 3 TEMPLATES
- ↓
- - T1: Exact match (left <= right)
- ↓
- - T2: First true (left < right, right = mid)
- ↓
- - T3: Last true (left < right, left = mid, upper mid
- ↓
- 2. BINARY SEARCH ON ANSWER
- ↓
- - Define search space [min, max]

```mermaid
flowchart TD
    N1["BINARY SEARCH - MASTER CHECKLIST"]
    N2["1. MEMORIZE THE 3 TEMPLATES"]
    N3["- T1: Exact match (left &lt;= right)"]
    N4["- T2: First true (left &lt; right, right = mid)"]
    N5["- T3: Last true (left &lt; right, left = mid, upper mid"]
    N6["2. BINARY SEARCH ON ANSWER"]
    N7["- Define search space [min, max]"]
    N8["- Define feasibility check"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

**Pro Tip:** When stuck, ask yourself: "At each step, can I eliminate half of the remaining possibilities?" If yes, binary search applies!


---

> **Navigation**: [< Previous](05_LeetCode_RealWorld_Map.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_Two_Pointers_Complete.md)