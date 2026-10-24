# Production Failure Modes

> **Navigation**: [← Queue](02_queue.md) | [Chapter overview](../01d_Stack_Queue.md) | [Foundation Practice — Stack & Queue →](04_foundation_practice_stack_queue.md)
> Page 3 of 5 in **Stacks & Queues**


Understanding data structures is incomplete without knowing how they fail under load. Both Stack and Queue have well-documented production failure patterns.

## Failure 1: StackOverflowError in Deep Recursion

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

## Failure 2: Blocking Queue Deadlock

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

## Failure 3: Priority Queue Non-Determinism (Test Flakiness)

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

[← Queue](02_queue.md) | [Chapter overview](../01d_Stack_Queue.md) | [Foundation Practice — Stack & Queue →](04_foundation_practice_stack_queue.md)
