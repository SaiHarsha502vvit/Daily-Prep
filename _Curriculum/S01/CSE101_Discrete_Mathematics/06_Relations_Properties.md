# Chapter 06 — Relations & Properties

> [< Previous: 05 Sets & Operations](05_Sets_Operations.md) | [Course Index](README.md) | [Next → 07 Functions & Properties](07_Functions_Properties.md)

---

## The Problem Relations Solve

You know from Chapter 05 that a Cartesian product A × B gives you all possible ordered pairs. But in practice, **most pairs don't have a meaningful connection**.

Consider employees and projects. A × B would give you every (employee, project) combination — hundreds of pairings. The *actual* assignments are a small subset: only the pairs where the employee IS on that project.

A **relation** is that subset. It says: among all possible connections, these specific ones exist.

This isn't abstract. You use relations constantly:
- "User X follows user Y" — a relation on users
- "Table A references table B" — a foreign key relation on tables
- "File A imports file B" — a dependency relation on files
- "n ≤ m" — a relation on integers
- "String s₁ comes before s₂ alphabetically" — a relation on strings

Every database foreign key, every graph edge, every ordering you've ever used is a mathematical relation.

---

## Definition: Binary Relation

A **binary relation R on set A** is a subset of A × A.

We write **a R b** (or (a, b) ∈ R) to say "a is related to b."

```
A = {Alice, Bob, Carol, Dave}

"is manager of" relation:
R = { (Alice, Bob), (Alice, Carol), (Bob, Dave) }

Alice R Bob  ✓ (Alice manages Bob)
Bob R Alice  ✗ (Bob does not manage Alice)
```

A relation is simply a **set of ordered pairs**. No functions, no algorithms — just a collection of "a relates to b" facts.

### Directed Graph View

Every relation corresponds to a directed graph: elements are vertices, pairs are directed edges.

```
Alice ──→ Bob
  │         │
  └──→ Carol  └──→ Dave
```

Properties of the relation become visible graph properties. This duality is why graph algorithms and relation theory end up in the same textbook.

---

## The Four Key Properties

Each property is a constraint on which pairs the relation contains. Properties can combine — a relation can have multiple properties at once.

---

### Property 1: Reflexive — "Every element relates to itself"

**Formal:** R is reflexive if ∀a ∈ A. a R a

The relation must contain all "self-pairs": (a, a) for every element a.

**Analogy:** Every file has *itself* as a dependency-or-equal relationship. Every integer is ≤ itself. Every person knows themselves.

**Directed graph signature:** Every vertex has a **self-loop**.

```
REFLEXIVE examples on {1, 2, 3}:
  ≤ relation:  {(1,1), (1,2), (1,3), (2,2), (2,3), (3,3)} — has (1,1),(2,2),(3,3) ✓
  = relation:  {(1,1), (2,2), (3,3)} — has all self-pairs ✓

NOT REFLEXIVE:
  < relation:  {(1,2), (1,3), (2,3)} — missing (1,1),(2,2),(3,3) ✗
  "is parent of": a person is not their own parent ✗
```

**Irreflexive:** R is irreflexive if ∀a ∈ A. (a, a) ∉ R — NO self-pairs. (`<` is irreflexive.)

---

### Property 2: Symmetric — "If a relates to b, then b relates to a"

**Formal:** R is symmetric if ∀a,b ∈ A. a R b → b R a

**Analogy:** Friendship. If Alice is friends with Bob, Bob is friends with Alice. Every edge is bidirectional.

**Directed graph signature:** Whenever there's an edge a → b, there's also b → a. Equivalently, every directed edge can be replaced by an undirected edge.

```
SYMMETRIC:
  "is a sibling of": Alice sibling Bob → Bob sibling Alice ✓
  "is the same age as": reflexive too, actually an equivalence relation ✓

NOT SYMMETRIC:
  "is manager of": Alice manages Bob ≠ Bob manages Alice ✗
  ≤ on integers: 1 ≤ 2 but 2 ≰ 1 ✗
```

---

### Property 3: Antisymmetric — "If a relates to b AND b relates to a, they must be equal"

**Formal:** R is antisymmetric if ∀a,b ∈ A. (a R b ∧ b R a) → a = b

**Common misread:** Antisymmetric does NOT mean "a R b implies b does NOT R a." It just says: if BOTH directions hold, the two elements must be identical. You can have (a, b) and (b, a) only when a = b.

