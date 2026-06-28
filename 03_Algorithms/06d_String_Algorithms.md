---

# Advanced Algorithm Patterns & Competitive Programming

> **Part B of Advanced Algorithms**
> **Navigation**: [Part A: Core Techniques](06a_Greedy_BitManip.md) | [Back to Index](../00_MASTER_INDEX.md)

---

<details>
<summary><b>🧠 5W1H: Advanced Algorithm Patterns & String Algorithms</b></summary>

- **What**: Advanced patterns (Meet in the Middle, Sqrt Decomposition, Mo's, Heavy-Light Decomposition), String Algorithms (Manacher, Z-Algo, Suffix Arrays), and Competitive Programming tricks.
- **Why**: Standard algorithms fail on time/space limits for certain complex problems (e.g. range queries on trees, large substring matching). These techniques push the boundaries of what is computable within 1-2 seconds.
- **When**: Use when standard DP is too slow, when dealing with massive strings where $O(N^2)$ is impossible, or when answering multiple offline queries (Mo's).
- **Where**: Competitive programming platforms (Codeforces, LeetCode Hard), and high-performance text processing systems (search engines, bioinformatics).
- **Who**: Competitive programmers, performance engineers, and backend developers scaling systems.
- **How**: By exploiting mathematical boundaries (Sqrt), offline sorting (Mo's), pattern preprocessing (Z-array), and bitwise tricks.
</details>

---

### Historical Evolution

Efficient string pattern matching emerged as critical with the rise of large text corpora in the 1970s. Before efficient algorithms, **naive pattern matching** ($O(nm)$) was the only option — comparing every position of a text of length $n$ with a pattern of length $m$, performing $O(nm)$ character comparisons in the worst case. **Knuth, Morris, and Pratt (1977)** published KMP in the SIAM Journal of Computing, introducing the preprocessing of the pattern into a failure function (also independently discovered by **J. H. Morris** for text editor applications at the same time) — KMP reduces worst-case to $O(n+m)$ by ensuring no character of the text is examined more than once. **Rabin and Karp (1987)** (though the hash-based approach was known earlier) proposed using rolling hash for pattern matching, enabling $O(n+m)$ average case with randomization — this was particularly important because it extended naturally to multi-pattern matching and 2D pattern matching. **Z-Algorithm** was developed by **Gusfield (1997)** building on the work of **Crochemore and Perrin (1991)** — the Z-array captures the longest prefix match at each position and achieves $O(n+m)$ without a DFA. **Manacher's algorithm (1975)** for longest palindromic substring discovered the elegant trick of tracking the "center" and "radius" of palindromes in a single pass. Modern practice (post-2010) includes suffix arrays (Manber-Myers 1990, also known in 1991), used in full-text indices of bioinformatics tools (BWA, Bowtie), and Aho-Corasick (1975) for multi-pattern matching in network intrusion detection systems.

---

## PART 12: Advanced Algorithm Patterns for Interviews

### Pattern 1: Meet in the Middle

```
CONCEPT:
Split problem into two halves, solve each, combine.
Reduces O(2^n) to O(2^(n/2) * log(2^(n/2)))

USE CASES:
- Subset sum with n up to 40
- 4Sum with large arrays
- Problems where n is too large for brute force but small enough for 2^(n/2)

WHEN TO USE:
- 20 ≤ n ≤ 40 (too big for 2^n, too small for DP)
- Need all possible combinations
- Can split problem naturally into two halves
```

```java
// Meet in the Middle: Subset Sum for n up to 40
public class MeetInMiddle {
    public int countSubsetSums(int[] arr, int target) {
        int n = arr.length;
        int leftHalf = n / 2;
        int rightHalf = n - leftHalf;

        // Generate all possible sums for left half
        List<Long> leftSums = new ArrayList<>();
        generateSums(arr, 0, leftHalf, 0, leftSums);

        // Generate all possible sums for right half
        List<Long> rightSums = new ArrayList<>();
        generateSums(arr, leftHalf, n, 0, rightSums);

        // Sort right sums for binary search
        Collections.sort(rightSums);

        int count = 0;
        for (long leftSum : leftSums) {
            // Find how many right sums complement this left sum
            long needed = target - leftSum;
            int lower = lowerBound(rightSums, needed);
            int upper = upperBound(rightSums, needed);
            count += (upper - lower);
        }

        return count;
    }

    private void generateSums(int[] arr, int start, int end,
                              long currentSum, List<Long> sums) {
        if (start == end) {
            sums.add(currentSum);
            return;
        }
        // Don't include current element
        generateSums(arr, start + 1, end, currentSum, sums);
        // Include current element
        generateSums(arr, start + 1, end, currentSum + arr[start], sums);
    }

    private int lowerBound(List<Long> list, long target) {
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid) < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    private int upperBound(List<Long> list, long target) {
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid) <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
```

### Pattern 2: Sqrt Decomposition

```
CONCEPT:
Divide array into √n blocks for efficient queries.

TIME COMPLEXITY:
- Preprocessing: O(n)
- Query: O(√n)
- Update: O(1) to O(√n)

USE CASES:
- Range sum queries with updates
- Mode queries
- Range minimum queries (simpler than Segment Tree)
```

```java
public class SqrtDecomposition {
    private int[] arr;
    private int[] blockSum;
    private int blockSize;

    public SqrtDecomposition(int[] input) {
        this.arr = input.clone();
        this.blockSize = (int) Math.ceil(Math.sqrt(input.length));
        int numBlocks = (int) Math.ceil((double) input.length / blockSize);
        this.blockSum = new int[numBlocks];

        // Build block sums
        for (int i = 0; i < input.length; i++) {
            blockSum[i / blockSize] += input[i];
        }
    }

    // Range sum query [l, r]
    public int query(int l, int r) {
        int sum = 0;

        // If l and r in same block, iterate directly
        if (l / blockSize == r / blockSize) {
            for (int i = l; i <= r; i++) {
                sum += arr[i];
            }
            return sum;
        }

        // Left partial block
        int leftBlockEnd = (l / blockSize + 1) * blockSize - 1;
        for (int i = l; i <= leftBlockEnd; i++) {
            sum += arr[i];
        }

        // Full blocks in middle
        for (int block = l / blockSize + 1; block < r / blockSize; block++) {
            sum += blockSum[block];
        }

        // Right partial block
        int rightBlockStart = (r / blockSize) * blockSize;
        for (int i = rightBlockStart; i <= r; i++) {
            sum += arr[i];
        }

        return sum;
    }

    // Point update
    public void update(int index, int value) {
        int block = index / blockSize;
        blockSum[block] += (value - arr[index]);
        arr[index] = value;
    }
}
```

### Pattern 3: Mo's Algorithm

```
CONCEPT:
Offline algorithm for range queries without updates.
Sort queries cleverly to minimize array traversal.

TIME COMPLEXITY:
O((n + q) * √n) where q = number of queries

KEY INSIGHT:
Sort queries by (left / √n, right) to minimize pointer movements.
```

```java
public class MosAlgorithm {
    private int blockSize;

    // Count distinct elements in range queries
    public int[] processQueries(int[] arr, int[][] queries) {
        int n = arr.length;
        int q = queries.length;
        blockSize = (int) Math.sqrt(n);

        // Create query objects with original indices
        int[][] indexedQueries = new int[q][3];
        for (int i = 0; i < q; i++) {
            indexedQueries[i] = new int[]{queries[i][0], queries[i][1], i};
        }

        // Sort by Mo's ordering
        Arrays.sort(indexedQueries, (a, b) -> {
            int blockA = a[0] / blockSize;
            int blockB = b[0] / blockSize;
            if (blockA != blockB) return blockA - blockB;
            // Zig-zag optimization for even/odd blocks
            return (blockA % 2 == 0) ? a[1] - b[1] : b[1] - a[1];
        });

        int[] result = new int[q];
        int[] count = new int[1000001]; // Frequency array
        int distinctCount = 0;
        int currL = 0, currR = -1;

        for (int[] query : indexedQueries) {
            int l = query[0], r = query[1], idx = query[2];

            // Expand/contract right pointer
            while (currR < r) {
                currR++;
                if (count[arr[currR]]++ == 0) distinctCount++;
            }
            while (currR > r) {
                if (--count[arr[currR]] == 0) distinctCount--;
                currR--;
            }

            // Expand/contract left pointer
            while (currL < l) {
                if (--count[arr[currL]] == 0) distinctCount--;
                currL++;
            }
            while (currL > l) {
                currL--;
                if (count[arr[currL]]++ == 0) distinctCount++;
            }

            result[idx] = distinctCount;
        }

        return result;
    }
}
```

### Pattern 4: Heavy-Light Decomposition

```
CONCEPT:
Decompose tree into heavy and light paths.
Enables efficient path queries on trees.

TIME COMPLEXITY:
- Preprocessing: O(n)
- Path Query: O(log²n) with Segment Tree
- Path Update: O(log²n)

KEY INSIGHT:
Any path from leaf to root crosses at most log(n) light edges.
```

```java
public class HeavyLightDecomposition {
    private List<List<Integer>> adj;
    private int[] parent, depth, heavy, head, pos;
    private int[] segTree;
    private int n, currPos;

    public HeavyLightDecomposition(int n) {
        this.n = n;
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        parent = new int[n];
        depth = new int[n];
        heavy = new int[n];
        head = new int[n];
        pos = new int[n];
        segTree = new int[4 * n];
        Arrays.fill(heavy, -1);
    }

    public void addEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    // DFS to find heavy children
    private int dfs(int v, int p, int d) {
        parent[v] = p;
        depth[v] = d;
        int size = 1;
        int maxChildSize = 0;

        for (int u : adj.get(v)) {
            if (u != p) {
                int childSize = dfs(u, v, d + 1);
                size += childSize;
                if (childSize > maxChildSize) {
                    maxChildSize = childSize;
                    heavy[v] = u;
                }
            }
        }
        return size;
    }

    // Decompose into chains
    private void decompose(int v, int h) {
        head[v] = h;
        pos[v] = currPos++;

        if (heavy[v] != -1) {
            decompose(heavy[v], h);  // Continue heavy path
        }

        for (int u : adj.get(v)) {
            if (u != parent[v] && u != heavy[v]) {
                decompose(u, u);  // Start new chain
            }
        }
    }

    // Query maximum on path from u to v
    public int pathQuery(int u, int v) {
        int result = Integer.MIN_VALUE;

        while (head[u] != head[v]) {
            if (depth[head[u]] < depth[head[v]]) {
                int temp = u; u = v; v = temp;
            }
            result = Math.max(result, segQuery(1, 0, n - 1, pos[head[u]], pos[u]));
            u = parent[head[u]];
        }

        if (depth[u] > depth[v]) {
            int temp = u; u = v; v = temp;
        }
        return Math.max(result, segQuery(1, 0, n - 1, pos[u], pos[v]));
    }

    private int segQuery(int node, int start, int end, int l, int r) {
        if (r < start || l > end) return Integer.MIN_VALUE;
        if (l <= start && end <= r) return segTree[node];
        int mid = (start + end) / 2;
        return Math.max(
            segQuery(2 * node, start, mid, l, r),
            segQuery(2 * node + 1, mid + 1, end, l, r)
        );
    }
}
```

---

## PART 13: String Algorithms Deep Dive

### Manacher's Algorithm (Longest Palindromic Substring)

```
CONCEPT:
Find longest palindromic substring in O(n).
Uses previously computed palindromes to skip comparisons.

KEY INSIGHT:
If we're at position i and we know a palindrome centered at c
extends to right boundary r, we can use mirror position.
```

```java
public class ManacherAlgorithm {
    public String longestPalindrome(String s) {
        // Transform: "abc" → "^#a#b#c#$"
        StringBuilder sb = new StringBuilder("^#");
        for (char c : s.toCharArray()) {
            sb.append(c).append('#');
        }
        sb.append('$');
        String T = sb.toString();
        int n = T.length();

        int[] P = new int[n];  // P[i] = radius of palindrome centered at i
        int C = 0, R = 0;      // Center and right boundary

        for (int i = 1; i < n - 1; i++) {
            int mirror = 2 * C - i;

            if (i < R) {
                P[i] = Math.min(R - i, P[mirror]);
            }

            // Expand around center i
            while (T.charAt(i + P[i] + 1) == T.charAt(i - P[i] - 1)) {
                P[i]++;
            }

            // Update center and right boundary
            if (i + P[i] > R) {
                C = i;
                R = i + P[i];
            }
        }

        // Find maximum
        int maxLen = 0, centerIdx = 0;
        for (int i = 1; i < n - 1; i++) {
            if (P[i] > maxLen) {
                maxLen = P[i];
                centerIdx = i;
            }
        }

        int start = (centerIdx - maxLen) / 2;
        return s.substring(start, start + maxLen);
    }
}
```

### Z-Algorithm (Pattern Matching)

```
CONCEPT:
Z[i] = length of longest substring starting at i
that matches a prefix of the string.

TIME: O(n + m) for pattern matching
SPACE: O(n + m)

USE CASES:
- Pattern matching
- Finding periods in string
- Longest common prefix queries
```

```java
public class ZAlgorithm {
    public int[] calculateZ(String s) {
        int n = s.length();
        int[] Z = new int[n];
        int L = 0, R = 0;

        for (int i = 1; i < n; i++) {
            if (i < R) {
                Z[i] = Math.min(R - i, Z[i - L]);
            }

            // Try to extend
            while (i + Z[i] < n && s.charAt(Z[i]) == s.charAt(i + Z[i])) {
                Z[i]++;
            }

            // Update window
            if (i + Z[i] > R) {
                L = i;
                R = i + Z[i];
            }
        }

        return Z;
    }

    // Find all occurrences of pattern in text
    public List<Integer> findPattern(String text, String pattern) {
        String combined = pattern + "$" + text;
        int[] Z = calculateZ(combined);

        List<Integer> matches = new ArrayList<>();
        int patLen = pattern.length();

        for (int i = patLen + 1; i < combined.length(); i++) {
            if (Z[i] == patLen) {
                matches.add(i - patLen - 1);
            }
        }

        return matches;
    }
}
```

### Suffix Array (Memory-Efficient Alternative to Suffix Tree)

```
CONCEPT:
Array of starting positions of all suffixes, sorted lexicographically.
Much more memory-efficient than Suffix Tree.

TIME: O(n log n) construction, O(m log n) search
SPACE: O(n)
```

```java
public class SuffixArray {
    private String text;
    private int[] sa;      // Suffix array
    private int[] lcp;     // LCP array

    public SuffixArray(String text) {
        this.text = text;
        int n = text.length();

        // Build suffix array using prefix doubling
        Integer[] order = new Integer[n];
        int[] rank = new int[n];
        int[] tmp = new int[n];

        // Initialize with character ranks
        for (int i = 0; i < n; i++) {
            order[i] = i;
            rank[i] = text.charAt(i);
        }

        for (int k = 1; k < n; k *= 2) {
            final int[] r = rank;
            final int kk = k;

            // Sort by (rank[i], rank[i+k])
            Arrays.sort(order, (a, b) -> {
                if (r[a] != r[b]) return r[a] - r[b];
                int ra = a + kk < n ? r[a + kk] : -1;
                int rb = b + kk < n ? r[b + kk] : -1;
                return ra - rb;
            });

            // Update ranks
            tmp[order[0]] = 0;
            for (int i = 1; i < n; i++) {
                int prev = order[i - 1], curr = order[i];
                boolean same = r[prev] == r[curr] &&
                    (prev + kk < n ? r[prev + kk] : -1) ==
                    (curr + kk < n ? r[curr + kk] : -1);
                tmp[curr] = tmp[prev] + (same ? 0 : 1);
            }
            rank = tmp.clone();
        }

        this.sa = new int[n];
        for (int i = 0; i < n; i++) {
            sa[i] = order[i];
        }

        buildLCP();
    }

    // Kasai's algorithm for LCP array
    private void buildLCP() {
        int n = text.length();
        lcp = new int[n];
        int[] rank = new int[n];

        for (int i = 0; i < n; i++) {
            rank[sa[i]] = i;
        }

        int k = 0;
        for (int i = 0; i < n; i++) {
            if (rank[i] == 0) {
                k = 0;
                continue;
            }

            int j = sa[rank[i] - 1];
            while (i + k < n && j + k < n &&
                   text.charAt(i + k) == text.charAt(j + k)) {
                k++;
            }

            lcp[rank[i]] = k;
            if (k > 0) k--;
        }
    }

    // Count distinct substrings
    public long countDistinctSubstrings() {
        int n = text.length();
        long total = (long) n * (n + 1) / 2;
        long duplicates = 0;
        for (int i = 1; i < n; i++) {
            duplicates += lcp[i];
        }
        return total - duplicates;
    }
}
```

---

> **Note:** Graph algorithms (Tarjan's SCC, Kosaraju's, 2-SAT, A\*, Bridges)
> have been moved to their proper home:
> [05d_Graphs_Advanced_Algos.md](05d_Graphs_Advanced_Algos.md)

---

> 🔬 **Section Challenge — PART 13: String Algorithms Deep Dive**

**Challenge 1 (Reasoning):** In Manacher's algorithm, when `i < R`, we set `P[i] = Math.min(R - i, P[mirror])`. Why do we take the _minimum_ of these two values instead of just `P[mirror]`?

<details><summary>Answer</summary>

The mirror palindrome `P[mirror]` might extend _beyond_ the left boundary of the current known palindrome centered at `C`. If `mirror - P[mirror] < L` (where L = 2\*C - R), the mirror's palindrome reaches past what our current center `C` can guarantee. Beyond the boundary `R`, we have no information — the characters are unverified. So `R - i` caps how much we can "trust" from the mirror. After this initialization, we still try to expand outward, character by character. This is why Manacher's is O(N): the cap ensures each character is compared at most once across all expansions.

</details>

## PART 15: Competitive Programming Tricks

### Fast I/O

```java
import java.io.*;
import java.util.*;

public class FastIO {
    static BufferedReader br = new BufferedReader(
        new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(
        new BufferedOutputStream(System.out));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    static int nextInt() throws IOException {
        return Integer.parseInt(next());
    }

    static long nextLong() throws IOException {
        return Long.parseLong(next());
    }

    static double nextDouble() throws IOException {
        return Double.parseDouble(next());
    }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = nextInt();
        }

        // Process...

        out.println("Result");
        out.flush();
    }
}
```

### Modular Arithmetic Utilities

```java
public class ModUtils {
    static final long MOD = 1_000_000_007;

    // Modular exponentiation
    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) {
                result = (result * base) % mod;
            }
            base = (base * base) % mod;
            exp >>= 1;
        }
        return result;
    }

    // Modular inverse using Fermat's little theorem
    static long modInverse(long a, long mod) {
        return power(a, mod - 2, mod);
    }

    // nCr mod p
    static long nCr(int n, int r, long[] fact, long[] invFact) {
        if (r > n || r < 0) return 0;
        return (fact[n] * invFact[r] % MOD) * invFact[n - r] % MOD;
    }

    // Precompute factorials
    static void precomputeFactorials(int maxN, long[] fact, long[] invFact) {
        fact[0] = 1;
        for (int i = 1; i <= maxN; i++) {
            fact[i] = fact[i - 1] * i % MOD;
        }
        invFact[maxN] = modInverse(fact[maxN], MOD);
        for (int i = maxN - 1; i >= 0; i--) {
            invFact[i] = invFact[i + 1] * (i + 1) % MOD;
        }
    }

    // Lucas theorem for large n, r with small prime p
    static long lucasnCr(long n, long r, int p) {
        if (r == 0) return 1;
        return (lucasnCr(n / p, r / p, p) *
                smallnCr((int)(n % p), (int)(r % p), p)) % p;
    }

    static long smallnCr(int n, int r, int p) {
        if (r > n) return 0;
        long num = 1, den = 1;
        for (int i = 0; i < r; i++) {
            num = num * (n - i) % p;
            den = den * (i + 1) % p;
        }
        return num * power(den, p - 2, p) % p;
    }
}
```

### Coordinate Compression

```java
public class CoordinateCompression {
    public static int[] compress(int[] arr) {
        // Get unique sorted values
        Set<Integer> set = new TreeSet<>();
        for (int x : arr) set.add(x);

        // Create mapping
        Map<Integer, Integer> map = new HashMap<>();
        int idx = 0;
        for (int x : set) {
            map.put(x, idx++);
        }

        // Compress
        int[] compressed = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            compressed[i] = map.get(arr[i]);
        }

        return compressed;
    }

    // Example: Range queries with large values
    // Original: [1000000, 1, 999999]
    // Compressed: [2, 0, 1]
}
```

### Bit Manipulation Tricks

```java
public class BitTricks {
    // Count set bits (Brian Kernighan)
    static int countBits(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }

    // Check if power of 2
    static boolean isPowerOf2(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    // Get lowest set bit
    static int lowestSetBit(int n) {
        return n & (-n);
    }

    // Turn off lowest set bit
    static int turnOffLowest(int n) {
        return n & (n - 1);
    }

    // Check if i-th bit is set
    static boolean isBitSet(int n, int i) {
        return (n & (1 << i)) != 0;
    }

    // Set i-th bit
    static int setBit(int n, int i) {
        return n | (1 << i);
    }

    // Clear i-th bit
    static int clearBit(int n, int i) {
        return n & ~(1 << i);
    }

    // Toggle i-th bit
    static int toggleBit(int n, int i) {
        return n ^ (1 << i);
    }

    // Get highest set bit position
    static int highestSetBitPos(int n) {
        return 31 - Integer.numberOfLeadingZeros(n);
    }

    // Next permutation with same number of bits
    static int nextPermutation(int n) {
        int t = n | (n - 1);
        return (t + 1) | (((~t & -~t) - 1) >> (Integer.numberOfTrailingZeros(n) + 1));
    }

    // Iterate through all subsets of a bitmask
    static void iterateSubsets(int mask) {
        for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
            // Process subset
            System.out.println(Integer.toBinaryString(subset));
        }
    }
}
```

---

> 🔬 **Section Challenge — PART 15: Competitive Programming Tricks**

**Challenge 1 (Reasoning):** `modInverse(a, mod)` uses `power(a, mod - 2, mod)` (Fermat's little theorem). This only works when `mod` is prime. What happens if you call `modInverse(6, 12)` and why? What's the alternative for non-prime moduli?

<details><summary>Answer</summary>

Fermat's little theorem states `a^(p-1) ≡ 1 (mod p)` only when p is prime and `gcd(a, p) = 1`. For `modInverse(6, 12)`: `gcd(6, 12) = 6 ≠ 1`, so 6 has **no** multiplicative inverse mod 12. The function silently returns a wrong value. For non-prime moduli, use the **Extended Euclidean Algorithm**: compute `gcd(a, mod)` and if it equals 1, extract the inverse from the Bézout coefficients. If `gcd(a, mod) ≠ 1`, no inverse exists. In competitive programming, the modulus is almost always `10^9 + 7` (prime), so Fermat's is standard — but knowing _why_ it fails for composites separates understanding from memorization.

</details>

## PART 16: Algorithm Complexity Analysis Deep Dive

### Master Theorem Reference

```
MASTER THEOREM:
For T(n) = aT(n/b) + f(n) where a ≥ 1, b > 1

Case 1: f(n) = O(n^(log_b(a) - ε)) for some ε > 0
        → T(n) = Θ(n^(log_b(a)))

Case 2: f(n) = Θ(n^(log_b(a)) * log^k(n))
        → T(n) = Θ(n^(log_b(a)) * log^(k+1)(n))

Case 3: f(n) = Ω(n^(log_b(a) + ε)) for some ε > 0
        AND af(n/b) ≤ cf(n) for some c < 1
        → T(n) = Θ(f(n))

EXAMPLES:
┌───────────────────────────────────┬─────────────────┐
│ Recurrence                        │ Solution        │
├───────────────────────────────────┼─────────────────┤
│ T(n) = 2T(n/2) + n                │ O(n log n)      │
│ T(n) = 2T(n/2) + 1                │ O(n)            │
│ T(n) = 2T(n/2) + n²               │ O(n²)           │
│ T(n) = T(n/2) + 1                 │ O(log n)        │
│ T(n) = T(n/2) + n                 │ O(n)            │
│ T(n) = 4T(n/2) + n                │ O(n²)           │
│ T(n) = 4T(n/2) + n²               │ O(n² log n)     │
│ T(n) = 3T(n/2) + n                │ O(n^1.585)      │
│ T(n) = T(n-1) + n                 │ O(n²)           │
│ T(n) = T(n-1) + 1                 │ O(n)            │
│ T(n) = 2T(n-1) + 1                │ O(2^n)          │
└───────────────────────────────────┴─────────────────┘
```

### Amortized Analysis

```
AGGREGATE METHOD:
Sum all operations, divide by n.

ACCOUNTING METHOD:
Assign amortized cost to each operation.
Some pay more (save credit), some use saved credit.

POTENTIAL METHOD:
Define potential function Φ.
Amortized cost = actual cost + ΔΦ

EXAMPLE: Dynamic Array (ArrayList)
- Push when full: copy all elements + add new = O(n)
- Push when not full: add new = O(1)

Amortized Analysis:
- n pushes: 1 + 2 + 4 + 8 + ... + n copies
- Total copies ≈ 2n
- Amortized per push = O(1)

PROOF (Accounting Method):
- Charge 3 for each push
- 1 to insert current element
- 1 to move current element when array doubles
- 1 to move an element that was there before doubling
```

---

## PART 17: LeetCode Problem Categories Reference

```
BINARY SEARCH VARIATIONS:
┌─────────────────────────────────────────┬───────────────┐
│ Problem Type                            │ LeetCode      │
├─────────────────────────────────────────┼───────────────┤
│ Classic Binary Search                   │ 704           │
│ Search Insert Position                  │ 35            │
│ First/Last Position                     │ 34            │
│ Search in Rotated Array                 │ 33, 81        │
│ Find Minimum in Rotated Array           │ 153, 154      │
│ Search 2D Matrix                        │ 74, 240       │
│ Peak Element                            │ 162           │
│ Koko Eating Bananas (Answer BS)         │ 875           │
│ Capacity to Ship (Answer BS)            │ 1011          │
│ Split Array Largest Sum                 │ 410           │
│ Median of Two Sorted Arrays             │ 4             │
└─────────────────────────────────────────┴───────────────┘

TWO POINTERS:
┌─────────────────────────────────────────┬───────────────┐
│ Two Sum (Sorted)                        │ 167           │
│ 3Sum                                    │ 15            │
│ Container With Most Water               │ 11            │
│ Trapping Rain Water                     │ 42            │
│ Remove Duplicates                       │ 26, 80        │
│ Move Zeroes                             │ 283           │
│ Partition Labels                        │ 763           │
│ Sort Colors                             │ 75            │
│ Reverse Vowels                          │ 345           │
└─────────────────────────────────────────┴───────────────┘

SLIDING WINDOW:
┌─────────────────────────────────────────┬───────────────┐
│ Maximum Sum Subarray Size K             │ 643           │
│ Minimum Window Substring                │ 76            │
│ Longest Substring Without Repeat        │ 3             │
│ Longest Repeating Character Replacement │ 424           │
│ Permutation in String                   │ 567           │
│ Find All Anagrams                       │ 438           │
│ Minimum Size Subarray Sum               │ 209           │
│ Maximum Sliding Window                  │ 239           │
│ Fruit Into Baskets                      │ 904           │
└─────────────────────────────────────────┴───────────────┘

DYNAMIC PROGRAMMING:
┌─────────────────────────────────────────┬────────────────┐
│ Climbing Stairs                         │ 70             │
│ House Robber I, II, III                 │ 198, 213, 337  │
│ Coin Change I, II                       │ 322, 518       │
│ Longest Increasing Subsequence          │ 300            │
│ Longest Common Subsequence              │ 1143           │
│ Edit Distance                           │ 72             │
│ 0/1 Knapsack (Practice)                 │ -              │
│ Partition Equal Subset Sum              │ 416            │
│ Target Sum                              │ 494            │
│ Palindromic Substrings                  │ 647            │
│ Longest Palindromic Subsequence         │ 516            │
│ Word Break I, II                        │ 139, 140       │
│ Decode Ways                             │ 91             │
│ Unique Paths I, II                      │ 62, 63         │
│ Min Path Sum                            │ 64             │
│ Maximal Square                          │ 221            │
│ Best Time Buy Sell Stock I-IV           │ 121,122,123,188│
│ Interleaving String                     │ 97             │
│ Burst Balloons                          │ 312            │
│ Matrix Chain Multiplication             │ -              │
└─────────────────────────────────────────┴────────────────┘

GRAPH ALGORITHMS:
┌─────────────────────────────────────────┬───────────────┐
│ Number of Islands                       │ 200           │
│ Clone Graph                             │ 133           │
│ Course Schedule I, II                   │ 207, 210      │
│ Pacific Atlantic Water Flow             │ 417           │
│ Network Delay Time                      │ 743           │
│ Cheapest Flights K Stops                │ 787           │
│ Redundant Connection I, II              │ 684, 685      │
│ Graph Valid Tree                        │ 261           │
│ Number of Connected Components          │ 323           │
│ Word Ladder I, II                       │ 127, 126      │
│ Alien Dictionary                        │ 269           │
│ Minimum Spanning Tree                   │ 1584          │
│ Critical Connections                    │ 1192          │
└─────────────────────────────────────────┴───────────────┘

TREE PROBLEMS:
┌─────────────────────────────────────────┬───────────────┐
│ Traversals (In/Pre/Post/Level)          │ 94,144,145,102│
│ Maximum Depth                           │ 104           │
│ Same Tree / Subtree                     │ 100, 572      │
│ Invert Binary Tree                      │ 226           │
│ Symmetric Tree                          │ 101           │
│ Path Sum I, II, III                     │ 112, 113, 437 │
│ Lowest Common Ancestor                  │ 236, 235      │
│ Serialize/Deserialize                   │ 297           │
│ Binary Tree Maximum Path Sum            │ 124           │
│ Validate BST                            │ 98            │
│ Kth Smallest in BST                     │ 230           │
│ BST Iterator                            │ 173           │
│ Construct from Traversals               │ 105, 106      │
│ Diameter of Binary Tree                 │ 543           │
│ Count Complete Tree Nodes               │ 222           │
└─────────────────────────────────────────┴───────────────┘

HEAP / PRIORITY QUEUE:
┌─────────────────────────────────────────┬───────────────┐
│ Kth Largest Element                     │ 215           │
│ Top K Frequent Elements                 │ 347           │
│ Merge K Sorted Lists                    │ 23            │
│ Find Median from Data Stream            │ 295           │
│ Task Scheduler                          │ 621           │
│ Reorganize String                       │ 767           │
│ Meeting Rooms II                        │ 253           │
│ K Closest Points                        │ 973           │
│ Sliding Window Maximum                  │ 239           │
└─────────────────────────────────────────┴───────────────┘

BACKTRACKING:
┌─────────────────────────────────────────┬───────────────┐
│ Subsets I, II                           │ 78, 90        │
│ Permutations I, II                      │ 46, 47        │
│ Combinations                            │ 77            │
│ Combination Sum I, II, III              │ 39, 40, 216   │
│ Letter Combinations Phone               │ 17            │
│ Generate Parentheses                    │ 22            │
│ Palindrome Partitioning                 │ 131           │
│ N-Queens                                │ 51            │
│ Sudoku Solver                           │ 37            │
│ Word Search I, II                       │ 79, 212       │
└─────────────────────────────────────────┴───────────────┘
```

---

## PART 18: Essential Templates for Competitive Programming

### Union-Find with Path Compression & Union by Rank

```java
public class UnionFind {
    private int[] parent, rank;
    private int components;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }
    }

    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // Path compression
        }
        return parent[x];
    }

    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;

        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
        components--;
        return true;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getComponents() {
        return components;
    }
}
```

### Segment Tree with Lazy Propagation

```java
public class SegmentTreeLazy {
    private long[] tree, lazy;
    private int n;

    public SegmentTreeLazy(int[] arr) {
        this.n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node, start, mid);
            build(arr, 2 * node + 1, mid + 1, end);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }

    private void pushDown(int node, int start, int end) {
        if (lazy[node] != 0) {
            tree[node] += (end - start + 1) * lazy[node];
            if (start != end) {
                lazy[2 * node] += lazy[node];
                lazy[2 * node + 1] += lazy[node];
            }
            lazy[node] = 0;
        }
    }

    public void updateRange(int l, int r, long val) {
        updateRange(1, 0, n - 1, l, r, val);
    }

    private void updateRange(int node, int start, int end, int l, int r, long val) {
        pushDown(node, start, end);
        if (r < start || l > end) return;
        if (l <= start && end <= r) {
            lazy[node] += val;
            pushDown(node, start, end);
            return;
        }
        int mid = (start + end) / 2;
        updateRange(2 * node, start, mid, l, r, val);
        updateRange(2 * node + 1, mid + 1, end, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public long queryRange(int l, int r) {
        return queryRange(1, 0, n - 1, l, r);
    }

    private long queryRange(int node, int start, int end, int l, int r) {
        if (r < start || l > end) return 0;
        pushDown(node, start, end);
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return queryRange(2 * node, start, mid, l, r) +
               queryRange(2 * node + 1, mid + 1, end, l, r);
    }
}
```

### Binary Indexed Tree (Fenwick Tree)

```java
public class FenwickTree {
    private long[] bit;
    private int n;

    public FenwickTree(int n) {
        this.n = n;
        this.bit = new long[n + 1];
    }

    // Add delta to index i (0-indexed)
    public void update(int i, long delta) {
        for (++i; i <= n; i += i & (-i)) {
            bit[i] += delta;
        }
    }

    // Sum of [0, i] (0-indexed)
    public long query(int i) {
        long sum = 0;
        for (++i; i > 0; i -= i & (-i)) {
            sum += bit[i];
        }
        return sum;
    }

    // Sum of [l, r] (0-indexed)
    public long rangeQuery(int l, int r) {
        return query(r) - (l > 0 ? query(l - 1) : 0);
    }

    // Build from array
    public static FenwickTree build(int[] arr) {
        FenwickTree ft = new FenwickTree(arr.length);
        for (int i = 0; i < arr.length; i++) {
            ft.update(i, arr[i]);
        }
        return ft;
    }
}
```

---

---

> 🔬 **Section Challenge — PART 18: Essential Templates for Competitive Programming**

**Challenge 1 (Reasoning):** The `FastIO` template uses `BufferedReader + StringTokenizer` instead of `Scanner`. In a problem reading 10^6 integers, `Scanner` TLEs but `BufferedReader` doesn't. Where exactly does `Scanner` waste time?

<details><summary>Answer</summary>

`Scanner.nextInt()` internally: (1) compiles a regex pattern for integer matching, (2) reads character-by-character through its internal buffer (1024 bytes default), (3) applies locale-aware parsing, (4) does regex matching on the token. `BufferedReader.readLine()` reads in 8192-byte chunks (8× larger buffer), `StringTokenizer` splits by whitespace with zero regex, and `Integer.parseInt()` is a tight loop of digit multiplication. For 10^6 integers, Scanner does ~10^6 regex compilations + tiny buffer I/O calls. BufferedReader does ~500 read syscalls + zero regex. The difference is ~10×. **Key insight**: Scanner is _convenience_, not _performance_. In contests, always use the BufferedReader template.

</details>

### Topical Breadth — String Matching Selection Trade-offs

The string matching algorithms in this chapter form a clear trade-off space along three axes: worst-case guarantee, preprocessing cost, and space. **KMP** pays O(m) preprocessing to build the longest-prefix-suffix (LPS) array, then searches in O(n+m) worst-case time with O(m) space — the trade-off is worth it when the pattern is reused (streaming, repeated searches) or when the text is adversarial (no pathological worst case). **Rabin-Karp** uses rolling hash for O(m) preprocessing and O(n+m) average search but degrades to O(nm) worst-case when hash collisions occur; this is the only algorithm where an adversarial input can trigger the worst case, so it is unsafe without verification on match. **Z-Algorithm** achieves O(n+m) without the LPS complexity, but requires concatenating pattern + "$" + text (adding O(n+m) space) and is conceptually simpler — it is preferred when you also need period detection or longest-prefix-that-is-also-suffix properties. **Naive search** has O(1) preprocessing and O(1) space but O(nm) worst-case; in practice, on short patterns (m < 10) or random English text, the inner loop exits early so naive often beats KMP because it avoids the O(m) preprocessing overhead entirely.

| Algorithm   | Preprocessing | Search (Worst) | Search (Average)                      | Space  | Best For                                      |
| ----------- | ------------- | -------------- | ------------------------------------- | ------ | --------------------------------------------- |
| Naive       | O(1)          | O(nm)          | O(nm) / often O(n) for short patterns | O(1)   | Short patterns, random text, one-off searches |
| KMP         | O(m)          | O(n+m)         | O(n+m)                                | O(m)   | Repeated pattern, streaming, adversarial text |
| Rabin-Karp  | O(m)          | O(nm)          | O(n+m)                                | O(m)   | Multiple patterns, 2D matching, randomized    |
| Z-Algorithm | O(m)          | O(n+m)         | O(n+m)                                | O(n+m) | When Z-array needed for other purposes        |

Select **KMP** when you need a guaranteed O(n+m) bound and the pattern is known upfront. Select **Rabin-Karp** when searching multiple patterns against the same text (precompute text hash once). Select **Z-Algorithm** when you also need period detection or prefix-suffix properties. Default to **KMP** for single-pattern interviews unless the problem hints at hashing.


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


---

## Reality Check

**"String matching only needs indexOf or contains"** ? Built-in string search methods use naive O(nm) algorithms in many implementations. For searching a pattern in a large text (log file analysis, DNA sequence matching, network packet inspection), KMP or Rabin-Karp run in O(n+m). When searching for MULTIPLE patterns simultaneously, Aho-Corasick processes the text once regardless of pattern count. The algorithm choice matters when text size reaches megabytes.

**"String immutability in Java is just a design choice"** ? String immutability enables: string pool sharing (two variables pointing to the same "hello" literal share one object), safe use as HashMap keys (hash code is cached and never changes), and thread-safe usage without synchronization. But it means EVERY string operation creates a new object. Concatenating strings in a loop creates n intermediate String objects � use StringBuilder for O(n) instead of O(n squared).

**"Regular expressions handle all string pattern matching"** ? Regex engines have worst-case exponential time on pathological patterns (catastrophic backtracking). The pattern (a+)+ matching against "aaaaaaaab" causes 2^n backtracking steps in NFA-based engines (Java, Python, JavaScript). Finite automaton-based engines (RE2, Go regex) guarantee linear time but lack backreferences. For safety-critical text processing, use algorithms with guaranteed time bounds.

**"Trie is the best data structure for string operations"** ? Tries provide O(m) lookup for a string of length m, but each node stores pointers for every alphabet character (26 for lowercase, 128 for ASCII). A trie storing 10000 short words may use more memory than a sorted array with binary search. Patricia tries (radix trees) compress single-child chains, reducing memory. Hash maps with string keys often outperform tries for practical workloads due to better cache behavior.

**"String comparison is O(1)"** ? String comparison is O(m) where m is the shorter string length. Comparing two 1000-character strings requires up to 1000 character comparisons. Sorting n strings of average length m costs O(nm log n), not O(n log n). When strings share long common prefixes (URLs, file paths), comparisons become expensive because they must traverse the entire prefix before finding a difference.
