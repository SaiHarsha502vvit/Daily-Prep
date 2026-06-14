**Navigation**: [< Previous Chapter](01c_LinkedList.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01e_HashTable.md)

---

# 📚 Part 4: Stack & Queue

### 5W1H: Deep Understanding of Stack

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A Stack is a LIFO (Last In, First Out) data structure.        ║
║        Only the TOP element is accessible. Push/Pop are O(1).        ║
║                                                                      ║
║  WHY:  Many problems have a NESTING structure — what was opened      ║
║        LAST must be closed FIRST (parentheses, function calls,       ║
║        undo operations). LIFO naturally models this.                 ║
║                                                                      ║
║  HOW THE JVM USES A STACK (Call Stack):                              ║
║  Every Java THREAD has its own call stack.                           ║
║  When you call a method, JVM PUSHES a stack frame:                   ║
║  ┌─────────────────────────────────────────┐                         ║
║  │ main()     frame: { args, locals }      │ ← bottom                ║
║  │ calculate() frame: { x=5, y=10 }       │                          ║
║  │ multiply()  frame: { a=5, b=10 }       │ ← top (executing)        ║
║  └─────────────────────────────────────────┘                         ║
║  When multiply() returns, JVM POPS its frame.                        ║
║  StackOverflowError = too many frames (infinite recursion).          ║
║  Default stack size: 512KB - 1MB per thread.                         ║
║                                                                      ║
║  WHERE Stacks appear in production:                                  ║
║  • JVM call stack (method invocation/return)                         ║
║  • Browser back button (pages pushed, back = pop)                    ║
║  • Ctrl+Z undo (actions pushed, undo = pop)                          ║
║  • Expression evaluation (postfix, infix conversion)                 ║
║  • DFS traversal (explicit or implicit via recursion)                ║
║  • Compiler: syntax parsing, bracket matching                        ║
║                                                                      ║
║  WHEN to use a Stack:                                                ║
║  ✔ Matching/nesting problems (brackets, HTML tags)                   ║
║  ✔ Backtracking (maze solving, permutations)                         ║
║  ✔ Converting recursion to iteration                                 ║
║  ✔ Monotonic problems (next greater element)                         ║
║  ✘ When you need FIFO order (use Queue)                              ║
║  ✘ When you need random access (use Array)                           ║
╚══════════════════════════════════════════════════════════════════════╝
```

## 🧬 Nature & Behavior

### What is a Stack?

## The Invention of the Stack & Queue (1960s)

Before compilers and managed runtimes existed, programmers manually calculated return addresses using GOTO. The stack was invented because ALGOL 60 required **recursive functions** — and recursion demands a LIFO call stack.

**Before 1955:** No formal call stack. Return addresses stored in fixed registers. No recursion possible.
**1955:** Burroughs B5000 — first production computer designed around a stack (Bob Barton, designed for ALGOL). The architecture pushed operands and addresses onto a stack, making recursion hardware-native.
**1960:** ALGOL 60 standardizes recursive functions. Every compiler must now implement a call stack.
**1964:** Dijkstra introduces bounded/sticky queues for printer scheduling (the print spooler problem).
**1968:** Dijkstra's "Cooperating Sequential Processes" paper — semaphores + queue primitives for OS process synchronization.
**1970s:** The B5500 (B5000 successor) influences Forth (Charles Simonyi, 1970) and PostScript (John Warnock, 1982).
**1980s:** BSD Unix pipes (1984) as inter-process queues. The `|` operator is a FIFO queue.
**1990s:** JVM (1995) and CLR (2002) formalize managed call stacks with hardware-guarded StackOverflowError semantics.
**2000s:** LMAX Disruptor (2011) — ring-buffer queue achieving 100M+ msg/sec at LMAX exchange, revolutionizing high-frequency trading.
**2010s:** async/await (C# 2012, JavaScript 2015, Java 21, 2023) — language-level coroutine stacks.
**2020s:** Virtual threads (Java 21, JEP 444, 2023) — millions of lightweight threads, each with a virtual stack, sharing a single OS thread's native stack.

**Named Predecessors:**

- **Burroughs B5000 (1961)** — first stack machine, designed by Bob Barton. Needed because ALGOL required recursion.
- **Dijkstra's semaphore paper (1965/1968)** — formal queue primitive for OS scheduling.
- **LMAX Disruptor (2011)** — modern production queue at LMAX exchange, proving lock-free queues at 100M+ msg/sec.
- **Java virtual threads (JEP 444, 2023)** — millions of virtual stacks per process.

**Motivation by Era:**

- 1950s: Hardware needed to support recursion in scientific computing (Fortran's limitations exposed)
- 1960s: OS needed fair scheduling (Dijkstra's queue) and compiler design needed bracket matching
- 1970s-80s: Languages like Forth and PostScript embraced the stack as a computational model
- 1990s: Managed runtimes needed safety (stack overflow detection) and memory isolation
- 2010s-2020s: High-frequency trading and async programming exposed limits of OS-thread stacks → virtual threads and lock-free queues

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

**Problem (Early Computers):** Programs call functions, which call other functions. How do you remember where to return?

**Example:**

- `main()` calls `A()` → `A()` calls `B()` → `B()` calls `C()`
- `C()` returns to `B` → `B()` returns to `A` → `A()` returns to `main`

**Without Stack:** No way to track return addresses — programs would get lost!

**Solution — Call Stack:**

```
┌─────────────┐
│ C() addr    │ ← Top (current)
├─────────────┤
│ B() addr    │
├─────────────┤
│ A() addr    │
├─────────────┤
│ main() addr │
└─────────────┘
```

When `C()` returns → pop → go to `B()`. When `B()` returns → pop → go to `A()`.

💡 **This is why:** `StackOverflowError` exists (too many calls), recursion works (each call pushed to stack), and debuggers show a "call stack".

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

## 🔑 The Key Bridge: Stack → DFS · Queue → BFS

[!IMPORTANT]
This is the single most important connection in all of graph algorithms.
Understanding it rewires how you think about every traversal problem.

```
STACK (LIFO)                          QUEUE (FIFO)
════════════                          ════════════
Explore the DEEPEST path first        Explore closest paths first
 ↓ Go deep, then backtrack             → Spread outward level by level

        A                                      A
       / \                                    / \
      B   C       DFS visits:               B   C      BFS visits:
     / \           A→B→D→E                / \          A→B→C
    D   E          (backtrack)           D   E         →D→E→F
         \         →C→F                      \         →done
          F                                   F

