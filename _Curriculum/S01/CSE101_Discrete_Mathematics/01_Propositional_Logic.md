# Chapter 01 — Propositional Logic

> **Course:** CSE101 Discrete Mathematics · **Unit:** 1 (Logic & Proof) · **Week:** 1
> **Prerequisites:** None
> **Reading time:** ~3-4 hours · **Lab time:** ~3 hours

---

## Why You're Here

Every conditional in code, every database `WHERE` clause, every digital circuit, every legal contract, every security policy — these are all propositional logic at work. When you write `if (user.isAuthenticated && hasPermission)`, you're writing a propositional formula. When you debug "this condition should be true but isn't firing," you're working logic backwards. When you simplify a tangled conditional, you're applying logical equivalences.

The students who skip propositional logic don't lose the ability to write conditions — they lose the ability to **reason about** conditions. A senior engineer can look at a 20-line nested if and say "this whole thing is equivalent to a 3-line guard clause." That skill is propositional logic in action.

---

## 1. What Is a Proposition?

A **proposition** is a statement that is unambiguously TRUE or FALSE.

**Real-world analogy: a thermostat reading**

> "The kitchen temperature is above 70°F."

At any moment, this is true or false. It can't be "kind of true" or "70% true." A thermometer reads 71°F → TRUE. A thermometer reads 65°F → FALSE. No third option.

Compare to these NON-propositions:

| Statement | Why it's not a proposition |
|-----------|----------------------------|
| "What time is it?" | Questions aren't true or false. |
| "Close the door." | Commands aren't true or false. |
| "This sentence is false." | Paradox — can't assign a truth value. |
| "She is tall." | Ambiguous without context (who is "she"? What does "tall" mean?). |

Propositions are written as letters: P, Q, R, etc. Each letter stands for a specific true-or-false statement.

```
P = "It is raining"
Q = "The ground is wet"
R = "I have an umbrella"
```

At any moment in the real world, P, Q, R each have a specific truth value. Logic is the study of how to combine and reason about those values.

---

## 2. Connectives — Building Compound Propositions

A connective combines simple propositions into compound ones, just like operators combine numbers in arithmetic.

### 2.1 Negation: ¬ (NOT)

`¬P` means "P is false."

Truth table (the entire definition):

| P | ¬P |
|---|----|
| T | F  |
| F | T  |

**Real-world analogy: A light switch with one bulb.**

The switch's `is_on` state and the bulb's `is_dark` state are negations of each other.

In code: `!isAuthenticated`, `!user.hasPermission()`, `NOT EXISTS (SELECT ...)`. Pure negation.

### 2.2 Conjunction: ∧ (AND)

`P ∧ Q` is TRUE only when BOTH P and Q are true.

| P | Q | P ∧ Q |
|---|---|-------|
| T | T |   T   |
| T | F |   F   |
| F | T |   F   |
| F | F |   F   |

**Real-world analogy: A safe deposit box with two keys.**

The box opens (TRUE) only when the customer's key AND the bank's key are both used. Either alone — the box stays locked.

In code: `if (user.isAdmin && user.has2FA) { ... }`. Both conditions required.

### 2.3 Disjunction: ∨ (OR)

`P ∨ Q` is TRUE when AT LEAST ONE of P, Q is true.

| P | Q | P ∨ Q |
|---|---|-------|
| T | T |   T   |
| T | F |   T   |
| F | T |   T   |
| F | F |   F   |

**Crucial note:** This is **inclusive** OR. "Coffee or tea?" in everyday speech often means "one or the other, not both" (exclusive). In logic, OR includes both — having both coffee AND tea still satisfies "P ∨ Q."

If you mean "exactly one but not both," that's the **exclusive or** (XOR): `P ⊕ Q`. XOR is just `(P ∨ Q) ∧ ¬(P ∧ Q)`.

**Real-world analogy: An airport security line.**

"You can use the line if you have a flight today OR have an airport employee badge." Either alone gets you in. Both also gets you in (a flying employee). Only "neither" keeps you out.

### 2.4 Implication: → (IF...THEN)

`P → Q` reads "if P then Q" or "P implies Q."

This is the trickiest connective for beginners. Let's build it carefully.

**Real-world analogy: A vending machine promise.**

