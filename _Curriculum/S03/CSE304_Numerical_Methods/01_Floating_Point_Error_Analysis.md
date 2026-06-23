# Chapter 1 — Floating Point Arithmetic and Error Analysis

> "Every number you've ever computed on a computer is wrong. The art of numerical methods is knowing how wrong, and staying within useful bounds."

---

## The Problem That Starts Everything

Punch this into Python:

```python
>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
```

This isn't a bug. It's a fundamental consequence of representing infinite-precision real numbers in finite binary storage. Understanding *why* this happens — and *how much error accumulates* — is the foundation of numerical computing.

---

## 1.1 Why Binary Can't Represent 0.1

In decimal, fractions with denominators that are powers of 10 terminate: 1/4 = 0.25, 1/5 = 0.2. Fractions with other denominators repeat: 1/3 = 0.333...

In binary, only fractions with denominators that are powers of 2 terminate: 1/2 = 0.1₂, 1/4 = 0.01₂, 1/8 = 0.001₂.

**0.1 in binary:**

```
0.1 × 2 = 0.2  → digit 0
0.2 × 2 = 0.4  → digit 0
0.4 × 2 = 0.8  → digit 0
0.8 × 2 = 1.6  → digit 1
0.6 × 2 = 1.2  → digit 1
0.2 × 2 = 0.4  → digit 0  ← repeat!
```

0.1₁₀ = 0.000110011001100...₂ — an infinite repeating pattern. With 52 bits of mantissa (double precision), we truncate. The stored value is approximately:

```
0.1000000000000000055511151231257827021181583404541015625
```

This tiny error, accumulated across arithmetic operations, produces the result you saw.

---

## 1.2 IEEE 754 Double Precision

Modern computers use IEEE 754 floating-point standard. A `double` (64-bit) encodes:

```
[ sign (1 bit) | exponent (11 bits) | mantissa (52 bits) ]
```

**Value formula:**
```
x = (-1)^s × 1.mantissa₂ × 2^(exponent - 1023)
```

The "1." is implicit — the leading 1 is always there (for normalized numbers), so you get 53 bits of precision effectively.

**Special values:**
- `exponent = 0`: denormalized numbers (handle very small magnitudes near zero)
- `exponent = 2047, mantissa = 0`: ±∞ (result of 1.0/0.0)
- `exponent = 2047, mantissa ≠ 0`: NaN (result of 0.0/0.0, √(-1), etc.)

**Representable range:**

| Type | Min positive normal | Max | Decimal digits |
|------|--------------------|----|----------------|
| float32 | ~1.18 × 10⁻³⁸ | ~3.40 × 10³⁸ | ~7 |
| float64 | ~2.23 × 10⁻³⁰⁸ | ~1.80 × 10³⁰⁸ | ~15-16 |
| float128 | ~3.36 × 10⁻⁴⁹³² | ~1.19 × 10⁴⁹³² | ~33-34 |

---

## 1.3 Machine Epsilon

**Machine epsilon** ε_mach is the smallest number such that:
```
fl(1 + ε_mach) > 1
```

In other words: the gap between 1 and the next representable float.

For double precision: **ε_mach = 2⁻⁵² ≈ 2.22 × 10⁻¹⁶**.

```python
import sys
print(sys.float_info.epsilon)  # 2.220446049250313e-16
```

**Why this matters:** Any arithmetic result is accurate to about 15-16 significant decimal digits. If your computation produces a result like `3.14159265358979...`, the last few digits might be garbage.

**Relative gap:** Between any floating-point number x and the next representable number, the gap is approximately |x| × ε_mach. The gaps are larger for large numbers, smaller for small numbers — this is key to understanding floating-point error.

---

## 1.4 Types of Error

### Absolute Error
```
|x_computed - x_true|
```

Example: computed π = 3.14159, true π ≈ 3.14159265...
Absolute error ≈ 0.00000265.

### Relative Error
```
|x_computed - x_true| / |x_true|
```

Same example: relative error ≈ 0.00000265 / 3.14159 ≈ 8.4 × 10⁻⁷.

**Relative error is usually more meaningful.** A temperature off by 1°C means something different at 100°C vs 0.001°C.

### Rounding Error

When a real number is stored as floating-point:
```
fl(x) = x(1 + δ)   where |δ| ≤ ε_mach/2
```

Every basic arithmetic operation has rounding error at most ε_mach (relative):
```
fl(x ⊕ y) = (x + y)(1 + δ)   |δ| ≤ ε_mach
```

