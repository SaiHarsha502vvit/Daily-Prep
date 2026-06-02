**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01b_Arrays.md)

---

# 📚 Data Structures: Deep Dive Guide

## Understanding DS from Core - Behavior, Nature & Implementation

## 5W1H — Why This Chapter?

> WHAT: The hardware realities (CPU cache, memory hierarchy, byte structure) that dictate software performance.
>
> WHY: You cannot deeply understand *why* an array is faster than a linked list for iteration without understanding cache lines and contiguous memory. Data structures are abstractions over physical RAM.
>
> WHO: Any developer transitioning from writing "code that works" to writing "code that scales."
>
> WHEN: Before studying any specific data structure, to build a mental model of the machine it runs on.
>
> HOW: By dissecting the memory hierarchy, stack vs heap allocation, and bit-level operations.

---




# 🔬 PART 0A: HOW COMPUTER MEMORY ACTUALLY WORKS (The Foundation)


BEFORE YOU LEARN DATA STRUCTURES - UNDERSTAND THE MACHINE


Why does this matter?
─────────────────────
Every data structure exists in MEMORY. If you don't understand memory,
you'll never truly understand why:
• Arrays are fast for random access
• LinkedLists are slow for random access
• HashMaps are O(1) but use more memory
• Cache-friendly code runs 100x faster

Let's go DEEP into how computers actually work!

