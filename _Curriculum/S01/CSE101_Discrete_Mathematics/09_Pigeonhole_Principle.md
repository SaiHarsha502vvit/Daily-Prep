# Chapter 09 — Pigeonhole Principle

> [< Previous: 08 Counting & Combinatorics](08_Counting_Combinatorics.md) | [Course Index](README.md) | [Next → 10 Recurrence Relations](10_Recurrence_Relations.md)

---

## The Most Surprising Elementary Theorem

In a group of 367 people, two people MUST share the same birthday.

No information about who those two people are. No probability — it's a certainty. 367 people, 366 possible birthdays (including Feb 29). No choice.

This is the **Pigeonhole Principle**: simple enough to state in one line, powerful enough to prove things that feel impossible without it.

---

## The Principle: Formal Statement

**Basic Pigeonhole Principle:**  
If n+1 objects are placed into n boxes, at least one box contains at least 2 objects.

**Proof by contradiction:**  
Assume no box contains 2 or more objects — each box has at most 1 object. Then the total number of objects is at most n × 1 = n. But we have n+1 objects. Contradiction. ∎

That's it. The proof is one line. The power comes from applying it cleverly.

**Analogy:** Pigeons returning to a dovecote. If 13 pigeons fly into 12 holes, at least one hole has at least 2 pigeons. The pigeons "have no choice" — the math forces a collision.

---

## The Generalized Principle

**Generalized Pigeonhole Principle:**  
If n objects are placed into k boxes, at least one box contains at least ⌈n/k⌉ objects.

**Proof by contradiction:**  
Assume every box has at most ⌈n/k⌉ − 1 objects. Then total objects ≤ k × (⌈n/k⌉ − 1) < k × (n/k) = n. But we have n objects. Contradiction. ∎

```
27 students into 4 study groups:
  At least one group has ≥ ⌈27/4⌉ = ⌈6.75⌉ = 7 students.

1000 IP addresses assigned to 256 possible subnets:
  At least one subnet has ≥ ⌈1000/256⌉ = ⌈3.9⌉ = 4 addresses.
```

---

## The Core Insight: When to Apply It

Pigeonhole applies whenever you can frame a problem as:

1. **Objects:** the n+1 things being placed.
2. **Boxes:** the n categories they go into.
3. **Conclusion:** something about the box with multiple objects.

The art is identifying WHAT the objects and boxes are. They are rarely literal pigeons.

---

## Classic Applications

### Application 1: Birthday Collisions

**Claim:** In a group of 23 people, there's a >50% probability two share a birthday. In a group of 366 people, it's 100% certain.

**For 100% certainty:** 366 people (objects) into 365 possible birthdays (boxes, excluding Feb 29) — Pigeonhole guarantees a collision.

**For 50% probability (the "Birthday Paradox"):** This is probabilistic, not Pigeonhole — but Pigeonhole gives you the worst-case bound. See Chapter 08's counting for the probability calculation.

**Hashing connection:** A hash function maps arbitrary keys into n buckets. If you insert n+1 keys, at least two must land in the same bucket (collision). This is NOT a failure of the hash function — it's mathematically guaranteed by Pigeonhole.

```
Hash table with 1000 buckets.
Insert 1001 keys.
GUARANTEED: ≥ 1 bucket has ≥ 2 keys (collision). ∎

Even if your hash function is perfect, collisions are unavoidable
once you exceed the bucket count.
```

---

### Application 2: Shared Property in Subsets

**Claim:** From any set of n+1 distinct integers chosen from {1, 2, ..., 2n}, at least two must sum to 2n+1.

**Setup:** Partition {1, ..., 2n} into n pairs that sum to 2n+1:
```
{1, 2n}, {2, 2n-1}, {3, 2n-2}, ..., {n, n+1}
```

Each of the n pairs is a "box." You're choosing n+1 integers from 2n total, so your n+1 integers must occupy these n boxes (Pigeonhole: some box contains 2 of your integers). The two integers in that pair sum to 2n+1. ∎

