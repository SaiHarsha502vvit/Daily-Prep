# PART 0: WHY Bit Manipulation — MIT/KTH Style

> **Navigation**: [Chapter overview](../18_BitManipulation.md) | [Single Number — Every Element Appears Twice… →](02_single_number_every_element_appears_twice.md)
> Page 1 of 5 in **SECTION 16: BIT MANIPULATION & MATH PROBLEMS**


**BIT Manipulation — Complete Understanding & Formal Foundations**

### WHY These Problems Matter

Bit operations are O(1) CPU operations — the FASTEST possible. They replace  
multiplication, division, and modulo in clever ways. Roughly 5-8% of  
interview problems require bit manipulation knowledge.

**Real-world BIT Manipulation**:

- Permissions/Flags: Unix file permissions (rwx = 111₂ = 7)
- Network masks: IP subnetting uses AND with bitmasks
- Graphics: Alpha blending, color channels packed into 32-bit ints
- Cryptography: XOR is the foundation of stream ciphers
- Compression: Huffman coding packs data at the bit level
- Databases: Bitmap indices for fast filtering
- Game dev: Feature flags, state compression, entity component systems

**WHY Interviewers ASK These**:

- Tests LOW-LEVEL understanding of how computers work
- Elegant O(1) space solutions exist where naive uses O(n) space
- Shows mathematical thinking and proof ability
- Bitmask DP is a key technique for NP-hard problems with small n

### Formal Foundation — the SIX Bitwise Operators

```text
1. AND (&): Both bits 1 → 1. Otherwise → 0

   1101  (13)          USE CASES:
 & 1010  (10)          • Masking: extract specific bits
 ──────                • Checking if a specific bit is set
   1000  ( 8)          • Clearing bits (AND with 0 = clear)
                       • n & 1 → check if odd
```

```text
2. OR (|): Either bit 1 → 1. Both 0 → 0

   1101  (13)          USE CASES:
 | 1010  (10)          • Setting specific bits to 1
 ──────                • Combining flags/permissions
   1111  (15)          • Building bitmasks incrementally
```

```text
3. XOR (^): Different bits → 1. Same bits → 0

   1101  (13)          KEY PROPERTIES:
 ^ 1010  (10)          • a ^ a = 0    (self-cancel)
 ──────                • a ^ 0 = a    (identity)
   0111  ( 7)          • a ^ b = b ^ a (commutative)
                       • (a^b)^c = a^(b^c) (associative)
   USE CASES:
   • Find unique element (all pairs cancel)
   • Toggle bits on/off
   • Swap without temp: a^=b; b^=a; a^=b;
```

```text
4. NOT (~): Flip ALL bits. 0→1, 1→0

   In Java: ~x = -(x + 1)  due to two's complement
   ~0  = -1    (all 1s in binary)
   ~5  = -6    (flip 0...0101 → 1...1010 = -6)
   ~-1 =  0

   TWO'S COMPLEMENT RULE:
   For n-bit signed integer: -x = ~x + 1
   So: -x = ~x + 1  →  ~x = -(x+1)
```

```text
5. LEFT SHIFT (<<): Shift bits left, fill with 0s on right

   5 << 1 = 10   (0101 → 1010)  = 5 × 2¹
   5 << 3 = 40   (0101 → 101000) = 5 × 2³
   EFFECT: Multiply by 2ᵏ
   1 << k = 2ᵏ  (create mask with kth bit set)
```

```text
6. RIGHT SHIFT

   >> (Arithmetic / Signed):
     Shift right, fill with SIGN BIT (preserves sign)
     20 >> 2 = 5     (positive: fill with 0)
     -20 >> 2 = -5   (negative: fill with 1)
     EFFECT: Divide by 2ᵏ (rounds toward -∞)

   >>> (Logical / Unsigned — Java specific):
     Shift right, ALWAYS fill with 0
     -1 >>> 1 = 2147483647  (0111...1111)
     Used when treating int as unsigned bit pattern
```

**ESSENTIAL TRICKS TABLE**

