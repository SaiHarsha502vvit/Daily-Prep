# What Problem Does Greedy Solve

> **Navigation**: [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Greedy Template Code — The Skeleton →](02_greedy_template_code_the_skeleton.md)
> Page 1 of 7 in **Greedy Algorithms Complete Guide**


**Core Problem**: Optimization — find the BEST answer among many possibilities.
Three approaches to optimization:

| Approach            | How it works                            | Time               | Guaranteed?       |
| ------------------- | --------------------------------------- | ------------------ | ----------------- |
| Backtracking        | Try all combinations                    | O(2^n)             | Yes (brute force) |
| Dynamic Programming | Build optimal from subproblem answers   | O(n^2) or O(n×W)   | Yes (always)      |
| Greedy              | Always pick local best, never look back | O(n log n) or O(n) | Only sometimes    |

**The Catch**: Greedy doesn't ALWAYS work. It only works when making the
"selfish" best choice at each step happens to lead to the overall best.

💡 **ANALOGY — The ATM Machine:**

Making change for $0.63 with coins [25¢, 10¢, 5¢, 1¢]:

- Greedy: Take biggest coin possible: 25+25+10+1+1+1 = 6 coins ✅
- This is OPTIMAL for US coins!

BUT with coins [1¢, 3¢, 4¢], make change for 6¢:

- Greedy: 4+1+1 = 3 coins ❌
- Optimal: 3+3 = 2 coins ✅

Greedy FAILS for some coin systems → need DP for general coins.

| Greedy Works            | Greedy Fails (Need DP)        |
| ----------------------- | ----------------------------- |
| Fractional Knapsack     | 0/1 Knapsack                  |
| Activity Selection      | Weighted Job Scheduling       |
| Huffman Coding          | General Coin Change           |
| Kruskal's/Prim's MST    | Longest Path in Graph         |
| Dijkstra (non-negative) | Dijkstra (negative weights)   |
| Interval Scheduling     | Interval Scheduling + Weights |

## Where It's Used in Real World

