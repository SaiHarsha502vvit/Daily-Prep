# Chapter 03 — Subspaces, Rank & Null Space

> [< Previous: 02 Linear Independence & Basis](02_Linear_Independence_Basis.md) | [Course Index](README.md) | [Next → 04 Matrices as Linear Transformations](04_Matrices_as_Transformations.md)

---

## The Problem: What Does a Matrix "Do" to Space?

Consider the matrix:

```
A = | 1  2 |
    | 2  4 |
```

It takes 2D vectors (inputs in ℝ²) and produces 2D vectors (outputs in ℝ²). But try multiplying every possible input vector by A — what outputs can you get?

```
A · (1, 0) = (1, 2)
A · (0, 1) = (2, 4)
A · (1, 1) = (3, 6)
A · (3, -1) = (1, 2)
```

Notice: every output is a scalar multiple of (1, 2). No matter what you put in, the output is always on the line through (1, 2). A 2D matrix is "crushing" 2D space onto a 1D line.

This isn't an accident. The matrix A has a structural property — its columns are linearly dependent (column 2 = 2 × column 1). The "output space" is limited to a 1D line. This is the **column space** — and understanding it tells you everything about what a matrix can and cannot do.

---

## What Is a Subspace?

A **subspace** S of ℝⁿ is a subset of ℝⁿ that is itself a vector space.

**Three conditions for S to be a subspace:**
1. **Contains the zero vector:** 0 ∈ S
2. **Closed under addition:** if u, v ∈ S, then u + v ∈ S
3. **Closed under scalar multiplication:** if v ∈ S and c ∈ ℝ, then c·v ∈ S

**Intuition:** A subspace is a "flat object through the origin." Lines through the origin, planes through the origin, the origin itself, and all of ℝⁿ are all subspaces. A line that doesn't pass through the origin is NOT a subspace (it doesn't contain 0; adding vectors in it can leave it).

```
IN ℝ²:

Subspaces:
  {0}                      — the zero subspace (just the origin)
  Any line through origin  — span of one non-zero vector
  All of ℝ²               — the full space

NOT subspaces:
  A line NOT through origin (e.g., y = x + 1) — fails to contain 0
  A circle                 — not closed under addition
  {(x,y) | x ≥ 0}         — the right half-plane — not closed under scaling by -1
```

**Why condition 1 (contains zero) is not redundant:** If v ∈ S, then 0·v = 0, so 0 ∈ S follows from condition 3. But you still must verify it explicitly to check whether S is even possible.

---

## The Four Fundamental Subspaces of a Matrix

For a matrix A with m rows and n columns (maps ℝⁿ → ℝᵐ), there are four key subspaces:

### 1. Column Space: C(A) — What Can A Produce?

The **column space** (or **image**, or **range**) of A is the span of its column vectors.

**C(A) ⊆ ℝᵐ** (lives in the output space)

```
A = | 1  2 |    columns: c₁ = (1,2), c₂ = (2,4)
    | 2  4 |

C(A) = span{(1,2), (2,4)} = span{(1,2)} = the line {t(1,2) | t ∈ ℝ}
                                         (since (2,4) = 2·(1,2) — dependent)
```

**Geometric meaning:** C(A) is exactly the set of vectors b for which **Ax = b has a solution**. The equation Ax = b asks: "is b reachable from the columns of A?" If b ∈ C(A): YES. If b ∉ C(A): NO — the equation has no solution.

```
Ax = b has a solution iff b ∈ C(A)
```

### 2. Null Space: N(A) — What Does A Crush to Zero?

The **null space** (or **kernel**) of A is the set of all input vectors that A maps to zero:

**N(A) = { x ∈ ℝⁿ | Ax = 0 }** ⊆ ℝⁿ (lives in the input space)

```
A = | 1  2 |
    | 2  4 |

Ax = 0:
  x₁ + 2x₂ = 0 → x₁ = -2x₂
  
  N(A) = { (-2t, t) | t ∈ ℝ } = span{(-2, 1)}
```

