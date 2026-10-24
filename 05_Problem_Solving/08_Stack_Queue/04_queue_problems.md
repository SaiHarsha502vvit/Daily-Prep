# 7.3 Queue Problems

> **Navigation**: [← 7.2 Monotonic Stack Problems](03_monotonic_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.4 Advanced Stack Problems →](05_advanced_stack_problems.md)
> Page 4 of 6 in **Stack Queue**


**Pattern:** FIFO processing. BFS uses queue naturally. Sliding window max uses monotonic deque.
**Key insight for Sliding Window Max:** Maintain a decreasing deque. Front = current max. Pop front if outside window. Pop back if new element is larger.

## Problem 90: Implement Queue using Stacks

**LeetCode 232** 🔗 https://leetcode.com/problems/implement-queue-using-stacks/

**Implement a queue using stacks**

Use two stacks, `inputStack` and `outputStack`.

| Operation | `inputStack` | `outputStack` | Note |
| --- | --- | --- | --- |
| `push(1)`, `push(2)`, `push(3)` | `[1, 2, 3]` | `[]` | New elements go to `inputStack` |
| `pop()`: we need the front (1), so transfer input → output | `[]` | `[3, 2, 1]` | `pop` returns 1 from the top of `outputStack` |

Now `outputStack` has the elements in the correct order for FIFO.

**Solution:**

```java
class MyQueue {
    private Stack<Integer> input;
    private Stack<Integer> output;

    public MyQueue() {
        input = new Stack<>();
        output = new Stack<>();
    }

    public void push(int x) {
        input.push(x);
    }

    public int pop() {
        peek();  // Ensure output has elements
        return output.pop();
    }

    public int peek() {
        if (output.isEmpty()) {
            while (!input.isEmpty()) {
                output.push(input.pop());
            }
        }
        return output.peek();
    }

    public boolean empty() {
        return input.isEmpty() && output.isEmpty();
    }
}
```

---

## Problem 91: Implement Stack using Queues

**LeetCode 225** 🔗 https://leetcode.com/problems/implement-stack-using-queues/

**IMPLEMENT STACK USING QUEUES**

```text
Approach: Make push O(n) to keep LIFO order

push(1): queue = [1]
push(2): add 2, rotate 1 time
         [1,2] → poll 1, add 1 → [2,1]
push(3): add 3, rotate 2 times
         [2,1,3] → [1,3,2] → [3,2,1]

Now front of queue is top of stack!
pop() → returns 3
top() → returns 2
```

**Solution:**

```java
class MyStack {
    private Queue<Integer> queue;

    public MyStack() {
        queue = new LinkedList<>();
    }

    public void push(int x) {
        queue.add(x);
        // Rotate to put x at front
        int size = queue.size();
        for (int i = 0; i < size - 1; i++) {
            queue.add(queue.poll());
        }
    }

    public int pop() {
        return queue.poll();
    }

    public int top() {
        return queue.peek();
    }

    public boolean empty() {
        return queue.isEmpty();
    }
}
```

---

## Problem 92: Sliding Window Maximum

**LeetCode 239** 🔗 https://leetcode.com/problems/sliding-window-maximum/

### SLIDING WINDOW MAXIMUM - Max in each window of size k

nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3

Use Monotonic Decreasing Deque (store indices):

| Window | Deque (indices) | Max |  |
| --- | --- | --- | --- |
| [1,3,-1] | [1,2]→vals[3,-1] | 3 |  |
| [3,-1,-3] | [1,2,3]→[3,-1,-3] | 3 |  |
| [-1,-3,5] | [4]→[5] | 5 |  |
| [-3,5,3] | [4,5]→[5,3] | 5 |  |
| [5,3,6] | [6]→[6] | 6 |  |
| [3,6,7] | [7]→[7] | 7 |  |

Output: [3, 3, 5, 5, 6, 7]

Why Monotonic Decreasing?
- Front always has maximum
- Smaller elements behind larger can never be max

