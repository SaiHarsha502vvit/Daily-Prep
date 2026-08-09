# Chapter 4 — Probabilistic Retrieval: BM25 & Language Models

> TF-IDF counts. It never asks whether the count is trying to fool it. A document that mentions the right word once, in passing, and a document built entirely out of that one word repeated fifty times look, to a linear sum, like the second one just cares fifty times more.

---

## The Problem

Chapter 3 ended by predicting its own failure. Question 3 of that chapter's Section Challenge asked what would happen if someone padded Document 3 — a document that shares zero terms with the query `["fox", "intelligence"]`, and originally scored exactly 0 — with fifty extra repetitions of the word "fox." The predicted answer was that it would rocket to the top of the ranking. Time to actually do it and check.

```
Doc 3 (original):  "dogs are loyal animals often kept as pets by humans"
Doc 3 (stuffed):    original text + "fox" repeated 50 times
```

Recomputing TF-IDF and cosine similarity for the same query against the corpus with this stuffed Document 3:

```
doc   cosine
3      0.3365   <- stuffed document, now ranked #1
2      0.2406   <- doc 2, the genuine best match from Chapter 3
5      0.2147
1      0.0350
6      0.0323
4      0.0000
```

Confirmed, in real numbers, not just predicted: the stuffed document wins, ahead of the document that actually discusses a fox's intelligence in a real sentence. Nothing in it is a mistake — every weight is computed exactly as Chapter 3 derived. The derivation itself has a hole in it. This chapter finds the hole and closes it.

## 4.1 Locating the Hole: Term Frequency Has No Ceiling

Trace the failure to its source. TF-IDF's document-side weight is `tf(t,d) × idf(t)` (Chapter 3, §3.5). The `idf` factor is fixed once the corpus is fixed — it can't change no matter how many times a term is repeated. That leaves `tf(t,d)`, and Chapter 3 §3.5 already flagged, in an aside, that production systems often use `1 + log(tf)` instead of raw counts for "diminishing returns." Check whether that alone would have been enough:

```
tf     raw tf    1+log(tf)
1        1          1.00
2        2          1.69
5        5          2.61
10      10          3.30
20      20          4.00
50      50          4.91
```

Log-scaling does slow the growth — going from 1 to 50 occurrences multiplies raw `tf` by 50 but only multiplies `1+log(tf)` by about 4.9. But "slower" is not "bounded." `1 + log(tf)` still grows without limit as `tf → ∞`; it just takes a much larger `tf` to reach any given value. A sufficiently determined keyword-stuffer can still win — they just need more than 50 repetitions instead of 50. Diminishing returns that never actually stop returning aren't a fix, they're a delay. What's needed is a function of `tf` that **converges to a fixed ceiling**, so that no amount of repetition, however extreme, can push a single term's contribution past that ceiling.

## 4.2 Deriving Saturation: The k1 Term

The standard way to turn "grows without bound" into "approaches a ceiling" is a **saturating** function — one that starts near-linear for small inputs (where more evidence should still count) and flattens as the input grows large (where more evidence stops being informative). The simplest function with that shape is a ratio of the form:

```
tf / (tf + k)
```

As `tf → 0`, this ratio → 0. As `tf → ∞`, the `+k` in the denominator becomes negligible next to `tf`, and the ratio → 1. At `tf = k` exactly, the ratio is `k/(2k) = 0.5` — the halfway point to the ceiling. `k` controls *where* that halfway point sits: a small `k` means saturation kicks in almost immediately (even 2-3 occurrences are "most of the way" to the ceiling); a large `k` stretches the climb out, staying closer to linear for longer before flattening.

Scale the ceiling to a clean constant by multiplying through by `(k1 + 1)`, and this becomes BM25's term-frequency component:

```
tf-component(t, d) = tf(t,d) × (k1 + 1) / (tf(t,d) + k1)
```

Sweep `tf` from 1 to 100, alongside raw and log-scaled `tf`, for two values of `k1`:

```
tf     raw       1+log(tf)   satur(k1=1.2)   satur(k1=2.0)
1        1          1.00         1.0000          1.0000
2        2          1.69         1.3750          1.5000
5        5          2.61         1.7742          2.1429
10      10          3.30         1.9643          2.5000
20      20          4.00         2.0755          2.7273
50      50          4.91         2.1484          2.8846
100    100          5.61         2.1739          2.9412
```

