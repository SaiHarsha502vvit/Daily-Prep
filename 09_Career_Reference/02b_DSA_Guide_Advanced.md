> **Navigation**: [< Previous Chapter](02a_DSA_Guide_Foundations.md) | [Back to Index](../00_MASTER_INDEX.md)

---

├── Lock-free reads
├── Better throughput than synchronized HashMap
└── Weakly consistent iterators

// Lock-Free Hash Tables
└── Use CAS (Compare-and-Swap) operations
└── Higher throughput under contention
└── More complex implementation
```

#### 6. Hash Set (Unique Elements)

```java
// Hash table where value doesn't matter, only keys

HashSet<Integer> set = new HashSet<>();

Operations:
├── add(E): O(1)
├── remove(E): O(1)
├── contains(E): O(1)
└── Used for: Deduplication, membership testing
```

#### 7. Ordered Hash Tables

```java
// Maintain insertion order

LinkedHashMap<String, Integer> orderedMap = new LinkedHashMap<>();
// Keys iterate in insertion order

// Access-Order (for LRU Cache)
LinkedHashMap<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true);
// accessOrder=true: Most recently accessed moves to end
```

#### 8. Bloom Filter (Probabilistic)

```java
// Space-efficient probabilistic set
// Answers: "definitely not in set" or "probably in set"

class BloomFilter {
    private BitSet bits;
    private int numHashFunctions;

    public void add(String item) {
        for (int i = 0; i < numHashFunctions; i++) {
            int hash = hash(item, i);
            bits.set(hash % bits.size());
        }
    }

    public boolean mightContain(String item) {
        for (int i = 0; i < numHashFunctions; i++) {
            int hash = hash(item, i);
            if (!bits.get(hash % bits.size())) {
                return false;  // Definitely not in set
            }
        }
        return true;  // Probably in set (false positive possible)
    }
}

Use Cases:
├── Spell checkers (probably misspelled)
├── Cache lookup (avoid disk read if not cached)
├── Network routers (packet filtering)
├── Database (avoid disk lookup)
└── CDN (URL existence check)
```

#### 9. Count-Min Sketch

```java
// Probabilistic frequency counter
// Estimate frequency with bounded error

class CountMinSketch {
    private int[][] table;  // d rows, w columns

    public void add(String item) {
        for (int i = 0; i < d; i++) {
            int j = hash(item, i) % w;
            table[i][j]++;
        }
    }

    public int estimate(String item) {
        int min = Integer.MAX_VALUE;
        for (int i = 0; i < d; i++) {
            int j = hash(item, i) % w;
            min = Math.min(min, table[i][j]);
        }
        return min;  // Never underestimates
    }
}

Use Cases:
├── Heavy hitter detection
├── Network traffic analysis
├── Database query optimization
└── Stream processing frequency counts
```

### LeetCode Problems - Hash Tables

| #   | Problem                      | Difficulty | Pattern             | Link                                                        |
| --- | ---------------------------- | ---------- | ------------------- | ----------------------------------------------------------- |
| 1   | Two Sum                      | Easy       | HashMap             | https://leetcode.com/problems/two-sum/                      |
| 49  | Group Anagrams               | Medium     | HashMap + Sort      | https://leetcode.com/problems/group-anagrams/               |
| 128 | Longest Consecutive Sequence | Medium     | HashSet             | https://leetcode.com/problems/longest-consecutive-sequence/ |
| 146 | LRU Cache                    | Medium     | LinkedHashMap       | https://leetcode.com/problems/lru-cache/                    |
| 380 | Insert Delete GetRandom O(1) | Medium     | HashMap + ArrayList | https://leetcode.com/problems/insert-delete-getrandom-o1/   |
| 706 | Design HashMap               | Easy       | Implementation      | https://leetcode.com/problems/design-hashmap/               |
| 460 | LFU Cache                    | Hard       | HashMap + DLL       | https://leetcode.com/problems/lfu-cache/                    |

### Real-World Hash Table Usage

```
1. DATABASES
   └── Index structures
   └── Join operations (hash join)
   └── Query result caching
   └── Partition routing

2. CACHING SYSTEMS (Redis, Memcached)
   └── Key-value storage
   └── Session management
   └── Rate limiting counters

3. COMPILERS
   └── Symbol tables
   └── String interning
   └── Macro expansion

4. NETWORKING
   └── Routing tables
   └── Connection tracking
   └── Load balancer mappings

5. SECURITY
   └── Password storage (with salting)
   └── Digital signatures
   └── Certificate validation

6. DISTRIBUTED SYSTEMS
   └── Consistent hashing (load distribution)
   └── Distributed hash tables (DHT)
   └── Content-addressable storage
```

---

## Trees - Complete Guide

### WHY Trees Exist

```
Problem: Need hierarchical organization AND efficient operations

Array:  O(1) access, O(n) search, O(n) insert
List:   O(n) access, O(n) search, O(1) insert
BST:    O(log n) for all operations!