## THE MEMORY HIERARCHY - Why Some Operations Are Faster

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY HIERARCHY (Speed vs Size)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                          ┌─────────────┐                                        │
│                          │  CPU CORE   │                                        │
│                          └──────┬──────┘                                        │
│                                 │                                               │
│    FASTEST    ┌─────────────────▼─────────────────┐                             │
│    (~1 cycle) │     REGISTERS (64 bytes)          │  ← Variables being computed │
│               │     Access: 0.5 nanoseconds       │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                               │
│    VERY FAST  ┌─────────────────▼─────────────────┐                             │
│    (~4 cycles)│     L1 CACHE (32KB per core)      │  ← Hot data (current loop)  │
│               │     Access: 1 nanosecond          │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                               │
│    FAST       ┌─────────────────▼─────────────────┐                             │
│   (~12 cycles)│     L2 CACHE (256KB per core)     │  ← Recent data              │
│               │     Access: 4 nanoseconds         │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                               │
│    MODERATE   ┌─────────────────▼─────────────────┐                             │
│   (~40 cycles)│     L3 CACHE (8MB shared)         │  ← Shared between cores     │
│               │     Access: 15 nanoseconds        │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                               │
│    SLOW       ┌─────────────────▼─────────────────┐                             │
│  (~200 cycles)│     MAIN MEMORY / RAM (16GB)      │  ← All your program data    │
│               │     Access: 100 nanoseconds       │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                               │
│    VERY SLOW  ┌─────────────────▼─────────────────┐                             │
│  (~millions)  │     SSD / DISK (1TB)              │  ← Persistent storage       │
│               │     Access: 100,000 nanoseconds   │                             │
│               └─────────────────────────────────────┘                           │
│                                                                                 │
│  KEY INSIGHT:                                                                   │
│  ─────────────                                                                  │
│  RAM is 100x SLOWER than L1 cache!                                              │
│  Disk is 1000x SLOWER than RAM!                                                 │
│                                                                                 │
│  This is why CACHE-FRIENDLY data structures matter so much!                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```




🔬 **Section Challenge — THE MEMORY HIERARCHY - Why Some Operations Are Faster**

**Challenge 1 (Reasoning):** L1 cache is only 32KB but RAM is 16GB. When you iterate an `int[1000]` array sequentially, why does it feel almost as fast as if the entire array were in registers?
<details><summary>Answer</summary>

Spatial locality + hardware prefetching. When the CPU accesses `arr[0]`, it loads a 64-byte cache line containing `arr[0]` through `arr[15]` (16 ints) into L1. The next 15 accesses are cache hits (~1ns each instead of ~100ns). Modern CPUs also detect sequential access patterns and *prefetch* the next cache line before you even ask for it. So for a sequential scan, only every 16th access is a cache miss — the rest are effectively free. This is why arrays with O(n) linear scan often outperform hash-based O(1) lookups for small n.
</details>

**Challenge 2 (Reasoning):** You have two programs: Program A iterates a `LinkedList<Integer>` of 1M nodes. Program B iterates an `int[]` of 1M elements. Both do the same O(n) work per element. Program B finishes 50-100x faster. Why?
<details><summary>Answer</summary>

Cache miss rate. `int[]` is contiguous in memory — one cache line loads 16 consecutive ints. LinkedList nodes are scattered across the heap (each node is a separate heap allocation at a random address). Every `node = node.next` pointer dereference is a cache miss (~100-200 CPU cycles penalty). Additionally, each LinkedList node carries ~48 bytes of overhead (object header, prev/next pointers, boxed Integer object) vs 4 bytes per element in `int[]`. The combination of cache misses + memory bloat makes LinkedList catastrophically slower for sequential iteration.
</details>


## HOW MEMORY IS ORGANIZED (Addresses & Bytes)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY ADDRESS SPACE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Memory is like a HUGE array of bytes, each with an ADDRESS                     │
│                                                                                 │
│  ADDRESS        CONTENT (1 byte = 8 bits)                                       │
│  ────────────────────────────────────────────                                   │
│  0x00000000     [01001010]  ← First byte of RAM                                 │
│  0x00000001     [11010010]                                                      │
│  0x00000002     [00001111]                                                      │
│  0x00000003     [10101010]                                                      │
│  ...                                                                            │
│  0xFFFFFFFF     [????????]  ← Last byte (in 32-bit system)                      │
│                                                                                 │
│                                                                                 │
│  DATA TYPE SIZES (Java):                                                        │
│  ───────────────────────                                                        │
│  byte     = 1 byte  = 8 bits   → Range: -128 to 127                             │
│  short    = 2 bytes = 16 bits  → Range: -32,768 to 32,767                       │
│  int      = 4 bytes = 32 bits  → Range: -2.1 billion to 2.1 billion             │
│  long     = 8 bytes = 64 bits  → Range: ±9.2 quintillion                        │
│  float    = 4 bytes = 32 bits  → ~7 decimal digits precision                    │
│  double   = 8 bytes = 64 bits  → ~15 decimal digits precision                   │
│  char     = 2 bytes = 16 bits  → Unicode character                              │
│  boolean  = 1 byte* = 8 bits   → true or false                                  │
│  reference= 4 or 8 bytes       → Points to object in heap                       │
│                                                                                 │
│  * JVM may use 1 bit internally but allocates 1 byte                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HOW AN int IS STORED IN MEMORY                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  int x = 42;                                                                    │
│                                                                                 │
│  Binary of 42:  00000000 00000000 00000000 00101010                             │
│                 ────────┬────────┬────────┬────────                             │
│                   Byte 3  Byte 2  Byte 1  Byte 0                                │
│                                                                                 │
│  In Memory (Little Endian - Intel/AMD):                                         │
│  ┌──────────────────────────────────────────────────┐                           │
│  │ Address  │ 0x1000 │ 0x1001 │ 0x1002 │ 0x1003 │  │                            │
│  │ Content  │  0x2A  │  0x00  │  0x00  │  0x00  │  │                            │
│  │          │ (42)   │  (0)   │  (0)   │  (0)   │  │                            │
│  └──────────────────────────────────────────────────┘                           │
│              ↑                                                                  │
│              Least Significant Byte stored FIRST                                │
│                                                                                 │
│  In Memory (Big Endian - Network Order):                                        │
│  ┌──────────────────────────────────────────────────┐                           │
│  │ Address  │ 0x1000 │ 0x1001 │ 0x1002 │ 0x1003 │  │                            │
│  │ Content  │  0x00  │  0x00  │  0x00  │  0x2A  │  │                            │
│  │          │  (0)   │  (0)   │  (0)   │ (42)   │  │                            │
│  └──────────────────────────────────────────────────┘                           │
│                                              ↑                                  │
│              Most Significant Byte stored FIRST                                 │
│                                                                                 │
│  WHY DOES THIS MATTER?                                                          │
│  • Network protocols use Big Endian                                             │
│  • Your CPU likely uses Little Endian                                           │
│  • Must convert when sending data over network!                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## JAVA MEMORY MODEL - Stack vs Heap

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        JAVA MEMORY LAYOUT                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  When JVM runs your program, memory is divided into:                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           JVM MEMORY                                     │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │                    METHOD AREA                                    │  │    │
│  │  │  • Class metadata (methods, fields)                              │  │     │
│  │  │  • Static variables                                              │  │     │
│  │  │  • Constant pool (string literals, numbers)                      │  │     │
│  │  │  • Method bytecode                                               │  │     │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │                         HEAP                                      │  │    │
│  │  │  • All objects live here                                         │  │     │
│  │  │  • Arrays are objects!                                           │  │     │
│  │  │  • Garbage collected                                             │  │     │
│  │  │  • Shared between all threads                                    │  │     │
│  │  │                                                                   │  │    │
│  │  │  Divided into:                                                   │  │     │
│  │  │  ┌─────────────────┬──────────────────┬────────────────────┐    │  │      │
│  │  │  │ Young Gen       │ Old Gen           │ Metaspace          │    │  │     │
│  │  │  │ (Eden+Survivor) │ (Long-lived objs) │ (Class metadata)   │    │  │     │
│  │  │  └─────────────────┴──────────────────┴────────────────────┘    │  │      │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                          │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │     │
│  │  │   STACK (Thread1) │  │   STACK (Thread2) │  │   STACK (Thread3) │   │     │
│  │  │                   │  │                   │  │                   │   │     │
│  │  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────┐  │   │     │
│  │  │  │ Frame 3     │  │  │  │ Frame 2     │  │  │  │ Frame 1     │  │   │     │
│  │  │  │ (method c)  │  │  │  │ (method b)  │  │  │  │ (method a)  │  │   │     │
│  │  │  ├─────────────┤  │  │  ├─────────────┤  │  │  ├─────────────┤  │   │     │
│  │  │  │ Frame 2     │  │  │  │ Frame 1     │  │  │  │             │  │   │     │
│  │  │  │ (method b)  │  │  │  │ (main)      │  │  │  │             │  │   │     │
│  │  │  ├─────────────┤  │  │  ├─────────────┤  │  │  │             │  │   │     │
│  │  │  │ Frame 1     │  │  │  │             │  │  │  │             │  │   │     │
│  │  │  │ (main)      │  │  │  │             │  │  │  │             │  │   │     │
│  │  │  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────┘  │   │     │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘   │     │
│  │                                                                          │   │
│  │  Each thread has its OWN stack!                                         │    │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                     STACK FRAME - INSIDE VIEW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  When you call a method:                                                        │
│                                                                                 │
│  public int calculate(int a, int b) {                                           │
│      int sum = a + b;        // Local variable                                  │
│      int[] arr = new int[5]; // Reference on stack, array on HEAP               │
│      return sum;                                                                │
│  }                                                                              │
│                                                                                 │
│                                                                                 │
│  STACK FRAME for calculate():                                                   │
│  ┌───────────────────────────────────────────────────────────────┐              │
│  │                                                               │              │
│  │  HIGH ADDRESS (top of stack)                                  │              │
│  │  ┌─────────────────────────────────────────────────────────┐ │               │
│  │  │  Return Address                                         │ │               │
│  │  │  (where to go after method ends)                        │ │               │
│  │  ├─────────────────────────────────────────────────────────┤ │               │
│  │  │  Previous Frame Pointer                                 │ │               │
│  │  │  (link to caller's frame)                               │ │               │
│  │  ├─────────────────────────────────────────────────────────┤ │               │
│  │  │  Local Variable: sum = 15                              │ │                │
│  │  │  (4 bytes for int)                                      │ │               │
│  │  ├─────────────────────────────────────────────────────────┤ │               │
│  │  │  Local Variable: arr = 0x00ABC123                      │ │                │
│  │  │  (reference pointing to heap)──────────────────────┐   │ │                │
│  │  ├─────────────────────────────────────────────────────┤   │ │               │
│  │  │  Parameter: a = 5                                   │   │ │               │
│  │  │  (4 bytes for int)                                  │   │ │               │
│  │  ├─────────────────────────────────────────────────────┤   │ │               │
│  │  │  Parameter: b = 10                                  │   │ │               │
│  │  │  (4 bytes for int)                                  │   │ │               │
│  │  └─────────────────────────────────────────────────────┘   │ │               │
│  │  LOW ADDRESS (bottom of frame)                         │   │ │               │
│  │                                                        │   │ │               │
│  └────────────────────────────────────────────────────────│───┘ │               │
│                                                           │     │               │
│                                                           ▼     │               │
│  HEAP:                                                          │               │
│  ┌─────────────────────────────────────────────────────────┐   │                │
│  │  Address 0x00ABC123:                                    │◄──┘                │
│  │  ┌───────────────────────────────────────────────────┐ │                     │
│  │  │ Object Header (12 bytes)                          │ │                     │
│  │  │  • Mark Word (8 bytes): GC info, hash, locks     │ │                      │
│  │  │  • Class Pointer (4 bytes): points to int[].class│ │                      │
│  │  ├───────────────────────────────────────────────────┤ │                     │
│  │  │ Array Length (4 bytes): 5                         │ │                     │
│  │  ├───────────────────────────────────────────────────┤ │                     │
│  │  │ arr[0] = 0  (4 bytes)                            │ │                      │
│  │  │ arr[1] = 0  (4 bytes)                            │ │                      │
│  │  │ arr[2] = 0  (4 bytes)                            │ │                      │
│  │  │ arr[3] = 0  (4 bytes)                            │ │                      │
│  │  │ arr[4] = 0  (4 bytes)                            │ │                      │
│  │  └───────────────────────────────────────────────────┘ │                     │
│  │                                                        │                     │
│  │  Total: 12 + 4 + (5×4) = 36 bytes                     │                      │
│  │  (may be padded to 40 bytes for alignment)            │                      │
│  └────────────────────────────────────────────────────────┘                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```



