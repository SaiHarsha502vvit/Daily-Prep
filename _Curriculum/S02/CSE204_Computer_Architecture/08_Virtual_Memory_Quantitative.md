# Chapter 08 — Virtual Memory: Quantitative Analysis

> [← 07 Cache Replacement and Write Policies](07_Cache_Replacement_Write_Policies.md) | [Course Index](README.md) | [Next → 09 IO Subsystems DMA](09_IO_Subsystems_DMA.md)

---

## The Problem: Parallel Programs Need Address Isolation

Two programs run simultaneously. Both assume their code starts at address 0x400000. Both have stacks at 0x7FFF0000. They can't share physical memory at these addresses — they'd overwrite each other.

**Virtual memory** gives each process its own private address space. The process sees virtual addresses (the illusion); the hardware and OS collaborate to translate them to physical addresses (the reality). This translation happens on every memory access — it must be fast.

CSE104 introduced the concept. This chapter derives the quantitative performance model: how TLB misses stall the pipeline, how to calculate AMAT with virtual memory, and how page table structures scale.

---

## Virtual-to-Physical Translation (Recap)

A virtual address (VA) is split into:

```
For 4KB pages (page size = 2^12 = 4096 bytes):
  VA = [ Virtual Page Number (VPN) | Page Offset ]
             [top bits]                [12 bits]

Translation:
  Physical Address = page_table[VPN] | page_offset
```

The page table maps VPN → PFN (Physical Frame Number). Each page table entry (PTE) is 8 bytes on x86-64.

**4-level page table (x86-64 with 48-bit VA space):**
```
VA[47:39] → PML4 table → entry points to PDPT
VA[38:30] → PDPT table → entry points to PD
VA[29:21] → PD table   → entry points to PT
VA[20:12] → PT table   → entry points to physical frame
VA[11:0]  → byte offset within page

Each level: 2^9 = 512 entries × 8 bytes = 4KB per table (fits in one page!)
Total to map 1 page: 4 page table entries (one per level) = 32 bytes overhead.
```

---

## The TLB: Cache for Address Translations

Translating a VA through 4 levels requires 4 memory accesses (one per table level) — before the actual memory access. Every load/store would take 5× as long without a TLB!

**TLB (Translation Lookaside Buffer):** A small, fully-associative cache of recent VPN → PFN translations.

```
TLB hit:   VA → TLB lookup → PFN in 1 cycle → physical address → cache/DRAM
TLB miss:  VA → TLB lookup → MISS → page table walk (4 memory reads) → PFN → update TLB → cache/DRAM
```

**Typical TLB parameters:**
- L1 TLB (ITLB + DTLB): 64 entries, fully associative, 1-cycle lookup
- L2 TLB (shared): 1024-4096 entries, 4-way, 4-cycle lookup
- TLB entry: holds VPN, PFN, permission bits (R/W/X/U), valid bit, dirty bit

**TLB miss rate:** Depends on working set of pages. If you access 100 pages total and TLB has 64 entries: you'll miss 36 on first access (compulsory), then hit on re-access. If you access 1000 pages in random order with a 64-entry TLB: you miss frequently.

---

## AMAT with TLB: Full Formula

Every memory access now involves:
1. TLB lookup to get physical address
2. Cache lookup with physical address
3. Possible miss → DRAM

```
AMAT = TLB_hit_time + TLB_miss_rate × TLB_miss_penalty
       + Cache_hit_time + Cache_miss_rate × DRAM_penalty

More precisely (sequential):
AMAT = (TLB lookup) + (cache lookup) + possible misses...

Simplified with TLB assumed to happen in parallel with cache index:
AMAT = max(TLB_time, cache_index_time) 
       + TLB_miss_rate × TLB_miss_penalty
       + Cache_miss_rate × DRAM_penalty
```

