# Trees

> **Navigation**: [← Backtracking](12_Backtracking.md) | [Chapter index](00_INDEX.md) | [Trie Problems →](30_Trie_Problems.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Trees](../03_Algorithms/05_Trees.md), [Tree + DFS/BFS](../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md) |
| **You will learn** | Traversals, depth/height, BST validation, lowest common ancestor, path sums and serialisation |
| **Leads to** | [Graphs](10_Graphs.md), [Heap](16_Heap.md) |
| **Abstraction level** | Recursion on one node → **what each call returns and receives** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Tree Problems

### 1. The bottom line

Decide what each node needs from above (parameters) and gives to above (return value), then recurse.

### 2. The textbook core

- DFS = recursion; BFS = queue with level size.
- Validate a BST with `(lo, hi)` bounds.
- LCA: a node whose left and right subtrees both contain targets.
- Recursion depth equals tree height — convert to iteration for skewed trees.
- Serialisation needs null markers.

### 3. The real-world analogy

An **org chart**: questions are answered by asking each manager to report up or passing policy down.

### 4. Walkthrough

1. Maximum depth of a binary tree.
2. Base case: null node → 0.
3. Return `1 + max(depth(left), depth(right))`.
4. Visits each node once: `O(n)` time, `O(h)` stack.

> [!NOTE]
> **Quick check:** Why compare against bounds instead of only the parent in BST validation? *Every ancestor imposes a bound on a deep node.*


### 5. Check yourself

**Q1.** Maximum depth of the tree `[3,9,20,null,null,15,7]`?

<details><summary>Answer</summary>

**3**.

</details>

**Q2.** Lowest common ancestor of nodes 5 and 1 in `[3,5,1,6,2,0,8]`?

<details><summary>Answer</summary>

**3**, the root: 5 is in its left subtree and 1 in its right.

</details>

---


## 🗺️ Pattern Recognition Header — Trees

**Tree Problem Type Identifier** — ask these before every problem:

| If it asks...                      | Pattern             | Direction                  |
| ---------------------------------- | ------------------- | -------------------------- |
| `max depth / height / balanced`    | Bottom-Up DFS       | Return value UP            |
| `path sum / root-to-leaf paths`    | Top-Down DFS        | Pass value DOWN            |
| `diameter / max path sum`          | Both Directions     | Return UP + global tracker |
| `level order / min depth / zigzag` | BFS (Queue)         | Breadth first              |
| `validate BST / search in BST`     | Top-Down with range | Pass [min,max] DOWN        |
| `build tree from traversal`        | Divide & Conquer    | Split array by root        |

**The "Info Goes UP or DOWN?" Mental Model:**

```
Does problem need info from ANCESTORS?  → TOP-DOWN (pass as parameter)
Does problem need info from DESCENDANTS? → BOTTOM-UP (return from recursion)
Does it need BOTH?                       → Both directions + global tracker
```

📖 **Mental Model:** [03_Graph_Tree_Thinking.md](../14_Mental_Models/03_Graph_Tree_Thinking.md)
📖 **Theory:** [01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [SECTION 8: TREE PROBLEMS (BFS/DFS)](09_Trees/01_section_8_tree_problems_bfs_dfs.md) | SECTION 8: TREE PROBLEMS (BFS/DFS) · WHY Trees Are the #1 Interview Topic & How to… | 289 |
| 2 | [8.1 Tree Traversal Problems](09_Trees/02_tree_traversal_problems.md) | 8.1 Tree Traversal Problems | 335 |
| 3 | [8.2 Tree Property Problems](09_Trees/03_tree_property_problems.md) | 8.2 Tree Property Problems | 314 |
| 4 | [8.3 Path & Sum Problems](09_Trees/04_path_sum_problems.md) | 8.3 Path & Sum Problems | 308 |
| 5 | [8.4 Binary Search Tree (BST) Problems](09_Trees/05_binary_search_tree_bst_problems.md) | 8.4 Binary Search Tree (BST) Problems | 313 |
| 6 | [8.5 Tree Construction Problems](09_Trees/06_tree_construction_problems.md) | 8.5 Tree Construction Problems | 190 |
| 7 | [8.6 HackerEarth & Codeforces Tree Problems](09_Trees/07_hackerearth_codeforces_tree_problems.md) | 8.6 HackerEarth & Codeforces Tree Problems · Competitive Programming — Codeforces Problems · Real-World Applications of Tree Algorithms | 349 |

## 🏢 Enterprise Lens — Tree Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | File systems, DOM trees, expression trees, indexes |
| **Failure modes** | Stack overflow on deep trees; forgetting null children |
| **Testing and verification** | Random trees against a simple reference |

---

## Reality Check

**"Tree problem practice means traversal practice"** — Traversals are the alphabet; the problems drill three recurring COMPOSITIONS: aggregate-up (heights, sums, balance checks — postorder shape), propagate-down (bounds, path state — preorder shape), and cross-subtree combination (diameter, max path sum — the child answers combine at the parent while a global tracks the best). Filing each solved problem under its composition, not its title, is what makes the fiftieth tree problem feel like the fifth.

**"Lowest common ancestor is one algorithm"** — LCA fragments by the CONTRACT: plain binary tree wants the recursive both-sides-report trick; BST wants value-guided descent (walk until the split point); with-parent-pointers becomes intersection-of-two-linked-lists; nodes-possibly-absent requires verifying existence before trusting the standard trick (the classic silent-wrong-answer). Interviews escalate through these variants deliberately — knowing only the first is knowing one rung.

**"Serialize/deserialize is about choosing a format"** — It is about NULL DISCIPLINE: preorder-with-null-markers makes reconstruction a single linear consume-in-order pass; formats without null markers force ambiguity (inorder alone cannot reconstruct) or auxiliary structure (preorder-plus-inorder index maps). The insight the problem teaches — null markers convert tree shape into a self-describing stream — recurs in every wire protocol and columnar layout you will ever design.

**"Path problems all mean root-to-leaf"** — Three different path DEFINITIONS with different machinery: root-to-leaf (carry state down, decide at leaves), downward-any-start (prefix-sum-on-paths with a backtracking HashMap — the elegant one), and any-node-to-any-node through a bend (the combine-at-parent shape with the return-only-one-arm subtlety). Max-path-sum's notorious difficulty is entirely in that last subtlety: a node RETURNS its best single arm while RECORDING its best bent path. Misreading which definition applies wastes the whole attempt.

**"BST problems are easier binary tree problems"** — BST problems test whether you EXPLOIT the invariant instead of ignoring it: kth-smallest is inorder-with-early-stop, not collect-and-sort; validate needs range-carrying, not local checks; two-sum-in-BST can two-pointer via two iterators; recover-swapped-nodes reads the inorder sequence for the two inversions. Solving BST problems with generic tree methods is correct and slow — and interviewers grade the missed exploitation, not just the output.
