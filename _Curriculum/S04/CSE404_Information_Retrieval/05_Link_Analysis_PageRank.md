# Chapter 5 — Link Analysis & PageRank

> Two identical essays, word for word — one published by a source the whole field trusts, one posted anonymously an hour ago. Every scoring function in this book so far reads only the words. Reputation was never written in the text.

---

## The Problem

Chapter 4 ended on a boundary, not a bug: BM25 and language models are functions of a document's own text and the corpus's aggregate term statistics, full stop. Two documents with identical content produce identical scores, no matter how different their real-world standing is. Search engines clearly don't have this problem in practice — a well-known reference page reliably outranks an obscure page making the same claims in the same words. Something outside the text itself must be supplying that signal.

The web (and any hyperlinked corpus) has exactly one structure this book hasn't used yet: **which pages link to which**. A link from page A to page B is, in some sense, a vote — A's author chose to point readers at B. This chapter turns that observation into a numeric authority score, using nothing but the link structure, entirely independent of what any page actually says.

## 5.1 The Random Surfer: A Model of "Importance"

The obvious first attempt: count inlinks. A page linked-to by 50 other pages is more important than one linked-to by 2. Try this on a tiny scenario: page X has one inlink, from a page that is itself linked to by hundreds of trusted sources; page Y has ten inlinks, all from obscure pages nobody else links to at all. Raw inlink counting says Y (10 links) beats X (1 link) — but that misses the obvious intuition that a single endorsement from someone important should outweigh ten endorsements from nobodies. **Not all inlinks are equally valuable — an inlink's value should depend on the importance of the page it comes from.**

That's a recursive definition: page X's importance depends on the importance of the pages linking to X, which in turn depends on the importance of *their* inliers, and so on. Recursive definitions are exactly the kind of thing that's hard to compute directly (X's score needs Y's score which needs X's score...) but often has a clean *operational* restatement — a process that can be simulated or iterated instead of solved algebraically in one step.

The operational restatement here is the **random surfer**: imagine a hypothetical reader who starts on some page and, forever, repeatedly clicks a uniformly random outgoing link on whatever page they're currently on. Define a page's importance as **the fraction of time this random surfer spends on that page, in the long run**. This automatically captures the recursive intuition without solving the recursion algebraically: a page gets visited often if pages that are *themselves* visited often link to it — importance flows through links, weighted by how much importance the linking page already has. This is exactly the model behind **PageRank**, introduced by Larry Page, Sergey Brin, Rajeev Motwani, and Terry Winograd in "The PageRank Citation Ranking: Bringing Order to the Web" (Stanford InfoLab technical report, 1999), building on Brin and Page's "The Anatomy of a Large-Scale Hypertextual Web Search Engine" (1998).

## 5.2 From Links to a Transition Matrix

Formalize "uniformly random outgoing link" as a probability. If page `p` has outgoing links to `k` other pages, the random surfer at `p` moves to each of those `k` pages with probability `1/k`. Build a small, hand-traceable link graph — 6 pages, realistic in shape (one small cluster of mutually-referencing pages, a couple of pages pointing in, none pointing back out):

```
A -> B, C      (out-degree 2)
B -> C, A      (out-degree 2)
C -> A         (out-degree 1)
D -> C         (out-degree 1)
E -> D, C      (out-degree 2)
F -> C         (out-degree 1)
```

In-degrees: `A=2, B=1, C=5, D=1, E=0, F=0`. Encode the "move to a random outlink" rule as a transition matrix `M`, where `M[dest][src] = 1/out-degree(src)` if `src` links to `dest`, else 0:

```
        A      B      C      D      E      F
  A   0.000  0.500  1.000  0.000  0.000  0.000
  B   0.500  0.000  0.000  0.000  0.000  0.000
  C   0.500  0.500  0.000  1.000  0.500  1.000
  D   0.000  0.000  0.000  0.000  0.500  0.000
  E   0.000  0.000  0.000  0.000  0.000  0.000
  F   0.000  0.000  0.000  0.000  0.000  0.000
```

