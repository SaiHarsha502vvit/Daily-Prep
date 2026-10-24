# DP Fundamentals

**Navigation**: [< Previous Chapter](04a_DP_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](04c_DP_Advanced.md)
🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — state definition, transitions, and tabulation strategy

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [University Proof Corner](04b_DP_Fundamentals/01_university_proof_corner.md) | University Proof Corner · JIT Connection — When You Need This | 56 |
| 2 | [What is Dynamic Programming?](04b_DP_Fundamentals/02_what_is_dynamic_programming.md) | What is Dynamic Programming? · Fibonacci — the Gateway to DP · the DP Recipe | 366 |
| 3 | [Classic DP Problems With Traces](04b_DP_Fundamentals/03_classic_dp_problems_with_traces.md) | Classic DP Problems With Traces | 170 |
| 4 | [2d Dynamic Programming](04b_DP_Fundamentals/04_dynamic_programming.md) | 2d Dynamic Programming · DP Patterns · Memoization vs Tabulation · Space Optimization · Practice Problems By Pattern · … | 350 |

## 📌 Dynamic Programming Fundamentals

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [DP Internals](04a_DP_Internals.md), [Recursion](03c_Recursion_Advanced.md) |
| **You will learn** | Recognising DP, defining state, classic patterns (1D, grid, knapsack, LIS, LCS, edit distance) |
| **Leads to** | [DP Advanced](04c_DP_Advanced.md), [Greedy](12_Greedy_Algorithms_Complete.md) |
| **Abstraction level** | L2: pattern library for DP |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — DP Fundamentals

### 1. The bottom line

DP is "recursion with memory" for problems that have overlapping subproblems and optimal substructure.

### 2. The textbook core

- Recipe: **state → transition → base → order → answer**.
- Typical complexities: O(n) for 1D, O(nm) for grids/strings, O(nW) for knapsack (pseudo-polynomial).
- LIS in O(n log n) uses binary search on tails.
- If a greedy choice is provably safe, DP may be unnecessary.

### 3. The real-world analogy

Planning a **road trip with cheapest gas stops**: the best plan to reach city k reuses the best plan to reach earlier cities.

### 4. Walkthrough

1. 0/1 knapsack, capacity 5, items (w=2,v=3), (w=3,v=4).
2. `dp[w]` = best value with capacity `w`; process items one by one, capacity descending.
3. After item 1: dp[2..5] = 3. After item 2: dp[5] = max(3, 3+4)=7.
4. Answer `dp[5] = 7`.

> [!NOTE]
> **Quick check:** Why iterate capacity downward in 1D knapsack? *So each item is used at most once.*

---


### 5W1H: Mastering DP Fundamentals

> [!NOTE]
> **WHAT:** The core principles of Dynamic Programming: Overlapping Subproblems, Optimal Substructure, State Definition, and the 5-step DP recipe.
>
> **WHY:** DP transforms exponential time O(2^N) brute-force recursive solutions into polynomial time O(N) or O(N^2) by trading space for time.
>
> **WHO:** Developers who need to solve optimization problems (max/min/count) where decisions at each step affect future choices.
>
> **WHEN:** Use when a problem asks for the "best/max/min", requires making choices at each step, AND those subproblems overlap (unlike D&C).
>
> **HOW:** By defining the state (e.g., dp[i]), identifying the recurrence relation (e.g., dp[i] = dp[i-1] + dp[i-2]), and applying either Memoization (Top-Down) or Tabulation (Bottom-Up).

### Historical Evolution

**Dynamic Programming** was coined by **Richard Bellman in the 1950s** while working at the RAND Corporation on aerospace research — the name was deliberately chosen as a political shield ("dynamic" sounded impressive to his boss, who had been opposed to "mathematical" research), even though the core ideas of optimal substructure and overlapping subproblems had been studied independently. Bellman's landmark **1957 paper and book** formalized DP as a general method for solving optimization problems with optimal substructure: "An optimal policy has the property that whatever the initial state and initial decision are, the remaining decisions must constitute an optimal policy for the state arising from the first decision" (the Bellman optimality principle). The technique grew out of control theory and operations research, where real-world problems like inventory management, equipment replacement, and resource allocation naturally exhibited overlapping subproblems. **Knuth (1971)** and **Yao (1980)** showed that for recurrences satisfying the quadrangle inequality, monotonicity of the optimal split point reduces the cost (Knuth optimization), so even within DP, structural properties enable faster algorithms. Modern practice (post-2010) applies DP everywhere: shortest path routing (used in GPS and network protocols), natural language processing (Viterbi algorithm for hidden Markov models), and bioinformatics (sequence alignment via Needleman-Wunsch).

---

## 🏢 Enterprise Lens — DP Fundamentals

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Resource allocation, billing and pricing optimisation, text diff, recommendation re-ranking |
| **Failure modes** | Wrong state definition; missing base case; overflow; exponential memory for large states |
| **Testing and verification** | Cross-check against brute force for small inputs; property tests on monotonicity |

---

## Reality Check

**"If I use recursion + memoization, I'm doing DP"** → Top-down memoization IS one form of DP. Bottom-up tabulation is the other. Both exploit overlapping subproblems and optimal substructure. The distinction: top-down computes only needed subproblems (sparse), bottom-up computes all subproblems in a systematic order (often space-optimizable to O(n) or O(1)).

**"DP and greedy both solve optimisation problems — they're interchangeable"** → Greedy makes the locally-optimal choice at each step and never reconsiders. DP considers all possibilities and picks the globally optimal. Greedy is correct only when the greedy-choice property holds (proved by exchange argument). For coin change with arbitrary denominations, DP is required; greedy fails. You cannot swap them without proof.

**"DP always needs a 2D table"** → Many classic DP problems are 2D (knapsack, LCS, edit distance). But Fibonacci, coin change, house robber, max subarray — these are 1D DPs. And many 2D DPs can be space-optimised to 1D (one rolling row). The table dimension follows from the number of independent state variables, not from the problem category.

**"I need to figure out the DP formula before writing code"** → Start by writing the brute-force recursive solution first. Profile which calls are repeated (add a counter). Those repeated calls are exactly the subproblems to memoize. The DP formula IS the recursive relation — you've already written it. This approach avoids getting stuck on "finding the formula" abstractly.

**"DP guarantees finding the globally optimal solution"** → DP finds the optimal *within the problem formulation you defined*. If your state definition is wrong (missing a dimension that actually matters), DP gives the correct answer to the *wrong problem*. State-design errors produce code that runs but gives wrong answers on certain inputs — the hardest DP bugs to find.
