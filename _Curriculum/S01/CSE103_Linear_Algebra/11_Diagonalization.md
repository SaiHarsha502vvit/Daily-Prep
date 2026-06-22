# Chapter 11 — Diagonalization

> [< Previous: 10 Eigenvalues & Eigenvectors](10_Eigenvalues_Eigenvectors.md) | [Course Index](README.md) | [Next → 12 Spectral Theorem & PCA](12_Spectral_Theorem_PCA.md)

---

## Why Diagonal Matrices Are Easy

A diagonal matrix D acts like a bunch of independent scaling operations:

```
D = | λ₁  0   0  |       Dv = | λ₁v₁ |
    |  0  λ₂  0  |            | λ₂v₂ |
    |  0   0  λ₃ |            | λ₃v₃ |
```

Each component scales independently. No mixing between components. Operations on diagonal matrices are trivially easy:

- **Dᵏ:** just raise each diagonal entry to the k-th power.
- **D⁻¹:** just invert each diagonal entry.
- **det(D):** product of diagonal entries.
- **Eigenvalues of D:** the diagonal entries (D is already triangular).

**The power of diagonalization:** If A is "secretly diagonal" in some basis, we can use the diagonal structure for all computations, then translate back. This is the A = PDP⁻¹ decomposition.

---

## What Diagonalization Means

**Definition:** An n×n matrix A is **diagonalizable** if there exists an invertible matrix P and diagonal matrix D such that:

**A = PDP⁻¹**

Equivalently: **P⁻¹AP = D**

**Where do P and D come from?**
- The **columns of P** are the n linearly independent eigenvectors of A.
- The **diagonal entries of D** are the corresponding eigenvalues.

### Derivation

Suppose A has n linearly independent eigenvectors v₁, ..., vₙ with eigenvalues λ₁, ..., λₙ. Form the matrix P = [v₁ | v₂ | ... | vₙ]. Then:

```
AP = A[v₁ | v₂ | ... | vₙ]
   = [Av₁ | Av₂ | ... | Avₙ]
   = [λ₁v₁ | λ₂v₂ | ... | λₙvₙ]

   = [v₁ | v₂ | ... | vₙ] | λ₁  0  ... 0  |
                           |  0  λ₂ ... 0  |
                           |  .  .  ... .  |
                           |  0  0  ... λₙ |

AP = PD

Multiply both sides on right by P⁻¹ (valid since P is invertible):
A = PDP⁻¹
```

---

## When Is A Diagonalizable?

**A is diagonalizable iff A has n linearly independent eigenvectors.**

This is GUARANTEED when A has n DISTINCT eigenvalues (all different). Eigenvectors for distinct eigenvalues are automatically linearly independent.

When eigenvalues repeat (algebraic multiplicity > 1), it MAY still be diagonalizable if there are enough independent eigenvectors (geometric multiplicity = algebraic multiplicity for each eigenvalue).

**Examples:**

```
Case 1: n distinct eigenvalues → ALWAYS diagonalizable
A = | 4  1 |    λ₁ = 2, λ₂ = 3 (distinct)
    | 2  3 |    → Diagonalizable. ✓

Case 2: Repeated eigenvalue, but enough eigenvectors → STILL diagonalizable
A = | 2  0 |    λ₁ = λ₂ = 2 (repeated)
    | 0  2 |    
    A = 2I, every vector is an eigenvector. E₂ = ℝ² (2D eigenspace).
    → Diagonalizable (A = PDP⁻¹ = P(2I)P⁻¹ = 2I = A). ✓

Case 3: Repeated eigenvalue, too few eigenvectors → NOT diagonalizable (defective)
A = | 2  1 |    Characteristic: (2-λ)² = 0 → λ = 2, multiplicity 2
    | 0  2 |    
    (A - 2I)v = | 0  1 |v = 0 → v₂ = 0, v₁ free → only (1,0) direction
                | 0  0 |
    Only 1 independent eigenvector for λ = 2. Need 2. → NOT diagonalizable. ✗
```

---

## Computing the Diagonalization: Full Example