Key Insight:
Trees provide a BALANCED trade-off between access and modification.
Also naturally represent hierarchical data.
```

### Tree Variants

#### 1. Binary Tree

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
}

// Types of Binary Trees:

FULL: Every node has 0 or 2 children
        1
       / \
      2   3
     / \
    4   5

COMPLETE: All levels full except last, filled left to right
        1
       / \
      2   3
     / \  /
    4   5 6

PERFECT: All internal nodes have 2 children, all leaves same level
        1
       / \
      2   3
     / \ / \
    4  5 6  7

BALANCED: Height difference between subtrees ≤ 1
DEGENERATE: Every node has only one child (linked list)
```

#### 2. Binary Search Tree (BST)

```java
// Left < Root < Right

class BST {
    TreeNode root;

    TreeNode insert(TreeNode node, int val) {
        if (node == null) return new TreeNode(val);
        if (val < node.val) node.left = insert(node.left, val);
        else node.right = insert(node.right, val);
        return node;
    }

    TreeNode search(TreeNode node, int val) {
        if (node == null || node.val == val) return node;
        if (val < node.val) return search(node.left, val);
        return search(node.right, val);
    }

    TreeNode delete(TreeNode node, int val) {
        if (node == null) return null;
        if (val < node.val) node.left = delete(node.left, val);
        else if (val > node.val) node.right = delete(node.right, val);
        else {
            // Found node to delete
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            // Two children: replace with inorder successor
            TreeNode minRight = findMin(node.right);
            node.val = minRight.val;
            node.right = delete(node.right, minRight.val);
        }
        return node;
    }
}

Complexity:
├── Average: O(log n) for all operations
└── Worst (skewed): O(n) - degenerates to linked list
```

#### 3. AVL Tree (Self-Balancing BST)

```java
// Height-balanced: |height(left) - height(right)| ≤ 1

class AVLNode {
    int val, height;
    AVLNode left, right;
}

// Rotations to maintain balance:

RIGHT ROTATION (Left-Left case):
    z                    y
   / \                 /   \
  y   T4    ──►       x     z
 / \                 / \   / \
x   T3              T1 T2 T3 T4

LEFT ROTATION (Right-Right case):
  z                      y
 / \                   /   \
T1  y      ──►        z     x
   / \               / \   / \
  T2  x             T1 T2 T3 T4

LEFT-RIGHT (Left-Right case):
    z             z               x
   / \           / \            /   \
  y   T4  ──►   x   T4   ──►   y     z
 / \           / \            / \   / \
T1  x         y   T3         T1 T2 T3 T4
   / \       / \
  T2 T3     T1 T2

Complexity: O(log n) guaranteed for all operations
Used In: Databases, file systems
```

#### 4. Red-Black Tree

```java
// Properties:
// 1. Every node is red or black
// 2. Root is black
// 3. Leaves (NIL) are black
// 4. Red node's children are black
// 5. All paths to leaves have same black count

class RBNode {
    int val;
    boolean isRed;
    RBNode left, right, parent;
}

// Less rigid than AVL, fewer rotations on insert/delete
// Height ≤ 2 * log(n+1)

Used In:
├── Java TreeMap, TreeSet
├── C++ map, set, multimap, multiset
├── Linux kernel (process scheduling, memory management)
└── Nginx (timer management)
```

#### 5. B-Tree

```java
// Multi-way search tree optimized for disk access
// Each node can have many children

B-Tree of order m:
├── Each node has at most m children
├── Non-leaf nodes have at least ⌈m/2⌉ children
├── Root has at least 2 children
├── All leaves at same level
└── Non-leaf with k children has k-1 keys

Example (order 4):
                    [20]
                   /    \
           [10, 15]      [30, 40, 50]
          /  |  \        /   |   |   \
      [5,8][11,12][16,18] [25][35][45][60,70]

Complexity:
├── Search: O(log n)
├── Insert: O(log n)
├── Delete: O(log n)
└── Disk reads: O(logm n) - much fewer!

Used In:
├── Databases (indexes)
├── File systems (NTFS, ext4, HFS+)
└── Key-value stores
```

#### 6. B+ Tree

```java
// All data in leaves, internal nodes only for navigation
// Leaves form linked list for range queries

                    [20 | 50]
                   /    |    \
           [10|15]   [30|40]   [60|70]
              |         |         |
              ▼         ▼         ▼
         ┌─────┐   ┌─────┐   ┌─────┐
 Leaves: │5│10│─►│15│20│─►│30│40│─►│50│60│─►│70│80│
         └─────┘   └─────┘   └─────┘

Advantages over B-Tree:
├── All records in leaves (uniform access)
├── Leaf linked list for range queries
├── More keys per internal node (better fanout)
└── Consistent disk reads for any query

Used In: MySQL InnoDB, PostgreSQL, SQLite, Oracle
```

