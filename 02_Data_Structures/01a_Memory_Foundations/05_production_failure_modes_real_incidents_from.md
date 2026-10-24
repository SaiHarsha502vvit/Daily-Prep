# Production Failure Modes — Real Incidents from Real Systems

> **Navigation**: [← JAVA MEMORY MODEL - Stack vs Heap](04_java_memory_model_stack_vs_heap.md) | [Chapter overview](../01a_Memory_Foundations.md) | [Bit-Level Operations - Complete Guide →](06_bit_level_operations_complete_guide.md)
> Page 5 of 7 in **Memory Foundations — Where Data Structures Live**


Theoretical complexity models the average case. Production fails on the tail. This section documents three named failure modes that have caused real-world incidents, with the mechanism and a concrete debugging step for each.

## Failure Mode 1: Cache Line False Sharing (Multi-threaded Contention)

**Name:** False sharing — `synchronized` blocks on adjacent array elements

**Mechanism:**
Modern x86 CPUs use a **64-byte cache line**. When two threads write to _different_ variables that happen to share the same cache line, the CPU hardware must invalidate the other thread's cache line copy and re-fetch it from memory — even though the threads are writing to completely different logical fields.

```java
public class FalseSharingDemo {
    // Two adjacent long fields — likely on the same cache line
    volatile long counterA = 0;
    volatile long counterB = 0;

    // Thread 1: writes to counterA
    public void incrementA() { counterA++; }

    // Thread 2: writes to counterB
    public void incrementB() { counterB++; }
}
```

On a 4-core JVM, running `incrementA()` and `incrementB()` concurrently can be **10-50x slower** than running them on separate cache lines. The Java HotSpot JVM's `AtomicLong` was famously vulnerable to this — adding `@sun.misc.Contended` (Java 8+) solved it by padding each field to its own cache line.

**Concrete Fix:**

```java
// Manual padding to prevent false sharing
public class PaddedCounters {
    volatile long counter = 0;
    long p1, p2, p3, p4, p5, p6, p7; // Padding to next cache line
}
```

Or in Java 8+, use `@jdk.internal.vm.annotation.Contended` on the class:

```java
@sun.misc.Contended
public class ContendedCounter {
    volatile long counter = 0;
}
```

**Debugging Step:** Use `perf c2c` (cache-to-cache) on Linux to identify false sharing:

```bash
perf c2c record -- ./java YourApplication
perf c2c report
```

Look for entries with high **LLC miss** rate and **RFO** (Read For Ownership) snoop traffic between CPUs.

---

## Failure Mode 2: Heap Fragmentation in Long-Running JVMs

**Name:** Heap fragmentation — heap memory exhausted despite total free space being sufficient

**Mechanism:**
Java's Old Generation collects garbage but does not compact memory as aggressively as it could — compaction pauses (Stop-The-World) must be bounded. Over time, object allocations and promotions leave gaps. If a 10 MB gap exists but every free block is smaller than your new object (say, 5 MB), the allocation fails with `OutOfMemoryError: Java heap space` even though 100 MB of free heap exists.

Concrete memory pressure numbers from a real service (Spring Boot microservice, 4 GiB heap, G1GC):

- After 2 days: **~180 MiB** marked as "free" but **only ~60 MiB** in contiguous chunks >1 MiB
- Allocation request for a 5 MiB buffer → `OutOfMemoryError`
- G1 triggered 3 **Full GC** events in 30 minutes trying to compact; each pause lasted 2-3 seconds
- Root cause: Aggressive use of `ByteBuffer.allocateDirect()` for short-lived network buffers, each leaving 256 KiB holes

**Concrete Fix:**

1. Monitor with `jstat -gcutil <pid> 1000` and watch **O** (old gen used %) vs. **OC** (old gen capacity). If `O/OC > 0.85` for sustained periods, trigger G1 proactively:
   ```bash
   -XX:InitiatingHeapOccupancyPercent=45  # Start concurrent GC at 45% heap
   -XX:G1HeapWastePercent=5               # Allow 5% waste before triggering GC
   ```
2. For direct buffers, use pooling (`io.netty.buffer.PooledByteBufAllocator`)
3. Profile heap with `jmap -histo:live <pid>` and look for **Lw** (lightweight) objects that indicate fragmentation holes

