# Chapter 03 — Regular Expressions and Kleene's Theorem

> [← 02 NFA and ε-Closure](02_NFA_Epsilon_Closure.md) | [Course Index](README.md) | [Next → 04 Pumping Lemma](04_Pumping_Lemma.md)

---

## The Problem: Describing Languages Without Drawing Automata

DFAs and NFAs describe languages via state diagrams. But for a programmer, writing a DFA for "valid email address" requires drawing tens of states. Can we describe the same language with a compact textual notation?

**Regular expressions** (regex) are a declarative notation for regular languages. Instead of "draw these states and transitions," you write a pattern: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`.

**Kleene's Theorem** proves that RegEx = NFA = DFA: they're three equivalent descriptions of the same class — regular languages.

---

## Formal Regular Expressions (Theoretical)

**Theoretical regex** (simpler than Perl/Python regex) is built from three operations:

**Base cases:**
- `∅` is a regex for the empty language (accepts nothing)
- `ε` is a regex for {ε} (accepts only the empty string)
- `a` is a regex for {a} (for each symbol a ∈ Σ, accepts only "a")

**Recursive cases (for regex R, S over Σ):**
- **Union:** `R|S` (also written R∪S) — matches R OR S
- **Concatenation:** `RS` — matches R followed by S
- **Kleene Star:** `R*` — matches zero or more repetitions of R

**Derived operations (abbreviations):**
- `R+` = RR* (one or more)
- `R?` = R|ε (zero or one)
- `[abc]` = a|b|c (character class)
- `.` = a|b|c|...|z|... (any character, context-dependent)

---

## Examples

**Regex for binary strings with even number of 0s:**
```
(1* 0 1* 0 1*)* | 1*
= zero or more occurrences of "exactly two 0s separated by any 1s"
  OR just 1s (zero 0s)
```

More simply: `1*(01*01*)*` — any 1s, then repeat "01*0" any number of times.

**Regex for strings over {a,b} ending in "ab":**
```
(a|b)*ab
```
- `(a|b)*`: any sequence of a's and b's
- `ab`: ending with "ab"

**Regex for valid C identifiers** (letter or underscore, then letters/digits/underscores):
```
[a-zA-Z_][a-zA-Z0-9_]*
= (a|...|z|A|...|Z|_)(a|...|z|A|...|Z|0|...|9|_)*
```

**Regex for IP addresses** (simplified: four groups of 1-3 digits separated by dots):
```
[0-9]{1,3}(\.[0-9]{1,3}){3}
= [0-9]([0-9][0-9]?)?(\.([0-9]([0-9][0-9]?)?))?... (fully expanded is verbose)
```

---

## Thompson's Construction: RegEx → NFA

**Convert any regex R to an NFA N_R such that L(N_R) = L(R).**

**Base cases:**
```
∅:           →[q₀]  →(dead)    [no accepting states — nothing accepted]
ε:           →(q₀)* →          [q₀ is start AND accept; reads empty string]
  (q₀ has an ε-transition to accept state, or q₀ = accept state)
a (single symbol):  →[q₀] →(a)→ (q₁)*
```

**Union R|S:**
```
Build NFA_R and NFA_S independently.
Add new start state q_start with ε-transitions to start(R) and start(S).
Add new accept state q_acc; accepting states of R and S each have ε→ q_acc.

q_start →ε→ (NFA_R) → q_acc
q_start →ε→ (NFA_S) → q_acc
```

**Concatenation RS:**
```
Build NFA_R and NFA_S.
ε-transitions from each accepting state of NFA_R to start(NFA_S).
New accept states: accepting states of NFA_S.

