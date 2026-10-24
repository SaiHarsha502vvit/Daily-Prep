# Part 3 — Modular Arithmetic and Proofs

> **Navigation**: [← Part 2 — Prime Numbers](02_section.md) | [Chapter overview](../08a_NumberTheory_Core.md)
> Page 3 of 3 in **GCD, Number Theory & Pattern Programs - Complete Guide**


```
WHY MODULAR ARITHMETIC?
───────────────────────
1. Avoid integer overflow in competitive programming
2. Cryptography (RSA, Diffie-Hellman)
3. Hash functions (hashCode % tableSize)
4. Circular data structures (circular queue: index % capacity)
5. Clock arithmetic (14:00 → 2:00 PM = 14 % 12)
```

```java
/**
 * MODULAR ARITHMETIC RULES:
 *
 * (a + b) % m = ((a % m) + (b % m)) % m
 * (a - b) % m = ((a % m) - (b % m) + m) % m  ← Note the +m!
 * (a * b) % m = ((a % m) * (b % m)) % m
 * (a / b) % m ≠ ((a % m) / (b % m)) % m      ← Division is special!
 *
 * For division: (a / b) % m = (a * modInverse(b, m)) % m
 */

public class ModularArithmetic {

    static final int MOD = 1_000_000_007; // 10^9 + 7 (common in contests)

    // Modular addition (safe from overflow)
    public static long modAdd(long a, long b) {
        return ((a % MOD) + (b % MOD)) % MOD;
    }

    // Modular multiplication
    public static long modMul(long a, long b) {
        return ((a % MOD) * (b % MOD)) % MOD;
    }

    // Modular exponentiation: (base^exp) % mod
    // FAST: O(log exp) using binary exponentiation
    public static long modPow(long base, long exp, long mod) {
        long result = 1;
        base %= mod;

        while (exp > 0) {
            if ((exp & 1) == 1) { // exp is odd
                result = (result * base) % mod;
            }
            exp >>= 1;        // exp /= 2
            base = (base * base) % mod;
        }

        return result;
    }

    // Modular inverse using Fermat's little theorem
    // Only works when mod is prime!
    // a^(-1) ≡ a^(mod-2) (mod p)
    public static long modInverse(long a, long mod) {
        return modPow(a, mod - 2, mod);
    }

    // Modular division: (a / b) % mod
    public static long modDiv(long a, long b, long mod) {
        return modMul(a, modInverse(b, mod));
    }

    // REAL PRODUCTION USE: Count large combinations
    // nCr % MOD (needed because nCr can be astronomically large)
    public static long nCrMod(int n, int r) {
        if (r > n) return 0;
        if (r == 0 || r == n) return 1;

        // Precompute factorials
        long[] fact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) {
            fact[i] = modMul(fact[i - 1], i);
        }

        // nCr = n! / (r! * (n-r)!)
        long numerator = fact[n];
        long denominator = modMul(fact[r], fact[n - r]);

        return modDiv(numerator, denominator, MOD);
    }

    // TEST
    public static void main(String[] args) {
        System.out.println("2^10 mod 1000 = " + modPow(2, 10, 1000));     // 24
        System.out.println("2^100 mod 10^9+7 = " + modPow(2, 100, MOD));  // Huge number mod
        System.out.println("C(100, 50) mod 10^9+7 = " + nCrMod(100, 50));
    }
}
```

---

## Why Fermat's Little Theorem Works — and Why a^(p-2) Is the Modular Inverse

The code above uses `modPow(a, mod - 2, mod)` to compute modular inverse, citing
"Fermat's little theorem." But *why* does raising `a` to the power `p − 2` give
you `a`'s multiplicative inverse mod `p`? The answer is a counting argument that
takes five minutes and unlocks most of modular arithmetic.

### The problem that forces the idea

Division doesn't exist in modular arithmetic. You can't compute `(a / b) % p`
the way you compute `(a * b) % p` — try it: `(7 / 3) % 5 = 2.33... % 5`, which
is meaningless in integers. What you *can* do is find a number `b⁻¹` such that
`b × b⁻¹ ≡ 1 (mod p)`, and then "dividing by b" becomes "multiplying by b⁻¹."

The question is: does such a `b⁻¹` always exist, and how do you find it?

### Step 1: Multiplication by a nonzero element permutes residues

