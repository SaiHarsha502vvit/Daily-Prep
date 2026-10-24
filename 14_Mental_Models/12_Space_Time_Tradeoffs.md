> **Navigation**: [< Previous](11_Greedy_vs_DP_Decision.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Pattern_Composition.md)

> **Mental Model 12** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 SPACE-TIME TRADEOFFS — WHEN TO TRADE MEMORY FOR SPEED

## The Fundamental Law

SPEED ←──────────────── TRADEOFF ──────────────────→ MEMORY
Almost every algorithm optimization is a space-time tradeoff:

- Use MORE memory → get FASTER time
- Use LESS memory → accept SLOWER time

**Examples**:
┬──────────────┬
| Technique | Space Cost | Time Saved |
┼──────────────┼
| Hash Map lookup | O(n) extra | O(n) → O(1) lookup |
| Memoization (DP) | O(states) | Exponential → Poly |
| Precomputed prefix sum | O(n) extra | O(n) → O(1) range |
| Sorting in-place | O(1) extra | O(n²) comparison |
| Trie vs re-scanning | O(Σ chars) | O(n×m) → O(m) |
| Adjacency matrix | O(V²) more | O(1) edge lookup |
| Adj list | O(V+E) less | O(degree) edge check |
┴──────────────┴

## The Memory Hierarchy Reality (Beyond Big-O)

Big-O notation assumes all memory accesses cost the same $O(1)$. **In reality, memory access costs vary by orders of magnitude.** The CPU doesn't read RAM one byte at a time; it fetches 64-byte chunks called "cache lines" into ultra-fast L1/L2 caches.

| Memory Layer          | Latency   | DSA / Systems Implication                             |
| :-------------------- | :-------- | :---------------------------------------------------- |
| **L1 Cache**          | ~1-2 ns   | Fits small arrays ($\sim$64KB). Extremely fast.       |
| **L2 Cache**          | ~4-10 ns  | Per-core cache ($\sim$1MB).                           |
| **L3 Cache**          | ~40-75 ns | Shared across cores ($\sim$30MB).                     |
| **Main Memory (RAM)** | ~100+ ns  | Random access here is a "Cache Miss". Extremely slow. |

**The Linked List vs Array Reality Check:**

A Linked List traversal is $O(n)$. An Array traversal is $O(n)$.

However, an Array is **contiguous in memory**. Fetching index 0 loads indices 1-15 into the L1 cache simultaneously. The next 15 loop iterations take 1 nanosecond each (Cache Hits).

A Linked List's nodes are scattered randomly across the heap. Every `.next` pointer dereference likely triggers a RAM Cache Miss (100 nanoseconds).

**Result:** Array traversal can be 10x to 50x faster than Linked List traversal in the real world, despite both being mathematically $O(n)$.

**Rule of Thumb:** Always prefer contiguous memory (Arrays) over scattered memory (LinkedLists, Trees, complex object graphs) when raw speed is critical.

## The Decision Framework

**Ask Yourself**:

1. WHAT IS THE BOTTLENECK?

- If time is bottleneck (TLE) → trade space for time
- If space is bottleneck (MLE) → trade time for space
- If both are tight → find a middle ground

2. CAN I PRECOMPUTE?

- Repeated lookups → build a map/set first
- Range queries → prefix sums, sparse tables
- Repeated string matching → build trie/suffix array

3. CAN I CACHE?

- Overlapping subproblems → memoization/tabulation
- API calls → LRU cache
- Computation results → hash map cache

4. CAN I COMPRESS?

- Sparse data → coordinate compression
- Boolean array → bit manipulation
- Rolling hash → fixed window instead of storing all

## Classic Tradeoff Examples In Dsa

- EXAMPLE 1: TWO SUM (LC 1)
  - Brute force: O(n²) time, O(1) space — check every pair
  - Hash map: O(n) time, O(n) space — lookup complement in O(1)
  - → Trade O(n) space to save O(n) time factor. WORTH IT.
- EXAMPLE 2: FIBONACCI
  - Recursive: O(2ⁿ) time, O(n) stack space
  - Memo (cache): O(n) time, O(n) space — cache all results
  - Bottom-up: O(n) time, O(1) space — only keep last 2
  - → DP caches to avoid recomputation. Bottom-up further optimizes space.
