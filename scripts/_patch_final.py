import sys

def append_to_file(path, content):
    with open(path, 'a', encoding='utf-8') as f:
        f.write(content)
    print('OK (append):', path)

def patch_anchor(path, anchor, addition, prepend=False):
    txt = open(path, encoding='utf-8').read()
    if anchor in txt:
        if prepend:
            new = addition + anchor
        else:
            new = anchor + addition
        open(path, 'w', encoding='utf-8').write(txt.replace(anchor, new, 1))
        print('OK (anchor):', path)
        return True
    else:
        print('MISS:', path)
        # print last 100 chars
        print('  Last 100:', repr(txt[-100:]))
        return False

# =====================================================================
# 01_Algorithm_Thinking.md -- append (ends with emoji line)
# =====================================================================
append_to_file(
    '03_Algorithms/01_Algorithm_Thinking.md',
"""

---

## Proof Corner -- Why Correctness Precedes Optimisation

**Claim**: An algorithm that is fast but incorrect produces wrong answers faster. Correctness must be established before optimisation.

**Formal argument**: For any algorithm A and input x, define correct(A, x) = 1 if A(x) equals the expected output. An optimised A with correct(A, x) = 0 for some x has undefined practical value -- it may fail exactly on the edge case that matters most in production.

**Verification order** (MIT 6.006 lecture 1 principle):
1. Prove correctness (invariant, base case, inductive step).
2. Prove termination (strictly decreasing measure).
3. Analyse time/space complexity.
4. Optimise ONLY after 1-3 are established.

**Exchange argument for greedy correctness** (Activity Selection): Greedy picks earliest-finishing activity. If OPT chooses differently at step k, swap the OPT choice for the greedy choice -- OPT improves or stays equal. Repeating this gives OPT = Greedy. QED greedy is optimal.

---

## When It Breaks -- Algorithm Thinking

**1. Premature optimisation** -- optimising before proving correctness. A fast but wrong algorithm produces wrong answers faster. Rule: always prove correctness first; benchmark second.

**2. Wrong problem decomposition** -- treating a max-flow problem as greedy, or a greedy problem as DP. The wrong framework gives wrong recurrences or exchange arguments that don't hold. Fix: identify the problem class (single-choice greedy, overlapping subproblems DP, graph connectivity) before picking an algorithm.

**3. Off-by-one in time complexity estimates** -- O(n) + O(n log n) = O(n log n), not O(n^2). Summing O(n) over log n levels = O(n log n). These are common errors in interview whiteboard analysis.

**4. Confusing worst-case with expected** -- QuickSort is O(n log n) expected and O(n^2) worst-case. Reporting "QuickSort is O(n log n)" without qualifying "expected" (or "randomised pivot") misleads. Be precise about which case you're analysing.

---

## Reference Anchor

**MIT 6.006 Introduction to Algorithms -- open courseware**:
```
Lecture 1: Algorithmic thinking -- the peak-finding problem
Lecture 2: Models of computation and document distance
CLRS Chapters 1-3: Foundations of algorithm analysis

Key open-source algorithm implementations for study:
- OpenJDK java.util.Arrays (TimSort, DualPivotQuicksort): jdk/src/java.base/share/classes/java/util/
- Apache Commons Math ArithmeticUtils: commons-math3/src/main/java/org/apache/commons/math3/util/
```

```java
// Algorithm correctness verification pattern:
public static int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    // Invariant: if target in arr, it is in arr[lo..hi]
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2; // overflow-safe
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) lo = mid + 1; // narrow left
        else hi = mid - 1; // narrow right
    }
    return -1; // target not found
}
// Test: assert binarySearch(new int[]{1,3,5,7}, 5) == 2;
// Test: assert binarySearch(new int[]{1,3,5,7}, 4) == -1;
```
"""
)

