# Advanced Algorithm Patterns & Competitive Programming

> **Part B of Advanced Algorithms**
> **Navigation**: [Part A: Core Techniques](06_Advanced_Algorithms.md) | [Part B: Advanced Patterns]

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

## PART 14: Graph Algorithm Masterclass

### Tarjan's Algorithm (Strongly Connected Components)

```
CONCEPT:
Find all SCCs in directed graph using single DFS.
Uses discovery time and low-link values.

TIME: O(V + E)
SPACE: O(V)

USE CASES:
- 2-SAT problem
- Dead code elimination in compilers
- Social network analysis
```

```java
public class TarjanSCC {
    private List<List<Integer>> adj;
    private int[] ids, low;
    private boolean[] onStack;
    private Deque<Integer> stack;
    private int id, sccCount;
    private List<List<Integer>> sccs;

    public List<List<Integer>> findSCCs(int n, List<List<Integer>> graph) {
        adj = graph;
        ids = new int[n];
        low = new int[n];
        onStack = new boolean[n];
        stack = new ArrayDeque<>();
        sccs = new ArrayList<>();
        Arrays.fill(ids, -1);

        for (int i = 0; i < n; i++) {
            if (ids[i] == -1) {
                dfs(i);
            }
        }

        return sccs;
    }

    private void dfs(int at) {
        ids[at] = low[at] = id++;
        stack.push(at);
        onStack[at] = true;

        for (int to : adj.get(at)) {
            if (ids[to] == -1) {
                dfs(to);
                low[at] = Math.min(low[at], low[to]);
            } else if (onStack[to]) {
                low[at] = Math.min(low[at], ids[to]);
            }
        }

        // If this is root of SCC
        if (ids[at] == low[at]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int node = stack.pop();
                onStack[node] = false;
                scc.add(node);
                if (node == at) break;
            }
            sccs.add(scc);
            sccCount++;
        }
    }
}
```

### Kosaraju's Algorithm (Alternative SCC Algorithm)

```java
public class KosarajuSCC {
    public List<List<Integer>> findSCCs(int n, List<List<Integer>> graph) {
        // Step 1: Fill stack with finish order
        boolean[] visited = new boolean[n];
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                fillOrder(i, graph, visited, stack);
            }
        }

        // Step 2: Create transpose graph
        List<List<Integer>> transpose = new ArrayList<>();
        for (int i = 0; i < n; i++) transpose.add(new ArrayList<>());
        for (int u = 0; u < n; u++) {
            for (int v : graph.get(u)) {
                transpose.get(v).add(u);
            }
        }

        // Step 3: Process vertices in stack order
        Arrays.fill(visited, false);
        List<List<Integer>> sccs = new ArrayList<>();

        while (!stack.isEmpty()) {
            int v = stack.pop();
            if (!visited[v]) {
                List<Integer> scc = new ArrayList<>();
                dfs(v, transpose, visited, scc);
                sccs.add(scc);
            }
        }

        return sccs;
    }

    private void fillOrder(int v, List<List<Integer>> graph,
                           boolean[] visited, Deque<Integer> stack) {
        visited[v] = true;
        for (int u : graph.get(v)) {
            if (!visited[u]) {
                fillOrder(u, graph, visited, stack);
            }
        }
        stack.push(v);
    }

    private void dfs(int v, List<List<Integer>> graph,
                     boolean[] visited, List<Integer> scc) {
        visited[v] = true;
        scc.add(v);
        for (int u : graph.get(v)) {
            if (!visited[u]) {
                dfs(u, graph, visited, scc);
            }
        }
    }
}
```

### 2-SAT Problem

```
CONCEPT:
Determine if boolean formula in CNF with 2 literals per clause is satisfiable.

KEY INSIGHT:
x OR y equivalent to (¬x → y) AND (¬y → x)
Build implication graph, find SCCs.
If x and ¬x in same SCC → unsatisfiable.
```

