# Chapter 01 — Deterministic Finite Automata (DFA)

> [Course Index](README.md) | [Next → 02 NFA and ε-Closure](02_NFA_Epsilon_Closure.md)

---

## The Problem: Recognizing Patterns Without Memory

You're writing a lexer for a programming language. The lexer must decide whether a string of characters is a valid identifier (`foo_bar2`), a number (`3.14`), or an operator (`+=`).

You scan character by character. You can't store the entire string first — you're streaming. What's the minimal computation needed to decide, at each character, whether you're still building a valid token?

The answer is a **finite automaton** — a machine with states, not memory. It can decide exactly which patterns are "regular" — and every lexer, every grep pattern, every HTTP state machine is one.

---

## Informal Picture: A Vending Machine

A vending machine accepts coins (state: amount inserted) and vends when you've inserted enough. States: {$0.00, $0.25, $0.50, $0.75, $1.00}. Transitions: insert a quarter → move to next state. No memory of HOW you reached a state — just which state you're in.

A finite automaton is exactly this: a machine with a finite set of states, transitions driven by input symbols, and a decision at the end (accept or reject).

---

## Formal Definition of a DFA

A **Deterministic Finite Automaton** is a 5-tuple M = (Q, Σ, δ, q₀, F) where:

- **Q:** Finite set of states
- **Σ:** Finite alphabet (set of input symbols)
- **δ: Q × Σ → Q:** Transition function — from every state, one symbol leads to exactly one next state. (Deterministic: no choices.)
- **q₀ ∈ Q:** Start state
- **F ⊆ Q:** Set of accepting (final) states

**Operation:**
1. Start in state q₀
2. Read input symbols one at a time: each symbol σᵢ triggers δ(current_state, σᵢ) → next_state
3. After reading all input: accept if current state ∈ F, reject otherwise

---

## Worked Example: DFA for Even Number of 0s

**Goal:** Recognize binary strings with an even number of 0s (including zero 0s).

**States:** We only need to remember one thing: parity of 0s seen so far.
- q_even: have seen an even number of 0s (start here)
- q_odd: have seen an odd number of 0s

**Alphabet:** Σ = {0, 1}

**Transitions:**
```
δ(q_even, 0) = q_odd    (seeing a 0 flips parity)
δ(q_even, 1) = q_even   (seeing a 1 doesn't change parity)
δ(q_odd,  0) = q_even   (flip back)
δ(q_odd,  1) = q_odd    (no change)
```

**Accepting states:** F = {q_even} (accept strings with even 0-count)

**Transition table:**
```
         Input
State    0        1
q_even   q_odd   q_even   ← start, accept
q_odd    q_even  q_odd
```

**Trace on "10010":**
```
Input:  1    0    0    1    0
State: q_even → q_even → q_odd → q_even → q_even → q_odd
                                                          ↑ final state
q_odd ∉ F → REJECT ✓ (the string "10010" has 3 zeros, which is odd)
```

**Trace on "101":**
```
Input:  1    0    1
State: q_even → q_even → q_odd → q_odd
                                     ↑ final state
q_odd ∉ F → REJECT ✓ (one zero = odd)

Wait: let's re-trace:
Input: 1    0    1
State: q_even (start)
  read '1': δ(q_even, 1) = q_even
  read '0': δ(q_even, 0) = q_odd
  read '1': δ(q_odd, 1)  = q_odd  ← final
q_odd ∉ F → REJECT ✓
```

**Trace on "100":**
```
State: q_even → q_even → q_odd → q_even ← final
q_even ∈ F → ACCEPT ✓ (two zeros = even)
```

---

## Extended Transition Function δ*

The transition function δ handles one symbol. Extend it to handle strings:

```
δ*(q, ε) = q               (empty string: stay in current state)
δ*(q, wa) = δ(δ*(q, w), a)  (process string w, then symbol a)
```

The language recognized by DFA M:

```
L(M) = { w ∈ Σ* | δ*(q₀, w) ∈ F }
```

This is the set of all strings the DFA accepts.

---

## Another Example: DFA for Strings Ending in "ab"

**Language:** Σ = {a, b}, accept strings ending in "ab"