- EXAMPLE 3: SUBARRAY SUM EQUALS K (LC 560)
  - Brute force: O(n²) — check every subarray
  - Prefix sum map: O(n) time, O(n) space — store prefix freq
  - → Trade O(n) space to avoid O(n) inner loop. WORTH IT.
- EXAMPLE 4: GRAPH REPRESENTATION
  - Dense graph (many edges): adjacency matrix O(V²) space, O(1) edge check
  - Sparse graph (few edges): adjacency list O(V+E) space, O(degree) check
  - → Choose representation based on graph density.
- EXAMPLE 5: DP SPACE OPTIMIZATION
  - 2D DP table: O(n×m) space
  - 1D rolling: O(m) space — if current row only depends on previous row
  - → Knapsack, LCS, Edit Distance all reduce from 2D to 1D.
- EXAMPLE 6: BIT PACKING
  - Boolean array visited[10000]: 10KB
  - Bitset: 10000/8 = 1.25KB
  - → 8× space reduction. Time slightly worse (bit operations).

🔬 **Section Challenge — Classic Tradeoff Examples In Dsa**

**Challenge 1 (Reasoning):** HashMap lookup is O(1) and binary search on a sorted array is O(log N). Yet for N < 1000, the sorted array can be _faster_ in practice. Why?

<details><summary>Answer</summary>

HashMap O(1) is _amortized_ and hides constant factors: hash computation, modulo operation, possible collision chaining, and — critically — _random memory access_ to the bucket array. Each lookup may cause a cache miss (~100+ cycles for L2/L3). A sorted array binary search does O(log 1000) ≈ 10 comparisons, but the array is _contiguous in memory_. For small N, the entire array fits in L1 cache (64KB). Each comparison is ~4 cycles with cache hits. Total: ~40 cycles vs HashMap's ~100+ cycles per lookup. **The lesson**: Big-O ignores constant factors and cache behavior. For small N, cache-friendly O(log N) beats cache-hostile O(1). This is why Java's `Arrays.sort()` switches to insertion sort for N < 47.

</details>

## The "When Not To Trade" Guide

DON'T trade space for time when:

- Problem says "O(1) extra space" → use in-place algorithms
- Memory is extremely limited (embedded systems, competitive programming)
- The time improvement is marginal (O(n log n) → O(n) not worth O(n) map)
- Data is too large to fit in memory (streaming problems)
  DON'T trade time for space when:
- O(n²) is already too slow and space reduction won't help
- The algorithm is inherently cache-unfriendly (random access kills perf)
- Recomputation cost is astronomical (deep recursion without memo)

**The Interview Rule**:
- In interviews, ALWAYS prefer time over space unless explicitly asked.
- Say: "I'll use a hash map for O(1) lookup, trading O(n) space."
- If interviewer pushes for O(1) space, THEN optimize.

## Common Space-Time Tools

| TOOL | SPACE COST | TIME BENEFIT | USE WHEN |
══════════════════╪════════════╪══════════════╪════════════════════════
| HashMap/HashSet | O(n) | O(1) lookup | Need fast contains/lookup |
| Prefix Sum Array | O(n) | O(1) range | Multiple range sum queries |
| Memoization | O(states) | Exp → Poly | Overlapping subproblems |
| Trie | O(Σ chars) | O(len) match | Prefix-based lookups |
| Segment Tree | O(n) | O(log n) upd | Range query with updates |
| Sparse Table | O(n log n) | O(1) query | Static range min/max |
| Suffix Array | O(n) | O(log n) pat | Pattern matching in strings |
| Bloom Filter | O(m bits) | O(1) lookup | Probabilistic membership |
| Sorted Array | O(1) extra | O(log n) binS| Ordered data, binary search |
| Index/Reverse Map | O(n) | O(1) reverse | Value → position lookups |

---

## 🎯 INTERVIEW SCRIPT

> "The brute force is O(n²) time / O(1) space. I can trade O(n) space for a hash map to bring time down to O(n). In most real systems, memory is cheap and latency is expensive, so this trade is worth it."