```java
public class TwoSAT {
    private int n;  // Number of variables
    private List<List<Integer>> adj, radj;

    public TwoSAT(int n) {
        this.n = n;
        adj = new ArrayList<>();
        radj = new ArrayList<>();
        for (int i = 0; i < 2 * n; i++) {
            adj.add(new ArrayList<>());
            radj.add(new ArrayList<>());
        }
    }

    // Add clause: (a OR b)
    // a, b are literals: positive for x_i, negative for NOT x_i
    public void addClause(int a, int b) {
        // (a OR b) equivalent to (NOT a → b) AND (NOT b → a)
        int notA = negate(a);
        int notB = negate(b);

        adj.get(notA).add(b);
        adj.get(notB).add(a);
        radj.get(b).add(notA);
        radj.get(a).add(notB);
    }

    private int negate(int x) {
        if (x >= 0) return x + n;  // x becomes NOT x
        return -x - 1;              // NOT x becomes x
    }

    private int toIndex(int x) {
        return x >= 0 ? x : n - x - 1;
    }

    public boolean[] solve() {
        // Use Kosaraju to find SCCs
        int[] sccId = new int[2 * n];
        Arrays.fill(sccId, -1);
        Deque<Integer> order = new ArrayDeque<>();
        boolean[] visited = new boolean[2 * n];

        // First DFS
        for (int i = 0; i < 2 * n; i++) {
            if (!visited[i]) {
                dfs1(i, visited, order);
            }
        }

        // Second DFS on reverse graph
        int sccCount = 0;
        while (!order.isEmpty()) {
            int v = order.pop();
            if (sccId[v] == -1) {
                dfs2(v, sccCount++, sccId);
            }
        }

        // Check satisfiability and extract solution
        boolean[] result = new boolean[n];
        for (int i = 0; i < n; i++) {
            if (sccId[i] == sccId[i + n]) {
                return null;  // Unsatisfiable
            }
            result[i] = sccId[i] > sccId[i + n];
        }

        return result;
    }

    private void dfs1(int v, boolean[] visited, Deque<Integer> order) {
        visited[v] = true;
        for (int u : adj.get(v)) {
            if (!visited[u]) {
                dfs1(u, visited, order);
            }
        }
        order.push(v);
    }

    private void dfs2(int v, int scc, int[] sccId) {
        sccId[v] = scc;
        for (int u : radj.get(v)) {
            if (sccId[u] == -1) {
                dfs2(u, scc, sccId);
            }
        }
    }
}
```

---

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
┌─────────────────────────────────────────┬───────────────┐
│ Climbing Stairs                         │ 70            │
│ House Robber I, II, III                 │ 198, 213, 337 │
│ Coin Change I, II                       │ 322, 518      │
│ Longest Increasing Subsequence          │ 300           │
│ Longest Common Subsequence              │ 1143          │
│ Edit Distance                           │ 72            │
│ 0/1 Knapsack (Practice)                 │ -             │
│ Partition Equal Subset Sum              │ 416           │
│ Target Sum                              │ 494           │
│ Palindromic Substrings                  │ 647           │
│ Longest Palindromic Subsequence         │ 516           │
│ Word Break I, II                        │ 139, 140      │
│ Decode Ways                             │ 91            │
│ Unique Paths I, II                      │ 62, 63        │
│ Min Path Sum                            │ 64            │
│ Maximal Square                          │ 221           │
│ Best Time Buy Sell Stock I-IV           │ 121,122,123,188│
│ Interleaving String                     │ 97            │
│ Burst Balloons                          │ 312           │
│ Matrix Chain Multiplication             │ -             │
└─────────────────────────────────────────┴───────────────┘

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

# 🔬 PART FINAL: MODERN ALGORITHMS AND ADVANCED TOPICS

