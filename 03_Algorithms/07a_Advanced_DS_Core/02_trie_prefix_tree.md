# 🌳 Part 2: Trie (prefix Tree)

> **Navigation**: [← DEEP INTERNALS - HOW ADVANCED DATA…](01_deep_internals_how_advanced_data_structures.md) | [Chapter overview](../07a_Advanced_DS_Core.md) | [Segment Tree →](03_segment_tree.md)
> Page 2 of 3 in **Advanced Data Structures: Complete Guide**


## Concept and Structure

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     TRIE (PREFIX TREE) - COMPLETE UNDERSTANDING              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A TRIE?                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRIE = Tree for Retrieval (pronounced "try")                                │
│ A tree-like data structure where each path from root to a node represents   │
│ a PREFIX of strings stored in it. Each node represents ONE CHARACTER.       │
│                                                                             │
│ INVENTED: 1959 by René de la Briandais                                      │
│ REFINED: 1960 by Edward Fredkin (who named it "trie")                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES TRIE SOLVE?                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ PROBLEM 1: Fast prefix-based searching                                      │
│   - Given 1 million words, find all words starting with "pre"               │
│   - HashMap: Must check ALL 1 million keys → O(n × m)                       │
│   - Trie: Go to 'p'→'r'→'e', then collect all children → O(m + k)           │
│     where k = number of matches                                             │
│                                                                             │
│ PROBLEM 2: Autocomplete suggestions                                         │
│   - User types "app", show: "apple", "application", "approach"              │
│   - Database search is SLOW for this                                        │
│   - Trie: Navigate to "app" node, DFS to find all completions               │
│                                                                             │
│ PROBLEM 3: Spell checking                                                   │
│   - Is "acknowledgement" spelled correctly?                                 │
│   - Dictionary lookup in O(word_length) not O(dictionary_size)              │
│                                                                             │
│ PROBLEM 4: IP Routing (Longest Prefix Matching)                             │
│   - Router needs to find which interface to send packet                     │
│   - Match IP address against routing table prefixes                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHY USE TRIE OVER OTHER DATA STRUCTURES?                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ VS HASHMAP:                                                                 │
│ ┌──────────────────┬───────────────────┬──────────────────────────────────┐ │
│ │ Operation        │ HashMap           │ Trie                             │ │
│ ├──────────────────┼───────────────────┼──────────────────────────────────┤ │
│ │ Search exact     │ O(m) avg          │ O(m)                             │ │
│ │ Search prefix    │ O(n × m) 😢       │ O(prefix_len) 🎉                 │   │
│ │ Hash collisions  │ YES               │ NO                               │ │
│ │ Ordered results  │ NO                │ YES (lexicographic)              │ │
│ │ Space efficiency │ Better            │ Worse (but can compress)         │ │
│ └──────────────────┴───────────────────┴──────────────────────────────────┘ │
│                                                                             │
│ VS BINARY SEARCH TREE (BST):                                                │
│ - BST: O(m × log n) to search (compare strings at each node)                │
│ - Trie: O(m) regardless of how many strings stored                          │
│                                                                             │
│ THE KEY INSIGHT:                                                            │
│ Trie time complexity depends on WORD LENGTH, not NUMBER OF WORDS!           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE TRIE?                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE TRIE WHEN:                                                            │
│    • Need prefix-based operations (autocomplete, spell check)               │
│    • Need lexicographically sorted results                                  │
│    • Searching same prefixes repeatedly                                     │
│    • Building word games (Scrabble, Boggle)                                 │
│    • IP routing tables                                                      │
│    • Phone directory (search by prefix)                                     │
│                                                                             │
│ ❌ DON'T USE TRIE WHEN:                                                      │
│    • Only need exact match (HashMap is simpler)                             │
│    • Memory is very limited (Tries use more space)                          │
│    • Strings are very long with little common prefixes                      │
│    • Data changes frequently and memory matters                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES TRIE WORK? (VISUAL EXPLANATION)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Storing: ["cat", "car", "card", "care", "dog"]                              │
│                                                                             │
│             (root)                   STRUCTURE:                             │
│            /      \                  - Each node = one character            │
│          c          d                - Edge = transition to next char       │
│          |          |                - * = marks end of valid word          │
│          a          o                                                       │
│         /|\         |                MEMORY LAYOUT:                         │
│        t r e        g*               - Root has children[26] (for a-z)      │
│        * |*                          - Most children are null               │
│          d                           - Only used paths allocated            │
│          *                                                                  │
│                                                                             │
│ SEARCH "car":                        INSERT "cow":                          │
│ root→c→a→r (found, is end? YES ✓)   root→c→o(new)→w(new, mark end)          │
│                                                                             │
│ SEARCH "ca":                         PREFIX "car":                          │
│ root→c→a (found, is end? NO ✗)      root→c→a→r, then DFS: card, care        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & EDGE CASES                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. SPACE CONSUMPTION:                                                       │
│    - Each node has 26 pointers (for a-z) = 26 × 8 bytes = 208 bytes/node    │
│    - Solution: Use HashMap<Character, Node> instead of array                │
│    - Solution: Compressed Trie (merge single-child chains)                  │
│                                                                             │
│ 2. DELETION COMPLEXITY:                                                     │
│    - Can't just remove node; might break other words                        │
│    - "card" and "car": deleting "car" shouldn't delete 'c','a','r'          │
│    - Solution: Only unmark isEndOfWord if other words use same path         │
│                                                                             │
│ 3. UNICODE/SPECIAL CHARACTERS:                                              │
│    - 26-size array only works for lowercase English                         │
│    - Solution: Use HashMap<Character, Node> for flexibility                 │
│                                                                             │
│ 4. CASE SENSITIVITY:                                                        │
│    - "Cat" vs "cat" - are they same?                                        │
│    - Solution: Convert to lowercase before operations                       │
│                                                                             │
│ 5. EMPTY STRING:                                                            │
│    - Is "" a valid word? Handle root.isEndOfWord                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ OPERATION        │ TIME           │ SPACE           │ OUTPUT                │
│ ─────────────────┼────────────────┼─────────────────┼────────────────────── │
│ Insert(word)     │ O(m)           │ O(m) worst      │ void (modifies trie)  │
│ Search(word)     │ O(m)           │ O(1)            │ boolean (exists?)     │
│ StartsWith(pre)  │ O(p)           │ O(1)            │ boolean (prefix?)     │
│ Autocomplete     │ O(p + k)       │ O(k)            │ List<String> matches  │
│ Delete(word)     │ O(m)           │ O(m) stack      │ boolean (deleted?)    │
│                                                                             │
│ m = word length, p = prefix length, k = number of matches                   │
│                                                                             │
│ SPACE COMPLEXITY OF ENTIRE TRIE:                                            │
│ - Worst case: O(ALPHABET_SIZE × m × n) where n = number of words            │
│ - Best case: O(total characters) when words share prefixes                  │
│                                                                             │
│ EXAMPLE OUTPUT:                                                             │
│ trie.insert("apple");                                                       │
│ trie.search("apple");   → true                                              │
│ trie.search("app");     → false ("app" not marked as word)                  │
│ trie.startsWith("app"); → true  (prefix exists)                             │
│ trie.autocomplete("app"); → ["apple", "application", ...]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];  // For lowercase letters
    boolean isEndOfWord = false;
}

