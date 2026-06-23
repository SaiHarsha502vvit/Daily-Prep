# Chapter 6 — Pushdown Automata

> "A DFA is a reader. A PDA is a reader with a notepad. The notepad is a stack — and that one upgrade jumps you from arithmetic to programming languages."

---

## The Missing Piece

In Chapter 5, we saw that balanced parentheses require a CFG. But grammars are *generative* — they describe what strings look like, not how to *recognize* them mechanically.

For DFAs, the equivalence is clear: grammar ↔ machine. Regular grammars generate exactly what DFAs accept.

For CFLs, the equivalent machine is the **Pushdown Automaton (PDA)**: a finite automaton augmented with a stack. The stack provides the unbounded memory needed to match nested structures.

**The fundamental theorem of this chapter:**
> A language is context-free if and only if some PDA accepts it.

This gives us a machine model for parsing — which is how compilers actually work.

---

## 6.1 PDA Formal Definition

A **Pushdown Automaton** is a 6-tuple `P = (Q, Σ, Γ, δ, q₀, F)` where:

- **Q** = finite set of states
- **Σ** = input alphabet
- **Γ** = stack alphabet (can differ from Σ)
- **δ: Q × Σ_ε × Γ_ε → P(Q × Γ_ε)** = transition function
  - `Σ_ε = Σ ∪ {ε}` — can read input or take ε-transition
  - `Γ_ε = Γ ∪ {ε}` — can pop stack symbol or pop nothing (ε)
  - Returns a set of (new state, push symbol) pairs — PDAs are nondeterministic by default
- **q₀ ∈ Q** = start state
- **F ⊆ Q** = accepting states

### Stack Operation Interpretation