**Solution:**

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Remove indices out of window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements (they'll never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // Window is complete
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

---

## Problem 93: 🔒 Shortest Subarray with Sum at Least K (LeetCode 862 - Hard)

**SHORTEST SUBARRAY WITH SUM AT LEAST K**

```text
Return the length of the shortest non-empty subarray with
sum at least k. If no such subarray exists, return -1.
Note: Array can have NEGATIVE numbers!

Examples:
Input: nums = [1], k = 1        → Output: 1
Input: nums = [1,2], k = 4      → Output: -1
Input: nums = [2,-1,2], k = 3   → Output: 3

Constraints:
- 1 <= nums.length <= 10^5
- -10^5 <= nums[i] <= 10^5
- 1 <= k <= 10^9

Key Insight: Use prefix sum + monotonic deque
prefix[j] - prefix[i] >= k means subarray (i,j] has sum >= k
```

**Solution:**

```java
public int shortestSubarray(int[] nums, int k) {
    int n = nums.length;
    long[] prefix = new long[n + 1];

    // Build prefix sum
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    int minLen = Integer.MAX_VALUE;
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i <= n; i++) {
        // Check if current prefix - some earlier prefix >= k
        while (!deque.isEmpty() && prefix[i] - prefix[deque.peekFirst()] >= k) {
            minLen = Math.min(minLen, i - deque.pollFirst());
        }

        // Maintain monotonic increasing deque
        // Remove larger prefix sums (they give shorter subarrays)
        while (!deque.isEmpty() && prefix[i] <= prefix[deque.peekLast()]) {
            deque.pollLast();
        }

        deque.offerLast(i);
    }

    return minLen == Integer.MAX_VALUE ? -1 : minLen;
}
```

---

## Problem 94: 🔒 Design Circular Queue (LeetCode 622)

**Design circular queue.** Design your own implementation of a circular queue (capacity 5).

| Step | Slot 0 | Slot 1 | Slot 2 | Slot 3 | Slot 4 | `front` | `rear` | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Start | 1 | 2 | 3 | | | 0 | 2 | |
| After `enQueue(4)`, `enQueue(5)` | 1 | 2 | 3 | 4 | 5 | 0 | 4 | Full |
| After `deQueue()` twice, then `enQueue(6)` | 6 | | 3 | 4 | 5 | 2 | 0 | `rear` wraps around |

Operations:

- `MyCircularQueue(k)`: initialise with size `k`
- `enQueue(value)`: insert an element, return success
- `deQueue()`: delete the front element, return success
- `Front()`: get the front item
- `Rear()`: get the rear item
- `isEmpty()`: check if empty
- `isFull()`: check if full

**Solution:**

```java
class MyCircularQueue {
    private int[] data;
    private int front, rear, size, capacity;

    public MyCircularQueue(int k) {
        data = new int[k];
        capacity = k;
        front = 0;
        rear = -1;
        size = 0;
    }

    public boolean enQueue(int value) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;
        data[rear] = value;
        size++;
        return true;
    }

    public boolean deQueue() {
        if (isEmpty()) return false;

        front = (front + 1) % capacity;
        size--;
        return true;
    }

    public int Front() {
        return isEmpty() ? -1 : data[front];
    }

    public int Rear() {
        return isEmpty() ? -1 : data[rear];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }
}
```

---

## Problem 95: 🔒 Design Circular Deque (LeetCode 641)

**DESIGN CIRCULAR DEQUE (Double-ended Queue)**

```text
Design a circular deque with these operations:
- insertFront(): Add at front
- insertLast(): Add at rear
- deleteFront(): Remove from front
- deleteLast(): Remove from rear
- getFront(): Get front element
- getRear(): Get rear element
- isEmpty(): Check if empty
- isFull(): Check if full

Example:
MyCircularDeque deque = new MyCircularDeque(3);
deque.insertLast(1);  // return true
deque.insertLast(2);  // return true
deque.insertFront(3); // return true
deque.insertFront(4); // return false (full)
deque.getRear();      // return 2
deque.isFull();       // return true
deque.deleteLast();   // return true
deque.insertFront(4); // return true
deque.getFront();     // return 4

Constraints:
- 1 <= k <= 1000
- 0 <= value <= 1000
- At most 2000 calls to operations
```

**Solution:**

```java
class MyCircularDeque {
    private int[] data;
    private int front, rear, size, capacity;

    public MyCircularDeque(int k) {
        data = new int[k];
        capacity = k;
        front = 0;
        rear = k - 1;
        size = 0;
    }

    public boolean insertFront(int value) {
        if (isFull()) return false;

        front = (front - 1 + capacity) % capacity;
        data[front] = value;
        size++;
        return true;
    }

    public boolean insertLast(int value) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;
        data[rear] = value;
        size++;
        return true;
    }

    public boolean deleteFront() {
        if (isEmpty()) return false;

        front = (front + 1) % capacity;
        size--;
        return true;
    }

    public boolean deleteLast() {
        if (isEmpty()) return false;

        rear = (rear - 1 + capacity) % capacity;
        size--;
        return true;
    }

    public int getFront() {
        return isEmpty() ? -1 : data[front];
    }

    public int getRear() {
        return isEmpty() ? -1 : data[rear];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }
}
```

---

[← 7.2 Monotonic Stack Problems](03_monotonic_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.4 Advanced Stack Problems →](05_advanced_stack_problems.md)
