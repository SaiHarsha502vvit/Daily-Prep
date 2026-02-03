# 🌳 Tree & Graph Algorithms: Visual Guide

## From Traversals to Complex Algorithms

---

# 🔬 PART 0: DEEP INTERNALS - HOW TREES & GRAPHS WORK AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       TREES & GRAPHS AT THE HARDWARE LEVEL - WHAT REALLY HAPPENS                ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Understanding the PHYSICAL reality of trees and graphs:                         ║
║  • How nodes are stored in memory                                               ║
║  • What happens during tree traversal at CPU level                              ║
║  • Recursion stack deep dive                                                    ║
║  • Why tree operations are often cache-unfriendly                               ║
║  • Graph representation memory comparison                                        ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## TREE NODE MEMORY LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BINARY TREE NODE - MEMORY REPRESENTATION                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Java TreeNode class:                                                            │
│  class TreeNode {                                                                │
│      int val;                                                                    │
│      TreeNode left;                                                              │
│      TreeNode right;                                                             │
│  }                                                                               │
│                                                                                  │
│  MEMORY LAYOUT (64-bit JVM, compressed oops):                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │   │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤   │
│  │ 0      │ 8    │ Mark Word              │ Object header (GC, locks)     │   │
│  │ 8      │ 4    │ Class Pointer          │ → TreeNode.class              │   │
│  │ 12     │ 4    │ val (int)              │ 42                             │   │
│  │ 16     │ 4    │ left (reference)       │ 0x00110000 → left child       │   │
│  │ 20     │ 4    │ right (reference)      │ 0x00220000 → right child      │   │
│  │ 24     │ 0    │ padding                │ (object aligned to 8 bytes)   │   │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘   │
│  TOTAL: 24 bytes per TreeNode                                                   │
│                                                                                  │
│                                                                                  │
│  TREE STRUCTURE IN MEMORY:                                                       │
│  ───────────────────────────                                                    │
│                                                                                  │
│  Logical View:              Physical View (HEAP):                               │
│                                                                                  │
│        [10]                  Address 0x00100000:                                │
│       /    \                 ┌──────────────────────────┐                       │
│     [5]    [15]              │ TreeNode                 │                       │
│    /  \    /  \              │ val: 10                  │                       │
│  [3]  [7][12] [20]           │ left: 0x00110000 ─┐     │                       │
│                              │ right: 0x00220000 │     │                       │
│                              └──────────────────│─┼────┘                       │
│                                                 │ │                             │
│                              ┌──────────────────┘ │                             │
│                              ▼                    ▼                             │
│                Address 0x00110000:         0x00220000:                          │
│                ┌────────────────┐         ┌────────────────┐                    │
│                │ val: 5         │         │ val: 15        │                    │
│                │ left: 0x330000 │         │ left: 0x440000 │                    │
│                │ right: 0x550000│         │ right: 0x660000│                    │
│                └────────────────┘         └────────────────┘                    │
│                                                                                  │
│  KEY INSIGHT: Nodes are SCATTERED in memory!                                    │
│  • Parent at 0x100000                                                           │
│  • Left child at 0x110000 (not contiguous!)                                    │
│  • Right child at 0x220000 (even further!)                                     │
│                                                                                  │
│  This causes CACHE MISSES during traversal!                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## RECURSION STACK - WHAT ACTUALLY HAPPENS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RECURSIVE TRAVERSAL - STACK VISUALIZATION                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Code: void inorder(TreeNode root) {                                            │
│            if (root == null) return;                                             │
│            inorder(root.left);                                                   │
│            System.out.println(root.val);                                         │
│            inorder(root.right);                                                  │
│        }                                                                         │
│                                                                                  │
│  Tree:      [10]                                                                 │
│            /    \                                                                │
│          [5]    [15]                                                             │
│         /  \                                                                     │
│       [3]  [7]                                                                   │
│                                                                                  │
│                                                                                  │
│  CALL STACK EVOLUTION (visualizing each recursive call):                        │
│  ────────────────────────────────────────────────────────                       │
│                                                                                  │
│  Call 1: inorder(10)                                                             │
│  ┌────────────────────────┐                                                     │
│  │ Frame: inorder(10)     │ ← Stack Pointer                                     │
│  │ root = node(10)        │                                                     │
│  │ return addr = main:42  │                                                     │
│  └────────────────────────┘                                                     │
│                                                                                  │
│  Call 2: inorder(10).left → inorder(5)                                          │
│  ┌────────────────────────┐                                                     │
│  │ Frame: inorder(5)      │ ← Stack Pointer                                     │
│  │ root = node(5)         │                                                     │
│  │ return addr = inorder:3│                                                     │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(10)     │                                                     │
│  └────────────────────────┘                                                     │
│                                                                                  │
│  Call 3: inorder(5).left → inorder(3)                                           │
│  ┌────────────────────────┐                                                     │
│  │ Frame: inorder(3)      │ ← Stack Pointer                                     │
│  │ root = node(3)         │                                                     │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(5)      │                                                     │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(10)     │                                                     │
│  └────────────────────────┘                                                     │
│                                                                                  │
│  Call 4: inorder(3).left → inorder(null) → returns immediately                  │
│                                                                                  │
│  Call 5: Print "3"                                                               │
│                                                                                  │
│  Call 6: inorder(3).right → inorder(null) → returns immediately                 │
│                                                                                  │
│  Frame for inorder(3) POPS, return to inorder(5)                                │
│  ┌────────────────────────┐                                                     │
│  │ Frame: inorder(5)      │ ← Stack Pointer (resumed)                          │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(10)     │                                                     │
│  └────────────────────────┘                                                     │
│                                                                                  │
│  Call 7: Print "5"                                                               │
│                                                                                  │
│  Call 8: inorder(5).right → inorder(7)                                          │
│  ┌────────────────────────┐                                                     │
│  │ Frame: inorder(7)      │ ← Stack Pointer                                     │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(5)      │                                                     │
│  ├────────────────────────┤                                                     │
│  │ Frame: inorder(10)     │                                                     │
│  └────────────────────────┘                                                     │
│                                                                                  │
│  ... continues until all nodes visited                                          │
│                                                                                  │
│  Final output: 3, 5, 7, 10, 15  (INORDER = SORTED for BST!)                    │
│                                                                                  │
│                                                                                  │
│  STACK FRAME SIZE:                                                               │
│  ─────────────────                                                              │
│  Each frame contains:                                                            │
│  • Return address:     8 bytes                                                  │
│  • root parameter:     8 bytes (reference)                                      │
│  • Saved registers:    ~32 bytes (varies by JVM)                                │
│  ───────────────────────────────                                                │
│  Total per frame:      ~48 bytes                                                │
│                                                                                  │
│  For tree of height h: Stack size = h × 48 bytes                                │
│  Balanced tree (n nodes): h ≈ log₂(n)                                           │
│  1 million nodes: h ≈ 20 → 20 × 48 = 960 bytes (safe!)                         │
│                                                                                  │
│  Skewed tree (n nodes): h = n                                                   │
│  1 million nodes: h = 1,000,000 → 48 MB stack!                                 │
│  DEFAULT STACK SIZE: ~1MB → STACK OVERFLOW!                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ITERATIVE TRAVERSAL - EXPLICIT STACK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ITERATIVE VS RECURSIVE - MEMORY COMPARISON                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RECURSIVE INORDER:                                                              │
│  void inorder(TreeNode root) {                                                  │
│      if (root == null) return;                                                  │
│      inorder(root.left);                                                        │
│      visit(root);                                                               │
│      inorder(root.right);                                                       │
│  }                                                                               │
│                                                                                  │
│  Uses CALL STACK: ~48 bytes per frame (includes return address, saved regs)    │
│                                                                                  │
│                                                                                  │
│  ITERATIVE INORDER:                                                              │
│  void inorderIterative(TreeNode root) {                                         │
│      Stack<TreeNode> stack = new Stack<>();                                     │
│      TreeNode curr = root;                                                       │
│                                                                                  │
│      while (curr != null || !stack.isEmpty()) {                                 │
│          while (curr != null) {                                                  │
│              stack.push(curr);                                                  │
│              curr = curr.left;                                                  │
│          }                                                                       │
│          curr = stack.pop();                                                    │
│          visit(curr);                                                           │
│          curr = curr.right;                                                     │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│  Uses HEAP STACK: ~8 bytes per node reference                                   │
│                                                                                  │
│                                                                                  │
│  MEMORY COMPARISON (tree height h = 20):                                        │
│  ┌────────────────────┬───────────────────┬─────────────────────────────────┐  │
│  │ Method             │ Memory Used       │ Notes                           │  │
│  ├────────────────────┼───────────────────┼─────────────────────────────────┤  │
│  │ Recursive          │ 20 × 48 = 960 B   │ Uses call stack (limited!)     │  │
│  │ Iterative          │ 20 × 8 = 160 B    │ Uses heap (flexible)           │  │
│  └────────────────────┴───────────────────┴─────────────────────────────────┘  │
│                                                                                  │
│  For SKEWED tree (h = 100,000):                                                 │
│  • Recursive: 100,000 × 48 = 4.8 MB → STACK OVERFLOW on 1MB stack             │
│  • Iterative: 100,000 × 8 = 800 KB → Works fine on heap                       │
│                                                                                  │
│  RECOMMENDATION: Use iterative for production code with unknown tree shapes    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CACHE BEHAVIOR IN TREE TRAVERSAL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY TREE TRAVERSAL IS CACHE-UNFRIENDLY                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MEMORY LAYOUT COMPARISON:                                                       │
│                                                                                  │
│  ARRAY (cache-friendly):                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Address │ 0x1000 │ 0x1004 │ 0x1008 │ 0x100C │ 0x1010 │ 0x1014 │ 0x1018 ││
│  │ Index   │  [0]   │  [1]   │  [2]   │  [3]   │  [4]   │  [5]   │  [6]   ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│  Access arr[0] → CPU loads cache line: [0] to [15] (64 bytes)                  │
│  Access arr[1] → Already in cache! CACHE HIT!                                  │
│  Access arr[2] → Already in cache! CACHE HIT!                                  │
│                                                                                  │
│                                                                                  │
│  TREE (cache-unfriendly):                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ HEAP LAYOUT:                                                               ││
│  │                                                                            ││
│  │ 0x1000: [Node A] ───left───►  0x5000: [Node B]                            ││
│  │                 ───right──►  0x8000: [Node C]                            ││
│  │                                      ↓                                     ││
│  │                              0x3000: [Node D]                              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Access Node A → CPU loads cache line around 0x1000                            │
│  Access Node B → 0x5000 NOT in cache → CACHE MISS! Load new line              │
│  Access Node D → 0x3000 NOT in cache → CACHE MISS! Load new line              │
│                                                                                  │
│                                                                                  │
│  CACHE MISS PENALTY:                                                             │
│  ───────────────────                                                            │
│  • L1 cache hit:   ~4 cycles                                                    │
│  • L2 cache hit:   ~12 cycles                                                   │
│  • L3 cache hit:   ~40 cycles                                                   │
│  • RAM (miss):     ~200 cycles                                                  │
│                                                                                  │
│  Tree traversal: ~200 cycles PER NODE (mostly cache misses)                    │
│  Array iteration: ~4 cycles PER ELEMENT (mostly cache hits)                    │
│                                                                                  │
│  THIS IS WHY ARRAY-BASED HEAP IS FASTER THAN POINTER-BASED TREE!              │
│                                                                                  │
│                                                                                  │
│  OPTIMIZATION: Van Emde Boas Layout                                             │
│  ────────────────────────────────────                                           │
│  Store tree nodes in memory in a cache-friendly order:                          │
│  • Keep subtrees together in contiguous memory                                  │
│  • Used in high-performance databases (B+ trees)                               │
│  • Trade-off: Complex implementation, harder to update                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## GRAPH REPRESENTATION - MEMORY DEEP DIVE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ADJACENCY LIST VS MATRIX - MEMORY INTERNALS                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GRAPH:  0 ─── 1                                                                 │
│          │     │                                                                 │
│          3 ─── 2                                                                 │
│                                                                                  │
│  ADJACENCY MATRIX MEMORY LAYOUT:                                                │
│  ─────────────────────────────────                                              │
│  int[][] matrix = new int[4][4];                                                │
│                                                                                  │
│  HEAP MEMORY:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ int[][] object (outer array):                                           │   │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │ │ Header (16 bytes) │ row[0] ptr │ row[1] ptr │ row[2] ptr │ row[3] │  │   │
│  │ │                   │ 0x1000     │ 0x2000     │ 0x3000     │ 0x4000 │  │   │
│  │ └────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                         │   │
│  │ int[] row[0] at 0x1000:                                                 │   │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │ │ Header (16 bytes) │ [0,0]=0 │ [0,1]=1 │ [0,2]=0 │ [0,3]=1 │        │  │   │
│  │ └────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                         │   │
│  │ int[] row[1] at 0x2000: ...                                            │   │
│  │ int[] row[2] at 0x3000: ...                                            │   │
│  │ int[] row[3] at 0x4000: ...                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TOTAL MEMORY:                                                                   │
│  • Outer array: 16 + 4×4 = 32 bytes                                            │
│  • Each row: 16 + 4×4 = 32 bytes                                               │
│  • Total: 32 + 4×32 = 160 bytes for 4 vertices                                 │
│                                                                                  │
│  For V vertices: O(V²) space regardless of edges!                              │
│  1000 vertices: 1000 × 1000 × 4 = 4 MB                                         │
│  1,000,000 vertices: 4 TB (impossible!)                                        │
│                                                                                  │
│                                                                                  │
│  ADJACENCY LIST MEMORY LAYOUT:                                                  │
│  ────────────────────────────────                                               │
│  List<List<Integer>> adj = new ArrayList<>();                                   │
│                                                                                  │
│  HEAP MEMORY:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ArrayList (outer):                                                      │   │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │ │ Header │ Object[] elementData → [list0, list1, list2, list3]      │  │   │
│  │ └────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                         │   │
│  │ ArrayList (vertex 0): neighbors [1, 3]                                 │   │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │ │ Header │ Object[] → [Integer(1), Integer(3), null, ...]           │  │   │
│  │ └────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                         │   │
│  │ ArrayList (vertex 1): neighbors [0, 2]  ...                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TOTAL MEMORY:                                                                   │
│  • Outer ArrayList: ~32 bytes                                                   │
│  • Each inner ArrayList: ~32 bytes + edges                                     │
│  • Each Integer: 16 bytes                                                       │
│  • Total: 32 + V×32 + E×16 = O(V + E)                                          │
│                                                                                  │
│  For sparse graph (V=1000, E=5000):                                            │
│  • Matrix: 4 MB                                                                 │
│  • List:   ~112 KB (35x smaller!)                                              │
│                                                                                  │
│  For dense graph (V=1000, E=500,000):                                          │
│  • Matrix: 4 MB                                                                 │
│  • List:   ~8 MB (matrix is smaller!)                                          │
│                                                                                  │
│  RULE: Use adjacency list for sparse graphs (E < V²/2)                         │
│        Use adjacency matrix for dense graphs or when edge lookup is frequent   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## BFS AND DFS - INTERNAL OPERATIONS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BFS VS DFS - MEMORY AND CPU BEHAVIOR                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GRAPH:    0 ─── 1 ─── 2                                                        │
│            │     │                                                               │
│            3 ─── 4                                                               │
│                                                                                  │
│  BFS USING QUEUE:                                                                │
│  ─────────────────                                                              │
│  Queue<Integer> queue = new LinkedList<>();                                     │
│  queue.offer(0);                                                                 │
│  visited[0] = true;                                                              │
│                                                                                  │
│  QUEUE EVOLUTION:                                                                │
│  Step 1: queue = [0], visit 0, add neighbors                                    │
│  Step 2: queue = [1, 3], visit 1                                                │
│  Step 3: queue = [3, 2, 4], visit 3                                             │
│  Step 4: queue = [2, 4], visit 2                                                │
│  Step 5: queue = [4], visit 4                                                   │
│  Step 6: queue = [], done!                                                       │
│                                                                                  │
│  Visit order: 0, 1, 3, 2, 4 (level by level)                                   │
│                                                                                  │
│  MEMORY: Queue holds O(V) nodes worst case (wide graph)                        │
│                                                                                  │
│                                                                                  │
│  DFS USING STACK (or recursion):                                                │
│  ───────────────────────────────                                                │
│  Stack<Integer> stack = new Stack<>();                                          │
│  stack.push(0);                                                                  │
│                                                                                  │
│  STACK EVOLUTION:                                                                │
│  Step 1: stack = [0], visit 0, push neighbors                                   │
│  Step 2: stack = [3, 1], visit 1                                                │
│  Step 3: stack = [3, 4, 2], visit 2 (deepest first!)                           │
│  Step 4: stack = [3, 4], visit 4                                                │
│  Step 5: stack = [3], visit 3                                                   │
│  Step 6: stack = [], done!                                                       │
│                                                                                  │
│  Visit order: 0, 1, 2, 4, 3 (goes deep first)                                  │
│                                                                                  │
│  MEMORY: Stack holds O(V) nodes worst case (deep graph)                        │
│                                                                                  │
│                                                                                  │
│  CPU CACHE BEHAVIOR:                                                             │
│  ────────────────────                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ BFS:                                                                    │   │
│  │ • Visits nearby nodes first                                            │   │
│  │ • Better for graphs with spatial locality                              │   │
│  │ • Queue operations: offer() and poll() - O(1)                         │   │
│  │ • LinkedList queue: Poor cache locality (scattered nodes)             │   │
│  │ • ArrayDeque queue: Better cache locality (contiguous array)          │   │
│  │                                                                        │   │
│  │ DFS:                                                                    │   │
│  │ • Goes deep, may jump around in memory                                 │   │
│  │ • Recursive DFS has function call overhead                            │   │
│  │ • Iterative DFS with ArrayDeque is cache-friendlier                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  RECOMMENDATION:                                                                 │
│  ───────────────                                                                │
│  • Use ArrayDeque instead of LinkedList for Queue/Stack                        │
│  • ArrayDeque is 2-3x faster due to better cache locality                      │
│                                                                                  │
│  // Prefer this:                                                                 │
│  Queue<Integer> queue = new ArrayDeque<>();                                     │
│  Deque<Integer> stack = new ArrayDeque<>();                                     │
│                                                                                  │
│  // Over this:                                                                   │
│  Queue<Integer> queue = new LinkedList<>();  // Slower!                        │
│  Stack<Integer> stack = new Stack<>();       // Slower + synchronized!         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## SHORTEST PATH ALGORITHMS - INTERNAL COMPARISON

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DIJKSTRA VS BELLMAN-FORD VS FLOYD-WARSHALL                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DIJKSTRA'S ALGORITHM (Single source, non-negative weights):                    │
│  ──────────────────────────────────────────────────────────                     │
│  Time: O((V + E) log V) with binary heap                                       │
│  Space: O(V) for distance array + O(V) for priority queue                      │
│                                                                                  │
│  INTERNAL WORKING:                                                               │
│  PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[1] - b[1]);         │
│                                                                                  │
│  • pq.offer(): O(log V) - bubble up in heap                                    │
│  • pq.poll(): O(log V) - bubble down in heap                                   │
│  • Each edge relaxed once: E times                                              │
│  • Total: O(E log V)                                                            │
│                                                                                  │
│  WHY NEGATIVE WEIGHTS BREAK DIJKSTRA:                                           │
│  Once a node is "done" (popped from PQ), Dijkstra assumes it won't improve    │
│  Negative edge could make it shorter later → incorrect result!                 │
│                                                                                  │
│                                                                                  │
│  BELLMAN-FORD (Single source, handles negative weights):                        │
│  ─────────────────────────────────────────────────────────                      │
│  Time: O(V × E)                                                                 │
│  Space: O(V) for distance array                                                 │
│                                                                                  │
│  INTERNAL WORKING:                                                               │
│  for (int i = 0; i < V - 1; i++) {           // V-1 iterations                 │
│      for (int[] edge : edges) {              // All E edges                    │
│          int u = edge[0], v = edge[1], w = edge[2];                            │
│          if (dist[u] + w < dist[v])                                             │
│              dist[v] = dist[u] + w;          // Relax                          │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│  WHY V-1 ITERATIONS?                                                            │
│  • Shortest path has at most V-1 edges                                         │
│  • Each iteration guarantees at least one more correct distance                │
│  • After V-1, all shortest paths found (if no negative cycle)                  │
│                                                                                  │
│  NEGATIVE CYCLE DETECTION:                                                       │
│  Run one more iteration - if any distance improves → negative cycle exists!   │
│                                                                                  │
│                                                                                  │
│  FLOYD-WARSHALL (All pairs shortest paths):                                     │
│  ──────────────────────────────────────────                                     │
│  Time: O(V³)                                                                    │
│  Space: O(V²) for distance matrix                                              │
│                                                                                  │
│  INTERNAL WORKING:                                                               │
│  for (int k = 0; k < V; k++) {               // Intermediate vertex            │
│      for (int i = 0; i < V; i++) {           // Source                         │
│          for (int j = 0; j < V; j++) {       // Destination                    │
│              dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);            │
│          }                                                                       │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│  KEY INSIGHT: After iteration k, dist[i][j] contains shortest path             │
│  from i to j using only vertices 0 to k as intermediates                       │
│                                                                                  │
│                                                                                  │
│  COMPARISON TABLE:                                                               │
│  ┌────────────────┬──────────────┬────────────┬────────────┬─────────────────┐│
│  │ Algorithm      │ Time         │ Space      │ Neg. Edges │ Use Case        ││
│  ├────────────────┼──────────────┼────────────┼────────────┼─────────────────┤│
│  │ Dijkstra       │ O(E log V)   │ O(V)       │ No         │ Single source   ││
│  │ Bellman-Ford   │ O(V × E)     │ O(V)       │ Yes        │ Neg. edges      ││
│  │ Floyd-Warshall │ O(V³)        │ O(V²)      │ Yes        │ All pairs       ││
│  │ BFS (unweight) │ O(V + E)     │ O(V)       │ N/A        │ Unweighted      ││
│  └────────────────┴──────────────┴────────────┴────────────┴─────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: BINARY TREE FUNDAMENTALS

## Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TREES - COMPLETE UNDERSTANDING                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A TREE DATA STRUCTURE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ A tree is a hierarchical data structure consisting of NODES connected by    │
│ EDGES, with these properties:                                                │
│ • ONE root node (top)                                                        │
│ • Each node has ZERO or more children                                        │
│ • Each non-root node has EXACTLY one parent                                  │
│ • NO CYCLES (can't reach a node from itself by following edges)             │
│                                                                              │
│ FORMAL: A connected acyclic graph with n nodes and n-1 edges                │
│                                                                              │
│ HISTORY: Trees were formalized by Arthur Cayley in 1857 for chemical        │
│ structures. Used in CS since early programming (file systems, parsing).     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO TREES SOLVE?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Representing HIERARCHICAL relationships efficiently            │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • File System: Folders contain files and subfolders (parent-child)          │
│ • Organization: CEO → Managers → Employees (reporting structure)            │
│ • DOM/HTML: <html> → <body> → <div> → <p> (nesting)                        │
│ • Family Tree: Ancestors and descendants                                     │
│ • Decision Making: Yes/No questions leading to conclusions                   │
│ • Syntax Parsing: Expression trees (how compilers work)                      │
│                                                                              │
│ WHY NOT USE ARRAY OR LIST?                                                   │
│ • Arrays: Good for linear data, but hierarchies need O(n) to find parent   │
│ • Trees: Natural for hierarchies, O(log n) operations for balanced trees   │
│                                                                              │
│ WHY NOT USE GRAPH?                                                           │
│ • Graphs allow cycles, multiple paths - more complex                         │
│ • Trees have unique paths - simpler algorithms, easier reasoning             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE TREES? (ADVANTAGES)                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. HIERARCHICAL REPRESENTATION:                                              │
│    Perfectly models parent-child relationships                               │
│                                                                              │
│ 2. EFFICIENT OPERATIONS (when balanced):                                     │
│    Search, Insert, Delete: O(log n) instead of O(n)                          │
│                                                                              │
│ 3. SORTED DATA (BST):                                                        │
│    Inorder traversal gives sorted elements                                   │
│                                                                              │
│ 4. NATURAL RECURSION:                                                        │
│    Tree problems have elegant recursive solutions                            │
│                                                                              │
│ COMPARISON:                                                                  │
│ ┌───────────────┬─────────────┬─────────────┬─────────────┬─────────────┐   │
│ │ Operation     │ Array       │ LinkedList  │ BST (avg)   │ BST (worst) │   │
│ ├───────────────┼─────────────┼─────────────┼─────────────┼─────────────┤   │
│ │ Search        │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │   │
│ │ Insert        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │   │
│ │ Delete        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │   │
│ │ Min/Max       │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │   │
│ └───────────────┴─────────────┴─────────────┴─────────────┴─────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE TREES?                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE TREES WHEN:                                                          │
│    • Data has natural hierarchy (files, org charts)                          │
│    • Need efficient search, insert, delete (use BST)                         │
│    • Need sorted iteration (BST inorder)                                     │
│    • Need to find min/max quickly (Heaps)                                    │
│    • Need range queries (Segment Trees)                                      │
│    • Prefix-based search (Tries)                                             │
│                                                                              │
│ ❌ DON'T USE TREES WHEN:                                                    │
│    • Data is flat/linear (use array)                                         │
│    • Relationships aren't hierarchical (use graph)                          │
│    • Simple key-value lookup (use HashMap - O(1))                           │
│    • Data changes rarely but searched often (use sorted array + binary)     │
│                                                                              │
│ TREE TYPE SELECTION:                                                         │
│ ┌────────────────────────────┬───────────────────────────────────────────┐  │
│ │ Problem Type               │ Best Tree Type                            │  │
│ ├────────────────────────────┼───────────────────────────────────────────┤  │
│ │ Maintain sorted data       │ BST, AVL, Red-Black                       │  │
│ │ Find min/max repeatedly    │ Heap                                      │  │
│ │ Range sum/min/max queries  │ Segment Tree                              │  │
│ │ Prefix search (strings)    │ Trie                                      │  │
│ │ Hierarchical data          │ N-ary Tree                                │  │
│ │ Parse expressions          │ Expression Tree                           │  │
│ └────────────────────────────┴───────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. NULL POINTER EXCEPTIONS:                                                  │
│    ALWAYS check if node is null before accessing .left or .right            │
│    Solution: Start every recursive function with: if (root == null) return  │
│                                                                              │
│ 2. UNBALANCED TREES:                                                         │
│    Inserting sorted data into BST → becomes a linked list → O(n)            │
│    Solution: Use self-balancing trees (AVL, Red-Black)                      │
│                                                                              │
│ 3. CONFUSING TRAVERSAL TYPES:                                                │
│    Which traversal to use for which problem?                                 │
│    Solution: See "When to use each traversal" section below                  │
│                                                                              │
│ 4. STACK OVERFLOW WITH DEEP RECURSION:                                       │
│    Very deep trees can exceed stack limit                                    │
│    Solution: Convert to iterative with explicit stack                        │
│                                                                              │
│ 5. MUTATING TREE DURING TRAVERSAL:                                           │
│    Changing tree structure while iterating causes bugs                       │
│    Solution: Collect nodes first, then modify                                │
│                                                                              │
│ 6. OFF-BY-ONE IN DEPTH/HEIGHT:                                               │
│    Is root at depth 0 or 1? Height of null is 0 or -1?                       │
│    Solution: Define clearly and be consistent                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRAVERSAL OUTPUTS:                                                           │
│ • Preorder:  [root, left subtree, right subtree]  - useful for copying tree │
│ • Inorder:   [left subtree, root, right subtree]  - gives SORTED for BST    │
│ • Postorder: [left subtree, right subtree, root]  - useful for deleting     │
│ • Level:     [[level 0], [level 1], ...]          - useful for BFS problems │
│                                                                              │
│ TIME COMPLEXITY:                                                             │
│ • All traversals: O(n) - must visit every node                               │
│ • BST search/insert/delete: O(h) where h = height                           │
│   - Balanced: h = log(n) → O(log n)                                          │
│   - Unbalanced: h = n → O(n)                                                 │
│                                                                              │
│ SPACE COMPLEXITY:                                                            │
│ • Recursive traversal: O(h) for call stack                                   │
│ • Iterative traversal: O(h) for explicit stack                               │
│ • Level order: O(w) where w = max width of tree                              │
│ • Storing tree: O(n) for n nodes                                             │
│                                                                              │
│ IMPORTANT FORMULAS:                                                          │
│ • Complete binary tree with n nodes: height = ⌊log₂(n)⌋                     │
│ • Full binary tree height h: max nodes = 2^(h+1) - 1                        │
│ • Binary tree height h: min nodes = h+1, max nodes = 2^(h+1) - 1            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tree Terminology

```
                    [1]         ← Root (level 0)
                   /   \
                [2]     [3]     ← Level 1
               /  \       \
             [4]  [5]     [6]   ← Level 2 (Leaves: 4, 5, 6)

TERMINOLOGY:
• Root: Top node (1)
• Parent: Node above (2 is parent of 4, 5)
• Child: Node below (4, 5 are children of 2)
• Siblings: Same parent (4, 5 are siblings)
• Leaf: No children (4, 5, 6)
• Height: Longest path from root to leaf (2)
• Depth: Distance from root (depth of 4 is 2)
• Subtree: Any node and its descendants
```

## Tree Node Structure

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

// Building a tree:
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
```

---

# PART 2: TREE TRAVERSALS

## The Three DFS Traversals

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                  TREE TRAVERSALS - WHEN & WHY TO USE EACH                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

REMEMBER BY: When do you PROCESS the current node?

PREORDER:  Process → Left → Right   (Process BEFORE children)
INORDER:   Left → Process → Right   (Process BETWEEN children)
POSTORDER: Left → Right → Process   (Process AFTER children)

EXAMPLE TREE:
        [1]
       /   \
     [2]   [3]
    /  \
  [4]  [5]

PREORDER:  1 → 2 → 4 → 5 → 3  (Root first, then subtrees)
INORDER:   4 → 2 → 5 → 1 → 3  (Left, root, right - SORTED for BST!)
POSTORDER: 4 → 5 → 2 → 3 → 1  (Children first, then root)

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE EACH TRAVERSAL?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PREORDER (Root → Left → Right):                                              │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Copying/cloning a tree                                │          │
│ │          Serializing tree to file/string                       │          │
│ │          Creating prefix expressions                            │          │
│ │          Getting directory structure (ls -R)                    │          │
│ │                                                                  │          │
│ │ WHY: You need to create parent BEFORE children                 │          │
│ │      (Can't have children without parent first!)               │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ INORDER (Left → Root → Right):                                               │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Getting sorted elements from BST                      │          │
│ │          Validating if tree is BST                             │          │
│ │          Finding kth smallest/largest element                  │          │
│ │          Creating infix expressions                             │          │
│ │                                                                  │          │
│ │ WHY: For BST, left < root < right, so this gives sorted order  │          │
│ │      It's the "natural" reading order (left to right)          │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ POSTORDER (Left → Right → Root):                                             │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Deleting a tree (must delete children before parent)  │          │
│ │          Calculating folder sizes (need children sizes first)  │          │
│ │          Evaluating expression trees                            │          │
│ │          Finding height of tree                                 │          │
│ │          Garbage collection algorithms                          │          │
│ │                                                                  │          │
│ │ WHY: You need children's result before you can compute parent's│          │
│ │      (Can't calculate total until you have subtotals!)         │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ LEVEL ORDER (BFS):                                                           │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Finding shortest path in unweighted tree              │          │
│ │          Printing tree level by level                          │          │
│ │          Finding nodes at specific depth                        │          │
│ │          Connecting nodes at same level                         │          │
│ │          Zigzag traversal                                       │          │
│ │                                                                  │          │
│ │ WHY: Processes nodes by distance from root - perfect for       │          │
│ │      "nearest" or "level" based questions                       │          │
│ └────────────────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘

QUICK DECISION TABLE:
┌─────────────────────────────────────┬───────────────────┐
│ Problem Type                        │ Use Traversal     │
├─────────────────────────────────────┼───────────────────┤
│ Get sorted elements (BST)           │ INORDER           │
│ Copy/clone tree                     │ PREORDER          │
│ Delete tree safely                  │ POSTORDER         │
│ Calculate subtree values            │ POSTORDER         │
│ Find by level/depth                 │ LEVEL ORDER (BFS) │
│ Serialize tree                      │ PREORDER + marker │
│ Check if valid BST                  │ INORDER           │
│ Expression evaluation               │ POSTORDER         │
└─────────────────────────────────────┴───────────────────┘
```

## Traversal Code

```java
// PREORDER - Recursive
public void preorder(TreeNode root) {
    if (root == null) return;

    System.out.print(root.val + " ");  // Process
    preorder(root.left);                // Left
    preorder(root.right);               // Right
}

// INORDER - Recursive
public void inorder(TreeNode root) {
    if (root == null) return;

    inorder(root.left);                 // Left
    System.out.print(root.val + " ");  // Process
    inorder(root.right);                // Right
}

// POSTORDER - Recursive
public void postorder(TreeNode root) {
    if (root == null) return;

    postorder(root.left);               // Left
    postorder(root.right);              // Right
    System.out.print(root.val + " ");  // Process
}

// PREORDER - Iterative (using stack)
public List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);

        // Right first so left is processed first (LIFO)
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }

    return result;
}
```

## Level Order Traversal (BFS)

```
VISIT LEVEL BY LEVEL:

        [1]         Level 0: [1]
       /   \
     [2]   [3]      Level 1: [2, 3]
    /  \     \
  [4]  [5]   [6]    Level 2: [4, 5, 6]

OUTPUT: [[1], [2, 3], [4, 5, 6]]
```

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();  // Nodes at current level
        List<Integer> currentLevel = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            currentLevel.add(node.val);

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        result.add(currentLevel);
    }

    return result;
}
```

---

# PART 3: COMMON TREE PROBLEMS

## Maximum Depth

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;

    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);

    return 1 + Math.max(leftDepth, rightDepth);
}

// TRACE for tree:
//     [1]
//    /   \
//  [2]   [3]
//  /
// [4]
//
// maxDepth(4) = 1 + max(0, 0) = 1
// maxDepth(2) = 1 + max(1, 0) = 2
// maxDepth(3) = 1 + max(0, 0) = 1
// maxDepth(1) = 1 + max(2, 1) = 3
```

## Check if Balanced

```java
// A tree is balanced if height difference of subtrees <= 1

public boolean isBalanced(TreeNode root) {
    return checkHeight(root) != -1;
}

private int checkHeight(TreeNode node) {
    if (node == null) return 0;

    int leftHeight = checkHeight(node.left);
    if (leftHeight == -1) return -1;  // Left subtree unbalanced

    int rightHeight = checkHeight(node.right);
    if (rightHeight == -1) return -1;  // Right subtree unbalanced

    // Check current node balance
    if (Math.abs(leftHeight - rightHeight) > 1) {
        return -1;  // Unbalanced
    }

    return 1 + Math.max(leftHeight, rightHeight);
}
```

## Lowest Common Ancestor (LCA)

```java
// Find the lowest node that has both p and q as descendants

public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found something, root is LCA
    if (left != null && right != null) {
        return root;
    }

    // Otherwise, return the non-null side
    return left != null ? left : right;
}

// INTUITION:
// If p and q are in different subtrees, root is LCA
// If both in same subtree, LCA is in that subtree
```

---

# PART 4: BINARY SEARCH TREE (BST)

## BST Property

```
For every node:
- All values in LEFT subtree < node value
- All values in RIGHT subtree > node value

        [8]
       /   \
     [3]   [10]
    /  \      \
  [1]  [6]   [14]
      /  \
    [4]  [7]

INORDER traversal gives SORTED order: 1, 3, 4, 6, 7, 8, 10, 14
```

## BST Operations

```java
// SEARCH - O(log n) average, O(n) worst (skewed)
public TreeNode search(TreeNode root, int val) {
    if (root == null || root.val == val) {
        return root;
    }

    if (val < root.val) {
        return search(root.left, val);
    } else {
        return search(root.right, val);
    }
}

// INSERT - O(log n) average
public TreeNode insert(TreeNode root, int val) {
    if (root == null) {
        return new TreeNode(val);
    }

    if (val < root.val) {
        root.left = insert(root.left, val);
    } else {
        root.right = insert(root.right, val);
    }

    return root;
}

// VALIDATE BST
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;

    if (node.val <= min || node.val >= max) {
        return false;
    }

    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
```

---

# PART 5: GRAPH FUNDAMENTALS

## Complete Understanding of Graphs

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GRAPHS - COMPLETE UNDERSTANDING                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A GRAPH?                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ A graph G = (V, E) consists of:                                              │
│ • V = Set of VERTICES (nodes)                                                │
│ • E = Set of EDGES (connections between vertices)                            │
│                                                                              │
│ Unlike trees, graphs can have:                                               │
│ • CYCLES (paths that return to starting point)                               │
│ • Multiple paths between any two nodes                                       │
│ • Disconnected components                                                    │
│                                                                              │
│ HISTORY: Graph theory started with Euler's "Seven Bridges of Königsberg"    │
│ problem in 1736 - can you cross all bridges exactly once?                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEMS DO GRAPHS SOLVE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Modeling RELATIONSHIPS between entities                        │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Social Networks: People = nodes, Friendships = edges                       │
│   "Find friends of friends" = BFS from a person                              │
│                                                                              │
│ • Navigation/Maps: Intersections = nodes, Roads = edges                      │
│   "Shortest route" = Dijkstra's algorithm                                    │
│                                                                              │
│ • Internet: Routers = nodes, Connections = edges                             │
│   "Best path for data" = Routing algorithms                                  │
│                                                                              │
│ • Dependencies: Tasks = nodes, Prerequisites = edges                         │
│   "Order to complete tasks" = Topological sort                               │
│                                                                              │
│ • Games: Game states = nodes, Moves = edges                                  │
│   "Can we win?" = Graph search                                               │
│                                                                              │
│ • Molecular structures: Atoms = nodes, Bonds = edges                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY GRAPHS INSTEAD OF OTHER DATA STRUCTURES?                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────┬───────────────────────────────────────────────┐  │
│ │ Structure              │ Relationship Type                             │  │
│ ├────────────────────────┼───────────────────────────────────────────────┤  │
│ │ Array                  │ Sequential, by position                       │  │
│ │ Tree                   │ Hierarchical, parent-child                    │  │
│ │ Graph                  │ ANY relationship! ⭐ Most flexible           │  │
│ └────────────────────────┴───────────────────────────────────────────────┘  │
│                                                                              │
│ Trees are actually SPECIAL CASES of graphs (connected, acyclic)!            │
│                                                                              │
│ USE GRAPH WHEN:                                                              │
│ • Relationships aren't hierarchical (peer-to-peer, many-to-many)            │
│ • Cycles are possible (road networks, social connections)                    │
│ • Need to model complex dependencies                                         │
│ • Multiple paths between entities exist                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH REPRESENTATION?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ADJACENCY LIST:                                                              │
│ ┌───────────────────────────────────────────────────────────────┐           │
│ │ USE WHEN: Sparse graph (E << V²)                              │           │
│ │ Space: O(V + E)                                               │           │
│ │ Check edge exists: O(degree)                                  │           │
│ │ Iterate neighbors: O(degree) ✅ FAST                          │           │
│ │ BEST FOR: Most real-world graphs (social networks, roads)     │           │
│ └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│ ADJACENCY MATRIX:                                                            │
│ ┌───────────────────────────────────────────────────────────────┐           │
│ │ USE WHEN: Dense graph (E ≈ V²) or need O(1) edge lookup       │           │
│ │ Space: O(V²)                                                  │           │
│ │ Check edge exists: O(1) ✅ FAST                               │           │
│ │ Iterate neighbors: O(V)                                       │           │
│ │ BEST FOR: Small dense graphs, weighted graphs, Floyd-Warshall │           │
│ └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│ RULE OF THUMB: Use adjacency LIST unless you have specific reason not to!   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INFINITE LOOPS (Forgetting visited check):                                │
│    Graphs have cycles! ALWAYS track visited nodes.                           │
│    Solution: boolean[] visited or Set<Integer> visited                       │
│                                                                              │
│ 2. DIRECTED VS UNDIRECTED CONFUSION:                                         │
│    Undirected: Add edge both ways (A→B AND B→A)                             │
│    Directed: Add edge one way only                                           │
│                                                                              │
│ 3. 0-INDEXED VS 1-INDEXED:                                                   │
│    Problem gives "1 to N" nodes but array is 0-indexed                       │
│    Solution: Either use size N+1 or subtract 1 from all indices              │
│                                                                              │
│ 4. DISCONNECTED COMPONENTS:                                                  │
│    Single DFS/BFS won't visit all nodes if graph disconnected!              │
│    Solution: Loop through all nodes, start new traversal if unvisited        │
│                                                                              │
│ 5. NOT HANDLING WEIGHTS:                                                     │
│    BFS gives shortest path in UNWEIGHTED graphs only                         │
│    For weighted: Use Dijkstra (non-negative) or Bellman-Ford                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRAVERSAL COMPLEXITY (V = vertices, E = edges):                              │
│ • DFS: O(V + E) time, O(V) space (visited + stack)                           │
│ • BFS: O(V + E) time, O(V) space (visited + queue)                           │
│                                                                              │
│ COMMON ALGORITHM COMPLEXITIES:                                               │
│ ┌────────────────────────────┬──────────────────────┬────────────────────┐  │
│ │ Algorithm                  │ Time                 │ Space              │  │
│ ├────────────────────────────┼──────────────────────┼────────────────────┤  │
│ │ DFS/BFS                    │ O(V + E)             │ O(V)               │  │
│ │ Dijkstra (binary heap)     │ O((V+E) log V)       │ O(V)               │  │
│ │ Bellman-Ford               │ O(V × E)             │ O(V)               │  │
│ │ Floyd-Warshall             │ O(V³)                │ O(V²)              │  │
│ │ Topological Sort           │ O(V + E)             │ O(V)               │  │
│ │ Kruskal's MST              │ O(E log E)           │ O(V)               │  │
│ │ Prim's MST                 │ O((V+E) log V)       │ O(V)               │  │
│ │ Cycle Detection            │ O(V + E)             │ O(V)               │  │
│ └────────────────────────────┴──────────────────────┴────────────────────┘  │
│                                                                              │
│ TYPICAL OUTPUTS:                                                             │
│ • Path finding: List of nodes from source to destination                     │
│ • Shortest path: Distance value or path + distance                           │
│ • Cycle detection: Boolean (exists?) or List (the cycle)                    │
│ • Topological sort: Ordered list of all vertices                             │
│ • Connected components: Number of components or list of component nodes     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Graph Representations

```
ADJACENCY LIST (Preferred for sparse graphs):

Graph:
    0 --- 1
    |     |
    3 --- 2

List representation:
0: [1, 3]
1: [0, 2]
2: [1, 3]
3: [0, 2]

Code:
List<List<Integer>> graph = new ArrayList<>();
// Add neighbors for each node
graph.get(0).add(1);  // Edge 0-1
graph.get(0).add(3);  // Edge 0-3
...

ADJACENCY MATRIX (For dense graphs):

    0  1  2  3
0 [ 0  1  0  1 ]
1 [ 1  0  1  0 ]
2 [ 0  1  0  1 ]
3 [ 1  0  1  0 ]

1 = edge exists, 0 = no edge
```

## Graph Types

```
UNDIRECTED: Edges have no direction (friendship)
DIRECTED: Edges have direction (following on Twitter)
WEIGHTED: Edges have values (road distances)
UNWEIGHTED: All edges equal
CYCLIC: Contains cycles
ACYCLIC: No cycles (DAG = Directed Acyclic Graph)
CONNECTED: All nodes reachable from any node
```

---

# PART 6: GRAPH TRAVERSALS

## DFS vs BFS - When to Use Which

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DFS vs BFS - COMPLETE COMPARISON                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ DFS (Depth-First Search)                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Go as DEEP as possible first, then backtrack                       │
│                                                                              │
│ USE DFS WHEN:                                                                │
│ • Finding ANY path (not necessarily shortest)                                │
│ • Detecting cycles                                                           │
│ • Topological sorting (DAG)                                                  │
│ • Finding connected components                                               │
│ • Solving mazes/puzzles (explore all options)                                │
│ • Problem requires backtracking                                              │
│ • Tree problems (most tree traversals are DFS)                               │
│                                                                              │
│ IMPLEMENTATION: Stack (explicit or recursion call stack)                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ BFS (Breadth-First Search)                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Visit all neighbors at current level before going deeper          │
│                                                                              │
│ USE BFS WHEN:                                                                │
│ • Finding SHORTEST path in unweighted graph ⭐                              │
│ • Level-order traversal needed                                               │
│ • Finding nodes at distance k                                                │
│ • "Minimum steps/moves" problems                                             │
│ • Spreading/flooding problems (infection, fire)                              │
│ • Finding nearest X                                                          │
│                                                                              │
│ IMPLEMENTATION: Queue (FIFO)                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ QUICK DECISION TABLE                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┬───────────────────────────────────┐ │
│ │ Problem Type                        │ Use                               │ │
│ ├─────────────────────────────────────┼───────────────────────────────────┤ │
│ │ Shortest path (unweighted)          │ BFS                               │ │
│ │ Shortest path (weighted)            │ Dijkstra/Bellman-Ford             │ │
│ │ Any path exists?                    │ DFS (simpler) or BFS              │ │
│ │ All paths                           │ DFS with backtracking             │ │
│ │ Cycle detection                     │ DFS                               │ │
│ │ Topological sort                    │ DFS (or Kahn's BFS)               │ │
│ │ Connected components                │ DFS or BFS                        │ │
│ │ Level/distance from source          │ BFS                               │ │
│ │ Island counting                     │ DFS or BFS                        │ │
│ │ Word ladder (transformation)        │ BFS                               │ │
│ └─────────────────────────────────────┴───────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## DFS (Depth-First Search)

```
GO DEEP first, then backtrack!

Start at node, visit neighbor, visit neighbor's neighbor...
Until dead end, then backtrack.

    0 --- 1
    |     |
    3 --- 2

DFS from 0: 0 → 1 → 2 → 3 (one possible order)

USES:
- Path finding
- Cycle detection
- Topological sort
- Connected components
```

```java
// RECURSIVE DFS
public void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    System.out.print(node + " ");

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, graph, visited);
        }
    }
}

// ITERATIVE DFS (using stack)
public void dfsIterative(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Stack<Integer> stack = new Stack<>();

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();

        if (!visited[node]) {
            visited[node] = true;
            System.out.print(node + " ");

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    stack.push(neighbor);
                }
            }
        }
    }
}

// TIME: O(V + E) where V = vertices, E = edges
// SPACE: O(V) for visited array and stack/recursion
```

## BFS (Breadth-First Search)

```
GO WIDE first! Visit all neighbors before going deeper.

    0 --- 1
    |     |
    3 --- 2

BFS from 0:
Level 0: 0
Level 1: 1, 3
Level 2: 2

BFS order: 0 → 1 → 3 → 2

USES:
- Shortest path (unweighted)
- Level-order traversal
- Finding nearest neighbor
```

```java
public void bfs(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();

    visited[start] = true;
    queue.offer(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

// SHORTEST PATH (unweighted graph)
public int shortestPath(int start, int end, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<int[]> queue = new LinkedList<>();  // [node, distance]

    visited[start] = true;
    queue.offer(new int[]{start, 0});

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int node = curr[0], dist = curr[1];

        if (node == end) return dist;

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(new int[]{neighbor, dist + 1});
            }
        }
    }

    return -1;  // No path found
}
```

---

# PART 7: CYCLE DETECTION

## In Undirected Graph

```java
// DFS approach
public boolean hasCycle(List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];

    for (int i = 0; i < graph.size(); i++) {
        if (!visited[i]) {
            if (dfsHasCycle(i, -1, graph, visited)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycle(int node, int parent,
                           List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            if (dfsHasCycle(neighbor, node, graph, visited)) {
                return true;
            }
        } else if (neighbor != parent) {
            // Visited neighbor that's not parent = cycle!
            return true;
        }
    }
    return false;
}
```

## In Directed Graph

```java
// Using colors: WHITE (unvisited), GRAY (in progress), BLACK (done)
public boolean hasCycleDirected(List<List<Integer>> graph) {
    int[] color = new int[graph.size()];  // 0=WHITE, 1=GRAY, 2=BLACK

    for (int i = 0; i < graph.size(); i++) {
        if (color[i] == 0) {
            if (dfsHasCycleDirected(i, graph, color)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycleDirected(int node, List<List<Integer>> graph, int[] color) {
    color[node] = 1;  // GRAY - in progress

    for (int neighbor : graph.get(node)) {
        if (color[neighbor] == 1) {
            // Found GRAY node = back edge = cycle!
            return true;
        }
        if (color[neighbor] == 0) {
            if (dfsHasCycleDirected(neighbor, graph, color)) {
                return true;
            }
        }
    }

    color[node] = 2;  // BLACK - done
    return false;
}
```

---

# PART 8: TOPOLOGICAL SORT

```
ORDER TASKS RESPECTING DEPENDENCIES
Only for DAGs (Directed Acyclic Graphs)

Example: Course prerequisites
Course 1 → Course 2 → Course 3
       ↘    Course 4 ↗

Valid orders: [1, 2, 4, 3] or [1, 4, 2, 3]
```

```java
// Kahn's Algorithm (BFS approach)
public List<Integer> topologicalSort(int numCourses, int[][] prerequisites) {
    // Build graph and calculate in-degrees
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);  // pre[1] → pre[0]
        inDegree[pre[0]]++;
    }

    // Add nodes with in-degree 0 to queue
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    List<Integer> result = new ArrayList<>();

    while (!queue.isEmpty()) {
        int node = queue.poll();
        result.add(node);

        for (int neighbor : graph.get(node)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    // If result doesn't contain all nodes, there's a cycle
    return result.size() == numCourses ? result : new ArrayList<>();
}
```

---

# PART 9: SHORTEST PATH ALGORITHMS

## Dijkstra's Algorithm

```
SHORTEST PATH from source to all nodes (weighted, non-negative)

IDEA: Greedy approach
- Start with source distance = 0, all others = infinity
- Always process the closest unvisited node
- Update distances through this node

    (0)---4---(1)
     |         |
     2         1
     |         |
    (2)---3---(3)

From node 0:
- dist[0] = 0, dist[1] = ∞, dist[2] = ∞, dist[3] = ∞
- Process 0: dist[1] = 4, dist[2] = 2
- Process 2 (closest): dist[3] = 2 + 3 = 5
- Process 1: dist[3] = min(5, 4+1) = 5
- Process 3: done

Final: dist = [0, 4, 2, 5]
```

```java
public int[] dijkstra(int n, List<int[]>[] graph, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Priority queue: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], node = curr[1];

        if (d > dist[node]) continue;  // Skip if outdated

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = dist[node] + weight;

            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.offer(new int[]{newDist, neighbor});
            }
        }
    }

    return dist;
}

// TIME: O((V + E) log V) with priority queue
// SPACE: O(V)
```

---

# PART 10: PRACTICE PROBLEMS

## Trees

```
EASY:
1. Maximum depth of binary tree
2. Invert binary tree
3. Same tree
4. Symmetric tree

MEDIUM:
1. Validate BST
2. Lowest common ancestor
3. Binary tree level order traversal
4. Construct binary tree from preorder/inorder

HARD:
1. Binary tree maximum path sum
2. Serialize and deserialize binary tree
```

## Graphs

```
EASY:
1. Find if path exists in graph
2. Find center of star graph

MEDIUM:
1. Number of islands (grid as graph)
2. Clone graph
3. Course schedule (topological sort)
4. Pacific Atlantic water flow

HARD:
1. Word ladder
2. Alien dictionary
3. Shortest path in binary matrix
```

---

# PART 11: Advanced Tree Algorithms

## Lowest Common Ancestor (LCA) with Binary Lifting

```
CONCEPT:
Preprocess tree to answer LCA queries in O(log n).
Uses the idea of "jumping" 2^i steps up at a time.

PREPROCESSING: O(n log n)
QUERY: O(log n)
```

```java
public class LCABinaryLifting {
    private int[][] up;  // up[node][i] = 2^i ancestor of node
    private int[] depth;
    private int LOG;

    public void preprocess(List<List<Integer>> adj, int root) {
        int n = adj.size();
        LOG = (int) Math.ceil(Math.log(n) / Math.log(2)) + 1;
        up = new int[n][LOG];
        depth = new int[n];

        // Initialize all ancestors to -1
        for (int[] row : up) Arrays.fill(row, -1);

        // DFS to fill depth and up[node][0] (direct parent)
        dfs(root, -1, 0, adj);

        // Fill the binary lifting table
        for (int j = 1; j < LOG; j++) {
            for (int i = 0; i < n; i++) {
                if (up[i][j - 1] != -1) {
                    up[i][j] = up[up[i][j - 1]][j - 1];
                }
            }
        }
    }

    private void dfs(int node, int parent, int d, List<List<Integer>> adj) {
        depth[node] = d;
        up[node][0] = parent;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, d + 1, adj);
            }
        }
    }

    public int lca(int a, int b) {
        // Make a the deeper node
        if (depth[a] < depth[b]) {
            int temp = a; a = b; b = temp;
        }

        // Bring a to same depth as b
        int diff = depth[a] - depth[b];
        for (int j = 0; j < LOG; j++) {
            if (((diff >> j) & 1) == 1) {
                a = up[a][j];
            }
        }

        if (a == b) return a;

        // Jump together
        for (int j = LOG - 1; j >= 0; j--) {
            if (up[a][j] != up[b][j]) {
                a = up[a][j];
                b = up[b][j];
            }
        }

        return up[a][0];
    }

    // Distance between two nodes
    public int distance(int a, int b) {
        int l = lca(a, b);
        return depth[a] + depth[b] - 2 * depth[l];
    }
}
```

## Tree Diameter

```java
// Method 1: Two BFS/DFS
public int treeDiameter(List<List<Integer>> adj) {
    int n = adj.size();

    // First BFS/DFS from any node to find farthest node
    int[] result1 = bfs(0, adj);
    int farthestNode = result1[0];

    // Second BFS/DFS from farthest to find diameter
    int[] result2 = bfs(farthestNode, adj);
    return result2[1];  // The diameter
}

private int[] bfs(int start, List<List<Integer>> adj) {
    int n = adj.size();
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[start] = 0;

    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);

    int farthestNode = start, maxDist = 0;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adj.get(node)) {
            if (dist[neighbor] == -1) {
                dist[neighbor] = dist[node] + 1;
                queue.offer(neighbor);
                if (dist[neighbor] > maxDist) {
                    maxDist = dist[neighbor];
                    farthestNode = neighbor;
                }
            }
        }
    }

    return new int[]{farthestNode, maxDist};
}

// Method 2: Single DFS (return longest path through each node)
public int diameterDFS(List<List<Integer>> adj) {
    int[] diameter = {0};
    dfs(0, -1, adj, diameter);
    return diameter[0];
}

private int dfs(int node, int parent, List<List<Integer>> adj, int[] diameter) {
    int max1 = 0, max2 = 0;  // Two longest paths down

    for (int child : adj.get(node)) {
        if (child != parent) {
            int childDepth = dfs(child, node, adj, diameter) + 1;
            if (childDepth > max1) {
                max2 = max1;
                max1 = childDepth;
            } else if (childDepth > max2) {
                max2 = childDepth;
            }
        }
    }

    diameter[0] = Math.max(diameter[0], max1 + max2);
    return max1;
}
```

## Euler Tour and Tree Flattening

```
CONCEPT:
Convert tree to array to enable range queries.
Record entry and exit times during DFS.

USE CASES:
- Subtree queries (sum, count, etc.)
- Path queries with Segment Tree
```

```java
public class EulerTour {
    private int[] tin, tout;  // Entry and exit times
    private int[] euler;      // Flattened tree
    private int timer;

    public void flatten(List<List<Integer>> adj, int root) {
        int n = adj.size();
        tin = new int[n];
        tout = new int[n];
        euler = new int[2 * n];
        timer = 0;

        dfs(root, -1, adj);
    }

    private void dfs(int node, int parent, List<List<Integer>> adj) {
        tin[node] = timer;
        euler[timer++] = node;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, adj);
            }
        }

        tout[node] = timer;
        euler[timer++] = node;  // Record exit (for some applications)
    }

    // Check if a is ancestor of b
    public boolean isAncestor(int a, int b) {
        return tin[a] <= tin[b] && tout[a] >= tout[b];
    }

    // Subtree of node is represented by euler[tin[node]..tout[node]-1]
    // Can use Segment Tree for range queries on subtrees
}
```

---

# PART 12: Advanced Graph Algorithms

## Bellman-Ford Algorithm (Negative Weights)

```
CONCEPT:
Find shortest paths from source to all vertices.
Works with negative edge weights.
Can detect negative cycles.

TIME: O(V * E)
```

```java
public int[] bellmanFord(int n, int[][] edges, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        boolean updated = false;
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;  // Early termination
    }

    // Check for negative cycles
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            return null;  // Negative cycle detected
        }
    }

    return dist;
}
```

## Floyd-Warshall Algorithm (All-Pairs Shortest Path)

```
CONCEPT:
Find shortest paths between ALL pairs of vertices.
Uses dynamic programming.

TIME: O(V³)
SPACE: O(V²)
```

```java
public int[][] floydWarshall(int[][] graph) {
    int n = graph.length;
    int[][] dist = new int[n][n];

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            dist[i][j] = graph[i][j];
        }
    }

    // Try each vertex as intermediate
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != Integer.MAX_VALUE &&
                    dist[k][j] != Integer.MAX_VALUE &&
                    dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// Visual for k=1 (using vertex 1 as intermediate):
// dist[0][2] = min(dist[0][2], dist[0][1] + dist[1][2])
```

## Minimum Spanning Tree - Prim's Algorithm

```java
public int primMST(int n, List<int[]>[] graph) {
    boolean[] inMST = new boolean[n];
    // PQ: [weight, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, 0});  // Start from node 0

    int totalWeight = 0;
    int edgesAdded = 0;

    while (!pq.isEmpty() && edgesAdded < n) {
        int[] curr = pq.poll();
        int weight = curr[0], node = curr[1];

        if (inMST[node]) continue;

        inMST[node] = true;
        totalWeight += weight;
        edgesAdded++;

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], edgeWeight = edge[1];
            if (!inMST[neighbor]) {
                pq.offer(new int[]{edgeWeight, neighbor});
            }
        }
    }

    return edgesAdded == n ? totalWeight : -1;
}
```

## Minimum Spanning Tree - Kruskal's Algorithm

```java
public int kruskalMST(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int totalWeight = 0;
    int edgesAdded = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (uf.union(u, v)) {
            totalWeight += w;
            edgesAdded++;
            if (edgesAdded == n - 1) break;
        }
    }

    return edgesAdded == n - 1 ? totalWeight : -1;
}
```

## Articulation Points and Bridges

```
CONCEPT:
Articulation Point: A vertex whose removal disconnects the graph.
Bridge: An edge whose removal disconnects the graph.

USE CASES:
- Network vulnerability analysis
- Finding critical connections
```

```java
public class ArticulationPointsBridges {
    private int timer = 0;
    private List<Integer> articulationPoints = new ArrayList<>();
    private List<int[]> bridges = new ArrayList<>();

    public void find(List<List<Integer>> adj) {
        int n = adj.size();
        boolean[] visited = new boolean[n];
        int[] tin = new int[n];   // Discovery time
        int[] low = new int[n];   // Lowest reachable time

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(i, -1, adj, visited, tin, low);
            }
        }
    }

    private void dfs(int node, int parent, List<List<Integer>> adj,
                     boolean[] visited, int[] tin, int[] low) {
        visited[node] = true;
        tin[node] = low[node] = timer++;
        int children = 0;

        for (int neighbor : adj.get(node)) {
            if (neighbor == parent) continue;

            if (visited[neighbor]) {
                // Back edge
                low[node] = Math.min(low[node], tin[neighbor]);
            } else {
                // Tree edge
                children++;
                dfs(neighbor, node, adj, visited, tin, low);
                low[node] = Math.min(low[node], low[neighbor]);

                // Check for articulation point
                if (parent != -1 && low[neighbor] >= tin[node]) {
                    articulationPoints.add(node);
                }

                // Check for bridge
                if (low[neighbor] > tin[node]) {
                    bridges.add(new int[]{node, neighbor});
                }
            }
        }

        // Special case: root with multiple children is articulation point
        if (parent == -1 && children > 1) {
            articulationPoints.add(node);
        }
    }
}
```

---

# PART 13: Graph Problem Patterns

## Pattern 1: Multi-Source BFS

```java
// Find distance from any '0' cell to each cell in grid
public int[][] multiSourceBFS(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dist = new int[m][n];
    Queue<int[]> queue = new LinkedList<>();

    // Add all sources to queue initially
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 0) {
                queue.offer(new int[]{i, j});
                dist[i][j] = 0;
            } else {
                dist[i][j] = Integer.MAX_VALUE;
            }
        }
    }

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int x = cell[0], y = cell[1];

        for (int[] dir : dirs) {
            int nx = x + dir[0], ny = y + dir[1];
            if (nx >= 0 && nx < m && ny >= 0 && ny < n &&
                dist[x][y] + 1 < dist[nx][ny]) {
                dist[nx][ny] = dist[x][y] + 1;
                queue.offer(new int[]{nx, ny});
            }
        }
    }

    return dist;
}
```

## Pattern 2: Bidirectional BFS

```java
// Word Ladder: Find shortest transformation sequence
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(endWord)) return 0;

    Set<String> startSet = new HashSet<>();
    Set<String> endSet = new HashSet<>();
    startSet.add(beginWord);
    endSet.add(endWord);

    int length = 1;

    while (!startSet.isEmpty() && !endSet.isEmpty()) {
        // Always expand smaller set
        if (startSet.size() > endSet.size()) {
            Set<String> temp = startSet;
            startSet = endSet;
            endSet = temp;
        }

        Set<String> nextSet = new HashSet<>();

        for (String word : startSet) {
            char[] chars = word.toCharArray();

            for (int i = 0; i < chars.length; i++) {
                char original = chars[i];

                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    chars[i] = c;
                    String newWord = new String(chars);

                    if (endSet.contains(newWord)) {
                        return length + 1;
                    }

                    if (dict.contains(newWord)) {
                        nextSet.add(newWord);
                        dict.remove(newWord);
                    }
                }

                chars[i] = original;
            }
        }

        startSet = nextSet;
        length++;
    }

    return 0;
}
```

## Pattern 3: Topological Sort with Kahn's Algorithm

```java
// Course Schedule II: Return order to take courses
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        adj.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    int[] result = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int course = queue.poll();
        result[index++] = course;

        for (int next : adj.get(course)) {
            if (--inDegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

## Pattern 4: Cycle Detection in Directed Graph (Three Colors)

```java
public boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] color = new int[n];  // 0: white, 1: gray, 2: black

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfs(i, adj, color)) {
            return true;
        }
    }

    return false;
}

