# 🔢 GCD, Number Theory & Pattern Programs - Complete Guide

## From Euclid to Production Systems

---

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  WHY THIS FILE EXISTS                                                            ║
║                                                                                   ║
║  GCD, LCM, Primes, Modular Arithmetic → appear in:                              ║
║  • 40% of coding interviews (number theory questions)                            ║
║  • Encryption systems (RSA uses GCD, primes, modular exponentiation)             ║
║  • Database sharding (hash % shard_count needs coprime understanding)            ║
║  • Load balancing algorithms                                                     ║
║  • Game development (timing, frequencies)                                        ║
║  • Pattern programs → builds loop thinking essential for ALL DSA                 ║
║                                                                                   ║
║  START DATE: February 10, 2026                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

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

# PART 2: PRIME NUMBERS - COMPLETE

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

# ═══════════════════════════════════════════════════════════

# PART 3: MODULAR ARITHMETIC

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
║  WHY PATTERN PROGRAMS?                                                        ║
║                                                                                ║
║  "Pattern programs are NOT just for beginners" - Every Senior Dev              ║
║                                                                                ║
║  They teach:                                                                   ║
║  1. Nested loop thinking → Essential for 2D arrays, matrices                   ║
║  2. Index relationships → The KEY to solving any grid problem                  ║
║  3. Space management → Teaches precision with boundaries                       ║
║  4. How to convert visual output to code logic                                 ║
║                                                                                ║
║  REAL USE: Table formatting, report generation, ASCII art for CLIs             ║
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

# PART 5: MORE ESSENTIAL ALGORITHMS

# ═══════════════════════════════════════════════════════════

## Algorithm: Kadane's Algorithm (Maximum Subarray Sum) ⭐⭐⭐

```java
/**
 * WHY: One of the most asked interview questions
 * WHERE: Stock profit analysis, signal processing, network traffic
 *
 * REAL INCIDENT:
 *   Amazon retail team needed to find peak sales window
 *   Daily profit/loss: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
 *   Best contiguous period: [4, -1, 2, 1] = 6 profit
 *
 * HOW: Track current sum, reset when it goes negative
 *
 * Time: O(n), Space: O(1)
 */
public static int kadane(int[] arr) {
    int maxSum = arr[0];
    int currentSum = arr[0];

    for (int i = 1; i < arr.length; i++) {
        // Either extend current subarray or start fresh
        currentSum = Math.max(arr[i], currentSum + arr[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}

// With indices (find WHERE the maximum subarray is)
public static int[] kadaneWithIndices(int[] arr) {
    int maxSum = arr[0], currentSum = arr[0];
    int start = 0, end = 0, tempStart = 0;

    for (int i = 1; i < arr.length; i++) {
        if (arr[i] > currentSum + arr[i]) {
            currentSum = arr[i];
            tempStart = i;
        } else {
            currentSum += arr[i];
        }

        if (currentSum > maxSum) {
            maxSum = currentSum;
            start = tempStart;
            end = i;
        }
    }

    return new int[]{maxSum, start, end};
}

// TEST:
// kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]) → 6 (subarray: [4, -1, 2, 1])
// kadane([-1, -2, -3]) → -1 (all negative? pick least negative)
// kadane([5, -3, 5]) → 7 (entire array)
```

---

## Algorithm: Dutch National Flag (3-Way Partition) ⭐⭐

```java
/**
 * WHY: Sort array with only 3 distinct values in ONE pass
 * WHERE: Sorting 0s, 1s, 2s  |  Red, White, Blue balls
 *
 * REAL INCIDENT:
 *   Priority queue at hospital ER:
 *   Priority 0 (Critical) → front
 *   Priority 1 (Urgent) → middle
 *   Priority 2 (Normal) → end
 *   Need to sort patients in O(n) single pass
 *
 * HOW: Three pointers - low, mid, high
 *   - 0s go to low region
 *   - 1s stay in middle
 *   - 2s go to high region
 *
 * Time: O(n), Space: O(1)
 */
public static void dutchNationalFlag(int[] arr) {
    int low = 0, mid = 0, high = arr.length - 1;

    while (mid <= high) {
        switch (arr[mid]) {
            case 0:
                swap(arr, low, mid);
                low++;
                mid++;
                break;
            case 1:
                mid++;
                break;
            case 2:
                swap(arr, mid, high);
                high--;
                // Don't increment mid! New element needs checking
                break;
        }
    }
}

private static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

// TEST:
// [2,0,1,2,0,1,0] → [0,0,0,1,1,2,2]
// [0,0,0] → [0,0,0]
// [2,1,0] → [0,1,2]
```