**Analogy:** File dependency ordering. If package A depends on package B and package B depends on package A, they're effectively the same package (circular dependency makes them a single unit). The ordering is well-defined between distinct packages.

**Directed graph signature:** No 2-cycles between distinct vertices. Self-loops are allowed.

```
ANTISYMMETRIC:
  ≤ on integers: if a ≤ b AND b ≤ a, then a = b ✓ (classic antisymmetry)
  "is ancestor of": A ancestor B and B ancestor A ⟹ A = B (a person is their own ancestor by convention) ✓
  "is a subset of" (⊆): A ⊆ B and B ⊆ A implies A = B ✓

NOT ANTISYMMETRIC:
  "is a sibling of": Alice sibling Bob AND Bob sibling Alice, but Alice ≠ Bob ✗
```

**Symmetric vs Antisymmetric:** A relation can be BOTH (if the only related pairs are self-pairs, i.e., a R b implies a = b). It can also be neither (e.g., "is a colleague of" when Alice and Bob are colleagues but are not the same person and we also know Bob and Alice are colleagues).

---

### Property 4: Transitive — "If a relates to b and b relates to c, then a relates to c"

**Formal:** R is transitive if ∀a,b,c ∈ A. (a R b ∧ b R c) → a R c

**Analogy:** "Can reach" in a network. If router A can reach router B, and B can reach router C, then A can reach router C. Connectivity is transitive.

**Directed graph signature:** Whenever there's a path of length 2 (a → b → c), there's a direct edge (a → c). A transitive relation contains ALL shortcut edges.

```
TRANSITIVE:
  ≤ on integers: 1 ≤ 2 and 2 ≤ 3, so 1 ≤ 3 ✓
  "is ancestor of": A ancestor B and B ancestor C implies A ancestor C ✓
  "is a subset of": A ⊆ B and B ⊆ C implies A ⊆ C ✓

NOT TRANSITIVE:
  "is a direct parent of": A parent B and B parent C, but A is not the direct parent of C ✗
  "is friends with" on social networks: Alice-Bob and Bob-Carol does NOT imply Alice-Carol ✗
```

**Transitive closure:** Given any relation R, you can compute its transitive closure R⁺ — the smallest transitive relation containing R. This is what `git log --ancestry-path` computes: all commits reachable from a starting commit.

---

## Combining Properties: The Big Three Structures

Properties rarely stand alone. Their combinations create the structures you'll use everywhere.

---

### Equivalence Relation = Reflexive + Symmetric + Transitive

**Intuition:** An equivalence relation divides the set into "same bucket" groups. All elements in a bucket are interchangeable with respect to the property.

**Classic examples:**
- "Has the same birthday as" on people (same month/day)
- "Has the same remainder when divided by 7" on integers (modular arithmetic)
- "Is the same type as" in a type system
- `equals()` in Java

```
"Same graduating year" on students:
  - Reflexive: a student graduated in the same year as themselves ✓
  - Symmetric: if A and B graduated same year, so did B and A ✓
  - Transitive: if A and B same year, and B and C same year, then A and C same year ✓

This divides students into graduating-year classes: {2022 class}, {2023 class}, ...
```

#### Equivalence Classes

An equivalence relation R on A partitions A into **equivalence classes** — groups where every pair of elements is related.

The equivalence class of element a: **[a] = { x ∈ A | x R a }**

**Key theorem:** Equivalence classes are either identical or completely disjoint. They partition A perfectly — every element is in exactly one class.

```
A = {0, 1, 2, 3, 4, 5, 6}
R = "same remainder mod 3"

[0] = {0, 3, 6}   (remainder 0)
[1] = {1, 4}      (remainder 1)
[2] = {2, 5}      (remainder 2)

These three classes cover all of A and share no elements. ✓
```

**Quotient set A/R:** The set of all equivalence classes. Here: A/R = { {0,3,6}, {1,4}, {2,5} } — three "buckets."

---

#### Why Java's equals() Contract Is an Equivalence Relation

