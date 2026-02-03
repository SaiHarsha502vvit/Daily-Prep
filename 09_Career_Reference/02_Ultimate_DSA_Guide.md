# 🏗️ Ultimate Data Structures & Algorithms Deep Guide

> **Framework**: WHY → HOW → WHAT → WHEN → PRACTICE → REAL-WORLD

---

# 🔬 PART 0: DEEP INTERNALS - CPU AND MEMORY FUNDAMENTALS FOR DSA

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       THE HARDWARE REALITY - WHAT EVERY DSA LEARNER MUST KNOW                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Why this matters: Big-O notation tells you scaling behavior, but               ║
║  HARDWARE determines actual performance. An O(n) algorithm can be               ║
║  faster or slower than O(log n) depending on hardware factors!                  ║
║                                                                                   ║
║  This section covers:                                                            ║
║  • CPU cache hierarchy and its massive impact                                    ║
║  • Memory layout principles                                                      ║
║  • Branch prediction effects                                                     ║
║  • Why some "slow" algorithms are fast in practice                              ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## THE MEMORY HIERARCHY - THE FOUNDATION OF PERFORMANCE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CPU MEMORY HIERARCHY                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LATENCY (approximate cycles to access):                                        │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │    CPU REGISTERS  ←──  1 cycle  (0.3 ns)                                │   │
│  │         32-128 registers, ~1 KB                                         │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L1 CACHE  ←────── 4 cycles  (1 ns)                                  │   │
│  │         32-64 KB per core                                               │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L2 CACHE  ←──────  12 cycles  (3 ns)                                │   │
│  │         256 KB - 1 MB per core                                          │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L3 CACHE  ←──────  40 cycles  (12 ns)                               │   │
│  │         8-64 MB shared                                                  │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    MAIN RAM  ←────── 200+ cycles  (60-100 ns)                          │   │
│  │         8-128 GB                                                        │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    SSD       ←────── 100,000 cycles  (100 μs)                          │   │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    HDD       ←────── 10,000,000 cycles  (10 ms)                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  KEY INSIGHT:                                                                    │
│  L1 to RAM = 50x slower!                                                        │
│  RAM to SSD = 1000x slower!                                                     │
│                                                                                  │
│  An algorithm that stays in L1 cache can be 50x faster than one that           │
│  constantly misses to RAM, even with the same Big-O complexity!                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CACHE-FRIENDLY VS CACHE-UNFRIENDLY ALGORITHMS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    THE CACHE LINE - 64 BYTES OF MAGIC                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When CPU reads ONE byte, it fetches 64 bytes (cache line) from RAM!           │
│                                                                                  │
│  ARRAY ACCESS (cache-friendly):                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  int[] arr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}     ││
│  │                                                                            ││
│  │  Access arr[0]:                                                            ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │  │ Cache loads: arr[0] arr[1] arr[2] ... arr[15] (64 bytes = 16 ints)  │ ││
│  │  └──────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                            ││
│  │  Next 15 accesses arr[1]..arr[15] = CACHE HITS (1 cycle each!)           ││
│  │  Total for 16 elements: 200 + 15 = 215 cycles                            ││
│  │  Average: ~13 cycles per element                                          ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  LINKED LIST ACCESS (cache-unfriendly):                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Nodes scattered in memory:                                                ││
│  │  Node@0x1000 → Node@0x5000 → Node@0x2000 → Node@0x9000 → ...             ││
│  │                                                                            ││
│  │  Access node 1: Cache miss! Load 64 bytes at 0x1000 → 200 cycles         ││
│  │  Access node 2: Cache miss! Load 64 bytes at 0x5000 → 200 cycles         ││
│  │  Access node 3: Cache miss! Load 64 bytes at 0x2000 → 200 cycles         ││
│  │  ...                                                                       ││
│  │                                                                            ││
│  │  Total for 16 elements: 16 × 200 = 3200 cycles                           ││
│  │  Average: 200 cycles per element                                          ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  COMPARISON:                                                                    │
│  Array iteration:  ~13 cycles/element   →  15x FASTER!                         │
│  List iteration:   200 cycles/element                                           │
│                                                                                  │
│  This is why array-based structures often outperform pointer-based ones,       │
│  even when Big-O suggests otherwise!                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## BRANCH PREDICTION AND ITS IMPACT

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BRANCH PREDICTION - THE HIDDEN FACTOR                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CPUs predict which branch will be taken before condition is evaluated!        │
│  If wrong, pipeline flush costs 15-20 cycles.                                  │
│                                                                                  │
│                                                                                  │
│  EXAMPLE: Binary Search vs Linear Search on sorted array                       │
│  ─────────────────────────────────────────────────────────                     │
│                                                                                  │
│  Binary Search (random jumps):                                                  │
│  - Each comparison: ~50% chance of left, 50% right                            │
│  - Branch predictor accuracy: ~50%                                             │
│  - Misprediction penalty: ~20 cycles per compare                              │
│  - Effective cost: O(log n) × (compare + 10 cycles penalty)                   │
│                                                                                  │
│  Linear Search (sequential):                                                    │
│  - Usually continues (not found), branch highly predictable                    │
│  - Branch predictor accuracy: ~99%                                             │
│  - Misprediction penalty: only on final "found" branch                        │
│  - Plus: prefetching pulls next elements into cache                           │
│                                                                                  │
│                                                                                  │
│  BENCHMARK (search in sorted array of 64 elements):                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Algorithm      │ Big-O    │ Actual Time │ Notes                           ││
│  ├────────────────┼──────────┼─────────────┼─────────────────────────────────┤│
│  │ Binary Search  │ O(log n) │ 45 ns       │ 6 comparisons, unpredictable   ││
│  │ Linear Search  │ O(n)     │ 35 ns       │ 32 avg comparisons, predicted! ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  For small n (< 100), linear search can be FASTER than binary search!         │
│  The crossover point depends on CPU and cache characteristics.                 │
│                                                                                  │
│                                                                                  │
│  BRANCH-FREE CODE:                                                              │
│  ─────────────────                                                              │
```java
// BRANCHY (branch misprediction possible)
int max = (a > b) ? a : b;

// BRANCH-FREE (uses conditional move instruction)
int max = b + ((a - b) & -(a > b ? 1 : 0));

// Even better: let compiler optimize
int max = Math.max(a, b);  // Modern JIT uses cmov instruction
````

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## JAVA MEMORY MODEL FOR DATA STRUCTURES

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ JAVA OBJECT MEMORY LAYOUT │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ OBJECT HEADER (12-16 bytes on 64-bit JVM): │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Mark Word (8 bytes) │ Class Pointer (4-8 bytes) │ [Array Length (4)] │ │
│ │ - Hash code │ - Points to class │ - Only for arrays │ │
│ │ - GC age │ metadata │ │ │
│ │ - Lock state │ │ │ │
│ │ - Biased lock info │ │ │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ PRIMITIVE ARRAY: int[] arr = new int[10] │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Header (16 bytes) + Length (4 bytes) │ int × 10 (40 bytes) │ │
│ │ Total: 16 + 4 + 40 = 60 bytes (padded to 64 bytes for alignment) │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ ARRAYLIST<Integer> with 10 elements: │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ArrayList Object: │ │
│ │ ├── Header (16 bytes) │ │
│ │ ├── Object[] elementData (8 byte reference) │ │
│ │ ├── int size (4 bytes) │ │
│ │ └── padding (4 bytes) │ │
│ │ = 32 bytes │ │
│ │ │ │
│ │ Object[]: │ │
│ │ ├── Header (16 bytes) │ │
│ │ └── 10 × 8 byte references = 80 bytes │ │
│ │ = 96 bytes │ │
│ │ │ │
│ │ 10 × Integer objects: │ │
│ │ ├── Each Integer: 16 byte header + 4 byte int = 20 → 24 bytes (aligned) │ │
│ │ └── 10 × 24 = 240 bytes │ │
│ │ │ │
│ │ TOTAL: 32 + 96 + 240 = 368 bytes │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ COMPARISON: │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Structure │ Memory for 10 ints │ Memory per element ││
│ ├────────────────────────┼────────────────────┼─────────────────────────────┤│
│ │ int[] (primitive) │ 64 bytes (padded) │ 4 bytes (+ 2.4 overhead) ││
│ │ ArrayList<Integer> │ 368 bytes │ 24 bytes (6x more!) ││
│ │ LinkedList<Integer> │ 480+ bytes │ 48 bytes (12x more!) ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ LESSON: Use primitive arrays when possible! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## OPERATION COST REFERENCE TABLE

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ CPU OPERATION COSTS (APPROXIMATE) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ARITHMETIC OPERATIONS (ALU): │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Operation │ Cycles │ Notes │ │
│ ├─────────────────────┼────────┼──────────────────────────────────────────┤ │
│ │ Integer add/sub │ 1 │ Can do 4+ per cycle (superscalar) │ │
│ │ Integer multiply │ 3-4 │ Pipelined │ │
│ │ Integer divide │ 20-80 │ Very slow! Use shifts for powers of 2 │ │
│ │ Bit operations │ 1 │ AND, OR, XOR, shift │ │
│ │ Comparison │ 1 │ But may cause branch misprediction │ │
│ │ Float add/sub │ 3-4 │ │ │
│ │ Float multiply │ 4-5 │ │ │
│ │ Float divide │ 15-25 │ Much slower than multiply │ │
│ │ Square root │ 15-30 │ │ │
│ │ Integer % (modulo) │ 20-80 │ Same as divide │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ MEMORY OPERATIONS: │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Operation │ Cycles │ Notes │ │
│ ├───────────────────────┼──────────┼──────────────────────────────────────┤ │
│ │ L1 cache hit │ 4 │ Best case for memory access │ │
│ │ L2 cache hit │ 12 │ │ │
│ │ L3 cache hit │ 40 │ │ │
│ │ RAM access │ 200+ │ Highly variable │ │
│ │ TLB miss (page walk) │ 50-1000 │ Large working set problem │ │
│ │ Page fault (to disk) │ millions │ Avoid at all costs in hot paths │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ FUNCTION CALL OVERHEAD: │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Operation │ Cycles │ Notes │ │
│ ├────────────────────────┼─────────┼──────────────────────────────────────┤ │
│ │ Static method call │ 5-10 │ Direct jump │ │
│ │ Instance method call │ 10-15 │ Vtable lookup │ │
│ │ Interface method call │ 15-25 │ Itable lookup │ │
│ │ JIT-inlined method │ 0 │ No overhead if inlined! │ │
│ │ Reflection call │ 100+ │ Avoid in hot paths │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ JAVA-SPECIFIC OPERATIONS: │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Operation │ Cycles │ Notes │ │
│ ├───────────────────────┼──────────┼──────────────────────────────────────┤ │
│ │ Object allocation │ 10-20 │ Bump pointer if in TLAB │ │
│ │ Array allocation │ 20-100 │ Depends on size, may zero-fill │ │
│ │ new String() │ 50-100 │ Object + char array │ │
│ │ HashMap.get() │ 30-100 │ Hash + possible collision │ │
│ │ ArrayList.add() │ 5-500 │ 5 if space, 500 if resize needed │ │
│ │ Autoboxing (int→Int) │ 10-50 │ May allocate new object │ │
│ │ String concatenation │ 50-1000 │ Creates intermediate objects │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## BIG-O IN PRACTICE - THE REALITY CHECK

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ WHEN BIG-O DOESN'T TELL THE FULL STORY │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ CASE 1: O(n) can beat O(log n) for small n │
│ ─────────────────────────────────────────── │
│ │
│ Binary search: O(log n) with high constant (branch misprediction) │
│ Linear search: O(n) with low constant (sequential, predicted) │
│ │
│ Crossover: Around n = 100-500 elements │
│ For n < 100: Linear search often faster! │
│ │
│ │
│ CASE 2: O(n) can beat O(1) amortized │
│ ───────────────────────────────────────── │
│ │
│ ArrayList.add(): O(1) amortized, but occasional O(n) resize │
│ LinkedList.addFirst(): O(1) always, but cache-unfriendly │
│ │
│ For many small adds: ArrayList wins (spatial locality) │
│ For rare adds at head: LinkedList might win │
│ │
│ │
│ CASE 3: Same Big-O, vastly different performance │
│ ───────────────────────────────────────────────── │
│ │
│ Both O(n) - iterating 1M elements: │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Structure │ Time (ms) │ Reason ││
│ ├─────────────────────┼───────────┼─────────────────────────────────────────┤│
│ │ int[] │ 0.5 │ Sequential memory, cache-friendly ││
│ │ ArrayList<Integer> │ 3.0 │ Object indirection ││
│ │ LinkedList<Integer> │ 25.0 │ Random memory access, cache misses ││
│ │ HashSet<Integer> │ 35.0 │ Hash computation + random access ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ Same O(n), but 70x difference between fastest and slowest! │
│ │
│ │
│ PRACTICAL RULES: │
│ ──────────────── │
│ 1. For n < 100: Simple O(n) often beats clever O(log n) │
│ 2. Prefer contiguous memory (arrays) for iteration │
│ 3. Minimize object allocations in hot paths │
│ 4. Use primitive arrays over Collections when possible │
│ 5. Profile before optimizing - intuition is often wrong! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

---

## 📋 Master Index

1. [Learning Framework](#the-why-how-what-framework)
2. [Arrays - All Variants](#arrays---complete-guide)
3. [Linked Lists - All Variants](#linked-lists---complete-guide)
4. [Stacks - All Variants](#stacks---complete-guide)
5. [Queues - All Variants](#queues---complete-guide)
6. [Hash Tables - All Variants](#hash-tables---complete-guide)
7. [Trees - All Variants](#trees---complete-guide)
8. [Heaps - All Variants](#heaps---complete-guide)
9. [Graphs - All Variants](#graphs---complete-guide)
10. [Advanced Data Structures](#advanced-data-structures)
11. [Specialized Data Structures](#specialized-data-structures)
12. [Real-World Usage in Modern Systems](#real-world-usage-in-modern-systems)

---

## The WHY-HOW-WHAT Framework

### For Every Data Structure, Ask:

```

┌─────────────────────────────────────────────────────────────┐
│ LEARNING FRAMEWORK │
├─────────────────────────────────────────────────────────────┤
│ │
│ WHY does this exist? │
│ └── What problem does it solve? │
│ └── What limitations of other structures does it address? │
│ │
│ HOW does it work internally? │
│ └── Memory layout │
│ └── Operations implementation │
│ └── Time/Space complexity derivation │
│ │
│ WHAT are the operations? │
│ └── Core operations (CRUD) │
│ └── Special operations │
│ └── Edge cases │
│ │
│ WHEN to use it? │
│ └── Use cases and patterns │
│ └── Trade-offs with alternatives │
│ └── Anti-patterns (when NOT to use) │
│ │
│ WHERE is it used in real systems? │
│ └── Production systems │
│ └── Modern tech stack applications │
│ │
└─────────────────────────────────────────────────────────────┘

```

---

## Arrays - Complete Guide

### WHY Arrays Exist

```

Problem: Store multiple related values efficiently

Before Arrays:
int item1 = 10;
int item2 = 20;
int item3 = 30;
// 1000 variables? Nightmare!

With Arrays:
int[] items = new int[1000]; // One declaration, 1000 values

Key Insight:
Arrays solve the problem of managing COLLECTIONS of same-type data
with O(1) random access using index-based addressing.

```

### HOW Arrays Work (Memory Model)

```

Memory Layout (Contiguous Allocation):

Address: 1000 1004 1008 1012 1016
┌───────┬───────┬───────┬───────┬───────┐
int[] arr = │ 10 │ 20 │ 30 │ 40 │ 50 │
└───────┴───────┴───────┴───────┴───────┘
Index: [0] [1] [2] [3] [4]

Address Calculation:
address(arr[i]) = base_address + (i × element_size)
address(arr[3]) = 1000 + (3 × 4) = 1012

Why O(1) Access?
→ Direct arithmetic calculation, no traversal needed
→ CPU can fetch any element in constant time

````

### Array Variants

#### 1. Static Array (Fixed Size)

```java
// Declaration
int[] arr = new int[5];           // Fixed at compile/runtime
int[] arr2 = {1, 2, 3, 4, 5};     // Initialized with values

// Characteristics
- Size fixed at creation
- Memory allocated once
- Cannot grow/shrink
- Fastest access O(1)

// Use When:
- Size is known beforehand
- Performance is critical
- Memory efficiency matters
````

#### 2. Dynamic Array (ArrayList, Vector)

```java
// Declaration
ArrayList<Integer> list = new ArrayList<>();
list.add(10);  // Grows automatically

// Internal Working:
┌─────────────────────────────────────────────────────────────┐
│ Initial: capacity=10, size=0                                │
│                                                              │
│ After 10 adds: capacity=10, size=10                         │
│                                                              │
│ On 11th add:                                                 │
│ 1. Create new array with capacity = 10 × 1.5 = 15           │
│ 2. Copy all 10 elements to new array                        │
│ 3. Add 11th element                                          │
│ 4. Discard old array                                         │
│                                                              │
│ Amortized O(1) for add operation                            │
└─────────────────────────────────────────────────────────────┘

// Complexity
Add (end):     O(1) amortized, O(n) worst case (resize)
Add (middle):  O(n) - shift elements
Remove:        O(n) - shift elements
Access:        O(1)
Search:        O(n)
```

#### 3. Multi-Dimensional Arrays

```java
// 2D Array (Matrix)
int[][] matrix = new int[3][4];  // 3 rows, 4 columns

Memory Layout (Row-Major Order):
┌─────────────────────────────────────┐
│ Row 0: [0][0] [0][1] [0][2] [0][3] │
│ Row 1: [1][0] [1][1] [1][2] [1][3] │
│ Row 2: [2][0] [2][1] [2][2] [2][3] │
└─────────────────────────────────────┘

In Memory: [0][0], [0][1], [0][2], [0][3], [1][0], [1][1]...

Address Calculation:
address[i][j] = base + (i × cols + j) × element_size

// 3D Array
int[][][] cube = new int[2][3][4];

// Jagged Array (Different row lengths)
int[][] jagged = new int[3][];
jagged[0] = new int[2];  // Row 0 has 2 elements
jagged[1] = new int[5];  // Row 1 has 5 elements
jagged[2] = new int[3];  // Row 2 has 3 elements
```

#### 4. Circular Array (Ring Buffer)

```java
// Concept: Array that wraps around
// Used in: Queues, Buffers, Producer-Consumer patterns

