# Chapter 10 — Dynamic Memory & the Heap

> [← 09 Virtual Memory](09_Virtual_Memory.md) | [Course Index](README.md) | [Next → 11 Threads & Synchronization](11_Threads_Synchronization.md)

---

## The Problem: Memory of Unknown Size

At compile time, you don't know how many items a user will put in a list. You don't know how large a file they'll open. You don't know how deep their document tree will be.

Stack memory (local variables) is released when a function returns — you can't return a pointer to a stack variable and expect it to survive. Stack size is also limited (typically 1-8 MB per thread).

**The heap** is a large pool of memory that programs can request at runtime and release when done. It persists across function calls. Understanding how it works explains:
- Why `malloc()` is sometimes slow even for small allocations
- What "heap fragmentation" means and why it kills long-running servers
- Why `free(ptr + 10)` corrupts memory instead of freeing 10 bytes in
- The source of use-after-free, double-free, and heap buffer overflow bugs
- Why Java's GC pauses happen and how generational GC avoids most of them

---

## The Allocator's Job

The memory allocator sits between your program and the OS:

```
Your program: malloc(100)    →  allocator returns a 100-byte block
Your program: free(ptr)      →  allocator reclaims the block for future use

Allocator ↔ OS:
  OS gives the allocator large chunks of memory (via mmap/brk).
  Allocator subdivides and tracks those chunks.
  Allocator asks for more from OS only when its pool is exhausted.
```

The allocator must:
1. **Allocate** a contiguous block of at least `size` bytes quickly.
2. **Free** a block given only its start pointer (NO size argument to `free()`!).
3. **Track** which blocks are free and which are in use.
4. **Minimize fragmentation** so memory isn't wasted.

---

## How malloc() Knows the Size to Free

You call `free(ptr)` without telling it the size. How does the allocator know how many bytes to reclaim?

**Answer:** It stores metadata just before the allocated block.

```
Heap memory layout:

  [header: size | in-use flag] [user data: 100 bytes] [header: ...] [user data: ...]
         ↑ 8-16 bytes           ↑
         hidden from user       ← ptr returned by malloc()

malloc(100) returns a pointer to the USER DATA region.
The header (at ptr - 8 or ptr - 16) stores the block size.
free(ptr) reads the header at ptr - 8 to get the size, then marks it free.
```

**This is why `free(ptr + 10)` is undefined behavior** — it reads the wrong location for the header and corrupts memory. The allocator finds junk metadata and operates on garbage.

---

## Free List Management

The allocator maintains a **free list** — a list of available blocks. Several strategies:

### Implicit Free List (simple, educational)

```
Entire heap is a sequence of blocks, each with a header:
[size|alloc] [data...] [size|alloc] [data...] [size|alloc] [data...] ...

alloc = 1 means "in use"
alloc = 0 means "free"

malloc(100): scan from start, find first free block with size ≥ 100.
free(ptr):   set alloc = 0.

Problem: Allocation is O(n) — must scan entire heap. Slow for large heaps.
```

**Coalescing:** Adjacent free blocks should be merged to reduce fragmentation:
```
Before free(B):  [A: 100, in-use] [B: 200, in-use] [C: 50, free]
After free(B):   [A: 100, in-use] [B+C: 250, free]   ← coalesced!
```

Without coalescing, you end up with many small free blocks that can't satisfy a large request.

### Explicit Free List

Maintain a linked list of ONLY free blocks (via pointers stored in the free blocks' data region — free blocks don't need their data):

```
free block:  [header: size] [next_free ptr] [prev_free ptr] [padding...] [footer: size]

free list:  free_list_head → block_A → block_C → block_E → NULL
```

`malloc(100)`: traverse only free blocks — much faster than scanning the entire heap.
`free(ptr)`: insert into free list, coalesce neighbors.

### Segregated Free Lists (used by modern allocators: jemalloc, tcmalloc)

Separate free lists for each size class:
```
Size class 8:   free list of 8-byte blocks
Size class 16:  free list of 16-byte blocks
Size class 32:  ...
Size class 64:  ...
Size class 128: ...
Large sizes:    one list (or best-fit from a tree)
```

`malloc(10)` → round up to 16, check size-class-16 list, pop head → O(1).
`free(ptr)` → determine size class from header, push to front of list → O(1).

**This is approximately how production allocators (glibc malloc, jemalloc) work.**

---

## Placement Policies

When multiple free blocks can satisfy a request, which one to use?

**First-fit:** Use the first free block that's large enough. Fast. Tends to clutter the beginning of the heap with small fragments.

**Best-fit:** Use the smallest free block that's large enough. Minimizes leftover space. O(n) search (or O(log n) with a sorted structure). Better utilization.

**Next-fit:** Like first-fit but starts searching from where the last allocation was, rather than from the beginning. Better temporal locality.

