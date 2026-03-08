# 54. Java Memory Model & Garbage Collection — Deep Dive

> **Navigation**: [< Serialization & I/O](Ch09_Serialization_IO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Strings & Immutability >](Ch02_Strings_Immutability.md)

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
> JMM defines rules for when one thread's writes become visible to another thread. Without JMM guarantees, CPU caching and instruction reordering can cause threads to see stale data. The core concept is "happens-before" — a relationship guaranteeing visibility.

**Q: What are the happens-before rules?**
> Key rules: (1) Program order within a thread, (2) unlock happens-before subsequent lock on same monitor, (3) volatile write happens-before subsequent volatile read, (4) Thread.start() happens-before actions in started thread, (5) thread actions happen-before join() returns, and (6) transitivity.

**Q: What does volatile guarantee?**
> Visibility (writes immediately visible to all threads) and ordering (no reordering across volatile access). It does NOT guarantee atomicity — `volatile int x; x++` is still a race condition because it's read-then-write.

**Q: Explain the generational hypothesis and GC generations.**
> Most objects die young (~90%). So the heap is split: Young Generation (Eden + Survivors — collected frequently, fast) and Old Generation (long-lived objects — collected rarely). Minor GC collects Young, Major/Full GC collects Old. This is much faster than scanning the entire heap every time.

**Q: Difference between Soft, Weak, and Phantom references?**
> Soft: collected when memory is low (use for caches). Weak: collected at next GC regardless of memory (WeakHashMap). Phantom: always returns null, used only for cleanup notification after object is finalized. Strong > Soft > Weak > Phantom in strength.

**Q: How do you diagnose a memory leak in Java?**
> (1) Monitor heap usage over time — if it grows steadily without dropping after GC, there's a leak. (2) Take heap dump (`-XX:+HeapDumpOnOutOfMemoryError`). (3) Analyze with tools like Eclipse MAT or VisualVM. (4) Look for: static collections, unclosed resources, ThreadLocal not cleared, listeners not removed.

---

> **Key Takeaway**: JMM's happens-before is the foundation of correct concurrent 
> code. Use `volatile` for visibility, `synchronized` for atomicity+visibility. 
> GC is generational because most objects die young. Always set HeapDumpOnOOM 
> and monitor GC pauses in production.

> **Navigation**: [< Serialization & I/O](Ch09_Serialization_IO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Strings & Immutability >](Ch02_Strings_Immutability.md)