#### 7. Trie (Prefix Tree)

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];  // For lowercase English
    boolean isEndOfWord;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new TrieNode();
            }
            node = node.children[idx];
        }
        node.isEndOfWord = true;
    }

    boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEndOfWord;
    }

    boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }
}

Visual:
          root
         / | \
        a  b  c
       /       \
      p         a
     / \         \
    p   r         r
   /     \
  l       i
 /         \
e           c
(apple)    (apricot)

Complexity:
├── Insert: O(m) where m = word length
├── Search: O(m)
└── Space: O(ALPHABET_SIZE * m * n)

Use Cases:
├── Autocomplete
├── Spell checker
├── IP routing (longest prefix match)
├── Word games (Boggle, Scrabble)
└── DNA sequence matching
```

#### 8. Segment Tree

```java
// Tree for range queries and updates

class SegmentTree {
    int[] tree;
    int n;

    void build(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 0, 0, n - 1);
    }

    void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2*node+1, start, mid);
            build(arr, 2*node+2, mid+1, end);
            tree[node] = tree[2*node+1] + tree[2*node+2];
        }
    }

    int query(int l, int r) {
        return query(0, 0, n-1, l, r);
    }

    void update(int idx, int val) {
        update(0, 0, n-1, idx, val);
    }
}

Visual (Sum Segment Tree for [1, 3, 5, 7, 9, 11]):
                     [36]
                   /      \
              [9]           [27]
             /   \         /    \
          [4]   [5]     [16]    [11]
          / \            / \
        [1] [3]       [7] [9]

Complexity:
├── Build: O(n)
├── Query: O(log n)
├── Update: O(log n)

Use Cases:
├── Range sum/min/max queries
├── Range GCD/LCM
├── Interval scheduling
└── Computational geometry
```

#### 9. Fenwick Tree (Binary Indexed Tree)

```java
// Simpler than Segment Tree, for prefix sums

class FenwickTree {
    int[] tree;

    void update(int i, int delta) {
        for (; i < tree.length; i += i & (-i))
            tree[i] += delta;
    }

    int prefixSum(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i))
            sum += tree[i];
        return sum;
    }

    int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}

Complexity:
├── Update: O(log n)
├── Query: O(log n)
├── Space: O(n)

Advantage: Simpler code, less memory than Segment Tree
```

#### 10. Suffix Tree

```java
// Tree of all suffixes of a string
// Enables O(m) pattern matching where m = pattern length

String: "banana$"
Suffixes: banana$, anana$, nana$, ana$, na$, a$, $

              root
            / | | \ \
           a  b n  $ ...
          /   |  \
         na  an  an
        /  \  |   \
       na$  $ ana$ a$

Use Cases:
├── Pattern matching
├── Longest repeated substring
├── Longest common substring
├── Palindrome detection
└── DNA sequence analysis

Modern Alternative: Suffix Array + LCP Array (less space)
```

### LeetCode Problems - Trees

| #   | Problem                           | Difficulty | Pattern   | Link                                                             |
| --- | --------------------------------- | ---------- | --------- | ---------------------------------------------------------------- |
| 94  | Binary Tree Inorder Traversal     | Easy       | DFS       | https://leetcode.com/problems/binary-tree-inorder-traversal/     |
| 104 | Maximum Depth of Binary Tree      | Easy       | DFS/BFS   | https://leetcode.com/problems/maximum-depth-of-binary-tree/      |
| 226 | Invert Binary Tree                | Easy       | Recursion | https://leetcode.com/problems/invert-binary-tree/                |
| 98  | Validate Binary Search Tree       | Medium     | Inorder   | https://leetcode.com/problems/validate-binary-search-tree/       |
| 102 | Binary Tree Level Order Traversal | Medium     | BFS       | https://leetcode.com/problems/binary-tree-level-order-traversal/ |
| 208 | Implement Trie                    | Medium     | Trie      | https://leetcode.com/problems/implement-trie-prefix-tree/        |
| 124 | Binary Tree Maximum Path Sum      | Hard       | DFS       | https://leetcode.com/problems/binary-tree-maximum-path-sum/      |

### Real-World Tree Usage

```
1. DATABASES
   └── B+ Tree indexes
   └── Query execution plans (tree structure)
   └── Parse trees for SQL

2. FILE SYSTEMS
   └── Directory structure (N-ary tree)
   └── B-Tree for file allocation
   └── Merkle trees for integrity

3. COMPILERS
   └── Abstract Syntax Trees (AST)
   └── Parse trees
   └── Expression trees

4. NETWORKING
   └── Routing tables (Trie)
   └── DOM trees (HTML/XML)
   └── Protocol buffers

5. AI/MACHINE LEARNING
   └── Decision trees
   └── Random forests
   └── Game trees (minimax)

6. OPERATING SYSTEMS
   └── Process trees
   └── Virtual memory (page tables)
   └── Device trees
```

---

## Heaps - Complete Guide

### WHY Heaps Exist

```
Problem: Efficiently find min/max element

Sorted Array:
├── Find min/max: O(1)
├── Insert: O(n) - shift elements
└── Delete min/max: O(n)