## NP-COMPLETENESS - THE COMPLETE UNDERSTANDING

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    P VS NP - THE MILLENNIUM PRIZE PROBLEM                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COMPLEXITY CLASSES:                                                             │
│  ────────────────────                                                           │
│                                                                                  │
│  P (Polynomial Time):                                                            │
│  • Problems solvable in O(n^k) for some constant k                             │
│  • Examples: Sorting, Shortest Path, MST, Matrix Multiplication                │
│  • These are "tractable" - efficient algorithms exist                          │
│                                                                                  │
│  NP (Nondeterministic Polynomial Time):                                         │
│  • Problems where solutions can be VERIFIED in polynomial time                  │
│  • NOT "Non-Polynomial"!                                                        │
│  • Examples: SAT, Traveling Salesman, Vertex Cover                             │
│                                                                                  │
│  NP-Complete:                                                                    │
│  • Hardest problems in NP                                                       │
│  • If any NP-Complete problem has a polynomial solution → P = NP               │
│  • 21 original NP-Complete problems (Karp's 21)                                │
│                                                                                  │
│  NP-Hard:                                                                        │
│  • At least as hard as NP-Complete                                              │
│  • May not even be in NP (solution might not be verifiable in poly time)       │
│  • Example: Halting Problem (undecidable!)                                     │
│                                                                                  │
│                                                                                  │
│  VISUAL RELATIONSHIP (if P ≠ NP):                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │                        NP-Hard                                           │  │
│  │                  ┌─────────────────────────────────┐                    │  │
│  │                  │                                 │                    │  │
│  │                  │     NP-Complete                 │                    │  │
│  │    ┌─────────────┼─────────────────────────────────┤                    │  │
│  │    │             │                                 │                    │  │
│  │    │      NP     │    • SAT                        │                    │  │
│  │    │             │    • 3-SAT                      │                    │  │
│  │    │  ┌──────┐   │    • Vertex Cover               │                    │  │
│  │    │  │  P   │   │    • Hamiltonian Path           │                    │  │
│  │    │  │      │   │    • Traveling Salesman         │                    │  │
│  │    │  └──────┘   │    • Graph Coloring             │                    │  │
│  │    │             │    • Subset Sum                 │                    │  │
│  │    └─────────────┴─────────────────────────────────┘                    │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│                                                                                  │
│  PROVING NP-COMPLETENESS:                                                        │
│  ─────────────────────────                                                      │
│  To show problem X is NP-Complete:                                              │
│  1. Show X is in NP (solution verifiable in poly time)                         │
│  2. Show X is NP-Hard (reduce known NP-Complete problem to X in poly time)    │
│                                                                                  │
│  Reduction: If A reduces to B in polynomial time, written A ≤_p B:             │
│  • We can transform any instance of A to an instance of B                      │
│  • Transformation takes polynomial time                                        │
│  • Solution to transformed B gives solution to original A                      │
│                                                                                  │
│  If B has polynomial solution and A ≤_p B → A has polynomial solution         │
│  Contrapositive: If A has no poly solution and A ≤_p B → B has no poly sol   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## APPROXIMATION ALGORITHMS

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    APPROXIMATION ALGORITHMS FOR NP-HARD PROBLEMS                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Since NP-Hard problems likely have no efficient exact solution,                │
│  we settle for APPROXIMATE solutions with GUARANTEED bounds.                    │
│                                                                                  │
│  APPROXIMATION RATIO:                                                            │
│  ─────────────────────                                                          │
│  For minimization: ALG/OPT ≤ α                                                 │
│  For maximization: OPT/ALG ≤ α                                                 │
│                                                                                  │
│  α = 1: Optimal solution                                                        │
│  α = 2: At most 2x worse than optimal                                          │
│                                                                                  │
│                                                                                  │
│  EXAMPLE 1: VERTEX COVER (2-Approximation)                                      │
│  ──────────────────────────────────────────                                     │
│  Problem: Find minimum set of vertices that covers all edges                    │
│                                                                                  │
│  Greedy Algorithm:                                                               │
│  1. While uncovered edges exist:                                                │
│     a. Pick any uncovered edge (u, v)                                          │
│     b. Add BOTH u and v to cover                                               │
│     c. Remove all edges incident to u or v                                     │
│                                                                                  │
│  Why 2-approximation?                                                           │
│  • Each iteration picks an edge (u,v) and adds 2 vertices                      │
│  • Optimal solution MUST include at least one of u, v                          │
│  • So OPT ≥ (edges picked)                                                     │
│  • Our ALG = 2 × (edges picked)                                                │
│  • Therefore ALG/OPT ≤ 2                                                       │
│                                                                                  │
```java
public Set<Integer> vertexCover2Approx(int n, int[][] edges) {
    Set<Integer> cover = new HashSet<>();
    Set<String> remaining = new HashSet<>();

    for (int[] e : edges) {
        remaining.add(e[0] + "," + e[1]);
    }

    for (int[] e : edges) {
        String key = e[0] + "," + e[1];
        if (remaining.contains(key)) {
            cover.add(e[0]);
            cover.add(e[1]);

            // Remove all edges incident to e[0] or e[1]
            remaining.removeIf(s -> {
                String[] parts = s.split(",");
                int u = Integer.parseInt(parts[0]);
                int v = Integer.parseInt(parts[1]);
                return u == e[0] || u == e[1] || v == e[0] || v == e[1];
            });
        }
    }
    return cover;
}
````

│ │
│ │
│ EXAMPLE 2: SET COVER (log n - Approximation) │
│ ──────────────────────────────────────────── │
│ Problem: Given universe U and sets S₁...Sₘ, find minimum number of sets │
│ that cover all elements │
│ │
│ Greedy Algorithm: │
│ 1. While uncovered elements exist: │
│ a. Pick set Sᵢ that covers most uncovered elements │
│ b. Add Sᵢ to solution │
│ c. Mark covered elements │
│ │
│ Approximation ratio: O(log n) where n = |U| │
│ (This is optimal unless P = NP!) │
│ │
│ │
│ EXAMPLE 3: TSP with Triangle Inequality (1.5-Approximation) │
│ ───────────────────────────────────────────────────────────── │
│ Christofides Algorithm: │
│ 1. Find MST of graph │
│ 2. Find minimum weight perfect matching on odd-degree vertices │
│ 3. Combine MST + Matching (Eulerian graph) │
│ 4. Find Euler tour │
│ 5. Shortcut to Hamiltonian cycle │
│ │
│ Approximation ratio: 3/2 = 1.5 │
│ (Best known for metric TSP!) │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## RANDOMIZED ALGORITHMS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ RANDOMIZED ALGORITHMS - DEEP DIVE │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ TWO TYPES: │
│ ─────────── │
│ 1. Las Vegas: Always correct, expected polynomial time │
│ Example: Randomized QuickSort │
│ │
│ 2. Monte Carlo: May be wrong, but guaranteed polynomial time │
│ Example: Primality testing, Min-Cut │
│ │
│ │
│ RANDOMIZED QUICKSORT: │
│ ───────────────────── │

```java
void randomizedQuickSort(int[] arr, int low, int high) {
    if (low < high) {
        // Random pivot selection
        int randomIndex = low + random.nextInt(high - low + 1);
        swap(arr, randomIndex, high);  // Move pivot to end

        int pivotIndex = partition(arr, low, high);
        randomizedQuickSort(arr, low, pivotIndex - 1);
        randomizedQuickSort(arr, pivotIndex + 1, high);
    }
}

// Expected time: O(n log n)
// Worst case: O(n²) but probability is 1/n! → negligible
```

│ │
│ │
│ KARGER'S MIN-CUT ALGORITHM: │
│ ──────────────────────────── │
│ Find minimum cut in undirected graph │
│ │
│ Algorithm: │
│ 1. While more than 2 vertices: │
│ a. Pick random edge (u, v) │
│ b. Contract u and v into single vertex │
│ c. Remove self-loops │
│ 2. Return number of edges between final 2 vertices │
│ │
│ Probability of finding min-cut: ≥ 1/n² │
│ Run n² log n times → P(failure) < 1/n │
│ Total time: O(n⁴ log n) basic, O(n² log³ n) improved │
│ │
│ │
│ MILLER-RABIN PRIMALITY TEST: │
│ ───────────────────────────── │

```java
// Monte Carlo: May report composite as prime, never reports prime as composite
public boolean isProbablePrime(long n, int iterations) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // Write n-1 as 2^r * d
    long d = n - 1;
    int r = 0;
    while (d % 2 == 0) {
        d /= 2;
        r++;
    }

    // Witness loop
    for (int i = 0; i < iterations; i++) {
        long a = 2 + random.nextLong() % (n - 3);
        if (!millerRabinTest(n, d, r, a)) {
            return false;  // Definitely composite
        }
    }
    return true;  // Probably prime
}

