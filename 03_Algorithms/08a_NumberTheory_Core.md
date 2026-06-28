> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](08b_NumberTheory_Advanced.md)

---

# 🔢 GCD, Number Theory & Pattern Programs - Complete Guide

## From Euclid to Production Systems

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

Number theory algorithms trace back to the ancient world, with **Euclid's algorithm for GCD (circa 300 BC)** appearing in Euclid's Elements (Book VII, Proposition 2) — remarkably, the Euclidean algorithm for finding the greatest common divisor using repeated division remains essentially unchanged and is still the most efficient practical method for computing GCD, over 2,300 years later. The **Sieve of Eratosthenes** (circa 240 BC) was the first systematic method for finding all prime numbers up to a given limit — Eratosthenes, the chief librarian of Alexandria, described the method as crossing out multiples of each prime like crossing threads in a woven fabric (hence "sieve"). **Fermat's Little Theorem (1640)** established that $a^p \equiv a \pmod{p}$ for prime $p$, foundational to modern primality testing and the entire field of cryptography. **Euler (1760s)** generalized this to $\phi(n)$ (Euler's totient function), proving that the number of integers less than $n$ that are coprime to $n$ follows $n \prod(1 - 1/p)$. **Miller and Rabin (1976/1977)** transformed Euler's theoretical work into a practical randomized primality test that runs in $O(k \log^3 n)$ time. Modern practice (post-2010): RSA encryption, Bitcoin address generation, and hash-based commitments all rely on the intractability of integer factorization — the same mathematical foundation Euclid discovered.

---

# ═══════════════════════════════════════════════════════════

# PART 1: GCD (Greatest Common Divisor) - COMPLETE

# ═══════════════════════════════════════════════════════════

## 🎯 WHY GCD Matters

```
REAL LIFE:
──────────
You have 12 chocolates and 18 toffees.
You want to distribute equally in boxes with NO leftovers.
What's the LARGEST number of boxes you can make?

GCD(12, 18) = 6 boxes
Each box: 2 chocolates + 3 toffees

PRODUCTION SYSTEM:
────────────────
Database has 120 shards, you want to reorganize into fewer groups
Each group must have equal number of shards
Maximum groups possible? GCD helps!
```

---

## Algorithm 1: Brute Force GCD

```java
/**
 * WHY: Understand what GCD means before optimizing
 * HOW: Check every number from min(a,b) down to 1
 *
 * Time: O(min(a,b))
 * Space: O(1)
 */
public static int gcdBruteForce(int a, int b) {
    int smaller = Math.min(a, b);

    for (int i = smaller; i >= 1; i--) {
        if (a % i == 0 && b % i == 0) {
            return i; // First one we find (going down) is GCD
        }
    }

    return 1; // Coprime
}

// TEST:
// gcdBruteForce(12, 18) → 6
// gcdBruteForce(7, 13) → 1 (coprime)
// gcdBruteForce(0, 5) → 5
```

---

## Algorithm 2: Euclid's Algorithm (Subtraction)

```java
/**
 * WHY: Euclid realized: GCD(a, b) = GCD(a-b, b) when a > b
 * HOW: Keep subtracting smaller from larger until equal
 *
 * VISUAL:
 *   GCD(48, 18)
 *   48 - 18 = 30 → GCD(30, 18)
 *   30 - 18 = 12 → GCD(18, 12)
 *   18 - 12 = 6  → GCD(12, 6)
 *   12 - 6  = 6  → GCD(6, 6)
 *   Equal! GCD = 6
 *
 * Time: O(max(a,b)) worst case
 * Space: O(1)
 */
public static int gcdSubtraction(int a, int b) {
    while (a != b) {
        if (a > b) {
            a = a - b;
        } else {
            b = b - a;
        }
    }
    return a;
}
```

---

## Algorithm 3: Euclid's Algorithm (Modulo) ⭐ MOST IMPORTANT

