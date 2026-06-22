# Chapter 11 — Graph Theory Foundations

> [< Previous: 10 Recurrence Relations](10_Recurrence_Relations.md) | [Course Index](README.md) | [Next → 12 Boolean Algebra & Circuits](12_Boolean_Algebra_Circuits.md)

---

## The Problem Graphs Solve

You're building a route planner. Cities are locations. Roads connect them. You need to:
- Find the shortest path from city A to city B.
- Check if a city is reachable at all (maybe roads were closed).
- Detect circular dependencies (if road A feeds B, B feeds C, C feeds A — a roundabout loop).
- Find the minimum set of roads that still keeps all cities connected.

Every one of these questions requires the same abstraction: **a graph**. Not the chart kind — the mathematical structure of **vertices connected by edges**.

Graphs model:
- **Cities + roads:** vertices = cities, edges = roads
- **Web pages + hyperlinks:** vertices = pages, directed edges = links
- **Packages + dependencies:** vertices = packages, directed edges = "A requires B"
- **People + friendships:** vertices = people, undirected edges = friendships
- **Git commits + parent pointers:** vertices = commits, directed edges = parent
- **State machine states + transitions:** vertices = states, directed edges = transitions

The same algorithm — BFS, DFS, Dijkstra, topological sort — works on ANY of these, because they're all graphs underneath.

---

## Definitions: Vertices and Edges

A **graph** G = (V, E) consists of:
- **V:** a set of **vertices** (also called nodes)
- **E:** a set of **edges** — connections between pairs of vertices

### Undirected Graph

Edges have no direction: {u, v} ∈ E means u connects to v AND v connects to u.

**Analogy:** Undirected = two-way street. If you can drive A→B, you can drive B→A.

```
V = {A, B, C, D}
E = {{A,B}, {B,C}, {C,D}, {A,D}}

A ── B
│   │
D ── C
```

### Directed Graph (Digraph)

Edges have direction: (u, v) ∈ E means there's a one-way connection u → v. (v, u) is a separate edge.

**Analogy:** Directed = one-way street. A Twitter "follows" is directed — you can follow someone who doesn't follow you back.

```
V = {A, B, C}
E = {(A,B), (B,C), (C,A)}   — a directed cycle

A → B → C → A
```

### Weighted Graph

Each edge has a numeric weight: w(u,v) = cost, distance, time, capacity.

Shortest-path algorithms (Dijkstra, Bellman-Ford) operate on weighted graphs.

---

## Degree: How Many Connections?

**In an undirected graph:**  
The **degree** of vertex v = number of edges incident to v.

**Handshaking Lemma:** The sum of all degrees = 2|E|.

**Why?** Each edge contributes 1 to each of its two endpoints → each edge counted twice.

