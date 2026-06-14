**Navigation**: [< Previous](12_Greedy_Algorithms_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Union_Find_DSU_Complete.md)
🧠 **Mental Model**: See [Array & String Thinking](../14_Mental_Models/04_Array_String_Thinking.md) — pointer patterns and string manipulation mental models

# 🔤 String Algorithms Complete Guide

KMP, Rabin-Karp, Z-Algorithm & Pattern Matching Mastery

## Table of Contents

1. [Why String Algorithms?](#why-string-algorithms)
2. [Naive Pattern Matching](#naive-matching)
3. [KMP Algorithm](#kmp-algorithm)
4. [Z-Algorithm](#z-algorithm)
5. [Rabin-Karp (Rolling Hash)](#rabin-karp)
6. [Manacher's Algorithm](#manachers)
7. [Trie Data Structure](#trie)
8. [Suffix Arrays](#suffix-arrays)
9. [Interview Problems](#interview-problems)
10. [Quick Reference](#quick-reference)

---

### Historical Evolution

Efficient string pattern matching emerged as critical with the rise of large text corpora in the 1970s. Before efficient algorithms, **naive pattern matching** ($O(nm)$) was the only option — comparing every position of a text of length $n$ with a pattern of length $m$. **Knuth, Morris, and Pratt (1977)** published KMP in the SIAM Journal of Computing, introducing preprocessing of the pattern into a failure function (independently discovered by **J. H. Morris** for text editor applications) — KMP reduces worst-case to $O(n+m)$ by ensuring no text character is examined more than once. **Rabin and Karp (1987)** proposed rolling hash for pattern matching, enabling $O(n+m)$ average case with randomization that extends naturally to multi-pattern and 2D matching. **Z-Algorithm** was developed by **Gusfield (1997)** building on **Crochemore and Perrin (1991)** — the Z-array captures the longest prefix match at each position in $O(n+m)$ without a DFA. **Manacher's algorithm (1975)** discovered the elegant center-radius trick for longest palindromic substring in a single pass. Modern practice (post-2010): suffix arrays (Manber-Myers 1990) power full-text indices in bioinformatics tools (BWA, Bowtie), Aho-Corasick (1975) is used in network intrusion detection (Snort), and the FM-index (Ferragina-Manzini 2000) underlies modern genomic search engines.

---

### Why String Algorithms?

---

## Why String Algorithms? <a name="why-string-algorithms"></a>

### Real-World Applications

```
┌─────────────────────────────────────────────────────────────────┐
│           WHERE STRING ALGORITHMS ARE USED                      │
├─────────────────────────────────────────────────────────────────┤
│  • Text Editors (Find & Replace)                                │
│  • Search Engines (Pattern matching)                            │
│  • DNA Sequencing (Substring search)                            │
│  • Plagiarism Detection (Similarity)                            │
│  • Antivirus (Signature matching)                               │
│  • Network Intrusion Detection                                  │
│  • Spell Checkers                                               │
│  • Data Compression                                             │
└─────────────────────────────────────────────────────────────────┘
```

### The Pattern Matching Problem

```
TEXT:    "ABABDABACDABABCABAB"
PATTERN: "ABABCABAB"

Find all occurrences of PATTERN in TEXT.

Naive: O(n * m) - Too slow for large texts
KMP:   O(n + m) - Linear time!
```

---

## Naive Pattern Matching <a name="naive-matching"></a>

### The Simple Approach

```java
/*
Slide pattern over text, compare character by character.
Time: O((n-m+1) * m) ≈ O(n*m) worst case
*/

public List<Integer> naiveSearch(String text, String pattern) {
    List<Integer> positions = new ArrayList<>();
    int n = text.length(), m = pattern.length();

    for (int i = 0; i <= n - m; i++) {
        int j;
        for (j = 0; j < m; j++) {
            if (text.charAt(i + j) != pattern.charAt(j)) {
                break;
            }
        }
        if (j == m) {  // Full match
            positions.add(i);
        }
    }
    return positions;
}
```

### Visual: Why It's Slow

```
TEXT:    A A A A A A A A A B
PATTERN: A A A A B

Attempt 1: A A A A A  vs  A A A A B  → Mismatch at position 4
Attempt 2:   A A A A A  vs  A A A A B  → Mismatch at position 4
Attempt 3:     A A A A A  vs  A A A A B  → Mismatch at position 4
...

We keep rechecking characters we've already seen!
KMP/Z-algo avoid this redundant work.
```

---

## KMP Algorithm <a name="kmp-algorithm"></a>

### The Key Insight

```
When mismatch occurs, we DON'T start from scratch.
We use information about the pattern itself to skip ahead.

The LPS (Longest Proper Prefix which is also Suffix) array
tells us how far we can skip.

Pattern: A B A B C A B A B
LPS:     0 0 1 2 0 1 2 3 4

LPS[i] = Length of longest proper prefix of pattern[0..i]
         that is also a suffix of pattern[0..i]
```

### Visual: LPS Array Construction

```
Pattern: A B A B C A B A B
Index:   0 1 2 3 4 5 6 7 8

i=0: "A"        → No proper prefix/suffix → LPS[0] = 0
i=1: "AB"       → Prefixes: {A}, Suffixes: {B} → None match → LPS[1] = 0
i=2: "ABA"      → Prefixes: {A, AB}, Suffixes: {A, BA} → "A" matches → LPS[2] = 1
i=3: "ABAB"     → Prefixes: {A, AB, ABA}, Suffixes: {B, AB, BAB} → "AB" matches → LPS[3] = 2
i=4: "ABABC"    → No match → LPS[4] = 0
i=5: "ABABCA"   → "A" matches → LPS[5] = 1
i=6: "ABABCAB"  → "AB" matches → LPS[6] = 2
i=7: "ABABCABA" → "ABA" matches → LPS[7] = 3
i=8: "ABABCABAB"→ "ABAB" matches → LPS[8] = 4

LPS = [0, 0, 1, 2, 0, 1, 2, 3, 4]
```

### Complete KMP Implementation

```java
public class KMP {

    // Main KMP search
    public List<Integer> search(String text, String pattern) {
        List<Integer> result = new ArrayList<>();
        if (pattern.isEmpty()) return result;

        int[] lps = buildLPS(pattern);
        int n = text.length(), m = pattern.length();
        int i = 0, j = 0;  // i for text, j for pattern

        while (i < n) {
            if (text.charAt(i) == pattern.charAt(j)) {
                i++;
                j++;
            }

            if (j == m) {  // Found complete match
                result.add(i - j);
                j = lps[j - 1];  // Continue searching
            } else if (i < n && text.charAt(i) != pattern.charAt(j)) {
                // Mismatch after some matches
                if (j != 0) {
                    j = lps[j - 1];  // Use LPS to skip
                } else {
                    i++;
                }
            }
        }
        return result;
    }

    // Build LPS (Longest Prefix Suffix) array
    private int[] buildLPS(String pattern) {
        int m = pattern.length();
        int[] lps = new int[m];
        int len = 0;  // Length of previous longest prefix suffix
        int i = 1;

        lps[0] = 0;  // LPS[0] is always 0

        while (i < m) {
            if (pattern.charAt(i) == pattern.charAt(len)) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len != 0) {
                    len = lps[len - 1];  // Don't increment i
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }
}
```

### Visual: KMP Search in Action

```
TEXT:    A B A B D A B A B C A B A B
PATTERN: A B A B C A B A B
LPS:     0 0 1 2 0 1 2 3 4

Step 1: Compare from start
        A B A B D A B A B C A B A B
        A B A B C
                ↑ Mismatch at index 4!

        j = 4, lps[3] = 2
        Skip: Instead of starting over, jump to j = 2

Step 2: Continue with j = 2 (pattern already matched "AB")
        A B A B D A B A B C A B A B
            A B A B C
            ↑ Now comparing text[4] with pattern[2]

        Still mismatch! j = 2, lps[1] = 0

Step 3: j = 0
        A B A B D A B A B C A B A B
                A B A B C A B A B
                ↑ Start fresh from here

Step 4: Full match found at index 5!
        A B A B D [A B A B C A B A B]
```

### Time Complexity Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│              KMP COMPLEXITY                                     │
├─────────────────────────────────────────────────────────────────┤
│  LPS Construction: O(m) where m = pattern length                │
│  Search: O(n) where n = text length                             │
│  Total: O(n + m)                                                │
│                                                                 │
│  Space: O(m) for LPS array                                      │
│                                                                 │
│  Why O(n)?                                                      │
│  - i never decreases (always moves forward in text)             │
│  - j can decrease but total decreases ≤ total increases         │
│  - Each char in text visited at most twice                      │
└─────────────────────────────────────────────────────────────────┘
```

### KMP Applications

```java
// Application 1: Check if pattern exists
public boolean contains(String text, String pattern) {
    return !search(text, pattern).isEmpty();
}

// Application 2: Count occurrences
public int countOccurrences(String text, String pattern) {
    return search(text, pattern).size();
}

// Application 3: Find shortest period of string
// Period: smallest repeating unit
// "ababab" has period "ab" (length 2)
public int shortestPeriod(String s) {
    int[] lps = buildLPS(s);
    int n = s.length();
    int period = n - lps[n - 1];

    // Check if it divides evenly
    if (n % period == 0) {
        return period;
    }
    return n;  // String itself is the period
}

// Application 4: Check if string is rotation
// "abcde" rotated = "cdeab", "deabc", etc.
public boolean isRotation(String s1, String s2) {
    if (s1.length() != s2.length()) return false;
    // s2 is rotation of s1 iff s2 is substring of s1+s1
    return !search(s1 + s1, s2).isEmpty();
}
```

---

## Z-Algorithm <a name="z-algorithm"></a>

### The Z-Array Concept

```
Z[i] = Length of longest substring starting at i
       that matches a prefix of the string

String: a a b c a a b x a a a z
Z:      -  1 0 0 3 1 0 0 2 2 1 0

Z[0] is undefined (or set to length)
Z[1] = 1: "a" matches prefix "a"
Z[4] = 3: "aab" matches prefix "aab"
Z[8] = 2: "aa" matches prefix "aa"
```

### Z-Algorithm Implementation

```java
public class ZAlgorithm {

    // Build Z-array
    public int[] buildZ(String s) {
        int n = s.length();
        int[] z = new int[n];

        int left = 0, right = 0;

        for (int i = 1; i < n; i++) {
            if (i < right) {
                // Use previously computed value
                z[i] = Math.min(right - i, z[i - left]);
            }

            // Extend match
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
                z[i]++;
            }

            // Update window
            if (i + z[i] > right) {
                left = i;
                right = i + z[i];
            }
        }
        return z;
    }

    // Pattern matching using Z-algorithm
    public List<Integer> search(String text, String pattern) {
        List<Integer> result = new ArrayList<>();

        // Concatenate: pattern + "$" + text
        String combined = pattern + "$" + text;
        int[] z = buildZ(combined);
        int m = pattern.length();

        // Find positions where Z[i] = pattern length
        for (int i = m + 1; i < combined.length(); i++) {
            if (z[i] == m) {
                result.add(i - m - 1);  // Adjust index
            }
        }
        return result;
    }
}
```

### Visual: Z-Array Construction

```
String: a a b a a b a a a
Index:  0 1 2 3 4 5 6 7 8

i=1: Compare s[1..] with s[0..]
     "abaabaa a" vs "aab aabaa a"
     Match: "a" → Z[1] = 1
     Window: [1, 2)

i=2: i >= right, start fresh
     "b..." vs "a..." → No match → Z[2] = 0

i=3: i >= right, start fresh
     "aabaaa" vs "aabaab..."
     Match: "aab" → Z[3] = 3
     Window: [3, 6)

i=4: i < right, i - left = 1, Z[1] = 1, right - i = 2
     Z[4] = min(2, 1) = 1, then try to extend
     s[1] = 'a', s[5] = 'b' → No extend
     Z[4] = 1

Continue...
Final Z = [-, 1, 0, 3, 1, 0, 2, 2, 1]
```

### Z-Algorithm vs KMP

```
┌─────────────────────────────────────────────────────────────────┐
│              Z-ALGORITHM vs KMP                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Both: O(n + m) time, O(m) space                                │
│                                                                 │
│  Z-Algorithm:                                                   │
│  ✓ Conceptually simpler                                         │
│  ✓ More intuitive (direct prefix matching)                      │
│  ✓ Useful for many string problems                              │
│  ✗ Requires concatenation (extra space for search)              │
│                                                                 │
│  KMP:                                                           │
│  ✓ True O(m) space (no concatenation)                           │
│  ✓ Better for streaming (online algorithm)                      │
│  ✗ LPS logic more complex                                       │
│                                                                 │
│  Interview tip: Know both, use whichever feels natural          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Z-Array Applications

```java
// Application 1: Find all occurrences (shown above)

// Application 2: Longest prefix that is also suffix
public String longestPrefixSuffix(String s) {
    int[] z = buildZ(s);
    int n = s.length();
    int maxLen = 0;

    for (int i = 1; i < n; i++) {
        // Check if match extends to end
        if (i + z[i] == n) {
            maxLen = Math.max(maxLen, z[i]);
        }
    }
    return s.substring(0, maxLen);
}

// Application 3: Count distinct substrings
// (Advanced - combine with suffix array)
```

---

## Rabin-Karp (Rolling Hash) <a name="rabin-karp"></a>

### The Hashing Idea

```
Instead of comparing characters, compare HASH values.
If hashes match, verify with actual comparison.

Use "rolling hash" to update hash in O(1) when sliding window.

Hash("ABC") = A*b² + B*b¹ + C*b⁰  (where b = base, like 26 or 31)

When sliding from "ABC" to "BCD":
New hash = (Old hash - A*b²) * b + D
```

### Rabin-Karp Implementation

```java
public class RabinKarp {
    private static final long BASE = 31;
    private static final long MOD = 1_000_000_007;

    public List<Integer> search(String text, String pattern) {
        List<Integer> result = new ArrayList<>();
        int n = text.length(), m = pattern.length();
        if (m > n) return result;

        // Compute hash of pattern and first window
        long patternHash = computeHash(pattern, m);
        long textHash = computeHash(text, m);

        // Precompute BASE^(m-1) for rolling
        long highestPow = 1;
        for (int i = 0; i < m - 1; i++) {
            highestPow = (highestPow * BASE) % MOD;
        }

        // Slide window
        for (int i = 0; i <= n - m; i++) {
            if (patternHash == textHash) {
                // Verify to avoid hash collision
                if (text.substring(i, i + m).equals(pattern)) {
                    result.add(i);
                }
            }

            // Roll hash to next position
            if (i < n - m) {
                textHash = rollHash(textHash, text.charAt(i),
                                   text.charAt(i + m), highestPow);
            }
        }
        return result;
    }

    private long computeHash(String s, int len) {
        long hash = 0;
        for (int i = 0; i < len; i++) {
            hash = (hash * BASE + s.charAt(i)) % MOD;
        }
        return hash;
    }

    private long rollHash(long hash, char oldChar, char newChar, long highestPow) {
        // Remove old char's contribution
        hash = (hash - (oldChar * highestPow) % MOD + MOD) % MOD;
        // Shift left and add new char
        hash = (hash * BASE + newChar) % MOD;
        return hash;
    }
}
```

### Visual: Rolling Hash

```
Pattern: "ABC" with BASE = 31
Hash = 'A'*31² + 'B'*31 + 'C' = 65*961 + 66*31 + 67 = 64577

Text: "XABCD"

Window 1: "XAB"
Hash = 'X'*31² + 'A'*31 + 'B' = 88*961 + 65*31 + 66 = 86639

Window 2: "ABC" (slide right)
- Remove 'X': (86639 - 88*961) * 31 + 'C'
- New hash = 64577 ✓ (matches pattern!)
- Verify: "ABC" == "ABC" ✓

Window 3: "BCD" (slide right)
- Remove 'A', add 'D'
- New hash ≠ 64577
```

### When to Use Rabin-Karp

```
┌─────────────────────────────────────────────────────────────────┐
│              RABIN-KARP USE CASES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Multiple pattern search (efficient)                          │
│    Same text, many patterns → compute text hashes once          │
│                                                                 │
│  ✓ 2D pattern matching                                          │
│    Find matrix in larger matrix                                 │
│                                                                 │
│  ✓ Finding repeated substrings                                  │
│    Hash all substrings of length k, find duplicates             │
│                                                                 │
│  ✓ Plagiarism detection                                         │
│    Hash sentences/paragraphs, compare across documents          │
│                                                                 │
│  Complexity:                                                    │
│  Average: O(n + m)                                              │
│  Worst (many collisions): O(n * m)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Multiple Pattern Search

```java
// Find all occurrences of multiple patterns efficiently
public Map<String, List<Integer>> multiSearch(String text, String[] patterns) {
    Map<String, List<Integer>> result = new HashMap<>();

    // Group patterns by length
    Map<Integer, List<String>> byLength = new HashMap<>();
    for (String p : patterns) {
        byLength.computeIfAbsent(p.length(), k -> new ArrayList<>()).add(p);
        result.put(p, new ArrayList<>());
    }

    // Search each length group
    for (int len : byLength.keySet()) {
        // Precompute pattern hashes
        Map<Long, List<String>> patternHashes = new HashMap<>();
        for (String p : byLength.get(len)) {
            long h = computeHash(p, len);
            patternHashes.computeIfAbsent(h, k -> new ArrayList<>()).add(p);
        }

        // Roll through text
        if (len > text.length()) continue;

        long textHash = computeHash(text, len);
        long highestPow = modPow(BASE, len - 1, MOD);

        for (int i = 0; i <= text.length() - len; i++) {
            if (patternHashes.containsKey(textHash)) {
                String substring = text.substring(i, i + len);
                for (String p : patternHashes.get(textHash)) {
                    if (substring.equals(p)) {
                        result.get(p).add(i);
                    }
                }
            }

            if (i < text.length() - len) {
                textHash = rollHash(textHash, text.charAt(i),
                                   text.charAt(i + len), highestPow);
            }
        }
    }
    return result;
}
```

---

## Manacher's Algorithm <a name="manachers"></a>

### Problem: Longest Palindromic Substring

```
Naive: O(n²) or O(n³)
Manacher's: O(n)!

Key insight: Use symmetry of palindromes to avoid recomputation.
```

### Manacher's Implementation

```java
public class Manacher {

    public String longestPalindrome(String s) {
        if (s == null || s.length() == 0) return "";

        // Transform: "abc" → "#a#b#c#"
        // This handles both odd and even length palindromes uniformly
        StringBuilder sb = new StringBuilder("#");
        for (char c : s.toCharArray()) {
            sb.append(c).append("#");
        }
        String t = sb.toString();
        int n = t.length();

        int[] p = new int[n];  // p[i] = palindrome radius at i
        int center = 0, right = 0;  // Current rightmost palindrome

        for (int i = 0; i < n; i++) {
            // Mirror position
            int mirror = 2 * center - i;

            if (i < right) {
                // Use mirror's value (bounded by right edge)
                p[i] = Math.min(right - i, p[mirror]);
            }

            // Try to expand
            while (i + p[i] + 1 < n && i - p[i] - 1 >= 0 &&
                   t.charAt(i + p[i] + 1) == t.charAt(i - p[i] - 1)) {
                p[i]++;
            }

            // Update center and right boundary
            if (i + p[i] > right) {
                center = i;
                right = i + p[i];
            }
        }

        // Find maximum
        int maxLen = 0, maxCenter = 0;
        for (int i = 0; i < n; i++) {
            if (p[i] > maxLen) {
                maxLen = p[i];
                maxCenter = i;
            }
        }

        // Convert back to original string indices
        int start = (maxCenter - maxLen) / 2;
        return s.substring(start, start + maxLen);
    }
}
```

### Visual: Manacher's Algorithm

```
Original: "abaaba"
Transformed: "#a#b#a#a#b#a#"

Index:   0 1 2 3 4 5 6 7 8 9 10 11 12
String:  # a # b # a # a # b #  a  #
P[i]:    0 1 0 3 0 1 6 1 0 3 0  1  0
               ↑         ↑
          "aba"     "abaaba"

P[6] = 6: Center at position 6 (#), radius 6
         In original string: "abaaba" (length 6)

The trick: When we know P[center] and we're at position i,
           we can use P[mirror] to initialize P[i].
```

---

## Trie Data Structure <a name="trie"></a>

### What is a Trie?

```
Trie = Prefix Tree

Stores strings efficiently for:
- Prefix search
- Autocomplete
- Spell checking
- Word games (Boggle, Scrabble)

┌─────── root ───────┐
│                    │
▼                    ▼
a                    t
│                    │
▼                    ▼
p ──► e              o
      │              │
      ▼              ▼
      ✓              ✓
     (ape)          (to)

Words stored: "ape", "to"
Each node = character
✓ = end of word marker
```

### Trie Implementation

```java
public class Trie {
    private TrieNode root;

    class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEndOfWord = false;
    }

    public Trie() {
        root = new TrieNode();
    }

    // Insert word - O(m)
    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isEndOfWord = true;
    }

    // Search exact word - O(m)
    public boolean search(String word) {
        TrieNode node = searchNode(word);
        return node != null && node.isEndOfWord;
    }

    // Search prefix - O(m)
    public boolean startsWith(String prefix) {
        return searchNode(prefix) != null;
    }

    private TrieNode searchNode(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                return null;
            }
            node = node.children[index];
        }
        return node;
    }

    // Get all words with prefix
    public List<String> autocomplete(String prefix) {
        List<String> result = new ArrayList<>();
        TrieNode node = searchNode(prefix);
        if (node != null) {
            dfs(node, new StringBuilder(prefix), result);
        }
        return result;
    }

    private void dfs(TrieNode node, StringBuilder sb, List<String> result) {
        if (node.isEndOfWord) {
            result.add(sb.toString());
        }
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) {
                sb.append((char) ('a' + i));
                dfs(node.children[i], sb, result);
                sb.deleteCharAt(sb.length() - 1);
            }
        }
    }
}
```

### Trie with HashMap (For Unicode/Large Alphabets)

```java
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;
}

// Same logic, just use:
// node.children.get(c) instead of node.children[c - 'a']
// node.children.put(c, new TrieNode()) instead of array assignment
```

---

## Suffix Arrays <a name="suffix-arrays"></a>

### What is a Suffix Array?

```
Suffix Array = sorted array of all suffixes (by starting index)

String: "banana"
Suffixes:
0: "banana"
1: "anana"
2: "nana"
3: "ana"
4: "na"
5: "a"

Sorted suffixes:
5: "a"
3: "ana"
1: "anana"
0: "banana"
4: "na"
2: "nana"

Suffix Array = [5, 3, 1, 0, 4, 2]
```

### Simple Suffix Array Construction

```java
public int[] buildSuffixArray(String s) {
    int n = s.length();
    Integer[] sa = new Integer[n];

    // Initialize suffix indices
    for (int i = 0; i < n; i++) {
        sa[i] = i;
    }

    // Sort by suffix strings
    Arrays.sort(sa, (a, b) -> s.substring(a).compareTo(s.substring(b)));

    // Convert to int array
    int[] result = new int[n];
    for (int i = 0; i < n; i++) {
        result[i] = sa[i];
    }
    return result;
}

// O(n² log n) - okay for small strings
// For large strings, use DC3 algorithm O(n)
```

### LCP Array (Longest Common Prefix)

```java
/*
LCP[i] = length of longest common prefix between
         suffix[SA[i]] and suffix[SA[i-1]]

Used for: finding repeated substrings, string comparisons
*/

public int[] buildLCP(String s, int[] sa) {
    int n = s.length();
    int[] rank = new int[n];
    int[] lcp = new int[n];

    // Build rank array (inverse of SA)
    for (int i = 0; i < n; i++) {
        rank[sa[i]] = i;
    }

    int h = 0;  // Current LCP length
    for (int i = 0; i < n; i++) {
        if (rank[i] > 0) {
            int j = sa[rank[i] - 1];  // Previous suffix in sorted order
            while (i + h < n && j + h < n && s.charAt(i + h) == s.charAt(j + h)) {
                h++;
            }
            lcp[rank[i]] = h;
            if (h > 0) h--;
        }
    }
    return lcp;
}
```

### Applications of Suffix Array

```java
// Find longest repeated substring
public String longestRepeatedSubstring(String s) {
    int[] sa = buildSuffixArray(s);
    int[] lcp = buildLCP(s, sa);

    int maxLCP = 0, idx = 0;
    for (int i = 1; i < s.length(); i++) {
        if (lcp[i] > maxLCP) {
            maxLCP = lcp[i];
            idx = sa[i];
        }
    }
    return s.substring(idx, idx + maxLCP);
}

// Count distinct substrings
public int countDistinctSubstrings(String s) {
    int n = s.length();
    int[] sa = buildSuffixArray(s);
    int[] lcp = buildLCP(s, sa);

    // Total substrings = n*(n+1)/2
    // Subtract duplicates (sum of LCP values)
    int total = n * (n + 1) / 2;
    int duplicates = 0;
    for (int l : lcp) duplicates += l;

    return total - duplicates;
}
```

---

## Interview Problems <a name="interview-problems"></a>

### Problem 1: Implement strStr() (LeetCode 28)

```java
// Find first occurrence of needle in haystack
public int strStr(String haystack, String needle) {
    if (needle.isEmpty()) return 0;

    int[] lps = buildLPS(needle);
    int i = 0, j = 0;

    while (i < haystack.length()) {
        if (haystack.charAt(i) == needle.charAt(j)) {
            i++;
            j++;
        }

        if (j == needle.length()) {
            return i - j;  // First match
        } else if (i < haystack.length() &&
                   haystack.charAt(i) != needle.charAt(j)) {
            if (j != 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return -1;
}
```

### Problem 2: Repeated Substring Pattern (LeetCode 459)

```java
// Check if string can be formed by repeating a substring
public boolean repeatedSubstringPattern(String s) {
    int[] lps = buildLPS(s);
    int n = s.length();
    int len = lps[n - 1];  // Longest proper prefix which is also suffix

    // If len > 0 and (n - len) divides n evenly,
    // then pattern length = n - len
    return len > 0 && n % (n - len) == 0;
}

// Alternative: s is in (s+s)[1:-1]
public boolean repeatedSubstringPatternSimple(String s) {
    String doubled = s + s;
    return doubled.substring(1, doubled.length() - 1).contains(s);
}
```

### Problem 3: Longest Happy Prefix (LeetCode 1392)

```java
// Longest prefix which is also suffix (proper, not entire string)
public String longestPrefix(String s) {
    int[] lps = buildLPS(s);
    int len = lps[s.length() - 1];
    return s.substring(0, len);
}
```

### Problem 4: Shortest Palindrome (LeetCode 214)

```java
// Add minimum characters at the front to make palindrome
public String shortestPalindrome(String s) {
    // Find longest palindrome starting from index 0
    String rev = new StringBuilder(s).reverse().toString();
    String combined = s + "#" + rev;

    int[] lps = buildLPS(combined);
    int palindromeLen = lps[combined.length() - 1];

    // Add reverse of remaining suffix to front
    return rev.substring(0, s.length() - palindromeLen) + s;
}
```

### Problem 5: Word Search II (LeetCode 212)

```java
// Find all words from dictionary that exist in grid
public List<String> findWords(char[][] board, String[] words) {
    // Build Trie from words
    TrieNode root = new TrieNode();
    for (String word : words) {
        insert(root, word);
    }

    Set<String> result = new HashSet<>();
    int m = board.length, n = board[0].length;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            dfs(board, i, j, root, new StringBuilder(), result);
        }
    }
    return new ArrayList<>(result);
}

private void dfs(char[][] board, int i, int j, TrieNode node,
                 StringBuilder path, Set<String> result) {
    if (i < 0 || i >= board.length || j < 0 || j >= board[0].length) return;

    char c = board[i][j];
    if (c == '#' || node.children[c - 'a'] == null) return;

    path.append(c);
    node = node.children[c - 'a'];

    if (node.isEndOfWord) {
        result.add(path.toString());
    }

    board[i][j] = '#';  // Mark visited
    dfs(board, i + 1, j, node, path, result);
    dfs(board, i - 1, j, node, path, result);
    dfs(board, i, j + 1, node, path, result);
    dfs(board, i, j - 1, node, path, result);
    board[i][j] = c;    // Restore

    path.deleteCharAt(path.length() - 1);
}
```

### Problem 6: Longest Duplicate Substring (LeetCode 1044)

```java
// Binary search + Rolling hash
public String longestDupSubstring(String s) {
    int left = 1, right = s.length() - 1;
    String result = "";

    while (left <= right) {
        int mid = left + (right - left) / 2;
        String dup = findDuplicateOfLength(s, mid);

        if (dup != null) {
            result = dup;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}

private String findDuplicateOfLength(String s, int len) {
    long base = 26, mod = (1L << 32);
    long hash = 0, power = 1;

    // Compute initial hash and power
    for (int i = 0; i < len; i++) {
        hash = (hash * base + (s.charAt(i) - 'a')) % mod;
        if (i < len - 1) power = (power * base) % mod;
    }

    Map<Long, List<Integer>> seen = new HashMap<>();
    seen.put(hash, new ArrayList<>(List.of(0)));

    for (int i = len; i < s.length(); i++) {
        // Roll hash
        hash = (hash - (s.charAt(i - len) - 'a') * power % mod + mod) % mod;
        hash = (hash * base + (s.charAt(i) - 'a')) % mod;

        if (seen.containsKey(hash)) {
            String candidate = s.substring(i - len + 1, i + 1);
            for (int start : seen.get(hash)) {
                if (s.substring(start, start + len).equals(candidate)) {
                    return candidate;
                }
            }
        }
        seen.computeIfAbsent(hash, k -> new ArrayList<>()).add(i - len + 1);
    }
    return null;
}
```

---

## Quick Reference <a name="quick-reference"></a>

### Algorithm Comparison

```
┌──────────────┬────────────┬───────────┬─────────────────────────────┐
│  Algorithm   │   Time     │   Space   │        Best For             │
├──────────────┼────────────┼───────────┼─────────────────────────────┤
│  Naive       │ O(n*m)     │ O(1)      │ Very short patterns         │
│  KMP         │ O(n+m)     │ O(m)      │ Single pattern, streaming   │
│  Z-Algorithm │ O(n+m)     │ O(n+m)    │ Single pattern, intuitive   │
│  Rabin-Karp  │ O(n+m) avg │ O(m)      │ Multiple patterns           │
│  Trie        │ O(m) query │ O(total)  │ Prefix search, autocomplete │
│  Suffix Array│ O(n log n) │ O(n)      │ All substring queries       │
│  Manacher    │ O(n)       │ O(n)      │ Palindrome problems         │
└──────────────┴────────────┴───────────┴─────────────────────────────┘
```

### When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│              ALGORITHM SELECTION GUIDE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Find pattern in text"                                         │
│    → KMP or Z-algorithm (single pattern)                        │
│    → Rabin-Karp (multiple patterns)                             │
│                                                                 │
│  "Check if prefix exists" / "Autocomplete"                      │
│    → Trie                                                       │
│                                                                 │
│  "Longest palindrome"                                           │
│    → Manacher's (O(n))                                          │
│    → DP with memo (O(n²) but simpler)                           │
│                                                                 │
│  "Repeated substring" / "Count substrings"                      │
│    → Rolling hash + Binary search                               │
│    → Suffix array                                               │
│                                                                 │
│  "Is X a rotation of Y?"                                        │
│    → KMP: search Y in X+X                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Common String Tricks

```java
// 1. Is rotation?
boolean isRotation = (s1 + s1).contains(s2);

// 2. Is palindrome?
boolean isPalindrome = s.equals(new StringBuilder(s).reverse().toString());

// 3. Character frequency
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;

// 4. Check anagram
Arrays.equals(freq1, freq2);

// 5. String to char array for manipulation
char[] arr = s.toCharArray();
// ... modify arr ...
String result = new String(arr);
```

### Template: Building LPS Array

```java
private int[] buildLPS(String pattern) {
    int m = pattern.length();
    int[] lps = new int[m];
    int len = 0, i = 1;

    while (i < m) {
        if (pattern.charAt(i) == pattern.charAt(len)) {
            lps[i++] = ++len;
        } else if (len != 0) {
            len = lps[len - 1];  // Key: don't increment i
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}
```

---

##

### Topical Breadth — String Matching Selection Trade-offs

The string matching algorithms in this chapter form a trade-off space along worst-case guarantee, preprocessing cost, and space. **KMP** pays O(m) preprocessing to build the longest-prefix-suffix (LPS) array, then searches in O(n+m) worst-case time with O(m) space — the trade-off is worth it when the pattern is reused (streaming, repeated searches) or when the text is adversarial (no pathological worst case). **Rabin-Karp** uses rolling hash for O(m) preprocessing and O(n+m) average search but degrades to O(nm) worst-case when hash collisions occur; this is the only algorithm where an adversarial input can trigger the worst case, so it requires verification on every match. **Z-Algorithm** achieves O(n+m) without the LPS complexity, but requires concatenating pattern + "$" + text (adding O(n+m) space) and is conceptually simpler — it is preferred when you also need period detection or longest-prefix-that-is-also-suffix properties. **Naive search** has O(1) preprocessing and O(1) space but O(nm) worst-case; in practice, on short patterns (m < 10) or random English text, the inner loop exits early so naive often beats KMP because it avoids the O(m) preprocessing overhead entirely.

| Algorithm   | Preprocessing | Search (Worst) | Search (Average)                      | Space  | Best For                                      |
| ----------- | ------------- | -------------- | ------------------------------------- | ------ | --------------------------------------------- |
| Naive       | O(1)          | O(nm)          | O(nm) / often O(n) for short patterns | O(1)   | Short patterns, random text, one-off searches |
| KMP         | O(m)          | O(n+m)         | O(n+m)                                | O(m)   | Repeated pattern, streaming, adversarial text |
| Rabin-Karp  | O(m)          | O(nm)          | O(n+m)                                | O(m)   | Multiple patterns, 2D matching, randomized    |
| Z-Algorithm | O(m)          | O(n+m)         | O(n+m)                                | O(n+m) | When Z-array needed for other purposes        |

Select **KMP** when you need a guaranteed O(n+m) bound and the pattern is known upfront. Select **Rabin-Karp** when searching multiple patterns against the same text (precompute text hash once). Select **Z-Algorithm** when you also need period detection or prefix-suffix properties. Default to **KMP** for single-pattern interviews unless the problem hints at hashing.

Summary

```
╔═══════════════════════════════════════════════════════════════╗
║            STRING ALGORITHMS - MASTER THESE                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. KMP - Pattern matching in O(n+m)                          ║
║     Key: LPS array, never recheck matched characters          ║
║                                                               ║
║  2. RABIN-KARP - Rolling hash for multiple patterns           ║
║     Key: Hash comparison, verify on match                     ║
║                                                               ║
║  3. Z-ALGORITHM - Alternative to KMP, more intuitive          ║
║     Key: Z[i] = prefix match length at position i             ║
║                                                               ║
║  4. TRIE - Prefix search & autocomplete                       ║
║     Key: Tree of characters, end-of-word markers              ║
║                                                               ║
║  Interview Tip: KMP is asked most often.                      ║
║  Know how to build LPS and explain the skip logic.            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Pro Tip:** When explaining string algorithms in interviews, draw out the arrays (LPS, Z) step by step. Interviewers love to see you work through examples visually!

---

---

---

## 📎 Reference Anchor

**OpenJDK `String` and `Pattern` — string algorithms in production**
- `String.indexOf(String)`: [StringLatin1.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/StringLatin1.java) — uses a two-way string matching variant (not naive O(n×m)). **Invariant**: guarantees O(n+m) worst case without preprocessing the pattern each call.
- `Pattern.compile()` + `Matcher.find()`: NFA-based regex. **Invariant**: `compile()` builds the NFA O(m); `find()` simulates in O(n×m) worst case for complex patterns. `(a+)+b` on `"aaa...a"` (no b) causes O(2ⁿ) backtracking — ReDoS.
- **Local rewrite rule**: For fixed patterns known at compile time, prefer `String.contains()` or `indexOf()` over `Pattern.matches()`. `Pattern.matches(regex, input)` compiles the regex on EVERY call — O(m) overhead per invocation.
- **Constraint warning**: Java `String.split(regex)` uses regex. For a simple character delimiter, use `String.split(",", -1)` with the `-1` limit to preserve trailing empty strings, OR use `StringTokenizer` for O(n) performance without regex overhead.

---

## When It Breaks -- String Algorithms

### 1. KMP — Wrong Failure Function Computation
**What breaks**: Computing `fail[]` (partial match table) with off-by-one: starting at `fail[0] = -1` vs `fail[0] = 0` differs by convention. Code from two different KMP implementations can have inconsistent base cases, causing wrong shifts.
**Fix**: Commit to one convention. Common: `fail[0] = 0` where `fail[i]` = length of longest proper prefix of `pat[0..i]` that is also a suffix. Verify by hand on `"ABACABA"`.

### 2. Rolling Hash — Collision Giving Wrong Results
**What breaks**: Rabin-Karp compares hash values first, then the actual string only on match. If the hash modulus is small, many collisions occur. Rabin-Karp with `mod = 10⁹+7` has collision probability ≈ 1/10⁹ per comparison — negligible. Using `mod = 1000` causes ~1/1000 false positives and wrong match results.
**Fix**: Use a large prime (10⁹+7 or 10¹⁸+9). For competitive programming, use double hashing (two different primes) to reduce collision probability to 1/(mod1 × mod2).

### 3. Trie — Not Marking End of Word
**What breaks**: Inserting `"app"` and `"apple"`. Searching for `"app"` without an `isEnd` flag returns `false` (because the node for 'p' exists but isn't marked as a word ending) — the trie finds the prefix but can't distinguish prefix from complete word.
**Fix**: Always set `node.isEnd = true` after the last character of each inserted word.

---

## Proof Corner: KMP O(n+m) Time

**Claim**: KMP searches for pattern P (length m) in text T (length n) in O(n+m) time.

**Proof**:
Define a "counter" that tracks the combined number of character comparisons. Observe:
- Every comparison either advances `j` (match) or resets `j` via the failure function (mismatch).
- `j` is incremented at most n times total (once per character of T matched).
- Each failure function application decreases `j` by at least 1 (it can never go below 0).
- Therefore total decreases of `j` ≤ total increases = n.
- Total comparisons in the search phase ≤ 2n = O(n).
- Building the failure function: same argument on P with itself → O(m).

**Total**: O(n+m). □

**Contrast with naïve**: Naïve O(n×m) occurs when every alignment tries all m characters before failing (e.g., pattern `"aab"` in text `"aaaa...aab"`). KMP's failure function skips redundant comparisons by exploiting the prefix-suffix structure of P.

🔬 **Section Challenge — String Algorithms**

**Challenge 1 (Analysis — 7 min):** Why is KMP's failure function computed in O(m) time? Walk through the computation for pattern `"ABACABA"`.

<details><summary>Model Answer</summary>

Same aggregate argument as the main search: `k` (the length of the current candidate prefix-suffix) is incremented at most m times total across all i. Each failure (`k = fail[k-1]`) decreases k, and decreases can happen at most as many times as increases. Total operations ≤ 2m = O(m).

For `"ABACABA"`:
- i=0: `fail[0]=0` (A: no proper prefix = suffix)
- i=1: B != A → fail[1]=0
- i=2: A == A → fail[2]=1 (prefix "A" = suffix "A")
- i=3: C != B → fail[3]=0
- i=4: A == A → fail[4]=1; B != B... wait, A == A so k=1, then B vs C → fail[4]=1
- i=5: B == B → fail[5]=2 (prefix "AB" = suffix "AB")
- i=6: A == A → fail[6]=3 (prefix "ABA" = suffix "ABA")

Result: `[0, 0, 1, 0, 1, 2, 3]`.

</details>
