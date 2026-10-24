**Navigation**: [Back to Index](00_INDEX.md) | [Previous Chapter <](07c_Advanced_Trees_Deep.md) | [Next Chapter >](07e_Advanced_Algorithm_Engineering_Deep.md)

---

# 🎲 Probabilistic & Distributed Data Structures: Deep Dive

### Historical Evolution

Probabilistic data structures emerged as a pragmatic solution when exact answers require infeasible amounts of memory. **Bloom Filters** were invented by **Burton Howard Bloom in 1970** at General Electric's Computer Science Center, published in the Communications of the ACM as "Space/Time Trade-offs in Hash Coding with Allowable Errors" — Bloom's original paper showed that for membership queries, trading a small false positive rate for massive space savings was often the correct engineering tradeoff. The original application was spell-checking in editors; modern applications include web cache proxies (Akamai, Chrome Safe Browsing), database Bloom filters (Cassandra, PostgreSQL), and blockchain SPV nodes. **Count-Min Sketch** was introduced by **Cormode and Muthukrishnan in 2005** as a probabilistic counter for heavy hitter detection and range query estimation. **HyperLogLog** was published by **Flajolet et al. in 2007** (Google) for cardinality estimation using $O(1)$ memory with ~1.6% standard error — it won the Godel Prize in 2022. **Consistent Hashing** was introduced by **Karger et al. at MIT in 1997** for Akamai's content delivery network, minimizing reorganization when servers are added/removed. Modern practice (post-2010): Cassandra uses Bloom filters to skip SSTables, Redis HLL counts unique visitors at scale, and consistent hashing is the foundation of distributed caches (Memcached) and NoSQL databases (DynamoDB).

---

## Trading Accuracy for Infinite Scale in Big Data & System Design

---

# ⚖️ PART 1: The Big Data Dilemma

When designing systems for billions of events (Google, Netflix, Twitter), standard deterministic data structures (HashMaps, HashSets) mathematically fail.

- **Problem:** Storing 1 Billion IP addresses in a standard `HashSet` requires $\approx 32\text{ GB}$ of RAM.
- **Solution:** **Probabilistic Data Structures** sacrifice absolute accuracy (allowing minuscule, mathematically bounded error rates) to achieve $O(1)$ space—often condensing gigabytes of data into just megabytes or kilobytes of memory.

---

# 🌸 PART 2: Bloom Filters (The Database Shield)

A **Bloom Filter** answers one specific question: _"Have I seen this element before?"_

- **Return True:** "Probably yes" (False Positives are possible).
- **Return False:** "Definitely NO" (False Negatives are impossible).

### Architecture

It consists of a single **Bit Array** of size $M$ (initially all 0s) and $K$ different **Hash Functions**.

```text
┌──────────────────────────────────────────────────────────────┐
│                  BLOOM FILTER INSERTION                      │
├──────────────────────────────────────────────────────────────┤
│  Data: "apple"                                               │
│                                                              │
│  Hash1("apple") = 2  ─────┐                                  │
│  Hash2("apple") = 5  ─────┼─────┐                            │
│  Hash3("apple") = 9  ─────┼─────┼─────────┐                  │
│                           v     v         v                  │
│  Bit Array:         [0][0][1][0][0][1][0][0][0][1]           │
│  Index:              0  1  2  3  4  5  6  7  8  9            │
└──────────────────────────────────────────────────────────────┘
```

### The Math of False Positives

If the bit array gets too full, a newly queried word might hash to indices that were _already set to 1_ by previous, unrelated words. The probability of a false positive $p$ is controlled by the bit array size ($m$) and number of items ($n$):
$$ p \approx \left( 1 - e^{-kn/m} \right)^k $$

### Production Use Cases:

1. **Cassandra / LSM Trees:** Before reading a slow SSD to find a row, Cassandra checks a Bloom Filter in RAM. If it says "NO", the disk read is skipped completely.
2. **Chrome / Safe Browsing:** Google Chrome checks URLs against a local 5MB Bloom Filter of malicious sites instead of querying an API for every click.

---

# 📊 PART 3: Count-Min Sketch (The Heavy Hitters)

A `HashMap<String, Integer>` is used to count frequencies. But what if you are Twitter, tracking hashtag trends across 10 Billion tweets a day? You cannot store every unique string.

