# Chapter 06 — Memory Hierarchy & Caching

> [← 05 Processor Architecture & Pipelining](05_Processor_Architecture_Pipelining.md) | [Course Index](README.md) | [Next → 07 Linking, Loading & the Build Process](07_Linking_Loading_Build_Process.md)

---

## The Biggest Performance Problem in Modern Computing

Your CPU runs at 3.5 GHz — it can execute billions of operations per second. But DRAM (main memory) takes ~100 nanoseconds to respond to a request. At 3.5 GHz, 100ns = **350 CPU cycles** wasted waiting for data.

The CPU is 350× faster than main memory. If your program accesses random memory locations, it spends nearly all its time waiting for data, not computing.

**The solution:** A hierarchy of progressively smaller, faster, more expensive memories, so that frequently used data stays close to the CPU.

---

## The Memory Hierarchy

```
Speed (fast → slow):   Register > L1 > L2 > L3 > DRAM > SSD > HDD

                    ┌──────────┐   ← Registers: ~256KB, 0 cycles, in the CPU
                    │  L1 Cache│   ← 32-64 KB per core, 4-5 cycles, on-chip
                    │  L2 Cache│   ← 256 KB - 1 MB per core, 12-15 cycles, on-chip
                    │  L3 Cache│   ← 8-32 MB shared, 40-50 cycles, on-chip
                    │   DRAM   │   ← 8-128 GB, ~200-300 cycles, off-chip
                    │   SSD    │   ← TB, ~50,000 cycles
                    │   HDD    │   ← TB, millions of cycles (seek time ~5ms)
```

**Rough latency numbers (as CPU cycles at 3.5 GHz):**

| Level | Latency | Size (typical laptop) |
|-------|---------|----------------------|
| L1 data cache | 4 cycles | 32-64 KB |
| L2 cache | 12 cycles | 256 KB |
| L3 cache | 40 cycles | 8-12 MB |
| DRAM | 200-300 cycles | 8-32 GB |
| NVMe SSD | ~50,000 cycles | 256 GB - 4 TB |
| SATA SSD | ~100,000 cycles | same |

The ~70× gap between L3 cache and DRAM is what dominates performance for data-intensive programs.

---

## How Cache Works

A cache is a small, fast memory that stores **copies** of recently accessed main memory blocks.

**Cache line:** The unit of transfer between cache and DRAM. Typically **64 bytes** (8 × 8-byte words). When you access one byte, the entire 64-byte cache line containing it is fetched.