Every column sums to exactly 1 (verified) — each page's outgoing probability has to go *somewhere* among its own outlinks. Reading column C: whoever is at C moves to A with probability 1.0 (C's only outlink). Reading row C: C receives probability from A (0.5, since A splits between B and C), from B (0.5), from D (1.0, D's only outlink), from E (0.5), and from F (1.0) — C is clearly the hub of this graph, with five distinct inlinks.

## 5.3 The Power Iteration: Deriving and Running the Update Rule

If `PR` is a vector holding each page's current probability of "where the surfer is right now," then one click forward updates it by exactly one matrix-vector multiplication: `PR_new = M @ PR`. This is the same idea as Chapter 3's vectors, but instead of a static weight, `PR` is a *distribution* that gets repeatedly transformed by the same rule — apply it once, get the distribution after 1 click; apply it again, get the distribution after 2 clicks; and so on. This iterative process is called **power iteration**, and the hope is that it settles into a fixed point — a distribution that stops changing once `M` is applied to it again.

Start uniform (`1/6` on every page, representing "no prior information about which page the surfer starts on"). By hand, for the very first click, reading straight off the transition matrix's rows (§5.2): a page's new probability is the sum, over every page linking to it, of that linker's current probability divided by its out-degree:

```
PR_new(A) = M[A,B]*PR(B) + M[A,C]*PR(C)     = 0.5*0.1667 + 1.0*0.1667 = 0.0833 + 0.1667 = 0.2500
PR_new(B) = M[B,A]*PR(A)                     = 0.5*0.1667                          = 0.0833
PR_new(C) = M[C,A]*PR(A) + M[C,B]*PR(B) + M[C,D]*PR(D) + M[C,E]*PR(E) + M[C,F]*PR(F)
          = 0.5*0.1667 + 0.5*0.1667 + 1.0*0.1667 + 0.5*0.1667 + 1.0*0.1667 = 0.5833
PR_new(D) = M[D,E]*PR(E)                     = 0.5*0.1667                          = 0.0833
PR_new(E) = (nothing links to E)             = 0.0000
PR_new(F) = (nothing links to F)             = 0.0000
```

Every one of those six hand-computed values matches the iteration-1 row below exactly — this *is* what the matrix-vector product `M @ PR` computes for all six pages at once; the hand trace just makes the arithmetic underneath that one line of linear algebra explicit. Continue iterating:

```
iter  0: A=0.1667 B=0.1667 C=0.1667 D=0.1667 E=0.1667 F=0.1667
iter  1: A=0.2500 B=0.0833 C=0.5833 D=0.0833 E=0.0000 F=0.0000
iter  2: A=0.6250 B=0.1250 C=0.2500 D=0.0000 E=0.0000 F=0.0000
iter  5: A=0.3906 B=0.2656 C=0.3437 D=0.0000 E=0.0000 F=0.0000
iter 10: A=0.4478 B=0.2192 C=0.3330 D=0.0000 E=0.0000 F=0.0000
iter 20: A=0.4445 B=0.2222 C=0.3333 D=0.0000 E=0.0000 F=0.0000
iter 40: A=0.4444 B=0.2222 C=0.3333 D=0.0000 E=0.0000 F=0.0000
```

The vector genuinely converges — the change between iterations shrinks toward zero (L1 change drops from 1.0 at iteration 1 to under `10^-10` by iteration 40), and the fixed point `A=0.4444, B=0.2222, C=0.3333, D=E=F=0` matches an independent cross-check via `numpy`'s eigenvector decomposition of `M` (the PageRank vector is, mathematically, the eigenvector of `M` for eigenvalue 1 — a consequence of the Perron-Frobenius theorem for matrices with this structure, which is what guarantees such an eigenvector exists and is non-negative in the first place). This *is* the recursive definition from §5.1, solved — not algebraically, but by simulation: importance settled into values consistent with themselves, with no further solving required.

Why iterate at all, instead of just solving `M @ PR = PR` directly as a linear system? At the scale this algorithm was built for — Brin and Page's original web graph, and modern web graphs are far larger still — `M` has billions of rows and columns. Direct linear-algebra solvers (Gaussian elimination and its relatives) cost roughly `O(n^3)` for an `n x n` matrix, hopelessly out of reach at that size. Power iteration costs `O(n^2)` per iteration for a dense matrix — and in practice far less, because `M` is overwhelmingly sparse (Chapter 1 §1.3's lesson again: most pages don't link to most other pages, so almost every entry of `M` is zero and can be skipped entirely), making each iteration proportional to the number of *links*, not the number of *pages squared*. A fixed number of iterations (rarely more than 50-100 in practice) to reach acceptable convergence is a cost real search engines can actually afford; a single exact solve at web scale is not.

Now settle §5.1's opening claim with this chapter's own numbers instead of a hypothetical: does raw inlink counting actually disagree with PageRank here?

```
page   in-degree   naive rank   PageRank   PageRank rank
A          2            2         0.4444         1
B          1            3         0.2222         3
C          5            1         0.3333         2
D          1            3         0.0000         4
E          0            4         0.0000         4
F          0            4         0.0000         4
```

They disagree at the very top. `C` has the most inlinks of any page in the graph (5, versus `A`'s 2) — naive counting ranks it first — but PageRank ranks `A` first instead, because most of `C`'s inlinks are diluted (split across multiple outlinks by the pages sending them) or come from pages that themselves carry little accumulated importance, while `A` receives one full, undivided vote from `C` and sits inside the closed, mutually-reinforcing trio identified in §5.4. Section Challenge Q1 works through exactly why in more depth — the short version is that §5.1's recursive-weighting intuition was necessary, not just elegant: a simpler, non-recursive heuristic gives a genuinely different, less discriminating answer on this exact graph.

## 5.4 When It Breaks: The Rank Sink

Look again at that converged result: `D = E = F = 0.0000`, **exactly**, not just small. Three perfectly normal pages, each with at least one real outlink, end up with *zero* long-run importance. Diagnose why, mechanically:

`E` has **zero inlinks** — nothing points to it at all. Whatever probability mass `E` starts with (its share of the initial uniform `1/6`) flows *out* along `E`'s outlinks on the very first click and is never replenished, since nothing ever links to `E` again. `E`'s rank is exactly 0 after iteration 1. `D`'s only inlink is `E` — so once `E`'s contribution dries up (after iteration 1), `D` stops receiving anything too, and `D`'s own remaining mass drains out through its one outlink (to `C`) by iteration 2. `F`, like `E`, has zero inlinks, and meets the same fate on the first click.

Meanwhile `A`, `B`, and `C` link only to *each other* (`A→B,C`; `B→C,A`; `C→A`) — every page in `{A,B,C}` can reach every other page in `{A,B,C}` by following links, and **no link from any of them leaves the set**. In Markov chain terms, `{A,B,C}` is a *closed recurrent class*: once the surfer enters it, they can never leave, so probability mass entering `{A,B,C}` stays there forever, while `{D,E,F}` — which only feed *into* the cluster and never receive anything back — are *transient*: any mass they start with eventually drains away for good. This is a **rank sink**: a closed subgraph that traps probability mass no matter how the rest of the graph is connected to it, silently zeroing out every page outside the trap over enough iterations. It didn't require an adversarial or contrived graph — this is what happens by default whenever *any* subset of pages happens to link only within itself, which is common in real link graphs (a cluster of pages on one site that never link externally, for instance).

## 5.5 A Purer Case: The Two-Page Sink, and a Third Pathology — Periodicity

Distill the rank sink down to its simplest possible shape: two pages, `X` and `Y`, that link *only* to each other (`X → Y`, `Y → X`) and nowhere else, spliced into an otherwise-larger version of this chapter's graph (one existing page, `F`, redirected to point into `X` instead of `C`). Running power iteration and watching `X` and `Y` specifically:

```
iter  1: X=0.2500  Y=0.1250
iter  2: X=0.1250  Y=0.2500
iter  3: X=0.2500  Y=0.1250
iter  4: X=0.1250  Y=0.2500
...
iter 100: X=0.1250  Y=0.2500
iter 101: X=0.2500  Y=0.1250
iter 102: X=0.1250  Y=0.2500
```

This is not converging — it's **oscillating forever**, flipping between `(X=0.25, Y=0.125)` and `(X=0.125, Y=0.25)` on every single click, with no sign of settling even after 100 iterations. The *combined* mass `X+Y` is rock-steady at `0.375` on every iteration (a two-page trap holding more than a third of the entire graph's rank, out of eight pages total), but individually, neither page ever reaches a stable value at all. The reason is structural: with only one link out of `X` (to `Y`) and one out of `Y` (to `X`), any mass on `X` moves to `Y` *entirely*, every single step, and vice versa — a perfect, undamped alternation, the graph-theoretic equivalent of a system with period exactly 2. A rank sink traps mass in the wrong *place*; a periodic sink like this one additionally refuses to settle into any single place at all, even within the trap.

This is a **third**, distinct pathology beyond the rank sink and the dangling node — and, conveniently, it turns out the same fix (§5.7) resolves this one too, though it takes noticeably more work to do so, as §5.8 verifies directly.

## 5.6 When It Breaks, Continued: The Dangling Node and Total Mass Leakage

A second, distinct failure. Add a seventh page `G` that has **no outlinks at all** (a PDF, an image, a page that was never finished — "dangling nodes" are common on the real web), and give `C` a link to it: `C -> A, G` (splitting `C`'s one existing outlink into two).

```
A -> B, C    B -> C, A    C -> A, G    D -> C    E -> D, C    F -> C    G -> (none)
```

`G`'s column in the transition matrix is **entirely zero** — a surfer who lands on `G` has no rule for what happens next, because `G` has nothing to click. Run the same power iteration and watch the *total* probability mass, which should always sum to 1 if the surfer is always somewhere:

```
iter  0: sum = 1.000000
iter  1: sum = 0.857143
iter  2: sum = 0.785714
iter  5: sum = 0.357143
iter 10: sum = 0.124163
iter 20: sum = 0.014913
iter 30: sum = 0.001791
```

The total is *strictly decreasing*, and it isn't settling — checking the ratio between consecutive sums from iteration 10 onward: `0.8090, 0.8090, 0.8090, 0.8090, ...`, a constant ratio, meaning the decay is **geometric** and will continue toward zero for as many iterations as this runs. Every unit of probability that reaches `G` simply vanishes — `G`'s zero column means none of it is ever redistributed to any other page. This is a different failure from §5.4's rank sink: a rank sink *misallocates* mass (concentrates it in the wrong place) while conserving the total; a dangling node **destroys** mass outright. Left unfixed, the random-surfer model doesn't just give a wrong answer — it doesn't converge to any meaningful distribution at all, because there's decreasingly little probability left to distribute.

## 5.7 Deriving the Fix: The Damping Factor

All three failures trace back to the same root cause: the random surfer, as modeled so far, is a **prisoner of the link graph** — it can only ever do what an outgoing link permits, whether that's getting trapped in a closed loop forever (§5.4), oscillating forever inside a periodic trap (§5.5), or falling off the edge of a dangling node into nothing (§5.6). The fix has to give the surfer some way to escape *any* structural trap, regardless of what the graph looks like.

**Teleportation**: with probability `d`, the surfer follows a random outgoing link, exactly as before. With probability `(1-d)`, the surfer ignores the current page's links entirely and jumps to a **uniformly random page anywhere in the graph.** This single change fixes all three failures at once:

- **Rank sink (§5.4):** a surfer trapped in `{A,B,C}` still has a `(1-d)` chance, every single click, of teleporting back out to `D`, `E`, or `F` — the trap is no longer absorbing, because there's always a way out that doesn't depend on any link existing.
- **Periodicity (§5.5):** a surfer bouncing strictly between `X` and `Y` now has a `(1-d)` chance, every click, of breaking the strict alternation entirely by jumping elsewhere — destroying the perfect period-2 pattern that caused the oscillation, not just diluting it.
- **Dangling node (§5.6):** a surfer landing on `G` has no outlinks to follow, so — by convention — treat that as if `G` teleports unconditionally (its entire probability mass gets redistributed uniformly to every page, the same as the `(1-d)` teleport step, rather than vanishing).

The updated rule, with `n` total pages:

```
PR_new = d × (M @ PR + dangling_mass/n) + (1-d)/n
```

where `dangling_mass` is however much probability currently sits on dangling nodes (redistributed uniformly, per the convention above), and the `(1-d)/n` term is the flat teleportation probability added to *every* page on *every* iteration, regardless of link structure.

Check that this formula actually preserves the "always sums to 1" invariant §5.6 showed the undamped version violating — not by re-running the code, but algebraically, from the formula itself. Suppose `PR` currently sums to exactly 1. Every non-dangling column of `M` sums to 1 (§5.2), so `M @ PR`'s total equals `(1 - dangling_mass)` — the dangling nodes' share never entered `M @ PR` at all, since their columns are all zero. Summing the full update rule over all `n` pages:

```
sum(PR_new) = d × (sum(M @ PR) + dangling_mass) + (1-d)
            = d × ((1 - dangling_mass) + dangling_mass) + (1-d)
            = d × 1 + (1-d)
            = 1
```

Exactly 1, regardless of how much mass was dangling — the `+ dangling_mass/n` term is doing exactly the work needed to plug the leak §5.6 found, and the algebra confirms it does so completely, not just approximately. This is why the fix has two distinct pieces (redistribute dangling mass, *and* add flat teleportation) rather than one: the teleportation term alone would still leave dangling nodes discarding their own mass every round.

The standard choice for `d` is `0.85`, originating with Brin and Page's original system. It isn't an arbitrary round number: their stated motivation was the informal observation that a person tends to follow a chain of about six links before restarting somewhere new — `1/6 ≈ 0.167`, close to the `(1-d) = 0.15` restart probability that `d=0.85` implies — combined with a practical trade-off, since a damping factor closer to 1 more faithfully reflects the raw link structure but makes the power iteration converge markedly slower, while a damping factor closer to 0 converges fast but relies increasingly on uniform teleportation rather than the actual graph. `0.85` is documented in the literature as an empirical compromise between those two pressures, not a value derived from a proof.

That "closer to 1 converges slower" claim is directly checkable, not just asserted — re-run the main graph's power iteration at several damping values and count iterations to convergence:

```
d          iterations to converge
0.50              23
0.70              31
0.85              38
0.90              41
0.95              44
0.99              46
```

Monotonic, and roughly doubling from `d=0.5` to `d=0.99` — confirming the trade-off directly rather than taking Brin and Page's stated reasoning on faith. The intuition behind the slowdown: teleportation is what breaks the graph's own slow-mixing structure (§5.5's periodicity, §5.4's near-absorption); the smaller `(1-d)` is, the weaker that corrective force is on each individual step, so it takes more steps for its effect to fully propagate through the graph and reach a stable fixed point.

## 5.8 Verifying the Fix

Re-run every broken graph, and the original, with `d = 0.85`:

**Periodic sink (§5.5), damped:**

```
Final (162 iterations to converge): X=0.182432  Y=0.173818   (stable -- no longer alternating)
```

The oscillation is genuinely gone — `X` and `Y` settle into distinct, stable values instead of swapping every click, because the `(1-d)` teleport chance breaks the rigid two-step alternation that caused it. Notice the cost: this graph took **162 iterations** to converge, versus 34-38 for the other two graphs fixed below — periodicity turned out to be the hardest of the three pathologies for damping to fully overcome, consistent with §5.7's point that convergence speed is exactly what's traded away as a graph's structure gets further from "well-mixed."

**Dangling-node graph (§5.6), damped:**

```
iter  1: sum = 1.000000
iter  5: sum = 1.000000
iter 10: sum = 1.000000
iter 20: sum = 1.000000
Final (34 iterations to converge): A=0.2331 B=0.1415 C=0.3071 D=0.0605 E=0.0424 F=0.0424 G=0.1730
```

Total mass stays at exactly `1.0` on *every* iteration — the leak from §5.6 is completely sealed, because `G`'s mass is now redistributed instead of discarded.

**Main graph (§5.3-§5.4), damped:**

```
Final (38 iterations to converge): A=0.3898 B=0.1907 C=0.3339 D=0.0356 E=0.0250 F=0.0250
```

`D`, `E`, and `F` — zeroed out completely without damping — now hold small but genuinely positive rank. They're still ranked last, correctly (they really do have the weakest position in the link structure — `E` and `F` still have no inlinks at all, damping doesn't manufacture inlinks out of nothing), but they're no longer erased entirely. `A` and `C` remain the top two pages in both the damped and undamped versions — damping adjusted the *precise* values and rescued the trapped/leaked pages, but it didn't overturn which pages were genuinely most central to the link structure. That consistency is itself a useful check: damping is a correction for pathological edge cases, not a wholesale replacement for what the link structure says.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In this chapter's main graph, page C has 5 inlinks — more than any other page — yet the converged PageRank ranks A above C (0.4444 vs. 0.3333, undamped; 0.3898 vs. 0.3339, damped). If PageRank rewards being linked-to, why doesn't the page with the most inlinks win?</summary>

Raw inlink *count* was exactly the naive first attempt §5.1 rejected — PageRank weighs each inlink by the importance of the page it comes from, not just by how many there are. C's five inlinks come from A (which splits its vote between B and C, so C only gets half of A's weight), B (also split, half-weight), D, E (also split with D), and F — several of these are only *partial* votes, and several of the linking pages (D, E, F) don't have much importance themselves once the link structure is followed through (§5.4 showed D, E, F end up with the least rank in the whole graph). A, by contrast, receives a *full, undivided* vote from C (C's only outlink) plus a split vote from B — and critically, A is part of the closed, mutually-reinforcing trio `{A,B,C}` that retains rank rather than leaking it elsewhere. Five diluted, partly-low-value votes can total less than two votes from pages that are themselves central and undivided. This is exactly the recursive-weighting behavior §5.1 set out to capture: it's not how many pages link to you, it's how much accumulated, undiluted importance flows to you.
</details>

