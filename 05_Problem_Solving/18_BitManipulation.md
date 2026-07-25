> **Navigation**: [< Previous](17_HashMap_Hashing.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](19_Matrix.md)

> **Problems 18/22** | [Prev](17_HashMap_Hashing.md) | [Index](../00_MASTER_INDEX.md) | [Next](19_Matrix.md)

---

# 📚 SECTION 16: BIT MANIPULATION & MATH PROBLEMS

```
┌─────────────────────────────────────────────────────────────────┐
│              BIT MANIPULATION & MATH PATTERNS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BITS ARE THE ATOMS OF COMPUTATION                              │
│                                                                 │
│  Every integer in memory is already a sequence of bits.         │
│  Bit operations are single CPU instructions — O(1) each,        │
│  the fastest operations possible on any processor.              │
│                                                                 │
│   Decimal 13  →  Binary 1101                                    │
│                        ↑↑↑↑                                     │
│                  bit:  3210                                     │
│                                                                 │
│   13 = 1×2³ + 1×2² + 0×2¹ + 1×2⁰                                │
│      = 8   +  4   +  0   +  1                                   │
│                                                                 │
│  INTERVIEW FREQUENCY: ~5-8% of coding problems                  │
│  DIFFICULTY: Easy-Medium (tricks), Hard (bitmask DP)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 0: WHY Bit Manipulation — MIT/KTH Style

```
╔══════════════════════════════════════════════════════════════════════════════╗
║     BIT MANIPULATION — COMPLETE UNDERSTANDING & FORMAL FOUNDATIONS           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY THESE PROBLEMS MATTER                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Bit operations are O(1) CPU operations — the FASTEST possible. They replace  │
│ multiplication, division, and modulo in clever ways. Roughly 5-8% of         │
│ interview problems require bit manipulation knowledge.                       │
│                                                                              │
│ REAL-WORLD BIT MANIPULATION:                                                 │
│ • Permissions/Flags: Unix file permissions (rwx = 111₂ = 7)                  │
│ • Network masks: IP subnetting uses AND with bitmasks                        │
│ • Graphics: Alpha blending, color channels packed into 32-bit ints           │
│ • Cryptography: XOR is the foundation of stream ciphers                      │
│ • Compression: Huffman coding packs data at the bit level                    │
│ • Databases: Bitmap indices for fast filtering                               │
│ • Game dev: Feature flags, state compression, entity component systems       │
│                                                                              │
│ WHY INTERVIEWERS ASK THESE:                                                  │
│ • Tests LOW-LEVEL understanding of how computers work                        │
│ • Elegant O(1) space solutions exist where naive uses O(n) space             │
│ • Shows mathematical thinking and proof ability                              │
│ • Bitmask DP is a key technique for NP-hard problems with small n            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ FORMAL FOUNDATION — THE SIX BITWISE OPERATORS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 1. AND (&): Both bits 1 → 1. Otherwise → 0                         │       │
│ │                                                                     │      │
│ │    1101  (13)          USE CASES:                                    │     │
│ │  & 1010  (10)          • Masking: extract specific bits             │      │
│ │  ──────                • Checking if a specific bit is set          │      │
│ │    1000  ( 8)          • Clearing bits (AND with 0 = clear)         │      │
│ │                        • n & 1 → check if odd                       │      │
│ └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 2. OR (|): Either bit 1 → 1. Both 0 → 0                            │       │
│ │                                                                     │      │
│ │    1101  (13)          USE CASES:                                    │     │
│ │  | 1010  (10)          • Setting specific bits to 1                 │      │
│ │  ──────                • Combining flags/permissions                │      │
│ │    1111  (15)          • Building bitmasks incrementally             │     │
│ └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 3. XOR (^): Different bits → 1. Same bits → 0                      │       │
│ │                                                                     │      │
│ │    1101  (13)          KEY PROPERTIES:                               │     │
│ │  ^ 1010  (10)          • a ^ a = 0    (self-cancel)                 │      │
│ │  ──────                • a ^ 0 = a    (identity)                    │      │
│ │    0111  ( 7)          • a ^ b = b ^ a (commutative)                │      │
│ │                        • (a^b)^c = a^(b^c) (associative)            │      │
│ │    USE CASES:                                                       │      │
│ │    • Find unique element (all pairs cancel)                         │      │
│ │    • Toggle bits on/off                                             │      │
│ │    • Swap without temp: a^=b; b^=a; a^=b;                          │       │
│ └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 4. NOT (~): Flip ALL bits. 0→1, 1→0                                 │      │
│ │                                                                     │      │
│ │    In Java: ~x = -(x + 1)  due to two's complement                 │       │
│ │    ~0  = -1    (all 1s in binary)                                   │      │
│ │    ~5  = -6    (flip 0...0101 → 1...1010 = -6)                     │       │
│ │    ~-1 =  0                                                         │      │
│ │                                                                     │      │
│ │    TWO'S COMPLEMENT RULE:                                           │      │
│ │    For n-bit signed integer: -x = ~x + 1                           │       │
│ │    So: -x = ~x + 1  →  ~x = -(x+1)                                │        │
│ └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 5. LEFT SHIFT (<<): Shift bits left, fill with 0s on right         │       │
│ │                                                                     │      │
│ │    5 << 1 = 10   (0101 → 1010)  = 5 × 2¹                          │        │
│ │    5 << 3 = 40   (0101 → 101000) = 5 × 2³                         │        │
│ │    EFFECT: Multiply by 2ᵏ                                          │       │
│ │    1 << k = 2ᵏ  (create mask with kth bit set)                     │       │
│ └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐      │
│ │ 6. RIGHT SHIFT                                                      │      │
│ │                                                                     │      │
│ │    >> (Arithmetic / Signed):                                        │      │
│ │      Shift right, fill with SIGN BIT (preserves sign)              │       │
│ │      20 >> 2 = 5     (positive: fill with 0)                       │       │
│ │      -20 >> 2 = -5   (negative: fill with 1)                       │       │
│ │      EFFECT: Divide by 2ᵏ (rounds toward -∞)                       │       │
│ │                                                                     │      │
│ │    >>> (Logical / Unsigned — Java specific):                        │      │
│ │      Shift right, ALWAYS fill with 0                               │       │
│ │      -1 >>> 1 = 2147483647  (0111...1111)                          │       │
│ │      Used when treating int as unsigned bit pattern                 │      │
│ └─────────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ESSENTIAL TRICKS TABLE                                                       │
├────────────────────────────┬─────────────────────┬───────────────────────────┤
│ Trick                      │ Code                │ Why It Works              │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Check if power of 2        │ n > 0 &&            │ Only one bit set.         │
│                            │ (n & (n-1)) == 0    │ n-1 flips all lower bits  │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Get lowest set bit         │ n & (-n)            │ Two's complement:         │
│                            │                     │ -n = ~n + 1               │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Clear lowest set bit       │ n & (n - 1)         │ Brian Kernighan's trick.  │
│                            │                     │ n-1 flips lowest 1 and    │
│                            │                     │ all bits below it         │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Count set bits             │ while(n) {          │ Kernighan O(k) where      │
│ (popcount)                 │   count++;          │ k = number of set bits.   │
│                            │   n &= (n-1);       │ Each iteration clears     │
│                            │ }                   │ exactly one set bit       │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Check ith bit              │ (n >> i) & 1        │ Shift bit i to position   │
│                            │                     │ 0, mask with 1            │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Set ith bit                │ n | (1 << i)        │ OR with mask: places 1    │
│                            │                     │ at position i             │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Clear ith bit              │ n & ~(1 << i)       │ AND with inverse mask:    │
│                            │                     │ places 0 at position i    │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Toggle ith bit             │ n ^ (1 << i)        │ XOR with mask: flips      │
│                            │                     │ bit at position i         │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Check if odd               │ n & 1               │ Lowest bit = 1 means odd  │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Multiply by 2ᵏ            │ n << k              │ Shift left = ×2ᵏ           │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Divide by 2ᵏ              │ n >> k              │ Shift right = ÷2ᵏ          │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Swap without temp          │ a^=b; b^=a; a^=b;  │ XOR self-cancel property   │
├────────────────────────────┼─────────────────────┼───────────────────────────┤
│ Get all 1s mask            │ ~0 or -1            │ All bits set in two's     │
│                            │                     │ complement                │
└────────────────────────────┴─────────────────────┴───────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ SUBSET GENERATION VIA BITMASK                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ For n elements, iterate mask from 0 to 2ⁿ - 1.                               │
│ Each bit in the mask represents whether an element is included.              │
│                                                                              │
│ Example: elements = [a, b, c]  (n = 3)                                       │
│                                                                              │
│   mask = 0 (000) → {}          mask = 4 (100) → {c}                          │
│   mask = 1 (001) → {a}         mask = 5 (101) → {a, c}                       │
│   mask = 2 (010) → {b}         mask = 6 (110) → {b, c}                       │
│   mask = 3 (011) → {a, b}      mask = 7 (111) → {a, b, c}                    │
│                                                                              │
│ TOTAL SUBSETS = 2ⁿ                                                           │
│                                                                              │
│ PROOF: Each of the n elements has 2 choices (in or out).                     │
│        By the multiplication principle: 2 × 2 × ... × 2 (n times) = 2ⁿ       │
│                                                                              │
│ NUMBER OF SUBSETS WITH A GIVEN SUM:                                          │
│   Brute force: Generate all 2ⁿ subsets, compute sum, count matches.          │
│   Time: O(n × 2ⁿ).  For n ≤ 20, this is feasible (~20 million ops).          │
│   For larger n: use DP (0/1 knapsack counting variant).                      │
│                                                                              │
│ CODE PATTERN:                                                                │
│   for (int mask = 0; mask < (1 << n); mask++) {                              │
│       List<Integer> subset = new ArrayList<>();                              │
│       for (int i = 0; i < n; i++) {                                          │
│           if ((mask >> i & 1) == 1) subset.add(arr[i]);                      │
│       }                                                                      │
│       // process subset                                                      │
│   }                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES — MEMORIZE THESE                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. OPERATOR PRECEDENCE: & and | have LOWER precedence than ==                │
│    WRONG:  if (n & 1 == 0)        → parsed as n & (1 == 0) → n & 0           │
│    RIGHT:  if ((n & 1) == 0)      → always parenthesize bit operations!      │
│                                                                              │
│ 2. SIGNED vs UNSIGNED SHIFT:                                                 │
│    >> preserves sign bit (arithmetic shift)                                  │
│    >>> fills with 0 (logical shift)                                          │
│    For negative numbers: -8 >> 1 = -4, but -8 >>> 1 = 2147483644             │
│    Always think about whether your input can be negative!                    │
│                                                                              │
│ 3. INT OVERFLOW AT BIT 31:                                                   │
│    1 << 31 = Integer.MIN_VALUE (−2³¹) in Java, NOT 2³¹                       │
│    Use 1L << 31 for correct positive value with long.                        │
│    Shifting by ≥ 32 on int is UNDEFINED/wrapped: 1 << 32 = 1 (not 0)         │
│                                                                              │
│ 4. JAVA HAS NO UNSIGNED INT:                                                 │
│    Java int is always signed 32-bit two's complement.                        │
│    For problems with "unsigned" semantics, use long or Integer methods       │
│    like Integer.toUnsignedLong(), Integer.compareUnsigned()                  │
│                                                                              │
│ 5. XOR TRICKS ONLY WORK WITH EXACTLY 2 OCCURRENCES:                          │
│    "XOR all to find single" works when every OTHER element appears           │
│    exactly twice. With 3 occurrences, use bit-counting mod 3 instead.        │
│    Always verify the constraint: "every element appears twice except one"    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DECISION FLOWCHART — WHICH BIT TECHNIQUE?                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   "Find unique / missing element"  → XOR all elements                        │
│   "Check / set / toggle a flag"    → Masks with &, |, ^                      │
│   "Is power of 2?"                 → n & (n-1) == 0                          │
│   "Count set bits"                 → Kernighan's (n &= n-1 loop)             │
│   "Generate all subsets"           → Bitmask 0 to 2ⁿ-1                       │
│   "Optimize NP with small n≤20"    → Bitmask DP                              │
│   "Multiply / divide by 2ᵏ"       → Shift left / right                       │
│   "Elements appear k times"        → Count bits mod k                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 16.1 XOR Tricks (Easy)

