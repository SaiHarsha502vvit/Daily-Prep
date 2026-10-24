**Navigation**: [< Previous](12_Greedy_Algorithms_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Union_Find_DSU_Complete.md)
🧠 **Mental Model**: See [Array & String Thinking](../14_Mental_Models/04_Array_String_Thinking.md) — pointer patterns and string manipulation mental models

# 🔤 String Algorithms Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Arrays & hashing](08b_NumberTheory_Advanced.md), [Prefix sums](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) |
| **You will learn** | KMP, Z-function, Rabin–Karp, Manacher, tries, suffix array/automaton, hashing, Aho–Corasick |
| **Leads to** | [Bitwise trie](18_Bitwise_Trie_Java_Complete.md), [Advanced patterns](06d_String_Algorithms.md) |
| **Abstraction level** | L5: text as a data structure |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — String Algorithms

### 1. The bottom line

String algorithms avoid re-comparing characters by remembering what has already matched.

### 2. The textbook core

- **KMP:** failure function lets you skip ahead; O(n + m).
- **Z-function** and **Rabin–Karp** (rolling hash) match in linear expected time.
- **Manacher:** longest palindromic substring in O(n).
- Suffix arrays/automata answer many substring queries after preprocessing.

### 3. The real-world analogy

Looking for a word in a book: after a partial match fails, you do not go back to the start of the word if you already know what the letters you matched look like.

### 4. Walkthrough

1. Pattern `ABAB` has failure array `[0, 0, 1, 2]`.
2. Text `ABABABC`, mismatch at index 4 with pattern position 4.
3. Fall back to `fail[3] = 2` instead of 0.
4. Continue comparing without re-reading the text.

> [!NOTE]
> **Quick check:** What does the failure function store? *The length of the longest proper prefix that is also a suffix.*

---


KMP, Rabin-Karp, Z-Algorithm & Pattern Matching Mastery

## Table of Contents

1. [Why String Algorithms?](#why-string-algorithms)
2. [Naive Pattern Matching](13_String_Algorithms_Complete/01_why_string_algorithms.md#naive-matching)
3. [KMP Algorithm](13_String_Algorithms_Complete/01_why_string_algorithms.md#kmp-algorithm)
4. [Z-Algorithm](13_String_Algorithms_Complete/02_z_algorithm.md#z-algorithm)
5. [Rabin-Karp (Rolling Hash)](13_String_Algorithms_Complete/03_rabin_karp_rolling_hash.md#rabin-karp)
6. [Manacher's Algorithm](13_String_Algorithms_Complete/03_rabin_karp_rolling_hash.md#manachers)
7. [Trie Data Structure](13_String_Algorithms_Complete/04_trie_data_structure.md#trie)
8. [Suffix Arrays](13_String_Algorithms_Complete/05_suffix_arrays.md#suffix-arrays)
9. [Interview Problems](13_String_Algorithms_Complete/06_interview_problems.md#interview-problems)
10. [Quick Reference](13_String_Algorithms_Complete/07_quick_reference.md#quick-reference)

---

### Historical Evolution

Efficient string pattern matching emerged as critical with the rise of large text corpora in the 1970s. Before efficient algorithms, **naive pattern matching** ($O(nm)$) was the only option — comparing every position of a text of length $n$ with a pattern of length $m$. **Knuth, Morris, and Pratt (1977)** published KMP in the SIAM Journal of Computing, introducing preprocessing of the pattern into a failure function (independently discovered by **J. H. Morris** for text editor applications) — KMP reduces worst-case to $O(n+m)$ by ensuring no text character is examined more than once. **Rabin and Karp (1987)** proposed rolling hash for pattern matching, enabling $O(n+m)$ average case with randomization that extends naturally to multi-pattern and 2D matching. **Z-Algorithm** is popularised by **Gusfield (1997)** — the Z-array captures the longest prefix match at each position in $O(n+m)$ without a DFA. **Manacher's algorithm (1975)** discovered the elegant center-radius trick for longest palindromic substring in a single pass. Modern practice (post-2010): suffix arrays (Manber-Myers 1990) power full-text indices in bioinformatics tools (BWA, Bowtie), Aho-Corasick (1975) is used in network intrusion detection (Snort), and the FM-index (Ferragina-Manzini 2000) underlies modern genomic search engines.

---

### Why String Algorithms?

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Why String Algorithms?](13_String_Algorithms_Complete/01_why_string_algorithms.md) | Why String Algorithms? · Naive Pattern Matching · KMP Algorithm | 345 |
| 2 | [Z-Algorithm](13_String_Algorithms_Complete/02_z_algorithm.md) | Z-Algorithm | 148 |
| 3 | [Rabin-Karp (Rolling Hash)](13_String_Algorithms_Complete/03_rabin_karp_rolling_hash.md) | Rabin-Karp (Rolling Hash) · Manacher's Algorithm | 262 |
| 4 | [Trie Data Structure](13_String_Algorithms_Complete/04_trie_data_structure.md) | Trie Data Structure | 121 |
| 5 | [Suffix Arrays](13_String_Algorithms_Complete/05_suffix_arrays.md) | Suffix Arrays | 125 |
| 6 | [Interview Problems](13_String_Algorithms_Complete/06_interview_problems.md) | Interview Problems | 185 |
| 7 | [Quick Reference](13_String_Algorithms_Complete/07_quick_reference.md) | Quick Reference · Reference Anchor · When It Breaks -- String Algorithms · Proof Corner: KMP O(n+m) Time | 206 |

## 🏢 Enterprise Lens — String Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Search engines, DNA matching, intrusion detection (Aho–Corasick), text editors, plagiarism detection |
| **Failure modes** | Hash collisions in Rabin–Karp; off-by-one in failure arrays; Unicode vs bytes |
| **Testing and verification** | Compare with `String.indexOf` on random small-alphabet strings |

---

## Reality Check

**"String comparison with == works in Java when strings have the same content"** → Only if BOTH strings are interned (string literals). String objects from user input, `new String(...)`, or `.substring()` are NOT automatically interned. Use `.equals()` for content comparison. This is covered in the Java chapter but kills string algorithm tests: `if (word == "hello")` silently fails at runtime.

**"KMP is just a smarter version of brute-force string search"** → Brute force: O(n*m). KMP (Knuth-Morris-Pratt): O(n+m). The key insight is the **failure function** (partial match table): when a mismatch occurs, don't restart from scratch — use previously matched characters to know the next safe alignment. The failure function is computed in O(m) and encodes the longest proper prefix that is also a suffix for each prefix of the pattern.

**"Trie and HashMap both solve prefix matching — they're equivalent"** → HashMap: `map.containsKey(prefix)` checks exact key existence, not prefixes. You'd need to check all stored strings against the prefix — O(total characters). Trie: navigate character-by-character, prefix search is O(len(prefix)). For autocomplete (all strings with given prefix), Trie naturally enumerates them; HashMap requires scanning all keys. Trie uses more memory but enables prefix operations that HashMap cannot.

**"Anagram check: sort both strings and compare"** → Correct, O(n log n). But O(n) is possible: frequency count array of size 26 (for lowercase ASCII). Increment for string1, decrement for string2, check all zeros. This pattern (character frequency array) solves many string problems: valid anagram, minimum window substring, group anagrams, permutation in string.

**"Rolling hash in Rabin-Karp is collision-free"** → Rolling hash can collide (two different substrings produce the same hash — false positive). Rabin-Karp must verify actual character equality on hash matches. With a single 32-bit hash and adversarial input, collisions are common. Production implementations use double hashing (two different mod values) to reduce false-positive probability to ~10^(-18).
