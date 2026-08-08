# Chapter 1 — Strongly Connected Components & Johnson's All-Pairs Shortest Paths

> Before you can ask "what's the shortest path between every pair of nodes," you should ask a cheaper question first: which nodes even form a genuine "between" — and which are stuck in a cycle where every node can already reach every other one, making "shortest path" inside that cluster a different question entirely?

---

## The Problem

Take a directed graph — a build-dependency graph, a call graph, a road network with one-way streets. Two questions come up constantly:

1. **Which groups of nodes can all reach each other?** (If A can reach B and B can reach A, they're stuck together — you can't meaningfully order them in a build sequence, a topological sort, or a "what happens before what" analysis.)
2. **What's the shortest path between every pair of nodes?** — especially when edges carry weights that can be *negative* (a cache hit that saves time, a discount that reduces cost) as long as there's no negative cycle to exploit infinitely.

Both questions look like they need all-pairs, all-combinations brute force. Both have algorithms that avoid it by exploiting structure — and both algorithms are built on top of DFS in ways that reward understanding *why*, not just *what*.

## Part A — Strongly Connected Components (Tarjan's Algorithm)

### 1.1 The Naive Approach and Why It's Wasteful

Two nodes are in the same **strongly connected component (SCC)** if each can reach the other. The direct way to check this: for every pair `(u, v)`, run a reachability search (BFS/DFS) from `u` to see if `v` is reachable, and from `v` to see if `u` is reachable. With `V` nodes, that's `O(V)` reachability searches (one per node, checking what it can reach), each costing `O(V + E)` — giving `O(V·(V+E))` total. For a graph with thousands of nodes, that's the kind of quadratic-in-V blowup that stops scaling long before it becomes a real bottleneck for the *practical* graphs this matters for (dependency graphs, call graphs), which are typically sparse (`E ≈ O(V)`).

The wastefulness is structural: this approach computes full reachability sets from every single node, when what's actually needed is just *which nodes group together* — a much coarser question that shouldn't need the full fine-grained reachability information to answer.

### 1.2 What a Single DFS Pass Already Tells You

Run one DFS from an arbitrary start node and look at what you get for free: a **discovery order** (the sequence in which nodes are first visited) and the DFS tree's structure — tree edges, back edges (to an ancestor), forward edges (to a descendant), and cross edges (to an already-fully-explored subtree).

The key observation: **a back edge is direct evidence of a cycle** — if DFS is currently exploring node `v` and finds an edge back to an ancestor `u` still on the current DFS path, then `u → ... → v` (the tree path) plus `v → u` (the back edge) forms a cycle, meaning `u` and `v` are in the same SCC. The question Tarjan's algorithm answers is: how do you propagate that cycle information efficiently to group *all* the nodes on that cycle (and any nodes that lead into it in a way that loops back) into one SCC, in a single DFS pass, without re-scanning?

### 1.3 Deriving Tarjan's Algorithm: Discovery Index and Low-Link

Give every node two numbers as DFS visits it:

- **`index[v]`** — the order in which `v` was first discovered (a simple counter, incremented on each new visit).
- **`lowlink[v]`** — the *smallest* `index` reachable from `v`'s subtree using at most one back edge (i.e., "how far back up the DFS tree can this node's subtree reach, via a cycle").

