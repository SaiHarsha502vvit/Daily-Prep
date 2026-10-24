> **Navigation**: [← Advanced Recursion Patterns](03c_Recursion_Advanced.md) | [Chapter index](00_INDEX.md) | [DP Fundamentals →](04b_DP_Fundamentals.md)
🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — state definition, transitions, and tabulation strategy

---

# 🧮 Dynamic Programming & Memoization: Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Recursion Advanced](03c_Recursion_Advanced.md) (memoization) |
| **You will learn** | How DP tables are laid out in memory, cache behaviour of iteration order, rolling arrays, top-down vs bottom-up costs |
| **Leads to** | [DP Fundamentals](04b_DP_Fundamentals.md) |
| **Abstraction level** | L0–L2: DP at the machine level |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — DP Internals

### 1. The bottom line

A DP solution is a table of answers, so memory layout and iteration order decide how fast it really runs.

### 2. The textbook core

- Iterate in the order that reads **contiguous memory** (row-major).
- **Rolling arrays** reduce O(nm) space to O(m) when a row depends only on the previous row.
- Top-down has recursion overhead but computes only reachable states; bottom-up has tight loops.
- State definition + transition + base cases + order = a complete DP.

### 3. The real-world analogy

Filling a **spreadsheet** row by row where each cell only looks at cells above/left, so you can throw away old rows.

### 4. Walkthrough

1. LCS of two strings of length m, n needs `dp[i][j]` from `dp[i-1][*]` and `dp[i][j-1]`.
2. Keep two rows instead of the full table.
3. Space drops from O(mn) to O(n).
4. Row-major iteration keeps accesses sequential.

> [!NOTE]
> **Quick check:** Why can a DP be slower than its Big-O suggests? *Column-major access causes cache misses.*

---


### 5W1H: Mastering DP Internals

> [!NOTE]
> **WHAT:** The physical mechanics of Dynamic Programming: DP table memory layout, cache behavior (L1/L2 hits vs misses), state representation limits, and the hardware differences between Tabulation and Memoization.
>
> **WHY:** Understanding memory architecture and CPU behavior explains why an O(N²) DP might run 5x slower or hit memory limits depending purely on iteration order (row vs column) or object allocations.
>
> **WHO:** Engineers optimizing latency-sensitive DP algorithms, managing memory constraints in production, or debugging TLE/MLE in coding interviews.
>
> **WHEN:** Study this BEFORE writing complex 2D/3D DP tables. It teaches you when to use rolling arrays, bitmasks, or coordinate compression.
>
> **HOW:** By analyzing DP arrays in physical memory, observing branch prediction costs, and employing space optimization techniques like rolling arrays.

### 5. Check yourself

**Q1.** What two properties make a problem suitable for DP?

<details><summary>Answer</summary>

Optimal substructure and overlapping subproblems.

</details>

**Q2.** How does DP differ from plain divide and conquer?

<details><summary>Answer</summary>

Subproblems overlap in DP, so their answers are stored and reused; in divide and conquer they are independent.

</details>


## From Recursion to Optimal Solutions

---

## How to Derive a DP From Scratch — The Part Nobody Teaches

Most DP material shows you the finished recurrence and says "memoize it." That is like showing the answer key and calling it teaching. The hard part — the *only* hard part — is turning a problem into a state and a transition. Here is the actual procedure, and it is mechanical once you see it.

### The five questions, in order

Every DP is built by answering these, in this sequence. Skip one and you get stuck.

1. **What decision do I make at each step?** (the "choice")
2. **What is the smallest set of facts I need to remember to make that choice correctly?** (the *state* — this is the whole game)
3. **What are the choices from a state, and where do they lead?** (the *transition*)
4. **What does the answer to a state mean, in one sentence?** (the *definition* — write it down literally)
5. **Where does it bottom out?** (the *base case*)

The mistake 95% of people make is jumping to step 3 (writing transitions) before nailing step 2 (state) and step 4 (definition). If you cannot finish the sentence *"`dp[i]` = the ____ using ____"*, you do not have a DP yet — you have a guess.

### Worked derivation: House Robber (LeetCode 198), thinking out loud

> Houses in a row, each with money `a[i]`. You cannot rob two adjacent houses. Maximize the total.

**Q1 — the decision.** Standing at house i, I choose: rob it, or skip it. That binary choice is the engine.

**Q2 — the state.** What must I remember to decide correctly at house i? Naively: "which houses I've robbed so far" — but that is exponential (2ⁱ subsets). Ask the sharper question: *what about the past actually constrains my choice now?* Only one thing — **whether house i−1 was robbed**, because that is the only adjacency rule. And even that I can fold in by defining the answer over a *prefix*. So the state is just the index `i`: "the best I can do considering houses `0..i`." One number. That collapse from "remember the whole subset" to "remember the index" is the leap — and it is the same leap in every DP.

