# Interview Problems with Solutions <a name="interview-problems"></a>

> **Navigation**: [← Common Patterns & Templates](05_common_patterns_templates.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md)
> Page 6 of 6 in **Bit Manipulation Complete Guide**


## Problem 1: Single Number (LeetCode 136) ⭐

```java
/*
Every element appears twice except one. Find the single one.
Time: O(n), Space: O(1)
*/
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
// XOR: pairs cancel (a^a=0), single remains
```

## Problem 2: Single Number II (LeetCode 137) ⭐⭐

```java
/*
Every element appears THREE times except one. Find it.
Idea: Count bits at each position, mod 3 gives the single number's bits
*/
public int singleNumber(int[] nums) {
    int result = 0;

    for (int i = 0; i < 32; i++) {
        int sum = 0;
        for (int num : nums) {
            // Count bit at position i
            sum += (num >> i) & 1;
        }
        // If sum % 3 != 0, single number has bit at position i
        if (sum % 3 != 0) {
            result |= (1 << i);
        }
    }
    return result;
}

// Alternative: Using state machine (ones, twos)
public int singleNumberOptimal(int[] nums) {
    int ones = 0, twos = 0;
    for (int num : nums) {
        ones = (ones ^ num) & ~twos;
        twos = (twos ^ num) & ~ones;
    }
    return ones;
}
```

## Problem 3: Single Number III (LeetCode 260) ⭐⭐

```java
/*
Two elements appear once, rest appear twice. Find both.
*/
public int[] singleNumber(int[] nums) {
    // Step 1: XOR all to get a^b
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;

    // Step 2: Find any bit where a and b differ
    int diffBit = xorAll & (-xorAll);  // Rightmost set bit

    // Step 3: Split into two groups
    int a = 0, b = 0;
    for (int num : nums) {
        if ((num & diffBit) != 0) {
            a ^= num;
        } else {
            b ^= num;
        }
    }
    return new int[]{a, b};
}
```

## Problem 4: Counting Bits (LeetCode 338) ⭐

```java
/*
Count set bits for all numbers from 0 to n
dp[i] = dp[i >> 1] + (i & 1)
*/
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1);
    }
    return dp;
}
// i >> 1: remove last bit, already computed
// i & 1: add 1 if last bit is set
```

## Problem 5: Reverse Bits (LeetCode 190) ⭐

```java
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result <<= 1;           // Make room
        result |= (n & 1);      // Add last bit of n
        n >>= 1;                // Move to next bit
    }
    return result;
}
```

