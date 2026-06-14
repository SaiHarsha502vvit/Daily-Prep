import sys, os

def patch(path, anchor, addition, append_after=True):
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
        print('MISS:', path, '--', repr(anchor[:50]))
        return False

# =====================================================================
# 03_PROBLEM_SETS.md
# =====================================================================
patch(
    '03_Algorithms/03_PROBLEM_SETS.md',
    '[<- Back to Semester 1 Guide](../00_CURRICULUM/SEMESTER_1_GUIDE.md) | [DS Problem Sets <-](../02_Data_Structures/02_PROBLEM_SETS.md) | [Java Problem Sets ->](../07_Modern_Java/07_PROBLEM_SETS.md)',
    '\n\n---\n\n## Proof Corner -- Algorithm Problem-Solving Correctness\n\n**Exchange Argument Template** (for greedy correctness proofs):\n\n1. Assume OPT is an optimal solution that differs from Greedy on some step k.\n2. Show you can swap the greedy choice at step k into OPT without decreasing the objective.\n3. Repeat until OPT has been transformed into Greedy, step by step.\n4. Conclude Greedy is also optimal.\n\n**Example -- Activity Selection**: Greedy picks the activity with the earliest finish time. Suppose OPT picks activity b instead of a (where finish(a) <= finish(b)). Swap b for a: a finishes no later than b, so all subsequent activities still fit. OPT with a is no worse. QED.\n\n**Reduction correctness template**: To prove algorithm A solves problem P:\n1. Define a reduction f: P -> Q (transform P-instance to Q-instance).\n2. Show correctness: x is a YES for P if and only if f(x) is a YES for Q.\n3. Show efficiency: f runs in polynomial time.\n\n---\n\n## When It Breaks -- Problem-Solving Strategy\n\n**1. Wrong problem model** -- the most common interview failure. "Minimum number of jumps" sounds like BFS/greedy but the wrong model (DFS) produces wrong answers. Always verify: is the problem asking for shortest PATH (BFS), minimum COST (Dijkstra/DP), or minimum COUNT (DP)?\n\n**2. Ignoring edge cases in reductions** -- empty array, single element, all equal elements, all negative. A solution correct for the average case fails silently on edge cases. Rule: test your solution on n=0, n=1, min value, max value before declaring done.\n\n**3. Greedy without proof** -- applying greedy intuition without verifying the exchange argument. Common failure: "sort by size" for interval covering -- this fails when longer intervals cover more critical positions. Always ask: what property am I optimising, and why does greedy choice not harm future options?\n\n**4. O(n^2) nested loop accepted for n=10^5** -- missing that the constraint n <= 10^5 with 1-second time limit means O(n log n) at most (roughly 10^6 - 10^7 ops/second). A naive O(n^2) solution will TLE. Rule: always estimate operation count from constraints before coding.\n\n---\n\n## Reference Anchor\n\n**CLRS Chapter 16 (Greedy) and Chapter 15 (DP)** -- the canonical references for proving greedy and DP correctness. The exchange argument in CLRS 16.1 (Activity Selection) is the template for all greedy proofs.\n\n**Java competitive programming patterns**:\n```java\n// Fast I/O for competitive problems (Scanner is 10x slower than BufferedReader):\nBufferedReader br = new BufferedReader(new InputStreamReader(System.in));\nStringTokenizer st = new StringTokenizer(br.readLine());\nint n = Integer.parseInt(st.nextToken());\n\n// Output: StringBuilder beats println for many outputs\nStringBuilder sb = new StringBuilder();\nfor (int i = 0; i < n; i++) sb.append(result[i]).append("\\n");\nSystem.out.print(sb);\n\n// java.util.Arrays.sort with custom comparator (avoids boxing overhead for int[]):\nInteger[] arr = ...; Arrays.sort(arr, (a, b) -> a - b); // WARNING: overflow for large values\nArrays.sort(arr, Comparator.comparingInt(x -> x)); // safe\n```\n',
    append_after=True
)

