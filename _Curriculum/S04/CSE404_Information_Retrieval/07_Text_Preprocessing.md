# Chapter 7 — Text Preprocessing for IR

> Every formula in this book so far has quietly assumed the words arriving at it were already clean — already split correctly, already comparable across documents, already stripped of whatever made two mentions of "the same" concept look like different tokens. Nothing has checked that assumption yet. This chapter checks it.

---

## The Problem

Chapter 6 ended by catching its own assumption: precision, recall, and NDCG all compare a retrieved document to a ground truth by checking whether terms match — and "fox" failing to match "foxes" back in Chapter 3 was a preview of a much bigger problem this course has been stepping around since Chapter 1. Every inverted index, every TF-IDF vector, every BM25 score has been built on top of one unexamined step: **turning raw text into the tokens that everything else operates on.** If that step is done carelessly, every metric downstream inherits the damage silently, exactly as Chapter 6 Q3 showed.

This chapter goes back to the very first thing that happens to a document, before any index is built: tokenization, stemming, lemmatization, and stopword removal. Each one looks like a minor, mechanical cleanup step. Each one, done wrong, actively makes retrieval worse — not just less optimal, but wrong in ways a user directly notices.

## 7.1 Tokenization: Why "Split on Whitespace" Breaks Immediately

Chapter 1 quietly used `text.split()` as "tokenize" and moved on. Test that same naive approach against ordinary sentences, not the clean toy corpus this book has used so far:

```
Input: "Dr. Smith isn't going to the U.S.A. tomorrow."
  naive .split() -> ['Dr.', 'Smith', "isn't", 'going', 'to', 'the', 'U.S.A.', 'tomorrow.']

Input: "The state-of-the-art model costs $19.99 -- a great deal!"
  naive .split() -> ['The', 'state-of-the-art', 'model', 'costs', '$19.99', '--', 'a', 'great', 'deal!']

Input: "It's the dog's favorite toy, don't you think?"
  naive .split() -> ["It's", 'the', "dog's", 'favorite', 'toy,', "don't", 'you', 'think?']
```