class CircularBuffer<T> {
    private T[] buffer;
    private int head = 0;  // Read position
    private int tail = 0;  // Write position
    private int size = 0;

    public void add(T item) {
        buffer[tail] = item;
        tail = (tail + 1) % buffer.length;  // Wrap around
        size++;
    }

    public T remove() {
        T item = buffer[head];
        head = (head + 1) % buffer.length;  // Wrap around
        size--;
        return item;
    }
}

Visual:
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 5 │ 6 │   │   │   │ 1 │ 2 │ 3 │
└───┴───┴───┴───┴───┴───┴───┴───┘
      ↑               ↑
     tail           head

After head=7, next read: head = (7+1) % 8 = 0
```

#### 5. Sparse Array

```java
// Problem: Array with mostly empty/default values
// Example: 1 million elements, only 100 have values

// Naive Approach (Wastes Memory):
int[] arr = new int[1000000];  // 4MB wasted!

// Sparse Array Solution:
// Store only non-default values with their indices

class SparseArray<T> {
    private Map<Integer, T> data = new HashMap<>();
    private T defaultValue;

    public void set(int index, T value) {
        if (value.equals(defaultValue)) {
            data.remove(index);
        } else {
            data.put(index, value);
        }
    }

    public T get(int index) {
        return data.getOrDefault(index, defaultValue);
    }
}

// Trade-off:
// Memory: O(k) where k = non-default elements
// Access: O(1) average (HashMap), but slower than array
```

### Array Time Complexity Summary

| Operation    | Static Array | Dynamic Array | Sorted Array |
| ------------ | ------------ | ------------- | ------------ |
| Access       | O(1)         | O(1)          | O(1)         |
| Search       | O(n)         | O(n)          | O(log n)     |
| Insert (end) | N/A          | O(1)\*        | O(n)         |
| Insert (pos) | N/A          | O(n)          | O(n)         |
| Delete       | N/A          | O(n)          | O(n)         |

\*Amortized

### Array Patterns for Problem Solving

```
1. TWO POINTERS
   └── Start/End pointers moving toward middle
   └── Fast/Slow pointers
   └── Use: Sorted arrays, palindrome, pair sum

2. SLIDING WINDOW
   └── Fixed or variable window
   └── Use: Subarrays, continuous sequences

3. PREFIX SUM
   └── Precompute cumulative sums
   └── Use: Range sum queries O(1)

4. BINARY SEARCH
   └── Search space reduction
   └── Use: Sorted arrays, optimization problems

5. KADANE'S ALGORITHM
   └── Maximum subarray tracking
   └── Use: Max sum subarray and variants
```

### LeetCode Problems - Arrays

| #   | Problem                         | Difficulty | Pattern         | Link                                                           |
| --- | ------------------------------- | ---------- | --------------- | -------------------------------------------------------------- |
| 1   | Two Sum                         | Easy       | Hash Map        | https://leetcode.com/problems/two-sum/                         |
| 121 | Best Time to Buy and Sell Stock | Easy       | One Pass        | https://leetcode.com/problems/best-time-to-buy-and-sell-stock/ |
| 53  | Maximum Subarray                | Medium     | Kadane's        | https://leetcode.com/problems/maximum-subarray/                |
| 238 | Product of Array Except Self    | Medium     | Prefix/Suffix   | https://leetcode.com/problems/product-of-array-except-self/    |
| 15  | 3Sum                            | Medium     | Two Pointers    | https://leetcode.com/problems/3sum/                            |
| 11  | Container With Most Water       | Medium     | Two Pointers    | https://leetcode.com/problems/container-with-most-water/       |
| 42  | Trapping Rain Water             | Hard       | Two Pointers/DP | https://leetcode.com/problems/trapping-rain-water/             |

### Real-World Array Usage

```
1. DATABASE SYSTEMS
   └── Buffer Pool: Fixed array of page frames
   └── Query Results: Dynamic arrays for result sets

2. OPERATING SYSTEMS
   └── Process Table: Array of PCB pointers
   └── Page Tables: Arrays mapping virtual to physical

3. GRAPHICS/GAMING
   └── Pixel Buffers: 2D arrays for frame data
   └── Vertex Arrays: Mesh geometry storage

4. NETWORKING
   └── Packet Buffers: Ring buffers for network I/O
   └── Routing Tables: Arrays with hash indexing

5. MACHINE LEARNING
   └── Tensors: Multi-dimensional arrays
   └── Feature Vectors: 1D arrays per data point

6. FINANCIAL SYSTEMS
   └── Time Series Data: Arrays of price points
   └── Order Books: Arrays sorted by price
```

---

## Linked Lists - Complete Guide

### WHY Linked Lists Exist

```
Problem: Arrays have limitations
├── Fixed size (static arrays)
├── Expensive insertions O(n)
├── Memory must be contiguous
└── Resizing copies entire array

Linked Lists Solve:
├── Dynamic size (grow/shrink easily)
├── O(1) insertions (if you have the node)
├── Non-contiguous memory (flexible allocation)
└── No resizing overhead

Trade-off:
├── No random access (O(n) to reach element)
├── Extra memory per element (pointer storage)
└── Poor cache locality
```

### HOW Linked Lists Work

```
Memory Model (Non-Contiguous):

Address:   1000        2048        1524        3000
           ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
           │ Data: 10│ │ Data: 20│ │ Data: 30│ │ Data: 40│
           │Next:2048│ │Next:1524│ │Next:3000│ │Next:null│
           └─────────┘ └─────────┘ └─────────┘ └─────────┘

Head ────────►

Key Insight:
Each node knows ONLY where the next node is.
No formula to calculate position - must traverse.
```

### Linked List Variants

#### 1. Singly Linked List

```java
class Node {
    int data;
    Node next;
}

Operations:
┌────────────────────────────────────────────────────────────┐
│ Insert at Head: O(1)                                       │
│ ┌───┐    ┌───┐    ┌───┐                                   │
│ │NEW│───►│ A │───►│ B │                                   │
│ └───┘    └───┘    └───┘                                   │
│   ↑                                                        │
│  head                                                      │
│                                                            │
│ Insert at Tail: O(n) without tail pointer, O(1) with     │
│ Delete: O(n) to find, O(1) to unlink                      │
│ Search: O(n)                                               │
└────────────────────────────────────────────────────────────┘

// Implementation
class SinglyLinkedList {
    Node head;

    void insertAtHead(int data) {
        Node newNode = new Node(data);
        newNode.next = head;
        head = newNode;
    }

    void insertAtTail(int data) {
        Node newNode = new Node(data);
        if (head == null) {
            head = newNode;
            return;
        }
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
    }
}
```

#### 2. Doubly Linked List

```java
class DoublyNode {
    int data;
    DoublyNode prev;
    DoublyNode next;
}

Visual:
      null◄───┌───┐◄──►┌───┐◄──►┌───┐◄──►┌───┐───►null
              │ A │    │ B │    │ C │    │ D │
              └───┘◄──►└───┘◄──►└───┘◄──►└───┘
                ↑                           ↑
               head                        tail

Advantages over Singly:
├── Traverse both directions
├── Delete node in O(1) if you have the node
├── Insert before a node in O(1)
└── Useful for: LRU Cache, Browser History

Disadvantage:
└── Extra memory (2 pointers per node)

// Implementation
class DoublyLinkedList {
    DoublyNode head, tail;

    void insertAtHead(int data) {
        DoublyNode newNode = new DoublyNode(data);
        if (head == null) {
            head = tail = newNode;
            return;
        }
        newNode.next = head;
        head.prev = newNode;
        head = newNode;
    }

    void deleteNode(DoublyNode node) {
        if (node.prev != null) node.prev.next = node.next;
        else head = node.next;

        if (node.next != null) node.next.prev = node.prev;
        else tail = node.prev;
    }
}
```

#### 3. Circular Linked List

```java
// Singly Circular
┌───┐    ┌───┐    ┌───┐    ┌───┐
│ A │───►│ B │───►│ C │───►│ D │───┐
└───┘    └───┘    └───┘    └───┘   │
  ↑                                 │
  └─────────────────────────────────┘

// Doubly Circular
     ┌─────────────────────────────────────────┐
     │                                         │
     ▼                                         │
   ┌───┐◄──►┌───┐◄──►┌───┐◄──►┌───┐           │
   │ A │    │ B │    │ C │    │ D │───────────┘
   └───┘◄──►└───┘◄──►└───┘◄──►└───┘
     │                         ▲
     └─────────────────────────┘

Use Cases:
├── Round-robin scheduling
├── Circular buffers
├── Multiplayer game turns
├── Music playlist loop
└── Token ring networks
```

#### 4. Skip List (Advanced)

```java
// Probabilistic data structure - O(log n) search in linked list!

Level 3:  HEAD ─────────────────────► 50 ──────────────────► NIL
             │                         │
Level 2:  HEAD ────► 10 ─────────────► 50 ────────► 80 ───► NIL
             │        │                 │            │
Level 1:  HEAD ────► 10 ───► 30 ──────► 50 ──► 70 ► 80 ───► NIL
             │        │       │         │      │    │
Level 0:  HEAD ──► 5 ► 10 ► 20 ► 30 ► 40 ► 50 ► 60 ► 70 ► 80 ► NIL

How It Works:
1. Multiple layers of linked lists
2. Higher levels skip more nodes
3. Search starts from top-left
4. Move right if target > current
5. Move down if target < next

Complexity:
├── Search: O(log n) average
├── Insert: O(log n) average
├── Delete: O(log n) average
└── Space: O(n) average

Used In:
├── Redis sorted sets (ZSET)
├── LevelDB / RocksDB
├── Lucene (search engine)
└── Concurrent data structures
```

#### 5. XOR Linked List (Memory Efficient)

```java
// Stores XOR of prev and next instead of both pointers
// Memory: 1 pointer per node instead of 2

Node Structure:
┌────────────────────┐
│ Data               │
│ XOR(prev, next)    │  // Single pointer field!
└────────────────────┘

Traversal:
If at node B, and came from A:
next_address = XOR_field ^ address_of_A

Memory Savings:
Regular DLL: 2 pointers × 8 bytes = 16 bytes per node
XOR List:    1 pointer × 8 bytes = 8 bytes per node

Limitation:
├── Can't traverse from arbitrary node
├── Must know previous node to move forward
├── Not supported in managed languages (Java, Python)
└── Used in embedded systems with tight memory
```

#### 6. Unrolled Linked List

```java
// Store multiple elements per node
// Better cache locality than regular linked list

┌─────────────────────┐    ┌─────────────────────┐
│ [10, 20, 30, 40]    │───►│ [50, 60, 70, 80]    │───► ...
│ count: 4            │    │ count: 4            │
└─────────────────────┘    └─────────────────────┘

Advantages:
├── Better cache performance
├── Fewer allocations
├── Less pointer overhead
└── O(√n) indexing possible

class UnrolledNode {
    int[] elements;
    int count;
    UnrolledNode next;
}
```

### Linked List Time Complexity

| Operation           | Singly      | Doubly | Skip List     |
| ------------------- | ----------- | ------ | ------------- |
| Access by index     | O(n)        | O(n)   | O(log n)      |
| Search              | O(n)        | O(n)   | O(log n)      |
| Insert at head      | O(1)        | O(1)   | O(log n)      |
| Insert at tail      | O(n)/O(1)\* | O(1)   | O(log n)      |
| Delete (given node) | O(n)\*\*    | O(1)   | O(log n)      |
| Space per node      | 1 ptr       | 2 ptr  | ~1.33 ptr avg |

\*With tail pointer
\*\*Need previous node

### Linked List Patterns

```
1. FAST-SLOW POINTERS (Floyd's Algorithm)
   └── Cycle detection
   └── Find middle element
   └── Find nth from end

2. DUMMY HEAD
   └── Simplify edge cases
   └── Uniform handling of operations

3. REVERSAL
   └── Reverse entire/part of list
   └── k-group reversal

4. MERGE
   └── Merge sorted lists
   └── Merge k lists

5. INTERSECTION/UNION
   └── Find common node
   └── Combine lists
```

### LeetCode Problems - Linked Lists

| #   | Problem                  | Difficulty | Pattern             | Link                                                            |
| --- | ------------------------ | ---------- | ------------------- | --------------------------------------------------------------- |
| 206 | Reverse Linked List      | Easy       | Reversal            | https://leetcode.com/problems/reverse-linked-list/              |
| 21  | Merge Two Sorted Lists   | Easy       | Merge               | https://leetcode.com/problems/merge-two-sorted-lists/           |
| 141 | Linked List Cycle        | Easy       | Fast-Slow           | https://leetcode.com/problems/linked-list-cycle/                |
| 19  | Remove Nth Node From End | Medium     | Two Pointers        | https://leetcode.com/problems/remove-nth-node-from-end-of-list/ |
| 142 | Linked List Cycle II     | Medium     | Fast-Slow           | https://leetcode.com/problems/linked-list-cycle-ii/             |
| 146 | LRU Cache                | Medium     | Doubly LL + HashMap | https://leetcode.com/problems/lru-cache/                        |
| 23  | Merge k Sorted Lists     | Hard       | Divide & Conquer    | https://leetcode.com/problems/merge-k-sorted-lists/             |

### Real-World Linked List Usage

```
1. OPERATING SYSTEMS
   └── Process scheduling queues
   └── Memory allocation (free list)
   └── File system (FAT - File Allocation Table)

2. BROWSERS
   └── Back/Forward navigation (Doubly LL)
   └── Tab management

3. MUSIC PLAYERS
   └── Playlist (next/previous)
   └── Shuffle queue

4. DATABASES
   └── Buffer pool management
   └── Transaction log chains
   └── Skip lists for indexing (Redis ZSET)

5. CACHING SYSTEMS
   └── LRU Cache (Doubly LL + HashMap)
   └── MRU Cache variants

6. UNDO/REDO SYSTEMS
   └── Command pattern implementation
   └── Version control (Git commits)
```

---

## Stacks - Complete Guide

### WHY Stacks Exist

```
Problem: Need to access data in reverse order of arrival
         (Last In, First Out - LIFO)

Real-World Analogy:
├── Stack of plates (take from top)
├── Undo in text editor (last action first)
├── Browser back button (last page first)
└── Function calls (last called, first returned)

Key Insight:
Stacks provide controlled access - only top element accessible
This RESTRICTION is the FEATURE, not a limitation.
```

### HOW Stacks Work

```
Operations:
          ┌───────────┐
  push()  │     5     │  ◄── top
          ├───────────┤
   pop()  │     3     │
          ├───────────┤
  peek()  │     1     │
          └───────────┘

PUSH: Add element to top
POP:  Remove element from top
PEEK: View top element without removing

All operations: O(1)
```

### Stack Implementations

#### 1. Array-Based Stack

```java
class ArrayStack<T> {
    private T[] array;
    private int top = -1;

    public void push(T item) {
        if (top == array.length - 1) {
            // Resize or throw overflow
        }
        array[++top] = item;
    }

    public T pop() {
        if (top == -1) throw new EmptyStackException();
        return array[top--];
    }

    public T peek() {
        if (top == -1) throw new EmptyStackException();
        return array[top];
    }
}

Pros:
├── Better cache locality
├── Less memory overhead (no pointers)
└── Faster operations

Cons:
├── Fixed size (or resize overhead)
└── Wasted space if not full
```

#### 2. Linked List-Based Stack

```java
class LinkedStack<T> {
    private Node<T> top;

    public void push(T item) {
        Node<T> newNode = new Node<>(item);
        newNode.next = top;
        top = newNode;
    }

    public T pop() {
        if (top == null) throw new EmptyStackException();
        T item = top.data;
        top = top.next;
        return item;
    }
}

Pros:
├── Dynamic size
├── No wasted space
└── No resize overhead

Cons:
├── Extra memory per element (pointer)
├── Poor cache locality
└── Allocation overhead
```

#### 3. Min/Max Stack

```java
// Stack that tracks minimum element in O(1)

class MinStack {
    private Stack<Integer> stack = new Stack<>();
    private Stack<Integer> minStack = new Stack<>();

    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        }
    }

    public void pop() {
        if (stack.pop().equals(minStack.peek())) {
            minStack.pop();
        }
    }

    public int getMin() {
        return minStack.peek();
    }
}

// Space-Optimized Version (Single Stack)
class MinStackOptimized {
    private Stack<Long> stack = new Stack<>();
    private long min;

    public void push(int val) {
        if (stack.isEmpty()) {
            stack.push(0L);
            min = val;
        } else {
            stack.push(val - min);  // Store difference
            if (val < min) min = val;
        }
    }

    public void pop() {
        long top = stack.pop();
        if (top < 0) min = min - top;  // Restore previous min
    }

    public int getMin() {
        return (int) min;
    }
}
```

#### 4. Two Stacks in One Array

```java
// Efficient use of array space for two stacks

class TwoStacks {
    private int[] arr;
    private int top1 = -1;
    private int top2;

    public TwoStacks(int n) {
        arr = new int[n];
        top2 = n;
    }

    void push1(int x) {
        if (top1 < top2 - 1) arr[++top1] = x;
    }

    void push2(int x) {
        if (top1 < top2 - 1) arr[--top2] = x;
    }

    int pop1() { return (top1 >= 0) ? arr[top1--] : -1; }
    int pop2() { return (top2 < arr.length) ? arr[top2++] : -1; }
}

Visual:
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │   │   │   │   │ 9 │ 8 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
          ↑                   ↑
        top1                top2

Stack 1 grows →
Stack 2 grows ←
```

#### 5. Stack with Middle Operation

```java
// Stack supporting O(1) middle element access

class StackWithMiddle {
    private Deque<Integer> firstHalf = new LinkedList<>();
    private Deque<Integer> secondHalf = new LinkedList<>();

    public void push(int val) {
        firstHalf.addLast(val);
        rebalance();
    }

    public int pop() {
        int val = firstHalf.removeLast();
        rebalance();
        return val;
    }

    public int getMiddle() {
        return secondHalf.peekFirst();
    }

    public int deleteMiddle() {
        int mid = secondHalf.removeFirst();
        rebalance();
        return mid;
    }

