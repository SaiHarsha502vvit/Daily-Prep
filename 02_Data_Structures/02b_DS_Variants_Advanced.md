> **Navigation**: [< Previous Chapter](02a_DS_Variants_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

# 📚 Part 2: Stack Variants

## 2.1 Min Stack

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MIN STACK - COMPLETE GUIDE                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A stack that supports:                                                      │
│ • push(x)   - O(1)                                                          │
│ • pop()     - O(1)                                                          │
│ • top()     - O(1)                                                          │
│ • getMin()  - O(1)  ← THE SPECIAL OPERATION!                                │
│                                                                             │
│ CHALLENGE: How to get minimum in O(1)?                                      │
│                                                                             │
│ NAIVE: Search entire stack → O(n)                                           │
│ SMART: Track minimum at EACH state of the stack!                            │
│                                                                             │
│ APPROACH 1 - TWO STACKS:                                                    │
│   Main Stack:  [3, 5, 2, 7, 1]  top→                                        │
│   Min Stack:   [3, 3, 2, 2, 1]  top→                                        │
│                                                                             │
│   Min stack stores the minimum at each point!                               │
│   When we pop, both stacks pop.                                             │
│   getMin() = minStack.top()                                                 │
│                                                                             │
│ APPROACH 2 - SINGLE STACK WITH PAIRS:                                       │
│   Stack: [(3,3), (5,3), (2,2), (7,2), (1,1)]                                │
│          (value, min_at_this_point)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// MIN STACK - TWO STACK APPROACH
public class MinStack {
    private Stack<Integer> mainStack;
    private Stack<Integer> minStack;

    public MinStack() {
        mainStack = new Stack<>();
        minStack = new Stack<>();
    }

    public void push(int val) {
        mainStack.push(val);

        // Push to minStack: either val or current min (whichever is smaller)
        if (minStack.isEmpty()) {
            minStack.push(val);
        } else {
            minStack.push(Math.min(val, minStack.peek()));
        }
    }

    public void pop() {
        mainStack.pop();
        minStack.pop();
    }

    public int top() {
        return mainStack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }
}

// MIN STACK - SPACE OPTIMIZED (SINGLE STACK)
public class MinStackOptimized {
    private Stack<Long> stack;
    private long min;

    public MinStackOptimized() {
        stack = new Stack<>();
    }

    public void push(int val) {
        if (stack.isEmpty()) {
            min = val;
            stack.push(0L);  // Difference from min
        } else {
            stack.push((long)val - min);
            if (val < min) {
                min = val;
            }
        }
    }

    public void pop() {
        long top = stack.pop();
        if (top < 0) {
            // We need to restore previous min
            min = min - top;
        }
    }

    public int top() {
        long top = stack.peek();
        if (top < 0) {
            return (int)min;
        }
        return (int)(min + top);
    }

    public int getMin() {
        return (int)min;
    }
}
```

---

## 2.2 Max Stack

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MAX STACK - COMPLETE GUIDE                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Similar to Min Stack but also supports:                                     │
│ • popMax() - Remove and return the maximum element                          │
│                                                                             │
│ This is HARDER than Min Stack because:                                      │
│ - popMax() might remove element from MIDDLE of stack                        │
│ - Need to maintain consistency                                              │
│                                                                             │
│ APPROACH: Use TreeMap + Doubly Linked List                                  │
│   - Doubly Linked List: Maintains stack order                               │
│   - TreeMap: Maps values to their nodes for O(log n) max finding            │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// MAX STACK - SIMPLE VERSION (O(n) popMax)
public class MaxStackSimple {
    private Stack<Integer> stack;
    private Stack<Integer> maxStack;

    public MaxStackSimple() {
        stack = new Stack<>();
        maxStack = new Stack<>();
    }

    public void push(int x) {
        stack.push(x);
        if (maxStack.isEmpty()) {
            maxStack.push(x);
        } else {
            maxStack.push(Math.max(x, maxStack.peek()));
        }
    }

    public int pop() {
        maxStack.pop();
        return stack.pop();
    }

    public int top() {
        return stack.peek();
    }

    public int peekMax() {
        return maxStack.peek();
    }

    // O(n) - Need to rebuild stack
    public int popMax() {
        int max = maxStack.peek();
        Stack<Integer> temp = new Stack<>();

        // Pop until we find max
        while (stack.peek() != max) {
            temp.push(pop());
        }

        // Pop the max
        pop();

        // Push back
        while (!temp.isEmpty()) {
            push(temp.pop());
        }

        return max;
    }
}
```

---

# 📬 Part 3: Queue Variants

## 3.1 Circular Queue

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    CIRCULAR QUEUE - COMPLETE GUIDE                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A queue implemented using a circular array.                                 │
│ When we reach the end of the array, we wrap around to the beginning!        │
│                                                                             │
│ WHY CIRCULAR?                                                               │
│                                                                             │
│ LINEAR QUEUE PROBLEM:                                                       │
│   After many enqueue/dequeue operations:                                    │
│   [_, _, _, _, 5, 6, 7, _]                                                  │
│               ↑        ↑                                                    │
│             front    rear                                                   │
│   Wasted space at beginning!                                                │
│                                                                             │
│ CIRCULAR QUEUE SOLUTION:                                                    │
│   [8, 9, _, _, 5, 6, 7]                                                     │
│         ↑     ↑                                                             │
│       rear  front                                                           │
│   rear wraps around to use empty space!                                     │
│                                                                             │
│ VISUAL (as a circle):                                                       │
│           ┌───┐                                                             │
│          / 7   \                                                            │
│        /         \                                                          │
│      │ 6          8 │                                                       │
│        \         /                                                          │
│         \ 5   9 /                                                           │
│           └───┘                                                             │
│            front                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. CPU SCHEDULING (Round Robin):
   Processes wait in circular queue
   Each gets a time slice, then goes to end

2. MEMORY MANAGEMENT:
   Buffer pools in databases
   Connection pools in web servers

3. AUDIO/VIDEO STREAMING:
   Circular buffer for smooth playback
   Producer writes, consumer reads

4. KEYBOARD BUFFER:
   Stores keystrokes
   Old keystrokes overwritten if buffer full
```

:::

```java
// CIRCULAR QUEUE IMPLEMENTATION
public class CircularQueue<T> {
    private Object[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public CircularQueue(int capacity) {
        this.capacity = capacity;
        this.data = new Object[capacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    // Enqueue - O(1)
    public boolean enqueue(T item) {
        if (isFull()) {
            return false;  // Queue is full
        }

        rear = (rear + 1) % capacity;  // Circular increment
        data[rear] = item;
        size++;
        return true;
    }

    // Dequeue - O(1)
    @SuppressWarnings("unchecked")
    public T dequeue() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty");
        }

        T item = (T) data[front];
        front = (front + 1) % capacity;  // Circular increment
        size--;
        return item;
    }

    // Peek - O(1)
    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty");
        }
        return (T) data[front];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }

    public int size() {
        return size;
    }
}
```

---

## 3.2 Deque (Double-Ended Queue)

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      DEQUE - COMPLETE GUIDE                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A queue where you can add/remove from BOTH ends in O(1)!                    │
│                                                                             │
│ VISUAL:                                                                     │
│   addFirst ──→ ┌───┬───┬───┬───┬───┐ ←── addLast                            │
│                │ A │ B │ C │ D │ E │                                        │
│  removeFirst ←─ └───┴───┴───┴───┴───┘ ──→ removeLast                        │
│                                                                             │
│ OPERATIONS:                                                                 │
│ • addFirst(x)    - Add to front                                             │
│ • addLast(x)     - Add to back                                              │
│ • removeFirst()  - Remove from front                                        │
│ • removeLast()   - Remove from back                                         │
│ • peekFirst()    - See front                                                │
│ • peekLast()     - See back                                                 │
│                                                                             │
│ ALL OPERATIONS ARE O(1)!                                                    │
│                                                                             │
│ DEQUE = STACK + QUEUE                                                       │
│ Can use as stack (addFirst/removeFirst)                                     │
│ Can use as queue (addLast/removeFirst)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. BROWSER HISTORY:
   - Add new pages to front
   - Can go back (from front)
   - Can go forward (from back)

2. UNDO/REDO WITH LIMIT:
   - Add new action to front
   - If too many, remove from back
   - Undo = remove from front

3. SLIDING WINDOW MAXIMUM:
   - Deque stores indices
   - Remove from front (out of window)
   - Remove from back (smaller elements)
   - Add to back (new elements)

4. PALINDROME CHECKING:
   - Add all characters
   - Compare front and back
   - Remove both if equal
```

