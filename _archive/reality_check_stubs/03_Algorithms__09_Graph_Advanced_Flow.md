

---

## Reality Check

**"Max flow is only for network bandwidth problems"** → Max flow solves: bipartite matching (model as flow — left nodes to right nodes, edges with capacity 1), project scheduling with resource constraints, baseball elimination (can team X still win?), image segmentation (min-cut through pixel similarity graph), network reliability (maximum number of edge-disjoint paths = max flow), assignment problems. The "flow network" model is a surprisingly general framework for combinatorial optimization.

**"Edmonds-Karp is always fast enough"** → Edmonds-Karp (BFS-based Ford-Fulkerson) is O(VE²). For competition problems with small graphs it's fine. For dense graphs (E ≈ V²) it becomes O(V⁵). Dinic's algorithm is O(V²E) — uses blocking flows in layered graphs. In practice Dinic's is much faster (often O(E√V) for unit-capacity graphs — crucial for bipartite matching). For unit-capacity bipartite matching, Hopcroft-Karp gives O(E√V). Algorithm choice matters enormously for large flow problems.

**"The max-flow min-cut theorem is just a theoretical curiosity"** → The max-flow equals the min-cut theorem (Menger's theorem) has direct applications: network reliability (min number of edges to remove to disconnect source from sink = min cut = max flow), multi-commodity flow feasibility, LP duality (the flow problem and its dual cut problem are LP duals). The max-flow min-cut theorem lets you answer "what is the bottleneck?" by finding the minimum capacity cut separating source from sink.

**"Flow algorithms always work on directed graphs"** → Most formulations use directed graphs. For undirected edges, model each undirected edge {u,v} as two directed edges: (u→v, capacity c) and (v→u, capacity c) in the residual graph. But: undirected edges with the same endpoint in both directions share capacity — a flow of f on (u→v) reduces capacity in both directions. This requires careful residual graph modeling. Many introductions skip this subtlety.

**"Minimum cost max flow is just max flow with weights"** → Min cost max flow (MCMF) finds the maximum flow with the minimum total cost (sum of flow × edge cost). This requires augmenting along shortest paths by cost — Bellman-Ford or SPFA instead of BFS. Applications: transportation optimization (minimum cost shipping), assignment problems with costs (Hungarian algorithm is a special case of MCMF), job scheduling with cost functions. MCMF is significantly harder to implement correctly than plain max flow.