    private void rebalance() {
        while (firstHalf.size() > secondHalf.size() + 1) {
            secondHalf.addFirst(firstHalf.removeLast());
        }
        while (secondHalf.size() > firstHalf.size()) {
            firstHalf.addLast(secondHalf.removeFirst());
        }
    }
}
```

### Stack Patterns

```
1. PARENTHESES MATCHING
   └── Valid parentheses
   └── Balanced brackets

2. MONOTONIC STACK
   └── Next greater/smaller element
   └── Largest rectangle in histogram

3. EXPRESSION EVALUATION
   └── Infix to postfix
   └── Calculate postfix/prefix

4. RECURSION SIMULATION
   └── Convert recursion to iteration
   └── DFS without recursion

5. UNDO/REDO
   └── Two stacks pattern
   └── Command history
```

### LeetCode Problems - Stacks

| #   | Problem                          | Difficulty | Pattern         | Link                                                            |
| --- | -------------------------------- | ---------- | --------------- | --------------------------------------------------------------- |
| 20  | Valid Parentheses                | Easy       | Matching        | https://leetcode.com/problems/valid-parentheses/                |
| 155 | Min Stack                        | Medium     | Auxiliary Stack | https://leetcode.com/problems/min-stack/                        |
| 150 | Evaluate Reverse Polish Notation | Medium     | Expression Eval | https://leetcode.com/problems/evaluate-reverse-polish-notation/ |
| 739 | Daily Temperatures               | Medium     | Monotonic Stack | https://leetcode.com/problems/daily-temperatures/               |
| 84  | Largest Rectangle in Histogram   | Hard       | Monotonic Stack | https://leetcode.com/problems/largest-rectangle-in-histogram/   |
| 224 | Basic Calculator                 | Hard       | Expression Eval | https://leetcode.com/problems/basic-calculator/                 |
| 316 | Remove Duplicate Letters         | Hard       | Monotonic Stack | https://leetcode.com/problems/remove-duplicate-letters/         |

### Real-World Stack Usage

```
1. COMPILERS & INTERPRETERS
   └── Syntax parsing
   └── Expression evaluation
   └── Symbol table management

2. RUNTIME SYSTEMS
   └── Call stack (function calls)
   └── Stack frame management
   └── Exception handling

3. BACKTRACKING ALGORITHMS
   └── Maze solving
   └── Puzzle solvers (Sudoku)
   └── Path finding

4. TEXT EDITORS
   └── Undo/Redo operations
   └── Bracket matching
   └── Auto-complete suggestions

5. WEB BROWSERS
   └── Navigation history
   └── JavaScript event loop
   └── DOM parsing

6. MEMORY MANAGEMENT
   └── Stack allocation
   └── Activation records
   └── Local variable storage
```

---

## Queues - Complete Guide

### WHY Queues Exist

```
Problem: Process items in the order they arrive
         (First In, First Out - FIFO)

Real-World Analogy:
├── Line at a ticket counter
├── Print job queue
├── Message queue
└── Task scheduling

Key Insight:
Queues ensure FAIRNESS - first request gets served first.
Essential for ordering and buffering in systems.
```

### Queue Variants

#### 1. Simple Queue (Linear Queue)

```java
class ArrayQueue<T> {
    private T[] array;
    private int front = 0;
    private int rear = -1;
    private int size = 0;

    public void enqueue(T item) {
        if (size == array.length) throw new QueueFullException();
        rear = (rear + 1) % array.length;
        array[rear] = item;
        size++;
    }

    public T dequeue() {
        if (size == 0) throw new QueueEmptyException();
        T item = array[front];
        front = (front + 1) % array.length;
        size--;
        return item;
    }
}

Visual:
ENQUEUE                                    DEQUEUE
   ↓                                          ↓
┌───┬───┬───┬───┬───┐                ┌───┬───┬───┬───┬───┐
│ A │ B │ C │   │   │    ───────►    │   │ B │ C │   │   │
└───┴───┴───┴───┴───┘                └───┴───┴───┴───┴───┘
  ↑                                        ↑
front                                    front
```

#### 2. Circular Queue (Ring Buffer)

```java
// Solves the "phantom space" problem of linear queue

class CircularQueue<T> {
    private T[] buffer;
    private int front = 0;
    private int rear = 0;
    private int size = 0;

    public void enqueue(T item) {
        if (size == buffer.length) throw new QueueFullException();
        buffer[rear] = item;
        rear = (rear + 1) % buffer.length;  // Wrap around
        size++;
    }

    public T dequeue() {
        if (size == 0) throw new QueueEmptyException();
        T item = buffer[front];
        front = (front + 1) % buffer.length;  // Wrap around
        size--;
        return item;
    }
}

Visual:
     ┌───┬───┬───┬───┬───┬───┬───┬───┐
     │ E │ F │   │   │   │ A │ B │ C │
     └───┴───┴───┴───┴───┴───┴───┴───┘
           ↑               ↑
          rear           front

Use Cases:
├── OS process scheduling
├── Network packet buffers
├── Audio/Video streaming
├── Producer-Consumer patterns
└── Keyboard input buffer
```

#### 3. Double-Ended Queue (Deque)

```java
// Insert/Delete from both ends

interface Deque<T> {
    void addFirst(T item);   // O(1)
    void addLast(T item);    // O(1)
    T removeFirst();         // O(1)
    T removeLast();          // O(1)
    T peekFirst();           // O(1)
    T peekLast();            // O(1)
}

Visual:
removeFirst ◄────┌───┬───┬───┬───┬───┐────► removeLast
addFirst    ────►│ A │ B │ C │ D │ E │◄──── addLast
                 └───┴───┴───┴───┴───┘

Use Cases:
├── Sliding window maximum
├── Palindrome checking
├── Work stealing in thread pools
├── Undo/Redo with limited history
└── Browser history (forward/back)
```

#### 4. Priority Queue (Heap-Based)

```java
// Elements dequeued by priority, not arrival order

PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// Custom comparator
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    (a, b) -> a.priority - b.priority
);

Operations:
├── add/offer: O(log n)
├── poll: O(log n)
├── peek: O(1)
├── remove(Object): O(n)
└── contains: O(n)

Use Cases:
├── Dijkstra's shortest path
├── Prim's MST
├── Huffman coding
├── Task scheduling by priority
├── Event-driven simulation
└── Median finding (two heaps)
```

#### 5. Concurrent Queue

```java
// Thread-safe queues for multi-threaded applications

// Blocking Queue - waits when full/empty
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);
queue.put(task);      // Blocks if full
queue.take();         // Blocks if empty

// Non-Blocking Queue - never waits
ConcurrentLinkedQueue<Task> queue = new ConcurrentLinkedQueue<>();
queue.offer(task);    // Returns false if failed
queue.poll();         // Returns null if empty

Types:
├── ArrayBlockingQueue - Bounded, array-based
├── LinkedBlockingQueue - Optionally bounded
├── PriorityBlockingQueue - Unbounded priority queue
├── DelayQueue - Elements available after delay
├── SynchronousQueue - No storage, direct handoff
└── TransferQueue - Producer waits for consumer
```

#### 6. Delay Queue

```java
// Elements become available after a delay

class DelayedTask implements Delayed {
    private String name;
    private long executeTime;

    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(executeTime - System.currentTimeMillis(),
                           TimeUnit.MILLISECONDS);
    }

    @Override
    public int compareTo(Delayed o) {
        return Long.compare(this.executeTime,
                           ((DelayedTask) o).executeTime);
    }
}

DelayQueue<DelayedTask> queue = new DelayQueue<>();

Use Cases:
├── Scheduled tasks
├── Session timeout management
├── Rate limiting (token bucket)
├── Retry with backoff
└── Cache expiration
```

#### 7. Monotonic Queue

```java
// Maintains elements in sorted order for sliding window operations

class MonotonicQueue {
    private Deque<Integer> deque = new LinkedList<>();

    // For sliding window maximum
    public void push(int val) {
        while (!deque.isEmpty() && deque.peekLast() < val) {
            deque.pollLast();  // Remove smaller elements
        }
        deque.addLast(val);
    }

    public void pop(int val) {
        if (!deque.isEmpty() && deque.peekFirst() == val) {
            deque.pollFirst();
        }
    }

    public int max() {
        return deque.peekFirst();
    }
}

Use Case: Sliding Window Maximum in O(n) instead of O(n*k)
```

### LeetCode Problems - Queues

| #   | Problem                               | Difficulty | Pattern         | Link                                                                 |
| --- | ------------------------------------- | ---------- | --------------- | -------------------------------------------------------------------- |
| 232 | Implement Queue using Stacks          | Easy       | Two Stacks      | https://leetcode.com/problems/implement-queue-using-stacks/          |
| 622 | Design Circular Queue                 | Medium     | Circular Array  | https://leetcode.com/problems/design-circular-queue/                 |
| 641 | Design Circular Deque                 | Medium     | Deque           | https://leetcode.com/problems/design-circular-deque/                 |
| 239 | Sliding Window Maximum                | Hard       | Monotonic Deque | https://leetcode.com/problems/sliding-window-maximum/                |
| 862 | Shortest Subarray with Sum at Least K | Hard       | Monotonic Deque | https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/ |
| 621 | Task Scheduler                        | Medium     | Priority Queue  | https://leetcode.com/problems/task-scheduler/                        |
| 295 | Find Median from Data Stream          | Hard       | Two Heaps       | https://leetcode.com/problems/find-median-from-data-stream/          |

### Real-World Queue Usage

```
1. MESSAGE QUEUES (Kafka, RabbitMQ, SQS)
   └── Decoupling services
   └── Load leveling
   └── Event streaming
   └── Async processing

2. OPERATING SYSTEMS
   └── Process scheduling (ready queue)
   └── I/O request queues
   └── Print spooler

3. WEB SERVERS
   └── Request queues
   └── Connection pools
   └── Rate limiting

4. DATABASES
   └── Write-ahead log (WAL)
   └── Replication queues
   └── Query queues

5. NETWORKING
   └── Packet queues (routers)
   └── TCP send/receive buffers
   └── QoS implementation

6. REAL-TIME SYSTEMS
   └── Event queues
   └── Task scheduling
   └── Interrupt handling
```

---

## Hash Tables - Complete Guide

### WHY Hash Tables Exist

```
Problem: Fast lookup by key

Array:      O(n) search by value
Sorted:     O(log n) binary search
Hash Table: O(1) average lookup!

Key Insight:
Convert keys to array indices using a hash function.
Direct addressing without search.
```

### HOW Hash Tables Work

```
Hash Function converts key to index:
"apple" → hash("apple") → 42 → store at index 42

┌────────────────────────────────────────────────────────────┐
│                    HASH TABLE INTERNALS                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Key: "apple"                                               │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ Hash        │ h("apple") = 97 × 31^4 + ... = 93029210   │
│  │ Function    │                                           │
│  └─────────────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  93029210 % 16 = 10  (Index in array of size 16)           │
│         │                                                   │
│         ▼                                                   │
│  Array[10] ← Store ("apple", value)                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Hash Table Variants

#### 1. Chaining (Separate Chaining)

```java
// Each bucket contains a linked list

class HashTableChaining<K, V> {
    private LinkedList<Entry<K, V>>[] buckets;
    private int size;

    public void put(K key, V value) {
        int index = hash(key) % buckets.length;
        LinkedList<Entry<K, V>> bucket = buckets[index];

        for (Entry<K, V> entry : bucket) {
            if (entry.key.equals(key)) {
                entry.value = value;  // Update existing
                return;
            }
        }
        bucket.add(new Entry<>(key, value));
        size++;
    }

    public V get(K key) {
        int index = hash(key) % buckets.length;
        for (Entry<K, V> entry : buckets[index]) {
            if (entry.key.equals(key)) return entry.value;
        }
        return null;
    }
}

Visual:
Index 0: → [("cat", 1)] → [("dog", 2)]
Index 1: → [("apple", 5)]
Index 2: → null
Index 3: → [("banana", 3)] → [("orange", 4)] → [("grape", 6)]
```

#### 2. Open Addressing (Linear Probing)

```java
// All elements stored in array, probe for next slot on collision

class HashTableLinearProbing<K, V> {
    private Entry<K, V>[] table;

    public void put(K key, V value) {
        int index = hash(key) % table.length;

        while (table[index] != null && !table[index].key.equals(key)) {
            index = (index + 1) % table.length;  // Linear probe
        }
        table[index] = new Entry<>(key, value);
    }

    public V get(K key) {
        int index = hash(key) % table.length;

        while (table[index] != null) {
            if (table[index].key.equals(key)) {
                return table[index].value;
            }
            index = (index + 1) % table.length;
        }
        return null;
    }
}

Collision Resolution:
Linear Probing:   h(k), h(k)+1, h(k)+2, ...
Quadratic Probing: h(k), h(k)+1², h(k)+2², h(k)+3², ...
Double Hashing:   h(k), h(k)+h2(k), h(k)+2*h2(k), ...
```

#### 3. Robin Hood Hashing

```java
// Steal from rich (close to home) to give to poor (far from home)

// When inserting, if current element's probe distance is less
// than new element's probe distance, swap them

Advantages:
├── More uniform distribution
├── Reduces worst-case lookup
├── Cache friendly
└── Used in: Rust's HashMap
```

#### 4. Cuckoo Hashing

```java
// Two hash tables, two hash functions
// Guaranteed O(1) worst-case lookup

class CuckooHashTable<K, V> {
    private Entry<K, V>[] table1;
    private Entry<K, V>[] table2;

    public V get(K key) {
        int i1 = h1(key), i2 = h2(key);
        if (table1[i1] != null && table1[i1].key.equals(key))
            return table1[i1].value;
        if (table2[i2] != null && table2[i2].key.equals(key))
            return table2[i2].value;
        return null;
    }

    public void put(K key, V value) {
        // Try table1 first
        // If occupied, kick out existing and try its alternate
        // If cycle, rehash both tables
    }
}

Visual:
Table1 (h1):  Table2 (h2):
┌───┐         ┌───┐
│ A │         │ B │
├───┤         ├───┤
│   │         │ A │  ← A can be in either table1[h1(A)] or table2[h2(A)]
├───┤         ├───┤
│ C │         │   │
└───┘         └───┘
```

#### 5. Concurrent Hash Tables

```java
// Thread-safe hash tables

// ConcurrentHashMap (Java)
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

Features:
├── Segment-level locking (not whole map)
├── Lock-free reads
├── Better throughput than synchronized HashMap
└── Weakly consistent iterators

// Lock-Free Hash Tables
└── Use CAS (Compare-and-Swap) operations
└── Higher throughput under contention
└── More complex implementation
```

#### 6. Hash Set (Unique Elements)

```java
// Hash table where value doesn't matter, only keys

HashSet<Integer> set = new HashSet<>();

Operations:
├── add(E): O(1)
├── remove(E): O(1)
├── contains(E): O(1)
└── Used for: Deduplication, membership testing
```

#### 7. Ordered Hash Tables

```java
// Maintain insertion order

LinkedHashMap<String, Integer> orderedMap = new LinkedHashMap<>();
// Keys iterate in insertion order

// Access-Order (for LRU Cache)
LinkedHashMap<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true);
// accessOrder=true: Most recently accessed moves to end
```

#### 8. Bloom Filter (Probabilistic)

```java
// Space-efficient probabilistic set
// Answers: "definitely not in set" or "probably in set"

class BloomFilter {
    private BitSet bits;
    private int numHashFunctions;

    public void add(String item) {
        for (int i = 0; i < numHashFunctions; i++) {
            int hash = hash(item, i);
            bits.set(hash % bits.size());
        }
    }

    public boolean mightContain(String item) {
        for (int i = 0; i < numHashFunctions; i++) {
            int hash = hash(item, i);
            if (!bits.get(hash % bits.size())) {
                return false;  // Definitely not in set
            }
        }
        return true;  // Probably in set (false positive possible)
    }
}

Use Cases:
├── Spell checkers (probably misspelled)
├── Cache lookup (avoid disk read if not cached)
├── Network routers (packet filtering)
├── Database (avoid disk lookup)
└── CDN (URL existence check)
```

#### 9. Count-Min Sketch

```java
// Probabilistic frequency counter
// Estimate frequency with bounded error

class CountMinSketch {
    private int[][] table;  // d rows, w columns

    public void add(String item) {
        for (int i = 0; i < d; i++) {
            int j = hash(item, i) % w;
            table[i][j]++;
        }
    }

    public int estimate(String item) {
        int min = Integer.MAX_VALUE;
        for (int i = 0; i < d; i++) {
            int j = hash(item, i) % w;
            min = Math.min(min, table[i][j]);
        }
        return min;  // Never underestimates
    }
}

Use Cases:
├── Heavy hitter detection
├── Network traffic analysis
├── Database query optimization
└── Stream processing frequency counts
```

### LeetCode Problems - Hash Tables

| #   | Problem                      | Difficulty | Pattern             | Link                                                        |
| --- | ---------------------------- | ---------- | ------------------- | ----------------------------------------------------------- |
| 1   | Two Sum                      | Easy       | HashMap             | https://leetcode.com/problems/two-sum/                      |
| 49  | Group Anagrams               | Medium     | HashMap + Sort      | https://leetcode.com/problems/group-anagrams/               |
| 128 | Longest Consecutive Sequence | Medium     | HashSet             | https://leetcode.com/problems/longest-consecutive-sequence/ |
| 146 | LRU Cache                    | Medium     | LinkedHashMap       | https://leetcode.com/problems/lru-cache/                    |
| 380 | Insert Delete GetRandom O(1) | Medium     | HashMap + ArrayList | https://leetcode.com/problems/insert-delete-getrandom-o1/   |
| 706 | Design HashMap               | Easy       | Implementation      | https://leetcode.com/problems/design-hashmap/               |
| 460 | LFU Cache                    | Hard       | HashMap + DLL       | https://leetcode.com/problems/lfu-cache/                    |

### Real-World Hash Table Usage

```
1. DATABASES
   └── Index structures
   └── Join operations (hash join)
   └── Query result caching
   └── Partition routing

2. CACHING SYSTEMS (Redis, Memcached)
   └── Key-value storage
   └── Session management
   └── Rate limiting counters

3. COMPILERS
   └── Symbol tables
   └── String interning
   └── Macro expansion

4. NETWORKING
   └── Routing tables
   └── Connection tracking
   └── Load balancer mappings

5. SECURITY
   └── Password storage (with salting)
   └── Digital signatures
   └── Certificate validation

6. DISTRIBUTED SYSTEMS
   └── Consistent hashing (load distribution)
   └── Distributed hash tables (DHT)
   └── Content-addressable storage
```

