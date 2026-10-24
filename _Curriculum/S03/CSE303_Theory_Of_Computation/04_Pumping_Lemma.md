# Chapter 04 — The Pumping Lemma for Regular Languages

> [← 03 Regular Expressions](03_Regular_Expressions.md) | [Course Index](README.md) | [Next → 05 Context-Free Grammars](05_Context_Free_Grammars.md)

---

## The Problem: How Do You PROVE a Language Is NOT Regular?

We've proven languages ARE regular by constructing DFAs or NFAs. But we claimed {aⁿbⁿ} and {palindromes} are not regular. How do we prove a language ISN'T recognizable by ANY DFA?

You can't just try and fail — maybe you're not clever enough to find the DFA. You need a mathematical tool that proves no DFA exists.

The **Pumping Lemma** gives a necessary condition for regularity. If a language fails the condition, it's provably NOT regular.

---

## Deriving the Pumping Lemma

**Starting observation:** A DFA with k states processes any string w by visiting a sequence of states:

```
q₀ →σ₁→ q₁ →σ₂→ q₂ → ... →σₙ→ qₙ
```

If |w| = n ≥ k, then the sequence q₀, q₁, ..., qₙ has n+1 ≥ k+1 states. Since there are only k distinct states, **by the Pigeonhole Principle, some state appears TWICE.**

Let qᵢ = qⱼ for 0 ≤ i < j ≤ k. Then:
- The machine visits qᵢ on the (i+1)-th step and qⱼ = qᵢ on the (j+1)-th step.
- Between positions i and j, the machine traversed a CYCLE back to the same state.
- **The substring w[i+1..j] can be repeated (pumped) any number of times — the cycle repeats.**

```
w = w[1..i] · w[i+1..j] · w[j+1..n]
    ───x────   ─────y─────   ──────z──────
    prefix     "the loop"     suffix

The machine goes: q₀ →x→ qᵢ →y→ qᵢ →z→ qₙ
                             ↑─────↑ (cycle!)

Pumping: q₀ →x→ qᵢ →y→ qᵢ →y→ qᵢ →y→ ... →y→ qᵢ →z→ qₙ
```

Since qᵢ is the same state before and after each y, the DFA reaches qₙ with any number of y-repetitions. If the original string was accepted (qₙ ∈ F), then xy⁰z, xy¹z, xy²z, xy³z, ... are ALL accepted.

---

## Formal Statement of the Pumping Lemma

**Pumping Lemma for Regular Languages:**

If L is a regular language, then there exists a pumping length p ≥ 1 such that for every string w ∈ L with |w| ≥ p, there exists a decomposition w = xyz satisfying:

1. **|xy| ≤ p** (the loop is found within the first p characters)
2. **|y| ≥ 1** (the loop is non-empty)
3. **xyⁱz ∈ L for all i ≥ 0** (pumping y any number of times keeps the string in L)

**The contrapositive (how to USE it):**

If L is a language such that for every p ≥ 1, there exists a string w ∈ L with |w| ≥ p, and for ALL decompositions w = xyz with |xy| ≤ p and |y| ≥ 1, there exists some i ≥ 0 with xyⁱz ∉ L — then L is NOT regular.

---

## Template for Using the Pumping Lemma

```
Proof that L is not regular:
  Assume (for contradiction) that L is regular. Let p be the pumping length.
  
  Choose a string w ∈ L with |w| ≥ p.
    [Choose cleverly — make it so any decomposition w=xyz fails condition 3]
  
  Consider ALL possible decompositions w = xyz with |xy| ≤ p, |y| ≥ 1.
    [Usually |xy| ≤ p forces y to be a specific type of substring]
  
  Show that for EVERY such decomposition, some xyⁱz ∉ L.
    [Pick i = 0 or i = 2 — whichever gives a string not in L]
  
  This contradicts condition 3 → L is NOT regular. □
```

---

## Proof 1: {aⁿbⁿ | n ≥ 0} Is Not Regular

**Setup:** Assume L = {aⁿbⁿ} is regular with pumping length p.

**Choose w:** w = aᵖbᵖ. Clearly w ∈ L and |w| = 2p ≥ p. ✓

**Any decomposition w = xyz with |xy| ≤ p, |y| ≥ 1:**