Java's Object.equals() contract requires:
1. **Reflexive:** `x.equals(x)` is true.
2. **Symmetric:** `x.equals(y)` implies `y.equals(x)`.
3. **Transitive:** if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`.

These are *exactly* the three equivalence relation axioms.

**Why does HashMap break if you violate these?**

HashMap uses `equals()` + `hashCode()` to find buckets. If transitivity fails — say x.equals(y) and y.equals(z) but NOT x.equals(z) — then:
- Inserting x puts it in x's bucket.
- Checking "does z exist?" hashes z to z's bucket.
- But z would be found in a different bucket than x, even though logically z ≡ x.

Result: `map.containsKey(z)` returns false even though you added z. Silent data corruption.

```java
// BROKEN equals() — not transitive
class BadInt {
    int v;
    @Override
    public boolean equals(Object o) {
        if (o instanceof BadInt b) {
            return Math.abs(this.v - b.v) <= 1;  // "close enough"
        }
        return false;
    }
}
// BadInt(1).equals(BadInt(2)) = true
// BadInt(2).equals(BadInt(3)) = true
// BadInt(1).equals(BadInt(3)) = false  ← transitivity VIOLATED
// HashMap will misbehave
```

The fix is always: make equals() define a proper equivalence relation.

---

### Partial Order = Reflexive + Antisymmetric + Transitive

A **partial order** is a way of ranking elements where:
- Every element is ≥ itself (reflexive).
- No two distinct elements are both ≥ each other (antisymmetric).
- Rankings chain (transitive).

"Partial" because not all pairs need to be comparable. Some elements may be **incomparable** — neither a ≤ b nor b ≤ a.

**Classic examples:**
- ≤ on numbers (total order — all pairs comparable)
- ⊆ on sets (partial order — {1} and {2} are incomparable subsets of {1,2})
- "File A must compile before File B" in a build system
- CSS specificity: `#id` > `.class` > `tag`, but `#id.class` and `#id` are sometimes incomparable

```
Build dependency order on {A, B, C, D}:
  A must compile before B  → A ≤ B
  A must compile before C  → A ≤ C
  B must compile before D  → B ≤ D

Derived by transitivity: A ≤ D (A before B before D)
Are B and C comparable? No — neither depends on the other. INCOMPARABLE.
```

A **total order** is a partial order where every pair IS comparable. Most sorting algorithms require a total order.

