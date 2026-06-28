**Navigation**: [< Previous Chapter](07a_Advanced_DS_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

# PART 4: FENWICK TREE (Binary Indexed Tree)

### Historical Evolution

The advanced data structures in this chapter emerged from specific hardware and application constraints that basic structures couldn't satisfy. **Union-Find with path compression and union by rank** (Disjoint Set Union) was optimized by **Robert Tarjan in 1975** — his landmark paper "Efficiency of a good but not linear set union algorithm" introduced the inverse Ackermann function $\alpha(n)$ as the amortized cost per operation, proving that DSU achieves amortized $O(\alpha(n))$ (practically constant time) — this remains one of the most elegant amortized analyses in computer science. **Lazy Propagation** in Segment Trees was developed to handle range updates where applying updates to individual elements would be $O(n)$ — the key insight is to tag nodes with pending updates and apply them only when needed. **Skip Lists** were introduced by **William Pugh in 1989** as an alternative to balanced trees — Pugh proved that randomized skip lists with $O(\log n)$ expected height provide $O(\log n)$ expected search/insert/delete, avoiding the complex rotation logic of AVL/Red-Black trees; Java's `ConcurrentSkipListMap` uses this structure for lock-free concurrent ordered maps. Modern practice (post-2010) applies these in database query engines (lazy evaluation for range predicates), distributed systems (Union-Find for connected components in graph processing frameworks like Pregel/GraphX), and concurrent data structures (Skip Lists in Redis sorted sets).

---

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

# PART 4b: SEGMENT TREE — Complete Implementation

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      SEGMENT TREE — THEORY & CODE                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  A Segment Tree allows:                                                      ║
║  • Range Query (sum/min/max/gcd) in O(log n)                                 ║
║  • Point Update in O(log n)                                                  ║
║  • Range Update with Lazy Propagation in O(log n)                            ║
║  • Uses O(4n) space (built as complete binary tree in array)                 ║
║                                                                              ║
║  WHEN TO USE vs BIT/FENWICK:                                                 ║
║  • BIT: Only prefix-sum/point-update. Simpler, less memory.                  ║
║  • Segment Tree: Range update, range min/max, lazy propagation.              ║
║    More powerful but ~2× more code.                                          ║
║                                                                              ║
║  VISUAL:                                                                     ║
║  Array: [1, 3, 5, 7, 9, 11]                                                  ║
║                                                                              ║
║                    [0,5]=36                                                  ║
║                  /          \                                                ║
║            [0,2]=9         [3,5]=27                                          ║
║            /    \          /     \                                           ║
║        [0,1]=4  [2]=5  [3,4]=16  [5]=11                                      ║
║        /    \          /    \                                                ║
║     [0]=1  [1]=3   [3]=7  [4]=9                                              ║
║                                                                              ║
║  Each node stores aggregate (sum/min/max) of its range.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Segment Tree Implementation (Range Sum + Point Update)

```java
class SegmentTree {
    int[] tree;
    int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];  // 4× for safe sizing
        build(arr, 0, 0, n - 1);
    }

    // BUILD: O(n)
    private void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];  // Leaf
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node + 1, start, mid);       // Left child
            build(arr, 2 * node + 2, mid + 1, end);     // Right child
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];  // Merge
        }
    }

    // POINT UPDATE: O(log n)
    public void update(int idx, int val) {
        update(0, 0, n - 1, idx, val);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) update(2 * node + 1, start, mid, idx, val);
            else update(2 * node + 2, mid + 1, end, idx, val);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }

    // RANGE QUERY: O(log n)
    public int query(int L, int R) {
        return query(0, 0, n - 1, L, R);
    }

    private int query(int node, int start, int end, int L, int R) {
        if (R < start || end < L) return 0;            // No overlap
        if (L <= start && end <= R) return tree[node];  // Total overlap
        int mid = (start + end) / 2;                    // Partial overlap
        return query(2 * node + 1, start, mid, L, R)
             + query(2 * node + 2, mid + 1, end, L, R);
    }
}
```

## Segment Tree with Lazy Propagation (Range Update)

```java
class LazySegTree {
    int[] tree, lazy;
    int n;

    public LazySegTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        lazy = new int[4 * n];
        build(arr, 0, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2*node+1, start, mid);
        build(arr, 2*node+2, mid+1, end);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }

    private void pushDown(int node, int start, int end) {
        if (lazy[node] != 0) {
            int mid = (start + end) / 2;
            tree[2*node+1] += lazy[node] * (mid - start + 1);
            tree[2*node+2] += lazy[node] * (end - mid);
            lazy[2*node+1] += lazy[node];
            lazy[2*node+2] += lazy[node];
            lazy[node] = 0;
        }
    }

    // RANGE UPDATE: add val to all elements in [L,R]
    public void rangeUpdate(int L, int R, int val) {
        rangeUpdate(0, 0, n-1, L, R, val);
    }

    private void rangeUpdate(int node, int start, int end, int L, int R, int val) {
        if (R < start || end < L) return;
        if (L <= start && end <= R) {
            tree[node] += val * (end - start + 1);
            lazy[node] += val;
            return;
        }
        pushDown(node, start, end);
        int mid = (start + end) / 2;
        rangeUpdate(2*node+1, start, mid, L, R, val);
        rangeUpdate(2*node+2, mid+1, end, L, R, val);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }

    public int query(int L, int R) { return query(0, 0, n-1, L, R); }

    private int query(int node, int start, int end, int L, int R) {
        if (R < start || end < L) return 0;
        if (L <= start && end <= R) return tree[node];
        pushDown(node, start, end);
        int mid = (start + end) / 2;
        return query(2*node+1, start, mid, L, R) + query(2*node+2, mid+1, end, L, R);
    }
}
```

## Curated Segment Tree / BIT Problems

| #   | Problem                                                                                                   | LC# | Pattern                   | Difficulty |
| --- | --------------------------------------------------------------------------------------------------------- | --- | ------------------------- | ---------- |
| 1   | [Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/)                       | 307 | BIT or Segment Tree       | Medium     |
| 2   | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | 315 | BIT + coordinate compress | Hard       |
| 3   | [My Calendar I](https://leetcode.com/problems/my-calendar-i/)                                             | 729 | Segment Tree / TreeMap    | Medium     |
| 4   | [My Calendar II](https://leetcode.com/problems/my-calendar-ii/)                                           | 731 | Segment Tree with lazy    | Medium     |
| 5   | [My Calendar III](https://leetcode.com/problems/my-calendar-iii/)                                         | 732 | Segment Tree with lazy    | Hard       |
| 6   | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)                                   | 327 | BIT / Merge Sort          | Hard       |
| 7   | [Reverse Pairs](https://leetcode.com/problems/reverse-pairs/)                                             | 493 | BIT / Merge Sort          | Hard       |
| 8   | [Rectangle Area II](https://leetcode.com/problems/rectangle-area-ii/)                                     | 850 | Segment Tree + sweep      | Hard       |
| 9   | [Falling Squares](https://leetcode.com/problems/falling-squares/)                                         | 699 | Segment Tree (range max)  | Hard       |
| 10  | [Range Sum Query 2D - Mutable](https://leetcode.com/problems/range-sum-query-2d-mutable/)                 | 308 | 2D BIT                    | Hard       |

---

# 🔗 Part 5: Disjoint Set (union — Find)

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

# 📌 Part 6: Skip List

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

# 📌 Part 7: Bloom Filter

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

# 💾 Part 8: LRU Cache

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

# 🌳 Part 9: B — Tree and B+ Tree

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

# ⚖️ Part 10: Comparison Table

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

# 🚀 Part 11: More Advanced Data Structures

## Sparse Table (Range Minimum Query)

```
SPARSE TABLE: Precompute answers for all power-of-2 ranges
              Perfect for STATIC arrays with repeated queries

IDEA: Any range can be covered by at most 2 overlapping power-of-2 ranges

Array: [3, 1, 4, 1, 5, 9, 2, 6]

Sparse Table (for MIN):
┌───────────────────────────────────────────────────────────────┐
│ k=0 (2^0=1): [3, 1, 4, 1, 5, 9, 2, 6]  (each element itself)  │
│ k=1 (2^1=2): [1, 1, 1, 1, 5, 2, 2, -]  (min of 2)             │
│ k=2 (2^2=4): [1, 1, 1, 1, 2, 2, -, -]  (min of 4)             │
│ k=3 (2^3=8): [1, -, -, -, -, -, -, -]  (min of 8)             │
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
┌────────────────────────────────────────────────────────────────┐
│ i=4: arr[4]=8   Stack=[]      → NGE=-1   Stack=[8]             │
│ i=3: arr[3]=10  Stack=[8]     → 10>8, pop → NGE=-1  Stack=[10] │
│ i=2: arr[2]=2   Stack=[10]    → 2<10 → NGE=10  Stack=[10,2]    │
│ i=1: arr[1]=5   Stack=[10,2]  → 5>2, pop → NGE=10  Stack=[10,5]│
│ i=0: arr[0]=4   Stack=[10,5]  → 4<5 → NGE=5   Stack=[10,5,4]   │
└────────────────────────────────────────────────────────────────┘

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

🔬 **Section Challenge — Monotonic Stack**

**Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?

<details><summary>Answer</summary>

In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.

</details>

## Monotonic Deque (Sliding Window Maximum)

```
MONOTONIC DEQUE: Deque that maintains decreasing order
                 Front always has maximum of current window

PROBLEM: Find maximum in each sliding window of size k

Array: [1, 3, -1, -3, 5, 3, 6, 7], k=3

┌─────────────────────────────────────────────────────────────────┐
│ Window [1,3,-1]     Deque: [3,-1]     Max: 3                    │
│ Window [3,-1,-3]    Deque: [3,-1,-3]  Max: 3                    │
│ Window [-1,-3,5]    Deque: [5]        Max: 5                    │
│ Window [-3,5,3]     Deque: [5,3]      Max: 5                    │
│ Window [5,3,6]      Deque: [6]        Max: 6                    │
│ Window [3,6,7]      Deque: [7]        Max: 7                    │
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

🔬 **Section Challenge — Monotonic Deque (Sliding Window Maximum)**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## Circular Buffer (Ring Buffer)

```
RING BUFFER: Fixed-size buffer that wraps around
             Used in: Audio processing, Network buffers, Logging

STRUCTURE:
┌─────────────────────────────────────────────────────────┐
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ A │ B │ C │ D │ E │   │   │   │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│           ↑                   ↑                         │
│         HEAD                TAIL                        │
│         (read)              (write)                     │
│                                                         │
│  After adding F, G, H, I:                               │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ A │ B │ C │ D │ E │ F │ G │ H │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│           ↑                               ↑             │
│         HEAD                            TAIL            │
│                                                         │
│  After adding I (wraps around):                         │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ I │ B │ C │ D │ E │ F │ G │ H │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│             ↑ ↑                                         │
│          TAIL HEAD                                      │
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
│    ┌─────────────┬─────────────┐                                │
│    │             │             │                                │
│    │     NW      │     NE      │                                │
│    │             │             │                                │
│    ├─────────────┼─────────────┤                                │
│    │             │             │                                │
│    │     SW      │     SE      │                                │
│    │             │             │                                │
│    └─────────────┴─────────────┘                                │
│                                                                 │
│  Each quadrant can be subdivided further if needed              │
│                                                                 │
│  Example: Storing points (3,7), (5,2), (8,8), (1,4)             │
│                                                                 │
│    10┌─────────────┬─────────────┐                              │
│      │    (3,7)    │    (8,8)    │                              │
│    5 │    (1,4)    │             │                              │
│      ├─────────────┼─────────────┤                              │
│      │             │    (5,2)    │                              │
│    0 │             │             │                              │
│      └─────────────┴─────────────┘                              │
│      0      5      10                                           │
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
│                    [Root Hash: abcd1234]                        │
│                           /        \                            │
│              [Hash: ab12]           [Hash: cd34]                │
│               /       \              /        \                 │
│         [H: a1]    [H: b2]     [H: c3]     [H: d4]              │
│            |          |           |           |                 │
│         Block A   Block B     Block C     Block D               │
│                                                                 │
│  VERIFICATION:                                                  │
│  To verify Block C is unchanged:                                │
│  1. Hash Block C → should match [H: c3]                         │
│  2. Combine with [H: d4] → should match [Hash: cd34]            │
│  3. Combine with [Hash: ab12] → should match Root               │
│                                                                 │
│  Only need O(log n) hashes to verify any block!                 │
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

# 🧩 Part 12: Leetcode Problems By Data Structure

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

# 📋 Part 13: Complexity Cheat Sheet (extended)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE COMPLEXITY REFERENCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATA STRUCTURE      │ ACCESS │ SEARCH │ INSERT │ DELETE │ SPACE             │
├─────────────────────┼────────┼────────┼────────┼────────┼───────────────────┤
│ Array               │ O(1)   │ O(n)   │ O(n)   │ O(n)   │ O(n)              │
│ Dynamic Array       │ O(1)   │ O(n)   │ O(1)*  │ O(n)   │ O(n)              │
│ Singly Linked List  │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)              │
│ Doubly Linked List  │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)              │
│ Stack               │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)              │
│ Queue               │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)              │
│ Hash Table          │ N/A    │ O(1)*  │ O(1)*  │ O(1)*  │ O(n)              │
│ BST (balanced)      │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)              │
│ BST (worst)         │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ O(n)              │
│ AVL Tree            │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)              │
│ Red-Black Tree      │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)              │
│ B-Tree              │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)              │
│ Heap                │ O(1)†  │ O(n)   │ O(logn)│ O(logn)│ O(n)              │
│ Trie                │ O(m)   │ O(m)   │ O(m)   │ O(m)   │ O(ALPHABET*m*n)   │
│ Segment Tree        │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(4n)             │
│ Fenwick Tree        │ N/A    │ O(logn)│ O(logn)│ N/A    │ O(n)              │
│ Sparse Table        │ O(1)   │ O(1)   │ N/A    │ N/A    │ O(n log n)        │
│ Disjoint Set        │ N/A    │ O(α)   │ O(α)   │ N/A    │ O(n)              │
│ Skip List           │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n log n)*       │
│ Bloom Filter        │ N/A    │ O(k)   │ O(k)   │ N/A    │ O(m) bits         │
│ QuadTree            │ O(logn)│ O(logn)│ O(logn)│ O(logn)│ O(n)              │
└─────────────────────┴────────┴────────┴────────┴────────┴───────────────────┘

* = amortized or average case
† = O(1) for peek/min, O(log n) for extract
α = inverse Ackermann function ≈ O(1) for practical purposes
m = string/key length
k = number of hash functions
```

---

# 📌 Part 14: When to Use What (decision Flowchart)

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



---

## Deep Dive — The Fenwick Tree, Built From the Problem That Forces It

### Step 0 — The problem that creates the need

You have an array of 1,000,000 numbers. You must answer two kinds of request, interleaved, a million times each:

- `sum(l, r)` — total of `arr[l..r]`
- `update(i, x)` — add `x` to `arr[i]`

**Try the two obvious structures and watch both fail:**

| Structure | `sum(l,r)` | `update(i,x)` | 10⁶ of each |
|-----------|-----------|---------------|-------------|
| Plain array | O(n) scan | O(1) | 10⁶ × 10⁶ = **10¹² ops** → minutes |
| Prefix-sum array | O(1) (`pre[r]-pre[l-1]`) | O(n) (rebuild every prefix ≥ i) | 10⁶ × 10⁶ = **10¹² ops** → minutes |

Each structure is fast at *one* operation by paying O(n) on the *other*. The plain array commits everything to the cells; the prefix array commits everything to the totals. **The Fenwick tree exists to split the difference: nobody pays O(n), everybody pays O(log n).** That tradeoff — give up O(1) on the cheap op to rescue the expensive one — is the whole idea. Hold onto it; segment trees and sqrt-decomposition are the same bargain at different exchange rates (see the curve at the end).

### Step 1 — The structural idea: cover [1..i] with O(log i) pre-summed blocks

Prefix sums failed because one block (`pre[i]`) covered *everything* up to i, so one update touched it for every i ≥ that position. Plain arrays failed because each block covered *one* cell, so a query had to visit them all.

What if blocks came in **power-of-two lengths**? Then any prefix `[1..i]` is the concatenation of a few such blocks — exactly the binary representation of i. Example, i = 13 = `1101₂` = 8 + 4 + 1:

```
[1 .. 13]  =  [1..8]      ++  [9..12]   ++  [13..13]
              length 8        length 4      length 1
              (the "8" bit)   (the "4")     (the "1")
```

Three blocks instead of thirteen cells. The number of blocks = number of 1-bits in i ≤ ⌈log₂ i⌉. *That* is where the log comes from — not from a balanced tree you build, but from binary itself.

### Step 2 — Where each block lives: the index IS the address

Store the sum of each block at the index of its **last** element. So:

- `bit[13]` holds `[13..13]` (length 1)
- `bit[12]` holds `[9..12]` (length 4)
- `bit[8]`  holds `[1..8]`  (length 8)

The length of the block ending at index i is **the lowest set bit of i** — call it `lowbit(i)`. Check: 12 = `1100₂`, lowest set bit = `100₂` = 4 ✓. 8 = `1000₂`, lowest set bit = 8 ✓. 13 = `1101₂`, lowest set bit = 1 ✓. So:

> **The one invariant that defines a Fenwick tree:**
> `bit[i]` = sum of `arr[i - lowbit(i) + 1 .. i]` — a block of length `lowbit(i)` ending at i.

### Step 3 — Why `i & (-i)` is `lowbit(i)` (don't memorize — derive it)

Two's complement: `-i = (~i) + 1`. Flipping all bits then adding 1 has a precise effect — every bit *below* the lowest set bit is 0 in i, becomes 1 after `~`, then the `+1` carries all the way up through them and stops exactly at the lowest set bit, flipping it back. The bits *above* are the inverse of i's. Concretely, i = 12:

```
 i      = 0000 1100
 ~i     = 1111 0011
 ~i + 1 = 1111 0100   (= -i)
 i & -i = 0000 0100   ← only the lowest set bit survives the AND  = 4
```

Above the low bit, i and -i are bitwise opposites → AND gives 0. Below it, both are 0 → AND gives 0. *At* it, both are 1 → survives. So `i & (-i)` isolates exactly one bit, the lowest. This is the engine the whole structure runs on.

### Step 4 — Query: walk down by *stripping* the low bit

`prefixSum(i)` = sum the block ending at i, then jump to the index just before that block and repeat:

```
long prefixSum(int i) {        // sum of arr[1..i]
    long s = 0;
    while (i > 0) { s += bit[i]; i -= i & (-i); }
    return s;
}
```

Trace `prefixSum(13)` — watch i shed one bit per step:

```
i = 13 = 1101 → add bit[13] (covers [13..13]),  i -= 1  → 12
i = 12 = 1100 → add bit[12] (covers [9..12]),   i -= 4  → 8
i = 8  = 1000 → add bit[8]  (covers [1..8]),    i -= 8  → 0
stop. blocks visited: [13..13]+[9..12]+[1..8] = [1..13], no gaps, no overlap.
```

Each subtraction clears the lowest 1-bit, so the loop runs once per set bit ≤ log₂ i times. `sum(l, r) = prefixSum(r) - prefixSum(l-1)`.

### Step 5 — Update: walk up by *adding* the low bit

When `arr[i]` changes, every block that *contains* i must change. Those are found by repeatedly adding the low bit:

```
void update(int i, long delta) {   // arr[i] += delta
    for (; i <= n; i += i & (-i)) bit[i] += delta;
}
```

Trace `update(5, +3)`:

```
i = 5 = 0101 → bit[5]  covers [5..5]    ✓ contains 5,  i += 1 → 6
i = 6 = 0110 → bit[6]  covers [5..6]    ✓ contains 5,  i += 2 → 8
i = 8 = 1000 → bit[8]  covers [1..8]    ✓ contains 5,  i += 8 → 16
i = 16        → bit[16] covers [1..16]  ✓ contains 5,  i += 16 → 32 > n, stop
```

Every block we touched genuinely contains index 5, and we touched *only* those — adding the low bit is exactly the jump to the next-larger block whose range swallows the current one. Query strips bits going down; update adds bits going up. They are mirror images, and both run in O(log n) because a 32-bit (or 64-bit) integer has at most that many bit positions to add or strip.

### Why this is provably O(log n), stated as the loop facts

- **Query** subtracts `lowbit(i)` each step → strictly removes one set bit → terminates in (popcount of i) ≤ ⌊log₂ i⌋ + 1 steps.
- **Update** adds `lowbit(i)` each step → strictly increases i and at least carries one bit position upward → terminates in ≤ ⌊log₂ n⌋ + 1 steps before exceeding n.

No balancing, no rotations, no recursion, O(n) space, cache-friendly (one flat array). That's why competitive programmers reach for it before a segment tree whenever point-update + prefix-query is enough.

---

## The Range-Query Family — One Idea, Four Exchange Rates

Fenwick is not a trick to memorize in isolation. It is one point on a single tradeoff curve, and every "advanced" range structure is just a different point on the *same* curve: **how finely do you pre-aggregate, and what do you pay to keep those aggregates correct under updates?**

| Structure | Query | Update | Space | What it can aggregate | Pre-aggregation granularity |
|-----------|-------|--------|-------|----------------------|----------------------------|
| Plain array | O(n) | O(1) | O(n) | anything | none (one cell per block) |
| Prefix-sum array | O(1) | O(n) | O(n) | invertible only (sum, xor) | total (one block covers everything) |
| **Fenwick (BIT)** | O(log n) | O(log n) | O(n) | invertible only† | power-of-two blocks via binary |
| Segment tree | O(log n) | O(log n) | O(2n) | *any associative* op (min, max, gcd, sum) | explicit binary tree of intervals |
| Segment tree + lazy | O(log n) | O(log n) *range* update | O(2n) | associative + composable tag | same, with deferred propagation |
| Sqrt decomposition | O(√n) | O(1)/O(√n) | O(n) | anything | √n blocks, dead simple to code |
| Sparse table | **O(1)** | **impossible** | O(n log n) | idempotent (min/max/gcd) | every power-of-two window, precomputed |

†**The single most important reason to pick segment tree over Fenwick:** Fenwick's `sum(l,r) = prefix(r) − prefix(l−1)` needs an *inverse* (subtraction). Min and max have no inverse — you cannot recover `min(l..r)` from `min(1..r)` and `min(1..l−1)`. So **Fenwick does sum/xor; segment tree does min/max/gcd**. That one sentence decides the structure in 90% of problems.

**How to read the curve:** move down the table and you trade query/update *speed* against *generality* and *space*. Prefix-sum is the O(1)-query extreme (but O(n) update, sum-only). Sparse table is the *other* O(1)-query extreme (but zero update, idempotent-only). Fenwick and segment tree sit in the O(log n)/O(log n) sweet spot where both ops are cheap — Fenwick when subtraction is allowed and you want the smallest, fastest code; segment tree when the operation has no inverse or you need range updates. Sqrt decomposition is the "I'll accept O(√n) because it's 15 lines and I can't get the segment tree right under time pressure" option — and √(10⁶) = 1000, so for 10⁵ queries it's still ~10⁸ ops, often fine.

**Decision in one breath:** point update + prefix of an invertible op → **Fenwick**. Range query of a non-invertible op (min/max/gcd) → **segment tree**. Range *update* + range query → **segment tree with lazy propagation**. Static array, idempotent op, O(1) queries → **sparse table**. Can't recall the code under pressure → **sqrt decomposition**.

---

## When It Breaks -- Advanced DS Patterns

**1. Fenwick tree 0-indexed vs 1-indexed** -- BITs are naturally 1-indexed (lowbit(0) = 0, infinite loop). If your data is 0-indexed, always add +1 when inserting/querying. Forgetting this causes infinite loops or ArrayIndexOutOfBoundsException.

**2. Sparse table for mutable arrays** -- sparse tables support O(1) range minimum/maximum queries but require O(n log n) preprocessing and do NOT support updates. If the array changes, the sparse table must be rebuilt entirely. Use segment tree for mutable arrays.

**3. Union-Find without path compression on chain input** -- a union-find that uses union-by-rank but not path compression still achieves O(log n) per operation. But path compression alone (without union-by-rank) can still produce O(log n) amortised. Both together give O(alpha(n)). Omitting both on chain-like unions (always union smaller into larger) gives O(log n) per op, not O(alpha(n)).

**4. Skip list with poor random choices** -- the expected O(log n) height of a skip list assumes each level promotion happens with probability p=0.5 independently. Using a biased RNG (always promoting) produces a list with O(n) levels and O(n) search time. Production implementations use a cryptographically seeded RNG.

---

## Reference Anchor

**JDK has no built-in Fenwick tree or sparse table.** Production graph/query libraries:

```java
// Apache Commons Math -- no BIT, but has StatUtils for descriptive statistics
// For range queries in production, use database SQL window functions or
// pre-aggregated rollup tables rather than custom BIT/sparse-table.

// Guava -- RangeMap for interval-based lookups (different from range queries):
RangeMap<Integer, String> rangeMap = TreeRangeMap.create();
rangeMap.put(Range.closed(1, 10), "low");
rangeMap.put(Range.closed(11, 100), "mid");
String label = rangeMap.get(5); // "low" -- O(log n) lookup

// For competitive/interview use -- Fenwick tree Java idiom:
int[] bit = new int[n + 1]; // 1-indexed
// Update: for (int i = pos; i <= n; i += i & (-i)) bit[i] += val;
// Query: int s = 0; for (int i = pos; i > 0; i -= i & (-i)) s += bit[i];
// Range query [l, r]: query(r) - query(l-1)
```

---

_Master these structures, and you can build anything!_ 🚀


---

## Reality Check

**"Knowing the data structure is enough"** → Knowing that a segment tree supports range queries is the first step. The pattern skill is recognizing WHEN a problem maps to range queries: stock price range minimums, interval scheduling conflicts, histogram largest rectangle. The data structure is the tool; the pattern is knowing which tool fits which problem shape.

**"Advanced data structures require advanced implementations"** → Many competitive programmers use simplified implementations: segment tree as a flat array of size 4n with recursive build/query/update, Union-Find as two arrays (parent and rank), and monotonic stack as a regular stack with a while loop. The elegance is in the usage pattern, not in complex class hierarchies. Clean, minimal implementations are easier to debug under time pressure.

**"Combining data structures is always better"** → A HashMap inside a TreeMap inside a priority queue adds complexity and constant factors. Each layer adds indirection and cache misses. Often a single well-chosen structure suffices: LRU cache uses LinkedHashMap (one structure), not separate HashMap and DoublyLinkedList. Combine structures only when a single structure genuinely cannot meet the time complexity requirements.

**"Persistent data structures are academic"** → Persistent data structures (versions that preserve previous states after modification) appear in: version control systems (git object model), functional programming runtimes, database MVCC (multiversion concurrency control), and undo/redo systems. A persistent segment tree enables time-travel queries — answering range queries about the state of the array at any historical point.

**"Augmented data structures are hard to design"** → Augmentation follows a systematic recipe: take a standard data structure, add extra information to each node, maintain that information during standard operations. An order-statistic tree augments a BST with subtree sizes to support find-kth-element in O(log n). The key constraint: the augmented data must be maintainable during rotations and updates without increasing asymptotic complexity.