```java
/**
 * WHY: Subtraction is slow for large numbers. GCD(1000000, 3) takes forever!
 *      Modulo is like doing ALL subtractions at once
 * HOW: GCD(a, b) = GCD(b, a % b) until b becomes 0
 *
 * VISUAL:
 *   GCD(48, 18)
 *   48 % 18 = 12 → GCD(18, 12)
 *   18 % 12 = 6  → GCD(12, 6)
 *   12 % 6  = 0  → GCD(6, 0) = 6 ✓
 *
 * Time: O(log(min(a,b)))  ← VERY FAST!
 * Space: O(1) iterative, O(log(min(a,b))) recursive
 */

// ITERATIVE (recommended for interviews)
public static int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// RECURSIVE (elegant, easy to remember)
public static int gcdRecursive(int a, int b) {
    if (b == 0) return a;
    return gcdRecursive(b, a % b);
}

// ONE-LINER (interview flex)
public static int gcdOneLine(int a, int b) {
    return b == 0 ? a : gcdOneLine(b, a % b);
}

// TEST CASES:
// gcd(12, 18) → 6
// gcd(48, 18) → 6
// gcd(0, 5) → 5
// gcd(7, 0) → 7
// gcd(1, anything) → 1
// gcd(same, same) → same
```

### Why Euclid Works — The Invariant That Survives Every Step

The one-liner above is short enough to memorize in five seconds — and that is exactly the problem. Once you've typed it three times, you stop thinking about why it's correct, and then in an interview you can't recover when asked "why does this terminate?" or "how do you know the answer is right?" The invariant makes both questions trivial. Without it, Euclid is a trick; with it, Euclid is the obvious algorithm.

**The invariant: `gcd(a, b) = gcd(b, a mod b)`** — the gcd of the pair never changes. This is what makes the algorithm correct, and the proof is one sentence: any common divisor `d` of `a` and `b` divides `a - q*b` for any integer `q` (a basic property of divisibility), so `d` divides `a mod b`. Conversely, any divisor of `b` and `a mod b` also divides `a = (a mod b) + q*b`. So the *sets of common divisors* of `(a, b)` and `(b, a mod b)` are identical — same divisors, same maximum, same gcd. The algorithm swaps `(a, b)` for a pair with the same gcd but smaller second argument, and it does this until the second argument hits 0. When `b == 0`, `gcd(a, 0) = a` by convention (every number divides 0), so `a` is the answer.

**Why it terminates in O(log min(a, b)) steps** — the second argument strictly decreases, and it decreases *fast*. Look at two consecutive iterations:

```
gcd(a, b) → gcd(b, a mod b) → gcd(a mod b, b mod (a mod b))
```

In the second step, the new second argument is `b mod (a mod b)`. Now `a mod b < b`, so the *next* second argument is even smaller than `a mod b`. But how fast? Here's the trick: in any two consecutive iterations, the smaller of the two arguments at least halves. If `a > b`, after one step you have `(b, a mod b)` where `a mod b < b ≤ a`. If `b > a mod b`, after another step the second argument becomes `b mod (a mod b)` which is strictly less than `a mod b`. If `b ≤ a mod b`, then `b < a mod b < a`, and `b` *is* the smaller, and we just halved. Either way, within two steps the smaller argument has at least halved. After `k` doublings of the smaller argument, you've exhausted `min(a, b)`, so `k ≤ log₂(min(a, b))` iterations. That's the "O(log min)" complexity — not from any single step being logarithmic, but from the cumulative halving across pairs of steps.

**Why this is fast in practice for huge numbers.** For `gcd(10^18, 10^18 - 1)` (which are coprime — their only common divisor is 1), Euclid takes maybe 60 iterations to discover that. Compare to brute force (try every integer up to 10^18): impossible. Or subtraction Euclid: 10^18 iterations. The modulo version is doing in 60 iterations what subtraction would need a billion billion iterations to do — because modulo is "how many subtractions can I skip in one step?" The mathematical answer is `floor(a/b)` of them, but the algorithm only needs the remainder to know it's done.