**Why is N(A) a subspace?** If Ax = 0 and Ay = 0, then A(x+y) = Ax + Ay = 0, so x+y ∈ N(A). And A(cx) = c(Ax) = 0. Conditions 2 and 3 hold. And x=0 is always in N(A) (trivial solution). ✓

**Geometric meaning:** N(A) tells you HOW MUCH INFORMATION A LOSES. If N(A) = {0}: the transformation is injective (no two inputs map to the same output). If N(A) has dimension ≥ 1: multiple inputs map to the same output.

```
A · (-2, 1) = | 1·(-2) + 2·1 | = | 0 |
              | 2·(-2) + 4·1 |   | 0 |

A · (0, 0)  = | 0 |
              | 0 |

Both (-2, 1) and (0, 0) map to the same output (0). Information is lost.
```

### 3. Row Space: C(Aᵀ) — Span of Rows

The **row space** is the span of the row vectors of A, which equals the column space of Aᵀ.

**C(Aᵀ) ⊆ ℝⁿ** (lives in the input space)

Row operations (Gaussian elimination) do NOT change the row space. This is why row reduction is a valid tool for finding bases.

### 4. Left Null Space: N(Aᵀ) — Span of Left Null Vectors

The left null space is the null space of Aᵀ: { y | Aᵀy = 0 } ⊆ ℝᵐ (output space).

---

## Rank: The Core Number

