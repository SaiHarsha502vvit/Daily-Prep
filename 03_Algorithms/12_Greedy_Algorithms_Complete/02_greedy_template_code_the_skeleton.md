# Greedy Template Code — The Skeleton

> **Navigation**: [← What Problem Does Greedy Solve](01_what_problem_does_greedy_solve.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Scheduling Problems →](03_scheduling_problems.md)
> Page 2 of 7 in **Greedy Algorithms Complete Guide**


Almost every greedy solution follows this pattern:

```java
// UNIVERSAL GREEDY TEMPLATE
public int greedySolve(int[][] items) {
    // STEP 1: SORT by the greedy criterion
    Arrays.sort(items, (a, b) -> a[1] - b[1]);  // e.g., by end time

    // STEP 2: Initialize tracking variables
    int count = 0;
    int lastEnd = Integer.MIN_VALUE;

    // STEP 3: Single pass — make greedy choice at each step
    for (int[] item : items) {
        if (item[0] >= lastEnd) {   // Can we pick this item?
            count++;                 // YES — take it (greedy choice)
            lastEnd = item[1];       // Update state
        }
        // NO — skip it (never look back!)
    }

    return count;
}
// Time: O(n log n) for sort + O(n) for scan = O(n log n)
// Space: O(1) extra (or O(n) if sort needs temp space)
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ HISTORICAL EVOLUTION                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1952: David Huffman invents Huffman Coding (MIT homework paper)              │
│       → Foundation of ALL modern compression (ZIP, JPEG, MP3, H.264)         │
│                                                                              │
│ 1956: Joseph Kruskal publishes MST algorithm at Bell Labs                    │
│       → Still used for network design and circuit board routing              │
│                                                                              │
│ 1957: Robert Prim publishes alternative MST algorithm                        │
│       → Better for dense graphs; used in power grid design                   │
│                                                                              │
│ 1959: Edsger Dijkstra invents shortest path in a café                        │
│       → GPS navigation, Google Maps, network routing                         │
│                                                                              │
│ 1960s: Matroid theory (Rado, Edmonds) formalizes WHEN greedy is optimal      │
│       → Theoretical foundation proving greedy correctness                    │
│                                                                              │
│ 1971: Cook proves NP-completeness; greedy becomes important as               │
│       fast APPROXIMATION for NP-hard problems                                │
│                                                                              │
│ 2000s: Greedy approximation algorithms dominate industry:                    │
│       → Set Cover: Greedy gives ln(n)-approximation                          │
│       → Vertex Cover: 2-approximation in O(V+E)                              │
│       → Google's ad auction (Generalized Second Price) = greedy allocation   │
│                                                                              │
│ TODAY: Every time your phone finds the fastest route, every time you         │
│        download a compressed file, greedy algorithms are at work.            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES & HOW TO AVOID THEM                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Assuming greedy works without proof                               │
│   WRONG: "Sort by value and pick the best — that's clearly optimal"          │
│   RIGHT: "I'll use exchange argument: if I swap my choice with any           │
│          other, the solution doesn't improve."                               │
│   Fix: ALWAYS verify with a counterexample attempt first.                    │
│                                                                              │
│ MISTAKE 2: Wrong sorting criterion                                           │
│   Activity Selection: Sort by END time, NOT start time.                      │
│   Fractional Knapsack: Sort by VALUE/WEIGHT ratio, NOT value alone.          │
│   Remove K Digits: Compare with PREVIOUS digit, not next.                    │
│   Fix: Try 2-3 criteria on a small example before coding.                    │
│                                                                              │
│ MISTAKE 3: Not handling ties                                                 │
│   What if two activities end at the same time?                               │
│   What if two items have the same ratio?                                     │
│   Fix: Define tiebreaker (e.g., shorter duration, smaller index).            │
│                                                                              │
│ MISTAKE 4: Forgetting edge cases                                             │
│   • Empty input → return 0                                                   │
│   • Single element → return that element                                     │
│   • All elements identical → any order works                                 │
│   • Negative numbers → does your sort still work?                            │
│   Fix: Test with n=0, n=1, all-same, negatives.                              │
│                                                                              │
│ MISTAKE 5: Greedy on DIRECTED graphs                                         │
│   Greedy MST (Kruskal/Prim) only works for UNDIRECTED graphs.                │
│   Minimum spanning arborescence needs Edmonds' algorithm (not greedy).       │
│   Fix: Check if graph is directed before applying greedy.                    │
│                                                                              │
│ MISTAKE 6: Confusing "greedy" with "brute force with early stopping"         │
│   Greedy: ONE choice per step, NEVER reconsider.                             │
│   Backtracking with pruning: STILL tries multiple choices.                   │
│   Fix: If your code has recursion with multiple branches, it's NOT greedy.   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING GREEDY                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "HOW DO I KNOW IF GREEDY WORKS?"                                          │
│    This is THE hardest part. Unlike DP where you always know it works,       │
│    greedy requires PROOF. Strategy:                                          │
│    a) Try a greedy approach on a small example                               │
│    b) Try to find a COUNTEREXAMPLE where it fails                            │
│    c) If you can't break it, try the exchange argument                       │
│    d) If exchange works → greedy; if not → DP                                │
│                                                                              │
│ 2. "I CAN'T FIGURE OUT WHAT TO SORT BY"                                      │
│    Each problem has a KEY attribute. Try all natural orderings:              │
│    • By start time  • By end time  • By duration  • By weight                │
│    • By value  • By ratio (value/weight)  • By frequency                     │
│    Run each on a small example. The correct one usually clicks.              │
│                                                                              │
│ 3. "GREEDY SOLUTIONS LOOK TOO SIMPLE"                                        │
│    Yes! That's the point. The HARD part is proving it works.                 │
│    The CODE for greedy is usually 10-15 lines.                               │
│    The PROOF is the real challenge.                                          │
│                                                                              │
│ 4. "I KEEP FALLING FOR GREEDY TRAPS"                                         │
│    Common trap: "Maximize sum by always picking largest" fails for           │
│    problems with constraints (capacity, cooldown, dependencies).             │
│    Fix: If there are CONSTRAINTS that interact → probably DP, not greedy.    │
│                                                                              │
│ 5. "INTERVAL PROBLEMS ALL LOOK THE SAME"                                     │
│    They're NOT! Three different patterns:                                    │
│    • Max activities (sort by END) • Min rooms (sort by START, use heap)      │
│    • Min removals (sort by END, count overlaps)                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING GREEDY ⭐                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT RECOGNITION: See "intervals + maximize" → Activity Selection       │
│ ✅ PROOF ABILITY: Can explain exchange argument for any greedy problem        │
│ ✅ COUNTEREXAMPLE SKILL: Can quickly disprove wrong greedy strategies         │
│ ✅ PATTERN MATCHING: Know all 10 greedy families by signal words              │
│ ✅ GREEDY VS DP: Can explain exactly WHY a problem needs DP, not greedy       │
│ ✅ IMPLEMENTATION: Code any greedy solution in <5 minutes                     │
│ ✅ OPTIMIZATION: Know when greedy gives EXACT answer vs approximation         │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "Let me try all possibilities and see"                                 │
│   TO: "I can sort by X, and the exchange argument shows: if I swap the       │
│        greedy choice with any other, the solution doesn't improve."          │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related mental models:**

- [14_Mental_Models/05_Universal_Problem_Framework.md](../../14_Mental_Models/05_Universal_Problem_Framework.md) — Classification decision tree
- [14_Mental_Models/14_Optimization_Pipeline.md](../../14_Mental_Models/14_Optimization_Pipeline.md) — Greedy vs DP decision framework

---

🔬 **Section Challenge — Greedy Template Code — The Skeleton**

**Challenge 1 (Template Customization):** The template sorts by `a[1] - b[1]` (end time). **What** change makes it solve "Minimum Number of Intervals to Remove to Make the Rest Non-overlapping" (LC 435)? **Who** is the answer variable tracking? **When** do you skip vs. count an interval?

<details><summary>Answer</summary>

**What changes:** The template stays nearly identical — sort by `a[1] - b[1]` (end time, ascending). Instead of counting non-overlapping intervals, count OVERLAPPING ones removed. **Who the answer variable tracks:** Instead of `count` (non-overlapping picked), you track `removals` (intervals that overlap the last kept interval). **When to skip vs. count:** If `item[0] >= lastEnd` — non-overlapping — KEEP it (update `lastEnd`). If `item[0] < lastEnd` — overlaps — REMOVE it: `removals++` (don't update `lastEnd`). **Full solution:** `removals=0, lastEnd=INT_MIN. For each interval sorted by end: if (start >= lastEnd) lastEnd = end; else removals++;` Return `removals`. **Connection:** LC 435 (minimum removals) = N - LC 252 (maximum non-overlapping). The SAME greedy template solves both by changing what you count. This is the power of recognizing the Interval Scheduling pattern family.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## What is Greedy? <a name="what-is-greedy"></a>

### Core Idea

```
┌─────────────────────────────────────────────────────────────────┐
│                      GREEDY PHILOSOPHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    "At each step, make the choice that looks best RIGHT NOW"    │
│                                                                 │
│    LOCAL OPTIMUM → Hopefully → GLOBAL OPTIMUM                   │
│                                                                 │
│    Key properties:                                              │
│    1. Greedy Choice Property: Local choice leads to global      │
│    2. Optimal Substructure: Optimal contains optimal sub        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Example: Coin Change (When Greedy Works)