**For most architectures:** TLB lookup and cache set index lookup happen in parallel (since the cache index bits are within the page offset and don't require translation):

```
VA[11:6] = cache set index (bottom bits are the same in VA and PA for page-indexed caches)
TLB translates VA[47:12] → PA[47:12] simultaneously
```

This is why L1 caches are designed to be **VIPT (Virtually Indexed, Physically Tagged)** — index with VA bits, tag with PA bits from TLB.

---

## Worked AMAT Calculation with TLB

**System parameters:**
- L1 TLB: 1 cycle, 1% miss rate
- L2 TLB: 10 cycles (for L1 TLB misses), 10% miss rate
- Page walk: 40 cycles (4 levels × 10 cycles each, L3 cache hit for page tables)
- L1 cache: 2 cycles, 5% miss rate
- DRAM: 150 cycles

```
TLB effective time per access:
= TLB_L1_hit_time + L1_miss_rate × (L2_time + L2_miss_rate × page_walk_time)
= 1 + 0.01 × (10 + 0.10 × 40)
= 1 + 0.01 × (10 + 4)
= 1 + 0.01 × 14
= 1 + 0.14
= 1.14 cycles average TLB overhead

Cache access time (physical address from TLB):
= L1_cache_time + L1_miss_rate × DRAM_penalty
= 2 + 0.05 × 150
= 2 + 7.5
= 9.5 cycles

Total AMAT = TLB_time + Cache_time = 1.14 + 9.5 = 10.64 cycles
```

Compare to without TLB (every access walks page table):
```
AMAT_no_TLB = 40 (page walk) + 2 + 0.05 × 150 = 49.5 cycles
```

**TLB provides 49.5 / 10.64 ≈ 4.65× speedup.** Without it, the translation alone would dominate.

---

## Page Table Walk: Memory Access Cascade

On a TLB miss, the hardware MMU (Memory Management Unit) walks the 4-level page table:

```
1. CR3 register → physical address of PML4 table
2. PML4[VA[47:39]] → physical address of PDPT  (1 memory access)
3. PDPT[VA[38:30]] → physical address of PD     (1 memory access)
4. PD[VA[29:21]]   → physical address of PT     (1 memory access)
5. PT[VA[20:12]]   → PFN (physical frame number) (1 memory access)
6. Physical address = PFN | VA[11:0]
7. Update TLB with this VPN→PFN mapping
```

**Page table entries are ALSO cached in L1/L2/L3!** The 4 memory reads for a page walk typically hit the cache (page tables are repeatedly accessed):

```
Page walk latency:
  4 accesses × L3 cache hit (if page tables in L3, 40 cycles each) = 160 cycles (worst case)
  4 accesses × L2 cache hit (common) = 4 × 15 = 60 cycles (typical)
  4 accesses × L1 cache hit (for hot page tables) = 4 × 2 = 8 cycles (best case)
```

For processes with small virtual memory footprints, all page table entries fit in L1/L2 and the TLB miss cost is just ~10-20 cycles, not 150.

---

## Huge Pages: Trading TLB Reach for Flexibility

**Standard 4KB pages:** A 64-entry TLB covers 64 × 4KB = 256KB of virtual address space.

**Huge pages (2MB = 2^21):** A 64-entry TLB covers 64 × 2MB = 128MB. A huge page removes one level of the page table (entries in PD map directly to physical 2MB frames, skipping the PT level).

```
Coverage comparison (64-entry TLB):
  4KB pages:    256KB — easily exhausted by any real application
  2MB pages:    128MB — covers most database buffer pools
  1GB pages:    64GB  — entire working set of many server apps
```

**When to use huge pages:**
- Database buffer pools (PostgreSQL, Oracle: 16GB+ buffer = 8192+ 2MB pages — still manageable)
- JVM heap (Java applications with -XX:+UseHugePages on Linux)
- HPC/ML workloads with large contiguous working sets

**Cost:** Less flexible memory allocation (must allocate 2MB-aligned chunks), harder to support sparse virtual address spaces.

**Linux transparent huge pages (THP):** The kernel automatically promotes 4KB regions to 2MB pages when a process's memory access patterns suggest it would benefit. Java applications often see 20-30% speedup from THP on TLB-heavy workloads.

---

## Page Faults and Their Cost

**Page fault:** The PTE's valid bit is 0 — the page is not in physical memory (it's been swapped to disk, or was never loaded).