# =====================================================================
# 06c_Advanced_Algo_Deep.md
# =====================================================================
patch(
    '03_Algorithms/06c_Advanced_Algo_Deep.md',
    '> **Navigation**: [< Previous](06a_Greedy_BitManip.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06d_String_Algorithms.md)',
    '\n\n---\n\n## Proof Corner -- Max-Flow Min-Cut Theorem\n\n**Theorem** (Ford-Fulkerson / Menger 1927): The maximum flow from s to t in a network equals the minimum capacity of any s-t cut.\n\n**Proof sketch (three equivalent conditions)**:\n\nLet f* be a max flow. The following are equivalent:\n1. f* is a maximum flow.\n2. There is no augmenting path in the residual graph G_f*.\n3. There exists an s-t cut (S, T) where capacity(S,T) = |f*|.\n\n(1 => 2): If an augmenting path existed, we could increase |f|, contradicting maximality.\n(2 => 3): Let S = {v reachable from s in G_f*}, T = V\\S. t is not in S (no augmenting path). For every edge (u,v) with u in S, v in T: residual capacity = 0, so f(u,v) = c(u,v). For every edge (v,u) with v in T, u in S: f(v,u) = 0. Therefore |f*| = capacity(S,T).\n(3 => 1): |f| <= capacity of any cut. If |f*| = min capacity, f* is maximum. QED.\n\n---\n\n## When It Breaks -- Advanced Algorithms\n\n**1. Augmenting path with real-valued capacities** -- Ford-Fulkerson with irrational capacities can fail to terminate (Zwick 1995). Always use BFS-based Edmonds-Karp (O(VE^2)) or capacity scaling for non-integer inputs.\n\n**2. Negative-weight edges in matching** -- Hungarian algorithm for min-cost matching requires edge weights >= 0 (or a valid potential function). Adding a large constant to make weights non-negative works if done correctly; wrong offset breaks the dual feasibility.\n\n**3. Bipartite check wrong** -- running bipartite matching on a non-bipartite graph produces no valid matching or wrong count. Always verify bipartiteness first (2-coloring BFS). Symptom: matching cardinality lower than expected.\n\n**4. Cycle detection in augmenting paths** -- Bellman-Ford for min-cost flow terminates if there are no negative cycles in the residual graph. A negative cycle means the flow can be reduced/rerouted to decrease cost indefinitely -- no optimal solution exists.\n\n---\n\n## Reference Anchor\n\n**JGraphT -- production graph algorithm library**:\n```java\n// org.jgrapht.alg.flow.MaximumFlowAlgorithmBase\n// PushRelabelMFImpl -- O(V^2 * sqrt(E)) max flow, used in production\n// Source: jgrapht-core/src/main/java/org/jgrapht/alg/flow/\nSimpleDirectedWeightedGraph<String, DefaultWeightedEdge> g =\n    new SimpleDirectedWeightedGraph<>(DefaultWeightedEdge.class);\ng.addVertex("s"); g.addVertex("t"); g.addVertex("A");\nDefaultWeightedEdge e = g.addEdge("s", "A");\ng.setEdgeWeight(e, 10.0);\nMaximumFlowAlgorithm<String, DefaultWeightedEdge> mf =\n    new EdmondsKarpMFImpl<>(g);\nMaximumFlowAlgorithm.MaximumFlow<DefaultWeightedEdge> flow = mf.getMaximumFlow("s", "t");\nSystem.out.println(flow.getValue()); // max flow value\n\n// org.jgrapht.alg.matching.KuhnMunkresMinimalWeightBipartitePerfectMatching\n// Hungarian algorithm for min-cost perfect bipartite matching -- O(n^3)\n```\n',
    append_after=True
)