The **Count-Min Sketch** tracks frequencies in sub-linear space. Like a Bloom Filter, it overestimates, but it **never underestimates**.

### Architecture

A 2D array of integer counters: $W$ width (hash range) $\times$ $D$ depth (number of hash functions).

```text
┌──────────────────────────────────────────────────────────────┐
│                COUNT-MIN SKETCH (Frequency)                  │
├──────────────────────────────────────────────────────────────┤
│  Data: "Java" -> Hash1=1, Hash2=4, Hash3=2                   │
│                                                              │
│            0   1   2   3   4   5                             │
│          +---+---+---+---+---+---+                           │
│ Hash 1:  | 0 | 1 | 0 | 0 | 0 | 0 |  <-- Increment index 1    │
│          +---+---+---+---+---+---+                           │
│ Hash 2:  | 0 | 0 | 0 | 0 | 1 | 0 |  <-- Increment index 4    │
│          +---+---+---+---+---+---+                           │
│ Hash 3:  | 0 | 0 | 1 | 0 | 0 | 0 |  <-- Increment index 2    │
│          +---+---+---+---+---+---+                           │
│                                                              │
│  * Query("Java"): Return MIN(Array[0][1], Array[1][4], Array[2][2])
└──────────────────────────────────────────────────────────────┘
```

### Production Use Case:

- **YouTube View Counts:** Catching viral trends.
- **Network Routers:** Detecting DDoS attacks (IP address request frequencies) in real-time hardware memory.

---

# 🧮 PART 4: HyperLogLog (Cardinality Estimation)

How does Reddit count the number of _Unique Viewers_ on a post?
Counting unique items (Cardinality) normally requires saving every single user ID in a Set.

**HyperLogLog (HLL)** calculates the cardinality of a dataset of $10^9$ elements using approximately **1.5 Kilobytes** of memory, with a standard error of $\approx 0.81\%$.

### The Math Concept (Coin Flips)

If you flip a coin and get "Heads" 5 times in a row, an observer can guess you've been flipping the coin for a long time.
HLL hashes every incoming item into a binary string. It looks for the **longest sequence of leading zeros** across all hashes. If the maximum leading zeros seen is $Z$, the estimated number of unique elements is roughly $2^Z$.

### Production Use Case:

- **Redis:** The `PFADD` and `PFCOUNT` commands in Redis use HLL to power analytics leaderboards.

---

# ⭕ PART 5: Consistent Hashing (Distributed Routing)

Unlike the probabilistic structures above, **Consistent Hashing** is a deterministic technique used to distribute data seamlessly across $N$ servers.

### The Problem with standard Modulo Hashing

If you distribute caching data using `Server = Hash(Key) % N`, what happens when a server crashes, and $N$ drops to $N-1$? **Almost every key hashes to a new server**: going from $N$ to $N\pm1$ servers, only about $1/(N+1)$ of keys keep their old server (measured by enumerating one full cycle: going from 16 to 17 servers moves 94.1% of keys). The cache miss rate is therefore roughly $(N-1)/N$ — effectively 100% for realistic $N$ — and the database collapses.

### The Hash Ring Solution

Map the hash outputs to a circular ring (e.g., $0 \to 2^{32}-1$). Place both the **Servers** and the **Keys** on this ring using the same Hash function.
A key is stored on the _very next server_ traveling clockwise.

```text
┌──────────────────────────────────────────────────────────────┐
│                 CONSISTENT HASHING RING                      │
├──────────────────────────────────────────────────────────────┤
│                          [ Node A ]                          │
│                          /        \                          │
│                         /          \                         │
│                    Key 1            Key 4                    │
│                     /                \                       │
│           [ Node C ]                  [ Node B ]             │
│                     \                /                       │
│                    Key 3            Key 2                    │
│                         \          /                         │
│                          \        /                          │
│                          [ Node D ]                          │
│                                                              │
│  * If Node B dies, Key 4 simply routes clockwise to Node D.  │
│  * Only Key 4 is remapped. Keys 1, 2, 3 remain unaffected!   │
└──────────────────────────────────────────────────────────────┘
```

### Virtual Nodes (VNodes)

To prevent uneven data distribution, each physical server is hashed multiple times (e.g., Node A_1, Node A_2, Node A_3) and scattered randomly across the ring.

### Production Use Case:

