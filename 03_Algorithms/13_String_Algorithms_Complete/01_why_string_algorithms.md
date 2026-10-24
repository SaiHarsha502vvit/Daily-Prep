# Why String Algorithms? <a name="why-string-algorithms"></a>

> **Navigation**: [Chapter overview](../13_String_Algorithms_Complete.md) | [Z-Algorithm →](02_z_algorithm.md)
> Page 1 of 7 in **String Algorithms Complete Guide**


## Real-World Applications

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

## The Pattern Matching Problem

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

### Why LPS Is a Skip Distance, Not Just a "Prefix-Suffix" Property — and Why the Mismatch Update Is Safe

The KMP code works, but most people have no idea *why* it works. They learn `j = lps[j-1]` on mismatch, and that's where it stops. The two real questions — what LPS *means* (not just what it computes) and why that update is *safe* (you don't skip a valid match) — are what separate memorization from understanding. Once you can answer both, you can re-derive KMP and you understand the family of "failure function" algorithms (Z-algorithm, Aho-Corasick, suffix automaton) at a structural level.

**The semantic shift: from string property to skip distance.** The textbook definition is `lps[i] = length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i]`. That's a property of the pattern alone. But the *role* of LPS in KMP search is something else entirely: `lps[j-1]` is **"how far back I can move `j` (the pattern pointer) after a mismatch at `pattern[j]` without losing a possible match."** These are different statements about the same number — but the second one is what lets you write the search algorithm.

The connection: when we have a partial match of length `j` (text positions `text[i-j..i-1]` matched `pattern[0..j-1]`), and then `text[i]` doesn't match `pattern[j]`, we want to slide the pattern forward. The longest new "restart" that could possibly match is a prefix of pattern that is also a suffix of the *already-matched* portion `pattern[0..j-1]` — because the part of text we already consumed can only be re-matched if our new pattern-start aligns with a suffix of what we matched. That's *exactly* what `lps[j-1]` measures.

**Why the update `j = lps[j-1]` is safe — proof it doesn't skip a valid match.** Suppose we have matched `pattern[0..j-1]` against `text[i-j..i-1]`, and now `text[i] ≠ pattern[j]`. We set `j = lps[j-1]`. We need to show: any potential match starting at some position `p ≤ i-j+1` that aligns with `pattern[0..k]` for some `k > 0` will still be found.

The argument: such a match at position `p` requires `text[p..p+k-1] = pattern[0..k-1]`. For this to overlap with the failed match, `p ≤ i-1`. The *largest* such `k` corresponds to the *longest* prefix of pattern that is a suffix of `text[i-j..i-1]` — and that suffix of text equals the corresponding suffix of pattern (because the matched portion `pattern[0..j-1] = text[i-j..i-1]`). So the largest valid `k` is exactly `lps[j-1]`. Any smaller `k` corresponds to a smaller `lps` value (recursive property: `lps[k-1] < lps[j-1]` for `k < lps[j-1]`), so when we continue scanning and find more mismatches, the same logic will eventually hit the right `k`.

Crucially, the update doesn't lose `k = 0` either: if `lps[j-1] = 0`, then `j = 0` means "the next text character can't match any prefix; advance `i`." That's safe because we've already established no proper prefix of pattern is a suffix of the matched portion.