Stack holds:  [A, C, B, D, E, F]     Queue holds: [A, B, C, D, E, F]
(push all,    process deepest first   (enqueue neighbors, process FIFO)
 pop = pick deepest unvisited)

WHY STACK = DFS:
  - Push unvisited neighbors onto stack
  - Pop = always picks the node pushed LAST (deepest path)
  - Natural recursion = implicit stack (call stack = your explicit stack)

WHY QUEUE = BFS:
  - Enqueue unvisited neighbors into queue
  - Poll = always picks the node enqueued FIRST (earliest = same level)
  - Level ordering = exploring in distance rings from source
```

**The Decision Rule:**

```
NEED SHORTEST PATH (fewest hops)?  → BFS (Queue)
NEED TO EXPLORE ALL POSSIBILITIES? → DFS (Stack/recursion)
NEED TOPOLOGICAL ORDER?            → DFS postorder
NEED LEVEL-BY-LEVEL OUTPUT?        → BFS (Queue)
```

💡 **Analogy — Lost in a Maze:**

- **DFS (Stack):** Pick one direction, follow it to the dead end, then backtrack and try the next. Like following one path as far as it goes before giving up.
- **BFS (Queue):** Send scouts one step in all directions simultaneously. When any scout hits a dead end, they stop. When one reaches the exit — it took the **minimum** steps because all scouts moved equally.

🔬 **Section Challenge — Stack=DFS vs Queue=BFS**

**Challenge 1 (Reasoning):** You're solving "shortest path in a maze". A friend says "just use DFS, it's simpler". Why are they wrong?

<details><summary>Answer</summary>

DFS explores deep paths first — it might find a path of length 10 before ever checking the path of length 2. DFS guarantees it finds A path, not THE SHORTEST path (unless you exhaustively check all paths, which is O(2^N)). BFS is guaranteed to find the shortest path because it explores all 1-hop nodes before any 2-hop nodes — the first time it reaches the destination, it's via the minimum number of edges.

</details>

**Challenge 2 (Reasoning):** Both DFS and BFS are O(V+E). If complexity is the same, why does the CHOICE OF ALGORITHM still matter for "count all connected components"?

<details><summary>Answer</summary>

Same complexity but different behavior: DFS explores ONE component completely using recursion (simpler code, but risks StackOverflow on large graphs). BFS uses an explicit queue (no stack overflow risk). For counting components: both work, but DFS recursive is cleaner code. For shortest path between components: BFS is required. The algorithm choice determines CORRECTNESS, not just speed.

</details>

# 📬 Part 5: Queue

### 5W1H: Deep Understanding of Queue

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A Queue is a FIFO (First In, First Out) data structure.       ║
║        Elements enter at the BACK and leave from the FRONT.          ║
║                                                                      ║
║  WHY:  We need a way to manage resources fairly or process data      ║
║        in the exact order it arrived. LIFO (Stack) is unfair for     ║
║        scheduling; FIFO guarantees order preservation.               ║
║                                                                      ║
║  WHO:  Systems programmers, backend engineers handling requests,     ║
║        and algorithm designers implementing BFS.                     ║
║                                                                      ║
║  WHEN: Use when order of arrival strictly dictates order of process. ║
║        ✔ Task scheduling (printer spoolers, CPU run queues)          ║
║        ✔ Breadth-First Search (level-by-level traversal)             ║
║        ✔ Asynchronous data transfer (IO buffers, pipes)              ║
║        ✘ When you need LIFO (use Stack)                              ║
║                                                                      ║
║  WHERE Queues appear in production:                                  ║
║  • Thread pools (waiting tasks)                                      ║
║  • Message brokers (Kafka, RabbitMQ)                                 ║
║  • Network routers (packet queuing)                                  ║
║                                                                      ║
║  HOW:  Usually implemented via a Circular Array (for strict memory   ║
║        bounds and O(1) performance) or a Linked List (for unbounded  ║
║        growth).                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

## 🧬 Nature & Behavior

### What is a Queue?

## The Invention of the Stack & Queue (1960s)

Before compilers and managed runtimes existed, programmers manually calculated return addresses using GOTO. The stack was invented because ALGOL 60 required **recursive functions** — and recursion demands a LIFO call stack.

**Before 1955:** No formal call stack. Return addresses stored in fixed registers. No recursion possible.
**1955:** Burroughs B5000 — first production computer designed around a stack (Bob Barton, designed for ALGOL). The architecture pushed operands and addresses onto a stack, making recursion hardware-native.
**1960:** ALGOL 60 standardizes recursive functions. Every compiler must now implement a call stack.
**1964:** Dijkstra introduces bounded/sticky queues for printer scheduling (the print spooler problem).
**1968:** Dijkstra's "Cooperating Sequential Processes" paper — semaphores + queue primitives for OS process synchronization.
**1970s:** The B5500 (B5000 successor) influences Forth (Charles Simonyi, 1970) and PostScript (John Warnock, 1982).
**1980s:** BSD Unix pipes (1984) as inter-process queues. The `|` operator is a FIFO queue.
**1990s:** JVM (1995) and CLR (2002) formalize managed call stacks with hardware-guarded StackOverflowError semantics.
**2000s:** LMAX Disruptor (2011) — ring-buffer queue achieving 100M+ msg/sec at LMAX exchange, revolutionizing high-frequency trading.
**2010s:** async/await (C# 2012, JavaScript 2015, Java 21, 2023) — language-level coroutine stacks.
**2020s:** Virtual threads (Java 21, JEP 444, 2023) — millions of lightweight threads, each with a virtual stack, sharing a single OS thread's native stack.

**Named Predecessors:**

- **Burroughs B5000 (1961)** — first stack machine, designed by Bob Barton. Needed because ALGOL required recursion.
- **Dijkstra's semaphore paper (1965/1968)** — formal queue primitive for OS scheduling.
- **LMAX Disruptor (2011)** — modern production queue at LMAX exchange, proving lock-free queues at 100M+ msg/sec.
- **Java virtual threads (JEP 444, 2023)** — millions of virtual stacks per process.

**Motivation by Era:**

- 1950s: Hardware needed to support recursion in scientific computing (Fortran's limitations exposed)
- 1960s: OS needed fair scheduling (Dijkstra's queue) and compiler design needed bracket matching
- 1970s-80s: Languages like Forth and PostScript embraced the stack as a computational model
- 1990s: Managed runtimes needed safety (stack overflow detection) and memory isolation
- 2010s-2020s: High-frequency trading and async programming exposed limits of OS-thread stacks → virtual threads and lock-free queues

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

### Stack & Queue Variants Comparison Table

| Structure                     | Order                  | Push/Enqueue         | Pop/Dequeue         | Blocking Behavior          | Use Case                             | Java Class                               |
| ----------------------------- | ---------------------- | -------------------- | ------------------- | -------------------------- | ------------------------------------ | ---------------------------------------- |
| Stack (LIFO)                  | Last In, First Out     | O(1) push            | O(1) pop            | No                         | Undo history, DFS, expression eval   | `Deque<Integer>` (not `Stack`)           |
| Queue (FIFO)                  | First In, First Out    | O(1) offer           | O(1) poll           | No                         | BFS, task scheduling, print spooler  | `Queue<Integer>`, `LinkedList`           |
| Deque (Double-ended)          | LIFO or FIFO both ends | O(1) offerFirst/Last | O(1) pollFirst/Last | No                         | Sliding window max, LRU cache        | `ArrayDeque`, `LinkedList`               |
| Priority Queue                | Heap-ordered           | O(log n) offer       | O(log n) poll       | No (but peek = min)        | Dijkstra, Top-K problems             | `PriorityQueue<E>`                       |
| Circular Buffer / Ring Buffer | FIFO wrap-around       | O(1) (fixed cap)     | O(1) (fixed cap)    | Optional                   | Producer-consumer, streaming buffers | `CircularByteBuffer` (nio)               |
| Blocking Queue                | FIFO + blocking        | O(1) / blocks        | O(1) / blocks       | YES — blocks on empty/full | Producer-consumer threads            | `BlockingQueue<E>`                       |
| Concurrent Stack (Treiber)    | LIFO + lock-free       | O(1) amortized       | O(1) amortized      | No (non-blocking)          | High-concurrency stack               | `ConcurrentLinkedDeque`                  |
| Virtual-thread-friendly Queue | FIFO                   | O(1)                 | O(1)                | Pinning-sensitive          | Virtual thread sync (Java 21+)       | `SynchronousQueue`, `ArrayBlockingQueue` |

> **Why `Deque` instead of `Stack`?** The legacy `Stack` class extends `Vector` (inheritance coupling), making it slower. `ArrayDeque` (resizable array, no sync overhead) is the recommended implementation for stacks in Java.

### 🔴 Real-World Origin: Print Spooler (1970s)

**Problem (Office with 1 printer, 50 computers):** Multiple users send print jobs, but the printer can only do one at a time. Who prints first?

**Without Queue:** Last person to click "Print" goes first — people who clicked earlier wait forever. _Unfair and chaotic!_

**Solution — Print Queue:** Jobs added to back, printer takes from front. First submitted = first printed.

```
PRINT QUEUE:
┌────────────────────────────────────────┐
│ Front                            Back  │
│ [Job1] → [Job2] → [Job3] → [Job4]      │
│   ↑                              ↑     │
│ Printing                    New jobs   │
└────────────────────────────────────────┘
```

✅ **Now used in:** OS task scheduling, web server request handling, message queues (Kafka, RabbitMQ), BFS algorithm

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

## Production Failure Modes

Understanding data structures is incomplete without knowing how they fail under load. Both Stack and Queue have well-documented production failure patterns.

### Failure 1: StackOverflowError in Deep Recursion

**Symptom:** Application crashes with `java.lang.StackOverflowError` — seemingly random failures in production that never happen locally.

**Root Cause:** The JVM call stack has a fixed size (default 512KB–1MB, tunable via `-Xss`). Each recursive call pushes a stack frame (~1–2KB). Deep recursion exhausts this.

**Fibonacci Example:**

```java
// O(2^n) naive recursion — explodes stack!
public long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);  // TWO recursive calls = exponential frames
}
// fib(20) = 6765 calls, fib(30) = 832040, fib(40) = 102334155
// At n=10,000 — StackOverflowError guaranteed

