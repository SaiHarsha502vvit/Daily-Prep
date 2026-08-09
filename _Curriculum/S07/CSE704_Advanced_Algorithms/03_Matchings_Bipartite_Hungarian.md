# Chapter 3 — Matchings: Bipartite Matching, Hall's Theorem, and the Hungarian Algorithm

> Matching only asks a narrower question than flow — can everyone be paired at all — but narrower questions reward narrower machinery. And once pairing is possible, a harder question hides right behind it: not just *whether* a pairing exists, but which one, among all the valid ones, costs the least.

---

## The Problem

A hiring pipeline has `n` open roles and a pool of candidates, each qualified for only *some* of the roles. Two questions matter, in order. First: can every role be filled at all, given who's qualified for what? Second, once that's settled: candidates aren't interchangeable — onboarding cost, salary expectations, ramp-up time all vary by pairing — so *which* full assignment costs the least?

Chapter 2's closing question already previewed the shape of the answer to the first question: cap every edge's capacity at 1, force the graph into a strict source → candidates → roles → sink layout, and maximum flow becomes maximum matching. This chapter makes that precise, then goes further, since raw max-flow turns out to answer the first question while staying completely silent on the second.

## 3.1 Matching as Max Flow

Build the network exactly as Chapter 2's Q3 sketched: a source `S`, a sink `T`, one node per candidate (`S→candidate`, capacity 1) and one per role (`role→T`, capacity 1), and an edge `candidate→role` (capacity 1) exactly where that candidate is qualified for that role. Every unit of flow from `S` to `T` threads through exactly one candidate and exactly one role, and unit capacities mean neither can be reused — which is precisely what a matching requires.

Five candidates, five roles, qualifications `(candidate, role)`: `(0,0), (0,1), (1,1), (1,2), (2,0), (2,3), (3,3), (3,4), (4,4)` — not every pairing is available, so this is *not* a complete bipartite graph. Running Chapter 2's BFS-augmenting-path max flow on this reduction:

```
Max-flow reduction: matching size = 5, matching = [(0,1), (1,2), (2,0), (3,3), (4,4)]
Brute-force backtracking search: matching size = 5
Agree: True
```

A brute-force backtracking search (try every candidate either unmatched or matched to each of its qualified roles, keep the best) independently confirms 5 is truly the maximum — every candidate placed. Nothing about Chapter 2's algorithms needed to change; unit capacities alone turned "maximum flow" into "maximum matching."

## 3.2 Hall's Marriage Theorem: When Is a Full Matching Even Possible?

Sometimes it isn't. Take four candidates, four roles, qualifications `(0,0), (0,1), (1,0), (1,1), (2,0), (2,1), (3,0), (3,2), (3,3)`. Candidates 0, 1, and 2 are qualified for only two roles between the three of them (`0` and `1`) — three people chasing two slots. No matter how they're arranged, at most 2 of those 3 can be placed, capping the *whole* matching below 4 even though candidate 3 has plenty of options elsewhere.

Formalize the pattern: for any subset `S` of candidates, let `N(S)` be the set of roles *any* member of `S` is qualified for. If `|N(S)| < |S|`, that subset alone is too large for the roles reachable from it — a **deficient set** — and no full matching can exist, full stop, regardless of how the rest of the graph looks. **Hall's marriage theorem** (Philip Hall, 1935, "On Representatives of Subsets," *J. London Math. Soc.*) says the converse also holds: a full matching of every candidate exists *if and only if* `|N(S)| ≥ |S|` for *every* subset `S`. One bad subset is enough to block a full matching; no bad subset is enough to guarantee one.

Checking every one of the 15 non-empty subsets of `{0,1,2,3}` by brute force on this graph:

```
Hall's condition violated for subsets (S, N(S)): [([0, 1, 2], [0, 1])]
Max deficiency = 1, achieved at S = [0, 1, 2], N(S) = [0, 1]
Max-flow matching size = 3
Brute-force matching size = 3
Predicted by defect Hall's theorem: |L| - max_deficiency = 4 - 1 = 3
All agree: True
```