# =====================================================================
# 06d_String_Algorithms.md (append after last line)
# =====================================================================
path = '03_Algorithms/06d_String_Algorithms.md'
txt = open(path, encoding='utf-8').read()
addition = """

---

## Proof Corner -- Z-Algorithm O(n+m) Correctness

**Z-array definition**: For string S of length n, Z[i] = length of the longest substring starting from S[i] that matches a prefix of S. Z[0] is undefined (or n by convention).

**Claim**: The Z-algorithm computes all Z-values in O(n) time.

**Proof via window maintenance**: Maintain a window [L, R] = the rightmost Z-box seen so far (interval where S[L..R] = S[0..R-L]).

For each i:
- If i > R: compute Z[i] naively by comparing S[i..] with S[0..]. Update [L,R] if Z[i] > 0.
- If i <= R: we know S[i..R] = S[i-L..R-L]. So Z[i] >= min(Z[i-L], R-i+1). If Z[i-L] < R-i+1, Z[i] = Z[i-L] (no extension needed). If Z[i-L] >= R-i+1, extend from R+1 vs R-L+1.

**Key invariant**: Whenever we extend beyond R, we advance R. R advances at most n times total across all iterations. Total naive comparisons <= 2n. O(n) overall. QED.

**Pattern matching application**: Concatenate P + "$" + T (separator "$" not in alphabet). Z-values at positions len(P)+1..len(P)+1+len(T)-1 give how much of P matches at each position in T. Z[i] = len(P) means a complete match starting at T[i - len(P) - 1].

---

## When It Breaks -- String Algorithms

**1. KMP failure function off-by-one** -- `fail[0] = -1` vs `fail[0] = 0` convention determines how you handle mismatches at position 0. Mixing conventions between the failure function builder and the search function produces silent wrong answers. Pick one convention and stick to it.

**2. Rolling hash collision** -- Rabin-Karp uses a polynomial hash mod a prime. Two different substrings can hash to the same value (false positive). Always verify the actual string match on hash collision. With a single 64-bit prime, collision probability per comparison is ~1/p; over n*m comparisons can accumulate. Use double hashing (two independent primes) for high-security matching.

**3. Suffix array with non-ASCII characters** -- standard SA-IS algorithm assumes integer alphabet in range [0..sigma]. For Java strings (UTF-16), cast chars to int but watch for negative values from `charAt()` on supplementary characters. Use `codePointAt()` for Unicode correctness.

**4. Trie vs hash map** -- using a HashMap for prefix matching is O(L) per query (hash the prefix string) but requires the full prefix to exist as a key. A Trie supports O(L) prefix existence check AND O(L) enumeration of all words with a given prefix. Trie is strictly better for prefix queries; HashMap wins for exact-match only.

---

## Reference Anchor

**JDK -- java.lang.String and pattern matching**:
```java
// java.util.regex.Pattern: compiled regex, cached for reuse
// Source: java.base/share/classes/java/util/regex/Pattern.java
// Uses NFA-based matching -- WARNING: catastrophic backtracking on pathological patterns
// e.g., Pattern.compile("(a+)+").matcher("aaaaaaaab") -- exponential time
Pattern p = Pattern.compile("^[a-z]+$");
Matcher m = p.matcher(input);
boolean matches = m.matches(); // O(n) for simple patterns, O(2^n) worst case for nested quantifiers

// java.lang.String.indexOf: two-way matching algorithm in JDK 17+ (O(n+m))
// Before JDK 17: naive O(nm) with early exit optimization
int idx = haystack.indexOf(needle); // prefer over manual KMP for single-pattern search

// com.google.common.hash.Hashing for polynomial string hashing:
// HashCode hc = Hashing.murmur3_128().hashString(s, StandardCharsets.UTF_8);
// For rolling hash, implement manually: hashCode = (hashCode * BASE + c) % MOD
```
"""
with open(path, 'a', encoding='utf-8') as f:
    f.write(addition)
print('OK: 06d_String_Algorithms.md (appended)')

