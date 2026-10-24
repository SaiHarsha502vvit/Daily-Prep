# Part 2 — Prime Numbers

> **Navigation**: [← Part 1 — GCD (Greatest Common Divisor)](01_section.md) | [Chapter overview](../08a_NumberTheory_Core.md) | [Part 3 — Modular Arithmetic and Proofs →](03_section.md)
> Page 2 of 3 in **GCD, Number Theory & Pattern Programs - Complete Guide**


## Why Primes Matter

```
CRYPTOGRAPHY (RSA):
  - Your bank transactions use prime numbers
  - RSA encryption: p × q = n (where p, q are large primes)
  - Breaking RSA = factoring n into p × q (nearly impossible for large primes)

HASHING:
  - HashMap uses prime numbers for capacity
  - Prime table size reduces hash collisions
  - Why initial capacity 11, 17, 23, 31...? All primes!

DATABASE:
  - Oracle DB uses prime numbers in hash partitioning
  - Reduces data skew across partitions
```

---

## Algorithm P1: Check if Prime

```java
/**
 * Brute Force: O(n)
 */
public static boolean isPrimeBrute(int n) {
    if (n <= 1) return false;
    for (int i = 2; i < n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

/**
 * Optimized: O(√n) ← Interview standard
 *
 * WHY √n? If n = a × b, one of them must be ≤ √n
 * Example: 36 = 1×36 = 2×18 = 3×12 = 4×9 = 6×6
 *          After √36 = 6, factors repeat!
 */
public static boolean isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    // Check only 6k±1 pattern (all primes > 3 are of form 6k±1)
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return false;
        }
    }
    return true;
}

// WHY 6k±1?
// All integers are: 6k, 6k+1, 6k+2, 6k+3, 6k+4, 6k+5
// 6k   = divisible by 2 and 3
// 6k+2 = divisible by 2
// 6k+3 = divisible by 3
// 6k+4 = divisible by 2
// Only 6k+1 and 6k+5(=6k-1) can be prime!
```

---

## Algorithm P2: Sieve of Eratosthenes ⭐

```java
/**
 * PROBLEM: Find ALL primes up to N
 *
 * WHY: Checking each number one by one is O(N√N)
 *      Sieve does it in O(N log log N) ← nearly linear!
 *
 * HOW: Mark multiples of each prime as composite
 *
 * VISUAL (N = 30):
 *   Start: 2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
 *   Cross out 2's multiples:   4     6     8     10    12    14    16    18    20    22    24    26    28    30
 *   Cross out 3's multiples:            9           15          21          27
 *   Cross out 5's multiples:                              25
 *   Done! Remaining: 2 3 5 7 11 13 17 19 23 29
 */
public static boolean[] sieveOfEratosthenes(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            // Mark all multiples of i as composite
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }

    return isPrime;
}

// Get list of primes
public static List<Integer> getPrimes(int n) {
    boolean[] sieve = sieveOfEratosthenes(n);
    List<Integer> primes = new ArrayList<>();
    for (int i = 2; i <= n; i++) {
        if (sieve[i]) primes.add(i);
    }
    return primes;
}

// Count primes up to N
public static int countPrimes(int n) {
    boolean[] sieve = sieveOfEratosthenes(n);
    int count = 0;
    for (int i = 2; i <= n; i++) {
        if (sieve[i]) count++;
    }
    return count;
}

// TEST:
// getPrimes(30) → [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
// countPrimes(100) → 25
```

### Why `O(n log log n)` and Why Start at `i*i` — The Sieve Made Felt

Two questions that look like implementation details but are actually the whole algorithm: (1) why is the total work `n log log n` and not something worse? (2) why does the inner loop start at `i*i` and not at `2*i`? Get these and the sieve is no longer a recipe — it's the obvious way to find primes.

**Why `O(n log log n)` — the cost function is harmonic, not exponential.** Each prime `p ≤ n` does work proportional to `n/p` (marking multiples from `p²` to `n` is `n/p` operations). Total work is therefore:

```
  sum over primes p ≤ n  of  n/p  =  n × sum_{p prime, p ≤ n} 1/p
```