- **Partitioning:** Used in Amazon DynamoDB, Apache Cassandra, and Discord for data partitioning.
- **Load Balancing:** NGINX and HAProxy use it for routing sticky sessions.

---

# 🪤 PART 6: Cuckoo Filters and Quotient Filters

Bloom Filters are brilliant, but they have one painful weakness:

> Standard Bloom Filters do not support safe deletion.

You can use a Counting Bloom Filter, but that replaces bits with counters and increases memory. Cuckoo Filters and Quotient Filters attack the same membership problem with different engineering tradeoffs.

## 6.1 Cuckoo Filter

A Cuckoo Filter stores short **fingerprints** of keys inside buckets.

Each key has two possible bucket locations:

```text
i1 = hash(key)
fingerprint = fp(key)
i2 = i1 XOR hash(fingerprint)
```

Lookup checks both buckets. Insert tries one bucket; if full, it kicks out an existing fingerprint and moves that fingerprint to its alternate bucket.

| Feature          | Cuckoo Filter                        |
| ---------------- | ------------------------------------ |
| False positives  | Possible                             |
| False negatives  | No, unless implementation is broken  |
| Delete support   | Yes                                  |
| Space efficiency | Often better than Counting Bloom     |
| Failure mode     | Insert can fail if table is too full |

Good fit:

- Deduplication where keys expire
- Cache admission filters
- "Probably seen" checks with deletes
- Systems where a standard Bloom Filter would accumulate stale positives forever

## 6.2 Quotient Filter

A Quotient Filter stores hashed fingerprints in a compact table and keeps enough metadata to reconstruct clusters.

High-level idea:

```text
hash(x) split into:
    quotient  -> chooses bucket
    remainder -> stored compactly
```

It is cache-friendly because entries live in a contiguous array, unlike pointer-heavy hash structures.

| Filter         | Strong Point                    | Weak Point                     |
| -------------- | ------------------------------- | ------------------------------ |
| Bloom          | Simple, fast, widely used       | No native delete               |
| Counting Bloom | Delete support                  | More memory                    |
| Cuckoo         | Delete + compact fingerprints   | Insert may fail near high load |
| Quotient       | Cache locality + merge-friendly | More complex metadata          |

---

# 🧬 PART 7: MinHash and SimHash - Similarity at Scale

Sometimes the question is not "have I seen this exact item?"

The better question is:

> "Have I seen something almost the same?"

## 7.1 MinHash for Jaccard Similarity

Jaccard similarity:

```text
J(A, B) = |A intersection B| / |A union B|
```

MinHash estimates Jaccard similarity without storing the full sets.

Mental model:

1. Convert a document/user/session into a set of tokens.
2. Hash the tokens many different ways.
3. Keep the minimum hash value for each hash function.
4. Two sets with similar MinHash signatures probably have high Jaccard similarity.

Production examples:

- Near-duplicate web pages
- Plagiarism detection
- Similar user behavior
- Recommendation candidate generation

## 7.2 Locality Sensitive Hashing (LSH)

MinHash signatures are still vectors. LSH turns them into candidate buckets.

```text
signature = [h1, h2, h3, h4, h5, h6, h7, h8]

bands:
  band1 = [h1, h2]
  band2 = [h3, h4]
  band3 = [h5, h6]
  band4 = [h7, h8]

If two items match in any band, compare them more carefully.
```

LSH is not the final answer. It is a **candidate generator** that avoids comparing everything with everything.

## 7.3 SimHash for Hamming Distance

SimHash is used when similarity can be modeled through weighted features.

Steps:

1. Hash every feature into a fixed-width bit string.
2. Add feature weight to each bit position if bit is `1`.
3. Subtract feature weight if bit is `0`.
4. Final signature bit is `1` if accumulated score is positive.

Similar documents produce signatures with small Hamming distance.

Good fit:

- Web page deduplication
- Spam detection
- Similar text fingerprints

---

# 📈 PART 8: Streaming Top-K and Heavy Hitters

Count-Min Sketch estimates frequencies, but sometimes you need the actual top keys.

## 8.1 Misra-Gries Algorithm

Misra-Gries keeps at most `k - 1` counters.

For each item:

```text
if item already tracked:
    count++
else if empty slot exists:
    count = 1
else:
    decrement every counter
    remove zero counters
```

Guarantee: any item occurring more than `N/k` times will remain as a candidate.

