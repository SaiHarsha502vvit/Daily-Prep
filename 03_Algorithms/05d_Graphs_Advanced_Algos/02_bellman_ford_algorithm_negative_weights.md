# Bellman-Ford Algorithm (Negative Weights)

> **Navigation**: [← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Graph Problem Patterns →](03_graph_problem_patterns.md)
> Page 2 of 6 in **Graphs Advanced Algos**


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

## Minimum Spanning Tree — Why Greedy Even Works Here

Before the code: MST is the rare problem where **being greedy is provably optimal**, and understanding *why* is worth more than memorizing Prim and Kruskal. Greedy fails for most problems (coin change, knapsack) — so what's special about MST? One theorem, and it's intuitive once you see it.

### The cut property — the entire reason MST greedy is safe

> **Cut property:** Take *any* way to split the vertices into two groups (a "cut"). Look at all edges crossing between the groups. **The cheapest crossing edge is in some MST.** Always. No exceptions.

Why is this true? Suppose the cheapest crossing edge `e` were *not* in the MST. The MST still has to connect the two groups somehow, so it uses some *other* crossing edge `f`, which is more expensive (`e` was the cheapest). Now do an **exchange**: add `e` to the tree — this creates a cycle (the tree already connected the groups via `f`) — then delete `f` to break the cycle. You still have a spanning tree, it's still connected, and you swapped a costlier edge `f` for a cheaper edge `e`, so total weight *went down*. That contradicts "the MST was minimal." Therefore `e` must have been in the MST all along. ∎

That swap-and-improve move is the **exchange argument** — the same proof skeleton behind every correct greedy algorithm. Here it has teeth because the cut property guarantees a *locally* cheapest choice (the min crossing edge) is *globally* safe (it's in an optimal tree). That's exactly what greedy needs and almost never gets.

### Prim and Kruskal are the *same* greedy, applying the cut property differently

Once you have the cut property, both famous algorithms fall out of it — they just choose *which cut* to apply it to:

| | **Prim** | **Kruskal** |
|--|----------|-------------|
| The cut it uses | {visited vertices} vs {everyone else} — grows one blob | every edge induces the cut {one component} vs {the rest} |
| Greedy pick | cheapest edge leaving the current blob | cheapest edge in the *whole graph* that doesn't form a cycle |
| "Safe because…" | min crossing edge of the visited/unvisited cut → in MST | min edge across the cut between the two components it joins → in MST |
| Data structure | min-heap of frontier edges | sort all edges + Union-Find for cycle check |
| Best when | dense graphs (E ≈ V²) — heap of frontier stays small | sparse graphs (E ≈ V) — sorting E edges is cheap |

**Prim grows one tree outward**, always grabbing the cheapest edge on its expanding border — that border *is* a cut, so the cut property says the grab is safe. **Kruskal considers edges globally cheapest-first**, adding any that doesn't close a cycle — and "doesn't close a cycle" means it joins two separate components, i.e., it's the cheapest edge across *their* cut, so again the cut property says it's safe. Same theorem, two scanning strategies. Neither is "smarter"; they're optimized for different graph densities.

> **Why Kruskal needs Union-Find specifically:** the only question Kruskal asks per edge is "do these two endpoints already sit in the same component?" (if yes, adding the edge makes a cycle — skip it). That is *exactly* the connectivity query Union-Find answers in near-O(1). The MST algorithm and the data structure are co-designed — which is why [Union-Find](../14_Union_Find_DSU_Complete.md) is taught right next to this.

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

---

[← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Graph Problem Patterns →](03_graph_problem_patterns.md)