## Problem 6: Number of 1 Bits (LeetCode 191) ⭐

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Remove rightmost 1
        count++;
    }
    return count;
}
```

## Problem 7: Power of Two (LeetCode 231) ⭐

```java
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
// Power of 2 has exactly one 1 bit
// n & (n-1) clears that bit → result is 0
```

## Problem 8: Missing Number (LeetCode 268) ⭐

```java
public int missingNumber(int[] nums) {
    int xor = nums.length;  // XOR with n
    for (int i = 0; i < nums.length; i++) {
        xor ^= i ^ nums[i];
    }
    return xor;
}
```

## Problem 9: Sum of Two Integers Without + - (LeetCode 371) ⭐⭐

```java
/*
Add without arithmetic operators
XOR gives sum without carry
AND gives carry positions
Carry needs to be shifted left
*/
public int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;  // Carry shifted
        a = a ^ b;                  // Sum without carry
        b = carry;                  // Add carry next iteration
    }
    return a;
}
```

## Problem 10: Maximum XOR of Two Numbers (LeetCode 421) ⭐⭐⭐

```java
/*
Find maximum XOR of any two numbers in array
Use Trie (bit-level) or greedy bit-by-bit
*/
public int findMaximumXOR(int[] nums) {
    int maxResult = 0;
    int mask = 0;

    // Check each bit from highest to lowest
    for (int i = 31; i >= 0; i--) {
        mask |= (1 << i);

        Set<Integer> prefixes = new HashSet<>();
        for (int num : nums) {
            prefixes.add(num & mask);  // Keep only high bits
        }

        // Greedily try to set this bit
        int candidate = maxResult | (1 << i);
        for (int prefix : prefixes) {
            // If prefix ^ candidate exists, we can achieve it
            if (prefixes.contains(prefix ^ candidate)) {
                maxResult = candidate;
                break;
            }
        }
    }
    return maxResult;
}
```

## Problem 11: Bitwise AND of Numbers Range (LeetCode 201) ⭐⭐

```java
/*
AND of all numbers from left to right
Key insight: Find common prefix
*/
public int rangeBitwiseAnd(int left, int right) {
    int shift = 0;
    // Find common prefix
    while (left < right) {
        left >>= 1;
        right >>= 1;
        shift++;
    }
    return left << shift;
}
// All bits after common prefix will have both 0 and 1 somewhere in range
// AND of 0 and 1 is 0
```

## Problem 12: Decode XORed Array (LeetCode 1720) ⭐

```java
/*
encoded[i] = arr[i] XOR arr[i+1]
Given encoded and first element, find original array
*/
public int[] decode(int[] encoded, int first) {
    int[] arr = new int[encoded.length + 1];
    arr[0] = first;

    for (int i = 0; i < encoded.length; i++) {
        // arr[i] XOR arr[i+1] = encoded[i]
        // arr[i+1] = arr[i] XOR encoded[i]
        arr[i + 1] = arr[i] ^ encoded[i];
    }
    return arr;
}
```

---

## Practice Problems List <a name="practice-problems"></a>

### Easy Level 🟢

| #   | Problem                              | Key Concept     |
| --- | ------------------------------------ | --------------- |
| 1   | Single Number                        | XOR property    |
| 2   | Number of 1 Bits                     | Brian Kernighan |
| 3   | Counting Bits                        | DP with bits    |
| 4   | Reverse Bits                         | Bit-by-bit      |
| 5   | Power of Two                         | n & (n-1)       |
| 6   | Missing Number                       | XOR all         |
| 7   | Binary Number with Alternating Bits  | Check pattern   |
| 8   | Hamming Distance                     | XOR + count     |
| 9   | Complement of Base 10 Integer        | Flip bits       |
| 10  | Convert Binary Number in Linked List | Bit building    |

### Medium Level 🟡

| #   | Problem                    | Key Concept             |
| --- | -------------------------- | ----------------------- |
| 1   | Single Number II           | Bit counting mod k      |
| 2   | Single Number III          | XOR + split             |
| 3   | Sum of Two Integers        | Carry simulation        |
| 4   | Bitwise AND of Range       | Common prefix           |
| 5   | Maximum XOR of Two Numbers | Greedy/Trie             |
| 6   | Total Hamming Distance     | Count bits per position |
| 7   | Subsets                    | Bitmask iteration       |
| 8   | Gray Code                  | Pattern generation      |
| 9   | Divide Two Integers        | Bit shifting            |
| 10  | UTF-8 Validation           | Bit masking             |

### Hard Level 🔴

| #   | Problem                               | Key Concept     |
| --- | ------------------------------------- | --------------- |
| 1   | Maximum AND Sum of Array              | Bitmask DP      |
| 2   | Find XOR Sum of All Pairs Bitwise AND | Math + bits     |
| 3   | Count Pairs With XOR in a Range       | Trie + counting |
| 4   | Maximize Score After N Operations     | Bitmask DP      |
| 5   | Smallest Sufficient Team              | Bitmask DP      |

---

## Quick Reference Cheat Sheet <a name="cheat-sheet"></a>

### 🎯 Operations Cheat Sheet

```java
// ═══════════════════════════════════════════════════════════════
//                    BIT MANIPULATION CHEAT SHEET
// ═══════════════════════════════════════════════════════════════

// ─────────────── BASIC OPERATIONS ───────────────
n & 1           // Check if odd (1) or even (0)
n & (1 << i)    // Check if bit i is set
n | (1 << i)    // Set bit i
n & ~(1 << i)   // Clear bit i
n ^ (1 << i)    // Toggle bit i

// ─────────────── POWER OF 2 ───────────────
n & (n-1) == 0  // Is power of 2? (n > 0)
n & (-n)        // Lowest set bit value
1 << k          // 2^k

// ─────────────── CLEAR BITS ───────────────
n & (n-1)       // Clear lowest set bit
n & ~((1 << i) - 1)  // Clear bits 0 to i-1 (rightmost i bits)
n & ((1 << i) - 1)   // Clear bits from i to MSB (keep rightmost i bits)

// ─────────────── MATH WITH BITS ───────────────
n << k          // n * 2^k
n >> k          // n / 2^k (signed)
n >>> k         // n / 2^k (unsigned)
(n + (1 << k) - 1) >> k  // Ceiling of n / 2^k

