# Chapter 02 — Predicate Logic & Quantifiers

> **Course:** CSE101 Discrete Mathematics · **Unit:** 1 (Logic & Proof) · **Week:** 2
> **Prerequisites:** [Chapter 01 — Propositional Logic](01_Propositional_Logic.md)
> **Reading time:** ~3 hours · **Lab time:** ~3 hours

---

## Why You're Here

Propositional logic gave you the ability to reason about specific true-or-false statements. But almost every interesting claim involves a COLLECTION:

- "ALL users have unique IDs" — over the collection of users
- "SOME products are out of stock" — over the collection of products
- "EVERY admin has 2FA enabled" — over the collection of admins
- "NO transaction lacks a timestamp" — over the collection of transactions

Each of these is impossible to express in propositional logic alone. You'd need infinite separate propositions: P_alice, P_bob, P_carol, ... for every user. Predicate logic compresses this into a single statement using **quantifiers**.

In code, every `for` loop, every `array.every()`, every `EXISTS` SQL clause is a quantifier in disguise. Understanding their formal structure tells you why "this database query is slow" or "this test has a flaky check."

---

## 1. Predicates — Propositions With Slots

A **predicate** is a statement with one or more "slots" that, when filled with specific values, becomes a proposition.

**Real-world analogy: a mad-libs sentence.**

> "_____ is taller than 6 feet."

By itself, this is not true or false — the slot is empty. Fill it:

- "Shaquille is taller than 6 feet." → TRUE
- "Tom Cruise is taller than 6 feet." → FALSE

The predicate gets EVALUATED into a proposition when you plug in a specific value.

In notation: we write `P(x)` where `x` is the slot. Once `x` is bound to a specific value, `P(x)` is a proposition.

```
P(x): "x is taller than 6 feet"
P(Shaq) = TRUE
P(Cruise) = FALSE
```

### Multiple slots

A predicate can have multiple slots:

```
Loves(x, y): "x loves y"
Loves(Romeo, Juliet) = TRUE
Loves(Romeo, Macbeth) = FALSE
```

Or even three or more:

```
Between(x, y, z): "x is between y and z numerically"
Between(5, 3, 8) = TRUE
Between(5, 8, 3) = TRUE (order of bounds doesn't matter)
Between(5, 10, 20) = FALSE
```

### Domain — the universe of discourse

Every predicate has a **domain**: the set of allowed values for its slots. Without a domain, predicates are meaningless.

```
P(x): "x is divisible by 2"
- Domain = integers: P(4) = T, P(7) = F
- Domain = strings: P("hello") is meaningless
```

In code, this is YOUR TYPE SYSTEM. `function isEven(n: number): boolean` declares the domain explicitly. TypeScript prevents nonsense like `isEven("hello")` by enforcing the domain.

---

## 2. The Universal Quantifier: ∀ ("for all")

`∀x. P(x)` reads "for all x, P(x) is true."

It asserts the predicate holds for **every single** element of the domain. One counterexample destroys the claim.

**Real-world analogy: an airline's safety check.**

Before takeoff, the airline asserts: "for every passenger, the seatbelt is fastened." If even ONE passenger's seatbelt is unfastened, the assertion is false. The check has to pass for ALL passengers.

In code:

```javascript
// ∀ passenger ∈ passengers, passenger.seatbelt === true
passengers.every(p => p.seatbelt === true)
```

`Array.prototype.every()` IS the universal quantifier. It returns true only when the predicate holds for every element.

### Empty domain — vacuous truth strikes again

What if the airline has NO passengers? Is "for all passengers, seatbelts are fastened" true?

Yes! Vacuously true. There are no passengers to violate the claim.

```javascript
[].every(p => false)  // returns TRUE (yes, really)
```

This trips beginners up. But it's mathematically necessary — any property "for all elements of the empty set" is trivially true because there's no element to fail.

### Translating English to ∀

| English | Predicate logic |
|---------|----------------|
| "All swans are white" | ∀x. (Swan(x) → White(x)) |
| "Every student has a backpack" | ∀x. (Student(x) → HasBackpack(x)) |
| "Every prime number greater than 2 is odd" | ∀x. ((Prime(x) ∧ x > 2) → Odd(x)) |

