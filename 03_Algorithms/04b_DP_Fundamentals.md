**Navigation**: [< Previous Chapter](04a_DP_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](04c_DP_Advanced.md)
🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — state definition, transitions, and tabulation strategy

---

## 🎓 University Proof Corner

> **MIT 6.006 L15–L19 / KTH DD2352 / RWTH Aachen Algo II layer** — Why dynamic programming is provably correct, and why the recurrence captures the optimal solution.

### Optimal Substructure — The Cut-and-Paste Proof

A DP is valid iff every subproblem solution it uses is itself optimal. The standard proof technique is **cut and paste**:

**Claim**: If `dp[i]` is defined as the optimal value for the first `i` items, and the recurrence expresses `dp[i]` in terms of `dp[j]` for `j < i`, then `dp[i]` is correct.

**Proof**: Suppose the recurrence gives `dp[i] = X`, but the true optimum is `Y > X`. The recurrence built `X` by combining optimal solutions to subproblems `dp[j₁], dp[j₂], ...`. Replace any non-optimal subproblem solution with its true optimum — the combined value becomes `Y` (or higher). This contradicts the assumption that `Y` was unattainable. ✓

### Worked Example: 0/1 Knapsack Has Optimal Substructure

**Recurrence**: `dp[i][w] = max(dp[i-1][w], dp[i-1][w - w[i]] + v[i])` — skip item i, or take it.

**Cut-and-paste proof**: Suppose the optimal solution for `dp[i][w]` includes item `i`. Then the remaining items (1..i-1) must fit in capacity `w - w[i]`. If a better subset of items 1..i-1 fit in `w - w[i]`, replace it in the optimal solution — we get a strictly better solution. Contradiction. So the prefix must be optimal for the prefix subproblem. ✓

### Overlapping Subproblems — Why Memoization Wins

Without memoization, naive recursion for Fibonacci calls `F(n-1)` and `F(n-2)`; `F(n-1)` internally calls `F(n-2)` and `F(n-3)`, etc. Total recursive calls = 2·F(n) − 1 = Θ(φⁿ) — exponential.

With memoization, each `F(k)` is computed once. Total work = n additions = Θ(n).

The recursion tree has exponential **nodes** but polynomial **distinct values**. Memoization collapses the exponential redundancy to polynomial. This is what makes DP polynomial — and it is why DP applies only when subproblems repeat.

> Full proofs: [A1 — Algorithm Correctness](A1_Correctness_Proofs.md) (Section 6: Optimal Substructure)

---

## 🔗 JIT Connection — When You Need This

**Got stuck on a DP problem? Identify which type you're dealing with:**

| DP Pattern      | State Definition                                 | Problem Examples                   | PS Section                              |
| --------------- | ------------------------------------------------ | ---------------------------------- | --------------------------------------- |
| **1D Linear**   | `dp[i]` = answer for first i items               | Climbing Stairs, House Robber, LIS | [DP PS](../05_Problem_Solving/07_DP.md) |
| **Grid (2D)**   | `dp[i][j]` = answer at cell (i,j)                | Unique Paths, Min Path Sum         | [DP PS](../05_Problem_Solving/07_DP.md) |
| **String (2D)** | `dp[i][j]` = answer for s1[0..i-1] vs s2[0..j-1] | LCS, Edit Distance                 | [DP PS](../05_Problem_Solving/07_DP.md) |
| **Knapsack**    | `dp[i][w]` = max value with i items, capacity w  | 0/1 Knapsack, Coin Change          | [DP PS](../05_Problem_Solving/07_DP.md) |

**The 5-Step Recipe (memorize this):**

```
1. IDENTIFY subproblem: what is the last decision?
2. DEFINE state: what changes between recursive calls?
3. WRITE recurrence: dp[i] = f(dp[i-1], dp[i-2], ...)
4. BASE CASES: what's the smallest problem you know directly?
5. COMPUTE ORDER: fill table from smallest to largest
```

