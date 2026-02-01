# 🏗️ Advanced Data Structures: Complete Guide

## Beyond Arrays and Trees - Structures That Power Modern Systems

---

# 🔬 PART 0: DEEP INTERNALS - HOW ADVANCED DATA STRUCTURES WORK AT MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       ADVANCED DATA STRUCTURES AT THE HARDWARE LEVEL - MINUTE DETAILS           ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Understanding the PHYSICAL implementation of these powerful structures:         ║
║  • Memory layout and allocation patterns                                         ║
║  • Cache behavior and optimization techniques                                    ║
║  • Bit manipulation in Fenwick trees                                            ║
║  • Why certain structures are faster in practice                                 ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## TRIE NODE MEMORY LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TRIE MEMORY REPRESENTATION - DEEP DIVE                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BASIC TRIE NODE (Array-based):                                                 │
│  class TrieNode {                                                               │
│      TrieNode[] children = new TrieNode[26];  // 26 letters                    │
│      boolean isEndOfWord;                                                       │
│  }                                                                               │
│                                                                                  │
│  MEMORY LAYOUT (64-bit JVM, compressed oops):                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE  │ FIELD                │ VALUE                          │   │
│  ├────────┼───────┼──────────────────────┼────────────────────────────────┤   │
│  │ 0      │ 8     │ Mark Word            │ Object header                  │   │
│  │ 8      │ 4     │ Class Pointer        │ → TrieNode.class              │   │
│  │ 12     │ 4     │ children (ref)       │ → Object[] array              │   │
│  │ 16     │ 1     │ isEndOfWord          │ true/false                     │   │
│  │ 17     │ 7     │ padding              │ alignment to 8 bytes           │   │
│  └────────┴───────┴──────────────────────┴────────────────────────────────┘   │
│  TrieNode object: 24 bytes                                                     │
│                                                                                  │
│  PLUS the children array:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE  │ CONTENT                                               │   │
│  ├────────┼───────┼───────────────────────────────────────────────────────┤   │
│  │ 0      │ 8     │ Mark Word (array header)                              │   │
│  │ 8      │ 4     │ Class Pointer                                         │   │
│  │ 12     │ 4     │ Array length = 26                                     │   │
│  │ 16     │ 104   │ 26 × 4 bytes (references to child TrieNode)          │   │
│  └────────┴───────┴───────────────────────────────────────────────────────┘   │
│  children[] array: 120 bytes                                                   │
│                                                                                  │
│  TOTAL PER NODE: 24 + 120 = 144 bytes!                                         │
│                                                                                  │
│  For 100,000 words average 8 chars, assuming 30% node sharing:                 │
│  Nodes ≈ 100,000 × 8 × 0.7 = 560,000 nodes                                    │
│  Memory ≈ 560,000 × 144 = 80 MB!                                               │
│                                                                                  │
│                                                                                  │
│  MEMORY-OPTIMIZED TRIE (HashMap children):                                      │
│  class TrieNode {                                                               │
│      Map<Character, TrieNode> children = new HashMap<>();                      │
│      boolean isEndOfWord;                                                       │
│  }                                                                               │
│                                                                                  │
│  For sparse nodes (few children): Much smaller!                                 │
│  Average children ≈ 3-4, so ~160 bytes vs 144 bytes but more flexible         │
│                                                                                  │
│                                                                                  │
│  COMPRESSED TRIE (Patricia/Radix Tree):                                         │
│  ────────────────────────────────────                                           │
│  Instead of storing single characters, store strings:                           │
│                                                                                  │
│  Standard Trie:          Patricia Trie:                                         │
│        root                    root                                             │
│         │                       │                                               │
│         a                     "app"                                             │
│         │                     /   \                                             │
│         p                  "le"  "lication"                                     │
│         │                                                                       │
│         p                                                                       │
│        / \                                                                      │
│       l   l                                                                     │
│       │   │                                                                     │
│       e   i                                                                     │
│           c...                                                                  │
│                                                                                  │
│  Patricia: Fewer nodes, less memory, similar time complexity                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## SEGMENT TREE MEMORY LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SEGMENT TREE MEMORY - ARRAY-BASED STORAGE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  For array of size n, segment tree needs array of size 4n (safe upper bound)   │
│  Actually needs 2^⌈log₂(n)⌉+1 - 1 nodes, but 4n is simpler                     │
│                                                                                  │
│  ARRAY-BASED INDEXING:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Index i:                                                                │   │
│  │   Left child:  2*i + 1                                                 │   │
│  │   Right child: 2*i + 2                                                 │   │
│  │   Parent:      (i-1) / 2                                               │   │
│  │                                                                        │   │
│  │ OR (1-indexed, simpler):                                               │   │
│  │   Left child:  2*i                                                     │   │
│  │   Right child: 2*i + 1                                                 │   │
│  │   Parent:      i / 2                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  EXAMPLE: Array [1, 3, 5, 7, 9, 11] - Sum Segment Tree                         │
│                                                                                  │
│  LOGICAL TREE:                                                                   │
│                       [36]                 (sum of all: index 1)                │
│                     /      \                                                    │
│                  [9]        [27]           (index 2, 3)                         │
│                 /    \     /    \                                               │
│               [4]   [5]  [16]  [11]        (index 4, 5, 6, 7)                   │
│              /  \                /  \                                           │
│            [1]  [3]  [5]  [7]  [9]  [11]   (index 8-13, leaves)               │
│                                                                                  │
│  ARRAY STORAGE (1-indexed):                                                     │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐       │
│  │ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │10  │11  │12  │13  │       │
│  ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤       │
│  │ -- │ 36 │ 9  │ 27 │ 4  │ 5  │ 16 │ 11 │ 1  │ 3  │ 5  │ 7  │ 9  │ 11 │       │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘       │
│                                                                                  │
│  MEMORY: 4n × 4 bytes (int) = 16n bytes                                        │
│  For n = 1,000,000: 16 MB                                                      │
│                                                                                  │
│                                                                                  │
│  CACHE BEHAVIOR:                                                                 │
│  ─────────────────                                                              │
│  Query path: index 1 → 2 or 3 → 4,5,6,7 → ...                                 │
│  Each level doubles the index → Sequential cache misses                        │
│                                                                                  │
│  Level 0: index 1 (cache line A)                                               │
│  Level 1: index 2,3 (cache line A, probably hit)                              │
│  Level 2: index 4-7 (might need new cache line)                               │
│  Level 3: index 8-15 (likely new cache line)                                  │
│  ...                                                                            │
│                                                                                  │
│  For log₂(n) levels: log₂(n) potential cache misses                           │
│  n = 1M → log₂(1M) ≈ 20 cache misses per query                               │
│                                                                                  │
│  OPTIMIZATION: "Cache-oblivious" segment trees (van Emde Boas layout)         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## FENWICK TREE - BIT MANIPULATION DEEP DIVE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FENWICK TREE (BIT) - THE MAGIC OF BINARY                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  KEY INSIGHT: Use lowest set bit for range calculation!                         │
│                                                                                  │
│  LOWEST SET BIT (LSB):                                                           │
│  ─────────────────────                                                          │
│  For number i, LSB = i & (-i)                                                  │
│                                                                                  │
│  WHY IT WORKS:                                                                   │
│  -i = two's complement = invert all bits and add 1                             │
│                                                                                  │
│  i = 12 = 1100 (binary)                                                         │
│  ~i     = 0011                                                                   │
│  -i     = ~i + 1 = 0100                                                         │
│  i & -i = 1100 & 0100 = 0100 = 4 = LSB                                         │
│                                                                                  │
│  EXAMPLES:                                                                       │
│  ┌────────┬──────────┬──────────┬───────────┬───────────────────────────────┐  │
│  │ i      │ Binary   │ -i       │ i & (-i)  │ Meaning                       │  │
│  ├────────┼──────────┼──────────┼───────────┼───────────────────────────────┤  │
│  │ 1      │ 0001     │ 1111     │ 0001 = 1  │ Covers index 1 only          │  │
│  │ 2      │ 0010     │ 1110     │ 0010 = 2  │ Covers indices 1-2           │  │
│  │ 3      │ 0011     │ 1101     │ 0001 = 1  │ Covers index 3 only          │  │
│  │ 4      │ 0100     │ 1100     │ 0100 = 4  │ Covers indices 1-4           │  │
│  │ 5      │ 0101     │ 1011     │ 0001 = 1  │ Covers index 5 only          │  │
│  │ 6      │ 0110     │ 1010     │ 0010 = 2  │ Covers indices 5-6           │  │
│  │ 7      │ 0111     │ 1001     │ 0001 = 1  │ Covers index 7 only          │  │
│  │ 8      │ 1000     │ 1000     │ 1000 = 8  │ Covers indices 1-8           │  │
│  └────────┴──────────┴──────────┴───────────┴───────────────────────────────┘  │
│                                                                                  │
│                                                                                  │
│  BIT[i] stores sum of elements from (i - LSB(i) + 1) to i                      │
│                                                                                  │
│  VISUAL:                                                                         │
│  Original: [1, 2, 3, 4, 5, 6, 7, 8] (1-indexed)                                │
│                                                                                  │
│  BIT array stores:                                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ BIT[1] = arr[1]                               = 1        (covers 1)       ││
│  │ BIT[2] = arr[1] + arr[2]                      = 3        (covers 1-2)     ││
│  │ BIT[3] = arr[3]                               = 3        (covers 3)       ││
│  │ BIT[4] = arr[1] + arr[2] + arr[3] + arr[4]    = 10       (covers 1-4)     ││
│  │ BIT[5] = arr[5]                               = 5        (covers 5)       ││
│  │ BIT[6] = arr[5] + arr[6]                      = 11       (covers 5-6)     ││
│  │ BIT[7] = arr[7]                               = 7        (covers 7)       ││
│  │ BIT[8] = arr[1] + ... + arr[8]                = 36       (covers 1-8)     ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  QUERY: Sum of [1, 7]                                                           │
│  ─────────────────────                                                          │
│  sum = 0                                                                        │
│  i = 7:  sum += BIT[7] = 7,  i -= LSB(7) = 7-1 = 6                            │
│  i = 6:  sum += BIT[6] = 11, i -= LSB(6) = 6-2 = 4                            │
│  i = 4:  sum += BIT[4] = 10, i -= LSB(4) = 4-4 = 0                            │
│  DONE!   sum = 7 + 11 + 10 = 28 ✓                                              │
│                                                                                  │
│  Number of operations: Count of 1s in binary of 7 = 3 operations               │
│  Maximum: log₂(n) operations                                                   │
│                                                                                  │
│                                                                                  │
│  UPDATE: Add 5 to index 3                                                       │
│  ────────────────────────────                                                   │
│  i = 3:  BIT[3] += 5,  i += LSB(3) = 3+1 = 4                                  │
│  i = 4:  BIT[4] += 5,  i += LSB(4) = 4+4 = 8                                  │
│  i = 8:  BIT[8] += 5,  i += LSB(8) = 8+8 = 16 > n, STOP                       │
│                                                                                  │
│  Updates all ranges that include index 3!                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## UNION-FIND - PATH COMPRESSION VISUALIZATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    UNION-FIND - PATH COMPRESSION DEEP DIVE                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INITIAL STATE (8 elements, each is own parent):                               │
│  parent[] = [0, 1, 2, 3, 4, 5, 6, 7]                                          │
│  rank[]   = [0, 0, 0, 0, 0, 0, 0, 0]                                          │
│                                                                                  │
│  AFTER union(0,1), union(2,3), union(4,5), union(6,7):                        │
│  parent[] = [0, 0, 2, 2, 4, 4, 6, 6]                                          │
│  rank[]   = [1, 0, 1, 0, 1, 0, 1, 0]                                          │
│                                                                                  │
│  Trees:   0    2    4    6                                                     │
│           │    │    │    │                                                     │
│           1    3    5    7                                                     │
│                                                                                  │
│  AFTER union(0,2), union(4,6):                                                 │
│  parent[] = [0, 0, 0, 2, 4, 4, 4, 6]                                          │
│  rank[]   = [2, 0, 1, 0, 2, 0, 1, 0]                                          │
│                                                                                  │
│  Trees:       0           4                                                    │
│              /│          /│                                                    │
│             1 2         5 6                                                    │
│               │           │                                                    │
│               3           7                                                    │
│                                                                                  │
│  AFTER union(0,4):                                                              │
│  parent[] = [0, 0, 0, 2, 0, 4, 4, 6]                                          │
│  rank[]   = [3, 0, 1, 0, 2, 0, 1, 0]                                          │
│                                                                                  │
│  Tree:           0                                                             │
│                / | \                                                           │
│               1  2  4                                                          │
│                  │ /│                                                          │
│                  3 5 6                                                         │
│                      │                                                         │
│                      7                                                         │
│                                                                                  │
│                                                                                  │
│  NOW: find(7) WITH PATH COMPRESSION:                                           │
│  ────────────────────────────────────                                          │
│                                                                                  │
│  Call stack:                                                                     │
│  find(7) → parent[7] = 6, recurse                                              │
│    find(6) → parent[6] = 4, recurse                                            │
│      find(4) → parent[4] = 0, recurse                                          │
│        find(0) → parent[0] = 0, return 0 (root!)                              │
│      return 0, set parent[4] = 0                                               │
│    return 0, set parent[6] = 0                                                 │
│  return 0, set parent[7] = 0                                                   │
│                                                                                  │
│  AFTER path compression:                                                        │
│  parent[] = [0, 0, 0, 2, 0, 4, 0, 0]                                          │
│                                                                                  │
│  Tree:           0                                                             │
│              /|\ | \\ \                                                        │
│             1 2 4 5 6 7                                                        │
│               │                                                                │
│               3                                                                │
│                                                                                  │
│  Now find(7) is O(1)!                                                          │
│                                                                                  │
│                                                                                  │
│  COMPLEXITY WITH BOTH OPTIMIZATIONS:                                            │
│  ─────────────────────────────────────                                          │
│  • Union by rank + Path compression                                             │
│  • Amortized O(α(n)) per operation                                             │
│  • α(n) = Inverse Ackermann function                                           │
│  • α(n) ≤ 4 for any practical n (even n = atoms in universe)                  │
│  • Effectively O(1) per operation!                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## SKIP LIST - PROBABILISTIC MEMORY LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SKIP LIST - HOW REDIS IMPLEMENTS SORTED SETS                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SKIP LIST STRUCTURE:                                                            │
│                                                                                  │
│  Level 4:  head ─────────────────────────────────────────────────→ nil         │
│  Level 3:  head ──────────────────→ 25 ──────────────────────────→ nil         │
│  Level 2:  head ───────→ 10 ─────→ 25 ───────────────→ 75 ───────→ nil         │
│  Level 1:  head → 5 ──→ 10 → 15 → 25 → 30 → 50 → 65 → 75 → 80 ──→ nil         │
│  Level 0:  head → 5 → 7 → 10 → 15 → 25 → 30 → 50 → 65 → 75 → 80 → 90 → nil    │
│                                                                                  │
│                                                                                  │
│  NODE MEMORY LAYOUT:                                                             │
│  class SkipListNode {                                                           │
│      int value;                                                                 │
│      SkipListNode[] forward;  // Array of pointers to next nodes              │
│  }                                                                               │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ SKIP LIST NODE (value = 25, level = 3):                                 │   │
│  │                                                                          │   │
│  │ ┌──────────────┬──────────────────────────────────────────────────────┐ │   │
│  │ │ value: 25    │ forward[]: [ptr_to_30, ptr_to_30, ptr_to_75, nil]    │ │   │
│  │ │ (4 bytes)    │ (array of 4 pointers, 32 bytes on 64-bit)            │ │   │
│  │ └──────────────┴──────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │ Object overhead: ~16 bytes                                              │   │
│  │ Array overhead:  ~16 bytes                                              │   │
│  │ Total: ~68 bytes for this node                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  LEVEL DISTRIBUTION (probability p = 0.5):                                      │
│  ─────────────────────────────────────────                                      │
│  • 50% of nodes: level 1                                                        │
│  • 25% of nodes: level 2                                                        │
│  • 12.5% of nodes: level 3                                                      │
│  • ...                                                                          │
│                                                                                  │
│  EXPECTED MEMORY per node: ~1 + 0.5 + 0.25 + ... = 2 pointers average         │
│  Much better than balanced BST!                                                 │
│                                                                                  │
│                                                                                  │
│  SEARCH for 65:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Start at head, level 4                                                    ││
│  │ Level 4: head → nil (no nodes), go DOWN                                   ││
│  │ Level 3: head → 25 (25 < 65), MOVE RIGHT, 25 → nil, go DOWN              ││
│  │ Level 2: 25 → 75 (75 > 65), go DOWN                                      ││
│  │ Level 1: 25 → 30 → 50 → 65, FOUND!                                       ││
│  │                                                                           ││
│  │ Comparisons: 25, 75, 30, 50, 65 = 5 comparisons                         ││
│  │ vs Linear: 9 comparisons                                                  ││
│  │ vs Binary Search: log₂(11) ≈ 4 comparisons (similar!)                   ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  WHY SKIP LIST OVER BALANCED BST?                                              │
│  ─────────────────────────────────                                              │
│  1. Simpler implementation (no rotations!)                                     │
│  2. Easier concurrent access (lock individual levels)                         │
│  3. Range queries are natural (just follow level 0)                           │
│  4. Redis, LevelDB use it for sorted sets                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## BLOOM FILTER - BIT ARRAY INTERNALS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BLOOM FILTER - PROBABILISTIC MEMBERSHIP                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MEMORY LAYOUT:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Bit array (m = 32 bits for example):                                    │   │
│  │                                                                          │   │
│  │ Index:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 ...             │   │
│  │ Bits:   0  0  1  0  1  0  0  1  0  0  1  0  0  0  1  0 ...             │   │
│  │                                                                          │   │
│  │ Storage: In Java, long[] with 64 bits each                              │   │
│  │ m = 1M bits = 125 KB                                                    │   │
│  │ m = 1B bits = 125 MB                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  HASH FUNCTIONS (k = 3 in this example):                                       │
│  ─────────────────────────────────────────                                      │
│  h1(x) = hash(x) % m                                                           │
│  h2(x) = hash(x + seed1) % m                                                   │
│  h3(x) = hash(x + seed2) % m                                                   │
│                                                                                  │
│  Or use double hashing: hi(x) = (h1(x) + i * h2(x)) % m                       │
│                                                                                  │
│                                                                                  │
│  INSERT "apple":                                                                 │
│  ─────────────────                                                              │
│  h1("apple") = 2,  h2("apple") = 7,  h3("apple") = 14                         │
│                                                                                  │
│  Before: 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0                       │
│  After:  0  0  1  0  0  0  0  1  0  0  0  0  0  0  1  0                       │
│               ↑              ↑                    ↑                            │
│              h1             h2                   h3                            │
│                                                                                  │
│                                                                                  │
│  CHECK "apple": Look at positions 2, 7, 14 → all 1s → "PROBABLY IN SET"       │
│  CHECK "grape": h1=3, h2=5, h3=10 → position 3 is 0 → "DEFINITELY NOT IN SET" │
│                                                                                  │
│                                                                                  │
│  FALSE POSITIVE PROBABILITY:                                                    │
│  ───────────────────────────                                                    │
│  After inserting n elements with k hash functions into m bits:                 │
│                                                                                  │
│  P(bit is still 0) = (1 - 1/m)^(kn) ≈ e^(-kn/m)                               │
│  P(false positive) = (1 - e^(-kn/m))^k                                         │
│                                                                                  │
│  OPTIMAL k = (m/n) × ln(2) ≈ 0.693 × (m/n)                                    │
│                                                                                  │
│  EXAMPLE CALCULATIONS:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ n (elements) │ m (bits) │ m/n ratio │ optimal k │ FP rate              │   │
│  ├──────────────┼──────────┼───────────┼───────────┼──────────────────────┤   │
│  │ 1,000        │ 10,000   │ 10        │ 7         │ 0.82%                │   │
│  │ 1,000        │ 20,000   │ 20        │ 14        │ 0.00061%             │   │
│  │ 1,000,000    │ 10M      │ 10        │ 7         │ 0.82%                │   │
│  │ 1,000,000    │ 100M     │ 100       │ 69        │ ~0%                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  RULE OF THUMB: 10 bits per element with 7 hash functions → ~1% FP rate       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## LRU CACHE - DOUBLY LINKED LIST + HASHMAP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LRU CACHE - O(1) GET AND PUT                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STRUCTURE:                                                                      │
│  ────────────                                                                   │
│  1. HashMap<Key, Node>: O(1) lookup by key                                     │
│  2. Doubly Linked List: O(1) remove/insert for recency tracking                │
│                                                                                  │
│                                                                                  │
│  MEMORY LAYOUT:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │  HashMap:                                                                  ││
│  │  ┌───────────────────────────────────────────┐                            ││
│  │  │ key: "A" → Node(A)                        │                            ││
│  │  │ key: "B" → Node(B)                        │                            ││
│  │  │ key: "C" → Node(C)                        │                            ││
│  │  └───────────────────────────────────────────┘                            ││
│  │                                                                            ││
│  │  Doubly Linked List (most recent at head):                                ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │  │                                                                      │ ││
│  │  │  HEAD ←→ Node(C) ←→ Node(B) ←→ Node(A) ←→ TAIL                      │ ││
│  │  │  (dummy)  (most     (middle)   (least    (dummy)                     │ ││
│  │  │           recent)              recent)                               │ ││
│  │  │                                                                      │ ││
│  │  └──────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                            ││
│  │  Each Node:                                                                ││
│  │  ┌──────────────────────────────────────────────────┐                     ││
│  │  │ key: "B"                                         │                     ││
│  │  │ value: 42                                        │                     ││
│  │  │ prev: → Node(C)                                  │                     ││
│  │  │ next: → Node(A)                                  │                     ││
│  │  └──────────────────────────────────────────────────┘                     ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  OPERATIONS:                                                                     │
│  ───────────                                                                    │
│                                                                                  │
│  GET(key):                                                                       │
│  1. Look up in HashMap: O(1)                                                   │
│  2. If found, move node to head: O(1)                                          │
│  3. Return value                                                                │
│                                                                                  │
│  PUT(key, value):                                                               │
│  1. If key exists: update value, move to head                                  │
│  2. If key doesn't exist:                                                      │
│     a. Create new node, add to head                                           │
│     b. Add to HashMap                                                          │
│     c. If over capacity, remove tail node (LRU item)                          │
│                                                                                  │
│                                                                                  │
│  MEMORY PER ENTRY:                                                              │
│  ──────────────────                                                             │
│  Node: ~48 bytes (key ref, value ref, prev, next, object header)              │
│  HashMap entry: ~32 bytes (key ref, value ref, hash, next)                    │
│  Total: ~80 bytes per cache entry                                              │
│                                                                                  │
│  For 10,000 entries: ~800 KB                                                   │
│  For 1,000,000 entries: ~80 MB                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: WHY THESE DATA STRUCTURES MATTER

