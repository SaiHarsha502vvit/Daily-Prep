# Chapter 7 — Karger's Min-Cut & Concentration Inequalities: Chernoff Bounds

> Randomness can replace careful bookkeeping if you're willing to ask a different question: not "what's the one right move," but "what fraction of the wrong moves would ruin this — and can I afford to occasionally make one of the many right ones instead?"

---

## The Problem

[A4. Randomized Algorithms](../../../03_Algorithms/A4_Randomized_Algorithms.md) already covers the Las Vegas/Monte Carlo framing, the full expected-`O(n log n)` proof for randomized quicksort, universal hashing, and skip lists and Bloom filters. What it only name-drops — Karger's algorithm gets one line, Chernoff bounds get none — is this chapter's actual subject: a randomized algorithm structurally unlike anything seen so far (no comparisons, no augmenting paths — just repeated random deletion), and a sharper probability tool for exactly the situations where Markov's inequality, already covered in A4, turns out to be far too weak.

## Part A — Karger's Minimum Cut

### 7.1 Random Edge Contraction

Recall the minimum cut from Chapter 2: the smallest total edge-count (here, unweighted) whose removal disconnects a graph. Every deterministic algorithm seen so far for cut-like problems has worked by careful search — augmenting paths, level graphs. Karger's algorithm (David Karger, 1993) does something structurally different: pick an edge **uniformly at random**, **contract** it — merge its two endpoints into one "supernode," keep any resulting parallel edges, discard any resulting self-loops — and repeat until only two supernodes remain. Whatever edges still connect those final two supernodes is the algorithm's answer.

Why would picking edges at random ever find the *minimum* cut? A minimum cut of value `k` is exactly `k` specific edges. As long as random contraction never happens to pick one of *those* `k` edges, the min cut survives intact all the way to the end (its edges never get merged away, since neither endpoint on either side of the cut ever gets absorbed into the other side). The question is just how likely that is.

### 7.2 The Counting Argument

Let `G` have `n` vertices and minimum cut value `k`. Since `k` is the *minimum* over all cuts, isolating any single vertex `v` — a valid cut, with value `deg(v)` — can never do better than `k`, so **every vertex has degree at least `k`**. Summing degrees: `2|E| = Σ deg(v) ≥ nk`, so `|E| ≥ nk/2`.

Fix one specific minimum cut `C` (`k` edges). A uniformly random edge is one of `C`'s `k` edges with probability `k/|E| ≤ k/(nk/2) = 2/n` — so the first contraction destroys `C` with probability at most `2/n`, and preserves it with probability at least `1 − 2/n`.

The same argument applies at *every* subsequent step, not just the first: if `C` has survived so far, it's still a valid cut of the current (contracted) multigraph, with the same value `k` — and any cut of a contracted graph corresponds to a cut of the *original* graph with the same crossing-edge count (contraction only removes edges strictly inside a merged group, never edges that used to cross a still-standing boundary). So if some supernode in the current graph had degree less than `k`, that would be a cut of the *original* graph with value less than `k` — contradicting that `k` is the true minimum. Every supernode, at every stage, still has degree at least `k`. With `m` supernodes remaining, the same counting gives `P(\text{this step destroys } C) ≤ 2/m`.

Multiplying the survival probabilities across all `n − 2` contractions (from `n` supernodes down to `2`):

```
P(C survives) ≥ ∏_{m=3}^{n} (1 − 2/m) = ∏_{m=3}^{n} (m−2)/m
             = (1·2·3···(n−2)) / (3·4·5···n) = 2 / (n(n−1))
```

The product **telescopes**: nearly every factor in the numerator cancels with one in the denominator two steps ahead, leaving just `2/(n(n−1))`. A single run of Karger's algorithm finds a *specific* minimum cut with probability at least `2/(n(n-1))` — small, but a fixed polynomial, not vanishing exponentially.

Verified on a 7-node graph (two dense 4- and 3-vertex clusters joined by a single bridge edge — the unique minimum cut, value 1):

```
Brute-force true min cut = 1
20000 independent trials: empirical success rate = 0.3601
theoretical lower bound 2/(n(n-1)) = 0.0476
empirical >= theoretical bound: True
```

The empirical rate (36%) sits well above the guarantee (4.8%) — expected, since `2/(n(n-1))` is a *worst-case* lower bound that holds for *every* graph, not a typical-case prediction for any specific one. A graph with an obviously sparse bridge cut does much better than the guarantee promises.

