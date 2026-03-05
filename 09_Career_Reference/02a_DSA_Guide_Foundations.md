> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](02b_DSA_Guide_Advanced.md)

---

# 🏗️ Ultimate Data Structures & Algorithms Deep Guide

> **Framework**: WHY → HOW → WHAT → WHEN → PRACTICE → REAL-WORLD

---
> **Navigation**: [Part 1: Data Structures] | [Part 2: Advanced Algorithms](02b_Ultimate_DSA_Advanced.md) | [Part 3: JVM Internals](02c_Ultimate_DSA_JVM.md)

---


# 🔬 PART 0: DEEP INTERNALS - CPU AND MEMORY FUNDAMENTALS FOR DSA

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       THE HARDWARE REALITY - WHAT EVERY DSA LEARNER MUST KNOW                    ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  Why this matters: Big-O notation tells you scaling behavior, but                ║
║  HARDWARE determines actual performance. An O(n) algorithm can be                ║
║  faster or slower than O(log n) depending on hardware factors!                   ║
║                                                                                  ║
║  This section covers:                                                            ║
║  • CPU cache hierarchy and its massive impact                                    ║
║  • Memory layout principles                                                      ║
║  • Branch prediction effects                                                     ║
║  • Why some "slow" algorithms are fast in practice                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

## THE MEMORY HIERARCHY - THE FOUNDATION OF PERFORMANCE

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CPU MEMORY HIERARCHY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  LATENCY (approximate cycles to access):                                        │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │   │
│  │    CPU REGISTERS  ←──  1 cycle  (0.3 ns)                                │    │
│  │         32-128 registers, ~1 KB                                         │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L1 CACHE  ←────── 4 cycles  (1 ns)                                  │     │
│  │         32-64 KB per core                                               │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L2 CACHE  ←──────  12 cycles  (3 ns)                                │     │
│  │         256 KB - 1 MB per core                                          │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    L3 CACHE  ←──────  40 cycles  (12 ns)                               │     │
│  │         8-64 MB shared                                                  │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    MAIN RAM  ←────── 200+ cycles  (60-100 ns)                          │     │
│  │         8-128 GB                                                        │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    SSD       ←────── 100,000 cycles  (100 μs)                          │     │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │    HDD       ←────── 10,000,000 cycles  (10 ms)                        │     │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│  KEY INSIGHT:                                                                   │
│  L1 to RAM = 50x slower!                                                        │
│  RAM to SSD = 1000x slower!                                                     │
│                                                                                 │
│  An algorithm that stays in L1 cache can be 50x faster than one that            │
│  constantly misses to RAM, even with the same Big-O complexity!                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

## CACHE-FRIENDLY VS CACHE-UNFRIENDLY ALGORITHMS

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    THE CACHE LINE - 64 BYTES OF MAGIC                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  When CPU reads ONE byte, it fetches 64 bytes (cache line) from RAM!            │
│                                                                                 │
│  ARRAY ACCESS (cache-friendly):                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  int[] arr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}     │   │
│  │                                                                            │ │
│  │  Access arr[0]:                                                            │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Cache loads: arr[0] arr[1] arr[2] ... arr[15] (64 bytes = 16 ints)  │ │   │
│  │  └──────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                            │ │
│  │  Next 15 accesses arr[1]..arr[15] = CACHE HITS (1 cycle each!)           │   │
│  │  Total for 16 elements: 200 + 15 = 215 cycles                            │   │
│  │  Average: ~13 cycles per element                                          │  │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│                                                                                 │
│  LINKED LIST ACCESS (cache-unfriendly):                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  Nodes scattered in memory:                                                │ │
│  │  Node@0x1000 → Node@0x5000 → Node@0x2000 → Node@0x9000 → ...             │   │
│  │                                                                            │ │
│  │  Access node 1: Cache miss! Load 64 bytes at 0x1000 → 200 cycles         │   │
│  │  Access node 2: Cache miss! Load 64 bytes at 0x5000 → 200 cycles         │   │
│  │  Access node 3: Cache miss! Load 64 bytes at 0x2000 → 200 cycles         │   │
│  │  ...                                                                       │ │
│  │                                                                            │ │
│  │  Total for 16 elements: 16 × 200 = 3200 cycles                           │   │
│  │  Average: 200 cycles per element                                          │  │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│                                                                                 │
│  COMPARISON:                                                                    │
│  Array iteration:  ~13 cycles/element   →  15x FASTER!                          │
│  List iteration:   200 cycles/element                                           │
│                                                                                 │
│  This is why array-based structures often outperform pointer-based ones,        │
│  even when Big-O suggests otherwise!                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

