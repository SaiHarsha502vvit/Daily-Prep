**Navigation**: [< Previous](17_Backtracking_Plus_Pruning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](19_Matrix_Plus_Grid_Traversal.md)

# String + Advanced Tricks — Combined Pattern Guide

**WHY this combination?** Strings combine array access, hashing, sliding window, DP, and specialized algorithms (KMP, Rabin-Karp). Most "string" problems are actually pattern problems in disguise.

### ⚠️ Constraint Lens

### Historical Evolution

**Inventor / Originator:** KMP (Knuth-Morris-Pratt 1977), Boyer-Moore (1977), Rabin-Karp (1981), and tries (de la Briandais 1959, Fredkin 1960 name).

**Predecessor context:** Naive string matching was O(n×m) — scanning the entire pattern at each position. Tries weren't used because dictionary lookup was done via hashing or binary search.

**Evolution narrative:** KMP preprocessed the pattern to skip re-examining matched characters. Boyer-Moore scanned right-to-left for faster average case. Tries provided O(k) retrieval where k is string length, independent of dictionary size.

**Modern practice:** String algorithms power search engines, compilers (lexical analysis), bioinformatics (BLAST uses variants), and network intrusion detection (Aho-Corasick).

- **KMP — Knuth, Morris, Pratt 1977**: O(n+m) worst-case; no repeated text examination
- **Boyer-Moore — 1977**: Right-to-left scan; often O(n/m) in practice
- **Rabin-Karp — 1981**: Rolling hash; O(n+m) average; natural multi-pattern extension
- **Modern practice**: Bioinformatics (BLAST), compilers (lexing), network IDS (Aho-Corasick)

---

### Production Reality

**Pattern Mis-Selection Debug Workflow — How to identify the wrong pattern:**

When your solution is O(N²) when you expected O(N), or fails on specific inputs, the bug is usually pattern mis-selection, not code. Use this 5-step workflow:

1. **Check the constraint lens**: Did the input violate the pattern's prerequisite? (e.g., sorted input for two pointers, positive numbers for sliding window sum)
2. **Trace the failure input**: For the smallest failing case, identify which invariant broke. Does the algorithm assume the invariant that wasn't true?
3. **Measure the actual complexity**: Add a counter for the inner-loop iterations. O(N²) when O(N) expected usually means a redundant scan, not a wrong algorithm.
4. **Check edge cases the pattern doesn't cover**: Empty input, single element, all-same values, maximum/minimum values. These often reveal the wrong pattern.
5. **Escalate to a different pattern family**: If 4 steps don't fix it, the pattern itself is wrong. Switch to the pattern suggested by the constraint lens.

**Pattern-Specific Failure Modes:**

- **KMP prefix function off-by-one in failure-link array** — The KMP failure function (lps) array must satisfy `lps[i]` = length of longest proper prefix that is also suffix. Off-by-one errors cause the algorithm to match incorrect positions. Detection: test with pattern "AAA" — lps should be [0,1,2], wrong values cause infinite loop or miss.

- **Rabin-Karp hash collision degrades O(n+m) to O(nm) — use double hashing for adversarial input** — With a bad hash function and adversarial inputs (e.g., all 'A's), hash collisions force fallback to character-by-character comparison, degrading performance. Detection: test with repetitive strings; use 64-bit rolling hash or double modulo.

- **String immutability causes O(n²) when concatenating in loop (use StringBuilder)** — In Java, `s += c` creates a new string object each iteration. For 100,000 iterations, this causes 100,000 string allocations. Detection: profile with `-Xmx` and large inputs; use StringBuilder instead.

**Production Selection Heuristic:** Use StringBuilder for concatenation in loops. For pattern matching, prefer KMP for guaranteed worst-case O(n+m); use Rabin-Karp with double hashing for multi-pattern matching.

---

| Given Constraints                              | Do This                        |
| ---------------------------------------------- | ------------------------------ |
| substring with character limit                 | sliding window                 |
| subsequence / edit relation                    | DP                             |
| exact pattern matching once                    | KMP / rolling hash             |
| many patterns                                  | Aho-Corasick                   |
| fixed lowercase alphabet                       | `int[26]` frequency            |
| Unicode/general chars                          | hashmap/code-point aware logic |
| repeated substring/palindrome hard constraints | suffix/Manacher/rolling hash   |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

