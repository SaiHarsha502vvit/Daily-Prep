# 📌 Part 14: When to Use What (decision Flowchart)

> **Navigation**: [← Quadtree (Spatial Indexing)](04_quadtree_spatial_indexing.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md)
> Page 5 of 5 in **Fenwick & Segment Trees — Advanced Data Structure Patterns**


**START: What problem are you solving?**

- Need KEY-VALUE lookup?
- Keys are strings with prefix search? → TRIE
- Need O(1) operations? → HASH MAP
- Need ordered keys? → TREE MAP (Red-Black)

- Need RANGE operations?
- Static array, many queries? → SPARSE TABLE
- Updates needed?
  - Point update + range query? → SEGMENT TREE or FENWICK
  - Range update + range query? → SEGMENT TREE with LAZY PROP
- Range minimum specifically? → SPARSE TABLE (if static)

- Need to track CONNECTIVITY?
- Merge sets dynamically? → DISJOINT SET (UNION-FIND)

- Need ORDERING with fast access?
- Min/Max quickly? → HEAP / PRIORITY QUEUE
- Next greater/smaller? → MONOTONIC STACK
- Sliding window max? → MONOTONIC DEQUE

- Need SPATIAL queries?
- 2D points? → QUADTREE
- Higher dimensions? → KD-TREE
- Rectangles? → R-TREE

- Need APPROXIMATE membership?
- Fast "definitely not" check? → BLOOM FILTER

- Need CACHING?
- Least recently used eviction? → LRU CACHE
- Least frequently used eviction? → LFU CACHE

- Need INTEGRITY verification?
  - Efficient proof of data? → MERKLE TREE

---



---

## Deep Dive — The Fenwick Tree, Built From the Problem That Forces It

### Step 0 — The problem that creates the need

You have an array of 1,000,000 numbers. You must answer two kinds of request, interleaved, a million times each:

- `sum(l, r)` — total of `arr[l..r]`
- `update(i, x)` — add `x` to `arr[i]`

**Try the two obvious structures and watch both fail:**

| Structure | `sum(l,r)` | `update(i,x)` | 10⁶ of each |
|-----------|-----------|---------------|-------------|
| Plain array | O(n) scan | O(1) | 10⁶ × 10⁶ = **10¹² ops** → minutes |
| Prefix-sum array | O(1) (`pre[r]-pre[l-1]`) | O(n) (rebuild every prefix ≥ i) | 10⁶ × 10⁶ = **10¹² ops** → minutes |

Each structure is fast at *one* operation by paying O(n) on the *other*. The plain array commits everything to the cells; the prefix array commits everything to the totals. **The Fenwick tree exists to split the difference: nobody pays O(n), everybody pays O(log n).** That tradeoff — give up O(1) on the cheap op to rescue the expensive one — is the whole idea. Hold onto it; segment trees and sqrt-decomposition are the same bargain at different exchange rates (see the curve at the end).

### Step 1 — The structural idea: cover [1..i] with O(log i) pre-summed blocks

Prefix sums failed because one block (`pre[i]`) covered *everything* up to i, so one update touched it for every i ≥ that position. Plain arrays failed because each block covered *one* cell, so a query had to visit them all.

What if blocks came in **power-of-two lengths**? Then any prefix `[1..i]` is the concatenation of a few such blocks — exactly the binary representation of i. Example, i = 13 = `1101₂` = 8 + 4 + 1:

```
[1 .. 13]  =  [1..8]      ++  [9..12]   ++  [13..13]
              length 8        length 4      length 1
              (the "8" bit)   (the "4")     (the "1")
```

Three blocks instead of thirteen cells. The number of blocks = number of 1-bits in i ≤ ⌈log₂ i⌉. *That* is where the log comes from — not from a balanced tree you build, but from binary itself.

### Step 2 — Where each block lives: the index IS the address

Store the sum of each block at the index of its **last** element. So:

- `bit[13]` holds `[13..13]` (length 1)
- `bit[12]` holds `[9..12]` (length 4)
- `bit[8]`  holds `[1..8]`  (length 8)

The length of the block ending at index i is **the lowest set bit of i** — call it `lowbit(i)`. Check: 12 = `1100₂`, lowest set bit = `100₂` = 4 ✓. 8 = `1000₂`, lowest set bit = 8 ✓. 13 = `1101₂`, lowest set bit = 1 ✓. So:

> **The one invariant that defines a Fenwick tree:**
> `bit[i]` = sum of `arr[i - lowbit(i) + 1 .. i]` — a block of length `lowbit(i)` ending at i.

### Step 3 — Why `i & (-i)` is `lowbit(i)` (don't memorize — derive it)

Two's complement: `-i = (~i) + 1`. Flipping all bits then adding 1 has a precise effect — every bit *below* the lowest set bit is 0 in i, becomes 1 after `~`, then the `+1` carries all the way up through them and stops exactly at the lowest set bit, flipping it back. The bits *above* are the inverse of i's. Concretely, i = 12:

```
 i      = 0000 1100
 ~i     = 1111 0011
 ~i + 1 = 1111 0100   (= -i)
 i & -i = 0000 0100   ← only the lowest set bit survives the AND  = 4
```

Above the low bit, i and -i are bitwise opposites → AND gives 0. Below it, both are 0 → AND gives 0. *At* it, both are 1 → survives. So `i & (-i)` isolates exactly one bit, the lowest. This is the engine the whole structure runs on.

### Step 4 — Query: walk down by *stripping* the low bit

`prefixSum(i)` = sum the block ending at i, then jump to the index just before that block and repeat:

```
long prefixSum(int i) {        // sum of arr[1..i]
    long s = 0;
    while (i > 0) { s += bit[i]; i -= i & (-i); }
    return s;
}
```

Trace `prefixSum(13)` — watch i shed one bit per step:

```
i = 13 = 1101 → add bit[13] (covers [13..13]),  i -= 1  → 12
i = 12 = 1100 → add bit[12] (covers [9..12]),   i -= 4  → 8
i = 8  = 1000 → add bit[8]  (covers [1..8]),    i -= 8  → 0
stop. blocks visited: [13..13]+[9..12]+[1..8] = [1..13], no gaps, no overlap.
```

Each subtraction clears the lowest 1-bit, so the loop runs once per set bit ≤ log₂ i times. `sum(l, r) = prefixSum(r) - prefixSum(l-1)`.

### Step 5 — Update: walk up by *adding* the low bit

When `arr[i]` changes, every block that *contains* i must change. Those are found by repeatedly adding the low bit:

```
void update(int i, long delta) {   // arr[i] += delta
    for (; i <= n; i += i & (-i)) bit[i] += delta;
}
```

Trace `update(5, +3)`:

```
i = 5 = 0101 → bit[5]  covers [5..5]    ✓ contains 5,  i += 1 → 6
i = 6 = 0110 → bit[6]  covers [5..6]    ✓ contains 5,  i += 2 → 8
i = 8 = 1000 → bit[8]  covers [1..8]    ✓ contains 5,  i += 8 → 16
i = 16        → bit[16] covers [1..16]  ✓ contains 5,  i += 16 → 32 > n, stop
```

Every block we touched genuinely contains index 5, and we touched *only* those — adding the low bit is exactly the jump to the next-larger block whose range swallows the current one. Query strips bits going down; update adds bits going up. They are mirror images, and both run in O(log n) because a 32-bit (or 64-bit) integer has at most that many bit positions to add or strip.

### Why this is provably O(log n), stated as the loop facts

- **Query** subtracts `lowbit(i)` each step → strictly removes one set bit → terminates in (popcount of i) ≤ ⌊log₂ i⌋ + 1 steps.
- **Update** adds `lowbit(i)` each step → strictly increases i and at least carries one bit position upward → terminates in ≤ ⌊log₂ n⌋ + 1 steps before exceeding n.

No balancing, no rotations, no recursion, O(n) space, cache-friendly (one flat array). That's why competitive programmers reach for it before a segment tree whenever point-update + prefix-query is enough.

---

## The Range-Query Family — One Idea, Four Exchange Rates

Fenwick is not a trick to memorize in isolation. It is one point on a single tradeoff curve, and every "advanced" range structure is just a different point on the *same* curve: **how finely do you pre-aggregate, and what do you pay to keep those aggregates correct under updates?**

