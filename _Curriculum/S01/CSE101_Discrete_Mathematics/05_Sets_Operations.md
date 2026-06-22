# Chapter 05 — Sets & Operations

> [< Previous: 04 Induction Variants](04_Induction_Variants.md) | [Course Index](README.md) | [Next → 06 Relations & Properties](06_Relations_Properties.md)

---

## The Problem Sets Solve

Suppose you're writing a permissions system. A user has roles: `{admin, editor}`. Another user has roles: `{editor, viewer}`.

Questions you immediately need to answer:
- Who has access to edit? (Anyone in `{admin, editor}` **or** `{editor, viewer}`?)
- Who needs the "both roles" warning? (Roles in **both** lists?)
- What roles does user 1 have that user 2 doesn't?
- Can I enumerate all possible 2-role combinations a user could have?

You're already thinking in sets. You just don't have the notation to make these questions *fast to reason about*. Set theory gives you that notation plus a complete algebra: a set of laws as reliable as arithmetic.

---

## The Formal Definition

A **set** is an unordered collection of distinct objects. Two things:
1. **Unordered** — `{1, 2, 3}` and `{3, 1, 2}` are the same set.
2. **Distinct** — `{1, 1, 2}` is not a valid set; it collapses to `{1, 2}`.

(When you need order: use a sequence/list. When you need duplicates: use a multiset/bag. Sets are the sharp-edged version — none of that.)

The **objects** in a set are called **elements** or **members**.

### Notation

| Symbol | Meaning | Example |
|--------|---------|---------|
| `a ∈ A` | *a* is in set A | `3 ∈ {1, 2, 3}` ✓ |
| `a ∉ A` | *a* is NOT in A | `5 ∉ {1, 2, 3}` ✓ |
| `∅` | The empty set | `{}` — zero elements |
| `\|A\|` | Cardinality — the count of elements | `\|{1, 2, 3}\|` = 3 |

### Set-Builder Notation

Instead of listing elements, describe the rule:

```
{ x | x is an integer and x² < 10 }
```

Reads: "the set of all x such that x is an integer and x² < 10."  
Result: `{-3, -2, -1, 0, 1, 2, 3}`.

In SQL you already write this: `SELECT x FROM ints WHERE x*x < 10` is set-builder notation in disguise.

---

## Equality: Two Sets Are Equal Exactly When They Have the Same Elements

**Formal definition:**  
A = B if and only if ∀x. (x ∈ A ↔ x ∈ B)

That's it. Not same size, not same "appearance" — same **membership test** for every possible element.

Consequence: `{1, 2, 3} = {3, 1, 2} = {1, 1, 2, 3}` (duplicates collapse).

**Why this matters in code:**  
Java's `HashSet.equals()` does exactly this: two HashSets are equal iff they contain exactly the same elements, regardless of insertion order or capacity.

---

## Subsets: "Every Member of A Is Also a Member of B"

**A ⊆ B** ("A is a subset of B"): ∀x. x ∈ A → x ∈ B

Think of it as **containment** — A is a sub-region of B.

```
Roles of junior dev:    A = {viewer, commenter}
Roles of senior dev:    B = {viewer, commenter, editor, admin}

A ⊆ B? Check every element of A:
  viewer ∈ B?    ✓
  commenter ∈ B? ✓
All pass → A ⊆ B  (junior's permissions are a subset of senior's)
```

**Proper subset A ⊊ B:** A ⊆ B AND A ≠ B. (A is strictly smaller.)

**Key facts:**
- ∅ ⊆ A for ANY set A. (Vacuously true — there are no elements to fail the test.)
- A ⊆ A for any A. (Every element of A is in A.)
- **Proof technique:** To prove A ⊆ B, take an arbitrary x ∈ A and show x ∈ B. That's it.

---

## The Four Core Operations

### Union: A ∪ B — "In A or B (or both)"

**Formal:** A ∪ B = { x | x ∈ A **∨** x ∈ B }

