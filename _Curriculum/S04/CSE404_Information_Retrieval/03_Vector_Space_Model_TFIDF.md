# Chapter 3 — The Vector Space Model & TF-IDF

> Ask a librarian for books about foxes and she doesn't hand you every book that contains the word "fox," in a random pile. She hands you the one that's actually *about* foxes first. Chapters 1 and 2 built the pile. This chapter builds the ordering.

---

## The Problem

Take the six-document corpus this chapter will use throughout:

```
Doc 1: "the quick brown fox jumps over the lazy dog"
Doc 2: "the fox is a wild animal known for its intelligence and cunning"
Doc 3: "dogs are loyal animals often kept as pets by humans"
Doc 4: "wild animals such as foxes and wolves live in forests"
Doc 5: "the intelligence of dogs has been studied extensively by researchers"
Doc 6: "a quick fox and a clever dog met in the forest"
```

Query: **"fox intelligence."** Run this as Boolean OR (Chapter 1) — any document containing at least one of the two terms — and the result is `{1, 2, 5, 6}`. Chapter 2's tolerant retrieval doesn't change the shape of the answer, only how forgiving the term-matching is before the set gets built.

That's the entire output: a set of four document IDs, unordered — or rather, ordered however the postings lists happened to be stored, which carries no meaning at all. But these four documents are not equally good answers. Document 2 is *about* a fox's intelligence — both query words in one coherent sentence. Document 1 mentions "fox" once, in a sentence about nothing else in the query. Document 6 mentions "fox" once too, in an unrelated scene. Document 5 doesn't mention "fox" at all — it matched purely on "intelligence," and it's about dogs. A human skimming these four would rank document 2 first without hesitation. Nothing built so far can produce that ordering, because nothing built so far computes a *number* per document — only a yes/no per term.

This chapter builds that number.

## 3.1 From Set Membership to a Score: Why Boolean Can't Rank

The gap is structural, not a missing feature that could be bolted on. A postings list (Chapter 1) records *that* a term occurs in a document — not how many times, not where, not how that compares to the rest of the document or the rest of the corpus. Boolean AND/OR/NOT combine these yes/no facts into bigger yes/no facts. At no point does a quantity enter the computation. You cannot sort by a property the computation never calculated.

What's needed is a function `score(document, query)` that returns a real number, computed from properties of the document and the query, such that sorting documents by that number produces a sensible ranking. The rest of this chapter derives one, in stages, checking at each stage whether the score actually behaves the way "relevance" should.

## 3.2 First Cut: Term Frequency

The simplest possible signal: a document that mentions a query term *more* is more likely to be about it than one that mentions it once, or not at all. Define **term frequency** `tf(t, d)` as the raw count of term `t` in document `d`, and score a document against a multi-term query by summing `tf` over the query terms:

```
score(d, q) = sum over t in q of tf(t, d)
```

Raw counts for the query `["fox", "intelligence"]` across the corpus:

```
doc   fox   intelligence   score
1      1         0           1
2      1         1           2
3      0         0           0
4      0         0           0
5      0         1           1
6      1         0           1
```

(Verified in Python by tokenizing each document on whitespace and counting.) Ranking by this score: **doc 2 (2) > doc 1 = doc 5 = doc 6 (1) > doc 3 = doc 4 (0).** Document 2 — the one actually about a fox's intelligence — correctly comes out on top. Promising.

