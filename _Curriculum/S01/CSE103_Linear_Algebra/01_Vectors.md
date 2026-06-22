# Chapter 01 — Vectors: Two Views of the Same Arrow

> [Course Index](README.md) | [Next → 02 Linear Independence & Basis](02_Linear_Independence_Basis.md)

---

## The Problem Vectors Solve

You're building a physics simulation. A character is at position (3, 4) on your screen. They jump with velocity (2, 5) — meaning 2 units per second right and 5 units per second up. After 1 second, where are they?

You add component-wise: (3+2, 4+5) = (5, 9). Easy.

Now add gravity: -9.8 meters/second² downward, or (0, -9.8) per second². After 1 second of acceleration, new velocity is (2, 5-9.8) = (2, -4.8). The character is now falling.

Every physical quantity that has BOTH a magnitude AND a direction — velocity, force, displacement, acceleration, electric field — is a **vector**. The rules of vector algebra give you a consistent way to add them, scale them, and measure angles between them.

This course starts with vectors because everything else — matrices, eigenvectors, SVD — is built from vectors. Understanding what a vector IS (not just what the formulas say) is the foundation.

---

## Two Views of a Vector

A vector can be seen two ways. You must switch between them fluidly.

### View 1: Geometric — An Arrow in Space

A vector is an **arrow with a specific length (magnitude) and direction**.

The arrow starts somewhere (its "tail") and points somewhere (its "head"). Critically: ONLY the length and direction matter, NOT where the tail is. Moving an arrow to a new starting position without changing its length or direction gives you the SAME vector.

```
   ↗  (2, 3)     ↗  (2, 3)     ↗  (2, 3)
   ↑             ↑             ↑
All three arrows are the SAME vector — identical length and direction.
```

**Why this matters:** A force of 10N pushing north is the same force regardless of where in the room it's applied. The PHYSICAL CONTENT is length + direction, not location.

### View 2: Algebraic — A List of Components

In a coordinate system with basis directions (x̂, ŷ in 2D), a vector is expressed as a list of components: v = (v₁, v₂, ..., vₙ).

```
v = (3, 4)  means: 3 units in the x-direction, 4 units in the y-direction
```

The components are the **coordinates of the arrowhead if you place the tail at the origin**.

**Critical insight:** The SAME arrow has DIFFERENT components in different coordinate systems. Tilt your axes 45°, and a vector pointing northeast (1, 1) now looks like (√2, 0) in the rotated system. Same arrow, different numbers. This is why it matters which coordinate system you're in.

---

## Vector Operations: Algebraic + Geometric

### Vector Addition: Two Ways to See the Same Thing

**Algebraic:** Add components: (a₁, a₂) + (b₁, b₂) = (a₁+b₁, a₂+b₂)

**Geometric:** Place the tail of **b** at the head of **a**. The sum **a + b** is the arrow from the original tail to the new head (the "tip-to-tail" or "parallelogram" rule).

```
     b
   ↗
  ↗
 ↗
a ────────→

"Tip-to-tail": put b's tail at a's head

a + b = the diagonal
        from a's tail to b's head
```

**Why this matches physics:** If you drive 3km east then 4km north, your DISPLACEMENT is 3km east + 4km north = vector (3, 4). You didn't teleport — you moved sequentially, and vector addition captures that.

**Properties:**
- Commutativity: a + b = b + a (parallelogram diagonal is the same both ways)
- Associativity: (a + b) + c = a + (b + c)
- Zero vector: a + 0 = a (the zero vector has length 0, no direction)
- Negation: a + (-a) = 0 (-a is the arrow pointing the opposite direction)

---

### Scalar Multiplication: Stretching and Shrinking

**Algebraic:** c · (v₁, v₂) = (c·v₁, c·v₂) — multiply every component by the scalar c.

**Geometric:** Scale the arrow's length by |c|. If c < 0, also flip the direction.

```
v = (2, 1)      ──→

2v = (4, 2)     ──────────→    (twice as long, same direction)

-v = (-2, -1)   ←──            (flipped)

0.5v = (1, 0.5) →              (half as long)
```

**Combining addition and scaling (linear combinations):**

2v + 3w = 2·(2, 1) + 3·(1, 3) = (4, 2) + (3, 9) = (7, 11)

Every vector you can reach by any combination αv + βw (for any real α, β) is called the **span** of {v, w} — we'll study this in Chapter 02.

---

## Magnitude (Norm): How Long Is the Arrow?

The magnitude (or norm, or length) of a vector:

**||v|| = √(v₁² + v₂² + ... + vₙ²)**