### Truncation Error

When we approximate an infinite process with finite steps. Example: Taylor series truncation:
```
sin(x) ≈ x - x³/6 + x⁵/120   (dropping higher terms)
```

Truncation error is the mathematical error of using the approximation, independent of floating-point representation.

---

## 1.5 Catastrophic Cancellation

The most dangerous floating-point phenomenon.

**Setup:** Subtract two nearly-equal numbers.

```python
a = 1.00000000000001
b = 1.00000000000000
a - b = 0.00000000000001   # only 1 significant digit left!
```

**Why it's catastrophic:** Both a and b have ~15 significant digits. Their difference should have 15 significant digits too. But because they agree in all leading digits, those cancel, leaving only the digits where they *differ* — which were already at the limit of precision.

**Example: Computing discriminant √(b² - 4ac)**

For the quadratic ax² + bx + c = 0 with a=1, b=100000, c=1:

**Standard formula:** x = (-b ± √(b²-4ac)) / (2a)

```python
a, b, c = 1, 100000, 1
disc = b**2 - 4*a*c   # 10000000000 - 4 = 9999999996
x1 = (-b + math.sqrt(disc)) / (2*a)
x2 = (-b - math.sqrt(disc)) / (2*a)
```

x1 = (-100000 + 99999.99998) / 2 → numerator ≈ -0.00002 (4 significant digits lost!)

True x1 ≈ -0.00001 (catastrophic cancellation!)

**Fix:** Use the numerically stable form. When b > 0:
```
x2 = (-b - √disc) / (2a)  ← safe (same signs, no cancellation)
x1 = c / (a * x2)          ← use Vieta's formula: x1 * x2 = c/a
```

This is a classic example of **reformulating** to avoid cancellation.

---

## 1.6 Error Propagation

**Question:** If f(x) has a small error δx in x, how large is the error in f(x)?

**First-order analysis (Taylor expansion):**
```
f(x + δx) ≈ f(x) + f'(x)·δx
```

So: **|δf| ≈ |f'(x)| · |δx|**

**Relative error version:**
```
|δf/f| ≈ |x · f'(x) / f(x)| · |δx/x|
```

The factor |x · f'(x) / f(x)| is the **condition number of f at x**, written κ(x).

### Multi-variable error propagation

For z = f(x, y):
```
|δz| ≈ |∂f/∂x| · |δx| + |∂f/∂y| · |δy|
```

**Example: z = x - y with x = 1.0001, y = 1.0000, each with error 10⁻⁴:**

```
∂z/∂x = 1, ∂z/∂y = -1
|δz| ≤ 1·10⁻⁴ + 1·10⁻⁴ = 2×10⁻⁴
z = 0.0001
Relative error ≤ 2×10⁻⁴ / 0.0001 = 2 = 200%!
```

Catastrophic cancellation in formula form: small result + large errors in inputs = huge relative error.

---

## 1.7 Condition Number — The Key Concept

**Definition:** The condition number of a problem measures how much the output changes relative to a change in input.

For scalar function f:
```
κ = |x · f'(x) / f(x)|
```

**Interpretation:**
- κ ≈ 1: well-conditioned. Small input errors → small output errors.
- κ >> 1: ill-conditioned. Small input errors → large output errors. You're multiplying the error.
- κ depends on the PROBLEM, not the ALGORITHM.

**Example: Evaluating p(x) = (x-1)⁸ at x near 1**

Near x = 1, the polynomial equals nearly 0. A tiny perturbation in x gives a large relative change in p(x):

```
p(1 + ε) = ε⁸   but   p(1) = 0
Relative change = |ε⁸ - 0| / |ε⁸| = not even defined at 0!
```

This polynomial is ill-conditioned near its root. The condition number → ∞ as x → 1.

**Condition number for matrix-vector multiply (Ax = b):**

κ(A) = ||A|| · ||A⁻¹||

If κ(A) = 10⁶ and you solve Ax = b with 10⁻¹⁶ precision, you might get x with only 10⁻¹⁰ accurate digits — losing 6 digits to the condition number.

---

## 1.8 Stability vs Accuracy

**Accuracy:** How close is the computed answer to the true answer?

**Stability:** Does a small perturbation in input (or rounding errors during computation) lead to a small perturbation in output?

These are different! An algorithm can be:
- **Accurate but unstable:** theoretically correct formula, but loses precision in floating-point
- **Stable but not quite accurate:** produces a nearby answer to a slightly perturbed problem