- **Data Compression**: File archiving tools (ZIP, GZIP, JPEG, MP3) use Huffman Coding to build prefix-free variable-length codes based on symbol frequency.
- **Networking**: Routing protocols (OSPF uses Dijkstra's) and building network topologies (spanning trees to prevent bridging loops using Kruskal's/Prim's).
- **Operating Systems**: CPU scheduling algorithms (like Shortest Job First) and memory allocation strategies (First Fit, Best Fit).
- **Financial Systems**: ATMs making exact change using the minimum number of bills (works for standard coin/bill denominations).

🔬 **Section Challenge — What Problem Does Greedy Solve**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?

<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## Real-World Origin Story

**1952 — DAVID HUFFMAN'S HOMEWORK ASSIGNMENT:**

MIT professor Robert Fano gave a term paper assignment: find the most
efficient binary code for a set of symbols. Fano himself had worked on
this (Shannon-Fano coding) but couldn't prove optimality. Student David
Huffman, about to give up, realized: "What if I build the tree BOTTOM-UP,
always merging the TWO LEAST-FREQUENT symbols first?"

This GREEDY insight gave us HUFFMAN CODING:

- Foundation of ZIP, GZIP, JPEG, MP3, MP4, DEFLATE
- Still used today in every compressed file you download
- A homework assignment that changed computing forever

**1956 — JOSEPH KRUSKAL AT BELL LABS:**

"How to wire telephone offices with minimum cable?"

Kruskal: "Sort all possible cables by cost. Pick cheapest that doesn't
create a loop." → Kruskal's MST algorithm.

Still used: Internet backbone routing, power grid design, circuit boards.

**1959 — EDSGER DIJKSTRA IN 20 MINUTES:**

Dijkstra invented his shortest path algorithm in 20 minutes while
drinking coffee at a café in Amsterdam. "Always expand the nearest
unvisited node." This greedy choice is guaranteed optimal for
non-negative weights. → GPS, Google Maps, network routing worldwide.

**Takeaway**: The greatest greedy algorithms weren't discovered by
trying all approaches — they came from INSIGHT about the problem structure.

## The Two Required Properties

For greedy to work, BOTH must hold:

PROPERTY 1: GREEDY CHOICE PROPERTY

"A globally optimal solution CAN be built from locally optimal choices."

**Think Of It As**: "Being selfish at each step is fine."
At each step, we make the choice that looks BEST RIGHT NOW,
and we NEVER go back to reconsider.

PROPERTY 2: OPTIMAL SUBSTRUCTURE

"After making the greedy choice, we're left with a SMALLER version
of the SAME kind of problem."

**Think Of It As**: "After choosing, the remaining problem has the same
shape — it's just smaller."

VISUAL — Activity Selection:

Activities: A=[1,4], B=[3,5], C=[0,6], D=[5,7], E=[3,9], F=[5,9]
G=[6,10], H=[8,11], I=[8,12], J=[2,14], K=[12,16]

Timeline:

```text
0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
██████████████████ C
   █████████ A
      ████████████████████████████████████ J
         ██████ B
         ██████████████████ E
               ██████ D
               ████████████ F
                  ████████████ G
                        █████████ H
                        ████████████ I
                                    ████████████ K
```

**Greedy**: Sort by end time → pick A(ends 4), D(ends 7), H(ends 11),
K(ends 16). Result: 4 activities. This IS optimal!

WHY? After picking A, we only need to solve the SAME problem
for activities starting after time 4 → smaller subproblem.

🔬 **Section Challenge — The Two Required Properties**

**Challenge 1 (Property Verification):** Greedy requires TWO properties: Greedy Choice Property and Optimal Substructure. **Which** property does `0/1 Knapsack` have and which does it LACK? **Why** does adding the word "Fractional" to the problem restore Greedy correctness?

<details><summary>Answer</summary>

**0/1 Knapsack HAS Optimal Substructure:** The optimal solution for capacity W using items 1..n contains the optimal solution for the sub-problem of capacity W-w[n] using items 1..n-1 (if item n is included). Subproblems nest properly. **0/1 Knapsack LACKS Greedy Choice Property:** Taking the locally best item (highest value/weight ratio) does NOT guarantee the globally best total. Proof by counterexample: items {wt:10,val:60}, {wt:20,val:100}, {wt:30,val:120}, cap=50. Greedy by ratio picks item1(ratio=6) + item2(ratio=5) = 160. But optimal is item2+item3 = 220. **Why "Fractional" restores Greedy:** In Fractional Knapsack, you can take a partial item. After taking the best-ratio item fully, taking a fraction of the next-best is ALWAYS optimal — you can't do better than filling remaining space with the highest ratio. The greedy choice is safe because fractions eliminate the interaction between discrete yes/no decisions. This restores the Greedy Choice Property.

</details>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.


## How To Prove Greedy Works: Three Methods

METHOD 1: EXCHANGE ARGUMENT (most common in interviews)
Steps:

1. Assume there's an optimal solution OPT that doesn't use greedy choice
2. SWAP one element from OPT with the greedy choice
3. Show the result is AT LEAST AS GOOD as OPT
4. Conclude: greedy choice can always be in an optimal solution
**Full proof: activity selection exchange argument**

Greedy picks activity `g`, the one with the **earliest finish time**. Suppose an optimal solution OPT starts with a different activity `o` that finishes later than `g`.

| Schedule | First activity | Remaining activities |
| --- | --- | --- |
| OPT | `o` | rest of OPT |
| OPT after the swap | `g` | rest of OPT (still compatible, because `g` ends **earlier** than `o`) |

Result: the same number of activities and no conflicts, so OPT with `g` is at least as good as OPT with `o`. ∎

**Method 2: greedy stays ahead.** Show that after each step `k`, greedy's partial solution is at least as good as any alternative's. "Greedy is always at least as far ahead as any other strategy."

Example: greedy coin change for US coins. After choosing each coin, the remaining amount is never larger than under any other strategy.

**Method 3: structural / matroid theory.** If the problem has matroid structure (an independence system where subsets of valid sets are valid and the exchange property holds), greedy is **guaranteed** to find an optimal solution. Example: minimum spanning tree (the graphic matroid).

For interviews, rely on pattern recognition: "This looks like activity selection, Huffman coding or interval partitioning, so greedy works."

🔬 **Section Challenge — How To Prove Greedy Works: Three Methods**

**Challenge 1 (Exchange Argument Apply):** Apply the Exchange Argument to prove: "Always picking the CHEAPEST unconnected edge that doesn't create a cycle (Kruskal's MST) is globally optimal." **Who** is swapped, **when** does the swap preserve correctness, and **what** does the argument conclude?

<details><summary>Answer</summary>

**Who is swapped:** Suppose optimal MST solution OPT includes edge E_opt instead of the greedy's edge E_greedy (cheapest crossing edge). E_greedy has lower cost than E_opt (by definition — greedy picks minimum). **When swap preserves correctness:** Removing E_opt from OPT creates two components. Adding E_greedy reconnects them (since E_greedy also crosses the cut). The resulting tree has the same number of edges, is still spanning, still acyclic (no cycle introduced if greedy's choice was valid), and has LOWER total weight (E_greedy ≤ E_opt by greedy choice). **What argument concludes:** The resulting tree T' is at least as good as OPT. Repeating this argument for every edge difference — OPT can be transformed into Greedy's solution without increasing cost. Therefore Greedy is optimal. **Key insight:** The exchange argument works here because the matroid structure of spanning trees guarantees that swapping one edge for a cheaper crossing edge can always be done safely without breaking the spanning property.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## "Greedy Fails" — Full Worked Example