Heap:
├── Find min/max: O(1)
├── Insert: O(log n)
└── Delete min/max: O(log n)

Key Insight:
Heaps sacrifice sorted order for faster operations.
Only guarantee: root is min/max.
```

### HOW Heaps Work

```
Binary Heap (Complete Binary Tree):

MAX HEAP: Parent ≥ Children
              100
             /    \
           90      80
          / \     / \
         70  60  50  40

MIN HEAP: Parent ≤ Children
              10
             /    \
           20      30
          / \     / \
         40  50  60  70

Array Representation:
Index:    0   1   2   3   4   5   6
Array: [100, 90, 80, 70, 60, 50, 40]

Parent(i) = (i-1) / 2
LeftChild(i) = 2*i + 1
RightChild(i) = 2*i + 2
```

### Heap Operations

```java
class MinHeap {
    int[] heap;
    int size;

    void insert(int val) {
        heap[size] = val;
        siftUp(size);
        size++;
    }

    void siftUp(int i) {
        while (i > 0 && heap[i] < heap[parent(i)]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    int extractMin() {
        int min = heap[0];
        heap[0] = heap[size - 1];
        size--;
        siftDown(0);
        return min;
    }

    void siftDown(int i) {
        while (leftChild(i) < size) {
            int smallest = i;
            if (heap[leftChild(i)] < heap[smallest])
                smallest = leftChild(i);
            if (rightChild(i) < size && heap[rightChild(i)] < heap[smallest])
                smallest = rightChild(i);
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }

    // Build heap from array: O(n)
    void heapify(int[] arr) {
        heap = arr;
        size = arr.length;
        // Start from last non-leaf node
        for (int i = size / 2 - 1; i >= 0; i--) {
            siftDown(i);
        }
    }
}
```

### Heap Variants

#### 1. Min Heap / Max Heap

```java
// Min Heap: PriorityQueue default in Java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max Heap: Reverse comparator
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
```

#### 2. D-ary Heap

```java
// Each node has d children instead of 2
// Trade-off: Shallower tree vs more comparisons per level

// d=4 Heap:
              1
         /  /  \  \
        5  3   8   10
      / | | \
     12 15 20 25

Benefits:
├── Better cache performance (fewer levels)
├── Faster insert (shallower tree)
└── Used in Dijkstra's algorithm optimization
```

#### 3. Fibonacci Heap

```java
// Advanced heap with better amortized complexity

Operations:
├── Insert: O(1)
├── Find min: O(1)
├── Delete min: O(log n) amortized
├── Decrease key: O(1) amortized  // This is the key advantage!
└── Merge: O(1)

Use Case: Dijkstra's, Prim's algorithm optimization
Drawback: Complex implementation, high constants
```

#### 4. Binomial Heap

```java
// Collection of binomial trees
// Good for merge operation

Merge: O(log n)  // Better than binary heap's O(n)

Use Case: When frequent merging of heaps needed
```

#### 5. Pairing Heap

```java
// Simpler than Fibonacci, similar performance

Operations:
├── Insert: O(1)
├── Find min: O(1)
├── Delete min: O(log n) amortized
├── Decrease key: O(log log n) amortized
└── Merge: O(1)

Use Case: Practical alternative to Fibonacci heap
```

#### 6. Double-Ended Priority Queue (DEPQ)

```java
// Support both min and max extraction

Implementations:
├── Min-Max Heap
├── Interval Heap
└── Two heaps (min + max)

class MinMaxHeap {
    // Alternating levels: min, max, min, max...
    // Even levels: min-heap property
    // Odd levels: max-heap property
}

Use Case: Sliding window median, range queries
```

#### 7. Indexed Priority Queue

```java
// PQ that supports update by key

class IndexedPQ<Key extends Comparable<Key>> {
    int[] pq;      // Binary heap
    int[] qp;      // Inverse: qp[pq[i]] = i
    Key[] keys;    // Keys indexed by integer

    void changeKey(int i, Key key) {
        keys[i] = key;
        swim(qp[i]);
        sink(qp[i]);
    }
}

Use Case: Dijkstra's, Prim's with updates
```

### Two Heaps Pattern

```java
// Maintain two heaps for median finding

class MedianFinder {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());

        if (minHeap.size() > maxHeap.size()) {
            maxHeap.offer(minHeap.poll());
        }
    }

    double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.peek();
        }
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}

Visual:
     maxHeap (smaller half)    minHeap (larger half)
           [5]                      [6]
          / \                      / \
        [3] [4]                  [7] [8]

