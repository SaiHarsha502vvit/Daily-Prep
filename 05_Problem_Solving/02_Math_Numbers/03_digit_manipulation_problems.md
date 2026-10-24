# 🧩 1.3 Digit Manipulation Problems

> **Navigation**: [← 1.2 Fibonacci Problems](02_fibonacci_problems.md) | [Chapter overview](../02_Math_Numbers.md) | [1.4 GCD & Lcm Problems →](04_gcd_lcm_problems.md)
> Page 3 of 4 in **Section 1: Basic Math & Number Problems**


## Problem: Sum of Digits

**Difficulty:** Easy | **Category:** Basic Math

**SUM OF DIGITS**

```text
Find the sum of all digits of a given number.

Input: n = 12345
Output: 15
Explanation: 1 + 2 + 3 + 4 + 5 = 15

Input: n = 9999
Output: 36
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

## Problem: Add Digits (Digital Root)

**LeetCode 258** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/add-digits/](https://leetcode.com/problems/add-digits/)

**ADD DIGITS (DIGITAL ROOT)**

```text
Repeatedly add digits until single digit remains.

Input: num = 38
Output: 2
Explanation: 3 + 8 = 11, 1 + 1 = 2

Input: num = 9999
Output: 9
Explanation: 36 → 9

FORMULA: Digital Root = 1 + (num - 1) % 9  (for num > 0)
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

## Problem: Reverse Integer

**LeetCode 7** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/reverse-integer/](https://leetcode.com/problems/reverse-integer/)

**REVERSE INTEGER**

```text
Reverse digits of a 32-bit signed integer.
Return 0 if result overflows.

Input: x = 123
Output: 321

Input: x = -123
Output: -321

Input: x = 1534236469
Output: 0 (overflow when reversed)
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

## Problem: Palindrome Number

**LeetCode 9** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/palindrome-number/](https://leetcode.com/problems/palindrome-number/)

**PALINDROME NUMBER**

```text
Check if integer is palindrome (reads same forwards and backwards).

Input: x = 121
Output: true

Input: x = -121
Output: false (reads as 121-)

Input: x = 10
Output: false (reads as 01)
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

## Problem: Happy Number

**LeetCode 202** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/happy-number/](https://leetcode.com/problems/happy-number/)

**HAPPY NUMBER**

```text
Starting with any positive integer, replace the number by the sum of
the squares of its digits. Repeat until it equals 1 (happy), or loops
endlessly in a cycle (not happy).

Input: n = 19
Output: true
Explanation:
1² + 9² = 82
8² + 2² = 68
6² + 8² = 100
1² + 0² + 0² = 1 ✓

Input: n = 2
Output: false (enters cycle)
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

[← 1.2 Fibonacci Problems](02_fibonacci_problems.md) | [Chapter overview](../02_Math_Numbers.md) | [1.4 GCD & Lcm Problems →](04_gcd_lcm_problems.md)
