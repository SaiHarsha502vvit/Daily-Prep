**Navigation**: [< Previous](02_DP_State_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_Array_String_Thinking.md)

# 🗺️ Graph & Tree Problem Thinking — Mental Model

**The key insight**: Most graph/tree problems are just asking "how do I explore this structure?" The answer is almost always BFS, DFS, or Union-Find. The skill is knowing WHICH one and WHY.

---

## Part 1: "Is This a Graph Problem?" — Recognition

### Many problems are HIDDEN graph problems:

```
Problem says:                          → Model as:
"Dependencies between tasks"           → Directed graph (topological sort)
"Can person A reach person B?"         → Undirected graph (BFS/DFS)
"Convert word A to word B"            → Graph where words are nodes
"2D grid with obstacles"              → Grid graph (4-directional)
"Network of computers"                → Undirected graph
"Course prerequisites"                → DAG (directed acyclic)
"Binary/N-ary tree"                   → Special case of graph (no cycles)
"Social network friends"              → Undirected graph
"State machine transitions"           → Directed graph
"Maze from start to end"             → Grid graph (BFS = shortest)
```

---

🔬 **Section Challenge — Part 1: "Is This a Graph Problem?" — Recognition**

**Challenge 1 (Reasoning):** You are building a system to resolve package dependencies for a package manager (like `npm install`). You need to install packages in an order such that no package is installed before its dependencies. What kind of graph is this, and what is the specific algorithm to solve it?

<details><summary>Answer</summary>