# =====================================================================
# 06e_Algorithm_Patterns.md (append after last line)
# =====================================================================
path = '03_Algorithms/06e_Algorithm_Patterns.md'
txt = open(path, encoding='utf-8').read()
addition = """

---

## Proof Corner -- Sqrt Decomposition O(sqrt(n)) per Query

**Claim**: With sqrt decomposition, each range-sum query over [l, r] costs O(sqrt(n)) time.

**Setup**: Partition array A[0..n-1] into blocks of size B = sqrt(n). Precompute block sums B[k] = sum of A[k*B..(k+1)*B-1].

**Query[l, r]**: Three parts:
1. Left partial block: sum A[l..end of its block] -- at most B-1 elements.
2. Complete middle blocks: sum B[k] for whole blocks inside [l,r] -- at most n/B blocks.
3. Right partial block: sum A[start of last partial block..r] -- at most B-1 elements.

**Total work**: O(B) + O(n/B) + O(B) = O(B + n/B).

**Optimal B**: Minimise B + n/B. By AM-GM, B + n/B >= 2*sqrt(n), achieved when B = sqrt(n).

**Therefore**: Each query costs O(sqrt(n)). Preprocessing O(n). n queries total: O(n + n*sqrt(n)) = O(n*sqrt(n)). QED.

---

## When It Breaks -- Algorithm Patterns

**1. Mo's algorithm on dynamic arrays** -- Mo's algorithm requires a STATIC array (no updates). If the problem has point updates, you need Mo's with updates (3D sorting) which is O(n^(5/3)). Applying standard Mo's with updates gives wrong answers silently.

**2. Meet-in-the-Middle for n > 30** -- MitM halves the search space from 2^n to 2*2^(n/2). For n=40, 2^20 = 1M (fine). For n=60, 2^30 = 1B (too slow). Always compute 2^(n/2) from the problem's n before choosing MitM.

**3. HLD with wrong DFS entry order** -- Heavy-Light Decomposition requires the DFS to visit the heavy child first to guarantee each heavy chain occupies a contiguous segment tree range. Visiting light children first breaks the contiguity invariant: the chain segment tree range becomes non-contiguous, and path queries give wrong results.

**4. Wavelet tree on mutable arrays** -- wavelet trees are static-only (built once). For range k-th queries with updates, you need persistent segment trees or sqrt decomposition. Wavelet tree on a modified array gives stale/wrong answers.

---

## Reference Anchor

**No standard JDK implementations** for sqrt decomp, Mo's, or HLD -- these are competitive programming patterns. Reference implementations:

```java
// Sqrt Decomposition -- range sum with point update:
int[] arr = new int[n];
int B = (int) Math.sqrt(n);
int[] block = new int[(n + B - 1) / B];
// Build: for (int i = 0; i < n; i++) block[i/B] += arr[i];
// Update(i, val): block[i/B] += val - arr[i]; arr[i] = val;
// Query(l, r): sum partial left + sum complete blocks + sum partial right

// Segment tree -- standard pattern in Java:
int[] tree = new int[4 * n];
void build(int node, int l, int r) {
    if (l == r) { tree[node] = arr[l]; return; }
    int mid = (l + r) / 2;
    build(2*node, l, mid); build(2*node+1, mid+1, r);
    tree[node] = tree[2*node] + tree[2*node+1];
}
int query(int node, int l, int r, int ql, int qr) {
    if (ql > r || qr < l) return 0; // identity for sum
    if (ql <= l && r <= qr) return tree[node];
    int mid = (l + r) / 2;
    return query(2*node, l, mid, ql, qr) + query(2*node+1, mid+1, r, ql, qr);
}
// Key: tree[node] covers [l,r]. Children cover [l,mid] and [mid+1,r]. 4*n space for safety.
```
"""
with open(path, 'a', encoding='utf-8') as f:
    f.write(addition)
print('OK: 06e_Algorithm_Patterns.md (appended)')