This is the deterministic foundation behind many "find all elements appearing more than n/3" interview problems.

## 8.2 Space-Saving Algorithm

Space-Saving keeps `k` counters. When a new item arrives and all counters are full:

1. Find the current minimum counter.
2. Replace that item with the new item.
3. Set new count to `min + 1`.
4. Store the error bound as `min`.

It tracks heavy hitters more aggressively than Misra-Gries in many real streams.

## 8.3 Sliding Windows and Decay

A global counter may be useless if old traffic dominates.

Common production patterns:

| Pattern            | Meaning                                    |
| ------------------ | ------------------------------------------ |
| Tumbling window    | Count per fixed window, reset at boundary  |
| Sliding window     | Maintain rolling last `T` minutes          |
| Exponential decay  | Recent events matter more than old events  |
| Reservoir sampling | Keep a representative sample from a stream |

The hard part is not the sketch. The hard part is defining what "now" means.

---

# 🔁 PART 9: CRDTs - Distributed Data Structures Without Coordination

CRDT means **Conflict-free Replicated Data Type**.

It is not probabilistic, but it belongs in this chapter because it is a scale structure: it trades strict immediate coordination for deterministic merge rules.

## 9.1 The Core Rule

A CRDT must make concurrent updates merge safely:

```text
merge(a, b) == merge(b, a)              // commutative
merge(merge(a, b), c) == merge(a, merge(b, c))  // associative
merge(a, a) == a                        // idempotent
```

These properties mean replicas can receive updates in different orders and still converge.

## 9.2 Common CRDTs

| CRDT         | What It Does                | Merge Rule                                |
| ------------ | --------------------------- | ----------------------------------------- |
| G-Counter    | Grow-only counter           | Per-node max, then sum                    |
| PN-Counter   | Increment/decrement counter | Two G-Counters: positive and negative     |
| G-Set        | Grow-only set               | Union                                     |
| OR-Set       | Add/remove set              | Unique tags per add; remove observed tags |
| LWW Register | Last-write-wins value       | Highest timestamp wins                    |

## 9.3 When CRDTs Are Worth It

Use CRDTs when:

- Users edit offline.
- Multi-region writes must stay available.
- Conflicts can be merged mechanically.
- Temporary inconsistency is acceptable.

Avoid CRDTs when:

- You need strict uniqueness at write time.
- Money/accounting correctness requires serializable transactions.
- Business conflicts need human judgment.

CRDTs are not magic consistency. They are a carefully designed answer to: **"What does merge mean?"**

---

# 🧮 PART 10: Sizing Formulas and Accuracy Contracts

Probabilistic structures must be designed from an explicit error budget.

## 10.1 Bloom Filter Sizing

Given:

```text
n = expected items
p = desired false positive probability
```

Approximate formulas:

```text
m = -(n * ln p) / (ln 2)^2      bits
k = (m / n) * ln 2              hash functions
```

Example:

```text
n = 10,000,000 keys
p = 1% = 0.01

m ≈ 95,850,584 bits ≈ 11.4 MB
k ≈ 6.64 -> 7 hash functions
```

That is the deep reason Bloom Filters show up everywhere: millions of keys can be screened with megabytes, not gigabytes.

## 10.2 HyperLogLog Error

HyperLogLog standard error is approximately:

```text
error ≈ 1.04 / sqrt(m)
```

where `m` is the number of registers.

More registers means lower error and more memory. There is no free lunch, just a very good exchange rate.

## 10.3 Count-Min Sketch Error Shape

Count-Min Sketch has two knobs:

```text
width  -> controls overcount amount
depth  -> controls probability of bad overcount
```

Wider rows reduce collision error.
More rows reduce the chance that every row is unlucky at the same time.

Always document:

1. Maximum expected stream size.
2. Acceptable false positive / overcount / cardinality error.
3. Reset or windowing policy.
4. What decisions are allowed to depend on approximate answers.

Approximation is safe only when the business contract understands the approximation.

---

# 🧯 PART 11: Production Pitfalls

