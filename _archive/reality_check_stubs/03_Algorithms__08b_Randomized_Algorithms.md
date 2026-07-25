

---

## Reality Check

**"Randomized algorithms are only approximations"** → Randomized algorithms fall into two categories: Las Vegas (always correct, random in runtime — quicksort with random pivot) and Monte Carlo (correct with high probability, fast runtime — randomized primality tests like Miller-Rabin). Las Vegas algorithms give exact answers, not approximations. Monte Carlo algorithms give correct answers with probability ≥ 1 - δ, where δ can be made arbitrarily small by repeating. These are not the same as approximation algorithms (which trade accuracy for speed deterministically).

**"Random pivot in quicksort barely matters"** → Without random pivot: sorted or reverse-sorted arrays trigger O(n²) worst case. With random pivot: O(n log n) expected time with overwhelmingly high probability. The analysis: each element is chosen as pivot with probability 1/n; elements more than n/4 from the median are "bad" pivots but can only happen O(log n) times before the subarray halves. Random pivot is why quicksort is used in production — `Arrays.sort()` for primitive types uses dual-pivot quicksort, which essentially eliminates worst-case behaviour for real data.

**"Hash functions are deterministic — why call hashing 'random'?"** → Deterministic hash functions can be attacked: if the hash function is known, an adversary can craft inputs that all hash to the same bucket, making HashMap O(n) per operation (hash flooding DoS). Universal hashing chooses a hash function RANDOMLY from a family at runtime — the adversary doesn't know which function was chosen, making attacks unpredictable. Java 7 added `hashSeed` randomization for String; Python 3.3+ added PYTHONHASHSEED for the same reason — both responding to actual hash-flooding DoS attacks.

**"Bloom filters give wrong answers"** → Bloom filters give false positives (may say an element is in the set when it isn't) but NEVER false negatives (if Bloom says "not in set," it definitely isn't). This makes them useful for: cache miss avoidance (if Bloom says miss, skip the DB query — save network), duplicate detection (if Bloom says seen, probably seen), URL blacklisting (if Bloom says safe, it's definitely safe). The false positive rate is tunable by choosing filter size and number of hash functions. Used in: Cassandra, LevelDB, Bitcoin SPV, Google Bigtable, PostgreSQL indexes.

**"Skip lists are just for academic papers"** → Redis uses skip lists for sorted sets (ZADD/ZRANGE operations). LevelDB uses skip lists for in-memory memtable. Skip lists support O(log n) expected search, insert, delete with simple implementation vs balanced BSTs. The randomized skip list guarantees the expected O(log n) performance — worst case O(n) but with overwhelming probability matches balanced BST performance. Unlike red-black trees, skip lists don't require complex rotations, making them easier to implement and to make concurrent (lock-free skip lists are well-studied).
