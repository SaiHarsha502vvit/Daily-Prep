> **Navigation**: [< Previous Chapter](01e_HashTable.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01g_DS_Internals.md)

---

# 🌳 Part 7: Trees

### 5W1H: Deep Understanding of Trees

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A Tree is a hierarchical data structure consisting of nodes   ║
║        connected by edges, starting from a single root node.         ║
║                                                                      ║
║  WHY:  Linear structures (arrays, lists) only represent sequences.   ║
║        Trees represent hierarchies (parent-child). Furthermore,      ║
║        balanced trees enable O(log N) operations by eliminating      ║
║        half the remaining search space at every step.                ║
║                                                                      ║
║  WHO:  Engineers working with databases, file systems, compilers,    ║
║        and DOM rendering (browsers).                                 ║
║                                                                      ║
║  WHEN: Use when data has natural hierarchy or requires sorted access.║
║        ✔ HTML DOM / File Systems (general trees)                     ║
║        ✔ Databases (B-Trees)                                         ║
║        ✔ Autocomplete / dictionaries (Tries)                         ║
║        ✔ Priority Queues (Heaps)                                     ║
║        ✘ When you need O(1) exact match lookup (use HashMap)         ║
║                                                                      ║
║  HOW:  Pointers! A node contains data and references (left, right)   ║
║        to its children. Operations often use recursion (DFS) or a    ║
║        queue (BFS) to traverse the structure.                        ║
╚══════════════════════════════════════════════════════════════════════╝
```

## Historical Evolution of Tree Data Structures

Trees are not a single invention — they are a **50-year family of solutions**, each invented to fix a specific weakness of its predecessor. Understanding the _why_ behind each variant transforms memorization into genuine insight.

---

## 🎓 University Proof Corner

> **MIT 6.006 L10–L12 / KTH DD1352 / RWTH Aachen Algo I layer** — Why BST search returns the right answer, why AVL rotations preserve correctness, and why heap extract-min returns the minimum.

### BST Correctness — Search Finds the Key iff It Exists

**Invariant** (BST property): For every node `n`: all keys in `n.left` < `n.key` < all keys in `n.right`.

**Search proof** (by induction on tree depth):
- **Base case (null node)**: Return "not found". Correct. ✓
- **Recursive case**: At node `n`, compare target `k` to `n.key`:
  - If `k < n.key`: by invariant, `k` can only be in `n.left`. Recurse.
  - If `k > n.key`: by invariant, `k` can only be in `n.right`. Recurse.
  - If `k == n.key`: return `n`. Found.

Each step shrinks the search space by the invariant. If `k` exists, we find it; if not, we exhaust the tree. ✓

**Why insert preserves the BST property**: Recursively descend by the same comparison; insert the new leaf in the only position that satisfies the invariant for the path. The new leaf is the only node changed; the invariant holds for every ancestor by the comparison. ✓

**Why delete is the hardest operation**: Two cases:
1. **Leaf or single-child node**: Replace with the only child (or null). Invariant holds trivially.
2. **Two-child node**: Replace with in-order successor (min of right subtree). The successor is a leaf or single-child, so case 1 applies to remove it. Invariant holds because the successor is greater than all left-subtree keys and less than all right-subtree keys beyond it.

### Heap Property — Extract-Min Returns the Minimum

**Invariant** (heap-order): For every node `n`, `n.key` ≤ `n.left.key` and `n.key` ≤ `n.right.key`.

**`extract-min` proof**:
1. Save root value (the minimum, by invariant).
2. Move last element of array to root.
3. `siftDown(root)`: while either child is smaller, swap with the smaller child.

**SiftDown invariant**: After each swap, the subtree rooted at the new position is heap-ordered (the swapped value is ≤ both its new children). The path of swaps follows the unique path where the smallest element must end up. When siftDown reaches a leaf or a position where the value is ≤ both children, the heap property is restored. ✓

### AVL Rotations Preserve the BST Property

After a rotation, the **in-order traversal** of the rotated subtree is unchanged. Since the BST property is exactly "in-order traversal gives sorted keys", any rotation preserves the BST property by definition.

**Balance invariant** (AVL): For every node, `|height(left) − height(right)| ≤ 1`.

After a single insertion, at most one node on the path back to root has balance factor 2 (or −2). The rotation that fixes it restores balance locally. By induction up the path, the whole tree is balanced again. Height remains O(log n). ✓

> Full proofs: [A1 — DS Correctness Invariants](A1_DS_Correctness_Invariants.md) (Sections 6, 7)

### Timeline: 1960s–2020s

| Year    | Milestone                                      | Inventor                     | Motivation                                                                                                                                                                                                                          |
| ------- | ---------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1962    | **AVL Trees** — first self-balancing BST       | Adelson-Velsky & Landis      | After a bouncing-marble game experiment, they proved that keeping left/right subtree heights balanced guaranteed `O(log N)` operations                                                                                              |
| 1965–70 | **B-Trees** for external storage               | Bayer (Boeing)               | Disk I/O cost dominated memory cost. B-trees maximize fan-out per page (typically 4 KB pages), reducing disk seeks from `O(log_m N)` to near-constant                                                                               |
| 1972    | B-trees adopted by IBM System R                | IBM Research                 | First commercial database index; B-trees became the backbone of relational databases                                                                                                                                                |
| 1978    | **Red-Black Trees** formalized                 | Guibas & Sedgewick           | Needed a simpler rebalancing color scheme than AVL (fewer rotations on insert); adopted by JDK `TreeMap` (stable permalink: [OpenJDK TreeMap.java](https://github.com/openjdk/jdk/blob/jdk17/src/java.base/java/util/TreeMap.java)) |
| 1978    | **Splay Trees** — self-adjusting BST           | Tarjan                       | Frequently accessed nodes "splay" to the root; amortized `O(log N)` without explicit balance bookkeeping                                                                                                                            |
| 1989    | _Self-adjusting Binary Search Trees_ published | Sleator & Tarjan             | Landmark paper formalizing splay trees and the working-set theorem                                                                                                                                                                  |
| 1996    | **LSM-Trees** (Log-Structured Merge-Tree)      | O'Neil et al.                | SSDs made random B-tree writes expensive. LSM trees batch sequential writes to immutable SST files; read cost trades off for write amplification reduction                                                                          |
| 2003    | **Cache-Oblivious B-Trees**                    | Bender, Farach-Colton et al. | Optimal performance across all CPU cache levels without knowing cache parameters                                                                                                                                                    |
| 2006    | **Mass-Tree, B\u03b5-Trees**                   | several                      | Designed for modern SSDs and NVMe; optimize for block-device characteristics                                                                                                                                                        |
| 2010s   | **Bw-Trees**                                   | Microsoft (2013)             | Latch-free B-tree variant for high-concurrency OLTP; used in Microsoft SQL Server Hekaton                                                                                                                                           |
| 2010s   | **Partitioned B-Trees**                        | distributed systems          | Used in Apache HBase, Google Spanner for geo-distributed tables                                                                                                                                                                     |
| 2017+   | **Learned Indexes** (SageDB)                   | Kraska et al.                | Replace B-tree index structures with ML models; B-tree lookup becomes model inference                                                                                                                                               |

### Named Predecessors — The Chain of Reasoning

```
Linear Search → Binary Search → BST → AVL → Red-Black → B-Tree → B+Tree → LSM-Tree
    ↓              ↓           ↓       ↓         ↓          ↓         ↓          ↓
 Sequential   Divide by 2   Pointer  Height    Color     Disk page  Leaf-only  Immutable
 comparison   on sorted      chain   bound     labels    fan-out    linked     SST files
               array        needed  enforced  enforced   per node   list only
