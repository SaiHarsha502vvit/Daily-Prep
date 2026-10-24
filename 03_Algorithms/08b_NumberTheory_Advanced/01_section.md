# ═══════════════════════════════════════════════════════════

> **Navigation**: [Chapter overview](../08b_NumberTheory_Advanced.md) | [═══════════════════════════════════════════════════════════ →](02_section.md)
> Page 1 of 4 in **NumberTheory Advanced**


## Algorithm: Kadane's Algorithm (Maximum Subarray Sum) ⭐⭐⭐

### Why Kadane's Works — It's a DP, Not a Trick

**The problem:** Given an array of integers (positive and negative), find the
contiguous subarray with the largest sum.

**Brute force:** Try every pair `(i, j)`, sum `arr[i..j]` → O(n³). With prefix
sums the inner sum becomes O(1), giving O(n²). Can we do O(n)?

**The DP insight that makes it O(n).**  Define:

```
dp[i] = maximum sum of any subarray that ENDS at index i
```

Why "ends at i"? Because every subarray ends *somewhere*. If we compute dp[i]
for every i, then `max(dp[0], dp[1], ..., dp[n-1])` is the answer.

**The recurrence.** A subarray ending at index `i` either:
- **Extends** the best subarray ending at `i − 1` by appending `arr[i]`, giving
  `dp[i-1] + arr[i]`, OR
- **Starts fresh** at `i` alone, giving `arr[i]`.

There's no third option — any subarray ending at `i` either includes position
`i − 1` (extend) or doesn't (restart). So:

```
dp[i] = max(arr[i], dp[i-1] + arr[i])
```

**Why restart wins exactly when dp[i-1] < 0.** If the best subarray ending at
`i − 1` has a negative sum, extending it means carrying a penalty. Starting fresh
at `arr[i]` alone is strictly better because `arr[i] > dp[i-1] + arr[i]` when
`dp[i-1] < 0`. The algorithm isn't "resetting when negative" by heuristic — it's
choosing the optimal DP transition at every step.

**Space optimization.** `dp[i]` depends only on `dp[i-1]`, so we replace the
array with a single variable `currentSum`. That's the code below:

```java
/**
 * Time: O(n), Space: O(1)
 */
public static int kadane(int[] arr) {
    int maxSum = arr[0];
    int currentSum = arr[0];

    for (int i = 1; i < arr.length; i++) {
        // Either extend current subarray or start fresh
        currentSum = Math.max(arr[i], currentSum + arr[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}

// With indices (find WHERE the maximum subarray is)
public static int[] kadaneWithIndices(int[] arr) {
    int maxSum = arr[0], currentSum = arr[0];
    int start = 0, end = 0, tempStart = 0;

    for (int i = 1; i < arr.length; i++) {
        if (arr[i] > currentSum + arr[i]) {
            currentSum = arr[i];
            tempStart = i;
        } else {
            currentSum += arr[i];
        }

        if (currentSum > maxSum) {
            maxSum = currentSum;
            start = tempStart;
            end = i;
        }
    }

    return new int[]{maxSum, start, end};
}

// TEST:
// kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]) → 6 (subarray: [4, -1, 2, 1])
// kadane([-1, -2, -3]) → -1 (all negative? pick least negative)
// kadane([5, -3, 5]) → 7 (entire array)
```

---

🔬 **Section Challenge — Algorithm: Kadane's Algorithm (Maximum Subarray Sum) ⭐⭐⭐**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## Algorithm: Dutch National Flag (3-Way Partition) ⭐⭐

```java
/**
 * WHY: Sort array with only 3 distinct values in ONE pass
 * WHERE: Sorting 0s, 1s, 2s  |  Red, White, Blue balls
 *
 * REAL INCIDENT:
 *   Priority queue at hospital ER:
 *   Priority 0 (Critical) → front
 *   Priority 1 (Urgent) → middle
 *   Priority 2 (Normal) → end
 *   Need to sort patients in O(n) single pass
 *
 * HOW: Three pointers - low, mid, high
 *   - 0s go to low region
 *   - 1s stay in middle
 *   - 2s go to high region
 *
 * Time: O(n), Space: O(1)
 */
public static void dutchNationalFlag(int[] arr) {
    int low = 0, mid = 0, high = arr.length - 1;

    while (mid <= high) {
        switch (arr[mid]) {
            case 0:
                swap(arr, low, mid);
                low++;
                mid++;
                break;
            case 1:
                mid++;
                break;
            case 2:
                swap(arr, mid, high);
                high--;
                // Don't increment mid! New element needs checking
                break;
        }
    }
}

private static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

// TEST:
// [2,0,1,2,0,1,0] → [0,0,0,1,1,2,2]
// [0,0,0] → [0,0,0]
// [2,1,0] → [0,1,2]
```

---

## Algorithm: Boyer-Moore Voting (Majority Element) ⭐⭐

```java
/**
 * WHY: Find element that appears more than n/2 times
 * WHERE: Election vote counting, consensus in distributed systems
 *
 * REAL INCIDENT:
 *   Online poll with millions of votes
 *   Need to find winner (if exists) without storing all counts
 *   Memory constraint: Only O(1) extra space!
 *
 * HOW: Maintain candidate and count
 *   - Same as candidate → count++
 *   - Different → count--
 *   - Count reaches 0 → new candidate
 *
 * INTUITION: Majority element will "survive" all the cancellations
 *
 * Time: O(n), Space: O(1)
 */
public static int majorityElement(int[] nums) {
    int candidate = nums[0];
    int count = 1;

    // Phase 1: Find candidate
    for (int i = 1; i < nums.length; i++) {
        if (count == 0) {
            candidate = nums[i];
            count = 1;
        } else if (nums[i] == candidate) {
            count++;
        } else {
            count--;
        }
    }

    // Phase 2: Verify (optional, needed if majority not guaranteed)
    count = 0;
    for (int num : nums) {
        if (num == candidate) count++;
    }

    return count > nums.length / 2 ? candidate : -1;
}

// TEST:
// majorityElement([3, 2, 3]) → 3
// majorityElement([2, 2, 1, 1, 1, 2, 2]) → 2
// majorityElement([1, 2, 3]) → -1 (no majority)
```

