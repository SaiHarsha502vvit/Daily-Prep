# Chapter 14 — SVD Applications

> [< Previous: 13 SVD Definition](13_SVD_Definition.md) | [Course Index](README.md)

---

## SVD as a Universal Tool

The SVD A = UΣVᵀ is not just a mathematical curiosity — it is the engine powering image compression, recommendation systems, NLP, search engines, and numerical solvers. This chapter applies SVD to four major domains:

1. **Low-rank approximation** — compress data while preserving most information
2. **The pseudoinverse** — solve any least squares problem, even for rank-deficient matrices
3. **PCA via SVD** — the numerically stable approach to Principal Component Analysis
4. **Search engines (LSA)** — Latent Semantic Analysis for document retrieval

---

## 1. Low-Rank Approximation (Eckart–Young Theorem)

**Setup:** You have matrix A ∈ ℝᵐˣⁿ with SVD A = UΣVᵀ. The outer product form:

**A = σ₁u₁v₁ᵀ + σ₂u₂v₂ᵀ + ... + σᵣuᵣvᵣᵀ**

Each term σᵢuᵢvᵢᵀ is a **rank-1 matrix** (outer product of two vectors).

**Question:** What is the closest rank-k matrix to A (in the Frobenius norm ||A-B||_F² = Σᵢⱼ(Aᵢⱼ-Bᵢⱼ)²)?

**Eckart–Young Theorem:** The best rank-k approximation to A is:

**Aₖ = σ₁u₁v₁ᵀ + σ₂u₂v₂ᵀ + ... + σₖuₖvₖᵀ**

The approximation error is:

**||A - Aₖ||_F² = σₖ₊₁² + σₖ₊₂² + ... + σᵣ²**

**Why this works:** Among all rank-k matrices B, the one minimizing ||A-B||_F is obtained by keeping only the top-k terms of the SVD expansion. The "information" in A is ranked by singular values — σ₁ captures the most, σ₂ second-most, etc. Truncating at k keeps the most important structure.

---

## Image Compression via SVD

An image is a matrix M ∈ ℝᵐˣⁿ (grayscale: pixel intensities). SVD gives M = UΣVᵀ.

**Storage comparison:**
- Full image: m·n numbers
- Rank-k approximation: k·m (U-columns) + k (singular values) + k·n (V-columns) = k(m+n+1) numbers

**Compression ratio:** m·n / [k(m+n+1)]. For a 1080×1920 image with k=50: save 50·3001 ≈ 150K vs 2M pixels — about 13× compression.

```python
import numpy as np
import matplotlib.pyplot as plt

# Simulate a grayscale image
np.random.seed(42)
M = np.zeros((100, 100))
# Create simple pattern: rank-2 structure
for i in range(100):
    for j in range(100):
        M[i,j] = np.sin(i*0.1) * np.cos(j*0.1)

# SVD
U, s, Vt = np.linalg.svd(M, full_matrices=False)

def low_rank_approx(U, s, Vt, k):
    return U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]

# Reconstruct at various ranks
for k in [1, 2, 5, 20]:
    Mk = low_rank_approx(U, s, Vt, k)
    error = np.linalg.norm(M - Mk, 'fro')
    remaining = np.sqrt(sum(sv**2 for sv in s[k:]))  # Eckart-Young error
    print(f"k={k}: ||M-Mk||_F = {error:.4f}, predicted = {remaining:.4f}")
    # They match! ✓

# Energy analysis
total_energy = sum(s**2)
for k in [1, 2, 5, 20]:
    energy_k = sum(s[:k]**2)
    print(f"k={k}: captures {100*energy_k/total_energy:.1f}% of total energy")
```

### Concrete Numerical Example

