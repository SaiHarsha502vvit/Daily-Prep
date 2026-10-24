# 7.2 Monotonic Stack Problems

> **Navigation**: [← 7.1 Basic Stack Problems](02_basic_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.3 Queue Problems →](04_queue_problems.md)
> Page 3 of 6 in **Stack Queue**


- **Pattern:** Maintain stack in increasing/decreasing order. Elements popped have found their NGE/NSE.
- **Template:** `while (!stack.isEmpty() && arr[i] > arr[stack.peek()]) { popped = stack.pop(); answer[popped] = arr[i]; } stack.push(i);`
- **Key insight:** Each element is pushed and popped AT MOST once → O(n) total, not O(n²).

### MONOTONIC STACK - Elements in sorted order

DECREASING Stack (for Next Greater Element):

```text
Array: [2, 1, 2, 4, 3]

i=0: stack=[2]
i=1: 1 < 2, stack=[2,1]
i=2: 2 > 1, pop→NGE[1]=2, 2==2 push, stack=[2,2]
i=3: 4 > 2, pop→NGE[2]=4, 4>2 pop→NGE[0]=4, stack=[4]
i=4: 3 < 4, stack=[4,3]

NGE = [4, 2, 4, -1, -1]
```

INCREASING Stack (for Next Smaller Element):  
Same concept, but pop when current < stack top

---

## Problem 84: Daily Temperatures

**LeetCode 739** 🔗 https://leetcode.com/problems/daily-temperatures/

### DAILY TEMPERATURES - Days until warmer temperature

temperatures = [73, 74, 75, 71, 69, 72, 76, 73]

Visual Process (Monotonic Decreasing Stack by index):

| i | temp | Stack (indices) | Result |
| --- | --- | --- | --- |
| 0 | 73 | [0] | [_,_,_,_,_,_,_,_] |
| 1 | 74 | 74>73, pop, [1] | [1,_,_,_,_,_,_,_] |
| 2 | 75 | 75>74, pop, [2] | [1,1,_,_,_,_,_,_] |
| 3 | 71 | 71<75, [2,3] | [1,1,_,_,_,_,_,_] |
| 4 | 69 | 69<71, [2,3,4] | [1,1,_,_,_,_,_,_] |
| 5 | 72 | 72>69,71 pop×2 [2,5] | [1,1,_,2,1,_,_,_] |
| 6 | 76 | 76>72,75 pop×2 [6] | [1,1,4,2,1,1,_,_] |
| 7 | 73 | 73<76, [6,7] | [1,1,4,2,1,1,_,_] |

Output: [1, 1, 4, 2, 1, 1, 0, 0]

**Solution:**

```java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Pop while current temp is greater than temp at stack top
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int prevIndex = stack.pop();
            result[prevIndex] = i - prevIndex;
        }
        stack.push(i);
    }

    return result;  // Remaining indices in stack have result 0 (no warmer day)
}
```

---

## Problem 85: Next Greater Element I

**LeetCode 496** 🔗 https://leetcode.com/problems/next-greater-element-i/

**NEXT GREATER ELEMENT I**

```text
nums1 = [4, 1, 2]  (subset of nums2)
nums2 = [1, 3, 4, 2]

Find NGE in nums2 for each element in nums1:

nums2:  [1,  3,  4,  2]
NGE:    [3,  4, -1, -1]

For nums1 = [4, 1, 2]:
- 4 → NGE in nums2 = -1
- 1 → NGE in nums2 = 3
- 2 → NGE in nums2 = -1

Output: [-1, 3, -1]
```

**Solution:**

```java
public int[] nextGreaterElement(int[] nums1, int[] nums2) {
    Map<Integer, Integer> ngeMap = new HashMap<>();
    Stack<Integer> stack = new Stack<>();

    // Build NGE map for nums2
    for (int num : nums2) {
        while (!stack.isEmpty() && num > stack.peek()) {
            ngeMap.put(stack.pop(), num);
        }
        stack.push(num);
    }

    // Remaining elements have no NGE
    while (!stack.isEmpty()) {
        ngeMap.put(stack.pop(), -1);
    }

    // Build result for nums1
    int[] result = new int[nums1.length];
    for (int i = 0; i < nums1.length; i++) {
        result[i] = ngeMap.get(nums1[i]);
    }

    return result;
}
```

---

## Problem 86: Next Greater Element II (Circular Array)

**LeetCode 503** 🔗 https://leetcode.com/problems/next-greater-element-ii/

### NEXT GREATER ELEMENT II - Circular Array

nums = [1, 2, 1]  (circular: ...1, 2, 1, 1, 2, 1...)

For each element, search circularly:

| Index | Element → Search | NGE |
| --- | --- | --- |
| 0 | 1 → 2,1,1,2 → 2 | 2 |
| 1 | 2 → 1,1,2 → -1 | -1 |
| 2 | 1 → 1,2 → 2 | 2 |

Trick: Iterate 2n times, use i % n

Output: [2, -1, 2]

**Solution:**

