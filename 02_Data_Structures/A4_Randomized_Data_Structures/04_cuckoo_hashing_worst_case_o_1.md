# 6. Cuckoo Hashing — Worst-Case O(1) Lookup

> **Navigation**: [← 5. Bloom Filters — Membership with False…](03_bloom_filters_membership_with_false_positives.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [7. Count-Min Sketch — Frequency Estimation →](05_count_min_sketch_frequency_estimation.md)
> Page 4 of 7 in **A4. Randomized Data Structures — Probabilistic Guarantees in Storage**


## 💬 Study-Partner View — Cuckoo Hashing

**1. The bottom line:** Every key has exactly two possible homes, so a lookup checks at most two slots; inserts kick the current occupant to its other home.

**2. The textbook core:**

- Two hash functions `h₁`, `h₂` (two tables or one); `x` is stored at `h₁(x)` or `h₂(x)`.
- **Lookup and delete: worst-case O(1)** (two probes).
- Insert: place `x` at `h₁(x)`; if occupied, evict the occupant to *its* other slot, and repeat. On a long cycle, rehash with new functions.
- Expected insert O(1) while load stays below about 50% (higher with more hash functions or buckets).

**3. The real-world analogy:** The cuckoo bird **pushing eggs out of the nest**: a newcomer takes a spot and the previous owner has to move to their backup spot, which may push someone else.

**4. Walkthrough:**

1. `h₁(A) = 1`, `h₂(A) = 4`; `h₁(B) = 1`, `h₂(B) = 2`.
2. Insert A at slot 1. Insert B: slot 1 is taken → evict A to its other slot 4; B sits in 1.
3. Lookup A: check slot 1 (B) then slot 4 (A) → found in 2 probes.
4. If the eviction chain loops, rebuild the table with new hash functions.

> [!NOTE]
> **Quick check:** Why is lookup worst-case O(1) here but not in chaining? *A key can only be in one of two known slots.*


## Historical Context

**Pagh and Rodler (2001, Aarhus University)** introduced cuckoo hashing in *"Cuckoo Hashing"*. The name comes from the cuckoo bird, which kicks other birds' eggs out of nests — the same behavior the algorithm performs with keys. The key result: **O(1) worst-case lookup**, not just expected. This is remarkable because chained hashing and linear probing both have Ω(n) worst-case lookups.

## Structure Definition

Cuckoo hashing uses two hash functions h₁, h₂ mapping keys to two bucket positions. Each key is stored in exactly one of its two possible buckets.

```java
public class CuckooHashTable<T> {
    private Object[] buckets1;  // size m
    private Object[] buckets2;  // size m
    private final int m;
    private final HashFunction<T> h1, h2;

    public CuckooHashTable(int capacity) {
        this.m = capacity;
        this.buckets1 = new Object[m];
        this.buckets2 = new Object[m];
        this.h1 = new HashFunction<>(m);
        this.h2 = new HashFunction<>(m);
    }

    public boolean lookup(T key) {
        int i1 = h1.apply(key) % m;
        int i2 = h2.apply(key) % m;
        return key.equals(buckets1[i1]) || key.equals(buckets2[i2]);
    }
}
```

## Insert with Kicking

Insertion attempts to place the key in its first bucket. If that bucket is occupied, the existing key is evicted (kicked out) and reinserted into its alternate bucket:

```java
public void insert(T key) {
    if (lookup(key)) return;  // Already present

    int kickLimit = 1000;  // Prevent infinite loops
    T x = key;
    int i = -1;  // which table (-1 = not yet placed)

    for (int step = 0; step < kickLimit; step++) {
        if (i == -1) {
            i = 1;
            int idx = h1.apply(x) % m;
            T existing = (T) buckets1[idx];
            buckets1[idx] = x;
            x = existing;
            if (x == null) return;  // Placed successfully
        } else if (i == 1) {
            i = 2;
            int idx = h2.apply(x) % m;
            T existing = (T) buckets2[idx];
            buckets2[idx] = x;
            x = existing;
            if (x == null) return;
        } else {
            i = 1;
        }
        // Alternate between tables
    }

    // Relocate: rehash entire table (rare)
    rehash(x);
}

private void rehash(T remainingKey) {
    // Double table size and reinsert all elements
    // This is O(n) but extremely rare (< 1/n with good parameters)
}
```

## Analysis: Expected O(1) Insert, Worst-Case O(1) Lookup

**Lookup**: Check two buckets — O(1) worst case. ✓

**Insert**: The kicking chain is a random walk. With load factor α < 1/2, the expected number of kicks is O(1). The analysis uses the same Chernoff bounds as skip list height: each kick has a constant probability of successfully placing the key.

The **stash improvement** (Kirsch et al. 2008) adds a small additional array (stash) that can hold up to s elements. When a cycle is detected, the kicked element is placed in the stash. With a stash of size 10, the failure probability becomes < 1/10^9 even at load factor 0.97.

## Comparison with Chained Hashing

| Property | Cuckoo Hash | Chained Hash |
|---|---|---|
| Lookup | O(1) worst-case | O(1) expected |
| Insert | O(1) amortized | O(1) expected |
| Delete | O(1) worst-case | O(1) expected |
| Space | O(n / α) | O(n) + O(n) in buckets |
| Load factor | α ≤ 0.98 practical | α can approach 1 |
| Cache behavior | Excellent (contiguous) | Poor (linked list) |
| Implementation | Moderate complexity | Simple |

Cuckoo hashing excels in **write-heavy, latency-critical** workloads where consistent O(1) response is required. The cache-friendly array layout (no pointers) makes it faster in practice than chained hashing even when the asymptotic bounds are similar.

---

[← 5. Bloom Filters — Membership with False…](03_bloom_filters_membership_with_false_positives.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [7. Count-Min Sketch — Frequency Estimation →](05_count_min_sketch_frequency_estimation.md)
