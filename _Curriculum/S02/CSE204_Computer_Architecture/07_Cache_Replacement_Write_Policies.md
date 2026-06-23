# Chapter 07 — Cache Replacement and Write Policies

> [← 06 Cache Design and AMAT](06_Cache_Design_AMAT.md) | [Course Index](README.md) | [Next → 08 Virtual Memory Quantitative](08_Virtual_Memory_Quantitative.md)

---

## The Problem: When the Cache Is Full, What Gets Evicted?

Cache has 4 ways per set. A fifth block needs to go in. Which of the four existing blocks do you throw out?

And when a processor writes to a memory location — does it write to the cache only, or immediately to DRAM too? If someone else reads that DRAM location, do they see the new value?

These two questions — **replacement policy** and **write policy** — complete the cache design. They determine correctness (memory consistency) and performance (hit rates under real workloads).

---

## Replacement Policies

When all ways in a set are valid and a new block must be loaded, the cache must evict one existing block. Which one?

### Random Replacement

**Rule:** Evict a randomly selected line.

**Advantage:** Zero hardware overhead (just a random number generator). No need to track access history.

**Performance:** Surprisingly good in practice — only slightly worse than LRU on most workloads. When the working set fits comfortably in the cache, all policies work equally well. When it doesn't, the differences matter.

**Used in:** ARM Cortex-A series (configurable), some L3 implementations.

---

### LRU — Least Recently Used

**Rule:** Evict the line that was accessed LEAST recently.

**Intuition:** Temporal locality means recently-used data is more likely to be needed again. Evict the "coldest" cache line.

**Implementation for 2-way:** One bit per set. Bit = 0 means "way 0 was used more recently." On access to way 0: bit → 1. On access to way 1: bit → 0. On eviction: evict way with the "oldest" access.

**Implementation for 4-way:** 6 bits of LRU state per set (full permutation needs log2(4!) = 4.6 bits → rounded to 6). Track ordering among 4 ways.

**For 16-way:** Full LRU requires log2(16!) ≈ 44 bits per set → impractical. Use **pseudo-LRU (PLRU)**:

```
Tree-PLRU for 4-way (3 bits, not 6):
       B
      / \
    B0   B1        Each bit points toward LRU direction
   / \   / \
  0   1 2   3     (ways)

Access way 2: B → right, B1 → right (way 2 was recently used)
Evict: follow bits toward "not recently used"
```

**LRU thrashing:** For a direct-mapped or 2-way cache with a working set just larger than cache size:
```
Access pattern: A, B, C, A, B, C, ... (A, B, C all in same set, 2-way cache)
LRU evicts the line not recently used:
  Access A: miss, load A (evict nothing)
  Access B: miss, load B
  Access C: miss, load C — evicts A (LRU)
  Access A: miss (A was evicted) — evicts B
  Access B: miss — evicts C
  Access C: miss — evicts A
→ 100% miss rate! (Belady's anomaly does NOT apply to LRU, but LRU still thrashes)
```

This is why 2-way often has the same performance as direct-mapped on stride-n patterns — LRU can't help when you're working with more unique blocks than cache ways.

---

### LFU — Least Frequently Used

**Rule:** Evict the line with the lowest access count.

**Problem:** A block accessed 1000 times yesterday and 0 times today stays forever (its count is 1000), blocking new data.

**Fix: Aging.** Periodically right-shift all counts (halve them) — old accesses lose influence over time.

**Used in:** TLBs, OS page replacement (approximated). Rarely in hardware cache due to counter maintenance overhead.

---

### NMRU — Not Most Recently Used

**Rule:** Randomly evict any line EXCEPT the most recently used one.

**One bit per set:** Tracks only "which line was accessed most recently." Evict any other.

**Approximates LRU with minimal hardware.** Used widely in L2/L3 caches as a practical compromise.

---

### Belady's Algorithm (Optimal, Not Implementable)

