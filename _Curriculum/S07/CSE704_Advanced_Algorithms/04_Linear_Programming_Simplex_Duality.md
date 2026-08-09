# Chapter 4 — Linear Programming: Simplex and Duality

> A linear objective pulled tight over a convex region can only ever snag on a corner — never bulge out mid-face. That single geometric fact is the entire reason optimizing over infinitely many points turns into a search over a finite, countable few.

---

## The Problem

A small workshop makes two products from shared resources — say, desks and chairs, cut from the same lumber and processed on the same machines. Each product earns a different profit and consumes a different mix of the workshop's limited hours. The question: how many of each to produce per week to maximize total profit, without exceeding any resource's available hours?

Every constraint here is linear (twice as many desks needs twice the lumber-hours) and so is the objective (profit scales linearly with quantity). That combination — linear objective, linear constraints — is a **linear program (LP)**, and it looks, at first glance, like it should require checking infinitely many possible production plans.

## 4.1 Standard Form and the Feasible Region

Write the workshop's problem in **standard form**: maximize `cᵀx` subject to `Ax ≤ b`, `x ≥ 0`, where `x` is the vector of decision variables (units of each product), `c` the profit per unit, and each row of `Ax ≤ b` one resource constraint. Concretely:

```
maximize   5x + 4y
subject to 6x + 4y ≤ 24
           x  + 2y ≤ 6
           x, y ≥ 0
```

Each inequality is a **half-space** — everything on one side of a line (or, in higher dimensions, a hyperplane). The **feasible region** — every `(x, y)` satisfying all constraints simultaneously — is the intersection of these half-spaces: a bounded, convex, many-sided shape called a **polytope**. There are infinitely many points in it. Checking all of them directly isn't an algorithm.

## 4.2 Why the Optimum Always Lives at a Vertex

Here's the structural fact that rescues this from being a search over infinity: **for a linear objective over a convex polytope, some vertex (corner) is always at least as good as the true optimum** — meaning the search can be restricted to a finite set of corners without ever losing the best answer.

Why? Take any optimal point `x*` that is *not* a vertex. Not being a vertex means `x*` sits in the interior of some face of the polytope with dimension 1 or higher — a line segment, a flat panel, or higher — so there's some direction `d ≠ 0` along which you can move a little (either way) and stay inside the polytope. The objective along that direction is `c·(x* + td) = c·x* + t(c·d)`, a *linear* function of `t`. If `c·d ≠ 0`, moving `t` in whichever sign makes `c·d` positive strictly *increases* the objective while staying feasible — contradicting that `x*` was optimal. So `c·d` must be exactly 0 along every such direction, meaning the objective is *constant* across that entire face. Push `t` in either direction until you hit the face's boundary (a new constraint becomes tight, dropping into a lower-dimensional face) — the objective hasn't changed. Repeat: each step strictly shrinks the face's dimension, and dimension can't shrink forever, so this process terminates at a vertex — one with the *same* objective value as `x*`. A linear objective can never be strictly better in a face's interior than at that face's corners; at worst, it's tied.

## 4.3 "Just Check Every Vertex" Is Still Exponential

This narrows the search from infinite to finite — real progress — but finite isn't the same as *cheap*. A polytope defined by `m` constraints in `n` dimensions can have as many as `C(m, n)` vertices in the worst case, and even simple, regular shapes get out of hand fast. The `n`-dimensional unit hypercube (`0 ≤ xᵢ ≤ 1` for each of `n` variables — just `2n` constraints) has exactly `2ⁿ` vertices, by definition (every corner is a choice of 0 or 1 per coordinate):

```
n =   2: 2^n vertices = 4
n =   5: 2^n vertices = 32
n =  10: 2^n vertices = 1,024
n =  20: 2^n vertices = 1,048,576
n =  30: 2^n vertices = 1,073,741,824
n =  50: 2^n vertices = 1,125,899,906,842,624
```

Thirty variables — a small LP by real-world standards — already has over a billion vertices to check. Restricting to vertices was necessary, but not sufficient. What's needed is a way to move directly toward a *good* vertex, without visiting the bad ones at all.

## 4.4 The Simplex Method: Walk, Don't Enumerate

The **simplex method** (George Dantzig, 1947 — the linear programming model in June, the simplex method itself in August, developed originally for U.S. Army/Air Force logistics planning) starts at one easy-to-find vertex and *walks* to an adjacent, better vertex, repeating until no adjacent vertex improves further.

Starting vertex: when every constraint is `≤` with non-negative right-hand side (as here), the origin is trivially feasible — add one **slack variable** per constraint (`s₁, s₂ ≥ 0`, representing unused resource capacity) to turn `Ax ≤ b` into `Ax + s = b`, and the all-slack solution (`x = 0`, `s = b`) is an immediate feasible vertex.