### 🧠 Deep Intuition — Strings Are Disguised Pattern Problems

Most string problems aren't really "string" problems — they're array, hash, or DP problems wearing a string costume. The key is to **identify the underlying pattern**:

- "Find all anagrams in a string" → This is a **sliding window** problem with a frequency map
- "Edit distance" → This is a **2D DP** problem (same as LCS family)
- "Valid parentheses" → This is a **stack** problem
- "Longest palindromic substring" → **Two pointers** (expand from center) or **DP**

The string-specific part is usually just the data representation, not the algorithm.

#### Why String Immutability Matters in Java

In Java, strings are immutable — every concatenation creates a new String object. `s += c` inside a loop creates O(n) new strings of increasing size, resulting in **O(n²) total time** for what looks like an O(n) loop. Always use `StringBuilder` for building strings incrementally — it uses an internal array and amortizes to O(n) total time.

#### The `int[26]` Trick — Why It's Faster Than HashMap

For problems involving only lowercase letters, `int[26]` (indexed by `c - 'a'`) is strictly better than `HashMap<Character, Integer>`:

- **Array access is O(1)** with no hash computation, no collision handling, no boxing/unboxing
- **Comparison of two frequency arrays** is O(26) = O(1), while comparing two HashMaps is O(n) with higher constant factors
- **Memory**: 26 ints = 104 bytes vs HashMap's ~1000+ bytes for the same data

Use `int[128]` when the problem involves ASCII characters (uppercase, digits, etc.), and HashMap only when the character set is unbounded (Unicode).

---

## 🧠 PATTERN DECODER FOR STRING PROBLEMS

```
String problem?
├── "Parentheses" → Stack
├── "Anagram/permutation" → HashMap frequency / sorted key
├── "Substring with condition" → Sliding Window + HashMap
├── "Palindrome" → Two Pointers (expand from center) or DP
├── "Pattern matching" → KMP / Rabin-Karp / Z-algorithm
├── "Transform A to B" → DP (Edit Distance)
├── "Word break" → DP + Trie/Set
├── "Expression evaluation" → Stack (operator precedence)
└── "Justify/format" → Simulation
```

---

## 📐 CORE TEMPLATES

### Template 1: Character Frequency (int[26] trick)

```java
// Faster than HashMap for lowercase letters
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;

// Compare two frequency arrays → O(26) = O(1)
boolean isAnagram = Arrays.equals(freq1, freq2);
```

### Template 2: Palindrome Check (Expand from Center)

```java
int expandFromCenter(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--; right++;
    }
    return right - left - 1;  // palindrome length
}
// Call for each center: expandFromCenter(s, i, i) and expandFromCenter(s, i, i+1)
```

### Template 3: KMP Pattern Matching

```java
// Build failure function
int[] buildLPS(String pattern) {
    int[] lps = new int[pattern.length()];
    int len = 0, i = 1;
    while (i < pattern.length()) {
        if (pattern.charAt(i) == pattern.charAt(len)) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];  // fall back
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}
```

---

## � FULL WALKTHROUGH: Group Anagrams

```
Problem: Group words that are anagrams.
         ["eat","tea","tan","ate","nat","bat"]

Approach: Sort each word → use as HashMap key → group by key.

WHY sorted-key works:
  Anagrams have the same characters, just rearranged.
  Sorted form: "eat" → "aet", "tea" → "aet", "ate" → "aet" — all same key!

Step-by-step:
  "eat" → sort → "aet" → map{"aet": ["eat"]}
  "tea" → sort → "aet" → map{"aet": ["eat","tea"]}
  "tan" → sort → "ant" → map{"aet": ["eat","tea"], "ant": ["tan"]}
  "ate" → sort → "aet" → map{"aet": ["eat","tea","ate"], "ant": ["tan"]}
  "nat" → sort → "ant" → map{"aet": [...], "ant": ["tan","nat"]}
  "bat" → sort → "abt" → map{..., "abt": ["bat"]}

  Result: [["eat","tea","ate"], ["tan","nat"], ["bat"]] ✅

Time: O(n · k log k) where k = max word length | Space: O(nk)
Optimization: Use int[26] frequency as key instead of sorting → O(nk)
```

---

## 🔬 FULL WALKTHROUGH 2: Longest Palindromic Substring (Expand Around Center)

