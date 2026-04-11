# 54. Java Memory Model & Garbage Collection — Deep Dive

**Navigation**: [< Serialization & I/O](Ch09_Serialization_IO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Strings & Immutability >](Ch02_Strings_Immutability.md)

---

## PART 1: JAVA MEMORY MODEL (JMM)

---

## 🎯 The 5W1H

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Rules for how threads see each other's writes to memory  ║
║                                                                  ║
║  WHY  = CPUs have caches. Thread A writes x=5 in its cache.      ║
║         Thread B reads x from ITS cache — still sees x=0!        ║
║         JMM defines when changes become VISIBLE to other threads ║
║                                                                  ║
║  WHEN = ANYTIME two or more threads share mutable data           ║
║                                                                  ║
║  KEY  = The "happens-before" relationship — if A happens-before  ║
║         B, then A's writes are GUARANTEED visible to B           ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. The Visibility Problem — Why JMM Exists

```
Without JMM rules, this can FAIL:

Thread A:                    Thread B:
─────────                    ─────────
data = 42;                   while (!ready) { }
ready = true;                System.out.println(data);

Expected output: 42
Possible output: 0!  ← Thread B might see ready=true but data=0

WHY?
┌─────────────────────────────────────────────────────────────────┐
│ 1. CPU CACHING: Each CPU core has its own L1/L2 cache.          │
│    Thread A writes data=42 to Core 1's cache.                   │
│    Thread B reads data from Core 2's cache — still 0!           │
│                                                                 │
│ 2. INSTRUCTION REORDERING: CPU/compiler can reorder operations  │
│    Thread A might execute ready=true BEFORE data=42             │
│    (because they're independent from compiler's perspective)    │
│                                                                 │
│ 3. Store buffers: Writes queue in a buffer before reaching cache│
└─────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — JMM Visibility Problem**

**Challenge 1 (Predict):** Thread A: `data = 42; flag = true;`. Thread B: `while(!flag){}; print(data);` — flag and data are plain fields. Is this guaranteed to print 42?
<details><summary>Answer</summary>

**NO.** Without `volatile` or synchronization, there is no happens-before. Two issues: (1) CPU caching — Thread B may see stale `flag=false` forever (JIT can hoist the read out of the loop). (2) Instruction reordering — the CPU or compiler may execute `flag=true` BEFORE `data=42`. Even if B sees `flag=true`, it might see `data=0`. Fix: make `flag` volatile (creates happens-before for all writes before the volatile write).
</details>

**Challenge 2 (Reasoning):** Why can an infinite spin-loop `while(!flag){}` run forever even when another thread sets `flag=true`?
<details><summary>Answer</summary>

The JIT compiler sees `flag` is never written in the loop body (from this thread's view). It optimizes: read `flag` once into a CPU register, spin on the register — never re-reads from memory. This is valid under JMM when `flag` is not `volatile`. Fix: `volatile boolean flag` forces every read to go to main memory (or at minimum, to flush the cache so the register optimization is disallowed).
</details>

## 2. Happens-Before — The Core Concept

```
╔══════════════════════════════════════════════════════════════════╗
║ "A happens-before B" means:                                      ║
║   ALL memory writes done in A are GUARANTEED VISIBLE to B        ║
║                                                                  ║
║ This is NOT about time — it's about VISIBILITY GUARANTEE         ║
╚══════════════════════════════════════════════════════════════════╝
```

### The 7 Happens-Before Rules

```
┌───┬─────────────────────────────────┬────────────────────────────────────────┐
│ # │ Rule                            │ What It Means                           │
├───┼─────────────────────────────────┼──────────────────────────────────────── ┤
│ 1 │ Program Order                    │ In one thread, each line happens-      │
│   │                                  │ before the next line                   │
├───┼───────────────────────────────── ┼────────────────────────────────────────┤
│ 2 │ Monitor Lock                     │ unlock(m) happens-before every         │
│   │                                  │ subsequent lock(m)                     │
├───┼───────────────────────────────── ┼────────────────────────────────────────┤
│ 3 │ Volatile Variable                │ Write to volatile v happens-before     │
│   │                                  │ every subsequent read of v             │
├───┼───────────────────────────────── ┼────────────────────────────────────────┤
│ 4 │ Thread Start                     │ thread.start() happens-before any      │
│   │                                  │ action in the started thread           │
├───┼───────────────────────────────── ┼────────────────────────────────────────┤
│ 5 │ Thread Join                      │ All actions in a thread happen-before  │
│   │                                  │ join() returns in another thread       │
├───┼───────────────────────────────── ┼────────────────────────────────────────┤
│ 6 │ Thread Interrupt                 │ interrupt() call happens-before the    │
│   │                                  │ interrupted thread detects it          │
├───┼─────────────────────────────────-┼────────────────────────────────────────┤
│ 7 │ Transitivity                     │ If A hb B and B hb C, then A hb C      │
└───┴─────────────────────────────────-┴────────────────────────────────────────┘
```

---

## 3. volatile — Deep Mechanics

```java
// volatile does TWO things:
// 1. VISIBILITY: Write is immediately flushed from cache to main memory
//                Read always fetches from main memory (not cache)
// 2. ORDERING: Prevents reordering across the volatile access

private volatile boolean ready = false;
private int data = 0;

// Thread A:
data = 42;         // Regular write
ready = true;      // Volatile write — FLUSHES everything before it too!

// Thread B:
if (ready) {            // Volatile read — REFRESHES everything
    System.out.println(data);  // GUARANTEED to see 42!
}