**Rule:** Evict the block whose NEXT USE is furthest in the future.

**Requires future knowledge** — not implementable in hardware, but used as a benchmark to evaluate real policies.

**Gap between LRU and Optimal:** For random access patterns, LRU achieves ~90-95% of Belady's optimal hit rate. For streaming (no reuse) patterns, both perform identically (both get 100% misses — no reuse regardless of policy).

---

## Write Policies

When the CPU writes to a cached memory location, what happens?

### Write-Through

**Rule:** Write simultaneously to the cache AND to the next level of memory (L2/DRAM).

```
CPU writes 42 to address 0x100:
  Cache[set][way].data[offset] ← 42
  DRAM[0x100] ← 42              (also written immediately)
```

**Advantage:** Memory is always up to date. No need to write dirty lines back on eviction — just drop the cache line.

**Disadvantage:** Every write goes all the way to DRAM (or next cache level) — high write bandwidth usage.

**Optimization: Write buffer.** A small queue (16-32 entries) between cache and next level. CPU writes go into the write buffer (fast — 1 cycle); the write buffer drains to memory asynchronously. CPU doesn't stall unless the write buffer is full.

**Used in:** L1 caches of many processors (because write-through simplifies cache coherence in multi-core systems).

---

### Write-Back

**Rule:** Write ONLY to the cache. The modified line is marked **dirty**. The write to memory is deferred until the dirty line is evicted.

```
CPU writes 42 to address 0x100:
  Cache[set][way].data[offset] ← 42
  Cache[set][way].dirty ← 1     (mark as modified)
  // DRAM not updated yet

Later, when this line is evicted:
  DRAM[0x100] ← cache_line.data  // write back dirty data
```

**Advantage:** Multiple writes to the same cache line → only ONE write to memory (when evicted). Dramatically reduces write traffic.

**Disadvantage:** Memory is NOT always up to date. On cache miss/eviction, must write dirty line back before loading new line → write-back overhead on eviction.

**Dirty bit:** One additional bit per cache line to track whether the line has been modified. If dirty = 1, must write back on eviction. If dirty = 0 (clean), just discard.

**Used in:** L2 and L3 caches universally. Many L1 data caches (especially in high-performance designs).

---

### Write Policy on Cache Miss

What happens when you write to a location NOT in the cache?

**Write-allocate (fetch on write):**
1. Load the cache line from memory into the cache.
2. Write the new value to the cache line.
3. Mark dirty (if write-back).

**Justification:** Spatial locality — you'll probably write to adjacent bytes soon. Load the whole 64-byte line now.

**No-write-allocate (write around):**
1. Write directly to the next memory level (bypass cache).
2. Cache stays unchanged.

**Justification:** Some workloads write data they'll never read again (streaming writes). Loading the line into cache just wastes cache space.