# =====================================================================
# 05_DS_In_Production.md -- append
# =====================================================================
append_to_file(
    '02_Data_Structures/05_DS_In_Production.md',
"""

---

## Proof Corner -- Why HashMap O(1) Holds in Practice

**Expected O(1) proof**: With n elements in a table of size m and a uniform hash function:

E[probe length for any key] = E[number of keys in the same bucket]
= n/m = load factor alpha.

With alpha <= 0.75 (Java HashMap default), E[probe length] <= 0.75. So expected O(1) per lookup.

**Why Java's HashMap maintains this**: Java HashMap doubles capacity and rehashes all entries when load factor exceeds 0.75. This keeps alpha bounded. Rehash cost = O(n) but amortised over n insertions = O(1) per insertion (same doubling argument as dynamic array).

**Tree fallback invariant (JDK 8+)**: When a single bucket accumulates >= 8 entries (pathological collision), it converts to a TreeMap (Red-Black tree) giving O(log n) worst-case per bucket instead of O(n). This caps worst-case at O(log n) even under collision attacks.

---

## Reference Anchor

**Production DS patterns -- JDK and Guava**:
```java
// Guava's ImmutableMap -- zero allocation per get, compact memory layout
Map<String, Integer> lookup = ImmutableMap.of("a", 1, "b", 2, "c", 3);
// Backed by a closed-addressing hash table optimised for read-heavy workloads

// java.util.LinkedHashMap -- O(1) access + insertion-order iteration
// Used for LRU cache (removeEldestEntry):
LinkedHashMap<String, byte[]> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry<String, byte[]> e) {
        return size() > MAX_CACHE_SIZE;
    }
};

// java.util.concurrent.ConcurrentHashMap -- O(1) expected, lock-free reads in JDK 8
// Used in servlet request attribute maps, Spring bean registry
ConcurrentHashMap<String, Integer> freq = new ConcurrentHashMap<>();
freq.merge("key", 1, Integer::sum); // atomic increment -- no synchronized needed
```

---

## Brute Force to Optimal -- Production DS Selection

| Use case | Naive choice | Problem | Optimal production choice |
|----------|-------------|---------|--------------------------|
| Frequency count | Array scan per query | O(n) per query | HashMap -- O(1) |
| LRU cache | Scan + evict oldest | O(n) evict | LinkedHashMap with removeEldestEntry -- O(1) |
| Rate limiting | Count all timestamps | O(events) per window | Sliding window ring buffer -- O(1) |
| Deduplication at scale | HashSet in memory | OOM for > 10^9 elements | Bloom filter -- O(1) with 1% FP |
| Priority task queue | Sort every dequeue | O(n log n) per dequeue | PriorityQueue -- O(log n) per op |
"""
)