// WHY? Because:
// 1. "data = 42" happens-before "ready = true" (program order in Thread A)
// 2. "ready = true" happens-before "if (ready)" (volatile rule #3)
// 3. By transitivity: "data = 42" happens-before "if (ready)"
// So Thread B MUST see data = 42 when it sees ready = true
```

### What volatile does NOT do

```java
// volatile does NOT make operations atomic!
private volatile int counter = 0;

// Thread A & B both do:
counter++;  // This is actually: read → increment → write (3 steps!)

// volatile ensures visibility of each individual read/write
// But does NOT prevent: A reads 0, B reads 0, A writes 1, B writes 1
// Result: 1 instead of 2  ← RACE CONDITION!

// For atomic increment, use AtomicInteger:
private AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();  // ✅ Atomic — uses CAS (compare-and-swap)
```

---

🔬 **Section Challenge — volatile**

**Challenge 1 (Bug Hunt):** `volatile int counter = 0; counter++;` — is this thread-safe?
<details><summary>Answer</summary>

**No.** `volatile` guarantees visibility (each read sees the latest write). But `counter++` is three steps: read → increment → write. Two threads can both read `counter=5` at the same time, both increment to 6, both write 6 — one increment lost even with `volatile`. Fix: `AtomicInteger` (CAS-based atomic increment) or `synchronized`.
</details>

**Challenge 2 (Reasoning):** What's the minimum fix for double-checked locking to be safe?
```java
static Singleton instance;
if (instance == null) { synchronized(Singleton.class) { if(instance==null) instance = new Singleton(); } }
```
<details><summary>Answer</summary>

Add `volatile` to `instance`: `static volatile Singleton instance;`. Without it: `new Singleton()` is 3 steps (allocate, initialize, assign). CPU can reorder to assign BEFORE initialize. Another thread sees non-null but partially-constructed object. `volatile` write adds a StoreStore barrier: initialization MUST complete before the reference is visible to other threads.
</details>

## 4. synchronized — Full Memory Fence

```java
// synchronized provides BOTH mutual exclusion AND happens-before

private int sharedData;
private final Object lock = new Object();

// Thread A:
synchronized (lock) {
    sharedData = 42;  // Write under lock
}  // ← UNLOCK happens-before...

// Thread B:
synchronized (lock) {  // ← ...this LOCK
    System.out.println(sharedData);  // GUARANTEED 42
}

// When you exit synchronized: ALL writes are flushed to main memory
// When you enter synchronized: ALL reads come from main memory
// This is called a "full memory fence"
```

---

## 5. Double-Checked Locking — The Classic JMM Problem

```java
// ❌ BROKEN without volatile (before Java 5)
public class Singleton {
    private static Singleton instance;
    
    public static Singleton getInstance() {
        if (instance == null) {           // First check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {   // Second check (with lock)
                    instance = new Singleton();
                    // This is actually 3 steps:
                    // 1. Allocate memory
                    // 2. Call constructor
                    // 3. Assign to 'instance'
                    // CPU can REORDER to: 1 → 3 → 2
                    // Thread B sees instance != null but object is not constructed!
                }
            }
        }
        return instance;
    }
}

// ✅ FIXED with volatile
public class Singleton {
    private static volatile Singleton instance;  // volatile prevents reordering!
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();  // No reordering across volatile write
                }
            }
        }
        return instance;
    }
}

// ✅ BEST: Use enum (simplest, safest)
public enum Singleton {
    INSTANCE;
}
```

---

## 6. False Sharing — CPU Cache Line Contention

```java
// Two unrelated variables sitting in the SAME 64-byte cache line
// When Thread A writes x, it invalidates Thread B's cache line for y too!

// ❌ False sharing:
class SharedData {
    volatile long x;  // Thread A writes this
    volatile long y;  // Thread B writes this — but x and y share a cache line!
}

// ✅ Fix with padding (Java 8+)
class SharedData {
    volatile long x;
    long p1, p2, p3, p4, p5, p6, p7;  // Padding to fill cache line
    volatile long y;  // Now in a different cache line
}

// ✅ Better fix: @Contended annotation (JDK internal, needs --add-opens)
class SharedData {
    @jdk.internal.vm.annotation.Contended
    volatile long x;
    
