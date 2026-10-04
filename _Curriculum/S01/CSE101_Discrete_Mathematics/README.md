# CSE101 — Discrete Mathematics

## Semester 1 · Foundations

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can read a mathematical claim, decide whether it's true, and prove it (or disprove it with a counterexample). You can model real problems with sets, relations, and graphs without translating to code first. You can count combinatorial objects without ever undercounting or double-counting.
> **Capstone:** Write a "proof portfolio" — 10 mathematical claims you formally prove (induction, contradiction, contrapositive, pigeonhole, direct). At least 3 must come from computer science (algorithm correctness, complexity lower bound, graph property).

---

## Why This Course Exists

Every other CS course rests on this one. When CSE201 asks "prove your BST search is O(log n)," you need induction. When CSE301 asks "prove the visitor pattern preserves type safety," you need quantified logic. When CSE302 asks "why does this query plan return at most N rows," you need set reasoning. When CSE703 asks "what's the probability your classifier is right?," you need counting.

The student who skips this course CAN write code, but every claim they make about that code is folk wisdom. The student who masters it can DEFEND every claim.

---

## Navigation

| Course                                                                              | Description |
| ----------------------------------------------------------------------------------- | ----------- |
| **CSE101 — Discrete Mathematics**                                                   | This course |
| **[CSE102 — Programming Fundamentals](../CSE102_Programming_Fundamentals/README.md)** | S01 sibling — gives you something to prove things about |
| **[CSE103 — Linear Algebra](../CSE103_Linear_Algebra/README.md)**                   | S01 sibling — different math, different problems |
| **[CSE104 — Introduction to Computer Systems](../CSE104_Computer_Systems/README.md)** | S01 sibling |

| Where you'll use it                              | Specific application                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `03_Algorithms/A1_Correctness_Proofs.md`          | Loop invariants, induction proofs for correctness             |
| `03_Algorithms/A2_Complexity_FirstPrinciples.md`  | Big-O bounds proven from limit definitions                   |
| `02_Data_Structures/A1_DS_Correctness_Invariants.md` | BST + heap structural invariants stated formally           |
| `08_SQL/03_DataModeling_Schema.md`                | Relations, functions, normalization theory                    |
| `06_OOP_Design/`                                  | Boolean algebra in SOLID's interface segregation              |

---

## Prerequisites

- None. High-school algebra (solving for x, basic exponents/logs) is enough.
- A notebook + pen. Most of this course should NOT be done on a computer. Proofs build by hand first.

**Constraint:** This course can feel "useless" early on. The first 4 weeks are abstract. The payoff is delayed — usually it lands in Week 8 when you're trying to prove induction and suddenly understand why your CSE201 BST proof is wrong. Trust the sequence. Don't skip ahead to "applications."

---

## Chapter Index

| # | Chapter | Weeks |
|---|---------|-------|
| [01](01_Propositional_Logic.md) | Propositional Logic | 1 |
| [02](02_Predicate_Logic_Quantifiers.md) | Predicate Logic & Quantifiers | 2 |
| [03](03_Proof_Techniques.md) | Proof Techniques | 3 |
| [04](04_Induction_Variants.md) | Mathematical Induction | 4 |
| [05](05_Sets_Operations.md) | Sets & Operations | 5 |
| [06](06_Relations_Properties.md) | Relations & Properties | 6 |
| [07](07_Functions_Properties.md) | Functions & Properties | 7 |
| [08](08_Counting_Combinatorics.md) | Counting & Combinatorics | 8 |
| [09](09_Pigeonhole_Principle.md) | Pigeonhole Principle | 9 |
| [10](10_Recurrence_Relations.md) | Recurrence Relations | 10 |
| [11](11_Graph_Theory_Foundations.md) | Graph Theory Foundations | 11–14 |
| [12](12_Boolean_Algebra_Circuits.md) | Boolean Algebra & Circuits | 15 |

Every chapter includes a Section Challenge; Ch01–Ch04 also have Practice Problems.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Logic & Proof (Weeks 1–4)

**Learning Outcomes:**

