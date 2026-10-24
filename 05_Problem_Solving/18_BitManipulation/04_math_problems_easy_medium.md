# 16.3 Math Problems (Easy-Medium)

> **Navigation**: [← 16.2 Power & Counting (Easy-Medium)](03_power_counting_easy_medium.md) | [Chapter overview](../18_BitManipulation.md) | [16.4 Bitmask DP & Subsets →](05_bitmask_dp_subsets.md)
> Page 4 of 5 in **SECTION 16: BIT MANIPULATION & MATH PROBLEMS**


## Problem #295: [Reverse Integer](https://leetcode.com/problems/reverse-integer/) (LC 7)

```
┌────────────────────────────────────────────────────────────────┐
│  REVERSE INTEGER — Reverse digits with overflow handling       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  123 → 321                                             │
│  Input: -123 → -321                                            │
│  Input:  120 → 21                                              │
│  If overflow: return 0                                         │
│                                                                │
│  APPROACH: Build reversed number digit-by-digit.               │
│  Extract last digit: digit = x % 10                            │
│  Build reverse: rev = rev * 10 + digit                         │
│  Remove last digit: x = x / 10                                 │
│                                                                │
│  OVERFLOW CHECK — MUST check BEFORE multiply:                  │
│  If rev > Integer.MAX_VALUE / 10 → overflow                    │
│  If rev < Integer.MIN_VALUE / 10 → underflow                   │
│                                                                │
│  PROVE: MAX_VALUE = 2147483647.                                │
│  If rev > 214748364, then rev*10 > 2147483640,                 │
│  adding any digit ≥ 8 overflows.                               │
│  If rev == 214748364, digit can be at most 7 (which is         │
│  the first digit of MAX_VALUE). Symmetric for MIN.             │
│                                                                │
│  Time: O(log₁₀(x))   Space: O(1)                               │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int reverse(int x) {
    int rev = 0;
    while (x != 0) {
        int digit = x % 10;
        x /= 10;

        // Overflow check BEFORE multiplying
        if (rev > Integer.MAX_VALUE / 10 || rev < Integer.MIN_VALUE / 10) {
            return 0;
        }
        rev = rev * 10 + digit;
    }
    return rev;
}
```

---

## Problem #296: [Palindrome Number](https://leetcode.com/problems/palindrome-number/) (LC 9)

```
┌────────────────────────────────────────────────────────────────┐
│  PALINDROME NUMBER — Check without converting to string        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  121 → true                                            │
│  Input:  -121 → false (leading '-')                            │
│  Input:  10 → false                                            │
│                                                                │
│  APPROACH: Reverse ONLY the second half, compare with first.   │
│  This avoids overflow (we never build the full reverse).       │
│                                                                │
│  TRACE (x = 12321):                                            │
│    x = 12321, rev = 0                                          │
│    x = 1232,  rev = 1      (digit=1)                           │
│    x = 123,   rev = 12     (digit=2)                           │
│    x = 12,    rev = 123    → STOP (rev >= x)                   │
│                                                                │
│    Odd length: x == rev / 10 → 12 == 123/10 = 12 ✓             │
│                                                                │
│  TRACE (x = 1221):                                             │
│    x = 1221, rev = 0                                           │
│    x = 122,  rev = 1                                           │
│    x = 12,   rev = 12      → STOP (rev >= x)                   │
│                                                                │
│    Even length: x == rev → 12 == 12 ✓                          │
│                                                                │
│  Time: O(log₁₀(n))   Space: O(1)                               │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public boolean isPalindrome(int x) {
    // Negative numbers and numbers ending in 0 (except 0 itself) are not palindromes
    if (x < 0 || (x % 10 == 0 && x != 0)) return false;

    int reversedHalf = 0;
    while (x > reversedHalf) {
        reversedHalf = reversedHalf * 10 + x % 10;
        x /= 10;
    }
    // Even length: x == reversedHalf
    // Odd length: x == reversedHalf / 10 (middle digit doesn't matter)
    return x == reversedHalf || x == reversedHalf / 10;
}
```

---

## Problem #297: [Add Binary](https://leetcode.com/problems/add-binary/) (LC 67)