**States:** What do I need to remember about the suffix?
- q₀: haven't started a promising suffix (or saw 'b' without preceding 'a')
- q_a: last char was 'a' (might be building "ab")
- q_ab: last two chars were "ab" ← ACCEPT

**Transitions:**
```
δ(q₀,  a) = q_a    (start of potential "ab")
δ(q₀,  b) = q₀    (b alone is useless, stay in dead state... actually q₀)
δ(q_a, a) = q_a    (another 'a' — the NEW 'a' might start the next "ab")
δ(q_a, b) = q_ab   (completed "ab"!)
δ(q_ab, a) = q_a   (started a new potential "ab" suffix)
δ(q_ab, b) = q₀    (broke the "ab" ending — 'b' after "ab" means last was 'b' not "ab")
```

Wait — let me check: after "ab", if we see another 'b', the string ends in "abb" not "ab". So δ(q_ab, b) = q₀? No:

After "ab", if we see 'b': last two chars are "bb", last char is 'b', no pending 'a'. State = q₀.

**F = {q_ab}**

**Trace on "aab":**
```
q₀ →(a)→ q_a →(a)→ q_a →(b)→ q_ab ← ACCEPT ✓
```

**Trace on "aba":**
```
q₀ →(a)→ q_a →(b)→ q_ab →(a)→ q_a ← REJECT ✓ (ends in "a", not "ab")
```

---

## The Subset Construction: DFA from NFA (Preview)

Before diving into NFAs (Chapter 02), note that the key insight of DFA theory is: **every state encodes all the information you need to remember about the past.**

The DFA is a memory-less machine that nonetheless "remembers" what matters by choosing states carefully. The states aren't arbitrary — they correspond to equivalence classes of input prefixes that require the same future behavior.

---

## Regular Languages and the Chomsky Hierarchy

A language is **regular** if there exists a DFA that recognizes it.

**Chomsky Hierarchy (preview):**
```
Regular ⊂ Context-Free ⊂ Context-Sensitive ⊂ Recursively Enumerable
  DFA/NFA       CFG/PDA        LBA                Turing Machine
  (Ch01-04)   (Ch05-07)    (advanced)              (Ch08-09)
```

Every regular language can be described by a finite automaton, a regular expression, or a regular grammar — these are all equivalent (we prove this in Ch02-03).

Regular languages CAN'T describe:
- Balanced parentheses: `()`, `(())`, `((()))` — requires counting depth → need a stack (PDA, Ch06)
- Strings of the form aⁿbⁿ: same issue
- Any language requiring unbounded counting or matching

**Why?** A DFA with k states can only "remember" k different things about the past. When you need to count to an unbounded number (to match aⁿ with bⁿ), k states aren't enough.

---

## DFA Minimization: Fewest States Possible

Two states p and q are **distinguishable** if there exists a string w such that exactly one of δ*(p,w) and δ*(q,w) is in F.

**Myhill-Nerode Theorem (informal):** The minimum DFA for a language L has exactly one state per distinguishability class of L's prefixes.

**Minimization algorithm (Table-filling):**
1. Mark all pairs {accept, reject} as distinguishable (base case)
2. Repeatedly mark {p,q} as distinguishable if ∃σ: {δ(p,σ), δ(q,σ)} is already marked
3. Unmarked pairs = equivalent states → merge them

States that are equivalent recognize the same future suffixes — collapsing them gives the minimum DFA.

**Application:** Compilers and lexers use minimized DFAs for maximum speed. A minimized DFA for keywords like `if`, `else`, `while` has far fewer states than the naive concatenation of individual DFAs.

---

## Section Challenge

> ### DFA Design and Analysis
>
> **Q1:** Design a DFA over Σ = {a, b} that accepts strings where every 'a' is immediately followed by 'b'. (Strings "ab", "bab", "abab" should be accepted; "a", "ba", "abb" should be rejected.)
>
> **Q2:** Design a DFA over Σ = {0, 1} that accepts all binary strings divisible by 3. Hint: the state should represent the remainder when the binary string (read left-to-right as a binary number) is divided by 3. How many states are needed? What are the transitions?
>
> **Q3:** For the DFA in Q2, trace the input "1101" (binary for 13). What is the final state? Is 1101 accepted?
>
> **Q4:** Prove or disprove: the language L = {w ∈ {a,b}* | w contains the same number of a's as b's} is regular. Either construct a DFA or argue why one cannot exist.
>
> **Q5 (Stretch):** The **product construction** combines two DFAs M₁ and M₂ for languages L₁ and L₂ into a single DFA for L₁ ∩ L₂. Formally: Q = Q₁ × Q₂, q₀ = (q₀₁, q₀₂), δ((p,q), σ) = (δ₁(p,σ), δ₂(q,σ)), F = F₁ × F₂. Use this to construct a DFA that accepts binary strings divisible by 3 AND ending in '1'. What are the states, transitions, and accepting states?