```
REAL-WORLD USAGE:

TRIE:
├── Autocomplete in Google Search
├── Spell checkers
├── IP routing tables
└── DNA sequence matching

SEGMENT TREE:
├── Range queries in databases
├── Graphics rendering (visibility)
└── Computational geometry

FENWICK TREE (BIT):
├── Cumulative frequency tables
├── Range sum queries
└── Inversion counting

DISJOINT SET (UNION-FIND):
├── Network connectivity
├── Kruskal's MST algorithm
├── Image processing (connected components)
└── Social networks (friend circles)

SKIP LIST:
├── Redis database
├── LevelDB
└── Concurrent data structures

BLOOM FILTER:
├── Chrome's malicious URL check
├── Database query optimization
├── Spell checkers
└── Network routers

LRU CACHE:
├── Operating system page replacement
├── Web browser cache
├── Database query cache
└── CPU cache management
```

---

# PART 2: TRIE (PREFIX TREE)

## Concept and Structure

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     TRIE (PREFIX TREE) - COMPLETE UNDERSTANDING              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A TRIE?                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRIE = Tree for Retrieval (pronounced "try")                                │
│ A tree-like data structure where each path from root to a node represents  │
│ a PREFIX of strings stored in it. Each node represents ONE CHARACTER.      │
│                                                                             │
│ INVENTED: 1959 by René de la Briandais                                      │
│ REFINED: 1960 by Edward Fredkin (who named it "trie")                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES TRIE SOLVE?                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ PROBLEM 1: Fast prefix-based searching                                      │
│   - Given 1 million words, find all words starting with "pre"              │
│   - HashMap: Must check ALL 1 million keys → O(n × m)                       │
│   - Trie: Go to 'p'→'r'→'e', then collect all children → O(m + k)          │
│     where k = number of matches                                             │
│                                                                             │
│ PROBLEM 2: Autocomplete suggestions                                         │
│   - User types "app", show: "apple", "application", "approach"             │
│   - Database search is SLOW for this                                        │
│   - Trie: Navigate to "app" node, DFS to find all completions              │
│                                                                             │
│ PROBLEM 3: Spell checking                                                   │
│   - Is "acknowledgement" spelled correctly?                                 │
│   - Dictionary lookup in O(word_length) not O(dictionary_size)             │
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
│ │ Search prefix    │ O(n × m) 😢       │ O(prefix_len) 🎉                 │ │
│ │ Hash collisions  │ YES               │ NO                               │ │
│ │ Ordered results  │ NO                │ YES (lexicographic)              │ │
│ │ Space efficiency │ Better            │ Worse (but can compress)         │ │
│ └──────────────────┴───────────────────┴──────────────────────────────────┘ │
│                                                                             │
│ VS BINARY SEARCH TREE (BST):                                                │
│ - BST: O(m × log n) to search (compare strings at each node)               │
│ - Trie: O(m) regardless of how many strings stored                          │
│                                                                             │
│ THE KEY INSIGHT:                                                            │
│ Trie time complexity depends on WORD LENGTH, not NUMBER OF WORDS!           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE TRIE?                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE TRIE WHEN:                                                           │
│    • Need prefix-based operations (autocomplete, spell check)               │
│    • Need lexicographically sorted results                                  │
│    • Searching same prefixes repeatedly                                     │
│    • Building word games (Scrabble, Boggle)                                 │
│    • IP routing tables                                                      │
│    • Phone directory (search by prefix)                                     │
│                                                                             │
│ ❌ DON'T USE TRIE WHEN:                                                     │
│    • Only need exact match (HashMap is simpler)                             │
│    • Memory is very limited (Tries use more space)                          │
│    • Strings are very long with little common prefixes                      │
│    • Data changes frequently and memory matters                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES TRIE WORK? (VISUAL EXPLANATION)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Storing: ["cat", "car", "card", "care", "dog"]                             │
│                                                                             │
│             (root)                   STRUCTURE:                             │
│            /      \                  - Each node = one character            │
│          c          d                - Edge = transition to next char       │
│          |          |                - * = marks end of valid word          │
│          a          o                                                       │
│         /|\         |                MEMORY LAYOUT:                         │
│        t r e        g*               - Root has children[26] (for a-z)     │
│        * |*                          - Most children are null               │
│          d                           - Only used paths allocated            │
│          *                                                                  │
│                                                                             │
│ SEARCH "car":                        INSERT "cow":                          │
│ root→c→a→r (found, is end? YES ✓)   root→c→o(new)→w(new, mark end)         │
│                                                                             │
│ SEARCH "ca":                         PREFIX "car":                          │
│ root→c→a (found, is end? NO ✗)      root→c→a→r, then DFS: card, care       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & EDGE CASES                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. SPACE CONSUMPTION:                                                       │
│    - Each node has 26 pointers (for a-z) = 26 × 8 bytes = 208 bytes/node   │
│    - Solution: Use HashMap<Character, Node> instead of array               │
│    - Solution: Compressed Trie (merge single-child chains)                  │
│                                                                             │
│ 2. DELETION COMPLEXITY:                                                     │
│    - Can't just remove node; might break other words                        │
│    - "card" and "car": deleting "car" shouldn't delete 'c','a','r'        │
│    - Solution: Only unmark isEndOfWord if other words use same path        │
│                                                                             │
│ 3. UNICODE/SPECIAL CHARACTERS:                                              │
│    - 26-size array only works for lowercase English                         │
│    - Solution: Use HashMap<Character, Node> for flexibility                 │
│                                                                             │
│ 4. CASE SENSITIVITY:                                                        │
│    - "Cat" vs "cat" - are they same?                                       │
│    - Solution: Convert to lowercase before operations                       │
│                                                                             │
│ 5. EMPTY STRING:                                                            │
│    - Is "" a valid word? Handle root.isEndOfWord                           │
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
│ - Worst case: O(ALPHABET_SIZE × m × n) where n = number of words           │
│ - Best case: O(total characters) when words share prefixes                  │
│                                                                             │
│ EXAMPLE OUTPUT:                                                             │
│ trie.insert("apple");                                                       │
│ trie.search("apple");   → true                                             │
│ trie.search("app");     → false ("app" not marked as word)                 │
│ trie.startsWith("app"); → true  (prefix exists)                            │
│ trie.autocomplete("app"); → ["apple", "application", ...]                 │
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

