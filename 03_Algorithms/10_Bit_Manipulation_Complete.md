> **Navigation**: [← Prefix Sum Prefix XOR 2D Prefix…](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) | [Chapter index](00_INDEX.md) | [Union-Find / Disjoint Set Union… →](14_Union_Find_DSU_Complete.md)
> 🧠 **Mental Model**: See [Space-Time Tradeoffs](../14_Mental_Models/12_Space_Time_Tradeoffs.md) — bit tricks as O(1) space optimizations

# 🔢 Bit Manipulation Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Number representation](../02_Data_Structures/01a_Memory_Foundations.md), [Sorting & arrays](02b_Sorting_Advanced.md) |
| **You will learn** | Bit operators, masks, tricks (lowest set bit, power of two, popcount), XOR properties, bitmask enumeration |
| **Leads to** | [Bitwise trie](18_Bitwise_Trie_Java_Complete.md), [Game theory](24_Game_Theory_Nim_Sprague_Grundy.md), [Bitmask DP](04c_DP_Advanced.md) |
| **Abstraction level** | L3: computing at the bit level |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Bit Manipulation

### 1. The bottom line

Bit tricks use the way numbers are stored to do in one instruction what would otherwise take a loop.

### 2. The textbook core

- `n & (n - 1)` clears the lowest set bit; `n & -n` isolates it.
- `a ^ a = 0`, `a ^ 0 = a` → find the single non-duplicate.
- Subset enumeration with masks: `for (m = 0; m < 1<<n; m++)`.
- Know signed vs unsigned shifts (`>>` vs `>>>`).

### 3. The real-world analogy

A **row of light switches**: each bit is a switch and the operators describe how to flip or test groups of them at once.

### 4. Walkthrough

1. Single number in `[4, 1, 2, 1, 2]`.
2. XOR all: 4 ^ 1 ^ 2 ^ 1 ^ 2.
3. Pairs cancel (`x ^ x = 0`).
4. Result: 4.

> [!NOTE]
> **Quick check:** How do you test that n is a power of two? *`n > 0 && (n & (n - 1)) == 0`.*

---


> Master the Art of Binary Operations for Coding Interviews

### 5. Check yourself

**Q1.** How many set bits does 13 (`1101`) have?

<details><summary>Answer</summary>

**3**.

</details>

**Q2.** Test whether `n` is a power of two.

<details><summary>Answer</summary>

`n > 0 && (n & (n − 1)) == 0`.

</details>


## Table of Contents

1. [Why Bit Manipulation?](10_Bit_Manipulation_Complete/01_why_bit_manipulation.md#why-bit-manipulation)
2. [Binary Number System Fundamentals](10_Bit_Manipulation_Complete/01_why_bit_manipulation.md#binary-fundamentals)
3. [Bitwise Operators Deep Dive](10_Bit_Manipulation_Complete/01_why_bit_manipulation.md#bitwise-operators)
4. [Essential Bit Tricks & Formulas](10_Bit_Manipulation_Complete/02_essential_bit_tricks_formulas.md#essential-tricks)
5. [XOR Magic Properties](10_Bit_Manipulation_Complete/03_xor_magic_properties.md#xor-magic)
6. [Bit Masking Techniques](10_Bit_Manipulation_Complete/04_bit_masking_techniques.md#bit-masking)
7. [Common Patterns & Templates](10_Bit_Manipulation_Complete/05_common_patterns_templates.md#patterns-templates)
8. [Interview Problems with Solutions](10_Bit_Manipulation_Complete/06_interview_problems_with_solutions.md#interview-problems)
9. [Practice Problems List](10_Bit_Manipulation_Complete/06_interview_problems_with_solutions.md#practice-problems)
10. [Quick Reference Cheat Sheet](10_Bit_Manipulation_Complete/06_interview_problems_with_solutions.md#cheat-sheet)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Why Bit Manipulation?](10_Bit_Manipulation_Complete/01_why_bit_manipulation.md) | Why Bit Manipulation? · Binary Number System Fundamentals · Bitwise Operators Deep Dive | 214 |
| 2 | [Essential Bit Tricks & Formulas](10_Bit_Manipulation_Complete/02_essential_bit_tricks_formulas.md) | Essential Bit Tricks & Formulas | 128 |
| 3 | [XOR Magic Properties](10_Bit_Manipulation_Complete/03_xor_magic_properties.md) | XOR Magic Properties | 120 |
| 4 | [Bit Masking Techniques](10_Bit_Manipulation_Complete/04_bit_masking_techniques.md) | Bit Masking Techniques | 124 |
| 5 | [Common Patterns & Templates](10_Bit_Manipulation_Complete/05_common_patterns_templates.md) | Common Patterns & Templates | 126 |
| 6 | [Interview Problems with Solutions](10_Bit_Manipulation_Complete/06_interview_problems_with_solutions.md) | Interview Problems with Solutions · Practice Problems List · Quick Reference Cheat Sheet · Summary: The 3 Most Important Things · Exam-Style Problems (MIT 6.006 / KTH DD1352… · … | 566 |

## 🏢 Enterprise Lens — Bit Manipulation

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Permissions and feature flags, bitsets/Bloom filters, compression, graphics, hash functions |
| **Failure modes** | Operator precedence mistakes; sign extension; shifting by ≥ width |
| **Testing and verification** | Property tests against arithmetic definitions |

---

## Reality Check

**"Bit manipulation is low-level optimization only"** → Bit manipulation is essential for: permission systems (Unix rwx = 3 bits per user/group/other), feature flags (each bit represents a feature toggle), network subnet masks (IP & mask extracts network address), and set operations (union = OR, intersection = AND, difference = AND NOT). These are design patterns, not optimizations.

**"Signed and unsigned integers behave the same with bit operations"** → Java has only signed integers. The >> operator performs arithmetic right shift (preserves sign bit), while >>> performs logical right shift (fills with zeros). -1 in binary is all 1s (twos complement). -1 >> 1 equals -1 (sign bit preserved), but -1 >>> 1 equals Integer.MAX_VALUE (zero-filled). Using the wrong shift on negative numbers produces completely wrong results.

**"Two's complement is an implementation detail"** → Two complement representation means: Integer.MIN_VALUE has no positive counterpart (Math.abs(Integer.MIN_VALUE) returns Integer.MIN_VALUE due to overflow), negation is bitwise complement plus one (~x + 1 == -x), and the most negative number's absolute value overflows. These properties affect: safe absolute value computation, integer division edge cases, and hash function behavior.

**"Counting bits is trivial"** → Integer.bitCount uses a parallel bit-counting algorithm (Hamming weight) that runs in O(1) with a fixed number of operations, not a loop over 32 bits. Understanding this technique (divide-and-conquer on bit groups) extends to: popcount-based distance metrics (Hamming distance = bitCount(a XOR b)), cardinality estimation in Bloom filters, and SIMD population count instructions in performance-critical code.

**"Bitmask subsets iterate 0 to 2^n-1"** → Iterating ALL subsets of a set of size n visits 2^n states. But iterating all subsets OF A SPECIFIC MASK m (submask enumeration) uses the pattern: for s = m; s > 0; s = (s-1) & m — this visits only the subsets of m, not all 2^n possibilities. This technique is critical for bitmask DP problems where you need to enumerate subsets of a partial state efficiently.