```
Problem: Give change for 63 cents using minimum coins
Coins: [25, 10, 5, 1]

GREEDY APPROACH:
Step 1: Take largest ≤ 63 → 25 (remaining: 38)
Step 2: Take largest ≤ 38 → 25 (remaining: 13)
Step 3: Take largest ≤ 13 → 10 (remaining: 3)
Step 4: Take largest ≤ 3  → 1  (remaining: 2)
Step 5: Take largest ≤ 2  → 1  (remaining: 1)
Step 6: Take largest ≤ 1  → 1  (remaining: 0)

Result: 25 + 25 + 10 + 1 + 1 + 1 = 6 coins ✓

This works because US coins have special property!
```

### When Greedy FAILS

```
Problem: Give change for 6 cents
Coins: [4, 3, 1]

GREEDY: 4 + 1 + 1 = 3 coins ✗
OPTIMAL: 3 + 3 = 2 coins ✓

Greedy took 4 but should have taken 3+3!
For arbitrary coins, use DP instead.
```

---

🔬 **Section Challenge — What is Greedy? <a name="what-is-greedy"></a>**

**Challenge 1 (US Coins Special Property):** The section shows Greedy works for US coins [25,10,5,1] but fails for [4,3,1]. **What** mathematical property makes [25,10,5,1] a "canonical coin system" where Greedy is always optimal? **Who** proved this property formalized in academic literature?