---

## Trees - Complete Guide

### WHY Trees Exist

```
Problem: Need hierarchical organization AND efficient operations

Array:  O(1) access, O(n) search, O(n) insert
List:   O(n) access, O(n) search, O(1) insert
BST:    O(log n) for all operations!

Key Insight:
Trees provide a BALANCED trade-off between access and modification.
Also naturally represent hierarchical data.
```

### Tree Variants

#### 1. Binary Tree

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
}

// Types of Binary Trees:

FULL: Every node has 0 or 2 children
        1
       / \
      2   3
     / \
    4   5

COMPLETE: All levels full except last, filled left to right
        1
       / \
      2   3
     / \  /
    4   5 6

PERFECT: All internal nodes have 2 children, all leaves same level
        1
       / \
      2   3
     / \ / \
    4  5 6  7

BALANCED: Height difference between subtrees ≤ 1
DEGENERATE: Every node has only one child (linked list)
```

#### 2. Binary Search Tree (BST)

```java
// Left < Root < Right

class BST {
    TreeNode root;

    TreeNode insert(TreeNode node, int val) {
        if (node == null) return new TreeNode(val);
        if (val < node.val) node.left = insert(node.left, val);
        else node.right = insert(node.right, val);
        return node;
    }

    TreeNode search(TreeNode node, int val) {
        if (node == null || node.val == val) return node;
        if (val < node.val) return search(node.left, val);
        return search(node.right, val);
    }

    TreeNode delete(TreeNode node, int val) {
        if (node == null) return null;
        if (val < node.val) node.left = delete(node.left, val);
        else if (val > node.val) node.right = delete(node.right, val);
        else {
            // Found node to delete
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            // Two children: replace with inorder successor
            TreeNode minRight = findMin(node.right);
            node.val = minRight.val;
            node.right = delete(node.right, minRight.val);
        }
        return node;
    }
}

Complexity:
├── Average: O(log n) for all operations
└── Worst (skewed): O(n) - degenerates to linked list
```

#### 3. AVL Tree (Self-Balancing BST)

```java
// Height-balanced: |height(left) - height(right)| ≤ 1

class AVLNode {
    int val, height;
    AVLNode left, right;
}

// Rotations to maintain balance:

RIGHT ROTATION (Left-Left case):
    z                    y
   / \                 /   \
  y   T4    ──►       x     z
 / \                 / \   / \
x   T3              T1 T2 T3 T4

LEFT ROTATION (Right-Right case):
  z                      y
 / \                   /   \
T1  y      ──►        z     x
   / \               / \   / \
  T2  x             T1 T2 T3 T4

LEFT-RIGHT (Left-Right case):
    z             z               x
   / \           / \            /   \
  y   T4  ──►   x   T4   ──►   y     z
 / \           / \            / \   / \
T1  x         y   T3         T1 T2 T3 T4
   / \       / \
  T2 T3     T1 T2

Complexity: O(log n) guaranteed for all operations
Used In: Databases, file systems
```

#### 4. Red-Black Tree

```java
// Properties:
// 1. Every node is red or black
// 2. Root is black
// 3. Leaves (NIL) are black
// 4. Red node's children are black
// 5. All paths to leaves have same black count

class RBNode {
    int val;
    boolean isRed;
    RBNode left, right, parent;
}

// Less rigid than AVL, fewer rotations on insert/delete
// Height ≤ 2 * log(n+1)

Used In:
├── Java TreeMap, TreeSet
├── C++ map, set, multimap, multiset
├── Linux kernel (process scheduling, memory management)
└── Nginx (timer management)
```

#### 5. B-Tree

```java
// Multi-way search tree optimized for disk access
// Each node can have many children

B-Tree of order m:
├── Each node has at most m children
├── Non-leaf nodes have at least ⌈m/2⌉ children
├── Root has at least 2 children
├── All leaves at same level
└── Non-leaf with k children has k-1 keys

Example (order 4):
                    [20]
                   /    \
           [10, 15]      [30, 40, 50]
          /  |  \        /   |   |   \
      [5,8][11,12][16,18] [25][35][45][60,70]

Complexity:
├── Search: O(log n)
├── Insert: O(log n)
├── Delete: O(log n)
└── Disk reads: O(logm n) - much fewer!

Used In:
├── Databases (indexes)
├── File systems (NTFS, ext4, HFS+)
└── Key-value stores
```

#### 6. B+ Tree

```java
// All data in leaves, internal nodes only for navigation
// Leaves form linked list for range queries

                    [20 | 50]
                   /    |    \
           [10|15]   [30|40]   [60|70]
              |         |         |
              ▼         ▼         ▼
         ┌─────┐   ┌─────┐   ┌─────┐
 Leaves: │5│10│─►│15│20│─►│30│40│─►│50│60│─►│70│80│
         └─────┘   └─────┘   └─────┘

Advantages over B-Tree:
├── All records in leaves (uniform access)
├── Leaf linked list for range queries
├── More keys per internal node (better fanout)
└── Consistent disk reads for any query

Used In: MySQL InnoDB, PostgreSQL, SQLite, Oracle
```

#### 7. Trie (Prefix Tree)

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];  // For lowercase English
    boolean isEndOfWord;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new TrieNode();
            }
            node = node.children[idx];
        }
        node.isEndOfWord = true;
    }

    boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEndOfWord;
    }

    boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }
}

Visual:
          root
         / | \
        a  b  c
       /       \
      p         a
     / \         \
    p   r         r
   /     \
  l       i
 /         \
e           c
(apple)    (apricot)

Complexity:
├── Insert: O(m) where m = word length
├── Search: O(m)
└── Space: O(ALPHABET_SIZE * m * n)

Use Cases:
├── Autocomplete
├── Spell checker
├── IP routing (longest prefix match)
├── Word games (Boggle, Scrabble)
└── DNA sequence matching
```

#### 8. Segment Tree

```java
// Tree for range queries and updates

class SegmentTree {
    int[] tree;
    int n;

    void build(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 0, 0, n - 1);
    }

    void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2*node+1, start, mid);
            build(arr, 2*node+2, mid+1, end);
            tree[node] = tree[2*node+1] + tree[2*node+2];
        }
    }

    int query(int l, int r) {
        return query(0, 0, n-1, l, r);
    }

    void update(int idx, int val) {
        update(0, 0, n-1, idx, val);
    }
}

Visual (Sum Segment Tree for [1, 3, 5, 7, 9, 11]):
                     [36]
                   /      \
              [9]           [27]
             /   \         /    \
          [4]   [5]     [16]    [11]
          / \            / \
        [1] [3]       [7] [9]

Complexity:
├── Build: O(n)
├── Query: O(log n)
├── Update: O(log n)

Use Cases:
├── Range sum/min/max queries
├── Range GCD/LCM
├── Interval scheduling
└── Computational geometry
```

#### 9. Fenwick Tree (Binary Indexed Tree)

```java
// Simpler than Segment Tree, for prefix sums

class FenwickTree {
    int[] tree;

    void update(int i, int delta) {
        for (; i < tree.length; i += i & (-i))
            tree[i] += delta;
    }

    int prefixSum(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i))
            sum += tree[i];
        return sum;
    }

    int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}

Complexity:
├── Update: O(log n)
├── Query: O(log n)
├── Space: O(n)

Advantage: Simpler code, less memory than Segment Tree
```

#### 10. Suffix Tree

```java
// Tree of all suffixes of a string
// Enables O(m) pattern matching where m = pattern length

String: "banana$"
Suffixes: banana$, anana$, nana$, ana$, na$, a$, $

              root
            / | | \ \
           a  b n  $ ...
          /   |  \
         na  an  an
        /  \  |   \
       na$  $ ana$ a$

Use Cases:
├── Pattern matching
├── Longest repeated substring
├── Longest common substring
├── Palindrome detection
└── DNA sequence analysis

Modern Alternative: Suffix Array + LCP Array (less space)
```

### LeetCode Problems - Trees

| #   | Problem                           | Difficulty | Pattern   | Link                                                             |
| --- | --------------------------------- | ---------- | --------- | ---------------------------------------------------------------- |
| 94  | Binary Tree Inorder Traversal     | Easy       | DFS       | https://leetcode.com/problems/binary-tree-inorder-traversal/     |
| 104 | Maximum Depth of Binary Tree      | Easy       | DFS/BFS   | https://leetcode.com/problems/maximum-depth-of-binary-tree/      |
| 226 | Invert Binary Tree                | Easy       | Recursion | https://leetcode.com/problems/invert-binary-tree/                |
| 98  | Validate Binary Search Tree       | Medium     | Inorder   | https://leetcode.com/problems/validate-binary-search-tree/       |
| 102 | Binary Tree Level Order Traversal | Medium     | BFS       | https://leetcode.com/problems/binary-tree-level-order-traversal/ |
| 208 | Implement Trie                    | Medium     | Trie      | https://leetcode.com/problems/implement-trie-prefix-tree/        |
| 124 | Binary Tree Maximum Path Sum      | Hard       | DFS       | https://leetcode.com/problems/binary-tree-maximum-path-sum/      |

### Real-World Tree Usage

```
1. DATABASES
   └── B+ Tree indexes
   └── Query execution plans (tree structure)
   └── Parse trees for SQL

2. FILE SYSTEMS
   └── Directory structure (N-ary tree)
   └── B-Tree for file allocation
   └── Merkle trees for integrity

3. COMPILERS
   └── Abstract Syntax Trees (AST)
   └── Parse trees
   └── Expression trees

4. NETWORKING
   └── Routing tables (Trie)
   └── DOM trees (HTML/XML)
   └── Protocol buffers

5. AI/MACHINE LEARNING
   └── Decision trees
   └── Random forests
   └── Game trees (minimax)

6. OPERATING SYSTEMS
   └── Process trees
   └── Virtual memory (page tables)
   └── Device trees
```

---

## Heaps - Complete Guide

### WHY Heaps Exist

```
Problem: Efficiently find min/max element

Sorted Array:
├── Find min/max: O(1)
├── Insert: O(n) - shift elements
└── Delete min/max: O(n)

Heap:
├── Find min/max: O(1)
├── Insert: O(log n)
└── Delete min/max: O(log n)

Key Insight:
Heaps sacrifice sorted order for faster operations.
Only guarantee: root is min/max.
```

### HOW Heaps Work

```
Binary Heap (Complete Binary Tree):

MAX HEAP: Parent ≥ Children
              100
             /    \
           90      80
          / \     / \
         70  60  50  40

MIN HEAP: Parent ≤ Children
              10
             /    \
           20      30
          / \     / \
         40  50  60  70

Array Representation:
Index:    0   1   2   3   4   5   6
Array: [100, 90, 80, 70, 60, 50, 40]

Parent(i) = (i-1) / 2
LeftChild(i) = 2*i + 1
RightChild(i) = 2*i + 2
```

### Heap Operations

```java
class MinHeap {
    int[] heap;
    int size;

    void insert(int val) {
        heap[size] = val;
        siftUp(size);
        size++;
    }

    void siftUp(int i) {
        while (i > 0 && heap[i] < heap[parent(i)]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    int extractMin() {
        int min = heap[0];
        heap[0] = heap[size - 1];
        size--;
        siftDown(0);
        return min;
    }

    void siftDown(int i) {
        while (leftChild(i) < size) {
            int smallest = i;
            if (heap[leftChild(i)] < heap[smallest])
                smallest = leftChild(i);
            if (rightChild(i) < size && heap[rightChild(i)] < heap[smallest])
                smallest = rightChild(i);
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }

    // Build heap from array: O(n)
    void heapify(int[] arr) {
        heap = arr;
        size = arr.length;
        // Start from last non-leaf node
        for (int i = size / 2 - 1; i >= 0; i--) {
            siftDown(i);
        }
    }
}
```

### Heap Variants

#### 1. Min Heap / Max Heap

```java
// Min Heap: PriorityQueue default in Java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max Heap: Reverse comparator
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
```

#### 2. D-ary Heap

```java
// Each node has d children instead of 2
// Trade-off: Shallower tree vs more comparisons per level

// d=4 Heap:
              1
         /  /  \  \
        5  3   8   10
      / | | \
     12 15 20 25

Benefits:
├── Better cache performance (fewer levels)
├── Faster insert (shallower tree)
└── Used in Dijkstra's algorithm optimization
```

#### 3. Fibonacci Heap

```java
// Advanced heap with better amortized complexity

Operations:
├── Insert: O(1)
├── Find min: O(1)
├── Delete min: O(log n) amortized
├── Decrease key: O(1) amortized  // This is the key advantage!
└── Merge: O(1)

Use Case: Dijkstra's, Prim's algorithm optimization
Drawback: Complex implementation, high constants
```

#### 4. Binomial Heap

```java
// Collection of binomial trees
// Good for merge operation

Merge: O(log n)  // Better than binary heap's O(n)

Use Case: When frequent merging of heaps needed
```

#### 5. Pairing Heap

```java
// Simpler than Fibonacci, similar performance

Operations:
├── Insert: O(1)
├── Find min: O(1)
├── Delete min: O(log n) amortized
├── Decrease key: O(log log n) amortized
└── Merge: O(1)

Use Case: Practical alternative to Fibonacci heap
```

#### 6. Double-Ended Priority Queue (DEPQ)

```java
// Support both min and max extraction

Implementations:
├── Min-Max Heap
├── Interval Heap
└── Two heaps (min + max)

class MinMaxHeap {
    // Alternating levels: min, max, min, max...
    // Even levels: min-heap property
    // Odd levels: max-heap property
}

Use Case: Sliding window median, range queries
```

#### 7. Indexed Priority Queue

```java
// PQ that supports update by key

class IndexedPQ<Key extends Comparable<Key>> {
    int[] pq;      // Binary heap
    int[] qp;      // Inverse: qp[pq[i]] = i
    Key[] keys;    // Keys indexed by integer

    void changeKey(int i, Key key) {
        keys[i] = key;
        swim(qp[i]);
        sink(qp[i]);
    }
}

Use Case: Dijkstra's, Prim's with updates
```

### Two Heaps Pattern

```java
// Maintain two heaps for median finding

class MedianFinder {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());

        if (minHeap.size() > maxHeap.size()) {
            maxHeap.offer(minHeap.poll());
        }
    }

    double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.peek();
        }
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}

Visual:
     maxHeap (smaller half)    minHeap (larger half)
           [5]                      [6]
          / \                      / \
        [3] [4]                  [7] [8]

Median = (5 + 6) / 2 = 5.5
```

### LeetCode Problems - Heaps

| #   | Problem                         | Difficulty | Pattern           | Link                                                           |
| --- | ------------------------------- | ---------- | ----------------- | -------------------------------------------------------------- |
| 215 | Kth Largest Element in an Array | Medium     | QuickSelect/Heap  | https://leetcode.com/problems/kth-largest-element-in-an-array/ |
| 347 | Top K Frequent Elements         | Medium     | Bucket Sort/Heap  | https://leetcode.com/problems/top-k-frequent-elements/         |
| 295 | Find Median from Data Stream    | Hard       | Two Heaps         | https://leetcode.com/problems/find-median-from-data-stream/    |
| 23  | Merge k Sorted Lists            | Hard       | Min Heap          | https://leetcode.com/problems/merge-k-sorted-lists/            |
| 703 | Kth Largest Element in a Stream | Easy       | Min Heap          | https://leetcode.com/problems/kth-largest-element-in-a-stream/ |
| 973 | K Closest Points to Origin      | Medium     | Max Heap          | https://leetcode.com/problems/k-closest-points-to-origin/      |
| 621 | Task Scheduler                  | Medium     | Max Heap + Greedy | https://leetcode.com/problems/task-scheduler/                  |

### Real-World Heap Usage

```
1. OPERATING SYSTEMS
   └── Process scheduling (priority)
   └── Timer management
   └── Memory management

2. GRAPH ALGORITHMS
   └── Dijkstra's shortest path
   └── Prim's MST
   └── A* search

3. EVENT-DRIVEN SIMULATION
   └── Event queue (by time)
   └── Scheduled tasks

4. DATA COMPRESSION
   └── Huffman coding

5. NETWORKING
   └── Bandwidth management (QoS)
   └── Connection scheduling

6. DATABASES
   └── External sorting (k-way merge)
   └── Top-K queries
```

---

## Graphs - Complete Guide

### WHY Graphs Exist

```
Problem: Represent relationships between entities

Trees: Hierarchical, one parent per node
Graphs: Any-to-any relationships

Real-World Modeled by Graphs:
├── Social networks (friends)
├── Road networks (cities, distances)
├── Internet (web pages, links)
├── Dependencies (tasks, prerequisites)
└── Molecules (atoms, bonds)
```

### Graph Representations

```java
// 1. Adjacency Matrix
int[][] matrix = new int[n][n];
matrix[u][v] = weight;  // Edge from u to v

Pros: O(1) edge check, good for dense graphs
Cons: O(n²) space

Visual:
    0  1  2  3
  ┌──────────────
0 │ 0  1  1  0
1 │ 1  0  1  1
2 │ 1  1  0  0
3 │ 0  1  0  0

// 2. Adjacency List
List<List<int[]>> adj = new ArrayList<>();
adj.get(u).add(new int[]{v, weight});

Pros: O(V + E) space, good for sparse graphs
Cons: O(degree) edge check

Visual:
0 → [1, 2]
1 → [0, 2, 3]
2 → [0, 1]
3 → [1]

// 3. Edge List
List<int[]> edges = new ArrayList<>();
edges.add(new int[]{u, v, weight});

Pros: Simple, good for edge-centric algorithms (Kruskal's)
Cons: O(E) for any query
```

### Graph Variants

#### 1. Directed vs Undirected

```
UNDIRECTED:
    1 ─── 2
    │     │
    3 ─── 4

Edges: {1,2}, {1,3}, {2,4}, {3,4}
Each edge represents bidirectional relationship

DIRECTED:
    1 ──► 2
    │     │
    ▼     ▼
    3 ◄── 4

Edges: (1,2), (1,3), (2,4), (4,3)
Each edge has direction
```

