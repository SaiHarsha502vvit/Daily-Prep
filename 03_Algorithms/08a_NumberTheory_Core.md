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

# ═══════════════════════════════════════════════════════════

# PART 4: PATTERN PROGRAMS ⭐ (Loop Mastery)

# ═══════════════════════════════════════════════════════════

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHY PATTERN PROGRAMS?                                                       ║
║                                                                              ║
║  "Pattern programs are NOT just for beginners" - Every Senior Dev            ║
║                                                                              ║
║  They teach:                                                                 ║
║  1. Nested loop thinking → Essential for 2D arrays, matrices                 ║
║  2. Index relationships → The KEY to solving any grid problem                ║
║  3. Space management → Teaches precision with boundaries                     ║
║  4. How to convert visual output to code logic                               ║
║                                                                              ║
║  REAL USE: Table formatting, report generation, ASCII art for CLIs           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Pattern 1: Right Triangle

```java
/**
 * OUTPUT (n=5):
 * *
 * * *
 * * * *
 * * * * *
 * * * * * *
 *
 * FORMULA: Row i has (i+1) stars
 */
public static void rightTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

### Pattern 2: Inverted Right Triangle

```java
/**
 * OUTPUT (n=5):
 * * * * * *
 * * * * *
 * * * *
 * * *
 * *
 *
 * FORMULA: Row i has (n-i) stars
 */
public static void invertedTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) {
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

### Pattern 3: Pyramid (Centered Triangle)

```java
/**
 * OUTPUT (n=5):
 *         *
 *       * * *
 *     * * * * *
 *   * * * * * * *
 * * * * * * * * * *
 *
 * FORMULA: Row i has (2*i+1) stars, (n-1-i) leading spaces
 */
public static void pyramid(int n) {
    for (int i = 0; i < n; i++) {
        // Leading spaces
        for (int s = 0; s < n - 1 - i; s++) {
            System.out.print(" ");
        }
        // Stars
        for (int j = 0; j < 2 * i + 1; j++) {
            System.out.print("*");
        }
        System.out.println();
    }
}
```

### Pattern 4: Diamond ⭐

```java
/**
 * OUTPUT (n=5):
 *     *
 *    ***
 *   *****
 *  *******
 * *********
 *  *******
 *   *****
 *    ***
 *     *
 *
 * TRICK: Upper half pyramid + inverted lower half
 */
public static void diamond(int n) {
    // Upper half (including middle)
    for (int i = 0; i < n; i++) {
        for (int s = 0; s < n - 1 - i; s++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) System.out.print("*");
        System.out.println();
    }
    // Lower half
    for (int i = n - 2; i >= 0; i--) {
        for (int s = 0; s < n - 1 - i; s++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) System.out.print("*");
        System.out.println();
    }
}
```

### Pattern 5: Number Pyramid

```java
/**
 * OUTPUT (n=5):
 *     1
 *    1 2
 *   1 2 3
 *  1 2 3 4
 * 1 2 3 4 5
 */
public static void numberPyramid(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 0; s < n - i; s++) System.out.print(" ");
        for (int j = 1; j <= i; j++) System.out.print(j + " ");
        System.out.println();
    }
}
```

### Pattern 6: Pascal's Triangle ⭐⭐

```java
/**
 * OUTPUT (n=5):
 *         1
 *       1   1
 *     1   2   1
 *   1   3   3   1
 * 1   4   6   4   1
 *
 * FORMULA: Each number = sum of two numbers above it
 * OR: C(row, col) = row! / (col! * (row-col)!)
 *
 * REAL USE:
 *   - Binomial coefficients
 *   - Probability calculations
 *   - Polynomial expansion
 */
public static void pascalsTriangle(int n) {
    for (int i = 0; i < n; i++) {
        // Leading spaces
        for (int s = 0; s < n - 1 - i; s++) System.out.print("  ");

        int val = 1;
        for (int j = 0; j <= i; j++) {
            System.out.printf("%4d", val);
            val = val * (i - j) / (j + 1); // Next nCr value
        }
        System.out.println();
    }
}
```

### Pattern 7: Floyd's Triangle

```java
/**
 * OUTPUT (n=5):
 * 1
 * 2  3
 * 4  5  6
 * 7  8  9  10
 * 11 12 13 14 15
 *
 * Numbers flow continuously
 */
public static void floydsTriangle(int n) {
    int num = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.printf("%-4d", num++);
        }
        System.out.println();
    }
}
```

### Pattern 8: Butterfly Pattern ⭐⭐

```java
/**
 * OUTPUT (n=4):
 * *            *
 * * *        * *
 * * * *    * * *
 * * * * ** * * *
 * * * * ** * * *
 * * * *    * * *
 * * *        * *
 * *            *
 */
public static void butterfly(int n) {
    // Upper half
    for (int i = 1; i <= n; i++) {
        // Left stars
        for (int j = 1; j <= i; j++) System.out.print("* ");
        // Middle spaces
        for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
        // Right stars
        for (int j = 1; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
    // Lower half
    for (int i = n; i >= 1; i--) {
        for (int j = 1; j <= i; j++) System.out.print("* ");
        for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
}
```

### Pattern 9: Hollow Square & Rectangle

```java
/**
 * OUTPUT (n=5):
 * * * * * *
 * *       *
 * *       *
 * *       *
 * * * * * *
 *
 * Print star only at edges: i==0, i==n-1, j==0, j==n-1
 */
public static void hollowSquare(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 || i == n - 1 || j == 0 || j == n - 1) {
                System.out.print("* ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

### Pattern 10: Spiral Number Matrix ⭐⭐⭐

```java
/**
 * OUTPUT (n=4):
 *  1  2  3  4
 * 12 13 14  5
 * 11 16 15  6
 * 10  9  8  7
 *
 * REAL USE: This pattern appears in matrix traversal interview questions!
 *
 * DSA Connection: Spiral Matrix traversal (LeetCode 54)
 */
public static void spiralMatrix(int n) {
    int[][] matrix = new int[n][n];
    int num = 1;
    int top = 0, bottom = n - 1, left = 0, right = n - 1;

    while (num <= n * n) {
        // Go right
        for (int j = left; j <= right; j++) matrix[top][j] = num++;
        top++;

        // Go down
        for (int i = top; i <= bottom; i++) matrix[i][right] = num++;
        right--;

        // Go left
        for (int j = right; j >= left; j--) matrix[bottom][j] = num++;
        bottom--;

        // Go up
        for (int i = bottom; i >= top; i--) matrix[i][left] = num++;
        left++;
    }

    // Print
    for (int[] row : matrix) {
        for (int val : row) {
            System.out.printf("%3d", val);
        }
        System.out.println();
    }
}
```

### Pattern 11: Alphabet Patterns

```java
/**
 * OUTPUT (n=5):
 * A
 * A B
 * A B C
 * A B C D
 * A B C D E
 */
public static void alphabetTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            System.out.print((char)('A' + j) + " ");
        }
        System.out.println();
    }
}