<details><summary>Answer</summary>

**Mathematical property:** A coin system is canonical if for every amount n, the greedy algorithm using the coins produces the minimum number of coins. Formally, a coin system C is canonical if for every denomination c_i in C, the greedy solution for `c_i - 1` (one less than a denomination) uses fewer coins than any non-greedy alternative. **Why [25,10,5,1] satisfies this:** At each "boundary" amount (24¢, 9¢, 4¢), the greedy solution is optimal. This can be verified by checking every amount up to the largest denomination. **Why [4,3,1] fails:** At amount 6, greedy picks 4+1+1=3 coins. But 3+3=2 coins. The 3¢ coin violates the canonical property at the 4-1=3¢ boundary: greedy gives 3 coins (3+...hmm wait) — actually the issue is at 6: greedy picks 4 when 3+3 is better. **Who proved it:** Pearson (2005) and Chang & Gill (2006) proved exact conditions for canonical coin systems. The problem of determining if a given coin system is canonical is solvable in O(n×m) where n=largest denomination and m=number of coin types.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## When Does Greedy Work? <a name="when-greedy-works"></a>

### The Two Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│          GREEDY WORKS WHEN BOTH ARE TRUE:                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GREEDY CHOICE PROPERTY                                      │
│     → The locally optimal choice is part of globally optimal    │
│     → "Taking the best now won't hurt us later"                 │
│                                                                 │
│  2. OPTIMAL SUBSTRUCTURE                                        │
│     → After making greedy choice, remaining is smaller          │
│       version of same problem                                   │
│     → "Problem breaks into similar subproblems"                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How to Recognize Greedy Problems

```
┌─────────────────────────────────────────────────────────────────┐
│              GREEDY PATTERN INDICATORS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Keywords in Problem:                                           │
│  ✓ "Minimum/Maximum number of..."                               │
│  ✓ "Largest/Smallest..."                                        │
│  ✓ "Optimal arrangement/schedule"                               │
│  ✓ "Non-overlapping intervals"                                  │
│  ✓ "Select items with constraint"                               │
│                                                                 │
│  Problem Patterns:                                              │
│  ✓ Activity/Job scheduling                                      │
│  ✓ Interval selection/merging                                   │
│  ✓ Huffman coding                                               │
│  ✓ Minimum spanning tree (Kruskal's, Prim's)                    │
│  ✓ Shortest path (Dijkstra's)                                   │
│  ✓ Fractional knapsack                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Proof Technique: Exchange Argument

```
To prove greedy works:

1. Assume there's an optimal solution OPT
2. If OPT differs from greedy at some point
3. Show we can "exchange" to match greedy without making worse
4. Repeat until OPT = GREEDY
5. Therefore greedy is optimal
```

---

🔬 **Section Challenge — When Does Greedy Work? <a name="when-greedy-works"></a>**

**Challenge 1 (Recognition Test):** You encounter problem: "Given a list of tasks with deadlines, find the MAXIMUM number of tasks you can complete if each task takes 1 unit." **What** is the greedy criterion? **How** do you prove it with the exchange argument in 2 sentences?

<details><summary>Answer</summary>

**Greedy criterion:** Sort tasks by DEADLINE ascending. Process in order; if a task can fit in the schedule (there's a free time slot at or before its deadline), schedule it. **Exchange argument (2 sentences):** Suppose an optimal solution skips a task T_early (earlier deadline) in favor of T_late (later deadline) scheduled in the same time slot. Swapping T_late for T_early in that slot is safe because T_early's deadline is earlier — if T_late fits before its deadline, T_early also fits (T_early.deadline ≤ T_late.deadline), so the swap can only help or be neutral, never hurt. **Key insight:** The greedy choice (always take earliest-deadline task that fits) is an instance of the activity selection exchange argument — earlier deadlines leave more room for future tasks.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## Classic Greedy Patterns <a name="classic-patterns"></a>

### Pattern 1: Sort and Process

```java
// Most greedy problems require SORTING first
// Then process in order, making local decisions

public int greedyTemplate(int[] items) {
    // Step 1: Sort by relevant criteria
    Arrays.sort(items);  // or custom comparator

    // Step 2: Process greedily
    int result = 0;
    for (int item : items) {
        if (canTake(item)) {
            result += process(item);
        }
    }
    return result;
}
```

### Pattern 2: Interval Sorting Criteria

```
Different interval problems need different sorting:

┌──────────────────────────────────────────────────────────────────┐
│  PROBLEM                          │  SORT BY                     │
├───────────────────────────────────┼──────────────────────────────┤
│  Max non-overlapping intervals    │  End time (earliest first)   │
│  Min intervals to cover range     │  Start time (earliest first) │
│  Merge overlapping intervals      │  Start time (earliest first) │
│  Meeting rooms needed             │  Start time (process events) │
└───────────────────────────────────┴──────────────────────────────┘
```

### Pattern 3: Two-Pointer Greedy

```java
// Match minimum with maximum for optimal pairing
// Sort both arrays, use two pointers

public int matchPairs(int[] costs, int[] values) {
    Arrays.sort(costs);
    Arrays.sort(values);

    int i = 0, j = 0;
    int matches = 0;

    while (i < costs.length && j < values.length) {
        if (values[j] >= costs[i]) {
            matches++;
            i++;
        }
        j++;
    }
    return matches;
}
```

---

🔬 **Section Challenge — Classic Greedy Patterns <a name="classic-patterns"></a>**

**Challenge 1 (Pattern 2 Deep Dive):** The table shows "Merge overlapping intervals" sorts by START time. **Who** decides whether to merge or skip? **What** invariant is maintained after each merge? **When** does `Math.max(lastEnd, current.end)` matter vs. just `current.end`?

<details><summary>Answer</summary>

**Who decides merge:** You compare `current.start` with `lastEnd` (the end of the last merged interval). If `current.start <= lastEnd` — OVERLAP — merge by extending. If `current.start > lastEnd` — GAP — push current interval as a new separate interval. **Invariant maintained:** After each step, the result list contains the minimum set of non-overlapping merged intervals for all intervals processed so far. **When `Math.max(lastEnd, current.end)` matters:** When one interval is FULLY CONTAINED inside another. Example: intervals [1,10] and [3,5] (sorted by start). Processing [3,5]: `3 <= 10` (overlap), so merge. But the merged end = `Math.max(10, 5) = 10` (NOT 5). If you just used `current.end = 5`, you'd shrink the interval incorrectly. `Math.max` ensures the merged interval is the UNION, not the intersection. **Classic bug:** Using `lastEnd = current.end` without `Math.max` — produces wrong results when a smaller interval is nested inside a larger one.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

---

[← What Problem Does Greedy Solve](01_what_problem_does_greedy_solve.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Scheduling Problems →](03_scheduling_problems.md)
