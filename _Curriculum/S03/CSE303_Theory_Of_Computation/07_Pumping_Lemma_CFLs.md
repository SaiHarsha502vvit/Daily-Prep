# Chapter 7 — Pumping Lemma for Context-Free Languages

> "The regular pumping lemma had one pump. The CFL pumping lemma has two. That extra pump captures exactly why stacks can only match brackets in pairs — not triangles."

---

## Why We Need a New Tool

In Chapter 4, the Pumping Lemma for regular languages let us prove things like `{aⁿbⁿ}` aren't regular. But `{aⁿbⁿ}` IS context-free — the regular pumping lemma was too weak to separate that language from the context-free class.

Now we need a tool that draws the line between what CFGs can express and what they cannot. The CFL Pumping Lemma does exactly this.

**Languages we'll prove are not context-free:**
- `{aⁿbⁿcⁿ}` — equal counts of three symbols
- `{ww}` — strings that are their own repetition  
- `{a^(n²)}` — strings whose length is a perfect square
- `{aⁿbⁿcᵏ | k ≤ n}` — c's bounded by a-count

These look similar to CFL examples but require matching three or more counters simultaneously — beyond what a single stack can track.

---

## 7.1 Where the Lemma Comes From

### The Pigeonhole Argument for Parse Trees

Take any CFL L with grammar G. If a string w ∈ L is long enough, its parse tree must have a long path from root to a leaf.

**Counting argument:** If G has |V| variables, then any parse tree of height ≤ |V| has at most `|Σ|^|V|` leaves (since the grammar is in CNF: two children per node, leaves are terminals). Call this bound p — the **pumping length**.

If |w| > p, then the parse tree for w has height > |V|. But there are only |V| variables. By **pigeonhole**, some variable R appears **twice** on the path from root to the leaf producing some part of w.

### The Two-Pump Structure

When variable R appears twice on a root-to-leaf path, the tree has a repeated sub-structure:

```
         S
        / \
       ...
      /     \
     R          ← R appears here (outer)
    / \
   u   R        ← R appears again (inner)
      / \
     v   y  z   ← split: v is between inner R and its leaves
    /
  ...
```

More precisely, the string is split as:
```
w = u v x y z
```

Where:
- The **outer R** generates `v x y` (everything between outer R and inner R yields v and y on the sides)
- The **inner R** generates `x` (the innermost part)
- `u` and `z` are what's outside

**The pumping idea:** Since R generates both the full sub-tree (generating `vxy`) AND just the inner part (generating `x`), we can:
- **Pump up:** replace inner R with outer R's subtree → generates `vvxyy`, `vvvxyyy`, etc.
- **Pump down:** replace outer R with inner R's subtree → generates `x` (without v and y)

This gives us the CFL Pumping Lemma.

---

## 7.2 The Formal Statement

**CFL Pumping Lemma:** If L is a context-free language, then there exists a pumping length p such that any string s ∈ L with |s| ≥ p can be written as:

```
s = uvxyz
```

satisfying:
1. `|vy| ≥ 1`  (at least one of v, y is non-empty)
2. `|vxy| ≤ p` (the middle chunk is bounded)
3. `uvⁱxyⁱz ∈ L` for all i ≥ 0  (pump both v and y simultaneously)

### Key Differences from Regular Pumping Lemma

| Feature | Regular | CFL |
|---------|---------|-----|
| Split | `s = xyz` | `s = uvxyz` |
| Pump count | 1 piece (y) | 2 pieces simultaneously (v and y) |
| Non-empty | `|y| ≥ 1` | `|vy| ≥ 1` |
| Bound | `|xy| ≤ p` | `|vxy| ≤ p` |
| Direction | pump one middle section | pump two sections together |

The two-piece pumping reflects the two recursive appearances of R in the parse tree — the outer one wraps v and y around x.

