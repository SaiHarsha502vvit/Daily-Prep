# Chapter 6 — Evaluating IR Systems

> A ranking nobody has scored isn't good or bad — it's just unexamined. Every worked example in this book so far was chosen because it looked sensible by eye. That's not evidence. It's a demo.

---

## The Problem

Chapters 3 through 5 built three genuinely different ranking mechanisms — TF-IDF with cosine similarity, BM25 and language models, PageRank — and checked each one the same way: build a small corpus, run the formula, look at the resulting order, and confirm it matches intuition. That worked, as a way to verify the *mechanics* were implemented correctly. It is not a way to answer the actual question a search engine team needs answered: **is this ranking good, on a scale that can be measured, compared to a different ranking, and tracked over time as the system changes?**

"Looks sensible on one hand-picked example" doesn't survive contact with reality. A system might rank query `"fox intelligence"` perfectly on Chapter 3's six-document toy corpus and still perform terribly across the millions of real queries an actual search engine sees — and there would be no way to know without a numeric, repeatable way to score a ranking against a known-correct answer. This chapter builds that toolkit: given a ranked list of results and a **ground truth** — a human judgment of what's actually relevant — how do you turn that comparison into a number?

## 6.1 Ground Truth and the Confusion Matrix

Start from the simplest possible setup: a query, a corpus, and a human-provided **ground truth set** — the documents a domain expert has judged genuinely relevant to that query. A retrieval system returns its own set of documents. Comparing the two sets produces exactly four categories, the same **confusion matrix** structure used throughout classification and statistics:

```
                          actually relevant     actually NOT relevant
retrieved by system       True Positive (TP)     False Positive (FP)
NOT retrieved             False Negative (FN)    True Negative (TN)
```

Concretely, on a 10-document corpus with a 5-document ground-truth relevant set `{D1, D3, D4, D7, D9}`, suppose a system retrieves `{D1, D2, D3, D4, D5}`:

```
TP = {D1, D3, D4}   (3 -- retrieved AND actually relevant)
FP = {D2, D5}       (2 -- retrieved but NOT actually relevant)
FN = {D7, D9}        (2 -- actually relevant but NOT retrieved)
TN = {D6, D8, D10}   (3 -- correctly left out)
```

Every one of the 10 documents lands in exactly one category (verified: `3+2+2+3 = 10`, the full corpus). This partition is the raw material every metric in this chapter is built from.

## 6.2 Deriving Precision and Recall

Two different questions can be asked of that confusion matrix, and they are *not* the same question. **"Of what the system returned, how much was actually right?"**

```
precision = TP / (TP + FP) = 3 / (3+2) = 0.6000
```

Sixty percent of what came back was genuinely relevant — the other 40% is noise the user has to wade through. The second question: **"Of everything that was actually relevant, how much did the system find?"**

```
recall = TP / (TP + FN) = 3 / (3+2) = 0.6000
```

The system found 60% of the truly relevant documents and missed the other 40% entirely. These happen to coincide at `0.6` for this particular system, but that's a coincidence of the numbers chosen, not a general property — precision is about the *purity* of what came back, recall is about the *completeness* of what came back, and a system can be strong on one while being weak on the other.

## 6.3 The Precision-Recall Tradeoff

Push both metrics to their extremes on the same ground truth to see the relationship directly:

```
strategy                retrieved   precision   recall
retrieve_everything         10        0.5000     1.0000
retrieve_one_good            1        1.0000     0.2000
retrieve_balanced            5        0.8000     0.8000
system_A (§6.1)               5        0.6000     0.6000
```

Retrieving the *entire* corpus guarantees `recall = 1.0` — every relevant document is trivially included — but precision collapses to `0.5`, since half of everything returned is noise. Retrieving just one document that happens to be correct gives `precision = 1.0` — nothing returned is wrong — but `recall = 0.2`, since it misses 4 of the 5 truly relevant documents. **Precision and recall pull in opposite directions**: being more inclusive (retrieve more) can only help recall and can only hurt or maintain precision; being more selective (retrieve less) works the other way. Neither number alone describes system quality — a precision of `1.0` sounds perfect until you learn it came from returning a single result. Some single number is needed that can't be gamed by leaning entirely on one metric while ignoring the other.

## 6.4 Deriving F1: Why Harmonic Mean, Not Arithmetic