#### 2. Weighted vs Unweighted

```
WEIGHTED:
    1 ──5── 2
    │       │
    3      10
    │       │
    3 ──7── 4

Edge weights: distances, costs, capacities

UNWEIGHTED:
    1 ───── 2
    │       │
    │       │
    3 ───── 4

All edges have implicit weight 1
```

#### 3. Cyclic vs Acyclic

```
CYCLIC:
    1 ──► 2
    ▲     │
    │     ▼
    4 ◄── 3

Contains at least one cycle

DAG (Directed Acyclic Graph):
    1 ──► 2
    │     │
    ▼     ▼
    3 ──► 4

No cycles - used for dependencies, scheduling
```

#### 4. Connected vs Disconnected

```
CONNECTED (Undirected):
All vertices reachable from any vertex

STRONGLY CONNECTED (Directed):
All vertices reachable from any vertex following edge directions

WEAKLY CONNECTED (Directed):
Connected if we ignore edge directions

DISCONNECTED:
    1 ─── 2    5 ─── 6
    │     │
    3 ─── 4

Multiple components
```

#### 5. Bipartite Graph

```
    Set A      Set B
     1    ╲    ╱    4
           ╲╱
     2    ╱╲    ╱    5
           ╱╲
     3    ╱    ╲    6

Edges only between sets, not within
Use: Matching problems, 2-coloring

Detection: BFS/DFS coloring - if odd cycle, not bipartite
```

#### 6. Complete Graph

```
Every vertex connected to every other vertex

    1 ─── 2
    │ ╲ ╱ │
    │  ╳  │
    │ ╱ ╲ │
    3 ─── 4

Edges: n(n-1)/2 for undirected
       n(n-1) for directed
```

### Graph Algorithms

#### 1. BFS (Breadth-First Search)

```java
void bfs(int start) {
    Queue<Integer> queue = new LinkedList<>();
    boolean[] visited = new boolean[n];

    queue.offer(start);
    visited[start] = true;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        process(node);

        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

Use Cases:
├── Shortest path in unweighted graph
├── Level-order traversal
├── Finding connected components
└── Bipartite check
```

#### 2. DFS (Depth-First Search)

```java
void dfs(int node, boolean[] visited) {
    visited[node] = true;
    process(node);

    for (int neighbor : adj.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, visited);
        }
    }
}

void dfsIterative(int start) {
    Stack<Integer> stack = new Stack<>();
    boolean[] visited = new boolean[n];

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (!visited[node]) {
            visited[node] = true;
            process(node);
            for (int neighbor : adj.get(node)) {
                stack.push(neighbor);
            }
        }
    }
}

Use Cases:
├── Path finding
├── Cycle detection
├── Topological sort
├── Strongly connected components
└── Backtracking problems
```

#### 3. Dijkstra's Algorithm

```java
// Single source shortest path (non-negative weights)

int[] dijkstra(int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], d = curr[1];

        if (d > dist[u]) continue;  // Skip outdated

        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}

Complexity: O((V + E) log V) with binary heap
Use Cases: GPS navigation, network routing
```

#### 4. Bellman-Ford Algorithm

```java
// Single source shortest path (handles negative weights)

int[] bellmanFord(int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges n-1 times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // Check for negative cycle
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            throw new RuntimeException("Negative cycle detected");
        }
    }

    return dist;
}

Complexity: O(VE)
Use Cases: Currency arbitrage detection, routing protocols (RIP)
```

#### 5. Floyd-Warshall Algorithm

```java
// All-pairs shortest path

int[][] floydWarshall(int[][] graph) {
    int[][] dist = new int[n][n];
    // Initialize with graph weights

    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != INF && dist[k][j] != INF) {
                    dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
                }
            }
        }
    }
    return dist;
}

Complexity: O(V³)
Use Cases: Dense graphs, transitive closure
```

#### 6. Topological Sort

```java
// Order vertices so all edges go left to right
// Only for DAG

// Kahn's Algorithm (BFS)
List<Integer> topologicalSort() {
    int[] inDegree = new int[n];
    for (int u = 0; u < n; u++) {
        for (int v : adj.get(u)) {
            inDegree[v]++;
        }
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    List<Integer> result = new ArrayList<>();
    while (!queue.isEmpty()) {
        int u = queue.poll();
        result.add(u);
        for (int v : adj.get(u)) {
            if (--inDegree[v] == 0) {
                queue.offer(v);
            }
        }
    }

    if (result.size() != n) throw new RuntimeException("Cycle detected");
    return result;
}

Use Cases:
├── Task scheduling
├── Build systems (make, Maven)
├── Course prerequisites
└── Data processing pipelines
```

#### 7. Minimum Spanning Tree

```java
// Kruskal's Algorithm (Edge-based)
int kruskal() {
    // Sort edges by weight
    Collections.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int mstWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (uf.find(u) != uf.find(v)) {
            uf.union(u, v);
            mstWeight += w;
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }
    return mstWeight;
}

// Prim's Algorithm (Vertex-based)
int prim() {
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{0, 0});  // Start from vertex 0

    int mstWeight = 0;
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], w = curr[1];

        if (inMST[u]) continue;
        inMST[u] = true;
        mstWeight += w;

        for (int[] edge : adj.get(u)) {
            int v = edge[0], weight = edge[1];
            if (!inMST[v]) {
                pq.offer(new int[]{v, weight});
            }
        }
    }
    return mstWeight;
}

Use Cases: Network design, clustering
```

### LeetCode Problems - Graphs

| #    | Problem                         | Difficulty | Pattern          | Link                                                           |
| ---- | ------------------------------- | ---------- | ---------------- | -------------------------------------------------------------- |
| 200  | Number of Islands               | Medium     | DFS/BFS          | https://leetcode.com/problems/number-of-islands/               |
| 207  | Course Schedule                 | Medium     | Topological Sort | https://leetcode.com/problems/course-schedule/                 |
| 133  | Clone Graph                     | Medium     | DFS/BFS          | https://leetcode.com/problems/clone-graph/                     |
| 743  | Network Delay Time              | Medium     | Dijkstra         | https://leetcode.com/problems/network-delay-time/              |
| 787  | Cheapest Flights Within K Stops | Medium     | Bellman-Ford     | https://leetcode.com/problems/cheapest-flights-within-k-stops/ |
| 1584 | Min Cost to Connect All Points  | Medium     | MST              | https://leetcode.com/problems/min-cost-to-connect-all-points/  |
| 269  | Alien Dictionary                | Hard       | Topological Sort | https://leetcode.com/problems/alien-dictionary/                |

### Real-World Graph Usage

```
1. SOCIAL NETWORKS
   └── Friend recommendations (BFS)
   └── Influence analysis (PageRank)
   └── Community detection

2. NAVIGATION
   └── GPS routing (Dijkstra, A*)
   └── Flight booking (shortest path)
   └── Traffic optimization

3. INTERNET
   └── Web crawling (BFS/DFS)
   └── PageRank algorithm
   └── Network routing protocols

4. DEPENDENCIES
   └── Package managers (npm, pip)
   └── Build systems (make)
   └── Database transactions

5. RECOMMENDATIONS
   └── Netflix/Amazon recommendations
   └── Graph neural networks
   └── Knowledge graphs

6. BIOLOGY
   └── Protein interaction networks
   └── Phylogenetic trees
   └── Drug discovery
```

---

## Advanced Data Structures

### 1. Disjoint Set (Union-Find)

```java
class UnionFind {
    int[] parent;
    int[] rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;

        // Union by rank
        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
    }
}

Complexity: O(α(n)) ≈ O(1) for practical purposes
(α is inverse Ackermann function)

Use Cases:
├── Kruskal's MST
├── Detect cycles in undirected graph
├── Network connectivity
├── Image segmentation
└── Percolation problems
```

### 2. LRU Cache

```java
class LRUCache {
    private Map<Integer, Node> cache;
    private Node head, tail;
    private int capacity;

    class Node {
        int key, value;
        Node prev, next;
    }

    public LRUCache(int capacity) {
        this.capacity = capacity;
        cache = new HashMap<>();
        head = new Node();
        tail = new Node();
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        Node node = cache.get(key);
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (cache.containsKey(key)) {
            Node node = cache.get(key);
            node.value = value;
            moveToHead(node);
        } else {
            Node node = new Node();
            node.key = key;
            node.value = value;
            cache.put(key, node);
            addToHead(node);

            if (cache.size() > capacity) {
                Node removed = removeTail();
                cache.remove(removed.key);
            }
        }
    }
}

Use Cases:
├── Browser cache
├── Database buffer pool
├── Operating system page cache
├── CDN caching
└── API response caching
```

### 3. LFU Cache

```java
// Least Frequently Used - evict least frequently accessed

class LFUCache {
    private Map<Integer, Node> keyToNode;
    private Map<Integer, DoublyLinkedList> freqToList;
    private int minFreq;
    private int capacity;

    // Implementation tracks access frequency
    // On eviction, remove least frequent (and oldest if tie)
}

Use Cases:
├── CDN caching (popular content stays)
├── Database query caching
└── Web application caching
```

### 4. Interval Tree

```java
// Store intervals, support overlap queries

class IntervalTree {
    // Each node stores an interval and max endpoint in subtree

    List<Interval> queryOverlap(Interval query) {
        // Find all intervals that overlap with query
        // O(log n + k) where k = number of overlapping intervals
    }
}

Use Cases:
├── Calendar scheduling
├── Database range queries
├── Genomics (gene overlap)
└── Graphics (collision detection)
```

### 5. KD-Tree (K-Dimensional Tree)

```java
// BST for multi-dimensional data

class KDTree {
    // Alternates splitting dimension at each level
    // 2D: x, y, x, y, ...

    List<Point> rangeSearch(Rectangle rect) {
        // Find all points in rectangle
        // O(√n + k) for 2D
    }

    Point nearestNeighbor(Point query) {
        // Find closest point
        // O(log n) average
    }
}

Use Cases:
├── Nearest neighbor search
├── Geographic queries
├── Machine learning (KNN)
├── Computer graphics
└── Computational geometry
```

### 6. Persistent Data Structures

```java
// Maintain all previous versions

class PersistentStack<T> {
    // Each operation creates new version
    // Old versions still accessible
    // Uses structural sharing

    PersistentStack<T> push(T item) {
        // Returns new version with item added
    }

    Pair<T, PersistentStack<T>> pop() {
        // Returns item and new version
    }
}

Use Cases:
├── Version control (Git)
├── Undo/Redo systems
├── Functional programming
├── Database snapshots
└── Time-travel debugging
```

---

## Specialized Data Structures

### 1. Rope (String Data Structure)

```java
// Efficient string operations for long strings

class Rope {
    // Binary tree where leaves are string chunks
    // Enables O(log n) insert, delete, access

    void insert(int pos, String str) { }
    void delete(int start, int end) { }
    char charAt(int pos) { }
}

Use Cases:
├── Text editors (for long documents)
├── DNA sequence manipulation
└── Large document processing
```

### 2. Spatial Indexing (R-Tree, Quadtree)

```java
// Index spatial data for range queries

// Quadtree: Divide 2D space into 4 quadrants recursively
class Quadtree {
    // Good for: 2D points, collision detection
}

// R-Tree: Group nearby objects in bounding rectangles
class RTree {
    // Good for: Rectangles, polygons
    // Used in: PostGIS, MongoDB
}

Use Cases:
├── Geographic databases (PostGIS)
├── Game collision detection
├── Computer graphics
└── Map applications
```

### 3. Merkle Tree (Hash Tree)

```java
// Tree of hashes for data integrity

class MerkleTree {
    // Leaf: hash of data block
    // Internal: hash of children's hashes
    // Root: single hash representing all data

    boolean verify(byte[] data, byte[] rootHash, List<byte[]> proof) {
        // Verify data belongs to tree with O(log n) proof
    }
}

Use Cases:
├── Git (file integrity)
├── Blockchain (transaction verification)
├── IPFS (content addressing)
├── Certificate transparency
└── P2P file sharing (BitTorrent)
```

### 4. HyperLogLog (Cardinality Estimation)

```java
// Estimate count of distinct elements

class HyperLogLog {
    // Uses ~12KB to estimate billions of unique items
    // 2% standard error

    void add(Object item) { }
    long estimate() { }
}

Use Cases:
├── Unique visitor counting
├── Database query optimization
├── Network traffic analysis
└── Big data analytics
```

---

## Real-World Usage in Modern Systems

### 1. Databases

```
MySQL/PostgreSQL:
├── B+ Tree indexes (primary, secondary)
├── Hash indexes (equality queries)
├── Heap files (table data)
├── Buffer pool (LRU cache)
└── WAL (write-ahead log as queue)

Redis:
├── Skip List (sorted sets)
├── Hash Table (keys, hash type)
├── Linked List (lists)
├── Bit arrays (HyperLogLog)
└── Radix tree (cluster slots)

Cassandra:
├── LSM Tree (write-optimized)
├── Bloom filters (reduce disk reads)
├── Consistent hashing (partition)
└── Merkle trees (repair)
```

### 2. Operating Systems

```
Linux Kernel:
├── Red-Black Tree (process scheduling CFS)
├── Radix Tree (page cache)
├── Hash Table (inode cache)
├── Linked Lists (run queues)
├── B-Tree (file systems)
└── Skip List (timer wheel)
```

### 3. Web Technologies

```
Browsers:
├── DOM (N-ary tree)
├── History (doubly linked list)
├── Cache (LRU hash map)
└── JS engine (AST trees)

Search Engines:
├── Inverted index (hash + posting lists)
├── Trie (autocomplete)
├── Graph (PageRank)
└── KD-Tree (geospatial)
```

### 4. Distributed Systems

```
Kafka:
├── Commit log (append-only)
├── Partition (ring buffer concept)
├── Consumer groups (hash assignment)
└── Replication (chain replication)

Kubernetes:
├── etcd (B+ tree)
├── Scheduler (priority queue)
├── Service mesh (consistent hashing)
└── ConfigMaps (hash maps)
```

---

## Learning Roadmap

### Phase 1: Foundation (Weeks 1-4)

```
Week 1: Arrays, Strings
Week 2: Linked Lists, Stacks, Queues
Week 3: Hash Tables
Week 4: Trees (Binary, BST, traversals)
```

### Phase 2: Intermediate (Weeks 5-8)

```
Week 5: Heaps, Priority Queues
Week 6: Graphs (BFS, DFS)
Week 7: Graph algorithms (Dijkstra, Topological Sort)
Week 8: Tries, Union-Find
```

### Phase 3: Advanced (Weeks 9-12)

```
Week 9: AVL/Red-Black Trees, Segment Trees
Week 10: Advanced Graph algorithms
Week 11: Specialized structures (Bloom filter, Skip list)
Week 12: System design applications
```

### Practice Strategy

```
Daily:
├── 2-3 LeetCode problems
├── Review one data structure's internals
├── Implement one operation from scratch

Weekly:
├── One mock interview
├── One system design discussion
├── Review and revise weak areas
```

---

## Key Takeaways

1. **Understand WHY before WHAT** - Know the problem a DS solves
2. **Master the fundamentals** - Arrays, Lists, Trees, Graphs
3. **Know your trade-offs** - Time vs Space, Read vs Write
4. **Practice implementations** - Write from scratch, not just use APIs
5. **Connect to real systems** - See how production systems use DS
6. **Solve problems** - Theory without practice is useless

---

_"Data structures + Algorithms = Programs. Master both, master programming."_

---

# 🚀 PART FINAL: ADVANCED TOPICS & MODERN ALGORITHMS

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED DSA - FROM BASICS TO CUTTING EDGE                              ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  This section covers advanced topics that build on the fundamentals:             ║
║  • String matching algorithms (beyond basic search)                              ║
║  • Randomized algorithms and their applications                                  ║
║  • Approximate algorithms for NP-hard problems                                   ║
║  • Modern data structures used in production systems                             ║
║  • Interview-level advanced patterns                                             ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## STRING ALGORITHMS - THE COMPLETE TOOLKIT

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STRING ALGORITHMS HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PATTERN MATCHING ALGORITHMS:                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ Algorithm    │ Time     │ Space │ Best For                              │  │
│  ├──────────────┼──────────┼───────┼───────────────────────────────────────┤  │
│  │ Naive        │ O(nm)    │ O(1)  │ Short patterns, simple cases          │  │
│  │ KMP          │ O(n+m)   │ O(m)  │ Single pattern, streaming             │  │
│  │ Rabin-Karp   │ O(n+m)†  │ O(1)  │ Multiple patterns same length         │  │
│  │ Z-Algorithm  │ O(n+m)   │ O(n)  │ All occurrences, string analysis     │  │
│  │ Aho-Corasick │ O(n+m+z) │ O(m)  │ Multiple patterns simultaneously     │  │
│  │ Suffix Array │ O(n log n)│O(n) │ Multiple queries on same text        │  │
│  │ Suffix Tree  │ O(n)     │ O(n)  │ Complex string operations            │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│  † Average case, O(nm) worst case with poor hash                               │
│                                                                                  │
│                                                                                  │
│  Z-ALGORITHM (All pattern occurrences):                                        │
│  ──────────────────────────────────────                                         │
```java
// Z[i] = length of longest substring starting at i that matches prefix
int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}

// Find all occurrences of pattern in text
List<Integer> findPattern(String text, String pattern) {
    String combined = pattern + "$" + text;  // $ is separator
    int[] z = zFunction(combined);

    List<Integer> matches = new ArrayList<>();
    int patLen = pattern.length();

    for (int i = patLen + 1; i < combined.length(); i++) {
        if (z[i] == patLen) {
            matches.add(i - patLen - 1);  // Position in original text
        }
    }
    return matches;
}
````

│ │
│ │
│ AHO-CORASICK (Multiple pattern matching): │
│ ────────────────────────────────────────── │

```java
class AhoCorasick {
    int[][] go = new int[MAX_STATES][26];  // Transition
    int[] fail = new int[MAX_STATES];       // Failure links
    boolean[] output = new boolean[MAX_STATES]; // Is end state?
    int states = 0;

    void addPattern(String p) {
        int cur = 0;
        for (char c : p.toCharArray()) {
            int ch = c - 'a';
            if (go[cur][ch] == -1) {
                go[cur][ch] = ++states;
            }
            cur = go[cur][ch];
        }
        output[cur] = true;
    }