```
A = | 3  6 |    (a rank-1 matrix of size 2×2 + noise)
    | 4  8 |
    | 0  0.5|

True structure: first two rows = [1,2] · (3,4)... let's examine SVD:

This matrix is approximately rank-1 (columns proportional).
col1 ≈ (3,4,0), col2 ≈ (6,8,0.5)

SVD gives:
σ₁ ≈ 10.7 (dominant — captures the rank-1 structure)
σ₂ ≈ 0.25 (small — captures the noise/deviation in col3)

Best rank-1 approximation:
A₁ = σ₁ · u₁ · v₁ᵀ

This removes the small σ₂ term, giving a clean rank-1 matrix.
The compressed representation stores just u₁ (3 numbers), σ₁ (1 number),
v₁ᵀ (2 numbers) = 6 numbers instead of 3×2 = 6 numbers.
(For this toy example, no compression gain; for 1000×1000, the gain is dramatic.)
```

---

## 2. The Pseudoinverse A⁺

**The problem:** Solve Ax = b where A may be:
- Non-square (more equations than unknowns, or vice versa)
- Rank-deficient (infinitely many least-squares solutions)

The **Moore-Penrose pseudoinverse** A⁺ handles all cases:

**Definition:** Given SVD A = UΣVᵀ with singular values σ₁ ≥ ... ≥ σᵣ > 0 (r = rank(A)):

**A⁺ = V Σ⁺ Uᵀ**

Where Σ⁺ is the "inverse" diagonal: replace each non-zero σᵢ with 1/σᵢ, leave zeros as zeros.

```
Σ = | σ₁  0   0  |     Σ⁺ = | 1/σ₁   0     0  |
    |  0  σ₂  0  |           |  0    1/σ₂   0  |
    |  0   0  0  |           |  0     0     0  |
```

**Properties:**

| Scenario | What A⁺ gives |
|----------|---------------|
| A square, invertible | A⁺ = A⁻¹ (exact) |
| A overdetermined, full column rank | A⁺b = (AᵀA)⁻¹Aᵀb (least-squares solution) |
| A underdetermined, full row rank | A⁺b = Aᵀ(AAᵀ)⁻¹b (minimum-norm solution) |
| A rank-deficient | A⁺b = minimum-norm least-squares solution |

The pseudoinverse gives the "best" solution in every case — no special cases needed.

### Why A⁺ = VΣ⁺Uᵀ Works

```
AA⁺ = UΣVᵀ · VΣ⁺Uᵀ = UΣΣ⁺Uᵀ

ΣΣ⁺ = | σ₁  0 | | 1/σ₁  0 | = | 1  0 |   (r×r identity block, zeros below)
       |  0  0 | |  0    0 |   | 0  0 |

AA⁺ = U | Iᵣ   0  | Uᵀ = projection onto C(A)
         |  0   0  |

Similarly, A⁺A = V | Iᵣ  0 | Vᵀ = projection onto C(Aᵀ) (the row space)
                    |  0  0 |
```

AA⁺ projects onto C(A); A⁺A projects onto C(Aᵀ). The pseudoinverse is the "right" generalization of the inverse for any matrix.

### Numerical Example

```
A = | 1  2 |    b = | 5 |
    | 3  4 |        |11 |
    | 5  6 |        |17 |

(3×2 overdetermined system, full column rank)

SVD: A = UΣVᵀ (computed numerically)
σ₁ ≈ 9.53, σ₂ ≈ 0.51

A⁺ = VΣ⁺Uᵀ

x̂ = A⁺b = (AᵀA)⁻¹Aᵀb  (since A has full column rank)

AᵀA = | 1  3  5 || 1  2 | = | 35  44 |
      | 2  4  6 || 3  4 |   | 44  56 |
                 | 5  6 |

Aᵀb = | 1·5+3·11+5·17 | = | 5+33+85 | = | 123 |
      | 2·5+4·11+6·17 |   | 10+44+102|   | 156 |

det(AᵀA) = 35·56 - 44² = 1960 - 1936 = 24

(AᵀA)⁻¹ = (1/24)| 56  -44 |
                  |-44   35 |

x̂ = (1/24)| 56  -44 || 123 | = (1/24)| 56·123 - 44·156 |
           |-44   35 || 156 |         |-44·123 + 35·156 |

= (1/24)| 6888 - 6864 | = (1/24)| 24 | = | 1 |
        |-5412 + 5460 |         | 48 |   | 2 |

x̂ = (1, 2)

Verify: A(1,2)ᵀ = (5, 11, 17) = b ✓  (perfect fit — b ∈ C(A)!)
```