Each **pivot** picks an *entering* variable currently held at zero whose increase would improve the objective (a negative entry in the tableau's objective row), and a *leaving* variable determined by a **ratio test** — among constraints where increasing the entering variable would eventually violate feasibility, the *tightest* one determines how far it's safe to go, and that constraint's current basic variable exits. Traced on the workshop LP:

```
  Initial tableau (basis = ['s1', 's2']):
              x        y       s1       s2     RHS
    s1:   6.000    4.000    1.000    0.000    24.000
    s2:   1.000    2.000    0.000    1.000     6.000
  obj :  -5.000   -4.000    0.000    0.000     0.000

  Pivot 1: entering = x, leaving = x
              x        y       s1       s2     RHS
     x:   1.000    0.667    0.167    0.000     4.000
    s2:   0.000    1.333   -0.167    1.000     2.000
  obj :   0.000   -0.667    0.833    0.000    20.000

  Pivot 2: entering = y, leaving = y
              x        y       s1       s2     RHS
     x:   1.000    0.000    0.250   -0.500     3.000
     y:   0.000    1.000   -0.125    0.750     1.500
  obj :   0.000    0.000    0.750    0.500    21.000
```

Two pivots reach `x = 3, y = 1.5`, objective `21` — every objective-row entry is now non-negative, meaning no further pivot can improve, which is the stopping condition. Cross-checked two independent ways: brute-force intersection of every pair of constraint boundary lines (four feasible vertices — `(0,0)→0`, `(4,0)→20`, `(0,3)→12`, `(3,1.5)→21`, confirming `(3, 1.5)` really is the best of all of them) and `scipy.optimize.linprog`, which returns the identical `x=3.0000, y=1.5000, objective=21.0000`. Two pivots visited exactly one intermediate vertex on the way to the optimum, out of only four feasible vertices total here — but on larger problems, the saving over checking every one of billions is the entire point.

**When it breaks:** the ratio test assumes *some* constraint eventually limits the entering variable's growth. If an entire column has no positive entries — every constraint's coefficient on that variable is zero or negative — nothing stops it from growing forever, and the objective grows without bound. On `maximize x + y` subject only to `x − y ≤ 2, x, y ≥ 0` (`y` has no upper limit at all), the ratio test finds no valid pivot row:

```
Tableau simplex correctly detected: unbounded LP
scipy.optimize.linprog status on same LP: 3 (The problem is unbounded.)
```

Both an independent tableau implementation and `scipy`'s solver agree: this LP has no finite optimum, and the algorithm's job is to detect that rather than loop forever hunting for a pivot that doesn't exist.

## 4.5 Duality: A Bounding Problem Hiding Behind Every LP

Suppose someone hands you `x = 3, y = 1.5` and claims it's optimal. Re-running the full simplex method is one way to check — but there's a faster certificate. Take the two constraints, multiply each by some non-negative weight (`u` for the first, `v` for the second), and add them:

```
u·(6x + 4y) + v·(x + 2y) ≤ 24u + 6v
```

If the weights are chosen so the left side's coefficients *dominate* the objective's — `6u + v ≥ 5` and `4u + 2v ≥ 4`, matching each variable's coefficient — then for *any* feasible `(x, y)`: `5x + 4y ≤ (6u+v)x + (4u+2v)y ≤ 24u + 6v`. That's a valid upper bound on the objective, for *any* feasible point, built entirely from the constraints. The natural next question: what's the *best* (smallest, tightest) such bound achievable? That's an optimization problem in its own right — the **dual**:

```
minimize   24u + 6v
subject to 6u +  v ≥ 5
           4u + 2v ≥ 4
           u, v ≥ 0
```

Every primal constraint became a dual variable; every primal variable became a dual constraint, with the constraint matrix transposed and the roles of objective/right-hand-side swapped. Solving it:

```
scipy dual optimum: u=0.7500, v=0.5000, objective=21.0000
Primal optimum (from Part 2): 21.0000
STRONG DUALITY verified (primal opt == dual opt): True
```

The dual's optimum lands on *exactly* 21 — the same as the primal's. This is **strong duality**: at the optimum, the bound isn't just valid, it's *tight*, with zero gap. The weaker, always-true fact (**weak duality** — any feasible dual value bounds any feasible primal value, whether or not either is optimal) holds everywhere, not just at the optimum:

```
primal (x=0,y=0)     value=0.000   |  dual (u=10,v=10) value=300.000  |  dual >= primal: True
primal (x=1,y=1)     value=9.000   |  dual (u=2,v=2)   value=60.000   |  dual >= primal: True
primal (x=2,y=1)     value=14.000  |  dual (u=1,v=1)   value=30.000   |  dual >= primal: True
primal (x=3,y=1.5)   value=21.000  |  dual (u=1,v=0)   value=24.000   |  dual >= primal: True
```

The last row is the interesting one: the primal point is already *at* its true optimum (21), paired with a dual point that's feasible but not yet optimal (24, still above the dual's own best of 21) — the gap between them (3) is exactly the room left for the dual to keep improving down to 21, at which point weak duality's inequality becomes strong duality's equality. This idea traces to a hallway conversation between Dantzig and von Neumann in October 1947, where von Neumann recognized it as equivalent to his own minimax theorem for zero-sum games; an explicit, general proof followed from Gale, Kuhn, and Tucker in 1951.