If follow-up asks for O(1) space:

> "I can use the input array itself as storage [if applicable], or use bit manipulation / two pointers to avoid extra allocations."

## NEW DIAGRAM — Memory Hierarchy Pyramid with Latency Annotations

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Memory Hierarchy Pyramid — Speed vs Capacity Tradeoff              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE FUNDAMENTAL TRUTH:                                                        │
│  "The CPU does not read RAM one byte at a time. It fetches 64-byte cache      │
│   lines into ultra-fast L1/L2 caches. Memory access costs vary by             │
│   100x to 1000x depending on WHERE data lives."                               │
│                                                                              │
│                           ▲ CAPACITY (grows ↓)                                │
│                          ╱  SPEED  (grows ↑) ╲                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │     ╔════════════════════════════════════════╗                        │   │
│  │     ║  L1 CACHE   (~64 KB per core)         ║  LATENCY: ~1-2 ns      │   │
│  │     ║  ⚡ Fastest — fits entire small array ║  CYCLES:  4-5          │   │
│  │     ╠════════════════════════════════════════╣                        │   │
│  │     ║  L2 CACHE   (~1 MB per core)          ║  LATENCY: ~4-10 ns     │   │
│  │     ║  ⚡ Fast — array of 10K elements      ║  CYCLES:  12-20        │   │
│  │     ╠════════════════════════════════════════╣                        │   │
│  │     ║  L3 CACHE   (~30 MB shared)           ║  LATENCY: ~40-75 ns    │   │
│  │     ║  ⚡ Shared across all cores           ║  CYCLES:  40-75        │   │
│  │     ╠════════════════════════════════════════╣                        │   │
│  │     ║  MAIN MEMORY (RAM)   (GB range)       ║  LATENCY: ~100+ ns     │   │
│  │     ║  ⚡ Cache miss = slow fetch           ║  CYCLES:  100+         │   │
│  │     ╠════════════════════════════════════════╣                        │   │
│  │     ║  SSD / NVMe     (TB range)           ║  LATENCY: ~100,000 ns  │   │
│  │     ║  ⚡ Persistent storage               ║  CYCLES:  ~100,000     │   │
│  │     ╠════════════════════════════════════════╣                        │   │
│  │     ║  HDD            (TB range)           ║  LATENCY: ~10,000,000+ │   │
│  │     ║  ⚡ Slowest — disk seek required     ║  CYCLES:  10M+         │   │
│  │     ╚════════════════════════════════════════╝                        │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  SPEED FACTORS:                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  CONTIGUOUS vs SCATTERED:                                              │    │
│  │                                                                        │    │
│  │  Array (contiguous in memory):                                         │    │
│  │    Fetch arr[0] → loads arr[0..63] into L1 cache (64 bytes)           │    │
│  │    Access arr[1..15]   → all cache HITS (already in L1) → 1 ns each  │    │
│  │    Total for 16 elements → ~16 ns                                      │    │
│  │                                                                        │    │
│  │  Linked List (scattered nodes in heap):                                │    │
│  │    Fetch head → cache miss → RAM fetch → 100 ns                       │    │
│  │    Follow .next      → another miss → another 100 ns                  │    │
│  │    Total for 16 nodes → ~1600 ns (100x slower!)                        │    │
│  │                                                                        │    │
│  │  RESULT: Array traversal can be 10x to 100x FASTER than Linked List   │    │
│  │          traversal, despite both being O(n) in Big-O notation!        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SPACE-TIME TRADEOFF DECISION:                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Want SPEED? → Use MORE memory (cache, memoize, precompute)           │    │
│  │  Want LESS MEMORY? → Accept SLOWER time (recompute, on-demand)        │    │
│  │                                                                        │    │
│  │  Examples:                                                             │    │
│  │  HashMap lookup: O(1) time + O(n) space vs linear scan: O(n) + O(1)  │    │
│  │  Prefix sum: O(1) query + O(n) space vs recompute: O(n) + O(1)       │    │
│  │  Memoized fib: O(n) time + O(n) space vs raw: O(2^n) + O(n)         │    │
│  │  Adjacency matrix: O(1) edge check + O(V^2) space vs adj list        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1970 | Bloom | Bloom filter — probabilistic space-time tradeoff |
| 1977 | Boyer-Moore | Pattern matching — skip-lookup tradeoff |
| 1977 | Knuth-Morris-Pratt | Linear pattern matching — automaton tradeoff |
| 1987 | Rabin-Karp | Rolling hash — arithmetic-pattern tradeoff |
| 1981 | Yao | Cell-probe model — lower bound for space-time tradeoffs |