**Critical subtlety:** v and y are pumped *together* — you can't pump one without the other. If v = aⁿ and y = bⁿ, pumping adds n a's and n b's simultaneously — this is exactly what makes {aⁿbⁿ} pumpable (CFL). But to verify {aⁿbⁿcⁿ}, you'd need to pump a's, b's, AND c's together — but they can't all be in the `vxy` window (bounded by p).

---

## 7.3 Proof Strategy Template

The game structure is the same as Chapter 4, but with 5-way split instead of 3-way:

```
ADVERSARY chooses p (large enough pumping length)
YOU choose s ∈ L with |s| ≥ p
ADVERSARY chooses any split s = uvxyz satisfying (1) and (2)
YOU choose i ≥ 0
YOU show uvⁱxyⁱz ∉ L
→ Contradiction with the lemma → L is not context-free
```

**Template for choosing s:**

Pick s so that no matter how the adversary splits it into uvxyz with |vy| ≥ 1 and |vxy| ≤ p, pumping (using any valid i ≠ 1) must violate L's defining constraint.

**Template for case analysis:**

After adversary chooses split, analyze what v and y can contain. Since |vxy| ≤ p:
- v and y can only span a bounded window in the middle of s
- List the possible types of content in v and y (which symbol types they contain)
- For each case, show pumping breaks the required count relationships

---

## 7.4 Proof: {aⁿbⁿcⁿ} Is Not Context-Free

**Claim:** `L = {aⁿbⁿcⁿ | n ≥ 1}` is not a CFL.

**Proof by contradiction:** Assume L is context-free. Let p be the pumping length.

**Choose:** `s = aᵖbᵖcᵖ`. Clearly |s| = 3p ≥ p and s ∈ L.

**Adversary splits:** `s = uvxyz` with |vy| ≥ 1 and |vxy| ≤ p.

**Case analysis on what v and y contain:**

Since |vxy| ≤ p, the substring vxy cannot span all three symbol types AND have both v and y non-empty in different types. Specifically:

**Case 1: vxy contains only a's (and possibly b's, but stays within the aⁿbⁿ block)**

Since |vxy| ≤ p < 3p, vxy can't span from the start of a's to the end of c's. Sub-cases:

**Case 1a: v and y contain only a's.**
Pump up (i=2): we add extra a's but not extra b's or c's. String `uv²xy²z` has more a's than b's (or c's) → not in L. ✗

**Case 1b: v contains only a's, y contains only b's.**
Pump up (i=2): adds one batch of a's and one batch of b's. Now the counts are: #a = p + |v|, #b = p + |y|, #c = p. Since these might differ, but the issue is #c = p while #a or #b increases → unequal counts. ✗

Actually: if |v| = |y|, then #a and #b both increase by |v|, but #c stays at p → #a = #b ≠ #c → not in L. If |v| ≠ |y|, then #a ≠ #b → not in L. Either way, not in L. ✗

**Case 1c: v and y both contain only b's.**
Same argument as 1a but for b's. ✗

**Case 1d: v contains only b's, y contains only c's.**
Pump up: add b's and c's. Now #b > p while #a = p → #a ≠ #b → not in L. ✗

**Case 1e: v and y contain only c's.**
Pump up: add c's only. #c > p while #a = #b = p → not in L. ✗

**The key missing case: can v span a's AND b's AND c's?**

For v to contain all three symbol types, v must cross both the a-b boundary and the b-c boundary. But |v| ≤ |vxy| ≤ p, and the total a-block and b-block together have length 2p. For v to span a's, b's, AND c's, v must have length > 2p ≥ |vxy|... wait, that's not right.

Let me re-examine: vxy ≤ p in length. The a-block is p long, b-block is p long. For vxy to span a-b-c, it would need length > 2p. But |vxy| ≤ p < 2p. So vxy can span at most TWO adjacent symbol types. Therefore v and y together can contain at most two types.

This means pumping either:
- Adds only a's (and/or b's), or only b's (and/or c's)
- In no case can it simultaneously adjust a's, b's, AND c's together

**Conclusion:** For any split (regardless of case), pumping with i=2 or i=0 produces a string not in L. This contradicts the lemma. Therefore L is not context-free. □