> "If you put in $2, the machine gives you a soda."

When is this promise BROKEN? Only one scenario: you put in $2, and you get NO soda. That's the lie.

What about: you put in $5 and get a soda? The promise wasn't violated — the machine didn't promise anything about $5 inputs.

What about: you put in nothing, and you get no soda? Of course — no promise was made about no-input cases.

What about: you put in nothing, and somehow a soda appears? Lucky, but the promise wasn't broken. The promise was only about what happens when you DO put in $2.

Truth table:

| P (paid $2) | Q (got soda) | P → Q (promise kept) |
|---|---|---|
| T | T |   T  ← paid, got soda — promise kept |
| T | F |   F  ← paid, no soda — PROMISE BROKEN |
| F | T |   T  ← didn't pay, got soda — promise wasn't tested |
| F | F |   T  ← didn't pay, no soda — promise wasn't tested |

The implication is FALSE only in row 2 — the only scenario where the promise was actively violated.

**The vacuous truth principle:**

If P is false, then `P → Q` is automatically true, no matter what Q is. This feels strange ("if pigs fly, then 2+2=5" — TRUE?) but it's logically necessary. When the premise never holds, the promise was never tested, so it can't be "broken."

In code:

```javascript
function isAdmin(user) {
  if (!user) return false;       // P is "user exists"; if P is false, irrelevant
  return user.role === 'admin';  // tested only when user exists
}
```

The promise "if a user is logged in, they have a role" is vacuously true for users who don't exist.

### 2.5 Biconditional: ↔ (IF AND ONLY IF)

`P ↔ Q` is TRUE when P and Q have the SAME truth value (both T or both F).

| P | Q | P ↔ Q |
|---|---|-------|
| T | T |   T   |
| T | F |   F   |
| F | T |   F   |
| F | F |   T   |

**Real-world analogy: A two-way mirror with a switch.**

"The mirror is reflective ↔ the lights are off" — when one is true, the other is. When one is false, the other is. Perfect lockstep.

In code: `isAuthenticated === hasValidToken` — they must match exactly.

---

## 3. Operator Precedence and Parentheses

Mathematical operator precedence (high to low):
```
¬   (highest, applied first)
∧
∨
→
↔   (lowest)
```

So `P ∨ Q ∧ R` means `P ∨ (Q ∧ R)`, just like `1 + 2 × 3` means `1 + (2 × 3)`.

**Best practice:** Use parentheses liberally. Don't trust your reader to remember precedence. `P ∨ (Q ∧ R)` is clearer than `P ∨ Q ∧ R` even when they mean the same thing.

---

## 4. Truth Tables — The Ground Truth

A truth table enumerates EVERY possible combination of input truth values and shows the result of a formula.

For n variables, there are 2ⁿ rows.

**Example: Construct truth table for `(P → Q) ∧ (Q → P)`**

| P | Q | P → Q | Q → P | (P → Q) ∧ (Q → P) |
|---|---|-------|-------|--------------------|
| T | T |   T   |   T   |        T          |
| T | F |   F   |   T   |        F          |
| F | T |   T   |   F   |        F          |
| F | F |   T   |   T   |        T          |

Look at that final column: T, F, F, T. That's the same as `P ↔ Q`. So we've discovered an equivalence:

> `(P → Q) ∧ (Q → P) ≡ P ↔ Q`

Two formulas with the same truth table mean the same thing. They're equivalent.

---

## 5. Tautologies, Contradictions, Contingencies

A **tautology** is a formula that's TRUE in every row of its truth table. Always true regardless of input.

Example: `P ∨ ¬P` — "P or not-P."

| P | ¬P | P ∨ ¬P |
|---|----|---|
| T | F  | T |
| F | T  | T |

The famous "law of excluded middle" — every proposition is true or false; there's no middle ground.

A **contradiction** is FALSE in every row. Always false.

Example: `P ∧ ¬P` — "P and not-P." Impossible.

A **contingency** is sometimes true, sometimes false depending on inputs. Most formulas you'll see in practice are contingencies.

**Why tautologies matter:**

If you can prove a formula is a tautology, you've established a mathematical truth that holds in ALL possible worlds — not just our universe, but any universe. That's the foundation of logical reasoning.

