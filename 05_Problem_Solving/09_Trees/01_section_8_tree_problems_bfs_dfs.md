# 📚 SECTION 8: TREE PROBLEMS (BFS/DFS)

> **Navigation**: [Chapter overview](../09_Trees.md) | [8.1 Tree Traversal Problems →](02_tree_traversal_problems.md)
> Page 1 of 7 in **Trees**


```
┌─────────────────────────────────────────────────────────────────┐
│                    TREE TRAVERSAL PATTERNS                      │
├─────────────────────────────────────────────────────────────────┤
│  BINARY TREE STRUCTURE:                                         │
│            ┌───┐                                                │
│            │ 1 │ ← Root                                         │
│            └─┬─┘                                                │
│         ┌───┴───┐                                               │
│       ┌─┴─┐   ┌─┴─┐                                             │
│       │ 2 │   │ 3 │                                             │
│       └─┬─┘   └─┬─┘                                             │
│      ┌──┴──┐    └──┐                                            │
│    ┌─┴─┐ ┌─┴─┐   ┌─┴─┐                                          │
│    │ 4 │ │ 5 │   │ 6 │                                          │
│    └───┘ └───┘   └───┘                                          │
│                                                                 │
│  TRAVERSAL ORDERS:                                              │
│  ┌────────────┬──────────────────┬──────────────────┐           │
│  │ Preorder   │ Root→Left→Right  │ 1,2,4,5,3,6      │           │
│  │ Inorder    │ Left→Root→Right  │ 4,2,5,1,3,6      │           │
│  │ Postorder  │ Left→Right→Root  │ 4,5,2,6,3,1      │           │
│  │ Level Order│ Level by level   │ 1,2,3,4,5,6      │           │
│  └────────────┴──────────────────┴──────────────────┘           │
│                                                                 │
│  DFS vs BFS:                                                    │
│  ┌─────────────────────┬─────────────────────────────┐          │
│  │ DFS (Stack/Recursion)│ BFS (Queue)                │          │
│  │ - Go deep first      │ - Go wide first            │          │
│  │ - Preorder/In/Post   │ - Level order traversal    │          │
│  │ - Path problems      │ - Shortest path problems   │          │
│  │ - Tree height/depth  │ - Level-wise processing    │          │
│  └─────────────────────┴─────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 0: WHY Trees Are the #1 Interview Topic & How to Think About Them

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          TREE PROBLEMS — COMPLETE UNDERSTANDING & GROWTH MINDSET             ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY ARE TREES THE #1 INTERVIEW TOPIC?                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Trees test BOTH recursion skills AND data structure understanding.           │
│ They account for 20-25% of coding interview questions.                       │
│                                                                              │
│ REAL-WORLD SYSTEMS BUILT ON TREES:                                           │
│ • File systems: Every folder/file is a tree node                             │
│ • DOM (web pages): HTML → head/body → div/p... is a tree                     │
│ • Databases: B-trees, B+ trees power every SQL database index                │
│ • Compilers: Abstract Syntax Tree (AST) represents code structure            │
│ • Operating systems: Process hierarchy (parent/child processes)              │
│ • AI/ML: Decision trees, random forests, parse trees in NLP                  │
│ • Network routing: Spanning trees prevent packet loops                       │
│                                                                              │
│ Google, Amazon, Meta report tree problems in ~30% of coding rounds.          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE MENTAL MODEL: Every Tree Problem = "Info goes UP or DOWN?"               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TREE PROBLEMS HAVE EXACTLY TWO INFORMATION FLOWS:                            │
│                                                                              │
│                        [root = 1]                                            │
│                       ↙↓   ↑↘                                                │
│              TOP-DOWN ↓     ↑ BOTTOM-UP                                      │
│              (pass info ↓     ↑ (return info                                 │
│               to kids)  ↓     ↑  to parent)                                  │
│                     [2]   [3]                                                │
│                    ↙  ↘     ↘                                                │
│                 [4]    [5]   [6]                                             │
│                                                                              │
│  ↓ TOP-DOWN (passing info FROM parent TO children):                          │
│    • BST validation: pass [min, max] range down                              │
│    • Path sum: pass remaining target down                                    │
│    • Depth counter: pass current_depth + 1 down                              │
│    • Root-to-leaf paths: pass path prefix down                               │
│                                                                              │
│  ↑ BOTTOM-UP (returning info FROM children TO parent):                       │
│    • Height/depth: max(leftHeight, rightHeight) + 1                          │
│    • Is balanced: both subtrees balanced AND heights differ ≤ 1              │
│    • Subtree sum: leftSum + rightSum + node.val                              │
│    • Same tree: leftSame AND rightSame AND values equal                      │
│                                                                              │
│  ↕ BOTH DIRECTIONS (hardest problems):                                       │
│    • Max path sum: return best single-path UP, track global across paths     │
│    • Diameter: return height UP, track max(leftH + rightH) globally          │
│    • Lowest Common Ancestor: return found nodes UP, meet in the middle       │
│                                                                              │
│  DECISION FLOWCHART:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │ Does the problem need info from ANCESTORS (parents, grandparents)? │      │
│  │   YES → TOP-DOWN: Pass info as parameters                        │        │
│  │   NO  → Does it need info from DESCENDANTS (children)?           │        │
│  │          YES → BOTTOM-UP: Return info in recursive calls         │        │
│  │          BOTH? → Use both: pass DOWN + return UP + global tracker│        │
│  └─────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

```java
// TOP-DOWN TEMPLATE (info flows from parent → children)
void topDown(TreeNode node, int infoFromParent) {
    if (node == null) return;                    // Base case
    // USE info from parent (e.g., depth, range, running sum)
    // Process current node with infoFromParent
    topDown(node.left, updatedInfo);             // Pass to left child
    topDown(node.right, updatedInfo);            // Pass to right child
}