**Analogy:** You and your roommate both stream music. Your liked songs ∪ their liked songs = everything available on your shared speaker.

**SQL equivalent:** `SELECT * FROM a UNION SELECT * FROM b`

```
A = {python, java, go}
B = {java, rust, c++}

A ∪ B = {python, java, go, rust, c++}
```

Notice: `java` appears in both — the union has it once. Sets don't duplicate.

---

### Intersection: A ∩ B — "In both A and B"

**Formal:** A ∩ B = { x | x ∈ A **∧** x ∈ B }

**Analogy:** What skills do both you AND your teammate have? Only the overlap is safe to assume about any random member of either group.

**SQL equivalent:** `SELECT * FROM a INTERSECT SELECT * FROM b`

**TypeScript intersection type:** `type C = A & B` — a value must satisfy BOTH A and B.

```
A = {python, java, go}
B = {java, rust, c++}

A ∩ B = {java}
```

**Disjoint sets:** A ∩ B = ∅ means no overlap at all.

---

### Difference: A \ B — "In A but not in B"

Also written A − B.

**Formal:** A \ B = { x | x ∈ A **∧** x ∉ B }

**Analogy:** What skills do *I* have that *you* don't? My set minus your set. Not symmetric — A \ B ≠ B \ A in general.

**SQL equivalent:** `SELECT * FROM a EXCEPT SELECT * FROM b`

```
A = {python, java, go}
B = {java, rust, c++}

A \ B = {python, go}     (in A, not in B)
B \ A = {rust, c++}      (in B, not in A)
```

**Common mistake:** "A minus B and B minus A are symmetric differences." No — that's a different operation (A △ B = (A \ B) ∪ (B \ A)), the "in exactly one of A, B" set.

---

### Complement: Aᶜ — "Everything NOT in A"

Requires a fixed **universe U** (the "everything" context).

**Formal:** Aᶜ = U \ A = { x ∈ U | x ∉ A }

**Analogy:** In your database, U = all users. The complement of "active users" = "inactive users." The universe is the full user table.

Without specifying U, the complement is undefined. "Everything that isn't a dog" — what's the universe? Animals? Objects? This is why the complement always requires a context.

---

## Power Set: P(A) — The Set of ALL Subsets

**Formal:** P(A) = { S | S ⊆ A }

**Size:** If |A| = n, then |P(A)| = 2ⁿ.

**Why 2ⁿ?** For each element, you make a binary choice: include it or exclude it. n elements = n binary choices = 2ⁿ possible combinations. This is the same reason a bit string of length n encodes 2ⁿ values.

```
A = {1, 2, 3}

P(A) = {
  ∅,              ← include none
  {1},            ← include only 1
  {2},            ← include only 2
  {3},            ← include only 3
  {1, 2},         ← include 1 and 2
  {1, 3},         ← include 1 and 3
  {2, 3},         ← include 2 and 3
  {1, 2, 3}       ← include all
}

|P(A)| = 8 = 2³ ✓
```

**Why this matters:** A feature-flag system with 20 boolean flags has 2²⁰ ≈ 1M possible configurations. That's |P(features)|. Testing "all configurations" is testing every element of the power set.

Power sets also come up in generating all subsets during algorithm design (e.g., solving subset sum, generating all combinations), which runs in O(2ⁿ) — now you see *why* that complexity class exists.

---

## Cartesian Product: A × B — All Ordered Pairs

**Formal:** A × B = { (a, b) | a ∈ A ∧ b ∈ B }

**Analogy:** A restaurant has 3 pasta types × 2 sauce types = 6 meal options. Every item on the menu is one (pasta, sauce) pair.

```
A = {red, blue}       (shirt colors)
B = {S, M, L}         (sizes)

A × B = {
  (red, S), (red, M), (red, L),
  (blue, S), (blue, M), (blue, L)
}

|A × B| = 2 × 3 = 6
```

**Key property:** Order matters in pairs. (red, S) ≠ (S, red). This is why it's called an **ordered** pair.