For v = (3, 4): ||v|| = √(9 + 16) = √25 = 5.

This is the Pythagorean theorem generalized to n dimensions. In 2D: the length of the hypotenuse. In 3D: distance from origin to point (v₁, v₂, v₃). In n dimensions: same formula.

```
      (3, 4)
     /|
  5 / |  4
   /  |
  /   |
  ────
   3

Length = √(3² + 4²) = 5  ← the classic 3-4-5 right triangle
```

**Distance between two vectors a and b:**

d(a, b) = ||a - b|| = √Σ(aᵢ - bᵢ)²

This is Euclidean distance. In machine learning, it's a similarity measure — closer vectors are more similar.

---

## Unit Vectors: Pure Direction

A **unit vector** has magnitude exactly 1. It captures only the direction of an arrow, not its length.

**Normalize a vector:** û = v / ||v||

```
v = (3, 4)
||v|| = 5
û = (3/5, 4/5) = (0.6, 0.8)

Check: ||û|| = √(0.36 + 0.64) = √1 = 1 ✓
```

**Standard basis vectors:**
- ê₁ = (1, 0, 0, ...) — points along the first axis
- ê₂ = (0, 1, 0, ...) — points along the second axis
- ...

Every vector is a linear combination of basis vectors: v = v₁ê₁ + v₂ê₂ + ...

**NumPy:**
```python
import numpy as np

v = np.array([3, 4])
norm = np.linalg.norm(v)    # 5.0
unit = v / norm              # [0.6, 0.8]
```

---

## The Dot Product: Measuring Alignment

The **dot product** (inner product) of two vectors:

**a · b = a₁b₁ + a₂b₂ + ... + aₙbₙ**

This produces a **scalar** (a single number), not a vector.

### Geometric Meaning: a · b = ||a|| · ||b|| · cos(θ)

Where θ is the angle between a and b.

**Why is this the same as the sum of products?** Proof via the law of cosines:

```
Triangle with sides ||a||, ||b||, ||a-b||:
  ||a - b||² = ||a||² + ||b||² - 2||a||·||b||·cos(θ)      ← law of cosines

Also:
  ||a - b||² = (a - b)·(a - b)
             = a·a - 2(a·b) + b·b
             = ||a||² - 2(a·b) + ||b||²

Setting equal, cancel ||a||² + ||b||²:
  -2(a·b) = -2||a||·||b||·cos(θ)
     a·b  =  ||a||·||b||·cos(θ)  ✓
```

### The Angle Interpretation

| dot product | angle | meaning |
|-------------|-------|---------|
| a · b > 0 | θ < 90° | vectors point in similar direction |
| a · b = 0 | θ = 90° | vectors are **perpendicular** (orthogonal) |
| a · b < 0 | θ > 90° | vectors point in opposite-ish directions |

**Cosine similarity:** cos(θ) = (a · b) / (||a|| · ||b||)

This is how search engines compare query vectors to document vectors, how recommendation systems compare users to items, how word embeddings measure semantic similarity.

```python
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

king = np.array([0.3, 0.8, 0.1])   # word embedding (simplified)
queen = np.array([0.2, 0.9, 0.15])
man = np.array([0.7, 0.1, 0.2])

print(cosine_similarity(king, queen))  # high — similar semantics
print(cosine_similarity(king, man))    # lower — less similar
```

### Projection: The Component of a Along b

The projection of **a** onto **b** is the "shadow" of a in the direction of b:

**proj_b(a) = (a · b / ||b||²) · b**

The scalar (a · b / ||b||²) is how much of b you need. Multiply by b to get the projected vector.

```
        a
       /|
      / |
     /  | (residual — perpendicular to b)
    /   |
   /θ   |
b ──────┴──────────→

proj_b(a) = the bottom edge (the part of a in b's direction)
```

Projection is the core operation behind:
- Gram-Schmidt orthogonalization (Chapter 08)
- Linear regression: projecting data onto the feature space (Chapter 09)
- Principal Component Analysis: projecting onto eigenvectors (Chapter 12)

---

## Vectors in Code

### Python / NumPy

```python
import numpy as np

# Create vectors
v = np.array([3, 4, 0])
w = np.array([1, 2, 5])

# Operations
print(v + w)           # [4, 6, 5]  — addition
print(2 * v)           # [6, 8, 0]  — scaling
print(np.dot(v, w))    # 3*1 + 4*2 + 0*5 = 11
print(np.linalg.norm(v))  # 5.0
print(v / np.linalg.norm(v))  # unit vector [0.6, 0.8, 0]
```

### TypeScript