# =====================================================================
# 07a_Advanced_DS_Core.md
# =====================================================================
patch(
    '03_Algorithms/07a_Advanced_DS_Core.md',
    '**Navigation**: [< Previous](06e_Algorithm_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07b_Advanced_DS_Patterns.md)',
    '\n\n---\n\n## Proof Corner -- Segment Tree O(log n) Update and Query\n\n**Claim**: A segment tree on n elements supports point update and range query each in O(log n) time.\n\n**Tree structure**: A full binary tree with 4n nodes. Node covering [l, r] has children covering [l, mid] and [mid+1, r]. At most 2*ceil(n) - 1 internal nodes plus n leaves. Height = ceil(log_2 n).\n\n**Update proof**: Updating position i requires updating all ancestors of leaf i. The path from root to leaf i has length = height = O(log n). Each ancestor update is O(1) (recompute from children). Total: O(log n).\n\n**Query proof**: Query [ql, qr] recursively visits children only if they intersect [ql, qr]. At each level, at most 2 "boundary" nodes are visited (leftmost and rightmost intersecting nodes). All others are either fully inside (return precomputed value) or fully outside (return identity). Total nodes visited at each of log n levels: O(1) boundary + O(1) = O(1) per level. Total: O(log n). QED.\n\n**Lazy propagation invariant**: A lazy tag at node v means "this tag must be pushed down to children before accessing children". Before any child access, call `pushdown(v)`. This ensures every query and update sees the correct values.\n\n---\n\n## When It Breaks -- Advanced Data Structures\n\n**1. Wrong identity element in segment tree** -- for range minimum queries, the identity is `Integer.MAX_VALUE` (not 0). For range XOR, identity is 0. For range AND, identity is `~0` (all bits set). Using 0 as identity for min-query silently returns 0 for any range that has no elements, corrupting empty-range results.\n\n**2. Lazy propagation push-down order** -- when the lazy tag represents "add delta to all elements in range," the push-down must first apply the parent tag to the child values AND propagate the tag further down. Applying the tag to children but NOT propagating it means the next push-down will double-apply. Standard bug: lazy applied twice.\n\n**3. Segment tree index bounds (4n rule)** -- allocating exactly n nodes causes ArrayIndexOutOfBoundsException for certain n values where the tree is not a perfect binary tree. Always allocate 4*n nodes. The exact bound is 4*n for safety; tight bound is 2*nextPowerOf2(n).\n\n**4. Persistent segment tree version aliasing** -- in a persistent segment tree, creating a new version shares unchanged subtrees with the previous version. If you mistakenly update a shared node in-place, all versions sharing that node see the change. Fix: always create new nodes on the update path; never mutate shared nodes.\n\n---\n\n## Reference Anchor\n\n**No standard JDK segment tree** -- Java provides only `java.util.TreeMap` (BST, not segment tree). For production use, implement from scratch:\n\n```java\n// Segment tree with lazy propagation for range add + range sum:\nclass SegTree {\n    long[] sum, lazy;\n    int n;\n    SegTree(int n) { this.n = n; sum = new long[4*n]; lazy = new long[4*n]; }\n    void push(int node, int l, int r) {\n        if (lazy[node] != 0) {\n            int mid = (l+r)/2;\n            apply(2*node, l, mid, lazy[node]);\n            apply(2*node+1, mid+1, r, lazy[node]);\n            lazy[node] = 0;\n        }\n    }\n    void apply(int node, int l, int r, long delta) {\n        sum[node] += delta * (r - l + 1);\n        lazy[node] += delta;\n    }\n    void update(int node, int l, int r, int ql, int qr, long delta) {\n        if (ql > r || qr < l) return;\n        if (ql <= l && r <= qr) { apply(node, l, r, delta); return; }\n        push(node, l, r);\n        int mid = (l+r)/2;\n        update(2*node, l, mid, ql, qr, delta);\n        update(2*node+1, mid+1, r, ql, qr, delta);\n        sum[node] = sum[2*node] + sum[2*node+1];\n    }\n}\n// Used in: Netflix job scheduling, database range queries, competitive programming\n```\n',
    append_after=True
)

# =====================================================================
# 07b_Advanced_DS_Patterns.md (append after last line)
# =====================================================================
path = '03_Algorithms/07b_Advanced_DS_Patterns.md'
txt = open(path, encoding='utf-8').read()
addition = """

---

## Proof Corner -- Fenwick Tree (BIT) Correctness

**Claim**: A Fenwick tree (Binary Indexed Tree) on n elements supports prefix sum queries and point updates each in O(log n) time using O(n) space.

**lowbit trick**: For index i (1-indexed), `lowbit(i) = i & (-i)` gives the value of the lowest set bit of i.

**Invariant**: `bit[i]` stores the sum of arr[i - lowbit(i) + 1 .. i] (the range of length lowbit(i) ending at i).

**Update(i, delta)**: Add delta to all BIT nodes that "cover" position i:
```
while (i <= n) { bit[i] += delta; i += i & (-i); }
```
Each step moves to the parent in the BIT implicit tree. Number of steps = number of bits that can carry = O(log n).

**Query prefix_sum(i)**: Sum all BIT nodes that together cover [1..i]:
```
while (i > 0) { sum += bit[i]; i -= i & (-i); }
```
Each step removes the lowest set bit of i; stops when i=0. Number of steps = number of set bits in i <= log n. O(log n). QED.

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
"""
with open(path, 'a', encoding='utf-8') as f:
    f.write(addition)
