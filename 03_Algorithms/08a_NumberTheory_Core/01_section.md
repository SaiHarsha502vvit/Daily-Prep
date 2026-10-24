# Part 1 — GCD (Greatest Common Divisor)

> **Navigation**: [Chapter overview](../08a_NumberTheory_Core.md) | [Part 2 — Prime Numbers →](02_section.md)
> Page 1 of 3 in **GCD, Number Theory & Pattern Programs - Complete Guide**


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

[Chapter overview](../08a_NumberTheory_Core.md) | [Part 2 — Prime Numbers →](02_section.md)
