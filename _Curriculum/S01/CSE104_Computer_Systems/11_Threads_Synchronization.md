# Chapter 11 — Threads & Synchronization

> [← 10 Dynamic Memory & the Heap](10_Dynamic_Memory_Heap.md) | [Course Index](README.md) | [Next → 12 I/O, Files & the Unix Philosophy](12_IO_Files_Unix_Philosophy.md)

---

## The Problem: Doing Two Things at Once

You have 8 CPU cores. Your program uses one. The other 7 sit idle while your image-processing loop grinds through a 100 MB photo.

Or: your web server receives 1000 simultaneous requests. If each request blocks waiting for a database query, you can only serve one at a time.

**Threads** are the solution — multiple flows of execution sharing one address space. Understanding threads explains:
- Why "just add a thread" often makes code SLOWER (lock contention, cache thrashing)
- Why `counter++` is not thread-safe even though it looks atomic
- What a mutex actually does at the hardware level
- Why Java's `synchronized` works, but still has deadlock, livelock, and starvation traps
- How lock-free programming (AtomicInteger) avoids mutexes entirely

---

## Threads vs Processes

```
Process:
  - Own virtual address space (own page tables)
  - Own file descriptor table
  - Expensive to create (copy page tables, etc.)
  - Communication via IPC (pipes, shared memory, sockets)
  - Fault isolation: one process crash doesn't kill others

Thread (within one process):
  - Shares address space with all other threads in the process
  - Shares file descriptor table
  - Cheap to create (~10 μs vs ~1 ms for fork())
  - Communication via shared memory (direct variable access)
  - No fault isolation: one thread's bad pointer can corrupt all threads
```

Each thread has its own:
- **Stack** (local variables, function call frames)
- **Register state** (PC, stack pointer, general-purpose registers)
- **Thread-local storage (TLS)** (optional, per-thread global-like variables)