- Translate English statements into propositional logic and back
- Decide if a logical argument is valid by truth table or natural deduction
- Prove statements by induction, contradiction, contrapositive — knowing when each fits

---

#### Week 1 — Propositional Logic

**Real-world analogy: A house's alarm system**
- "IF (door OR window opens) AND (alarm is armed) THEN sound the siren" — this is pure propositional logic with three variables (`door_open`, `window_open`, `armed`) and one output (`siren`). Every conditional in code, every database WHERE clause, every electrical circuit obeys the same rules you'll learn this week.

**Mental model: a truth table is just exhaustive enumeration.**
With 3 boolean variables there are 2³ = 8 rows. The table is the GROUND TRUTH of what the formula means — every other logical equivalence reduces to "two different formulas have the same truth table."

| Day | Topic                                | Read                                              | Do                                                                  |
| --- | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Propositions, connectives (¬ ∧ ∨ → ↔) | [Ch01](01_Propositional_Logic.md) §1–3                                      | Translate 20 English statements; mark which connective                |
| 2   | Truth tables, tautologies, contradictions | [Ch01](01_Propositional_Logic.md) §4–5                                  | Verify De Morgan's laws by truth table                              |
| 3   | Logical equivalences                  | [Ch01](01_Propositional_Logic.md) §6                                     | Simplify (P → Q) ∧ (¬P → Q) to "Q"                                |
| 4   | Implications: converse, inverse, contrapositive | [Ch01](01_Propositional_Logic.md) §7                             | For "if it rains then ground is wet": state the contrapositive       |
| 5   | Lab — code conditional simplification  | —                                                 | **Lab:** Refactor 5 messy if-statements using De Morgan + simplification |
| 6–7 | Review + Problem Set DM-PS1            | —                                                 | [Ch01](01_Propositional_Logic.md) Section Challenge + Practice Problems                          |

**Section Challenge (Contrapositive vs Inverse):**

> "If it rains, the ground is wet."
> Mark each of the following as TRUE / FALSE / CANNOT TELL based ONLY on the original statement:
>
> 1. If the ground is wet, it rained.
> 2. If it doesn't rain, the ground isn't wet.
> 3. If the ground is NOT wet, it didn't rain.

<details>
<summary>Answer + the principle this teaches</summary>

```
ORIGINAL:    rain → wet      (P → Q)
CONVERSE:    wet → rain      (Q → P)        — claim #1
INVERSE:     ¬rain → ¬wet    (¬P → ¬Q)      — claim #2
CONTRAPOSITIVE: ¬wet → ¬rain (¬Q → ¬P)      — claim #3

ONLY THE CONTRAPOSITIVE IS LOGICALLY EQUIVALENT TO THE ORIGINAL.

Claim #1 (CANNOT TELL): a sprinkler could have wet the ground.
  The original doesn't say rain is the ONLY cause. Asserting the
  converse from the original is the "affirming the consequent" fallacy.

Claim #2 (CANNOT TELL): a sprinkler could STILL wet the ground.
  Same reasoning — wet has other causes.

Claim #3 (TRUE): if the ground is dry, then it can't have rained
  (because if it had, the ground would be wet). This is the
  contrapositive, which is ALWAYS equivalent to the original.

WHY THIS MATTERS IN CODE:
  if (user.isAdmin()) { allowAccess(); }
  Reading this and concluding "if access was allowed, the user must be admin"
  is affirming the consequent. Maybe access is also allowed for paid users.

  The CONTRAPOSITIVE: "if access was DENIED, the user is not admin." THIS IS
  GUARANTEED if the IF was the only path to allowAccess.

  Junior debuggers default to the converse. Senior debuggers default to the
  contrapositive. The shift is what makes "logical reasoning about code"
  feel slow at first, then automatic.

REAL-WORLD ECHO:
  "Vaccinated people don't get severely ill" (P → Q).
  Many people heard a critic say "I know a vaccinated person who got sick,
  therefore the statement is wrong." They were converting to the converse.
  The original claim doesn't say sickness is impossible — it says vaccination
  reduces severity. The contrapositive: "If someone got severely ill, they
  weren't vaccinated" — would be the equivalent reformulation, and is also
  not quite right because the original is statistical, not absolute. The
  distinction between logical and statistical reasoning is exactly what this
  course teaches you to navigate.
```

