# 16.2 Power & Counting (Easy-Medium)

> **Navigation**: [← Single Number — Every Element Appears Twice…](02_single_number_every_element_appears_twice.md) | [Chapter overview](../18_BitManipulation.md) | [16.3 Math Problems (Easy-Medium) →](04_math_problems_easy_medium.md)
> Page 3 of 5 in **SECTION 16: BIT MANIPULATION & MATH PROBLEMS**


## Problem #290: [Power of Two](https://leetcode.com/problems/power-of-two/) (LC 231)

```
┌────────────────────────────────────────────────────────────────┐
│  POWER OF TWO — Check if n is a power of 2                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Powers of 2 in binary:                                        │
│    1   = 0001                                                  │
│    2   = 0010                                                  │
│    4   = 0100                                                  │
│    8   = 1000   ← exactly ONE bit set!                         │
│                                                                │
│  KEY INSIGHT: n & (n - 1) clears the lowest set bit.           │
│  If n is a power of 2, it has exactly one bit set.             │
│  Clearing it gives 0.                                          │
│                                                                │
│    8 & 7 = 1000 & 0111 = 0000  ✓ (power of 2)                  │
│    6 & 5 = 0110 & 0101 = 0100  ✗ (not power of 2)              │
│                                                                │
│  PROOF: If n = 2ᵏ, then n has bit k set and all others 0.      │
│  n - 1 = 2ᵏ - 1 has bits [0..k-1] all set, bit k clear.        │
│  n & (n-1) = 0 since no bits overlap.                          │
│  Conversely, if n has ≥ 2 bits set, clearing the lowest        │
│  leaves at least one, so result ≠ 0.  ∎                        │
│                                                                │
│  EDGE: n must be > 0 (0 is not a power of 2).                  │
│  Time: O(1)   Space: O(1)                                      │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

---

## Problem #291: [Counting Bits](https://leetcode.com/problems/counting-bits/) (LC 338)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNTING BITS — For every i in [0..n], count set bits         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input: n = 5                                                  │
│  Output: [0, 1, 1, 2, 1, 2]                                    │
│                                                                │
│  DP RECURRENCE: dp[i] = dp[i & (i - 1)] + 1                    │
│                                                                │
│  WHY: i & (i-1) clears the lowest set bit of i.                │
│  So dp[i] = (number of bits in i with lowest cleared) + 1      │
│           = dp[parent] + 1                                     │
│                                                                │
│  TRACE:                                                        │
│    dp[0] = 0                    (base case)                    │
│    dp[1] = dp[1 & 0] + 1 = dp[0] + 1 = 1                       │
│    dp[2] = dp[2 & 1] + 1 = dp[0] + 1 = 1                       │
│    dp[3] = dp[3 & 2] + 1 = dp[2] + 1 = 2                       │
│    dp[4] = dp[4 & 3] + 1 = dp[0] + 1 = 1                       │
│    dp[5] = dp[5 & 4] + 1 = dp[4] + 1 = 2                       │
│                                                                │
│  PROOF: Clearing one bit reduces popcount by 1. By induction,  │
│  dp[i & (i-1)] is correct → dp[i] = dp[i&(i-1)] + 1.  ∎        │
│                                                                │
│  Time: O(n)   Space: O(n) for output                           │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i & (i - 1)] + 1;   // clear lowest bit → parent state
    }
    return dp;
}
```

---

## Problem #292: [Number of 1 Bits / Hamming Weight](https://leetcode.com/problems/number-of-1-bits/) (LC 191)

```
┌────────────────────────────────────────────────────────────────┐
│  HAMMING WEIGHT — Count number of 1 bits in an integer         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  n = 11 (1011)                                         │
│  Output: 3                                                     │
│                                                                │
│  BRIAN KERNIGHAN'S ALGORITHM:                                  │
│  Loop: n = n & (n-1) clears one set bit per iteration.         │
│  Count iterations = number of set bits.                        │
│                                                                │
│  TRACE:                                                        │
│    n = 1011 → n & 1010 = 1010  (cleared bit 0) count=1         │
│    n = 1010 → n & 1001 = 1000  (cleared bit 1) count=2         │
│    n = 1000 → n & 0111 = 0000  (cleared bit 3) count=3         │
│    n = 0 → STOP. Answer = 3  ✓                                 │
│                                                                │
│  Time: O(k) where k = number of set bits                       │
│  Space: O(1)                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1);      // clear lowest set bit
        count++;
    }
    return count;
}
// Also: return Integer.bitCount(n);  ← Java built-in (uses lookup table)
```