private boolean dfs(int node, List<List<Integer>> adj, int[] color) {
    color[node] = 1;  // Mark as visiting (gray)

    for (int neighbor : adj.get(node)) {
        if (color[neighbor] == 1) return true;  // Back edge = cycle
        if (color[neighbor] == 0 && dfs(neighbor, adj, color)) {
            return true;
        }
    }

    color[node] = 2;  // Mark as visited (black)
    return false;
}
```

---

# PART 14: Complete Tree Problems with Solutions

## Problem 1: Serialize and Deserialize Binary Tree

```java
public class Codec {
    // Encodes a tree to a single string
    public String serialize(TreeNode root) {
        if (root == null) return "null";

        StringBuilder sb = new StringBuilder();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();

            if (node == null) {
                sb.append("null,");
            } else {
                sb.append(node.val).append(",");
                queue.offer(node.left);
                queue.offer(node.right);
            }
        }

        return sb.toString();
    }

    // Decodes your encoded data to tree
    public TreeNode deserialize(String data) {
        if (data.equals("null")) return null;

        String[] nodes = data.split(",");
        TreeNode root = new TreeNode(Integer.parseInt(nodes[0]));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        int i = 1;
        while (!queue.isEmpty() && i < nodes.length) {
            TreeNode parent = queue.poll();

            if (!nodes[i].equals("null")) {
                parent.left = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(parent.left);
            }
            i++;

            if (i < nodes.length && !nodes[i].equals("null")) {
                parent.right = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(parent.right);
            }
            i++;
        }

        return root;
    }
}
```

## Problem 2: Construct Binary Tree from Preorder and Inorder

```java
public TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> inorderMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) {
        inorderMap.put(inorder[i], i);
    }

    return build(preorder, 0, preorder.length - 1,
                 0, inorder.length - 1, inorderMap);
}