# =====================================================================
# 06_Math_Geometry_Java_Complete.md -- append (1/6 -> 6/6, all 5 missing)
# =====================================================================
append_to_file(
    '03_Algorithms/06_Math_Geometry_Java_Complete.md',
"""

---

## Proof Corner -- Cross Product for Orientation Test

**Claim**: For three points P1, P2, P3, the sign of the cross product (P2-P1) x (P3-P1) determines their orientation:

cross = (P2.x - P1.x) * (P3.y - P1.y) - (P2.y - P1.y) * (P3.x - P1.x)

- cross > 0: P1, P2, P3 are counter-clockwise (left turn at P2)
- cross < 0: clockwise (right turn at P2)
- cross = 0: collinear

**Proof**: The cross product of vectors u = P2-P1 and v = P3-P1 gives the signed area of the parallelogram spanned by u and v. Positive = CCW by the right-hand rule. The formula avoids floating-point division (unlike slope comparison), so it is exact for integer coordinates.

**Convex hull correctness (Graham scan)**: Sort by polar angle; maintain a stack where every three consecutive points make a left turn. When a right turn is detected, pop until left turns resume. The result is a convex polygon. Correctness follows because every discarded point is inside the convex hull of the remaining stack.

---

## When It Breaks -- Math and Geometry

**1. Floating-point slope comparison** -- computing slope as y/x introduces division and floating-point error. Two parallel lines may appear to intersect. Fix: use cross products (integer arithmetic for integer coordinates, no precision loss).

**2. Collinear point handling in convex hull** -- Graham scan with strict left-turn check omits collinear boundary points. With >= 0 check it includes them but requires careful handling at the start. Decide upfront: do you want collinear points on the hull?

**3. Angle wraparound in polar sort** -- sorting by atan2 angle groups points correctly but atan2 returns values in (-pi, pi]. Points at exactly -pi and pi are the same direction but compare unequal. Fix: treat the anchor point's angle as 0 and handle the wraparound explicitly.

**4. Integer overflow in geometry** -- for coordinates up to 10^9, cross product computation involves (x2-x1)*(y3-y1) which can reach 2*10^18, overflowing long (max ~9.2*10^18). Use long carefully; for coordinates > 10^9, switch to BigInteger or scale down.

---

## Section Challenge -- Math and Geometry

**Problem 1 (6 min)**: Given three points A(0,0), B(4,0), C(4,3), compute the cross product of AB x AC. What does the sign tell you about orientation?

<details><summary>Model Answer</summary>

AB = B - A = (4, 0). AC = C - A = (4, 3).

Cross product = AB.x * AC.y - AB.y * AC.x = 4*3 - 0*4 = 12 > 0.

Positive cross product: A, B, C are in counter-clockwise (CCW) order. If you walk from A to B to C, you turn left at B. This is the standard CCW orientation.

Note: the area of triangle ABC = |cross| / 2 = 12 / 2 = 6.

</details>

---

## Reference Anchor

**java.awt.geom and java.lang.Math for geometry**:
```java
// Exact integer cross product (no floating point):
static long cross(long ax, long ay, long bx, long by, long cx, long cy) {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    // Positive = CCW, Negative = CW, Zero = collinear
}

// GCD for fraction reduction and Bezout coefficients:
// java.math.BigInteger.gcd(BigInteger) -- handles arbitrary precision
BigInteger g = BigInteger.valueOf(48).gcd(BigInteger.valueOf(18)); // 6

// Modular exponentiation for number theory in geometry:
// java.math.BigInteger.modPow(exponent, modulus) -- O(log exponent) with Montgomery mult
BigInteger result = BigInteger.valueOf(3).modPow(BigInteger.valueOf(100), BigInteger.valueOf(1000000007));

// java.util.Arrays.sort for angular sort (by polar angle from anchor):
// Comparator using cross product -- avoids atan2 floating point:
// compare(P, Q): if cross(anchor, P, Q) > 0, P comes before Q (CCW order)
```

---

## Brute Force to Optimal -- Geometry Algorithms

| Problem | Brute Force | Time | Optimal | Time |
|---------|-------------|------|---------|------|
| Convex hull | Check all O(n^3) triples | O(n^3) | Graham Scan | O(n log n) |
| Closest pair of points | Check all O(n^2) pairs | O(n^2) | Divide & conquer | O(n log n) |
| Line segment intersection | Check all O(n^2) pairs | O(n^2) | Shamos-Hoey sweep | O(n log n) |
| Point in polygon | N/A (exact) | O(n) | O(n) ray casting | O(n) -- irreducible |
| Polygon area | Shoelace formula (exact) | O(n) | O(n) -- already optimal | O(n) |
"""
)

