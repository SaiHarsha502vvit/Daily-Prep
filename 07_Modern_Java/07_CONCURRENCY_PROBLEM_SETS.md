# 📝 Java Concurrency — Problem Sets
## `07_Modern_Java` Module (Ch15–Ch17) | Thread Safety · Locks · ExecutorService · CompletableFuture

> **How to use:** Write the correct output or fix BEFORE looking. Test your fixes with JUnit. Read 🔴 **Erklärung** when surprised.

---

## Problem Set JAVA-PS3 — Concurrency Bugs & Fixes

**Prerequisites:** `07_Modern_Java/Ch15_Concurrency_Core.md`, `07_Modern_Java/Ch16_Concurrency_Advanced.md`, `07_Modern_Java/Ch17_CompletableFuture.md`

---

### Part A: Identify the Bug

**A1 (Easy).** This counter is accessed by 10 threads. What's wrong?
```java
public class Counter {
    private int count = 0;
    
    public void increment() { count++; }
    public int get() { return count; }
}
```

<details><summary>Answer</summary>

**Bug: Data race.** `count++` is NOT atomic — it compiles to three operations: READ count → ADD 1 → WRITE count. Two threads can simultaneously read the same stale value, both add 1, and both write the same result → increments are lost.

**Fix 1 — `synchronized`:**
```java
public synchronized void increment() { count++; }
public synchronized int get() { return count; }
```

**Fix 2 — `AtomicInteger` (better for single-counter use cases):**
```java
private final AtomicInteger count = new AtomicInteger(0);
public void increment() { count.incrementAndGet(); }
public int get() { return count.get(); }
```

**Fix 3 — `LongAdder` (best for high-contention counters):**
```java
private final LongAdder count = new LongAdder();
public void increment() { count.increment(); }
public long get() { return count.sum(); }
```

🔴 **Erklärung:** `AtomicInteger` uses hardware CAS (Compare-And-Swap) — faster than `synchronized` for single-variable updates. `LongAdder` is even faster under high contention (multiple threads) because it stripes the counter across CPU cores. Use `LongAdder` for hot counters.
</details>

---

**A2 (Medium).** Will this deadlock? Trace the execution.
```java
Object lock1 = new Object();
Object lock2 = new Object();

Thread t1 = new Thread(() -> {
    synchronized (lock1) {
        Thread.sleep(10);
        synchronized (lock2) {
            System.out.println("T1 done");
        }
    }
});

Thread t2 = new Thread(() -> {
    synchronized (lock2) {
        Thread.sleep(10);
        synchronized (lock1) {
            System.out.println("T2 done");
        }
    }
});
```

<details><summary>Answer</summary>

**Yes — classic deadlock.**

- T1 acquires `lock1`, sleeps, then waits for `lock2`
- T2 acquires `lock2`, sleeps, then waits for `lock1`
- Each holds what the other needs → circular wait → deadlock

**Deadlock conditions (all 4 must hold):**
1. **Mutual exclusion** — locks can't be shared
2. **Hold and wait** — T1 holds lock1 while waiting for lock2
3. **No preemption** — OS can't forcibly take lock1 from T1
4. **Circular wait** — T1 → lock2 → T2 → lock1 → T1

**Fix: Lock ordering** — always acquire locks in the same order:
```java
// Both T1 and T2 acquire lock1 FIRST, then lock2
Thread t2 = new Thread(() -> {
    synchronized (lock1) {   // ← same order as T1
        synchronized (lock2) {
            System.out.println("T2 done");
        }
    }
});
```

🔴 **Erklärung:** Lock ordering is the simplest deadlock prevention. Assign a canonical order to all locks in your system (e.g., by object hash) and enforce that all code acquires them in that order.
</details>

---

**A3 (Hard).** What is the output? Will this ever print "Not started" after the thread launches?
```java
class Service {
    boolean started = false;  // not volatile
    
    void start() {
        new Thread(() -> {
            started = true;
        }).start();
        
        // spin-wait
        while (!started) {} 
        System.out.println("Started!");
    }
}
```

<details><summary>Answer</summary>

**Output: might spin forever** — the main thread might NEVER see `started = true`.

Without `volatile`, the write by the child thread is not guaranteed to be flushed to main memory. The main thread might spin-wait on a cached copy of `started = false` indefinitely — even after the child thread wrote `true`.

**Fix:** `volatile boolean started = false;`

`volatile` establishes a happens-before relationship: the write `started = true` in the child thread happens-before any subsequent read of `started` in the main thread.