---

# PART 3: SEGMENT TREE

## Concept

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SEGMENT TREE - COMPLETE UNDERSTANDING                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A SEGMENT TREE?                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ A segment tree is a binary tree where each node represents an INTERVAL      │
│ (segment) of the array and stores an aggregate value (sum, min, max, etc.)  │
│ for that interval.                                                           │
│                                                                              │
│ STRUCTURE:                                                                   │
│ • Root: Represents the ENTIRE array [0, n-1]                                 │
│ • Each internal node: Represents [l, r] = [l, mid] + [mid+1, r]             │
│ • Leaves: Each represents a SINGLE element [i, i]                            │
│                                                                              │
│ INVENTED: Used in computational geometry since 1970s (Bentley)               │
│ POPULARIZED: In competitive programming in 2000s                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES SEGMENT TREE SOLVE?                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Efficient range queries + point/range updates                  │
│                                                                              │
│ WITHOUT SEGMENT TREE:                                                        │
│ "Find sum of elements from index 2 to 1000"                                  │
│ • Array: O(n) to sum each time → 10 queries on 1M elements = 10M ops        │
│ • Prefix sum: O(1) query BUT O(n) if you need to update an element          │
│                                                                              │
│ WITH SEGMENT TREE:                                                           │
│ • Query: O(log n)                                                            │
│ • Update: O(log n)                                                           │
│ • 10 queries + 5 updates = 15 × log(1M) ≈ 300 ops!                          │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Databases: Range queries on changing data                                  │
│ • Finance: Rolling statistics (min/max/avg over time windows)               │
│ • Gaming: Leaderboard queries ("players ranked 50-100")                     │
│ • GIS: Geographic range queries                                              │
│ • Image Processing: 2D range queries (with 2D segment trees)                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE SEGMENT TREE OVER ALTERNATIVES?                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────┬──────────────┬──────────────┬────────────────────┐ │
│ │ Data Structure       │ Query Time   │ Update Time  │ Use Case           │ │
│ ├──────────────────────┼──────────────┼──────────────┼────────────────────┤ │
│ │ Plain Array          │ O(n)         │ O(1)         │ Few queries        │ │
│ │ Prefix Sum Array     │ O(1)         │ O(n)         │ No updates         │ │
│ │ Segment Tree         │ O(log n)     │ O(log n)     │ Both! ⭐           │ │
│ │ Fenwick/BIT          │ O(log n)     │ O(log n)     │ Simpler, sum only  │ │
│ │ Sqrt Decomposition   │ O(√n)        │ O(1)         │ Simpler to code    │ │
│ └──────────────────────┴──────────────┴──────────────┴────────────────────┘ │
│                                                                              │
│ SEGMENT TREE ADVANTAGES:                                                     │
│ • Handles ANY associative operation (sum, min, max, gcd, AND, OR, XOR)      │
│ • Supports lazy propagation for range updates                                │
│ • More flexible than Fenwick Tree (BIT)                                      │
│ • Generalizes to 2D, merge sort tree, etc.                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE SEGMENT TREE?                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE SEGMENT TREE WHEN:                                                   │
│    • Need BOTH range queries AND point/range updates                         │
│    • Operation is ASSOCIATIVE (a⊕(b⊕c) = (a⊕b)⊕c)                           │
│    • Many queries (more than O(n) total)                                     │
│    • Array is fixed size (or use dynamic segment tree)                       │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                          │
│    • Only queries, no updates → use prefix sum (simpler)                     │
│    • Only updates, no queries → just use array                               │
│    • Few queries → brute force is fine                                       │
│    • Operation isn't associative → segment tree won't work                   │
│                                                                              │
│ INTERVIEW SIGNALS:                                                           │
│ • "Range sum query" + "update element" = SEGMENT TREE                        │
│ • "Range minimum query" + "modifications" = SEGMENT TREE                     │
│ • "Query multiple times" on "changing array" = SEGMENT TREE                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES SEGMENT TREE WORK?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Array: [1, 3, 5, 7, 9, 11]                                                   │
│                                                                              │
│ Segment Tree for SUM:                                                        │
│                                                                              │
│                     [36]              ← Root: sum of [0,5] = 1+3+5+7+9+11   │
│                    /    \                                                    │
│                [9]      [27]          ← [0,2]=9, [3,5]=27                   │
│               /   \    /    \                                                │
│             [4]  [5]  [16]  [11]      ← [0,1]=4, [2]=5, [3,4]=16, [5]=11   │
│            /  \       /  \                                                   │
│          [1] [3]    [7]  [9]          ← Individual elements                 │
│                                                                              │
│ QUERY: "Sum from index 1 to 4"                                               │
│ • Start at root                                                              │
│ • Node [0,5]: Range [1,4] partially overlaps → go to both children          │
│ • Node [0,2]: Range [1,2] partially overlaps → go to both children          │
│   • Node [0,1]: Range [1,1] partially overlaps → check children             │
│     • Node [0]: outside [1,4], ignore                                        │
│     • Node [1]: completely inside [1,4], return 3                            │
│   • Node [2]: completely inside [1,4], return 5                              │
│ • Node [3,5]: Range [3,4] partially overlaps                                 │
│   • Node [3,4]: completely inside [1,4], return 16                           │
│   • Node [5]: outside [1,4], ignore                                          │
│ • Answer: 3 + 5 + 16 = 24 ✓                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. TREE SIZE CALCULATION:                                                    │
│    Size needed: 4×n (safe) or 2×2^(ceil(log2(n))) (exact)                   │
│    Common mistake: Using 2n (not enough for non-powers of 2)                 │
│                                                                              │
│ 2. INDEX CONFUSION:                                                          │
│    Left child: 2*i, Right child: 2*i+1 (1-indexed)                          │
│    Left child: 2*i+1, Right child: 2*i+2 (0-indexed)                        │
│    Pick one and stick to it!                                                 │
│                                                                              │
│ 3. BOUNDARY CONDITIONS:                                                      │
│    Query [l,r] where l > r? Return identity element                          │
│    Segment [start,end] where start > end? Should not happen!                │
│                                                                              │
│ 4. FORGETTING TO UPDATE ALL ANCESTORS:                                       │
│    When updating a leaf, must update all nodes up to root                    │
│                                                                              │
│ 5. LAZY PROPAGATION ERRORS:                                                  │
│    Forgetting to push down lazy values before splitting                      │
│    Not handling lazy values when query visits a node                         │
│                                                                              │
│ 6. WRONG MERGE OPERATION:                                                    │
│    Sum: merge(a,b) = a + b                                                   │
│    Min: merge(a,b) = min(a,b)                                                │
│    Be consistent!                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ OPERATION        │ TIME         │ SPACE        │ OUTPUT                      │
│ ─────────────────┼──────────────┼──────────────┼──────────────────────────── │
│ Build            │ O(n)         │ O(n)         │ Segment tree array          │
│ Point Query      │ O(log n)     │ O(log n)*    │ Value at index              │
│ Range Query      │ O(log n)     │ O(log n)*    │ Aggregate over range        │
│ Point Update     │ O(log n)     │ O(log n)*    │ void (modifies tree)        │
│ Range Update**   │ O(log n)     │ O(log n)*    │ void (with lazy prop)       │
│                                                                              │
│ * Stack space for recursion                                                  │
│ ** With lazy propagation                                                     │
│                                                                              │
│ SPACE: O(4n) ≈ O(n) for tree storage                                        │
│                                                                              │
│ EXAMPLE OUTPUT:                                                              │
│ arr = [1, 3, 5, 7, 9, 11]                                                    │
│ query(1, 4) → 24 (3+5+7+9)                                                   │
│ update(2, 10)  → arr becomes [1, 3, 10, 7, 9, 11]                           │
│ query(1, 4) → 29 (3+10+7+9)                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