```
Problem: Find the longest palindromic substring in "babad".

Approach: For each character (and between each pair), expand outward
          while characters match.

WHY center expansion? A palindrome mirrors around its center.
Total centers: 2n-1 (n single chars + n-1 between-pairs).

Step-by-step (showing key centers):
  Center at 'b'(0): "b" → expand → 'b' (length 1)
  Center at 'a'(1): "a" → expand → s[0]='b' ≠ s[2]='b'? Wait...
    Actually: s[0]='b', s[2]='b' → "bab" (length 3) ✅
    Expand more: s[-1] out of bounds → stop.
  Center at 'b'(2): "b" → expand → s[1]='a' ≠ s[3]='a'? Yes!
    "aba" (length 3). Expand: s[0]='b' ≠ s[4]='d' → stop.
  Center between (1,2): s[1]='a' ≠ s[2]='b' → no even palindrome
  Center at 'a'(3): "a" → expand → s[2]='b' ≠ s[4]='d' → length 1
  Center at 'd'(4): "d" → length 1

  Longest: "bab" or "aba" (both length 3) ✅

Time: O(n²) | Space: O(1)
NOTE: Manacher's algorithm does this in O(n) but is rarely asked.
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
COMMON MISTAKES:
1. String comparison: using == instead of .equals() in Java
   "abc" == "abc" may be true (string pool) but NOT guaranteed!
2. Off-by-one with substring(): s.substring(start, end) is [start, end)
3. Forgetting empty string checks: s == null || s.isEmpty()
4. KMP: Building LPS array wrong — the prefix function is tricky.
   Test on "AAAA" (lps=[0,1,2,3]) and "ABCABD" (lps=[0,0,0,1,2,0])
5. Palindrome: not handling even-length palindromes separately
   "abba" has center BETWEEN b and b, not AT any single character
```

---

## 📊 COMPLEXITY SUMMARY

| Problem            | Approach           | Time         | Space |
| ------------------ | ------------------ | ------------ | ----- |
| Group Anagrams     | Sort key + HashMap | O(n·k log k) | O(nk) |
| Group Anagrams     | Freq key + HashMap | O(nk)        | O(nk) |
| Longest Palindrome | Expand from center | O(n²)        | O(1)  |
| Longest Palindrome | Manacher's         | O(n)         | O(n)  |
| Pattern Search     | KMP                | O(n+m)       | O(m)  |
| Pattern Search     | Rabin-Karp         | O(n+m) avg   | O(1)  |
| Valid Parentheses  | Stack              | O(n)         | O(n)  |

---

🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

---

## 🌲 ADVANCED STRING DATA STRUCTURES: TRIES (Prefix Trees)

A **Trie** is a tree-like data structure used to store a dynamic set of strings where the keys are usually strings. It is extremely efficient for solving "prefix" problems.

**WHY use a Trie?**

- Searching for a string of length `M` in `N` strings takes **O(M)** time, whereas a Hash table takes O(M) time but with high constant factors, and collision risks.
- Solves "Find all words starting with prefix X" instantly (Auto-complete).
- Space optimization when storing many strings with shared prefixes.

### Template 4: Basic Trie Implementation

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false; // true if this node represents the end of a word
}

class Trie {
    TrieNode root = new TrieNode();