/**
 * OUTPUT (n=5):
 * A
 * B B
 * C C C
 * D D D D
 * E E E E E
 */
public static void alphabetTriangle2(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            System.out.print((char)('A' + i) + " ");
        }
        System.out.println();
    }
}

/**
 * Alphabet Diamond:
 *     A
 *    A B A
 *   A B C B A
 *  A B C D C B A
 * A B C D E D C B A
 */
public static void alphabetDiamond(int n) {
    for (int i = 0; i < n; i++) {
        // Spaces
        for (int s = 0; s < n - 1 - i; s++) System.out.print(" ");
        // Forward alphabet
        for (int j = 0; j <= i; j++) System.out.print((char)('A' + j));
        // Backward alphabet
        for (int j = i - 1; j >= 0; j--) System.out.print((char)('A' + j));
        System.out.println();
    }
}
```

### Pattern 12: Zigzag Pattern

```java
/**
 * OUTPUT (n=3, str="PAYPALISHIRING"):
 * P   A   H   N
 * A P L S I I G
 * Y   I   R
 *
 * REAL USE: This is LeetCode Problem #6 (ZigZag Conversion)!
 * Used in some encryption methods
 */
public static String zigzagConvert(String s, int numRows) {
    if (numRows == 1) return s;

    StringBuilder[] rows = new StringBuilder[numRows];
    for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();

    int currentRow = 0;
    boolean goingDown = false;

    for (char c : s.toCharArray()) {
        rows[currentRow].append(c);

        if (currentRow == 0 || currentRow == numRows - 1) {
            goingDown = !goingDown;
        }

        currentRow += goingDown ? 1 : -1;
    }

    StringBuilder result = new StringBuilder();
    for (StringBuilder row : rows) result.append(row);
    return result.toString();
}
```

---

# ═══════════════════════════════════════════════════════════

---

> **Navigation**: [< Previous](07b_Advanced_DS_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08b_NumberTheory_Advanced.md)

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