```java
class SegmentTree {
    int[] tree;
    int[] arr;
    int n;

    public SegmentTree(int[] arr) {
        this.arr = arr;
        this.n = arr.length;
        this.tree = new int[4 * n];  // Safe size
        build(0, 0, n - 1);
    }

    // BUILD: O(n)
    private void build(int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }

        int mid = (start + end) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;

        build(leftChild, start, mid);
        build(rightChild, mid + 1, end);

        tree[node] = tree[leftChild] + tree[rightChild];  // Sum
    }

    // RANGE QUERY: O(log n)
    public int query(int L, int R) {
        return query(0, 0, n - 1, L, R);
    }

    private int query(int node, int start, int end, int L, int R) {
        // No overlap
        if (R < start || L > end) {
            return 0;  // Identity for sum
        }

        // Complete overlap
        if (L <= start && end <= R) {
            return tree[node];
        }

        // Partial overlap
        int mid = (start + end) / 2;
        int leftSum = query(2 * node + 1, start, mid, L, R);
        int rightSum = query(2 * node + 2, mid + 1, end, L, R);

        return leftSum + rightSum;
    }

    // POINT UPDATE: O(log n)
    public void update(int idx, int newVal) {
        arr[idx] = newVal;
        update(0, 0, n - 1, idx, newVal);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }

        int mid = (start + end) / 2;
        if (idx <= mid) {
            update(2 * node + 1, start, mid, idx, val);
        } else {
            update(2 * node + 2, mid + 1, end, idx, val);
        }

        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }
}

// VISUAL QUERY TRACE:
// Array: [1, 3, 5, 7, 9, 11]
// Query: sum(1, 4) = 3 + 5 + 7 + 9 = 24
//
//                    [36] (0-5)
//                   /    \
//               [9]      [27]
//              /   \    /    \
//            [4]  [5]  [16]  [11]
//           /  \       /  \
//         [1] [3]    [7]  [9]
//
// Query(1,4):
// At root (0-5): partial overlap → go both sides
// Left (0-2): partial → go both
//   (0-1): partial → go both
//     (0): no overlap → return 0
//     (1): complete → return 3
//   (2): complete → return 5
// Right (3-5): partial → go both
//   (3-4): complete → return 16
//   (5): no overlap → return 0
//
// Result: 0 + 3 + 5 + 16 + 0 = 24 ✓
```