**Corollary:** The number of odd-degree vertices is always even. (You can never have an odd number of people who've shaken hands an odd number of times total — the parity must balance.)

**In a directed graph:**
- **In-degree** of v: number of edges pointing INTO v
- **Out-degree** of v: number of edges pointing OUT OF v

A vertex with in-degree 0 is a **source** (no incoming edges — e.g., a root in a dependency tree).  
A vertex with out-degree 0 is a **sink** (no outgoing edges — e.g., a leaf).

**Sum of all in-degrees = Sum of all out-degrees = |E|** (each directed edge contributes 1 to one out-degree and 1 to one in-degree).

---

## Paths, Walks, and Cycles

| Term | Definition | Repeated elements? |
|------|------------|-------------------|
| **Walk** | A sequence of vertices v₀, v₁, ..., vₖ where each consecutive pair is connected by an edge | Vertices AND edges can repeat |
| **Trail** | A walk where no edge is repeated | Edges unique, vertices can repeat |
| **Path** | A walk where no vertex is repeated | Vertices (and edges) all unique |
| **Cycle** | A closed path: v₀ = vₖ, no other repetitions | Starts and ends at same vertex |

**Why the distinction matters:**
- **Path:** used in shortest-path problems (revisiting a vertex would be inefficient).
- **Trail:** used in Eulerian path problems (traverse every EDGE exactly once — the Königsberg bridge problem).
- **Cycle:** fundamental for detecting loops (circular dependencies, deadlock detection).

```
Graph: A—B—C—D—A (a square)

Walk A→B→C→B→A: valid walk (vertex B repeated)
Trail A→B→C→D→A: valid trail (every edge used once, no edge repeated)
Path A→B→C→D: valid path (no vertex repeated)
Cycle A→B→C→D→A: valid cycle (closed, no intermediate repetition)
```

**Length of a path/walk:** Number of edges traversed.

---

## Connectivity

### Undirected Graphs

A graph is **connected** if there is a path between every pair of vertices.

A **connected component** is a maximal connected subgraph. An undirected graph with k connected components cannot have paths between components.

```
Disconnected graph:
  {A—B—C}  {D—E}   — two components

After adding edge C—D:
  {A—B—C—D—E}  — one component (now connected)
```

### Directed Graphs

**Weakly connected:** the underlying undirected graph (ignore directions) is connected.  
**Strongly connected:** there is a directed path from every vertex to every other vertex.

**Strongly connected component (SCC):** a maximal set of vertices where every vertex is reachable from every other via directed paths.

```
Directed graph:
  A → B → C
  ↑       ↓
  D ←─────┘

SCC 1: {A, B, C, D} — every vertex can reach every other ✓

Now add isolated vertex E (no edges):
SCC 1: {A, B, C, D}
SCC 2: {E}
```

**Kosaraju's and Tarjan's algorithms** find SCCs in O(V + E). Used in:
- Detecting circular dependencies in package managers
- Identifying mutually dependent modules (should they be merged?)
- Compiler dead code elimination (unreachable SCCs)

---

## Special Graph Types

### Trees

A **tree** is a connected undirected graph with no cycles.

Equivalently: a connected graph on V vertices with exactly V-1 edges.

**Key property:** there is exactly ONE path between any two vertices.

**Why trees are everywhere:**
- File systems: directories form a tree
- Org charts: hierarchical management structure
- HTML DOM: nested elements form a tree
- Binary search trees, heaps, tries: all trees with extra structure

A **rooted tree** designates one vertex as the root; edges are implicitly directed away from the root.

A **spanning tree** of a connected graph G is a subgraph that includes all vertices and is a tree (minimum edges to keep connectivity).

### Complete Graph

K_n: every pair of vertices is connected by an edge.

|E| = C(n, 2) = n(n-1)/2.

K₅ (5 vertices): 10 edges. Every vertex connects to all 4 others.

### Bipartite Graph

Vertices can be split into two disjoint sets L and R such that all edges go between L and R (no edge within L or within R).

**Test:** A graph is bipartite iff it contains no odd-length cycle.

**Applications:** Matching problems (job candidates to positions), recommendation systems (users to items).

### DAG: Directed Acyclic Graph

A directed graph with no directed cycles.

**Applications:**
- Dependency graphs (if A depends on B, there's a directed edge A→B, and no cycle means no circular dependency)
- Git commit history (commits point to parents, no way to be your own ancestor)
- Task scheduling (topological sort gives a valid execution order)
- Build systems (Makefile, Gradle, Bazel dependencies)

---

## Graph Representations

### Adjacency Matrix

An n×n matrix where M[i][j] = 1 if edge (i,j) exists, 0 otherwise.

```
Graph: A—B—C, A—C

  A B C
A 0 1 1
B 1 0 1
C 1 1 0

Space: O(V²)
Check if edge (u,v) exists: O(1)
List all neighbors of v: O(V) — scan an entire row
```

**Good when:** graph is dense (many edges), need fast edge-existence checks.

### Adjacency List

Each vertex stores a list of its neighbors.

```java
Map<String, List<String>> graph = new HashMap<>();
graph.put("A", List.of("B", "C"));
graph.put("B", List.of("A", "C"));
graph.put("C", List.of("A", "B"));

Space: O(V + E)
Check if edge (u,v) exists: O(degree(u))
List all neighbors of v: O(degree(v))
```

**Good when:** graph is sparse (few edges relative to V²), need to iterate over neighbors.

**Rule of thumb:** adjacency list for most real-world graphs (social networks, web graphs, road maps — all sparse). Adjacency matrix for dense graphs or when O(1) edge-existence checks are critical.

---

## Euler Paths and the Königsberg Bridge Problem

In 1736, Euler asked: can you walk through Königsberg crossing each of its 7 bridges exactly once? (Seven bridges connected 4 landmasses — a multigraph.)

**Euler's answer:** A connected undirected graph has an **Eulerian path** (visiting every edge exactly once) iff it has exactly 0 or 2 vertices of odd degree.

- 0 odd-degree vertices: an **Eulerian circuit** exists (closed path using every edge).
- 2 odd-degree vertices: an **Eulerian path** exists (open path, start at one odd-degree vertex, end at the other).
- Any other number of odd-degree vertices: no Eulerian path.

**Königsberg had all 4 vertices of odd degree → no solution.** This is the birth of graph theory.

**Modern application:** Single-stroke drawing problems, circuit board routing (route every wire segment once without lifting the pen), garbage collection routes.

---

## Graph Coloring

**Coloring:** assign a color to each vertex such that no two adjacent vertices share a color.

**Chromatic number χ(G):** the minimum number of colors needed.

**Key results:**
- χ(G) = 1 iff G has no edges.
- χ(G) = 2 iff G is bipartite and non-empty.
- Planar graphs: χ(G) ≤ 4 (Four Color Theorem, 1976 — first major theorem proved by computer).
- Trees: χ = 2 (bipartite — two-color by depth).

**Applications:** Register allocation in compilers (variables are vertices, edges connect variables live at the same time; colors are registers; minimizing χ minimizes registers needed). Scheduling (vertices = tasks, edges = conflicts; χ = minimum number of time slots).

---

## Section Challenge

> ### Dependency Graph Analysis
>
> Your project has packages with the following dependencies (A requires B means A→B):
>
> ```
> A requires: B, C
> B requires: D
> C requires: D, E
> D requires: (nothing)
> E requires: (nothing)
> F requires: A, G
> G requires: F
> ```
>
> **Question 1:** Draw the dependency graph. What are the vertices and edges?
>
> **Question 2:** Is this graph a DAG? If not, identify all cycles.
>
> **Question 3:** Which packages are in the same Strongly Connected Component (SCC)?
>
> **Question 4:** If you need to build these packages in a valid order (dependencies before dependents), which packages can you build in the first round, second round, and so on? (Topological order)
>
> **Question 5:** If you remove the F→G and G→F dependency cycle by merging F and G into a single package "FG", what is the new valid build order?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Graph structure

Vertices: {A, B, C, D, E, F, G}
Directed edges (requires = depends on → points to):
  A→B, A→C
  B→D
  C→D, C→E
  F→A, F→G
  G→F

Drawn:
  F ⇌ G    (bidirectional — a cycle)
  ↓
  A
 / \
B   C
|  / \
D    E

D and E are sinks (no outgoing edges).
F and G form a cycle.

──────────────────────────────────────────────────────────

QUESTION 2: Is this a DAG?

NO. F→G and G→F form a directed cycle: F→G→F.
A DAG has NO directed cycles. This graph is not a DAG.

──────────────────────────────────────────────────────────

QUESTION 3: Strongly Connected Components

An SCC is a maximal set where every vertex is reachable from every other.

{F, G}: F→G and G→F, so both can reach each other. Maximal: {F,G}. ✓
{A}: A→B and A→C, but no path back to A from B or C. {A} alone.
{B}: no outgoing path back to B. {B} alone.
{C}: no outgoing path back to C. {C} alone.
{D}: no outgoing edges. {D} alone.
{E}: no outgoing edges. {E} alone.

SCCs: {F,G}, {A}, {B}, {C}, {D}, {E}

The SCC {F,G} indicates a circular dependency — F and G are mutually dependent.
This is a red flag in package managers: they either refuse to build, or treat the
cycle as a single unit.

──────────────────────────────────────────────────────────

QUESTION 4: Topological order with the cycle

PROBLEM: a topological order only exists for DAGs. The cycle {F,G} prevents a
valid topological sort for the FULL graph.

For the acyclic portion {A, B, C, D, E}: 
  Sinks (no outgoing edges): D, E — these build first.
  After D and E: B can build (its dependency D is done), C can build.
  After B and C: A can build (both B and C done).

Valid build order for {A, B, C, D, E}: D, E, B, C, A (or any valid topological sort)

For F and G: cannot determine order due to cycle. Build system would error here.

──────────────────────────────────────────────────────────

QUESTION 5: Merged package FG (F and G combined)

New graph:
  Vertices: {A, B, C, D, E, FG}
  Edges: FG→A (was F→A, G→F removed since G and F are now the same)
  
  (F→G and G→F are now internal to FG — removed from the graph)

This is now a DAG: FG→A→{B,C}→D→(nothing) and →E.

Topological build order (layer by layer):
  Round 1: D, E   (no dependencies)
  Round 2: B, C   (depend only on D; C depends on D and E)
  
  Wait: C depends on D and E.
  D done after Round 1? Yes. E done after Round 1? Yes. → C can build in Round 2.
  B depends only on D → B can also build in Round 2.
  
  Round 1: {D, E}           (sinks — no dependencies)
  Round 2: {B, C}           (dependencies all done)
  Round 3: {A}              (depends on B, C — both done)
  Round 4: {FG}             (depends on A — done)

Build order: D, E → B, C → A → FG

LESSON: Cycles in dependency graphs (circular dependencies) are always problematic.
  - npm/pip will sometimes refuse to install circular deps.
  - Maven will warn but proceed with special handling.
  - The mathematical fix is always to either merge the cycle (treat as single unit)
    or break it by removing one dependency edge.

REAL ENGINEERING NOTE:
  The SCC condensation of a dependency graph (collapse each SCC to a single node)
  always produces a DAG. This is how build systems handle cycles: they identify SCCs,
  treat each as an atomic unit, and topologically sort the condensed DAG.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing path and walk**
- A path requires no repeated vertices. If you say "there's a path from A to B" and your "path" visits A twice, it's a walk, not a path. BFS finds shortest paths (no repeated vertices). If you allow repeated vertices, you're finding shortest walks, which may be infinite in cyclic graphs.

**Mistake 2: Thinking "connected" and "strongly connected" are the same**
- For undirected graphs, "connected" is the standard term.
- For directed graphs, "connected" is ambiguous — always specify "weakly" or "strongly."

**Mistake 3: Forgetting that trees have exactly V-1 edges**
- A connected graph with V vertices and fewer than V-1 edges is impossible.
- A connected graph with exactly V-1 edges is a tree.
- A connected graph with more than V-1 edges has at least one cycle.

**Mistake 4: Assuming adjacency matrix is more "efficient" because O(1) lookup**
- O(1) edge lookup costs O(V²) space. For a graph with 10 million vertices and 50 million edges (sparse!), an adjacency matrix would need 10¹⁴ entries — impossibly large. Adjacency list: 60 million entries.

**Mistake 5: Topological sort on cyclic graphs**
- Topological sort only works on DAGs. If you run Kahn's algorithm (BFS-based) on a cyclic graph, some vertices never get added to the result — detecting the cycle automatically.

---

## Connections

- **Chapter 06 — Relations:** A graph IS a relation. A directed graph corresponds to a binary relation R on V; an undirected graph corresponds to a symmetric relation. Graph properties (reflexive = self-loops on all vertices, transitive = transitive closure has direct edges for all paths) are just relation properties.
- **Chapter 07 — Functions:** Graph coloring is a function f : V → Colors such that f(u) ≠ f(v) for all edges (u,v). Finding the optimal coloring = finding a special function with the minimum codomain size.
- **Chapter 10 — Recurrences:** BFS visits V vertices and E edges → T(V, E) = O(V + E). DFS on trees: T(n) = T(left subtree) + T(right subtree) + O(1) → by Master Theorem (for balanced trees) → O(n).
- `03_Algorithms/05c_Graphs_Fundamentals.md` — BFS, DFS, Dijkstra, Bellman-Ford, topological sort, MST (Prim's, Kruskal's) are all algorithms on the structures defined in this chapter.
- `08_SQL/` — Query plan graphs are DAGs: each operator is a vertex, data flow is a directed edge. Understanding DAG properties explains why the optimizer can reorder operators and why cycles in a query would be pathological.

---

> [< Previous: 10 Recurrence Relations](10_Recurrence_Relations.md) | [Course Index](README.md) | [Next → 12 Boolean Algebra & Circuits](12_Boolean_Algebra_Circuits.md)