# =====================================================================
# 07c_Advanced_Trees_Deep.md -- append
# =====================================================================
append_to_file(
    '03_Algorithms/07c_Advanced_Trees_Deep.md',
"""

---

## Proof Corner -- B-Tree Minimum Degree and Height

**Claim**: A B-tree of minimum degree t and n keys has height at most log_t((n+1)/2).

**Proof**: The root has at least 1 key. Every other node has at least t-1 keys. The tree of height h has at least 1 key at the root + 2*(t-1) keys at level 1 + 2*t*(t-1) keys at level 2 + ... = 1 + 2*(t-1)*(t^{h-1} - 1)/(t-1) + ...

**Simplified lower bound**: n+1 >= 2*t^h, so h <= log_t((n+1)/2). For t=1000 (typical disk page), a B-tree with 10^12 keys has height <= log_1000(5*10^11) <= 4. This is why databases use B-trees: 4 disk reads to find any of a trillion records.

**Trie vs B-tree**: Trie height = key length L (independent of n). B-tree height = O(log_t n). For fixed-length keys, Trie is O(L) per op; B-tree is O(L log_t n). Trie wins for short keys in memory; B-tree wins on disk (fewer I/Os due to large branching factor t).

---

## Section Challenge -- Advanced Trees

**Problem 1 (8 min)**: An AVL tree has height at most 1.44 log_2 n. Prove the minimum number of nodes in an AVL tree of height h.

<details><summary>Model Answer</summary>

Let N(h) = minimum number of nodes in an AVL tree of height h.

Base cases: N(-1) = 0 (empty tree), N(0) = 1 (single node), N(1) = 2.

Recurrence: An AVL tree of height h has a root, one subtree of height h-1 (to achieve height h), and one subtree of height >= h-2 (minimum, to satisfy AVL balance). So N(h) = 1 + N(h-1) + N(h-2).

This is similar to Fibonacci: N(h) = Fib(h+3) - 1 where Fib is the Fibonacci sequence. Since Fib(k) ~ phi^k / sqrt(5), N(h) ~ phi^(h+3) / sqrt(5). Therefore h <= log_phi(n * sqrt(5)) - 3 ≈ 1.44 log_2(n).

</details>

---

## Reference Anchor

**java.util.TreeMap -- Red-Black tree in production**:
```java
// java.util.TreeMap: O(log n) per put/get/remove. Backed by a Red-Black tree.
// Red-Black invariants: (1) root is black, (2) red node has black children,
// (3) all paths from any node to null have same number of black nodes.
// These invariants guarantee height <= 2*log_2(n+1) -- so O(log n) operations.

TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(5, "five"); tm.put(3, "three"); tm.put(7, "seven");
System.out.println(tm.floorKey(6));   // 5 -- largest key <= 6
System.out.println(tm.ceilingKey(4)); // 5 -- smallest key >= 4
System.out.println(tm.subMap(3, 7));  // {3=three, 5=five} -- [3,7) range

// Source: jdk/src/java.base/share/classes/java/util/TreeMap.java
// Production use: TreeMap is the standard for ordered key access in Java.
// Use NavigableMap interface for floor/ceiling/higher/lower operations.
```

---

## Brute Force to Optimal -- Tree Structure Selection

| Use case | Brute Force | Problem | Optimal tree | Gain |
|----------|-------------|---------|-------------|------|
| Ordered iteration | Sort on every access | O(n log n) per access | TreeMap (BST) | O(log n) insert, O(n) iterate |
| Prefix search | Scan all keys | O(n*L) | Trie | O(L) per query |
| Range overlap queries | Scan all intervals | O(n) per query | Interval Tree | O(log n + k) where k=matches |
| Large dataset on disk | Full scan | O(n/B) disk I/Os | B-Tree | O(log_B n) disk I/Os |
"""
)

# =====================================================================
# 07d_Probabilistic_DS_Deep.md -- append (1/6 -> 6/6, has only When It Breaks)
# =====================================================================
append_to_file(
    '03_Algorithms/07d_Probabilistic_DS_Deep.md',
"""

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
"""
)