    @jdk.internal.vm.annotation.Contended
    volatile long y;
}
```

---

## PART 2: GARBAGE COLLECTION — Memory Management

---

## 7. JVM Memory Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         JVM MEMORY                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    HEAP (garbage collected)                │   │
│  │  ┌────────────────────┐  ┌───────────────────────────┐   │   │
│  │  │   Young Generation  │  │    Old Generation         │   │   │
│  │  │  ┌─────┐ ┌──┐ ┌──┐│  │                            │   │   │
│  │  │  │Eden │ │S0│ │S1││  │  Long-lived objects         │   │   │
│  │  │  │     │ │  │ │  ││  │  (survived many GCs)        │   │   │
│  │  │  └─────┘ └──┘ └──┘│  │                            │   │   │
│  │  └────────────────────┘  └───────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────┐  ┌──────────────────────────────────┐   │
│  │   Metaspace         │  │   Thread Stacks                  │   │
│  │  (class metadata,   │  │  (one per thread, method frames, │   │
│  │   method bytecode)  │  │   local variables, return addrs) │   │
│  └───────────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — JVM Memory Layout**

**Challenge 1 (Reasoning):** Your app runs fine locally but gets `OutOfMemoryError: Metaspace` in production. What's happening?
<details><summary>Answer</summary>

Metaspace stores class metadata (loaded class definitions, method bytecode). Common causes of Metaspace exhaustion: (1) **Dynamic class generation**: frameworks like Groovy, CGLIB, ASM, Hibernate proxies generate classes at runtime. If the classloader + generated classes are not garbage-collected, Metaspace grows unboundedly. (2) **ClassLoader leak**: often in hot-deploy scenarios (Tomcat redeployment). Fix: set `-XX:MaxMetaspaceSize=256m` to cap it, enable GC logging to see class unloading, use heap dump analysis to trace classloaders not being GC'd.
</details>

**Challenge 2 (Reasoning):** When does a `StackOverflowError` happen and how would you detect it vs an infinite loop?
<details><summary>Answer</summary>

Each method call pushes a frame onto the thread's stack (~256KB-1MB per thread). Unbounded recursion fills the stack → `StackOverflowError`. Detection: stack trace will show the same method repeated hundreds of times, indicating infinite recursion. Infinite loop: thread stays in RUNNABLE state in the thread dump, always at the same code location. Stack overflow is typically immediate once it starts, loop takes longer. Fix recursion: add a base case, or convert to iterative with an explicit stack.
</details>

## 8. Generational Hypothesis — WHY Young/Old Works

```
╔══════════════════════════════════════════════════════════════════╗
║ HYPOTHESIS: Most objects die young.                              ║
║                                                                  ║
║ Studies show: ~90% of objects are short-lived (temp variables,    ║
║ intermediate results, request-scoped data).                      ║
║                                                                  ║
║ So: Divide heap into generations. Collect the Young often        ║
║ (fast, most garbage), collect Old rarely (slow, less garbage).   ║
╚══════════════════════════════════════════════════════════════════╝
```

```
Object lifecycle:
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  new Object()                                                 │
│       │                                                       │
│       ▼                                                       │
│  ┌─────────┐     Minor GC     ┌────┐     Minor GC   ┌────┐  │
│  │  Eden   │ ──survived──────→│ S0 │ ──survived────→│ S1 │  │
│  │ (born)  │                   │    │                 │    │  │
│  └─────────┘                   └────┘                 └────┘  │
│       │                          │                      │     │
│    died? → COLLECTED          died? → COLLECTED      age > N? │
│    (most objects)             (some more)                │     │
│                                                          ▼     │
│                                               ┌──────────────┐│
│                                               │ Old Generation││
│                                               │ (promoted)    ││
│                                               └──────────────┘│
│                                                      │         │
│                                                   Major GC     │
│                                                (slow, STW)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. GC Algorithms — What Runs When

```
┌──────────────────────┬──────────────────────────────────────────────┐
│ Collector             │ How It Works                                  │
├──────────────────────┼──────────────────────────────────────────────┤
│ Serial GC             │ Single thread, stop-the-world.                │
│ -XX:+UseSerialGC      │ For: small apps, single-core machines.        │
├──────────────────────┼──────────────────────────────────────────────┤
│ Parallel GC           │ Multiple GC threads, stop-the-world.          │
│ -XX:+UseParallelGC    │ For: throughput-focused apps (batch jobs).     │
│                       │ Java 8 default.                               │
├──────────────────────┼──────────────────────────────────────────────┤
│ G1 GC                 │ Divides heap into regions. Collects           │
│ -XX:+UseG1GC          │ "garbage-first" regions. Concurrent.          │
│                       │ For: balanced latency/throughput.              │
│                       │ Java 9+ default.                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ ZGC                   │ Sub-millisecond pauses (<1ms).                │
│ -XX:+UseZGC           │ Concurrent, scalable to TB heaps.             │
│                       │ For: latency-sensitive apps.                  │
│                       │ Production-ready Java 15+.                    │
├──────────────────────┼──────────────────────────────────────────────┤
│ Shenandoah            │ Similar to ZGC, sub-ms pauses.                │
│ -XX:+UseShenandoahGC  │ Concurrent compaction.                        │
│                       │ OpenJDK only (not Oracle JDK).                │
└──────────────────────┴──────────────────────────────────────────────┘
```

---

## 10. GC Roots — What Keeps Objects Alive

```
An object is ALIVE if it's reachable from a GC Root.
Everything else is garbage.

GC ROOTS are:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Local variables on thread stacks                              │
│      void method() { User u = new User(); }  ← u is a root     │
│                                                                  │
│ 2. Static fields of loaded classes                               │
│      static List<User> cache = new ArrayList<>();                │
│                                                                  │
│ 3. Active threads themselves (Thread objects)                    │
│                                                                  │
│ 4. JNI references (native code holding Java refs)                │
│                                                                  │
│ 5. Synchronized monitors (objects being locked)                  │
│                                                                  │
│ 6. System class loader references                                │
└─────────────────────────────────────────────────────────────────┘

Reachability from roots:
GC Root → User → Address → City  ← ALL alive
GC Root → Order → [items]        ← ALL alive
         Product (no path from any root) → GARBAGE, collected
```

---

## 11. Weak, Soft, and Phantom References

```java
// Strong Reference (normal) — object stays alive
Object obj = new Object();  // GC will NEVER collect while obj points to it

// Soft Reference — collected ONLY when memory is low (for caches)
SoftReference<byte[]> cache = new SoftReference<>(new byte[1024 * 1024]);
byte[] data = cache.get();  // Might return null if GC cleared it
// Perfect for: in-memory caches that should shrink under memory pressure

// Weak Reference — collected at NEXT GC (even if memory is fine)
WeakReference<Object> weak = new WeakReference<>(new Object());
Object obj = weak.get();  // Might be null after any GC
// Used by: WeakHashMap (entries auto-removed when key is GC'd)

// Phantom Reference — can't get the object, only notified when it's collected
ReferenceQueue<Object> queue = new ReferenceQueue<>();
PhantomReference<Object> phantom = new PhantomReference<>(obj, queue);
phantom.get();  // ALWAYS returns null
// Used for: cleanup actions (modern replacement for finalize())
```