class Trie {
    private TrieNode root = new TrieNode();

    // INSERT: O(m)
    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isEndOfWord = true;
    }

    // SEARCH: O(m)
    public boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEndOfWord;
    }

    // PREFIX SEARCH: O(m)
    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }

    private TrieNode findNode(String str) {
        TrieNode node = root;
        for (char c : str.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                return null;
            }
            node = node.children[index];
        }
        return node;
    }

    // AUTOCOMPLETE: Get all words with given prefix
    public List<String> autocomplete(String prefix) {
        List<String> results = new ArrayList<>();
        TrieNode node = findNode(prefix);
        if (node != null) {
            dfs(node, new StringBuilder(prefix), results);
        }
        return results;
    }

    private void dfs(TrieNode node, StringBuilder path, List<String> results) {
        if (node.isEndOfWord) {
            results.add(path.toString());
        }
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) {
                path.append((char) ('a' + i));
                dfs(node.children[i], path, results);
                path.deleteCharAt(path.length() - 1);
            }
        }
    }
}

// VISUAL TRACE - INSERT "cat", "car", "card":
//
// After "cat":    After "car":    After "card":
//     (root)          (root)          (root)
//       |               |               |
//       c               c               c
//       |               |               |
//       a               a               a
//       |              / \             / \
//       t*            t*  r*          t*  r*
//                                         |
//                                         d*
```

## Advanced Trie Operations

```java
// DELETE from Trie
public boolean delete(String word) {
    return delete(root, word, 0);
}