Chapter 3's Hungarian algorithm potentials were this exact structure in disguise: numbers bounding a cost from below, tight exactly where the primal matching was optimal. That wasn't a coincidence specific to matching — it's what duality looks like whenever the underlying problem can be phrased as an LP.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In the ratio test (§4.4), the leaving variable is chosen by the <em>minimum</em> ratio among rows with a positive entry in the entering column. What breaks if you instead picked a <em>larger</em> valid ratio?</summary>

The ratio at each row is exactly how far the entering variable can increase before *that* row's current basic variable would be driven negative — infeasible. Picking anything other than the minimum means some other row's basic variable gets driven negative first, and the "new vertex" the pivot lands on isn't actually a vertex of the feasible region at all — it violates at least one constraint. The minimum ratio is the only choice that guarantees the pivot lands exactly on the *next* feasible vertex along that edge, not past it.
</details>

<details>
<summary><strong>Q2.</strong> A colleague says: "Why bother constructing the dual at all? Just run simplex and trust its output." What does having the dual give you that the primal's raw output doesn't?</summary>

Simplex's own optimality condition (no negative reduced costs left) is a valid stopping rule, but it's *internal* to the algorithm — trusting it means trusting the implementation. The dual gives an *externally checkable* certificate: independently construct a feasible dual point, evaluate it, and if its value matches the claimed primal value exactly, that's a complete, self-contained proof of optimality via weak duality alone (§4.5) — no need to re-run or trust any particular algorithm. This is also precisely how the Hungarian algorithm's potentials functioned in Chapter 3: a byproduct of the primal computation that doubles as independent proof the primal answer is already optimal.
</details>

<details>
<summary><strong>Q3.</strong> The workshop LP's optimal vertex was <code>(x=3, y=1.5)</code> — half a chair. If chairs can only be built in whole units, is <code>(3, 1.5)</code> rounded to the nearest integer point guaranteed to be the best <em>integer</em> production plan?</summary>

No, and not even close to guaranteed. Rounding `1.5` to `1` or `2` might land outside the feasible region entirely (violating a constraint that was exactly tight at the fractional optimum), or might land safely inside but far from the best *achievable* integer point — there's no general relationship between an LP's fractional optimum and the nearest integer point's quality. The fractional vertex is still useful information (an upper bound on the best possible integer profit, via weak duality's logic extended one step further), but actually finding the best integer solution needs a fundamentally different search over integer points specifically — which is exactly next chapter's problem.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Standard form LP | `max cᵀx` s.t. `Ax ≤ b`, `x ≥ 0` — feasible region is a convex polytope (intersection of half-spaces) |
| Optimum-at-a-vertex | A linear objective can never be strictly better in a face's interior than at that face's corners — some vertex always ties or beats any non-vertex point |
| Vertex enumeration is still exponential | Unit hypercube: exactly `2ⁿ` vertices, verified up to `n=50` (over 10¹⁵) — restricting to vertices helps, but isn't itself cheap |
| Simplex method | Start at an easy vertex (via slack variables), pivot to an adjacent better vertex, stop when no pivot improves. Dantzig, 1947. Verified: 2 pivots reach the true optimum, matching brute-force vertex search and `scipy.optimize.linprog` exactly |
| Ratio test | Picks the *minimum* valid ratio so the pivot lands exactly on the next feasible vertex, not past it |
| Unbounded LP | No positive entry in the entering column means the ratio test never terminates the growth — verified both a custom tableau implementation and `scipy` detect this identically |
| LP duality | Every primal LP has a dual (constraints ↔ variables, transposed matrix) whose feasible values always bound the primal's (weak duality) and whose optimum exactly matches the primal's optimum (strong duality). Verified numerically: both optima equal 21 |
| Dual as certificate | A feasible dual point matching a claimed primal value is a complete, externally-checkable proof of optimality — no need to trust the solving algorithm itself |

## Where We Go Next

Everything here assumed fractional quantities are fine — half a chair is a perfectly good answer to a continuous optimization problem. Real production plans, and many other combinatorial problems, don't allow that: the answer has to be a whole number. Simply rounding the LP's optimal vertex doesn't work, as Q3 above shows — a genuinely different algorithmic idea is needed to search over integer points specifically, while still using the LP's fractional optimum as a guide for how far away the true integer answer could possibly be.

*Next: [05_ILP_Branch_And_Bound_Cutting_Planes.md](05_ILP_Branch_And_Bound_Cutting_Planes.md)*