```

- **Why AVL was invented (1962):** The unbalancing problem in BSTs was known. A naive BST with sequential insertion (1, 2, 3...) becomes a linked list with `O(N)` operations. AVL trees enforce `|height(left) − height(right)| ≤ 1`, keeping worst-case height at `1.44 log N`.

- **Why B-trees were invented (1970):** The problem was _disk I/O_, not computation. On a 1 TB dataset with 4 KB pages, a BST would need `log₂(100M) ≈ 27` random disk seeks. A B-tree with `m = 100` children per node needs only `log₁₀₀(100M) ≈ 3` disk reads. This 9x reduction in disk I/O made databases viable.

- **Why LSM-trees were invented (1996):** SSDs cannot overwrite data in-place — they must erase and rewrite entire blocks. B-trees cause random writes on every insert (dirtying pages). LSM trees write only _sequentially_ to immutable SST files, reducing write amplification from `O(m)` to `O(log N)`. The tradeoff: reads now require checking multiple SST files (read amplification).

### Modern Practice Anchors

| System                     | Tree Used                               | Why                                                                |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| **PostgreSQL** indexes     | B-Tree (since v6.0, 1989)               | Default index type; optimal for range queries on disk              |
| **Java TreeMap / TreeSet** | Red-Black Tree (OpenJDK `TreeMap.java`) | `O(log N)` guaranteed; rebalancing rotations are `O(1)`            |
| **Apache Cassandra**       | LSM-Tree (since 2008)                   | Write-heavy workloads; sequential SST file compaction              |
| **RocksDB / LevelDB**      | LSM-Tree variant                        | Embedded KV store; LevelDB 2011 pioneered multi-level compaction   |
| **SQLite**                 | B+Tree (default)                        | Leaf nodes linked; range scans via sequential leaf traversal       |
| **MySQL InnoDB**           | B+Tree                                  | Clustered index on primary key; leaf pages form doubly-linked list |

---

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### Why Trees Matter — The Hierarchy Problem

Arrays and linked lists are **linear** — they model sequences. But the real world is full of **hierarchical relationships**: file systems, organization charts, family trees, HTML/DOM, abstract syntax trees in compilers. A tree naturally represents "parent-child" relationships where one entity contains or manages multiple sub-entities.

#### Why BSTs Give O(log n) — The Power of Halving

#### Formal Invariant Statements

Understanding each tree variant requires mastering its **invariants** — the properties that never change and guarantee the performance.

- **BST invariant:** For any node `N`, all keys in the left subtree `< N.key` and all keys in the right subtree `> N.key`. This guarantees binary search correctness.
- **Heap invariant (min-heap):** For every node `N`, `N.key ≤ all keys in N's children`. The root is always the minimum. The array representation maps parent(i) → `(i-1)/2`, left child → `2*i + 1`, right child → `2*i + 2`.
- **B-tree invariant:** Each internal node has between `⌈m/2⌉` and `m` children (where `m` is the tree order). All leaf nodes are at the same depth. This guarantees the tree stays short and wide, minimizing disk I/O.
- **Red-Black invariant:** Every node is red or black. The root is black. All leaves (NIL) are black. Red nodes have black children. Every path from any node to its NIL descendants has the same black-height. These 4 rules guarantee height ≤ `2 log₂(N+1)`.