:::

```java
// DEQUE IMPLEMENTATION USING CIRCULAR ARRAY
public class MyDeque<T> {
    private Object[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public MyDeque(int capacity) {
        this.capacity = capacity;
        this.data = new Object[capacity];
        this.front = 0;
        this.rear = capacity - 1;
        this.size = 0;
    }

    // Add to front - O(1)
    public boolean addFirst(T item) {
        if (isFull()) return false;

        front = (front - 1 + capacity) % capacity;  // Move front back
        data[front] = item;
        size++;
        return true;
    }

    // Add to back - O(1)
    public boolean addLast(T item) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;  // Move rear forward
        data[rear] = item;
        size++;
        return true;
    }

    // Remove from front - O(1)
    @SuppressWarnings("unchecked")
    public T removeFirst() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");

        T item = (T) data[front];
        front = (front + 1) % capacity;
        size--;
        return item;
    }

    // Remove from back - O(1)
    @SuppressWarnings("unchecked")
    public T removeLast() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");

        T item = (T) data[rear];
        rear = (rear - 1 + capacity) % capacity;
        size--;
        return item;
    }

    @SuppressWarnings("unchecked")
    public T peekFirst() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");
        return (T) data[front];
    }

    @SuppressWarnings("unchecked")
    public T peekLast() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");
        return (T) data[rear];
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }
}
```

