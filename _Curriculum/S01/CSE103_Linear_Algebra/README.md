# CSE103 — Linear Algebra

## Semester 1 · Foundations

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can REASON in vector and matrix space — "where is this image after rotation," "what's the principal direction of variance in this dataset," "is this system of equations over- or under-determined" — without translating into scalar component-wise math. Geometric intuition first; manipulation second.
> **Capstone:** Build an image processing toolkit from scratch (rotation, scaling, edge detection via convolution, JPEG-style compression via SVD). Every operation is a matrix transformation. You'll see WHY linear algebra rules the visual world.

---

## Why This Course Exists

Three reasons it matters more than students realize:

1. **Machine learning is matrix multiplication.** Neural networks, attention mechanisms, PCA, recommender systems — all are matrix operations at scale. Without geometric intuition, you'll memorize formulas and never see the structure.
2. **Computer graphics is matrix transformations.** Rotating a character in a video game, projecting 3D to 2D, applying a camera filter — every pixel pipeline runs through matrices.
3. **Numerical stability matters more than algebra.** A 100-line proof can collapse in floating-point because two nearly-parallel vectors cancel. Knowing the geometry tells you WHEN to expect numerical disaster (condition number) — and how to avoid it.

The students who succeed in S07 ML are the ones who took THIS course seriously in S01.

---

## Navigation

| Course                                                                              | Description |
| ----------------------------------------------------------------------------------- | ----------- |
| **[CSE101 — Discrete Mathematics](../CSE101_Discrete_Mathematics/README.md)**       | S01 sibling — different math, different problems |
| **[CSE102 — Programming Fundamentals](../CSE102_Programming_Fundamentals/README.md)** | S01 sibling |
| **CSE103 — Linear Algebra**                                                          | This course |
| **[CSE104 — Introduction to Computer Systems](../CSE104_Computer_Systems/README.md)** | S01 sibling |

| Where you'll use it                              | Specific application                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `25_Python_ML_DL_NLP/04_Math_For_ML.md`           | Vector/matrix operations for ML (USES this knowledge)         |
| `25_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md` | Gradient descent geometry, eigenvector derivation             |
| `25_Python_ML_DL_NLP/07_Deep_Learning_Fundamentals.md` | Backprop is just chain rule on matrix calculus           |
| `25_Python_ML_DL_NLP/11_Computer_Vision_CNNs.md`  | Convolutions are sliding matrix multiplications               |
| [CSE304 Numerical Methods](../../S03/CSE304_Numerical_Methods/README.md) | LU decomposition, condition number, iterative solvers         |

---

## Prerequisites

- High-school algebra: solving equations, manipulating exponents
- High-school geometry: triangles, angles, vectors as arrows
- Comfort drawing 2D and 3D coordinate axes by hand
- A working dev environment: Python 3 + NumPy (for visualization and verification)

**Constraint:** Don't skip the geometric/visualization steps. Linear algebra has TWO faces — algebraic (rows of numbers, computation rules) and geometric (vectors as arrows, matrices as transformations). The algebraic face alone produces engineers who can solve textbook problems but can't tell when a real-world matrix is degenerate. The geometric face produces engineers who see "this matrix collapses 3D space to 2D" and immediately know there's no inverse.

---

## Chapter Index

| # | Chapter | Week |
|---|---------|------|
| [01](01_Vectors.md) | Vectors: Two Views of the Same Arrow | 1 |
| [02](02_Linear_Independence_Basis.md) | Linear Independence & Basis | 2 |
| [03](03_Subspaces_Rank_Null_Space.md) | Subspaces, Rank & Null Space | 3 |
| [04](04_Matrices_as_Transformations.md) | Matrices as Linear Transformations | 4 |
| [05](05_Linear_Systems_Gaussian_Elimination.md) | Linear Systems & Gaussian Elimination | 5 |
| [06](06_Determinants.md) | Determinants | 6 |
| [07](07_Inverse_Rank_Full_Picture.md) | Matrix Inverse, Rank & The Full Picture | 7 |
| [08](08_Orthogonality_Gram_Schmidt.md) | Orthogonality & Gram-Schmidt | 8 |
| [09](09_Projections_Least_Squares.md) | Projections & Least Squares | 9 |
| [10](10_Eigenvalues_Eigenvectors.md) | Eigenvalues & Eigenvectors | 10 |
| [11](11_Diagonalization.md) | Diagonalization | 11 |
| [12](12_Spectral_Theorem_PCA.md) | Spectral Theorem & PCA | 12 |
| [13](13_SVD_Definition.md) | SVD: Definition | 13 |
| [14](14_SVD_Applications.md) | SVD Applications | 14 |

