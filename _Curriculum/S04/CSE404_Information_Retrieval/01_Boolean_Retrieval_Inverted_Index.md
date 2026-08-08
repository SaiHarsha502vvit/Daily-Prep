# Chapter 1 — Boolean Retrieval & the Inverted Index

> A search engine that reads every document on every query isn't a search engine. It's a very patient librarian who re-shelves the entire library each time you ask a question.

---

## The Problem

You have a corpus of documents — could be 4 emails, could be 50 billion web pages. A user types a query: **"quick AND fox"** — find every document containing both words.

The obvious approach: for each document, scan its text and check whether both words appear. This is exactly what `grep -l 'quick'` piped into another `grep 'fox'` does. It works. The question this chapter answers is: what does it *cost*, and what structure lets you pay less?

## 1.1 The Naive Cost

Let `N` = number of documents, `D` = average document length in words. A linear scan checks every word of every document for a match against the query terms:

```
cost(scan) = O(N · D)
```

For a small corpus this is fine. For a real search engine it isn't. Take a modest corpus of 10 million documents averaging 500 words each: that's 5 billion word-checks *per query*. At even 1 billion checks/second (optimistic for a single core doing string comparison, not raw arithmetic), that's 5 seconds — for one query, on one core, with no ranking, no typo tolerance, nothing else. Real engines answer in tens of milliseconds against corpora orders of magnitude larger. Linear scan is not in the same universe as the actual requirement.

The scan is wasteful in a specific way: it re-derives, from scratch, on every query, information that doesn't change between queries — *which documents contain which words*. That fact is fixed the moment the corpus is loaded. If querying is frequent and the corpus changes slowly (true of essentially every real system — the web changes far slower than people search it), the fix is the oldest trick in computing: **precompute once, query many times.**

## 1.2 Precomputing "Which Docs Have This Word" — the Incidence Matrix

The most direct way to precompute "which documents contain term T" is a table: one row per term in the vocabulary, one column per document, a 1 where the term occurs in that document, a 0 where it doesn't.

Tiny corpus:

```
Doc 1: "the quick brown fox jumps"
Doc 2: "the lazy dog sleeps"
Doc 3: "the quick fox runs"
Doc 4: "a lazy fox and a lazy dog"
```

Incidence matrix (term × document):

| term  | D1 | D2 | D3 | D4 |
|-------|----|----|----|----|
| a     | 0  | 0  | 0  | 1  |
| and   | 0  | 0  | 0  | 1  |
| brown | 1  | 0  | 0  | 0  |
| dog   | 0  | 1  | 0  | 1  |
| fox   | 1  | 0  | 1  | 1  |
| jumps | 1  | 0  | 0  | 0  |
| lazy  | 0  | 1  | 0  | 1  |
| quick | 1  | 0  | 1  | 0  |
| runs  | 0  | 0  | 1  | 0  |
| sleeps| 0  | 1  | 0  | 0  |
| the   | 1  | 1  | 1  | 0  |

Now "quick AND fox" is a one-liner: bitwise-AND the `quick` row and the `fox` row.

```
quick: 1 0 1 0
fox:   1 0 1 1
AND:   1 0 1 0   →  documents {1, 3}
```

Bitwise AND on fixed-width machine words is about as cheap as a CPU operation gets. This *works*, and it's genuinely fast per query. The problem is what it costs to *store*.

## 1.3 Why the Matrix Doesn't Survive Contact With Real Scale

Size the matrix for a realistic collection: 1 million documents, a vocabulary of 500,000 distinct terms (a reasonable English vocabulary size once you count names, inflections, and technical terms).

```
matrix bits = 500,000 terms × 1,000,000 docs = 5 × 10^11 bits
            = 6.25 × 10^10 bytes
            = 62.5 GB
```

That's the storage for *one* collection of modest size, and it only gets worse as the corpus grows — the matrix grows as the *product* of vocabulary and document count, not the sum.

Now ask: how many of those 500,000×1,000,000 cells are actually 1? A typical document uses a few hundred *distinct* words, not 500,000. So each column has maybe 300 ones out of 500,000 rows — a fill rate around 0.06%. The matrix is over 99.9% zeros. You're spending 62.5 GB to represent information that, if you only kept the *locations of the ones*, would take a tiny fraction of that.

This is the same move you've seen before if you've worked with sparse matrices or adjacency-matrix-vs-adjacency-list for graphs: **when a table is overwhelmingly one value, stop storing the table — store the exceptions.**

## 1.4 The Inverted Index

Instead of a row of N bits per term (mostly 0), store a **postings list**: the sorted list of document IDs where the term actually occurs.