    void build() {
        Queue<Integer> q = new LinkedList<>();

        // Initialize depth-1 states
        for (int c = 0; c < 26; c++) {
            if (go[0][c] != -1) {
                fail[go[0][c]] = 0;
                q.add(go[0][c]);
            } else {
                go[0][c] = 0;  // Loop back to root
            }
        }

        // BFS to build failure links
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int c = 0; c < 26; c++) {
                if (go[u][c] != -1) {
                    int v = go[u][c];
                    int f = fail[u];
                    while (go[f][c] == -1) f = fail[f];
                    fail[v] = go[f][c];
                    output[v] |= output[fail[v]];  // Inherit outputs
                    q.add(v);
                }
            }
        }
    }

    // Search text for any pattern
    boolean search(String text) {
        int state = 0;
        for (char c : text.toCharArray()) {
            int ch = c - 'a';
            while (go[state][ch] == -1) state = fail[state];
            state = go[state][ch];
            if (output[state]) return true;
        }
        return false;
    }
}
// Time: O(n + m + z) where z is number of matches
// Used in: Virus scanners, content filters, DNA analysis
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## RANDOMIZED ALGORITHMS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ RANDOMIZED ALGORITHMS - POWER OF RANDOMNESS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHY RANDOMIZATION? │
│ • Simpler algorithms with good expected performance │
│ • Avoid adversarial worst cases │
│ • Handle uncertain or dynamic data │
│ │
│ │
│ QUICKSELECT (Find k-th smallest element): │
│ ────────────────────────────────────────── │

```java
// O(n) expected, O(n²) worst case
int quickSelect(int[] arr, int k) {
    return quickSelect(arr, 0, arr.length - 1, k - 1);
}

int quickSelect(int[] arr, int lo, int hi, int k) {
    if (lo == hi) return arr[lo];

    // Random pivot to avoid worst case
    int pivotIdx = lo + new Random().nextInt(hi - lo + 1);
    pivotIdx = partition(arr, lo, hi, pivotIdx);

    if (k == pivotIdx) return arr[k];
    else if (k < pivotIdx) return quickSelect(arr, lo, pivotIdx - 1, k);
    else return quickSelect(arr, pivotIdx + 1, hi, k);
}

int partition(int[] arr, int lo, int hi, int pivotIdx) {
    int pivot = arr[pivotIdx];
    swap(arr, pivotIdx, hi);  // Move pivot to end
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            swap(arr, i++, j);
        }
    }
    swap(arr, i, hi);  // Move pivot to final position
    return i;
}
```

│ │
│ │
│ MILLER-RABIN PRIMALITY TEST: │
│ ──────────────────────────── │

```java
// Test if n is prime with high probability
// Error probability: (1/4)^k for k iterations
boolean isPrime(long n, int k) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // Write n-1 as 2^r * d
    long d = n - 1;
    int r = 0;
    while (d % 2 == 0) {
        d /= 2;
        r++;
    }

    // k rounds of testing
    Random rand = new Random();
    for (int i = 0; i < k; i++) {
        long a = 2 + rand.nextLong() % (n - 3);
        if (!millerTest(a, d, n, r)) {
            return false;  // Definitely composite
        }
    }
    return true;  // Probably prime
}

boolean millerTest(long a, long d, long n, int r) {
    long x = modPow(a, d, n);

    if (x == 1 || x == n - 1) return true;

    for (int i = 0; i < r - 1; i++) {
        x = modMult(x, x, n);
        if (x == n - 1) return true;
    }
    return false;
}
// Used in cryptography for generating large primes
```

│ │
│ │
│ RESERVOIR SAMPLING (Random sample from stream): │
│ ─────────────────────────────────────────────── │

```java
// Select k random items from unknown-size stream
int[] reservoirSample(Iterator<Integer> stream, int k) {
    int[] reservoir = new int[k];
    Random rand = new Random();

    // Fill reservoir with first k items
    for (int i = 0; i < k && stream.hasNext(); i++) {
        reservoir[i] = stream.next();
    }

    // Replace items with decreasing probability
    int n = k;
    while (stream.hasNext()) {
        int item = stream.next();
        n++;
        int j = rand.nextInt(n);  // Random index 0 to n-1
        if (j < k) {
            reservoir[j] = item;  // Replace with probability k/n
        }
    }

    return reservoir;
}
// Proof: Each item has exactly k/n probability of being selected
// Used in: Big data sampling, A/B testing, analytics
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## APPROXIMATION ALGORITHMS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ APPROXIMATION ALGORITHMS FOR NP-HARD PROBLEMS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ When optimal is too slow, get "good enough" in polynomial time! │
│ │
│ │
│ VERTEX COVER - 2-APPROXIMATION: │
│ ───────────────────────────────── │

```java
// Find vertex cover at most 2x optimal
// Greedy: pick both endpoints of any edge
Set<Integer> vertexCover(int n, int[][] edges) {
    Set<Integer> cover = new HashSet<>();
    boolean[] edgeCovered = new boolean[edges.length];

    for (int i = 0; i < edges.length; i++) {
        if (!edgeCovered[i]) {
            int u = edges[i][0], v = edges[i][1];
            cover.add(u);
            cover.add(v);

            // Mark all edges incident to u or v as covered
            for (int j = i; j < edges.length; j++) {
                if (edges[j][0] == u || edges[j][1] == u ||
                    edges[j][0] == v || edges[j][1] == v) {
                    edgeCovered[j] = true;
                }
            }
        }
    }
    return cover;
}
// Why 2-approximation?
// Optimal must include at least one endpoint of each edge
// We include both, so at most 2x optimal
```

│ │
│ │
│ SET COVER - log(n)-APPROXIMATION: │
│ ────────────────────────────────── │

```java
// Cover all elements using minimum number of sets
// Greedy: always pick set covering most uncovered elements
List<Set<Integer>> setCover(Set<Integer> universe, List<Set<Integer>> sets) {
    Set<Integer> uncovered = new HashSet<>(universe);
    List<Set<Integer>> cover = new ArrayList<>();

    while (!uncovered.isEmpty()) {
        // Find set covering most uncovered elements
        Set<Integer> best = null;
        int bestCount = 0;

        for (Set<Integer> s : sets) {
            Set<Integer> intersection = new HashSet<>(s);
            intersection.retainAll(uncovered);
            if (intersection.size() > bestCount) {
                bestCount = intersection.size();
                best = s;
            }
        }

        if (best == null) break;  // Can't cover all

        cover.add(best);
        uncovered.removeAll(best);
    }

    return cover;
}
// Approximation ratio: O(log n) where n = |universe|
// Used in: Resource allocation, facility location
```

│ │
│ │
│ TSP - 1.5-APPROXIMATION (Christofides): │
│ ──────────────────────────────────────── │

```java
// For metric TSP (triangle inequality holds)
// 1. Find MST
// 2. Find minimum matching on odd-degree vertices
// 3. Combine to get Eulerian graph
// 4. Find Eulerian tour and shortcut

// Simplified version (2-approximation using MST only):
List<Integer> tspApprox(int[][] dist, int n) {
    // Step 1: Build MST using Prim's
    boolean[] inMST = new boolean[n];
    int[] parent = new int[n];
    int[] key = new int[n];
    Arrays.fill(key, Integer.MAX_VALUE);
    key[0] = 0;
    parent[0] = -1;

    for (int count = 0; count < n; count++) {
        int u = minKey(key, inMST, n);
        inMST[u] = true;

        for (int v = 0; v < n; v++) {
            if (!inMST[v] && dist[u][v] < key[v]) {
                parent[v] = u;
                key[v] = dist[u][v];
            }
        }
    }

    // Step 2: DFS on MST to get tour order
    List<Integer> tour = new ArrayList<>();
    boolean[] visited = new boolean[n];
    dfs(0, parent, visited, tour, n);
    tour.add(0);  // Return to start

    return tour;
}
// Approximation: At most 2x optimal
// Christofides improves to 1.5x using minimum matching
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## MODERN DATA STRUCTURES IN PRODUCTION

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ PRODUCTION-GRADE DATA STRUCTURES │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ COUNT-MIN SKETCH (Approximate frequency counting): │
│ ────────────────────────────────────────────────── │

```java
class CountMinSketch {
    int[][] table;
    int[] hashA, hashB;  // Hash function parameters
    int width, depth;

    CountMinSketch(double epsilon, double delta) {
        // epsilon = error factor, delta = error probability
        this.width = (int) Math.ceil(Math.E / epsilon);
        this.depth = (int) Math.ceil(Math.log(1 / delta));
        this.table = new int[depth][width];

        Random rand = new Random();
        hashA = new int[depth];
        hashB = new int[depth];
        for (int i = 0; i < depth; i++) {
            hashA[i] = rand.nextInt();
            hashB[i] = rand.nextInt();
        }
    }

    int hash(int item, int i) {
        return Math.abs((hashA[i] * item + hashB[i]) % width);
    }

    void add(int item) {
        for (int i = 0; i < depth; i++) {
            table[i][hash(item, i)]++;
        }
    }

    int estimate(int item) {
        int min = Integer.MAX_VALUE;
        for (int i = 0; i < depth; i++) {
            min = Math.min(min, table[i][hash(item, i)]);
        }
        return min;  // Never underestimates, may overestimate
    }
}
// Used in: Network monitoring, database query optimization, trending detection
// Memory: O(1/ε * log(1/δ)) regardless of stream size!
```

│ │
│ │
│ HYPERLOGLOG (Cardinality estimation): │
│ ────────────────────────────────────── │

```java
class HyperLogLog {
    int[] registers;
    int m;  // Number of registers
    double alphaMM;

    HyperLogLog(int b) {  // b = log2(m)
        this.m = 1 << b;
        this.registers = new int[m];

        // Bias correction constant
        switch(m) {
            case 16: alphaMM = 0.673 * m * m; break;
            case 32: alphaMM = 0.697 * m * m; break;
            case 64: alphaMM = 0.709 * m * m; break;
            default: alphaMM = 0.7213 / (1 + 1.079/m) * m * m;
        }
    }

    void add(Object item) {
        long hash = hash64(item);
        int idx = (int) (hash >>> (64 - Integer.numberOfTrailingZeros(m)));
        int remaining = (int) (hash << Integer.numberOfTrailingZeros(m));
        int rank = Long.numberOfLeadingZeros(remaining) + 1;
        registers[idx] = Math.max(registers[idx], rank);
    }

    long estimate() {
        double sum = 0;
        int zeros = 0;

        for (int val : registers) {
            sum += Math.pow(2, -val);
            if (val == 0) zeros++;
        }

        double estimate = alphaMM / sum;

        // Small range correction
        if (estimate <= 2.5 * m && zeros > 0) {
            estimate = m * Math.log((double)m / zeros);
        }

        return Math.round(estimate);
    }
}
// Used in: Database COUNT(DISTINCT), unique visitor counting
// Memory: O(log log n) for counting up to n distinct elements!
// Error: ~1.04/√m standard error (m=2048 gives ~2% error)
```

│ │
│ │
│ CUCKOO FILTER (Better than Bloom filter): │
│ ────────────────────────────────────────── │

```java
class CuckooFilter {
    int[][] buckets;      // [bucket][slot]
    int bucketSize = 4;   // Slots per bucket
    int numBuckets;
    int fingerprintBits = 8;

    CuckooFilter(int capacity) {
        numBuckets = capacity / bucketSize;
        buckets = new int[numBuckets][bucketSize];
    }

    int fingerprint(int item) {
        return (hash(item) & ((1 << fingerprintBits) - 1)) | 1;  // Never 0
    }

    int bucket1(int item) {
        return hash(item) % numBuckets;
    }

    int bucket2(int b1, int fp) {
        return (b1 ^ hash(fp)) % numBuckets;  // XOR gives alternate bucket
    }

    boolean insert(int item) {
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);

        // Try to insert in either bucket
        if (insertToBucket(b1, fp)) return true;
        if (insertToBucket(b2, fp)) return true;

        // Cuckoo displacement
        int bucket = (Math.random() < 0.5) ? b1 : b2;
        for (int i = 0; i < 500; i++) {  // Max kicks
            // Pick random slot and swap
            int slot = (int)(Math.random() * bucketSize);
            int temp = buckets[bucket][slot];
            buckets[bucket][slot] = fp;
            fp = temp;

            bucket = bucket2(bucket, fp);
            if (insertToBucket(bucket, fp)) return true;
        }
        return false;  // Filter is full
    }

    boolean contains(int item) {
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);
        return bucketContains(b1, fp) || bucketContains(b2, fp);
    }

    boolean delete(int item) {  // BLOOM FILTER CAN'T DO THIS!
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);
        return deleteFromBucket(b1, fp) || deleteFromBucket(b2, fp);
    }
}
// Advantages over Bloom:
// • Supports deletion
// • Better locality (only 2 lookups vs k)
// • Similar space efficiency
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## INTERVIEW PATTERNS - ADVANCED LEVEL

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ADVANCED INTERVIEW PATTERNS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PATTERN 1: MONOTONIC STACK VARIATIONS │
│ ───────────────────────────────────────── │

```java
// Next Greater Element with circular array
int[] nextGreaterCircular(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    // Process array twice for circular behavior
    for (int i = 0; i < 2 * n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i % n]) {
            result[stack.pop()] = nums[i % n];
        }
        if (i < n) stack.push(i);
    }
    return result;
}

// Largest Rectangle in Histogram
int largestRectangle(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;

    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];

        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

│ │
│ │
│ PATTERN 2: SWEEP LINE ALGORITHM │
│ ──────────────────────────────── │

```java
// Count overlapping intervals at any point
int maxOverlap(int[][] intervals) {
    List<int[]> events = new ArrayList<>();

    for (int[] interval : intervals) {
        events.add(new int[]{interval[0], 1});   // Start
        events.add(new int[]{interval[1], -1});  // End
    }

    // Sort by time, ends before starts at same time
    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

    int current = 0, max = 0;
    for (int[] event : events) {
        current += event[1];
        max = Math.max(max, current);
    }
    return max;
}

// Skyline Problem
List<int[]> getSkyline(int[][] buildings) {
    List<int[]> events = new ArrayList<>();

    for (int[] b : buildings) {
        events.add(new int[]{b[0], -b[2]});  // Start: negative height
        events.add(new int[]{b[1], b[2]});   // End: positive height
    }

    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

    List<int[]> result = new ArrayList<>();
    TreeMap<Integer, Integer> heights = new TreeMap<>();  // height -> count
    heights.put(0, 1);
    int prevMax = 0;

    for (int[] e : events) {
        if (e[1] < 0) {  // Building start
            heights.merge(-e[1], 1, Integer::sum);
        } else {  // Building end
            heights.merge(e[1], -1, Integer::sum);
            if (heights.get(e[1]) == 0) heights.remove(e[1]);
        }

        int currMax = heights.lastKey();
        if (currMax != prevMax) {
            result.add(new int[]{e[0], currMax});
            prevMax = currMax;
        }
    }
    return result;
}
```

│ │
│ │
│ PATTERN 3: BINARY SEARCH ON ANSWER │
│ ────────────────────────────────────── │

```java
// Minimize maximum: Allocate books to students
int minMaxPages(int[] books, int students) {
    int lo = 0, hi = 0;
    for (int pages : books) {
        lo = Math.max(lo, pages);  // At least max single book
        hi += pages;               // At most all books
    }

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canAllocate(books, students, mid)) {
            hi = mid;  // Try smaller max
        } else {
            lo = mid + 1;  // Need larger max
        }
    }
    return lo;
}

boolean canAllocate(int[] books, int students, int maxPages) {
    int required = 1;
    int current = 0;

    for (int pages : books) {
        if (current + pages > maxPages) {
            required++;
            current = pages;
        } else {
            current += pages;
        }
    }
    return required <= students;
}

// Similar pattern for:
// - Aggressive Cows (maximize minimum)
// - Split Array Largest Sum
// - Capacity To Ship Packages
```

│ │
│ │
│ PATTERN 4: MEET IN THE MIDDLE │
│ ───────────────────────────────── │

```java
// Subset sum with n up to 40 (too large for 2^n, but 2^20 is ok)
int closestSum(int[] nums, int target) {
    int n = nums.length;
    int half = n / 2;

    // Generate all subset sums for first half
    List<Integer> left = new ArrayList<>();
    for (int mask = 0; mask < (1 << half); mask++) {
        int sum = 0;
        for (int i = 0; i < half; i++) {
            if ((mask & (1 << i)) != 0) sum += nums[i];
        }
        left.add(sum);
    }
    Collections.sort(left);

    // For each subset of second half, binary search in first half
    int closest = Integer.MAX_VALUE;
    for (int mask = 0; mask < (1 << (n - half)); mask++) {
        int sum = 0;
        for (int i = 0; i < n - half; i++) {
            if ((mask & (1 << i)) != 0) sum += nums[half + i];
        }

        int need = target - sum;
        int idx = Collections.binarySearch(left, need);
        if (idx < 0) idx = -(idx + 1);

        if (idx < left.size()) {
            closest = Math.min(closest, Math.abs(target - (sum + left.get(idx))));
        }
        if (idx > 0) {
            closest = Math.min(closest, Math.abs(target - (sum + left.get(idx - 1))));
        }
    }
    return closest;
}
// Time: O(2^(n/2) * log(2^(n/2))) = O(n * 2^(n/2))
// vs naive O(2^n)
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## COMPLETE DSA MASTERY CHECKLIST

```