---

# PART 4: FENWICK TREE (Binary Indexed Tree)

## Concept

```
FENWICK TREE: More space-efficient than Segment Tree
              for prefix sums and point updates.

Key Insight: Use binary representation of indices!

Index i's parent in Fenwick tree = i - (i & -i)
(Remove the lowest set bit)

Array:     [_, 1, 3, 5, 7, 9, 11, 13, 15]  (1-indexed)
BIT:       [_, 1, 4, 5, 16, 9, 20, 13, 64]

BIT[i] stores sum of elements in range determined by lowest set bit.

BIT[1] = arr[1]                    (binary: 0001, range size 1)
BIT[2] = arr[1] + arr[2]           (binary: 0010, range size 2)
BIT[3] = arr[3]                    (binary: 0011, range size 1)
BIT[4] = arr[1]+arr[2]+arr[3]+arr[4]  (binary: 0100, range size 4)
```

## Implementation

```java
class FenwickTree {
    int[] bit;
    int n;

    public FenwickTree(int[] arr) {
        this.n = arr.length;
        this.bit = new int[n + 1];  // 1-indexed

        // Build BIT
        for (int i = 0; i < n; i++) {
            update(i, arr[i]);
        }
    }

    // UPDATE: O(log n)
    // Add 'delta' to element at index i
    public void update(int i, int delta) {
        i++;  // Convert to 1-indexed
        while (i <= n) {
            bit[i] += delta;
            i += (i & -i);  // Move to next responsible node
        }
    }

    // PREFIX SUM: O(log n)
    // Sum of elements from 0 to i
    public int prefixSum(int i) {
        i++;  // Convert to 1-indexed
        int sum = 0;
        while (i > 0) {
            sum += bit[i];
            i -= (i & -i);  // Move to parent
        }
        return sum;
    }

    // RANGE SUM: O(log n)
    public int rangeSum(int L, int R) {
        if (L == 0) return prefixSum(R);
        return prefixSum(R) - prefixSum(L - 1);
    }
}

// VISUAL TRACE - prefixSum(6):
// BIT indices:  1   2   3   4   5   6   7   8
// BIT values:  [1,  4,  5, 16,  9, 20, 13, 64]
//
// i = 7 (6+1 in 1-indexed)
// Binary: 111
//
// Step 1: i=7 (111), add BIT[7]=13, i = 7 - (7 & -7) = 7-1 = 6
// Step 2: i=6 (110), add BIT[6]=20, i = 6 - (6 & -6) = 6-2 = 4
// Step 3: i=4 (100), add BIT[4]=16, i = 4 - (4 & -4) = 4-4 = 0
// Stop: i=0
//
// Sum = 13 + 20 + 16 = 49
// Verify: 1+3+5+7+9+11+13 = 49 ✓
```

---

# PART 5: DISJOINT SET (UNION-FIND)

## Concept

```
DISJOINT SET: Manage collection of non-overlapping sets

Operations:
- FIND: Which set does element belong to?
- UNION: Merge two sets

OPTIMIZATIONS:
1. Path Compression: Flatten tree during FIND
2. Union by Rank: Attach smaller tree under larger

          Before Compression    After Compression
               1                      1
              /|\                   / | \ \
             2 3 4                2  3  4  5
             |
             5
```

## Implementation

```java
class DisjointSet {
    int[] parent;
    int[] rank;

    public DisjointSet(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;  // Each element is its own parent
            rank[i] = 0;
        }
    }

    // FIND with Path Compression: O(α(n)) ≈ O(1) amortized
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    // UNION by Rank: O(α(n)) ≈ O(1) amortized
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) return;  // Already in same set

        // Union by rank
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
    }

    // Check if same set
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    // Count number of disjoint sets
    public int countSets() {
        int count = 0;
        for (int i = 0; i < parent.length; i++) {
            if (parent[i] == i) count++;
        }
        return count;
    }
}

// VISUAL TRACE:
// Initial: {0}, {1}, {2}, {3}, {4}
// parent: [0, 1, 2, 3, 4]
//
// union(0, 1):
// parent: [0, 0, 2, 3, 4]
//    0
//    |
//    1
//
// union(2, 3):
// parent: [0, 0, 2, 2, 4]
//    0       2
//    |       |
//    1       3
//
// union(0, 2):
// parent: [0, 0, 0, 2, 4]
//        0
//      / |
//     1  2
//        |
//        3
//
// After path compression on find(3):
// parent: [0, 0, 0, 0, 4]
//        0
//      / | \
//     1  2  3
```

## Application: Kruskal's MST

```java
public int kruskalMST(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    DisjointSet ds = new DisjointSet(n);
    int mstWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];

        if (!ds.connected(u, v)) {
            ds.union(u, v);
            mstWeight += weight;
            edgesUsed++;

            if (edgesUsed == n - 1) break;  // MST complete
        }
    }

    return mstWeight;
}
```

---

# PART 6: SKIP LIST

## Concept

```
SKIP LIST: Probabilistic alternative to balanced trees

Like a linked list with "express lanes" for faster traversal.

Level 3:  1 ────────────────────────────────> 9
Level 2:  1 ──────────> 4 ──────────> 7 ───> 9
Level 1:  1 ───> 3 ───> 4 ───> 6 ───> 7 ───> 9
Level 0:  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → null

Search for 6:
- Start at top left
- Move right until would overshoot
- Drop down one level
- Repeat

Path: 1→9 (overshoot) ↓ 1→4→7 (overshoot) ↓ 4→6 ✓
```

## Implementation

```java
class SkipListNode {
    int val;
    SkipListNode[] forward;

    SkipListNode(int val, int level) {
        this.val = val;
        this.forward = new SkipListNode[level + 1];
    }
}

class SkipList {
    private static final int MAX_LEVEL = 16;
    private static final double P = 0.5;
    private SkipListNode head;
    private int level;
    private Random random;

    public SkipList() {
        head = new SkipListNode(Integer.MIN_VALUE, MAX_LEVEL);
        level = 0;
        random = new Random();
    }

    private int randomLevel() {
        int lvl = 0;
        while (random.nextDouble() < P && lvl < MAX_LEVEL) {
            lvl++;
        }
        return lvl;
    }

    // SEARCH: O(log n) average
    public boolean search(int target) {
        SkipListNode current = head;
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < target) {
                current = current.forward[i];
            }
        }
        current = current.forward[0];
        return current != null && current.val == target;
    }

    // INSERT: O(log n) average
    public void insert(int val) {
        SkipListNode[] update = new SkipListNode[MAX_LEVEL + 1];
        SkipListNode current = head;

        // Find insert position at each level
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < val) {
                current = current.forward[i];
            }
            update[i] = current;
        }

        int newLevel = randomLevel();
        if (newLevel > level) {
            for (int i = level + 1; i <= newLevel; i++) {
                update[i] = head;
            }
            level = newLevel;
        }

        SkipListNode newNode = new SkipListNode(val, newLevel);
        for (int i = 0; i <= newLevel; i++) {
            newNode.forward[i] = update[i].forward[i];
            update[i].forward[i] = newNode;
        }
    }

    // DELETE: O(log n) average
    public boolean delete(int val) {
        SkipListNode[] update = new SkipListNode[MAX_LEVEL + 1];
        SkipListNode current = head;

        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < val) {
                current = current.forward[i];
            }
            update[i] = current;
        }

        current = current.forward[0];
        if (current == null || current.val != val) {
            return false;
        }

        for (int i = 0; i <= level; i++) {
            if (update[i].forward[i] != current) break;
            update[i].forward[i] = current.forward[i];
        }

        while (level > 0 && head.forward[level] == null) {
            level--;
        }

        return true;
    }
}
```