---

## Algorithm: Boyer-Moore Voting (Majority Element) ⭐⭐

```java
/**
 * WHY: Find element that appears more than n/2 times
 * WHERE: Election vote counting, consensus in distributed systems
 *
 * REAL INCIDENT:
 *   Online poll with millions of votes
 *   Need to find winner (if exists) without storing all counts
 *   Memory constraint: Only O(1) extra space!
 *
 * HOW: Maintain candidate and count
 *   - Same as candidate → count++
 *   - Different → count--
 *   - Count reaches 0 → new candidate
 *
 * INTUITION: Majority element will "survive" all the cancellations
 *
 * Time: O(n), Space: O(1)
 */
public static int majorityElement(int[] nums) {
    int candidate = nums[0];
    int count = 1;

    // Phase 1: Find candidate
    for (int i = 1; i < nums.length; i++) {
        if (count == 0) {
            candidate = nums[i];
            count = 1;
        } else if (nums[i] == candidate) {
            count++;
        } else {
            count--;
        }
    }

    // Phase 2: Verify (optional, needed if majority not guaranteed)
    count = 0;
    for (int num : nums) {
        if (num == candidate) count++;
    }

    return count > nums.length / 2 ? candidate : -1;
}

// TEST:
// majorityElement([3, 2, 3]) → 3
// majorityElement([2, 2, 1, 1, 1, 2, 2]) → 2
// majorityElement([1, 2, 3]) → -1 (no majority)
```

---

## Algorithm: Tortoise and Hare (Cycle Detection) ⭐⭐

```java
/**
 * WHY: Detect cycles in linked lists or arrays
 * WHERE: Deadlock detection, finding duplicates, infinite loop detection
 *
 * REAL INCIDENT:
 *   Database had circular foreign key references
 *   A → B → C → A (cycle!)
 *   Floyd's algorithm detected it without extra memory
 *
 * HOW: Two pointers - slow (1 step) and fast (2 steps)
 *   If cycle exists, they WILL meet
 *   Finding start of cycle: Reset slow to head, both move 1 step
 *
 * Time: O(n), Space: O(1)
 */
public static boolean hasCycle(ListNode head) {
    if (head == null) return false;

    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) return true; // Cycle detected!
    }

    return false; // No cycle
}

// Find WHERE the cycle starts
public static ListNode findCycleStart(ListNode head) {
    ListNode slow = head, fast = head;

    // Phase 1: Detect cycle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) break;
    }

    if (fast == null || fast.next == null) return null; // No cycle

    // Phase 2: Find start
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }

    return slow; // Start of cycle
}

// Application: Find duplicate in array (no extra space)
// Array of n+1 elements, values 1 to n → at least one duplicate
public static int findDuplicate(int[] nums) {
    int slow = nums[0];
    int fast = nums[0];

    // Phase 1: Find meeting point
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);

    // Phase 2: Find duplicate
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }

    return slow;
}
```

---

## Algorithm: Monotonic Stack ⭐⭐

```java
/**
 * WHY: Find next greater/smaller element efficiently
 * WHERE: Stock price analysis, histogram problems, building skylines
 *
 * REAL INCIDENT:
 *   Weather app needed "next warmer day" feature
 *   Given daily temperatures, for each day find how many days
 *   until a warmer temperature
 *
 * HOW: Stack stores indices, maintain decreasing order
 *   When we find larger element, pop everything smaller
 *
 * Time: O(n), Space: O(n)
 */

// Next Greater Element
public static int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1); // Default: no greater element

    Stack<Integer> stack = new Stack<>(); // Stores indices

    for (int i = 0; i < n; i++) {
        // Pop elements smaller than current
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }

    return result;
}

// Daily Temperatures (days until warmer)
public static int[] dailyTemperatures(int[] temps) {
    int n = temps.length;
    int[] result = new int[n];

    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {
            int prevDay = stack.pop();
            result[prevDay] = i - prevDay; // Days until warmer
        }
        stack.push(i);
    }

    return result;
}

// Largest Rectangle in Histogram ⭐⭐⭐
public static int largestRectangleInHistogram(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;

    for (int i = 0; i <= heights.length; i++) {
        int currentHeight = (i == heights.length) ? 0 : heights[i];

        while (!stack.isEmpty() && currentHeight < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : (i - stack.peek() - 1);
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}

// TEST:
// nextGreaterElement([4, 5, 2, 10, 8]) → [5, 10, 10, -1, -1]
// dailyTemperatures([73,74,75,71,69,72,76,73]) → [1,1,4,2,1,1,0,0]
// largestRectangleInHistogram([2,1,5,6,2,3]) → 10
```

