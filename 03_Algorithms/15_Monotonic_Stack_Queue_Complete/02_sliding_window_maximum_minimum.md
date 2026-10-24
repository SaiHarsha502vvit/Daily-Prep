# Sliding Window Maximum/Minimum <a name="sliding-window"></a>

> **Navigation**: [← What Problem Does Monotonic Stack Solve](01_what_problem_does_monotonic_stack_solve.md) | [Chapter overview](../15_Monotonic_Stack_Queue_Complete.md) | [Interview Problems →](03_interview_problems.md)
> Page 2 of 3 in **Monotonic Stack & Queue Complete Guide**


## Sliding Window Maximum (LeetCode 239)

```java
/*
Find maximum in each sliding window of size k.
Use DECREASING deque to keep potential maximums.
*/

public int[] maxSlidingWindow(int[] nums, int k) {
    if (nums.length == 0) return new int[0];

    int[] result = new int[nums.length - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < nums.length; i++) {
        // Remove indices outside current window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements (they can't be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        // Add current index
        deque.offerLast(i);

        // Record max when window is complete
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

## Visual: Sliding Window Maximum

```
nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3

i=0: deque=[0], (1)                    window not complete
i=1: deque=[1], (3)                    window not complete
i=2: deque=[1,2], (3,-1)               result[0] = nums[1] = 3

i=3: deque=[1,2,3], check front: 1 >= 3-3+1=1 ✓
     deque=[1,2,3], (3,-1,-3)          result[1] = nums[1] = 3

i=4: deque=[1,2,3], check front: 1 < 4-3+1=2 ✗, pop
     deque=[2,3], check front: 2 >= 2 ✓
     nums[3]=-3 < 5, nums[2]=-1 < 5, pop all
     deque=[4], (5)                     result[2] = nums[4] = 5

i=5: deque=[4,5], nums[5]=3 < 5        result[3] = nums[4] = 5

i=6: check front: 4 < 6-3+1=4 ✗, pop
     deque=[5], nums[5]=3 < 6, pop
     deque=[6], (6)                     result[4] = nums[6] = 6

i=7: deque=[6,7], nums[7]=7 > 6, pop
     deque=[7], (7)                     result[5] = nums[7] = 7

Result: [3, 3, 5, 5, 6, 7]
```

## Sliding Window Minimum

```java
/*
Same as maximum but use INCREASING deque.
*/

