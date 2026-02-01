# 📚 Data Structures: Deep Dive Guide

## Understanding DS from Core - Behavior, Nature & Implementation

---

# 🔬 PART 0A: HOW COMPUTER MEMORY ACTUALLY WORKS (The Foundation)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║     BEFORE YOU LEARN DATA STRUCTURES - UNDERSTAND THE MACHINE                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Why does this matter?
─────────────────────
Every data structure exists in MEMORY. If you don't understand memory,
you'll never truly understand why:
  • Arrays are fast for random access
  • LinkedLists are slow for random access
  • HashMaps are O(1) but use more memory
  • Cache-friendly code runs 100x faster

Let's go DEEP into how computers actually work!
```

## THE MEMORY HIERARCHY - Why Some Operations Are Faster

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY HIERARCHY (Speed vs Size)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                          ┌─────────────┐                                        │
│                          │  CPU CORE   │                                        │
│                          └──────┬──────┘                                        │
│                                 │                                                │
│    FASTEST    ┌─────────────────▼─────────────────┐                             │
│    (~1 cycle) │     REGISTERS (64 bytes)          │  ← Variables being computed │
│               │     Access: 0.5 nanoseconds       │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                                │
│    VERY FAST  ┌─────────────────▼─────────────────┐                             │
│    (~4 cycles)│     L1 CACHE (32KB per core)      │  ← Hot data (current loop) │
│               │     Access: 1 nanosecond          │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                                │
│    FAST       ┌─────────────────▼─────────────────┐                             │
│   (~12 cycles)│     L2 CACHE (256KB per core)     │  ← Recent data             │
│               │     Access: 4 nanoseconds         │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                                │
│    MODERATE   ┌─────────────────▼─────────────────┐                             │
│   (~40 cycles)│     L3 CACHE (8MB shared)         │  ← Shared between cores    │
│               │     Access: 15 nanoseconds        │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                                │
│    SLOW       ┌─────────────────▼─────────────────┐                             │
│  (~200 cycles)│     MAIN MEMORY / RAM (16GB)      │  ← All your program data   │
│               │     Access: 100 nanoseconds       │                             │
│               └─────────────────┬─────────────────┘                             │
│                                 │                                                │
│    VERY SLOW  ┌─────────────────▼─────────────────┐                             │
│  (~millions)  │     SSD / DISK (1TB)              │  ← Persistent storage      │
│               │     Access: 100,000 nanoseconds   │                             │
│               └─────────────────────────────────────┘                             │
│                                                                                  │
│  KEY INSIGHT:                                                                    │
│  ─────────────                                                                   │
│  RAM is 100x SLOWER than L1 cache!                                              │
│  Disk is 1000x SLOWER than RAM!                                                 │
│                                                                                  │
│  This is why CACHE-FRIENDLY data structures matter so much!                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## HOW MEMORY IS ORGANIZED (Addresses & Bytes)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY ADDRESS SPACE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Memory is like a HUGE array of bytes, each with an ADDRESS                     │
│                                                                                  │
│  ADDRESS        CONTENT (1 byte = 8 bits)                                       │
│  ────────────────────────────────────────────                                   │
│  0x00000000     [01001010]  ← First byte of RAM                                 │
│  0x00000001     [11010010]                                                       │
│  0x00000002     [00001111]                                                       │
│  0x00000003     [10101010]                                                       │
│  ...                                                                             │
│  0xFFFFFFFF     [????????]  ← Last byte (in 32-bit system)                      │
│                                                                                  │
│                                                                                  │
│  DATA TYPE SIZES (Java):                                                        │
│  ───────────────────────                                                        │
│  byte     = 1 byte  = 8 bits   → Range: -128 to 127                            │
│  short    = 2 bytes = 16 bits  → Range: -32,768 to 32,767                      │
│  int      = 4 bytes = 32 bits  → Range: -2.1 billion to 2.1 billion            │
│  long     = 8 bytes = 64 bits  → Range: ±9.2 quintillion                       │
│  float    = 4 bytes = 32 bits  → ~7 decimal digits precision                   │
│  double   = 8 bytes = 64 bits  → ~15 decimal digits precision                  │
│  char     = 2 bytes = 16 bits  → Unicode character                             │
│  boolean  = 1 byte* = 8 bits   → true or false                                 │
│  reference= 4 or 8 bytes       → Points to object in heap                      │
│                                                                                  │
│  * JVM may use 1 bit internally but allocates 1 byte                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HOW AN int IS STORED IN MEMORY                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  int x = 42;                                                                     │
│                                                                                  │
│  Binary of 42:  00000000 00000000 00000000 00101010                             │
│                 ────────┬────────┬────────┬────────                             │
│                   Byte 3  Byte 2  Byte 1  Byte 0                                │
│                                                                                  │
│  In Memory (Little Endian - Intel/AMD):                                         │
│  ┌──────────────────────────────────────────────────┐                           │
│  │ Address  │ 0x1000 │ 0x1001 │ 0x1002 │ 0x1003 │  │                           │
│  │ Content  │  0x2A  │  0x00  │  0x00  │  0x00  │  │                           │
│  │          │ (42)   │  (0)   │  (0)   │  (0)   │  │                           │
│  └──────────────────────────────────────────────────┘                           │
│              ↑                                                                   │
│              Least Significant Byte stored FIRST                                │
│                                                                                  │
│  In Memory (Big Endian - Network Order):                                        │
│  ┌──────────────────────────────────────────────────┐                           │
│  │ Address  │ 0x1000 │ 0x1001 │ 0x1002 │ 0x1003 │  │                           │
│  │ Content  │  0x00  │  0x00  │  0x00  │  0x2A  │  │                           │
│  │          │  (0)   │  (0)   │  (0)   │ (42)   │  │                           │
│  └──────────────────────────────────────────────────┘                           │
│                                              ↑                                   │
│              Most Significant Byte stored FIRST                                 │
│                                                                                  │
│  WHY DOES THIS MATTER?                                                          │
│  • Network protocols use Big Endian                                             │
│  • Your CPU likely uses Little Endian                                           │
│  • Must convert when sending data over network!                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## JAVA MEMORY MODEL - Stack vs Heap

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        JAVA MEMORY LAYOUT                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When JVM runs your program, memory is divided into:                            │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           JVM MEMORY                                     │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │                    METHOD AREA                                    │  │   │
│  │  │  • Class metadata (methods, fields)                              │  │   │
│  │  │  • Static variables                                              │  │   │
│  │  │  • Constant pool (string literals, numbers)                      │  │   │
│  │  │  • Method bytecode                                               │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │                         HEAP                                      │  │   │
│  │  │  • All objects live here                                         │  │   │
│  │  │  • Arrays are objects!                                           │  │   │
│  │  │  • Garbage collected                                             │  │   │
│  │  │  • Shared between all threads                                    │  │   │
│  │  │                                                                   │  │   │
│  │  │  Divided into:                                                   │  │   │
│  │  │  ┌─────────────────┬──────────────────┬────────────────────┐    │  │   │
│  │  │  │ Young Gen       │ Old Gen           │ Metaspace          │    │  │   │
│  │  │  │ (Eden+Survivor) │ (Long-lived objs) │ (Class metadata)   │    │  │   │
│  │  │  └─────────────────┴──────────────────┴────────────────────┘    │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │   │
│  │  │   STACK (Thread1) │  │   STACK (Thread2) │  │   STACK (Thread3) │   │   │
│  │  │                   │  │                   │  │                   │   │   │
│  │  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────┐  │   │   │
│  │  │  │ Frame 3     │  │  │  │ Frame 2     │  │  │  │ Frame 1     │  │   │   │
│  │  │  │ (method c)  │  │  │  │ (method b)  │  │  │  │ (method a)  │  │   │   │
│  │  │  ├─────────────┤  │  │  ├─────────────┤  │  │  ├─────────────┤  │   │   │
│  │  │  │ Frame 2     │  │  │  │ Frame 1     │  │  │  │             │  │   │   │
│  │  │  │ (method b)  │  │  │  │ (main)      │  │  │  │             │  │   │   │
│  │  │  ├─────────────┤  │  │  ├─────────────┤  │  │  │             │  │   │   │
│  │  │  │ Frame 1     │  │  │  │             │  │  │  │             │  │   │   │
│  │  │  │ (main)      │  │  │  │             │  │  │  │             │  │   │   │
│  │  │  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────┘  │   │   │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘   │   │
│  │                                                                          │   │
│  │  Each thread has its OWN stack!                                         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                     STACK FRAME - INSIDE VIEW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When you call a method:                                                         │
│                                                                                  │
│  public int calculate(int a, int b) {                                           │
│      int sum = a + b;        // Local variable                                  │
│      int[] arr = new int[5]; // Reference on stack, array on HEAP              │
│      return sum;                                                                 │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  STACK FRAME for calculate():                                                   │
│  ┌───────────────────────────────────────────────────────────────┐              │
│  │                                                               │              │
│  │  HIGH ADDRESS (top of stack)                                  │              │
│  │  ┌─────────────────────────────────────────────────────────┐ │              │
│  │  │  Return Address                                         │ │              │
│  │  │  (where to go after method ends)                        │ │              │
│  │  ├─────────────────────────────────────────────────────────┤ │              │
│  │  │  Previous Frame Pointer                                 │ │              │
│  │  │  (link to caller's frame)                               │ │              │
│  │  ├─────────────────────────────────────────────────────────┤ │              │
│  │  │  Local Variable: sum = 15                              │ │              │
│  │  │  (4 bytes for int)                                      │ │              │
│  │  ├─────────────────────────────────────────────────────────┤ │              │
│  │  │  Local Variable: arr = 0x00ABC123                      │ │              │
│  │  │  (reference pointing to heap)──────────────────────┐   │ │              │
│  │  ├─────────────────────────────────────────────────────┤   │ │              │
│  │  │  Parameter: a = 5                                   │   │ │              │
│  │  │  (4 bytes for int)                                  │   │ │              │
│  │  ├─────────────────────────────────────────────────────┤   │ │              │
│  │  │  Parameter: b = 10                                  │   │ │              │
│  │  │  (4 bytes for int)                                  │   │ │              │
│  │  └─────────────────────────────────────────────────────┘   │ │              │
│  │  LOW ADDRESS (bottom of frame)                         │   │ │              │
│  │                                                        │   │ │              │
│  └────────────────────────────────────────────────────────│───┘ │              │
│                                                           │     │              │
│                                                           ▼     │              │
│  HEAP:                                                          │              │
│  ┌─────────────────────────────────────────────────────────┐   │              │
│  │  Address 0x00ABC123:                                    │◄──┘              │
│  │  ┌───────────────────────────────────────────────────┐ │                   │
│  │  │ Object Header (12 bytes)                          │ │                   │
│  │  │  • Mark Word (8 bytes): GC info, hash, locks     │ │                   │
│  │  │  • Class Pointer (4 bytes): points to int[].class│ │                   │
│  │  ├───────────────────────────────────────────────────┤ │                   │
│  │  │ Array Length (4 bytes): 5                         │ │                   │
│  │  ├───────────────────────────────────────────────────┤ │                   │
│  │  │ arr[0] = 0  (4 bytes)                            │ │                   │
│  │  │ arr[1] = 0  (4 bytes)                            │ │                   │
│  │  │ arr[2] = 0  (4 bytes)                            │ │                   │
│  │  │ arr[3] = 0  (4 bytes)                            │ │                   │
│  │  │ arr[4] = 0  (4 bytes)                            │ │                   │
│  │  └───────────────────────────────────────────────────┘ │                   │
│  │                                                        │                   │
│  │  Total: 12 + 4 + (5×4) = 36 bytes                     │                   │
│  │  (may be padded to 40 bytes for alignment)            │                   │
│  └────────────────────────────────────────────────────────┘                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## WHY ARRAYS ARE FAST - Memory Layout Explained

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  ARRAY MEMORY LAYOUT - THE SPEED SECRET                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  int[] arr = {10, 20, 30, 40, 50};                                              │
│                                                                                  │
│  MEMORY (CONTIGUOUS - all elements side by side):                               │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Address │ 0x1000 │ 0x1004 │ 0x1008 │ 0x100C │ 0x1010 │                    │ │
│  │ Index   │   [0]  │   [1]  │   [2]  │   [3]  │   [4]  │                    │ │
│  │ Value   │   10   │   20   │   30   │   40   │   50   │                    │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ADDRESS CALCULATION (O(1)):                                                     │
│  ────────────────────────────                                                   │
│  address(arr[i]) = baseAddress + (i × elementSize)                              │
│                                                                                  │
│  arr[3] = 0x1000 + (3 × 4) = 0x1000 + 12 = 0x100C                              │
│                                                                                  │
│  This is just ONE arithmetic operation! CPU does this in 1 cycle!               │
│                                                                                  │
│                                                                                  │
│  CACHE FRIENDLINESS:                                                            │
│  ──────────────────                                                             │
│  When you access arr[0], the CPU loads a "cache line" (typically 64 bytes)     │
│                                                                                  │
│  Cache Line Loaded:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ arr[0] │ arr[1] │ arr[2] │ arr[3] │ arr[4] │ arr[5] │ ... │ arr[15] │    │ │
│  │  10    │  20    │  30    │  40    │  50    │  ...   │ ... │  ...    │    │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Now arr[1], arr[2], etc. are already in L1 cache!                             │
│  Access time: ~1 nanosecond instead of ~100 nanoseconds                        │
│                                                                                  │
│  This is why iterating an array is SO FAST:                                     │
│  for (int i = 0; i < arr.length; i++) {                                        │
│      sum += arr[i];  // Most accesses are cache hits!                          │
│  }                                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## WHY LINKED LISTS ARE SLOW - Memory Layout Explained

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                 LINKED LIST MEMORY LAYOUT - THE SLOWNESS SECRET                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LinkedList<Integer> list; // [10 → 20 → 30 → 40 → 50]                         │
│                                                                                  │
│  MEMORY (SCATTERED - nodes all over heap):                                      │
│                                                                                  │
│  HEAP:                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │    Address 0x1000:          Address 0x5F00:          Address 0x2A00:    │  │
│  │    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │  │
│  │    │ Node        │          │ Node        │          │ Node        │    │  │
│  │    ├─────────────┤          ├─────────────┤          ├─────────────┤    │  │
│  │    │ value: 10   │          │ value: 20   │          │ value: 30   │    │  │
│  │    │ next: 0x5F00│─────────►│ next: 0x2A00│─────────►│ next: 0x8B00│──┐ │  │
│  │    │ prev: null  │◄─────────│ prev: 0x1000│◄─────────│ prev: 0x5F00│  │ │  │
│  │    └─────────────┘          └─────────────┘          └─────────────┘  │ │  │
│  │                                                                        │ │  │
│  │                                                       ┌────────────────┘ │  │
│  │    Address 0x8B00:          Address 0x3C00:          ▼                   │  │
│  │    ┌─────────────┐          ┌─────────────┐                             │  │
│  │    │ Node        │          │ Node        │                             │  │
│  │    ├─────────────┤          ├─────────────┤                             │  │
│  │    │ value: 40   │          │ value: 50   │                             │  │
│  │    │ next: 0x3C00│─────────►│ next: null  │                             │  │
│  │    │ prev: 0x2A00│◄─────────│ prev: 0x8B00│                             │  │
│  │    └─────────────┘          └─────────────┘                             │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  TO ACCESS list.get(3) (value 40):                                              │
│  ───────────────────────────────────                                            │
│  1. Start at head: 0x1000 (value 10)     - Cache miss! Load from RAM           │
│  2. Follow next to: 0x5F00 (value 20)    - Cache miss! Different location      │
│  3. Follow next to: 0x2A00 (value 30)    - Cache miss! Different location      │
│  4. Follow next to: 0x8B00 (value 40)    - Cache miss! Found it!               │
│                                                                                  │
│  4 memory accesses × 100ns each = 400 nanoseconds!                             │
│  Compare to array: 1 memory access = 1-100 nanoseconds                         │
│                                                                                  │
│                                                                                  │
│  MEMORY OVERHEAD:                                                                │
│  ────────────────                                                               │
│  Array:  5 integers = 20 bytes + 16 bytes header = 36 bytes                    │
│                                                                                  │
│  LinkedList: Each node needs:                                                   │
│  • Object header: 12 bytes                                                      │
│  • Integer object reference: 4 bytes                                            │
│  • Next pointer: 8 bytes                                                        │
│  • Prev pointer: 8 bytes                                                        │
│  • Integer object: 16 bytes (12 header + 4 value)                              │
│  Total per node: ~48 bytes                                                      │
│                                                                                  │
│  5 nodes = 240 bytes vs 36 bytes for array                                     │
│  LinkedList uses 6.7x MORE memory!                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CPU OPERATIONS - What Actually Happens

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CPU INSTRUCTION CYCLE - THE BASICS                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Every operation in your code becomes CPU instructions                          │
│                                                                                  │
│  Java Code:        int sum = a + b;                                             │
│                                                                                  │
│  Bytecode:         iload_1        // Load 'a' onto stack                        │
│                    iload_2        // Load 'b' onto stack                        │
│                    iadd           // Add top two values                         │
│                    istore_3       // Store result in 'sum'                      │
│                                                                                  │
│  Machine Code:     MOV eax, [a]   // Load a into register                       │
│  (x86)             ADD eax, [b]   // Add b to register                          │
│                    MOV [sum], eax // Store result                               │
│                                                                                  │
│                                                                                  │
│  CPU CLOCK CYCLES FOR COMMON OPERATIONS:                                        │
│  ───────────────────────────────────────                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Operation                │ Cycles │ Notes                              │   │
│  ├──────────────────────────┼────────┼────────────────────────────────────┤   │
│  │ Integer ADD/SUB          │ 1      │ Fastest operations                 │   │
│  │ Integer MUL              │ 3      │ Multiplication is costlier         │   │
│  │ Integer DIV              │ 20-80  │ Division is VERY expensive!        │   │
│  │ Floating-point ADD       │ 3-5    │ Separate FPU unit                  │   │
│  │ Floating-point MUL       │ 4-5    │                                    │   │
│  │ Floating-point DIV       │ 10-40  │                                    │   │
│  │ Comparison (==, <, >)    │ 1      │ Simple comparison                  │   │
│  │ Branch (if/else)         │ 1-20   │ Depends on prediction              │   │
│  │ Memory Read (L1 cache)   │ 4      │ Cache hit                          │   │
│  │ Memory Read (L2 cache)   │ 12     │                                    │   │
│  │ Memory Read (L3 cache)   │ 40     │                                    │   │
│  │ Memory Read (RAM)        │ 200    │ Cache miss - EXPENSIVE!           │   │
│  │ Function Call            │ 15-30  │ Stack frame setup                  │   │
│  │ Virtual Method Call      │ 25-50  │ Vtable lookup + call               │   │
│  └──────────────────────────┴────────┴────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  WHY THIS MATTERS FOR DSA:                                                       │
│  ─────────────────────────                                                      │
│  • Division is 20-80x slower than addition!                                     │
│    Use bit shifts: n / 2  →  n >> 1                                            │
│    Use bit masks:  n % 8  →  n & 7                                             │
│                                                                                  │
│  • Memory access is 200x slower than arithmetic!                                │
│    Cache-friendly code beats clever algorithms                                  │
│                                                                                  │
│  • Branch misprediction costs ~15 cycles!                                       │
│    Predictable patterns are faster than random                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## BIT MANIPULATION - The Fastest Operations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BIT-LEVEL OPERATIONS - COMPLETE GUIDE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BINARY REPRESENTATION:                                                          │
│  ─────────────────────                                                          │
│  int x = 42;                                                                     │
│                                                                                  │
│  42 in binary: 00000000 00000000 00000000 00101010                              │
│                                                   │││││                         │
│                    Position: 5 4 3 2 1 0         │││││                         │
│                    Value:    32+0+8+0+2+0 = 42   │││││                         │
│                                                   │││││                         │
│                                              32 ──┘││││                         │
│                                               8 ───┘│││                         │
│                                               2 ────┘││                         │
│                                                      ││                         │
│                                                                                  │
│  BIT OPERATIONS:                                                                 │
│  ───────────────                                                                │
│                                                                                  │
│  AND (&) - Both bits must be 1                                                  │
│  ─────────────────────────────────                                              │
│    42 & 15 = ?                                                                  │
│    42: 00101010                                                                  │
│    15: 00001111                                                                  │
│    ─────────────                                                                │
│        00001010 = 10                                                             │
│                                                                                  │
│  USE: Masking bits, checking if bit is set                                      │
│  • Check if even:    (n & 1) == 0                                              │
│  • Get last k bits:  n & ((1 << k) - 1)                                        │
│                                                                                  │
│                                                                                  │
│  OR (|) - Either bit can be 1                                                   │
│  ───────────────────────────────                                                │
│    42 | 15 = ?                                                                  │
│    42: 00101010                                                                  │
│    15: 00001111                                                                  │
│    ─────────────                                                                │
│        00101111 = 47                                                             │
│                                                                                  │
│  USE: Setting bits                                                              │
│  • Set bit i:  n | (1 << i)                                                    │
│                                                                                  │
│                                                                                  │
│  XOR (^) - Bits must be different                                               │
│  ───────────────────────────────────                                            │
│    42 ^ 15 = ?                                                                  │
│    42: 00101010                                                                  │
│    15: 00001111                                                                  │
│    ─────────────                                                                │
│        00100101 = 37                                                             │
│                                                                                  │
│  USE: Toggle bits, find single number, swap                                     │
│  • Toggle bit i:  n ^ (1 << i)                                                 │
│  • Swap without temp:  a ^= b; b ^= a; a ^= b;                                 │
│  • a ^ a = 0 (cancel out)                                                       │
│  • a ^ 0 = a (identity)                                                         │
│                                                                                  │
│                                                                                  │
│  NOT (~) - Flip all bits                                                        │
│  ─────────────────────────                                                      │
│    ~42 = ?                                                                       │
│    42:  00000000 00000000 00000000 00101010                                     │
│    ~42: 11111111 11111111 11111111 11010101 = -43                               │
│                                                                                  │
│  (Two's complement: -43 = ~42)                                                  │
│                                                                                  │
│                                                                                  │
│  LEFT SHIFT (<<) - Multiply by 2^n                                              │
│  ───────────────────────────────────                                            │
│    42 << 2 = ?                                                                   │
│    42:     00101010                                                              │
│    42<<2:  10101000 = 168                                                        │
│                                                                                  │
│  42 × 4 = 168  (same as 42 × 2²)                                               │
│                                                                                  │
│  USE: Fast multiplication                                                        │
│  • n * 2:   n << 1                                                              │
│  • n * 8:   n << 3                                                              │
│  • n * 2^k: n << k                                                              │
│                                                                                  │
│                                                                                  │
│  RIGHT SHIFT (>>) - Divide by 2^n                                               │
│  ────────────────────────────────                                               │
│    42 >> 2 = ?                                                                   │
│    42:     00101010                                                              │
│    42>>2:  00001010 = 10                                                         │
│                                                                                  │
│  42 / 4 = 10 (integer division)                                                 │
│                                                                                  │
│  USE: Fast division                                                              │
│  • n / 2:   n >> 1                                                              │
│  • n / 8:   n >> 3                                                              │
│                                                                                  │
│                                                                                  │
│  COMMON BIT TRICKS:                                                              │
│  ─────────────────                                                              │
│                                                                                  │
│  1. Check if power of 2:                                                        │
│     (n & (n-1)) == 0                                                            │
│                                                                                  │
│     8:     1000                                                                  │
│     7:     0111                                                                  │
│     8 & 7: 0000 ✓ (power of 2)                                                  │
│                                                                                  │
│     6:     0110                                                                  │
│     5:     0101                                                                  │
│     6 & 5: 0100 ✗ (not power of 2)                                              │
│                                                                                  │
│  2. Get lowest set bit:                                                         │
│     n & (-n)                                                                     │
│                                                                                  │
│     12:     1100                                                                 │
│    -12:     0100 (two's complement)                                             │
│     12&-12: 0100 = 4 (lowest set bit)                                           │
│                                                                                  │
│  3. Clear lowest set bit:                                                       │
│     n & (n-1)                                                                    │
│                                                                                  │
│     12:     1100                                                                 │
│     11:     1011                                                                 │
│     12&11:  1000 = 8 (cleared bit at position 2)                                │
│                                                                                  │
│  4. Count set bits (Brian Kernighan's):                                         │
│     int count = 0;                                                               │
│     while (n != 0) {                                                             │
│         n = n & (n - 1);  // Clear lowest bit                                   │
│         count++;                                                                 │
│     }                                                                            │
│                                                                                  │
│  5. Check if bit i is set:                                                      │
│     (n & (1 << i)) != 0                                                         │
│                                                                                  │
│  6. Set bit i:                                                                  │
│     n | (1 << i)                                                                │
│                                                                                  │
│  7. Clear bit i:                                                                │
│     n & ~(1 << i)                                                               │
│                                                                                  │
│  8. Toggle bit i:                                                               │
│     n ^ (1 << i)                                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 0: COMPLETE UNDERSTANDING + GROWTH MINDSET

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         DATA STRUCTURES - COMPLETE UNDERSTANDING & GROWTH MINDSET            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT ARE DATA STRUCTURES?                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ A DATA STRUCTURE is a way of ORGANIZING and STORING data so that we can     │
│ perform OPERATIONS efficiently.                                              │
│                                                                              │
│ KEY INSIGHT: It's not just about STORING data - it's about making certain   │
│ OPERATIONS fast!                                                             │
│                                                                              │
│ ANALOGY:                                                                     │
│ • Library with books thrown randomly → Hard to find books                   │
│ • Library with books sorted by topic → Easy to find by topic               │
│ • Library with books sorted by author → Easy to find by author             │
│                                                                              │
│ Same books, different ORGANIZATIONS, different SPEEDS for different tasks!  │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • 1945: First computers - data just thrown in memory                        │
│ • 1950s: Arrays invented - need for sequential data                         │
│ • 1956: Linked Lists - need for dynamic size                                │
│ • 1960s: Stacks, Queues - need for order control                           │
│ • 1962: AVL Trees - need for balanced search                                │
│ • 1972: B-Trees - need for database indexing                                │
│ • 1984: Skip Lists - probabilistic alternative to trees                     │
│ • 1990s: Hash structures everywhere - O(1) lookup need                      │
│ • Today: Specialized DS for every use case                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO DATA STRUCTURES SOLVE?                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CORE PROBLEM: OPERATIONS ARE TOO SLOW!                                       │
│                                                                              │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ SCENARIO: 1 million user accounts                                     │   │
│ │                                                                       │   │
│ │ OPERATION          │ Unsorted List │ Sorted Array │ HashMap          │   │
│ │ ─────────────────────────────────────────────────────────────────────│   │
│ │ Find user by ID    │ 1 million ops │ 20 ops       │ 1 op             │   │
│ │ Add new user       │ 1 op          │ 1 million ops│ 1 op             │   │
│ │ Delete user        │ 1 million ops │ 1 million ops│ 1 op             │   │
│ │ List all users     │ 1 million ops │ 1 million ops│ 1 million ops    │   │
│ │                                                                       │   │
│ │ WHICH IS BEST? Depends on your MOST COMMON operation!                │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│ TRADE-OFF: Every DS is GOOD at some operations and BAD at others!           │
│ There is NO PERFECT data structure - only PERFECT CHOICE for your problem!  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN DATA STRUCTURES?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. PERFORMANCE: Same problem can be 1000x faster with right DS              │
│    • Example: Finding a word in dictionary                                   │
│      Linear search: Check all 170,000 words                                 │
│      Binary search: Check only 18 words!                                    │
│                                                                              │
│ 2. SCALABILITY: Programs must handle growth                                  │
│    • O(n²) works for 1000 items but crashes with 1 million                 │
│    • Right DS keeps O(log n) even at scale                                  │
│                                                                              │
│ 3. PROBLEM MODELING: DS helps you THINK about problems                      │
│    • Hierarchy? → Tree                                                       │
│    • Relationships? → Graph                                                  │
│    • Fast lookup? → HashMap                                                  │
│    • Order matters? → Stack/Queue                                           │
│                                                                              │
│ 4. FOUNDATION: Advanced concepts BUILD on DS                                 │
│    • Databases use B-Trees                                                   │
│    • Networks use Graphs                                                     │
│    • Compilers use Stacks                                                    │
│    • OS uses Queues                                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ GROWTH MINDSET: CHOOSING & CREATING DATA STRUCTURES ⭐                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ DON'T: "I need to memorize all data structures"                             │
│ DO: "I need to understand WHAT operations each DS optimizes for"            │
│                                                                              │
│ THE SELECTION FRAMEWORK:                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1. List ALL operations you need                                         │ │
│ │ 2. Mark which operations are MOST FREQUENT                              │ │
│ │ 3. Find DS that makes frequent operations FAST                          │ │
│ │ 4. Accept that rare operations might be slow                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ QUICK SELECTION GUIDE:                                                       │
│                                                                              │
│ NEED                           → USE                                        │
│ ────────────────────────────────────────────────────────────────────────── │
│ Fast access by index           → Array                                      │
│ Fast insert/delete anywhere    → LinkedList                                 │
│ LIFO (Last In First Out)       → Stack                                      │
│ FIFO (First In First Out)      → Queue                                      │
│ Fast lookup by key             → HashMap                                    │
│ Fast lookup + sorted order     → TreeMap                                    │
│ Unique elements only           → Set                                        │
│ Hierarchical relationships     → Tree                                       │
│ Complex relationships          → Graph                                      │
│ Priority-based access          → Heap/PriorityQueue                        │
│                                                                              │
│ WHEN NO EXISTING DS FITS → CREATE YOUR OWN BY COMBINING!                    │
│                                                                              │
│ Examples:                                                                    │
│ • LRU Cache = HashMap + DoublyLinkedList                                   │
│ • MinStack = Stack + Stack (for mins)                                       │
│ • Trie = Tree with characters as edges                                      │
│ • Graph with fast lookup = Adjacency List using HashMap                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING DATA STRUCTURES                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. OVERWHELMING NUMBER:                                                      │
│    "There are too many DS to learn!"                                        │
│    Solution: Master the 10 core DS first, rest are variations               │
│    Core: Array, List, Stack, Queue, HashMap, Set, Tree, Heap, Graph, Trie  │
│                                                                              │
│ 2. CONFUSION ABOUT WHEN TO USE:                                              │
│    "I know the DS but don't know when to use it"                            │
│    Solution: Focus on OPERATIONS each DS optimizes                          │
│                                                                              │
│ 3. IMPLEMENTATION VS CONCEPT:                                                │
│    "I understand concept but can't implement"                               │
│    Solution: Draw pictures first, code follows naturally                    │
│                                                                              │
│ 4. TRADE-OFFS CONFUSING:                                                     │
│    "Array is O(1) access, HashMap is O(1) access - what's the difference?" │
│    Solution: Understand WHAT operation is O(1) in each                      │
│    Array: O(1) by INDEX    HashMap: O(1) by KEY                            │
│                                                                              │
│ 5. NOT SEEING CONNECTIONS:                                                   │
│    "Each DS feels completely different"                                     │
│    Solution: See how DS COMBINE and BUILD on each other                     │
│    TreeMap = Tree + Map behavior                                            │
│    HashSet = HashMap with only keys                                         │
│    PriorityQueue = Heap implementation                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING DATA STRUCTURES                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT RECOGNITION: See problem → Know which DS fits                    │
│ ✅ TRADE-OFF ANALYSIS: Understand costs of each choice                      │
│ ✅ COMBINATION SKILLS: Combine DS to solve complex problems                 │
│ ✅ IMPLEMENTATION: Code any DS from scratch                                  │
│ ✅ DEBUGGING: Recognize DS-related bugs quickly                             │
│ ✅ OPTIMIZATION: Know when to switch DS for better performance             │
│ ✅ CREATION: Design custom DS when needed                                   │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I'll try arrays for everything"                                      │
│   TO: "I'll choose the RIGHT DS for each operation"                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: WHY DATA STRUCTURES EXIST

## The Origin Story

```
1950s: Computers had LIMITED memory (few KB)
       ↓