**The deeper pattern: invariant + monotone shrink.** Euclid's algorithm has the same shape as binary search (invariant: target is in `[lo, hi]`; each step halves the range) and the same shape as the master theorem's divide step (shrink the input; recurse on the smaller part). The three are the same idea: maintain a property the answer must satisfy, and shrink the candidate space monotonically. Once you see this shape, you can re-derive Euclid, prove it, and recognize the same template in a dozen other algorithms. That's the durable lesson — not "remember `gcd(a, b) = gcd(b, a mod b)`" but "remember: find an invariant the answer satisfies, shrink the space while keeping it intact."

**Why the subtraction variant is also correct but slow.** `gcd(a, b) = gcd(a - b, b)` if `a > b` (a special case of the modulo identity with `q = 1`). So you can implement Euclid with subtraction only. The invariant is the same, the algorithm is the same — but the shrink rate is `O(1)` per step instead of "halving in two steps," giving `O(max(a, b))` worst case. For `gcd(10^18, 1)`, subtraction would take 10^18 steps. This is the perfect illustration of *why modulo matters*: it's the shortcut that compresses many subtractions into one.

**Common bug — modulo with negatives.** Java's `%` operator returns the sign of the dividend: `-7 % 3 = -1` (Java), but mathematically `(-7) mod 3 = 2`. If `a` or `b` can be negative, Euclid will eventually misfire because `a % b` may be negative even when `a, b > 0` was assumed. Fix: always pass `Math.abs(...)` to your gcd implementation, or check `b < 0` and recurse with `gcd(a, -b)`.

🔬 **Section Challenge — Euclid Correctness**

**Challenge 1 (Proof, 8 min):** Prove that the Euclid recursive algorithm `gcd(a, b) = b == 0 ? a : gcd(b, a % b)` terminates for all non-negative inputs `a, b`. Hint: focus on the second argument and use the fact that `a mod b < b` whenever `b > 0`.

<details><summary>Answer</summary>

The second argument `b` is strictly decreasing on each recursive call (until termination), because:

1. The base case `b == 0` terminates immediately, returning `a`.
2. In the recursive case, the new second argument is `a % b`, which is the remainder when `a` is divided by `b`. By definition, `a % b < b` whenever `b > 0`. So the new `b` is strictly less than the old `b`.
3. The new first argument is the old `b`, which is non-negative (since we only recurse with `b > 0`).
4. So we have a strictly decreasing sequence of non-negative integers — by well-ordering of the naturals, such a sequence must reach 0 in finitely many steps.

Termination depth: at most `b` steps (since each step decreases `b` by at least 1), but in practice the halving argument gives `O(log min(a, b))` steps.

</details>

**Challenge 2 (Variant Reasoning, 5 min):** The LCM is given by `lcm(a, b) = a / gcd(a, b) * b`. Why does this formula hold — i.e., what's the number-theoretic reason that the product equals `gcd × lcm`?

<details><summary>Answer</summary>

**Prime factorization view.** Write `a = p1^α1 × p2^α2 × ... × pk^αk` and `b = p1^β1 × p2^β2 × ... × pk^βk` (allowing αi or βi to be 0). Then:

- `gcd(a, b)` has prime `pi` to the power `min(αi, βi)` — the smaller exponent.
- `lcm(a, b)` has prime `pi` to the power `max(αi, βi)` — the larger exponent.
- `a × b` has prime `pi` to the power `αi + βi` — the sum.

Since `min(α, β) + max(α, β) = α + β`, the exponents in `gcd × lcm` are exactly the exponents in `a × b`. So `gcd(a, b) × lcm(a, b) = a × b`, and rearranging gives `lcm(a, b) = a × b / gcd(a, b)`.

