# 19b. Java Concurrency × System Design — Threads as Distributed Systems

**Navigation**: [← Permutations & Combinations](19_DSA_Permutations_Combinations_Interview_Math.md) | [📚 Index](00_INDEX.md) | [DSA: Bitwise Trie →](20_Bitwise_Trie_Interview_Guide.md)

**Cross-links:**
- [`07_Modern_Java/`](../07_Modern_Java/) — Modern Java chapters
- [`20_Interview_Mastery/06_System_Design_Blueprint.md`](06_System_Design_Blueprint.md) — System design interview blueprint
- [`20_Interview_Mastery/12_SpringBoot_Plus_DSA_Progressive.md`](12_SpringBoot_Plus_DSA_Progressive.md) — Spring Boot × DSA
- [`PATH_JAVA_BACKEND.md`](../PATH_JAVA_BACKEND.md) — Java backend path

---

> **Reading contract**: A single JVM with multiple threads IS a distributed system — just one where nodes share memory instead of a network. Every distributed systems problem (races, locks, visibility, consensus, back-pressure) exists inside the JVM first. Understanding Java concurrency means understanding the building blocks of every distributed pattern.

---

## Table of Contents

1. [synchronized / ReentrantLock → Distributed Locks](#1-synchronized--reentrantlock--distributed-locks)
2. [volatile / happens-before → Distributed Visibility and Ordering](#2-volatile--happens-before--distributed-visibility-and-ordering)
3. [AtomicInteger / CAS → Optimistic Locking in Databases](#3-atomicinteger--cas--optimistic-locking-in-databases)
4. [ThreadLocal → Request-Scoped Context in Microservices](#4-threadlocal--request-scoped-context-in-microservices)
5. [ExecutorService / Thread Pools → Bulkhead Pattern](#5-executorservice--thread-pools--bulkhead-pattern)
6. [BlockingQueue → Message Queues and Back-Pressure](#6-blockingqueue--message-queues-and-back-pressure)
7. [ReentrantReadWriteLock → Read Replicas](#7-reentrantreadwritelock--read-replicas)
8. [CompletableFuture → Scatter-Gather and Fan-Out](#8-completablefuture--scatter-gather-and-fan-out)

---

## 1. synchronized / ReentrantLock → Distributed Locks

### 🧠 Foundation — What a Lock Actually Is

A **lock** is a mutual exclusion guarantee: at most one thread (or node) can hold the lock and enter the critical section at a time. The concept is identical whether the competing threads are in one JVM or across 100 servers.

```
Single JVM (Java synchronized):
  Thread A ─── synchronized(mutex) ──→ holds lock, enters critical section
  Thread B ─── synchronized(mutex) ──→ BLOCKS until A releases

Distributed System (Redis SETNX):
  Node A ─── SETNX lock_key "node_a" ──→ returns 1 (got it), enters critical section
  Node B ─── SETNX lock_key "node_b" ──→ returns 0 (taken), waits + retries
```

### Java Lock Implementations

```java
// Intrinsic lock (monitor) — built into every Object
public class Counter {
    private int count = 0;

    public synchronized void increment() {  // ← only one thread at a time
        count++;  // critical section
    }

    public synchronized int get() {
        return count;
    }
}

// ReentrantLock — explicit, more control
import java.util.concurrent.locks.ReentrantLock;

public class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();           // explicit acquire
        try {
            count++;
        } finally {
            lock.unlock();     // MUST release in finally — or deadlock
        }
    }

    // ReentrantLock extras not available with synchronized:
    public boolean tryIncrement() {
        if (lock.tryLock()) {  // non-blocking attempt
            try { count++; return true; }
            finally { lock.unlock(); }
        }
        return false;          // couldn't get lock, don't block
    }
}
```

### The Distributed Lock (Redis Redlock)

```java
// Distributed equivalent — Redis SETNX with TTL (prevents permanent lock)
// Using Redisson library:
RLock lock = redisson.getLock("account_balance_lock_" + accountId);
lock.lock(30, TimeUnit.SECONDS); // auto-expires after 30s — like a watchdog
try {
    // Only one instance across the cluster enters here
    Account account = accountRepo.findById(accountId);
    account.debit(amount);
    accountRepo.save(account);
} finally {
    lock.unlock();
}
```

### 💥 War Story — The Double-Charge Bug From a Non-Atomic Check-Then-Act

A payment service had this code:

```java
public boolean chargeCard(String userId, BigDecimal amount) {
    if (userBalance.get(userId).compareTo(amount) >= 0) { // CHECK
        userBalance.put(userId, userBalance.get(userId).subtract(amount)); // ACT
        return true;
    }
    return false;
}
```

Thread A and Thread B both called `chargeCard("user123", 100)` concurrently. Thread A checked the balance (200), context-switched. Thread B checked the balance (still 200, A hadn't subtracted yet), also got `true`. Both charged. Balance went to 0 twice — user was double-charged.

The **check-then-act** pattern is never safe without holding a lock across both steps:

```java
// ✅ Lock covers both check AND act
public synchronized boolean chargeCard(String userId, BigDecimal amount) {
    BigDecimal balance = userBalance.get(userId);
    if (balance.compareTo(amount) < 0) return false;
    userBalance.put(userId, balance.subtract(amount)); // atomic under lock
    return true;
}
```

In distributed systems this is exactly the **distributed transaction** problem. The solution is the same: hold the lock from check to completion.

---

### 📝 Practice Challenges

1. `synchronized` and `ReentrantLock` are both reentrant — the same thread can acquire the same lock multiple times. Why is reentrancy important? What breaks if a lock isn't reentrant?
2. Redis Redlock uses locks on 3+ independent Redis nodes with majority quorum. Why does using a single Redis node fail for distributed locking? (Hint: single point of failure)
3. A distributed lock with a 30-second TTL expires while the holder is still in the critical section (GC pause, slow DB). What happens? What pattern addresses this? (Hint: fencing token)

---

## 2. volatile / happens-before → Distributed Visibility and Ordering

### 🧠 Foundation — The CPU Cache Problem at Two Scales

Modern CPUs have L1/L2 caches per core. Thread A writes to `flag = true` — the write might stay in A's core's cache and not be visible to Thread B running on a different core. This is the **visibility problem**.

`volatile` solves it for single variables: writes are flushed to main memory immediately; reads always go to main memory.

```java
// ❌ Without volatile — Thread B may never see Thread A's write
class Shutdown {
    private boolean stop = false;  // cached per-CPU
    
    public void shutdown() { stop = true; }           // Thread A
    public void run() { while (!stop) { work(); } }   // Thread B may loop forever
}

// ✅ With volatile — writes flush to main memory, reads bypass cache
class Shutdown {
    private volatile boolean stop = false;
    
    public void shutdown() { stop = true; }  // immediately visible to all threads
    public void run() { while (!stop) { work(); } }  // always reads from main memory
}
```

### The happens-before Relationship

Java Memory Model guarantees: if action A **happens-before** action B, then B sees all writes from A.

Happens-before rules:
- A `synchronized` block's actions happen-before actions in a subsequent `synchronized` block on the same monitor
- A `volatile` write happens-before all subsequent reads of that variable
- Thread start (`.start()`) happens-before any action in the new thread
- Thread completion happens-before `join()` returns

### The Distributed Equivalent — Causality and Vector Clocks

```
JVM happens-before:
  Thread A: write x=1 (volatile) → Thread B: read x → guaranteed sees 1

Distributed system (Kafka):
  Producer: write message (offset 42) → Consumer: read offset 42 → guaranteed sees it
  
  But two consumers in different consumer groups may see messages in different order
  → Distributed equivalent of cache coherency problem
  → Solution: vector clocks, Lamport timestamps, or single partition per ordered stream
```

### 💥 War Story — The Singleton That Was Initialized Twice

A team used the classic lazy singleton without `volatile`:

```java
// ❌ Double-checked locking without volatile — broken in Java 5+
class Config {
    private static Config instance;
    
    public static Config getInstance() {
        if (instance == null) {           // check 1 — no lock
            synchronized (Config.class) {
                if (instance == null) {   // check 2 — under lock
                    instance = new Config();  // NOT atomic!
                }
            }
        }
        return instance;
    }
}
// Problem: `instance = new Config()` compiles to 3 steps:
//   1. allocate memory
//   2. initialize fields
//   3. assign reference to `instance`
// The JVM/CPU can reorder 2 and 3. Thread B may see a non-null `instance`
// pointing to uninitialized memory (step 3 done, step 2 not yet).
```

Fix: `volatile` prevents the reordering:

```java
// ✅ volatile ensures happens-before from write to all subsequent reads
class Config {
    private static volatile Config instance;
    
    public static Config getInstance() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) {
                    instance = new Config(); // now: 1→2→3 ordering is guaranteed
                }
            }
        }
        return instance;
    }
}

// Modern Java: even simpler — use an enum (class loading is thread-safe)
enum Config {
    INSTANCE;
    // initialized by class loader — JVM guarantees this is thread-safe
}
```

---

### 📝 Practice Challenges

1. `volatile` guarantees visibility but NOT atomicity. What does this mean? Give an example where `volatile int counter` is still broken under concurrent increments.
2. Kafka guarantees ordering within a partition. How does this relate to the happens-before guarantee? What's the equivalent of "multiple partitions with no ordering guarantee"?
3. Describe the Java Memory Model's happens-before in terms of a distributed system's "causal consistency" guarantee.

---

## 3. AtomicInteger / CAS → Optimistic Locking in Databases

### 🧠 Foundation — Lock-Free Updates

Compare-And-Swap (CAS) is a hardware instruction: "if the value at this address is still X, change it to Y; otherwise fail." It's atomic without a lock.

```java
AtomicInteger counter = new AtomicInteger(0);

// Thread A and Thread B both try to increment:
// Thread A: reads 0, tries CAS(0, 1) → succeeds (value was 0, now 1)
// Thread B: reads 0, tries CAS(0, 1) → fails (value is now 1, not 0)
//           Thread B retries: reads 1, tries CAS(1, 2) → succeeds

counter.incrementAndGet();  // ← lock-free, uses CAS loop internally

// Manual CAS loop:
int oldVal, newVal;
do {
    oldVal = counter.get();
    newVal = oldVal + 1;
} while (!counter.compareAndSet(oldVal, newVal));
// Retries until no concurrent modification — O(1) on average, no lock needed
```

### Database Optimistic Locking — Same Pattern

```java
// JPA @Version — adds a version column, uses CAS at the DB level
@Entity
public class BankAccount {
    @Id Long id;
    BigDecimal balance;
    
    @Version
    Long version;  // ← Hibernate increments this on every UPDATE
}

// Repository code:
BankAccount account = repo.findById(id); // reads version=5
account.setBalance(account.getBalance().subtract(100));
repo.save(account);
// Hibernate executes:
//   UPDATE bank_account SET balance=900, version=6
//   WHERE id=? AND version=5  ← CAS: "only update if version is still 5"
// If another transaction updated it first, version=5 is stale → 0 rows updated
// Hibernate throws OptimisticLockException → caller retries
```

### When to Use CAS vs Pessimistic Locking

| Scenario | Use | Why |
|----------|-----|-----|
| Low contention (reads >> writes) | Optimistic / CAS | No lock overhead in the common case |
| High contention (many concurrent writers) | Pessimistic / synchronized | CAS retries burn CPU; lock-then-proceed is more efficient |
| Can't retry (payment, irreversible) | Pessimistic | CAS retry logic is complex to get right |
| Distributed (Redis, DB) | Optimistic + version | Distributed locks add latency; optimistic is often faster |

---

### 💥 War Story — The ABA Problem in a Custom Lock-Free Queue

A team implemented a lock-free queue using CAS. A node dequeued, processed, and reallocated to the same memory address — the CAS saw the same pointer value and assumed nothing changed (it had changed twice: A→B→A). Their queue silently dropped every 3rd item under high load.

```java
// ABA problem: CAS on a pointer value doesn't detect A→B→A transitions
// Node at address 0x100: value "A" → dequeued, reused, value "B" → freed, reallocated with "A"
// CAS sees address 0x100, value "A" — passes! But the object is different.

// Fix: AtomicStampedReference — carry a version stamp alongside the reference
AtomicStampedReference<Node> head = new AtomicStampedReference<>(initialNode, 0);

int[] stamp = new int[1];
Node current = head.get(stamp);          // get value AND stamp atomically
head.compareAndSet(current, newHead, stamp[0], stamp[0] + 1);
// CAS now checks BOTH the reference AND the stamp — ABA safely detected
```

In distributed systems, this is why Redis Redlock uses a **fencing token** (monotonically increasing number) rather than just checking if the key exists. The token detects if a lock was released and re-acquired between a client's check and its act.

---

### 📝 Practice Challenges

1. `AtomicInteger.incrementAndGet()` uses a CAS loop internally. Under extreme contention (1,000 threads all incrementing), what happens? Why is `LongAdder` better for high-contention counters?
2. Implement `AtomicStack.push(T item)` using `AtomicReference` and CAS. What prevents the ABA problem in your implementation?
3. Database `@Version` optimistic locking throws `OptimisticLockException` on conflict. Write a Spring retry wrapper using `@Retryable` that retries up to 3 times on that exception.

---

## 4. ThreadLocal → Request-Scoped Context in Microservices

### 🧠 Foundation — Per-Thread State Without Parameters

`ThreadLocal<T>` gives each thread its own independent copy of a variable. One thread's write is invisible to all other threads.

```java
// Without ThreadLocal — must thread context through every method signature:
void processRequest(Request req, User currentUser) {
    validate(req, currentUser);
    service.call(req, currentUser);
    audit.log(req, currentUser);
}

// With ThreadLocal — context travels with the thread, not the call stack:
public class RequestContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();
    
    public static void set(User user) { currentUser.set(user); }
    public static User get()          { return currentUser.get(); }
    public static void clear()        { currentUser.remove(); } // ← critical!
}

// Servlet filter sets it once:
currentUser.set(authenticatedUser);
try {
    chain.doFilter(request, response); // whole request pipeline can access it
} finally {
    RequestContext.clear(); // ← MUST clear — thread is returned to pool!
}

// Deep in the call stack — no parameter needed:
void auditLog(String action) {
    User u = RequestContext.get(); // reads THIS thread's user, not another thread's
    log.info("User {} performed {}", u.id(), action);
}
```

### The Distributed Equivalent — Correlation IDs and Baggage

In a microservices system, "the current request" spans multiple services across multiple JVMs. `ThreadLocal` doesn't work across network calls — the downstream service runs on a different thread (and different machine).

```
Solution: propagate context via HTTP headers

Service A (Thread T1):
  ThreadLocal: { correlationId: "req-abc123", userId: "user-42" }
  HTTP call to Service B → add headers: X-Correlation-ID: req-abc123, X-User-ID: user-42

Service B (Thread T2, different JVM):
  Reads headers → sets its own ThreadLocal: { correlationId: "req-abc123", userId: "user-42" }
  Logs include correlationId → logs from A and B are joinable in Splunk/Datadog
```

```java
// Spring Boot: MDC (Mapped Diagnostic Context) is ThreadLocal for logging
import org.slf4j.MDC;

// In a filter:
MDC.put("correlationId", request.getHeader("X-Correlation-ID"));
MDC.put("userId", request.getHeader("X-User-ID"));
try {
    chain.doFilter(request, response);
} finally {
    MDC.clear(); // ← thread pool requires explicit cleanup
}

// In any downstream log call (no parameter needed):
log.info("Processing order"); 
// → logs: [req-abc123][user-42] Processing order
// Correlation ID in every log line from this thread during this request
```

### 💥 War Story — ThreadLocal Memory Leak in Application Server

A team used `ThreadLocal<Connection>` to cache database connections per thread. When the app was deployed to Tomcat (which reuses threads via a thread pool), `ThreadLocal` values set during one request persisted into the next request on the same thread. After 8 hours of load, memory grew monotonically and the server OOM-crashed.

Root cause: Tomcat reuses threads. If `ThreadLocal.remove()` is never called, the value (and the reference chain: ThreadLocal → Thread → Connection → ClassLoader) leaks indefinitely. In webapp reloads, this famously prevents garbage collection of the entire old ClassLoader.

```java
// ❌ ThreadLocal without cleanup — leaks on thread reuse
ThreadLocal<ExpensiveResource> resource = new ThreadLocal<>();

void handleRequest() {
    resource.set(new ExpensiveResource());
    process();
    // resource never removed — thread pool returns thread, value persists
}

// ✅ Always clear ThreadLocal in a try-finally
void handleRequest() {
    resource.set(new ExpensiveResource());
    try {
        process();
    } finally {
        resource.remove(); // ← no matter what, clean up
    }
}
```

---

### 📝 Practice Challenges

1. Spring's `@RequestScope` beans use `ThreadLocal` internally. What happens if a `@RequestScope` bean is injected into a `@Singleton`? What does Spring do to handle this safely?
2. Virtual threads (Java 21 Project Loom) can be millions per JVM. Why does `ThreadLocal` become a memory problem with virtual threads? What's the Loom-friendly alternative?
3. Implement a `CorrelationIdFilter` that reads `X-Correlation-ID` from the request, sets it in `MDC`, passes it to downstream `RestTemplate` calls via an interceptor, and clears it after the response.

---

## 5. ExecutorService / Thread Pools → Bulkhead Pattern

### 🧠 Foundation — Bounded Resource Pools

A thread pool limits how many tasks run concurrently. Without a bound, a spike of requests creates unbounded threads → memory exhaustion → JVM crash.

```java
// Fixed thread pool — at most 10 concurrent tasks
ExecutorService pool = Executors.newFixedThreadPool(10);

// Work queue fills when all 10 threads are busy:
// - bounded queue: rejects new work when queue is full (back-pressure)
// - unbounded queue: queues grow indefinitely → OOM

// Explicit bounded queue:
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    10,                               // corePoolSize
    10,                               // maxPoolSize
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(100),    // ← bounded queue, at most 100 pending tasks
    new ThreadPoolExecutor.CallerRunsPolicy() // ← rejection: caller's thread runs the task
);
```

### The Bulkhead Pattern — One Pool Per Service Dependency

In Resilience4j / Hystrix, the Bulkhead pattern isolates thread pools so that one slow dependency doesn't exhaust all threads:

```java
// ❌ All calls share one pool — slow DB starves all other work
@RestController
class ApiController {
    ExecutorService sharedPool = Executors.newFixedThreadPool(50);
    
    // If paymentService is slow, all 50 threads pile up waiting for payment
    // → zero threads left for userService, inventoryService
}

// ✅ Bulkhead: separate thread pools per downstream dependency
@Configuration
class BulkheadConfig {
    @Bean ExecutorService paymentPool() { return Executors.newFixedThreadPool(10); }
    @Bean ExecutorService userPool()    { return Executors.newFixedThreadPool(10); }
    @Bean ExecutorService inventoryPool(){ return Executors.newFixedThreadPool(10); }
}
// Slow payment service saturates paymentPool → user + inventory still work
```

```java
// Resilience4j Bulkhead annotation:
@Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL)
@TimeLimiter(name = "paymentService")
public CompletableFuture<PaymentResult> charge(Order order) {
    return CompletableFuture.supplyAsync(
        () -> paymentService.charge(order),
        paymentPool
    );
}
```

### Thread Pool Sizing Formula

```
CPU-bound tasks:     pool_size = CPU_cores + 1
                     (extra thread for GC/OS preemption)

IO-bound tasks:      pool_size = CPU_cores × (1 + wait_time / compute_time)
                     e.g., 90% wait: 8 cores × (1 + 9) = 80 threads

Mixed workload:      profile first; start at CPU × 2, measure queue depth
                     If avg_queue_depth > 0 and CPU < 70% → add threads
                     If CPU > 90% → more threads won't help (CPU-bound)
```

### 💥 War Story — The Thread Pool That Deadlocked Itself

A team submitted tasks to a single thread pool. Each task submitted a subtask to the same pool and waited for it (`future.get()`). Under normal load (< 10 tasks), this worked. Under peak (20+ tasks), all 10 pool threads blocked waiting for subtasks — but the subtasks were sitting in the queue with no threads left to run them. The pool deadlocked itself.

```java
// ❌ Nested task submission to the same pool → deadlock under load
ExecutorService pool = Executors.newFixedThreadPool(10);

pool.submit(() -> {
    Future<String> sub = pool.submit(() -> computeSubtask()); // subtask in same pool
    return sub.get(); // THIS THREAD BLOCKS — holding one of the 10 pool threads
    // If all 10 threads are here, the subtasks can never run → deadlock
});

// ✅ Solutions:
// Option 1: Use a separate pool for subtasks
// Option 2: Use ForkJoinPool (designed for work-stealing, avoids this deadlock)
// Option 3: Don't block on subtasks — use CompletableFuture chaining (async)
ForkJoinPool pool = new ForkJoinPool(10); // work-stealing avoids the deadlock
pool.submit(new RecursiveTask<>() {
    protected String compute() {
        // can invoke subtasks without deadlocking
        return invokeAll(subtask1, subtask2).stream()...
    }
});
```

---

### 📝 Practice Challenges

1. `Executors.newCachedThreadPool()` creates new threads on demand, unlimited. When is this appropriate? When does it become dangerous?
2. A Spring Boot app uses `@Async` which runs on a default `SimpleAsyncTaskExecutor` — which creates a new thread per call (no pool). What happens under load? How do you configure a proper bounded pool for `@Async`?
3. Design a thread pool configuration for a service that makes 3 downstream API calls (each ~200ms) to assemble a response page. CPU: 4 cores. Target: 100 concurrent page loads. What pool size?

---

## 6. BlockingQueue → Message Queues and Back-Pressure

### 🧠 Foundation — Decoupled Producer-Consumer

`BlockingQueue` is the in-process equivalent of a message queue:
- Producer calls `put()` — blocks if queue is full (back-pressure)
- Consumer calls `take()` — blocks if queue is empty (waits for work)

```java
// In-process producer-consumer with BlockingQueue
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(100); // bounded = back-pressure

// Producer thread
void produce(Task t) throws InterruptedException {
    queue.put(t);  // ← blocks if queue is full — natural back-pressure
}

// Consumer thread (or thread pool)
void consume() throws InterruptedException {
    while (true) {
        Task t = queue.take(); // ← blocks until work available
        process(t);
    }
}
```

### Mapping to Kafka

| `BlockingQueue` | Kafka |
|-----------------|-------|
| `put()` blocks when full | Producer blocks / gets `RecordTooLargeException` when broker is at lag limit |
| `take()` blocks when empty | Consumer polls, waits for messages |
| Bounded queue size | `max.partition.fetch.bytes`, consumer lag |
| Single consumer | Consumer group with one member |
| Multiple consumers | Consumer group (each partition → one consumer) |
| Queue depth | Consumer lag (messages produced but not consumed) |
| `offer(t, timeout)` | Producer with `request.timeout.ms` |

### 💥 War Story — The Unbounded Queue That OOM-Crashed the Service

A data pipeline used `Executors.newFixedThreadPool(10)` with the default `LinkedBlockingQueue` (unbounded). When downstream processing slowed down (DB latency spike), producers kept submitting tasks faster than consumers could process. The queue grew to 2 million tasks in memory. JVM OOM-crashed at 3am. 40 minutes of data was lost.

```java
// ❌ newFixedThreadPool uses an UNBOUNDED LinkedBlockingQueue internally
ExecutorService pool = Executors.newFixedThreadPool(10);
// Under high load: queue grows forever → OOM

// ✅ Explicit bounded queue with rejection policy
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    10, 10, 0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(1000),  // ← back-pressure: max 1000 pending
    new ThreadPoolExecutor.CallerRunsPolicy()  // ← slow the caller down instead of crashing
);
// CallerRunsPolicy: when queue full, the calling thread runs the task itself
// → producer naturally slows down to consumer's pace (back-pressure)
```

Kafka's equivalent: when a consumer's lag exceeds `max.partition.fetch.bytes` or the broker's disk fills, the producer eventually blocks on `send()` — same back-pressure signal, distributed.

---

### 📝 Practice Challenges

1. `SynchronousQueue` has zero capacity — put() blocks until a consumer is ready to take(). What use case is this for? What's the Kafka equivalent?
2. Implement a rate-limited task executor using `BlockingQueue` and `ScheduledExecutorService` that processes at most N tasks per second.
3. What's the difference between `offer(task)` (returns false if full) and `put(task)` (blocks if full)? When would you use each in a data pipeline?

---

## 7. ReentrantReadWriteLock → Read Replicas

### 🧠 Foundation — Many Readers, One Writer

`ReentrantReadWriteLock` allows **many readers concurrently** but only **one writer at a time** (and no readers while a writer holds the lock):

```java
ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
ReadLock  read  = rwLock.readLock();
WriteLock write = rwLock.writeLock();

// Cache backed by read-write lock
class CachedConfig {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private Map<String, String> config = new HashMap<>();

    public String get(String key) {
        lock.readLock().lock();      // multiple readers can hold this simultaneously
        try {
            return config.get(key);
        } finally {
            lock.readLock().unlock();
        }
    }

    public void reload(Map<String, String> newConfig) {
        lock.writeLock().lock();     // exclusive — blocks ALL readers during reload
        try {
            config = new HashMap<>(newConfig);
        } finally {
            lock.writeLock().unlock();
        }
    }
}
```

### Database Read Replicas — Same Pattern at Scale

```
ReentrantReadWriteLock:           Database Read Replicas:
  Multiple readers (readLock)  ↔   Multiple read replicas (SELECT queries)
  One writer (writeLock)       ↔   Single primary (INSERT/UPDATE/DELETE)
  Write blocks reads           ↔   Replication lag (brief read staleness)
  Read-after-write consistency ↔   Route writes to primary, reads to replica
```

### The Replication Lag Problem

The critical difference: the JVM's read-write lock ensures readers see the writer's updates immediately after the write lock is released. Database replicas have **replication lag** — a replica might be seconds (or minutes) behind the primary.

```java
// Spring: route reads to replica, writes to primary
@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    DataSource primaryDataSource() { return buildDataSource(PRIMARY_URL); }

    @Bean
    DataSource replicaDataSource() { return buildDataSource(REPLICA_URL); }
}

// Service: write to primary, read from replica (with lag awareness)
@Transactional
public Order createOrder(OrderRequest req) {
    Order order = orderRepo.save(new Order(req)); // → goes to primary
    return order;
}

@Transactional(readOnly = true) // → Spring routes to replica
public List<Order> getRecentOrders(String userId) {
    return orderRepo.findByUserId(userId); // might miss orders created < lag ago
}
// If you need read-your-writes: use primary for the read immediately after write
```

---

### 📝 Practice Challenges

1. `StampedLock` (Java 8+) adds an **optimistic read** mode: read without acquiring the lock, then validate (re-read if invalidated). How does this compare to database MVCC (Multi-Version Concurrency Control)?
2. A service reads config from a database on every request. Write a thread-safe `CachedConfigService` using `ReentrantReadWriteLock` that caches the config for 60 seconds then refreshes.
3. Read replicas in distributed systems can serve stale data. What's the equivalent bug in the JVM? (Hint: visibility without `volatile` or synchronization)

---

## 8. CompletableFuture → Scatter-Gather and Fan-Out

### 🧠 Foundation — Async Fan-Out

`CompletableFuture` lets you run tasks asynchronously and compose their results. This is the in-JVM version of the **scatter-gather** distributed pattern.

```java
// Sequential — total time = sum of all calls (slow)
UserProfile profile = userService.getProfile(userId);        // 50ms
List<Order> orders  = orderService.getOrders(userId);         // 80ms
CreditScore credit  = creditService.getCreditScore(userId);   // 120ms
// Total: 250ms

// Parallel with CompletableFuture — total time ≈ slowest single call
CompletableFuture<UserProfile> profileFuture =
    CompletableFuture.supplyAsync(() -> userService.getProfile(userId));
CompletableFuture<List<Order>> ordersFuture =
    CompletableFuture.supplyAsync(() -> orderService.getOrders(userId));
CompletableFuture<CreditScore> creditFuture =
    CompletableFuture.supplyAsync(() -> creditService.getCreditScore(userId));

// Wait for all three, then assemble:
CompletableFuture.allOf(profileFuture, ordersFuture, creditFuture).join();
Dashboard dashboard = new Dashboard(
    profileFuture.join(),  // already done — no blocking
    ordersFuture.join(),
    creditFuture.join()
);
// Total: ~120ms (longest single call)
```

### Scatter-Gather in Distributed Systems

```
Scatter: API Gateway sends the same request to N services in parallel
Gather:  Waits for all N responses, assembles one response to client

Examples:
- Search engine: scatter query to 100 shards, gather top-10 from each, merge
- ElasticSearch multi-shard queries
- GraphQL resolvers (DataLoader batching)
- Microservices BFF (Backend for Frontend) aggregation
```

### CompletableFuture Composition

```java
// Chain: get user → then get their orders (dependent, sequential)
CompletableFuture<List<Order>> ordersForUser = 
    CompletableFuture.supplyAsync(() -> userService.getUser(userId))
        .thenCompose(user -> 
            CompletableFuture.supplyAsync(() -> orderService.getByUser(user)));
// thenCompose = flatMap (for dependent async steps)
// thenApply   = map   (for transforming the result)

// anyOf: return as soon as the fastest of N completes
CompletableFuture<Object> fastest = CompletableFuture.anyOf(
    callRegionA(request),
    callRegionB(request),
    callRegionC(request)
);
// "Hedged requests" — fire to multiple regions, use the first to respond
// Reduces tail latency (p99) by sacrificing extra compute
```

### 💥 War Story — allOf().join() With No Timeout That Hung Forever

A dashboard endpoint used `CompletableFuture.allOf(...).join()` to aggregate 8 microservice calls. One service had a misconfigured connection pool and stopped responding (no timeout, no circuit breaker). The `join()` blocked the HTTP thread forever. 200 concurrent users triggered 200 hung threads. Thread pool exhaustion. Dashboard 502'd for 45 minutes.

```java
// ❌ No timeout — one slow service hangs everything
CompletableFuture.allOf(f1, f2, f3, f4, f5, f6, f7, f8).join();

// ✅ Timeout + graceful fallback
try {
    CompletableFuture.allOf(f1, f2, f3).get(3, TimeUnit.SECONDS);
} catch (TimeoutException e) {
    // Cancel remaining futures
    Stream.of(f1, f2, f3).forEach(f -> f.cancel(true));
    // Serve partial results or fallback
}

// ✅ Better: per-future timeout with fallback
CompletableFuture<CreditScore> creditFuture =
    CompletableFuture.supplyAsync(() -> creditService.getCreditScore(userId))
        .orTimeout(2, TimeUnit.SECONDS)
        .exceptionally(ex -> CreditScore.unavailable()); // fallback on timeout
```

---

### 📝 Practice Challenges

1. `CompletableFuture.supplyAsync(() -> ...)` uses the common `ForkJoinPool` by default. What's the problem with using `ForkJoinPool` for IO-bound tasks? What's the fix?
2. Implement a `hedgedRequest(urls, timeout)` function: fire a request to all URLs simultaneously, return the first successful response, cancel the rest.
3. `thenCompose` vs `thenApply` vs `thenCombine` — give one concrete use case for each and explain why the alternatives don't fit.

---

## Quick Reference: Java Concurrency → System Design

```
Java Concept                          │ Distributed System Equivalent
──────────────────────────────────────┼──────────────────────────────────────────────
synchronized / ReentrantLock          │ Distributed lock (Redis SETNX, ZooKeeper)
Check-then-act under one lock         │ Distributed transaction / SELECT FOR UPDATE
lock.tryLock()                        │ Lock with timeout (Redlock TTL)
volatile happens-before               │ Causal consistency / linearizability
@Version optimistic locking           │ DB optimistic lock (check version in UPDATE)
CAS (AtomicInteger)                   │ Compare-and-swap in Redis, DynamoDB conditions
AtomicStampedReference                │ Fencing token (prevents ABA in distributed locks)
ThreadLocal                           │ Request baggage / MDC correlation ID
ThreadLocal.remove() in finally       │ Stateless service (no leaked state between requests)
ExecutorService with bounded queue    │ Message queue with back-pressure
CallerRunsPolicy                      │ Producer slow-down on consumer lag
Separate pools per dependency         │ Bulkhead pattern (one circuit per downstream)
Pool deadlock (task waits for subtask)│ Distributed deadlock (A waits for B, B waits for A)
BlockingQueue put() / take()          │ Kafka produce / consume with lag
SynchronousQueue                      │ Zero-queue direct handoff (request-reply)
ReentrantReadWriteLock                │ Read replicas (many readers, one writer)
Replication lag                       │ ReadWriteLock after write before read (visibility gap)
CompletableFuture.allOf()             │ Scatter-gather / fan-out aggregation
CompletableFuture.anyOf()             │ Hedged requests (first response wins)
thenCompose (flatMap)                 │ Async saga step (action → trigger next action)
orTimeout() + exceptionally()         │ Circuit breaker with fallback
```

---

*[Back to Index](00_INDEX.md) | [Java Path](../PATH_JAVA_BACKEND.md) | [Spring Boot × DSA](12_SpringBoot_Plus_DSA_Progressive.md) | [System Design Blueprint](06_System_Design_Blueprint.md)*