Median = (5 + 6) / 2 = 5.5
```

### LeetCode Problems - Heaps

| #   | Problem                         | Difficulty | Pattern           | Link                                                           |
| --- | ------------------------------- | ---------- | ----------------- | -------------------------------------------------------------- |
| 215 | Kth Largest Element in an Array | Medium     | QuickSelect/Heap  | https://leetcode.com/problems/kth-largest-element-in-an-array/ |
| 347 | Top K Frequent Elements         | Medium     | Bucket Sort/Heap  | https://leetcode.com/problems/top-k-frequent-elements/         |
| 295 | Find Median from Data Stream    | Hard       | Two Heaps         | https://leetcode.com/problems/find-median-from-data-stream/    |
| 23  | Merge k Sorted Lists            | Hard       | Min Heap          | https://leetcode.com/problems/merge-k-sorted-lists/            |
| 703 | Kth Largest Element in a Stream | Easy       | Min Heap          | https://leetcode.com/problems/kth-largest-element-in-a-stream/ |
| 973 | K Closest Points to Origin      | Medium     | Max Heap          | https://leetcode.com/problems/k-closest-points-to-origin/      |
| 621 | Task Scheduler                  | Medium     | Max Heap + Greedy | https://leetcode.com/problems/task-scheduler/                  |

### Real-World Heap Usage

```
1. OPERATING SYSTEMS
   └── Process scheduling (priority)
   └── Timer management
   └── Memory management

2. GRAPH ALGORITHMS
   └── Dijkstra's shortest path
   └── Prim's MST
   └── A* search

3. EVENT-DRIVEN SIMULATION
   └── Event queue (by time)
   └── Scheduled tasks

4. DATA COMPRESSION
   └── Huffman coding

5. NETWORKING
   └── Bandwidth management (QoS)
   └── Connection scheduling

6. DATABASES
   └── External sorting (k-way merge)
   └── Top-K queries
```

---

## Graphs - Complete Guide

### WHY Graphs Exist

```
Problem: Represent relationships between entities

Trees: Hierarchical, one parent per node
Graphs: Any-to-any relationships

Real-World Modeled by Graphs:
├── Social networks (friends)
├── Road networks (cities, distances)
├── Internet (web pages, links)
├── Dependencies (tasks, prerequisites)
└── Molecules (atoms, bonds)
```

### Graph Representations

```java
// 1. Adjacency Matrix
int[][] matrix = new int[n][n];
matrix[u][v] = weight;  // Edge from u to v

Pros: O(1) edge check, good for dense graphs
Cons: O(n²) space

Visual:
    0  1  2  3
  ┌──────────────
0 │ 0  1  1  0
1 │ 1  0  1  1
2 │ 1  1  0  0
3 │ 0  1  0  0

// 2. Adjacency List
List<List<int[]>> adj = new ArrayList<>();
adj.get(u).add(new int[]{v, weight});

Pros: O(V + E) space, good for sparse graphs
Cons: O(degree) edge check

Visual:
0 → [1, 2]
1 → [0, 2, 3]
2 → [0, 1]
3 → [1]

// 3. Edge List
List<int[]> edges = new ArrayList<>();
edges.add(new int[]{u, v, weight});

Pros: Simple, good for edge-centric algorithms (Kruskal's)
Cons: O(E) for any query
```

### Graph Variants

#### 1. Directed vs Undirected

```
UNDIRECTED:
    1 ─── 2
    │     │
    3 ─── 4

Edges: {1,2}, {1,3}, {2,4}, {3,4}
Each edge represents bidirectional relationship

DIRECTED:
    1 ──► 2
    │     │
    ▼     ▼
    3 ◄── 4

Edges: (1,2), (1,3), (2,4), (4,3)
Each edge has direction
```

#### 2. Weighted vs Unweighted

```
WEIGHTED:
    1 ──5── 2
    │       │
    3      10
    │       │
    3 ──7── 4

Edge weights: distances, costs, capacities

UNWEIGHTED:
    1 ───── 2
    │       │
    │       │
    3 ───── 4

All edges have implicit weight 1
```

#### 3. Cyclic vs Acyclic

```
CYCLIC:
    1 ──► 2
    ▲     │
    │     ▼
    4 ◄── 3

Contains at least one cycle

DAG (Directed Acyclic Graph):
    1 ──► 2
    │     │
    ▼     ▼
    3 ──► 4

No cycles - used for dependencies, scheduling
```

#### 4. Connected vs Disconnected

```
CONNECTED (Undirected):
All vertices reachable from any vertex

STRONGLY CONNECTED (Directed):
All vertices reachable from any vertex following edge directions

WEAKLY CONNECTED (Directed):
Connected if we ignore edge directions

DISCONNECTED:
    1 ─── 2    5 ─── 6
    │     │
    3 ─── 4

Multiple components
```

#### 5. Bipartite Graph

```
    Set A      Set B
     1    ╲    ╱    4
           ╲╱
     2    ╱╲    ╱    5
           ╱╲
     3    ╱    ╲    6

Edges only between sets, not within
Use: Matching problems, 2-coloring

Detection: BFS/DFS coloring - if odd cycle, not bipartite
```

#### 6. Complete Graph

```
Every vertex connected to every other vertex

    1 ─── 2
    │ ╲ ╱ │
    │  ╳  │
    │ ╱ ╲ │
    3 ─── 4

Edges: n(n-1)/2 for undirected
       n(n-1) for directed
```

### Graph Algorithms

#### 1. BFS (Breadth-First Search)

```java
void bfs(int start) {
    Queue<Integer> queue = new LinkedList<>();
    boolean[] visited = new boolean[n];

    queue.offer(start);
    visited[start] = true;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        process(node);

        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

Use Cases:
├── Shortest path in unweighted graph
├── Level-order traversal
├── Finding connected components
└── Bipartite check
```

#### 2. DFS (Depth-First Search)

```java
void dfs(int node, boolean[] visited) {
    visited[node] = true;
    process(node);

    for (int neighbor : adj.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, visited);
        }
    }
}