```
A = | -1   4 |
    | -2   5 |

STEP 1: Find eigenvalues
det(A - λI) = (-1-λ)(5-λ) - (4)(-2)
            = -5 + λ - 5λ + λ² + 8
            = λ² - 4λ + 3
            = (λ-1)(λ-3)

λ₁ = 1, λ₂ = 3

STEP 2: Find eigenvectors

For λ₁ = 1:
(A - I)v = 0:  | -2   4 |v = 0 → -2v₁ + 4v₂ = 0 → v₁ = 2v₂
               | -2   4 |
v₁ = (2, 1)

For λ₂ = 3:
(A - 3I)v = 0: | -4   4 |v = 0 → -4v₁ + 4v₂ = 0 → v₁ = v₂
               | -2   2 |
v₂ = (1, 1)

STEP 3: Form P and D
P = | 2  1 |    D = | 1  0 |
    | 1  1 |        | 0  3 |

STEP 4: Compute P⁻¹
det(P) = 2·1 - 1·1 = 1
P⁻¹ = |  1  -1 |
       | -1   2 |

STEP 5: Verify A = PDP⁻¹
PD = | 2  1 || 1  0 | = | 2  3 |
     | 1  1 || 0  3 |   | 1  3 |

PDP⁻¹ = | 2  3 ||  1  -1 | = | 2-3   -2+6 | = | -1  4 | = A ✓
         | 1  3 || -1   2 |   | 1-3   -1+6 |   | -2  5 |
```

---

## Computing Powers of A via Diagonalization

**The killer app:** Computing Aᵏ for large k.

**Direct method:** Aᵏ requires k-1 matrix multiplications. For k = 1000, that's 999 O(n³) operations.

**Diagonal method:** A = PDP⁻¹ implies Aᵏ = PDᵏP⁻¹.

And Dᵏ is trivial:
```
Dᵏ = | λ₁ᵏ   0  |
     |   0   λ₂ᵏ|
```

So: **Aᵏ = P · diag(λ₁ᵏ, ..., λₙᵏ) · P⁻¹**

This costs 2 matrix multiplications regardless of k!

### Example: Computing A¹⁰⁰

```
A = | -1  4 | = PDP⁻¹ with λ₁=1, λ₂=3
    | -2  5 |

A¹⁰⁰ = PD¹⁰⁰P⁻¹

D¹⁰⁰ = | 1¹⁰⁰     0   | = | 1     0   |
        |   0    3¹⁰⁰ |   | 0  3¹⁰⁰  |

A¹⁰⁰ = | 2  1 || 1     0   ||  1  -1 |
        | 1  1 || 0  3¹⁰⁰  || -1   2 |

     = | 2  3¹⁰⁰ ||  1  -1 |
       | 1  3¹⁰⁰ || -1   2 |

     = | 2-3¹⁰⁰     -2+2·3¹⁰⁰ |
       | 1-3¹⁰⁰     -1+2·3¹⁰⁰ |

Direct computation of A¹⁰⁰ would require 99 matrix multiplications.
Diagonalization reduces it to 2 multiplications + evaluating 3¹⁰⁰.
```

---

## Application: Fibonacci Numbers via Eigenvalues

The Fibonacci sequence: F₀=0, F₁=1, F₂=1, F₃=2, F₄=3, F₅=5, ...

Define the state vector **xₖ = (Fₖ₊₁, Fₖ)**. The recurrence Fₖ₊₁ = Fₖ + Fₖ₋₁ becomes:

```
| Fₖ₊₂ | = | 1  1 | | Fₖ₊₁ |
| Fₖ₊₁ |   | 1  0 | | Fₖ   |

xₖ₊₁ = A xₖ   where A = | 1  1 |
                          | 1  0 |
```

After k steps: xₖ = Aᵏ x₀ = Aᵏ (1, 0)ᵀ.

**Eigenvalues of A:**
```
det(A - λI) = (1-λ)(0-λ) - 1 = λ² - λ - 1 = 0

λ = (1 ± √5)/2

λ₁ = (1 + √5)/2 ≈ 1.618...   (the golden ratio φ!)
λ₂ = (1 - √5)/2 ≈ -0.618...
```

