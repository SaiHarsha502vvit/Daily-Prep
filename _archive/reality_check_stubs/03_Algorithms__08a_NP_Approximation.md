

---

## Reality Check

**"NP-hard means unsolvable"** → NP-hard means no known polynomial-time algorithm exists. Solutions still exist: exact algorithms that are exponential but fast in practice (branch-and-bound, dynamic programming on small n), approximation algorithms (guaranteed to be within a factor of optimal in polynomial time), heuristics (no guarantee, but work well in practice — simulated annealing, genetic algorithms), parameterised algorithms (exponential only in a "small" parameter, polynomial in input size). Industrial NP-hard problems (TSP, knapsack, scheduling) are routinely "solved" with these approaches.

**"Approximation ratio = how wrong the answer is"** → Approximation ratio is the worst-case ratio of approximation to optimal: a 2-approximation returns an answer ≤ 2× the optimal (for minimization). It's a guarantee, not an average: the algorithm is provably at most 2× optimal on any input. Greedy vertex cover: add both endpoints of any unmatched edge until all edges are covered — 2-approximation. Greedy TSP (nearest neighbor): O(log n) approximation. Christofides algorithm for metric TSP: 3/2-approximation (still the best known for the general case).

**"Reduction means 'converting one problem to another'"** → Polynomial reduction A ≤p B means: if we can solve B in polynomial time, we can solve A in polynomial time (by transforming A's input to B's input, solving B, and transforming back). This proves: if A is NP-hard and A ≤p B, then B is NP-hard. Cook-Levin proved SAT is NP-hard by reducing EVERY language in NP to SAT. Then 3-SAT ≤p Clique ≤p Independent Set ≤p Vertex Cover built the whole NP-complete structure.

**"Branch and bound is just brute force"** → Branch and bound IS systematic enumeration, but the bound is the key: at each node of the search tree, compute an optimistic bound (best possible solution from this point). If the bound is worse than the current best, prune the entire subtree. Effective bounding can eliminate 99%+ of the search space. Real TSP solvers (Concorde) solve 100,000-city instances using LP-relaxation bounds in branch-and-bound. The quality of the bound determines the algorithm's practical efficiency.

**"Local search algorithms don't have performance guarantees"** → Local search (hill climbing, simulated annealing) rarely has worst-case guarantees, but there are exceptions: for some problems, local search finds the optimal. 2-OPT for TSP has no approximation ratio guarantee (can be O(log n) from optimal), but with POPMUSIC (partition into small pieces) it's practical for real road networks. The Lin-Kernighan heuristic for TSP has no theoretical guarantee but consistently finds solutions within 1% of optimal in practice. Local search with restarts often outperforms exact methods on large instances.
