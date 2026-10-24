# 13.3 Implementation Problems

> **Navigation**: [← 13.2 Bit Manipulation](02_bit_manipulation.md) | [Chapter overview](../14_Mixed_Competitive.md) | [13.4 Sorting & Searching Variations →](04_sorting_searching_variations.md)
> Page 3 of 5 in **SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS**


## Problem 209: Spiral Matrix (Codeforces Style)

```
┌────────────────────────────────────────────────────────────────┐
│  SPIRAL MATRIX - Print matrix in spiral order                  │
├────────────────────────────────────────────────────────────────┤
│  matrix = [[1,2,3],                                            │
│            [4,5,6],                                            │
│            [7,8,9]]                                            │
│                                                                │
│  ┌───┬───┬───┐                                                 │
│  │ 1 → 2 → 3 │                                                 │
│  ├───┼───┼─↓─┤                                                 │
│  │ 4 → 5 │ 6 │                                                 │
│  ├─↑─┼───┼─↓─┤                                                 │
│  │ 7 ← 8 ← 9 │                                                 │
│  └───┴───┴───┘                                                 │
│                                                                │
│  Output: [1,2,3,6,9,8,7,4,5]                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    if (matrix.length == 0) return result;

    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        // Right
        for (int i = left; i <= right; i++) {
            result.add(matrix[top][i]);
        }
        top++;

        // Down
        for (int i = top; i <= bottom; i++) {
            result.add(matrix[i][right]);
        }
        right--;

        // Left
        if (top <= bottom) {
            for (int i = right; i >= left; i--) {
                result.add(matrix[bottom][i]);
            }
            bottom--;
        }

        // Up
        if (left <= right) {
            for (int i = bottom; i >= top; i--) {
                result.add(matrix[i][left]);
            }
            left++;
        }
    }

    return result;
}
```

---

## Problem 210: Rotate Array (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  ROTATE ARRAY - Rotate by k positions                          │
├────────────────────────────────────────────────────────────────┤
│  nums = [1,2,3,4,5,6,7], k = 3                                 │
│                                                                │
│  Method: Reverse three times                                   │
│                                                                │
│  Original:      [1,2,3,4,5,6,7]                                │
│  Reverse all:   [7,6,5,4,3,2,1]                                │
│  Reverse 0..k-1:[5,6,7,4,3,2,1]                                │
│  Reverse k..n-1:[5,6,7,1,2,3,4]                                │
│                                                                │
│  Output: [5,6,7,1,2,3,4]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void rotate(int[] nums, int k) {
    k = k % nums.length;  // Handle k > length

    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}
```

---

## Problem 211: Next Permutation (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  NEXT PERMUTATION - Next lexicographically greater             │
├────────────────────────────────────────────────────────────────┤
│  nums = [1,2,3] → [1,3,2]                                      │
│  nums = [3,2,1] → [1,2,3] (wrap around)                        │
│  nums = [1,1,5] → [1,5,1]                                      │
│                                                                │
│  Algorithm:                                                    │
│  1. Find largest i where nums[i] < nums[i+1]                   │
│  2. Find largest j where nums[j] > nums[i]                     │
│  3. Swap nums[i] and nums[j]                                   │
│  4. Reverse from i+1 to end                                    │
│                                                                │
│  Example: [1,3,5,4,2]                                          │
│  Step 1: i = 1 (3 < 5)                                         │
│  Step 2: j = 3 (4 > 3)                                         │
│  Step 3: [1,4,5,3,2]                                           │
│  Step 4: [1,4,2,3,5]                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void nextPermutation(int[] nums) {
    int n = nums.length;
    int i = n - 2;

    // Find first decreasing element from right
    while (i >= 0 && nums[i] >= nums[i + 1]) {
        i--;
    }

    if (i >= 0) {
        // Find element just larger than nums[i]
        int j = n - 1;
        while (nums[j] <= nums[i]) {
            j--;
        }
        swap(nums, i, j);
    }

    // Reverse from i+1 to end
    reverse(nums, i + 1, n - 1);
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        swap(nums, start++, end--);
    }
}
```

---

[← 13.2 Bit Manipulation](02_bit_manipulation.md) | [Chapter overview](../14_Mixed_Competitive.md) | [13.4 Sorting & Searching Variations →](04_sorting_searching_variations.md)
