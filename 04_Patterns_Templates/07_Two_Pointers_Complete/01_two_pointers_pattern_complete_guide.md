# 👆👆 Two Pointers Pattern Complete Guide

> **Navigation**: [Chapter overview](../07_Two_Pointers_Complete.md) | [Same Direction Pointers →](02_same_direction_pointers.md)
> Page 1 of 5 in **Two Pointers — Pattern Guide**


From Simple Traversals to Complex Multi-Pointer Techniques

## Table of Contents

1. [Two Pointers Fundamentals](#fundamentals)
2. [Pattern Categories](#categories)
3. [Opposite Direction Pointers](#opposite)
4. [Same Direction Pointers](02_same_direction_pointers.md#same-direction)
5. [Fast & Slow Pointers](03_fast_slow_pointers.md#fast-slow)
6. [Sliding Window Connection](03_fast_slow_pointers.md#sliding-window)
7. [Multi-Array Two Pointers](03_fast_slow_pointers.md#multi-array)
8. [Advanced Patterns](04_advanced_patterns.md#advanced)
9. [Interview Problems](05_interview_problems.md#interview-problems)
10. [Quick Reference](05_interview_problems.md#quick-reference)

---

## Two Pointers Fundamentals <a name="fundamentals"></a>

### The Problem That Forces the Idea

You have a sorted array and need a pair whose sum equals a target. Brute force checks all n(n−1)/2 pairs — O(n²). For n = 100,000, that's 5 billion comparisons. Too slow.

But you have sorted order. Can you use it to eliminate candidates *without checking them*?

### The Elimination Argument — Why O(n) Is Possible

Place one pointer at the start (`left = 0`) and one at the end (`right = n-1`). Compute `sum = arr[left] + arr[right]`.

Three cases:
- **`sum == target`**: done.
- **`sum < target`**: you need a bigger sum. Moving `right--` makes sum *even smaller* (sorted!). The only productive move is `left++`. But you're not just skipping one pair — you're eliminating **every pair `(left, r)` for all `r ≤ right`**, because `arr[left] + arr[r] ≤ arr[left] + arr[right] < target`. One comparison kills an entire column of the pair space.
- **`sum > target`**: symmetric. `right--` eliminates an entire row.

**Each step eliminates at least one candidate that provably can't be the answer.** After at most `n` steps, the entire search space is exhausted. That's O(n) from O(n²) — not by being clever with data structures, but by proving that what you skip can't matter.

```
Pair space for arr = [1, 2, 4, 6, 8, 9], target = 10

        1   2   4   6   8   9       ← right pointer (starts at 9)
   1  [ 2   3   5   7   9  10]  ✓  sum=10 found at (1,9)
   2  [     4   6   8  10  11]      ← left pointer (starts at 1)
   4  [         8  10  12  13]
   6  [            12  14  15]      Brute force visits all 15 cells.
   8  [                16  17]      Two pointers walks the L-shaped
   9  [                    18]      border: at most 6 steps.

Each left++ eliminates a ROW (every remaining right for that left).
Each right-- eliminates a COLUMN (every remaining left for that right).
```

### The Single Principle Behind All Four Variants

The four "types" in the table above look like four different algorithms. They're not — they're four instances of one principle: **at every step, prove that the candidates you skip cannot contain the answer, then move the pointer that skips them.** Once you see the principle, you can re-derive any of them and invent new two-pointer techniques for problems you've never seen. The four types differ only in *which axis* the elimination runs along. (The full derivation for each variant is in "Why Each Pointer Move Is Safe" at the end of this chapter.)

## Pattern Categories <a name="categories"></a>

### The Four Main Types

## Two Pointer Patterns

1. OPPOSITE DIRECTION (Collision)
   left → ← right
   [....converging....]
   Use: Pair sum, palindrome, partition
2. SAME DIRECTION (Fast/Slow or Reader/Writer)
   slow →
   fast →
   Use: Remove duplicates, cycle detection, partition
3. SLIDING WINDOW (Special Same Direction)
   [left ... right]
   → →
   Use: Subarray/substring problems
4. MULTI-ARRAY (Merge Pattern)
   Array A: p1 →
   Array B: p2 →
   Use: Merge, intersection, comparison

---

## Opposite Direction Pointers <a name="opposite"></a>

### Two Sum II - Sorted Array (LeetCode 167)

```java
/*
Classic: Find pair with target sum in SORTED array.
Key: If sum too small, need larger (move left). If too big, need smaller (move right).
*/

public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];

        if (sum == target) {
            return new int[]{left + 1, right + 1};  // 1-indexed
        } else if (sum < target) {
            left++;   // Need larger sum
        } else {
            right--;  // Need smaller sum
        }
    }
    return new int[]{-1, -1};  // Not found
}
```

### Visual: Two Sum Logic

```
Array: [2, 7, 11, 15], target = 9

Step 1: left=0, right=3
        [2, 7, 11, 15]
         ↑          ↑
        sum = 2 + 15 = 17 > 9 → right--

Step 2: left=0, right=2
        [2, 7, 11, 15]
         ↑      ↑
        sum = 2 + 11 = 13 > 9 → right--

Step 3: left=0, right=1
        [2, 7, 11, 15]
         ↑  ↑
        sum = 2 + 7 = 9 = target ✓

Answer: [1, 2]
```

### 3Sum (LeetCode 15)

```java
/*
Find all unique triplets with sum = 0.
Fix one element, use two pointers for the rest.
*/

public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Must sort!

    for (int i = 0; i < nums.length - 2; i++) {
        // Skip duplicates for first element
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        // Early termination
        if (nums[i] > 0) break;  // Can't sum to 0 with positive

        int left = i + 1, right = nums.length - 1;
        int target = -nums[i];

        while (left < right) {
            int sum = nums[left] + nums[right];

            if (sum == target) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));

                // Skip duplicates
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;

                left++;
                right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
```

### 4Sum (LeetCode 18)

```java
/*
Generalize 3Sum: Fix two elements, two pointers for rest.
*/

public List<List<Integer>> fourSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    int n = nums.length;

    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue;

            int left = j + 1, right = n - 1;
            long remain = (long) target - nums[i] - nums[j];

            while (left < right) {
                long sum = nums[left] + nums[right];

                if (sum == remain) {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < remain) {
                    left++;
                } else {
                    right--;
                }
            }
        }
    }
    return result;
}
```

### Container With Most Water (LeetCode 11)

```java
/*
Maximize area between two lines.
Key insight: Always move the shorter line (potential to find taller).
*/

public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        int h = Math.min(height[left], height[right]);
        int w = right - left;
        maxWater = Math.max(maxWater, h * w);

        // Move the shorter side (greedy)
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
```

### Visual: Container With Most Water

```
height = [1,8,6,2,5,4,8,3,7]

Step 1: left=0, right=8
        |       |   |
      | |     | | | |
      | | |   | | | | |
      | | | | | | | | |
        width = 8, height = min(1,7) = 1, area = 8

Step 2: Move shorter (left=0 has height 1)
        left=1, right=8
          |       |
        | |     | | |
        | | |   | | | |
        | | | | | | | |
          width = 7, height = min(8,7) = 7, area = 49 ←── Best!
```

### Valid Palindrome (LeetCode 125)

```java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        // Skip non-alphanumeric
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
            left++;
        }
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
            right--;
        }

        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
```

### Reverse String (LeetCode 344)

```java
public void reverseString(char[] s) {
    int left = 0, right = s.length - 1;

    while (left < right) {
        // Swap
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;

        left++;
        right--;
    }
}
```

### Sort Colors / Dutch National Flag (LeetCode 75)

```java
/*
Three-way partition using THREE pointers.
0s go to left, 2s go to right, 1s stay in middle.
*/

public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            swap(nums, low, mid);
            low++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {  // nums[mid] == 2
            swap(nums, mid, high);
            high--;
            // Don't increment mid! We need to check swapped element
        }
    }
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}
```

---

[Chapter overview](../07_Two_Pointers_Complete.md) | [Same Direction Pointers →](02_same_direction_pointers.md)