private TreeNode build(int[] preorder, int preStart, int preEnd,
                       int inStart, int inEnd,
                       Map<Integer, Integer> inorderMap) {
    if (preStart > preEnd) return null;

    int rootVal = preorder[preStart];
    TreeNode root = new TreeNode(rootVal);

    int rootIndex = inorderMap.get(rootVal);
    int leftSize = rootIndex - inStart;

    root.left = build(preorder, preStart + 1, preStart + leftSize,
                      inStart, rootIndex - 1, inorderMap);
    root.right = build(preorder, preStart + leftSize + 1, preEnd,
                       rootIndex + 1, inEnd, inorderMap);

    return root;
}
```

## Problem 3: Binary Tree Maximum Path Sum

```java
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxGain(root, maxSum);
    return maxSum[0];
}

private int maxGain(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Maximum contribution from left and right subtrees
    // Take max with 0 to ignore negative paths
    int leftGain = Math.max(0, maxGain(node.left, maxSum));
    int rightGain = Math.max(0, maxGain(node.right, maxSum));

    // Price of path passing through this node
    int pathPrice = node.val + leftGain + rightGain;
    maxSum[0] = Math.max(maxSum[0], pathPrice);

    // Return max gain if continuing path through this node
    return node.val + Math.max(leftGain, rightGain);
}
```

## Problem 4: Flatten Binary Tree to Linked List

```java
// In-place solution using Morris traversal idea
public void flatten(TreeNode root) {
    TreeNode curr = root;

    while (curr != null) {
        if (curr.left != null) {
            // Find rightmost node in left subtree
            TreeNode rightmost = curr.left;
            while (rightmost.right != null) {
                rightmost = rightmost.right;
            }

            // Connect right subtree
            rightmost.right = curr.right;

            // Move left to right
            curr.right = curr.left;
            curr.left = null;
        }

        curr = curr.right;
    }
}

