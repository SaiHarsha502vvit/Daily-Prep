# 13.2 Bit Manipulation

> **Navigation**: [← 13.1 Number Theory Problems](01_number_theory_problems.md) | [Chapter overview](../14_Mixed_Competitive.md) | [13.3 Implementation Problems →](03_implementation_problems.md)
> Page 2 of 5 in **SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS**


## Problem 206: Count Set Bits (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT SET BITS - Number of 1s in binary representation        │
├────────────────────────────────────────────────────────────────┤
│  n = 13                                                        │
│  Binary: 1101                                                  │
│  Set bits: 3                                                   │
│                                                                │
│  Brian Kernighan's Algorithm:                                  │
│  n & (n-1) removes rightmost set bit                           │
│                                                                │
│  13 = 1101                                                     │
│  12 = 1100                                                     │
│  13 & 12 = 1100 (12) → count = 1                               │
│  12 & 11 = 1000 (8)  → count = 2                               │
│  8 & 7 = 0           → count = 3                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Remove rightmost set bit
        count++;
    }
    return count;
}

// Count set bits from 1 to n
public int countSetBitsRange(int n) {
    int count = 0;
    for (int i = 1; i <= n; i++) {
        count += countSetBits(i);
    }
    return count;
}
```

---

## Problem 207: Power of Two (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  POWER OF TWO - Check if n is power of 2                       │
├────────────────────────────────────────────────────────────────┤
│  Powers of 2 have exactly ONE set bit:                         │
│  1  = 0001                                                     │
│  2  = 0010                                                     │
│  4  = 0100                                                     │
│  8  = 1000                                                     │
│  16 = 10000                                                    │
│                                                                │
│  Trick: n & (n-1) == 0 for powers of 2                         │
│                                                                │
│  8 = 1000, 7 = 0111                                            │
│  8 & 7 = 0000 → True                                           │
│                                                                │
│  6 = 0110, 5 = 0101                                            │
│  6 & 5 = 0100 → False                                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// Find highest power of 2 <= n
public int highestPowerOf2(int n) {
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return (n + 1) >> 1;
}
```

---

## Problem 208: XOR Queries (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  XOR QUERIES - XOR of range [L, R]                             │
├────────────────────────────────────────────────────────────────┤
│  arr = [1, 3, 4, 8], queries = [[0,1], [1,2], [0,3]]           │
│                                                                │
│  XOR properties:                                               │
│  - a ⊕ a = 0                                                   │
│  - a ⊕ 0 = a                                                   │
│  - Associative and commutative                                 │
│                                                                │
│  Prefix XOR: [1, 1⊕3, 1⊕3⊕4, 1⊕3⊕4⊕8]                          │
│            = [1, 2, 6, 14]                                     │
│                                                                │
│  XOR[L,R] = prefix[R] ⊕ prefix[L-1]                            │
│  XOR[1,2] = prefix[2] ⊕ prefix[0] = 6 ⊕ 1 = 7                  │
│  Check: 3 ⊕ 4 = 7 ✓                                            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] xorQueries(int[] arr, int[][] queries) {
    int n = arr.length;
    int[] prefix = new int[n + 1];

    // Build prefix XOR
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] ^ arr[i];
    }

    int[] result = new int[queries.length];
    for (int i = 0; i < queries.length; i++) {
        int left = queries[i][0];
        int right = queries[i][1];
        result[i] = prefix[right + 1] ^ prefix[left];
    }

    return result;
}
```

---

[← 13.1 Number Theory Problems](01_number_theory_problems.md) | [Chapter overview](../14_Mixed_Competitive.md) | [13.3 Implementation Problems →](03_implementation_problems.md)