**Example (n=5):** Choose any 6 integers from {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}. Pairs: {1,10}, {2,9}, {3,8}, {4,7}, {5,6}. With 6 choices and 5 boxes, two chosen integers share a pair and sum to 11.

---

### Application 3: Five Cards, Shared Suit

**Claim:** Draw any 5 cards from a standard 52-card deck. At least two cards share a suit.

**Objects:** 5 cards.  
**Boxes:** 4 suits (♠ ♥ ♦ ♣).  
**Conclusion:** ⌈5/4⌉ = 2 cards in some suit. ∎

**Generalization:** ⌈5/4⌉ = 2. If you need at least 3 cards of the same suit, you need ⌈(4×2+1)/1⌉ = 9 cards: 4 suits × 2 cards maximum without a triple + 1 more = 9 guarantees a triple.

---

### Application 4: Two People with the Same Number of Handshakes

**Claim:** At any party of n ≥ 2 people, at least two people have shaken the same number of hands.

**Setup:** Each person can shake 0 to n-1 hands. That's n possible handshake counts (objects: n people, boxes: n counts). Why doesn't Pigeonhole apply directly? Because 0 and n-1 can't BOTH appear: if someone shook 0 hands, no one has n-1 (that person would have shaken everyone's hand including the 0-shaker's). So at most n-1 distinct values are actually achievable.

**Corrected setup:** n people (objects) into at most n-1 boxes (either 0 is used and n-1 is excluded, or n-1 is used and 0 is excluded). Pigeonhole: some box has ≥ 2. Two people share a handshake count. ∎

**This is the key skill:** Pigeonhole works by FINDING the right set of boxes and showing the count of available boxes is smaller than the count of objects.

---

### Application 5: Long Monotone Subsequence (Erdős–Szekeres)

**Claim:** Any sequence of n²+1 distinct integers contains either an increasing subsequence of length n+1 OR a decreasing subsequence of length n+1.

**Setup:** For each element aᵢ, define length(aᵢ) = the length of the longest increasing subsequence starting at aᵢ.

If any length(aᵢ) ≥ n+1, we're done (we have an increasing subsequence of length n+1).

Assume all lengths are ≤ n. Then length(aᵢ) ∈ {1, 2, ..., n} for all aᵢ — these are the "boxes." With n²+1 elements (objects) and n boxes, some box has ≥ ⌈(n²+1)/n⌉ = n+1 elements sharing the same longest-increasing-subsequence length.

If aᵢ and aⱼ have the same length and aᵢ > aⱼ with i < j (aᵢ appears before aⱼ in the sequence), then aᵢ doesn't continue into aⱼ's increasing chain (since aᵢ > aⱼ). This forces a decreasing pattern — the elements with the same LIS-length form a decreasing subsequence.

Full proof requires careful ordering argument (this is the sketch), but the Pigeonhole setup is the core. ∎

**Why this matters in CS:** This theorem proves that no comparison-based sort can do better than O(n log n) on average because any input either has a long sorted run (faster) or a long reverse-sorted run (the other extreme). It's the foundation of the merge sort lower bound.

---

## Pigeonhole in System Design

**Problem:** You have a URL shortener. Short codes are 7 characters from {a-z, A-Z, 0-9} = 62 characters. After how many URLs are you guaranteed a collision?

62⁷ = 3,521,614,606,208 ≈ 3.5 trillion unique codes.

If you insert 3.5 trillion + 1 URLs, a collision is guaranteed. For practical purposes (> ~50% collision probability), the Birthday Paradox puts it much earlier: around √(3.5 × 10¹²) ≈ 1.87 million URLs.

Pigeonhole gives the WORST-CASE guarantee; probability gives the expected early collision.

**Database primary key overflow:** INTEGER PK in MySQL: max 2³¹ − 1 = 2.147 billion. Insert 2.147B + 1 rows without explicit key management: guaranteed duplicate key error. Pigeonhole guarantees this at the first duplicate attempt.