## BRANCH PREDICTION AND ITS IMPACT

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BRANCH PREDICTION - THE HIDDEN FACTOR                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CPUs predict which branch will be taken before condition is evaluated!         │
│  If wrong, pipeline flush costs 15-20 cycles.                                   │
│                                                                                 │
│                                                                                 │
│  EXAMPLE: Binary Search vs Linear Search on sorted array                        │
│  ─────────────────────────────────────────────────────────                      │
│                                                                                 │
│  Binary Search (random jumps):                                                  │
│  - Each comparison: ~50% chance of left, 50% right                              │
│  - Branch predictor accuracy: ~50%                                              │
│  - Misprediction penalty: ~20 cycles per compare                                │
│  - Effective cost: O(log n) × (compare + 10 cycles penalty)                     │
│                                                                                 │
│  Linear Search (sequential):                                                    │
│  - Usually continues (not found), branch highly predictable                     │
│  - Branch predictor accuracy: ~99%                                              │
│  - Misprediction penalty: only on final "found" branch                          │
│  - Plus: prefetching pulls next elements into cache                             │
│                                                                                 │
│                                                                                 │
│  BENCHMARK (search in sorted array of 64 elements):                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ Algorithm      │ Big-O    │ Actual Time │ Notes                           │  │
│  ├────────────────┼──────────┼─────────────┼─────────────────────────────────┤  │
│  │ Binary Search  │ O(log n) │ 45 ns       │ 6 comparisons, unpredictable   │   │
│  │ Linear Search  │ O(n)     │ 35 ns       │ 32 avg comparisons, predicted! │   │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  For small n (< 100), linear search can be FASTER than binary search!           │
│  The crossover point depends on CPU and cache characteristics.                  │
│                                                                                 │
│                                                                                 │
│  BRANCH-FREE CODE:                                                              │
│  ─────────────────                                                              │
```

```java
// BRANCHY (branch misprediction possible)
int max = (a > b) ? a : b;

// BRANCH-FREE (uses conditional move instruction)
int max = b + ((a - b) & -(a > b ? 1 : 0));