# =====================================================================
# 07e_Advanced_Algorithm_Engineering_Deep.md -- append
# =====================================================================
append_to_file(
    '03_Algorithms/07e_Advanced_Algorithm_Engineering_Deep.md',
"""

---

## Proof Corner -- Cache-Oblivious Algorithm Optimality

**Claim**: The cache-oblivious merge sort achieves optimal cache complexity O(n/B * log_{M/B}(n/B)) for any cache size M and block size B, without knowing M or B at compile time.

**Intuition**: Standard merge sort has a fixed merge size; when the merge size > M (cache size), data is evicted and reloaded. Cache-oblivious merge sort uses a recursive halving strategy: by the time a subproblem fits in cache, it stays in cache for its entire computation. The tree of subproblems naturally exploits the cache hierarchy at every level.

**Algorithm engineering principle**: An algorithm that is asymptotically optimal but cache-unfriendly will lose to a "worse" algorithm that has better data locality. This is why matrix multiplication using blocked (tiled) algorithms outperforms naive O(n^3) on modern CPUs despite the same asymptotic complexity.

---

## When It Breaks -- Algorithm Engineering

**1. Cache miss dominates** -- an algorithm with O(n log n) comparisons but poor data locality can be slower than O(n^2) with sequential access. Cache miss cost = 100-200 CPU cycles vs 1 cycle for L1 hit. Sequential array scan is 16x faster than pointer-chasing through a linked list.

**2. Branch misprediction** -- highly data-dependent branching (e.g., sorting with complex comparators) causes CPU pipeline stalls. Modern CPUs predict branches; a 50% misprediction rate on a tight loop negates the branch predictor benefit. Fix: branchless comparators or SIMD.

**3. False sharing in parallel algorithms** -- two threads writing to different variables that share the same 64-byte cache line cause repeated cache invalidation. Solution: pad data structures to 64-byte boundaries.

**4. JIT compilation warm-up** -- JVM JIT compiles hot methods after ~10,000 invocations. Benchmarks run before JIT compilation show 10-100x worse performance than steady-state. Always run several warmup iterations before measuring.

---

## Section Challenge -- Algorithm Engineering

**Problem 1 (5 min)**: Why does `int[]` sequential scan run ~16x faster than traversal of a `LinkedList<Integer>` for the same n elements? Quantify the cache line effect.

<details><summary>Model Answer</summary>

Modern CPUs have 64-byte cache lines. An `int[]` packs 16 integers per cache line. A sequential scan of n integers causes at most ceil(n/16) cache misses.

A `LinkedList<Integer>` stores each node as an Object (header 16 bytes + int value 4 bytes + boxed overhead + 2 pointers 16 bytes = ~48 bytes). Each node is likely on its own cache line (no spatial locality). Sequential traversal causes approximately n cache misses.

Ratio: n / (n/16) = 16. The `int[]` scan causes 16x fewer cache misses, explaining the ~16x speedup measured empirically. This is the primary reason to prefer `int[]` over `List<Integer>` for performance-critical numerical code.

</details>

---

## Reference Anchor

**JVM performance tools and algorithm engineering**:
```java
// JMH (Java Microbenchmark Harness) -- correct JVM benchmarking:
// @Benchmark annotation, @Warmup(iterations=5), @Measurement(iterations=10)
// Avoids: dead code elimination, constant folding, JIT warm-up bias
// source: github.com/openjdk/jmh

// System.nanoTime() for elapsed time (not currentTimeMillis -- affected by NTP):
long t0 = System.nanoTime();
// ... operation ...
long elapsed = System.nanoTime() - t0;
System.out.printf("%.2f ms%n", elapsed / 1e6);

// Blackhole.consume() in JMH -- prevent dead code elimination:
// @Benchmark public void test(Blackhole bh) { bh.consume(result); }

// java.lang.Runtime.getRuntime().maxMemory() -- check available heap:
long heapMax = Runtime.getRuntime().maxMemory();
System.out.println("Max heap: " + heapMax / (1024*1024) + " MB");
// Set with: java -Xmx4g for 4GB heap

// VarHandle for lock-free algorithms (JDK 9+):
// java.lang.invoke.VarHandle enables CAS operations on fields without Unsafe
```

---

## Brute Force to Optimal -- Algorithm Engineering

| Optimisation | Naive | Problem | Optimised | Gain |
|-------------|-------|---------|-----------|------|
| Matrix multiply | Naive O(n^3) | Cache miss every row | Tiled (blocked) O(n^3) | 10-100x speedup same asymptotic |
| String search | Naive O(nm) | Redundant comparisons | KMP O(n+m) | Asymptotic + cache-friendly |
| Sorting stability | Extra allocation | N/A | TimSort (in-place for primitives) | 0 allocation for int[] |
| Priority queue | LinkedList sorted | Pointer chasing | int[] binary heap | 16x cache speedup |
"""
)