// Visual:
//     1
//    / \
//   2   5
//  / \   \
// 3   4   6
//
// After flattening:
// 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

---

# PART 15: Complete Graph Problems with Solutions

## Problem 1: Clone Graph

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;

    Map<Node, Node> visited = new HashMap<>();
    return clone(node, visited);
}

private Node clone(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) {
        return visited.get(node);
    }

    Node copy = new Node(node.val);
    visited.put(node, copy);

    for (Node neighbor : node.neighbors) {
        copy.neighbors.add(clone(neighbor, visited));
    }

    return copy;
}
```

## Problem 2: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];

    // Start from edges and work inward
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0);       // Pacific left edge
        dfs(heights, atlantic, i, n - 1);  // Atlantic right edge
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j);       // Pacific top edge
        dfs(heights, atlantic, m - 1, j);  // Atlantic bottom edge
    }

    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (pacific[i][j] && atlantic[i][j]) {
                result.add(Arrays.asList(i, j));
            }
        }
    }

    return result;
}

private void dfs(int[][] heights, boolean[][] visited, int i, int j) {
    int m = heights.length, n = heights[0].length;
    visited[i][j] = true;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    for (int[] dir : dirs) {
        int ni = i + dir[0], nj = j + dir[1];
        if (ni >= 0 && ni < m && nj >= 0 && nj < n &&
            !visited[ni][nj] && heights[ni][nj] >= heights[i][j]) {
            dfs(heights, visited, ni, nj);
        }
    }
}
```