**Evolution narrative**: The systematic study of space-time tradeoffs began as computer science matured beyond single-resource optimization. Burton Bloom's 1970 Bloom filter introduced the fundamental insight that probabilistic data structures can achieve extreme space efficiency at the cost of false positives — the tradeoff is not between precise space and time but between exact and probabilistic. The 1977 pattern matching algorithms (Boyer-Moore, KMP, Rabin-Karp) each embodied different space-time tradeoffs: Boyer-Moore uses preprocessing space for suffix information to skip ahead; KMP uses an automaton to avoid rescanning; Rabin-Karp uses hash space to reduce string comparison to integer comparison. Andrew Yao's 1981 cell-probe model provided the theoretical lower bounds for space-time tradeoffs, proving that any algorithm with space S must make at least Omega(log N / log(S)) probes — formalizing that some tradeoffs are mathematically impossible to beat.

**Modern practice anchor**: Today's system design thinking (caching, Bloom filters in distributed systems, LRU caches) directly uses the Bloom filter tradeoff framework, while the cache hierarchy insight (L1/L2/L3/RAM latencies) provides the practical reality check that pure Big-O analysis misses: algorithmic O(n) can still be faster than theoretical O(1) when cache effects are considered.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: False Sharing — Cache-Line Ping-Pong Between Threads

**What goes wrong**: Two threads update different counters. In memory, the counters happen to share the same 64-byte cache line (CPU cache unit). When thread A writes to counter A, the cache line is marked dirty and exclusive on A's core. When thread B writes to counter B 50 nanoseconds later, the cache line must be invalidated on A and transferred to B's cache — a cache-line ping-pong across the memory bus. Throughput drops 5-10x compared to single-threaded performance.

**Cost**: Multi-threaded performance worse than single-threaded. p99 latency spikes for high-QPS services. Typically manifests during load testing as "the service scales poorly beyond 4 cores."

**Debug workflow**:
1. Use `perf stat -e cache_references,cache_misses` to check cache hit/miss ratios. A high cache miss rate with low computational work signals false sharing.
2. Use `ThreadSanitizer` (TSAN) or Intel VTune to identify "Load-User`on`Store" events — the signature of false sharing.
3. Add `@Contended` annotation (Java 8+) or `__attribute__((aligned(64)))` padding to separate frequently-updated fields in structs. In C++: use `std::hardware_destructive_interference_size` (C++17) for correct padding.
4. Use `disruptor` pattern or per-thread local aggregation: each thread accumulates locally, then publishes the final result — eliminating cross-thread writes on the hot path.

### Failure Mode 2: JVM Warm-Up Penalty — TieredCompilation Delay

**What goes wrong**: A latency-sensitive Java service starts up and immediately handles traffic. The JIT compiler hasn't warmed up — interpreted code runs at 10-50x slower than JIT-compiled code. The first 100-1000 requests experience 10-50ms latency instead of the expected 1ms. For a real-time trading or gaming service, this is a permanent SLA violation at startup.

**Cost**: Cold-start latency spike. Users during the first 5-10 minutes of service operation get degraded experience. Monitoring dashboards show "warm-up anomaly" at every deployment. At $5,000/minute incident cost for latency-sensitive services, repeated warm-up spikes add up.

**Debug workflow**:
1. Use `-XX:+PrintCompilation` flag to log JIT compilation events. Identify which methods are compiled late and are on the hot path.
2. Use `-XX:CompileThreshold=1000` (reduce warm-up time for critical methods) or GraalVM Native Image for instant warm-up (0ms compile time).
3. Implement a warm-up script: before taking production traffic, send representative traffic for 5-10 minutes to trigger JIT compilation of all hot paths.
4. Use `-XX:+TieredCompilation` (default in Java 8+) and monitor `CompilationStatistics` — if a method exceeds the `遲` compile threshold before it's compiled, increase the threshold for that specific method.

