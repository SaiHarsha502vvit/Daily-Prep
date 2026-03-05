> **Navigation**: [< Previous Chapter](01c_LinkedList.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01e_HashTable.md)

---

# PART 4: STACK

## 🧬 Nature & Behavior

### What is a Stack?

```
PHYSICAL REALITY - Like a stack of plates:
┌────────────────────────────────────────────────────┐
│                                                    │
│   TOP →  ┌─────┐                                   │
│          │  5  │  ← Last In, First Out (LIFO)      │
│          ├─────┤                                   │
│          │  4  │                                   │
│          ├─────┤                                   │
│          │  3  │                                   │
│          ├─────┤                                   │
│          │  2  │                                   │
│          ├─────┤                                   │
│          │  1  │                                   │
│          └─────┘                                   │
│                                                    │
│   PUSH: Add to top                                 │
│   POP: Remove from top                             │
│   PEEK: Look at top without removing               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Stack Operations

| Operation    | Time | Description                 |
| ------------ | ---- | --------------------------- |
| push(x)      | O(1) | Add element to top          |
| pop()        | O(1) | Remove and return top       |
| peek()/top() | O(1) | Return top without removing |
| isEmpty()    | O(1) | Check if stack is empty     |
| size()       | O(1) | Return number of elements   |

### 🔴 Real-World Origin: Function Call Management (1960s)

```
PROBLEM (Early Computers):
- Programs call functions
- Functions call other functions
- How to remember where to return?

EXAMPLE:
main() calls A()
    A() calls B()
        B() calls C()
        C() returns to B
    B() returns to A
A() returns to main

WITHOUT STACK:
- No way to track return addresses
- Programs would get lost!

SOLUTION - CALL STACK:
┌─────────────┐
│ C() addr    │ ← Top (current)
├─────────────┤
│ B() addr    │
├─────────────┤
│ A() addr    │
├─────────────┤
│ main() addr │
└─────────────┘

When C() returns → pop → go to B()
When B() returns → pop → go to A()

THIS IS WHY:
- StackOverflowError exists (too many calls)
- Recursion works (each call pushed to stack)
- Debuggers show "call stack"
```

## 💻 Implementation WITHOUT Collections

```java
public class MyStack {
    private int[] data;
    private int top;
    private int capacity;

    public MyStack(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.top = -1;  // Empty stack
    }

    // PUSH - O(1)
    public void push(int value) {
        if (top == capacity - 1) {
            throw new RuntimeException("Stack Overflow!");
        }
        data[++top] = value;
    }

    // POP - O(1)
    public int pop() {
        if (isEmpty()) {
            throw new RuntimeException("Stack Underflow!");
        }
        return data[top--];
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Stack is empty!");
        }
        return data[top];
    }

    // IS EMPTY - O(1)
    public boolean isEmpty() {
        return top == -1;
    }

    // SIZE - O(1)
    public int size() {
        return top + 1;
    }
}