<details>
<summary>Full answers</summary>

```
Q1: DFA where every 'a' is immediately followed by 'b'

States:
  q_ok:  all conditions met so far (start, accept)
  q_a:   just saw an 'a', must see 'b' next (NOT an accepting state)
  q_bad: violated the rule (dead/sink state — never accept again)

Transitions:
  δ(q_ok, a) = q_a    (saw an 'a', waiting for 'b')
  δ(q_ok, b) = q_ok   (saw 'b' without preceding 'a' — fine)
  δ(q_a,  a) = q_bad  (two consecutive 'a's without 'b' between — violation)
  δ(q_a,  b) = q_ok   (completed "ab" — back to ok)
  δ(q_bad, a) = q_bad (stays bad)
  δ(q_bad, b) = q_bad (stays bad)

F = {q_ok}

Verification:
  "ab":   q_ok →(a)→ q_a →(b)→ q_ok  ← ACCEPT ✓
  "a":    q_ok →(a)→ q_a  ← REJECT (q_a ∉ F) ✓
  "ba":   q_ok →(b)→ q_ok →(a)→ q_a  ← REJECT ✓
  "bab":  q_ok →(b)→ q_ok →(a)→ q_a →(b)→ q_ok  ← ACCEPT ✓
  "abb":  q_ok →(a)→ q_a →(b)→ q_ok →(b)→ q_ok  ← ACCEPT ✓
  Wait: "abb" = "a" then "b" then "b". Each 'a' is immediately followed by 'b'. ✓

──────────────────────────────────────────────────────

Q2: DFA for binary strings divisible by 3

Key insight: If a binary string read left-to-right represents number n, then after reading digit d, the new number is 2n + d. So: new_remainder = (2 × old_remainder + d) mod 3.

States: q₀, q₁, q₂ representing remainders 0, 1, 2 mod 3.
Start: q₀ (empty string = 0, divisible by 3).
Accept: F = {q₀} (remainder 0 = divisible by 3).

Transitions:
  δ(q₀, 0) = q_(2×0+0 mod 3) = q_0
  δ(q₀, 1) = q_(2×0+1 mod 3) = q_1
  δ(q₁, 0) = q_(2×1+0 mod 3) = q_2
  δ(q₁, 1) = q_(2×1+1 mod 3) = q_0
  δ(q₂, 0) = q_(2×2+0 mod 3) = q_1
  δ(q₂, 1) = q_(2×2+1 mod 3) = q_2

Transition table:
       0     1
  q₀:  q₀   q₁   ← start, accept
  q₁:  q₂   q₀
  q₂:  q₁   q₂

3 states are needed: one per residue class mod 3.

──────────────────────────────────────────────────────

Q3: Trace "1101" (binary = 13)

Start: q₀
  Read '1': δ(q₀, 1) = q₁  (1 mod 3 = 1)
  Read '1': δ(q₁, 1) = q₀  (3 mod 3 = 0)
  Read '0': δ(q₀, 0) = q₀  (6 mod 3 = 0)
  Read '1': δ(q₀, 1) = q₁  (13 mod 3 = 1)
Final state: q₁.
q₁ ∉ F → REJECT. ✓ (13 mod 3 = 1 ≠ 0, correct)

──────────────────────────────────────────────────────

Q4: Same number of a's as b's — is it regular?

DISPROVE: This language is NOT regular.

Proof sketch using pumping lemma (Ch04 covers this formally):
Suppose it were regular with pumping length p.
Consider the string w = aᵖbᵖ (p a's followed by p b's). |w| = 2p ≥ p.

By the pumping lemma, w = xyz where |xy| ≤ p, |y| ≥ 1, and xyⁱz ∈ L for all i ≥ 0.

Since |xy| ≤ p, x and y consist entirely of a's (the first p characters are all a's).
y = aᵏ for some k ≥ 1.

Now: xy²z = aᵖ⁺ᵏbᵖ → has p+k a's and p b's (p+k ≠ p since k ≥ 1).
This string has more a's than b's → NOT in L.

Contradiction with pumping lemma (which says xy²z ∈ L). Therefore L is not regular.

INTUITION: To accept equal counts of a and b, you'd need to count how many a's you've seen (to match them with b's later). A DFA can only have a fixed number of states — it can't count to an arbitrary number. Hence no DFA can recognize this language.

──────────────────────────────────────────────────────

Q5: Product construction — divisible by 3 AND ends in '1'

M₁: DFA for "divisible by 3" (Q₁ = {q₀,q₁,q₂}, F₁ = {q₀})
M₂: DFA for "ends in '1'" 
  M₂ states: {s₀ = start/no-'1', s₁ = last-char-was-'1'}
  δ₂(s₀, 0) = s₀, δ₂(s₀, 1) = s₁
  δ₂(s₁, 0) = s₀, δ₂(s₁, 1) = s₁
  F₂ = {s₁}

Product DFA:
  Q = {(q₀,s₀), (q₀,s₁), (q₁,s₀), (q₁,s₁), (q₂,s₀), (q₂,s₁)}  [6 states]
  q₀_product = (q₀, s₀)
  F_product = F₁ × F₂ = {(q₀, s₁)}  [divisible by 3 AND ends in 1]

Transitions (combining δ₁ and δ₂):
State        | '0'           | '1'
(q₀, s₀)    | (q₀, s₀)     | (q₁, s₁)   ← start
(q₀, s₁)    | (q₀, s₀)     | (q₁, s₁)
(q₁, s₀)    | (q₂, s₀)     | (q₀, s₁)   ← (q₀,s₁) ACCEPT!
(q₁, s₁)    | (q₂, s₀)     | (q₀, s₁)
(q₂, s₀)    | (q₁, s₀)     | (q₂, s₁)
(q₂, s₁)    | (q₁, s₀)     | (q₂, s₁)

F_product = {(q₀, s₁)}.

Verification:
  "11" (binary 3) = divisible by 3, ends in 1:
  (q₀,s₀) →(1)→ (q₁,s₁) →(1)→ (q₀,s₁) ← ACCEPT ✓ (3 mod 3 = 0, ends in '1')
  
  "110" (binary 6) = divisible by 3, ends in 0:
  (q₀,s₀) →(1)→ (q₁,s₁) →(1)→ (q₀,s₁) →(0)→ (q₀,s₀) ← REJECT ✓ (ends in '0')
```

