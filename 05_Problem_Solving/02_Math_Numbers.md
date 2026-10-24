> **Navigation**: [← Section 2: String Problems](03_Strings.md) | [Chapter index](00_INDEX.md) | [Two Pointers →](06_Two_Pointers.md)


---

# 🧩 Section 1: Basic Math & Number Problems

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Number Theory Core](../03_Algorithms/08a_NumberTheory_Core.md), [Common Mistakes](24_Common_Mistakes.md) |
| **You will learn** | Digit manipulation, gcd/lcm, primes and sieves, modular arithmetic, and overflow-safe arithmetic |
| **Leads to** | [Strings](03_Strings.md), [Bit Manipulation](18_BitManipulation.md) |
| **Abstraction level** | Arithmetic on small numbers → **arithmetic with limits** (overflow, modulus) |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Math & Number Problems

### 1. The bottom line

Number problems are about finding a formula or a loop that avoids big intermediate values and respects the integer range.

### 2. The textbook core

- Digits: `n % 10` and `n / 10`.
- `gcd(a, b)` by Euclid; `lcm = a / gcd * b` (divide first to avoid overflow).
- Sieve of Eratosthenes: `O(n log log n)`.
- Modular arithmetic: reduce after every multiplication; use `long`.
- Check `Integer.MAX_VALUE` boundaries before multiplying.

### 3. The real-world analogy

An **odometer**: digits roll over, and after the maximum the counter wraps — exactly like integer overflow.

### 4. Walkthrough

1. Reverse the integer `123`.
2. Loop: take `n % 10` = 3, build `rev = 0·10 + 3`, drop the digit; repeat → 32, 321.
3. Before `rev * 10 + d`, check it cannot exceed `Integer.MAX_VALUE`.
4. Return 0 on overflow.

> [!NOTE]
> **Quick check:** Why compute `lcm` as `a / gcd(a, b) * b`? *Dividing first keeps the intermediate value small and avoids overflow.*


### 5. Check yourself

**Q1.** `gcd(84, 36)`?

<details><summary>Answer</summary>

**12** (84 mod 36 = 12; 36 mod 12 = 0).

</details>

**Q2.** Compute `lcm(4, 6)` without overflow risk.

<details><summary>Answer</summary>

`4 / gcd(4,6) * 6 = 4 / 2 * 6 =` **12**; dividing first keeps intermediates small.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [1.1 Prime Number Problems](02_Math_Numbers/01_prime_number_problems.md) | 1.1 Prime Number Problems | 351 |
| 2 | [1.2 Fibonacci Problems](02_Math_Numbers/02_fibonacci_problems.md) | 1.2 Fibonacci Problems | 253 |
| 3 | [1.3 Digit Manipulation Problems](02_Math_Numbers/03_digit_manipulation_problems.md) | 1.3 Digit Manipulation Problems | 242 |
| 4 | [1.4 GCD & Lcm Problems](02_Math_Numbers/04_gcd_lcm_problems.md) | 1.4 GCD & Lcm Problems | 146 |

## 🏢 Enterprise Lens — Math & Number Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Pricing and tax maths, hashing, cryptography, scheduling periods |
| **Failure modes** | Silent `int` overflow; negative modulus results; off-by-one in sieve bounds |
| **Testing and verification** | Compare with `BigInteger` or brute force on small ranges |

---

## Reality Check

**"Integer overflow is a C problem, not a Java one"** → Java overflows SILENTLY at 2^31-1 — no exception, no warning, just wraparound. mid = (lo + hi) / 2, sums of two large ints, and products in factorial or power computations all bite in Java exactly as in C; only the symptom differs (wrong value instead of undefined behavior). The reflexes: widen to long BEFORE arithmetic, know that Math.abs(Integer.MIN_VALUE) is still negative, and treat any multiplication of user-scale numbers as suspect.

**"The percent operator gives the remainder in math class"** → Java's percent follows the DIVIDEND's sign: -7 % 3 is -1, not 2 — so hash bucketing, circular indexing, and modular arithmetic on possibly-negative values all need Math.floorMod or the ((x % m) + m) % m normalization. Half of all "works on positives, fails on test 31" number-theory submissions trace to exactly this line.

**"Checking divisors up to n/2 is the optimization"** → Divisors pair up around the square root: if d divides n, so does n/d, and one of them is at most sqrt(n). Trial division to sqrt(n), the perfect-square special case (its root pairs with itself), and enumerate-divisors-in-pairs all fall out of this single pairing fact. The same fact is why factor-counting problems suddenly become O(sqrt(n)) and why the "count numbers with odd divisor counts" trick answer is "perfect squares."

**"Floating point is fine if I round at the end"** → Errors ACCUMULATE and comparisons lie long before the rounding step: 0.1 + 0.2 != 0.3, and summing a million floats in different orders gives different totals. The professional habits: compare with a tolerance, restructure to integer arithmetic when the domain allows (work in cents, cross-multiply instead of dividing), and treat any equality test between computed doubles as a bug until proven otherwise.

**"GCD problems require remembering number theory"** → One loop (Euclid: replace the larger by its remainder) plus three consequences cover the interview surface: LCM is a*b/gcd computed as (a/gcd)*b to dodge overflow, fraction reduction is divide-both-by-gcd, and co-primality is gcd == 1. The depth question interviewers actually ask is WHY Euclid terminates — remainders strictly shrink and stay non-negative — which is a two-sentence answer worth having ready.