</details>

---

#### Week 2 — Predicate Logic & Quantifiers

**Real-world analogy: Database queries**
- `SELECT * FROM users WHERE age > 18` is ∃x. user(x) ∧ age(x) > 18 — there exists at least one such user
- `SELECT count(*) ... HAVING count(*) = (SELECT count(*) FROM users)` finds users such that ∀ — for ALL users a property holds

The quantifiers ∀ ("for all") and ∃ ("there exists") aren't abstract — they're literally the operators every database, every test framework, every type checker uses.

**Topic:** Universal vs existential quantifiers, scope, nested quantifiers, negation of quantifiers (`¬∀x.P(x) ≡ ∃x.¬P(x)`), free vs bound variables. Read [Ch02](02_Predicate_Logic_Quantifiers.md).

**Aha moment to chase:** "Every student has a favorite subject" vs "There is one favorite subject every student loves" — same English template, very different logic. ∀x.∃y. vs ∃y.∀x.

---

#### Week 3 — Proof Techniques

**Real-world analogy: Court cases**
- **Direct proof:** "Evidence A, B, C all point to defendant. Therefore guilty." — chain of implications.
- **Proof by contradiction:** "Assume defendant is innocent. Then he couldn't have been in the city. But the security camera shows him there. Contradiction." — assume the opposite, derive a false statement.
- **Proof by contrapositive:** "If the defendant was at home (¬guilty in this hypothetical), then the witness was lying. But the witness's story corroborates. Therefore the defendant was NOT at home."
- **Counterexample:** "The prosecution claims ALL guilty people had motive. But here's a known random act — defies the claim."

Mathematical proofs ARE structured arguments. You're already used to following them on TV; now you formalize the structure.

Read [Ch03](03_Proof_Techniques.md): direct proof, proof by cases, contradiction, contrapositive, counterexample.

---

#### Week 4 — Induction

**Real-world analogy: A domino chain**
- Base case: knock the first domino down. ✓ (this is trivial, but required)
- Inductive step: prove that IF the k-th domino falls, the (k+1)-th falls. ✓
- Conclusion: all dominoes fall.

If either part fails (no first push, or some gap between dominoes), the chain breaks. Induction is the mathematical formalization of "the chain reaction works."

| Day | Topic                                | Read                                              | Do                                                                  |
| --- | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Weak induction                        | [Ch04](04_Induction_Variants.md) §2                                     | Prove: 1+2+...+n = n(n+1)/2                                          |
| 2   | Strong induction                      | [Ch04](04_Induction_Variants.md) §3                                     | Prove: every n ≥ 12 cents can be made from 4¢ and 5¢ stamps          |
| 3   | Structural induction (preview)        | [Ch04](04_Induction_Variants.md) §4                                     | Prove: a binary tree of height h has ≤ 2^(h+1) - 1 nodes             |
| 4   | When induction fails (off-by-one trap) | [Ch04](04_Induction_Variants.md) §5                                     | Find the bug in a "proof" that all horses are the same color         |
| 5–7 | Review + Problem Set DM-PS4           | —                                                 | [Ch04](04_Induction_Variants.md) Section Challenge + Practice Problems                          |

**Section Challenge (the classic horses-fallacy):**

> Claim: All horses are the same color.
> "Proof" by induction:
> - Base: 1 horse. Trivially the same color as itself. ✓
> - Inductive step: assume any group of k horses are the same color. Take any group of (k+1) horses. Remove one — the remaining k are the same color (by hypothesis). Put it back, remove a different one — those k are also the same color. So all (k+1) share the color. ✓
>
> The conclusion is obviously wrong. WHERE is the bug?

<details>
<summary>Answer + why this trap is the most important induction lesson</summary>

