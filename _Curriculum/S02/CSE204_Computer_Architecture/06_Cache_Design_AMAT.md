# Chapter 06 — Cache Design and AMAT

> [← 05 Branch Prediction](05_Branch_Prediction.md) | [Course Index](README.md) | [Next → 07 Cache Replacement and Write Policies](07_Cache_Replacement_Write_Policies.md)

---

## The Problem: Memory Is 100× Slower Than the CPU

A modern CPU completes one instruction every 0.3ns at 3 GHz. But DRAM access takes 50-100ns. If every load instruction had to wait for DRAM:

```
lw t1, 0(s0)  → wait 50-100ns for DRAM
               → 150-300 cycles wasted per load
               → 30% loads × 200 cycles = 60 extra CPI
               → CPI ≈ 61 (vs 1 with perfect memory)
               → Program runs 61× slower
```

This is the **memory wall** — and it's why your CPU runs at a fraction of its theoretical peak on memory-intensive code.

The solution: **cache** — a small, fast memory between the CPU and DRAM. Instead of every load taking 100ns, most loads take 1-5ns. Understanding how the cache works (and how to write code that uses it well) is the single highest-leverage optimization skill in systems programming.

---

## The Locality Principle

Caches work because programs exhibit two types of locality:

**Temporal locality:** A memory location accessed recently will likely be accessed again soon.
- Variable `i` in a loop: accessed every iteration.
- Cache it the first time — subsequent accesses hit the cache.

**Spatial locality:** If a memory location is accessed, nearby locations will likely be accessed soon.
- Array traversal: `a[0]`, `a[1]`, `a[2]`, ... — consecutive addresses.
- Struct fields: accessed together.
- Instructions: executed sequentially.

**How the cache exploits this:** When you load address X:
- The cache fetches **an entire cache line** (64 bytes on x86, 64 bytes on ARM), not just the 4 bytes at X.
- The entire cache line sits in the cache.
- Nearby accesses (spatial locality) hit the cache.
- Repeated accesses to X (temporal locality) also hit.

---

## Cache Fundamentals

**Parameters:**
- **Capacity (C):** Total bytes in the cache (e.g., 32KB, 256KB, 8MB)
- **Block size (B):** Bytes in one cache line (typically 64 bytes)
- **Associativity (E):** Number of cache lines per set (1 = direct-mapped, 2/4/8 = set-associative, C/B = fully associative)
- **Number of sets (S):** S = C / (B × E)

**Address decomposition (physical address split into 3 fields):**

```
For a 32-bit address with B=64 bytes, S=64 sets, E=1:
  Block offset:  log2(64)  = 6  bits → select byte within cache line
  Set index:     log2(64)  = 6  bits → select which set
  Tag:           32-6-6    = 20 bits → identifies which memory block occupies this set

  Address layout:
  |  Tag (20 bits)  |  Set index (6 bits)  |  Block offset (6 bits)  |
```

**Cache lookup algorithm:**
```
1. Extract set index from address → identify which set to check
2. For each cache line in the set:
     If valid AND tag matches → CACHE HIT: return data[block_offset]
3. If no match → CACHE MISS: fetch block from next level, evict if necessary
```

---

## Direct-Mapped Cache

**E = 1:** Each memory block maps to exactly ONE set. Simple, fast, but vulnerable to conflict misses.

**Example:** 8-byte cache, 2-byte blocks → 4 sets.

```
Memory:  | Block 0 | Block 1 | Block 2 | Block 3 | Block 4 | Block 5 | ...
Cache:   | Set 0   | Set 1   | Set 2   | Set 3   |
Map:       Block 0 → Set 0, Block 4 → Set 0, Block 8 → Set 0  [all conflict!]
           Block 1 → Set 1, Block 5 → Set 1, ...
```

**Conflict miss example:**
```c
for (int i = 0; i < 1000; i++) {
    sum += a[i] + b[i];  // if a and b map to the same sets
                          // every access to a[i] evicts b[i]'s line
                          // every access to b[i] evicts a[i]'s line
                          // miss rate = 100%!
}
```

If a[] starts at address 0x0000 and b[] starts at address 0x1000 (4KB apart), and the cache is 4KB direct-mapped, then a[i] and b[i] will ALWAYS map to the same cache set — thrashing each other. This is a **conflict miss**.

---

## Set-Associative Cache

**E = 2 (2-way) or E = 4 (4-way):** Each memory block can go into any of E lines within its set.

```
4-way set-associative, S=16 sets:
  Each set has 4 "ways" (4 cache lines).
  A memory block maps to ONE specific set (by set index), but can occupy ANY of the 4 ways.
```