Fix a prime `p` and pick any `a` with `1 ≤ a ≤ p − 1` (i.e., `a` is not divisible
by `p`). Now multiply every nonzero residue by `a`:

```
S = {1, 2, 3, ..., p−1}          (the p−1 nonzero residues mod p)
aS = {a·1 mod p, a·2 mod p, ..., a·(p−1) mod p}
```

**Claim:** `aS` is a *permutation* of `S` — the same set of numbers, just reordered.

**Proof:** Two things to check:
1. *No element of `aS` is zero.* If `a·k ≡ 0 (mod p)`, then `p | a·k`. Since `p`
   is prime and `p ∤ a`, we'd need `p | k`. But `1 ≤ k ≤ p−1`, so `p ∤ k`.
   Contradiction — no product is zero.
2. *No two elements collide.* If `a·i ≡ a·j (mod p)` with `i ≠ j`, then
   `a·(i − j) ≡ 0 (mod p)`, which we just ruled out.

So `aS` has `p−1` distinct nonzero residues, and `S` also has `p−1` distinct
nonzero residues. They must be the same set.

### Step 2: Multiply all elements together

Since `aS` is a permutation of `S`, their products mod `p` are equal:

```
(a·1)(a·2)(a·3)···(a·(p−1)) ≡ 1·2·3···(p−1)   (mod p)
```

Factor out the `a`'s on the left side — there are `p−1` of them:

```
a^(p−1) · (1·2·3···(p−1)) ≡ (1·2·3···(p−1))   (mod p)
```

Let `W = (p−1)!`. Since every factor of `W` is between `1` and `p−1`, none is
divisible by `p`, so `W ≢ 0 (mod p)`. We can cancel `W` from both sides
(this cancellation is valid because `gcd(W, p) = 1`):

```
a^(p−1) ≡ 1   (mod p)
```

**That's Fermat's Little Theorem.** For any prime `p` and any `a` not divisible
by `p`: `a^(p−1) ≡ 1 (mod p)`.

### Step 3: Why a^(p−2) is the inverse

Divide both sides of `a^(p−1) ≡ 1` by `a`:

```
a^(p−2) · a ≡ 1   (mod p)
```

By definition, the number you multiply `a` by to get `1` is `a`'s multiplicative
inverse. So `a⁻¹ ≡ a^(p−2) (mod p)`.

That's why `modPow(a, mod - 2, mod)` works — it computes `a^(p−2) mod p`, which
is exactly `a⁻¹ mod p`. And it only works when `mod` is prime, because the
permutation argument in Step 1 requires primality (otherwise `a·k` can be zero
without `k` being zero).

### The edge that catches people

Fermat's Little Theorem requires `gcd(a, p) = 1`. If `a` is a multiple of `p`,
then `a ≡ 0 (mod p)` and no inverse exists — you can't divide by zero even in
modular arithmetic. In contest code, this means you must check `a % mod != 0`
before calling `modInverse(a, mod)`, or handle the zero case separately.

### When the modulus isn't prime: Extended Euclidean Algorithm

Fermat's theorem only works for prime moduli. For composite `m`, use the extended
GCD: find `x, y` such that `a·x + m·y = gcd(a, m)`. If `gcd(a, m) = 1`, then
`x mod m` is the inverse. The extended Euclidean algorithm runs in `O(log m)` —
same asymptotic cost as `modPow` but works for any coprime pair:

```java
// Returns {gcd, x, y} such that a*x + b*y = gcd(a, b)
public static long[] extGcd(long a, long b) {
    if (b == 0) return new long[]{a, 1, 0};
    long[] r = extGcd(b, a % b);
    return new long[]{r[0], r[2], r[1] - (a / b) * r[2]};
}

// Modular inverse for any modulus (a and mod must be coprime)
public static long modInverseGeneral(long a, long mod) {
    long[] r = extGcd(a % mod, mod);
    if (r[0] != 1) throw new ArithmeticException("Inverse doesn't exist");
    return (r[1] % mod + mod) % mod;
}
```

### Decision: Fermat vs Extended GCD

| | Fermat (`a^(p−2)`) | Extended GCD |
|---|---|---|
| **Requires** | `mod` is prime | `gcd(a, mod) = 1` |
| **Time** | O(log p) | O(log mod) |
| **When to use** | Contest problems with `mod = 10⁹+7` | Composite moduli, CRT |
| **Gotcha** | Silent wrong answer if `mod` isn't prime | Returns error if not coprime |

