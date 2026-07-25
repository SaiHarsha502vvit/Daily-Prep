# Chapter 05 — Linear Systems & Gaussian Elimination

> [< Previous: 04 Matrices as Linear Transformations](04_Matrices_as_Transformations.md) | [Course Index](README.md) | [Next → 06 Determinants](06_Determinants.md)

---

## The Problem: Solving Multiple Equations at Once

You're designing a coffee shop's supply chain. Three ingredients (beans B, milk M, cups C) go into three products: Espresso (1B, 0M, 1C), Latte (1B, 2M, 1C), Cappuccino (1B, 1M, 1C). You need to produce exactly 50 Espressos, 30 Lattes, and 20 Cappuccinos per day. How many units of each ingredient do you need?

```
Espresso:    1B + 0M + 1C = 50
Latte:       1B + 2M + 1C = 30
Cappuccino:  1B + 1M + 1C = 20
```

This is a **system of linear equations**. In matrix form: Ax = b, where:

```
A = | 1  0  1 |    x = | B |    b = | 50 |
    | 1  2  1 |        | M |        | 30 |
    | 1  1  1 |        | C |        | 20 |
```

**Gaussian elimination** is the systematic, scalable method for solving this. It's what every numerical library uses under the hood — from NumPy to Excel to database query optimizers.

---

## The Augmented Matrix

Instead of manipulating equations separately, encode both A and b into one object:

**[A | b]** — the augmented matrix

```
| 1  0  1 | 50 |
| 1  2  1 | 30 |
| 1  1  1 | 20 |
```

Operations on rows of [A|b] correspond exactly to legal equation manipulations.

---

## Elementary Row Operations

Three operations that preserve the solution set:

| Operation | Notation | Example | Why valid |
|-----------|----------|---------|-----------|
| Swap two rows | Rᵢ ↔ Rⱼ | R1 ↔ R2 | Just reordering equations |
| Multiply row by nonzero scalar | Rᵢ ← c·Rᵢ, c≠0 | R1 ← 3R1 | Scale both sides |
| Add scalar multiple of one row to another | Rᵢ ← Rᵢ + c·Rⱼ | R2 ← R2 − R1 | Adding equations — valid algebra |

These are the ONLY operations allowed in Gaussian elimination. No other operations preserve the solution set.

---

## Gaussian Elimination: The Algorithm

**Goal:** Transform [A|b] to row echelon form (REF) using row operations, then back-substitute.

**Row Echelon Form (REF):**
- Non-zero rows appear above zero rows.
- The first non-zero entry (pivot) in each row is to the right of the pivot in the row above.
- Below each pivot: all zeros.

**Reduced Row Echelon Form (RREF):**
- REF conditions, plus:
- Each pivot is 1.
- Above each pivot: all zeros.

### Working Example

Solve the coffee shop system:

```
[A|b] = | 1  0  1 | 50 |
         | 1  2  1 | 30 |
         | 1  1  1 | 20 |

Step 1: Eliminate column 1 below the first pivot (R1[col1] = 1).

R2 ← R2 − R1:
  [1-1, 2-0, 1-1 | 30-50] = [0, 2, 0 | -20]

R3 ← R3 − R1:
  [1-1, 1-0, 1-1 | 20-50] = [0, 1, 0 | -30]

Now:
| 1  0  1 | 50  |
| 0  2  0 | -20 |
| 0  1  0 | -30 |

Step 2: Eliminate column 2 below the second pivot (R2[col2] = 2).

R3 ← R3 − (1/2)R2:
  [0-0, 1-1, 0-0 | -30-(-10)] = [0, 0, 0 | -20]

Row Echelon Form:
| 1  0  1 |  50 |
| 0  2  0 | -20 |
| 0  0  0 | -20 |  ← PROBLEM: 0 = -20 is impossible!
```

