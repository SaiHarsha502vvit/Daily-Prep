# Chapter 02 — NFA and ε-Closure: Nondeterminism

> [← 01 DFA: Finite Automata](01_DFA_Finite_Automata.md) | [Course Index](README.md) | [Next → 03 Regular Expressions](03_Regular_Expressions.md)

---

## The Problem: Designing DFAs Is Hard

Build a DFA for "strings that contain 'ab' or end in 'ba'."

To do this with a DFA, you must simultaneously track:
- Whether you've seen "ab" yet (done = stay in accept)
- The current suffix (need to know if you're building "ba")
- These combine into a complex product state machine

With 4-5 states just for "ab" recognition, plus 3 for "ba" suffix, the product gives up to 15 states. That's hard to design correctly.

**Nondeterministic Finite Automata (NFA)** allow two simplifications:
1. From a state, a symbol can transition to MULTIPLE next states (or none)
2. ε-transitions: move to a new state without consuming any input

With nondeterminism, you can "guess" the right path. The machine accepts if ANY sequence of nondeterministic choices leads to an accept state.

**The surprising theorem:** NFAs and DFAs recognize EXACTLY the same class of languages (regular languages). Every NFA can be converted to an equivalent DFA. Nondeterminism adds elegance, not power.

---

## Formal Definition of an NFA

An NFA is a 5-tuple N = (Q, Σ, δ, q₀, F) where:

- **Q, Σ, q₀, F:** Same as DFA
- **δ: Q × (Σ ∪ {ε}) → P(Q):** Transition function maps to a POWER SET (set of states).
  - δ(q, σ) is a SET of states (possibly empty ∅ or a singleton or multiple states)
  - δ(q, ε) allows transitions without consuming input (epsilon transitions)

**Acceptance:** NFA accepts w if there EXISTS at least one path through the machine that ends in an accepting state. (Many paths may be explored simultaneously — think of it as parallel execution.)

---

## ε-Closure

**ε-closure(q):** The set of all states reachable from q by following zero or more ε-transitions.

```
ε-closure(q) = { p | p is reachable from q using only ε-transitions }

Example NFA:
  States: {A, B, C, D}
  ε-transitions: A →ε→ B, B →ε→ C, A →ε→ D

  ε-closure(A) = {A, B, C, D}   (A can reach B via ε, then C via ε, also D via ε)
  ε-closure(B) = {B, C}          (B can reach C via ε)
  ε-closure(C) = {C}             (C has no ε-transitions)
```

**Computing ε-closure:** BFS/DFS following only ε-edges from the starting state(s).

---

## NFA Extended Transition Function

```
Extend δ to handle strings (with ε-closure):

δ*(S, ε) = ε-closure(S)         (for a SET of starting states S)
δ*(S, wa) = ε-closure( ⋃_{q ∈ δ*(S,w)} δ(q, a) )

Acceptance:
  N accepts w iff δ*(ε-closure({q₀}), w) ∩ F ≠ ∅
  (i.e., at least one state reached is accepting)
```

---

## Example: NFA for Strings Containing "ab" or Ending in "ba"

**Design strategy with NFA:** Build two separate machines and connect them with ε-transitions from the start state.

**Sub-NFA 1 (contains "ab"):**
- p₀ →a→ p₁ →b→ p₂ (accept)
- p₀ →{a,b}→ p₀ (loop — wait for start of "ab")
- p₂ →{a,b}→ p₂ (absorb remaining input once "ab" found)

**Sub-NFA 2 (ends in "ba"):**
- r₀ →{a,b}→ r₀ (loop — wait for potential "ba")
- r₀ →b→ r₁ →a→ r₂ (accept)
- r₂ has NO outgoing transitions (must be the LAST two chars — if we see more input, path dies)

Wait — to accept "ends in ba", if we see more input after seeing 'ba', we need to restart. Let's structure it differently:

**Sub-NFA 2 (ends in "ba") simplified:**
- r₀: start
- δ(r₀, a) = {r₀}, δ(r₀, b) = {r₀, r₁}  [nondeterminism: guess that THIS 'b' starts "ba"]
- δ(r₁, a) = {r₂}, δ(r₁, b) = {}
- r₂: accept (just saw "ba")

The ε-NFA connecting them:
- New start s₀, with ε-transitions to p₀ and r₀
- Accept states: {p₂, r₂}

```
s₀ →ε→ p₀ (sub-NFA 1 for "contains ab")
s₀ →ε→ r₀ (sub-NFA 2 for "ends in ba")
```

**This uses the UNION CONSTRUCTION.** The NFA simultaneously pursues both patterns — whichever succeeds leads to acceptance.

---

## The Subset Construction: NFA → DFA

**Key theorem:** For every NFA N, there exists a DFA M such that L(M) = L(N).

**Proof (constructive): The subset construction.**

The DFA's states are SETS of NFA states — representing all states the NFA might be in simultaneously.

```
Given NFA N = (Q_N, Σ, δ_N, q₀, F_N), build DFA M = (Q_M, Σ, δ_M, q₀_M, F_M):

q₀_M = ε-closure({q₀})           [start = ε-closure of NFA start]
Q_M  = subsets of Q_N (start with q₀_M, explore reachable subsets)
δ_M(S, σ) = ε-closure( ⋃_{q ∈ S} δ_N(q, σ) )  [move all states, then take ε-closure]
F_M  = { S ∈ Q_M | S ∩ F_N ≠ ∅ }  [accept if any NFA state in the subset is accepting]
```

**Worked construction: NFA for strings ending in "01"**

```
NFA states: {q₀, q₁, q₂}
q₀: start. q₂: accept.
δ_N(q₀, 0) = {q₀, q₁}    (stay in q₀ OR start building "01")
δ_N(q₀, 1) = {q₀}          (might be waiting for "0")
δ_N(q₁, 0) = {}             (we guessed "0" was start of "01" but saw another "0" — dead)
δ_N(q₁, 1) = {q₂}           (completed "01"!)
δ_N(q₂, 0) = {}             (if we want strict "ends in 01", dead after accepting)
δ_N(q₂, 1) = {}
No ε-transitions. ε-closure(q) = {q} for all q.
```

**Subset construction:**

Start: {q₀}

```
DFA state {q₀}:
  On '0': ε-closure(δ_N(q₀, 0)) = ε-closure({q₀, q₁}) = {q₀, q₁}
  On '1': ε-closure(δ_N(q₀, 1)) = ε-closure({q₀}) = {q₀}

DFA state {q₀, q₁}:
  On '0': ε-closure(δ_N(q₀,0) ∪ δ_N(q₁,0)) = ε-closure({q₀,q₁} ∪ {}) = {q₀, q₁}
  On '1': ε-closure(δ_N(q₀,1) ∪ δ_N(q₁,1)) = ε-closure({q₀} ∪ {q₂}) = {q₀, q₂}

DFA state {q₀, q₂}:
  On '0': ε-closure(δ_N(q₀,0) ∪ δ_N(q₂,0)) = ε-closure({q₀,q₁} ∪ {}) = {q₀, q₁}
  On '1': ε-closure(δ_N(q₀,1) ∪ δ_N(q₂,1)) = ε-closure({q₀} ∪ {}) = {q₀}
```

**DFA transition table:**
```
State        | '0'         | '1'
{q₀}         | {q₀,q₁}    | {q₀}        ← start
{q₀,q₁}     | {q₀,q₁}    | {q₀,q₂}
{q₀,q₂}     | {q₀,q₁}    | {q₀}        ← ACCEPT (contains q₂)
```

**Accepting states:** F_M = {{q₀,q₂}} (the only DFA state containing q₂).

**Verify on "101":**
```
{q₀} →(1)→ {q₀} →(0)→ {q₀,q₁} →(1)→ {q₀,q₂}  ← ACCEPT ✓ ("101" ends in "01")
```

**Verify on "100":**
```
{q₀} →(1)→ {q₀} →(0)→ {q₀,q₁} →(0)→ {q₀,q₁}  ← REJECT ✓ ("100" ends in "00")
```

---

## State Explosion: Worst Case for Subset Construction

**Q: How many DFA states can a subset construction produce for an NFA with n states?**

At most 2ⁿ subsets (the power set). For n=10: up to 1024 DFA states from 10 NFA states.

**Is this ever actually hit?** YES. The classic example:

NFA for "nth character from the right is '1'" (for alphabet {0,1}):
- Any DFA for this requires exactly 2ⁿ states.
- The NFA has only n+1 states.

This shows that while DFAs and NFAs accept the same languages, NFAs can be **exponentially more concise** to describe certain patterns. Nondeterminism is a representation advantage even though it's not a computational power advantage.

---

## ε-NFA to DFA: Using ε-Closure

When the NFA has ε-transitions, the subset construction uses ε-closure in two places:
1. Start state of DFA = ε-closure({q₀_NFA})
2. DFA transition: δ_M(S, σ) = ε-closure(⋃_{q∈S} δ_N(q, σ))

This captures the effect of all ε-transitions that can be followed for free.

---

## Section Challenge

> ### NFA Construction and Subset Construction
>
> **Q1:** Design an NFA over Σ = {a, b} that accepts strings containing either "aa" or "bb" as substrings. How many states does your NFA need? What would the equivalent DFA look like?
>
> **Q2:** Consider NFA N with states {q₀, q₁, q₂}, Σ={0,1}, start q₀, F={q₂}, and:
> δ(q₀, 0) = {q₀, q₁}, δ(q₀, 1) = {q₀}, δ(q₁, 1) = {q₂}, δ(q₁, 0) = {}.
> Apply the subset construction to build the equivalent DFA. List all reachable DFA states and their transitions.
>
> **Q3:** An NFA has n = 3 states and no ε-transitions. What is the maximum number of states in the equivalent DFA (worst case)? In the Q2 NFA specifically, how many DFA states did you actually need?
>
> **Q4:** Prove (informally but rigorously) that the DFA produced by the subset construction accepts exactly the same strings as the original NFA. (Hint: prove by induction on |w| that the DFA state after reading w equals the set of NFA states after reading w.)
>
> **Q5 (Stretch):** Design an ε-NFA for the language {aⁿ | n is divisible by 2 or divisible by 3}. Use ε-transitions to combine a 2-cycle and a 3-cycle. Then apply ε-closure to identify the start state's ε-closure and trace "aaaaaa" (6 a's) through the ε-NFA. (Verify: 6 is divisible by both 2 and 3.)