```python
import numpy as np

A = np.array([[1,2],[3,4],[5,6]], dtype=float)
b = np.array([5, 11, 17], dtype=float)

# Pseudoinverse
A_plus = np.linalg.pinv(A)  # internally uses SVD
x_hat = A_plus @ b
print(x_hat)  # [1., 2.]

# Alternatively (same result for full-column-rank case)
x_lstsq, *_ = np.linalg.lstsq(A, b, rcond=None)
print(x_lstsq)  # [1., 2.]
```

---

## 3. PCA via SVD (The Production Method)

In Chapter 12, we computed PCA by:
1. Form covariance matrix C = X̃ᵀX̃/n
2. Eigendecompose C = QΛQᵀ
3. Principal components = columns of Q

The problem: forming X̃ᵀX̃ squares the condition number of X̃. For ill-conditioned data, this causes numerical errors.

**The SVD approach:**

Apply SVD directly to the centered data matrix X̃:

**X̃ = UΣVᵀ**

Then: X̃ᵀX̃ = VΣUᵀUΣVᵀ = VΣ²Vᵀ

So the columns of V ARE the eigenvectors of X̃ᵀX̃ (= principal components), and the eigenvalues of the covariance matrix are Σ²/n.

```python
import numpy as np

def pca_svd(X, k):
    """PCA via SVD — numerically stable."""
    n = X.shape[0]
    mu = X.mean(axis=0)
    X_centered = X - mu
    
    # SVD of centered data (NOT of X.T @ X)
    U, s, Vt = np.linalg.svd(X_centered, full_matrices=False)
    
    # Principal components (right singular vectors)
    components = Vt[:k].T           # shape (d, k)
    
    # Scores (projections)
    scores = U[:, :k] * s[:k]       # shape (n, k) — equivalent to X_centered @ components
    
    # Explained variance
    variance = s**2 / n
    total_var = variance.sum()
    explained_ratio = variance[:k] / total_var
    
    return components, scores, explained_ratio

# Example: iris-like dataset
np.random.seed(0)
X = np.random.randn(150, 4) @ np.array([[2,1,0,0],[0,1.5,0,0],[0,0,0.5,0],[0,0,0,0.3]])
components, scores, ratios = pca_svd(X, k=2)
print(f"PC1: {ratios[0]:.1%} variance, PC2: {ratios[1]:.1%} variance")
```

**Why this is better:** The condition number of X̃ is κ, so condition number of X̃ᵀX̃ is κ². For data with condition number 1000 (common in sensor data), computing X̃ᵀX̃ has condition number 10⁶ — losing 6 significant digits. SVD directly on X̃ avoids this.

**scikit-learn** uses SVD internally for `sklearn.decomposition.PCA`. Never use `np.linalg.eigh(X.T @ X)` for PCA in production.

---

## 4. Latent Semantic Analysis (LSA) for Search Engines

**Problem:** Traditional keyword search fails when queries and documents use different words for the same concept ("car" vs "automobile").

**LSA Solution:** Use SVD to find latent (hidden) semantic structure.

### Setup

Build a **term-document matrix** A where:
- Rows = words (terms)
- Columns = documents
- Aᵢⱼ = TF-IDF weight of word i in document j (or raw count)

```
            Doc1   Doc2   Doc3   Doc4
  car        2      0      0      1
  auto       0      1      0      0
  driver     1      1      0      1
  engine     1      0      1      0
  fuel       0      0      2      0
  road       1      1      0      2
```

A = [[2,0,0,1],[0,1,0,0],[1,1,0,1],[1,0,1,0],[0,0,2,0],[1,1,0,2]]

### SVD Reveals Latent Topics

```
A = UΣVᵀ

U (term-topic matrix): column k = "topic k" in word space
V (doc-topic matrix): column k = "topic k" in document space
Σ: importance of each topic

Low-rank approximation Aₖ = Uₖ Σₖ Vₖᵀ groups semantically related words
together even if they don't appear in the same documents.

Topic 1 (highest σ₁) might correspond to "transportation" —
with high weights for car, auto, driver, road.

Topic 2 (σ₂) might correspond to "engines/fuel" —
with high weights for engine, fuel.
```

