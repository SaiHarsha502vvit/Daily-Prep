> **Navigation**: [< Previous Chapter](01e_HashTable.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01g_DS_Internals.md)

---

# 🌳 Part 7: Trees

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### Why Trees Matter — The Hierarchy Problem

Arrays and linked lists are **linear** — they model sequences. But the real world is full of **hierarchical relationships**: file systems, organization charts, family trees, HTML/DOM, abstract syntax trees in compilers. A tree naturally represents "parent-child" relationships where one entity contains or manages multiple sub-entities.

#### Why BSTs Give O(log n) — The Power of Halving

A BST's invariant (`left < root < right`) is powerful because at each node, you eliminate **half the remaining candidates**. Starting at the root, one comparison tells you which subtree to explore — you never look at the other. With n nodes in a balanced BST, the height is log₂(n), so search takes at most log₂(n) comparisons.

**But this only works if the tree is balanced.** An unbalanced BST (imagine inserting 1, 2, 3, 4, 5 in order) degenerates into a linked list with O(n) height. This is why self-balancing trees (AVL, Red-Black) exist — they guarantee the height stays O(log n) after every insertion/deletion.

#### Why Heaps Store as Arrays — The Complete Binary Tree Trick

A heap is a **complete binary tree** — every level is full except possibly the last, which fills left-to-right. This structure maps perfectly to an array using index arithmetic:
- Parent of node `i`: `(i-1)/2`
- Left child: `2*i + 1`
- Right child: `2*i + 2`

No pointers needed! This makes heaps extremely cache-friendly (contiguous memory) and space-efficient compared to pointer-based trees. The heap property (min or max at root) ensures O(1) access to the extreme element, while bubbling up/down takes O(log n) — the height of a complete binary tree with n elements.

#### When to Use Each Tree Variant

| Structure | Search | Insert | Use When |
|-----------|--------|--------|----------|
| BST (unbalanced) | O(n) worst | O(n) worst | Teaching, not production |
| BST (balanced: AVL/RB) | O(log n) | O(log n) | Sorted data with frequent access |
| Heap / PriorityQueue | O(n) | O(log n) | Need min/max quickly |
| Trie | O(m) key length | O(m) | Prefix-based string operations |

---






> 🔬 **Section Challenge — PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT**

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

**Flow:**
1. ▼ ▼ / C / ▼ ▼ / E F
2. ▼ ▼ / D E
3. ▼ ▼ / F G