<details>
<summary>Full answers</summary>

```
Q1: NFA for strings containing "aa" or "bb"

States:
  q₀: start (no progress toward either pattern)
  q_a: last char was 'a' (might complete "aa")
  q_b: last char was 'b' (might complete "bb")
  q_aa: just saw "aa" — ACCEPT (seen "aa", stay accepted for rest of string)
  q_bb: just saw "bb" — ACCEPT (seen "bb")

Alternative (using nondeterminism to "guess"):
  q₀: start — loop on a and b
  From q₀, nondeterministically guess we're about to see "aa" or "bb"

Cleaner NFA (5 states):
  q₀ →{a,b}→ q₀   (loop: haven't committed to starting the pattern)
  q₀ →a→ q_a        (commit: this 'a' might start "aa")
  q₀ →b→ q_b        (commit: this 'b' might start "bb")
  q_a →a→ q_aa      (completed "aa"!)
  q_b →b→ q_bb      (completed "bb"!)
  q_aa →{a,b}→ q_aa (absorb remaining input)
  q_bb →{a,b}→ q_bb (absorb remaining input)

F = {q_aa, q_bb}

The NFA uses 5 states. The equivalent DFA would use subset construction
and might need up to 2⁵ = 32 states, but in practice far fewer reachable subsets.

──────────────────────────────────────────────────────

Q2: Subset construction for given NFA

NFA: {q₀,q₁,q₂}, Σ={0,1}, start q₀, F={q₂}.
δ(q₀,0)={q₀,q₁}, δ(q₀,1)={q₀}, δ(q₁,1)={q₂}, δ(q₁,0)={}, all others empty.
No ε-transitions: ε-closure(q) = {q}.

Start DFA state: {q₀}.

{q₀}:
  '0': ε-closure(δ(q₀,0)) = {q₀,q₁}
  '1': ε-closure(δ(q₀,1)) = {q₀}

{q₀,q₁}:
  '0': ε-closure(δ(q₀,0) ∪ δ(q₁,0)) = ε-closure({q₀,q₁} ∪ {}) = {q₀,q₁}
  '1': ε-closure(δ(q₀,1) ∪ δ(q₁,1)) = ε-closure({q₀} ∪ {q₂}) = {q₀,q₂}

{q₀,q₂}:
  '0': ε-closure(δ(q₀,0) ∪ δ(q₂,0)) = ε-closure({q₀,q₁} ∪ {}) = {q₀,q₁}
  '1': ε-closure(δ(q₀,1) ∪ δ(q₂,1)) = ε-closure({q₀} ∪ {}) = {q₀}

No new states. Reachable: {q₀}, {q₀,q₁}, {q₀,q₂}.

DFA transition table:
State       | '0'       | '1'
{q₀}        | {q₀,q₁}  | {q₀}        ← start
{q₀,q₁}    | {q₀,q₁}  | {q₀,q₂}
{q₀,q₂}    | {q₀,q₁}  | {q₀}        ← ACCEPT

F_DFA = {{q₀,q₂}} (contains NFA accept state q₂).

Language: strings where every '0' that starts a "01" suffix eventually has a '1' — 
equivalently: strings where some prefix of a suffix reads "01" → strings ENDING in "01".

──────────────────────────────────────────────────────

Q3: Maximum DFA states

Maximum: 2³ = 8 states (for 3-state NFA, worst case).

In Q2 specifically: only 3 reachable DFA states out of 8 possible.
Unreachable subsets: ∅, {q₁}, {q₂}, {q₁,q₂}, {q₀,q₁,q₂} — none of these are
generated by the subset construction starting from {q₀}. 

This is typical: the subset construction ONLY generates REACHABLE subsets,
which in practice is far fewer than 2ⁿ.

──────────────────────────────────────────────────────

Q4: Correctness of subset construction (informal proof)

Claim: DFA state after reading w = set of NFA states reachable after reading w.

Let S_w = set of NFA states N is in after reading w (considering all nondeterministic paths).
Let d_w = DFA state after reading w.

Proof by induction on |w|:

Base case |w| = 0 (empty string):
  DFA starts in q₀_DFA = ε-closure({q₀_NFA}).
  NFA starts in ε-closure({q₀_NFA}) (any ε-transitions from q₀ can be followed).
  S_ε = d_ε = ε-closure({q₀_NFA}). ✓

Inductive step: Assume S_w = d_w. We show S_{wa} = d_{wa}.
  S_{wa} = ε-closure(⋃_{q ∈ S_w} δ_N(q, a))  [NFA definition]
  d_{wa} = δ_M(d_w, a) = ε-closure(⋃_{q ∈ d_w} δ_N(q, a))  [DFA construction]
  Since d_w = S_w (induction hypothesis): S_{wa} = d_{wa}. ✓

Acceptance: NFA accepts w iff S_w ∩ F_N ≠ ∅ iff d_w ∈ F_M. ✓

Therefore L(DFA) = L(NFA). □

──────────────────────────────────────────────────────

Q5: ε-NFA for aⁿ where 2|n or 3|n

Build a 2-cycle and a 3-cycle, connected via ε-transitions from a new start state.

2-cycle (states: {s₀, s₁}):
  s₀ →a→ s₁ →a→ s₀   (accept every 2nd input)
  F includes s₀ (accepting even count of a's)

3-cycle (states: {t₀, t₁, t₂}):
  t₀ →a→ t₁ →a→ t₂ →a→ t₀  (accept every 3rd input)
  F includes t₀

New start: u₀
  u₀ →ε→ s₀  (try 2-cycle)
  u₀ →ε→ t₀  (try 3-cycle)

ε-closure(u₀) = {u₀, s₀, t₀}.

Trace "aaaaaa" (6 a's):
The NFA simultaneously tracks both cycles.

2-cycle trace:
  s₀ →a→ s₁ →a→ s₀ →a→ s₁ →a→ s₀ →a→ s₁ →a→ s₀  ← ACCEPT (s₀ is accept, 6/2=3 even)

3-cycle trace:
  t₀ →a→ t₁ →a→ t₂ →a→ t₀ →a→ t₁ →a→ t₂ →a→ t₀  ← ACCEPT (t₀ is accept, 6/3=2 even)

Final NFA states after "aaaaaa": {s₀, t₀} (both in accepting states).
Since {s₀, t₀} ∩ F ≠ ∅ → ACCEPT. ✓ (6 is divisible by 2 AND 3)

For "aaaa" (4 a's):
  2-cycle: s₀ (accept) ✓. 3-cycle: t₁ (not accept) ✗.
  NFA states = {s₀, t₁}. s₀ ∈ F → ACCEPT. ✓ (4 divisible by 2, even though not by 3)

For "aaa" (3 a's):
  2-cycle: s₁ (not accept). 3-cycle: t₀ (accept).
  NFA states = {s₁, t₀}. t₀ ∈ F → ACCEPT. ✓ (3 divisible by 3)

For "aaaaa" (5 a's):
  2-cycle: s₁ (not accept). 3-cycle: t₂ (not accept).
  NFA states = {s₁, t₂}. Neither in F → REJECT. ✓ (5 is prime, not divisible by 2 or 3)
```