// PRODUCTION FIX: use iteration or memoization
public long fibIter(int n) {
    if (n <= 1) return n;
    long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
```

**Stack Sizes (JVM defaults):**
| JVM Flag | Stack Size | Max Recursion Depth (approx) |
|---|---|---|
| `-Xss256k` | 256 KB | ~100–150 frames |
| `-Xss512k` | 512 KB | ~200–300 frames |
| `-Xss1m` | 1 MB | ~400–600 frames |
| `-Xss2m` | 2 MB | ~800–1200 frames |

**When it matters:** Web servers (Tomcat default: 256KB `-Xss`), AWS Lambda (shared memory, small stacks), microservices with deep recursion in JSON parsing.

### Failure 2: Blocking Queue Deadlock

**Symptom:** Application hangs — threads waiting forever. No CPU usage, no errors in logs.

**Root Cause:** A thread holding a blocking queue's lock waits indefinitely when the queue is full (on `put`) or empty (on `take`).

**Producer-Consumer Deadlock Pattern:**

```java
// DEADLOCK-PRONE CODE
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(10);  // capacity = 10

// Producer: tries to add when queue is FULL
void submitTask(Task t) {
    queue.put(t);  // BLOCKS if queue is full! (10 items)
}

// Consumer: tries to take when queue is EMPTY
void processTask() {
    Task t = queue.take();  // BLOCKS if queue is empty!
}

// If producer produces faster than consumer processes → queue fills → producer blocks
// If consumer runs faster than producer → queue empties → consumer blocks
```

**Safe Pattern — always use offer/peek/poll with timeout:**

```java
void submitTask(Task t, long timeout, TimeUnit unit) throws InterruptedException {
    if (!queue.offer(t, timeout, unit)) {
        throw new RejectedExecutionException("Queue full, task rejected");
    }
}

Task processTask(long timeout, TimeUnit unit) throws InterruptedException {
    return queue.poll(timeout, unit);  // returns null if nothing available
}
```

**Classic Deadlock Scenario:** Thread A holds queue lock, waits for result from thread B. Thread B is waiting for queue space held by thread A. Both wait forever.

### Failure 3: Priority Queue Non-Determinism (Test Flakiness)

**Symptom:** Tests pass in CI, fail locally, or fail on different runs. Data seems correct but order varies.

**Root Cause:** `PriorityQueue` guarantees **heap order** (min/max at root) but NOT **stable ordering** among equal elements. When two elements have the same priority, their relative order is implementation-dependent — it depends on the initial array layout, which can change after `offer`/`poll` operations that shift elements.

**Example — non-deterministic task ordering:**

```java
PriorityQueue<Task> pq = new PriorityQueue<>(Comparator.comparingInt(t -> t.priority));

pq.add(new Task("A", 1));  // priority = 1
pq.add(new Task("B", 1));  // priority = 1 (same as A)
pq.add(new Task("C", 1));  // priority = 1 (same as A and B)

System.out.println(pq.poll().name);  // Could be A, B, or C!
System.out.println(pq.poll().name);  // Remaining two — any order

// Add more elements — heap rebalances, equal-priority order changes
pq.add(new Task("D", 1));
System.out.println(pq.poll().name);  // Still non-deterministic!
```

**Fix — use a stable comparator (secondary key):**

```java
PriorityQueue<Task> pq = new PriorityQueue<>(
    Comparator.comparingInt((Task t) -> t.priority)
              .thenComparing(t -> t.name)  // stable tie-breaker
);

// Now deterministic: A < B < C < D regardless of insertion order
```

## 🎯 LeetCode → Real-World Connection

### Problem: Number of Islands (BFS with Queue)

🌍 **Real-World Origin:** Google Maps (2005)

**Problem:** Satellite images show land and water. Need to count distinct landmasses and identify boundaries of each island.

**Initial Approach:** Manual counting by humans — takes _weeks_ for one region, costing _millions_.

**Solution — BFS:**

1. Find a land pixel
2. Use **queue** to explore all connected land
3. Mark as visited
4. Count increments by 1
5. Repeat for unexplored land

❓ **Why BFS (Queue) not DFS (Stack)?**
BFS explores in "waves" from starting point — natural for geographic spreading. Won't get stuck in long narrow peninsulas.

✅ **Impact:** Automated island counting, ocean mapping, disease spread modeling (same algorithm!), network connectivity analysis

---

---

## 🏋️ Foundation Practice — Stack & Queue

### Stack Quick Questions

**Q1 — Balanced Parentheses** _(classic Stack application)_

```java
public boolean isBalanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') stack.push(c);
        else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return stack.isEmpty();
}
// Time: O(n) | Space: O(n)  | LC 20 — Valid Parentheses
```

**Q2 — Min Stack** _(Stack with O(1) getMin)_

```java
class MinStack {
    Deque<Integer> stack = new ArrayDeque<>();
    Deque<Integer> minStack = new ArrayDeque<>();  // parallel min tracker

