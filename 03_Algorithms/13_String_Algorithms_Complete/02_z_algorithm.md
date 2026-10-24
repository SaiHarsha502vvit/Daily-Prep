# Z-Algorithm <a name="z-algorithm"></a>

> **Navigation**: [← Why String Algorithms?](01_why_string_algorithms.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Rabin-Karp (Rolling Hash) →](03_rabin_karp_rolling_hash.md)
> Page 2 of 7 in **String Algorithms Complete Guide**


## The Z-Array Concept

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

## Z-Algorithm Implementation

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

## Visual: Z-Array Construction

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

## Z-Algorithm vs KMP

**Z-ALGORITHM vs KMP**

```text
Both: O(n + m) time, O(m) space

Z-Algorithm:
✓ Conceptually simpler
✓ More intuitive (direct prefix matching)
✓ Useful for many string problems
✗ Requires concatenation (extra space for search)

KMP:
✓ True O(m) space (no concatenation)
✓ Better for streaming (online algorithm)
✗ LPS logic more complex

Interview tip: Know both, use whichever feels natural
```

## Z-Array Applications

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

[← Why String Algorithms?](01_why_string_algorithms.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Rabin-Karp (Rolling Hash) →](03_rabin_karp_rolling_hash.md)