// ─────────────── XOR MAGIC ───────────────
a ^ 0 = a       // Identity
a ^ a = 0       // Self-inverse
a ^ b ^ a = b   // Cancellation
// Swap: a ^= b; b ^= a; a ^= b;

// ─────────────── MASKS ───────────────
(1 << n) - 1           // n ones: 0...0111...1
~((1 << n) - 1)        // n zeros at end: 1...1000...0
((1 << k) - 1) << i    // k ones starting at position i

// ─────────────── COUNTING ───────────────
Integer.bitCount(n)    // Count set bits
Integer.numberOfLeadingZeros(n)  // Leading zeros
Integer.numberOfTrailingZeros(n) // Trailing zeros
Integer.highestOneBit(n)  // Highest set bit value
Integer.lowestOneBit(n)   // Lowest set bit value

// ─────────────── COMMON PATTERNS ───────────────
// Count bits manually (Brian Kernighan)
while (n != 0) { n &= (n-1); count++; }

// Iterate all subsets of n elements
for (int mask = 0; mask < (1 << n); mask++)

// Iterate all subsets of a mask
for (int sub = mask; sub > 0; sub = (sub-1) & mask)

// Get/Set bit at position
getBit:  (n >> i) & 1
setBit:  n | (1 << i)
clearBit: n & ~(1 << i)
```

### Common Edge Cases

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE CASES TO WATCH                          │
├─────────────────────────────────────────────────────────────────┤
│  • Negative numbers (sign bit handling)                         │
│  • Integer overflow (when shifting)                             │
│  • Empty array (XOR of nothing = 0)                             │
│  • n = 0 (special case for many operations)                     │
│  • n = Integer.MIN_VALUE (-2^31, cannot negate)                 │
│  • Shift by 32 or more (undefined behavior)                     │
│  • Java >> vs >>> (signed vs unsigned shift)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Interview Tips

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERVIEW STRATEGIES                         │
├─────────────────────────────────────────────────────────────────┤
│  1. When you see "O(1) space" - think bits                      │
│  2. When elements appear k times - think XOR or bit counting    │
│  3. When dealing with subsets - think bitmask                   │
│  4. When finding unique/missing - think XOR                     │
│  5. When asked "power of 2" - think n & (n-1)                   │
│  6. When optimizing arithmetic - think shifts                   │
│  7. Always mention time/space complexity                        │
│  8. Test with examples: 0, 1, negative, MAX_VALUE               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: The 3 Most Important Things

```
╔═══════════════════════════════════════════════════════════════╗
║     MASTER THESE 3 AND YOU'LL SOLVE 80% OF BIT PROBLEMS       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. XOR PROPERTIES                                            ║
║     a ^ a = 0, a ^ 0 = a                                      ║
║     → Find single/missing numbers                             ║
║                                                               ║
║  2. n & (n-1) TRICK                                           ║
║     Clears rightmost set bit                                  ║
║     → Count bits, check power of 2                            ║
║                                                               ║
║  3. BITMASK FOR SUBSETS                                       ║
║     n-bit number represents subset of n elements              ║
║     → Subset DP, permutations, combinations                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### Topical Breadth — Bit Operation Selection Trade-offs

Bit manipulation techniques form a trade-off spectrum between explicit bit-level control and standard arithmetic. **Bitwise AND/OR/XOR** versus **arithmetic operations**: bit ops are O(1) hardware-level instructions (execute in 1 CPU cycle) and are the preferred choice for flag operations, bitmask extraction, and setting individual bits — the trade-off is that they are NOT faster than arithmetic for actual mathematical computation (e.g., `n << 1` vs `n * 2` compile to identical machine code on most modern compilers; the perceived speed of bit shifts is a micro-optimization from the 1970s that compilers now eliminate). Use bit ops for flag/enum masking, set-bit tests, and bit-level algorithmic tricks (XOR swap, bitwise trie). Use arithmetic for actual multiplication/division. **Signed right shift (`>>`)** versus **unsigned right shift (`>>>`)**: in Java, `>>` is an arithmetic shift that replicates the sign bit (preserving sign), while `>>>` is a logical shift that always fills with zeros. This is the critical two's complement vs sign-magnitude trade-off: two's complement allows a single representation for 0 and uniform shift behavior, while sign-magnitude would require separate handling for negative numbers. The practical rule: use `>>>` for any operation that treats the number as an unsigned bit pattern (hash codes, color values, network addresses); use `>>` for signed arithmetic division by powers of 2. **Two's complement** versus **sign-magnitude**: two's complement won because it has a single zero representation (all bits 0), the range is asymmetric (e.g., -128 to +127 for 8-bit), and the same addition circuit handles both positive and negative numbers without special case logic — the trade-off is that the most negative number has no positive counterpart (e.g., `Integer.MIN_VALUE = -2147483648` cannot be negated without overflow). Use two's complement arithmetic everywhere in Java; always use `>>>` when you need the raw bit pattern of a negative number.