Problem: How to organize data efficiently?
       ↓
Solution: Data Structures were born!

Every DS was created to solve a SPECIFIC problem:
- Array: Fast access by position
- LinkedList: Fast insertion/deletion
- Stack: Last-In-First-Out needed
- Queue: First-In-First-Out needed
- Tree: Hierarchical data
- Graph: Relationships between entities
- HashMap: O(1) lookup
```

---

# PART 2: ARRAYS

## 🧬 Nature & Behavior

### What is an Array?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Memory is a long tape of numbered boxes            │
│                                                    │
│ Address: 1000  1004  1008  1012  1016  1020       │
│          ┌────┬────┬────┬────┬────┬────┐         │
│          │ 10 │ 20 │ 30 │ 40 │ 50 │ 60 │         │
│          └────┴────┴────┴────┴────┴────┘         │
│          arr[0] arr[1] arr[2] arr[3] arr[4] arr[5]│
│                                                    │
│ CONTIGUOUS = Next to each other in memory         │
└────────────────────────────────────────────────────┘

WHY CONTIGUOUS MATTERS:
- arr[3] = baseAddress + (3 × elementSize)
- arr[3] = 1000 + (3 × 4) = 1012
- This is O(1) random access!
```

### Array Characteristics

| Property         | Value      | Why?                       |
| ---------------- | ---------- | -------------------------- |
| Access           | O(1)       | Direct address calculation |
| Search           | O(n)       | Must check each element    |
| Insert at end    | O(1)       | If space available         |
| Insert at middle | O(n)       | Must shift elements        |
| Delete           | O(n)       | Must shift elements        |
| Memory           | Contiguous | Fixed block needed         |