---

# PART 7: BLOOM FILTER

## Concept

```
BLOOM FILTER: Space-efficient probabilistic data structure

- Tells if element is POSSIBLY IN set or DEFINITELY NOT in set
- No false negatives, possible false positives
- Cannot delete elements

USE CASE: Quick membership test before expensive operation

Example: Check if URL is malicious
1. Check Bloom Filter (fast, in memory)
2. If "possibly yes", check actual database (slow)
3. If "definitely no", skip database check

Structure: Bit array + multiple hash functions

Insert "hello":
h1("hello") = 3
h2("hello") = 7
h3("hello") = 11

Bit array: [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0]
                ^         ^         ^
```

## Implementation

```java
class BloomFilter {
    private BitSet bitSet;
    private int size;
    private int numHashes;

    public BloomFilter(int expectedElements, double falsePositiveRate) {
        // Optimal size: -n*ln(p) / (ln(2)^2)
        this.size = (int) Math.ceil(
            -expectedElements * Math.log(falsePositiveRate) /
            (Math.log(2) * Math.log(2))
        );
        // Optimal hash count: (m/n) * ln(2)
        this.numHashes = (int) Math.round(
            (double) size / expectedElements * Math.log(2)
        );
        this.bitSet = new BitSet(size);
    }

    // ADD element
    public void add(String element) {
        for (int i = 0; i < numHashes; i++) {
            int hash = getHash(element, i);
            bitSet.set(hash);
        }
    }

    // CHECK membership
    public boolean mightContain(String element) {
        for (int i = 0; i < numHashes; i++) {
            int hash = getHash(element, i);
            if (!bitSet.get(hash)) {
                return false;  // Definitely not present
            }
        }
        return true;  // Possibly present (could be false positive)
    }

    private int getHash(String element, int i) {
        // Double hashing: h(i) = h1 + i*h2
        int h1 = element.hashCode();
        int h2 = element.hashCode() * 31;
        return Math.abs((h1 + i * h2) % size);
    }
}

// VISUAL EXAMPLE:
// Size = 16, numHashes = 3
//
// Add "cat": positions 2, 7, 12
// Bit array: [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0]
//
// Add "dog": positions 4, 8, 14
// Bit array: [0,0,1,0,1,0,0,1,1,0,0,0,1,0,1,0]
//
// Check "cat": positions 2, 7, 12 → all 1 → POSSIBLY PRESENT ✓
// Check "rat": positions 2, 4, 11 → 11 is 0 → DEFINITELY NOT PRESENT
// Check "bird": positions 2, 8, 12 → all 1 → FALSE POSITIVE!
```

---

# PART 8: LRU CACHE

## Concept

```
LRU (Least Recently Used) CACHE:
Fixed-size cache that evicts least recently used item when full.

Operations needed:
- GET: O(1) - HashMap
- PUT: O(1) - HashMap + update order
- EVICT: O(1) - Doubly Linked List

Structure: HashMap + Doubly Linked List

        HashMap                 Doubly Linked List
    ┌─────────────┐         HEAD ←→ A ←→ B ←→ C ←→ TAIL
    │ "A" → nodeA │                 ↑           ↑
    │ "B" → nodeB │              Most         Least
    │ "C" → nodeC │             Recent       Recent
    └─────────────┘

Access B → Move B to front:
HEAD ←→ B ←→ A ←→ C ←→ TAIL
```

## Implementation

```java
class LRUCache {
    class DLinkedNode {
        int key, value;
        DLinkedNode prev, next;
    }

    private Map<Integer, DLinkedNode> cache = new HashMap<>();
    private int capacity;
    private DLinkedNode head, tail;  // Dummy nodes

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head = new DLinkedNode();
        tail = new DLinkedNode();
        head.next = tail;
        tail.prev = head;
    }

    // GET: O(1)
    public int get(int key) {
        DLinkedNode node = cache.get(key);
        if (node == null) return -1;

        moveToHead(node);  // Mark as recently used
        return node.value;
    }

    // PUT: O(1)
    public void put(int key, int value) {
        DLinkedNode node = cache.get(key);

        if (node != null) {
            node.value = value;
            moveToHead(node);
        } else {
            DLinkedNode newNode = new DLinkedNode();
            newNode.key = key;
            newNode.value = value;

            cache.put(key, newNode);
            addToHead(newNode);

            if (cache.size() > capacity) {
                DLinkedNode lru = removeTail();
                cache.remove(lru.key);
            }
        }
    }

    private void addToHead(DLinkedNode node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(DLinkedNode node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(DLinkedNode node) {
        removeNode(node);
        addToHead(node);
    }

    private DLinkedNode removeTail() {
        DLinkedNode lru = tail.prev;
        removeNode(lru);
        return lru;
    }
}

// VISUAL TRACE:
// Capacity = 3
//
// put(1, 1):  [1]
// put(2, 2):  [2, 1]
// put(3, 3):  [3, 2, 1]
// get(1):     [1, 3, 2]  (1 moved to front)
// put(4, 4):  [4, 1, 3]  (2 evicted as LRU)
// get(2):     -1         (2 was evicted)
```

---

# PART 9: B-TREE AND B+ TREE

## Concept

```
B-TREE: Self-balancing tree optimized for disk access
        Used in databases and file systems

Properties (order m):
- Each node has at most m children
- Each non-leaf has at least ⌈m/2⌉ children
- Root has at least 2 children (if not leaf)
- All leaves at same level
- Node with k children has k-1 keys

B-Tree (order 3):
              [10, 20]
             /   |    \
        [5,7]  [15,17] [25,30]

B+ TREE: Variant where:
- All data in leaves
- Leaves linked for range queries
- Internal nodes only have keys (guides)

B+ Tree:
              [10, 20]
             /   |    \
        [5,7]→[10,15,17]→[20,25,30]→null
         ↑                    ↑
        Data                 Data

WHY B+ TREE for DATABASES?
1. All data at leaves → consistent access time
2. Linked leaves → efficient range queries
3. More keys per node → shallower tree → fewer disk reads
```

---

# PART 10: COMPARISON TABLE

```
┌───────────────────┬─────────────┬─────────────┬─────────────────────┐
│ Data Structure    │ Search      │ Insert      │ Space               │
├───────────────────┼─────────────┼─────────────┼─────────────────────┤
│ Trie              │ O(m)        │ O(m)        │ O(ALPHABET × m × n) │
│ Segment Tree      │ O(log n)    │ O(log n)    │ O(4n)               │
│ Fenwick Tree      │ O(log n)    │ O(log n)    │ O(n)                │
│ Disjoint Set      │ O(α(n))≈O(1)│ O(α(n))≈O(1)│ O(n)                │
│ Skip List         │ O(log n)*   │ O(log n)*   │ O(n)*               │
│ Bloom Filter      │ O(k)        │ O(k)        │ O(m) bits           │
│ LRU Cache         │ O(1)        │ O(1)        │ O(n)                │
│ B-Tree (order m)  │ O(log n)    │ O(log n)    │ O(n)                │
└───────────────────┴─────────────┴─────────────┴─────────────────────┘

* = average case for Skip List
m = string length for Trie
k = number of hash functions for Bloom Filter
α = inverse Ackermann function (practically constant)
```

---

_These data structures are the building blocks of modern systems!_ 🏗️

---

# PART 11: MORE ADVANCED DATA STRUCTURES

## Sparse Table (Range Minimum Query)

```
SPARSE TABLE: Precompute answers for all power-of-2 ranges
              Perfect for STATIC arrays with repeated queries

IDEA: Any range can be covered by at most 2 overlapping power-of-2 ranges

Array: [3, 1, 4, 1, 5, 9, 2, 6]

Sparse Table (for MIN):
┌───────────────────────────────────────────────────────────────┐
│ k=0 (2^0=1): [3, 1, 4, 1, 5, 9, 2, 6]  (each element itself)  │
│ k=1 (2^1=2): [1, 1, 1, 1, 5, 2, 2, -]  (min of 2)            │
│ k=2 (2^2=4): [1, 1, 1, 1, 2, 2, -, -]  (min of 4)            │
│ k=3 (2^3=8): [1, -, -, -, -, -, -, -]  (min of 8)            │
└───────────────────────────────────────────────────────────────┘

Query(2, 6): min(sparse[2][2], sparse[3][2]) = min(1, 2) = 1
             Using k=2 (length 4), overlapping ranges [2-5] and [3-6]
```

```java
class SparseTable {
    int[][] sparse;
    int[] log;
    int n;

    public SparseTable(int[] arr) {
        n = arr.length;
        int k = (int)(Math.log(n) / Math.log(2)) + 1;
        sparse = new int[n][k];
        log = new int[n + 1];

        // Precompute logs
        log[1] = 0;
        for (int i = 2; i <= n; i++) {
            log[i] = log[i / 2] + 1;
        }

        // Base case: ranges of length 1
        for (int i = 0; i < n; i++) {
            sparse[i][0] = arr[i];
        }

        // Build table: O(n log n)
        for (int j = 1; j < k; j++) {
            for (int i = 0; i + (1 << j) <= n; i++) {
                sparse[i][j] = Math.min(
                    sparse[i][j - 1],
                    sparse[i + (1 << (j - 1))][j - 1]
                );
            }
        }
    }

    // Query: O(1)
    public int query(int L, int R) {
        int j = log[R - L + 1];
        return Math.min(sparse[L][j], sparse[R - (1 << j) + 1][j]);
    }
}

// WHEN TO USE:
// ✓ Static array (no updates)
// ✓ Many queries
// ✓ Need O(1) query time
// ✗ Array changes frequently → use Segment Tree instead
```