---

## The Inverse: Pigeonhole for Lower Bounds

Pigeonhole proves existence of a collision. Equivalently: if no collision is allowed (all boxes must be distinct), then the number of objects is BOUNDED by the number of boxes.

**For injections (Chapter 07):** An injection f : A → B requires |A| ≤ |B|. Proof: if |A| > |B|, Pigeonhole gives two elements of A mapping to the same box in B — violating injectivity.

This makes Pigeonhole the tool for **impossibility proofs**:
- "You can't have a compression algorithm that makes every file smaller." (If all files compressed, the mapping from files to compressed-files would be injective from a larger set to a smaller set — impossible by Pigeonhole.)
- "You can't have a lossless encoding with perfect efficiency." (Similar argument on information-theoretic grounds.)

---

## Section Challenge

> ### Hash Table Collision Guarantees
>
> You're designing a hash table with the following properties:
> - 1,000 buckets (indexed 0 to 999)
> - Hash function h : String → {0, 1, ..., 999}
> - Load factor α = number_of_keys / number_of_buckets
>
> **Question 1:** What is the minimum number of distinct keys that GUARANTEES at least one collision, regardless of the hash function?
>
> **Question 2:** At load factor α = 2.5 (2,500 keys), what is the minimum number of keys that MUST be in the most-loaded bucket?
>
> **Question 3:** A junior engineer says "if we use a really good hash function (uniform distribution), we can avoid collisions for up to 2,000 keys in 1,000 buckets." Is this correct? What does Pigeonhole say vs what probability says?
>
> **Question 4 (Design):** You want to guarantee that the worst-case bucket has at most 5 keys. How many buckets do you need for 10,000 keys? And what's the minimum load factor you can guarantee (using Pigeonhole, not probability)?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Minimum keys to guarantee a collision

Objects: keys (n+1 of them)
Boxes: 1,000 buckets

By basic Pigeonhole: n+1 > n → collision guaranteed when keys > buckets.
Minimum for guaranteed collision: 1,001 keys.

For the 1,001st key, regardless of how "good" the hash function is, it
MUST land in an already-occupied bucket. This is not about the hash function's
quality — it's a cardinality constraint.

──────────────────────────────────────────────────────────

QUESTION 2: Most-loaded bucket at α = 2.5 (2,500 keys, 1,000 buckets)

By generalized Pigeonhole: at least one bucket contains ≥ ⌈2,500/1,000⌉ = ⌈2.5⌉ = 3 keys.

The most-loaded bucket has AT LEAST 3 keys.

Note: this is a LOWER BOUND — the actual worst case might be much higher depending
on the hash function. Pigeonhole only guarantees the MINIMUM worst case.

──────────────────────────────────────────────────────────

QUESTION 3: "Good hash function avoids collisions for 2,000 keys in 1,000 buckets"

INCORRECT. Pigeonhole says: 2,000 objects, 1,000 boxes → at least one box has ≥ 2 keys.
This is a MATHEMATICAL CERTAINTY, independent of the hash function's quality.