Each thread SHARES:
- **Heap** (all malloc'd memory)
- **Global and static variables**
- **Open files and sockets**
- **Code (text segment)**

---

## The Race Condition: Why `counter++` Fails

```java
// Two threads, one shared counter
int counter = 0;

// Thread 1 and Thread 2 both run:
for (int i = 0; i < 1000000; i++) {
    counter++;   // looks atomic, IS NOT
}

// Expected: counter == 2000000
// Actual: anywhere from 1000001 to 2000000 (unpredictable)
```

`counter++` in machine code is THREE operations:
```asm
mov eax, [counter]   ; 1. LOAD: read counter from memory into register
add eax, 1           ; 2. INCREMENT: add 1 in register
mov [counter], eax   ; 3. STORE: write back to memory
```

With two threads and no synchronization, the CPU can interleave these:
```
Thread 1: LOAD counter (reads 100)
Thread 2: LOAD counter (reads 100)    ← T2 reads BEFORE T1 wrote back
Thread 1: ADD → 101
Thread 2: ADD → 101
Thread 1: STORE 101
Thread 2: STORE 101   ← LOST UPDATE: counter should be 102, is 101!
```

This is a **race condition** — the outcome depends on the timing of thread execution, which is nondeterministic.

**The key insight:** Any operation that requires reading a value, transforming it, and writing it back is NOT atomic unless you explicitly make it so.

---

## Mutual Exclusion: The Mutex

A **mutex** (mutual exclusion lock) ensures only one thread executes a **critical section** at a time.

```java
// Java
import java.util.concurrent.locks.ReentrantLock;

int counter = 0;
ReentrantLock lock = new ReentrantLock();

// Thread 1 and Thread 2:
for (int i = 0; i < 1000000; i++) {
    lock.lock();
    try {
        counter++;   // now protected — only one thread at a time
    } finally {
        lock.unlock();
    }
}
// counter == 2000000 guaranteed
```

### What a Mutex Does Internally

A mutex is a state variable: `UNLOCKED (0)` or `LOCKED (1)`.

**Naive (broken) implementation:**
```c
// WRONG: same race condition!
void lock(mutex_t* m) {
    while (m->state == LOCKED) { /* spin */ }
    m->state = LOCKED;   // TOCTOU race: two threads can both pass the while check
}
```

**Correct: needs hardware atomic operation**

```asm
; x86: Compare-And-Swap (CAS) / LOCK CMPXCHG
; Atomically: if *mutex == 0, set *mutex = 1 and return 0. Else return 1.
lock cmpxchg [mutex], 1   ; LOCK prefix = bus lock, entire op is indivisible
```

The `LOCK` prefix guarantees the read-modify-write is **atomic at the hardware level** — the CPU locks the cache line so no other CPU can touch it between the read and the write.

```c
// Correct spinlock using CAS:
void spinlock_lock(atomic_int* m) {
    int expected = 0;
    // Keep trying until we successfully change 0 → 1
    while (!atomic_compare_exchange_strong(m, &expected, 1)) {
        expected = 0;   // reset for next attempt
        // spin (burn CPU) or call sched_yield()
    }
}

void spinlock_unlock(atomic_int* m) {
    atomic_store(m, 0);   // atomic write, releases lock
}
```

**Spinning vs blocking:** A spinlock burns CPU cycles waiting. For short critical sections (< a few microseconds), spinning is faster than sleeping (which requires OS context switch). For long waits, use a blocking mutex (`pthread_mutex_t`, `java.util.concurrent.locks.ReentrantLock`) that suspends the waiting thread and wakes it when the lock is released.

---

## Java's synchronized

`synchronized` in Java is a monitor — a mutex built into every Java object.

```java
class Counter {
    private int count = 0;
    
    // Only one thread can execute this at a time
    public synchronized void increment() {
        count++;
    }
    
    public synchronized int get() {
        return count;
    }
}
```

Equivalent with explicit locking:
```java
class Counter {
    private int count = 0;
    private final Object lock = new Object();
    
    public void increment() {
        synchronized(lock) { count++; }
    }
}
```

**Java memory model guarantee:** After releasing a lock, all writes made while holding the lock are visible to the next thread that acquires the same lock. Without this guarantee, CPU caches could make writes invisible to other cores.

---

## The Happens-Before Relation

Modern CPUs reorder memory operations for performance. Without synchronization, writes by one thread may not be visible to another.

```java
// Thread 1:
data = 42;      // (1)
ready = true;   // (2)

// Thread 2:
while (!ready);  // (3) wait for ready
print(data);     // (4) expects 42
```

The CPU or compiler might reorder (1) and (2) in Thread 1. Thread 2 sees `ready=true` but reads `data=0`.

**Happens-before:** A write to variable X **happens-before** a read of X if there's a chain of synchronization actions connecting them. `synchronized` / lock release establishes happens-before with the subsequent lock acquire.

**`volatile` keyword (Java):** Forces reads/writes to go through main memory (no caching in registers). Establishes happens-before for single variable accesses. NOT sufficient for compound operations like `counter++`.

---

## Deadlock: The Four Conditions

**Deadlock:** Two or more threads each hold a resource and wait for a resource held by the other. Neither can proceed.

```java
// Thread 1:
synchronized(lockA) {
    synchronized(lockB) { ... }   // holds A, waits for B
}

// Thread 2:
synchronized(lockB) {
    synchronized(lockA) { ... }   // holds B, waits for A
}
// DEADLOCK: T1 has A waiting for B. T2 has B waiting for A.
```

**The four necessary conditions (Coffman, 1971):**
1. **Mutual exclusion:** Resources are non-shareable (only one thread at a time).
2. **Hold and wait:** A thread holds a resource while waiting for another.
3. **No preemption:** Resources can't be forcibly taken from a thread.
4. **Circular wait:** A cycle of threads, each waiting for the next.

**Prevention — break any one condition:**
- **Consistent lock ordering:** Always acquire locks in the same order (A before B, everywhere). Breaks circular wait.
- **Try-lock with timeout:** `tryLock(100ms)` — if can't acquire, release held locks and retry. Breaks hold-and-wait.
- **Lock all or nothing:** Use `tryLock` on all needed locks simultaneously. Release all if any fails.

```java
// Prevention: consistent lock ordering
static void transfer(Account from, Account to, int amount) {
    // Always lock lower-ID account first
    Account first  = from.id < to.id ? from : to;
    Account second = from.id < to.id ? to   : from;
    
    synchronized(first) {
        synchronized(second) {
            from.balance -= amount;
            to.balance   += amount;
        }
    }
}
```

---

## Lock-Free Programming: Atomic Operations

For simple shared counters, using a mutex is overkill. **Atomic operations** let you avoid locks entirely for specific patterns.

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger counter = new AtomicInteger(0);

// Thread 1 and Thread 2:
for (int i = 0; i < 1000000; i++) {
    counter.incrementAndGet();   // atomic read-modify-write, no mutex
}
// counter == 2000000, no mutex contention
```

**How `incrementAndGet()` works:**
```java
// Spin CAS loop (actual JDK implementation):
public int incrementAndGet() {
    int expected, updated;
    do {
        expected = value;         // read current value
        updated  = expected + 1;  // compute new value
    } while (!compareAndSet(expected, updated));
    // compareAndSet: atomically check if value == expected, if so set to updated
    // Returns false if another thread changed value between our read and CAS
    // Loop retries — ABA problem is handled separately
    return updated;
}
```

**When to use atomics vs mutexes:**
- Atomics: single-variable operations (counter, flag, reference). Very fast.
- Mutexes: multiple variables that must be updated consistently, or long critical sections.

---

## Condition Variables: Waiting for State

A condition variable lets a thread **wait for a condition** without busy-spinning.

```java
// Producer-Consumer with BlockingQueue
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);

