> **Navigation**: [← DP Fundamentals](04b_DP_Fundamentals.md) | [Chapter index](00_INDEX.md) | [Backtracking →](11_Backtracking_Complete.md)
> 🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — advanced state design and optimization

---

# 🚀 Advanced DP Patterns

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [DP Fundamentals](04b_DP_Fundamentals.md) |
| **You will learn** | Bitmask DP, digit DP, interval DP, tree DP, profile DP, and DP optimisations |
| **Leads to** | [Greedy](12_Greedy_Algorithms_Complete.md), [NP-hardness](A3_Lower_Bounds_And_NP.md) |
| **Abstraction level** | L2→L7: exponential and structured state spaces |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Advanced DP

### 1. The bottom line

Advanced DP encodes complicated states (subsets, digits, tree positions) compactly so exponential problems become feasible for small sizes.

### 2. The textbook core

- **Bitmask DP:** state is a subset; 2ⁿ states, n ≤ ~20.
- **Digit DP:** count numbers ≤ N with a property by processing digits with a tight flag.
- **Interval DP:** `dp[l][r]` over ranges, O(n³) typical.
- **Tree DP:** compute child results then combine at the parent.

### 3. The real-world analogy

A **packing list as a checklist of ticked boxes**: the pattern of ticks (a bitmask) is the state.

### 4. Walkthrough

1. TSP with 4 cities, mask `0101` = cities 0 and 2 visited.
2. `dp[mask][last]` = cheapest cost having visited `mask` and ended at `last`.
3. Add city `k` not in mask: `dp[mask | 1<<k][k]`.
4. Answer: min over `dp[full][last] + dist[last][0]`.

> [!NOTE]
> **Quick check:** Why does bitmask DP stop around n = 20? *2ⁿ·n states exceed memory/time.*

---


### 5W1H: Mastering Advanced DP

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHAT: Advanced DP techniques: Digit DP, Bitmask DP, Interval DP, Tree DP,   ║
║        and Monotonic Optimization for solving complex CP/interview problems. ║
║                                                                              ║
║  WHY:  Standard 1D/2D DP fails when state spaces are subsets (Bitmask),      ║
║        when boundaries are dynamic (Interval), or when numbers are massive   ║
║        (Digit DP). Advanced states encapsulate more complex constraints.     ║
║                                                                              ║
║  WHO:  Senior engineers and competitive programmers preparing for hard       ║
║        technical interviews or optimizing complex real-world constraints.    ║
║                                                                              ║
║  WHEN: Use when N is very small (N≤20) → Bitmask DP.                         ║
║        Use when counting numbers with digit rules → Digit DP.                ║
║        Use for optimal splitting/parenthesization → Interval DP.             ║
║                                                                              ║
║  HOW:  By mastering state compression (bitmasks), specialized loop bounds    ║
║        (interval lengths), and combining subtree results (Tree DP).          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Historical Evolution

Advanced DP variants emerged from the need to handle state spaces that simple 1D/2D tables cannot efficiently represent. **Bitmask DP** over subsets goes back to the **Held–Karp (1962)** and **Bellman (1962)** dynamic programs for the travelling salesman problem, which solve it in O(2ⁿ·n²) instead of O(n!); it became a competitive-programming staple because n ≤ 20 states fit in a 32-bit integer. **Digit DP** is a competitive-programming technique (counting numbers with digit constraints by processing digits left to right with a "tight" flag) with no single inventor. **Knuth optimization** (**Knuth 1971**, generalised by **Yao 1980**) uses the monotonicity of optimal split points, `opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j]`, which holds when the cost satisfies the quadrangle inequality, to cut interval DPs such as optimal binary search trees from O(n³) to O(n²); it does **not** apply to matrix-chain multiplication (which has a separate O(n log n) algorithm by Hu and Shing). **Monotonic-deque optimisation** of DP transitions follows from sliding-window minimum techniques. Modern practice (post-2010) applies these techniques in competitive programming (Codeforces, AtCoder) and in production systems like network routing where TSP variants appear in logistics optimization.


### 5. Check yourself

**Q1.** How many states does bitmask DP for TSP have with `n = 20`?

<details><summary>Answer</summary>

About `n · 2ⁿ = 20 · 1 048 576 ≈ 2.1·10⁷`.

</details>

**Q2.** Typical time of interval DP?

<details><summary>Answer</summary>