Each chapter ends with a Section Challenge. Where a weekly `Read` cell below points at `25_Python_ML_DL_NLP/`, that file is supplementary — the week's chapter is the primary reading.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Vectors (Weeks 1–3)

**Learning Outcomes:**

- Treat a vector as an arrow AND as a list of numbers — switch fluidly between views
- Compute and interpret dot products geometrically (alignment) and algebraically (sum of products)
- Reason about linear independence by visualization in 2D and 3D

---

#### Week 1 — What Is a Vector?

**Real-world analogy: GPS + Velocity**
- Your position on Earth: a 3D vector (latitude, longitude, altitude). Adding "displacement vectors" tells you where you'll be after a movement.
- Your car's velocity: another 3D vector (speed in each direction). The MAGNITUDE is your speedometer reading; the DIRECTION is where you're headed.
- Adding velocity vectors: a car moving 50mph north + a wind pushing 10mph east → resulting velocity is the vector sum, not the scalar sum.

**Mental model:** A vector is **an arrow with magnitude and direction.** Components (numbers in a list) are just how the arrow gets EXPRESSED in a chosen coordinate system. The same arrow has different components in different coordinate systems — but it's the SAME arrow.

| Day | Topic                                | Read                                                     | Do                                                                  |
| --- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Vector as arrow + as list of components | `25_Python_ML_DL_NLP/04_Math_For_ML.md` §1            | Draw v=(3,4) and w=(-1,2); compute v+w geometrically (parallelogram) |
| 2   | Vector addition, scalar multiplication | `25_Python_ML_DL_NLP/04_Math_For_ML.md` §2             | Show: 2v + (-1)w in NumPy AND on graph paper                         |
| 3   | Magnitude (norm) and unit vectors      | `25_Python_ML_DL_NLP/04_Math_For_ML.md` §3             | Normalize 5 sample vectors; verify magnitude = 1                     |
| 4   | Dot product — algebraic + geometric    | `25_Python_ML_DL_NLP/04_Math_For_ML.md` §4             | Compute angle between (1,0) and (1,1) using dot product              |
| 5   | Lab — visualize 100 random 2D vectors  | —                                                       | **Lab:** Plot 100 random unit vectors; observe uniform distribution  |
| 6–7 | Review + Section Challenge             | [Ch01](01_Vectors.md)                                       | [Ch01](01_Vectors.md) Section Challenge                                             |

**Section Challenge (Dot product geometry):**

> Why does `dot(v, w) = |v| · |w| · cos(θ)` where θ is the angle between v and w? Specifically, why does the algebraic formula `v₁w₁ + v₂w₂` (sum of products) equal the geometric formula (magnitudes times cosine)? Give a derivation, not just the formula.

<details>
<summary>Answer — geometric derivation</summary>

```
START FROM THE LAW OF COSINES (high-school trigonometry):

For a triangle with sides a, b, c and angle θ opposite to c:
  c² = a² + b² - 2ab·cos(θ)

PLACE TWO VECTORS v AND w AT THE ORIGIN.
  The vector (v - w) closes the triangle (from tip of w to tip of v).

  |v - w|² = |v|² + |w|² - 2|v||w|cos(θ)        ← law of cosines

NOW COMPUTE |v - w|² ALGEBRAICALLY:
  |v - w|² = (v - w)·(v - w)                     ← definition of magnitude
           = v·v - 2v·w + w·w                    ← expanding
           = |v|² - 2(v·w) + |w|²                ← regrouping

SET THE TWO EXPRESSIONS EQUAL:
  |v|² - 2(v·w) + |w|² = |v|² + |w|² - 2|v||w|cos(θ)

Cancel |v|² + |w|² from both sides:
  -2(v·w) = -2|v||w|cos(θ)
   (v·w)  =  |v||w|cos(θ)        ✓

WHAT THIS PROVES:
  The algebraic formula (v₁w₁ + v₂w₂ + ... + vₙwₙ) literally equals
  the geometric quantity |v|·|w|·cos(θ). Two definitions of the same thing.

WHY IT MATTERS IN PRACTICE:

  Dot product as ALIGNMENT measure:
  - v·w > 0  →  cos(θ) > 0  →  vectors point in similar directions
  - v·w = 0  →  cos(θ) = 0  →  perpendicular (90° apart)
  - v·w < 0  →  cos(θ) < 0  →  pointing in opposite-ish directions

  COSINE SIMILARITY:
  - Search engines: query vector vs document vector
  - Recommendation systems: user preference vector vs item vector
  - Word embeddings: "king" vs "queen" cosine similarity is high
  - Face recognition: face embedding vectors compared via cosine

  THE GEOMETRIC INTERPRETATION TELLS YOU WHEN COSINE SIMILARITY FAILS:
  - If one vector has tiny magnitude (small angle change → huge cosine swing)
  - If both vectors are near-zero (denominator vanishes → numerically unstable)
  - If you've not normalized → you're measuring product of magnitudes,
    not just direction similarity

  This is WHY production ML code does `normalize(v)` before computing
  cosine similarity. The geometry tells you it's necessary.
```