Note: when the predicate restricts the kind of x, we use **implication** inside. "All swans are white" doesn't mean "everything in the universe is a white swan" — it means "for everything, IF it's a swan THEN it's white."

This is a common translation mistake. ∀x. (Swan(x) ∧ White(x)) would mean "everything is a white swan" — even rocks and clouds. Wrong.

---

## 3. The Existential Quantifier: ∃ ("there exists")

`∃x. P(x)` reads "there exists x such that P(x) is true."

It asserts the predicate holds for **at least one** element. One example confirms the claim.

**Real-world analogy: a library lookup.**

"Is there a book by Tolkien in this library?" To prove yes, find ONE such book. The library doesn't need 50 Tolkien books — one is enough.

```javascript
// ∃ book ∈ books, book.author === "Tolkien"
books.some(b => b.author === "Tolkien")
```

`Array.prototype.some()` IS the existential quantifier.

### Empty domain — vacuous falsity

"There exists a passenger who is wearing a hat" — if there are NO passengers, this is FALSE. There's no x to be the witness.

```javascript
[].some(p => true)  // returns FALSE
```

This is the dual of ∀ vacuous truth.

### Translating English to ∃

| English | Predicate logic |
|---------|----------------|
| "Some students are tall" | ∃x. (Student(x) ∧ Tall(x)) |
| "There's a prime number greater than 100" | ∃x. (Prime(x) ∧ x > 100) |
| "Some triangles have a right angle" | ∃x. (Triangle(x) ∧ HasRightAngle(x)) |

Note: ∃ uses **conjunction** (∧), not implication. "Some students are tall" means "there is at least one thing that is BOTH a student AND tall." Using implication here would be vacuously true (any non-student trivially satisfies "student → tall").

This is the dual of the ∀-with-implication trap. Memorize:
- **∀** typically uses **→** (restriction by implication)
- **∃** typically uses **∧** (existence of a specific kind)

---

## 4. Nested Quantifiers — Order Matters Critically

When predicates have multiple slots, quantifiers can be nested. The ORDER of quantifiers changes the meaning DRAMATICALLY.

### 4.1 The two ways

**Statement A:** `∀x. ∃y. Loves(x, y)`
- "For every person x, there exists a person y such that x loves y."
- "Every person has someone they love."
- The "someone" can be different for each person.

**Statement B:** `∃y. ∀x. Loves(x, y)`
- "There exists a person y such that every person x loves y."
- "There is one person who is loved by everyone."
- The same y serves all x.

These mean COMPLETELY DIFFERENT things.

**Real-world analogy: lockers and keys.**

- "Every locker has a key" (∀ locker. ∃ key. Opens(key, locker)): the keys can be different for each locker. Normal.
- "There is one key that opens every locker" (∃ key. ∀ locker. Opens(key, locker)): a master key. Much stronger statement.

### 4.2 The general rule

`∀x.∃y. P(x,y)` ≠ `∃y.∀x. P(x,y)` in general.

`∀x.∀y. P(x,y)` IS equivalent to `∀y.∀x. P(x,y)` — same-type quantifiers commute.

`∃x.∃y. P(x,y)` IS equivalent to `∃y.∃x. P(x,y)` — same-type quantifiers commute.

But MIXED quantifiers (∀ followed by ∃, vs. ∃ followed by ∀) DO NOT commute.

### 4.3 The "for every ε > 0" trick from calculus

You've probably seen calculus definitions like:

> "lim(x→a) f(x) = L means: for every ε > 0, there exists δ > 0 such that ..."
>
> Formally: ∀ε > 0. ∃δ > 0. (|x - a| < δ → |f(x) - L| < ε)

The order is critical. Read it as:

> "Pick any tolerance ε you want. I (the function) promise that I can find a δ (which can depend on your choice of ε) that works."

If we swapped: ∃δ > 0. ∀ε > 0. (...). This would say:

> "There's one δ that works for every ε you might pick."

That's a uniform limit — a much stronger condition, true for "well-behaved" functions but not arbitrary ones.

The δ-ε definition has a specific order BECAUSE the order matters.

### 4.4 In code: the difference

Statement A — `∀ user. ∃ role. HasRole(user, role)`:
```javascript
users.every(u => roles.some(r => userHasRole(u, r)))
// "Every user has at least one role" (roles can differ per user)
```

Statement B — `∃ role. ∀ user. HasRole(user, role)`:
```javascript
roles.some(r => users.every(u => userHasRole(u, r)))
// "There is at least one role that ALL users have" (single common role)
```

In a SaaS app, Statement A asserts "every user has at least some role." Statement B asserts "there's a universal role (maybe `member`?) that every user has." Wildly different business meanings.

---

## 5. Negation of Quantifiers — De Morgan Extended

How do you express "NOT all" or "NOT some"?

### 5.1 The two laws

```
¬(∀x. P(x))  ≡  ∃x. ¬P(x)
¬(∃x. P(x))  ≡  ∀x. ¬P(x)
```

**Translation:**

- "Not all swans are white" = "There exists a swan that is not white" (find ONE black swan to disprove).
- "There does NOT exist a unicorn" = "For all things, it is not a unicorn."

**Real-world analogy: refuting a sweeping claim.**

Claim: "All your customer support tickets are resolved within 24 hours." (∀ ticket. ResolvedIn24h(ticket))

To refute, you don't have to show that NONE are resolved in 24 hours. You just need ONE example of a ticket that wasn't. That single counterexample disproves the ∀.

### 5.2 Pushing negation through nested quantifiers

To negate complex formulas, push the ¬ inward, flipping ∀ ↔ ∃ each time it crosses a quantifier:

```
¬(∀x. ∃y. P(x,y))
≡ ∃x. ¬(∃y. P(x,y))      ← flipped outer ∀ to ∃
≡ ∃x. ∀y. ¬P(x,y)         ← flipped inner ∃ to ∀
```

**Example:** Negate "every user has at least one valid session."

Original: `∀u. ∃s. (Session(s) ∧ ValidFor(s, u))`

Negation:
```
¬(∀u. ∃s. (Session(s) ∧ ValidFor(s, u)))
≡ ∃u. ¬(∃s. (Session(s) ∧ ValidFor(s, u)))
≡ ∃u. ∀s. ¬(Session(s) ∧ ValidFor(s, u))
≡ ∃u. ∀s. (¬Session(s) ∨ ¬ValidFor(s, u))
```

Reading the negation: "There exists a user u such that, for every session s, either s is not a session (vacuously useful) or s is not valid for u."

In plain English: "There's at least one user with no valid session." Compact, clear.

### 5.3 Why this matters in tests

Consider this test assertion:

```javascript
// Assert: every order has a payment
orders.every(o => o.payment !== null)
```

When this test FAILS, what does that mean?

By De Morgan, `¬(∀o. P(o))` ≡ `∃o. ¬P(o)`. So the failure means **at least one order has no payment**.

Good test frameworks tell you WHICH order. The single counterexample is the actionable bug. A test that only says "some assertion failed" without identifying the specific element is doing extra work to be unhelpful.

---

## 6. Bound vs Free Variables

In `∀x. P(x, y)`:
- `x` is **bound** by the quantifier ∀
- `y` is **free** (not under any quantifier in this formula)

A formula with free variables is not yet a proposition — it depends on what `y` is assigned to.

**Code analogy: function parameters vs. enclosing variables.**

```javascript
function check(y) {
  return arr.every(x => x > y);  // x is "bound" by the inner function; y is "free" relative to it
}
```

`y` is a free variable inside `arr.every(x => x > y)` — its meaning depends on what `check` was called with. `x` is bound — it iterates over `arr`.

**Why this matters:** When you `∀x. P(x)`, you can't claim anything specific about that x outside the formula. The x exists only INSIDE the quantifier's scope.

```
∀x. (x > 0 → x² > 0)     ← valid; x is bound
```

