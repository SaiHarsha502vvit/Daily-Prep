# 🧩 String + Advanced — Pattern Guide

> **Navigation**: [← Backtracking + Pruning](17_Backtracking_Plus_Pruning.md) | [Chapter index](00_INDEX.md) | [Matrix + Grid Traversal →](19_Matrix_Plus_Grid_Traversal.md)

## String + Advanced Tricks — Combined Pattern Guide

**WHY this combination?** Strings combine array access, hashing, sliding window, DP, and specialized algorithms (KMP, Rabin-Karp). Most "string" problems are actually pattern problems in disguise.

### ⚠️ Constraint Lens

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Strings](../02_Data_Structures/01b_Arrays.md), [Hash Maps](10_HashMap_Plus_Counting.md), [String Algorithms](../03_Algorithms/13_String_Algorithms_Complete.md) |
| **You will learn** | Anagram keys, palindromes by expanding around the centre, tries, Rabin–Karp and Z-algorithm |
| **Leads to** | [Tries](29_Trie_Pattern.md), [Dynamic Programming](16_DP_Pattern_Recognition.md) |
| **Abstraction level** | Character loops → **canonical forms and prefix structures** → linear-time matching |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — String + Advanced

### 1. The bottom line

String problems become easy when you choose a canonical representation (sorted letters, counts, hashes, prefixes).

### 2. The textbook core

- Anagram key: sorted string or 26-count signature.
- Palindrome: expand from each centre (`2n − 1` centres) → `O(n²)`; Manacher gives `O(n)`.
- Trie: shared prefixes in a tree.
- Rolling hash/Z-array: pattern matching in linear expected/worst time.

### 3. The real-world analogy

A **library catalogue**: books are filed by a canonical key so equivalent ones land on the same shelf.

### 4. Walkthrough

1. Group anagrams: `eat, tea, tan, ate, nat, bat`.
2. Key = sorted letters: `aet`, `aet`, `ant`, `aet`, `ant`, `abt`.
3. Map key → list.
4. Groups: `{eat,tea,ate}`, `{tan,nat}`, `{bat}`.

> [!NOTE]
> **Quick check:** Why is expanding around the centre `O(n²)`, not `O(n³)`? *Each expansion step is `O(1)`; there are `O(n)` centres and `O(n)` steps.*


### 5. Check yourself

**Q1.** What canonical key groups `eat`, `tea` and `ate` as anagrams?

<details><summary>Answer</summary>

The sorted letters `"aet"` (or a 26-count signature).

</details>

**Q2.** Longest palindromic substring of `"babad"`?

<details><summary>Answer</summary>

`"bab"` or `"aba"` (length 3).

</details>

**Q3.** How many centres does expand-around-centre try for length `n`?

<details><summary>Answer</summary>

`2n − 1` (n single-character centres and n−1 between-character centres).

</details>

---

## Historical Evolution

**Inventor / Originator:** Key string-matching papers: Morris–Pratt (1970 report) and Knuth–Morris–Pratt (published 1977), Boyer–Moore (1977), Aho–Corasick (1975), Karp–Rabin (1981 report; published 1987). Tries were described by de la Briandais (1959) and named by Edward Fredkin (1960).

**Predecessor context:** Naive matching compared the pattern at every text position, `O(n·m)` in the worst case.

**Evolution narrative:** KMP precomputes a failure function so the text pointer never moves back; Boyer–Moore skips ahead using right-to-left comparison; Rabin–Karp compares rolling hashes; Aho–Corasick matches many patterns in one pass. Suffix trees (Weiner 1973) and suffix arrays (Manber–Myers 1990) support substring queries on a fixed text.

**Modern practice:** Editors and `grep`, intrusion detection (Aho–Corasick), plagiarism detection (rolling hashes), autocomplete (tries). Bioinformatics tools such as BLAST (1990) use seed-and-extend heuristics rather than exact KMP-style matching.

- **de la Briandais — 1959 / Fredkin — 1960**: Tries (the name comes from *retrieval*)
- **Weiner — 1973**: Suffix trees
- **Aho & Corasick — 1975**: Multi-pattern matching automaton
- **Knuth, Morris, Pratt — 1977**: Linear-time single-pattern matching
- **Boyer & Moore — 1977**: Sub-linear average-case matching
- **Karp & Rabin — 1981/1987**: Randomised rolling-hash matching

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

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