**Better fix:** Don't spin-wait at all — use `CountDownLatch`:
```java
CountDownLatch latch = new CountDownLatch(1);
new Thread(() -> { doWork(); latch.countDown(); }).start();
latch.await(); // blocks until countDown() is called
System.out.println("Started!");
```

🔴 **Erklärung:** Spin-wait (`while(!flag){}`) wastes 100% CPU on the waiting thread. Even with `volatile`, it's busy-waiting. Always prefer blocking coordination primitives: `CountDownLatch`, `CyclicBarrier`, `Semaphore`, `BlockingQueue`.
</details>

---

### Part B: Implementation

**B1.** Implement a thread-safe `BoundedBlockingQueue<T>`:

```java
// Skeleton — JavaSolutions/ps/concurrency/BoundedBlockingQueue.java
import java.util.*;
import java.util.concurrent.locks.*;

public class BoundedBlockingQueue<T> {
    private final int capacity;
    private final Queue<T> queue = new ArrayDeque<>();
    private final Lock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition(); // signal when space available
    private final Condition notEmpty = lock.newCondition(); // signal when element available
    
    public BoundedBlockingQueue(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException();
        this.capacity = capacity;
    }
    
    /**
     * Inserts element, blocking if queue is full until space is available.
     */
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) notFull.await(); // release lock while waiting
            queue.add(item);
            notEmpty.signal(); // notify waiting takers
        } finally {
            lock.unlock(); // ALWAYS release in finally
        }
    }
    
    /**
     * Removes and returns head, blocking if queue is empty.
     */
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await();
            T item = queue.poll();
            notFull.signal(); // notify waiting putters
            return item;
        } finally {
            lock.unlock();
        }
    }
    
    public int size() {
        lock.lock();
        try { return queue.size(); }
        finally { lock.unlock(); }
    }
}
```

**JUnit Test Stub:**
```java
class BoundedBlockingQueueTest {
    @Test void put_andTake_singleThread() throws InterruptedException {
        var q = new BoundedBlockingQueue<Integer>(3);
        q.put(1); q.put(2); q.put(3);
        assertEquals(1, q.take());
        assertEquals(3, q.size()); // wait — after take it should be 2
        assertEquals(2, q.size());
    }
    
    @Test void put_blocksWhenFull() throws Exception {
        var q = new BoundedBlockingQueue<Integer>(1);
        q.put(1);
        var putThread = new Thread(() -> {
            try { q.put(2); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        putThread.start();
        Thread.sleep(100);
        assertEquals(Thread.State.WAITING, putThread.getState()); // blocked
        q.take(); // unblock
        putThread.join(500);
        assertFalse(putThread.isAlive());
    }
}
```

---

**B2.** Implement a parallel file processor using `CompletableFuture`:

```java
// JavaSolutions/ps/concurrency/ParallelFileProcessor.java
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

public class ParallelFileProcessor {
    private final ExecutorService executor;
    
    public ParallelFileProcessor(int threadCount) {
        this.executor = Executors.newFixedThreadPool(threadCount);
    }
    
    /**
     * Processes a list of file paths in parallel.
     * Returns a map of filepath → word count.
     */
    public Map<String, Long> processFiles(List<Path> files) throws Exception {
        List<CompletableFuture<Map.Entry<String, Long>>> futures = files.stream()
            .map(path -> CompletableFuture.supplyAsync(() -> {
                try {
                    String content = Files.readString(path);
                    long wordCount = Arrays.stream(content.split("\\s+"))
                        .filter(w -> !w.isBlank())
                        .count();
                    return Map.entry(path.toString(), wordCount);
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            }, executor))
            .toList();
        
        // Wait for all futures, collect results
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(_ -> futures.stream()
                .map(CompletableFuture::join) // safe — all complete at this point
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)))
            .get();
    }
    
    public void shutdown() { executor.shutdown(); }
}
```

🔴 **Erklärung:**

| Mistake | Why | Fix |
|---|---|---|
| `CompletableFuture.supplyAsync(fn)` without custom executor | Uses the default `ForkJoinPool.commonPool()` — shared with parallel streams; blocking I/O starves other tasks | Always pass a dedicated `ExecutorService` for I/O-bound tasks |
| `.get()` inside the `thenApply` lambda | Nested blocking defeats async | Call `.join()` only AFTER `allOf()` resolves — all tasks are guaranteed complete |
| Not shutting down `ExecutorService` | Thread pool threads keep JVM alive after `main()` exits | Always call `executor.shutdown()` or use try-with-resources |

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)