### Problem #286: [Single Number](https://leetcode.com/problems/single-number/) (LC 136)

## Single Number — Every Element Appears Twice Except One

Input: [4, 1, 2, 1, 2]
Output: 4

**Approach**: XOR all elements together.

**Why**: XOR properties guarantee:

- a ^ a = 0 (pairs cancel)
- a ^ 0 = a (identity)
- Commutative + associative → order doesn't matter

**Trace**:
4 ^ 1 ^ 2 ^ 1 ^ 2
= 4 ^ (1 ^ 1) ^ (2 ^ 2) ← rearrange (commutative)
= 4 ^ 0 ^ 0
= 4 ← answer!

**Proof Of Correctness**:
Let S = {a₁, a₁, a₂, a₂, ..., aₖ, aₖ, x} where x is unique
XOR(S) = a₁⊕a₁ ⊕ a₂⊕a₂ ⊕ ... ⊕ aₖ⊕aₖ ⊕ x
= 0 ⊕ 0 ⊕ ... ⊕ 0 ⊕ x = x ∎
Time: O(n) Space: O(1)

**Full Solution:**

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;     // pairs cancel: a ^ a = 0
    }
    return result;         // only the unique element remains
}
```

---

### Problem #287: [Missing Number](https://leetcode.com/problems/missing-number/) (LC 268)

```
┌────────────────────────────────────────────────────────────────┐
│  MISSING NUMBER — Array of [0..n] with one number missing      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  [3, 0, 1]   (n = 3, range [0..3])                     │
│  Output: 2                                                     │
│                                                                │
│  APPROACH: XOR all indices [0..n] with all values.             │
│  Paired index-value cancel, missing number remains.            │
│                                                                │
│  TRACE:                                                        │
│    Index: 0  1  2  (plus n=3)                                  │
│    Value: 3  0  1                                              │
│                                                                │
│    XOR of indices+n: 0 ^ 1 ^ 2 ^ 3                             │
│    XOR of values:    3 ^ 0 ^ 1                                 │
│    Combined: 0^1^2^3 ^ 3^0^1                                   │
│            = (0^0) ^ (1^1) ^ (3^3) ^ 2                         │
│            = 0 ^ 0 ^ 0 ^ 2 = 2  ✓                              │
│                                                                │
│  PROOF: Every number except the missing one appears as both    │
│  an index and a value → cancels. The missing one appears only  │
│  as an index → remains.  ∎                                     │
│                                                                │
│  Time: O(n)   Space: O(1)                                      │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int missingNumber(int[] nums) {
    int xor = nums.length;           // start with n (the extra index)
    for (int i = 0; i < nums.length; i++) {
        xor ^= i ^ nums[i];         // XOR index and value together
    }
    return xor;
}
```

---

### Problem #288: [Single Number II](https://leetcode.com/problems/single-number-ii/) (LC 137)

```
┌────────────────────────────────────────────────────────────────┐
│  SINGLE NUMBER II — Every element appears 3 times except one   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  [2, 2, 3, 2]                                          │
│  Output: 3                                                     │
│                                                                │
│  XOR won't work (a^a^a = a, not 0)!                            │
│                                                                │
│  APPROACH: Count bits mod 3                                    │
│  For each bit position (0 to 31):                              │
│    Count how many numbers have that bit set.                   │
│    If count % 3 ≠ 0, the unique number has that bit set.       │
│                                                                │
│  TRACE (bit-by-bit):                                           │
│    nums = [2(10), 2(10), 3(11), 2(10)]                         │
│                                                                │
│    Bit 0: counts = 0+0+1+0 = 1.  1 % 3 = 1 → bit 0 is SET      │
│    Bit 1: counts = 1+1+1+1 = 4.  4 % 3 = 1 → bit 1 is SET      │
│    Result = 11₂ = 3  ✓                                         │
│                                                                │
│  PROOF: If a number appears 3 times, its contribution to each  │
│  bit position is divisible by 3 → vanishes under mod 3.        │
│  The unique number's bits remain.  ∎                           │
│                                                                │
│  Time: O(32n) = O(n)   Space: O(1)                             │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution (Bit Counting):**

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        int bitSum = 0;
        for (int num : nums) {
            bitSum += (num >> i) & 1;    // count 1s at position i
        }
        if (bitSum % 3 != 0) {
            result |= (1 << i);          // set bit i in result
        }
    }
    return result;
}
```

**Advanced Solution (State Machine — ones/twos):**

```java
// State machine: tracks bit counts mod 3 using two variables
// ones: bits that have appeared 1 mod 3 times
// twos: bits that have appeared 2 mod 3 times
// When count reaches 3, both reset to 0
public int singleNumberStateMachine(int[] nums) {
    int ones = 0, twos = 0;
    for (int num : nums) {
        // ones = bits seen 1 time (not yet seen 2 times)
        ones = (ones ^ num) & ~twos;
        // twos = bits seen 2 times (not yet seen 3 times)
        twos = (twos ^ num) & ~ones;
    }
    return ones;  // bits that appeared exactly once
}
// Transitions:  (ones, twos)
//   Seen 0 times → (0,0)
//   Seen 1 time  → (1,0)  ← ones captures it
//   Seen 2 times → (0,1)  ← twos captures it
//   Seen 3 times → (0,0)  ← reset! Both clear
```

---

### Problem #289: [Single Number III](https://leetcode.com/problems/single-number-iii/) (LC 260)

```
┌────────────────────────────────────────────────────────────────┐
│  SINGLE NUMBER III — TWO elements appear once, rest twice      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  [1, 2, 1, 3, 2, 5]                                    │
│  Output: [3, 5]                                                │
│                                                                │
│  STEP 1: XOR all → get xorAll = 3 ^ 5 = 6 (110)                │
│          This is XOR of the two unique numbers.                │
│                                                                │
│  STEP 2: Find rightmost set bit of xorAll.                     │
│          6 = 110 → rightmost set bit = 010 (bit 1)             │
│          diff = xorAll & (-xorAll) = 6 & (-6) = 2              │
│          This bit DIFFERS between the two unique numbers.      │
│                                                                │
│  STEP 3: Partition array into two groups based on that bit:    │
│          Group A (bit 1 = 0): [1, 1, 3]  → XOR = 3             │
│          Group B (bit 1 = 1): [2, 2, 5]  → XOR = 5             │
│                                                                │
│  PROOF: The two unique numbers differ in at least one bit.     │
│  Using that bit to partition ensures they land in DIFFERENT    │
│  groups. All duplicate pairs land in the SAME group (same      │
│  bits). Each group reduces to the standard Single Number.  ∎   │
│                                                                │
│  Time: O(n)   Space: O(1)                                      │
└────────────────────────────────────────────────────────────────┘
```

**Full Solution:**

```java
public int[] singleNumber(int[] nums) {
    // Step 1: XOR all → xor of the two unique numbers
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;

    // Step 2: Find rightmost set bit (differs between the two)
    int diff = xorAll & (-xorAll);

    // Step 3: Partition into two groups and XOR each
    int[] result = new int[2];
    for (int num : nums) {
        if ((num & diff) == 0) {
            result[0] ^= num;   // group where that bit is 0
        } else {
            result[1] ^= num;   // group where that bit is 1
        }
    }
    return result;
}
```

---

> 🔬 **Section Challenge — Single Number — Every Element Appears Twice Except One**

**Challenge 1 (Trace — XOR semantics):** Given `nums=[7, 3, 5, 3, 7]`, manually trace the XOR accumulation step by step. What is the binary representation after each XOR, and what is the final answer?

<details><summary>Answer</summary>

**Who executes?** One loop, one XOR per element. **When?** Each `result ^= num` executes in order. **What already exists?** `result=0` (identity) at start.

Step 1: `0 ^ 7 = 7` (0000...0111). Step 2: `7 ^ 3 = 4` (0111 ^ 0011 = 0100). Step 3: `4 ^ 5 = 1` (0100 ^ 0101 = 0001). Step 4: `1 ^ 3 = 2` (0001 ^ 0011 = 0010). Step 5: `2 ^ 7 = 5` (0010 ^ 0111 = 0101).

**Final answer = 5.** The XOR doesn't "wait" for pairs to be adjacent — the commutative and associative properties ensure that regardless of order, `7^7=0` and `3^3=0`, leaving only `5`.

</details>

**Challenge 2 (Debug):** A developer applies the XOR-all trick to `nums=[2, 2, 2, 3]`, expecting to find the unique element. What answer do they get and why is the XOR trick fundamentally broken for this input?

<details><summary>Answer</summary>

`2^2^2^3 = 0^2^3 = 2^3 = 1`. They get `1`, which is wrong. **Why?** The XOR trick relies on `a^a=0` — it cancels elements appearing **exactly twice**. `2` appears **three times** (odd count), so `2^2^2 = 2` (not 0). The unique element here is `3`, not `1`. For elements appearing 3 times, use **bit-counting mod 3** (Single Number II pattern): count set bits at each position, apply `% 3`, reconstruct the unique number. Always verify the precondition: the XOR trick only works when every non-unique element appears an **even** number of times.

</details>

## 16.2 Power & Counting (Easy-Medium)

### Problem #290: [Power of Two](https://leetcode.com/problems/power-of-two/) (LC 231)

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

### Problem #291: [Counting Bits](https://leetcode.com/problems/counting-bits/) (LC 338)

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

### Problem #292: [Number of 1 Bits / Hamming Weight](https://leetcode.com/problems/number-of-1-bits/) (LC 191)

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

### Problem #293: [Reverse Bits](https://leetcode.com/problems/reverse-bits/) (LC 190)

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

### Problem #294: [Hamming Distance](https://leetcode.com/problems/hamming-distance/) (LC 461)

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

## 16.3 Math Problems (Easy-Medium)

### Problem #295: [Reverse Integer](https://leetcode.com/problems/reverse-integer/) (LC 7)

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

### Problem #296: [Palindrome Number](https://leetcode.com/problems/palindrome-number/) (LC 9)

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

### Problem #297: [Add Binary](https://leetcode.com/problems/add-binary/) (LC 67)

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

### Problem #298: [Excel Sheet Column Title](https://leetcode.com/problems/excel-sheet-column-title/) (LC 168)

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

### Problem #299: [Maximum Product of Three Numbers](https://leetcode.com/problems/maximum-product-of-three-numbers/) (LC 628)

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

### Problem #300: [Kth Factor of N](https://leetcode.com/problems/kth-factor-of-n/) (LC 1492)

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

### Problem #301: [Happy Number](https://leetcode.com/problems/happy-number/) (LC 202)

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

### Problem #302: [Valid Square](https://leetcode.com/problems/valid-square/) (LC 593)

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

### Problem #303: [Max Points on a Line](https://leetcode.com/problems/max-points-on-a-line/) (LC 149)

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

## 16.4 Bitmask DP & Subsets

### Problem #304: Subsets Generation via Bitmask — Full Walkthrough

```
┌────────────────────────────────────────────────────────────────┐
│  GENERATE ALL SUBSETS OF [1, 2, 3] USING BITMASK               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  n = 3 elements → 2³ = 8 subsets                               │
│  Iterate mask from 0 to 7 (binary 000 to 111):                 │
│                                                                │
│  mask  binary  bits set for [1,2,3]  subset                    │
│  ────  ──────  ─────────────────────  ──────                   │
│    0    000     none                   {}                      │
│    1    001     index 0 → 1            {1}                     │
│    2    010     index 1 → 2            {2}                     │
│    3    011     index 0,1 → 1,2        {1, 2}                  │
│    4    100     index 2 → 3            {3}                     │
│    5    101     index 0,2 → 1,3        {1, 3}                  │
│    6    110     index 1,2 → 2,3        {2, 3}                  │
│    7    111     index 0,1,2 → 1,2,3   {1, 2, 3}                │
│                                                                │
│  PROOF OF 2ⁿ SUBSETS (Counting Argument):                      │
│  Each of the n elements independently chooses: IN or OUT.      │
│  Element 1: 2 choices                                          │
│  Element 2: 2 choices                                          │
│  Element 3: 2 choices                                          │
│  Total by multiplication principle = 2 × 2 × 2 = 2³ = 8.       │
│  In general: 2ⁿ.  ∎                                            │
│                                                                │
│  ALTERNATIVE PROOF (Bijection with binary strings):            │
│  There is a 1-to-1 mapping between subsets of {1,...,n}        │
│  and binary strings of length n. Each string encodes which     │
│  elements are included. Number of binary strings = 2ⁿ.  ∎      │
│                                                                │
│  Time: O(n × 2ⁿ)   Space: O(n × 2ⁿ) for storing all subsets    │
└────────────────────────────────────────────────────────────────┘
```

**Full Walkthrough Implementation:**

```java
public List<List<Integer>> subsets(int[] nums) {
    int n = nums.length;
    List<List<Integer>> result = new ArrayList<>();

    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask >> i & 1) == 1) {  // check if bit i is set
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;  // contains exactly 2ⁿ subsets
}
```

---

### Problem #305: Number of Subsets with Given Sum

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT SUBSETS WITH SUM = TARGET                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input:  nums = [1, 2, 3, 4, 5], target = 5                    │
│  Output: 3  → {5}, {2,3}, {1,4}                                │
│                                                                │
│  METHOD 1: BITMASK BRUTE FORCE (for n ≤ 20)                    │
│  Enumerate all 2ⁿ subsets, compute sum, count matches.         │
│  Time: O(n × 2ⁿ)                                               │
│                                                                │
│  METHOD 2: DP (0/1 Knapsack counting — for larger n)           │
│  dp[j] = number of subsets with sum j.                         │
│  For each num: for j from target down to num:                  │
│    dp[j] += dp[j - num]                                        │
│  Answer: dp[target]                                            │
│  Time: O(n × target)   Space: O(target)                        │
│                                                                │
│  TRACE of DP (target=5):                                       │
│  Init:  dp = [1, 0, 0, 0, 0, 0]  (1 way to make sum 0: {})     │
│  num=1: dp = [1, 1, 0, 0, 0, 0]                                │
│  num=2: dp = [1, 1, 1, 1, 0, 0]                                │
│  num=3: dp = [1, 1, 1, 2, 1, 1]                                │
│  num=4: dp = [1, 1, 1, 2, 2, 2]                                │
│  num=5: dp = [1, 1, 1, 2, 2, 3]  → answer = dp[5] = 3  ✓       │
└────────────────────────────────────────────────────────────────┘
```