---

## 7.5 Proof: {ww | w ∈ {a,b}*} Is Not a CFL

**Claim:** `L = {ww | w ∈ {a,b}*}` is not context-free.

**Choose:** `s = aᵖbᵖaᵖbᵖ`. Note |s| = 4p ≥ p, and s = ww where w = aᵖbᵖ ∈ L.

**Adversary splits:** `s = uvxyz` with |vy| ≥ 1, |vxy| ≤ p.

**Key observation:** The midpoint of s is between positions 2p and 2p+1 (between the second bᵖ-block and the third aᵖ-block). Since |vxy| ≤ p, the substring vxy is entirely within one of the four blocks OR spans at most two adjacent blocks. It cannot span the critical midpoint.

**Why this matters:** For s to remain of the form ww after pumping, the first half and second half must remain identical. But pumping v and y adds characters to (at most) two adjacent symbol positions — only in the first half, or only in the second half, or straddling the boundary but only within p characters of the midpoint.

**Case analysis:**

Let's say vxy lies entirely in the first half (positions 1 to 2p). Pumping up (i=2) adds characters to the first half only. The first half changes; the second half doesn't. The resulting string is no longer of the form ww (first half ≠ second half). ✗

Similarly if vxy lies entirely in the second half — pumping only changes the second half. ✗

If vxy straddles the midpoint (crosses position 2p): Since |vxy| ≤ p, it can reach at most p/2 characters into each half. Pumping adds copies of v and y — but they're symmetric around the midpoint only if they're both empty or both in perfectly symmetric positions. Since |vy| ≥ 1, the pumping is asymmetric. The pumped string doesn't have equal halves. ✗

**Conclusion:** In all cases, pumped string ∉ L. Contradiction → L is not context-free. □

---

## 7.6 Proof: {a^(n²) | n ≥ 0} Is Not a CFL

**Claim:** `L = {aᵐ | m is a perfect square}` is not context-free.

**Choose:** `s = aᵖ²`. Since p² ≥ p for p ≥ 1, |s| ≥ p and s ∈ L.

**Adversary splits:** `s = uvxyz = aᵖ²`, with |vy| ≥ 1, |vxy| ≤ p.