</details>

---

#### Week 2 — Linear Independence

**Real-world analogy: Mixing colors**
- Red, blue, yellow primary colors: linearly independent. You can make any color by combining them.
- Red, blue, purple (where purple is red+blue mixed): NOT linearly independent. Purple is REDUNDANT — anything you could make with all three you could already make with red and blue.
- "Spanning a color space" = which colors you can reach by mixing your primaries.

**Topic:** Linear combinations, span, linear independence, basis, dimension. Read [Ch02](02_Linear_Independence_Basis.md).

**Aha moment:** A "basis" is the minimal set of vectors that can construct any vector in the space. The COMPONENTS you've been using since Week 1 are coordinates in a specific basis (the standard basis e₁, e₂, e₃). Changing basis is just choosing a different set of "primary colors" to express your arrow.

---

#### Week 3 — Subspaces

Read [Ch03](03_Subspaces_Rank_Null_Space.md): subspaces, null space, column space, rank, dimension theorems.

---

### UNIT 2 — Matrices as Transformations (Weeks 4–7)

**THE PARADIGM SHIFT:** Most students learn matrices as "tables of numbers with multiplication rules." This is **wrong** for building intuition. A matrix is a **TRANSFORMATION** — it takes a vector in and spits a vector out. The rules of matrix multiplication are derived from this view; they don't come first.

---

#### Week 4 — Matrices as Linear Transformations

**Real-world analogy: Image filters**
- Take a photo. Rotate it 90°. Every pixel moves to a new location.
- That rotation is a MATRIX. Specifically, the 2D rotation matrix `[[cos θ, -sin θ], [sin θ, cos θ]]`.
- Each pixel at coordinate (x, y) gets transformed to a new (x', y') = matrix · (x, y).

**Why matrix multiplication "works" the way it does:** If matrix A is "rotate 90°" and matrix B is "scale by 2", then `A·B` is "first scale by 2, then rotate 90°." Composition of transformations IS matrix multiplication. The "row-times-column" formula is exactly what makes this composition work out.

| Day | Topic                                | Read                                                     | Do                                                                  |
| --- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Matrices as functions: ℝⁿ → ℝᵐ        | `25_Python_ML_DL_NLP/04_Math_For_ML.md` §5             | Compute Av for 5 sample matrices A and vectors v                     |
| 2   | Matrix multiplication = composition  | [Ch04](04_Matrices_as_Transformations.md) §Matrix Multiplication as Composition | Compose rotation × scale; verify rotate-then-scale ≠ scale-then-rotate |
| 3   | Identity, inverse, transpose         | [Ch04](04_Matrices_as_Transformations.md) §Special Matrices; [Ch07](07_Inverse_Rank_Full_Picture.md)             | Find inverse of 2×2 matrix; verify A·A⁻¹ = I                          |
| 4   | When inverses don't exist            | [Ch07](07_Inverse_Rank_Full_Picture.md) §Why Inverses Fail                    | Show: rank-deficient matrices have no inverse                         |
| 5–7 | Lab + Section Challenge              | [Ch04](04_Matrices_as_Transformations.md)                                       | [Ch04](04_Matrices_as_Transformations.md) Section Challenge                                             |

**Section Challenge (Why matmul order matters):**

> Matrix multiplication is NOT commutative — `AB ≠ BA` in general. But scalar multiplication IS — `3 × 5 = 5 × 3`. From the "transformations as functions" view, give a real-world example that makes it obvious why matrix multiplication order matters.

<details>
<summary>Answer — real-world non-commutativity</summary>