private boolean millerRabinTest(long n, long d, int r, long a) {
    long x = modPow(a, d, n);
    if (x == 1 || x == n - 1) return true;

    for (int i = 0; i < r - 1; i++) {
        x = modPow(x, 2, n);
        if (x == n - 1) return true;
    }
    return false;
}

// Probability of error after k iterations: ≤ (1/4)^k
// For k = 40: error probability < 10^-24
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## ADVANCED STRING ALGORITHMS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ STRING MATCHING ALGORITHMS - COMPLETE COMPARISON │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ALGORITHM COMPARISON: │
│ ┌─────────────────────┬────────────────┬────────────────┬──────────────────┐ │
│ │ Algorithm │ Preprocessing │ Search Time │ Space │ │
│ ├─────────────────────┼────────────────┼────────────────┼──────────────────┤ │
│ │ Naive │ O(1) │ O(nm) │ O(1) │ │
│ │ KMP │ O(m) │ O(n) │ O(m) │ │
│ │ Boyer-Moore │ O(m + σ) │ O(nm) worst │ O(m + σ) │ │
│ │ │ │ O(n/m) best │ │ │
│ │ Rabin-Karp │ O(m) │ O(nm) worst │ O(1) │ │
│ │ │ │ O(n+m) expected│ │ │
│ │ Z-Algorithm │ O(m) │ O(n) │ O(n+m) │ │
│ │ Suffix Array │ O(n log n) │ O(m log n) │ O(n) │ │
│ │ Suffix Tree │ O(n) │ O(m) │ O(n) │ │
│ │ Aho-Corasick │ O(Σ|patterns|) │ O(n+matches) │ O(Σ|patterns|·σ) │ │
│ └─────────────────────┴────────────────┴────────────────┴──────────────────┘ │
│ │
│ n = text length, m = pattern length, σ = alphabet size │
│ │