**Eliminates most conflict misses:** Now a[i] and b[i] map to the same set but can occupy different ways. Both stay in cache simultaneously.

**Tradeoff:** More hardware (E comparators instead of 1 per set for the tag check). Slightly higher access latency than direct-mapped.

**Typical configurations:**
- L1 cache: 4-way or 8-way, 32-64KB
- L2 cache: 8-way, 256KB-1MB
- L3 cache: 16-way, 4-32MB

---

## Fully Associative Cache

**E = C/B (all blocks):** Any memory block can go anywhere in the cache. No set index field — just tag + offset.

**Advantage:** Zero conflict misses (the only misses are capacity misses).
**Disadvantage:** To find a block, you must compare ALL cache lines simultaneously (parallel tag comparison across all lines). Hardware scales poorly for large caches.

**Used only for:** Small, critical caches (TLBs, victim caches). Never for large L2/L3.

---

## Average Memory Access Time (AMAT)

**AMAT:** The average cycles to satisfy one memory request, accounting for cache hits and misses.

```
AMAT = Hit time + Miss rate × Miss penalty

For a multi-level cache hierarchy:
AMAT = t_L1 + MR_L1 × (t_L2 + MR_L2 × (t_L3 + MR_L3 × t_DRAM))
```

Where:
- t_L1 = L1 hit time (1-5 cycles)
- MR_L1 = L1 miss rate (fraction of accesses that miss L1)
- t_L2 = L2 hit time (10-20 cycles) ← additional penalty beyond L1
- MR_L2 = L2 miss rate (fraction that also miss L2)
- t_DRAM = DRAM latency (100-200 cycles)

**Worked example: 3-level hierarchy**

```
L1:   1 cycle hit time, 5% miss rate
L2:  10 cycle hit time, 20% local miss rate (MR of accesses reaching L2)
L3:  40 cycle hit time, 50% local miss rate
DRAM: 200 cycles

AMAT = 1 + 0.05 × (10 + 0.20 × (40 + 0.50 × 200))
     = 1 + 0.05 × (10 + 0.20 × (40 + 100))
     = 1 + 0.05 × (10 + 0.20 × 140)
     = 1 + 0.05 × (10 + 28)
     = 1 + 0.05 × 38
     = 1 + 1.9
     = 2.9 cycles
```

Compare to no cache: AMAT = 200 cycles. Cache gives **69× improvement**!

---

## The Three C's of Cache Misses

**Compulsory misses (cold misses):**
- The very first access to any memory block is always a miss.
- Unavoidable — data has never been in the cache.
- Reduced by prefetching (hardware or software).

**Capacity misses:**
- The cache is too small to hold the entire working set.
- Even a fully associative cache would miss.
- Reduced by increasing cache size, or restructuring data access to have smaller working sets.

**Conflict misses:**
- Two blocks compete for the same set in a set-associative or direct-mapped cache.
- Would NOT miss in a fully associative cache of the same size.
- Reduced by increasing associativity, or by padding data structures to avoid aliasing.

**4th C — Coherence misses** (in multi-core systems):
- One core's cache line is invalidated because another core wrote to the same memory.
- Covered in distributed/parallel architecture courses.

---

## Cache Miss Rate vs Working Set Size

```
Miss rate
  1.0 |
      |     Compulsory floor
  0.5 |_________
      |         \
  0.1 |          \____
      |                \________
  0.01|                          \_______
      +─────────────────────────────────── Working set size
               ↑       ↑
           Fits in L1  Fits in L3
```

- **When working set < L1 cache size:** Miss rate ≈ compulsory misses only (very low, near 0).
- **When working set > L1 but < L2:** Capacity misses begin (L1 miss rate rises).
- **When working set > L3:** Must go to DRAM frequently; performance drops dramatically.

**This is why** matrix multiplication performance drops when matrices don't fit in L3:
- 512×512 int matrix = 512×512×4 = 1MB (fits in L3 on most CPUs, fast)
- 8192×8192 int matrix = 256MB (far exceeds L3, each access goes to DRAM)

---

## AMAT Formula for CPI Calculation

The cache miss stall terms integrate into the overall CPI formula:

```
CPI = CPI_base + memory_stall_cycles_per_instruction

memory_stall_cycles = (load+store fraction) × miss_rate × miss_penalty

Example:
  40% of instructions are memory accesses (loads + stores)
  L1 miss rate = 5%
  Miss penalty = 100 cycles (goes to DRAM)
  
  memory_stall_per_instruction = 0.40 × 0.05 × 100 = 2.0 cycles
  
  CPI_base = 1.0 (ideal pipelined CPU)
  CPI_total = 1.0 + 2.0 = 3.0
  
  With L2 cache (90% of L1 misses hit L2, L2 hit time = 10 cycles):
  memory_stall = 0.40 × 0.05 × [10 + 0.10 × 100] = 0.40 × 0.05 × 20 = 0.40
  CPI_total = 1.0 + 0.40 = 1.4   ← nearly 2× better than without L2!
```