</details>

---

## Common Misconceptions

**"DFA must read all input before deciding"**
Conceptually yes — the machine reads the entire input and then accepts or rejects based on the final state. In practice, once a DFA reaches a "dead" (non-accepting, no path to accepting) state, a lexer implementation short-circuits. But the FORMAL definition always reads the whole string.

**"More states = more power"**
Wrong. A DFA with 1000 states is no more powerful than one with 3 states (in terms of the CLASSES of languages recognized). Both recognize only regular languages. Power comes from the TYPE of machine (DFA, PDA, TM), not the number of states.

**"The transition function δ must use every symbol from Σ"**
Yes — δ is a TOTAL function: for every state and every input symbol, exactly one next state must be defined. A DFA has no "undefined" transitions. If you don't specify one, it's implicitly a dead state (goes to a non-accepting sink and stays there).

---

## Connections

- **Chapter 02 — NFA:** The NFA relaxes determinism (δ maps to sets of states, not a single state, and allows ε-transitions). Remarkably, NFAs and DFAs recognize EXACTLY the same class of languages — the subset construction converts any NFA to a DFA.
- **Chapter 03 — Regular Expressions:** Regex ↔ DFA ↔ NFA form a triangle of equivalent formalisms. Kleene's theorem proves they're all equivalent.
- **Chapter 04 — Pumping Lemma:** Gives a necessary condition for regularity — used to PROVE languages are NOT regular (like the equal a's and b's example in Q4).

---

> [Course Index](README.md) | [Next → 02 NFA and ε-Closure](02_NFA_Epsilon_Closure.md)
