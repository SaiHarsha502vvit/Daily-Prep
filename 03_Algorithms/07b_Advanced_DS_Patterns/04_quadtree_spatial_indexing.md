# Quadtree (Spatial Indexing)

> **Navigation**: [← Skip List](03_skip_list.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [When to Use What (decision Flowchart) →](05_when_to_use_what_decision_flowchart.md)
> Page 4 of 5 in **Fenwick & Segment Trees — Advanced Data Structure Patterns**


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

```text
MERKLE TREE: Tree where each leaf is hash of data block,
             and each non-leaf is hash of its children's hashes

Used in: Blockchain, Git, Databases (PostgreSQL), P2P networks

STRUCTURE:

                   [Root Hash: abcd1234]
                          /        \
             [Hash: ab12]           [Hash: cd34]
              /       \              /        \
        [H: a1]    [H: b2]     [H: c3]     [H: d4]
           |          |           |           |
        Block A   Block B     Block C     Block D

 VERIFICATION:
 To verify Block C is unchanged:
 1. Hash Block C → should match [H: c3]
 2. Combine with [H: d4] → should match [Hash: cd34]
 3. Combine with [Hash: ab12] → should match Root

 Only need O(log n) hashes to verify any block!
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

## 🧩 Part 12: Leetcode Problems By Data Structure

### Practice Problems Mapped to DS

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

## 📋 Part 13: Complexity Cheat Sheet (extended)

**COMPLETE COMPLEXITY REFERENCE**

| DATA STRUCTURE | ACCESS | SEARCH | INSERT | DELETE | SPACE |
| --- | --- | --- | --- | --- | --- |
| Array<br>Dynamic Array<br>Singly Linked List<br>Doubly Linked List<br>Stack<br>Queue<br>Hash Table<br>BST (balanced)<br>BST (worst)<br>AVL Tree<br>Red-Black Tree<br>B-Tree<br>Heap<br>Trie<br>Segment Tree<br>Fenwick Tree<br>Sparse Table<br>Disjoint Set<br>Skip List<br>Bloom Filter<br>QuadTree | O(1)<br>O(1)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>N/A<br>O(logn)<br>O(n)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(1)†<br>O(m)<br>O(logn)<br>N/A<br>O(1)<br>N/A<br>O(logn)<br>N/A<br>O(logn) | O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(1)*<br>O(logn)<br>O(n)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(n)<br>O(m)<br>O(logn)<br>O(logn)<br>O(1)<br>O(α)<br>O(logn)<br>O(k)<br>O(logn) | O(n)<br>O(1)*<br>O(1)<br>O(1)<br>O(1)<br>O(1)<br>O(1)*<br>O(logn)<br>O(n)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(m)<br>O(logn)<br>O(logn)<br>N/A<br>O(α)<br>O(logn)<br>O(k)<br>O(logn) | O(n)<br>O(n)<br>O(1)<br>O(1)<br>O(1)<br>O(1)<br>O(1)*<br>O(logn)<br>O(n)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(logn)<br>O(m)<br>O(logn)<br>N/A<br>N/A<br>N/A<br>O(logn)<br>N/A<br>O(logn) | O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(n)<br>O(ALPHABET*m*n)<br>O(4n)<br>O(n)<br>O(n log n)<br>O(n)<br>O(n log n)*<br>O(m) bits<br>O(n) |

```
* = amortized or average case
† = O(1) for peek/min, O(log n) for extract
α = inverse Ackermann function ≈ O(1) for practical purposes
m = string/key length
k = number of hash functions
```

---

[← Skip List](03_skip_list.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [When to Use What (decision Flowchart) →](05_when_to_use_what_decision_flowchart.md)