---

## Section Challenge

> ### Cache Sizing and AMAT Analysis
>
> A CPU accesses memory as follows: 30% of instructions are loads, 10% are stores. You are designing the cache hierarchy.
>
> **Q1:** Calculate AMAT for a single-level cache system: L1 hit time = 2 cycles, L1 miss rate = 8%, DRAM penalty = 150 cycles (including L1 hit time for a miss, the penalty is the additional cycles).
>
> **Q2:** Now add an L2 cache: L2 hit time = 15 cycles, L2 local miss rate = 25% (fraction of L1 misses that also miss L2). Recalculate AMAT. How much did the L2 improve AMAT?
>
> **Q3:** Using the AMAT from Q2, compute the overall CPI (using 40% memory instruction rate). The base CPI (assuming perfect memory) is 1.0.
>
> **Q4:** A programmer observes that their matrix multiplication code is 10× slower than expected. The matrices are 2048×2048 doubles (each double = 8 bytes). The L3 cache is 8MB. Does the working set fit in L3? (Consider that the naive triple-loop touches 3 matrices). What is the fundamental problem?
>
> **Q5 (Stretch):** You have a direct-mapped 16KB cache with 64-byte blocks. An array `int a[4096]` is stored starting at address 0x0000 (each int = 4 bytes, so the array is 16KB). A second array `int b[4096]` starts at 0x4000 (= 16KB). (a) What is the cache set for a[0] and for b[0]? Do they alias? (b) If you access a[i] then b[i] in a loop, what is the cache miss rate? (c) How would you fix this? (d) What associativity would eliminate this conflict miss?

<details>
<summary>Full answers</summary>