```
OS page fault handler:
1. Trap to kernel (very expensive: mode switch, save registers)
2. Find the page on disk (or in mmap'd file)
3. Allocate a physical frame
4. Read the page from disk → physical frame  ← disk I/O: 1-10ms!
5. Update PTE: valid = 1, PFN = new frame
6. Resume the faulting instruction
```

**Page fault cost: 1-10 milliseconds** = 3-30 million CPU cycles at 3 GHz.

**Compare to everything else:**
```
TLB hit:       1 cycle         (0.33 ns at 3 GHz)
TLB miss:     10-40 cycles    (3-13 ns)
L1 cache miss + L3 hit: 40 cycles (13 ns)
L1 cache miss + DRAM:  150 cycles  (50 ns)
Page fault:  5,000,000 cycles  (1.7 ms)
```

**Page fault is 30,000× slower than a DRAM access.** Minimizing page faults is critical for performance in memory-constrained systems.

**Swap thrashing:** When the working set doesn't fit in physical memory and the OS pages constantly (every access faults, the OS brings in page X which evicts page Y which is immediately needed again). The system becomes ~1000× slower — effectively locked up. This is why modern systems prefer killing processes (OOM killer) over allowing thrashing.

---

## Context Switch Cost: TLB Flush

When the OS switches from Process A to Process B:

**Problem:** TLB entries from Process A are still present. Process B's virtual addresses might map to different physical addresses — using A's TLB entries for B's accesses would be catastrophic (wrong physical addresses, security violation).

**Simple solution:** Flush the entire TLB on context switch (invalidate all entries).
- Cost: Every process restart has 100% TLB miss rate for first accesses.
- At 64-entry TLB, 1% miss rate normally: after flush, need 64 new misses to refill.

**Better solution: ASID (Address Space ID)**
Add an 8-bit ASID to each TLB entry. Only hit on TLB entry if both VPN AND ASID match.

```
TLB entry: { VPN, ASID, PFN, permissions, valid }
On context switch: load Process B's ASID into a CPU register
                   (no TLB flush needed!)
TLB lookup: match (VPN AND ASID) → coexistence of multiple processes' translations
```

**ASID is used in:** ARM (called ASID), RISC-V (ASID field in satp register), x86 (called PCID since Sandy Bridge 2011).

With ASID: context switch TLB cost ≈ 0 (just change the ASID register). Without ASID: cost = 64 TLB misses × miss_penalty = 64 × 40 cycles = 2,560 cycles per context switch.

---

## Section Challenge

> ### TLB and Virtual Memory Performance Analysis
>
> A system has: 4KB pages, 64-entry L1 DTLB (1 cycle, fully associative), 512-entry L2 TLB (4 cycles), 4-level page walk (20 cycles when page tables are in L3), L1 cache (2 cycles, 4% miss rate), DRAM (120 cycles).
>
> **Q1:** Calculate the effective AMAT assuming: L1 TLB miss rate = 2%, L2 TLB miss rate = 15% (of L1 misses).
>
> **Q2:** A process accesses 256 distinct pages sequentially, then repeats the sequence 100 times. With a 64-entry TLB (LRU), how many TLB misses occur total? What fraction of all accesses are TLB misses? (Assume 1 memory access per page per access round.)
>
> **Q3:** The system switches to using 2MB huge pages. The L1 TLB still has 64 entries. How much virtual address space does the TLB now cover? If the process's working set is 200MB, does it fit in the TLB? Recalculate TLB miss rate roughly for this case.
>
> **Q4:** A database with 32GB working set runs on a machine with 16GB RAM. Describe what happens when the working set exceeds RAM. What is the approximate page fault rate if the database accesses 1 million random pages per second and the working set is 50% larger than physical memory? What is the performance impact?
>
> **Q5 (Stretch):** A system WITHOUT ASID flushes the TLB on every context switch. It context-switches 10,000 times per second (a busy server). Each TLB refill requires 64 misses at 40 cycles each (page walk cost). At 3 GHz clock rate, what fraction of CPU time is spent on TLB refill after context switches? How does ASID eliminate this overhead?

<details>
<summary>Full answers</summary>