### Query and Retrieval

To find documents relevant to query q (a new word vector):

1. Project q into topic space: q_topics = Σₖ⁻¹ Uₖᵀ q
2. Find documents closest in topic space: cosine similarity with rows of Vₖ
3. Return top-k documents.

```python
import numpy as np

# Term-document matrix (6 terms × 4 docs)
A = np.array([
    [2, 0, 0, 1],   # car
    [0, 1, 0, 0],   # auto
    [1, 1, 0, 1],   # driver
    [1, 0, 1, 0],   # engine
    [0, 0, 2, 0],   # fuel
    [1, 1, 0, 2],   # road
], dtype=float)

# SVD with rank-2 approximation
U, s, Vt = np.linalg.svd(A, full_matrices=False)
k = 2
Uk, sk, Vtk = U[:, :k], s[:k], Vt[:k, :]

# Query: "automobile" (synonym for car/auto)
# "automobile" not in vocabulary — use its semantic representation
# Assume "automobile" loads onto terms: car=1, auto=1, driver=0, ...
q = np.array([1, 1, 0, 0, 0, 0], dtype=float)

# Project query to topic space
q_topics = np.linalg.solve(np.diag(sk), Uk.T @ q)  # shape (k,)

# Document topic vectors (rows of Vtk, each shape (k,))
doc_scores = Vtk.T @ q_topics  # shape (4,) — similarity scores

print("Document relevance scores:", doc_scores)
# Doc 1 and Doc 4 should score highest (they mention "car")
# Doc 2 should also score (mentions "auto")
# Doc 3 (fuel/engine) should score lowest
```

---

## 5. Numerical Rank and Thresholding

**Problem:** Every computed SVD has small but non-zero "singular values" due to floating-point errors. How do you know the true rank?

**Answer:** Choose a threshold ε and count singular values above it.

```python
def numerical_rank(A, threshold=1e-10):
    """Compute numerical rank via SVD thresholding."""
    _, s, _ = np.linalg.svd(A)
    # Normalize threshold relative to largest singular value
    tol = threshold * s[0]
    return np.sum(s > tol)

# Example: rank-2 matrix corrupted by floating-point noise
U_true = np.random.randn(100, 2)
V_true = np.random.randn(50, 2)
A_rank2 = U_true @ V_true.T
A_noisy = A_rank2 + 1e-12 * np.random.randn(100, 50)

print(numerical_rank(A_noisy))  # Should print 2 (ignores the 1e-12 noise)
print(numerical_rank(A_noisy, threshold=1e-14))  # Might print higher — too tight
```

NumPy's `np.linalg.matrix_rank` does exactly this internally.

---

## Section Challenge

