import sys

def patch_anchor(path, anchor, addition, append_after=True):
    txt = open(path, encoding='utf-8').read()
    if anchor in txt:
        if append_after:
            txt = txt.replace(anchor, anchor + addition, 1)
        else:
            txt = txt.replace(anchor, addition + anchor, 1)
        open(path, 'w', encoding='utf-8').write(txt)
        print('OK:', path)
        return True
    else:
        print('MISS:', path, '--', repr(anchor[:60]))
        return False

# =====================================================================
# 19_Prefix_Sum...md
# =====================================================================
patch_anchor(
    '03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md',
    '**Navigation**: [< Previous](18_Bitwise_Trie_Java_Complete.md) | [Back to Index](00_INDEX.md) | [Next >](20_DSA_Patterns_PDF_Java_Coverage_Map.md)',
    """

---

## Proof Corner -- Prefix Sum Correctness and 2D Extension

**1D Prefix Sum Invariant**: After computing `prefix[i]`, it equals the sum of arr[0..i-1] (i exclusive, 0-indexed with sentinel prefix[0]=0).

**Proof by induction**:
- Base: prefix[0] = 0 = sum of empty prefix. Correct.
- Step: prefix[i] = prefix[i-1] + arr[i-1] = (sum arr[0..i-2]) + arr[i-1] = sum arr[0..i-1]. QED.

**Range sum correctness**: sum(l, r) = prefix[r+1] - prefix[l].
- prefix[r+1] = sum arr[0..r]
- prefix[l] = sum arr[0..l-1]
- Difference = sum arr[l..r]. QED.

**2D Prefix Sum**: prefix2D[i][j] = sum of rectangle arr[0..i-1][0..j-1].

**Inclusion-exclusion identity** (proven by Venn diagram argument):
sum(r1,c1, r2,c2) = prefix2D[r2+1][c2+1] - prefix2D[r1][c2+1] - prefix2D[r2+1][c1] + prefix2D[r1][c1]

The +prefix2D[r1][c1] corrects for double-subtraction of the top-left rectangle.

**Prefix XOR self-inverse property**: XOR is its own inverse (a XOR a = 0). Therefore:
xorPrefix[r+1] XOR xorPrefix[l] = xorPrefix of arr[l..r].

This works for any group where every element is its own inverse.

---

## When It Breaks -- Prefix Sum and XOR

**1. Off-by-one in 1D range query** -- the most common prefix sum bug. With 0-indexed arrays and 0-indexed prefix (no sentinel): sum(l,r) = prefix[r+1] - prefix[l], NOT prefix[r] - prefix[l-1] (which fails for l=0). Always add the sentinel prefix[0]=0 to eliminate the l=0 special case.

**2. 2D prefix sum index confusion** -- prefix2D[i][j] includes row i and column j (0-indexed) or excludes them (1-indexed)? Mixing conventions between build and query gives off-by-one or off-by-row errors. Fix: always use 1-indexed prefix2D (add one row/column of zeros at top and left). Then sum(r1,c1,r2,c2) uses r2+1, c2+1 uniformly.

**3. Prefix XOR on non-commutative operations** -- the prefix trick works only for operations that are associative and have an inverse (group). XOR satisfies this (inverse = itself). But matrix multiplication is not commutative, so prefix[r] * inverse(prefix[l-1]) != range product for non-commutative operations.

**4. Overflow in prefix sum of int[] for large arrays** -- prefix sum of 10^5 elements each up to 10^9 reaches 10^14, overflowing int. Always use long[] for prefix arrays when element values can be large.

---

## Reference Anchor

**JDK -- Arrays.parallelPrefix for parallel prefix computation**:
```java
// java.util.Arrays.parallelPrefix -- computes prefix operation in O(n) with parallelism
int[] arr = {1, 2, 3, 4, 5};
// Cumulative sum (in-place):
Arrays.parallelPrefix(arr, Integer::sum);
// arr is now [1, 3, 6, 10, 15]
// Uses work-stealing fork/join pool -- faster than sequential for n > ~10,000

// For range sum queries -- standard idiom:
long[] prefix = new long[arr.length + 1]; // +1 for sentinel
for (int i = 0; i < arr.length; i++) prefix[i+1] = prefix[i] + arr[i];
long rangeSum = prefix[r+1] - prefix[l]; // sum of arr[l..r]

// For 2D prefix sum:
int[][] grid = new int[m][n];
long[][] p = new long[m+1][n+1];
for (int i = 1; i <= m; i++)
    for (int j = 1; j <= n; j++)
        p[i][j] = grid[i-1][j-1] + p[i-1][j] + p[i][j-1] - p[i-1][j-1];
// Query sum(r1,c1,r2,c2) [0-indexed]: p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1]
```
""",
    append_after=True
)