print('OK: 07b_Advanced_DS_Patterns.md (appended)')

# =====================================================================
# 08a_NumberTheory_Core.md
# =====================================================================
patch(
    '03_Algorithms/08a_NumberTheory_Core.md',
    '> **Navigation**: [< Previous](07b_Advanced_DS_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08b_NumberTheory_Advanced.md)',
    '\n\n---\n\n## Proof Corner -- Sieve of Eratosthenes O(n log log n)\n\n**Claim**: The Sieve of Eratosthenes marks all composite numbers up to n in O(n log log n) time.\n\n**Proof**: For each prime p, we mark p^2, p^2+p, p^2+2p, ... up to n. The number of markings for prime p is (n - p^2)/p + 1 <= n/p.\n\n**Total markings** = sum over all primes p <= n of n/p = n * sum_{p prime, p<=n} 1/p.\n\nBy the prime harmonic series (Mertens second theorem): sum_{p prime, p<=n} 1/p ~ ln ln n.\n\nTherefore total markings = O(n log log n). QED.\n\n**Why start at p^2**: All composites p*k with k < p have already been marked by the prime factors of k (which are less than p). Starting at p^2 avoids redundant work and is the key optimisation.\n\n**GCD correctness (Euclidean algorithm)**: gcd(a, b) = gcd(b, a mod b) because any common divisor of a and b also divides a mod b = a - floor(a/b)*b, and conversely any common divisor of b and a mod b divides a.\n\n---\n\n## When It Breaks -- Number Theory\n\n**1. int overflow in modular arithmetic** -- `(a * b) % MOD` where a, b are close to Integer.MAX_VALUE (10^9) and MOD = 10^9+7. a*b can reach ~10^18, which overflows int (max ~2*10^9). Always use `long` for intermediate products: `(long) a * b % MOD`.\n\n**2. Euler totient for prime powers** -- phi(p^k) = p^k - p^{k-1} (not p-1). A common mistake: phi(8) = phi(2^3) should be 4, not 1 (phi for prime p). Using phi(p) = p-1 for prime powers gives wrong answers in modular inverse calculations.\n\n**3. Modular inverse assumptions** -- `modPow(a, MOD-2, MOD)` (Fermat little theorem) gives the inverse of a only when MOD is prime AND gcd(a, MOD) = 1. If a is divisible by MOD, the inverse does not exist. Always check a % MOD != 0 before computing modular inverse.\n\n**4. GCD of negative numbers** -- in Java, `%` operator returns negative values for negative dividends: `-7 % 3 = -1` in Java, but mathematically `(-7) mod 3 = 2`. Euclidean algorithm breaks if a or b can be negative. Always pass `Math.abs(a)` to GCD functions.\n\n---\n\n## Reference Anchor\n\n**java.math.BigInteger -- production number theory**:\n```java\n// Primality test (Miller-Rabin probabilistic):\nBigInteger n = BigInteger.valueOf(997);\nboolean isPrime = n.isProbablePrime(50); // 50 rounds, error prob < 4^{-50}\n// Certainty 50 means error prob < (1/4)^50 -- effectively zero for practical purposes\n\n// Modular arithmetic with BigInteger:\nBigInteger mod = BigInteger.valueOf(1_000_000_007L);\nBigInteger result = a.multiply(b).mod(mod); // (a*b) % MOD -- handles arbitrary precision\n\n// GCD:\nBigInteger g = a.gcd(b); // Euclidean algorithm, always non-negative\n\n// For int/long -- Apache Commons Math:\n// org.apache.commons.math3.util.ArithmeticUtils.gcd(int a, int b)\n// Handles negative inputs correctly (returns non-negative GCD)\nimport org.apache.commons.math3.util.ArithmeticUtils;\nlong g2 = ArithmeticUtils.gcd(48L, -18L); // returns 6\n```\n',
    append_after=True
)

