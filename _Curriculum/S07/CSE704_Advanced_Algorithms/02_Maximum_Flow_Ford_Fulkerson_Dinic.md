# Chapter 2 — Maximum Flow: Ford-Fulkerson, Edmonds-Karp, Dinic's Algorithm

> A pipe's capacity tells you how much water *can* cross it, not how it *should* be used. A greedy first attempt at routing flow commits early to choices it has no way to revisit — and a network that looks fully used can still be leaving capacity on the table. Every algorithm in this chapter is really just a different answer to one question: how cheaply can you let the algorithm change its mind?

---

## The Problem

A water utility owns a reservoir (the **source**) and needs to deliver water to a city (the **sink**) through a network of pipes and pumping stations. Every pipe has a maximum throughput — its **capacity**, in liters per second. The question: *what is the largest total flow rate the network can sustain from reservoir to city?*

The obvious strategy: find a path from source to sink, push as much water through it as its narrowest pipe allows, look for another path, repeat until no path has room left. That greedy approach is intuitive, terminates, and — this is the trap — produces a believable-looking answer that is frequently wrong. This chapter is the process of discovering exactly why, and fixing it.

## 2.1 The Naive Approach: Greedy Path Routing, and Why It Gets Stuck

Take a small network: reservoir `S`, two pumping stations `A` and `B`, city `T`. The pipe `S→A` and the pipe `B→T` are narrow — 1 unit/sec each. The pipes `S→B`, `A→B`, and `A→T` are all wide — 4 units/sec each.

```
S -1-> A -4-> T
S -4-> B -1-> T
      A -4-> B
```

Greedy routing finds *a* path — say a depth-first search that explores `A` before `T`, and from `A` explores `B` before `T` — landing on `S→A→B→T`. The narrowest pipe on it (`S→A` and `B→T` are tied at capacity 1) caps the push at exactly 1 unit/sec.

Check what's left: `S→A` and `B→T` are both now at 0. Looking for another path using only remaining capacity: from `S`, only `S→B` has room (4 units untouched); from `B`, the only outgoing pipe is `B→T` — now empty. Dead end. No other path exists using only leftover forward capacity.

Running this for real (Python, exhaustive path search using only positive remaining forward capacity, no bookkeeping beyond "how much is left on each pipe"):

```
naive greedy step 1: path [(S,A), (A,B), (B,T)], bottleneck 1, running total 1
(no further path exists using only remaining forward capacity)
Naive greedy (no residual, gets stuck): total = 1
```

But brute-force search over every valid integer flow assignment on this network (all `2×5×5×5×2 = 500` combinations of per-pipe flow, keeping only ones satisfying conservation at `A` and `B`) finds a flow of **2** units/sec is achievable — `S→A→T` carrying 1, and `S→B→T` carrying 1, simultaneously, never touching `A→B` at all. Greedy left an entire extra unit of throughput on the table, permanently, because it had no way to reconsider a pipe it had already committed to.

The failure is structural, not a matter of choosing a "smarter" first path — with only forward capacities and no memory of what could be undone, *any* greedy strategy that tries the `A→B` detour first gets stuck the same way. What's needed is a way for the algorithm to say "actually, route less through `A→B` than I first thought" *after* already committing flow there.

## 2.2 The Fix: Residual Graphs — Letting the Algorithm Undo a Bad Choice

The idea: every time you push `f` units of flow along a pipe `u→v`, don't just decrease `u→v`'s remaining capacity by `f` — also open `f` units of capacity on a *reverse* pipe `v→u` that didn't exist before. That reverse pipe isn't a real, physical pipe; it represents the option to **cancel** up to `f` units of the flow just committed on `u→v`. This paired structure — original capacity minus flow used, plus reverse capacity equal to flow pushed — is the **residual graph**.

Re-run the exact same greedy first move — `S→A→B→T`, pushing 1 unit/sec, since nothing about *finding* that first path changes. But now the residual graph contains a new edge `B→A` with capacity 1 (the option to undo 1 unit of the `A→B` flow). Search again:

```
iter 1: S-A-B-T, bottleneck 1
iter 2: S-B-A-T, bottleneck 1
```

The second path, `S→B→A→T`, uses the reverse residual edge `B→A` to cancel 1 unit of the `A→B` flow while routing 1 new unit through `S→B` and `A→T`. Net effect, verified by inspecting the final per-pipe flow after both iterations:

```
S->A: capacity 1, flow 1
S->B: capacity 4, flow 1
A->B: capacity 4, flow 0
A->T: capacity 4, flow 1
B->T: capacity 1, flow 1
```

Total flow: 2 — matching the brute-force optimum exactly. Notice what happened to `A→B`: its final flow is **zero**. The algorithm used it as a detour in iteration 1, then completely retracted that decision in iteration 2, arriving at the same clean two-path solution (`S→A→T` plus `S→B→T`) the optimal answer actually uses. The residual graph didn't need to be smart about avoiding the bad first move — it only needed to make undoing it *possible*.

## 2.3 Assembling Ford-Fulkerson

Putting this together gives the **Ford-Fulkerson method**: start with zero flow; build the residual graph (forward edge `u→v` gets capacity `c−f`, reverse edge `v→u` gets capacity `f`); search for *any* `S`-`T` path using only positive-residual edges (an **augmenting path**); if none exists, stop; otherwise push `b` units along it, where `b` is the path's minimum residual capacity (the **bottleneck**), update residuals, and repeat.

With integer capacities, every iteration increases total flow by at least 1, so the process always terminates — flow is bounded above by the total capacity out of `S`, so it can't keep improving forever. This was introduced by L. R. Ford Jr. and D. R. Fulkerson in 1956, in "Maximal Flow through a Network" (*Canadian Journal of Mathematics*).

But termination alone doesn't prove the answer is *optimal* — only that the algorithm ran out of paths it could find. Why does "no augmenting path left" guarantee "no better flow exists at all," rather than just "this algorithm gave up"?

## 2.4 Why "Stuck" Means "Optimal": Max-Flow Min-Cut

Define a **cut** as any partition of the nodes into two sets, one containing `S` and the other containing `T`. The cut's **capacity** is the sum of the capacities of all edges crossing from the `S`-side to the `T`-side (edges crossing the other direction don't count).

**Claim: no flow can ever exceed any cut's capacity.** Every unit of flow leaving `S` must eventually cross from the `S`-side to the `T`-side of *any* such partition — there's no other way to reach `T` — and the total that can cross is capped by the summed capacity of edges going that direction. So `flow value ≤ every cut's capacity`, including the minimum one. This direction is cheap: just conservation plus the definition of a cut.

The sharper claim, and the one that makes Ford-Fulkerson's stopping condition meaningful: **when no augmenting path exists, the current flow already equals some cut's capacity exactly** — which, combined with the claim above, makes that flow maximum and that cut minimum, simultaneously. Here's why. Let `R` be the set of nodes reachable from `S` using only positive-residual-capacity edges, at the moment the search fails to reach `T`. By construction `T ∉ R` — that's exactly why the search failed. `R` and its complement form a valid cut. Every edge crossing from `R` to its complement must be *fully saturated* (zero residual capacity — otherwise its endpoint would be in `R` too), and every edge crossing the other way must carry *zero flow* (a positive-flow edge always has a reverse residual edge, which would have pulled its source into `R`). So the total flow crossing this specific cut equals its capacity exactly — nothing saturated-below-capacity, nothing wasted.

Verifying this on the worked network from §2.1's larger cousin — reservoir `S`, stations `A`, `B`, `C`, city `T`, with `S→A=10, S→B=10, A→B=2, A→C=3, B→C=4, C→T=10` — three independent methods agree:

```
Brute-force max flow (exhaustive integer search over 79,860 combinations): 7
Brute-force min cut (independent subset-enumeration, not from any flow algorithm): 7, S-side = {S, A, B}
Edmonds-Karp: max flow = 7, iterations = 2
  iter 1: path S-A-C-T, bottleneck = 3
  iter 2: path S-B-C-T, bottleneck = 4
```

The min cut here is genuinely internal — neither "just `S`'s own pipes" (capacity 20) nor "just the pipes feeding `T`" (capacity 10), but the pair `A→C` and `B→C` (`3+4=7`), the real chokepoint in the middle, found by brute-force partition search with zero knowledge of any flow algorithm and landing on exactly the number Edmonds-Karp converged to independently. This is the **max-flow min-cut theorem**, proved by Ford and Fulkerson in the same 1956 paper (and independently, the same year, by Peter Elias, Amiel Feinstein, and Claude Shannon).

