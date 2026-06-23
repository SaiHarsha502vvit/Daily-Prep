# Chapter 02 — Integer Arithmetic & Two's Complement

> [← 01 Bits, Bytes & Data Representation](01_Bits_Bytes_Data_Representation.md) | [Course Index](README.md) | [Next → 03 Floating-Point Numbers](03_Floating_Point_IEEE754.md)

---

## The Problem: How Do You Represent Negative Numbers?

We know how to store positive integers in binary. But what about negative numbers? You might suggest: use a sign bit (0 for positive, 1 for negative). Let's try:

**Sign-magnitude:** Use bit 7 as sign, bits 6-0 as magnitude.

```
+5 = 00000101
-5 = 10000101
```

Seems reasonable. But there's a fatal problem: **you need custom circuitry for subtraction**. Addition of +5 and -5 should give 0, but:

```
00000101  (+5)
10000101  (-5)
────────
10001010  ≠ 0  (gives -10, wrong!)
```

Also, you get +0 (`00000000`) AND -0 (`10000000`) — two representations of zero, complicating equality checks.

A better design should let the SAME addition circuit handle both positive and negative numbers, with no special cases.

---

## Two's Complement: The Elegant Solution

**Key insight:** Design the negative number representation so that n + (-n) = 0, using ordinary binary addition (with overflow discarded).

For 8-bit numbers, addition discards anything above bit 7. So we want: `+5 + (-5) = 256` (which wraps to 0).

Therefore: `-5 = 256 - 5 = 251 = 11111011₂`.

This gives us **two's complement**: the negative of a number n is `(2ⁿ - n)` for n-bit numbers.