```java
public int[] nextGreaterElements(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Stack<Integer> stack = new Stack<>();

    // Iterate twice to simulate circular array
    for (int i = 0; i < 2 * n; i++) {
        int num = nums[i % n];

        while (!stack.isEmpty() && num > nums[stack.peek()]) {
            result[stack.pop()] = num;
        }

        // Only push indices in first iteration
        if (i < n) {
            stack.push(i);
        }
    }

    return result;
}
```

---

## Problem 87: Largest Rectangle in Histogram

**LeetCode 84** 🔗 https://leetcode.com/problems/largest-rectangle-in-histogram/

**Largest rectangle in histogram**

Heights: `[2, 1, 5, 6, 2, 3]`.

| Height ↓ / Bar → | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | | | | █ | | |
| 5 | | | █ | █ | | |
| 3 | | | █ | █ | | █ |
| 2 | █ | | █ | █ | █ | █ |
| 1 | █ | █ | █ | █ | █ | █ |

The largest rectangle has area **10**: it uses the two bars of heights 5 and 6 (width 2) at height 5, so `5 × 2 = 10`.

**Key Insight:** For each bar, find how far it can extend left and right.

**Solution:**

```java
public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];

        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}
```

**Visual Stack Trace:**

| i | height | Stack | Calculation | maxArea |
| --- | --- | --- | --- | --- |
| 0 | 2 | [0] | - | 0 |
| 1 | 1 | [1] | h=2,w=1,a=2 | 2 |
| 2 | 5 | [1,2] | - | 2 |
| 3 | 6 | [1,2,3] | - | 2 |
| 4 | 2 | [1,4] | h=6,w=1,a=6 h=5,w=2,a=10 | 6<br>10 |
| 5 | 3 | [1,4,5] | - | 10 |
| 6 | 0 | [] | h=3,w=1,a=3 h=2,w=4,a=8 h=1,w=6,a=6 | 10<br>10<br>10 |

---

## Problem 88: Maximal Rectangle

**LeetCode 85** 🔗 https://leetcode.com/problems/maximal-rectangle/

### MAXIMAL RECTANGLE - Largest rectangle of 1s in binary matrix

Matrix:

| | c0 | c1 | c2 | c3 | c4 |
| --- | --- | --- | --- | --- | --- |
| **r0** | 1 | 0 | 1 | 0 | 0 |
| **r1** | 1 | 0 | 1 | 1 | 1 |
| **r2** | 1 | 1 | 1 | 1 | 1 |
| **r3** | 1 | 0 | 0 | 1 | 0 |


Convert each row to histogram heights:

```text
Row 0: heights = [1, 0, 1, 0, 0] → maxRect in hist
Row 1: heights = [2, 0, 2, 1, 1] → maxRect in hist
Row 2: heights = [3, 1, 3, 2, 2] → maxRect in hist = 6
Row 3: heights = [4, 0, 0, 3, 0] → maxRect in hist
```

The maximum rectangle of 6 comes from row 2:  
heights [3, 1, 3, 2, 2] → use [2, 2, 2] with height 2 = 6

**Solution:**

```java
public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;

    int rows = matrix.length;
    int cols = matrix[0].length;
    int[] heights = new int[cols];
    int maxArea = 0;

    for (int i = 0; i < rows; i++) {
        // Update histogram heights
        for (int j = 0; j < cols; j++) {
            heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;
        }

        // Calculate max rectangle for current histogram
        maxArea = Math.max(maxArea, largestRectangleArea(heights));
    }

    return maxArea;
}

// Same as Problem 87
private int largestRectangleArea(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    int n = heights.length;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }

    return maxArea;
}
```

---

## Problem 89: Trapping Rain Water

**LeetCode 42** 🔗 https://leetcode.com/problems/trapping-rain-water/

**TRAPPING RAIN WATER**

`height = [0,1,0,2,1,0,1,3,2,1,2,1]`

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Height** | 0 | 1 | 0 | 2 | 1 | 0 | 1 | 3 | 2 | 1 | 2 | 1 |
| **Trapped water** | 0 | 0 | 1 | 0 | 1 | 2 | 1 | 0 | 0 | 1 | 0 | 0 |

Total trapped water = **6 units**.

For each position `i`: `water[i] = min(maxLeft[i], maxRight[i]) - height[i]`.

**Solution 1: Two Pointers (O(n) time, O(1) space)**

```java
public int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMax = 0, rightMax = 0;
    int water = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
            left++;
        } else {
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
            right--;
        }
    }

    return water;
}
```

**Solution 2: Monotonic Stack**

```java
public int trapStack(int[] height) {
    Stack<Integer> stack = new Stack<>();
    int water = 0;

    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = stack.pop();

            if (stack.isEmpty()) break;

            int left = stack.peek();
            int width = i - left - 1;
            int h = Math.min(height[left], height[i]) - height[bottom];
            water += width * h;
        }
        stack.push(i);
    }

    return water;
}
```

---

🔬 **Section Challenge — 7.2 Monotonic Stack Problems**

**Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?

<details><summary>Answer</summary>

In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.

</details>

---

[← 7.1 Basic Stack Problems](02_basic_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.3 Queue Problems →](04_queue_problems.md)