```typescript
type Vec = number[];

const add = (a: Vec, b: Vec): Vec => a.map((ai, i) => ai + b[i]);
const scale = (c: number, v: Vec): Vec => v.map(vi => c * vi);
const dot = (a: Vec, b: Vec): number => a.reduce((sum, ai, i) => sum + ai * b[i], 0);
const norm = (v: Vec): number => Math.sqrt(dot(v, v));
const normalize = (v: Vec): Vec => scale(1 / norm(v), v);

const pos: Vec = [3, 4, 0];
const vel: Vec = [2, 5, 0];
const gravity: Vec = [0, -9.8, 0];

// Physics: position after 1 second at constant velocity + gravity acceleration
const newVel = add(vel, scale(1, gravity));   // [2, -4.8, 0]
const newPos = add(pos, scale(1, newVel));    // [5, -0.8, 0]
```

---

## Section Challenge

> ### Recommendation System Warm-Up
>
> You're building a simple movie recommendation system. Each movie is represented as a 5-dimensional vector, where dimensions are (Action, Comedy, Drama, SciFi, Horror) intensity scores from 0 to 1.
>
> ```
> Iron Man:   [0.9, 0.2, 0.1, 0.7, 0.0]
> Titanic:    [0.2, 0.1, 0.9, 0.0, 0.0]
> Interstellar: [0.3, 0.0, 0.7, 0.9, 0.0]
> Alien:      [0.4, 0.0, 0.3, 0.6, 0.8]
>
> User preference: [0.8, 0.1, 0.2, 0.6, 0.0]
> (this user likes action and sci-fi, dislikes horror)
> ```
>
> **Question 1:** Compute the dot product of the user preference vector with each movie vector.
>
> **Question 2:** Compute the cosine similarity between the user and each movie. Which movie is recommended?
>
> **Question 3:** Why does cosine similarity sometimes give a different ranking than the raw dot product?
>
> **Question 4:** What does it mean geometrically when two movie vectors have cosine similarity close to 1?

<details>
<summary>Full derivation + answers</summary>

