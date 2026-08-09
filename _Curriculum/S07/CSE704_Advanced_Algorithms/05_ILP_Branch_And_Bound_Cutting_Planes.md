# Chapter 5 — Integer Linear Programming: Branch and Bound, Cutting Planes

> A fractional chair is not half as useful as a real one — it's useless. The moment "how many" has to be a whole number, the smooth machinery of the last chapter stops handing over a directly usable answer, and what's needed instead is a way to search whole numbers specifically, without giving up the bound that made simplex fast in the first place.

---

## The Problem

Chapter 4 closed on a warning: the workshop's optimal LP solution called for half a chair. Half a chair isn't a rounding inconvenience to shrug off — it's not a chair. Many real decisions are like this by nature: whole items in a knapsack, whole shares of stock, a whole aircraft carrier either gets built or it doesn't. An **integer linear program (ILP)** is exactly Chapter 4's LP, plus the requirement that every (or some) decision variable be a whole number — and that one extra requirement changes everything about how the problem has to be solved.

## 5.1 Why the LP Relaxation's Answer Isn't a Valid Answer

Drop the integrality requirement from an ILP and what's left is its **LP relaxation** — solvable by everything in Chapter 4. The tempting shortcut: solve the relaxation, round the fractional variables, done. It fails in two distinct ways.

**Rounding down can be feasible but leave value on the table.** Three items for a knapsack of capacity 45 — `(value, weight)` pairs `(60,10), (100,20), (120,30)`:

```
LP relaxation optimal x: [1.0, 1.0, 0.5], objective=220.0000
True 0/1 optimum (brute force over 8 subsets): value=180, items=[0, 2]
Rounding the fractional item DOWN: x=[1, 1, 0], weight=30 (capacity=45), FEASIBLE but value=160
(vs true optimum 180 -- leaves 20 on the table)
```

Rounding the half-included third item down to zero is safely feasible, but it's not even the best *feasible* answer — dropping item 1 instead and keeping item 2 whole (items 0 and 2, value 180) beats naive rounding by 20.

**Rounding up can break feasibility outright.** A 7-item instance, capacity 40:

```
LP relaxation optimal x: [1.0, 1.0, 0.0, 0.7333, 0.0, 1.0, 0.0], objective=286.0000
True 0/1 optimum (brute force over 128 subsets): value=280, items=[0, 1, 3]
Rounding the fractional item UP: x=[1, 1, 0, 1, 0, 1, 0], weight used=44 (capacity=40), INFEASIBLE
```