Modern allocators use size-class lists for small allocations (O(1)) and best-fit with a red-black tree for large allocations.

---

## Fragmentation: The Long-Term Problem

**Internal fragmentation:** Wasted space within an allocated block because the allocator rounded up to the nearest size class.
```
malloc(17) → allocator gives you a 32-byte block (next size class)
15 bytes wasted inside the block.
```

**External fragmentation:** Total free memory is sufficient, but no single contiguous block is large enough.
```
Heap state (free blocks marked F):
[F: 100] [USED: 50] [F: 100] [USED: 50] [F: 100]
Total free: 300 bytes.
malloc(200) FAILS — no single free block is 200 bytes!

External fragmentation increases as long-running programs allocate and free
blocks of varying sizes over time.
```

**Why servers restart:** Long-running Java services accumulate heap fragmentation. Even if total free memory is ample, the GC can't compact the heap efficiently without pausing for a long time. Periodic restarts restore a clean heap.

Modern allocators fight fragmentation with:
- Size classes (reduce internal fragmentation to < 2× per allocation)
- Coalescing (merge adjacent free blocks → reduce external fragmentation)
- Compaction (GC can move live objects → eliminate external fragmentation; not available in C/C++)

---

## Memory Errors: The Classic C Bugs

### Use-After-Free

```c
int* p = malloc(sizeof(int));
*p = 42;
free(p);
*p = 100;   // USE AFTER FREE! p is "dangling pointer"
            // The allocator may have given this memory to another malloc()
            // Corrupts another allocation's data!
```