```
THE INTUITION: Order of operations on YOUR WORLD POSITION.

Imagine you're standing at the origin facing north.
TWO OPERATIONS:
  ROTATE = turn 90° right (clockwise)
  WALK   = step 1 unit forward

OPERATION ORDER MATTERS:

PATH A — Rotate then Walk:
  1. Rotate 90° right → now facing east
  2. Walk 1 unit forward → you're at (1, 0)

PATH B — Walk then Rotate:
  1. Walk 1 unit forward → you're at (0, 1), still facing north
  2. Rotate 90° right → now facing east, but POSITION is (0, 1)

End positions: (1, 0) vs (0, 1) — DIFFERENT!

The matrices for ROTATE and WALK don't commute because the transformations
they encode don't commute.

GENERAL PRINCIPLE:
  Function composition is not commutative.
  f∘g  ≠  g∘f
  "Apply f, then g" is a DIFFERENT function than "apply g, then f."
  Matrices encode functions. So matrix multiplication encodes composition,
  which is non-commutative.

SCALAR MULTIPLICATION CASE:
  Scalars don't "transform" anything in a coordinate-dependent way.
  3·5 is "scale 5 by factor 3." 5·3 is "scale 3 by factor 5." Both = 15.
  No structural dependence on order.

CONCRETE EXAMPLES OF NON-COMMUTATIVE MATMUL IN PRACTICE:
  - 3D graphics: rotation × translation ≠ translation × rotation
    (rotating then translating moves your object differently than
    translating then rotating around the world origin)
  - Neural networks: layer composition is non-commutative
  - Convolution × pooling ≠ pooling × convolution

THE KEY INSIGHT:
  When you see AB in code, READ it as "apply B first, then A."
  Right-to-left order matches function composition.
```

</details>

---

#### Week 5 — Systems of Linear Equations

**Real-world analogy: A recipe system**
- "1 cup flour + 2 cups water + 1 egg = 1 pancake"
- "3 cups flour + 1 cup water + 4 eggs = 1 cake"
- Question: how much of each can you make from 30 cups flour, 20 cups water, 10 eggs?
- Set up Ax = b where A is the recipe matrix, x is "how many pancakes + cakes," b is your ingredient supply.

Topics: matrix form of linear systems, Gaussian elimination, LU decomposition. Read [Ch05](05_Linear_Systems_Gaussian_Elimination.md).

**Aha moment:** Gaussian elimination is just systematic substitution — exactly what you've been doing since 8th grade algebra. The matrix form makes it scalable.

---

#### Week 6 — Determinants

**Real-world analogy: Volume change**
- A 2×2 matrix transforms a unit square to a parallelogram. The DETERMINANT is the AREA of that parallelogram (with sign for orientation).
- A 3×3 matrix transforms a unit cube to a parallelepiped. The DETERMINANT is the VOLUME.
- If determinant = 0: the matrix collapses the space (e.g., 3D → 2D plane). No inverse exists because you can't un-collapse.

Read [Ch06](06_Determinants.md).

---

#### Week 7 — Inverses, Rank, Null Space

**Real-world analogy: An echo chamber**
- A matrix with null space (vectors that map to zero) "loses information." Multiple inputs → same output. Like an echo chamber that swallows certain frequencies — once they're gone, you can't recover them.
- The DIMENSION of the null space tells you HOW MUCH information is lost.

Read [Ch07](07_Inverse_Rank_Full_Picture.md).

---

### UNIT 3 — Orthogonality (Weeks 8–9)

**Real-world analogy: GPS triangulation**
- Three satellites give you three distance measurements (a vector in distance-space).
- Solving for your position is "project onto the satellite basis."
- If satellite signals are nearly parallel (same direction), small errors blow up — this is the **condition number** appearing geometrically.

| Week | Topic                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- |
| 8    | Orthogonality, orthonormal basis, Gram-Schmidt — [Ch08](08_Orthogonality_Gram_Schmidt.md)                  |
| 9    | Projection, least squares, regression geometrically — [Ch09](09_Projections_Least_Squares.md); light coverage in `04b_Math_Behind_The_Code.md` |

**Aha moment:** Linear regression IS projection. You're projecting the data vector onto the span of the feature columns. The "error" is what's left over — the orthogonal complement.

---

### UNIT 4 — Eigenvalues & Eigenvectors (Weeks 10–12)

**Real-world analogy: Tuning forks**
- Strike a tuning fork. It vibrates at a SPECIFIC frequency.
- That frequency is the fork's "natural mode" — an EIGENVECTOR of the fork's physical equations.
- Buildings have eigenvectors too. The 1985 Mexico City earthquake had a frequency that matched the eigenvalue of 6-15 story buildings — those collapsed; taller and shorter buildings survived.

**Real-world analogy 2: Google PageRank**
- The web is a graph. Each page passes its "rank" to pages it links to.
- This is a matrix iteration. The PageRank vector is the dominant eigenvector of the web's link matrix.
- The eigenvalue tells you how fast the iteration converges.