```
SETUP: user u = [0.8, 0.1, 0.2, 0.6, 0.0]

QUESTION 1: Dot products

Iron Man v₁ = [0.9, 0.2, 0.1, 0.7, 0.0]:
  u · v₁ = 0.8×0.9 + 0.1×0.2 + 0.2×0.1 + 0.6×0.7 + 0.0×0.0
          = 0.72 + 0.02 + 0.02 + 0.42 + 0
          = 1.18

Titanic v₂ = [0.2, 0.1, 0.9, 0.0, 0.0]:
  u · v₂ = 0.8×0.2 + 0.1×0.1 + 0.2×0.9 + 0.6×0.0 + 0.0×0.0
          = 0.16 + 0.01 + 0.18 + 0 + 0
          = 0.35

Interstellar v₃ = [0.3, 0.0, 0.7, 0.9, 0.0]:
  u · v₃ = 0.8×0.3 + 0.1×0.0 + 0.2×0.7 + 0.6×0.9 + 0.0
          = 0.24 + 0 + 0.14 + 0.54 + 0
          = 0.92

Alien v₄ = [0.4, 0.0, 0.3, 0.6, 0.8]:
  u · v₄ = 0.8×0.4 + 0.1×0.0 + 0.2×0.3 + 0.6×0.6 + 0.0×0.8
          = 0.32 + 0 + 0.06 + 0.36 + 0
          = 0.74

Dot product ranking: Iron Man (1.18) > Interstellar (0.92) > Alien (0.74) > Titanic (0.35)

──────────────────────────────────────────────────────────

QUESTION 2: Cosine similarity (u · v) / (||u|| × ||v||)

||u|| = √(0.64 + 0.01 + 0.04 + 0.36 + 0) = √1.05 ≈ 1.025

||v₁|| = √(0.81 + 0.04 + 0.01 + 0.49 + 0) = √1.35 ≈ 1.162
cos(u, v₁) = 1.18 / (1.025 × 1.162) ≈ 1.18 / 1.191 ≈ 0.991

||v₃|| = √(0.09 + 0 + 0.49 + 0.81 + 0) = √1.39 ≈ 1.179
cos(u, v₃) = 0.92 / (1.025 × 1.179) ≈ 0.92 / 1.208 ≈ 0.762

||v₄|| = √(0.16 + 0 + 0.09 + 0.36 + 0.64) = √1.25 ≈ 1.118
cos(u, v₄) = 0.74 / (1.025 × 1.118) ≈ 0.74 / 1.146 ≈ 0.645

||v₂|| = √(0.04 + 0.01 + 0.81 + 0 + 0) = √0.86 ≈ 0.927
cos(u, v₂) = 0.35 / (1.025 × 0.927) ≈ 0.35 / 0.950 ≈ 0.368

Cosine ranking: Iron Man (0.991) > Interstellar (0.762) > Alien (0.645) > Titanic (0.368)
Same ranking here, but the relative gaps are different.

Recommendation: Iron Man (highest cosine similarity ≈ 0.991 — very close to 1, nearly aligned)

──────────────────────────────────────────────────────────

QUESTION 3: Why dot product vs cosine similarity differ

The dot product u·v = ||u||·||v||·cos(θ) includes BOTH the angle AND the magnitudes.

A movie with many high-intensity scores (high magnitude) will have a high dot product
even if the DIRECTION (preference alignment) is mediocre.

Example: if we had a movie [1.0, 1.0, 1.0, 1.0, 1.0] (all genres at max intensity),
its dot product with any user vector would be large just because its magnitude is high.
But it's not specifically aligned with any user preference — it's a "generic" movie.

Cosine similarity normalizes out the magnitudes:
  cos(u, v) = (u·v) / (||u||·||v||)
Only the DIRECTION (angle) matters. Movies that point in the same direction as the
user preference vector — even if they have lower overall intensity — rank higher.

WHEN EACH IS BETTER:
  Use dot product when magnitude matters:
    - "How much total shared content do we have?" (absolute overlap)
    - Popularity weighting: a blockbuster with more coverage might be preferred
  
  Use cosine similarity when direction matters:
    - "Are we aligned in preferences?" (relative profile match)
    - Sparse feature spaces where items have varying density
    - Most recommendation systems use cosine similarity for this reason

──────────────────────────────────────────────────────────

QUESTION 4: Geometric meaning of cosine similarity ≈ 1

cos(θ) ≈ 1 means θ ≈ 0° — the two vectors point in nearly the same direction.

For two movie vectors with cosine similarity ≈ 1:
  They emphasize the SAME genres in the same proportions.
  If someone likes one, they'll almost certainly like the other.
  
  Example: two "action-heavy sci-fi" films point in the same direction in genre-space.
  The user's preferences cluster around that direction too → high cosine similarity.

This is the geometric foundation of collaborative filtering:
  "Users who have similar preference vectors (small angle) like similar movies."
  Finding the nearest vectors (most aligned) = finding the recommendation cluster.

EDGE CASE TO WATCH:
  If either vector has near-zero magnitude (a user who hasn't rated anything, or a
  movie with no genre tags), the cosine similarity is numerically unstable (dividing by
  a near-zero norm). Production systems always check ||v|| > ε before computing cosine similarity.
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking vectors have a fixed location**
- A vector is just a direction and magnitude. Moving the tail to a different starting point does NOT change the vector. Only when you pin a vector to a specific point (a "position vector" or "bound vector") does location matter.

**Mistake 2: Computing dot product and expecting a vector**
- Dot product always produces a scalar. If you need a vector result from combining two vectors, you want the cross product (Chapter on 3D geometry) or a matrix operation.

**Mistake 3: Forgetting to normalize before cosine similarity**
- cos(u, v) = (u·v) / (||u||·||v||). The denominator normalizes. Using u·v alone is NOT cosine similarity — it includes magnitude effects. Always divide by norms.

**Mistake 4: Treating components as the "real" vector**
- Components depend on the coordinate system. The VECTOR itself (the arrow) is coordinate-independent. This trips students up in Chapter 04 (matrix transformations) and Chapter 08 (change of basis).

---

## Connections

- **Chapter 02 — Linear Independence:** When can you reach any vector in space by combining a set of vectors? The answer requires understanding what vectors you have and whether they're "redundant" (linearly dependent).
- **Chapter 04 — Matrices:** A matrix TRANSFORMS vectors. Understanding what a vector IS geometrically is essential for understanding what a matrix DOES geometrically.
- **Chapter 08 — Orthogonality:** Orthogonal vectors have dot product 0. Orthogonal bases are maximally "independent" — no component of one basis vector shows up in any other.
- **Chapter 09 — Least Squares:** Projection (a·b/||b||² · b) is the core operation. You're finding the component of a in the direction of b.
- `21_Python_ML_DL_NLP/04_Math_For_ML.md` — This existing file covers §1-4 (vectors and dot products) with ML-specific examples. This chapter provides the geometric foundations that make those formulas make sense.

---

> [Course Index](README.md) | [Next → 02 Linear Independence & Basis](02_Linear_Independence_Basis.md)