**Computing -n in two's complement:**
1. Flip all bits (one's complement).
2. Add 1.

```
+5 = 00000101
Flip:  11111010   (one's complement of 5)
Add 1: 11111011   = -5 in two's complement ✓

Verify: 00000101 + 11111011 = 100000000 (carry out of bit 7 is discarded)
                             = 00000000 = 0 ✓
```

---

## The 8-Bit Two's Complement Range

| Bits | Value |
|------|-------|
| `00000000` | 0 |
| `00000001` | +1 |
| `01111111` | +127 (maximum positive) |
| `10000000` | -128 (most negative!) |
| `10000001` | -127 |
| `11111111` | -1 |

**Range: -128 to +127** for 8-bit signed integers.

In general, for n-bit two's complement:
- **Maximum:** 2^(n-1) - 1
- **Minimum:** -2^(n-1)
- **Range is asymmetric:** one more negative value than positive

Why asymmetric? Because 0 occupies one of the "positive" slots. There's no -0.

**Why does `10000000` = -128?** Because the sign bit has weight `-2^(n-1)`:

```
Bit weights in two's complement (8-bit):
Position: 7      6    5    4    3   2   1   0
Weight:  -128   64   32   16   8   4   2   1

10000000 = -128 + 0 + ... + 0 = -128 ✓
11111111 = -128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = -1 ✓
```

---

## Integer Types and Their Ranges

| Type (Java/C) | Bits | Min | Max |
|---------------|------|-----|-----|
| `byte` / `int8_t` | 8 | -128 | 127 |
| `short` / `int16_t` | 16 | -32,768 | 32,767 |
| `int` / `int32_t` | 32 | -2,147,483,648 | 2,147,483,647 |
| `long` / `int64_t` | 64 | ≈ -9.2 × 10¹⁸ | ≈ 9.2 × 10¹⁸ |
| `unsigned byte` / `uint8_t` | 8 | 0 | 255 |
| `unsigned int` / `uint32_t` | 32 | 0 | 4,294,967,295 |

Unsigned integers simply use all bits for magnitude (no two's complement, no sign bit).

---

## Integer Overflow: The Silent Bug

**What happens when a computation exceeds the range?**

In C and Java, signed integer overflow is handled differently:

**In C (signed overflow = undefined behavior):**
Technically UB — the compiler may assume it never happens and optimize accordingly. In practice, most hardware wraps around, but you cannot rely on it.

**In Java (signed overflow = well-defined wrap-around):**
```java
int x = Integer.MAX_VALUE;  // 2,147,483,647
x = x + 1;
System.out.println(x);      // -2,147,483,648  (wraps to MIN_VALUE!)
```

**In unsigned C (well-defined modular arithmetic):**
```c
uint8_t x = 255;
x = x + 1;   // x is now 0  (256 mod 256 = 0)
```

### Real-World Overflow Bugs

**The Ariane 5 rocket (1996):** A 64-bit float representing horizontal velocity was converted to a 16-bit signed integer. The value exceeded 32,767. The conversion overflowed. The guidance system crashed. The rocket self-destructed. Cost: ~$370 million.

**Year 2038 problem:** Unix timestamps store seconds since Jan 1, 1970 as a 32-bit signed integer. On January 19, 2038 at 03:14:07 UTC, `time_t` overflows to -2,147,483,648 — representing December 13, 1901. Any software still using 32-bit time_t will fail. (Most systems now use 64-bit time_t.)

**Video game score overflow (Pac-Man, Donkey Kong kill screen):** Game variables stored in fixed-size integers overflow at certain score/level thresholds, corrupting game state.

---

## Addition and the Carry Flag

Binary addition uses the same column-by-column addition as decimal:

```
  0111 1111  (+127)
+ 0000 0001  (+1)
──────────
  1000 0000  (-128 in two's complement!)   ← SIGNED OVERFLOW

The carry into bit 7 ≠ carry out of bit 7 → overflow flag (OF) is set.
```

Modern CPUs set **status flags** after each arithmetic operation:
- **CF (Carry Flag):** carry out of the most significant bit (unsigned overflow)
- **OF (Overflow Flag):** signed overflow (carry into MSB ≠ carry out of MSB)
- **ZF (Zero Flag):** result is zero
- **SF (Sign Flag):** result is negative (MSB = 1)

These flags power all conditional branches: `jz` (jump if ZF=1), `jl` (jump if less), etc.

---

## Signed vs Unsigned Arithmetic: Comparing Numbers

**The hidden trap:** In C, when you mix signed and unsigned in a comparison, the signed value is silently cast to unsigned:

```c
int a = -1;
unsigned int b = 0;

if (a < b) {    // You expect TRUE. What happens?
    printf("a is less than b\n");
} else {
    printf("a is NOT less than b\n");  // This prints!
}
// Reason: -1 (0xFFFFFFFF as two's complement) becomes 4,294,967,295 as unsigned.
// 4,294,967,295 > 0. So a is NOT less than b in unsigned comparison.
```

**Classic C security bug:**
```c
int n = get_input_size();    // attacker controls this
if (n < 256) {               // user gave n = -1
    char buf[256];
    memcpy(buf, src, n);     // n is passed to memcpy as size_t (unsigned)
                             // -1 becomes 0xFFFFFFFF = 4 billion bytes!
                             // Buffer overflow!
}
```

This class of bug (integer to size_t conversion) has caused countless real security vulnerabilities.

---

## Multiplication and Division

**Multiplying two n-bit numbers can produce a 2n-bit result.**

```
127 × 127 = 16,129  (fits in 15 bits, so fits in 16-bit int, but not 8-bit)

In 8-bit two's complement:
0111 1111 × 0111 1111 = ? (result requires 14 bits)
If stored in 8 bits: truncation occurs → wrong answer.
```

Hardware solutions:
- x86 `MUL`: multiplies two 32-bit registers, stores 64-bit result in two 32-bit registers.
- High-level languages use `BigInteger` / arbitrary precision for exact large multiplication.

**Integer division truncates toward zero:**
```java
7 / 2 = 3   (not 3.5, not 4)
-7 / 2 = -3  (not -4)  ← truncation toward zero, not toward -∞
```

This differs from mathematical floor division: `Math.floor(-7.0/2)` = -4. Language-specific — Python's `//` floors toward -∞; Java/C's `/` truncates toward 0.

---

## Shift Operations as Multiplication/Division

```
x << n  ≡  x × 2ⁿ   (for non-negative x with no overflow)
x >> n  ≡  x ÷ 2ⁿ   (arithmetic right shift for signed; logical for unsigned)
```

```java
int x = 12;
x << 2  = 48   (12 × 4)
x >> 1  = 6    (12 ÷ 2)

// Signed right shift preserves the sign bit (arithmetic shift):
int y = -8;     // 11111000
y >> 1 = -4     // 11111100  (MSB copied to vacated positions)

// Unsigned right shift fills with 0 (Java: >>>):
y >>> 1 = 2,147,483,644   // 01111100... (MSB becomes 0)
```

Compilers often replace `x / 4` with `x >> 2` automatically (faster). But they must be careful with negative values (truncation toward zero vs arithmetic shift).

---

## Section Challenge

> ### The Integer Overflow Vulnerability
>
> You're doing a security review of the following Java code that processes payment amounts:
>
> ```java
> public class PaymentProcessor {
>     public static int calculateTotal(int pricePerItem, int quantity) {
>         return pricePerItem * quantity;
>     }
>
>     public static boolean isAffordable(int total, int balance) {
>         if (total < 0) {
>             throw new IllegalArgumentException("Total cannot be negative");
>         }
>         return total <= balance;
>     }
> }
> ```
>
> **Q1:** `pricePerItem = 100,000` and `quantity = 30,000`. What does `calculateTotal` return? Show the arithmetic in 32-bit two's complement.
>
> **Q2:** Suppose `balance = 500,000`. The attacker passes `pricePerItem = 100,000` and `quantity = 30,000`. Does `isAffordable` return `true` or `false`? Why is this a bug?
>
> **Q3:** Fix `calculateTotal` to detect overflow BEFORE it occurs. (No BigInteger — just integer arithmetic.)
>
> **Q4:** The developer suggests changing both to `long`. What is the max safe value of `pricePerItem * quantity` in `long`? Is this actually a fix?

<details>
<summary>Full answers</summary>

```
Q1: calculateTotal overflow

pricePerItem × quantity = 100,000 × 30,000 = 3,000,000,000

Max int32 = 2,147,483,647.
3,000,000,000 > 2,147,483,647 → OVERFLOW.

3,000,000,000 in binary is 10110010110100000101111000000000₂ (33 bits needed)
In 32-bit signed: drop the MSB → 10110010110100000101111000000000 (32 bits)
                = -1,294,967,296  (the stored value)

calculateTotal(100_000, 30_000) returns -1,294,967,296.

── How the overflow happens internally ──
100,000 × 30,000 = 3,000,000,000
3,000,000,000 mod 2³² = 3,000,000,000 - 2³² = 3,000,000,000 - 4,294,967,296 = -1,294,967,296 ✓

──────────────────────────────────────────────────────

Q2: Security bug

total = -1,294,967,296

isAffordable checks: if (total < 0) → TRUE → throws IllegalArgumentException.
Wait — the negative check throws! So the exception is thrown, NOT a vulnerability yet.

BUT: what if the attacker uses pricePerItem = 71,583 and quantity = 30,000?
71,583 × 30,000 = 2,147,490,000
2,147,490,000 > 2,147,483,647 → overflow to -2,147,477,296 (negative)
→ exception thrown.

What about pricePerItem = 71,582 and quantity = 30,000?
71,582 × 30,000 = 2,147,460,000 < 2,147,483,647 → NO overflow, returns 2,147,460,000
isAffordable(2,147,460,000, 500,000) → 2,147,460,000 > 500,000 → FALSE. Not exploitable.

The real attack: exploit the TRANSITION ZONE near overflow more carefully.
With our exact example (100,000 × 30,000 = -1,294,967,296):
isAffordable THROWS (negative check catches it). Correct behavior by accident.

Better attack: overflow to a SMALL positive number.
pricePerItem = 150,000, quantity = 30,000:
150,000 × 30,000 = 4,500,000,000
4,500,000,000 mod 2³² = 4,500,000,000 - 4,294,967,296 = 205,032,704 (positive!)
isAffordable(205,032,704, 500,000) → 205,032,704 > 500,000 → FALSE.

Hmm, still not exploitable here. Let's try:
pricePerItem = 143,166, quantity = 30,000:
143,166 × 30,000 = 4,294,980,000
4,294,980,000 - 4,294,967,296 = 12,704 (small positive!)
isAffordable(12,704, 500,000) → 12,704 ≤ 500,000 → TRUE!!

ATTACK: attacker sets pricePerItem=143,166, quantity=30,000.
True cost = $4,294,980,000. System approves for a balance of $500,000!
This is an integer overflow vulnerability exploited by attackers.

──────────────────────────────────────────────────────

Q3: Fix — detect overflow before multiplying

Java 8+ provides Math.multiplyExact():

public static int calculateTotal(int pricePerItem, int quantity) {
    try {
        return Math.multiplyExact(pricePerItem, quantity);
    } catch (ArithmeticException e) {
        throw new IllegalArgumentException("Total overflow: values too large");
    }
}

Without library help (manual check):
public static int calculateTotal(int pricePerItem, int quantity) {
    if (pricePerItem > 0 && quantity > Integer.MAX_VALUE / pricePerItem) {
        throw new IllegalArgumentException("Overflow");
    }
    return pricePerItem * quantity;
}

Why this works:
  If a × b would overflow: b > MAX / a
  Check: MAX / pricePerItem first (integer division, safe), then compare quantity.
  Must also handle negative values (omitted here for simplicity).

──────────────────────────────────────────────────────

Q4: Switching to long

Max long = 9,223,372,036,854,775,807 ≈ 9.2 × 10¹⁸.

For prices and quantities: if both are <= 3,000,000,000 (3 billion),
their product can be up to 9 × 10¹⁸, which is near the long limit.

For REAL-WORLD prices (items rarely over $1,000,000 and quantities rarely
over 1,000,000): long is SAFE. pricePerItem=1,000,000 × quantity=1,000,000
= 10¹² << 9.2 × 10¹⁸.

Is it a complete fix?
YES for practical payment scenarios — prices in cents (max ~$21M per item)
and quantities in thousands are safe in long.

NO as a general principle:
- You still need to consider the semantic upper bounds.
- If using currency in smallest denomination (cents), $1M = 100,000,000 cents.
  100,000,000 × 100,000,000 = 10¹⁶ — still fits in long.
- But: if someone passes Long.MAX_VALUE as quantity: 9.2×10¹⁸ × anything overflows.

Best practice: use long for currency, validate inputs against business-rule
bounds BEFORE arithmetic, and document max safe values in the method contract.
```

</details>

---

## Common Mistakes

**Mistake 1: Forgetting that `int` is 32-bit in Java but implementation-defined in C**
- In Java: `int` is always 32-bit, `long` is always 64-bit. Guaranteed by spec.
- In C: `int` is "at least 16 bits," `long` is "at least 32 bits." Use `<stdint.h>` types (`int32_t`, `uint64_t`) for portability.

**Mistake 2: Using `%` on negative numbers and expecting a non-negative result**
- In Java/C: `-7 % 3 = -1` (same sign as dividend). In Python: `-7 % 3 = 2` (non-negative always).
- For "true modulo": `((x % m) + m) % m` in Java/C.

**Mistake 3: Assuming `Integer.MIN_VALUE` negation is safe**
- `-Integer.MIN_VALUE` overflows back to `Integer.MIN_VALUE` in Java! `-(-2,147,483,648) = -2,147,483,648` (stays negative). The absolute value of `MIN_VALUE` cannot be represented as `int`. Use `Math.abs(x) == Integer.MIN_VALUE` to detect this edge case.

**Mistake 4: Right-shifting negative numbers (signed vs unsigned)**
- In Java: `x >> 1` is arithmetic (sign-extends); `x >>> 1` is logical (zero-fills).
- In C: behavior of right-shift on negative signed integers is implementation-defined. Use `(unsigned int)x >> 1` to guarantee logical shift.

---

## Connections

- **Chapter 01 — Bits:** Two's complement is a bit-level encoding. Overflow is a bit-level phenomenon (carry in/out of MSB mismatch).
- **Chapter 03 — Floating Point:** Integers handle exact arithmetic; floats introduce approximation. The choice between the two is a fundamental design decision.
- **Chapter 05 — Processor:** The ALU (Arithmetic Logic Unit) implements two's complement addition. Status flags (CF, OF, ZF, SF) are set by the ALU after every operation.
- **Chapter 08 — Processes:** System calls like `malloc(size)` and `read(fd, buf, n)` take `size_t` (unsigned) arguments. Passing a negative `int` converts to a huge unsigned value — a classic vulnerability class.

---

> [← 01 Bits, Bytes & Data Representation](01_Bits_Bytes_Data_Representation.md) | [Course Index](README.md) | [Next → 03 Floating-Point Numbers](03_Floating_Point_IEEE754.md)
