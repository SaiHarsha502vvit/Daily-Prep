# Greedy Fundamentals

> **Navigation**: [Chapter overview](../13_Greedy.md) | [12.1 Interval Problems →](02_interval_problems.md)
> Page 1 of 4 in **Greedy**


💡 **KEY INSIGHT:**
Make locally optimal choice at each step → Global optimum

**When To Use Greedy**:

1. Optimal substructure: Optimal solution contains optimal
   solutions to subproblems
2. Greedy choice property: Local optimal leads to global

**Common Patterns**:

- Interval scheduling (meetings, activities)
- Huffman coding
- Minimum spanning tree (Kruskal's, Prim's)
- Dijkstra's shortest path
- Fractional knapsack
  ⚠️ GREEDY DOESN'T ALWAYS WORK:
- 0/1 Knapsack → Need DP
- Longest path → Need DP/Backtracking

---

🔬 **Section Challenge — Greedy Fundamentals**

**Challenge 1 (Greedy Proof):** Activity Selection sorts by end time. **Who** proves this is optimal? **What** is the "exchange argument" proof technique, and how does it apply to this problem?

<details><summary>Answer</summary>

**Exchange argument proof:** Assume an optimal solution OPT doesn't always choose the activity with the earliest end time. Let OPT choose activity B first (with later end time), and our greedy chooses activity A (earlier end time). We can SWAP A for B in OPT: since A ends earlier, everything that was compatible with B is also compatible with A — swapping doesn't reduce the count. By repeating this exchange for every non-greedy choice, we transform OPT into the greedy solution without losing any activities. Therefore greedy is optimal. **Key insight:** This proof technique works whenever the greedy choice is "at least as good" as any alternative — we don't need to know OPT, we just show we can transform any OPT into greedy without degrading it.

</details>

<details><summary>More detail</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## PART 0: WHY Greedy — The Algorithm That Feels Like Cheating (But Isn't)

