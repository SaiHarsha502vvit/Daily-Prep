# 🧩 Bit Manipulation + Tricks — Pattern Guide

**Navigation**: [< Previous](19_Matrix_Plus_Grid_Traversal.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](21_Intervals_Pattern.md)

# Bit Manipulation + Tricks — Combined Pattern Guide

**WHY this matters?** Bit manipulation provides O(1) operations that replace expensive loops. XOR finds unique elements, bitmasks encode sets, and bit tricks optimize space and time.

### ⚠️ Constraint Lens

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Bit Manipulation](../03_Algorithms/10_Bit_Manipulation_Complete.md), binary numbers |
| **You will learn** | XOR cancellation, masks, lowest set bit, counting bits, subsets via bitmask |
| **Leads to** | [Knapsack/DP with bitmasks](23_Knapsack_Family.md), [Cyclic Sort](22_Cyclic_Sort_Pattern.md) |
| **Abstraction level** | Arithmetic on numbers → **bits as a set** → `O(1)` set operations |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Bit Manipulation + Tricks

### 1. The bottom line

Treat an integer as a tiny set of flags and use AND/OR/XOR/shift to change or test them in constant time.

### 2. The textbook core

- `x & (x−1)` clears the lowest set bit; `x & −x` isolates it.
- `a ^ a = 0`, `a ^ 0 = a`: XOR cancels pairs (single number).
- Subsets of `n ≤ ~20` elements: loop `mask` from 0 to `2ⁿ − 1`.
- Use `>>>` for unsigned shifts in Java.

### 3. The real-world analogy

A **row of light switches**: each switch is a bit; masks flip or read several at once.

### 4. Walkthrough

1. Single Number: `[4,1,2,1,2]`.
2. XOR all: `4 ^ 1 ^ 2 ^ 1 ^ 2`.
3. Pairs cancel to 0.
4. Result 4.

> [!NOTE]
> **Quick check:** Why does XOR find the unpaired value? *Equal values cancel and XOR is order-independent.*

---

### Historical Evolution

**Inventor / Originator:** Boolean logic in circuits: Claude Shannon's 1937 master's thesis. Information theory: Shannon, 1948. Error-correcting codes: Richard Hamming, 1950. Karnaugh maps: 1953. Gray code: Frank Gray's 1953 patent. Counting set bits by clearing the lowest one (`n & (n-1)`) was published by Peter Wegner in 1960 and later popularised by Kernighan and Ritchie.

**Predecessor context:** Programmers manipulated words arithmetically, unaware of constant-time bitwise shortcuts.

**Evolution narrative:** Collections of bit tricks circulated in HAKMEM (MIT AI Memo 239, 1972) and Henry Warren's *Hacker's Delight* (2002).

**Modern practice:** Flags and permissions, bitmask DP, hash mixing, compression, cryptography and low-level systems code.

- **Shannon — 1937/1948**: Boolean circuit design; information theory
- **Hamming — 1950**: Error-correcting codes and Hamming distance
- **Gray — 1953**: Reflected binary (Gray) code
- **Wegner — 1960**: Counting set bits by clearing the lowest set bit
- **HAKMEM — 1972**: Catalogue of bit-twiddling tricks

---

### Production Reality

**Pattern Mis-Selection Debug Workflow — How to identify the wrong pattern:**

When your solution is O(N²) when you expected O(N), or fails on specific inputs, the bug is usually pattern mis-selection, not code. Use this 5-step workflow:

1. **Check the constraint lens**: Did the input violate the pattern's prerequisite? (e.g., sorted input for two pointers, positive numbers for sliding window sum)
2. **Trace the failure input**: For the smallest failing case, identify which invariant broke. Does the algorithm assume the invariant that wasn't true?
3. **Measure the actual complexity**: Add a counter for the inner-loop iterations. O(N²) when O(N) expected usually means a redundant scan, not a wrong algorithm.
4. **Check edge cases the pattern doesn't cover**: Empty input, single element, all-same values, maximum/minimum values. These often reveal the wrong pattern.
5. **Escalate to a different pattern family**: If 4 steps don't fix it, the pattern itself is wrong. Switch to the pattern suggested by the constraint lens.

**Pattern-Specific Failure Modes:**

- **Signed right shift `>>` vs unsigned `>>>` (sign extension bug)** — In Java, `>>` sign-extends (preserves sign bit) while `>>>` zero-fills. For negative numbers, `>>` produces different results than `>>>`. For example, `-8 >> 1 = -4` but `-8 >>> 1 = 2147483644`. Detection: test with negative numbers; use `>>>` for bit manipulation on raw bits.

