# Appendix B: Production Failure Modes & Variant Selection

> **Navigation**: [← 1.5 Skip List](05_skip_list.md) | [Chapter overview](../02a_DS_Variants_Core.md) | [University-Level Addendum — Core Variants… →](07_university_level_addendum_core_variants_as.md)
> Page 6 of 7 in **Data Structures: ALL VARIANTS Complete Guide**



## Production failure modes: when variant choice kills you

> [!WARNING]
> These are **real failure modes** observed in production systems. Choosing the wrong variant can degrade performance by 10× to 1000× or cause memory exhaustion.


## Failure Mode 1: LinkedList Instead of ArrayList for Random Access

### Context

A service processes items by index in a tight loop. Developer picks
LinkedList because "linked lists are faster for insertions."

**The bug:** 

- LinkedList.get(i) requires O(n) traversal: head -> next -> next -> ...
- For a list of 10,000 items accessed by random index, each access is O(n)
- Worst case: 10,000 * 10,000 = 100,000,000 pointer hops!

ArrayList.get(i) is O(1): arr[i] = base_addr + (i * element_size)

**Performance impact:** 

- LinkedList: ~100ms per 1000 random accesses
- ArrayList:  ~1ms per 1000 random accesses
- 100x slowdown from the wrong variant choice

**Rule:** 

- Use ArrayList (or array) when you need random access by index.
- Use LinkedList ONLY when you need O(1) insert/delete at known position
  (especially head/tail) without index-based access.
- For most "list of items" use cases, ArrayList is correct.

## Failure Mode 2: ArrayList Resizing Storm Under High-Churn Insertion

### Context

A queue-like system processes 1M items/second. Developer uses ArrayList
with default growth strategy.

**The bug:** 

- Default growth: newCapacity = oldCapacity + (oldCapacity >> 1)
- This means: capacity grows by 1.5x each resize
- Initial: 10 → 15 → 22 → 33 → 49 → 73 → 109 → 163 → 244 → ...

At high insertion rate, the array must be:

1. Allocated at new size
2. All existing elements copied (System.arraycopy)
3. Old array GC'd

If insertions outpace growth:

- Each resize copies ALL elements (O(n) per resize)
- Frequent resize = O(n^2) total copy overhead
- GC pressure from temporary oversized arrays

**Mitigation:** 

- If size is known: new ArrayList<>(knownSize)
- If rate is predictable: pre-allocate with buffer
- For true queue semantics: use ArrayDeque or circular buffer
- Monitor: array resize events correlate with latency spikes

## Failure Mode 3: Bloom Filter False Positive Causing User-Visible Bug

### Context

Caching layer uses Bloom filter to check "is key in cache?" before Redis.
Developer sets 10M elements, 1M bits (m=1,000,000, n=10,000,000).

**The math:** 

False positive rate formula: FPR = (1 - e^(-kn/m))^k
Where: k = hash functions, n = elements, m = bits

With k=10, n=10M, m=1M:

```text
FPR = (1 - e^(-10*10M/1M))^10
= (1 - e^(-100))^10
≈ (1 - 3.7e-44)^10
≈ 0.9999999...
≈ 99.99% false positive rate!
```

- Optimal k for given n/m: k_optimal = (m/n) * ln(2)
- For m=1M, n=10M: k_optimal = (1/10) * 0.693 = 0.069 ≈ 1 hash!
- With k=1: FPR = (1 - e^(-10))^1 ≈ 99.995% anyway!

**The failure:** Bloom says "key exists" but Redis has nothing → null pointer
exception in application code that trusted the cache layer.

PROPER SIZING (for 1% FPR):

- m_needed = -n * ln(FPR) / (ln(2)^2)
- For n=10M, FPR=0.01: m = -10M * ln(0.01) / 0.48 ≈ 95MB (760M bits)
- Always size Bloom filter based on expected n and desired FPR, not guesses.

## Failure Mode 4: B-tree vs LSM-tree Write Amplification

### Context

High-write workload (IoT sensor ingestion, 100K writes/sec). Team debates
B-tree (PostgreSQL) vs LSM-tree (RocksDB).

**The problem:** Write Amplification Factor (WAF)

WAF = bytes_written_to_disk / bytes_application_wrote

B-tree WAF: 10x to 50x

- Each write: random I/O to update leaf + traverse root-to-leaf
- Page splits propagate upward (multiple page writes)
- For 1 byte update: may write 10-50 bytes to disk

LSM-tree WAF: 5x to 20x (for sorted flushes/merges)

- Writes go to memory (memtable) — no disk I/O initially
- Periodic flush: sequential write of sorted run
- Compaction: merges sorted runs, but writes are sequential

REAL NUMBERS (Dell SSD, 100K writes/sec):

- B-tree: ~500K IOPS consumed, SSD wear in 2 years
- LSM-tree: ~150K IOPS consumed, better SSD longevity

**Read/write trade-off:** 

| Metric | B-tree | LSM-tree |
| ------ | ------ | -------- |
| Write speed | Slow (≈10K/s) | Fast (≈100K/s) |
| Read speed | Fast (single I/O) | Slower (merge I/O) |
| Write amplification | 10–50× | 5–20× |
| Space amplification | 1.5× | 1.5–2× (overhead) |
| Best for | Read-heavy OLTP | Write-heavy workloads |

> [!TIP]
> **Rule:** write-heavy? Use an LSM-tree. Read-heavy? Use a B-tree. (Figures are illustrative orders of magnitude.)

---

[← 1.5 Skip List](05_skip_list.md) | [Chapter overview](../02a_DS_Variants_Core.md) | [University-Level Addendum — Core Variants… →](07_university_level_addendum_core_variants_as.md)