---

## Algorithm: Prefix Sum & Difference Array ⭐⭐

```java
/**
 * WHY: Answer range sum queries in O(1) after O(n) preprocessing
 * WHERE: Financial reports, analytics dashboards, image processing
 *
 * REAL INCIDENT:
 *   Flipkart analytics: "Total revenue between day 50 and day 100?"
 *   Without prefix sum: scan 50 entries every query
 *   With prefix sum: ONE subtraction!
 *
 * Time: Build O(n), Query O(1)
 */

// 1D Prefix Sum
public static long[] buildPrefixSum(int[] arr) {
    long[] prefix = new long[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

// Range sum query [left, right] inclusive
public static long rangeSum(long[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];
}

// 2D Prefix Sum (for matrix queries)
public static long[][] build2DPrefixSum(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    long[][] prefix = new long[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            prefix[i][j] = matrix[i-1][j-1]
                         + prefix[i-1][j]
                         + prefix[i][j-1]
                         - prefix[i-1][j-1];
        }
    }

    return prefix;
}

// Difference Array: Efficient range updates
// Add +val to all elements from index left to right
public static void rangeUpdate(int[] diff, int left, int right, int val) {
    diff[left] += val;
    if (right + 1 < diff.length) {
        diff[right + 1] -= val;
    }
}

// Convert difference array back to original
public static int[] reconstructFromDiff(int[] diff) {
    int[] result = new int[diff.length];
    result[0] = diff[0];
    for (int i = 1; i < diff.length; i++) {
        result[i] = result[i - 1] + diff[i];
    }
    return result;
}
```

---

# ═══════════════════════════════════════════════════════════

# PART 6: DATA STRUCTURE PROBLEMS WITH WHY-HOW

# ═══════════════════════════════════════════════════════════

## Stack Problems

### Problem S1: Valid Parentheses (THE classic stack problem)

```java
/**
 * WHY: Compilers use this to check code syntax
 * WHERE: IDE error highlighting, JSON/XML validation
 *
 * REAL INCIDENT:
 *   A production config file had mismatched braces
 *   System crashed at midnight. Stack-based validator
 *   was added to prevent deployment of bad configs.
 */
public static boolean isValidParentheses(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;

            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }

    return stack.isEmpty();
}

// TEST:
// isValidParentheses("()[]{}") → true
// isValidParentheses("([)]") → false
// isValidParentheses("{[]}") → true
```

### Problem S2: Min Stack (Stack that returns min in O(1))

```java
/**
 * WHY: Need to track minimum while supporting push/pop
 * WHERE: Real-time min price tracker, job scheduler priority
 *
 * TRICK: Store pairs (value, currentMin) or use two stacks
 */
class MinStack {
    private Stack<int[]> stack = new Stack<>(); // [value, currentMin]

    public void push(int val) {
        int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, min});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1]; // O(1)!
    }
}
```

---

## Queue & Deque Problems

### Problem Q1: Sliding Window Maximum ⭐⭐

```java
/**
 * WHY: Find maximum in every window of size k
 * WHERE: Stock market (max price in last k days), network monitoring
 *
 * REAL INCIDENT:
 *   Network monitoring: Alert if max latency in any 5-minute
 *   window exceeds 500ms. Need to compute this sliding max
 *   efficiently for millions of data points.
 *
 * DSA: Monotonic Deque
 * Time: O(n), Space: O(k)
 */
public static int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>(); // Stores indices

    for (int i = 0; i < n; i++) {
        // Remove elements outside current window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove elements smaller than current (they'll never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // Window is full, record result
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}

// TEST:
// maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3) → [3,3,5,5,6,7]
```

---

## HashMap Problems

### Problem H1: Two Sum (THE most asked question)

```java
/**
 * WHY: Foundation of many hash-based solutions
 * WHERE: Financial matching (find two transactions that sum to X)
 */
public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];

        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }

        map.put(nums[i], i);
    }

    return new int[]{-1, -1};
}
```

### Problem H2: Subarray Sum Equals K ⭐⭐