```
┌────────────────────────────────────────────────────────────────┐
│  ADD BINARY — Add two binary strings                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  a = "1010", b = "1011"                                │
│  Output: "10101"                                               │
│                                                                │
│  APPROACH: Simulate binary addition right-to-left with carry.  │
│                                                                │
│      1 0 1 0                                                   │
│    + 1 0 1 1                                                   │
│    ─────────                                                   │
│    1 0 1 0 1   (carry propagates)                              │
│                                                                │
│  At each position: sum = digitA + digitB + carry               │
│  Result digit = sum % 2.  New carry = sum / 2.                 │
│                                                                │
│  Time: O(max(m, n))   Space: O(max(m, n))                      │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public String addBinary(String a, String b) {
    StringBuilder sb = new StringBuilder();
    int i = a.length() - 1, j = b.length() - 1, carry = 0;

    while (i >= 0 || j >= 0 || carry > 0) {
        int sum = carry;
        if (i >= 0) sum += a.charAt(i--) - '0';
        if (j >= 0) sum += b.charAt(j--) - '0';
        sb.append(sum % 2);
        carry = sum / 2;
    }
    return sb.reverse().toString();
}
```

---

## Problem #298: [Excel Sheet Column Title](https://leetcode.com/problems/excel-sheet-column-title/) (LC 168)

```
┌────────────────────────────────────────────────────────────────┐
│  EXCEL COLUMN TITLE — Convert number to column title           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1 → "A", 26 → "Z", 27 → "AA", 701 → "ZY"                      │
│                                                                │
│  APPROACH: Like base-26 conversion, but 1-indexed.             │
│  Subtract 1 before each modulo to map A=0, B=1, ..., Z=25.     │
│                                                                │
│  while (n > 0):                                                │
│    n--;                                                        │
│    char = 'A' + (n % 26);                                      │
│    n /= 26;                                                    │
│                                                                │
│  Time: O(log₂₆(n))   Space: O(1)                               │
└────────────────────────────────────────────────────────────────┘
```

```java
public String convertToTitle(int n) {
    StringBuilder sb = new StringBuilder();
    while (n > 0) {
        n--;
        sb.append((char) ('A' + n % 26));
        n /= 26;
    }
    return sb.reverse().toString();
}
```

---

## Problem #299: [Maximum Product of Three Numbers](https://leetcode.com/problems/maximum-product-of-three-numbers/) (LC 628)

```
┌───────────────────────────────────────────────────────────────────┐
│  MAX PRODUCT OF THREE                                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Input: [1, 2, 3, 4]  → Output: 24  (2×3×4)                       │
│  Input: [-4, -3, 1, 2, 3] → Output: 36  ((-4)×(-3)×3)             │
│                                                                   │
│  APPROACH: After sorting, answer is max of:                       │
│    1. Three largest: nums[n-1] × nums[n-2] × nums[n-3]            │
│    2. Two smallest (neg) × largest: nums[0] × nums[1] × nums[n-1] │
│                                                                   │
│  WHY? Two negatives multiply to positive, which ×  largest        │
│  positive could exceed three positives.                           │
│                                                                   │
│  Time: O(n log n)   Space: O(1) or O(n) for sort                  │
└───────────────────────────────────────────────────────────────────┘
```

```java
public int maximumProduct(int[] nums) {
    Arrays.sort(nums);
    int n = nums.length;
    return Math.max(
        nums[n-1] * nums[n-2] * nums[n-3],       // three largest
        nums[0] * nums[1] * nums[n-1]             // two most-negative × largest
    );
}
```

---

## Problem #300: [Kth Factor of N](https://leetcode.com/problems/kth-factor-of-n/) (LC 1492)

```
┌────────────────────────────────────────────────────────────────┐
│  KTH FACTOR OF N                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input: n = 12, k = 3  → Output: 3  (factors: 1,2,3,4,6,12)    │
│                                                                │
│  APPROACH: Iterate 1 to √n, collect smaller factors.           │
│  If k-th not found, check larger factors (n/factor) in         │
│  reverse order. Total factors come in pairs.                   │
│                                                                │
│  Time: O(√n)   Space: O(1)                                     │
└────────────────────────────────────────────────────────────────┘
```

```java
public int kthFactor(int n, int k) {
    int count = 0;
    for (int i = 1; i * i <= n; i++) {
        if (n % i == 0 && ++count == k) return i;
    }
    for (int i = (int) Math.sqrt(n); i >= 1; i--) {
        if (n % i == 0 && i * i != n && ++count == k) return n / i;
    }
    return -1;
}
```

---

## Problem #301: [Happy Number](https://leetcode.com/problems/happy-number/) (LC 202)

