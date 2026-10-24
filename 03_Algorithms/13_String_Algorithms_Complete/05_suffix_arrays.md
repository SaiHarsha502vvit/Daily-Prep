# Suffix Arrays <a name="suffix-arrays"></a>

> **Navigation**: [← Trie Data Structure](04_trie_data_structure.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Interview Problems →](06_interview_problems.md)
> Page 5 of 7 in **String Algorithms Complete Guide**


## What is a Suffix Array?

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

## Simple Suffix Array Construction

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

## LCP Array (Longest Common Prefix)

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

## Applications of Suffix Array

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

[← Trie Data Structure](04_trie_data_structure.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Interview Problems →](06_interview_problems.md)