**Result (Binet's formula):** Fₙ = (φⁿ - ψⁿ) / √5 where φ = (1+√5)/2 and ψ = (1-√5)/2.

This is an exact closed-form formula for the n-th Fibonacci number — derived entirely through diagonalization!

---

## Application: Markov Chains

A Markov chain models states with transition matrix T where Tᵢⱼ = probability of going from state j to state i. State vector at time k: **πₖ = Tᵏ π₀**.

The **long-run (steady-state) distribution** π* satisfies **T π* = π*** — it's the eigenvector with eigenvalue 1!

```
Example: Two-state Markov chain (sunny/rainy weather)
T = | 0.7  0.4 |    (0.7: stays sunny; 0.4: rainy turns sunny)
    | 0.3  0.6 |

Eigenvalues: det(T - λI) = 0
(0.7-λ)(0.6-λ) - 0.4·0.3 = λ² - 1.3λ + 0.42 - 0.12 = λ² - 1.3λ + 0.3 = (λ-1)(λ-0.3) = 0

λ₁ = 1 (stationary state)
λ₂ = 0.3 (transient)

For λ₁ = 1: (T-I)π = 0
| -0.3  0.4 |π = 0 → -0.3π₁ + 0.4π₂ = 0 → π₁ = (4/3)π₂
| 0.3  -0.4 |

Normalize (π₁ + π₂ = 1): (4/3)π₂ + π₂ = 1 → π₂ = 3/7, π₁ = 4/7

Steady state: π* = (4/7, 3/7) ≈ (57% sunny, 43% rainy)

Since |λ₂| = 0.3 < 1, all transient modes decay like 0.3ᵏ → 0.
After ~10 steps, Tᵏπ₀ ≈ π* regardless of starting distribution.
```

---

## Section Challenge

> ### Diagonalizing Population Models
>
> A biologist models a rabbit population split between two habitats (forest and field). Each year:
>
> ```
> A = | 0.6   0.3 |    (row i, col j) = fraction that moves from habitat j to habitat i
>     | 0.4   0.7 |    + births included in the fractions
> ```
>
> **Q1:** Find eigenvalues of A. Verify using trace and det.
>
> **Q2:** Find eigenvectors for each eigenvalue and write A = PDP⁻¹.
>
> **Q3:** Starting with 100 rabbits in forest, 0 in field (p₀ = (100, 0)ᵀ), what is pₙ = Aⁿp₀ as a function of n?
>
> **Q4:** Does the population stabilize? If so, what is the long-run proportion in each habitat?
>
> **Q5 (Stretch):** Suppose we add 10 rabbits to the field each year: pₙ₊₁ = Apₙ + c where c = (0, 10)ᵀ. This is not a pure eigenvalue problem. Express pₙ as p₀ + (Iₙ + A + A² + ... + Aⁿ⁻¹)c using diagonalization to compute the geometric series.

<details>
<summary>Full answers</summary>

```
Q1: Eigenvalues

trace(A) = 0.6 + 0.7 = 1.3
det(A) = 0.6·0.7 - 0.3·0.4 = 0.42 - 0.12 = 0.30

Characteristic polynomial: λ² - 1.3λ + 0.30 = 0

λ = (1.3 ± √(1.69 - 1.20)) / 2 = (1.3 ± √0.49) / 2 = (1.3 ± 0.7) / 2

λ₁ = 2.0/2 = 1.0
λ₂ = 0.6/2 = 0.3

Verification: λ₁+λ₂ = 1.3 = trace ✓   λ₁·λ₂ = 0.3 = det ✓

────────────────────────────────────────────

Q2: Eigenvectors and diagonalization

For λ₁ = 1: (A - I)v = 0
| -0.4   0.3 |v = 0 → -0.4v₁ + 0.3v₂ = 0 → v₁ = 0.75v₂
|  0.4  -0.3 |
v₁ = (3, 4) [multiply by 4 to clear fractions: 0.75·4=3]

For λ₂ = 0.3: (A - 0.3I)v = 0
|  0.3   0.3 |v = 0 → 0.3v₁ + 0.3v₂ = 0 → v₁ = -v₂
|  0.4   0.4 |
v₂ = (1, -1)

P = | 3   1 |    D = | 1    0  |
    | 4  -1 |        | 0   0.3 |

P⁻¹: det(P) = -3 - 4 = -7

P⁻¹ = (1/-7)| -1  -1 | = | 1/7   1/7 |
             | -4   3 |   | 4/7  -3/7 |

Verify: A = PDP⁻¹ (left as exercise)

────────────────────────────────────────────

Q3: pₙ = Aⁿ p₀

p₀ = (100, 0)ᵀ

Express p₀ in eigenbasis: p₀ = c₁v₁ + c₂v₂

| 3   1 || c₁ | = | 100 |    → solve: c₁·3 + c₂·1 = 100
| 4  -1 || c₂ |   |  0  |          c₁·4 - c₂·1 = 0

From row 2: c₂ = 4c₁
Sub into row 1: 3c₁ + 4c₁ = 100 → c₁ = 100/7
c₂ = 400/7

pₙ = Aⁿ(c₁v₁ + c₂v₂) = c₁λ₁ⁿv₁ + c₂λ₂ⁿv₂
   = (100/7)·1ⁿ·(3,4) + (400/7)·(0.3)ⁿ·(1,-1)

pₙ = | 300/7 + (400/7)(0.3)ⁿ  |
     | 400/7 - (400/7)(0.3)ⁿ  |

pₙ = (1/7)| 300 + 400·(0.3)ⁿ |
          | 400 - 400·(0.3)ⁿ |

────────────────────────────────────────────

Q4: Long-run distribution

Since |λ₂| = 0.3 < 1, the term (0.3)ⁿ → 0 as n → ∞.

p∞ = (1/7)| 300 | = | 300/7 | ≈ | 42.86 |
          | 400 |   | 400/7 |   | 57.14 |

Long-run proportions: 300/700 ≈ 43% in forest, 400/700 ≈ 57% in field.

This is the steady-state (eigenvector for λ₁=1): any initial distribution
converges to 3:4 ratio between habitats. The convergence is geometric with
rate (0.3)ⁿ — after n=3 steps, error is < 3% of original perturbation.

────────────────────────────────────────────

Q5: Series pₙ with immigration

pₙ₊₁ = Apₙ + c
Solution: pₙ = Aⁿp₀ + (I + A + A² + ... + Aⁿ⁻¹)c

The geometric series S = I + A + ... + Aⁿ⁻¹ = (Aⁿ - I)(A - I)⁻¹

Using diagonalization: Aⁿ = PDⁿP⁻¹, so:
Aⁿ - I = P(Dⁿ - I)P⁻¹

(Dⁿ - I) = | 1-1      0       | = | 0        0       |
            |   0   0.3ⁿ-1    |   | 0   0.3ⁿ-1       |

Similarly, A - I = P(D - I)P⁻¹
(D - I) = | 0      0    |     (A - I) is singular since λ₁ = 1!
          | 0   -0.7    |

The issue: when λ₁ = 1 is an eigenvalue, (A - I) is singular (not invertible).
The geometric series sum I + A + ... + Aⁿ⁻¹ diverges in the λ₁=1 direction.

Physically: if immigration adds rabbits and the population naturally stabilizes
(λ₁ = 1), the total population grows without bound. The field population
accumulates immigrants indefinitely.

Quantitatively for the λ₂ component:
Series acting on v₂: I + A + ... + Aⁿ⁻¹ applied to v₂-direction
= (1 + 0.3 + 0.3² + ... + 0.3ⁿ⁻¹)v₂ = (1-0.3ⁿ)/(1-0.3) · v₂ → 1/0.7 · v₂ (convergent!)

For the λ₁ component: (1 + 1 + ... + 1) = n → grows linearly with n.

Total population grows linearly: each year's immigration adds to a stable
"native" population. This is the fundamental difference between λ < 1
(immigration absorbed) and λ = 1 (immigration accumulates).
```

</details>

---

## Simultaneous Diagonalization

Two matrices A and B are **simultaneously diagonalizable** if there exists one P that diagonalizes both:

**A = PΛ_AP⁻¹  and  B = PΛ_BP⁻¹**

This happens iff **AB = BA** (commuting matrices). In this case, A and B share the same eigenvectors.

Application: in quantum mechanics, two observables (energy, momentum) can be simultaneously measured precisely iff their operator matrices commute — the famous Heisenberg uncertainty principle says position X and momentum P do NOT commute, so you can't simultaneously diagonalize them.

---

## Common Mistakes

**Mistake 1: Confusing P with P⁻¹ in the formula**
- A = PDP⁻¹, NOT P⁻¹DP. The columns of P are eigenvectors. The formula P⁻¹AP = D (not PAP⁻¹).

**Mistake 2: Assuming all matrices are diagonalizable**
- Defective matrices (repeated eigenvalues with insufficient eigenvectors) are NOT diagonalizable. They require Jordan normal form.

**Mistake 3: Eigenvalue ordering**
- If you put λ₁ first in D, you must put the corresponding eigenvector v₁ first in P. Mismatching destroys the decomposition.

**Mistake 4: Using A = PDP⁻¹ when eigenvalues are complex**
- Complex eigenvalues → complex P and D. For real computations with real A, use real Schur form or stick to symmetric A (Chapter 12).

---

## Connections

- **Chapter 10 — Eigenvalues:** The raw material for diagonalization. Diagonalization is just organized bookkeeping of eigenvalues/eigenvectors.
- **Chapter 12 — Spectral Theorem:** When A is symmetric, A = QΛQᵀ with Q orthogonal — the cleanest form of diagonalization.
- **Chapter 13 — SVD:** Generalizes diagonalization to non-square matrices: A = UΣVᵀ.

---

> [< Previous: 10 Eigenvalues & Eigenvectors](10_Eigenvalues_Eigenvectors.md) | [Course Index](README.md) | [Next → 12 Spectral Theorem & PCA](12_Spectral_Theorem_PCA.md)
