# Chapter 2 — Dictionaries, Wildcard Queries & Spelling Correction

> Ask a reference librarian for "the book about qwantum fizix" and she doesn't blink — she guesses, correctly, in under a second. Ask an inverted index the same question and it returns nothing, confidently, because "qwantum" is not a key it has ever seen. This chapter teaches the index to guess.

---

## The Problem

Chapter 1 ended on a specific failure. A user searches **"qwick fox"** — misspelling "quick" — and the inverted index's direct lookup on `qwick` finds nothing, because no postings list was ever built for a term that doesn't exist in any document. The lookup isn't buggy. It's doing exactly what it was built to do: match a query token against a dictionary key, exactly, or fail. The dictionary itself (the sorted set of terms that Chapter 1's index is keyed on) has no notion of "close enough."

There's a second version of the same problem. A user searches **`mon*ing`** — a wildcard, meaning "any term starting with `mon` and ending with `ing`." The postings-list machinery from Chapter 1 has no entry called `mon*ing` either, because a wildcard isn't a term — it's a *pattern over* terms, and the dictionary was built to look up literal strings, not evaluate patterns.

Both failures have the same root cause: **the dictionary only answers "is this exact string a key?"** Everything this chapter builds is aimed at one goal — letting the index answer richer questions ("which keys look like *this*?", "which keys are close to *this*?") without falling back to the one option Chapter 1 spent an entire chapter proving is too slow: scanning everything.

## 2.1 What the Naive Fallback Costs

Before building anything new, size the cost of *not* building it — the same move Chapter 1 opened with.

**Wildcards, naively:** with no structure beyond the sorted term dictionary, resolving `mon*ing` means walking every term in the vocabulary and pattern-matching it against `mon*ing` directly. For Chapter 1's realistic sizing — a vocabulary of 500,000 distinct terms — that's 500,000 pattern-match checks *per wildcard query*. Not as catastrophic as Chapter 1's per-document scan, but it defeats the entire point of having a dictionary structure: a sorted list of terms should let you *jump* to the region you care about, not walk past everything.

**Spelling correction, naively:** with no structure beyond the dictionary, correcting "qwick" means computing some notion of string-similarity between "qwick" and *every one of 500,000 terms*, then keeping the closest. If each similarity computation costs roughly `O(len(query) · len(term))` — true of the edit-distance algorithm this chapter derives in §2.7 — and terms average 8 characters against a 6-character query, that's about `6 × 8 = 48` units of work per comparison, times 500,000 terms: **24 million units of work, for one misspelled word, in one query.** A query with two typos doubles it.

Both naive fallbacks share Chapter 1's original sin: re-deriving, from scratch, on every query, a fact about the vocabulary that doesn't change between queries — *which terms share which substrings, and how similar which terms are to each other.* That's precomputable. This chapter precomputes it two ways: a **k-gram index** for wildcards, and an **edit-distance-driven "did you mean" pipeline** for misspellings — and then shows how a real system runs both off the *same* underlying structure.

*(A quick note on scope: real systems also need a fast way to check "is this exact string a dictionary key?" — typically a B-tree or hash table over the sorted term list. That's a generic data-structure question, not an IR-specific one, so this chapter takes it as given and focuses on what's IR-specific: structures built *on top of* the dictionary to answer approximate and pattern queries.)*

## 2.2 The k-gram Index: Precomputing Substrings Instead of Words

Chapter 1's inverted index precomputed "which documents contain this **word**." The same idea, one level down: precompute "which **words** contain this **substring**."

Fix a small window size `k`. For a term, pad it with a boundary marker `$` at both ends (so the index can tell "starts with" from "contains"), then slide a window of length `k` across it. For `k=2` (bigrams) and the term `moon`:

```
padded:  $moon$
bigrams: $m, mo, oo, on, n$
```

Build an index exactly the way Chapter 1 built the inverted index: for every term in the vocabulary, emit `(bigram, term)` pairs, group by bigram. The result is a postings list *per bigram*, listing every vocabulary term that contains it.

Running this over a 35-term toy vocabulary (`monitoring`, `monitor`, `money`, `moon`, `quick`, `quiet`, `sand`, `orange`, … — words chosen to make the coming false-positive case land cleanly) with `k=2`:

```
Vocabulary size: 35 terms
Distinct bigrams in index: 97

Sample postings (bigram -> terms containing it):
  '$m'   -> [money, monitor, monitoring, monitors, monotone, monster, month, monthly, moon, moonlight, morning, mountain, mounted, mounting, mourning]
  'mo'   -> [money, monitor, monitoring, monitors, monotone, monster, month, monthly, moon, moonlight, morning, mountain, mounted, mounting, mourning]
  'on'   -> [money, monitor, monitoring, monitors, monotone, monster, month, monthly, moon, moonlight]
  'in'   -> [bring, kingdom, monitoring, morning, mountain, mounting, mourning, ring, ringing, running, sing, singing]
  'ng'   -> [bring, kingdom, monitoring, morning, mounting, mourning, orange, ring, ringing, running, sing, singing]
  'g$'   -> [bring, monitoring, morning, mounting, mourning, ring, ringing, running, sing, singing]
  'an'   -> [anagram, banana, band, land, orange, sand]
```

(Verified by building this index in Python from the 35-term vocabulary and printing every postings list — every entry above matches which terms literally contain that two-character substring.)

Notice `$m` and `mo` have identical postings here — every term that starts with `m` in this vocabulary happens to have `o` as its second letter. That's a coincidence of this small vocabulary, not a general property; it just means these two particular bigrams aren't doing independent filtering work *yet*. Combined with a third bigram like `on`, they start to diverge.

*(A k-gram index isn't the only structure IR systems use for tolerant retrieval — a **permuterm index**, which stores every rotation of every term so that any wildcard position becomes a prefix-lookup, is the classic alternative. It trades a larger index — a term of length `L` produces `L` rotations instead of `L+1` k-grams — for turning wildcard resolution into a single prefix search instead of an intersect-then-verify pipeline. This chapter builds the k-gram approach because its "cheap filter, then verify" shape is the one that generalizes directly to spelling correction later in the chapter; the two structures are answers to the same question with different cost trade-offs, not competing correct/incorrect approaches.)*

## 2.3 Wildcard Queries via k-gram Intersection

Take the query `mon*` — "any term starting with `mon`." The known part of the pattern is the prefix `mon`. Pad it the same way terms were padded: `$mon`. Slide the same `k=2` window across *just the known part*:

```
$mon -> $m, mo, on
```

Here's the key claim: **any term that starts with `mon` must contain all three of these bigrams.** That's not a heuristic — it follows directly from how the bigrams were generated from the pattern itself. So instead of scanning the vocabulary, intersect the three postings lists — exactly Chapter 1's merge-walk AND, just keyed on character n-grams instead of words:

```
Required bigrams: {$m, mo, on}
Candidates after k-gram intersection (10):
  [money, monitor, monitoring, monitors, monotone, monster, month, monthly, moon, moonlight]
```

Ten candidates out of 35 terms touched — already better than scanning all 35, and the gap only widens as the vocabulary grows, because the postings for `$m`, `mo`, `on` don't grow with the *whole* vocabulary, only with the terms that actually share those substrings.

But look closely at the candidate list: **`moon` and `moonlight` are there, and neither starts with `mon`.** `moon` is `m-o-o-n` — it contains `$m`, `mo`, and (from the `o-o-n` tail) `on`, satisfying all three required bigrams, without ever having the contiguous substring `mon`. The k-gram intersection proves "these substrings all occur *somewhere* in the term" — it says nothing about *where*, or in what order relative to each other. That's a **false positive**, and it's structural, not a bug: bigram co-occurrence is strictly weaker evidence than the pattern match it's standing in for.

The fix is a verification pass: take the k-gram-filtered candidates and check each one against the *actual* pattern.

```
Candidates: [money, monitor, monitoring, monitors, monotone, monster, month, monthly, moon, moonlight]
False positives removed by post-filter: [moon, moonlight]
Final matches: [money, monitor, monitoring, monitors, monotone, monster, month, monthly]
```

This is a two-stage shape you'll see again throughout IR (and throughout CS generally — Bloom filters, hash-based joins, and locality-sensitive hashing all follow it): a **cheap, precomputed filter that overapproximates** the answer, followed by an **expensive, exact check** run only on the much smaller surviving set. The filter's job isn't to be exactly right — it's to be cheap and to never throw away a true match, while shrinking the expensive-check workload from "everything" to "plausible."

Now the pattern from the chapter's own motivating query, `mon*ing`, which has *both* a known prefix and a known suffix — so it contributes bigrams from both ends:

```
prefix "mon" padded "$mon" -> $m, mo, on
suffix "ing" padded "ing$" -> in, ng, g$

Required bigrams (6): {$m, mo, on, in, ng, g$}
Candidates after k-gram intersection (1): [monitoring]
False positives removed by post-filter: []
Final matches: [monitoring]
```

Six required bigrams instead of three collapses the candidate set from 10 down to exactly 1, with zero false positives — more constraints from more of the pattern being "known" translates directly into a smaller, cleaner candidate set. That relationship is the subject of the next section.

## 2.4 Ordering the Intersection: Smallest Postings First

Six required bigrams means six postings lists to intersect for `mon*ing`. Chapter 1 never had to think about *order* — Boolean AND on two lists only has one order. With six, order matters, and it's worth deriving why before just picking one.

Sizes of the six postings lists for `mon*ing`, read straight off the index:

```
$m -> 15 terms      mo -> 15 terms      on -> 10 terms
in -> 12 terms      ng -> 12 terms      g$ -> 10 terms
```

Intersect them in the order they were generated — prefix bigrams first, then suffix bigrams (`$m, mo, on, in, ng, g$`) — and track the size of the running intermediate result after each step:

```
Given order:          $m,  mo,  on,  in,  ng,  g$
Intermediate sizes:   15,  15,  10,   1,   1,   1
Sum of intermediate sizes touched: 43
```

Now intersect the *same six lists*, smallest first (`on, g$, in, ng, $m, mo` — `on` and `g$` tie at 10, then `in`/`ng` at 12, then `$m`/`mo` at 15):

```
Smallest-first order: on,  g$,  in,  ng,  $m,  mo
Intermediate sizes:   10,   1,   1,   1,   1,   1
Sum of intermediate sizes touched: 15
```

Same final answer either way (intersection doesn't care about order) — but the smallest-first order touches 15 total elements across all intermediate steps versus 43 for the given order, because it collapses the candidate set down to its final size (1, in this case) after just two lists instead of three. This is exactly Chapter 1's merge-walk cost argument, applied to *which order* you feed lists into repeated merge-walks: **once you intersect with a small list, the result can never grow back**, so doing the small intersections first means every subsequent merge-walk operates on an already-small list instead of a large one. For six bigram postings this is a modest saving; for a real dictionary where common bigrams like `in` or `er` have postings lists orders of magnitude larger than rare ones, processing smallest-first is the difference between a fast query and one that materializes a huge, mostly-wasted intermediate result before finally shrinking it.

## 2.5 When k-gram Filtering Runs Out of Signal

The filtering power of a k-gram query comes entirely from how much *contiguous, known* text the pattern hands you. Push that toward zero and watch the filter degrade in real time.

Query `*an*` — "contains `an` anywhere." The known fragment `an` isn't anchored to either boundary (it's floating between two wildcards), so it gets no `$` padding — there's no boundary to anchor it to. It still has length 2, so under `k=2` it contributes exactly one required bigram:

```
Required bigrams: {an}
Candidates after k-gram intersection (6): [anagram, banana, band, land, orange, sand]
Final matches: [anagram, banana, band, land, orange, sand]   (no false positives here)
```

One required bigram is weak filtering — it only rules out terms that *never* contain "an" at all — but it's still filtering: 6 candidates out of 35.

Now push further. Query `*a*` — "contains `a` anywhere." The known fragment is a single character, length 1. A k-gram of size 2 needs *two* consecutive known characters to exist at all. There is no way to build a 2-gram out of one character:

```
Notes: unanchored middle 'a' has length 1 < k=2: cannot form a single k-gram, 0 constraints possible
Required bigrams: []  (empty means NO filtering possible)
Fallback to full linear scan over vocabulary: True
Candidates scanned: 35 (= entire vocabulary)
Final matches: [anagram, banana, band, land, mountain, orange, sand]
```

Zero required bigrams means zero filtering — the k-gram index has nothing to intersect, so resolution falls back to exactly the linear scan §2.1 costed out as too slow at real scale. This is a **graceful** degradation, not a silent one: the system still returns the correct answer (all 7 terms containing `a`), it just does so by paying the full `O(V)` cost the index exists to avoid. The lesson generalizes: a k-gram index's filtering power is bounded below by the shortest *contiguous* known fragment in the query pattern, and short, heavily-wildcarded patterns (single letters, common short prefixes) are inherently the hardest case for this structure — a real system has to accept that some queries just can't be made cheap this way.

(Worth stating precisely, since it matters for tuning: this trade-off runs in *both* directions on `k`. Re-running `mon*` with `k=3` instead of `k=2` needs the trigrams `{$mo, mon}` — and produces **zero** false positives, because a 3-character window is enough to force contiguity that a 2-character window couldn't. But that same larger `k` makes `*an*` — a 2-character floating fragment — fall below the `k=3` threshold entirely, degrading it to a full scan where `k=2` could still extract one constraining trigram. Bigger `k` buys precision on longer fragments and loses filtering on shorter ones; there's no `k` that dominates on every query shape.)

## 2.6 Measuring "How Wrong" a Spelling Is

Wildcards assume the user knows the vocabulary and is being deliberately partial. Misspellings are the opposite problem: the user *meant* an exact term but typed something not in the dictionary at all. Resolving that requires a numeric notion of "how close" two strings are — close enough to guess what was meant.

**First attempt: Hamming distance** — count the positions where two equal-length strings differ.

```
'qwick' vs 'quick':  q=q, w≠u, i=i, c=c, k=k  ->  1 differing position
```

That looks right. But Hamming distance requires equal-length strings, and typos aren't only substitutions — people drop and insert characters too. Try it on an insertion, padding the shorter string to compare position-by-position:

```
'abc' vs 'xabc'  (a single character 'x' inserted at the front)
padded:  'abc_' vs 'xabc'
position 0: a≠x   position 1: b≠a   position 2: c≠b   position 3: _≠c
Hamming(padded) = 4
```

Verified in code: `hamming(padded)('abc','xabc') = 4`, while the true minimum-edit answer (below) is **1** — one insertion. Hamming distance says all four characters are wrong; intuitively, exactly one edit — inserting `x` — explains the entire difference. The flaw isn't a tuning problem, it's structural: Hamming distance compares *position i of a to position i of b*, and a single insertion shifts every character after it out of positional alignment, corrupting every comparison downstream of the insertion point. Hamming distance has no operation in its vocabulary for "shift" — only "compare same slot." Fixing this needs a metric that can align strings of different lengths, trying insertions and deletions as first-class moves, not just substitutions.

## 2.7 The Edit Distance DP Recurrence, Derived

Define **edit distance** (Levenshtein distance) between strings `a` and `b`: the minimum number of single-character insertions, deletions, and substitutions needed to transform `a` into `b`.

Trying every possible sequence of edits directly is exponential. Build it bottom-up instead, the way Chapter 1 built the inverted index from smaller precomputed facts. Define `D(i, j)` = the edit distance between the first `i` characters of `a` and the first `j` characters of `b` — a table of answers to every *prefix* subproblem.

**Base cases.** Turning an empty string into a `j`-character string takes `j` insertions; turning an `i`-character string into an empty string takes `i` deletions:

```
D(i, 0) = i        D(0, j) = j
```

**Recursive case.** To compute `D(i, j)`, look at the last characters of each prefix, `a[i-1]` and `b[j-1]`:

- **If they match**, that character needs no edit — align them for free and recurse on the shorter prefixes: `D(i, j) = D(i-1, j-1)`.
- **If they don't match**, some edit is unavoidable at this position, and there are exactly three kinds of edit that could resolve it, each corresponding to a different neighboring subproblem:
  - **Substitute** `a[i-1]` for `b[j-1]`: pay 1, then both prefixes have one fewer character to reconcile → `1 + D(i-1, j-1)`
  - **Delete** `a[i-1]` (treat it as extra, not present in `b` at this point): pay 1, only `a`'s prefix shrinks → `1 + D(i-1, j)`
  - **Insert** `b[j-1]` (to produce the character `b` needs next): pay 1, only `b`'s prefix shrinks → `1 + D(i, j-1)`
  
  Take whichever of the three is cheapest, since any of them is a *valid* way to proceed and the recurrence wants the minimum over all valid edit sequences:

```
D(i, j) = D(i-1, j-1)                                    if a[i-1] == b[j-1]
D(i, j) = 1 + min( D(i-1, j-1), D(i-1, j), D(i, j-1) )    otherwise
```

Filling the table bottom-up (row by row, or column by column — every cell only depends on cells above, to the left, or diagonally above-left) costs `O(len(a) · len(b))` cells, each `O(1)` to fill: a huge improvement over enumerating edit sequences directly.

**Full trace**, on the classic textbook pair `kitten → sitting` (rows are prefixes of `kitten`, columns prefixes of `sitting`):

```
          s   i   t   t   i   n   g
      0   1   2   3   4   5   6   7
  k   1   1   2   3   4   5   6   7
  i   2   2   1   2   3   4   5   6
  t   3   3   2   1   2   3   4   5
  t   4   4   3   2   1   2   3   4
  e   5   5   4   3   2   2   3   4
  n   6   6   5   4   3   3   2   3
```

Bottom-right cell: `D(6, 7) = 3`. (Verified in Python — matches the widely-cited reference value for this exact pair. Also cross-checked the DP-table implementation against an independent recursive-with-memoization implementation of the same recurrence on 500 randomly generated string pairs: 0 mismatches.)

Now the chapter's actual motivating case, `qwick → quick`:

```
          q   u   i   c   k
      0   1   2   3   4   5
  q   1   0   1   2   3   4
  w   2   1   1   2   3   4
  i   3   2   2   1   2   3
  c   4   3   3   2   1   2
  k   5   4   4   3   2   1
```

`D(5, 5) = 1`. This trace stays almost entirely on the diagonal — every step is a match-or-substitute, never a true insert/delete detour — because `qwick` and `quick` are the same length and differ at exactly one position. That's *precisely* the case where Hamming distance and edit distance agree (§2.6 found `hamming = edit_distance = 1` here). The `abc`/`xabc` case is where they diverge, because that trace genuinely needs an insert move — the exact move Hamming distance has no way to represent, and edit distance's DP handles by construction, as just another neighboring cell in the table.

## 2.8 A Real "Did You Mean" Pipeline: Combining k-grams and Edit Distance

§2.1 costed out the naive fix for misspellings: run edit distance against all 500,000 dictionary terms, roughly 24 million units of work for one typo. Edit distance alone doesn't fix that cost — it's still `O(len(query) · len(term))` per comparison, however cleverly computed. What fixes the cost is not computing it against most of the dictionary at all.

The k-gram index from §2.2–§2.4 was built for wildcards, but it precomputed exactly the fact needed here too: which dictionary terms share substrings with a given string. Reuse it as a cheap pre-filter:

1. Break the misspelled query into k-grams.
2. Use the k-gram postings to collect only the dictionary terms that share **at least one** k-gram with the query — call this the touched set.
3. Rank the touched set by **Jaccard similarity** of k-gram sets (`|shared grams| / |grams in either|`) — a cheap set operation, no character-alignment needed.
4. Run the *real* edit-distance computation only on the top few candidates by Jaccard score, and sort by actual edit distance.

Traced on the 35-term dictionary:

```
Query: 'qwick'  (not a dictionary entry -- direct lookup misses)
  Terms touched by k-gram filter: 4 / 35
  Jaccard-ranked shortlist: [(quick, 0.500), (quickly, 0.273), (quiet, 0.091), (quilt, 0.091)]
  Final ranking by real edit distance: [(quick, 1), (quickly, 3), (quiet, 3)]
```

The k-gram filter touched only 4 of 35 dictionary terms — a 31-term, 88.6% reduction in how many real edit-distance computations were needed — and the top suggestion, `quick` at distance 1, is unambiguous: nothing else in the shortlist is closer than 3.

```
Query: 'moring'  (not a dictionary entry)
  Terms touched by k-gram filter: 23 / 35
  Jaccard-ranked shortlist: [(morning, 0.667), (monitoring, 0.636), (ring, 0.500), (mounting, 0.455),
                             (mourning, 0.455), (bring, 0.444), (ringing, 0.444), (sing, 0.333)]
  Final ranking by real edit distance: [(morning, 1), (bring, 2), (mourning, 2)]
```

Two things worth noticing. First, the filter here is far weaker — 23 of 35 terms touched, not 4 — because `moring`'s bigrams (`$m`, `mo`, `or`, `ri`, `in`, `ng`, `g$`) are individually common across this vocabulary. This is the exact same lesson as Chapter 1 §1.3, one level down: **a filter's selectivity depends on the rarity of what you're filtering on**, whether that's a word across documents or a substring across a dictionary. Second, the final ranking has a genuine **tie**: `bring` and `mourning` are both at edit distance 2 from `moring`, tied on pure orthography, even though only one of them (`mourning`) is a word a human would plausibly guess the user meant. Edit distance measures spelling proximity, not plausibility — it has no way to know that `mourning` is a semantically reasonable near-miss for a mistyped word in this cluster while `bring` is an orthographic coincidence. Real "did you mean" systems break exactly this kind of tie using signals edit distance doesn't have: how often each candidate appears in the corpus or query logs, or the surrounding query context — a language-model kind of judgment, which is where Chapter 4 picks this back up.

## 2.9 When It Breaks: The Real-Word Error

Every fix so far triggers on the same event: a **dictionary lookup miss**. `qwick` misses, so §2.8's pipeline fires. `moring` misses, so it fires again. But consider two words already sitting in this chapter's dictionary: `morning` and `mourning` — both perfectly valid, both correctly spelled, both one edit distance apart from each other, and completely different in meaning.

```
Direct dictionary lookup for 'mourning': HIT (accepted as-is, no correction offered)
Direct dictionary lookup for 'morning':  HIT (accepted as-is, no correction offered)
```

If a user means "morning meeting" and fat-fingers "mourning meeting," the dictionary lookup for `mourning` **succeeds** — it's a real word — so §2.8's entire pipeline never activates. There's no miss to trigger it. The system doesn't return an error, or a low-confidence result, or a "did you mean" prompt. It confidently returns exactly what was typed, spelled perfectly, meaning something the user never intended, with **no error signal anywhere in the pipeline.**

This is the same shape of failure Chapter 1 flagged as its "when it breaks" moment (an invariant silently violated, not a crash): every structure built in this chapter — the dictionary, the k-gram index, edit distance — is doing precisely what it was designed to do. The dictionary lookup is *correct*: `mourning` really is a valid term. The failure isn't in any single component; it's that **correctness of the lookup mechanism and correctness of the user's intent are different questions**, and nothing built so far, in either this chapter or the last, has access to the second one. Detecting a real-word error requires information outside the term dictionary entirely — surrounding query context, corpus term frequencies, or a model of which word sequences are actually plausible. That's a preview of the probabilistic language models in Chapter 4, which are precisely the tool that can say "mourning meeting" is a much less likely phrase than "morning meeting," even though both words are spelled correctly.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Add two more entries to this chapter's dictionary: <code>quart</code> and <code>quiz</code> (alongside the existing <code>quick</code>, <code>quickly</code>, <code>quiet</code>, <code>quilt</code>). Using <code>k=2</code>, resolve the wildcard query <code>qu*t</code>: give the required bigrams, the candidates after k-gram intersection, and the final matches after verification.</summary>

```
prefix "qu" padded "$qu" -> $q, qu
suffix "t"  padded "t$"  -> t$

Required bigrams: {$q, qu, t$}
```

Intersecting the three postings lists: every term starting with `qu` (satisfying `$q`, `qu`) that also ends in `t` (satisfying `t$`).

```
Candidates after k-gram intersection: [quart, quiet, quilt]
False positives removed by post-filter: []
Final matches: [quart, quiet, quilt]
```

`quiz` is correctly excluded before the candidate stage even forms — it ends in `z`, not `t`, so it never has the `t$` bigram and fails the intersection outright. `quick` and `quickly` are excluded the same way (they end in `k` and `y`). Unlike the `mon*` example in §2.3, this particular query happens to produce **zero** false positives — the three required bigrams were enough to pin down exactly the right set without needing the verification pass to remove anything. That's not guaranteed in general (see §2.3's `moon`/`moonlight` case); it's a property of this specific pattern and vocabulary, not of the algorithm.
</details>

<details>
<summary><strong>Q2.</strong> Section 2.5 showed that switching from bigrams (k=2) to trigrams (k=3) makes <code>mon*</code> produce zero false positives instead of two. Why doesn't that mean you should always use the largest k you can? What breaks as k grows?</summary>

Re-running `mon*` with `k=3` needs the trigrams `{$mo, mon}` instead of the bigrams `{$m, mo, on}`. A trigram is more specific evidence than a bigram — matching `mon` as three *contiguous* characters rules out `moon` immediately (moon's only length-3 substrings are `moo` and `oon`, neither is `mon`), where the bigram evidence couldn't tell `mon` apart from `mo` + `on` appearing anywhere, contiguous or not. So yes: larger k gives each required n-gram more positional specificity, which generally means fewer false positives surviving intersection.

But that specificity has a floor requirement: an n-gram of size k needs **k consecutive known characters** to exist at all. Section 2.5 showed `*an*` (a 2-character floating fragment) still contributes one usable bigram under `k=2`. Re-run that same query under `k=3`: the fragment `an` has length 2, which is *shorter* than `k=3`, so it contributes **zero** trigrams — the query collapses straight to a full vocabulary scan, something `k=2` could still partially filter.

```
k=2 on '*an*': required_grams=['an']          -> 6 candidates (partial filtering)
k=3 on '*an*': NO constraint possible          -> full scan, 37/37 candidates
```

The trade-off is structural, not a tuning mistake to be optimized away: larger k buys precision on patterns with *long* known fragments, and simultaneously raises the minimum fragment length below which a query gets zero filtering at all. There's no single k that dominates every query shape a real system will see — production dictionaries often index multiple k values (or fall back from trigrams to bigrams) for exactly this reason.
</details>

<details>
<summary><strong>Q3.</strong> Suppose a user's query, after wildcard expansion and spelling correction, resolves to the Boolean query <code>(mon* OR quick) AND fox</code>, and it matches 12 documents. The user will only look at the first 10 results. Using only what Chapters 1 and 2 have built, how do you decide which 10 to show first — and what's missing to make that decision well?</summary>

Nothing built so far can answer this. Boolean retrieval (Chapter 1), even extended with wildcard expansion and spelling correction (this chapter), only ever produces a **set** — a document either satisfies the Boolean expression or it doesn't. All 12 matching documents are equally "in the set"; there is no field anywhere in a postings list, a k-gram index, or an edit-distance score that says document 7 is a *better* match than document 11. Wildcard expansion just turns `mon*` into a bigger OR of exact terms before Boolean evaluation runs — it doesn't attach a strength-of-match number to anything.

To choose the first 10 out of 12, the system needs a numeric score per document that captures *how strongly* it matches the query — not just *whether* it matches. That requires new machinery entirely: some way to weigh how much a document is "about" the query terms (how often they occur, how distinctive they are across the corpus) and combine that into a single ranking score. That's exactly the gap Chapter 3 opens with — the vector space model and TF-IDF, which turn "is this document in the result set?" into "how relevant is this document, on a numeric scale?"
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Exact-match dictionary | Answers "is this exact string a key?" only — wildcards and misspellings both fall outside what it can resolve |
| k-gram index | Precomputes, per k-length substring, which vocabulary terms contain it — same precompute-once idea as Chapter 1's inverted index, one level below words |
| Wildcard resolution | Convert the pattern's *known* fragments into required k-grams, intersect their postings (Chapter 1's merge-walk AND, reused), then verify candidates against the real pattern |
| k-gram false positives | Bigram co-occurrence proves substrings exist *somewhere* in a term, not in the right position — `moon` passes `mon*`'s bigram filter without starting with `mon` |
| Filtering power vs. k | Larger k gives more positional specificity (fewer false positives) but raises the minimum known-fragment length before a query gets any filtering at all; no single k dominates every pattern |
| Hamming distance | Counts positional mismatches on equal-length strings; breaks on insertions/deletions because it has no way to represent a "shift" |
| Edit distance (Levenshtein) | Minimum insert/delete/substitute operations between two strings; DP recurrence built from three neighboring subproblems, `O(len(a)·len(b))` to compute |
| "Did you mean" pipeline | Reuses the k-gram index to cheaply shortlist plausible dictionary terms by Jaccard similarity, then runs real edit distance only on that shortlist — avoided 88.6% of comparisons in the worked example |
| Real-word errors | A misspelling that happens to land on a *different valid word* passes dictionary lookup silently — correction never triggers because there's no miss to catch it |

## Where We Go Next

Chapters 1 and 2 together answer "which documents satisfy this query" — exactly, approximately, or after correcting typos — but the answer is always a **set**. Every document in that set counts equally, whether the query terms appear once or fifty times, in the title or buried in a footnote, in a short focused document or a long sprawling one. Real users don't want a set; they want the *best* matches first. Ranking requires attaching a number to each document that measures how well it matches — which means moving from Boolean logic (does this term appear?) to something that can weigh *how much* and *how distinctively* it appears. Chapter 3 builds exactly that: the vector space model and TF-IDF.

*Next: [03_Vector_Space_Model_TFIDF.md](03_Vector_Space_Model_TFIDF.md)*