The obvious first attempt at combining precision and recall into one number is their arithmetic mean, `(P+R)/2`. Test it on a deliberately lopsided system — retrieves 1 document, it's correct (`precision = 1.0`), but the ground truth has 5 relevant documents, so 4 are missed (`recall = 0.2`):

```
arithmetic mean = (1.0 + 0.2) / 2 = 0.6000
```

`0.6` reads as a moderately competent system. It is not one — it misses 80% of what a user actually needed, while returning almost nothing at all. The arithmetic mean is fooled because it treats a high score in one dimension as capable of *fully compensating* for a low score in the other, linearly. Sweep recall down while holding precision fixed at a perfect `1.0`, and watch how slowly the arithmetic mean reacts:

```
recall    arithmetic_mean   harmonic_mean(F1)
1.00         1.0000            1.0000
0.50         0.7500            0.6667
0.20         0.6000            0.3333
0.05         0.5250            0.0952
0.01         0.5050            0.0198
```

Even at `recall = 0.01` — a system that finds essentially none of what's relevant — the arithmetic mean still reports `0.505`, barely below its starting point of `0.5`, because precision's perfect `1.0` is propping the average up almost entirely on its own. What's needed is a mean that's **dominated by whichever value is smaller**, so a system can't hide catastrophic weakness in one dimension behind strength in the other. The **harmonic mean** does exactly this:

```
F1 = harmonic_mean(P, R) = 2·P·R / (P+R)
```

Recomputing the same sweep: at `recall = 0.01`, F1 reports `0.0198` — correctly reflecting a nearly useless system, in stark contrast to the arithmetic mean's misleading `0.505`. This is the **F-measure**, introduced by C.J. van Rijsbergen in *Information Retrieval* (2nd edition, 1979), derived there from a more general effectiveness measure that lets recall and precision be weighted differently; F1 is the special case that weighs them equally. The harmonic mean's bias toward the smaller input is exactly the property that makes it the right tool here: a search engine that returns nothing useful is not rescued by also being very precise about the nothing it returns.

## 6.5 Beyond Binary: Cumulative Gain and Its Blind Spot

Precision, recall, and F1 all assume **binary** relevance — a document either counts or it doesn't — and none of them care about **order** within the retrieved set, only membership. Real relevance judgments are usually graded (a document can be highly relevant, marginally relevant, or not relevant at all), and order matters enormously to a real user, who reads top to bottom and rarely reaches result 10.

Try the obvious first fix: score a ranked list by summing the relevance grades of everything retrieved — **Cumulative Gain (CG)**. Take a graded ground truth (0 = not relevant, up to 3 = highly relevant) and two rankings of the *exact same five documents*, in different orders:

```
Ranking A (good order): D4(rel=3), D1(rel=3), D3(rel=2), D2(rel=0), D7(rel=2)
Ranking B (bad order):  D2(rel=0), D3(rel=2), D1(rel=3), D7(rel=2), D4(rel=3)

CG(Ranking A) = 3+3+2+0+2 = 10
CG(Ranking B) = 0+2+3+2+3 = 10
```

Identical — `10 = 10` — even though Ranking A puts the two highly-relevant documents first and Ranking B buries them behind an irrelevant one. CG is just a sum, and sums don't know about order. A metric that can't tell a well-ordered list from a badly-ordered permutation of the *same* documents is unusable for evaluating rankings specifically, as opposed to just evaluating sets.

## 6.6 Deriving DCG: Discounting by Position

The fix has to make a document's contribution depend on *where* it appears, not just *whether* it appears — a relevant document at rank 1 should count for more than the identical document at rank 5. Divide each relevance grade by a discount that grows with rank position:

```
DCG = sum over rank i of  relevance(i) / log2(i + 1)
```

Traced for Ranking A, position by position:

```
rank 1: D4  rel=3   log2(1+1)=1.0000   contribution = 3.0000
rank 2: D1  rel=3   log2(2+1)=1.5850   contribution = 1.8928
rank 3: D3  rel=2   log2(3+1)=2.0000   contribution = 1.0000
rank 4: D2  rel=0   log2(4+1)=2.3219   contribution = 0.0000
rank 5: D7  rel=2   log2(5+1)=2.5850   contribution = 0.7737
                                        DCG(A) = 6.6665
```