```
Q1: Full AMAT with TLB

TLB component:
AMAT_TLB = L1_TLB_time + L1_miss_rate × (L2_TLB_time + L2_miss_rate × page_walk)
         = 1 + 0.02 × (4 + 0.15 × 20)
         = 1 + 0.02 × (4 + 3)
         = 1 + 0.02 × 7
         = 1 + 0.14
         = 1.14 cycles

Cache component:
AMAT_cache = L1_cache_time + L1_miss_rate × DRAM_penalty
           = 2 + 0.04 × 120
           = 2 + 4.8
           = 6.8 cycles

Total AMAT ≈ TLB_overhead + AMAT_cache = 1.14 + 6.8 = 7.94 cycles

(In practice, TLB lookup and cache index lookup occur in parallel, so the effective
AMAT is approximately the maximum of their parallel portions plus sequential miss penalties.
The simplified formula gives a useful upper bound.)

──────────────────────────────────────────────────────

Q2: TLB misses for 256 pages, 100 rounds

Working set: 256 distinct pages. TLB: 64 entries (LRU).

Round 1 (first pass through 256 pages):
  All 256 pages start as cold misses.
  First 64: TLB fills up (64 misses, 64 hits for subsequent accesses in this explanation
  — but since we access each page ONCE per round, each page is a miss in round 1).
  
  Actually: each of the 256 pages is accessed once in round 1. All 256 are misses.
  256 TLB misses in round 1.

Rounds 2-100 (subsequent passes):
  TLB has 64 entries. Working set = 256 pages. 256 > 64 → TLB thrashing!
  
  Round 2: access page 0 → TLB miss (was evicted). TLB loads page 0, evicts page 193 (LRU).
  As we walk through 256 pages sequentially, the TLB keeps cycling through 64 of the 256 pages.
  With LRU + sequential access pattern + 256 pages (exactly 4× TLB size):
  EVERY access in rounds 2-100 is a TLB miss (the page was evicted in the same round).
  
  Actually: in each round of 256 accesses, we access 256 unique pages in order.
  TLB holds 64. After 64 accesses, the first page is being evicted by new pages.
  Page 65 evicts page 1. Page 66 evicts page 2. ... Page 128 evicts page 64.
  When we come back to page 65 in round 2: page 65 was evicted by page 129. Miss.
  Pattern: every access in rounds 2-100 is a miss.

Total TLB misses:
  Round 1: 256 misses.
  Rounds 2-100: 256 × 99 = 25,344 misses.
  Total: 256 + 25,344 = 25,600 misses.
  
Total accesses: 256 × 100 = 25,600.
TLB miss rate: 25,600/25,600 = 100%! (Perfect thrashing due to working set > TLB size)

──────────────────────────────────────────────────────

Q3: Huge pages coverage and TLB miss rate

With 2MB huge pages:
  64-entry TLB covers: 64 × 2MB = 128MB.
  
  Process working set = 200MB. 200MB > 128MB → doesn't fit!
  But barely (200/128 = 1.5625× TLB coverage) — much better than 4KB case.

With 4KB pages:
  64 entries × 4KB = 256KB coverage → 200MB / 256KB = 781× more than TLB!
  TLB miss rate: extremely high (close to 100% for random 200MB accesses).

With 2MB huge pages:
  Working set = 200MB. Pages needed = 100 pages (200MB / 2MB).
  TLB capacity: 64 entries. 100 > 64 → some misses.
  Miss rate: roughly (100 - 64) / 100 = 36% for first access (compulsory + capacity),
  but temporal locality helps — in practice, the TLB covers 64/100 = 64% of working set.
  Approximate TLB miss rate for 2MB pages: ~36% (vs ~100% for 4KB in same scenario).
  
  Result: Huge pages reduce TLB miss rate dramatically for large working sets.
  Even though the TLB still can't hold the entire 200MB working set, 2MB pages
  reduce the number of pages needed by 512× (from 50,000 pages to 100 pages).

──────────────────────────────────────────────────────

Q4: Database page faults with oversized working set

32GB working set, 16GB RAM → working set is 2× physical memory.
OS has 16GB of pages in RAM; the other 16GB is on disk (SSD/HDD).

At 1 million random page accesses per second:
  Physical hit rate ≈ 16GB / 32GB = 50% (random access to 32GB working set; half in RAM).
  Page fault rate ≈ 50% × 1M = 500,000 page faults per second.

Page fault cost: ~1ms each (SSD) or ~10ms (HDD).

With SSD (1ms per page fault):
  Performance impact: 500,000 faults/s × 1ms/fault = 500 seconds of fault time per second.
  The CPU would need to be 500× faster than it is just to keep up — impossible.
  Reality: CPU stalls most of the time waiting for page faults to resolve.
  Effective throughput: drops to ~2,000 page accesses/second (instead of 1M).
  ~500× slowdown.

Prevention:
  1. Add more RAM (scale up).
  2. Use a smaller, hot working set (partition data, keep hot data in RAM).
  3. Use mmap() with MADV_SEQUENTIAL hint (OS prefetches pages).
  4. Use SSDs (1ms vs 10ms — 10× better than HDD, still 1000× worse than DRAM).

──────────────────────────────────────────────────────

Q5: ASID vs TLB flush on context switch

TLB flush cost per context switch:
  64 TLB entries need to be refilled.
  Each refill = 1 page walk = 40 cycles.
  Total per context switch: 64 × 40 = 2,560 cycles.

10,000 context switches per second:
  Total TLB refill cycles: 10,000 × 2,560 = 25,600,000 cycles per second.
  At 3 GHz: 25,600,000 / (3 × 10^9) = 0.0085 = 0.85% of CPU time.

Actually this seems small — but this is just the DIRECT cost of the 64 guaranteed misses.
The INDIRECT cost (cache thrashing — processes compete for L1/L2 cache) is much larger.

ASID elimination:
  With ASID: no TLB flush on context switch. Just change ASID register (1 cycle).
  TLB entries from Process A and Process B coexist.
  When Process A returns (after B ran), its TLB entries are still valid.
  
  Direct saving: 2,560 cycles × 10,000 switches = 25.6M cycles/s = 0.85% CPU time.
  Indirect saving: Process A resumes with warm TLB → no compulsory misses on return.
  For a process that gets 100μs of CPU time before each switch:
    Without ASID: 64 misses × 40 cycles = 2,560 cycles = 0.85μs of overhead = 0.85% of runtime.
    With ASID: 0 overhead on resume → effectively free context switching.
  
  For high-context-switch workloads (web servers, game schedulers): ASID provides
  meaningful throughput improvement, especially when TLB miss rate is high.
```

