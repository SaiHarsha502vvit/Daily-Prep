# Greedy

> **Navigation**: [← Shortest Path Problems](31_Shortest_Path_Problems.md) | [Chapter index](00_INDEX.md) | [Interval Problems →](26_Interval_Problems.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Greedy Algorithms](../03_Algorithms/12_Greedy_Algorithms_Complete.md), [Intervals pattern](../04_Patterns_Templates/21_Intervals_Pattern.md) |
| **You will learn** | Interval scheduling, jump game, gas station, assignment and exchange-argument proofs |
| **Leads to** | [Interval problems](26_Interval_Problems.md), [Dynamic Programming](11_Dynamic_Programming.md) |
| **Abstraction level** | Try all choices → **commit to the locally best choice and prove it safe** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Greedy Problems

### 1. The bottom line

A greedy algorithm is correct only if the locally best choice never ruins the global optimum — prove it with an exchange argument.

### 2. The textbook core

- Sort by the right key (finish time, ratio, deadline).
- Prove with an exchange argument.
- Counter-examples: coin change with `{1,3,4}`.
- If greedy fails, use DP.
- Often `O(n log n)` from sorting.

### 3. The real-world analogy

Choosing **the next train that leaves soonest** to catch as many connections as possible.

### 4. Walkthrough

1. Maximum non-overlapping intervals in `[[1,3],[2,4],[3,5]]`.
2. Sort by end: `[1,3],[2,4],[3,5]`.
3. Take `[1,3]`; skip `[2,4]` (overlaps); take `[3,5]`.
4. Answer 2.

> [!NOTE]
> **Quick check:** Why sort by finish time? *The earliest finish leaves the most room for the rest.*


### 5. Check yourself

**Q1.** Can you reach the last index in `[2,3,1,1,4]`? In `[3,2,1,0,4]`?

<details><summary>Answer</summary>

Yes; no (you always get stuck at index 3 whose jump is 0). Track the farthest reachable index.

</details>

**Q2.** Why does greedy fail for coins `{1,3,4}` and amount 6?

<details><summary>Answer</summary>

It takes 4+1+1 (3 coins) but 3+3 (2 coins) is optimal.

</details>

---


## 🗺️ Pattern Recognition Header — Greedy

**Is this a Greedy problem?** Ask: _"Can I make the locally best choice and never look back?"_

| Signal Words / Problem Type       | Greedy Strategy                             | Key Sort            |
| --------------------------------- | ------------------------------------------- | ------------------- |
| `intervals / meetings / schedule` | Sort by END time, pick non-overlapping      | `(a,b) → a[1]-b[1]` |
| `merge intervals / cover ranges`  | Sort by START time, extend current          | `(a,b) → a[0]-b[0]` |
| `min intervals to remove`         | Sort by end, count overlapping with lastEnd | end time            |
| `can reach end / jump game`       | Track `farthest`, scan L→R                  | none (array scan)   |
| `task scheduler / cooldown`       | Schedule most-frequent first                | max-heap by freq    |
| `connect sticks / minimize cost`  | Always merge smallest first (Huffman)       | min-heap            |
| `assign to groups / fractional`   | Sort both sides, match greedily             | value/weight        |

**⚠️ Greedy vs DP Decision:**

```
CAN find a counterexample where local-best ≠ global-best? → Use DP
ALL local-best choices lead to global best (exchange argument holds)? → Greedy

WORKS:   Interval select, Jump Game, Huffman, Dijkstra, MST
FAILS:   0/1 Knapsack, Coin Change (arbitrary), LIS, Edit Distance
```

📖 **Mental Model:** [11_Greedy_vs_DP_Decision.md](../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
📖 **Complexity Guide:** [09_Complexity_Intuition.md](../14_Mental_Models/09_Complexity_Intuition.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Greedy**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?

<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 📚 SECTION 12: GREEDY ALGORITHMS

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Greedy Fundamentals](13_Greedy/01_greedy_fundamentals.md) | Greedy Fundamentals · WHY Greedy — The Algorithm That Feels Like… · Why Greedy Problems Are Tricky (And Important) · The Mental Model: "Sort + Scan + Never Look… | 251 |
| 2 | [12.1 Interval Problems](13_Greedy/02_interval_problems.md) | 12.1 Interval Problems | 245 |
| 3 | [12.2 Array Greedy](13_Greedy/03_array_greedy.md) | 12.2 Array Greedy | 206 |
| 4 | [12.3 String Greedy](13_Greedy/04_string_greedy.md) | 12.3 String Greedy · 12.4 Math Greedy · Competitive Programming — Codeforces Problems · Real-World Applications of Greedy Algorithms | 303 |

## 🏢 Enterprise Lens — Greedy Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Schedulers, compression (Huffman), allocation heuristics |
| **Failure modes** | Using greedy where a counter-example exists |
| **Testing and verification** | Brute force over subsets for small `n` |

---

## Reality Check

**"Greedy practice builds greedy instinct"** — Unchecked, it builds greedy OVERCONFIDENCE — the most expensive interview failure mode, because wrong greedy code looks clean and passes samples. The practice loop that works: for every greedy attempt, either sketch the exchange argument (swapping any deviation toward my choice never worsens) or hunt a 4-element counterexample for two minutes. Jump-game, gas-station, and task-scheduler all have one-line exchange arguments; problems like coin-change with arbitrary denominations have famous counterexamples. Practicing both verdicts is the point.

**"Sort by the obvious key and greed follows"** — Key CHOICE is the whole problem in half the set: intervals by end (not start) for max-non-overlapping, boats by pairing lightest-with-heaviest after sorting, queue-reconstruction by height DESC then k ASC with insert-at-index — each key choice carries the proof, and the plausible-but-wrong key fails specific inputs. When a greedy stalls, the first suspect is the sort key, not the loop.

**"Jump Game II needs careful pointer bookkeeping"** — It reads cleanest as IMPLICIT BFS: current reach is this level's frontier, farthest-seen is next level's, jumps count levels. That reframing eliminates the fencepost bugs of the pointer version and transfers directly to its cousins (minimum-refuels as levels of station choices). Recognizing when a greedy is secretly a BFS-on-levels is one of the quieter senior tells.

**"Candy and queue-reconstruction are one-off puzzles"** — They are the two canonical CONFLICTING-CONSTRAINTS techniques: candy resolves left-neighbor and right-neighbor constraints with two directional passes taking max; queue-reconstruction resolves height and count constraints by ordering one constraint then inserting to satisfy the other. Both moves — decompose-into-directional-passes and sort-one-insert-other — recur across scheduling and ranking problems; filing them as one-offs wastes the two most reusable tricks in the chapter.

**"If greedy passes all tests, the proof is academic"** — Judge acceptance is evidence, not proof — hidden tests share blind spots, and production inputs will not. The two-minute proof habit pays twice: in interviews, articulating WHY (exchange argument) is scored above the code itself; in production, greedy heuristics without correctness notes become load-bearing folklore nobody dares touch. Every greedy in this chapter deserves one sentence of why, written down.