### Failure Mode 3: Hash Collision DOS — Known String Flooding

**What goes wrong**: An attacker sends requests with keys crafted to collide in the same HashMap bucket (e.g., all keys hash to index 0). The HashMap degrades from O(1) to O(n) per lookup. At 50,000 QPS, a single HashMap lookup taking O(n) (n=1000 entries) = 1000 operations × 50,000 QPS = 50 million CPU cycles/sec. CPU saturates, all requests back up, service is unavailable.

**Cost**: Service unavailability for all users. Used in CVE-2011-4858 (Apache Tomcat hash collision DOS), CVE-2012-2739, and multiple Node.js incidents.

**Debug workflow**:
1. Use `MapMaker` with `STRONG` hashing disabled and `String` hash seeds derived from `SecureRandom`, or use `ConcurrentHashMap` with `MURMUR3` hash (Java 8+).
2. Enable rate limiting per client IP and per API key — block clients sending many requests with colliding key patterns.
3. Monitor HashMap bucket chain lengths in telemetry: if p99 bucket size exceeds threshold, switch to a tree-based fallback (`java.util.HashMap` switches to red-black tree at >8 entries in a bucket since Java 8).
4. Use `java.security.SecureRandom` to seed per-process hash randomization: prevents pre-computation of colliding keys by attackers.

### Failure Mode 4: Bloom Filter False Positive — Edge Case Data Leaked to Wrong Users

**What goes wrong**: A Bloom filter is used to check "is this user authorized to access this resource?" (quick negative check). A false positive means the filter says "YES, might be authorized" when the user is not. If the downstream check (DB lookup) is skipped because the Bloom filter said YES, unauthorized users can access restricted resources.

**Cost**: Data breach. Unauthorized data access for any user whose ID happens to false-positive. GDPR/regulatory violations. Security incident requiring disclosure.

**Debug workflow**:
1. Never use Bloom filter for authorization checks where false positives cause security violations. Use Bloom filter only for non-security decisions (e.g., "should I check the DB cache?").
2. Bound false positive rate precisely: use `m = -n * ln(p) / (ln(2)^2)` where `p` = desired false positive rate. For n=1M users and p=0.01, m ≈ 9.6M bits = 1.2 MB. Verify this formula in code comments.
3. Monitor false positive rate in production telemetry: if observed false positive rate exceeds designed rate (e.g., due to hash function degradation), alert and increase filter size.
4. For security-sensitive use cases, use a counting Bloom filter with delete capability, or replace with a deterministic Cuckoo filter which has guaranteed false-positive bounds.

### Modern Production Tools

- **Intel VTune Profiler**: Identify false sharing and cache-line contention at the CPU level. Shows `Memory Bound` metric and `Cache Hits` breakdown per thread.
- **JDK Mission Control (JMC) + Flight Recorder**: Record JVM compilation and warm-up events. Identify which methods are compiled late and contribute to cold-start latency.
- **`@Contended` annotation (Java 8+)**: Prevents false sharing for annotated fields by padding to cache line boundaries. Use for all hot counter fields in concurrent data structures.
- **SipHash**: Cryptographically secure hash function that prevents hash collision DOS attacks. Python dict uses it; for Java, wrap HashMap with `Collections.synchronizedMap` using SipHash seed.
- **Cuckoo Filter / XOR Filter**: Deterministic alternatives to Bloom filter with guaranteed false-positive bounds — use for high-security membership checks where Bloom filter false positives are unacceptable.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Cache hierarchy makes **locality = speed** — memory that's close to the CPU is faster than memory that's far. The invariant is the memory hierarchy: registers (1 cycle) < L1 cache (4 cycles) < L2 cache (12 cycles) < L3 cache (40 cycles) < main memory (200 cycles) < SSD (100,000 cycles) < HDD (10,000,000 cycles). Accessing data that was accessed recently (temporal locality) or accessing adjacent data (spatial locality) keeps it in faster cache levels. The internal mechanism is that any data structure that scatters memory accesses across large gaps — linked lists, trees with node-per-allocation, hash maps with poor bucket distribution — causes cache misses that dominate execution time. The trade-off is memory vs speed: caching (memoization, LRU, Bloom filters) costs memory but enables O(1) lookups by keeping frequently-used data in fast storage.

