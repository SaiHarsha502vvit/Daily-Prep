# 🧩 1.2 Fibonacci Problems

> **Navigation**: [← 1.1 Prime Number Problems](01_prime_number_problems.md) | [Chapter overview](../02_Math_Numbers.md) | [1.3 Digit Manipulation Problems →](03_digit_manipulation_problems.md)
> Page 2 of 4 in **Section 1: Basic Math & Number Problems**


## Problem: Nth Fibonacci Number

**Difficulty:** Easy | **Category:** Basic Math / DP

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  NTH FIBONACCI NUMBER                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Fibonacci Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...                 ║
║  F(0) = 0, F(1) = 1                                                       ║
║  F(n) = F(n-1) + F(n-2) for n > 1                                         ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 3                                                                ║
║  Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3                              ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 55                                                               ║
║                                                                           ║
║  Visual:                                                                  ║
║  Index:  0  1  2  3  4  5  6  7   8   9   10                              ║
║  Value:  0  1  1  2  3  5  8  13  21  34  55                              ║
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

## Problem: Fibonacci Variants - Sum of First N Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUM OF FIRST N FIBONACCI NUMBERS                                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the sum of first n Fibonacci numbers.                               ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 7                                                                ║
║  Explanation: F(0)+F(1)+F(2)+F(3)+F(4) = 0+1+1+2+3 = 7                    ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 88                                                               ║
║  Explanation: 0+1+1+2+3+5+8+13+21+34 = 88                                 ║
║                                                                           ║
║  FORMULA: Sum of first n Fib = F(n+2) - 1                                 ║
║  Proof: F(0) + F(1) + ... + F(n) = F(n+2) - 1                             ║
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

## Problem: Check if Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CHECK IF NUMBER IS A FIBONACCI NUMBER                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number, check if it belongs to Fibonacci sequence.               ║
║                                                                           ║
║  Input: n = 8                                                             ║
║  Output: true (8 is F(6))                                                 ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: false                                                            ║
║                                                                           ║
║  PROPERTY: A number is Fibonacci if and only if one of                    ║
║  (5*n² + 4) or (5*n² - 4) is a perfect square.                            ║
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

## Problem: Fibonacci - Tribonacci Number

**LeetCode 1137** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/n-th-tribonacci-number/](https://leetcode.com/problems/n-th-tribonacci-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  N-TH TRIBONACCI NUMBER                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tribonacci: T(n) = T(n-1) + T(n-2) + T(n-3)                              ║
║  T(0) = 0, T(1) = 1, T(2) = 1                                             ║
║                                                                           ║
║  Sequence: 0, 1, 1, 2, 4, 7, 13, 24, 44, 81, ...                          ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 4                                                                ║
║  Explanation: T(4) = T(3) + T(2) + T(1) = 2 + 1 + 1 = 4                   ║
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

## Problem: Climbing Stairs (Fibonacci Application)

**LeetCode 70** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/climbing-stairs/](https://leetcode.com/problems/climbing-stairs/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CLIMBING STAIRS                                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You can climb 1 or 2 steps at a time.                                    ║
║  How many distinct ways to climb n stairs?                                ║
║                                                                           ║
║  Input: n = 3                                                             ║
║  Output: 3                                                                ║
║  Ways: [1,1,1], [1,2], [2,1]                                              ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 8                                                                ║
║                                                                           ║
║  PATTERN: ways(n) = ways(n-1) + ways(n-2) = Fibonacci!                    ║
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

[← 1.1 Prime Number Problems](01_prime_number_problems.md) | [Chapter overview](../02_Math_Numbers.md) | [1.3 Digit Manipulation Problems →](03_digit_manipulation_problems.md)