### 7.3 Amplification: Repeat and Keep the Best

A `2/(n(n-1))` single-run success rate is too low to trust on its own, but it's a *fixed* probability, not one that shrinks as the algorithm runs longer — which means repetition helps predictably. Run the algorithm `T` independent times, keep the smallest cut found. Using `1 − x ≤ e^{-x}`:

```
P(all T runs miss the true min cut) ≤ (1 − 2/(n(n−1)))^T ≤ e^{−2T/(n(n−1))}
```

Setting `T = (n(n-1)/2) · ln(n)` — `Θ(n² log n)` — drives this failure probability down to `e^{-\ln n} = 1/n`, so the amplified success probability is at least `1 − 1/n`, approaching 1 as `n` grows. Verified on the same bridge graph (`n=7`, so `n²ln(n) ≈ 95`):

```
T=   1: empirical = 0.3560 | worst-case-p formula: 0.0476 (valid, conservative) | actual-p formula: 0.3601 (matches closely)
T=  10: empirical = 0.9895 | worst-case-p formula: 0.3861 (valid, conservative) | actual-p formula: 0.9885 (matches closely)
T=  40: empirical = 1.0000 | worst-case-p formula: 0.8580 (valid, conservative) | actual-p formula: 1.0000 (matches closely)
T=  82: empirical = 1.0000 | worst-case-p formula: 0.9817 (valid, conservative) | actual-p formula: 1.0000 (matches closely)
```

Plugging this graph's *actual* single-run rate (0.3601) into the amplification formula tracks the empirical curve almost exactly — confirming the formula itself is correct — while the *guaranteed worst-case* rate (0.0476) produces a valid but visibly more conservative lower bound throughout, climbing to 0.98 only by `T ≈ n² log n` as promised, never above the true empirical curve. Karger and Stein later showed (1996) that repeating the *entire* contraction from scratch every time is wasteful — the risk of destroying the cut is much higher once few vertices remain than when many do — and a recursive branching strategy achieves the same high-probability guarantee in `O(n² log n)` *total* time, not per trial.

**When it breaks — or rather, an exact corollary of the same proof:** the telescoping argument bounds *any specific* minimum cut's survival probability by `2/(n(n-1))`. Since different minimum cuts correspond to disjoint outcomes of a single run (one run identifies exactly one final pair of supernodes), and probabilities of disjoint events can never sum past 1, **no graph can have more than `n(n-1)/2` distinct minimum cuts** — a purely combinatorial fact, extracted for free from an algorithm's analysis. Verified exactly on a 7-cycle (every vertex degree 2, min cut value 2 — removing *any* two of its seven edges disconnects it):

```
7-cycle: min cut = 2, number of distinct min cuts = 21
n(n-1)/2 = 21
matches bound exactly: True
```

This also explains the cycle's earlier-observed 100% Karger success rate from a different angle: with exactly `n(n-1)/2` distinct minimum cuts on a graph where every possible final pair of supernodes happens to realize *one* of them, literally every run succeeds — there's no way to land anywhere else. The bridge graph, by contrast, has only 1 minimum cut (nowhere near the ceiling of 21) — the bound is a true worst case, achieved by some graphs and not others, exactly like Chapter 6's `(1-ε)` guarantee.

## Part B — Chernoff Bounds

### 7.5 Why Markov's Inequality Isn't Enough

A4 already covers Markov's inequality (`P(X ≥ a) ≤ E[X]/a`) as the basic tool for Las Vegas/Monte Carlo conversions. It's universally valid but often uselessly loose for sums of independent variables, where deviations from the mean are typically far rarer than Markov alone can express:

```
X = heads in 1000 fair coin flips, mu = 500
P(X >= 1.2*mu = 600): Markov bound = 0.8333, true probability = 1.36e-10
P(X >= 1.5*mu = 750): Markov bound = 0.6667, true probability = 6.74e-59
```

Markov's bound barely moves as the threshold rises; the true probability collapses by dozens of orders of magnitude. Something that actually uses *independence*, not just the mean, is needed.

### 7.6 The Moment-Generating-Function Trick