private boolean delete(TrieNode node, String word, int depth) {
    if (depth == word.length()) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        return isEmpty(node);
    }

    int index = word.charAt(depth) - 'a';
    if (node.children[index] == null) return false;

    boolean shouldDelete = delete(node.children[index], word, depth + 1);

    if (shouldDelete) {
        node.children[index] = null;
        return !node.isEndOfWord && isEmpty(node);
    }
    return false;
}

private boolean isEmpty(TrieNode node) {
    for (TrieNode child : node.children) {
        if (child != null) return false;
    }
    return true;
}

// LONGEST COMMON PREFIX
public String longestCommonPrefix(String[] words) {
    if (words.length == 0) return "";

    // Insert all words
    for (String word : words) insert(word);

    // Traverse until branching
    StringBuilder prefix = new StringBuilder();
    TrieNode node = root;

    while (countChildren(node) == 1 && !node.isEndOfWord) {
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) {
                prefix.append((char) ('a' + i));
                node = node.children[i];
                break;
            }
        }
    }

    return prefix.toString();
}
```

🔬 **Section Challenge — Trie Architecture & GOOS Testing**

**Challenge 1 (Architectural Trade-offs):** You are building an autocomplete service for a 1-million word English vocabulary. A standard `TrieNode` uses an array `TrieNode[] children = new TrieNode[26]`. A memory-optimized version uses a `HashMap<Character, TrieNode>`. Explain the exact performance degradation you will face if you switch to `HashMap` to save memory, specifically referencing CPU cache lines and memory indirection.

<details><summary>Answer</summary>

**The Performance Hit (Cache Misses):**
An array of 26 pointers takes exactly `26 * 8 = 208 bytes`. This fits within just 4 CPU cache lines (64 bytes each). Accessing `children['c' - 'a']` is a single contiguous memory offset calculation (`O(1)` pointer math) that almost guarantees an L1/L2 cache hit.
Conversely, a `HashMap` node forces an additional object instantiation, hashing overhead, and most importantly: **Memory Indirection**. Looking up a character in the `HashMap` requires jumping to a non-contiguous memory address on the heap to fetch the bucket. Each jump is a guaranteed cache miss (~100x slower than a cache hit). Thus, while `HashMap` saves RAM in sparse nodes, it destroys CPU cache locality, drastically slowing down traversal speed.

</details>

**Challenge 2 (TDD Boundary - GOOS):** Following _Growing Object-Oriented Software (GOOS)_, you want to drive the implementation of this Autocomplete Trie using "Outside-In TDD". What is the "Walking Skeleton" boundary interface you would define, and how would you verify it using a Mock Object before writing any Trie logic?

<details><summary>Answer</summary>

**GOOS Outside-In Approach:**
You start by defining the Port (Interface) required by the client (e.g., the REST Controller):
`public interface AutocompleteService { List<String> getSuggestions(String prefix); }`
You do not test the `TrieNode` directly. Instead:

1. **The Test:** You write a test for the `SearchController`. You inject a **Mock** `AutocompleteService`.
2. **The Verification:** You verify that when the Controller receives a request for `"app"`, it strictly passes exactly `"app"` to the `AutocompleteService.getSuggestions("app")` method, and properly serializes the mock's returned list.
This forces you to design the API boundaries based on _messages passed_ (Behavior) rather than _internal structure_ (State). Once the boundary is proven, you step inward to implement the actual `Trie` class that implements `AutocompleteService`.
</details>

---

[← DEEP INTERNALS - HOW ADVANCED DATA…](01_deep_internals_how_advanced_data_structures.md) | [Chapter overview](../07a_Advanced_DS_Core.md) | [Segment Tree →](03_segment_tree.md)