```
Reference Strength:
Strong > Soft > Weak > Phantom

┌──────────┬──────────────────┬────────────────────┬──────────────┐
│ Type     │ GC Behavior       │ get() returns      │ Use Case     │
├──────────┼──────────────────┼────────────────────┼──────────────┤
│ Strong   │ Never collected   │ Always the object  │ Normal use   │
│ Soft     │ When memory low   │ Object or null     │ Caches       │
│ Weak     │ Next GC cycle     │ Object or null     │ WeakHashMap  │
│ Phantom  │ After finalization│ Always null        │ Cleanup tasks│
└──────────┴──────────────────┴────────────────────┴──────────────┘
```

---

🔬 **Section Challenge — Weak/Soft/Phantom References**

**Challenge 1 (Design):** You want to build an image cache that automatically evicts entries under memory pressure without crashing with OOM. Which reference type?
<details><summary>Answer</summary>

`SoftReference<BufferedImage>`. Soft references are cleared by the GC when memory is low (before throwing OOM). Weak references are cleared at the NEXT GC cycle (too aggressive for caching — items get evicted even when memory is ample). Pattern: `Map<String, SoftReference<BufferedImage>> cache`. On `get()`: check if `ref.get() != null`, else reload and store new SoftReference.
</details>

**Challenge 2 (Reasoning):** Why does `WeakHashMap` NOT prevent key objects from being GC'd?
<details><summary>Answer</summary>

`WeakHashMap` stores keys as `WeakReference`s. If the key has no other strong references outside the map, the GC can collect it. When the key is collected, the WeakMap entry is automatically removed via a `ReferenceQueue`. This makes it perfect for caches where the key IS the data (DOM nodes, class instances): if the node is removed from the DOM, the cache entry disappears automatically. Contrast with regular `HashMap`: holding a key in the map IS a strong reference — the key is never GC'd as long as the map exists.
</details>

## 12. Memory Leaks in Java — Common Causes

```java
// Leak 1: Static collections that grow forever
class UserTracker {
    private static final List<User> allUsers = new ArrayList<>();
    public void track(User u) { allUsers.add(u); }  // Never removed!
}

// Leak 2: Unclosed resources
void readFile() {
    InputStream is = new FileInputStream("big.dat");  // Never closed!
    // Fix: try-with-resources
}

// Leak 3: Listeners not removed
button.addActionListener(this);
// If you remove the button but not the listener → this stays alive

// Leak 4: HashMap key with broken equals/hashCode
class BadKey {
    int id;
    // No equals() or hashCode() → entries accumulate, can't be found
}
Map<BadKey, Object> map = new HashMap<>();

// Leak 5: ThreadLocal not cleared
private static final ThreadLocal<byte[]> buffer = new ThreadLocal<>();
buffer.set(new byte[1024 * 1024]);
// In a thread pool: thread is reused, ThreadLocal value persists!
// Fix: always call buffer.remove() in finally block

// Leak 6: Inner class holding outer class reference
class Outer {
    byte[] bigData = new byte[10_000_000];
    
    class Inner {  // Non-static inner class holds reference to Outer!
        void doSomething() { }
    }
    // If Inner lives longer than Outer, Outer can't be GC'd
    // Fix: use static inner class
}
```

---

## 13. GC Tuning — Production Essentials

```bash
# Key JVM flags
-Xms512m              # Initial heap size
-Xmx2g               # Maximum heap size (set Xms = Xmx for production!)
-XX:+UseG1GC          # Use G1 collector (default Java 9+)
-XX:MaxGCPauseMillis=200  # Target max pause time for G1

# GC Logging (Java 9+)
-Xlog:gc*:file=gc.log:time,level,tags

# Memory analysis
-XX:+HeapDumpOnOutOfMemoryError        # Auto dump on OOM
-XX:HeapDumpPath=/path/to/dump.hprof   # Where to save dump

# Metaspace
-XX:MetaspaceSize=256m          # Initial metaspace
-XX:MaxMetaspaceSize=512m       # Max metaspace (prevent unbounded growth)
```

```
TUNING RULES:
┌──────────────────────────────────────────────────────────────┐
│ 1. Set -Xms = -Xmx (avoid dynamic resizing overhead)        │
│ 2. Start with G1GC (default, good for most apps)             │
│ 3. Monitor GC pause times in production                      │
│ 4. If pauses > 200ms consistently → tune MaxGCPauseMillis    │
│ 5. If pause-sensitive → try ZGC (-XX:+UseZGC)                │
│ 6. Enable HeapDumpOnOutOfMemoryError ALWAYS                  │
│ 7. Don't over-tune — measure first, tune second              │
└──────────────────────────────────────────────────────────────┘
```

---

## 14. Interview Questions & Answers

**Q: What is the Java Memory Model?**
JMM defines rules for when one thread's writes become visible to another thread. Without JMM guarantees, CPU caching and instruction reordering can cause threads to see stale data. The core concept is "happens-before" — a relationship guaranteeing visibility.

