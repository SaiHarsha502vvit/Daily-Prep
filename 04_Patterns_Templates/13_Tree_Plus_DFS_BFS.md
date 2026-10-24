# 🧩 Tree + DFS/BFS — Pattern Guide

> **Navigation**: [← Linked List + Two Pointers](12_LinkedList_Plus_TwoPointers.md) | [Chapter index](00_INDEX.md) | [Graph + Traversal →](14_Graph_Plus_Traversal.md)

## Tree + DFS/BFS — Combined Pattern Guide

**WHY this combination?** Trees are hierarchical. DFS explores depth-first (recursion/stack) — ideal for path problems. BFS explores level-by-level (queue) — ideal for shortest path and level-order problems.

### ⚠️ Constraint Lens

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Trees & Heaps](../02_Data_Structures/01f_Trees_Heaps.md), recursion |
| **You will learn** | Pre/in/post-order DFS, level-order BFS, BST validation by range propagation, lowest common ancestor, path problems |
| **Leads to** | [Graph + Traversal](14_Graph_Plus_Traversal.md), [Backtracking](17_Backtracking_Plus_Pruning.md) |
| **Abstraction level** | Recursion on one node → **what each call returns up / passes down** → traversal choice |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Tree + DFS/BFS

### 1. The bottom line

Decide what each node needs from its children (return value) and from its parent (parameters), then let recursion do the walk.

### 2. The textbook core

- DFS = recursion/stack; BFS = queue with level boundaries.
- Top-down passes constraints (BST range `(lo, hi)`); bottom-up returns summaries (height, diameter).
- Tree recursion visits each node once → `O(n)`; stack depth equals tree height.
- Iterative versions avoid stack overflow on skewed trees.

### 3. The real-world analogy

An **organisation chart**: some questions are answered by asking each manager to report upward (bottom-up), others by passing a policy downward (top-down).

### 4. Walkthrough

1. Validate BST: call `check(node, lo, hi)`.
2. Root 5 → left child must be in `(−∞, 5)`, right in `(5, ∞)`.
3. A left subtree node 6 violates `< 5`.
4. Return false; no need to inspect more.

> [!NOTE]
> **Quick check:** Why compare against bounds instead of only the parent? *A deep node must respect every ancestor's bound.*


### 5. Check yourself

**Q1.** Which traversal visits a BST in sorted order?

<details><summary>Answer</summary>

In-order (left, node, right).

</details>

**Q2.** What are the time and extra space of recursive tree DFS?

<details><summary>Answer</summary>

`O(n)` time and `O(h)` stack space, where `h` is the height (up to `n` for a skewed tree).

</details>

**Q3.** Why validate a BST with `(lo, hi)` bounds instead of comparing only to the parent?

<details><summary>Answer</summary>

A node must respect every ancestor's bound, not just its parent's.

</details>

---

## Historical Evolution

**Inventor / Originator:** Breadth-first search appears in Konrad Zuse's 1945 PhD thesis (unpublished until 1972), was published by Edward F. Moore in 1959 (*The shortest path through a maze*) and independently by C. Y. Lee in 1961 for circuit routing. Depth-first search as a maze strategy goes back to Trémaux (19th century); Hopcroft and Tarjan (1973) and Tarjan (1972) showed how DFS yields linear-time graph algorithms.

**Predecessor context:** Maze and graph exploration was ad hoc, without a guaranteed `O(V+E)` bound.

**Evolution narrative:** Tree traversal orders (pre-, in- and post-order) were named in Knuth's *TAOCP* Vol. 1 (1968). BFS gives shortest paths in unweighted graphs; DFS gives discovery/finish times that power cycle detection, topological ordering and connectivity.

**Modern practice:** BFS: level-order processing, shortest paths in unweighted graphs, web crawling frontiers. DFS: recursion over trees, topological sort, connected components.

- **Zuse — 1945**: BFS in an unpublished thesis
- **Moore — 1959 / Lee — 1961**: BFS for mazes and circuit routing
- **Knuth — 1968**: Named pre-order, in-order and post-order traversals
- **Tarjan — 1972 / Hopcroft & Tarjan — 1973**: DFS-based linear-time graph algorithms

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Stack overflow on deeply nested tree (depth >10K)** — Recursive DFS exhausts JVM stack on skewed trees with 10,000+ nodes. Detection: test on a chain of 50,000 nodes; recursive DFS throws StackOverflowError.