```
THE BUG IS IN THE STEP FROM k=1 TO k=2.

The inductive step claims: from "any group of k horses are same color"
we can conclude "any group of k+1 horses are same color."

Let's apply it with k=1:
  Group of 2 horses: {A, B}.
  Remove A: {B} — trivially same color (single horse). ✓
  Remove B: {A} — trivially same color. ✓
  "Therefore A and B are the same color."

THE FAILURE: when we remove different horses, the two leftover singletons
({A} and {B}) NEVER SHARE A HORSE. The argument needs the two subgroups
to OVERLAP in at least one horse so we can transitively conclude color
equality. For k ≥ 2, the subgroups overlap in (k-1) horses, so the
transitivity works. For k = 1, the subgroups don't overlap at all.

WHAT THIS TEACHES:
  Strong induction's inductive step must hold for EVERY k from base
  through infinity. The horse "proof" works for k ≥ 2 but FAILS at k=1.
  Since the chain breaks at k=1, the whole induction collapses.

THE LIFE LESSON:
  Verify the inductive step works AT THE BASE CASE BOUNDARY.
  Many real induction proofs have this exact bug:
  - "For n ≥ 1, ..." but the inductive step assumes "k ≥ 2 elements".
  - Algorithm correctness proofs that assume the array has ≥ 2 elements.
  - Tree proofs that assume "internal node has 2 children" but the base
    case is a leaf with 0 children — the inductive step doesn't fire correctly.

THIS IS THE MOST COMMON BUG IN ALGORITHM CORRECTNESS PROOFS.
  Junior interviewers won't catch it. Senior ones will. And it bites
  in production when a recursive function works for n=2,3,4,... but
  silently crashes for n=1.
```

</details>

---

### UNIT 2 — Sets, Relations, Functions (Weeks 5–7)

**Real-world analogy: A library**
- The set of all books is the universe.
- "Books in section A" is a subset.
- "Books written by author X" is a function (each book maps to one author).
- "Books citing book X" is a relation (one book can cite many; one cited by many).

Sets aren't abstract — they're how your brain already organizes the world.

| Week | Topic                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------ |
| 5    | Set operations (∪ ∩ \ ×), Venn diagrams, power sets — [Ch05](05_Sets_Operations.md)                    |
| 6    | Relations: properties (reflexive, symmetric, transitive), equivalence relations — [Ch06](06_Relations_Properties.md) |
| 7    | Functions: injective/surjective/bijective, inverse, composition — [Ch07](07_Functions_Properties.md)                |

**Aha link:** Equivalence relations literally define equality in your codebase. Java's `equals()` MUST be reflexive, symmetric, and transitive — that's the contract. When you override it incorrectly (forget transitivity), `HashMap` breaks. This is the mathematical reason for the contract.

---

### UNIT 3 — Counting (Weeks 8–10)

**Real-world analogy: Lottery + Birthday surprise**
- "How many ways to pick 6 from 49 lottery numbers?" → combinations C(49,6) = 14M
- "What's the chance two people in your class of 30 share a birthday?" → counterintuitive 70%+ via pigeonhole + complement

| Week | Topic                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- |
| 8    | Permutations + combinations, multinomial, Pascal's triangle — [Ch08](08_Counting_Combinatorics.md)             |
| 9    | Pigeonhole principle (simple + generalized) — [Ch09](09_Pigeonhole_Principle.md); also see `03_Algorithms/A3_Lower_Bounds_And_NP.md` §1 for hashing application |
| 10   | Recurrence relations — [Ch10](10_Recurrence_Relations.md) (generating functions not covered); also see `03_Algorithms/A2_Complexity_FirstPrinciples.md` §2 (Master Theorem) |

**Section Challenge (Pigeonhole power):**

> A computer system has IP addresses in the range 10.0.0.0 to 10.0.0.255 (256 addresses). If 300 devices try to connect, how many MUST collide on the same IP — at minimum?

<details>
<summary>Answer</summary>

