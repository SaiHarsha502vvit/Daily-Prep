# 5. Bloom Filters — Membership with False Positives

> **Navigation**: [← 4. Treaps — Randomized BST](02_treaps_randomized_bst.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [6. Cuckoo Hashing — Worst-Case O(1) Lookup →](04_cuckoo_hashing_worst_case_o_1.md)
> Page 3 of 7 in **A4. Randomized Data Structures — Probabilistic Guarantees in Storage**


## 💬 Study-Partner View — Bloom Filters

**1. The bottom line:** A Bloom filter says "definitely not here" or "probably here" using a tiny bit array and a few hash functions.

**2. The textbook core:**

- Bit array of `m` bits and `k` hash functions; `add(x)` sets `k` bits; `contains(x)` checks `k` bits.
- **No false negatives**; false-positive rate ≈ `(1 - e^(-kn/m))^k`.
- Optimal `k = (m/n) ln 2`; then `m ≈ -n ln ε / (ln 2)²` bits for rate ε.
- Cannot delete (use counting Bloom or cuckoo filters); cannot list items.

**3. The real-world analogy:** A **bouncer's blurry "known troublemakers" board**: if your face is clearly not on it, you are in; if it looks similar, they check the real list.

**4. Walkthrough:**

1. `m = 16`, `k = 2`. Add "cat": hashes → bits 3 and 10 set.
2. Add "dog": hashes → bits 7 and 10 set.
3. Query "bird": bits 3 and 12. Bit 12 is 0 → definitely absent.
4. Query "fox": bits 7 and 3 (both set by others) → "probably present": a false positive.

> [!NOTE]
> **Quick check:** Where is a Bloom filter used? *In LSM databases (Cassandra, RocksDB) to skip SSTables that cannot contain a key.*


## Historical Context

**Burton Bloom (1970, Computer Usage Company)** published *"Space/Time Trade-offs in Hash Coding with Allowable Errors"* in Communications of the ACM. His original application was a hyphenation program that had to check words against a large dictionary. The insight: for membership queries, allowing a small controlled false positive rate trades memory for speed and space in a mathematically precise way. Fifty years later, Bloom filters are the backbone of database internals, CDN caching, browser security, and blockchain SPV nodes.

## Structure Definition

```
Structure: m-bit array B[0..m-1], all initialized to 0.
           k independent hash functions h₁, ..., h_k: U → {0..m-1}

Insert(x): for i in 1..k: B[h_i(x)] = 1

Query(x):  return AND_{i=1..k} B[h_i(x)]
           → YES if all k bits are 1; NO if any bit is 0
```

**Invariant (Bloom Filter)**: After inserting set S, the query returns YES for all elements in S (no false negatives) and possibly for elements not in S (false positives are possible).

## False Positive Probability Analysis

After inserting n elements, each bit position has been set by at least one of the n·k hash applications. The probability a specific bit is still 0:

**Pr[bit = 0] = (1 - 1/m)^{kn} ≈ e^{-kn/m}** (for large m, n)

For any x ∉ S, query returns YES if all k of x's bits happen to be 1. Since bits are (approximately) independent:

**Pr[false positive] = (1 - e^{-kn/m})^k**

## Optimal Number of Hash Functions

Let f(k) = (1 - e^{-kn/m})^k. Take derivative with respect to k and set to zero:

**k* = (m/n) · ln 2 ≈ 0.693 · (m/n)**

Substituting k* into the false positive formula:

**Pr[FP] ≈ (0.5)^k* = 2^{-k*}**

With k* = (m/n)·ln 2, we get Pr[FP] = (0.6185)^{m/n}. For m/n = 10 bits per element, Pr[FP] ≈ 0.008 (0.8%).

## Space Lower Bound

For a static membership filter with false positive rate ε, the space lower bound is:

**m ≥ -n · ln(ε) / (ln 2)²**

This is provably optimal for any data structure that answers membership queries without false negatives. The Bloom filter achieves this bound up to constant factors — making it space-optimal for this problem.

## Counting Bloom Filter (Supports Deletion)

A standard Bloom filter cannot support deletion: clearing a bit may remove information needed for other elements. The counting Bloom filter replaces each bit with a small counter (3-4 bits):

```java
int[][] counterTable;  // d rows, w columns
int[][] countingBloomInsert(Object x) {
    for (int i = 0; i < d; i++) {
        int j = hash(x, i) % w;
        counterTable[i][j]++;  // Increment counter instead of setting bit
    }
    return counterTable;
}
```

**Trade-off**: Each counter requires 3-4 bits instead of 1 bit. Space multiplies by 3-4x, but now deletes are possible. This is the fundamental trade-off in counting Bloom filters.

## Java Implementation

```java
public class BloomFilter<T> {
    private final BitSet bitArray;
    private final int m;  // number of bits
    private final int k;  // number of hash functions
    private final HashFunction<T>[] hashFunctions;

    public BloomFilter(int expectedElements, double falsePositiveRate) {
        // m = -n * ln(ε) / (ln 2)^2
        this.m = (int) Math.ceil(-expectedElements
            * Math.log(falsePositiveRate) / (Math.log(2) * Math.log(2)));
        // k = (m/n) * ln 2
        this.k = (int) Math.ceil((m / (double) expectedElements) * Math.log(2));
        this.bitArray = new BitSet(m);
        this.hashFunctions = new HashFunction[k];
        // Create k independent hash functions using double-hashing
        initializeHashFunctions();
    }

    public void insert(T element) {
        for (int i = 0; i < k; i++) {
            int index = hashFunctions[i].apply(element) % m;
            bitArray.set(index);
        }
    }

    public boolean mightContain(T element) {
        for (int i = 0; i < k; i++) {
            int index = hashFunctions[i].apply(element) % m;
            if (!bitArray.get(index)) {
                return false;  // Definitely not in set
            }
        }
        return true;  // Probably in set (may be false positive)
    }
}
```

## Production Use Cases

| System | Role |
|---|---|
| Cassandra | Per-SSTable bloom filter; skip disk lookup if filter says NO |
| Chrome Safe Browsing | 5-8MB client-side filter for ~1M malicious URLs |
| PostgreSQL | Bloom index for OR JOINs on non-B-tree-searchable columns |
| Akamai CDN | Filter one-hit-wonder requests; don't cache URLs visited once |
| Bitcoin SPV | Lightweight clients filter incoming transactions |

## Bloom Filter Limitations

- **No deletion** (unless counting variant is used)
- **False positives grow with fill rate**: if the array is overfilled, false positive rate skyrockets
- **Static only by default**: dynamic Bloom filters need periodic rebuild or resizing
- **Cannot enumerate members**: you can test membership but not retrieve elements

---

[← 4. Treaps — Randomized BST](02_treaps_randomized_bst.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [6. Cuckoo Hashing — Worst-Case O(1) Lookup →](04_cuckoo_hashing_worst_case_o_1.md)