- **BFS queue memory pressure on wide trees (millions of siblings)** — BFS stores the entire frontier level in queue. For a complete binary tree with 2^20 leaves, the bottom level has 1M nodes in memory simultaneously. Detection: monitor queue size; log warning if frontier exceeds threshold.

- **Recursion tree + cache misses for skewed tree** — Skewed trees cause poor cache locality for recursive DFS. Detection: measure cache miss rate; skewed tree traversal has worse locality than balanced tree.

**Production Selection Heuristic:** Use iterative BFS (ArrayDeque) as default for production tree traversal to avoid stack overflow. Reserve recursive DFS for balanced trees with known depth limits.

---

| Given Constraints            | Do This                                 |
| ---------------------------- | --------------------------------------- |
| level order / minimum depth  | BFS                                     |
| path sum / subtree aggregate | DFS postorder/preorder                  |
| `N` can be very deep in Java | iterative stack to avoid stack overflow |
| BST ordered query            | inorder / TreeMap logic                 |
| many path queries            | LCA / HLD                               |
| subtree queries              | Euler Tour + Fenwick/segment tree       |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

## 🧠 Deep Intuition — DFS vs BFS Are Fundamentally Different Questions

Choosing between DFS and BFS isn't arbitrary — each algorithm answers a fundamentally different question:

- **DFS** asks: "What happens if I go as deep as possible along each branch?" This naturally models problems about **paths** (root-to-leaf, any path sum), **tree structure** (is this a valid BST?), and **subtree properties** (height, size, balance). DFS maps perfectly to recursion because tree problems are inherently recursive: the answer for a tree = combining the answers for its subtrees.

- **BFS** asks: "What's at each level?" This naturally models problems about **level-order processing** (print levels, zigzag, right-side view), **shortest distance** (minimum depth, nearest leaf), and **connecting nodes at the same depth** (next pointers).

### Why Inorder Traversal of a BST Gives Sorted Output

A BST has the invariant: `all left subtree values < root < all right subtree values`. Inorder traversal visits left → root → right. By induction: the left subtree's inorder is sorted (all values < root), then root (bigger than all left), then right subtree's inorder (all values > root). The concatenation is sorted. This is why BST validation can be done by checking if inorder traversal is strictly increasing.

### Space Complexity: DFS vs BFS — The Critical Trade-off

- **DFS space = O(h)** where h = tree height. For a balanced tree, h = log n. For a skewed tree (like a linked list), h = n.
- **BFS space = O(w)** where w = maximum width. For a complete binary tree, the last level has n/2 nodes, so BFS uses O(n/2) space.

💡 **Rule:** For tall, narrow trees → BFS uses less space. For wide, balanced trees → DFS uses less space. In practice, most interview problems work well with either, but the choice affects correctness (BFS for shortest path, DFS for path-based problems).

---

## 🧠 WHEN TO RECOGNIZE

```
Use DFS when:                    Use BFS when:
✅ Path from root to leaf        ✅ Level-order traversal
✅ Check if tree has property    ✅ Shortest path in tree
✅ Construct tree from traversal ✅ Connect nodes at same level
✅ Subtree operations            ✅ Zigzag traversal
✅ LCA (Lowest Common Ancestor)  ✅ Right-side view
```

---

## 📐 CORE TEMPLATES

### Template 1: DFS — Recursive (Most Common)

```java
// Pattern: process root, then children
int dfs(TreeNode node) {
    if (node == null) return 0;  // BASE CASE

    int left = dfs(node.left);   // RECURSE left
    int right = dfs(node.right); // RECURSE right

    // PROCESS: combine results
    return 1 + Math.max(left, right);  // Example: max depth
}
```

### Template 2: BFS — Level Order

```java
Queue<TreeNode> queue = new LinkedList<>();
queue.offer(root);
List<List<Integer>> levels = new ArrayList<>();

while (!queue.isEmpty()) {
    int size = queue.size();  // CRITICAL: snapshot size
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < size; i++) {
        TreeNode node = queue.poll();
        level.add(node.val);
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
    levels.add(level);
}
```

### Template 3: DFS with Path Tracking