vs

```
P(x)                       ← x is free; whether P(x) is true depends on assignment
```

In computer science, this is the difference between a function definition (parameters bound to specific args at call time) and a function expression (parameters free at definition).

---

## 7. Putting It Together — Domain Restrictions

Real predicates typically restrict the type of x:

> "Every PRIME NUMBER greater than 2 is odd."

We don't mean "every x in the universe (including cows and colors) is odd" — we mean among PRIME NUMBERS > 2, all are odd.

Two ways to encode this:

**Way 1 (restricted domain notation):**
```
∀x ∈ {primes > 2}. Odd(x)
```

**Way 2 (full domain with predicate):**
```
∀x. ((Prime(x) ∧ x > 2) → Odd(x))
```

Way 2 is more rigorous because it uses the universal domain (all numbers, or all "things") and uses an implication to restrict. This is what mathematicians prefer for proofs.

**Existential mirror:**

"Some students are taller than 6 feet" — among STUDENTS.

Way 1: `∃x ∈ Students. Taller(x, 6ft)`
Way 2: `∃x. (Student(x) ∧ Taller(x, 6ft))`

For ∃, we use ∧ (conjunction). NOT implication.

```
∃x. (Student(x) → Tall(x))     ← WRONG! Vacuously true (any non-student satisfies this)
∃x. (Student(x) ∧ Tall(x))     ← RIGHT! Asserts existence of a thing that IS BOTH a student AND tall
```

The "∀-with-→ / ∃-with-∧" pattern is one of the most-asked questions on logic exams. Internalize it.

---

## Section Challenge

> Three real-world claims are given. For each:
>
> 1. Translate to predicate logic using clear definitions
> 2. Compute the formal negation
> 3. State the negation in plain English (this is what a counterexample looks like)
>
> Claims:
> (a) "Every employee has a unique badge number."
> (b) "There is a manager who supervises every junior engineer."
> (c) "For every meeting, at least one attendee took notes."

<details>
<summary>Answer with full derivation for each</summary>