    public void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(minStack.peek(), val));
    }
    public void pop() { stack.pop(); minStack.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
}
// Key: minStack always holds min so far → O(1) getMin | LC 155
```

### 🚀 GO LEARN — Monotonic Stack (You'll Need This)

**STOP** — For "next greater element" pattern, you need Monotonic Stack.

📖 [11_Stack_Plus_MonotonicPattern.md](../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md)
📖 [15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)

⬅️ **RETURN CHECKPOINT** — Apply below after studying.

### ✅ Apply: Next Greater Element — Monotonic Stack O(n)

```
Brute: For each element, scan right → O(n²)
Optimal: Monotonic decreasing stack → O(n)

IDEA: Maintain stack in decreasing order.
When we find a bigger element, it's the "next greater" for everything smaller in stack.
```

```java
public int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();   // stores indices

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
            result[stack.pop()] = arr[i];        // arr[i] is next greater
        stack.push(i);
    }
    return result;
}
// LC 496 — Next Greater Element I | LC 739 — Daily Temperatures
```

### Queue Quick Questions

**Q1 — BFS Template** _(Queue's most important use)_

```java
// Standard BFS — O(V + E) for graphs, O(n) for arrays
Queue<Integer> queue = new LinkedList<>();
boolean[] visited = new boolean[n];
queue.offer(start);
visited[start] = true;