Since |xy| ≤ p and the first p characters of w are all a's: **x and y consist ENTIRELY of a's.** (y cannot contain any b's or span the a-b boundary.)

So: x = aˢ, y = aᵏ (k ≥ 1), z = aᵖ⁻ˢ⁻ᵏbᵖ.

**Pump with i = 2:** xy²z = aˢ · aᵏ · aᵏ · aᵖ⁻ˢ⁻ᵏbᵖ = aᵖ⁺ᵏbᵖ.

Since k ≥ 1: this has p+k a's and p b's. Since p+k ≠ p: **aᵖ⁺ᵏbᵖ ∉ L**. ✗

**Pump with i = 0:** xy⁰z = aˢ · aᵖ⁻ˢ⁻ᵏbᵖ = aᵖ⁻ᵏbᵖ.

Since k ≥ 1: p-k < p, so this has fewer a's than b's → **aᵖ⁻ᵏbᵖ ∉ L**. ✗

Either way: condition 3 fails. Contradiction → L is NOT regular. □

---

## Proof 2: {ww | w ∈ {a,b}*} Is Not Regular (Squared Strings)

**Setup:** Assume L = {ww | w ∈ {a,b}*} is regular with pumping length p.

**Choose:** s = aᵖbaᵖb (which is ww for w = aᵖb). Clearly s ∈ L.

**Decomposition:** |xy| ≤ p and the first p characters are a's → y = aᵏ (k ≥ 1), y is all a's.

**Pump i = 2:** xy²z = aᵖ⁺ᵏbaᵖb. Is this in L?

- For this to be "ww" form, we'd need a string t such that tt = aᵖ⁺ᵏbaᵖb.
- Length: 2p+k+2. For this to be ww, the length must be even AND the first half must equal the second half.
- Length = 2p+k+2. Even iff k is even.

If k is even: t = aᵖ⁺ᵏ/²ba^{p-k/2}? No — the midpoint is position p+k/2+1, which falls within the block of a's in the first half. The second half would start at position p+k/2+1 with 'b', but the first half has 'b' at position p+k+1. These don't align unless p+k/2+1 = p+k+1 → k/2 = k → k=0. But k ≥ 1, contradiction.

**More carefully:** For aᵖ⁺ᵏbaᵖb to be ww, we need the string to consist of two equal halves. The 'b's are at positions p+k+1 and 2p+k+2. In ww, b's appear at positions |w|/2 + ... — but for any w, the structure must be symmetric. The two b's are not equidistant, so aᵖ⁺ᵏbaᵖb ∉ L for k ≥ 1. ✗

Contradiction → L is NOT regular. □

---

## Proof 3: {w | w is a palindrome} Is Not Regular

**Setup:** Assume L_pal is regular with pumping length p.

**Choose:** w = aᵖbaᵖ. This is a palindrome: aᵖbaᵖ reversed = aᵖbaᵖ. ✓ w ∈ L.

**Decomposition:** |xy| ≤ p, y ∈ a⁺ (first p chars are a's → y = aᵏ, k ≥ 1).

**Pump i = 2:** xy²z = aᵖ⁺ᵏbaᵖ.

- Is aᵖ⁺ᵏbaᵖ a palindrome? Reversed: aᵖbaᵖ⁺ᵏ.
- aᵖ⁺ᵏbaᵖ ≠ aᵖbaᵖ⁺ᵏ (since k ≥ 1: different number of a's on each side).
- NOT a palindrome → ∉ L. ✗

Contradiction → L_pal is NOT regular. □

---

## What the Pumping Lemma Does NOT Prove

**Common mistake:** "If L satisfies the pumping lemma conditions, then L is regular."

**FALSE.** The pumping lemma is a NECESSARY condition, not SUFFICIENT.

There exist non-regular languages that satisfy the pumping lemma! Example:

```
L = {aⁱbʲcᵏ | i=0 or j=k}

Claim: L satisfies the pumping lemma with p=1.
Any string in L with |w| ≥ 1 can be pumped... (this is a non-trivial example).
Yet L is NOT regular (can be shown by other means).
```

The pumping lemma only gives a way to DISPROVE regularity. Proving regularity requires constructing a DFA/NFA/regex.

---

## Section Challenge

> ### Applying the Pumping Lemma
>
> **Q1:** Prove that L = {0ⁿ1ⁿ0ⁿ | n ≥ 0} is not regular using the pumping lemma.
>
> **Q2:** Prove that L = {ww | w ∈ {a,b}*} is not regular. (Hint: use w = aᵖbᵖaᵖbᵖ or argue directly that the midpoint constraint is violated.)
>
> **Q3:** Is the pumping lemma necessary for non-regularity proofs, or could you always use the Myhill-Nerode theorem instead? The Myhill-Nerode theorem says L is regular iff there are finitely many equivalence classes under the relation: x ≡_L y iff (for all z: xz ∈ L ↔ yz ∈ L). Use Myhill-Nerode to prove {aⁿbⁿ} is not regular by showing infinitely many equivalence classes.
>
> **Q4:** The language L = {a^(n²) | n ≥ 0} = {ε, a, aaaa, aⁿ where n is a perfect square}. Prove L is not regular using the pumping lemma. Hint: show that pumping a middle segment of aᵖ² will give you a string a^(p²+k) which is not a perfect square when 0 < k ≤ p.
>
> **Q5 (Stretch):** Consider L = {aⁿ | n is prime}. Prove L is not regular. Note: you need to show that pumping leads to a composite number of a's. Use the fact that if p is the pumping length and we pump a prime m ≥ p by adding k ≥ 1 each time, then m + k×j is prime for at most finitely many j... (actually, the key step is more subtle — use the Pumping Lemma directly on a prime m ≥ p+2.)

<details>
<summary>Full answers</summary>

```
Q1: L = {0ⁿ1ⁿ0ⁿ} is not regular

Assume L regular with pumping length p.
Choose: w = 0ᵖ1ᵖ0ᵖ ∈ L. |w| = 3p ≥ p.

Decomposition w = xyz with |xy| ≤ p, |y| ≥ 1:
Since |xy| ≤ p, and the first p characters are 0s: x and y consist entirely of 0s.
y = 0ᵏ for some k ≥ 1. x = 0ˢ, z = 0^{p-s-k}1ᵖ0ᵖ.

Pump i = 0: xy⁰z = 0^{p-k}1ᵖ0ᵖ.
This has p-k zeros, then p ones, then p zeros.
For this to be in L, we need the form 0ⁿ1ⁿ0ⁿ → all three groups must be equal.
0^{p-k} ≠ p (since k ≥ 1), so the groups are not equal → ∉ L. ✗

Contradiction → L is NOT regular. □

──────────────────────────────────────────────────────

Q2: {ww} is not regular (using aᵖbᵖaᵖbᵖ)

Assume L = {ww} regular with pumping length p.
Choose: s = aᵖbᵖaᵖbᵖ = ww for w = aᵖbᵖ. s ∈ L. |s| = 4p ≥ p.

Decomposition: |xy| ≤ p → y consists only of a's. y = aᵏ (k ≥ 1).

Pump i = 2: xy²z = aᵖ⁺ᵏbᵖaᵖbᵖ.

Is this in {ww}? Suppose it equals tt for some t. Then |t| = (4p+k)/2 = 2p + k/2.
For t to be a whole string, k must be even. Let k = 2m.

t = a^{p+m}b^{p-m} (the first half, if the split falls correctly).
Then tt = a^{p+m}b^{p-m}a^{p+m}b^{p-m}.

But our string is aᵖ⁺ᵏbᵖaᵖbᵖ = aᵖ⁺²ᵐbᵖaᵖbᵖ.
For tt = aᵖ⁺²ᵐbᵖaᵖbᵖ, we'd need:
  First half: aᵖ⁺²ᵐbᵖ... but |first half| = 2p+m, and the 'b's start at position p+2m+1.
  If p+2m+1 > 2p+m: 2m+1 > p+m → m+1 > p. This may or may not hold.
  If p+2m+1 ≤ 2p+m: the first half ends within the b's.

This case analysis gets complex. Key insight: the second half must equal the first half.
But the second half of aᵖ⁺²ᵐbᵖaᵖbᵖ (for any split) will have different structure.

Cleaner: for k=2 (the simplest case): s = aᵖ⁺²bᵖaᵖbᵖ.
The string has two groups of b's: first at position p+3, second at position 2p+3.
For this to be ww, the 'a's in the second copy of w must start at position |w|+1.
The string transitions at some position from a's to b's: at position p+3.
For ww structure, the second 'a'-group must start at position |w|+1 = 2p+2 (if |w|=2p+1).
But the second 'a'-group starts at position p+3+p = 2p+3. So 2p+3 = 2p+2 → 3=2. Contradiction. ∉ L. □

──────────────────────────────────────────────────────

Q3: Myhill-Nerode proof for {aⁿbⁿ}

Define relation: x ≡_L y iff for all z, xz ∈ L ↔ yz ∈ L.

Consider the strings aⁱ and aʲ for i ≠ j.

aⁱbⁱ ∈ L but aʲbⁱ = aʲbⁱ ∉ L (different counts of a's and b's).

Taking z = bⁱ: aⁱz = aⁱbⁱ ∈ L but aʲz = aʲbⁱ ∉ L (since j ≠ i).

Therefore aⁱ ≢_L aʲ for all i ≠ j.

The strings {a⁰, a¹, a², a³, ...} = {ε, a, aa, aaa, ...} are all in DIFFERENT equivalence classes.
There are infinitely many such classes.

By the Myhill-Nerode theorem, if L is regular, there are only FINITELY many equivalence classes.
Since there are infinitely many: L = {aⁿbⁿ} is NOT regular. □

Myhill-Nerode is more powerful than the pumping lemma: it gives an IF AND ONLY IF characterization
(L is regular iff finitely many classes), whereas the pumping lemma is only one direction.
The pumping lemma is often easier to apply for specific proofs though.

──────────────────────────────────────────────────────

Q4: {a^(n²)} is not regular

Assume L regular with pumping length p.
Choose: w = a^{p²} ∈ L. |w| = p² ≥ p (assuming p ≥ 1).

Decomposition: w = xyz, |xy| ≤ p, y = aᵏ (k ≥ 1, k ≤ p since |y| ≤ |xy| ≤ p).

Pump i = 2: xy²z = a^{p²+k}.

Is p²+k a perfect square? The next perfect square after p² is (p+1)² = p²+2p+1.
We need: p² < p²+k ≤ (p+1)²? No — we need p²+k to NOT be a perfect square.

Since k ≤ p: p²+k ≤ p²+p < p²+2p+1 = (p+1)².
So p² < p²+k < (p+1)², which means p²+k lies STRICTLY between two consecutive perfect squares.
Therefore p²+k is NOT a perfect square → a^{p²+k} ∉ L. ✗

(We used: the only perfect squares ≥ p² are p², (p+1)², (p+2)², ..., and the gap between consecutive ones
is (n+1)² - n² = 2n+1 > p for n ≥ p. Since k ≤ p < 2p+1: p² < p²+k < (p+1)².)

Contradiction → L = {a^{n²}} is NOT regular. □

──────────────────────────────────────────────────────

Q5: {aⁿ | n is prime} is not regular

Assume L_prime regular with pumping length p.
Choose: let m be any prime with m ≥ p + 2 (such a prime exists by Euclid's theorem — infinitely many primes).
Let w = aᵐ ∈ L_prime. |w| = m ≥ p. ✓

Decomposition: w = xyz, |xy| ≤ p, y = aᵏ (k ≥ 1), z = a^{m-s-k} for some s ≥ 0.
  |x| = s, |y| = k, |z| = m - s - k = m - (s+k).

Pump i = m-k (note: this is a large value, not 0 or 2 — we're picking a specific i):

xy^{m-k}z = a^{s + k(m-k) + m-s-k} = a^{km - k² + m - k} = a^{m(k+1) - k(k+1)} = a^{(k+1)(m-k)}.

(k+1) ≥ 2 (since k ≥ 1) and (m-k) ≥ 2 (since m ≥ p+2 ≥ k+2, so m-k ≥ 2).
Therefore (k+1)(m-k) is composite (product of two numbers both ≥ 2) → NOT prime.

So xy^{m-k}z = a^{(k+1)(m-k)} ∉ L_prime (since (k+1)(m-k) is not prime). ✗

Contradiction → L_prime is NOT regular. □

Note: This proof uses the clever choice i = m-k (found by setting s + ik + (m-s-k) = prime-length to fail).
The key: we needed xyⁱz to have composite length for some i ≥ 0. Factoring (k+1)(m-k) achieves this.
```

</details>

---

## Common Misconceptions

**"The pumping lemma is a decision procedure for regularity"**
The pumping lemma does NOT decide regularity. It's a one-way test: failing the lemma → NOT regular; satisfying the lemma → could still be non-regular. For definitive answers, use the Myhill-Nerode theorem or construct a DFA/NFA.

**"You can choose the decomposition w = xyz in the proof"**
YOU DON'T get to choose the decomposition. The lemma says "there exists p such that for all w ∈ L with |w| ≥ p, there EXIST x, y, z..." In a non-regularity proof, you must handle ALL valid decompositions (all y of size 1 to p that could come from the string). If there's even ONE valid decomposition that pumps correctly, your proof fails.

**"Pumping with i=2 is always the right choice"**
Sometimes pumping with i=0 (removing y) is easier. For the {aⁿ | n prime} example, the clever choice was i = m-k. Choose whichever i shows the pumped string is NOT in L.

---

## Connections

- **Chapter 01-02 — DFA/NFA:** The pumping lemma is derived from the DFA state structure (Pigeonhole on states). The pumping length p equals the number of states in the minimal DFA.
- **Chapter 07 — Pumping Lemma for CFLs:** Context-Free Languages have their own pumping lemma (Ogden's lemma / the CFL pumping lemma), which proves certain languages are not context-free in the same way.
- **Chapter 08 — Turing Machines:** Beyond context-free, we prove languages are undecidable via reduction to the Halting Problem — a more powerful technique than any pumping lemma.

---

> [← 03 Regular Expressions](03_Regular_Expressions.md) | [Course Index](README.md) | [Next → 05 Context-Free Grammars](05_Context_Free_Grammars.md)