</details>

---

## Common Misconceptions

**"NFAs try all paths simultaneously, so they're faster"**
Nondeterminism is a mathematical concept, not a physical parallelism. Real computers that "simulate" an NFA either track all active states simultaneously (as a set, like the subset construction) or backtrack — either way, the computation is deterministic. NFAs don't magically run in parallel on real hardware.

**"ε-transitions consume input"**
ε-transitions are completely free — they happen instantaneously without reading any input symbol. They're used to chain sub-automata together (like the union construction: a new start state connects to multiple sub-NFAs via ε).

**"The subset construction always produces 2ⁿ states"**
The subset construction POTENTIALLY generates up to 2ⁿ states, but only REACHABLE subsets are included. For most real NFAs, very few subsets are reachable. The 2ⁿ worst case is achieved by specific adversarial examples (the "nth from right" family), not typical patterns.

---

## Connections

- **Chapter 01 — DFA:** The NFA generalizes the DFA. The subset construction goes the other direction (NFA → DFA). Both recognize regular languages — the equivalence is proven by the construction.
- **Chapter 03 — Regular Expressions:** RegEx ↔ NFA is the key equivalence. Converting a RegEx to an NFA (Thompson's construction) uses ε-transitions heavily — union, concatenation, and Kleene star all use ε to chain sub-automata.
- **Chapter 04 — Pumping Lemma:** The pumping lemma exploits the finite number of DFA states (equivalently, NFA states in the subset DFA) to prove certain languages aren't regular.

---

> [← 01 DFA: Finite Automata](01_DFA_Finite_Automata.md) | [Course Index](README.md) | [Next → 03 Regular Expressions](03_Regular_Expressions.md)