while (!queue.isEmpty()) {
    int node = queue.poll();
    // process node
    for (int neighbor : getNeighbors(node))
        if (!visited[neighbor]) {
            visited[neighbor] = true;
            queue.offer(neighbor);
        }
}
```

**Q2 — Sliding Window Maximum — Deque O(n)**

```
Brute: Max of each window → O(n*k)
Optimal: Monotonic Deque → O(n) — maintains max at front
```

```java
public int[] maxSlidingWindow(int[] arr, int k) {
    int n = arr.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // stores indices, front = max

    for (int i = 0; i < n; i++) {
        if (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.pollFirst(); // out of window
        while (!deque.isEmpty() && arr[deque.peekLast()] <= arr[i]) deque.pollLast(); // smaller useless
        deque.offerLast(i);
        if (i >= k - 1) result[i - k + 1] = arr[deque.peekFirst()];
    }
    return result;
}
// LC 239 — Sliding Window Maximum
```

---

## 🎯 Full Problem Set — Stack & Queue

| #   | Problem                                | Platform   | Difficulty  | Pattern          |
| --- | -------------------------------------- | ---------- | ----------- | ---------------- |
| 1   | LC 20 — Valid Parentheses              | LeetCode   | ⭐ Easy     | Stack matching   |
| 2   | LC 155 — Min Stack                     | LeetCode   | ⭐⭐ Med    | Two stacks       |
| 3   | LC 496 — Next Greater Element I        | LeetCode   | ⭐ Easy     | Monotonic stack  |
| 4   | LC 739 — Daily Temperatures            | LeetCode   | ⭐⭐ Med    | Monotonic stack  |
| 5   | LC 84 — Largest Rectangle in Histogram | LeetCode   | ⭐⭐⭐ Hard | Monotonic stack  |
| 6   | LC 239 — Sliding Window Maximum        | LeetCode   | ⭐⭐⭐ Hard | Monotonic deque  |
| 7   | LC 232 — Implement Queue using Stacks  | LeetCode   | ⭐ Easy     | Two stacks       |
| 8   | LC 102 — Binary Tree Level Order       | LeetCode   | ⭐⭐ Med    | BFS Queue        |
| 9   | CF 82A — Double Cola                   | Codeforces | Div2-A      | Queue simulation |

---

🔬 **Section Challenge — 🎯 Full Problem Set — Stack & Queue**

**Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?

<details><summary>Answer</summary>

In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.

</details>

### Additional Stack & Queue Challenges

**Challenge 3 (Tracing):** Trace the call stack of `factorial(5)` — how many stack frames are pushed in total? What is the maximum depth of the stack at any point during execution? If the base case is `factorial(0) = 1`, how many frames exist on the stack at that moment?

<details><summary>Answer</summary>

`factorial(5)` pushes 6 frames total: `factorial(5)`, `factorial(4)`, `factorial(3)`, `factorial(2)`, `factorial(1)`, `factorial(0)`. The maximum depth is 6 (all frames on the stack simultaneously, before any `return` unwinds the stack). Each `factorial(n)` calls `factorial(n-1)` — the call goes deeper before unwinding. This is why the JVM stack grows linearly with recursion depth.

For comparison, `fibonacci(5)` also has max depth 6, but makes **exponentially more calls** — `fibonacci(40)` has depth ~40 but makes 331,160,281 calls! This is the key difference between depth and total work.

</details>

**Challenge 4 (Design & API):** Why does the JDK use a `Deque` for `ArrayDeque` but deprecate the `Stack` class entirely? (Hint: think about inheritance vs composition. What class does `Stack` extend, and why is that inheritance relationship a problem?)

<details><summary>Answer</summary>

`java.util.Stack` extends `java.util.Vector`. This is problematic because: (1) `Vector` is synchronized (every operation is thread-safe but slow), wasting performance for single-threaded use; (2) `Vector` allows random access via `elementAt(i)` and indexed insert/remove, which violate the Stack contract — a proper stack should only allow top access. The JDK recommends using `ArrayDeque` instead: resizable array, no sync overhead, double-ended so works as both Stack and Queue. The `Deque` interface even provides `push()`/`pop()`/`peek()` — the stack operations, without the baggage of vector inheritance. This is a classic example of the **Liskov Substitution Principle**: `Stack` cannot substitute for `Vector` cleanly (it shouldn't allow arbitrary index access), so inheritance was the wrong relationship.

</details>

## 🧠 Pattern Fingerprint — Stack & Queue

```
SEE THESE WORDS → USE THIS:
┌──────────────────────────────────────────────────────────────┐
│ "matching brackets / nesting"     → Stack (LIFO natural)    │
│ "next greater / smaller element"  → Monotonic Stack O(n)    │
│ "largest rectangle in histogram"  → Monotonic Stack         │
│ "BFS / level-by-level traversal"  → Queue                   │
│ "sliding window maximum"          → Monotonic Deque O(n)    │
│ "undo / redo"                     → Two Stacks              │
│ "evaluate expression"             → Two Stacks (ops+vals)   │
└──────────────────────────────────────────────────────────────┘
```

### 🚀 GO LEARN — When You Need More

| Topic                         | File                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Stack patterns deep dive      | 📖 [11_Stack_Plus_MonotonicPattern.md](../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md) |
| Practice problems Stack/Queue | 📖 [08_Stack_Queue.md](../05_Problem_Solving/08_Stack_Queue.md)                                    |
| Monotonic complete guide      | 📖 [15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)   |

### 📅 Revisit Tracker

- **Day 3:** Redo LC 20 (Balanced) + LC 496 (Next Greater) from memory
- **Day 7:** Redo LC 739 (Daily Temperatures) — explain the monotonic stack logic

---

---

## ✅ You Know Stack & Queue — Now Practice! (JIT Study Path)

**Step 1 — Basic Problems (Warm Up):**

| Problem                      | LC #   | Pattern         | Key Concept                               |
| ---------------------------- | ------ | --------------- | ----------------------------------------- |
| Valid Parentheses            | LC 20  | Stack matching  | Push open, pop & match close              |
| Min Stack                    | LC 155 | Auxiliary stack | Keep a parallel min-so-far stack          |
| Implement Queue using Stacks | LC 232 | Two stacks      | Input stack → output stack (lazy reverse) |
| Daily Temperatures           | LC 739 | Monotonic Stack | Decreasing stack, pop when warmer found   |
| Next Greater Element I       | LC 496 | Monotonic Stack | Stack + HashMap for O(n) answer           |

**Step 2 — Hit a wall? Learn these patterns:**

- Nearest greater/smaller → **[Monotonic Stack Guide](../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md)**
- BFS level-by-level → **[Graph Fundamentals](../03_Algorithms/05c_Graphs_Fundamentals.md)**

**Step 3 — Apply patterns on harder problems:**
👉 **[Go to Stack/Queue Problem Solving File →](../05_Problem_Solving/08_Stack_Queue.md)**

**Step 4 — Competitive Practice:**

| CF Problem                                                                                | Topic            | Difficulty  |
| ----------------------------------------------------------------------------------------- | ---------------- | ----------- |
| [CF 5C — Longest Regular Bracket Sequence](https://codeforces.com/problemset/problem/5/C) | Stack (brackets) | ⭐⭐ Medium |
| [CF 797C — Minimal String](https://codeforces.com/problemset/problem/797/C)               | Greedy + Stack   | ⭐⭐ Medium |
| [CF 1830C — Hyperflation](https://codeforces.com/problemset/problem/1830/C)               | Monotonic Stack  | ⭐⭐ Medium |

🌍 **Real-World Connections:**

- **Undo/Redo** in every editor (VS Code, Word) = two stacks: undo stack + redo stack
- **Browser history** = back button = stack of visited pages
- **Call stack in JVM/V8** = stack frame pushed per function call, popped on return
- **Message queues** (Kafka, RabbitMQ) = distributed queues at massive scale
- **CPU instruction pipeline** = queue of instructions to execute

---

# 🎓 University-Level Addendum — Stack & Queue as Formal Theory

> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. The audit identified invariants as the critical gap. Stacks and queues have the simplest data-structure invariants in computer science — yet they are the *most violated* in practice because developers assume "it's just push/pop." The content below formalizes LIFO/FIFO invariants, the constraint-first decision framework, the canonical "when breaks" scenarios (especially bounded vs unbounded), and the recursion-to-iterative conversion pitfalls.

## Stack and Queue Invariants

### Stack Invariants

A stack's correctness rests on three invariants that **must hold after every operation**:

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **S1 — LIFO order** | The element returned by `pop()` is the most recently `push()`-ed element that has not yet been popped | Wrong return value; inverting expected order |
| **S2 — Top terminator** | For an array-backed stack: `top == -1` (empty) or `top < capacity` (non-empty) | Out-of-bounds read/write; potential segfault |
| **S3 — Size consistency** | `size == top + 1` (after pushes/pops that don't grow) | Iteration terminates at wrong index; iterator returns stale elements |

These invariants must be **re-established** after every push, pop, and growth operation. The Java `Stack` class (legacy) and `ArrayDeque` (modern) preserve them via careful index arithmetic.

### Queue Invariants

A queue is harder than a stack because it has *two* ends:

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **Q1 — FIFO order** | The element returned by `dequeue()` is the element that has been `enqueue()`-ed for the longest time | Wrong return value; inverting expected order |
| **Q2 — Head/tail within bounds** | `0 ≤ head < capacity && 0 ≤ tail < capacity` (linear) or `head == tail` (empty/full in circular) | Out-of-bounds; lost elements |
| **Q3 — Size consistency** | `size == (tail - head) mod capacity` (circular) or `size == tail - head` (linear) | Iteration skips/duplicates elements |
| **Q4 — Empty/full distinction (circular)** | Use a `size` field; never compare `head == tail` to detect both | Either infinite growth (no full detection) or refusal to enqueue when not full |

The circular buffer (ring buffer) is the canonical implementation; Q4 is the invariant most often violated because developers try to use `head == tail` for both empty and full detection.

### Formal Proof Sketch — Circular Buffer Preserves Q1–Q4

```
Invariant Q1 (FIFO):  enqueue at tail, dequeue at head. As long as tail only moves forward (mod capacity) and head only moves forward (mod capacity), the dequeue order matches the enqueue order. ✓
Invariant Q2 (bounds):  both head and tail are updated mod capacity, so they stay in [0, capacity). ✓
Invariant Q3 (size):  size is incremented on enqueue (mod capacity would lose increments) and decremented on dequeue. Independent of head/tail arithmetic. ✓
Invariant Q4 (empty/full):  head == tail is ambiguous. With a size field, empty = size == 0, full = size == capacity. The head/tail positions can be equal in both cases. ✓
```

The Linux kernel `kfifo` and the Java `ArrayBlockingQueue` both use this design.

## Constraint-First Decision Framework — Stack, Queue, Deque, or Priority Queue?

### Decision Tree

```
problem requires LIFO order?
  → YES → Stack
  → NO → continue

problem requires FIFO order?
  → YES → continue
  → NO → consider Deque (double-ended)

bounded capacity (fixed size)?
  → YES → ArrayDeque or bounded ArrayBlockingQueue
  → NO → linked-list-based Queue (no overflow risk)

priority-based ordering (smallest/largest first)?
  → YES → PriorityQueue (binary heap) — see 01f_Trees_Heaps.md
  → NO → continue

thread-safe required?
  → YES → ArrayBlockingQueue, ConcurrentLinkedQueue, LinkedBlockingDeque
  → NO → ArrayDeque (faster, no synchronization overhead)

need to remove arbitrary element?
  → YES → Deque or PriorityQueue (not Stack or Queue)
  → NO → Stack or Queue
```

### Decision Table

| Workload | Best Choice | Why |
|---|---|---|
| Undo/redo, expression eval, DFS | Stack | LIFO matches natural ordering |
| BFS, task scheduling, message queue | Queue | FIFO matches temporal ordering |
| Sliding window max, work-stealing | Deque | Need both ends |
| Top-K, Dijkstra, merge-K-sorted | PriorityQueue | Need min/max at head |
| Producer-consumer (multi-thread) | ArrayBlockingQueue | Bounded + thread-safe |
| Producer-consumer (single-thread) | ArrayDeque | Fastest, no sync overhead |

### Worked Example — Picking Stack vs Queue for a Problem

**Problem:** Print a binary tree level by level (each level on its own line).

- **Constraint:** Output order is level 0, then level 1, then level 2 — temporal/FIFO order.
- **Choice:** Queue. Use BFS with a queue.
- **Algorithm:** Enqueue root; while queue non-empty, dequeue node, print, enqueue children.

**Common mistake:** Use a stack and get reverse level order (level 2, 1, 0). This is the bug the monotonic stack in the body of this chapter warns against.

## When Stacks/Queues Break — Formal Failure Modes

### Break 1 — Stack Overflow from Deep Recursion

**Condition:** Recursion depth exceeds the thread's stack size (default 1 MiB on HotSpot; ~10⁴ stack frames for typical Java methods, fewer for C++).

**What breaks:** `StackOverflowError` thrown mid-call. The current frame's locals are partially initialized. If a `try { ... } finally { cleanup(); }` is in flight, the `finally` may not execute.

**Invariant violated:** S2 (top terminator). The runtime's stack guard page is hit.

**Defense:** Convert recursion to iteration using an explicit stack (see below). Or increase thread stack size with `-Xss`. See `01a_Memory_Foundations.md` Break 1 and the production failure mode 1 in the body.

### Break 2 — Unbounded Queue Memory Exhaustion

**Condition:** Producer is faster than consumer for an unbounded queue (`LinkedList`-backed, no capacity limit).

**What breaks:** Queue grows without bound → `OutOfMemoryError`. Production traffic can DDoS the JVM by simply POSTing faster than the worker can process.

**Invariant violated:** Q3 (size consistency). The queue's size grows without bound.

**Defense:** Use a bounded queue (`ArrayBlockingQueue`) with a rejection policy (e.g., `AbortPolicy` throws, `CallerRunsPolicy` runs the producer thread synchronously to apply backpressure). See `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` for the full backpressure discussion.

### Break 3 — Queue Deadlock (BlockingQueue)

**Condition:** Two threads each hold a lock and wait for the other to release. Classic deadlock pattern: thread A holds lock X waiting for Y; thread B holds Y waiting for X.

**What breaks:** Both threads block forever. The application hangs; health checks report OK until the heartbeat expires.

**Invariant violated:** Q1 (FIFO) cannot progress because no thread is consuming.

**Defense:** Always use a timeout on `BlockingQueue.take()` (e.g., `poll(timeout, unit)`). Detect deadlocks via thread dumps. See production failure mode 2 in the body of this chapter.

### Break 4 — PriorityQueue Non-Determinism

**Condition:** Two elements compare equal in the `Comparator`. `PriorityQueue` does not guarantee any order for equal elements; the iteration order is implementation-dependent.

**What breaks:** Non-deterministic behavior across JVM versions or platforms. A test passes locally, fails in CI, passes in production, fails again.

**Invariant violated:** Implicit — equal elements should have stable ordering. `PriorityQueue` does not provide this.

**Defense:** Always use a tie-breaker in the comparator (e.g., `(a, b) -> Integer.compare(a.priority, b.priority) != 0 ? compare : Integer.compare(a.id, b.id)`).

### Break 5 — Circular Buffer head == tail Ambiguity

**Condition:** Using a circular buffer without a `size` field, trying to detect both empty and full with `head == tail`.

**What breaks:** Cannot distinguish empty (size = 0) from full (size = capacity). Either the buffer overflows (no full detection) or refuses to enqueue when not full.

**Invariant violated:** Q4 (empty/full distinction).

**Defense:** Always maintain a separate `size` field, or sacrifice one slot (`capacity - 1` usable).

### Break 6 — Stack Reallocation Invalidates References

**Condition:** Holding a reference to an internal array element of an array-backed stack. The stack grows and copies elements to a new array. The held reference now points to stale memory.

**What breaks:** Use-after-free or stale read. In Java, this is mostly mitigated by GC, but the principle applies to `Iterator` semantics.

**Invariant violated:** S2 (top terminator). The stack's internal storage is replaced.

**Defense:** Always re-fetch references after push operations that may trigger growth.

## Recursion-to-Iterative Conversion

Recursive algorithms use the call stack implicitly. Converting to iteration requires an explicit stack. The pattern is:

```
Recursive function f(n, state):
    if base_case(n):
        return base_value
    
    result1 = f(n-1, state1)
    result2 = f(n-2, state2)
    return combine(result1, result2)

Iterative version:
    stack = new Stack<(n, state)>
    stack.push((N, initial_state))
    result_stack = new Stack<Result>()
    
    while not stack.isEmpty():
        (n, state) = stack.pop()
        if base_case(n):
            result_stack.push(base_value)
            continue
        stack.push((n-1, state1))
        stack.push((n-2, state2))
    
    return combine_all(result_stack)
```

### Pitfalls

| Pitfall | What Goes Wrong | Fix |
|---|---|---|
| Stack order matters | If recursive call order matters (e.g., Fibonacci), pushing `f(n-1)` then `f(n-2)` gives wrong order | Track stack explicitly; use the same order as recursion |
| Shared mutable state | Multiple "branches" of recursion mutate the same state | Pass state through the stack frame, not via shared variable |
| Tail recursion | Compiler may not optimize; explicit loop may be cleaner | Use a `while` loop with accumulator instead of stack |
| Result accumulation | Iterative version may need to combine results in a specific order | Use a second stack or accumulate as you go |

### Worked Example — Fibonacci Recursive to Iterative

```java
// Recursive — O(2^n) due to recomputation, O(n) stack depth
long fibRecursive(int n) {
    if (n < 2) return n;
    return fibRecursive(n-1) + fibRecursive(n-2);
}

// Iterative — O(n) time, O(1) space
long fibIterative(int n) {
    if (n < 2) return n;
    long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long c = a + b;
        a = b;
        b = c;
    }
    return b;
}