# =====================================================================
# 08b_NumberTheory_Advanced.md
# =====================================================================
patch_anchor(
    '03_Algorithms/08b_NumberTheory_Advanced.md',
    '**Navigation**: [< Previous](08a_NumberTheory_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_Pattern_Programs_Complete.md)',
    """

---

## Proof Corner -- Fermat's Little Theorem and Modular Inverse

**Fermat's Little Theorem**: For prime p and integer a not divisible by p:
a^(p-1) ≡ 1 (mod p).

**Proof sketch**: Consider the set {a, 2a, 3a, ..., (p-1)a} modulo p. All elements are distinct (if ia ≡ ja mod p then i ≡ j mod p since gcd(a,p)=1). All are non-zero. So the set is a permutation of {1, 2, ..., p-1}.

Product of all elements: a * 2a * ... * (p-1)a = a^(p-1) * (p-1)! ≡ (p-1)! (mod p).

Cancel (p-1)! (non-zero mod p): a^(p-1) ≡ 1 (mod p). QED.

**Modular inverse**: Since a^(p-1) ≡ 1 (mod p), we have a^(-1) ≡ a^(p-2) (mod p). This is computed in O(log p) using fast modular exponentiation.

**When Fermat fails**: p must be prime. For composite m, use the extended Euclidean algorithm to find a^(-1) mod m (when gcd(a,m) = 1). Fermat does NOT work for composite moduli.

---

## When It Breaks -- Advanced Number Theory

**1. Applying Fermat's Little Theorem with composite modulus** -- modPow(a, MOD-2, MOD) gives the modular inverse only when MOD is prime. With composite MOD, a^(phi(MOD)-1) is the inverse if gcd(a,MOD)=1, but phi(MOD) is expensive to compute. Fix: always verify MOD is prime before using Fermat.

**2. Integer overflow in factorisation** -- trial division for n up to 10^18 needs to check primes up to sqrt(n) ~ 10^9. A naive loop overflows int; even long arithmetic can overflow when computing trial divisions. Use BigInteger.isProbablePrime() for large n.

**3. CRT (Chinese Remainder Theorem) with non-coprime moduli** -- CRT requires moduli to be pairwise coprime. If gcd(m1, m2) != 1, the system x ≡ a1 mod m1, x ≡ a2 mod m2 may have no solution. Always verify coprimality before applying CRT.

**4. Euler's totient wrong for p^k** -- phi(p^k) = p^(k-1) * (p-1), NOT p-1. A common error: phi(8) = phi(2^3) should be 4, not 1. This matters for RSA key generation and period calculations.

---

## Reference Anchor

**java.math.BigInteger -- number theory operations**:
```java
// Primality (probabilistic Miller-Rabin):
BigInteger n = BigInteger.valueOf(104729);
boolean prime = n.isProbablePrime(50); // error < 4^{-50} ≈ 10^{-30}

// Modular inverse (Euclidean -- works for any modulus, not just prime):
BigInteger a = BigInteger.valueOf(7);
BigInteger mod = BigInteger.valueOf(11);
BigInteger inv = a.modInverse(mod); // 7^{-1} mod 11 = 8
// Verify: 7 * 8 mod 11 = 56 mod 11 = 1. Correct.

// Fast exponentiation:
BigInteger result = BigInteger.valueOf(2).modPow(BigInteger.valueOf(100),
    BigInteger.valueOf(1_000_000_007L)); // 2^100 mod 10^9+7

// For long arithmetic -- manual modPow:
static long modPow(long base, long exp, long mod) {
    long result = 1; base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;
        base = base * base % mod; exp >>= 1;
    }
    return result;
}
// Caution: base * base can overflow long for base ~ 10^9. Use (long)(...)*(long)(...) carefully.
```

---

## Brute Force to Optimal -- Number Theory

| Problem | Brute Force | Time | Optimal | Time |
|---------|-------------|------|---------|------|
| Primality test | Trial division to sqrt(n) | O(sqrt(n)) | Miller-Rabin | O(k log^2 n) |
| All primes up to n | Trial division each | O(n sqrt(n)) | Sieve of Eratosthenes | O(n log log n) |
| GCD(a, b) | Subtract smaller from larger | O(max(a,b)) | Euclidean algorithm | O(log(min(a,b))) |
| Modular inverse | Extended Euclid | O(log m) | Fermat (prime mod only) | O(log p) |
| Factorisation | Trial division | O(sqrt(n)) | Pollard's rho | O(n^{1/4}) |
""",
    prepend=True
)