**Q: What are the happens-before rules?**
Key rules: (1) Program order within a thread, (2) unlock happens-before subsequent lock on same monitor, (3) volatile write happens-before subsequent volatile read, (4) Thread.start() happens-before actions in started thread, (5) thread actions happen-before join() returns, and (6) transitivity.

**Q: What does volatile guarantee?**
Visibility (writes immediately visible to all threads) and ordering (no reordering across volatile access). It does NOT guarantee atomicity — `volatile int x; x++` is still a race condition because it's read-then-write.

**Q: Explain the generational hypothesis and GC generations.**
Most objects die young (~90%). So the heap is split: Young Generation (Eden + Survivors — collected frequently, fast) and Old Generation (long-lived objects — collected rarely). Minor GC collects Young, Major/Full GC collects Old. This is much faster than scanning the entire heap every time.

**Q: Difference between Soft, Weak, and Phantom references?**
Soft: collected when memory is low (use for caches). Weak: collected at next GC regardless of memory (WeakHashMap). Phantom: always returns null, used only for cleanup notification after object is finalized. Strong > Soft > Weak > Phantom in strength.

**Q: How do you diagnose a memory leak in Java?**
(1) Monitor heap usage over time — if it grows steadily without dropping after GC, there's a leak. (2) Take heap dump (`-XX:+HeapDumpOnOutOfMemoryError`). (3) Analyze with tools like Eclipse MAT or VisualVM. (4) Look for: static collections, unclosed resources, ThreadLocal not cleared, listeners not removed.

---

---

## 15. Safe Publication — How to Share Objects Across Threads

**The Problem**: Creating an object and making it visible to other threads are TWO separate things. You must use the right mechanism or other threads may see partially-constructed objects.

```
╔══════════════════════════════════════════════════════════════════╗
║  THE CONSTRUCTION SITE ANALOGY                                   ║
║                                                                  ║
║  Worker A builds a house (object) and puts a sign:               ║
║  "House ready at address 0x1A2B" (reference published)           ║
║                                                                  ║
║  WITHOUT safe publication (CPU reordering):                      ║
║  → CPU publishes the ADDRESS (sign) before finishing the walls!  ║
║  → Worker B sees the sign, goes to the address                   ║
║  → House is half-built! Walls missing! (partially init object)   ║
║                                                                  ║
║  WITH safe publication (happens-before established):             ║
║  → Address only published AFTER construction FULLY complete       ║
║  → Worker B sees address → house is 100% built                   ║
║  → Safe!                                                         ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// ❌ UNSAFE PUBLICATION — other threads may see partially constructed object
class Holder {
    int n;
    Holder(int n) { this.n = n; }
}

// Thread A:
holder = new Holder(42);  // "new" is: 1) allocate memory, 2) construct, 3) assign
// CPU can reorder to: 1) allocate, 3) assign, 2) construct!
// Thread B sees holder != null (step 3 done), but n might still be 0 (step 2 pending)!

// ═══ SAFE PUBLICATION MECHANISMS ═══

// ✅ 1. Static initializer (class loading mechanism guarantees visibility)
static Holder holder = new Holder(42);  // JVM class loading = automatic safe pub

// ✅ 2. volatile field (volatile write happens-before volatile read)
private volatile Holder holder;
// Thread A:  holder = new Holder(42);   ← volatile write
// Thread B:  if (holder != null) use(holder.n);  ← volatile read sees everything

// ✅ 3. synchronized block (monitor unlock happens-before next lock)
synchronized (lock) { holder = new Holder(42); }
// Thread B: synchronized (lock) { use(holder.n); }

// ✅ 4. final fields (Java spec: final fields are visible to all threads
//        after constructor completes)
class SafeHolder {
    final int n;  // ← final!
    SafeHolder(int n) { this.n = n; }
}
// ANY way you publish a SafeHolder — other threads will see correct n

// ✅ 5. AtomicReference
AtomicReference<Holder> ref = new AtomicReference<>();
ref.set(new Holder(42));   // Thread A — CAS ensures ordering
Holder h = ref.get();      // Thread B — guaranteed to see fully constructed Holder
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SAFE PUBLICATION CHEAT SHEET                                                    │
│                                                                                 │
│  Method                        Guarantee                                        │
│  ─────────────────────────     ──────────────────────────────────────────────  │
│  static final field            Class loading is safe pub                        │
│  volatile field                volatile write happens-before volatile read      │
│  synchronized (same lock)      unlock happens-before lock                       │
│  final fields in constructor   visible after constructor exits (JMM §17.5)     │
│  AtomicReference.set/get       CAS provides ordering                           │
│  BlockingQueue.put/take        internal synchronization provides ordering       │
│  Futures/.join()               completion happens-before join() return          │
│                                                                                 │
│  IMMUTABLE OBJECTS:                                                             │
│  → If all fields are final and properly initialized in constructor              │
│  → Can be shared WITHOUT synchronization via ANY mechanism!                    │
│  → String, Integer, LocalDate — safe to share across threads always            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Happens-Before Chain — Visual Trace

Let's trace a complete scenario end-to-end to cement happens-before reasoning.

```
SCENARIO: Thread pool task sees correct data

Main thread:
  lineM1: List<Item> items = populateItems();
  lineM2: future = executor.submit(task);      ← submit() guarantees HB

Worker thread:
  lineW1: List<Item> data = sharedItems.get(); ← sees items from M1?

HAPPENS-BEFORE CHAIN:
────────────────────
lineM1 HB lineM2          (Rule 1: Program order in same thread)
lineM2 HB lineW1          (Rule 4: Thread.start / executor.submit HB any action in task)