The same computation on Ranking B gives `DCG(B) = 4.7838` — now genuinely different, and correctly lower, because Ranking B's highly-relevant documents are discounted more heavily by sitting further down. CG's blind spot is fixed.

Why `log2(i+1)` specifically, rather than a harsher discount like `1/i`? Compare their shapes:

```
rank    1/rank    1/log2(rank+1)
1       1.0000        1.0000
2       0.5000        0.6309
3       0.3333        0.5000
5       0.2000        0.3869
10      0.1000        0.2891
```

`1/rank` cuts a document's value in half the instant it drops from position 1 to position 2 — an unforgivingly steep penalty for the very first step down. `1/log2(rank+1)` discounts far more gently near the top (position 2 keeps `63%` of its value, not `50%`) and only continues shrinking slowly — the same instinct as Chapter 3's `log(N/df)`: treat a meaningful difference (rank 1 vs. rank 2) proportionally, without letting the very first small step already dominate the whole score. A search results page where the best document is at position 2 instead of position 1 is a minor imperfection, not a near-total failure, and the discount function should reflect that.

## 6.7 Normalizing to NDCG

DCG alone still has a problem symmetric to Chapter 3's raw-dot-product issue: its scale depends on how many relevant documents exist and how highly graded they are, so a DCG of `6.6665` on one query and `3.2` on a different query, with different ground truths, can't be compared to each other at all — there's no shared reference point for "good."

Fix it exactly like cosine similarity fixed the dot product: divide by the best possible outcome. **Ideal DCG (IDCG)** is the DCG obtained by putting the highest-relevance documents first, in descending order — the theoretical ceiling for that specific ground truth:

```
IDCG (top 5 by relevance) = 7.1410
NDCG(Ranking A) = 6.6665 / 7.1410 = 0.9336
NDCG(Ranking B) = 4.7838 / 7.1410 = 0.6699
```

`NDCG` (Normalized DCG — Järvelin & Kekäläinen, "Cumulated Gain-Based Evaluation of IR Techniques," ACM TOIS, 2002) now sits on a comparable `0` to `1` scale regardless of how many relevant documents a particular query has or how they're graded: `1.0` always means "the best possible ordering for this ground truth was achieved," making NDCG scores meaningfully comparable *across different queries* — precisely what raw DCG couldn't do.

## 6.8 Averaging Across Queries: Average Precision and MAP

Every metric so far scores a single ranked list against a single ground truth. A search engine needs to be judged across *many* queries at once, and a naive average of, say, precision-at-some-fixed-cutoff across queries throws away exactly the thing DCG was built to capture: *where* in the list the relevant documents landed.

**Average Precision (AP)** fixes this for a single query by computing precision at every rank position where a relevant document actually appears, then averaging those precision values (dividing by the *total* number of relevant documents, so unranked misses still count against the average):

```
Query 1 ranking: [D4, D2, D1, D5, D3]   relevant: {D1, D3, D4}
  rank 1: D4 [RELEVANT]  precision@1 = 1/1 = 1.0000
  rank 3: D1 [RELEVANT]  precision@3 = 2/3 = 0.6667
  rank 5: D3 [RELEVANT]  precision@5 = 3/5 = 0.6000
  AP = (1.0000 + 0.6667 + 0.6000) / 3 = 0.7556
```

Now rank the *exact same three relevant documents*, later in the list:

```
Query 2 ranking: [D2, D5, D1, D3, D4]   relevant: {D1, D3, D4}   (same set, pushed later)
  rank 3: D1 [RELEVANT]  precision@3 = 1/3 = 0.3333
  rank 4: D3 [RELEVANT]  precision@4 = 2/4 = 0.5000
  rank 5: D4 [RELEVANT]  precision@5 = 3/5 = 0.6000
  AP = (0.3333 + 0.5000 + 0.6000) / 3 = 0.4778
```

Same relevant documents, same final precision-at-5 (`3/5 = 0.6` in both cases) — but AP correctly drops from `0.7556` to `0.4778`, because it rewards relevant documents appearing *early*, exactly the position-sensitivity §6.6 built into DCG, using a different mechanism (precision-at-each-hit rather than a log discount). A third query, where both relevant documents land in the first two positions, hits the maximum:

```
Query 3 ranking: [D7, D9, D6, D8, D10]   relevant: {D7, D9}
  AP = 1.0000   (both relevant documents ranked first and second, nothing else missed)
```