```java
/**
 * WHY: Count subarrays with given sum using prefix sum + hashmap
 * WHERE: Analytics - find all date ranges where revenue = target
 *
 * TRICK: If prefix[j] - prefix[i] = k, subarray (i, j] has sum k
 * So we need: prefix[j] - k = prefix[i]
 * Count how many prefix[i] values we've seen
 */
public static int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // Empty subarray

    int count = 0;
    int currentSum = 0;

    for (int num : nums) {
        currentSum += num;

        // How many prefix sums equal (currentSum - k)?
        count += prefixCount.getOrDefault(currentSum - k, 0);

        prefixCount.merge(currentSum, 1, Integer::sum);
    }

    return count;
}

// TEST:
// subarraySum([1, 1, 1], 2) → 2  (subarrays: [1,1], [1,1])
// subarraySum([1, 2, 3], 3) → 2  (subarrays: [1,2], [3])
```

### Problem H3: Longest Consecutive Sequence ⭐⭐

```java
/**
 * WHY: Find longest streak of consecutive numbers in O(n)
 * WHERE: Identify continuous time ranges in logs, find gaps in data
 *
 * REAL INCIDENT:
 *   Server log had timestamps. Needed to find longest period
 *   of continuous minute-by-minute data (no gaps).
 *
 * TRICK: Only start counting from sequence START (no num-1 in set)
 */
public static int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int num : nums) set.add(num);

    int maxLength = 0;

    for (int num : set) {
        // Only start counting if this is the START of a sequence
        if (!set.contains(num - 1)) {
            int current = num;
            int length = 1;

            while (set.contains(current + 1)) {
                current++;
                length++;
            }

            maxLength = Math.max(maxLength, length);
        }
    }

    return maxLength;
}

// TEST:
// longestConsecutive([100, 4, 200, 1, 3, 2]) → 4 (sequence: 1,2,3,4)
// longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]) → 9
```

---

## Tree Problems

### Problem T1: Lowest Common Ancestor ⭐⭐

```java
/**
 * WHY: Find common parent of two nodes
 * WHERE:
 *   - Organization chart: "Who supervises both person A and person B?"
 *   - File system: common parent directory
 *   - Git: merge base of two branches
 *
 * REAL INCIDENT:
 *   HR system needed to find lowest-level manager who oversees
 *   both Employee X and Employee Y for conflict resolution
 */
public static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    if (left != null && right != null) return root; // Split point = LCA
    return left != null ? left : right;
}
```

### Problem T2: Serialize/Deserialize Binary Tree ⭐⭐⭐

```java
/**
 * WHY: Convert tree to string and back
 * WHERE:
 *   - Send tree data over network (API responses)
 *   - Store tree in database
 *   - Cache tree structures in Redis
 *
 * REAL INCIDENT:
 *   Menu hierarchy stored as tree in DB. Needed to cache
 *   in Redis (string storage). Serialize tree → store →
 *   deserialize on read.
 */
public static String serialize(TreeNode root) {
    if (root == null) return "null";
    return root.val + "," + serialize(root.left) + "," + serialize(root.right);
}

public static TreeNode deserialize(String data) {
    Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
    return deserializeHelper(queue);
}

private static TreeNode deserializeHelper(Queue<String> queue) {
    String val = queue.poll();
    if ("null".equals(val)) return null;

    TreeNode node = new TreeNode(Integer.parseInt(val));
    node.left = deserializeHelper(queue);
    node.right = deserializeHelper(queue);
    return node;
}
```

---

# ═══════════════════════════════════════════════════════════

# PART 7: REAL-LIFE INCIDENT → DSA MAPPING TABLE

# ═══════════════════════════════════════════════════════════

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  THE TABLE EVERY DEVELOPER SHOULD MEMORIZE                                      ║
╚══════════════════════════════════════════════════════════════════════════════════╝