For `X = Σ Xᵢ`, independent indicators with `μ = E[X]`, and *any* `t > 0`: since `e^{tx}` is strictly increasing, `P(X ≥ a) = P(e^{tX} ≥ e^{ta})`, and applying Markov's inequality to the (always-positive) random variable `e^{tX}`:

```
P(X ≥ a) ≤ E[e^{tX}] / e^{ta}
```

Independence turns the expectation of a product into a product of expectations: `E[e^{tX}] = ∏ E[e^{tXᵢ}]`. Each factor, for a Bernoulli(`pᵢ`) variable: `E[e^{tXᵢ}] = 1 + pᵢ(e^t − 1) ≤ \exp(pᵢ(e^t − 1))`, using the standard inequality `1 + x ≤ e^x`. Multiplying these bounds back together: `E[e^{tX}] ≤ \exp(μ(e^t − 1))`, giving, for *every* `t > 0` simultaneously:

```
P(X ≥ a) ≤ exp(μ(e^t − 1) − ta)
```

This holds for any positive `t` — so pick the `t` that makes the bound *tightest*. Setting `a = (1+δ)μ` and minimizing the exponent over `t` (calculus: the minimum occurs at `t = ln(1+δ)`) yields the standard multiplicative **Chernoff bound**:

```
P(X ≥ (1+δ)μ) ≤ [e^δ / (1+δ)^{1+δ}]^μ
```

A looser but more usable simplified form, valid for `0 < δ ≤ 1`: `P(X ≥ (1+δ)μ) ≤ \exp(-μδ²/3)`. Both are named for Herman Chernoff (1952, *Annals of Mathematical Statistics*) — though Chernoff himself credited the specific bounding technique to a colleague, Herman Rubin.

### 7.7 Verifying the Bound Against Reality

Same 1000-coin-flip setup, checked three independent ways — the tight formula, the simplified formula, and both the *exact* binomial tail probability and a genuine 200,000-trial Monte Carlo simulation:

```
delta | threshold | Chernoff (tight) | Chernoff (simple) | exact (binomial) | Monte Carlo | bound holds
 0.05 |       525 |        5.407e-01 |         6.592e-01 |        6.061e-02 |   6.153e-02 | tight:True simple:True
  0.1 |       550 |        8.887e-02 |         1.889e-01 |        8.653e-04 |   9.700e-04 | tight:True simple:True
  0.2 |       600 |        8.331e-05 |         1.273e-03 |        1.364e-10 |   0.000e+00 | tight:True simple:True
  0.5 |       750 |        3.200e-24 |         8.024e-19 |        6.738e-59 |   0.000e+00 | tight:True simple:True
```

Both bound forms hold as genuine upper bounds at every tested `δ`, and the exact binomial tail matches Monte Carlo closely wherever Monte Carlo has any chance of resolving it (`δ = 0.05`: `6.06 × 10⁻²` vs. `6.15 × 10⁻²`). Past `δ ≈ 0.15`, the true probability drops below `10⁻⁶` — meaning a 200,000-sample simulation is *expected* to observe zero occurrences, not a simulation failure. That gap is itself the point: Chernoff bounds (and exact computation, where feasible) let you reason rigorously about tail events far too rare to ever observe by direct simulation, which is exactly the regime where a bound built from independence, rather than sampling, earns its keep.

## Section Challenge

<details>
<summary><strong>Q1.</strong> The min-cut survival argument (§7.2) depends on <em>every</em> vertex having degree at least <code>k</code>. What specifically would break in the telescoping product if only <em>most</em> vertices satisfied this, with a few exceptions?</summary>

The `|E| ≥ nk/2` step sums degree over *every* vertex — a single vertex with degree below `k` would make that sum (and therefore the edge-count lower bound) invalid, which breaks the per-step probability bound `2/m` at exactly the step where that low-degree vertex is still present. Since the final result is a *product* of per-step bounds, one broken factor invalidates the entire telescoping chain, not just the step where it occurs — there's no "mostly holds" version of this argument. The fact that *every* vertex has degree at least `k` isn't a convenient simplifying assumption; it's a direct, unavoidable consequence of `k` being the true minimum over *all* cuts, including every single-vertex one.
</details>

<details>
<summary><strong>Q2.</strong> The Chernoff derivation (§7.6) leaves <code>t</code> free for most of the argument, then optimizes over it right at the end. Why not just pick a reasonable fixed value of <code>t</code> from the start and skip the optimization step?</summary>