# =====================================================================
# A1_Correctness_Proofs.md (algo folder)
# =====================================================================
patch_anchor(
    '03_Algorithms/A1_Correctness_Proofs.md',
    '*[Back to Index](00_INDEX.md) | [A2: Complexity from First Principles ->](A2_Complexity_FirstPrinciples.md)*',
    """

---

## When It Breaks -- Correctness Proofs

**1. Loop invariant too weak** -- a loop invariant that doesn't constrain the key variable enough. Example: "i <= n" is technically maintained by a binary search loop but doesn't prove it finds the target. The invariant must be strong enough to imply the postcondition when the loop terminates. Fix: the invariant should say "if target is in arr[0..n-1], it's in arr[lo..hi]."

**2. Induction without a base case** -- inductive step proven for n > 0, but n=0 case not verified. Classic: "the sum of the first n even numbers is n^2." Proven for n->n+1 correctly, but n=0: sum=0=0^2 (fine here, but many proofs skip this). Always check the base case explicitly.

**3. Off-by-one in termination** -- proving termination requires a measure that strictly DECREASES and has a LOWER BOUND. A measure that "decreases or stays the same" doesn't guarantee termination (could stay the same forever). Example: Euclidean GCD -- the measure gcd(a,b) = (a+b) decreases since a mod b < b < a+b. But you must prove it strictly decreases at every step.

**4. Exchange argument with non-comparable elements** -- the exchange argument requires a total order on choices. If the comparison "is choice A at least as good as choice B" is not transitive, the exchange argument fails. Example: a greedy algorithm on weighted intervals requires that "finish time" gives a total order; using a combination of start and finish times breaks transitivity.

---

## Reference Anchor

**CLRS -- Correctness proof templates**:
```
Chapter 2.1: Insertion sort loop invariant (MIT standard)
Chapter 4: Recurrence proof by substitution
Chapter 16.1: Activity selection greedy proof (exchange argument)
Chapter 22.3: DFS correctness (white path theorem)
```

**Java assertions for runtime invariant verification**:
```java
// Enable assertions: run with java -ea
// Check loop invariant at key points:
int lo = 0, hi = arr.length - 1;
while (lo <= hi) {
    assert lo >= 0 && hi < arr.length : "bounds violated: lo=" + lo + " hi=" + hi;
    assert (target < arr[lo] || target > arr[hi])
           || /* target in [lo..hi] */ true; // document the invariant
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}
// Postcondition: target not in arr[0..n-1]
assert java.util.Arrays.binarySearch(arr, target) < 0; // verify with JDK
```

---

## Brute Force to Optimal -- Correctness Verification Costs

| Verification approach | Cost per check | When to use |
|-----------------------|---------------|-------------|
| Full postcondition assertion | O(check complexity) | During testing only |
| Spot-check invariant at key states | O(1) per assertion | In production with -ea |
| Formal proof (pen-and-paper) | N/A | Pre-deployment for safety-critical code |
| Property-based testing (jqwik) | O(num_trials * check) | Randomised verification |
| Model checking (TLA+, Alloy) | Exponential in state space | Small concurrent systems |

The principle: stronger correctness guarantees cost more. Match the guarantee to the risk: informal for prototypes, assertions for development, formal proofs for safety-critical.
""",
    append_after=True
)

# =====================================================================
# A1_DS_Correctness_Invariants.md
# =====================================================================
patch_anchor(
    '02_Data_Structures/A1_DS_Correctness_Invariants.md',
    '*[Back to DS Index](00_INDEX.md) | [A2: DS Complexity from First Principles ->](A2_DS_Complexity_FirstPrinciples.md)*',
    """

---

## When It Breaks -- DS Correctness Invariants

**1. Breaking the BST invariant silently** -- using a `TreeMap` with a comparator that returns 0 for "equal" elements but where the objects are not actually equal by `.equals()`. TreeMap considers two keys equal if `compare(a,b) == 0`, so it silently drops what appears to be a duplicate. Fix: ensure comparator is consistent with equals.

**2. Concurrent modification of invariant-critical structures** -- modifying a HashMap while iterating it (even in a single thread via iterator + put) throws `ConcurrentModificationException`. Modifying a TreeSet during a range query corrupts the invariant. Fix: collect changes in a separate list; apply after the iteration.

**3. CopyOnWrite false safety** -- `CopyOnWriteArrayList` is thread-safe for reads but expensive for writes (O(n) copy). Its iterator sees a snapshot, so writes during iteration are not reflected. This is by design, but it breaks an invariant for code that expects "read-what-you-write" consistency.

**4. Priority queue heapify invariant after direct array access** -- `java.util.PriorityQueue` exposes no way to update an element already inside the heap. Modifying a value "in place" (via reflection or by holding a mutable object reference) silently breaks the heap invariant. Symptom: `poll()` returns elements in wrong order. Fix: remove old element (O(n)), update, re-insert.

---

## Reference Anchor

**JDK -- invariant-maintaining data structures**:
```java
// java.util.TreeMap: Red-Black BST invariant maintained automatically
// Comparator MUST be consistent with equals for correct behavior:
TreeMap<String, Integer> tm = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
tm.put("hello", 1); tm.put("HELLO", 2); // same key! second put overwrites
// tm.size() == 1, not 2 -- because comparator says they're equal

// java.util.PriorityQueue: binary heap invariant
// heapify O(n) done in constructor; each offer/poll O(log n)
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
// WARNING: a[0] - b[0] overflows for large negatives. Use Integer.compare(a[0],b[0])

// java.util.Collections.unmodifiableList -- enforce immutability invariant:
List<Integer> safe = Collections.unmodifiableList(mutableList);
// Any modification throws UnsupportedOperationException
// Does NOT copy -- still reflects changes to the underlying mutableList
```

---

## Brute Force to Optimal -- Invariant Verification Costs

| DS | Brute-force invariant check | Cost | Production approach |
|----|----------------------------|------|---------------------|
| BST | Walk all nodes, verify left <= root <= right | O(n) | Trust TreeMap; assert only in tests |
| Heap | Scan parent-child pairs (n/2 pairs) | O(n) | assert parent <= children in unit test |
| Union-Find | Trace all paths to roots, check union-by-rank | O(n alpha(n)) | Log rank at union time; spot-check in test |
| Skip List | Verify each level is a subset of the level below | O(n log n) | Structural test after bulk insert |

Rule: verifying invariants in production is O(n) or worse -- too slow. Use assertions in test mode (-ea), not on the critical path.
""",
    append_after=True
)

