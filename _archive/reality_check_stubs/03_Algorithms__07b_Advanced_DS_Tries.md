

---

## Reality Check

**"Tries waste memory compared to hash maps"** → Naive array-node Tries DO waste memory — each node holds an array of 26 (or 128) pointers, most null. For sparse alphabets or long common prefixes, Tries waste space. Alternatives: compressed trie (Patricia/Radix tree — merge single-child chains into one node), ternary search tree (BST-like, only 3 child pointers per node), hash map of children at each node (space-efficient but slower). Real-world: autocomplete indexes use compressed tries or DAWG (Directed Acyclic Word Graph) which merges common suffixes too.

**"Tries only work for strings"** → Tries work for any sequence type. XOR trie: each node has two children (bit 0 or bit 1), used to find maximum XOR pair in O(n log maxVal). IP routing: longest prefix match in routers uses tries on binary IP addresses. Suffix tries (and the compressed suffix arrays/trees) enable O(m) pattern matching for any string. The structure generalises to any alphabet and any sequence of discrete symbols.

**"DFS on a Trie is no different from DFS on a tree"** → Same mechanics but different use: Trie DFS enables prefix-constrained enumeration. Collecting all words with prefix "app": find the prefix node, then DFS from there collecting all paths to end-of-word nodes. This is O(k) where k = total characters output — optimal. Word search II (Boggle): insert all dictionary words into Trie, DFS the grid using Trie to prune — when the current path prefix is not in the Trie, prune immediately. This is far faster than hash set lookup per DFS step.

**"Tries guarantee O(m) search where m = length of the query"** → True for exact match and prefix search. Fuzzy search (allow k mismatches) requires exploring multiple Trie branches at each mismatch — O(n * 26^k) naive, reduced to O(n * 26) with the DP-on-Trie approach where you maintain a DP row (edit distances) as you traverse the Trie. This powers spell-checking in practice. The O(m) guarantee holds only for zero-error queries.

**"End-of-word markers must be boolean"** → End-of-word markers can store metadata: word frequency (for autocomplete ranking), word definition, word ID (for deduplication), document list (for inverted index). Storing `int count` instead of `boolean isEnd` enables "find the k-th most frequent word with this prefix" queries. The Trie node is just a data structure — augment it with whatever data your application needs at the word boundary.