// Producer thread:
while (true) {
    Task t = generateTask();
    queue.put(t);   // blocks if queue is full (waits for consumer)
}

// Consumer thread:
while (true) {
    Task t = queue.take();   // blocks if queue is empty (waits for producer)
    process(t);
}
```

`BlockingQueue` internally uses `ReentrantLock` + `Condition`:
```java
// Simplified LinkedBlockingQueue internals:
lock.lock();
try {
    while (queue.isEmpty()) {
        notEmpty.await();   // releases lock, suspends thread, waits for signal
    }
    Task t = queue.poll();
    notFull.signal();       // wake a producer waiting for space
    return t;
} finally {
    lock.unlock();
}
```

**The pattern:**
1. Acquire lock.
2. `while (!condition) await()` — always `while`, not `if`, to handle spurious wakeups.
3. Do work.
4. `signal()` / `signalAll()` when condition changes.
5. Release lock.

---

## Common Concurrency Patterns

### Thread Pool (Java ExecutorService)

Creating a thread per task is expensive (~10 μs). Thread pools reuse threads:

```java
ExecutorService pool = Executors.newFixedThreadPool(8);  // 8 worker threads

for (Task t : tasks) {
    pool.submit(() -> {
        process(t);   // runs on one of the 8 threads
    });
}

pool.shutdown();
pool.awaitTermination(60, TimeUnit.SECONDS);
```

### Fork-Join (Java ForkJoinPool, parallel streams)

For divide-and-conquer problems: split work recursively, join results.

```java
class SumTask extends RecursiveTask<Long> {
    int[] arr; int lo, hi;
    
    protected Long compute() {
        if (hi - lo <= 1000) {
            return sequentialSum(arr, lo, hi);   // base case
        }
        int mid = (lo + hi) / 2;
        SumTask left  = new SumTask(arr, lo, mid);
        SumTask right = new SumTask(arr, mid, hi);
        left.fork();                    // run left subtask asynchronously
        return right.compute() + left.join();  // run right here, wait for left
    }
}
```

### Read-Write Lock

Many readers, few writers — allow concurrent reads, exclusive writes:

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Reader (many can run simultaneously):
rwLock.readLock().lock();
try { return data.get(key); }
finally { rwLock.readLock().unlock(); }

// Writer (exclusive):
rwLock.writeLock().lock();
try { data.put(key, value); }
finally { rwLock.writeLock().unlock(); }
```

---

## Section Challenge

> ### Race Condition and Deadlock Analysis
>
> ```java
> class BankAccount {
>     private double balance;
>     private final String id;
>
>     BankAccount(String id, double initial) {
>         this.id = id;
>         this.balance = initial;
>     }
>
>     // Transfer money from this account to another
>     synchronized void transferTo(BankAccount other, double amount) {
>         if (balance >= amount) {
>             balance -= amount;
>             other.balance += amount;  // ← directly modifies other.balance
>         }
>     }
>
>     synchronized double getBalance() { return balance; }
> }
>
> BankAccount alice = new BankAccount("A", 1000);
> BankAccount bob   = new BankAccount("B", 1000);
>
> // Thread 1:
> alice.transferTo(bob, 100);
>
> // Thread 2 (runs concurrently):
> bob.transferTo(alice, 200);
> ```
>
> **Q1:** Identify the deadlock scenario. Which locks does each thread hold and which does it wait for?
>
> **Q2:** Is `other.balance += amount` safe inside `synchronized void transferTo`? What lock does Thread 1 hold when it executes that line? Is `other`'s lock held?
>
> **Q3:** After fixing the deadlock (consistent lock ordering), is the balance invariant (alice.balance + bob.balance == 2000) guaranteed? Why or why not?
>
> **Q4:** Rewrite `transferTo` to be deadlock-free using consistent lock ordering. Show the full method.
>
> **Q5 (Stretch):** A third thread continuously calls `alice.getBalance() + bob.getBalance()`. Even after your fix in Q4, can this thread see an intermediate state where alice.balance + bob.balance != 2000 during a transfer? Explain. How would you fix it?