# =====================================================================
# A4_Randomized_Data_Structures.md
# =====================================================================
patch_anchor(
    '02_Data_Structures/A4_Randomized_Data_Structures.md',
    '*[<- A3: DS Lower Bounds](A3_DS_Lower_Bounds.md) | [Back to DS Index](00_INDEX.md)*',
    """
## When It Breaks -- Randomized Data Structures

**1. Bloom filter false negatives** -- Bloom filters have zero false negatives by construction: if an element was inserted, all k hash bits are set, so the query always returns true. BUT: if you delete an element (not supported in standard Bloom filters), unsetting its bits can create false negatives for other elements that shared those bits. Counting Bloom filters (with increment/decrement counters) support deletion but require more space.

**2. HyperLogLog on small sets** -- HyperLogLog is accurate for large cardinalities (relative error ~1.04/sqrt(m) where m = number of registers). For cardinalities < 2.5*m, it uses a small-range correction (linear counting), and for very small sets (< 5), it uses exact counting. Applying HyperLogLog without these corrections on small sets gives zero or wrong cardinality estimates.

**3. Skip list with fixed RNG seed** -- a skip list's expected O(log n) height assumes independently random level promotions. With a fixed seed (java.util.Random(42)), you get a deterministic skip list. If the fixed promotion pattern is adversarial (very long chains at certain levels), operations degrade. Always use ThreadLocalRandom or SecureRandom for skip lists in untrusted contexts.

**4. Count-Min Sketch overestimating** -- Count-Min Sketch can only overestimate (not underestimate) frequencies because hash collisions add to the count. The minimum across all hash tables is the best estimate, but it's still >= true count. Querying a key never inserted can return a positive count (false positive). Design code to tolerate overestimates.

---

## Reference Anchor

**Google Guava -- production Bloom filter**:
```java
// com.google.common.hash.BloomFilter
// k = 7 hash functions, m bits automatically sized for desired FP rate
BloomFilter<String> bf = BloomFilter.create(
    Funnels.stringFunnel(StandardCharsets.UTF_8),
    1_000_000,  // expected insertions
    0.01        // 1% false positive rate
);
bf.put("user:1234");
bf.put("user:5678");
boolean mightExist = bf.mightContain("user:1234"); // true
boolean definitelyNotIn = !bf.mightContain("user:9999"); // true if not inserted
// Serializable for storage/transmission: bf.writeTo(outputStream)

// java.util.concurrent.ConcurrentHashMap -- thread-safe hash map
// Uses segmented locking (JDK 7) / CAS operations (JDK 8+) -- no single global lock
// Expected O(1) per op with load factor <= 0.75
ConcurrentHashMap<String, Integer> freq = new ConcurrentHashMap<>();
freq.merge("word", 1, Integer::sum); // atomic increment
```

---

## Brute Force to Optimal -- Space-Accuracy Tradeoffs

| Problem | Exact (brute force) | Space | Approximate | Space | Error |
|---------|---------------------|-------|-------------|-------|-------|
| Set membership | HashSet | O(n) | Bloom filter | O(n bits / 9.6) | 1% FP, 0% FN |
| Cardinality count | HashSet | O(n) | HyperLogLog | O(m registers) | ~1.04/sqrt(m) |
| Frequency count | HashMap | O(n) | Count-Min Sketch | O(w * d) | epsilon*n additive |
| Quantiles/median | Sort array | O(n log n) | t-digest | O(compression * 100) | ~0.01% relative |

**The fundamental tradeoff**: exact algorithms require O(n) space to remember every element seen. Approximate probabilistic structures use O(1) or O(log n) space but introduce a bounded error. Choose based on acceptable error and memory budget.
""",
    append_after=False  # prepend before nav footer
)

print('Batch 4 done')