The right side, `sum 1/p` over primes, is the *prime harmonic series*. Unlike the regular harmonic series (which diverges), the prime harmonic series grows *very* slowly — it's bounded by `log log n + M` for some constant `M` (Mertens' second theorem). So total work is `n × (log log n + constant) = O(n log log n)`. For `n = 10^9`, `log log n ≈ log(20.7) ≈ 3.03`, so the sieve is barely 3× slower than a linear scan — effectively linear in practice. That's why it's the algorithm of choice for "find all primes up to N" whenever `N ≥ ~10^5`.

**Why start at `i*i` and not `2*i` — every composite is "owned" by its smallest prime factor.** Consider any composite `c ≤ n`. It has at least one prime factor `p ≤ √c` (otherwise `c` would be a product of primes all bigger than `√c`, forcing `c > n`). The smallest such prime factor is `p ≤ √c ≤ √n`. When the outer loop reaches `i = p`, the inner loop will mark `c` as composite (because `p * (c/p) = c` and `c/p ≥ p` since `p` is the smallest factor). So `c` is marked by the iteration that processes its *smallest* prime factor.

Now the key observation: every composite has a *unique* smallest prime factor. So every composite is marked exactly once across the entire execution. If we started the inner loop at `2*i` instead of `i*i`, we would redundantly mark composites whose smallest prime factor is *less* than `i` — for example, `12` would be marked by `i=2` (correct), `i=3` (redundant: 12 = 3*4, smallest prime factor is 2, already marked), and `i=6` doesn't run since 6 isn't prime. By starting at `i*i`, the inner loop *only* marks composites whose smallest prime factor is exactly `i`. The inner loop work for prime `p` is then `n/p - p + 1 ≤ n/p`, and the sum becomes `n × (sum 1/p)` exactly, giving `O(n log log n)`. Starting at `2*i` would give `O(n log n)` — still fast, but loses a factor of `log log n / log n`, which matters when `n` is huge.

**The invariant.** Throughout the sieve: "for every prime `p ≤ √current_i`, all multiples of `p` up to `n` are marked composite." Equivalently: at the start of iteration `i`, the only numbers still marked prime in `[2, i-1]` are the actual primes. The loop maintains this invariant by marking multiples of `i` if and only if `i` itself is prime. If `i` is composite (say `i = pq` with `p ≤ q`), it was already marked when we processed `p` — so the `if (isPrime[i])` check skips it and avoids re-marking.

**Comparison with alternatives.** The naive trial division (check each `n` against divisors up to `√n`) is `O(n√n)` — `10^6` operations to find primes up to `10^6`. The sieve is `O(n log log n)` — `5 × 10^6` operations to find primes up to `10^9`. The sieve wins by ~3 orders of magnitude at large `n`, and is also simpler to code. Trade-off: the sieve uses `O(n)` memory (the boolean array), which limits it to `n ≤ ~10^9` in practice (4 GB for a `boolean[]` if bit-packed, more if using Java `boolean` which is actually 1 byte). For truly huge `n` (10^12+), use a segmented sieve (process in chunks of size `√n`).

**Common bug — using `i*i` when `i*i` overflows.** For `int i`, `i*i` overflows when `i > ~46340` (since `46341² = 2,147,488,681 > Integer.MAX_VALUE`). If you naively write `for (int i = 2; i*i <= n; i++)` and `n` is large, the overflow makes `i*i` negative and the loop runs forever (or for a very long time). Fix: use `long` for the multiplication, or test `(long) i * i <= n`.

🔬 **Section Challenge — Sieve Mechanics**

**Challenge 1 (Bound Reasoning, 5 min):** In the sieve code above, the outer loop is `for (int i = 2; i*i <= n; i++)`. Why is `i*i <= n` (i.e., `i ≤ √n`) the correct termination condition? What does it mean to keep iterating past `√n`?

<details><summary>Answer</summary>

Once `i > √n`, any composite `c ≤ n` has a prime factor `p ≤ √n < i`. That means `c` has *already* been marked by the time we reach iteration `i`. So we don't need to process any `i > √n` — all composites up to `n` have a prime factor `≤ √n`, and they've all been handled.