```java
// Z-ALGORITHM: Find all occurrences of pattern in text
// Z[i] = length of longest substring starting at i that matches prefix
public int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}

// Usage: Find pattern P in text T
// Create S = P + "$" + T
// All positions where z[i] == len(P) are matches

// AHO-CORASICK: Multiple pattern matching
class AhoCorasick {
    int[][] trie;
    int[] fail, output;
    int size = 0;

    public AhoCorasick(int maxStates, int alphabetSize) {
        trie = new int[maxStates][alphabetSize];
        fail = new int[maxStates];
        output = new int[maxStates];
        Arrays.fill(trie[0], -1);
    }

    public void addPattern(String pattern, int index) {
        int state = 0;
        for (char c : pattern.toCharArray()) {
            int ch = c - 'a';
            if (trie[state][ch] == -1) {
                trie[state][ch] = ++size;
                Arrays.fill(trie[size], -1);
            }
            state = trie[state][ch];
        }
        output[state] |= (1 << index);
    }

    public void build() {
        Queue<Integer> queue = new LinkedList<>();

        // Initialize fail function for depth 1
        for (int c = 0; c < 26; c++) {
            if (trie[0][c] != -1) {
                fail[trie[0][c]] = 0;
                queue.offer(trie[0][c]);
            } else {
                trie[0][c] = 0;
            }
        }

        // BFS to compute fail function
        while (!queue.isEmpty()) {
            int state = queue.poll();
            for (int c = 0; c < 26; c++) {
                if (trie[state][c] != -1) {
                    int next = trie[state][c];
                    int f = fail[state];
                    while (trie[f][c] == -1) f = fail[f];
                    fail[next] = trie[f][c];
                    output[next] |= output[fail[next]];
                    queue.offer(next);
                }
            }
        }
    }

    public List<int[]> search(String text) {
        List<int[]> matches = new ArrayList<>();
        int state = 0;

        for (int i = 0; i < text.length(); i++) {
            int c = text.charAt(i) - 'a';
            while (trie[state][c] == -1) state = fail[state];
            state = trie[state][c];

            if (output[state] != 0) {
                for (int j = 0; j < 32; j++) {
                    if ((output[state] & (1 << j)) != 0) {
                        matches.add(new int[]{i, j});  // position, pattern index
                    }
                }
            }
        }
        return matches;
    }
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## NETWORK FLOW ALGORITHMS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ MAXIMUM FLOW - COMPLETE GUIDE │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PROBLEM: Find maximum flow from source s to sink t in a directed graph │
│ with edge capacities │
│ │
│ ALGORITHM COMPARISON: │
│ ┌─────────────────────┬────────────────────────┬────────────────────────────┐ │
│ │ Algorithm │ Time Complexity │ Notes │ │
│ ├─────────────────────┼────────────────────────┼────────────────────────────┤ │
│ │ Ford-Fulkerson │ O(E × maxFlow) │ Uses DFS, may not terminate│ │
│ │ Edmonds-Karp │ O(V × E²) │ Uses BFS for augmenting │ │
│ │ Dinic │ O(V² × E) │ Level graph + blocking flow│ │
│ │ Push-Relabel │ O(V² × E) │ Different approach │ │
│ │ Dinic (unit cap) │ O(E × √V) │ For unit capacity graphs │ │
│ └─────────────────────┴────────────────────────┴────────────────────────────┘ │
│ │

```java
// DINIC'S ALGORITHM - O(V²E)
class Dinic {
    int[] level, iter;
    List<int[]>[] graph;  // int[] = {to, capacity, rev_index}
    int n;