---

## Monotonic Stack

```
MONOTONIC STACK: Stack that maintains increasing/decreasing order
                 Reveals relationships between elements

USE CASES:
├── Next Greater Element
├── Previous Greater Element
├── Next Smaller Element
├── Stock Span Problem
├── Largest Rectangle in Histogram
└── Trapping Rain Water

VISUAL EXAMPLE - Next Greater Element:
Array: [4, 5, 2, 10, 8]

Step by step (decreasing stack, process right to left):
┌──────────────────────────────────────────────────────────────┐
│ i=4: arr[4]=8   Stack=[]      → NGE=-1   Stack=[8]          │
│ i=3: arr[3]=10  Stack=[8]     → 10>8, pop → NGE=-1  Stack=[10]│
│ i=2: arr[2]=2   Stack=[10]    → 2<10 → NGE=10  Stack=[10,2] │
│ i=1: arr[1]=5   Stack=[10,2]  → 5>2, pop → NGE=10  Stack=[10,5]│
│ i=0: arr[0]=4   Stack=[10,5]  → 4<5 → NGE=5   Stack=[10,5,4]│
└──────────────────────────────────────────────────────────────┘

Result: [5, 10, 10, -1, -1]
```

```java
// Next Greater Element
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();

    // Process from right to left
    for (int i = n - 1; i >= 0; i--) {
        // Pop smaller elements
        while (!stack.isEmpty() && stack.peek() <= arr[i]) {
            stack.pop();
        }

        // Stack top is next greater, or -1 if empty
        result[i] = stack.isEmpty() ? -1 : stack.peek();

        // Push current element
        stack.push(arr[i]);
    }

    return result;
}

// Largest Rectangle in Histogram
public int largestRectangleArea(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    int n = heights.length;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];

        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}

// VISUAL TRACE - Largest Rectangle:
// heights = [2, 1, 5, 6, 2, 3]
//
//        _
//       | |
//     _ | |
//    | || |_  _
//  _ | || || || |
// | || || || || |
// 0  1  2  3  4  5
//
// Largest rectangle: height=5, width=2 → area=10 (indices 2-3)
```

---

## Monotonic Deque (Sliding Window Maximum)