| Structure | Query | Update | Space | What it can aggregate | Pre-aggregation granularity |
|-----------|-------|--------|-------|----------------------|----------------------------|
| Plain array | O(n) | O(1) | O(n) | anything | none (one cell per block) |
| Prefix-sum array | O(1) | O(n) | O(n) | invertible only (sum, xor) | total (one block covers everything) |
| **Fenwick (BIT)** | O(log n) | O(log n) | O(n) | invertible only† | power-of-two blocks via binary |
| Segment tree | O(log n) | O(log n) | O(2n) | *any associative* op (min, max, gcd, sum) | explicit binary tree of intervals |
| Segment tree + lazy | O(log n) | O(log n) *range* update | O(2n) | associative + composable tag | same, with deferred propagation |
| Sqrt decomposition | O(√n) | O(1)/O(√n) | O(n) | anything | √n blocks, dead simple to code |
| Sparse table | **O(1)** | **impossible** | O(n log n) | idempotent (min/max/gcd) | every power-of-two window, precomputed |

†**The single most important reason to pick segment tree over Fenwick:** Fenwick's `sum(l,r) = prefix(r) − prefix(l−1)` needs an *inverse* (subtraction). Min and max have no inverse — you cannot recover `min(l..r)` from `min(1..r)` and `min(1..l−1)`. So **Fenwick does sum/xor; segment tree does min/max/gcd**. That one sentence decides the structure in 90% of problems.

**How to read the curve:** move down the table and you trade query/update *speed* against *generality* and *space*. Prefix-sum is the O(1)-query extreme (but O(n) update, sum-only). Sparse table is the *other* O(1)-query extreme (but zero update, idempotent-only). Fenwick and segment tree sit in the O(log n)/O(log n) sweet spot where both ops are cheap — Fenwick when subtraction is allowed and you want the smallest, fastest code; segment tree when the operation has no inverse or you need range updates. Sqrt decomposition is the "I'll accept O(√n) because it's 15 lines and I can't get the segment tree right under time pressure" option — and √(10⁶) = 1000, so for 10⁵ queries it's still ~10⁸ ops, often fine.

**Decision in one breath:** point update + prefix of an invertible op → **Fenwick**. Range query of a non-invertible op (min/max/gcd) → **segment tree**. Range *update* + range query → **segment tree with lazy propagation**. Static array, idempotent op, O(1) queries → **sparse table**. Can't recall the code under pressure → **sqrt decomposition**.

---

## When It Breaks -- Advanced DS Patterns

**1. Fenwick tree 0-indexed vs 1-indexed** -- BITs are naturally 1-indexed (lowbit(0) = 0, infinite loop). If your data is 0-indexed, always add +1 when inserting/querying. Forgetting this causes infinite loops or ArrayIndexOutOfBoundsException.

**2. Sparse table for mutable arrays** -- sparse tables support O(1) range minimum/maximum queries but require O(n log n) preprocessing and do NOT support updates. If the array changes, the sparse table must be rebuilt entirely. Use segment tree for mutable arrays.

**3. Union-Find without path compression on chain input** -- a union-find that uses union-by-rank but not path compression still achieves O(log n) per operation. But path compression alone (without union-by-rank) can still produce O(log n) amortised. Both together give O(alpha(n)). Omitting both on chain-like unions (always union smaller into larger) gives O(log n) per op, not O(alpha(n)).

**4. Skip list with poor random choices** -- the expected O(log n) height of a skip list assumes each level promotion happens with probability p=0.5 independently. Using a biased RNG (always promoting) produces a list with O(n) levels and O(n) search time. Production implementations use a cryptographically seeded RNG.

---

## Reference Anchor

**JDK has no built-in Fenwick tree or sparse table.** Production graph/query libraries:

```java
// Apache Commons Math -- no BIT, but has StatUtils for descriptive statistics
// For range queries in production, use database SQL window functions or
// pre-aggregated rollup tables rather than custom BIT/sparse-table.

// Guava -- RangeMap for interval-based lookups (different from range queries):
RangeMap<Integer, String> rangeMap = TreeRangeMap.create();
rangeMap.put(Range.closed(1, 10), "low");
rangeMap.put(Range.closed(11, 100), "mid");
String label = rangeMap.get(5); // "low" -- O(log n) lookup

// For competitive/interview use -- Fenwick tree Java idiom:
int[] bit = new int[n + 1]; // 1-indexed
// Update: for (int i = pos; i <= n; i += i & (-i)) bit[i] += val;
// Query: int s = 0; for (int i = pos; i > 0; i -= i & (-i)) s += bit[i];
// Range query [l, r]: query(r) - query(l-1)
```

---

_Master these structures, and you can build anything!_ 🚀

---

[← Quadtree (Spatial Indexing)](04_quadtree_spatial_indexing.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md)