At `tf = 1`, the saturating component equals exactly `1.0`, matching raw `tf`'s behavior — a document's *first* occurrence of a query term is treated the same way TF-IDF always treated it. From there the two diverge sharply. Pushed to extremes (`tf = 1000`, `100000`, `10000000`), the saturating value converges to `k1 + 1` and stays there:

```
k1=1.2 (asymptote 2.2):   tf=1000 -> 2.197363   tf=100000 -> 2.199974   tf=10000000 -> 2.200000
k1=2.0 (asymptote 3.0):   tf=1000 -> 2.994012   tf=100000 -> 2.999940   tf=10000000 -> 2.999999
```

No matter how large `tf` gets — 50, 5,000, or 5 million — a single term's contribution can never exceed `k1 + 1`. That's the ceiling §4.1 needed: not a slower climb, an actual wall.

## 4.3 Deriving Length Normalization: The b Term

A second, separate problem with raw term frequency: it doesn't account for a document's overall length. A document twice as long as average will naturally rack up higher raw counts for almost every term, purely from having more words to work with — not necessarily from being more focused on any particular topic. This is the same length-bias critique Chapter 3 leveled at the *raw dot product* (§3.7, where documents 1 and 6 tied on raw dot product despite document 6 being proportionally less concentrated on the query) — but here it needs to be handled *before* the saturating ratio, as part of what "counts as a high tf" in the first place.

The fix: compare each document's length `dl` to the corpus's average document length `avgdl`, and use that ratio to inflate or shrink the saturation point itself. For this chapter's 6-document corpus:

```
doc   dl    dl/avgdl
1      9      0.8710
2     12      1.1613
3     10      0.9677
4     10      0.9677
5     10      0.9677
6     11      1.0645
```

(`avgdl = (9+12+10+10+10+11)/6 = 10.3333`.) Replace the plain `k1` in the saturation denominator with `k1` scaled by a blend of "no adjustment" and "full proportional adjustment," controlled by a parameter `b ∈ [0,1]`:

```
length_norm = (1 - b) + b × (dl / avgdl)
```

```
doc   dl/avgdl    b=0      b=0.75    b=1
1      0.8710    1.0000    0.9032   0.8710
2      1.1613    1.0000    1.1210   1.1613
3      0.9677    1.0000    0.9758   0.9677
6      1.0645    1.0000    1.0484   1.0645
```