Since s = aᵖ² (all a's), any split gives u = aʲ, v = aᵛ, x = aˣ, y = aʸ, z = aᵉ where j+v+x+y+e = p².

After pumping with i: `uvⁱxyⁱz = a^(p² + (i-1)(v+y))`.

**We need to show:** `p² + (v+y)` is not a perfect square (using i=2, adding v+y extra a's).

**Bounds on v+y:** We know:
- `|vy| ≥ 1` → v+y ≥ 1
- `|vxy| ≤ p` → v+x+y ≤ p → v+y ≤ p

So: `1 ≤ v+y ≤ p`.

**After pumping (i=2):** string has length `p² + (v+y)`.

**Is p² + (v+y) a perfect square?**

The next perfect square after p² is (p+1)² = p² + 2p + 1.

We need: `p² < p² + (v+y) < (p+1)² = p² + 2p + 1`

This holds iff `0 < v+y < 2p + 1`, i.e., `v+y ≤ 2p`.

Since v+y ≤ p (from the bound above) and p ≤ 2p, we have v+y ≤ p < 2p+1. So yes:

```
p² < p² + (v+y) ≤ p² + p < p² + 2p + 1 = (p+1)²
```

Therefore `p² + (v+y)` lies strictly between p² and (p+1)² — it's not a perfect square. ✗

**Conclusion:** Pumping with i=2 yields a string not in L. Contradiction → L is not context-free. □

---

## 7.7 Tricky Cases: What the Lemma Cannot Prove

**The Pumping Lemma is necessary but not sufficient for non-CFL-ness.** A language might satisfy the pumping lemma yet not be context-free (this is more common for regular languages, but the same limitation applies here).

**More importantly:** some people make errors trying to prove things ARE context-free using the pumping lemma. The lemma only gives you one direction (if CFL then pumpable — equivalently, if not pumpable then not CFL). You cannot use "it's pumpable" to conclude it's a CFL.

### Languages That Are Actually Context-Free

These look hard but have CFGs:
- `{aⁿbᵐ | n ≤ m}` — CFG: S → aSb | Sb | ε (add extra b's)
- `{aⁿbᵐ | n ≠ m}` — CFG: union of {n < m} and {n > m}, both CFLs
- `{a^i b^j c^k | i+j=k}` — c's count the a's and b's: CFG handles it

### Ogden's Lemma (Strengthened Version)

The CFL Pumping Lemma can be strengthened: if we *mark* at least p positions in s, the split uvxyz has v or y containing a marked position. This gives more control over which positions are pumped and makes some proofs easier.

We won't prove Ogden's Lemma here, but it's useful when the basic pumping lemma requires exhaustive case analysis over many sub-cases.

---

## 7.8 The Landscape After This Proof

With both pumping lemmas in hand, we can now map the hierarchy:

```
Regular Languages                 (closed under ∩, complement)
    ⊊
Deterministic CFLs                (closed under complement, NOT ∩)
    ⊊
Context-Free Languages            (closed under ∪, ·, *, NOT ∩ or complement)
    ⊊
Context-Sensitive Languages
    ⊊
Decidable Languages               (Turing machines that halt)
    ⊊
Recognizable Languages            (Turing machines that may loop)
```

**Non-CFL examples:** `{aⁿbⁿcⁿ}`, `{ww}`, `{a^(n²)}`, `{aⁿ | n is prime}` (actually prime IS context-free — see Q5!), `{aⁱbʲ | j = i²}`.

**Next tier:** Chapter 8 introduces Turing machines, which can handle `{aⁿbⁿcⁿ}` — and anything computable.

---

## Section Challenge

---

**Q1.** Prove that `L = {aⁱbʲcᵏ | i < j < k}` is not a context-free language.

<details>
<summary>Answer</summary>

**Choose:** `s = aᵖb^(p+1)c^(p+2)`. Clearly i=p < j=p+1 < k=p+2, so s ∈ L. |s| = 3p+3 ≥ p.

**Adversary splits:** `s = uvxyz` with |vy| ≥ 1, |vxy| ≤ p.

**Key observation:** Since |vxy| ≤ p and the string has three blocks each of size ≈ p, the substring vxy can span at most two adjacent block types (same reasoning as {aⁿbⁿcⁿ}).

**Case analysis (same structure as §7.4):**

Any pumping can only increase counts of at most two adjacent symbol types simultaneously. Let's check each case with i=2 (add v+y extra symbols):

- **v,y ⊆ a-block:** Add a's. New count: #a increases, #b and #c unchanged. Now #a ≥ p + 1 (could become = p+1+|v|+|y|). Eventually #a ≥ #b, violating i < j. ✗
  
  Wait — we need to be careful. After adding, counts are: #a = p + |v| + |y|, #b = p+1, #c = p+2. We need i < j, i.e., p + |v| + |y| < p+1. This requires |v|+|y| < 1, i.e., |vy|=0. But |vy| ≥ 1. Contradiction. ✗

- **v ⊆ a-block, y ⊆ b-block (or v,y ⊆ b-block):** Add a's and b's. If |v| = |y|, both a-count and b-count increase by the same amount — they remain consecutive iff the original gap survives. But c-count is fixed at p+2 while a and b counts increase — eventually j ≥ k. If |v| ≠ |y|, then either i ≥ j or j ≥ k depending on which increases more. ✗

  More carefully: after pumping, #a = p+|v|, #b = p+1+|y|, #c = p+2. We need #a < #b < #c. Since #c = p+2 is fixed and #b = p+1+|y| increases, eventually #b ≥ p+2 = #c when |y| ≥ 1. Since |vy| ≥ 1 and if |y| ≥ 1, we get #b ≥ #c. ✗ If |y| = 0, then |v| ≥ 1 (non-empty). #a = p+|v| ≥ p+1 = #b. So i ≥ j. ✗

- **v,y ⊆ b-block or v ⊆ b-block, y ⊆ c-block, or v,y ⊆ c-block:** By symmetric argument, pumping increases b or c counts, breaking the strict inequality chain. ✗

**Conclusion:** No valid pumping exists → contradiction → L is not context-free. □
</details>

---

**Q2.** The language `L = {aⁿb²ⁿ | n ≥ 0}` IS a CFL (CFG: `S → aSbb | ε`). Show that it satisfies the pumping lemma — i.e., give a pumping length and show any long string can be pumped.

<details>
<summary>Answer</summary>

**Claim:** L is pumpable (consistent with being a CFL).

**Pumping length:** p = 3 (any value works; pick one where strings are long enough to demonstrate the structure).

**Consider any s ∈ L with |s| ≥ p.** Write s = aⁿb²ⁿ for some n ≥ 2 (since |s| = 3n ≥ 3).

**Exhibit a valid split:** Let:
- u = aⁿ⁻¹ (all but the last a)
- v = a (the last a)
- x = ε (empty)
- y = bb (two b's)
- z = b^(2n-2) (remaining b's)

Check conditions:
1. |vy| = |a| + |bb| = 3 ≥ 1 ✓
2. |vxy| = |a| + |ε| + |bb| = 3 ≤ p (we can set p = 3) ✓
3. uvⁱxyⁱz = aⁿ⁻¹ · aⁱ · ε · (bb)ⁱ · b^(2n-2) = a^(n-1+i) · b^(2i+2n-2) = a^(n-1+i) · b^(2(n-1+i)) ∈ L ✓

This demonstrates a valid pumping decomposition for every long string in L, confirming the lemma holds. The language is pumpable — as expected for a CFL.
</details>

---

**Q3.** Prove `L = {aⁱbʲ | j = i²}` is not a context-free language.

<details>
<summary>Answer</summary>

**Choose:** `s = aᵖb^(p²)`. |s| = p + p² ≥ p, s ∈ L.

**Adversary splits:** s = uvxyz with |vy| ≥ 1, |vxy| ≤ p.

Write u = aᵃ, v = aᵛ, x = aˣbʸ (possibly spanning the boundary), y = bᴺ, z = bᵉ where all counts sum correctly.

Since |vxy| ≤ p and the a-block has length p, the substring vxy either:
- Lies entirely in the a-block: v = aᵛ, y = aʸ (no b's)
- Spans a-block and b-block: v in a-block, y in b-block
- Lies entirely in the b-block: v = bᵛ, y = bʸ

**Case 1: v and y are both in a-block (y contains only a's).**
After pumping i=2: #a = p + (v+y), #b = p². But we need #b = (#a)². New #a = p + |v| + |y|, so need p² = (p + |v| + |y|)².

p² = (p + k)² where k = |v|+|y| ≥ 1. So p² = p² + 2pk + k² > p² for k ≥ 1. Contradiction. ✗

**Case 2: v in a-block, y in b-block.**

After pumping i=2: #a = p + |v|, #b = p² + |y|. Need p² + |y| = (p + |v|)² = p² + 2p|v| + |v|².

So |y| = 2p|v| + |v|². But |y| ≤ |vxy| ≤ p, so p² + 2p|v| must ≤ p. This requires 2p|v| ≤ 0, i.e., |v| = 0. If |v| = 0, then |y| must be 0 too (since |v| = 0 and |vy| ≥ 1 means |y| ≥ 1). With |v|=0, |y|=2p·0+0=0, but |y|≥1. Contradiction. ✗

**Case 3: v and y both in b-block.**
After pumping i=2: #a = p, #b = p² + |v| + |y|. Need p² + |v|+|y| = p². So |v|+|y| = 0, contradicting |vy| ≥ 1. ✗

**Conclusion:** All cases fail. Pumping lemma is violated → L is not context-free. □
</details>

---

**Q4.** Is the language of all binary strings where #0 = #1 context-free? Prove your answer.

<details>
<summary>Answer</summary>

**Yes, it IS context-free.**

**CFG:**
```
S → 0S1 | 1S0 | SS | ε
```

Each rule:
- `0S1`: a 0 matched with a 1 on the right, with balanced content in between
- `1S0`: a 1 matched with a 0 on the right
- `SS`: two independent balanced substrings concatenated
- `ε`: empty string (0 zeros, 0 ones — balanced)

**Verification for `0110`:**
```
S → SS
  → 0S1 · S
  → 01 · S       (inner S → ε)
  → 01 · 1S0
  → 01 · 10      (inner S → ε)
  = 0110 ✓
```

**Note:** This is the same as balanced parentheses, just with {0,1} instead of {(,)}. The language is sometimes called "Dyck words over two pairs" and is provably context-free.

**Why no pumping lemma violation:** Consider any long string s with |s| ≥ p. We can always find a matching pair (0 at position i, matching 1 at position j, or vice versa) within a bounded window — this gives us the v and y for pumping. The grammar structure ensures the necessary decomposition always exists.
</details>

---

**Q5.** Is `L = {aⁿ | n is prime}` context-free? This is the language of strings of a's whose length is a prime number.

<details>
<summary>Answer</summary>

**No, it is NOT context-free.** (We proved it's not even regular in Chapter 4 using a different argument; here we show it fails the CFL pumping lemma too.)

**Choose:** Let p be the pumping length. Pick any prime q > p. Choose s = aᵍ. |s| = q ≥ p, s ∈ L.

**Adversary splits:** s = uvxyz (all a's), so v = aᵛ, y = aʸ for some v, y ≥ 0 with v+y ≥ 1.

**After pumping with i:** |uvⁱxyⁱz| = q + (i-1)(v+y).

**Need to find i such that q + (i-1)(v+y) is not prime.**

Let k = v+y ≥ 1. Choose i = q+1. Then:

```
|string| = q + q·k = q(1 + k)
```

Since k ≥ 1, we have 1+k ≥ 2, so q(1+k) is composite (product of two integers both ≥ 2, since q is prime ≥ 2 and 1+k ≥ 2). Therefore the pumped string has non-prime length → not in L. ✗

**Alternative (cleaner i choice):** Use i = q. Then:

```
|string| = q + (q-1)k = q + qk - k = q(1+k) - k
```

Hmm, this isn't as clean. Let's stick with i = q+1: gives q(1+k), which is composite. ✗

**Conclusion:** For any valid split, pumping with i = q+1 gives a composite-length string → not in L. Contradiction → L is not context-free. □

**Interesting note:** The proof that primes aren't regular (Chapter 4) used i = p - (p mod k) to force composite length via a different factoring trick. The CFL version with i = q+1 is actually cleaner because we have a prime q > p to work with.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| Why needed | Regular pumping lemma too weak for CFL vs non-CFL separation |
| Source | Repeated variable R in parse tree creates nested pump structure |
| Statement | s = uvxyz, |vy|≥1, |vxy|≤p, uvⁱxyⁱz ∈ L for all i≥0 |
| Two pumps | v and y pumped simultaneously; reflects two occurrences of R in tree |
| Bound constraint | |vxy| ≤ p forces vxy into at most two adjacent symbol blocks |
| Proof template | choose adversarial s; case-analyze all possible (v,y) contents; pump to violate defining property |
| Classic non-CFLs | {aⁿbⁿcⁿ}, {ww}, {a^n²}, {aⁱbʲ | j=i²} |
| Limitation | pumpable ≠ CFL; necessary but not sufficient |

**Where we go next:** Chapter 8 introduces Turing machines — the universal model of computation that can handle everything a stack-based machine cannot.

---

*Previous: [06 — Pushdown Automata](06_Pushdown_Automata.md)*
*Next: [08 — Turing Machines](08_Turing_Machines.md)*
