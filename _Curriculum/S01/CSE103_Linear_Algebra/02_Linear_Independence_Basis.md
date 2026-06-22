# Chapter 02 — Linear Independence & Basis

> [< Previous: 01 Vectors](01_Vectors.md) | [Course Index](README.md) | [Next → 03 Subspaces, Rank & Null Space](03_Subspaces_Rank_Null_Space.md)

---

## The Problem: When Is a Vector "Redundant"?

Your design system uses three color dimensions: Red, Green, Blue (RGB). You decide to add a fourth "dimension": Brightness, defined as Brightness = (Red + Green + Blue) / 3.

Now you have four numbers per color. But you've gained NO new information — Brightness is completely determined by the other three. It's redundant. You could drop it and lose nothing.

In vector terms: if your fourth "axis" is a combination of the first three, it doesn't add a new direction. Your set of axes is **linearly dependent**.

**Why this matters:**
- A machine learning model with redundant features trains slower and often overfits.
- A database with redundant columns wastes space and creates update anomalies (normalization removes this).
- A set of equations with a redundant equation (one is a linear combination of others) is either overdetermined (no solution) or underdetermined (infinitely many solutions).

Understanding linear independence lets you know when you have "enough" information and when something is redundant.

---

## Linear Combinations and Span

### Linear Combination

A **linear combination** of vectors v₁, v₂, ..., vₖ is any expression:

**c₁v₁ + c₂v₂ + ... + cₖvₖ**

where c₁, ..., cₖ are real numbers (scalars).

```
v₁ = (1, 0), v₂ = (0, 1)

2v₁ + 3v₂ = 2(1,0) + 3(0,1) = (2, 0) + (0, 3) = (2, 3)
-v₁ + 5v₂ = (-1, 0) + (0, 5) = (-1, 5)
0v₁ + 0v₂ = (0, 0)  ← the zero vector is always achievable
```

Any point (x, y) = x·v₁ + y·v₂. You can reach anywhere in ℝ² using v₁ and v₂.

### Span: The Set of All Reachable Points

The **span** of a set of vectors {v₁, ..., vₖ} is the set of ALL vectors you can reach by any linear combination:

**span{v₁, ..., vₖ} = { c₁v₁ + ... + cₖvₖ | c₁, ..., cₖ ∈ ℝ }**

**Color analogy:** You have a paint supply with colors {Red, Blue, Yellow}. The span is every color you can mix. Some spans are richer than others — the span of {Red, Blue, Yellow} is much larger than the span of {Red, Pink} (where Pink = 0.8·Red + 0.2·White).

```
Example: span of { (1,0), (0,1) } in ℝ²
  = { c₁(1,0) + c₂(0,1) | c₁, c₂ ∈ ℝ }
  = { (c₁, c₂) | c₁, c₂ ∈ ℝ }
  = ALL of ℝ² ← "the entire 2D plane"

Example: span of { (1,0), (2,0) } in ℝ²
  = { c₁(1,0) + c₂(2,0) | c₁, c₂ ∈ ℝ }
  = { ((c₁+2c₂), 0) | c₁, c₂ ∈ ℝ }
  = { (t, 0) | t ∈ ℝ }
  = The x-axis only ← "just a 1D line"
```

The span of {(1,0), (2,0)} is NOT all of ℝ² because both vectors point in the x-direction. No combination can give you a non-zero y-component.

---

## Linear Independence: No Redundancy

Vectors {v₁, ..., vₖ} are **linearly independent** if the ONLY way to write the zero vector as a combination is the trivial one (all coefficients = 0):

**c₁v₁ + ... + cₖvₖ = 0 implies c₁ = c₂ = ... = cₖ = 0**

**Equivalently:** No vector in the set is a linear combination of the others. No vector is "redundant."

**Linearly dependent:** There EXISTS a non-trivial combination that equals zero. Some vector can be expressed as a combination of the others.