**Backward stability (the gold standard):** An algorithm is **backward stable** if the computed result is the exact result for a slightly perturbed input:

```
computed(x) = exact(x + δx)   where |δx| is small
```

Example: Gaussian elimination with partial pivoting is backward stable for well-conditioned systems.

**Why backward stability matters:** If the problem is well-conditioned (small κ) and the algorithm is backward stable, the answer is as good as possible given the floating-point representation. You can't do better on this machine.

---

## 1.9 Kahan Summation — A Case Study in Stability

**Problem:** Sum n floating-point numbers naively:

```python
total = 0
for x in data:
    total += x
```

Each addition has error ε_mach. After n additions, accumulated error can be O(n · ε_mach · |result|) — grows linearly with n.

**Kahan's algorithm:** Track the accumulated rounding error explicitly:

```python
total = 0.0
c = 0.0           # compensation for lost low-order bits
for x in data:
    y = x - c        # compensate before adding
    t = total + y
    c = (t - total) - y  # what was lost when adding y to total
    total = t
```

**Why it works:** After `t = total + y`, the difference `(t - total)` recovers the high-order bits of y that were preserved in t. Subtracting y gives the rounding error — which is then corrected in the next iteration.

**Result:** Error is O(ε_mach) regardless of n — independent of the number of terms.

```python
# Demo: sum [1, 1e-16, 1e-16, ..., 1e-16] (10^16 tiny terms)
# Naive: 1.0 + 0.0 + 0.0 + ... = 1.0 (tiny terms swallowed)
# Kahan: correctly accumulates the tiny contributions
```

This is used in numpy's sum for high-precision needs.

---

## Section Challenge

---

**Q1.** What is the machine epsilon for float32 (single precision, 23-bit mantissa)? What does it imply about the number of significant decimal digits?

<details>
<summary>Answer</summary>

For 23-bit mantissa: **ε_mach = 2⁻²³ ≈ 1.19 × 10⁻⁷**.

Significant decimal digits: log₁₀(2²³) = 23 × log₁₀(2) ≈ 23 × 0.301 ≈ **6.9 digits**.

So float32 gives about 7 significant decimal digits. Compare to float64: 52 × 0.301 ≈ **15.7 digits**.

**Practical implication:** In float32, computing 1000000 + 0.1 gives 1000000.0 (the 0.1 is below ε_mach × 1000000 ≈ 0.119). The information is lost. This is why neural network training in float16 (2-byte) requires careful techniques — with ε_mach ≈ 0.001, tiny gradient updates can completely vanish.
</details>

---

**Q2.** Compute the condition number of f(x) = √x at x = 4. Is this a well-conditioned or ill-conditioned problem?

<details>
<summary>Answer</summary>

f(x) = √x, f'(x) = 1/(2√x).

At x = 4:
```
κ = |x · f'(x) / f(x)| = |4 · (1/(2·2)) / 2| = |4 · (1/4) / 2| = |1/2| = 0.5
```

κ = 0.5 < 1 → **well-conditioned**. A relative error in x leads to only *half* as large a relative error in √x. Computing square roots is safe numerically.

**Intuition:** √x compresses the range. A 1% error in x leads to only a 0.5% error in √x. Compare to x² which has κ = 2 (amplifies by 2) or x¹⁰ which has κ = 10 (amplifies by 10). High powers are increasingly ill-conditioned.
</details>

---

**Q3.** The formula for variance is: Var = E[X²] - (E[X])². This is known to be numerically unstable. Explain why and describe a more stable formula.

<details>
<summary>Answer</summary>

**Why unstable:** E[X²] and (E[X])² can be very close when the variance is small relative to the mean. 

Example: data = {10000001, 10000002, 10000003}.
- E[X] = 10000002
- E[X²] ≈ 100000040000005 (approximately)
- (E[X])² = 100000040000004
- Difference = 1 (the true variance)

Both terms are ~10¹⁴, their difference is ~1. With float64 (15 digits), computing 100000040000005 - 100000040000004 might give garbage — these numbers differ only in the last digits, exactly where floating-point error lives.

**Welford's online stable formula:**

```python
n = 0
mean = 0.0
M2 = 0.0   # accumulates (x - mean)² terms

for x in data:
    n += 1
    delta = x - mean
    mean += delta / n
    delta2 = x - mean    # NOTE: updated mean!
    M2 += delta * delta2

variance = M2 / n   # or M2/(n-1) for sample variance
```