The condition `i*i <= n` is the same as `i <= √n` (for non-negative `i`). Past `√n`, every `i` is either composite (already marked) or prime but contributes nothing new (its smallest multiple `i*i > n`, so the inner loop wouldn't execute even if we entered it). Stopping at `√n` is both correct and optimal.

The remaining unmarked numbers in `[√n, n]` are exactly the primes in that range — because every composite in that range has a smallest prime factor ≤ √n and was marked.

</details>

---

## Algorithm P3: Prime Factorization

```java
/**
 * PROBLEM: Break a number into its prime factors
 *
 * PRODUCTION USE:
 *   - RSA key generation
 *   - Simplifying hash functions
 *   - Database partition sizing
 *
 * 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5
 */
public static List<Integer> primeFactors(int n) {
    List<Integer> factors = new ArrayList<>();

    // Extract all 2's
    while (n % 2 == 0) {
        factors.add(2);
        n /= 2;
    }

    // Check odd numbers from 3 to √n
    for (int i = 3; i * i <= n; i += 2) {
        while (n % i == 0) {
            factors.add(i);
            n /= i;
        }
    }

    // If n is still > 1, then it's a prime factor
    if (n > 1) {
        factors.add(n);
    }

    return factors;
}

// With counts (for display)
public static Map<Integer, Integer> primeFactorization(int n) {
    Map<Integer, Integer> factorMap = new LinkedHashMap<>();

    for (int i = 2; i * i <= n; i++) {
        while (n % i == 0) {
            factorMap.merge(i, 1, Integer::sum);
            n /= i;
        }
    }
    if (n > 1) factorMap.merge(n, 1, Integer::sum);

    return factorMap;
}

// TEST:
// primeFactors(60) → [2, 2, 3, 5]
// primeFactorization(360) → {2: 3, 3: 2, 5: 1}  means 2³ × 3² × 5
```

---

## Problem P4: Count Divisors Using Prime Factorization

```java
/**
 * PROBLEM: How many divisors does N have?
 *
 * FORMULA: If N = p1^a1 × p2^a2 × ...
 *          Divisors = (a1+1) × (a2+1) × ...
 *
 * Example: 60 = 2² × 3¹ × 5¹
 *          Divisors = (2+1)(1+1)(1+1) = 3 × 2 × 2 = 12
 *          The 12 divisors: 1,2,3,4,5,6,10,12,15,20,30,60 ✓
 */
public static int countDivisors(int n) {
    Map<Integer, Integer> factors = primeFactorization(n);
    int count = 1;
    for (int exp : factors.values()) {
        count *= (exp + 1);
    }
    return count;
}

// List all divisors (sorted)
public static List<Integer> getAllDivisors(int n) {
    List<Integer> divisors = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            divisors.add(i);
            if (i != n / i) {
                divisors.add(n / i);
            }
        }
    }
    Collections.sort(divisors);
    return divisors;
}
```

---

🔬 **Section Challenge — Problem P4: Count Divisors Using Prime Factorization**

**Challenge 1 (Formula Reasoning):** Why does `n = p1^a * p2^b * p3^c` have `(a + 1)(b + 1)(c + 1)` divisors, and how do constraints decide the factorization method?

<details><summary>Trace, Reasoning & Debug</summary>

**Trace:** Every divisor chooses an exponent for each prime: `p1` can be used `0..a` times, `p2` can be used `0..b` times, and so on. The choices are independent, so multiply the counts.

**Reasoning:** The formula is combinatorics over prime exponents. The algorithmic question is how fast you can get those exponents: trial division for small `sqrt(n)`, SPF sieve for many queries with bounded `n`, or stronger primality/factorization tools for huge numbers.

**Debug/Fix:** Divide `n` completely by each found prime, count exponents, and if the remaining `n > 1`, it contributes exponent `1`. For many queries, precompute smallest prime factor once.

</details>

---

[← Part 1 — GCD (Greatest Common Divisor)](01_section.md) | [Chapter overview](../08a_NumberTheory_Core.md) | [Part 3 — Modular Arithmetic and Proofs →](03_section.md)
