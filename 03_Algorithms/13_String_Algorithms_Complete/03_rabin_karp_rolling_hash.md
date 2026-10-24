# Rabin-Karp (Rolling Hash) <a name="rabin-karp"></a>

> **Navigation**: [← Z-Algorithm](02_z_algorithm.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Trie Data Structure →](04_trie_data_structure.md)
> Page 3 of 7 in **String Algorithms Complete Guide**


## The Hashing Idea

```
Instead of comparing characters, compare HASH values.
If hashes match, verify with actual comparison.

Use "rolling hash" to update hash in O(1) when sliding window.

Hash("ABC") = A*b² + B*b¹ + C*b⁰  (where b = base, like 26 or 31)

When sliding from "ABC" to "BCD":
New hash = (Old hash - A*b²) * b + D
```

## Rabin-Karp Implementation

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

## Visual: Rolling Hash

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

## When to Use Rabin-Karp

**RABIN-KARP USE CASES**

```text
✓ Multiple pattern search (efficient)
  Same text, many patterns → compute text hashes once

✓ 2D pattern matching
  Find matrix in larger matrix

✓ Finding repeated substrings
  Hash all substrings of length k, find duplicates

✓ Plagiarism detection
  Hash sentences/paragraphs, compare across documents

Complexity:
Average: O(n + m)
Worst (many collisions): O(n * m)
```

## Multiple Pattern Search

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

[← Z-Algorithm](02_z_algorithm.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Trie Data Structure →](04_trie_data_structure.md)