| Pitfall                                   | Why It Hurts                 | Fix                                               |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------- |
| Bloom Filter overfilled                   | False positives explode      | Size for max `n`, rotate filters                  |
| Bad hash functions                        | Correlated collisions        | Use high-quality independent hash derivation      |
| No delete story                           | Stale positives stay forever | Cuckoo/Counting Bloom or time-partitioned filters |
| Approx result used for billing            | Users get wrong numbers      | Use exact source of truth for money               |
| HLL merged across incompatible precisions | Cardinality error gets weird | Standardize precision/register count              |
| Sketch never reset                        | Old traffic dominates        | Add windows or decay                              |
| CRDT timestamp from unsynced clocks       | Wrong value wins             | Prefer logical clocks/tags where possible         |

## 11.1 The Senior Rule

Do not say:

> "This data structure is approximate."

Say:

> "This data structure can return false positives but never false negatives, with target probability `p`, for up to `n` inserted keys, assuming hash quality is good."

That sentence is the difference between trivia and engineering.

---

# 🧠 SUMMARY: The "Scale into Infinity" Cheat Sheet

| Data Structure / Algo          | The Question it Answers          | Space Complexity               | Real World Use Case                                |
| ------------------------------ | -------------------------------- | ------------------------------ | -------------------------------------------------- |
| **Bloom Filter**               | Is it strictly missing?          | $O(1)$ Bytes/MB                | DB Disk avoidance, Check malicious URLs.           |
| **Count-Min Sketch**           | How many times did X occur?      | $O(1)$ Kilobytes               | Tracking Hashtags, DDoS IP detection.              |
| **HyperLogLog**                | How many UNIQUE items?           | $O(1)$ $\approx 1.5$KB         | YouTube metrics, Analytics, Reddit unique viewers. |
| **Consistent Hashing**         | Which server holds my data?      | $O(V)$ VNodes                  | Scalable distributed DBs (Cassandra, DynamoDB).    |
| **Cuckoo Filter**              | Probably present, with deletion? | Compact fingerprints           | Cache admission, expiring dedupe.                  |
| **MinHash / SimHash**          | Is this item similar?            | Compact signatures             | Near-duplicate detection, recommendations.         |
| **Misra-Gries / Space-Saving** | Who are the heavy hitters?       | $O(k)$ counters                | Trending topics, abuse detection.                  |
| **CRDTs**                      | Can replicas merge safely?       | Depends on CRDT                | Offline edits, multi-region availability.          |
| **Skip List**                  | Sorted tree lacking locks?       | $O(N)$ with $O(\log N)$ layers | `ConcurrentSkipListMap`, Redis ZSET.               |


---

## Proof Corner -- Skip List Expected Search Time

**Claim**: A skip list with n elements and level promotion probability p = 0.5 supports expected O(log n) search time.

**Proof via backward analysis** (Pugh 1990): Consider the search for element x. The search follows a path backward from x. At each node, either:
- The search climbed up a level from the current position (probability 0.5), or
- The search went left (probability 0.5).

This is equivalent to a random walk: we start at the bottom level and count steps until we climb to the top. The expected number of levels = log_{1/p}(n) = log_2(n). Expected horizontal steps at each level = O(1/p) = O(1). Total expected steps = O(log n / p) = O(log n). QED.

**Bloom filter false positive rate derivation**: See A4_Randomized_Algorithms.md Proof Corner for the full derivation. Key result: with m bits, n insertions, k hash functions, FP rate = (1 - e^{-kn/m})^k, minimised at k = (m/n) ln 2.

---

## Section Challenge -- Probabilistic Data Structures

**Problem 1 (6 min)**: A Bloom filter with m=1000 bits and k=7 hash functions has n=100 elements inserted. Estimate the false positive probability.

<details><summary>Model Answer</summary>

FP probability = (1 - e^{-kn/m})^k = (1 - e^{-7*100/1000})^7 = (1 - e^{-0.7})^7.

e^{-0.7} approx 0.497. So (1 - 0.497)^7 = (0.503)^7 approx 0.008 = 0.8%.

This matches the rule of thumb: m/n = 10 bits per element gives FP rate ~1% with k = 7. At m/n = 10, the actual rate is slightly below 1%.

</details>

---

## Reference Anchor