By TRANSITIVITY (Rule 7):
lineM1 HB lineW1          ✅ Worker WILL see items populated in M1!

WHAT ABOUT:
Main thread:
  map.put("key", value)    ← NO synchronization
  executor.submit(task)

Worker:
  map.get("key")           ← Might see stale/null!

HAPPENS-BEFORE CHAIN:
  put HB submit            (Program order)
  submit HB get            (submit HB task start)
  put HB get               (Transitivity) ✅ This actually IS safe!

BUT ONLY because executor.submit() uses synchronization internally!
The executor's internal LinkedBlockingQueue.put() creates the HB chain.
```

```java
// REASONING EXERCISE: Is this safe?
class Lazy {
    private ExpensiveObject obj;

    // Thread A calls init():
    void init() {
        obj = new ExpensiveObject();  // No sync!
    }

    // Thread B calls get():
    ExpensiveObject get() {
        return obj;  // Safe?
    }
}

// ANSWER: NOT safe! No HB relationship between init() and get()
// Thread B may see obj = null, or see obj reference
// but ExpensiveObject may be PARTIALLY constructed (CPU reordering)

// FIX 1: volatile obj
// FIX 2: synchronized both methods
// FIX 3: Make ExpensiveObject immutable with final fields (safe pub via finals)
// FIX 4: Use AtomicReference<ExpensiveObject>
```

---

## 17. G1GC — Why Regions Change Everything

```
╔══════════════════════════════════════════════════════════════════╗
║  THE CITY BLOCKS ANALOGY (vs the Classic Farm Analogy)           ║
║                                                                  ║
║  CLASSIC GC (Parallel/CMS): The Farm                             ║
║  → Heap split into TWO fixed regions: Young Farm, Old Farm       ║
║  → Young Farm collected frequently (cheap, small)                ║
║  → Old Farm collected rarely but ENTIRE farm at once (slow!)     ║
║  → Problem: As Old farm fills, Full GC pauses entire JVM         ║
║              Full GC can pause for SECONDS on large heaps        ║
║                                                                  ║
║  G1GC: The City of Small Blocks                                  ║
║  → Heap divided into ~2048 equal REGIONS (~1-32MB each)          ║
║  → Each region can be: Eden, Survivor, Old, Humongous            ║
║  → Regions are NOT fixed: Old region collects, becomes Eden!     ║
║  → G1 collects highest-GARBAGE regions FIRST ("Garbage First")   ║
║  → Concurrent marking: G1 marks live objects WHILE app runs!     ║
║  → Only pauses for evacuation (moving objects to free regions)   ║
║  → MaxGCPauseMillis: G1 only collects as many regions as         ║
║    fit within the pause budget! Stops, doesn't overshoot.        ║
╚══════════════════════════════════════════════════════════════════╝
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  G1GC HEAP LAYOUT:                                                               │
│                                                                                 │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┐                                      │
│  │ E  │ S  │ O  │ E  │ O  │ O  │ H  │ H  │  ← 2048+ such regions               │
│  └────┴────┴────┴────┴────┴────┴────┴────┘                                      │
│   E=Eden  S=Survivor  O=Old  H=Humongous (>50% of region size)                 │
│                                                                                 │
│  G1 COLLECTION CYCLE:                                                           │
│  1. Minor GC:    Collect Eden + Survivor (Young regions) — Stop-the-World       │
│  2. Concurrent:  Mark live objects in Old regions — NO pause (runs with app)    │
│  3. Mixed GC:    Collect Young + some Old regions — Short pause                 │
│  4. Full GC:     Last resort (avoid!) — Long pause like classic GC              │
│                                                                                 │
│  TUNING INSIGHT:                                                                │
│  -XX:MaxGCPauseMillis=200 (default)                                             │
│  → G1 will collect fewer regions to stay under 200ms                           │
│  → Lower target = more frequent, shorter pauses                                │
│  → Higher target = fewer, longer pauses                                        │
│  → Trade-off: latency vs throughput                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Stop-The-World Deep Reasoning + ZGC's Trick

