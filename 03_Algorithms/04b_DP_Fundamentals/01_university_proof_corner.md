# 🎓 University Proof Corner

> **Navigation**: [Chapter overview](../04b_DP_Fundamentals.md) | [What is Dynamic Programming? →](02_what_is_dynamic_programming.md)
> Page 1 of 4 in **DP Fundamentals**


> **MIT 6.006 L15–L19 / KTH DD2352 / RWTH Aachen Algo II layer** — Why dynamic programming is provably correct, and why the recurrence captures the optimal solution.

## Optimal Substructure — The Cut-and-Paste Proof

A DP is valid iff every subproblem solution it uses is itself optimal. The standard proof technique is **cut and paste**:

**Claim**: If `dp[i]` is defined as the optimal value for the first `i` items, and the recurrence expresses `dp[i]` in terms of `dp[j]` for `j < i`, then `dp[i]` is correct.

**Proof**: Suppose the recurrence gives `dp[i] = X`, but the true optimum is `Y > X`. The recurrence built `X` by combining optimal solutions to subproblems `dp[j₁], dp[j₂], ...`. Replace any non-optimal subproblem solution with its true optimum — the combined value becomes `Y` (or higher). This contradicts the assumption that `Y` was unattainable. ✓

## Worked Example: 0/1 Knapsack Has Optimal Substructure

**Recurrence**: `dp[i][w] = max(dp[i-1][w], dp[i-1][w - w[i]] + v[i])` — skip item i, or take it.

**Cut-and-paste proof**: Suppose the optimal solution for `dp[i][w]` includes item `i`. Then the remaining items (1..i-1) must fit in capacity `w - w[i]`. If a better subset of items 1..i-1 fit in `w - w[i]`, replace it in the optimal solution — we get a strictly better solution. Contradiction. So the prefix must be optimal for the prefix subproblem. ✓

## Overlapping Subproblems — Why Memoization Wins

Without memoization, naive recursion for Fibonacci calls `F(n-1)` and `F(n-2)`; `F(n-1)` internally calls `F(n-2)` and `F(n-3)`, etc. Total recursive calls = 2·F(n) − 1 = Θ(φⁿ) — exponential.

With memoization, each `F(k)` is computed once. Total work = n additions = Θ(n).

The recursion tree has exponential **nodes** but polynomial **distinct values**. Memoization collapses the exponential redundancy to polynomial. This is what makes DP polynomial — and it is why DP applies only when subproblems repeat.

> Full proofs: [A1 — Algorithm Correctness](../A1_Correctness_Proofs.md) (Section 6: Optimal Substructure)

---

## 🔗 JIT Connection — When You Need This

**Got stuck on a DP problem? Identify which type you're dealing with:**

| DP Pattern      | State Definition                                 | Problem Examples                   | PS Section                              |
| --------------- | ------------------------------------------------ | ---------------------------------- | --------------------------------------- |
| **1D Linear**   | `dp[i]` = answer for first i items               | Climbing Stairs, House Robber, LIS | [DP PS](../../05_Problem_Solving/11_Dynamic_Programming.md) |
| **Grid (2D)**   | `dp[i][j]` = answer at cell (i,j)                | Unique Paths, Min Path Sum         | [DP PS](../../05_Problem_Solving/11_Dynamic_Programming.md) |
| **String (2D)** | `dp[i][j]` = answer for s1[0..i-1] vs s2[0..j-1] | LCS, Edit Distance                 | [DP PS](../../05_Problem_Solving/11_Dynamic_Programming.md) |
| **Knapsack**    | `dp[i][w]` = max value with i items, capacity w  | 0/1 Knapsack, Coin Change          | [DP PS](../../05_Problem_Solving/11_Dynamic_Programming.md) |

**The 5-Step Recipe (memorize this):**

```
1. IDENTIFY subproblem: what is the last decision?
2. DEFINE state: what changes between recursive calls?
3. WRITE recurrence: dp[i] = f(dp[i-1], dp[i-2], ...)
4. BASE CASES: what's the smallest problem you know directly?
5. COMPUTE ORDER: fill table from smallest to largest
```

**Greedy vs DP?** → See [11_Greedy_vs_DP_Decision.md](../../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

[Chapter overview](../04b_DP_Fundamentals.md) | [What is Dynamic Programming? →](02_what_is_dynamic_programming.md)