This works because we subtract the **running mean** from each x before squaring, keeping numbers small. The mean stays near the data values rather than being a huge number we subtract at the end.

**Numerical advantage:** delta = x - mean stays O(spread of data), not O(magnitude of data). No catastrophic cancellation.
</details>

---

**Q4.** A student computes e^x - 1 for small x using the direct formula. Why is this bad? What's the fix?

<details>
<summary>Answer</summary>

**The problem:** For small x (|x| ≈ 10⁻⁸), e^x ≈ 1 + x + x²/2 + ... ≈ 1.00000001.

Computing `e^x - 1`:
1. Compute e^x ≈ 1.000000010000000050000... (1 with tiny tail)
2. Subtract 1: result ≈ 1.0 × 10⁻⁸ with only ~8 significant digits left

In float64, this loses 8 digits of precision. For x = 10⁻¹⁵, you get literally 0 back (e^x rounds to exactly 1.0 in floating point).

**The fix:** Use the special function `expm1(x)` which computes e^x - 1 directly using the Taylor series representation when x is small:

```python
import math
x = 1e-15
bad  = math.exp(x) - 1   # gives 0.0 or near 0 — WRONG
good = math.expm1(x)     # gives 1e-15 — CORRECT
```

`expm1` switches between the direct formula (for large x) and the Taylor series x + x²/2! + x³/3! + ... (for small x), avoiding the catastrophic cancellation.

Similar issue: `log(1+x)` for small x → use `log1p(x)`.
</details>

---

**Q5.** An algorithm computes (a + b) × c. The backward error analysis shows it computes the exact result for inputs (a + δa, b + δb) × (c + δc) where |δa| ≤ ε|a|, |δb| ≤ ε|b|, |δc| ≤ ε|c|. Is this algorithm backward stable? What bound do you get on the forward error?

<details>
<summary>Answer</summary>

**Is it backward stable?** Yes — the computed result equals the exact result for slightly perturbed inputs. The perturbations δa, δb, δc are each bounded by ε_mach times the input magnitude. This is exactly the definition of backward stability.

**Forward error bound:** True result: R = (a+b)×c. Computed result: R̂ = (a+δa+b+δb)×(c+δc).

```
R̂ - R = (a+b+δa+δb)(c+δc) - (a+b)c
       = (a+b)δc + (δa+δb)c + (δa+δb)δc
       ≈ (a+b)δc + (δa+δb)c   (ignoring second-order term)
```

Taking absolute values:
```
|R̂ - R| ≤ |a+b|·|δc| + |c|·(|δa|+|δb|)
         ≤ |a+b|·ε|c| + |c|·2ε·max(|a|,|b|)
         ≤ ε·(|a+b||c| + 2|c|·max(|a|,|b|))
```

Relative error: |R̂ - R| / |R| = |R̂ - R| / |(a+b)c|.

If a and b have the same sign: |a+b| = |a|+|b|, no cancellation, forward error is O(ε). 

If a ≈ -b (nearly cancel): |a+b| << |a|, |b|, but the bound |a+b||c|ε/|R| = ε regardless (the absolute error is small because the result is small). BUT the error from (δa+δb)c relative to R = (a+b)c can be huge: 2ε|a||c| / |a+b||c| = 2ε|a|/|a+b| >> ε if |a+b| << |a|.

This is catastrophic cancellation in action — the backward stability doesn't prevent large relative forward errors when the problem itself is ill-conditioned (large κ for subtraction of nearly equal numbers).
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| Floating-point representation | 1.mantissa × 2^e; most decimals don't terminate in binary |
| Machine epsilon | gap between 1 and next float; ε_mach = 2⁻⁵² for float64 |
| Absolute / Relative error | absolute = |true-computed|; relative = that / |true| |
| Rounding vs Truncation error | rounding from finite representation; truncation from finite approximation |
| Catastrophic cancellation | subtracting nearly equal numbers destroys significant digits |
| Condition number | κ = amplification of relative error; problem property, not algorithm |
| Backward stability | computed = exact for slightly perturbed input; gold standard |
| Kahan summation | tracks rounding error explicitly; O(ε_mach) regardless of n |

**Where we go next:** Chapter 2 uses these error concepts immediately — finding roots of equations, where we must carefully control how errors grow across iterations.

---

*Next: [02 — Root Finding](02_Root_Finding.md)*
