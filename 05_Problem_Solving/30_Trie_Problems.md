# Trie Problems

> **Navigation**: [← Trees](09_Trees.md) | [Chapter index](00_INDEX.md) | [Graphs →](10_Graphs.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Trie pattern](../04_Patterns_Templates/29_Trie_Pattern.md), [Strings](03_Strings.md), [Trees](09_Trees.md) |
| **You will learn** | Prefix replacement, building words one letter at a time, maximum XOR with a bitwise trie, ranked autocomplete and word-break counting |
| **Leads to** | [Bit Manipulation](18_BitManipulation.md), [Dynamic Programming](11_Dynamic_Programming.md) |
| **Abstraction level** | A list of strings → **a tree of shared prefixes** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Trie Problems

### 1. The bottom line

A trie turns "does anything start with this?" into a walk whose length is the length of the query, not the size of the dictionary.

### 2. The textbook core

- Each node is a prefix; children are indexed by the next character.
- An end flag marks complete words; a pass count gives prefix frequencies.
- Insert, search and prefix check cost `O(length)`.
- A binary trie (0/1 children) finds the partner that maximises XOR.
- Dictionary-based DP (word break) is often simpler with a hash set of words.

### 3. The real-world analogy

A **dictionary thumb index**.

### 4. Walkthrough

1. Insert `cat`, `bat`, `rat` as roots.
2. For the word `cattle`, walk `c → a → t`: the end flag at `t` is set.
3. Replace `cattle` by `cat`.
4. Words with no matching root stay unchanged.

> [!NOTE]
> **Quick check:** Why can a trie beat a hash set for prefix queries? *It follows `L` links; a hash set cannot enumerate by prefix.*


### 5. Check yourself

**Q1.** Replace words with roots `[a, b]` in `"apple banana"`.

<details><summary>Answer</summary>

`"a b"`.

</details>

**Q2.** Maximum XOR pair in `[8,10,2]`?

<details><summary>Answer</summary>

**10** (`8 XOR 2`).

</details>

---

## 🗺️ Pattern Recognition Header

| Signal in the problem | Technique |
| --- | --- |
| "replace words with their shortest root" | Trie of roots |
| "build the word one character at a time" | Trie + DFS through end nodes |
| "maximum XOR of two numbers" | Bitwise trie |
| "top suggestions for a prefix" | Trie or sorted filter + ranking |
| "how many ways to split a string into dictionary words" | DP with a word set |

> [!TIP]
> For small dictionaries a sorted list plus binary search or a hash set is simpler; reach for a trie when prefix operations dominate.

---

## The Shared Tool

```java
static class Trie {
    Trie[] nx = new Trie[26];
    boolean end;
    int pass;
    String word;
    void insert(String w) {
        Trie t = this;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (t.nx[i] == null) t.nx[i] = new Trie();
            t = t.nx[i];
            t.pass++;
        }
        t.end = true;
        t.word = w;
    }
    Trie walk(String s) {
        Trie t = this;
        for (char c : s.toCharArray()) {
            t = t.nx[c - 'a'];
            if (t == null) return null;
        }
        return t;
    }
}
```

## Problem 1 — Replace Words

**Task.** Given root words and a sentence, replace each word by its shortest root prefix if one exists.

**Brute force.** For each word test every root with `startsWith`: `O(words · roots · L)`.

**Better idea.** Insert roots into a trie; for each word walk until an end flag is found.

```java
static String replaceWords(List<String> roots, String sentence) {
    Trie t = new Trie();
    for (String r : roots) t.insert(r);
    StringBuilder sb = new StringBuilder();
    for (String w : sentence.split(" ")) {
        Trie cur = t;
        String rep = w;
        for (int i = 0; i < w.length(); i++) {
            cur = cur.nx[w.charAt(i) - 'a'];
            if (cur == null) break;
            if (cur.end) {
                rep = w.substring(0, i + 1);
                break;
            }
        }
        if (sb.length() > 0) sb.append(' ');
        sb.append(rep);
    }
    return sb.toString();
}
```

**Example.** Roots `[cat, bat, rat]`, sentence `"the cattle was rattled by the battery"` → `"the cat was rat by the bat"`.

**Complexity.** `O(total characters)`.


## Problem 2 — Longest Word Built One Letter at a Time

**Task.** Find the longest word in a list such that every prefix of it is also in the list (ties → smallest lexicographically).

**Brute force.** For each word check each prefix in a set: `O(Σ L²)`.

**Better idea.** Insert all words; DFS only through nodes whose end flag is set, tracking the best word.