### 🔴 Real-World Origin: Supermarket Inventory (1950s)

```
PROBLEM (1957 - IBM):
- Supermarket needed to track 10,000 products
- Each product has: ID, Name, Price, Quantity
- Need to look up product by ID quickly

BEFORE ARRAYS:
- Products stored in random memory locations
- Finding product #5000 required searching 5000 locations
- Time: O(n) for every lookup

SOLUTION - ARRAY:
- Store products in consecutive memory
- Product ID = Array Index
- products[5000] = instant access!

AFTER IMPLEMENTATION:
- Lookup time: O(1)
- Inventory checks: 1000x faster
- Made modern retail possible!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyArray {
    private int[] data;
    private int size;
    private int capacity;

    // Constructor
    public MyArray(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.size = 0;
    }

    // GET - O(1)
    public int get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        return data[index];
    }

    // SET - O(1)
    public void set(int index, int value) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        data[index] = value;
    }

    // ADD at end - O(1) amortized
    public void add(int value) {
        if (size == capacity) {
            resize();  // O(n) but rare
        }
        data[size++] = value;
    }

    // INSERT at index - O(n)
    public void insert(int index, int value) {
        if (size == capacity) {
            resize();
        }
        // Shift elements right
        for (int i = size; i > index; i--) {
            data[i] = data[i - 1];
        }
        data[index] = value;
        size++;
    }

    // DELETE at index - O(n)
    public int delete(int index) {
        int removed = data[index];
        // Shift elements left
        for (int i = index; i < size - 1; i++) {
            data[i] = data[i + 1];
        }
        size--;
        return removed;
    }

    // RESIZE - O(n)
    private void resize() {
        capacity *= 2;
        int[] newData = new int[capacity];
        for (int i = 0; i < size; i++) {
            newData[i] = data[i];
        }
        data = newData;
    }

    // SEARCH - O(n)
    public int search(int value) {
        for (int i = 0; i < size; i++) {
            if (data[i] == value) return i;
        }
        return -1;
    }

    // SIZE - O(1)
    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode Problems → Real-World Connection

### Problem: Two Sum

```
REAL-WORLD ORIGIN: Financial Trading System (1990s)

PROBLEM AT GOLDMAN SACHS:
- Traders needed to find pairs of stocks
- Stock A price + Stock B price = Target budget
- Thousands of stocks, milliseconds to decide

BEFORE OPTIMIZATION:
for each stock A:
    for each stock B:
        if A + B == target: found!
Time: O(n²) = Too slow for real-time trading

SOLUTION THINKING PROCESS:
1. "We're checking same pairs multiple times"
2. "What if we remember what we've seen?"
3. "HashMap! Store value → index"
4. "For each stock, check if complement exists"

AFTER (Your Two Sum solution):
- O(n) time complexity
- Real-time trading possible
- This pattern now used in ALL trading systems
```

---

# PART 3: LINKED LIST

## 🧬 Nature & Behavior

### What is a Linked List?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Nodes scattered across memory, connected by refs   │
│                                                    │
│  ┌────┬────┐    ┌────┬────┐    ┌────┬────┐       │
│  │ 10 │ ●──┼───→│ 20 │ ●──┼───→│ 30 │null│       │
│  └────┴────┘    └────┴────┘    └────┴────┘       │
│  addr: 5000     addr: 2000     addr: 8000        │
│                                                    │
│ NOT CONTIGUOUS = Scattered in memory              │
└────────────────────────────────────────────────────┘

WHY NON-CONTIGUOUS IS USEFUL:
- No need for big continuous memory block
- Insert/Delete = just change pointers
- Size can grow infinitely (until memory full)
```

### Linked List vs Array

| Operation        | Array  | LinkedList  | Winner     |
| ---------------- | ------ | ----------- | ---------- |
| Access by index  | O(1)   | O(n)        | Array      |
| Insert at start  | O(n)   | O(1)        | LinkedList |
| Insert at end    | O(1)\* | O(n)†       | Array      |
| Insert at middle | O(n)   | O(1)‡       | LinkedList |
| Memory usage     | Less   | More (refs) | Array      |
| Cache friendly   | Yes    | No          | Array      |

\*If space available  
†O(1) if tail pointer maintained  
‡O(1) if position known, O(n) to find position

### 🔴 Real-World Origin: Music Playlist (1980s)

```
PROBLEM (Early MP3 Players):
- User creates playlist of 1000 songs
- User wants to add song in middle
- User wants to remove current song

WITH ARRAY:
- Adding song at position 500
- Must shift 500 songs
- On slow hardware: 2 seconds delay!
- User experience: TERRIBLE

SOLUTION - LINKED LIST:
- Each song points to next song
- Insert = change 2 pointers
- Delete = change 1 pointer
- Time: O(1) for modifications

REAL IMPLEMENTATION:
- iTunes (2001) used LinkedList for playlists
- Spotify uses doubly-linked list
- "Previous" and "Next" buttons = prev/next pointers!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyLinkedList {

    // Node class (inner)
    private class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    public MyLinkedList() {
        head = null;
        tail = null;
        size = 0;
    }

    // ADD at end - O(1) with tail pointer
    public void add(int value) {
        Node newNode = new Node(value);
        if (head == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    // ADD at beginning - O(1)
    public void addFirst(int value) {
        Node newNode = new Node(value);
        newNode.next = head;
        head = newNode;
        if (tail == null) {
            tail = newNode;
        }
        size++;
    }

    // INSERT at index - O(n) to find, O(1) to insert
    public void insert(int index, int value) {
        if (index == 0) {
            addFirst(value);
            return;
        }

        Node current = head;
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        Node newNode = new Node(value);
        newNode.next = current.next;
        current.next = newNode;

        if (newNode.next == null) {
            tail = newNode;
        }
        size++;
    }

    // GET - O(n)
    public int get(int index) {
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        return current.data;
    }

    // DELETE first - O(1)
    public int deleteFirst() {
        if (head == null) throw new RuntimeException("Empty list");
        int value = head.data;
        head = head.next;
        if (head == null) tail = null;
        size--;
        return value;
    }

    // DELETE at index - O(n)
    public int delete(int index) {
        if (index == 0) return deleteFirst();

        Node current = head;
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        int value = current.next.data;
        current.next = current.next.next;

        if (current.next == null) {
            tail = current;
        }
        size--;
        return value;
    }

    // REVERSE - O(n) - IMPORTANT FOR INTERVIEWS!
    public void reverse() {
        Node prev = null;
        Node current = head;
        tail = head;  // Old head becomes new tail

        while (current != null) {
            Node next = current.next;  // Save next
            current.next = prev;       // Reverse pointer
            prev = current;            // Move prev forward
            current = next;            // Move current forward
        }

        head = prev;  // New head is last node
    }

    // DETECT CYCLE - Floyd's Algorithm
    public boolean hasCycle() {
        if (head == null) return false;

        Node slow = head;
        Node fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    // FIND MIDDLE - O(n)
    public int findMiddle() {
        Node slow = head;
        Node fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow.data;
    }

    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: Reverse Linked List

```
REAL-WORLD ORIGIN: Undo Feature in Text Editors (1970s)

PROBLEM AT XEROX PARC (1974):
- Text editor needed "Undo" feature
- Each edit stored as node in list
- Undo = go backwards through edits

INITIAL APPROACH:
- Singly linked list: Edit1 → Edit2 → Edit3
- Undo requires going backwards
- Can't go backwards in singly linked!

SOLUTION OPTIONS:
1. Use doubly linked list (more memory)
2. Reverse the list when needed
3. Store in reverse order

THINKING PROCESS:
"What if we could reverse the direction of arrows?"
    Edit1 → Edit2 → Edit3
becomes:
    Edit1 ← Edit2 ← Edit3

NOW USED IN:
- Git version control (reverse commit history)
- Browser back button
- Database transaction rollback
```

---

# PART 4: STACK

## 🧬 Nature & Behavior

### What is a Stack?

```
PHYSICAL REALITY - Like a stack of plates:
┌────────────────────────────────────────────────────┐
│                                                    │
│   TOP →  ┌─────┐                                  │
│          │  5  │  ← Last In, First Out (LIFO)     │
│          ├─────┤                                  │
│          │  4  │                                  │
│          ├─────┤                                  │
│          │  3  │                                  │
│          ├─────┤                                  │
│          │  2  │                                  │
│          ├─────┤                                  │
│          │  1  │                                  │
│          └─────┘                                  │
│                                                    │
│   PUSH: Add to top                                │
│   POP: Remove from top                            │
│   PEEK: Look at top without removing              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Stack Operations

| Operation    | Time | Description                 |
| ------------ | ---- | --------------------------- |
| push(x)      | O(1) | Add element to top          |
| pop()        | O(1) | Remove and return top       |
| peek()/top() | O(1) | Return top without removing |
| isEmpty()    | O(1) | Check if stack is empty     |
| size()       | O(1) | Return number of elements   |

### 🔴 Real-World Origin: Function Call Management (1960s)