```mermaid
flowchart TD
    N1["▼ ▼ / C / ▼ ▼ / E F"]
    N2["▼ ▼ / D E"]
    N3["▼ ▼ / F G"]
    N1 --> N2
    N2 --> N3
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

**Flow:**
1. ▼ ▼ / 10 / ▼ / 6 14 10
2. ▼ ▼ / 1 6 14

```mermaid
flowchart TD
    N1["▼ ▼ / 10 / ▼ / 6 14"]
    N2["10"]
    N3["▼ ▼ / 1 6"]
    N4["14"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
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

**Flow:**
1. Root home/
2. Root alice/
3. Root documents/
4. Root photos/
5. Root bob/
6. Root usr/

```mermaid
flowchart TD
    N1["Root"]
    N2["home/"]
    N3["alice/"]
    N4["documents/"]
    N5["photos/"]
    N6["bob/"]
    N7["usr/"]
    N8["bin/"]
    N9["lib/"]
    N10["etc/"]
    N1 --> N2
    N1 --> N3
    N1 --> N4
    N1 --> N5
    N1 --> N6
    N1 --> N7
    N1 --> N8
    N1 --> N9
    N1 --> N10
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

**Flow:**
1. 100
2. ▼ ▼ / 90 8 90 80
3. ▼ ▼ / 0 60 70 60

```mermaid
flowchart TD
    N1["100"]
    N2["▼ ▼ / 90 8"]
    N3["90"]
    N4["80"]
    N5["▼ ▼ / 0 60"]
    N6["70"]
    N7["60"]
    N8["50"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### 🔴 Real-World Origin: Emergency Room Triage (1970s)

**Problem in Hospitals:** Patients arrive randomly — some critical, some minor. Need to treat the most urgent first, **NOT** first-come-first-served!

**Without Priority Queue:** Check all patients to find most urgent → **O(n)** for each decision. Lives lost due to delay!

**With Heap (Priority Queue):**

| Operation | Time |
|-----------|------|
| Insert patient with priority | O(log n) |
| Get most urgent | **O(1)** |
| Remove most urgent | O(log n) |

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
Inserting an element takes `O(log N)` because it might bubble *up* from a leaf to the root. In a tree, the vast majority of nodes are at the bottom leaves. Therefore, most of the `N` elements you insert will have to bubble up through the entire height of the tree `O(log N)`. Summing this up gives `O(N log N)`.

**Approach 2: Floyd's `buildHeap` `O(N)`**
Floyd's algorithm treats the unsorted array as a complete binary tree and calls `heapifyDown()` starting from the lowest non-leaf nodes up to the root. `heapifyDown` pushes nodes *down*.
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

| # | Problem | Platform | Difficulty | Pattern |
|---|---------|----------|------------|---------|
| 1 | LC 104 — Max Depth of Binary Tree | LeetCode | ⭐ Easy | DFS |
| 2 | LC 226 — Invert Binary Tree | LeetCode | ⭐ Easy | DFS |
| 3 | LC 94 — Inorder Traversal | LeetCode | ⭐ Easy | Iterative/Recursive |
| 4 | LC 102 — Level Order Traversal | LeetCode | ⭐⭐ Med | BFS Queue |
| 5 | LC 98 — Validate BST | LeetCode | ⭐⭐ Med | DFS with limits |
| 6 | LC 112 — Path Sum | LeetCode | ⭐ Easy | DFS |
| 7 | LC 235 — LCA of BST | LeetCode | ⭐⭐ Med | BST property |
| 8 | LC 543 — Diameter of Binary Tree | LeetCode | ⭐ Easy | DFS postorder |
| 9 | LC 215 — Kth Largest Element | LeetCode | ⭐⭐ Med | Min-Heap size k |
| 10 | LC 347 — Top K Frequent Elements | LeetCode | ⭐⭐ Med | Freq + Heap |
| 11 | LC 23 — Merge K Sorted Lists | LeetCode | ⭐⭐⭐ Hard | Min-Heap |
| 12 | CF 427C — Checkposts | Codeforces | Div2-C | Tree + DP |

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

| Topic | File |
|-------|------|
| Tree algorithms (DFS/BFS deep dive) | 📖 [05_Trees.md](../03_Algorithms/05_Trees.md) |
| Tree patterns | 📖 [13_Tree_Plus_DFS_BFS.md](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md) |
| Tree practice | 📖 [09_Trees.md](../05_Problem_Solving/09_Trees.md) |
| Heap practice | 📖 [16_Heap.md](../05_Problem_Solving/16_Heap.md) |

### 📅 Revisit Tracker
- **Day 3:** Redo LC 104 (Max Depth) + LC 102 (Level Order) from memory
- **Day 7:** Redo LC 98 (Validate BST) — recall the min/max bound trick

---

### 🔗 Cross-References — Navigate the Ecosystem

| Topic | Related Content |
|---|---|
| Tree algorithms (DFS/BFS) | [Tree Algorithms](../03_Algorithms/05_Trees.md) |
| Tree + DFS/BFS patterns | [Tree Patterns](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md) |
| Tree practice problems | [Problem Solving — Trees](../05_Problem_Solving/09_Trees.md) |
| Heap / PQ problems | [Problem Solving — Heaps](../05_Problem_Solving/08_Heaps_PQ.md) |
| Graph algorithms (trees are graphs) | [Graphs Fundamentals](../03_Algorithms/05c_Graphs_Fundamentals.md) |
| Decision Trees in ML | [ML Algorithms](../21_Python_ML_DL_NLP/06_ML_Algorithms.md) |
| Virtual DOM tree (React) | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) |

---

---






> 🔬 **Section Challenge — 🧠 Pattern Fingerprint — Trees & Heaps**

## ✅ You Know Trees & Heaps — Now Practice! (JIT Study Path)

> **Step 1 — Basic Problems (Trees):**

| Problem | LC # | Pattern | Key Concept |
|---|---|---|---|
| Maximum Depth of Binary Tree | LC 104 | DFS postorder | `1 + max(left, right)` |
| Invert Binary Tree | LC 226 | DFS preorder | Swap left/right at every node |
| Symmetric Tree | LC 101 | DFS mirror check | Compare left.left with right.right |
| Binary Tree Level Order | LC 102 | BFS Queue | Poll node, add children, track level |
| Validate BST | LC 98 | DFS with bounds | Pass [min, max] range to each node |

>
> **Step 1B — Basic Problems (Heaps):**

| Problem | LC # | Pattern | Key Concept |
|---|---|---|---|
| Kth Largest Element | LC 215 | Min-heap of size K | Keep K-size heap, root = Kth largest |
| Top K Frequent Words | LC 692 | Freq + Min-heap | Count then heapify by freq |
| Meeting Rooms II | LC 253 | Sort + Min-heap | Min-heap of end times |

>
> **Step 2 — Hit a wall? Learn these patterns:**
> - Tree traversals → **[Tree + DFS/BFS Patterns](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md)**
> - Top-K / Two-Heap → **[Heap Patterns](../04_Patterns_Templates/15_Heap_Plus_GreedySelection.md)**
>
> **Step 3 — Apply patterns on harder problems:**
> 👉 **[Go to Trees Problem Solving →](../05_Problem_Solving/09_Trees.md)**
> 👉 **[Go to Heap Problem Solving →](../05_Problem_Solving/16_Heap.md)**
>
> **Step 4 — Competitive Practice:**

| CF Problem | Topic | Difficulty |
|---|---|---|
| [CF 339D — Xenia and Tree](https://codeforces.com/problemset/problem/339/D) | Tree + LCA | ⭐⭐⭐ Hard |
| [CF 1442C — Graph Transpositions](https://codeforces.com/problemset/problem/1442/C) | Tree DP | ⭐⭐ Medium |
| [CF 1526C — Potions](https://codeforces.com/problemset/problem/1526/C) | Greedy + Heap | ⭐⭐ Medium |

>
> 🌍 **Real-World Connections:**
> - **File system** (ext4, APFS, NTFS) = B-Tree of directories and files
> - **HTML/DOM** = tree; React re-renders using virtual DOM tree diffing
> - **Compiler AST** (Abstract Syntax Tree) = your Java code parsed into a tree
> - **Java's PriorityQueue** = Min-Heap; used in Dijkstra, task schedulers, event loops
> - **OS process scheduler** = heap by priority; highest-priority process runs next