## 2.5 How Many Iterations? Runtime Depends on Capacity *Values*

Each iteration costs `O(E)` (one DFS/BFS to find a path), and in the worst case only increases flow by 1. That gives a runtime bound of `O(E·F)`, where `F` is the numeric value of the max flow — **pseudo-polynomial**: polynomial in the *magnitude* of the capacities, not the number of *bits* needed to write them down. Double every capacity and the true answer needs only one more bit to represent, but the worst-case iteration count can double too.

The classic construction making this concrete: source `S`, sink `T`, intermediate nodes `U, V`. `S→U`, `S→V`, `U→T`, `V→T` all have capacity `C`; a single cross edge `U→V` has capacity 1. The true max flow is `2C`, reachable in exactly two augmenting paths (`S→U→T`, `S→V→T`). But the generic algorithm only promises to find *some* augmenting path, and `S→U→V→T` (bottleneck 1, limited by the cross edge) is just as legal a choice — so is `S→V→U→T` afterward, using the reverse residual edge the first path opened on `U→V`, undoing it and becoming available to redo next iteration. Alternating these two zig-zag paths is a completely legal execution of the generic method, advancing flow by only 1 unit per iteration:

```
     C |  adversarial FF iters |  2C (predicted) |  Edmonds-Karp iters
    10 |                     20 |               20 |                    2
    50 |                    100 |              100 |                    2
   100 |                    200 |              200 |                    2
   500 |                   1000 |             1000 |                    2
  1000 |                   2000 |             2000 |                    2
```

The adversarial count matches `2C` exactly at every tested value — not "roughly," exactly, because the construction forces it. `C = 1000` takes 2,000 iterations under this legal-but-unlucky execution, on a graph with 4 nodes and 5 edges.

It gets worse than "slow" once capacities aren't required to be rational. With an irrational capacity, generic Ford-Fulkerson can fail to terminate *at all* — not loop forever making tiny progress toward the right answer, but converge to a limit flow **strictly less than the true maximum**, forever. Ford and Fulkerson's own 1956 book gave such an example (10 vertices, 48 edges); Uri Zwick later found the smallest possible one — 6 vertices, 8 edges — using an edge of capacity `r = (√5 − 1)/2` (satisfying `r² = 1 − r`), with augmenting paths chosen so each iteration's contribution shrinks geometrically by a factor of `r`. A geometric series converges, so the *total* flow converges too — just not to the max ("Smallest Networks on Which the Ford-Fulkerson Maximum Flow Procedure May Fail to Terminate," *Theoretical Computer Science*, 1995).

**When it breaks:** generic Ford-Fulkerson's only guarantee is "terminates with the max flow *if* it terminates, for integer capacities." Nothing in its definition constrains *which* augmenting path gets picked — that omission is exactly what both the `2C`-iteration blowup and the irrational-capacity non-termination exploit. The fix in both cases is the same: stop leaving path choice arbitrary.

## 2.6 Edmonds-Karp: Always Pick the Shortest Augmenting Path

The fix is a one-line constraint: instead of an arbitrary DFS, use **BFS** to find the augmenting path with the *fewest edges*. Nothing else about Ford-Fulkerson changes — same residual graph, same bottleneck-and-augment step — only the rule for which path gets chosen when several exist.

Why does this bound the iteration count? The key fact (Edmonds and Karp) is that the shortest augmenting-path distance from `S` to `T` never decreases as the algorithm runs, and once a specific edge is the bottleneck of an augmenting path (gets fully saturated), it cannot become a bottleneck again until that distance strictly increases. The distance is bounded by `V`, so each edge can be a bottleneck at most `O(V)` times, giving `O(VE)` total augmenting paths, each found in `O(E)` via BFS: **`O(VE²)`** overall — a bound depending only on graph size, never on capacity values.

Run it on the zig-zag network from §2.5, for every tested `C`:

```
Edmonds-Karp iterations: 2, 2, 2, 2, 2   (for C = 10, 50, 100, 500, 1000)
```

Constant, regardless of `C` — BFS finds `S→U→T` and `S→V→T` (both length 2) directly, and the length-3 zig-zag `S→U→V→T` is never a *shortest* path candidate once a length-2 path is available. Edmonds and Karp published this in 1972; Yefim Dinitz found the same idea — and the same polynomial bound — independently in 1970, one year ahead, as part of a more general algorithm covered next.