```java
void dfs(TreeNode node, int target, List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);

    if (node.left == null && node.right == null && target == node.val) {
        result.add(new ArrayList<>(path));  // COPY path!
    }

    dfs(node.left, target - node.val, path, result);
    dfs(node.right, target - node.val, path, result);
    path.remove(path.size() - 1);  // BACKTRACK
}
```

### Template 4: BST Operations

```java
// Search in BST — O(log n) average
TreeNode search(TreeNode root, int val) {
    if (root == null || root.val == val) return root;
    return val < root.val ? search(root.left, val) : search(root.right, val);
}

// Validate BST — inorder must be sorted
boolean isValid(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return isValid(node.left, min, node.val) && isValid(node.right, node.val, max);
}
```

---

## 🔬 VISUAL: DFS vs BFS Traversal Order

```
Tree:        1
           /   \
          2     3
         / \   / \
        4   5 6   7

DFS (Preorder):  1 → 2 → 4 → 5 → 3 → 6 → 7  (go deep first)
DFS (Inorder):   4 → 2 → 5 → 1 → 6 → 3 → 7  (left-root-right)
DFS (Postorder): 4 → 5 → 2 → 6 → 7 → 3 → 1  (children first)
BFS (Level):     1 | 2,3 | 4,5,6,7             (level by level)
```

---

## 🔬 FULL WALKTHROUGH: Validate BST (Range Propagation)

```
Problem: Check if a binary tree is a valid BST.
         5
        / \
       1   4       Valid? NO! (4 < 5 but is in RIGHT subtree)
          / \
         3   6

Approach: Top-down range check. Pass (min, max) bounds DOWN.
  Each node must satisfy: min < node.val < max

WHY range propagation? Just checking node > left && node < right
is NOT enough. Node 3 (under 4) is in 5's RIGHT subtree, so it
must be > 5. But 3 < 5 → INVALID.

Step-by-step:
  validate(5, -∞, +∞): 5 in (-∞, +∞) ✅
    validate(1, -∞, 5): 1 in (-∞, 5) ✅
    validate(4, 5, +∞): 4 in (5, +∞) ❌ (4 < 5!)
  → Return false

Time: O(n) | Space: O(h)
```

---

## 🔬 FULL WALKTHROUGH 2: BFS Level Order Traversal

```
Problem: Return node values level by level.
         3
        / \
       9  20
          / \
         15  7

Approach: BFS with Queue. Process level by level using queue size.

Step-by-step:
  queue = [3]

  Level 0: size=1
    Dequeue 3, add to level list. Enqueue children: 9, 20.
    result = [[3]]
    queue = [9, 20]

  Level 1: size=2
    Dequeue 9, add to level list. No children.
    Dequeue 20, add to level list. Enqueue children: 15, 7.
    result = [[3], [9, 20]]
    queue = [15, 7]

  Level 2: size=2
    Dequeue 15, add to level list. No children.
    Dequeue 7, add to level list. No children.
    result = [[3], [9, 20], [15, 7]]
    queue = [] → done!

  Answer: [[3], [9, 20], [15, 7]] ✅

KEY: The "level snapshot" trick = process exactly queue.size() nodes per level.
     int size = queue.size();  // snapshot BEFORE adding children
     for (int i = 0; i < size; i++) { ... }

Time: O(n) | Space: O(w) where w = max width of tree
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
```

| Edge Case | Handling |
| --- | --- |
| Null root | Return empty list / false / 0 |
| Single node (leaf) | Height=0, depth=0, is balanced |
| Skewed tree (like linked list) | Height = n, BFS space = O(1) |
| Complete binary tree | BFS space = O(n/2) for last level |
| Duplicate values in BST | Convention: left < root ≤ right |
| Integer.MIN/MAX in BST ranges | Use Long.MIN/MAX for range bounds |

```
COMMON MISTAKES:
1. BST validation: checking only parent, not full ancestor range
   Node must be within (min, max) inherited from ALL ancestors above!
2. Forgetting to snapshot queue size in BFS level order
   Without snapshot: children mix into the same level
3. Confusing preorder/inorder/postorder — draw the tree and trace!
   Pre: root-left-right. In: left-root-right. Post: left-right-root.
4. Max path sum: returning path-through-node but answer needs turn
   The function returns max single-path, but updates global with turn.
5. Using == instead of .equals() for TreeNode values (rare but tricky)
```

