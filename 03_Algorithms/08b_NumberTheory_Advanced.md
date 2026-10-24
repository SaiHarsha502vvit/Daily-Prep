# 🧰 Essential Algorithms, Data-Structure Problems and a Study Plan

> **Navigation**: [← GCD, Number Theory & Pattern…](08a_NumberTheory_Core.md) | [Chapter index](00_INDEX.md) | [Matrix Exponentiation & Linear… →](23_Matrix_Exponentiation_And_Linear_Recurrences.md)

## Historical Evolution

Four ideas in this chapter have well-documented origins. **Maximum subarray (Kadane)**: Ulf Grenander posed the problem in 1977 for pattern analysis in images; Michael Shamos found an O(n log n) divide-and-conquer solution, and Jay Kadane then gave the linear-time scan, recounted in Jon Bentley's *Programming Pearls* column (1984). **Dutch national flag**: Edsger Dijkstra's three-way partition problem, in *A Discipline of Programming* (1976). **Boyer–Moore majority vote**: Robert Boyer and J Strother Moore developed it in 1981 and published it in 1991. **Floyd cycle detection** (tortoise and hare) is attributed to Robert Floyd and appears in Knuth's *The Art of Computer Programming*, volume 2 (1969). All four replace a nested loop or an extra table with one pass and a small amount of state, which is why they recur in interviews.

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Number Theory Core](08a_NumberTheory_Core.md), [Arrays (DS)](../02_Data_Structures/01b_Arrays.md) |
| **You will learn** | Kadane, Dutch national flag, Boyer–Moore voting, Floyd cycle detection, monotonic stack, prefix/difference arrays, incident-to-DSA mapping, study plan |
| **Leads to** | [Matrix exponentiation](23_Matrix_Exponentiation_And_Linear_Recurrences.md), [Practice sets](03_PROBLEM_SETS.md) |
| **Abstraction level** | L3–L5: single-pass patterns that replace nested loops |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Essential Array Patterns & Practice

### 1. The bottom line

A small set of one-pass patterns solves a large share of array problems in O(n) time and O(1) extra space.

### 2. The textbook core

- **Kadane:** maximum subarray sum with `cur = max(x, cur + x)`.
- **Dutch flag:** 3-way partition in one pass.
- **Boyer–Moore:** majority element in O(1) space.
- **Prefix/difference arrays:** O(1) range sums / O(1) range updates.

### 3. The real-world analogy

A **running tally**: instead of re-adding every number, keep a total and adjust it as you move.

### 4. Walkthrough

1. Boyer–Moore on `[2, 2, 1, 2, 3]`.
2. Candidate 2, count 1 → count 2 → 1 (sees 1) → 2 → 1 (sees 3).
3. Candidate remains 2 (count positive).
4. Verify by counting: 2 appears 3 of 5 times → majority.

> [!NOTE]
> **Quick check:** Why verify the Boyer–Moore candidate? *If no majority exists, the candidate is arbitrary.*

### 5. Check yourself

**Q1.** Inverse of 3 modulo 7?

<details><summary>Answer</summary>

**5**, because `3 · 5 = 15 ≡ 1 (mod 7)`.

</details>

**Q2.** State Fermat's little theorem.

<details><summary>Answer</summary>

If `p` is prime and `p ∤ a`, then `a^(p−1) ≡ 1 (mod p)`; hence `a^(p−2)` is the modular inverse of `a`.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Part 5 — More Essential Algorithms](08b_NumberTheory_Advanced/01_section.md) | Algorithm: Kadane's Algorithm (Maximum Subarray Sum) · Algorithm: Dutch National Flag (3-Way Partition) · Algorithm: Boyer-Moore Voting (Majority Element) | 444 |
| 2 | [Part 6 — Data Structure Problems: Why and How](08b_NumberTheory_Advanced/02_section.md) | Stack Problems · Queue & Deque Problems · HashMap Problems | 294 |
| 3 | [Part 7 — Real-Life Incident → DSA Mapping](08b_NumberTheory_Advanced/03_section.md) | Part 7 — Real-Life Incident → DSA Mapping | 45 |
| 4 | [Part 8 — Four-Week Study Plan](08b_NumberTheory_Advanced/04_section.md) | Part 8 — Four-Week Study Plan | 127 |

## 💪 Curated Practice Problems — Number Theory & Math

**HOW TO USE**: These problems apply GCD, primes, modular arithmetic, and combinatorics.
Section 1 = fundamentals. Section 2 = medium applications. Section 3 = advanced/competitive.

---

### Section 1: GCD, LCM & Basic Math

