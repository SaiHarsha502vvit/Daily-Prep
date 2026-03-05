> **Navigation**: [< Previous](11_Backtracking_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_String_Algorithms_Complete.md)

# 🎯 Greedy Algorithms Complete Guide
> Make the Locally Optimal Choice at Each Step

## Table of Contents
0. [PART 0: Complete Understanding](#part-0)
1. [What is Greedy?](#what-is-greedy)
2. [When Does Greedy Work?](#when-greedy-works)
3. [Classic Greedy Patterns](#classic-patterns)
4. [Scheduling Problems](#scheduling)
5. [Interval Problems](#intervals)
6. [Array Greedy Problems](#array-greedy)
7. [String Greedy Problems](#string-greedy)
8. [Graph Greedy Algorithms](#graph-greedy)
9. [Interview Problems](#interview-problems)
10. [Greedy vs DP](#greedy-vs-dp)
11. [Practice Problems](#practice-problems)

---

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT <a name="part-0"></a>

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           GREEDY ALGORITHMS — COMPLETE UNDERSTANDING & GROWTH MINDSET        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES GREEDY SOLVE?                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CORE PROBLEM: Optimization — find the BEST answer among many possibilities.  │
│                                                                              │
│ Three approaches to optimization:                                            │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ APPROACH       │ HOW IT WORKS          │ TIME        │ GUARANTEED?     │   │
│ │────────────────┼───────────────────────┼─────────────┼─────────────────│   │
│ │ Backtracking   │ Try ALL combinations  │ O(2ⁿ)      │ Yes (brute)    │     │
│ │ Dynamic Prog   │ Build optimal from    │ O(n²) or   │ Yes (always)   │     │
│ │                │ subproblem answers     │ O(n×W)     │                 │   │
│ │ GREEDY         │ Always pick local     │ O(n log n) │ ONLY SOMETIMES │     │
│ │                │ best, never look back │ or O(n)    │                 │    │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ THE CATCH: Greedy doesn't ALWAYS work. It only works when making the         │
│ "selfish" best choice at each step happens to lead to the overall best.      │
│                                                                              │
│ ANALOGY — The ATM Machine:                                                   │
│   Making change for $0.63 with coins [25¢, 10¢, 5¢, 1¢]:                     │
│     Greedy: Take biggest coin possible: 25+25+10+1+1+1 = 6 coins ✅           │
│     This is OPTIMAL for US coins!                                            │
│                                                                              │
│   BUT with coins [1¢, 3¢, 4¢], make change for 6¢:                           │
│     Greedy: 4+1+1 = 3 coins ❌                                                │
│     Optimal: 3+3 = 2 coins ✅                                                 │
│   Greedy FAILS for some coin systems → need DP for general coins.            │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │  WHEN IT WORKS                   │ WHEN IT FAILS                       │   │
│ │──────────────────────────────────┼─────────────────────────────────────│   │
│ │ Fractional Knapsack ✅           │ 0/1 Knapsack ❌                    │      │
│ │ Activity Selection ✅            │ Weighted Job Scheduling ❌          │     │
│ │ Huffman Coding ✅                │ General Coin Change ❌             │      │
│ │ Kruskal's/Prim's MST ✅         │ Longest Path in Graph ❌           │       │
│ │ Dijkstra (non-negative) ✅       │ Dijkstra (negative weights) ❌     │      │
│ │ Interval Scheduling ✅           │ Interval Scheduling + Weights ❌   │      │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ REAL-WORLD ORIGIN STORY                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1952 — DAVID HUFFMAN'S HOMEWORK ASSIGNMENT:                                  │
│   MIT professor Robert Fano gave a term paper assignment: find the most      │
│   efficient binary code for a set of symbols. Fano himself had worked on     │
│   this (Shannon-Fano coding) but couldn't prove optimality. Student David    │
│   Huffman, about to give up, realized: "What if I build the tree BOTTOM-UP,  │
│   always merging the TWO LEAST-FREQUENT symbols first?"                      │
│                                                                              │
│   This GREEDY insight gave us HUFFMAN CODING:                                │
│   → Foundation of ZIP, GZIP, JPEG, MP3, MP4, DEFLATE                         │
│   → Still used today in every compressed file you download                   │
│   → A homework assignment that changed computing forever                     │
│                                                                              │
│ 1956 — JOSEPH KRUSKAL AT BELL LABS:                                          │
│   "How to wire telephone offices with minimum cable?"                        │
│   Kruskal: "Sort all possible cables by cost. Pick cheapest that doesn't     │
│   create a loop." → Kruskal's MST algorithm.                                 │
│   Still used: Internet backbone routing, power grid design, circuit boards.  │
│                                                                              │
│ 1959 — EDSGER DIJKSTRA IN 20 MINUTES:                                        │
│   Dijkstra invented his shortest path algorithm in 20 minutes while          │
│   drinking coffee at a café in Amsterdam. "Always expand the nearest         │
│   unvisited node." This greedy choice is guaranteed optimal for              │
│   non-negative weights. → GPS, Google Maps, network routing worldwide.       │
│                                                                              │
│ TAKEAWAY: The greatest greedy algorithms weren't discovered by               │
│ trying all approaches — they came from INSIGHT about the problem structure.  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE TWO REQUIRED PROPERTIES                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ For greedy to work, BOTH must hold:                                          │
│                                                                              │
│ PROPERTY 1: GREEDY CHOICE PROPERTY                                           │
│ "A globally optimal solution CAN be built from locally optimal choices."     │
│                                                                              │
│   THINK OF IT AS: "Being selfish at each step is fine."                      │
│   At each step, we make the choice that looks BEST RIGHT NOW,                │
│   and we NEVER go back to reconsider.                                        │
│                                                                              │
│ PROPERTY 2: OPTIMAL SUBSTRUCTURE                                             │
│ "After making the greedy choice, we're left with a SMALLER version           │
│  of the SAME kind of problem."                                               │
│                                                                              │
│   THINK OF IT AS: "After choosing, the remaining problem has the same        │
│   shape — it's just smaller."                                                │
│                                                                              │
│ VISUAL — Activity Selection:                                                 │
│   Activities: A=[1,4], B=[3,5], C=[0,6], D=[5,7], E=[3,9], F=[5,9]           │
│   G=[6,10], H=[8,11], I=[8,12], J=[2,14], K=[12,16]                          │
│                                                                              │
│   Timeline:                                                                  │
│   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16                          │
│   │──C──────────│                                                            │
│      │──A────│                                                               │
│         │──J─────────────────────────│                                       │
│            │──B───│                                                          │
│            │──E──────────│                                                   │
│               │──D──│                                                        │
│               │──F────────│                                                  │
│                  │──G────────│                                               │
│                        │──H─────│                                            │
│                        │──I────────│                                         │
│                                    │──K────│                                 │
│                                                                              │
│   GREEDY: Sort by end time → pick A(ends 4), D(ends 7), H(ends 11),          │
│   K(ends 16). Result: 4 activities. This IS optimal!                         │
│                                                                              │
│   WHY? After picking A, we only need to solve the SAME problem               │
│   for activities starting after time 4 → smaller subproblem.                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW TO PROVE GREEDY WORKS: THREE METHODS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ METHOD 1: EXCHANGE ARGUMENT (most common in interviews)                      │
│                                                                              │
│   Steps:                                                                     │
│   1. Assume there's an optimal solution OPT that doesn't use greedy choice   │
│   2. SWAP one element from OPT with the greedy choice                        │
│   3. Show the result is AT LEAST AS GOOD as OPT                              │
│   4. Conclude: greedy choice can always be in an optimal solution            │
│                                                                              │
│   FULL PROOF — Activity Selection Exchange Argument:                         │
│                                                                              │
│   Greedy picks activity 'g' with EARLIEST finish time.                       │
│   Suppose OPT starts with activity 'o' instead (ends later than g).          │
│                                                                              │
│   ──────g────│                                                               │
│   ──────────o────────│                                                       │
│                      │───rest of OPT───                                      │
│                                                                              │
│   SWAP 'o' with 'g' in OPT:                                                  │
│   ──────g────│                                                               │
│              │───rest of OPT──── (still compatible! g ends EARLIER)          │
│                                                                              │
│   Result: Same number of activities, no conflicts.                           │
│   → OPT with 'g' is at least as good as OPT with 'o'. ∎                      │
│                                                                              │
│ METHOD 2: GREEDY STAYS AHEAD                                                 │
│                                                                              │
│   Show: After each step k, greedy's partial solution ≥ any alternative's.    │
│   "Greedy is always at least as far ahead as any other strategy."            │
│                                                                              │
│   Example: Greedy coin change for US coins.                                  │
│   After choosing each coin, the remaining amount is always smaller           │
│   than any other strategy's remaining amount.                                │
│                                                                              │
│ METHOD 3: STRUCTURAL / MATROID THEORY                                        │
│                                                                              │
│   If the problem has MATROID structure (independence system where            │
│   "subsets of valid sets are valid"), greedy is GUARANTEED optimal.          │
│   Examples: MST (graphic matroid), scheduling on uniform machines.           │
│                                                                              │
│   For interviews: Pattern recognition. "This looks like Activity             │
│   Selection / Huffman / Interval Partitioning → greedy works."               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ "GREEDY FAILS" — FULL WORKED EXAMPLE                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 0/1 KNAPSACK: capacity=50, items: {val:60,wt:10}, {val:100,wt:20},           │
│                                    {val:120,wt:30}                           │
│                                                                              │
│ Greedy strategy 1 — Sort by value/weight ratio:                              │
│   Item 1: 60/10 = 6.0   Item 2: 100/20 = 5.0   Item 3: 120/30 = 4.0          │
│   Pick Item 1 (wt 10, val 60), then Item 2 (wt 20, val 100).                 │
│   Remaining capacity: 50-10-20 = 20. Item 3 needs 30 → can't fit.            │
│   Greedy answer: 60 + 100 = 160                                              │
│                                                                              │
│ Greedy strategy 2 — Sort by value:                                           │
│   Pick Item 3 (val 120, wt 30), then Item 2 (val 100, wt 20).                │
│   Remaining: 50-30-20 = 0. Greedy answer: 120 + 100 = 220                    │
│                                                                              │
│ Greedy strategy 3 — Sort by weight (lightest first):                         │
│   Pick Item 1 (wt 10), Item 2 (wt 20), then Item 3 needs 30 > 20 left.       │
│   Greedy answer: 60 + 100 = 160                                              │
│                                                                              │
│ DP solution: Try all subsets →                                               │
│   {Item 2, Item 3} = 100+120 = 220, weight 50 ✅ OPTIMAL                      │
│                                                                              │
│ Notice: Greedy strategy 2 happens to get 220 here, but change items to       │
│   {val:60,wt:10}, {val:100,wt:20}, {val:120,wt:30}, capacity=35              │
│   Greedy (by value): Item 3(30)+can't fit Item 2(20)→only 120                │
│   DP optimal: Item 1(10)+Item 2(20) = 160, weight 30 ✅                       │
│                                                                              │
│ LESSON: No single greedy strategy works for 0/1 Knapsack.                    │
│ The problem lacks greedy choice property → must use DP.                      │
│                                                                              │
│ BUT: FRACTIONAL Knapsack (can take partial items) → Greedy WORKS!            │
│   Sort by value/weight ratio. Take as much of best ratio as possible.        │
│   Why? You can always "pour in" more of the best-ratio item.                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE GREEDY vs DP vs BACKTRACKING                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────┬──────────────┬──────────────┬───────────────┐       │
│ │ Signal               │ Greedy       │ DP           │ Backtracking  │       │
│ ├──────────────────────┼──────────────┼──────────────┼───────────────┤       │
│ │ "Minimum/maximum"    │ Maybe        │ Likely       │ Unlikely      │       │
│ │ "Count ways"         │ Rarely       │ Almost always│ Sometimes     │       │
│ │ "List all solutions" │ Never        │ Never        │ Always        │       │
│ │ n ≤ 10⁶             │ ✅ Must use  │ Maybe O(n)   │ Way too slow  │         │
│ │ n ≤ 10⁴             │ ✅           │ ✅           │ Too slow      │          │
│ │ n ≤ 20              │ ✅           │ ✅           │ ✅            │           │
│ │ Can sort input?      │ Almost always│ Sometimes    │ Sometimes     │       │
│ │ Greedy choice prop?  │ REQUIRED     │ Not needed   │ N/A           │       │
│ │ Overlapping subprob? │ No           │ Yes (KEY!)   │ No            │       │
│ │ Decision at each step│ ONE best     │ Try all      │ Try all+prune │       │
│ └──────────────────────┴──────────────┴──────────────┴───────────────┘       │
│                                                                              │
│ DECISION TREE (use in interviews):                                           │
│                                                                              │
│   Can you sort + pick locally best?                                          │
│     YES → Can you prove exchange argument?                                   │
│              YES → GREEDY ✅                                                  │
│              NO  → Think harder or fall back to DP                           │
│     NO  → Does problem have overlapping subproblems?                         │
│              YES → DP                                                        │
│              NO  → Backtracking / DFS                                        │
│                                                                              │
│  💡 Interview tip: "I believe greedy works here because of the exchange       │
│  argument: [explain swap]. If I'm wrong, I'd fall back to DP."               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE 10 GREEDY PATTERN FAMILIES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Most interview greedy problems fall into one of these families:              │
│                                                                              │
│ 1. INTERVAL SCHEDULING — Sort by end time, pick non-overlapping              │
│    Problems: Activity Selection, Non-overlapping Intervals, Meeting Rooms    │
│    Signal: "intervals", "schedule", "overlap", "meetings"                    │
│                                                                              │
│ 2. INTERVAL PARTITIONING — Sort by start time, use min-heap for rooms        │
│    Problems: Meeting Rooms II, Minimum Platforms                             │
│    Signal: "minimum rooms/platforms", "parallel tasks"                       │
│                                                                              │
│ 3. FRACTIONAL SELECTION — Sort by ratio, take best ratio first               │
│    Problems: Fractional Knapsack, Task Scheduler with cooldown               │
│    Signal: "maximize value per unit", "fractional"                           │
│                                                                              │
│ 4. HUFFMAN / MERGE — Always merge the two smallest                           │
│    Problems: Huffman Coding, Minimum Cost to Connect Sticks                  │
│    Signal: "merge costs", "encoding", "combine"                              │
│                                                                              │
│ 5. SINGLE-PASS GREEDY — Scan once, maintain running state                    │
│    Problems: Best Time to Buy/Sell Stock, Gas Station, Jump Game             │
│    Signal: "array traversal", "track running min/max/sum"                    │
│                                                                              │
│ 6. TWO-POINTER GREEDY — Greedy from both ends                                │
│    Problems: Container With Most Water, Trapping Rain Water                  │
│    Signal: "two sides", "shrink from both ends"                              │
│                                                                              │
│ 7. SORTING + ASSIGNMENT — Sort, then assign greedily                         │
│    Problems: Assign Cookies, Boats to Save People                            │
│    Signal: "assign resources to demands", "pair up"                          │
│                                                                              │
│ 8. DIGIT/CHARACTER GREEDY — Build result character by character              │
│    Problems: Remove K Digits, Largest Number, Reorganize String              │
│    Signal: "form number/string", "remove digits", "rearrange"                │
│                                                                              │
│ 9. GRAPH GREEDY — MST, shortest paths                                        │
│    Problems: Kruskal's, Prim's, Dijkstra                                     │
│    Signal: "minimum spanning", "shortest path", "network"                    │
│                                                                              │
│ 10. EXCHANGE-BASED — Prove by showing any swap makes it worse                │
│     Problems: Task Scheduler, Queue Reconstruction by Height                 │
│     Signal: Complex problems where you must PROVE greedy works               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ BENCHMARK: WHY GREEDY IS FAST                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Activity Selection — n activities:                                           │
│                                                                              │
│ ┌───────────┬───────────────┬──────────────┬─────────────────────────┐       │
│ │ n         │ Greedy O(nlogn)│ DP O(n²)    │ Backtracking O(2ⁿ)    │         │
│ ├───────────┼───────────────┼──────────────┼─────────────────────────┤       │
│ │ 100       │ 0.001 ms      │ 0.01 ms     │ 10²⁴ years (IMPOSSIBLE)│         │
│ │ 1,000     │ 0.01 ms       │ 1 ms        │ ∞                       │        │
│ │ 10,000    │ 0.14 ms       │ 100 ms      │ ∞                       │        │
│ │ 100,000   │ 1.7 ms        │ 10 sec      │ ∞                       │        │
│ │ 1,000,000 │ 20 ms         │ 17 min      │ ∞                       │        │
│ │ 10,000,000│ 0.23 sec      │ ~28 hours   │ ∞                       │        │
│ └───────────┴───────────────┴──────────────┴─────────────────────────┘       │
│                                                                              │
│ CPU INSIGHT: Greedy is often cache-friendly!                                 │
│ • Greedy: Sort array once → sequential scan → CPU cache loves this           │
│ • DP: Random table access → cache misses → slower than theory predicts       │
│ • After sorting, greedy scans left-to-right → prefetcher predicts next       │
│                                                                              │
│ MEMORY:                                                                      │
│ • Greedy: Usually O(1) or O(n) extra space                                   │
│ • DP: Often O(n²) or O(n×W) table → can blow memory for large inputs         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ GREEDY TEMPLATE CODE — THE SKELETON                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Almost every greedy solution follows this pattern:                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

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
- [14_Mental_Models/05_Universal_Problem_Framework.md](../14_Mental_Models/05_Universal_Problem_Framework.md) — Classification decision tree
- [14_Mental_Models/03_Optimization_Thinking.md](../14_Mental_Models/03_Optimization_Thinking.md) — Greedy vs DP decision framework

---

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

## Scheduling Problems <a name="scheduling"></a>

### Activity Selection (Maximum Non-overlapping)

```java
/*
Given activities with start/end times,
find maximum number of non-overlapping activities.

Key insight: Always pick the activity that ENDS EARLIEST
This leaves maximum room for future activities.
*/

public int maxActivities(int[][] activities) {
    // Sort by end time
    Arrays.sort(activities, (a, b) -> a[1] - b[1]);
    
    int count = 0;
    int lastEnd = 0;
    
    for (int[] activity : activities) {
        int start = activity[0], end = activity[1];
        if (start >= lastEnd) {  // Non-overlapping
            count++;
            lastEnd = end;
        }
    }
    return count;
}
```

### Visual: Why Sort by End Time?

```
Activities:
A: [1, 4]  ████
B: [3, 5]    ███
C: [0, 6]  ███████
D: [5, 7]        ███
E: [8, 9]            ██

Sorted by end time: A, B, C, D, E

Greedy picks:
A [1,4]  ✓  (first ending)
B [3,5]  ✗  (overlaps with A)
C [0,6]  ✗  (overlaps with A)
D [5,7]  ✓  (starts after A ends)
E [8,9]  ✓  (starts after D ends)

Result: 3 activities (A, D, E)
```

### Job Scheduling to Maximize Profit

```java
/*
Jobs have deadline and profit. 
Each job takes 1 unit time. Maximize profit.
Schedule at latest possible time before deadline.
*/

public int maxProfit(int[][] jobs) {
    // jobs[i] = [deadline, profit]
    // Sort by profit descending
    Arrays.sort(jobs, (a, b) -> b[1] - a[1]);
    
    int maxDeadline = 0;
    for (int[] job : jobs) {
        maxDeadline = Math.max(maxDeadline, job[0]);
    }
    
    boolean[] slots = new boolean[maxDeadline + 1];
    int profit = 0;
    
    for (int[] job : jobs) {
        int deadline = job[0];
        // Find latest available slot before deadline
        for (int t = deadline; t > 0; t--) {
            if (!slots[t]) {
                slots[t] = true;
                profit += job[1];
                break;
            }
        }
    }
    return profit;
}
```

### Meeting Rooms II (Min Rooms Needed)

```java
/*
Given meeting intervals, find minimum rooms required.
Process as events: start = +1 room, end = -1 room
*/

public int minMeetingRooms(int[][] intervals) {
    // Create events array
    int n = intervals.length;
    int[] starts = new int[n];
    int[] ends = new int[n];
    
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    
    Arrays.sort(starts);
    Arrays.sort(ends);
    
    int rooms = 0, maxRooms = 0;
    int i = 0, j = 0;
    
    while (i < n) {
        if (starts[i] < ends[j]) {
            rooms++;  // New meeting starts
            i++;
        } else {
            rooms--;  // Meeting ends
            j++;
        }
        maxRooms = Math.max(maxRooms, rooms);
    }
    return maxRooms;
}

// Alternative using PriorityQueue
public int minMeetingRooms2(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> pq = new PriorityQueue<>();  // End times
    
    for (int[] interval : intervals) {
        // If room frees up before this meeting starts
        if (!pq.isEmpty() && pq.peek() <= interval[0]) {
            pq.poll();  // Reuse that room
        }
        pq.offer(interval[1]);  // Book room until end time
    }
    return pq.size();
}
```

---

## Interval Problems <a name="intervals"></a>

### Non-overlapping Intervals (LeetCode 435)

```java
/*
Remove minimum intervals to make rest non-overlapping.
Same as: find maximum non-overlapping, subtract from total.
*/

public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;
    
    // Sort by end time
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
    
    int kept = 1;
    int end = intervals[0][1];
    
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {  // Non-overlapping
            kept++;
            end = intervals[i][1];
        }
    }
    return intervals.length - kept;
}
```

### Merge Intervals (LeetCode 56)

```java
/*
Merge all overlapping intervals.
Sort by start, merge as we go.
*/

public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> merged = new ArrayList<>();
    
    for (int[] interval : intervals) {
        // If doesn't overlap with last, add new
        if (merged.isEmpty() || merged.get(merged.size()-1)[1] < interval[0]) {
            merged.add(interval);
        } else {
            // Merge by extending end
            merged.get(merged.size()-1)[1] = 
                Math.max(merged.get(merged.size()-1)[1], interval[1]);
        }
    }
    return merged.toArray(new int[merged.size()][]);
}
```

### Insert Interval (LeetCode 57)

```java
/*
Insert new interval into sorted non-overlapping list.
Merge if necessary.
*/

public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;
    
    // Add all before newInterval
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i++]);
    }
    
    // Merge overlapping intervals
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);
    
    // Add all after
    while (i < intervals.length) {
        result.add(intervals[i++]);
    }
    
    return result.toArray(new int[result.size()][]);
}
```

### Interval Covering Problem

```java
/*
Given intervals and a range [0, n], find minimum intervals
to cover the entire range.
*/

public int minIntervals(int[][] intervals, int n) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    
    int count = 0;
    int covered = 0;  // Current coverage end
    int i = 0;
    
    while (covered < n) {
        // Find interval that starts ≤ covered and extends furthest
        int maxEnd = covered;
        while (i < intervals.length && intervals[i][0] <= covered) {
            maxEnd = Math.max(maxEnd, intervals[i][1]);
            i++;
        }
        
        // If can't extend coverage, impossible
        if (maxEnd == covered) return -1;
        
        covered = maxEnd;
        count++;
    }
    return count;
}
```

---

## Array Greedy Problems <a name="array-greedy"></a>

### Jump Game (LeetCode 55)

```java
/*
Can reach last index? nums[i] = max jump from i.
Track farthest reachable position.
*/

public boolean canJump(int[] nums) {
    int farthest = 0;
    
    for (int i = 0; i < nums.length; i++) {
        // Can't reach position i
        if (i > farthest) return false;
        // Update farthest
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
```

### Jump Game II (LeetCode 45)

```java
/*
Minimum jumps to reach end. Always can reach.
*/

public int jump(int[] nums) {
    int jumps = 0;
    int currentEnd = 0;
    int farthest = 0;
    
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        
        // Must jump when reaching current jump's limit
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

### Gas Station (LeetCode 134)

```java
/*
Circular route with gas stations.
gas[i] = gas at station i, cost[i] = cost to next.
Find starting station to complete circuit (or -1).

Key insight: If total gas >= total cost, solution exists.
Start from point where running sum is minimum.
*/

public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalTank = 0;
    int currentTank = 0;
    int startStation = 0;
    
    for (int i = 0; i < gas.length; i++) {
        int diff = gas[i] - cost[i];
        totalTank += diff;
        currentTank += diff;
        
        // Can't reach next station from startStation
        if (currentTank < 0) {
            startStation = i + 1;  // Try starting from next
            currentTank = 0;
        }
    }
    
    return totalTank >= 0 ? startStation : -1;
}
```

### Assign Cookies (LeetCode 455)

```java
/*
Children with greed factors, cookies with sizes.
Each child gets at most 1 cookie.
Maximize content children (cookie size >= greed).
*/

public int findContentChildren(int[] children, int[] cookies) {
    Arrays.sort(children);
    Arrays.sort(cookies);
    
    int child = 0, cookie = 0;
    
    while (child < children.length && cookie < cookies.length) {
        if (cookies[cookie] >= children[child]) {
            child++;  // Child satisfied
        }
        cookie++;  // Use or skip cookie
    }
    return child;
}
```

### Container With Most Water (LeetCode 11)

```java
/*
Two pointers: Start from widest, move shorter line inward.
Moving taller line can only decrease area.
*/

public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;
    
    while (left < right) {
        int h = Math.min(height[left], height[right]);
        int w = right - left;
        maxWater = Math.max(maxWater, h * w);
        
        // Move the shorter line
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
```

### Best Time to Buy and Sell Stock II (LeetCode 122)

```java
/*
Multiple transactions allowed.
Greedy: Capture every upward movement.
*/

public int maxProfit(int[] prices) {
    int profit = 0;
    
    for (int i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }
    return profit;
}
```

### Candy (LeetCode 135) ⭐⭐

```java
/*
Children in line with ratings.
Each gets at least 1 candy.
Higher rating than neighbor → more candy than neighbor.
Minimum total candy?

Two passes: left-to-right, then right-to-left.
*/

public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candies = new int[n];
    Arrays.fill(candies, 1);
    
    // Left to right: higher than left neighbor?
    for (int i = 1; i < n; i++) {
        if (ratings[i] > ratings[i-1]) {
            candies[i] = candies[i-1] + 1;
        }
    }
    
    // Right to left: higher than right neighbor?
    for (int i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i+1]) {
            candies[i] = Math.max(candies[i], candies[i+1] + 1);
        }
    }
    
    int total = 0;
    for (int c : candies) total += c;
    return total;
}
```

---

## String Greedy Problems <a name="string-greedy"></a>

### Remove K Digits (LeetCode 402)

```java
/*
Remove k digits to get smallest number.
Greedy: Remove larger digits that come before smaller digits.
Use monotonic stack.
*/

public String removeKdigits(String num, int k) {
    Deque<Character> stack = new ArrayDeque<>();
    
    for (char c : num.toCharArray()) {
        // Remove larger digits
        while (!stack.isEmpty() && k > 0 && stack.peek() > c) {
            stack.pop();
            k--;
        }
        stack.push(c);
    }
    
    // Remove remaining from end
    while (k-- > 0) stack.pop();
    
    // Build result, remove leading zeros
    StringBuilder sb = new StringBuilder();
    while (!stack.isEmpty()) {
        sb.append(stack.pollLast());
    }
    while (sb.length() > 0 && sb.charAt(0) == '0') {
        sb.deleteCharAt(0);
    }
    
    return sb.length() == 0 ? "0" : sb.toString();
}
```

### Partition Labels (LeetCode 763)

```java
/*
Partition string so each letter appears in at most one part.
Return list of part lengths.

Greedy: For each position, extend partition to include
all occurrences of current letters.
*/

public List<Integer> partitionLabels(String s) {
    // Record last occurrence of each character
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }
    
    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;
    
    for (int i = 0; i < s.length(); i++) {
        // Extend partition to include all of current char
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);
        
        // Reached end of current partition
        if (i == end) {
            result.add(end - start + 1);
            start = end + 1;
        }
    }
    return result;
}
```

### Reorganize String (LeetCode 767)

```java
/*
Rearrange string so no adjacent characters are same.
Return "" if impossible.

Greedy: Always place the most frequent character,
alternating positions.
*/

public String reorganizeString(String s) {
    int[] count = new int[26];
    for (char c : s.toCharArray()) {
        count[c - 'a']++;
    }
    
    // Check if possible
    int maxCount = 0, maxChar = 0;
    for (int i = 0; i < 26; i++) {
        if (count[i] > maxCount) {
            maxCount = count[i];
            maxChar = i;
        }
    }
    if (maxCount > (s.length() + 1) / 2) return "";
    
    // Fill even positions with most frequent
    char[] result = new char[s.length()];
    int index = 0;
    
    while (count[maxChar]-- > 0) {
        result[index] = (char) ('a' + maxChar);
        index += 2;
    }
    
    // Fill remaining
    for (int i = 0; i < 26; i++) {
        while (count[i]-- > 0) {
            if (index >= s.length()) index = 1;
            result[index] = (char) ('a' + i);
            index += 2;
        }
    }
    
    return new String(result);
}
```

### Task Scheduler (LeetCode 621)

```java
/*
Tasks with cooldown n between same tasks.
Minimum time to complete all tasks.
*/

public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char task : tasks) {
        count[task - 'A']++;
    }
    
    Arrays.sort(count);
    int maxCount = count[25];
    
    // Count tasks with max frequency
    int maxCountTasks = 0;
    for (int i = 25; i >= 0 && count[i] == maxCount; i--) {
        maxCountTasks++;
    }
    
    // Formula: (maxCount - 1) * (n + 1) + maxCountTasks
    // Or just total tasks if no idle needed
    return Math.max(tasks.length, (maxCount - 1) * (n + 1) + maxCountTasks);
}

/*
Visual for tasks = [A,A,A,B,B,B], n = 2:
A B _ A B _ A B
(max-1)=2 groups of (n+1)=3, plus 2 maxCount tasks at end
*/
```

---

## Graph Greedy Algorithms <a name="graph-greedy"></a>

### Kruskal's MST (Minimum Spanning Tree)

```java
/*
Find minimum cost edges to connect all vertices.
Greedy: Sort edges by weight, add if doesn't create cycle.
Use Union-Find to detect cycles.
*/

public int kruskalMST(int n, int[][] edges) {
    // edges[i] = [u, v, weight]
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    
    int cost = 0, edgeCount = 0;
    
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        
        if (find(parent, u) != find(parent, v)) {
            union(parent, u, v);
            cost += w;
            edgeCount++;
            if (edgeCount == n - 1) break;  // MST complete
        }
    }
    return cost;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) parent[x] = find(parent, parent[x]);
    return parent[x];
}

private void union(int[] parent, int x, int y) {
    parent[find(parent, x)] = find(parent, y);
}
```

### Prim's MST

```java
/*
Start from any vertex, always add minimum edge to unvisited vertex.
Use PriorityQueue.
*/

public int primMST(int n, int[][] edges) {
    // Build adjacency list
    List<int[]>[] graph = new List[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
    
    for (int[] e : edges) {
        graph[e[0]].add(new int[]{e[1], e[2]});
        graph[e[1]].add(new int[]{e[0], e[2]});
    }
    
    // Min heap: [weight, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    boolean[] visited = new boolean[n];
    int cost = 0;
    
    pq.offer(new int[]{0, 0});  // Start from vertex 0
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int w = curr[0], u = curr[1];
        
        if (visited[u]) continue;
        visited[u] = true;
        cost += w;
        
        for (int[] neighbor : graph[u]) {
            if (!visited[neighbor[0]]) {
                pq.offer(new int[]{neighbor[1], neighbor[0]});
            }
        }
    }
    return cost;
}
```

### Dijkstra's Shortest Path

```java
/*
Shortest path from source to all vertices.
Greedy: Always process vertex with current minimum distance.
*/

public int[] dijkstra(int n, int[][] edges, int src) {
    // Build adjacency list
    List<int[]>[] graph = new List[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
    
    for (int[] e : edges) {
        graph[e[0]].add(new int[]{e[1], e[2]});
        // For undirected: graph[e[1]].add(new int[]{e[0], e[2]});
    }
    
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    // Min heap: [distance, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        
        if (d > dist[u]) continue;  // Skip outdated
        
        for (int[] neighbor : graph[u]) {
            int v = neighbor[0], w = neighbor[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

## Interview Problems <a name="interview-problems"></a>

### Boats to Save People (LeetCode 881)

```java
/*
People with weights, boats with limit.
Each boat holds at most 2 people.
Minimum boats needed?

Greedy: Pair heaviest with lightest if possible.
*/

public int numRescueBoats(int[] people, int limit) {
    Arrays.sort(people);
    int left = 0, right = people.length - 1;
    int boats = 0;
    
    while (left <= right) {
        if (people[left] + people[right] <= limit) {
            left++;  // Light person fits with heavy
        }
        right--;  // Heavy person always takes boat
        boats++;
    }
    return boats;
}
```

### Minimum Number of Arrows (LeetCode 452)

```java
/*
Balloons as intervals. Arrow at x bursts all balloons
containing x. Minimum arrows needed?

Same as max non-overlapping intervals!
*/

public int findMinArrowShots(int[][] points) {
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
    
    int arrows = 1;
    int end = points[0][1];
    
    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > end) {
            arrows++;
            end = points[i][1];
        }
    }
    return arrows;
}
```

### Queue Reconstruction by Height (LeetCode 406)

```java
/*
People: [h, k] - height h, k people in front with height >= h
Reconstruct the queue.

Greedy: Sort by height desc, then by k asc.
Insert tallest first, shorter people don't affect their count.
*/

public int[][] reconstructQueue(int[][] people) {
    // Sort: tallest first, same height by k
    Arrays.sort(people, (a, b) -> {
        if (a[0] != b[0]) return b[0] - a[0];  // Height desc
        return a[1] - b[1];  // K asc
    });
    
    List<int[]> result = new ArrayList<>();
    for (int[] person : people) {
        result.add(person[1], person);  // Insert at index k
    }
    
    return result.toArray(new int[people.length][]);
}
```

### Lemonade Change (LeetCode 860)

```java
/*
Customers pay with $5, $10, or $20.
Start with no change. Can you give correct change?
*/

public boolean lemonadeChange(int[] bills) {
    int fives = 0, tens = 0;
    
    for (int bill : bills) {
        if (bill == 5) {
            fives++;
        } else if (bill == 10) {
            if (fives == 0) return false;
            fives--;
            tens++;
        } else {  // $20
            // Prefer giving $10 + $5 (save $5 bills)
            if (tens > 0 && fives > 0) {
                tens--;
                fives--;
            } else if (fives >= 3) {
                fives -= 3;
            } else {
                return false;
            }
        }
    }
    return true;
}
```

---

## Greedy vs DP <a name="greedy-vs-dp"></a>

### When to Use Which?

```
┌─────────────────────────────────────────────────────────────────┐
│                  GREEDY vs DYNAMIC PROGRAMMING                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GREEDY                       │  DYNAMIC PROGRAMMING            │
│  ─────────────────────────────┼───────────────────────────────  │
│  Makes ONE choice at each     │  Considers ALL choices at each  │
│  step, never reconsiders      │  step, picks best via recursion │
│                               │                                 │
│  O(n) or O(n log n) usually   │  O(n²) or O(n³) typically       │
│                               │                                 │
│  Doesn't always work          │  Always gives optimal (if       │
│                               │  correct recurrence)            │
│                               │                                 │
│  Examples:                    │  Examples:                      │
│  - Activity Selection         │  - 0/1 Knapsack                 │
│  - Huffman Coding             │  - Longest Common Subsequence   │
│  - Dijkstra's Algorithm       │  - Edit Distance                │
│  - Fractional Knapsack        │  - Matrix Chain Multiplication  │
│                               │                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Same Problem, Different Approaches

```java
// COIN CHANGE - Can be Greedy (sometimes) or DP (always)

// Greedy (only works for specific coin systems like US coins)
public int greedyCoinChange(int[] coins, int amount) {
    Arrays.sort(coins);
    int count = 0;
    for (int i = coins.length - 1; i >= 0 && amount > 0; i--) {
        count += amount / coins[i];
        amount %= coins[i];
    }
    return amount == 0 ? count : -1;  // Might fail!
}

// DP (always works)
public int dpCoinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
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
```

---

## Practice Problems <a name="practice-problems"></a>

### Easy 🟢
| Problem | Type | Key Insight |
|---------|------|-------------|
| Assign Cookies | Matching | Sort both, greedy match |
| Lemonade Change | Simulation | Prefer $10 change |
| Best Time to Buy/Sell Stock II | Array | Capture every up |
| Can Place Flowers | Array | Check neighbors |
| Maximum Units on Truck | Sorting | Sort by units/box |

### Medium 🟡
| Problem | Type | Key Insight |
|---------|------|-------------|
| Jump Game I/II | Array | Track farthest |
| Gas Station | Circular | Track running sum |
| Non-overlapping Intervals | Intervals | Sort by end |
| Meeting Rooms II | Intervals | Event processing |
| Partition Labels | String | Last occurrence |
| Task Scheduler | Scheduling | Max frequency formula |
| Boats to Save People | Two pointer | Pair heaviest + lightest |
| Queue Reconstruction | Sorting | Tall first, insert at k |
| Container With Most Water | Two pointer | Move shorter |

### Hard 🔴
| Problem | Type | Key Insight |
|---------|------|-------------|
| Candy | Two pass | L→R then R→L |
| Create Maximum Number | Stack | Monotonic stack |
| IPO | Heap | Max profit affordable |
| Minimum Number of Refueling Stops | Heap | Collect fuel options |
| Course Schedule III | Sorting + Heap | Replace longer courses |

---

## Quick Reference

### Greedy Choice Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│               COMMON GREEDY STRATEGIES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SORT BY END TIME                                            │
│     → Max non-overlapping intervals                             │
│     → Activity selection                                        │
│                                                                 │
│  2. SORT BY START TIME                                          │
│     → Merge intervals                                           │
│     → Cover range with min intervals                            │
│                                                                 │
│  3. SORT BY RATIO (value/weight)                                │
│     → Fractional knapsack                                       │
│                                                                 │
│  4. SORT BY ONE, SECONDARY BY ANOTHER                           │
│     → Job scheduling (profit desc, deadline)                    │
│     → Queue reconstruction (height desc, k asc)                 │
│                                                                 │
│  5. TWO POINTERS (heaviest + lightest)                          │
│     → Boat problem                                              │
│     → Two sum variants                                          │
│                                                                 │
│  6. TRACK FARTHEST/EARLIEST ENDING                              │
│     → Jump game                                                 │
│     → Interval covering                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Common Mistakes to Avoid

```
❌ Assuming greedy works without proof
   → Test with counterexamples first

❌ Wrong sorting criteria
   → End time for selection, start time for merging

❌ Not handling edge cases
   → Empty input, single element, all same elements

❌ Integer overflow in comparisons
   → Use Integer.compare(a, b) instead of a - b

❌ Forgetting to update tracking variables
   → Always update end/farthest after making choice
```

---

**Master These 3 Greedy Patterns:**

```
╔═══════════════════════════════════════════════════════════════╗
║     GREEDY ESSENTIALS                                         ║
╠═══════════════════════════════════════════════════════════════╣
║  1. INTERVAL SELECTION: Sort by end time, pick earliest       ║
║                                                               ║
║  2. INTERVAL MERGING: Sort by start time, extend end          ║
║                                                               ║
║  3. TWO POINTER: Sort both, match greedily                    ║
╚═══════════════════════════════════════════════════════════════╝
```

**Pro Tip:** If greedy doesn't work for a problem, try DP. If you can prove the greedy choice property (exchange argument), greedy is usually faster!


---

> **Navigation**: [< Previous](11_Backtracking_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_String_Algorithms_Complete.md)