Only one subset violates Hall's condition, `{0,1,2}` with deficiency `3 − 2 = 1` — and the actual maximum matching (confirmed by both the flow reduction and brute force) is exactly `4 − 1 = 3`, not just "less than 4." This is the sharper **defect form** of Hall's theorem: the shortfall from a full matching equals the *worst* deficiency over all subsets, not merely "some subset is deficient, so something's wrong." Swap in a graph where every subset satisfies Hall's condition (`(0,0),(0,1),(1,1),(1,2),(2,2),(2,3),(3,0),(3,3)`) and the maximum deficiency over all subsets is 0 — the flow reduction and brute force both return a full matching of size 4, as guaranteed.

## 3.3 Why Plain Max-Flow Doesn't Handle Cost

Now suppose every candidate is qualified for every role (a complete bipartite graph — Hall's condition trivially holds), but with a real cost attached to each pairing: onboarding time, salary gap, whatever the business cares about minimizing. Chapter 2's max-flow algorithms still find a full matching — flow doesn't care about cost, only about residual capacity — but which *one* of the many possible full matchings does it return?

Four candidates, four roles, cost matrix:

```
        role0  role1  role2  role3
cand0:    9      2      7      8
cand1:    6      4      3      7
cand2:    5      8      1      8
cand3:    7      6      9      4
```

Running the same cost-*blind* augmenting-path search from §3.1 (BFS by hop count, no notion of cost at all) on this complete graph:

```
Cost-blind max-flow matching: [(0, 0), (1, 1), (2, 2), (3, 3)]
Cost-blind matching total cost: 18
Brute-force optimal assignment: [(0, 1), (1, 0), (2, 2), (3, 3)], cost = 13
Cost-blind flow matches optimal: False
```

The cost-blind search lands on the "obvious" diagonal pairing (candidate `i` to role `i`) simply because that's the first augmenting path it happens to find — every one of these pairings is a *valid, maximum* matching, so nothing in max-flow's correctness guarantee is violated. But its cost, 18, is 38% worse than the true optimum of 13. Max-flow's optimality condition (§2.4: no augmenting path left) says nothing about cost whatsoever — *any* maximum matching satisfies it equally.

## 3.4 The Fix: Minimum-Cost Augmenting Paths

The fix follows the same pattern as Chapter 2's fix for arbitrary path choice: stop leaving the choice arbitrary. Instead of the *shortest-by-hops* augmenting path (Edmonds-Karp's rule), take the **cheapest** augmenting path — the one minimizing total cost across residual edges, where a reverse residual edge carries the *negated* cost of the forward edge it undoes (undoing a costly decision should read as a refund, not a new charge).

Run this once per candidate (`n` augmentations, each adding exactly one unit of matching), always picking the current cheapest augmenting path. Finding "cheapest path" with possibly-negative reverse-edge costs is exactly Chapter 1's problem: Bellman-Ford handles negative edges but is slow, and Dijkstra is fast but breaks on negative edges. The fix is the *same* fix — §1.6's reweighting. After each augmentation, update a potential `h[v]` at every node using the just-computed shortest distances, so that every edge's *reduced* cost (`w(u,v) + h[u] − h[v]`) stays non-negative for the next round, and Dijkstra becomes safe to use from then on. This is Johnson's algorithm's exact trick, redeployed here across *successive* augmentations instead of across *all pairs*.

Why does always taking the currently-cheapest augmenting path lead to the globally cheapest full matching, rather than just a locally greedy one? The key invariant: after `k` rounds of this, the current matching is provably the cheapest possible matching *of size `k`* — not merely *a* size-`k` matching. If some other size-`k` matching were cheaper, the edges where the two matchings disagree would form alternating cycles and paths in the residual graph, and a cheaper alternative would require one of those to have strictly negative total cost — impossible, since every augmentation this method ever took was already the *minimum*-cost option available at that moment, and reduced costs stay non-negative throughout. (This is a preview of a duality argument that gets its full treatment next chapter — the potentials here are doing exactly the job that LP dual variables do.)