"Quality" of a hash function determines:
  - How EVENLY the collisions are distributed (uniform → fewer hot spots)
  - How PREDICTABLE the collisions are (cryptographic → attacker can't force collisions)

But "quality" CANNOT eliminate collisions when keys > buckets. That's not possible.

What probability says (Birthday Paradox):
  With a uniform hash function and 1,000 buckets, first collision expected around
  √(1,000) ≈ 32 keys (roughly 50% probability). At 2,000 keys, collision probability ≈ 1.
  Even a perfect uniform hash has collisions at scale.

What this means practically:
  Every hash table implementation must handle collisions (chaining or open addressing).
  No hash function — no matter how good — can guarantee collision-free operation
  once you insert more keys than you have buckets.

──────────────────────────────────────────────────────────

QUESTION 4: Buckets needed for ≤ 5 keys per bucket with 10,000 keys

We want: worst-case bucket size ≤ 5.
Pigeonhole bound: worst bucket ≥ ⌈keys/buckets⌉.

We need: ⌈10,000 / buckets⌉ ≤ 5.
Therefore: 10,000 / buckets ≤ 5 → buckets ≥ 10,000 / 5 = 2,000.

You need AT LEAST 2,000 buckets.

Minimum load factor:
  With 10,000 keys and 2,000 buckets: α = 10,000 / 2,000 = 5.0.

WAIT — that contradicts the goal of ≤ 5 per bucket!
  α = 5.0 means on average 5 keys per bucket.
  Pigeonhole guarantees SOME bucket has ≥ 5 keys.
  So α = 5.0 is the BOUNDARY: with 2,000 buckets, the worst case is exactly 5.

For strictly less than 5 (at most 4) per bucket:
  ⌈10,000 / buckets⌉ ≤ 4 → buckets ≥ ⌈10,000/4⌉ = 2,500.
  Minimum α = 10,000 / 2,500 = 4.0.

DESIGN INSIGHT:
  Target load factor (α) directly determines worst-case bucket depth via Pigeonhole.
  Setting α = 0.75 (Java's default for HashMap) means with 1 million keys,
  you need 1,000,000 / 0.75 ≈ 1.33 million buckets.
  Worst-case bucket (Pigeonhole): ⌈1,000,000 / 1,333,333⌉ = 1.
  
  At α < 1.0, Pigeonhole guarantees most buckets have ≤ 1 key — very few forced collisions.
  That's why low load factors are fast but memory-wasteful.
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking "good design" avoids Pigeonhole constraints**
- If |objects| > |boxes|, a collision IS guaranteed, full stop. Quality of the hash/design only controls which collisions happen, not whether they happen.

**Mistake 2: Confusing Pigeonhole (worst case) with Birthday Paradox (expected case)**
- Pigeonhole says: after n+1 insertions into n buckets, at least 1 collision exists FOR CERTAIN.
- Birthday Paradox says: with a uniform hash, you expect a collision around √n insertions with 50% probability.
- Pigeonhole is an upper bound on collision-free operation; Birthday Paradox is the expected crossover.

**Mistake 3: Forgetting to identify what the "boxes" are**
- Pigeonhole requires a clear mapping: objects → boxes. The most challenging problems require creative box definition (see the handshake example where boxes are "non-simultaneous" handshake counts, not {0,...,n-1}).

**Mistake 4: Using ⌊n/k⌋ instead of ⌈n/k⌉**
- The generalized principle guarantees AT LEAST ⌈n/k⌉ (ceiling). Using floor underestimates the guarantee.
- 27 items in 4 boxes: at least ⌈6.75⌉ = 7 in some box, not ⌊6.75⌋ = 6.

---

## Connections

- **Chapter 07 — Functions:** Pigeonhole is the injection impossibility theorem: no injection f : A → B exists when |A| > |B|. Every Pigeonhole proof is a proof that an injection fails.
- **Chapter 08 — Counting:** Counting gives you |objects| and |boxes|. Pigeonhole uses that count to guarantee a collision.
- **Chapter 10 — Recurrences:** The Erdős–Szekeres theorem (monotone subsequence) uses Pigeonhole on a recurrence structure (LIS lengths).
- `02_Data_Structures/` — Every hash table analysis relies on Pigeonhole to establish that collisions at high load factors are unavoidable. Chaining, open addressing, and Robin Hood hashing are all collision *handling* strategies — not collision *avoidance* strategies.
- `03_Algorithms/A3_Lower_Bounds_And_NP.md` — Information-theoretic lower bounds use Pigeonhole: a comparison-based sort reading n bits must produce at least n! outputs; log₂(n!) = Θ(n log n) bits are needed, establishing Ω(n log n) lower bound.

---

> [< Previous: 08 Counting & Combinatorics](08_Counting_Combinatorics.md) | [Course Index](README.md) | [Next → 10 Recurrence Relations](10_Recurrence_Relations.md)