# =====================================================================
# 09_Pattern_Programs_Complete.md
# =====================================================================
patch_anchor(
    '03_Algorithms/09_Pattern_Programs_Complete.md',
    '**Navigation**: [< Previous](08b_NumberTheory_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_Bit_Manipulation_Complete.md)',
    """

---

## Proof Corner -- Two Pointers O(n) Correctness

**Claim**: The two-pointer technique for finding a pair with a given sum in a sorted array runs in O(n) and is correct.

**Algorithm**: Initialize lo=0, hi=n-1. While lo < hi:
- If arr[lo]+arr[hi] == target: found.
- If arr[lo]+arr[hi] < target: lo++ (need larger sum).
- If arr[lo]+arr[hi] > target: hi-- (need smaller sum).

**Correctness proof**: We maintain the invariant: if a pair (a,b) exists with a=arr[i] for some i < lo, then b cannot be in arr[lo..hi] (because arr[lo]+arr[i's old pair] < target, and arr[lo] > arr[i], so arr[lo] + arr[hi] >= target; we needed a larger value for arr[i] but that would require hi >= hi_when_we_moved_lo, contradiction).

**Simpler argument by elimination**: Each lo++ eliminates arr[lo] as a valid left element for any remaining right element (too small). Each hi-- eliminates arr[hi] as a valid right element (too large). We only eliminate elements that cannot be part of a valid pair.

---

## When It Breaks -- Algorithm Patterns

**1. Two pointers on unsorted array** -- the elimination argument only works because the array is sorted. On an unsorted array, lo++ doesn't guarantee we've eliminated arr[lo] as a valid partner for all remaining elements. Fix: sort first (O(n log n)), or use a HashSet for O(n) on unsorted.

**2. Sliding window with invalid state** -- expanding the window when it's already invalid (before shrinking to fix the violation) leads to double-counting or missed elements. Fix: always shrink to a valid state before moving the right pointer forward.

**3. BFS/DFS layer confusion** -- using DFS to find shortest path (minimum edges) in an unweighted graph. DFS finds A path, not the SHORTEST path. Fix: always use BFS for shortest unweighted path.

**4. Missing visited set in graph traversal** -- DFS/BFS without a visited set revisits nodes, causing infinite loops in cyclic graphs. Symptom: StackOverflowError (DFS) or infinite loop (BFS).

---

## Reference Anchor

**JDK -- pattern-applicable utilities**:
```java
// Two pointers pattern -- standard Java idiom:
int lo = 0, hi = arr.length - 1;
while (lo < hi) {
    int sum = arr[lo] + arr[hi];
    if (sum == target) { /* found */ break; }
    else if (sum < target) lo++;
    else hi--;
}

// Sliding window pattern -- fixed size k:
int windowSum = 0;
for (int i = 0; i < k; i++) windowSum += arr[i]; // initial window
int maxSum = windowSum;
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i-k]; // slide: add new, remove old
    maxSum = Math.max(maxSum, windowSum);
}

// BFS for shortest path:
int[] dist = new int[n];
Arrays.fill(dist, -1);
Queue<Integer> queue = new ArrayDeque<>();
dist[src] = 0; queue.offer(src);
while (!queue.isEmpty()) {
    int u = queue.poll();
    for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u]+1; queue.offer(v); }
}
```

---

## Brute Force to Optimal -- Common Patterns

| Pattern | Brute Force | Optimal | Condition |
|---------|-------------|---------|-----------|
| Pair sum in array | O(n^2) check all pairs | Two pointers O(n) | Sorted array |
| Subarray max/min | O(k) per window | Sliding window O(n) | Fixed-size window |
| Shortest path | DFS finds a path | BFS O(V+E) | Unweighted graph |
| Count subarrays with sum k | O(n^2) | Prefix sum + HashMap O(n) | Any array |
""",
    prepend=True
)