**Danger:** May work for a while (allocator hasn't reused the block yet), then fails mysteriously much later. Extremely hard to debug.

### Double-Free

```c
int* p = malloc(sizeof(int));
free(p);
free(p);   // DOUBLE FREE!
           // Corrupts allocator metadata. Usually crashes with "heap corruption"
           // or enables exploitation (see: heap exploit techniques)
```

### Heap Buffer Overflow

```c
int* arr = malloc(10 * sizeof(int));   // 40 bytes
arr[10] = 42;   // OVERFLOW! Writes to the next block's header
                // Corrupts allocator metadata → crash or heap exploit
```

### Memory Leak

```c
while (true) {
    char* buf = malloc(1024);
    process(buf);
    // forgot free(buf)! Memory leaks 1 KB per iteration.
    // Long-running server → eventually OOM.
}
```

**Detection tools:**
- Valgrind (memcheck): instruments every malloc/free, catches use-after-free, leaks
- AddressSanitizer (ASan): compiler instrumentation, ~2× slowdown but catches real-time
- LeakSanitizer (LSan): detects memory leaks at program exit

---

## Garbage Collection: Automatic Memory Management

Languages like Java, Python, Go, and JavaScript delegate memory management to a **garbage collector** — an automatic system that reclaims unreachable memory.

### Reference Counting (Python, Swift ARC, Rust Rc)

Each object counts how many references point to it. When the count drops to 0, the object is freed immediately.

```python
obj = MyObject()   # refcount = 1
other = obj        # refcount = 2
del obj            # refcount = 1
del other          # refcount = 0 → immediately freed!
```

**Problem:** Reference cycles.
```python
a = Node(); b = Node()
a.next = b; b.next = a   # a.refcount = 2 (from b.next and b)
                          # b.refcount = 2
del a; del b              # a.refcount = 1 (from b.next), b.refcount = 1
                          # Neither reaches 0! Leaked forever.
```

Python solves this with a supplementary cyclic GC that runs periodically to detect cycles.

### Mark-and-Sweep (Java, Go, JavaScript)

**Mark phase:** Starting from roots (stack, globals, registers), traverse all reachable objects and mark them.

**Sweep phase:** Scan entire heap; free any unmarked object.

```
Roots: [stack vars: A, B] [globals: C]

A → D → E
B → F
C → D (already marked)

Reachable: A, B, C, D, E, F
Unreachable (not reachable from any root): G, H, I → freed
```

**Stop-the-world (STW) pause:** During mark-and-sweep, the application must pause — objects can't move during traversal. In early Java, GC pauses of seconds were common for large heaps.

### Generational Garbage Collection (Java G1GC, ZGC, .NET)

Key observation: **most objects die young** (the "generational hypothesis"). 90%+ of objects created in a typical program become unreachable within milliseconds.

```
Heap divided into generations:
  Young generation (Eden + Survivor spaces): new objects go here
  Old generation (Tenured): objects that survive multiple GC cycles

Young GC (minor GC): runs frequently (every few seconds or milliseconds)
  Collect only the young generation.
  Young objects are densely packed → fast to scan.
  Short pause: ~10ms.

Old GC (major/full GC): runs rarely
  Collect the entire heap.
  Expensive → longer pause.
  
JVM promotion: object that survives 8+ young GCs → promoted to old gen.
```

**Why generational GC reduces pause times:**
- 90% of garbage is collected in cheap young GC (~10ms).
- Old gen grows slowly (only long-lived objects) → full GC rarely needed.
- G1GC (Java 9+ default): targets <200ms max pause even on 32 GB heaps.
- ZGC (Java 15+ production): concurrent marking, <10ms pauses on multi-TB heaps.

---

## Section Challenge

> ### Allocator Trace
>
> A minimal bump-pointer allocator maintains:
> - `heap_start = 0x1000`
> - `next_free = heap_start` (pointer to next available byte)
> - `heap_end = 0x2000` (4 KB of heap)
>
> Allocation: return `next_free`, advance `next_free` by requested size (aligned to 8 bytes). No `free()` support.
>
> Trace these calls:
> ```c
> int* a = malloc(4);    // 4-byte int
> char* b = malloc(13);  // 13 bytes  
> double* c = malloc(8); // 8-byte double
> int* d = malloc(4);    // 4-byte int
> ```
>
> **Q1:** What address does each malloc() return? What is `next_free` after each call? (Round each allocation up to 8-byte alignment.)
>
> **Q2:** What are the advantages and disadvantages of a bump-pointer allocator? Name one real system that uses one.
>
> **Q3:** This allocator has no `free()`. Describe how you would add a "reset" operation that frees ALL allocated memory at once. What pattern of usage does this support?
>
> **Q4:** A production allocator (jemalloc) handles `malloc(16)` in a tight loop one million times then frees all pointers. Will it be faster to allocate the million blocks or to free them? Why?
>
> **Q5 (Stretch):** Explain why the following Java code might NOT leak memory even though it appears to create circular references:
> ```java
> class Node {
>     Node next;
>     Node(Node n) { this.next = n; }
> }
> Node a = new Node(null);
> Node b = new Node(a);
> a.next = b;   // circular: a.next=b, b.next=a
> a = null;
> b = null;
> ```

<details>
<summary>Full answers</summary>

```
Q1: Bump-pointer trace

8-byte alignment: round each size up to nearest multiple of 8.

malloc(4):
  Returns: next_free = 0x1000
  Allocated: 4 bytes → rounded to 8 bytes
  next_free after: 0x1000 + 8 = 0x1008
  a = 0x1000

malloc(13):
  Returns: next_free = 0x1008
  Allocated: 13 bytes → rounded to 16 bytes (next multiple of 8)
  next_free after: 0x1008 + 16 = 0x1018
  b = 0x1008

malloc(8):
  Returns: next_free = 0x1018
  Allocated: 8 bytes → stays 8 bytes
  next_free after: 0x1018 + 8 = 0x1020
  c = 0x1018

malloc(4):
  Returns: next_free = 0x1020
  Allocated: 4 bytes → rounded to 8 bytes
  next_free after: 0x1020 + 8 = 0x1028
  d = 0x1020

Summary:
  a = 0x1000, b = 0x1008, c = 0x1018, d = 0x1020
  next_free = 0x1028 (40 bytes of heap used)

──────────────────────────────────────────────────────

Q2: Bump-pointer advantages and disadvantages

ADVANTAGES:
  Extremely fast: O(1) allocation (just increment a pointer + bounds check)
  No per-object metadata overhead (no headers needed)
  Excellent cache behavior: objects allocated together are adjacent in memory
  Simple implementation: ~10 lines of code
  Thread-local bump pointers: perfect for thread-local allocation (no locking)

DISADVANTAGES:
  No free() — once allocated, memory cannot be individually reclaimed
  Memory is only reclaimed by resetting the entire arena
  Wastes memory if not all objects live the same lifetime

REAL SYSTEMS THAT USE BUMP-POINTER:
  - JVM young-generation heap (Eden space uses bump-pointer allocation)
  - Arena allocators in compilers (clang/LLVM AST nodes, allocated for the
    duration of one compilation, then entire arena freed)
  - Protocol buffer parsing (parse into arena, process, free entire arena)
  - WebAssembly linear memory in minimal runtimes

──────────────────────────────────────────────────────

Q3: Arena reset

Add a single function:
  void arena_reset() { next_free = heap_start; }

This "frees" ALL memory at once by simply resetting the allocation pointer.
All pointers returned by previous malloc() calls are now invalid (dangling).

Pattern: ARENA ALLOCATION (also called "region" or "pool" allocation).
  Allocate many objects.
  Use them together.
  Free ALL of them at once when done.
  
Use cases:
  - Request handler in a web server: allocate all request-scoped objects into 
    arena, process request, reset arena. No individual free() needed.
  - Compiler pass: allocate all intermediate nodes, run the pass, reset.
  - Game frame: allocate all per-frame data, render, reset for next frame.
  
Arena allocation is 10-100× faster than per-object malloc/free for batch workloads
because: no free list management, perfect cache locality, no fragmentation.

──────────────────────────────────────────────────────

Q4: Allocation vs deallocation speed (jemalloc, 1 million malloc(16))

malloc(16) x 1,000,000:
  jemalloc size class for 16 bytes: takes from a per-thread cache (tcache).
  tcache is a thread-local free list refilled from thread-local magazines.
  No locking for cached allocations.
  Speed: very fast, ~20-50ns per allocation if cache is hot.
  For 1M allocations: cache will be replenished from larger slab multiple times,
  but still very fast overall.

free(ptr) x 1,000,000 (all at once):
  Each free() returns a 16-byte block to the tcache.
  tcache has a limited capacity → periodically flushes back to arena.
  free() also reads the header/metadata to determine size class.
  
  Generally, allocation and deallocation are similar in speed for modern
  allocators operating on cached size classes. Both are O(1).
  
  Slight edge to allocation: free() must also check for coalescing
  opportunities (though jemalloc's segregated lists don't coalesce within
  size classes). Freeing may flush tcache to arena → slightly more work.

  Practically: on a tight loop, both are ~10-50 ns each.
  Neither is the bottleneck; cache effects on the allocated objects dominate.

──────────────────────────────────────────────────────

Q5: Java circular references and GC

Java uses a TRACING garbage collector (mark-and-sweep, generational GC).
It does NOT use reference counting.

Trace:
  a = new Node(null)   → allocates Node-A
  b = new Node(a)      → allocates Node-B, B.next = A
  a.next = b           → A.next = B  (circular reference)

After a = null; b = null:
  No stack/register/global variables reference A or B.
  From GC's perspective: starting from roots (stack: a=null, b=null),
  can we REACH Node-A or Node-B? NO.
  Mark phase: A and B are not marked (unreachable).
  Sweep phase: A and B are freed.

The CYCLE (A.next=B, B.next=A) is irrelevant to the tracing GC.
Tracing GC finds everything UNREACHABLE from roots — it doesn't care about
cycles among unreachable objects.

Contrast with Python's reference counting:
  Node-A refcount: 2 (from original 'a' + B.next)
  After a=null: A refcount = 1 (from B.next still)
  Node-B refcount: 2 (from original 'b' + A.next)
  After b=null: B refcount = 1 (from A.next still)
  Neither drops to 0 → leaked! Python needs its CYCLIC GC to fix this.

Java: no leak. The cyclic GC (part of full mark-and-sweep) handles this
automatically as part of its normal operation.
```

</details>

---

## Common Mistakes

**Mistake 1: Returning a pointer to a local variable**
```c
int* bad_function() {
    int local = 42;
    return &local;   // DANGLING POINTER. local lives on the stack,
                     // which is freed when the function returns.
}
// Caller uses the returned pointer → undefined behavior
```
Use `malloc()` if you need heap-allocated memory that outlives the function.

**Mistake 2: Reading `valgrind` as "slow for production" and ignoring it**
- Valgrind's 10-100× slowdown makes it unusable for production, but it's invaluable during development. AddressSanitizer (`-fsanitize=address`) has ~2× slowdown and is often run in CI. Memory safety bugs are exploitable — find them early.

**Mistake 3: Trusting that `free()` returns memory to the OS**
- `free()` returns memory to the allocator's pool, NOT immediately to the OS. The allocator holds onto it to satisfy future `malloc()` calls. A process's RSS (resident set size) may not decrease after `free()`. `malloc_trim()` or `madvise(MADV_FREE)` can hint to the OS.

**Mistake 4: Assuming Java/Python have zero memory management concerns**
- GC doesn't prevent all leaks. Collections (HashMaps, ArrayLists) holding references to objects prevent GC from collecting them — a logical leak. Java `WeakReference` and Python `weakref` allow GC to collect objects even when a reference exists if only weak references remain.

---

## Connections

- **Chapter 09 — Virtual Memory:** `malloc()` calls `mmap()` or `brk()` to get large chunks from the OS. Individual allocations are then sub-divided by the allocator. Virtual memory provides the flat address space that malloc() operates on.
- **Chapter 11 — Threads:** `malloc()` must be thread-safe. Modern allocators use per-thread caches (tcache in glibc, tcmalloc) to avoid lock contention. A single global free list with a mutex would serialize all allocations across threads.
- **Chapter 12 — I/O:** File I/O buffers (fopen/fread in C, BufferedInputStream in Java) are heap-allocated. Understanding heap layout explains why buffer sizes (8 KB, 64 KB) are chosen to fit cache lines and amortize system call overhead.

---

> [← 09 Virtual Memory](09_Virtual_Memory.md) | [Course Index](README.md) | [Next → 11 Threads & Synchronization](11_Threads_Synchronization.md)