**Full Solutions:**

```java
// Method 1: Bitmask (n ≤ 20)
public int countSubsetsWithSumBitmask(int[] nums, int target) {
    int n = nums.length, count = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            if ((mask >> i & 1) == 1) sum += nums[i];
        }
        if (sum == target) count++;
    }
    return count;
}

// Method 2: DP (0/1 Knapsack counting)
public int countSubsetsWithSumDP(int[] nums, int target) {
    int[] dp = new int[target + 1];
    dp[0] = 1;  // empty subset has sum 0
    for (int num : nums) {
        for (int j = target; j >= num; j--) {  // reverse to avoid reuse
            dp[j] += dp[j - num];
        }
    }
    return dp[target];
}
```

---

### Problem #306: [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) (LC 416)

```
┌────────────────────────────────────────────────────────────────┐
│  PARTITION EQUAL SUBSET SUM                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Can we partition array into two subsets with equal sum?       │
│  Equivalent to: does a subset with sum = totalSum / 2 exist?   │
│                                                                │
│  APPROACH: 0/1 knapsack boolean DP (see DP section).           │
│  dp[j] = true if a subset with sum j exists.                   │
│    dp[0] = true                                                │
│    For each num: dp[j] |= dp[j - num]   (reverse order)        │
│                                                                │
│  Time: O(n × sum/2)   Space: O(sum/2)                          │
│  If totalSum is odd → immediately return false.                │
│                                                                │
│  Connection to bitmask: For small n, bitmask also works.       │
│  See Dynamic Programming section for full solution.            │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem #307: Ones and Zeroes (LC 474)

```
┌────────────────────────────────────────────────────────────────┐
│  ONES AND ZEROES — Max strings fitting m zeros and n ones      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Given binary strings, at most m 0s and n 1s, find max         │
│  number of strings formable.                                   │
│                                                                │
│  APPROACH: 2D 0/1 knapsack DP.                                 │
│  dp[i][j] = max strings using at most i zeros and j ones.      │
│  For each string with z zeros and o ones:                      │
│    for i from m downto z, j from n downto o:                   │
│      dp[i][j] = max(dp[i][j], dp[i-z][j-o] + 1)                │
│                                                                │
│  Time: O(len × m × n)   Space: O(m × n)                        │
│  See Dynamic Programming section for full solution.            │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 BIT TRICKS REFERENCE TABLE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPREHENSIVE BIT TRICKS REFERENCE                        ║
╠════════════════════════════════════╦══════════════════════╦══════════════════╣
║ Operation                          ║ Code                 ║ Complexity       ║
╠════════════════════════════════════╬══════════════════════╬══════════════════╣
║ Check if n is even                 ║ (n & 1) == 0         ║ O(1)             ║
║ Check if n is odd                  ║ (n & 1) == 1         ║ O(1)             ║
║ Multiply by 2                      ║ n << 1               ║ O(1)             ║
║ Divide by 2                        ║ n >> 1               ║ O(1)             ║
║ Multiply by 2ᵏ                     ║ n << k               ║ O(1)             ║
║ Divide by 2ᵏ                       ║ n >> k               ║ O(1)             ║
║ Check ith bit set                  ║ (n >> i) & 1         ║ O(1)             ║
║ Set ith bit                        ║ n │ (1 << i)         ║ O(1)             ║
║ Clear ith bit                      ║ n & ~(1 << i)        ║ O(1)             ║
║ Toggle ith bit                     ║ n ^ (1 << i)         ║ O(1)             ║
║ Clear lowest set bit               ║ n & (n - 1)          ║ O(1)             ║
║ Isolate lowest set bit             ║ n & (-n)             ║ O(1)             ║
║ Check power of 2                   ║ n>0 && (n&(n-1))==0  ║ O(1)             ║
║ Count set bits (Kernighan)         ║ while(n){n&=n-1;c++} ║ O(k), k=popcount ║
║ Count set bits (Java)              ║ Integer.bitCount(n)   ║ O(1)            ║
║ Reverse bits                       ║ Integer.reverse(n)    ║ O(1)            ║
║ Highest set bit position           ║ 31-Integer.           ║ O(1)            ║
║                                    ║ numberOfLeadingZeros  ║                 ║
║ Lowest set bit position            ║ Integer.              ║ O(1)            ║
║                                    ║ numberOfTrailingZeros ║                 ║
║ Generate all subsets               ║ mask: 0..2ⁿ-1        ║ O(n × 2ⁿ)        ║
║ Swap without temp                  ║ a^=b; b^=a; a^=b     ║ O(1)             ║
║ Absolute value (no branch)         ║ (n^(n>>31))-(n>>31)  ║ O(1)             ║
║ XOR all to find unique             ║ reduce by ^           ║ O(n)            ║
║ Turn off rightmost consecutive 1s  ║ n & (n + 1)          ║ O(1)             ║
║ Create mask: bits [0..i]           ║ (1 << (i+1)) - 1     ║ O(1)             ║
╚════════════════════════════════════╩══════════════════════╩══════════════════╝
```

---

## 📊 SUBSET MATHEMATICS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SUBSET MATHEMATICS REFERENCE                          ║
╠═════════════════════════════════╦═══════════════════╦════════════════════════╣
║ Property                        ║ Formula           ║ Example (n = 3)        ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Total subsets                   ║ 2ⁿ                ║ 2³ = 8                 ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Subsets of size k               ║ C(n, k)           ║ C(3,1) = 3             ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Non-empty subsets               ║ 2ⁿ - 1            ║ 8 - 1 = 7              ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Subsets with sum S              ║ Count via DP or   ║ varies                 ║
║                                 ║ bitmask           ║                        ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Subsets containing element x    ║ 2ⁿ⁻¹              ║ 2² = 4                 ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Subsets NOT containing x        ║ 2ⁿ⁻¹              ║ 2² = 4                 ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Sum of all subset sizes         ║ n × 2ⁿ⁻¹          ║ 3 × 4 = 12             ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Number of pairs of subsets      ║ 3ⁿ                ║ 3³ = 27                ║
║ (A ⊆ B ⊆ {1..n})               ║                   ║ (each elem: out,A,B)    ║
╠═════════════════════════════════╬═══════════════════╬════════════════════════╣
║ Identity: Σ C(n,k) = 2ⁿ        ║ Binomial theorem  ║ C(3,0)+C(3,1)+C(3,2)    ║
║ for k=0..n                      ║ with x=1          ║ +C(3,3)=1+3+3+1=8      ║
╚═════════════════════════════════╩═══════════════════╩════════════════════════╝

PROOFS:
  • Subsets containing x: Fix x as IN. Remaining n-1 elements each have 2 choices → 2ⁿ⁻¹.
  • Sum of subset sizes: Each element appears in 2ⁿ⁻¹ subsets. Summed over n elements → n × 2ⁿ⁻¹.
  • C(n,k) identity: (1+1)ⁿ = Σ C(n,k) × 1ᵏ × 1ⁿ⁻ᵏ = Σ C(n,k) = 2ⁿ.
```

