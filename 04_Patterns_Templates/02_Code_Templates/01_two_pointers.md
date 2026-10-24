# 📌 1. Two Pointers

> **Navigation**: [Chapter overview](../02_Code_Templates.md) | [3. Sliding Window — Variable →](02_sliding_window_variable.md)
> Page 1 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

```
                  TWO POINTERS VISUALIZATION
──────────────────────────────────────────────────

TYPE 1: OPPOSITE ENDS (converging)
───────────────────────────────────
Use for: Two Sum (sorted), Palindrome check, Container with water

[1, 2, 3, 4, 5, 6, 7, 8, 9]
 ↑                       ↑
left                   right
 └─────────→   ←─────────┘
      Move towards each other

─────────────────────────────────────────────────────────────────────

TYPE 2: SAME DIRECTION (fast/slow)
───────────────────────────────────
Use for: Remove duplicates, Partition, Cycle detection

[1, 1, 2, 2, 2, 3, 4, 4, 5]
 ↑  ↑
slow fast
 └──→──→──→──→
      Both move same direction

─────────────────────────────────────────────────────────────────────

TYPE 3: TWO ARRAYS
─────────────────
Use for: Merge sorted arrays, Find intersection

Array1: [1, 3, 5, 7]     Array2: [2, 3, 6, 8]
         ↑                        ↑
        i                        j
 Compare arr1[i] vs arr2[j], move smaller pointer
```

## Template: Two Sum (Sorted Array)

```java
/**
 * VISUAL: Two pointers from opposite ends
 *
 * Array: [1, 2, 3, 5, 7, 10]  Target: 8
 *         ↑              ↑
 *        left          right
 *
 * 1+10=11 > 8 → right--
 * 1+7=8 == 8 → FOUND!
 */
public int[] twoSum(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;   // Need bigger sum, move left forward
        } else {
            right--;  // Need smaller sum, move right backward
        }
    }
    return new int[]{-1, -1};  // Not found
}
```

## Template: Remove Duplicates In-Place

```java
/**
 * VISUAL: Fast pointer finds unique, slow marks position
 *
 * [1, 1, 2, 2, 2, 3, 4]
 *  ↑  ↑
 * slow fast
 *
 * fast=1: arr[1]==arr[0], skip
 * fast=2: arr[2]!=arr[0], slow++, arr[1]=arr[2]
 * [1, 2, 2, 2, 2, 3, 4]
 *     ↑     ↑
 *    slow  fast
 */
public int removeDuplicates(int[] arr) {
    if (arr.length == 0) return 0;

    int slow = 0;  // Position to place next unique element

    for (int fast = 1; fast < arr.length; fast++) {
        if (arr[fast] != arr[slow]) {
            slow++;
            arr[slow] = arr[fast];
        }
    }
    return slow + 1;  // Length of unique array
}
```

## Template: Palindrome Check

```java
/**
 * VISUAL: Check from both ends toward middle
 *
 * "racecar"
 *  ↑     ↑
 * left  right
 *
 * r==r ✓, left++, right--
 * a==a ✓, left++, right--
 * c==c ✓, left++, right--
 * e (middle) → PALINDROME!
 */
public boolean isPalindrome(String s) {
    int left = 0;
    int right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
```

---

## 📌 2. Sliding Window — Fixed

### Visual Concept

```
                  FIXED SLIDING WINDOW
──────────────────────────────────────────────────

Problem: Find max sum of any subarray of size K=3
Array: [2, 1, 5, 1, 3, 2]

Step 1: Build first window of size K
┌───────────────────────┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
└───────────────────────┘
└─────────┘
 window sum = 8

Step 2: Slide - Remove leftmost, Add rightmost
    ┌─────────────┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
    └─────────────┘
    └─────────┘
 -2        +1
 window sum = 8 - 2 + 1 = 7

Step 3: Continue sliding
        ┌─────────────┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
        └─────────────┘
 window sum = 7 - 1 + 3 = 9 ⭐ MAX

Step 4: Continue
            ┌─────────────┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
            └─────────────┘
 window sum = 9 - 5 + 2 = 6

Answer: Maximum sum = 9
```

### Template: Max Sum of Size K Subarray

```java
/**
 * FIXED WINDOW TEMPLATE
 * Time: O(N), Space: O(1)
 *
 * Key formula: windowSize = j - i + 1
 * When windowSize == k, we have a valid window
 */
public int maxSumSubarray(int[] arr, int k) {
    int maxSum = Integer.MIN_VALUE;
    int windowSum = 0;

    for (int j = 0; j < arr.length; j++) {
        // Expand: Add current element to window
        windowSum += arr[j];

        // Check: Do we have K elements?
        int windowSize = j + 1;  // Since i starts at 0

        if (windowSize == k) {
            // Update answer
            maxSum = Math.max(maxSum, windowSum);

            // Slide: Remove leftmost element
            windowSum -= arr[j - k + 1];  // Remove element at (j - k + 1)
        }
    }
    return maxSum;
}

// Alternative with explicit left pointer (easier to understand):
public int maxSumSubarrayV2(int[] arr, int k) {
    int maxSum = Integer.MIN_VALUE;
    int windowSum = 0;
    int left = 0;

    for (int right = 0; right < arr.length; right++) {
        // Expand: Add right element
        windowSum += arr[right];

        // Count elements in window
        int windowSize = right - left + 1;

        if (windowSize == k) {
            // Update answer
            maxSum = Math.max(maxSum, windowSum);

            // Slide: Remove left element, move left pointer
            windowSum -= arr[left];
            left++;
        }
    }
    return maxSum;
}
```

---

🔬 **Section Challenge — 📌 2. Sliding Window — Fixed**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

---

[Chapter overview](../02_Code_Templates.md) | [3. Sliding Window — Variable →](02_sliding_window_variable.md)