**Hasse diagram:** The standard drawing of a partial order — draw elements as nodes, edges go upward for direct ordering relationships, omit transitive shortcuts (they're implied by path).

---

## Quick Reference: Spotting Properties

| Property | Key test | Quick example |
|----------|----------|---------------|
| Reflexive | Matrix diagonal is all 1s | ≤ on ℤ |
| Irreflexive | Matrix diagonal is all 0s | < on ℤ |
| Symmetric | Matrix = its own transpose | "is a sibling of" |
| Antisymmetric | No off-diagonal pair (a,b) AND (b,a) | ≤ on ℤ |
| Transitive | For every path a→b→c, edge a→c exists | "is ancestor of" |

---

## Relations in Code — Concrete Mappings

**`Comparable<T>` (Java) — defines a partial or total order**
```java
// TreeSet requires Comparable or a Comparator
// The ordering must be antisymmetric + transitive (+ consistent with equals for correctness)
class Employee implements Comparable<Employee> {
    @Override
    public int compareTo(Employee other) {
        return this.salary - other.salary;  // partial order by salary
    }
}
```

**TypeScript: checking for equivalence relation properties**
```typescript
// Type-level: a relation on T is a function (a: T, b: T) => boolean
type Relation<T> = (a: T, b: T) => boolean;

function isReflexive<T>(r: Relation<T>, elements: T[]): boolean {
    return elements.every(a => r(a, a));
}

function isSymmetric<T>(r: Relation<T>, pairs: [T,T][]): boolean {
    return pairs.every(([a, b]) => r(a, b) === r(b, a));
}

// Usage:
const sameLength: Relation<string> = (a, b) => a.length === b.length;
// Reflexive: "abc".length === "abc".length ✓
// Symmetric: if |a|=|b| then |b|=|a| ✓
// Transitive: if |a|=|b|=|c|, then |a|=|c| ✓
// → sameLength is an equivalence relation ✓
```

**Database: foreign key as a relation**
```sql
-- order_items RELATES to orders (many order_items to one order)
-- This is a function-like relation (many-to-one)
ALTER TABLE order_items
    ADD CONSTRAINT fk_order
    FOREIGN KEY (order_id) REFERENCES orders(id);

-- The FK constraint enforces: every (order_item, order) pair in the relation
-- must have a real order in orders. Referential integrity = closure of the relation.
```

---

## Section Challenge

> ### Is This a Valid Comparator?
>
> A junior engineer writes this `Comparator` for sorting `Task` objects:
>
> ```java
> Comparator<Task> byPriority = (t1, t2) -> {
>     if (t1.priority == Priority.HIGH && t2.priority != Priority.HIGH) return -1;
>     if (t1.priority == Priority.MEDIUM && t2.priority == Priority.LOW) return -1;
>     return 0;
> };
> ```
>
> `Priority` has three values: `HIGH`, `MEDIUM`, `LOW`.
>
> **Question 1:** List all pairs where `byPriority.compare(a, b) < 0` (a comes before b).
>
> **Question 2:** Check if this comparator defines a valid partial order: is it reflexive, antisymmetric, and transitive?
>
> **Question 3:** A `TreeSet<Task>` uses this comparator. What goes wrong, and why?
>
> **Question 4:** Fix the comparator so it defines a total order consistent with HIGH > MEDIUM > LOW.

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Pairs where compare(a,b) < 0 (a before b):

Case 1: t1=HIGH, t2=MEDIUM → -1 (HIGH < MEDIUM in sort = HIGH first) ✓
Case 2: t1=HIGH, t2=LOW    → -1 ✓
Case 3: t1=MEDIUM, t2=LOW  → -1 ✓
All other cases: 0

──────────────────────────────────────────────────────────

QUESTION 2: Is this a valid partial order?

REFLEXIVE: compare(a, a) should equal 0 (a is not before itself).
  compare(HIGH, HIGH): t1=HIGH, but t2=HIGH too → "t2.priority != HIGH" is false
    → falls to the second if: t1=HIGH ≠ MEDIUM → second if fails → return 0 ✓
  compare(MEDIUM, MEDIUM): t1≠HIGH, t1=MEDIUM, t2=MEDIUM (not LOW) → return 0 ✓
  compare(LOW, LOW): returns 0 ✓
  REFLEXIVE ✓

ANTISYMMETRIC: if compare(a,b) ≤ 0 and compare(b,a) ≤ 0, then a = b.
  Test: compare(HIGH, MEDIUM) = -1, compare(MEDIUM, HIGH) = ?
    t1=MEDIUM, t2=HIGH → t1 is not HIGH, t1=MEDIUM but t2=HIGH (not LOW) → return 0
  So compare(HIGH, MEDIUM) = -1 < 0, compare(MEDIUM, HIGH) = 0 ≤ 0.
  Both are ≤ 0, but HIGH ≠ MEDIUM. ANTISYMMETRIC VIOLATED ✗

Wait — for antisymmetry in comparators, the condition is:
  compare(a,b) ≤ 0 AND compare(b,a) ≤ 0 implies a equals b.
  
  If compare(a,b) = -1 and compare(b,a) = 0:
  Both ≤ 0. But a ≠ b. → ANTISYMMETRIC FAILS.
  
  The comparator says HIGH comes before MEDIUM, but NOT that MEDIUM comes after HIGH.
  Asymmetry is broken.

TRANSITIVE: if compare(a,b) ≤ 0 and compare(b,c) ≤ 0, then compare(a,c) ≤ 0.
  This might hold here since HIGH < MEDIUM < LOW in the only non-zero cases.
  But given antisymmetry already fails, transitivity cannot save the comparator.

VERDICT: NOT a valid ordering. Antisymmetry is violated.

──────────────────────────────────────────────────────────

QUESTION 3: What goes wrong in TreeSet?

TreeSet uses the comparator to:
  1. Place elements in the tree (navigation: go left/right based on compare)
  2. Check equality: compare(a,b) == 0 means a and b are the SAME element
     → TreeSet will NOT store both if compare returns 0

The bug: compare(MEDIUM, HIGH) = 0, so TreeSet treats MEDIUM and HIGH as
the SAME element. If you insert a HIGH task and then a MEDIUM task, the MEDIUM
task is SILENTLY DROPPED (TreeSet thinks it already has an equal element).

Result: some tasks are silently lost from the set. No error, no warning.

This is the real-world consequence of violating the equivalence/order contract.

──────────────────────────────────────────────────────────

QUESTION 4: Fixed comparator

The fix: map priorities to integers and use subtraction (or Integer.compare).

Option 1 — integer mapping:
  int rank(Priority p) {
      return switch (p) {
          case HIGH   -> 2;
          case MEDIUM -> 1;
          case LOW    -> 0;
      };
  }
  
  Comparator<Task> byPriority = (t1, t2) ->
      Integer.compare(rank(t2.priority), rank(t1.priority));
      // t2-t1 order: HIGH(2) first, LOW(0) last

  Check:
  - compare(HIGH, HIGH)  = compare(2, 2) = 0 ✓
  - compare(HIGH, MEDIUM) = compare(2, 1) → rank(MEDIUM)-rank(HIGH) = 1-2 = -1 ✓
  - compare(MEDIUM, HIGH) = compare(1, 2) → 2-1 = 1 > 0 (MEDIUM after HIGH) ✓
  - Antisymmetric: compare(a,b) = -compare(b,a) → if both ≤ 0 then both = 0 ✓
  - Transitive: integer subtraction is transitive ✓
  - Total: every pair compares to -1, 0, or 1 (never stuck at 0 for different priorities) ✓

  VALID TOTAL ORDER ✓

──────────────────────────────────────────────────────────

THE GENERAL LESSON:

  A comparator defines a total order. A total order must satisfy:
    - Reflexive: compare(a,a) = 0
    - Antisymmetric: compare(a,b) = -compare(b,a) for all a,b
    - Transitive: if compare(a,b) ≤ 0 and compare(b,c) ≤ 0 then compare(a,c) ≤ 0
    - Total: compare(a,b) is always defined (< 0, 0, or > 0)
  
  If any is violated:
    - TreeSet loses elements silently
    - Collections.sort() produces unpredictable output
    - PriorityQueue returns wrong priority
  
  The math isn't academic. It's the CONTRACT that makes every Java sorted
  collection work correctly. Every senior engineer has debugged this bug once.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing antisymmetric with asymmetric**
- **Antisymmetric:** (a R b ∧ b R a) → a = b. Self-pairs (a R a) are allowed.
- **Asymmetric:** a R b → NOT (b R a). Self-pairs are FORBIDDEN. (Asymmetric implies irreflexive.)
- `≤` is antisymmetric but NOT asymmetric (1 ≤ 1 is valid). `<` is asymmetric.

**Mistake 2: Thinking "symmetric" and "antisymmetric" are opposites**
- A relation on a single element `{(a,a)}` is BOTH symmetric AND antisymmetric.
- A relation with (a,b) and (b,a) for a ≠ b is symmetric but NOT antisymmetric.
- A relation with only (a,b) and not (b,a) for a ≠ b is antisymmetric but NOT symmetric.
- A relation with (a,b), (b,a), and (a,c) for distinct a,b,c is NEITHER.

**Mistake 3: Forgetting to check ALL pairs for transitivity**
- Transitivity requires checking EVERY possible triple (a, b, c). Missing one triple means the property fails.
- For small relations on {1,2,3}: there are 3³ = 27 triples to check (most are trivially fine when the pair isn't in the relation, but all must be considered).

**Mistake 4: Assuming "partial" order means "incomplete" or "broken"**
- "Partial" means some pairs may be incomparable — it's not a defect. Dependency graphs, feature hierarchies, and subset ordering are all partial orders.

---

## Connections

- **Chapter 05 — Sets:** A relation R on A is a subset of A × A. Operations on relations (intersection, union, composition) are just set operations on these subsets.
- **Chapter 07 — Functions:** A function f : A → B is a special relation — a subset of A × B where every element of A appears as a left-element exactly once.
- **Chapter 11 — Graph Theory:** Every binary relation corresponds to a directed graph. Reflexive = self-loops on all vertices. Symmetric = every edge is bidirectional. Transitive = transitive closure of the graph. Graph algorithms compute properties of relations.
- `08_SQL/03_DataModeling_Schema.md` — Normalization theory is built on functional dependencies, which are a specific type of relation between attribute sets.
- `02_Data_Structures/` — BSTs impose a total order on keys (antisymmetric + transitive + total). Heaps impose a partial order. Understanding these as relations clarifies why BST correctness proofs look like order proofs.
- `06_OOP_Design/` — Liskov Substitution Principle is about a subtype relation being a partial order: S is a subtype of T means "everywhere T is expected, S works." Reflexive (S subtypes itself), antisymmetric (S subtypes T and T subtypes S implies S = T), transitive (chains up the inheritance tree).

---

> [< Previous: 05 Sets & Operations](05_Sets_Operations.md) | [Course Index](README.md) | [Next → 07 Functions & Properties](07_Functions_Properties.md)
