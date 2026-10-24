# 8. HyperLogLog — Cardinality Estimation

> **Navigation**: [← 7. Count-Min Sketch — Frequency Estimation](05_count_min_sketch_frequency_estimation.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [9. Consistent Hashing — Distributed Hashing… →](07_consistent_hashing_distributed_hashing_without_r.md)
> Page 6 of 7 in **A4. Randomized Data Structures — Probabilistic Guarantees in Storage**


## 💬 Study-Partner View — HyperLogLog

**1. The bottom line:** HyperLogLog counts how many different items you saw by watching for unusually rare hash patterns, using only kilobytes of memory.

**2. The textbook core:**

- Hash each item; use the first bits to pick one of `m` registers, and store the maximum number of **leading zeros** (+1) seen in the rest.
- The estimate uses the harmonic mean of `2^register` values, scaled by a correction constant.
- Standard error ≈ `1.04 / √m` (about 0.8% with 16,384 registers, ~12 KB).
- Mergeable: the union of two sketches is the element-wise max.

**3. The real-world analogy:** Counting **how many coins were flipped by checking the longest run of heads you saw**: if somebody got 10 heads in a row, they probably flipped about 2¹⁰ coins.

**4. Walkthrough:**

1. Stream of user IDs, hashed to random bits.
2. An item whose hash starts with `0001...` has 3 leading zeros, which appears about 1 in 8 times.
3. If the largest leading-zero count seen in a bucket is 3, that bucket has probably seen about 2³ = 8 distinct items.
4. Averaging across many buckets removes the noise and gives the final estimate.

> [!NOTE]
> **Quick check:** Can HyperLogLog tell whether a specific item was seen? *No; it only estimates the count of distinct items.*


## Historical Context

**Flajolet, Fusy, Gandouet, and Meunier (2007)** published *"HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm"* at the AofA 2007 conference (Google later published the HyperLogLog++ refinement). The insight: use the maximum number of leading zeros in hashed elements to estimate the number of distinct elements. Redis implemented it as `PFADD`/`PFCOUNT` in 2014, making it one of the most widely deployed probabilistic algorithms.

## The Core Insight: Coin Flipping

If you flip a fair coin until you see heads, the expected number of flips is 2. The probability of seeing at least k heads in a row is 2^{-k}. If you observe k consecutive heads, the most likely explanation is that you've been flipping for about 2^k tosses.

HyperLogLog applies this to set cardinality: hash each element to a uniform random bit string; the position of the leftmost 1-bit tells us something about how many distinct elements we've seen.

## Structure and Algorithm

```
m registers (size is a power of 2, e.g., m = 2^p)
Hash each element to a (64+p)-bit string.
Let Z = position of first 1-bit (count of leading zeros + 1).
Update: registers[ hash mod m ] = max(register, Z)

Estimate: E = α·m² / Σ (1 / 2^{register[i]})
where α ≈ 0.7213 / (1 + 1.079/m) is a bias correction constant.
```

The harmonic mean of the 2^{register[i]} values gives the cardinality estimate. The intuition: if we've seen about 2^k distinct elements hashing to register i, we expect to see one with leading zeros = k on average.

```java
public class HyperLogLog {
    private final int p;        // precision parameter (log2 of m)
    private final int m;        // number of registers = 2^p
    private final byte[] registers;
    private final double alpha;

    public HyperLogLog(int p) {
        this.p = p;
        this.m = 1 << p;
        this.registers = new byte[m];
        // Alpha constant for bias correction
        this.alpha = 0.7213 / (1 + 1.079 / m);
    }

    public void add(long item) {
        // Hash item to 64-bit value
        long hash = MurmurHash64(item);

        // Register index from first p bits
        int idx = (int) (hash >>> (64 - p));

        // Count leading zeros (position of first 1)
        int zeros = Long.numberOfLeadingZeros(hash << p) + 1;
        // Clip to register range (1..32 for 64-bit hash)
        zeros = Math.min(zeros, 64 - p);

        // Update register with max
        registers[idx] = (byte) Math.max(registers[idx], zeros);
    }

    public double cardinality() {
        // Harmonic mean of 2^{register[i]}
        double sum = 0.0;
        for (int i = 0; i < m; i++) {
            sum += 1.0 / (1L << registers[i]);
        }
        double rawEstimate = alpha * m * m / sum;

        // Small-range correction (when estimate < 5m/2)
        if (rawEstimate < 2.5 * m) {
            int zeroCount = 0;
            for (byte r : registers) if (r == 0) zeroCount++;
            if (zeroCount > 0) {
                return m * Math.log(m / (double) zeroCount);
            }
        }

        // Large-range correction
        if (rawEstimate > (1L << 61)) {
            return -(1L << 61);
        }

        return rawEstimate;
    }
}
```

## Error Analysis

The standard error of HyperLogLog is approximately **1.04 / √m**.

| Precision p | Registers m | Memory | Standard Error |
|---|---|---|---|
| 10 | 1,024 | ~1 KB | ~3.25% |
| 14 | 16,384 | ~16 KB | ~0.81% |
| 16 | 65,536 | ~64 KB | ~0.41% |

For a 16-bit HyperLogLog (64 KB), the standard error is 0.41%. This means a cardinality estimate of 1,000,000 is accurate to ±4,100 — acceptable for analytics, unacceptable for billing.

## Production Use Cases

| System | Role |
|---|---|
| Redis `PFADD`/`PFCOUNT` | Unique visitor counts per page/event |
| Google BigQuery | Approximate COUNT DISTINCT over billions of rows |
| Kafka Streams | Distinct user session counts per time window |
| Advertising platforms | Unique ad impressions per campaign |

---

[← 7. Count-Min Sketch — Frequency Estimation](05_count_min_sketch_frequency_estimation.md) | [Chapter overview](../A4_Randomized_Data_Structures.md) | [9. Consistent Hashing — Distributed Hashing… →](07_consistent_hashing_distributed_hashing_without_r.md)