In competitive programming, `mod = 10⁹ + 7` is prime by design, so Fermat's
approach is the standard idiom. In production code dealing with arbitrary moduli,
prefer the extended GCD — it's equally fast and doesn't silently fail.

---

## Euler's Theorem — Generalizing Fermat to Composite Moduli

Fermat's Little Theorem says `a^(p−1) ≡ 1 (mod p)` for prime `p`. But what if
the modulus isn't prime? You can't use Fermat — but Euler's theorem fills the gap.

### The totient function: counting what's coprime

**Definition.** `φ(n)` (Euler's totient) = how many integers in `{1, 2, ..., n−1}`
are coprime to `n` (i.e., share no common factor with `n` other than 1).

Examples by hand:
- `φ(7) = 6` — all of `{1,2,3,4,5,6}` are coprime to 7 (it's prime)
- `φ(12) = 4` — only `{1, 5, 7, 11}` are coprime to 12
- `φ(p) = p − 1` for any prime `p` (every non-zero residue is coprime)

### Deriving the formula for φ(n)

**For a prime power `p^k`:** Which numbers in `{1, ..., p^k}` are NOT coprime to
`p^k`? Exactly those divisible by `p`: that's `{p, 2p, 3p, ..., p^(k-1)·p}`,
which is `p^(k-1)` numbers. So:

```
φ(p^k) = p^k − p^(k−1) = p^(k−1)(p − 1)
```

Check: `φ(8) = φ(2³) = 2²(2−1) = 4`. The coprimes are `{1,3,5,7}` — correct.

**For general `n = p₁^a₁ · p₂^a₂ · ... · pₖ^aₖ`:** The Chinese Remainder
Theorem tells us that `ℤ/nℤ ≅ ℤ/p₁^a₁ℤ × ... × ℤ/pₖ^aₖℤ`, so:

```
φ(n) = n · ∏(1 − 1/pᵢ)  for each prime factor pᵢ of n
```

Example: `φ(12) = 12 · (1 − 1/2) · (1 − 1/3) = 12 · 1/2 · 2/3 = 4`. Correct.

### Euler's theorem: the same permutation trick, on a smaller set

Recall Fermat's proof: we multiplied `a` by every nonzero residue mod `p`, got a
permutation, and concluded `a^(p−1) ≡ 1`. The same argument works if we restrict
to the **coprime residues** mod `n`:

Let `G = {r₁, r₂, ..., r_{φ(n)}}` be the integers in `{1, ..., n−1}` coprime
to `n`. Multiplying every element by `a` (where `gcd(a, n) = 1`) gives a
permutation of `G`:
- Products stay coprime: if `gcd(a, n) = 1` and `gcd(rᵢ, n) = 1`, then
  `gcd(a·rᵢ, n) = 1`.
- Products are distinct: same cancellation argument as in the Fermat proof.

So `aG` is a permutation of `G`. Multiply all elements:

```
a^φ(n) · (r₁·r₂·...·r_{φ(n)}) ≡ (r₁·r₂·...·r_{φ(n)})  (mod n)
```

Cancel the product (it's coprime to `n`):

```
a^φ(n) ≡ 1  (mod n)    whenever gcd(a, n) = 1
```

**That's Euler's theorem.** Fermat's is the special case where `n = p` and
`φ(p) = p − 1`.

### Why this matters: modular inverse for composite moduli

From `a^φ(n) ≡ 1 (mod n)`, divide by `a`:

```
a^(φ(n)−1) ≡ a⁻¹  (mod n)    whenever gcd(a, n) = 1
```

So to compute modular inverse mod a composite `n`, compute `φ(n)` then use
`modPow(a, φ(n) − 1, n)`. The catch: computing `φ(n)` requires `n`'s prime
factorization, which is expensive for large `n`. That's why the extended GCD
is preferred in practice — it gives the inverse in `O(log n)` without needing
the factorization.

```java
// Euler's totient function
public static long eulerTotient(long n) {
    long result = n;
    for (long p = 2; p * p <= n; p++) {
        if (n % p == 0) {
            while (n % p == 0) n /= p;
            result -= result / p;  // result *= (1 - 1/p)
        }
    }
    if (n > 1) result -= result / n;  // remaining prime factor
    return result;
}
```

### The edge everyone hits: φ(p^k) ≠ p − 1

A common mistake: treating `φ(p^k)` as `p − 1`. That formula only works for
`φ(p)`. For prime powers: `φ(p^k) = p^(k−1)(p − 1)`. This matters in RSA
key generation, where `φ(p·q) = (p−1)(q−1)` but `φ(p²·q)` is NOT `(p−1)(q−1)`.

### Decision: which inverse method when?

| Modulus type | Best method | Why |
|---|---|---|
| Prime `p` | Fermat: `a^(p-2)` | Simple, O(log p) |
| Composite, factorization known | Euler: `a^(φ(n)-1)` | Need φ(n), then O(log n) |
| Composite, factorization unknown | Extended GCD | O(log n), no factorization |
| Any coprime pair (general) | Extended GCD | Always works, always fast |

---

> **Pattern programs** (star triangles, pyramids, diamonds, zigzag) were
> previously in this file but have been moved to their dedicated chapter:
> **[09_Pattern_Programs_Complete.md](../09_Pattern_Programs_Complete.md)** (2000+ lines, 30+ patterns).
> That chapter covers nested loop mastery in depth.

---

## Proof Corner -- Sieve of Eratosthenes O(n log log n)

**Claim**: The Sieve of Eratosthenes marks all composite numbers up to n in O(n log log n) time.

**Proof**: For each prime p, we mark p^2, p^2+p, p^2+2p, ... up to n. The number of markings for prime p is (n - p^2)/p + 1 <= n/p.

**Total markings** = sum over all primes p <= n of n/p = n * sum_{p prime, p<=n} 1/p.

By the prime harmonic series (Mertens second theorem): sum_{p prime, p<=n} 1/p ~ ln ln n.

Therefore total markings = O(n log log n). QED.

**Why start at p^2**: All composites p*k with k < p have already been marked by the prime factors of k (which are less than p). Starting at p^2 avoids redundant work and is the key optimisation.

**GCD correctness (Euclidean algorithm)**: gcd(a, b) = gcd(b, a mod b) because any common divisor of a and b also divides a mod b = a - floor(a/b)*b, and conversely any common divisor of b and a mod b divides a.

---

## When It Breaks -- Number Theory

**1. int overflow in modular arithmetic** -- `(a * b) % MOD` where a, b are close to Integer.MAX_VALUE (10^9) and MOD = 10^9+7. a*b can reach ~10^18, which overflows int (max ~2*10^9). Always use `long` for intermediate products: `(long) a * b % MOD`.

**2. Euler totient for prime powers** -- phi(p^k) = p^k - p^{k-1} (not p-1). A common mistake: phi(8) = phi(2^3) should be 4, not 1 (phi for prime p). Using phi(p) = p-1 for prime powers gives wrong answers in modular inverse calculations.

**3. Modular inverse assumptions** -- `modPow(a, MOD-2, MOD)` (Fermat little theorem) gives the inverse of a only when MOD is prime AND gcd(a, MOD) = 1. If a is divisible by MOD, the inverse does not exist. Always check a % MOD != 0 before computing modular inverse.

**4. GCD of negative numbers** -- in Java, `%` operator returns negative values for negative dividends: `-7 % 3 = -1` in Java, but mathematically `(-7) mod 3 = 2`. Euclidean algorithm breaks if a or b can be negative. Always pass `Math.abs(a)` to GCD functions.

---

## Reference Anchor

**java.math.BigInteger -- production number theory**:
```java
// Primality test (Miller-Rabin probabilistic):
BigInteger n = BigInteger.valueOf(997);
boolean isPrime = n.isProbablePrime(50); // 50 rounds, error prob < 4^{-50}
// Certainty 50 means error prob < (1/4)^50 -- effectively zero for practical purposes

// Modular arithmetic with BigInteger:
BigInteger mod = BigInteger.valueOf(1_000_000_007L);
BigInteger result = a.multiply(b).mod(mod); // (a*b) % MOD -- handles arbitrary precision

// GCD:
BigInteger g = a.gcd(b); // Euclidean algorithm, always non-negative

// For int/long -- Apache Commons Math:
// org.apache.commons.math3.util.ArithmeticUtils.gcd(int a, int b)
// Handles negative inputs correctly (returns non-negative GCD)
import org.apache.commons.math3.util.ArithmeticUtils;
long g2 = ArithmeticUtils.gcd(48L, -18L); // returns 6
```

---


---

[← Part 2 — Prime Numbers](02_section.md) | [Chapter overview](../08a_NumberTheory_Core.md)
