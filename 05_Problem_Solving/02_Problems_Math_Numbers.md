> **Problems 02/14** | [Prev](01_Problems_Intro_Checklist.md) | [Index](../00_MASTER_INDEX.md) | [Next](03_Problems_Strings.md)

---

# SECTION 1: BASIC MATH & NUMBER PROBLEMS

---

## 1.1 PRIME NUMBER PROBLEMS

### Problem: Check if Prime

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CHECK IF A NUMBER IS PRIME                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  A prime number is a natural number greater than 1 that has no positive   ║
║  divisors other than 1 and itself.                                        ║
║                                                                           ║
║  Examples:                                                                ║
║  - 2, 3, 5, 7, 11, 13, 17, 19, 23, 29... are prime                        ║
║  - 4 (2×2), 6 (2×3), 8, 9, 10... are NOT prime                            ║
║                                                                           ║
║  Input: n = 17                                                            ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: n = 15                                                            ║
║  Output: false (15 = 3 × 5)                                               ║
║                                                                           ║
║  Optimization: Only check till √n                                         ║
║  Why? If n = a × b and a ≤ √n, then b ≥ √n                                ║
║  So if no divisor exists till √n, none exists after                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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

### Problem: Count Primes

**LeetCode 204** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/count-primes/](https://leetcode.com/problems/count-primes/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  COUNT PRIMES                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count the number of prime numbers less than n.                          ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 4                                                                ║
║  Explanation: Primes less than 10 are 2, 3, 5, 7                         ║
║                                                                           ║
║  Input: n = 0                                                             ║
║  Output: 0                                                                ║
║                                                                           ║
║  Use: SIEVE OF ERATOSTHENES                                               ║
║                                                                           ║
║  Visual for n=30:                                                         ║
║  2  3  4  5  6  7  8  9  10 11 12 13 14 15...                            ║
║  ✓  ✓  ✗  ✓  ✗  ✓  ✗  ✗  ✗  ✓  ✗  ✓  ✗  ✗                             ║
║     Mark all multiples of 2 as non-prime                                 ║
║     Mark all multiples of 3 as non-prime                                 ║
║     ... continue till √n                                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem: Nth Prime Number

**Difficulty:** Medium | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND THE NTH PRIME NUMBER                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given n, find the nth prime number.                                     ║
║                                                                           ║
║  Input: n = 1                                                             ║
║  Output: 2 (1st prime)                                                    ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 11 (5th prime: 2, 3, 5, 7, 11)                                  ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 29 (10th prime)                                                  ║
║                                                                           ║
║  Input: n = 100                                                           ║
║  Output: 541 (100th prime)                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem: Previous and Next Prime

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND PREVIOUS AND NEXT PRIME                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number n, find the nearest prime less than n (previous prime)   ║
║  and nearest prime greater than n (next prime).                          ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: Previous = 7, Next = 11                                         ║
║                                                                           ║
║  Input: n = 14                                                            ║
║  Output: Previous = 13, Next = 17                                        ║
║                                                                           ║
║  Input: n = 7 (n is prime)                                                ║
║  Output: Previous = 5, Next = 11                                         ║
║                                                                           ║
║  Edge case: n = 2                                                         ║
║  Output: Previous = -1 (no prime before 2), Next = 3                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### Problem: Prime Factors

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL PRIME FACTORS                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number n, find all its prime factors.                           ║
║                                                                           ║
║  Input: n = 12                                                            ║
║  Output: [2, 2, 3]                                                        ║
║  Explanation: 12 = 2 × 2 × 3                                             ║
║                                                                           ║
║  Input: n = 100                                                           ║
║  Output: [2, 2, 5, 5]                                                     ║
║  Explanation: 100 = 2 × 2 × 5 × 5                                        ║
║                                                                           ║
║  Input: n = 315                                                           ║
║  Output: [3, 3, 5, 7]                                                     ║
║  Explanation: 315 = 3 × 3 × 5 × 7                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

### 🔒 PREMIUM: Closest Prime Numbers in Range

**LeetCode 2523** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CLOSEST PRIME NUMBERS IN RANGE                                           ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given two positive integers left and right, find the two integers num1  ║
║  and num2 such that:                                                      ║
║  - left <= num1 < num2 <= right                                          ║
║  - Both num1 and num2 are prime numbers                                   ║
║  - num2 - num1 is the minimum amongst all other pairs                    ║
║                                                                           ║
║  Return the positive integer array [num1, num2]. If there are multiple   ║
║  pairs with the minimum gap, return the one with smallest num1. If no    ║
║  such pair exists, return [-1, -1].                                      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: left = 10, right = 19                                            ║
║  Output: [11, 13]                                                         ║
║  Explanation:                                                             ║
║  Primes in range: 11, 13, 17, 19                                         ║
║  Differences: 13-11=2, 17-13=4, 19-17=2                                  ║
║  Minimum difference is 2. Pairs: (11,13) and (17,19)                     ║
║  Return (11,13) as it has smaller num1.                                  ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: left = 4, right = 6                                              ║
║  Output: [-1, -1]                                                         ║
║  Explanation: Only one prime (5) in range, need at least 2.              ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: left = 1, right = 1000000                                        ║
║  Output: [2, 3]                                                           ║
║  Explanation: Twin primes (difference = 1 only for 2,3)                  ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= left <= right <= 10^6                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## 1.2 FIBONACCI PROBLEMS

### Problem: Nth Fibonacci Number

**Difficulty:** Easy | **Category:** Basic Math / DP

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  NTH FIBONACCI NUMBER                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Fibonacci Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...               ║
║  F(0) = 0, F(1) = 1                                                       ║
║  F(n) = F(n-1) + F(n-2) for n > 1                                        ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 3                                                                ║
║  Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3                             ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 55                                                               ║
║                                                                           ║
║  Visual:                                                                  ║
║  Index:  0  1  2  3  4  5  6  7   8   9   10                             ║
║  Value:  0  1  1  2  3  5  8  13  21  34  55                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**LeetCode 509** | 🔗 [https://leetcode.com/problems/fibonacci-number/](https://leetcode.com/problems/fibonacci-number/)

```java
// Method 1: Iterative - O(n) time, O(1) space
public int fib(int n) {
    if (n <= 1) return n;

    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Method 2: Recursive with Memoization - O(n) time, O(n) space
public int fibMemo(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);
    return fibHelper(n, memo);
}

private int fibHelper(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    memo[n] = fibHelper(n - 1, memo) + fibHelper(n - 2, memo);
    return memo[n];
}

// Method 3: Matrix Exponentiation - O(log n) time
// For very large n
```

---

### Problem: Fibonacci Variants - Sum of First N Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUM OF FIRST N FIBONACCI NUMBERS                                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the sum of first n Fibonacci numbers.                              ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 7                                                                ║
║  Explanation: F(0)+F(1)+F(2)+F(3)+F(4) = 0+1+1+2+3 = 7                   ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 88                                                               ║
║  Explanation: 0+1+1+2+3+5+8+13+21+34 = 88                                ║
║                                                                           ║
║  FORMULA: Sum of first n Fib = F(n+2) - 1                                ║
║  Proof: F(0) + F(1) + ... + F(n) = F(n+2) - 1                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Method 1: Iterative Sum
public int sumFibonacci(int n) {
    if (n <= 0) return 0;

    int sum = 0;
    int prev2 = 0, prev1 = 1;
    sum = prev2;  // F(0)

    for (int i = 1; i <= n; i++) {
        sum += prev1;
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return sum;
}

// Method 2: Using Formula - O(n) but cleaner
public int sumFibonacciFormula(int n) {
    // Sum = F(n+2) - 1
    return fib(n + 2) - 1;
}
```

---

### Problem: Check if Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CHECK IF NUMBER IS A FIBONACCI NUMBER                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number, check if it belongs to Fibonacci sequence.              ║
║                                                                           ║
║  Input: n = 8                                                             ║
║  Output: true (8 is F(6))                                                ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: false                                                            ║
║                                                                           ║
║  PROPERTY: A number is Fibonacci if and only if one of                   ║
║  (5*n² + 4) or (5*n² - 4) is a perfect square.                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isFibonacci(int n) {
    return isPerfectSquare(5 * n * n + 4) ||
           isPerfectSquare(5 * n * n - 4);
}

private boolean isPerfectSquare(long n) {
    long sqrt = (long) Math.sqrt(n);
    return sqrt * sqrt == n;
}

// Alternative: Generate Fibonacci until we find or pass n
public boolean isFibonacciIterative(int n) {
    if (n == 0 || n == 1) return true;

    int a = 0, b = 1;
    while (b < n) {
        int temp = b;
        b = a + b;
        a = temp;
    }
    return b == n;
}
```

---

### Problem: Fibonacci - Tribonacci Number

**LeetCode 1137** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/n-th-tribonacci-number/](https://leetcode.com/problems/n-th-tribonacci-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  N-TH TRIBONACCI NUMBER                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tribonacci: T(n) = T(n-1) + T(n-2) + T(n-3)                             ║
║  T(0) = 0, T(1) = 1, T(2) = 1                                            ║
║                                                                           ║
║  Sequence: 0, 1, 1, 2, 4, 7, 13, 24, 44, 81, ...                        ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 4                                                                ║
║  Explanation: T(4) = T(3) + T(2) + T(1) = 2 + 1 + 1 = 4                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int tribonacci(int n) {
    if (n == 0) return 0;
    if (n <= 2) return 1;

    int t0 = 0, t1 = 1, t2 = 1;
    for (int i = 3; i <= n; i++) {
        int curr = t0 + t1 + t2;
        t0 = t1;
        t1 = t2;
        t2 = curr;
    }
    return t2;
}
```

---

### Problem: Climbing Stairs (Fibonacci Application)

**LeetCode 70** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/climbing-stairs/](https://leetcode.com/problems/climbing-stairs/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CLIMBING STAIRS                                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You can climb 1 or 2 steps at a time.                                   ║
║  How many distinct ways to climb n stairs?                               ║
║                                                                           ║
║  Input: n = 3                                                             ║
║  Output: 3                                                                ║
║  Ways: [1,1,1], [1,2], [2,1]                                             ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 8                                                                ║
║                                                                           ║
║  PATTERN: ways(n) = ways(n-1) + ways(n-2) = Fibonacci!                   ║
║  n=1: 1 way                                                               ║
║  n=2: 2 ways                                                              ║
║  n=3: 3 ways                                                              ║
║  n=4: 5 ways                                                              ║
║  n=5: 8 ways                                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int climbStairs(int n) {
    if (n <= 2) return n;

    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

---

## 1.3 DIGIT MANIPULATION PROBLEMS

### Problem: Sum of Digits

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUM OF DIGITS                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the sum of all digits of a given number.                           ║
║                                                                           ║
║  Input: n = 12345                                                         ║
║  Output: 15                                                               ║
║  Explanation: 1 + 2 + 3 + 4 + 5 = 15                                     ║
║                                                                           ║
║  Input: n = 9999                                                          ║
║  Output: 36                                                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int sumOfDigits(int n) {
    int sum = 0;
    n = Math.abs(n);  // Handle negative
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

// Recursive version
public int sumOfDigitsRecursive(int n) {
    if (n == 0) return 0;
    return (n % 10) + sumOfDigitsRecursive(n / 10);
}
```

---

### Problem: Add Digits (Digital Root)

**LeetCode 258** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/add-digits/](https://leetcode.com/problems/add-digits/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  ADD DIGITS (DIGITAL ROOT)                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Repeatedly add digits until single digit remains.                       ║
║                                                                           ║
║  Input: num = 38                                                          ║
║  Output: 2                                                                ║
║  Explanation: 3 + 8 = 11, 1 + 1 = 2                                      ║
║                                                                           ║
║  Input: num = 9999                                                        ║
║  Output: 9                                                                ║
║  Explanation: 36 → 9                                                      ║
║                                                                           ║
║  FORMULA: Digital Root = 1 + (num - 1) % 9  (for num > 0)                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// O(1) solution using formula
public int addDigits(int num) {
    if (num == 0) return 0;
    return 1 + (num - 1) % 9;
}

// Iterative solution
public int addDigitsIterative(int num) {
    while (num >= 10) {
        int sum = 0;
        while (num > 0) {
            sum += num % 10;
            num /= 10;
        }
        num = sum;
    }
    return num;
}
```

---

### Problem: Reverse Integer

**LeetCode 7** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/reverse-integer/](https://leetcode.com/problems/reverse-integer/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REVERSE INTEGER                                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Reverse digits of a 32-bit signed integer.                              ║
║  Return 0 if result overflows.                                           ║
║                                                                           ║
║  Input: x = 123                                                           ║
║  Output: 321                                                              ║
║                                                                           ║
║  Input: x = -123                                                          ║
║  Output: -321                                                             ║
║                                                                           ║
║  Input: x = 1534236469                                                    ║
║  Output: 0 (overflow when reversed)                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int reverse(int x) {
    int result = 0;

    while (x != 0) {
        int digit = x % 10;
        x /= 10;

        // Check overflow before adding
        if (result > Integer.MAX_VALUE / 10 ||
            (result == Integer.MAX_VALUE / 10 && digit > 7)) {
            return 0;
        }
        if (result < Integer.MIN_VALUE / 10 ||
            (result == Integer.MIN_VALUE / 10 && digit < -8)) {
            return 0;
        }

        result = result * 10 + digit;
    }
    return result;
}
```

---

### Problem: Palindrome Number

**LeetCode 9** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/palindrome-number/](https://leetcode.com/problems/palindrome-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PALINDROME NUMBER                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if integer is palindrome (reads same forwards and backwards).     ║
║                                                                           ║
║  Input: x = 121                                                           ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: x = -121                                                          ║
║  Output: false (reads as 121-)                                            ║
║                                                                           ║
║  Input: x = 10                                                            ║
║  Output: false (reads as 01)                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isPalindrome(int x) {
    // Negative or ends with 0 (except 0 itself)
    if (x < 0 || (x % 10 == 0 && x != 0)) {
        return false;
    }

    // Reverse half the number
    int reversed = 0;
    while (x > reversed) {
        reversed = reversed * 10 + x % 10;
        x /= 10;
    }

    // For even digits: x == reversed
    // For odd digits: x == reversed / 10
    return x == reversed || x == reversed / 10;
}
```

---

### Problem: Happy Number

**LeetCode 202** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/happy-number/](https://leetcode.com/problems/happy-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  HAPPY NUMBER                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Starting with any positive integer, replace the number by the sum of    ║
║  the squares of its digits. Repeat until it equals 1 (happy), or loops   ║
║  endlessly in a cycle (not happy).                                       ║
║                                                                           ║
║  Input: n = 19                                                            ║
║  Output: true                                                             ║
║  Explanation:                                                             ║
║  1² + 9² = 82                                                            ║
║  8² + 2² = 68                                                            ║
║  6² + 8² = 100                                                           ║
║  1² + 0² + 0² = 1 ✓                                                      ║
║                                                                           ║
║  Input: n = 2                                                             ║
║  Output: false (enters cycle)                                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Floyd's Cycle Detection
public boolean isHappy(int n) {
    int slow = n, fast = n;

    do {
        slow = sumSquareDigits(slow);
        fast = sumSquareDigits(sumSquareDigits(fast));
    } while (slow != fast);

    return slow == 1;
}

private int sumSquareDigits(int n) {
    int sum = 0;
    while (n > 0) {
        int digit = n % 10;
        sum += digit * digit;
        n /= 10;
    }
    return sum;
}
```

---

## 1.4 GCD & LCM PROBLEMS

### Problem: GCD (Greatest Common Divisor)

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  GCD - GREATEST COMMON DIVISOR                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the largest number that divides both a and b.                      ║
║                                                                           ║
║  Input: a = 48, b = 18                                                    ║
║  Output: 6                                                                ║
║  Explanation: Divisors of 48: 1,2,3,4,6,8,12,16,24,48                    ║
║               Divisors of 18: 1,2,3,6,9,18                               ║
║               Common: 1,2,3,6 → GCD = 6                                   ║
║                                                                           ║
║  EUCLIDEAN ALGORITHM:                                                     ║
║  GCD(a, b) = GCD(b, a % b)                                               ║
║  GCD(a, 0) = a                                                           ║
║                                                                           ║
║  48, 18 → 18, 12 → 12, 6 → 6, 0 → GCD = 6                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Euclidean Algorithm - O(log(min(a,b)))
public int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Recursive version
public int gcdRecursive(int a, int b) {
    if (b == 0) return a;
    return gcdRecursive(b, a % b);
}

// LCM using GCD: LCM(a,b) = (a * b) / GCD(a,b)
public int lcm(int a, int b) {
    return (a / gcd(a, b)) * b;  // Avoid overflow
}
```

---

### 🔒 PREMIUM: Find GCD of Array

**LeetCode 1979** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND GREATEST COMMON DIVISOR OF ARRAY                                    ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer array nums, return the greatest common divisor of the  ║
║  smallest number and largest number in nums.                              ║
║                                                                           ║
║  The GCD of two numbers is the largest positive integer that evenly      ║
║  divides both numbers.                                                    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [2, 5, 6, 9, 10]                                          ║
║  Output: 2                                                                ║
║  Explanation:                                                             ║
║  Smallest = 2, Largest = 10                                              ║
║  GCD(2, 10) = 2                                                          ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [7, 5, 6, 8, 3]                                           ║
║  Output: 1                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 8                                               ║
║  GCD(3, 8) = 1                                                           ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [3, 3]                                                     ║
║  Output: 3                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 3                                               ║
║  GCD(3, 3) = 3                                                           ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 2 <= nums.length <= 1000                                              ║
║  - 1 <= nums[i] <= 1000                                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int findGCD(int[] nums) {
    int min = Integer.MAX_VALUE;
    int max = Integer.MIN_VALUE;

    for (int num : nums) {
        min = Math.min(min, num);
        max = Math.max(max, num);
    }

    return gcd(min, max);
}

private int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
```

---