╔══════════════════════════════════════════════════════════════════════════════════╗
║ DSA MASTERY CHECKLIST ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ ║
║ FUNDAMENTALS (Must master completely): ║
║ □ Arrays: Access, insertion, deletion, resizing ║
║ □ Strings: Manipulation, comparison, pattern matching basics ║
║ □ Linked Lists: Singly, doubly, circular, operations ║
║ □ Stacks: Implementation, applications (parentheses, monotonic) ║
║ □ Queues: Regular, circular, deque, priority queue ║
║ □ Hash Tables: Collision handling, load factor, rehashing ║
║ □ Binary Trees: Traversals, BST operations, balancing concepts ║
║ □ Heaps: Build, insert, extract, heapify ║
║ □ Graphs: Representations, BFS, DFS, connectivity ║
║ ║
║ INTERMEDIATE (Should be comfortable): ║
║ □ Sorting: Merge, Quick, Heap, Counting, Radix ║
║ □ Searching: Binary search and variations ║
║ □ Recursion: Base case, state, backtracking ║
║ □ Dynamic Programming: 1D, 2D, state transitions ║
║ □ Graph Algorithms: Dijkstra, Bellman-Ford, Topological sort ║
║ □ Tree Algorithms: LCA, diameter, tree DP basics ║
║ □ Two Pointers: Same direction, opposite direction ║
║ □ Sliding Window: Fixed size, variable size ║
║ ║
║ ADVANCED (Know concepts and when to apply): ║
║ □ Segment Trees: Range queries and updates ║
║ □ Fenwick Trees: Prefix sums, point updates ║
║ □ Union-Find: Path compression, union by rank ║
║ □ Tries: String operations, prefix matching ║
║ □ AVL/Red-Black: Self-balancing concepts ║
║ □ String Algorithms: KMP, Z-algorithm, Rabin-Karp ║
║ □ Graph Advanced: MST, SCC, articulation points ║
║ □ DP Optimization: Bitmask, interval, divide and conquer ║
║ ║
║ EXPERT (For competitive programming): ║
║ □ Suffix Arrays/Trees ║
║ □ Heavy-Light Decomposition ║
║ □ Centroid Decomposition ║
║ □ Persistent Data Structures ║
║ □ Convex Hull Trick ║
║ □ FFT for polynomial multiplication ║
║ □ Network Flow algorithms ║
║ ║
║ PRACTICAL KNOWLEDGE (For interviews): ║
║ □ Complexity analysis (time and space) ║
║ □ Trade-off discussions ║
║ □ Code optimization techniques ║
║ □ Testing and edge cases ║
║ □ Communication and problem-solving approach ║
║ ║
╚══════════════════════════════════════════════════════════════════════════════════╝

```

---

# 🔧 PART FINAL-B: COMPLETE JVM INTERNALS FOR JAVA DEVELOPERS

```

╔══════════════════════════════════════════════════════════════════════════════════╗
║ JVM INTERNALS - THE COMPLETE GUIDE FOR BUILDING FRAMEWORKS ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ ║
║ Why JVM knowledge matters: ║
║ • Understand WHY your code performs the way it does ║
║ • Debug memory issues (leaks, OOM errors) ║
║ • Build frameworks like Spring, Hibernate, Mockito ║
║ • Optimize applications for production ║
║ • Ace senior-level Java interviews ║
║ ║
╚══════════════════════════════════════════════════════════════════════════════════╝

```

---

## JVM ARCHITECTURE - THE COMPLETE PICTURE

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ JVM ARCHITECTURE OVERVIEW │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ JAVA SOURCE CODE (.java) │ │
│ └────────────────────────────────┬─────────────────────────────────────────┘ │
│ │ javac (Java Compiler) │
│ ▼ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ BYTECODE (.class files) │ │
│ │ Platform-independent intermediate code │ │
│ └────────────────────────────────┬─────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ╔══════════════════════════════════════════════════════════════════════════╗ │
│ ║ JAVA VIRTUAL MACHINE (JVM) ║ │
│ ╠══════════════════════════════════════════════════════════════════════════╣ │
│ ║ ║ │
│ ║ ┌────────────────────────────────────────────────────────────────────┐ ║ │
│ ║ │ CLASS LOADER SUBSYSTEM │ ║ │
│ ║ │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐ │ ║ │
│ ║ │ │ Bootstrap │→│ Extension │→│Application │→│ Custom Loaders │ │ ║ │
│ ║ │ │ Loader │ │ Loader │ │ Loader │ │ (User-defined) │ │ ║ │
│ ║ │ └────────────┘ └────────────┘ └────────────┘ └────────────────┘ │ ║ │
│ ║ │ │ ║ │
│ ║ │ Loading → Linking (Verify/Prepare/Resolve) → Initialization │ ║ │
│ ║ └────────────────────────────────────────────────────────────────────┘ ║ │
│ ║ │ ║ │
│ ║ ▼ ║ │
│ ║ ┌────────────────────────────────────────────────────────────────────┐ ║ │
│ ║ │ RUNTIME DATA AREAS │ ║ │
│ ║ │ │ ║ │
│ ║ │ ┌─────────────────────────────────────────────────────────────┐ │ ║ │
│ ║ │ │ SHARED AMONG ALL THREADS │ │ ║ │
│ ║ │ │ ┌─────────────────────────┐ ┌──────────────────────────┐ │ │ ║ │
│ ║ │ │ │ HEAP │ │ METASPACE │ │ │ ║ │
│ ║ │ │ │ ┌──────────────────┐ │ │ • Class metadata │ │ │ ║ │
│ ║ │ │ │ │ Young Generation │ │ │ • Method bytecode │ │ │ ║ │
│ ║ │ │ │ │ ┌─────┐ ┌────┐ │ │ │ • Constant pool │ │ │ ║ │
│ ║ │ │ │ │ │Eden │ │S0/1│ │ │ │ • Field/Method info │ │ │ ║ │
│ ║ │ │ │ │ └─────┘ └────┘ │ │ │ │ │ │ ║ │
│ ║ │ │ │ ├──────────────────┤ │ │ (Native memory, not │ │ │ ║ │
│ ║ │ │ │ │ Old Generation │ │ │ part of heap!) │ │ │ ║ │
│ ║ │ │ │ │ (Tenured) │ │ │ │ │ │ ║ │
│ ║ │ │ │ └──────────────────┘ │ └──────────────────────────┘ │ │ ║ │
│ ║ │ │ └─────────────────────────┘ │ │ ║ │
│ ║ │ └─────────────────────────────────────────────────────────────┘ │ ║ │
│ ║ │ │ ║ │
│ ║ │ ┌─────────────────────────────────────────────────────────────┐ │ ║ │
│ ║ │ │ PER-THREAD DATA AREAS │ │ ║ │
│ ║ │ │ ┌───────────────┐ ┌───────────────┐ ┌────────────────┐ │ │ ║ │
│ ║ │ │ │ JVM STACK │ │ PC REGISTER │ │ NATIVE METHOD │ │ │ ║ │
│ ║ │ │ │ • Frames │ │ • Current │ │ STACK │ │ │ ║ │
│ ║ │ │ │ • Local vars │ │ instruction │ │ • For native │ │ │ ║ │
│ ║ │ │ │ • Operand │ │ address │ │ (C/C++) code │ │ │ ║ │
│ ║ │ │ │ stack │ │ │ │ │ │ │ ║ │
│ ║ │ │ └───────────────┘ └───────────────┘ └────────────────┘ │ │ ║ │
│ ║ │ └─────────────────────────────────────────────────────────────┘ │ ║ │
│ ║ └────────────────────────────────────────────────────────────────────┘ ║ │
│ ║ │ ║ │
│ ║ ▼ ║ │
│ ║ ┌────────────────────────────────────────────────────────────────────┐ ║ │
│ ║ │ EXECUTION ENGINE │ ║ │
│ ║ │ ┌────────────┐ ┌────────────────┐ ┌───────────────────────────┐ │ ║ │
│ ║ │ │Interpreter │ │ JIT Compiler │ │ Garbage Collector │ │ ║ │
│ ║ │ │ │ │ ┌───────────┐ │ │ • Serial / Parallel │ │ ║ │
│ ║ │ │ Line by │ │ │ C1 (Client)│ │ │ • CMS / G1 / ZGC / Shen. │ │ ║ │
│ ║ │ │ line exec │ │ │ C2 (Server)│ │ │ │ │ ║ │
│ ║ │ │ │ │ └───────────┘ │ │ Automatic memory mgmt │ │ ║ │
│ ║ │ └────────────┘ └────────────────┘ └───────────────────────────┘ │ ║ │
│ ║ └────────────────────────────────────────────────────────────────────┘ ║ │
│ ║ │ ║ │
│ ║ ┌────────────────────────────────────────────────────────────────────┐ ║ │
│ ║ │ JAVA NATIVE INTERFACE (JNI) │ ║ │
│ ║ │ Connects JVM to native libraries (C/C++) │ ║ │
│ ║ └────────────────────────────────────────────────────────────────────┘ ║ │
│ ╚══════════════════════════════════════════════════════════════════════════╝ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ OPERATING SYSTEM / HARDWARE │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

---

## CLASS LOADER SUBSYSTEM - DEEP DIVE

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ CLASS LOADING MECHANISM │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ THE THREE PHASES OF CLASS LOADING: │
│ ══════════════════════════════════ │
│ │
│ 1. LOADING │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ • Read .class file binary data ││
│ │ • Create java.lang.Class object in Metaspace ││
│ │ • Store class metadata (fields, methods, interfaces) ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ 2. LINKING (Three Sub-phases) │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ a) VERIFICATION: ││
│ │ • Check bytecode validity (magic number 0xCAFEBABE) ││
│ │ • Verify bytecode instructions are safe ││
│ │ • Check class file structure ││
│ │ • Ensure type safety ││
│ │ ││
│ │ b) PREPARATION: ││
│ │ • Allocate memory for static variables ││
│ │ • Initialize static fields to DEFAULT values (not assigned values!) ││
│ │ • static int x = 10; → x = 0 (not 10 yet!) ││
│ │ ││
│ │ c) RESOLUTION: ││
│ │ • Replace symbolic references with direct references ││
│ │ • Class names → actual Class objects ││
│ │ • Field/Method references → memory addresses ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ 3. INITIALIZATION │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ • Execute static initializers and static blocks ││
│ │ • Assign actual values to static variables ││
│ │ • static int x = 10; → x = 10 (NOW it's 10!) ││
│ │ • Run static { } blocks in order of appearance ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ │
│ CLASS LOADER HIERARCHY (Parent Delegation Model): │
│ ═══════════════════════════════════════════════ │
│ │
│ ┌─────────────────────────────┐ │
│ │ Bootstrap ClassLoader │ ← Written in C/C++ │
│ │ (Primordial ClassLoader) │ Loads: rt.jar, core │
│ │ java.lang._, java.util._ │ Java classes │
│ └─────────────┬───────────────┘ │
│ │ parent │
│ ▼ │
│ ┌─────────────────────────────┐ │
│ │ Platform/Extension Loader │ ← Java 9+: Platform │
│ │ (ExtClassLoader in Java 8) │ Loads: jre/lib/ext │
│ │ javax._, java.sql._, etc. │ │
│ └─────────────┬───────────────┘ │
│ │ parent │
│ ▼ │
│ ┌─────────────────────────────┐ │
│ │ Application ClassLoader │ ← Also: System ClassLoader │
│ │ (AppClassLoader) │ Loads: classpath │
│ │ Your application classes │ -cp, CLASSPATH │
│ └─────────────┬───────────────┘ │
│ │ parent │
│ ▼ │
│ ┌─────────────────────────────┐ │
│ │ Custom ClassLoaders │ ← Your own loaders │
│ │ (User-defined) │ For frameworks, │
│ │ │ plugins, hot reload │
│ └─────────────────────────────┘ │
│ │
│ │
│ PARENT DELEGATION ALGORITHM: │
│ ═══════════════════════════════ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

````

```java
// How loadClass() works (simplified)
protected Class<?> loadClass(String name, boolean resolve) {
    synchronized (getClassLoadingLock(name)) {
        // 1. Check if already loaded
        Class<?> c = findLoadedClass(name);

        if (c == null) {
            // 2. Delegate to parent FIRST (Parent Delegation!)
            try {
                if (parent != null) {
                    c = parent.loadClass(name, false);  // Ask parent
                } else {
                    c = findBootstrapClassOrNull(name); // Bootstrap
                }
            } catch (ClassNotFoundException e) {
                // Parent couldn't load - that's OK
            }

            // 3. Only if parent fails, try to load ourselves
            if (c == null) {
                c = findClass(name);  // Our own loading logic
            }
        }

        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
````

**WHY PARENT DELEGATION?**

- **Security**: Prevents malicious java.lang.String replacement
- **Consistency**: Same class loaded once, same Class object everywhere
- **Avoids duplicates**: Core classes loaded only by Bootstrap

---

## CREATING CUSTOM CLASS LOADERS

```java
/**
 * Custom ClassLoader for hot-reloading classes during development
 */
public class HotReloadClassLoader extends ClassLoader {

    private String classPath;
    private Map<String, Long> classLastModified = new HashMap<>();

    public HotReloadClassLoader(String classPath, ClassLoader parent) {
        super(parent);
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // Convert class name to file path
        String fileName = name.replace('.', '/') + ".class";
        Path classFile = Paths.get(classPath, fileName);

        try {
            // Read class bytes from file
            byte[] classBytes = Files.readAllBytes(classFile);

            // Track modification time for hot reload detection
            classLastModified.put(name, Files.getLastModifiedTime(classFile).toMillis());

            // defineClass converts bytes to Class object
            return defineClass(name, classBytes, 0, classBytes.length);

        } catch (IOException e) {
            throw new ClassNotFoundException("Could not load " + name, e);
        }
    }

    /**
     * Check if class has been modified since last load
     */
    public boolean isModified(String className) {
        String fileName = className.replace('.', '/') + ".class";
        Path classFile = Paths.get(classPath, fileName);

        try {
            long currentModified = Files.getLastModifiedTime(classFile).toMillis();
            Long lastLoaded = classLastModified.get(className);
            return lastLoaded == null || currentModified > lastLoaded;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Reload a class if modified (requires new ClassLoader instance!)
     */
    public static Class<?> reloadClass(String className, String classPath)
            throws ClassNotFoundException {
        // IMPORTANT: Can't unload classes! Must create NEW ClassLoader
        HotReloadClassLoader newLoader = new HotReloadClassLoader(
            classPath,
            HotReloadClassLoader.class.getClassLoader()
        );
        return newLoader.loadClass(className);
    }
}
```

**USE CASES FOR CUSTOM CLASS LOADERS:**

- Hot code reloading (development servers like Tomcat)
- Plugin systems (IDE plugins, Minecraft mods)
- Bytecode manipulation (AspectJ, Mockito)
- Loading classes from network/database
- Application isolation (multi-tenant systems)
- Encryption/decryption of class files

---

## JVM MEMORY MODEL - COMPLETE DEEP DIVE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JVM MEMORY AREAS - DETAILED BREAKDOWN                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         JVM PROCESS MEMORY                               │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    HEAP (Managed by GC)                         │    │  │
│  │  │                    -Xms (initial), -Xmx (max)                   │    │  │
│  │  │                                                                 │    │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐ │    │  │
│  │  │  │              YOUNG GENERATION (-Xmn)                      │ │    │  │
│  │  │  │  ┌─────────────────────┬─────────────┬─────────────┐     │ │    │  │
│  │  │  │  │        EDEN         │ Survivor 0  │ Survivor 1  │     │ │    │  │
│  │  │  │  │   (New objects)     │    (S0)     │    (S1)     │     │ │    │  │
│  │  │  │  │                     │  (From)     │   (To)      │     │ │    │  │
│  │  │  │  │   ~80% of Young     │   ~10%      │   ~10%      │     │ │    │  │
│  │  │  │  └─────────────────────┴─────────────┴─────────────┘     │ │    │  │
│  │  │  │  Minor GC happens here frequently                        │ │    │  │
│  │  │  └───────────────────────────────────────────────────────────┘ │    │  │
│  │  │                              │                                  │    │  │
│  │  │                              │ Objects surviving multiple       │    │  │
│  │  │                              │ Minor GCs get promoted           │    │  │
│  │  │                              ▼                                  │    │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐ │    │  │
│  │  │  │              OLD GENERATION (Tenured)                     │ │    │  │
│  │  │  │                                                           │ │    │  │
│  │  │  │    Long-lived objects                                     │ │    │  │
│  │  │  │    Major GC (Full GC) - expensive, stop-the-world        │ │    │  │
│  │  │  │                                                           │ │    │  │
│  │  │  └───────────────────────────────────────────────────────────┘ │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    METASPACE (Native Memory)                    │    │  │
│  │  │                    -XX:MetaspaceSize, -XX:MaxMetaspaceSize      │    │  │
│  │  │                                                                 │    │  │
│  │  │  • Class metadata (java.lang.Class objects)                    │    │  │
│  │  │  • Method bytecode                                              │    │  │
│  │  │  • Constant pools                                               │    │  │
│  │  │  • Annotations                                                  │    │  │
│  │  │  • REPLACED PermGen in Java 8                                  │    │  │
│  │  │  • Can grow dynamically (unlike PermGen)                       │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    CODE CACHE (Native Memory)                   │    │  │
│  │  │                    -XX:ReservedCodeCacheSize                    │    │  │
│  │  │                                                                 │    │  │
│  │  │  • JIT-compiled native code                                    │    │  │
│  │  │  • Hot methods compiled to machine code                        │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │              THREAD STACKS (Per Thread, Native Memory)          │    │  │
│  │  │              -Xss (stack size per thread)                       │    │  │
│  │  │                                                                 │    │  │
│  │  │  Thread 1 Stack    Thread 2 Stack    Thread N Stack            │    │  │
│  │  │  ┌───────────┐    ┌───────────┐     ┌───────────┐             │    │  │
│  │  │  │ Frame N   │    │ Frame M   │     │ Frame K   │             │    │  │
│  │  │  │ Frame N-1 │    │ Frame M-1 │     │ Frame K-1 │             │    │  │
│  │  │  │ ...       │    │ ...       │     │ ...       │             │    │  │
│  │  │  │ Frame 0   │    │ Frame 0   │     │ Frame 0   │             │    │  │
│  │  │  └───────────┘    └───────────┘     └───────────┘             │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │              DIRECT MEMORY (Off-Heap, Native Memory)            │    │  │
│  │  │              -XX:MaxDirectMemorySize                            │    │  │
│  │  │                                                                 │    │  │
│  │  │  • ByteBuffer.allocateDirect()                                 │    │  │
│  │  │  • Used by NIO for zero-copy I/O                               │    │  │
│  │  │  • Not managed by GC directly                                  │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## STACK FRAME STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STACK FRAME LAYOUT                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  High Address                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PREVIOUS FRAME                                        │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                    RETURN ADDRESS                                        │   │
│  │                    (where to continue after return)                      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                    FRAME POINTER (FP)                                    │   │
│  │                    (points to caller's frame)                            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                    LOCAL VARIABLES ARRAY                                 │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Slot 0: this (for instance methods)                               │  │   │
│  │  │ Slot 1: param1                                                    │  │   │
│  │  │ Slot 2: param2                                                    │  │   │
│  │  │ Slot 3: local var 1                                               │  │   │
│  │  │ Slot 4: local var 2                                               │  │   │
│  │  │ ...                                                               │  │   │
│  │  │ long/double occupy 2 slots (8 bytes)                              │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                    OPERAND STACK                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Used for: arithmetic, method params, return values                │  │   │
│  │  │                                                                   │  │   │
│  │  │ Example: int c = a + b;                                           │  │   │
│  │  │   iload_1  // push a → stack: [a]                                │  │   │
│  │  │   iload_2  // push b → stack: [a, b]                             │  │   │
│  │  │   iadd     // pop a,b, push a+b → stack: [a+b]                   │  │   │
│  │  │   istore_3 // pop to local var 3 → stack: []                     │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                    FRAME DATA                                            │   │
│  │  • Constant pool reference                                              │   │
│  │  • Exception table reference                                            │   │
│  │  • Method reference                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Low Address (Stack Pointer)                                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// EXAMPLE: How this code maps to stack frame
public int calculate(int a, int b) {
    int sum = a + b;        // sum in local var slot 3
    int product = a * b;    // product in local var slot 4
    return sum + product;
}

// LOCAL VARIABLES ARRAY:
// Slot 0: this (reference to object)
// Slot 1: a (int parameter)
// Slot 2: b (int parameter)
// Slot 3: sum (local int)
// Slot 4: product (local int)

// BYTECODE:
// 0: iload_1         // push a
// 1: iload_2         // push b
// 2: iadd            // add
// 3: istore_3        // store in sum
// 4: iload_1         // push a
// 5: iload_2         // push b
// 6: imul            // multiply
// 7: istore 4        // store in product
// 9: iload_3         // push sum
// 10: iload 4        // push product
// 12: iadd           // add
// 13: ireturn        // return
```

---

## GARBAGE COLLECTION - COMPLETE GUIDE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GARBAGE COLLECTION FUNDAMENTALS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  REACHABILITY ANALYSIS (Mark and Sweep):                                        │
│                                                                                  │
│  GC ROOTS (Starting points for reachability):                                   │
│  • Local variables on thread stacks                                             │
│  • Static variables in loaded classes                                           │
│  • JNI references                                                               │
│  • Active threads themselves                                                    │
│  • Objects waiting in synchronization monitors                                  │
│                                                                                  │
│           GC Roots                                                              │
│         ┌────┬────┬────┐                                                       │
│         │ R1 │ R2 │ R3 │                                                       │
│         └─┬──┴─┬──┴──┬─┘                                                       │
│           │    │     │                                                          │
│           ▼    │     ▼                                                          │
│         ┌──┐   │   ┌──┐                                                        │
│         │A │   │   │B │  ← REACHABLE (will NOT be collected)                   │
│         └┬─┘   │   └┬─┘                                                        │
│          │     │    │                                                           │
│          ▼     ▼    ▼                                                           │
│        ┌──┐  ┌──┐  ┌──┐                                                        │
│        │C │  │D │  │E │  ← REACHABLE                                           │
│        └──┘  └──┘  └──┘                                                        │
│                                                                                  │
│        ┌──┐      ┌──┐                                                          │
│        │X │ ───► │Y │  ← UNREACHABLE (will be collected!)                      │
│        └──┘      └──┘    No path from any GC root                              │
│          ▲         │                                                            │
│          └─────────┘  (even circular references get collected!)                │
│                                                                                  │
│                                                                                  │
│  GENERATIONAL HYPOTHESIS:                                                       │
│  "Most objects die young" - typically 80-95% of objects are short-lived        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## GC ALGORITHMS COMPARISON

| GC Algorithm                          | Best For                            | Pause Time       | Throughput | Memory |
| ------------------------------------- | ----------------------------------- | ---------------- | ---------- | ------ |
| **Serial GC** `-XX:+UseSerialGC`      | Small apps, Single CPU              | Long (STW)       | Good       | Low    |
| **Parallel GC** `-XX:+UseParallelGC`  | Batch apps, Throughput              | Medium (STW)     | Best       | Medium |
| **G1 GC** `-XX:+UseG1GC` (Default)    | Large heaps, Balanced               | Low, Predictable | Good       | Medium |
| **ZGC** `-XX:+UseZGC`                 | Ultra-low latency, Very large heaps | <10ms Concurrent | Good       | High   |
| **Shenandoah** `-XX:+UseShenandoahGC` | Ultra-low latency                   | <10ms Concurrent | Good       | High   |

```java
// GC MONITORING IN CODE:
public static void monitorGC() {
    List<GarbageCollectorMXBean> gcBeans =
        ManagementFactory.getGarbageCollectorMXBeans();

    for (GarbageCollectorMXBean gc : gcBeans) {
        System.out.println("GC Name: " + gc.getName());
        System.out.println("Collection Count: " + gc.getCollectionCount());
        System.out.println("Collection Time: " + gc.getCollectionTime() + " ms");
    }
}

// GET MEMORY USAGE:
public static void memoryInfo() {
    MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
    MemoryUsage heap = memory.getHeapMemoryUsage();

    System.out.println("Heap Init: " + heap.getInit() / 1024 / 1024 + " MB");
    System.out.println("Heap Used: " + heap.getUsed() / 1024 / 1024 + " MB");
    System.out.println("Heap Max: " + heap.getMax() / 1024 / 1024 + " MB");
}
```

---

## JIT COMPILATION - DEEP DIVE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JUST-IN-TIME (JIT) COMPILATION                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TIERED COMPILATION (Default in modern JVM):                                    │
│                                                                                  │
│  Level 0: Interpreter                                                           │
│      │    (All code starts here)                                                │
│      │                                                                          │
│      │    Method invocation count > 2000                                        │
│      ▼                                                                          │
│  Level 1-3: C1 Compiler (Client)                                                │
│      │    • Quick compilation                                                   │
│      │    • Basic optimizations                                                 │
│      │    • Collects profiling data                                             │
│      │                                                                          │
│      │    Method invocation count > 15000                                       │
│      ▼    (and profiling shows it's worth it)                                   │
│  Level 4: C2 Compiler (Server)                                                  │
│           • Aggressive optimizations                                            │
│           • Loop unrolling, escape analysis                                     │
│           • Method inlining, dead code elimination                              │
│           • Takes longer but produces fastest code                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**JIT OPTIMIZATIONS:**

```java
// 1. METHOD INLINING:
// Before inlining:                     // After inlining:
int result = helper(x);                 int result = x * 2 + 1;
                                        // No method call overhead!
int helper(int n) {
    return n * 2 + 1;
}

// 2. ESCAPE ANALYSIS:
// Object doesn't escape method → can be stack allocated!
public int sum() {
    Point p = new Point(1, 2);  // JIT may allocate on STACK, not heap!
    return p.x + p.y;           // No GC needed for this object!
}

// Object DOES escape → must be heap allocated
public Point getPoint() {
    Point p = new Point(1, 2);  // Escapes! Must be on heap
    return p;
}

// 3. LOOP UNROLLING:
// Before:                              // After:
for (int i = 0; i < 4; i++) {          sum += arr[0];
    sum += arr[i];                      sum += arr[1];
}                                       sum += arr[2];
                                        sum += arr[3];
                                        // No loop overhead!
```

---

## INTERNAL CLASSES - THE HIDDEN POWER

### REFLECTION API (`java.lang.reflect.*`)

```java
public class ReflectionDeepDive {

    // GET CLASS INFORMATION
    public static void inspectClass(Object obj) throws Exception {
        Class<?> clazz = obj.getClass();

        System.out.println("Class Name: " + clazz.getName());
        System.out.println("Simple Name: " + clazz.getSimpleName());
        System.out.println("Superclass: " + clazz.getSuperclass());

        // Get ALL fields (including private)
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);  // Bypass access control!
            System.out.println(field.getName() + " = " + field.get(obj));
        }

        // Get ALL methods
        for (Method method : clazz.getDeclaredMethods()) {
            System.out.println(method.getName() + "(" +
                Arrays.stream(method.getParameterTypes())
                      .map(Class::getSimpleName)
                      .collect(Collectors.joining(", ")) + ")");
        }
    }

    // CREATE INSTANCE DYNAMICALLY
    @SuppressWarnings("unchecked")
    public static <T> T createInstance(Class<T> clazz, Object... args) throws Exception {
        Class<?>[] paramTypes = Arrays.stream(args)
                                      .map(Object::getClass)
                                      .toArray(Class[]::new);

        Constructor<T> ctor = clazz.getDeclaredConstructor(paramTypes);
        ctor.setAccessible(true);
        return ctor.newInstance(args);
    }

    // INVOKE METHOD DYNAMICALLY
    public static Object invokeMethod(Object target, String methodName, Object... args)
            throws Exception {
        Class<?>[] paramTypes = Arrays.stream(args)
                                      .map(Object::getClass)
                                      .toArray(Class[]::new);

        Method method = target.getClass().getDeclaredMethod(methodName, paramTypes);
        method.setAccessible(true);
        return method.invoke(target, args);
    }
}
```

### DYNAMIC PROXY (`java.lang.reflect.Proxy`)

```java
// LOGGING PROXY - Add logging to ANY interface
public class LoggingProxy implements InvocationHandler {
    private final Object target;

    private LoggingProxy(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // BEFORE method
        System.out.println("→ Calling: " + method.getName());
        long start = System.nanoTime();

        try {
            // ACTUAL method call
            Object result = method.invoke(target, args);

            // AFTER method (success)
            long elapsed = System.nanoTime() - start;
            System.out.println("← Returned: " + result + " in " + elapsed/1_000_000 + "ms");
            return result;

        } catch (InvocationTargetException e) {
            System.out.println("✗ Exception: " + e.getCause());
            throw e.getCause();
        }
    }

    // Factory method
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target, Class<T> interfaceType) {
        return (T) Proxy.newProxyInstance(
            interfaceType.getClassLoader(),
            new Class<?>[] { interfaceType },
            new LoggingProxy(target)
        );
    }
}