```
═══════════════════════════════════════════════════════════
(a) "Every employee has a unique badge number"

DEFINITIONS:
  E(x) = "x is an employee"
  B(x, n) = "x's badge number is n"
  Domain: people for x, integers for n

TRANSLATION:
  ∀x. ∀y. ((E(x) ∧ E(y) ∧ x ≠ y) → ∀n. ¬(B(x, n) ∧ B(y, n)))

  Reading: "For every pair of distinct employees x and y, there is no
            badge number n that they both have."

  More compact: ∀x. ∀y. ((E(x) ∧ E(y) ∧ x ≠ y) → BadgeOf(x) ≠ BadgeOf(y))

NEGATION:
  ¬(∀x. ∀y. ((E(x) ∧ E(y) ∧ x ≠ y) → BadgeOf(x) ≠ BadgeOf(y)))
  ≡ ∃x. ∃y. ((E(x) ∧ E(y) ∧ x ≠ y) ∧ BadgeOf(x) = BadgeOf(y))

PLAIN ENGLISH:
  "There exist two distinct employees with the same badge number."

  That's a single concrete counterexample — Alice and Bob both have badge 4321.
  ONE such collision invalidates the uniqueness claim.

═══════════════════════════════════════════════════════════
(b) "There is a manager who supervises every junior engineer"

DEFINITIONS:
  M(x) = "x is a manager"
  J(x) = "x is a junior engineer"
  S(x, y) = "x supervises y"

TRANSLATION:
  ∃m. (M(m) ∧ ∀j. (J(j) → S(m, j)))

  Reading: "There exists an m, m is a manager, and for every j, if j is a
            junior engineer then m supervises j."

NEGATION:
  ¬(∃m. (M(m) ∧ ∀j. (J(j) → S(m, j))))
  ≡ ∀m. ¬(M(m) ∧ ∀j. (J(j) → S(m, j)))
  ≡ ∀m. (¬M(m) ∨ ¬(∀j. (J(j) → S(m, j))))
  ≡ ∀m. (¬M(m) ∨ ∃j. ¬(J(j) → S(m, j)))
  ≡ ∀m. (¬M(m) ∨ ∃j. (J(j) ∧ ¬S(m, j)))

PLAIN ENGLISH:
  "For every manager m, there exists a junior engineer j that m does not
   supervise." (or m is not a manager, which is vacuously fine)

  More naturally: "Every manager misses at least one junior engineer."
  
  Counterexample structure: for each candidate manager, show ONE junior
  they don't supervise. That's how you'd prove the claim is false in
  practice.

═══════════════════════════════════════════════════════════
(c) "For every meeting, at least one attendee took notes"

DEFINITIONS:
  Meeting(x) = "x is a meeting"
  Attended(p, x) = "person p attended meeting x"
  TookNotes(p, x) = "person p took notes in meeting x"

TRANSLATION:
  ∀x. (Meeting(x) → ∃p. (Attended(p, x) ∧ TookNotes(p, x)))

NEGATION:
  ¬(∀x. (Meeting(x) → ∃p. (Attended(p, x) ∧ TookNotes(p, x))))
  ≡ ∃x. ¬(Meeting(x) → ∃p. (Attended(p, x) ∧ TookNotes(p, x)))
  ≡ ∃x. (Meeting(x) ∧ ¬(∃p. (Attended(p, x) ∧ TookNotes(p, x))))
  ≡ ∃x. (Meeting(x) ∧ ∀p. ¬(Attended(p, x) ∧ TookNotes(p, x)))
  ≡ ∃x. (Meeting(x) ∧ ∀p. (¬Attended(p, x) ∨ ¬TookNotes(p, x)))

PLAIN ENGLISH:
  "There exists a meeting x such that, for every person p, either p didn't
   attend the meeting OR p didn't take notes."

  Cleaner: "There is at least one meeting where NO attendee took notes."

  Counterexample: Meeting 2026-06-15 at 10 a.m. Six people attended; none
  of them wrote anything down. ONE meeting suffices to refute the claim.

═══════════════════════════════════════════════════════════

THE META-LESSON:

Negating ∀ → ∃, and ∃ → ∀, with negation pushed inward.
The negation always reveals the SHAPE of a counterexample.
This is why, in practice, a falsifiable claim is one whose negation
gives you a clear "find me one such thing" instruction.

If your test assertion is `∀x. P(x)`, your counterexample is `∃x. ¬P(x)`
— one bad x. Tests that report "some element failed" without identifying
WHICH element are not exposing the counterexample structure to you.

Senior debuggers always ask: "what does ONE counterexample look like?"
That question is the negation reflex.
```

</details>

---

## Practice Problems

1. Translate to predicate logic: "Every cat in the shelter has been vaccinated."
2. Translate the negation of "Some software has bugs" into plain English without using "not" or "some."
3. State which is stronger: ∀x.∃y. Loves(x, y) or ∃y.∀x. Loves(x, y). Why?
4. Negate `∀ε > 0. ∃δ > 0. (|x - a| < δ → |f(x) - L| < ε)`. What does the negation mean about non-continuous functions?
5. In SQL terms, what's the difference between `WHERE EXISTS (SELECT ...)` and `WHERE NOT EXISTS (SELECT ...)`? Which quantifier is each?

---

## Connections

- **Chapter 03 — Proof Techniques:** quantifier elimination is the heart of constructive proofs.
- **Chapter 04 — Induction:** strong induction is `∀n. (P(n) → P(n+1))` — a universally-quantified implication.
- `08_SQL/05_Queries_SELECT_WHERE.md` — `EXISTS` is ∃; `NOT EXISTS ALL` is essentially ∀.
- `17_TypeScript/02_TS_Advanced_Types.md` — TypeScript's `extends` constraint is universal quantification over the type domain.
- `03_Algorithms/A1_Correctness_Proofs.md` — loop invariant proofs use ∀ extensively.

---

> [< Previous: 01 Propositional Logic](01_Propositional_Logic.md) | [Course Index](README.md) | [Next → 03 Proof Techniques](03_Proof_Techniques.md)
