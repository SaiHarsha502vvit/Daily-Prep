> **Navigation**: [← Advanced Algorithm Patterns &…](06d_String_Algorithms.md) | [Chapter index](00_INDEX.md) | [NumberTheory Advanced →](08b_NumberTheory_Advanced.md)

---

# 🔢 GCD, Number Theory & Pattern Programs - Complete Guide

## From Euclid to Production Systems

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Bit Manipulation](10_Bit_Manipulation_Complete.md), [Recursion](03b_Recursion_Fundamentals.md) |
| **You will learn** | GCD/LCM (Euclid, Stein), primes (trial division, sieve, factorisation), modular arithmetic |
| **Leads to** | [Essential patterns](08b_NumberTheory_Advanced.md), [Matrix exponentiation](23_Matrix_Exponentiation_And_Linear_Recurrences.md) |
| **Abstraction level** | L5: arithmetic as an algorithmic tool |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Number Theory Core

### 1. The bottom line

Number theory gives you fast tools for divisibility, primes and working with huge numbers using remainders.

### 2. The textbook core

- Euclid: `gcd(a, b) = gcd(b, a mod b)` in O(log min(a, b)).
- Sieve of Eratosthenes: all primes ≤ n in O(n log log n).
- Modular arithmetic: `(a + b) mod m`, `(a · b) mod m`; inverse via Fermat for prime `m`.
- Always reduce modulo after each multiplication to avoid overflow.

### 3. The real-world analogy

A **clock**: after 12 comes 1 again; modular arithmetic is arithmetic on a clock of size m.

### 4. Walkthrough

1. gcd(48, 18).
2. 48 mod 18 = 12 → gcd(18, 12).
3. 18 mod 12 = 6 → gcd(12, 6).
4. 12 mod 6 = 0 → gcd = 6.

> [!NOTE]
> **Quick check:** What is lcm(4, 6)? *4·6 / gcd = 24 / 2 = 12.*

---

> WHY THIS FILE EXISTS
>
> GCD, LCM, Primes, Modular Arithmetic → appear in:
>
> - 40% of coding interviews (number theory questions)
> - Encryption systems (RSA uses GCD, primes, modular exponentiation)
> - Database sharding (hash % shard_count needs coprime understanding)
> - Load balancing algorithms
> - Game development (timing, frequencies)
> - Pattern programs → builds loop thinking essential for ALL DSA
>
> START DATE: February 10, 2026

---

### Historical Evolution

Number theory algorithms trace back to the ancient world, with **Euclid's algorithm for GCD (circa 300 BC)** appearing in Euclid's Elements (Book VII, Proposition 2) — remarkably, the Euclidean algorithm for finding the greatest common divisor using repeated division remains essentially unchanged and is still the most efficient practical method for computing GCD, over 2,300 years later. The **Sieve of Eratosthenes** (circa 240 BC) was the first systematic method for finding all prime numbers up to a given limit — Eratosthenes, the chief librarian of Alexandria, is credited with the method of crossing out the multiples of each prime (the name "sieve" refers to filtering out composites). **Fermat's Little Theorem (1640)** established that $a^p \equiv a \pmod{p}$ for prime $p$, foundational to modern primality testing and the entire field of cryptography. **Euler (1760s)** generalized this to $\phi(n)$ (Euler's totient function), proving that the number of integers less than $n$ that are coprime to $n$ follows $n \prod(1 - 1/p)$. **Miller (1976)** and **Rabin (1976/1980)** transformed Euler's and Fermat's theoretical work into a practical randomized primality test that runs in $O(k \log^3 n)$ time. Modern practice (post-2010): RSA encryption, Bitcoin address generation, and hash-based commitments all rely on the intractability of integer factorization — the same mathematical foundation Euclid discovered.

### 5. Check yourself

**Q1.** `gcd(48, 18)`?

<details><summary>Answer</summary>

**6** (Euclid: 48 mod 18 = 12; 18 mod 12 = 6; 12 mod 6 = 0).

</details>

**Q2.** Running time of the Sieve of Eratosthenes up to `n`?

<details><summary>Answer</summary>

`O(n log log n)`.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Part 1 — GCD (Greatest Common Divisor)](08a_NumberTheory_Core/01_section.md) | WHY GCD Matters · Algorithm 1: Brute Force GCD · Algorithm 2: Euclid's Algorithm (Subtraction) | 474 |
| 2 | [Part 2 — Prime Numbers](08a_NumberTheory_Core/02_section.md) | Why Primes Matter · Algorithm P1: Check if Prime · Algorithm P2: Sieve of Eratosthenes | 280 |
| 3 | [Part 3 — Modular Arithmetic and Proofs](08a_NumberTheory_Core/03_section.md) | Why Fermat's Little Theorem Works — and Why a^(p-2) Is the Modular Inverse · Euler's Theorem — Generalizing Fermat to Composite Moduli · Proof Corner -- Sieve of Eratosthenes O(n log log n) | 399 |

## 🏢 Enterprise Lens — Number Theory Core

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Cryptography, hashing, scheduling periodic jobs, random number generation, checksums |
| **Failure modes** | Integer overflow in `a * b`; negative remainders; non-prime modulus when using Fermat inverses |
| **Testing and verification** | Test against `BigInteger` and brute force for small ranges |

---

## Reality Check

**"Primality testing requires checking all divisors"** → You only need to check divisors up to sqrt(n), reducing O(n) to O(sqrt(n)). For cryptographic-size numbers (hundreds of digits), even O(sqrt(n)) is infeasible. The Miller-Rabin probabilistic primality test runs in O(k log^2 n) for k rounds and is used in practice. The deterministic AKS primality test proves primality in polynomial time but is slower in practice than probabilistic methods.

**"Sieve of Eratosthenes is memory-intensive"** → The basic sieve stores a boolean array of size n, using n bytes. A bitwise sieve reduces this to n/8 bytes. A segmented sieve processes the range in sqrt(n)-sized blocks, using only O(sqrt(n)) memory while still achieving O(n log log n) time. For sieving primes up to 10^9, the segmented approach uses megabytes instead of gigabytes.

**"Modular arithmetic is only for competitive programming"** → Modular arithmetic is fundamental to: cryptography (RSA, Diffie-Hellman), hash functions (polynomial rolling hash), error-correcting codes (CRC), random number generation (linear congruential generators), and database sharding (hash partitioning). Understanding modular inverse, Fermat little theorem, and Chinese Remainder Theorem has direct practical applications.

**"Large number multiplication is just the schoolbook method"** → Schoolbook multiplication is O(n squared) for n-digit numbers. Karatsuba algorithm reduces this to O(n^1.585) by splitting each number into halves and using 3 multiplications instead of 4. For even larger numbers, Toom-Cook and FFT-based multiplication achieve near-linear time. Java BigInteger switches algorithms based on operand size: schoolbook for small, Toom-Cook for medium, and Schonhage-Strassen (FFT-based) for large.

**"GCD extended form (Bezout coefficients) is theoretical"** → The Extended Euclidean Algorithm finds x and y such that ax + by = gcd(a,b). This directly computes modular inverse: if gcd(a,m) = 1, then ax + my = 1, so x is the modular inverse of a mod m. Modular inverse is required for: modular division, RSA key generation, solving linear congruences, and Chinese Remainder Theorem reconstruction.