The **rank** of A is the dimension of its column space (= dimension of its row space — they're always equal, a non-trivial theorem):

**rank(A) = dim(C(A)) = dim(C(Aᵀ))**

The rank tells you: **how many truly independent directions does A produce?**

```
A = | 1  2 |    rank(A) = 1  (column space is a 1D line)
    | 2  4 |

B = | 1  0 |    rank(B) = 2  (columns are independent, span ℝ²)
    | 0  1 |

C = | 1  0  2 |    rank(C) = 2  (third column = 2× first)
    | 0  1  0 |
```

**Full rank:** rank = min(m, n). The matrix uses all available independent directions.

**Rank deficiency:** rank < min(m, n). Some directions are "collapsed." The matrix loses information.

---

## Nullity: How Much Is Lost

The **nullity** of A is the dimension of its null space:

**nullity(A) = dim(N(A))**

Nullity measures how many independent directions A maps to zero — the "dimension of what's lost."

---

## The Rank-Nullity Theorem: Conservation Law

**Rank-Nullity Theorem:** For an m×n matrix A:

**rank(A) + nullity(A) = n**

Where n is the number of COLUMNS (the "input dimension").

**Derivation from first principles:**

The null space N(A) has some dimension k (nullity). Choose k independent vectors that span N(A): {n₁, ..., nₖ}.

Extend these to a basis of ℝⁿ by adding r = n-k more vectors: {n₁, ..., nₖ, v₁, ..., vᵣ}.

**Claim:** {Av₁, ..., Avᵣ} is a basis for C(A).

*Why they span C(A):* Any b = Ax for some x. Write x as a combination of the basis vectors: x = Σcᵢnᵢ + Σdⱼvⱼ. Then Ax = Σcᵢ(Anᵢ) + Σdⱼ(Avⱼ) = 0 + Σdⱼ(Avⱼ). So b is a combination of {Av₁,...,Avᵣ}. ✓

*Why they're independent:* If Σdⱼ(Avⱼ) = 0, then A(Σdⱼvⱼ) = 0, so Σdⱼvⱼ ∈ N(A). But N(A) is spanned by {n₁,...,nₖ}, so Σdⱼvⱼ = Σcᵢnᵢ for some cᵢ. But {n₁,...,nₖ,v₁,...,vᵣ} is a basis of ℝⁿ, so all coefficients must be zero. ∴ dⱼ = 0. ✓

Therefore rank(A) = r = n - k = n - nullity(A). ∎

**Intuition:** "What goes in must come out or get squashed."
- n = total input dimensions
- k of those dimensions get squashed to zero (nullity)
- r = n-k dimensions survive and contribute to the column space (rank)
- rank + nullity = n — EXACTLY n total, partitioned into squashed and surviving

---

## How Rank Determines Solvability of Ax = b

The system Ax = b (m equations, n unknowns):

| Condition | Meaning | Solutions |
|-----------|---------|-----------|
| b ∈ C(A) | b is reachable | At least one solution |
| b ∉ C(A) | b is not reachable | No solution (inconsistent) |
| nullity(A) = 0 | N(A) = {0} | At most one solution (injective) |
| nullity(A) > 0 | Non-trivial null space | If one solution exists, infinitely many |

**Combining:**

| rank | nullity | n, m | Typical outcome |
|------|---------|------|-----------------|
| rank = n = m (square, full rank) | 0 | n = m | Unique solution for every b |
| rank = n < m (tall, full column rank) | 0 | overdetermined | 0 or 1 solution (least squares) |
| rank = m < n (wide, full row rank) | n-m | underdetermined | ∞ solutions or 0 (underdetermined) |
| rank < min(m,n) | n-rank > 0 | — | Infinitely many solutions or 0 |

---

## Computing Column Space and Null Space: Row Reduction

### Finding the Null Space

Solve Ax = 0 using Gaussian elimination (row reduction):

```
A = | 1  2  3 |
    | 2  4  6 |
    | 1  2  4 |

Row reduce:
R2 ← R2 - 2R1:   | 1  2  3 |
                   | 0  0  0 |
                   | 1  2  4 |

R3 ← R3 - R1:     | 1  2  3 |
                   | 0  0  0 |
                   | 0  0  1 |

Swap R2, R3:       | 1  2  3 |
                   | 0  0  1 |
                   | 0  0  0 |

Row echelon form: pivots in columns 1 and 3.
"Free variable": x₂ (no pivot in column 2).

From row 2: x₃ = 0.
From row 1: x₁ + 2x₂ + 3(0) = 0 → x₁ = -2x₂.

Set x₂ = t (free parameter):
  x = (-2t, t, 0) = t(-2, 1, 0)

N(A) = span{(-2, 1, 0)}   nullity = 1
```

### Finding the Column Space

The **pivot columns** of the original matrix A form a basis for C(A). (Not the row-reduced columns — the ORIGINAL columns at pivot positions.)

From above: pivots in columns 1 and 3.  
Basis for C(A): columns 1 and 3 of the ORIGINAL A:

```
C(A) = span{ (1,2,1), (3,6,4) }   rank = 2
```

**Verification of Rank-Nullity:** rank + nullity = 2 + 1 = 3 = n ✓

---

## Subspaces in Software Engineering

**Database column rank:**
In a table with columns that are linear combinations of others, the effective "information dimension" is lower than the column count. This maps to the concept of functional dependencies in normalization — dependent columns should be factored out.

**Overdetermined systems (least squares):**
When you have more equations than unknowns (m > n, e.g., 100 data points, 3 unknowns), Ax = b usually has no exact solution. The least-squares solution finds the x that minimizes ||Ax - b||² — the projection of b onto C(A). This is Chapter 09.

**System of linear equations as circuit analysis:**
Kirchhoff's laws give you a linear system: each node gives one equation. If equations are dependent (a cycle provides no new information), rank < m. The null space tells you which current configurations are "free" — unforced by the constraints.

---

## Section Challenge

> ### Diagnosing a System of Equations
>
> A team is trying to solve a linear system Ax = b where:
>
> ```
> A = | 1  -1   2 |
>     | 2  -2   4 |
>     | 0   1  -1 |
>
> b = | 3  |
>     | 6  |
>     | ? |  (unknown)
> ```
>
> **Question 1:** Find rank(A) and nullity(A).
>
> **Question 2:** Find a basis for N(A). Describe what the null space means for this system.
>
> **Question 3:** What is the column space C(A)? What vectors b make Ax = b solvable?
>
> **Question 4:** For b = (3, 6, ?)ᵀ to have a solution, what must the third component "?" be? And how many solutions will there be?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Rank and nullity

Row reduce A:
| 1  -1   2 |
| 2  -2   4 |
| 0   1  -1 |

R2 ← R2 - 2R1:
| 1  -1   2 |
| 0   0   0 |
| 0   1  -1 |

Swap R2 ↔ R3:
| 1  -1   2 |
| 0   1  -1 |
| 0   0   0 |

Pivot positions: columns 1 and 2.
Row 3 is all zeros → rank(A) = 2.

By Rank-Nullity: nullity = n - rank = 3 - 2 = 1.

──────────────────────────────────────────────────────────

QUESTION 2: Null space N(A)

Solve Ax = 0 using the row echelon form:
Row 2: x₂ - x₃ = 0 → x₂ = x₃
Row 1: x₁ - x₂ + 2x₃ = 0 → x₁ = x₂ - 2x₃ = x₃ - 2x₃ = -x₃

Free variable: x₃ = t (column 3 has no pivot).
  x₁ = -t
  x₂ = t
  x₃ = t

N(A) = span{(-1, 1, 1)}   (nullity = 1 ✓)

WHAT DOES THE NULL SPACE MEAN?
  Any vector x = x_particular + t(-1, 1, 1) is a solution if x_particular is.
  
  The direction (-1, 1, 1) is "invisible" to A — you can add or subtract any
  multiple of it to any solution and get another valid solution.
  
  For the original system: if (x₁, x₂, x₃) is one solution,
  then (x₁-t, x₂+t, x₃+t) is also a solution for any t.
  → Infinitely many solutions once one is found.

──────────────────────────────────────────────────────────

QUESTION 3: Column space C(A)

Pivot columns of ORIGINAL A: columns 1 and 2.
Basis for C(A): {(1,2,0), (-1,-2,1)}

What does the column space look like geometrically?
  These two vectors span a 2D plane through the origin in ℝ³.
  Any b ∈ C(A) lies on this plane.

For b = (b₁, b₂, b₃) to be in C(A):
  There must exist scalars s, t such that:
  s(1,2,0) + t(-1,-2,1) = (b₁, b₂, b₃)
  
  Row 1: s - t = b₁
  Row 2: 2s - 2t = b₂ → b₂ = 2b₁ (CONSTRAINT)
  Row 3: t = b₃ → then s = b₁ + b₃

CONDITION for b ∈ C(A): b₂ = 2b₁

The column space is: { (b₁, b₂, b₃) | b₂ = 2b₁ } — a plane in ℝ³.

──────────────────────────────────────────────────────────

QUESTION 4: What must "?" be? How many solutions?

b = (3, 6, ?)

CHECK: does b satisfy b₂ = 2b₁?
  b₁ = 3, b₂ = 6 → b₂ = 2(3) = 6 ✓
  The first two rows are consistent. Good.

Now find the constraint on b₃:
  From the augmented system, add b to the row reduction:

  | 1  -1   2 | b₁  |     | 1  -1   2 | 3  |
  | 0   1  -1 | b₃  | =   | 0   1  -1 | ?  |
  | 0   0   0 | ...  |     | 0   0   0 | 0  |

  Wait, let me redo. Augmented matrix [A | b] with b = (3, 6, ?):

  | 1  -1   2  | 3 |
  | 2  -2   4  | 6 |
  | 0   1  -1  | ? |

  R2 ← R2 - 2R1:
  | 1  -1   2  | 3  |
  | 0   0   0  | 0  |   ← 2(3)-2(3)+4(0)-6 = 0 ✓ (consistent)
  | 0   1  -1  | ?  |

  Swap R2 ↔ R3:
  | 1  -1   2  | 3  |
  | 0   1  -1  | ?  |
  | 0   0   0  | 0  |

  For consistency: the last row must give 0 = 0. It does, regardless of ?.

  ANSWER: "?" can be ANY value. The third equation is always consistent
  because row 3 of A reduces to the zero row.

  Wait, that means b₃ (?) can be anything — BUT the third EQUATION (row 3 of
  the augmented system) already became 0·x = ? after reduction.

  Let me check more carefully. Original row 3: 0·x₁ + 1·x₂ + (-1)·x₃ = ?
  This is just the third equation: x₂ - x₃ = ?.
  
  From our null space analysis: x₂ = x₃ + ? (no wait, in the null space ? = 0).
  Actually for the non-homogeneous system: the third row of A is (0, 1, -1).
  
  The row-reduced augmented system:
  Row 1: x₁ - x₂ + 2x₃ = 3
  Row 2: x₂ - x₃ = ?  (from original row 3)
  Row 3: 0 = 0 (original row 2 reduced to zero)

  These are consistent for any value of ?.
  
  ANSWER: "?" can be any real number. The system has infinitely many solutions
  for any b₃ value. Specifically, with x₃ = t (free):
    x₂ = ? + t
    x₁ = 3 + x₂ - 2t = 3 + ? + t - 2t = (3 + ?) - t

  One particular solution (t = 0): x = (3+?, ?, 0).

SUMMARY:
  - "?" can be anything → C(A) only constrains b₂ = 2b₁ (which holds: 6 = 6)
  - The third component is free because row 3 of A gave a dependent equation
  - Solutions: infinitely many (nullity = 1 → null space direction (-1,1,1))
  - General solution: (3+?-t, ?+t, t) for any t ∈ ℝ

THE BIG PICTURE:
  Rank-Nullity guaranteed: rank=2 + nullity=1 = 3 ✓
  The system has a 1D family of solutions (the null space direction).
  The solvability condition (b ∈ C(A)) reduced to b₂ = 2b₁ — not b₃.
  b₃ is "already covered" by the dependent third row of A.
```

</details>

---

## Common Mistakes

**Mistake 1: Using row-reduced columns as the column space basis**
- After row reduction, the PIVOT POSITIONS (column indices) identify which ORIGINAL columns form a basis for C(A).
- The actual pivot columns of the row echelon form are NOT in C(A) — they're in the column space of the reduced matrix, not the original A.

**Mistake 2: Confusing null space with column space (input vs output)**
- N(A) ⊆ ℝⁿ: input space. The vectors that A maps to zero.
- C(A) ⊆ ℝᵐ: output space. The vectors A can produce.
- They live in DIFFERENT spaces for non-square matrices.

**Mistake 3: Thinking rank = number of non-zero rows in the original (not reduced) matrix**
- Rank is the number of non-zero rows AFTER row reduction. Original non-zero rows are irrelevant.

**Mistake 4: Forgetting that solvability requires b ∈ C(A)**
- Ax = b is solvable iff b is in the column space of A.
- Checking: augment [A|b] and row reduce. If a row gives [0...0 | c] with c ≠ 0: inconsistent.

**Mistake 5: Mixing up nullity and rank**
- Rank-Nullity: rank + nullity = n (number of COLUMNS).
- If rank = 3 and n = 5: nullity = 2. Not rank = 3, nullity = (rows) - 3.

---

## Connections

- **Chapter 02 — Basis:** The column space is the span of the columns; the null space is a subspace — both are defined by basis ideas from Chapter 02.
- **Chapter 04 — Matrices as Transformations:** The column space is the "image" of the transformation — all reachable outputs. The null space is the "kernel" — all inputs that map to zero. Rank = dimension of image.
- **Chapter 05 — Linear Systems:** Rank determines solvability. Nullity determines uniqueness. Together they fully classify all solutions.
- **Chapter 09 — Least Squares:** When Ax = b has no solution (b ∉ C(A)), least squares finds the x minimizing ||Ax - b|| — projecting b onto C(A).
- `08_SQL/` — SQL `GROUP BY` + `COUNT DISTINCT` is essentially computing the rank of the "key columns" — how many independent grouping directions exist.

---

> [< Previous: 02 Linear Independence & Basis](02_Linear_Independence_Basis.md) | [Course Index](README.md) | [Next → 04 Matrices as Linear Transformations](04_Matrices_as_Transformations.md)