## 🧠 Deep Intuition — Strings Are Disguised Pattern Problems

Most string problems aren't really "string" problems — they're array, hash, or DP problems wearing a string costume. The key is to **identify the underlying pattern**:

- "Find all anagrams in a string" → This is a **sliding window** problem with a frequency map
- "Edit distance" → This is a **2D DP** problem (same as LCS family)
- "Valid parentheses" → This is a **stack** problem
- "Longest palindromic substring" → **Two pointers** (expand from center) or **DP**

The string-specific part is usually just the data representation, not the algorithm.

### Why String Immutability Matters in Java

In Java, strings are immutable — every concatenation creates a new String object. `s += c` inside a loop creates O(n) new strings of increasing size, resulting in **O(n²) total time** for what looks like an O(n) loop. Always use `StringBuilder` for building strings incrementally — it uses an internal array and amortizes to O(n) total time.

### The `int[26]` Trick — Why It's Faster Than HashMap

For problems involving only lowercase letters, `int[26]` (indexed by `c - 'a'`) is strictly better than `HashMap<Character, Integer>`:

- **Array access is O(1)** with no hash computation, no collision handling, no boxing/unboxing
- **Comparison of two frequency arrays** is O(26) = O(1), while comparing two HashMaps is O(n) with higher constant factors
- **Memory**: 26 ints = 104 bytes vs HashMap's ~1000+ bytes for the same data

Use `int[128]` when the problem involves ASCII characters (uppercase, digits, etc.), and HashMap only when the character set is unbounded (Unicode).

---

## 🧠 PATTERN DECODER FOR STRING PROBLEMS

```text
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

## 🔬 FULL WALKTHROUGH: Group Anagrams

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

## 📋 Practice Problems

> [!NOTE]
> The *Companies* column lists employers that candidates have reported asking the problem. These tags are community-reported, change over time and are **not verified** — use them as hints about relevance, not as facts.

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



---

## 🏢 Enterprise Lens — String + Advanced

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Search boxes, spell checkers, log parsing, bioinformatics, plagiarism detection |
| **Failure modes** | Unicode surprises (code points vs chars); building strings in a loop with `+=`; hash collisions in rolling hashes |
| **Testing and verification** | Compare to naive matching on random strings with small alphabets (many collisions) |

---

## Reality Check

**"String problems are array problems with characters"** → Three properties change the game: immutability in Java/Python makes naive concatenation-in-loop quadratic (the builder pattern is mandatory, not stylistic); canonical forms (sorted chars, count signatures) unlock hashing equivalences arrays rarely need; and the alphabet bound (26/128) converts HashMaps into arrays and makes O(26·n) algorithms effectively linear. Solutions that ignore all three work — slowly, and interviewers notice.

**"Palindrome problems all use expand-from-center"** → Expand-from-center answers longest-substring palindromes in O(n squared); the FAMILY is wider: two-pointer validity checks (O(n)), palindrome PARTITIONING is backtracking with a precomputed isPal table, count-distinct-palindromic-subsequences is interval DP, and the subSEQUENCE variants (LPS) are LCS-with-reverse in disguise. The route into the right tool is one distinction: substring (contiguous — centers/DP over positions) versus subsequence (gaps allowed — DP over intervals).

**"Anagram equality means sorting both strings"** → Sorting is the O(n log n) canonical form; the count-signature (26-int array compared or stringified) is the O(n) one, and it composes into sliding windows (find-all-anagrams) where re-sorting every window would be O(n·k log k). Choosing the signature over the sort is the difference between the pattern and the workaround — and it generalizes: canonical-form choice IS the algorithm in most grouping problems.

**"Repeated-substring problems need suffix machinery"** → Before suffix arrays, three cheaper tools cover the interview range: the doubled-string trick (rotation checking via s+s contains t), the failure function from KMP repurposed for shortest-repeating-unit, and rolling-hash windows for fixed-length repeats. Suffix structures earn their complexity at "all distinct substrings" scale — reaching for them at "does the string repeat" scale is the overengineering tell.

**"substring() is free"** → Post-Java-7 substring COPIES (O(length)) — the old shared-backing-array behavior was removed to fix memory leaks, and code written against the old model (substring inside a loop as a cheap view) silently became quadratic. Language-specific but the lesson is portable: know whether your language's slice is a view (Go, Python memoryview) or a copy (Java, Python str), because the pattern's complexity analysis depends on it.
