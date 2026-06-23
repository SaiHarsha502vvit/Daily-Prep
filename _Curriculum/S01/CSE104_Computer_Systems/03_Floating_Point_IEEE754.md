# Chapter 03 — Floating-Point Numbers (IEEE 754)

> [← 02 Integer Arithmetic & Two's Complement](02_Integer_Arithmetic_Twos_Complement.md) | [Course Index](README.md) | [Next → 04 Machine Code & Assembly](04_Machine_Code_Assembly.md)

---

## The Problem: Integers Can't Represent 0.1

With 32-bit integers we can represent numbers from -2 billion to +2 billion — but only integers. We need fractions (3.14, 0.001, 1.5 × 10⁻³⁸) and very large values (6.02 × 10²³). Integers fail on both fronts.

**Naive idea:** Use a fixed-point representation — store 8 bits before the decimal point, 8 bits after. But this limits range to ±128, with precision only to 1/256. Not useful for scientific computing.

**The real need:** A representation that scales its precision proportionally — high precision for small values, lower precision for large ones. Like scientific notation: 6.674 × 10⁻¹¹ (gravitational constant) and 5.972 × 10²⁴ (mass of Earth in kg) both written with 4 significant digits.

This is exactly what **floating-point** does.

---

## Scientific Notation in Binary

In decimal scientific notation: value = mantissa × 10^exponent (e.g., 6.674 × 10⁻¹¹).

In binary scientific notation: value = 1.fraction × 2^exponent.

The leading "1." is always present in normalized form (as long as the number is non-zero). We exploit this by NOT storing it — the **implicit leading bit** saves us one bit for free.

---

## IEEE 754 Single Precision (32-bit float)

The 32 bits are divided into three fields:

```
Bit: 31  | 30 .... 23 | 22 .............. 0
     Sign | Exponent   | Fraction (Mantissa)
     1 bit| 8 bits     | 23 bits
```

**Sign bit (S):** 0 = positive, 1 = negative.

**Exponent (E):** 8 bits, stored with a **bias of 127**. Actual exponent = E - 127.
- E = 0: special (denormalized or zero)
- E = 1 to 254: normalized numbers, exponent = E - 127 (range: -126 to +127)
- E = 255: special (infinity or NaN)

**Fraction (F):** 23 bits representing the fractional part after the implicit 1.

**Value formula:** `(-1)^S × 1.F × 2^(E-127)` for normalized numbers.

---

## Encoding Examples

### Encoding +0.75

```
0.75 = 3/4

In binary: 0.75 = 0.11₂
Normalized: 1.1 × 2⁻¹   (shift right 1, exponent = -1)

S = 0 (positive)
E = -1 + 127 = 126 = 01111110₂
F = 1000 0000 0000 0000 0000 000  (the "1" after the decimal point)

Full bit pattern: 0 01111110 10000000000000000000000
Hex: 0x3F400000
```

### Encoding -5.0

```
5 = 101₂
Normalized: 1.01 × 2²

S = 1 (negative)
E = 2 + 127 = 129 = 10000001₂
F = 010 0000 0000 0000 0000 0000

Full bit pattern: 1 10000001 01000000000000000000000
Hex: 0xC0A00000
```

### Decoding 0x42280000

```
Hex: 0x42280000
Binary: 0 10000100 01010000000000000000000

S = 0 (positive)
E = 10000100₂ = 128 + 4 = 132
  Actual exponent = 132 - 127 = 5
F = 01010000000000000000000

Value = 1.01010... × 2⁵
      = 1.0101₂ × 32
      = 101010₂
      = 32 + 8 + 2 = 42.0

0x42280000 = 42.0 ✓ (the answer to the ultimate question!)
```

---

## Double Precision (64-bit double)

| Field | float (32-bit) | double (64-bit) |
|-------|---------------|-----------------|
| Sign | 1 bit | 1 bit |
| Exponent | 8 bits (bias 127) | 11 bits (bias 1023) |
| Fraction | 23 bits | 52 bits |
| Range | ±3.4 × 10³⁸ | ±1.8 × 10³⁰⁸ |
| Precision | ~7 decimal digits | ~15-16 decimal digits |

`double` is the default in Java and most scientific code. `float` is used in graphics (GPUs) and ML (16-bit "half" is now common for neural net weights).

---

## Special Values

IEEE 754 reserves certain bit patterns for non-numeric cases:

| Pattern | Meaning | Example |
|---------|---------|---------|
| E=0, F=0, S=0 | +0 | 0.0 |
| E=0, F=0, S=1 | -0 | -0.0 (distinct from +0 in sign, equal in comparison) |
| E=0, F≠0 | Denormalized (subnormal) | Very small numbers near 0 |
| E=255, F=0, S=0 | +∞ | 1.0 / 0.0 |
| E=255, F=0, S=1 | -∞ | -1.0 / 0.0 |
| E=255, F≠0 | NaN (Not a Number) | 0.0 / 0.0, √(-1) |

```java
System.out.println(1.0 / 0.0);    // Infinity
System.out.println(-1.0 / 0.0);   // -Infinity
System.out.println(0.0 / 0.0);    // NaN
System.out.println(Double.isNaN(0.0 / 0.0));   // true
System.out.println(Double.NaN == Double.NaN);   // false! NaN ≠ NaN always
// To check for NaN: Double.isNaN(x), NOT x == Double.NaN
```

**Why NaN ≠ NaN?** By IEEE 754 design: a "not a number" value has no meaningful equality. Also, `NaN < NaN`, `NaN > NaN`, `NaN <= NaN` — all false. This breaks sorting algorithms that assume `!(a < b) && !(a > b)` implies `a == b`.

**Subnormal numbers:** When E=0, the implicit leading bit is 0 (not 1). This allows gradual underflow to 0 instead of sudden loss of all small values. The smallest positive normal float is ~1.18 × 10⁻³⁸; subnormals extend down to ~1.4 × 10⁻⁴⁵.

---

## Why `0.1 + 0.2 ≠ 0.3`

This is the most famous floating-point surprise. Let's trace it:

**0.1 in binary:**
```
0.1 = 1/10

In binary: 0.0001100110011001100110011...₂  (REPEATING)

Like 1/3 = 0.333... in decimal, 1/10 cannot be represented exactly in binary.

IEEE 754 stores: 0.0001100110011001100110011001101  (23 bits, rounded)
                = 0.10000000000000000555111512313₁₀  (approximate!)
```

**0.2 in binary:** similarly repeating, similarly rounded.

**Sum:** The two rounded values add to something slightly different from 0.3's rounded representation. The error is at the 16th decimal digit — invisible in most output, but detectable with `==`.

```python
>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
>>> abs(0.1 + 0.2 - 0.3) < 1e-10
True   ← use epsilon comparison, not ==
```

**Rule:** NEVER compare floats with `==`. Always use epsilon: `|a - b| < epsilon`.

### Relative vs Absolute Epsilon

```python
def float_equal(a, b, rel_tol=1e-9, abs_tol=1e-12):
    # Relative tolerance for large numbers, absolute for values near 0
    return abs(a - b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)

# Python 3.5+: math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)
import math
math.isclose(0.1 + 0.2, 0.3)  # True
```

---

## Floating-Point Pitfalls

### Loss of Significance (Catastrophic Cancellation)

When subtracting two nearly-equal large numbers, significant digits are lost:

```
a = 1234567.891234567   (full precision)
b = 1234567.891234568   (full precision)
a - b = -0.000000001    (only 1 significant digit left!)

The relative error is now enormous.
```

**Example in code:**
```python
x = 1.0000001
# Computing (x - 1) vs direct value:
print(x - 1.0)   # 1.0000000116860974e-07  (imprecise due to cancellation)
# Better: compute (x² - 1) as (x-1)(x+1) when x ≈ 1.
```

### Association Is Not Guaranteed

Floating-point addition is NOT associative:

```python
a, b, c = 1e15, -1e15, 1.0
print((a + b) + c)   # 1.0   (correct)
print(a + (b + c))   # 0.0   (WRONG! b+c = -1e15 + 1 ≈ -1e15, then a - 1e15 = 0)
```

Compilers may reorder floating-point operations for speed (with `-ffast-math`). This can silently change results. Use `-ffast-math` only if you've analyzed the impact.

### Accumulation of Errors

Summing many floating-point numbers accumulates rounding errors:

```python
# Naive sum of 1e7 values of 0.1:
total = 0.0
for _ in range(10_000_000):
    total += 0.1
print(total)  # 1000000.0000001316  (error in 7th decimal place)

# Better: Kahan summation algorithm
def kahan_sum(values):
    total = 0.0
    compensation = 0.0
    for v in values:
        y = v - compensation
        t = total + y
        compensation = (t - total) - y
        total = t
    return total
```

---

## Practical Floating-Point Rules

1. **Never use `==` for floats.** Use `Math.abs(a - b) < epsilon` or `Math.ulp`.
2. **Use `double` over `float`** unless you have a specific reason (GPU, memory-constrained, ML).
3. **For money: use integers.** Store prices in cents (integers), not dollars (floats). `$10.99` → `1099` cents. Never `10.99` as a float.
4. **Order matters.** Sum small-to-large for better accuracy. Add numbers of similar magnitude together first.
5. **Be aware of NaN propagation.** Any operation with NaN produces NaN. A NaN in a calculation silently corrupts all downstream results until something checks for it.

```java
// Java: BigDecimal for exact decimal arithmetic (financial systems)
import java.math.BigDecimal;
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));  // 0.3 (exact!)
// Note: BigDecimal("0.1") ≠ BigDecimal(0.1) — the double 0.1 is already imprecise
```

---

## Section Challenge

> ### Floating-Point Bug Hunt
>
> You're reviewing a financial application's interest calculation:
>
> ```java
> public class InterestCalculator {
>
>     // Compound interest: A = P(1 + r/n)^(nt)
>     public static double compoundInterest(double principal, double annualRate,
>                                           int compoundsPerYear, int years) {
>         double rate = annualRate / compoundsPerYear;
>         double factor = Math.pow(1 + rate, compoundsPerYear * years);
>         return principal * factor;
>     }
>
>     public static boolean isRoundNumber(double amount) {
>         return amount % 1.0 == 0.0;
>     }
>
>     public static double sumPayments(double[] payments) {
>         double total = 0.0;
>         for (double p : payments) total += p;
>         return total;
>     }
>
>     public static void main(String[] args) {
>         // $1000 at 10% for 1 year, compounded 12 times
>         double result = compoundInterest(1000.0, 0.10, 12, 1);
>         System.out.println(result);             // Expected: ~1104.71
>
>         // Check if $100.00 is a round number
>         double x = 0.1 * 1000;
>         System.out.println(isRoundNumber(x));   // Expected: true
>
>         // Sum 100 payments of $1.11
>         double[] payments = new double[100];
>         Arrays.fill(payments, 1.11);
>         System.out.println(sumPayments(payments));  // Expected: 111.0
>     }
> }
> ```
>
> **Q1:** What does `compoundInterest(1000.0, 0.10, 12, 1)` actually return? Is it close enough for financial use? What's the risk?
>
> **Q2:** What does `isRoundNumber(0.1 * 1000)` return and why? What should it return?
>
> **Q3:** What does `sumPayments` return for 100 payments of $1.11? Is this exact?
>
> **Q4:** Rewrite this class using `BigDecimal` to fix all three issues.

<details>
<summary>Full answers</summary>

```
Q1: compoundInterest(1000, 0.10, 12, 1)

Formula: 1000 × (1 + 0.10/12)^12
       = 1000 × (1.008333...)^12

0.10/12 = 0.008333333333333333... (repeating, cannot be stored exactly)
The stored value: 0.00833333333333333287... (rounded)

(1 + 0.00833...)^12 ≈ 1.10471306744...

1000 × 1.10471306744 = 1104.71306744...

Result: ~1104.7130674151 (Java double)

Is this close enough? For DISPLAY: yes (round to 2 decimal places = $1104.71).
RISK: For internal calculations, the error accumulates. If you compound
thousands of accounts over years and sum totals, small errors can add up
to visible discrepancies (off-by-one-cent errors in regulatory reports,
rounding inconsistencies between clients). Financial regulations often require
exact decimal arithmetic.

──────────────────────────────────────────────────────

Q2: isRoundNumber(0.1 * 1000)

0.1 in binary is 0.0001100110011... (repeating, rounded)
0.1 × 1000: multiply the rounded representation by 1000.

Result: 99.99999999999999 or 100.00000000000001? Depends on rounding.

In practice: 0.1 * 1000 = 100.00000000000001 (on most x86 hardware)
             100.00000000000001 % 1.0 ≠ 0.0 → isRoundNumber returns FALSE

Expected: TRUE. Actual: FALSE. Bug confirmed.

The right test: Math.abs(x - Math.round(x)) < 1e-9

──────────────────────────────────────────────────────

Q3: sumPayments for 100 × 1.11

1.11 in binary: repeating fraction, rounded.
Stored 1.11 = 1.10999999999999999... (slightly less than 1.11)

100 × 1.11 = 110.99999999999998...  (NOT 111.0 exactly)

sumPayments returns: 110.99999999999997 or similar.
Should return: 111.0.

This is a real problem for payment reconciliation: 100 small payments should
sum to exactly $111.00, but your code says $110.999999... — it won't balance.

──────────────────────────────────────────────────────

Q4: Fix using BigDecimal

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

public class InterestCalculator {

    // Use String constructor — NOT BigDecimal(double)!
    public static BigDecimal compoundInterest(
            BigDecimal principal, BigDecimal annualRate,
            int compoundsPerYear, int years) {
        
        BigDecimal rate = annualRate.divide(
            BigDecimal.valueOf(compoundsPerYear), 20, RoundingMode.HALF_EVEN);
        BigDecimal factor = BigDecimal.ONE.add(rate).pow(compoundsPerYear * years);
        return principal.multiply(factor).setScale(2, RoundingMode.HALF_EVEN);
    }

    public static boolean isRoundNumber(BigDecimal amount) {
        return amount.stripTrailingZeros().scale() <= 0;
    }

    public static BigDecimal sumPayments(BigDecimal[] payments) {
        BigDecimal total = BigDecimal.ZERO;
        for (BigDecimal p : payments) total = total.add(p);
        return total;
    }

    public static void main(String[] args) {
        BigDecimal result = compoundInterest(
            new BigDecimal("1000.00"),
            new BigDecimal("0.10"),
            12, 1);
        System.out.println(result);   // 1104.71 (rounded to cents)

        BigDecimal x = new BigDecimal("0.1").multiply(BigDecimal.valueOf(1000));
        System.out.println(isRoundNumber(x));   // true ✓

        BigDecimal[] payments = new BigDecimal[100];
        Arrays.fill(payments, new BigDecimal("1.11"));
        System.out.println(sumPayments(payments));  // 111.00 ✓
    }
}

KEY RULES:
- new BigDecimal("0.1") — exact decimal 0.1
- new BigDecimal(0.1)  — the DOUBLE 0.1, which is already imprecise! WRONG.
- Use RoundingMode.HALF_EVEN (banker's rounding) for financial calculations
  (rounds .5 to nearest even digit, minimizing systematic bias).
```

</details>

---

## Common Mistakes

**Mistake 1: `new BigDecimal(0.1)` instead of `new BigDecimal("0.1")`**
- `new BigDecimal(0.1)` takes a double first, which is already imprecise. The BigDecimal wraps that imprecise value. Always use the String constructor or `BigDecimal.valueOf(0.1)`.

**Mistake 2: Checking for NaN with `==`**
- `x == Double.NaN` is ALWAYS false (even if x is NaN). Use `Double.isNaN(x)` or `Float.isNaN(x)`.

**Mistake 3: Believing `(float)` casts preserve precision**
- Casting a `double` to `float` reduces precision from 15 to 7 significant digits. The double `3.141592653589793` becomes the float `3.1415927` — a visible difference. Cast carefully.

**Mistake 4: Using `float` for loop counters**
- `for (float f = 0.0f; f != 1.0f; f += 0.1f)` may loop forever or wrong number of times. Floating-point counter may never exactly reach 1.0f. Always use integer loop counters.

---

## Connections

- **Chapter 02 — Integers:** Float and int are stored in the same registers (in legacy x86) or separate FP registers (in modern x86). Integer overflow is defined; float overflow produces ±∞.
- **Chapter 05 — Processor:** The FPU (Floating-Point Unit) or SSE/AVX units handle float operations. SIMD can process 8 floats simultaneously in one instruction.
- **Chapter 06 — Memory:** Floats need careful alignment (4-byte aligned for float, 8-byte for double). Misalignment causes performance penalty or hardware exception.

---

> [← 02 Integer Arithmetic & Two's Complement](02_Integer_Arithmetic_Twos_Complement.md) | [Course Index](README.md) | [Next → 04 Machine Code & Assembly](04_Machine_Code_Assembly.md)