---

## Algorithm: Tortoise and Hare (Cycle Detection) ⭐⭐

```java
/**
 * WHY: Detect cycles in linked lists or arrays
 * WHERE: Deadlock detection, finding duplicates, infinite loop detection
 *
 * REAL INCIDENT:
 *   Database had circular foreign key references
 *   A → B → C → A (cycle!)
 *   Floyd's algorithm detected it without extra memory
 *
 * HOW: Two pointers - slow (1 step) and fast (2 steps)
 *   If cycle exists, they WILL meet
 *   Finding start of cycle: Reset slow to head, both move 1 step
 *
 * Time: O(n), Space: O(1)
 */
public static boolean hasCycle(ListNode head) {
    if (head == null) return false;

    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) return true; // Cycle detected!
    }

    return false; // No cycle
}

// Find WHERE the cycle starts
public static ListNode findCycleStart(ListNode head) {
    ListNode slow = head, fast = head;

    // Phase 1: Detect cycle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) break;
    }

    if (fast == null || fast.next == null) return null; // No cycle

    // Phase 2: Find start
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }

    return slow; // Start of cycle
}

// Application: Find duplicate in array (no extra space)
// Array of n+1 elements, values 1 to n → at least one duplicate
public static int findDuplicate(int[] nums) {
    int slow = nums[0];
    int fast = nums[0];

    // Phase 1: Find meeting point
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);

    // Phase 2: Find duplicate
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }

    return slow;
}
```

---

## Algorithm: Monotonic Stack ⭐⭐

```java
/**
 * WHY: Find next greater/smaller element efficiently
 * WHERE: Stock price analysis, histogram problems, building skylines
 *
 * REAL INCIDENT:
 *   Weather app needed "next warmer day" feature
 *   Given daily temperatures, for each day find how many days
 *   until a warmer temperature
 *
 * HOW: Stack stores indices, maintain decreasing order
 *   When we find larger element, pop everything smaller
 *
 * Time: O(n), Space: O(n)
 */

// Next Greater Element
public static int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1); // Default: no greater element

    Stack<Integer> stack = new Stack<>(); // Stores indices

    for (int i = 0; i < n; i++) {
        // Pop elements smaller than current
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }

    return result;
}

// Daily Temperatures (days until warmer)
public static int[] dailyTemperatures(int[] temps) {
    int n = temps.length;
    int[] result = new int[n];

    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {
            int prevDay = stack.pop();
            result[prevDay] = i - prevDay; // Days until warmer
        }
        stack.push(i);
    }

    return result;
}

// Largest Rectangle in Histogram ⭐⭐⭐
public static int largestRectangleInHistogram(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;

    for (int i = 0; i <= heights.length; i++) {
        int currentHeight = (i == heights.length) ? 0 : heights[i];

        while (!stack.isEmpty() && currentHeight < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : (i - stack.peek() - 1);
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}

// TEST:
// nextGreaterElement([4, 5, 2, 10, 8]) → [5, 10, 10, -1, -1]
// dailyTemperatures([73,74,75,71,69,72,76,73]) → [1,1,4,2,1,1,0,0]
// largestRectangleInHistogram([2,1,5,6,2,3]) → 10
```

---

## Algorithm: Prefix Sum & Difference Array ⭐⭐

```java
/**
 * WHY: Answer range sum queries in O(1) after O(n) preprocessing
 * WHERE: Financial reports, analytics dashboards, image processing
 *
 * REAL INCIDENT:
 *   Flipkart analytics: "Total revenue between day 50 and day 100?"
 *   Without prefix sum: scan 50 entries every query
 *   With prefix sum: ONE subtraction!
 *
 * Time: Build O(n), Query O(1)
 */

// 1D Prefix Sum
public static long[] buildPrefixSum(int[] arr) {
    long[] prefix = new long[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

// Range sum query [left, right] inclusive
public static long rangeSum(long[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];
}

// 2D Prefix Sum (for matrix queries)
public static long[][] build2DPrefixSum(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    long[][] prefix = new long[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            prefix[i][j] = matrix[i-1][j-1]
                         + prefix[i-1][j]
                         + prefix[i][j-1]
                         - prefix[i-1][j-1];
        }
    }

    return prefix;
}

// Difference Array: Efficient range updates
// Add +val to all elements from index left to right
public static void rangeUpdate(int[] diff, int left, int right, int val) {
    diff[left] += val;
    if (right + 1 < diff.length) {
        diff[right + 1] -= val;
    }
}

// Convert difference array back to original
public static int[] reconstructFromDiff(int[] diff) {
    int[] result = new int[diff.length];
    result[0] = diff[0];
    for (int i = 1; i < diff.length; i++) {
        result[i] = result[i - 1] + diff[i];
    }
    return result;
}
```

---

[Chapter overview](../08b_NumberTheory_Advanced.md) | [═══════════════════════════════════════════════════════════ →](02_section.md)