🔬 **Section Challenge — JAVA MEMORY MODEL - Stack vs Heap**

**Challenge 1 (Reasoning):** `int[] arr = new int[5];` — the variable `arr` lives on the stack but the actual array lives on the heap. If you pass `arr` to a method `modify(int[] a)`, and inside that method you do `a[0] = 99;`, does the caller see the change? What if you do `a = new int[10];` instead?
<details><summary>Answer</summary>

`a[0] = 99` — YES, caller sees it. The reference `a` is a copy of `arr`, but both point to the SAME heap object. Modifying the object through either reference affects the shared data. `a = new int[10]` — NO, caller does NOT see it. This reassigns the local copy `a` to point to a new heap object. The caller's `arr` still points to the original array. Java is always pass-by-value — but for objects, the "value" being passed is the reference (memory address), not the object itself.
</details>


## WHY ARRAYS ARE FAST - Memory Layout Explained




## Array Memory Layout - The Speed Secret

int[] arr = {10, 20, 30, 40, 50};
MEMORY (CONTIGUOUS - all elements side by side):
| Address | 0x1000 | 0x1004 | 0x1008 | 0x100C | 0x1010 | |
| Index   |   [0]  |   [1]  |   [2]  |   [3]  |   [4]  | |
| Value   |   10   |   20   |   30   |   40   |   50   | |
ADDRESS CALCULATION (O(1)):
address(arr[i]) = baseAddress + (i × elementSize)
arr[3] = 0x1000 + (3 × 4) = 0x1000 + 12 = 0x100C
This is just ONE arithmetic operation! CPU does this in 1 cycle!