Verifying on the §3.3 cost matrix:

```
SSP-with-potentials (Hungarian) result: cost = 13, match = [(0, 1), (1, 0), (2, 2), (3, 3)]
Matches brute-force optimum: True
```

Exactly the brute-force optimum, both in cost and in the actual pairing. A second, independently generated 5×5 random cost matrix (seed 42) confirms it's not a fluke: brute force finds 21, the successive-shortest-augmenting-path method finds 21. This is the **Hungarian algorithm**: formalized by Harold Kuhn in 1955 (*Naval Research Logistics Quarterly*), who named it "Hungarian" himself in credit to the underlying results of Dénes Kőnig (1916) and Jenő Egerváry (1931); James Munkres proved in 1957 that it runs in strictly polynomial time, `O(n³)`.

**When it breaks:** everything above assumed a full matching (`n` augmentations) is achievable at all — but §3.2 already showed that isn't guaranteed. Reuse that exact deficient graph (candidates 0, 1, 2 competing for only 2 shared roles), attach real costs to the compatible pairs, and mark every *incompatible* pair with a deliberately huge cost as a stand-in for "not allowed." The true maximum matching size is 3, and the cheapest matching of that size is:

```
Brute-force min-cost MAXIMUM matching: [(1, 0), (2, 1), (3, 3)], cost = 6
SSP run for exactly max_size=3 iterations: cost = 6, match = [(1, 0), (2, 1), (3, 3)]
Matches brute force: True
```

Running the *same* algorithm for the "expected" `n = 4` iterations instead of checking the true maximum matching size first is where it silently breaks:

```
SSP run for nL=4 iterations instead (forced to use a forbidden/BIG edge): cost = 10006
match = [(0, 2), (1, 0), (2, 1), (3, 3)]
```

With no augmenting path left among the *real* edges, the algorithm doesn't fail loudly — it just accepts the artificially huge-cost edge because it's still technically the cheapest (only) option left, silently smuggling a forbidden pairing into a result that still *looks* like a complete, confident answer. The fix is procedural, not algorithmic: run Hall's-theorem bookkeeping (or just count the true maximum matching size via §3.1's flow reduction) *before* deciding how many augmentations to trust, rather than assuming `n` is always achievable.

## Section Challenge

<details>
<summary><strong>Q1.</strong> The matching-as-flow reduction in §3.1 relies on every edge — <code>S→candidate</code>, <code>candidate→role</code>, and <code>role→T</code> — having capacity exactly 1. Suppose instead each candidate could take up to <em>2</em> roles (so <code>S→candidate</code> edges get capacity 2, everything else unchanged). Is the resulting max flow still a "matching," and if not, what combinatorial object does it become?</summary>

It's no longer a matching in the usual sense — a candidate can now appear in up to two flow-carrying paths simultaneously, so the result is a *b*-matching (here, specifically a matching where the candidate side is capacity-2 but the role side stays capacity-1): every role still gets at most one candidate, but candidates can be assigned to as many as two roles each. The max-flow reduction still works correctly for this generalized problem — flow conservation and capacity constraints enforce exactly this relaxed pairing rule — which is itself evidence for how much of matching theory is really just flow theory with unit capacities as a special case, not a fundamentally different structure requiring different machinery.
</details>

<details>
<summary><strong>Q2.</strong> A colleague suggests: "Skip the potential-update step in the Hungarian algorithm — after the first augmenting path, just run plain Dijkstra directly on the residual graph's raw costs for every subsequent round." Why does this fail?</summary>

