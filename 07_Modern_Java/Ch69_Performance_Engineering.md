**Navigation**: [< Previous](Ch68_Distributed_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md)

# ⚡ Chapter 43 — Performance Engineering: Making Java Systems Fast

**"Performance isn't about writing 'fast code.' It's about MEASURING what's slow, understanding WHY, and fixing the right thing. A 10x optimization on a function that takes 1% of total time saves almost nothing."**

---

## Table of Contents

1. [The Performance Mindset](#1-the-performance-mindset)
2. [Latency vs Throughput vs Percentiles](#2-latency-vs-throughput-vs-percentiles)
3. [CPU-Bound vs I/O-Bound — Know What You're Optimizing](#3-cpu-bound-vs-io-bound--know-what-youre-optimizing)
4. [JVM Memory Model — Heap, Stack, and GC Roots](#4-jvm-memory-model--heap-stack-and-gc-roots)
5. [Garbage Collection Tuning](#5-garbage-collection-tuning)
6. [Profiling with async-profiler and Flamegraphs](#6-profiling-with-async-profiler-and-flamegraphs)
7. [Memory Leak Detection](#7-memory-leak-detection)
8. [Database Query Optimization](#8-database-query-optimization)
9. [JMH — Microbenchmarking Done Right](#9-jmh--microbenchmarking-done-right)
10. [Connection Pool Tuning](#10-connection-pool-tuning)
11. [Caching Strategies](#11-caching-strategies)
12. [Production Performance Checklist](#12-production-performance-checklist)

---

## 1. The Performance Mindset

```
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                RULE #1: NEVER GUESS. ALWAYS MEASURE.                 ║
  ║                                                                       ║
  ║  "I think ArrayList is slow" → Measure it.                           ║
  ║  "I think it's the database" → Profile it.                           ║
  ║  "I think GC is the problem" → Check GC logs.                       ║
  ║                                                                       ║
  ║  Most performance "intuitions" are wrong.                            ║
  ║  The bottleneck is almost never where you think it is.               ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  
  
  Optimization workflow:
  
  1. DEFINE the goal   → "API response < 200ms at p99"
  2. MEASURE current   → "Currently 850ms at p99"
  3. PROFILE           → "70% of time in SQL query"
  4. FIX the hotspot   → "Add index, reduce N+1"
  5. MEASURE again     → "Now 180ms at p99"
  6. REPEAT or STOP    → Goal met? Done. If not, go to step 3.
  
  
  AMDAHL'S LAW:
  ═════════════
  If a function is 10% of total time and you make it 2× faster:
  Total speedup = 1 / (0.9 + 0.1/2) = 1.053× → only 5% faster!
  
  If a function is 80% of total time and you make it 2× faster:
  Total speedup = 1 / (0.2 + 0.8/2) = 1.67× → 67% faster!
  
  → ALWAYS optimize the biggest bottleneck first.
```

---



🔬 **Section Challenge — 1. The Performance Mindset**

**Challenge 1 (Reasoning):** Why does optimizing CPU usage sometimes INCREASE latency in a high-throughput Java application?
<details><summary>Answer</summary>

Context Switching and Queueing. If you heavily batch tasks to maximize CPU cache hits and 100% CPU utilization, you create artificial queues. Little's Law dictates that as utilization approaches 100%, queue wait times grow exponentially. A system running at 70% CPU might have 10ms latency, while the same system pushed to 95% CPU (via batching/tuning) might process more requests per second but suffer 200ms latency due to thread contention and GC pauses.
</details>


## 2. Latency vs Throughput vs Percentiles

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │  LATENCY: How long ONE request takes.                               │
  │  "This API call took 45ms"                                          │
  │                                                                      │
  │  THROUGHPUT: How many requests per unit of time.                     │
  │  "Server handles 5000 requests/second"                               │
  │                                                                      │
  │  They're related but NOT inverses!                                   │
  │  You can have high throughput AND high latency (large batches).     │
  │  You can have low latency AND low throughput (one thread).          │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
  
  
  WHY AVERAGES LIE:
  ═════════════════
  
  Request latencies:  5ms, 6ms, 5ms, 7ms, 6ms, 5ms, 800ms
  Average: 119ms — seems bad
  But 6 of 7 requests were fine! One outlier skewed everything.
  
  USE PERCENTILES:
  p50 (median):   6ms → "Half of requests are faster than this"
  p90:           7ms → "90% of requests are faster than this"
  p99:         800ms → "99% of requests are faster than this"
  
  SLAs are written in percentiles:
  "p99 latency < 200ms"  → 99% of requests complete under 200ms
  
  
  WHY p99 MATTERS:
  ════════════════
  At 1000 requests/second:
  p99 = 800ms means 10 users PER SECOND experience 800ms+ latency.
  In a microservice chain of 5 services:
  Probability ALL 5 are fast: 0.99^5 = 0.95 → 5% of requests are slow.
```

---

## 3. CPU-Bound vs I/O-Bound — Know What You're Optimizing

```
  CPU-BOUND:                           I/O-BOUND:
  ═══════════                          ═══════════
  CPU is at 100%.                      CPU is idle, waiting for:
  Threads compute constantly.          - Database response
  Examples:                            - HTTP call to another service
  - JSON serialization                 - File system read
  - Encryption/hashing                 - Network I/O
  - Complex calculations               - Disk writes
  - Sorting/algorithm work
  
  FIX CPU-BOUND:                       FIX I/O-BOUND:
  - Better algorithm (O(n²) → O(n))  - More threads (or virtual threads)
  - Reduce object allocation           - Async I/O (non-blocking)
  - JIT warmup                         - Connection pooling
  - Parallelism (use all cores)        - Caching
  - Data structure choice              - Batch requests
  
  
  HOW TO TELL:
  
  If you add more threads and:
  - Performance IMPROVES → I/O-bound (threads were idle waiting)
  - Performance DEGRADES → CPU-bound (more contention, context switches)
  
  Quick check: Run your app and look at CPU usage.
  - 100% on one core, others idle → CPU-bound, single-threaded
  - All cores at 100% → CPU-bound, multi-threaded
  - < 30% CPU → I/O-bound (CPU is waiting for something)
```

---



🔬 **Section Challenge — 3. CPU-Bound vs I/O-Bound — Know What You're Optimizing**

**Challenge 1 (Reasoning):** Why does optimizing CPU usage sometimes INCREASE latency in a high-throughput Java application?
<details><summary>Answer</summary>

Context Switching and Queueing. If you heavily batch tasks to maximize CPU cache hits and 100% CPU utilization, you create artificial queues. Little's Law dictates that as utilization approaches 100%, queue wait times grow exponentially. A system running at 70% CPU might have 10ms latency, while the same system pushed to 95% CPU (via batching/tuning) might process more requests per second but suffer 200ms latency due to thread contention and GC pauses.
</details>


## 4. JVM Memory Model — Heap, Stack, and GC Roots

```
  ┌─── JVM Process Memory ────────────────────────────────────────────────────┐
  │                                                                            │
  │  ┌─── HEAP (shared, GC-managed) ──────────────────────────────────────┐  │
  │  │                                                                     │  │
  │  │  ┌── Young Generation ─────────────┐  ┌── Old Generation ───────┐  │  │
  │  │  │                                  │  │                          │  │  │
  │  │  │  Eden  │ Survivor 0 │ Survivor 1│  │  Long-lived objects     │  │  │
  │  │  │  (new  │ (survived  │ (survived │  │  (survived many GCs)    │  │  │
  │  │  │  objs) │  1+ GC)    │  1+ GC)   │  │  Major/Full GC here     │  │  │
  │  │  │        │            │           │  │  (SLOW - stop the world) │  │  │
  │  │  └────────────────────────────────┘  └──────────────────────────┘  │  │
  │  │                                                                     │  │
  │  └─────────────────────────────────────────────────────────────────────┘  │
  │                                                                            │
  │  ┌─── STACK (per-thread, auto-managed) ───────────────────────────────┐  │
  │  │  Thread-1 Stack │ Thread-2 Stack │ Thread-3 Stack │ ...            │  │
  │  │  - local vars   │ - local vars   │ - local vars   │               │  │
  │  │  - method frames│ - method frames│ - method frames│               │  │
  │  │  - primitives   │ - primitives   │ - primitives   │               │  │
  │  └─────────────────────────────────────────────────────────────────────┘  │
  │                                                                            │
  │  ┌── METASPACE (class metadata, no PermGen since Java 8) ─────────────┐  │
  │  │  Class definitions, method metadata, constant pools                 │  │
  │  └─────────────────────────────────────────────────────────────────────┘  │
  │                                                                            │
  └────────────────────────────────────────────────────────────────────────────┘
  
  
  OBJECT LIFECYCLE:
  ═════════════════
  
  1. new User() → allocated in Eden space
  2. Eden fills up → Minor GC (fast, milliseconds)
  3. Survived? → moves to Survivor S0 or S1 (ping-pong)
  4. Survived enough Minor GCs? → promoted to Old Gen
  5. Old Gen fills up → Major GC (slow, 100ms-seconds, STW!)
  
  
  GC ROOTS (starting points for reachability):
  ═════════════════════════════════════════════
  • Local variables on thread stacks
  • Static fields of loaded classes
  • Active threads themselves
  • JNI references
  
  If an object is NOT reachable from any GC root → garbage → collected.
```

---



🔬 **Section Challenge — 4. JVM Memory Model — Heap, Stack, and GC Roots**

**Challenge 1 (Memory Leaks):** Why does a memory leak in a `ThreadLocal` variable often cause out-of-memory errors in Tomcat/Spring Boot applications, but not in simple command-line Java scripts?
<details><summary>Answer</summary>

In a simple script, the thread dies when the script finishes, taking the `ThreadLocal` map with it (since active threads are GC roots). In Tomcat, threads are part of a long-lived **Thread Pool**. They never die; they are just returned to the pool. If you don't call `.remove()` on a `ThreadLocal` in a `finally` block, the object remains attached to the pooled thread's GC root forever, causing a massive memory leak across thousands of requests.
</details>

## 5. Garbage Collection Tuning

```
  MAIN GC ALGORITHMS:
  ═══════════════════
  
  ┌───────────────┬──────────┬──────────────┬───────────────────────────┐
  │ Collector      │ Pause    │ Best For      │ Flag                      │
  ├───────────────┼──────────┼──────────────┼───────────────────────────┤
  │ Serial         │ Long     │ Small apps    │ -XX:+UseSerialGC          │
  │ Parallel       │ Medium   │ Throughput    │ -XX:+UseParallelGC        │
  │ G1 (default)  │ Short    │ Balanced      │ -XX:+UseG1GC              │
  │ ZGC           │ < 1ms    │ Low latency   │ -XX:+UseZGC               │
  │ Shenandoah    │ < 10ms   │ Low latency   │ -XX:+UseShenandoahGC      │
  └───────────────┴──────────┴──────────────┴───────────────────────────┘
  
  
  G1 GC (Java 9+ default):
  ══════════════════════════
  
  Divides heap into ~2048 equal-sized REGIONS:
  
  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
  │  E  │  E  │  S  │  O  │  O  │  E  │  H  │  O  │
  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
   E=Eden  S=Survivor  O=Old  H=Humongous (large objects)
  
  Key insight: G1 collects HIGH-GARBAGE regions first (Garbage First!)
  → Gets most space back with least work.
  
  Target pause time: -XX:MaxGCPauseMillis=200 (default)
  
  
  DIAGNOSING GC ISSUES:
  ═════════════════════
  
  Enable GC logs:
  -Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10M
  
  WARNING SIGNS:
  • Full GC events → heap too small or memory leak
  • GC taking > 10% of CPU time → tune or upgrade collector
  • Long GC pauses (> 500ms) → switch to ZGC or tune G1
  • Frequent Minor GC → Eden too small, objects allocated fast
```

---



🔬 **Section Challenge — 5. Garbage Collection Tuning**

**Challenge 1 (Log Analysis):** You see frequent "Full GC" events in your logs, but the Old Generation space is only 20% full. What could be causing this?
<details><summary>Answer</summary>

Two common causes: (1) **Explicit GC Calls:** Somewhere in the code (or a 3rd-party library), `System.gc()` is being explicitly called, forcing a STW Full GC. You can disable this with `-XX:+DisableExplicitGC`. (2) **Metaspace Exhaustion:** The heap's Old Gen might be fine, but the Metaspace (where class metadata is stored) might be full, triggering a Full GC to unload unused classes. This often happens with dynamic proxy generation (e.g., Hibernate, Spring AOP) if not tuned properly.
</details>


## 6. Profiling with async-profiler and Flamegraphs

```
  HOW TO FIND WHAT'S SLOW:
  ════════════════════════
  
  async-profiler: Low-overhead profiler for JVM.
  Captures CPU samples AND allocation tracking.
  
  USAGE:
  # Profile CPU for 30 seconds, output flamegraph:
  ./asprof -d 30 -f flamegraph.html <PID>
  
  # Profile memory allocations:
  ./asprof -d 30 -e alloc -f alloc-flame.html <PID>
  
  
  READING A FLAMEGRAPH:
  ═════════════════════
  
  ┌──────────────────────────────────────────────────────────────────┐
  │ main() ───────────────────────── 100% (full width)              │
  │ ├── handleRequest() ──────────── 85%                            │
  │ │   ├── queryDatabase() ──────── 60%  ← BIGGEST HOTSPOT!      │
  │ │   │   ├── executeSQL() ─────── 45%                           │
  │ │   │   └── mapResults() ─────── 15%                           │
  │ │   └── serializeJSON() ──────── 25%                           │
  │ │       └── Jackson.write() ──── 25%                           │
  │ └── logging() ────────────────── 15%                            │
  └──────────────────────────────────────────────────────────────────┘
  
  WIDTH = time spent (wider = more time in that function)
  HEIGHT = stack depth (top = where CPU actually spent time)
  
  In this example:
  → 60% of time in database queries → optimize SQL first!
  → 25% in JSON serialization → maybe switch to faster library
  → Logging is 15% → maybe reduce log level or use async logging
```

---



🔬 **Section Challenge — 6. Profiling with async-profiler and Flamegraphs**

**Challenge 1 (Reasoning):** When reading a CPU Flamegraph, you notice that a specific function forms a very wide plateau at the very top of a stack trace. What does this indicate?
<details><summary>Answer</summary>

The width of a block indicates the percentage of CPU time spent in that function (and its children). Because it is at the *top* of the stack, it means the CPU was actually executing instructions directly inside this function, not waiting for a child function to return. A wide block at the very top is a **CPU Hotspot** and is your primary target for algorithmic optimization.
</details>

## 7. Memory Leak Detection

```
  IN JAVA, "memory leak" = objects that are reachable but no longer NEEDED.
  GC can't collect them because something still holds a reference.
  
  
  COMMON CAUSES:
  ══════════════
  
  1. STATIC COLLECTIONS that grow forever:
     static List<Event> eventLog = new ArrayList<>();
     // Never cleared! Grows with every event!
  
  2. UNCLOSED RESOURCES:
     InputStream is = new FileInputStream("data.txt");
     // Never is.close() → file descriptor leak + possible memory leak
  
  3. INNER CLASS holding reference to OUTER:
     class Outer {
         byte[] largeData = new byte[10_000_000];
         Runnable task = new Runnable() {
             public void run() { /* this holds ref to Outer! */ }
         };
     }
     // Even if Outer is "unused", task keeps Outer alive
  
  4. CACHE without eviction:
     Map<String, HeavyObject> cache = new HashMap<>();
     // Grows forever. Use Caffeine with maxSize!
  
  5. THREAD-LOCAL not cleaned:
     threadLocal.set(largeObject);
     // In thread pools, thread lives forever → object lives forever!
     // Always threadLocal.remove() in finally block
  
  
  DETECTION:
  ══════════
  
  1. Monitor heap over time:
     jcmd <PID> GC.heap_info
     If Old Gen keeps growing after each Full GC → leak!
  
  2. Heap dump analysis:
     jcmd <PID> GC.heap_dump heap.hprof
     Open in Eclipse MAT → "Leak Suspects" report
     Shows: which objects hold the most memory and who references them
  
  3. JFR (Java Flight Recorder):
     jcmd <PID> JFR.start duration=60s filename=recording.jfr
     Captures allocations, GC events, thread states, I/O — everything.
```

---

## 8. Database Query Optimization

```
  #1 PERFORMANCE KILLER IN MOST APPLICATIONS: BAD QUERIES
  
  
  EXPLAIN ANALYZE (PostgreSQL):
  ═════════════════════════════
  
  EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;
  
  -- Output:
  -- Seq Scan on orders  (cost=0.00..35.50 rows=10 width=64)
  --   Filter: (user_id = 42)
  --   Rows Removed by Filter: 990
  --   Planning Time: 0.1 ms
  --   Execution Time: 2.3 ms
  
  PROBLEMS:
  • "Seq Scan" → full table scan! Need an INDEX.
  • "Rows Removed by Filter: 990" → read 1000 rows, kept 10. Very wasteful.
  
  FIX:
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  
  Now:
  -- Index Scan using idx_orders_user_id on orders  (cost=0.28..8.30)
  --   Index Cond: (user_id = 42)
  --   Planning Time: 0.1 ms
  --   Execution Time: 0.05 ms
  
  From 2.3ms → 0.05ms = 46× faster!
  
  
  COMMON QUERY ANTI-PATTERNS:
  ═══════════════════════════
  
  1. SELECT * when you only need 3 columns
     → Wastes memory, network, and prevents covering indexes
  
  2. N+1 queries (ORM trap):
     SELECT * FROM orders;                    -- 1 query
     SELECT * FROM items WHERE order_id = 1;  -- N queries
     SELECT * FROM items WHERE order_id = 2;  -- (one per order!)
     → Use JOIN or IN clause instead
  
  3. Missing index on WHERE/JOIN/ORDER BY columns
     → EXPLAIN ANALYZE every slow query
  
  4. Index on low-cardinality column (e.g., boolean status)
     → Index on 2 values isn't helpful. Use composite index.
  
  5. LIKE '%search%' (leading wildcard)
     → Cannot use B-tree index. Use full-text search instead.
```

---

## 9. JMH — Microbenchmarking Done Right

```
  WHY NAIVE BENCHMARKS ARE WRONG:
  ═══════════════════════════════
  
  // WRONG:
  long start = System.nanoTime();
  for (int i = 0; i < 1000000; i++) {
      myFunction();
  }
  long elapsed = System.nanoTime() - start;
  
  Problems:
  - JIT compiler optimizes away dead code
  - No warmup phase (first runs are interpreted)
  - GC pauses skew results
  - No statistical analysis
  
  
  JMH (Java Microbenchmark Harness) — the CORRECT way:
  ═════════════════════════════════════════════════════
```

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)       // 5 warmup runs (JIT compiles)
@Measurement(iterations = 10, time = 1)  // 10 measured runs
@Fork(2)                                  // 2 separate JVM forks
@State(Scope.Thread)
public class CollectionBenchmark {
    
    private List<Integer> arrayList;
    private LinkedList<Integer> linkedList;
    
    @Setup
    public void setup() {
        arrayList = new ArrayList<>(IntStream.range(0, 10000).boxed().toList());
        linkedList = new LinkedList<>(arrayList);
    }
    
    @Benchmark
    public int arrayListGet() {
        return arrayList.get(5000);   // O(1) random access
    }
    
    @Benchmark
    public int linkedListGet() {
        return linkedList.get(5000);  // O(n) traversal!
    }
    
    // JMH uses the return value → prevents dead code elimination
}

// Results:
// Benchmark                       Mode  Cnt    Score   Error  Units
// arrayListGet                    avgt   20     3.2 ± 0.1  ns/op
// linkedListGet                   avgt   20  5847.6 ± 12.3  ns/op
// → LinkedList.get(5000) is 1800× slower!
```

---



🔬 **Section Challenge — 9. JMH — Microbenchmarking Done Right**

**Challenge 1 (Pitfalls):** Why must a JMH benchmark method return a value or use a `Blackhole` object instead of just performing a calculation and returning `void`?
<details><summary>Answer</summary>

Dead Code Elimination (DCE). The JVM's Just-In-Time (JIT) compiler is extremely smart. If a method computes a value but never uses it or returns it, the JIT compiler will recognize that the code has no side effects and completely optimize it away. Your benchmark will measure the time it takes to do literally nothing. Returning the value forces the JVM to actually execute the instructions.
</details>


## 10. Connection Pool Tuning

```
  EVERY database call: establish TCP → TLS handshake → authenticate → query → close.
  Connection setup alone: 5-50ms. With pooling: < 1ms (reuse existing).
  
  
  HikariCP (Spring Boot default):
  ════════════════════════════════
  
  # application.yml
  # spring.datasource.hikari:
  #   maximum-pool-size: 10    # Max connections to DB
  #   minimum-idle: 5           # Keep 5 connections ready
  #   connection-timeout: 30000 # Wait 30s for connection from pool
  #   idle-timeout: 600000      # Close idle connections after 10 min
  #   max-lifetime: 1800000     # Recreate connections every 30 min
  
  
  POOL SIZE FORMULA (by HikariCP author):
  ═══════════════════════════════════════
  
  pool_size = (core_count * 2) + effective_spindle_count
  
  For SSD with 4-core CPU:
  pool_size = (4 * 2) + 1 = 9
  
  WHY SO SMALL?
  At any moment, the CPU can only execute 4 things (4 cores).
  More connections = more context switches = SLOWER.
  
  
  POOL EXHAUSTION SYMPTOMS:
  ═════════════════════════
  
  Log: "HikariPool-1 - Connection is not available, request timed out after 30000ms"
  
  Causes:
  1. Long-running transactions holding connections
  2. Pool too small for request volume
  3. Missing @Transactional(readOnly = true) causing unnecessary locks
  4. N+1 queries making too many DB calls per request
  
  Monitoring:
  spring.datasource.hikari.register-mbeans: true
  Then watch: ActiveConnections, IdleConnections, PendingThreads
```

---



🔬 **Section Challenge — 10. Connection Pool Tuning**

**Challenge 1 (Database Tuning):** Your server has a 4-core CPU. You increase your HikariCP database connection pool size from 10 to 500 to handle more concurrent users. Performance immediately drops. Why?
<details><summary>Answer</summary>

A 4-core CPU can only physically execute 4 threads at any given microsecond. Having 500 active database connections means 500 threads fighting for those 4 cores. The CPU spends all its time context-switching rather than doing actual work, and the database itself becomes overwhelmed trying to manage 500 concurrent locking/transaction contexts. This is why HikariCP recommends `pool_size = (core_count * 2) + effective_spindle_count`.
</details>


## 11. Caching Strategies

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │  CACHE-ASIDE (Lazy Loading) — Most Common                          │
  │  ══════════════════════════                                         │
  │                                                                      │
  │  1. App checks cache → MISS                                        │
  │  2. App queries database                                            │
  │  3. App puts result in cache                                        │
  │  4. Next request → cache HIT → skip DB                             │
  │                                                                      │
  │  ┌── App ──┐     1.GET     ┌── Cache ──┐                           │
  │  │         │───────────────→│  MISS!    │                           │
  │  │         │←───────────────│           │                           │
  │  │         │                └───────────┘                           │
  │  │         │     2.SELECT   ┌── DB ─────┐                          │
  │  │         │───────────────→│           │                           │
  │  │         │←───────────────│  result   │                           │
  │  │         │                └───────────┘                           │
  │  │         │     3.PUT      ┌── Cache ──┐                           │
  │  │         │───────────────→│  stored!  │                           │
  │  └─────────┘                └───────────┘                           │
  │                                                                      │
  │  Pros: Only caches what's actually used. Simple.                    │
  │  Cons: First request always slow (cache miss).                      │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
  
  
  EVICTION POLICIES:
  ══════════════════
  
  LRU (Least Recently Used)  → Evict what hasn't been accessed longest
  LFU (Least Frequently Used) → Evict what's accessed least often  
  TTL (Time To Live)          → Evict after fixed time (e.g., 5 min)
  TTI (Time To Idle)          → Evict if not accessed for X time
  
  Caffeine cache (best Java cache library):
```

```java
Cache<String, User> userCache = Caffeine.newBuilder()
    .maximumSize(10_000)              // max entries
    .expireAfterWrite(Duration.ofMinutes(5))   // TTL
    .recordStats()                    // enable hit/miss metrics
    .build();

// With Spring:
@Cacheable(value = "users", key = "#userId")
public User findUser(Long userId) {
    return userRepository.findById(userId).orElseThrow();
}

@CacheEvict(value = "users", key = "#userId")
public void updateUser(Long userId, UserDTO dto) {
    // Cache entry removed on update → next read gets fresh data
}
```

```
  CACHE INVALIDATION STRATEGIES:
  ══════════════════════════════
  
  1. TTL-based: Set expiry. Accept staleness within TTL window.
     → Simplest. Good for data that changes infrequently.
  
  2. Write-through: Update cache on every DB write.
     → Always consistent. Higher write latency.
  
  3. Event-driven: DB change → publish event → invalidate cache.
     → Near real-time. More complex infrastructure.
  
  4. Versioned keys: cache key = "user:42:v3" → new version = new key.
     → Old entries expire naturally. Good for immutable data.
```

---



🔬 **Section Challenge — 11. Caching Strategies**

**Challenge 1 (Design):** Cache-aside vs write-through vs write-behind — when does each cause stale data?
<details><summary>Answer</summary>

Cache-aside (lazy load): on cache miss, load from DB and populate cache. Stale: if DB updated externally (direct DB write bypassing cache). Write-through: write to cache AND DB simultaneously. Stale: never (cache always reflects writes). Write-behind (write-back): write to cache, async write to DB. Stale: if cache crashes before DB write → data loss. Rule: cache-aside for read-heavy. Write-through for write+read. Write-behind for write-heavy (accept loss risk).
</details>


## 12. Production Performance Checklist

```
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║  BEFORE DEPLOYING — PERFORMANCE CHECKLIST                            ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║                                                                       ║
  ║  JVM:                                                                 ║
  ║  □ -Xms = -Xmx (avoid heap resize pauses)                           ║
  ║  □ GC algorithm chosen (G1 for balanced, ZGC for low-latency)       ║
  ║  □ GC logging enabled (-Xlog:gc*)                                    ║
  ║  □ Heap size: 50-75% of container memory (leave room for off-heap)  ║
  ║                                                                       ║
  ║  DATABASE:                                                            ║
  ║  □ Connection pool sized: (cores × 2) + spindles                     ║
  ║  □ Slow query log enabled (> 100ms)                                  ║
  ║  □ EXPLAIN ANALYZE on all critical queries                           ║
  ║  □ Indexes on all WHERE, JOIN, ORDER BY columns                     ║
  ║  □ N+1 queries eliminated (check Hibernate SQL log)                  ║
  ║                                                                       ║
  ║  OBSERVABILITY:                                                       ║
  ║  □ Metrics: latency percentiles (p50, p90, p99), throughput, errors ║
  ║  □ Distributed tracing (OpenTelemetry, Jaeger)                       ║
  ║  □ Structured logging (JSON, correlation IDs)                        ║
  ║  □ Alerts on: p99 > threshold, error rate > 1%, pool exhaustion     ║
  ║                                                                       ║
  ║  APPLICATION:                                                         ║
  ║  □ Timeouts on ALL external calls (HTTP, DB, cache)                  ║
  ║  □ Circuit breakers on downstream services                           ║
  ║  □ Connection pooling for Redis, HTTP clients, DB                    ║
  ║  □ Async logging (Logback AsyncAppender)                             ║
  ║  □ Cache hit ratio monitored (target > 90%)                         ║
  ║                                                                       ║
  ╚═══════════════════════════════════════════════════════════════════════╝
```

---

**Previous Chapter**: [Distributed Patterns & Consensus ←](Ch68_Distributed_Patterns.md)