void dfsIterative(int start) {
    Stack<Integer> stack = new Stack<>();
    boolean[] visited = new boolean[n];

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (!visited[node]) {
            visited[node] = true;
            process(node);
            for (int neighbor : adj.get(node)) {
                stack.push(neighbor);
            }
        }
    }
}

Use Cases:
├── Path finding
├── Cycle detection
├── Topological sort
├── Strongly connected components
└── Backtracking problems
```

#### 3. Dijkstra's Algorithm

```java
// Single source shortest path (non-negative weights)

int[] dijkstra(int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], d = curr[1];

        if (d > dist[u]) continue;  // Skip outdated

        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}

Complexity: O((V + E) log V) with binary heap
Use Cases: GPS navigation, network routing
```

#### 4. Bellman-Ford Algorithm

```java
// Single source shortest path (handles negative weights)

int[] bellmanFord(int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges n-1 times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // Check for negative cycle
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            throw new RuntimeException("Negative cycle detected");
        }
    }

    return dist;
}

Complexity: O(VE)
Use Cases: Currency arbitrage detection, routing protocols (RIP)
```

#### 5. Floyd-Warshall Algorithm

```java
// All-pairs shortest path

int[][] floydWarshall(int[][] graph) {
    int[][] dist = new int[n][n];
    // Initialize with graph weights

    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != INF && dist[k][j] != INF) {
                    dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
                }
            }
        }
    }
    return dist;
}

Complexity: O(V³)
Use Cases: Dense graphs, transitive closure
```

#### 6. Topological Sort

```java
// Order vertices so all edges go left to right
// Only for DAG

// Kahn's Algorithm (BFS)
List<Integer> topologicalSort() {
    int[] inDegree = new int[n];
    for (int u = 0; u < n; u++) {
        for (int v : adj.get(u)) {
            inDegree[v]++;
        }
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    List<Integer> result = new ArrayList<>();
    while (!queue.isEmpty()) {
        int u = queue.poll();
        result.add(u);
        for (int v : adj.get(u)) {
            if (--inDegree[v] == 0) {
                queue.offer(v);
            }
        }
    }

    if (result.size() != n) throw new RuntimeException("Cycle detected");
    return result;
}

Use Cases:
├── Task scheduling
├── Build systems (make, Maven)
├── Course prerequisites
└── Data processing pipelines
```

#### 7. Minimum Spanning Tree

```java
// Kruskal's Algorithm (Edge-based)
int kruskal() {
    // Sort edges by weight
    Collections.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int mstWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (uf.find(u) != uf.find(v)) {
            uf.union(u, v);
            mstWeight += w;
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }
    return mstWeight;
}

// Prim's Algorithm (Vertex-based)
int prim() {
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{0, 0});  // Start from vertex 0

    int mstWeight = 0;
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], w = curr[1];

        if (inMST[u]) continue;
        inMST[u] = true;
        mstWeight += w;

        for (int[] edge : adj.get(u)) {
            int v = edge[0], weight = edge[1];
            if (!inMST[v]) {
                pq.offer(new int[]{v, weight});
            }
        }
    }
    return mstWeight;
}

Use Cases: Network design, clustering
```

### LeetCode Problems - Graphs

| #    | Problem                         | Difficulty | Pattern          | Link                                                           |
| ---- | ------------------------------- | ---------- | ---------------- | -------------------------------------------------------------- |
| 200  | Number of Islands               | Medium     | DFS/BFS          | https://leetcode.com/problems/number-of-islands/               |
| 207  | Course Schedule                 | Medium     | Topological Sort | https://leetcode.com/problems/course-schedule/                 |
| 133  | Clone Graph                     | Medium     | DFS/BFS          | https://leetcode.com/problems/clone-graph/                     |
| 743  | Network Delay Time              | Medium     | Dijkstra         | https://leetcode.com/problems/network-delay-time/              |
| 787  | Cheapest Flights Within K Stops | Medium     | Bellman-Ford     | https://leetcode.com/problems/cheapest-flights-within-k-stops/ |
| 1584 | Min Cost to Connect All Points  | Medium     | MST              | https://leetcode.com/problems/min-cost-to-connect-all-points/  |
| 269  | Alien Dictionary                | Hard       | Topological Sort | https://leetcode.com/problems/alien-dictionary/                |

### Real-World Graph Usage

```
1. SOCIAL NETWORKS
   └── Friend recommendations (BFS)
   └── Influence analysis (PageRank)
   └── Community detection