</details>

---

## Common Misconceptions

**"Virtual memory makes programs slower"**
Virtual memory adds ~0.14 cycles overhead per memory access in the example above — about 2% overhead on AMAT. The TLB hit rate is >98% for most programs, making the overhead negligible. The benefits (isolation, overcommit, demand paging, mmap) far outweigh this.

**"A page fault is just a slow memory access"**
Page faults involve disk I/O (1-10ms). An L1 cache miss is 2ns. The ratio is 5×10^5 to 5×10^6. Disk access is not slow — it's categorically different. Programs should be structured to avoid page faults in critical paths entirely.

**"TLB flushing on every context switch is unavoidable"**
ASIDs (implemented in ARM, RISC-V) and PCIDs (implemented in x86 since Sandy Bridge 2011) eliminate the need to flush the TLB on context switches. Modern OSes (Linux, Windows) use PCIDs/ASIDs to eliminate this overhead.

---

## Connections

- **CSE104 Ch09 — Virtual Memory:** Introduced demand paging, COW, mmap, OOM killer. This chapter adds the quantitative model: AMAT with TLB, TLB miss rate analysis, page fault cost, huge pages.
- **Chapter 07 — Cache Replacement:** TLB is a fully-associative cache with LRU replacement — the same policies analyzed in Ch07 apply to TLB entries.
- **Chapter 10 — Performance Analysis:** Virtual memory overhead integrates into the full CPI model as TLB miss stall cycles.

---

> [← 07 Cache Replacement and Write Policies](07_Cache_Replacement_Write_Policies.md) | [Course Index](README.md) | [Next → 09 IO Subsystems DMA](09_IO_Subsystems_DMA.md)
