# Quick Reference <a name="quick-reference"></a>

> **Navigation**: [← Interview Problems](06_interview_problems.md) | [Chapter overview](../13_String_Algorithms_Complete.md)
> Page 7 of 7 in **String Algorithms Complete Guide**


## Algorithm Comparison

| Algorithm | Time | Space | Best For |
| --- | --- | --- | --- |
| Naive | O(n*m) | O(1) | Very short patterns |
| KMP | O(n+m) | O(m) | Single pattern, streaming |
| Z-Algorithm | O(n+m) | O(n+m) | Single pattern, intuitive |
| Rabin-Karp | O(n+m) avg | O(m) | Multiple patterns |
| Trie | O(m) query | O(total) | Prefix search, autocomplete |
| Suffix Array | O(n log n) | O(n) | All substring queries |
| Manacher | O(n) | O(n) | Palindrome problems |

## When to Use What

**ALGORITHM SELECTION GUIDE**

```text
"Find pattern in text"
  → KMP or Z-algorithm (single pattern)
  → Rabin-Karp (multiple patterns)

"Check if prefix exists" / "Autocomplete"
  → Trie

"Longest palindrome"
  → Manacher's (O(n))
  → DP with memo (O(n²) but simpler)

"Repeated substring" / "Count substrings"
  → Rolling hash + Binary search
  → Suffix array

"Is X a rotation of Y?"
  → KMP: search Y in X+X
```

## Common String Tricks

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

## Template: Building LPS Array

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

## Topical Breadth — String Matching Selection Trade-offs

The string matching algorithms in this chapter form a trade-off space along worst-case guarantee, preprocessing cost, and space. **KMP** pays O(m) preprocessing to build the longest-prefix-suffix (LPS) array, then searches in O(n+m) worst-case time with O(m) space — the trade-off is worth it when the pattern is reused (streaming, repeated searches) or when the text is adversarial (no pathological worst case). **Rabin-Karp** uses rolling hash for O(m) preprocessing and O(n+m) average search but degrades to O(nm) worst-case when hash collisions occur; this is the only algorithm where an adversarial input can trigger the worst case, so it requires verification on every match. **Z-Algorithm** achieves O(n+m) without the LPS complexity, but requires concatenating pattern + "$" + text (adding O(n+m) space) and is conceptually simpler — it is preferred when you also need period detection or longest-prefix-that-is-also-suffix properties. **Naive search** has O(1) preprocessing and O(1) space but O(nm) worst-case; in practice, on short patterns (m < 10) or random English text, the inner loop exits early so naive often beats KMP because it avoids the O(m) preprocessing overhead entirely.

| Algorithm   | Preprocessing | Search (Worst) | Search (Average)                      | Space  | Best For                                      |
| ----------- | ------------- | -------------- | ------------------------------------- | ------ | --------------------------------------------- |
| Naive       | O(1)          | O(nm)          | O(nm) / often O(n) for short patterns | O(1)   | Short patterns, random text, one-off searches |
| KMP         | O(m)          | O(n+m)         | O(n+m)                                | O(m)   | Repeated pattern, streaming, adversarial text |
| Rabin-Karp  | O(m)          | O(nm)          | O(n+m)                                | O(m)   | Multiple patterns, 2D matching, randomized    |
| Z-Algorithm | O(m)          | O(n+m)         | O(n+m)                                | O(n+m) | When Z-array needed for other purposes        |

Select **KMP** when you need a guaranteed O(n+m) bound and the pattern is known upfront. Select **Rabin-Karp** when searching multiple patterns against the same text (precompute text hash once). Select **Z-Algorithm** when you also need period detection or prefix-suffix properties. Default to **KMP** for single-pattern interviews unless the problem hints at hashing.

Summary

**STRING ALGORITHMS - MASTER THESE**

```text
1. KMP - Pattern matching in O(n+m)
   Key: LPS array, never recheck matched characters

2. RABIN-KARP - Rolling hash for multiple patterns
   Key: Hash comparison, verify on match

3. Z-ALGORITHM - Alternative to KMP, more intuitive
   Key: Z[i] = prefix match length at position i

4. TRIE - Prefix search & autocomplete
   Key: Tree of characters, end-of-word markers

Interview Tip: KMP is asked most often.
Know how to build LPS and explain the skip logic.
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

---

[← Interview Problems](06_interview_problems.md) | [Chapter overview](../13_String_Algorithms_Complete.md)