// USAGE:
UserService realService = new UserServiceImpl();
UserService proxied = LoggingProxy.createProxy(realService, UserService.class);
proxied.findUser(123);
// Output:
// → Calling: findUser
// ← Returned: User{id=123} in 5ms
```

### METHOD HANDLES (Java 7+, Faster than Reflection)

```java
public class MethodHandlesDemo {

    public static void main(String[] args) throws Throwable {
        MethodHandles.Lookup lookup = MethodHandles.lookup();

        // Get a method handle for String.length()
        MethodHandle lengthHandle = lookup.findVirtual(
            String.class,                    // Class
            "length",                        // Method name
            MethodType.methodType(int.class) // Return type
        );

        // Invoke the method
        int len = (int) lengthHandle.invoke("Hello");  // 5
    }
}
```

### VARHANDLES (Java 9+, Atomic Operations)

```java
public class VarHandlesDemo {
    private int counter = 0;

    private static final VarHandle COUNTER;
    static {
        try {
            COUNTER = MethodHandles.lookup()
                .findVarHandle(VarHandlesDemo.class, "counter", int.class);
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    public void increment() {
        // Atomic increment without AtomicInteger!
        COUNTER.getAndAdd(this, 1);
    }

    public boolean compareAndSet(int expected, int newValue) {
        return COUNTER.compareAndSet(this, expected, newValue);
    }
}
```

---

## BUILDING A MINI-FRAMEWORK

```java
// ═══════════════════════════════════════════════════════════════════════════════
// MINI SPRING-LIKE DEPENDENCY INJECTION FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════════

// ANNOTATIONS
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Component {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Autowired {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Transactional {}

// MINI DI CONTAINER
public class MiniSpringContext {

    private Map<Class<?>, Object> beans = new ConcurrentHashMap<>();

    public MiniSpringContext(String basePackage) throws Exception {
        // 1. COMPONENT SCANNING - Find all annotated classes
        Set<Class<?>> componentClasses = scanComponents(basePackage);

        // 2. INSTANTIATION - Create bean instances
        for (Class<?> clazz : componentClasses) {
            Object instance = clazz.getDeclaredConstructor().newInstance();
            beans.put(clazz, instance);
        }

        // 3. DEPENDENCY INJECTION - Wire beans together
        for (Object bean : beans.values()) {
            injectDependencies(bean);
        }

        System.out.println("🚀 Context initialized with " + beans.size() + " beans");
    }

    private void injectDependencies(Object bean) throws Exception {
        for (Field field : bean.getClass().getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                field.setAccessible(true);
                Object dependency = beans.get(field.getType());

                if (dependency == null) {
                    throw new RuntimeException("No bean found for: " + field.getType());
                }

                field.set(bean, dependency);
            }
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T getBean(Class<T> type) {
        return (T) beans.get(type);
    }
}

// USAGE:
@Component
class UserRepository {
    public User findById(int id) { return new User(id, "John"); }
}

@Component
class UserService {
    @Autowired
    private UserRepository repository;  // Auto-injected!

    public User getUser(int id) {
        return repository.findById(id);
    }
}

// BOOTSTRAP:
MiniSpringContext context = new MiniSpringContext("com.myapp");
UserService service = context.getBean(UserService.class);
User user = service.getUser(123);
```

---

## JVM TUNING CHEAT SHEET

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JVM TUNING QUICK REFERENCE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MEMORY SETTINGS:                                                               │
│  -Xms<size>        Initial heap size           -Xms2g                          │
│  -Xmx<size>        Maximum heap size           -Xmx8g                          │
│  -Xmn<size>        Young generation size       -Xmn2g                          │
│  -Xss<size>        Thread stack size           -Xss512k                        │
│  -XX:MetaspaceSize=<size>                      -XX:MetaspaceSize=256m          │
│  -XX:MaxMetaspaceSize=<size>                   -XX:MaxMetaspaceSize=512m       │
│                                                                                  │
│  GC SELECTION:                                                                  │
│  -XX:+UseSerialGC           Serial (single-threaded)                           │
│  -XX:+UseParallelGC         Parallel (throughput-focused)                      │
│  -XX:+UseG1GC               G1 (balanced, default Java 9+)                     │
│  -XX:+UseZGC                ZGC (ultra-low latency, Java 15+)                  │
│  -XX:+UseShenandoahGC       Shenandoah (low latency)                          │
│                                                                                  │
│  G1 TUNING:                                                                     │
│  -XX:MaxGCPauseMillis=200        Target pause time (ms)                        │
│  -XX:G1HeapRegionSize=16m        Region size (1-32 MB)                         │
│                                                                                  │
│  MONITORING & DEBUGGING:                                                        │
│  -Xlog:gc*:file=gc.log         GC logging (Java 9+)                           │
│  -XX:+HeapDumpOnOutOfMemoryError    Dump heap on OOM                          │
│  -XX:HeapDumpPath=/path/dump.hprof  Heap dump location                        │
│  -XX:+PrintCompilation         JIT compilation events                          │
│                                                                                  │
│  COMMON PRODUCTION SETTINGS:                                                    │
│                                                                                  │
│  # Web Application (8GB RAM server)                                            │
│  java -Xms4g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \                   │
│       -XX:+HeapDumpOnOutOfMemoryError -Xlog:gc*:file=gc.log -jar app.jar      │
│                                                                                  │
│  # Batch Processing (High Throughput)                                          │
│  java -Xms8g -Xmx8g -XX:+UseParallelGC -XX:ParallelGCThreads=8 -jar app.jar   │
│                                                                                  │
│  # Low-Latency Trading System                                                  │
│  java -Xms16g -Xmx16g -XX:+UseZGC -XX:ConcGCThreads=4 -jar app.jar            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## JVM INTERNALS MASTERY CHECKLIST

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    JVM INTERNALS MASTERY CHECKLIST                               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║ CLASS LOADING:                                                                    ║
║ □ Understand Bootstrap → Platform → Application loader hierarchy                 ║
║ □ Know parent delegation model and why it exists                                 ║
║ □ Can implement custom ClassLoader for hot-reload/plugins                        ║
║ □ Understand Loading → Linking → Initialization phases                           ║
║                                                                                   ║
║ MEMORY MODEL:                                                                     ║
║ □ Know Heap structure: Eden, Survivor, Old Generation                            ║
║ □ Understand Metaspace (replaced PermGen in Java 8)                              ║
║ □ Know Stack Frame structure: locals, operand stack, frame data                  ║
║ □ Understand Direct Memory (off-heap) usage                                      ║
║                                                                                   ║
║ GARBAGE COLLECTION:                                                               ║
║ □ Know GC roots and reachability analysis                                        ║
║ □ Understand generational hypothesis                                              ║
║ □ Can choose appropriate GC for workload (G1, ZGC, etc.)                        ║
║ □ Can tune GC parameters for production                                          ║
║                                                                                   ║
║ JIT COMPILATION:                                                                  ║
║ □ Understand Interpreter → C1 → C2 tiered compilation                           ║
║ □ Know JIT optimizations: inlining, escape analysis, loop unrolling             ║
║ □ Understand deoptimization scenarios                                            ║
║                                                                                   ║
║ INTERNAL APIS:                                                                    ║
║ □ Master Reflection API for dynamic class inspection                            ║
║ □ Can create Dynamic Proxies for AOP/logging/caching                            ║
║ □ Understand MethodHandles as faster alternative to reflection                   ║
║ □ Know when Unsafe is used (AtomicXXX, DirectByteBuffer)                        ║
║                                                                                   ║
║ FRAMEWORK BUILDING:                                                               ║
║ □ Can implement Dependency Injection container                                   ║
║ □ Can implement Transaction management using proxies                             ║
║ □ Understand bytecode manipulation basics (ByteBuddy/ASM)                       ║
║ □ Can implement custom annotations with runtime processing                       ║
║                                                                                   ║
║ PRODUCTION SKILLS:                                                                ║
║ □ Can diagnose memory leaks using heap dumps                                     ║
║ □ Can analyze GC logs for performance issues                                     ║
║ □ Can tune JVM for specific workloads                                           ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

_"Understanding JVM internals separates junior developers from senior architects."_ 🔧

---

_"Data structures + Algorithms = Programs. Master both, master programming."_

```

```