If a formula is a contradiction, it can be used in proofs by contradiction (Chapter 03).

---

## 6. Logical Equivalences — The Algebra of Logic

Two formulas are **logically equivalent** (written `≡`) if they have identical truth tables. Equivalences are the rewriting rules of logic, like algebraic identities for numbers.

### 6.1 The Big Ten Equivalences

These are worth memorizing. They're used constantly in simplification.

**Identity laws:**
```
P ∧ T ≡ P
P ∨ F ≡ P
```

**Domination laws:**
```
P ∨ T ≡ T
P ∧ F ≡ F
```

**Idempotent laws:**
```
P ∧ P ≡ P
P ∨ P ≡ P
```

**Double negation:**
```
¬(¬P) ≡ P
```

**Commutative laws:**
```
P ∧ Q ≡ Q ∧ P
P ∨ Q ≡ Q ∨ P
```

**Associative laws:**
```
(P ∧ Q) ∧ R ≡ P ∧ (Q ∧ R)
(P ∨ Q) ∨ R ≡ P ∨ (Q ∨ R)
```

**Distributive laws:**
```
P ∧ (Q ∨ R) ≡ (P ∧ Q) ∨ (P ∧ R)
P ∨ (Q ∧ R) ≡ (P ∨ Q) ∧ (P ∨ R)
```

**De Morgan's laws** (the most-used in code):
```
¬(P ∧ Q) ≡ ¬P ∨ ¬Q
¬(P ∨ Q) ≡ ¬P ∧ ¬Q
```

**Implication rewrite:**
```
P → Q ≡ ¬P ∨ Q
```

(This is a profound identity — it shows that implication is REDUCIBLE to negation and disjunction. Logic doesn't strictly need →; we use it because it's clearer.)

### 6.2 De Morgan's Laws — The Refactoring Workhorse

De Morgan's laws are the most practical equivalences for daily code.

**Statement:** "NOT (A AND B)" is the same as "NOT A OR NOT B."

**Real-world example:**

A vending machine has the rule: "Refund the customer if NOT (purchase was successful AND item was delivered)."

By De Morgan:

> "Refund the customer if (purchase was not successful) OR (item was not delivered)."

Both say the same thing. The second form is often easier to act on — each condition is a separate check.

**Code application:**

```javascript
// BEFORE (hard to read)
if (!(user.isLoggedIn() && user.hasValidSession())) {
  redirectToLogin();
}

// AFTER (De Morgan'd, easier to read)
if (!user.isLoggedIn() || !user.hasValidSession()) {
  redirectToLogin();
}
```

The conditions are now separable. A code reviewer can immediately see: "redirect if not logged in, OR if session invalid."

### 6.3 Simplification by Sequence of Equivalences

Each equivalence is a single rewrite rule. Chaining them simplifies expressions.

**Example: Simplify `(P → Q) ∧ (¬P → Q)`**

Step 1: Apply implication rewrite to both implications.
```
(P → Q) ∧ (¬P → Q)
≡ (¬P ∨ Q) ∧ (¬(¬P) ∨ Q)
```

Step 2: Apply double negation.
```
≡ (¬P ∨ Q) ∧ (P ∨ Q)
```

Step 3: Apply distributive law (reverse direction).
```
≡ Q ∨ (¬P ∧ P)
```

Step 4: `¬P ∧ P` is a contradiction (always false).
```
≡ Q ∨ F
```

Step 5: Apply identity law.
```
≡ Q
```

So `(P → Q) ∧ (¬P → Q) ≡ Q`. The original formula, regardless of P, just says "Q is true." A 7-symbol formula reduces to a 1-symbol fact.

**Why this matters:** In code, you might find:

```javascript
if (
  (isAdmin ? hasReadAccess : true) &&    // P → Q where P is isAdmin
  (!isAdmin ? hasReadAccess : true)      // ¬P → Q
) { showData(); }
```

The whole tangle equals `hasReadAccess`. Five conditions collapse to one.

---

## 7. Implication — The Special Cases

Implication is so central that its variants deserve special treatment.

For a statement `P → Q`:

| Variant | Form | Equivalent? |
|---------|------|-------------|
| Original | `P → Q` | — |
| Converse | `Q → P` | NOT equivalent |
| Inverse | `¬P → ¬Q` | NOT equivalent |
| Contrapositive | `¬Q → ¬P` | **EQUIVALENT** ✓ |

**The contrapositive is logically equivalent to the original.**

This is one of the most useful facts in mathematics. If proving `P → Q` directly is hard, prove the contrapositive `¬Q → ¬P` instead. Same statement, often easier proof.

### 7.1 Worked example

Original: "If a number is divisible by 4, it is even."

- **Converse:** "If a number is even, it's divisible by 4." FALSE (6 is even but not divisible by 4).
- **Inverse:** "If a number is NOT divisible by 4, it's NOT even." FALSE (6 is not div by 4 but is even).
- **Contrapositive:** "If a number is NOT even, it's NOT divisible by 4." TRUE — and equivalent to the original.

### 7.2 Why the contrapositive is equivalent — proved by truth table

| P | Q | P → Q | ¬Q | ¬P | ¬Q → ¬P |
|---|---|-------|----|----|---------|
| T | T |   T   | F  | F  |    T    |
| T | F |   F   | T  | F  |    F    |
| F | T |   T   | F  | T  |    T    |
| F | F |   T   | T  | T  |    T    |

The 3rd and 6th columns are identical. Same truth table = equivalent formulas.

### 7.3 Common code-debugging fallacy: affirming the consequent

```javascript
if (user.isAdmin) {
  grantAccess();
}
```

Looking at access logs and seeing `grantAccess` was called, you cannot conclude `user.isAdmin` was true. That's affirming the consequent — converse, not implication.

Maybe the original code grew:

```javascript
if (user.isAdmin || user.hasOverride) {
  grantAccess();
}
```

Now the access log shows `grantAccess` calls for non-admins too. Junior debugger expects "if grantAccess was called, user is admin" — they're applying the converse. The CONTRAPOSITIVE holds: "if access was DENIED, the user was not admin AND had no override."

Senior debuggers reason via contrapositive automatically.

---

## 8. Worked Examples — Translation

The hardest part of propositional logic is **translation**: turning English into formulas (and back).

### 8.1 English → Formula

"You can graduate only if you've passed all required courses and completed your thesis."

Define:
- G = "you graduate"
- P = "you've passed all required courses"
- T = "you've completed your thesis"

Translation: `G → (P ∧ T)`

Note: "only if" reverses the direction in English-speak. "X only if Y" means "if X then Y" (Y is a necessary condition for X). Versus "if X then Y" — same logic, different English.

### 8.2 Formula → English

`(¬R ∧ ¬D) → ¬T`

where R = "it's raining," D = "it's dark," T = "I need a flashlight"

Translation: "If it's not raining and not dark, then I don't need a flashlight."

Or equivalently (by contrapositive): "If I need a flashlight, then it's raining or dark." Same meaning.

### 8.3 Tricky English phrases

| English | Translation |
|---------|-------------|
| "P only if Q" | P → Q |
| "P if Q" | Q → P |
| "P if and only if Q" | P ↔ Q |
| "Neither P nor Q" | ¬P ∧ ¬Q |
| "Not both P and Q" | ¬(P ∧ Q) = ¬P ∨ ¬Q |
| "Unless P, Q" | ¬P → Q (or equivalently P ∨ Q) |

The "unless" trap catches students. "I'll go to the park unless it rains" means "if it doesn't rain, I'll go" — `¬R → G`.

---

## Section Challenge

> A house alarm has the rule: "The siren sounds if the alarm is armed AND (a door is open OR a window is broken) AND it has been more than 30 seconds since the last 'disarm' code was entered."
>
> 1. Define propositions for each atomic condition and write the formula for "siren sounds."
> 2. The homeowner reports a false alarm: the siren went off but no door was open and no window was broken. What's the LOGICAL conclusion about the system's state?
> 3. Use De Morgan's laws to refactor the negation `¬(siren sounds)` into a form that explains "when the siren stays quiet."

<details>
<summary>Answer with full derivation</summary>