```
PIGEONHOLE:
  300 devices distributed among 256 IPs.
  By the pigeonhole principle: ⌈300/256⌉ = 2.

So AT LEAST ONE IP must host at least 2 devices.

But the question asks "how many MUST collide" — the MINIMUM number
of devices that share an IP.

ANSWER: 2 devices (at minimum).

Could be more: in the worst case, ALL 300 collide on 1 IP, with 255
IPs unused. The question is the LOWER bound on collision count.

WHY THIS MATTERS IN PRODUCTION:
  Hash table sizing: if you have N items and M slots, with M < N,
  COLLISIONS ARE GUARANTEED. The pigeonhole principle is the mathematical
  reason hash tables need collision resolution (chaining, open addressing).
  No clever hash function can defeat the principle when N > M.

  Birthday paradox: 23 people, 365 days. Pigeonhole alone says no
  collision is GUARANTEED (23 < 365). But probability gives us 50%+
  chance of a shared birthday — because pigeonhole is a worst-case
  guarantee, not the expected behavior.

THE PIGEONHOLE TRICK IN ALGORITHMS:
  Lower bound: comparison sorts require Ω(n log n).
  Proof sketch: n! permutations of n items. A comparison tree must
  have ≥ n! leaves to distinguish them. Height of binary tree with
  n! leaves is ≥ log₂(n!) ≈ n log n. PIGEONHOLE applied to decision
  trees — n! "input pigeons" need ≥ n log n "decision-path holes."
```

</details>

---

### UNIT 4 — Graph Theory (Weeks 11–14)

**Real-world analogy: Multiple analogies for graphs**
- **Social network:** people are vertices, friendships are edges (undirected). "Friend of a friend" is path of length 2.
- **Road map:** intersections are vertices, roads are edges (with weights = distance). "Shortest route" is Dijkstra.
- **Dependency graph:** tasks are vertices, "X must finish before Y" is directed edge. "Build order" is topological sort.
- **Web pages:** URLs are vertices, hyperlinks are directed edges. "PageRank" is eigenvector centrality.

| Week | Topic                                              | Read                                                |
| ---- | -------------------------------------------------- | --------------------------------------------------- |
| 11   | Graph terminology, representations                  | `03_Algorithms/05c_Graphs_Fundamentals.md` §1       |
| 12   | Paths, cycles, connectivity, trees as special graphs | `03_Algorithms/05c_Graphs_Fundamentals.md` §2-3   |
| 13   | Euler + Hamiltonian paths, bipartite graphs         | [Ch11](11_Graph_Theory_Foundations.md) (Euler, bipartite; Hamiltonian not covered) |
| 14   | Planarity, graph coloring, applications             | [Ch11](11_Graph_Theory_Foundations.md) §Graph Coloring                         |

---

### UNIT 5 — Boolean Algebra (Week 15)

**Real-world analogy: A light circuit**
- AND gate: both switches must be on for the bulb to light
- OR gate: either switch lights the bulb
- NOT gate: a switch that INVERTS its input
- Every digital circuit, every CPU, every memory cell is built from these primitives.

Read [Ch12](12_Boolean_Algebra_Circuits.md): minimization, Karnaugh maps, CNF/DNF, SAT problem preview.

---

### Week 16 — Capstone: Proof Portfolio

Write 10 formal proofs:
- 3 by induction (one weak, one strong, one structural)
- 2 by contradiction
- 2 by contrapositive
- 1 by direct construction
- 2 disproof by counterexample

At least 3 must be from computer science:
- Algorithm correctness (e.g., binary search invariant)
- Complexity lower bound (e.g., why sorting is Ω(n log n))
- Data structure invariant (e.g., heap property preservation)

---

## Capstone Project

[CAP01 — DSA Toolkit](../../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md) — your proofs justify the correctness claims you'll make about the DSA toolkit's operations.

## Problem Sets

Each chapter's Section Challenge (Ch01–Ch04 also have Practice Problems) — see the Chapter Index above.

## Where The Math Lives

Real working examples of these principles elsewhere in the repo:

- **Induction** in algorithm correctness — `03_Algorithms/A1_Correctness_Proofs.md`
- **Master Theorem** for recurrences — `03_Algorithms/A2_Complexity_FirstPrinciples.md` §2
- **Set operations** in SQL — `08_SQL/07_JOINs_Complete.md` (joins are relational algebra)
- **Functions** in TypeScript — `17_TypeScript/01_TS_Foundations.md` (functions formalize input → output mapping)
- **Graphs** — `03_Algorithms/05_*.md` series
- **Boolean algebra** — every if/else in your code