🔬 **Section Challenge — PART 0: WHY Greedy — The Algorithm That Feels Like Cheating (But Isn't)**

**Challenge 1 (Greedy Failure Condition):** Coin change with denominations `[1, 5, 6]` and target `10`. Greedy picks 6 first, then 1+1+1+1 = 5 coins. Optimal is 5+5 = 2 coins. **Who** breaks the greedy? **What** property of the coin system allows greedy to fail? **When** does greedy ALWAYS work for coin change?

<details><summary>Answer</summary>

**Who breaks greedy:** The `6` denomination. After picking `6`, you need 4 more — which requires four `1`s (5 total). But `5+5=10` is optimal (2 coins). **What property allows failure:** The denominations don't have the "greedy-choice property" for this target. Greedy works on coin systems where each denomination is an exact multiple of smaller ones (e.g., `[1, 5, 25, 100]` — US coins). In that case, a bigger coin is always worth more combinations. With `[1, 5, 6]`, `6` is not a multiple of `5` — the domains overlap non-uniformly. **When greedy ALWAYS works:** When denominations are a canonical coin system (each larger denomination = integer multiple of the next smaller). US coins, EU coins work. Also when there's a formal proof via exchange argument for the specific denomination set. **General solution:** Coin change is a DP problem (LC 322). DP is O(amount \* #coins) and handles all denomination sets correctly.

</details>

<details><summary>More detail</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## Why Greedy Problems Are Tricky (And Important)

Greedy algorithms feel simple: "just pick the best choice."
The HARD PART: proving the greedy choice is CORRECT.
Greedy appears in ~15% of interviews. The trap:

- You often RECOGNIZE the greedy answer intuitively
- But you can't **prove** it, so the interviewer asks "why does this work?"
- Or worse: you assume greedy works when it **doesn't**, and give a wrong answer.

**Two properties are required (you need both):**

1. **Greedy choice property:** the locally best choice leads to a global best.
2. **Optimal substructure:** after making a choice, the remaining problem is a smaller version of the same problem.

**Where greedy works and where it fails**

| ✅ Greedy works | ❌ Greedy fails (needs DP) |
| --- | --- |
| Activity Selection | 0/1 Knapsack |
| Fractional Knapsack | Longest Increasing Subsequence |
| Huffman Coding | Coin Change (arbitrary coins) |
| Dijkstra's Algorithm (non-negative weights) | Edit Distance |
| Kruskal's MST | Matrix Chain Multiplication |
| Jump Game I | Palindrome Partitioning (min cuts) |


🔬 **Section Challenge — Why Greedy Problems Are Tricky (And Important)**

**Challenge 1 (Why Greedy Is Tricky):** LC 55 (Jump Game) and LC 45 (Jump Game II) look identical but one uses greedy and one "requires" DP. Both are actually solvable with greedy. **Who** defines the greedy choice in Jump Game II? **When** does the local choice (extend reach maximally) guarantee global minimum jumps?

<details><summary>Answer</summary>

**Greedy choice in Jump Game II:** At each position, we track `currentEnd` (the farthest we can reach with the current number of jumps) and `farthest` (the farthest we can reach if we make one more jump from any position seen so far). When we reach `currentEnd`, we MUST make one more jump — we set `currentEnd = farthest` (the furthest reachable in one more jump). **Who defines it:** The implicit interval structure. Each jump "covers" a range. We want to cover `[0, n-1]` with minimum intervals where each interval `[i, i+nums[i]]` overlaps the previous. **Why local maximizes global:** At the point where we must jump (position = `currentEnd`), choosing the jump that extends reach the farthest is always optimal. Taking a shorter jump would only restrict future options. This is the "greedy interval covering" proof: always extend coverage greedily. **Time complexity:** O(n) greedy vs O(n²) naive DP — greedy wins both correctness and efficiency.

</details>

<details><summary>More detail</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## The Mental Model: "Sort + Scan + Never Look Back"

Almost EVERY greedy problem follows this 3-step recipe:
STEP 1: SORT the input by some criterion
STEP 2: SCAN left to right, making the best choice at each step
STEP 3: NEVER reconsider a past choice
The KEY is knowing HOW to sort:
Intervals: Sort by END TIME → finish earliest, maximize room
Jump Game: Don't sort! Scan L→R, track farthest reachable
Gas Station: Scan L→R, track surplus (gas - cost). Reset at deficit.
Task Scheduler: Sort by frequency → schedule most frequent first
Assign Cookies: Sort both arrays → match smallest cookie to child
HOW TO VERIFY (Exchange Argument — the proof technique):
"If I swap my greedy choice with any other choice, the solution
gets WORSE or stays the SAME → greedy is optimal."
WORKED EXAMPLE — Activity Selection:
Activities: [(1,3), (2,5), (4,7), (6,8), (5,9)]
Sort by end: [(1,3), (2,5), (4,7), (6,8), (5,9)]
Pick (1,3) ✓ — ends earliest
Skip (2,5) — starts before 3? No, 2 < 3 ❌ — WAIT, 2 < 3 so skip
Pick (4,7) ✓ — starts at 4 ≥ 3
Pick (6,8) — starts at 6 < 7? YES → skip
Skip (5,9) — starts at 5 < 7 → skip
Result: [(1,3), (4,7)] = 2 activities
Proof: If we replaced (1,3) with (2,5), we'd free LESS room for
future activities. Swapping always makes it worse → greedy is correct.

```java
// GREEDY INTERVAL TEMPLATE — covers 5+ problems
public int maxNonOverlapping(int[][] intervals) {
    // STEP 1: Sort by end time
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);

    int count = 0;
    int lastEnd = Integer.MIN_VALUE;

    // STEP 2: Scan, greedily pick if no overlap
    for (int[] interval : intervals) {
        if (interval[0] >= lastEnd) {  // no overlap
            count++;
            lastEnd = interval[1];      // update boundary
        }
        // STEP 3: Skip overlapping — never reconsider
    }
    return count;
}
```

### The 3 Greedy Categories in This Chapter

| Category | Sorting / Scanning Strategy | Problems |
| --- | --- | --- |
| 1. INTERVALS | Sort by end time (or start time)<br>Pick non-overlapping greedily | 189-193<br>Meeting Rooms<br>Merge Intervals |
| 2. ARRAY GREEDY | Scan L→R, track running state (farthest reach, surplus, etc.) | 194-197<br>Jump Game<br>Gas Station |
| 3. STRING/MATH | Problem-specific ordering (frequency, digit removal, etc.) | 198-201<br>Task Scheduler |

PRIORITY: Master Intervals first — they appear in 50%+ of greedy Qs.

### ⚠️  Common Mistakes in Greedy Problems

**Mistake 1: Assuming greedy works without verifying**

WRONG: "Pick the highest-value item first."  
0/1 Knapsack counterexample: W=50. Items: (60,10), (100,20), (120,30).  
Greedy by value/weight picks 60+100=160. DP gets 100+120=220.  
RULE: If items can't be split → probably NOT greedy.

**Mistake 2: Sorting by wrong criterion for intervals**

"Non-overlapping intervals" → sort by END time, not start time.  
"Merge intervals" → sort by START time, not end time.  
Different problems need different sort keys!

**Mistake 3: Off-by-one in overlap detection**

[1,5] and [5,8] — do they overlap?  
If endpoints inclusive: YES (share point 5)  
If end-exclusive: NO (5 is end of first, start of second)  
Always check problem definition! LeetCode usually: start ≤ x < end.

**Mistake 4: Jump Game — forgetting that farthest updates continuously**

Wrong: only check if current index == farthest  
Right: update farthest = max(farthest, i + nums[i]) at EVERY step  
If i > farthest at any point → can't reach end.

**Mistake 5: Gas Station — brute force O(n²) when O(n) suffices**

Key insight: if total gas ≥ total cost → answer always exists.  
Track surplus. When it goes negative → restart from next station.  
Single pass, O(n). Many candidates miss this optimization.

**Mistake 6: Trying greedy on Coin Change with arbitrary denominations**

Coins = [1, 3, 4], Amount = 6.  
Greedy picks 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.  
Greedy only works for canonical coin systems (US coins: 1,5,10,25).

### Difficulties in Learning Greedy

1. "How do I know if greedy works vs DP?"
→ Try to find a counterexample. If you can swap the greedy choice with  
another and get a better answer → greedy fails, use DP.

2. "The proof seems obvious but I can't formalize it"
→ Exchange argument: Assume optimal solution differs from greedy.  
Show you can replace the different choice with greedy's choice  
without making the solution worse. That's the full proof.

3. "I keep getting TLE on interval problems"
→ Are you sorting? Unsorted intervals → O(n²) comparisons.  
Sort by end time first → single O(n) pass after O(n log n) sort.

4. "Jump Game II was way harder than Jump Game I"
→ Jump I = "can you reach end?" (track farthest). Jump II = "min  
jumps to reach end?" (BFS-like greedy with level boundaries).

### ⭐ Expected Outputs of Mastering Greedy ⭐

- ✅ Instantly distinguish Greedy vs DP based on counterexample thinking
- ✅ Sort intervals by END time for scheduling, START time for merging
- ✅ Write interval greedy template (sort + scan + lastEnd) from memory
- ✅ Solve Jump Game in O(n) with farthest-reachable tracking
- ✅ Explain exchange argument proof at whiteboard
- ✅ Recognize when greedy FAILS and pivot to DP

**The Transformation**:

FROM: "I always try greedy and sometimes it's wrong"  
TO: "I check greedy-choice property + optimal substructure. If both  
hold, I sort by the right key, scan once, never look back.  
If not, I reach for DP and can explain WHY."

📖 **Related theory:** [03_Algorithms/12_Greedy_Algorithms_Complete.md](../../03_Algorithms/12_Greedy_Algorithms_Complete.md) — Full greedy theory with exchange argument proofs

---

[Chapter overview](../13_Greedy.md) | [12.1 Interval Problems →](02_interval_problems.md)