**Mean Average Precision (MAP)** is simply the mean of AP across every query in a test set:

```
MAP = (0.7556 + 0.4778 + 1.0000) / 3 = 0.7444
```

MAP became the standard system-level metric through NIST's **TREC** (Text REtrieval Conference), which began in 1992 to give the IR research community large, shared test collections and a uniform scoring procedure (`trec_eval`) for exactly this purpose — comparing entire systems, not single queries, on a level playing field.

## 6.9 When It Breaks: Undefined Metrics and Empty Ground Truth

Every formula in this chapter has a division in it, and every division has a way to hit zero in the denominator. A system that retrieves **nothing at all**:

```
TP = 0, FP = 0
precision = 0 / (0+0)  -> UNDEFINED (0/0)
recall    = 0 / (0+5)  = 0.0000     (well-defined -- correctly reports "found none of the 5 relevant docs")
```

Precision has no meaningful value here — "of what was returned, how much was right?" has no answer when nothing was returned at all — while recall is perfectly well-defined and correctly reports the worst possible score. The two metrics don't fail symmetrically, which is itself worth knowing: a system that returns nothing is unambiguously bad on recall, but precision simply has nothing to measure.

A second, distinct degenerate case: a **query whose ground truth has zero relevant documents at all** (a genuinely unanswerable query, or a broken judgment set):

```
recall = TP / (TP + FN) = 0 / (0 + 0)  -> UNDEFINED (0/0)
```

There is no meaningful "fraction of relevant documents found" when there were never any relevant documents to find. And NDCG inherits the identical problem one level up: if every document in the candidate pool has a relevance grade of exactly 0, `IDCG = 0` (the best possible score for an all-irrelevant pool is nothing), and `NDCG = DCG/IDCG = 0/0` — undefined, for the same structural reason.

None of these are corner cases a real evaluation pipeline can afford to ignore — a large-scale test set with thousands of queries will, with near certainty, include some queries with no known relevant documents and some system runs that return nothing for at least one of them. Every production evaluation script has to make an explicit policy decision for `0/0` (commonly: define it as `0`, or exclude the query from the average entirely, but *silently* returning `NaN` or crashing is a common, real bug) — the math doesn't resolve the ambiguity on its own; a human has to.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Section 6.3's <code>retrieve_balanced</code> strategy scored precision=0.8 and recall=0.8 — both higher than <code>system_A</code>'s 0.6/0.6. Compute F1 for both and confirm F1 preserves this ordering. Then construct (using this chapter's own 5-document ground truth <code>{D1,D3,D4,D7,D9}</code>) a retrieval set with precision=0.75 and recall=0.60 that nonetheless beats <code>retrieve_balanced</code>'s F1 of 0.8 -- or show it's impossible.</summary>

`F1(retrieve_balanced) = 2×0.8×0.8/(0.8+0.8) = 1.28/1.6 = 0.8000`. `F1(system_A) = 2×0.6×0.6/(0.6+0.6) = 0.72/1.2 = 0.6000`. F1 correctly ranks `retrieve_balanced` above `system_A` (`0.8 > 0.6`), matching both underlying metrics' agreement.

For the second part: `F1(P=0.75, R=0.60) = 2×0.75×0.60/(0.75+0.60) = 0.9/1.35 = 0.6667` — this is *lower* than 0.8, not higher, and it's not possible to beat 0.8 with these particular values no matter how they're achieved, because F1 is a fixed function of P and R alone: any pair giving `0.75` and `0.60` produces the same F1 regardless of which specific documents were retrieved. The general lesson: F1 is entirely determined by the precision/recall pair — two systems with identical precision and recall values always have identical F1, even if they retrieved completely different documents to get there. F1 (like every metric in this chapter) is a function of the confusion-matrix *counts*, not of which specific documents landed in which cell.
</details>

<details>
<summary><strong>Q2.</strong> Section 6.6 discounted DCG by rank using <code>log2(i+1)</code>. What would go wrong if the discount were instead <code>log2(i)</code> (dropping the "+1")?</summary>