```
quick  ->  [1, 3]
fox    ->  [1, 3, 4]
```

No zeros stored at all. Total storage across the whole index is proportional to the number of (term, document) occurrences — not vocabulary size times corpus size. For the same 1M-document, 500K-term collection, if each document has ~300 distinct terms, total postings entries ≈ 1,000,000 × 300 = 3 × 10^8. At roughly 4-8 bytes per posting (compressed doc-ID deltas get this much smaller in production systems, but even uncompressed 4-byte integers): ~1.2 GB. Compare to 62.5 GB for the dense matrix — roughly 50x smaller, and the ratio gets more extreme as the corpus grows, because postings scale with *actual occurrences*, not with `vocabulary × N`.

This structure — term-keyed, postings-list-valued — is called an **inverted index**, because it inverts the natural document→words direction into a words→documents direction.

**Building it** is mechanical:

1. For each document, tokenize into terms.
2. Emit one `(term, docID)` pair per distinct term per document.
3. Sort all pairs by term.
4. Group consecutive pairs with the same term into a postings list.

Running this on the 4-document corpus:

```
=== Inverted index ===
a        -> [4]
and      -> [4]
brown    -> [1]
dog      -> [2, 4]
fox      -> [1, 3, 4]
jumps    -> [1]
lazy     -> [2, 4]
quick    -> [1, 3]
runs     -> [3]
sleeps   -> [2]
the      -> [1, 2, 3]
```

(Verified by actually building this index in Python from the four documents above — every postings list matches a manual count of which documents contain each word.)

## 1.5 Boolean AND: Why Sortedness Is the Whole Trick

`quick AND fox` now means: find the documents in *both* postings lists. The postings lists are kept **sorted by document ID** — and that single invariant is what makes intersection cheap.

With two sorted lists, you don't need to compare every element of one against every element of the other. Walk both with a pointer each, always advancing whichever pointer points at the smaller value:

```
p1 = quick = [1, 3]        p2 = fox = [1, 3, 4]
i=0, j=0:  p1[0]=1, p2[0]=1  → equal → emit 1, advance both
i=1, j=1:  p1[1]=3, p2[1]=3  → equal → emit 3, advance both
i=2 (past end of p1) → stop

result: [1, 3]
```

If you've implemented merge sort, this is exactly the *merge* step — same pointer-walk, same "advance whichever side is behind" rule, same reliance on both inputs already being sorted. Merge sort uses it to combine two sorted halves into one sorted whole; Boolean retrieval uses the identical primitive to find the *overlap* between two sorted lists instead. Same mechanism, different question asked of it.

The cost of this merge-walk is `O(len(p1) + len(p2))` — each pointer only ever moves forward, so the total number of comparisons is bounded by the combined list lengths, never their product. Compare that to the naive nested-loop intersection (for every element of p1, scan all of p2 looking for a match), which costs `O(len(p1) · len(p2))`.

Verified by direct comparison count, merge-walk vs. naive nested loop, on lists of evens and multiples-of-3:

```
|p1|=   10 |p2|=   10  ->  merge-walk=    13   naive=      76   ratio=   5.8x
|p1|=  100 |p2|=  100  ->  merge-walk=   133   naive=    7756   ratio=  58.3x
|p1|= 1000 |p2|= 1000  ->  merge-walk=  1333   naive=  777556   ratio= 583.3x
```

The ratio grows roughly linearly with list size — exactly what `O(n²)` vs `O(n)` predicts. At web scale, where postings lists for common terms hold hundreds of millions of document IDs, this is the difference between "answers a query" and "does not."

**Stress-tested:** the merge-walk intersection was run against brute-force `set(p1) & set(p2)` on 2,000 randomly generated sorted-list pairs (sizes 1–50, values up to 500) — zero mismatches. The algorithm is only correct *because* the invariant "postings lists stay sorted" is maintained by construction (step 3 of the build process, above). Break that invariant — e.g., append new documents' postings without re-sorting — and the merge-walk silently returns wrong answers instead of failing loudly, since it never re-checks the sortedness it depends on. **This is the chapter's "when it breaks": an inverted index that allows unsorted postings insertion is not a bug in waiting — it's a silent-corruption machine**, because merge-intersect has no way to detect that its precondition was violated.

## 1.6 OR and NOT

**OR** ("quick OR lazy"): union instead of intersection — same merge-walk shape, but every element from both lists that doesn't have a match gets carried through unmatched:

```
quick OR lazy -> [1, 2, 3, 4]   (verified against set(p1) | set(p2))
```