**Cache Friendliness**:
When you access arr[0], the CPU loads a "cache line" (typically 64 bytes)
Cache Line Loaded:
| arr[0] | arr[1] | arr[2] | arr[3] | arr[4] | arr[5] | ... | arr[15] | |
| 10    |  20    |  30    |  40    |  50    |  ...   | ... |  ...    | |
Now arr[1], arr[2], etc. are already in L1 cache!
Access time: ~1 nanosecond instead of ~100 nanoseconds
This is why iterating an array is SO FAST:
for (int i = 0; i < arr.length; i++) {
sum += arr[i];  // Most accesses are cache hits!
}

## WHY LINKED LISTS ARE SLOW - Memory Layout Explained

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                 LINKED LIST MEMORY LAYOUT - THE SLOWNESS SECRET                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  LinkedList<Integer> list; // [10 → 20 → 30 → 40 → 50]                          │
│                                                                                 │
│  MEMORY (SCATTERED - nodes all over heap):                                      │
│                                                                                 │
│  HEAP:                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │    Address 0x1000:          Address 0x5F00:          Address 0x2A00:    │    │
│  │    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │    │
│  │    │ Node        │          │ Node        │          │ Node        │    │    │
│  │    ├─────────────┤          ├─────────────┤          ├─────────────┤    │    │
│  │    │ value: 10   │          │ value: 20   │          │ value: 30   │    │    │
│  │    │ next: 0x5F00│─────────►│ next: 0x2A00│─────────►│ next: 0x8B00│──┐ │    │
│  │    │ prev: null  │◄─────────│ prev: 0x1000│◄─────────│ prev: 0x5F00│  │ │    │
│  │    └─────────────┘          └─────────────┘          └─────────────┘  │ │    │
│  │                                                                        │ │   │
│  │                                                       ┌────────────────┘ │   │
│  │    Address 0x8B00:          Address 0x3C00:          ▼                   │   │
│  │    ┌─────────────┐          ┌─────────────┐                             │    │
│  │    │ Node        │          │ Node        │                             │    │
│  │    ├─────────────┤          ├─────────────┤                             │    │
│  │    │ value: 40   │          │ value: 50   │                             │    │
│  │    │ next: 0x3C00│─────────►│ next: null  │                             │    │
│  │    │ prev: 0x2A00│◄─────────│ prev: 0x8B00│                             │    │
│  │    └─────────────┘          └─────────────┘                             │    │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TO ACCESS list.get(3) (value 40):                                              │
│  ───────────────────────────────────                                            │
│  1. Start at head: 0x1000 (value 10)     - Cache miss! Load from RAM            │
│  2. Follow next to: 0x5F00 (value 20)    - Cache miss! Different location       │
│  3. Follow next to: 0x2A00 (value 30)    - Cache miss! Different location       │
│  4. Follow next to: 0x8B00 (value 40)    - Cache miss! Found it!                │
│                                                                                 │
│  4 memory accesses × 100ns each = 400 nanoseconds!                              │
│  Compare to array: 1 memory access = 1-100 nanoseconds                          │
│                                                                                 │
│                                                                                 │
│  MEMORY OVERHEAD:                                                               │
│  ────────────────                                                               │
│  Array:  5 integers = 20 bytes + 16 bytes header = 36 bytes                     │
│                                                                                 │
│  LinkedList: Each node needs:                                                   │
│  • Object header: 12 bytes                                                      │
│  • Integer object reference: 4 bytes                                            │
│  • Next pointer: 8 bytes                                                        │
│  • Prev pointer: 8 bytes                                                        │
│  • Integer object: 16 bytes (12 header + 4 value)                               │
│  Total per node: ~48 bytes                                                      │
│                                                                                 │
│  5 nodes = 240 bytes vs 36 bytes for array                                      │
│  LinkedList uses 6.7x MORE memory!                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```





## CPU OPERATIONS - What Actually Happens

## Cpu Instruction Cycle - The Basics

Every operation in your code becomes CPU instructions
Java Code:        int sum = a + b;
Bytecode:         iload_1        // Load 'a' onto stack
iload_2        // Load 'b' onto stack
iadd           // Add top two values
istore_3       // Store result in 'sum'
Machine Code:     MOV eax, [a]   // Load a into register
(x86)             ADD eax, [b]   // Add b to register
MOV [sum], eax // Store result

**Cpu Clock Cycles For Common Operations**:
| Operation                | Cycles | Notes |
┼────────┼
| Integer ADD/SUB          | 1      | Fastest operations |
| Integer MUL              | 3      | Multiplication is costlier |
| Integer DIV              | 20-80  | Division is VERY expensive! |
| Floating-point ADD       | 3-5    | Separate FPU unit |
| Floating-point MUL       | 4-5    | |
| Floating-point DIV       | 10-40  | |
| Comparison (==, <, >)    | 1      | Simple comparison |
| Branch (if/else)         | 1-20   | Depends on prediction |
| Memory Read (L1 cache)   | 4      | Cache hit |
| Memory Read (L2 cache)   | 12     | |
| Memory Read (L3 cache)   | 40     | |
| Memory Read (RAM)        | 200    | Cache miss - EXPENSIVE! |
| Function Call            | 15-30  | Stack frame setup |
| Virtual Method Call      | 25-50  | Vtable lookup + call |
┴────────┴

**Why This Matters For Dsa**:
- Division is 20-80x slower than addition!
Use bit shifts: n / 2  →  n >> 1
Use bit masks:  n % 8  →  n & 7
- Memory access is 200x slower than arithmetic!
Cache-friendly code beats clever algorithms
- Branch misprediction costs ~15 cycles!
Predictable patterns are faster than random




## BIT MANIPULATION - The Fastest Operations

## Bit-Level Operations - Complete Guide


**Binary Representation**:
int x = 42;
42 in binary: 00000000 00000000 00000000 00101010
Position: 5 4 3 2 1 0
Value:    32+0+8+0+2+0 = 42
32
8
2

**Bit Operations**:
AND (&) - Both bits must be 1
42 & 15 = ?
42: 00101010
15: 00001111
00001010 = 10

**Use**: Masking bits, checking if bit is set
- Check if even:    (n & 1) == 0
- Get last k bits:  n & ((1 << k) - 1)
OR (|) - Either bit can be 1
42 | 15 = ?
42: 00101010
15: 00001111
00101111 = 47

**Use**: Setting bits
- Set bit i:  n | (1 << i)
XOR (^) - Bits must be different
42 ^ 15 = ?
42: 00101010
15: 00001111
00100101 = 37

**Use**: Toggle bits, find single number, swap
- Toggle bit i:  n ^ (1 << i)
- Swap without temp:  a ^= b; b ^= a; a ^= b;
- a ^ a = 0 (cancel out)
- a ^ 0 = a (identity)
NOT (~) - Flip all bits
~42 = ?
42:  00000000 00000000 00000000 00101010
~42: 11111111 11111111 11111111 11010101 = -43
(Two's complement: -43 = ~42)
LEFT SHIFT (<<) - Multiply by 2^n
42 << 2 = ?
42:     00101010
42<<2:  10101000 = 168
42 × 4 = 168  (same as 42 × 2²)

**Use**: Fast multiplication
- n * 2:   n << 1
- n * 8:   n << 3
- n * 2^k: n << k
RIGHT SHIFT (>>) - Divide by 2^n
42 >> 2 = ?
42:     00101010
42>>2:  00001010 = 10
42 / 4 = 10 (integer division)

**Use**: Fast division
- n / 2:   n >> 1
- n / 8:   n >> 3

**Common Bit Tricks**:
1. Check if power of 2:
(n & (n-1)) == 0
8:     1000
7:     0111
8 & 7: 0000 ✓ (power of 2)
6:     0110
5:     0101
6 & 5: 0100 ✗ (not power of 2)
2. Get lowest set bit:
n & (-n)
12:     1100
-12:     0100 (two's complement)
12&-12: 0100 = 4 (lowest set bit)
3. Clear lowest set bit:
n & (n-1)
12:     1100
11:     1011
12&11:  1000 = 8 (cleared bit at position 2)
4. Count set bits (Brian Kernighan's):
int count = 0;
while (n != 0) {
n = n & (n - 1);  // Clear lowest bit
count++;
}
5. Check if bit i is set:
(n & (1 << i)) != 0
6. Set bit i:
n | (1 << i)
7. Clear bit i:
n & ~(1 << i)
8. Toggle bit i:
n ^ (1 << i)

---

🔬 **Section Challenge — BIT MANIPULATION**

**Challenge 1 (Performance):** Why does `x >> 1` execute faster than `x / 2` at the CPU level?
<details><summary>Answer</summary>

Integer division (`DIV`) takes 20-80 clock cycles because it requires complex hardware logic (multiple shifts and subtracts). A right shift (`SHR` or `SAR`) takes 1 clock cycle because it directly shifts the binary representation in the register. Note: Modern compilers often optimize `x / 2` to a shift instruction automatically, but understanding the difference is crucial for low-level performance tuning.
</details>

**Challenge 2 (Reasoning):** Using XOR, how can you swap two integer variables `a` and `b` without using a temporary variable? Explain why it works.
<details><summary>Answer</summary>

```java
a = a ^ b;
b = a ^ b;
a = a ^ b;
```
It works due to XOR properties: `x ^ x = 0` and `x ^ 0 = x`. After step 1, `a` holds `(initial_a ^ initial_b)`. Step 2 makes `b = (initial_a ^ initial_b) ^ initial_b`, which simplifies to `initial_a`. Step 3 makes `a = (initial_a ^ initial_b) ^ initial_a`, which simplifies to `initial_b`.
</details>

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](01b_Arrays.md)