---

## 🏆 MASTERY CHECKLIST

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BIT MANIPULATION MASTERY CHECKLIST                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FUNDAMENTALS (must be instant — no thinking required)                       ║
║  [ ] I can explain AND, OR, XOR, NOT, <<, >> in my sleep                     ║
║  [ ] I know XOR properties: a^a=0, a^0=a, commutative, associative           ║
║  [ ] I understand two's complement: -x = ~x + 1                              ║
║  [ ] I know operator precedence: ALWAYS parenthesize bit ops                 ║
║  [ ] I know Java has no unsigned int — when to use long                      ║
║                                                                              ║
║  ESSENTIAL TRICKS (should take < 30 seconds each)                            ║
║  [ ] Check/set/clear/toggle ith bit                                          ║
║  [ ] n & (n-1): clear lowest bit, check power of 2                           ║
║  [ ] n & (-n): isolate lowest set bit                                        ║
║  [ ] Brian Kernighan's popcount loop                                         ║
║  [ ] XOR to find unique element (single/double/triple variants)              ║
║                                                                              ║
║  PROBLEM PATTERNS (know which technique to apply)                            ║
║  [ ] Single Number I/II/III — XOR + bit counting                             ║
║  [ ] Missing Number — XOR indices with values                                ║
║  [ ] Power of Two — n & (n-1) trick                                          ║
║  [ ] Counting Bits — DP with n & (n-1)                                       ║
║  [ ] Hamming Weight/Distance — Kernighan's + XOR                             ║
║  [ ] Reverse Bits — extract & build loop                                     ║
║                                                                              ║
║  MATH PROBLEMS (know the patterns)                                           ║
║  [ ] Reverse Integer — digit extraction + overflow check BEFORE multiply     ║
║  [ ] Palindrome Number — reverse half, compare halves                        ║
║  [ ] Add Binary — carry simulation                                           ║
║  [ ] Max Points on Line — slope HashMap with GCD normalization               ║
║                                                                              ║
║  BITMASK & SUBSETS (advanced — know when to use)                             ║
║  [ ] Generate all 2ⁿ subsets via bitmask                                     ║
║  [ ] Count subsets with given sum (bitmask brute force + DP)                 ║
║  [ ] Prove 2ⁿ subsets by counting argument                                   ║
║  [ ] Recognize when bitmask DP applies (n ≤ 20, NP-hard)                     ║
║  [ ] Partition Equal Subset Sum → 0/1 knapsack connection                    ║
║                                                                              ║
║  SPEED TARGETS                                                               ║
║  [ ] Single Number variants: < 3 minutes each                                ║
║  [ ] Power/Counting bit problems: < 5 minutes each                           ║
║  [ ] Math problems (reverse, palindrome): < 8 minutes each                   ║
║  [ ] Max Points on Line: < 15 minutes                                        ║
║  [ ] Bitmask subset generation: < 5 minutes                                  ║
║                                                                              ║
║  COMMON INTERVIEW FOLLOW-UPS                                                 ║
║  [ ] "Can you do it in O(1) space?" → bit manipulation                       ║
║  [ ] "What if elements appear k times?" → bit count mod k                    ║
║  [ ] "Handle overflow?" → check BEFORE operation                             ║
║  [ ] "What about negative numbers?" → two's complement                       ║
║  [ ] "Can you enumerate all subsets?" → bitmask                              ║
║                                                                              ║
║  PROGRESS: [ ] / 22 problems completed                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

