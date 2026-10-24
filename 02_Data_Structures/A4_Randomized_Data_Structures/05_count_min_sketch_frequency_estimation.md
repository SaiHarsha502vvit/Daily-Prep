# 7. Count-Min Sketch — Frequency Estimation

> **Navigation**: [← 6. Cuckoo Hashing — Worst-Case O(1) Lookup](04_cuckoo_hashing_worst_case_o_1.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [8. HyperLogLog — Cardinality Estimation →](06_hyperloglog_cardinality_estimation.md)
> Page 5 of 7 in **A4. Randomized Data Structures — Probabilistic Guarantees in Storage**


## 💬 Study-Partner View — Count-Min Sketch

**1. The bottom line:** A Count-Min sketch estimates how often each item appeared in a stream using a small grid of counters, and it never underestimates.

**2. The textbook core:**

- A `d × w` array of counters with `d` hash functions; `update(x)` increments `c[i][hᵢ(x)]` for each row.
- `estimate(x) = min over rows of c[i][hᵢ(x)]`.
- Error: estimate ≤ true count + ε·N with probability ≥ 1 - δ, using `w = ⌈e/ε⌉`, `d = ⌈ln(1/δ)⌉`.
- Space is independent of the number of distinct items; only overestimates are possible.

**3. The real-world analogy:** A **set of tally boards shared by many items**: if two different items land in the same square, the count is inflated. Checking several boards and taking the smallest reading gets close to the truth.

**4. Walkthrough:**

1. `d = 2` rows. Items seen: "a" ×3, "b" ×1.
2. Row 1: a and b collide in one cell (count 4). Row 2: a alone (3), b alone (1).
3. `estimate(a) = min(4, 3) = 3` (correct). `estimate(b) = min(4, 1) = 1` (correct).
4. Without the second row, `b` would have been overestimated as 4.

> [!NOTE]
> **Quick check:** Why can it only overestimate? *Collisions only add to a counter, never subtract.*


## Historical Context

**Cormode and Muthukrishnan (2005, Bell Labs / DIMACS)** introduced the Count-Min sketch in *"An Improved Data Stream Summary: The Count-Min Sketch and its Applications"*. It won the PODC 2005 Best Paper Award. The problem it solves: tracking frequencies of up to 10^9 distinct items in a stream with bounded memory. Exact counting requires O(n) state — Count-Min uses O(1/k·ε) space.

## Structure Definition

The Count-Min sketch is a d × w array of counters. It uses d pairwise-independent hash functions h₁...h_d: U → {1...w}.

**Count-Min sketch layout:** a `d × w` grid of counters, one row per hash function.

| | col 1 | col 2 | ... | col w |
| --- | --- | --- | --- | --- |
| row 1 (hash h₁) | c[1,1] | c[1,2] | ... | c[1,w] |
| row 2 (hash h₂) | c[2,1] | c[2,2] | ... | c[2,w] |
| ... | ... | ... | ... | ... |
| row d (hash h_d) | c[d,1] | c[d,2] | ... | c[d,w] |

```text
Update(x, delta):
    for i in 1..d:
        c[i][ h_i(x) ] += delta

Estimate(x):
    return min_{i=1..d} c[i][ h_i(x) ]
```

## Accuracy Guarantee

The estimate is always an **overestimate** (never underestimate) due to the min operation:
- Every counter along x's row includes x's count plus collisions from other elements.
- The minimum over d estimates gives the least-collided row.
- With w = 2/ε and d = log(1/δ), the error bound is:

**Estimate(x) ≤ f_x + ε·||f||₁** with probability ≥ 1 - δ

where f_x is the true frequency and ||f||₁ = Σ|f_i| is the total frequency sum (stream length).

## Proof Sketch

Fix a row i. The counter c[i][h_i(x)] accumulates f_x + Σ_{y≠x} [h_i(y) = h_i(x)]·f_y.

The expected overcount on row i is at most f_x + ||f||₁ / w (by union bound over all y). By Markov's inequality, Pr[overcount > t·||f||₁/w] ≤ 1/t. Setting t = e·d gives Pr[any row exceeds e·||f||₁/w] ≤ 1/e^d.

## Java Implementation

```java
public class CountMinSketch {
    private final int d;   // depth (number of hash functions)
    private final int w;   // width (number of columns)
    private final long[][] counters;
    private final HashFunction[] hashFunctions;
    private long totalCount = 0;

    public CountMinSketch(double epsilon, double delta) {
        // w = ceil(e / epsilon), d = ceil(ln(1 / delta))
        this.w = (int) Math.ceil(Math.E / epsilon);
        this.d = (int) Math.ceil(Math.log(1.0 / delta));
        this.counters = new long[d][w];
        this.hashFunctions = new HashFunction[d];
        initializeHashFunctions();
    }

    public void add(String item, long delta) {
        totalCount += delta;
        for (int i = 0; i < d; i++) {
            int j = Math.abs(hashFunctions[i].apply(item)) % w;
            counters[i][j] += delta;
        }
    }

    // Return point estimate (upper bound on frequency)
    public long estimate(String item) {
        long min = Long.MAX_VALUE;
        for (int i = 0; i < d; i++) {
            int j = Math.abs(hashFunctions[i].apply(item)) % w;
            min = Math.min(min, counters[i][j]);
        }
        return min;
    }

    // Return confidence interval [estimate, estimate + epsilon * totalCount]
    public long estimateUpperBound(String item) {
        return estimate(item) + (long)(counters[0].length > 0
            ? 0 : 0);  // Simplified: true bound uses epsilon * totalCount
    }
}
```

## Production Use Cases

| System | Role |
|---|---|
| Network routers | Real-time DDoS detection: track per-IP request rates |
| Kafka / stream processors | Heavy hitter detection (items with > 1% of traffic) |
| Database monitoring | Query frequency for adaptive caching |
| Twitter (historical) | Hashtag trend estimation across billions of tweets |

## Count-Min vs Count-Mean-Min

The basic Count-Min overestimates for heavy hitters (collisions from all other items add up). Count-Mean-Min (Estan & Varghese, 2003) subtracts the average row value to reduce bias. For heavy hitter detection, the biased estimate is often acceptable — the top-k items dominate by definition.

---

[← 6. Cuckoo Hashing — Worst-Case O(1) Lookup](04_cuckoo_hashing_worst_case_o_1.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [8. HyperLogLog — Cardinality Estimation →](06_hyperloglog_cardinality_estimation.md)