# =====================================================================
# 18_Bitwise_Trie_Java_Complete.md (append after last line)
# =====================================================================
path = '03_Algorithms/18_Bitwise_Trie_Java_Complete.md'
txt = open(path, encoding='utf-8').read()
addition = """

---

## Proof Corner -- Trie O(L) per Operation

**Claim**: Insert, search, and prefix-exists on a Trie each cost O(L) where L is the word/prefix length.

**Proof**: Each operation traverses at most L edges from the root to a depth-L node. At each node, we access `children[c]` for character c -- O(1) array access (or O(log sigma) for sorted map children). No backtracking: the path is uniquely determined by the characters of the word. Therefore: O(L) operations per step * 1 step per character = O(L). QED.

**Space**: A Trie with n words each of average length L has at most n*L nodes (no sharing) and at least L distinct nodes (maximum sharing along common prefixes). Space = O(n*L) worst case.

**Proof that Trie outperforms HashSet for prefix queries**: HashSet.contains("cat") is O(L) for hashing + O(L) for equality check = O(L). Trie.startsWith("ca") is also O(L). BUT: "enumerate all words with prefix X" requires O(n*L) scanning in a HashSet vs O(matches*L) in a Trie (following the prefix path then DFS). For k matches, Trie wins when k << n.

---

## When It Breaks -- Bitwise Operations and Tries

**1. Missing isEnd flag in Trie** -- "cat" and "ca" share the path c->a->t. Without `isEnd` at the 'a' node, a search for "ca" traverses to 'a' successfully and incorrectly returns true (thinking "cat" means "ca" exists). Always set `isEnd = true` at the exact end node of each inserted word.

**2. Trie deletion corrupting other words** -- deleting "cat" by removing the 'c', 'a', 't' nodes also deletes "cats" and "catch". Fix: only remove a node if it has no children and `isEnd = false` after clearing the end marker. Traverse bottom-up and delete only empty leaf nodes.

**3. XOR maximum in bitwise Trie -- wrong bit order** -- when inserting numbers into a XOR-max Trie, you must insert from the most significant bit (bit 31 or 30) down to bit 0. Inserting LSB-first builds a Trie that gives the wrong greedy choice at each bit position.

**4. Signed shift vs unsigned shift** -- `n >> 1` in Java is arithmetic right shift (fills MSB with sign bit). For negative n, `n >> 1` != n / 2 in all cases. For bit manipulation of unsigned values, use `n >>> 1` (logical right shift, fills with 0). Swapping these causes wrong XOR, popcount, or number of set bits for negative inputs.

---

## Reference Anchor

**JDK bit manipulation utilities**:
```java
// java.lang.Integer -- intrinsic methods (JVM maps to hardware instructions)
Integer.bitCount(n);          // POPCNT instruction -- O(1) hardware
Integer.highestOneBit(n);     // isolate highest set bit
Integer.numberOfLeadingZeros(n);  // BSR instruction
Integer.numberOfTrailingZeros(n); // BSF instruction
Integer.reverse(n);           // bit reversal
Integer.toBinaryString(n);    // for debugging (no leading zeros)

// XOR tricks -- standard bit-manipulation idioms:
// n & (n-1) -- clear lowest set bit (check if power of 2: n & (n-1) == 0)
// n & (-n)  -- isolate lowest set bit (same as lowbit in BIT)
// n ^ (n-1) -- toggle all bits up to and including lowest set bit
// a ^ b ^ b == a -- self-inverse property used in single-number problems

// Apache Commons Collections -- Patricia Trie (for String keys):
// org.apache.commons.collections4.trie.PatriciaTrie
// Compressed trie (radix tree) for String keys, O(L) per op, space-efficient
PatriciaTrie<Integer> trie = new PatriciaTrie<>();
trie.put("hello", 1);
SortedMap<String, Integer> prefix = trie.prefixMap("he"); // all keys starting with "he"
```
"""
with open(path, 'a', encoding='utf-8') as f:
    f.write(addition)
print('OK: 18_Bitwise_Trie_Java_Complete.md (appended)')

print('Batch 3 done')