- **Integer overflow on shift past bit-width (e.g., `1 << 31` is negative)** — `1 << 31` evaluates to `Integer.MIN_VALUE` in Java (sign bit set). `1 << 32` equals `1` (mod 32 shift). Detection: test with edge values; use `1L << n` for large shifts.

- **Bit width >32 for `long` requires masking** — When extracting bits from a long, operations may produce unexpected sign extension. Detection: mask with `0xFFFFFFFFL` when extracting int-sized chunks from long.

**Production Selection Heuristic:** Use `>>>` for unsigned right shift. Use `1L` suffix for shifts on long values. Always verify bit operations with edge cases (0, -1, Integer.MIN_VALUE, Integer.MAX_VALUE).

---

| Given Constraints                | Do This                                   |
| -------------------------------- | ----------------------------------------- |
| `N <= 20` and subset choices     | bitmask enumeration / DP                  |
| exactly one unique, others twice | XOR all                                   |
| count set bits many times        | built-in bit count / DP bits              |
| need lowest set bit              | `x & -x`                                  |
| values may exceed `int`          | use `long` masks carefully                |
| `N > 63` subset mask             | cannot fit in one long; use arrays/BitSet |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

### 🧠 Deep Intuition — Why Bit Operations Are So Powerful

#### CPU-Native Operations — True O(1)

Bit operations (AND, OR, XOR, shift) are executed in a **single CPU cycle** — they're the fundamental operations that CPUs are literally built to perform. Compared to arithmetic operations (which may take multiple cycles) or hash lookups (which involve function calls, memory access), bit operations are as fast as computation gets.

#### XOR — The Most Useful Bit Operation

XOR has three magical properties that make it incredibly useful:

1. **Self-inverse**: `a ^ a = 0` (any number XORed with itself is zero)
2. **Identity**: `a ^ 0 = a` (XORing with zero leaves the number unchanged)
3. **Commutative & Associative**: order doesn't matter, grouping doesn't matter

These properties mean that if you XOR a collection of numbers where every number appears twice except one, all the pairs cancel out (`a ^ a = 0`), leaving only the unique number. This replaces an O(n) space HashMap solution with an O(1) space solution.

#### Two's Complement — Why `-n` Is `~n + 1`

In Java/C, negative numbers use **two's complement**: flip all bits and add 1. This means `-n = ~n + 1`. This is why `n & (-n)` gives the lowest set bit: `-n` has the same rightmost 1-bit as `n`, with all higher bits flipped. The AND isolates just that one bit.

#### Bitmask DP — Encoding Sets as Integers

A bitmask is an integer where each bit represents whether an element is "included" in a set. For n elements, there are 2ⁿ possible subsets, each represented by an n-bit integer. This allows DP over subsets: `dp[mask]` represents the answer for the subset encoded by `mask`. This is the foundation of solutions to TSP (Travelling Salesman Problem), assignment problems, and other NP-hard problems optimized from O(n!) to O(2ⁿ × n²).

⚠️ **Limitation**: Bitmask DP only works for n ≤ 20-25, because 2²⁰ ≈ 1 million states is manageable but 2³⁰ ≈ 1 billion is not.

---

## 🧠 WHEN TO RECOGNIZE

```
IF the problem says:
  ✅ "Single number" / "Find unique"
  ✅ "Power of 2" / "Count bits"
  ✅ "Subset enumeration" with bitmask
  ✅ "Without using +, -, *, /"
  ✅ "Swap without temp"
THEN → Bit Manipulation
```

---

## 📐 ESSENTIAL BIT OPERATIONS

### Cheat Sheet

```
Operation              Code                    Example (n=12 = 1100)
────────────────────────────────────────────────────────────────────
Check if bit i set     (n >> i) & 1            bit 2: (1100>>2)&1 = 1 ✓
Set bit i              n | (1 << i)            set bit 0: 1100|0001 = 1101
Clear bit i            n & ~(1 << i)           clear bit 2: 1100&1011 = 1000
Toggle bit i           n ^ (1 << i)            toggle bit 3: 1100^1000 = 0100
Lowest set bit         n & (-n)                1100 & 0100 = 0100 (rightmost 1)
Clear lowest set bit   n & (n-1)               1100 & 1011 = 1000
Is power of 2?         n > 0 && (n & (n-1)) == 0
Count set bits         Integer.bitCount(n)     bitCount(1100) = 2
```

