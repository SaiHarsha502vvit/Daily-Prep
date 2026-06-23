# Chapter 8 — Turing Machines

> "A DFA is a cursor that reads. A PDA is a cursor with a stack. A Turing machine is a cursor that reads, writes, and moves anywhere. That one extra power — writing — is the difference between recognition and computation."

---

## The Wall We Hit

Context-free grammars and PDAs are powerful: they handle programming language syntax, balanced structures, and more. But consider these tasks:

1. **Check if a Turing machine halts on input "hello"** — used in program analysis tools
2. **Multiply two numbers in unary** — `aᵐ × aⁿ = a^(m·n)`
3. **Recognize `{aⁿbⁿcⁿ}`** — equal counts of three symbols
4. **Verify a mathematical proof** — check each step follows from the previous

None of these can be done with a PDA (tasks 1, 3 provably; tasks 2, 4 intuitively). We need a machine that can:
- Read and **write** to memory (not just pop and push)
- Move left AND right (not just scan left-to-right)
- Use unlimited memory without a LIFO constraint

**Alan Turing's insight (1936):** A machine with a read/write head on an infinite tape and a finite set of states captures the full power of effective computation. This is the Turing Machine.

---

## 8.1 Formal Definition

A **Turing Machine (TM)** is a 7-tuple `M = (Q, Σ, Γ, δ, q₀, q_accept, q_reject)` where:

- **Q** = finite set of states
- **Σ** = input alphabet (does NOT include the blank symbol ␣)
- **Γ** = tape alphabet, `Σ ⊆ Γ`, `␣ ∈ Γ` (Γ has at least the blanks and input symbols)
- **δ: Q × Γ → Q × Γ × {L, R}** = transition function
  - Reads current state + tape symbol
  - Writes a symbol (can be same or different), moves Left or Right, enters new state
- **q₀ ∈ Q** = start state
- **q_accept ∈ Q** = accept state (entering immediately accepts)
- **q_reject ∈ Q** = reject state (entering immediately rejects; q_reject ≠ q_accept)

**Configuration:** a triple `(q, tape_content, head_position)`. Usually written as the tape content with the state marker showing head position: `uqv` means we're in state q, head is at first symbol of v, and u is to the left.

**Computation:** starts in configuration `q₀w` (input w on tape, rest blank, head at start). At each step, apply δ. Halt when reaching q_accept or q_reject. (Or run forever — this is possible!)

---

## 8.2 First Turing Machine: Recognize {aⁿbⁿcⁿ}

This language is provably not context-free (Chapter 7). Let's build a TM for it.

**Strategy:** Cross-check counts by repeated sweeps.

1. Scan left to right. If the tape matches `a*b*c*`:
   - Mark one `a` as `X` (visited)
   - Find and mark one `b` as `Y`
   - Find and mark one `c` as `Z`
   - Go back to start
2. Repeat until all a's are marked
3. Verify: no unmarked b's or c's remain
4. Accept

**States:** q₁ (scanning for a), q₂ (found a, scanning for b), q₃ (found b, scanning for c), q₄ (scanning back to start), q₅ (final check)

**Tape alphabet:** {a, b, c, X, Y, Z, ␣}

**Key transitions:**

```
(q₁, a) → (q₂, X, R)     mark a as X, go right to find b
(q₁, Y) → (q₅, Y, R)     all a's done, go to final check
(q₁, ␣) → (q_reject)     unexpected blank (shouldn't happen if input valid format)

(q₂, a) → (q₂, a, R)     skip unmarked a's
(q₂, Y) → (q₂, Y, R)     skip marked b's
(q₂, b) → (q₃, Y, R)     mark b as Y, go right to find c

(q₃, b) → (q₃, b, R)     skip unmarked b's
(q₃, Z) → (q₃, Z, R)     skip marked c's
(q₃, c) → (q₄, Z, L)     mark c as Z, go back left

(q₄, a|b|c|X|Y|Z) → (q₄, same, L)   scan left
(q₄, ␣) → (q₁, ␣, R)    hit left end, start over from q₁

(q₅, Y) → (q₅, Y, R)     skip marked b's in final check
(q₅, Z) → (q₅, Z, R)     skip marked c's
(q₅, ␣) → (q_accept, ␣, R)   all symbols matched: accept!
(q₅, b|c) → (q_reject)   leftover unmarked symbol: reject
```