| Week | Topic                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- |
| 10   | Eigenvalue definition, characteristic polynomial — [Ch10](10_Eigenvalues_Eigenvectors.md)                   |
| 11   | Diagonalization, when it exists, applications — [Ch11](11_Diagonalization.md)                       |
| 12   | Spectral theorem, symmetric matrices, applications (PCA preview) — [Ch12](12_Spectral_Theorem_PCA.md)                       |

**Section Challenge (Eigenvalue intuition):**

> An eigenvector of matrix A is a vector v such that `Av = λv` — A "just stretches v by factor λ" without rotating it. For the 2D rotation matrix (rotates everything by 30°), what are the eigenvectors?

<details>
<summary>Answer — and why this reveals real vs complex eigenvalues</summary>

```
THE GEOMETRIC INTUITION:
  A 30° rotation rotates EVERY vector by 30°.
  An eigenvector would have to NOT change direction (only stretch).
  → No real vector survives this without rotation.
  → NO REAL EIGENVECTORS EXIST.

ALGEBRAICALLY:
  Rotation matrix R(θ) = [[cos θ, -sin θ], [sin θ, cos θ]]
  Characteristic polynomial: λ² - 2cos(θ)λ + 1 = 0
  For θ = 30°: λ² - √3·λ + 1 = 0
  Discriminant: 3 - 4 = -1 → COMPLEX eigenvalues:
  λ = (√3 ± i)/2 = cos(30°) ± i·sin(30°) = e^(±i·30°)

WHAT COMPLEX EIGENVALUES MEAN GEOMETRICALLY:
  The rotation "is" the multiplication by complex number e^(iθ) in the
  2D plane (which is the complex plane). The "eigenvectors" live in
  the complex extension, not in real 2D.

WHEN DO REAL EIGENVECTORS EXIST?
  - Diagonal matrices: trivially — each axis IS an eigenvector
  - Symmetric matrices: ALWAYS have real eigenvalues (spectral theorem)
  - Rotations: never (in real coordinates)
  - Reflections: yes — the axis of reflection has eigenvalue +1,
    the perpendicular direction has eigenvalue -1

WHY THIS MATTERS:
  - PCA on real data ALWAYS WORKS because the covariance matrix is
    symmetric, so real eigenvectors are guaranteed.
  - In physics: a system with complex eigenvalues has OSCILLATION,
    not pure decay/growth. The imaginary part IS the oscillation frequency.
  - In graphics: pure rotations have no fixed direction (no real eigenvector)
    but rotation+reflection (= reflection across a line) DOES have an
    eigenvector — the axis of the reflection.

THE TAKEAWAY:
  "No real eigenvector" tells you the transformation is fundamentally
  ROTATIONAL — it twists everything. "Real eigenvectors exist" tells
  you there are special directions the transformation preserves.
  This distinction is critical when interpreting any matrix from data.
```

</details>

---

### UNIT 5 — Singular Value Decomposition (Weeks 13–14)

**Real-world analogy: Image compression in JPEG**
- A 1000×1000 image is a matrix.
- SVD breaks it into U·Σ·Vᵀ where Σ has SINGULAR VALUES (magnitudes of "importance directions").
- Keep only the top 50 singular values → ~99% of image quality at 1/20 the storage.
- This is roughly how JPEG works (with discrete cosine transform doing the role of SVD).

Read [Ch13](13_SVD_Definition.md) and [Ch14](14_SVD_Applications.md): SVD definition, computation, image compression, PCA, low-rank approximation.

---

### Week 15 — Applications

PCA dimensionality reduction (lives in `25_Python_ML_DL_NLP/06_ML_Algorithms.md` §5).
Computer graphics transforms.
Network analysis (PageRank, spectral clustering).

---

### Week 16 — Capstone

**Image processing toolkit from scratch:**
1. Rotate/scale/shear an image using matrix transformations
2. Edge detection via convolution (Sobel kernel)
3. JPEG-style compression via SVD (low-rank approximation)
4. Face alignment via Procrustes analysis (orthogonal Procrustes problem)

Every operation links back to a specific week's concept. The capstone makes the abstract concrete.

---

## Problem Sets

Each chapter's Section Challenge (see the Chapter Index above).

## Where The Math Is Used Elsewhere

Applied linear algebra in other repo modules:

- `25_Python_ML_DL_NLP/04_Math_For_ML.md` — vectors, matrices, dot product
- `25_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md` — gradient descent geometry, eigenvectors
- `25_Python_ML_DL_NLP/06_ML_Algorithms.md` §5 — PCA application