### Key Patterns

```java
// XOR: a ^ a = 0, a ^ 0 = a
// Find single number in array where all others appear twice:
int single = 0;
for (int num : nums) single ^= num;  // pairs cancel out
return single;

// Subset enumeration with bitmask:
for (int mask = 0; mask < (1 << n); mask++) {
    for (int i = 0; i < n; i++) {
        if ((mask & (1 << i)) != 0) {
            // element i is in this subset
        }
    }
}
```

---

## 🔬 FULL WALKTHROUGH: Single Number (XOR trick)

```
Problem: Every element appears twice EXCEPT one. Find it.
         nums = [4, 1, 2, 1, 2]

Approach: XOR all elements. Duplicates cancel out (a ^ a = 0).

WHY it works:
  XOR properties: a ^ 0 = a,  a ^ a = 0,  commutative + associative

Step-by-step:
  result = 0
  0 ^ 4 = 4           (binary: 000 ^ 100 = 100)
  4 ^ 1 = 5           (binary: 100 ^ 001 = 101)
  5 ^ 2 = 7           (binary: 101 ^ 010 = 111)
  7 ^ 1 = 6           (binary: 111 ^ 001 = 110)  ← 1 cancels
  6 ^ 2 = 4           (binary: 110 ^ 010 = 100)  ← 2 cancels

  Answer: 4 ✅ (only the unique element survives)

Time: O(n) | Space: O(1)
Why not HashMap? HashMap works but uses O(n) space. XOR uses O(1).
```

---

## 🔬 FULL WALKTHROUGH 2: Subset Generation Using Bitmask

```
Problem: Generate all subsets of [a, b, c] using bit manipulation.

Approach: For n elements, there are 2ⁿ subsets. Each subset maps to a
          binary number from 0 to 2ⁿ-1. Bit i = 1 means include element i.

Step-by-step (n=3, so 2³=8 subsets):
  mask=000 (0): no bits set      → []
  mask=001 (1): bit 0 set        → [a]
  mask=010 (2): bit 1 set        → [b]
  mask=011 (3): bits 0,1 set     → [a, b]
  mask=100 (4): bit 2 set        → [c]
  mask=101 (5): bits 0,2 set     → [a, c]
  mask=110 (6): bits 1,2 set     → [b, c]
  mask=111 (7): all bits set     → [a, b, c]

Code:
  for (int mask = 0; mask < (1 << n); mask++) {
      List<Character> subset = new ArrayList<>();
      for (int i = 0; i < n; i++) {
          if ((mask & (1 << i)) != 0) subset.add(arr[i]);
      }
      result.add(subset);
  }

WHY bitmask? Elegant, no recursion needed. Perfect for n ≤ 20.
Also used in Bitmask DP (TSP, assignment problems).

Time: O(n × 2ⁿ) | Space: O(n × 2ⁿ) for output
WARNING: Only works for n ≤ 20-25. Beyond that, 2ⁿ explodes.
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
COMMON MISTAKES:
1. Java: bit operations on int overflow at n=31. Use long for n>30.
2. Forgetting that >> is arithmetic (preserves sign), >>> is logical
   For unsigned shift: always use >>>
3. Operator precedence: & has LOWER precedence than ==
   WRONG: if (mask & (1<<i) != 0)  → this checks mask & (result of !=)
   RIGHT: if ((mask & (1<<i)) != 0)  → parentheses are ESSENTIAL!
4. Missing Number: XOR approach requires XORing BOTH values AND indices
   XOR just values doesn't work — you need the "expected" set too
5. Signed integers: -1 in binary is all 1s (two's complement)
   Be careful with right shift on negative numbers
```

---

## 📊 COMPLEXITY SUMMARY

| Problem           | Approach        | Time            | Space     |
| ----------------- | --------------- | --------------- | --------- |
| Single Number     | XOR all         | O(n)            | O(1)      |
| Missing Number    | XOR or math     | O(n)            | O(1)      |
| Power of Two      | n & (n-1) == 0  | O(1)            | O(1)      |
| Count Set Bits    | Brian Kernighan | O(k) k=set bits | O(1)      |
| Subset Generation | Bitmask         | O(n × 2ⁿ)       | O(2ⁿ)     |
| Bitmask DP (TSP)  | DP on subsets   | O(2ⁿ × n²)      | O(2ⁿ × n) |