    // Insertion: O(M) where M is word length
    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            if (curr.children[c - 'a'] == null) {
                curr.children[c - 'a'] = new TrieNode();
            }
            curr = curr.children[c - 'a'];
        }
        curr.isEnd = true;
    }

    // Search exact word: O(M)
    public boolean search(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            if (curr.children[c - 'a'] == null) return false;
            curr = curr.children[c - 'a'];
        }
        return curr.isEnd;
    }

    // Check if any word starts with prefix: O(M)
    public boolean startsWith(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            if (curr.children[c - 'a'] == null) return false;
            curr = curr.children[c - 'a'];
        }
        return true;
    }
}
```

**Common Trie Variations:**

1. **Trie + DFS/Backtracking**: Used in "Word Search II" (2D Grid + Dictionary).
2. **Bitwise Trie**: Used for finding Maximum XOR of two numbers in an array. The children array size is 2 (for bits 0 and 1).

---

## 🚀 ADVANCED STRING PATTERNS: RABIN-KARP & Z-ALGORITHM

### Pattern 5: Rolling Hash (Rabin-Karp)

**Goal:** Find a pattern `P` (length M) in a text `T` (length N) in O(N) time.

**How it works (The Intuition):**
Instead of comparing strings `O(M)`, we compare their **hashes** `O(1)`. But computing a hash takes `O(M)`. The magic of _Rolling Hash_ is that we can update the hash in `O(1)` time when the window slides:
`New Hash = (Old Hash - Value of Dropped Char) * Base + Value of Added Char`

```java
public int rabinKarp(String text, String pattern) {
    if (pattern.length() > text.length()) return -1;

    int N = text.length(), M = pattern.length();
    int PRIME = 31; // Base (number of chars in alphabet)
    int MOD = 1_000_000_009; // Large prime to avoid overflow

    long patternHash = 0, textHash = 0, highestPower = 1;

    // 1. Calculate highest power and initial hashes
    for (int i = 0; i < M; i++) {
        patternHash = (patternHash * PRIME + pattern.charAt(i)) % MOD;
        textHash = (textHash * PRIME + text.charAt(i)) % MOD;
        if (i < M - 1) {
            highestPower = (highestPower * PRIME) % MOD;
        }
    }

    // 2. Slide the window
    for (int i = 0; i <= N - M; i++) {
        // If hashes match, verify characters (to prevent collision errors)
        if (patternHash == textHash && text.substring(i, i + M).equals(pattern)) {
            return i; // Found!
        }

        // Calculate hash for next window
        if (i < N - M) {
            // Remove leading digit, add trailing digit
            textHash = (textHash - text.charAt(i) * highestPower) % MOD;
            textHash = (textHash * PRIME + text.charAt(i + M)) % MOD;
            if (textHash < 0) {
                textHash += MOD; // Keep positive
            }
        }
    }
    return -1;
}
```

### Pattern 6: The Z-Algorithm

**Goal:** Find all occurrences of pattern `P` in text `T` in linear time O(N+M).

**How it works:**
We concatenate the pattern and text with a special separator: `S = P + "$" + T`.
We then compute the **Z-Array** for `S`. `Z[i]` represents the length of the longest substring starting from `S[i]` which is also a prefix of `S`. If `Z[i] == length(P)`, we found a match starting at index `i - length(P) - 1` in the original text!

```java
int[] calculateZ(String str) {
    int n = str.length();
    int[] Z = new int[n];
    int L = 0, R = 0; // The window [L, R] represents the current matching prefix

    for (int i = 1; i < n; i++) {
        if (i > R) {
            // No previous match to reuse, compute manually
            L = R = i;
            while (R < n && str.charAt(R - L) == str.charAt(R)) R++;
            Z[i] = R - L;
            R--;
        } else {
            // We are inside a matching window! Look at the previously computed value.
            int k = i - L;
            if (Z[k] < R - i + 1) {
                Z[i] = Z[k]; // Safe to copy
            } else {
                // Touches or crosses the right bound, need manual matching beyond R
                L = i;
                while (R < n && str.charAt(R - L) == str.charAt(R)) R++;
                Z[i] = R - L;
                R--;
            }
        }
    }
    return Z;
}
```

_Why Z over KMP?_ Both are O(N+M). Z-algorithm is often conceptually easier to understand because it directly tracks prefix matches using a sliding window [L, R], whereas KMP requires understanding the abstract "fall back" mechanisms of the LPS array.

---

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

| #   | Problem                                                                                                   | Companies          | Key Insight             |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------- |
| 1   | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)                                     | Salesforce         | Stack matching          |
| 2   | [Print Duplicates in String](https://www.geeksforgeeks.org/print-all-the-duplicates-in-the-input-string/) | —                  | Frequency counting      |
| 3   | [strStr (indexOf)](https://leetcode.com/problems/implement-strstr/)                                       | Salesforce         | KMP or built-in         |
| 4   | [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/)                             | —                  | Vertical scan or trie   |
| 5   | [Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/)                                 | Amazon, Salesforce | Two pointers + skip one |

### Medium

| #   | Problem                                                                                                                                                             | Companies  | Key Insight                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- |
| 6   | [Integer to Roman](https://leetcode.com/problems/integer-to-roman/)                                                                                                 | Amazon     | Greedy: largest denomination first |
| 7   | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)                                                                                         | Salesforce | Backtracking with open/close count |
| 8   | [Simplify Path](https://leetcode.com/problems/simplify-path/)                                                                                                       | Amazon     | Stack for directory components     |
| 9   | [Smallest Window (all chars)](https://practice.geeksforgeeks.org/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string-1587115621/1) | Amazon     | Sliding window + freq match        |
| 10  | [Reverse Words in String](https://leetcode.com/problems/reverse-words-in-a-string/)                                                                                 | Amazon     | Split + reverse or two-pointer     |
| 11  | [Rabin-Karp](https://www.geeksforgeeks.org/rabin-karp-algorithm-for-pattern-searching/)                                                                             | Salesforce | Rolling hash matching              |
| 12  | [Group Anagrams](https://leetcode.com/problems/group-anagrams/)                                                                                                     | —          | Sorted key or freq key             |
| 13  | [Word Wrap](https://practice.geeksforgeeks.org/problems/word-wrap1646/1)                                                                                            | Salesforce | DP: minimize penalty               |
| 14  | [Basic Calculator II](https://leetcode.com/problems/basic-calculator-ii/)                                                                                           | —          | Stack with operator precedence     |
| 15  | Edit Distance                                                                                                                                                       | —          | Classic 2D DP                      |

### Hard

| #   | Problem                                                                                   | Companies  | Key Insight                          |
| --- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------ |
| 16  | [Valid Number](https://leetcode.com/problems/valid-number/)                               | Walmart    | State machine / DFA                  |
| 17  | [Integer to English Words](https://leetcode.com/problems/integer-to-english-words/)       | —          | Divide by 1000 + lookup              |
| 18  | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/)       | Salesforce | Variable window + freq matching      |
| 19  | [Text Justification](https://leetcode.com/problems/text-justification/)                   | —          | Simulation: pack + distribute spaces |
| 20  | [Boyer-Moore](https://www.geeksforgeeks.org/boyer-moore-algorithm-for-pattern-searching/) | Walmart    | Bad character + good suffix          |
| 21  | [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/)             | —          | DP: count ways to form t from s      |

### Trie Problems

| #   | Problem                                                                                              | Companies | Key Insight                    |
| --- | ---------------------------------------------------------------------------------------------------- | --------- | ------------------------------ |
| 22  | [Design Add/Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | —         | Trie + DFS for '.' wildcard    |
| 23  | [Word Break (Trie)](https://www.geeksforgeeks.org/word-break-problem-trie-solution/)                 | Amazon    | Trie lookup + DP               |
| 24  | [Trie Insert/Search](https://www.geeksforgeeks.org/trie-insert-and-search/)                          | Amazon    | Basic trie implementation      |
| 25  | [K Anagrams](https://practice.geeksforgeeks.org/problems/k-anagrams-1/0)                             | Amazon    | Freq diff ≤ k                  |
| 26  | [Palindrome Pairs](https://leetcode.com/problems/palindrome-pairs/)                                  | Amazon    | Trie + palindrome suffix check |
| 27  | [Phone Directory](https://practice.geeksforgeeks.org/problems/phone-directory/0)                     | —         | Trie prefix traversal          |

---

## 🔥 STRING TRICKS CHEAT SHEET

| Trick                | Code                             | When                       |
| -------------------- | -------------------------------- | -------------------------- |
| Char frequency array | `int[26]` or `int[128]`          | Faster than HashMap        |
| StringBuilder        | `sb.append(c)`                   | Build strings (immutable!) |
| String → char[]      | `s.toCharArray()`                | In-place manipulation      |
| Sort string          | `new String(Arrays.sort(arr))`   | Anagram grouping           |
| Char math            | `c - 'a'` gives 0-25             | Array index                |
| Reverse string       | `new StringBuilder(s).reverse()` | Quick reverse              |
| Rolling hash         | `hash = hash * base + c`         | Pattern matching O(1)      |

---

📖 **Related Chapters:**

- [03_Algorithms/13_String_Algorithms_Complete.md](../03_Algorithms/13_String_Algorithms_Complete.md) — String algorithms
- [03_Algorithms/06d_String_Algorithms.md](../03_Algorithms/06d_String_Algorithms.md) — Advanced string algos

---

[← 17 Backtracking+Pruning](17_Backtracking_Plus_Pruning.md) | [19 Matrix+Grid →](19_Matrix_Plus_Grid_Traversal.md)

---

**Navigation**: [< Previous](17_Backtracking_Plus_Pruning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](19_Matrix_Plus_Grid_Traversal.md)