```
MONOTONIC DEQUE: Deque that maintains decreasing order
                 Front always has maximum of current window

PROBLEM: Find maximum in each sliding window of size k

Array: [1, 3, -1, -3, 5, 3, 6, 7], k=3

┌─────────────────────────────────────────────────────────────────┐
│ Window [1,3,-1]     Deque: [3,-1]     Max: 3                   │
│ Window [3,-1,-3]    Deque: [3,-1,-3]  Max: 3                   │
│ Window [-1,-3,5]    Deque: [5]        Max: 5                   │
│ Window [-3,5,3]     Deque: [5,3]      Max: 5                   │
│ Window [5,3,6]      Deque: [6]        Max: 6                   │
│ Window [3,6,7]      Deque: [7]        Max: 7                   │
└─────────────────────────────────────────────────────────────────┘

Result: [3, 3, 5, 5, 6, 7]
```

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements (they can't be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        // Add current index
        deque.offerLast(i);

        // Record result when window is full
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

---

## Circular Buffer (Ring Buffer)

```
RING BUFFER: Fixed-size buffer that wraps around
             Used in: Audio processing, Network buffers, Logging

STRUCTURE:
┌─────────────────────────────────────────────────────────┐
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐             │
│         │ A │ B │ C │ D │ E │   │   │   │             │
│         └───┴───┴───┴───┴───┴───┴───┴───┘             │
│           ↑                   ↑                        │
│         HEAD                TAIL                       │
│         (read)              (write)                    │
│                                                        │
│  After adding F, G, H, I:                             │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐             │
│         │ A │ B │ C │ D │ E │ F │ G │ H │             │
│         └───┴───┴───┴───┴───┴───┴───┴───┘             │
│           ↑                               ↑            │
│         HEAD                            TAIL           │
│                                                        │
│  After adding I (wraps around):                       │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐             │
│         │ I │ B │ C │ D │ E │ F │ G │ H │             │
│         └───┴───┴───┴───┴───┴───┴───┴───┘             │
│             ↑ ↑                                        │
│          TAIL HEAD                                     │
└─────────────────────────────────────────────────────────┘
```

```java
class CircularBuffer<T> {
    private Object[] buffer;
    private int head = 0;  // Read position
    private int tail = 0;  // Write position
    private int size = 0;
    private int capacity;

    public CircularBuffer(int capacity) {
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    public void enqueue(T item) {
        if (isFull()) {
            // Overwrite oldest (or throw exception)
            head = (head + 1) % capacity;
            size--;
        }
        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        size++;
    }

    @SuppressWarnings("unchecked")
    public T dequeue() {
        if (isEmpty()) {
            throw new IllegalStateException("Buffer empty");
        }
        T item = (T) buffer[head];
        buffer[head] = null;
        head = (head + 1) % capacity;
        size--;
        return item;
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }
}

// USE CASE: Rate Limiter with time window
class SlidingWindowRateLimiter {
    private long[] timestamps;
    private int head = 0;
    private int count = 0;
    private int maxRequests;
    private long windowMs;

    public SlidingWindowRateLimiter(int maxRequests, long windowMs) {
        this.timestamps = new long[maxRequests];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    public synchronized boolean allowRequest() {
        long now = System.currentTimeMillis();
        long windowStart = now - windowMs;

        // Remove expired timestamps
        while (count > 0 && timestamps[head] < windowStart) {
            head = (head + 1) % maxRequests;
            count--;
        }

        if (count < maxRequests) {
            int tail = (head + count) % maxRequests;
            timestamps[tail] = now;
            count++;
            return true;
        }

        return false;
    }
}
```

---

## Quadtree (Spatial Indexing)

```
QUADTREE: Tree where each node has exactly 4 children
          Used for: 2D spatial indexing, collision detection, image compression

STRUCTURE:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ┌─────────────┬─────────────┐                               │
│    │             │             │                               │
│    │     NW      │     NE      │                               │
│    │             │             │                               │
│    ├─────────────┼─────────────┤                               │
│    │             │             │                               │
│    │     SW      │     SE      │                               │
│    │             │             │                               │
│    └─────────────┴─────────────┘                               │
│                                                                 │
│  Each quadrant can be subdivided further if needed              │
│                                                                 │
│  Example: Storing points (3,7), (5,2), (8,8), (1,4)            │
│                                                                 │
│    10┌─────────────┬─────────────┐                             │
│      │    (3,7)    │    (8,8)    │                             │
│    5 │    (1,4)    │             │                             │
│      ├─────────────┼─────────────┤                             │
│      │             │    (5,2)    │                             │
│    0 │             │             │                             │
│      └─────────────┴─────────────┘                             │
│      0      5      10                                          │
└─────────────────────────────────────────────────────────────────┘
```

```java
class QuadTree {
    private static final int MAX_POINTS = 4;
    private static final int MAX_DEPTH = 8;

    double x, y, width, height;  // Boundary
    List<Point> points;
    QuadTree nw, ne, sw, se;     // Children
    int depth;

    public QuadTree(double x, double y, double w, double h, int depth) {
        this.x = x; this.y = y;
        this.width = w; this.height = h;
        this.depth = depth;
        this.points = new ArrayList<>();
    }

    public boolean insert(Point p) {
        // Check if point is in boundary
        if (!contains(p)) return false;

        // If space available and no children
        if (points.size() < MAX_POINTS && nw == null) {
            points.add(p);
            return true;
        }

        // Subdivide if needed
        if (nw == null) subdivide();

        // Try to insert in children
        if (nw.insert(p)) return true;
        if (ne.insert(p)) return true;
        if (sw.insert(p)) return true;
        if (se.insert(p)) return true;

        return false;  // Should not happen
    }

    private void subdivide() {
        double halfW = width / 2, halfH = height / 2;
        nw = new QuadTree(x, y + halfH, halfW, halfH, depth + 1);
        ne = new QuadTree(x + halfW, y + halfH, halfW, halfH, depth + 1);
        sw = new QuadTree(x, y, halfW, halfH, depth + 1);
        se = new QuadTree(x + halfW, y, halfW, halfH, depth + 1);

        // Move existing points to children
        for (Point p : points) {
            nw.insert(p); ne.insert(p);
            sw.insert(p); se.insert(p);
        }
        points.clear();
    }

    // Query all points in range
    public List<Point> queryRange(double qx, double qy, double qw, double qh) {
        List<Point> result = new ArrayList<>();

        // Check if range intersects this quad
        if (!intersects(qx, qy, qw, qh)) return result;

        // Check points in this quad
        for (Point p : points) {
            if (p.x >= qx && p.x <= qx + qw &&
                p.y >= qy && p.y <= qy + qh) {
                result.add(p);
            }
        }

        // Recurse to children
        if (nw != null) {
            result.addAll(nw.queryRange(qx, qy, qw, qh));
            result.addAll(ne.queryRange(qx, qy, qw, qh));
            result.addAll(sw.queryRange(qx, qy, qw, qh));
            result.addAll(se.queryRange(qx, qy, qw, qh));
        }

        return result;
    }
}

// USE CASE: Finding nearby restaurants
// Instead of checking all 10,000 restaurants,
// QuadTree lets you check only those in relevant quadrants
// Reduces O(n) to O(log n) for spatial queries
```

---

## Merkle Tree (Hash Tree)

```
MERKLE TREE: Tree where each leaf is hash of data block,
             and each non-leaf is hash of its children's hashes

Used in: Blockchain, Git, Databases (PostgreSQL), P2P networks

STRUCTURE:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Root Hash: abcd1234]                       │
│                           /        \                            │
│              [Hash: ab12]           [Hash: cd34]               │
│               /       \              /        \                 │
│         [H: a1]    [H: b2]     [H: c3]     [H: d4]             │
│            |          |           |           |                 │
│         Block A   Block B     Block C     Block D               │
│                                                                 │
│  VERIFICATION:                                                  │
│  To verify Block C is unchanged:                               │
│  1. Hash Block C → should match [H: c3]                        │
│  2. Combine with [H: d4] → should match [Hash: cd34]           │
│  3. Combine with [Hash: ab12] → should match Root              │
│                                                                 │
│  Only need O(log n) hashes to verify any block!                │
└─────────────────────────────────────────────────────────────────┘
```

```java
import java.security.MessageDigest;

class MerkleTree {
    private String[] leaves;
    private String[][] tree;

    public MerkleTree(String[] data) {
        int n = data.length;
        // Pad to power of 2
        int size = 1;
        while (size < n) size *= 2;

        leaves = new String[size];
        for (int i = 0; i < n; i++) {
            leaves[i] = hash(data[i]);
        }
        for (int i = n; i < size; i++) {
            leaves[i] = hash("");  // Padding
        }

        buildTree();
    }

    private void buildTree() {
        int levels = (int)(Math.log(leaves.length) / Math.log(2)) + 1;
        tree = new String[levels][];
        tree[0] = leaves;

        for (int i = 1; i < levels; i++) {
            int prevLen = tree[i - 1].length;
            tree[i] = new String[prevLen / 2];

            for (int j = 0; j < tree[i].length; j++) {
                tree[i][j] = hash(tree[i-1][2*j] + tree[i-1][2*j+1]);
            }
        }
    }

    public String getRoot() {
        return tree[tree.length - 1][0];
    }

    // Get proof for leaf at index
    public List<String> getProof(int index) {
        List<String> proof = new ArrayList<>();

        for (int i = 0; i < tree.length - 1; i++) {
            int siblingIdx = (index % 2 == 0) ? index + 1 : index - 1;
            proof.add(tree[i][siblingIdx]);
            index /= 2;
        }

        return proof;
    }

    // Verify data at index using proof
    public boolean verify(String data, int index, List<String> proof) {
        String currentHash = hash(data);

        for (String sibling : proof) {
            if (index % 2 == 0) {
                currentHash = hash(currentHash + sibling);
            } else {
                currentHash = hash(sibling + currentHash);
            }
            index /= 2;
        }

        return currentHash.equals(getRoot());
    }

    private String hash(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(data.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().substring(0, 8);  // Shortened for display
        } catch (Exception e) {
            return data.hashCode() + "";
        }
    }
}
```

---

# PART 12: LEETCODE PROBLEMS BY DATA STRUCTURE

## Practice Problems Mapped to DS

```
TRIE:
├── LC 208: Implement Trie (Prefix Tree)          ⭐ Medium
├── LC 211: Design Add and Search Words           ⭐ Medium
├── LC 212: Word Search II                        🔥 Hard
├── LC 648: Replace Words                         ⭐ Medium
└── LC 1268: Search Suggestions System            ⭐ Medium

SEGMENT TREE:
├── LC 307: Range Sum Query - Mutable             ⭐ Medium
├── LC 315: Count of Smaller Numbers After Self   🔥 Hard
├── LC 493: Reverse Pairs                         🔥 Hard
└── LC 327: Count of Range Sum                    🔥 Hard

DISJOINT SET (UNION-FIND):
├── LC 200: Number of Islands                     ⭐ Medium
├── LC 547: Number of Provinces                   ⭐ Medium
├── LC 684: Redundant Connection                  ⭐ Medium
├── LC 721: Accounts Merge                        ⭐ Medium
├── LC 990: Satisfiability of Equality Equations  ⭐ Medium
└── LC 1584: Min Cost to Connect All Points       ⭐ Medium

MONOTONIC STACK:
├── LC 84: Largest Rectangle in Histogram         🔥 Hard
├── LC 85: Maximal Rectangle                      🔥 Hard
├── LC 496: Next Greater Element I                ⭐ Easy
├── LC 503: Next Greater Element II               ⭐ Medium
├── LC 739: Daily Temperatures                    ⭐ Medium
└── LC 901: Online Stock Span                     ⭐ Medium

LRU CACHE:
├── LC 146: LRU Cache                             ⭐ Medium
├── LC 460: LFU Cache                             🔥 Hard
└── LC 1472: Design Browser History               ⭐ Medium

HEAP/PRIORITY QUEUE:
├── LC 23: Merge k Sorted Lists                   🔥 Hard
├── LC 295: Find Median from Data Stream          🔥 Hard
├── LC 347: Top K Frequent Elements               ⭐ Medium
├── LC 373: Find K Pairs with Smallest Sums       ⭐ Medium
└── LC 767: Reorganize String                     ⭐ Medium
```

---

# PART 13: COMPLEXITY CHEAT SHEET (EXTENDED)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE COMPLEXITY REFERENCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATA STRUCTURE      │ ACCESS │ SEARCH │ INSERT │ DELETE │ SPACE            │
├─────────────────────┼────────┼────────┼────────┼────────┼──────────────────┤
│ Array               │ O(1)   │ O(n)   │ O(n)   │ O(n)   │ O(n)             │
│ Dynamic Array       │ O(1)   │ O(n)   │ O(1)*  │ O(n)   │ O(n)             │
│ Singly Linked List  │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)             │
│ Doubly Linked List  │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)             │
│ Stack               │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)             │
│ Queue               │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)             │
│ Hash Table          │ N/A    │ O(1)*  │ O(1)*  │ O(1)*  │ O(n)             │
│ BST (balanced)      │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)             │
│ BST (worst)         │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ O(n)             │
│ AVL Tree            │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)             │
│ Red-Black Tree      │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)             │
│ B-Tree              │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)             │
│ Heap                │ O(1)†  │ O(n)   │ O(logn)│ O(logn)│ O(n)             │
│ Trie                │ O(m)   │ O(m)   │ O(m)   │ O(m)   │ O(ALPHABET*m*n)  │
│ Segment Tree        │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(4n)            │
│ Fenwick Tree        │ N/A    │ O(logn)│ O(logn)│ N/A    │ O(n)             │
│ Sparse Table        │ O(1)   │ O(1)   │ N/A    │ N/A    │ O(n log n)       │
│ Disjoint Set        │ N/A    │ O(α)   │ O(α)   │ N/A    │ O(n)             │
│ Skip List           │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n log n)*      │
│ Bloom Filter        │ N/A    │ O(k)   │ O(k)   │ N/A    │ O(m) bits        │
│ QuadTree            │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)             │
└─────────────────────┴────────┴────────┴────────┴────────┴──────────────────┘

* = amortized or average case
† = O(1) for peek/min, O(log n) for extract
α = inverse Ackermann function ≈ O(1) for practical purposes
m = string/key length
k = number of hash functions
```

---

# PART 14: WHEN TO USE WHAT (DECISION FLOWCHART)

```
START: What problem are you solving?

├── Need KEY-VALUE lookup?
│   ├── Keys are strings with prefix search? → TRIE
│   ├── Need O(1) operations? → HASH MAP
│   └── Need ordered keys? → TREE MAP (Red-Black)
│
├── Need RANGE operations?
│   ├── Static array, many queries? → SPARSE TABLE
│   ├── Updates needed?
│   │   ├── Point update + range query? → SEGMENT TREE or FENWICK
│   │   └── Range update + range query? → SEGMENT TREE with LAZY PROP
│   └── Range minimum specifically? → SPARSE TABLE (if static)
│
├── Need to track CONNECTIVITY?
│   └── Merge sets dynamically? → DISJOINT SET (UNION-FIND)
│
├── Need ORDERING with fast access?
│   ├── Min/Max quickly? → HEAP / PRIORITY QUEUE
│   ├── Next greater/smaller? → MONOTONIC STACK
│   └── Sliding window max? → MONOTONIC DEQUE
│
├── Need SPATIAL queries?
│   ├── 2D points? → QUADTREE
│   ├── Higher dimensions? → KD-TREE
│   └── Rectangles? → R-TREE
│
├── Need APPROXIMATE membership?
│   └── Fast "definitely not" check? → BLOOM FILTER
│
├── Need CACHING?
│   ├── Least recently used eviction? → LRU CACHE
│   └── Least frequently used eviction? → LFU CACHE
│
└── Need INTEGRITY verification?
    └── Efficient proof of data? → MERKLE TREE
```

---

_Master these structures, and you can build anything!_ 🚀