**Implementation gotcha.** Compute as `(a / gcd(a, b)) * b`, NOT as `(a * b) / gcd(a, b)`. The first form does the division early, preventing integer overflow when `a * b` exceeds `Integer.MAX_VALUE`. For example, `lcm(10^9, 10^9 - 1)` is roughly `10^18`, which overflows int but fits in long if you divide first.

</details>

---

## Algorithm 4: Binary GCD (Stein's Algorithm)

```java
/**
 * WHY: On CPUs, bit operations are faster than division
 * HOW: Use only subtraction and bit shifts
 *
 * RULES:
 *   1. gcd(0, b) = b, gcd(a, 0) = a
 *   2. Both even: gcd(a, b) = 2 * gcd(a/2, b/2)
 *   3. a even, b odd: gcd(a, b) = gcd(a/2, b)
 *   4. Both odd: gcd(a, b) = gcd(|a-b|/2, min(a,b))
 *
 * Time: O(log(a) * log(b))
 * Space: O(1)
 *
 * REAL WORLD: Used in Java's BigInteger.gcd() for large numbers
 */
public static int binaryGCD(int a, int b) {
    if (a == 0) return b;
    if (b == 0) return a;

    // Count common factors of 2
    int shift = 0;
    while (((a | b) & 1) == 0) { // Both even
        a >>= 1;
        b >>= 1;
        shift++;
    }

    // Remove remaining factors of 2 from a
    while ((a & 1) == 0) a >>= 1;

    do {
        while ((b & 1) == 0) b >>= 1;

        if (a > b) {
            int temp = a;
            a = b;
            b = temp;
        }
        b -= a;
    } while (b != 0);

    return a << shift;
}
```

---