// BOTTOM-UP TEMPLATE (info flows from children → parent)
int bottomUp(TreeNode node) {
    if (node == null) return baseValue;          // Base case
    int leftResult = bottomUp(node.left);        // Get from left subtree
    int rightResult = bottomUp(node.right);      // Get from right subtree
    return combine(leftResult, rightResult);     // Combine and return UP
}

// BOTH DIRECTIONS (hardest — e.g., diameter, max path sum)
int globalMax = 0;  // Track answer across all nodes
int bothDirections(TreeNode node) {
    if (node == null) return 0;
    int left = bothDirections(node.left);        // Info from below
    int right = bothDirections(node.right);      // Info from below
    globalMax = Math.max(globalMax, left + right + node.val);  // ACROSS
    return Math.max(left, right) + node.val;     // Return BEST SINGLE PATH up
}
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ THE 5 TREE PROBLEM PATTERNS (covers 95% of interviews)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌───────────────────┬──────────────────────────┬────────────────────────┐    │
│ │ Pattern           │ Template                 │ Problems               │    │
│ ├───────────────────┼──────────────────────────┼────────────────────────┤    │
│ │ 1. TRAVERSAL      │ DFS (stack) / BFS (queue)│ Inorder, Preorder,     │    │
│ │                   │ Process all nodes         │ Level Order, Zigzag    │   │
│ ├───────────────────┼──────────────────────────┼────────────────────────┤    │
│ │ 2. PROPERTY CHECK │ Return boolean/value UP  │ Max Depth, Balanced,   │    │
│ │    (Bottom-up)    │ Compare left + right      │ Symmetric, Same Tree   │   │
│ ├───────────────────┼──────────────────────────┼────────────────────────┤    │
│ │ 3. PATH / SUM     │ Carry sum DOWN           │ Path Sum, Path Sum II, │    │
│ │    (Both dirs)    │ + track global answer     │ Max Path Sum, Diameter │   │
│ ├───────────────────┼──────────────────────────┼────────────────────────┤    │
│ │ 4. BST PROPERTY   │ Use min < root < max     │ Validate BST, Search,  │    │
│ │                   │ Pass range DOWN           │ LCA in BST, Kth Small  │   │
│ ├───────────────────┼──────────────────────────┼────────────────────────┤    │
│ │ 5. CONSTRUCTION   │ Divide array by root pos │ Build from Preorder+   │    │
│ │                   │ Recurse on left/right     │ Inorder, Serialize     │   │
│ └───────────────────┴──────────────────────────┴────────────────────────┘    │
│                                                                              │
│ MINI WORKED EXAMPLES:                                                        │
│                                                                              │
│ PATTERN 1 — Level Order: Use queue. Process level by level.                  │
│      1          Queue: [1] → process → add children → [2,3]                  │
│     / \         Queue: [2,3] → process → add children → [4,5,6]              │
│    2   3        Queue: [4,5,6] → process → add children → []                 │
│   / \   \       Result: [[1], [2,3], [4,5,6]]                                │
│  4   5   6                                                                   │
│                                                                              │
│ PATTERN 2 — Max Depth (Bottom-up):                                           │
│      1    depth(1) = 1 + max(depth(2), depth(3))                             │
│     / \   depth(2) = 1 + max(depth(4), depth(5)) = 1 + max(1,1) = 2          │
│    2   3  depth(3) = 1 + max(0, depth(6)) = 1 + 1 = 2                        │
│   / \   \ depth = 1 + max(2, 2) = 3                                          │
│  4   5   6                                                                   │
│                                                                              │
│ PATTERN 4 — Validate BST (Top-down):                                         │
│      5    isValid(5, -∞, +∞) → check 5 in range                              │
│     / \   isValid(3, -∞, 5)  → 3 < 5 ✅                                       │
│    3   7  isValid(7, 5, +∞)  → 7 > 5 ✅                                       │
│   / \     isValid(1, -∞, 3)  → 1 < 3 ✅                                       │
│  1   4    isValid(4, 3, 5)   → 3 < 4 < 5 ✅                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ COMPLEXITY CHEAT SHEET                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Most tree solutions: O(n) time, O(h) space where h = height                  │
│                                                                              │
│ ┌──────────────────────┬─────────┬────────────────────────────────────┐      │
│ │ Tree Shape           │ Height  │ Space for Recursion                │      │
│ ├──────────────────────┼─────────┼────────────────────────────────────┤      │
│ │ Balanced (best)      │ log(n)  │ O(log n) — e.g., 20 for 10⁶ nodes│        │
│ │ Skewed (worst)       │ n       │ O(n) — StackOverflow risk!        │       │
│ │ Complete/Perfect     │ log(n)  │ O(log n)                          │       │
│ │ Random BST (avg)     │ ~1.39logn│ O(log n)                         │       │
│ └──────────────────────┴─────────┴────────────────────────────────────┘      │
│                                                                              │
│ BFS: O(n) time, O(w) space where w = max width of any level                  │
│   Perfect tree: w = n/2 at the widest level                                  │
│   Skewed tree:  w = 1 at every level                                         │
│                                                                              │
│ ⚡ DFS vs BFS: Use DFS when answer involves root-to-leaf paths.               │
│   Use BFS when answer involves levels (level order, min depth).              │
│   Both are O(n) time. Space: DFS = O(h), BFS = O(w).                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES IN TREE PROBLEMS                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Forgetting null check                                             │
│   WRONG: if (node.val == target)  → NullPointerException on null nodes       │
│   RIGHT: if (node == null) return; then check node.val                       │
│                                                                              │
│ MISTAKE 2: Confusing top-down and bottom-up                                  │
│   "Is balanced?" needs BOTH height (bottom-up) AND comparison.               │
│   Doing it top-down = O(n²) because you recompute heights.                   │
│   Fix: Return height from each subtree. Check |leftH - rightH| ≤ 1.          │
│                                                                              │
│ MISTAKE 3: BST validation — checking only parent, not ancestors              │
│   WRONG: node.left.val < node.val && node.right.val > node.val               │
│      5     This checks 4 < 5 ✅ and 6 > 3 ✅                                   │
│     / \    But 6 > 5 violates BST! (6 is in left subtree of 5)               │
│    3   7   RIGHT: Pass [min, max] range DOWN from root.                      │
│   / \                                                                        │
│  1   6 ← INVALID! (6 > 5 but is in left subtree)                             │
│                                                                              │
│ MISTAKE 4: Not handling skewed tree stack overflow                           │
│   Input: 10⁴ nodes in a straight line → recursion depth = 10⁴                │
│   Java default stack ~5000 frames. Can overflow!                             │
│   Fix: Mention iterative approach or increase stack size.                    │
│                                                                              │
│ MISTAKE 5: Max path sum — returning path-across-root instead of single path  │
│   The path through node = left + right + node.val (can be answer)            │
│   But RETURN to parent = max(left, right) + node.val (single path only!)     │
│   You can't go left-root-right and ALSO continue up to parent.               │
│                                                                              │
│ MISTAKE 6: Iterative inorder — forgetting to go left first                   │
│   Must push ALL left children first, then pop, then go right.                │
│   Common bug: pushing node then immediately going right.                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ RECURSIVE vs ITERATIVE — WHEN TO USE WHICH                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ RECURSIVE (use when):                                                        │
│ • Bottom-up problems (return info upward)                                    │
│ • BST range problems (natural parameter passing)                             │
│ • Construction problems (divide and conquer)                                 │
│ • Time pressure in interview (faster to write)                               │
│                                                                              │
│ ITERATIVE (use when):                                                        │
│ • Interviewer specifically asks for it                                       │
│ • Very deep trees (stack overflow risk)                                      │
│ • Level order traversal (BFS with queue)                                     │
│ • Need to stop early (Morris traversal for O(1) space)                       │
│                                                                              │
│ 💡 Interview tip: Start recursive. If asked "can you do iteratively?",        │
│ use explicit stack for DFS, queue for BFS.                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING TREE PROBLEMS ⭐                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ See any tree problem → instantly classify: traversal/property/path/BST     │
│ ✅ Know if info goes UP or DOWN (or both) within 30 seconds                   │
│ ✅ Write recursive DFS in 2 minutes, iterative in 5 minutes                   │
│ ✅ Handle all edge cases: null, single node, skewed, balanced                 │
│ ✅ Convert between recursive ↔ iterative for any traversal                    │
│ ✅ Solve "Max Path Sum" and "Diameter" (the hardest standard tree problems)   │
│ ✅ Build trees from traversal arrays (preorder+inorder, etc.)                 │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I'll try random DFS/BFS and see what happens"                         │
│   TO: "This needs info from children → bottom-up. I'll return height,        │
│        check balance at each node, O(n) time, O(h) space."                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related theory:** [03_Algorithms/05_Trees.md](../../03_Algorithms/05_Trees.md) — Full tree theory & implementations

---

[Chapter overview](../09_Trees.md) | [8.1 Tree Traversal Problems →](02_tree_traversal_problems.md)