<details>
<summary>Full answers</summary>

```
Q1: Deadlock scenario

transferTo is synchronized on `this` (the calling object).

Thread 1 calls alice.transferTo(bob, 100):
  Acquires lock on alice (this = alice).
  Inside method: calls other.balance += amount (other = bob).
  BUT other.balance += amount accesses bob's field WITHOUT locking bob!
  
Wait — let's look more carefully. The problem with synchronized:
  Thread 1: alice.transferTo(bob, 100)
    → acquires alice's lock
    → executes: balance -= amount  (alice's balance, locked)
    → executes: other.balance += amount  (this accesses bob's field DIRECTLY
       without acquiring bob's lock — this is a data race on bob.balance!)

Thread 2: bob.transferTo(alice, 200)
    → acquires bob's lock
    → executes: balance -= amount  (bob's balance, locked)
    → executes: other.balance += amount  (accesses alice's field DIRECTLY
       without acquiring alice's lock — data race on alice.balance!)

So the actual problem is:
  Thread 1 holds alice lock, writes bob.balance without bob's lock.
  Thread 2 holds bob lock, writes alice.balance without alice's lock.
  This is a DATA RACE (not deadlock), since they don't each try to acquire
  the other's lock.

DEADLOCK would occur if transferTo acquired BOTH locks:
  Thread 1: locked alice, WAITING for bob's lock
  Thread 2: locked bob,   WAITING for alice's lock
  → circular wait → deadlock.

──────────────────────────────────────────────────────

Q2: Is other.balance += amount safe?

Thread 1 holds: lock on alice (this = alice).
Lock on bob: NOT held.

synchronized void transferTo(BankAccount other, ...) is synchronized on `this`
(alice). It does NOT acquire the lock on `other` (bob).

When Thread 1 executes other.balance += amount, it reads and writes bob.balance
WITHOUT holding bob's lock. Thread 2 may simultaneously modify bob.balance
(after acquiring bob's lock). This is a DATA RACE on bob.balance.

A data race on a field is undefined behavior in Java's memory model:
  - Writes from one thread may not be visible to other threads.
  - Reads may return stale cached values.
  - The balance can go negative or have impossible values.

The double += operation itself is also not atomic (load-add-store).

──────────────────────────────────────────────────────

Q3: Balance invariant after consistent lock ordering

With consistent lock ordering (both threads acquire alice's lock before bob's):
  Thread 1: acquire alice_lock, acquire bob_lock → decrement alice, increment bob
  Thread 2: acquire alice_lock (blocks — Thread 1 has it) → waits
  
  Thread 1 completes: alice -= 100, bob += 100. Total unchanged.
  Thread 2 runs: alice += 200, bob -= 200. Total unchanged.

YES, the invariant alice.balance + bob.balance == 2000 IS maintained with 
correct locking, because only one transfer can be in progress at a time.

──────────────────────────────────────────────────────

Q4: Deadlock-free transferTo with consistent lock ordering

void transferTo(BankAccount other, double amount) {
    // Determine lock order: always lock lower-id account first
    BankAccount first  = this.id.compareTo(other.id) < 0 ? this  : other;
    BankAccount second = this.id.compareTo(other.id) < 0 ? other : this;
    
    synchronized(first) {
        synchronized(second) {
            if (this.balance >= amount) {
                this.balance  -= amount;
                other.balance += amount;
            }
        }
    }
}

Why this works:
  Thread 1 (alice → bob): id("A") < id("B") → locks alice first, then bob.
  Thread 2 (bob → alice): id("B") > id("A") → locks alice first, then bob.
  BOTH threads try to acquire alice first.
  One wins, executes completely, releases both. Other proceeds.
  No circular wait → no deadlock.

Note: removed `synchronized` from the method signature (lock is now explicit).

──────────────────────────────────────────────────────

Q5: Observing intermediate state

Thread 3 calls: alice.getBalance() + bob.getBalance()

getBalance() acquires the lock on its OWN object and releases it.
  alice.getBalance() acquires alice's lock, reads alice.balance, releases alice's lock.
  THEN: bob.getBalance() acquires bob's lock, reads bob.balance, releases bob's lock.

These are two SEPARATE lock acquisitions with a gap between them.

Scenario:
  Thread 3: alice.getBalance() → reads alice=900 (after Thread 1 decremented)
  [Thread 3 releases alice's lock]
  Thread 1: not yet added to bob (between the two synchronized blocks)
    — actually in our Q4 fix, both operations are under a single synchronized block,
    so this specific interleaving can't happen.
    
With Q4's fix (single nested lock holding both during the transfer):
  While Thread 1 holds BOTH alice and bob locks during the transfer,
  Thread 3's alice.getBalance() will BLOCK (can't acquire alice's lock).
  Thread 3 can only read AFTER Thread 1 finishes the complete transfer.
  
  However: Thread 3 reads alice.getBalance() (acquires+releases alice),
  then reads bob.getBalance() (acquires+releases bob) as SEPARATE operations.
  Between these two reads, another transfer could complete!
  
  Thread 3 sees: alice=900 (after T1's transfer), bob=1100 (after T1) = 2000. ✓
  But also possible:
    Thread 3: reads alice=900 (T1 just transferred out)
    [context switch: Thread 2 transfers 200 back: alice=1100, bob=900]
    Thread 3: reads bob=900 (T2 just transferred)
    Thread 3: sum = 900 + 900 = 1800 ← WRONG!

To observe a consistent snapshot of BOTH balances:
  Thread 3 must hold BOTH locks simultaneously while reading.
  
double getTotalBalance(BankAccount a, BankAccount b) {
    BankAccount first  = a.id.compareTo(b.id) < 0 ? a : b;
    BankAccount second = a.id.compareTo(b.id) < 0 ? b : a;
    synchronized(first) {
        synchronized(second) {
            return a.balance + b.balance;  // atomic read of both
        }
    }
}
```