🔬 **Section Challenge — Algorithm 4: Binary GCD (Stein's Algorithm)**

**Challenge 1 (Bit-Level Reasoning):** Binary GCD replaces division/modulo with shifts and subtraction. Why can this be faster, and what edge cases must your implementation handle?

<details><summary>Trace, Reasoning & Debug</summary>

**Trace:** If both numbers are even, `gcd(a, b) = 2 * gcd(a/2, b/2)`. If one number is even, remove its factor of two. If both are odd, subtract the smaller from the larger and continue.

**Reasoning:** Shifts and subtraction are cheaper than repeated modulo on some systems, especially for large integer arithmetic. The algorithm preserves common factors while reducing the numbers toward equality.

**Debug/Fix:** Normalize negatives if allowed, handle `gcd(0, b) = |b|`, handle `gcd(0, 0)` according to the problem statement, and track the common power of two so it can be restored at the end.

</details>

## LCM (Least Common Multiple)

```java
/**
 * WHY: LCM is needed when you want SYNCHRONIZATION
 *
 * REAL LIFE:
 *   Bus A comes every 12 minutes
 *   Bus B comes every 18 minutes
 *   Both arrive together now. When will they be together again?
 *   LCM(12, 18) = 36 minutes
 *
 * PRODUCTION:
 *   Cron job A runs every 12 hours
 *   Cron job B runs every 18 hours
 *   When will they conflict (run at same time)?
 *   LCM(12, 18) = 36 hours
 *
 * FORMULA: LCM(a, b) = (a * b) / GCD(a, b)
 */
public static long lcm(int a, int b) {
    // Use long to avoid overflow: a * b can be large
    return (long) a / gcd(a, b) * b;
}

// LCM of array
public static long lcmOfArray(int[] arr) {
    long result = arr[0];
    for (int i = 1; i < arr.length; i++) {
        result = lcm((int) result, arr[i]);
    }
    return result;
}

// TEST:
// lcm(12, 18) → 36
// lcm(4, 6) → 12
// lcm(7, 13) → 91 (coprime = product)
// lcmOfArray([2, 3, 4, 5]) → 60
```

---

## GCD-Based Problems

### Problem G1: Cutting Rectangle into Largest Squares

```java
/**
 * PROBLEM: You have a rectangular paper of size W × H
 * Cut it into the LARGEST possible square pieces with NO waste
 * What is the side length of each square?
 *
 * WHY GCD: The answer is GCD(W, H)!
 *
 * VISUAL for 12 × 18:
 *   GCD(12, 18) = 6
 *   Square side = 6
 *   You get: (12/6) × (18/6) = 2 × 3 = 6 squares
 *
 *   ┌──────┬──────┬──────┐
 *   │      │      │      │ 6
 *   │  6×6 │  6×6 │  6×6 │
 *   │      │      │      │
 *   ├──────┼──────┼──────┤
 *   │      │      │      │ 6
 *   │  6×6 │  6×6 │  6×6 │
 *   │      │      │      │
 *   └──────┴──────┴──────┘
 *       6      6      6
 *
 * REAL INCIDENT (Tile Manufacturing):
 * Factory needed to cut 120cm × 84cm marble slabs into square tiles
 * GCD(120, 84) = 12cm tiles → 10 × 7 = 70 tiles per slab
 */
public static int largestSquareSide(int width, int height) {
    return gcd(width, height);
}

public static int numberOfSquares(int width, int height) {
    int side = gcd(width, height);
    return (width / side) * (height / side);
}
```

### Problem G2: Water Jug Problem (BFS + GCD)

```java
/**
 * PROBLEM: You have two jugs of capacity A and B liters.
 * Can you measure exactly C liters?
 *
 * MATH: Possible if and only if C is divisible by GCD(A, B)
 *       AND C <= max(A, B)
 *
 * REAL LIFE: Die Hard 3 movie puzzle!
 * Bruce Willis had 3-gallon and 5-gallon jugs, needed exactly 4 gallons
 * GCD(3, 5) = 1, 4 % 1 == 0 → YES, possible!
 */
public static boolean canMeasureWater(int jug1, int jug2, int target) {
    if (target > jug1 + jug2) return false;
    if (target == 0) return true;
    return target % gcd(jug1, jug2) == 0;
}

// Find the actual steps using BFS
public static List<String> waterJugSteps(int jug1Cap, int jug2Cap, int target) {
    // State: (amount in jug1, amount in jug2)
    Set<String> visited = new HashSet<>();
    Queue<int[]> queue = new LinkedList<>();
    Map<String, String> parent = new HashMap<>();

    queue.offer(new int[]{0, 0});
    visited.add("0,0");

    while (!queue.isEmpty()) {
        int[] state = queue.poll();
        int a = state[0], b = state[1];

        if (a == target || b == target || a + b == target) {
            // Reconstruct path
            return reconstructPath(parent, a + "," + b);
        }

        // All possible operations:
        int[][] nextStates = {
            {jug1Cap, b},           // Fill jug 1
            {a, jug2Cap},           // Fill jug 2
            {0, b},                 // Empty jug 1
            {a, 0},                 // Empty jug 2
            {Math.max(0, a - (jug2Cap - b)), Math.min(jug2Cap, a + b)},  // Pour 1→2
            {Math.min(jug1Cap, a + b), Math.max(0, b - (jug1Cap - a))}   // Pour 2→1
        };

        for (int[] next : nextStates) {
            String key = next[0] + "," + next[1];
            if (!visited.contains(key)) {
                visited.add(key);
                parent.put(key, a + "," + b);
                queue.offer(next);
            }
        }
    }

    return Collections.emptyList(); // Not possible
}
```

### Problem G3: Fraction Simplification

```java
/**
 * PROBLEM: Simplify fraction a/b to lowest terms
 *
 * PRODUCTION USE: Financial systems display simplified ratios
 * Stock split 100:25 → 4:1
 *
 * HOW: Divide both by GCD
 */
public static int[] simplifyFraction(int numerator, int denominator) {
    if (denominator == 0) throw new ArithmeticException("Denominator cannot be 0");

    int g = gcd(Math.abs(numerator), Math.abs(denominator));

    int num = numerator / g;
    int den = denominator / g;

    // Keep negative sign in numerator only
    if (den < 0) {
        num = -num;
        den = -den;
    }

    return new int[]{num, den};
}

// TEST:
// simplifyFraction(12, 18) → [2, 3]
// simplifyFraction(100, 25) → [4, 1]
// simplifyFraction(-6, 9) → [-2, 3]
// simplifyFraction(6, -9) → [-2, 3]
```

### Problem G4: Array GCD & Coprime Pairs

```java
/**
 * PROBLEM: Find GCD of entire array
 * THEN: Count pairs that are coprime (GCD = 1)
 */
public static int arrayGCD(int[] arr) {
    int result = arr[0];
    for (int i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
        if (result == 1) return 1; // Early exit: can't go below 1
    }
    return result;
}

public static int countCoprimePairs(int[] arr) {
    int count = 0;
    for (int i = 0; i < arr.length; i++) {
        for (int j = i + 1; j < arr.length; j++) {
            if (gcd(arr[i], arr[j]) == 1) {
                count++;
            }
        }
    }
    return count;
}

// TEST:
// arrayGCD([12, 18, 24]) → 6
// arrayGCD([7, 13, 25]) → 1
// countCoprimePairs([3, 5, 7, 10]) → 5 pairs
//   (3,5)=1✓ (3,7)=1✓ (3,10)=1✓ (5,7)=1✓ (7,10)=1✓  (5,10)=5✗
```

---

# ═══════════════════════════════════════════════════════════

# 📚 Part 2: Prime Numbers — Complete

# ═══════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════

# 📌 Part 3: Modular Arithmetic

# ═══════════════════════════════════════════════════════════

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
> **[09_Pattern_Programs_Complete.md](09_Pattern_Programs_Complete.md)** (2000+ lines, 30+ patterns).
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

> **Navigation**: [< Previous](07b_Advanced_DS_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08b_NumberTheory_Advanced.md)


---

## Reality Check

**"Primality testing requires checking all divisors"** → You only need to check divisors up to sqrt(n), reducing O(n) to O(sqrt(n)). For cryptographic-size numbers (hundreds of digits), even O(sqrt(n)) is infeasible. The Miller-Rabin probabilistic primality test runs in O(k log^2 n) for k rounds and is used in practice. The deterministic AKS primality test proves primality in polynomial time but is slower in practice than probabilistic methods.

**"Sieve of Eratosthenes is memory-intensive"** → The basic sieve stores a boolean array of size n, using n bytes. A bitwise sieve reduces this to n/8 bytes. A segmented sieve processes the range in sqrt(n)-sized blocks, using only O(sqrt(n)) memory while still achieving O(n log log n) time. For sieving primes up to 10^9, the segmented approach uses megabytes instead of gigabytes.

**"Modular arithmetic is only for competitive programming"** → Modular arithmetic is fundamental to: cryptography (RSA, Diffie-Hellman), hash functions (polynomial rolling hash), error-correcting codes (CRC), random number generation (linear congruential generators), and database sharding (hash partitioning). Understanding modular inverse, Fermat little theorem, and Chinese Remainder Theorem has direct practical applications.

**"Large number multiplication is just the schoolbook method"** → Schoolbook multiplication is O(n squared) for n-digit numbers. Karatsuba algorithm reduces this to O(n^1.585) by splitting each number into halves and using 3 multiplications instead of 4. For even larger numbers, Toom-Cook and FFT-based multiplication achieve near-linear time. Java BigInteger switches algorithms based on operand size: schoolbook for small, Toom-Cook for medium, and Schonhage-Strassen (FFT-based) for large.

**"GCD extended form (Bezout coefficients) is theoretical"** → The Extended Euclidean Algorithm finds x and y such that ax + by = gcd(a,b). This directly computes modular inverse: if gcd(a,m) = 1, then ax + my = 1, so x is the modular inverse of a mod m. Modular inverse is required for: modular division, RSA key generation, solving linear congruences, and Chinese Remainder Theorem reconstruction.