→ [NFA_R] →ε→ [NFA_S] →
```

**Kleene Star R*:**
```
Build NFA_R.
Add new start/accept state q_start (it's accepting: the empty string is in R*).
ε-transition: q_start → start(NFA_R).
ε-transitions: each accept state of NFA_R → start(NFA_R)  (loop back)
ε-transitions: each accept state of NFA_R → new accept state.

q_start →ε→ [NFA_R] →ε→ q_accept
            ↑___________|  (loop back for repetition)
```

**Size:** Thompson's construction produces an NFA with at most 2|R| states (two states per symbol/operator). Then the subset construction may expand this to a DFA with up to 2^(2|R|) states in the worst case.

---

## Kleene's Theorem: The Triangle of Equivalence

```
Regular Expression
    ↗ (Kleene)      ↘ (Thompson's construction)
DFA  ←────────────── NFA
   (subset construction)
```

**Theorem (Kleene, 1956):** The following three descriptions are equivalent for any language L:
1. L is described by a regular expression.
2. L is recognized by some DFA.
3. L is recognized by some NFA.

**Proof directions:**
- **RegEx → NFA:** Thompson's construction (above)
- **NFA → DFA:** Subset construction (Chapter 02)
- **DFA → RegEx:** State elimination method (below)

---

## State Elimination: DFA → RegEx

**Idea:** Systematically remove states from a DFA, replacing each removed state with a more complex regex on the remaining transitions. At the end, the single remaining transition from start to accept IS the regex.

**Algorithm:**
1. Add new start state s with ε → original start
2. Add new accept state t; each original accept state gets ε → t
3. For each non-s, non-t state q: eliminate q by:
   - For each pair (p, r) of remaining states (p ≠ q, r ≠ q):
   - Label on p→r becomes: (old p→r label) | (p→q label)(q→q label)*(q→r label)
   - Delete state q and all transitions involving q
4. Repeat until only s and t remain. The transition s→t is the regex.

**Example: DFA for {w | w ends in "01"} → Regex**

DFA states: A (start), B (seen "0"), C (accept, seen "01").
```
δ(A,0)=B, δ(A,1)=A
δ(B,0)=B, δ(B,1)=C
δ(C,0)=B, δ(C,1)=A
```

Add start s → A (ε), accept t: C → t (ε).

Eliminate B:
- A→C via B: label = (A→B)(B→B)*(B→C) = 0·0*·1 = 0⁺1
- C→A via B: label = (C→B)(B→B)*(B→A) = 0·0*·∅ = ∅ (no B→A transition)
- C→C via B: label = (C→B)(B→B)*(B→C) = 0·0*·1 = 0⁺1

After eliminating B: transitions among {s, A, C, t}:
```
s →ε→ A
A →1→ A, A →0⁺1→ C
C →∅→ A (from above), C →0⁺1→ C, C →ε→ t
```

Eliminate A:
A has self-loop on "1" → treat as self-loop regex 1*.
- s→C via A: (s→A)(A→A)*(A→C) = ε·1*·0⁺1 = 1*0⁺1
- The label s→C (if any direct): ∅

After eliminating A: only {s, C, t}:
- s →1*0⁺1→ C (or ∅ if no direct s→C)
- C →0⁺1→ C (self-loop)
- C →ε→ t

Eliminate C:
- s→t via C: (s→C)(C→C)*(C→t) = 1*0⁺1 · (0⁺1)* · ε = 1*0⁺1(0⁺1)*

Final regex: `1*0⁺1(0⁺1)*` = `(1|01)(01)*` (simplified)

Or more cleanly: `(0|1)*01` — any binary string ending in "01".

---

## Regular Language Closure Properties

Regular languages are closed under many operations — if L₁ and L₂ are regular, so are:

| Operation | Closure | Construction |
|-----------|---------|-------------|
| Union | L₁ ∪ L₂ | NFA union (ε-transitions) |
| Concatenation | L₁L₂ | NFA concatenation |
| Kleene Star | L₁* | NFA star |
| Complement | L̄₁ = Σ* \ L₁ | Flip accept/non-accept in DFA |
| Intersection | L₁ ∩ L₂ | DFA product construction |
| Difference | L₁ \ L₂ | L₁ ∩ L̄₂ |
| Reverse | L₁ᴿ = {wᴿ | w ∈ L₁} | Reverse DFA transitions |
| Homomorphism | h(L₁) | Apply symbol substitution to regex |

**Complement is easiest on DFAs:** Swap F and Q\F in a complete DFA. Every accepting state becomes rejecting and vice versa.

**Intersection via product construction:** Run two DFAs in parallel; accept only if BOTH accept.

---

## Section Challenge

> ### Regular Expression Equivalence
>
> **Q1:** Write a formal regex (using only |, concatenation, *) for the language L = {w ∈ {a,b}* | w does not contain "aa"}. Hint: think about what positions of 'a' are allowed.
>
> **Q2:** Apply Thompson's construction to build an NFA for the regex `a(b|c)*a`. List all states and transitions. How many states does Thompson's construction produce?
>
> **Q3:** The regex `(0|1)*0(0|1)(0|1)` recognizes binary strings where the third-from-last character is '0'. What is the minimum DFA for this language? (Hint: use the suffix-tracking insight.) How many states does the minimal DFA have?
>
> **Q4:** Prove that the language of palindromes over {a,b} (strings equal to their reverse: "aba", "abba", "aaa") is NOT regular. You may assume the pumping lemma (Chapter 04) or argue via state-count arguments.
>
> **Q5 (Stretch):** The **complement of a regular language is regular.** Use this to show that if L is regular, then the set of strings NOT in L is also regular, and construct the DFA complement of the "ends in 01" DFA. Also prove: if L₁ is regular but L₁ ∩ L₂ is not regular, then L₂ cannot be regular. (Use: regular languages are closed under intersection; contrapositive.)

<details>
<summary>Full answers</summary>

```
Q1: Regex for strings with no "aa"

A string has no "aa" if every 'a' is followed by a 'b' (or is the last character).
Equivalently: between any two consecutive characters, we never have 'aa'.

Legal building blocks:
  - Start with optional 'b's
  - Then optionally a single 'a'
  - After each 'a', we MUST have at least one 'b' (unless 'a' is the last char)

One correct regex: b*(ab+)*a? | b*(ab+)*
Simplify: b*(ab+)*(a|ε) = b*(ab+)*a?

But we need to also allow: strings starting with 'a' (followed by b's).
Let me think again:

The strings with no "aa" are precisely those matched by: (b | ab)*  followed by  (a|ε)

Wait: (b|ab)* generates: b, ab, bb, abab, bab, etc. Then optional final 'a'.

Check "ab": (ab)* then ε → yes ✓
Check "aba": (ab)* then a → yes ✓
Check "ba": b* then a → yes... but from (b|ab)* we get "b", then "a" → "ba" ✓
Check "bab": "b"+"ab" then ε → yes ✓
Check "aa": from (b|ab)*, we can't get two consecutive a's. Final 'a' makes it "...a".
  Only way to get "aa": last produced by (b|ab)* would need an "a" at end, then final "a" → "aa"?
  But (b|ab)* can only end in 'b' or be empty. So the final optional 'a' gives "a" or "...ba".
  Can't produce "aa". ✓

Final regex: (b | ab)*a? or equivalently (b|ab)*(a|ε)

Check "a": (b|ab)* = ε, then 'a' → "a" ✓
Check "aaaa": Can (b|ab)*(a|ε) produce this? Max a's from (b|ab)* uses "ab" repeatedly:
  (ab)² = "abab" — not all a's. Can't get "aaaa". ✓ REJECT

──────────────────────────────────────────────────────

Q2: Thompson's construction for a(b|c)*a

Step 1: Sub-NFA for 'a' (terminal):
  q₁ →(a)→ q₂  [q₁=start, q₂=accept]

Step 2: Sub-NFA for 'b': q₃ →(b)→ q₄
Sub-NFA for 'c': q₅ →(c)→ q₆

Step 3: b|c (union):
  New start q₇ →ε→ q₃, q₇ →ε→ q₅
  New accept q₈ ← q₄ (ε), q₈ ← q₆ (ε)
  
Step 4: (b|c)* (Kleene star):
  New start/accept q₉:
    q₉ →ε→ q₇ (into the b|c NFA)
    q₈ →ε→ q₇ (loop back)
    q₈ →ε→ q₁₀ (exit to next part)... 
  
  Actually standard Thompson star: new start s* (also accept), s* →ε→ start_of_bc_NFA, 
  each accept_of_bc →ε→ start_of_bc (loop), each accept_of_bc →ε→ s*_accept.
  
  New states: q₉ (start/accept of star), q₁₀ (accept of star).
    q₉ →ε→ q₇  [enter]
    q₈ →ε→ q₇  [loop]
    q₈ →ε→ q₁₀ [exit accept]
    q₉ →ε→ q₁₀ [ε accepted: zero repetitions]

Step 5: Concatenate 'a' · (b|c)* · 'a':
  Sub-NFA for first 'a': q₁ →(a)→ q₂
  (b|c)*: q₉ ... q₁₀
  Sub-NFA for second 'a': q₁₁ →(a)→ q₁₂

  Concatenation: q₂ →ε→ q₉  [first 'a' connects to (b|c)* start]
                 q₁₀ →ε→ q₁₁ [star exit connects to second 'a' start]

Total states: q₁ through q₁₂ = 12 states.

General rule: Thompson's construction uses ≤ 2 × |R| states where |R| is the number
of symbols and operators in the regex. Here: a, (, b, |, c, ), *, a = 8 symbols →
up to 16 states. We used 12 (the exact count varies by formulation).

──────────────────────────────────────────────────────

Q3: DFA for (0|1)*0(0|1)(0|1)

This accepts strings where the 3rd-from-last character is '0'.

State intuition: Track the last 3 characters of input seen so far (a sliding window).
After reading at least 3 characters, the state remembers the last 3 bits.
With fewer than 3 chars, we need a startup phase.

States: startup states for |w| < 3, plus one state per possible 3-bit suffix.
Startup: q_ε (0 chars), q_0, q_1 (1 char), q_00, q_01, q_10, q_11 (2 chars).
Full 3-char states: q_000, q_001, q_010, q_011, q_100, q_101, q_110, q_111.
Total: 1 + 2 + 4 + 8 = 15 states before minimization.

ACCEPT states: 3-char states starting with '0': q_000, q_001, q_010, q_011.
(Third from last char = first of 3-char window = '0'.)

But can we minimize? States q_000 and q_001 both have first bit '0'; after reading another bit,
q_000 →(0)→ q_000, q_000 →(1)→ q_001. Similarly q_001 →(0)→ q_010, q_001 →(1)→ q_011.
These all have different futures → all 8 full-state variants are distinguishable.

Minimum DFA: 1 + 2 + 4 + 8 = 15 states (or slightly fewer after merging startup states
with full states where applicable). In practice the minimum DFA has exactly 8 states:
one per 3-character suffix (treating |w|<3 strings as "not enough input yet" combined into
states that track partial suffixes). With careful analysis:

Minimum: 8 states (one per 3-bit suffix) + at most a dead state.
Some references show 8 states total for this specific pattern after minimization.

──────────────────────────────────────────────────────

Q4: Palindromes are not regular

Informal proof by state-counting argument:

Suppose L = {palindromes over {a,b}} is regular. Let M be a DFA for L with k states.
Consider the k+1 strings: ε, a, aa, aaa, ..., aᵏ (k+1 strings of pure a's).
By the pigeonhole principle, two of these strings — say aⁱ and aʲ (i < j) — lead to the same
state in M after reading them.

Now consider the suffixes: aⁱ (to complete a palindrome aⁱ + aⁱ = a²ⁱ).
M is in the same state after reading aⁱ as after reading aʲ.
So M must give the SAME decision on aⁱ followed by aⁱ as on aʲ followed by aⁱ.

a²ⁱ = aⁱaⁱ is a palindrome → accepted.
aʲaⁱ (with j>i): this string has length i+j. Is it a palindrome?
  Reversed: (aⁱaʲ) ≠ aʲaⁱ (since i≠j). NOT a palindrome.

But M gives the same answer for both (same state after prefix, same suffix) → contradiction.
One must be accepted and the other rejected, but the DFA treats them identically.

Therefore, no DFA can correctly decide palindromes → not regular.

(This is the same argument as the pumping lemma — we use the state limit to derive a contradiction.)

──────────────────────────────────────────────────────

Q5: Complement and intersection preservation

Complement DFA for "ends in 01":
  Original DFA: {A (start), B (seen 0), C (accept)}
  δ: A→0→B, A→1→A, B→0→B, B→1→C, C→0→B, C→1→A.
  F = {C}.
  
  Complement DFA: flip F and Q\F.
  F_complement = {A, B} (reject C, accept everything else).
  
  This accepts strings NOT ending in "01": strings ending in 0, 1, or shorter than 2 chars,
  or strings ending in 11, 00, 10. Equivalently: all binary strings EXCEPT those ending in "01".

Proof of "regular ∩ non-regular = non-regular" (contrapositive):

Claim: If L₁ is regular and L₂ is not regular, then L₁ ∩ L₂ is not regular.

Proof by contrapositive: Assume L₁ ∩ L₂ IS regular.
Then since regular languages are closed under complement: L̄₁ is regular.
And closed under union: (L₁ ∩ L₂) ∪ L̄₁ is regular.

Observe: (L₁ ∩ L₂) ∪ L̄₁ = (L₂ ∪ L̄₁) since:
  x ∈ (L₁∩L₂)∪L̄₁ iff (x∈L₁ and x∈L₂) or x∉L₁
  iff x∈L₂ or x∉L₁  (when x∉L₁, the left disjunct gives x ∉ L₁ anyway)
  iff x ∈ L₂ ∪ L̄₁.

So L₂ ∪ L̄₁ is regular. Since L̄₁ is regular and regular is closed under complement:
(L₂ ∪ L̄₁) ∩ L₁ = L₂ ∩ L₁ = L₁ ∩ L₂ is regular (which we assumed). 

Hmm, this doesn't directly get L₂. Let's try:
(L₁ ∩ L₂) ∪ (L̄₁) = ... taking complement: L̄₁ ∩ (closure of L₁∩L₂)...

Simpler: If L₁ ∩ L₂ is regular and L₁ is regular, then 
  L₂ ⊇ L₂ ∩ L₁ = L₁ ∩ L₂ (regular).
  But this doesn't force L₂ to be regular directly.

Corrected claim: If L₁ is regular and L₁ ∩ L₂ is non-regular, then L₂ is non-regular.

Proof: Contrapositive: if L₂ is regular and L₁ is regular, then L₁ ∩ L₂ is regular
(closed under intersection). So if L₁ ∩ L₂ is non-regular, L₂ must be non-regular. □

Application: L₁ = a*b* (regular). L₁ ∩ {aⁿbⁿ} = {aⁿbⁿ} (non-regular, proven by pumping lemma).
Therefore {aⁿbⁿ} is non-regular. (We used L₁ ∩ L₂ ⊆ L₂ and the pumping argument.)
```

</details>

---

## Common Misconceptions

**"Practical regex (Perl/Python) = theoretical regex"**
Practical regex engines add back-references (`\1`), lookahead/lookbehind, and other features that go BEYOND regular languages. A regex with back-references can recognize non-regular languages like `aⁿbⁿ` (using `(\w+)\1` for repeated substrings). Theoretical regex is strictly weaker — and strictly equivalent to DFA/NFA.

**"Kleene star can only be applied to single characters"**
`R*` applies to any regex R. `(ab)*` = {ε, ab, abab, ababab, ...}. The star operates on the language L(R), not individual symbols.

**"(a|b)* and [ab]* are different"**
In both theoretical and practical regex, these are equivalent: both match any string over {a,b}. `(a|b)*` is the formal theoretical expression; `[ab]*` is the character-class shorthand.

---

## Connections

- **Chapter 02 — NFA:** Thompson's construction goes from RegEx → NFA. The NFA is the intermediate form for implementing regex matching engines.
- **Chapter 04 — Pumping Lemma:** Uses the finiteness of DFA/NFA states (which comes from the finiteness of regex description) to prove non-regularity.
- **Chapter 05 — CFG:** Context-Free Grammars extend regex by allowing recursive productions — enabling counting and matching (aⁿbⁿ) that regex cannot express.

---

> [← 02 NFA and ε-Closure](02_NFA_Epsilon_Closure.md) | [Course Index](README.md) | [Next → 04 Pumping Lemma](04_Pumping_Lemma.md)