// Even better: let compiler optimize
int max = Math.max(a, b);  // Modern JIT uses cmov instruction
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 🧠 Java Memory Model for Data Structures


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ JAVA OBJECT MEMORY LAYOUT                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ OBJECT HEADER (12-16 bytes on 64-bit JVM):                                      │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Mark Word (8 bytes) │ Class Pointer (4-8 bytes) │ [Array Length (4)] │        │
│ │ - Hash code │ - Points to class │ - Only for arrays │                         │
│ │ - GC age │ metadata │ │                                                       │
│ │ - Lock state │ │ │                                                            │
│ │ - Biased lock info │ │ │                                                      │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ PRIMITIVE ARRAY: int[] arr = new int[10]                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Header (16 bytes) + Length (4 bytes) │ int × 10 (40 bytes) │                  │
│ │ Total: 16 + 4 + 40 = 60 bytes (padded to 64 bytes for alignment) │            │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ ARRAYLIST<Integer> with 10 elements:                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ ArrayList Object: │                                                           │
│ │ ├── Header (16 bytes) │                                                       │
│ │ ├── Object[] elementData (8 byte reference) │                                 │
│ │ ├── int size (4 bytes) │                                                      │
│ │ └── padding (4 bytes) │                                                       │
│ │ = 32 bytes │                                                                  │
│ │ │                                                                             │
│ │ Object[]: │                                                                   │
│ │ ├── Header (16 bytes) │                                                       │
│ │ └── 10 × 8 byte references = 80 bytes │                                       │
│ │ = 96 bytes │                                                                  │
│ │ │                                                                             │
│ │ 10 × Integer objects: │                                                       │
│ │ ├── Each Integer: 16 byte header + 4 byte int = 20 → 24 bytes (aligned) │     │
│ │ └── 10 × 24 = 240 bytes │                                                     │
│ │ │                                                                             │
│ │ TOTAL: 32 + 96 + 240 = 368 bytes │                                            │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ COMPARISON:                                                                     │
│ ┌────────────────────────────────────────────────────────────────────────────┐  │
│ │ Structure │ Memory for 10 ints │ Memory per element │                         │
│ ├────────────────────────┼────────────────────┼─────────────────────────────┤   │
│ │ int[] (primitive) │ 64 bytes (padded) │ 4 bytes (+ 2.4 overhead) │            │
│ │ ArrayList<Integer> │ 368 bytes │ 24 bytes (6x more!) │                        │
│ │ LinkedList<Integer> │ 480+ bytes │ 48 bytes (12x more!) │                     │
│ └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│ LESSON: Use primitive arrays when possible!                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 📖 Operation Cost Reference Table


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CPU OPERATION COSTS (APPROXIMATE)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ARITHMETIC OPERATIONS (ALU):                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Cycles │ Notes │                                                  │
│ ├─────────────────────┼────────┼──────────────────────────────────────────┤     │
│ │ Integer add/sub │ 1 │ Can do 4+ per cycle (superscalar) │                     │
│ │ Integer multiply │ 3-4 │ Pipelined │                                          │
│ │ Integer divide │ 20-80 │ Very slow! Use shifts for powers of 2 │              │
│ │ Bit operations │ 1 │ AND, OR, XOR, shift │                                    │
│ │ Comparison │ 1 │ But may cause branch misprediction │                         │
│ │ Float add/sub │ 3-4 │ │                                                       │
│ │ Float multiply │ 4-5 │ │                                                      │
│ │ Float divide │ 15-25 │ Much slower than multiply │                            │
│ │ Square root │ 15-30 │ │                                                       │
│ │ Integer % (modulo) │ 20-80 │ Same as divide │                                 │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│ MEMORY OPERATIONS:                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Cycles │ Notes │                                                  │
│ ├───────────────────────┼──────────┼──────────────────────────────────────┤     │
│ │ L1 cache hit │ 4 │ Best case for memory access │                              │
│ │ L2 cache hit │ 12 │ │                                                         │
│ │ L3 cache hit │ 40 │ │                                                         │
│ │ RAM access │ 200+ │ Highly variable │                                         │
│ │ TLB miss (page walk) │ 50-1000 │ Large working set problem │                  │
│ │ Page fault (to disk) │ millions │ Avoid at all costs in hot paths │           │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│ FUNCTION CALL OVERHEAD:                                                         │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Cycles │ Notes │                                                  │
│ ├────────────────────────┼─────────┼──────────────────────────────────────┤     │
│ │ Static method call │ 5-10 │ Direct jump │                                     │
│ │ Instance method call │ 10-15 │ Vtable lookup │                                │
│ │ Interface method call │ 15-25 │ Itable lookup │                               │
│ │ JIT-inlined method │ 0 │ No overhead if inlined! │                            │
│ │ Reflection call │ 100+ │ Avoid in hot paths │                                 │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ JAVA-SPECIFIC OPERATIONS:                                                       │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Cycles │ Notes │                                                  │
│ ├───────────────────────┼──────────┼──────────────────────────────────────┤     │
│ │ Object allocation │ 10-20 │ Bump pointer if in TLAB │                         │
│ │ Array allocation │ 20-100 │ Depends on size, may zero-fill │                  │
│ │ new String() │ 50-100 │ Object + char array │                                 │
│ │ HashMap.get() │ 30-100 │ Hash + possible collision │                          │
│ │ ArrayList.add() │ 5-500 │ 5 if space, 500 if resize needed │                  │
│ │ Autoboxing (int→Int) │ 10-50 │ May allocate new object │                      │
│ │ String concatenation │ 50-1000 │ Creates intermediate objects │               │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 💪 Big — O in Practice — the Reality Check


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WHEN BIG-O DOESN'T TELL THE FULL STORY                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ CASE 1: O(n) can beat O(log n) for small n                                      │
│ ───────────────────────────────────────────                                     │
│                                                                                 │
│ Binary search: O(log n) with high constant (branch misprediction)               │
│ Linear search: O(n) with low constant (sequential, predicted)                   │
│                                                                                 │
│ Crossover: Around n = 100-500 elements                                          │
│ For n < 100: Linear search often faster!                                        │
│                                                                                 │
│                                                                                 │
│ CASE 2: O(n) can beat O(1) amortized                                            │
│ ─────────────────────────────────────────                                       │
│                                                                                 │
│ ArrayList.add(): O(1) amortized, but occasional O(n) resize                     │
│ LinkedList.addFirst(): O(1) always, but cache-unfriendly                        │
│                                                                                 │
│ For many small adds: ArrayList wins (spatial locality)                          │
│ For rare adds at head: LinkedList might win                                     │
│                                                                                 │
│                                                                                 │
│ CASE 3: Same Big-O, vastly different performance                                │
│ ─────────────────────────────────────────────────                               │
│                                                                                 │
│ Both O(n) - iterating 1M elements:                                              │
│ ┌────────────────────────────────────────────────────────────────────────────┐  │
│ │ Structure │ Time (ms) │ Reason │                                              │
│ ├─────────────────────┼───────────┼─────────────────────────────────────────┤   │
│ │ int[] │ 0.5 │ Sequential memory, cache-friendly │                             │
│ │ ArrayList<Integer> │ 3.0 │ Object indirection │                               │
│ │ LinkedList<Integer> │ 25.0 │ Random memory access, cache misses │             │
│ │ HashSet<Integer> │ 35.0 │ Hash computation + random access │                  │
│ └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│ Same O(n), but 70x difference between fastest and slowest!                      │
│                                                                                 │
│                                                                                 │
│ PRACTICAL RULES:                                                                │
│ ────────────────                                                                │
│ 1. For n < 100: Simple O(n) often beats clever O(log n)                         │
│ 2. Prefer contiguous memory (arrays) for iteration                              │
│ 3. Minimize object allocations in hot paths                                     │
│ 4. Use primitive arrays over Collections when possible                          │
│ 5. Profile before optimizing - intuition is often wrong!                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


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