---

A BST's invariant (`left < root < right`) is powerful because at each node, you eliminate **half the remaining candidates**. Starting at the root, one comparison tells you which subtree to explore — you never look at the other. With n nodes in a balanced BST, the height is log₂(n), so search takes at most log₂(n) comparisons.

**But this only works if the tree is balanced.** An unbalanced BST (imagine inserting 1, 2, 3, 4, 5 in order) degenerates into a linked list with O(n) height. This is why self-balancing trees (AVL, Red-Black) exist — they guarantee the height stays O(log n) after every insertion/deletion.

#### Why Heaps Store as Arrays — The Complete Binary Tree Trick

A heap is a **complete binary tree** — every level is full except possibly the last, which fills left-to-right. This structure maps perfectly to an array using index arithmetic:

- Parent of node `i`: `(i-1)/2`
- Left child: `2*i + 1`
- Right child: `2*i + 2`

No pointers needed! This makes heaps extremely cache-friendly (contiguous memory) and space-efficient compared to pointer-based trees. The heap property (min or max at root) ensures O(1) access to the extreme element, while bubbling up/down takes O(log n) — the height of a complete binary tree with n elements.

#### When to Use Each Tree Variant

### Tree Variants Comparison Table

| Structure          | Year  | Balance Invariant                                   | Search                       | Insert          | Primary Use Case                              | Cache Behavior                                 |
| ------------------ | ----- | --------------------------------------------------- | ---------------------------- | --------------- | --------------------------------------------- | ---------------------------------------------- | --------------------- | ----------------------- |
| BST (unbalanced)   | 1960s | None                                                | O(n) worst                   | O(n) worst      | Teaching only                                 | Pointer-chasing, poor locality                 |
| AVL Tree           | 1962  | `                                                   | height(left) − height(right) | ≤ 1`            | O(log n)                                      | O(log n)                                       | Read-heavy DB indexes | Good; strictly balanced |
| Red-Black Tree     | 1978  | 4 color rules → height ≤ 2 log₂(N+1)                | O(log n)                     | O(log n)        | In-memory maps (Java TreeMap, C++ `std::map`) | Good; less rigid than AVL                      |
| B-Tree             | 1970  | `⌈m/2⌉ ≤ children ≤ m`; all leaves same depth       | O(log_m N)                   | O(log_m N)      | Database disk indexes                         | Excellent; high fan-out, few page faults       |
| B+Tree             | 1970s | B-tree + all data in linked leaf nodes              | O(log_m N)                   | O(log_m N)      | SQL indexes (MySQL, PostgreSQL, Oracle)       | Best; sequential leaf scan for range queries   |
| Splay Tree         | 1978  | No explicit invariant; accessed nodes splay to root | Amort. O(log n)              | Amort. O(log n) | Cache-conscious access patterns               | Excellent for temporal locality                |
| LSM-Tree           | 1996  | Immutable SST files merged in levels                | O(log N) write + read ampl.  | O(1) write      | Write-heavy KV stores (Cassandra, RocksDB)    | Sequential writes; read checks multiple levels |
| Trie (Prefix Tree) | 1960s | Key characters at each edge                         | O(m) where m = key length    | O(m)            | Autocomplete, IP routing, spell-checkers      | Excellent; no key comparison                   |

#### Tree Selection Criteria — Which Tree for Which Workload?

- **Range queries dominate?** → B+Tree. The linked leaf nodes enable sequential scan without traversing the tree again.
- **Inserts dominate (writes more than reads)?** → LSM-Tree. Sequential SST file writes are order-of-magnitude faster on SSDs.
- **In-memory map (Java `TreeMap`, `HashMap` fallback)?** → Red-Black Tree. Guaranteed `O(log N)` without the overhead of B-tree disk-page management.
- **String prefix operations (autocomplete, routing)?** → Trie. Eliminates key comparison entirely; `O(m)` where `m` is key length, not `N`.
- **Need minimum/maximum element frequently?** → Heap. `O(1)` peek, `O(log N)` insert/extract — optimal for priority queues.
- **Read-heavy, rarely modified?** → AVL Tree. Tighter balance than Red-Black gives ~10% better search performance.

---

### Production Failure Modes — What Can Go Wrong in Production

Trees are used in the most critical hot paths of production systems. A misconfigured index or unanticipated workload pattern can cause catastrophic failures.

#### Failure 1: B-Tree Page Split Storm During Bulk Insert

**Name:** B-tree page split storm (also called _split bottleneck_)

**Mechanism:** When loading a large dataset in sorted order (e.g., bulk-inserting `INSERT ... ORDER BY` from a CSV), every new key belongs to the rightmost leaf page. If the fill-factor is high (e.g., PostgreSQL default `fillfactor = 100`), each leaf page fills to capacity before splitting. Repeated splits at the rightmost edge generate excessive **random I/O** and **WAL (Write-Ahead Log)** writes. The symptom in PostgreSQL:

```
LOG:  checkpoint complete: wrote 0 buffers (0.0%); 0 WAL file(s) added, 0 removed, 1 recycled
ERROR:  could not extend relation "pg_class": ERROR:  could not write block %u of relation %u/%u/%u
HINT:  Check free disk space and available memory.
```

**Debugging:**

```sql
-- Check btree index bloat (PostgreSQL)
SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
       pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class WHERE relkind = 'r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;
```

**Fix:**

1. Lower `fillfactor` to 50–70% for B-tree indexes that receive bulk inserts: `CREATE INDEX idx ON tbl(col) WITH (fillfactor=70);`
2. Use `DISABLE_PAGE_SKIPPING` for bulk loads in PostgreSQL.
3. Consider `COPY` over `INSERT` for bulk loads — it bypasses B-tree index maintenance during the load, then builds the index in a single pass.

---

#### Failure 2: LSM-Tree Compaction Lag Causing Read Amplification

**Name:** LSM-tree compaction lag / read amplification storm

**Mechanism:** LSM-trees accumulate writes in memory (MemTable), then flush to immutable SST files on disk. A background compaction process merges SST files across levels. If the write throughput exceeds the compaction throughput (common during a traffic spike), the number of SST files grows unbounded. Each read must now check many SST files (e.g., LevelDB looks in all `L` levels = `O(L)` reads). Cassandra exposes this via:

```
WARN  [CompactionExecutor:1234] 2024-03-15 02:14:33,678  CompactionTask.java:156
  - Compaction gap detected: expected 200MB/s, getting 45MB/s. Heap usage at 87%.
```

```bash
# Cassandra metric: check read latency spikes correlated with compaction
nodetool tablestats keyspace1.standard1 | grep -E "Read Latency|Compaction| SSTables per query"
# SSTables per query > 10 indicates severe read amplification
```

**Debugging:**

1. Monitor `CompactionHistory` and `PendingCompactions` in Cassandra:
   ```bash
   nodetool compactionhistory
   nodetool compactionstats
   ```
2. Check for write stalls: `nodetool proxyhistograms | grep WRITE`
3. Alert threshold: if `SSTables per query` > 3 consistently, compaction is lagging.

**Fix:**

1. Increase compaction throughput: `ALTER TABLE ... WITH compaction = {'class': 'LeveledCompactionStrategy', 'compaction_throughput_mb_per_sec': 100};`
2. Tune bloom filters: `bloom_filter_fp_chance = 0.01` (higher false-positive rate = fewer SST file checks).
3. Pre-compact before traffic spikes using `nodetough compact`.

---