> **End of Section 16** | [Prev](17_HashMap_Hashing.md) | [Index](../00_MASTER_INDEX.md) | [Next](19_Matrix.md)

---

> **Navigation**: [< Previous](17_HashMap_Hashing.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](19_Matrix.md)

---

### Historical Evolution

**Bit Manipulation** originated with Claude Shannon's groundbreaking **1937 master's thesis** at MIT, which demonstrated that Boolean algebra could implement electrical circuits for logical operations, establishing the theoretical foundation for all digital computation. Morris Strecker formalized two's complement representation in a **1970 paper** (also attributed to IBM's design team), solving the asymmetric range problem in binary arithmetic and enabling efficient signed integer representation that remains the universal standard today. Bitmask dynamic programming techniques emerged in **1960s-70s combinatorial optimization**, where researchers used bit vectors to efficiently represent and traverse exponential state spaces in problems like the traveling salesman and set covering. Modern bit manipulation powers cryptographic standards including AES (Advanced Encryption Standard, 2001) and SHA-256 hash functions, network protocol implementations for TCP/IP packet processing, and embedded systems programming where every bit of memory and every clock cycle matters. From optimizing GPU shaders to implementing fast hash functions and compression algorithms, bit-level operations remain essential knowledge for systems programmers, security engineers, and anyone working at the intersection of hardware and software.