```
┌─────────────────────────────────────────────────────────────┐
│ LEARNING FRAMEWORK                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ WHY does this exist?                                        │
│ └── What problem does it solve?                             │
│ └── What limitations of other structures does it address?   │
│                                                             │
│ HOW does it work internally?                                │
│ └── Memory layout                                           │
│ └── Operations implementation                               │
│ └── Time/Space complexity derivation                        │
│                                                             │
│ WHAT are the operations?                                    │
│ └── Core operations (CRUD)                                  │
│ └── Special operations                                      │
│ └── Edge cases                                              │
│                                                             │
│ WHEN to use it?                                             │
│ └── Use cases and patterns                                  │
│ └── Trade-offs with alternatives                            │
│ └── Anti-patterns (when NOT to use)                         │
│                                                             │
│ WHERE is it used in real systems?                           │
│ └── Production systems                                      │
│ └── Modern tech stack applications                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```


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


### HOW Arrays Work (Memory Model)


Memory Layout (Contiguous Allocation):

Address: 1000 1004 1008 1012 1016
```
┌───────┬───────┬───────┬───────┬───────┐
```

int[] arr = │ 10 │ 20 │ 30 │ 40 │ 50 │
```
└───────┴───────┴───────┴───────┴───────┘
```

Index: [0] [1] [2] [3] [4]

Address Calculation:
address(arr[i]) = base_address + (i × element_size)
address(arr[3]) = 1000 + (3 × 4) = 1012

Why O(1) Access?
→ Direct arithmetic calculation, no traversal needed
→ CPU can fetch any element in constant time

```

### Array Variants

#### 1. Static Array (Fixed Size)

```

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
```

#### 2. Dynamic Array (ArrayList, Vector)

```java
// Declaration
ArrayList<Integer> list = new ArrayList<>();
list.add(10);  // Grows automatically

// Internal Working:
┌─────────────────────────────────────────────────────────────┐
│ Initial: capacity=10, size=0                                │
│                                                             │
│ After 10 adds: capacity=10, size=10                         │
│                                                             │
│ On 11th add:                                                │
│ 1. Create new array with capacity = 10 × 1.5 = 15           │
│ 2. Copy all 10 elements to new array                        │
│ 3. Add 11th element                                         │
│ 4. Discard old array                                        │
│                                                             │
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
│ Row 0: [0][0] [0][1] [0][2] [0][3]  │
│ Row 1: [1][0] [1][1] [1][2] [1][3]  │
│ Row 2: [2][0] [2][1] [2][2] [2][3]  │
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

### HOW Linked Lists Work

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
│ ┌───┐    ┌───┐    ┌───┐                                    │
│ │NEW│───►│ A │───►│ B │                                    │
│ └───┘    └───┘    └───┘                                    │
│   ↑                                                        │
│  head                                                      │
│                                                            │
│ Insert at Tail: O(n) without tail pointer, O(1) with       │
│ Delete: O(n) to find, O(1) to unlink                       │
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

### HOW Stacks Work

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

### Stack Patterns

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

### HOW Hash Tables Work

Hash Function converts key to index:
"apple" → hash("apple") → 42 → store at index 42

┌────────────────────────────────────────────────────────────┐
│                    HASH TABLE INTERNALS                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Key: "apple"                                              │
│         │                                                  │
│         ▼                                                  │
│  ┌─────────────┐                                           │
│  │ Hash        │ h("apple") = 97 × 31^4 + ... = 93029210   │
│  │ Function    │                                           │
│  └─────────────┘                                           │
│         │                                                  │
│         ▼                                                  │
│  93029210 % 16 = 10  (Index in array of size 16)           │
│         │                                                  │
│         ▼                                                  │
│  Array[10] ← Store ("apple", value)                        │
│                                                            │
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
```


---

> **Navigation**: [< Previous](01e_Career_Projects_Part3.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](02b_DSA_Guide_Advanced.md)