public int[] minSlidingWindow(int[] nums, int k) {
    int[] result = new int[nums.length - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < nums.length; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove LARGER elements (opposite of max)
        while (!deque.isEmpty() && nums[deque.peekLast()] > nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

---

## Advanced Applications <a name="advanced"></a>

### Largest Rectangle in Histogram (LeetCode 84)

```java
/*
Find largest rectangle area in histogram.
For each bar, find left and right boundaries where it can extend.
Key: Bar can extend until it hits a SMALLER bar.
*/

public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int[] left = new int[n];   // Left boundary (first smaller)
    int[] right = new int[n];  // Right boundary (first smaller)

    // Find previous smaller element
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && heights[stack.peek()] >= heights[i]) {
            stack.pop();
        }
        left[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(i);
    }

    // Find next smaller element
    stack.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && heights[stack.peek()] >= heights[i]) {
            stack.pop();
        }
        right[i] = stack.isEmpty() ? n : stack.peek();
        stack.push(i);
    }

    // Calculate max area
    int maxArea = 0;
    for (int i = 0; i < n; i++) {
        int width = right[i] - left[i] - 1;
        int area = heights[i] * width;
        maxArea = Math.max(maxArea, area);
    }

    return maxArea;
}

// One-pass solution
public int largestRectangleAreaOnePass(int[] heights) {
    int n = heights.length;
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];

        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }

    return maxArea;
}
```

### Visual: Largest Rectangle in Histogram

`heights = [2, 1, 5, 6, 2, 3]`

| Index | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| **Height** | 2 | 1 | 5 | 6 | 2 | 3 |
| **Bar** | ██ | █ | █████ | ██████ | ██ | ███ |

For the bar at index 2 (height 5):

- It can extend left until the bar at index 1 (height 1 < 5).
- It can extend right until the bar at index 4 (height 2 < 5).
- Width = 4 - 1 - 1 = 2.
- Area = 5 × 2 = 10.

The maximum rectangle has area **10** (using the bars at indices 2 and 3).

### Maximal Rectangle (LeetCode 85)

```java
/*
Find largest rectangle containing only 1s in binary matrix.
Treat each row as histogram base.
*/

public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;

    int m = matrix.length, n = matrix[0].length;
    int[] heights = new int[n];
    int maxArea = 0;

    for (int i = 0; i < m; i++) {
        // Build histogram for row i
        for (int j = 0; j < n; j++) {
            if (matrix[i][j] == '1') {
                heights[j]++;
            } else {
                heights[j] = 0;
            }
        }

        // Find largest rectangle in this histogram
        maxArea = Math.max(maxArea, largestRectangleArea(heights));
    }

    return maxArea;
}
```

### Trapping Rain Water (LeetCode 42) - Monotonic Stack Solution

```java
/*
Alternative to two-pointer approach using monotonic stack.
*/

public int trap(int[] height) {
    Deque<Integer> stack = new ArrayDeque<>();
    int water = 0;

    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = height[stack.pop()];

            if (stack.isEmpty()) break;

            int left = stack.peek();
            int h = Math.min(height[left], height[i]) - bottom;
            int w = i - left - 1;
            water += h * w;
        }
        stack.push(i);
    }

    return water;
}
```

### Remove K Digits (LeetCode 402)

```java
/*
Remove k digits to make smallest number.
Use monotonic increasing stack.
*/

public String removeKdigits(String num, int k) {
    if (k >= num.length()) return "0";

    Deque<Character> stack = new ArrayDeque<>();

    for (char c : num.toCharArray()) {
        // Remove larger digits before adding smaller one
        while (k > 0 && !stack.isEmpty() && stack.peek() > c) {
            stack.pop();
            k--;
        }
        stack.push(c);
    }

    // If k still > 0, remove from end
    while (k > 0) {
        stack.pop();
        k--;
    }

    // Build result (stack is reversed)
    StringBuilder sb = new StringBuilder();
    while (!stack.isEmpty()) {
        sb.append(stack.pop());
    }
    sb.reverse();

    // Remove leading zeros
    while (sb.length() > 1 && sb.charAt(0) == '0') {
        sb.deleteCharAt(0);
    }

    return sb.toString();
}
```

### 132 Pattern (LeetCode 456)

```java
/*
Find i < j < k where nums[i] < nums[k] < nums[j].
Process from right, track "2" (nums[k]) using monotonic stack.
*/

public boolean find132pattern(int[] nums) {
    int n = nums.length;
    if (n < 3) return false;

    Deque<Integer> stack = new ArrayDeque<>();  // Decreasing
    int second = Integer.MIN_VALUE;  // The "2" in 132 (nums[k])

    // Process from right to left
    for (int i = n - 1; i >= 0; i--) {
        // nums[i] is candidate for "1"
        // second is "2", anything popped can be "2"
        if (nums[i] < second) {
            return true;  // Found 132 pattern!
        }

        // Pop elements smaller than current (they can be "2")
        while (!stack.isEmpty() && nums[i] > stack.peek()) {
            second = stack.pop();  // Update "2" to largest possible
        }

        stack.push(nums[i]);  // Push as potential "3"
    }

    return false;
}
```

---

[← What Problem Does Monotonic Stack Solve](01_what_problem_does_monotonic_stack_solve.md) | [Chapter overview](../15_Monotonic_Stack_Queue_Complete.md) | [Interview Problems →](03_interview_problems.md)
