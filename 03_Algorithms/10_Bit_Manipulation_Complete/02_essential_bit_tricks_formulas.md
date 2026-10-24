# Essential Bit Tricks & Formulas <a name="essential-tricks"></a>

> **Navigation**: [← Why Bit Manipulation?](01_why_bit_manipulation.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [XOR Magic Properties →](03_xor_magic_properties.md)
> Page 2 of 6 in **Bit Manipulation Complete Guide**


## 🎯 MUST MEMORIZE - Interview Gold

```java
// ═══════════════════════════════════════════════════════════════
// ║           THE 10 ESSENTIAL BIT TRICKS                       ║
// ═══════════════════════════════════════════════════════════════

// 1. Check if number is even or odd
boolean isEven = (n & 1) == 0;
boolean isOdd = (n & 1) == 1;

// 2. Check if ith bit is set (0-indexed from right)
boolean isSet = (n & (1 << i)) != 0;

// 3. Set the ith bit (turn ON)
n = n | (1 << i);

// 4. Clear the ith bit (turn OFF)
n = n & ~(1 << i);

// 5. Toggle the ith bit (flip)
n = n ^ (1 << i);

// 6. Clear rightmost set bit
n = n & (n - 1);

// 7. Get rightmost set bit (isolate)
int rightmostBit = n & (-n);

// 8. Check if power of 2
boolean isPowerOf2 = n > 0 && (n & (n - 1)) == 0;

// 9. Count set bits (Brian Kernighan)
int count = 0;
while (n != 0) {
    n = n & (n - 1);
    count++;
}

// 10. Swap two numbers without temp
a = a ^ b;
b = a ^ b;  // b = (a^b)^b = a
a = a ^ b;  // a = (a^b)^a = b
```

## Visual Explanation of Key Tricks

### Trick: `n & (n-1)` - Clear Rightmost Set Bit

```
Why does n & (n-1) clear rightmost set bit?

n     = 12 = 1100
n-1   = 11 = 1011  (borrowing flips rightmost 1 and all 0s after it)
─────────────────
n&(n-1)    = 1000 = 8

Another example:
n     = 40 = 101000
n-1   = 39 = 100111
─────────────────
n&(n-1)    = 100000 = 32

Pattern: Subtracting 1 flips bits from rightmost 1 to end
         AND then clears that entire section
```

### Trick: `n & (-n)` - Isolate Rightmost Set Bit

```
Why does n & (-n) isolate rightmost set bit?

Remember: -n = ~n + 1 (Two's complement)

n     = 12 = 00001100
-n    =     = 11110100  (flip + add 1)
─────────────────────
n&(-n)     = 00000100 = 4

The rightmost 1 is at position 2 (value = 4)
```

### Trick: Power of 2 Check

```
Powers of 2 have exactly ONE bit set:
1  = 0001
2  = 0010
4  = 0100
8  = 1000
16 = 10000

For power of 2:  n & (n-1) = 0
8     = 1000
7     = 0111
8 & 7 = 0000 ✓

For non-power:   n & (n-1) ≠ 0
6     = 110
5     = 101
6 & 5 = 100 ≠ 0 ✗
```

## Multiply and Divide by Powers of 2

```java
// These are MUCH faster than *, /

// Multiply by 2^k
n << k    // n * 2^k

// Examples:
5 << 1    // 5 * 2 = 10
5 << 2    // 5 * 4 = 20
5 << 3    // 5 * 8 = 40

// Divide by 2^k
n >> k    // n / 2^k

// Examples:
20 >> 1   // 20 / 2 = 10
20 >> 2   // 20 / 4 = 5
```

---

[← Why Bit Manipulation?](01_why_bit_manipulation.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [XOR Magic Properties →](03_xor_magic_properties.md)