    public Dinic(int n) {
        this.n = n;
        graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        level = new int[n];
        iter = new int[n];
    }

    public void addEdge(int from, int to, int cap) {
        graph[from].add(new int[]{to, cap, graph[to].size()});
        graph[to].add(new int[]{from, 0, graph[from].size() - 1});  // Reverse edge
    }

    private boolean bfs(int s, int t) {
        Arrays.fill(level, -1);
        Queue<Integer> q = new LinkedList<>();
        level[s] = 0;
        q.offer(s);

        while (!q.isEmpty()) {
            int v = q.poll();
            for (int[] e : graph[v]) {
                if (e[1] > 0 && level[e[0]] < 0) {
                    level[e[0]] = level[v] + 1;
                    q.offer(e[0]);
                }
            }
        }
        return level[t] >= 0;
    }

    private int dfs(int v, int t, int f) {
        if (v == t) return f;

        for (; iter[v] < graph[v].size(); iter[v]++) {
            int[] e = graph[v].get(iter[v]);
            if (e[1] > 0 && level[v] < level[e[0]]) {
                int d = dfs(e[0], t, Math.min(f, e[1]));
                if (d > 0) {
                    e[1] -= d;
                    graph[e[0]].get(e[2])[1] += d;
                    return d;
                }
            }
        }
        return 0;
    }

    public int maxFlow(int s, int t) {
        int flow = 0;
        while (bfs(s, t)) {
            Arrays.fill(iter, 0);
            int f;
            while ((f = dfs(s, t, Integer.MAX_VALUE)) > 0) {
                flow += f;
            }
        }
        return flow;
    }
}

// APPLICATIONS OF MAX FLOW:
// 1. Bipartite Matching: Add source to left, sink to right, unit capacities
// 2. Min Cut: Run max flow, find reachable vertices from source in residual
// 3. Maximum Edge-Disjoint Paths: Unit capacities, max flow = # paths
// 4. Circulation with Demands: Add super-source and super-sink
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## COMPUTATIONAL GEOMETRY BASICS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ COMPUTATIONAL GEOMETRY - ESSENTIAL ALGORITHMS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │

```java
// CONVEX HULL - Graham Scan O(n log n)
public List<int[]> convexHull(int[][] points) {
    int n = points.length;
    if (n < 3) return Arrays.asList(points);

    // Find bottom-most point (or left-most if tie)
    int minIdx = 0;
    for (int i = 1; i < n; i++) {
        if (points[i][1] < points[minIdx][1] ||
            (points[i][1] == points[minIdx][1] && points[i][0] < points[minIdx][0])) {
            minIdx = i;
        }
    }
    swap(points, 0, minIdx);
    int[] pivot = points[0];

    // Sort by polar angle with pivot
    Arrays.sort(points, 1, n, (a, b) -> {
        int cross = crossProduct(pivot, a, b);
        if (cross == 0) {  // Collinear
            return distance(pivot, a) - distance(pivot, b);
        }
        return -cross;  // Counter-clockwise order
    });

    // Build hull
    List<int[]> hull = new ArrayList<>();
    for (int[] p : points) {
        while (hull.size() > 1 &&
               crossProduct(hull.get(hull.size()-2), hull.get(hull.size()-1), p) <= 0) {
            hull.remove(hull.size() - 1);
        }
        hull.add(p);
    }
    return hull;
}

// Cross product: (b-a) × (c-a)
// > 0: counter-clockwise, < 0: clockwise, = 0: collinear
int crossProduct(int[] a, int[] b, int[] c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

// LINE SEGMENT INTERSECTION
boolean intersects(int[] p1, int[] p2, int[] p3, int[] p4) {
    int d1 = direction(p3, p4, p1);
    int d2 = direction(p3, p4, p2);
    int d3 = direction(p1, p2, p3);
    int d4 = direction(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    // Collinear cases
    if (d1 == 0 && onSegment(p3, p4, p1)) return true;
    if (d2 == 0 && onSegment(p3, p4, p2)) return true;
    if (d3 == 0 && onSegment(p1, p2, p3)) return true;
    if (d4 == 0 && onSegment(p1, p2, p4)) return true;

    return false;
}

int direction(int[] a, int[] b, int[] c) {
    return (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]);
}

boolean onSegment(int[] a, int[] b, int[] c) {
    return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) &&
           Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
}

// CLOSEST PAIR OF POINTS - O(n log n)
// Divide and conquer: split, solve recursively, merge considering strip
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## ALGORITHM DESIGN PARADIGMS - SUMMARY

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH PARADIGM │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ DIVIDE AND CONQUER: │
│ • Problem can be split into independent subproblems │
│ • Subproblems are similar to original │
│ • Examples: Merge Sort, Quick Sort, Binary Search, Strassen's Matrix │
│ │
│ DYNAMIC PROGRAMMING: │
│ • Optimal substructure: optimal solution uses optimal subsolutions │
│ • Overlapping subproblems: same subproblems solved multiple times │
│ • Examples: Fibonacci, Knapsack, LCS, Edit Distance, Matrix Chain │
│ │
│ GREEDY: │
│ • Local optimal choice leads to global optimal │
│ • No need to reconsider past choices │
│ • Examples: Huffman, Activity Selection, Dijkstra, MST (Prim, Kruskal) │
│ │
│ BACKTRACKING: │
│ • Find all (or some) solutions │
│ • Build solution incrementally, abandon if invalid │
│ • Examples: N-Queens, Sudoku, Subset Sum, Permutations │
│ │
│ BRANCH AND BOUND: │
│ • Optimization problems │
│ • Use bounds to prune search space │
│ • Examples: TSP, Integer Linear Programming, 0/1 Knapsack │
│ │
│ │
│ COMPLEXITY CHEAT SHEET: │
│ ┌──────────────────────┬────────────────────────────────────────────────────┐ │
│ │ If you see... │ Think about... │ │
│ ├──────────────────────┼────────────────────────────────────────────────────┤ │
│ │ Sorted array │ Binary search O(log n) │ │
│ │ Find all subsets │ 2^n solutions (exponential) │ │
│ │ Find all permutations│ n! solutions (factorial) │ │
│ │ Shortest path │ BFS (unweighted), Dijkstra (weighted) │ │
│ │ Connected components │ DFS/BFS/Union-Find │ │
│ │ Optimal order │ DP on intervals │ │
│ │ Maximum/Minimum │ DP, Greedy, or Binary search on answer │ │
│ │ Graph with cycles │ May need to detect or handle cycles │ │
│ │ String matching │ KMP, Z-algorithm, Rolling hash │ │
│ │ Range queries │ Segment Tree, Fenwick Tree │ │
│ │ Multiple patterns │ Trie, Aho-Corasick │ │
│ └──────────────────────┴────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

---

_Master these algorithms to understand the foundations of computer science!_ 🎯
```

---

> **Prev**: [Part A: Core Algorithm Techniques](06_Advanced_Algorithms.md)

---

# CURATED PRACTICE PROBLEMS — ADVANCED ALGORITHMS