## Problem 3: Network Delay Time (Dijkstra)

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] time : times) {
        graph[time[0]].add(new int[]{time[1], time[2]});
    }

    // Dijkstra
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int node = curr[0], time = curr[1];

        if (time > dist[node]) continue;

        for (int[] edge : graph[node]) {
            int next = edge[0], weight = edge[1];
            if (dist[node] + weight < dist[next]) {
                dist[next] = dist[node] + weight;
                pq.offer(new int[]{next, dist[next]});
            }
        }
    }

    int maxTime = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }

    return maxTime;
}
```

## Problem 4: Cheapest Flights Within K Stops

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    // BFS with level tracking (Bellman-Ford style)
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone();
        for (int[] flight : flights) {
            int u = flight[0], v = flight[1], price = flight[2];
            if (dist[u] != Integer.MAX_VALUE) {
                temp[v] = Math.min(temp[v], dist[u] + price);
            }
        }
        dist = temp;
    }

    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

---

# 🔬 PART FINAL: ADVANCED TREE & GRAPH ALGORITHMS - DEEP DIVE

## ADVANCED TREE ALGORITHMS

### 1. LOWEST COMMON ANCESTOR (LCA) - MULTIPLE APPROACHES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LCA ALGORITHMS - COMPLETE COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Problem: Find the lowest common ancestor of two nodes p and q in a tree        │
│                                                                                  │
│  Tree:         3                                                                 │
│              /   \                                                               │
│             5     1                                                              │
│            / \   / \                                                             │
│           6   2 0   8                                                            │
│              / \                                                                 │
│             7   4                                                                │
│                                                                                  │
│  LCA(5, 1) = 3                                                                   │
│  LCA(5, 4) = 5                                                                   │
│  LCA(6, 4) = 5                                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// APPROACH 1: RECURSIVE (O(n) time, O(h) space)
// Works for general binary tree
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // Base case: null or found p or q
    if (root == null || root == p || root == q) {
        return root;
    }

    // Search in both subtrees
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found something, root is LCA
    if (left != null && right != null) {
        return root;
    }

    // Otherwise, LCA is on the side that found something
    return left != null ? left : right;
}

/*
 * TRACE for LCA(5, 4):
 *
 * lowestCommonAncestor(3, 5, 4)
 *   ├─ lowestCommonAncestor(5, 5, 4) = 5 (found 5!)
 *   │    └─ (short-circuits, returns immediately)
 *   └─ lowestCommonAncestor(1, 5, 4) = null
 *
 * left = 5, right = null
 * Return: 5 (the LCA!)
 */

// APPROACH 2: ITERATIVE WITH PARENT POINTERS
// O(n) time, O(n) space
public TreeNode lcaWithParents(TreeNode root, TreeNode p, TreeNode q) {
    Map<TreeNode, TreeNode> parent = new HashMap<>();
    Deque<TreeNode> stack = new ArrayDeque<>();

    parent.put(root, null);
    stack.push(root);

    // Build parent map until both p and q are found
    while (!parent.containsKey(p) || !parent.containsKey(q)) {
        TreeNode node = stack.pop();
        if (node.left != null) {
            parent.put(node.left, node);
            stack.push(node.left);
        }
        if (node.right != null) {
            parent.put(node.right, node);
            stack.push(node.right);
        }
    }

    // Collect ancestors of p
    Set<TreeNode> ancestors = new HashSet<>();
    while (p != null) {
        ancestors.add(p);
        p = parent.get(p);
    }

    // First ancestor of q that's also ancestor of p is LCA
    while (!ancestors.contains(q)) {
        q = parent.get(q);
    }

    return q;
}

// APPROACH 3: FOR BST (O(h) time, O(1) space)
public TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) {
            root = root.left;   // Both in left subtree
        } else if (p.val > root.val && q.val > root.val) {
            root = root.right;  // Both in right subtree
        } else {
            return root;        // Split point = LCA
        }
    }
    return null;
}

// APPROACH 4: BINARY LIFTING (For multiple LCA queries)
// Preprocessing: O(n log n)
// Each query: O(log n)
class LCABinaryLifting {
    int[][] parent;  // parent[i][j] = 2^j-th ancestor of node i
    int[] depth;
    int LOG;

    public void preprocess(int n, int[][] edges) {
        LOG = (int)(Math.log(n) / Math.log(2)) + 1;
        parent = new int[n][LOG];
        depth = new int[n];

        // Build tree and compute depths
        List<List<Integer>> adj = buildAdjList(n, edges);
        dfs(0, -1, 0, adj);

        // Binary lifting table
        for (int j = 1; j < LOG; j++) {
            for (int i = 0; i < n; i++) {
                if (parent[i][j-1] != -1) {
                    parent[i][j] = parent[parent[i][j-1]][j-1];
                } else {
                    parent[i][j] = -1;
                }
            }
        }
    }

    private void dfs(int u, int par, int d, List<List<Integer>> adj) {
        parent[u][0] = par;
        depth[u] = d;
        for (int v : adj.get(u)) {
            if (v != par) {
                dfs(v, u, d + 1, adj);
            }
        }
    }

    public int lca(int u, int v) {
        // Make u deeper
        if (depth[u] < depth[v]) {
            int temp = u; u = v; v = temp;
        }

        // Lift u to same depth as v
        int diff = depth[u] - depth[v];
        for (int j = 0; j < LOG; j++) {
            if (((diff >> j) & 1) == 1) {
                u = parent[u][j];
            }
        }

        if (u == v) return u;

        // Lift both until they meet
        for (int j = LOG - 1; j >= 0; j--) {
            if (parent[u][j] != parent[v][j]) {
                u = parent[u][j];
                v = parent[v][j];
            }
        }

        return parent[u][0];
    }
}
```