---

## Reality Check

**"Bit problems in practice sets repeat the bit-trick catalog"** ? The practice layer adds PROOF OBLIGATIONS the catalog never demanded: single-number-II (every element thrice except one) needs per-bit-position modulo-3 counting or the two-variable automaton � and explaining WHY ones/twos masks work is the actual interview; single-number-III needs the argument that any set bit of the xor-of-all SEPARATES the two uniques. Reciting tricks answers the easy versions; owning the arguments answers the follow-ups.

**"Counting bits per number is independent work"** ? The DP relations make the range version O(n) total: bits[i] = bits[i >> 1] + (i & 1), or bits[i] = bits[i & (i-1)] + 1 � each number's count derives from a smaller number's in O(1). This problem is the cleanest demonstration that DP is not about grids and knapsacks but about ANY self-referential computation � a framing worth having when someone asks "where else does DP apply?"

**"Bitwise AND of a range is a loop"** ? The loop dies at range [1, 2^31-1]; the insight is that the AND of a range equals the COMMON PREFIX of lo and hi (everything below the first differing bit gets zeroed by some intermediate number). Shift-both-right-until-equal, shift back. The transferable move � reason about what an aggregate over a RANGE must preserve rather than iterating the range � reappears in OR/XOR range problems and in interval-reasoning generally.

**"Reverse-bits and swap-nibbles are byte-golf"** ? They teach the divide-and-conquer-on-bits idiom (swap halves, then quarters, then pairs � O(log w) for word width w) that underlies real hardware intrinsics, hash finalizers (MurmurHash's avalanche), and morton-code interleaving in spatial indexes. One derivation covers the family; and the Java-specific detail � the unsigned shift for the sign bit � is the same lesson the shift chapter teaches, now with consequences.

**"Bitmask-DP problems are graph problems that happen to use masks"** ? The mask IS the visited-set compressed to an int, and the practice-set point is the state-space arithmetic: 2^n masks times n positions fits at n up to 20 (TSP, min-cost-to-visit), submask enumeration totals 3^n (partition problems), and mask-plus-extra-state (shortest-path-visiting-all-nodes keys on mask AND current node) is where wrong answers concentrate � dropping the extra dimension merges distinct states. Constraint n up to 20 is the flashing sign; the visited-set-as-integer reframe is the unlock.