> **HOW TO USE**: These are harder problems covering greedy, bit manipulation, string algorithms, and competitive patterns.
> Attempt only after mastering the fundamentals in earlier chapters.

---

## Section 1: Greedy Algorithms

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Jump Game (LC 55) | LeetCode | Medium | Track farthest reachable |
| 2 | Jump Game II (LC 45) | LeetCode | Medium | Greedy BFS-style levels |
| 3 | Gas Station (LC 134) | LeetCode | Medium | If total >= 0, solution exists |
| 4 | Task Scheduler (LC 621) | LeetCode | Medium | Most frequent first + idle slots |
| 5 | Non-overlapping Intervals (LC 435) | LeetCode | Medium | Sort by end, count kept |
| 6 | Merge Intervals (LC 56) | LeetCode | Medium | Sort by start, merge overlapping |
| 7 | Meeting Rooms II (LC 253) | LeetCode | Medium | Min heap for end times |
| 8 | Partition Labels (LC 763) | LeetCode | Medium | Last occurrence of each char |
| 9 | Minimum Number of Arrows (LC 452) | LeetCode | Medium | Interval scheduling |
| 10 | Candy (LC 135) | LeetCode | Hard | Two-pass left-to-right, right-to-left |

---

## Section 2: Bit Manipulation

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Single Number (LC 136) | LeetCode | Easy | XOR all elements |
| 2 | Number of 1 Bits (LC 191) | LeetCode | Easy | n & (n-1) clears last set bit |
| 3 | Counting Bits (LC 338) | LeetCode | Easy | dp[i] = dp[i>>1] + (i&1) |
| 4 | Missing Number (LC 268) | LeetCode | Easy | XOR with indices |
| 5 | Reverse Bits (LC 190) | LeetCode | Easy | Shift and build result |
| 6 | Single Number II (LC 137) | LeetCode | Medium | Count bits mod 3 |
| 7 | Single Number III (LC 260) | LeetCode | Medium | XOR + rightmost set bit split |
| 8 | Subsets (LC 78) | LeetCode | Medium | Bitmask 0 to 2^n-1 |
| 9 | Maximum XOR of Two Numbers (LC 421) | LeetCode | Medium | Trie on binary representation |
| 10 | Minimum Flips to Make a OR b Equal to c (LC 1318) | LeetCode | Medium | Bit-by-bit analysis |

---

## Section 3: String Algorithms

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Longest Common Prefix (LC 14) | LeetCode | Easy | Vertical scan or binary search |
| 2 | Implement strStr() / KMP (LC 28) | LeetCode | Easy | KMP failure function |
| 3 | Longest Palindromic Substring (LC 5) | LeetCode | Medium | Expand around center or Manacher |
| 4 | Longest Palindromic Subsequence (LC 516) | LeetCode | Medium | 2D DP |
| 5 | Edit Distance (LC 72) | LeetCode | Medium | Classic 2D DP |
| 6 | Wildcard Matching (LC 44) | LeetCode | Hard | DP or greedy with backtrack |
| 7 | Regular Expression Matching (LC 10) | LeetCode | Hard | DP with * handling |
| 8 | Shortest Palindrome (LC 214) | LeetCode | Hard | KMP on s + "#" + reverse(s) |
| 9 | Repeated Substring Pattern (LC 459) | LeetCode | Easy | KMP failure function insight |
| 10 | Minimum Window Substring (LC 76) | LeetCode | Hard | Sliding window + freq map |

---

## HIDDEN GEMS — Advanced

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Maximum Product of Word Lengths (LC 318) | LeetCode | Bitmask for character sets |
| 2 | Wiggle Sort II (LC 324) | LeetCode | Median + 3-way partition |
| 3 | Queue Reconstruction by Height (LC 406) | LeetCode | Sort desc height, insert by k |
| 4 | UTF-8 Validation (LC 393) | LeetCode | Bit manipulation for encoding |
| 5 | Gray Code (LC 89) | LeetCode | i XOR (i >> 1) — elegant bit pattern |
| 6 | Circular Array Loop (LC 457) | LeetCode | Slow/fast pointer on circular |

---