</details>

---

## Common Mistakes

**Mistake 1: Using `if` instead of `while` with condition variables**
```java
// WRONG:
if (queue.isEmpty()) condition.await();
// After wakeup, queue might be empty again (spurious wakeup, or another thread
// consumed the item between signal and this thread running).

// CORRECT:
while (queue.isEmpty()) condition.await();
```

**Mistake 2: Thinking `volatile` makes compound operations safe**
```java
volatile int counter = 0;
counter++;   // STILL NOT ATOMIC. volatile only guarantees visibility, not atomicity.
// Use AtomicInteger.incrementAndGet() instead.
```

**Mistake 3: Holding locks across I/O or long operations**
```java
synchronized(lock) {
    result = database.query("SELECT ...");  // BLOCKS for 100ms holding the lock!
    // Every other thread needing this lock waits 100ms.
}
// Fix: do I/O outside the lock, only lock for the update step.
```

**Mistake 4: Creating a new thread per task**
```java
// SLOW: ~10μs to create each thread
for (Task t : tasks) {
    new Thread(() -> process(t)).start();
}
// Use ExecutorService thread pool instead.
```

---

## Connections

- **Chapter 06 — Cache:** False sharing (two threads on the same cache line) causes invisible serialization. Multi-threaded programs must consider cache line alignment for hot shared variables.
- **Chapter 08 — Processes:** Threads share address space; processes don't. Thread creation is cheap because no page table copy is needed. `pthread_create()` on Linux creates a new task sharing the parent's mm_struct.
- **Chapter 09 — Virtual Memory:** All threads in a process share one virtual address space. Thread-local storage (TLS) uses a separate segment per thread, mapped into the shared address space.
- **Chapter 12 — I/O:** Async I/O (epoll) and thread pools are competing models for concurrent I/O. Modern frameworks (Java NIO, Netty, Go goroutines) combine both: thread pool for CPU work, event loop for I/O waiting.

---

> [← 10 Dynamic Memory & the Heap](10_Dynamic_Memory_Heap.md) | [Course Index](README.md) | [Next → 12 I/O, Files & the Unix Philosophy](12_IO_Files_Unix_Philosophy.md)