0/1 KNAPSACK: capacity=50, items: {val:60,wt:10}, {val:100,wt:20},
{val:120,wt:30}

Greedy strategy 1 — Sort by value/weight ratio:

- Item 1: 60/10 = 6.0 Item 2: 100/20 = 5.0 Item 3: 120/30 = 4.0
- Pick Item 1 (wt 10, val 60), then Item 2 (wt 20, val 100).
- Remaining capacity: 50-10-20 = 20. Item 3 needs 30 → can't fit.
- Greedy answer: 60 + 100 = 160

Greedy strategy 2 — Sort by value:

- Pick Item 3 (val 120, wt 30), then Item 2 (val 100, wt 20).
- Remaining: 50-30-20 = 0. Greedy answer: 120 + 100 = 220

Greedy strategy 3 — Sort by weight (lightest first):

- Pick Item 1 (wt 10), Item 2 (wt 20), then Item 3 needs 30 > 20 left.
- Greedy answer: 60 + 100 = 160

DP solution: Try all subsets →

- {Item 2, Item 3} = 100+120 = 220, weight 50 ✅ OPTIMAL

Notice: Greedy strategy 2 happens to get 220 here, but change items to
{val:60,wt:10}, {val:100,wt:20}, {val:120,wt:30}, capacity=35

- Greedy (by value): Item 3(30)+can't fit Item 2(20)→only 120
- DP optimal: Item 1(10)+Item 2(20) = 160, weight 30 ✅

**Lesson**: No single greedy strategy works for 0/1 Knapsack.
The problem lacks greedy choice property → must use DP.

- **But**: FRACTIONAL Knapsack (can take partial items) → Greedy WORKS!
- Sort by value/weight ratio. Take as much of best ratio as possible.
- Why? You can always "pour in" more of the best-ratio item.

🔬 **Section Challenge — "Greedy Fails" — Full Worked Example**

**Challenge 1 (Counterexample Design):** The section shows Greedy fails for 0/1 Knapsack. Design a 3-coin counterexample that proves Greedy (by largest denomination first) fails for arbitrary coin denominations. **What** coins, **what** target, and **what** is Greedy's answer vs. optimal?

<details><summary>Answer</summary>

**Coins:** [4, 3, 1]. **Target:** 6 cents. **Greedy (largest first):** Takes 4 (remaining 2), then takes 1 (remaining 1), then takes 1 (remaining 0). Answer: 4+1+1 = 3 coins. **Optimal:** 3+3 = 2 coins. **Why Greedy fails:** Taking 4 "blocks" the ability to use two 3s. The greedy choice is locally optimal (4 is the biggest coin ≤ 6) but globally suboptimal. **Why this proves DP is needed:** For arbitrary denominations, there's no local property that guarantees the greedy choice is globally best. The 0/1 selection interacts across choices. **Standard US coins [25,10,5,1] are special:** They form a canonical coin system where greedily taking the largest is always optimal — proven by structural properties of the denominations, NOT by greedy's general validity.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## When To Use Greedy Vs Dp Vs Backtracking