---

## Failure Mode 3: Stack Overflow from Deep Recursion (JVM Thread Stack)

**Name:** Stack overflow — `StackOverflowError` on deep recursive traversal

**Mechanism:**
JVM thread stacks are fixed-size (default 1 MiB on most Linux distributions). Each recursive call consumes stack space for:

- Local variables (primitive types: 1-8 bytes; reference types: 4-8 bytes)
- Return address (8 bytes on x64)
- Callee-saved registers (optional, ~16 bytes)

A recursive DFS on a tree with depth > 8,000 nodes (8,000 frames × ~128 bytes/frame = ~1 MiB) triggers `StackOverflowError` even though heap memory is plentiful. This is a **stack-constrained** failure, not a heap-constrained one.

Production incident pattern:

- A data pipeline processed a **skewed binary tree** (essentially a linked list, depth = 1,000,000)
- The service ran fine in staging (1,000 node dataset)
- Production crash on startup with `StackOverflowError` in `java.util.TreeMap.floorEntry()`
- Error log showed: `java.base/java.util.TreeMap.getEntry(TreeMap.java:375)`

**JVM `-Xss` flag** (stack size per thread):

```bash
# Default 1 MiB — increase to 4 MiB for deep-recursion workloads
java -Xss4m -jar your-service.jar
```

> **Caution:** Each thread gets its own stack. In a 200-thread server with 4 MiB stacks, that's 800 MiB reserved for stacks alone, even if threads are idle. Profile before increasing.

**Concrete Fix — Tail Call Optimization (approximation in JVM):**
Convert recursive DFS to iterative with an explicit stack object:

```java
public void dfsIterative(Node root) {
    Deque<Node> stack = new ArrayDeque<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        Node current = stack.pop();
        process(current);
        if (current.right != null) stack.push(current.right);
        if (current.left != null)  stack.push(current.left);
    }
}
```

This eliminates unbounded stack growth — the explicit `ArrayDeque` grows on the heap, not the stack, so `OutOfMemoryError` (heap) is at least catchable and recoverable.

**Debugging Step:** Run with `-Xss2m` initially, then attach `async-profiler` to capture stack trace depth:

```bash
async-profiler dump-traces.jfr --depth 20000 <pid>
```

Look for call chains with >10,000 frames — those indicate pathological recursion.

---

## BIT MANIPULATION - The Fastest Operations

### 💬 Study-Partner View — Bit Manipulation

**1. The bottom line:** Integers are rows of bits, and a few operators let you test, set, clear and flip individual bits in one CPU step.

**2. The textbook core:**

- `&` AND, `|` OR, `^` XOR, `~` NOT, `<<` left shift (×2ⁿ), `>>` arithmetic right shift (÷2ⁿ), `>>>` logical right shift.
- Test bit `i`: `(n >> i) & 1`. Set: `n | (1 << i)`. Clear: `n & ~(1 << i)`. Toggle: `n ^ (1 << i)`.
- `n & (n - 1)` clears the lowest set bit; `n & -n` isolates it; power of two ⇔ `n > 0 && (n & (n-1)) == 0`.
- XOR properties: `a ^ a = 0`, `a ^ 0 = a`.

**3. The real-world analogy:** A **bank of light switches**: each bit is one switch; AND/OR/XOR are rules for combining two panels of switches.

**4. Walkthrough:**

1. Is 12 (`1100`) a power of two? Compute `12 & 11` = `1100 & 1011` = `1000` ≠ 0 → no.
2. Is 8 (`1000`) a power of two? `8 & 7` = `1000 & 0111` = 0 → yes.
3. Count set bits of 13 (`1101`) with Kernighan: 13 → `13 & 12 = 12` → `12 & 11 = 8` → `8 & 7 = 0`: 3 steps → 3 bits.

> [!NOTE]
> **Quick check:** Why does `a ^ b ^ a` equal `b`? *XOR is commutative and associative, and `a ^ a = 0`.*

---

[← JAVA MEMORY MODEL - Stack vs Heap](04_java_memory_model_stack_vs_heap.md) | [Chapter overview](../01a_Memory_Foundations.md) | [Bit-Level Operations - Complete Guide →](06_bit_level_operations_complete_guide.md)