// LINKED LIST BASED STACK (No size limit)
public class MyLinkedStack {
    private class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }

    private Node top;
    private int size;

    public void push(int value) {
        Node newNode = new Node(value);
        newNode.next = top;
        top = newNode;
        size++;
    }

    public int pop() {
        if (top == null) throw new RuntimeException("Empty!");
        int value = top.data;
        top = top.next;
        size--;
        return value;
    }

    public int peek() {
        if (top == null) throw new RuntimeException("Empty!");
        return top.data;
    }

    public boolean isEmpty() {
        return top == null;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: Valid Parentheses

```
REAL-WORLD ORIGIN: Compiler Design (1960s)

PROBLEM AT MIT (1962):
- Compilers need to parse code
- Code has nested structures: if { while { } }
- How to verify brackets match correctly?

BAD CODE:
if (x > 0 {    // Missing )
    while (y) }  // Wrong bracket
}

COMPILER NEEDS TO DETECT THIS!

SOLUTION THINKING:
1. "When I see '(', I expect ')' later"
2. "When I see '{', I expect '}' later"
3. "Most recent open bracket closes first"
4. "That's LIFO - use a STACK!"

ALGORITHM:
- See '(' → push ')'
- See '{' → push '}'
- See ')' → pop, check if matches
- End: stack should be empty

NOW USED IN:
- Every compiler (GCC, javac, clang)
- Every IDE (syntax highlighting)
- Every code editor (bracket matching)
- HTML validators
- JSON parsers
```

---

# PART 5: QUEUE

## 🧬 Nature & Behavior

### What is a Queue?

```
PHYSICAL REALITY - Like a line at a store:
┌────────────────────────────────────────────────────┐
│                                                    │
│  FRONT                               BACK          │
│    ↓                                  ↓            │
│  ┌───┬───┬───┬───┬───┐                             │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │                             │
│  └───┴───┴───┴───┴───┘                             │
│    ↑                 ↑                             │
│  Dequeue          Enqueue                          │
│  (Remove)         (Add)                            │
│                                                    │
│  FIFO = First In, First Out                        │
│  "First come, first served"                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Queue Operations

| Operation           | Time | Description       |
| ------------------- | ---- | ----------------- |
| enqueue(x)/offer(x) | O(1) | Add to back       |
| dequeue()/poll()    | O(1) | Remove from front |
| peek()/front()      | O(1) | See front element |
| isEmpty()           | O(1) | Check if empty    |

### 🔴 Real-World Origin: Print Spooler (1970s)

```
PROBLEM (Office with 1 printer, 50 computers):
- Multiple users send print jobs
- Printer can only do one job at a time
- Who prints first?

WITHOUT QUEUE:
- Last person to click "Print" goes first
- People who clicked earlier wait forever
- Unfair and chaotic!

SOLUTION - PRINT QUEUE:
- Jobs added to back of queue
- Printer takes from front
- First submitted = First printed

PRINT QUEUE:
┌────────────────────────────────────────┐
│ Front                            Back  │
│ [Job1] → [Job2] → [Job3] → [Job4]      │
│   ↑                              ↑     │
│ Printing                    New jobs   │
└────────────────────────────────────────┘

NOW USED IN:
- Operating System task scheduling
- Web server request handling
- Message queues (Kafka, RabbitMQ)
- Breadth-First Search algorithm
```

## 💻 Implementation WITHOUT Collections

```java
// CIRCULAR ARRAY QUEUE (Most efficient)
public class MyQueue {
    private int[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public MyQueue(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    // ENQUEUE - O(1)
    public void enqueue(int value) {
        if (size == capacity) {
            throw new RuntimeException("Queue is full!");
        }
        rear = (rear + 1) % capacity;  // Circular
        data[rear] = value;
        size++;
    }

    // DEQUEUE - O(1)
    public int dequeue() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        int value = data[front];
        front = (front + 1) % capacity;  // Circular
        size--;
        return value;
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        return data[front];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int size() {
        return size;
    }
}

// WHY CIRCULAR?
/*
Without circular, after many operations:
[_, _, _, 5, 6, 7, _, _, _]
        ↑        ↑
      front    rear

Wasted space at beginning!

With circular, rear wraps around:
[8, 9, _, 5, 6, 7]
      ↑  ↑
    rear front

No wasted space!
*/
```

## 🎯 LeetCode → Real-World Connection

### Problem: Number of Islands (BFS with Queue)

```
REAL-WORLD ORIGIN: Google Maps (2005)

PROBLEM:
- Satellite images show land and water
- Need to count distinct landmasses
- Need to identify boundaries of each island

INITIAL APPROACH:
- Manual counting by humans
- Time: Weeks for one region
- Cost: Millions of dollars

SOLUTION - BFS:
1. Find a land pixel
2. Use queue to explore all connected land
3. Mark as visited
4. Count increments by 1
5. Repeat for unexplored land

WHY BFS (Queue) NOT DFS (Stack)?
- BFS explores in "waves" from starting point
- Natural for geographic spreading
- Won't get stuck in long narrow peninsulas

IMPACT:
- Automated island counting
- Ocean mapping
- Disease spread modeling (same algorithm!)
- Network connectivity analysis
```

---