**java.util.concurrent.ConcurrentSkipListMap -- production skip list**:
```java
// java.util.concurrent.ConcurrentSkipListMap: thread-safe sorted map, O(log n) per op
// Used in: cache implementation, sorted concurrent queues, range queries with concurrency
// Source: jdk/src/java.base/share/classes/java/util/concurrent/ConcurrentSkipListMap.java

ConcurrentSkipListMap<Integer, String> skipMap = new ConcurrentSkipListMap<>();
skipMap.put(5, "five");
skipMap.put(3, "three");
// Thread-safe: multiple threads can read/write concurrently
String result = skipMap.get(3); // O(log n) expected

// Redis ZSET (Sorted Sets) uses a skip list internally:
// - ZADD key score member -- O(log n)
// - ZRANGEBYSCORE key min max -- O(log n + k) for k results
// - ZRANK key member -- O(log n)
// Skip list chosen over AVL tree because concurrent insertions are simpler to implement

// For Bloom filters in production: Google Guava BloomFilter (see A4_Randomized_DS.md)
```

---

## Brute Force to Optimal -- Probabilistic DS Tradeoffs

| Problem | Exact (no error) | Space | Probabilistic | Space | Error bound |
|---------|-----------------|-------|---------------|-------|-------------|
| Membership test | HashSet | O(n) | Bloom filter | O(n bits) | 1% FP, 0% FN |
| Cardinality | HashSet | O(n) | HyperLogLog | O(m) | ~1.04/sqrt(m) |
| Top-k frequency | HashMap + sort | O(n) | Count-Min Sketch | O(w*d) | epsilon*n additive |
| Sorted concurrent access | TreeMap | O(n log n) | ConcurrentSkipListMap | O(n log n) | exact (no error) |

**Rule**: Use probabilistic structures when space is the bottleneck and a bounded error is acceptable. Use exact structures when correctness is mandatory.


---

## Reality Check

**"Count-Min Sketch gives exact counts"** → Count-Min Sketch is a probabilistic data structure that gives approximate counts with guaranteed overestimation. It NEVER undercounts. The estimate `count(x) = min over hash functions of table[h_j(x)]` is exact OR overestimates due to hash collisions. The error bound: with high probability, the estimate is at most `actual + ε*N` where N = total insertions, ε depends on table width. Used in: network monitoring (approximate flow counts), streaming analytics, approximate top-K, Flink/Spark streaming aggregations. For exact counts: use HashMap (requires memory proportional to distinct elements).

**"HyperLogLog is exact cardinality estimation"** → HyperLogLog estimates the number of distinct elements in a stream using O(log log N) memory — hence the name. The estimate has configurable precision: standard error ≈ 1.04/√m where m = number of registers. Redis uses HyperLogLog for `PFCOUNT` (count distinct IPs, unique visitors) — 12KB of memory estimates cardinality of up to 10^15 elements with ~0.81% standard error. HyperLogLog is NOT exact — it's a statistical estimator. For exact cardinality: you need to store all distinct elements.

**"MinHash computes exact similarity between sets"** → MinHash approximates Jaccard similarity (|A∩B| / |A∪B|) between sets. The probability that min(h(A)) = min(h(B)) for a random hash h equals the Jaccard similarity. By using k independent hash functions and averaging, you get an estimator with variance 1/(k). Used in: LSH (Locality-Sensitive Hashing) for near-duplicate document detection, collaborative filtering at scale, plagiarism detection (TurnItIn), web page similarity (Google's deduplication). Exact Jaccard similarity requires comparing every element in both sets — infeasible for web-scale documents.

**"Bloom filters can be scaled by just making them bigger"** → Bloom filters have a fixed false positive rate at a fixed size. Inserting more than the designed n elements increases the false positive rate beyond the target. Scalable Bloom Filters (SBF): add a new Bloom filter when the current one is full, query all filters on lookup. Each new filter is a bit bigger with a slightly stricter false positive rate, so the compound false positive rate stays bounded. Alternatively: Counting Bloom Filters replace single bits with counters, enabling deletion (standard Bloom filters cannot delete elements — a 1 bit might represent multiple elements).

**"Reservoir sampling requires knowing the stream length in advance"** → Algorithm R (Knuth, 1985): maintain a reservoir of k samples. For each new item n (1-indexed): if n ≤ k, add to reservoir. If n > k, pick a random index j in [1, n]; if j ≤ k, replace reservoir[j] with the new item. After processing all n items, each item has exactly k/n probability of being in the reservoir — perfectly uniform sampling from a stream of unknown length. The algorithm requires only O(k) memory and one pass. Used in: database system random sampling, A/B testing log analysis, reservoir sampling in Apache Spark's `takeSample()`.