```java
static String longestWord(String[] words) {
    Trie t = new Trie();
    for (String w : words) t.insert(w);
    String[] best = {""};
    dfsLongest(t, best, true);
    return best[0];
}

static void dfsLongest(Trie t, String[] best, boolean root) {
    for (int i = 0; i < 26; i++) {
        Trie c = t.nx[i];
        if (c != null && c.end) {
            String w = c.word;
            if (w.length() > best[0].length() || (w.length() == best[0].length() && w.compareTo(best[0]) < 0)) best[0] = w;
            dfsLongest(c, best, false);
        }
    }
}
```

**Example.** `["w","wo","wor","worl","world"]` → `"world"`; `["a","banana","app","appl","ap","apply","apple"]` → `"apple"`.

**Complexity.** `O(total characters)`.


## Problem 3 — Maximum XOR of Two Numbers

**Task.** Find the maximum `a XOR b` over all pairs in an array.

**Brute force.** All pairs: `O(n²)`.

**Better idea.** Insert every number bit by bit (most significant first) into a binary trie; for each number greedily walk to the opposite bit when possible.

```java
static int maxXor(int[] nums) {
    int[][] ch = new int[nums.length * 32 + 2][2];
    int cnt = 1;
    int best = 0;
    for (int x : nums) {
        int node = 0;
        for (int b = 30; b >= 0; b--) {
            int bit = x >> b & 1;
            if (ch[node][bit] == 0) ch[node][bit] = cnt++;
            node = ch[node][bit];
        }
    }
    for (int x : nums) {
        int node = 0, v = 0;
        for (int b = 30; b >= 0; b--) {
            int bit = x >> b & 1;
            int want = bit ^ 1;
            if (ch[node][want] != 0) {
                v |= 1 << b;
                node = ch[node][want];
            } else node = ch[node][bit];
        }
        best = Math.max(best, v);
    }
    return best;
}
```

**Example.** `[3,10,5,25,2,8]` → `28` (`5 XOR 25`).

**Complexity.** `O(31 n)`.


## Problem 4 — Autocomplete Ranking

**Task.** Given past sentences with counts, return the top `k` sentences starting with a prefix, ordered by count (ties alphabetical).

**Brute force.** Scan and sort all sentences per query.

**Better idea.** A trie lets you reach all sentences under the prefix directly; here a filter plus a ranking sort shows the ordering rule.

```java
static List<String> autocomplete(String[] sentences, int[] times, String prefix, int k) {
// top-k by (-count, lexicographic)
    Map<String, Integer> cnt = new HashMap<>();
    for (int i = 0; i < sentences.length; i++) cnt.merge(sentences[i], times[i], Integer::sum);
    List<String> cands = new ArrayList<>();
    for (String s : cnt.keySet()) if (s.startsWith(prefix)) cands.add(s);
    cands.sort((a, b) -> cnt.get(a) != cnt.get(b).intValue() ? Integer.compare(cnt.get(b), cnt.get(a)) : a.compareTo(b));
    return cands.subList(0, Math.min(k, cands.size()));
}
```

**Example.** Sentences `["i love you","island","iroman","i love leetcode"]` with counts `[5,3,2,2]`, prefix `"i"`, `k = 3` → `[i love you, island, i love leetcode]`.

**Complexity.** `O(m log m)` for `m` matches in this version.


## Problem 5 — Word Break — Count the Segmentations

**Task.** Count the ways to split a string into dictionary words.

**Brute force.** Try every split recursively: exponential.

**Better idea.** `dp[i]` = number of ways to build the first `i` characters from earlier `dp[j]` when `s[j..i)` is a word.

```java
static int wordBreakCount(String s, Set<String> dict) {
    int n = s.length();
    int[] dp = new int[n + 1];
    dp[0] = 1;
    for (int i = 1; i <= n; i++) for (int j = 0; j < i; j++) if (dp[j] > 0 && dict.contains(s.substring(j, i))) dp[i] += dp[j];
    return dp[n];
}
```

**Example.** `"ab"` with dictionary `{a,b,ab,ba,aab}` → `2` (`a|b` and `ab`).

**Complexity.** `O(n²)` substring checks.

---

## 🏢 Enterprise Lens — Trie Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Autocomplete, spell checkers, IP routing tables, URL routers |
| **Failure modes** | Treating a prefix as a word (missing end flag); memory growth with 26-slot arrays; Unicode |
| **Testing and verification** | Compare with string operations (`startsWith`, loops) and with an all-pairs XOR brute force on random inputs (1 500 cases here) |

---

## Reality Check

> [!CAUTION]
> "Autocomplete is just a trie." Production systems rank by frequency and recency, cache hot prefixes and limit memory with compressed tries.

---

[← Topological Sort Problems](29_Topological_Sort_Problems.md) | [Index](00_INDEX.md) | [Shortest Path Problems →](31_Shortest_Path_Problems.md)