### 2. TREE DIAMETER AND CENTER

```java
/*
 * TREE DIAMETER: Longest path between any two nodes
 *
 *           1
 *          /|\
 *         2 3 4
 *        /|   |
 *       5 6   7
 *      /
 *     8
 *
 * Diameter = path from 8 to 7 = 5 edges
 */

// APPROACH 1: Two BFS (works for general tree)
// O(n) time, O(n) space
public int treeDiameter(int n, int[][] edges) {
    List<List<Integer>> adj = buildAdjList(n, edges);

    // BFS from any node to find farthest node (one endpoint)
    int farthest = bfsGetFarthest(0, adj, n);

    // BFS from that node to find diameter
    return bfsGetMaxDist(farthest, adj, n);
}

private int bfsGetFarthest(int start, List<List<Integer>> adj, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    dist[start] = 0;

    int farthest = start;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v : adj.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                queue.offer(v);
                if (dist[v] > dist[farthest]) {
                    farthest = v;
                }
            }
        }
    }
    return farthest;
}

// For Binary Tree: DFS approach
// O(n) time, O(h) space
int diameter = 0;

public int diameterOfBinaryTree(TreeNode root) {
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;

    int left = depth(node.left);
    int right = depth(node.right);

    // Diameter passing through this node
    diameter = Math.max(diameter, left + right);

    // Return depth of this subtree
    return 1 + Math.max(left, right);
}

/*
 * TREE CENTER: Node(s) that minimize max distance to any other node
 *
 * For a tree, center is either:
 * - Middle node of diameter (if diameter is even)
 * - Two middle nodes (if diameter is odd)
 *
 * ALGORITHM: Remove leaves layer by layer until 1 or 2 nodes remain
 */

public List<Integer> findCenter(int n, int[][] edges) {
    if (n == 1) return Arrays.asList(0);

    List<Set<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new HashSet<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }

    // Start with leaves
    Queue<Integer> leaves = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        if (adj.get(i).size() == 1) {
            leaves.offer(i);
        }
    }

    int remaining = n;
    while (remaining > 2) {
        int leafCount = leaves.size();
        remaining -= leafCount;

        for (int i = 0; i < leafCount; i++) {
            int leaf = leaves.poll();
            int neighbor = adj.get(leaf).iterator().next();
            adj.get(neighbor).remove(leaf);

            if (adj.get(neighbor).size() == 1) {
                leaves.offer(neighbor);
            }
        }
    }

    return new ArrayList<>(leaves);
}
```