Rounding the `0.7333` up overshoots capacity by 4 units — not a near-miss, a broken constraint. There's no consistent rounding rule that works in general; the LP relaxation's optimum is genuinely useful (it's a provable upper bound — dropping the integrality constraint can only enlarge the feasible region, so the relaxed maximum is never *less* than the true integer maximum), but reading an integer answer off of it directly doesn't work.

## 5.2 Branch and Bound: Search the Integers, Guided by the LP Bound

If the LP relaxation's optimum is always an upper bound on the true ILP optimum, that fact can *prune* a search instead of just disappointing it. **Branch and bound**:

1. Solve the LP relaxation of the current subproblem. Its value is an upper bound on anything achievable within that subproblem.
2. If that bound is no better than the best *integer* solution found anywhere so far (the **incumbent**), stop exploring this subproblem entirely — nothing inside it can possibly beat what's already in hand.
3. If the relaxation's solution happens to already be all-integer, it's a candidate: update the incumbent if it's better, then stop (nothing left to improve within this subproblem).
4. Otherwise, pick a fractional variable `xᵢ = v` and **branch**: create two subproblems, one adding `xᵢ ≤ ⌊v⌋`, the other `xᵢ ≥ ⌈v⌉`. Every integer point in the original subproblem falls into exactly one of these two — nothing is lost — and neither new subproblem's relaxation can ever again land on the exact fractional value `v` that caused the split.

Running this on the 7-item instance from §5.1:

```
branch on x[3] = 0.7333 (relaxation bound 286.0000)
branch on x[1] = 0.8000 (relaxation bound 282.0000)
incumbent: value=280.0, x=[1, 1, 0, 1, 0, 0, 0]
branch on x[6] = 0.0833 (relaxation bound 285.8333)
branch on x[1] = 0.9500 (relaxation bound 283.0000)
branch on x[5] = 0.7500 (relaxation bound 282.5000)
branch on x[4] = 0.0455 (relaxation bound 285.4545)

Branch and bound: value=280.0, solution(x)=[1, 1, 0, 1, 0, 0, 0], nodes explored=13
Matches brute-force optimum: True
```

Thirteen subproblems explored, landing on exactly the brute-force optimum (value 280, items 0/1/3) — instead of all 128 subsets brute force had to check. Every branch not shown above got pruned: its LP bound fell at or below 280 before it could ever produce a better integer answer, so the search never wasted time enumerating the integer points underneath it.

**When it breaks:** the pruning power of branch and bound depends entirely on how *tight* the LP relaxation bound is. If a subproblem's LP relaxation bound stays well above the true achievable integer value inside it — a loose bound, common on adversarially structured instances — nothing gets pruned early, and the search degenerates toward exploring exponentially many nodes, no better than brute force in the worst case. The 13-versus-128 saving above is real but instance-specific; branch and bound's worst-case complexity is still exponential. It works well in practice because LP relaxations are *usually* fairly tight, not because the worst case has been avoided.

## 5.3 Cutting Planes: Gomory's Alternative — Cut, Don't Branch

Branching attacks the fractional solution by splitting the search space around it. Ralph Gomory's alternative, published in 1958 ("Outline of an Algorithm for Integer Solutions to Linear Programs," *Bulletin of the AMS* — motivated in part by a Navy logistics LP whose relaxed solution called for a fractional aircraft carrier): instead of splitting anything, add a single new constraint that surgically excludes the current fractional vertex while provably keeping every integer point in the original region. Re-solve the tightened LP; the new optimum is either integer already, or fractional again but with a strictly tighter bound.

Worked example: `maximize x + y` subject to `2x + 5y ≤ 16`, `6x + 5y ≤ 30`, `x, y ≥ 0` (integers). The LP relaxation's optimal tableau:

```
LP relaxation optimum: x=3.5000, y=1.8000, obj=5.3000
  y row: s1=0.3000  s2=-0.1000   RHS=1.8000
  x row: s1=-0.2500 s2=0.2500    RHS=3.5000
```

Take the fractional row — `y`'s, with `RHS = 1.8`. Split every coefficient and the RHS into integer part plus fractional part (`0.3 = 0 + 0.3`, `−0.1 = −1 + 0.9`, `1.8 = 1 + 0.8`). The key fact: at *any* integer-feasible point, the basic variable and every integer-part term combine to an integer, so the **fractional-part terms alone**, summed over the (always non-negative) nonbasic variables, can never be smaller than the RHS's own fractional part — giving a new valid inequality:

```
Gomory cut: 0.3000*s1 + 0.9000*s2 >= 0.8000
```

At the fractional optimum, both slacks `s1, s2` are exactly 0 (both original constraints are tight there), so the cut's left side is `0 < 0.8` — **violated**, meaning this cut genuinely excludes the current point. Checking it against every integer point actually feasible under the *original* constraints (16 of them, `x` from 0–8, `y` from 0–6):

```
Integer points originally feasible: 16, satisfy the new cut: 16, violate it: 0
```

Zero violations — every integer point that was feasible before remains feasible; only the fractional vertex got cut away. Translated back into `x, y` terms (substituting `s1 = 16−2x−5y`, `s2 = 30−6x−5y`), the same cut reads `6x + 6y ≤ 31`. Re-solving the LP with this one extra constraint added:

```
LP with cut added: x=4.1667, y=1.0000, obj=5.1667
true ILP optimum: 5 at (3, 2)
```

The bound tightened from `5.3` to `5.1667` — real progress, closer to the true integer optimum of `5` — but this single cut didn't reach it outright; the new vertex is fractional again (`x = 4.1667`). Gomory's method repeats: derive a fresh cut from the new fractional tableau, re-solve, repeat — provably terminating at the integer optimum in finitely many rounds. One cut is enough to see the mechanism; reaching convergence is just this same step, applied again.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Branch and bound's pruning relies on the LP relaxation's optimum being a valid upper bound. Why is this true — and what specifically would go wrong if you tried to prune using the value of some arbitrary <em>feasible integer point</em> as the bound instead?</summary>

Dropping the integrality constraint can only ever enlarge a feasible region (every integer-feasible point was already LP-feasible, but not vice versa), and maximizing over a larger region can never produce a smaller optimum — so the LP relaxation's value is guaranteed to sit at or above the true integer optimum, safely usable as an upper bound for pruning. An arbitrary feasible integer point's value gives no such guarantee in the other direction: it's a valid *lower* bound (a candidate incumbent), but using it as if it were an upper bound could prune away subproblems that actually contain a *better* integer solution than the one that happened to be found first — silently discarding the true optimum instead of just wasted search effort.
</details>

<details>
<summary><strong>Q2.</strong> The Gomory cut in §5.3 was built from the <em>fractional parts</em> of the tableau row's coefficients, not the raw coefficients themselves. What would go wrong with a cut built directly from the raw (unrounded) coefficients instead?</summary>

The whole argument for why the cut is *valid* (excludes the fractional point, keeps every integer point) rests on the fact that integer parts of the row's coefficients combine with integer-valued variables to produce something provably integer, leaving only the fractional-part terms to determine whether the sum can dip below the RHS's fractional part. Using the raw, unrounded coefficients throws that structure away — there'd be no guarantee the resulting inequality is even satisfied by every integer point in the region, since the derivation's entire justification (integer combinations of integers stay integer; only fractional remainders are at stake) no longer applies. The cut would very likely be *invalid* — it could cut away real integer solutions along with the fractional one.
</details>

<details>
<summary><strong>Q3.</strong> Both branch and bound and Gomory cuts pursue the exact integer optimum, and both can take exponential time in the worst case (§5.2's "when it breaks"). Suppose a solution guaranteed to be within 5% of optimal, but computed in guaranteed polynomial time regardless of the instance, would be good enough. What fundamentally has to change about the approach to get that guarantee?</summary>

Exact methods can't offer a runtime guarantee independent of the instance, because in the worst case they may need to explore an exponential number of branches (or cuts) before certifying optimality — there's no shortcut around that without sacrificing exactness. Trading exactness for a *provable, bounded* gap from optimal — instead of chasing zero gap at unbounded cost — is a fundamentally different design goal, one that has to be built into the algorithm's structure from the start (rather than bolted onto branch and bound as an early-stopping rule, which would give *some* answer quickly but no guarantee about how far from optimal it is). That guarantee-first mindset, and the machinery that actually delivers it, is next.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Integer linear program (ILP) | An LP plus integrality constraints on some or all variables — Chapter 4's machinery alone can't guarantee an integer answer |
| LP relaxation | The same LP with integrality dropped; always solvable by simplex, and its optimum is a valid bound on the true ILP optimum |
| Naive rounding is unreliable | Verified two ways: rounding down can be feasible but leave value on the table (160 vs. true 180); rounding up can break feasibility outright (weight 44 vs. capacity 40) |
| Branch and bound | Split on a fractional variable (`≤⌊v⌋` / `≥⌈v⌉`), prune any branch whose LP bound can't beat the current best integer solution found. Verified: 13 nodes explored vs. 128 brute-force subset checks, exact match |
| Branch and bound's worst case | Still exponential when the LP bound stays loose — pruning is a practical win, not a worst-case guarantee |
| Gomory cutting planes | A new inequality built from a fractional tableau row's fractional parts, added to tighten the LP without ever removing an integer point. Gomory, 1958 |
| Gomory cut verified | Excludes the fractional optimum (cut value 0 < required 0.8) while every one of 16 originally-feasible integer points satisfies it (0 violations); re-solving tightens the bound from 5.3 to 5.1667, one step toward the true integer optimum of 5 |

## Where We Go Next

Branch and bound and cutting planes both chase the exact optimum, and both inherit the same structural risk: no runtime guarantee that holds across every instance. The next chapter changes the goal itself — instead of insisting on the exact answer regardless of cost, it asks for a solution provably close to optimal (within a chosen error tolerance) in time that's guaranteed polynomial, no matter how the instance is shaped. That trade — a small, controllable gap from perfect, in exchange for a real worst-case runtime bound — is the subject of approximation schemes.

*Next: [06_PTAS_FPTAS.md](06_PTAS_FPTAS.md)*