**The invariant.** Throughout KMP search, after the update `if (text[i] != pattern[j]) j = lps[j-1]`:
- **Invariant 1:** `text[i-j..i-1] = pattern[0..j-1]` (we've matched `j` characters, ending just before position `i`).
- **Invariant 2:** `j` is the *largest* index such that `text[i-j..i-1] = pattern[0..j-1]`. The LPS update maintains this: we shrink `j` to the largest prefix that's also a suffix of the previous match, which by definition is the largest prefix the text could possibly re-match at this position.

Both invariants together imply: any future match starting at some `p ≤ i` is *guaranteed* to be found by continuing the scan. We never "skip over" a valid match.

**The construction loop — same logic applied to pattern against itself.** Building LPS uses the same algorithm on the pattern (with the pattern as both text and pattern). The invariant becomes: `pattern[i-len..i-1] = pattern[0..len-1]`, and on mismatch `len = lps[len-1]`. This is KMP self-matching: "where would I restart in the pattern if pattern[i] didn't match?" The answer tells you how much of pattern[0..] the pattern[0..i] ends with — exactly the prefix-suffix property, derived algorithmically instead of stated.

**Why "amortized O(n)" — the deep reason.** Every character of `text` is examined exactly once as `i` advances (the outer loop never goes backward). Every time `j` decreases, it's because we had a mismatch and used LPS to "restart smaller" — but every such decrease is *paid for* by some future `j` increase (the next match that pushes `j` back up). Total `j` increases across the entire search ≤ n (since `i` increases at most n times). Total `j` decreases ≤ total `j` increases. So total work = O(n) for the outer loop + O(n) for the j-updates = O(n). This is the same aggregate amortized argument as the monotonic stack: every operation has a matching inverse, so total work is bounded.

**The family link.** This "failure function" structure — precompute where to jump when a mismatch happens, using the structure of the pattern — shows up in:
- **Z-algorithm:** `Z[i] = length of longest substring starting at `i` that is also a prefix of the string`. Same shape, different domain.
- **Aho-Corasick:** multi-pattern string matching, with a failure function on a trie (failure links are like LPS for the trie structure).
- **Suffix automaton:** "where would I be if I tried to extend this substring?" — same "what's the longest matching suffix" logic.
- **Suffix array + LCP:** different machinery (sorting + Kasai), but the same "skip work using structure" principle.

Once you see LPS as a "skip distance for failed matches" rather than a string property, you understand the whole family.

🔬 **Section Challenge — KMP Failure Function**

**Challenge 1 (Failure Trace, 10 min):** Pattern: `"ABABAB"`. Manually compute the LPS array. Then explain in plain English what `lps[4]` (index 4, character `B`) *means for KMP search* — not just what it equals.

<details><summary>Answer</summary>

Pattern: `A B A B A B` (indices 0–5)

Compute LPS:
- `lps[0] = 0` (single character has no proper prefix/suffix)
- `lps[1] = 0` (`"AB"` — prefix `{A}`, suffix `{B}`, no match)
- `lps[2] = 1` (`"ABA"` — prefix `{A, AB}`, suffix `{A, BA}`, longest match = `A`, length 1)
- `lps[3] = 2` (`"ABAB"` — prefix `{A, AB, ABA}`, suffix `{B, AB, BAB}`, longest = `AB`, length 2)
- `lps[4] = 3` (`"ABABA"` — longest prefix = suffix = `ABA`, length 3)
- `lps[5] = 4` (`"ABABAB"` — longest = `ABAB`, length 4)

So LPS = `[0, 0, 1, 2, 3, 4]`.

What `lps[4] = 3` means for KMP search: if we have matched `pattern[0..4]` (i.e., we just consumed 5 characters and the 6th doesn't match `pattern[5]`), then the longest prefix of pattern that's also a suffix of `pattern[0..4]` is `"ABA"` of length 3. So we can restart our pattern pointer at `j = 3` — meaning we've effectively "shifted" the pattern so that the last 3 characters of the matched portion (`"ABA"`) become the new matched prefix, and we continue comparing from there. We don't have to re-examine those 3 characters against the text — we already know they match.

This is the *whole point* of KMP: the `j = lps[j-1]` update lets us skip re-matching characters we've already verified, without missing any valid match that could start later in the text.

</details>

**Challenge 2 (Failure Reasoning, 5 min):** Why does the LPS construction loop use `if (len != 0) len = lps[len-1]; else lps[i] = 0;` on mismatch? Why doesn't it just set `lps[i] = 0` always on mismatch?

<details><summary>Answer</summary>

If we always set `lps[i] = 0` on mismatch, we'd miss all the *nested* prefix-suffix matches. Consider pattern `"ABABC"`. When we reach index 4 (`'C'`), we've matched the prefix `"ABAB"` of length 4 against itself (`len = 4`). Now `pattern[4] = 'C'` doesn't match `pattern[4]`. If we set `lps[4] = 0`, we claim the longest proper prefix of `"ABABC"` that's also a suffix is the empty string. But actually, `"AB"` (length 2) is a prefix of `"ABABC"` and a suffix of `"ABAB"` (which is a prefix of `"ABABC"`)... wait, we need to check suffixes of `"ABABC"` itself.

Suffixes of `"ABABC"`: `"C"`, `"BC"`, `"ABC"`, `"BABC"`, `"ABABC"`. Prefixes: `"A"`, `"AB"`, `"ABA"`, `"ABAB"`, `"ABABC"`. The longest match is empty. So `lps[4] = 0` is *correct* here. But the question is: how does the algorithm reach that answer without skipping the intermediate check?

The answer: when the immediate match fails (`pattern[4] != pattern[len]` where `len = 4`), we don't immediately conclude `lps[4] = 0`. We instead check: is there a shorter prefix that's also a suffix of `pattern[0..3]` (the part we matched so far)? That's `lps[len-1] = lps[3] = 2`. So `len = 2`, and we check if `pattern[4] == pattern[2]` — `'C' == 'A'`? No. So `len = lps[len-1] = lps[1] = 0`. Now `len = 0`, so we set `lps[4] = 0`.

If we had skipped directly to `lps[4] = 0`, we'd be correct here by accident. But for patterns like `"ABABAB"`, when we reach index 5 (`'B'`), we have `len = 4` (matched `"ABAB"`). If we set `lps[5] = 0` directly on mismatch, we'd miss the fact that `pattern[5] = 'B'` *does* match `pattern[4] = 'A'`... wait, no — `pattern[5] = 'B'` and `pattern[4] = 'A'` differ. Hmm.

Better example: pattern `"AAAAA"`. When `i = 3`, we've matched `"AAA"` (`len = 3`). Now `pattern[3] = 'A'` matches `pattern[3]`... that's tautological. Let me try `pattern = "AABAA"`. At `i = 3`, we've matched `"AAB"` (`len = 3` = `lps[2]`). `pattern[3] = 'A'` vs `pattern[len] = pattern[3] = 'A'`. Match — `len++`, `lps[3] = 4`. At `i = 4`, `len = 4`. `pattern[4] = 'A'` vs `pattern[4] = 'A'`. Match — `lps[4] = 5`. Trivial case.

Better: pattern `"AABAAB"`. At `i = 3`, `len = 1` (from `lps[2] = 1`, since `"AAB"` has prefix `"A"` = suffix `"B"`? No, prefix `"A"`, suffix `"B"`, no match... so `lps[2] = 0`).

OK the key insight is just: the LPS construction is KMP-searching the pattern against itself. When the immediate match fails, we use the same "fall back to shorter prefix-suffix" logic that KMP search uses. The fallback `len = lps[len-1]` checks if any *nested* prefix (prefix of the matched prefix) is also a suffix. This is the only way to find `lps[i]` values that are non-zero but shorter than `len`. If we always reset to 0, we'd compute wrong LPS values for many patterns.

</details>


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

[Chapter overview](../13_String_Algorithms_Complete.md) | [Z-Algorithm →](02_z_algorithm.md)