---

## 3.3 Monotonic Queue

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MONOTONIC QUEUE - COMPLETE GUIDE                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A deque that maintains elements in MONOTONIC order                          │
│ (either increasing or decreasing).                                          │
│                                                                             │
│ MONOTONIC DECREASING QUEUE (for finding max):                               │
│ Elements from front to back: 8 > 6 > 5 > 3                                  │
│ Front is always the maximum!                                                │
│                                                                             │
│ MONOTONIC INCREASING QUEUE (for finding min):                               │
│ Elements from front to back: 2 < 4 < 7 < 9                                  │
│ Front is always the minimum!                                                │
│                                                                             │
│ HOW IT WORKS (Decreasing for max):                                          │
│ When adding element x:                                                      │
│ 1. Remove all elements from BACK that are smaller than x                    │
│ 2. Add x to back                                                            │
│ 3. Front is always the current maximum                                      │
│                                                                             │
│ WHY? Elements smaller than x will NEVER be the max while x exists!          │
│                                                                             │
│ KEY USE CASE: Sliding Window Maximum/Minimum in O(n)!                       │
└─────────────────────────────────────────────────────────────────────────────┘

EXAMPLE - SLIDING WINDOW MAXIMUM:
Array: [1, 3, -1, -3, 5, 3, 6, 7], Window size: 3

Window [1,3,-1]:
  Deque state: [3, -1]  (1 removed because 3 > 1)
  Max = 3

Window [3,-1,-3]:
  Deque state: [3, -1, -3]
  Max = 3

Window [-1,-3,5]:
  Deque state: [5]  (all removed because 5 > all)
  Max = 5

...and so on
```

:::

```java
// SLIDING WINDOW MAXIMUM USING MONOTONIC QUEUE
public class MonotonicQueue {

    // Returns array of maximums for each window
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0) return new int[0];

        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new LinkedList<>();  // Stores INDICES

        for (int i = 0; i < n; i++) {
            // Remove indices outside window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }

            // Remove indices of smaller elements (they'll never be max)
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }

            // Add current index
            deque.offerLast(i);

            // Window is complete, record max
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }

        return result;
    }
}
```

::: memory

```
🧠 INTERVIEW KEY POINTS - MONOTONIC QUEUE:

1. "When to use Monotonic Queue?"
   → Sliding window min/max problems
   → Find next greater/smaller element
   → Stock span problems

2. "Time Complexity?"
   → O(n) overall
   → Each element added/removed at most once

3. "Why store indices instead of values?"
   → To check if element is within window
   → To know position for result array