`O(n³)` (choose a split point inside every interval).

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Advanced DP Patterns](04c_DP_Advanced/01_advanced_dp_patterns.md) | Advanced DP Patterns · Pattern 1: Digit DP · Pattern 2: Bitmask DP | 270 |
| 2 | [Pattern 3: Interval DP](04c_DP_Advanced/02_interval_dp.md) | Pattern 3: Interval DP | 152 |
| 3 | [Pattern 4: Tree DP](04c_DP_Advanced/03_tree_dp.md) | Pattern 4: Tree DP · Pattern 5: DP with Monotonic Optimization | 200 |
| 4 | [Complete DP Problem Solutions](04c_DP_Advanced/04_complete_dp_problem_solutions.md) | Complete DP Problem Solutions · DP State Design Principles · Common DP Mistakes and How to Avoid Them · ADVANCED DYNAMIC PROGRAMMING - COMPETITIVE… · DIGIT DP - COUNTING NUMBERS WITH PROPERTIES | 525 |
| 5 | [Bitmask DP — Subset State Tracking](04c_DP_Advanced/05_bitmask_dp_subset_state_tracking.md) | Bitmask DP — Subset State Tracking | 122 |
| 6 | [Interval DP — Optimal Substructure on Ranges](04c_DP_Advanced/06_interval_dp_optimal_substructure_on_ranges.md) | Interval DP — Optimal Substructure on Ranges | 202 |
| 7 | [DP on Trees](04c_DP_Advanced/07_dp_on_trees.md) | DP on Trees · DP Optimizations — Convex Hull Trick · Divide and Conquer DP Optimization · Broken Profile DP (plug DP) · DP Pattern Quick Reference · … | 569 |

## 🏢 Enterprise Lens — Advanced DP

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Scheduling and routing for small instances, combinatorial counting in analytics, parsers (interval DP) |
| **Failure modes** | State explosion; off-by-one in interval bounds; wrong tight-flag handling in digit DP |
| **Testing and verification** | Brute-force enumeration on tiny inputs to verify; test boundary values like 0 and powers of 10 |

---

## Reality Check

**"Interval DP is rare in practice"** → Interval DP (dp[i][j] = optimal for interval i..j, built from smaller intervals) solves: matrix chain multiplication (order of matrix multiplications), optimal BST construction (given frequencies of keys, minimise expected search cost), burst balloons (pop order to maximise coins), minimum cost polygon triangulation, Stone Merge, and parsing (CYK algorithm for CFGs is interval DP). These appear in compilers (expression optimization), computational geometry, and competitive programming. Matrix chain multiplication IS used in neural network computation graph optimization.

**"Bitmask DP is only for TSP (Traveling Salesman)"** → Bitmask DP (dp[mask][node] where mask = set of visited nodes) solves any problem over subsets of a small universe (n ≤ 20). Applications: TSP (n ≤ 20 exactly), covering all jobs with minimum cost (assignment with subsets), counting Hamiltonian paths, AND logical inference with subset constraints, feature selection in ML (evaluate all 2^n feature subsets). The trick: iterate over subsets of mask with `for (int sub = mask; sub > 0; sub = (sub-1) & mask)` — enumerates all subsets of mask efficiently.

**"DP on trees is just DP with parent-child relationships"** → Tree DP is DP where states represent subtrees: dp[v] = answer for the subtree rooted at v. The state depends on children's states. Rerooting technique (tree DP in two DFS passes): first DFS computes dp[v] for each subtree from the root's perspective. Second DFS propagates from parent to child, allowing dp[v] as-if the whole tree were rooted at v. This enables O(n) solutions for problems like "for each node v, find the farthest node in the tree if v is the root" — without rerooting, this is O(n) per node = O(n²).

**"Digit DP is a niche optimization"** → Digit DP counts integers in [L, R] satisfying some property defined on the digits (count of integers with no two consecutive equal digits, count with digit sum divisible by k, count of non-decreasing digit sequences). The template: process digits left to right, track (tight=whether we're still bounded by the limit, leading_zeros=whether we've started, any_additional_state). Digit DP converts an O(R - L) brute force into O(d * state_size) where d = number of digits. Critical for problems involving ranges up to 10^18.

**"Optimised DP (convex hull trick, divide and conquer DP) requires special conditions"** → Convex hull trick (also called Li Chao tree) optimises DP transitions of the form `dp[i] = min over j<i of (dp[j] + cost(j, i))` when `cost(j, i) = a[j] * x[i] + b[j]` (linear in x[i]). The lines form a lower envelope (convex hull); queries are monotone or can be random. Divide and conquer DP optimises transitions where the optimal split point is monotone: `opt[i-1] ≤ opt[i]`. These optimisations reduce O(n²) DP to O(n log n). They require deriving the exact form of the transition and proving the monotonicity/concavity condition before applying.