// Iterative with explicit stack — preserves the recursion structure
// Useful when the recursive structure is harder to flatten
long fibExplicitStack(int n) {
    Deque<Integer> stack = new ArrayDeque<>();
    Deque<Long> results = new ArrayDeque<>();
    stack.push(n);
    while (!stack.isEmpty()) {
        int k = stack.pop();
        if (k < 2) {
            results.push((long) k);
        } else {
            stack.push(k - 1);
            stack.push(k - 2);
        }
    }
    // Combine results — note the stack reverses order
    long b = results.pop();
    long a = results.pop();
    while (!results.isEmpty()) {
        long next = a + b;
        a = b;
        b = next;
        // Pop old values if needed
    }
    return b;
}
```

The pure iterative version is preferred; explicit-stack version is useful when the recursion has shared state that is hard to flatten.

## Edge Cases — Always Check These

| # | Edge Case | What Can Break |
|---|---|---|
| 1 | **Empty stack/queue** | `pop()` / `dequeue()` on empty throws `NoSuchElementException`; check `isEmpty()` first |
| 2 | **Single element** | `peek()` / `front()` returns the only element |
| 3 | **Full bounded queue** | `add()` throws `IllegalStateException`; `offer()` returns false |
| 4 | **Capacity = 1** | Circular buffer degenerates; ensure size field present |
| 5 | **Concurrent enqueue/dequeue** | Race condition on `head`/`tail`; need CAS or lock |
| 6 | **Comparator returns 0** | PriorityQueue non-determinism |
| 7 | **Null elements in PriorityQueue** | NPE in `compareTo`; some comparators allow null but it's confusing |
| 8 | **Deep recursion (≥ 10⁴ frames)** | StackOverflowError; convert to iteration |
| 9 | **Large queue (≥ 10⁶ elements)** | Memory pressure; consider bounded queue + backpressure |
| 10 | **Pop from empty after concurrency** | Even with `isEmpty()` check, race condition possible; use thread-safe variant |

## Formal Complexity Proofs — Stack & Queue Operations

### Push / Pop (Array-Backed Stack)

```
T_push(s) = O(1) amortized
  1. if top == capacity - 1: grow by 1.5× → O(n) copy
  2. arr[++top] = data       → O(1)
  3. size++                  → O(1)