**Extension to n-tuples:** A × B × C = triples (a, b, c). A database table with 3 typed columns is a subset of (ColumnType1) × (ColumnType2) × (ColumnType3). Each row is one n-tuple.

**|A × B|** = |A| × |B|. (Multiplication rule — same one from combinatorics Chapter 08.)

---

## De Morgan's Laws — Revisited for Sets

You saw De Morgan's laws for logic in Chapter 01. Sets have the exact same laws:

| Logic form | Set form |
|------------|----------|
| ¬(P ∧ Q) ≡ ¬P ∨ ¬Q | (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ |
| ¬(P ∨ Q) ≡ ¬P ∧ ¬Q | (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ |

This is not coincidence. Sets ARE logic: membership in a set is a predicate (x ∈ A is either true or false), and set operations ARE logical connectives applied to those predicates.

**Visual check for (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ:**

```
Draw a Venn diagram with two overlapping circles A and B, universe U.

(A ∩ B)ᶜ = everything EXCEPT the intersection = the outside + the A-only region + the B-only region.

Aᶜ ∪ Bᶜ = (outside + B-only + outside) ∪ (outside + A-only + outside)
         = outside + A-only + B-only

Same region. ✓
```

---

## The Algebra of Sets — Key Identities

These are provable from definitions, but useful to know cold:

| Identity | Name |
|----------|------|
| A ∪ ∅ = A | Identity for union |
| A ∩ U = A | Identity for intersection |
| A ∪ A = A | Idempotence |
| A ∩ A = A | Idempotence |
| A ∪ B = B ∪ A | Commutativity |
| A ∩ B = B ∩ A | Commutativity |
| (A ∪ B) ∪ C = A ∪ (B ∪ C) | Associativity |
| A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C) | Distributivity |
| A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C) | Distributivity |
| (Aᶜ)ᶜ = A | Double complement |
| A ∪ Aᶜ = U | Complement law |
| A ∩ Aᶜ = ∅ | Contradiction law |

**How to prove any identity:** Either use element-chasing (pick x, show it's in the left iff it's in the right) or convert to logical form (replace ∈ with predicates, ∪ with ∨, ∩ with ∧, complement with ¬) and apply propositional logic equivalences.

---

## Sets in Code — The Direct Mapping

Sets aren't mathematical abstractions disconnected from programming. They're the *exact* concept behind:

**Java `HashSet` / `TreeSet`:**
```java
Set<String> a = new HashSet<>(List.of("python", "java", "go"));
Set<String> b = new HashSet<>(List.of("java", "rust", "c++"));

// Union: A ∪ B
Set<String> union = new HashSet<>(a);
union.addAll(b);   // {"python","java","go","rust","c++"}

// Intersection: A ∩ B
Set<String> intersection = new HashSet<>(a);
intersection.retainAll(b);   // {"java"}

// Difference: A \ B
Set<String> diff = new HashSet<>(a);
diff.removeAll(b);   // {"python","go"}
```

**TypeScript type system:**
```typescript
type Admin    = { name: string; adminId: number };
type Editor   = { name: string; editScope: string };

type AdminEditor = Admin & Editor;  // intersection type: A ∩ B — must have ALL fields
type AdminOrEditor = Admin | Editor; // union type: A ∪ B — must satisfy at least one
```

**SQL:**
```sql
SELECT role FROM user_a
UNION                         -- A ∪ B (de-duplicates)
SELECT role FROM user_b;

SELECT role FROM user_a
INTERSECT                     -- A ∩ B
SELECT role FROM user_b;

SELECT role FROM user_a
EXCEPT                        -- A \ B
SELECT role FROM user_b;
```

Note: `UNION ALL` is NOT a set union — it's a multiset union (keeps duplicates). Always use `UNION` (with de-dup) when you want mathematical set semantics.

---

## Cardinality Laws

For **finite** sets A and B:

**|A ∪ B| = |A| + |B| − |A ∩ B|**  

This is the **Inclusion-Exclusion Principle** for two sets. Subtract the intersection because it gets counted twice.

```
|{1,2,3}| + |{3,4,5}| - |{3}| = 3 + 3 - 1 = 5
{1,2,3} ∪ {3,4,5} = {1,2,3,4,5} → size 5 ✓
```

**Why this matters:** If you're estimating "users who clicked A or B," and you add click_A_count + click_B_count, you double-count users who clicked both. Subtract the overlap. This is the formula analytics teams get wrong constantly.

**For three sets:**

|A ∪ B ∪ C| = |A| + |B| + |C| − |A ∩ B| − |A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|

Add individuals, subtract pairwise overlaps (overcorrected), add back triple overlap.

---

## Section Challenge

> ### The Role Audit Problem
>
> Your company's permission database has three groups of users:
>
> ```
> A = users with "deploy" permission     (|A| = 120)
> B = users with "read-prod" permission  (|B| = 80)
> C = users with "write-prod" permission (|C| = 35)
>
> |A ∩ B| = 50        (have both deploy and read-prod)
> |A ∩ C| = 25        (have both deploy and write-prod)
> |B ∩ C| = 20        (have both read-prod and write-prod)
> |A ∩ B ∩ C| = 15    (have all three)
> ```
>
> **Question 1:** How many users have at least one of the three permissions?
>
> **Question 2:** A security audit finds that anyone with write-prod who does NOT also have read-prod is a misconfiguration. Express the set of misconfigured users in set notation and compute its size.
>
> **Question 3:** You want to notify users who have deploy but NOT write-prod, because they need a training update. Express this set and count it.
>
> **Question 4:** After adding 10 new users all of whom get both deploy and read-prod (but not write-prod), how does |A ∩ B| change, and does |A ∩ B ∩ C| change?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: |A ∪ B ∪ C| — users with at least one permission

Apply inclusion-exclusion:
  |A ∪ B ∪ C| = |A| + |B| + |C| − |A ∩ B| − |A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|
              = 120  +  80  +  35  −   50    −   25    −   20    +   15
              = 235 − 95 + 15
              = 155 users have at least one permission

VERIFICATION INTUITION:
  If there were no overlaps: 120+80+35 = 235 (too many — people counted multiple times)
  Subtract pairwise overlaps: −50−25−20 = −95 (overcorrect — triple-overlap removed 3 times)
  Add back triple: +15 (correction — was removed once too many)
  = 155 ✓

─────────────────────────────────────────────────────────

QUESTION 2: Misconfigured = write-prod WITHOUT read-prod = C \ B

Set notation: C \ B = { x | x ∈ C ∧ x ∉ B }

Size:
  |C \ B| = |C| − |C ∩ B|
           = 35 − 20
           = 15 users have write-prod but not read-prod → 15 misconfigurations

WHY: C splits into two disjoint parts:
  - users with write-prod AND read-prod: C ∩ B, size 20
  - users with write-prod but NOT read-prod: C \ B, size 35 − 20 = 15
  Total: 20 + 15 = 35 = |C| ✓

─────────────────────────────────────────────────────────

QUESTION 3: Deploy but NOT write-prod = A \ C

Set notation: A \ C = { x | x ∈ A ∧ x ∉ C }

Size:
  |A \ C| = |A| − |A ∩ C|
           = 120 − 25
           = 95 users need training notification

─────────────────────────────────────────────────────────

QUESTION 4: Adding 10 users with deploy AND read-prod (not write-prod)

A grows: |A| → 120 + 10 = 130
B grows: |B| → 80 + 10 = 90
A ∩ B grows: |A ∩ B| → 50 + 10 = 60  (new users have BOTH deploy and read-prod)

Does A ∩ B ∩ C change?
  The new 10 users have deploy AND read-prod but NOT write-prod.
  A ∩ B ∩ C requires all three. The new users don't have write-prod.
  Therefore |A ∩ B ∩ C| stays at 15. ✓

UPDATED |A ∪ B ∪ C|:
  = 130 + 90 + 35 − 60 − 25 − 20 + 15
  = 255 − 105 + 15
  = 165

Sanity check: was 155, added 10 new unique users who weren't in any group before. 155 + 10 = 165 ✓

─────────────────────────────────────────────────────────

TAKEAWAY:
  Inclusion-exclusion is the fundamental formula for "at least one" counting.
  Set difference is the formula for "exactly these constraints."
  Neither requires enumerating individuals — they work on counts alone.

  In analytics, ad tech, and access control auditing, these formulas are
  used constantly. Getting them wrong means double-counting users (you'll
  think you have more reach than you do) or missing the misconfiguration set.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing ∈ and ⊆**
- `{1} ∈ {{1}, {2}}` — {1} is an *element* of that set ✓
- `{1} ⊆ {1, 2}` — {1} is a *subset* of {1, 2} ✓
- `{1} ∈ {1, 2}` — WRONG. 1 (not {1}) is an element of {1, 2}.

**Mistake 2: Thinking set difference is symmetric**
- A \ B and B \ A are different. Don't confuse with symmetric difference A △ B.

**Mistake 3: Forgetting the universe for complement**
- "What's the complement of prime numbers?" — needs a universe. In ℤ: composite + 1 + {0, negatives}. In ℕ: composites + {0, 1}. Different answers.

**Mistake 4: Union ALL vs UNION in SQL**
- `UNION ALL` is not set union. It keeps duplicates. Mathematical ∪ never keeps duplicates.

**Mistake 5: Power set size surprises**
- |P(A)| = 2^|A|. For |A| = 30: 2³⁰ ≈ 1 billion. Power sets grow explosively — this is why "all subsets" algorithms are exponential.

---

## Proof Template: A = B via Mutual Containment

The cleanest way to prove two sets are equal:

1. Show A ⊆ B: take arbitrary x ∈ A, show x ∈ B.
2. Show B ⊆ A: take arbitrary y ∈ B, show y ∈ A.

**Example: Prove A \ B = A ∩ Bᶜ**

*A \ B ⊆ A ∩ Bᶜ:*  
Let x ∈ A \ B. By definition: x ∈ A and x ∉ B. x ∉ B means x ∈ Bᶜ. So x ∈ A and x ∈ Bᶜ → x ∈ A ∩ Bᶜ. ✓

*A ∩ Bᶜ ⊆ A \ B:*  
Let x ∈ A ∩ Bᶜ. Then x ∈ A and x ∈ Bᶜ, so x ∈ A and x ∉ B → x ∈ A \ B. ✓

Therefore A \ B = A ∩ Bᶜ. ∎

This tells you: **set difference is intersection with the complement**. That's not a definition — it's a provable equivalence, and it's how databases translate `EXCEPT` to its execution plan.

---

## Connections

- **Chapter 06 — Relations:** A binary relation on A is a *subset of A × A*. Everything about relations is built on Cartesian products.
- **Chapter 07 — Functions:** A function f : A → B is a special subset of A × B (a relation with no two pairs sharing the same left element). Functions are sets.
- **Chapter 08 — Counting:** Inclusion-exclusion generalizes to n sets. Power set size (2ⁿ) is the first exponential you'll prove by induction.
- **Chapter 09 — Pigeonhole:** Pigeonhole is about mapping a set of n+1 items into n "boxes" (another set). Sets and cardinality make the statement precise.
- `02_Data_Structures/` — Every data structure is a set with structure added. A BST is a set of keys with an ordering and shape constraint. A hash set is a set with O(1) membership test.
- `08_SQL/` — SQL is set algebra. SELECT is projection (picking columns), WHERE is filtering (subsetting), JOIN is Cartesian product then filter.

---

> [< Previous: 04 Induction Variants](04_Induction_Variants.md) | [Course Index](README.md) | [Next → 06 Relations & Properties](06_Relations_Properties.md)