Every augmentation that uses a reverse residual edge assigns it the *negated* cost of the forward edge it's undoing (§3.4) — and forward costs are non-negative in the assignment problem, so reverse residual edges are frequently negative. Plain Dijkstra's correctness depends entirely on non-negative edge weights (Chapter 1, §1.5): its greedy "finalize the closest unvisited node" step assumes no later edge can ever improve an already-finalized distance, and a negative edge breaks that assumption outright. Skipping the potential update doesn't just lose an optimization — it silently reintroduces the exact negative-edge failure mode that motivated reweighting from Johnson's algorithm in the first place, and Dijkstra will return wrong shortest-augmenting-path costs without any error or warning.
</details>

<details>
<summary><strong>Q3.</strong> The Hungarian algorithm's potentials <code>h[v]</code> satisfy <code>h[candidate] + h[role] ≤ cost(candidate, role)</code> for every possible pairing, with equality holding exactly on the pairs used in the optimal matching. What kind of mathematical object does a set of numbers like this — one per variable, bounding every possible cost from below, tight exactly at the optimum — usually turn out to be, and why might that generalize far beyond matching?</summary>

Those potentials are a **dual solution**: a separate optimization problem, built directly from the matching problem's constraints, whose value provably bounds the original (primal) problem's optimum from one side — and the "equality exactly on pairs actually used" pattern is complementary slackness, the standard signature of a *pair* of primal and dual solutions that are both simultaneously optimal. Nothing about this structure is specific to matching — any problem that can be phrased as optimizing a linear objective over a set of linear constraints (a **linear program**) has a dual with exactly this bounding behavior, and the Hungarian algorithm turns out to be a specialized combinatorial method for solving one particular LP's dual. That general theory — what a dual is, why weak duality always holds, and when strong duality guarantees the bound is tight — is next.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Matching as max flow | `S→candidates→roles→T`, all capacities 1, reuses Chapter 2's algorithms unmodified. Verified: 5-candidate/5-role incomplete graph gives matching size 5, matching flow = brute force |
| Hall's marriage theorem | A full matching exists iff `\|N(S)\| ≥ \|S\|` for every subset `S` of one side (Philip Hall, 1935) |
| Defect form of Hall's theorem | Maximum matching size `= \|L\| −` (worst deficiency `\|S\| − \|N(S)\|` over all subsets `S`). Verified: deficiency 1 predicts matching size 3, confirmed by both flow and brute force |
| Cost-blind max-flow | Finds *a* maximum matching with zero cost guarantee — verified 38% worse than optimal (18 vs. 13) on a 4×4 cost matrix, since any maximum matching satisfies max-flow's stopping condition equally |
| Minimum-cost augmenting paths | Always augment along the *cheapest* available path (not merely the shortest-by-hops) to build the cheapest matching incrementally, one size-class at a time |
| Potentials (Johnson's trick, reused) | Reduced costs `w(u,v) + h[u] − h[v]` stay non-negative across successive augmentations, keeping Dijkstra valid instead of falling back to Bellman-Ford every round |
| Hungarian algorithm | Kuhn (1955), built on Kőnig (1916) and Egerváry (1931); Munkres (1957) proved `O(n³)`. Verified exactly against brute force on two independent cost matrices (4×4 and a random 5×5) |
| When it breaks | Running `n` augmentations without first confirming a full matching exists forces the algorithm through a forbidden pair — verified: cost jumps to 10,006 and silently includes an incompatible pairing. Check maximum matching size (Hall/flow) before trusting `n` iterations |

## Where We Go Next

The potentials that made the Hungarian algorithm work weren't just a computational trick — they bounded every possible cost from below and were tight exactly at the optimal matching, which is the signature of a *dual* optimization problem hiding behind the original one. That relationship — between an optimization problem (the *primal*) and a bounding companion problem built from the same constraints (the *dual*) — is far more general than matching. The next chapter builds it from scratch: linear programming, the simplex method for solving it, and duality as a structural fact about *any* problem expressible as optimizing a linear objective over linear constraints.

*Next: [04_Linear_Programming_Simplex_Duality.md](04_Linear_Programming_Simplex_Duality.md)*
