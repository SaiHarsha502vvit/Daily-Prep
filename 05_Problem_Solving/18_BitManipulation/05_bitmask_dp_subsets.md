# 16.4 Bitmask DP & Subsets

> **Navigation**: [← 16.3 Math Problems (Easy-Medium)](04_math_problems_easy_medium.md) | [Chapter overview](../18_BitManipulation.md)
> Page 5 of 5 in **SECTION 16: BIT MANIPULATION & MATH PROBLEMS**


## Problem #304: Subsets Generation via Bitmask — Full Walkthrough

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

## Problem #305: Number of Subsets with Given Sum

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

## Problem #306: [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) (LC 416)

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

## Problem #307: Ones and Zeroes (LC 474)

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

> **End of Section 16** | [Prev](../17_HashMap_Hashing.md) | [Index](../../00_MASTER_INDEX.md) | [Next](../19_Matrix.md)

---


---

### Historical Evolution

Claude Shannon's 1937 thesis connected Boolean algebra to switching circuits. Two's-complement integers appear in von Neumann's 1945 EDVAC report. Hamming codes (1950), Gray code (Frank Gray, 1953), Wegner's bit-counting by clearing the lowest set bit (1960), HAKMEM (MIT, 1972) and Warren's *Hacker's Delight* (2002) collected bit tricks. Bitmask dynamic programming over subsets goes back at least to the Held–Karp travelling-salesman algorithm (1962).

- **Shannon — 1937**: Boolean algebra for circuits
- **von Neumann — 1945**: Two's complement in the EDVAC design
- **Held & Karp — 1962**: Subset DP for TSP
- **HAKMEM — 1972**: Collection of bit tricks

---

[← 16.3 Math Problems (Easy-Medium)](04_math_problems_easy_medium.md) | [Chapter overview](../18_BitManipulation.md)