The bound `P(X≥a) ≤ exp(μ(e^t−1) − ta)` is valid for *every* `t > 0` simultaneously — each choice of `t` gives a legitimate, but generally different, upper bound. A poorly chosen fixed `t` (say, `t=1` regardless of `δ`) would still produce a *correct* bound, just an unnecessarily loose one for most values of `a`. Optimizing over `t` isn't a matter of correctness — it's what turns "some valid bound" into "the tightest bound this technique can produce," and it's exactly why the exponent in the final formula depends on `δ` in a specific, non-arbitrary way (`t = \ln(1+\delta)`) rather than being left as a free parameter the analyst has to guess.
</details>

<details>
<summary><strong>Q3.</strong> Karger's amplification needed roughly <code>n² log n</code> repetitions — a cost driven entirely by the graph's total <em>size</em>, <code>n</code>. Suppose the real difficulty of a problem instance were controlled by some other number entirely — much smaller than <code>n</code>, and specific to how "hard" that particular instance actually is, rather than how large it is. What would an algorithm whose cost depends on <em>that</em> number, instead of the full input size, look like?</summary>

That's the premise of parameterized complexity: instead of asking "how does runtime scale with input size `n`," ask "how does runtime scale with a specific structural parameter `k` that captures the instance's real difficulty" — and design algorithms whose cost is polynomial in `n` but can be *exponential* in `k` alone, which is a perfectly good deal whenever `k` stays small even as `n` grows large. Nothing about Karger's `n²log n` amplification cost was tied to any such smaller structural parameter — it scaled with the graph's full size because randomized min-cut's difficulty genuinely doesn't have an obvious smaller "hardness knob" to exploit. Problems that *do* have one, and how to build algorithms that exploit it, is next.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Karger's random contraction | Repeatedly merge a uniformly random edge's endpoints until 2 supernodes remain; the crossing edges are the candidate min cut. Karger, 1993 |
| Degree ≥ k fact | Since `k` is the minimum cut value, every vertex (and every supernode, at every contraction stage) has degree at least `k` — else it alone would be a smaller cut |
| Per-step survival probability | `≥ 1 − 2/m` with `m` supernodes remaining, from `|E| ≥ mk/2` and a fixed cut's `k` edges being a `≤2/m` fraction of the total |
| Success probability, telescoped | `P(\text{one run succeeds}) ≥ 2/(n(n-1))` — verified: empirical 36% exceeds the guaranteed-minimum 4.8% on a bridge graph |
| Amplification | `T = Θ(n² \log n)` repetitions (keep the best) drive failure probability to `≤1/n`. Verified: both the worst-case-`p` and actual-`p` formulas match their respective curves exactly; Karger-Stein (1996) achieves this in `O(n²\log n)` total time via smarter recursive branching |
| At most `n(n-1)/2` distinct min cuts | Free corollary of the same proof (disjoint probabilities can't sum past 1) — verified exactly on a 7-cycle (21 distinct min cuts = `n(n-1)/2` exactly) |
| Markov's inequality's weakness | Verified: off by 9–300 orders of magnitude on coin-flip tail probabilities — too weak for sums of independent variables |
| Chernoff bound derivation | Markov applied to `e^{tX}`, independence factors the expectation, `1+x≤e^x` bounds each factor, optimizing over `t` gives `P(X≥(1+\delta)\mu) ≤ [e^\delta/(1+\delta)^{1+\delta}]^\mu`. Chernoff, 1952 |
| Chernoff bound verified | Holds as a true upper bound at every tested `δ`; matches Monte Carlo wherever 200,000 trials can resolve the true probability, and reasons correctly about probabilities far too small to ever observe by simulation |

## Where We Go Next

Karger's amplification cost was driven entirely by the graph's full size `n` — there was no smaller number capturing "how hard this particular instance really is" to exploit instead. Some NP-hard problems do have exactly such a number: a parameter `k`, often much smaller than the input size, that the *real* difficulty scales with. The next chapter builds algorithms explicitly around that idea — fixed-parameter tractability, where cost is polynomial in the input but can be exponential in `k` alone — and the kernelization technique that shrinks an instance down before the expensive part even begins.

*Next: [08_Parameterized_Complexity_FPT_Kernelization.md](08_Parameterized_Complexity_FPT_Kernelization.md)*
