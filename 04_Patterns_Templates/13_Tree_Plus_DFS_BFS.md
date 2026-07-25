**Navigation**: [< Previous](12_LinkedList_Plus_TwoPointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Graph_Plus_Traversal.md)

# Tree + DFS/BFS — Combined Pattern Guide

**WHY this combination?** Trees are hierarchical. DFS explores depth-first (recursion/stack) — ideal for path problems. BFS explores level-by-level (queue) — ideal for shortest path and level-order problems.

### ⚠️ Constraint Lens

### Historical Evolution

**Inventor / Originator:** BFS was invented by Edward Moore (1959) for shortest path in unweighted graphs. Dijkstra (1959) formalized it. DFS was optimized by Hopcroft and Tarjan (1973) for planar graph testing.

**Predecessor context:** Tree traversal required recursive approaches or manual stack management. Graph traversal had no standardized methodology before Moore and Dijkstra.

**Evolution narrative:** Moore recognized that breadth-first exploration naturally solves shortest path on unweighted graphs. Dijkstra formalized the algorithm. Hopcroft and Tarjan developed iterative DFS with explicit stack management for O(V+E) performance.

**Modern practice:** BFS is the foundation of web crawlers, social network friend suggestions, and shortest path in unweighted networks. DFS is used in topological sort, cycle detection, and component identification.

- **Moore BFS — 1959**: Shortest path in unweighted graphs; named "Breadth-First Search"
- **Dijkstra 1959**: Formalized BFS with edge relaxation; extended to weighted graphs
- **Hopcroft-Tarjan 1973**: Planarity testing using DFS with explicit stack management
- **Modern practice**: BFS for web crawlers, DFS for topological sort and cycle detection

---

### Production Reality

**Pattern Mis-Selection Debug Workflow — How to identify the wrong pattern:**

When your solution is O(N²) when you expected O(N), or fails on specific inputs, the bug is usually pattern mis-selection, not code. Use this 5-step workflow:

1. **Check the constraint lens**: Did the input violate the pattern's prerequisite? (e.g., sorted input for two pointers, positive numbers for sliding window sum)
2. **Trace the failure input**: For the smallest failing case, identify which invariant broke. Does the algorithm assume the invariant that wasn't true?
3. **Measure the actual complexity**: Add a counter for the inner-loop iterations. O(N²) when O(N) expected usually means a redundant scan, not a wrong algorithm.
4. **Check edge cases the pattern doesn't cover**: Empty input, single element, all-same values, maximum/minimum values. These often reveal the wrong pattern.
5. **Escalate to a different pattern family**: If 4 steps don't fix it, the pattern itself is wrong. Switch to the pattern suggested by the constraint lens.

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

### 🧠 Deep Intuition — DFS vs BFS Are Fundamentally Different Questions

Choosing between DFS and BFS isn't arbitrary — each algorithm answers a fundamentally different question:

- **DFS** asks: "What happens if I go as deep as possible along each branch?" This naturally models problems about **paths** (root-to-leaf, any path sum), **tree structure** (is this a valid BST?), and **subtree properties** (height, size, balance). DFS maps perfectly to recursion because tree problems are inherently recursive: the answer for a tree = combining the answers for its subtrees.

- **BFS** asks: "What's at each level?" This naturally models problems about **level-order processing** (print levels, zigzag, right-side view), **shortest distance** (minimum depth, nearest leaf), and **connecting nodes at the same depth** (next pointers).

#### Why Inorder Traversal of a BST Gives Sorted Output

A BST has the invariant: `all left subtree values < root < all right subtree values`. Inorder traversal visits left → root → right. By induction: the left subtree's inorder is sorted (all values < root), then root (bigger than all left), then right subtree's inorder (all values > root). The concatenation is sorted. This is why BST validation can be done by checking if inorder traversal is strictly increasing.

#### Space Complexity: DFS vs BFS — The Critical Trade-off

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

## � FULL WALKTHROUGH: Validate BST (Range Propagation)

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
┌──────────────────────────────┬────────────────────────────────────────┐
│ Edge Case                    │ Handling                               │
├──────────────────────────────┼────────────────────────────────────────┤
│ Null root                    │ Return empty list / false / 0          │
│ Single node (leaf)           │ Height=0, depth=0, is balanced         │
│ Skewed tree (like linked list)│ Height = n, BFS space = O(1)          │
│ Complete binary tree          │ BFS space = O(n/2) for last level     │
│ Duplicate values in BST      │ Convention: left < root ≤ right        │
│ Integer.MIN/MAX in BST ranges│ Use Long.MIN/MAX for range bounds      │
└──────────────────────────────┴────────────────────────────────────────┘

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

🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

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

## Reality Check

**"DFS vs BFS on trees is a style choice"** → They answer different question families at different costs: BFS gives level structure and nearest-first (level-order views, minimum depth, first-X-per-level) with O(width) memory; DFS gives path structure (root-to-leaf sums, ancestor relationships) with O(height) memory. On a balanced tree width dwarfs height (2^h leaves vs h depth) — BFS on the bottom level of a million-node tree holds half a million queue entries while DFS holds twenty frames. Choose by the question, budget by the shape.

**"Recursion returning one value is the whole story"** → The three information-flow modes are the actual pattern: DOWN via parameters (path state, bounds for BST validation), UP via return values (heights, subtree sums), and SIDEWAYS via mutable state (global max in diameter/path-sum problems). Hard tree problems are hard precisely because they need two flows at once — diameter returns height UP while updating the answer SIDEWAYS — and forcing everything through the return value produces the tangled tuples people cannot debug.

**"Validate-BST checks each node against its children"** → The classic wrong answer: locally node.left < node < node.right passes trees that violate the GLOBAL invariant (a right-subtree node smaller than the root). Correct versions carry (min, max) bounds DOWN or verify the inorder traversal is sorted. This bug is the canonical example of why invariants must be stated over the whole subtree, not the immediate edge — the lesson generalizes to every tree property you will ever check.

**"Level-order traversal needs a null-marker in the queue"** → Snapshot the queue SIZE at loop start and drain exactly that many — cleaner than sentinel nulls, no special-casing, and it naturally yields the per-level list the problems ask for. Sentinel-based level tracking survives in old tutorials; size-snapshot is strictly less code and one fewer class of bug (forgetting to re-add the marker).

**"Tree problems generalize trivially to n-ary and graphs"** → Two seams break: child iteration (left/right hardcoding becomes a loop — problems arise when half the template assumed exactly two) and VISITED tracking (trees need none because parent-child edges never revisit; graphs without a visited set loop forever). The infamous bug class: applying a tree template to "graph that is almost a tree" input and stack-overflowing on the one cycle the constraints allowed.