```
Q1: Single-level AMAT

AMAT = L1_hit_time + L1_miss_rate × DRAM_penalty
     = 2 + 0.08 × 150
     = 2 + 12
     = 14 cycles

──────────────────────────────────────────────────────

Q2: Two-level AMAT with L2

AMAT = L1_hit_time + L1_miss_rate × (L2_hit_time + L2_local_miss_rate × DRAM_penalty)
     = 2 + 0.08 × (15 + 0.25 × 150)
     = 2 + 0.08 × (15 + 37.5)
     = 2 + 0.08 × 52.5
     = 2 + 4.2
     = 6.2 cycles

Improvement: AMAT went from 14 cycles (no L2) to 6.2 cycles (with L2).
Speedup = 14 / 6.2 = 2.26×.

Explanation: The L2 catches 75% of L1 misses at 15 cycles instead of 150 cycles.
The 25% that miss L2 still pay 150 cycles (DRAM penalty).
Average cost of an L1 miss: 15 + 0.25×150 = 52.5 cycles (vs 150 without L2).

──────────────────────────────────────────────────────

Q3: Overall CPI with cache

Memory stall per instruction:
  = memory_fraction × L1_miss_rate × average_miss_penalty
  = 0.40 × 0.08 × (15 + 0.25 × 150)
  = 0.40 × 0.08 × 52.5
  = 1.68 cycles per instruction

CPI_total = CPI_base + memory_stall = 1.0 + 1.68 = 2.68

The cache hierarchy makes the CPU run at 2.68/1.0 = 2.68× slower than if memory were instantaneous.
Without L2 (single-level cache): memory_stall = 0.40 × 0.08 × 150 = 4.8, CPI = 5.8.
With L2: CPI = 2.68 (2.16× better overall).

──────────────────────────────────────────────────────

Q4: Matrix multiplication working set

Matrix size: 2048 × 2048 doubles = 2048 × 2048 × 8 bytes = 32MB per matrix.
Three matrices (A, B, C): 3 × 32MB = 96MB working set.

L3 cache = 8MB. Working set (96MB) is 12× larger than L3 → does NOT fit.

The fundamental problem:
The naive triple-loop (i, j, k) has poor spatial locality for the B matrix.
  for i in range(n):
    for j in range(n):
      for k in range(n):
        C[i][j] += A[i][k] * B[k][j]   ← B is accessed column-by-column (stride-n)

When n=2048, each column of B is 2048 × 8 = 16KB apart in memory.
Successive accesses to B[k][j] are separated by n × 8 = 16KB. Each access evicts a previous cache line.
Result: every B access is a cache MISS → DRAM access → 150+ cycles per multiply.

The fix: Cache-oblivious blocking (tiling). Access C, A, B in B×B blocks that fit in L1/L2.
  for ii in range(0, n, B): for jj in range(0, n, B): for kk in range(0, n, B):
    for i in range(ii, ii+B): for j in range(jj, jj+B): for k in range(kk, kk+B):
      C[i][j] += A[i][k] * B[k][j]

With B=32: each B×B block = 32×32×8 = 8KB → fits in L1 cache → reused many times.
Cache miss rate drops from ~100% to near compulsory only → 100× speedup possible.

──────────────────────────────────────────────────────

Q5: Direct-mapped aliasing

Cache: 16KB, 64-byte blocks.
Number of sets = 16KB / 64B = 256 sets.
Set index bits: log2(256) = 8 bits (bits 13:6 of address).
Block offset bits: log2(64) = 6 bits (bits 5:0).
Tag bits: 32 - 8 - 6 = 18 bits.

(a) Set index for a[0] (address 0x0000):
  Bits 13:6 of 0x0000 = 0x00 = 0 → Set 0.

Set index for b[0] (address 0x4000 = 16KB = 0x4000):
  0x4000 in binary: 0100 0000 0000 0000
  Bits 13:6 = 0100 0000 >> 6 = 0x01_00? No, let's compute properly:
  Bits 13:6 of 0x4000 = (0x4000 >> 6) & 0xFF = 0x100 & 0xFF = 0x00 = 0 → Set 0!

Yes! a[0] and b[0] BOTH map to Set 0. They alias in a direct-mapped cache.

Reason: 0x4000 = 16KB = exactly the cache size. Any address that differs from another
by exactly (or a multiple of) the cache size maps to the SAME set.

(b) Miss rate in loop:
  Loop: access a[i], then b[i]:
    a[i] → maps to Set (i*4)/64 mod 256 = set for that cache line
    b[i] → maps to SAME set (b[i] address = a[i] address + 16KB → same set bits)
    
  Access a[i]: cache miss (b[i-1] is in this set, gets evicted to bring a[i] in)
  Access b[i]: cache miss (a[i] just loaded evicts the a[i] line when b[i] claims the set)
  
  Every access is a MISS: 100% miss rate! Pure thrashing.

(c) Fix:
  Option 1: Pad array a to make it 16KB + cache line size.
    int a[4096 + 16];  // a occupies 16KB + 64 bytes
    // Now b[0] is at a different cache set from a[0].
    
  Option 2: Interleave: store (a[i], b[i]) together in a struct:
    struct {int a; int b;} arr[4096];
    // arr[i].a and arr[i].b are in the same or adjacent cache lines.
    
  Option 3: Use 2-way or higher associativity (see below).

(d) Required associativity:
  With 2-way set-associative:
    Each set holds 2 lines. a[i] and b[i] can BOTH reside in the set simultaneously
    (in the two different ways). When c[i] is accessed (a third array at 0x8000),
    it would map to the same set, evicting one of them.
    
  For accessing a[i] and b[i] alternately: 2-way associativity is sufficient.
  Both lines coexist → NO conflict misses for the 2-array case.
  For 3+ aliasing arrays: need higher associativity or larger cache.
```

</details>

---

## Common Misconceptions

**"A cache miss always goes to DRAM"**
In a 3-level hierarchy, an L1 miss goes to L2 first, then L3, then DRAM — each level catching some fraction of misses. Only L3 misses go to DRAM. The "miss penalty" in a two-level AMAT formula already accounts for this layering.

**"Larger cache = always faster"**
A larger cache has: higher capacity, but also longer hit time (more transistors to search). An L1 cache of 64KB vs 32KB might have slightly worse hit latency (0.5-1 cycle). The optimal cache size depends on the workload's working set distribution.

**"Cache miss rate is the most important metric"**
AMAT = hit_time + miss_rate × miss_penalty. Reducing hit time (for very frequent accesses) can matter as much as reducing miss rate. This is why L1 is tiny and fast; L3 is large but slower.

---

## Connections

- **CSE104 Ch06 — Memory Hierarchy:** Introduced the latency table and locality principle. This chapter goes deeper: AMAT, 3 Cs, set-associativity, the quantitative model.
- **Chapter 07 — Replacement and Write Policies:** The cache needs rules for which line to evict when a miss occurs (LRU, LFU, random) and how to handle writes (write-through, write-back). That's next.
- **Chapter 10 — Performance Analysis:** Memory stall cycles integrate into the overall CPI formula. The complete model: CPI = base + load_use + branch_mispredict + memory_stall.

---

> [← 05 Branch Prediction](05_Branch_Prediction.md) | [Course Index](README.md) | [Next → 07 Cache Replacement and Write Policies](07_Cache_Replacement_Write_Policies.md)
