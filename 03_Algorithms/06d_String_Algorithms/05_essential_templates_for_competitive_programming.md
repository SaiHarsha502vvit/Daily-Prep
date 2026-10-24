# PART 18: Essential Templates for Competitive Programming

> **Navigation**: [← LeetCode Problem Categories Reference](04_leetcode_problem_categories_reference.md) | [Chapter overview](../06d_String_Algorithms.md)
> Page 5 of 5 in **Advanced Algorithm Patterns & Competitive Programming**


## Union-Find with Path Compression & Union by Rank

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

## Segment Tree with Lazy Propagation

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

## Binary Indexed Tree (Fenwick Tree)

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

## Topical Breadth — String Matching Selection Trade-offs

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

[← LeetCode Problem Categories Reference](04_leetcode_problem_categories_reference.md) | [Chapter overview](../06d_String_Algorithms.md)