```
PROBLEM (Early Computers):
- Programs call functions
- Functions call other functions
- How to remember where to return?

EXAMPLE:
main() calls A()
    A() calls B()
        B() calls C()
        C() returns to B
    B() returns to A
A() returns to main

WITHOUT STACK:
- No way to track return addresses
- Programs would get lost!

SOLUTION - CALL STACK:
┌─────────────┐
│ C() addr    │ ← Top (current)
├─────────────┤
│ B() addr    │
├─────────────┤
│ A() addr    │
├─────────────┤
│ main() addr │
└─────────────┘

When C() returns → pop → go to B()
When B() returns → pop → go to A()

THIS IS WHY:
- StackOverflowError exists (too many calls)
- Recursion works (each call pushed to stack)
- Debuggers show "call stack"
```

## 💻 Implementation WITHOUT Collections

```java
public class MyStack {
    private int[] data;
    private int top;
    private int capacity;

    public MyStack(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.top = -1;  // Empty stack
    }

    // PUSH - O(1)
    public void push(int value) {
        if (top == capacity - 1) {
            throw new RuntimeException("Stack Overflow!");
        }
        data[++top] = value;
    }

    // POP - O(1)
    public int pop() {
        if (isEmpty()) {
            throw new RuntimeException("Stack Underflow!");
        }
        return data[top--];
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Stack is empty!");
        }
        return data[top];
    }

    // IS EMPTY - O(1)
    public boolean isEmpty() {
        return top == -1;
    }

    // SIZE - O(1)
    public int size() {
        return top + 1;
    }
}

// LINKED LIST BASED STACK (No size limit)
public class MyLinkedStack {
    private class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }

    private Node top;
    private int size;

    public void push(int value) {
        Node newNode = new Node(value);
        newNode.next = top;
        top = newNode;
        size++;
    }

    public int pop() {
        if (top == null) throw new RuntimeException("Empty!");
        int value = top.data;
        top = top.next;
        size--;
        return value;
    }

    public int peek() {
        if (top == null) throw new RuntimeException("Empty!");
        return top.data;
    }

    public boolean isEmpty() {
        return top == null;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: Valid Parentheses

```
REAL-WORLD ORIGIN: Compiler Design (1960s)

PROBLEM AT MIT (1962):
- Compilers need to parse code
- Code has nested structures: if { while { } }
- How to verify brackets match correctly?

BAD CODE:
if (x > 0 {    // Missing )
    while (y) }  // Wrong bracket
}

COMPILER NEEDS TO DETECT THIS!

SOLUTION THINKING:
1. "When I see '(', I expect ')' later"
2. "When I see '{', I expect '}' later"
3. "Most recent open bracket closes first"
4. "That's LIFO - use a STACK!"

ALGORITHM:
- See '(' → push ')'
- See '{' → push '}'
- See ')' → pop, check if matches
- End: stack should be empty

NOW USED IN:
- Every compiler (GCC, javac, clang)
- Every IDE (syntax highlighting)
- Every code editor (bracket matching)
- HTML validators
- JSON parsers
```

---

# PART 5: QUEUE

## 🧬 Nature & Behavior

### What is a Queue?

```
PHYSICAL REALITY - Like a line at a store:
┌────────────────────────────────────────────────────┐
│                                                    │
│  FRONT                               BACK         │
│    ↓                                  ↓           │
│  ┌───┬───┬───┬───┬───┐                           │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │                           │
│  └───┴───┴───┴───┴───┘                           │
│    ↑                 ↑                            │
│  Dequeue          Enqueue                        │
│  (Remove)         (Add)                          │
│                                                    │
│  FIFO = First In, First Out                       │
│  "First come, first served"                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Queue Operations

| Operation           | Time | Description       |
| ------------------- | ---- | ----------------- |
| enqueue(x)/offer(x) | O(1) | Add to back       |
| dequeue()/poll()    | O(1) | Remove from front |
| peek()/front()      | O(1) | See front element |
| isEmpty()           | O(1) | Check if empty    |

### 🔴 Real-World Origin: Print Spooler (1970s)

```
PROBLEM (Office with 1 printer, 50 computers):
- Multiple users send print jobs
- Printer can only do one job at a time
- Who prints first?

WITHOUT QUEUE:
- Last person to click "Print" goes first
- People who clicked earlier wait forever
- Unfair and chaotic!

SOLUTION - PRINT QUEUE:
- Jobs added to back of queue
- Printer takes from front
- First submitted = First printed

PRINT QUEUE:
┌────────────────────────────────────────┐
│ Front                            Back  │
│ [Job1] → [Job2] → [Job3] → [Job4]     │
│   ↑                              ↑     │
│ Printing                    New jobs   │
└────────────────────────────────────────┘

NOW USED IN:
- Operating System task scheduling
- Web server request handling
- Message queues (Kafka, RabbitMQ)
- Breadth-First Search algorithm
```

## 💻 Implementation WITHOUT Collections

```java
// CIRCULAR ARRAY QUEUE (Most efficient)
public class MyQueue {
    private int[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public MyQueue(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    // ENQUEUE - O(1)
    public void enqueue(int value) {
        if (size == capacity) {
            throw new RuntimeException("Queue is full!");
        }
        rear = (rear + 1) % capacity;  // Circular
        data[rear] = value;
        size++;
    }

    // DEQUEUE - O(1)
    public int dequeue() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        int value = data[front];
        front = (front + 1) % capacity;  // Circular
        size--;
        return value;
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        return data[front];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int size() {
        return size;
    }
}

// WHY CIRCULAR?
/*
Without circular, after many operations:
[_, _, _, 5, 6, 7, _, _, _]
        ↑        ↑
      front    rear

Wasted space at beginning!

With circular, rear wraps around:
[8, 9, _, 5, 6, 7]
      ↑  ↑
    rear front

No wasted space!
*/
```

## 🎯 LeetCode → Real-World Connection

### Problem: Number of Islands (BFS with Queue)

```
REAL-WORLD ORIGIN: Google Maps (2005)

PROBLEM:
- Satellite images show land and water
- Need to count distinct landmasses
- Need to identify boundaries of each island

INITIAL APPROACH:
- Manual counting by humans
- Time: Weeks for one region
- Cost: Millions of dollars

SOLUTION - BFS:
1. Find a land pixel
2. Use queue to explore all connected land
3. Mark as visited
4. Count increments by 1
5. Repeat for unexplored land

WHY BFS (Queue) NOT DFS (Stack)?
- BFS explores in "waves" from starting point
- Natural for geographic spreading
- Won't get stuck in long narrow peninsulas

IMPACT:
- Automated island counting
- Ocean mapping
- Disease spread modeling (same algorithm!)
- Network connectivity analysis
```

---

# PART 6: HASH TABLE

## 🧬 Nature & Behavior

### What is a Hash Table?

```
CONCEPT:
- Transform key into array index using hash function
- Store value at that index
- Retrieve in O(1) average time

EXAMPLE: Phone Book
┌────────────────────────────────────────────────────┐
│ Name "Alice" → hash("Alice") → 3                  │
│                                                    │
│ Index: 0      1      2      3      4      5       │
│      ┌──────┬──────┬──────┬──────┬──────┬──────┐ │
│      │      │ Bob  │      │Alice │      │Carol │ │
│      │      │555-  │      │555-  │      │555-  │ │
│      │      │1234  │      │5678  │      │9999  │ │
│      └──────┴──────┴──────┴──────┴──────┴──────┘ │
│                                                    │
│ get("Alice") → hash("Alice") → 3 → return 555-5678│
│ Time: O(1)!                                       │
└────────────────────────────────────────────────────┘
```

### Collision Handling

```
PROBLEM: hash("Alice") = 3, hash("David") = 3
Two keys hash to same index!

SOLUTION 1: CHAINING (LinkedList at each index)
Index 3: Alice → David → null

SOLUTION 2: OPEN ADDRESSING (Find next empty)
Index 3: Alice
Index 4: David (probe to next)
```

### 🔴 Real-World Origin: Symbol Tables in Compilers (1953)

```
PROBLEM (IBM 701 Compiler):
- Program has thousands of variable names
- Need to look up variable type/value quickly
- Linear search through all variables: TOO SLOW

BEFORE HASH TABLES:
variables = [
    {name: "x", type: "int"},
    {name: "y", type: "float"},
    ... 10,000 more ...
]
lookup("x") → search all 10,000 → O(n)

SOLUTION BY H.P. LUHN (1953):
"What if we could calculate the position directly?"

hash("x") = some_formula("x") → index 42
variables[42] = {name: "x", type: "int"}
lookup("x") → O(1)!

IMPACT:
- Compilers became 100x faster
- Databases became possible
- Every modern language has HashMap
```

## 💻 Implementation WITHOUT Collections

```java
public class MyHashMap {
    private class Entry {
        int key;
        int value;
        Entry next;  // For chaining

        Entry(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private Entry[] buckets;
    private int capacity;
    private int size;
    private static final double LOAD_FACTOR = 0.75;

    public MyHashMap() {
        this.capacity = 16;
        this.buckets = new Entry[capacity];
        this.size = 0;
    }

    // HASH FUNCTION
    private int hash(int key) {
        return Math.abs(key) % capacity;
    }

    // PUT - O(1) average
    public void put(int key, int value) {
        if ((double) size / capacity >= LOAD_FACTOR) {
            resize();
        }

        int index = hash(key);
        Entry current = buckets[index];

        // Check if key exists
        while (current != null) {
            if (current.key == key) {
                current.value = value;  // Update
                return;
            }
            current = current.next;
        }

        // Add new entry at head (O(1))
        Entry newEntry = new Entry(key, value);
        newEntry.next = buckets[index];
        buckets[index] = newEntry;
        size++;
    }

    // GET - O(1) average
    public int get(int key) {
        int index = hash(key);
        Entry current = buckets[index];

        while (current != null) {
            if (current.key == key) {
                return current.value;
            }
            current = current.next;
        }
        return -1;  // Not found
    }

    // REMOVE - O(1) average
    public void remove(int key) {
        int index = hash(key);
        Entry current = buckets[index];
        Entry prev = null;

        while (current != null) {
            if (current.key == key) {
                if (prev == null) {
                    buckets[index] = current.next;
                } else {
                    prev.next = current.next;
                }
                size--;
                return;
            }
            prev = current;
            current = current.next;
        }
    }

    // CONTAINS - O(1) average
    public boolean containsKey(int key) {
        return get(key) != -1;
    }

    // RESIZE - O(n) but rare
    private void resize() {
        Entry[] oldBuckets = buckets;
        capacity *= 2;
        buckets = new Entry[capacity];
        size = 0;

        for (Entry head : oldBuckets) {
            while (head != null) {
                put(head.key, head.value);
                head = head.next;
            }
        }
    }

    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: LRU Cache

```
REAL-WORLD ORIGIN: Web Browser Cache (1990s)

PROBLEM AT NETSCAPE (1994):
- Browser loads images from internet
- Loading same image again = slow
- Store recently viewed images in memory
- Memory is limited (16MB in 1994!)

QUESTIONS:
1. How to quickly check if image is cached? → HashMap
2. Which image to remove when full? → Least Recently Used
3. How to track "recently used"? → Linked List

SOLUTION - HashMap + Doubly Linked List:
┌─────────────────────────────────────────────┐
│  HashMap: url → Node                        │
│  LinkedList: Most Recent ←→ ... ←→ Least   │
│                                             │
│  Access image:                              │
│  1. O(1) lookup in HashMap                  │
│  2. O(1) move to front of list              │
│                                             │
│  Cache full? Remove tail (LRU)              │
└─────────────────────────────────────────────┘

IMPACT:
- Every browser uses this
- Every database uses this
- Every CDN (Cloudflare, Akamai) uses this
- Redis, Memcached are based on this
```

---

# PART 7: TREES

## 🧬 Nature & Behavior

### What is a Tree?

```
HIERARCHICAL STRUCTURE:
┌────────────────────────────────────────────────────┐
│                                                    │
│              ┌───┐                                │
│              │ A │  ← Root                        │
│              └─┬─┘                                │
│         ┌─────┴─────┐                            │
│         ▼           ▼                            │
│      ┌───┐       ┌───┐                          │
│      │ B │       │ C │  ← Children of A         │
│      └─┬─┘       └─┬─┘                          │
│     ┌──┴──┐     ┌──┴──┐                        │
│     ▼     ▼     ▼     ▼                        │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐                     │
│   │ D │ │ E │ │ F │ │ G │  ← Leaves           │
│   └───┘ └───┘ └───┘ └───┘                     │
│                                                │
│ Properties:                                   │
│ - One root node                               │
│ - Each node has 0+ children                   │
│ - No cycles                                   │
│ - One path from root to any node              │
│                                                │
└────────────────────────────────────────────────────┘
```

### Binary Search Tree (BST)

```
BST PROPERTY:
- Left subtree: all values < node
- Right subtree: all values > node

          ┌───┐
          │ 8 │
          └─┬─┘
      ┌────┴────┐
      ▼         ▼
   ┌───┐     ┌───┐
   │ 3 │     │10 │
   └─┬─┘     └─┬─┘
  ┌──┴──┐     └──┐
  ▼     ▼        ▼
┌───┐ ┌───┐   ┌───┐
│ 1 │ │ 6 │   │14 │
└───┘ └───┘   └───┘

Search for 6:
8 → 6 < 8 → go left
3 → 6 > 3 → go right
6 → FOUND!

Time: O(log n) for balanced tree
```

### 🔴 Real-World Origin: File Systems (1965)

```
PROBLEM (UNIX, 1969):
- Computer needs to organize thousands of files
- Need hierarchical structure (folders in folders)
- Need fast file lookup

SOLUTION - TREE STRUCTURE:
/
├── home/
│   ├── alice/
│   │   ├── documents/
│   │   └── photos/
│   └── bob/
├── usr/
│   ├── bin/
│   └── lib/
└── etc/

WHY TREE?
- Natural hierarchy (parent-child)
- Path from root to any file
- Easy to navigate (cd, ls commands)