<details>
<summary><strong>Q2.</strong> Section 5.7 derived teleportation as "jump to a uniformly random page." Suppose instead the fix had been defined as "jump back to the page the surfer started the entire walk on" (a single fixed restart page, not a uniform jump to anywhere). Would this still fix the rank sink and dangling-node failures? What would be different about the result?</summary>

It would still technically fix both failures in the narrow sense of guaranteeing convergence: as long as the fixed restart page can reach every other page (directly or through chains of links), the surfer is no longer permanently trapped in a closed loop or lost at a dangling node, since there's always a nonzero-probability path back out through repeated restarts. Mass would stop leaking and stop concentrating totally in a sink, the same structural guarantees as uniform teleportation.

What would change is *what the resulting scores mean*. Uniform teleportation treats every page as an equally plausible "fresh start," so the resulting PageRank reflects the link structure's own intrinsic shape, uninfluenced by any single page being special. Restarting at one fixed page would inject a permanent bias toward that page and whatever it (and only it) links to — pages reachable quickly from the restart page would be systematically favored over pages that are just as well-linked-to from everywhere else in the graph but happen to be many clicks from the fixed restart point. The result wouldn't be measuring general "importance in the link graph" anymore; it would be measuring "importance, as seen from one specific page's point of view" — a legitimate and actually-used technique (called "personalized PageRank," useful when you *want* results biased toward a particular topic or starting point), but a different question than the one this chapter set out to answer.
</details>