```

:::

---

# 🌳 Part 4: Tree Variants

## 4.1 Binary Tree Types

::: map

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY TREE VARIANTS OVERVIEW                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

                        BINARY TREE
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    │           │           │           │           │
  FULL      COMPLETE     PERFECT    BALANCED    DEGENERATE
    │           │           │           │           │
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼

FULL BINARY TREE:
Every node has 0 or 2 children (never 1)
        1
       / \
      2   3
     / \
    4   5

COMPLETE BINARY TREE:
All levels filled except possibly last
Last level has all nodes as far LEFT as possible
        1
       / \
      2   3
     / \  /
    4  5 6

PERFECT BINARY TREE:
All internal nodes have 2 children
All leaves at same level
        1
       / \
      2   3
     /\   /\
    4  5 6  7

BALANCED BINARY TREE:
Height of left and right subtrees differ by at most 1
(AVL tree is strictly balanced)
        4
       / \
      2   6
     /   / \
    1   5   7

DEGENERATE (Pathological):
Each parent has only one child
Essentially a linked list!
    1
     \
      2
       \
        3
```

:::

## 4.2 AVL Tree (Self-Balancing BST)

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       AVL TREE - COMPLETE GUIDE                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A self-balancing Binary Search Tree where:                                  │
│ • For EVERY node: |height(left) - height(right)| ≤ 1                        │
│                                                                             │
│ INVENTED: 1962 by Adelson-Velsky and Landis                                 │
│                                                                             │
│ WHY BALANCE MATTERS:                                                        │
│ Unbalanced BST: O(n) worst case (degenerates to linked list)                │
│ Balanced AVL:   O(log n) GUARANTEED for all operations!                     │
│                                                                             │
│ BALANCE FACTOR = height(left) - height(right)                               │
│ Valid values: -1, 0, +1                                                     │
│ If BF becomes -2 or +2, we ROTATE!                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ROTATIONS (The Key to Balance)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 4 CASES OF IMBALANCE:                                                       │
│                                                                             │
│ 1. LEFT-LEFT (LL) → Single Right Rotation                                   │
│        30                     20                                            │
│       /                      /  \                                           │
│      20          →         10    30                                         │
│     /                                                                       │
│    10                                                                       │
│                                                                             │
│ 2. RIGHT-RIGHT (RR) → Single Left Rotation                                  │
│    10                         20                                            │
│      \                       /  \                                           │
│       20         →         10    30                                         │
│         \                                                                   │
│          30                                                                 │
│                                                                             │
│ 3. LEFT-RIGHT (LR) → Left then Right Rotation                               │
│        30                    30                      25                     │
│       /                     /                       /  \                    │
│      20          →        25         →           20    30                   │
│        \                 /                                                  │
│         25             20                                                   │
│                                                                             │
│ 4. RIGHT-LEFT (RL) → Right then Left Rotation                               │
│    10                    10                         15                      │
│      \                     \                       /  \                     │
│       20        →           15       →           10    20                   │
│      /                        \                                             │
│     15                         20                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// AVL TREE IMPLEMENTATION
public class AVLTree {

    private class Node {
        int key, height;
        Node left, right;

        Node(int key) {
            this.key = key;
            this.height = 1;
        }
    }

    private Node root;

    // Get height of node
    private int height(Node node) {
        return node == null ? 0 : node.height;
    }