```
{(1,0), (0,1)}: independent?
  c₁(1,0) + c₂(0,1) = (0,0)
  → (c₁, c₂) = (0, 0)
  → c₁ = c₂ = 0  (only trivial solution) ✓ INDEPENDENT

{(1,0), (2,0)}: independent?
  c₁(1,0) + c₂(2,0) = (0,0)
  → (c₁ + 2c₂, 0) = (0, 0)
  → c₁ + 2c₂ = 0
  → c₁ = -2, c₂ = 1 works  (non-trivial!) ✗ DEPENDENT

  Meaning: (1,0) = -2·(2,0) wait that's wrong. Let's redo:
  c₁ = -2c₂, so (−2)·(1,0) + (1)·(2,0) = (-2,0) + (2,0) = (0,0) ✓
  So 2·(2,0) = 2·(1,0) → (2,0) = 2·(1,0)
  → (2,0) is just (1,0) scaled by 2 → REDUNDANT
```

**Quick visual test in ℝ²:** Two vectors are linearly dependent iff they point in the same or opposite direction (one is a scalar multiple of the other). Three or more vectors in ℝ² are always dependent (can't have 3 independent directions in 2D space).

### The Geometry of Dependence

**2 vectors:** dependent iff they're parallel (collinear).

**3 vectors in ℝ²:** always dependent — you can't have 3 independent directions in a 2D plane.

**3 vectors in ℝ³:** dependent iff they all lie in the same plane (coplanar).

**k vectors in ℝⁿ:** if k > n, they MUST be dependent (more directions than the space has dimensions).

```
In ℝ² (2D plane), you can have at most 2 independent vectors.
Any 3rd vector lies in the plane → linear combination of first two.

Imagine trying to draw 3 arrows that are all "truly independent"
in 2D — you can't. The third always points somewhere reachable
by the first two.
```

---

## Basis: The Minimal Complete Toolkit

A **basis** of a vector space V is a set of vectors {b₁, ..., bₙ} that:
1. **Spans V:** every vector in V is a linear combination of the basis vectors.
2. **Is linearly independent:** no basis vector is redundant.

**Analogy:** A complete, non-redundant set of primary building materials. You can build everything you need from it, and no piece of the kit can be made from the others.

```
Standard basis of ℝ²:
  ê₁ = (1, 0)   ← "1 unit east"
  ê₂ = (0, 1)   ← "1 unit north"

Any vector (a, b) = a·ê₁ + b·ê₂ ← spans ℝ²
(1,0) and (0,1) are clearly independent ← no redundancy
✓ This is a basis.
```

**But there are many bases for the same space.** The standard basis is the most natural, but not the only one:

```
Alternative basis of ℝ²:
  b₁ = (1, 1)   ← "northeast diagonal"
  b₂ = (1, -1)  ← "southeast diagonal"

Any vector (a, b) can be written as:
  (a, b) = c₁(1,1) + c₂(1,-1) = (c₁+c₂, c₁-c₂)
  → c₁ + c₂ = a, c₁ - c₂ = b → c₁ = (a+b)/2, c₂ = (a-b)/2

(3, 1) = (3+1)/2 · (1,1) + (3-1)/2 · (1,-1) = 2(1,1) + 1(1,-1) ✓
✓ {b₁, b₂} is also a basis.
```

**Key theorem:** All bases of a space have the **same number of vectors**.

---

## Dimension: The "Size" of a Space

The **dimension** of a vector space is the number of vectors in any basis.

| Space | Basis | Dimension |
|-------|-------|-----------|
| A line through origin | {(1,0)} or any single non-zero vector | 1 |
| The 2D plane ℝ² | {(1,0), (0,1)} | 2 |
| The 3D space ℝ³ | {(1,0,0), (0,1,0), (0,0,1)} | 3 |
| ℝⁿ | The n standard basis vectors | n |
| A plane inside ℝ³ (e.g., z=0) | {(1,0,0), (0,1,0)} | 2 (a 2D subspace of 3D space) |
| Just the zero vector | {} (empty set) | 0 |

**Why dimension is well-defined:** It's a theorem that all bases of V have the same cardinality. (If two bases had different sizes, you could construct a non-trivial zero combination — contradicting independence.) This requires proof, which we'll see in Chapter 03.

**Dimension is the number of "truly independent" directions in your space.** A 2D plane has 2 independent directions even when embedded in 3D.

---

## Coordinates in a Basis

Once you choose a basis {b₁, ..., bₙ}, every vector v has a **unique** coordinate vector:

v = c₁b₁ + c₂b₂ + ... + cₙbₙ → **[v]_B = (c₁, c₂, ..., cₙ)**

The coordinate vector [v]_B expresses v in terms of the chosen basis B.

**Critical:** The SAME vector v has DIFFERENT coordinates in different bases.

```
v = (3, 1) (the arrow in ℝ²)

In standard basis {(1,0), (0,1)}:
  [v]_std = (3, 1)        ← the components are literally the coordinates

In basis {(1,1), (1,-1)}:
  [v]_B = (2, 1)          ← same arrow, different coordinates
  2·(1,1) + 1·(1,-1) = (3, 1) ✓
```

**Changing basis** (covered more in Chapter 04) is just converting between coordinate representations. A rotation matrix, for example, changes the basis — the vectors in your space stay the same; only how you describe their coordinates changes.

---

## Why This Matters: Real Applications

### Machine Learning: Feature Redundancy

```python
import numpy as np

# 1000 data points, each with 5 features
X = np.random.randn(1000, 5)

# Feature 5 is redundant: always = feature 1 + feature 2
X[:, 4] = X[:, 0] + X[:, 1]

# The 5 columns are linearly DEPENDENT → rank < 5
rank = np.linalg.matrix_rank(X)
print(rank)  # 4, not 5 — the 5th column adds no new information
```

A linear model trained on this data has an infinite number of equally-good solutions (the "null space" of Chapter 03). Removing the redundant feature gives a unique, stable solution.

### Image Compression: PCA and Basis Change

A 64×64 grayscale image is a vector in ℝ⁴⁰⁹⁶. The standard basis encodes each pixel independently.

PCA finds a BETTER basis — one where the first basis vector captures the most variance, the second captures the second most, etc. After changing to this basis, most images only need ~50 coordinates instead of 4096, with minimal quality loss. The other 4046 directions are nearly zero.

This is JPEG (roughly): change to a "frequency basis" (cosine transform), drop small-magnitude frequency components, keep high-magnitude ones.

### Database Normalization

A table with columns (Name, First, Last) where Name = First + " " + Last has redundancy — Name is a linear combination of (First, Last) if you think of string concatenation as a "linear" operation (loosely). Normal forms remove this dependency, giving a basis-like minimal representation.

---

## Section Challenge

> ### Detecting Redundancy in a Feature Matrix
>
> You're reviewing a data science project. The feature matrix has 4 columns:
>
> ```
> Feature A: [1, 2, 3, 4, 5]
> Feature B: [2, 4, 6, 8, 10]
> Feature C: [0, 1, 0, 1, 0]
> Feature D: [1, 3, 3, 5, 5]  (= Feature A + Feature C)
> ```
>
> **Question 1:** Which features are linearly dependent? Express the dependency.
>
> **Question 2:** What is the "rank" of this feature matrix (maximum number of independent feature vectors)?
>
> **Question 3:** A colleague says "let's keep all 4 features — more data is better." What's wrong with this reasoning in the context of linear independence and model training?
>
> **Question 4:** Which 2 features form a basis for the column space? Is this unique?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Linear dependencies

Observe the columns as vectors:
  A = [1, 2, 3, 4, 5]
  B = [2, 4, 6, 8, 10]
  C = [0, 1, 0, 1, 0]
  D = [1, 3, 3, 5, 5]

DEPENDENCY 1: B = 2A
  2A = [2, 4, 6, 8, 10] = B ✓
  Equivalently: 2A - B = 0 (the zero vector)
  → A and B are linearly dependent

DEPENDENCY 2: D = A + C
  A + C = [1+0, 2+1, 3+0, 4+1, 5+0] = [1, 3, 3, 5, 5] = D ✓
  → D = A + C → D is "redundant" given A and C
  → A - D + C = 0 (verify: [1-1+0, 2-3+1, 3-3+0, 4-5+1, 5-5+0] = [0,0,0,0,0] ✓)

SUMMARY:
  - B is 2× A → B is redundant
  - D = A + C → D is redundant
  - A and C appear "genuinely independent" (neither is a multiple of the other,
    nor is one a combination of the other)

──────────────────────────────────────────────────────────

QUESTION 2: Rank

With dependencies B = 2A and D = A + C:
  The "truly independent" features are {A, C} (or any 2-element independent subset).
  
  Maximum independent features = 2

Rank of the feature matrix = 2.

Verify: np.linalg.matrix_rank([[1,2,0,1],[2,4,1,3],[3,6,0,3],[4,8,1,5],[5,10,0,5]]) = 2

──────────────────────────────────────────────────────────

QUESTION 3: "More data is better" — what's wrong?

This confuses MORE DATA POINTS with MORE FEATURES.

Adding redundant features doesn't add information — it adds noise about
the same information. Problems caused by redundant/dependent features:

1. MULTICOLLINEARITY in linear regression:
   If B = 2A, then A and B contain the same predictive information.
   The model can use ANY coefficient combination: β_A = 1, β_B = 0 gives
   the same predictions as β_A = 0, β_B = 0.5. Both are equally "correct."
   → The model has INFINITELY MANY SOLUTIONS (underdetermined system).
   → Gradient descent becomes numerically unstable.

2. INFLATED feature importance:
   If your model ranks features by coefficient size, B will appear
   "important" because it's just A scaled — but it's not truly independent.

3. COMPUTATIONAL WASTE:
   Training with 4 features when only 2 have information costs
   more compute without benefit.

4. INTERPRETABILITY LOSS:
   Which features "matter" when B = 2A? The model can't tell you.

──────────────────────────────────────────────────────────

QUESTION 4: Basis for the column space

The column space is span{A, B, C, D} = span{A, C} (since B and D are redundant).

Is {A, C} independent?
  αA + βC = 0
  α[1,2,3,4,5] + β[0,1,0,1,0] = [0,0,0,0,0]
  Row 1: α = 0
  Row 2: 2α + β = 0 → β = 0
  → α = β = 0 ✓ INDEPENDENT

So {A, C} is a basis for the column space.

IS THIS THE UNIQUE BASIS?
  No. Many bases exist:
  - {A, D}: D = A + C, C = D - A → span{A,C} = span{A,D} ✓
  - {B, C}: B = 2A, so span{B,C} = span{A,C} ✓
  - {A+C, A-C}: linear combinations of A and C, still spans the same space

  The column SPACE (the set of all reachable vectors) is unique.
  The BASIS that spans it is not — infinitely many bases exist.
  The dimension (2) is what's invariant.

KEY TAKEAWAY:
  Rank = dimension of the column space = number of truly independent directions.
  Pre-processing step: compute rank → if rank < number of features → redundancy exists.
  Fix: PCA, or manually remove dependent features.
```

</details>

---

## Common Mistakes

**Mistake 1: Testing independence by comparing pairs only**
- Three vectors can be pairwise independent (no two are parallel) but still linearly dependent as a set (one is a combination of the other two, not a scalar multiple).
- Always test ALL of them together: can you write zero as a non-trivial combination?

**Mistake 2: Thinking "independent" means "perpendicular"**
- Linear independence does NOT require orthogonality. {(1,0), (1,1)} are independent (neither is a scalar multiple of the other) even though they're not perpendicular.
- Perpendicular (orthogonal) vectors are ALWAYS independent, but independent vectors need not be perpendicular.

**Mistake 3: Claiming a span is larger than it is**
- span{(1,0), (2,0)} is NOT ℝ². It's only the x-axis. The span is never larger than what the basis directions can reach.

**Mistake 4: Trying to have more basis vectors than the dimension**
- A basis of ℝⁿ has EXACTLY n vectors. If you add an (n+1)th vector to an existing basis of ℝⁿ, it MUST be dependent on the others (by the dimension theorem).

---

## Connections

- **Chapter 01 — Vectors:** Span and linear combinations extend the vector operations (addition, scaling) from Chapter 01 to questions about "what spaces can we reach?"
- **Chapter 03 — Subspaces:** A subspace is defined by span + closure under combination. The null space and column space of a matrix are defined by their bases.
- **Chapter 04 — Matrices:** A matrix transforms a basis into a new set of vectors. The rank of a matrix is the dimension of its column space. The image of a linear transformation is the span of its column vectors.
- **Chapter 08 — Orthogonality:** An orthonormal basis is the "nicest" kind — independent AND perpendicular AND unit-length. Gram-Schmidt constructs one from any independent set.
- **Chapter 12 — SVD/PCA:** PCA finds the most "informative" basis for a dataset — the directions of highest variance. Understanding that bases can be changed freely (Chapter 02) is what makes PCA possible.

---

> [< Previous: 01 Vectors](01_Vectors.md) | [Course Index](README.md) | [Next → 03 Subspaces, Rank & Null Space](03_Subspaces_Rank_Null_Space.md)
