# Interview Problems <a name="interview-problems"></a>

> **Navigation**: [← Suffix Arrays](05_suffix_arrays.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Quick Reference →](07_quick_reference.md)
> Page 6 of 7 in **String Algorithms Complete Guide**


## Problem 1: Implement strStr() (LeetCode 28)

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

## Problem 2: Repeated Substring Pattern (LeetCode 459)

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

## Problem 3: Longest Happy Prefix (LeetCode 1392)

```java
// Longest prefix which is also suffix (proper, not entire string)
public String longestPrefix(String s) {
    int[] lps = buildLPS(s);
    int len = lps[s.length() - 1];
    return s.substring(0, len);
}
```

## Problem 4: Shortest Palindrome (LeetCode 214)

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

## Problem 5: Word Search II (LeetCode 212)

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

## Problem 6: Longest Duplicate Substring (LeetCode 1044)

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

[← Suffix Arrays](05_suffix_arrays.md) | [Chapter overview](../13_String_Algorithms_Complete.md) | [Quick Reference →](07_quick_reference.md)