At `b = 0`, `length_norm` is always exactly `1` — document length has zero effect, same as plain saturation alone. At `b = 1`, `length_norm` equals `dl/avgdl` exactly — full proportional normalization, structurally similar in spirit to Chapter 3's cosine dividing out the entire vector magnitude, but applied only to the saturation denominator rather than the whole score. `b = 0.75` (the field's standard default) blends the two, discounting long documents and crediting short ones, but not all the way to either extreme — unlike cosine similarity, which had no dial at all and *always* normalized length away completely (exactly what let §3.9's content-free stub document hit a perfect score). Folding `length_norm` into the saturation denominator gives BM25's complete term-frequency component:

```
tf-component(t, d) = tf(t,d) × (k1+1) / (tf(t,d) + k1 × ((1-b) + b × dl/avgdl))
```

## 4.4 BM25's Probabilistic IDF, and a Wrinkle

BM25 is usually paired with a variant of IDF derived from a probabilistic model of relevance (the Robertson–Sparck Jones weight, part of what's now called the Probabilistic Relevance Framework — see Robertson & Zaragoza, "The Probabilistic Relevance Framework: BM25 and Beyond," 2009) rather than Chapter 3's plain `log(N/df)`:

```
idf_RSJ(t) = log( (N - df(t) + 0.5) / (df(t) + 0.5) )
```

The `+0.5` terms are a smoothing correction, not the main idea — the core of the formula is still a log-ratio, structurally close to Chapter 3's `log(N/df)`, just built from a term's probability of appearing in a relevant document versus a non-relevant one rather than from raw rarity. Computed on this chapter's own 6-document corpus, though, it exposes an edge case worth seeing directly rather than taking on faith:

```
term            df    idf_RSJ
fox              3     0.0000
intelligence     2     0.5878
the              4    -0.5878
```

`idf_RSJ(fox) = 0.0000` **exactly** — because `fox` occurs in precisely 3 of 6 documents, exactly half the corpus, and the RSJ formula treats a term appearing in exactly half of all documents as carrying zero discriminating power (as likely to show up in a relevant document as not). `idf_RSJ(the)` goes **negative**, because `the` occurs in more than half the corpus (4 of 6) — under this formula's probabilistic reading, that's actual evidence *against* relevance, not just weak evidence for it. This isn't a quirk specific to this toy corpus; it's a documented, known property of the classic RSJ formula, and it gets worse in the keyword-stuffed variant of this same corpus, where padding document 3 pushes `fox` into 4 of 6 documents and its IDF goes negative too.

The practical fix, used by default in production search engines like Lucene and Elasticsearch, is to smooth the ratio before taking the log:

```
idf(t) = log( 1 + (N - df(t) + 0.5) / (df(t) + 0.5) )
```

The `+1` inside the logarithm guarantees the argument is always greater than 1, so the result is always positive:

```
term            df    idf (plus-1 smoothed)
fox              3     0.6931
intelligence     2     1.0296
the              4     0.4418
```

Every worked BM25 computation in the rest of this chapter uses this smoothed form — it keeps the focus on saturation and length normalization (this chapter's actual subject) instead of on IDF edge cases, while still being a real, standard, verifiable choice rather than a simplification invented for this book.

## 4.5 The Full BM25 Formula, Assembled

Put the pieces from §4.2 through §4.4 together — sum the saturated, length-normalized term-frequency component times IDF, across every query term:

```
BM25(d, q) = sum over t in q of  idf(t) × [ tf(t,d) × (k1+1) / (tf(t,d) + k1 × ((1-b) + b × dl/avgdl)) ]
```

With the standard defaults `k1 = 1.2`, `b = 0.75`, computed on the **original, unstuffed** corpus for the query `["fox", "intelligence"]`:

```
doc   BM25
2     1.6161
5     1.0434
1     0.7318
6     0.6753
3     0.0000
4     0.0000
```

Ranking: **doc 2 > doc 5 > doc 1 > doc 6 > doc 3 = doc 4** — the identical relative order Chapter 3's cosine similarity produced on the same clean corpus. That agreement is a useful sanity check: BM25 isn't a wholesale replacement of TF-IDF's judgment, it's a correction to specific failure modes. When there's nothing to resist, it reaches the same conclusions.

## 4.6 BM25 vs. TF-IDF: Head-to-Head on the Stuffed Corpus

Now the real test — the same keyword-stuffed Document 3 from §4.1 (`"fox"` repeated 50 times, `dl = 60`, versus `avgdl = 18.67` for this now-larger corpus):

```
doc   BM25 (stuffed corpus)
2     1.7232
5     1.2710
3     0.9137   <- stuffed document
1     0.5606
6     0.5311
4     0.0000
```

Document 3 moves from a legitimate zero up to **0.9137** — it does now contain "fox," so some credit is correct — but it lands in **third place**, well below documents 2 and 5, not first. Compare to §4.1's cosine result, where the identical stuffed document scored **0.3365 and took first place**, beating document 2's 0.2406. BM25 resisted an attack that TF-IDF and cosine similarity did not.

The mechanism, made explicit: under linear TF-IDF, document 3's `tf(fox) = 50` contributes `50 × idf(fox)` directly to the score — the full raw count. Under BM25's saturating, length-normalized term, that same `tf = 50` contributes only:

```
50 × (1.2+1) / (50 + 1.2×(0.25 + 0.75×60/18.67)) ≈ 2.0679
```

— roughly **2.07**, not 50. A 50-fold repetition gets compressed into a contribution about 24 times smaller than its raw count, safely under the `k1+1 = 2.2` ceiling §4.2 derived, with length normalization (§4.3) contributing a further discount because document 3 is now over three times the corpus's average length. Fifty repetitions of one word simply cannot buy the score that thirty extra genuine words bought document 2.

## 4.7 A Different Framing: Unigram Language Models

BM25 is a carefully engineered scoring heuristic — every term in its formula was derived, in this chapter, to fix a specific observed failure. **Language models** approach ranking from a different direction entirely: instead of engineering a score, model each document as a tiny probability distribution over the vocabulary — literally, "if this document were a biased die for generating words, what does it look like?" — and score a document by **how probable the query would be to arise from that document's distribution**.

The simplest possible per-document distribution is maximum likelihood estimation: a term's probability under document `d`'s model is just its relative frequency in `d`:

```
P(t | d) = tf(t,d) / |d|
```

Score a multi-term query by treating each query term as an independent draw from the document's distribution — the **unigram** assumption — and multiplying:

```
P(q | d) = product over t in q of P(t | d)
```

Computed for the query `["fox", "intelligence"]` on the original corpus:

```
doc   P(fox|d)   P(intelligence|d)   P(query|d)
1      0.1111         0.0000          0.000000
2      0.0833         0.0833          0.006944
3      0.0000         0.0000          0.000000
4      0.0000         0.0000          0.000000
5      0.0000         0.1000          0.000000
6      0.0909         0.0000          0.000000
```

Document 2 — again, the only document containing both query terms — is the only one with a nonzero score at all.

## 4.8 When It Breaks: The Zero-Probability Problem, and Smoothing

Look more closely at that table. Document 5 is genuinely, substantively about intelligence — `P(intelligence|doc5) = 0.10`, the highest of any document — and yet `P(query|doc5) = 0.000000`, tied dead last with documents that mention neither query term at all. The cause: document 5 never mentions "fox," so `P(fox|doc5) = 0` exactly, and multiplying anything by zero gives zero. **One missing query term annihilates the entire score**, discarding every bit of signal the document had for every *other* query term.

This is a sharper, more brutal failure than anything TF-IDF or BM25 produced. TF-IDF degrades gracefully — a missing term just contributes nothing to a sum, leaving whatever the other terms contributed intact. Multiplying probabilities has no such mercy: one zero factor is fatal to the whole product, no matter how strong the rest of the evidence is. For any multi-term query against a real corpus, most documents will be missing at least one query term completely — under raw MLE, the *overwhelming majority* of documents would score exactly zero, and language modeling would degenerate into little more than exact-phrase matching.

The fix is **smoothing**: ensure no term's estimated probability is ever exactly zero, however rare. The simplest version, **Laplace (add-one) smoothing**, pretends every vocabulary term was seen one extra time in every document:

```
P_laplace(t | d) = (tf(t,d) + 1) / (|d| + |V|)
```

With `|V| = 43` (this corpus's vocabulary size):

```
doc   P_laplace(fox|d)   P_laplace(intelligence|d)   product
1        0.038462             0.019231              0.00073964
2        0.036364             0.036364              0.00132231
5        0.018868             0.037736              0.00071200
```

No more exact zeros — every document now gets some nonzero score. But look at documents 1 and 5: Laplace smoothing ranks document 1 (`0.00073964`) fractionally *above* document 5 (`0.00071200`), even though document 1 has nothing to do with intelligence and document 5 is squarely about it. The gap comes down to document 1 being one token shorter, nothing more principled than that — Laplace smoothing adds the same flat pseudo-count to every term regardless of how common or rare that term actually is across the corpus, so it has no way to reflect that "intelligence" is a rarer, more distinctive term than an arbitrary miss on "fox."

**Jelinek-Mercer smoothing** (Jelinek & Mercer, "Interpolated Estimation of Markov Source Parameters from Sparse Data," 1980 — originally for speech recognition, brought into IR by Ponte & Croft's 1998 language-modeling paper and analyzed in depth by Zhai & Lafferty, 2001) fixes that blind spot by interpolating a document's own MLE with the **corpus-wide background frequency** of each term, instead of a flat constant:

```
P_JM(t | d) = λ × P_ML(t | d) + (1 - λ) × P_ML(t | corpus)
```

With `λ = 0.7` and the corpus-wide background probabilities `P(fox) = 0.0484`, `P(intelligence) = 0.0323`:

```
doc   P_JM(fox|d)   P_JM(intelligence|d)   product
1        0.0923           0.0097           0.000893
2        0.0728           0.0680           0.004955
5        0.0145           0.0797           0.001157
6        0.0782           0.0097           0.000756
3,4      0.0145           0.0097           0.000140
```

Full ranking: **doc 2 > doc 5 > doc 1 > doc 6 > doc 3 = doc 4** — every document nonzero, and this time document 5 correctly outranks document 1, because "intelligence" is rarer corpus-wide than "fox" (`0.0323` vs `0.0484`), so a document that matches it gets proportionally more credit than one that matches the more common term. Worth stating plainly: **Laplace and Jelinek-Mercer smoothing don't even agree with each other** on the document-1-versus-document-5 ordering here — flat pseudo-counts and background-frequency-weighted pseudo-counts encode genuinely different assumptions about what an "unseen" term should be worth, and this small corpus was enough to make them disagree. Smoothing fixes the zero-collapse either way, but which smoothing scheme you pick still shapes the answer.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Section 4.2 claimed that BM25's saturating term-frequency component crosses exactly half its ceiling value when <code>tf = k1</code>. Verify this algebraically, and explain in one sentence what that gives you as a practical way to *choose* a value for k1.</summary>

Substitute `tf = k1` into the saturating formula: `tf-component = tf×(k1+1)/(tf+k1)`. With `tf = k1`, this becomes `k1×(k1+1) / (k1+k1) = k1×(k1+1) / (2×k1) = (k1+1)/2` — exactly half the asymptotic ceiling of `k1+1`, for *any* value of `k1`. Verified directly: `k1=1.2 → satur(1.2,1.2)=1.1000 = (1.2+1)/2`; `k1=2.0 → satur(2.0,2.0)=1.5000 = (2.0+1)/2`; `k1=5.0 → satur(5.0,5.0)=3.0000 = (5.0+1)/2`.

Practically, this means `k1` can be chosen directly in units of "how many occurrences of a term should count as a strong signal": if you decide that seeing a term 3 times in a document should already represent roughly half of the maximum credit that term can ever contribute, set `k1 = 3`. `k1` isn't an abstract tuning knob — it's literally the term-frequency value at which saturation is half-complete, chosen once and then fixed for the whole corpus.
</details>

<details>
<summary><strong>Q2.</strong> Section 4.3 derived length normalization (the b parameter) as a fix for documents naturally accumulating higher raw counts by being longer. Recompute §4.6's stuffed-corpus ranking with <code>b = 0</code> (saturation only, no length normalization at all) — does document 3 still fail to reach first place? What does that tell you about which parameter, k1 or b, was actually doing the work of resisting the stuffing attack?</summary>

```
b=0 (saturation only):     doc2=1.4715  doc5=1.0296  doc3=0.9493  doc1=0.4418  doc6=0.4418  doc4=0.0000
b=0.75 (saturation + length norm):  doc2=1.7232  doc5=1.2710  doc3=0.9137  doc1=0.5606  doc6=0.5311  doc4=0.0000
```

Document 3 lands in **third place either way** — `b=0` alone was already enough to keep it out of first place. That's worth being honest about rather than glossing over: for *this specific attack* (fifty repetitions of one term, packed into one document), saturation (`k1`) is doing essentially all of the defensive work, because saturation directly caps how much any single term's repeated occurrence can contribute, independent of document length entirely. Length normalization does still contribute something here — document 3's score drops slightly further, from `0.9493` to `0.9137`, because a 60-token document is well above this corpus's average length — but that's a secondary effect for this particular attack, not the primary one.

This clarifies what each parameter is actually *for*: `k1` defends against any one term being repeated too many times, in a document of any length. `b` defends against a document simply being longer overall — accumulating moderately higher raw counts across *many* terms at once, rather than one term stuffed extremely — which this single-term stuffing example doesn't really test. A document padded with fifty *different*, varied words (rather than one word fifty times) would be a cleaner test of `b`'s specific contribution, and saturation alone would do much less to stop it, since no single term's count would be high enough to trigger heavy saturation.
</details>

<details>
<summary><strong>Q3.</strong> Suppose two documents have <em>identical</em> text — same words, same length, same everything — except one was published on a well-established, carefully-edited reference site and the other was posted anonymously yesterday with no editorial review. Their BM25 scores, and their unigram language-model scores, for any query, would be exactly the same. Is that a bug in this chapter's derivations? What would it take to tell these two documents apart?</summary>

Not a bug — a scope limit, and an honest one. Every formula this chapter derived — TF-IDF, cosine similarity, BM25, unigram language models with any smoothing scheme — is a function of a document's **own text** (and, for IDF, the corpus's text statistics) and nothing else. Two documents with identical text are, by construction, indistinguishable to every one of these formulas, because none of them has ever been given anything besides the text to look at. That's not a flaw in the math; it's a direct consequence of what these formulas were built to measure: term-statistical relevance, and only that.

Telling the two documents apart requires a signal that lives *outside* the document's own text entirely — something about the document's context in a larger structure: which other documents link to it, cite it, or reference it, and how trustworthy *those* documents are in turn. Content-based relevance (everything from Chapter 1 through this chapter) and source authority are simply different questions, and no amount of refining term-frequency formulas will ever answer the second one — it requires looking at the relationships *between* documents, not just inside any one of them. That's exactly where Chapter 5 goes next: link analysis and PageRank.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Keyword stuffing | Verified: padding a zero-relevance document with 50 repeats of one query term made it outrank the genuine best match under TF-IDF + cosine (0.3365 vs 0.2406) |
| Why log-scaled TF isn't enough | `1+log(tf)` grows slower than raw `tf`, but still grows without bound — delayed, not capped |
| Saturation (k1) | `tf×(k1+1)/(tf+k1)` converges to a fixed ceiling `k1+1` as `tf→∞`; verified to converge to within 0.000006 of the ceiling by `tf=10,000,000` |
| Half-saturation point | The saturating term equals exactly half its ceiling when `tf = k1` — gives `k1` a direct, choosable interpretation |
| Length normalization (b) | `(1-b) + b×(dl/avgdl)` scales the saturation denominator by document length relative to the corpus average; `b` is a tunable dial, unlike cosine's all-or-nothing length division |
| BM25's probabilistic IDF | `log((N-df+0.5)/(df+0.5))` can hit exactly zero or go negative for common terms — verified on this chapter's own corpus (`idf(fox)=0`, `idf(the)<0`); the `+1`-smoothed variant fixes this and is the production default |
| BM25 vs. TF-IDF under attack | Verified: the same stuffed document that topped TF-IDF's ranking (0.3365, rank 1) fell to rank 3 under BM25 (0.9137) — saturation compressed a 50x repetition into roughly a 2.07x contribution |
| k1 vs. b, disentangled | Verified via ablation (`b=0`): saturation alone already resisted this single-term stuffing attack; length normalization's distinct job is correcting for genuine overall document-length differences |
| Unigram language models | Score a document by `P(query \| document)`, treating the document as a probability distribution over terms (MLE: `tf(t,d)/|d|`) — a different theoretical framing from BM25's engineered heuristic |
| Zero-probability problem | One query term absent from a document (`P(t\|d)=0`) zeroes the *entire* product score, discarding all signal from every other matching term — more brutal than TF-IDF's graceful degradation |
| Smoothing (Laplace, Jelinek-Mercer) | Both eliminate exact zeros, but can disagree with each other — verified: they ranked two documents in opposite order, because flat pseudo-counts (Laplace) and background-frequency-weighted pseudo-counts (JM) encode different assumptions |

## Where We Go Next

Every formula in this chapter — BM25, unigram language models, however smoothed — is a function of a document's own text and the corpus's aggregate text statistics, and nothing else. Q3 made this concrete: two documents with identical content score identically, no matter how different their real-world trustworthiness might be. That's not a gap this chapter's tools can close by further tuning; it's a boundary built into what term-frequency-based scoring can ever measure. Ranking well against genuinely competitive queries — where hundreds of documents all contain the right words — requires a signal that lives outside any single document's text: which documents the rest of the web considers important enough to link to. Chapter 5 builds that signal from scratch, starting with a simple model of a reader randomly clicking links forever, and derives PageRank.

*Next: [05_Link_Analysis_PageRank.md](05_Link_Analysis_PageRank.md)*
