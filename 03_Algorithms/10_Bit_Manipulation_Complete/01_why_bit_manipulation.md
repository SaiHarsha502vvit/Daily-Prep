# Why Bit Manipulation? <a name="why-bit-manipulation"></a>

> **Navigation**: [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Essential Bit Tricks & Formulas →](02_essential_bit_tricks_formulas.md)
> Page 1 of 6 in **Bit Manipulation Complete Guide**


## Interview Reality

**WHY COMPANIES ASK BIT MANIPULATION**

```text
1. Tests low-level understanding
2. O(1) space solutions where others use O(n)
3. Faster than arithmetic operations
4. Essential for systems programming
5. Shows mathematical thinking
```

## Where It's Used in Real World

- **Cryptography** - XOR operations for encryption
- **Graphics** - Color manipulation, image processing
- **Networking** - IP address, subnet masks
- **Embedded Systems** - Register manipulation
- **Game Dev** - State flags, permissions
- **Database** - Bloom filters, bitmap indexes

---

## Binary Number System Fundamentals <a name="binary-fundamentals"></a>

### How Computers Store Numbers

```
Decimal 13 in Binary:
```

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 | ← Powers of 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 1 | 1 | 0 | 1 | ← Binary: 00001101 |

```
                        8 + 4     + 1 = 13

Position:  7    6    5    4    3    2    1    0  (right to left, 0-indexed)
```

### Java Integer Representation (32-bit)

| Sign | 31 Value Bits |  |
| --- | --- | --- |
| Bit |  |  |
| 0 | 0000000 00000000 00000000 00001101 | = +13 |
| 1 | 1111111 11111111 11111111 11110011 | = -13 |

```
         ↑
    MSB (Most Significant Bit)
    0 = positive, 1 = negative
```

### Two's Complement (How Negative Numbers Work)

```java
// To get -13 from +13:
// Step 1: Flip all bits (One's complement)
+13 = 00000000 00000000 00000000 00001101
~13 = 11111111 11111111 11111111 11110010  // Flipped

// Step 2: Add 1
-13 = 11111111 11111111 11111111 11110011  // Two's complement

// Quick formula: -n = ~n + 1
// Or: -n = ~(n - 1)
```

### Important Ranges to Remember

| Type | Range |
| --- | --- |
| byte | -128 to 127 |
| short | -32,768 to 32,767 |
| int | -2^31 to 2^31 - 1<br>≈ -2.1 billion to 2.1 billion |
| long | -2^63 to 2^63 - 1 |

```
Key Values:
Integer.MAX_VALUE = 2147483647  (0x7FFFFFFF)
Integer.MIN_VALUE = -2147483648 (0x80000000)
```

---

## Bitwise Operators Deep Dive <a name="bitwise-operators"></a>

### The 6 Bitwise Operators

| Operator | Symbol | Description |
| --- | --- | --- |
| AND | & | Both bits must be 1 |
| OR | \| | At least one bit must be 1 |
| XOR | ^ | Exactly one bit must be 1 |
| NOT | ~ | Flip all bits |
| L-Shift | << | Shift bits left (multiply by 2) |
| R-Shift | >> | Shift bits right (divide by 2) |
| UR-Shift | >>> | Unsigned right shift (fill with 0s) |

### Visual Truth Tables

```
AND (&) - Both must be 1        OR (|) - At least one is 1
┌───┬───┬───────┐               ┌───┬───┬───────┐
│ A │ B │ A & B │               │ A │ B │ A | B │
├───┼───┼───────┤               ├───┼───┼───────┤
│ 0 │ 0 │   0   │               │ 0 │ 0 │   0   │
│ 0 │ 1 │   0   │               │ 0 │ 1 │   1   │
│ 1 │ 0 │   0   │               │ 1 │ 0 │   1   │
│ 1 │ 1 │   1   │               │ 1 │ 1 │   1   │
└───┴───┴───────┘               └───┴───┴───────┘

XOR (^) - Exactly one is 1      NOT (~) - Flip the bit
┌───┬───┬───────┐               ┌───┬───────┐
│ A │ B │ A ^ B │               │ A │  ~A   │
├───┼───┼───────┤               ├───┼───────┤
│ 0 │ 0 │   0   │               │ 0 │   1   │
│ 0 │ 1 │   1   │               │ 1 │   0   │
│ 1 │ 0 │   1   │               └───┴───────┘
│ 1 │ 1 │   0                               │
└───┴───┴───────────────────────────────────┘
```

### Practical Examples

```java
public class BitwiseDemo {
    public static void main(String[] args) {
        int a = 12;  // Binary: 1100
        int b = 10;  // Binary: 1010

        // AND - Keep only common 1s
        System.out.println(a & b);  // 8 (1000)
        //   1100
        // & 1010
        // ------
        //   1000 = 8

        // OR - Combine all 1s
        System.out.println(a | b);  // 14 (1110)
        //   1100
        // | 1010
        // ------
        //   1110 = 14

        // XOR - Different bits become 1
        System.out.println(a ^ b);  // 6 (0110)
        //   1100
        // ^ 1010
        // ------
        //   0110 = 6

        // NOT - Flip all bits
        System.out.println(~a);     // -13
        // ~00000000...00001100 = 11111111...11110011 = -13

        // Left Shift - Multiply by 2^n
        System.out.println(a << 2); // 48 (1100 → 110000)
        // 12 * 2^2 = 12 * 4 = 48

        // Right Shift - Divide by 2^n
        System.out.println(a >> 2); // 3 (1100 → 0011)
        // 12 / 2^2 = 12 / 4 = 3
    }
}
```

### Left Shift vs Right Shift Visualization

```
LEFT SHIFT (<<) - Multiply by 2^n
┌─────────────────────────────────────────┐
│  5 << 1  =  10                          │
│                                         │
│  Before: 0 0 0 0 0 1 0 1  (5)           │
│                    ↓ ↓ ↓                │
│  After:  0 0 0 0 1 0 1 0  (10)          │
│                                         │
│  Bits shift LEFT, 0s fill from right    │
└─────────────────────────────────────────┘

RIGHT SHIFT (>>) - Divide by 2^n
┌─────────────────────────────────────────┐
│  20 >> 2  =  5                          │
│                                         │
│  Before: 0 0 0 1 0 1 0 0  (20)          │
│            ↓ ↓ ↓ ↓                      │
│  After:  0 0 0 0 0 1 0 1  (5)           │
│                                         │
│  Bits shift RIGHT, sign bit fills left  │
└─────────────────────────────────────────┘

UNSIGNED RIGHT SHIFT (>>>) - Always fills with 0s
┌─────────────────────────────────────────┐
│  Used for negative numbers              │
│  -8 >>> 2 = 1073741822                  │
│  (Treats as unsigned, fills 0s)         │
└─────────────────────────────────────────┘
```

---

[Chapter overview](../10_Bit_Manipulation_Complete.md) | [Essential Bit Tricks & Formulas →](02_essential_bit_tricks_formulas.md)
