# 🧩 1.4 GCD & Lcm Problems

> **Navigation**: [← 1.3 Digit Manipulation Problems](03_digit_manipulation_problems.md) | [Chapter overview](../02_Math_Numbers.md)
> Page 4 of 4 in **Section 1: Basic Math & Number Problems**


## Problem: GCD (Greatest Common Divisor)

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  GCD - GREATEST COMMON DIVISOR                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the largest number that divides both a and b.                       ║
║                                                                           ║
║  Input: a = 48, b = 18                                                    ║
║  Output: 6                                                                ║
║  Explanation: Divisors of 48: 1,2,3,4,6,8,12,16,24,48                     ║
║               Divisors of 18: 1,2,3,6,9,18                                ║
║               Common: 1,2,3,6 → GCD = 6                                   ║
║                                                                           ║
║  EUCLIDEAN ALGORITHM:                                                     ║
║  GCD(a, b) = GCD(b, a % b)                                                ║
║  GCD(a, 0) = a                                                            ║
║                                                                           ║
║  48, 18 → 18, 12 → 12, 6 → 6, 0 → GCD = 6                                 ║
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

## 🔒 PREMIUM: Find GCD of Array

**LeetCode 1979** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND GREATEST COMMON DIVISOR OF ARRAY                                    ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer array nums, return the greatest common divisor of the   ║
║  smallest number and largest number in nums.                              ║
║                                                                           ║
║  The GCD of two numbers is the largest positive integer that evenly       ║
║  divides both numbers.                                                    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [2, 5, 6, 9, 10]                                           ║
║  Output: 2                                                                ║
║  Explanation:                                                             ║
║  Smallest = 2, Largest = 10                                               ║
║  GCD(2, 10) = 2                                                           ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [7, 5, 6, 8, 3]                                            ║
║  Output: 1                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 8                                                ║
║  GCD(3, 8) = 1                                                            ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [3, 3]                                                     ║
║  Output: 3                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 3                                                ║
║  GCD(3, 3) = 3                                                            ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 2 <= nums.length <= 1000                                               ║
║  - 1 <= nums[i] <= 1000                                                   ║
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


---

## Production Reality

**Math & Number** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Integer overflow in arithmetic sequences.** Computing `n * (n + 1) / 2` for triangular sums causes overflow when n > 65535 in 32-bit signed int. For n=100000, `100000 * 100001 = 10000100000` exceeds Integer.MAX_VALUE (2.1 billion), wrapping to negative values in Java. LeetCode 829 (Consecutive Numbers Sum) fails silently with wrong answers. In banking systems calculating compound interest over many periods, overflow causes incorrect principal calculations. Illustrative impact: financial discrepancies, audit failures, regulatory compliance violations.

**Failure mode 2: Division by zero in GCD/Euclidean algorithm.** When implementing `gcd(a, b)` recursively, calling with b=0 causes division by zero at `a % b`. This occurs in production when finding GCD of array minimums that could include 0 (e.g., sensor readings with 0 values). LeetCode 1979 (Find GCD of Array) crashes on input `[0, 0]`. Illustrative impact: application crash, 500 error in API, data pipeline failure if GCD is used in safety-critical denominator calculations.

**Failure mode 3: Modulo with negative numbers.** Java's `%` operator returns negative remainders for negative dividends: `-7 % 3 = -1` (not 2). This breaks hash table implementations using `(key % tableSize)` for negative keys, causing out-of-bounds array access when converting negative index to positive bucket. Illustrative impact: IndexOutOfBoundsException, security vulnerability if negative indices bypass access controls, silent data corruption.

**Debug workflow:** 1. Use `long` for all arithmetic that might exceed int range (Integer.MAX_VALUE is ~2.1B). 2. Check GCD base case: `if (b == 0) return a` before modulus operation. 3. Normalize modulo: `(x % n + n) % n` ensures non-negative result. 4. Test with boundary values: 0, 1, -1, Integer.MAX_VALUE, Integer.MIN_VALUE. 5. Use `assert` statements at known safe boundaries.

**Real-world anchor:** Ariane 5 Flight 501 (1996, a loss of roughly US$370 million) failed after a 64-bit floating-point value (horizontal bias) was converted to a 16-bit signed integer and overflowed; the unhandled exception shut down the inertial reference system. It is the textbook example of an unchecked numeric conversion — the same failure mode as `n*(n+1)/2` overflowing an `int`.

---

[← 1.3 Digit Manipulation Problems](03_digit_manipulation_problems.md) | [Chapter overview](../02_Math_Numbers.md)