**NOT** ("NOT lazy" — documents that *don't* mention "lazy"): this is where the postings-list representation shows its cost. A postings list only records where a term *is* present. To find where it's *absent*, you need the complement relative to the full set of document IDs — which means materializing "all document IDs" and subtracting. There's no shortcut analogous to the AND/OR merge-walk, because "absence" isn't a sparse fact the way "presence" is (recall §1.3: presence is the rare case, worth indexing; absence is the *common* case for any given term, which is exactly why we don't index it).

In practice, standalone NOT is rarely computed directly. Queries like "fox AND NOT lazy" are computed as "take the `fox` postings list, then filter out any doc ID that also appears in the `lazy` postings list" — a merge-walk variant that never needs to construct the full complement. Standalone NOT (with no positive term to anchor against) forces a full pass over all document IDs, which is exactly the "read everything" cost the inverted index exists to avoid — a genuine boundary case where the data structure's core assumption (sparsity of the *positive* fact) stops helping.

## 1.7 Skip Pointers: Making Long-List Intersection Faster Still

The merge-walk is `O(m+n)`, which is already a huge win over `O(m·n)`. But for very common terms — "the", "a" — postings lists can hold a large fraction of the entire corpus. Intersecting one huge list against another huge list still means walking through both, one element at a time, even though most of that walking finds no matches.

**Idea:** attach *skip pointers* to a postings list — at regular intervals, a pointer that jumps ahead `k` entries at once, with the value it would land on precomputed. While merging, before advancing one element at a time, check whether the skip target is still `≤` the value you're matching against. If so, jump directly there instead of stepping through every intermediate entry.

This only pays off if the skip target doesn't overshoot — so the spacing `k` matters. Think about the trade-off:

- **Small `k`** (skip pointers close together): you get to skip often, but each skip only saves a few steps — the pointers themselves add overhead without much payoff.
- **Large `k`** (skip pointers far apart): each successful skip saves a lot, but skips succeed less often, so you fall back to single steps most of the time.

Balancing "how many skip-segments you might have to fully traverse" against "how long each segment is" gives the classic amortized argument: for a list of length `P`, the worst-case work is roughly `(P/k)` skip-attempts plus up to `k` single steps per segment you can't skip — minimized when both terms are equal in order of magnitude, i.e. `P/k ≈ k → k ≈ √P`.

Empirical check, intersecting a dense list of 10,000 sequential IDs against a sparse list (every 997th ID) with skip spacing swept from 1 to 1,000 (`√P ≈ 100` for P=10,000):

```
skip_every=     1  ->  steps= 19931
skip_every=     5  ->  steps=  4015
skip_every=    10  ->  steps=  2048
skip_every=    50  ->  steps=   744   <- empirical minimum
skip_every=   100  ->  steps=  1044   (= sqrt(P), theory's prediction)
skip_every=   200  ->  steps=  1944
skip_every=   500  ->  steps=  4884
skip_every=  1000  ->  steps=  9863
```

The empirical minimum landed at `k=50`, not exactly `k=100=√P` — worth stating honestly rather than rounding the data to fit the theory. What the measurement *does* confirm is the shape the derivation predicts: both tails (very small `k` and very large `k`) are far worse, and the minimum sits in the `√P` neighborhood, not at the extremes. The exact constant shifts with the specific distribution of the sparse list (real query terms don't land at perfectly uniform intervals the way `x % 997 == 0` does) — which is precisely why production systems tune skip spacing empirically against real query logs rather than trusting the idealized formula to the last digit.

## Worked Trace: Full Query End-to-End

Query: `(quick OR lazy) AND fox` against the 4-document corpus.

```
Step 1 — evaluate quick OR lazy:
   quick = [1, 3]
   lazy  = [2, 4]
   OR    = [1, 2, 3, 4]     (merge-walk union, no overlap between the two lists here)

Step 2 — intersect that result with fox:
   (quick OR lazy) = [1, 2, 3, 4]
   fox              = [1, 3, 4]
   AND              = [1, 3, 4]     (merge-walk intersection)

Final answer: documents {1, 3, 4}
```

Manual check against the raw text: Doc 1 has "quick" and "fox" ✓. Doc 3 has "quick" and "fox" ✓. Doc 4 has "lazy" and "fox" (not "quick", but the OR only needs one) ✓. Doc 2 has neither "quick" nor "lazy" combined with... wait, Doc 2 has "lazy" — but not "fox" — so it's correctly excluded by the final AND. Matches.

## Section Challenge

<details>
<summary><strong>Q1.</strong> A postings list for "python" is [3, 7, 19, 22, 50] and for "java" is [1, 7, 22, 40]. Hand-trace the merge-walk intersection (AND) — show each pointer comparison, not just the final answer.</summary>

```
p1 (python) = [3, 7, 19, 22, 50],  p2 (java) = [1, 7, 22, 40]
i=0,j=0: p1[0]=3  vs p2[0]=1  → 3>1 → advance j
i=0,j=1: p1[0]=3  vs p2[1]=7  → 3<7 → advance i
i=1,j=1: p1[1]=7  vs p2[1]=7  → equal → emit 7, advance both
i=2,j=2: p1[2]=19 vs p2[2]=22 → 19<22 → advance i
i=3,j=2: p1[3]=22 vs p2[2]=22 → equal → emit 22, advance both
i=4,j=3: p1[4]=50 vs p2[3]=40 → 50>40 → advance j
j=4: past end of p2 → stop

Result: [7, 22]
```
Each pointer only ever moves forward — 7 total comparisons across two lists of length 5 and 4, never the 20 a nested loop would need.
</details>

<details>
<summary><strong>Q2.</strong> Why is standalone "NOT term" expensive in an inverted index, while "termA AND NOT termB" is cheap? What does this tell you about what the index is optimized for?</summary>

"NOT term" alone requires the complement of the postings list relative to *every* document ID in the corpus — but the index only stores presence, never absence, so computing that complement means materializing the full document-ID universe and subtracting, which costs `O(N)` regardless of how rare or common the term is. That's exactly the "touch every document" cost the whole structure exists to avoid.

"termA AND NOT termB" avoids this because it never needs the complement of B in isolation — it only needs to filter A's (already small, already relevant) postings list by removing anything that also appears in B's list, which is a bounded merge-walk over A's list, `O(len(A) + len(B))`.

The lesson: the inverted index is optimized for the sparse, positive fact ("which docs have this term" — rare relative to the corpus). Any query that fundamentally needs the *dense*, negative fact ("which docs lack this term" — common relative to the corpus) falls outside what the structure makes cheap, because that information was never sparse enough to be worth indexing in the first place.
</details>

<details>
<summary><strong>Q3.</strong> A user searches for "qwick fox" — misspelling "quick." The inverted index has a postings list for "quick" but none for "qwick." What does a direct lookup return, and what would the index need in order to still help this user?</summary>

A direct lookup on "qwick" simply misses — there's no postings-list entry for a term that was never tokenized out of any document, so the query returns zero results even though the corpus almost certainly contains what the user meant. Boolean retrieval as built in this chapter has no concept of "close to" a term — only "equal to."

Helping this user means the index needs a way to go from an unknown/misspelled term to the *known* vocabulary terms that are similar to it — structures like k-gram indexes (breaking terms into overlapping character n-grams to find near-matches) and edit-distance-based spelling correction. That's exactly the next layer to build on top of the inverted index — dictionary structures for wildcard queries and spelling correction.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Linear scan | `O(N·D)` per query — re-derives fixed information every time; doesn't scale |
| Incidence matrix | Precomputes presence as a dense bit table; query is fast (bitwise AND) but storage is `O(vocab × N)` |
| Sparsity | Real corpora fill well under 1% of the incidence matrix — storing zeros wastes space proportional to the empty majority |
| Inverted index | Stores only postings (doc IDs where a term occurs) — storage scales with actual occurrences, not `vocab × N` |
| Merge-walk AND/OR | Two-pointer intersection/union over **sorted** postings lists — `O(m+n)`, same primitive as merge sort's combine step |
| Sortedness invariant | The entire `O(m+n)` guarantee depends on postings staying sorted; violate it silently and merge-walk returns wrong answers without erroring |
| NOT | Expensive alone (needs the full doc-ID complement); cheap combined with a positive term (bounded filter via merge-walk) |
| Skip pointers | Precomputed jump-ahead links on long postings lists; optimal spacing is in the `√P` neighborhood, derived by balancing skip count against per-skip cost |

## Where We Go Next

This chapter built the core data structure — sorted postings lists — and the core algorithm — merge-walk Boolean retrieval — that everything else in information retrieval sits on top of. But it assumed exact term matches and a fixed, known vocabulary. Real users misspell terms, use wildcards, and expect the system to bridge the gap between what they typed and what's actually indexed. Chapter 2 builds the dictionary structures — k-gram indexes, wildcard query support, and edit-distance spelling correction — that sit between a user's raw query and the clean, exact-match postings lookups this chapter depends on.

*Next: [02_Dictionaries_Wildcards_Spelling_Correction.md](02_Dictionaries_Wildcards_Spelling_Correction.md)*