| Trade-off                          | Approach A        | Approach B              | Winner                     | Reason                                     |
| ---------------------------------- | ----------------- | ----------------------- | -------------------------- | ------------------------------------------ |
| Flag ops vs arithmetic             | Bitwise &, \|, ^  | Arithmetic with % and / | Bitwise                    | Direct bit access; arithmetic hides intent |
| Arithmetic vs shifts               | `n * 2`           | `n << 1`                | Equal (compiler optimizes) | Modern JIT eliminates the difference       |
| Signed vs unsigned shift           | `>>` (arithmetic) | `>>>` (logical)         | Context-dependent          | Use `>>>` for raw bit patterns             |
| Two's complement vs sign-magnitude | Two's complement  | Sign-magnitude          | Two's complement           | Single zero, uniform add circuit           |

Select **bit ops** for flag manipulation, set checking, and XOR-pattern problems. Select **arithmetic** for mathematical computation (clarity wins). Use **`>>>`** whenever treating a signed integer as an unsigned bit vector (e.g., reading the sign bit as a magnitude bit).

**Next Steps:**

1. Solve all Easy problems first (build confidence)
2. Master the XOR patterns (most interview questions)
3. Practice bitmask DP (for harder interviews)
4. Time yourself - most bit problems should take < 15 min

**Pro Tip:** When stuck on a bit problem, write out the binary representation and trace through manually. Visual understanding beats memorization!

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Correctness — 8 min)**: Prove that `x ^ x = 0` for any 32-bit integer x. Use this to prove the "missing number" algorithm: given an array containing every integer from 0 to n except one, XOR all indices with all values to find the missing number.

<details><summary>Model Answer</summary>

**`x ^ x = 0`**: XOR is bitwise. For any bit position i: `bit_i(x) XOR bit_i(x) = 0` (same values cancel). Applying across all 32 bits: every bit of `x ^ x` is 0. ✓

**Missing number algorithm**: Let `result = 0`. For i from 0 to n: `result ^= i`. For each value v in the array: `result ^= v`. Every integer from 0 to n that IS present is XORed twice (once as index, once as value) → cancels to 0. The missing integer appears only once (as an index) → remains in `result`. ✓

```java
int findMissing(int[] nums, int n) {
    int result = 0;
    for (int i = 0; i <= n; i++) result ^= i;
    for (int v : nums) result ^= v;
    return result;
}
```
**Time**: O(n). **Space**: O(1). No sorting, no hash set.

</details>

---

**Problem 2 (Analysis — 6 min)**: Brian Kernighan's bit-count: `int count = 0; while (n != 0) { n &= (n-1); count++; }`. Prove this runs in O(k) where k is the number of set bits, not O(32).

<details><summary>Model Answer</summary>

**Key observation**: `n & (n-1)` clears the lowest set bit of n.

**Why**: If the lowest set bit is at position p:
- n binary: `...1 0...0` (bit p=1, bits 0..p-1=0)
- (n-1) binary: `...0 1...1` (bit p=0, bits 0..p-1=1)
- `n & (n-1)`: bit p = `1 & 0` = 0; bits 0..p-1 = `0 & 1` = 0; higher bits unchanged.

Each iteration removes exactly one set bit → loop runs exactly k times → **O(k)**. For sparse integers (few set bits), vastly faster than the naïve 32-iteration approach.

</details>

---

**Problem 3 (Design — 8 min)**: An array has n elements where every element appears exactly three times, except one which appears once. Find it in O(n) time, O(1) space. State and prove the invariant.

<details><summary>Model Answer</summary>