<details>
<summary><strong>Q3.</strong> This chapter's PageRank scores depend only on link structure — not on the query, and not on document content at all. If PageRank were the *only* ranking signal a search engine used, what would go wrong, and how does that connect back to Chapter 4?</summary>

A pure link-structure ranking would return the same ordering of pages for every query — the most-linked-to pages in the whole graph would always rank first, whether the query was about cooking, cryptography, or anything else, because PageRank never looks at what the query actually asked for. That's the exact mirror image of Chapter 4's boundary: BM25 and language models measure query-relevance but are blind to authority; PageRank measures authority but is blind to query-relevance. Neither one alone is sufficient — a search engine needs *both* signals combined (commonly: use BM25 or a similar content score to find and rank documents that actually match the query, then use PageRank as an additional weighting factor to break ties or boost trustworthy sources among the relevant candidates). Having built both halves separately, in Chapters 3-4 and this chapter, the next open question this course hasn't addressed yet is different: given a ranking — whichever signals produced it — how would you even measure, numerically, whether it's a *good* ranking? That's Chapter 6.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Content-only ranking's blind spot | BM25/language models score identical text identically regardless of source authority — link structure is the untapped signal |
| Random surfer model | Importance = long-run fraction of time a surfer clicking uniformly random outlinks forever would spend on a page; operationalizes a recursive "importance from important linkers" definition |
| Transition matrix | `M[dest][src] = 1/out-degree(src)` if linked; every column sums to 1 — encodes "where does a click from here go" |
| Power iteration | `PR_new = M @ PR`, repeated from a uniform start, converges to a fixed point — verified against an independent eigenvector computation |
| Rank sink | A closed, mutually-linking subset of pages traps probability mass permanently; pages outside it (with no path back in) verified to converge to *exactly* zero |
| Periodicity | A minimal 2-page mutual-link trap never converges at all — verified perpetual oscillation between two states, forever, even though the *combined* trapped mass stays constant |
| Dangling node | A page with zero outlinks has an all-zero matrix column; probability mass reaching it is discarded, not redistributed — verified geometric decay of total mass (ratio 0.8090/iteration) toward zero, not just a one-time loss |
| Damping factor | With probability `d`, follow a link; with probability `(1-d)`, teleport uniformly to any page — guarantees an escape route from any trap, fixing all three failures at once |
| Mass conservation, proven | Algebraic check confirms the damped update rule sums to exactly 1 regardless of dangling mass — the `+dangling_mass/n` term is specifically what plugs the leak, not teleportation alone |
| d = 0.85 | An empirical compromise (Brin & Page): closer to 1 more faithfully reflects link structure but converges slower; the value traces to an informal "~6 links before restarting" heuristic, not a derived optimum |
| Convergence speed varies by pathology | Verified: the periodic trap took 162 iterations to converge under damping, versus 34-38 for the rank-sink and dangling-node graphs — periodicity was the hardest failure mode to fully damp out |
| Damping preserves ranking, fixes edge cases | Verified: A and C stayed the top two pages with or without damping; damping rescued D/E/F from exact zero without overturning the graph's genuine structure |

## Where We Go Next

This chapter and the two before it built three different ways to produce a ranked list — TF-IDF/cosine similarity, BM25 and language models, and now PageRank — and each was verified, on hand-built examples, to behave sensibly and to fail in specific, diagnosable ways. But "sensible-looking on one worked example" and "actually good" are not the same claim, and nothing so far has defined what "good" even means in a way that could be measured, compared across systems, or improved against. Chapter 6 builds that missing piece: precision, recall, F1, NDCG, and MAP — a toolkit for scoring a ranking itself, numerically, against what's actually relevant.

*Next: [06_Evaluating_IR_Systems.md](06_Evaluating_IR_Systems.md)*