**Trace on `aabbcc`:**

```
Tape: a a b b c c ␣...
Step 1: q₁ sees a → write X, move R → q₂
Tape: X a b b c c ␣
q₂ skips 'a', sees b → write Y, R → q₃
Tape: X a Y b c c ␣
q₃ skips 'b', sees c → write Z, L → q₄
Tape: X a Y b Z c ␣
q₄ scans all the way left to ␣, R → q₁
Tape: X a Y b Z c ␣ (head at X)

Step 2: q₁ sees X → skip (q₁ on X: go R)
Wait — our transitions have q₁ on X do what? Let me add:
(q₁, X) → (q₁, X, R)   skip already-marked a's

q₁ skips X, sees a → write X, R → q₂
Tape: X X Y b Z c ␣
q₂ skips Y (marked b), sees b → write Y, R → q₃
Tape: X X Y Y Z c ␣
q₃ skips Z (marked c), sees c → write Z, L → q₄
Tape: X X Y Y Z Z ␣
q₄ scans left, arrives at start → q₁

Step 3: q₁ skips X X, sees Y → switch to q₅
q₅ skips Y Y, skips Z Z, sees ␣ → ACCEPT ✓
```

**Trace on `aabcc` (unequal counts):**

After first sweep: `X a Y ␣ Z c` — wait, when looking for b after the second a, we find Y (already marked), skip it, and find nothing (oops, b's are done). We'd hit `c` in state q₂ — no transition for `(q₂, c)` → q_reject. ✓

---

## 8.3 The Church-Turing Thesis

**Claim (informal):** Every effectively computable function can be computed by a Turing machine.

This is a **thesis**, not a theorem — it can't be formally proven because "effectively computable" is an informal notion (what a human can do following an algorithm). But:

- Every programming language (Python, Java, C) can be compiled to a TM (and vice versa)
- Every other model of computation studied — lambda calculus, recursive functions, RAM machines — computes exactly the same set of functions
- No counterexample has been found in 90 years

**Practical implication:** When proving a problem is *decidable* (or *recognizable*), you can write it as a high-level algorithm in any programming language. If it terminates correctly, a TM exists — you don't need to give the explicit TM transitions.

---

## 8.4 Variants of Turing Machines

Several seemingly more powerful TM variants turn out to be equivalent to the standard TM.

### Multi-Tape TMs

A k-tape TM has k tapes, each with its own read/write head. Transitions: `δ: Q × Γᵏ → Q × Γᵏ × {L,R}ᵏ`.

**Theorem:** Any k-tape TM can be simulated by a 1-tape TM.

**Simulation:** Store all k tapes on a single tape, separated by delimiters (#). Use dotted symbols (ȧ) to mark head positions. Each multi-tape step becomes O(tape length) single-tape steps.

**Time cost:** O(t²) — quadratic overhead but still poly.

### Nondeterministic TMs (NTMs)

Like a nondeterministic PDA: δ returns a *set* of possible next configurations. Accepts if *any* computation path reaches q_accept.

**Theorem:** Any NTM can be simulated by a deterministic TM.

**Simulation (BFS over configuration tree):** Use a 3-tape TM:
- Tape 1: original input (read-only)
- Tape 2: simulation tape (current branch of computation)
- Tape 3: address tape (which branch to explore, encoded as a string over nondeterministic choices)

BFS ensures we don't get stuck in infinite loops on one path while another path accepts.

**Time cost:** O(2^t) in the worst case — exponential overhead. This gap (poly vs exp) is the core of the P vs NP question (Chapter 10).

### Enumerators

An **enumerator** is a TM with a printer: instead of accepting/rejecting input, it prints (enumerates) all strings in a language. An enumerator doesn't take input.

**Theorem:** L is Turing-recognizable iff some enumerator enumerates L.

(Turing-recognizable = a TM accepts exactly the strings in L. Proof: simulate the enumerator, accept when the target string is printed; or run the recognizer for each new output from the enumerator.)

---

## 8.5 Configuration Graphs and Computation

**Definition:** A **configuration** of TM M on input w is a triple `(q, tape, head)`. The set of all configurations is countably infinite.

**Configuration graph:** Directed graph where:
- Nodes = configurations
- Edge `C₁ → C₂` iff M transitions from C₁ to C₂ in one step

**Accepting computation:** A finite path in the configuration graph from the start configuration `(q₀, w, 0)` to a configuration containing q_accept.

**Loop detection:** If a configuration repeats, the TM is in an infinite loop. However, detecting this in general is the Halting Problem (Chapter 9).

**Equivalence of configurations:** Two TMs are **equivalent** if they accept the same language. You can prove equivalence by showing one simulates the other.

---

## 8.6 Recognizable vs. Decidable

Two key language classes emerge from TMs:

### Turing-Recognizable (Recursively Enumerable)

L is **Turing-recognizable** if some TM M accepts exactly the strings in L:
- If w ∈ L: M halts and accepts
- If w ∉ L: M halts and rejects, OR M runs forever (loops)

"Semi-decidable" — M can confirm membership but might not confirm non-membership.

### Decidable (Recursive)

L is **decidable** if some TM M accepts exactly L AND M always halts:
- If w ∈ L: M halts and accepts
- If w ∉ L: M halts and rejects (never loops)

A TM that always halts is called a **decider** for L.

### The Relationship

```
Decidable ⊊ Turing-Recognizable ⊊ All Languages
```

**Decidable ≠ Turing-Recognizable:** The Halting Problem is recognizable but not decidable (Chapter 9).

**Turing-Recognizable ≠ All Languages:** By a counting argument (there are uncountably many languages but only countably many TMs), most languages aren't even Turing-recognizable.

---

## 8.7 Examples of Decidable Languages

### A_DFA: DFA Acceptance Problem

`A_DFA = {<B,w> | B is a DFA that accepts w}`

**Decider:** Simulate B on w. B always halts (DFAs always terminate). Accept iff B accepts.

Decidable. ✓

### E_DFA: DFA Emptiness Problem

`E_DFA = {<B> | B is a DFA with L(B) = ∅}`

**Decider:** Mark q₀. Do BFS/DFS to mark all reachable states. Accept iff no marked state is in F; reject otherwise.

Decidable. ✓

### EQ_DFA: DFA Equivalence Problem

`EQ_DFA = {<B,C> | L(B) = L(C)}`

**Decider:** Construct the symmetric difference DFA D for L(B) △ L(C) = (L(B) ∩ L(C)ᶜ) ∪ (L(B)ᶜ ∩ L(C)). Accept iff L(D) = ∅ (using E_DFA decider).

Decidable. ✓ (DFAs are closed under intersection and complement.)

### A_CFG: CFG Acceptance Problem

`A_CFG = {<G,w> | G is a CFG that generates w}`

**Decider:** Convert G to CNF. Run CYK on w. Accept iff CYK accepts.

Decidable (CYK is O(n³|G|), always terminates). ✓

### E_CFG: CFG Emptiness Problem

`E_CFG = {<G> | L(G) = ∅}`

**Decider:** Mark all terminal-generating variables. Mark A if A → w where all symbols of w are already marked (terminal or marked variable). Repeat until no new marks. Accept iff S is marked.

Decidable. ✓

### EQ_CFG: CFG Equivalence Problem

`EQ_CFG = {<G,H> | L(G) = L(H)}`

**NOT decidable** — CFLs aren't closed under complement, so the symmetric difference trick doesn't work. (We'll see this in Chapter 9.)

---

## 8.8 The Universal Turing Machine

**Key insight:** A TM can simulate any other TM. This leads to a single "universal" computer.

**Universal TM (UTM):** Takes as input `<M, w>` (an encoding of TM M plus an input w). Simulates M on w. Accepts iff M accepts w.

**Encoding `<M>`:** Encode Q, Σ, Γ, δ, q₀, q_accept, q_reject as a binary string (details depend on encoding scheme, but it's always possible and computable).

**Why this is remarkable:**
- The UTM is a *single* TM that computes everything
- Modern computers ARE UTMs (every CPU can run any program if given the right instruction bytes)
- The existence of the UTM implies that deciding whether M accepts w is at least as hard as running M — which means the halting problem can't be decided (Chapter 9)

**The UTM's language:**
```
L(UTM) = {<M,w> | M accepts w} = A_TM
```

`A_TM` is recognizable (the UTM accepts it) but, as we'll see, not decidable.

---

## 8.9 Linear Bounded Automata and Context-Sensitive Languages

**Linear Bounded Automaton (LBA):** A TM where the head cannot move beyond the original input. Uses exactly the space of the input (linear bounded memory).

**LBA languages = Context-Sensitive Languages.**

`{aⁿbⁿcⁿ}` is context-sensitive (our TM from §8.2 stays within the input!). This places it correctly:

```
Regular ⊊ CFL ⊊ CSL ⊊ Decidable ⊊ Recognizable
(DFA)    (PDA) (LBA)  (TM halts)  (TM may loop)
```

The TM we built in §8.2 never goes beyond the input — it's actually an LBA, confirming `{aⁿbⁿcⁿ}` is context-sensitive (but not context-free).

---

## Section Challenge

---

**Q1.** Describe a Turing machine (at the algorithm level) that decides `L = {w#w | w ∈ {0,1}*}` — strings of the form w concatenated with # then w again. (This is like {ww} but with a separator.)

<details>
<summary>Answer</summary>

**High-level algorithm:**

1. Scan the tape to verify it contains exactly one `#`. If not, reject.
2. Zig-zag comparison:
   - Mark the first unmarked symbol before `#` as `X`.
   - Remember the symbol (0 or 1).
   - Scan right past `#`, find the first unmarked symbol after `#`.
   - If it matches the remembered symbol, mark it as `X` and return to step 2.
   - If it doesn't match (or one side is exhausted before the other), reject.
3. If all symbols before `#` are marked AND all symbols after `#` are marked simultaneously: accept.

**Key insight:** Use a separate state for "remembered 0" vs "remembered 1" — the TM's finite control remembers the symbol while the head moves across the tape.

**States needed:** q_scan (find #), q_mark0 (carrying a 0 right), q_mark1 (carrying a 1 right), q_found0/q_found1 (found matching symbol, scan left back), q_check (verify done), plus accept/reject.

**Tape alphabet:** {0, 1, #, X, ␣}

**Time complexity:** O(n²) — n zig-zag passes, each O(n) tape length. But it's still decidable.

**Note:** Without the `#`, recognizing `{ww}` is harder — we can't as easily find the midpoint. `{ww}` is also decidable (try all midpoints, compare), but `{ww}` without a separator requires more bookkeeping.
</details>

---

**Q2.** Prove that if L and its complement L̄ are both Turing-recognizable, then L is decidable.

<details>
<summary>Answer</summary>

**Construction:** Let M₁ recognize L and M₂ recognize L̄.

Build a new TM D:
- Run M₁ and M₂ in **parallel** on input w (alternating steps using a 2-tape simulation).
- If M₁ accepts: accept.
- If M₂ accepts: reject.

**Correctness:**
- For any w ∈ L: M₁ accepts w (eventually). M₂ may or may not halt on w, but since w ∈ L means w ∉ L̄, M₂ will not accept. D accepts.
- For any w ∉ L: w ∈ L̄, so M₂ accepts w (eventually). M₁ will not accept. D rejects.

**D always halts:** For any input w, either w ∈ L or w ∈ L̄ (by law of excluded middle). So either M₁ accepts (case 1) or M₂ accepts (case 2). At least one always happens — D always halts.

**Conclusion:** D is a decider for L → L is decidable. □

**Corollary (important):** A language is decidable iff it and its complement are both recognizable. This is used to prove decidability via complement arguments and to show undecidable languages have non-recognizable complements.
</details>

---

**Q3.** Give a high-level TM description (not explicit transition table) that computes `f(n) = n²` in unary — input is `aⁿ`, output is `a^(n²)`.

<details>
<summary>Answer</summary>

**Key identity:** n² = n + n + ... + n (n times) = n × n.

**Algorithm:**

1. Mark off the input `aⁿ` as "the counter" — we'll add `n` copies of a block of `n` a's.
2. Use a second region of tape for the output.
3. Repeat n times:
   - Copy `n` a's from the input region to the output region.
4. When done, erase the counter region and return a clean tape with a^(n²).

**More concretely:**

- Tape region 1: counter (n ticks, we sweep through each tick once per outer loop)
- Tape region 2: accumulator (where we write the output)

**Outer loop:** for each unmarked a in region 1, mark it and do an inner loop.

**Inner loop:** for each a in a copy of the original count, write one a to region 2.

But we need to remember the original count n (for the inner loop). We can do this by copying the input count at the start:

1. Copy input `aⁿ` to region 2 as the "inner counter". Tape: `[aⁿ] [aⁿ]`.
2. Outer loop: mark one a in region 1. For each a in region 2 (inner counter copy), write one a to region 3 (output). Repeat n times.

**Result in region 3:** n groups of n a's = a^(n²). ✓

**Why this is possible:** We can use the tape as scratch space — reading, writing, copying across different tape regions. This generality of read-write access is why TMs can compute multiplication, whereas PDAs (read-only + LIFO stack) cannot.
</details>

---

**Q4.** Is the following language decidable? `FINITE_TM = {<M> | L(M) is a finite language}`. Justify briefly.

<details>
<summary>Answer</summary>

**Not decidable.** (We'll prove this rigorously in Chapter 9 via Rice's Theorem, but here's the key intuition.)

A TM M accepts a finite language iff M's computation on all strings terminates and accepts only finitely many. But:

**Reduction sketch:** Suppose we had a decider D for FINITE_TM. We could use D to solve the Halting Problem:

Given any TM M and input w, construct M' that:
- On input xⁿ for n = 1, 2, 3, ...: simulates M on w for n steps. If M accepts within n steps, accepts. Otherwise, rejects.

Now:
- If M halts and accepts w: M' accepts all strings of length ≥ (halting step count) — L(M') is infinite.
- If M never halts on w: M' accepts nothing — L(M') = ∅, which is finite.

Running D on M': D would tell us whether L(M') is finite, which tells us whether M halts — deciding the Halting Problem. But the Halting Problem is undecidable (Chapter 9) → FINITE_TM is undecidable. □

**Rice's Theorem (preview):** Any non-trivial property of the language L(M) (i.e., not always true and not always false) is undecidable. "L(M) is finite" is a non-trivial language property → undecidable.
</details>

---

**Q5.** Show that the class of decidable languages is closed under complement.

<details>
<summary>Answer</summary>

**Claim:** If L is decidable, so is L̄.

**Proof:** Let M be a decider for L (TM that always halts). Construct M' that:
- Runs M on input w
- If M accepts: M' **rejects**
- If M rejects: M' **accepts**

**M' is a decider:** Since M always halts, M' always halts (it just flips the accept/reject outcome).

**M' decides L̄:**
- If w ∈ L̄ (i.e., w ∉ L): M rejects w → M' accepts w ✓
- If w ∉ L̄ (i.e., w ∈ L): M accepts w → M' rejects w ✓

Therefore L̄ is decidable. □

**Contrast with recognizable:** Turing-recognizable languages are NOT closed under complement (the Halting Problem is recognizable but its complement is not). This is a key asymmetry: decidable languages are symmetric (both L and L̄ are decidable) while recognizable languages can be one-sided.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| TM = 7-tuple | Q, Σ, Γ, δ, q₀, q_acc, q_rej; head reads/writes and moves L/R |
| Configuration | (state, tape, head) encodes complete machine state |
| Key power | head can write and move left — unlike DFA or PDA |
| Decider vs Recognizer | decider always halts; recognizer may loop on non-members |
| Church-Turing thesis | TMs capture all effective computation (thesis, not theorem) |
| Variants | multi-tape, NTM, enumerator all equivalent to standard TM |
| UTM | single TM that simulates any other TM on any input |
| Decidable examples | A_DFA, E_DFA, EQ_DFA, A_CFG, E_CFG all decidable |
| Hierarchy | Regular ⊊ CFL ⊊ CSL ⊊ Decidable ⊊ Recognizable |
| Closed under | Decidable: ∪, ∩, ¬, ·, *. Recognizable: ∪, ∩ (NOT ¬) |

**Where we go next:** Chapter 9 takes TMs to their limit — the Halting Problem, diagonal argument, and the boundary between decidable and recognizable.

---

*Previous: [07 — Pumping Lemma for CFLs](07_Pumping_Lemma_CFLs.md)*
*Next: [09 — Decidability and the Halting Problem](09_Decidability_Halting_Problem.md)*