### 3. TREE DP - COMPREHENSIVE PATTERNS

```java
/*
 * TREE DP PATTERN: Compute answer for each subtree
 *
 * Common patterns:
 * 1. Root-to-leaf: Pass information DOWN
 * 2. Leaf-to-root: Return information UP
 * 3. Rerooting: Combine both directions
 */

// PATTERN 1: House Robber III
// Can't rob two directly connected houses
public int rob(TreeNode root) {
    int[] result = robHelper(root);
    return Math.max(result[0], result[1]);
}

// Returns [maxWithoutRoot, maxWithRoot]
private int[] robHelper(TreeNode node) {
    if (node == null) return new int[]{0, 0};

    int[] left = robHelper(node.left);
    int[] right = robHelper(node.right);

    // Without current node: take max of children (can include or exclude them)
    int without = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

    // With current node: must exclude children's values
    int with = node.val + left[0] + right[0];

    return new int[]{without, with};
}

// PATTERN 2: Binary Tree Maximum Path Sum
// Path can start and end anywhere
int maxPathSum = Integer.MIN_VALUE;

public int maxPathSum(TreeNode root) {
    maxGain(root);
    return maxPathSum;
}

private int maxGain(TreeNode node) {
    if (node == null) return 0;

    // Max gain from left and right (ignore negative)
    int leftGain = Math.max(maxGain(node.left), 0);
    int rightGain = Math.max(maxGain(node.right), 0);

    // Path through current node
    int pathSum = node.val + leftGain + rightGain;
    maxPathSum = Math.max(maxPathSum, pathSum);

    // Return max gain if continuing upward
    return node.val + Math.max(leftGain, rightGain);
}

// PATTERN 3: Rerooting DP
// Find sum of distances from each node to all other nodes
public int[] sumOfDistancesInTree(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }

    int[] count = new int[n];  // Subtree size
    int[] result = new int[n]; // Sum of distances

    // DFS 1: Calculate for root 0
    dfs1(0, -1, adj, count, result);

    // DFS 2: Reroot to calculate for all nodes
    dfs2(0, -1, adj, count, result, n);

    return result;
}

private void dfs1(int u, int parent, List<List<Integer>> adj,
                  int[] count, int[] result) {
    count[u] = 1;
    for (int v : adj.get(u)) {
        if (v != parent) {
            dfs1(v, u, adj, count, result);
            count[u] += count[v];
            result[u] += result[v] + count[v];
        }
    }
}

private void dfs2(int u, int parent, List<List<Integer>> adj,
                  int[] count, int[] result, int n) {
    for (int v : adj.get(u)) {
        if (v != parent) {
            // Moving root from u to v:
            // - count[v] nodes get 1 closer
            // - (n - count[v]) nodes get 1 farther
            result[v] = result[u] - count[v] + (n - count[v]);
            dfs2(v, u, adj, count, result, n);
        }
    }
}
```

## ADVANCED GRAPH ALGORITHMS

### 4. TOPOLOGICAL SORT - ALL APPROACHES

```java
/*
 * TOPOLOGICAL SORT: Linear ordering where for every edge (u,v), u comes before v
 * Only works for DAG (Directed Acyclic Graph)
 *
 *     5 → 2 → 3
 *     ↓   ↓   ↓
 *     0 ← 4 → 1
 *
 * Valid orderings: [5, 4, 2, 3, 1, 0], [5, 4, 0, 2, 3, 1], etc.
 */

// APPROACH 1: Kahn's Algorithm (BFS, uses in-degree)
public int[] topologicalSortKahn(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[n];

    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        inDegree[edge[1]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int[] result = new int[n];
    int index = 0;

    while (!queue.isEmpty()) {
        int u = queue.poll();
        result[index++] = u;

        for (int v : adj.get(u)) {
            if (--inDegree[v] == 0) {
                queue.offer(v);
            }
        }
    }

    // If not all nodes included, cycle exists
    return index == n ? result : new int[0];
}

// APPROACH 2: DFS with reverse postorder
public int[] topologicalSortDFS(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
    }

    int[] visited = new int[n];  // 0=unvisited, 1=visiting, 2=visited
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (visited[i] == 0) {
            if (!dfs(i, adj, visited, stack)) {
                return new int[0];  // Cycle detected
            }
        }
    }

    int[] result = new int[n];
    int index = 0;
    while (!stack.isEmpty()) {
        result[index++] = stack.pop();
    }
    return result;
}

private boolean dfs(int u, List<List<Integer>> adj,
                   int[] visited, Deque<Integer> stack) {
    visited[u] = 1;  // Visiting

    for (int v : adj.get(u)) {
        if (visited[v] == 1) return false;  // Back edge = cycle
        if (visited[v] == 0 && !dfs(v, adj, visited, stack)) {
            return false;
        }
    }

    visited[u] = 2;  // Visited
    stack.push(u);   // Add to result in reverse postorder
    return true;
}
```

### 5. STRONGLY CONNECTED COMPONENTS (SCC)

```java
/*
 * SCC: Maximal set of vertices where every vertex is reachable from every other
 *
 *     ┌──→ 1 ──→ 2 ──┐
 *     │    ↑    ↓    │
 *     0    │    3    │
 *          │    ↓    │
 *          └─── 4 ←──┘
 *
 * SCCs: {0}, {1, 2, 3, 4}
 */

// KOSARAJU'S ALGORITHM: O(V + E)
public List<List<Integer>> findSCCs(int n, int[][] edges) {
    // Build adjacency list and reverse graph
    List<List<Integer>> adj = new ArrayList<>();
    List<List<Integer>> radj = new ArrayList<>();  // Reversed

    for (int i = 0; i < n; i++) {
        adj.add(new ArrayList<>());
        radj.add(new ArrayList<>());
    }

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        radj.get(edge[1]).add(edge[0]);  // Reversed
    }

    // Step 1: DFS on original graph, collect finish order
    boolean[] visited = new boolean[n];
    Deque<Integer> finishOrder = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            dfs1(i, adj, visited, finishOrder);
        }
    }

    // Step 2: DFS on reversed graph in reverse finish order
    visited = new boolean[n];
    List<List<Integer>> sccs = new ArrayList<>();

    while (!finishOrder.isEmpty()) {
        int u = finishOrder.pop();
        if (!visited[u]) {
            List<Integer> scc = new ArrayList<>();
            dfs2(u, radj, visited, scc);
            sccs.add(scc);
        }
    }

    return sccs;
}

private void dfs1(int u, List<List<Integer>> adj,
                  boolean[] visited, Deque<Integer> stack) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v]) {
            dfs1(v, adj, visited, stack);
        }
    }
    stack.push(u);
}

private void dfs2(int u, List<List<Integer>> radj,
                  boolean[] visited, List<Integer> scc) {
    visited[u] = true;
    scc.add(u);
    for (int v : radj.get(u)) {
        if (!visited[v]) {
            dfs2(v, radj, visited, scc);
        }
    }
}

// TARJAN'S ALGORITHM: O(V + E), single DFS
public List<List<Integer>> tarjanSCC(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
    }

    int[] ids = new int[n];      // Discovery time
    int[] low = new int[n];      // Lowest reachable id
    boolean[] onStack = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    Arrays.fill(ids, -1);

    List<List<Integer>> sccs = new ArrayList<>();
    int[] time = {0};

    for (int i = 0; i < n; i++) {
        if (ids[i] == -1) {
            tarjanDFS(i, adj, ids, low, onStack, stack, sccs, time);
        }
    }

    return sccs;
}

private void tarjanDFS(int u, List<List<Integer>> adj, int[] ids, int[] low,
                       boolean[] onStack, Deque<Integer> stack,
                       List<List<Integer>> sccs, int[] time) {
    ids[u] = low[u] = time[0]++;
    stack.push(u);
    onStack[u] = true;

    for (int v : adj.get(u)) {
        if (ids[v] == -1) {
            tarjanDFS(v, adj, ids, low, onStack, stack, sccs, time);
            low[u] = Math.min(low[u], low[v]);
        } else if (onStack[v]) {
            low[u] = Math.min(low[u], ids[v]);
        }
    }

    // If u is root of SCC
    if (ids[u] == low[u]) {
        List<Integer> scc = new ArrayList<>();
        while (true) {
            int v = stack.pop();
            onStack[v] = false;
            scc.add(v);
            if (v == u) break;
        }
        sccs.add(scc);
    }
}
```

### 6. MINIMUM SPANNING TREE (MST)