**Greedy vs DP?** → See [11_Greedy_vs_DP_Decision.md](../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

# 📌 Dynamic Programming Fundamentals

### 5W1H: Mastering DP Fundamentals

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHAT: The core principles of Dynamic Programming: Overlapping Subproblems,  ║
║        Optimal Substructure, State Definition, and the 5-step DP recipe.     ║
║                                                                              ║
║  WHY:  DP transforms exponential time O(2^N) brute-force recursive solutions ║
║        into polynomial time O(N) or O(N^2) by trading space for time.        ║
║                                                                              ║
║  WHO:  Developers who need to solve optimization problems (max/min/count)    ║
║        where decisions at each step affect future choices.                   ║
║                                                                              ║
║  WHEN: Use when a problem asks for the "best/max/min", requires making       ║
║        choices at each step, AND those subproblems overlap (unlike D&C).     ║
║                                                                              ║
║  HOW:  By defining the state (e.g., dp[i]), identifying the recurrence       ║
║        relation (e.g., dp[i] = dp[i-1] + dp[i-2]), and applying either       ║
║        Memoization (Top-Down) or Tabulation (Bottom-Up).                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Historical Evolution

**Dynamic Programming** was coined by **Richard Bellman in the 1950s** while working at the RAND Corporation on aerospace research — the name was deliberately chosen as a political shield ("dynamic" sounded impressive to his boss, who had been opposed to "mathematical" research), even though the core ideas of optimal substructure and overlapping subproblems had been studied independently. Bellman's landmark **1957 paper and book** formalized DP as a general method for solving optimization problems with optimal substructure: "An optimal policy has the property that whatever the initial state and initial decision are, the remaining decisions must constitute an optimal policy for the state arising from the first decision" (the Bellman optimality principle). The technique grew out of control theory and operations research, where real-world problems like inventory management, equipment replacement, and resource allocation naturally exhibited overlapping subproblems. **Knuth's 1970s optimizations** for specific DP recurrences (monotonicity, quadrangle inequality) showed that even within DP, structural properties enable faster algorithms. Modern practice (post-2010) applies DP everywhere: shortest path routing (used in GPS and network protocols), natural language processing (Viterbi algorithm for hidden Markov models), and bioinformatics (sequence alignment via Needleman-Wunsch).

---

## What is Dynamic Programming?

```

╔══════════════════════════════════════════════════════════════════════════════╗
║ DYNAMIC PROGRAMMING - COMPLETE UNDERSTANDING                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DYNAMIC PROGRAMMING?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Dynamic Programming (DP) is a method for solving complex problems by:        │
│ 1. Breaking them into simpler OVERLAPPING subproblems                        │
│ 2. Solving each subproblem ONLY ONCE                                         │
│ 3. STORING the results to avoid redundant computation                        │
│                                                                              │
│ DP = RECURSION + MEMOIZATION (REMEMBERING)                                   │
│                                                                              │
│ INVENTOR: Richard Bellman (1950s) at RAND Corporation                        │
│ NAME ORIGIN: "Dynamic" sounded impressive to government funders!             │
│ (Bellman chose it to hide the mathematical nature of his work)               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES DP SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Optimization problems where:                                   │
│ • You need the BEST solution (max/min)                                       │
│ • Making decisions at each step                                              │
│ • Decisions affect future choices                                            │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Navigation: What's the shortest route? (Same intersections = subproblems)  │
│ • Finance: Max profit from stock trades (Each day = decision point)          │
│ • Text: How similar are two strings? (Edit distance)                         │
│ • Packing: Most value in limited space (Knapsack problem)                    │
│ • Scheduling: Best order for tasks (Job scheduling)                          │
│                                                                              │
│ THE INSIGHT:                                                                 │
│ Instead of exploring ALL possible combinations (exponential), DP builds      │
│ optimal solutions from optimal sub-solutions (polynomial)!                   │
│                                                                              │
│ BEFORE DP (Brute Force): O(2^n) or worse - trying all combinations           │
│ AFTER DP: O(n²) or O(n×m) - building from subproblems                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES DP WORK? (THE MATHEMATICAL FOUNDATION)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TWO ESSENTIAL PROPERTIES (Both MUST be true):                                │
│                                                                              │
│ 1. OPTIMAL SUBSTRUCTURE                                                      │
│ "Optimal solution to the whole = combination of optimal sub-solutions"       │
│                                                                              │
│ Example: Shortest Path A→C                                                   │
│ If A→B→C is shortest, then:                                                  │
│ • A→B part must be the shortest A→B path                                     │
│ • B→C part must be the shortest B→C path                                     │
│                                                                              │
│ If this wasn't true, you could find a shorter A→C!                           │
│                                                                              │
│ 2. OVERLAPPING SUBPROBLEMS                                                   │
│ "Same subproblems appear multiple times during recursion"                    │
│                                                                              │
│ Example: Fibonacci fib(5)                                                    │
│ fib(5) = fib(4) + fib(3)                                                     │
│ fib(4) = fib(3) + fib(2) ← fib(3) needed TWICE!                              │
│ fib(3) = fib(2) + fib(1) ← fib(2) needed THRICE!                             │
│                                                                              │
│ If subproblems DON'T overlap → Use Divide & Conquer instead!                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DP? (INTERVIEW RECOGNITION PATTERNS)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ SIGNAL 1: "Find maximum/minimum..." or "Count the number of ways..."         │
│ → Optimization = DP likely                                                   │
│                                                                              │
│ SIGNAL 2: "Given choices at each step..."                                    │
│ → Decision making with future consequences = DP                              │
│                                                                              │
│ SIGNAL 3: "Can you reach...?" or "Is it possible...?"                        │
│ → Often can be framed as DP (true/false states)                              │
│                                                                              │
│ SIGNAL 4: Problem involves sequences/grids                                   │
│ → String problems, matrix traversal = Classic DP                             │
│                                                                              │
│ SIGNAL 5: Same question repeated with different parameters                   │
│ → Recursive structure with overlapping = DP                                  │
│                                                                              │
│ ┌────────────────────────────────┬─────────────────────────────────────────┐ │
│ │ USE DP WHEN │ DON'T USE DP WHEN │                                          │
│ ├────────────────────────────────┼─────────────────────────────────────────┤ │
│ │ Need optimal solution │ Just need any valid solution │                     │
│ │ Subproblems overlap │ Subproblems independent (use D&C) │                  │
│ │ Problem has optimal structure │ Local choices don't build global optimal│  │
│ │ Can define clear state │ State space is too large │                        │
│ └────────────────────────────────┴─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES DP WORK? (TWO APPROACHES)                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ APPROACH 1: TOP-DOWN (MEMOIZATION)                                           │
│ ┌─────────────────────────────────────────────────────────────┐              │
│ │ 1. Start with original problem │                                           │
│ │ 2. Recursively break into subproblems │                                    │
│ │ 3. Before computing, check if answer already cached │                      │
│ │ 4. If cached: return it | If not: compute and cache │                      │
│ │ │                                                                          │
│ │ ANALOGY: You're asked a hard question. You think recursively │             │
│ │ but write down answers you've figured out on a notepad. │                  │
│ └─────────────────────────────────────────────────────────────┘              │
│                                                                              │
│ APPROACH 2: BOTTOM-UP (TABULATION)                                           │
│ ┌─────────────────────────────────────────────────────────────┐              │
│ │ 1. Identify base cases (smallest subproblems) │                            │
│ │ 2. Fill table starting from base cases │                                   │
│ │ 3. Build up to the answer iteratively │                                    │
│ │ 4. Final cell contains the answer │                                        │
│ │ │                                                                          │
│ │ ANALOGY: Building a pyramid brick by brick from the bottom. │              │
│ │ Each brick relies on the ones below it. │                                  │
│ └─────────────────────────────────────────────────────────────┘              │
│                                                                              │
│ COMPARISON:                                                                  │
│ ┌───────────────────────┬───────────────────────────────────────┐            │
│ │ Top-Down (Memo) │ Bottom-Up (Tabulation) │                                 │
│ ├───────────────────────┼───────────────────────────────────────┤            │
│ │ Easier to write │ Usually faster (no recursion) │                          │
│ │ Only solves needed │ Solves ALL subproblems │                              │
│ │ Risk of stack overflow│ No stack overflow │                                │
│ │ Lazy evaluation │ Eager evaluation │                                       │
│ └───────────────────────┴───────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. IDENTIFYING THE STATE (Hardest Part!):                                    │
│ "What information do I need to solve a subproblem?"                          │
│ Wrong state definition = wrong solution                                      │
│ Tip: Ask "What changes between recursive calls?"                             │
│                                                                              │
│ 2. FINDING THE RECURRENCE:                                                   │
│ "How does current state relate to previous states?"                          │
│ Tip: Think about the LAST decision/step                                      │
│                                                                              │
│ 3. BASE CASE ERRORS:                                                         │
│ Missing or wrong base cases cause wrong answers                              │
│ Tip: What's the smallest problem you can answer directly?                    │
│                                                                              │
│ 4. OFF-BY-ONE ERRORS:                                                        │
│ Array indices, loop bounds - classic source of bugs                          │
│ Tip: Trace through small examples by hand                                    │
│                                                                              │
│ 5. SPACE COMPLEXITY:                                                         │
│ 2D DP tables can be huge for large inputs                                    │
│ Tip: Often can optimize to 1D by keeping only previous row                   │
│                                                                              │
│ 6. RECONSTRUCTION PATH:                                                      │
│ DP gives optimal VALUE, but sometimes you need the actual SOLUTION           │
│ Tip: Store "choice made" at each step, then backtrack                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ COMPLEXITY IMPROVEMENT (Why DP is Powerful):                                 │
│ ┌──────────────────────┬─────────────────────┬────────────────────────────┐  │
│ │ Problem │ Brute Force │ With DP │                                          │
│ ├──────────────────────┼─────────────────────┼────────────────────────────┤  │
│ │ Fibonacci │ O(2^n) │ O(n) │                                                │
│ │ Longest Common Subseq│ O(2^(m+n)) │ O(m×n) │                               │
│ │ 0/1 Knapsack │ O(2^n) │ O(n×W) │                                           │
│ │ Edit Distance │ O(3^n) │ O(m×n) │                                          │
│ │ Matrix Chain │ O(n!) │ O(n³) │                                             │
│ │ Coin Change │ O(amount^n) │ O(n×amount) │                                  │
│ └──────────────────────┴─────────────────────┴────────────────────────────┘  │
│                                                                              │
│ TYPICAL DP OUTPUT:                                                           │
│ • Single number: Max profit, min cost, number of ways                        │
│ • Boolean: Is it possible?                                                   │
│ • Array/Table: All subproblem solutions (for path reconstruction)            │
│ • The actual solution: Requires backtracking through DP table                │
│                                                                              │
│ SPACE-TIME TRADEOFF:                                                         │
│ • Standard 2D DP: O(n×m) time, O(n×m) space                                  │
│ • Space-optimized: O(n×m) time, O(min(n,m)) space (keep 2 rows)              │
│ • Ultra-optimized: Sometimes O(1) space possible (like Fibonacci)            │
└──────────────────────────────────────────────────────────────────────────────┘


### The Story Metaphor


THE STORY:
Imagine you're solving a maze. Every time you hit a dead end,
you go back to the start and try again.

BRUTE FORCE:

- Start → try path A → dead end → go back to start
- Start → try path B → dead end → go back to start
- You keep walking the same initial path!

SMART WAY (DP):

- Start → try path A → dead end → MARK IT
- Go back, but remember "path A = dead end"
- Next time, skip path A directly!

THIS IS MEMOIZATION: Remember what you've already calculated.

```

---

🔬 **Section Challenge — What is Dynamic Programming?**

**Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?

<details><summary>Answer</summary>

Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.

</details>

**Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.

<details><summary>Answer</summary>

State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.

</details>

# 📌 Part 2: Fibonacci — the Gateway to DP

## Evolution of Solutions

### Level 1: Pure Recursion (❌ Inefficient)

```java
public int fibRecursive(int n) {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// TIME: O(2^n) - Exponential!
// SPACE: O(n) - Call stack

// CALL TREE for fib(5):
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3)
//                   /    \      /    \
//               fib(3)  fib(2) fib(2) fib(1)
//               /   \
//           fib(2) fib(1)
//
// fib(3) computed 2 times
// fib(2) computed 3 times
// WASTEFUL!
```

### Level 2: Memoization - Top Down (✅ Efficient)

```java
public int fibMemo(int n, int[] memo) {
    // Base case
    if (n <= 1) return n;

    // Check if already computed
    if (memo[n] != 0) return memo[n];

    // Compute and STORE
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);

    return memo[n];
}

// Usage: fibMemo(n, new int[n + 1])
// TIME: O(n) - Each subproblem solved once
// SPACE: O(n) - Memo array + call stack

// CALL TREE with memoization:
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3) ← CACHED! Return immediately
//                   /    \
//               fib(3)  fib(2) ← CACHED!
//               /   \
//           fib(2) fib(1)
//           /   \
//       fib(1) fib(0)
```

### Level 3: Tabulation - Bottom Up (✅✅ Best)

```java
public int fibTabulation(int n) {
    if (n <= 1) return n;

    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = 1;

    // Build from smallest to largest
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TIME: O(n)
// SPACE: O(n)

// TRACE for n = 5:
// dp[0] = 0
// dp[1] = 1
// dp[2] = dp[1] + dp[0] = 1 + 0 = 1
// dp[3] = dp[2] + dp[1] = 1 + 1 = 2
// dp[4] = dp[3] + dp[2] = 2 + 1 = 3
// dp[5] = dp[4] + dp[3] = 3 + 2 = 5
```

### Level 4: Space Optimized (✅✅✅ Perfect)

```java
public int fibOptimized(int n) {
    if (n <= 1) return n;

    int prev2 = 0;  // dp[i-2]
    int prev1 = 1;  // dp[i-1]

    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}

// TIME: O(n)
// SPACE: O(1) - Only 2 variables!

// INSIGHT: We only need last 2 values, not entire array!
```

---

# 📌 Part 3: the DP Recipe

## 5-Step Process

```
STEP 1: IDENTIFY SUBPROBLEM
        "What is the last decision/action?"
        "What information do I need at each step?"

STEP 2: DEFINE STATE
        dp[i] = "answer for subproblem of size i"
        dp[i][j] = "answer considering first i items with capacity j"

STEP 3: FIND RECURRENCE RELATION
        "How does dp[i] relate to smaller subproblems?"
        dp[i] = some_function(dp[i-1], dp[i-2], ...)

STEP 4: IDENTIFY BASE CASES
        "What are the smallest subproblems I know directly?"
        dp[0] = ?, dp[1] = ?

STEP 5: DETERMINE COMPUTATION ORDER
        "In what order should I fill the table?"
        Usually: smaller to larger
```

---

# 🧩 Part 4: Classic DP Problems With Traces

## Problem 1: Climbing Stairs

```java
// You can climb 1 or 2 stairs at a time.
// How many ways to reach step n?

// STEP 1: Last action? Either climb 1 step OR 2 steps
// STEP 2: dp[i] = number of ways to reach step i
// STEP 3: dp[i] = dp[i-1] + dp[i-2]
//         (ways to reach i = ways via i-1 + ways via i-2)
// STEP 4: dp[1] = 1, dp[2] = 2
// STEP 5: Fill from 3 to n

public int climbStairs(int n) {
    if (n <= 2) return n;

    int[] dp = new int[n + 1];
    dp[1] = 1;  // 1 way to reach step 1
    dp[2] = 2;  // 2 ways to reach step 2: (1+1) or (2)

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TRACE for n = 5:
// dp[1] = 1    (just step 1)
// dp[2] = 2    (1+1 or 2)
// dp[3] = dp[2] + dp[1] = 2 + 1 = 3    (1+1+1, 1+2, 2+1)
// dp[4] = dp[3] + dp[2] = 3 + 2 = 5
// dp[5] = dp[4] + dp[3] = 5 + 3 = 8
//
// WHY does dp[3] = dp[2] + dp[1]?
// To reach step 3:
//   - Be at step 2, take 1 step → dp[2] ways
//   - Be at step 1, take 2 steps → dp[1] ways
//   Total = dp[2] + dp[1]
```

## Problem 2: House Robber

```java
// Can't rob adjacent houses. Maximize total.
// houses = [2, 7, 9, 3, 1]

// STEP 1: For house i, either rob it OR skip it
// STEP 2: dp[i] = max money robbing houses 0 to i
// STEP 3: dp[i] = max(dp[i-1], dp[i-2] + houses[i])
//         Either skip house i (dp[i-1]) OR rob i (dp[i-2] + houses[i])
// STEP 4: dp[0] = houses[0], dp[1] = max(houses[0], houses[1])
// STEP 5: Fill from 2 to n-1

public int rob(int[] houses) {
    if (houses.length == 0) return 0;
    if (houses.length == 1) return houses[0];

    int[] dp = new int[houses.length];
    dp[0] = houses[0];
    dp[1] = Math.max(houses[0], houses[1]);

    for (int i = 2; i < houses.length; i++) {
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + houses[i]);
    }

    return dp[houses.length - 1];
}

// TRACE for houses = [2, 7, 9, 3, 1]:
// dp[0] = 2
// dp[1] = max(2, 7) = 7
// dp[2] = max(dp[1], dp[0] + 9) = max(7, 2+9) = 11  [rob houses 0, 2]
// dp[3] = max(dp[2], dp[1] + 3) = max(11, 7+3) = 11 [still best: houses 0, 2]
// dp[4] = max(dp[3], dp[2] + 1) = max(11, 11+1) = 12 [rob houses 0, 2, 4]
//
// Answer: 12 (rob houses at indices 0, 2, 4 → values 2, 9, 1)
```

## Problem 3: Coin Change

```java
// coins = [1, 2, 5], amount = 11
// Find minimum coins needed

// STEP 1: Last coin used could be any of the coins
// STEP 2: dp[i] = min coins to make amount i
// STEP 3: dp[i] = min(dp[i - coin] + 1) for each coin
// STEP 4: dp[0] = 0 (0 coins for amount 0)
// STEP 5: Fill from 1 to amount

public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);  // "infinity"
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }

    return dp[amount] > amount ? -1 : dp[amount];
}

// TRACE for coins = [1, 2, 5], amount = 11:
// dp[0] = 0
// dp[1] = min(dp[0]+1) = 1                    [1]
// dp[2] = min(dp[1]+1, dp[0]+1) = min(2, 1) = 1    [2]
// dp[3] = min(dp[2]+1, dp[1]+1) = min(2, 2) = 2    [2,1] or [1,1,1]
// dp[4] = min(dp[3]+1, dp[2]+1) = min(3, 2) = 2    [2,2]
// dp[5] = min(dp[4]+1, dp[3]+1, dp[0]+1) = min(3, 3, 1) = 1    [5]
// dp[6] = min(dp[5]+1, dp[4]+1, dp[1]+1) = min(2, 3, 2) = 2    [5,1]
// ...
// dp[11] = 3    [5, 5, 1]
```

## Problem 4: Longest Increasing Subsequence (LIS)

```java
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
// Find length of longest strictly increasing subsequence

// STEP 1: For each element, either include it or not
// STEP 2: dp[i] = length of LIS ending at index i
// STEP 3: dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]
// STEP 4: dp[i] = 1 for all (each element is LIS of length 1)
// STEP 5: Fill from 0 to n-1, track maximum

public int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);  // Each element is LIS of length 1
    int maxLen = 1;

    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }

    return maxLen;
}

// TRACE for nums = [10, 9, 2, 5, 3, 7, 101, 18]:
// Index:  0   1  2  3  4  5   6    7
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
//
// dp[0] = 1 (just 10)
// dp[1] = 1 (9, can't extend from 10)
// dp[2] = 1 (2, can't extend)
// dp[3] = max(dp[2]+1) = 2 (2 < 5, so LIS: [2,5])
// dp[4] = max(dp[2]+1) = 2 (2 < 3, LIS: [2,3])
// dp[5] = max(dp[2]+1, dp[3]+1, dp[4]+1) = max(2, 3, 3) = 3
//         LIS options: [2,5,7] or [2,3,7]
// dp[6] = max(dp[0]+1, ..., dp[5]+1) = 4 (LIS: [2,5,7,101])
// dp[7] = 4 (LIS: [2,5,7,18])
//
// Answer: 4
```

---

# 💎 Part 5: 2d Dynamic Programming

## Problem 5: Unique Paths

```java
// Grid of m x n. How many ways from top-left to bottom-right?
// Can only move right or down.

// STEP 2: dp[i][j] = number of ways to reach cell (i, j)
// STEP 3: dp[i][j] = dp[i-1][j] + dp[i][j-1]
// STEP 4: dp[0][j] = 1, dp[i][0] = 1 (only one way to reach first row/col)

public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];

    // Base cases: first row and first column
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    for (int i = 0; i < m; i++) dp[i][0] = 1;

    // Fill the rest
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }

    return dp[m - 1][n - 1];
}

// TRACE for m=3, n=3:
// dp table:
// 1  1  1
// 1  2  3
// 1  3  6
//
// dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2
// dp[1][2] = dp[0][2] + dp[1][1] = 1 + 2 = 3
// dp[2][1] = dp[1][1] + dp[2][0] = 2 + 1 = 3
// dp[2][2] = dp[1][2] + dp[2][1] = 3 + 3 = 6
```

## Problem 6: Longest Common Subsequence (LCS)

```java
// text1 = "abcde", text2 = "ace"
// Find length of longest common subsequence

// STEP 2: dp[i][j] = LCS of text1[0...i-1] and text2[0...j-1]
// STEP 3: If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
//         Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
// STEP 4: dp[0][j] = 0, dp[i][0] = 0 (empty string)

public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
}

// TRACE for text1 = "abcde", text2 = "ace":
//     ""  a  c  e
// ""   0  0  0  0
// a    0  1  1  1
// b    0  1  1  1
// c    0  1  2  2
// d    0  1  2  2
// e    0  1  2  3
//
// Answer: 3 (LCS = "ace")
```

## Problem 7: 0/1 Knapsack

```java
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
// Maximize value without exceeding capacity

// STEP 2: dp[i][w] = max value using items 0..i-1 with capacity w
// STEP 3: dp[i][w] = max(
//           dp[i-1][w],                    // Don't take item i-1
//           dp[i-1][w-weight[i-1]] + value[i-1]  // Take item i-1
//         )
// STEP 4: dp[0][w] = 0 (no items)

public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// TRACE for weights=[1,2,3], values=[6,10,12], capacity=5:
//       w: 0  1  2  3  4  5
// item 0:  0  0  0  0  0  0
// item 1:  0  6  6  6  6  6   (item 0: w=1, v=6)
// item 2:  0  6 10 16 16 16   (item 1: w=2, v=10)
// item 3:  0  6 10 16 18 22   (item 2: w=3, v=12)
//
// dp[3][5] = 22 (take items 1 and 2: weights 2+3=5, values 10+12=22)
```

---

# 🎨 Part 6: DP Patterns

## Pattern 1: Linear DP

```
dp[i] depends on dp[i-1], dp[i-2], etc.
Examples: Fibonacci, House Robber, Climbing Stairs

STATE: Single index
TRANSITION: dp[i] = f(dp[i-1], dp[i-2], ...)




## Pattern 2: Grid DP

dp[i][j] depends on dp[i-1][j], dp[i][j-1], dp[i-1][j-1]
Examples: Unique Paths, Min Path Sum, Edit Distance

STATE: Two indices (row, column)
TRANSITION: dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])



## Pattern 3: String DP

dp[i][j] for two strings s1[0..i], s2[0..j]
Examples: LCS, Edit Distance, Regex Matching

STATE: Indices into both strings
TRANSITION: Based on character match/mismatch




## Pattern 4: Knapsack DP

dp[i][w] for items 0..i with capacity w
Examples: 0/1 Knapsack, Subset Sum, Coin Change

STATE: Item index + remaining capacity
TRANSITION: Take or don't take current item



## Pattern 5: Interval DP

dp[i][j] for interval [i, j]
Examples: Matrix Chain Multiplication, Burst Balloons

STATE: Start and end of interval
TRANSITION: Try all split points k between i and j
```

---

# 🧠 Part 7: Memoization vs Tabulation

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMOIZATION (Top-Down)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Recursive with caching                             │
│ Direction:   Start from main problem, recurse to subproblems    │
│ When used:   Only computes needed subproblems                   │
│ Space:       Recursion stack + memo table                       │
│ Pros:        Natural, easy to write, lazy evaluation            │
│ Cons:        Recursion overhead, stack overflow risk            │
├─────────────────────────────────────────────────────────────────┤
│                    TABULATION (Bottom-Up)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Iterative with table                               │
│ Direction:   Start from base cases, build up to main problem    │
│ When used:   Computes ALL subproblems                           │
│ Space:       Just the table (no stack)                          │
│ Pros:        No recursion overhead, can optimize space          │
│ Cons:        Need to think about computation order              │
└─────────────────────────────────────────────────────────────────┘

WHEN TO USE WHICH?

MEMOIZATION:
- When not all subproblems are needed
- When recursion depth is manageable
- When problem is easier to think recursively

TABULATION:
- When you need all subproblems anyway
- When recursion depth could overflow
- When you want to optimize space (sliding window)
```

---

# ⚡ Part 8: Space Optimization

```java
// Many DP problems can be optimized from O(n²) to O(n) space!

// EXAMPLE: LCS can be done with 2 rows instead of full table
public int lcsOptimized(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[] prev = new int[n + 1];
    int[] curr = new int[n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        // Swap rows
        int[] temp = prev;
        prev = curr;
        curr = temp;
        Arrays.fill(curr, 0);
    }

    return prev[n];
}

// KEY INSIGHT:
// If dp[i][j] only depends on dp[i-1][...] and dp[i][j-1]
// You only need 2 rows (or even 1 row with careful ordering)!
```

---

# 💪 Part 9: Practice Problems By Pattern

## Linear DP

1. Climbing Stairs
2. House Robber
3. Maximum Subarray (Kadane's)
4. Best Time to Buy and Sell Stock
5. Decode Ways

## Grid DP

1. Unique Paths
2. Minimum Path Sum
3. Maximal Square
4. Dungeon Game
5. Cherry Pickup

## String DP

1. Longest Common Subsequence
2. Edit Distance
3. Longest Palindromic Subsequence
4. Regular Expression Matching
5. Wildcard Matching

## Knapsack DP

1. 0/1 Knapsack
2. Coin Change
3. Partition Equal Subset Sum
4. Target Sum
5. Ones and Zeroes

---

# 📌 Part 10: Edge Cases Checklist

```
⬜ Empty input: n = 0, empty array, empty string
⬜ Single element: n = 1, single character
⬜ All same values: [5, 5, 5, 5]
⬜ All zeros: [0, 0, 0, 0]
⬜ Negative values: [-1, -2, -3]
⬜ Large values: near Integer.MAX_VALUE (overflow!)
⬜ No solution exists: return -1 or special value
⬜ Multiple solutions: verify you want min/max/count
```

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                                 | Related Content                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| DP pattern recognition                | [DP Pattern Recognition](../04_Patterns_Templates/16_DP_Pattern_Recognition.md) |
| DP practice problems                  | [Problem Solving — DP](../05_Problem_Solving/11_Dynamic_Programming.md)         |
| Knapsack family (DP)                  | [Knapsack Family](../04_Patterns_Templates/23_Knapsack_Family.md)               |
| Memoization in React (useMemo)        | [React Hooks](../15_React_Frontend/03_Hooks_Deep_Dive.md)                       |
| Optimization in ML (gradient descent) | [Math for ML](../21_Python_ML_DL_NLP/04_Math_For_ML.md)                         |
| Greedy vs DP                          | [Greedy Algorithms](12_Greedy_Algorithms_Complete.md)                           |

---

## 📎 Reference Anchor

**OpenJDK / Apache Commons — DP in production**
- `String.valueOf()` / `String.format()`: Java's `String` class uses DP-like memoization internally for `intern()` — strings are deduplicated in the string pool, equivalent to memoizing character sequences.
- Apache Commons Text `LevenshteinDistance`: [LevenshteinDistance.java](https://github.com/apache/commons-text/blob/master/src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java) — production edit-distance DP with space-optimized rolling array (O(min(m,n)) space). **Invariant**: `dp[i][j]` = edit distance between first i chars of s1 and first j chars of s2. Rolling array keeps only current and previous row.
- **Local rewrite rule**: Top-down (memoized) DP has function call overhead per subproblem. Bottom-up avoids call stack entirely — for n > 10⁴ subproblems, bottom-up is 2–5× faster in Java due to reduced GC and call overhead.
- **Constraint warning**: `int[][] dp = new int[n+1][m+1]` for n=m=10⁴ = 400 MB — exceeds default heap. Use rolling array (O(m)) or sparse map for large-n DP.

---

## When DP Breaks

### 1. Identifying the Wrong State — Missing a Dimension
**What breaks**: Coin change with coin limit — "minimum coins to make amount A, using each coin at most k times." Naive state `dp[a]` loses track of how many times each coin was used. The correct state is `dp[a][coin_index]` or `dp[a][count]`.
**Rule**: If the recurrence's "remaining choice" doesn't fit in a single integer, add a dimension. Missing state dimensions cause silently wrong answers, not runtime errors.

### 2. Memoizing with Mutable State (Wrong Cache Key)
**What breaks**: Using an array reference as a HashMap key in top-down memoization. Two calls with arrays `{1,2,3}` and `{1,2,3}` (different objects, same values) produce different keys → cache is never hit → exponential time despite the memo table.
**Fix**: Serialize state to a canonical key (e.g., `Arrays.toString(arr) + "," + index`) or convert to an `int` index if state space is bounded.

### 3. Off-by-One in Base Case Initialization
**What breaks**: `dp[0] = 1` vs `dp[0] = 0` is the most common DP bug. For coin change (minimum coins): `dp[0] = 0` (0 coins for amount 0). For count of ways: `dp[0] = 1` (one way to make 0: use no coins). Mixing these gives answers off by 1 or wrong by a factor.
**Debug technique**: Trace the base case by hand for amount=0 and amount=1 before running. These two values exercise the init and the first step.

### 4. Unbounded vs 0/1 vs Bounded — Wrong Loop Direction
**What breaks**: 0/1 Knapsack requires iterating the weight dimension *backwards* (to prevent reusing the same item). Iterating forwards accidentally makes it unbounded knapsack (each item usable many times). This is the single most common knapsack implementation bug.
**Fix**: 0/1 → inner loop `for (w = capacity; w >= weight[i]; w--)`. Unbounded → inner loop `for (w = weight[i]; w <= capacity; w++)`.