IMPACT:
- Every OS uses tree for files
- Every website URL is a tree path
- Every organization chart is a tree
- Every family tree is... a tree!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyBinaryTree {

    private class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    private TreeNode root;

    // INSERT (BST) - O(log n) average
    public void insert(int value) {
        root = insertRecursive(root, value);
    }

    private TreeNode insertRecursive(TreeNode node, int value) {
        if (node == null) {
            return new TreeNode(value);
        }

        if (value < node.value) {
            node.left = insertRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = insertRecursive(node.right, value);
        }

        return node;
    }

    // SEARCH - O(log n) average
    public boolean search(int value) {
        return searchRecursive(root, value);
    }

    private boolean searchRecursive(TreeNode node, int value) {
        if (node == null) return false;
        if (node.value == value) return true;

        if (value < node.value) {
            return searchRecursive(node.left, value);
        } else {
            return searchRecursive(node.right, value);
        }
    }

    // INORDER TRAVERSAL (Left, Root, Right) - Gives sorted order!
    public void inorder() {
        inorderRecursive(root);
    }

    private void inorderRecursive(TreeNode node) {
        if (node == null) return;
        inorderRecursive(node.left);
        System.out.print(node.value + " ");
        inorderRecursive(node.right);
    }

    // PREORDER TRAVERSAL (Root, Left, Right)
    public void preorder() {
        preorderRecursive(root);
    }

    private void preorderRecursive(TreeNode node) {
        if (node == null) return;
        System.out.print(node.value + " ");
        preorderRecursive(node.left);
        preorderRecursive(node.right);
    }

    // POSTORDER TRAVERSAL (Left, Right, Root)
    public void postorder() {
        postorderRecursive(root);
    }

    private void postorderRecursive(TreeNode node) {
        if (node == null) return;
        postorderRecursive(node.left);
        postorderRecursive(node.right);
        System.out.print(node.value + " ");
    }

    // HEIGHT - O(n)
    public int height() {
        return heightRecursive(root);
    }

    private int heightRecursive(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = heightRecursive(node.left);
        int rightHeight = heightRecursive(node.right);
        return 1 + Math.max(leftHeight, rightHeight);
    }

    // DELETE - O(log n) average
    public void delete(int value) {
        root = deleteRecursive(root, value);
    }

    private TreeNode deleteRecursive(TreeNode node, int value) {
        if (node == null) return null;

        if (value < node.value) {
            node.left = deleteRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = deleteRecursive(node.right, value);
        } else {
            // Found node to delete

            // Case 1: Leaf node
            if (node.left == null && node.right == null) {
                return null;
            }

            // Case 2: One child
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;

            // Case 3: Two children
            // Find inorder successor (smallest in right subtree)
            TreeNode successor = findMin(node.right);
            node.value = successor.value;
            node.right = deleteRecursive(node.right, successor.value);
        }

        return node;
    }

    private TreeNode findMin(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

---

# PART 8: HEAPS (PRIORITY QUEUE)

## 🧬 Nature & Behavior

### What is a Heap?

```
HEAP = Complete Binary Tree with Heap Property

MAX HEAP: Parent ≥ Children
          ┌───┐
          │100│
          └─┬─┘
       ┌───┴───┐
       ▼       ▼
     ┌───┐   ┌───┐
     │ 90│   │ 80│
     └─┬─┘   └─┬─┘
    ┌──┴──┐  ┌─┘
    ▼     ▼  ▼
  ┌───┐┌───┐┌───┐
  │70 ││60 ││50 │
  └───┘└───┘└───┘

MIN HEAP: Parent ≤ Children
(Root is smallest)

STORED AS ARRAY (Level order):
[100, 90, 80, 70, 60, 50]
  0   1   2   3   4   5

Parent of i: (i-1)/2
Left child of i: 2*i + 1
Right child of i: 2*i + 2
```

### 🔴 Real-World Origin: Emergency Room Triage (1970s)

```
PROBLEM IN HOSPITALS:
- Patients arrive randomly
- Some are critical, some are minor
- Need to treat most urgent first
- NOT first-come-first-served!

WITHOUT PRIORITY QUEUE:
- Check all patients to find most urgent
- Time: O(n) for each decision
- Lives lost due to delay!

WITH HEAP (Priority Queue):
- Insert patient with priority: O(log n)
- Get most urgent: O(1)
- Remove most urgent: O(log n)

EXAMPLE:
Patient arrives: priority 5 (medium)
Patient arrives: priority 9 (critical)
Patient arrives: priority 3 (minor)

Heap: [9, 5, 3]
Next patient to treat: 9 (critical) - O(1)!

NOW USED IN:
- OS process scheduling (highest priority process)
- Network packet prioritization
- Dijkstra's shortest path algorithm
- Event-driven simulations
```

## 💻 Implementation WITHOUT Collections

```java
public class MyMinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MyMinHeap(int capacity) {
        this.capacity = capacity;
        this.heap = new int[capacity];
        this.size = 0;
    }

    // PARENT INDEX
    private int parent(int i) { return (i - 1) / 2; }

    // LEFT CHILD INDEX
    private int leftChild(int i) { return 2 * i + 1; }

    // RIGHT CHILD INDEX
    private int rightChild(int i) { return 2 * i + 2; }

    // SWAP
    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // INSERT - O(log n)
    public void insert(int value) {
        if (size == capacity) {
            throw new RuntimeException("Heap is full!");
        }

        // Add at end
        heap[size] = value;
        int current = size;
        size++;

        // Bubble up
        while (current > 0 && heap[current] < heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }

    // PEEK (Get min) - O(1)
    public int peek() {
        if (size == 0) throw new RuntimeException("Heap is empty!");
        return heap[0];
    }

    // EXTRACT MIN - O(log n)
    public int extractMin() {
        if (size == 0) throw new RuntimeException("Heap is empty!");

        int min = heap[0];

        // Move last element to root
        heap[0] = heap[size - 1];
        size--;

        // Bubble down
        heapifyDown(0);

        return min;
    }

    // HEAPIFY DOWN
    private void heapifyDown(int i) {
        int smallest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && heap[left] < heap[smallest]) {
            smallest = left;
        }

        if (right < size && heap[right] < heap[smallest]) {
            smallest = right;
        }

        if (smallest != i) {
            swap(i, smallest);
            heapifyDown(smallest);
        }
    }

    // BUILD HEAP from array - O(n)
    public void buildHeap(int[] arr) {
        size = arr.length;
        heap = arr.clone();

        // Start from last non-leaf node
        for (int i = size / 2 - 1; i >= 0; i--) {
            heapifyDown(i);
        }
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

---

# 🔬 PART 10A: DEEP INTERNALS - EVERY DATA STRUCTURE AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║        THE COMPLETE INTERNAL VIEW - HOW DATA STRUCTURES ACTUALLY WORK            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  This section shows what REALLY happens when you use each data structure:        ║
║                                                                                   ║
║  • Exact memory layout (byte by byte)                                            ║
║  • CPU instructions executed                                                     ║
║  • Cache behavior and performance                                                ║
║  • JVM object overhead                                                           ║
║  • Real assembly/bytecode operations                                             ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## 1. ARRAYLIST DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST - COMPLETE INTERNAL VIEW                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ArrayList<Integer> list = new ArrayList<>();                                   │
│  list.add(42);                                                                   │
│  list.add(99);                                                                   │
│  list.add(15);                                                                   │
│                                                                                  │
│  MEMORY LAYOUT (JVM HotSpot, 64-bit, compressed oops):                          │
│                                                                                  │
│  ArrayList Object (HEAP):                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001 (unlocked)         │   │
│  │ 8      │ 4    │ Class Pointer          │ → ArrayList.class             │   │
│  │ 12     │ 4    │ padding                │ (alignment)                    │   │
│  │ 16     │ 4    │ elementData (ref)      │ 0x00ABC000 → Object[]         │   │
│  │ 20     │ 4    │ size                   │ 3                              │   │
│  │ 24     │ 4    │ modCount               │ 3 (modification counter)       │   │
│  │ 28     │ 4    │ padding                │                                │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 32 bytes for ArrayList object itself                                    │
│                                                                                  │
│                                                                                  │
│  Object[] elementData (at 0x00ABC000):                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ CONTENT                │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → Object[].class              │   │
│  │ 12     │ 4    │ Array Length           │ 10 (default capacity)         │   │
│  │ 16     │ 4    │ element[0] ref         │ 0x00DEF000 → Integer(42)      │   │
│  │ 20     │ 4    │ element[1] ref         │ 0x00DEF010 → Integer(99)      │   │
│  │ 24     │ 4    │ element[2] ref         │ 0x00DEF020 → Integer(15)      │   │
│  │ 28     │ 4    │ element[3] ref         │ null (empty slot)             │   │
│  │ ...    │ ...  │ ...                    │ null                          │   │
│  │ 52     │ 4    │ element[9] ref         │ null                          │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 56 bytes for Object[10] array                                           │
│                                                                                  │
│                                                                                  │
│  Integer Object (at 0x00DEF000 - for value 42):                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → Integer.class               │   │
│  │ 12     │ 4    │ value                  │ 42                             │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 16 bytes per Integer object!                                            │
│                                                                                  │
│                                                                                  │
│  TOTAL MEMORY FOR 3 INTEGERS:                                                   │
│  ─────────────────────────────                                                  │
│  • ArrayList object:    32 bytes                                                │
│  • Object[] array:      56 bytes                                                │
│  • 3 Integer objects:   48 bytes (16 × 3)                                       │
│  ───────────────────────────────                                                │
│  TOTAL:                 136 bytes!                                              │
│                                                                                  │
│  Compare to:                                                                     │
│  int[] arr = {42, 99, 15}; → 28 bytes (12 header + 4 length + 3×4 values)      │
│                                                                                  │
│  ArrayList uses 4.8x MORE memory than primitive array!                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST.GET() - WHAT ACTUALLY HAPPENS                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  int value = list.get(1);  // Get element at index 1                            │
│                                                                                  │
│  JAVA SOURCE (simplified):                                                       │
│  ─────────────────────────                                                      │
│  public E get(int index) {                                                       │
│      rangeCheck(index);                                                          │
│      return elementData(index);                                                  │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  BYTECODE (actual JVM instructions):                                            │
│  ────────────────────────────────────                                           │
│  aload_1           // Load 'list' reference onto stack                          │
│  iconst_1          // Push constant 1 (index) onto stack                        │
│  invokevirtual #4  // Method ArrayList.get:(I)Ljava/lang/Object;                │
│                                                                                  │
│  Inside get():                                                                   │
│  iload_1           // Load index parameter                                       │
│  aload_0           // Load 'this' reference                                      │
│  getfield #2       // Field elementData:[Ljava/lang/Object;                     │
│  iload_1           // Load index again                                           │
│  aaload            // Load element from array (THE KEY OPERATION!)              │
│  areturn           // Return object reference                                    │
│                                                                                  │
│                                                                                  │
│  ASSEMBLY (x86-64, after JIT compilation):                                       │
│  ──────────────────────────────────────────                                      │
│  ; Bounds check (usually eliminated by JIT if in loop)                          │
│  cmp    edx, [rax+0x10]      ; Compare index with array length                  │
│  jae    THROW_EXCEPTION      ; Jump if index >= length                          │
│                                                                                  │
│  ; Calculate element address                                                     │
│  movsxd rdx, edx             ; Sign-extend index to 64-bit                      │
│  mov    rax, [rax+0x18+rdx*4]; Load element reference from array                │
│  ; rax now contains reference to Integer object                                  │
│                                                                                  │
│                                                                                  │
│  CPU CYCLES BREAKDOWN:                                                           │
│  ─────────────────────                                                          │
│  1. bounds check:     ~1 cycle (comparison)                                     │
│  2. address calc:     ~1 cycle (multiply-add)                                   │
│  3. memory load:      ~4 cycles (L1 hit) or ~200 cycles (cache miss)           │
│  4. method overhead:  ~15-25 cycles (if not inlined by JIT)                    │
│                                                                                  │
│  BEST CASE: ~5-10 cycles (JIT inlined, L1 cache hit)                           │
│  WORST CASE: ~200+ cycles (cache miss on array or object)                       │
│                                                                                  │
│                                                                                  │
│  CACHE BEHAVIOR:                                                                 │
│  ───────────────                                                                │
│  When you access list.get(0):                                                   │
│  • CPU loads cache line containing array reference pointers                     │
│  • Adjacent elements (indices 1, 2, 3...) also loaded!                         │
│  • But actual Integer objects are scattered in heap                             │
│  • Each Integer object access may be a CACHE MISS                               │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Cache Line (64 bytes) loaded for array:                               │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │ ref[0] │ ref[1] │ ref[2] │ ref[3] │ ... │ ref[15] │              │  │   │
│  │  │ 4 bytes│ 4 bytes│ 4 bytes│ 4 bytes│ ... │ 4 bytes │              │  │   │
│  │  └────┬───┴────┬───┴────┬───┴────┬───┴─────┴─────────┘              │  │   │
│  │       │        │        │        │                                   │  │   │
│  │       ▼        ▼        ▼        ▼                                   │  │   │
│  │    Integer  Integer  Integer  Integer   ← SCATTERED IN HEAP!        │  │   │
│  │    @0x1000  @0x5000  @0x8000  @0x2000   ← EACH IS CACHE MISS!       │  │   │
│  │                                                                      │  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST RESIZE - WHAT ACTUALLY HAPPENS                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  // When ArrayList is full and you add another element:                         │
│  list.add(newElement);                                                           │
│                                                                                  │
│  STEP 1: Allocate new array (1.5x size)                                         │
│  ───────────────────────────────────────                                        │
│  int newCapacity = oldCapacity + (oldCapacity >> 1);  // 10 → 15               │
│  Object[] newElementData = new Object[newCapacity];                             │
│                                                                                  │
│  Memory: Request 15 × 8 = 120 bytes (+ header) from heap                        │
│  JVM: Find free space, potentially trigger GC if heap full                      │
│                                                                                  │
│                                                                                  │
│  STEP 2: Copy all elements                                                       │
│  ─────────────────────────                                                      │
│  System.arraycopy(oldArray, 0, newArray, 0, size);                              │
│                                                                                  │
│  What System.arraycopy actually does:                                           │
│  • Uses CPU's SIMD instructions (SSE/AVX) for bulk memory copy                 │
│  • Can copy 32-64 bytes per cycle using vector registers                        │
│  • Much faster than manual loop!                                                │
│                                                                                  │
│  Assembly (AVX-256 enabled):                                                     │
│  vmovdqu ymm0, [rsi]        ; Load 32 bytes from source                         │
│  vmovdqu [rdi], ymm0        ; Store 32 bytes to destination                     │
│  add     rsi, 32            ; Advance source pointer                            │
│  add     rdi, 32            ; Advance destination pointer                       │
│  ; Repeat until all copied                                                       │
│                                                                                  │
│                                                                                  │
│  STEP 3: Update reference                                                        │
│  ─────────────────────────                                                      │
│  this.elementData = newElementData;                                              │
│                                                                                  │
│  Old array becomes garbage → collected later by GC                              │
│                                                                                  │
│                                                                                  │
│  TIME COMPLEXITY ANALYSIS:                                                       │
│  ─────────────────────────                                                      │
│  • Single add() with resize: O(n) - must copy n elements                        │
│  • But resize happens rarely!                                                   │
│                                                                                  │
│  After n adds, how many total copies?                                           │
│  • 10 elements → 10 copies (resize from 10 to 15)                              │
│  • 15 elements → 15 copies (resize from 15 to 22)                              │
│  • 22 elements → 22 copies (resize from 22 to 33)                              │
│  • ...                                                                           │
│                                                                                  │
│  Total copies ≈ n + n/1.5 + n/1.5² + ... ≈ 3n                                  │
│  Average per add = 3n / n = 3 = O(1) AMORTIZED!                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. HASHMAP DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP - COMPLETE INTERNAL VIEW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HashMap<String, Integer> map = new HashMap<>();                                │
│  map.put("Alice", 25);                                                           │
│  map.put("Bob", 30);                                                             │
│  map.put("Charlie", 35);                                                         │
│                                                                                  │
│  MEMORY LAYOUT (Java 8+, 64-bit JVM):                                           │
│                                                                                  │
│  HashMap Object:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → HashMap.class               │   │
│  │ 12     │ 4    │ padding                │                                │   │
│  │ 16     │ 4    │ table (ref)            │ 0x00AA0000 → Node[]           │   │
│  │ 20     │ 4    │ size                   │ 3                              │   │
│  │ 24     │ 4    │ modCount               │ 3                              │   │
│  │ 28     │ 4    │ threshold              │ 12 (capacity × loadFactor)    │   │
│  │ 32     │ 4    │ loadFactor             │ 0.75f (as int bits)           │   │
│  │ 36     │ 4    │ padding                │                                │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 40 bytes for HashMap object                                             │
│                                                                                  │
│                                                                                  │
│  Node[] table (bucket array, at 0x00AA0000):                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ INDEX │ CONTENT                                                         │   │
│  ├───────┼─────────────────────────────────────────────────────────────────┤   │
│  │ [0]   │ null                                                            │   │
│  │ [1]   │ null                                                            │   │
│  │ [2]   │ 0x00BB0000 → Node("Alice", 25, null)                           │   │
│  │ [3]   │ null                                                            │   │
│  │ [4]   │ 0x00BB0040 → Node("Bob", 30, null)                             │   │
│  │ [5]   │ null                                                            │   │
│  │ [6]   │ null                                                            │   │
│  │ [7]   │ 0x00BB0080 → Node("Charlie", 35, null)                         │   │
│  │ ...   │ null                                                            │   │
│  │ [15]  │ null                                                            │   │
│  └───────┴─────────────────────────────────────────────────────────────────┘   │
│  TOTAL: 16 + (16 × 4) = 80 bytes for Node[16]                                  │
│                                                                                  │
│                                                                                  │
│  Node Object (at 0x00BB0000 for "Alice"):                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → HashMap$Node.class          │   │
│  │ 12     │ 4    │ hash                   │ 63479193 (cached hash)        │   │
│  │ 16     │ 4    │ key (ref)              │ 0x00CC0000 → "Alice"          │   │
│  │ 20     │ 4    │ value (ref)            │ 0x00DD0000 → Integer(25)      │   │
│  │ 24     │ 4    │ next (ref)             │ null (no collision)           │   │
│  │ 28     │ 4    │ padding                │                                │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 32 bytes per Node                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP.PUT() - WHAT ACTUALLY HAPPENS                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  map.put("Alice", 25);                                                           │
│                                                                                  │
│  STEP 1: Calculate hash                                                          │
│  ───────────────────────                                                        │
│  int h = key.hashCode();           // "Alice".hashCode() = 63479193             │
│  int hash = h ^ (h >>> 16);        // Spread high bits to low bits              │
│                                                                                  │
│  Why XOR with right shift?                                                       │
│  • Original:  h    = 0011_1100_0110_0100_0000_0000_1001_1001                    │
│  • Shifted:   h>>>16 = 0000_0000_0000_0000_0011_1100_0110_0100                  │
│  • XOR:       hash = 0011_1100_0110_0100_0011_1100_1111_1101                    │
│                                                                                  │
│  This makes low bits depend on high bits, better distribution!                  │
│                                                                                  │
│                                                                                  │
│  STEP 2: Calculate bucket index                                                  │
│  ───────────────────────────────                                                │
│  int index = hash & (n - 1);       // n = 16 (power of 2)                       │
│                                                                                  │
│  Why AND with (n-1)?                                                             │
│  • n = 16 = 0001_0000                                                            │
│  • n-1 = 15 = 0000_1111                                                          │
│  • hash & 15 = extracts last 4 bits = index 0-15                                │
│                                                                                  │
│  This is FASTER than modulo:                                                    │
│  • hash % n → ~20-80 CPU cycles (division)                                      │
│  • hash & (n-1) → 1 CPU cycle (bitwise AND)                                    │
│                                                                                  │
│                                                                                  │
│  STEP 3: Insert into bucket                                                      │
│  ──────────────────────────                                                     │
│  if (table[index] == null) {                                                     │
│      table[index] = new Node(hash, key, value, null);                           │
│  } else {                                                                        │
│      // Collision! Walk the chain or convert to tree                            │
│      Node e = table[index];                                                      │
│      while (e != null) {                                                         │
│          if (e.hash == hash && e.key.equals(key)) {                             │
│              e.value = value;  // Update existing                               │
│              return;                                                             │
│          }                                                                       │
│          e = e.next;                                                             │
│      }                                                                           │
│      // Add at end of chain                                                      │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  STEP 4: Check for tree conversion (Java 8+)                                    │
│  ─────────────────────────────────────────────                                  │
│  if (chainLength >= 8 && tableSize >= 64) {                                     │
│      treeifyBin(table, index);  // Convert chain to Red-Black Tree             │
│  }                                                                               │
│                                                                                  │
│  Why threshold = 8?                                                              │
│  • Probability of 8 collisions under random hash is 0.00000006                  │
│  • Tree overhead (48 bytes/node) only worthwhile for long chains               │
│  • Tree: O(log n) search vs Chain: O(n) search                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP.GET() - CPU INSTRUCTION LEVEL                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Integer age = map.get("Alice");                                                 │
│                                                                                  │
│  BYTECODE:                                                                       │
│  ─────────                                                                      │
│  aload_1                    // Load map reference                               │
│  ldc "Alice"                // Push string constant                              │
│  invokevirtual #5           // HashMap.get(Object)Object                        │
│  checkcast #6               // Cast to Integer                                  │
│  invokevirtual #7           // Integer.intValue()                               │
│  istore_2                   // Store in local variable                          │
│                                                                                  │
│                                                                                  │
│  INSIDE HashMap.get() - JIT COMPILED x86-64:                                    │
│  ─────────────────────────────────────────────                                  │
│  ; rdi = this (HashMap), rsi = key ("Alice")                                    │
│                                                                                  │
│  ; Step 1: Get hash                                                              │
│  mov    eax, [rsi+0x08]     ; Load cached hashCode from String                  │
│  mov    edx, eax            ; Copy hash                                          │
│  shr    edx, 16             ; h >>> 16                                          │
│  xor    eax, edx            ; h ^ (h >>> 16)                                    │
│                                                                                  │
│  ; Step 2: Get table and index                                                   │
│  mov    rcx, [rdi+0x10]     ; Load table reference                              │
│  mov    r8d, [rcx+0x0C]     ; Load table.length                                 │
│  sub    r8d, 1              ; n - 1                                              │
│  and    eax, r8d            ; hash & (n-1) = index                              │
│                                                                                  │
│  ; Step 3: Get bucket                                                            │
│  mov    rcx, [rcx+0x10+rax*8] ; Load table[index] (Node reference)             │
│  test   rcx, rcx            ; Check if null                                      │
│  jz     NOT_FOUND           ; Return null if empty bucket                       │
│                                                                                  │
│  ; Step 4: Check node                                                            │
│  LOOP:                                                                           │
│  cmp    [rcx+0x0C], eax     ; Compare cached hash                               │
│  jne    NEXT_NODE           ; Skip if hash different                            │
│  mov    rdi, [rcx+0x10]     ; Load node.key                                     │
│  call   String.equals       ; Compare keys                                       │
│  test   al, al              ; Check result                                       │
│  jz     NEXT_NODE           ; Continue if not equal                             │
│  mov    rax, [rcx+0x14]     ; Load node.value - FOUND!                          │
│  ret                                                                             │
│                                                                                  │
│  NEXT_NODE:                                                                      │
│  mov    rcx, [rcx+0x18]     ; Load node.next                                    │
│  test   rcx, rcx            ; Check if null                                      │
│  jnz    LOOP                ; Continue if more nodes                            │
│                                                                                  │
│  NOT_FOUND:                                                                      │
│  xor    eax, eax            ; Return null                                       │
│  ret                                                                             │
│                                                                                  │
│                                                                                  │
│  CPU CYCLES (no collision, L1 cache hit):                                       │
│  ────────────────────────────────────────                                       │
│  • Hash calculation:     ~5 cycles                                              │
│  • Index calculation:    ~2 cycles                                              │
│  • Memory loads:         ~12 cycles (3 loads × 4 cycles)                        │
│  • Method call:          ~20 cycles (if not fully inlined)                      │
│  ───────────────────────────────────────                                        │
│  TOTAL:                  ~40 cycles ≈ 15 nanoseconds @ 3GHz                    │
│                                                                                  │
│  With cache miss: Add ~200 cycles per miss!                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP COLLISION HANDLING - DEEP VIEW                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SCENARIO: Two keys with same bucket index                                       │
│                                                                                  │
│  map.put("Aa", 1);   // "Aa".hashCode() = 2112                                  │
│  map.put("BB", 2);   // "BB".hashCode() = 2112  (SAME HASH!)                    │
│                                                                                  │
│  This happens because:                                                           │
│  'A' = 65, 'a' = 97, 'B' = 66                                                   │
│  "Aa" = 31 × 65 + 97 = 2015 + 97 = 2112                                         │
│  "BB" = 31 × 66 + 66 = 2046 + 66 = 2112                                         │
│                                                                                  │
│                                                                                  │
│  LINKED LIST COLLISION CHAIN (before 8 nodes):                                  │
│  ─────────────────────────────────────────────                                  │
│  table[bucket]:                                                                  │
│                                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                   │
│  │ Node            │     │ Node            │                                   │
│  │ hash: 2112      │     │ hash: 2112      │                                   │
│  │ key: "Aa"       │────►│ key: "BB"       │────► null                         │
│  │ value: 1        │     │ value: 2        │                                   │
│  └─────────────────┘     └─────────────────┘                                   │
│                                                                                  │
│  get("BB") requires:                                                             │
│  1. Hash calculation → 2112                                                      │
│  2. Bucket lookup → table[2112 & 15]                                            │
│  3. Check "Aa" hash (2112) and equals() → NOT MATCH                            │
│  4. Follow next pointer                                                          │
│  5. Check "BB" hash (2112) and equals() → MATCH!                               │
│  Time: O(n) where n = chain length                                              │
│                                                                                  │
│                                                                                  │
│  RED-BLACK TREE (after 8 nodes in same bucket, Java 8+):                        │
│  ──────────────────────────────────────────────────────                         │
│                                                                                  │
│  table[bucket]:                                                                  │
│                                                                                  │
│           ┌─────────────────┐                                                   │
│           │ TreeNode (BLACK)│                                                   │
│           │ hash: 2112      │                                                   │
│           │ key: "Cc"       │                                                   │
│           └────────┬────────┘                                                   │
│                    │                                                             │
│         ┌──────────┴──────────┐                                                 │
│         ▼                     ▼                                                 │
│  ┌─────────────┐      ┌─────────────┐                                          │
│  │ TreeNode    │      │ TreeNode    │                                          │
│  │ (RED)       │      │ (RED)       │                                          │
│  │ key: "Aa"   │      │ key: "Ee"   │                                          │
│  └──────┬──────┘      └──────┬──────┘                                          │
│         │                    │                                                   │
│    ┌────┴────┐          ┌────┴────┐                                            │
│    ▼         ▼          ▼         ▼                                            │
│  [node]   [node]      [node]   [node]                                          │
│                                                                                  │
│  Tree lookup: O(log n) instead of O(n)!                                         │
│  8 nodes: 3 comparisons instead of 8                                            │
│                                                                                  │
│                                                                                  │
│  TreeNode Memory (MORE than regular Node):                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │                                │   │
│  │ 8      │ 4    │ Class Pointer          │                                │   │
│  │ 12     │ 4    │ hash                   │                                │   │
│  │ 16     │ 4    │ key                    │                                │   │
│  │ 20     │ 4    │ value                  │                                │   │
│  │ 24     │ 4    │ next                   │ (for iteration)               │   │
│  │ 28     │ 4    │ parent                 │ (tree structure)              │   │
│  │ 32     │ 4    │ left                   │ (tree structure)              │   │
│  │ 36     │ 4    │ right                  │ (tree structure)              │   │
│  │ 40     │ 1    │ red (boolean)          │ (color flag)                  │   │
│  │ 41     │ 7    │ padding                │                                │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 48 bytes vs 32 bytes for regular Node (50% more memory)                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. LINKEDLIST DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LINKEDLIST - COMPLETE INTERNAL VIEW                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LinkedList<String> list = new LinkedList<>();                                  │
│  list.add("A");                                                                  │
│  list.add("B");                                                                  │
│  list.add("C");                                                                  │
│                                                                                  │
│  MEMORY LAYOUT:                                                                  │
│                                                                                  │
│  LinkedList Object:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → LinkedList.class            │   │
│  │ 12     │ 4    │ padding                │                                │   │
│  │ 16     │ 4    │ first (ref)            │ 0x00110000 → Node("A")        │   │
│  │ 20     │ 4    │ last (ref)             │ 0x00330000 → Node("C")        │   │
│  │ 24     │ 4    │ size                   │ 3                              │   │
│  │ 28     │ 4    │ modCount               │ 3                              │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 32 bytes                                                                │
│                                                                                  │
│                                                                                  │
│  Node Objects (SCATTERED in heap - not contiguous!):                            │
│                                                                                  │
│  Node @ 0x00110000:           Node @ 0x00220000:           Node @ 0x00330000:  │
│  ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐│
│  │ Mark Word   │ 8     │     │ Mark Word   │ 8     │     │ Mark Word   │ 8     ││
│  │ Class Ptr   │ 4     │     │ Class Ptr   │ 4     │     │ Class Ptr   │ 4     ││
│  │ padding     │ 4     │     │ padding     │ 4     │     │ padding     │ 4     ││
│  │ item: "A"   │ 4     │     │ item: "B"   │ 4     │     │ item: "C"   │ 4     ││
│  │ prev: null  │ 4     │     │ prev: 0x110 │ 4     │     │ prev: 0x220 │ 4     ││
│  │ next: 0x220 │ 4     │     │ next: 0x330 │ 4     │     │ next: null  │ 4     ││
│  │ padding     │ 4     │     │ padding     │ 4     │     │ padding     │ 4     ││
│  └─────────────────────┘     └─────────────────────┘     └─────────────────────┘│
│  32 bytes each                32 bytes each                32 bytes each        │
│                                                                                  │
│                                                                                  │
│  MEMORY LAYOUT IN HEAP (reality):                                               │
│  ────────────────────────────────                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Address │ Content                                                       │  │
│  ├──────────┼───────────────────────────────────────────────────────────────┤  │
│  │ 0x00110  │ [Node A]                                                      │  │
│  │ 0x00120  │ [Some other object...]                                        │  │
│  │ 0x00150  │ [Some other object...]                                        │  │
│  │ 0x00220  │ [Node B]  ← FAR from Node A!                                 │  │
│  │ 0x00250  │ [Some other object...]                                        │  │
│  │ 0x00330  │ [Node C]  ← FAR from Node B!                                 │  │
│  └──────────┴───────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  THIS IS WHY LINKEDLIST HAS POOR CACHE PERFORMANCE!                             │
│  Each node access is likely a cache miss (~200 cycles penalty)                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LINKEDLIST.ADD(index, element) - INTERNAL VIEW                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  list.add(1, "X");  // Insert "X" at index 1                                    │
│                                                                                  │
│  BEFORE:                                                                         │
│                                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                                   │
│  │ Node A  │────►│ Node B  │────►│ Node C  │                                   │
│  │         │◄────│         │◄────│         │                                   │
│  └─────────┘     └─────────┘     └─────────┘                                   │
│     first                           last                                        │
│                                                                                  │
│                                                                                  │
│  STEP 1: Find position (O(n) traversal)                                         │
│  ───────────────────────────────────────                                        │
│  if (index < size/2) {                                                           │
│      // Start from HEAD (index 1 < 3/2, so start from head)                     │
│      Node node = first;                                                          │
│      for (int i = 0; i < index; i++)                                            │
│          node = node.next;                                                       │
│  } else {                                                                        │
│      // Start from TAIL (optimization for second half)                          │
│      Node node = last;                                                           │
│      for (int i = size - 1; i > index; i--)                                     │
│          node = node.prev;                                                       │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  STEP 2: Create new node and relink (O(1))                                      │
│  ─────────────────────────────────────────                                      │
│  Node newNode = new Node("X");   // Allocate 32 bytes on heap                   │
│  Node succ = node;               // successor = Node B                          │
│  Node pred = node.prev;          // predecessor = Node A                        │
│                                                                                  │
│  // Relink pointers (4 pointer updates)                                         │
│  newNode.prev = pred;            // X.prev = A                                  │
│  newNode.next = succ;            // X.next = B                                  │
│  pred.next = newNode;            // A.next = X                                  │
│  succ.prev = newNode;            // B.prev = X                                  │
│                                                                                  │
│                                                                                  │
│  AFTER:                                                                          │
│                                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │ Node A  │────►│ Node X  │────►│ Node B  │────►│ Node C  │                   │
│  │         │◄────│  (NEW)  │◄────│         │◄────│         │                   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘                   │
│     first                                           last                        │
│                                                                                  │
│                                                                                  │
│  ASSEMBLY FOR POINTER UPDATE:                                                    │
│  ─────────────────────────────                                                  │
│  ; pred.next = newNode                                                           │
│  mov    [rax+0x18], rcx      ; Store newNode reference in pred.next            │
│                                                                                  │
│  ; succ.prev = newNode                                                           │
│  mov    [rbx+0x14], rcx      ; Store newNode reference in succ.prev            │
│                                                                                  │
│  Each pointer update: 1 CPU cycle (just a memory store)                         │
│  But finding the position: O(n) memory accesses with cache misses!              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4. STACK DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STACK - COMPLETE INTERNAL VIEW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Java's Stack class extends Vector (legacy, synchronized)                       │
│  Modern alternative: Deque<E> stack = new ArrayDeque<>();                       │
│                                                                                  │
│                                                                                  │
│  ARRAYDEQUE AS STACK - MEMORY LAYOUT:                                           │
│  ─────────────────────────────────────                                          │
│  ArrayDeque<Integer> stack = new ArrayDeque<>();                                │
│  stack.push(10);                                                                 │
│  stack.push(20);                                                                 │
│  stack.push(30);                                                                 │
│                                                                                  │
│  ArrayDeque Object:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → ArrayDeque.class            │   │
│  │ 12     │ 4    │ padding                │                                │   │
│  │ 16     │ 4    │ elements (ref)         │ → Object[16]                  │   │
│  │ 20     │ 4    │ head                   │ 13 (index of first element)   │   │
│  │ 24     │ 4    │ tail                   │ 0 (index after last element)  │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│                                                                                  │
│  Circular Buffer (elements array):                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Index │  0  │  1  │ ... │ 13  │ 14  │ 15  │                            │   │
│  │ Value │null │null │ ... │  30 │  20 │  10 │                            │   │
│  │       │     │     │     │ TOP │     │BOTTOM│                           │   │
│  │       │tail │     │     │head │     │     │                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  push() grows towards index 0 (head decrements)                                 │
│  pop() shrinks from head (head increments)                                      │
│                                                                                  │
│                                                                                  │
│  PUSH OPERATION - CPU LEVEL:                                                     │
│  ───────────────────────────                                                    │
│  stack.push(40);                                                                 │
│                                                                                  │
│  Java:                                                                           │
│  head = (head - 1) & (elements.length - 1);  // 13-1 = 12                      │
│  elements[head] = element;                                                       │
│                                                                                  │
│  Bytecode:                                                                       │
│  aload_0                     // Load 'this'                                     │
│  aload_0                     // Load 'this' again                               │
│  getfield #2                 // Get head                                        │
│  iconst_1                    // Push 1                                          │
│  isub                        // head - 1                                        │
│  aload_0                     // Load 'this'                                     │
│  getfield #3                 // Get elements.length                             │
│  iconst_1                    // Push 1                                          │
│  isub                        // length - 1                                      │
│  iand                        // & (circular wrap)                               │
│  dup                         // Duplicate for store                             │
│  putfield #2                 // Store new head                                  │
│  aload_0                     // Load 'this'                                     │
│  getfield #4                 // Get elements array                              │
│  swap                        // Swap index and array ref                        │
│  aload_1                     // Load element                                    │
│  aastore                     // Store in array                                  │
│                                                                                  │
│  CPU Cycles: ~15-20 (if JIT inlined and cache hit)                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5. BINARY TREE / BST DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BINARY SEARCH TREE - COMPLETE INTERNAL VIEW                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TreeMap<Integer, String> tree = new TreeMap<>();                               │
│  tree.put(50, "A");                                                              │
│  tree.put(30, "B");                                                              │
│  tree.put(70, "C");                                                              │
│  tree.put(20, "D");                                                              │
│  tree.put(40, "E");                                                              │
│                                                                                  │
│  TREE STRUCTURE:                                                                 │
│                        [50,"A"]                                                  │
│                       /        \                                                 │
│                  [30,"B"]    [70,"C"]                                            │
│                 /      \                                                         │
│            [20,"D"]  [40,"E"]                                                    │
│                                                                                  │
│                                                                                  │
│  RED-BLACK TREE NODE (TreeMap.Entry):                                           │
│  ─────────────────────────────────────                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │   │
│  │ 8      │ 4    │ Class Pointer          │ → TreeMap$Entry.class         │   │
│  │ 12     │ 4    │ key (ref)              │ → Integer(50)                 │   │
│  │ 16     │ 4    │ value (ref)            │ → "A"                         │   │
│  │ 20     │ 4    │ left (ref)             │ → Entry(30)                   │   │
│  │ 24     │ 4    │ right (ref)            │ → Entry(70)                   │   │
│  │ 28     │ 4    │ parent (ref)           │ null (root)                   │   │
│  │ 32     │ 1    │ color (boolean)        │ BLACK                         │   │
│  │ 33     │ 7    │ padding                │                                │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 40 bytes per Entry                                                      │
│                                                                                  │
│                                                                                  │
│  TREE TRAVERSAL - CPU LEVEL (find key 40):                                      │
│  ─────────────────────────────────────────                                      │
│  Integer key = 40;                                                               │
│  Entry<K,V> p = root;  // Start at root (50)                                    │
│                                                                                  │
│  while (p != null) {                                                             │
│      int cmp = key.compareTo(p.key);                                            │
│      if (cmp < 0)                                                                │
│          p = p.left;                                                             │
│      else if (cmp > 0)                                                           │
│          p = p.right;                                                            │
│      else                                                                        │
│          return p;  // Found!                                                    │
│  }                                                                               │
│                                                                                  │
│  Iteration 1: key=40, node=50 → 40 < 50 → go left                              │
│  Iteration 2: key=40, node=30 → 40 > 30 → go right                             │
│  Iteration 3: key=40, node=40 → FOUND!                                          │
│                                                                                  │
│  Total: 3 comparisons, 3 memory accesses                                        │
│  For n nodes: O(log n) comparisons in balanced tree                             │
│                                                                                  │
│                                                                                  │
│  MEMORY ACCESS PATTERN:                                                          │
│  ─────────────────────                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Access 1: Load Entry(50) from RAM                                       │  │
│  │            → CACHE MISS (200 cycles)                                     │  │
│  │            → Also loads Entry(50).left and right pointers               │  │
│  │                                                                          │  │
│  │  Access 2: Load Entry(30) from RAM                                       │  │
│  │            → CACHE MISS (200 cycles) - different memory location        │  │
│  │                                                                          │  │
│  │  Access 3: Load Entry(40) from RAM                                       │  │
│  │            → CACHE MISS (200 cycles) - different memory location        │  │
│  │                                                                          │  │
│  │  TOTAL: ~600 cycles just for memory access!                             │  │
│  │                                                                          │  │
│  │  Compare to Array: 3 accesses in same cache line = ~12 cycles           │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│                                                                                  │
│  WHY TREES ARE STILL USEFUL:                                                    │
│  ──────────────────────────                                                     │
│  • Sorted order guaranteed                                                       │
│  • Range queries: O(log n + k) where k = results                                │
│  • Insert/Delete: O(log n) vs O(n) for sorted array                            │
│  • No resize needed like HashMap                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 6. HEAP / PRIORITY QUEUE DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HEAP (PRIORITY QUEUE) - COMPLETE INTERNAL VIEW                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PriorityQueue<Integer> heap = new PriorityQueue<>();                           │
│  heap.offer(50); heap.offer(30); heap.offer(70);                                │
│  heap.offer(20); heap.offer(40);                                                 │
│                                                                                  │
│  HEAP STRUCTURE (MIN HEAP):                                                      │
│                                                                                  │
│                   20  (index 0)                                                  │
│                  /  \                                                            │
│                30    70  (index 1, 2)                                            │
│               /  \                                                               │
│             50   40  (index 3, 4)                                                │
│                                                                                  │
│  STORED AS ARRAY (CONTIGUOUS - CACHE FRIENDLY!):                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │  6  │ ... │                  │ │
│  │ Value │ 20  │ 30  │ 70  │ 50  │ 40  │null │null │ ... │                  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  PARENT-CHILD RELATIONSHIP (NO POINTERS NEEDED!):                               │
│  • Parent of index i:     (i - 1) / 2                                           │
│  • Left child of i:       2 * i + 1                                             │
│  • Right child of i:      2 * i + 2                                             │
│                                                                                  │
│  Example: Node at index 1 (value 30)                                            │
│  • Parent: (1-1)/2 = 0 → value 20 ✓                                            │
│  • Left:   2*1+1 = 3   → value 50 ✓                                            │
│  • Right:  2*1+2 = 4   → value 40 ✓                                            │
│                                                                                  │
│                                                                                  │
│  WHY ARRAY IS BRILLIANT FOR HEAP:                                               │
│  ─────────────────────────────────                                              │
│  1. No pointer overhead (saves memory)                                          │
│  2. All nodes in contiguous memory (cache friendly)                             │
│  3. Parent/child calculation: just arithmetic (fast!)                           │
│  4. Complete binary tree guaranteed by structure                                │
│                                                                                  │
│                                                                                  │
│  HEAPIFY UP (after insert) - CPU LEVEL:                                         │
│  ───────────────────────────────────────                                        │
│  heap.offer(10);  // Insert 10 (smaller than root!)                             │
│                                                                                  │
│  Step 1: Add at end                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │ │
│  │ Value │ 20  │ 30  │ 70  │ 50  │ 40  │ 10  │ ← NEW                        │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Step 2: Bubble up (swap with parent if smaller)                                │
│  • index=5, parent=(5-1)/2=2, arr[5]=10 < arr[2]=70 → SWAP                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │ │
│  │ Value │ 20  │ 30  │ 10  │ 50  │ 40  │ 70  │                              │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  • index=2, parent=(2-1)/2=0, arr[2]=10 < arr[0]=20 → SWAP                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │ │
│  │ Value │ 10  │ 30  │ 20  │ 50  │ 40  │ 70  │ ← FINAL                      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Assembly for parent calculation:                                                │
│  mov    eax, edi            ; eax = index                                       │
│  sub    eax, 1              ; eax = index - 1                                   │
│  sar    eax, 1              ; eax = (index-1) >> 1 (signed right shift)        │
│  ; Only 3 CPU cycles!                                                           │
│                                                                                  │
│                                                                                  │
│  COMPLEXITY ANALYSIS:                                                            │
│  ────────────────────                                                           │
│  • offer() / add(): O(log n) - bubble up at most log n levels                  │
│  • poll() / remove(): O(log n) - bubble down at most log n levels              │
│  • peek(): O(1) - just return arr[0]                                            │
│  • heapify array: O(n) - bottom-up construction (not O(n log n)!)              │
│                                                                                  │
│                                                                                  │
│  CACHE PERFORMANCE vs TREE:                                                      │
│  ──────────────────────────                                                     │
│  For poll() traversing 3 levels:                                                │
│                                                                                  │
│  HEAP (array):                                                                   │
│  • All nodes likely in same cache line: ~4 cycles per access                   │
│  • Total: ~12 cycles                                                             │
│                                                                                  │
│  TREE (pointers):                                                                │
│  • Each node in different cache line: ~200 cycles per access                   │
│  • Total: ~600 cycles                                                            │
│                                                                                  │
│  HEAP IS 50x FASTER due to cache locality!                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7. GRAPH REPRESENTATION DEEP INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GRAPH - COMPLETE INTERNAL VIEW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GRAPH:                                                                          │
│        0 ─── 1                                                                   │
│        │     │                                                                   │
│        │     │                                                                   │
│        3 ─── 2                                                                   │
│                                                                                  │
│                                                                                  │
│  REPRESENTATION 1: ADJACENCY MATRIX                                              │
│  ─────────────────────────────────────                                          │
│  int[][] matrix = {                                                              │
│      {0, 1, 0, 1},  // Node 0 connected to 1, 3                                 │
│      {1, 0, 1, 0},  // Node 1 connected to 0, 2                                 │
│      {0, 1, 0, 1},  // Node 2 connected to 1, 3                                 │
│      {1, 0, 1, 0}   // Node 3 connected to 0, 2                                 │
│  };                                                                              │
│                                                                                  │
│  MEMORY LAYOUT:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  int[][] object header:           24 bytes                              │   │
│  │  int[] row 0 (+ header):          16 + 16 = 32 bytes                   │   │
│  │  int[] row 1 (+ header):          16 + 16 = 32 bytes                   │   │
│  │  int[] row 2 (+ header):          16 + 16 = 32 bytes                   │   │
│  │  int[] row 3 (+ header):          16 + 16 = 32 bytes                   │   │
│  │  ────────────────────────────────────────────────────                   │   │
│  │  TOTAL:                           152 bytes for 4 nodes                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Space: O(V²) - wasteful for sparse graphs!                                     │
│  Check edge (u,v): O(1) - just matrix[u][v]                                     │
│  Get all neighbors: O(V) - must scan entire row                                 │
│                                                                                  │
│                                                                                  │
│  REPRESENTATION 2: ADJACENCY LIST                                                │
│  ────────────────────────────────────                                           │
│  List<List<Integer>> adjList = new ArrayList<>();                               │
│  adjList.add(Arrays.asList(1, 3));  // Node 0                                   │
│  adjList.add(Arrays.asList(0, 2));  // Node 1                                   │
│  adjList.add(Arrays.asList(1, 3));  // Node 2                                   │
│  adjList.add(Arrays.asList(0, 2));  // Node 3                                   │
│                                                                                  │
│  MEMORY LAYOUT:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  adjList[0] ──────► ArrayList [1, 3]                                   │   │
│  │  adjList[1] ──────► ArrayList [0, 2]                                   │   │
│  │  adjList[2] ──────► ArrayList [1, 3]                                   │   │
│  │  adjList[3] ──────► ArrayList [0, 2]                                   │   │
│  │                                                                         │   │
│  │  Outer ArrayList:         32 bytes                                      │   │
│  │  Inner ArrayList × 4:     32 × 4 = 128 bytes                           │   │
│  │  Integer objects × 8:     16 × 8 = 128 bytes                           │   │
│  │  ────────────────────────────────────────                               │   │
│  │  TOTAL:                   ~288 bytes                                    │   │
│  │                                                                         │   │
│  │  BUT for sparse graph with 1000 nodes and 50 edges:                    │   │
│  │  Matrix: 1000 × 1000 × 4 = 4 MB                                        │   │
│  │  List:   ~50 × 48 = 2.4 KB                                             │   │
│  │  ADJACENCY LIST IS 1000x SMALLER!                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Space: O(V + E) - much better for sparse graphs                                │
│  Check edge (u,v): O(degree(u)) - must search neighbor list                    │
│  Get all neighbors: O(degree(u)) - just return the list                        │
│                                                                                  │
│                                                                                  │
│  BFS TRAVERSAL - CPU LEVEL:                                                      │
│  ──────────────────────────                                                     │
│  Queue<Integer> queue = new LinkedList<>();                                     │
│  boolean[] visited = new boolean[V];                                            │
│  queue.offer(0);                                                                 │
│  visited[0] = true;                                                              │
│                                                                                  │
│  while (!queue.isEmpty()) {                                                      │
│      int node = queue.poll();                                                    │
│      for (int neighbor : adjList.get(node)) {                                   │
│          if (!visited[neighbor]) {                                               │
│              visited[neighbor] = true;                                           │
│              queue.offer(neighbor);                                              │
│          }                                                                       │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│  CACHE BEHAVIOR:                                                                 │
│  • visited[] array: CONTIGUOUS, cache-friendly                                  │
│  • adjList traversal: SCATTERED, cache-unfriendly                               │
│  • Queue operations: depends on implementation                                   │
│                                                                                  │
│  OPTIMIZATION: Use int[] instead of List<Integer> for neighbors                │
│  • Avoids Integer autoboxing overhead                                           │
│  • Better cache locality for neighbor iteration                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔬 PART 10B: JAVA COLLECTIONS FRAMEWORK - INTERNAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JAVA COLLECTIONS HIERARCHY - COMPLETE VIEW                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              Iterable<E>                                        │
│                                  │                                               │
│                             Collection<E>                                        │
│                    ┌────────────┼────────────┐                                  │
│                    │            │            │                                   │
│                 List<E>      Set<E>      Queue<E>                               │
│                    │            │            │                                   │
│        ┌──────────┬┴─────┐     │      ┌─────┴─────┐                            │
│        │          │      │     │      │           │                             │
│   ArrayList  LinkedList  │  ┌──┴──┐   │       Deque<E>                         │
│                    Vector │  │     │  │           │                             │
│                          │ HashSet  TreeSet      │                              │
│                          │  │       │     PriorityQueue                         │
│                          │  │  LinkedHashSet   ArrayDeque                       │
│                          │  │                                                   │
│                          │  └─────────────────────┐                             │
│                          │                        │                             │
│                        Map<K,V>           SortedSet<E>                          │
│                    ┌─────┴─────┐           (TreeSet)                            │
│                    │           │                                                │
│                HashMap    TreeMap                                               │
│                    │                                                             │
│              LinkedHashMap                                                       │
│                                                                                  │
│                                                                                  │
│  THREAD-SAFE VERSIONS (java.util.concurrent):                                   │
│  ─────────────────────────────────────────────                                  │
│  • ConcurrentHashMap    - Lock-free reads, segment locks for writes            │
│  • CopyOnWriteArrayList - Copy on write, great for read-heavy                  │
│  • ConcurrentLinkedQueue - Lock-free queue using CAS operations                │
│  • BlockingQueue        - Thread coordination (producer-consumer)              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│               WHEN TO USE WHICH COLLECTION - DECISION TREE                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  START HERE: What do you need?                                                  │
│              │                                                                   │
│              ├─── Key-Value pairs?                                              │
│              │         │                                                         │
│              │         ├─── Need sorted keys? ──────► TreeMap                   │
│              │         │                                                         │
│              │         ├─── Need insertion order? ──► LinkedHashMap             │
│              │         │                                                         │
│              │         ├─── Need thread-safety? ────► ConcurrentHashMap         │
│              │         │                                                         │
│              │         └─── Just fast lookup? ──────► HashMap                   │
│              │                                                                   │
│              ├─── Unique elements only?                                         │
│              │         │                                                         │
│              │         ├─── Need sorted? ───────────► TreeSet                   │
│              │         │                                                         │
│              │         ├─── Need insertion order? ──► LinkedHashSet             │
│              │         │                                                         │
│              │         └─── Just uniqueness? ───────► HashSet                   │
│              │                                                                   │
│              ├─── Ordered sequence with duplicates?                             │
│              │         │                                                         │
│              │         ├─── Frequent random access? ─► ArrayList                │
│              │         │                                                         │
│              │         ├─── Frequent insert/delete                              │
│              │         │    at both ends? ──────────► LinkedList                │
│              │         │                                                         │
│              │         └─── Thread-safe needed? ────► CopyOnWriteArrayList      │
│              │                                                                   │
│              ├─── LIFO (Stack behavior)?                                        │
│              │         │                                                         │
│              │         └─── Use ArrayDeque as stack                             │
│              │                                                                   │
│              ├─── FIFO (Queue behavior)?                                        │
│              │         │                                                         │
│              │         ├─── Need priority? ─────────► PriorityQueue             │
│              │         │                                                         │
│              │         ├─── Thread coordination? ───► BlockingQueue             │
│              │         │                                                         │
│              │         └─── Simple queue? ──────────► ArrayDeque                │
│              │                                                                   │
│              └─── Double-ended operations?                                      │
│                        │                                                         │
│                        └─── Use ArrayDeque (Deque)                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔬 PART 10C: PERFORMANCE COMPARISON - ALL DATA STRUCTURES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE TIME COMPLEXITY COMPARISON                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────┬────────┬────────┬────────┬────────┬────────┬──────────┐   │
│  │ Data Structure │ Access │ Search │ Insert │ Delete │ Space  │ Notes    │   │
│  ├────────────────┼────────┼────────┼────────┼────────┼────────┼──────────┤   │
│  │ Array          │ O(1)   │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ Fixed sz │   │
│  │ ArrayList      │ O(1)   │ O(n)   │ O(1)*  │ O(n)   │ O(n)   │ Dynamic  │   │
│  │ LinkedList     │ O(n)   │ O(n)   │ O(1)†  │ O(1)†  │ O(n)   │ Pointers │   │
│  │ Stack          │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)   │ LIFO     │   │
│  │ Queue          │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)   │ FIFO     │   │
│  │ HashSet        │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ No order │   │
│  │ TreeSet        │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │   │
│  │ HashMap        │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ No order │   │
│  │ TreeMap        │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │   │
│  │ LinkedHashMap  │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ Ins ordr │   │
│  │ Heap/PQ        │ -      │ O(n)   │O(logn) │O(logn) │ O(n)   │ Priority │   │
│  │ BST (balanced) │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │   │
│  │ BST (unbal)    │ -      │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ Avoid!   │   │
│  │ Trie           │ -      │ O(m)   │ O(m)   │ O(m)   │ O(n×m) │ Strings  │   │
│  │ Graph (Adj L)  │ -      │O(V+E)  │ O(1)   │O(E/V)  │O(V+E)  │ Sparse   │   │
│  │ Graph (Adj M)  │ -      │ O(1)   │ O(1)   │ O(1)   │O(V²)   │ Dense    │   │
│  └────────────────┴────────┴────────┴────────┴────────┴────────┴──────────┘   │
│                                                                                  │
│  * Amortized O(1), worst case O(n) during resize                               │
│  † O(1) if position known, O(n) to find position                               │
│  m = length of string (for Trie)                                                │
│  V = vertices, E = edges (for Graph)                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MEMORY OVERHEAD COMPARISON                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Storing 1,000,000 integers:                                                    │
│                                                                                  │
│  ┌────────────────────┬─────────────┬─────────────────────────────────────┐    │
│  │ Data Structure     │ Memory      │ Overhead Explanation                │    │
│  ├────────────────────┼─────────────┼─────────────────────────────────────┤    │
│  │ int[]              │ ~4 MB       │ 4 bytes × 1M + 16 header            │    │
│  │ Integer[]          │ ~20 MB      │ 16 bytes × 1M + references          │    │
│  │ ArrayList<Integer> │ ~24 MB      │ Integer objects + ArrayList overhead│    │
│  │ LinkedList<Integer>│ ~48 MB      │ Node(24) + Integer(16) per element  │    │
│  │ HashSet<Integer>   │ ~52 MB      │ Entry overhead + Integer objects    │    │
│  │ TreeSet<Integer>   │ ~56 MB      │ TreeNode + Integer objects          │    │
│  └────────────────────┴─────────────┴─────────────────────────────────────┘    │
│                                                                                  │
│  KEY INSIGHT:                                                                    │
│  • Primitive arrays are 5-14x more memory efficient!                           │
│  • Use primitive arrays when possible for large datasets                       │
│  • Consider libraries like Trove or Eclipse Collections for primitive support  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REAL-WORLD BENCHMARK (nanoseconds)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Test: 100,000 elements, JDK 17, Intel i7-10700 @ 3.8GHz                       │
│                                                                                  │
│  ADD OPERATIONS:                                                                 │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐   │
│  │ Collection     │ Time (ns) │ Visualization                              │   │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤   │
│  │ ArrayList.add  │ 8         │ ██                                         │   │
│  │ LinkedList.add │ 15        │ ████                                       │   │
│  │ HashSet.add    │ 25        │ ██████                                     │   │
│  │ TreeSet.add    │ 150       │ █████████████████████████████████████      │   │
│  └────────────────┴───────────┴────────────────────────────────────────────┘   │
│                                                                                  │
│  GET/CONTAINS OPERATIONS:                                                        │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐   │
│  │ Collection     │ Time (ns) │ Visualization                              │   │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤   │
│  │ ArrayList.get  │ 5         │ █                                          │   │
│  │ LinkedList.get │ 25000     │ (off the chart - 5000x slower!)           │   │
│  │ HashSet.contain│ 12        │ ███                                        │   │
│  │ TreeSet.contain│ 80        │ ████████████████████                       │   │
│  └────────────────┴───────────┴────────────────────────────────────────────┘   │
│                                                                                  │
│  ITERATION OVER ALL ELEMENTS:                                                    │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐   │
│  │ Collection     │ Time (ms) │ Notes                                      │   │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤   │
│  │ int[]          │ 0.3       │ Best cache locality                        │   │
│  │ ArrayList      │ 0.8       │ Good cache locality                        │   │
│  │ LinkedList     │ 12.0      │ Poor cache locality (40x slower!)         │   │
│  │ HashSet        │ 3.2       │ Moderate - must traverse buckets          │   │
│  │ TreeSet        │ 2.5       │ In-order traversal                         │   │
│  └────────────────┴───────────┴────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_Continue in Part 2: 02_Collections_Methods_Table.md_
