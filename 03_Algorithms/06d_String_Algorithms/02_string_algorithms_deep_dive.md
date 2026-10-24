# PART 13: String Algorithms Deep Dive

> **Navigation**: [← Advanced Algorithm Patterns for Interviews](01_advanced_algorithm_patterns_for_interviews.md) | [Chapter overview](../06d_String_Algorithms.md) | [Competitive Programming Tricks →](03_competitive_programming_tricks.md)
> Page 2 of 5 in **Advanced Algorithm Patterns & Competitive Programming**


## Manacher's Algorithm (Longest Palindromic Substring)

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

## Z-Algorithm (Pattern Matching)

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

## Suffix Array (Memory-Efficient Alternative to Suffix Tree)

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
> [05d_Graphs_Advanced_Algos.md](../05d_Graphs_Advanced_Algos.md)

---

> 🔬 **Section Challenge — PART 13: String Algorithms Deep Dive**

**Challenge 1 (Reasoning):** In Manacher's algorithm, when `i < R`, we set `P[i] = Math.min(R - i, P[mirror])`. Why do we take the _minimum_ of these two values instead of just `P[mirror]`?

<details><summary>Answer</summary>

The mirror palindrome `P[mirror]` might extend _beyond_ the left boundary of the current known palindrome centered at `C`. If `mirror - P[mirror] < L` (where L = 2\*C - R), the mirror's palindrome reaches past what our current center `C` can guarantee. Beyond the boundary `R`, we have no information — the characters are unverified. So `R - i` caps how much we can "trust" from the mirror. After this initialization, we still try to expand outward, character by character. This is why Manacher's is O(N): the cap ensures each character is compared at most once across all expansions.

</details>

---

[← Advanced Algorithm Patterns for Interviews](01_advanced_algorithm_patterns_for_interviews.md) | [Chapter overview](../06d_String_Algorithms.md) | [Competitive Programming Tricks →](03_competitive_programming_tricks.md)