```
PART 1 — DEFINE AND TRANSLATE:

Define:
  A = "the alarm is armed"
  D = "a door is open"
  W = "a window is broken"
  R = "more than 30 seconds since last disarm code"
  S = "the siren sounds"

Formula:
  S ↔ A ∧ (D ∨ W) ∧ R

PART 2 — THE FALSE-ALARM DEDUCTION:

Observed:
  S = T (siren sounded)
  D = F (no door open)
  W = F (no window broken)

From the formula, since S = T:
  T = A ∧ (D ∨ W) ∧ R
  T = A ∧ (F ∨ F) ∧ R
  T = A ∧ F ∧ R
  T = F

CONTRADICTION! T = F is impossible.

WHAT THIS MEANS LOGICALLY:
  Our formula CANNOT explain the observed siren. The system's behavior
  doesn't match its stated rules. Possibilities:
  - The alarm sensor for door/window is BROKEN (D or W was true,
    but the sensor reported false to the alarm logic)
  - The alarm has a hidden rule we didn't model (e.g., motion sensor,
    smoke detector, manual panic button)
  - The siren circuit fired without the alarm logic asking it to
    (a hardware fault)

ENGINEER'S TAKEAWAY:
  When observed reality contradicts your model, EITHER:
  - Your model is incomplete (add the missing rule)
  - Your sensors are unreliable (add monitoring)
  - The system has a fault (debug at hardware level)
  
  Propositional logic forces you to articulate which one.

PART 3 — REFACTORING ¬(siren sounds):

  ¬S ≡ ¬(A ∧ (D ∨ W) ∧ R)

Apply De Morgan to the outer conjunction:
  ≡ ¬A ∨ ¬(D ∨ W) ∨ ¬R

Apply De Morgan to ¬(D ∨ W):
  ≡ ¬A ∨ (¬D ∧ ¬W) ∨ ¬R

REPHRASING:
  The siren stays QUIET when:
  - the alarm is NOT armed, OR
  - (no door is open AND no window is broken), OR
  - it has been LESS than 30 seconds since the last disarm code

PRACTICAL VALUE:
  The original positive formulation tells you when the siren SHOULD fire.
  The De Morgan'd negative form tells you what RESETS the alarm to silent.
  Both forms describe the same system; different forms help debug different
  scenarios.

  - Homeowner: "Why didn't the siren go off when the window broke?"
    Check: was the alarm armed? Was the disarm code recently entered?
    The negative form directly enumerates the silent conditions.

  - Burglar (hypothetical): "How do I keep the siren quiet?"
    The negative form gives them the menu: disarm the alarm, or break in
    silently AND within 30 seconds of someone's disarm code.

  Real security systems use this analysis to find ATTACK SURFACES —
  every disjunct in the silent-condition formula is a way to circumvent
  the alarm. Knowing them helps you design countermeasures (e.g., "the
  disarm-grace window is a vulnerability; shorten it").
```

</details>

---

## Practice Problems

1. Build the truth table for `(P → Q) → P`. Is it a tautology? Contradiction? Contingency?
2. Show that `P → Q ≡ ¬Q → ¬P` using a truth table.
3. Translate to logic: "I'll buy a new phone if and only if my current one breaks or a new model is announced AND my contract is up."
4. Simplify `(P ∧ Q) ∨ (P ∧ ¬Q)` using equivalences.
5. Use De Morgan to refactor: `¬((rainy ∨ snowy) ∧ ¬have_umbrella)`.

---

## Connections

- **Chapter 02 — Predicate Logic:** introduces ∀ (for all) and ∃ (exists), which extend propositional logic to statements about collections.
- **Chapter 03 — Proof Techniques:** uses propositional logic to formalize what makes an argument valid.
- **Chapter 04 — Induction:** builds on `P → Q` reasoning to prove infinite chains of facts.
- `06_OOP_Design/01_OOPS_Principles.md` — every `if/else` in code is propositional logic; understanding equivalences makes refactoring conditions trivial.
- `08_SQL/05_Queries_SELECT_WHERE.md` — `WHERE` clauses are propositional formulas with NULL adding three-valued logic.
- `03_Algorithms/A1_Correctness_Proofs.md` — loop invariants are propositional statements about program state.

---

> [Course Index](README.md) | [Next → 02 Predicate Logic & Quantifiers](02_Predicate_Logic_Quantifiers.md)