A transition `(q, a, A) → (r, B)` means:
- In state q
- Reading input symbol a (or ε)
- With A on top of stack (or ε = don't check/pop)
- → move to state r
- → push B onto stack (or ε = don't push)

If you want to pop A and push B: `(q, a, A) → (r, B)` — pops A, pushes B.
If you want to push B without popping: `(q, a, ε) → (r, B)`.
If you want to pop A and push nothing: `(q, a, A) → (r, ε)`.
If you want to replace A with BC (push two): push B first, then C — but stacks push one symbol at a time, so PDAs replace one with a *string* by convention: `(q, a, A) → (r, BC)` means pop A, push C then B (so B is on top).

**Acceptance:** A PDA accepts a string if there exists *some* computation path (nondeterminism!) that reaches an accepting state after reading all input.

### Bottom-of-Stack Marker

Practical PDAs use a special symbol `$` (or `⊥`, `Z₀`) pushed at the start to mark the stack bottom. This lets us detect when the stack is empty without special casing.

---

## 6.2 PDA for Balanced Parentheses

**Language:** `L = {w | w is balanced parentheses}`

**Strategy:** push `(` when you see it, pop when you see `)`. Accept when input exhausted and stack contains only the bottom marker.

**States:** `q₀` (reading), `q₁` (accept)

**Stack alphabet:** `Γ = {(, $}`

**Transitions:**

| State | Input | Stack Pop | New State | Stack Push |
|-------|-------|-----------|-----------|------------|
| q₀ | ε | ε | q₀ | $ (initialize) |
| q₀ | ( | ε | q₀ | ( |
| q₀ | ) | ( | q₀ | ε |
| q₀ | ε | $ | q₁ | ε |

Wait — the initialization step is cleaner if done at the very start. Let's restructure:

```
Initial: push $ at start (ε-transition from q_start to q₀)
q_start → (ε, ε, $ pushed) → q₀

In q₀:
  Read (: push (
  Read ): pop (
  See $ on top with no more input: → q_accept (ε-transition)
```

**Trace of `(())`:**

```
Step  State  Input     Stack (top→bottom)
0     q₀     (())     $
1     q₀     ())      ( $          read (, push (
2     q₀     ))       ( ( $        read (, push (
3     q₀     )        ( $          read ), pop (
4     q₀     ε        $            read ), pop (
5     q_acc  ε        $            ε-transition on $ → accept ✓
```

**Trace of `(()`** (unbalanced):

```
Step  State  Input  Stack
0     q₀     (()    $
1     q₀     ()     ( $
2     q₀     )      ( ( $
3     q₀     ε      ( $     read ), pop (
At ε: top of stack is ( (not $), so no ε-transition to q_accept → REJECT ✓
```

---

## 6.3 PDA for {aⁿbⁿ}

**Language:** `L = {aⁿbⁿ | n ≥ 0}`

**Strategy:** push `a` symbols while reading a's; pop one a for each b; accept when input exhausted and stack is empty (just $).

**States:** `q₀` (reading a's), `q₁` (reading b's), `q₂` (accept)

**Transitions:**

| From | Input | Pop | To | Push | Meaning |
|------|-------|-----|----|------|---------|
| q₀ | a | ε | q₀ | a | push a for each a read |
| q₀ | b | a | q₁ | ε | first b: switch to b-reading phase, pop one a |
| q₁ | b | a | q₁ | ε | continue popping a's |
| q₁ | ε | $ | q₂ | ε | stack empty (just $): accept |
| q₀ | ε | $ | q₂ | ε | handle n=0 case (empty string) |

**Trace of `aaabbb`:**

```
State  Input   Stack
q₀     aaabbb  $
q₀     aabbb   a$         push a
q₀     abbb    aa$        push a
q₀     bbb     aaa$       push a
q₁     bb      aa$        read b, pop a (transition q₀→q₁)
q₁     b       a$         read b, pop a
q₁     ε       $          read b, pop a
q₂     ε       $          ε on $: accept ✓
```

**Why phase separation matters:** once we see the first `b`, we enforce a strict b-reading phase. If any `a` appeared after a `b`, there's no transition in q₁ for reading `a` → automatic rejection.

---

## 6.4 Equivalence of CFGs and PDAs

**Theorem:** A language L is context-free iff some PDA accepts L.

**Two directions:**

### Direction 1: CFG → PDA (Constructive)

Given CFG G, build a PDA P such that L(G) = L(P).

**Key idea:** simulate a leftmost derivation. The stack holds the "current sentential form" — the string of terminals and variables not yet expanded.

**Construction:**

1. Start: push `$S` onto stack (start variable on top).
2. **Variable on top:** nondeterministically choose a production `A → w` and replace A with w (pop A, push w reversed so first symbol is on top).
3. **Terminal on top:** if it matches the current input symbol, pop it and advance input. If it doesn't match, this computation path dies.
4. **Only $ on stack:** accept.

This PDA is nondeterministic — it guesses which production to apply, then verifies by matching terminals against input.

**Formal transitions for step 2 (simplified):**

For each rule `A → w` in G:
```
(q_loop, ε, A) → (q_loop, w_reversed)
```

For each terminal a ∈ Σ:
```
(q_loop, a, a) → (q_loop, ε)   ← match and consume
```

**Example:** Grammar `S → aSb | ε`, input `aabb`:

```
Stack (top→bottom): S$
Nondeterministic choice: S → aSb
Stack: aSb$ becomes bSa$ reversed → push: a on top, then S, then b
Wait — reversed: S → aSb, reversed = b·S·a, push b first, then S, then a
Stack becomes: a S b $

Read a, match: stack → S b $
Choice: S → aSb
Stack → a S b b $
Read a, match: stack → S b b $
Choice: S → ε (pop S)
Stack → b b $
Read b, match: stack → b $
Read b, match: stack → $
Accept ✓
```

### Direction 2: PDA → CFG (Constructive)

Given PDA P, construct CFG G with L(G) = L(P).

The key insight: every time the PDA's stack goes from some level back to that same level, something was computed. We create variables `A_{pq}` meaning "strings that take P from state p with empty stack to state q with empty stack."

**Variable naming:** `A_{pq}` for each pair of states (p, q). Intuitively, `A_{pq}` derives all strings w such that reading w from state p (stack empty) leads to state q (stack empty).

**Production rules:**
1. `A_{pp} → ε` for all states p.
2. `A_{pq} → A_{pr} A_{rq}` for all triples (p, r, q) — the stack empties at some intermediate state r.
3. For each transition `(p, a, ε) → (r, A)` (push A) and transition `(s, b, A) → (t, ε)` (pop A), add:
   `A_{pt} → a A_{rs} b`

This is complex — the key takeaway is that the construction exists and is computable, proving PDA ⊆ CFL. Together with CFG → PDA, we get CFG = PDA.

---

## 6.5 Deterministic PDAs (DPDAs)

The PDAs above are **nondeterministic** — they guess productions. This is fine theoretically (acceptance = existence of a path), but impractical for real parsers.

A **Deterministic PDA (DPDA)** has at most one applicable transition for any (state, input, stack-top) triple, and never has both a read-input transition and an ε-transition available simultaneously.

**Key fact:** DPDAs ⊊ PDAs. The nondeterministic PDA is strictly more powerful.

**Example:** `L = {ww_R | w ∈ {a,b}*}` (palindromes with even length) can be recognized by a nondeterministic PDA (guess the midpoint) but NOT by any DPDA (you'd need to know the midpoint to switch from push phase to pop phase, but you can't tell deterministically when you're at the midpoint).

**DPDA languages = Deterministic CFLs (DCFLs):**
- All regular languages are DCFLs.
- `{aⁿbⁿ}` is a DCFL (we built a deterministic PDA in §6.3).
- `{ww_R}` is a CFL but not a DCFL.
- DCFLs are closed under complement (flip accept/reject states — works deterministically).

**Practical significance:**

| Language class | Machine | Parsing | Examples |
|---------------|---------|---------|---------|
| Regular | DFA | O(n) | tokens, identifiers |
| DCFL | DPDA | O(n) | LL(k), LR(k) grammars |
| CFL (full) | nPDA | O(n³) | natural language, ambiguous grammars |

Real compilers target DCFL (LR(1) or LL(1)) because O(n) parsing is practical. CYK's O(n³) is used for natural language processing (NLP) where ambiguity is unavoidable.

---

## 6.6 Acceptance by Empty Stack vs Final State

There are two equivalent acceptance conditions for PDAs:

**Acceptance by final state:** input exhausted and current state ∈ F.

**Acceptance by empty stack:** input exhausted and stack is empty.

**Equivalence:** Any PDA accepting by final state can be converted to one accepting by empty stack, and vice versa.

**Conversion (Final State → Empty Stack):**
1. Add new start state q_s: push $ then go to original start state.
2. From every accepting state, add ε-transitions to a new "clean" state q_e.
3. From q_e, add transitions to pop every stack symbol.
4. Accept when stack empty (no final states needed).

This is useful in theoretical proofs — choose whichever acceptance condition is convenient for the proof at hand.

---

## 6.7 The Intersection Property: CFL ∩ Regular = CFL

**Theorem:** If L is a CFL and R is a regular language, then L ∩ R is a CFL.

**Proof sketch:** Run a PDA P for L and a DFA D for R simultaneously on the same input.

The **product construction:**
- States: pairs (q_P, q_D) where q_P is PDA state and q_D is DFA state
- Stack: same as PDA's stack
- Transitions: take a PDA transition and the corresponding DFA transition simultaneously
- Accept: both reach their accepting states simultaneously

This is a PDA (it has a stack from P), so L ∩ R is context-free. ✓

**Why this doesn't work for CFL ∩ CFL:** Two PDAs each have their own stack. Running them in parallel would require two stacks — that's a 2-stack PDA, which is equivalent to a Turing machine (computationally complete). So the intersection of two CFLs might not be context-free (as shown in §5.6).

**Application:** If you want to accept strings that are both valid JSON and match a certain pattern (like "JSON with keys in alphabetical order"), you can:
1. Model "alphabetical keys" as a regular language (actually you can't — it requires counting or ordering, so this is a bad example)
2. Model "JSON with no null values" where "no null" is a regex constraint: CFL ∩ Regular = CFL. ✓

---

## 6.8 Building Intuition: PDAs as Recursive Descent Parsers

Every recursive-descent parser is secretly a PDA with its call stack.

```python
def parse_expr():          # variable E on stack
    val = parse_term()     # push/pop for T
    while lookahead == '+':
        consume('+')
        val += parse_term()
    return val

def parse_term():          # variable T on stack
    val = parse_factor()   # push/pop for F
    while lookahead == '*':
        consume('*')
        val *= parse_factor()
    return val

def parse_factor():        # variable F on stack
    if lookahead == '(':
        consume('(')
        val = parse_expr()
        consume(')')
        return val
    else:
        return parse_number()
```

Each function call pushes a stack frame (which variable we're currently parsing). Each return pops it. The call stack IS the PDA's stack.

The implicit grammar is:
```
E → E + T | T
T → T * F | F
F → (E) | num
```

The left-recursion (`E → E + T`) is converted to iteration (`while lookahead == '+'`) because call stacks don't handle left recursion well — it would recurse infinitely. This transformation (left-recursion elimination) is a standard grammar conversion for top-down parsing.

---

## Section Challenge

---

**Q1.** Design a PDA (give states and transitions) that accepts `L = {aⁿb²ⁿ | n ≥ 0}` — strings with twice as many b's as a's.

<details>
<summary>Answer</summary>

**Strategy:** For each `a` read, push TWO markers onto the stack. For each `b` read, pop ONE marker. Accept when input done and stack = {$}.

Or alternatively: push one marker per `a`, but pop only on every *other* `b`.

Let's use the two-push strategy (cleaner):

**States:** q₀ (reading a's), q₁ (reading b's), q_acc

**Stack alphabet:** {A, $}

**Transitions:**

| From | Input | Pop | To | Push | Meaning |
|------|-------|-----|----|------|---------|
| q₀ | ε | ε | q₀ | $ | initialize (or start with $ already) |
| q₀ | a | ε | q₀ | AA | push 2 A's per a read |
| q₀ | b | A | q₁ | ε | first b: switch to b-phase, pop A |
| q₁ | b | A | q₁ | ε | each b pops one A |
| q₁ | ε | $ | q_acc | ε | stack empty → accept |
| q₀ | ε | $ | q_acc | ε | handle n=0 |

**Trace of `abbbb` (n=1, 4 b's... wait: a¹b² = abb, 1 a and 2 b's):**

Trace `abb`:
```
q₀, abb, $
q₀, bb, AA$     (read a, push AA)
q₁, b, A$       (read b, pop A)
q₁, ε, $        (read b, pop A)
q_acc           (ε on $: accept) ✓
```

Trace `aabbbb` (n=2):
```
q₀, aabbbb, $
q₀, abbbb, AA$
q₀, bbbb, AAAA$
q₁, bbb, AAA$
q₁, bb, AA$
q₁, b, A$
q₁, ε, $
q_acc ✓
```
</details>

---

**Q2.** Show that every regular language is a CFL by constructing a CFG from a DFA.

<details>
<summary>Answer</summary>

Given DFA D = (Q, Σ, δ, q₀, F), construct CFG G = (V, Σ, R, S) as follows:

- **Variables V = Q** (one variable per state)
- **Start variable S = q₀** (start state)
- **Productions:**
  - For each transition `δ(q, a) = r`: add rule `q → ar` (read a, move to r)
  - For each accepting state `q ∈ F`: add rule `q → ε` (can stop here)

**Why this works:** A derivation from q₀ corresponds exactly to a path through the DFA:
```
q₀ → a₁q₁ → a₁a₂q₂ → ... → a₁a₂...aₙqₙ → a₁a₂...aₙ
```
where qₙ ∈ F (accepting). This produces exactly the string a₁a₂...aₙ — the string read by the DFA's accepting path.

**Example:** DFA over {a,b} accepting strings ending in 'a':
- States: q₀ (not ending in a), q₁ (ending in a) = start q₀
- Transitions: δ(q₀,a)=q₁, δ(q₀,b)=q₀, δ(q₁,a)=q₁, δ(q₁,b)=q₀
- F = {q₁}

CFG:
```
q₀ → aq₁ | bq₀      (transitions from q₀)
q₁ → aq₁ | bq₀ | ε  (transitions from q₁, plus ε since q₁ is accepting)
```

`ba` derives: q₀ → bq₀ → baq₁ → ba ✓
`ab` derives: q₀ → aq₁ → abq₀ → ... wait, abq₀ needs q₀→ε but q₀∉F. Correct — ab is not accepted. ✓

This proves Regular ⊆ CFL.
</details>

---

**Q3.** A PDA has states {q₀, q₁, q_acc}, stack alphabet {A, $}, and transitions:
- (q₀, a, ε) → (q₀, A)  [push A on reading a]
- (q₀, b, A) → (q₁, ε)  [pop A on first b, switch state]
- (q₁, b, A) → (q₁, ε)  [pop A on subsequent b's]
- (q₁, ε, $) → (q_acc, ε)  [accept on empty stack]
- (q₀, ε, $) → (q_acc, ε)  [accept empty string]

What language does this PDA accept? Justify briefly.

<details>
<summary>Answer</summary>

**Language: `L = {aⁿbⁿ | n ≥ 0}`**

**Justification:**
- In q₀, every `a` pushes one `A` → after reading n a's, stack has n A's (plus $).
- Once the first `b` is read (q₀→q₁ transition), we're locked into b-reading phase (no a-transitions in q₁).
- Each `b` pops one `A`. After n b's, stack is just $.
- ε-transition on $ → q_acc fires. Accept.

**What enforces aⁿbⁿ exactly:**
- The transition `(q₀, b, A) → (q₁, ε)` is the only way to read a `b` — it requires A on top. So b's can only appear after at least one a (unless n=0, handled by the ε on $ in q₀).
- Once in q₁, no a-transitions exist → mixed strings like `abab` are rejected.
- Acceptance requires reaching $ on stack at end → exactly n pops = n b's.

**Rejected strings:** `ab` (n=1, one pop, accept ✓), `aabb` (n=2 ✓), `abb` (starts with one a = one A pushed, reads b→pops A into q₁, reads b→tries to pop A but stack is $ → no transition → reject ✓).
</details>

---

**Q4.** Why can't we build a PDA for `L = {aⁿbⁿcⁿ | n ≥ 0}` using a single stack?

<details>
<summary>Answer</summary>

**Informal argument:** A single stack is a LIFO structure. To verify aⁿbⁿcⁿ, you need to simultaneously confirm that:
1. The number of a's equals the number of b's.
2. The number of b's equals the number of c's.

**What a PDA can do:** Push A's while reading a's. Pop A's while reading b's → verifies a-count = b-count. But at that point the stack is empty (just $). We have no memory of how many b's we read to compare with c's.

**The fundamental mismatch:** A stack forgets information as it pops. After verifying a's vs b's by draining the stack, we've lost the count needed to verify b's vs c's. We'd need a second stack to store the count of b's — a 2-stack PDA.

**Formal proof:** We'll prove in Chapter 7 (CFL Pumping Lemma) that {aⁿbⁿcⁿ} ∉ CFL. Since all PDAs recognize exactly CFLs, no PDA (single-stack) can accept this language.

**But a 2-stack PDA can:**
- Stack 1: push a per a, pop per b (verify a=b)
- Stack 2: push b per b, pop per c (verify b=c)
Both stacks empty at end → accept. Two stacks = Turing machine power.
</details>

---

**Q5.** The language `L = {w ∈ {a,b}* | #a(w) = #b(w)}` (equal number of a's and b's, in any order) is a CFL. Give a CFG for it.

<details>
<summary>Answer</summary>

**Grammar:**
```
S → aSbS | bSaS | ε
```

**Explanation of each rule:**
- `aSbS`: contributes one a and one b (balanced), with two balanced "gaps" on either side (S's)
- `bSaS`: contributes one b and one a (balanced), with two gaps
- `ε`: empty string (0 a's, 0 b's — balanced)

**Derivation of `abba`:**
```
S → aSbS
  → aεbS   (left S → ε)
  → abS    (simplify)
  → abbSaS (S → bSaS)
  → abbaS  (S → ε)
  → abba   (S → ε) ✓
```

**Why this works:** Any balanced string either starts with `a` or `b`. If it starts with `a`, there must be a matching `b` somewhere later. The rule `aSbS` places that a, then a balanced middle chunk S, then the matching b, then a balanced remainder S. The recursion covers all cases.

**Alternative grammar:**
```
S → SS | aSb | bSa | ε
```

(S → SS handles interleaving; the other rules handle matched pairs.) This grammar is also correct but ambiguous. The first grammar is also ambiguous for most strings, which is fine since the language itself is unambiguously defined — we just need any grammar that generates it.

**Verify it's NOT regular:** The set `{aⁿbⁿ | n ≥ 0} ⊆ L` and we proved {aⁿbⁿ} is not regular, so L is not regular. ✓
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| PDA = 6-tuple | (Q, Σ, Γ, δ, q₀, F); transitions read input, pop/push stack |
| Nondeterministic | accept = some path reaches F; nPDA strictly more powerful than DPDA |
| CFG → PDA | simulate leftmost derivation; stack holds current sentential form |
| PDA → CFG | construct variable A_{pq} for "p to q with empty stack"; complex but exists |
| DPDA | one-choice-at-a-time; LL(k) / LR(k) parsers are DPDAs |
| CFL ∩ Regular = CFL | run PDA + DFA in product; single stack handles it |
| CFL ∩ CFL ≠ always CFL | two stacks = Turing machine power; intersection can leave CFL |
| Recursive descent | call stack IS the PDA stack; function calls = non-terminal expansion |

**Where we go next:** Chapter 7 extends the Pumping Lemma to context-free languages — proving tools like `{aⁿbⁿcⁿ}` are not context-free, which draws the boundary between CFLs and the next tier.

---

*Previous: [05 — Context-Free Grammars](05_Context_Free_Grammars.md)*
*Next: [07 — Pumping Lemma for CFLs](07_Pumping_Lemma_CFLs.md)*