| Real Incident                           | DSA Used                    | Why That DSA               |
|----------------------------------------|-----------------------------|-----------------------------|
| Git merge conflicts                     | 3-way merge, LCA           | Find common ancestor       |
| Google Maps directions                  | Dijkstra, A*               | Shortest path in graph     |
| Instagram feed                          | Merge K Sorted Lists        | Combine sorted timelines   |
| Amazon "customers also bought"          | Collaborative filtering     | Matrix + HashMap           |
| Uber surge pricing                      | Demand/Supply ratio         | Math + Sliding window      |
| Bank fraud detection                    | Sliding window              | Time-based event counting  |
| WhatsApp message order                  | Sequence numbers + Queue    | Buffer + reorder           |
| Netflix "continue watching"             | LRU Cache                   | O(1) access + eviction     |
| Google autocomplete                     | Trie + Priority Queue       | Prefix search + ranking    |
| Twitter trending                        | Min Heap (Top K)            | Maintain top K efficiently |
| Splitwise settle debts                  | Greedy + Two Pointers       | Minimize transactions      |
| Hospital ER triage                      | Priority Queue              | Process by priority        |
| Database indexing                       | B+ Tree                     | Balanced search + range    |
| Redis cache eviction                    | LRU/LFU Cache               | Space management          |
| JWT token validation                    | Hash + Digital Signature    | Integrity verification     |
| Rate limiting APIs                      | Token Bucket / Sliding Win  | Throttle requests          |
| Load balancer                           | Consistent Hashing          | Distribute evenly          |
| Spell checker                           | Trie + Edit Distance        | Word lookup + similarity   |
| File compression (zip)                  | Huffman Coding              | Frequency-based encoding   |
| Undo/Redo in editors                    | Stack (two stacks)          | LIFO operations            |
| Browser back/forward                    | Stack                       | History management         |
| Task scheduler (OS)                     | Priority Queue + RR         | Fairness + priority        |
| Connection pooling                      | Queue (bounded)             | Reuse resources            |
| Garbage collection (Java)              | Graph traversal (BFS/DFS)   | Find unreachable objects   |
| DNS resolution                          | Caching + Trie              | Hierarchical lookup        |
| Forum thread nesting                    | Tree (N-ary)                | Parent-child hierarchy     |
| Excel formula dependency               | Topological Sort (DAG)      | Calculate in order         |
| MapReduce                               | Divide and Conquer          | Parallel processing        |
```

---

_This file is Part 1. See PART 8 (Study Plan) at the end of this guide_

---

# ═══════════════════════════════════════════════════════════

# PART 8: STUDY PLAN (Starting Feb 10, 2026)

# ═══════════════════════════════════════════════════════════

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  📅 GCD, PATTERNS & ALGORITHMS STUDY PLAN                                      ║
║  Start: February 10, 2026 (Tuesday)                                             ║
║  Duration: 4 Weeks                                                               ║
║  Daily Time: 3-4 hours                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

WEEK 1 (Feb 10-16): NUMBER THEORY + PATTERNS
─────────────────────────────────────────────
Day 1 (Mon Feb 10): GCD algorithms (all 4 versions)
  → Write each from scratch 3 times
  → Solve: Rectangle cutting, Water jug

Day 2 (Tue Feb 11): LCM + Prime checking
  → isPrime (brute + optimized)
  → Solve: Fraction simplify, Array GCD

Day 3 (Wed Feb 12): Sieve of Eratosthenes + Prime Factorization
  → Build sieve, Count primes to 1 million
  → Solve: Count divisors, Find all factors

Day 4 (Thu Feb 13): Modular Arithmetic
  → modPow, modInverse, nCr mod
  → Practice large number problems

Day 5 (Fri Feb 14): Pattern Programs Set 1
  → Patterns 1-6 (Triangles, Pyramid, Pascal's)
  → Focus on index relationships

Day 6 (Sat Feb 15): Pattern Programs Set 2
  → Patterns 7-12 (Diamond, Butterfly, Spiral, Zigzag)
  → Connect to matrix problems

Day 7 (Sun Feb 16): REVISION + Practice
  → Redo all GCD problems without looking
  → Redo 5 patterns from memory

WEEK 2 (Feb 17-23): ESSENTIAL ALGORITHMS
─────────────────────────────────────────
Day 8 (Mon Feb 17): Kadane's Algorithm
  → Basic + with indices
  → Solve 3 variants on LeetCode

Day 9 (Tue Feb 18): Dutch National Flag + Boyer-Moore
  → Sort colors, Majority element
  → Real-world: ER triage sorting

Day 10 (Wed Feb 19): Floyd's Cycle Detection
  → Linked list cycle, Find duplicate number
  → Understand mathematical proof

Day 11 (Thu Feb 20): Monotonic Stack
  → Next greater element, Daily temperatures
  → Largest rectangle in histogram

Day 12 (Fri Feb 21): Prefix Sum + Difference Array
  → 1D and 2D prefix sum
  → Range queries, Range updates

Day 13 (Sat Feb 22): Two Pointers Deep Dive
  → Two Sum, Container with most water
  → 3Sum, Trapping rain water

Day 14 (Sun Feb 23): REVISION + Practice
  → All 6 algorithms without looking
  → Solve 2 new problems per algorithm

WEEK 3 (Feb 24 - Mar 2): DATA STRUCTURE PROBLEMS
──────────────────────────────────────────────────
Day 15 (Mon Feb 24): Stack Problems
  → Valid parentheses, Min Stack
  → Evaluate Expression

Day 16 (Tue Feb 25): Queue + Deque Problems
  → Sliding Window Maximum
  → Design Circular Queue

Day 17 (Wed Feb 26): HashMap Problems
  → Two Sum, Subarray Sum = K
  → Longest Consecutive Sequence

Day 18 (Thu Feb 27): Tree Problems
  → LCA, Serialize/Deserialize
  → Level Order Traversal

Day 19 (Fri Feb 28): Heap / Priority Queue Problems
  → K Closest Points, Merge K Lists
  → Top K Frequent Elements

Day 20 (Sat Mar 1): Graph Problems
  → BFS, DFS, Topological Sort
  → Detect Cycle, Connected Components

Day 21 (Sun Mar 2): REVISION
  → One problem from each DS category
  → Time yourself (30 min per problem)

WEEK 4 (Mar 3-9): REAL-WORLD PROBLEMS + MOCK
─────────────────────────────────────────────
Day 22 (Mon Mar 3): E-commerce problems (Part 1)
Day 23 (Tue Mar 4): Banking + Finance problems
Day 24 (Wed Mar 5): Food Delivery + Social Media
Day 25 (Thu Mar 6): Streaming + Healthcare
Day 26 (Fri Mar 7): Travel + Logistics
Day 27 (Sat Mar 8): Payment + Gaming + Search
Day 28 (Sun Mar 9): FULL MOCK INTERVIEW
  → 4 problems, 2 hours, no help
  → Review and identify weak areas

═══════════════════════════════════════════════════════════════════════════════
DAILY ROUTINE (apply 6 learning techniques):
─────────────────────────────────────────────
1. QUESTION FIRST (5 min): Read problem, ask "what pattern is this?"
2. ACTIVE RECALL (45 min): Solve without looking at notes
3. BLURTING (10 min): Write everything you know about the topic
4. BREAK (15 min): 45-15 block
5. CODE (45 min): Implement solution, test
6. FEYNMAN (15 min): Explain solution to imaginary person
7. 2-3-7 REVIEW: Review yesterday's problems briefly
═══════════════════════════════════════════════════════════════════════════════
```