```
╔══════════════════════════════════════════════════════════════════╗
║  WHY STOP-THE-WORLD IS NECESSARY (and what ZGC does instead)    ║
║                                                                  ║
║  THE PHOTO ALBUM ANALOGY:                                        ║
║                                                                  ║
║  GC needs to take a "snapshot" of which objects are alive.       ║
║  Imagine taking a photo of people in a busy train station.       ║
║                                                                  ║
║  If people KEEP MOVING while you photograph:                     ║
║  → You capture the same person twice in different positions      ║
║  → You miss someone who moved out of frame                       ║
║  → Your count of people is WRONG                                 ║
║                                                                  ║
║  Classis STW GC: "FREEZE! Nobody move!" (stop-the-world)         ║
║  → All app threads paused                                        ║
║  → GC takes perfect snapshot                                     ║
║  → Resumes app → latency spike                                   ║
║                                                                  ║
║  ZGC: Never says "freeze" — uses READ BARRIERS:                  ║
║  → Every time your code READS an object reference:              ║
║     A tiny bit of ZGC code runs: "Is this reference valid?"      ║
║  → If GC moved the object: barrier updates the reference         ║
║  → App thread and GC thread work CONCURRENTLY                    ║
║  → Cost: ~15% throughput overhead (barriers on every read)       ║
║  → Benefit: <1ms pauses even on TB heaps!                        ║
╚══════════════════════════════════════════════════════════════════╝
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GC COMPARISON FOR PRODUCTION DECISIONS:                                         │
│                                                                                 │
│  Collector    Pause          Throughput  Heap size  Use case                    │
│  ──────────   ─────────────  ──────────  ─────────  ────────────────────────   │
│  Serial GC    Long STW       Low         Small      Dev/small apps              │
│  Parallel GC  Long STW       Highest     Medium     Batch jobs, offline jobs    │
│  G1GC         Short STW      High        Medium-XL  Most web services (default) │
│  ZGC          <1ms           High (95%)  Any (TB!)  Latency-sensitive, real-time │
│  Shenandoah   <1ms           Similar     Any        Same as ZGC (OpenJDK)       │
│                                                                                 │
│  COMMON MISTAKES:                                                               │
│  1. Xms != Xmx → heap resizing causes extra GC pauses                          │
│     FIX: Always set -Xms == -Xmx in production                                 │
│                                                                                 │
│  2. Too much heap → GC pause is longer (more to scan)                          │
│     FIX: Scale horizontally (more JVMs) vs vertically (bigger heap)            │
│                                                                                 │
│  3. No HeapDumpOnOutOfMemoryError → can't debug OOM                            │
│     FIX: ALWAYS set -XX:+HeapDumpOnOutOfMemoryError                            │
│                                                                                 │
│  4. Finalize() method → delays GC (object survives extra cycle)                │
│     FIX: Use AutoCloseable + try-with-resources instead                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

**Key Takeaway**: JMM's happens-before is the foundation of correct concurrent
code. Use `volatile` for visibility, `synchronized` for atomicity+visibility.
Safe publication requires an explicit happens-before — final fields, volatile, or sync.
GC is generational because most objects die young. G1 collects "garbage-first"
regions for predictable pauses. ZGC uses read barriers to eliminate STW entirely.
Always set HeapDumpOnOOM and monitor GC pauses in production.


---

## 🏋️ Practice & Interview Questions — JMM & GC

### Predict / Trace
**Q1.** Thread A: `x=42; flag=true;` Thread B: `if(flag) print(x);` — is this safe without volatile?
<details><summary>Answer</summary>

**No.** No happens-before between writes in A and reads in B. CPU may reorder `flag=true` before `x=42`. B may see flag=true but x=0. **Fix**: make `flag` volatile. The volatile write creates happens-before — all prior writes (including x=42) are visible.
</details>

**Q2.** What is the "double-checked locking" pattern and why does it require volatile?
<details><summary>Answer</summary>

Without volatile: `instance = new Singleton()` is 3 steps: allocate memory → run constructor → assign reference. CPU can reorder to: allocate → assign → constructor. Another thread sees non-null instance but reads partially-constructed object. `volatile` forces complete construction before reference is visible.
</details>

### Coding Analysis
**Q3.** Identify if each is safely published:
```java
// A:
static Config config = new Config(); // ← safe?

// B:
Config config; // field, non-volatile, non-final
void init() { config = new Config(); } // ← safe?