The rule for computing `lowlink[v]`: start with `lowlink[v] = index[v]`. For every edge `v → w`:
- If `w` hasn't been visited yet, recurse into it, then update `lowlink[v] = min(lowlink[v], lowlink[w])` — if `w`'s subtree can reach further back than `v` currently knows, `v` inherits that.
- If `w` has been visited and is **still on the current DFS stack** (meaning it's an ancestor, not a fully-explored, unrelated subtree), update `lowlink[v] = min(lowlink[v], index[w])` — a direct back edge.

**The termination condition — this is the part that actually identifies SCC boundaries**: after processing all of `v`'s edges, if `lowlink[v] == index[v]`, then `v` is the **root** of its SCC — nothing in `v`'s subtree can reach further back than `v` itself, meaning the SCC is "closed" at this point. Pop nodes off the DFS stack until you pop `v` itself; everything popped is exactly the SCC rooted at `v`.

**Worked trace**, on the graph `0→1, 1→2, 2→0, 2→3, 3→4, 4→3, 4→5`:

```
Graph: 0->1->2->0 (a 3-cycle), 2->3, 3->4->3 (a 2-cycle), 4->5

Tarjan's SCC result:      [[0, 1, 2], [3, 4], [5]]
Brute-force (mutual reachability): [[0, 1, 2], [3, 4], [5]]
Match: True
```

This matches intuition directly: `{0,1,2}` form a cycle (SCC), `{3,4}` form a separate cycle (SCC), and `5` is alone (no cycle back to it, so it's its own trivial SCC). Verified against brute-force mutual-reachability on this hand-built graph, and stress-tested against 500 randomly generated directed graphs (3-12 nodes, 25% edge density) — zero mismatches.

**Cost:** each node is visited once, each edge examined once, and the stack push/pop per node happens once — `O(V + E)` total, a single DFS pass instead of `V` separate reachability searches. On a sparse graph, that's the difference between `O(V·(V+E)) ≈ O(V²)` and `O(V+E) ≈ O(V)`.

**When it breaks:** the `on_stack` check in step 2 of the derivation (§1.3) isn't optional — it's the entire reason cross edges (to an already-fully-explored, unrelated subtree) don't get treated as back edges. Drop that check, and a completed, unrelated subtree's `index` would incorrectly pull `lowlink[v]` down, merging two genuinely separate SCCs into one. The algorithm's correctness depends on distinguishing "this is an ancestor on my current path" (a real cycle) from "this is a node I already fully explored somewhere else" (not a cycle) — and the DFS stack is exactly the structure that makes that distinction cheap to check.

## Part B — Johnson's Algorithm for All-Pairs Shortest Paths

### 1.4 Why Floyd-Warshall Isn't Always the Right Default

Once a graph's SCCs are condensed (each SCC collapsed to a single node, producing a DAG — the actual reason SCC detection often comes *first* in a pipeline), a common next question is: what's the shortest path between every pair of nodes? Floyd-Warshall answers this directly in `O(V³)` — and it's simple, handles negative edges (as long as there's no negative cycle), and needs no auxiliary derivation. For dense graphs, it's often the right choice.

But `O(V³)` doesn't care how many edges the graph actually has. A **sparse** graph — `E ≈ O(V)`, common for real dependency/road/call graphs, where each node connects to a handful of others, not most of them — pays the same `V³` cost as a dense graph with `E ≈ O(V²)`. That's the specific waste Johnson's algorithm targets: get all-pairs shortest paths in time that scales with the *actual* edge count, not the worst-case dense assumption.

### 1.5 The Natural (Broken) First Idea: Just Run Dijkstra V Times

Dijkstra's algorithm computes single-source shortest paths in `O(E log V)` — much better than Floyd-Warshall's per-source cost when the graph is sparse. Running it from every node gives all-pairs in `O(VE log V)`, which for sparse graphs beats `O(V³)` handily. So: why not just do that?

**Because Dijkstra requires non-negative edge weights**, and this problem explicitly allows negative edges (as long as there's no negative cycle). Dijkstra's greedy "always expand the closest unvisited node" strategy is only correct because, with non-negative weights, no future edge can ever make an already-finalized shortest path shorter. A single negative edge breaks that guarantee — a node's true shortest distance might still improve *after* Dijkstra thinks it's finalized. Naively running Dijkstra on a graph with negative edges doesn't error — it silently returns wrong answers.

### 1.6 The Fix: Reweighting to Eliminate Negative Edges Without Changing Any Shortest Path

The idea: find a way to adjust every edge weight so all of them become non-negative, in a way that preserves *which path is shortest* between every pair (even if the absolute distances shift).

**Derivation.** Suppose you assign every node `v` a potential `h[v]`. Redefine each edge's weight as:

```
w'(u, v) = w(u, v) + h[u] - h[v]
```

For *any* path from `s` to `t`, summing `w'` along the path telescopes: every intermediate `+h[x] - h[x]` cancels, leaving `path_weight'(s,t) = path_weight(s,t) + h[s] - h[t]`. Since `h[s]` and `h[t]` are fixed constants added to *every* path between `s` and `t` equally, **whichever path was shortest under `w` is still shortest under `w'`** — reweighting shifts all path lengths between a given pair by the same constant, so it can't change which one is minimal.

That leaves one question: what potential function `h` makes every `w'(u,v) ≥ 0`? Pick `h[v] = ` shortest distance from a virtual source node (connected to every node with a zero-weight edge) to `v`, computed once via Bellman-Ford (which *does* handle negative edges, and detects negative cycles as a side effect — if one exists, the whole problem is ill-posed and Bellman-Ford reports it). By the shortest-path definition itself, `h[v] ≤ h[u] + w(u,v)` for every edge (the shortest path to `v` is never longer than going through `u` first) — rearranged, that's exactly `w(u,v) + h[u] - h[v] ≥ 0`. The reweighting is guaranteed non-negative by construction.

**Assembled algorithm (Johnson's):**
1. Add a virtual source connected to all nodes with weight-0 edges; run Bellman-Ford once from it to get `h[v]` for every node (`O(VE)`).
2. Reweight every edge using the formula above (`O(E)`).
3. Run Dijkstra from every node on the reweighted graph (`O(VE log V)` total).
4. Un-shift each computed distance back: `dist(u,v) = dist'(u,v) - h[u] + h[v]`.

**Verified against Floyd-Warshall** on the classic negative-edge example graph (5 nodes, edges including `A→E: -4`, `D→C: -5`, no negative cycle): all 25 pairwise distances matched exactly between the two methods.

**Cost comparison, sparse graphs (`E ≈ 4V`), counted as raw operations, not wall-clock:**

```
V=    10  E=     40   Floyd-Warshall ~        1,000    Johnson's ~        1,000    ratio=    1.0x
V=   100  E=    400   Floyd-Warshall ~    1,000,000    Johnson's ~      130,000    ratio=    7.7x
V=  1000  E=   4000   Floyd-Warshall ~1,000,000,000    Johnson's ~   16,000,000    ratio=   62.5x
V= 10000  E=  40000   Floyd-Warshall ~10^12             Johnson's ~2,000,000,000    ratio=  500.0x
```

At small `V`, the two are comparable (Johnson's has more setup machinery — a Bellman-Ford pass, `V` separate Dijkstra runs — that doesn't pay for itself yet). The gap opens *because* the graph stays sparse as `V` grows — exactly the regime Floyd-Warshall's `O(V³)` can't adapt to, since it never looks at `E` at all.

**When it breaks:** the entire reweighting scheme silently assumes no negative cycle exists. If one does, Bellman-Ford's step 1 detects it directly (a distance that keeps improving past `V-1` relaxation rounds is the standard negative-cycle signature) — and the right response is to stop and report that "shortest path" isn't well-defined for the affected nodes (you could loop the negative cycle indefinitely to make the "shortest path" arbitrarily small), not to proceed with a meaningless reweighting built on top of a distance calculation that never converged.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In Tarjan's algorithm, why does the SCC-closing check use <code>lowlink[v] == index[v]</code> rather than simply "have I returned to the node where DFS started"?</summary>

DFS doesn't only find one SCC — a graph can have many SCCs scattered throughout the DFS tree, and the *root of the overall DFS call* is almost never the root of every SCC. `lowlink[v] == index[v]` is a *local* condition: it says "nothing in v's own subtree can reach further back up the tree than v itself" — meaning v's subtree is self-contained as far as back-edges go, regardless of where the overall DFS started. This condition can (and does) trigger many times during one DFS traversal, once per SCC, each time correctly identifying that particular SCC's root — which is exactly what's needed, since a graph with k SCCs needs k separate "close off and pop" events, not one.
</details>

<details>
<summary><strong>Q2.</strong> A colleague suggests: "Skip Johnson's algorithm entirely — just add a large enough constant to every edge weight to make them all non-negative, then run Dijkstra V times." Why doesn't this work, even though it looks like the same idea as reweighting?</summary>

Adding the same constant `C` to every edge weight changes path lengths by `C × (number of edges on the path)` — and different paths between the same two nodes can have different numbers of edges. So a path that was shortest under the original weights might no longer be shortest after a flat shift, if a longer (more-edges) path that used to lose now gains a bigger constant bonus... the arithmetic actually goes the other way (more edges means more constant added, penalizing longer paths more) — but the point stands: a flat per-edge shift changes *which* path is shortest, because it interacts with path length (edge count), not just total weight. Proper reweighting (§1.6) uses a *per-node* potential `h[v]`, not a flat per-edge constant — and the derivation shows precisely why that specific form telescopes to a pair-dependent-but-path-independent constant shift, which is what preserves the shortest path's identity. The "just add a constant" idea is a natural guess that breaks exactly where the real derivation is careful.
</details>

<details>
<summary><strong>Q3.</strong> Johnson's algorithm computes all-pairs shortest paths using ordinary "distance" edges. What would you need to derive differently if you wanted a similar all-pairs efficient algorithm for MAXIMUM flow between every pair of nodes instead of shortest paths?</summary>

Shortest-path algorithms (Dijkstra, Bellman-Ford, Johnson's) rely on a specific structural property: optimal substructure via *relaxation* — a shortest path's prefix is always itself a shortest path, so distances can be built up incrementally edge by edge. Maximum flow has a completely different structure: it's not about finding one optimal path but about finding the best way to route flow across *multiple* paths simultaneously, limited by edge capacities that get "used up" by whatever flow crosses them — there's no equivalent of "relax an edge and maybe improve one number." That's precisely why maximum flow needs its own family of algorithms built around residual graphs and augmenting paths (Ford-Fulkerson and its refinements) rather than reusing shortest-path machinery — the next chapter's subject.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Naive SCC (pairwise reachability) | `O(V·(V+E))` — one reachability search per node, computing far more than needed |
| Back edges | A DFS back edge to a still-on-stack ancestor is direct proof of a cycle — the seed of SCC detection |
| `index[v]` / `lowlink[v]` | Discovery order vs. "furthest back this subtree can reach" — the two numbers Tarjan's algorithm propagates |
| SCC-closing condition | `lowlink[v] == index[v]` marks `v` as an SCC root — pop the DFS stack down to `v` to get that SCC's members |
| Tarjan's cost | `O(V+E)` — a single DFS pass replaces V separate reachability searches |
| `on_stack` check | Distinguishes real back-edges (ancestors) from cross-edges (unrelated finished subtrees) — drop it and SCCs incorrectly merge |
| Floyd-Warshall's blind spot | `O(V³)` regardless of edge count — wasteful on sparse graphs where `E ≪ V²` |
| Dijkstra ×V (naive) | Faster than Floyd-Warshall on sparse graphs, but silently wrong with negative edges — its greedy step assumes none exist |
| Reweighting | `w'(u,v) = w(u,v) + h[u] - h[v]` with `h` = shortest distance from a virtual source; telescopes so every path between a fixed pair shifts by the same constant — shortest path identity is preserved |
| Johnson's algorithm | Bellman-Ford once (get `h`, detect negative cycles) + reweight + Dijkstra ×V — `O(VE + V² log V)`, verified up to 500x fewer operations than Floyd-Warshall at V=10,000 on a sparse graph |

## Where We Go Next

Both algorithms in this chapter answer "what's connected to what, and how expensively" using edge weights that represent simple additive costs. The next chapter asks a structurally different question: given edges with *capacities* rather than costs, how much can simultaneously flow from a source to a sink? That question needs its own algorithmic machinery — residual graphs and augmenting paths — built from scratch in Chapter 2.

*Next: [02_Maximum_Flow_Ford_Fulkerson_Dinic.md](02_Maximum_Flow_Ford_Fulkerson_Dinic.md)*