```
┌────────────────────────────────────────────────────────────────┐
│  HAPPY NUMBER — Detect cycle in digit-square-sum sequence      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Process: Replace n with sum of squares of its digits.         │
│  If reaches 1 → happy. If cycles → not happy.                  │
│                                                                │
│  19 → 1²+9² = 82 → 64+4 = 68 → 36+64 = 100 → 1  ✓ happy        │
│                                                                │
│  APPROACH: Floyd's cycle detection (fast/slow pointers).       │
│  slow = step(n), fast = step(step(n)).                         │
│  If fast reaches 1 → happy. If slow == fast → cycle → not.     │
│                                                                │
│  Time: O(log n)   Space: O(1) with Floyd's                     │
└────────────────────────────────────────────────────────────────┘
```

```java
public boolean isHappy(int n) {
    int slow = n, fast = step(n);
    while (fast != 1 && slow != fast) {
        slow = step(slow);
        fast = step(step(fast));
    }
    return fast == 1;
}

private int step(int n) {
    int sum = 0;
    while (n > 0) {
        int d = n % 10;
        sum += d * d;
        n /= 10;
    }
    return sum;
}
```

---

## Problem #302: [Valid Square](https://leetcode.com/problems/valid-square/) (LC 593)

```
┌────────────────────────────────────────────────────────────────┐
│  VALID SQUARE — Given 4 points, check if they form a square    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  APPROACH: Compute all 6 pairwise distances.                   │
│  A valid square has: 4 equal sides + 2 equal diagonals.        │
│  Diagonals = √2 × side.                                        │
│  So among 6 distances: 4 must be equal (sides) and             │
│  2 must be equal AND longer (diagonals). All > 0.              │
│                                                                │
│  Time: O(1)   Space: O(1)                                      │
└────────────────────────────────────────────────────────────────┘
```

```java
public boolean validSquare(int[] p1, int[] p2, int[] p3, int[] p4) {
    int[] dists = {dist(p1,p2), dist(p1,p3), dist(p1,p4),
                   dist(p2,p3), dist(p2,p4), dist(p3,p4)};
    Arrays.sort(dists);
    // 4 sides equal, 2 diagonals equal, sides > 0, diag > sides
    return dists[0] > 0 && dists[0] == dists[3] && dists[4] == dists[5];
}

private int dist(int[] a, int[] b) {
    return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]);
}
```

---

## Problem #303: [Max Points on a Line](https://leetcode.com/problems/max-points-on-a-line/) (LC 149)

```
┌────────────────────────────────────────────────────────────────┐
│  MAX POINTS ON A LINE — Find max collinear points              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input: [[1,1],[2,2],[3,3],[1,2],[2,3]]                        │
│  Output: 3  (points [1,1],[2,2],[3,3] are collinear)           │
│                                                                │
│  APPROACH: For each point i, compute slope to every other      │
│  point j. Use HashMap<String, Integer> of slopes.              │
│  Slope = dy/dx → normalize with GCD to avoid floating point.   │
│  Handle vertical lines: dx=0 → slope = "INF".                  │
│                                                                │
│  Slope representation: "dy/dx" where gcd(|dy|,|dx|) divides    │
│  both, and sign is normalized (dx always positive, or if       │
│  dx=0 then dy positive).                                       │
│                                                                │
│  For each anchor point:                                        │
│    Clear map. For each other point:                            │
│      Compute normalized slope → increment count in map.        │
│    maxForAnchor = max value in map + 1 (include anchor).       │
│    globalMax = max(globalMax, maxForAnchor).                   │
│                                                                │
│  Time: O(n²)   Space: O(n) for the map                         │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int maxPoints(int[][] points) {
    int n = points.length;
    if (n <= 2) return n;
    int maxCount = 2;

    for (int i = 0; i < n; i++) {
        Map<String, Integer> slopeMap = new HashMap<>();
        for (int j = i + 1; j < n; j++) {
            int dy = points[j][1] - points[i][1];
            int dx = points[j][0] - points[i][0];

            // Normalize slope using GCD
            if (dx == 0) {
                dy = 1;  // vertical line
            } else if (dy == 0) {
                dx = 1;  // horizontal line
            } else {
                // Ensure consistent sign: dx always positive
                if (dx < 0) { dx = -dx; dy = -dy; }
                int g = gcd(Math.abs(dy), Math.abs(dx));
                dy /= g;
                dx /= g;
            }

            String key = dy + "/" + dx;
            slopeMap.put(key, slopeMap.getOrDefault(key, 0) + 1);
        }

        for (int count : slopeMap.values()) {
            maxCount = Math.max(maxCount, count + 1);  // +1 for anchor point
        }
    }
    return maxCount;
}

private int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}
```

---

[← 16.2 Power & Counting (Easy-Medium)](03_power_counting_easy_medium.md) | [Chapter overview](../18_BitManipulation.md) | [16.4 Bitmask DP & Subsets →](05_bitmask_dp_subsets.md)