```java
/*
 * MST: Tree that connects all vertices with minimum total edge weight
 *
 *        2
 *     0 --- 1
 *    1|\ 3/  |2
 *     | X    |
 *    3|/ 4\  |
 *     2 --- 3
 *        3
 *
 * MST edges: (0,2), (0,1), (1,3) = total weight 5
 */

// KRUSKAL'S ALGORITHM: O(E log E)
// Sort edges, add if no cycle (using Union-Find)
public int kruskalMST(int n, int[][] edges) {
    // Sort by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int mstWeight = 0;
    int edgeCount = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (uf.union(u, v)) {
            mstWeight += w;
            edgeCount++;
            if (edgeCount == n - 1) break;  // MST complete
        }
    }

    return edgeCount == n - 1 ? mstWeight : -1;  // -1 if disconnected
}

class UnionFind {
    int[] parent, rank;

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

    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;  // Already connected

        // Union by rank
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}

// PRIM'S ALGORITHM: O(E log V)
// Start from any vertex, greedily add cheapest edge
public int primMST(int n, int[][] edges) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(new int[]{edge[1], edge[2]});
        adj.get(edge[1]).add(new int[]{edge[0], edge[2]});
    }

    // Min-heap: [weight, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    boolean[] inMST = new boolean[n];
    int mstWeight = 0;
    int count = 0;

    pq.offer(new int[]{0, 0});  // Start from vertex 0

    while (!pq.isEmpty() && count < n) {
        int[] curr = pq.poll();
        int w = curr[0], u = curr[1];

        if (inMST[u]) continue;

        inMST[u] = true;
        mstWeight += w;
        count++;

        for (int[] next : adj.get(u)) {
            int v = next[0], edgeW = next[1];
            if (!inMST[v]) {
                pq.offer(new int[]{edgeW, v});
            }
        }
    }

    return count == n ? mstWeight : -1;
}
```

### 7. ARTICULATION POINTS AND BRIDGES

```java
/*
 * ARTICULATION POINT: Vertex whose removal disconnects the graph
 * BRIDGE: Edge whose removal disconnects the graph
 *
 *     1 --- 2        Articulation points: 2, 3
 *     |     |        Bridge: (2, 3)
 *     0 --- 2 --- 3 --- 4
 */

public class ArticulationPointsAndBridges {
    int time = 0;

    public List<Integer> findArticulationPoints(int n, int[][] edges) {
        List<List<Integer>> adj = buildGraph(n, edges);

        int[] disc = new int[n];      // Discovery time
        int[] low = new int[n];       // Lowest reachable
        int[] parent = new int[n];
        boolean[] visited = new boolean[n];
        boolean[] isAP = new boolean[n];

        Arrays.fill(parent, -1);

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfsAP(i, adj, disc, low, parent, visited, isAP);
            }
        }

        List<Integer> aps = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (isAP[i]) aps.add(i);
        }
        return aps;
    }

    private void dfsAP(int u, List<List<Integer>> adj, int[] disc, int[] low,
                       int[] parent, boolean[] visited, boolean[] isAP) {
        int children = 0;
        visited[u] = true;
        disc[u] = low[u] = time++;

        for (int v : adj.get(u)) {
            if (!visited[v]) {
                children++;
                parent[v] = u;
                dfsAP(v, adj, disc, low, parent, visited, isAP);

                low[u] = Math.min(low[u], low[v]);

                // u is AP if:
                // 1. u is root and has 2+ children
                // 2. u is not root and low[v] >= disc[u]
                if (parent[u] == -1 && children > 1) {
                    isAP[u] = true;
                }
                if (parent[u] != -1 && low[v] >= disc[u]) {
                    isAP[u] = true;
                }
            } else if (v != parent[u]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }

    public List<int[]> findBridges(int n, int[][] edges) {
        List<List<Integer>> adj = buildGraph(n, edges);
        time = 0;

        int[] disc = new int[n];
        int[] low = new int[n];
        int[] parent = new int[n];
        boolean[] visited = new boolean[n];
        List<int[]> bridges = new ArrayList<>();

        Arrays.fill(parent, -1);

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfsBridge(i, adj, disc, low, parent, visited, bridges);
            }
        }

        return bridges;
    }

    private void dfsBridge(int u, List<List<Integer>> adj, int[] disc, int[] low,
                           int[] parent, boolean[] visited, List<int[]> bridges) {
        visited[u] = true;
        disc[u] = low[u] = time++;

        for (int v : adj.get(u)) {
            if (!visited[v]) {
                parent[v] = u;
                dfsBridge(v, adj, disc, low, parent, visited, bridges);

                low[u] = Math.min(low[u], low[v]);

                // Bridge if low[v] > disc[u] (no back edge from subtree)
                if (low[v] > disc[u]) {
                    bridges.add(new int[]{u, v});
                }
            } else if (v != parent[u]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }
}
```

### 8. EULER PATH AND HAMILTONIAN PATH

```java
/*
 * EULER PATH: Visit every EDGE exactly once
 * EULER CIRCUIT: Euler path that starts and ends at same vertex
 *
 * Existence conditions:
 * - Undirected: Euler circuit exists iff all vertices have even degree
 *              Euler path exists iff exactly 0 or 2 vertices have odd degree
 * - Directed: Euler circuit exists iff in-degree == out-degree for all
 *             Euler path exists iff one vertex has out-degree = in-degree + 1
 *             and one has in-degree = out-degree + 1
 *
 * HAMILTONIAN PATH: Visit every VERTEX exactly once
 * HAMILTONIAN CYCLE: Hamiltonian path that returns to start
 *
 * NP-complete! No efficient algorithm known.
 */

// Hierholzer's Algorithm for Euler Path: O(E)
public List<Integer> eulerPath(int n, int[][] edges) {
    // Build adjacency list with edge indices for removal
    List<Map<Integer, Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new HashMap<>());

    int[] degree = new int[n];
    for (int[] edge : edges) {
        adj.get(edge[0]).merge(edge[1], 1, Integer::sum);
        adj.get(edge[1]).merge(edge[0], 1, Integer::sum);
        degree[edge[0]]++;
        degree[edge[1]]++;
    }

    // Find start vertex (odd degree vertex, or any vertex)
    int start = 0;
    for (int i = 0; i < n; i++) {
        if (degree[i] % 2 == 1) {
            start = i;
            break;
        }
    }

    Deque<Integer> stack = new ArrayDeque<>();
    List<Integer> path = new ArrayList<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int u = stack.peek();
        if (adj.get(u).isEmpty()) {
            path.add(stack.pop());
        } else {
            int v = adj.get(u).keySet().iterator().next();
            stack.push(v);

            // Remove edge
            adj.get(u).merge(v, -1, Integer::sum);
            if (adj.get(u).get(v) == 0) adj.get(u).remove(v);
            adj.get(v).merge(u, -1, Integer::sum);
            if (adj.get(v).get(u) == 0) adj.get(v).remove(u);
        }
    }

    Collections.reverse(path);
    return path;
}

// Hamiltonian Path using DP + Bitmask: O(n² * 2^n)
public boolean hasHamiltonianPath(int n, int[][] edges) {
    boolean[][] adj = new boolean[n][n];
    for (int[] edge : edges) {
        adj[edge[0]][edge[1]] = true;
        adj[edge[1]][edge[0]] = true;
    }

    // dp[mask][i] = can reach state where visited nodes = mask, ending at i
    boolean[][] dp = new boolean[1 << n][n];

    // Base case: start at each single node
    for (int i = 0; i < n; i++) {
        dp[1 << i][i] = true;
    }

    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if (!dp[mask][last]) continue;
            if ((mask & (1 << last)) == 0) continue;

            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;  // Already visited
                if (!adj[last][next]) continue;  // No edge

                dp[mask | (1 << next)][next] = true;
            }
        }
    }

    // Check if full path exists (all nodes visited)
    int fullMask = (1 << n) - 1;
    for (int i = 0; i < n; i++) {
        if (dp[fullMask][i]) return true;
    }
    return false;
}
```

## ALGORITHM COMPLEXITY COMPARISON

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TREE & GRAPH ALGORITHMS - COMPLEXITY SUMMARY                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TREE TRAVERSALS:                                                                │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Preorder/Inorder/Post  │ O(n)       │ O(h)      │ Recursive or iterative   ││
│  │ Level Order (BFS)      │ O(n)       │ O(w)      │ w = max width            ││
│  │ Morris Traversal       │ O(n)       │ O(1)      │ Modifies tree temporarily ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  BST OPERATIONS:                                                                 │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Operation              │ Average    │ Worst     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Search                 │ O(log n)   │ O(n)      │ Worst = skewed tree      ││
│  │ Insert                 │ O(log n)   │ O(n)      │ Maintain balance!        ││
│  │ Delete                 │ O(log n)   │ O(n)      │ Three cases             ││
│  │ Find min/max           │ O(log n)   │ O(n)      │ Follow left/right       ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  BALANCED TREES (AVL, Red-Black):                                               │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Operation              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ All operations         │ O(log n)   │ O(log n)  │ Guaranteed balanced      ││
│  │ Rebalancing            │ O(1)       │ O(1)      │ Max 2 rotations (AVL)   ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  GRAPH TRAVERSALS:                                                               │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ BFS                    │ O(V + E)   │ O(V)      │ Level-by-level          ││
│  │ DFS                    │ O(V + E)   │ O(V)      │ Depth-first             ││
│  │ Topological Sort       │ O(V + E)   │ O(V)      │ DAG only                ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  SHORTEST PATH:                                                                  │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ BFS (unweighted)       │ O(V + E)   │ O(V)      │ Best for unweighted     ││
│  │ Dijkstra (binary heap) │ O(E log V) │ O(V)      │ Non-negative weights    ││
│  │ Dijkstra (Fib heap)    │ O(E+V logV)│ O(V)      │ Rarely implemented      ││
│  │ Bellman-Ford           │ O(V × E)   │ O(V)      │ Handles negative        ││
│  │ SPFA                   │ O(V × E)   │ O(V)      │ Avg O(kE), k small     ││
│  │ Floyd-Warshall         │ O(V³)      │ O(V²)     │ All pairs              ││
│  │ Johnson                │ O(VE logV) │ O(V²)     │ All pairs, sparse      ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  MST:                                                                            │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Kruskal                │ O(E log E) │ O(V)      │ Sort + Union-Find       ││
│  │ Prim (binary heap)     │ O(E log V) │ O(V)      │ Dense: use matrix       ││
│  │ Prim (Fib heap)        │ O(E+V logV)│ O(V)      │ Better for dense        ││
│  │ Borůvka                │ O(E log V) │ O(V)      │ Parallelizable          ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  ADVANCED:                                                                       │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ SCC (Tarjan/Kosaraju)  │ O(V + E)   │ O(V)      │ Directed graphs         ││
│  │ Articulation Points    │ O(V + E)   │ O(V)      │ Cut vertices            ││
│  │ Bridges                │ O(V + E)   │ O(V)      │ Cut edges               ││
│  │ LCA (preprocessing)    │ O(n log n) │ O(n log n)│ Binary lifting          ││
│  │ LCA (query)            │ O(log n)   │ -         │ After preprocessing     ││
│  │ Euler Path             │ O(E)       │ O(V + E)  │ Hierholzer              ││
│  │ Hamiltonian Path       │ O(n² 2^n)  │ O(n 2^n)  │ DP + bitmask           ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## INTERVIEW PROBLEM PATTERNS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE WHICH ALGORITHM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  "Find shortest path..."                                                        │
│  • Unweighted → BFS                                                             │
│  • Positive weights → Dijkstra                                                  │
│  • Negative weights → Bellman-Ford                                              │
│  • All pairs → Floyd-Warshall (dense) or Johnson (sparse)                      │
│                                                                                  │
│  "Find connected components..."                                                 │
│  • Undirected → BFS/DFS or Union-Find                                          │
│  • Directed (SCC) → Tarjan or Kosaraju                                         │
│                                                                                  │
│  "Detect cycle..."                                                              │
│  • Undirected → DFS with parent tracking or Union-Find                         │
│  • Directed → DFS with colors (white/gray/black)                               │
│                                                                                  │
│  "Ordering with dependencies..."                                                │
│  • Topological Sort (Kahn's BFS or DFS postorder)                              │
│                                                                                  │
│  "Minimum cost to connect all..."                                              │
│  • MST: Kruskal or Prim                                                        │
│                                                                                  │
│  "Find LCA..."                                                                  │
│  • Single query → O(n) recursive                                               │
│  • Multiple queries → Binary lifting O(log n) per query                        │
│                                                                                  │
│  "Count paths..."                                                               │
│  • DAG → Topological sort + DP                                                 │
│  • General → DFS with memoization                                              │
│                                                                                  │
│  "Network flow / max matching..."                                              │
│  • Ford-Fulkerson / Edmonds-Karp / Dinic                                       │
│                                                                                  │
│  TREE-SPECIFIC:                                                                  │
│  • Validate BST → Inorder (should be sorted) or range checking                 │
│  • Serialize/Deserialize → Preorder + null markers                             │
│  • Tree DP → Postorder traversal                                               │
│  • Path problems → LCA + path sum                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_Trees and graphs are everywhere - master them and unlock many problems!_ 🌳
