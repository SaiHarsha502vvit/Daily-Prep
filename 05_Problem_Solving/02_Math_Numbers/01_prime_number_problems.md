# 🧩 1.1 Prime Number Problems

> **Navigation**: [Chapter overview](../02_Math_Numbers.md) | [1.2 Fibonacci Problems →](02_fibonacci_problems.md)
> Page 1 of 4 in **Section 1: Basic Math & Number Problems**


## Problem: Check if Prime

**Difficulty:** Easy | **Category:** Basic Math

> CHECK IF A NUMBER IS PRIME
>
> A prime number is a natural number greater than 1 that has no positive
> divisors other than 1 and itself.
>
> Examples:
>
> - 2, 3, 5, 7, 11, 13, 17, 19, 23, 29... are prime
> - 4 (2×2), 6 (2×3), 8, 9, 10... are NOT prime
>
> Input: n = 17
> Output: true
>
> Input: n = 15
> Output: false (15 = 3 × 5)
>
> Optimization: Only check till √n
> Why? If n = a × b and a ≤ √n, then b ≥ √n
> So if no divisor exists till √n, none exists after

```java
// SOLUTION - OPTIMAL O(√n)
public boolean isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    // Check from 5 to √n, skip multiples of 2 and 3
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return false;
        }
    }
    return true;
}
```

---

## Problem: Count Primes

**LeetCode 204** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/count-primes/](https://leetcode.com/problems/count-primes/)

**COUNT PRIMES**

```text
Count the number of prime numbers less than n.

Input: n = 10
Output: 4
Explanation: Primes less than 10 are 2, 3, 5, 7

Input: n = 0
Output: 0

Use: SIEVE OF ERATOSTHENES

Visual for n=30:
2  3  4  5  6  7  8  9  10 11 12 13 14 15...
✓  ✓  ✗  ✓  ✗  ✓  ✗  ✗  ✗  ✓  ✗  ✓  ✗  ✗
   Mark all multiples of 2 as non-prime
   Mark all multiples of 3 as non-prime
   ... continue till √n
```

```java
// SIEVE OF ERATOSTHENES - O(n log log n)
public int countPrimes(int n) {
    if (n <= 2) return 0;

    boolean[] notPrime = new boolean[n];
    int count = 0;

    for (int i = 2; i < n; i++) {
        if (!notPrime[i]) {
            count++;
            // Mark all multiples as not prime
            for (long j = (long) i * i; j < n; j += i) {
                notPrime[(int) j] = true;
            }
        }
    }
    return count;
}
```

---

## Problem: Nth Prime Number

**Difficulty:** Medium | **Category:** Basic Math

**FIND THE NTH PRIME NUMBER**

```text
Given n, find the nth prime number.

Input: n = 1
Output: 2 (1st prime)

Input: n = 5
Output: 11 (5th prime: 2, 3, 5, 7, 11)

Input: n = 10
Output: 29 (10th prime)

Input: n = 100
Output: 541 (100th prime)
```

```java
public int nthPrime(int n) {
    if (n == 1) return 2;

    int count = 1;  // We already counted 2
    int num = 1;    // Start checking from 3 (odd numbers)

    while (count < n) {
        num += 2;   // Check only odd numbers
        if (isPrime(num)) {
            count++;
        }
    }
    return num;
}

private boolean isPrime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}
```

---

## Problem: Previous and Next Prime

**Difficulty:** Easy | **Category:** Basic Math

**FIND PREVIOUS AND NEXT PRIME**

```text
Given a number n, find the nearest prime less than n (previous prime)
and nearest prime greater than n (next prime).

Input: n = 10
Output: Previous = 7, Next = 11

Input: n = 14
Output: Previous = 13, Next = 17

Input: n = 7 (n is prime)
Output: Previous = 5, Next = 11

Edge case: n = 2
Output: Previous = -1 (no prime before 2), Next = 3
```

```java
public int[] previousAndNextPrime(int n) {
    int[] result = new int[2];

    // Find previous prime
    result[0] = findPreviousPrime(n);

    // Find next prime
    result[1] = findNextPrime(n);

    return result;
}

private int findPreviousPrime(int n) {
    for (int i = n - 1; i >= 2; i--) {
        if (isPrime(i)) return i;
    }
    return -1;  // No prime before 2
}

private int findNextPrime(int n) {
    int candidate = n + 1;
    while (true) {
        if (isPrime(candidate)) return candidate;
        candidate++;
    }
}
```

---

## Problem: Prime Factors

**Difficulty:** Easy | **Category:** Basic Math

**FIND ALL PRIME FACTORS**

```text
Given a number n, find all its prime factors.

Input: n = 12
Output: [2, 2, 3]
Explanation: 12 = 2 × 2 × 3

Input: n = 100
Output: [2, 2, 5, 5]
Explanation: 100 = 2 × 2 × 5 × 5

Input: n = 315
Output: [3, 3, 5, 7]
Explanation: 315 = 3 × 3 × 5 × 7
```

```java
public List<Integer> primeFactors(int n) {
    List<Integer> factors = new ArrayList<>();

    // Divide by 2 until odd
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

    // If n is still > 1, it's a prime factor
    if (n > 1) {
        factors.add(n);
    }

    return factors;
}
```

---

## 🔒 PREMIUM: Closest Prime Numbers in Range

**LeetCode 2523** | **Difficulty:** Medium | **Premium Problem**

**CLOSEST PRIME NUMBERS IN RANGE — (LeetCode Premium - Full Problem Description)**

```text
Given two positive integers left and right, find the two integers num1
and num2 such that:
- left <= num1 < num2 <= right
- Both num1 and num2 are prime numbers
- num2 - num1 is the minimum amongst all other pairs

Return the positive integer array [num1, num2]. If there are multiple
pairs with the minimum gap, return the one with smallest num1. If no
such pair exists, return [-1, -1].

─────────────────────────────────────────────────────────────────────

Example 1:
Input: left = 10, right = 19
Output: [11, 13]
Explanation:
Primes in range: 11, 13, 17, 19
Differences: 13-11=2, 17-13=4, 19-17=2
Minimum difference is 2. Pairs: (11,13) and (17,19)
Return (11,13) as it has smaller num1.

Example 2:
Input: left = 4, right = 6
Output: [-1, -1]
Explanation: Only one prime (5) in range, need at least 2.

Example 3:
Input: left = 1, right = 1000000
Output: [2, 3]
Explanation: Twin primes (difference = 1 only for 2,3)

─────────────────────────────────────────────────────────────────────

Constraints:
- 1 <= left <= right <= 10^6
```

```java
public int[] closestPrimes(int left, int right) {
    // Generate all primes in range using Sieve
    List<Integer> primes = new ArrayList<>();
    boolean[] notPrime = new boolean[right + 1];

    for (int i = 2; i <= right; i++) {
        if (!notPrime[i]) {
            if (i >= left) primes.add(i);
            for (long j = (long) i * i; j <= right; j += i) {
                notPrime[(int) j] = true;
            }
        }
    }

    if (primes.size() < 2) return new int[]{-1, -1};

    int minDiff = Integer.MAX_VALUE;
    int[] result = {-1, -1};

    for (int i = 1; i < primes.size(); i++) {
        int diff = primes.get(i) - primes.get(i - 1);
        if (diff < minDiff) {
            minDiff = diff;
            result[0] = primes.get(i - 1);
            result[1] = primes.get(i);
        }
    }

    return result;
}
```

---

[Chapter overview](../02_Math_Numbers.md) | [1.2 Fibonacci Problems →](02_fibonacci_problems.md)