This is a **Directed Acyclic Graph (DAG)**. It must be directed because "A depends on B" is a one-way relationship. It must be acyclic because if A depends on B, and B depends on A, the system is deadlocked (circular dependency). The specific algorithm to resolve this is **Topological Sorting** (usually implemented via Kahn's Algorithm using indegrees, or DFS with a post-order stack).

</details>

## Part 2: BFS vs DFS — The Decision Framework

### When to use BFS (Queue):

```
✅ SHORTEST PATH (unweighted) — BFS guarantees level-by-level
✅ Level-order anything — "closest", "minimum steps"
✅ All nodes at distance K
✅ Multi-source flood fill — "from all 1s simultaneously"
✅ Tree level-order traversal

Mental model: BFS = "Ripple in a pond"
Drop a stone → it expands in CIRCLES → nearest first
```

### When to use DFS (Stack/Recursion):

```
✅ Path finding — "does any path exist?"
✅ Cycle detection — track visiting state
✅ Topological sort — "ordering with dependencies"
✅ Connected components — "how many islands?"
✅ Something about ALL paths / exhaustive search
✅ Tree problems — max depth, path sum, LCA

Mental model: DFS = "Exploring a maze"
Go as DEEP as possible → hit dead end → BACKTRACK → try next path
```

### When to use Dijkstra (Priority Queue):

```
✅ SHORTEST PATH (weighted, no negative edges)
✅ "Minimum cost" to reach a node

Mental model: Dijkstra = "Greedy BFS with costs"
Always expand the CHEAPEST unexplored node
```

### When to use Union-Find:

```
✅ "Are A and B connected?" (dynamic connectivity)
✅ "How many connected components?"
✅ "Adding edges, when do two components merge?"
✅ Cycle detection in undirected graph (if union returns false → cycle)

Mental model: Union-Find = "Clubs merging"
Each person belongs to a club → when two people connect, their clubs merge
```

### Decision Tree

```
Graph problem?
├── Need SHORTEST path?
│   ├── Unweighted? → BFS
│   ├── Weighted (no negative)? → Dijkstra
│   └── Negative edges? → Bellman-Ford
├── Need to visit ALL nodes/paths?
│   └── DFS (possibly with backtracking)
├── Need ordering with dependencies?
│   └── Topological Sort (Kahn's BFS or DFS)
├── Connected components?
│   ├── Static graph? → DFS/BFS
│   └── Dynamic (adding edges)? → Union-Find
├── Cycle detection?
│   ├── Undirected? → Union-Find or DFS
│   └── Directed? → DFS with 3-color marking
├── Minimum spanning tree?
│   └── Kruskal's (sort edges + Union-Find) or Prim's (PQ)
└── Tree problem?
    ├── Root-to-leaf? → DFS
    ├── Level-order? → BFS
    └── LCA? → DFS with parent tracking
```

---

## Part 3: Tree Thinking Specifically

### The Tree DFS Template (Memorize This)

```java
ReturnType solve(TreeNode node) {
    // 1. BASE CASE
    if (node == null) return baseValue;

    // 2. RECURSE on children
    ReturnType leftResult = solve(node.left);
    ReturnType rightResult = solve(node.right);

    // 3. PROCESS current node using children's results
    // → This is where the problem-specific logic goes

    // 4. RETURN answer for this subtree
    return combinedResult;
}
```

### Tree Problem Categories

```
Category 1: "RETURN something about the tree"
→ DFS that returns a value (height, sum, boolean)
→ Example: max depth = 1 + max(leftDepth, rightDepth)

Category 2: "UPDATE a global answer during traversal"
→ DFS with a class variable
→ Example: diameter = max(diameter, leftH + rightH) at each node

Category 3: "BUILD or TRANSFORM the tree"
→ DFS that returns new nodes
→ Example: invert tree = swap left and right, recurse both

Category 4: "FIND something in the tree"
→ DFS with early termination
→ Example: LCA = if both sides return non-null, current is LCA
```

### BST-Specific Thinking

```
BST = sorted structure → INORDER traversal gives sorted array

"Kth smallest?" → Inorder, count to k
"Validate BST?" → Every node has a valid range [min, max]
"Search?" → Go left if smaller, right if larger → O(log n)
"Insert?" → Find the right spot like binary search
"Delete?" → Three cases: leaf, one child, two children (find successor)
```

---

## Part 4: Grid/Matrix as Graph — Mental Model

### The Grid-to-Graph Translation

```
Grid:                    Graph:
[1, 0, 1]              node(0,0) connects to node(0,1), node(1,0)
[1, 1, 0]              node(0,1) connects to node(0,0), node(1,1)
[0, 1, 0]              ... (4-directional neighbors)

Cell = Node
Adjacent cell = Edge
Obstacle = No edge
```

### Grid BFS/DFS Boilerplate

```java
int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};  // Right, Left, Down, Up

// Check bounds:
boolean inBounds(int r, int c, int m, int n) {
    return r >= 0 && r < m && c >= 0 && c < n;
}

// Mark visited:
grid[r][c] = '#';  // In-place (mutate grid) → no extra visited array
// OR
boolean[][] visited;  // When you can't mutate the grid
```

### Grid Problem Categories

```
"How many islands?" → Count DFS/BFS starts on unvisited land
"Shortest path to exit?" → BFS from start
"Distance from all 1s?" → MULTI-SOURCE BFS (enqueue ALL 1s first)
"Can we escape?" → DFS/BFS to check connectivity
"Surrounded regions?" → DFS from BORDERS first, then fill rest
"Rotting oranges?" → Multi-source BFS with time tracking
```

---

🔬 **Section Challenge — Part 4: Grid/Matrix as Graph — Mental Model**

**Challenge 1 (Trace):** In the "Rotting Oranges" problem, a grid has fresh oranges (1), rotten oranges (2), and empty cells (0). Every minute, any fresh orange adjacent (4-directionally) to a rotten orange becomes rotten. You decide to use DFS starting from the first rotten orange you find. Why will DFS fail to give the minimum minutes required, and what is the correct approach?

<details><summary>Answer</summary>

DFS goes as deep as possible along one path. It might trace a winding path of 10 fresh oranges and mark them as rotting in 10 minutes. However, a different rotten orange might have been right next to the 10th orange and could have rotted it in 1 minute. DFS loses the "time" (level) synchrony. The correct approach is **Multi-Source BFS**. You find ALL initially rotten oranges, put them all in a Queue at time T=0, and then process them level-by-level (minute-by-minute). BFS guarantees the shortest path (minimum time) in unweighted graphs.

</details>

## Part 5: Common Graph Patterns & When They Appear

### Topological Sort — "What order to take courses?"

```
When: Directed graph, need valid ordering where A comes before B
How: Kahn's algorithm (BFS with indegree counting)
     OR DFS with post-order reversal

Mental model: "Peel off nodes with no dependencies first"
```

### Bipartite Check — "Can we 2-color?"

```
When: "Divide into two groups with no conflicts"
How: BFS/DFS with 2-coloring (alternate colors)
If conflict found → not bipartite

Mental model: "Color neighbors with opposite color. Contradiction = not bipartite."
```

### Tarjan's / Bridges — "What if this edge is removed?"

```
When: "Critical connections", "bridges", "articulation points"
How: DFS with discovery time and low-link values
If low[child] > disc[parent] → bridge edge

Mental model: "Can child reach higher than parent without this edge?"
```

---

🔬 **Section Challenge — Part 5: Common Graph Patterns & When They Appear**

**Challenge 1 (Design):** You are given a social network of users and a list of `dislikes(A, B)`. You want to divide the users into exactly two groups such that nobody in the same group dislikes each other. Which graph algorithm determines if this is possible?

<details><summary>Answer</summary>

This is exactly the **Bipartite Graph (2-Coloring)** problem. The graph's nodes are the users, and the edges are the dislikes. You want to color the graph using exactly 2 colors (the two groups) such that no two adjacent nodes (people who dislike each other) share the same color. You solve this with BFS or DFS: start coloring a node Red, all its neighbors Blue, all their neighbors Red. If you ever find a neighbor that has already been colored the _same_ color as the current node, the graph is not bipartite, and the division is impossible.

</details>

## Part 6: Graph/Tree Debugging Checklist

```
□ Am I tracking visited correctly? (Avoid infinite loops!)
□ BFS: Am I marking visited WHEN ENQUEUING, not when dequeuing?
   → Wrong: mark when poll → may enqueue duplicates
   → Right: mark when offer → each node enqueued once
□ DFS: Am I using 3 states for cycle detection? (0=white, 1=gray, 2=black)
□ Am I handling disconnected components? (Run BFS/DFS from ALL unvisited)
□ Grid: Am I checking bounds BEFORE accessing array?
□ Tree: Am I handling null nodes in base case?
□ Weighted graph: Am I using PQ correctly? (skip outdated entries in Dijkstra)
```

---

## NEW DIAGRAM — BFS vs DFS Decision Tree (Side-by-Side)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: BFS vs DFS Decision Tree — Which to Use and Why                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ① Is the input a TREE or a GRAPH?                                          │
│     │                                                                        │
│     ├── TREE (binary/N-ary, no cycles)                                      │
│     │   ├── Need LEVEL-ORDER (逐层遍历) → BFS (queue)                       │
│     │   │   Example: "Print level by level", "minimum depth"               │
│     │   │                                                                    │
│     │   └── Need ROOT-to-LEAF or subtree → DFS (recursion/stack)            │
│     │       Example: "Max depth", "Path sum", "LCA"                        │
│     │                                                                        │
│     └── GRAPH (may have cycles)                                             │
│         │                                                                    │
│         ▼                                                                    │
│         ② What property are you measuring?                                  │
│         │                                                                    │
│         ├── SHORTEST PATH (unweighted)                                      │
│         │   └── BFS (guaranteed shortest in edge-count)                     │
│         │       Example: "Min moves to escape maze", "Word ladder"         │
│         │                                                                    │
│         ├── All paths / Exhaustive / Exists?                                │
│         │   └── DFS (explore one path fully before backtracking)            │
│         │       Example: "Does path exist?", "All combinations"            │
│         │                                                                    │
│         ├── CONNECTED COMPONENTS                                            │
│         │   ├── Static graph -> DFS/BFS from each unvisited node           │
│         │   └── Dynamic (adding edges) -> Union-Find (DSU)                 │
│         │                                                                    │
│         ├── CYCLE DETECTION                                                 │
│         │   ├── Undirected -> Union-Find or DFS with visited set           │
│         │   └── Directed    -> DFS with 3-color (WHITE/GRAY/BLACK)        │
│         │                                                                    │
│         ├── TOPOLOGICAL ORDER (dependencies)                                │
│         │   └── BFS (Kahn's indegree) OR DFS (post-order reverse)          │
│         │       Example: "Course schedule", "Build order"                  │
│         │                                                                    │
│         └── SHORTEST PATH (weighted, non-negative)                          │
│             └── Dijkstra (greedy + priority queue)                          │
│                 Example: "Min cost to reach city", "Network delay"         │
│                                                                              │
│  BFS MENTAL MODEL: "Ripple in a pond"                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Start: node(0,0)                                                     │    │
│  │    Queue: [start]                                                     │    │
│  │    Pop start, push all neighbors (level 1)                            │    │
│  │    Pop level-1 nodes, push their neighbors (level 2)                  │    │
│  │    ...                                                                │    │
│  │    First time you SEE a node = shortest path found!                   │    │
│  │    Time: O(V+E)   Space: O(V) for queue + visited                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  DFS MENTAL MODEL: "Explore a maze, backtrack on dead end"                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Start: push start on stack                                           │    │
│  │    Pop top, mark visited, push all unvisited neighbors                │    │
│  │    Repeat until stack empty (or goal found)                           │    │
│  │    If dead end -> pop and backtrack automatically                     │    │
│  │    Time: O(V+E)   Space: O(V) for stack + visited                     │    │
│  │    NOTE: DFS does NOT guarantee shortest path in unweighted graph!    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ⚠️  COMMON MISTAKE: Use DFS when BFS is needed (shortest path)             │
│     DFS finds A path, not the SHORTEST path in unweighted graphs.           │
│     Always use BFS for "minimum hops", "minimum steps", "shortest path".   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1736 | Euler | Königsberg bridges problem — founding graph theory |
| 1959 | Dijkstra | Shortest path algorithm with non-negative weights |
| 1972 | Tarjan | DFS + strongly connected components + lowlink |
| 1973 | Hopcroft-Karp | Bipartite matching in O(E√V) |
| 1974 | Hopcroft-Tarjan | Planarity testing algorithm |

**Evolution narrative**: Graph theory as a mathematical discipline was founded in 1736 when Euler proved that traversing all seven bridges of Königsberg exactly once was impossible — establishing that the topology of connections matters more than the geometry. Dijkstra's 1959 shortest-path algorithm extended graph traversal to weighted graphs with non-negative edges, establishing the BFS-vs-DFS decision framework still used today. Robert Tarjan's 1972 work on depth-first search and strongly connected components (with his lowlink algorithm for bridges) provided the foundational graph-analysis toolkit that underlies cycle detection, topological sort, and articulation-point finding. Hopcroft and Karp's 1973 algorithm for maximum bipartite matching reduced a seemingly complex problem to repeated BFS/DFS, demonstrating how graph traversal solves combinatorial optimization. The 1974 Hopcroft-Tarjan planarity testing algorithm concluded the era of establishing graph theory's algorithmic foundations.

**Modern practice anchor**: Today's graph/DP problem-solving (LeetCode's graph section, competitive programming) directly uses Tarjan's SCC algorithm for cycle detection in directed graphs and Hopcroft-Karp for bipartite matching problems, while Dijkstra remains the default for any weighted shortest-path problem.

---

---

🔬 **Section Challenge — Part 6: Graph/Tree Debugging Checklist**

**Challenge 1 (Debug):** A junior developer writes a BFS to find the shortest path in a maze. Their code gets a `Memory Limit Exceeded` or `OutOfMemoryError`. Their visited logic is: `if (!visited[neighbor]) { queue.add(neighbor); }` and they mark `visited[curr] = true` _after_ popping `curr` from the queue. Why did memory explode?

<details><summary>Answer</summary>

They marked nodes as visited when DEQUEUING instead of ENQUEUING. Because of this, if a node is reachable via multiple paths of the same length, it gets added to the queue multiple times before it is finally popped and marked visited. In a dense graph or empty grid, this causes the queue size to explode exponentially as the same nodes are duplicated hundreds of times in the queue. **Fix**: ALWAYS mark a node as visited the exact moment you _enqueue_ it.

</details>

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: BFS Memory Blowup at Depth > 100 on Social Graphs

**What goes wrong**: BFS explores all nodes at distance d before distance d+1. At depth 6 (the "degrees of separation" for Facebook), BFS must hold millions of nodes in the frontier queue. For Facebook's social graph (2.9 billion users, ~1000 friends per user), a breadth-2 BFS frontier is 1 million nodes; breadth-3 is 1 billion. Memory explodes before the search completes.

**Cost**: OOM kill of the graph-processing job. If this is a "people you may know" or "friend recommendation" service, the feature is unavailable. SLA breach for the recommendation service.

**Debug workflow**:
1. Add frontier size monitoring: `log.info("BFS frontier size: {}", frontier.size()); alert at > 1_000_000 nodes.`
2. Use bidirectional BFS: start from both source and target. Each side explores ~sqrt(N) nodes instead of N, reducing memory by sqrt(factor).
3. Implement BFS with explicit max-depth cutoff: `if (depth > MAX_DEPTH) return;` — prevents runaway traversal.

### Failure Mode 2: DFS Recursion Limit Hit on Deep Trees (C++/Python)

**What goes wrong**: DFS via recursion hits the stack limit on trees deeper than ~1000 (Python) or ~10,000 (C++ with default stack). A file system tree, org chart, or XML DOM tree with depth > 1000 (e.g., deeply nested `<div>` structures from a badly-designed HTML generator) causes `RecursionError` in Python or `std::bad_alloc` in C++.

**Cost**: Service crashes on requests that trigger deep traversal (e.g., rendering a page with deeply nested HTML, listing a deeply nested folder structure).

**Debug workflow**:
1. Use iterative DFS with explicit stack: `while (stack): node = stack.pop(); process(node); for child in node.children: stack.append(child)` — no recursion limit.
2. Set `sys.setrecursionlimit(10000)` as a safety catch (Python), but prefer iterative to avoid the problem entirely.
3. Profile with `py-spy record --duration 30 --pid <pid>` and filter for `RecursionError` or deep stack frames.

### Failure Mode 3: Adjacency-List vs Adjacency-Matrix Memory Cliff at Scale

**What goes wrong**: Using adjacency matrix for a graph with 1 million nodes requires 10^12 bits (125GB) — impossible. Choosing the wrong representation causes memory exhaustion before the algorithm even runs.

**Cost**: OOM kill at job start, before any meaningful work begins. Wasted compute and engineering time debugging why the "simple" graph algorithm crashes.

**Debug workflow**:
1. Calculate memory requirement upfront: `adj_matrix_bits = n * n; adj_list_bytes = edges * 16;` Use adjacency list for sparse graphs (edges << n^2).
2. Use graph libraries with automatic format selection: NetworkX `Graph()` (adjacency list) vs `Nx` (matrix); Apache Giraph uses adjacency-list by default.
3. Benchmark both representations: `timeit('bfs(adj_list)', number=1000)` vs `timeit('bfs(adj_matrix)', number=1000)` at 10% sample scale.

### Modern Production Tools

- **Apache Giraph / Pregel (Google)**: Vertex-centric graph processing using adjacency-list representation, designed for trillion-edge graphs (Facebook-scale). Handles memory automatically via sharding and iteration.
- **Bidirectional BFS libraries**: `networkx.bfs_beam_edges()` (bidirectional helper) reduces frontier memory by sqrt(N) factor.
- **C++ `absl::flat_hash_map` + vector**: Production-grade graph representation using flat hash maps for O(1) neighbor lookup with cache-friendly memory layout.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Graphs capture **relationships between entities**; traversal order determines the algorithm class. The fundamental invariant is that a graph is just a set of nodes and edges — and the choice of traversal (BFS, DFS, Dijkstra) determines which properties you can extract from those relationships. BFS explores in increasing distance from the source (layers), guaranteeing shortest path in unweighted graphs. DFS explores depth-first, building complete paths before retreating, which makes it natural for cycle detection, topological order, and exhaustive search. The internal mechanism is the **queue (BFS) vs stack (DFS)** data structure — this simple difference produces entirely different exploration orders and algorithmic properties. Understanding that "queue = BFS = layers = shortest path" and "stack = DFS = deep first = paths/topological" is the key insight that unlocks all graph problem types.

### Variants Comparison

| Variant | Data Structure | Memory | Shortest Path | When to Use |
| --- | --- | --- | --- | --- |
| BFS | Queue (FIFO) | O(width) frontier | Yes, unweighted | Shortest path, levels, multi-source flood fill |
| DFS (recursive) | Call stack | O(depth) | No | Path existence, cycle detection, topological sort |
| DFS (iterative) | Explicit stack | O(depth) heap | No | Deep graphs, avoid stack overflow |
| Dijkstra | Priority queue | O(E log V) | Yes, weighted, non-negative | Weighted shortest path |
| Bellman-Ford | No queue | O(VE) | Yes, any weights | Negative weight edges |
| Union-Find | Disjoint sets | O(alpha(n)) | N/A | Connectivity, cycle in undirected |

### Decision Table

| Problem Goal | Default Traversal | When to Switch |
| --- | --- | --- |
| Shortest path, unweighted | BFS | Weighted edges → Dijkstra; negative → Bellman-Ford |
| Path exists | DFS | Shortest path needed → BFS |
| Cycle detection (directed) | DFS with visiting/visited states | Undirected → Union-Find |
| Topological order | DFS post-order or Kahn's BFS | Dynamic connectivity → Union-Find |
| Connected components | DFS/BFS from each unvisited | Very large graph → Union-Find |
| All pairs shortest path | Floyd-Warshall (DP on nodes) | Sparse graph → repeated Dijkstra |

### Implementation Variants

| Representation | Space | Neighbor Lookup | When to Use |
| --- | --- | --- | --- |
| Adjacency list (vector of vectors) | O(V + E) | O(degree) | Sparse graphs (E << V^2) |
| Adjacency matrix | O(V^2) | O(1) | Dense graphs, dense operations |
| HashMap of HashMaps | O(E) | O(1) avg | Dynamic edge addition |
| Edge list + sort | O(E log E) | O(E) scan | Kruskal/Prim MST algorithms |


---

## Reality Check

**"Graph thinking activates when the problem says graph"** ? Graph thinking is a MODELING CHOICE you impose: states with transitions (word ladder, lock combinations), items with constraints (course prerequisites, build orders), entities with similarity (accounts sharing emails) � all become graphs the moment you declare nodes and edges. The mental model is the declaration ritual: NODES are (what?), EDGES exist when (what?), and the question becomes (reachability? distance? ordering? components?). Problems rarely say graph; solvers say it.

**"Trees are simple graphs"** ? Trees are graphs with three superpowers worth consciously exploiting: unique paths (no visited-set needed, parent-exclusion suffices), recursive decomposition (every subtree is a full subproblem � the basis of all tree DP), and n-1 edges (any two of connected/acyclic/n-1-edges imply the third � a free validity test). Thinking of trees as merely simple graphs wastes the superpowers; half of tree-problem elegance is one of these three doing hidden work.

**"BFS explores wide, DFS explores deep � that is the whole model"** ? The operational model is what each GUARANTEES: BFS layers certify minimum edge-distance (first arrival is shortest � unweighted only), DFS finishing order certifies dependency completion (reverse postorder IS topological sort), and DFS tree-edges versus back-edges classify structure (back edge equals cycle). Choosing by guarantee � need distances? layers. need ordering? finish times. need structure? edge classification � replaces the wide/deep slogan with the actual decision procedure.

**"Connectivity intuition transfers directly to directed graphs"** ? Direction breaks the symmetric intuition in specific, trap-laden ways: reachability is one-way (A reaches B says nothing about B reaching A), undirected components become three distinct notions (weak, strong, and neither), cycle detection needs the gray-node protocol instead of parent-exclusion, and "connected" questions must be RESTATED (mutual reachability? one-way coverage?). The mental habit: on hearing directed, re-ask every connectivity question explicitly � the wrong-model bugs here pass compilers and reviews.

**"Visualizing the graph means drawing all of it"** ? Working graph thinkers visualize LOCAL structure plus global invariants � this node, its neighbors, and what property the traversal maintains (frontier distance, visited region growing monotonically, stack contents mirroring the current path) � because real graphs are too large to draw and the drawing adds nothing the invariant does not. Drawing five nodes to fix the local rule, then trusting induction, is the graph version of recursion's leap of faith � and the same people who trace recursion also try to draw the whole graph.