---

🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

| #   | Problem                                                               | Key Insight                |
| --- | --------------------------------------------------------------------- | -------------------------- |
| 1   | [Power of Two](https://leetcode.com/problems/power-of-two/)           | `n & (n-1) == 0`           |
| 2   | [Missing Number](https://leetcode.com/problems/missing-number/)       | XOR all indices and values |
| 3   | [Counting Bits](https://leetcode.com/problems/counting-bits/)         | `dp[i] = dp[i>>1] + (i&1)` |
| 4   | [Reverse Integer](https://leetcode.com/problems/reverse-integer/)     | Modulo + overflow check    |
| 5   | [Palindrome Number](https://leetcode.com/problems/palindrome-number/) | Compare half               |
| 6   | [Add Binary](https://leetcode.com/problems/add-binary/)               | Simulate addition          |

### Medium

| #   | Problem                                                           | Key Insight                     |
| --- | ----------------------------------------------------------------- | ------------------------------- |
| 7   | [Ones and Zeroes](https://leetcode.com/problems/ones-and-zeroes/) | 2D knapsack (bit-related theme) |

### From Math Section

| #   | Problem                                                                                              | Companies  | Key Insight                            |
| --- | ---------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------- |
| 8   | [Excel Sheet Column Title](https://leetcode.com/problems/excel-sheet-column-title/)                  | —          | Base-26 conversion                     |
| 9   | [Maximum Product of Three](https://leetcode.com/problems/maximum-product-of-three-numbers/)          | —          | Sort: max of two negatives × positive  |
| 10  | [Minimum Moves to Equal Array](https://leetcode.com/problems/minimum-moves-to-equal-array-elements/) | —          | Math: sum - n\*min                     |
| 11  | [Happy Number](https://leetcode.com/problems/happy-number/)                                          | Salesforce | Floyd's cycle in digit-square sequence |
| 12  | [Max Points on Line](https://leetcode.com/problems/max-points-on-a-line/)                            | —          | Slope HashMap with GCD                 |
| 13  | [Valid Square](https://leetcode.com/problems/valid-square/)                                          | Salesforce | Distance set has exactly 2 values      |
| 14  | [Kth Factor of N](https://leetcode.com/problems/the-kth-factor-of-n/)                                | —          | Iterate up to sqrt                     |

### Sorting & Searching from Excel

| #   | Problem                                                                                                          | Companies           | Key Insight                     |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------- |
| 15  | [Permute Two Arrays](https://www.geeksforgeeks.org/permute-two-arrays-sum-every-pair-greater-equal-k/)           | Salesforce          | Sort asc + desc, pair-check     |
| 16  | [Ceiling in Sorted Array](https://www.geeksforgeeks.org/ceiling-in-a-sorted-array/)                              | —                   | Binary search upper bound       |
| 17  | [Find Pair with Difference](https://www.geeksforgeeks.org/find-a-pair-with-the-given-difference/)                | Walmart, Salesforce | Sort + two pointer              |
| 18  | [Check if Reversing Sub-Array Sorts](https://www.geeksforgeeks.org/check-reversing-sub-array-make-array-sorted/) | —                   | Find dip, reverse, verify       |
| 19  | [Radix Sort](https://www.geeksforgeeks.org/radix-sort/)                                                          | Amazon              | Counting sort per digit         |
| 20  | [Product Array Puzzle](https://www.geeksforgeeks.org/a-product-array-puzzle/)                                    | —                   | Prefix product + suffix product |
| 21  | [Find Peak Element](https://leetcode.com/problems/find-peak-element/)                                            | —                   | Binary search on answer         |
| 22  | [Allocate Minimum Pages](https://practice.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1)     | Salesforce          | Binary search on answer         |
| 23  | [Min Swaps to Sort](https://www.geeksforgeeks.org/minimum-number-swaps-required-sort-array/)                     | —                   | Graph cycles counting           |
| 24  | [Aggressive Cows](https://www.spoj.com/problems/AGGRCOW/)                                                        | Microsoft           | Binary search on answer         |
| 25  | [Search in Rotated Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)                         | Salesforce          | Modified binary search          |
| 26  | [Count Smaller After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)                   | —                   | Merge sort counting             |
| 27  | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)                                | Walmart             | Binary search on answer         |

### Segment Tree from Excel

| #   | Problem                                                                                                   | Companies     | Key Insight                         |
| --- | --------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------- |
| 28  | [Range Sum Query Immutable](https://leetcode.com/problems/range-sum-query-immutable/)                     | Goldman Sachs | Prefix sum (no segment tree needed) |
| 29  | [Range Sum Query Mutable](https://leetcode.com/problems/range-sum-query-mutable/)                         | Salesforce    | Segment tree or BIT                 |
| 30  | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | —             | Segment tree / merge sort           |
| 31  | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)                                   | Salesforce    | Segment tree / merge sort           |

---

## 🔥 BIT TRICKS SUMMARY

| Problem Type               | Trick                     | Complexity      |
| -------------------------- | ------------------------- | --------------- |
| Find unique (pairs repeat) | XOR all elements          | O(n), O(1)      |
| Count set bits             | `n &= (n-1)` in loop      | O(k) k=set bits |
| Is power of 2              | `n & (n-1) == 0`          | O(1)            |
| Swap without temp          | `a ^= b; b ^= a; a ^= b;` | O(1)            |
| Enumerate subsets          | Bitmask 0 to 2^n-1        | O(2^n)          |
| Get/Set/Clear bit          | Shift and mask            | O(1)            |

---

📖 **Related Chapters:**

- [03_Algorithms/10_Bit_Manipulation_Complete.md](../03_Algorithms/10_Bit_Manipulation_Complete.md) — Bit manipulation deep dive
- [03_Algorithms/08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md) — Number theory

---

[← 19 Matrix+Grid](19_Matrix_Plus_Grid_Traversal.md) | [Back to Index →](../00_MASTER_INDEX.md)

🔬 **Section Challenge — 🔥 BIT TRICKS SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>


---

## 🏢 Enterprise Lens — Bit Manipulation + Tricks

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Permission flags, feature toggles, Bloom filters, compact state in DP |
| **Failure modes** | Signed shifts, overflow of `1 << 31`, precedence mistakes (`&` vs `==`) |
| **Testing and verification** | Test against loop-based implementations for random 32/64-bit values and boundary values (0, −1, MIN_VALUE) |
| **Review checklist** | Complexity stated for time **and** space · invariant stated · edge cases listed (empty, one element, duplicates, extremes) · behaviour at 10× data understood |

---

## Reality Check

**"Bit tricks are memorized one-liners"** → Each classic derives from two identities — n & (n-1) clears the lowest set bit (power-of-two test, Kernighan popcount) and n & -n isolates it (Fenwick trees) — both consequences of two's-complement borrowing. Derive-once beats memorize-twenty: when you know WHY the borrow ripples, you can reconstruct any of them and, more importantly, recognize when a novel problem reduces to lowest-set-bit reasoning.

**"XOR tricks only solve the single-number problem"** → XOR is addition in GF(2), and that algebra powers a family: swap-without-temp, missing-number (XOR both ranges), the two-unique-numbers split (partition by any set bit of the combined XOR), Gray codes, and parity checks in RAID and hashing. The two-unique-numbers trick is the depth marker: it works because the differing bit provably separates the pair — an argument, not an incantation.

**"Bitmask enumeration is only for tiny inputs"** → n up to about 20-24, yes — but that WINDOW is exactly where NP-hard interview problems live (TSP subsets, partition-to-k-groups, minimal covering). The two idioms that separate practitioners: enumerate submasks of m via sub = (sub - 1) & m (3^n total across all masks, not 4^n), and iterate set bits via lowest-bit extraction rather than testing all n positions. Both turn borderline-TLE solutions into passing ones.

**"Shifting is well-defined everywhere"** → Java: shifting an int by 32 is a NO-OP (shift counts mask to 5 bits) — 1 << 32 equals 1, not 0, a genuinely surprising spec corner; negative-count shifts mask likewise. C makes several of these undefined outright. Any bit-level code that computes shift amounts dynamically must bound them explicitly; the masking rule has shipped real off-by-one-word bugs in hash functions and bloom filters.

**"Bit-level code is inherently faster"** → JIT compilers already emit strength-reduced shifts for power-of-two multiplies and intrinsics for Integer.bitCount — hand-golfing arithmetic into bit form mostly obfuscates without speeding. Bit representations win where they change the DATA STRUCTURE: a 64-bit mask replacing a HashSet of small ints is 8 bytes vs hundreds and turns set-intersection into a single AND. Represent with bits; do not decorate with them.