**Conclusion: No solution exists.** The system is inconsistent. (We'll verify why below.)

What went wrong with the coffee shop? Let me fix the numbers:

```
Produce: 50 Espresso, 30 Latte, 20 Cappuccino with b = (100, 60, 50)
```

```
| 1  0  1 | 100 |
| 1  2  1 |  60 |
| 1  1  1 |  50 |

R2 ← R2 - R1:  [0, 2, 0 | -40]
R3 ← R3 - R1:  [0, 1, 0 | -50]

| 1  0  1 | 100 |
| 0  2  0 | -40 |
| 0  1  0 | -50 |

R3 ← R3 - (1/2)R2:  [0, 0, 0 | -50+20] = [0, 0, 0 | -30]

Still inconsistent!
```

The matrix A itself is rank-deficient. Let's use a solvable example:

```
A = | 2  1 -1 |    b = |  8 |
    |-3 -1  2 |        | -11 |
    |-2  1  2 |        | -3  |

[A|b]:
| 2   1  -1 |  8  |
|-3  -1   2 | -11 |
|-2   1   2 | -3  |

R2 ← R2 + (3/2)R1:
  [-3+(3/2)·2, -1+(3/2)·1, 2+(3/2)·(-1) | -11+(3/2)·8]
= [0, 1/2, 1/2 | 1]

R3 ← R3 + R1:
  [-2+2, 1+1, 2+(-1) | -3+8] = [0, 2, 1 | 5]

| 2   1  -1 |  8  |
| 0  1/2 1/2|  1  |
| 0   2   1 |  5  |

R3 ← R3 − 4·R2:
  [0-0, 2-2, 1-2 | 5-4] = [0, 0, -1 | 1]

Row Echelon Form:
| 2   1  -1 |  8  |
| 0  1/2 1/2|  1  |
| 0   0  -1 |  1  |

Back substitution:
Row 3: -x₃ = 1 → x₃ = -1
Row 2: x₂/2 + x₃/2 = 1 → x₂/2 + (-1)/2 = 1 → x₂ = 3
Row 1: 2x₁ + x₂ - x₃ = 8 → 2x₁ + 3 - (-1) = 8 → 2x₁ = 4 → x₁ = 2

Solution: (x₁, x₂, x₃) = (2, 3, -1)
```

**Verify:** A · (2, 3, -1)ᵀ = (2·2+1·3+(-1)·(-1), -3·2+(-1)·3+2·(-1), -2·2+1·3+2·(-1)) = (8, -11, -3) ✓

---

## Reduced Row Echelon Form (RREF)

Continue from REF to RREF for a more complete picture (no back-substitution needed):

After reaching REF, also eliminate ABOVE each pivot and normalize each pivot to 1.

```
REF:
| 2   1  -1 |  8  |
| 0  1/2 1/2|  1  |
| 0   0  -1 |  1  |

Normalize Row 3: R3 ← (-1)·R3
| 2   1  -1 |  8  |
| 0  1/2 1/2|  1  |
| 0   0   1 | -1  |

Eliminate above pivot in col 3:
R2 ← R2 - (1/2)R3: [0, 1/2, 0 | 1+1/2] = [0, 1/2, 0 | 3/2]
R1 ← R1 + R3:      [2, 1, 0 | 8-1] = [2, 1, 0 | 7]

| 2  1  0 | 7   |
| 0 1/2 0 | 3/2 |
| 0  0  1 | -1  |

Normalize Row 2: R2 ← 2·R2
| 2  1  0 | 7 |
| 0  1  0 | 3 |
| 0  0  1 |-1 |

Eliminate above pivot in col 2:
R1 ← R1 - R2: [2, 0, 0 | 4]

Normalize Row 1: R1 ← (1/2)·R1
| 1  0  0 | 2 |
| 0  1  0 | 3 |
| 0  0  1 |-1 |

RREF = [I | x*] → solution directly readable: x = (2, 3, -1) ✓
```

RREF gives the solution with NO back-substitution. For systems with free variables, RREF makes the parameterized solution explicit.

---

## LU Decomposition

Gaussian elimination can be viewed as factoring A:

**A = L · U**

Where:
- **L** (Lower triangular): records the multipliers used in elimination (with 1s on diagonal)
- **U** (Upper triangular): the row echelon form of A

```
For the system above (without the b):
A = | 2   1  -1 |
    |-3  -1   2 |
    |-2   1   2 |

After elimination, the multipliers were:
  m₂₁ = 3/2 (multiplied R1 by 3/2 to eliminate col 1 in R2)
  m₃₁ = 1   (added R1 to R3)
  m₃₂ = 4   (subtracted 4·R2 from R3)

L = | 1    0   0 |    U = | 2   1  -1 |
    |-3/2  1   0 |        | 0  1/2 1/2 |
    |-1    4   1 |        | 0   0  -1  |

Verify: LU = A (matrix multiplication gives back the original) ✓
```

**Why bother with LU?**

If you need to solve Ax = b for MANY different b values with the SAME A (e.g., multiple right-hand sides), computing LU once costs O(n³), then each solve costs only O(n²) (two triangular substitutions). Much cheaper than re-running Gaussian elimination from scratch.

```python
import numpy as np
from scipy.linalg import lu_factor, lu_solve

A = np.array([[2, 1, -1],
              [-3, -1, 2],
              [-2, 1, 2]], dtype=float)

# Factorize once: O(n³)
lu, piv = lu_factor(A)

# Solve for many b: O(n²) each
b1 = np.array([8, -11, -3])
b2 = np.array([1, 2, 3])
b3 = np.array([5, -5, 0])

x1 = lu_solve((lu, piv), b1)   # [2, 3, -1]
x2 = lu_solve((lu, piv), b2)
x3 = lu_solve((lu, piv), b3)
```

---

## Numerical Stability: Partial Pivoting

A naive implementation has a problem: if a pivot is near zero, dividing by it amplifies round-off errors catastrophically.

**Partial pivoting:** before each elimination step, swap the row with the largest absolute value in the current column to the pivot position.

```
Example with near-zero pivot:
| 0.001   1 | 1.001 |
|    1    1 |    2  |

Without pivoting: divide by 0.001 → multiplier = 1000
  R2 ← R2 - 1000·R1: [0, 1-1000, 2-1001] = [0, -999, -999]
  x₂ = 1, x₁ = (1.001 - 1)/0.001 = 1 ✓ (exact)

With floating point: round-off in 1-1000 can give -1000 instead of -999,
leading to x₂ = 1.001, x₁ ≈ 0 (WRONG by a factor of ~1000!)

With partial pivoting: swap rows first
| 1    1 | 2     |
| 0.001 1 | 1.001 |

Multiplier = 0.001 (small → safe):
  R2 ← R2 - 0.001·R1: [0, 0.999, 0.999]
  x₂ = 1, x₁ = 1 ✓ (numerically stable)
```

This is why `numpy.linalg.solve()` uses partial pivoting by default. The PA = LU factorization (with permutation matrix P) is the standard.

---

## Section Challenge

> ### Network Flow Analysis
>
> A traffic engineer models a one-way street network with 4 junctions (J1-J4). Flow is measured in vehicles/hour. Traffic ENTERING each junction must equal traffic LEAVING (conservation of flow at each junction).
>
> ```
>         →30→          →x₂→
> J1 ─────────→ J2 ─────────→ J3
>  ↑            ↓             ↓
>  x₁            x₃            20
>  |            ↓             ↓
> J4 ←─────────── J4  external exit: 10
>      ←x₄←
>
> External input at J1: 40 vehicles/hour enter
> External exit at J3: 20 vehicles/hour leave
> External exit at J4: 10 vehicles/hour leave
>
> Conservation at each junction:
>   J1: 40 + x₄ = x₁ + 30
>   J2: 30 = x₂ + x₃
>   J3: x₂ + 20 = 20
>   J4: x₁ + x₃ = x₄ + 10
> ```
>
> **Question 1:** Write the system in matrix form Ax = b.
>
> **Question 2:** Row-reduce [A|b] to REF.
>
> **Question 3:** How many solutions exist? If infinitely many, express the general solution with a free parameter.
>
> **Question 4:** What is the minimum flow on each road (non-negative traffic)?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Matrix form

Rearrange each equation (all unknowns on left, constants on right):
  J1: x₁ - x₄ = 40 - 30 = 10       → x₁ + 0x₂ + 0x₃ - x₄ = 10
  J2: x₂ + x₃ = 30                  → 0x₁ + x₂ + x₃ + 0x₄ = 30
  J3: x₂ = 0                        → 0x₁ + x₂ + 0x₃ + 0x₄ = 0
  J4: x₁ + x₃ - x₄ = 10            → x₁ + 0x₂ + x₃ - x₄ = 10

Wait, let me re-read J3: x₂ + 20 = 20 → x₂ = 0.

Matrix form:
A = | 1  0  0  -1 |    b = | 10 |
    | 0  1  1   0 |        | 30 |
    | 0  1  0   0 |        |  0 |
    | 1  0  1  -1 |        | 10 |

──────────────────────────────────────────────────────────

QUESTION 2: Row reduction

[A|b]:
| 1  0  0  -1 | 10 |
| 0  1  1   0 | 30 |
| 0  1  0   0 |  0 |
| 1  0  1  -1 | 10 |

R4 ← R4 - R1:
| 1  0  0  -1 | 10 |
| 0  1  1   0 | 30 |
| 0  1  0   0 |  0 |
| 0  0  1   0 |  0 |

R3 ← R3 - R2:
| 1  0  0  -1 | 10 |
| 0  1  1   0 | 30 |
| 0  0  -1  0 | -30 |
| 0  0  1   0 |  0 |

R4 ← R4 + R3:
| 1  0  0  -1 | 10 |
| 0  1  1   0 | 30 |
| 0  0  -1  0 | -30 |
| 0  0  0   0 | -30 |   ← 0 = -30 → INCONSISTENT?!

Wait, let me recheck. R4 + R3 = [0+0, 0+0, 1+(-1), 0+0 | 0+(-30)] = [0,0,0,0 | -30].

This says 0 = -30, which is a contradiction. But traffic flow systems should be consistent...

Let me recheck the conservation equations.

J1: inputs = {40 (external), x₄}; outputs = {x₁, 30}
  40 + x₄ = x₁ + 30 → x₁ - x₄ = 10 ✓

J2: inputs = {30}; outputs = {x₂, x₃}  
  30 = x₂ + x₃ → x₂ + x₃ = 30 ✓

J3: inputs = {x₂, ?}; outputs = {20, 20?}
  Let me reread: "x₂ + 20 = 20" → this would mean x₂ = 0 — the only input to J3
  is x₂ (20 is the external exit). So: x₂ = 20 - 20 = 0? But that contradicts
  J2 which says x₂ + x₃ = 30.

Actually, I think I misread the problem. Let me fix J3:
  J3 has inputs x₂ and external input 20 (road coming from outside), outputs one exit of 20.
  Hmm, or: inputs = x₂, exits = 20.
  So: x₂ = 20 → not 0.

Let me restate the problem with clearer conservation:
  J1: 40 + x₄ = x₁ + 30         → x₁ - x₄ = 10
  J2: 30 = x₂ + x₃               → x₂ + x₃ = 30
  J3: x₂ = 20                    → x₂ = 20
  J4: x₁ + x₃ = x₄ + 10         → x₁ + x₃ - x₄ = 10

From J3: x₂ = 20.
From J2: 20 + x₃ = 30 → x₃ = 10.
From J1: x₁ - x₄ = 10.
From J4: x₁ + 10 - x₄ = 10 → x₁ - x₄ = 0. → CONTRADICTION with J1 (x₁ - x₄ = 10 ≠ 0).

There's an error in the problem setup — this is actually a useful feature! Let me present a corrected version.

CORRECTED: external exit at J4 = 0 (J4 is only a junction):
  J1: 40 + x₄ = x₁ + 30 → x₁ - x₄ = 10
  J2: 30 = x₂ + x₃       → x₂ + x₃ = 30
  J3: x₂ = 20
  J4: x₁ + x₃ = x₄        → x₁ + x₃ - x₄ = 0

From J3: x₂ = 20.
From J2: x₃ = 10.
From J4: x₁ + 10 - x₄ = 0 → x₁ - x₄ = -10.
From J1: x₁ - x₄ = 10. 

Still contradictory. The problem has an internal inconsistency in total flow conservation:
  Total in to network: 40 (J1) = 20 (J3) + 10 (J4 exit) = 30 ≠ 40.

FIX: change J1 to bring in 30, or exits to total 30. Let me set external input = 30.

FULLY CORRECTED system (J1 input = 30, exit J3 = 20, exit J4 = 10):
  J1: 30 + x₄ = x₁ + 30 → x₁ = x₄
  J2: 30 = x₂ + x₃        → x₂ + x₃ = 30
  J3: x₂ = 20
  J4: x₁ + x₃ = x₄ + 10  → x₁ + x₃ - x₄ = 10

From J3: x₂ = 20.
From J2: x₃ = 10.
From J1: x₁ = x₄.
From J4: x₄ + 10 - x₄ = 10 → 10 = 10 ✓ (redundant equation!)

QUESTION 3: How many solutions?

x₂ = 20, x₃ = 10 are determined.
x₁ = x₄ = t for any t ∈ ℝ (free parameter).

General solution: (x₁, x₂, x₃, x₄) = (t, 20, 10, t) for t ∈ ℝ
Infinitely many solutions — the system has one free parameter.

This is EXPECTED: traffic networks typically have "loops" where flow can circulate.
The total through the network is determined, but the split between loop paths is free.

QUESTION 4: Minimum non-negative flows

All flows must be ≥ 0 (no flow reversal on one-way streets):
  x₁ = t ≥ 0 → t ≥ 0
  x₂ = 20 ≥ 0 ✓
  x₃ = 10 ≥ 0 ✓
  x₄ = t ≥ 0 → t ≥ 0

Minimum is t = 0: (x₁, x₂, x₃, x₄) = (0, 20, 10, 0).
  → The J1-J4 loop carries zero traffic; all flow goes directly through.

Any t > 0 is also valid: it represents additional "circulating" flow in the J1-J4 loop.

KEY INSIGHT:
  The free parameter in the solution corresponds to a "loop" in the network.
  A spanning tree of the network graph determines all flows uniquely;
  each "extra" edge (cycle) adds one free variable.
  
  This is the network equivalent of the Rank-Nullity Theorem (Chapter 03):
  nullity = number of cycles in the network = number of free variables.
```

</details>

---

## Common Mistakes

**Mistake 1: Dropping the augmented part during elimination**
- Every row operation must be applied to ALL columns including the b column.
- The most common error: forgetting to update the right-hand side numbers.

**Mistake 2: Declaring "no solution" when a zero row appears**
- A zero row [0 0 0 | 0] is fine — it's a redundant (trivially satisfied) equation.
- Only [0 0 0 | c] with c ≠ 0 means inconsistent.
- Zero rows often mean free variables (infinitely many solutions), not no solution.

**Mistake 3: Back-substituting in the wrong order**
- Always start from the BOTTOM row (last equation) and work upward.
- Substituting into the wrong equation propagates errors.

**Mistake 4: Scaling rows when partial pivoting**
- The standard Gaussian elimination multiplies by scalars to create zeros; it does NOT normalize rows to have leading 1s (that's RREF). Premature normalization can introduce fractions and complicate arithmetic.

---

## Connections

- **Chapter 03 — Rank:** The rank of A = number of pivot rows in REF. Consistent iff b ∈ C(A) — which Gaussian elimination detects automatically via the augmented matrix.
- **Chapter 06 — Determinants:** The determinant can be computed as the product of diagonal entries of U (from LU decomposition), with sign adjustments for row swaps.
- **Chapter 07 — Inverses:** Finding A⁻¹ via Gaussian elimination: augment with [A | I] and reduce to [I | A⁻¹].
- **Chapter 09 — Least Squares:** When Ax = b has no solution (overdetermined), least squares minimizes ||Ax - b||. Gaussian elimination on the normal equations (AᵀAx = Aᵀb) gives the least-squares solution.
- `25_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md` — Linear regression coefficients ARE a linear system solution. `numpy.linalg.solve()` or `lstsq()` run Gaussian elimination.

---

> [< Previous: 04 Matrices as Linear Transformations](04_Matrices_as_Transformations.md) | [Course Index](README.md) | [Next → 06 Determinants](06_Determinants.md)