*(Weighting terms by frequency this way traces back to Hans Peter Luhn's "A Statistical Approach to Mechanized Encoding and Searching of Literary Information," IBM Journal of Research and Development, 1957 — one of the earliest attempts to make word frequency, rather than manual indexing by a human, the basis for judging what a document is about.)* Worth noting in passing: document 4 talks about "foxes" (plural) but scores zero on the query term "fox" (singular) — whitespace tokenization treats them as unrelated dictionary entries, exactly the exact-match rigidity Chapter 2 built structures around. Term frequency doesn't fix that; it inherits it. (Chapter 7 covers stemming, which would unify them.)

## 3.3 Why Raw TF Over-Weights Common Words

Term frequency treats every occurrence of every term as worth the same one point, regardless of *which* term it is. Push that assumption to its breaking point: build a query out of the single most common word in the corpus, `the`, alongside the genuinely informative term `intelligence`.

```
doc   the   intelligence   score
1      2         0           2
2      1         1           2
3      0         0           0
4      0         0           0
5      1         1           2
6      1         0           1
```

Ranking by raw TF sum: **doc 1 = doc 2 = doc 5, three-way tie at the top (score 2).** That's wrong in an obvious way: document 1 is "the quick brown fox jumps over the lazy dog" — it says nothing whatsoever about intelligence — and it's tied for first place with document 2 and document 5, which are genuinely about intelligence, purely because "the" happens to occur twice in document 1. A word's raw frequency in one document says nothing about whether that word is *useful for distinguishing this document from the rest of the corpus* — and "the" is a terrible discriminator precisely because it occurs in almost everything. Term frequency, alone, has no way to represent "this word doesn't tell you much" — it only counts occurrences, and two occurrences of an uninformative word outscore one occurrence of an informative one every time.

## 3.4 Inverse Document Frequency: Weighting by Rarity

The missing signal is: **how many different documents does this term even occur in?** A term that shows up in every document can't help distinguish among them; a term that shows up in only one or two documents is doing real discriminating work whenever it appears. Define **document frequency** `df(t)` — the count of documents containing `t` at least once (not the total occurrence count — one mention or twenty in a single document both count as `df` of 1 for that document) — and look at it across a handful of terms in this corpus (`N = 6` documents):

```
term            df    N/df    log(N/df)
the              4    1.500     0.4055
fox              3    2.000     0.6931
dog              2    3.000     1.0986
intelligence     2    3.000     1.0986
animal           1    6.000     1.7918
```

(Full 42-term vocabulary table verified in Python — every value above is `df` counted directly from the corpus and `log(N/df)` computed from it.) The intuition: `the` occurs in 4 of 6 documents — almost useless for telling documents apart — while `animal` occurs in only 1 — highly specific. The raw ratio `N/df` already captures "rarer terms get bigger numbers": `the` gets 1.5, `animal` gets 6.0.

Why take the *log* of that ratio instead of using `N/df` directly, or the simpler `N - df`? Because of how these three candidates behave as a term gets progressively rarer. Sweep `df` downward by repeated halving, at `N = 1024` for clean numbers:

```
df=512  N/df=  2.00  N-df= 512  log(N/df)=0.6931
df=256  N/df=  4.00  N-df= 768  log(N/df)=1.3863   (+0.6931 vs previous halving)
df=128  N/df=  8.00  N-df= 896  log(N/df)=2.0794   (+0.6931 vs previous halving)
df= 64  N/df= 16.00  N-df= 960  log(N/df)=2.7726   (+0.6931 vs previous halving)
df= 32  N/df= 32.00  N-df= 992  log(N/df)=3.4657   (+0.6931 vs previous halving)
df= 16  N/df= 64.00  N-df=1008  log(N/df)=4.1589   (+0.6931 vs previous halving)
df=  8  N/df=128.00  N-df=1016  log(N/df)=4.8520   (+0.6931 vs previous halving)
```

`N - df` grows by a shrinking fraction of the total each halving — nearly flat once `df` is already small, so it barely distinguishes "rare" from "extremely rare." Raw `N/df` *doubles* every halving — it explodes without bound as `df → 1`, so a term appearing in 1 document out of a million would get a weight in the millions, dwarfing every other term in the score. `log(N/df)`, by contrast, increases by *exactly the same constant amount* — `ln 2 ≈ 0.6931` — every time `df` halves. That's not a coincidence to be spotted empirically; it falls straight out of the logarithm identity `log(N/df) = log N − log(df)`, and `log(df)` itself drops by `log 2` every time `df` is cut in half. The log turns a *multiplicative* notion ("half as common") into an *additive* one (a fixed weight bump) — bounded, smooth, and it treats "1 in a million" as meaningfully but not infinitely more informative than "1 in a thousand," instead of letting the rarest term's weight run away and dominate every other term in the score.

That gives **inverse document frequency**:

```
idf(t) = log(N / df(t))
```

*(This formula — weighting a term by the log of the inverse fraction of documents it appears in — is due to Karen Spärck Jones, "A Statistical Interpretation of Term Specificity and Its Application in Retrieval," Journal of Documentation, 1972. It's one of the most cited ideas in the field, and it's worth appreciating how little machinery it needed: nothing here required anything beyond counting and a logarithm.)*

## 3.5 TF-IDF: Combining Both

Multiply the two signals — how often a term occurs in *this* document, times how rare it is *across* documents:

```
tfidf(t, d) = tf(t, d) × idf(t)
```

Re-score the `["the", "intelligence"]` query from §3.3 with TF-IDF instead of raw TF. Recall `idf(the) = log(6/4) = 0.4055` (common, low weight) and `idf(intelligence) = log(6/2) = 1.0986` (rarer, higher weight):

```
doc   tfidf(the)   tfidf(intelligence)   sum
1       0.8109            0.0000        0.8109
2       0.4055            1.0986        1.5041
3       0.0000            0.0000        0.0000
4       0.0000            0.0000        0.0000
5       0.4055            1.0986        1.5041
6       0.4055            0.0000        0.4055
```

New ranking: **doc 2 = doc 5 (1.5041) > doc 1 (0.8109) > doc 6 (0.4055) > doc 3 = doc 4 (0).** This is the fix, verified directly against §3.3's broken ranking: document 1 is now correctly pushed *below* documents 2 and 5 — its two occurrences of "the" are worth only `2 × 0.4055 = 0.8109`, less than a single occurrence of the far more informative "intelligence" (`1 × 1.0986`). TF-IDF didn't just rescale the old ranking; it changed the *order*, because it's measuring something raw TF structurally couldn't: not just "how often," but "how often, weighted by how much that particular word's presence actually tells you."

*(One further refinement worth knowing, though the worked examples in this chapter use raw counts for traceability: production systems often use log-scaled term frequency, `1 + log(tf)`, instead of raw `tf`. Raw counts treat the jump from 1 to 2 occurrences as identical in weight to the jump from 20 to 21 — both "+1" — which overstates how much a 21st occurrence of a word should matter. Log-scaling gives diminishing returns per additional occurrence: `1 + log(1) = 1.0`, `1 + log(2) = 1.693`, `1 + log(4) = 2.386` — the first doubling adds 0.693, but doubling again from 16 to 32 adds only from 3.773 to 4.466, a smaller absolute jump for the same relative increase. Same shape of argument as §3.4's case for `log(N/df)`, applied to the other half of the formula.)*

## 3.6 From Weights to Vectors: The Vector Space Model

`tfidf(t, d)` is a single number for one term in one document. Compute it for *every* term in the vocabulary, for a given document, and the result is a vector — one coordinate per vocabulary term, most of them zero (a document only contains a small fraction of the whole vocabulary; the same sparsity observation as Chapter 1 §1.3, one representation up). Represent the query the same way: a vector over the same vocabulary, with `tf` counted from the query text itself.

Made concrete, dropping zero coordinates (the corpus vocabulary has 42 distinct terms; each document only touches 7-12 of them):

```
Doc 1 = "the quick brown fox jumps over the lazy dog"
Doc 1 vector (nonzero dims): {brown: 1.7918, dog: 1.0986, fox: 0.6931, jumps: 1.7918,
                               lazy: 1.7918, over: 1.7918, quick: 1.0986, the: 0.8109}

Doc 2 = "the fox is a wild animal known for its intelligence and cunning"
Doc 2 vector (nonzero dims): {a: 1.0986, and: 0.6931, animal: 1.7918, cunning: 1.7918,
                               for: 1.7918, fox: 0.6931, intelligence: 1.0986, is: 1.7918,
                               its: 1.7918, known: 1.7918, the: 0.4055, wild: 1.0986}
```

(Verified in Python — each weight is exactly `tf(t,d) × log(N/df(t))` from §3.4's IDF table.) Every dimension not listed is implicitly 0 for that document — a 42-dimensional vector with only 7 or 12 nonzero entries. Notice `fox` gets the identical weight (`0.6931`) in both vectors — same term, same corpus-wide IDF, and both documents happen to mention it exactly once — while `the` gets a *different* weight in each (`0.8109` in doc 1, where it occurs twice, versus `0.4055` in doc 2, where it occurs once): the TF part of the weight is local to each document even though the IDF part is shared.

Now documents and queries are points in the same `|vocabulary|`-dimensional space — the **vector space model**, introduced by Gerard Salton, A. Wong, and C. S. Yang in "A Vector Space Model for Automatic Indexing," Communications of the ACM, 1975. Scoring a document against a query becomes a *geometric* question: which document vectors sit closest to the query vector?

## 3.7 Ranking via Cosine Similarity

The obvious geometric distance measure is the **dot product**: multiply matching coordinates and sum. Querying `["fox", "intelligence"]` (query vector: `fox → 0.6931`, `intelligence → 1.0986`, everything else 0) against the full TF-IDF document vectors:

```
doc   dot(d,q)   |d|      cosine
1      0.4805   4.0489    0.0913
2      1.6874   4.8999    0.2651
3      0.0000   4.9082    0.0000
4      0.0000   4.6217    0.0000
5      1.2069   4.8008    0.1935
6      0.4805   4.3824    0.0844
```

Ranking by raw dot product alone: `doc 2 (1.6874) > doc 5 (1.2069) > doc 1 = doc 6 (0.4805, tied) > doc 3 = doc 4 (0)`. Look at that tie: documents 1 and 6 get the *exact same* dot product, because both contain "fox" exactly once and neither contains "intelligence" — the dot product only sees the query-matching coordinates. But document 1 has 9 tokens total and document 6 has 11, including a repeated filler word (`a`, twice); document 1's content is proportionally *more* concentrated on matching the query than document 6's. Raw dot product is blind to that difference — like raw TF in §3.3, it rewards absolute quantity, and a longer document accumulates a larger vector (`|d| = 4.3824` for doc 6 versus `4.0489` for doc 1) without necessarily being more relevant per word.

The fix is the same shape as IDF's fix for raw TF: **normalize.** Divide the dot product by the magnitudes of both vectors:

```
cosine(d, q) = dot(d, q) / (|d| · |q|)
```

Geometrically, this is exactly the cosine of the angle between the two vectors — it measures *direction* (what a document is proportionally about) independent of *length* (how much text it contains). Recomputed: `cosine(doc 1) = 0.0913` versus `cosine(doc 6) = 0.0844` — the tie breaks, correctly favoring the shorter, more topically concentrated document. Full ranking by cosine: **doc 2 (0.2651) > doc 5 (0.1935) > doc 1 (0.0913) > doc 6 (0.0844) > doc 3 = doc 4 (0)** — the same relative order as the dot product almost everywhere, except for exactly the case normalization was built to fix.

Fully expanded, by hand, for document 2 against the query — using §3.6's 12-dimensional vector directly, not just the summary numbers:

```
dot(doc2, query) = doc2[fox]*query[fox] + doc2[intelligence]*query[intelligence]
                  = 0.6931*0.6931 + 1.0986*1.0986
                  = 0.4805 + 1.2069
                  = 1.6874
(every other one of doc2's 12 nonzero dimensions is multiplied by the query's 0 there and drops out)

|doc2| = sqrt(1.0986^2 + 0.6931^2 + 1.7918^2 + 1.7918^2 + 1.7918^2 + 0.6931^2
            + 1.0986^2 + 1.7918^2 + 1.7918^2 + 1.7918^2 + 0.4055^2 + 1.0986^2)
       = sqrt(1.2069 + 0.4805 + 3.2104 + 3.2104 + 3.2104 + 0.4805
            + 1.2069 + 3.2104 + 3.2104 + 3.2104 + 0.1644 + 1.2069)
       = sqrt(24.0086) = 4.8999

|query| = sqrt(0.6931^2 + 1.0986^2) = sqrt(0.4805 + 1.2069) = sqrt(1.6874) = 1.2990

cosine(doc2, query) = 1.6874 / (4.8999 * 1.2990) = 1.6874 / 6.3649 = 0.2651
```

Every one of document 2's 12 dimensions contributes to the *norm* — the document's own "size" in vector space — but only the 2 dimensions the query actually asks about (`fox`, `intelligence`) contribute to the *dot product*. That asymmetry is the entire mechanism in one place: the numerator rewards matching the query, the denominator accounts for everything else the document contains, whether or not the query cares about it.

**Why cosine, specifically, and not some other normalized distance?** The other obvious candidate from geometry is **Euclidean distance** — the straight-line distance between the tips of the two vectors, `sqrt(sum((d_i - q_i)^2))`, ranking documents by *smallest* distance instead of largest similarity. Compute it on the same corpus and query:

```
doc   euclidean_dist   cosine_sim
1        4.1376          0.0913
2        4.7245          0.2651
3        5.0772          0.0000
4        4.8008          0.0000
5        4.7245          0.1935
6        4.4645          0.0844
```

Ranking by smallest Euclidean distance: **doc 1 (4.1376) > doc 6 (4.4645) > doc 2 = doc 5 (4.7245, tied) > doc 4 (4.8008) > doc 3 (5.0772).** This is a *badly wrong* ranking by every measure this chapter has built: it puts documents 1 and 6 — one stray mention of "fox" each, nothing about intelligence — **ahead of** document 2, the one genuinely comprehensive match. The reason is exactly the flaw raw dot product had, in a different guise: Euclidean distance accumulates a penalty from *every* coordinate where the two vectors differ, including all the dimensions where the query is (correctly) zero but the document has real content. A document that talks about more things than the query mentions racks up distance for every one of those extra topics, even though none of them are irrelevant to the document itself — they're just outside the query's scope. Longer, more substantive documents get penalized by Euclidean distance precisely *for having more content*, which is close to the opposite of what a ranking function should reward.

A direct stress test confirms it: pad document 3 (currently zero-relevance — it shares no query terms at all) with 20 extra repetitions of an **irrelevant, non-query word**, `"forest"`:

```
Doc 3 before padding: 10 tokens, euclidean = 5.0772, cosine = 0.0000
Doc 3 after padding:  30 tokens, euclidean = 22.5512, cosine = 0.0000
```

Euclidean distance nearly quadruples — 5.08 to 22.55 — purely from adding repeated *irrelevant* content that has nothing to do with the query. Cosine similarity doesn't move at all: `0.0000` before and after, because document 3 still shares zero query-term dimensions with the query regardless of how much unrelated padding surrounds them, and direction depends only on the shared dimensions' proportions, not on how much else is going on. Euclidean distance conflates "irrelevant" with "far away"; cosine correctly treats "irrelevant" as simply having no bearing on direction. That's the actual argument for cosine over Euclidean distance here — not convention, but that Euclidean distance actively penalizes exactly the kind of substantive, on-topic-but-broader content a good document should be allowed to have.

## 3.8 Worked Trace: Does the Final Ranking Make Sense?

Reading the cosine ranking back against the actual document text is the sanity check this whole chapter has been building toward:

```
1. Doc 2 (0.2651) — "the fox is a wild animal known for its intelligence and cunning"
2. Doc 5 (0.1935) — "the intelligence of dogs has been studied extensively by researchers"
3. Doc 1 (0.0913) — "the quick brown fox jumps over the lazy dog"
4. Doc 6 (0.0844) — "a quick fox and a clever dog met in the forest"
5. Doc 3 (0.0000) — "dogs are loyal animals often kept as pets by humans"
5. Doc 4 (0.0000) — "wild animals such as foxes and wolves live in forests"
```

Document 2 — the only document that pairs "fox" with "intelligence" in one coherent statement — wins, by a clear margin. Document 5 — no "fox" at all, but substantively about intelligence — outranks the two documents that mention "fox" only in passing (1 and 6). Documents 3 and 4 correctly score zero: neither literal query term appears in either (recall from §3.2 that document 4's "foxes" doesn't match the query's "fox" under exact tokenization). This is the payoff of the whole derivation: a numeric score, built from term frequency corrected by document rarity and normalized for document length, produces an ordering a human would actually agree with — something Boolean retrieval structurally could not produce at all.

It's also worth checking this ranking against where the chapter started. "The Problem" ran this same query as Boolean OR and got the unordered set `{1, 2, 5, 6}` — and, sure enough, those are exactly the four documents that scored *above* zero here, with documents 3 and 4 (outside the Boolean OR set) correctly scoring exactly zero. TF-IDF and cosine similarity didn't contradict Boolean retrieval's notion of "matches at all" — they **refined** it, taking the same four-document set Boolean OR produced and finally answering the question Boolean logic had no way to ask: in what order?

## 3.9 When It Breaks: The Stub Document That Games Cosine Similarity

Cosine similarity fixed the length bias in §3.7 by dividing out vector magnitude entirely. Push *that* fix to its own extreme: add a seventh "document" to the corpus that is nothing but the query terms themselves.

```
Doc 7: "fox intelligence"
```

Two words, no sentence, no actual content — closer to a tag or a placeholder than a real document. Recompute cosine similarity for the same query, `["fox", "intelligence"]`, with document 7 included (`N` is now 7, which shifts every IDF value slightly, so the whole corpus was rescored, not just document 7):

```
doc   dot(d,q)   |d|      cosine
1      0.3132   4.4554    0.0692
2      1.0311   5.2840    0.1922
5      0.7179   5.1855    0.1363
6      0.3132   4.8672    0.0634
7      1.0311   1.0154    1.0000
```

`cosine(doc 7) = 1.0000` — a perfect score, the maximum cosine similarity possible — and it **outranks every real document in the corpus**, including document 2, the genuine best match from §3.8. The mechanism is exactly what makes cosine similarity work in the first place, taken to its limit: document 7's vector points in *precisely* the query's direction because it contains *nothing but* the query terms — there's no other content to pull its direction away from perfect alignment. Cosine similarity measures proportional composition, not absolute substance, and a document that is 100% query terms and 0% anything else will always win that particular contest, regardless of whether it actually says anything.

This isn't a bug in the arithmetic — every number above is correct, exactly as derived. It's a mismatch between what cosine similarity *measures* (directional alignment) and what "relevance" actually requires (substantive, sufficient discussion of the topic, not just narrow alignment). A two-word stub and a genuinely informative paragraph can point in the same direction in vector space while being wildly different in how useful they are to a reader. Nothing in the vector space model as built so far can tell them apart — doing so requires a way to weigh document length as a *feature* of its own, not just something to normalize away completely. That's precisely the tension Chapter 4's BM25 resolves with a tunable length-normalization parameter, instead of TF-IDF's all-or-nothing division by `|d|`.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Using this chapter's 6-document corpus, compute the raw-TF-sum ranking and the TF-IDF-sum ranking for the single-term query <code>["dog"]</code> (<code>df(dog) = 2</code>, for docs 1 and 6 — doc 3/5 use "dogs" and doc 6 uses "dog", check the exact tokens). Do the two rankings actually differ for a <em>single-term</em> query, and why or why not?</summary>

First, the exact token check: "dog" (singular, exact match) appears in doc 1 ("...the lazy dog") and doc 6 ("...a clever dog met..."). Doc 3 and doc 5 use "dogs" (plural) — a different token under exact tokenization, so they score zero on the literal query `["dog"]`, same lesson as document 4 and "foxes" in §3.2.

```
doc   tf(dog)   idf(dog)=log(6/2)=1.0986   tfidf(dog)
1        1              1.0986               1.0986
6        1              1.0986               1.0986
(all others: 0)
```

Raw-TF ranking: `doc 1 = doc 6` (both score 1) `> everyone else (0)`. TF-IDF ranking: `doc 1 = doc 6` (both score 1.0986) `> everyone else (0)`. **The rankings are identical in relative order** — for a single-term query, IDF multiplies every nonzero score by the *same* constant (`idf(dog)`, a fixed number once the term is fixed), and multiplying an entire ranking by one positive constant never changes the order, only the scale. IDF only changes rankings — as it did in §3.5 — when a query has **multiple terms with different IDF values**, because then it's not a uniform rescaling, it's a re-weighting of how much each term contributes *relative to the others*.
</details>

<details>
<summary><strong>Q2.</strong> Section 3.9's stub document scored a perfect cosine similarity of 1.0 against the query. Could a document with a raw dot product of zero ever achieve a positive cosine similarity? Could a document score the maximum cosine of 1.0 while containing query terms that appear in different proportions than the query itself?</summary>

First part: no. `cosine(d,q) = dot(d,q) / (|d|·|q|)`. If `dot(d,q) = 0`, the numerator is zero regardless of what the denominator is (as long as it's nonzero), so cosine is exactly 0 — this is exactly what happened to documents 3 and 4 throughout this chapter's worked examples, which share no query terms with `["fox","intelligence"]` at all. A zero dot product means the two vectors have no overlapping nonzero dimensions among the terms that matter, and no amount of normalization can turn "zero shared weighted terms" into a positive similarity.

Second part: no, and this is the precise reason document 7 scored exactly 1.0 rather than something merely high. Cosine similarity equals 1.0 only when the two vectors point in *exactly* the same direction — one is a positive scalar multiple of the other. If a document's query-term proportions differed at all from the query's own proportions (e.g., it weighted "fox" much more heavily relative to "intelligence" than the query does), the vectors would point in *slightly different* directions, and cosine would land somewhere below 1.0, however close. Document 7 hit exactly 1.0 because it contains only the query terms in a form that, after TF-IDF weighting, scales to precisely the query's own direction — not approximately, exactly. Any additional content, or any different ratio between "fox" and "intelligence," would have pulled it strictly below the maximum.
</details>

<details>
<summary><strong>Q3.</strong> TF-IDF's term-frequency component grows <em>linearly</em> — a document mentioning "fox" 20 times gets exactly twice the TF contribution of one mentioning it 10 times, with no upper limit. Construct the failure this implies: what would happen to this chapter's ranking if someone padded Document 3 (currently scoring zero on <code>["fox","intelligence"]</code>) by appending the word "fox" fifty times?</summary>

Padding document 3 with fifty extra occurrences of "fox" changes `tf(fox, 3)` from 0 to 50 (and shifts `df(fox)` from 3 to 4, since document 3 now contains it too, which slightly *lowers* `idf(fox)` for every document — a side effect of TF-IDF's global statistics being corpus-wide). Document 3's new TF-IDF score for "fox" alone becomes roughly `50 × idf(fox)` — a number far larger than any other document's score, since no genuine document in this corpus mentions "fox" more than once. Document 3 — which still says nothing about intelligence, and originally scored zero — would rocket to the top of the ranking, ahead of document 2, the actual best match.

This is keyword stuffing, and TF-IDF as derived in this chapter has no defense against it: nothing caps how much a single term's repetition can contribute, so raw repetition count directly and unboundedly inflates rank. The fix has to come from *outside* what this chapter built — some function that keeps rewarding a second or third occurrence of a term, but increasingly discounts the fortieth and fiftieth, so that no realistic amount of repetition can single-handedly dominate a score the way genuine multi-term relevance (like document 2's balanced mention of both query terms) does. That's precisely BM25's saturation behavior, and constructing it — starting from exactly this keyword-stuffing failure — is where Chapter 4 begins.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why Boolean can't rank | Postings-list membership is yes/no per term; no quantity is ever computed, so nothing exists to sort by |
| Term frequency (TF) | Raw count of a term in a document — a first cut at "relevance," but weighs every term's occurrence equally regardless of how informative that term is |
| TF's flaw | A common, uninformative word (`the`) can tie or beat a rare, on-topic word (`intelligence`) purely on occurrence count — verified: raw TF tied doc 1 with docs 2 and 5 |
| Document frequency (df) | Count of documents containing a term at least once — the missing signal for "how discriminating is this term across the corpus" |
| Inverse document frequency | `log(N/df(t))` — log turns "df halves" into a constant additive weight bump (`ln 2` exactly), avoiding both `N-df`'s flatness and raw `N/df`'s unbounded blowup as df → 1 |
| TF-IDF | `tf(t,d) × idf(t)` — occurrence count, discounted by how common the term is corpuswide; verified to correct §3.3's broken ranking |
| Vector space model | Every document and query becomes a sparse vector over the full vocabulary, TF-IDF-weighted per dimension — turns ranking into a geometry problem |
| Raw dot product | Favors longer/higher-magnitude documents for reasons unrelated to relevance — verified: two documents with identical query-term counts still had different scores before normalization |
| Cosine similarity | `dot(d,q)/(\|d\|·\|q\|)` — normalizes by vector length, measuring proportional direction instead of absolute magnitude; fixed the length-bias tie in the worked example |
| Cosine's own failure mode | A document containing *only* the query terms can hit a perfect 1.0 cosine score and outrank genuinely informative documents — direction without substance |

## Where We Go Next

Two cracks appeared in this chapter's own derivation, both pointing the same direction. First, §3.9: cosine similarity's all-or-nothing length normalization lets a content-free stub of just the query terms out-rank real documents — dividing by document length completely erases any distinction between "concise and relevant" and "too short to say anything." Second, Q3: TF-IDF's term-frequency component grows without limit, so raw keyword repetition can dominate a score regardless of genuine relevance elsewhere in the document. Both failures trace back to the same root cause — TF-IDF and cosine similarity treat term frequency and document length as forces to either count linearly or normalize away completely, with no middle ground. Chapter 4 builds that middle ground: BM25, which saturates the contribution of repeated terms instead of counting them linearly, and normalizes document length with a *tunable* parameter instead of dividing it out entirely.

*Next: [04_BM25_Language_Models.md](04_BM25_Language_Models.md)*