## 2.7 Dinic's Algorithm: Do an Entire Phase at Once

Edmonds-Karp still runs one full BFS per *single* augmenting path, even though BFS already computes the shortest-path layering for the entire graph, not just one path through it. That layering — call node `v`'s **level** its BFS distance from `S` — doesn't change during a round of augmenting along same-length paths, so recomputing it from scratch per path is wasted work.

Dinic's algorithm restructures this into **phases**. Each phase: (1) one BFS to compute levels; (2) build the **level graph** — keep only residual edges `u→v` where `level[v] = level[u]+1`; (3) find a **blocking flow** on the level graph — push flow along level-respecting paths until *no* `S`-`T` path remains in the level graph (not the whole residual graph, just this layered subgraph), using a DFS with a per-node pointer that permanently skips exhausted edges. Then rebuild levels and repeat.

The phase count is bounded by `V−1`, since the shortest `S`-`T` distance strictly increases after each phase's blocking flow saturates every shortest path (the same monotonicity fact Edmonds-Karp relies on, now amortized: an entire round of shortest-length paths clears in one phase instead of one BFS per path). Each phase costs `O(VE)`, giving **`O(V²E)`** total — asymptotically at least as good as Edmonds-Karp's `O(VE²)`, strictly better on dense graphs (`E` close to `V²`).

The gap between "one path per BFS" and "a whole phase per BFS" is concrete, not just asymptotic. Take a network built so the first round of shortest (length-2) paths does *not* saturate the graph — `S→A=2, S→B=1, A→B=1, A→T=1, B→T=2` — where the direct paths `S→A→T` and `S→B→T` are both length 2, and the cross edge `A→B` is same-level (`level[A] = level[B] = 1`) so it's excluded from phase 1's level graph entirely:

```
Brute-force max flow: 3   (S-side of min cut = {S}, capacity 3)
Dinic's:       max flow = 3, phases = 2, blocking-flow DFS calls = 13
Edmonds-Karp:  max flow = 3, iterations = 3
  EK iter 1: S-A-T, bottleneck = 1
  EK iter 2: S-B-T, bottleneck = 1
  EK iter 3: S-A-B-T, bottleneck = 1
```

Phase 1 finds *both* length-2 paths (`S→A→T`, `S→B→T`) in a single blocking-flow pass, since a blocking flow doesn't stop after one path — it keeps going until the level graph is exhausted. Only the longer detour `S→A→B→T` needs a second phase, once `A→B` moves from same-level to level-respecting as the residual distances shift. Edmonds-Karp, restricted to one path per BFS, needs three separate BFS calls for the same total work Dinic's does in two phases. Dinic's algorithm was conceived by Yefim Dinitz in 1970 (invented January 1969, as a master's student) and remains a standard building block for faster flow algorithms built on top of it.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In §2.2, the residual graph adds a reverse edge <code>v→u</code> with capacity equal to the flow currently pushed on <code>u→v</code>. Why does the reverse edge's capacity need to be exactly the current flow amount — not, say, a fixed constant, and not the same as <code>u→v</code>'s original capacity?</summary>

The reverse edge represents "how much of the flow already committed on `u→v` can still be cancelled" — and you can never cancel more than you've actually pushed. A fixed constant would let the algorithm "undo" flow that was never sent, fabricating flow and breaking conservation. Tying it to `u→v`'s original capacity instead of current flow would offer a reverse route to cancel even when nothing has been pushed yet — nothing there to cancel. Reverse capacity equal to current forward flow keeps the residual graph an accurate live picture of "what can still change": exactly `flow` units of give in reverse, exactly `capacity − flow` units forward, always summing back to the fixed original capacity.
</details>

<details>
<summary><strong>Q2.</strong> A colleague claims: "Dinic's algorithm isn't fundamentally different from Edmonds-Karp — it's the same shortest-augmenting-path idea, just with some constant-factor engineering (the per-node pointer trick) bolted on." Is this accurate?</summary>