(Verified directly in Python — every token above is the literal output of `.split()`.) Four distinct problems, visible in these three sentences alone: **trailing punctuation glued to words** (`Dr.`, `U.S.A.`, `tomorrow.`, `toy,`, `deal!` all carry punctuation as part of the token, so `tomorrow.` and a bare `tomorrow` elsewhere in the corpus would never match as the same term); **numbers and currency treated as opaque strings** (`$19.99` is one indivisible token, useless for anything beyond an exact-string match); **standalone punctuation surviving as its own "word"** (`--` becomes a token with no linguistic content at all); and, less obviously wrong but still a choice being made silently, **contractions and possessives happen to survive intact** only because the apostrophe isn't whitespace — `isn't` and `dog's` stay as single tokens, which may or may not be what's wanted (should `isn't` match a query for `is` combined with a negation? `.split()` never asks the question, it just happens to land on one answer by accident of which character isn't whitespace).

A fifth issue hides in a step so routine it's easy to forget it's a *choice*: **case-folding**, lowercasing every token so `The` and `the` are recognized as the same term. Skipping it means Chapter 1's exact-match dictionary would treat `Fox` (start of a sentence) and `fox` (mid-sentence) as two unrelated vocabulary entries — clearly wrong. But folding case unconditionally has its own silent cost:

```
'US'.lower() == 'us'.lower()  ->  True
```

`US` (the country) and `us` (the pronoun) become indistinguishable the moment case is folded — a query for the pronoun would now also match every document mentioning the country, and there's no way to recover the distinction later, because the information needed to tell them apart (capitalization) has already been permanently discarded. The same collision hits `IT` (Information Technology) versus `it`, and `March` (the month) versus `march` (the verb). Case-folding is close to always worth it in aggregate — the false-positive collisions it creates are rarer and usually less damaging than the false negatives it prevents — but "close to always" is not "free," and it's the same shape of trade-off as everything else in this chapter: a normalization step that helps the common case by discarding information some minority of cases actually needed.

## 7.2 A Better Tokenizer, and Its Own New Edge Cases

Fix the obvious problems with a regex that only keeps letters and digits, but tolerates an internal apostrophe or hyphen so contractions and compounds don't get shredded:

```python
re.findall(r"[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*", text)
```

```
Input: "Dr. Smith isn't going to the U.S.A. tomorrow."
  regex: ['Dr', 'Smith', "isn't", 'going', 'to', 'the', 'U', 'S', 'A', 'tomorrow']

Input: "The state-of-the-art model costs $19.99 -- a great deal!"
  regex: ['The', 'state-of-the-art', 'model', 'costs', '19', '99', 'a', 'great', 'deal']

Input: "It's the dog's favorite toy, don't you think?"
  regex: ["It's", 'the', "dog's", 'favorite', 'toy', "don't", 'you', 'think']
```

Real progress: trailing punctuation is gone (`tomorrow`, `toy`, `think` are now clean), and `state-of-the-art`, `co-authored`, `well-known` all survive as intended single compound tokens. But look closely at what broke *instead*: `U.S.A.` — which should plausibly be one token, an abbreviation — shatters into `['U', 'S', 'A']`, because the regex has no way to distinguish "periods that separate sentences" from "periods that are part of an abbreviation." And `$19.99` becomes `['19', '99']` — the decimal point is gone entirely, silently turning one price into two unrelated small integers, which is arguably a *worse* failure than the original tokenizer's "keep it as one opaque blob," since it now actively asserts two false, disconnected facts about the text instead of one useless one.

This is not a bug to be patched away with one more rule — it's a real, unresolved tension. Tightening the regex to preserve `U.S.A.`'s periods would need it to also preserve `tomorrow.`'s trailing period (both look identical: a letter followed by a period), which reintroduces the original problem. Every real tokenizer used in production IR systems makes an explicit, documented policy choice here (common approaches include a curated abbreviation list, or accepting that rare abbreviations will occasionally be mis-split) — there is no context-free rule that gets every case right, because the correct segmentation of `U.S.A.` versus `tomorrow.` depends on knowing what the string *means*, not just what characters it contains.

## 7.3 Stemming: Deriving Rule-Based Suffix Stripping

Even with clean tokens, `run`, `runs`, `running`, and `runner` are four different dictionary entries to an exact-match inverted index (Chapter 1) — a document about someone "running" won't be found by a query for "run." **Stemming** addresses this by mechanically stripping suffixes according to a fixed set of rules, collapsing inflected forms down to a common (not necessarily real) root.

The classic algorithm, Porter's (Martin Porter, "An Algorithm for Suffix Stripping," *Program*, 14(3), 1980), applies an ordered sequence of suffix-replacement rules — strip `-ing`, `-ed`, `-s`, `-tion`, `-ational`, and dozens more, in a specific priority order, with conditions on the remaining stem's length and structure to avoid over-stripping short words. Traced on real words (verified via the standard implementation):

```
word              -> stem
running           -> run
runs              -> run
runner            -> runner    (unchanged -- "-er" isn't always safe to strip)
argument          -> argument
arguments         -> argument
argue             -> argu
argued            -> argu
arguing           -> argu
connect           -> connect
connected         -> connect
connection        -> connect
connections       -> connect
flies             -> fli
flying            -> fli
fly               -> fli
national          -> nation
nationalization   -> nation
```

Most of this works exactly as intended — `connect`, `connected`, `connection`, and `connections` all collapse to the single stem `connect`, so a query for any one of them would match documents containing any of the others. But already visible here: the stem `fli` isn't an English word at all, and `argument`/`arguments` land on `argument` while `argue`/`argued`/`arguing` land on `argu` — two *different* stems for words that are unmistakably part of the same family. Stemming isn't producing dictionary entries; it's producing an internal bookkeeping key, and that key doesn't always land where intuition expects.

## 7.4 When It Breaks: Over-Stemming and Under-Stemming

Push the same algorithm at word pairs chosen to probe its edges, and the failures split into two clean, opposite categories.

**Over-stemming**: unrelated words collapsed onto the same stem, so a query for one incorrectly matches documents about the other entirely.

```
'university'    -> 'univers'    'universe'      -> 'univers'    SAME STEM
'organization'  -> 'organ'      'organ'         -> 'organ'      SAME STEM
'general'       -> 'gener'      'generalize'    -> 'gener'      SAME STEM
```

A query for `organization` would, after stemming, match every document about a biological `organ` — two concepts with no meaningful semantic overlap, merged purely because Porter's suffix rules happened to strip both down to the same four letters.

**Under-stemming**: genuinely related words that *fail* to collapse, so a query for one misses documents about the other even though a human would consider them obviously the same concept.

```
'alumnus'   -> 'alumnu'    'alumni'    -> 'alumni'    DIFFERENT STEMS
'matrix'    -> 'matrix'    'matrices'  -> 'matric'    DIFFERENT STEMS
'mouse'     -> 'mous'      'mice'      -> 'mice'      DIFFERENT STEMS
'analysis'  -> 'analysi'   'analyses'  -> 'analys'    DIFFERENT STEMS
```

Every one of these pairs is a singular/plural form of the *same* word — the kind of relationship stemming exists specifically to unify — and every one fails, because English's irregular plurals (`mouse`/`mice`, borrowed Latin/Greek plurals like `alumnus`/`alumni` and `matrix`/`matrices`) don't follow any suffix-stripping pattern a rule-based algorithm can express. The `argument`/`argue` split from §7.3 is the same failure in a milder form — clearly the same word family, landing on different stems anyway.

These two failure modes are not tuning mistakes that a better rule set could eliminate entirely — they're the direct, unavoidable cost of using a fixed, *context-free* set of suffix rules to approximate what is really a semantic question ("do these two strings refer to the same underlying concept?"). A purely mechanical process, applied uniformly to every word regardless of what it means, will always occasionally merge things that shouldn't merge and separate things that should stay together.

## 7.5 Lemmatization: Why Some Reductions Need a Dictionary, Not Rules

`better` and `good` are the same word, inflected — but there is no suffix relationship between them at all: `better` cannot be turned into `good` by stripping characters, because `good` isn't a prefix of `better` in any sense a suffix-stripping rule could express. No rule-based stemmer, however cleverly designed, can ever unify them; the relationship exists only in the reader's knowledge of English irregular comparatives, not in the spelling.

**Lemmatization** solves this a completely different way: instead of applying rules, look the word up in a precompiled dictionary of known inflections mapped to their dictionary form (a *lemma*) — WordNet-style resources are the standard choice. Verified against a real lemmatizer, compared directly to Porter stemming on the same irregular words:

```
word     stem(Porter)   lemma(WordNet)
better   better         good
best     best           best
worse    wors           bad
is       is             be
am       am             be
are      are            be
was      wa             be
went     went           go
mice     mice           mouse
geese    gees           goose
```

Stemming fails on every single one of these — `better`, `is`, `am`, `are`, `went` all pass through completely unchanged (the suffix rules find nothing to strip), and `worse` and `was` are mangled into non-words (`wors`, `wa`) without becoming any more useful. Lemmatization correctly unifies `is`/`am`/`are`/`was` all down to `be`, and `went` to `go` — real dictionary relationships a suffix rule has no way to see. It isn't infallible either, worth noting honestly rather than overselling it: this same lookup left `best` as `best` instead of reducing it to `good`, an inconsistency in the underlying dictionary resource, not a flaw in the *idea* of lemmatization.

Lemmatization has its own cost beyond needing a large precompiled dictionary: it needs to know a word's **part of speech** to pick the right lemma, because the same spelling can be genuinely ambiguous:

```
lemmatize('meeting', pos=noun) = meeting   (a meeting, the noun)
lemmatize('meeting', pos=verb) = meet      (meeting someone, the verb)
```

Get the part of speech wrong (or skip it, as many quick implementations do) and lemmatization silently returns the wrong answer for exactly the ambiguous cases where getting it right mattered most — a cost stemming never has to pay, since stemming's rules don't need to know a word's grammatical role at all. That's the real trade-off between the two techniques: stemming is fast, rule-based, and occasionally wrong in structurally predictable ways (§7.4); lemmatization is slower, dictionary-dependent, needs part-of-speech information to work correctly, and gets the hard irregular cases right that stemming can never reach.

## 7.6 Stopword Removal: The Case for Throwing Words Away Entirely

Chapter 3 §3.3 showed that "the" can dilute a raw term-frequency score badly enough to misrank documents, and IDF (§3.4) already down-weights it automatically for exactly that reason. Stopword removal goes one step further than down-weighting: **delete** the most common, least discriminating words from the index entirely, rather than just scoring them low.

The motivation is space and speed, not just relevance quality — measured directly on this book's own running six-document corpus, against a standard 198-word English stopword list:

```
Total tokens across the sample corpus: 62
Tokens remaining after stopword removal: 36
Fraction removed: 41.94%
Removed tokens: [the, over, the, the, is, a, for, its, and, are, as, by, such, as, and, in, the, of, has, been, by, a, and, a, in, the]
```

Nearly 42% of all tokens in this small corpus are stopwords — at web scale, removing them shrinks postings lists for the very highest-frequency terms (Chapter 1 §1.7's observation about "the," "a," and similar terms having enormous postings lists applies directly here) and speeds up every merge-walk intersection that would otherwise have to wade through them.

## 7.7 When It Breaks, Continued: The Phrase Query That Disappears

Stopword removal's blind spot is exactly what makes it effective in the normal case: it assumes the *removed* words never carry the meaning of a query on their own. That assumption fails outright for phrase queries built almost entirely out of function words. Take the famous phrase, run through the exact same stopword list as §7.6:

```
Query: "to be or not to be"
Tokens: [to, be, or, not, to, be]
Stopword check: to=True, be=True, or=True, not=True, to=True, be=True
Tokens remaining after stopword removal: []
Query is completely EMPTY after stopword removal: True
```

**Every single token is a stopword.** A retrieval system that removes stopwords before indexing or querying has, for this exact phrase, nothing left to search on at all — not a degraded result, not a lower-ranked result, an **empty query**, indistinguishable from a user who typed nothing. This isn't a rare pathology invented for this chapter: "the who" (a band name) and "what is to be will be" both vanish completely under the identical list, verified the same way. A phrase-search feature that quietly strips stopwords before doing anything else will silently fail on exactly the queries where word *order* and the function words *themselves* are the entire point — "to be or not to be" is only meaningful as that specific sequence; the "content words" `be` (twice) carry none of the phrase's identity in isolation.

One real mitigation reuses an idea from Chapter 2, one level up: instead of indexing single words, index consecutive **word bigrams** — `(to,be), (be,or), (or,not), (not,to), (to,be)` for this exact phrase — *before* any stopword filtering touches them. None of these pairs is a stopword on its own (a bigram is never "in" a single-word stopword list at all), so a bigram-based positional index preserves precisely the ordering information that word-level stopword removal destroys, while still letting the bag-of-words path drop individual stopwords for ordinary (non-phrase) queries. Real phrase-query implementations have to special-case this: keep stopwords in positional or n-gram indexes used for exact-phrase matching even while excluding them from the bag-of-words scoring path, rather than applying one blanket removal policy everywhere.

## 7.8 Putting It All Together: A Full Pipeline

Every technique in this chapter is normally applied as one ordered sequence, not in isolation. Traced end-to-end on a single sentence — tokenize, lowercase, remove stopwords, then stem — using the exact tokenizer, stopword list, and stemmer verified throughout this chapter:

```
Original: "The Researchers' Universities are Connecting Nationally."

1. Tokenize:          [The, Researchers, Universities, are, Connecting, Nationally]
2. Lowercase:          [the, researchers, universities, are, connecting, nationally]
3. Remove stopwords:   [researchers, universities, connecting, nationally]
4. Stem:               [research, univers, connect, nation]
```

Each stage discards or transforms information the previous stage still had: tokenization throws away the sentence's punctuation and whitespace structure; lowercasing throws away capitalization (§7.1's `US`/`us` cost, paid here too — nothing in this sentence collides, but nothing checked); stopword removal throws away `The` and `are` entirely, on the assumption (correct for this sentence, not always — §7.7) that they carry no query-relevant meaning; stemming throws away the grammatical suffixes that distinguish `Researchers` from a hypothetical `research` or `researched`. By the time these four tokens reach Chapter 1's inverted index, they bear only a loose resemblance to the original sentence — which is precisely the point when it works (a query for "university research connections" should match this document) and precisely the risk when any one stage's assumptions don't hold for a particular sentence or query, as every "when it breaks" case in this chapter demonstrated concretely.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Section 7.4 showed <code>argument</code>/<code>arguments</code> stemming to <code>argument</code>, while <code>argue</code>/<code>argued</code>/<code>arguing</code> all stem to <code>argu</code> — two different stems for words a human would call the same family. Is this over-stemming, under-stemming, or something else? Explain using the definitions from §7.4.</summary>

Under-stemming. §7.4 defined over-stemming as *unrelated* words incorrectly collapsing to the *same* stem, and under-stemming as *related* words incorrectly landing on *different* stems. `argument` and `argue` are unambiguously related — same root concept, same word family, exactly the relationship stemming exists to capture — yet they produce two distinct stems (`argument` vs. `argu`). That's under-stemming by definition, just a milder case than the `alumnus`/`alumni` or `mouse`/`mice` pairs: those failed because of irregular plurals with no shared suffix pattern at all, while `argument`/`argue` fails because Porter's rule set happens to treat `-ment` as a suffix worth stripping in some contexts but the underlying stem `argu` only emerges from the verb forms, not the noun form — a narrower, rule-ordering-specific miss rather than a wholesale irregular-morphology miss, but structurally the same category of failure.
</details>

<details>
<summary><strong>Q2.</strong> Section 7.6 measured stopword removal deleting 41.94% of tokens from this book's sample corpus. Section 7.7 showed it can also delete 100% of a query's tokens. Propose a rule a real search engine could use to decide, automatically, when stopword removal is safe to apply to a given query and when it isn't.</summary>

One workable rule, grounded in what actually broke in §7.7: apply stopword removal only when doing so leaves at least one token behind. If removing stopwords from a query would empty it completely (as with "to be or not to be"), skip the removal step entirely for that query and fall back to matching on the full, unmodified token sequence instead — the empty-query case is trivial to detect (just check whether anything survives the filter) and gives an unambiguous signal that this particular query cannot afford the removal that works fine for typical queries. A more refined version of the same idea, used by real phrase-query features: never remove stopwords from queries wrapped in quotes (explicit phrase-match requests), since a user typing a quoted phrase has already signaled that exact wording, including the function words, is what they mean — the same logic §7.7 ended on, that positional/phrase matching needs to retain what bag-of-words scoring can safely discard. Both rules share the same underlying principle: stopword removal is an optimization that assumes it's throwing away words that don't carry meaning on their own, and that assumption needs an explicit check, not a blanket application, whenever there's a plausible query shape (a very short query, or an exact phrase) where it might not hold.
</details>

<details>
<summary><strong>Q3.</strong> Suppose tokenization, stemming, lemmatization, and stopword removal were all implemented flawlessly — every edge case in this chapter fixed. Would a query for "car" now correctly retrieve a document that only ever uses the word "automobile"? Why or why not, and what does that imply about the limits of everything built from Chapter 1 through this chapter?</summary>

No — and no amount of improving this chapter's techniques changes that answer. Stemming strips suffixes; "car" and "automobile" don't share a suffix, or any substring relationship at all. Lemmatization maps inflected forms to a dictionary headword; "car" and "automobile" are already both headwords, two entirely separate dictionary entries, not inflections of each other — there's no lemma lookup that unifies two synonyms with unrelated spellings, only one that unifies different *forms* of the *same* word. Stopword removal doesn't even apply; neither word is a function word. Every technique in this chapter operates on the *spelling* or *inflectional structure* of a word, and "car"/"automobile" have no lexical relationship whatsoever — they're related only in *meaning*, a fact no amount of string manipulation, however sophisticated, can recover.

This exposes the actual ceiling of everything Chapter 1 through Chapter 7 has built: Boolean retrieval, TF-IDF, BM25, and even PageRank all operate on **exact term matches** (Chapters 1-2's tolerant retrieval extended *which* strings count as a match, but never escaped matching strings against strings). None of it has a mechanism for matching on *meaning* when the spelling gives no clue at all. Solving the "car"/"automobile" problem requires abandoning term-matching as the foundation entirely, in favor of representations that capture what words *mean* rather than how they're *spelled* — which is exactly where Chapter 8, the final chapter of this course, goes next: dense embeddings and semantic retrieval.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Naive tokenization | `.split()` glues trailing punctuation to words and leaves currency/decimals as opaque strings — verified across four real sentence patterns |
| Regex tokenization | Fixes trailing punctuation and preserves contractions/hyphens, but introduces new failures on abbreviations (`U.S.A.` → 3 tokens) and decimals (`$19.99` → two disconnected integers) |
| No context-free tokenizer is fully correct | Distinguishing `U.S.A.`'s periods from `tomorrow.`'s requires knowing what the text *means*, not just its characters — a real, unresolved tension, not a bug |
| Stemming | Rule-based suffix stripping (Porter, 1980); verified to correctly unify `connect`/`connected`/`connection`/`connections`, but also to produce non-words (`fli`) |
| Over-stemming | Unrelated words collapse to the same stem — verified: `organization` and `organ` both stem to `organ` |
| Under-stemming | Related words fail to collapse — verified: `mouse`/`mice`, `alumnus`/`alumni`, and even `argument`/`argue` land on different stems |
| Lemmatization | Dictionary lookup, not suffix rules — verified to correctly unify `is`/`am`/`are`/`was` to `be`, where stemming left all four unchanged or broken |
| Lemmatization's cost | Needs a large precompiled dictionary and the word's part of speech — verified `meeting` lemmatizes to `meeting` (noun) or `meet` (verb) depending on which |
| Stopword removal | Deletes (not just down-weights) the most common terms — verified 41.94% of tokens removed from this book's own sample corpus |
| Stopword removal's failure mode | A query built entirely from function words vanishes completely — verified "to be or not to be" reduces to zero tokens |

## Where We Go Next

Question 3 drew a hard boundary around everything this course has built so far: tokenization, stemming, lemmatization, and stopword removal all operate on how a word is *spelled*, and Boolean retrieval, TF-IDF, BM25, and PageRank all rank documents by *matching* those spellings, exactly or approximately. None of it has a way to connect "car" and "automobile" — two spellings with zero lexical overlap but identical meaning — because meaning was never represented as anything the system could compute over; only strings were. Chapter 8, the final chapter of this course, replaces string-matching with a fundamentally different representation: dense vector embeddings that place semantically similar words and passages near each other in space regardless of shared spelling, and the modern retrieval systems — approximate nearest-neighbor search, cross-encoder re-ranking, and retrieval-augmented generation — built on top of that idea.

*Next: [08_Dense_Retrieval_RAG.md](08_Dense_Retrieval_RAG.md)*