### Variants Comparison

| Caching Strategy | Memory Overhead | Lookup Time | False Positives | Best Use Case |
| --- | --- | --- | --- | --- |
| Memoization (DP) | O(n) additional | O(1) | None | Repeated subproblem computation |
| LRU Cache | O(capacity) | O(1) with linked hash | None | Recently-used working set |
| LFU Cache | O(capacity) | O(1) with frequency heap | None | Hot items with frequency skew |
| Bloom Filter | O(1) bits per item | O(1) | Yes (configurable) | Set membership (probabilistic) |
| Cuckoo Filter | O(1) bits per item | O(1) | Yes (lower than Bloom) | Set membership with deletion |
| Bitset | O(n) bits fixed | O(1) | None (exact) | Boolean set for bounded range |

### Decision Table

| Data Access Pattern | Default Choice | When to Switch |
| --- | --- | --- |
| Repeated subproblems in DP/recursion | Memoization | Memory pressure → tabulation |
| Hot set with eviction needed | LRU cache | Frequency skew known → LFU |
| Probabilistic membership check | Bloom filter | Need deletion → Cuckoo filter |
| Boolean array for bounded range | Bitset | Range too large → compressed bitset |
| Batch precomputation | Prefix sum array | Updates needed → Fenwick tree |
| Online vs offline algorithm | Depends on latency requirement | Offline can pre-sort, online needs incremental |


---

## Reality Check

**"Space-time tradeoff means caching things"** — Caching is one square of a larger board: precomputation (prefix tables trading build time for query time), representation duplication (heap AND map onto the same data, each serving its operation), recomputation-on-purpose (streaming a second pass instead of buffering — trading time to AVOID space), and compression (bitmasks trading CPU decode for footprint). The model is directional: you can spend either currency to buy the other, and half the interesting engineering spends time to save space, not the reverse.

**"More memory always buys more speed"** — Past cache boundaries, memory SPENDS speed: the lookup table that outgrows L2 loses to recomputation (a multiply is 1ns; a RAM miss is 100ns — recomputing beats remembering whenever the formula is cheaper than the miss), pointer-rich structures lose to compact recomputing loops, and memoization of cheap functions costs more in map overhead than it saves. The mental model needs the hardware floor: space purchases speed only while the space stays HOT.

**"The tradeoff is chosen once per algorithm"** — Real systems place the SAME data at multiple points simultaneously along the curve: hot rows in a cache (space for speed), cold logs compressed (speed for space), indexes on some columns (write-time for read-time), and TTLs constantly renegotiating the position. The design skill is per-access-pattern placement — and the interview version is recognizing that "optimize this function" often means "move THIS call site along the curve, leave the rest."

**"Hash maps are the canonical space-for-time move, always worth it"** — The map's O(n) space buys O(1) lookup — but sorted-input problems often offer the same speed for O(1) space (two pointers), bounded-value problems offer arrays (smaller constant, same asymptotics), and bit-level problems offer masks (64 booleans in a word). The reflex "throw a HashMap at it" is usually CORRECT and occasionally the exact thing the follow-up question exists to remove ("now in O(1) space") — so hold the map loosely and know its three cheaper cousins.

**"Streaming constraints are exotic"** — One-pass-limited-memory is the NORMAL regime for logs, network data, and anything at scale — and it inverts the tradeoff instincts: exact answers become impossible (distinct-count in bounded memory is provably approximate — HyperLogLog), sampling replaces retention (reservoir sampling), and sketches trade CORRECTNESS-precision for space (Bloom filters saying "definitely not or probably yes"). The mental model extension: beyond spending time or space, you can spend EXACTNESS — the third currency, and the one modern systems spend first.