Not quite — the pointer trick (skipping exhausted edges within a phase) is a real implementation optimization, but not the source of Dinic's structural advantage. The real difference: Dinic's finds *every* shortest-length augmenting path within one phase (one blocking-flow computation), while Edmonds-Karp finds exactly one shortest path per BFS call and re-runs BFS from scratch. The §2.7 example shows this concretely: Dinic's needs 2 phases where Edmonds-Karp needs 3 separate BFS-and-augment iterations for identical total flow — not engineering, but because a blocking flow is a fundamentally more thorough unit of work than a single augmenting path. That structural difference is what changes the bound from `O(VE²)` to `O(V²E)`.
</details>

<details>
<summary><strong>Q3.</strong> Suppose every edge capacity in a flow network is exactly 1, and the graph has a special shape: <code>S</code> connects only to a set of nodes <code>L</code>, <code>T</code> connects only to a set of nodes <code>R</code>, and the only other edges go from <code>L</code> to <code>R</code>. What does a maximum "flow" represent in this restricted setting, and why might it deserve its own specialized algorithms instead of just running Edmonds-Karp or Dinic's as-is?</summary>

With every capacity 1 and the graph forced into this `S→L→R→T` layered shape, a unit of flow along `S→ℓ→r→T` can only mean "`ℓ∈L` is matched to `r∈R`," since no node can carry more than 1 unit through it — no `L`-node or `R`-node can appear in more than one flow-carrying path. Maximum flow here is exactly **maximum bipartite matching**. Generic max-flow algorithms still work correctly — they're not wrong — but they don't *exploit* every capacity being 1 and every augmenting path sharing the same rigid three-hop shape. That structure supports matching algorithms that reason directly in terms of matched/unmatched nodes and alternating paths, which is where the next chapter starts.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Naive greedy routing | Commits to a path's flow permanently; verified to get stuck at 1 unit/sec on a network whose true max is 2 — no way to reconsider a bad early choice |
| Residual graph | Every unit of forward flow `u→v` opens a reverse edge `v→u` of equal capacity, representing "this much can still be cancelled" — the mechanism that lets augmenting paths undo earlier decisions |
| Augmenting path | Any `S`-to-`T` path using only positive-residual-capacity edges; pushing its bottleneck capacity strictly increases total flow |
| Ford-Fulkerson (generic) | Repeat "find any augmenting path, push its bottleneck" until none remain; terminates for integer capacities, but the path-choice rule is left unspecified |
| Max-flow min-cut theorem | No flow can exceed any cut's capacity (easy direction); when no augmenting path remains, the residual-reachable set from `S` forms a cut whose capacity exactly equals current flow — proving both optimal simultaneously. Verified: brute-force flow (7) = brute-force min cut (7) = Edmonds-Karp (7) on a 5-node network |
| Runtime depends on capacity values | Generic Ford-Fulkerson: `O(E·F)` where `F` is the flow's numeric value — pseudo-polynomial. Verified: a 4-node zig-zag network takes exactly `2C` iterations for capacity `C`, confirmed exactly at `C` = 10, 50, 100, 500, 1000 |
| Irrational capacities | Can make generic Ford-Fulkerson never terminate — converging to a limit strictly below the true max flow (Zwick 1995: smallest such network has 6 vertices, 8 edges) |
| Edmonds-Karp | BFS = shortest augmenting path by edge count; bounds iterations to `O(VE)`, total `O(VE²)` — independent of capacity magnitude. Verified: exactly 2 iterations on the zig-zag network regardless of `C` |
| Dinic's algorithm | Groups all same-length augmenting paths into one "phase" via level graphs + blocking flow; `O(V-1)` phases, `O(V²E)` total. Verified: 2 phases match brute force where Edmonds-Karp needs 3 separate BFS calls for the same work |

## Where We Go Next

This chapter treated every edge's capacity as an arbitrary number and asked how much total flow could cross the network. The next chapter narrows the question in a specific, useful way: what if every capacity is exactly 1, and the graph is forced into a strict two-sided (bipartite) shape? Max-flow machinery still solves it — but that narrower structure supports its own vocabulary (matched/unmatched nodes, alternating paths) and its own theorems (Hall's marriage theorem) about exactly when a perfect pairing is possible at all, plus a genuinely different algorithm (the Hungarian algorithm) once pairings start carrying costs that plain capacities can't express.

*Next: [03_Matchings_Bipartite_Hungarian.md](03_Matchings_Bipartite_Hungarian.md)*