**Standard pairings:**
- Write-back + write-allocate (most common for L2/L3)
- Write-through + no-write-allocate (common for write-through caches — no point loading a line you'll immediately write through anyway)

---

## Write Policy Impact on Performance

**Write-back with write-allocate (typical L2/L3):**

```
Write scenario: CPU writes to 10,000 different addresses, never re-reads:
  - Each write: 1 cache miss → load line (miss penalty)
  - 10,000 evictions: each dirty line must be written back
  - 2 memory accesses per write (load + eventual write-back) ← wasteful!

For write-streaming (never re-read): no-write-allocate is better.
Use: memset(), filling write-only output buffers
```

**Write-through with write buffer:**

```
Write scenario: CPU writes to same 10 addresses 1000 times each:
  - Write-through: every write → write buffer → memory
  - 10,000 writes to memory (assuming write buffer absorbs temporal bursts)
  - vs write-back: 10 evictions (one per dirty line) = 10 writes to memory
  → write-back wins dramatically for repeated writes to same location
```

---

## Cache Coherence (Multi-Core Preview)

In a multi-core system, each core has its own L1/L2 cache. What if Core 0 writes to address X (marks it dirty in its L1) and Core 1 reads address X from its cache?

```
Core 0: write X = 99  → Core 0's L1 cache: X = 99 (dirty)
Core 1: read X         → Core 1's L1 cache: X = 0  (stale!)
```

This is a **cache coherence problem**. Without a coherence protocol, different cores see different values for the same memory location.

**MESI Protocol** (Modified-Exclusive-Shared-Invalid):
- Each cache line has a state: M (modified/dirty), E (exclusive/clean), S (shared/read-only), I (invalid)
- Hardware snooping: every write broadcast on the bus; other caches invalidate or update their copies
- Write-invalidate: when a core writes, all other copies → I (invalid). Next read → cache miss → refetch the new value.

**False sharing:** Two cores access DIFFERENT variables that happen to be in the SAME 64-byte cache line. Core 0 writes variable A, invalidates Core 1's copy of the line (which contains variable B that Core 1 needs). Core 1 must re-fetch the line — even though A and B are logically independent.

```java
// False sharing example:
class Counter {
    long a;  // Core 0 writes a
    long b;  // Core 1 writes b
}
// a and b are in the same 128-bit region → same cache line!
// Fix: pad between them
class Counter {
    long a;
    long padding1, padding2, padding3, padding4, padding5, padding6, padding7;
    long b;
}
// Now a and b are on separate 64-byte cache lines → no false sharing.
```

---

## Section Challenge

> ### Write Policy and Replacement Trace
>
> A 2-way set-associative cache with LRU replacement has 4 sets and 8-byte blocks. The cache uses write-back with write-allocate.
>
> **Q1:** A program accesses the following addresses in order (all reads): 0, 8, 16, 0, 8, 24, 0. For each access, determine: (a) set index, (b) hit or miss, (c) which way the block occupies. Assume tags never alias (all blocks have unique tags). Track the LRU state per set.
>
> **Q2:** Now the program WRITES to address 8 (after the sequence above). What happens? Is a memory write-back triggered? If the line at address 8 is later evicted (because address 24 needs the same set), what happens on eviction?
>
> **Q3:** If the cache used write-through instead of write-back, how would Q2 differ? What's the memory bandwidth difference?
>
> **Q4:** A multi-core system has 2 cores sharing a write-back L2 cache. Core 0 has variable `counter_a` at address 0x100. Core 1 has variable `counter_b` at address 0x108. Both are in the same 64-byte cache line. Core 0 increments counter_a 1000 times; Core 1 increments counter_b 1000 times. How many cache line invalidations occur? What's the fix?
>
> **Q5 (Stretch):** A database does sequential scan writes: it writes to 1 million different 8-byte records, in order, never reading them back before the scan is complete (a sort's write phase). Compare write-back+write-allocate vs write-through+no-write-allocate for this workload. Which performs better, and why? What DRAM write bandwidth does each generate?

<details>
<summary>Full answers</summary>

```
Q1: Cache access trace

Cache: 2-way, 4 sets, 8-byte blocks.
Set index bits: log2(4) = 2 bits. Block offset: log2(8) = 3 bits.
Address bits:  [tag | set[2:1] | offset[2:0]]
               Bits 4:3 = set index. Bits 2:0 = offset.

Address 0  = 0b00 000 → set 0, offset 0. Tag 0.
Address 8  = 0b01 000 → set 1, offset 0. Tag 0.
  Wait: 8 in binary = 0b0001000. Bits 4:3 = 01 → set 1. Tag = upper bits = 0.
Address 16 = 0b0010000. Bits 4:3 = 10 → set 2. Tag 0.
Address 24 = 0b0011000. Bits 4:3 = 11 → set 3. Tag 0.

Let me redo with proper tag. 5-bit address (for this small cache):
  bits[2:0] = block offset
  bits[4:3] = set index
  bits[...] = tag

For address 0 (000_00_000): set=0, tag=0.
For address 8 (000_01_000): set=1, tag=0.
For address 16 (000_10_000): set=2, tag=0.
For address 24 (000_11_000): set=3, tag=0.

Access trace (assuming all tags unique for addresses in this problem):

Access 1: Read address 0 → set 0. MISS. Load into way 0. LRU[set0] = {MRU:way0}.
Access 2: Read address 8 → set 1. MISS. Load into way 0. LRU[set1] = {MRU:way0}.
Access 3: Read address 16 → set 2. MISS. Load into way 0. LRU[set2] = {MRU:way0}.
Access 4: Read address 0 → set 0. HIT (way 0). LRU[set0] = {MRU:way0}.
Access 5: Read address 8 → set 1. HIT (way 0). LRU[set1] = {MRU:way0}.
Access 6: Read address 24 → set 3. MISS. Load into way 0. LRU[set3] = {MRU:way0}.
Access 7: Read address 0 → set 0. HIT (way 0). LRU[set0] = {MRU:way0}.

Result: 4 misses (accesses 1,2,3,6), 3 hits (accesses 4,5,7).
Hit rate: 3/7 = 42.9%.
Note: with only 1 active address per set at a time, way 1 is never used in this trace.

──────────────────────────────────────────────────────

Q2: Write to address 8 with write-back + write-allocate

Address 8 is in set 1, way 0 (from the trace above — it was loaded by access 2).

Write to address 8:
  Cache hit (address 8 is in the cache). Write the new value to the cache line.
  Mark the line DIRTY (dirty bit ← 1).
  NO immediate write to memory (write-back policy).

Memory write-back NOT triggered by the write itself — only on eviction.

Later: address 24 also maps to set 3 (from trace), not set 1. Let's say a new address
maps to set 1 (say address 32 = set 0... wait, need a set 1 address). Address 40 = 0b101_000
→ bits 4:3 = 01 → set 1, tag = 1 (different tag). 

When address 40 is accessed and set 1 is full (1 way occupied):
  Evict way 0 (the only valid line, LRU = only option).
  dirty bit = 1 → WRITE BACK: copy the dirty cache line to DRAM[0x8..0xF].
  Load address 40's block into way 0.
  dirty bit ← 0.

Result: 1 memory write (write-back of dirty line) + 1 memory read (load address 40).
Two memory accesses for one eviction when dirty.

──────────────────────────────────────────────────────

Q3: Write-through comparison

With write-through:
  Write to address 8: hit in cache. Write new value to cache AND immediately write to DRAM[8].
  No dirty bit needed.
  When address 8's line is evicted: just discard (no write-back needed, memory already current).

Memory bandwidth difference:
  Write-back: 1 DRAM write (when evicted) per dirty line.
  Write-through: 1 DRAM write PER WRITE OPERATION (immediately).

If the program writes to address 8 ten times:
  Write-back: 1 DRAM write total (on eviction).
  Write-through: 10 DRAM writes (one per write operation) + optional write buffer batching.

For write-heavy workloads: write-back dramatically reduces DRAM write bandwidth.
For write-rarely, read-often: similar performance (the single write-back on eviction costs once).

──────────────────────────────────────────────────────

Q4: False sharing analysis

counter_a at 0x100, counter_b at 0x108 — both in same 64-byte cache line (0x100-0x13F).

Core 0 increments counter_a (writes to 0x100):
  If Core 1's cache has the line in state S (Shared) → invalidate Core 1's copy.
  Core 1 now has INVALID copy of the line.

Core 1 increments counter_b (writes to 0x108):
  Core 1 must first re-fetch the line (cache miss due to invalidation).
  Write → invalidate Core 0's copy.

Alternating:
  Each time Core 0 writes counter_a: invalidates Core 1's line.
  Each time Core 1 writes counter_b: invalidates Core 0's line.

Worst case: 1000 writes × 2 cores = 2000 cache line invalidations.
Each invalidation → cache miss → fetch line from L2/L3/DRAM → high latency.

Fix: Pad variables to separate cache lines:
  struct {
    long counter_a;
    long pad[7];   // 7 × 8 bytes = 56 bytes padding
    long counter_b; // now at 0x140 (0x100 + 64) → different cache line
  }
  
With padding: Core 0 and Core 1 touch different cache lines → zero false-sharing invalidations.
Performance improvement: 10-100× on multi-core counter benchmarks.

──────────────────────────────────────────────────────

Q5: Sequential scan write — write policy comparison

Workload: 1M sequential writes, no re-reads.
Each 8-byte record = unique address. Total = 8MB of writes.
Cache = 8MB L3.

Write-back + write-allocate:
  Each write → cache miss (first time accessing this address) → write-allocate:
    Load 64-byte cache line from DRAM → 1 read per cache line.
    Write the 8 bytes → mark dirty.
  Eventually cache fills → evictions begin → dirty lines written back → 1 write per cache line.
  
  Cache line size = 64 bytes. Records = 8 bytes. 8 records per cache line.
  Total cache lines touched = 1M / 8 = 125K lines.
  DRAM reads (write-allocate): 125K × 64 bytes = 8MB.
  DRAM writes (write-back on eviction): 125K × 64 bytes = 8MB.
  Total DRAM bandwidth: 16MB (8MB reads + 8MB writes).

Write-through + no-write-allocate:
  Each write → bypass cache, write directly to DRAM.
  No cache line loaded.
  DRAM writes: 1M × 8 bytes = 8MB.
  DRAM reads: 0 (no write-allocate).
  Total DRAM bandwidth: 8MB.

Winner: Write-through + no-write-allocate for sequential scan writes.
  - Half the DRAM bandwidth (8MB vs 16MB).
  - No wasted cache space (cache not polluted with data that won't be re-read).
  - No write-back overhead.

Lesson: Write-back + write-allocate assumes temporal reuse. For streaming writes
(memset, sort output, log writes), no-write-allocate is the correct policy.
Many CPUs expose non-temporal store instructions (movnt on x86, stlr variations)
that bypass the cache for exactly this pattern:
  _mm_stream_si64((long long*)ptr, value);  // x86 non-temporal store
```

</details>

---

## Common Misconceptions

**"Write-back is always better than write-through"**
Write-back reduces memory write bandwidth for repeated writes to the same location. But for write-once streaming patterns, write-back wastes bandwidth on unnecessary write-allocate reads. The right policy depends on the workload.

**"LRU replacement always beats random replacement"**
For working sets much smaller than cache: both achieve 100% hit rate (both are optimal). For working sets larger than cache with thrashing access patterns: LRU performs no better than random (both get 100% misses). LRU beats random only for intermediate cases with reuse patterns.

**"Dirty bits add significant overhead"**
Dirty bits are one extra bit per cache line. For a 4MB L2 with 64-byte lines: 4MB/64 = 65,536 lines → 65,536 dirty bits = 8KB overhead for 4MB cache = 0.2% storage overhead. Negligible.

---

## Connections

- **Chapter 06 — Cache Design:** Established the cache structure (sets, ways, tags). This chapter completes the design with eviction and write policies.
- **Chapter 08 — Virtual Memory:** Page tables and TLBs use similar set-associative structures. The TLB is a fully-associative cache of recent virtual-to-physical address translations — the same hit/miss/eviction logic applies.
- **Chapter 10 — Performance Analysis:** Write-back evictions add to memory stall cycles. The AMAT formula includes write-back penalty: `write_miss_penalty = miss_penalty + dirty_eviction_penalty`.

---

> [← 06 Cache Design and AMAT](06_Cache_Design_AMAT.md) | [Course Index](README.md) | [Next → 08 Virtual Memory Quantitative](08_Virtual_Memory_Quantitative.md)
