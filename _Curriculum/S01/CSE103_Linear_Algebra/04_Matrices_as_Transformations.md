# Chapter 04 — Matrices as Linear Transformations

> [< Previous: 03 Subspaces, Rank & Null Space](03_Subspaces_Rank_Null_Space.md) | [Course Index](README.md) | [Next → 05 Linear Systems & Gaussian Elimination](05_Linear_Systems_Gaussian_Elimination.md)

---

## The Paradigm Shift

Most students learn matrices as "tables of numbers that you multiply using a dot-product rule." This is technically correct but geometrically wrong. It produces engineers who can execute matrix multiplication without understanding what it MEANS.

**The right mental model: a matrix IS a transformation.**

When you multiply Av, you're not "computing a number" — you're **moving the vector v to a new location**. The matrix A describes WHICH movement.

The "table of numbers" description and the "transformation" description are the same thing seen from different angles. Once you make the transformation view automatic, everything else in linear algebra becomes obvious: why matrix multiplication order matters, why inverses exist only for certain matrices, why eigenvectors are special.

---

## What Is a Linear Transformation?

A function T : ℝⁿ → ℝᵐ is a **linear transformation** if it satisfies two properties:

1. **Additivity:** T(u + v) = T(u) + T(v) for all u, v
2. **Homogeneity:** T(cu) = cT(u) for all scalar c

Together: **T(αu + βv) = αT(u) + βT(v)** — "linear combinations map to linear combinations."