**Why 64 bytes?** Because accessing adjacent memory is nearly free (it's already in the cache line). This exploits **spatial locality** — the tendency for programs to access nearby memory locations.

### Cache Hit vs Miss

**Cache hit:** The data you need is in the cache. Served at cache speed (4-40 cycles depending on level).

**Cache miss:** The data is NOT in cache. Must fetch from the next level (DRAM or lower cache). Stalls the CPU for hundreds of cycles.

```
Access pattern: arr[0], arr[1], arr[2], ..., arr[7]  (8 ints = 32 bytes < 64 bytes)

On first access (arr[0]): MISS. Fetches 64-byte cache line containing arr[0]..arr[15].
On arr[1]: HIT (already in cache line!).
On arr[2]: HIT.
...
On arr[15]: HIT.
On arr[16]: Miss again (new cache line).

Result: 1 miss per 16 integers = 1/16 miss rate. Excellent!
```

---

## Locality: The Key Principle

Caches work because programs exhibit two forms of locality:

**Temporal locality:** Recently accessed data is likely to be accessed again soon.
- Example: Loop variable `i` accessed thousands of times.
- Cache keeps it hot in L1.

**Spatial locality:** Data near a recently accessed location is likely to be accessed soon.
- Example: Array traversal accesses consecutive elements.
- Cache line prefetches nearby data.

Programs that violate locality have poor cache behavior and run slow.

---

## Cache-Friendly vs Cache-Unfriendly Code

### Matrix Traversal: Row-Major vs Column-Major

A 2D array `int A[1000][1000]` is stored in memory in **row-major order**: A[0][0], A[0][1], ..., A[0][999], A[1][0], ..., A[999][999].

```c
// FAST: row-major access (sequential memory, cache-friendly)
for (int i = 0; i < 1000; i++) {
    for (int j = 0; j < 1000; j++) {
        sum += A[i][j];      // accesses A[0], A[1], A[2], ... (contiguous)
    }
}

// SLOW: column-major access (strided memory, cache-unfriendly)
for (int j = 0; j < 1000; j++) {
    for (int i = 0; i < 1000; i++) {
        sum += A[i][j];      // A[0][0], A[1][0], A[2][0] — 4000 bytes apart!
    }
}
```

**Performance difference:** 5-50× on large matrices. The column-major version has nearly 100% L1 cache miss rate.

Why? Each row is 1000 × 4 = 4000 bytes = 62.5 cache lines. The column-major access jumps 4000 bytes between accesses, missing the cache every time. The row-major access hits 16 elements per cache line.

### Linked List vs Array Traversal

```java
// Array: elements contiguous, cache-friendly
for (int i = 0; i < n; i++) sum += arr[i];

// Linked list: nodes scattered in memory, cache-unfriendly
for (Node node = head; node != null; node = node.next) sum += node.value;
```

For large n, linked list traversal can be 10-100× slower than array traversal because each node is a separate allocation, scattered across the heap. Each `node.next` pointer access is likely a cache miss.

This is why **Java ArrayList dramatically outperforms LinkedList** for iteration even though both are O(n). The difference is all in cache behavior.

### False Sharing in Multithreaded Code

Two threads writing to different variables that happen to share a cache line:

```java
// Thread 1 writes counter1, Thread 2 writes counter2
// If counter1 and counter2 are adjacent in memory, they share a cache line.

long[] counters = new long[2];   // counter[0] for thread 1, counter[1] for thread 2

// Thread 1:
while (running) counters[0]++;

// Thread 2:
while (running) counters[1]++;
```

Every write by Thread 1 to `counters[0]` invalidates the cache line in Thread 2's L1 cache (and vice versa). Both threads keep invalidating each other's cache → catastrophic performance.

**Fix:** Pad to cache line boundaries:
```java
long[] counters = new long[16];  // 16 × 8 bytes = 128 bytes = 2 cache lines
// Thread 1 uses counters[0], Thread 2 uses counters[8]
// Now they're on DIFFERENT cache lines — no sharing.
```

---

## Cache Placement: Direct-Mapped vs Set-Associative

When a cache line from DRAM needs to be stored in cache, WHERE does it go?

**Direct-mapped:** Each DRAM address maps to exactly ONE cache slot. Simple, fast. Conflict misses: two frequently accessed addresses that map to the same slot evict each other repeatedly.

**N-way set-associative:** Each DRAM address can go into ANY of N slots in a set. More flexible, reduces conflicts. L1 is typically 4-8 way; L2/L3 is 8-16 way.

**Fully associative:** Any address can go anywhere. Most flexible, no conflict misses, but too slow for large caches (hardware comparison of all tags).

**LRU eviction policy:** When a set is full, evict the Least Recently Used cache line. Other policies: LFU (least frequently used), pseudo-LRU (approximation for hardware efficiency).

---

## Hardware Prefetching

Modern CPUs detect sequential access patterns and **prefetch** cache lines before they're needed:

- Detect: `arr[0]`, `arr[1]`, `arr[2]` → "access stride = 64 bytes" → prefetch `arr[3]` into L2 before it's requested.
- Works for regular strides (sequential, stride-2, stride-8...).
- Fails for irregular patterns (random access, pointer chasing in linked lists).

**Software prefetching** (explicit hint to CPU):
```c
// C with GCC builtin
__builtin_prefetch(&arr[i + 16], 0, 1);   // prefetch 16 elements ahead
```

In Java, the JIT compiler sometimes generates prefetch instructions automatically.

---

## Understanding Cache Misses: The 3 Cs

**Compulsory (cold) misses:** First access to any data — unavoidable. Cache starts empty.

**Capacity misses:** Working set is larger than cache. Would miss even in a fully-associative, infinite-associativity cache. Fix: reduce working set size.

**Conflict misses:** Multiple addresses map to the same cache set, evicting each other. Fix: use higher-associativity cache, pad data to avoid collisions, or reorder accesses.

---

## Section Challenge

> ### Cache Performance Analysis
>
> You have an 8-way set-associative L1 data cache:
> - Capacity: 32 KB
> - Cache line size: 64 bytes
> - Number of sets: 32 KB / (8 ways × 64 bytes) = 64 sets
>
> A program processes a 2D array `int A[256][256]` (256 × 256 × 4 = 262,144 bytes = 256 KB).
>
> **Q1:** How many cache lines does the entire array occupy?
>
> **Q2:** Does the entire array fit in L1 cache?
>
> **Q3:** Row-major traversal of the array (inner loop over columns). For a single row, how many cache misses occur? For the full array?
>
> **Q4:** Column-major traversal (inner loop over rows). For a single column, how many cache misses occur? For the full array?
>
> **Q5 (Stretch):** You need to compute the transpose `B[i][j] = A[j][i]`. The naive implementation reads A column-by-column (cache unfriendly) or writes B column-by-column. Describe the **cache-oblivious** approach using recursive blocking to improve performance. What is the approximate cache miss ratio?

<details>
<summary>Full answers</summary>

```
Q1: Cache lines for A[256][256]

Total bytes: 256 × 256 × 4 = 262,144 bytes
Cache line size: 64 bytes
Number of cache lines: 262,144 / 64 = 4,096 cache lines

──────────────────────────────────────────────────────

Q2: Does it fit in L1?

L1 capacity: 32 KB = 32,768 bytes
Array size: 262,144 bytes

262,144 / 32,768 = 8× larger than L1 cache.

NO, the array does NOT fit in L1. Only 1/8 of it fits at any time.

──────────────────────────────────────────────────────

Q3: Row-major traversal — cache misses

One row = 256 ints × 4 bytes = 1,024 bytes = 16 cache lines.
First access to each cache line = 1 miss, then 15 more elements are hits.
Misses per row: 16.

Full array (256 rows):
  Total misses: 256 × 16 = 4,096 (one per cache line)
  Total accesses: 256 × 256 = 65,536
  Miss rate: 4,096 / 65,536 = 1/16 = 6.25%

Only 1 miss per 16 accesses — excellent. HW prefetcher handles this well.

──────────────────────────────────────────────────────

Q4: Column-major traversal — cache misses

One column = 256 ints, one from each row.
Between consecutive column elements: stride = 256 ints × 4 bytes = 1,024 bytes.
1,024 bytes >> 64 bytes (cache line size) → EVERY access is a separate cache line.

Does any cache line stay "warm" between accesses? No — 256 accesses to different
cache lines happen between column[0] and column[1] in the next column.
(256 rows × 4 bytes per row step = 1,024 byte stride between same-column elements.)

Actually: accessing A[0][0], A[1][0], A[2][0], ... A[255][0]:
  Each A[i][0] is on a different cache line (1,024-byte stride >> 64 bytes).
  The L1 cache can hold 32 KB / 64 = 512 cache lines.
  But 256 different rows need 256 different cache lines.
  Each accesses load A[i][*] cache line, then the next row loads a DIFFERENT line.
  Previous lines may be evicted.

For small caches: every access is a miss. Miss rate → nearly 100%.

Misses per column: 256 (one per access).
Total misses: 256 × 256 = 65,536 (every access is a miss!)
Miss rate: 65,536 / 65,536 = 100%

Time ratio (approximate): row-major is 16× faster than column-major.
(Each column-major access must wait 200 cycles; row-major waits 200 cycles every 16.)

──────────────────────────────────────────────────────

Q5: Cache-oblivious transpose

Naive B[j][i] = A[i][j]:
  Reading A row-major (fast): A[0][0], A[0][1]...
  Writing B column-major (slow): B[0][0], B[1][0]...
  OR:
  Reading A column-major (slow) and writing B row-major.
  Either way, one direction is cache-unfriendly.

TILING (loop blocking) approach:
  Choose block size b such that TWO b×b blocks fit in L1 cache:
    Each b×b block in A: b×b×4 bytes
    Each b×b block in B: b×b×4 bytes
    2×b²×4 ≤ 32,768 → b² ≤ 4,096 → b ≤ 64

  With b = 32 (conservative to fit other data):
  
  for (int ii = 0; ii < 256; ii += 32)
      for (int jj = 0; jj < 256; jj += 32)
          for (int i = ii; i < ii+32; i++)
              for (int j = jj; j < jj+32; j++)
                  B[j][i] = A[i][j];

  Within each 32×32 block:
    A[ii..ii+31][jj..jj+31] fits in cache (32×32×4 = 4 KB)
    B[jj..jj+31][ii..ii+31] fits in cache (4 KB)
    Total: 8 KB < 32 KB L1 ✓

  Cache misses for each block:
    A block: 32 rows × 2 cache lines per row (32×4/64 = 2) = 64 misses
    B block: similar = 64 misses
    Total per block: ~128 misses

  Number of blocks: (256/32)² = 64 blocks
  Total misses: 64 × 128 = 8,192

  Compare to naive column-major read: 65,536 misses
  Improvement: 8× fewer misses!

  CACHE-OBLIVIOUS approach (Frigo et al.):
  Recursively split the matrix in half until sub-problems fit in cache automatically.
  No explicit cache size parameter needed. Works optimally across all cache levels.
  
  def transpose(A, B, r1, c1, r2, c2, r, c):
      if r1 == r2 and c1 == c2:
          B[c1][r1] = A[r1][c1]
      elif (r2-r1) >= (c2-c1):
          mid = (r1 + r2) // 2
          transpose(A, B, r1, c1, mid, c2, r, c)
          transpose(A, B, mid+1, c1, r2, c2, r, c)
      else:
          mid = (c1 + c2) // 2
          transpose(A, B, r1, c1, r2, mid, r, c)
          transpose(A, B, r1, mid+1, r2, c2, r, c)
  
  This achieves O(N²/B) cache misses (B = cache line size) — optimal.
```

</details>

---

## Common Mistakes

**Mistake 1: Assuming "sequential" means "fast"**
- Sequential in LOGICAL order (e.g., index 0, 1, 2...) doesn't mean sequential in PHYSICAL memory if you're iterating by row in a column-major language (Fortran, MATLAB), or by column in a row-major language (C, Java).
- Always ask: "what order are the bytes in memory?"

**Mistake 2: Thinking cache is invisible to code**
- Cache is invisible to the programming model (you see a flat address space), but it's very visible in PERFORMANCE. Writing cache-friendly code is a real skill that can yield 10-100× speedups.

**Mistake 3: Using `HashMap` when array indexing would suffice**
- `HashMap` with pointer-chasing (each bucket is a linked list or tree of objects) has terrible cache behavior. An array with direct indexing loads contiguous cache lines. For small, fixed key spaces, prefer arrays.

**Mistake 4: Ignoring false sharing in concurrent code**
- Two threads writing to adjacent (cache-line sharing) variables causes constant invalidation and serialization. Benchmark before assuming threads are truly parallel.

---

## Connections

- **Chapter 05 — Processor:** Cache misses stall the pipeline. The memory stage of the pipeline is where cache hits/misses are detected. Out-of-order execution tries to hide cache miss latency.
- **Chapter 07 — Linking:** The instruction cache stores compiled code. Instruction cache misses (rare for small programs, common for huge ones) also stall the pipeline.
- **Chapter 09 — Virtual Memory:** The TLB (Translation Lookaside Buffer) is a cache for address translations. TLB misses add to memory access latency.
- **Chapter 11 — Threads:** Cache coherence (keeping caches consistent across CPU cores) is the fundamental challenge in multi-core programming.

---

> [← 05 Processor Architecture & Pipelining](05_Processor_Architecture_Pipelining.md) | [Course Index](README.md) | [Next → 07 Linking, Loading & the Build Process](07_Linking_Loading_Build_Process.md)
