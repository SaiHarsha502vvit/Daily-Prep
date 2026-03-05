> **Navigation**: [< Previous](11_Greedy_vs_DP_Decision.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Pattern_Composition.md)

> **Mental Model 12** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 SPACE-TIME TRADEOFFS — WHEN TO TRADE MEMORY FOR SPEED

## The Fundamental Law

SPEED ←──────────────── TRADEOFF ──────────────────→ MEMORY
Almost every algorithm optimization is a space-time tradeoff:
- Use MORE memory   → get FASTER time
- Use LESS memory   → accept SLOWER time

**Examples**:
┬──────────────┬
| Technique               | Space Cost   | Time Saved |
┼──────────────┼
| Hash Map lookup         | O(n) extra   | O(n) → O(1) lookup |
| Memoization (DP)        | O(states)    | Exponential → Poly |
| Precomputed prefix sum  | O(n) extra   | O(n) → O(1) range |
| Sorting in-place        | O(1) extra   | O(n²) comparison |
| Trie vs re-scanning     | O(Σ chars)   | O(n×m) → O(m) |
| Adjacency matrix        | O(V²) more   | O(1) edge lookup |
| Adj list                | O(V+E) less  | O(degree) edge check |
┴──────────────┴
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

EXAMPLE 1: TWO SUM (LC 1)
Brute force: O(n²) time, O(1) space — check every pair
Hash map:    O(n) time, O(n) space — lookup complement in O(1)
→ Trade O(n) space to save O(n) time factor. WORTH IT.
EXAMPLE 2: FIBONACCI
Recursive:    O(2ⁿ) time, O(n) stack space
Memo (cache): O(n) time, O(n) space — cache all results
Bottom-up:    O(n) time, O(1) space — only keep last 2
→ DP caches to avoid recomputation. Bottom-up further optimizes space.
EXAMPLE 3: SUBARRAY SUM EQUALS K (LC 560)
Brute force: O(n²) — check every subarray
Prefix sum map: O(n) time, O(n) space — store prefix freq
→ Trade O(n) space to avoid O(n) inner loop. WORTH IT.
EXAMPLE 4: GRAPH REPRESENTATION
Dense graph (many edges): adjacency matrix O(V²) space, O(1) edge check
Sparse graph (few edges): adjacency list O(V+E) space, O(degree) check
→ Choose representation based on graph density.
EXAMPLE 5: DP SPACE OPTIMIZATION
2D DP table: O(n×m) space
1D rolling: O(m) space — if current row only depends on previous row
→ Knapsack, LCS, Edit Distance all reduce from 2D to 1D.
EXAMPLE 6: BIT PACKING
Boolean array visited[10000]: 10KB
Bitset: 10000/8 = 1.25KB
→ 8× space reduction. Time slightly worse (bit operations).
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
In interviews, ALWAYS prefer time over space unless explicitly asked.
Say: "I'll use a hash map for O(1) lookup, trading O(n) space."
If interviewer pushes for O(1) space, THEN optimize.
## Common Space-Time Tools

| TOOL              | SPACE COST | TIME BENEFIT | USE WHEN |
══════════════════╪════════════╪══════════════╪════════════════════════
| HashMap/HashSet   | O(n)       | O(1) lookup  | Need fast contains/lookup |
| Prefix Sum Array  | O(n)       | O(1) range   | Multiple range sum queries |
| Memoization       | O(states)  | Exp → Poly   | Overlapping subproblems |
| Trie              | O(Σ chars) | O(len) match | Prefix-based lookups |
| Segment Tree      | O(n)       | O(log n) upd | Range query with updates |
| Sparse Table      | O(n log n) | O(1) query   | Static range min/max |
| Suffix Array      | O(n)       | O(log n) pat | Pattern matching in strings |
| Bloom Filter      | O(m bits)  | O(1) lookup  | Probabilistic membership |
| Sorted Array      | O(1) extra | O(log n) binS| Ordered data, binary search |
| Index/Reverse Map | O(n)       | O(1) reverse | Value → position lookups |

---

## 🎯 INTERVIEW SCRIPT

> "The brute force is O(n²) time / O(1) space. I can trade O(n) space for a hash map to bring time down to O(n). In most real systems, memory is cheap and latency is expensive, so this trade is worth it."

If follow-up asks for O(1) space:
> "I can use the input array itself as storage [if applicable], or use bit manipulation / two pointers to avoid extra allocations."

---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md)