> 🔬 **Section Challenge — PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT**
>
> **Challenge 1 (Trace):** Why is an un-balanced Binary Search Tree (BST) considered a potential Denial of Service (DoS) vulnerability if used to index sequential user inputs?
>
> <details><summary>Answer</summary>
>
> **Scenario:** Processing sequentially generated keys (like timestamps or auto-incrementing IDs) in a naive BST.
> **Trace:** If a user sends keys in strictly increasing order (e.g., `1, 2, 3, 4...`), a naive BST inserts each node as the right child of the previous node. The tree degenerates completely into a **linked list**.
> **Debug/Impact:** Because the tree height is now `N` instead of `log N`, all operations (search, insert, delete) degrade to `O(N)`. If a malicious actor sends 1 million sequential requests, the server will take `O(N)` time per request, exhausting CPU resources. This is why production systems _always_ use self-balancing trees like **Red-Black Trees** (Java's `TreeMap`) or **B-Trees** (Databases), which mathematically enforce `O(log N)` height regardless of insertion order.
>
> </details>

> 🔬 **Section Challenge — Production Realities**
>
> **Challenge 2 (Disk I/O):** Compare the disk I/O cost of a B-tree lookup vs a BST lookup for 100 million records on a 1 TB dataset with 4 KB pages. Assume B-tree order `m = 100` children per node and BST is stored as individual nodes (no page grouping). Why does B-tree win by orders of magnitude?
>
> <details><summary>Answer</summary>
>
> **Setup:** 1 TB = `10¹²` bytes, 4 KB per page = `2¹²` bytes → ~244 million pages. 100 million records.
>
> **BST lookup:** Each node is one 4 KB page. A 100-million-record BST has height `log₂(10⁸) ≈ 27`. Each comparison requires a random disk seek to fetch the next node's page. Worst case: **27 random disk seeks** — and each seek on a spinning disk costs ~10 ms (mechanical latency), giving **~270 ms per lookup**.
>
> **B-tree lookup:** Each internal node stores up to `m = 100` keys and 101 child pointers in one 4 KB page. Height = `log₁₀₀(10⁸) ≈ 4`. Each step processes an entire page (which stays in memory). Worst case: **4 disk seeks** (~40 ms) and 4 x O(1) in-memory binary searches.
>
> **The win:** B-tree uses **high fan-out** (100 children per node) to make the tree **short and wide**. The tree height drops from 27 to 4 — a **7x reduction** in disk seeks. On SSDs the latency difference is smaller, but the I/O bandwidth difference (4-page reads vs 27-page reads) still gives B-tree a 6–7x throughput advantage. For sorted range scans, B+Tree's linked leaf nodes avoid re-traversing the tree entirely.
>
> **Rule of thumb:** Every factor of 10 increase in fan-out reduces tree height by 1 level. B-trees with `m = 100–1000` keep height ≤ 4 for datasets up to billions of records.
>
> </details>

## 🧬 Nature & Behavior

### What is a Tree?

```
HIERARCHICAL STRUCTURE:
┌────────────────────────────────────────────────────┐
│                                                    │
│              ┌───┐                                 │
│              │ A │  ← Root                         │
│              └─┬─┘                                 │
│         ┌─────┴─────┐                              │
│         ▼           ▼                              │
│      ┌───┐       ┌───┐                             │
│      │ B │       │ C │  ← Children of A            │
│      └─┬─┘       └─┬─┘                             │
│     ┌──┴──┐     ┌──┴──┐                            │
│     ▼     ▼     ▼     ▼                            │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐                          │
│   │ D │ │ E │ │ F │ │ G │  ← Leaves                │
│   └───┘ └───┘ └───┘ └───┘                          │
│                                                    │
│ Properties:                                        │
│ - One root node                                    │
│ - Each node has 0+ children                        │
│ - No cycles                                        │
│ - One path from root to any node                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Binary Search Tree (BST)

```
BST PROPERTY:
- Left subtree: all values < node
- Right subtree: all values > node

          ┌───┐
          │ 8 │
          └─┬─┘
      ┌────┴────┐
      ▼         ▼
   ┌───┐     ┌───┐
   │ 3 │     │10 │
   └─┬─┘     └─┬─┘
  ┌──┴──┐     └──┐
  ▼     ▼        ▼
┌───┐ ┌───┐   ┌───┐
│ 1 │ │ 6 │   │14 │
└───┘ └───┘   └───┘

Search for 6:
8 → 6 < 8 → go left
3 → 6 > 3 → go right
6 → FOUND!

Time: O(log n) for balanced tree
```

### 🔴 Real-World Origin: File Systems (1965)

**Problem (UNIX, 1969):** Computers need to organize thousands of files with hierarchical structure (folders in folders) and fast file lookup.

**Solution — Tree Structure:**

```
/
├── home/
│   ├── alice/
│   │   ├── documents/
│   │   └── photos/
│   └── bob/
├── usr/
│   ├── bin/
│   └── lib/
└── etc/
```

**Why Tree?** Natural hierarchy (parent-child), path from root to any file, easy to navigate (`cd`, `ls` commands).

> ✅ **Impact:** Every OS uses trees for files, every URL is a tree path, every org chart is a tree, every family tree is... a tree!

## 💻 Implementation WITHOUT Collections

```java
public class MyBinaryTree {

    private class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    private TreeNode root;

    // INSERT (BST) - O(log n) average
    public void insert(int value) {
        root = insertRecursive(root, value);
    }

    private TreeNode insertRecursive(TreeNode node, int value) {
        if (node == null) {
            return new TreeNode(value);
        }

        if (value < node.value) {
            node.left = insertRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = insertRecursive(node.right, value);
        }

        return node;
    }

    // SEARCH - O(log n) average
    public boolean search(int value) {
        return searchRecursive(root, value);
    }

    private boolean searchRecursive(TreeNode node, int value) {
        if (node == null) return false;
        if (node.value == value) return true;

        if (value < node.value) {
            return searchRecursive(node.left, value);
        } else {
            return searchRecursive(node.right, value);
        }
    }

    // INORDER TRAVERSAL (Left, Root, Right) - Gives sorted order!
    public void inorder() {
        inorderRecursive(root);
    }

    private void inorderRecursive(TreeNode node) {
        if (node == null) return;
        inorderRecursive(node.left);
        System.out.print(node.value + " ");
        inorderRecursive(node.right);
    }

    // PREORDER TRAVERSAL (Root, Left, Right)
    public void preorder() {
        preorderRecursive(root);
    }

    private void preorderRecursive(TreeNode node) {
        if (node == null) return;
        System.out.print(node.value + " ");
        preorderRecursive(node.left);
        preorderRecursive(node.right);
    }

    // POSTORDER TRAVERSAL (Left, Right, Root)
    public void postorder() {
        postorderRecursive(root);
    }

    private void postorderRecursive(TreeNode node) {
        if (node == null) return;
        postorderRecursive(node.left);
        postorderRecursive(node.right);
        System.out.print(node.value + " ");
    }

    // HEIGHT - O(n)
    public int height() {
        return heightRecursive(root);
    }

    private int heightRecursive(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = heightRecursive(node.left);
        int rightHeight = heightRecursive(node.right);
        return 1 + Math.max(leftHeight, rightHeight);
    }

    // DELETE - O(log n) average
    public void delete(int value) {
        root = deleteRecursive(root, value);
    }

    private TreeNode deleteRecursive(TreeNode node, int value) {
        if (node == null) return null;

        if (value < node.value) {
            node.left = deleteRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = deleteRecursive(node.right, value);
        } else {
            // Found node to delete

            // Case 1: Leaf node
            if (node.left == null && node.right == null) {
                return null;
            }

            // Case 2: One child
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;

            // Case 3: Two children
            // Find inorder successor (smallest in right subtree)
            TreeNode successor = findMin(node.right);
            node.value = successor.value;
            node.right = deleteRecursive(node.right, successor.value);
        }

        return node;
    }

    private TreeNode findMin(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

---

# 📦 Part 8: Heaps (priority Queue)

## 🧬 Nature & Behavior

### What is a Heap?

```
HEAP = Complete Binary Tree with Heap Property

MAX HEAP: Parent ≥ Children
          ┌───┐
          │100│
          └─┬─┘
       ┌───┴───┐
       ▼       ▼
     ┌───┐   ┌───┐
     │ 90│   │ 80│
     └─┬─┘   └─┬─┘
    ┌──┴──┐  ┌─┘
    ▼     ▼  ▼
  ┌───┐┌───┐┌───┐
  │70 ││60 ││50 │
  └───┘└───┘└───┘

MIN HEAP: Parent ≤ Children
(Root is smallest)

STORED AS ARRAY (Level order):
[100, 90, 80, 70, 60, 50]
  0   1   2   3   4   5

Parent of i: (i-1)/2
Left child of i: 2*i + 1
Right child of i: 2*i + 2
```

### 🔴 Real-World Origin: Emergency Room Triage (1970s)

**Problem in Hospitals:** Patients arrive randomly — some critical, some minor. Need to treat the most urgent first, **NOT** first-come-first-served!

**Without Priority Queue:** Check all patients to find most urgent → **O(n)** for each decision. Lives lost due to delay!

**With Heap (Priority Queue):**

| Operation                    | Time     |
| ---------------------------- | -------- |
| Insert patient with priority | O(log n) |
| Get most urgent              | **O(1)** |
| Remove most urgent           | O(log n) |

**Example:**

```
Patient arrives: priority 5 (medium)
Patient arrives: priority 9 (critical)
Patient arrives: priority 3 (minor)

Heap: [9, 5, 3]
Next to treat: 9 (critical) - O(1)!
```

> ✅ **Now used in:** OS process scheduling, network packet prioritization, Dijkstra's shortest path, event-driven simulations

## 💻 Implementation WITHOUT Collections

```java
public class MyMinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MyMinHeap(int capacity) {
        this.capacity = capacity;
        this.heap = new int[capacity];
        this.size = 0;
    }

    // PARENT INDEX
    private int parent(int i) { return (i - 1) / 2; }

    // LEFT CHILD INDEX
    private int leftChild(int i) { return 2 * i + 1; }

    // RIGHT CHILD INDEX
    private int rightChild(int i) { return 2 * i + 2; }

    // SWAP
    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // INSERT - O(log n)
    public void insert(int value) {
        if (size == capacity) {
            throw new RuntimeException("Heap is full!");
        }

        // Add at end
        heap[size] = value;
        int current = size;
        size++;

        // Bubble up
        while (current > 0 && heap[current] < heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }

    // PEEK (Get min) - O(1)
    public int peek() {
        if (size == 0) throw new RuntimeException("Heap is empty!");
        return heap[0];
    }

    // EXTRACT MIN - O(log n)
    public int extractMin() {
        if (size == 0) throw new RuntimeException("Heap is empty!");

        int min = heap[0];

        // Move last element to root
        heap[0] = heap[size - 1];
        size--;

        // Bubble down
        heapifyDown(0);

        return min;
    }

    // HEAPIFY DOWN
    private void heapifyDown(int i) {
        int smallest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && heap[left] < heap[smallest]) {
            smallest = left;
        }

        if (right < size && heap[right] < heap[smallest]) {
            smallest = right;
        }

        if (smallest != i) {
            swap(i, smallest);
            heapifyDown(smallest);
        }
    }

    // BUILD HEAP from array - O(n)
    public void buildHeap(int[] arr) {
        size = arr.length;
        heap = arr.clone();

        // Start from last non-leaf node
        for (int i = size / 2 - 1; i >= 0; i--) {
            heapifyDown(i);
        }
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

🔬 **Section Challenge — Heap Construction Mechanics**

**Challenge 1 (Algorithmic Complexity):** If you are given an array of `N` random integers and need to turn it into a valid Min-Heap, you have two options: 1) Insert them one by one into an empty heap using `insert()`. 2) Use Floyd's `buildHeap()` algorithm. Explain the exact time complexity of both approaches and why Floyd's algorithm mathematically outperforms sequential insertion.

<details><summary>Answer</summary>

**Approach 1: Sequential Insertion `O(N log N)`**
Inserting an element takes `O(log N)` because it might bubble _up_ from a leaf to the root. In a tree, the vast majority of nodes are at the bottom leaves. Therefore, most of the `N` elements you insert will have to bubble up through the entire height of the tree `O(log N)`. Summing this up gives `O(N log N)`.

**Approach 2: Floyd's `buildHeap` `O(N)`**
Floyd's algorithm treats the unsorted array as a complete binary tree and calls `heapifyDown()` starting from the lowest non-leaf nodes up to the root. `heapifyDown` pushes nodes _down_.
The mathematical trick: the majority of nodes (the leaves, `N/2` nodes) are already at the bottom, so they move 0 steps! `N/4` nodes move at most 1 step. `N/8` nodes move at most 2 steps. Only the single root node moves `log N` steps. The work is proportional to the node's height, not its depth. The sum of this series `(N/2 * 0) + (N/4 * 1) + (N/8 * 2) + ...` converges to exactly `O(N)`.

</details>

---

## 🧭 Traversal Decision Guide — Which to Use When?

```
INORDER   (Left → Root → Right):
  ✅ Get BST elements in SORTED order
  ✅ Check if tree is valid BST

PREORDER  (Root → Left → Right):
  ✅ Copy/serialize a tree
  ✅ Print directory structure (root before children)

POSTORDER (Left → Right → Root):
  ✅ Delete a tree (delete children before parent)
  ✅ Evaluate expression trees
  ✅ Calculate subtree sizes

LEVEL ORDER (BFS — Queue):
  ✅ Level-by-level processing
  ✅ Find minimum depth
  ✅ Connect nodes at same level
  ✅ Zigzag traversal
```

## 🏋️ Foundation Practice + Pattern Application

### Tree Patterns with GO LEARN Links

**Pattern: DFS (Depth First Search)**

```java
// Use for: height, path sum, validate BST, symmetric check
// Template:
public int dfs(TreeNode node) {
    if (node == null) return BASE_CASE;
    int left  = dfs(node.left);
    int right = dfs(node.right);
    return COMBINE(left, right, node.val);
}
```

> 📖 GO DEEPER: [13_Tree_Plus_DFS_BFS.md](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md)

**Pattern: BFS Level Order**

```java
// Use for: level-by-level, min depth, right-side view
Queue<TreeNode> q = new LinkedList<>();
q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();        // ← size = nodes at current level
    for (int i = 0; i < size; i++) {
        TreeNode node = q.poll();
        if (node.left  != null) q.offer(node.left);
        if (node.right != null) q.offer(node.right);
    }
}
```

**Heap Pattern: Top K Elements**

```java
// Brute: sort entire array O(n log n)
// Better: Min-Heap of size k O(n log k)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : arr) {
    minHeap.offer(num);
    if (minHeap.size() > k) minHeap.poll();   // remove smallest if > k
}
// minHeap now has k largest elements | LC 215
```

**Heap Pattern: Merge K Sorted Lists**

```java
// O(n log k) — classic heap use
PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[0]-b[0]);
// Push first element from each list, then pull min and push next
```

---

## 🎯 Full Problem Set — Trees & Heaps

| #   | Problem                           | Platform   | Difficulty  | Pattern             |
| --- | --------------------------------- | ---------- | ----------- | ------------------- |
| 1   | LC 104 — Max Depth of Binary Tree | LeetCode   | ⭐ Easy     | DFS                 |
| 2   | LC 226 — Invert Binary Tree       | LeetCode   | ⭐ Easy     | DFS                 |
| 3   | LC 94 — Inorder Traversal         | LeetCode   | ⭐ Easy     | Iterative/Recursive |
| 4   | LC 102 — Level Order Traversal    | LeetCode   | ⭐⭐ Med    | BFS Queue           |
| 5   | LC 98 — Validate BST              | LeetCode   | ⭐⭐ Med    | DFS with limits     |
| 6   | LC 112 — Path Sum                 | LeetCode   | ⭐ Easy     | DFS                 |
| 7   | LC 235 — LCA of BST               | LeetCode   | ⭐⭐ Med    | BST property        |
| 8   | LC 543 — Diameter of Binary Tree  | LeetCode   | ⭐ Easy     | DFS postorder       |
| 9   | LC 215 — Kth Largest Element      | LeetCode   | ⭐⭐ Med    | Min-Heap size k     |
| 10  | LC 347 — Top K Frequent Elements  | LeetCode   | ⭐⭐ Med    | Freq + Heap         |
| 11  | LC 23 — Merge K Sorted Lists      | LeetCode   | ⭐⭐⭐ Hard | Min-Heap            |
| 12  | CF 427C — Checkposts              | Codeforces | Div2-C      | Tree + DP           |

---

## 🧠 Pattern Fingerprint — Trees & Heaps

```
SEE THESE WORDS → USE THIS:
┌──────────────────────────────────────────────────────────────┐
│ "height / depth of tree"            → DFS postorder         │
│ "path sum / root to leaf"           → DFS preorder          │
│ "level order / level by level"      → BFS Queue             │
│ "validate BST"                      → DFS with [min,max]    │
│ "lowest common ancestor"            → DFS LCA               │
│ "kth largest / smallest"            → Min-Heap size k       │
│ "top K frequent elements"           → Freq map + Heap       │
│ "merge K sorted lists"              → Min-Heap              │
│ "sorted order from BST"             → Inorder traversal     │
│ "serialize / deserialize tree"      → Preorder + null marks │
└──────────────────────────────────────────────────────────────┘
```

### 🚀 GO LEARN — When You Need More

| Topic                               | File                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Tree algorithms (DFS/BFS deep dive) | 📖 [05_Trees.md](../03_Algorithms/05_Trees.md)                                 |
| Tree patterns                       | 📖 [13_Tree_Plus_DFS_BFS.md](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md) |
| Tree practice                       | 📖 [09_Trees.md](../05_Problem_Solving/09_Trees.md)                            |
| Heap practice                       | 📖 [16_Heap.md](../05_Problem_Solving/16_Heap.md)                              |

### 📅 Revisit Tracker

- **Day 3:** Redo LC 104 (Max Depth) + LC 102 (Level Order) from memory
- **Day 7:** Redo LC 98 (Validate BST) — recall the min/max bound trick

---

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                               | Related Content                                                     |
| ----------------------------------- | ------------------------------------------------------------------- |
| Tree algorithms (DFS/BFS)           | [Tree Algorithms](../03_Algorithms/05_Trees.md)                     |
| Tree + DFS/BFS patterns             | [Tree Patterns](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md)   |
| Tree practice problems              | [Problem Solving — Trees](../05_Problem_Solving/09_Trees.md)        |
| Heap / PQ problems                  | [Problem Solving — Heaps](../05_Problem_Solving/08_Heaps_PQ.md)     |
| Graph algorithms (trees are graphs) | [Graphs Fundamentals](../03_Algorithms/05c_Graphs_Fundamentals.md)  |
| Decision Trees in ML                | [ML Algorithms](../21_Python_ML_DL_NLP/06_ML_Algorithms.md)         |
| Virtual DOM tree (React)            | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) |

---

---

> 🔬 **Section Challenge — 🧠 Pattern Fingerprint — Trees & Heaps**
>
> **Challenge 1 (Reasoning):** A problem asks you to find the "Top K Frequent Elements" from an array of N items. You have two options: build a Max-Heap of all N items, or maintain a Min-Heap of size K. Trace the time/space complexity difference. Which is better and why?
>
> <details><summary>Answer</summary>
>
> **Scenario:** Choosing the correct heap pattern for "Top K" algorithms.
> **Trace:**
>
> 1. **Max-Heap of size N:** You push all `N` elements into the heap `O(N log N)`, then pop the top `K` times `O(K log N)`. Memory required is `O(N)`.
> 2. **Min-Heap of size K:** You push elements into the Min-Heap. If the heap size exceeds `K`, you immediately pop the _smallest_ element. The heap only ever holds `K` items. Time complexity: `O(N log K)`. Space required: `O(K)`.
> **Design Fix:** The **Min-Heap of size K** is vastly superior. If you process 1 billion server logs (`N = 1,000,000,000`) to find the top 10 error IPs (`K = 10`), the Max-Heap will crash the server with an OutOfMemory error. The Min-Heap will use virtually zero memory `O(10)` and run nearly in `O(N)` time since `log 10` is a constant.
> </details>

## ✅ You Know Trees & Heaps — Now Practice! (JIT Study Path)

> **Step 1 — Basic Problems (Trees):**

| Problem                      | LC #   | Pattern          | Key Concept                          |
| ---------------------------- | ------ | ---------------- | ------------------------------------ |
| Maximum Depth of Binary Tree | LC 104 | DFS postorder    | `1 + max(left, right)`               |
| Invert Binary Tree           | LC 226 | DFS preorder     | Swap left/right at every node        |
| Symmetric Tree               | LC 101 | DFS mirror check | Compare left.left with right.right   |
| Binary Tree Level Order      | LC 102 | BFS Queue        | Poll node, add children, track level |
| Validate BST                 | LC 98  | DFS with bounds  | Pass [min, max] range to each node   |

> **Step 1B — Basic Problems (Heaps):**

| Problem              | LC #   | Pattern            | Key Concept                          |
| -------------------- | ------ | ------------------ | ------------------------------------ |
| Kth Largest Element  | LC 215 | Min-heap of size K | Keep K-size heap, root = Kth largest |
| Top K Frequent Words | LC 692 | Freq + Min-heap    | Count then heapify by freq           |
| Meeting Rooms II     | LC 253 | Sort + Min-heap    | Min-heap of end times                |

> **Step 2 — Hit a wall? Learn these patterns:**
>
> - Tree traversals → **[Tree + DFS/BFS Patterns](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md)**
> - Top-K / Two-Heap → **[Heap Patterns](../04_Patterns_Templates/15_Heap_Plus_GreedySelection.md)**
>
> **Step 3 — Apply patterns on harder problems:**
> 👉 **[Go to Trees Problem Solving →](../05_Problem_Solving/09_Trees.md)**
> 👉 **[Go to Heap Problem Solving →](../05_Problem_Solving/16_Heap.md)**
>
> **Step 4 — Competitive Practice:**

| CF Problem                                                                          | Topic         | Difficulty  |
| ----------------------------------------------------------------------------------- | ------------- | ----------- |
| [CF 339D — Xenia and Tree](https://codeforces.com/problemset/problem/339/D)         | Tree + LCA    | ⭐⭐⭐ Hard |
| [CF 1442C — Graph Transpositions](https://codeforces.com/problemset/problem/1442/C) | Tree DP       | ⭐⭐ Medium |
| [CF 1526C — Potions](https://codeforces.com/problemset/problem/1526/C)              | Greedy + Heap | ⭐⭐ Medium |

> 🌍 **Real-World Connections:**
>
> - **File system** (ext4, APFS, NTFS) = B-Tree of directories and files
> - **HTML/DOM** = tree; React re-renders using virtual DOM tree diffing
> - **Compiler AST** (Abstract Syntax Tree) = your Java code parsed into a tree
> - **Java's PriorityQueue** = Min-Heap; used in Dijkstra, task schedulers, event loops
> - **OS process scheduler** = heap by priority; highest-priority process runs next
