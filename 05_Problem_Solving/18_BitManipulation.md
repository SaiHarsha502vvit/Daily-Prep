> **Navigation**: [← Dynamic Programming](11_Dynamic_Programming.md) | [Chapter index](00_INDEX.md) | [19. Matrix / Grid — Complete… →](19_Matrix.md)


---

# 📚 SECTION 16: BIT MANIPULATION & MATH PROBLEMS

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Bit Manipulation](../03_Algorithms/10_Bit_Manipulation_Complete.md), [Bit tricks pattern](../04_Patterns_Templates/20_BitManipulation_Plus_Tricks.md) |
| **You will learn** | XOR cancellation, masks, counting bits, subsets by bitmask and power-of-two tests |
| **Leads to** | [Matrix](19_Matrix.md) |
| **Abstraction level** | Arithmetic → **bits as flags** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Bit Manipulation Problems

### 1. The bottom line

Treat integers as small sets and use AND, OR, XOR and shifts to test or change members in constant time.

### 2. The textbook core

- `x & (x−1)` clears the lowest set bit.
- XOR of equal values is 0.
- `1 << i` creates a mask.
- Use `>>>` for unsigned shift.
- Subsets of `n ≤ 20` via masks.

### 3. The real-world analogy

A **panel of light switches**.

### 4. Walkthrough

1. Single Number `[4,1,2,1,2]`.
2. XOR all values.
3. Pairs cancel.
4. Result 4.

> [!NOTE]
> **Quick check:** Why does XOR find the unpaired value? *Equal values cancel and XOR is order independent.*

---


**BIT MANIPULATION & MATH PATTERNS**

```text
BITS ARE THE ATOMS OF COMPUTATION

Every integer in memory is already a sequence of bits.
Bit operations are single CPU instructions — O(1) each,
the fastest operations possible on any processor.

 Decimal 13  →  Binary 1101
                      ↑↑↑↑
                bit:  3210

 13 = 1×2³ + 1×2² + 0×2¹ + 1×2⁰
    = 8   +  4   +  0   +  1

INTERVIEW FREQUENCY: ~5-8% of coding problems
DIFFICULTY: Easy-Medium (tricks), Hard (bitmask DP)
```


### 5. Check yourself

**Q1.** Number of set bits in 11 (`1011`)?

<details><summary>Answer</summary>

**3**.

</details>

**Q2.** Missing number in `[3,0,1]` using XOR?

<details><summary>Answer</summary>

XOR all indices `0..3` with all values: **2**.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [WHY Bit Manipulation — MIT/KTH Style](18_BitManipulation/01_why_bit_manipulation_mit_kth_style.md) | WHY Bit Manipulation — MIT/KTH Style | 231 |
| 2 | [Single Number — Every Element Appears Twice Except One](18_BitManipulation/02_single_number_every_element_appears_twice.md) | Single Number — Every Element Appears Twice… | 239 |
| 3 | [16.2 Power & Counting (Easy-Medium)](18_BitManipulation/03_power_counting_easy_medium.md) | 16.2 Power & Counting (Easy-Medium) | 215 |
| 4 | [16.3 Math Problems (Easy-Medium)](18_BitManipulation/04_math_problems_easy_medium.md) | 16.3 Math Problems (Easy-Medium) | 402 |
| 5 | [16.4 Bitmask DP & Subsets](18_BitManipulation/05_bitmask_dp_subsets.md) | 16.4 Bitmask DP & Subsets · BIT TRICKS REFERENCE TABLE · SUBSET MATHEMATICS · MASTERY CHECKLIST | 327 |

## 16.1 XOR Tricks (Easy)

### Problem #286: [Single Number](https://leetcode.com/problems/single-number/) (LC 136)

## 🏢 Enterprise Lens — Bit Manipulation Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Flags, permissions, compact DP state |
| **Failure modes** | Operator precedence; sign bit; `1 << 31` |
| **Testing and verification** | Compare with loop-based versions on random values |

---

## Reality Check

**"Bit problems in practice sets repeat the bit-trick catalog"** — The practice layer adds PROOF OBLIGATIONS the catalog never demanded: single-number-II (every element thrice except one) needs per-bit-position modulo-3 counting or the two-variable automaton — and explaining WHY ones/twos masks work is the actual interview; single-number-III needs the argument that any set bit of the xor-of-all SEPARATES the two uniques. Reciting tricks answers the easy versions; owning the arguments answers the follow-ups.

**"Counting bits per number is independent work"** — The DP relations make the range version O(n) total: bits[i] = bits[i >> 1] + (i & 1), or bits[i] = bits[i & (i-1)] + 1 — each number's count derives from a smaller number's in O(1). This problem is the cleanest demonstration that DP is not about grids and knapsacks but about ANY self-referential computation — a framing worth having when someone asks "where else does DP apply?"

**"Bitwise AND of a range is a loop"** — The loop dies at range [1, 2^31-1]; the insight is that the AND of a range equals the COMMON PREFIX of lo and hi (everything below the first differing bit gets zeroed by some intermediate number). Shift-both-right-until-equal, shift back. The transferable move — reason about what an aggregate over a RANGE must preserve rather than iterating the range — reappears in OR/XOR range problems and in interval-reasoning generally.

**"Reverse-bits and swap-nibbles are byte-golf"** — They teach the divide-and-conquer-on-bits idiom (swap halves, then quarters, then pairs — O(log w) for word width w) that underlies real hardware intrinsics, hash finalizers (MurmurHash's avalanche), and morton-code interleaving in spatial indexes. One derivation covers the family; and the Java-specific detail — the unsigned shift for the sign bit — is the same lesson the shift chapter teaches, now with consequences.

**"Bitmask-DP problems are graph problems that happen to use masks"** — The mask IS the visited-set compressed to an int, and the practice-set point is the state-space arithmetic: 2^n masks times n positions fits at n up to 20 (TSP, min-cost-to-visit), submask enumeration totals 3^n (partition problems), and mask-plus-extra-state (shortest-path-visiting-all-nodes keys on mask AND current node) is where wrong answers concentrate — dropping the extra dimension merges distinct states. Constraint n up to 20 is the flashing sign; the visited-set-as-integer reframe is the unlock.