| Trick | Code | Why It Works |
| --- | --- | --- |
| Check if power of 2 | n > 0 && (n & (n-1)) == 0 | Only one bit set. n-1 flips all lower bits |
| Get lowest set bit | n & (-n) | Two's complement: -n = ~n + 1 |
| Clear lowest set bit | n & (n - 1) | Brian Kernighan's trick. n-1 flips lowest 1 and all bits below it |
| Count set bits (popcount) | while(n) { count++; n &= (n-1);<br>} | Kernighan O(k) where k = number of set bits.<br>Each iteration clears exactly one set bit |
| Check ith bit | (n >> i) & 1 | Shift bit i to position<br>0, mask with 1 |
| Set ith bit | n \| (1 << i) | OR with mask: places 1 at position i |
| Clear ith bit | n & ~(1 << i) | AND with inverse mask: places 0 at position i |
| Toggle ith bit | n ^ (1 << i) | XOR with mask: flips bit at position i |
| Check if odd | n & 1 | Lowest bit = 1 means odd |
| Multiply by 2ᵏ | n << k | Shift left = ×2ᵏ |
| Divide by 2ᵏ | n >> k | Shift right = ÷2ᵏ |
| Swap without temp | a^=b; b^=a; a^=b; | XOR self-cancel property |
| Get all 1s mask | ~0 or -1 | All bits set in two's complement |

### Subset Generation VIA Bitmask

For n elements, iterate mask from 0 to 2ⁿ - 1.  
Each bit in the mask represents whether an element is included.

Example: elements = [a, b, c]  (n = 3)

```java
mask = 0 (000) → {}          mask = 4 (100) → {c}
mask = 1 (001) → {a}         mask = 5 (101) → {a, c}
mask = 2 (010) → {b}         mask = 6 (110) → {b, c}
mask = 3 (011) → {a, b}      mask = 7 (111) → {a, b, c}
```

TOTAL SUBSETS = 2ⁿ

PROOF: Each of the n elements has 2 choices (in or out).  
By the multiplication principle: 2 × 2 × ... × 2 (n times) = 2ⁿ

**Number of Subsets with a Given SUM**:

Brute force: Generate all 2ⁿ subsets, compute sum, count matches.  
Time: O(n × 2ⁿ).  For n ≤ 20, this is feasible (~20 million ops).  
For larger n: use DP (0/1 knapsack counting variant).

**Code Pattern**:

```java
for (int mask = 0; mask < (1 << n); mask++) {
    List<Integer> subset = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        if ((mask >> i & 1) == 1) subset.add(arr[i]);
    }
    // process subset
}
```

### ⚠️  Common Mistakes — Memorize These

1. OPERATOR PRECEDENCE: & and | have LOWER precedence than ==

```java
WRONG:  if (n & 1 == 0)        → parsed as n & (1 == 0) → n & 0
RIGHT:  if ((n & 1) == 0)      → always parenthesize bit operations!
```

2. SIGNED vs UNSIGNED SHIFT:
>> preserves sign bit (arithmetic shift)  
>>> fills with 0 (logical shift)  
For negative numbers: -8 >> 1 = -4, but -8 >>> 1 = 2147483644  
Always think about whether your input can be negative!

**3. INT Overflow at BIT 31**:

1 << 31 = Integer.MIN_VALUE (−2³¹) in Java, NOT 2³¹  
Use 1L << 31 for correct positive value with long.  
Shifting by ≥ 32 on int is UNDEFINED/wrapped: 1 << 32 = 1 (not 0)

**4. Java HAS NO Unsigned INT**:

Java int is always signed 32-bit two's complement.  
For problems with "unsigned" semantics, use long or Integer methods  
like Integer.toUnsignedLong(), Integer.compareUnsigned()

**5. XOR Tricks Only Work with Exactly 2 Occurrences**:

"XOR all to find single" works when every OTHER element appears  
exactly twice. With 3 occurrences, use bit-counting mod 3 instead.  
Always verify the constraint: "every element appears twice except one"

### Decision Flowchart — Which BIT Technique?

"Find unique / missing element"  → XOR all elements  
"Check / set / toggle a flag"    → Masks with &, |, ^  
"Is power of 2?"                 → n & (n-1) == 0  
"Count set bits"                 → Kernighan's (n &= n-1 loop)  
"Generate all subsets"           → Bitmask 0 to 2ⁿ-1  
"Optimize NP with small n≤20"    → Bitmask DP  
"Multiply / divide by 2ᵏ"       → Shift left / right  
"Elements appear k times"        → Count bits mod k

---

[Chapter overview](../18_BitManipulation.md) | [Single Number — Every Element Appears Twice… →](02_single_number_every_element_appears_twice.md)