| Signal                   | Greedy        | DP            | Backtracking     |
| ------------------------ | ------------- | ------------- | ---------------- |
| "Minimum/maximum"        | Maybe         | Likely        | Unlikely         |
| "Count ways"             | Rarely        | Almost always | Sometimes        |
| "List all solutions"     | Never         | Never         | Always           |
| n ≤ 10^6                 | Must use      | Maybe O(n)    | Way too slow     |
| n ≤ 10^4                 | Good fit      | Good fit      | Usually too slow |
| n ≤ 20                   | Good fit      | Good fit      | Good fit         |
| Can sort input?          | Almost always | Sometimes     | Sometimes        |
| Greedy choice property?  | Required      | Not needed    | N/A              |
| Overlapping subproblems? | No            | Yes (key)     | No               |
| Decision at each step    | One best      | Try all       | Try all + prune  |

DECISION TREE (use in interviews):

- Can you sort + pick locally best?
  - YES → Can you prove exchange argument?
    - YES → GREEDY ✅
    - NO → Think harder or fall back to DP
  - NO → Does problem have overlapping subproblems?
    - YES → DP
    - NO → Backtracking / DFS

💡 Interview tip: "I believe greedy works here because of the exchange
argument: [explain swap]. If I'm wrong, I'd fall back to DP."

🔬 **Section Challenge — When To Use Greedy Vs Dp Vs Backtracking**

**Challenge 1 (Decision Routing):** Route these 3 problems to the correct algorithm and justify: (A) Given n activities with start/end times, find MAXIMUM non-overlapping activities. (B) Given n activities with PROFITS and deadlines, find selection that MAXIMIZES profit. (C) Given a map of cities, find the route that visits ALL cities exactly once with minimum cost.

<details><summary>Answer</summary>

**(A) Max non-overlapping activities → GREEDY.** Sort by end time, pick greedily. The exchange argument proves optimality. O(N log N). **(B) Weighted job scheduling (maximize profit) → DP.** Why NOT greedy: Adding weights breaks the greedy choice property. A high-profit short job may conflict with several medium-profit jobs whose TOTAL exceeds it. Must evaluate all subsets. DP with binary search: O(N log N). **(C) Minimum cost to visit all cities (TSP) → Backtracking / Branch-and-Bound.** TSP is NP-hard. Greedy (nearest neighbor) gives a 2-approximation but NOT optimal. DP (Held-Karp) gives exact O(N² × 2^N) — feasible up to ~20 cities. Backtracking with pruning for exact solutions on larger inputs. **Decision signal:** "Maximum non-overlapping" without weights = Greedy. "Maximum with profits/weights" = DP. "Visit all" / "enumerate all" = Backtracking.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## The 10 Greedy Pattern Families

Most interview greedy problems fall into one of these families:

1. INTERVAL SCHEDULING — Sort by end time, pick non-overlapping
   Problems: Activity Selection, Non-overlapping Intervals, Meeting Rooms
   Signal: "intervals", "schedule", "overlap", "meetings"
2. INTERVAL PARTITIONING — Sort by start time, use min-heap for rooms
   Problems: Meeting Rooms II, Minimum Platforms
   Signal: "minimum rooms/platforms", "parallel tasks"
3. FRACTIONAL SELECTION — Sort by ratio, take best ratio first
   Problems: Fractional Knapsack, Task Scheduler with cooldown
   Signal: "maximize value per unit", "fractional"
4. HUFFMAN / MERGE — Always merge the two smallest
   Problems: Huffman Coding, Minimum Cost to Connect Sticks
   Signal: "merge costs", "encoding", "combine"
5. SINGLE-PASS GREEDY — Scan once, maintain running state
   Problems: Best Time to Buy/Sell Stock, Gas Station, Jump Game
   Signal: "array traversal", "track running min/max/sum"
6. TWO-POINTER GREEDY — Greedy from both ends
   Problems: Container With Most Water, Trapping Rain Water
   Signal: "two sides", "shrink from both ends"
7. SORTING + ASSIGNMENT — Sort, then assign greedily
   Problems: Assign Cookies, Boats to Save People
   Signal: "assign resources to demands", "pair up"
8. DIGIT/CHARACTER GREEDY — Build result character by character
   Problems: Remove K Digits, Largest Number, Reorganize String
   Signal: "form number/string", "remove digits", "rearrange"
9. GRAPH GREEDY — MST, shortest paths
   Problems: Kruskal's, Prim's, Dijkstra
   Signal: "minimum spanning", "shortest path", "network"