2. NAVIGATION
   └── GPS routing (Dijkstra, A*)
   └── Flight booking (shortest path)
   └── Traffic optimization

3. INTERNET
   └── Web crawling (BFS/DFS)
   └── PageRank algorithm
   └── Network routing protocols

4. DEPENDENCIES
   └── Package managers (npm, pip)
   └── Build systems (make)
   └── Database transactions

5. RECOMMENDATIONS
   └── Netflix/Amazon recommendations
   └── Graph neural networks
   └── Knowledge graphs

6. BIOLOGY
   └── Protein interaction networks
   └── Phylogenetic trees
   └── Drug discovery
```

---

## Advanced Data Structures

### 1. Disjoint Set (Union-Find)

```java
class UnionFind {
    int[] parent;
    int[] rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;

        // Union by rank
        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
    }
}

Complexity: O(α(n)) ≈ O(1) for practical purposes
(α is inverse Ackermann function)

Use Cases:
├── Kruskal's MST
├── Detect cycles in undirected graph
├── Network connectivity
├── Image segmentation
└── Percolation problems
```

### 2. LRU Cache

```java
class LRUCache {
    private Map<Integer, Node> cache;
    private Node head, tail;
    private int capacity;

    class Node {
        int key, value;
        Node prev, next;
    }

    public LRUCache(int capacity) {
        this.capacity = capacity;
        cache = new HashMap<>();
        head = new Node();
        tail = new Node();
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        Node node = cache.get(key);
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (cache.containsKey(key)) {
            Node node = cache.get(key);
            node.value = value;
            moveToHead(node);
        } else {
            Node node = new Node();
            node.key = key;
            node.value = value;
            cache.put(key, node);
            addToHead(node);

            if (cache.size() > capacity) {
                Node removed = removeTail();
                cache.remove(removed.key);
            }
        }
    }
}

Use Cases:
├── Browser cache
├── Database buffer pool
├── Operating system page cache
├── CDN caching
└── API response caching
```

### 3. LFU Cache

```java
// Least Frequently Used - evict least frequently accessed

class LFUCache {
    private Map<Integer, Node> keyToNode;
    private Map<Integer, DoublyLinkedList> freqToList;
    private int minFreq;
    private int capacity;

    // Implementation tracks access frequency
    // On eviction, remove least frequent (and oldest if tie)
}

Use Cases:
├── CDN caching (popular content stays)
├── Database query caching
└── Web application caching
```

### 4. Interval Tree

```java
// Store intervals, support overlap queries

class IntervalTree {
    // Each node stores an interval and max endpoint in subtree

    List<Interval> queryOverlap(Interval query) {
        // Find all intervals that overlap with query
        // O(log n + k) where k = number of overlapping intervals
    }
}

Use Cases:
├── Calendar scheduling
├── Database range queries
├── Genomics (gene overlap)
└── Graphics (collision detection)
```

### 5. KD-Tree (K-Dimensional Tree)

```java
// BST for multi-dimensional data

class KDTree {
    // Alternates splitting dimension at each level
    // 2D: x, y, x, y, ...

    List<Point> rangeSearch(Rectangle rect) {
        // Find all points in rectangle
        // O(√n + k) for 2D
    }

    Point nearestNeighbor(Point query) {
        // Find closest point
        // O(log n) average
    }
}

Use Cases:
├── Nearest neighbor search
├── Geographic queries
├── Machine learning (KNN)
├── Computer graphics
└── Computational geometry
```

### 6. Persistent Data Structures

```java
// Maintain all previous versions

class PersistentStack<T> {
    // Each operation creates new version
    // Old versions still accessible
    // Uses structural sharing

    PersistentStack<T> push(T item) {
        // Returns new version with item added
    }

    Pair<T, PersistentStack<T>> pop() {
        // Returns item and new version
    }
}

Use Cases:
├── Version control (Git)
├── Undo/Redo systems
├── Functional programming
├── Database snapshots
└── Time-travel debugging
```

---

## Specialized Data Structures

### 1. Rope (String Data Structure)

```java
// Efficient string operations for long strings

class Rope {
    // Binary tree where leaves are string chunks
    // Enables O(log n) insert, delete, access

    void insert(int pos, String str) { }
    void delete(int start, int end) { }
    char charAt(int pos) { }
}

Use Cases:
├── Text editors (for long documents)
├── DNA sequence manipulation
└── Large document processing
```

### 2. Spatial Indexing (R-Tree, Quadtree)

```java
// Index spatial data for range queries

// Quadtree: Divide 2D space into 4 quadrants recursively
class Quadtree {
    // Good for: 2D points, collision detection
}

// R-Tree: Group nearby objects in bounding rectangles
class RTree {
    // Good for: Rectangles, polygons
    // Used in: PostGIS, MongoDB
}