> ### SVD-Powered Recommendation System
>
> A music streaming service records user-song ratings (1-5 stars). The rating matrix R (users × songs) has many missing entries (users haven't rated every song). This is a **matrix completion** problem — approximate R with a low-rank matrix.
>
> ```
> R = | 5  4  ?  1  1 |    ? = unrated
>     | 4  5  ?  2  1 |
>     | ?  ?  4  5  5 |
>     | 1  1  5  4  ? |
>     | 1  2  4  ?  4 |
> ```
>
> **Q1:** Replace the missing entries with the column means (a common preprocessing step). Call this matrix R̃.
>
> **Q2:** Center each row of R̃ by subtracting the row mean. This adjusts for different user rating scales.
>
> **Q3:** Compute the rank-1 approximation R̃₁ (by hand or describe the computation).
>
> **Q4:** The two large singular values suggest two latent factors. Looking at the rating patterns, what might the two latent "taste dimensions" represent?
>
> **Q5 (Stretch):** A new user rates: Song 1 = 5, Song 2 = 4 (and the rest unknown). How would you predict their rating for Song 4 using the SVD latent space?

<details>
<summary>Full answers</summary>

```
Q1: Fill missing entries with column means

Column means (ignoring ?):
Col 1: (5+4+1+1)/4 = 2.75
Col 2: (4+5+1+2)/4 = 3.0
Col 3: (4+4+5)/3 = 4.33
Col 4: (1+2+5+4)/4 = 3.0
Col 5: (1+1+5+4)/4 = 2.75

R̃ = | 5    4    4.33  1    1    |
     | 4    5    4.33  2    1    |
     | 2.75 3.0  4     5    5    |
     | 1    1    5     4    2.75 |
     | 1    2    4     3.0  4    |

────────────────────────────────────────────

Q2: Center by subtracting row means

Row means:
R̃ row means:
  Row 1: (5+4+4.33+1+1)/5 = 3.066
  Row 2: (4+5+4.33+2+1)/5 = 3.266
  Row 3: (2.75+3+4+5+5)/5 = 3.95
  Row 4: (1+1+5+4+2.75)/5 = 2.75
  Row 5: (1+2+4+3+4)/5 = 2.8

Centered R̃ (approximately):
       S1     S2    S3    S4    S5
U1: [ 1.93   0.93  1.26 -2.07 -2.07]  (likes pop, dislikes rock)
U2: [ 0.73   1.73  1.07 -1.27 -2.27]  (similar taste to U1)
U3: [-1.20  -0.95  0.05  1.05  1.05]  (opposite: likes rock)
U4: [-1.75  -1.75  2.25  1.25  0.00]  (likes rock, neutral on S5)
U5: [-1.80  -0.80  1.20  0.20  1.20]  (mild rock preference)

────────────────────────────────────────────

Q3: Rank-1 approximation

Rank-1 SVD: A₁ = σ₁u₁v₁ᵀ

The dominant singular vector captures the main variance direction.
Looking at the data: users split into "pop" (high S1,S2) and "rock" (high S3,S4,S5).

σ₁ captures this pop/rock split.
u₁: reflects user preferences (+big for pop lovers, -big for rock lovers)
v₁: reflects song genre (+big for pop songs, -big for rock songs)

The rank-1 approximation would reconstruct a matrix where
pop lovers × pop songs = high predicted rating,
rock lovers × rock songs = high predicted rating,
and cross-genre predictions are low.

────────────────────────────────────────────

Q4: Two latent taste dimensions

Given two significant singular values σ₁ >> σ₂ > 0:

DIMENSION 1 (σ₁, dominant):
  Users U1, U2 have positive scores (high ratings for S1, S2 = "pop")
  Users U3, U4, U5 have negative scores (high ratings for S3, S4, S5 = "rock/alternative")
  
  This is a "pop vs. rock" dimension.

DIMENSION 2 (σ₂):
  U4 rates S3 extremely high (5) but S5 only 2.75 (gap within "rock")
  U3 rates S4 AND S5 high equally (5, 5)
  
  This might be "metal/hard rock vs. indie/soft rock" within the rock dimension.
  Or it could capture another nuance: "electronic vs. acoustic."

The first factor captures 80-90% of variance; the second captures another 5-10%.
Two dimensions suffice to model most of the user preferences.

────────────────────────────────────────────

Q5: New user song prediction

New user: q = (5, 4, ?, ?, ?) → fill with col means → center

We only know S1=5, S2=4. Fill S3, S4, S5 with their column means: 4.33, 3.0, 2.75.
Row mean of new user ≈ (5+4+4.33+3.0+2.75)/5 = 3.82.
Centered new user: x_new = (1.18, 0.18, 0.51, -0.82, -1.07)

Project to SVD latent space:
x_topics = Σₖ⁻¹ Uₖᵀ x_new

Predicted ratings for all songs:
r_pred = x_topics · Vₖᵀ  (+ add back row mean and column means)

For Song 4 (S4): the new user resembles U1 and U2 (pop fans) based on their
high S1/S2 ratings. Pop fans gave S4 low ratings (1-2 stars).
Predicted rating for S4: likely LOW (≈ 1-2).

For Song 3 (S3): rock song, pop fan would likely rate ≈ 3-4 (lower than rock fans).

This is exactly how collaborative filtering in recommendation systems works:
find where a user sits in latent taste space → predict unseen ratings from
similar users' behavior → recommend highest-predicted songs.
```

</details>

---

## Summary: When to Use Which Decomposition

| Situation | Best decomposition | Reason |
|-----------|-------------------|--------|
| Symmetric matrix | Spectral theorem A = QΛQᵀ | Simpler, orthogonal Q |
| Square invertible matrix | LU or eigendecomposition | Context-dependent |
| Least squares (full rank A) | QR decomposition | Stable, fast |
| Least squares (rank-deficient A) | SVD → pseudoinverse | Universal |
| Data analysis / compression | SVD | Best low-rank approximation |
| PCA (production) | SVD on X̃ | Avoids squaring condition number |
| Recommendation systems | SVD | Latent factor discovery |
| Checking rank numerically | SVD | Only stable rank detection method |

---

## Common Mistakes

**Mistake 1: Confusing SVD with eigendecomposition**
- SVD: A = UΣVᵀ, works for any m×n matrix. U and V are different.
- Eigendecomposition: A = PDP⁻¹, only for square matrices. P's columns are eigenvectors. P may not be orthogonal.
- For symmetric A: they coincide with U=V=Q and σᵢ = |λᵢ|.

**Mistake 2: Using `np.linalg.eig(A.T @ A)` to get singular values**
- This squares the condition number. For ill-conditioned A, the singular values computed this way are inaccurate.
- Always use `np.linalg.svd(A)` directly.

**Mistake 3: Applying low-rank approximation to sparse data without care**
- SVD-based approximation makes dense matrices from sparse ones. For million×million matrices (Netflix), this is memory-infeasible. Use stochastic SVD (randomized algorithms) or matrix factorization (ALS, SGD).

**Mistake 4: Forgetting to center and scale before SVD/PCA**
- Without centering: PC1 captures the mean, not variance.
- Without standardizing features: features with large numeric range dominate. Consider `StandardScaler` before PCA.

---

## Course Summary: The Linear Algebra Arc

Looking back across all 14 chapters:

| Unit | Chapters | Core Question |
|------|----------|---------------|
| **Foundations** | 01-03 | What ARE vectors, independence, and subspaces? |
| **Matrices** | 04-07 | How do linear transformations work? How do we solve Ax = b? |
| **Orthogonality** | 08-09 | What's the "nicest" coordinate system? What's the closest solution? |
| **Eigenstructure** | 10-12 | What does a transformation fundamentally DO in its natural directions? |
| **SVD** | 13-14 | The universal decomposition: works for ANY matrix, any shape, any rank |

Every chapter was preparation for SVD. The singular value decomposition unifies:
- Linear systems (via pseudoinverse)
- Least squares (via optimal solution)
- Dimensionality reduction (via low-rank approximation)
- Spectral theory (as generalization of eigendecomposition)

Master the SVD and you understand the engine that powers most of modern data science.

---

## Connections (Complete Arc)

- **Chapter 01 — Vectors:** The raw material. Singular vectors are special vectors in input/output spaces.
- **Chapter 02 — Independence:** Rank = number of independent singular directions (non-zero σᵢ).
- **Chapter 03 — Subspaces:** SVD explicitly gives bases for all four fundamental subspaces.
- **Chapter 05 — Linear Systems:** Pseudoinverse solves the "best" system when no exact solution exists.
- **Chapter 08 — Gram-Schmidt:** The U and V matrices in SVD have orthonormal columns — they're the "ideal" orthonormal bases for input and output spaces.
- **Chapter 09 — Least Squares:** A⁺ = VΣ⁺Uᵀ is the most general least-squares formula.
- **Chapter 12 — Spectral Theorem:** SVD for symmetric PSD matrices = spectral theorem. A = UΣVᵀ with U=V.

---

> [< Previous: 13 SVD Definition](13_SVD_Definition.md) | [Course Index](README.md)
>
> **CSE103 Linear Algebra — COMPLETE** ✓