**What this means geometrically:**
- Straight lines stay straight (don't curve).
- The origin stays fixed (T(0) = 0, since T(0) = T(0·u) = 0·T(u) = 0).
- Parallel lines stay parallel.

**What linear transformations CANNOT do:**
- Translate (shift) the origin — that's an "affine" transformation, not linear.
- Curve straight lines.
- "Wrap" or "fold" space.

**Examples:**
```
Linear:     rotation, scaling, reflection, shear, projection
Not linear: translation (moving the origin), f(x) = x + 5, neural network activations (ReLU, sigmoid)
```

---

## Every Linear Transformation IS a Matrix

**Key theorem:** Every linear transformation T : ℝⁿ → ℝᵐ is represented by a unique m×n matrix.

**Why?** Because T is completely determined by what it does to the n standard basis vectors.

If you know T(ê₁), T(ê₂), ..., T(êₙ), you know T(v) for every v:

```
v = v₁ê₁ + v₂ê₂ + ... + vₙêₙ    (any v is a combination of basis vectors)

T(v) = T(v₁ê₁ + ... + vₙêₙ)
     = v₁T(ê₁) + v₂T(ê₂) + ... + vₙT(êₙ)    (by linearity)
```

The matrix A for transformation T has **T(êᵢ) as its i-th column**:

```
A = | T(ê₁) | T(ê₂) | ... | T(êₙ) |
```

This is the ONLY matrix that correctly represents T.

---

## Concrete Transformations and Their Matrices

### Rotation by Angle θ (counterclockwise)

```
Where does rotation send the basis vectors?
  ê₁ = (1,0) → (cos θ, sin θ)
  ê₂ = (0,1) → (-sin θ, cos θ)

Rotation matrix R(θ):
  | cos θ  -sin θ |
  | sin θ   cos θ |

Example: rotate 90° counterclockwise (θ = 90°, cos=0, sin=1):
  R(90°) = | 0  -1 |
           | 1   0 |

Applying to (1, 0): | 0·1 + (-1)·0 | = | 0 |  ✓ (points up)
                    | 1·1 +   0·0  |   | 1 |
```

### Scaling

```
Scale x by factor a, y by factor b:
  ê₁ = (1,0) → (a,0)
  ê₂ = (0,1) → (0,b)

  | a  0 |
  | 0  b |

Uniform scaling (a=b): isotropic scaling — all directions stretched equally.
Scale x only (a=2, b=1): stretches horizontal, leaves vertical unchanged.
Scale by -1 in y (b=-1): reflection across x-axis.
```

### Reflection Across x-axis

```
  ê₁ = (1,0) → (1,0)   (x-axis stays)
  ê₂ = (0,1) → (0,-1)  (y gets flipped)

  | 1   0 |
  | 0  -1 |
```

### Shear (horizontal)

```
"Push" horizontal amount proportional to height.
  ê₁ = (1,0) → (1,0)    (base stays fixed)
  ê₂ = (0,1) → (k,1)    (top gets pushed by k)

  | 1  k |
  | 0  1 |

A unit square becomes a parallelogram:
(0,0)→(1,0)→(1+k,1)→(k,1)→(0,0)  — same area (det = 1)
```

### Projection onto x-axis

```
  ê₁ = (1,0) → (1,0)  (stays)
  ê₂ = (0,1) → (0,0)  (y gets erased)

  | 1  0 |
  | 0  0 |

This LOSES information — no inverse exists (null space = y-axis).
Rank = 1. A rank-deficient transformation.
```

---

## Matrix Multiplication as Transformation Composition

If A applies transformation f and B applies transformation g, then **AB applies g first, then f**:

**(AB)v = A(Bv)**

"Apply B to v, then apply A to the result."

**Why AB ≠ BA in general:**

Right-to-left reading: "B then A" vs "A then B." Different order = different result.

```
Physical example: You're standing at the origin facing north.

R = rotate 90° clockwise    = | 0   1 |
                              |-1   0 |

S = step 1 unit forward, i.e., add (0,1) to position
    — wait, this is a TRANSLATION, not linear!

Let's use two linear transformations:

R = rotate 90° ccw: | 0  -1 |    S = scale x by 2: | 2  0 |
                    | 1   0 |                       | 0  1 |

SR = "rotate, then scale x":
  SR = | 2  0 | · | 0  -1 | = | 0  -2 |
       | 0  1 |   | 1   0 |   | 1   0 |

RS = "scale x, then rotate":
  RS = | 0  -1 | · | 2  0 | = | 0  -1 |
       | 1   0 |   | 0  1 |   | 2   0 |

SR ≠ RS ✓ (different matrices → different transformations)
```

### Computing Matrix Multiplication

(AB)ᵢⱼ = the dot product of row i of A with column j of B.

```
A = | 1  2 |    B = | 5  6 |
    | 3  4 |        | 7  8 |

AB = | 1·5+2·7  1·6+2·8 | = | 19  22 |
     | 3·5+4·7  3·6+4·8 |   | 43  50 |
```

**Why the row-column rule works:** column j of AB = A · (column j of B). And A acts on each column of B as a linear transformation.

---

## Special Matrices

### Identity Matrix Iₙ

The n×n identity matrix has 1s on the diagonal, 0s elsewhere:

```
I₂ = | 1  0 |    I₃ = | 1  0  0 |
     | 0  1 |          | 0  1  0 |
                       | 0  0  1 |
```

**Property:** Iv = v for all v. AI = IA = A for any A. The identity transformation does nothing.

### Transpose Aᵀ

The transpose **flips rows and columns**: (Aᵀ)ᵢⱼ = Aⱼᵢ.

```
A = | 1  2  3 |    Aᵀ = | 1  4 |
    | 4  5  6 |          | 2  5 |
                         | 3  6 |
```

**Key properties:**
- (AB)ᵀ = BᵀAᵀ — order reverses!
- (Aᵀ)ᵀ = A
- If A = Aᵀ: A is **symmetric**. Symmetric matrices have real eigenvalues (Chapter 12 — spectral theorem).

### Orthogonal Matrices

A matrix Q is orthogonal if QᵀQ = I (equivalently, Q⁻¹ = Qᵀ).

**Geometric meaning:** Q preserves lengths and angles — it's a pure rotation or reflection.

Rotation matrices R(θ) are orthogonal: R(θ)ᵀ = R(-θ), and R(θ)·R(-θ) = I. ✓

---

## Linear Transformations in Code

### Image Processing: Pixel Transformation

A 2D image is a function from pixel positions (x,y) to color values. Applying a matrix to every position gives a transformed image.

```python
import numpy as np
from PIL import Image

def apply_transform(image_path: str, matrix: np.ndarray) -> Image:
    """Apply 2x2 linear transformation to pixel coordinates."""
    img = np.array(Image.open(image_path).convert('L'))
    h, w = img.shape
    
    # Create coordinate grid
    y, x = np.mgrid[0:h, 0:w]
    coords = np.stack([x.ravel(), y.ravel()])  # 2 × (h*w) matrix
    
    # Apply transformation (matrix inverse maps output to input coords)
    M_inv = np.linalg.inv(matrix)
    new_coords = M_inv @ coords
    
    # Sample image at new coordinates...
    # (simplified — real code needs interpolation)

# Rotate 30°
theta = np.radians(30)
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])

# Shear
S = np.array([[1, 0.5], [0, 1]])
```

### 3D Graphics Pipeline

A 3D game engine applies matrix transformations to every vertex:

```typescript
// Three.js style: M = P * V * M_model (projection * view * model)
// Each frame:
// 1. Model matrix M_model: object's position/rotation/scale in world space
// 2. View matrix V: move world relative to camera
// 3. Projection matrix P: 3D → 2D perspective

type Mat4 = number[];   // 4×4 matrix

function transformVertex(vertex: [number,number,number], MVP: Mat4): [number,number] {
    // Apply MVP (model-view-projection) matrix
    // Result: 2D screen coordinates
    const [x, y, z] = vertex;
    const w = MVP[12]*x + MVP[13]*y + MVP[14]*z + MVP[15];
    return [
        (MVP[0]*x + MVP[1]*y + MVP[2]*z + MVP[3]) / w,
        (MVP[4]*x + MVP[5]*y + MVP[6]*z + MVP[7]) / w
    ];
}
```

The entire 3D rendering pipeline is matrix multiplication. GLSL shaders running on GPU are just parallel matrix operations.

---

## Section Challenge

> ### Decomposing a Compound Transformation
>
> A graphics engine applies the following transformation to every 2D sprite:
>
> ```
> T = | 0   -2 |
>     | 3    0 |
> ```
>
> **Question 1:** What does T do to the standard basis vectors ê₁ and ê₂? Describe the transformation geometrically.
>
> **Question 2:** T can be written as a composition of simpler transformations (from a library of: rotation, uniform scaling, non-uniform scaling). Write T = A · B where A and B are simpler matrices, and justify your decomposition.
>
> **Question 3:** Apply T to the unit square with corners (0,0), (1,0), (1,1), (0,1). Where do the corners go? What is the area of the transformed shape?
>
> **Question 4:** Is T invertible? If yes, find T⁻¹. If no, explain why not.

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: What does T do to basis vectors?

T(ê₁) = T(1,0) = | 0·1 + (-2)·0 | = | 0 |
                   | 3·1 +   0·0  |   | 3 |

→ ê₁ = (1,0) maps to (0,3): the x-unit vector goes to 3 units UP.

T(ê₂) = T(0,1) = | 0·0 + (-2)·1 | = | -2 |
                   | 3·0 +   0·1  |   |  0 |

→ ê₂ = (0,1) maps to (-2,0): the y-unit vector goes to 2 units LEFT.

GEOMETRIC DESCRIPTION:
  The original x-axis becomes the y-axis (rotated 90° ccw) and scaled by 3.
  The original y-axis becomes the negative x-axis (rotated 90° ccw) and scaled by 2.
  
  This looks like: ROTATE 90° counterclockwise, then NON-UNIFORMLY SCALE
  (scale x by 2, scale y by 3) — but we need to check the order.

──────────────────────────────────────────────────────────

QUESTION 2: Decompose T = A · B

APPROACH: Think of what simple transformations combine to give this.

T = | 0  -2 |
    | 3   0 |

Observation: the columns are (0,3) and (-2,0).
Column 1 is 3 times (0,1). Column 2 is 2 times (-1,0).

ATTEMPT: T = (rotate 90° ccw) · (non-uniform scale)
  R(90°) = | 0  -1 |    Scale = | 3  0 |
           | 1   0 |             | 0  2 |

  R · Scale = | 0  -1 | · | 3  0 | = | 0·3+(-1)·0  0·0+(-1)·2 | = | 0  -2 | ✓
              | 1   0 |   | 0  2 |   | 1·3+  0·0   1·0+  0·2  |   | 3   0 |

T = R(90°) · Scale(3, 2)

WHAT THIS MEANS:
  First scale: x-direction stretched by 3, y-direction stretched by 2.
  Then rotate 90° ccw.

Alternative decomposition:
  T = Scale(2, 3) · R(90°)?
  Scale · R = | 2  0 | · | 0  -1 | = | 0  -2 | ✓ — also works!
              | 0  3 |   | 1   0 |   | 3   0 |
  
  First rotate 90° ccw, then scale x by 2, y by 3.

Both are valid decompositions — demonstrates non-uniqueness of decomposition.

──────────────────────────────────────────────────────────

QUESTION 3: Unit square corners

(0,0) → T(0,0) = (0,0)           (origin stays fixed — always true for linear maps)

(1,0) → T(1,0) = (0·1+(-2)·0, 3·1+0·0) = (0, 3)

(1,1) → T(1,1) = (0·1+(-2)·1, 3·1+0·1) = (-2, 3)

(0,1) → T(0,1) = (0·0+(-2)·1, 3·0+0·1) = (-2, 0)

Transformed shape: (0,0) → (0,3) → (-2,3) → (-2,0) → back to (0,0)
This is a rectangle with width 2 (horizontal) and height 3 (vertical). Area = 6.

Original unit square had area 1.
Transformed area = 6 = |det(T)| × original area.

det(T) = | 0  -2 | = 0·0 - (-2)·3 = 0 + 6 = 6
         | 3   0 |

|det(T)| = 6 ✓ — the determinant IS the area scaling factor.

──────────────────────────────────────────────────────────

QUESTION 4: Is T invertible?

det(T) = 6 ≠ 0 → T IS INVERTIBLE. ✓

For a 2×2 matrix:
  | a  b |⁻¹  =  1/(ad-bc) · |  d  -b |
  | c  d |                    | -c   a |

T⁻¹ = 1/6 · |  0   2 |  =  |  0    1/3 |
             | -3   0 |     | -1/2   0  |

VERIFY: T · T⁻¹ = | 0  -2 | · |  0    1/3 |
                   | 3   0 |   | -1/2   0  |

= | 0·0+(-2)·(-1/2)   0·(1/3)+(-2)·0 |
  | 3·0+  0·(-1/2)    3·(1/3)+  0·0  |

= | 1  0 | = I ✓
  | 0  1 |

GEOMETRIC MEANING OF T⁻¹:
  T⁻¹ is the "undo" transformation. T rotated 90° and scaled;
  T⁻¹ scales by 1/3 in y, 1/2 in x, and rotates 90° clockwise.
  
  In the graphics engine: T⁻¹ maps a screen sprite back to its original position.

WHEN IS A MATRIX NOT INVERTIBLE?
  det(A) = 0 → the transformation collapses space to a lower dimension.
  Example: projection matrix | 1  0 | maps ℝ² to a 1D line.
                             | 0  0 |
  Once you project, information is lost — you can't recover the y-component.
  No inverse exists because no function maps the output 1D line BACK to ℝ² uniquely.
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking matrix multiplication is commutative**
- AB ≠ BA in general. "Apply B then A" is different from "apply A then B."
- Even when both products exist and have the same dimensions, they're usually different matrices.

**Mistake 2: Confusing Mv with MᵀM or MMᵀ**
- Mv is the transformation of v by M. This is the basic operation.
- MᵀM and MMᵀ appear in least squares and PCA — they're formed from M but are different objects.

**Mistake 3: Thinking the identity transformation "doesn't matter"**
- In composition, I is the neutral element: AI = IA = A. It matters when verifying inverses: A·A⁻¹ = I.

**Mistake 4: Using "row reduction of A" as the transformation itself**
- Row reduction is a TOOL for finding null spaces, column spaces, and inverses. The row-reduced form is NOT the same transformation as A. The transformation represented by A is A, not its row echelon form.

---

## Connections

- **Chapter 03 — Subspaces:** The column space C(A) = "set of all Av" = the image of the transformation A. The null space N(A) = "vectors mapped to zero" = the kernel.
- **Chapter 05 — Linear Systems:** Ax = b is "which inputs v map to b under transformation A?" Gaussian elimination finds the answer.
- **Chapter 06 — Determinants:** The determinant of A = signed area (or volume) scaling factor of the transformation A.
- **Chapter 07 — Inverses:** A⁻¹ exists iff A is invertible iff det(A) ≠ 0 iff A doesn't collapse dimensions.
- **Chapter 10-11 — Eigenvalues:** Eigenvectors are the SPECIAL vectors that a transformation merely SCALES (doesn't rotate). They're the "axes" of the transformation.

---

> [< Previous: 03 Subspaces, Rank & Null Space](03_Subspaces_Rank_Null_Space.md) | [Course Index](README.md) | [Next → 05 Linear Systems & Gaussian Elimination](05_Linear_Systems_Gaussian_Elimination.md)