10. EXCHANGE-BASED — Prove by showing any swap makes it worse
    Problems: Task Scheduler, Queue Reconstruction by Height
    Signal: Complex problems where you must PROVE greedy works

🔬 **Section Challenge — The 10 Greedy Pattern Families**

**Challenge 1 (Pattern Identification):** Given these 3 problems, identify the Greedy pattern family and the key sorting criterion: (A) Given balloons with start/end positions, find minimum arrows to burst all balloons. (B) Given n tasks each taking 1 unit with deadlines and profits, maximize total profit. (C) Given an array of non-negative integers, jump to reach the end in minimum jumps.

<details><summary>Answer</summary>

**(A) Minimum Arrows (LC 452) → Pattern 1: Interval Scheduling.** Sort by END position. Each arrow at the earliest end point of an unresolved cluster bursts all overlapping balloons. Greedy choice: place arrow at earliest end of current balloon, eliminating all balloons it intersects. **(B) Job Scheduling with Deadlines → Pattern 3: Fractional Selection / Sorting + Assignment.** Sort jobs by PROFIT descending. Greedily schedule each job in the latest available slot before its deadline (using a boolean slot array). **Sorting criterion:** profit descending + latest-slot greedy assignment. **(C) Jump Game II (LC 45) → Pattern 5: Single-Pass Greedy.** Maintain `currentEnd` (furthest reach from current step) and `farthest` (max reach seen). When you reach `currentEnd`, increment jump count and update `currentEnd = farthest`. **Sorting criterion:** none — single left-to-right scan. Signal: "minimum jumps" without weights and with array traversal = single-pass greedy.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.


## Benchmark: Why Greedy Is Fast

Activity Selection — n activities:

| n          | Greedy O(n log n) | DP O(n^2) | Backtracking O(2^n)      |
| ---------- | ----------------- | --------- | ------------------------ |
| 100        | 0.001 ms          | 0.01 ms   | 10^24 years (impossible) |
| 1,000      | 0.01 ms           | 1 ms      | Not practical            |
| 10,000     | 0.14 ms           | 100 ms    | Not practical            |
| 100,000    | 1.7 ms            | 10 sec    | Not practical            |
| 1,000,000  | 20 ms             | 17 min    | Not practical            |
| 10,000,000 | 0.23 sec          | ~28 hours | Not practical            |

**Cpu Insight**: Greedy is often cache-friendly!

- Greedy: Sort array once → sequential scan → CPU cache loves this
- DP: Random table access → cache misses → slower than theory predicts
- After sorting, greedy scans left-to-right → prefetcher predicts next

**Memory**:

- Greedy: Usually O(1) or O(n) extra space
- DP: Often O(n²) or O(n×W) table → can blow memory for large inputs

🔬 **Section Challenge — Benchmark: Why Greedy Is Fast**

**Challenge 1 (Cache Performance):** The benchmark shows Greedy at O(N log N) beats DP at O(N²) in practice even MORE than theory predicts. **Who** gives Greedy the extra speed advantage? **When** does DP's random table access hurt? **What** is the cache line size relevant here?

<details><summary>Answer</summary>

**Who gives extra speed:** The CPU's L1/L2 cache and hardware prefetcher. After sorting, Greedy scans the array LEFT-TO-RIGHT sequentially. The prefetcher detects this stride-1 access pattern and pre-loads future cache lines before they're needed. Memory access is effectively free because data is already in L1 cache when needed. **When DP hurts:** DP fills a 2D table `dp[i][j]` where computing each cell often requires values from `dp[i-1][j]` (above) and `dp[i][j-w]` (far left). For large W, `dp[i][j-w]` is many cache lines away — each access is an L2/L3 cache miss (~10-50ns each). For N=10,000, W=10,000 that's 10^8 potential cache misses. **Cache line size:** 64 bytes. An `int[]` array packs 16 ints per cache line. Greedy's sequential scan uses 100% of each cache line loaded. DP's sparse access pattern may use 1-2 ints per cache line loaded (1/16 efficiency). **Conclusion:** Greedy beats DP 2-10x MORE than big-O predicts because of cache utilization. This is why algorithm complexity alone doesn't predict real-world performance.

</details>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

---

[Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Greedy Template Code — The Skeleton →](02_greedy_template_code_the_skeleton.md)