**Q4 — the definition (write it literally, before any transition).**
> `dp[i]` = the maximum money robbed considering only houses `0..i`.

**Q3 — the transition.** At house i, my two choices from Q1:
- **Skip i:** then my total is whatever was best up to i−1 → `dp[i-1]`.
- **Rob i:** then I get `a[i]`, but i−1 is now forbidden, so the rest must come from `0..i-2` → `a[i] + dp[i-2]`.

I want the better one:
```
dp[i] = max(dp[i-1],  a[i] + dp[i-2])
        └ skip ┘       └─ rob ──┘
```

**Q5 — base cases.** The recurrence reaches back two steps, so I must seed two:
- `dp[0] = a[0]` (one house — rob it)
- `dp[1] = max(a[0], a[1])` (two adjacent — take the richer)

That's the entire DP, and notice we *derived* it — we never guessed. The answer is `dp[n-1]`.

### Why "optimal substructure" and "overlapping subproblems" are not jargon

Two conditions make DP work, and the derivation above shows both concretely:

- **Optimal substructure** — the best answer for `0..i` was built from the best answers for `0..i-1` and `0..i-2`, not from some *suboptimal* sub-answer. (If robbing optimally up to i somehow required robbing *sub*-optimally up to i−2, DP would be invalid. It doesn't, because the adjacency rule only couples neighbors.) This is what lets you reuse a stored sub-answer instead of reconsidering it.
- **Overlapping subproblems** — the naive recursion `rob(i) = max(rob(i-1), a[i]+rob(i-2))` calls `rob(i-2)` from *both* `rob(i)` and `rob(i-1)`. The same subproblem recurs exponentially. Storing each `dp[i]` once collapses 2ⁿ calls into n. **No overlap → no DP payoff** (that's just divide-and-conquer; merge sort has optimal substructure but *no* overlap, so memoizing it buys nothing).

### The state-design instinct, generalized

The single skill that separates people who "get" DP from people who don't is **state minimization** — answering Q2. The pattern repeats across every classic problem:

| Problem | Naive "remember everything" state | The minimal state that actually suffices |
|---------|-----------------------------------|------------------------------------------|
| House Robber | which subset of houses robbed (2ⁿ) | index `i` |
| Coin Change | which coins used, in what order | remaining `amount` |
| LCS | which characters matched | the two prefix lengths `(i, j)` |
| Knapsack 0/1 | which items taken (2ⁿ) | `(item index i, remaining capacity w)` |
| Edit Distance | the full edit script | the two prefix lengths `(i, j)` |
| LIS | every increasing subsequence | `i` = "longest ending exactly at i" |

In every row the win is the same move: throw away the *history of how you got here* and keep only the *summary that affects the future*. That summary is the state. Get it right and the transition writes itself; get it wrong (too big → TLE/MLE, too small → wrong answer) and nothing downstream can save you.

> **Drill this:** before coding any DP, force yourself to fill the blank out loud — *"`dp[state]` = the [max/min/count/boolean] of [precise quantity] given [exactly what the state fixes]."* If you can't, you're not ready to write the loop. Everything after this section (memory layout, rolling arrays, cache behavior) is optimization of a recurrence you must first be able to *derive*.

---

## 🔬 PART 0: DEEP INTERNALS - HOW DP ACTUALLY WORKS AT CPU/MEMORY LEVEL

### DYNAMIC PROGRAMMING AT THE HARDWARE LEVEL - THE COMPLETE PICTURE ╠══════════════════════════════════════════════════════════════════════════════════╣  Understanding what PHYSICALLY happens when you run a DP algorithm: • Memory layout of DP tables • Cache behavior differences between 1D, 2D, and rolling arrays • Why certain DP approaches are faster despite same Big-O • Memory allocation overhead • Branch prediction in DP transitions

### DP TABLE MEMORY LAYOUT

#### Dp table in physical memory

1D DP ARRAY: int[] dp = new int[n]

Java int array: Header (16 bytes) + length (4 bytes) + data

Memory Layout (n=10):

```text
 ┌────────────────┬────────┬────────────────────────────────────────────────┐
 │ Object Header  │ Length │ int[0] int[1] int[2] int[3] ... int[9]       │
 │ 16 bytes       │ 4 bytes│ 4      4      4      4          4   bytes   │
 └────────────────┴────────┴────────────────────────────────────────────────┘
```

Total Memory = 16 + 4 + (n × 4) + padding
For n=10: 16 + 4 + 40 = 60 bytes (padded to 64 bytes)

**Cache behavior:** Cache line = 64 bytes = 16 integers Sequential access → EXCELLENT cache performance! dp[i] access pulls dp[i+1] to dp[i+15] into cache

2D DP ARRAY: int[][] dp = new int[m][n]

Java stores 2D arrays as "array of arrays" (NOT contiguous!)

Memory Layout (3×4):

```text
 ┌────────────────────────────────────────┐
 │ Header   dp[0]     dp[1]     dp[2]    │  ← Array of references
 │ 16 bytes ptr→      ptr→      ptr→     │     (8 bytes each on 64-bit)
 └─────────┬──────────┬─────────┬────────┘
           │          │         │
           ↓          ↓         ↓
 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │Header Length│ │Header Length│ │Header Length│
 │[0][1][2][3]│ │[0][1][2][3]│ │[0][1][2][3]│  ← Each row is separate array
 └─────────────┘ └─────────────┘ └─────────────┘
```

Memory for int[m][n]:
Outer array: 16 + 4 + (m × 8) bytes
Each inner array: 16 + 4 + (n × 4) bytes
Total ≈ 20 + 8m + m × (20 + 4n) = 20 + 28m + 4mn bytes

**Cache implications:** 

- Row access (dp[i][0] to dp[i][n-1]) → GOOD (contiguous in memory)
- Column access (dp[0][j] to dp[m-1][j]) → BAD (jumps between arrays!)

### CACHE BEHAVIOR IN DP - CRITICAL FOR PERFORMANCE

#### Dp iteration order and cache performance

**Example:** Longest Common Subsequence (LCS)


```java
int lcs(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m+1][n+1];
```



```java
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i-1) == b.charAt(j-1)) {
            dp[i][j] = dp[i-1][j-1] + 1;
        } else {
            dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
}
return dp[m][n];
}
```


**Access pattern visualization:** 

GOOD ORDER (row-major):              BAD ORDER (column-major):
for (i) for (j)                      for (j) for (i)

j → →→ →                              j

```text
 ┌─────────────┐                      ┌──↓──────────┐
 │ 1  2  3  4  │ i=1                  │ 1  │  │  │  │
 │ 5  6  7  8  │ i=2                  │ 2  │  │  │  │
 │ 9 10 11 12  │ i=3                  │ 3  │  │  │  │
 └─────────────┘                      │ 4  5  6  7  │
 i                                    └─────────────┘
 ↓
```

Row-major: Elements accessed are adjacent in memory
Column-major: Each access jumps to a different array!

BENCHMARK (LCS of two 1000-char strings):

```text
 ┌──────────────────────────┬─────────────┬─────────────────────────┐
 │ Iteration Order          │ Time (ms)   │ L1 Cache Misses         │
 ├──────────────────────────┼─────────────┼─────────────────────────┤
 │ Row-major (i then j)     │ 2.8         │ ~62,500                 │
 │ Column-major (j then i)  │ 15.3        │ ~1,000,000              │
 │ Ratio                    │ 5.5x slower │ 16x more misses         │
 └──────────────────────────┴─────────────┴─────────────────────────┘
```

**Rule:** In Java, always iterate rows in outer loop, columns in inner loop!

### SPACE OPTIMIZATION - ROLLING ARRAY TECHNIQUE

#### ROLLING ARRAY - FROM O(mn) TO O(n) SPACE

**Observation:** Many 2D DP only needs previous row!

Full 2D DP (wasteful):

```text
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Row 0: [0][0][0][0][0][0][0][0][0][0]  ← Never accessed after row 1      │
 │ Row 1: [0][1][1][1][1][1][1][1][1][1]  ← Never accessed after row 2      │
 │ Row 2: [0][1][1][2][2][2][2][2][2][2]  ← Never accessed after row 3      │
 │ Row 3: [0][1][1][2][2][3][3][3][3][3]  ← Only need THIS and row 2!       │
 │ ...                                                                       │
 └───────────────────────────────────────────────────────────────────────────┘
```

Rolling Array (2 rows):

```text
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ prev: [0][1][1][2][2][3][3][3][3][3]  ← Row i-1                          │
 │ curr: [0][1][1][2][2][3][3][3][3][3]  ← Row i (computing)                │
 └───────────────────────────────────────────────────────────────────────────┘
 After each row: swap prev ↔ curr
```

**Code transformation:** ───────────────────


```java
// BEFORE: O(mn) space
int[][] dp = new int[m+1][n+1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i-1) == b.charAt(j-1)) {
            dp[i][j] = dp[i-1][j-1] + 1;
        } else {
            dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
}
return dp[m][n];

// AFTER: O(n) space - Two rows
int[] prev = new int[n+1];
int[] curr = new int[n+1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i-1) == b.charAt(j-1)) {
            curr[j] = prev[j-1] + 1;
        } else {
            curr[j] = Math.max(prev[j], curr[j-1]);
        }
    }
    // Swap references (O(1), no copying!)
    int[] temp = prev;
    prev = curr;
    curr = temp;
}
return prev[n];  // Answer is in prev after final swap

// EVEN BETTER: O(n) space - Single row (when possible)
// Works for problems like Edit Distance where we only need
// dp[i-1][j-1], dp[i-1][j], dp[i][j-1]
int[] dp = new int[n+1];
for (int i = 1; i <= m; i++) {
    int prev = 0;  // Stores dp[i-1][j-1]
    for (int j = 1; j <= n; j++) {
        int temp = dp[j];  // Save dp[i-1][j] before overwriting
        if (a.charAt(i-1) == b.charAt(j-1)) {
            dp[j] = prev + 1;
        } else {
            dp[j] = Math.max(dp[j], dp[j-1]);
        }
        prev = temp;  // prev = old dp[i-1][j] = new dp[i-1][j-1] for j+1
    }
}
return dp[n];
```

```
│ │
│ │
│ MEMORY SAVINGS: │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Array Size │ Full 2D │ Two Rows │ Single Row │ ││
│ ├─────────────────────┼───────────────┼───────────────┼──────────────┤ ││
│ │ m=1000, n=1000 │ 4,000,000 B │ 8,000 B │ 4,000 B │ ││
│ │ m=10000, n=10000 │ 400,000,000 B │ 80,000 B │ 40,000 B │ ││
│ │ Savings │ baseline │ 500x less │ 1000x less │ ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ CACHE BENEFIT: Smaller array fits in L1/L2 cache → MUCH faster! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🖥️ Memoization vs Tabulation — CPU Perspective

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOP-DOWN VS BOTTOM-UP: HARDWARE DIFFERENCES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TOP-DOWN (MEMOIZATION):                                                         │
│ ──────────────────────                                                          │
│                                                                                 │
│ int fib(int n, int[] memo) {                                                    │
│ if (n <= 1) return n;                                                           │
│ if (memo[n] != -1) return memo[n]; // Cache hit check                           │
│ memo[n] = fib(n-1, memo) + fib(n-2, memo);                                      │
│ return memo[n];                                                                 │
│ }                                                                               │
│                                                                                 │
│ CPU Operations per call:                                                        │
│ • Function call overhead: ~15-30 cycles                                         │
│ • Condition check (n <= 1): ~1-3 cycles                                         │
│ • Array access memo[n]: ~3-100 cycles (cache hit vs miss)                       │
│ • Comparison (memo[n] != -1): ~1 cycle                                          │
│ • Return: ~5 cycles                                                             │
│                                                                                 │
│ Branch prediction: UNPREDICTABLE!                                               │
│ • Sometimes cache hit, sometimes not                                            │
│ • ~20 cycle penalty per misprediction                                           │
│                                                                                 │
│                                                                                 │
│ BOTTOM-UP (TABULATION):                                                         │
│ ──────────────────────                                                          │
│                                                                                 │
│ int fib(int n) {                                                                │
│ if (n <= 1) return n;                                                           │
│ int[] dp = new int[n + 1];                                                      │
│ dp[0] = 0; dp[1] = 1;                                                           │
│ for (int i = 2; i <= n; i++) {                                                  │
│ dp[i] = dp[i-1] + dp[i-2];                                                      │
│ }                                                                               │
│ return dp[n];                                                                   │
│ }                                                                               │
│                                                                                 │
│ CPU Operations per iteration:                                                   │
│ • Loop overhead: ~1-2 cycles (no function calls!)                               │
│ • Array access dp[i-1], dp[i-2]: ~3-4 cycles (sequential = cache hits!)         │
│ • Addition: ~1 cycle                                                            │
│ • Array store dp[i]: ~1-4 cycles                                                │
│                                                                                 │
│ Branch prediction: PERFECT!                                                     │
│ • Loop continues n-1 times, then exits once                                     │
│ • Predictor learns pattern quickly                                              │
│                                                                                 │
│                                                                                 │
│ BENCHMARK (Fibonacci n=40):                                                     │
│ ┌──────────────────────────────┬─────────────┬─────────────────────────┐        │
│ │ Method │ Time (ns) │ Cache Misses │                                           │
│ ├──────────────────────────────┼─────────────┼─────────────────────────┤        │
│ │ Top-down (memoization) │ 450 │ ~15 │                                          │
│ │ Bottom-up (tabulation) │ 120 │ ~3 │                                           │
│ │ Bottom-up (space optimized) │ 85 │ 0 │                                        │
│ └──────────────────────────────┴─────────────┴─────────────────────────┘        │
│                                                                                 │
│ Bottom-up is ~4x faster due to:                                                 │
│ • No function call overhead                                                     │
│ • Better cache locality                                                         │
│ • Perfect branch prediction                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🧠 State Representation — Memory Efficiency

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STATE REPRESENTATION TECHNIQUES                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TECHNIQUE 1: BITMASK DP                                                         │
│ ─────────────────────────                                                       │
│ Instead of boolean[] visited → use int bitmask                                  │
│                                                                                 │
│ Example: Traveling Salesman (n ≤ 20 cities)                                     │
│                                                                                 │
│ // ARRAY APPROACH: Needs Map<Set<Integer>, Integer>                             │
│ // Very slow due to hashing and object creation                                 │
│                                                                                 │
│ // BITMASK APPROACH:                                                            │
│ int[][] dp = new int[1 << n][n]; // dp[mask][lastCity]                          │
│ // mask has bit i set if city i is visited                                      │
│                                                                                 │
│ Memory for n=20:                                                                │
│ • Array: 2^20 × 20 × 4 = 80 MB (fits in RAM!)                                   │
│ • Operations on mask:                                                           │
│ - Check if city i visited: (mask & (1 << i)) != 0 → 2 cycles                    │
│ - Add city i to visited: mask | (1 << i) → 1 cycle                              │
│ - Count visited cities: Integer.bitCount(mask) → 1 cycle (CPU instr!)           │
│                                                                                 │
│                                                                                 │
│ TECHNIQUE 2: COORDINATE COMPRESSION                                             │
│ ─────────────────────────────────────                                           │
│ When values are sparse but range is huge                                        │
│                                                                                 │
│ Problem: dp[i] where i can be up to 10^9                                        │
│ But only 10^5 distinct values actually used!                                    │
│                                                                                 │
```

```java
// Compress coordinates
int[] values = {5, 1000000000, 3, 500000000, 7};
int[] sorted = values.clone();
Arrays.sort(sorted);
Map<Integer, Integer> compress = new HashMap<>();
for (int i = 0; i < sorted.length; i++) {
    compress.put(sorted[i], i);
}
// Now values map to: {5→1, 3→0, 7→2, 500000000→3, 1000000000→4}
// Can use int[5] instead of int[10^9]!
```

```
│ │
│ │
│ TECHNIQUE 3: STATE ENCODING │
│ ──────────────────────────── │
│ Combine multiple small states into one integer │
│ │
│ Example: Track (position, direction, speed) where: │
│ • position: 0-999 │
│ • direction: 0-3 │
│ • speed: 0-9 │
│ │
```

```java
// Instead of: int[][][] dp = new int[1000][4][10];
// Use: int[] dp = new int[1000 * 4 * 10];

// Encode state
int encode(int pos, int dir, int spd) {
    return pos * 40 + dir * 10 + spd;
}

// Decode state
int decodePos(int state) { return state / 40; }
int decodeDir(int state) { return (state / 10) % 4; }
int decodeSpd(int state) { return state % 10; }

// Benefits:
// • Single array = better cache locality
// • Fewer array dereferences
// • Can use as hash key directly
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 📌 DP Transition Cost Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TRANSITION OPERATION COSTS                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ COMMON DP TRANSITION OPERATIONS AND THEIR COSTS:                                │
│                                                                                 │
│ ┌──────────────────────────────────────┬─────────────┬────────────────────────┐ │
│ │ Operation │ CPU Cycles │ Notes │                                              │
│ ├──────────────────────────────────────┼─────────────┼────────────────────────┤ │
│ │ dp[i] = dp[i-1] + 1 │ 3-5 │ Cache hit likely │                                │
│ │ dp[i][j] = dp[i-1][j-1] │ 5-10 │ Depends on cache │                           │
│ │ dp[i] = max(dp[i], dp[j] + val) │ 4-6 │ Comparison + maybe set │              │
│ │ dp[i] = min(dp[i], dp[j] + val) │ 4-6 │ Same as max │                         │
│ │ dp[mask | (1<<i)] = ... │ 4-8 │ Bit operations fast │                         │
│ │ dp[i] = dp[i-1] \* dp[i-2] │ 5-15 │ Multiply costlier │                       │
│ │ dp[i] = (dp[i-1] + dp[i-2]) % MOD │ 8-20 │ Modulo is expensive! │             │
│ │ dp.get(state) │ 50-200 │ HashMap very expensive │                             │
│ └──────────────────────────────────────┴─────────────┴────────────────────────┘ │
│                                                                                 │
│                                                                                 │
│ MODULO OPTIMIZATION:                                                            │
│ ─────────────────────                                                           │
│ Problem: dp[i] = (dp[i-1] + dp[i-2]) % MOD                                      │
│ Modulo (%) uses integer division, which is SLOW (20-80 cycles)!                 │
│                                                                                 │
```

```java
// SLOW: Modulo on every operation
for (int i = 2; i <= n; i++) {
    dp[i] = (dp[i-1] + dp[i-2]) % MOD;  // % every iteration
}

// FASTER: Conditional subtraction (when MOD < MAX_INT/2)
for (int i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    if (dp[i] >= MOD) dp[i] -= MOD;  // Branch instead of modulo
}

// FASTEST: Use long and modulo less frequently
long sum = 0;
for (int i = 2; i <= n; i++) {
    sum = dp[i-1] + dp[i-2];
    if (sum >= MOD) sum -= MOD;
    dp[i] = (int) sum;
}
```

```
│ │
│ BENCHMARK (n=10^7 Fibonacci mod 10^9+7): │
│ • With % every iter: 180 ms │
│ • With conditional: 65 ms │
│ • ~2.8x speedup! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🧠 Memory Allocation Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DP ARRAY ALLOCATION STRATEGIES                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ STRATEGY 1: PREALLOCATE ARRAYS (Best for fixed size)                            │
│ ────────────────────────────────────────────────────                            │
```

```java
// GOOD: Single allocation
int[] dp = new int[n + 1];
Arrays.fill(dp, -1);  // Or initialize in loop

// BAD: Allocation inside loop
for (int i = 0; i < tests; i++) {
    int[] dp = new int[n + 1];  // New allocation each iteration!
    // ... solve ...
}

// BETTER: Reuse array
int[] dp = new int[MAX_N];
for (int i = 0; i < tests; i++) {
    int n = readN();
    Arrays.fill(dp, 0, n + 1, 0);  // Clear only needed portion
    // ... solve ...
}
```

```
│ │
│ ALLOCATION COSTS: │
│ • new int[1000]: ~50-100 ns │
│ • new int[1000000]: ~500-2000 ns │
│ • Arrays.fill(arr, 0): ~0.5 ns per element (uses fast memory set) │
│ │
│ │
│ STRATEGY 2: LAZY INITIALIZATION (When sparse) │
│ ───────────────────────────────────────────── │
```

```java
// When most values stay at default, don't fill!
int[] dp = new int[n + 1];  // Already all zeros in Java!

// Or use sentinel value
int[] dp = new int[n + 1];
// Java guarantees all zeros - use 0 as "not computed" if valid answers are > 0
```

```
│ │
│ │
│ STRATEGY 3: USE PRIMITIVES, NOT OBJECTS │
│ ─────────────────────────────────────────── │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Storage │ Memory per element │ Access time ││
│ ├────────────────────────────────┼────────────────────┼─────────────────────┤│
│ │ int[] │ 4 bytes │ ~3-4 cycles ││
│ │ Integer[] │ 16+ bytes │ ~10-15 cycles ││
│ │ ArrayList<Integer> │ 20+ bytes │ ~15-20 cycles ││
│ │ HashMap<Integer,Integer> │ 48+ bytes │ ~50-200 cycles ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ Rule: Use primitive arrays for DP whenever possible! │
│ Use HashMap only when state space is truly sparse and unpredictable. │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🔍 Reconstructing the Solution (Traceback)

In _The Algorithm Design Manual_, Skiena points out a common pitfall: Dynamic Programming natively computes the _value_ of the optimal solution (e.g., "The longest path is 15"), but often the interviewer actually wants the _path itself_ (e.g., "The items to pick are A, C, and F").

To reconstruct the solution, you must walk backward through your DP table, tracing the sequence of optimal decisions.

#### Two Ways to Traceback

##### 1. The "Parent Pointer" Array (Explicit Tracking)

Store the optimal decision at each step in a separate array/table.

- **Pros:** Very easy to write the traceback loop.
- **Cons:** Doubles your memory usage.

```java
// Example: Longest Increasing Subsequence (LIS)
int[] dp = new int[n];
int[] parent = new int[n];
Arrays.fill(parent, -1);

// ... during DP transition ...
if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
    dp[i] = dp[j] + 1;
    parent[i] = j;  // Record that i came from j!
}

// Reconstruct
List<Integer> path = new ArrayList<>();
int curr = maxIndex; // index where DP array is max
while (curr != -1) {
    path.add(nums[curr]);
    curr = parent[curr];
}
Collections.reverse(path);
```

##### 2. Re-evaluating the Recurrence (Implicit Tracking - Preferred)

You don't need a `parent` array! The DP table already contains all the information needed to deduce _which_ choice was optimal. You just check which subproblem + transition equals the current cell's value.

- **Pros:** Saves memory. Shows deep understanding of the recurrence relation.
- **Cons:** Slightly more complex to write the traceback logic.

```java
// Example: 0/1 Knapsack Traceback
// dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])

List<Integer> itemsPicked = new ArrayList<>();
int i = n;
int w = capacity;

while (i > 0 && w > 0) {
    // If the value is the same as the row above, we DID NOT pick item i
    if (dp[i][w] == dp[i-1][w]) {
        i--;
    }
    // Otherwise, we MUST have picked item i
    else {
        itemsPicked.add(i);
        w -= weight[i]; // Reduce capacity
        i--;
    }
}
```

**Rule of Thumb:** Always use Implicit Tracking unless the transition logic is extremely complex or depends on non-deterministic ties where you must remember the exact tie-breaker you chose.

---

### 📎 Reference Anchor

**Apache Commons Text `LevenshteinDistance` — production DP**
- `LevenshteinDistance`: [LevenshteinDistance.java](https://github.com/apache/commons-text/blob/master/src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java) — bottom-up 2-row DP (space-optimized from O(m×n) to O(min(m,n))). **Invariant**: `dp[j]` = edit distance between first `i` chars of s1 and first `j` chars of s2. Rolling array: only current row and previous row needed.
- Optional threshold version: early termination if distance exceeds threshold — prunes columns that can't possibly improve. Useful for fuzzy-match filtering on large corpora.
- **Local rewrite rule**: Bottom-up DP avoids function call overhead. For n > 10⁴ subproblems, bottom-up is 2–5× faster than top-down due to elimination of recursion overhead and HashMap cache lookups.
- **Constraint warning**: 2D DP `int[n+1][m+1]` with n=m=10⁴ = 400 MB — exceeds default heap. Use rolling array or set `JAVA_OPTS=-Xmx2g`.

---

### When DP Internals Break

#### 1. Traceback on Rolled Array — Lost Data
**What breaks**: Using a 1D rolling array for space optimization but then trying to traceback the solution. The previous rows are overwritten and the path cannot be reconstructed.
**Fix**: If solution reconstruction is needed, keep the full 2D table (or store a separate `choice[i][j]` matrix). Only use rolling array if you only need the optimal VALUE, not the path.

#### 2. Integer Overflow in DP Value Accumulation
**What breaks**: Counting paths in a grid: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. For a 20×20 grid, dp[20][20] can exceed `Integer.MAX_VALUE`. Silent overflow produces negative values.
**Fix**: Use `long[][]` for counting problems. Or take values mod 10⁹+7 if only the modular count is needed (common in competitive programming).

#### 3. Using HashMap for Memoization with Arrays as Keys
**What breaks**: `HashMap<int[], Integer> memo` uses reference equality for `int[]` keys. Two arrays `{1,2,3}` and `{1,2,3}` (different objects, same values) are different keys. The cache is never hit.
**Fix**: Convert array state to a canonical String key: `Arrays.toString(state)`. Or encode to a single int if bounds allow.

---

### Brute Force → Optimal: DP Warm-Up

#### Problem: Longest Increasing Subsequence (LIS)

**Brute Force — O(2ⁿ) all subsequences:**
Generate all 2ⁿ subsequences, check each for being increasing, track max length.

**Naive DP — O(n²) pairwise comparison:**
```java
int[] dp = new int[n];
Arrays.fill(dp, 1);
for (int i = 1; i < n; i++)
    for (int j = 0; j < i; j++)
        if (arr[j] < arr[i]) dp[i] = Math.max(dp[i], dp[j]+1);
```

**Optimal — O(n log n) patience sorting + binary search:**
Maintain a `tails[]` array where `tails[k]` = smallest tail element of all IS of length k+1. For each element, binary search in `tails[]` to find where it fits. Length of `tails` at the end = LIS length.

**Why**: `tails[]` is always sorted. Binary search finds the correct position in O(log n) per element. Total: O(n log n).

---

### Proof Corner -- Optimal Substructure for LCS

**Claim**: Let LCS(i,j) = length of the longest common subsequence of A[0..i-1] and B[0..j-1].

**Recurrence correctness** (by case analysis):

Case 1: A[i-1] == B[j-1]. The last characters match. They must appear together in any optimal LCS (if one appears, including the other costs nothing and can only help). So LCS(i,j) = LCS(i-1,j-1) + 1.

Case 2: A[i-1] != B[j-1]. The optimal LCS either excludes A[i-1] (giving LCS(i-1,j)) or excludes B[j-1] (giving LCS(i,j-1)), or both. Taking the max covers all cases: LCS(i,j) = max(LCS(i-1,j), LCS(i,j-1)).

**Base cases**: LCS(i,0) = LCS(0,j) = 0 (empty string has no common subsequence). Correct.

**Loop invariant for the tabulation nested loops**: After the inner loop completes for row i, `dp[i][j]` = LCS(A[0..i-1], B[0..j-1]) for all j in [0..m].

- *Init*: dp[0][j] = 0 for all j (outer loop hasn't started). Correct.
- *Maintenance*: Each dp[i][j] is computed from dp[i-1][j], dp[i][j-1], dp[i-1][j-1] -- all previously computed. Correct.
- *Termination*: dp[n][m] = LCS of full A and B. QED.

---

### When It Breaks -- DP Internals

**1. Backward vs forward loop for 0/1 Knapsack** -- the most common DP bug. 1D rolling array needs `w` from W down to weight[i]. Scanning forward re-uses item i in the same pass (accidentally solving unbounded knapsack). Debug: add item with weight=2, value=10, capacity=6. 0/1 answer=10; unbounded answer=30.

**2. Traceback on rolled array** -- 1D rolling arrays save space but lose the traceback path. You cannot reconstruct which items were chosen because dp[w] is overwritten. Fix: keep the full 2D array if you need the actual subsequence/items, not just the length/value.

**3. int overflow in counting DP** -- "count the ways" problems (LC 70 Climbing Stairs, LC 91 Decode Ways) silently overflow int for large n. Always use `long`; apply `% MOD` at every addition step, not just at the end. Applying mod only at the end can overflow before you reach that line.

**4. HashMap with array keys** -- using `dp[int[]]` or `Map<int[], V>` in Java compares by reference, not content. Two `new int[]{1,2}` keys never collide. Fix: encode as `String.valueOf(arr)`, use `Arrays.toString()`, or encode as a long if dimensions allow (e.g., i*1000+j for 0<=i,j<1000).

**5. Off-by-one in string indices** -- LCS/Edit Distance tables are (n+1)x(m+1). dp[i][j] represents prefixes A[0..i-1] and B[0..j-1]. A common mistake: `dp[i][j] = dp[i-1][j-1]` when `A[i] == B[j]` (off by one -- should be `A[i-1]` and `B[j-1]`). Produces wrong answers that only show up for certain string pairs.


---

## 🏢 Enterprise Lens — DP Internals

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Sequence alignment (bioinformatics), diff tools, spell checkers, route planning |
| **Failure modes** | Out-of-memory from full tables; incorrect rolling-array overwrite order; integer overflow in counts |
| **Testing and verification** | Compare space-optimised and full-table versions on random inputs |

---

## Reality Check

**"Top-down memoization and bottom-up tabulation always have the same time complexity"** → Both have the same asymptotic complexity in most cases. Differences: top-down only computes states that are actually needed (useful when many states are unreachable); bottom-up fills the entire table including states never needed. Bottom-up is cache-friendlier (sequential memory access). Top-down uses the call stack (risk of stack overflow for deep recursion). Bottom-up enables space optimisation — if dp[i] depends only on dp[i-1], you can use two variables instead of an array.

**"The hardest part of DP is figuring out the transitions"** → The hardest part is **defining the state** correctly. The transition (the recurrence) follows naturally from the state definition. If your transitions require passing context that isn't in the state, the state definition is incomplete. Common mistake: defining state as `dp[i]` = something about just the first i elements, but then discovering you need to know something about the current element — the state needs that information. Redefine: `dp[i][last_state]` or similar.

**"Knapsack and LCS are different problem families"** → Both are 2D DP problems with similar structural patterns. Knapsack: `dp[i][w]` = max value using items 1..i with weight limit w. LCS: `dp[i][j]` = LCS length of first i chars of s1, first j chars of s2. The transition logic differs, but the state-space setup (2D grid, fill row by row) and space optimization (use two rows) are identical. Recognising structural similarity lets you apply techniques from one family to the other.

**"DP is inherently sequential — it can't be parallelised"** → Standard DP has dependencies (dp[i] depends on dp[i-1]). But many DP problems can be parallelised: matrix-chain multiplication has no inter-row dependencies within the same diagonal — you can fill an entire anti-diagonal in parallel. LCS can be computed one anti-diagonal at a time. Parallel DP is used in bioinformatics (Smith-Waterman on GPUs). The dependency graph, not "it's DP," determines parallelisability.

**"Space-optimised DP (two rows instead of full table) always works"** → Only when dp[i][j] depends solely on the previous row (dp[i-1][...]) and possibly the current row to its left (dp[i][j-1]). It breaks when the recurrence needs values from two rows ago, or multiple diagonals. For LCS: safe (each cell depends only on the cell above, left, and upper-left). For edit distance: safe. For all-pairs shortest path (Floyd-Warshall): needs the full table — space optimisation is not straightforward.