| #   | Problem                                      | Platform | Difficulty | Key Technique                     |
| --- | -------------------------------------------- | -------- | ---------- | --------------------------------- |
| 1   | Greatest Common Divisor of Strings (LC 1071) | LeetCode | Easy       | GCD on string lengths             |
| 2   | Count Primes (LC 204)                        | LeetCode | Medium     | Sieve of Eratosthenes             |
| 3   | Power of Three (LC 326)                      | LeetCode | Easy       | Modular arithmetic or log         |
| 4   | Happy Number (LC 202)                        | LeetCode | Easy       | Cycle detection (Floyd's)         |
| 5   | Ugly Number II (LC 264)                      | LeetCode | Medium     | 3-pointer merge (2,3,5 multiples) |
| 6   | Nth Digit (LC 400)                           | LeetCode | Medium     | Digit counting pattern            |
| 7   | Excel Sheet Column Number (LC 171)           | LeetCode | Easy       | Base-26 conversion                |
| 8   | Factorial Trailing Zeroes (LC 172)           | LeetCode | Medium     | Count factors of 5                |

---

### Section 2: Modular Arithmetic & Combinatorics

| #   | Problem                        | Platform | Difficulty | Key Technique                       |
| --- | ------------------------------ | -------- | ---------- | ----------------------------------- |
| 1   | Pow(x, n) (LC 50)              | LeetCode | Medium     | Fast exponentiation (binary)        |
| 2   | Super Pow (LC 372)             | LeetCode | Medium     | Modular exponentiation              |
| 3   | Unique Paths (LC 62)           | LeetCode | Medium     | C(m+n-2, m-1) or DP                 |
| 4   | Integer Break (LC 343)         | LeetCode | Medium     | Math: maximize product with 3s      |
| 5   | Perfect Squares (LC 279)       | LeetCode | Medium     | Lagrange's 4-square theorem or BFS  |
| 6   | Water and Jug Problem (LC 365) | LeetCode | Medium     | GCD: solvable iff z % gcd(x,y) == 0 |
| 7   | Smallest Good Base (LC 483)    | LeetCode | Hard       | Math + binary search                |

---

### Section 3: Advanced Math / Competitive

| #   | Problem                                          | Platform   | Difficulty | Key Technique                   |
| --- | ------------------------------------------------ | ---------- | ---------- | ------------------------------- |
| 1   | Fraction to Recurring Decimal (LC 166)           | LeetCode   | Medium     | Long division + cycle detection |
| 2   | Largest Component Size by Common Factor (LC 952) | LeetCode   | Hard       | Union-Find by prime factors     |
| 3   | Count Primes (Sieve variants)                    | Codeforces | Medium     | Segmented sieve, linear sieve   |
| 4   | Mirror Reflection (LC 858)                       | LeetCode   | Medium     | LCM to find which corner        |
| 5   | Broken Calculator (LC 991)                       | LeetCode   | Medium     | Work backwards (greedy + math)  |
| 6   | Reaching Points (LC 780)                         | LeetCode   | Hard       | Work backwards with modulo      |

---

### HIDDEN GEMS — Number Theory

| #   | Problem                                        | Platform | Why It's Valuable                   |
| --- | ---------------------------------------------- | -------- | ----------------------------------- |
| 1   | X of a Kind in a Deck of Cards (LC 914)        | LeetCode | GCD of all frequencies              |
| 2   | Bulb Switcher (LC 319)                         | LeetCode | Perfect squares insight — pure math |
| 3   | Minimum Moves to Equal Array Elements (LC 453) | LeetCode | sum - n\*min (math reduction)       |
| 4   | Valid Perfect Square (LC 367)                  | LeetCode | Binary search or 1+3+5+... series   |
| 5   | Distribute Candies to People (LC 1103)         | LeetCode | Simulation with modular index       |

---

---

### Proof Corner -- Fermat's Little Theorem and Modular Inverse

**Fermat's Little Theorem**: For prime p and integer a not divisible by p:
a^(p-1) ≡ 1 (mod p).

**Proof sketch**: Consider the set {a, 2a, 3a, ..., (p-1)a} modulo p. All elements are distinct (if ia ≡ ja mod p then i ≡ j mod p since gcd(a,p)=1). All are non-zero. So the set is a permutation of {1, 2, ..., p-1}.

Product of all elements: a * 2a * ... * (p-1)a = a^(p-1) * (p-1)! ≡ (p-1)! (mod p).

Cancel (p-1)! (non-zero mod p): a^(p-1) ≡ 1 (mod p). QED.

**Modular inverse**: Since a^(p-1) ≡ 1 (mod p), we have a^(-1) ≡ a^(p-2) (mod p). This is computed in O(log p) using fast modular exponentiation.

**When Fermat fails**: p must be prime. For composite m, use the extended Euclidean algorithm to find a^(-1) mod m (when gcd(a,m) = 1). Fermat does NOT work for composite moduli.

---

### When It Breaks -- Advanced Number Theory

**1. Applying Fermat's Little Theorem with composite modulus** -- modPow(a, MOD-2, MOD) gives the modular inverse only when MOD is prime. With composite MOD, a^(phi(MOD)-1) is the inverse if gcd(a,MOD)=1, but phi(MOD) is expensive to compute. Fix: always verify MOD is prime before using Fermat.

**2. Integer overflow in factorisation** -- trial division for n up to 10^18 needs to check primes up to sqrt(n) ~ 10^9. A naive loop overflows int; even long arithmetic can overflow when computing trial divisions. Use BigInteger.isProbablePrime() for large n.

**3. CRT (Chinese Remainder Theorem) with non-coprime moduli** -- CRT requires moduli to be pairwise coprime. If gcd(m1, m2) != 1, the system x ≡ a1 mod m1, x ≡ a2 mod m2 may have no solution. Always verify coprimality before applying CRT.

**4. Euler's totient wrong for p^k** -- phi(p^k) = p^(k-1) * (p-1), NOT p-1. A common error: phi(8) = phi(2^3) should be 4, not 1. This matters for RSA key generation and period calculations.

---

### Reference Anchor

**java.math.BigInteger -- number theory operations**:
```java
// Primality (probabilistic Miller-Rabin):
BigInteger n = BigInteger.valueOf(104729);
boolean prime = n.isProbablePrime(50); // error < 4^{-50} ≈ 10^{-30}

// Modular inverse (Euclidean -- works for any modulus, not just prime):
BigInteger a = BigInteger.valueOf(7);
BigInteger mod = BigInteger.valueOf(11);
BigInteger inv = a.modInverse(mod); // 7^{-1} mod 11 = 8
// Verify: 7 * 8 mod 11 = 56 mod 11 = 1. Correct.

// Fast exponentiation:
BigInteger result = BigInteger.valueOf(2).modPow(BigInteger.valueOf(100),
    BigInteger.valueOf(1_000_000_007L)); // 2^100 mod 10^9+7

// For long arithmetic -- manual modPow:
static long modPow(long base, long exp, long mod) {
    long result = 1; base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;
        base = base * base % mod; exp >>= 1;
    }
    return result;
}
// Caution: base * base can overflow long for base ~ 10^9. Use (long)(...)*(long)(...) carefully.
```

---

### Brute Force to Optimal -- Number Theory

| Problem | Brute Force | Time | Optimal | Time |
|---------|-------------|------|---------|------|
| Primality test | Trial division to sqrt(n) | O(sqrt(n)) | Miller-Rabin | O(k log^2 n) |
| All primes up to n | Trial division each | O(n sqrt(n)) | Sieve of Eratosthenes | O(n log log n) |
| GCD(a, b) | Subtract smaller from larger | O(max(a,b)) | Euclidean algorithm | O(log(min(a,b))) |
| Modular inverse | Extended Euclid | O(log m) | Fermat (prime mod only) | O(log p) |
| Factorisation | Trial division | O(sqrt(n)) | Pollard's rho | O(n^{1/4}) |

---

## 🏢 Enterprise Lens — Essential Array Patterns & Practice

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Streaming analytics, log processing, fraud detection heuristics, financial series |
| **Failure modes** | Kadane with all-negative arrays; forgetting the verification pass; off-by-one in prefix indices |
| **Testing and verification** | Brute-force comparison on small random arrays |

---

## Reality Check

**"Euler totient function is obscure"** → Euler totient phi(n) counts integers from 1 to n that are coprime to n. This directly appears in: RSA encryption (computing d = e^-1 mod phi(n)), computing modular exponentiation efficiently (a^k mod n = a^(k mod phi(n)) mod n by Euler theorem), and counting fractions in lowest terms with denominator n. It is foundational to modern cryptography.

**"Chinese Remainder Theorem is just a mathematical curiosity"** → CRT enables: parallel computation (split a large modular computation into independent smaller moduli, compute separately, reconstruct), RSA-CRT (4x speedup of RSA decryption by computing mod p and mod q separately), and solving systems of modular equations (scheduling problems where events repeat at different intervals).

**"Discrete logarithm is the inverse of modular exponentiation"** → Computing a^k mod p is efficient with fast exponentiation O(log k). Computing k given a, a^k mod p, and p (discrete log) has no known efficient algorithm for general groups — this asymmetry is the basis of Diffie-Hellman key exchange and ElGamal encryption. Baby-step giant-step solves it in O(sqrt(p)) time and space, which is exponential in the bit length of p.

**"Fermat Little Theorem only proves primality"** → Fermat Little Theorem states a^(p-1) = 1 mod p for prime p. It is used for: fast modular inverse computation (a^(p-2) mod p), exponent reduction in modular arithmetic (reducing large exponents mod p-1), and as a primality TEST (not proof — Carmichael numbers are composite but pass the Fermat test for all bases). Miller-Rabin strengthens Fermat to avoid Carmichael number false positives.

**"Number theory algorithms do not need implementation care"** → Modular multiplication of two 64-bit numbers can overflow even a long (64 bits). Computing (a * b) mod m where a and b are near 10^18 overflows. Solutions: use Math.multiplyHigh in Java 9+ for 128-bit intermediate results, use BigInteger for correctness, or use the Russian peasant multiplication approach (repeated doubling with mod at each step). Ignoring overflow produces silently wrong answers.