---

## Problem #293: [Reverse Bits](https://leetcode.com/problems/reverse-bits/) (LC 190)

```
┌────────────────────────────────────────────────────────────────┐
│  REVERSE BITS — Reverse all 32 bits of an unsigned integer     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  0000...1011 (11)                                      │
│  Output: 1101...0000 (3489660928 or 0xD0000000)                │
│                                                                │
│  APPROACH: Extract each bit from right, place into result      │
│  from left. Process all 32 bits.                               │
│                                                                │
│  for 32 iterations:                                            │
│    result <<= 1              (make room)                       │
│    result |= (n & 1)         (copy lowest bit of n)            │
│    n >>>= 1                  (move to next bit of n)           │
│                                                                │
│  Time: O(32) = O(1)   Space: O(1)                              │
└────────────────────────────────────────────────────────────────┘
```

```java
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result <<= 1;
        result |= (n & 1);
        n >>>= 1;              // unsigned right shift!
    }
    return result;
}
```

---

## Problem #294: [Hamming Distance](https://leetcode.com/problems/hamming-distance/) (LC 461)

```
┌────────────────────────────────────────────────────────────────┐
│  HAMMING DISTANCE — Count positions where bits differ          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  x = 1 (0001), y = 4 (0100)                            │
│  Output: 2                                                     │
│                                                                │
│  APPROACH: XOR gives 1 at positions where bits differ.         │
│  Count set bits in x ^ y → that's the Hamming distance.        │
│                                                                │
│  1 ^ 4 = 0001 ^ 0100 = 0101 → 2 set bits → distance = 2        │
│                                                                │
│  Time: O(1)   Space: O(1)                                      │
└────────────────────────────────────────────────────────────────┘
```

```java
public int hammingDistance(int x, int y) {
    return Integer.bitCount(x ^ y);
    // Or: use Kernighan's on (x ^ y)
}
```

---

> 🔬 **Section Challenge — 16.2 Power & Counting (Easy-Medium)**

**Challenge 1 (Trace — Who/When/What):** In `countBits(n=6)`, trace the DP recurrence `dp[i] = dp[i & (i-1)] + 1` for every `i` from 1 to 6. For each step, show what `i & (i-1)` evaluates to in binary and why.

<details><summary>Answer</summary>

**Who?** One loop iteration per i. **When?** `dp[i]` is computed only after `dp[i & (i-1)]` already exists — this is guaranteed because `i & (i-1) < i` always (clearing a bit reduces the value). **What already exists?** `dp[0]=0` is the base case.

i=1 (001): `1&0=0(000)` → `dp[0]+1=1`. i=2 (010): `2&1=0(000)` → `dp[0]+1=1`. i=3 (011): `3&2=2(010)` → `dp[2]+1=2`. i=4 (100): `4&3=0(000)` → `dp[0]+1=1`. i=5 (101): `5&4=4(100)` → `dp[4]+1=2`. i=6 (110): `6&5=4(100)` → `dp[4]+1=2`.

Result: `[0, 1, 1, 2, 1, 2, 2]`. The key invariant: `i & (i-1)` is always a previously computed index — guaranteeing bottom-up correctness.

</details>

**Challenge 2 (Design):** `isPowerOfTwo(n)` uses `n > 0 && (n & (n-1)) == 0`. Why is the `n > 0` guard necessary? What does `n & (n-1)` evaluate to when `n=0`, and why would omitting the guard give the wrong answer?

<details><summary>Answer</summary>

When `n=0`: `0 & (0-1) = 0 & (-1)`. In two's complement, `-1` is all 1s. So `0 & (all 1s) = 0`. The expression `(n & (n-1)) == 0` evaluates to `true` when `n=0`. But `0` is **NOT** a power of 2 (no integer `k` satisfies `2^k = 0`). Without the guard, `isPowerOfTwo(0)` would incorrectly return `true`. The `n > 0` guard explicitly excludes this edge case. Similarly, negative numbers: `-8 & -9 = 1000 & 0111 (two's complement)` — the guard `n > 0` also correctly rejects all negatives in one check.

</details>

---

[← Single Number — Every Element Appears Twice…](02_single_number_every_element_appears_twice.md) | [Chapter overview](../18_BitManipulation.md) | [16.3 Math Problems (Easy-Medium) →](04_math_problems_easy_medium.md)