Use Cases:
├── Geographic databases (PostGIS)
├── Game collision detection
├── Computer graphics
└── Map applications
```

### 3. Merkle Tree (Hash Tree)

```java
// Tree of hashes for data integrity

class MerkleTree {
    // Leaf: hash of data block
    // Internal: hash of children's hashes
    // Root: single hash representing all data

    boolean verify(byte[] data, byte[] rootHash, List<byte[]> proof) {
        // Verify data belongs to tree with O(log n) proof
    }
}

Use Cases:
├── Git (file integrity)
├── Blockchain (transaction verification)
├── IPFS (content addressing)
├── Certificate transparency
└── P2P file sharing (BitTorrent)
```

### 4. HyperLogLog (Cardinality Estimation)

```java
// Estimate count of distinct elements

class HyperLogLog {
    // Uses ~12KB to estimate billions of unique items
    // 2% standard error

    void add(Object item) { }
    long estimate() { }
}

Use Cases:
├── Unique visitor counting
├── Database query optimization
├── Network traffic analysis
└── Big data analytics
```

---

## Real-World Usage in Modern Systems

### 1. Databases

```
MySQL/PostgreSQL:
├── B+ Tree indexes (primary, secondary)
├── Hash indexes (equality queries)
├── Heap files (table data)
├── Buffer pool (LRU cache)
└── WAL (write-ahead log as queue)

Redis:
├── Skip List (sorted sets)
├── Hash Table (keys, hash type)
├── Linked List (lists)
├── Bit arrays (HyperLogLog)
└── Radix tree (cluster slots)

Cassandra:
├── LSM Tree (write-optimized)
├── Bloom filters (reduce disk reads)
├── Consistent hashing (partition)
└── Merkle trees (repair)
```

### 2. Operating Systems

```
Linux Kernel:
├── Red-Black Tree (process scheduling CFS)
├── Radix Tree (page cache)
├── Hash Table (inode cache)
├── Linked Lists (run queues)
├── B-Tree (file systems)
└── Skip List (timer wheel)
```

### 3. Web Technologies

```
Browsers:
├── DOM (N-ary tree)
├── History (doubly linked list)
├── Cache (LRU hash map)
└── JS engine (AST trees)

Search Engines:
├── Inverted index (hash + posting lists)
├── Trie (autocomplete)
├── Graph (PageRank)
└── KD-Tree (geospatial)
```

### 4. Distributed Systems

```
Kafka:
├── Commit log (append-only)
├── Partition (ring buffer concept)
├── Consumer groups (hash assignment)
└── Replication (chain replication)

Kubernetes:
├── etcd (B+ tree)
├── Scheduler (priority queue)
├── Service mesh (consistent hashing)
└── ConfigMaps (hash maps)
```

---

## Learning Roadmap

### Phase 1: Foundation (Weeks 1-4)

```
Week 1: Arrays, Strings
Week 2: Linked Lists, Stacks, Queues
Week 3: Hash Tables
Week 4: Trees (Binary, BST, traversals)
```

### Phase 2: Intermediate (Weeks 5-8)

```
Week 5: Heaps, Priority Queues
Week 6: Graphs (BFS, DFS)
Week 7: Graph algorithms (Dijkstra, Topological Sort)
Week 8: Tries, Union-Find
```

### Phase 3: Advanced (Weeks 9-12)

```
Week 9: AVL/Red-Black Trees, Segment Trees
Week 10: Advanced Graph algorithms
Week 11: Specialized structures (Bloom filter, Skip list)
Week 12: System design applications
```

### Practice Strategy

```
Daily:
├── 2-3 LeetCode problems
├── Review one data structure's internals
├── Implement one operation from scratch

Weekly:
├── One mock interview
├── One system design discussion
├── Review and revise weak areas
```

---

## Key Takeaways

1. **Understand WHY before WHAT** - Know the problem a DS solves
2. **Master the fundamentals** - Arrays, Lists, Trees, Graphs
3. **Know your trade-offs** - Time vs Space, Read vs Write
4. **Practice implementations** - Write from scratch, not just use APIs
5. **Connect to real systems** - See how production systems use DS
6. **Solve problems** - Theory without practice is useless

---

_"Data structures + Algorithms = Programs. Master both, master programming."_

---

# 🚀 PART FINAL: ADVANCED TOPICS & MODERN ALGORITHMS

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED DSA - FROM BASICS TO CUTTING EDGE                               ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  This section covers advanced topics that build on the fundamentals:              ║
║  • String matching algorithms (beyond basic search)                               ║
║  • Randomized algorithms and their applications                                   ║
║  • Approximate algorithms for NP-hard problems                                    ║
║  • Modern data structures used in production systems                              ║
║  • Interview-level advanced patterns                                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```


---

> **Next**: [Part 2: Advanced Algorithms & Interview Patterns](02b_Ultimate_DSA_Advanced.md)