Amortized O(1) by geometric series: see 01g_DS_Internals.md Challenge 1.
```

### Enqueue / Dequeue (Circular Buffer)

```
T_enqueue(q) = O(1)
  1. if size == capacity: throw or return false
  2. arr[tail] = data
  3. tail = (tail + 1) mod capacity
  4. size++

T_dequeue(q) = O(1)
  1. if size == 0: throw or return null
  2. data = arr[head]
  3. arr[head] = null  // help GC
  4. head = (head + 1) mod capacity
  5. size--
  return data
```

Both are strict O(1), no amortization needed (no resize for bounded circular buffer).

### BFS Time Complexity

For a graph with V vertices and E edges:

```
T_BFS(s) = O(V + E)
  Each vertex is enqueued once and dequeued once → O(V)
  Each edge is examined twice (once from each endpoint) → O(E)
  Total: O(V + E)
```

The queue itself holds at most V elements, so space is O(V).

### Monotonic Stack Time Complexity

For an array of n elements, computing next-greater-element:

```
T_monotonic_stack(n) = O(n) amortized
  Each element is pushed once and popped at most once → 2n operations → O(n)
```

Despite nested-looking loops, the total work is O(n) because each element enters and exits the stack at most once. This is the *amortized* analysis.

## Cross-References

- **`01a_Memory_Foundations.md`** — stack frame mechanics; why deep recursion breaks; cache miss on stack-allocated arrays.
- **`01c_LinkedList.md`** — linked-list-backed stack/queue implementations; pointer invariants.
- **`01e_HashTable.md`** — `LinkedHashMap` uses a doubly-LL + hash table (related to stack/queue iteration order).
- **`01g_DS_Internals.md`** — `ArrayDeque` resize proof; `ArrayBlockingQueue` lock design.
- **`02_PROBLEM_SETS.md`** — exam-style monotonic-stack correctness proof; BFS shortest-path proof.
- **`13_Developer_Essentials/19_Concurrency_Models_Coroutines.md`** — backpressure and bounded queues in concurrency.

---

## 💥 When Stack / Queue Breaks

> These are the exact failure modes that bite production systems and trip up interviewers.

### 1. Stack Overflow — Unbounded Recursive Depth
**What breaks**: Using an implicit call stack (DFS, parser, expression evaluator) on deep inputs. JVM default stack size ≈ 512KB–1MB → ~10,000 frames → `StackOverflowError` with no useful stack trace.
**Trigger constraint**: Any graph with depth > 10K nodes, any JSON/XML with > 10K nesting levels.
**Fix**: Convert to an explicit `ArrayDeque` stack (heap-allocated, no depth limit).
```java
// Instead of recursive DFS:
Deque<Node> stack = new ArrayDeque<>();
stack.push(root);
while (!stack.isEmpty()) { Node n = stack.pop(); ... }
```

### 2. Java's `Stack` Class — Wrong Tool
**What breaks**: Using `java.util.Stack` in production code.
**Why**: `Stack` extends `Vector`, which is fully `synchronized`. Every push/pop acquires a lock — 3–5× slower than `ArrayDeque` in single-threaded use.
**Fix**: Always use `Deque<T> stack = new ArrayDeque<>()` instead. For thread-safe use: `ConcurrentLinkedDeque` or `LinkedBlockingDeque`.

📎 **Reference Anchor**: [OpenJDK ArrayDeque source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayDeque.java)
**Invariant learned**: `ArrayDeque` doubles its backing array when full (same amortized O(1) as ArrayList). Head/tail pointers wrap around the circular array.
**Constraint warning**: `ArrayDeque` does not allow null elements — it uses null as a sentinel internally. Use `null`-safe wrappers if nulls are required.

### 3. Monotonic Stack — Forgetting the Remaining Elements
**What breaks**: Processing only the elements that caused a pop during the main loop, forgetting that elements still in the stack after the loop represent "no right boundary found."
```java
// BUG — stack still has elements after the loop:
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
        result[stack.pop()] = i; // next greater found
    stack.push(i);
}
// MISSING: process remaining elements in stack
while (!stack.isEmpty()) result[stack.pop()] = -1; // no right boundary
```
**Invariant**: After the main loop, every index still in the stack has no greater element to its right → answer is -1 (or n, or ∞, depending on the problem).

### 4. Unbounded Queue → OutOfMemoryError
**What breaks**: Using a `LinkedBlockingQueue` with no capacity limit (the default constructor in `LinkedBlockingQueue` is `Integer.MAX_VALUE` capacity) in a producer-consumer system where the producer is faster than the consumer. The queue grows without bound until OOM.
**Fix**: Always specify capacity: `new LinkedBlockingQueue<>(1000)`. This creates natural backpressure — the producer blocks when the queue is full.
**Production war story**: Java's `Executors.newFixedThreadPool()` uses an unbounded `LinkedBlockingQueue` for task queuing. If tasks are submitted faster than they complete, memory grows unboundedly. Use `ThreadPoolExecutor` with a bounded queue and a `RejectedExecutionHandler`.

### 5. Deque Used as Both Stack and Queue — Wrong-End Operations
**What breaks**: Using `addFirst`/`removeFirst` for one role and `addLast`/`removeFirst` for another in the same `ArrayDeque` — correct Java API but easy to confuse which end is which.
**Fix**: Use named roles explicitly: `push`/`pop` for stack semantics (both operate on head), `offer`/`poll` for queue semantics (offer at tail, poll from head).

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Correctness — 8 min)**: Prove that the monotonic decreasing stack computes the "next greater element" for every index correctly in O(n) total time.

<details><summary>Model Answer</summary>

**Invariant**: The stack, from bottom to top, contains indices of elements in strictly decreasing order. Every element in the stack has not yet found its "next greater element."

- **Init**: Stack empty — invariant holds vacuously. ✓
- **Maintenance**: When `arr[i] > arr[stack.peek()]`, we found the next greater element for `stack.peek()`. Pop until the invariant is restored, then push `i`. ✓
- **Termination**: After the loop, elements still in the stack have no greater element to their right → answer = -1. ✓

**Total O(n)**: Each index is pushed exactly once and popped at most once. Total push + pop ≤ 2n operations → O(n). ✓

</details>

---

**Problem 2 (Analysis — 6 min)**: A `Queue` is implemented using two stacks `S1` and `S2`. `enqueue` pushes to `S1`. `dequeue` pops from `S2`; if `S2` is empty, all elements are moved from `S1` to `S2` first. Prove that the amortised cost per `dequeue` is O(1).

<details><summary>Model Answer</summary>

**Potential function**: Φ = size of S1 (number of elements waiting to be transferred).

- **enqueue**: actual cost = 1; ΔΦ = +1; amortised = 1 + 1 = 2 = O(1). ✓
- **dequeue (S2 not empty)**: actual cost = 1; ΔΦ = 0 (S1 unchanged); amortised = 1 = O(1). ✓
- **dequeue (S2 empty, transfer k elements)**: actual cost = k + 1; ΔΦ = -k (S1 empties); amortised = (k+1) + (-k) = 1 = O(1). ✓

Every operation is O(1) amortised. ✓

</details>

---

**Problem 3 (Design — 10 min)**: Design a queue that supports `enqueue`, `dequeue`, and `getMax()` — all O(1) amortised.

<details><summary>Model Answer</summary>

**Structure**: Main queue + monotonic decreasing deque (max-deque).
- `enqueue(x)`: add x to main queue; pop from back of deque while `deque.back() < x`; push x to back of deque.
- `dequeue()`: remove from front of main queue; if front equals `deque.front()`, remove from front of deque too.
- `getMax()`: return `deque.front()`.

**Correctness**: The deque always holds, in decreasing order, the indices of elements that could still be the maximum (the "candidates"). Elements smaller than a newer element can never be max, so they're discarded. ✓

**Amortised O(1)**: Each element enters and exits the deque at most once → O(n) total deque operations for n enqueues. ✓

</details>