At `i=1` (the very first result), `log2(1) = 0` exactly — and dividing any relevance grade by zero is undefined, so the very first document in every ranked list, for every query, would break the formula immediately, regardless of how relevant that document is. The `+1` inside the logarithm isn't a cosmetic choice; it's what keeps the discount defined and finite at the position that matters most. This is the same kind of small-but-load-bearing smoothing term as the `+0.5`s inside BM25's IDF formula (Chapter 4, §4.4) — an unglamorous detail that exists purely to prevent a formula from breaking exactly where it's used most.
</details>

<details>
<summary><strong>Q3.</strong> Every metric in this chapter compares retrieved documents to a ground truth by checking document identity or exact relevance labels — implicitly assuming that whether a document "counts" as a match is unambiguous. Chapter 3 already showed a case where that assumption is shaky: "fox" and "foxes" were treated as completely unrelated tokens under simple whitespace tokenization. Could two systems with <em>identical ranking logic</em> receive different precision, recall, or NDCG scores purely because of how their text was tokenized before ranking even started?</summary>

Yes, and this is a real, common source of misleading evaluation numbers, not a hypothetical. Precision and recall are computed from *matches* against a ground-truth relevant set — if System A's preprocessing normalizes "foxes" down to "fox" (so a document about foxes is correctly retrieved and correctly counted as a match) while System B's preprocessing leaves them as distinct tokens (so the identical document, scored by the identical ranking formula, fails to retrieve it at all), System A would show higher recall than System B on any query involving that word pair — even though neither system's *ranking logic* (TF-IDF, BM25, whatever) differs at all. The evaluation numbers this chapter builds are only as trustworthy as the text processing pipeline feeding documents and queries into the ranker in the first place; a bug or a poor choice in tokenization can silently masquerade as a ranking-quality problem, or hide one. This chapter's metrics assumed clean, consistent term matching throughout — Chapter 7 goes back and examines that assumption directly: tokenization, stemming, lemmatization, and stopword removal, and exactly how much they can shift the numbers this chapter just spent so much effort defining precisely.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Confusion matrix | TP/FP/FN/TN partition every document relative to one query's ground truth — the raw material every metric here is built from |
| Precision | `TP/(TP+FP)` — of what was retrieved, how much was right; punished by noise |
| Recall | `TP/(TP+FN)` — of what was relevant, how much was found; punished by omission |
| Precision-recall tradeoff | Verified: retrieving everything maximizes recall (1.0) at precision 0.5; retrieving one correct doc maximizes precision (1.0) at recall 0.2 — pulling in opposite directions |
| F1 (harmonic mean) | `2PR/(P+R)`; verified to correctly flag a P=1.0/R=0.2 system as weak (F1=0.33) where arithmetic mean misleadingly reported 0.6 |
| Cumulative Gain's blind spot | Verified: two orderings of the identical document set scored identically under CG (10=10) — sums don't encode order |
| DCG | Discounts relevance by `1/log2(rank+1)` — verified to correctly separate the same two orderings (6.67 vs 4.78); log discount chosen for being gentle near the top, unlike `1/rank`'s immediate 50% cut at position 2 |
| NDCG | `DCG/IDCG` — normalizes against the best possible ordering for that ground truth, making scores comparable across queries with different numbers of relevant documents |
| Average Precision (AP) | Precision computed at each relevant hit, divided by total relevant count — verified to reward early placement: identical relevant sets scored 0.7556 (early) vs. 0.4778 (same docs, later) |
| MAP | Mean of AP across a query set — the TREC-standardized way to compare whole systems, not single queries |
| Undefined cases | Precision, recall, and NDCG all hit genuine 0/0 cases (empty retrieval, empty ground truth, all-irrelevant pool) — real evaluation pipelines must define a policy for these, not just let them crash or silently propagate NaN |

## Where We Go Next

This chapter assumed something every previous chapter also quietly assumed: that checking whether a retrieved document "matches" a ground-truth relevant document, or whether a query term matches a document term, is unambiguous. Chapter 3 already cracked that assumption once — "fox" and "foxes" didn't match under plain whitespace tokenization — and Question 3 just showed that gap can directly distort the very evaluation numbers this chapter spent nine sections defining precisely. Everything from tokenization onward has been treated as a solved, invisible preprocessing step. Chapter 7 goes back and actually builds it: tokenization edge cases, stemming, lemmatization, and stopword removal — and, in keeping with this course's running theme, the specific queries where each of those choices actively makes retrieval worse, not better.

*Next: [07_Text_Preprocessing.md](07_Text_Preprocessing.md)*