// C:
final Config config = new Config(); // ← safe?
```
<details><summary>Answer</summary>

A: ✅ Static initializer — JVM class loading guarantees visibility.
B: ❌ Unsafe! Non-volatile, non-synchronized field — other threads may see stale reference or partially-constructed Config.
C: ✅ `final` fields are safely published after constructor completes per JMM §17.5.
</details>

**Q4.** Calculate: heap 8GB, G1GC, all objects long-lived. What GC problem do you expect?
<details><summary>Answer</summary>

**Full GC storms.** G1 works by collecting highest-garbage regions (mixed GC). If objects are long-lived, few regions are high-garbage — G1 can't free space. Old gen fills up → G1 falls back to Serial Full GC → long pause (seconds) on 8GB heap. **Fix**: tune `G1HeapRegionSize`, `G1MixedGCCountTarget`, or switch to ZGC/Shenandoah for large heap + pause sensitivity.
</details>

### Interview Questions
**Q5.** What are the 7 happens-before rules in JMM?
<details><summary>Answer</summary>

1. Program order (single thread)
2. Monitor unlock → next lock (same monitor)
3. volatile write → volatile read (same variable)
4. Thread.start() → first action in started thread
5. Last action in thread → Thread.join() return
6. Thread interruption → detecting interruption
7. **Transitivity**: if A HB B and B HB C → A HB C
</details>

**Q6.** What is the write barrier in ZGC and why does it eliminate STW?
<details><summary>Answer</summary>

ZGC inserts a **load barrier** (read barrier) in every object reference load. When your code reads a reference, the barrier checks if GC relocated the object — if so, updates your reference (self-healing). This allows GC to relocate objects concurrently with running app code. No phase requires freezing all app threads (pauses < 1ms for safepoints only).
</details>

**Q7.** Your app has high GC overhead (GC takes >20% of time). Diagnostic steps?
<details><summary>Answer</summary>

1. Enable GC logging: `-Xlog:gc*:file=gc.log`
2. Check which GC events dominate (young, mixed, full)
3. If Young GC too frequent: objects dying before tenuring → allocating too much → profile allocation sites (JFR `jdk.ObjectAllocationInNewTLAB`)
4. If Full GC: old gen filling → possible memory leak → heap dump (-XX:+HeapDumpOnOutOfMemoryError), analyze with MAT/VisualVM
5. If GC overhead > 20% consistently: tune heap size, GC type, survivor ratios
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Young generation collection called | Minor GC |
| 2 | Old generation collection called | Major GC or Full GC |
| 3 | G1 stands for | Garbage First |
| 4 | G1 default pause target | 200ms |
| 5 | ZGC max pause | < 1ms (safepoints only) |
| 6 | Object promoted to old gen when | Survives N minor GCs (default 15) |
| 7 | -Xmx vs -Xms | Xmx=max heap, Xms=initial heap — set equal in production |
| 8 | TLAB stands for | Thread-Local Allocation Buffer |
| 9 | Humongous object in G1 | Object > 50% of region size — goes directly to old gen |
| 10 | finalize() effect on GC | Object survives one extra GC cycle — avoid using |



---

## 🧠 Deep Conceptual Questions — JMM, GC & JVM Internals

**C1. What is the Java Memory Model, and why does it need to exist?**
<details><summary>Deep Answer</summary>

Modern CPUs and compilers optimize aggressively: reordering instructions (both compiler and CPU), caching values in registers vs main memory (cache coherence), executing instructions out-of-order. Without rules: the same Java program could produce different results on different hardware (x86 is strongly-ordered, ARM is weakly-ordered). The JMM (JSR-133, Java 5+) defines a minimum set of **ordering guarantees** that the JVM must enforce regardless of hardware. It specifies exactly when writes from one thread become visible to another via the **happens-before** relation. Without JMM, Java would be non-portable across CPU architectures.
</details>

**C2. Why does the garbage collector need to stop your application?**
<details><summary>Deep Answer</summary>

GC must find all LIVE objects. It traces references from "roots" (stack variables, static fields). Problem: application threads are constantly changing references. If GC scans a heap while app runs: (1) app might CREATE a reference to an object GC just marked unreachable → object wrongly collected = use-after-free bug. (2) App might REMOVE the last reference to an object GC hasn't scanned yet → object missed, not collected = memory leak. Both are data races on the object graph. STW (stop-the-world) freezes all threads → consistent snapshot. ZGC's read barriers solve this differently: they intercept every object reference load and verify/update it — allows concurrent GC without freezing.
</details>

**C3. TLAB (Thread-Local Allocation Buffer) — why is heap allocation fast in Java?**
<details><summary>Deep Answer</summary>

Naive heap allocation: find free space, update free pointer (shared state) → needs synchronization → slow under concurrency. TLAB: each thread gets a private "chunk" of Eden space. Allocation = bump a local pointer (no synchronization). No contention between threads for allocation. When TLAB fills: request a new chunk from the heap (infrequent, one synchronization per chunk). Result: `new Object()` in Java ≈ 5-10 CPU instructions (pointer bump) vs C `malloc` ≈ 100-500 instructions (free list management). Java allocation is FASTER than C malloc for typical workloads.
</details>

**C4. What is escape analysis and how does it enable stack allocation and lock elision?**
<details><summary>Deep Answer</summary>

JIT compiler performs escape analysis: determines if an object "escapes" the method that creates it (is stored in a field, returned, passed to another thread). **Stack allocation**: if object doesn't escape (pure local) → allocate on the stack frame → freed automatically when method returns → zero GC pressure. **Scalar replacement**: decompose the object into individual fields on the stack. **Lock elision**: `synchronized(new Object())` — the lock object can't be shared (it's local) → the lock is provably uncontested → JIT eliminates the lock entirely. This eliminates a huge category of "defensive synchronization" patterns without sacrificing correctness.
</details>

**C5. What is a safepoint and why does JVM need one for GC?**
<details><summary>Deep Answer</summary>

A safepoint is a point in code where all threads have a consistent, well-known state — object references are unambiguous. GC needs to know exactly which memory locations hold object references (to trace the GC graph). This is only safe at safepoints. JIT-compiled code periodically inserts safepoint polls (usually at method exits and loop back-edges). When GC needs to run: JVM sets a "safepoint requested" flag → each thread checks the flag at its next poll → parks itself → when all threads reach safepoints, GC proceeds. The time for all threads to reach safepoints = "Time to Safepoint" (TTG). Long loops without safepoint polls → high TTG → delays GC → high pauses.
</details>

**C6. G1GC evacuation failure — what is it and how do you avoid it?**
<details><summary>Deep Answer</summary>

G1 works by copying live objects from "collection set" regions to free regions. **Evacuation failure**: during a collection, G1 can't find enough free regions to copy all live objects — it's out of space! G1 falls back to leaving some objects in place (mark them as "pinned"), which leaves the heap in an inconsistent state. Next step: full GC to clean up. Signs: `GC(#) To-space Exhausted` in logs. Causes: heap too full when GC triggers, allocation rate too high. Fixes: increase heap size (-Xmx), reduce allocation rate, tune G1HeapWastePercent to trigger GC earlier.
</details>

**C7. How does the JIT compiler decide to compile a method?**
<details><summary>Deep Answer</summary>

JVM starts in **interpreter mode** (executes bytecode directly, slow but avoids compilation latency). JIT compilation is **tiered**:
- **Tier 1-3** (C1): quick client compiler — basic optimization, fast startup
- **Tier 4** (C2): server compiler — aggressive deoptimization — highest performance

Compilation triggered by **invocation counters** (method call count) + **backedge counters** (loop iterations). When a method becomes "hot" (default: 10,000 invocations in C2): C2 compiles with full optimization including: inlining, escape analysis, loop unrolling, vectorization. **Deoptimization**: if assumptions made during JIT are violated (e.g., a polimorphic call site gets a new subclass), JIT reverts to interpreter. JVM dynamically profiles and re-optimizes throughout runtime — this is why JVM apps often get FASTER during a running session.
</details>


**Navigation**: [< Serialization & I/O](Ch09_Serialization_IO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Strings & Immutability >](Ch02_Strings_Immutability.md)