---

# CURATED PRACTICE PROBLEMS — NUMBER THEORY & MATH

> **HOW TO USE**: These problems apply GCD, primes, modular arithmetic, and combinatorics.
> Section 1 = fundamentals. Section 2 = medium applications. Section 3 = advanced/competitive.

---

## Section 1: GCD, LCM & Basic Math

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

## Section 2: Modular Arithmetic & Combinatorics

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

## Section 3: Advanced Math / Competitive

| #   | Problem                                          | Platform   | Difficulty | Key Technique                   |
| --- | ------------------------------------------------ | ---------- | ---------- | ------------------------------- |
| 1   | Fraction to Recurring Decimal (LC 166)           | LeetCode   | Medium     | Long division + cycle detection |
| 2   | Largest Component Size by Common Factor (LC 952) | LeetCode   | Hard       | Union-Find by prime factors     |
| 3   | Count Primes (Sieve variants)                    | Codeforces | Medium     | Segmented sieve, linear sieve   |
| 4   | Mirror Reflection (LC 858)                       | LeetCode   | Medium     | LCM to find which corner        |
| 5   | Broken Calculator (LC 991)                       | LeetCode   | Medium     | Work backwards (greedy + math)  |
| 6   | Reaching Points (LC 780)                         | LeetCode   | Hard       | Work backwards with modulo      |

---

## HIDDEN GEMS — Number Theory

| #   | Problem                                        | Platform | Why It's Valuable                   |
| --- | ---------------------------------------------- | -------- | ----------------------------------- |
| 1   | X of a Kind in a Deck of Cards (LC 914)        | LeetCode | GCD of all frequencies              |
| 2   | Bulb Switcher (LC 319)                         | LeetCode | Perfect squares insight — pure math |
| 3   | Minimum Moves to Equal Array Elements (LC 453) | LeetCode | sum - n\*min (math reduction)       |
| 4   | Valid Perfect Square (LC 367)                  | LeetCode | Binary search or 1+3+5+... series   |
| 5   | Distribute Candies to People (LC 1103)         | LeetCode | Simulation with modular index       |

---