---

## 📊 COMPLEXITY SUMMARY

| Operation                 | Time | Space | Notes                            |
| ------------------------- | ---- | ----- | -------------------------------- |
| DFS traversals (any)      | O(n) | O(h)  | h = log n balanced, n skewed     |
| BFS level order           | O(n) | O(w)  | w = max width ≈ n/2 bottom level |
| BST search/insert         | O(h) | O(1)  | O(log n) balanced, O(n) skewed   |
| Validate BST              | O(n) | O(h)  | Must visit every node            |
| LCA (binary tree)         | O(n) | O(h)  | LCA (BST) = O(h)                 |
| Construct from traversals | O(n) | O(n)  | Need HashMap for index lookup    |

---

## 📋 Practice Problems

> [!NOTE]
> The *Companies* column lists employers that candidates have reported asking the problem. These tags are community-reported, change over time and are **not verified** — use them as hints about relevance, not as facts.

| # | Problem | Companies | Approach |
| --- | --- | --- | --- |
| 1 | [Maximum Depth](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | — | DFS: 1 + max(left, right) |
| 2 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | — | DFS: track leftH + rightH at each node |
| 3 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | Amazon, Walmart | DFS: swap left and right |
| 4 | [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/) | Amazon, Walmart, Microsoft | DFS: isSameTree at each node |
| 5 | [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/) | Goldman Sachs, Walmart | Mirror DFS: left.left↔right.right |
| 6 | [Same Tree](https://leetcode.com/problems/same-tree/) | — | DFS: compare value + structure |
| 7 | [Path Sum](https://leetcode.com/problems/path-sum/) | — | DFS: subtract node value, check leaf |
| 8 | [Merge Two Binary Trees](https://leetcode.com/problems/merge-two-binary-trees/) | — | DFS: sum values, recurse both |
| 9 | [Range Sum of BST](https://leetcode.com/problems/range-sum-of-bst/) | — | BST pruning DFS |
| 10 | [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | Microsoft | DFS: check height diff ≤ 1 |
| 11 | [Sum of Left Leaves](https://leetcode.com/problems/sum-of-left-leaves/) | Salesforce, Microsoft | DFS: track if node is left child |
| 12 | [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/) | Salesforce, Microsoft | DFS with path string |
| 13 | [LCA of BST](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | Goldman Sachs | BST split point |
| 14 | [Convert Sorted Array to BST](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/) | — | Mid-point recursion |
| 15 | [Min Absolute Difference in BST](https://leetcode.com/problems/minimum-absolute-difference-in-bst/) | — | Inorder traversal = sorted |
| 16 | [Predecessor and Successor](https://practice.geeksforgeeks.org/problems/predecessor-and-successor/1) | — | BST property navigation |
| 17 | [Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/) | — | Recursion or Morris traversal |
| 18 | [Dead End in BST](https://practice.geeksforgeeks.org/problems/check-whether-bst-contains-dead-end/1) | — | Track min/max range |

### Medium

| #   | Problem                                                                                                                           | Companies                      | Key Insight                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| 19  | [BST Iterator](https://leetcode.com/problems/binary-search-tree-iterator/)                                                        | —                              | Stack-based inorder                |
| 20  | [LCA of Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)                                      | —                              | DFS: return non-null from subtrees |
| 21  | [Validate BST](https://leetcode.com/problems/validate-binary-search-tree/)                                                        | Amazon                         | Min/max range propagation          |
| 22  | [Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)                                         | —                              | BFS with level snapshot            |
| 23  | [Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)                                                     | —                              | BFS: last node per level           |
| 24  | [Zigzag Level Order](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/)                                     | Salesforce                     | BFS + alternating direction        |
| 25  | [Kth Smallest in BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)                                               | Amazon                         | Inorder, count to k                |
| 26  | [All Nodes Distance K](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/)                                        | Microsoft                      | Convert to graph + BFS             |
| 27  | [Unique BSTs II](https://leetcode.com/problems/unique-binary-search-trees-ii/)                                                    | —                              | DFS: enumerate all structures      |
| 28  | [Unique BSTs Count](https://leetcode.com/problems/unique-binary-search-trees/)                                                    | Amazon, Salesforce, Microsoft  | Catalan number / DP                |
| 29  | [Path Sum III](https://leetcode.com/problems/path-sum-iii/)                                                                       | Microsoft                      | Prefix sum + DFS                   |
| 30  | [Construct from Preorder+Postorder](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-postorder-traversal/)   | Amazon, Salesforce             | Index lookup                       |
| 31  | [Flatten to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/)                                       | —                              | Reverse postorder                  |
| 32  | [Maximum Width](https://leetcode.com/problems/maximum-width-of-binary-tree/)                                                      | —                              | BFS + position indexing            |
| 33  | [Populating Next Right Pointers](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/)                      | Salesforce, Microsoft, Walmart | BFS or constant space traversal    |
| 34  | [Recover BST](https://leetcode.com/problems/recover-binary-search-tree/)                                                          | Salesforce                     | Inorder: find two swapped          |
| 35  | [Min Distance Between Nodes](https://practice.geeksforgeeks.org/problems/min-distance-between-two-given-nodes-of-a-binary-tree/1) | Amazon                         | LCA + distance from LCA            |
| 36  | [Count BST Nodes in Range](https://practice.geeksforgeeks.org/problems/count-bst-nodes-that-lie-in-a-given-range/1)               | —                              | Pruned DFS                         |
| 37  | [Preorder to Postorder](https://practice.geeksforgeeks.org/problems/preorder-to-postorder4423/1)                                  | Amazon, Microsoft              | Reconstruct BST then traverse      |
| 38  | [Redundant Connection](https://leetcode.com/problems/redundant-connection/)                                                       | —                              | Union-Find (not pure tree)         |

### Hard

| #   | Problem                                                                                                  | Companies          | Key Insight                        |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------- |
| 39  | [Binary Tree to DLL](https://practice.geeksforgeeks.org/problems/binary-tree-to-dll/1)                   | —                  | Inorder with prev pointer          |
| 40  | [Max Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)                              | Salesforce         | DFS: consider path through node    |
| 41  | [Sum of Distances in Tree](https://leetcode.com/problems/sum-of-distances-in-tree/)                      | Salesforce         | Rerooting technique                |
| 42  | [Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/)                                | Amazon, Salesforce | Greedy DFS: 3 states               |
| 43  | [Vertical Order Traversal](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/)     | Amazon             | BFS/DFS + column tracking          |
| 44  | [K Sum Paths](https://www.geeksforgeeks.org/print-k-sum-paths-binary-tree/)                              | Amazon             | DFS + prefix sum                   |
| 45  | [Serialize/Deserialize](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)            | Amazon             | Preorder + queue                   |
| 46  | [Find Median in BST O(1) Space](https://www.geeksforgeeks.org/find-median-bst-time-o1-space/)            | —                  | Morris inorder traversal           |
| 47  | [Largest BST in Binary Tree](https://www.geeksforgeeks.org/largest-bst-binary-tree-set-2/)               | Microsoft          | Post-order: propagate min/max/size |
| 48  | [Construct BST from Preorder](https://www.geeksforgeeks.org/construct-bst-from-given-preorder-traversa/) | —                  | Upper-bound approach               |

### Additional — From Bonus Section

| #   | Problem                       | Key Insight                     |
| --- | ----------------------------- | ------------------------------- |
| 49  | Check Mirror in N-ary Tree    | Compare children in reverse     |
| 50  | Max Sum No Two Adjacent       | House Robber on tree (DFS + DP) |
| 51  | Brothers From Different Roots | Pair sum between two BSTs       |

---

## 🔥 KEY TRICKS

| Trick                  | When                         | Example                     |
| ---------------------- | ---------------------------- | --------------------------- |
| Return multiple values | Need height + answer         | Use class variable or int[] |
| Inorder = sorted       | BST validation, kth smallest | Inorder traversal           |
| Level size snapshot    | BFS level processing         | `int size = queue.size()`   |
| Morris traversal       | O(1) space inorder           | Threading tree nodes        |
| Rerooting              | Change root problems         | Two-pass DFS                |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Tree DFS/BFS

**When the interviewer gives you a tree problem, say this:**

"I'll use DFS/BFS depending on the problem type. DFS is natural for tree problems because trees are recursive structures — the answer for a tree combines answers from its subtrees. Each node is visited exactly once, so time is O(n). Space is O(h) where h is height — O(log n) for balanced, O(n) for skewed."

**How to choose DFS vs BFS:**

- "If the problem asks about paths (root-to-leaf, path sum) or subtree properties (height, balance, validation) → **DFS**, because we need to fully explore each branch."
- "If the problem asks about levels (level-order, zigzag, right-side view, minimum depth) → **BFS**, because it naturally processes level by level."

**Key mathematical justification:**

- "BST inorder gives sorted output because of the BST invariant: left < root < right. By induction, left subtree's inorder is sorted + all < root, root, right subtree's inorder is sorted + all > root."
- "DFS space = O(h). BFS space = O(w) where w = max width. For balanced trees, h = log n but w = n/2 at last level — DFS uses less space."

**Common mistakes to proactively mention:**

- ❌ "Don't assume log n depth — a skewed tree has depth n, causing O(n) space for DFS."
- ❌ "For BFS, snapshot level size at the start: `int size = queue.size()` — otherwise the loop boundary shifts as you add children."
- ❌ "Recursive DFS on very deep trees (> 10,000 nodes) → StackOverflow. Use iterative DFS with explicit stack."

**Real-world applications:**

- File system traversal (`find`, `du`, `ls -R` — DFS)
- DOM tree traversal in web browsers
- Database B-Tree index traversal (searching, range queries)
- Compiler AST (Abstract Syntax Tree) processing
- Organization chart traversal (reporting structures)

---

📖 **Related Chapters:**

- [03_Algorithms/05_Trees.md](../03_Algorithms/05_Trees.md) — Tree algorithms deep dive
- [09_Career_Reference/07_DSA_Guide_Foundations.md](../09_Career_Reference/07_DSA_Guide_Foundations.md) — DSA fundamentals

---

[← 12 LinkedList+TwoPointers](12_LinkedList_Plus_TwoPointers.md) | [14 Graph+Traversal →](14_Graph_Plus_Traversal.md)


---

## 🏢 Enterprise Lens — Tree + DFS/BFS

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | File-system walks, DOM traversal, expression-tree evaluation, org-chart roll-ups |
| **Failure modes** | Stack overflow on deep trees; mixing up traversal order; ignoring null children |
| **Testing and verification** | Build random trees; compare recursive and iterative results; test skewed and single-node trees |

---

## Reality Check

**"DFS vs BFS on trees is a style choice"** → They answer different question families at different costs: BFS gives level structure and nearest-first (level-order views, minimum depth, first-X-per-level) with O(width) memory; DFS gives path structure (root-to-leaf sums, ancestor relationships) with O(height) memory. On a balanced tree width dwarfs height (2^h leaves vs h depth) — BFS on the bottom level of a million-node tree holds half a million queue entries while DFS holds twenty frames. Choose by the question, budget by the shape.

**"Recursion returning one value is the whole story"** → The three information-flow modes are the actual pattern: DOWN via parameters (path state, bounds for BST validation), UP via return values (heights, subtree sums), and SIDEWAYS via mutable state (global max in diameter/path-sum problems). Hard tree problems are hard precisely because they need two flows at once — diameter returns height UP while updating the answer SIDEWAYS — and forcing everything through the return value produces the tangled tuples people cannot debug.

**"Validate-BST checks each node against its children"** → The classic wrong answer: locally node.left < node < node.right passes trees that violate the GLOBAL invariant (a right-subtree node smaller than the root). Correct versions carry (min, max) bounds DOWN or verify the inorder traversal is sorted. This bug is the canonical example of why invariants must be stated over the whole subtree, not the immediate edge — the lesson generalizes to every tree property you will ever check.

**"Level-order traversal needs a null-marker in the queue"** → Snapshot the queue SIZE at loop start and drain exactly that many — cleaner than sentinel nulls, no special-casing, and it naturally yields the per-level list the problems ask for. Sentinel-based level tracking survives in old tutorials; size-snapshot is strictly less code and one fewer class of bug (forgetting to re-add the marker).

**"Tree problems generalize trivially to n-ary and graphs"** → Two seams break: child iteration (left/right hardcoding becomes a loop — problems arise when half the template assumed exactly two) and VISITED tracking (trees need none because parent-child edges never revisit; graphs without a visited set loop forever). The infamous bug class: applying a tree template to "graph that is almost a tree" input and stack-overflowing on the one cycle the constraints allowed.