    // Get balance factor
    private int getBalance(Node node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    // Update height
    private void updateHeight(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    // Right rotation (for LL case)
    private Node rightRotate(Node y) {
        Node x = y.left;
        Node T2 = x.right;

        // Rotate
        x.right = y;
        y.left = T2;

        // Update heights
        updateHeight(y);
        updateHeight(x);

        return x;  // New root
    }

    // Left rotation (for RR case)
    private Node leftRotate(Node x) {
        Node y = x.right;
        Node T2 = y.left;

        // Rotate
        y.left = x;
        x.right = T2;

        // Update heights
        updateHeight(x);
        updateHeight(y);

        return y;  // New root
    }

    // Insert
    public void insert(int key) {
        root = insertRec(root, key);
    }

    private Node insertRec(Node node, int key) {
        // 1. Standard BST insert
        if (node == null) return new Node(key);

        if (key < node.key) {
            node.left = insertRec(node.left, key);
        } else if (key > node.key) {
            node.right = insertRec(node.right, key);
        } else {
            return node;  // Duplicate keys not allowed
        }

        // 2. Update height
        updateHeight(node);

        // 3. Get balance factor
        int balance = getBalance(node);

        // 4. If unbalanced, there are 4 cases:

        // Left Left Case
        if (balance > 1 && key < node.left.key) {
            return rightRotate(node);
        }

        // Right Right Case
        if (balance < -1 && key > node.right.key) {
            return leftRotate(node);
        }

        // Left Right Case
        if (balance > 1 && key > node.left.key) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Right Left Case
        if (balance < -1 && key < node.right.key) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;  // Balanced
    }

    // Delete
    public void delete(int key) {
        root = deleteRec(root, key);
    }

    private Node deleteRec(Node node, int key) {
        // 1. Standard BST delete
        if (node == null) return null;

        if (key < node.key) {
            node.left = deleteRec(node.left, key);
        } else if (key > node.key) {
            node.right = deleteRec(node.right, key);
        } else {
            // Node to delete found
            if (node.left == null || node.right == null) {
                node = (node.left != null) ? node.left : node.right;
            } else {
                // Find inorder successor
                Node temp = minValueNode(node.right);
                node.key = temp.key;
                node.right = deleteRec(node.right, temp.key);
            }
        }

        if (node == null) return null;

        // 2. Update height
        updateHeight(node);

        // 3. Rebalance
        int balance = getBalance(node);

        // Left Left
        if (balance > 1 && getBalance(node.left) >= 0) {
            return rightRotate(node);
        }

        // Left Right
        if (balance > 1 && getBalance(node.left) < 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Right Right
        if (balance < -1 && getBalance(node.right) <= 0) {
            return leftRotate(node);
        }

        // Right Left
        if (balance < -1 && getBalance(node.right) > 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    private Node minValueNode(Node node) {
        Node current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }
}
```

---

## 4.3 Red-Black Tree

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RED-BLACK TREE - COMPLETE GUIDE                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A self-balancing BST where each node has a COLOR (Red or Black)             │
│                                                                             │
│ INVENTED: 1972 by Rudolf Bayer (as "symmetric binary B-trees")              │
│ REFINED: 1978 by Leonidas Guibas and Robert Sedgewick                       │
│                                                                             │
│ PROPERTIES (MUST ALL BE TRUE):                                              │
│ 1. Every node is either RED or BLACK                                        │
│ 2. Root is always BLACK                                                     │
│ 3. Every leaf (NIL) is BLACK                                                │
│ 4. If node is RED, both children must be BLACK (no red-red parent-child)    │
│ 5. Every path from node to descendant NIL has same number of black nodes    │
│                                                                             │
│ VISUAL:                                                                     │
│         [13:B]                                                              │
│        /      \                                                             │
│    [8:R]      [17:R]                                                        │
│    /   \      /    \                                                        │
│ [1:B] [11:B] [15:B] [25:B]                                                  │
│        /             \                                                      │
│     [6:R]          [22:R]                                                   │
│                                                                             │
│ B = Black, R = Red                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AVL vs RED-BLACK                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────┬───────────────────┬────────────────────────────┐    │
│ │ Property            │ AVL Tree          │ Red-Black Tree             │    │
│ ├─────────────────────┼───────────────────┼────────────────────────────┤    │
│ │ Balance strictness  │ Strictly balanced │ Loosely balanced           │    │
│ │ Search              │ O(log n)          │ O(log n)                   │    │
│ │ Insert              │ Slower (more rot.)│ Faster (fewer rotations)   │    │
│ │ Delete              │ Slower            │ Faster                     │    │
│ │ Height              │ 1.44 * log(n)     │ 2 * log(n)                 │    │
│ │ Used in             │ Databases         │ Java TreeMap, C++ map      │    │
│ └─────────────────────┴───────────────────┴────────────────────────────┘    │
│                                                                             │
│ WHEN TO USE:                                                                │
│ • AVL: Lookup-heavy applications (more balanced = faster search)            │
│ • RB: Insert/Delete-heavy (fewer rotations = faster modifications)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: memory

```
🧠 INTERVIEW KEY POINTS - TREE VARIANTS:

1. "Difference between AVL and Red-Black?"
   → AVL: More balanced, better for lookups
   → RB: Less rotations, better for inserts/deletes
   → Both guarantee O(log n)

2. "Which does Java TreeMap use?"
   → Red-Black Tree

3. "When is BST O(n)?"
   → When degenerate (sorted insert)
   → Solution: Use self-balancing trees

4. "What's balance factor in AVL?"
   → height(left) - height(right)
   → Must be -1, 0, or 1
```

:::

---

# 📦 Part 5: Heap Variants

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       HEAP VARIANTS - COMPLETE GUIDE                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ HEAP TYPES                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. MIN HEAP: Parent ≤ Children                                              │
│         1                                                                   │
│        / \                                                                  │
│       3   6                                                                 │
│      / \                                                                    │
│     5   9                                                                   │
│    Min at root!                                                             │
│                                                                             │
│ 2. MAX HEAP: Parent ≥ Children                                              │
│         9                                                                   │
│        / \                                                                  │
│       6   5                                                                 │
│      / \                                                                    │
│     3   1                                                                   │
│    Max at root!                                                             │
│                                                                             │
│ 3. BINARY HEAP: Most common, complete binary tree                           │
│                                                                             │
│ 4. D-ARY HEAP: Each node has D children (not just 2)                        │
│    - Shallower tree                                                         │
│    - Used in Dijkstra's algorithm optimization                              │
│                                                                             │
│ 5. FIBONACCI HEAP: Amortized O(1) for many operations                       │
│    - Used in advanced graph algorithms                                      │
│    - Complex implementation                                                 │
│                                                                             │
│ 6. BINOMIAL HEAP: Collection of binomial trees                              │
│    - Efficient merge: O(log n)                                              │
└─────────────────────────────────────────────────────────────────────────────┘

ARRAY REPRESENTATION OF BINARY HEAP:
For node at index i:
• Parent: (i - 1) / 2
• Left child: 2 * i + 1
• Right child: 2 * i + 2

Array: [1, 3, 6, 5, 9]
Tree:      1      (index 0)
          / \
         3   6    (index 1, 2)
        / \
       5   9      (index 3, 4)
```

:::

```java
// COMPLETE MIN HEAP IMPLEMENTATION
public class MinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MinHeap(int capacity) {
        this.capacity = capacity;
        this.heap = new int[capacity];
        this.size = 0;
    }

    // Helper methods
    private int parent(int i) { return (i - 1) / 2; }
    private int leftChild(int i) { return 2 * i + 1; }
    private int rightChild(int i) { return 2 * i + 2; }

    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // Insert - O(log n)
    public void insert(int val) {
        if (size == capacity) {
            throw new RuntimeException("Heap is full");
        }

        // Add at end
        heap[size] = val;
        int current = size;
        size++;

        // Bubble UP (heapify up)
        while (current > 0 && heap[current] < heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }

    // Extract min - O(log n)
    public int extractMin() {
        if (size == 0) {
            throw new RuntimeException("Heap is empty");
        }

        int min = heap[0];

        // Move last to root
        heap[0] = heap[size - 1];
        size--;

        // Bubble DOWN (heapify down)
        heapifyDown(0);

        return min;
    }

    private void heapifyDown(int i) {
        int smallest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && heap[left] < heap[smallest]) {
            smallest = left;
        }
        if (right < size && heap[right] < heap[smallest]) {
            smallest = right;
        }

        if (smallest != i) {
            swap(i, smallest);
            heapifyDown(smallest);
        }
    }

    // Peek min - O(1)
    public int peekMin() {
        if (size == 0) {
            throw new RuntimeException("Heap is empty");
        }
        return heap[0];
    }

    // Decrease key - O(log n)
    public void decreaseKey(int i, int newVal) {
        if (newVal > heap[i]) {
            throw new RuntimeException("New value is greater than current");
        }
        heap[i] = newVal;

        // Bubble up
        while (i > 0 && heap[i] < heap[parent(i)]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    // Delete any element - O(log n)
    public void delete(int i) {
        decreaseKey(i, Integer.MIN_VALUE);
        extractMin();
    }

    // Build heap from array - O(n)
    public static MinHeap buildHeap(int[] arr) {
        MinHeap heap = new MinHeap(arr.length * 2);
        heap.heap = arr.clone();
        heap.size = arr.length;

        // Start from last non-leaf and heapify down
        for (int i = arr.length / 2 - 1; i >= 0; i--) {
            heap.heapifyDown(i);
        }

        return heap;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
}
```

---

# #️⃣ Part 6: Hash Table Variants

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HASH TABLE VARIANTS - COMPLETE GUIDE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ COLLISION RESOLUTION STRATEGIES                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. SEPARATE CHAINING (External Chaining):                                   │
│    Each bucket contains a linked list                                       │
│                                                                             │
│    Index 0: -> null                                                         │
│    Index 1: -> [15] -> [25] -> null  (15 % 10 = 5, 25 % 10 = 5)             │
│    Index 2: -> [12] -> null                                                 │
│    ...                                                                      │
│                                                                             │
│    Pros: Simple, unlimited capacity                                         │
│    Cons: Extra memory for pointers, cache unfriendly                        │
│                                                                             │
│ 2. OPEN ADDRESSING (Probing):                                               │
│    Find another slot in same array                                          │
│                                                                             │
│    a) LINEAR PROBING: Try next slot                                         │
│       h(k), h(k)+1, h(k)+2, ...                                             │
│       Problem: Clustering                                                   │
│                                                                             │
│    b) QUADRATIC PROBING: Try squared distances                              │
│       h(k), h(k)+1², h(k)+2², h(k)+3², ...                                  │
│       Better distribution                                                   │
│                                                                             │
│    c) DOUBLE HASHING: Use second hash function                              │
│       h(k), h(k)+h2(k), h(k)+2*h2(k), ...                                   │
│       Best distribution                                                     │
│                                                                             │
│ 3. ROBIN HOOD HASHING:                                                      │
│    Elements with larger "probe distance" steal from shorter ones            │
│    More uniform distribution                                                │
│                                                                             │
│ 4. CUCKOO HASHING:                                                          │
│    Two hash functions, two tables                                           │
│    O(1) worst case lookup!                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ JAVA HASH MAP VARIANTS                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HashMap:         Basic, not thread-safe, allows null                        │
│ LinkedHashMap:   Maintains insertion order                                  │
│ TreeMap:         Sorted by keys (Red-Black Tree)                            │
│ HashTable:       Thread-safe (legacy, use ConcurrentHashMap)                │
│ ConcurrentHashMap: Thread-safe, modern                                      │
│ WeakHashMap:     Keys can be garbage collected                              │
│ IdentityHashMap: Uses == instead of equals()                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

---

# 📖 Part 7: Quick Reference — All Variants

::: memory

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DATA STRUCTURE SELECTION GUIDE                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

LINKED LIST SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ──────────────────────────────────────────────────────────────────────────  │
│ Simple forward traversal        │ Singly Linked List                        │
│ Delete at tail / backward       │ Doubly Linked List                        │
│ Round-robin / cycling           │ Circular Linked List                      │
│ Both directions + cycling       │ Circular Doubly Linked List               │
│ O(log n) search in sorted list  │ Skip List                                 │
│ LRU Cache                       │ Doubly Linked + HashMap                   │
└─────────────────────────────────────────────────────────────────────────────┘

QUEUE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ──────────────────────────────────────────────────────────────────────────  │
│ Basic FIFO                      │ Simple Queue                              │
│ Fixed size, no wasted space     │ Circular Queue                            │
│ Add/remove both ends            │ Deque                                     │
│ Priority-based access           │ Priority Queue (Heap)                     │
│ Sliding window max/min          │ Monotonic Queue                           │
└─────────────────────────────────────────────────────────────────────────────┘

TREE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ──────────────────────────────────────────────────────────────────────────  │
│ Basic sorted structure          │ BST                                       │
│ Guaranteed O(log n)             │ AVL or Red-Black Tree                     │
│ Lookup-heavy                    │ AVL Tree                                  │
│ Insert/Delete-heavy             │ Red-Black Tree                            │
│ Range queries                   │ Segment Tree                              │
│ Prefix operations               │ Trie                                      │
│ Top-k / Priority                │ Heap                                      │
│ Database index                  │ B-Tree / B+ Tree                          │
└─────────────────────────────────────────────────────────────────────────────┘

HASH TABLE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ──────────────────────────────────────────────────────────────────────────  │
│ Basic key-value                 │ HashMap                                   │
│ Maintain insertion order        │ LinkedHashMap                             │
│ Sorted keys                     │ TreeMap                                   │
│ Thread-safe                     │ ConcurrentHashMap                         │
│ Only keys (no values)           │ HashSet                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

---

# 🏆 PRACTICE PROBLEMS BY DATA STRUCTURE

::: example

```
LINKED LIST PROBLEMS:
1. Reverse Linked List (LC 206) - Basic
2. Detect Cycle (LC 141) - Floyd's Algorithm
3. Merge Two Sorted Lists (LC 21) - Two pointer
4. LRU Cache (LC 146) - Doubly Linked + HashMap
5. Copy List with Random Pointer (LC 138) - Deep copy
6. Reverse Nodes in k-Group (LC 25) - Hard
7. Flatten Multilevel Doubly Linked (LC 430)

STACK/QUEUE PROBLEMS:
1. Valid Parentheses (LC 20) - Basic stack
2. Min Stack (LC 155) - Track minimum
3. Implement Queue using Stacks (LC 232)
4. Sliding Window Maximum (LC 239) - Monotonic queue
5. Daily Temperatures (LC 739) - Monotonic stack

TREE PROBLEMS:
1. Validate BST (LC 98) - Inorder check
2. Lowest Common Ancestor (LC 236) - Recursion
3. Serialize/Deserialize Tree (LC 297)
4. Range Sum BST (LC 938)
5. Kth Smallest in BST (LC 230)

HEAP PROBLEMS:
1. Kth Largest Element (LC 215)
2. Merge K Sorted Lists (LC 23)
3. Find Median from Data Stream (LC 295) - Two heaps
4. Top K Frequent Elements (LC 347)
```

:::

---

**END OF COMPREHENSIVE DATA STRUCTURE VARIANTS GUIDE**

This guide covers ALL major variants of data structures with:

- Complete understanding (WHAT/WHY/WHEN/HOW)
- Visual representations
- Full implementations in Java
- Real-world applications
- Interview key points
- Practice problems

---

# CURATED PRACTICE PROBLEMS — DS VARIANTS (Trie, Heap, Segment Tree, etc.)

> **HOW TO USE**: These cover advanced data structure variants. Attempt after mastering basic DS.

---

## Section 1: Trie Problems

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Implement Trie (LC 208) | LeetCode | Medium | insert/search/startsWith |
| 2 | Design Add and Search Words (LC 211) | LeetCode | Medium | Trie + DFS for '.' wildcard |
| 3 | Word Search II (LC 212) | LeetCode | Hard | Trie + backtracking on grid |
| 4 | Replace Words (LC 648) | LeetCode | Medium | Trie prefix matching |
| 5 | Map Sum Pairs (LC 677) | LeetCode | Medium | Trie with value at nodes |
| 6 | Longest Word in Dictionary (LC 720) | LeetCode | Medium | Trie + BFS/DFS for completeness |

---

## Section 2: Heap / Priority Queue Variants

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Kth Largest Element (LC 215) | LeetCode | Medium | Min heap of size k |
| 2 | Top K Frequent Elements (LC 347) | LeetCode | Medium | Min heap by frequency |
| 3 | Find Median from Data Stream (LC 295) | LeetCode | Hard | Two heaps: max + min |
| 4 | Merge k Sorted Lists (LC 23) | LeetCode | Hard | Min heap of list heads |
| 5 | Reorganize String (LC 767) | LeetCode | Medium | Max heap by frequency |
| 6 | K Closest Points to Origin (LC 973) | LeetCode | Medium | Max heap of size k |
| 7 | Sliding Window Median (LC 480) | LeetCode | Hard | Two heaps + lazy deletion |

---

## Section 3: Monotonic Stack / Monotonic Queue

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Next Greater Element I (LC 496) | LeetCode | Easy | Classic monotonic stack |
| 2 | Daily Temperatures (LC 739) | LeetCode | Medium | Stack stores indices, decreasing |
| 3 | Largest Rectangle in Histogram (LC 84) | LeetCode | Hard | Monotonic stack for left/right bounds |
| 4 | Trapping Rain Water (LC 42) | LeetCode | Hard | Stack or two-pointer approach |
| 5 | Online Stock Span (LC 901) | LeetCode | Medium | Stack with (price, span) pairs |
| 6 | Sliding Window Maximum (LC 239) | LeetCode | Hard | Monotonic deque |

---

## HIDDEN GEMS — DS Variants

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Maximum Frequency Stack (LC 895) | LeetCode | Stack per frequency — creative DS combo |
| 2 | Stock Price Fluctuation (LC 2034) | LeetCode | TreeMap + HashMap design |
| 3 | All O`one Data Structure (LC 432) | LeetCode | Doubly linked list + HashMap (hard design) |
| 4 | Range Sum Query - Mutable (LC 307) | LeetCode | Segment tree or BIT |
| 5 | Count of Smaller Numbers After Self (LC 315) | LeetCode | Merge sort or BIT — teaches augmented DS |

---

> **Navigation**: [< Previous](02a_DS_Variants_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_Collections_Java.md)