**Invariant**: For each bit position, count how many elements have that bit set mod 3. If count ≡ 0 (mod 3) → unique element has 0 in that position. If count ≡ 1 (mod 3) → unique element has 1 in that position. This holds because every "triple" element contributes 3 ≡ 0 (mod 3), while the unique element contributes exactly 1.

```java
int singleNumber(int[] nums) {
    int ones = 0, twos = 0;
    for (int n : nums) {
        ones = (ones ^ n) & ~twos;  // bits seen 1 (mod 3) times
        twos = (twos ^ n) & ~ones;  // bits seen 2 (mod 3) times
    }
    return ones;  // bits seen exactly once after full pass
}
```

**Proof**: After processing a "triple" element, `ones` and `twos` both return to their pre-element state (bits go through 0→1→2→0). After processing the unique element once, its bits move into `ones` and stay there. ✓

</details>

---

## 📎 Reference Anchor

**OpenJDK `Integer` and `Long` bit operations (JVM intrinsics)**
- `Integer.bitCount(n)`: [Integer.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/Integer.java) — parallel popcount SWAR technique; JIT converts to a single `POPCNT` CPU instruction on x86. O(1) hardware time.
- `Integer.numberOfTrailingZeros(n)` / `Integer.highestOneBit(n)`: JVM intrinsics mapping to `BSF`/`BSR` x86 instructions.
- **Local rewrite rule**: `n & (n-1)` (Brian Kernighan) clears the lowest set bit. Use it to count set bits in O(k) where k = popcount — faster than iterating all 32 positions for sparse bit sets.
- **Constraint warning**: Java `>>` is arithmetic (sign-extends). Java `>>>` is logical (zero-fills). For unsigned bit math, always use `>>>`. Using `>> 1` on a negative number in a `while (n != 0)` loop causes an infinite loop.

---

## When Bit Manipulation Breaks

### 1. Operator Precedence — Bitwise vs Comparison
**What breaks**: `if (n & 1 == 0)` evaluates as `if (n & (1 == 0))` = `if (n & 0)` = always false. Comparison operators have HIGHER precedence than bitwise `&`, `|`, `^` in Java.
**Fix**: Always parenthesize: `if ((n & 1) == 0)`. This is the #1 silent bug in bit manipulation.

### 2. Signed Right Shift on Negative Numbers
**What breaks**: `n >>= 1` on negative n fills with 1 (arithmetic shift). `while (n != 0) { n >>= 1; }` is an infinite loop for any negative n.
**Fix**: Use `n >>>= 1` (unsigned shift) for bit-counting loops.

### 3. Integer Overflow in Left Shift
**What breaks**: `1 << 31` = `Integer.MIN_VALUE` in Java (−2147483648), not 2³¹ = 2147483648. `1 << 32` = 1 (shift amount is mod 32). Both are silent — no exception.
**Fix**: Use `1L << n` when you need bit positions beyond 30.

### 4. XOR Swap Aliasing
**What breaks**: `a ^= b; b ^= a; a ^= b;` when a and b are the SAME variable. `a ^= a` sets it to 0; all three operations produce 0.
**Fix**: Guard with `if (a != b)` or use a temp variable.

---

## Brute Force → Optimal: Count Set Bits in Range

**Brute Force — O(n log n):**
```java
int count = 0;
for (int i = 1; i <= n; i++) count += Integer.bitCount(i);  // too slow for n=10^9
```

**Optimal — O(log n) digit DP per bit position:**
```java
int total = 0;
for (int k = 0; k < 30; k++) {
    int cycle = 1 << (k+1), half = cycle >> 1;
    total += (n / cycle) * half + Math.max(0, (n % cycle) - half + 1);
}
```
**Why**: Bit k has period `2^(k+1)` and is set for exactly `2^k` consecutive numbers per period. Count full periods + remainder.

---

## Proof Corner: XOR Identities

1. **Self-cancellation**: `a ^ a = 0`. Each bit: `0 XOR 0 = 0`, `1 XOR 1 = 0`. □
2. **Self-inverse**: `a ^ b ^ b = a ^ 0 = a` (by associativity + self-cancellation). □
3. **Find unique**: XOR of array where every element appears twice except one = the unique element. *Proof*: XOR is commutative and associative; pairs cancel by (1); unique element XORs with 0 = itself. □

**Consequence**: Every XOR trick (missing number, single-non-repeating, single-in-triples) is an application of identity (3) under appropriate grouping.


---

[← Common Patterns & Templates](05_common_patterns_templates.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md)