# =====================================================================
# 17_DSA_Java_Implementation_Mastery.md
# =====================================================================
patch_anchor(
    '03_Algorithms/17_DSA_Java_Implementation_Mastery.md',
    '**Navigation**: [< Previous](16_DSA_Deep_Reasoning.md) | [Back to Index](00_INDEX.md) | [Next >](18_Bitwise_Trie_Java_Complete.md)',
    """

---

## Proof Corner -- Why -ea Assertions Don't Slow Production

**Java assertion JVM contract**: `assert expr` is a no-op when assertions are disabled (the default). The bytecode compiles to:
```
if (assertionsEnabled) { if (!expr) throw AssertionError; }
```
The JIT compiler eliminates the disabled branch entirely after warmup. Zero overhead in production.

**Implication**: You can and SHOULD write assertions for all loop invariants and postconditions during development (`-ea`), then ship the same code without `-ea` in production. No extra branch = no performance penalty.

**Correctness verification pattern for implementations**:
```
Assert invariant at loop entry (pre-condition)
Run one iteration
Assert invariant at loop exit (post-condition = next pre-condition)
Use induction: if holds for n iterations and is established at start, holds for n+1
```

---

## When It Breaks -- Java DSA Implementation

**1. Autoboxing in hot loops** -- `List<Integer>` instead of `int[]` autoboxes every element. For n=10^6 elements, this creates 10^6 Integer objects, consuming ~16MB of heap and triggering GC. Fix: prefer primitive arrays for numerical DSA code.

**2. Wrong generic type bounds** -- `Comparable<T>` vs `Comparable<? super T>`. A custom comparator for a subclass of T needs `Comparable<? super T>` to accept parent class comparators. Using the wrong bound causes compile errors when extending the implementation.

**3. Stack overflow in recursive implementations** -- recursive DFS/mergesort on n=100,000 nodes hits JVM default stack limit (~10,000 frames). Fix: use explicit `Deque<>` for DFS or iterative mergesort.

**4. HashCode/equals contract violation** -- overriding `hashCode` but not `equals` (or vice versa) breaks HashMap/HashSet semantics. If `a.equals(b)`, then `a.hashCode() == b.hashCode()` must hold. Violating this causes "ghost" duplicates in HashSet or unreachable keys in HashMap.

---

## Reference Anchor

**OpenJDK -- production-grade DSA implementations to study**:
```java
// java.util.Arrays: DualPivotQuicksort for primitives, TimSort for objects
// Source: jdk/src/java.base/share/classes/java/util/DualPivotQuicksort.java
// Key technique: 2-pivot partitioning creates 3 regions, reduces cache misses

// java.util.HashMap: hash table with tree fallback (JDK 8+)
// Source: jdk/src/java.base/share/classes/java/util/HashMap.java
// Key technique: (h = key.hashCode()) ^ (h >>> 16) -- spread upper bits into lower bits
// to reduce collisions when key.hashCode() has patterns in upper bits only

// java.util.PriorityQueue: binary min-heap
// Source: jdk/src/java.base/share/classes/java/util/PriorityQueue.java
// Heapify bottom-up O(n): start at n/2, sift down each node

// java.util.TreeMap: Red-Black tree
// Source: jdk/src/java.base/share/classes/java/util/TreeMap.java
// Rotation and recoloring after insert/delete maintain RB invariants

// Study pattern: read the invariant comments in each class header,
// then read the put/offer/add methods to see how invariants are maintained.
```

---

## Brute Force to Optimal -- Java Implementation Choices

| Operation | Naive Java | Problem | Optimal Java | Gain |
|-----------|-----------|---------|-------------|------|
| Sort integers | `Arrays.sort(Integer[])` (TimSort) | Autoboxing, non-primitive | `Arrays.sort(int[])` (DualPivotQuicksort) | No boxing, intrinsic |
| Queue | `LinkedList<>` | Pointer chasing | `ArrayDeque<>` | 2-4x cache speedup |
| Stack | `Stack<>` (synchronized) | Unnecessary locking | `ArrayDeque<>` as stack | 10-50x throughput |
| Set membership | `ArrayList.contains()` | O(n) scan | `HashSet.contains()` | O(1) expected |
| Range min/max | Scan range each query | O(n) per query | Sparse table (static) or SegTree | O(1) or O(log n) |
""",
    prepend=True
)

print('Batch 5 (main files) done')
